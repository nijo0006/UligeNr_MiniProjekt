export class SatisfactionRepository {
  constructor(database) { this.database=database; }

  async record({bookingId,roomNumber,rating}) {
    const connection=await this.database.connect();
    try {
      await connection.query('BEGIN');
      // Booking edits/cancellations lock this same row before changing allocations.
      const {rows:[booking]}=await connection.query('SELECT status FROM bookings WHERE id=$1 FOR UPDATE',[bookingId]);
      if (!booking) {await connection.query('ROLLBACK');return {error:'not_found'};}
      if (booking.status === 'cancelled') {await connection.query('ROLLBACK');return {error:'cancelled'};}
      const {rows}=await connection.query('SELECT 1 FROM booking_rooms WHERE booking_id=$1 AND room_number=$2',[bookingId,roomNumber]);
      if (!rows.length) {await connection.query('ROLLBACK');return {error:'unrelated_room'};}
      const {rows:[saved]}=await connection.query(`INSERT INTO satisfaction_responses(booking_id,room_number,rating)
        VALUES ($1,$2,$3) RETURNING id AS "responseId",booking_id AS "bookingId",room_number AS "roomNumber",rating::double precision,recorded_at AS "recordedAt"`,[bookingId,roomNumber,rating]);
      await connection.query('COMMIT');return saved;
    }catch(error){await connection.query('ROLLBACK');throw error;}
    finally{connection.release();}
  }

  // Guest questionnaire (Story 24): the token is the only key a guest holds.
  async questionnaire(token) {
    const {rows:[invitation]}=await this.database.query(`SELECT i.booking_id AS "bookingId" FROM satisfaction_invitations i
      JOIN bookings b ON b.id=i.booking_id WHERE i.token=$1 AND b.status='completed'`,[token]);
    if (!invitation) return null;
    const {rows}=await this.database.query(`SELECT br.room_number AS "roomNumber",r.room_type AS "roomType",
        EXISTS (SELECT 1 FROM satisfaction_responses s WHERE s.booking_id=br.booking_id AND s.room_number=br.room_number AND s.source='questionnaire') AS answered
      FROM booking_rooms br JOIN rooms r ON r.room_number=br.room_number WHERE br.booking_id=$1 ORDER BY br.room_number`,[invitation.bookingId]);
    return {rooms:rows};
  }

  async submitQuestionnaire(token, ratings) {
    const connection=await this.database.connect();
    try {
      await connection.query('BEGIN');
      const {rows:[invitation]}=await connection.query(`SELECT i.booking_id AS "bookingId" FROM satisfaction_invitations i
        JOIN bookings b ON b.id=i.booking_id WHERE i.token=$1 AND b.status='completed' FOR UPDATE OF b`,[token]);
      if (!invitation) {await connection.query('ROLLBACK');return {error:'not_found'};}
      const {rows:rooms}=await connection.query('SELECT room_number FROM booking_rooms WHERE booking_id=$1',[invitation.bookingId]);
      const booked=new Set(rooms.map(r=>r.room_number));
      if (ratings.some(r=>!booked.has(r.roomNumber))) {await connection.query('ROLLBACK');return {error:'unrelated_room'};}
      const saved=[];
      for (const {roomNumber,rating} of ratings) {
        const {rows}=await connection.query(`INSERT INTO satisfaction_responses(booking_id,room_number,rating,source)
          VALUES ($1,$2,$3,'questionnaire') ON CONFLICT (booking_id,room_number) WHERE source='questionnaire' DO NOTHING
          RETURNING room_number AS "roomNumber",rating::double precision,recorded_at AS "recordedAt"`,[invitation.bookingId,roomNumber,rating]);
        if (!rows.length) {await connection.query('ROLLBACK');return {error:'already_answered',roomNumber};}
        saved.push(rows[0]);
      }
      await connection.query('COMMIT');return {responses:saved};
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
        SELECT s.* FROM satisfaction_responses s JOIN bookings b ON b.id=s.booking_id WHERE b.status<>'cancelled'
      ) s ON s.room_number=r.room_number
      GROUP BY ${group} ORDER BY ${order}`);
    return rows;
  }
}
