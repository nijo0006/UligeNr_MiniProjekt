import { badInput } from './errors.js';

const DAY = 86_400_000;
export function parseDate(value, field = 'arrival') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw badInput(`${field} must be a calendar date (YYYY-MM-DD).`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < '1000-01-01') throw badInput(`${field} is not a valid supported calendar date.`);
  return date;
}
export function stayDates(arrival, nights) {
  const start = parseDate(arrival);
  if (!Number.isSafeInteger(nights) || nights < 1) throw badInput('nights must be a positive whole number.');
  const end = new Date(start.getTime() + nights * DAY);
  if (!Number.isFinite(end.getTime()) || end.getUTCFullYear() > 9999) throw badInput('departure is outside the supported date range.');
  return { start, departure: end.toISOString().slice(0, 10) };
}
export function seasonFor(date) {
  const month = date.getUTCMonth() + 1;
  return month <= 3 ? 'low' : month >= 6 && month <= 8 ? 'high' : 'mid';
}
export function toMinor(amount) {
  const match = /^(\d+)\.(\d{2})$/.exec(String(amount));
  if (!match) throw new Error('Invalid stored monetary amount.');
  const minor = Number(match[1]) * 100 + Number(match[2]);
  if (!Number.isSafeInteger(minor)) throw new Error('Monetary amount exceeds exact integer range.');
  return minor;
}
export function money(minor) {
  if (!Number.isSafeInteger(minor) || minor < 0) throw badInput('Calculated price exceeds the supported exact-money range.');
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateBookingInput(body, editing = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badInput('Booking input must be a JSON object.');
  const allowed = ['holderFirstName', 'holderLastName', 'holderEmail', 'holderCountry', 'guestCount', 'guests', 'roomNumbers', 'arrival', 'nights', ...(editing ? ['version'] : [])];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw badInput('Unknown or calculated fields are not allowed in booking input.');
  for (const field of ['holderFirstName', 'holderLastName', 'holderCountry']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) throw badInput(`${field} must be a non-empty name or country.`);
    // Storage-size validation, not a restriction on which guest names are allowed.
    if ([...body[field].trim()].length > 255) throw badInput(`${field} exceeds the storage length of 255 characters.`);
  }
  // Email is required for new bookings; an edit may send null only to keep an imported booking's missing email (checked in BookingService).
  const holderEmail = editing && (body.holderEmail === undefined || body.holderEmail === null) ? null : body.holderEmail;
  if (!(editing && holderEmail === null)) {
    if (typeof holderEmail !== 'string' || !EMAIL_PATTERN.test(holderEmail.trim())) throw badInput('holderEmail must be a valid email address, e.g. name@example.com.');
    if ([...holderEmail.trim()].length > 255) throw badInput('holderEmail exceeds the storage length of 255 characters.');
  }
  if (!(editing && body.guestCount === null) && (!Number.isSafeInteger(body.guestCount) || body.guestCount < 1)) throw badInput('guestCount must be a positive whole number.');
  if (!Array.isArray(body.roomNumbers) || !body.roomNumbers.length || body.roomNumbers.some(n => typeof n !== 'string') || new Set(body.roomNumbers).size !== body.roomNumbers.length) throw badInput('Select one or more unique room numbers.');
  if (editing && (!Number.isSafeInteger(body.version) || body.version < 1)) throw badInput('A saved booking version is required for editing.');
  const guests = body.guests ?? [];
  if (!Array.isArray(guests)) throw badInput('guests must be a list of names.');
  for (const guest of guests) {
    if (!guest || typeof guest !== 'object' || Array.isArray(guest) || Object.keys(guest).some(k => !['firstName', 'lastName'].includes(k))) throw badInput('Each guest must contain only firstName and lastName.');
    for (const key of ['firstName', 'lastName']) if (typeof guest[key] !== 'string' || !guest[key].trim() || [...guest[key].trim()].length > 255) throw badInput('Each guest name must contain 1–255 characters.');
  }
  stayDates(body.arrival, body.nights);
  return { ...body, holderFirstName: body.holderFirstName.trim(), holderLastName: body.holderLastName.trim(), holderEmail: holderEmail === null ? null : holderEmail.trim(), holderCountry: body.holderCountry.trim(), guests: guests.map(g => ({ firstName: g.firstName.trim(), lastName: g.lastName.trim() })) };
}
export function calculateStay(arrival, nights, rooms, rates) {
  const { start, departure } = stayDates(arrival, nights);
  const rateMap = new Map(rates.map(r => [`${r.roomType}:${r.season}`, toMinor(r.nightlyPrice)]));
  const nightCharges = [];
  const roomTotals = [];
  let total = 0;
  for (const room of rooms) {
    let roomTotal = 0;
    for (let i = 0; i < nights; i++) {
      const date = new Date(start.getTime() + i * DAY);
      const season = seasonFor(date);
      const charge = rateMap.get(`${room.roomType}:${season}`);
      if (charge === undefined) throw new Error(`Missing stored tariff for ${room.roomType}/${season}.`);
      roomTotal += charge;
      nightCharges.push({ roomNumber: room.roomNumber, date: date.toISOString().slice(0, 10), season, charge: money(charge) });
    }
    total += roomTotal;
    roomTotals.push({ roomNumber: room.roomNumber, total: money(roomTotal) });
  }
  return { departure, totalPrice: money(total), nightCharges, roomTotals };
}
