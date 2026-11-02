import pg from 'pg';

// Keep calendar dates as YYYY-MM-DD and exact NUMERIC money as strings at the API boundary.
const types = { getTypeParser: (oid, format) => oid === 1082 ? value => value : oid === 20 ? value => { const number = Number(value); if (!Number.isSafeInteger(number)) throw new RangeError('Database integer exceeds the safe JSON range.'); return number; } : pg.types.getTypeParser(oid, format) };
export function createPool(overrides = {}) {
  return new pg.Pool({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5433),
    user: process.env.POSTGRES_USER || 'hotel_user', password: process.env.POSTGRES_PASSWORD || 'hotel_local_password',
    database: process.env.POSTGRES_DB || 'hotel_kong_arthur', max: 10,
    types, ...overrides
  });
}
