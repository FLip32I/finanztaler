
const names=['MSCI ACWI','MSCI World','MSCI Emerging Markets','MSCI World Small Cap','MSCI Japan','NASDAQ-100','S&P 500','DAX','STOXX Europe 600','Globale REITs','Gold','Silber','Bitcoin','Ethereum','Euro-Staatsanleihen'];
let dataset=[], activeMonths=[];
const locks=new Map();
let selected=[1],w=[1],period='10',rows=[],mu=[],cov=[],curve=[];
let compareMode='vol';
let referenceWeights=[];
const $=id=>document.getElementById(id),pct=x=>(x*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %',eur=x=>x.toLocaleString('de-DE',{maximumFractionDigits:0})+' €';
function month(i){return (2000+Math.floor(i/12))+'-'+String(i%12+1).padStart(2,'0')}function idx(s){let [y,m]=s.split('-').map(Number);return (y-2000)*12+m-1}
function tiles(){$('tiles').innerHTML=names.map((n,i)=>`<button class="tile ${selected.includes(i)?'active':''}" data-i="${i}" aria-pressed="${selected.includes(i)}" ${!selected.includes(i)&&selected.length===5?'disabled':''}><small>${i<10?'AKTIEN':i<12?'EDELMETALLE':i<14?'KRYPTO':'ANLEIHEN'}</small><span class="check">${selected.includes(i)?'✓':'+'}</span><b>${n}</b></button>`).join('');$('count').textContent=selected.length+' von 5 ausgewählt';$('tiles').querySelectorAll('button').forEach(b=>b.onclick=()=>{let i=+b.dataset.i;if(selected.includes(i)){if(selected.length===1)return;locks.delete(i);selected.splice(selected.indexOf(i),1)}else selected.push(i);w=equalWeights();tiles();recalc()})}
function simplex(v){let u=[...v].sort((a,b)=>b-a),s=0,t=0;for(let j=0;j<u.length;j++){s+=u[j];if(u[j]-(s-1)/(j+1)>0)t=(s-1)/(j+1)}return v.map(x=>Math.max(0,x-t))}
function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0)}function risk(v){return Math.sqrt(Math.max(0,v.reduce((s,x,i)=>s+x*dot(cov[i],v),0))*12)}
// Minimum variance with a target expected return (at least / at most).
// Projection onto the bounded-weight simplex and a return half-space.
function optimize(target,side=1){
 const free=freeIndices(),remaining=remainingWeight();
 if(free.length<2||remaining<1e-12)return equalWeights();
 const base=equalWeights(),fixed=selected.reduce((sum,id,i)=>sum+(locks.has(id)?locks.get(id)*mu[i]:0),0);
 const attainable=free.map(i=>mu[i]);
 const low=fixed+remaining*Math.min(...attainable),high=fixed+remaining*Math.max(...attainable);
 if(target!==null)target=Math.max(low,Math.min(high,target));
 // Exact solution for two unfixed assets: target determines the weights.
 if(free.length===2&&target!==null){
  const [i,j]=free,denom=mu[i]-mu[j];
  if(Math.abs(denom)>1e-14){
   const first=Math.max(0,Math.min(remaining,(target-fixed-remaining*mu[j])/denom));
   return selected.map((id,k)=>locks.has(id)?locks.get(id):k===i?first:remaining-first);
  }
 }
 function project(v){
  const x=projectWeights(v);
  if(target===null||side*(dot(x,mu)-target)>=-1e-12)return x;
  const value=lambda=>projectWeights(v.map((z,i)=>z+lambda*side*mu[i]));
  let left=0,right=1;
  while(side*(dot(value(right),mu)-target)<-1e-12&&right<1e14)right*=2;
  for(let k=0;k<65;k++){
   const mid=(left+right)/2;
   if(side*(dot(value(mid),mu)-target)<0)left=mid;else right=mid;
  }
  return value(right);
 }
 let v=project(base),scale=Math.max(1e-9,...cov.map(r=>r.reduce((sum,x)=>sum+Math.abs(x),0))),step=.35/scale;
 for(let k=0;k<1200;k++){
  const next=project(v.map((x,i)=>x-step*dot(cov[i],v)));
  const delta=next.reduce((sum,x,i)=>sum+Math.abs(x-v[i]),0);
  v=next;if(delta<1e-11)break;
 }
 return v;
}
function emptyState(message){
 rows=[];curve=[];mu=[];cov=[];
 $('coverage').textContent=message;
 for(const id of ['weights','frontier','growth','metrics','asset-legend','compare-values'])$(id).innerHTML='';
 $('targetvalue').textContent='';
 for(const id of ['equal','min','optimum','target'])$(id).disabled=true;
}
function recalc(reset=true){
 $('dates').classList.toggle('hidden',period!=='custom');
 if(!dataset.length){emptyState('Noch keine Monatsrenditen vorhanden. Bitte pfmxdaten.xlsx befüllen oder eine befüllte Excel-Datei laden.');return;}
 const complete=dataset.filter(r=>selected.every(i=>Number.isFinite(r.values[i])));
 if(!complete.length){emptyState('Für diese Auswahl gibt es keine gemeinsamen Monatsrenditen. Fehlende Werte bleiben leer und werden nicht als 0 % gerechnet.');return;}
 // Select the most recent contiguous block; never annualize across missing months.
 let blocks=[],block=[];
 for(const r of complete){if(block.length&&idx(r.month)!==idx(block.at(-1).month)+1){blocks.push(block);block=[];}block.push(r);}if(block.length)blocks.push(block);
 let a,b;
 if(period==='custom'){
  if(!$('start').value||!$('end').value){emptyState('Bitte Start- und Endmonat auswählen.');return;}
  a=idx($('start').value);b=idx($('end').value);
  if(a>b){emptyState('Der Startmonat muss vor dem Endmonat liegen.');return;}
  const overlap=blocks.filter(g=>idx(g.at(-1).month)>=a&&idx(g[0].month)<=b);
  if(overlap.length>1){emptyState('Der gewählte Zeitraum enthält Datenlücken. Bitte einen lückenlosen Zeitraum wählen.');return;}
  block=overlap[0]||[];
  block=block.filter(r=>idx(r.month)>=a&&idx(r.month)<=b);
 }else{
  block=blocks.at(-1);
  b=idx(block.at(-1).month);a=period==='max'?idx(block[0].month):b-12*+period+1;
  block=block.filter(r=>idx(r.month)>=a&&idx(r.month)<=b);
 }
 if(block.length<12){emptyState('Mindestens 12 lückenlose gemeinsame Monate erforderlich. Verfügbar für diese Auswahl: '+block.length+'.');return;}
 rows=block.map(r=>selected.map(i=>r.values[i]));activeMonths=block.map(r=>r.month);
 mu=selected.map((_,i)=>rows.reduce((s,r)=>s+r[i],0)/rows.length);
 cov=selected.map((_,i)=>selected.map((_,j)=>rows.reduce((s,r)=>s+(r[i]-mu[i])*(r[j]-mu[j]),0)/rows.length));
 const minimum=optimize(null),minVarianceReturn=dot(minimum,mu);
 const free=freeIndices(),fixedReturn=selected.reduce((v,id,i)=>v+(locks.has(id)?locks.get(id)*mu[i]:0),0);
 const minReturn=free.length?fixedReturn+remainingWeight()*Math.min(...free.map(i=>mu[i])):minVarianceReturn;
 const maxReturn=free.length?fixedReturn+remainingWeight()*Math.max(...free.map(i=>mu[i])):minVarianceReturn;
 // Entire attainable return range, including the lower (inefficient) branch.
 curve=Array.from({length:51},(_,i)=>{
  const targetReturn=minReturn+(maxReturn-minReturn)*i/50;
  const v=optimize(targetReturn,targetReturn<minVarianceReturn-1e-10?-1:1);
  return {w:v,r:dot(v,mu)*12,s:risk(v)};
 });
 const cropped=idx(block[0].month)>a||idx(block.at(-1).month)<b;
 $('coverage').textContent=`Auswertung: ${block[0].month} bis ${block.at(-1).month} · ${rows.length} gemeinsame Monatsrenditen`+(cropped?' · Auf verfügbare gemeinsame Daten gekürzt.':'')+(period!=='custom'&&blocks.length>1?' · Neuester lückenloser Abschnitt; frühere Datenlücken wurden nicht überbrückt.':'');
 for(const id of ['equal','min','optimum','target'])$(id).disabled=freeIndices().length<2||remainingWeight()<1e-10;
 if(reset){
  // A is the initial benchmark; B starts at A and is subsequently user-controlled.
  $('target').value=50;
  referenceWeights=[...curve[25].w];
  w=[...referenceWeights];
 }
 // On lock changes, keep A unchanged. It is not linked to the target control.
 draw();
}
function draw(){
 $('weights').innerHTML=selected.map((id,i)=>`<div class="weight"><label for="w${i}">${names[id]} <span class="weight-edit"><input data-weight-number="${i}" type="number" min="0" max="${(remainingWeight()*100).toFixed(4)}" step="0.1" value="${(w[i]*100).toFixed(1)}" ${locks.has(id)||freeIndices().length<2?'disabled':''} aria-label="${names[id]} Gewichtung in Prozent"> %</span></label><input id="w${i}" data-weight="${i}" type="range" min="0" max="${locks.has(id)?100:(remainingWeight()*100).toFixed(8)}" step="0.1" value="${w[i]*100}" ${locks.has(id)||freeIndices().length<2?'disabled':''}><label class="fix-control"><input type="checkbox" data-lock="${i}" ${locks.has(id)?'checked':''}> ${locks.has(id)?'Fixiert':'Fixieren'}</label></div>`).join('');
 $('weights').querySelectorAll('[data-lock]').forEach(el=>el.onchange=()=>{const i=+el.dataset.lock,id=selected[i];if(el.checked)locks.set(id,w[i]);else locks.delete(id);recalc(false);});
 $('weights').querySelectorAll('[data-weight]').forEach(el=>el.oninput=()=>{adjustWeight(+el.dataset.weight,+el.value/100);draw();});
 $('weights').querySelectorAll('[data-weight-number]').forEach(el=>el.onchange=()=>{if(!Number.isFinite(el.valueAsNumber)){draw();return;}adjustWeight(+el.dataset.weightNumber,el.valueAsNumber/100);draw();});
 $('lock-note').textContent=locks.size?'Fixierte Anteile bleiben unverändert. Kurve und Mischungen berücksichtigen die Fixierung; Einzelanlagen dienen als Vergleich.':'Fixiere einzelne Anteile, damit nur die übrigen Anlagen angepasst werden.';
 let val=10000,peak=val,dd=0,values=[val];rows.forEach(r=>{val*=1+dot(r,w);peak=Math.max(peak,val);dd=Math.min(dd,val/peak-1);values.push(val)});let cagr=(val/10000)**(12/rows.length)-1;$('metrics').innerHTML=[['Jahresrendite geometrisch',pct(cagr)],['Schwankung p. a.',pct(risk(w))],['Größter Verlust',pct(dd)],['Endvermögen',eur(val)]].map(([l,v])=>`<div class="metric"><small>${l}</small><strong>${v}</strong></div>`).join('');let low=Math.min(...values)*.95,high=Math.max(...values)*1.05;let gy=v=>210-(v-low)/(high-low)*180;$('growth').innerHTML=[0,1,2].map(i=>{let v=low+(high-low)*i/2;return `<path d="M90 ${gy(v)}H980" stroke="#e8ede5"/><text x="80" y="${gy(v)+4}" text-anchor="end">${eur(v)}</text>`}).join('')+`<path d="M${values.map((v,i)=>`${90+i/(values.length-1)*890},${gy(v)}`).join(' L')}" fill="none" stroke="#237c55" stroke-width="3"/><text x="90" y="240">${activeMonths[0]}</text><text x="980" y="240" text-anchor="end">${activeMonths.at(-1)}</text>`;$('targetvalue').textContent=pct(dot(w,mu)*12);drawFrontier();drawComparison();}
$('periods').innerHTML=[['5','5 Jahre'],['10','10 Jahre'],['15','15 Jahre'],['20','20 Jahre'],['max','Maximal'],['custom','Eigener Zeitraum']].map(([v,l])=>`<button data-v="${v}" class="${v===period?'active':''}">${l}</button>`).join('');$('periods').querySelectorAll('button').forEach(b=>b.onclick=()=>{period=b.dataset.v;$('periods').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));recalc()});$('start').onchange=$('end').onchange=recalc;$('equal').onclick=()=>{w=equalWeights();draw()};$('min').onclick=()=>{w=[...optimize(null)];syncTargetToMix();draw()};$('optimum').onclick=()=>{w=[...referenceWeights];syncTargetToMix();draw()};
function setMixFromCurve(i){
 const index=Math.max(0,Math.min(curve.length-1,Math.round(i)));
 w=[...curve[index].w];$('target').value=index*2;draw();
}
function syncTargetToMix(){
 if(!curve.length)return;
 const annual=dot(w,mu)*12;
 let best=0;curve.forEach((p,i)=>{if(Math.abs(p.r-annual)<Math.abs(curve[best].r-annual))best=i;});
 $('target').value=best*2;
}
$('target').oninput=()=>setMixFromCurve(+$('target').value/2);
tiles();recalc();
initializeExcel();

async function applyExcel(buffer,label){
 const imported=await readPortfolioExcel(buffer,names);
 dataset=imported;

 if(dataset.length){for(const id of ['start','end']){$(id).min=dataset[0].month;$(id).max=dataset.at(-1).month;} $('start').value=dataset[0].month;$('end').value=dataset.at(-1).month;}
 recalc();
}
async function initializeExcel(){
 try{const response=await fetch('pfmxdaten.xlsx',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);await applyExcel(await response.arrayBuffer(),'');}
 catch(error){emptyState('Die Daten konnten nicht geladen werden: '+error.message);}
}
function drawFrontier(){
 const colors=['#3775a0','#985b9c','#d7893d','#698242','#a35460'];
 let seed=9371;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return (seed+.5)/4294967296;};
 const mixes=selected.length===1?[[1]]:selected.length===2?Array.from({length:301},(_,i)=>[i/300,1-i/300]):Array.from({length:280},()=>{
  const values=selected.map(()=>-Math.log(random())),sum=values.reduce((a,b)=>a+b,0);return values.map(v=>v/sum);
 });
 const points=mixes.map(v=>{const candidate=constrainMix(v);return {w:candidate,s:risk(candidate),r:dot(candidate,mu)*12};});
 const assets=selected.map((j,i)=>({s:Math.sqrt(cov[i][i]*12),r:mu[i]*12,name:names[j]}));
 const all=[...points,...assets,...curve,{s:risk(w),r:dot(w,mu)*12}];
 // Center the entire feasible curve and the individual assets with symmetric padding.
 // Bounds depend on the selected assets and dataset, not on slider movement.
 const xs=all.map(p=>p.s),ys=all.map(p=>p.r);
 const xLow=Math.min(...xs),xHigh=Math.max(...xs),yLow=Math.min(...ys),yHigh=Math.max(...ys);
 const xSpan=Math.max(xHigh-xLow,.005),ySpan=Math.max(yHigh-yLow,.005);
 const minX=Math.max(0,xLow-xSpan*.18),maxX=xHigh+xSpan*.18;
 const minY=yLow-ySpan*.18,maxY=yHigh+ySpan*.18;
 const X=x=>85+(x-minX)/(maxX-minX)*865,Y=y=>385-(y-minY)/(maxY-minY)*335;
 let svg='<text x="85" y="24">Historische Rendite p. a.</text>';
 for(let i=0;i<=5;i++){
  const x=minX+(maxX-minX)*i/5,y=minY+(maxY-minY)*i/5;
  svg+=`<path d="M85 ${Y(y)}H950 M${X(x)} 50V385" stroke="#e8ede5"/><text x="75" y="${Y(y)+4}" text-anchor="end">${pct(y)}</text><text x="${X(x)}" y="410" text-anchor="middle">${pct(x)}</text>`;
 }
 points.forEach((p,i)=>{svg+=`<circle data-mix="${i}" cx="${X(p.s)}" cy="${Y(p.r)}" r="4" fill="#a9c8b6" opacity=".7" style="cursor:pointer"><title>${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle>`;});
 svg+=`<path d="${curve.map((p,i)=>(i?'L':'M')+X(p.s)+','+Y(p.r)).join(' ')}" fill="none" stroke="#237c55" stroke-width="3"/>`;
 curve.forEach((p,i)=>{svg+=`<circle data-efficient="${i}" cx="${X(p.s)}" cy="${Y(p.r)}" r="7" fill="transparent" style="cursor:pointer"><title>Portfoliokurve: ${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle>`;});
 assets.forEach((p,i)=>{svg+=`<circle cx="${X(p.s)}" cy="${Y(p.r)}" r="7" fill="${colors[i]}" stroke="white" stroke-width="2"><title>${p.name}: ${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle><text x="${X(p.s)}" y="${Y(p.r)-13}" text-anchor="middle">${i+1}</text>`;});
 svg+=`<circle cx="${X(risk(referenceWeights))}" cy="${Y(dot(referenceWeights,mu)*12)}" r="8" fill="#17644b" stroke="white" stroke-width="2"><title>Portfolio A · Feste Benchmark</title></circle>`;
 svg+=`<circle cx="${X(risk(w))}" cy="${Y(dot(w,mu)*12)}" r="9" fill="#d4ad48" stroke="#fff" stroke-width="3"><title>Deine Mischung</title></circle><text x="520" y="443" text-anchor="middle">Risiko / Schwankung p. a. →</text>`;
 $('frontier').innerHTML=svg;
 $('asset-legend').innerHTML=assets.map((p,i)=>`<span style="color:${colors[i]}">● ${i+1} · ${p.name}</span>`).join('');
 $('frontier').querySelectorAll('[data-efficient]').forEach(el=>el.onclick=()=>{const i=+el.dataset.efficient;setMixFromCurve(i);});
 $('frontier').querySelectorAll('[data-mix]').forEach(el=>el.onclick=()=>{w=[...points[+el.dataset.mix].w];draw();});
}

function freeIndices(){return selected.map((id,i)=>locks.has(id)?-1:i).filter(i=>i>=0);}
function remainingWeight(){return Math.max(0,1-selected.reduce((sum,id)=>sum+(locks.get(id)||0),0));}
function equalWeights(){const free=freeIndices(),remaining=remainingWeight();return selected.map(id=>locks.has(id)?locks.get(id):remaining/Math.max(1,free.length));}
function projectWeights(values){
 const free=freeIndices(),remaining=remainingWeight();
 if(!free.length)return selected.map(id=>locks.get(id)||0);
 const projected=remaining>1e-12?simplex(free.map(i=>values[i]/remaining)).map(v=>v*remaining):free.map(()=>0);
 return selected.map((id,i)=>locks.has(id)?locks.get(id):projected[free.indexOf(i)]);
}
function constrainMix(values){
 const free=freeIndices(),remaining=remainingWeight(),sum=free.reduce((a,i)=>a+values[i],0);
 return selected.map((id,i)=>locks.has(id)?locks.get(id):sum>1e-12?remaining*values[i]/sum:remaining/Math.max(1,free.length));
}
function adjustWeight(index,value){
 if(locks.has(selected[index]))return;
 const others=freeIndices().filter(i=>i!==index);if(!others.length)return;
 value=Math.min(remainingWeight(),Math.max(0,value));
 const total=others.reduce((sum,i)=>sum+w[i],0),left=remainingWeight()-value;
 w=w.map((v,i)=>i===index?value:locks.has(selected[i])?locks.get(selected[i]):total>1e-12?v*left/total:left/others.length);
}

// A: initial fixed benchmark; never modified by the target slider or B weights.
// B: currently selected weights. Annual returns are permanently visible.
function comparisonStats(weights){
 let capital=1,peak=1,maxDrawdown=0;
 for(const r of rows){
  capital*=1+dot(r,weights);
  peak=Math.max(peak,capital);
  maxDrawdown=Math.min(maxDrawdown,capital/peak-1);
 }
 const annualReturn=dot(weights,mu)*12;
 const volatility=risk(weights);
 return {annualReturn,volatility,drawdown:-maxDrawdown,ratio:volatility>1e-12?annualReturn/volatility:null};
}
function drawComparison(){
 if(!rows.length||!mu.length)return;
 const b=comparisonStats(w);
 const a=comparisonStats(referenceWeights);
 // Comparison B minus A: higher return is favorable, higher volatility unfavorable.
 const deltaReturn=(b.annualReturn-a.annualReturn)*100;
 const deltaRisk=(b.volatility-a.volatility)*100;
 const formatDelta=x=>{const rounded=Math.round(x*10)/10;return (rounded>0?'+':'')+rounded.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})+' %';};
 const classify=(x,higherBetter)=>Math.abs(x)<0.05?'neutral':((x>0)===higherBetter?'good':'bad');
 const retClass=classify(deltaReturn,true),riskClass=classify(deltaRisk,false);
 const riskHeight=Math.min(19,Math.max(3,Math.abs(deltaRisk)*8));
 const retHeight=Math.min(19,Math.max(3,Math.abs(deltaReturn)*8));
 const bar=(x,height,klass,left)=>Math.abs(x)<0.05?'':`<span class="delta-column ${x>=0?'up':'down'}" style="left:${left}px;height:${height}px;background:${klass==='good'?'#237c55':klass==='bad'?'#b94a42':'#9aa79f'}"></span>`;
 $('compare-delta').innerHTML=`<span class="delta-label">Deine Mischung<br>gegenüber Optimum</span><span class="delta-cross" aria-hidden="true">${bar(deltaRisk,riskHeight,riskClass,9)}${bar(deltaReturn,retHeight,retClass,26)}</span><span class="delta-text"><span class="delta-${riskClass}">Risiko <strong>${formatDelta(deltaRisk)}</strong></span><span class="delta-${retClass}">Rendite <strong>${formatDelta(deltaReturn)}</strong></span></span>`;
 const metric=compareMode==='dd'?'drawdown':compareMode==='ratio'?'ratio':'volatility';
 const maxValue=Math.max(a[metric]||0,b[metric]||0,0.0001);
 const show=x=>metric==='ratio'?(x===null?'–':x.toLocaleString('de-DE',{maximumFractionDigits:2})):pct(metric==='drawdown'?-x:x);
 $('comparison').querySelectorAll('[data-compare]').forEach(button=>button.classList.toggle('active',button.dataset.compare===compareMode));
 $('compare-values').innerHTML=[
  {label:'Portfolio A · Optimum',stat:a,color:'#19815d'},
  {label:'Portfolio B · Deine Mischung',stat:b,color:'#c99b30'}
 ].map(({label,stat,color})=>`<div>
   <div class="compare-name">${label}</div>
   <div class="compare-value">${show(stat[metric])}</div>
   <div class="compare-bar"><div style="width:${Math.max(0,Math.min(100,(stat[metric]||0)/maxValue*100))}%;background:${color}"></div></div>
   <div class="compare-return">Rendite: <strong>${pct(stat.annualReturn)} p. a.</strong></div>
 </div>`).join('');
 $('compare-note').textContent=compareMode==='vol'
  ?'Historische annualisierte Volatilität. Portfolio A bleibt die feste Benchmark; B ist deine aktuelle Mischung.'
  :compareMode==='dd'
  ?'Größter historischer Rückgang vom bisherigen Höchststand; monatliches Rebalancing.'
  :'Rendite / Volatilität bei 0 % Referenzzins (vereinfachte Sharpe-ähnliche Kennzahl).';
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{
 compareMode=button.dataset.compare;
 drawComparison();
}));
