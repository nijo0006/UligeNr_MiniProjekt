export class SatisfactionRepository {
  constructor(database) { this.database=database; }

  async record({bookingId,roomNumber,rating}) {
    const connection=await this.database.connect();
    try {
      await connection.query('BEGIN');
      // Booking edits/cancellations lock this same row before changing allocations.
      const {rows:[booking]}=await connection.query('SELECT status FROM bookings WHERE id=$1 FOR UPDATE',[bookingId]);
      if (!booking) {await connection.query('ROLLBACK');return {error:'not_found'};}
      if (booking.status !== 'active') {await connection.query('ROLLBACK');return {error:'cancelled'};}
      const {rows}=await connection.query('SELECT 1 FROM booking_rooms WHERE booking_id=$1 AND room_number=$2',[bookingId,roomNumber]);
      if (!rows.length) {await connection.query('ROLLBACK');return {error:'unrelated_room'};}
      const {rows:[saved]}=await connection.query(`INSERT INTO satisfaction_responses(booking_id,room_number,rating)
        VALUES ($1,$2,$3) RETURNING id AS "responseId",booking_id AS "bookingId",room_number AS "roomNumber",rating::double precision,recorded_at AS "recordedAt"`,[bookingId,roomNumber,rating]);
      await connection.query('COMMIT');return saved;
    }catch(error){await connection.query('ROLLBACK');throw error;}
    finally{connection.release();}
  }

  async report(groupBy='room') {
    const byType=groupBy==='roomType';
    const columns=byType?'r.room_type AS "roomType"':'r.room_number AS "roomNumber",r.room_type AS "roomType"';
    const group=byType?'r.room_type':'r.room_number,r.room_type';
    const order=byType?'r.room_type':'r.room_number';
    const {rows}=await this.database.query(`SELECT ${columns},
      COUNT(s.id)::integer AS "responseCount",AVG(s.rating)::double precision AS "meanRating"
      FROM rooms r LEFT JOIN (
        SELECT s.* FROM satisfaction_responses s JOIN bookings b ON b.id=s.booking_id WHERE b.status='active'
      ) s ON s.room_number=r.room_number
      GROUP BY ${group} ORDER BY ${order}`);
    return rows;
  }
}
