import {currency} from './shared.js';

// Hotel catalog labels are explicit: never infer a country from a partial name.
export const countryCodes = {
  Australia:'AUS',Brazil:'BRA',Canada:'CAN',China:'CHN',Denmark:'DNK',Egypt:'EGY',France:'FRA',
  Germany:'DEU',India:'IND',Italy:'ITA',Japan:'JPN',Mexico:'MEX',Nigeria:'NGA',Pakistan:'PAK',
  Russia:'RUS','South Korea':'KOR',Spain:'ESP',Sweden:'SWE','United Kingdom':'GBR',
  'United States':'USA',Vietnam:'VNM'
};
const labels=Object.fromEntries(Object.entries(countryCodes).map(([name,code])=>[code,name]));
const $=selector=>document.querySelector(selector),svgNS='http://www.w3.org/2000/svg';
const svg=$('#country-map'),layer=document.createElementNS(svgNS,'g');svg.append(layer);
const paths=new Map(),features=new Map();
let rows=[],selected='',ready=false,version=0,geometryPromise,scale=1,tx=0,ty=0,drag;
let stateMessage='Loading country revenue…';
const number=value=>value===null?'Unknown':new Intl.NumberFormat('en-DK').format(value);
function node(tag,attributes={}){const element=document.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attributes))element.setAttribute(key,value);return element;}
function coordinates([lon,lat]){return [(lon+180)/360*960+20,(85-lat)/145*400+20];}
function polygonPath(geometry){
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  return polygons.map(polygon=>polygon.map(ring=>ring.map((point,i)=>`${i?'L':'M'}${coordinates(point).map(v=>v.toFixed(2)).join(',')}`).join('')+'Z').join('')).join('');
}
function zoom(next){
  const previous=scale;scale=Math.max(1,Math.min(6,next));
  tx=500-(500-tx)*scale/previous;ty=220-(220-ty)*scale/previous;transform();
}
function transform(){
  tx=Math.max(1000*(1-scale),Math.min(0,tx));ty=Math.max(440*(1-scale),Math.min(0,ty));
  svg.style.touchAction=scale>1?'none':'pan-y';svg.style.cursor=scale>1?'grab':'default';
  layer.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
  $('#map-zoom-in').disabled=scale>=6;$('#map-zoom-out').disabled=scale<=1;
  $('#map-zoom-status').textContent=`${Math.round(scale*100)}%`;
}
function reset(){scale=1;tx=0;ty=0;transform();}
function countryName(feature){return labels[feature.id]??feature.name;}
function dataFor(name){return rows.find(row=>row.country===name);}
function color(value,min,max){
  const ratio=max===min?1:Math.max(0,Math.min(1,(value-min)/(max-min)));
  return `rgb(${[219,234,254].map((start,i)=>Math.round(start+([15,64,128][i]-start)*ratio)).join(', ')})`;
}
function details(){
  const row=dataFor(selected);
  $('#map-country-name').textContent=selected||'Choose a country';
  $('#map-country-revenue').textContent=!ready?stateMessage:row?currency(row.roomRevenue):'No data';
  for(const [id,field] of [['map-country-bookings','bookingCount'],['map-country-guests','guestCount'],['map-country-known','knownGuestCount'],['map-country-unknown','unknownGuestBookingCount']]){
    $(`#${id}`).textContent=!ready?'—':row?number(row[field]):'—';
  }
  $('#map-country-note').textContent=!ready?'':!row?'No room-revenue records for this country in the selected period.':
    `${countryCodes[selected]&&features.has(countryCodes[selected])?'':'Not mapped geographically; figures remain available. '}${row.containsSyntheticData?'Includes history imported from Excel.':'Saved operational records.'}${row.unknownGuestBookingCount?' Complete guest count is unknown; known guests are a subtotal.':''}`;
  $('#map-country-select').value=selected;
  for(const [code,path] of paths){const active=countryName(features.get(code))===selected;path.classList.toggle('is-selected',active);if(path.getAttribute('role')==='button')path.setAttribute('aria-pressed',String(active));}
}
function choose(name){selected=name;details();}
function tooltip(name,event){
  const tip=$('#country-map-tooltip'),row=dataFor(name);tip.textContent=`${name} · ${row?currency(row.roomRevenue):'No data'}`;
  tip.hidden=false;
  const frame=$('#country-map-frame').getBoundingClientRect();
  const x=event?event.clientX-frame.left:frame.width/2,y=event?event.clientY-frame.top:30;
  tip.style.left=`${Math.max(8,Math.min(frame.width-240,x+12))}px`;tip.style.top=`${Math.max(8,y-48)}px`;
}
function options(){
  const names=new Set([...features.values()].map(countryName));for(const row of rows)names.add(row.country);
  const select=$('#map-country-select');select.replaceChildren(new Option('Choose a country',''),...[...names].sort((a,b)=>a.localeCompare(b)).map(name=>new Option(name,name)));
  select.disabled=!ready;select.value=selected;
}
function paint(){
  const values=rows.filter(r=>r.roomRevenue!==null).map(r=>Number(r.roomRevenue));
  const min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):0;
  for(const [code,path] of paths){
    const name=countryName(features.get(code)),row=ready?dataFor(name):undefined,hasData=row?.roomRevenue!==null&&row?.roomRevenue!==undefined;
    path.setAttribute('fill',hasData?color(Number(row.roomRevenue),min,max):'#e2e3e2');
    path.dataset.hasData=String(hasData);path.setAttribute('aria-label',`${name}: ${hasData?currency(row.roomRevenue):'No data'}`);
    path.setAttribute('tabindex',hasData?'0':'-1');
    if(hasData){path.setAttribute('role','button');path.setAttribute('aria-pressed',String(name===selected));}
    else{path.removeAttribute('role');path.removeAttribute('aria-pressed');}
    path.querySelector('title').textContent=`${name}: ${hasData?currency(row.roomRevenue):'No data'}`;
  }
  $('#map-legend-min').textContent=values.length?currency(String(min)):'No data';
  $('#map-legend-max').textContent=values.length?currency(String(max)):'No data';
  $('#map-gradient').style.background=values.length&&min===max?'rgb(15, 64, 128)':'';
  $('#map-state').textContent=!ready?stateMessage:values.length?`${values.length} guest markets · color scale for this period${min===max?' · equal revenue':''}`:'No country revenue recorded for this period.';
  options();details();
}
async function loadGeometry(){
  if(paths.size)return;
  if(!geometryPromise)geometryPromise=fetch('/assets/maps/world-countries.json').then(async response=>{
    if(!response.ok)throw new Error('Map boundaries could not be loaded.');
    const world=await response.json();
    for(const feature of world){
      features.set(feature.id,feature);
      const path=node('path',{d:polygonPath(feature.geometry),'data-country-code':feature.id,fill:'#e2e3e2','fill-rule':'evenodd','vector-effect':'non-scaling-stroke'});
      path.append(node('title'));paths.set(feature.id,path);layer.append(path);
      const name=countryName(feature);
      path.addEventListener('pointermove',event=>{if(ready&&!drag?.moved)tooltip(name,event);});
      path.addEventListener('pointerleave',()=>{$('#country-map-tooltip').hidden=true;});
      path.addEventListener('click',()=>{if(ready&&!drag?.moved)choose(name);});
      path.addEventListener('focus',()=>{if(ready&&!drag){choose(name);tooltip(name);}});
      path.addEventListener('blur',()=>{$('#country-map-tooltip').hidden=true;});
      path.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(name);}});
    }
  }).catch(error=>{geometryPromise=null;throw error;});
  await geometryPromise;
}
export function clearCountryMap(message='Loading country revenue…'){
  version++;ready=false;rows=[];stateMessage=message;$('#map-load-error').hidden=true;$('#country-map-tooltip').hidden=true;paint();
}
export async function renderCountryMap(values,scope){
  const request=++version;rows=values;ready=true;
  $('#map-period').textContent=scope?`Calendar year ${scope}`:'All saved years';
  if(!selected)selected=rows.find(r=>r.roomRevenue!==null)?.country??'';
  try{await loadGeometry();if(request!==version)return;paint();$('#map-load-error').hidden=true;}
  catch(error){
    if(request!==version)return;
    options();details();$('#map-state').textContent='Map unavailable; country data is available below.';
    $('#map-load-error').textContent=error.message;$('#map-load-error').hidden=false;
  }
}
$('#map-country-select').addEventListener('change',event=>choose(event.target.value));
$('#map-zoom-in').addEventListener('click',()=>zoom(scale*1.5));
$('#map-zoom-out').addEventListener('click',()=>zoom(scale/1.5));
$('#map-reset').addEventListener('click',reset);
svg.addEventListener('pointerdown',event=>{
  if(scale===1||event.button!==0)return;
  drag={x:event.clientX,y:event.clientY,tx,ty,moved:false,code:event.target.closest('[data-country-code]')?.dataset.countryCode};svg.setPointerCapture(event.pointerId);
});
svg.addEventListener('pointermove',event=>{
  if(!drag||!svg.hasPointerCapture(event.pointerId))return;
  const bounds=svg.getBoundingClientRect(),dx=(event.clientX-drag.x)*1000/bounds.width,dy=(event.clientY-drag.y)*440/bounds.height;
  if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;
  if(drag.moved){tx=drag.tx+dx;ty=drag.ty+dy;transform();$('#country-map-tooltip').hidden=true;}
});
svg.addEventListener('pointerup',event=>{if(drag&&!drag.moved&&drag.code&&ready)choose(countryName(features.get(drag.code)));if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);setTimeout(()=>{drag=null;},0);});
svg.addEventListener('pointercancel',()=>{drag=null;});
transform();
svg.addEventListener('keydown',event=>{
  if(scale<=1||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();tx+=event.key==='ArrowLeft'?60:event.key==='ArrowRight'?-60:0;
  ty+=event.key==='ArrowUp'?60:event.key==='ArrowDown'?-60:0;transform();
});
