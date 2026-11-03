import { AppError, badInput } from './errors.js';

export class SatisfactionService {
  constructor(repository){this.repository=repository;}
  async record(body){
    if (!body || Array.isArray(body) || Object.keys(body).some(key=>!['bookingId','roomNumber','rating'].includes(key)) ||
      !Number.isInteger(body.bookingId) || body.bookingId<1 || body.bookingId>4294967295 ||
      typeof body.roomNumber!=='string' || !body.roomNumber || body.roomNumber.length>10 ||
      typeof body.rating!=='number' || !Number.isFinite(body.rating) || body.rating<1 || body.rating>5) {
      throw badInput('Supply bookingId, one roomNumber from that booking and a numeric rating from 1 to 5.');
    }
    const result=await this.repository.record(body);
    if(result.error==='not_found')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');
    if(result.error==='cancelled')throw new AppError(409,'BOOKING_CANCELLED','Select an active or completed booking for questionnaire entry.');
    if(result.error==='unrelated_room')throw badInput('Select a room included in this booking.');
    return result;
  }
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
    const valid=body&&!Array.isArray(body)&&typeof body==='object'&&Object.keys(body).every(key=>key==='ratings')&&Array.isArray(body.ratings)&&body.ratings.length>0&&
      body.ratings.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).every(key=>['roomNumber','rating'].includes(key))&&
        typeof r.roomNumber==='string'&&r.roomNumber&&r.roomNumber.length<=10&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5)&&
      new Set(body.ratings.map(r=>r.roomNumber)).size===body.ratings.length;
    const checked=this.token(token);
    if(!valid)throw badInput('Supply ratings: a list with one whole-number rating from 1 to 5 per room on the booking.');
    const result=await this.repository.submitQuestionnaire(checked,body.ratings);
    if(result.error==='not_found')throw questionnaireNotFound();
    if(result.error==='unrelated_room')throw badInput('Rate only the rooms included in this stay.');
    if(result.error==='already_answered')throw new AppError(409,'ALREADY_ANSWERED',`Room ${result.roomNumber} has already been rated. Thank you!`);
    return result;
  }
  report(groupBy='room'){
    if(!['room','roomType'].includes(groupBy))throw badInput('Select groupBy=room or groupBy=roomType.');
    return this.repository.report(groupBy);
  }
}

const questionnaireNotFound=()=>new AppError(404,'QUESTIONNAIRE_NOT_FOUND','This questionnaire link is not valid.');
