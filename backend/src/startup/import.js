import {correctLegacySourceYear} from './correctSourceYear.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {toMinor,money,seasonFor} from '../services/pricing.js';
import {assignHistoricalBookings,distributeHistoricalBar,IMPORT_VERSION,GENERATOR_VERSION,sourceBarId} from './historyGenerator.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const DAY=86_400_000;

export async function readHistoricalSource(){
  const source=JSON.parse(await readFile(new URL('./workbook-history.json',import.meta.url),'utf8'));
  assert.equal(sha(JSON.stringify(source.payload)),source.payloadSha256,'Historical source checksum mismatch');
  const {bookings,bar}=source.payload;
  assert.equal(bookings.length,1000);assert.equal(new Set(bookings.map(b=>b.sourceBookingId)).size,1000);
  assert.equal(bar.length,30);assert.equal(new Set(bar.map(b=>b.name)).size,30);
  assert.equal(bookings.reduce((a,b)=>a+b.nights,0),5379);
  assert.equal(money(bookings.reduce((a,b)=>a+toMinor(b.totalPrice),0)),'11234034.00');
  assert.equal(bar.reduce((a,b)=>a+b.units,0),179958);
  assert.equal(money(bar.reduce((a,b)=>a+toMinor(b.revenue),0)),'13448640.34');
  for(const row of bookings){
    assert.ok(Number.isInteger(row.nights)&&row.nights>0&&['low','mid','high'].includes(row.season));
    assert.equal(toMinor(row.nightlyPrice)*row.nights,toMinor(row.totalPrice));
  }
  for(const row of bar)assert.equal(toMinor(row.unitPrice)*row.units,toMinor(row.revenue));
  return source;
}

async function protectEvidence(connection){
  await connection.query(`CREATE OR REPLACE FUNCTION reject_history_evidence_change() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'Historical source evidence is immutable' USING ERRCODE='55000'; END; $$`);
  for(const table of ['source_records','historical_imports']){
    await connection.query(`CREATE OR REPLACE TRIGGER preserve_history_evidence BEFORE UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION reject_history_evidence_change()`);
  }
}

// Uses the startup transaction/advisory lock. Any failed validation rolls back everything.
export async function importHistoricalData(connection){
  const source=await readHistoricalSource();
  const {rows:prior}=await connection.query('SELECT source_checksum,summary FROM historical_imports WHERE version=$1',[IMPORT_VERSION]);
  if(prior.length){
    assert.equal(prior[0].source_checksum,source.workbookSha256,'Historical workbook changed: use a new reviewed import version.');
    return correctLegacySourceYear(connection,source,prior[0].summary);
  }
  // Follow the normal sorted room-lock protocol and protect concurrent daily sales.
  const {rows:rooms}=await connection.query('SELECT room_number AS "roomNumber",room_type AS "roomType" FROM rooms ORDER BY room_number FOR UPDATE');
  await connection.query('LOCK TABLE daily_bar_sales IN SHARE ROW EXCLUSIVE MODE');
  const {rows:occupied}=await connection.query(`SELECT br.room_number AS "roomNumber",b.arrival,b.departure
    FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id WHERE b.status<>'cancelled'`);
  const {rows:menu}=await connection.query('SELECT id AS "drinkId",name,category FROM drinks');
  const {rows:existingSales}=await connection.query('SELECT sales_date AS "salesDate",drink_id AS "drinkId" FROM daily_bar_sales');
  const bookings=assignHistoricalBookings(source.payload.bookings,rooms,occupied);
  const sales=distributeHistoricalBar(source.payload.bar,menu,existingSales);
  const evidence=[...bookings.map(b=>({source_id:b.sourceId,worksheet:'Bookinger',source_row:b.sourceRow,record_kind:'booking',original_payload:source.payload.bookings.find(s=>s.sourceBookingId===b.sourceBookingId)})),
    ...source.payload.bar.map(b=>({source_id:sourceBarId(b.sourceRow),worksheet:'Bar - Drinks',source_row:b.sourceRow,record_kind:'bar',original_payload:b}))]
    .map(r=>({...r,source_file:source.sourceFile,checksum:sha(JSON.stringify(r.original_payload))}));
  await connection.query(`INSERT INTO source_records (source_id,source_file,worksheet,source_row,record_kind,original_payload,checksum)
    SELECT source_id,source_file,worksheet,source_row,record_kind,original_payload,checksum FROM jsonb_to_recordset($1::jsonb)
    AS r(source_id text,source_file text,worksheet text,source_row integer,record_kind text,original_payload jsonb,checksum text)`,[JSON.stringify(evidence)]);
  const bookingRows=bookings.map(b=>({source_id:b.sourceId,first_name:b.firstName,last_name:b.lastName,country:b.country,arrival:b.arrival,departure:b.departure,nights:b.nights,total_price:b.totalPrice}));
  const {rows:inserted}=await connection.query(`INSERT INTO bookings
    (source_id,holder_first_name,holder_last_name,holder_country,guest_count,arrival,departure,nights,total_price,synthetic_dates,synthetic_room_assignment,pricing_mode)
    SELECT source_id,first_name,last_name,country,NULL,arrival,departure,nights,total_price,TRUE,TRUE,'source-preserved'
    FROM jsonb_to_recordset($1::jsonb) AS r(source_id text,first_name text,last_name text,country text,arrival date,departure date,nights bigint,total_price numeric)
    RETURNING id,source_id`,[JSON.stringify(bookingRows)]);
  const ids=new Map(inserted.map(b=>[b.source_id,b.id]));
  const allocations=bookings.map(b=>({booking_id:ids.get(b.sourceId),room_number:b.roomNumber,room_total:b.totalPrice}));
  await connection.query(`INSERT INTO booking_rooms(booking_id,room_number,room_total)
    SELECT booking_id,room_number,room_total FROM jsonb_to_recordset($1::jsonb) AS r(booking_id bigint,room_number text,room_total numeric)`,[JSON.stringify(allocations)]);
  const nights=bookings.flatMap(b=>Array.from({length:b.nights},(_,i)=>({booking_id:ids.get(b.sourceId),room_number:b.roomNumber,night_date:new Date(Date.parse(b.arrival+'T00:00:00Z')+i*DAY).toISOString().slice(0,10),season:b.season,exact_charge:b.nightlyPrice})));
  await connection.query(`INSERT INTO room_nights(booking_id,room_number,night_date,season,exact_charge)
    SELECT booking_id,room_number,night_date,season,exact_charge FROM jsonb_to_recordset($1::jsonb)
    AS r(booking_id bigint,room_number text,night_date date,season text,exact_charge numeric)`,[JSON.stringify(nights)]);
  await connection.query(`INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue,synthetic,source_id)
    SELECT sales_date,drink_id,quantity,unit_price,exact_revenue,TRUE,source_id FROM jsonb_to_recordset($1::jsonb)
    AS r(sales_date date,drink_id integer,quantity bigint,unit_price numeric,exact_revenue numeric,source_id text)`,[JSON.stringify(sales.map(s=>({sales_date:s.salesDate,drink_id:s.drinkId,quantity:s.quantity,unit_price:s.unitPrice,exact_revenue:s.revenue,source_id:s.sourceId})))]);

  const {rows:[bookingCheck]}=await connection.query(`SELECT COUNT(*)::integer AS count,SUM(b.total_price)::text AS revenue,
    SUM(b.nights)::integer AS nights FROM bookings b JOIN source_records s ON s.source_id=b.source_id WHERE s.record_kind='booking'`);
  assert.deepEqual(bookingCheck,{count:1000,revenue:'11234034.00',nights:5379});
  const {rows:bookChecks}=await connection.query(`SELECT b.id FROM bookings b JOIN source_records s ON s.source_id=b.source_id
    JOIN booking_rooms br ON br.booking_id=b.id JOIN rooms r ON r.room_number=br.room_number
    WHERE s.record_kind='booking' AND (b.guest_count IS NOT NULL OR b.total_price<>(s.original_payload->>'totalPrice')::numeric
    OR b.nights<>(s.original_payload->>'nights')::integer OR r.room_type<>s.original_payload->>'roomType'
    OR NOT b.synthetic_dates OR NOT b.synthetic_room_assignment OR b.arrival<'2026-01-01' OR b.departure>'2027-01-01')`);
  assert.equal(bookChecks.length,0,'Historical booking values or provenance changed');
  const {rows:[nightCheck]}=await connection.query(`SELECT COUNT(*)::integer AS count,SUM(rn.exact_charge)::text AS revenue
    FROM room_nights rn JOIN bookings b ON b.id=rn.booking_id JOIN source_records s ON s.source_id=b.source_id WHERE s.record_kind='booking'`);
  assert.deepEqual(nightCheck,{count:5379,revenue:'11234034.00'});
  for(const night of nights)assert.equal(seasonFor(new Date(night.night_date+'T00:00:00Z')),night.season);
  const {rows:overlap}=await connection.query(`SELECT a.id FROM booking_rooms ar JOIN bookings a ON a.id=ar.booking_id
    JOIN booking_rooms br ON br.room_number=ar.room_number JOIN bookings b ON b.id=br.booking_id
    WHERE a.id<b.id AND a.status<>'cancelled' AND b.status<>'cancelled' AND a.arrival<b.departure AND a.departure>b.arrival
    AND (a.source_id IS NOT NULL OR b.source_id IS NOT NULL) LIMIT 1`);
  assert.equal(overlap.length,0,'Historical import would create overlapping room bookings');
  const {rows:barChecks}=await connection.query(`SELECT s.source_id,SUM(s.quantity)::integer AS units,SUM(s.exact_revenue)::text AS revenue
    FROM daily_bar_sales s WHERE s.source_id IS NOT NULL GROUP BY s.source_id`);
  for(const record of source.payload.bar){
    const actual=barChecks.find(b=>b.source_id===sourceBarId(record.sourceRow));
    assert.ok(actual);assert.equal(actual.units,record.units);assert.equal(actual.revenue,record.revenue);
  }
  assert.equal(barChecks.length,30);
  const {rows:bookingsByYear}=await connection.query(`SELECT EXTRACT(YEAR FROM b.arrival)::integer AS year,COUNT(*)::integer AS bookings,SUM(b.total_price)::text AS revenue
    FROM bookings b JOIN source_records s ON s.source_id=b.source_id WHERE s.record_kind='booking' GROUP BY 1 ORDER BY 1`);
  const {rows:barByYear}=await connection.query(`SELECT EXTRACT(YEAR FROM sales_date)::integer AS year,SUM(quantity)::integer AS units,SUM(exact_revenue)::text AS revenue
    FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY 1 ORDER BY 1`);
  const summary={sourceFile:source.sourceFile,sourceChecksum:source.workbookSha256,generatorVersion:GENERATOR_VERSION,years:[2026],
    sourceTotals:{bookings:1000,roomNights:5379,roomRevenue:'11234034.00',barUnits:179958,barRevenue:'13448640.34'},
    generatedDailyBarRows:sales.length,bookingsByYear,barByYear};
  await connection.query('INSERT INTO historical_imports(version,source_checksum,generator_version,summary) VALUES ($1,$2,$3,$4)',[IMPORT_VERSION,source.workbookSha256,GENERATOR_VERSION,JSON.stringify(summary)]);
  await protectEvidence(connection);
  console.log('Historical workbook import verified:',summary.sourceTotals);
  return summary;
}
