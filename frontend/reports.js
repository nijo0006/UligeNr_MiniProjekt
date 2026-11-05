import {api,currency} from './shared.js';
import {roomTypeColors} from './roomTypePalette.js';
import {clearRoomChart,renderRoomChart} from './roomChart.js';
import {clearCountryMap,renderCountryMap} from './countryMap.js';
import {clearSeasonChart,renderSeasonChart} from './seasonChart.js';
const $=selector=>document.querySelector(selector);
let requestNumber=0;
const count=value=>value===null?'No data':new Intl.NumberFormat('en-DK').format(value);
function table(id,rows,values,decorate){
  const body=$(id);body.replaceChildren();
  for(const row of rows){const tr=document.createElement('tr');for(const value of values(row)){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}decorate?.(tr,row);body.append(tr);}
  if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=body.closest('table').querySelectorAll('th').length;td.textContent='No data for this period.';tr.append(td);body.append(tr);}
}
export async function refreshReports(year){
  const request=++requestNumber,query=year?`?year=${encodeURIComponent(year)}`:'';
  const panel=$('#operational-reports');panel.setAttribute('aria-busy','true');
  $('#reports-error').hidden=true;
  clearCountryMap();
  clearSeasonChart();
  clearRoomChart();
  $('#report-scope').textContent=year?`Calendar year ${year}`:'All saved years · occupancy requires one year';
  for(const id of ['#occupancy','#sold-nights','#known-guests','#overall-rating','#recommendation-percent'])$(id).textContent='Loading…';
  for(const id of ['#country-report','#season-report','#room-report','#inventory-report','#satisfaction-report'])$(id).replaceChildren();
  try{
    const [summary,countries,seasons,rooms,inventory,satisfaction,stayFeedback]=await Promise.all([
      api(`/reports/summary${query}`),api(`/reports/countries${query}`),api(`/reports/room-types-seasons${query}`),
      api(`/reports/rooms${query}`),api('/reports/inventory'),api('/reports/satisfaction?groupBy=roomType'),api('/reports/stay-feedback')
    ]);
    if(request!==requestNumber)return;
    $('#occupancy').textContent=summary.year===null?'Select one year':summary.occupancyPercent===null?'No data':`${summary.occupancyPercent.toFixed(1)}%`;
    $('#occupancy-note').textContent=summary.year===null?'All-year totals are not an annual occupancy rate.':`Sold room-nights / ${count(summary.occupancyCapacity)} · fixed agreed capacity`;
    $('#sold-nights').textContent=count(summary.soldRoomNights);
    $('#known-guests').textContent=count(summary.guestCount);
    $('#guest-note').textContent=summary.unknownGuestBookingCount?`${count(summary.knownGuestCount)} known guests; ${count(summary.unknownGuestBookingCount)} bookings have unknown guest counts.`:`${count(summary.bookingCount)} bookings · guests counted once per booking.`;
    $('#report-provenance').textContent=summary.containsSyntheticData?'Includes imported history with demonstration dates and room assignments.':'Based on saved operational records.';
    renderCountryMap(countries,year);
    renderSeasonChart(seasons,year);
    table('#country-report',countries,r=>[r.country,count(r.bookingCount),count(r.guestCount),count(r.knownGuestCount),count(r.unknownGuestBookingCount),currency(r.roomRevenue)]);
    table('#season-report',seasons,r=>[r.roomType,{low:'Low',mid:'Mid',high:'High'}[r.season],count(r.soldRoomNights),currency(r.roomRevenue)],(tr,row)=>{
      tr.dataset.roomType=row.roomType;tr.style.setProperty('--room-type-color',roomTypeColors[row.roomType]??'#d0c2b2');
    });
    renderRoomChart(rooms,year);
    table('#inventory-report',inventory,r=>[r.roomType,count(r.roomCount)]);
    const {overall,recommendation}=stayFeedback;
    $('#overall-rating').textContent=overall.meanRating===null?'No data':`${overall.meanRating.toFixed(1)} / 5`;
    $('#overall-note').textContent=overall.responseCount?`Average of ${count(overall.responseCount)} ${overall.responseCount===1?'stay':'stays'} · guest questionnaire after check-out · all-time`:'No answers yet. Guests answer in the questionnaire emailed after check-out.';
    $('#recommendation-percent').textContent=recommendation.recommendPercent===null?'No data':`${recommendation.recommendPercent.toFixed(1)}%`;
    $('#recommendation-note').textContent=recommendation.responseCount?`${count(recommendation.recommendCount)} of ${count(recommendation.responseCount)} ${recommendation.responseCount===1?'guest':'guests'} answered yes · guest questionnaire after check-out · all-time`:'No answers yet. Guests answer in the questionnaire emailed after check-out.';
    table('#satisfaction-report',satisfaction,r=>[r.roomType,r.meanRating===null?'No data':`${r.meanRating.toFixed(1)} / 5`]);
  }catch(error){
    if(request!==requestNumber)return;
    clearCountryMap('Country revenue unavailable');
    clearSeasonChart('Seasonal revenue unavailable');
    clearRoomChart('Room revenue unavailable');
    $('#reports-error').textContent=`Reports unavailable: ${error.message}`;$('#reports-error').hidden=false;
    for(const id of ['#occupancy','#sold-nights','#known-guests','#overall-rating','#recommendation-percent'])$(id).textContent='Unavailable';
    for(const id of ['#occupancy-note','#guest-note','#report-provenance','#overall-note','#recommendation-note'])$(id).textContent='';
  }finally{if(request===requestNumber)panel.setAttribute('aria-busy','false');}
}
document.addEventListener('reporting-year-change',event=>refreshReports(event.detail));
