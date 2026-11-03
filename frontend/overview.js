import {api} from './shared.js';
import {refreshRevenue} from './revenue.js';
import './history.js';
import './reports.js';

async function loadOverview(){
  const error=document.querySelector('#overview-error');
  error.hidden=true;
  try{
    const bookings=await api('/bookings');
    document.querySelector('#active-bookings').textContent=new Intl.NumberFormat('en-DK').format(bookings.length);
  }catch(e){
    document.querySelector('#active-bookings').textContent='Unavailable';
    error.textContent=e.message;error.hidden=false;
  }
  await refreshRevenue();
}
await loadOverview();
window.addEventListener('pageshow',event=>{if(event.persisted)loadOverview();});
