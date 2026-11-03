import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BookingService } from '../services/bookingService.js';
import { bookingRoutes } from './bookingRoutes.js';
import { ReportService } from '../services/reportService.js';
import { reportRoutes } from './reportRoutes.js';
import { BarService } from '../services/barService.js';
import { barRoutes } from './barRoutes.js';

export async function createApp(repository, reportRepository, barRepository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  const contract = JSON.parse(await readFile(new URL('../../openapi.json', import.meta.url), 'utf8'));
  app.get('/api/openapi.json', (_req, res) => res.json(contract));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(contract, { customSiteTitle: 'Hotel Kong Arthur · Operations API' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', bookingRoutes(new BookingService(repository), repository));
  app.use('/api', reportRoutes(new ReportService(reportRepository)));
  app.use('/api', barRoutes(new BarService(barRepository)));
  app.use('/api', (_req, res) => res.status(404).json({ code: 'ENDPOINT_NOT_FOUND', message: 'API endpoint not found' }));
  app.get(['/staff','/staff/'], (_req,res) => res.sendFile(fileURLToPath(new URL('../../../frontend/staff.html', import.meta.url))));
  app.get(['/guest','/guest/'], (_req,res) => res.redirect('/'));
  app.use(express.static(fileURLToPath(new URL('../../../frontend/', import.meta.url))));
  app.use((_req, res) => res.status(404).send('Page not found'));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ code: 'INVALID_JSON', message: 'Request body must be valid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ code: 'REQUEST_TOO_LARGE', message: 'Request body exceeds 64 KB.' });
    if (error.status && error.code) return res.status(error.status).json({ code: error.code, message: error.message });
    console.error('Request failed:', error.code || error.name);
    return res.status(503).json({ code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable. Please retry.' });
  });
  return app;
}
