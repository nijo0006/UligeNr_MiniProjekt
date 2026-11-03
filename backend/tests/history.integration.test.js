import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createPool} from '../src/data/pool.js';
import {initialize} from '../src/startup/initialize.js';
import {BookingRepository} from '../src/data/bookingRepository.js';
import {BarRepository} from '../src/data/barRepository.js';
import {ReportRepository} from '../src/data/reportRepository.js';
import {createApp} from '../src/presentation/app.js';
import {readHistoricalSource} from '../src/startup/import.js';
import {IMPORT_VERSION,sourceBookingId} from '../src/startup/historyGenerator.js';
if(!process.env.POSTGRES_DB?.endsWith('_test'))throw new Error('Historical integration checks require an isolated _test database.');
let admin,pool,schema,server,base,existing,existingBar;
async function schemaPool(){const name='history_test_'+randomUUID().replaceAll('-','');await admin.query(`CREATE SCHEMA ${name}`);return {name,pool:createPool({options:`-c search_path=${name}`})};}
async function call(path,method='GET',body){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()};}
before(async()=>{
  admin=createPool();const created=await schemaPool();schema=created.name;pool=created.pool;
  await initialize(pool,{history:false});
  server=(await createApp(new BookingRepository(pool),new ReportRepository(pool),new BarRepository(pool))).listen(0,'0.0.0.0');
  await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}/api`;
  const room=(await call('/rooms')).data.find(r=>r.roomType==='Spa Executive');
  existing=(await call('/bookings','POST',{holderFirstName:'Existing',holderLastName:'Preserved',holderCountry:'Denmark',guestCount:2,roomNumbers:[room.roomNumber],arrival:'2024-04-01',nights:1})).data;
  existingBar=(await call('/bar-sales/2024-01-01/1','PUT',{quantity:7})).data;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await pool?.end();if(schema)await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin?.end();});

test('imports complete historical workbook, preserves existing records and reconciles annual reports',async()=>{
  await initialize(pool);
  assert.deepEqual((await call(`/bookings/${existing.bookingId}`)).data,existing);
  assert.deepEqual((await call('/bar-sales?date=2024-01-01')).data.sales.find(s=>s.drinkId===1),((({salesDate,...row})=>row)(existingBar)));
  const history=(await call('/reports/history')).data;
  assert.equal(history.state,'imported');assert.equal(history.sourceTotals.bookings,1000);assert.equal(history.sourceTotals.roomNights,5379);
  assert.equal(history.sourceTotals.roomRevenue,'11234034.00');assert.equal(history.sourceTotals.barUnits,179958);assert.equal(history.sourceTotals.barRevenue,'13448640.34');
  const list=(await call('/bookings')).data;assert.equal(list.length,1001);
  const imported=list.filter(b=>b.sourceId);assert.equal(imported.length,1000);assert.ok(imported.every(b=>b.guestCount===null&&b.syntheticDates&&b.syntheticRoomAssignment&&b.pricingMode==='source-preserved'));
  let roomRevenue=0,barRevenue=0,barUnits=0;
  for(const year of [2024,2025,2026]){
    roomRevenue+=Math.round(Number((await call(`/reports/revenue?year=${year}`)).data.roomRevenue)*100);
    const bar=(await call(`/reports/bar?year=${year}`)).data;assert.ok(bar.containsSyntheticData);barRevenue+=Math.round(Number(bar.revenue)*100);barUnits+=bar.units;
  }
  assert.equal(roomRevenue,1123403400+Math.round(Number(existing.totalPrice)*100));
  assert.equal(barRevenue,1344864034+Math.round(Number(existingBar.revenue)*100));assert.equal(barUnits,179958+7);
  const {rows:[raw]}=await pool.query('SELECT COUNT(*)::integer AS count FROM source_records');assert.equal(raw.count,1030);
});

test('repeat startup preserves edits/cancellations and source evidence is immutable',async()=>{
  const source=await readHistoricalSource();const original=source.payload.bookings[0];
  const book=(await call('/bookings')).data.find(b=>b.sourceId===sourceBookingId(original.sourceBookingId));
  const edit=await call(`/bookings/${book.bookingId}`,'PUT',{holderFirstName:'Edited',holderLastName:book.holderLastName,holderCountry:book.holderCountry,guestCount:null,guests:[],roomNumbers:book.roomNumbers,arrival:book.arrival,nights:book.nights,version:book.version});
  assert.equal(edit.status,200);assert.equal(edit.data.guestCount,null);assert.equal(edit.data.pricingMode,'nightly-calculated');
  await call(`/bookings/${book.bookingId}`,'DELETE');
  const before=(await call(`/bookings/${book.bookingId}`)).data;
  await initialize(pool);assert.deepEqual((await call(`/bookings/${book.bookingId}`)).data,before);
  const {rows:[raw]}=await pool.query('SELECT original_payload FROM source_records WHERE source_id=$1',[book.sourceId]);assert.equal(raw.original_payload.totalPrice,original.totalPrice);
  await assert.rejects(pool.query('UPDATE source_records SET checksum=$1 WHERE source_id=$2',['changed',book.sourceId]),/immutable/);
  await assert.rejects(pool.query('DELETE FROM historical_imports WHERE version=$1',[IMPORT_VERSION]),/immutable/);
  assert.equal((await pool.query('SELECT COUNT(*)::integer AS count FROM bookings')).rows[0].count,1001);
});

test('failed placement rolls back all imported records and can be retried after fixing the fixture',async()=>{
  const fault=await schemaPool();
  try{
    await initialize(fault.pool,{history:false});
    const removed=(await fault.pool.query("DELETE FROM rooms WHERE room_type='Spa Executive' RETURNING *")).rows;
    await assert.rejects(initialize(fault.pool),/Cannot place source booking/);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM bookings')).rows[0].n,0);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM source_records')).rows[0].n,0);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM historical_imports')).rows[0].n,0);
    for(const r of removed)await fault.pool.query('INSERT INTO rooms(room_number,room_type,synthetic) VALUES($1,$2,$3)',[r.room_number,r.room_type,r.synthetic]);
    await initialize(fault.pool);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM bookings')).rows[0].n,1000);
  }finally{await fault.pool.end();await admin.query(`DROP SCHEMA ${fault.name} CASCADE`);}
});

test('a late database failure rolls back imported bookings, sales and evidence together',async()=>{
  const fault=await schemaPool();
  try{
    await initialize(fault.pool,{history:false});
    await fault.pool.query("INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue) VALUES('2024-01-01',1,5,72.47,362.35)");
    await fault.pool.query("CREATE FUNCTION reject_import_marker() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Simulated import completion failure'; END; $$");
    await fault.pool.query('CREATE TRIGGER fail_import_completion BEFORE INSERT ON historical_imports FOR EACH ROW EXECUTE FUNCTION reject_import_marker()');
    await assert.rejects(initialize(fault.pool),/Simulated import completion failure/);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM bookings')).rows[0].n,0);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM source_records')).rows[0].n,0);
    assert.equal((await fault.pool.query('SELECT COUNT(*)::integer AS n FROM historical_imports')).rows[0].n,0);
    const {rows:sales}=await fault.pool.query('SELECT quantity,exact_revenue FROM daily_bar_sales');
    assert.deepEqual(sales,[{quantity:5,exact_revenue:'362.35'}]);
  }finally{await fault.pool.end();await admin.query(`DROP SCHEMA ${fault.name} CASCADE`);}
});
