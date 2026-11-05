import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function readGuestRanges() {
  const { guestsByRoomType } = JSON.parse(await readFile(new URL('./demo-guest-counts.json', import.meta.url), 'utf8'));
  for (const [type, [min, max]] of Object.entries(guestsByRoomType)) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) throw new Error(`demo-guest-counts.json: invalid range for ${type}.`);
  }
  return guestsByRoomType;
}

// The same booking always gets the same number, so every computer shows the same counts.
export function demoGuestCount(sourceId, [min, max]) {
  const hash = createHash('sha256').update(sourceId).digest().readUInt32BE(0);
  return min + (hash % (max - min + 1));
}

// Runs in the startup transaction after the historical import, on every start.
// Fills in the missing guest count of each Excel booking and recalculates earlier demo
// counts, so a changed range reaches everyone. Counts edited in the app are kept,
// because an edit clears synthetic_guest_count.
export async function fillDemoGuestCounts(connection) {
  const ranges = await readGuestRanges();
  const { rows } = await connection.query(`SELECT b.id, b.source_id AS "sourceId", r.room_type AS "roomType"
    FROM bookings b JOIN booking_rooms br ON br.booking_id=b.id JOIN rooms r ON r.room_number=br.room_number
    WHERE b.source_id LIKE '%:booking:%' AND (b.guest_count IS NULL OR b.synthetic_guest_count)`);
  // Excel bookings have one room each; a booking whose room type has no range is left unknown.
  const counts = rows.filter(r => ranges[r.roomType]).map(r => ({ id: r.id, guest_count: demoGuestCount(r.sourceId, ranges[r.roomType]) }));
  await connection.query(`UPDATE bookings b SET guest_count=c.guest_count, synthetic_guest_count=TRUE
    FROM jsonb_to_recordset($1::jsonb) AS c(id bigint, guest_count bigint)
    WHERE b.id=c.id AND (b.guest_count IS DISTINCT FROM c.guest_count OR NOT b.synthetic_guest_count)`, [JSON.stringify(counts)]);
}
