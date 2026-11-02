import { seasonFor, toMinor, money } from '../services/pricing.js';
const DAY=86_400_000;
const YEARS=[2024,2025,2026];
const iso=date=>date.toISOString().slice(0,10);
export const IMPORT_VERSION='hotel-workbook-history-v1';
export const GENERATOR_VERSION='seasonal-room-and-daily-bar-v1';
export const sourceBookingId = id=>`${IMPORT_VERSION}:booking:${id}`;
export const sourceBarId = row=>`${IMPORT_VERSION}:bar:${row}`;
export function historicalDays(){
  const days=[];
  for(let date=new Date('2024-01-01T00:00:00Z');iso(date)<'2027-01-01';date=new Date(date.getTime()+DAY))days.push(iso(date));
  return days;
}

export function assignHistoricalBookings(records,rooms,existing=[]){
  const allocations=new Map(rooms.map(r=>[r.roomNumber,[]]));
  for(const row of existing)allocations.get(row.roomNumber)?.push({arrival:row.arrival,departure:row.departure});
  const byType=new Map();
  for(const room of [...rooms].sort((a,b)=>a.roomNumber.localeCompare(b.roomNumber))){
    if(!byType.has(room.roomType))byType.set(room.roomType,[]);
    byType.get(room.roomType).push(room.roomNumber);
  }
  const candidates=new Map();
  function arrivals(year,season,nights){
    const key=`${year}:${season}:${nights}`;
    if(!candidates.has(key)){
      const result=[];
      for(let start=Date.UTC(year,0,1);start<Date.UTC(year+1,0,1);start+=DAY){
        if(start+(nights-1)*DAY>=Date.UTC(year+1,0,1))continue;
        if(Array.from({length:nights},(_,i)=>seasonFor(new Date(start+i*DAY))).every(s=>s===season))result.push({arrival:iso(new Date(start)),departure:iso(new Date(start+nights*DAY))});
      }
      candidates.set(key,result);
    }
    return candidates.get(key);
  }
  return records.map((record,index)=>{
    const numbers=byType.get(record.roomType)??[];
    for(let y=0;y<YEARS.length;y++){
      const year=YEARS[(index+y)%YEARS.length];
      const dates=arrivals(year,record.season,record.nights);
      for(let offset=0;offset<dates.length;offset++){
        const stay=dates[(index*37+offset)%dates.length];
        for(let r=0;r<numbers.length;r++){
          const roomNumber=numbers[(index+r)%numbers.length];
          if(allocations.get(roomNumber).some(b=>b.arrival<stay.departure&&b.departure>stay.arrival))continue;
          allocations.get(roomNumber).push(stay);
          return {...record,...stay,roomNumber,sourceId:sourceBookingId(record.sourceBookingId)};
        }
      }
    }
    throw new Error(`Cannot place source booking ${record.sourceBookingId} without changing its season, nights or room type.`);
  });
}

export function distributeHistoricalBar(records,menu,existing=[]){
  const days=historicalDays();
  const occupied=new Set(existing.map(s=>`${s.salesDate}:${s.drinkId}`));
  const byName=new Map(menu.map(d=>[d.name,d]));
  const output=[];
  records.forEach((record,index)=>{
    const drink=byName.get(record.name);
    if(!drink||drink.category!==record.category)throw new Error(`Source drink menu mismatch at Excel row ${record.sourceRow}.`);
    const available=days.filter(date=>!occupied.has(`${date}:${drink.drinkId}`));
    if(!available.length)throw new Error(`No free demonstration sales dates for source row ${record.sourceRow}.`);
    const base=Math.floor(record.units/available.length),remainder=record.units%available.length;
    for(let i=0;i<available.length;i++){
      const quantity=base+(i<remainder?1:0);
      if(!quantity)continue;
      const salesDate=available[(i+index*31)%available.length];
      output.push({salesDate,drinkId:drink.drinkId,quantity,unitPrice:record.unitPrice,revenue:money(toMinor(record.unitPrice)*quantity),sourceId:sourceBarId(record.sourceRow)});
    }
  });
  return output;
}
