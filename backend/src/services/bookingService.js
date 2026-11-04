import { randomBytes } from 'node:crypto';
import { AppError, badInput } from './errors.js';
import { questionnaireEmail } from './mailer.js';
import { calculateStay, parseDate, stayDates, validateBookingInput } from './pricing.js';

export class BookingService {
  // options: mailer ({send}), today (() => 'YYYY-MM-DD' hotel date), publicBaseUrl for questionnaire links.
  constructor(repository, { mailer, today = hotelToday, publicBaseUrl = 'http://localhost:3000' } = {}) {
    this.repository = repository; this.mailer = mailer; this.today = today; this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
  }
  id(value) {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 4294967295) throw badInput('BookingID must be a valid positive identifier.');
    return Number(value);
  }
  async get(value) {
    const booking = await this.repository.get(this.id(value));
    if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    return booking;
  }
  list() { return this.repository.list(); }
  catalog() { return this.repository.catalog(); }
  async rooms(query) {
    if ((query.arrival && !query.departure) || (!query.arrival && query.departure)) throw badInput('Supply arrival and departure together.');
    if (query.arrival) {
      const start = parseDate(query.arrival); const end = parseDate(query.departure, 'departure');
      if (end <= start) throw badInput('departure must be after arrival.');
    }
    if (query.roomType !== undefined && typeof query.roomType !== 'string') throw badInput('roomType must be a name.');
    return this.repository.rooms({ ...query, excludeBookingId: query.excludeBookingId ? this.id(query.excludeBookingId) : 0 });
  }
  async save(body, value) {
    const editing = value !== undefined;
    const id = editing ? this.id(value) : undefined;
    const data = validateBookingInput(body, editing);
    // Validate storage range without applying a capacity limit per room.
    if (data.guestCount > 4294967295) throw badInput('guestCount exceeds the database integer range.');
    return this.repository.transaction(async repo => {
      const existing = editing ? await repo.get(id, true) : null;
      if (editing && !existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      // Completed stays stay editable (and stay completed); cancelled bookings are not.
      if (existing && (existing.version !== data.version || existing.status === 'cancelled')) throw new AppError(409, 'STALE_BOOKING', 'The booking has changed. Reload the current booking before saving.');
      if (data.guestCount === null && !(existing?.sourceId && existing.guestCount === null)) throw badInput('An unknown guest count can only be retained on an imported booking whose count is unknown.');
      if (data.holderEmail === null && !(existing?.sourceId && existing.holderEmail === null)) throw badInput('holderEmail is required. Only an imported booking without an email may keep it empty.');
      if (!await repo.countryExists(data.holderCountry)) throw badInput('Select a country from the catalog.');
      const affected = [...new Set([...data.roomNumbers, ...(existing?.roomNumbers ?? [])])];
      const locked = await repo.lockRooms(affected);
      const rooms = locked.filter(r => data.roomNumbers.includes(r.roomNumber));
      if (rooms.length !== data.roomNumbers.length) throw badInput('Select valid room numbers from the inventory.');
      const { departure } = stayDates(data.arrival, data.nights);
      const occupied = await repo.overlaps(data.roomNumbers, data.arrival, departure, id);
      if (occupied) throw new AppError(409, 'ROOM_UNAVAILABLE', `Room ${occupied} is no longer available for this stay. Select available rooms.`);
      const { rates } = await repo.catalog();
      const calculation = calculateStay(data.arrival, data.nights, rooms, rates);
      calculation.syntheticDates = Boolean(existing?.syntheticDates && existing.arrival === data.arrival && existing.departure === calculation.departure);
      calculation.syntheticRoomAssignment = Boolean(existing?.syntheticRoomAssignment && [...existing.roomNumbers].sort().join(',') === [...data.roomNumbers].sort().join(','));
      return editing ? repo.update(id, data, calculation) : repo.create(data, calculation);
    });
  }
  async cancel(value) {
    const id = this.id(value);
    return this.repository.transaction(async repo => {
      const existing = await repo.get(id, true);
      if (!existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      if (existing.status === 'cancelled') return existing;
      if (existing.status === 'completed') throw completedError();
      await repo.lockRooms(existing.roomNumbers);
      return repo.cancel(id);
    });
  }
  // Story 24: check-out. The email is sent after commit, so a mail failure never undoes completion.
  async complete(value) {
    const id = this.id(value);
    const { booking, invitation, newlyCompleted } = await this.repository.transaction(async repo => {
      const existing = await repo.get(id, true);
      if (!existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      if (existing.status === 'cancelled') throw new AppError(409, 'BOOKING_CANCELLED', 'A cancelled booking cannot be completed.');
      if (existing.status === 'completed') return { booking: existing, invitation: await repo.invitation(id), newlyCompleted: false };
      if (existing.arrival > this.today()) throw new AppError(409, 'STAY_NOT_STARTED', `The stay has not started yet. The booking can be completed from its arrival date, ${existing.arrival}.`);
      const booking = await repo.complete(id);
      if (booking.holderEmail) await repo.createInvitation(id, randomBytes(24).toString('base64url'), booking.holderEmail);
      return { booking, invitation: await repo.invitation(id), newlyCompleted: true };
    });
    if (!invitation) return { booking, questionnaire: { status: 'no_email', message: 'The booking has no email address, so no questionnaire was sent.' } };
    if (!newlyCompleted) return { booking, questionnaire: describe(invitation, 'The booking was already completed; the questionnaire is not sent again.') };
    let error = null;
    try {
      if (!this.mailer) throw new Error('No mailer configured.');
      await this.mailer.send(questionnaireEmail({ to: invitation.email, firstName: booking.holderFirstName, link: `${this.publicBaseUrl}/survey.html?token=${invitation.token}` }));
    } catch (failure) { error = String(failure?.message || failure).slice(0, 500); }
    await this.repository.markInvitation(id, error);
    return { booking, questionnaire: describe(await this.repository.invitation(id)) };
  }
}

const completedError = () => new AppError(409, 'BOOKING_COMPLETED', 'This stay is completed and can no longer be cancelled.');
export const hotelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen' }).format(new Date());
function describe(invitation, note) {
  const sent = Boolean(invitation.sentAt);
  return { status: sent ? 'sent' : 'failed', sentTo: invitation.email,
    message: note ?? (sent ? `A satisfaction questionnaire was sent to ${invitation.email}.` : 'The booking was completed, but the questionnaire email could not be sent.') };
}
