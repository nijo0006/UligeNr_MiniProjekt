import { readFile } from 'node:fs/promises';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function readDemoBookings() {
  const { bookings } = JSON.parse(await readFile(new URL('./demo-bookings.json', import.meta.url), 'utf8'));
  const seen = new Set();
  for (const b of bookings) {
    if (!UUID.test(b.sharedId) || seen.has(b.sharedId)) throw new Error(`demo-bookings.json: invalid or duplicate sharedId ${b.sharedId}.`);
    seen.add(b.sharedId);
    if (!['active', 'completed'].includes(b.status) || !b.rooms?.length || !b.roomNights?.length) throw new Error(`demo-bookings.json: booking ${b.sharedId} needs status active/completed, rooms and room nights.`);
  }
  return bookings;
}

// Runs in the startup transaction after the historical import, on every start.
// Adds each booking from the file once, by its shared ID, with its saved prices.
// Bookings that already exist here are not changed, so edits made after a booking
// was shared do not reach other computers. A booking whose room is already taken
// on this computer is skipped with a warning instead of creating a double booking.
export async function importDemoBookings(connection) {
  const bookings = await readDemoBookings();
  for (const b of bookings) {
    const { rows: existing } = await connection.query('SELECT 1 FROM bookings WHERE shared_id=$1', [b.sharedId]);
    if (existing.length) continue;
    const rooms = b.rooms.map(r => r.roomNumber);
    const { rows: [check] } = await connection.query(`SELECT
        (SELECT COUNT(*)::integer FROM rooms WHERE room_number=ANY($1)) AS "knownRooms",
        EXISTS (SELECT 1 FROM countries WHERE name=$2) AS "knownCountry",
        (SELECT string_agg(DISTINCT br.room_number,', ') FROM booking_rooms br JOIN bookings o ON o.id=br.booking_id
          WHERE br.room_number=ANY($1) AND o.status<>'cancelled' AND o.arrival<$4::date AND o.departure>$3::date) AS taken`,
    [rooms, b.holderCountry, b.arrival, b.departure]);
    const skip = check.knownRooms !== rooms.length ? 'unknown room' : !check.knownCountry ? 'unknown country' : check.taken ? `room ${check.taken} is already booked` : null;
    if (skip) { console.warn(`Shared booking ${b.sharedId} (${b.holderFirstName} ${b.holderLastName}) skipped: ${skip}.`); continue; }
    const { rows: [{ id }] } = await connection.query(`INSERT INTO bookings
        (shared_id,holder_first_name,holder_last_name,holder_email,holder_country,guest_count,arrival,departure,nights,status,completed_at,total_price,pricing_mode)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [b.sharedId, b.holderFirstName, b.holderLastName, b.holderEmail, b.holderCountry, b.guestCount, b.arrival, b.departure, b.nights,
      b.status, b.completedAt, b.totalPrice, b.pricingMode]);
    for (const r of b.rooms) await connection.query('INSERT INTO booking_rooms (booking_id,room_number,room_total) VALUES ($1,$2,$3)', [id, r.roomNumber, r.total]);
    for (const n of b.roomNights) await connection.query('INSERT INTO room_nights (booking_id,room_number,night_date,season,exact_charge) VALUES ($1,$2,$3,$4,$5)', [id, n.roomNumber, n.date, n.season, n.charge]);
    for (const g of b.guests ?? []) await connection.query('INSERT INTO booking_guests (booking_id,first_name,last_name) VALUES ($1,$2,$3)', [id, g.firstName, g.lastName]);
  }
}
