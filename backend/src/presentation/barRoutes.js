import { Router } from 'express';
export function barRoutes(service) {
  const router=Router();
  router.get('/drinks',async (_req,res)=>res.json(await service.catalog()));
  router.get('/bar-sales',async (req,res)=>res.json(await service.daily(req.query.date)));
  router.put('/bar-sales/:salesDate/:drinkId',async (req,res)=>res.json(await service.save(req.params.salesDate,req.params.drinkId,req.body)));
  router.get('/reports/bar',async (req,res)=>res.json(await service.annual(req.query.year)));
  return router;
}
