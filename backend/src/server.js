import { SatisfactionRepository } from './data/satisfactionRepository.js';
import { BarRepository } from './data/barRepository.js';
import { createPool } from './data/pool.js';
import { BookingRepository } from './data/bookingRepository.js';
import { ReportRepository } from './data/reportRepository.js';
import { initialize } from './startup/initialize.js';
import { createApp } from './presentation/app.js';

const pool = createPool();
try {
  await initialize(pool);
  const app = await createApp(new BookingRepository(pool), new ReportRepository(pool), new BarRepository(pool), new SatisfactionRepository(pool));
  const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Hotel booking application ready on port 3000.'));
  async function shutdown() {
    server.close(async () => { await pool.end(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  }
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
} catch (error) {
  console.error('Application initialization failed:', error.code || error.message);
  await pool.end();
  process.exitCode = 1;
}
