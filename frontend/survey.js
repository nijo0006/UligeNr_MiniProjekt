// Guest questionnaire reached from the email sent when a stay is completed (Story 24).
// The link token is the only key; the page shows nothing but the stay's rooms.
import { api } from './shared.js';

const $ = selector => document.querySelector(selector);
const token = new URLSearchParams(location.search).get('token') ?? '';
const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function notice(message, error = false) {
  const node = $('#survey-notice'); node.hidden = !message; node.textContent = message; node.classList.toggle('error', error);
}

function roomFieldset(room) {
  const fieldset = document.createElement('fieldset'); fieldset.className = 'survey-room'; fieldset.dataset.roomNumber = room.roomNumber;
  const legend = document.createElement('legend'); legend.textContent = `Room ${room.roomNumber}`;
  const meta = document.createElement('p'); meta.className = 'room-meta'; meta.textContent = room.answered ? `${room.roomType} · already rated, thank you` : room.roomType;
  fieldset.append(legend, meta);
  if (room.answered) { fieldset.classList.add('answered'); return fieldset; }
  const scale = document.createElement('div'); scale.className = 'rating-scale';
  labels.forEach((text, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'radio'; input.name = `room-${room.roomNumber}`; input.value = String(index + 1);
    input.setAttribute('aria-label', `Room ${room.roomNumber}: ${index + 1} of 5, ${text}`);
    const face = document.createElement('span'); face.append(String(index + 1));
    const small = document.createElement('small'); small.textContent = text; face.append(small);
    label.append(input, face); scale.append(label);
  });
  fieldset.append(scale);
  return fieldset;
}

function showThanks() { $('#survey-form').hidden = true; $('#survey-intro').hidden = true; $('#survey-thanks').hidden = false; }

async function load() {
  try {
    const { rooms } = await api(`/questionnaires/${encodeURIComponent(token)}`);
    if (rooms.every(room => room.answered)) return showThanks();
    $('#survey-rooms').replaceChildren(...rooms.map(roomFieldset));
    $('#survey-form').hidden = false;
  } catch (error) {
    $('#survey-intro').hidden = true;
    notice(`${error.message} Please use the link from your email, or contact the reception.`, true);
  }
}

$('#survey-form').addEventListener('submit', async event => {
  event.preventDefault();
  const ratings = [...document.querySelectorAll('.survey-room:not(.answered)')]
    .map(fieldset => ({ roomNumber: fieldset.dataset.roomNumber, checked: fieldset.querySelector('input:checked') }))
    .filter(room => room.checked).map(room => ({ roomNumber: room.roomNumber, rating: Number(room.checked.value) }));
  if (!ratings.length) return notice('Please choose a rating from 1 to 5 for at least one room.', true);
  const button = $('#survey-submit'); button.disabled = true; notice('');
  try {
    await api(`/questionnaires/${encodeURIComponent(token)}/responses`, { method: 'POST', body: JSON.stringify({ ratings }) });
    const { rooms } = await api(`/questionnaires/${encodeURIComponent(token)}`);
    if (rooms.every(room => room.answered)) return showThanks();
    $('#survey-rooms').replaceChildren(...rooms.map(roomFieldset));
    notice('Thank you! Your rating is saved. You can still rate the remaining room(s).');
  } catch (error) { notice(error.message, true); await load(); }
  finally { button.disabled = false; }
});

load();
