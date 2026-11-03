import {api,option} from './shared.js';
const form=document.querySelector('#questionnaire-form');
const bookingSelect=document.querySelector('#questionnaire-booking');
const roomSelect=document.querySelector('#questionnaire-room');
const notice=document.querySelector('#questionnaire-status');
let bookings=[];
function rooms(){
  const booking=bookings.find(b=>String(b.bookingId)===bookingSelect.value);
  roomSelect.replaceChildren(option('Select a booked room',''),...(booking?.roomNumbers??[]).map(n=>option(n)));
  form.querySelector('button[type=submit]').disabled=!booking;
}
export function updateQuestionnaireBookings(values){
  bookings=values;const selected=bookingSelect.value;
  bookingSelect.replaceChildren(option('Select a booking',''),...bookings.map(b=>option(`#${b.bookingId} · ${b.holderFirstName} ${b.holderLastName} · ${b.arrival}`,String(b.bookingId))));
  if(bookings.some(b=>String(b.bookingId)===selected))bookingSelect.value=selected;
  rooms();
}
export function openQuestionnaire(booking){
  bookingSelect.value=String(booking.bookingId);rooms();
  notice.hidden=true;form.reset();bookingSelect.value=String(booking.bookingId);rooms();
  document.querySelector('#questionnaire').scrollIntoView({behavior:'smooth',block:'start'});roomSelect.focus({preventScroll:true});
}
bookingSelect.addEventListener('change',rooms);
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;notice.hidden=true;
  try{
    const saved=await api('/satisfaction',{method:'POST',body:JSON.stringify({bookingId:Number(bookingSelect.value),roomNumber:roomSelect.value,rating:Number(form.elements.rating.value)})});
    notice.classList.remove('error');notice.textContent=`Questionnaire #${saved.responseId} recorded for booking #${saved.bookingId}, room ${saved.roomNumber}: ${saved.rating} / 5. View updated room means on Overview.`;notice.hidden=false;
    form.elements.rating.value='';
  }catch(error){notice.classList.add('error');notice.textContent=error.message;notice.hidden=false;}
  finally{button.disabled=false;}
});
