import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { sourceBookingId } from './historyGenerator.js';

// Demo reviews are stored as normal questionnaire answers, so every report and the
// Tableau export include them. They are marked synthetic and use this placeholder address.
export const DEMO_REVIEW_EMAIL = 'demo-review@example.invalid';
const rating = value => value === null || (Number.isInteger(value) && value >= 1 && value <= 5);

export async function readDemoReviews() {
  const { reviews } = JSON.parse(await readFile(new URL('./demo-reviews.json', import.meta.url), 'utf8'));
  const seen = new Set();
  for (const review of reviews) {
    const id = review.sourceBookingId;
    if (!Number.isInteger(id) || id < 1 || id > 1000 || seen.has(id)) throw new Error(`demo-reviews.json: invalid or duplicate sourceBookingId ${id}.`);
    seen.add(id);
    if (!rating(review.roomRating) || !rating(review.overallRating)) throw new Error(`demo-reviews.json: ratings for booking ${id} must be whole numbers 1-5 or null.`);
    if (review.wouldRecommend !== null && typeof review.wouldRecommend !== 'boolean') throw new Error(`demo-reviews.json: wouldRecommend for booking ${id} must be true, false or null.`);
  }
  return reviews;
}

// Runs in the startup transaction after the historical import, on every start.
// A review is only added to a stay that has no questionnaire yet, so restarts add
// nothing twice and answers someone already gave through Mailpit are kept.
export async function importDemoReviews(connection) {
  const reviews = await readDemoReviews();
  for (const review of reviews) {
    const { rows: [booking] } = await connection.query(
      "SELECT id FROM bookings WHERE source_id=$1 AND status<>'cancelled'", [sourceBookingId(review.sourceBookingId)]);
    if (!booking) continue;
    const { rowCount } = await connection.query(`INSERT INTO satisfaction_invitations
        (booking_id,token,email,sent_at,overall_rating,overall_rated_at,would_recommend,recommended_at,synthetic)
      VALUES ($1,$2,$3,CURRENT_TIMESTAMP,$4::smallint,CASE WHEN $4::smallint IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
        $5::boolean,CASE WHEN $5::boolean IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,TRUE)
      ON CONFLICT (booking_id) DO NOTHING`,
    [booking.id, randomBytes(24).toString('base64url'), DEMO_REVIEW_EMAIL, review.overallRating, review.wouldRecommend]);
    if (!rowCount) continue;
    await connection.query(`UPDATE bookings SET status='completed',completed_at=departure::timestamptz,version=version+1
      WHERE id=$1 AND status='active'`, [booking.id]);
    if (review.roomRating !== null) await connection.query(`INSERT INTO satisfaction_responses (booking_id,room_number,rating,source,synthetic)
        SELECT booking_id,room_number,$2,'questionnaire',TRUE FROM booking_rooms WHERE booking_id=$1
      ON CONFLICT (booking_id,room_number) WHERE source='questionnaire' DO NOTHING`, [booking.id, review.roomRating]);
  }
}
