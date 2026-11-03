import { Router } from 'express';

export function reportRoutes(service) {
  const router = Router();
  router.get('/reports/revenue', async (req, res) => res.json(await service.annualRevenue(req.query.year)));
  router.get('/reports/history',async (_req,res)=>res.json(await service.history()));
  router.get('/reports/summary', async (req,res)=>res.json(await service.summary(req.query.year)));
  router.get('/reports/countries', async (req,res)=>res.json(await service.countries(req.query.year)));
  router.get('/reports/rooms', async (req,res)=>res.json(await service.rooms(req.query.year)));
  router.get('/reports/room-types-seasons', async (req,res)=>res.json(await service.roomTypesSeasons(req.query.year)));
  router.get('/reports/inventory', async (_req,res)=>res.json(await service.inventory()));
  return router;
}
