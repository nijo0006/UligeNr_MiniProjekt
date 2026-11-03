import {api,currency} from './shared.js';
const $=selector=>document.querySelector(selector);
let requestNumber=0;
const count=value=>value===null?'No data':new Intl.NumberFormat('en-DK').format(value);
function table(id,rows,values){
  const body=$(id);body.replaceChildren();
  for(const row of rows){const tr=document.createElement('tr');for(const value of values(row)){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}body.append(tr);}
  if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=body.closest('table').querySelectorAll('th').length;td.textContent='No data for this period.';tr.append(td);body.append(tr);}
}
export async function refreshReports(year){
  const request=++requestNumber,query=year?`?year=${encodeURIComponent(year)}`:'';
  const panel=$('#operational-reports');panel.setAttribute('aria-busy','true');
  $('#reports-error').hidden=true;
  $('#report-scope').textContent=year?`Calendar year ${year}`:'All saved years · occupancy requires one year';
  for(const id of ['#occupancy','#sold-nights','#known-guests'])$(id).textContent='Loading…';
  for(const id of ['#country-report','#season-report','#room-report','#inventory-report','#satisfaction-report'])$(id).replaceChildren();
  try{
    const [summary,countries,seasons,rooms,inventory,satisfaction]=await Promise.all([
      api(`/reports/summary${query}`),api(`/reports/countries${query}`),api(`/reports/room-types-seasons${query}`),
      api(`/reports/rooms${query}`),api('/reports/inventory'),api('/reports/satisfaction')
    ]);
    if(request!==requestNumber)return;
    $('#occupancy').textContent=summary.year===null?'Select one year':summary.occupancyPercent===null?'No data':`${summary.occupancyPercent.toFixed(1)}%`;
    $('#occupancy-note').textContent=summary.year===null?'All-year totals are not an annual occupancy rate.':`Sold room-nights / ${count(summary.occupancyCapacity)} · fixed agreed capacity`;
    $('#sold-nights').textContent=count(summary.soldRoomNights);
    $('#known-guests').textContent=count(summary.guestCount);
    $('#guest-note').textContent=summary.unknownGuestBookingCount?`${count(summary.knownGuestCount)} known guests; ${count(summary.unknownGuestBookingCount)} bookings have unknown guest counts.`:`${count(summary.bookingCount)} bookings · guests counted once per booking.`;
    $('#report-provenance').textContent=summary.containsSyntheticData?'Includes imported history with demonstration dates and room assignments.':'Based on saved operational records.';
    table('#country-report',countries,r=>[r.country,count(r.bookingCount),count(r.guestCount),count(r.knownGuestCount),count(r.unknownGuestBookingCount),currency(r.roomRevenue)]);
    table('#season-report',seasons,r=>[r.roomType,{low:'Low',mid:'Mid',high:'High'}[r.season],count(r.soldRoomNights),currency(r.roomRevenue)]);
    table('#room-report',rooms,r=>[r.roomNumber,r.roomType,count(r.soldRoomNights),currency(r.roomRevenue)]);
    table('#inventory-report',inventory,r=>[r.roomType,count(r.roomCount),r.synthetic?'Demonstration inventory':'Hotel inventory']);
    table('#satisfaction-report',satisfaction,r=>[r.roomNumber,r.roomType,count(r.responseCount),r.meanRating===null?'No data':`${r.meanRating.toFixed(1)} / 5`]);
  }catch(error){
    if(request!==requestNumber)return;
    $('#reports-error').textContent=`Reports unavailable: ${error.message}`;$('#reports-error').hidden=false;
    for(const id of ['#occupancy','#sold-nights','#known-guests'])$(id).textContent='Unavailable';
    for(const id of ['#occupancy-note','#guest-note','#report-provenance'])$(id).textContent='';
  }finally{if(request===requestNumber)panel.setAttribute('aria-busy','false');}
}
document.addEventListener('reporting-year-change',event=>refreshReports(event.detail));
