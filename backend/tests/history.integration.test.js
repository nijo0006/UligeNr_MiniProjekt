import { SatisfactionRepository } from '../src/data/satisfactionRepository.js';
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
  server=(await createApp(new BookingRepository(pool),new ReportRepository(pool),new BarRepository(pool), new SatisfactionRepository(pool))).listen(0,'0.0.0.0');
  await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}/api`;
  const room=(await call('/rooms')).data.find(r=>r.roomType==='Spa Executive');
  existing=(await call('/bookings','POST',{holderFirstName:'Existing',holderLastName:'Preserved',holderEmail:'existing@example.com',holderCountry:'Denmark',guestCount:2,roomNumbers:[room.roomNumber],arrival:'2024-04-01',nights:1})).data;
  existingBar=(await call('/bar-sales/2024-01-01/1','PUT',{quantity:7})).data;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await pool?.end();if(schema)await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin?.end();});

function sourceAmountForSeason(season){return {low:335407700,mid:380938700+Math.round(Number(existing.totalPrice)*100),high:407057000}[season];}

test('imports complete historical workbook, preserves existing records and reconciles annual reports',async()=>{
  await initialize(pool);
  assert.deepEqual((await call(`/bookings/${existing.bookingId}`)).data,existing);
  assert.deepEqual((await call('/bar-sales?date=2024-01-01')).data.sales.find(s=>s.drinkId===1),((({salesDate,...row})=>row)(existingBar)));
  const history=(await call('/reports/history')).data;
  assert.deepEqual(history.years,[2026]);
  assert.equal(history.state,'imported');assert.equal(history.sourceTotals.bookings,1000);assert.equal(history.sourceTotals.roomNights,5379);
  assert.equal(history.sourceTotals.roomRevenue,'11234034.00');assert.equal(history.sourceTotals.barUnits,179958);assert.equal(history.sourceTotals.barRevenue,'13448640.34');
  const list=(await call('/bookings')).data;assert.equal(list.length,1001);
  const imported=list.filter(b=>b.sourceId);assert.equal(imported.length,1000);assert.ok(imported.every(b=>b.guestCount===null&&b.syntheticDates&&b.syntheticRoomAssignment&&b.pricingMode==='source-preserved'));
  assert.ok(imported.every(b=>b.arrival>='2026-01-01'&&b.departure<='2027-01-01'));
  const annual=(await call('/reports/revenue?year=2026')).data;
  assert.equal(annual.roomRevenue,'11234034.00');assert.equal(annual.barRevenue,'13448640.34');assert.equal(annual.totalRevenue,'24682674.34');
  let roomRevenue=0,barRevenue=0,barUnits=0;
  for(const year of [2024,2025,2026]){
    roomRevenue+=Math.round(Number((await call(`/reports/revenue?year=${year}`)).data.roomRevenue)*100);
    const bar=(await call(`/reports/bar?year=${year}`)).data;assert.equal(bar.containsSyntheticData,year===2026);barRevenue+=Math.round(Number(bar.revenue)*100);barUnits+=bar.units;
  }
  assert.equal(roomRevenue,1123403400+Math.round(Number(existing.totalPrice)*100));
  assert.equal(barRevenue,1344864034+Math.round(Number(existingBar.revenue)*100));assert.equal(barUnits,179958+7);
  const countries=(await call('/reports/countries')).data;
  assert.equal(countries.reduce((sum,r)=>sum+r.bookingCount,0),1001);
  assert.equal(countries.find(r=>r.country==='South Korea').bookingCount,63);
  assert.equal(countries.find(r=>r.country==='South Korea').roomRevenue,'767699.00');
  assert.equal(countries.find(r=>r.country==='South Korea').guestCount,null);
  assert.equal(countries[0].country,'South Korea');
  const seasons=(await call('/reports/room-types-seasons')).data;
  for(const season of ['low','mid','high']){
    const expected=sourceAmountForSeason(season);
    assert.equal(seasons.filter(r=>r.season===season).reduce((sum,r)=>sum+Math.round(Number(r.roomRevenue??0)*100),0),expected);
  }
  const summary=(await call('/reports/summary')).data;
  assert.equal(summary.soldRoomNights,5380);assert.equal(summary.unknownGuestBookingCount,1000);
  assert.equal(summary.guestCount,null);assert.equal(summary.knownGuestCount,2);
  assert.equal(summary.occupancyPercent,null);assert.equal(summary.containsSyntheticData,true);
  const roomTotals=(await call('/reports/rooms')).data;
  assert.equal(roomTotals.reduce((sum,r)=>sum+Math.round(Number(r.roomRevenue??0)*100),0),roomRevenue);
  const {rows:[raw]}=await pool.query('SELECT COUNT(*)::integer AS count FROM source_records');assert.equal(raw.count,1030);
});

test('repeat startup preserves edits/cancellations and source evidence is immutable',async()=>{
  const source=await readHistoricalSource();const original=source.payload.bookings[0];
  const book=(await call('/bookings')).data.find(b=>b.sourceId===sourceBookingId(original.sourceBookingId));
  const edit=await call(`/bookings/${book.bookingId}`,'PUT',{holderFirstName:'Edited',holderLastName:book.holderLastName,holderCountry:book.holderCountry,guestCount:null,guests:[],roomNumbers:book.roomNumbers,arrival:book.arrival,nights:book.nights,version:book.version});
  assert.equal(edit.status,200);assert.equal(edit.data.guestCount,null);assert.equal(book.holderEmail,null);assert.equal(edit.data.holderEmail,null);assert.equal(edit.data.pricingMode,'nightly-calculated');
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

// Test-only fixture: reconstruct a committed v1 installation without touching live data.
async function legacyFixture(){
  const fixture=await schemaPool();await initialize(fixture.pool);
  await fixture.pool.query(`UPDATE room_nights n SET night_date=(n.night_date-make_interval(years=>(b.id%3)::integer))::date
    FROM bookings b WHERE b.id=n.booking_id AND b.source_id IS NOT NULL`);
  await fixture.pool.query(`UPDATE bookings SET arrival=(arrival-make_interval(years=>(id%3)::integer))::date,
    departure=(departure-make_interval(years=>(id%3)::integer))::date WHERE source_id IS NOT NULL`);
  await fixture.pool.query(`UPDATE daily_bar_sales SET sales_date=(sales_date-make_interval(years=>(EXTRACT(DOY FROM sales_date)::integer%3)))::date WHERE source_id IS NOT NULL`);
  await fixture.pool.query('ALTER TABLE historical_imports DISABLE TRIGGER preserve_history_evidence');
  await fixture.pool.query(`UPDATE historical_imports SET generator_version='seasonal-room-and-daily-bar-v1',
    summary=jsonb_set(jsonb_set(summary,'{years}','[2024,2025,2026]'::jsonb),'{generatorVersion}','"seasonal-room-and-daily-bar-v1"'::jsonb)`);
  await fixture.pool.query('ALTER TABLE historical_imports ENABLE TRIGGER preserve_history_evidence');
  return fixture;
}
async function storedState(db){
  const state={};
  for(const table of ['bookings','booking_rooms','room_nights','booking_guests','daily_bar_sales','source_records','historical_imports','satisfaction_responses']){
    const {rows:[row]}=await db.query(`SELECT MD5(COALESCE(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) AS hash FROM ${table} t`);state[table]=row.hash;
  }
  return state;
}

test('legacy correction keeps source IDs/statuses/totals, manual rows and immutable evidence; restart preserves later edits',async()=>{
  const fault=await legacyFixture();
  try{
    const {rows:idsBefore}=await fault.pool.query('SELECT id,source_id,total_price FROM bookings ORDER BY id');
    const {rows:[oldEvidence]}=await fault.pool.query('SELECT to_jsonb(h) AS value FROM historical_imports h');
    const sourceHash=(await storedState(fault.pool)).source_records;
    await fault.pool.query("UPDATE bookings SET status='cancelled',version=version+1 WHERE id=(SELECT MIN(id) FROM bookings)");
    const {rows:[manual]}=await fault.pool.query(`INSERT INTO bookings(holder_first_name,holder_last_name,holder_country,guest_count,arrival,departure,nights,total_price)
      VALUES('Manual','Preserved','Denmark',1,'2026-01-01','2027-01-01',365,1) RETURNING id`);
    await fault.pool.query("INSERT INTO booking_rooms VALUES($1,'001',1)",[manual.id]);
    await fault.pool.query("INSERT INTO room_nights VALUES($1,'001','2026-01-01','low',1)",[manual.id]);
    await fault.pool.query("INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue) VALUES('2026-01-01',1,5,72.47,362.35)");
    await fault.pool.query("UPDATE daily_bar_sales SET quantity=quantity+1,exact_revenue=exact_revenue+unit_price_snapshot WHERE source_id IS NOT NULL AND sales_date=(SELECT MIN(sales_date) FROM daily_bar_sales WHERE source_id IS NOT NULL) AND drink_id=1");
    const {rows:barBefore}=await fault.pool.query('SELECT source_id,SUM(quantity)::bigint AS units,SUM(exact_revenue)::text AS amount FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY source_id ORDER BY source_id');
    await initialize(fault.pool);
    const {rows:idsAfter}=await fault.pool.query('SELECT id,source_id,total_price FROM bookings WHERE source_id IS NOT NULL ORDER BY id');
    assert.deepEqual(idsAfter,idsBefore);
    assert.equal((await fault.pool.query('SELECT status FROM bookings WHERE id=$1',[idsBefore[0].id])).rows[0].status,'cancelled');
    assert.ok((await fault.pool.query("SELECT arrival FROM bookings WHERE source_id IS NOT NULL")).rows.every(r=>r.arrival.startsWith('2026')));
    assert.equal((await fault.pool.query("SELECT COUNT(*)::integer AS n FROM booking_rooms WHERE booking_id<>$1 AND room_number='001'",[manual.id])).rows[0].n,0);
    assert.equal((await fault.pool.query("SELECT source_id,quantity,exact_revenue FROM daily_bar_sales WHERE sales_date='2026-01-01' AND drink_id=1")).rows[0].exact_revenue,'362.35');
    const {rows:barAfter}=await fault.pool.query('SELECT source_id,SUM(quantity)::bigint AS units,SUM(exact_revenue)::text AS amount FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY source_id ORDER BY source_id');
    assert.deepEqual(barAfter,barBefore);
    assert.equal((await storedState(fault.pool)).source_records,sourceHash);
    assert.deepEqual((await fault.pool.query('SELECT to_jsonb(h) AS value FROM historical_imports h WHERE version=$1',[IMPORT_VERSION])).rows[0],oldEvidence);
    const correction=(await fault.pool.query("SELECT summary FROM historical_imports WHERE version='hotel-workbook-2026-correction-v2'")).rows[0].summary;
    assert.deepEqual(correction.years,[2026]);assert.equal(correction.bookingsByYear.length,1);assert.equal(correction.barByYear.length,1);
    await fault.pool.query("UPDATE bookings SET holder_first_name='Later edit',version=version+1 WHERE id=$1",[idsBefore[1].id]);
    const after=await storedState(fault.pool);await initialize(fault.pool);assert.deepEqual(await storedState(fault.pool),after);
  }finally{await fault.pool.end();await admin.query(`DROP SCHEMA ${fault.name} CASCADE`);}
});

test('legacy correction rolls back if completion fails and retries safely',async()=>{
  const fault=await legacyFixture();
  try{
    await fault.pool.query("CREATE FUNCTION reject_correction() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.version='hotel-workbook-2026-correction-v2' THEN RAISE EXCEPTION 'Correction failure'; END IF; RETURN NEW; END; $$");
    await fault.pool.query('CREATE TRIGGER fail_correction BEFORE INSERT ON historical_imports FOR EACH ROW EXECUTE FUNCTION reject_correction()');
    const before=await storedState(fault.pool);
    await assert.rejects(initialize(fault.pool),/Correction failure/);assert.deepEqual(await storedState(fault.pool),before);
    await fault.pool.query('DROP TRIGGER fail_correction ON historical_imports');await initialize(fault.pool);
    assert.equal((await fault.pool.query("SELECT COUNT(*)::integer AS n FROM historical_imports WHERE version='hotel-workbook-2026-correction-v2'")).rows[0].n,1);
  }finally{await fault.pool.end();await admin.query(`DROP SCHEMA ${fault.name} CASCADE`);}
});

test('legacy correction refuses to reset edited source bookings outside 2026',async()=>{
  const fault=await legacyFixture();
  try{
    await fault.pool.query("UPDATE bookings SET pricing_mode='nightly-calculated' WHERE arrival<'2026-01-01'");
    const before=await storedState(fault.pool);
    await assert.rejects(initialize(fault.pool),/needs an explicit date review/);
    assert.deepEqual(await storedState(fault.pool),before);
  }finally{await fault.pool.end();await admin.query(`DROP SCHEMA ${fault.name} CASCADE`);}
});
