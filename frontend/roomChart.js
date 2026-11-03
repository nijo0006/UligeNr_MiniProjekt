import {currency} from './shared.js';
import {roomTypeColors} from './roomTypePalette.js';
const $=selector=>document.querySelector(selector);
let rows=[],showAll=false,period='2026';
function draw(){
  const list=$('#room-report');list.replaceChildren();
  $('.room-chart-scroll').classList.toggle('is-all',showAll);
  const recorded=rows.filter(row=>row.roomRevenue!==null),visible=showAll?rows:recorded.slice(0,10);
  const max=Math.max(0,...recorded.map(row=>Number(row.roomRevenue)));
  const toggle=$('#room-chart-toggle');toggle.disabled=!rows.length;
  toggle.textContent=showAll?'Show top 10':`Show all rooms (${rows.length})`;
  toggle.setAttribute('aria-pressed',String(showAll));
  $('#room-chart-status').textContent=`${showAll?`All ${rows.length} rooms`:`Top ${Math.min(10,recorded.length)} earning rooms`} · Calendar year ${period}`;
  $('#room-chart-empty').hidden=visible.length>0;
  $('#room-chart-empty').textContent='No room revenue recorded for this period.';
  const number=value=>new Intl.NumberFormat('en-DK',{maximumFractionDigits:1}).format(value);
  $('#room-axis-mid').textContent=number(max/2);$('#room-axis-max').textContent=number(max);
  for(const row of visible){
    const item=document.createElement('li');item.className='room-bar-row';item.dataset.roomNumber=row.roomNumber;
    const label=document.createElement('div');label.className='room-bar-label';
    const name=document.createElement('strong');name.textContent=`Room ${row.roomNumber}`;
    const type=document.createElement('span');type.textContent=row.roomType;label.append(name,type);
    const track=document.createElement('div');track.className='room-bar-track';track.setAttribute('aria-hidden','true');
    const fill=document.createElement('span');fill.className='room-bar-fill';fill.style.background=roomTypeColors[row.roomType]??'#6f8e85';
    fill.style.width=row.roomRevenue===null?'0%':`${max>0?Number(row.roomRevenue)/max*100:0}%`;
    if(row.roomRevenue!==null&&Number(row.roomRevenue)===0)fill.classList.add('is-zero');
    track.append(fill);
    const figures=document.createElement('div');figures.className='room-bar-figures';
    const amount=document.createElement('strong');amount.textContent=currency(row.roomRevenue);
    const nights=document.createElement('span');nights.textContent=`${new Intl.NumberFormat('en-DK').format(row.soldRoomNights)} room-nights`;
    figures.append(amount,nights);item.append(label,track,figures);list.append(item);
  }
}
export function clearRoomChart(message='Loading room revenue…'){
  rows=[];$('#room-report').replaceChildren();$('#room-chart-status').textContent=message;
  $('#room-chart-toggle').disabled=true;$('#room-chart-empty').hidden=true;
  $('#room-axis-mid').textContent='—';$('#room-axis-max').textContent='—';
}
export function renderRoomChart(values,year){rows=values;period=year;draw();}
$('#room-chart-toggle').addEventListener('click',()=>{showAll=!showAll;draw();});
