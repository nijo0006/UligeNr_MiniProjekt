import assert from 'node:assert/strict';
import {assignHistoricalBookings,distributeHistoricalBar,GENERATOR_VERSION} from './historyGenerator.js';
import {toMinor,seasonFor} from '../services/pricing.js';
export const CORRECTION_VERSION='hotel-workbook-2026-correction-v2';
const DAY=86400000;

async function totals(db){
  const {rows:[row]}=await db.query(`SELECT
    (SELECT COUNT(*)::integer FROM bookings WHERE source_id IS NOT NULL) AS bookings,
    (SELECT SUM(total_price)::text FROM bookings WHERE source_id IS NOT NULL) AS revenue,
    (SELECT COUNT(*)::integer FROM room_nights n JOIN bookings b ON b.id=n.booking_id WHERE b.source_id IS NOT NULL) AS nights,
    (SELECT SUM(exact_charge)::text FROM room_nights n JOIN bookings b ON b.id=n.booking_id WHERE b.source_id IS NOT NULL) AS charges`);
  return row;
}

// Runs in initialize()'s transaction/advisory lock. Do not update immutable v1 evidence.
export async function correctLegacySourceYear(db,source,legacy){
  const {rows:[already]}=await db.query('SELECT source_checksum,summary FROM historical_imports WHERE version=$1',[CORRECTION_VERSION]);
  if(already){assert.equal(already.source_checksum,source.workbookSha256);return already.summary;}
  if(legacy.years?.length===1&&legacy.years[0]===2026)return legacy;
  assert.deepEqual(legacy.years,[2024,2025,2026],'Unexpected legacy source period');
  await db.query('LOCK TABLE bookings IN SHARE ROW EXCLUSIVE MODE');
  const {rows:rooms}=await db.query('SELECT room_number AS "roomNumber",room_type AS "roomType" FROM rooms ORDER BY room_number FOR UPDATE');
  await db.query('LOCK TABLE daily_bar_sales IN SHARE ROW EXCLUSIVE MODE');
  const before=await totals(db);
  const {rows:imported}=await db.query(`SELECT b.id,b.source_id,b.arrival,b.departure,b.synthetic_dates,b.synthetic_room_assignment,b.pricing_mode,
    s.original_payload FROM bookings b JOIN source_records s ON s.source_id=b.source_id WHERE s.record_kind='booking' ORDER BY s.source_row`);
  const movable=imported.filter(b=>b.synthetic_dates&&b.synthetic_room_assignment&&b.pricing_mode==='source-preserved');
  const ids=movable.map(b=>b.id);
  for(const b of imported.filter(b=>!ids.includes(b.id))){
    assert.ok(b.arrival>='2026-01-01'&&b.departure<='2027-01-01',`Edited source booking ${b.id} needs an explicit date review before automatic year correction.`);
  }
  const {rows:occupied}=await db.query(`SELECT br.room_number AS "roomNumber",b.arrival,b.departure
    FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id WHERE b.status='active' AND NOT (b.id=ANY($1::bigint[]))`,[ids]);
  const plan=assignHistoricalBookings(movable.map(b=>b.original_payload),rooms,occupied);
  const bySource=new Map(movable.map(b=>[b.source_id,b.id]));

  // Preserve current source-linked amounts, including any daily quantity corrections.
  const {rows:barBefore}=await db.query(`SELECT source_id,drink_id AS "drinkId",unit_price_snapshot AS "unitPrice",
    SUM(quantity)::bigint AS units,SUM(exact_revenue)::text AS revenue
    FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY source_id,drink_id,unit_price_snapshot ORDER BY source_id`);
  assert.equal(new Set(barBefore.map(r=>r.source_id)).size,barBefore.length,'Source bar rows have inconsistent saved prices');
  const {rows:menu}=await db.query('SELECT id AS "drinkId",name,category FROM drinks');
  const {rows:manualSales}=await db.query('SELECT sales_date AS "salesDate",drink_id AS "drinkId" FROM daily_bar_sales WHERE source_id IS NULL');
  const rawBar=new Map(source.payload.bar.map(b=>[`hotel-workbook-history-v1:bar:${b.sourceRow}`,b]));
  const barRecords=barBefore.map(b=>{
    const raw=rawBar.get(b.source_id);assert.ok(raw,'Unknown source bar identity');
    assert.equal(toMinor(b.revenue),toMinor(b.unitPrice)*b.units,'Inconsistent saved bar amounts');
    return {...raw,units:b.units,unitPrice:b.unitPrice,revenue:b.revenue};
  });
  const sales=distributeHistoricalBar(barRecords,menu,manualSales);
  await db.query('DELETE FROM room_nights WHERE booking_id=ANY($1::bigint[])',[ids]);
  await db.query('DELETE FROM booking_rooms WHERE booking_id=ANY($1::bigint[])',[ids]);
  const allocations=[],nights=[];
  for(const b of plan){
    const id=bySource.get(b.sourceId);assert.ok(id);
    await db.query('UPDATE bookings SET arrival=$1,departure=$2,version=version+1 WHERE id=$3',[b.arrival,b.departure,id]);
    allocations.push({booking_id:id,room_number:b.roomNumber,room_total:b.totalPrice});
    for(let i=0;i<b.nights;i++){
      const date=new Date(Date.parse(b.arrival+'T00:00:00Z')+i*DAY);
      assert.equal(seasonFor(date),b.season);
      nights.push({booking_id:id,room_number:b.roomNumber,night_date:date.toISOString().slice(0,10),season:b.season,exact_charge:b.nightlyPrice});
    }
  }
  await db.query(`INSERT INTO booking_rooms(booking_id,room_number,room_total)
    SELECT booking_id,room_number,room_total FROM jsonb_to_recordset($1::jsonb) AS r(booking_id bigint,room_number text,room_total numeric)`,[JSON.stringify(allocations)]);
  await db.query(`INSERT INTO room_nights(booking_id,room_number,night_date,season,exact_charge)
    SELECT booking_id,room_number,night_date,season,exact_charge FROM jsonb_to_recordset($1::jsonb)
    AS r(booking_id bigint,room_number text,night_date date,season text,exact_charge numeric)`,[JSON.stringify(nights)]);
  await db.query('DELETE FROM daily_bar_sales WHERE source_id IS NOT NULL');
  await db.query(`INSERT INTO daily_bar_sales(sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue,synthetic,source_id)
    SELECT sales_date,drink_id,quantity,price,revenue,TRUE,source_id FROM jsonb_to_recordset($1::jsonb)
    AS r(sales_date date,drink_id integer,quantity bigint,price numeric,revenue numeric,source_id text)`,[JSON.stringify(sales.map(s=>({sales_date:s.salesDate,drink_id:s.drinkId,quantity:s.quantity,price:s.unitPrice,revenue:s.revenue,source_id:s.sourceId})))]);
  assert.deepEqual(await totals(db),before,'Year correction changed booking totals');
  const {rows:barAfter}=await db.query(`SELECT source_id,drink_id AS "drinkId",unit_price_snapshot AS "unitPrice",
    SUM(quantity)::bigint AS units,SUM(exact_revenue)::text AS revenue
    FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY source_id,drink_id,unit_price_snapshot ORDER BY source_id`);
  assert.deepEqual(barAfter,barBefore,'Year correction changed saved bar totals');
  const {rows:[invalid]}=await db.query(`SELECT
    (SELECT COUNT(*)::integer FROM room_nights n JOIN bookings b ON b.id=n.booking_id WHERE b.source_id IS NOT NULL AND (n.night_date<'2026-01-01' OR n.night_date>='2027-01-01')) AS nights,
    (SELECT COUNT(*)::integer FROM daily_bar_sales WHERE source_id IS NOT NULL AND (sales_date<'2026-01-01' OR sales_date>='2027-01-01')) AS sales`);
  assert.deepEqual(invalid,{nights:0,sales:0});
  const {rows:overlaps}=await db.query(`SELECT a.id FROM booking_rooms ar JOIN bookings a ON a.id=ar.booking_id
    JOIN booking_rooms br ON br.room_number=ar.room_number JOIN bookings b ON b.id=br.booking_id
    WHERE a.id<b.id AND a.status='active' AND b.status='active' AND a.arrival<b.departure AND a.departure>b.arrival
    AND (a.source_id IS NOT NULL OR b.source_id IS NOT NULL) LIMIT 1`);
  assert.equal(overlaps.length,0,'Year correction would create overlapping room bookings');
  const {rows:bookingsByYear}=await db.query(`SELECT EXTRACT(YEAR FROM arrival)::integer AS year,COUNT(*)::integer AS bookings,SUM(total_price)::text AS revenue FROM bookings WHERE source_id IS NOT NULL GROUP BY 1 ORDER BY 1`);
  const {rows:barByYear}=await db.query(`SELECT EXTRACT(YEAR FROM sales_date)::integer AS year,SUM(quantity)::integer AS units,SUM(exact_revenue)::text AS revenue FROM daily_bar_sales WHERE source_id IS NOT NULL GROUP BY 1 ORDER BY 1`);
  const summary={...legacy,generatorVersion:GENERATOR_VERSION,years:[2026],correctedFromYears:legacy.years,
    generatedDailyBarRows:sales.length,bookingsByYear,barByYear,correctionVersion:CORRECTION_VERSION};
  await db.query('INSERT INTO historical_imports(version,source_checksum,generator_version,summary) VALUES($1,$2,$3,$4)',[CORRECTION_VERSION,source.workbookSha256,GENERATOR_VERSION,JSON.stringify(summary)]);
  console.log('Workbook source year corrected to 2026; saved totals preserved.');
  return summary;
}
