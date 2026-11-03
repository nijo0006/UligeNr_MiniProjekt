import { badInput } from './errors.js';

export class ReportService {
  constructor(repository) { this.repository = repository; }

  history() { return this.repository.history(); }

  async annualRevenue(year) {
    if (typeof year !== 'string' || !/^[1-9]\d{3}$/.test(year)) {
      throw badInput('Supply one calendar year from 1000 to 9999, for example year=2026.');
    }
    const value = Number(year);
    const report = await this.repository.annualRoomRevenue(`${year}-01-01`, `${value + 1}-01-01`);
    return { year: value, currency: 'DKK', ...report };
  }
}
