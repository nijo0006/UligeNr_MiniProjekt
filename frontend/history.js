import {api,currency} from './shared.js';
const status=document.querySelector('#history-status');
try{
  const history=await api('/reports/history');
  if(history.state!=='imported')status.textContent='Excel history has not been imported.';
  else{
    status.textContent=`${history.sourceTotals.bookings.toLocaleString('en-DK')} Excel bookings and ${history.sourceTotals.barUnits.toLocaleString('en-DK')} bar units imported. The workbook belongs to 2026. Exact dates and room assignments within 2026 are generated, not observed. Missing guest counts remain unknown.`;
    const controls=document.querySelector('#history-controls');controls.hidden=false;
    const title=document.createElement('p');title.className='hint';title.textContent='Original Excel reference totals · 2026 · unchanged source values';controls.append(title);
    const grid=document.createElement('div');grid.className='history-totals';
    for(const [label,value] of [['Source room revenue',currency(history.sourceTotals.roomRevenue)],['Source bar revenue',currency(history.sourceTotals.barRevenue)],['Source room-nights',String(history.sourceTotals.roomNights)]]){
      const item=document.createElement('div'),name=document.createElement('span'),amount=document.createElement('strong');name.textContent=label;amount.textContent=value;item.append(name,amount);grid.append(item);
    }
    controls.append(grid);
    const link=document.createElement('a');link.href='/api/reports/history';link.textContent='View import details ↗';controls.append(link);
  }
}catch(error){status.textContent=`Import status unavailable: ${error.message}`;}
