import { AppError, badInput } from './errors.js';
import { calculateStay, parseDate, stayDates, validateBookingInput } from './pricing.js';

export class BookingService {
  constructor(repository) { this.repository = repository; }
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
      if (existing && (existing.version !== data.version || existing.status !== 'active')) throw new AppError(409, 'STALE_BOOKING', 'The booking has changed. Reload the current booking before saving.');
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
      await repo.lockRooms(existing.roomNumbers);
      return repo.cancel(id);
    });
  }
}
