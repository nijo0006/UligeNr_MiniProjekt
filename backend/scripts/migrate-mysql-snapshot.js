// One-time migration of a private JSON snapshot; never reads or resets the old volume.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createPool } from '../src/data/pool.js';
import { initialize } from '../src/startup/initialize.js';

const tables = {
  countries: ['name'], room_types: ['name'],
  rooms: ['room_number','room_type','synthetic'],
  seasonal_rates: ['room_type','season','nightly_price'],
  bookings: ['id','holder_first_name','holder_last_name','holder_country','guest_count','arrival','departure','nights','status','version','total_price','synthetic_dates','synthetic_room_assignment','source_id'],
  booking_guests: ['id','booking_id','first_name','last_name'],
  booking_rooms: ['booking_id','room_number','room_total'],
  room_nights: ['booking_id','room_number','night_date','season','exact_charge']
};
const keys = { countries:['name'],room_types:['name'],rooms:['room_number'],seasonal_rates:['room_type','season'] };
const booleans = new Set(['synthetic','synthetic_dates','synthetic_room_assignment']);
const money = new Set(['nightly_price','total_price','room_total','exact_charge']);
function exactMoney(value) {
  const text = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Invalid exact monetary value in snapshot.');
  const [whole, fraction = ''] = text.split('.');
  return whole + '.' + fraction.padEnd(2,'0');
}
function normalize(row, columns) {
  return Object.fromEntries(columns.map(c => [c, row[c] === null ? null : booleans.has(c) ? Boolean(row[c]) : money.has(c) ? exactMoney(row[c]) : row[c]]));
}
const path = process.argv[2];
if (!path) throw new Error('Provide the private JSON snapshot path.');
const source = JSON.parse(await readFile(path,'utf8'));
for (const table of Object.keys(tables)) if (!Array.isArray(source[table])) throw new Error(`Missing snapshot table: ${table}`);
const pool = createPool();
let client;
try {
  await initialize(pool);
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query('LOCK TABLE bookings IN ACCESS EXCLUSIVE MODE');
  const { rows } = await client.query('SELECT COUNT(*)::integer AS count FROM bookings');
  if (rows[0].count !== 0) throw new Error('Migration requires an empty target booking database; existing data will not be overwritten.');
  for (const [table, columns] of Object.entries(tables)) {
    for (const row of source[table]) {
      for (const c of columns) if (!(c in row)) throw new Error(`Missing snapshot field: ${table}.${c}`);
      const values = normalize(row, columns);
      const conflict = keys[table] ? ` ON CONFLICT (${keys[table].join(',')}) DO UPDATE SET ${columns.map(c=>`${c}=EXCLUDED.${c}`).join(',')}` : '';
      await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})${conflict}`, columns.map(c=>values[c]));
    }
    const current = await client.query(`SELECT ${columns.join(',')} FROM ${table}`);
    const canonical = list => list.map(row=>JSON.stringify(normalize(row,columns))).sort();
    assert.deepEqual(canonical(current.rows),canonical(source[table]),`Snapshot mismatch in ${table}`);
  }
  for (const table of ['bookings','booking_guests']) {
    await client.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE(MAX(id),1), MAX(id) IS NOT NULL) FROM ${table}`);
  }
  await client.query('COMMIT');
  console.log('Migration verified and committed:', Object.fromEntries(Object.keys(tables).map(t=>[t,source[t].length])));
} catch (error) {
  if (client) await client.query('ROLLBACK');
  // Avoid printing source rows/guest names from failed assertions.
  console.error('Migration failed:', error.code || (error instanceof assert.AssertionError ? 'Snapshot verification mismatch' : error.message));
  process.exitCode=1;
} finally {
  client?.release();
  await pool.end();
}
