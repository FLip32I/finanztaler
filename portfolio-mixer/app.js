
const names=['MSCI ACWI','MSCI World','MSCI Emerging Markets','MSCI World Small Cap','MSCI Japan','NASDAQ-100','S&P 500','DAX','STOXX Europe 600','Globale REITs','Gold','Silber','Bitcoin','Ethereum','Euro-Staatsanleihen'];
let dataset=[], activeMonths=[];
let timelineState=null;
const locks=new Map();
let selected=[1],w=[1],period='10',rows=[],mu=[],cov=[],curve=[];
let compareMode='vol';
let benchmark='optimum';
const savedMixKey='finanztaler.portfolio-mixer.benchmarks.v1';
let savedConfigurations=loadSavedConfigurations(),savedBenchmark='optimum',saveSlot='';
let storageAvailable=true;
let referenceWeights=[];
const $=id=>document.getElementById(id),pct=x=>(x*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %',eur=x=>x.toLocaleString('de-DE',{maximumFractionDigits:0})+' €';
function month(i){return (2000+Math.floor(i/12))+'-'+String(((i%12)+12)%12+1).padStart(2,'0')}function idx(s){let [y,m]=s.split('-').map(Number);return (y-2000)*12+m-1}
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
 $('time-editor').classList.add('hidden');
 $('coverage').textContent=message;
 for(const id of ['weights','frontier','growth','metrics','asset-legend','compare-values'])$(id).innerHTML='';
 $('targetvalue').textContent='';
 $('benchmark').disabled=true;
 $('compare-delta').innerHTML='';
 $('compare-note').textContent='';
 drawSavedComparison();
 for(const id of ['equal','min','optimum','target'])$(id).disabled=true;
}
function recalc(reset=true,preserveWeights=false){
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
 renderTimeline(blocks,block);
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
  // Re-optimize A for the current data; period changes preserve the user's B weights.
  referenceWeights=[...curve[25].w];
  if(!preserveWeights)w=[...referenceWeights];
 }
 // On lock changes, keep A unchanged. It is not linked to the target control.
 updateBenchmarkOptions();
 syncTargetToMix();
 draw();
}
function draw(){
 $('weights').innerHTML=selected.map((id,i)=>`<div class="weight"><label for="w${i}">${names[id]} <span class="weight-edit"><input data-weight-number="${i}" type="number" min="0" max="${(remainingWeight()*100).toFixed(4)}" step="0.1" value="${(w[i]*100).toFixed(1)}" ${locks.has(id)||freeIndices().length<2?'disabled':''} aria-label="${names[id]} Gewichtung in Prozent"> %</span></label><input id="w${i}" data-weight="${i}" type="range" min="0" max="${locks.has(id)?100:(remainingWeight()*100).toFixed(8)}" step="0.1" value="${w[i]*100}" ${locks.has(id)||freeIndices().length<2?'disabled':''}><label class="fix-control"><input type="checkbox" data-lock="${i}" ${locks.has(id)?'checked':''}> ${locks.has(id)?'Fixiert':'Fixieren'}</label></div>`).join('');
 $('weights').querySelectorAll('[data-lock]').forEach(el=>el.onchange=()=>{const i=+el.dataset.lock,id=selected[i];if(el.checked)locks.set(id,w[i]);else locks.delete(id);recalc(false);});
 $('weights').querySelectorAll('[data-weight]').forEach(el=>el.oninput=()=>{adjustWeight(+el.dataset.weight,+el.value/100);draw();});
 $('weights').querySelectorAll('[data-weight-number]').forEach(el=>el.onchange=()=>{if(!Number.isFinite(el.valueAsNumber)){draw();return;}adjustWeight(+el.dataset.weightNumber,el.valueAsNumber/100);draw();});
 $('lock-note').textContent=locks.size?'Fixierte Anteile bleiben unverändert. Kurve und Mischungen berücksichtigen die Fixierung; Einzelanlagen dienen als Vergleich.':'Fixiere einzelne Anteile, damit nur die übrigen Anlagen angepasst werden.';
 let val=10000,peak=val,dd=0,values=[val];rows.forEach(r=>{val*=1+dot(r,w);peak=Math.max(peak,val);dd=Math.min(dd,val/peak-1);values.push(val)});let cagr=(val/10000)**(12/rows.length)-1;$('metrics').innerHTML=[['Jahresrendite geometrisch',pct(cagr)],['Schwankung p. a.',pct(risk(w))],['Größter Verlust',pct(dd)],['Endvermögen',eur(val)]].map(([l,v])=>`<div class="metric"><small>${l}</small><strong>${v}</strong></div>`).join('');let low=Math.min(...values)*.95,high=Math.max(...values)*1.05;let gy=v=>210-(v-low)/(high-low)*180;$('growth').innerHTML=[0,1,2].map(i=>{let v=low+(high-low)*i/2;return `<path d="M90 ${gy(v)}H980" stroke="#e8ede5"/><text x="80" y="${gy(v)+4}" text-anchor="end">${eur(v)}</text>`}).join('')+`<path d="M${values.map((v,i)=>`${90+i/(values.length-1)*890},${gy(v)}`).join(' L')}" fill="none" stroke="#237c55" stroke-width="3"/><text x="90" y="240">${activeMonths[0]}</text><text x="980" y="240" text-anchor="end">${activeMonths.at(-1)}</text>`;$('targetvalue').textContent=pct(dot(w,mu)*12);drawFrontier();drawComparison();drawSavedComparison();}
$('periods').innerHTML=[['5','5 Jahre'],['10','10 Jahre'],['15','15 Jahre'],['20','20 Jahre'],['max','Maximal'],['custom','Eigener Zeitraum']].map(([v,l])=>`<button data-v="${v}" class="${v===period?'active':''}">${l}</button>`).join('');$('periods').querySelectorAll('button').forEach(b=>b.onclick=()=>{period=b.dataset.v;$('periods').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));recalc(true,true)});$('start').onchange=$('end').onchange=()=>recalc(true,true);$('equal').onclick=()=>{w=equalWeights();draw()};$('min').onclick=()=>{w=[...optimize(null)];syncTargetToMix();draw()};$('optimum').onclick=()=>{w=[...referenceWeights];syncTargetToMix();draw()};
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
setupTimeline();
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
 const benchmarkPoint=currentBenchmark();
 const all=[...points,...assets,...curve,{s:risk(w),r:dot(w,mu)*12}];
 if(benchmarkPoint.stat)all.push({s:benchmarkPoint.stat.volatility,r:benchmarkPoint.stat.annualReturn});
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
 if(benchmarkPoint.stat)svg+=`<circle cx="${X(benchmarkPoint.stat.volatility)}" cy="${Y(benchmarkPoint.stat.annualReturn)}" r="8" fill="#17644b" stroke="white" stroke-width="2"><title>Portfolio A · ${benchmarkPoint.name}</title></circle>`;
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

// A: benchmark optimized for the current period; independent of B weight edits.
// B: currently selected weights. Annual returns are permanently visible.
function monthlyStats(returns){
 let capital=1,peak=1,maxDrawdown=0;
 for(const value of returns){
  capital*=1+value;
  peak=Math.max(peak,capital);
  maxDrawdown=Math.min(maxDrawdown,capital/peak-1);
 }
 const mean=returns.reduce((sum,value)=>sum+value,0)/returns.length;
 const annualReturn=mean*12;
 const volatility=Math.sqrt(returns.reduce((sum,value)=>sum+(value-mean)**2,0)/returns.length*12);
 return {annualReturn,volatility,drawdown:-maxDrawdown,ratio:volatility>1e-12?annualReturn/volatility:null};
}
function comparisonStats(weights){return monthlyStats(rows.map(r=>dot(r,weights)));}
function allocationNote(weights){
 return selected.map((id,i)=>weights[i]>1e-10?names[id]+' '+pct(weights[i]):'').filter(Boolean).map(line=>'<span class="allocation-line">'+line+'</span>').join('');
}
function benchmarkReturns(id){
 const byMonth=new Map(dataset.map(r=>[r.month,r.values[id]]));
 const returns=activeMonths.map(m=>byMonth.get(m));
 return returns.length&&returns.every(Number.isFinite)?returns:null;
}
function currentBenchmark(){
 if(benchmark==='optimum')return {name:'Optimum',stat:comparisonStats(referenceWeights),allocation:allocationNote(referenceWeights)};
 const id=Number(benchmark),returns=benchmarkReturns(id);
 return {name:names[id],stat:returns?monthlyStats(returns):null,allocation:'100 % '+names[id]};
}
function updateBenchmarkOptions(){
 $('benchmark').disabled=false;
 $('benchmark').innerHTML='<option value="optimum">Optimum</option>'+names.map((name,id)=>`<option value="${id}">${name}${benchmarkReturns(id)?'':' (Daten fehlen)'}</option>`).join('');
 $('benchmark').value=benchmark;
 $('saved-benchmark').innerHTML=$('benchmark').innerHTML;
 $('saved-benchmark').value=savedBenchmark;
}
$('benchmark').onchange=()=>{benchmark=$('benchmark').value;draw();};
function drawComparison(){
 if(!rows.length||!mu.length)return;
 const b=comparisonStats(w);
 const chosen=currentBenchmark(),a=chosen.stat;
 // Comparison B minus A: higher return is favorable, higher volatility unfavorable.
 const deltaReturn=a?(b.annualReturn-a.annualReturn)*100:0;
 const deltaRisk=a?(b.volatility-a.volatility)*100:0;
 const formatDelta=x=>{const rounded=Math.round(x*10)/10;return (rounded>0?'+':'')+rounded.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})+' %';};
 const classify=(x,higherBetter)=>Math.abs(x)<0.05?'neutral':((x>0)===higherBetter?'good':'bad');
 const retClass=classify(deltaReturn,true),riskClass=classify(deltaRisk,false);
 const riskHeight=Math.min(19,Math.max(3,Math.abs(deltaRisk)*8));
 const retHeight=Math.min(19,Math.max(3,Math.abs(deltaReturn)*8));
 const bar=(x,height,klass,left)=>Math.abs(x)<0.05?'':`<span class="delta-column ${x>=0?'up':'down'}" style="left:${left}px;height:${height}px;background:${klass==='good'?'#237c55':klass==='bad'?'#b94a42':'#9aa79f'}"></span>`;
 $('compare-delta').setAttribute('aria-label','Differenz deiner Mischung gegenüber '+chosen.name);
 $('compare-delta').innerHTML=a?`<span class="delta-label">Deine Mischung<br>gegenüber ${chosen.name}</span><span class="delta-cross" aria-hidden="true">${bar(deltaRisk,riskHeight,riskClass,9)}${bar(deltaReturn,retHeight,retClass,26)}</span><span class="delta-text"><span class="delta-${riskClass}">Risiko <strong>${formatDelta(deltaRisk)}</strong></span><span class="delta-${retClass}">Rendite <strong>${formatDelta(deltaReturn)}</strong></span></span>`:'<span class="delta-label">Vergleich nicht verfügbar</span>';
 const metric=compareMode==='dd'?'drawdown':compareMode==='ratio'?'ratio':'volatility';
 const maxValue=Math.max(a?.[metric]||0,b[metric]||0,0.0001);
 const show=x=>metric==='ratio'?(x===null?'–':x.toLocaleString('de-DE',{maximumFractionDigits:2})):pct(metric==='drawdown'?-x:x);
 $('comparison').querySelectorAll('[data-compare]').forEach(button=>button.classList.toggle('active',button.dataset.compare===compareMode));
 $('compare-values').innerHTML=[
  {label:'Portfolio A · '+chosen.name,stat:a,color:'#19815d',allocation:chosen.allocation},
  {label:'Portfolio B · Deine Mischung',stat:b,color:'#c99b30',allocation:allocationNote(w)}
 ].map(({label,stat,color,allocation})=>`<div>
   <div class="compare-name">${label}</div>
   <div class="compare-value">${stat?show(stat[metric]):'–'}</div>
   <div class="compare-bar"><div style="width:${Math.max(0,Math.min(100,(stat?.[metric]||0)/maxValue*100))}%;background:${color}"></div></div>
   <div class="compare-return">Rendite: <strong>${stat?pct(stat.annualReturn)+' p. a.':'–'}</strong></div>
   <div class="compare-allocation">${allocation}</div>
 </div>`).join('');
 $('compare-note').textContent=!a
  ?'Für '+chosen.name+' fehlen vollständige Monatsdaten im gewählten Zeitraum. Bitte einen anderen Benchmark oder Zeitraum wählen.'
  :compareMode==='vol'
  ?'Historische annualisierte Volatilität. Beide Portfolios verwenden denselben Zeitraum.'
  :compareMode==='dd'
  ?'Größter historischer Rückgang vom bisherigen Höchststand; monatliches Rebalancing.'
  :'Rendite / Volatilität bei 0 % Referenzzins (vereinfachte Sharpe-ähnliche Kennzahl).';
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{
 compareMode=button.dataset.compare;
 drawComparison();
}));

// Timeline uses month indices and the same contiguous data blocks as recalc().

function timelineLabel(value){const [y,m]=month(value).split('-');return m+'.'+y;}
function renderTimeline(blocks,block){
 const lo=idx(dataset[0].month),hi=idx(dataset.at(-1).month),span=Math.max(1,hi-lo);
 const start=idx(block[0].month),end=idx(block.at(-1).month);
 const available=blocks.find(g=>idx(g[0].month)<=start&&idx(g.at(-1).month)>=end);
 timelineState={lo,hi,start,end,min:idx(available[0].month),max:idx(available.at(-1).month)};
 $('time-editor').classList.remove('hidden');
 $('time-availability').innerHTML=blocks.map(g=>{const a=idx(g[0].month),b=idx(g.at(-1).month);return `<div class="time-available" style="left:${100*(a-lo)/span}%;width:${100*(b-a)/span}%"></div>`}).join('');
 const firstYear=2000+Math.floor(lo/12),lastYear=2000+Math.floor(hi/12);
 const step=window.innerWidth<600?20:10;
 const ticks=[lo];
 for(let year=Math.ceil((firstYear+1)/step)*step;year<lastYear;year+=step){const value=idx(year+'-01');if((value-lo)/span>.10&&(hi-value)/span>.10)ticks.push(value);}
 ticks.push(hi);
 $('time-ticks').innerHTML=ticks.map(value=>`<span style="left:${100*(value-lo)/span}%">${2000+Math.floor(value/12)}</span>`).join('');
 paintTimeline();
}
function paintTimeline(){
 const t=timelineState,span=Math.max(1,t.hi-t.lo),left=100*(t.start-t.lo)/span,right=100*(t.end-t.lo)/span;
 $('time-window').style.left=left+'%';$('time-window').style.width=(right-left)+'%';
 for(const [id,v,min,max] of [['time-start',t.start,t.min,t.end-11],['time-end',t.end,t.start+11,t.max]]){
  const el=$(id);el.style.left=(100*(v-t.lo)/span)+'%';el.setAttribute('aria-valuemin',min);el.setAttribute('aria-valuemax',max);el.setAttribute('aria-valuenow',v);el.setAttribute('aria-valuetext',timelineLabel(v));
 }
 $('time-selection').textContent=timelineLabel(t.start)+' – '+timelineLabel(t.end);
 const n=t.end-t.start+1,years=Math.floor(n/12),months=n%12;
 const duration=(years?years+(years===1?' Jahr':' Jahre'):'')+(months?(years?' · ':'')+months+(months===1?' Monat':' Monate'):'');
 $('time-duration').textContent=duration;
 const customButton=$('periods').querySelector('[data-v=custom]');
 customButton.textContent=period==='custom'?'Eigener Zeitraum · '+duration:'Eigener Zeitraum';
}
function commitTimeline(){
 if(!timelineState)return;
 period='custom';$('start').value=month(timelineState.start);$('end').value=month(timelineState.end);
 $('periods').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.v==='custom'));
 recalc(true,true);
}
function setupTimeline(){
 for(const [id,mode] of [['time-start','start'],['time-end','end'],['time-window','move']]){
  const el=$(id);let drag=null;
  el.addEventListener('pointerdown',e=>{if(!timelineState||e.button!==0)return;e.preventDefault();drag={x:e.clientX,...timelineState};el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{
   if(!drag)return;const delta=Math.round((e.clientX-drag.x)/$('time-track').getBoundingClientRect().width*(drag.hi-drag.lo)),t=timelineState;
   if(mode==='start')t.start=Math.max(t.min,Math.min(drag.end-11,drag.start+delta));
   else if(mode==='end')t.end=Math.min(t.max,Math.max(drag.start+11,drag.end+delta));
   else{const shift=Math.max(t.min-drag.start,Math.min(t.max-drag.end,delta));t.start=drag.start+shift;t.end=drag.end+shift;}
   paintTimeline();
  });
  el.addEventListener('pointerup',()=>{if(drag){drag=null;commitTimeline()}});
  el.addEventListener('pointercancel',()=>{if(drag){timelineState={...drag};drag=null;paintTimeline()}});
  if(mode!=='move')el.addEventListener('keydown',e=>{
   if(!timelineState)return;const t=timelineState;
   let v=t[mode];const step=e.shiftKey?12:1;
   if(e.key==='ArrowLeft'||e.key==='ArrowDown')v-=step;else if(e.key==='ArrowRight'||e.key==='ArrowUp')v+=step;else if(e.key==='Home')v=mode==='start'?t.min:t.start+11;else if(e.key==='End')v=mode==='start'?t.end-11:t.max;else return;
   e.preventDefault();t[mode]=mode==='start'?Math.max(t.min,Math.min(t.end-11,v)):Math.min(t.max,Math.max(t.start+11,v));paintTimeline();commitTimeline();
  });
 }
}


// Saved mixes retain asset identities and exact ratios; metrics use the active period.
function loadSavedConfigurations(){
 try{
  const stored=JSON.parse(window.localStorage.getItem(savedMixKey)||'null');
  if(!Array.isArray(stored))return [null,null,null];
  return Array.from({length:3},(_,i)=>{
   const mix=stored[i];
   if(!mix||!Array.isArray(mix.assets)||!Array.isArray(mix.weights)||mix.assets.length<1||mix.assets.length>5||mix.assets.length!==mix.weights.length)return null;
   if(new Set(mix.assets).size!==mix.assets.length||!mix.assets.every(id=>Number.isInteger(id)&&id>=0&&id<names.length))return null;
   if(!mix.weights.every(x=>Number.isFinite(x)&&x>=0&&x<=1)||Math.abs(mix.weights.reduce((a,b)=>a+b,0)-1)>1e-7)return null;
   return {assets:[...mix.assets],weights:[...mix.weights]};
  });
 }catch{return [null,null,null];}
}
function persistSavedConfigurations(){
 try{window.localStorage.setItem(savedMixKey,JSON.stringify(savedConfigurations));storageAvailable=true;}
 catch{storageAvailable=false;}
}
function savedMixStats(mix){
 if(!rows.length)return null;
 const byMonth=new Map(dataset.map(r=>[r.month,r.values]));
 const returns=[];
 for(const m of activeMonths){
  const values=byMonth.get(m);
  if(!values||!mix.assets.every((id,i)=>mix.weights[i]===0||Number.isFinite(values[id])))return null;
  returns.push(mix.assets.reduce((sum,id,i)=>sum+(mix.weights[i]===0?0:values[id]*mix.weights[i]),0));
 }
 return returns.length?monthlyStats(returns):null;
}
function savedAllocation(mix){
 return mix.assets.map((id,i)=>mix.weights[i]>1e-10?'<span class="allocation-line">'+names[id]+' '+pct(mix.weights[i])+'</span>':'').join('');
}
function drawSavedComparison(){
 const count=savedConfigurations.filter(Boolean).length;
 $('saved-count').textContent=count+' von 3 gespeichert';
 $('save-slot').innerHTML='<option value="">'+(count===3?'Speicherplatz zum Ersetzen wählen':'Nächster freier Speicherplatz')+'</option>'+savedConfigurations.map((mix,i)=>`<option value="${i}">Mischung ${i+1}${mix?' · ersetzen':' · frei'}</option>`).join('');
 $('save-slot').value=saveSlot;
 $('save-benchmark').disabled=!rows.length||(count===3&&saveSlot==='');
 $('saved-benchmark').disabled=!rows.length;
 $('saved-period').textContent=rows.length?'Zeitraum: '+activeMonths[0]+' bis '+activeMonths.at(-1)+' · Alle Kennzahlen werden für diesen Zeitraum neu berechnet.':'Bitte einen gültigen Zeitraum mit mindestens 12 gemeinsamen Monaten wählen.';
 $('saved-storage').textContent=storageAvailable?'Gespeicherte Mischungen bleiben in diesem Browser erhalten.':'Die Mischungen bleiben nur bis zum Neuladen verfügbar; der Browser erlaubt kein dauerhaftes Speichern.';
 let baseline={name:'Optimum',allocation:'',stat:null};
 if(rows.length){
  if(savedBenchmark==='optimum')baseline={name:'Optimum',allocation:allocationNote(referenceWeights),stat:comparisonStats(referenceWeights)};
  else{const returns=benchmarkReturns(Number(savedBenchmark));baseline={name:names[Number(savedBenchmark)],allocation:'100 % '+names[Number(savedBenchmark)],stat:returns?monthlyStats(returns):null};}
 }
 const entries=[{name:'Basiswert · '+baseline.name,allocation:baseline.allocation,stat:baseline.stat}];
 savedConfigurations.forEach((mix,i)=>entries.push({name:'Mischung '+(i+1),allocation:mix?savedAllocation(mix):'Noch nicht gespeichert',stat:mix?savedMixStats(mix):null,slot:i,empty:!mix}));
 $('saved-rows').innerHTML=entries.map(entry=>`<tr>
  <th scope="row">${entry.name}${entry.slot!==undefined&&!entry.empty?'<button type="button" class="saved-remove" data-remove-saved="'+entry.slot+'" aria-label="Mischung '+(entry.slot+1)+' entfernen">Entfernen</button>':''}</th>
  <td class="saved-allocation">${entry.allocation}${!entry.empty&&!entry.stat?'<span class="saved-missing">Keine vollständigen Daten im gewählten Zeitraum.</span>':''}</td>
  <td>${entry.stat?pct(entry.stat.annualReturn):'–'}</td><td>${entry.stat?pct(entry.stat.volatility):'–'}</td><td>${entry.stat?pct(-entry.stat.drawdown):'–'}</td>
 </tr>`).join('');
 $('saved-rows').querySelectorAll('[data-remove-saved]').forEach(button=>button.onclick=()=>{
  const slot=Number(button.dataset.removeSaved);savedConfigurations[slot]=null;saveSlot='';persistSavedConfigurations();drawSavedComparison();$('save-status').textContent='Mischung '+(slot+1)+' entfernt.';
 });
}
$('save-slot').onchange=()=>{saveSlot=$('save-slot').value;drawSavedComparison();};
$('saved-benchmark').onchange=()=>{savedBenchmark=$('saved-benchmark').value;drawSavedComparison();};
$('save-benchmark').onclick=()=>{
 if(!rows.length)return;
 const slot=saveSlot===''?savedConfigurations.findIndex(mix=>!mix):Number(saveSlot);
 if(!Number.isInteger(slot)||slot<0||slot>2)return;
 savedConfigurations[slot]={assets:[...selected],weights:[...w]};
 persistSavedConfigurations();saveSlot='';drawSavedComparison();
 $('saved-comparison').open=true;
 $('save-status').textContent='Konfiguration als Mischung '+(slot+1)+' gespeichert.';
};
