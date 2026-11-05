export class BookingRepository {
  constructor(database) { this.database = database; }
  async transaction(work) {
    for (let attempt = 0; ; attempt++) {
      const connection = await this.database.connect();
      try {
        await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED');
        const result = await work(new BookingRepository(connection));
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK');
        if (!['40P01', '40001', '55P03'].includes(error.code) || attempt >= 2) throw error;
      } finally { connection.release(); }
    }
  }
  async ready() { await this.database.query('SELECT 1'); }
  async catalog() {
    const { rows: types } = await this.database.query('SELECT name FROM room_types ORDER BY name');
    const { rows: countries } = await this.database.query('SELECT name FROM countries ORDER BY name');
    const { rows: rates } = await this.database.query('SELECT room_type AS "roomType", season, nightly_price AS "nightlyPrice" FROM seasonal_rates ORDER BY room_type, season');
    return { roomTypes: types.map(r => r.name), countries: countries.map(r => r.name), rates, drinkCategories: ['Cocktails', 'Coffee', 'Wine', 'Beer'] };
  }
  async countryExists(name) {
    const { rows } = await this.database.query('SELECT name FROM countries WHERE name = $1', [name]);
    return rows.length > 0;
  }
  async rooms({ arrival, departure, roomType, excludeBookingId = 0 } = {}) {
    let sql = 'SELECT r.room_number AS "roomNumber", r.room_type AS "roomType", r.synthetic FROM rooms r WHERE 1=1';
    const args = [];
    if (roomType) { args.push(roomType); sql += ` AND r.room_type = $${args.length}`; }
    if (arrival && departure) {
      sql += ` AND NOT EXISTS (SELECT 1 FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id
        WHERE br.room_number=r.room_number AND b.status<>'cancelled' AND b.id<>$${args.length + 1} AND b.arrival < $${args.length + 2} AND b.departure > $${args.length + 3})`;
      args.push(excludeBookingId, departure, arrival);
    }
    sql += ' ORDER BY r.room_number';
    const { rows } = await this.database.query(sql, args);
    return rows.map(r => ({ ...r, synthetic: Boolean(r.synthetic) }));
  }
  async lockRooms(numbers) {
    const result = [];
    // Fixed lock order serializes writers even when there are no existing allocations.
    for (const number of [...numbers].sort()) {
      const { rows } = await this.database.query('SELECT room_number AS "roomNumber", room_type AS "roomType" FROM rooms WHERE room_number = $1 FOR UPDATE', [number]);
      result.push(...rows);
    }
    return result;
  }
  async overlaps(numbers, arrival, departure, excludedId = 0) {
    for (const number of numbers) {
      const { rows } = await this.database.query(`SELECT b.id FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id
        WHERE br.room_number=$1 AND b.status<>'cancelled' AND b.id<>$2 AND b.arrival<$3 AND b.departure>$4 LIMIT 1`, [number, excludedId, departure, arrival]);
      if (rows.length) return number;
    }
    return null;
  }
  async hydrate(rows) {
    if (!rows.length) return [];
    const ids=rows.map(r=>r.id);
    const roomResult=await this.database.query('SELECT booking_id,room_number FROM booking_rooms WHERE booking_id=ANY($1::bigint[]) ORDER BY room_number',[ids]);
    const guestResult=await this.database.query('SELECT booking_id,first_name AS "firstName",last_name AS "lastName" FROM booking_guests WHERE booking_id=ANY($1::bigint[]) ORDER BY id',[ids]);
    const nightResult=await this.database.query('SELECT booking_id,room_number AS "roomNumber",night_date AS date,season,exact_charge AS charge FROM room_nights WHERE booking_id=ANY($1::bigint[]) ORDER BY room_number,night_date',[ids]);
    const group=result=>{const map=new Map();for(const {booking_id,...row} of result.rows){if(!map.has(booking_id))map.set(booking_id,[]);map.get(booking_id).push(row);}return map;};
    const rooms=group(roomResult),guests=group(guestResult),charges=group(nightResult);
    return rows.map(row=>({bookingId:row.id,holderFirstName:row.holder_first_name,holderLastName:row.holder_last_name,holderEmail:row.holder_email,
      holderCountry:row.holder_country,guestCount:row.guest_count,guests:guests.get(row.id)??[],
      roomNumbers:(rooms.get(row.id)??[]).map(r=>r.room_number),arrival:row.arrival,departure:row.departure,
      nights:row.nights,version:row.version,status:row.status,totalPrice:row.total_price,
      nightCharges:charges.get(row.id)??[],syntheticDates:row.synthetic_dates,
      syntheticRoomAssignment:row.synthetic_room_assignment,sourceId:row.source_id,pricingMode:row.pricing_mode,
      completedAt:row.completed_at??null}));
  }
  async get(id,lock=false) {
    const {rows}=await this.database.query(`SELECT * FROM bookings WHERE id=$1${lock?' FOR UPDATE':''}`,[id]);
    return (await this.hydrate(rows))[0]??null;
  }
  async list() {
    const {rows}=await this.database.query("SELECT * FROM bookings WHERE status<>'cancelled' ORDER BY id DESC");
    return this.hydrate(rows);
  }
  async create(data, calculation) {
    const result = await this.database.query(`INSERT INTO bookings
      (holder_first_name,holder_last_name,holder_country,guest_count,arrival,departure,nights,total_price,holder_email)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [data.holderFirstName, data.holderLastName, data.holderCountry, data.guestCount, data.arrival, calculation.departure, data.nights, calculation.totalPrice, data.holderEmail]);
    await this.writeDetails(result.rows[0].id, data, calculation);
    return this.get(result.rows[0].id);
  }
  async update(id, data, calculation) {
    const result = await this.database.query(`UPDATE bookings SET holder_first_name=$1,holder_last_name=$2,holder_country=$3,guest_count=$4,arrival=$5,departure=$6,nights=$7,total_price=$8,version=version+1,pricing_mode='nightly-calculated',synthetic_guest_count=(synthetic_guest_count AND guest_count IS NOT DISTINCT FROM $4),synthetic_dates=$11,synthetic_room_assignment=$12,holder_email=$13 WHERE id=$9 AND version=$10 AND status<>'cancelled'`,
      [data.holderFirstName,data.holderLastName,data.holderCountry,data.guestCount,data.arrival,calculation.departure,data.nights,calculation.totalPrice,id,data.version,calculation.syntheticDates,calculation.syntheticRoomAssignment,data.holderEmail]);
    if (result.rowCount !== 1) throw new Error('Locked booking version unexpectedly changed.');
    await this.database.query('DELETE FROM room_nights WHERE booking_id=$1', [id]);
    await this.database.query('DELETE FROM booking_rooms WHERE booking_id=$1', [id]);
    await this.database.query('DELETE FROM booking_guests WHERE booking_id=$1', [id]);
    await this.writeDetails(id, data, calculation);
    return this.get(id);
  }
  async writeDetails(id, data, calculation) {
    for (const room of calculation.roomTotals) await this.database.query('INSERT INTO booking_rooms (booking_id,room_number,room_total) VALUES ($1,$2,$3)', [id,room.roomNumber,room.total]);
    for (const night of calculation.nightCharges) await this.database.query('INSERT INTO room_nights (booking_id,room_number,night_date,season,exact_charge) VALUES ($1,$2,$3,$4,$5)', [id,night.roomNumber,night.date,night.season,night.charge]);
    for (const guest of data.guests) await this.database.query('INSERT INTO booking_guests (booking_id,first_name,last_name) VALUES ($1,$2,$3)', [id,guest.firstName,guest.lastName]);
  }
  async complete(id) {
    await this.database.query("UPDATE bookings SET status='completed',completed_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$1 AND status='active'", [id]);
    return this.get(id);
  }
  async createInvitation(bookingId, token, email) {
    await this.database.query('INSERT INTO satisfaction_invitations (booking_id,token,email) VALUES ($1,$2,$3)', [bookingId, token, email]);
  }
  async invitation(bookingId) {
    const { rows } = await this.database.query('SELECT token,email,sent_at AS "sentAt",send_error AS "sendError" FROM satisfaction_invitations WHERE booking_id=$1', [bookingId]);
    return rows[0] ?? null;
  }
  async markInvitation(bookingId, error) {
    await this.database.query(error
      ? 'UPDATE satisfaction_invitations SET send_error=$2 WHERE booking_id=$1'
      : 'UPDATE satisfaction_invitations SET sent_at=CURRENT_TIMESTAMP,send_error=NULL WHERE booking_id=$1', error ? [bookingId, error] : [bookingId]);
  }
  async cancel(id) {
    await this.database.query("UPDATE bookings SET status='cancelled',version=version+1 WHERE id=$1 AND status='active'", [id]);
    return this.get(id);
  }
}
