import {api,currency} from './shared.js';
import {mountBookingForm} from './bookingForm.js';
import {updateQuestionnaireBookings,openQuestionnaire} from './satisfaction.js';
const $=selector=>document.querySelector(selector);
let bookings=[];
let bookingPage=1;
const pageSize=25;
let bookingForm;
function notice(message,error=false){const node=$('#notice');node.hidden=!message;node.textContent=message;node.classList.toggle('error',error);}
function renderBookings() {
  const container = $('#bookings'); container.replaceChildren();
  $('#reservation-count').textContent = `${bookings.length} active ${bookings.length === 1 ? 'reservation' : 'reservations'}`;
  const year=$('#booking-year').value,search=$('#booking-search').value.trim().toLowerCase();
  const filtered=bookings.filter(b=>(!year || (b.arrival < `${Number(year)+1}-01-01` && b.departure > `${year}-01-01`)) &&
    (search.startsWith('#') ? b.bookingId===Number(search.slice(1)) : `${b.bookingId} ${b.holderFirstName} ${b.holderLastName} ${b.holderEmail??''} ${b.holderCountry} ${b.roomNumbers.join(' ')} ${b.sourceId??''}`.toLowerCase().includes(search)));
  bookingPage=Math.max(1,Math.min(bookingPage,Math.ceil(filtered.length/pageSize)));
  const start=(bookingPage-1)*pageSize,visible=filtered.slice(start,start+pageSize);
  $('#booking-page-status').textContent=filtered.length?`Showing ${start+1}–${Math.min(start+pageSize,filtered.length)} of ${filtered.length} matching bookings.`:'No bookings match this selection.';
  $('#previous-bookings').disabled=bookingPage===1;$('#next-bookings').disabled=start+pageSize>=filtered.length;
  if (!visible.length) { const empty = document.createElement('div'); empty.className = 'empty'; const title = document.createElement('strong'); title.textContent = bookings.length ? 'No matching bookings' : 'Ready for your first guest'; const p = document.createElement('p'); p.textContent = 'Create a booking to see it here. Changes are saved in PostgreSQL.'; empty.append(title,p); container.append(empty); }
  for (const booking of visible) {
    const article = document.createElement('article'); article.className = 'reservation'; article.dataset.bookingId = booking.bookingId;
    const top = document.createElement('div'); top.className = 'reservation-top'; const details = document.createElement('div');
    const id = document.createElement('div'); id.className = 'id'; id.textContent = `BOOKING #${booking.bookingId}`;
    const name = document.createElement('h3'); name.textContent = `${booking.holderFirstName} ${booking.holderLastName}`;
    const amount = document.createElement('strong'); amount.className = 'amount'; amount.textContent = currency(booking.totalPrice);
    const email = document.createElement('p'); email.className = 'email'; email.textContent = booking.holderEmail ?? 'No email (Excel)';
    details.append(id,name,email); top.append(details,amount);
    const stay = document.createElement('p'); stay.textContent = `${booking.arrival} → ${booking.departure} · ${booking.nights} nights`;
    const rooms = document.createElement('p'); rooms.textContent = `Rooms ${booking.roomNumbers.join(', ')} · ${booking.guestCount ?? 'Unknown'} guests · ${booking.holderCountry}`;
    const actions = document.createElement('div'); actions.className = 'reservation-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit booking'; edit.addEventListener('click', () => bookingForm.edit(booking.bookingId));
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'danger'; cancel.textContent = 'Cancel booking';
    cancel.addEventListener('click', async () => { if (!confirm(`Cancel booking #${booking.bookingId} for ${booking.holderFirstName} ${booking.holderLastName}?`)) return; try { await api(`/bookings/${booking.bookingId}`, { method: 'DELETE' }); bookingForm.cancelEditing(booking.bookingId); await loadBookings(); await bookingForm.refreshRooms(); notice(`Booking #${booking.bookingId} cancelled.`); } catch (error) { notice(error.message, true); } });
    const questionnaire=document.createElement('button');questionnaire.type='button';questionnaire.textContent='Record satisfaction';questionnaire.addEventListener('click',()=>openQuestionnaire(booking));
    actions.append(edit,cancel,questionnaire); article.append(top,stay,rooms);
    if(booking.sourceId){const provenance=document.createElement('p');provenance.className='source-label';provenance.textContent=`Excel booking ${booking.sourceId.split(':').at(-1)} · ${booking.syntheticDates?'demonstration dates':'updated dates'} · ${booking.pricingMode==='source-preserved'?'original Excel price':'recalculated tariff'}`;article.append(provenance);}
    article.append(actions); container.append(article);
  }
}

async function loadBookings(){
  bookings=await api('/bookings');
  updateQuestionnaireBookings(bookings);
  const selectedYear=$('#booking-year').value,years=new Set([2026]);
  for(const b of bookings){const last=new Date(`${b.departure}T00:00:00Z`);last.setUTCDate(last.getUTCDate()-1);for(let year=Number(b.arrival.slice(0,4));year<=last.getUTCFullYear();year++)years.add(year);}
  $('#booking-year').replaceChildren(new Option('All years',''),...[...years].sort().reverse().map(y=>new Option(String(y),String(y))));$('#booking-year').value=selectedYear;
  renderBookings();
}
$('#refresh').addEventListener('click',async()=>{try{await loadBookings();await bookingForm.refreshRooms();notice('Bookings refreshed.');}catch(error){notice(error.message,true);}});
for(const id of ['#booking-year','#booking-search'])$(id).addEventListener(id==='#booking-search'?'input':'change',()=>{bookingPage=1;renderBookings();});
$('#previous-bookings').addEventListener('click',()=>{bookingPage--;renderBookings();});
$('#next-bookings').addEventListener('click',()=>{bookingPage++;renderBookings();});
try {
  bookingForm=await mountBookingForm(async booking=>{$('#booking-year').value='';$('#booking-search').value=`#${booking.bookingId}`;bookingPage=1;await loadBookings();notice(`Booking #${booking.bookingId} saved. Total ${currency(booking.totalPrice)}.`);});
  await loadBookings();
}catch(error){notice(error.message,true);$('#reservation-count').textContent='Data unavailable';}
