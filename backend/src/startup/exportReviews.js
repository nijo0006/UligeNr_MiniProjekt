// Prints every questionnaire answer on the 1,000 historical bookings in the local
// database as demo-reviews.json. Run it through scripts/export-reviews.sh.
// Bookings created in the frontend are left out: their IDs differ between computers.
import { createPool } from '../data/pool.js';

const pool = createPool();
try {
  const { rows } = await pool.query(`SELECT split_part(b.source_id,':booking:',2)::integer AS "sourceBookingId",
      b.holder_first_name||' '||b.holder_last_name AS guest,
      (SELECT string_agg(DISTINCT r.room_type,', ') FROM booking_rooms br JOIN rooms r ON r.room_number=br.room_number WHERE br.booking_id=b.id) AS "roomType",
      (SELECT ROUND(AVG(s.rating))::integer FROM satisfaction_responses s WHERE s.booking_id=b.id AND s.source='questionnaire') AS "roomRating",
      i.overall_rating AS "overallRating", i.would_recommend AS "wouldRecommend"
    FROM satisfaction_invitations i JOIN bookings b ON b.id=i.booking_id
    WHERE b.source_id LIKE '%:booking:%' AND b.status<>'cancelled'
    ORDER BY 1`);
  const answered = rows.filter(r => r.roomRating !== null || r.overallRating !== null || r.wouldRecommend !== null);
  // One review per line keeps Git merges simple when several people add reviews.
  const lines = answered.map(r => '    ' + JSON.stringify(r));
  process.stdout.write(`{
  "about": "Demo reviews loaded into every local database on startup. Each review belongs to a historical booking (sourceBookingId 1-1000). guest and roomType are for reading only. Add more with scripts/export-reviews.sh.",
  "reviews": [
${lines.join(',\n')}
  ]
}
`);
} finally {
  await pool.end();
}
