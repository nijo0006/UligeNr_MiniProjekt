// Guest questionnaire reached from the email sent when a stay is completed (Story 24).
// The link token is the only key; the page shows nothing but the stay's questions and rooms.
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
  fieldset.append(ratingScale(`room-${room.roomNumber}`, `Room ${room.roomNumber}`));
  return fieldset;
}

function ratingScale(name, subject) {
  const scale = document.createElement('div'); scale.className = 'rating-scale';
  labels.forEach((text, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'radio'; input.name = name; input.value = String(index + 1);
    input.setAttribute('aria-label', `${subject}: ${index + 1} of 5, ${text}`);
    const face = document.createElement('span'); face.append(String(index + 1));
    const small = document.createElement('small'); small.textContent = text; face.append(small);
    label.append(input, face); scale.append(label);
  });
  return scale;
}

// Shows the unanswered questions; returns true when everything has been answered.
function render({ rooms, overallAnswered, recommendationAnswered }) {
  if (rooms.every(room => room.answered) && overallAnswered && recommendationAnswered) { showThanks(); return true; }
  const overall = $('#survey-overall'); overall.hidden = overallAnswered;
  overall.querySelector('.rating-scale')?.remove(); if (!overallAnswered) overall.append(ratingScale('overall', 'Your stay overall'));
  $('#survey-rooms').replaceChildren(...rooms.map(roomFieldset));
  const recommend = $('#survey-recommend'); recommend.hidden = recommendationAnswered;
  for (const input of recommend.querySelectorAll('input')) input.checked = false;
  $('#survey-form').hidden = false;
  return false;
}

function showThanks() { $('#survey-form').hidden = true; $('#survey-intro').hidden = true; $('#survey-thanks').hidden = false; }

async function load() {
  try {
    render(await api(`/questionnaires/${encodeURIComponent(token)}`));
  } catch (error) {
    $('#survey-intro').hidden = true;
    notice(`${error.message} Please use the link from your email, or contact the reception.`, true);
  }
}

$('#survey-form').addEventListener('submit', async event => {
  event.preventDefault();
  const ratings = [...document.querySelectorAll('#survey-rooms .survey-room:not(.answered)')]
    .map(fieldset => ({ roomNumber: fieldset.dataset.roomNumber, checked: fieldset.querySelector('input:checked') }))
    .filter(room => room.checked).map(room => ({ roomNumber: room.roomNumber, rating: Number(room.checked.value) }));
  const recommend = $('#survey-recommend').hidden ? null : document.querySelector('input[name=wouldRecommend]:checked');
  const overall = $('#survey-overall').hidden ? null : document.querySelector('input[name=overall]:checked');
  const body = { ratings, ...(overall ? { overallRating: Number(overall.value) } : {}), ...(recommend ? { wouldRecommend: recommend.value === 'true' } : {}) };
  if (!ratings.length && !recommend && !overall) return notice('Please answer at least one question.', true);
  const button = $('#survey-submit'); button.disabled = true; notice('');
  try {
    await api(`/questionnaires/${encodeURIComponent(token)}/responses`, { method: 'POST', body: JSON.stringify(body) });
    if (!render(await api(`/questionnaires/${encodeURIComponent(token)}`))) notice('Thank you! Your answers are saved. You can still answer the remaining question(s).');
  } catch (error) { notice(error.message, true); await load(); }
  finally { button.disabled = false; }
});

load();
