const $ = selector => document.querySelector(selector);
const form = $('#booking-form');
const controls = form.elements;
let catalog;
let editing = null;
let bookings = [];
let availableRooms = [];
const selected = new Set();
let availabilityRequest = 0;
const currency = value => new Intl.NumberFormat('en-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value));
function notice(message, error = false) { const node = $('#notice'); node.hidden = !message; node.textContent = message; node.classList.toggle('error', error); }
async function api(path, options) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}
function option(text, value = text) { const node = document.createElement('option'); node.value = value; node.textContent = text; return node; }
function extendNumbers(select, count = 30, chosen) {
  select.querySelector('option[value="more"]')?.remove();
  const start = Number(select.options[select.options.length - 1]?.value || 0) + 1;
  for (let n = start; n < start + count; n++) select.add(option(String(n)));
  select.add(option('Show more values…', 'more'));
  if (chosen !== undefined) { while (chosen >= start + count && !select.querySelector(`option[value="${chosen}"]`)) { extendNumbers(select, 30); if (Number(select.options[select.options.length - 2].value) >= chosen) break; } select.value = String(chosen); }
}
for (const name of ['nights', 'guestCount']) {
  extendNumbers(controls[name]);
  controls[name].addEventListener('change', () => { if (controls[name].value === 'more') { const previousMax = Number(controls[name].options[controls[name].options.length - 2].value); extendNumbers(controls[name]); controls[name].value = String(previousMax + 1); } });
}
controls.nights.value = '2';
function dates() {
  if (!controls.arrival.value || !Number(controls.nights.value)) return null;
  const arrival = controls.arrival.value;
  const date = new Date(`${arrival}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(controls.nights.value));
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() > 9999) return null;
  return { arrival, departure: date.toISOString().slice(0, 10) };
}
function updateQuote() {
  const stay = dates();
  $('#departure').textContent = stay?.departure || 'Select your stay dates';
  if (!stay || !selected.size || !catalog) { $('#price').textContent = '—'; return; }
  let totalMinor = 0;
  for (const number of selected) {
    const room = availableRooms.find(r => r.roomNumber === number);
    if (!room) continue;
    for (let date = new Date(`${stay.arrival}T00:00:00Z`); date.toISOString().slice(0, 10) < stay.departure; date.setUTCDate(date.getUTCDate() + 1)) {
      const month = date.getUTCMonth() + 1;
      const season = month <= 3 ? 'low' : month >= 6 && month <= 8 ? 'high' : 'mid';
      totalMinor += Math.round(Number(catalog.rates.find(r => r.roomType === room.roomType && r.season === season).nightlyPrice) * 100);
    }
  }
  $('#price').textContent = currency(totalMinor / 100);
}
function drawRooms() {
  const container = $('#rooms'); container.replaceChildren();
  const filter = $('#room-type').value;
  const visible = availableRooms.filter(r => !filter || r.roomType === filter);
  $('#room-count').textContent = visible.length ? `(${visible.length})` : '';
  if (!visible.length) { const p = document.createElement('p'); p.className = 'empty-inline'; p.textContent = dates() ? 'No available rooms match this stay.' : 'Choose arrival and nights to see available rooms.'; container.append(p); }
  for (const room of visible) {
    const label = document.createElement('label'); label.className = 'room-choice';
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = room.roomNumber; input.checked = selected.has(room.roomNumber); input.setAttribute('aria-label', `Room ${room.roomNumber}, ${room.roomType}`);
    const box = document.createElement('span'); box.append(document.createTextNode(room.roomNumber));
    const type = document.createElement('small'); type.textContent = room.roomType; box.append(type);
    input.addEventListener('change', () => { input.checked ? selected.add(room.roomNumber) : selected.delete(room.roomNumber); updateQuote(); });
    label.append(input, box); container.append(label);
  }
  updateQuote();
}
async function loadRooms() {
  const request = ++availabilityRequest;
  const stay = dates();
  if (!stay) { availableRooms = []; selected.clear(); drawRooms(); return; }
  try {
    const query = new URLSearchParams(stay);
    if (editing) query.set('excludeBookingId', editing.bookingId);
    const rooms = await api(`/rooms?${query}`);
    if (request !== availabilityRequest) return;
    availableRooms = rooms;
    for (const value of selected) if (!availableRooms.some(r => r.roomNumber === value)) selected.delete(value);
    drawRooms();
  } catch (error) { if (request === availabilityRequest) notice(error.message, true); }
}
for (const name of ['arrival', 'nights']) controls[name].addEventListener('change', loadRooms);
$('#room-type').addEventListener('change', drawRooms);
function resetForm() {
  editing = null; form.reset(); selected.clear(); availableRooms = [];
  controls.nights.value = '2'; controls.guestCount.value = '1';
  $('#form-title').textContent = 'New booking'; $('#save').textContent = 'Create booking'; $('#cancel-edit').hidden = true;
  $('#price-note').textContent = 'Each night uses its own seasonal rate.'; drawRooms();
}
async function editBooking(id) {
  try {
    editing = await api(`/bookings/${id}`); selected.clear();
    for (const name of ['holderFirstName','holderLastName','holderCountry','arrival']) controls[name].value = editing[name];
    for (const name of ['nights','guestCount']) { const value = editing[name]; if (!controls[name].querySelector(`option[value="${value}"]`)) extendNumbers(controls[name], 30, value); controls[name].value = String(value); }
    for (const number of editing.roomNumbers) selected.add(number);
    $('#room-type').value = ''; $('#form-title').textContent = `Edit booking #${id}`; $('#save').textContent = 'Save changes'; $('#cancel-edit').hidden = false;
    await loadRooms(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); notice('Editing the current saved booking. Prices recalculate when saved.');
  } catch (error) { notice(error.message, true); }
}
function renderBookings() {
  const container = $('#bookings'); container.replaceChildren();
  $('#reservation-count').textContent = `${bookings.length} active ${bookings.length === 1 ? 'reservation' : 'reservations'}`;
  if (!bookings.length) { const empty = document.createElement('div'); empty.className = 'empty'; const title = document.createElement('strong'); title.textContent = 'Ready for your first guest'; const p = document.createElement('p'); p.textContent = 'Create a booking to see it here. Changes are saved in MySQL.'; empty.append(title,p); container.append(empty); }
  for (const booking of bookings) {
    const article = document.createElement('article'); article.className = 'reservation'; article.dataset.bookingId = booking.bookingId;
    const top = document.createElement('div'); top.className = 'reservation-top'; const details = document.createElement('div');
    const id = document.createElement('div'); id.className = 'id'; id.textContent = `BOOKING #${booking.bookingId}`;
    const name = document.createElement('h3'); name.textContent = `${booking.holderFirstName} ${booking.holderLastName}`;
    const amount = document.createElement('strong'); amount.className = 'amount'; amount.textContent = currency(booking.totalPrice);
    details.append(id,name); top.append(details,amount);
    const stay = document.createElement('p'); stay.textContent = `${booking.arrival} → ${booking.departure} · ${booking.nights} nights`;
    const rooms = document.createElement('p'); rooms.textContent = `Rooms ${booking.roomNumbers.join(', ')} · ${booking.guestCount ?? 'Unknown'} guests · ${booking.holderCountry}`;
    const actions = document.createElement('div'); actions.className = 'reservation-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit booking'; edit.addEventListener('click', () => editBooking(booking.bookingId));
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'danger'; cancel.textContent = 'Cancel booking';
    cancel.addEventListener('click', async () => { if (!confirm(`Cancel booking #${booking.bookingId} for ${booking.holderFirstName} ${booking.holderLastName}?`)) return; try { await api(`/bookings/${booking.bookingId}`, { method: 'DELETE' }); if (editing?.bookingId === booking.bookingId) resetForm(); await loadBookings(); await loadRooms(); notice(`Booking #${booking.bookingId} cancelled.`); } catch (error) { notice(error.message, true); } });
    actions.append(edit,cancel); article.append(top,stay,rooms,actions); container.append(article);
  }
}
async function loadBookings() { bookings = await api('/bookings'); renderBookings(); }
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selected.size) { notice('Select at least one available room.', true); return; }
  const payload = { holderFirstName: controls.holderFirstName.value, holderLastName: controls.holderLastName.value, holderCountry: controls.holderCountry.value, guestCount: Number(controls.guestCount.value), roomNumbers: [...selected], arrival: controls.arrival.value, nights: Number(controls.nights.value), ...(editing ? { version: editing.version, guests: editing.guests } : {}) };
  try {
    const booking = await api(editing ? `/bookings/${editing.bookingId}` : '/bookings', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetForm(); await loadBookings(); notice(`Booking #${booking.bookingId} saved. Total ${currency(booking.totalPrice)}.`);
  } catch (error) { notice(error.message, true); }
});
$('#cancel-edit').addEventListener('click', () => { resetForm(); notice(''); });
$('#refresh').addEventListener('click', async () => { try { await loadBookings(); await loadRooms(); notice('Bookings refreshed.'); } catch (error) { notice(error.message, true); } });
try {
  catalog = await api('/catalog');
  for (const country of catalog.countries) controls.holderCountry.add(option(country));
  for (const type of catalog.roomTypes) $('#room-type').add(option(type));
  await loadBookings();
} catch (error) { notice(`Could not load booking data: ${error.message}`, true); $('#reservation-count').textContent = 'Data unavailable'; }
