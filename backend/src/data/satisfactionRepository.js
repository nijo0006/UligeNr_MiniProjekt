export class SatisfactionRepository {
  constructor(database) { this.database=database; }

  // Guest questionnaire (Story 24): the token is the only key a guest holds.
  async questionnaire(token) {
    const {rows:[invitation]}=await this.database.query(`SELECT i.booking_id AS "bookingId",i.would_recommend IS NOT NULL AS "recommendationAnswered",
        i.overall_rating IS NOT NULL AS "overallAnswered"
      FROM satisfaction_invitations i JOIN bookings b ON b.id=i.booking_id WHERE i.token=$1 AND b.status='completed'`,[token]);
    if (!invitation) return null;
    const {rows}=await this.database.query(`SELECT br.room_number AS "roomNumber",r.room_type AS "roomType",
        EXISTS (SELECT 1 FROM satisfaction_responses s WHERE s.booking_id=br.booking_id AND s.room_number=br.room_number AND s.source='questionnaire') AS answered
      FROM booking_rooms br JOIN rooms r ON r.room_number=br.room_number WHERE br.booking_id=$1 ORDER BY br.room_number`,[invitation.bookingId]);
    return {rooms:rows,overallAnswered:invitation.overallAnswered,recommendationAnswered:invitation.recommendationAnswered};
  }

  async submitQuestionnaire(token, ratings, wouldRecommend, overallRating) {
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
      if (overallRating !== undefined) {
        const {rowCount}=await connection.query(`UPDATE satisfaction_invitations SET overall_rating=$2,overall_rated_at=CURRENT_TIMESTAMP
          WHERE booking_id=$1 AND overall_rating IS NULL`,[invitation.bookingId,overallRating]);
        if (!rowCount) {await connection.query('ROLLBACK');return {error:'already_overall'};}
      }
      if (wouldRecommend !== undefined) {
        const {rowCount}=await connection.query(`UPDATE satisfaction_invitations SET would_recommend=$2,recommended_at=CURRENT_TIMESTAMP
          WHERE booking_id=$1 AND would_recommend IS NULL`,[invitation.bookingId,wouldRecommend]);
        if (!rowCount) {await connection.query('ROLLBACK');return {error:'already_recommended'};}
      }
      await connection.query('COMMIT');
      return {responses:saved,...(overallRating===undefined?{}:{overallRating}),...(wouldRecommend===undefined?{}:{wouldRecommend})};
    }catch(error){await connection.query('ROLLBACK');throw error;}
    finally{connection.release();}
  }

  // Whole-stay answers: overall 1-5 rating and would-recommend, one of each per stay.
  async stayFeedback() {
    const {rows:[row]}=await this.database.query(`SELECT COUNT(i.overall_rating)::integer AS "overallCount",
        AVG(i.overall_rating)::double precision AS "overallMean",
        COUNT(i.would_recommend)::integer AS "recommendResponses",
        COUNT(*) FILTER (WHERE i.would_recommend)::integer AS "recommendCount"
      FROM satisfaction_invitations i JOIN bookings b ON b.id=i.booking_id WHERE b.status<>'cancelled'`);
    return {
      overall:{responseCount:row.overallCount,meanRating:row.overallMean},
      recommendation:{responseCount:row.recommendResponses,recommendCount:row.recommendCount,
        recommendPercent:row.recommendResponses?row.recommendCount/row.recommendResponses*100:null}
    };
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
