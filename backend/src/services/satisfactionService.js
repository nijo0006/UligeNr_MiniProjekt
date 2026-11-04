import { AppError, badInput } from './errors.js';

export class SatisfactionService {
  constructor(repository){this.repository=repository;}
  token(value){
    if(typeof value!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(value))throw questionnaireNotFound();
    return value;
  }
  async questionnaire(token){
    const result=await this.repository.questionnaire(this.token(token));
    if(!result)throw questionnaireNotFound();
    return result;
  }
  async submitQuestionnaire(token,body){
    const ratings=body?.ratings??[];
    const valid=body&&!Array.isArray(body)&&typeof body==='object'&&Object.keys(body).every(key=>['ratings','wouldRecommend','overallRating'].includes(key))&&
      (body.wouldRecommend===undefined||typeof body.wouldRecommend==='boolean')&&
      (body.overallRating===undefined||(Number.isInteger(body.overallRating)&&body.overallRating>=1&&body.overallRating<=5))&&
      Array.isArray(ratings)&&(ratings.length>0||body.wouldRecommend!==undefined||body.overallRating!==undefined)&&
      ratings.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).every(key=>['roomNumber','rating'].includes(key))&&
        typeof r.roomNumber==='string'&&r.roomNumber&&r.roomNumber.length<=10&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5)&&
      new Set(ratings.map(r=>r.roomNumber)).size===ratings.length;
    const checked=this.token(token);
    if(!valid)throw badInput('Supply at least one of: overallRating (whole number 1–5), ratings (one whole-number rating from 1 to 5 per room on the booking) and wouldRecommend (true or false).');
    const result=await this.repository.submitQuestionnaire(checked,ratings,body.wouldRecommend,body.overallRating);
    if(result.error==='not_found')throw questionnaireNotFound();
    if(result.error==='unrelated_room')throw badInput('Rate only the rooms included in this stay.');
    if(result.error==='already_overall')throw new AppError(409,'ALREADY_ANSWERED','You have already rated your stay overall. Thank you!');
    if(result.error==='already_recommended')throw new AppError(409,'ALREADY_ANSWERED','You have already told us whether you would recommend us. Thank you!');
    if(result.error==='already_answered')throw new AppError(409,'ALREADY_ANSWERED',`Room ${result.roomNumber} has already been rated. Thank you!`);
    return result;
  }
  stayFeedback(){return this.repository.stayFeedback();}
  report(groupBy='room'){
    if(!['room','roomType'].includes(groupBy))throw badInput('Select groupBy=room or groupBy=roomType.');
    return this.repository.report(groupBy);
  }
}

const questionnaireNotFound=()=>new AppError(404,'QUESTIONNAIRE_NOT_FOUND','This questionnaire link is not valid.');
