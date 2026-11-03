import { Router } from 'express';
import { badInput } from '../services/errors.js';
export function satisfactionRoutes(service){
  const router=Router();
  router.get('/questionnaires/:token',async(req,res)=>res.json(await service.questionnaire(req.params.token)));
  router.post('/questionnaires/:token/responses',async(req,res)=>res.status(201).json(await service.submitQuestionnaire(req.params.token,req.body)));
  router.get('/reports/stay-feedback',async(_req,res)=>res.json(await service.stayFeedback()));
  router.get('/reports/satisfaction',async(req,res)=>{
    if (Object.keys(req.query).some(key=>key!=='groupBy')) throw badInput('Satisfaction is an all-time report; no year filter is supported.');
    res.json(await service.report(req.query.groupBy));
  });
  return router;
}
