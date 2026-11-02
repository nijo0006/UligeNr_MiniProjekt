import {api,currency,option,extendNumbers} from './shared.js';
export async function mountBookingForm(onSaved) {
const $ = selector => document.querySelector(selector);
const form = $('#booking-form');
const controls = form.elements;
const defaultTitle=$('#form-title').textContent,defaultSave=$('#save').textContent;
let catalog;
let editing = null;
let availableRooms = [];
const selected = new Set();
let availabilityRequest = 0;
function notice(message,error=false) {const node=$('#notice');node.hidden=!message;node.textContent=message;node.classList.toggle('error',error);}
for(const name of ['nights','guestCount']) {
  extendNumbers(controls[name]);
  controls[name].addEventListener('change',()=>{if(controls[name].value==='more'){const next=Number(controls[name].options[controls[name].options.length-2].value)+1;extendNumbers(controls[name]);controls[name].value=String(next);}});
}
controls.nights.value='2';
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
  controls.nights.value = '2'; controls.guestCount.value = '1'; controls.guestCount.required=true;
  $('#form-title').textContent = defaultTitle; $('#save').textContent = defaultSave; $('#cancel-edit').hidden = true;
  $('#price-note').textContent = 'Each night uses its own seasonal rate.'; drawRooms();
}
async function editBooking(id) {
  try {
    editing = await api(`/bookings/${id}`); selected.clear();
    for (const name of ['holderFirstName','holderLastName','holderCountry','arrival']) controls[name].value = editing[name];
    for (const name of ['nights','guestCount']) { const value = editing[name]; if (value === null) { if (!controls[name].querySelector('option[value=""]')) controls[name].add(option('Unknown (Excel)', '')); controls[name].value=''; controls[name].required=false; continue; } if (!controls[name].querySelector(`option[value="${value}"]`)) extendNumbers(controls[name], 30, value); controls[name].value = String(value); }
    for (const number of editing.roomNumbers) selected.add(number);
    $('#room-type').value = ''; $('#form-title').textContent = `Edit booking #${id}`; $('#save').textContent = 'Save changes'; $('#cancel-edit').hidden = false;
    await loadRooms(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); notice(editing.pricingMode === 'source-preserved' ? 'Imported Excel booking: saving applies the current seasonal tariff. Original Excel values remain preserved.' : 'Editing the current saved booking. Prices recalculate when saved.');
  } catch (error) { notice(error.message, true); }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selected.size) { notice('Select at least one available room.', true); return; }
  const payload = { holderFirstName: controls.holderFirstName.value, holderLastName: controls.holderLastName.value, holderCountry: controls.holderCountry.value, guestCount: controls.guestCount.value === '' ? null : Number(controls.guestCount.value), roomNumbers: [...selected], arrival: controls.arrival.value, nights: Number(controls.nights.value), ...(editing ? { version: editing.version, guests: editing.guests } : {}) };
  try {
    const booking = await api(editing ? `/bookings/${editing.bookingId}` : '/bookings', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetForm(); await onSaved(booking);
  } catch (error) { notice(error.message, true); }
});
$('#cancel-edit').addEventListener('click', () => { resetForm(); notice(''); });
  catalog = await api('/catalog');
  for (const country of catalog.countries) controls.holderCountry.add(option(country));
  for (const type of catalog.roomTypes) $('#room-type').add(option(type));
  return {edit:editBooking,reset:resetForm,refreshRooms:loadRooms,cancelEditing:id=>{if(editing?.bookingId===id)resetForm();}};
}
