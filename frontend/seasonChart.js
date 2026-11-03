import {currency} from './shared.js';
const $=selector=>document.querySelector(selector),ns='http://www.w3.org/2000/svg';
const svg=$('#season-chart'),legend=$('#season-chart-legend');
const types=['Standard Single','Grand Lit','Standard Double','Superior Double','Junior Suite','Spa Executive','Suite','LOFT Suite'];
const colors=['#dbeafe','#bed5ef','#a1c1e0','#83acd2','#6597c3','#4581b2','#28669d','#0f4080'];
const seasons=[['low','Low season'],['mid','Mid season'],['high','High season']];
const hidden=new Set();let rows=[];
function node(tag,attributes={},text){const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attributes))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
function upperBound(max){
  if(max<=0)return 1;
  const unit=10**Math.floor(Math.log10(max/4)),step=[1,2,2.5,5,10].find(n=>n*unit>=max/4)*unit;
  return Math.ceil(max/step)*step;
}
function showValue(row){
  $('#season-chart-value').textContent=`${row.roomType} · ${seasons.find(([key])=>key===row.season)[1]} · ${currency(row.roomRevenue)} · ${new Intl.NumberFormat('en-DK').format(row.soldRoomNights)} room-nights${row.containsSyntheticData?' · includes demonstration history':''}`;
}
function draw(){
  svg.replaceChildren();$('#season-chart-value').textContent='Hover, focus or select a bar for details.';
  const visible=types.filter(type=>!hidden.has(type)),recorded=rows.filter(row=>row.roomRevenue!==null),shown=recorded.filter(row=>visible.includes(row.roomType));
  $('#season-chart-state').textContent=!recorded.length?'No revenue records for this period.':!visible.length?'Select a room type to display.':`${visible.length} room types · missing revenue is omitted; recorded zero uses a baseline dot.`;
  if(!shown.length){svg.append(node('text',{x:480,y:210,'text-anchor':'middle',class:'chart-empty'},!recorded.length?'No revenue records':!visible.length?'Select a room type':'No records for the selected room types'));return;}
  const plot={left:105,right:935,top:35,bottom:370};
  const maximum=upperBound(Math.max(...recorded.map(row=>Number(row.roomRevenue))));
  const y=value=>plot.bottom-value/maximum*(plot.bottom-plot.top);
  for(let i=0;i<=4;i++){
    const value=maximum*i/4,position=y(value);
    svg.append(node('line',{x1:plot.left,x2:plot.right,y1:position,y2:position,class:'chart-grid'}));
    svg.append(node('text',{x:plot.left-12,y:position+4,'text-anchor':'end',class:'chart-tick'},new Intl.NumberFormat('en-DK',{maximumFractionDigits:2}).format(value)));
  }
  svg.append(node('text',{x:plot.left,y:17,class:'chart-axis-title'},'Revenue (DKK)'));
  svg.append(node('text',{x:520,y:446,'text-anchor':'middle',class:'chart-axis-title'},'Season'));
  const groupWidth=(plot.right-plot.left)/3,inner=groupWidth-42,barWidth=Math.min(36,inner/visible.length-4);
  for(const [index,[season,label]]of seasons.entries()){
    const center=plot.left+groupWidth*(index+.5);
    svg.append(node('text',{x:center,y:401,'text-anchor':'middle',class:'chart-season'},label));
    for(const [typeIndex,type]of visible.entries()){
      const row=rows.find(item=>item.season===season&&item.roomType===type);if(!row||row.roomRevenue===null)continue;
      const value=Number(row.roomRevenue),x=center-inner/2+inner/visible.length*(typeIndex+.5);
      const shape=value===0?node('circle',{cx:x,cy:plot.bottom,r:4}):node('rect',{x:x-barWidth/2,y:y(value),width:barWidth,height:plot.bottom-y(value),rx:1});
      for(const[k,v]of Object.entries({fill:colors[types.indexOf(type)],tabindex:0,role:'button','data-season':season,'data-room-type':type,'data-revenue':row.roomRevenue,'aria-label':`${type}, ${label}: ${currency(row.roomRevenue)}, ${row.soldRoomNights} room-nights`,class:'season-bar'}))shape.setAttribute(k,v);
      shape.append(node('title',{},`${type} · ${label}: ${currency(row.roomRevenue)} · ${row.soldRoomNights} room-nights`));
      for(const event of ['pointerenter','focus','click'])shape.addEventListener(event,()=>showValue(row));
      shape.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showValue(row);}});
      svg.append(shape);
    }
  }
}
for(const[typeIndex,type]of types.entries()){
  const label=document.createElement('label'),input=document.createElement('input'),swatch=document.createElement('span'),name=document.createElement('span');
  input.type='checkbox';input.checked=true;input.value=type;input.setAttribute('aria-label',`Show ${type} in chart`);swatch.className='chart-swatch';swatch.style.background=colors[typeIndex];name.textContent=type;
  input.addEventListener('change',()=>{if(input.checked)hidden.delete(type);else hidden.add(type);draw();});label.append(input,swatch,name);legend.append(label);
}
$('#season-chart-reset').addEventListener('click',()=>{hidden.clear();for(const input of legend.querySelectorAll('input'))input.checked=true;draw();});
export function clearSeasonChart(message='Loading seasonal revenue…'){
  for(const input of legend.querySelectorAll('input'))input.disabled=true;$('#season-chart-reset').disabled=true;
  rows=[];svg.replaceChildren();$('#season-chart-state').textContent=message;$('#season-chart-value').textContent='';
}
export function renderSeasonChart(values,year){
  for(const input of legend.querySelectorAll('input'))input.disabled=false;$('#season-chart-reset').disabled=false;
  rows=values;$('#season-chart-period').textContent=year?`Calendar year ${year}`:'All saved years';draw();
}
