import { readFile } from 'node:fs/promises';

export async function initialize(pool) {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [[lock]] = await connection.execute("SELECT GET_LOCK('hotel_application_startup_v1', 30) AS acquired");
    if (lock.acquired !== 1) throw new Error('Another application startup is still initializing the database.');
    locked = true;
    const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await connection.query(statement);
    const [applied] = await connection.execute('SELECT version FROM schema_migrations WHERE version = ?', ['booking-catalog-v1']);
    if (!applied.length) {
      const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));
      const inventory = JSON.parse(await readFile(new URL('../../../specs/001-hotel-operations/fixtures/room-inventory.json', import.meta.url), 'utf8'));
      if (inventory.rooms.length !== 214 || new Set(inventory.rooms.map(r => r.roomNumber)).size !== 214 || catalog.rates.length !== 24) throw new Error('Invalid versioned seed catalog.');
      await connection.beginTransaction();
      try {
        for (const name of new Set(inventory.rooms.map(r => r.roomType))) await connection.execute('INSERT INTO room_types (name) VALUES (?)', [name]);
        for (const name of catalog.countries) await connection.execute('INSERT INTO countries (name) VALUES (?)', [name]);
        for (const rate of catalog.rates) await connection.execute('INSERT INTO seasonal_rates (room_type, season, nightly_price) VALUES (?, ?, ?)', [rate.roomType, rate.season, rate.nightlyPrice]);
        for (const room of inventory.rooms) await connection.execute('INSERT INTO rooms (room_number, room_type, synthetic) VALUES (?, ?, TRUE)', [room.roomNumber, room.roomType]);
        await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', ['booking-catalog-v1']);
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; }
    }
    const [countryRevision] = await connection.execute('SELECT version FROM schema_migrations WHERE version = ?', ['country-catalog-v2']);
    if (!countryRevision.length) {
      const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));
      await connection.beginTransaction();
      try {
        for (const name of catalog.countries) await connection.execute('INSERT INTO countries (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name', [name]);
        await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', ['country-catalog-v2']);
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; }
    }
  } finally {
    if (locked) await connection.query("SELECT RELEASE_LOCK('hotel_application_startup_v1')");
    connection.release();
  }
}
