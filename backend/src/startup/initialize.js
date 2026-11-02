import { readFile } from 'node:fs/promises';
import { importHistoricalData } from './import.js';

export async function initialize(pool, { history = true } = {}) {
  const connection = await pool.connect();
  let transaction = false;
  try {
    await connection.query('BEGIN');
    transaction = true;
    await connection.query("SELECT pg_advisory_xact_lock(718205419)");
    const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await connection.query(statement);
    const { rows: applied } = await connection.query('SELECT version FROM schema_migrations WHERE version = $1', ['booking-catalog-v1']);
    if (!applied.length) {
      const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));
      const inventory = JSON.parse(await readFile(new URL('../../../specs/001-hotel-operations/fixtures/room-inventory.json', import.meta.url), 'utf8'));
      if (inventory.rooms.length !== 214 || new Set(inventory.rooms.map(r => r.roomNumber)).size !== 214 || catalog.rates.length !== 24) throw new Error('Invalid versioned seed catalog.');

      for (const name of new Set(inventory.rooms.map(r => r.roomType))) await connection.query('INSERT INTO room_types (name) VALUES ($1)', [name]);
      for (const name of catalog.countries) await connection.query('INSERT INTO countries (name) VALUES ($1)', [name]);
      for (const rate of catalog.rates) await connection.query('INSERT INTO seasonal_rates (room_type, season, nightly_price) VALUES ($1, $2, $3)', [rate.roomType, rate.season, rate.nightlyPrice]);
      for (const room of inventory.rooms) await connection.query('INSERT INTO rooms (room_number, room_type, synthetic) VALUES ($1, $2, TRUE)', [room.roomNumber, room.roomType]);
      await connection.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['booking-catalog-v1']);
    }
    const { rows: countryRevision } = await connection.query('SELECT version FROM schema_migrations WHERE version = $1', ['country-catalog-v2']);
    if (!countryRevision.length) {
      const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));

      for (const name of catalog.countries) await connection.query('INSERT INTO countries (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
      await connection.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['country-catalog-v2']);
    }
    const { rows: barSeed } = await connection.query('SELECT version FROM schema_migrations WHERE version=$1', ['source-drink-menu-v1']);
    if (!barSeed.length) {
      const { drinks } = JSON.parse(await readFile(new URL('./drinks.json', import.meta.url), 'utf8'));
      if (drinks.length !== 30) throw new Error('Invalid source drink menu.');
      for (const drink of drinks) await connection.query('INSERT INTO drinks (id,name,category,unit_price) VALUES ($1,$2,$3,$4)', [drink.drinkId,drink.name,drink.category,drink.unitPrice]);
      await connection.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['source-drink-menu-v1']);
    }
    if (history) await importHistoricalData(connection);
    await connection.query('COMMIT');
    transaction = false;
  } catch (error) {
    if (transaction) await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
