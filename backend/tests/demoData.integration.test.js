import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPool } from '../src/data/pool.js';
import { initialize } from '../src/startup/initialize.js';
import { readDemoBookings } from '../src/startup/demoBookings.js';
import { readDemoReviews } from '../src/startup/demoReviews.js';
if (!process.env.POSTGRES_DB?.endsWith('_test')) throw new Error('Demo data checks require an isolated _test database.');

// Each test gets a fresh schema, like a new computer with an empty database.
const admin = createPool();
const schemas = [];
async function freshDatabase() {
  const name = 'demo_test_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE SCHEMA ${name}`);
  const pool = createPool({ options: `-c search_path=${name}` });
  schemas.push({ name, pool });
  return pool;
}
after(async () => {
  for (const { name, pool } of schemas) { await pool.end(); await admin.query(`DROP SCHEMA ${name} CASCADE`); }
  await admin.end();
});

async function counts(pool) {
  const { rows: [row] } = await pool.query(`SELECT
    (SELECT COUNT(*)::integer FROM bookings WHERE source_id IS NULL) AS "sharedBookings",
    (SELECT COUNT(*)::integer FROM satisfaction_invitations WHERE synthetic) AS reviews,
    (SELECT COUNT(*)::integer FROM satisfaction_responses WHERE synthetic) AS "roomRatings",
    (SELECT COUNT(*)::integer FROM bookings WHERE status='completed') AS completed`);
  return row;
}

test('a new database gets every shared booking and review once, with saved prices', async () => {
  const pool = await freshDatabase();
  const bookings = await readDemoBookings();
  const reviews = await readDemoReviews();
  await initialize(pool);
  const first = await counts(pool);
  assert.equal(first.sharedBookings, bookings.length);
  assert.equal(first.reviews, reviews.length);
  for (const b of bookings) {
    const { rows: [saved] } = await pool.query(`SELECT b.total_price::text AS total, b.status,
        (SELECT COUNT(*)::integer FROM room_nights n WHERE n.booking_id=b.id) AS nights
      FROM bookings b WHERE b.shared_id=$1`, [b.sharedId]);
    assert.deepEqual(saved, { total: b.totalPrice, status: b.status, nights: b.roomNights.length });
  }
  await initialize(pool);
  assert.deepEqual(await counts(pool), first, 'a restart adds nothing twice');
});

test('a shared booking whose room is already taken is skipped instead of double-booked', async () => {
  const [shared] = await readDemoBookings();
  if (!shared) return;
  const pool = await freshDatabase();
  await initialize(pool, { history: false });
  const { rows: [{ id }] } = await pool.query(`INSERT INTO bookings (holder_first_name,holder_last_name,holder_country,arrival,departure,nights,total_price)
    VALUES ('Local','Guest',$1,$2,$3,$4,$5) RETURNING id`, [shared.holderCountry, shared.arrival, shared.departure, shared.nights, shared.totalPrice]);
  await pool.query('INSERT INTO booking_rooms (booking_id,room_number,room_total) VALUES ($1,$2,$3)', [id, shared.rooms[0].roomNumber, shared.totalPrice]);
  await initialize(pool);
  const { rows } = await pool.query('SELECT 1 FROM bookings WHERE shared_id=$1', [shared.sharedId]);
  assert.equal(rows.length, 0);
  const { rows: [local] } = await pool.query('SELECT holder_first_name AS name FROM bookings WHERE id=$1', [id]);
  assert.equal(local.name, 'Local', 'the local booking is kept');
});
