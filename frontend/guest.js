import {mountBookingForm} from './bookingForm.js';
import {currency} from './shared.js';
try {
  await mountBookingForm(async booking=>{
    document.querySelector('#confirmation').hidden=false;
    document.querySelector('#confirmation-details').textContent=`Booking #${booking.bookingId} · ${booking.holderFirstName} ${booking.holderLastName} · ${booking.arrival} → ${booking.departure} · Rooms ${booking.roomNumbers.join(', ')}`;
    document.querySelector('#confirmation-total').textContent=currency(booking.totalPrice);
    document.querySelector('#notice').hidden=true;
    document.querySelector('#confirmation').scrollIntoView({behavior:'smooth',block:'start'});
  });
} catch(error) {const notice=document.querySelector('#notice');notice.hidden=false;notice.classList.add('error');notice.textContent=error.message;}
