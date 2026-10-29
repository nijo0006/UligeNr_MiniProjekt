export class BookingRepository {
  constructor(database) { this.database = database; }
  async transaction(work) {
    for (let attempt = 0; ; attempt++) {
      const connection = await this.database.getConnection();
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();
        const result = await work(new BookingRepository(connection));
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        if (!['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code) || attempt >= 2) throw error;
      } finally { connection.release(); }
    }
  }
  async ready() { await this.database.execute('SELECT 1'); }
  async catalog() {
    const [types] = await this.database.execute('SELECT name FROM room_types ORDER BY name');
    const [countries] = await this.database.execute('SELECT name FROM countries ORDER BY name');
    const [rates] = await this.database.execute('SELECT room_type AS roomType, season, nightly_price AS nightlyPrice FROM seasonal_rates ORDER BY room_type, season');
    return { roomTypes: types.map(r => r.name), countries: countries.map(r => r.name), rates, drinkCategories: ['Cocktails', 'Coffee', 'Wine', 'Beer'] };
  }
  async countryExists(name) {
    const [rows] = await this.database.execute('SELECT name FROM countries WHERE BINARY name = ?', [name]);
    return rows.length > 0;
  }
  async rooms({ arrival, departure, roomType, excludeBookingId = 0 } = {}) {
    let sql = 'SELECT r.room_number AS roomNumber, r.room_type AS roomType, r.synthetic FROM rooms r WHERE 1=1';
    const args = [];
    if (roomType) { sql += ' AND r.room_type = ?'; args.push(roomType); }
    if (arrival && departure) {
      sql += ` AND NOT EXISTS (SELECT 1 FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id
        WHERE br.room_number=r.room_number AND b.status='active' AND b.id<>? AND b.arrival < ? AND b.departure > ?)`;
      args.push(excludeBookingId, departure, arrival);
    }
    sql += ' ORDER BY r.room_number';
    const [rows] = await this.database.execute(sql, args);
    return rows.map(r => ({ ...r, synthetic: Boolean(r.synthetic) }));
  }
  async lockRooms(numbers) {
    const result = [];
    // Fixed lock order serializes writers even when there are no existing allocations.
    for (const number of [...numbers].sort()) {
      const [rows] = await this.database.execute('SELECT room_number AS roomNumber, room_type AS roomType FROM rooms WHERE room_number = ? FOR UPDATE', [number]);
      result.push(...rows);
    }
    return result;
  }
  async overlaps(numbers, arrival, departure, excludedId = 0) {
    for (const number of numbers) {
      const [rows] = await this.database.execute(`SELECT b.id FROM booking_rooms br JOIN bookings b ON b.id=br.booking_id
        WHERE br.room_number=? AND b.status='active' AND b.id<>? AND b.arrival<? AND b.departure>? LIMIT 1`, [number, excludedId, departure, arrival]);
      if (rows.length) return number;
    }
    return null;
  }
  async get(id, lock = false) {
    const [rows] = await this.database.execute(`SELECT * FROM bookings WHERE id=?${lock ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) return null;
    const row = rows[0];
    const [rooms] = await this.database.execute('SELECT room_number FROM booking_rooms WHERE booking_id=? ORDER BY room_number', [id]);
    const [guests] = await this.database.execute('SELECT first_name AS firstName,last_name AS lastName FROM booking_guests WHERE booking_id=? ORDER BY id', [id]);
    const [charges] = await this.database.execute('SELECT room_number AS roomNumber,night_date AS date,season,exact_charge AS charge FROM room_nights WHERE booking_id=? ORDER BY room_number,night_date', [id]);
    return { bookingId: row.id, holderFirstName: row.holder_first_name, holderLastName: row.holder_last_name,
      holderCountry: row.holder_country, guestCount: row.guest_count, guests,
      roomNumbers: rooms.map(r => r.room_number), arrival: row.arrival, departure: row.departure,
      nights: row.nights, version: row.version, status: row.status, totalPrice: row.total_price,
      nightCharges: charges, syntheticDates: Boolean(row.synthetic_dates),
      syntheticRoomAssignment: Boolean(row.synthetic_room_assignment), sourceId: row.source_id };
  }
  async list() {
    const [rows] = await this.database.execute("SELECT id FROM bookings WHERE status='active' ORDER BY id DESC");
    return Promise.all(rows.map(row => this.get(row.id)));
  }
  async create(data, calculation) {
    const [result] = await this.database.execute(`INSERT INTO bookings
      (holder_first_name,holder_last_name,holder_country,guest_count,arrival,departure,nights,total_price)
      VALUES (?,?,?,?,?,?,?,?)`, [data.holderFirstName, data.holderLastName, data.holderCountry, data.guestCount, data.arrival, calculation.departure, data.nights, calculation.totalPrice]);
    await this.writeDetails(result.insertId, data, calculation);
    return this.get(result.insertId);
  }
  async update(id, data, calculation) {
    const [result] = await this.database.execute(`UPDATE bookings SET holder_first_name=?,holder_last_name=?,holder_country=?,guest_count=?,arrival=?,departure=?,nights=?,total_price=?,version=version+1 WHERE id=? AND version=? AND status='active'`,
      [data.holderFirstName,data.holderLastName,data.holderCountry,data.guestCount,data.arrival,calculation.departure,data.nights,calculation.totalPrice,id,data.version]);
    if (result.affectedRows !== 1) throw new Error('Locked booking version unexpectedly changed.');
    await this.database.execute('DELETE FROM room_nights WHERE booking_id=?', [id]);
    await this.database.execute('DELETE FROM booking_rooms WHERE booking_id=?', [id]);
    await this.database.execute('DELETE FROM booking_guests WHERE booking_id=?', [id]);
    await this.writeDetails(id, data, calculation);
    return this.get(id);
  }
  async writeDetails(id, data, calculation) {
    for (const room of calculation.roomTotals) await this.database.execute('INSERT INTO booking_rooms (booking_id,room_number,room_total) VALUES (?,?,?)', [id,room.roomNumber,room.total]);
    for (const night of calculation.nightCharges) await this.database.execute('INSERT INTO room_nights (booking_id,room_number,night_date,season,exact_charge) VALUES (?,?,?,?,?)', [id,night.roomNumber,night.date,night.season,night.charge]);
    for (const guest of data.guests) await this.database.execute('INSERT INTO booking_guests (booking_id,first_name,last_name) VALUES (?,?,?)', [id,guest.firstName,guest.lastName]);
  }
  async cancel(id) {
    await this.database.execute("UPDATE bookings SET status='cancelled',version=version+1 WHERE id=? AND status='active'", [id]);
    return this.get(id);
  }
}
