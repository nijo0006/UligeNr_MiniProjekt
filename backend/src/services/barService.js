import { badInput } from './errors.js';
import { parseDate } from './pricing.js';
const categories=['Cocktails','Coffee','Wine','Beer'];
const minor = value => BigInt(value.replace('.',''));
const money = value => `${value/100n}.${String(value%100n).padStart(2,'0')}`;
export class BarService {
  constructor(repository) { this.repository=repository; }
  catalog() { return this.repository.catalog(); }
  daily(date) { parseDate(date,'salesDate'); return this.repository.daily(date); }
  async save(date,id,body) {
    parseDate(date,'salesDate');
    if (!/^\d+$/.test(id) || Number(id)>2147483647 || Number(id)<1) throw badInput('Select a valid drink.');
    if (!body || Array.isArray(body) || Object.keys(body).length!==1 || !Number.isInteger(body.quantity) || body.quantity<0 || body.quantity>4294967295) throw badInput('Supply quantity as a non-negative whole number; manual prices are not allowed.');
    const saved=await this.repository.save(date,Number(id),body.quantity);
    if (!saved) throw badInput('Select a drink from the menu.');
    return saved;
  }
  async annual(year) {
    if (typeof year!=='string' || !/^[1-9]\d{3}$/.test(year)) throw badInput('Supply one calendar year from 1000 to 9999.');
    const drinks=await this.repository.annual(`${year}-01-01`,`${Number(year)+1}-01-01`);
    const hasData=drinks.some(d=>d.revenue!==null);
    const totals=categories.map(category=>{
      const data=drinks.filter(d=>d.category===category && d.revenue!==null);
      return {category,units:data.length?data.reduce((a,d)=>a+Number(d.units),0):null,revenue:data.length?money(data.reduce((a,d)=>a+minor(d.revenue),0n)):null};
    });
    const sum=totals.reduce((a,d)=>a+(d.revenue===null?0n:minor(d.revenue)),0n);
    const cocktail=totals[0].revenue,coffee=totals[1].revenue;
    const denominator=(cocktail===null?0n:minor(cocktail))+(coffee===null?0n:minor(coffee));
    const mixStatus=denominator>0n?'available':cocktail===null&&coffee===null?'no_data':'undefined';
    return {year:Number(year),currency:'DKK',revenue:hasData?money(sum):null,units:hasData?totals.reduce((a,d)=>a+(d.units??0),0):null,
      cocktailPercent:denominator>0n?Number(cocktail===null?0n:minor(cocktail))/Number(denominator)*100:null,
      coffeePercent:denominator>0n?Number(coffee===null?0n:minor(coffee))/Number(denominator)*100:null,
      mixStatus,containsSyntheticData:drinks.some(d=>d.synthetic),categories:totals,drinks};
  }
}
