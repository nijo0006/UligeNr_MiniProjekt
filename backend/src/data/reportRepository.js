export class ReportRepository {
  constructor(database) { this.database = database; }

  async history() {
    const {rows}=await this.database.query("SELECT summary FROM historical_imports WHERE version='hotel-workbook-history-v1'");
    return rows.length ? {state:'imported',...rows[0].summary} : {state:'not_imported'};
  }

  async annualRoomRevenue(start, end) {
    // Each room-night contributes once, including stays spanning New Year.
    // SUM deliberately remains null when there are no eligible nights.
    const { rows } = await this.database.query(`
      SELECT SUM(rn.exact_charge)::text AS "roomRevenue", COALESCE(BOOL_OR(b.synthetic_dates OR b.synthetic_room_assignment),FALSE) AS "containsSyntheticData"
      FROM room_nights rn
      JOIN bookings b ON b.id = rn.booking_id
      WHERE b.status = 'active'
        AND rn.night_date >= $1::date
        AND rn.night_date < $2::date`, [start, end]);
    return rows[0];
  }
}
