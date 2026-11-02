import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readHistoricalSource} from '../src/startup/import.js';
import {assignHistoricalBookings,distributeHistoricalBar,historicalDays} from '../src/startup/historyGenerator.js';
import {seasonFor,toMinor} from '../src/services/pricing.js';
const source=await readHistoricalSource();
const {rooms}=JSON.parse(await readFile(new URL('../../specs/001-hotel-operations/fixtures/room-inventory.json',import.meta.url),'utf8'));
const {drinks}=JSON.parse(await readFile(new URL('../src/startup/drinks.json',import.meta.url),'utf8'));

test('source controls reconcile and seasonal booking assignment is deterministic without room overlaps',()=>{
  const existing=[{roomNumber:rooms[0].roomNumber,arrival:'2024-01-01',departure:'2027-01-01'}];
  const plan=assignHistoricalBookings(source.payload.bookings,rooms,existing);
  assert.deepEqual(plan,assignHistoricalBookings(source.payload.bookings,rooms,existing));
  assert.deepEqual([...new Set(plan.map(b=>b.arrival.slice(0,4)))].sort(),['2024','2025','2026']);
  const byRoom=new Map();
  for(const b of plan){
    assert.equal(rooms.find(r=>r.roomNumber===b.roomNumber).roomType,b.roomType);
    assert.equal(toMinor(b.nightlyPrice)*b.nights,toMinor(b.totalPrice));
    for(let i=0;i<b.nights;i++)assert.equal(seasonFor(new Date(Date.parse(b.arrival+'T00:00:00Z')+i*86400000)),b.season);
    if(!byRoom.has(b.roomNumber))byRoom.set(b.roomNumber,[]);byRoom.get(b.roomNumber).push(b);
  }
  for(const bookings of byRoom.values()){
    bookings.sort((a,b)=>a.arrival.localeCompare(b.arrival));
    for(let i=1;i<bookings.length;i++)assert.ok(bookings[i-1].departure<=bookings[i].arrival);
  }
  assert.ok(!plan.some(b=>b.roomNumber===rooms[0].roomNumber));
});

test('impossible seasonal room placement fails rather than changing source facts',()=>{
  const first=source.payload.bookings[0];
  assert.throws(()=>assignHistoricalBookings([first],[{roomNumber:'001',roomType:first.roomType}],[{roomNumber:'001',arrival:'2024-01-01',departure:'2027-01-01'}]),/Cannot place source booking/);
});

test('daily bar distribution preserves each source total and skips existing date/drink pairs',()=>{
  const existing=[{salesDate:'2024-01-01',drinkId:drinks[0].drinkId}];
  const rows=distributeHistoricalBar(source.payload.bar,drinks,existing);
  assert.deepEqual(rows,distributeHistoricalBar(source.payload.bar,drinks,existing));
  assert.equal(historicalDays().length,1096);
  const keys=new Set();const totals=new Map();
  for(const row of rows){
    const key=`${row.salesDate}:${row.drinkId}`;assert.ok(!keys.has(key));keys.add(key);
    assert.ok(row.salesDate>='2024-01-01'&&row.salesDate<'2027-01-01');assert.ok(Number.isInteger(row.quantity)&&row.quantity>0);
    assert.equal(toMinor(row.revenue),toMinor(row.unitPrice)*row.quantity);
    const total=totals.get(row.drinkId)??{units:0,minor:0};total.units+=row.quantity;total.minor+=toMinor(row.revenue);totals.set(row.drinkId,total);
  }
  assert.ok(!keys.has(`2024-01-01:${drinks[0].drinkId}`));
  for(const record of source.payload.bar){const id=drinks.find(d=>d.name===record.name).drinkId;assert.deepEqual(totals.get(id),{units:record.units,minor:toMinor(record.revenue)});}
});
