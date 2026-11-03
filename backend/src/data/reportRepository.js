const scopedNights = `
  WITH nights AS (
    SELECT rn.*, b.holder_country, b.guest_count,
           (b.synthetic_dates OR b.synthetic_room_assignment) AS synthetic
    FROM room_nights rn JOIN bookings b ON b.id=rn.booking_id
    WHERE b.status='active' AND ($1::date IS NULL OR rn.night_date >= $1::date)
      AND ($2::date IS NULL OR rn.night_date < $2::date)
  )`;

export class ReportRepository {
  constructor(database) { this.database = database; }

  async history() {
    const {rows}=await this.database.query("SELECT summary FROM historical_imports WHERE version='hotel-workbook-history-v1'");
    return rows.length ? {state:'imported',...rows[0].summary} : {state:'not_imported'};
  }

  async annualRevenue(start, end) {
    // Independent aggregates prevent room/sales join multiplication. One statement
    // reads both sources from the same snapshot, including concurrent corrections.
    // SUM deliberately remains null when a component has no eligible records.
    const { rows } = await this.database.query(`
      SELECT rooms.revenue::text AS "roomRevenue",
             bar.revenue::text AS "barRevenue",
             rooms.synthetic OR bar.synthetic AS "containsSyntheticData"
      FROM (
        SELECT SUM(rn.exact_charge) AS revenue,
               COALESCE(BOOL_OR(b.synthetic_dates OR b.synthetic_room_assignment),FALSE) AS synthetic
        FROM room_nights rn
        JOIN bookings b ON b.id = rn.booking_id
        WHERE b.status = 'active'
          AND rn.night_date >= $1::date AND rn.night_date < $2::date
      ) rooms
      CROSS JOIN (
        SELECT SUM(exact_revenue) AS revenue,
               COALESCE(BOOL_OR(synthetic),FALSE) AS synthetic
        FROM daily_bar_sales
        WHERE sales_date >= $1::date AND sales_date < $2::date
      ) bar`, [start, end]);
    return rows[0];
  }

  async summary(start, end) {
    const {rows:[row]} = await this.database.query(`${scopedNights},
      people AS (SELECT DISTINCT booking_id, guest_count FROM nights)
      SELECT (SELECT COUNT(*)::integer FROM people) AS "bookingCount",
        (SELECT COALESCE(SUM(guest_count),0)::bigint FROM people) AS "knownGuestCount",
        (SELECT COUNT(*)::integer FROM people WHERE guest_count IS NULL) AS "unknownGuestBookingCount",
        (SELECT COUNT(*)::integer FROM nights) AS "soldRoomNights",
        (SELECT SUM(exact_charge)::text FROM nights) AS "roomRevenue",
        (SELECT COALESCE(BOOL_OR(synthetic),FALSE) FROM nights) AS "roomSynthetic",
        SUM(exact_revenue)::text AS "barRevenue", SUM(quantity)::bigint AS "barUnits",
        COALESCE(BOOL_OR(synthetic),FALSE) AS "barSynthetic"
      FROM daily_bar_sales
      WHERE ($1::date IS NULL OR sales_date >= $1::date) AND ($2::date IS NULL OR sales_date < $2::date)`,[start,end]);
    return row;
  }

  async countries(start, end) {
    const {rows} = await this.database.query(`${scopedNights},
      people AS (SELECT DISTINCT booking_id,holder_country,guest_count FROM nights),
      counts AS (SELECT holder_country,COUNT(*)::integer AS bookings,
        COALESCE(SUM(guest_count),0)::bigint AS known,
        COUNT(*) FILTER (WHERE guest_count IS NULL)::integer AS unknown FROM people GROUP BY holder_country)
      SELECT n.holder_country AS country,c.bookings AS "bookingCount",c.known AS "knownGuestCount",
        c.unknown AS "unknownGuestBookingCount",SUM(n.exact_charge)::text AS "roomRevenue",
        BOOL_OR(n.synthetic) AS "containsSyntheticData"
      FROM nights n JOIN counts c ON c.holder_country=n.holder_country
      GROUP BY n.holder_country,c.bookings,c.known,c.unknown
      ORDER BY SUM(n.exact_charge) DESC,n.holder_country`,[start,end]);
    return rows;
  }

  async rooms(start, end) {
    const {rows}=await this.database.query(`${scopedNights}
      SELECT r.room_number AS "roomNumber",r.room_type AS "roomType",r.synthetic,
        SUM(n.exact_charge)::text AS "roomRevenue",COUNT(n.night_date)::integer AS "soldRoomNights",
        COALESCE(BOOL_OR(n.synthetic),FALSE) AS "containsSyntheticData"
      FROM rooms r LEFT JOIN nights n ON n.room_number=r.room_number
      GROUP BY r.room_number,r.room_type,r.synthetic
      ORDER BY SUM(n.exact_charge) DESC NULLS LAST,r.room_number`,[start,end]);
    return rows;
  }

  async roomTypesSeasons(start, end) {
    const {rows}=await this.database.query(`${scopedNights}
      SELECT t.name AS "roomType",s.season,SUM(n.exact_charge)::text AS "roomRevenue",
        COUNT(n.night_date)::integer AS "soldRoomNights",COALESCE(BOOL_OR(n.synthetic),FALSE) AS "containsSyntheticData"
      FROM room_types t CROSS JOIN (VALUES ('low'),('mid'),('high')) s(season)
      LEFT JOIN rooms r ON r.room_type=t.name
      LEFT JOIN nights n ON n.room_number=r.room_number AND n.season=s.season
      GROUP BY t.name,s.season ORDER BY t.name,CASE s.season WHEN 'low' THEN 1 WHEN 'mid' THEN 2 ELSE 3 END`,[start,end]);
    return rows;
  }

  async inventory() {
    const {rows}=await this.database.query(`SELECT t.name AS "roomType",COUNT(r.room_number)::integer AS "roomCount",
      COALESCE(BOOL_OR(r.synthetic),FALSE) AS synthetic
      FROM room_types t LEFT JOIN rooms r ON r.room_type=t.name GROUP BY t.name ORDER BY t.name`);
    return rows;
  }
}
