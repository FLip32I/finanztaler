// All complete 180-month windows, advanced one month at a time.
function rolling15Statistics(data, assets, weights) {
 const held=assets.map((id,i)=>({id,weight:weights[i]})).filter(x=>x.weight>0);
 if(!held.length)return null;
 const ordered=[...data].sort((a,b)=>idx(a.month)-idx(b.month));
 const results=[];let block=[],previous=null;
 for(const row of ordered){
  const current=idx(row.month);
  const complete=held.every(x=>Number.isFinite(row.values[x.id])&&row.values[x.id]>=-1);
  if(!complete||previous===null||current!==previous+1)block=[];
  previous=current;
  if(!complete)continue;
  const ret=held.reduce((sum,x)=>sum+x.weight*row.values[x.id],0);
  block.push(1+ret);
  if(block.length>180)block.shift();
  if(block.length===180){
   const growth=block.reduce((total,factor)=>total*factor,1);
   results.push(Math.pow(growth,1/15)-1);
  }
 }
 if(!results.length)return null;
 results.sort((a,b)=>a-b);
 const middle=Math.floor(results.length/2);
 return {min:results[0],max:results.at(-1),median:results.length%2?results[middle]:(results[middle-1]+results[middle])/2};
}
let rollingSignature='',rollingDataset=null;
function syncRolling15(){
 const signature=JSON.stringify([selected,w]);
 if(rollingSignature===signature&&rollingDataset===dataset)return;
 rollingSignature=signature;rollingDataset=dataset;
 $('rolling-results').innerHTML='';
 $('rolling-status').textContent='';
 $('rolling-calculate').disabled=!dataset.length;
}
function calculateRolling15(){
 const result=rolling15Statistics(dataset,selected,w);
 $('rolling-results').innerHTML=result?[
  ['Minimum',result.min],['Median',result.median],['Maximum',result.max]
 ].map(([label,value])=>`<div class="rolling-value"><span>${label}</span><strong>${(value*100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} % p. a.</strong></div>`).join(''):'';
 $('rolling-status').textContent=result?'':'Für diese Mischung sind mindestens 180 lückenlose gemeinsame Monatsrenditen erforderlich.';
}
document.getElementById('rolling-calculate').addEventListener('click',calculateRolling15);
