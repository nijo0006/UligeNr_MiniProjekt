export const currency = value => value === null ? 'No data' : new Intl.NumberFormat('en-DK', {style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value));
export async function api(path,options) {
  const response=await fetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json',...options?.headers}});
  const data=await response.json(); if (!response.ok) throw new Error(data.message || 'Request failed.'); return data;
}
export function option(text,value=text) {const node=document.createElement('option');node.value=value;node.textContent=text;return node;}
export function extendNumbers(select,count=30,chosen) {
  select.querySelector('option[value="more"]')?.remove();
  const start=Number(select.options[select.options.length-1]?.value || 0)+1;
  for(let n=start;n<start+count;n++) select.add(option(String(n)));
  select.add(option('Show more values…','more'));
  if(chosen!==undefined) {if(Number(select.options[select.options.length-2].value)<chosen) select.add(option(String(chosen)));select.value=String(chosen);}
}
