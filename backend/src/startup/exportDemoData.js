// Prints the local database's shared demo data as JSON. Run it through
// scripts/export-demo-data.sh, which writes demo-bookings.json and demo-reviews.json.
//   node src/startup/exportDemoData.js bookings < demo-bookings.json
//   node src/startup/exportDemoData.js reviews  < demo-reviews.json
// The current file is read from stdin and everything in it is kept, so an export never
// removes someone else's data, even if it is missing from this database. Records in the
// database replace the file's copy. Cancelled bookings are not added; to remove a
// shared booking, delete its line by hand. One record per line keeps Git merges simple.
import { createPool } from '../data/pool.js';

async function currentFile(key) {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text.trim() ? JSON.parse(text)[key] ?? [] : [];
}

// Database records win; file records that are not in the database are kept.
function merge(fromFile, fromDatabase, keyOf) {
  const merged = new Map(fromFile.map(r => [keyOf(r), r]));
  for (const r of fromDatabase) merged.set(keyOf(r), r);
  return [...merged.values()];
}

// Two shared bookings on the same room and dates cannot both be loaded on one computer.
function warnAboutOverlaps(bookings) {
  for (let i = 0; i < bookings.length; i++) for (let j = i + 1; j < bookings.length; j++) {
    const [a, b] = [bookings[i], bookings[j]];
    const rooms = a.rooms.map(r => r.roomNumber).filter(room => b.rooms.some(r => r.roomNumber === room));
    if (rooms.length && a.arrival < b.departure && b.arrival < a.departure) {
      console.error(`Warning: ${a.holderFirstName} ${a.holderLastName} and ${b.holderFirstName} ${b.holderLastName} both book room ${rooms.join(', ')} on overlapping dates. Only one of them can be loaded on each computer. Change one of them.`);
    }
  }
}

const BOOKINGS_ABOUT = 'Bookings made in the frontend, loaded into every local database on startup. Each booking is added once by its sharedId; later edits are not synced. A booking whose room is already taken on a computer is skipped there. Add more with scripts/export-demo-data.sh.';
const REVIEWS_ABOUT = 'Demo reviews loaded into every local database on startup. Each review belongs to a historical booking (sourceBookingId 1-1000) or a shared frontend booking (sharedBookingId). guest and roomType are for reading only. Add more with scripts/export-demo-data.sh.';

const write = (about, key, rows) => process.stdout.write(`{
  "about": ${JSON.stringify(about)},
  "${key}": [
${rows.map(row => '    ' + JSON.stringify(row)).join(',\n')}
  ]
}
`);

async function bookings(pool) {
  const { rows } = await pool.query(`SELECT b.shared_id::text AS "sharedId",
      b.holder_first_name AS "holderFirstName", b.holder_last_name AS "holderLastName", b.holder_email AS "holderEmail",
      b.holder_country AS "holderCountry", b.guest_count AS "guestCount", b.arrival, b.departure, b.nights,
      b.status, b.completed_at AS "completedAt", b.total_price::text AS "totalPrice", b.pricing_mode AS "pricingMode",
      (SELECT json_agg(json_build_object('roomNumber',r.room_number,'total',r.room_total::text) ORDER BY r.room_number)
        FROM booking_rooms r WHERE r.booking_id=b.id) AS rooms,
      (SELECT json_agg(json_build_object('roomNumber',n.room_number,'date',n.night_date::text,'season',n.season,'charge',n.exact_charge::text) ORDER BY n.room_number,n.night_date)
        FROM room_nights n WHERE n.booking_id=b.id) AS "roomNights",
      (SELECT COALESCE(json_agg(json_build_object('firstName',g.first_name,'lastName',g.last_name) ORDER BY g.id),'[]'::json)
        FROM booking_guests g WHERE g.booking_id=b.id) AS guests
    FROM bookings b WHERE b.source_id IS NULL AND b.status<>'cancelled'
    ORDER BY b.arrival, b.shared_id`);
  const bookings = merge(await currentFile('bookings'), rows, b => b.sharedId)
    .sort((a, b) => a.arrival.localeCompare(b.arrival) || a.sharedId.localeCompare(b.sharedId));
  warnAboutOverlaps(bookings);
  write(BOOKINGS_ABOUT, 'bookings', bookings);
}

async function reviews(pool) {
  const { rows } = await pool.query(`SELECT b.source_id, b.shared_id::text AS shared,
      b.holder_first_name||' '||b.holder_last_name AS guest,
      (SELECT string_agg(DISTINCT r.room_type,', ') FROM booking_rooms br JOIN rooms r ON r.room_number=br.room_number WHERE br.booking_id=b.id) AS "roomType",
      (SELECT json_object_agg(s.room_number,s.rating::integer ORDER BY s.room_number) FROM satisfaction_responses s
        WHERE s.booking_id=b.id AND s.source='questionnaire') AS ratings,
      i.overall_rating AS "overallRating", i.would_recommend AS "wouldRecommend"
    FROM satisfaction_invitations i JOIN bookings b ON b.id=i.booking_id
    WHERE b.status<>'cancelled' AND (b.source_id LIKE '%:booking:%' OR b.source_id IS NULL)`);
  const fromDatabase = rows
    .filter(r => r.ratings !== null || r.overallRating !== null || r.wouldRecommend !== null)
    .map(r => {
      const common = { guest: r.guest, roomType: r.roomType };
      const answers = { overallRating: r.overallRating, wouldRecommend: r.wouldRecommend };
      // Historical bookings have one room, so a single roomRating is enough there.
      if (r.source_id) return { sourceBookingId: Number(r.source_id.split(':booking:')[1]), ...common, roomRating: r.ratings ? Object.values(r.ratings)[0] : null, ...answers };
      return { sharedBookingId: r.shared, ...common, roomRatings: r.ratings ?? {}, ...answers };
    });
  const keyOf = r => r.sourceBookingId !== undefined ? `source:${r.sourceBookingId}` : `shared:${r.sharedBookingId}`;
  const output = merge(await currentFile('reviews'), fromDatabase, keyOf)
    .sort((a, b) => (a.sourceBookingId ?? Infinity) - (b.sourceBookingId ?? Infinity) || String(a.sharedBookingId).localeCompare(String(b.sharedBookingId)));
  write(REVIEWS_ABOUT, 'reviews', output);
}

const pool = createPool();
try {
  const kind = process.argv[2];
  if (kind === 'bookings') await bookings(pool);
  else if (kind === 'reviews') await reviews(pool);
  else throw new Error('Usage: node src/startup/exportDemoData.js bookings|reviews');
} finally {
  await pool.end();
}
