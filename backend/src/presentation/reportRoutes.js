import { Router } from 'express';

export function reportRoutes(service) {
  const router = Router();
  router.get('/reports/revenue', async (req, res) => res.json(await service.annualRevenue(req.query.year)));
  router.get('/reports/history',async (_req,res)=>res.json(await service.history()));
  return router;
}
