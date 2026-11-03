import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStay, validateBookingInput } from '../src/services/pricing.js';

const rates = [
  { roomType: 'Standard Single', season: 'low', nightlyPrice: '1031.00' },
  { roomType: 'Standard Single', season: 'mid', nightlyPrice: '1152.00' },
  { roomType: 'Standard Single', season: 'high', nightlyPrice: '1339.00' },
  { roomType: 'Standard Double', season: 'high', nightlyPrice: '1782.00' }
];
const rooms = [{ roomNumber: '001', roomType: 'Standard Single' }];
const input = () => ({ holderFirstName: 'Frederik', holderLastName: 'Johansen', holderEmail: 'frederik@example.com', holderCountry: 'Denmark', guestCount: 1, roomNumbers: ['001'], arrival: '2026-05-31', nights: 2 });

test('prices each occupied night across May/June; departure night is excluded', () => {
  const result = calculateStay('2026-05-31', 2, rooms, rates);
  assert.equal(result.departure, '2026-06-02');
  assert.equal(result.totalPrice, '2491.00');
  assert.deepEqual(result.nightCharges.map(n => [n.date, n.season, n.charge]), [['2026-05-31', 'mid', '1152.00'], ['2026-06-01', 'high', '1339.00']]);
});
test('multiple rooms contribute separately, with no guest-capacity limit', () => {
  const result = calculateStay('2026-05-31', 2, [...rooms, { roomNumber: '002', roomType: 'Standard Single' }], rates);
  assert.equal(result.totalPrice, '4982.00');
  const accepted = validateBookingInput({ ...input(), guestCount: 50 });
  assert.equal(accepted.guestCount, 50);
});
test('December is mid and January is low; yearly contributions match dates', () => {
  const result = calculateStay('2025-12-31', 2, rooms, rates);
  assert.equal(result.totalPrice, '2183.00');
  assert.deepEqual(result.nightCharges.map(n => [n.date, n.charge]), [['2025-12-31', '1152.00'], ['2026-01-01', '1031.00']]);
});
test('calculates approved high-season Standard Double and leap dates', () => {
  assert.equal(calculateStay('2026-07-10', 3, [{ roomNumber: '055', roomType: 'Standard Double' }], rates).totalPrice, '5346.00');
  assert.equal(calculateStay('2024-02-28', 2, rooms, rates).departure, '2024-03-01');
});
test('rejects impossible dates, invalid nights and date overflow', () => {
  for (const arrival of ['2026-02-29', '2026-02-31', '2026-13-01', '2026-01-01T00:00:00Z', null]) {
    assert.throws(() => validateBookingInput({ ...input(), arrival }), /arrival/i);
  }
  for (const nights of [0, -1, 1.5, '2', null, Infinity]) {
    assert.throws(() => validateBookingInput({ ...input(), nights }), /nights/i);
  }
  assert.throws(() => calculateStay('9999-12-31', 2, rooms, rates), /date|departure/i);
});
test('rejects manual calculations/IDs and unknown or duplicate room input', () => {
  for (const field of ['totalPrice', 'departure', 'bookingId', 'nightCharges', 'season']) {
    assert.throws(() => validateBookingInput({ ...input(), [field]: 'override' }), /allowed|unknown|calculated/i);
  }
  assert.throws(() => validateBookingInput({ ...input(), roomNumbers: ['001', '001'] }), /room/i);
  assert.throws(() => validateBookingInput({ ...input(), roomNumbers: [] }), /room/i);
});
test('validates editable version and typed names without inventing guests', () => {
  assert.throws(() => validateBookingInput(input(), true), /version/i);
  assert.equal(validateBookingInput({ ...input(), version: 3 }, true).version, 3);
  assert.throws(() => validateBookingInput({ ...input(), holderFirstName: ' ' }), /name/i);
  assert.deepEqual(validateBookingInput(input()).guests, []);
});
test('requires a valid booking-holder email for new bookings (Q1)', () => {
  const { holderEmail, ...withoutEmail } = input();
  assert.throws(() => validateBookingInput(withoutEmail), /holderEmail/);
  assert.throws(() => validateBookingInput({ ...input(), holderEmail: null }), /holderEmail/);
  for (const invalid of ['', '  ', 'frederik', 'frederik@', 'frederik@example', 'fre derik@example.com', 42]) assert.throws(() => validateBookingInput({ ...input(), holderEmail: invalid }), /holderEmail/);
  assert.equal(validateBookingInput({ ...input(), holderEmail: '  frederik@example.com ' }).holderEmail, 'frederik@example.com');
  assert.throws(() => validateBookingInput({ ...input(), holderEmail: `${'a'.repeat(250)}@example.com` }), /255/);
});
test('an edit may pass a null email; the service decides whether that is allowed', () => {
  assert.equal(validateBookingInput({ ...input(), holderEmail: null, version: 1 }, true).holderEmail, null);
  const { holderEmail, ...withoutEmail } = input();
  assert.equal(validateBookingInput({ ...withoutEmail, version: 1 }, true).holderEmail, null);
  assert.throws(() => validateBookingInput({ ...input(), holderEmail: 'bad', version: 1 }, true), /holderEmail/);
});
