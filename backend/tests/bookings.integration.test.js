import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import { createPool } from '../src/data/pool.js';
import { initialize } from '../src/startup/initialize.js';
import { BookingRepository } from '../src/data/bookingRepository.js';
import { createApp } from '../src/presentation/app.js';

if (!process.env.MYSQL_DATABASE?.endsWith('_test')) throw new Error('Integration tests require a dedicated database ending in _test; refusing to change application data.');
let pool, server, base;
const payload = (overrides = {}) => ({ holderFirstName: 'Frederik', holderLastName: 'Johansen', holderCountry: 'Denmark', guestCount: 1, roomNumbers: ['001'], arrival: '2026-05-31', nights: 2, ...overrides });
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json(), headers: response.headers };
}
before(async () => {
  pool = createPool(); await initialize(pool);
  const app = await createApp(new BookingRepository(pool));
  server = app.listen(0, '0.0.0.0'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(async () => {
  for (const table of ['room_nights','booking_rooms','booking_guests','bookings']) await pool.query(`DELETE FROM ${table}`);
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (pool) await pool.end(); });

test('initialization is repeatable without reseeding or losing saved bookings', async () => {
  const created = await call('/bookings', 'POST', payload()); assert.equal(created.status, 201);
  await initialize(pool);
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
  assert.ok(!result.data.paths['/api/bar-sales']);
  const response=await fetch(base+'/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'});
  assert.equal(response.status,400); assert.equal((await response.json()).code,'INVALID_JSON');
  assert.equal((await call('/unimplemented')).status,404);
});
test('frontend and Swagger UI are available and health is database-backed', async () => {
  assert.equal((await call('/health')).data.status,'ready');
  const page=await fetch(base.replace('/api','/')); assert.equal(page.status,200); assert.match(await page.text(),/booking-form/);
  const docs=await fetch(base+'/docs/'); assert.equal(docs.status,200); assert.match(await docs.text(),/swagger-ui/);
  const seed=JSON.parse(await readFile(new URL('../src/startup/catalog.json',import.meta.url),'utf8'));
  assert.equal((await call('/catalog')).data.countries.length,seed.countries.length);
});
