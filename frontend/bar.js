import {api,currency,option,extendNumbers} from './shared.js';
const $=selector=>document.querySelector(selector);
const year=$('#bar-year'),drink=$('#drink'),date=$('#sales-date'),quantity=$('#bar-quantity');
let menu=[];
let reportRequest=0,dailyRequest=0,dailyLoading=false;
const percent=value=>value===null?'No data':`${value.toFixed(1)}%`;
function error(message){$('#bar-error').hidden=!message;$('#bar-error').textContent=message;}
function addYear(value){if(![...year.options].some(o=>o.value===String(value)))year.add(option(String(value)));}
async function refreshBar(){
  const request=++reportRequest;
  error('');
  for(const id of ['#bar-revenue','#bar-units','#bar-mix'])$(id).textContent='Loading…';
  $('#drink-revenue').replaceChildren();
  try{
    const report=await api(`/reports/bar?year=${year.value}`);
    if(request!==reportRequest)return;
    $('#bar-revenue').textContent=currency(report.revenue);
    $('#bar-units').textContent=report.units===null?'No data':new Intl.NumberFormat('en-DK').format(report.units);
    $('#bar-mix').textContent=report.mixStatus==='undefined'?'Not defined':`${percent(report.cocktailPercent)} / ${percent(report.coffeePercent)}`;
    $('#bar-mix-note').textContent=report.mixStatus==='undefined'?'No percentage can be calculated from zero cocktail/coffee revenue.':'Cocktails / Coffee · Wine and beer excluded.';
    for(const row of report.drinks){
      const tr=document.createElement('tr');
      for(const value of [row.name,row.category,row.units===null?'—':row.units,currency(row.revenue)]){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}
      $('#drink-revenue').append(tr);
    }
  }catch(e){if(request!==reportRequest)return;error(e.message);for(const id of ['#bar-revenue','#bar-units','#bar-mix'])$(id).textContent='Unavailable';}
}
async function loadDaily(){
  const request=++dailyRequest;dailyLoading=true;
  const selected=menu.find(d=>String(d.drinkId)===drink.value);
  if(!selected||!date.value){dailyLoading=false;return;}
  try{
    const day=await api(`/bar-sales?date=${date.value}`);
    if(request!==dailyRequest)return;
    const saved=day.sales.find(s=>s.drinkId===selected.drinkId);
    const value=saved?.quantity??0;
    if(![...quantity.options].some(o=>o.value===String(value)))quantity.add(option(String(value)));
    quantity.value=String(value);
    $('#drink-price').textContent=currency(saved?.unitPrice??selected.unitPrice);
    $('#daily-saved').textContent=saved?`${value} units already saved for this date and drink.${saved.synthetic?' Excel demonstration date.':''}`:'No closing quantity recorded for this date and drink.';
  }catch(e){if(request===dailyRequest)error(e.message);}finally{if(request===dailyRequest)dailyLoading=false;}
}
quantity.add(option('0'));extendNumbers(quantity);
quantity.addEventListener('change',()=>{if(quantity.value==='more'){const next=Number(quantity.options[quantity.options.length-2].value)+1;extendNumbers(quantity);quantity.value=String(next);}});
year.addEventListener('change',refreshBar);
for(const control of [date,drink])control.addEventListener('change',loadDaily);
$('#bar-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if(dailyLoading){error('Please wait for the saved daily quantity to load.');return;}
  const salesDate=date.value,id=drink.value,units=Number(quantity.value);
  try{
    const saved=await api(`/bar-sales/${salesDate}/${id}`,{method:'PUT',body:JSON.stringify({quantity:units})});
    addYear(Number(salesDate.slice(0,4)));year.value=salesDate.slice(0,4);
    $('#bar-save-status').textContent=`Saved ${saved.quantity} units for ${salesDate}. Total ${currency(saved.revenue)}.`;
    await Promise.all([refreshBar(),loadDaily()]);
  }catch(e){error(e.message);}
});
try{
  for(const y of new Set([2024,2025,2026,new Date().getFullYear()]))addYear(y);
  year.value=String(new Date().getFullYear());
  const now=new Date();date.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  menu=await api('/drinks');
  for(const d of menu)drink.add(option(`${d.name} · ${d.category}`,String(d.drinkId)));
  await Promise.all([refreshBar(),loadDaily()]);
}catch(e){error(e.message);}
