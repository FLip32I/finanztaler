
const names=['MSCI ACWI','MSCI World','MSCI Emerging Markets','MSCI World Small Cap','MSCI Japan','NASDAQ-100','S&P 500','DAX','STOXX Europe 600','Globale REITs','Gold','Silber','Bitcoin','Ethereum','Euro-Staatsanleihen'];
let dataset=[], activeMonths=[];
const locks=new Map();
let selected=[1],w=[1],period='10',rows=[],mu=[],cov=[],curve=[];
let compareMode='vol';
const $=id=>document.getElementById(id),pct=x=>(x*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %',eur=x=>x.toLocaleString('de-DE',{maximumFractionDigits:0})+' €';
function month(i){return (2000+Math.floor(i/12))+'-'+String(i%12+1).padStart(2,'0')}function idx(s){let [y,m]=s.split('-').map(Number);return (y-2000)*12+m-1}
function tiles(){$('tiles').innerHTML=names.map((n,i)=>`<button class="tile ${selected.includes(i)?'active':''}" data-i="${i}" aria-pressed="${selected.includes(i)}" ${!selected.includes(i)&&selected.length===5?'disabled':''}><small>${i<10?'AKTIEN':i<12?'EDELMETALLE':i<14?'KRYPTO':'ANLEIHEN'}</small><span class="check">${selected.includes(i)?'✓':'+'}</span><b>${n}</b></button>`).join('');$('count').textContent=selected.length+' von 5 ausgewählt';$('tiles').querySelectorAll('button').forEach(b=>b.onclick=()=>{let i=+b.dataset.i;if(selected.includes(i)){if(selected.length===1)return;locks.delete(i);selected.splice(selected.indexOf(i),1)}else selected.push(i);w=equalWeights();tiles();recalc()})}
function simplex(v){let u=[...v].sort((a,b)=>b-a),s=0,t=0;for(let j=0;j<u.length;j++){s+=u[j];if(u[j]-(s-1)/(j+1)>0)t=(s-1)/(j+1)}return v.map(x=>Math.max(0,x-t))}
function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0)}function risk(v){return Math.sqrt(Math.max(0,v.reduce((s,x,i)=>s+x*dot(cov[i],v),0))*12)}
function optimize(target){let v=mu.map(()=>1/mu.length),max= Math.max(...cov.map(r=>r.reduce((s,x)=>s+Math.abs(x),0))),step=.4/Math.max(max,1e-8),lo=mu.indexOf(Math.min(...mu)),hi=mu.indexOf(Math.max(...mu));function project(x){x=projectWeights(x);if(target===null||dot(x,mu)>=target-1e-12)return x;let l=0,h=1;while(dot(projectWeights(v.map((_,i)=>x[i]+h*mu[i])),mu)<target-1e-12&&h<1e12)h*=2;for(let k=0;k<48;k++){let m=(l+h)/2;if(dot(projectWeights(x.map((z,i)=>z+m*mu[i])),mu)<target)l=m;else h=m}return projectWeights(x.map((z,i)=>z+h*mu[i]))}for(let k=0;k<700;k++){let next=project(v.map((x,i)=>x-step*dot(cov[i],v)));let d=next.reduce((s,x,i)=>s+Math.abs(x-v[i]),0);v=next;if(d<1e-9)break}return v}
function emptyState(message){
 rows=[];curve=[];mu=[];cov=[];
 $('coverage').textContent=message;
 for(const id of ['weights','frontier','growth','metrics','asset-legend','compare-values'])$(id).innerHTML='';
 $('targetvalue').textContent='';
 for(const id of ['equal','min','target'])$(id).disabled=true;
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
 const minimum=optimize(null),start=dot(minimum,mu),free=freeIndices(),end=free.length?selected.reduce((v,id,i)=>v+(locks.has(id)?locks.get(id)*mu[i]:0),0)+remainingWeight()*Math.max(...free.map(i=>mu[i])):dot(minimum,mu);
 curve=Array.from({length:51},(_,i)=>{const v=optimize(start+(end-start)*i/50);return {w:v,r:dot(v,mu)*12,s:risk(v)};});
 const cropped=idx(block[0].month)>a||idx(block.at(-1).month)<b;
 $('coverage').textContent=`Auswertung: ${block[0].month} bis ${block.at(-1).month} · ${rows.length} gemeinsame Monatsrenditen`+(cropped?' · Auf verfügbare gemeinsame Daten gekürzt.':'')+(period!=='custom'&&blocks.length>1?' · Neuester lückenloser Abschnitt; frühere Datenlücken wurden nicht überbrückt.':'');
 for(const id of ['equal','min','target'])$(id).disabled=freeIndices().length<2||remainingWeight()<1e-10;
 if(reset){$('target').value=50;w=[...curve[25].w];}draw();
}
function draw(){
 $('weights').innerHTML=selected.map((id,i)=>`<div class="weight"><label for="w${i}">${names[id]} <span>${pct(w[i])}</span></label><input id="w${i}" data-weight="${i}" type="range" min="0" max="${locks.has(id)?100:(remainingWeight()*100).toFixed(8)}" step="0.1" value="${w[i]*100}" ${locks.has(id)||freeIndices().length<2?'disabled':''}><label class="fix-control"><input type="checkbox" data-lock="${i}" ${locks.has(id)?'checked':''}> ${locks.has(id)?'Fixiert':'Fixieren'}</label></div>`).join('');
 $('weights').querySelectorAll('[data-lock]').forEach(el=>el.onchange=()=>{const i=+el.dataset.lock,id=selected[i];if(el.checked)locks.set(id,w[i]);else locks.delete(id);recalc(false);});
 $('weights').querySelectorAll('[data-weight]').forEach(el=>el.oninput=()=>{adjustWeight(+el.dataset.weight,+el.value/100);draw();});
 $('lock-note').textContent=locks.size?'Fixierte Anteile bleiben unverändert. Kurve und Mischungen berücksichtigen die Fixierung; Einzelanlagen dienen als Vergleich.':'Fixiere einzelne Anteile, damit nur die übrigen Anlagen angepasst werden.';
 let val=10000,peak=val,dd=0,values=[val];rows.forEach(r=>{val*=1+dot(r,w);peak=Math.max(peak,val);dd=Math.min(dd,val/peak-1);values.push(val)});let cagr=(val/10000)**(12/rows.length)-1;$('metrics').innerHTML=[['Jahresrendite geometrisch',pct(cagr)],['Schwankung p. a.',pct(risk(w))],['Größter Verlust',pct(dd)],['Endvermögen',eur(val)]].map(([l,v])=>`<div class="metric"><small>${l}</small><strong>${v}</strong></div>`).join('');let low=Math.min(...values)*.95,high=Math.max(...values)*1.05;let gy=v=>210-(v-low)/(high-low)*180;$('growth').innerHTML=[0,1,2].map(i=>{let v=low+(high-low)*i/2;return `<path d="M90 ${gy(v)}H980" stroke="#e8ede5"/><text x="80" y="${gy(v)+4}" text-anchor="end">${eur(v)}</text>`}).join('')+`<path d="M${values.map((v,i)=>`${90+i/(values.length-1)*890},${gy(v)}`).join(' L')}" fill="none" stroke="#237c55" stroke-width="3"/><text x="90" y="240">${activeMonths[0]}</text><text x="980" y="240" text-anchor="end">${activeMonths.at(-1)}</text>`;$('targetvalue').textContent=pct(dot(w,mu)*12);drawFrontier();drawComparison();}
$('periods').innerHTML=[['5','5 Jahre'],['10','10 Jahre'],['15','15 Jahre'],['20','20 Jahre'],['max','Maximal'],['custom','Eigener Zeitraum']].map(([v,l])=>`<button data-v="${v}" class="${v===period?'active':''}">${l}</button>`).join('');$('periods').querySelectorAll('button').forEach(b=>b.onclick=()=>{period=b.dataset.v;$('periods').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));recalc()});$('start').onchange=$('end').onchange=recalc;$('equal').onclick=()=>{w=equalWeights();draw()};$('min').onclick=()=>{w=[...curve[0].w];$('target').value=0;draw()};$('target').oninput=()=>{w=[...curve[Math.round(+$('target').value/2)].w];draw()};tiles();recalc();
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
 const maxX=Math.max(.01,...all.map(p=>p.s))*1.12,minY=Math.min(0,...all.map(p=>p.r))-.01,maxY=Math.max(.01,...all.map(p=>p.r))+.02;
 const X=x=>85+x/maxX*865,Y=y=>385-(y-minY)/(maxY-minY)*335;
 let svg='<text x="85" y="24">Historische Rendite p. a.</text>';
 for(let i=0;i<=5;i++){
  const x=maxX*i/5,y=minY+(maxY-minY)*i/5;
  svg+=`<path d="M85 ${Y(y)}H950 M${X(x)} 50V385" stroke="#e8ede5"/><text x="75" y="${Y(y)+4}" text-anchor="end">${pct(y)}</text><text x="${X(x)}" y="410" text-anchor="middle">${pct(x)}</text>`;
 }
 points.forEach((p,i)=>{svg+=`<circle data-mix="${i}" cx="${X(p.s)}" cy="${Y(p.r)}" r="4" fill="#a9c8b6" opacity=".7" style="cursor:pointer"><title>${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle>`;});
 svg+=`<path d="${curve.map((p,i)=>(i?'L':'M')+X(p.s)+','+Y(p.r)).join(' ')}" fill="none" stroke="#237c55" stroke-width="3"/>`;
 curve.forEach((p,i)=>{svg+=`<circle data-efficient="${i}" cx="${X(p.s)}" cy="${Y(p.r)}" r="7" fill="transparent" style="cursor:pointer"><title>Effizient: ${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle>`;});
 assets.forEach((p,i)=>{svg+=`<circle cx="${X(p.s)}" cy="${Y(p.r)}" r="7" fill="${colors[i]}" stroke="white" stroke-width="2"><title>${p.name}: ${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle><text x="${X(p.s)}" y="${Y(p.r)-13}" text-anchor="middle">${i+1}</text>`;});
 svg+=`<circle cx="${X(risk(w))}" cy="${Y(dot(w,mu)*12)}" r="9" fill="#d4ad48" stroke="#fff" stroke-width="3"><title>Deine Mischung</title></circle><text x="520" y="443" text-anchor="middle">Risiko / Schwankung p. a. →</text>`;
 $('frontier').innerHTML=svg;
 $('asset-legend').innerHTML=assets.map((p,i)=>`<span style="color:${colors[i]}">● ${i+1} · ${p.name}</span>`).join('');
 $('frontier').querySelectorAll('[data-efficient]').forEach(el=>el.onclick=()=>{const i=+el.dataset.efficient;w=[...curve[i].w];$('target').value=i*2;draw();});
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

// A: lowest historical volatility for at least B's arithmetic annual return.
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
 const a=comparisonStats(optimize(dot(w,mu)));
 // Comparison B minus A: higher return is favorable, higher volatility unfavorable.
 const deltaReturn=(b.annualReturn-a.annualReturn)*100;
 const deltaRisk=(b.volatility-a.volatility)*100;
 const formatDelta=x=>(x>0?'+':'')+x.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})+' PP';
 const classify=(x,higherBetter)=>Math.abs(x)<0.05?'neutral':((x>0)===higherBetter?'good':'bad');
 const retClass=classify(deltaReturn,true),riskClass=classify(deltaRisk,false);
 const riskHeight=Math.min(19,Math.max(3,Math.abs(deltaRisk)*8));
 const retHeight=Math.min(19,Math.max(3,Math.abs(deltaReturn)*8));
 const bar=(x,height,klass,left)=>`<span class="delta-column ${x>=0?'up':'down'}" style="left:${left}px;height:${height}px;background:${klass==='good'?'#237c55':klass==='bad'?'#b94a42':'#9aa79f'}"></span>`;
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
  ?'Historische annualisierte Volatilität. A minimiert die Volatilität bei mindestens der Rendite von B.'
  :compareMode==='dd'
  ?'Größter historischer Rückgang vom bisherigen Höchststand; monatliches Rebalancing.'
  :'Rendite / Volatilität bei 0 % Referenzzins (vereinfachte Sharpe-ähnliche Kennzahl).';
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{
 compareMode=button.dataset.compare;
 drawComparison();
}));
