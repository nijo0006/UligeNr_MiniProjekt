import { badInput } from './errors.js';

function combinedRevenue(roomRevenue, barRevenue) {
  if (roomRevenue === null && barRevenue === null) return null;
  const minor = value => value === null ? 0n : BigInt(value.replace('.', ''));
  const total = minor(roomRevenue) + minor(barRevenue);
  const digits = (total < 0n ? -total : total).toString().padStart(3, '0');
  return `${total < 0n ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function reportPeriod(year, required = false) {
  if (year === undefined && !required) return {year:null,start:null,end:null};
  if (typeof year !== 'string' || !/^[1-9]\d{3}$/.test(year)) {
    throw badInput('Supply one calendar year from 1000 to 9999.');
  }
  return {year:Number(year),start:`${year}-01-01`,end:`${Number(year)+1}-01-01`};
}
const people = row => ({...row,guestCount:row.bookingCount > 0 && row.unknownGuestBookingCount === 0 ? row.knownGuestCount : null});

export class ReportService {
  constructor(repository) { this.repository = repository; }

  history() { return this.repository.history(); }

  async annualRevenue(year) {
    if (typeof year !== 'string' || !/^[1-9]\d{3}$/.test(year)) {
      throw badInput('Supply one calendar year from 1000 to 9999, for example year=2026.');
    }
    const value = Number(year);
    const report = await this.repository.annualRevenue(`${year}-01-01`, `${value + 1}-01-01`);
    return { year: value, currency: 'DKK', ...report,
      totalRevenue: combinedRevenue(report.roomRevenue, report.barRevenue) };
  }
  async summary(year) {
    const period=reportPeriod(year);
    const {roomSynthetic,barSynthetic,...row}=await this.repository.summary(period.start,period.end);
    return {year:period.year,currency:'DKK',...people(row),
      totalRevenue:combinedRevenue(row.roomRevenue,row.barRevenue),
      occupancyPercent:period.year !== null && row.soldRoomNights > 0 ? row.soldRoomNights/(214*365)*100 : null,
      occupancyCapacity:period.year === null ? null : 214*365,
      containsSyntheticData:roomSynthetic || barSynthetic};
  }
  async countries(year) {
    const {start,end}=reportPeriod(year);
    return (await this.repository.countries(start,end)).map(people);
  }
  async rooms(year) {
    const {start,end}=reportPeriod(year);return this.repository.rooms(start,end);
  }
  async roomTypesSeasons(year) {
    const {start,end}=reportPeriod(year);return this.repository.roomTypesSeasons(start,end);
  }
  inventory() { return this.repository.inventory(); }

}
