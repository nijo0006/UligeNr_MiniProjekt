import mysql from 'mysql2/promise';
export function createPool(overrides = {}) {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3307),
    user: process.env.MYSQL_USER || 'hotel_user', password: process.env.MYSQL_PASSWORD || 'hotel_local_password',
    database: process.env.MYSQL_DATABASE || 'hotel_kong_arthur', connectionLimit: 10,
    dateStrings: true, timezone: 'Z', charset: 'utf8mb4', ...overrides
  });
}
