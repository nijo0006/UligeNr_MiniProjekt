import { Router } from 'express';
import { badInput } from '../services/errors.js';
export function satisfactionRoutes(service){
  const router=Router();
  router.post('/satisfaction',async(req,res)=>res.status(201).json(await service.record(req.body)));
  router.get('/reports/satisfaction',async(req,res)=>{
    if (Object.keys(req.query).some(key=>key!=='groupBy')) throw badInput('Satisfaction is an all-time report; no year filter is supported.');
    res.json(await service.report(req.query.groupBy));
  });
  return router;
}
