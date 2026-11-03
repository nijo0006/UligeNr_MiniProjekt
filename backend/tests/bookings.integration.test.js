import { SatisfactionRepository } from '../src/data/satisfactionRepository.js';
import { BarRepository } from '../src/data/barRepository.js';
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import { createPool } from '../src/data/pool.js';
import { initialize } from '../src/startup/initialize.js';
import { BookingRepository } from '../src/data/bookingRepository.js';
import { ReportRepository } from '../src/data/reportRepository.js';
import { createApp } from '../src/presentation/app.js';

if (!process.env.POSTGRES_DB?.endsWith('_test')) throw new Error('Integration tests require a dedicated database ending in _test; refusing to change application data.');
let pool, server, base;
const payload = (overrides = {}) => ({ holderFirstName: 'Frederik', holderLastName: 'Johansen', holderEmail: 'frederik@example.com', holderCountry: 'Denmark', guestCount: 1, roomNumbers: ['001'], arrival: '2026-05-31', nights: 2, ...overrides });
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json(), headers: response.headers };
}
before(async () => {
  pool = createPool(); await initialize(pool,{history:false});
  const app = await createApp(new BookingRepository(pool), new ReportRepository(pool), new BarRepository(pool), new SatisfactionRepository(pool));
  server = app.listen(0, '0.0.0.0'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(async () => {
  for (const table of ['satisfaction_responses','daily_bar_sales','room_nights','booking_rooms','booking_guests','bookings']) await pool.query(`DELETE FROM ${table}`);
  await pool.query('DELETE FROM drinks WHERE id>30');
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (pool) await pool.end(); });

test('initialization is repeatable without reseeding or losing saved bookings', async () => {
  const created = await call('/bookings', 'POST', payload()); assert.equal(created.status, 201);
  await initialize(pool,{history:false});
  assert.equal((await call('/rooms')).data.length, 214);
  assert.equal((await call('/catalog')).data.rates.length, 24);
  assert.equal((await call(`/bookings/${created.data.bookingId}`)).data.totalPrice, '2491.00');
});
test('creates, persists and reads the complete contract response without login', async () => {
  const created = await call('/bookings', 'POST', payload({ guests: [{ firstName: 'Guest', lastName: 'Two' }], guestCount: 2 }));
  assert.equal(created.status, 201);
  const id = created.data.bookingId;
  assert.equal(created.headers.get('location'), `/api/bookings/${id}`);
  assert.equal(created.data.totalPrice, '2491.00'); assert.equal(created.data.departure, '2026-06-02');
  assert.equal(created.data.version, 1); assert.equal(created.data.guestCount, 2);
  assert.deepEqual((await call(`/bookings/${id}`)).data, created.data);
  assert.equal((await call('/bookings')).data.length, 1);
});
test('simultaneous overlapping creations cannot both reserve a room', async () => {
  const results = await Promise.all([call('/bookings','POST',payload()), call('/bookings','POST',payload({ holderFirstName: 'Other' }))]);
  assert.deepEqual(results.map(r => r.status).sort(), [201,409]);
  assert.equal((await call('/bookings')).data.length, 1);
});
test('availability excludes overlaps but allows departure-day arrival', async () => {
  const created = await call('/bookings','POST',payload({ arrival:'2026-07-10',nights:3 }));
  assert.equal(created.status,201);
  const unavailable = await call('/rooms?arrival=2026-07-12&departure=2026-07-14');
  assert.ok(!unavailable.data.some(r => r.roomNumber==='001'));
  const adjacent = await call('/bookings','POST',payload({arrival:'2026-07-13',nights:2}));
  assert.equal(adjacent.status,201);
});
test('booking-holder email is required, validated, stored and editable (Q1)', async () => {
  const { holderEmail, ...withoutEmail } = payload();
  const missing = await call('/bookings', 'POST', withoutEmail);
  assert.equal(missing.status, 400); assert.match(missing.data.message, /holderEmail/);
  const invalid = await call('/bookings', 'POST', payload({ holderEmail: 'not-an-email' }));
  assert.equal(invalid.status, 400); assert.match(invalid.data.message, /holderEmail/);
  assert.equal((await call('/bookings')).data.length, 0);
  const created = await call('/bookings', 'POST', payload({ holderEmail: ' frederik@example.com ' }));
  assert.equal(created.status, 201); assert.equal(created.data.holderEmail, 'frederik@example.com');
  const id = created.data.bookingId;
  const cleared = await call(`/bookings/${id}`, 'PUT', payload({ holderEmail: null, version: 1 }));
  assert.equal(cleared.status, 400); assert.match(cleared.data.message, /holderEmail/);
  const changed = await call(`/bookings/${id}`, 'PUT', payload({ holderEmail: 'new@example.com', version: 1 }));
  assert.equal(changed.status, 200); assert.equal(changed.data.holderEmail, 'new@example.com');
});
test('stale edit preserves first save; reload permits another valid save', async () => {
  const created = await call('/bookings','POST',payload()); const id=created.data.bookingId;
  const first=await call(`/bookings/${id}`,'PUT',payload({holderFirstName:'First',version:1}));
  assert.equal(first.status,200); assert.equal(first.data.version,2);
  const stale=await call(`/bookings/${id}`,'PUT',payload({holderFirstName:'Stale',version:1}));
  assert.equal(stale.status,409); assert.match(stale.data.message,/reload/i);
  assert.equal((await call(`/bookings/${id}`)).data.holderFirstName,'First');
  assert.equal((await call(`/bookings/${id}`,'PUT',payload({holderFirstName:'Reloaded',version:2}))).status,200);
});
test('overlapping edit rolls back all values and room allocations', async () => {
  const a=await call('/bookings','POST',payload());
  const b=await call('/bookings','POST',payload({roomNumbers:['002']}));
  const conflict=await call(`/bookings/${b.data.bookingId}`,'PUT',payload({roomNumbers:['001','002'],version:1}));
  assert.equal(conflict.status,409);
  const still=await call(`/bookings/${b.data.bookingId}`);
  assert.equal(still.data.version,1); assert.deepEqual(still.data.roomNumbers,['002']);
  const rooms=await call(`/rooms?arrival=2026-05-31&departure=2026-06-02&excludeBookingId=${a.data.bookingId}`);
  assert.ok(rooms.data.some(r=>r.roomNumber==='001')); assert.ok(!rooms.data.some(r=>r.roomNumber==='002'));
});
test('cancellation frees rooms and repeated cancellation is a no-op', async () => {
  const a=await call('/bookings','POST',payload()); const id=a.data.bookingId;
  const first=await call(`/bookings/${id}`,'DELETE');
  const repeat=await call(`/bookings/${id}`,'DELETE');
  assert.equal(first.status,200); assert.equal(first.data.status,'cancelled');
  assert.deepEqual(repeat.data,first.data); assert.deepEqual((await call('/bookings')).data,[]);
  assert.equal((await call('/bookings','POST',payload())).status,201);
});
test('unknown IDs and invalid input do not mutate bookings', async () => {
  assert.equal((await call('/bookings/4294967295')).status,404);
  assert.equal((await call('/bookings/4294967295','DELETE')).data.message,'Booking not found');
  for (const change of [{totalPrice:'1.00'},{bookingId:100},{departure:'2026-06-30'},{arrival:'2026-02-30'},{nights:0},{holderCountry:'Unknown country'},{roomNumbers:['999']},{roomNumbers:['001','001']}]) assert.equal((await call('/bookings','POST',payload(change))).status,400,JSON.stringify(change));
  assert.deepEqual((await call('/bookings')).data,[]);
});
test('multi-room price, unusual guest count, edit and immutable ID rules', async () => {
  const a=await call('/bookings','POST',payload({roomNumbers:['001','002'],guestCount:50}));
  assert.equal(a.status,201); assert.equal(a.data.totalPrice,'4982.00');
  const id=a.data.bookingId;
  assert.equal((await call(`/bookings/${id}`,'PUT',payload({version:1,totalPrice:'1.00'}))).status,400);
  const edited=await call(`/bookings/${id}`,'PUT',payload({version:1,arrival:'2025-12-31'}));
  assert.equal(edited.status,200); assert.equal(edited.data.totalPrice,'2183.00'); assert.equal(edited.data.bookingId,id);
});
test('serves valid implemented OpenAPI and rejects malformed JSON as JSON', async () => {
  const result=await call('/openapi.json'); assert.equal(result.status,200);
  await SwaggerParser.validate(result.data);
  assert.ok(result.data.paths['/api/bar-sales']);
  assert.ok(result.data.paths['/api/satisfaction']);
  const response=await fetch(base+'/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'});
  assert.equal(response.status,400); assert.equal((await response.json()).code,'INVALID_JSON');
  assert.equal((await call('/unimplemented')).status,404);
});
test('frontend and Swagger UI are available and health is database-backed', async () => {
  assert.equal((await call('/health')).data.status,'ready');
  const page=await fetch(base.replace('/api','/staff/bookings')); assert.equal(page.status,200); assert.match(await page.text(),/booking-form/);
  const docs=await fetch(base+'/docs/'); assert.equal(docs.status,200); assert.match(await docs.text(),/swagger-ui/);
  const seed=JSON.parse(await readFile(new URL('../src/startup/catalog.json',import.meta.url),'utf8'));
  assert.equal((await call('/catalog')).data.countries.length,seed.countries.length);
});

// Migration-sensitive behavior: PostgreSQL folds unquoted aliases and has different
// date, NUMERIC and BIGINT parsers than the previous driver.
test('PostgreSQL preserves filtered availability, JSON types and the existing integer range', async () => {
  const created = await call('/bookings','POST',payload({guestCount:4294967295}));
  assert.equal(created.status,201);
  assert.equal(created.data.guestCount,4294967295);
  assert.equal(typeof created.data.bookingId,'number');
  assert.equal(typeof created.data.totalPrice,'string');
  assert.equal(created.data.arrival,'2026-05-31');
  assert.deepEqual(created.data.nightCharges.map(n=>n.charge),['1152.00','1339.00']);
  const typeOnly = await call('/rooms?roomType=Standard%20Single');
  assert.equal(typeOnly.status,200);
  assert.ok(typeOnly.data.length>0);
  assert.ok(typeOnly.data.every(r=>r.roomType==='Standard Single' && typeof r.synthetic==='boolean'));
  const filtered = await call('/rooms?roomType=Standard%20Single&arrival=2026-05-31&departure=2026-06-02');
  assert.equal(filtered.status,200);
  assert.ok(!filtered.data.some(r=>r.roomNumber==='001'));
  const editing = await call(`/rooms?roomType=Standard%20Single&arrival=2026-05-31&departure=2026-06-02&excludeBookingId=${created.data.bookingId}`);
  assert.ok(editing.data.some(r=>r.roomNumber==='001'));
});

test('annual room revenue returns null without nights and validates the year', async () => {
  const report = await call('/reports/revenue?year=2026');
  assert.equal(report.status,200);
  assert.deepEqual(report.data,{year:2026,currency:'DKK',roomRevenue:null,barRevenue:null,totalRevenue:null,containsSyntheticData:false});
  assert.equal(report.headers.get('cache-control'),'no-store');
  for (const query of ['', '?year=abc','?year=2026.5','?year=999','?year=10000','?year=2026&year=2025']) {
    const invalid = await call('/reports/revenue'+query);
    assert.equal(invalid.status,400,query);
    assert.equal(invalid.data.code,'INVALID_INPUT');
  }
  for (const year of [1000,9999]) assert.equal((await call(`/reports/revenue?year=${year}`)).status,200);
  assert.deepEqual((await call('/bookings')).data,[]);
});

test('annual room revenue splits New Year and counts each booked room-night once', async () => {
  const created=await call('/bookings','POST',payload({arrival:'2025-12-31',roomNumbers:['001','002'],guestCount:50}));
  assert.equal(created.status,201);
  assert.equal(created.data.totalPrice,'4366.00');
  assert.deepEqual((await call('/reports/revenue?year=2025')).data,{year:2025,currency:'DKK',roomRevenue:'2304.00',barRevenue:null,totalRevenue:'2304.00',containsSyntheticData:false});
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'2062.00');
  assert.equal((await call('/reports/revenue?year=2024')).data.roomRevenue,null);
  // Departure is excluded even at the final year boundary supported by the booking API.
  const last=await call('/bookings','POST',payload({arrival:'9999-12-30',nights:1}));
  assert.equal(last.status,201);
  assert.equal((await call('/reports/revenue?year=9999')).data.roomRevenue,'1152.00');
});

test('annual room revenue reflects creation, edits, failed edits and cancellation on the next request', async () => {
  const created=await call('/bookings','POST',payload());
  const id=created.data.bookingId;
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'2491.00');
  const edit=await call(`/bookings/${id}`,'PUT',payload({nights:3,version:1}));
  assert.equal(edit.status,200);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'3830.00');
  assert.equal((await call(`/bookings/${id}`,'PUT',payload({nights:4,version:1}))).status,409);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'3830.00');
  assert.equal((await call(`/bookings/${id}`,'DELETE')).status,200);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,null);
  assert.equal((await call(`/bookings/${id}`,'DELETE')).status,200);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,null);
});

test('annual room revenue sums exact stored charges and distinguishes zero from no data', async () => {
  const created=await call('/bookings','POST',payload());
  const id=created.data.bookingId;
  // Dedicated database fixture isolates decimal aggregation from the tariff calculator.
  await pool.query("UPDATE room_nights SET exact_charge=CASE WHEN night_date='2026-05-31' THEN 0.10 ELSE 0.20 END WHERE booking_id=$1",[id]);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'0.30');
  await pool.query('UPDATE room_nights SET exact_charge=0 WHERE booking_id=$1',[id]);
  assert.equal((await call('/reports/revenue?year=2026')).data.roomRevenue,'0.00');
});

test('annual hotel revenue combines independent room/bar sources and refreshes after corrections and cancellation', async () => {
  const booking = await call('/bookings','POST',payload({arrival:'2025-12-31',roomNumbers:['001','002']}));
  assert.equal(booking.status,201);
  const {rows:[drink]} = await pool.query("SELECT id FROM drinks WHERE category='Coffee' ORDER BY id LIMIT 1");
  const save = (date,quantity) => call(`/bar-sales/${date}/${drink.id}`,'PUT',{quantity});
  assert.equal((await save('2025-12-31',2)).status,200);
  assert.equal((await save('2026-01-01',3)).status,200);
  assert.equal((await save('2026-12-31',1)).status,200);
  assert.equal((await save('2027-01-01',5)).status,200);
  for (const [year,rooms] of [[2025,'2304.00'],[2026,'2062.00'],[2027,null]]) {
    const report=(await call(`/reports/revenue?year=${year}`)).data;
    const bar=(await call(`/reports/bar?year=${year}`)).data;
    assert.equal(report.roomRevenue,rooms);
    assert.equal(report.barRevenue,bar.revenue);
    assert.equal(Number(report.totalRevenue),Number(rooms??0)+Number(bar.revenue));
  }
  const before=(await call('/reports/revenue?year=2026')).data;
  const corrected=await save('2026-01-01',1);assert.equal(corrected.status,200);
  const after=(await call('/reports/revenue?year=2026')).data;
  assert.equal(after.barRevenue,(await call('/reports/bar?year=2026')).data.revenue);
  assert.ok(Number(after.totalRevenue)<Number(before.totalRevenue));
  assert.equal((await call(`/bookings/${booking.data.bookingId}`,'PUT',payload({arrival:'2026-01-01',nights:1,roomNumbers:['001','002'],version:1}))).status,200);
  assert.equal((await call('/reports/revenue?year=2025')).data.roomRevenue,null);
  assert.equal((await call(`/bookings/${booking.data.bookingId}`,'DELETE')).status,200);
  const cancelled=(await call('/reports/revenue?year=2026')).data;
  assert.equal(cancelled.roomRevenue,null);assert.equal(cancelled.totalRevenue,cancelled.barRevenue);
});

test('annual hotel total preserves exact decimals, genuine zero and amounts above JavaScript safe integer cents', async () => {
  const booking=await call('/bookings','POST',payload());const id=booking.data.bookingId;
  await pool.query("UPDATE room_nights SET exact_charge=CASE WHEN night_date='2026-05-31' THEN 0.10 ELSE 0.20 END WHERE booking_id=$1",[id]);
  await pool.query("INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue) VALUES ('2026-06-01',1,1,0.40,0.40)");
  let report=(await call('/reports/revenue?year=2026')).data;
  assert.equal(report.roomRevenue,'0.30');assert.equal(report.barRevenue,'0.40');assert.equal(report.totalRevenue,'0.70');
  await pool.query('UPDATE room_nights SET exact_charge=0 WHERE booking_id=$1',[id]);
  await pool.query('UPDATE daily_bar_sales SET exact_revenue=0,quantity=0');
  report=(await call('/reports/revenue?year=2026')).data;
  assert.equal(report.roomRevenue,'0.00');assert.equal(report.barRevenue,'0.00');assert.equal(report.totalRevenue,'0.00');
  await call(`/bookings/${id}`,'DELETE');
  report=(await call('/reports/revenue?year=2026')).data;
  assert.equal(report.roomRevenue,null);assert.equal(report.totalRevenue,'0.00');
  await pool.query("UPDATE bookings SET status='active' WHERE id=$1",[id]);
  await pool.query("UPDATE room_nights SET exact_charge=CASE WHEN night_date='2026-05-31' THEN 90071992547409.91 ELSE 0 END WHERE booking_id=$1",[id]);
  await pool.query('UPDATE daily_bar_sales SET exact_revenue=0.09');
  assert.equal((await call('/reports/revenue?year=2026')).data.totalRevenue,'90071992547410.00');
});

test('annual hotel provenance covers either included source and ignores cancelled or out-of-year synthetic records', async () => {
  const booking=await call('/bookings','POST',payload());const id=booking.data.bookingId;
  await pool.query("INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue,synthetic) VALUES ('2025-12-31',1,1,1,1,true),('2026-06-01',1,1,1,1,false)");
  assert.equal((await call('/reports/revenue?year=2026')).data.containsSyntheticData,false);
  assert.equal((await call('/reports/revenue?year=2025')).data.containsSyntheticData,true);
  await pool.query("UPDATE daily_bar_sales SET synthetic=true WHERE sales_date='2026-06-01'");
  assert.equal((await call('/reports/revenue?year=2026')).data.containsSyntheticData,true);
  await pool.query("UPDATE daily_bar_sales SET synthetic=false WHERE sales_date='2026-06-01'");
  await pool.query('UPDATE bookings SET synthetic_dates=true WHERE id=$1',[id]);
  assert.equal((await call('/reports/revenue?year=2026')).data.containsSyntheticData,true);
  await call(`/bookings/${id}`,'DELETE');
  assert.equal((await call('/reports/revenue?year=2026')).data.containsSyntheticData,false);
});

test('staff home links to three separate workspaces and the retired guest page is unavailable', async () => {
  const home=await fetch(base.replace('/api','/'));const html=await home.text();
  assert.equal(home.status,200);
  for(const route of ['overview','bookings','bar'])assert.ok(html.includes(`/staff/${route}`));
  assert.ok(!html.includes('id="booking-form"'));assert.ok(!html.includes('id="bar-form"'));
  for(const [route,present,absent] of [
    ['overview','id="annual-room-revenue"','id="booking-form"'],
    ['bookings','id="booking-form"','id="annual-room-revenue"'],
    ['bar','id="bar-form"','id="booking-form"']
  ]){
    const page=await fetch(base.replace('/api',`/staff/${route}`));const content=await page.text();
    assert.equal(page.status,200);assert.ok(content.includes(present));assert.ok(!content.includes(absent));
  }
  for(const path of ['/guest','/guest/','/guest.js'])assert.equal((await fetch(base.replace('/api',path))).status,404);
  const alias=await fetch(base.replace('/api','/staff'));assert.equal(alias.status,200);assert.match(await alias.text(),/workspace-grid/);
});

test('bar catalog is source-backed and annual no-data results are null',async()=>{
  const menu=await call('/drinks');assert.equal(menu.status,200);assert.equal(menu.data.length,30);
  assert.equal(menu.data.find(d=>d.name==='Espresso').unitPrice,'69.10');
  const report=await call('/reports/bar?year=2026');assert.equal(report.status,200);
  assert.equal(report.data.revenue,null);assert.equal(report.data.units,null);assert.equal(report.data.cocktailPercent,null);assert.equal(report.data.mixStatus,'no_data');
  assert.equal(report.data.drinks.length,30);
});

test('daily bar corrections replace quantity, preserve the price and keep dates separate',async()=>{
  const menu=(await call('/drinks')).data,id=menu.find(d=>d.name==='Espresso').drinkId;
  const save=(date,quantity)=>call(`/bar-sales/${date}/${id}`,'PUT',{quantity});
  assert.equal((await save('2026-11-01',10)).data.revenue,'691.00');
  assert.equal((await save('2026-11-01',12)).data.revenue,'829.20');
  await save('2026-11-01',12);await save('2026-11-02',1);
  let report=(await call('/reports/bar?year=2026')).data;assert.equal(report.units,13);assert.equal(report.revenue,'898.30');
  assert.equal((await call('/bar-sales?date=2026-11-01')).data.sales[0].quantity,12);
  await pool.query('UPDATE drinks SET unit_price=70 WHERE id=$1',[id]);
  try{assert.equal((await save('2026-11-01',2)).data.revenue,'138.20');assert.equal((await save('2025-12-31',1)).data.revenue,'70.00');}
  finally{await pool.query('UPDATE drinks SET unit_price=69.10 WHERE id=$1',[id]);}
  report=(await call('/reports/bar?year=2026')).data;assert.equal(report.revenue,'207.30');
  assert.equal((await call('/reports/bar?year=2025')).data.revenue,'70.00');
  await initialize(pool,{history:false});assert.equal((await call('/bar-sales?date=2026-11-01')).data.sales[0].quantity,2);
});

test('bar mix excludes wine/beer while totals include all categories; invalid input has no effect',async()=>{
  // Explicit isolated four-category fixture from the approved acceptance criterion.
  await pool.query("INSERT INTO drinks(id,name,category,unit_price) VALUES (101,'Fixture cocktail','Cocktails',300),(102,'Fixture coffee','Coffee',100),(103,'Fixture wine','Wine',200),(104,'Fixture beer','Beer',400)");
  for(const id of [101,102,103,104]) assert.equal((await call(`/bar-sales/2026-11-01/${id}`,'PUT',{quantity:1})).status,200);
  const report=(await call('/reports/bar?year=2026')).data;
  assert.equal(report.revenue,'1000.00');assert.equal(report.units,4);assert.equal(report.cocktailPercent,75);assert.equal(report.coffeePercent,25);
  for(const body of [{quantity:-1},{quantity:1.5},{quantity:1,unitPrice:'1.00'},{}])assert.equal((await call('/bar-sales/2026-11-01/101','PUT',body)).status,400);
  assert.equal((await call('/bar-sales/2026-02-30/101','PUT',{quantity:1})).status,400);
  assert.equal((await call('/reports/bar?year=oops')).status,400);
  assert.equal((await call('/reports/bar?year=2026')).data.revenue,'1000.00');
  await call('/bar-sales/2026-11-01/101','PUT',{quantity:0});await call('/bar-sales/2026-11-01/102','PUT',{quantity:0});
  const zero=(await call('/reports/bar?year=2026')).data;assert.equal(zero.cocktailPercent,null);assert.equal(zero.mixStatus,'undefined');
});

test('operational reports count booking holders once across rooms and expose unknown guest counts',async()=>{
  const a=await call('/bookings','POST',payload({guestCount:3,roomNumbers:['001','002']}));
  const b=await call('/bookings','POST',payload({guestCount:2,roomNumbers:['003']}));
  assert.equal(a.status,201);assert.equal(b.status,201);
  await pool.query('UPDATE bookings SET guest_count=NULL WHERE id=$1',[b.data.bookingId]);
  let rows=(await call('/reports/countries?year=2026')).data;
  assert.equal(rows.length,1);assert.equal(rows[0].bookingCount,2);assert.equal(rows[0].guestCount,null);
  assert.equal(rows[0].knownGuestCount,3);assert.equal(rows[0].unknownGuestBookingCount,1);
  assert.equal(rows[0].roomRevenue,'7473.00');
  let summary=(await call('/reports/summary?year=2026')).data;
  assert.equal(summary.bookingCount,2);assert.equal(summary.guestCount,null);assert.equal(summary.soldRoomNights,6);
  assert.equal(summary.occupancyCapacity,78110);assert.equal(summary.occupancyPercent,6/78110*100);
  assert.equal(summary.totalRevenue,'7473.00');
  await call(`/bookings/${a.data.bookingId}`,'PUT',payload({version:1,holderCountry:'Sweden',roomNumbers:['001','002'],guestCount:3}));
  rows=(await call('/reports/countries?year=2026')).data;
  assert.equal(rows.find(r=>r.country==='Sweden').roomRevenue,'4982.00');
  assert.equal(rows.find(r=>r.country==='Sweden').guestCount,3);
  await call(`/bookings/${b.data.bookingId}`,'DELETE');
  summary=(await call('/reports/summary?year=2026')).data;
  assert.equal(summary.bookingCount,1);assert.equal(summary.guestCount,3);assert.equal(summary.unknownGuestBookingCount,0);
});

test('room/type/season reports preserve cross-year night allocation, exact totals, ties and inventory',async()=>{
  const inventory=(await call('/reports/inventory')).data;
  assert.equal(inventory.length,8);assert.equal(inventory.reduce((s,r)=>s+r.roomCount,0),214);
  const created=await call('/bookings','POST',payload({arrival:'2025-12-31',roomNumbers:['001','002'],guestCount:5}));
  for(const [year,amount] of [[2025,'2304.00'],[2026,'2062.00']]){
    const summary=(await call(`/reports/summary?year=${year}`)).data;
    assert.equal(summary.bookingCount,1);assert.equal(summary.guestCount,5);assert.equal(summary.soldRoomNights,2);
    const rooms=(await call(`/reports/rooms?year=${year}`)).data;
    assert.equal(rooms.length,214);assert.equal(rooms[0].roomNumber,'001');assert.equal(rooms[1].roomNumber,'002');
    assert.equal(rooms[0].roomRevenue,rooms[1].roomRevenue);assert.equal(rooms[2].roomRevenue,null);
    const seasons=(await call(`/reports/room-types-seasons?year=${year}`)).data;
    assert.equal(seasons.length,24);
    assert.equal(seasons.find(r=>r.roomType==='Standard Single'&&r.season===(year===2025?'mid':'low')).roomRevenue,amount);
    assert.equal(seasons.filter(r=>r.roomRevenue!==null).length,1);
  }
  const all=(await call('/reports/summary')).data;
  assert.equal(all.year,null);assert.equal(all.soldRoomNights,4);assert.equal(all.bookingCount,1);assert.equal(all.guestCount,5);
  assert.equal(all.occupancyPercent,null);assert.equal(all.occupancyCapacity,null);
  await call(`/bookings/${created.data.bookingId}`,'DELETE');
  assert.deepEqual((await call('/reports/inventory')).data,inventory);
  assert.ok((await call('/reports/rooms')).data.every(r=>r.roomRevenue===null));
});

test('report summaries include walk-in bar sales, provenance and empty scopes without inventing people',async()=>{
  const empty=(await call('/reports/summary?year=2026')).data;
  assert.equal(empty.roomRevenue,null);assert.equal(empty.barRevenue,null);assert.equal(empty.totalRevenue,null);
  assert.equal(empty.bookingCount,0);assert.equal(empty.guestCount,null);assert.equal(empty.knownGuestCount,0);
  assert.equal(empty.soldRoomNights,0);assert.equal(empty.occupancyPercent,null);
  const sale=await call('/bar-sales/2026-06-01/1','PUT',{quantity:2});assert.equal(sale.status,200);
  await pool.query('UPDATE daily_bar_sales SET synthetic=true');
  const summary=(await call('/reports/summary?year=2026')).data;
  assert.equal(summary.totalRevenue,sale.data.revenue);assert.equal(summary.barUnits,2);assert.equal(summary.containsSyntheticData,true);
  assert.deepEqual((await call('/reports/countries')).data,[]);
  assert.deepEqual((await call('/reports/drinks?year=2026')).data,(await call('/reports/bar?year=2026')).data.drinks);
  for(const path of ['summary','countries','rooms','room-types-seasons']){
    for(const query of ['?year=','?year=abc','?year=999','?year=10000','?year=2026&year=2025'])assert.equal((await call(`/reports/${path}${query}`)).status,400);
    assert.equal((await call(`/reports/${path}?year=9999`)).status,200);
    assert.equal((await call(`/reports/${path}`)).headers.get('cache-control'),'no-store');
  }
});

test('country and type-season reports add exact stored fractional amounts without repricing',async()=>{
  const a=await call('/bookings','POST',payload({arrival:'2026-05-31'}));
  await pool.query("UPDATE room_nights SET exact_charge=CASE WHEN season='mid' THEN 0.10 ELSE 0.20 END WHERE booking_id=$1",[a.data.bookingId]);
  await pool.query('UPDATE bookings SET synthetic_dates=true WHERE id=$1',[a.data.bookingId]);
  const countries=(await call('/reports/countries')).data;
  assert.equal(countries[0].roomRevenue,'0.30');assert.equal(countries[0].containsSyntheticData,true);
  const seasons=(await call('/reports/room-types-seasons')).data;
  assert.equal(seasons.find(r=>r.roomType==='Standard Single'&&r.season==='mid').roomRevenue,'0.10');
  assert.equal(seasons.find(r=>r.roomType==='Standard Single'&&r.season==='high').roomRevenue,'0.20');
});

test('questionnaires validate booking-room membership and persist separate room means without generated scores',async()=>{
  assert.ok((await call('/reports/satisfaction')).data.every(r=>r.meanRating===null&&r.responseCount===0));
  const booking=await call('/bookings','POST',payload({roomNumbers:['001','002']}));const id=booking.data.bookingId;
  const submit=(roomNumber,rating,extra={})=>call('/satisfaction','POST',{bookingId:id,roomNumber,rating,...extra});
  for(const rating of [2,4,5])assert.equal((await submit('001',rating)).status,201);
  assert.equal((await submit('002',2)).status,201);
  for(const rating of [0,6,null,'4'])assert.equal((await submit('001',rating)).status,400);
  assert.equal((await submit('003',4)).status,400);
  assert.equal((await submit('001',4,{meanRating:5})).status,400);
  assert.equal((await submit('001',4,{bookingId:4294967295})).status,404);
  assert.equal((await call('/reports/satisfaction?year=2026')).status,400);
  let report=(await call('/reports/satisfaction')).data;
  assert.equal(report.length,214);assert.equal(report.find(r=>r.roomNumber==='001').responseCount,3);
  assert.equal(report.find(r=>r.roomNumber==='001').meanRating,11/3);
  assert.equal(report.find(r=>r.roomNumber==='002').meanRating,2);
  assert.equal(report.find(r=>r.roomNumber==='003').meanRating,null);
  await initialize(pool,{history:false});
  assert.deepEqual((await call('/reports/satisfaction')).data,report);
  assert.equal((await call(`/bookings/${id}`,'PUT',payload({roomNumbers:['003'],version:1}))).status,200);
  assert.equal((await call('/reports/satisfaction')).data.find(r=>r.roomNumber==='001').responseCount,3);
  assert.equal((await submit('001',4)).status,400);
  await call(`/bookings/${id}`,'DELETE');
  assert.equal((await submit('003',4)).status,409);
  assert.ok((await call('/reports/satisfaction')).data.every(r=>r.meanRating===null&&r.responseCount===0));
});

test('questionnaire insertion serializes with booking cancellation',async()=>{
  const booking=await call('/bookings','POST',payload());const id=booking.data.bookingId;
  const [response,cancelled]=await Promise.all([
    call('/satisfaction','POST',{bookingId:id,roomNumber:'001',rating:4}),call(`/bookings/${id}`,'DELETE')
  ]);
  assert.ok([201,409].includes(response.status));assert.equal(cancelled.status,200);
  assert.equal((await call('/reports/satisfaction')).data.find(r=>r.roomNumber==='001').responseCount,0);
});
