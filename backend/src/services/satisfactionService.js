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
    if(result.error==='cancelled')throw new AppError(409,'BOOKING_CANCELLED','Select an active booking for questionnaire entry.');
    if(result.error==='unrelated_room')throw badInput('Select a room included in this booking.');
    return result;
  }
  report(){return this.repository.report();}
}
