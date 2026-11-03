
const names=['MSCI ACWI','MSCI World','MSCI Emerging Markets','MSCI World Small Cap','MSCI Japan','NASDAQ-100','S&P 500','DAX','STOXX Europe 600','Globale REITs','Gold','Silber','Bitcoin','Ethereum','Euro-Staatsanleihen'];
let dataset=[], activeMonths=[];
let selected=[1],w=[1],period='10',rows=[],mu=[],cov=[],curve=[];
const $=id=>document.getElementById(id),pct=x=>(x*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %',eur=x=>x.toLocaleString('de-DE',{maximumFractionDigits:0})+' €';
function month(i){return (2000+Math.floor(i/12))+'-'+String(i%12+1).padStart(2,'0')}function idx(s){let [y,m]=s.split('-').map(Number);return (y-2000)*12+m-1}
function tiles(){$('tiles').innerHTML=names.map((n,i)=>`<button class="tile ${selected.includes(i)?'active':''}" data-i="${i}" aria-pressed="${selected.includes(i)}" ${!selected.includes(i)&&selected.length===5?'disabled':''}><small>${i<10?'AKTIEN':i<12?'EDELMETALLE':i<14?'KRYPTO':'ANLEIHEN'}</small><span class="check">${selected.includes(i)?'✓':'+'}</span><b>${n}</b></button>`).join('');$('count').textContent=selected.length+' von 5 ausgewählt';$('tiles').querySelectorAll('button').forEach(b=>b.onclick=()=>{let i=+b.dataset.i;if(selected.includes(i)){if(selected.length===1)return;selected.splice(selected.indexOf(i),1)}else selected.push(i);w=selected.map(()=>1/selected.length);tiles();recalc()})}
function simplex(v){let u=[...v].sort((a,b)=>b-a),s=0,t=0;for(let j=0;j<u.length;j++){s+=u[j];if(u[j]-(s-1)/(j+1)>0)t=(s-1)/(j+1)}return v.map(x=>Math.max(0,x-t))}
function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0)}function risk(v){return Math.sqrt(Math.max(0,v.reduce((s,x,i)=>s+x*dot(cov[i],v),0))*12)}
function optimize(target){let v=mu.map(()=>1/mu.length),max= Math.max(...cov.map(r=>r.reduce((s,x)=>s+Math.abs(x),0))),step=.4/Math.max(max,1e-8),lo=mu.indexOf(Math.min(...mu)),hi=mu.indexOf(Math.max(...mu));function project(x){x=simplex(x);if(target===null||dot(x,mu)>=target-1e-12)return x;let l=0,h=1;while(dot(simplex(v.map((_,i)=>x[i]+h*mu[i])),mu)<target-1e-12&&h<1e12)h*=2;for(let k=0;k<48;k++){let m=(l+h)/2;if(dot(simplex(x.map((z,i)=>z+m*mu[i])),mu)<target)l=m;else h=m}return simplex(x.map((z,i)=>z+h*mu[i]))}for(let k=0;k<700;k++){let next=project(v.map((x,i)=>x-step*dot(cov[i],v)));let d=next.reduce((s,x,i)=>s+Math.abs(x-v[i]),0);v=next;if(d<1e-9)break}return v}
function emptyState(message){
 rows=[];curve=[];mu=[];cov=[];
 $('coverage').textContent=message;
 for(const id of ['weights','frontier','growth','metrics'])$(id).innerHTML='';
 $('targetvalue').textContent='';
 for(const id of ['equal','min','target'])$(id).disabled=true;
}
function recalc(){
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
 const minimum=optimize(null),start=dot(minimum,mu),end=Math.max(...mu);
 curve=Array.from({length:51},(_,i)=>{const v=optimize(start+(end-start)*i/50);return {w:v,r:dot(v,mu)*12,s:risk(v)};});
 const cropped=idx(block[0].month)>a||idx(block.at(-1).month)<b;
 $('coverage').textContent=`Auswertung: ${block[0].month} bis ${block.at(-1).month} · ${rows.length} gemeinsame Monatsrenditen`+(cropped?' · Auf verfügbare gemeinsame Daten gekürzt.':'')+(period!=='custom'&&blocks.length>1?' · Neuester lückenloser Abschnitt; frühere Datenlücken wurden nicht überbrückt.':'');
 for(const id of ['equal','min','target'])$(id).disabled=false;
 draw();
}
function draw(){ $('weights').innerHTML=selected.map((j,i)=>`<div class="weight"><label for="w${i}">${names[j]} <span>${pct(w[i])}</span></label><input id="w${i}" type="range" min="0" max="100" step="0.1" value="${w[i]*100}" data-i="${i}"></div>`).join('');$('weights').querySelectorAll('input').forEach(el=>el.oninput=()=>{let i=+el.dataset.i,v=+el.value/100,rest=1-w[i];w=w.map((x,j)=>j===i?v:rest>1e-10?x*(1-v)/rest:(1-v)/(w.length-1));if(w.length===1)w=[1];draw()});let maxX=Math.max(.001,...selected.map((_,i)=>Math.sqrt(cov[i][i]*12)),risk(w)) *1.16,minY=Math.min(0,...mu.map(x=>x*12)),maxY=Math.max(...mu.map(x=>x*12),.01)*1.15;const X=x=>65+x/maxX*600,Y=y=>330-(y-minY)/(maxY-minY)*290;let svg='';for(let i=0;i<=4;i++){let x=maxX*i/4,y=minY+(maxY-minY)*i/4;svg+=`<path d="M65 ${Y(y)}H665 M${X(x)} 40V330" stroke="#e8ede5"/><text x="55" y="${Y(y)+4}" text-anchor="end">${pct(y)}</text><text x="${X(x)}" y="352" text-anchor="middle">${pct(x)}</text>`}svg+='<text x="365" y="383" text-anchor="middle">Risiko / Schwankung p. a. →</text><text x="65" y="20">Rendite p. a.</text>';svg+=`<path d="${curve.map((p,i)=>(i?'L':'M')+X(p.s)+','+Y(p.r)).join(' ')}" fill="none" stroke="#237c55" stroke-width="4"/>`;selected.forEach((j,i)=>svg+=`<circle cx="${X(Math.sqrt(cov[i][i]*12))}" cy="${Y(mu[i]*12)}" r="5" fill="white" stroke="#7b9185"/><text x="${X(Math.sqrt(cov[i][i]*12))-7}" y="${Y(mu[i]*12)-10}" text-anchor="end">${names[j]}</text>`);curve.forEach((p,i)=>svg+=`<circle data-p="${i}" cx="${X(p.s)}" cy="${Y(p.r)}" r="9" fill="transparent" style="cursor:pointer"><title>${pct(p.r)} Rendite · ${pct(p.s)} Risiko</title></circle>`);svg+=`<circle cx="${X(risk(w))}" cy="${Y(dot(w,mu)*12)}" r="8" fill="#d4ad48" stroke="white" stroke-width="3"/>`;$('frontier').innerHTML=svg;$('frontier').querySelectorAll('[data-p]').forEach(e=>e.onclick=()=>{w=[...curve[+e.dataset.p].w];$('target').value=+e.dataset.p*2;draw()});let val=10000,peak=val,dd=0,values=[val];rows.forEach(r=>{val*=1+dot(r,w);peak=Math.max(peak,val);dd=Math.min(dd,val/peak-1);values.push(val)});let cagr=(val/10000)**(12/rows.length)-1;$('metrics').innerHTML=[['Jahresrendite geometrisch',pct(cagr)],['Schwankung p. a.',pct(risk(w))],['Größter Verlust',pct(dd)],['Endvermögen',eur(val)]].map(([l,v])=>`<div class="metric"><small>${l}</small><strong>${v}</strong></div>`).join('');let low=Math.min(...values)*.95,high=Math.max(...values)*1.05;let gy=v=>210-(v-low)/(high-low)*180;$('growth').innerHTML=[0,1,2].map(i=>{let v=low+(high-low)*i/2;return `<path d="M90 ${gy(v)}H980" stroke="#e8ede5"/><text x="80" y="${gy(v)+4}" text-anchor="end">${eur(v)}</text>`}).join('')+`<path d="M${values.map((v,i)=>`${90+i/(values.length-1)*890},${gy(v)}`).join(' L')}" fill="none" stroke="#237c55" stroke-width="3"/><text x="90" y="240">${activeMonths[0]}</text><text x="980" y="240" text-anchor="end">${activeMonths.at(-1)}</text>`;$('targetvalue').textContent=pct(curve[Math.round(+$('target').value/2)].r)}
$('periods').innerHTML=[['5','5 Jahre'],['10','10 Jahre'],['15','15 Jahre'],['20','20 Jahre'],['max','Maximal'],['custom','Eigener Zeitraum']].map(([v,l])=>`<button data-v="${v}" class="${v===period?'active':''}">${l}</button>`).join('');$('periods').querySelectorAll('button').forEach(b=>b.onclick=()=>{period=b.dataset.v;$('periods').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));recalc()});$('start').onchange=$('end').onchange=recalc;$('equal').onclick=()=>{w=selected.map(()=>1/selected.length);draw()};$('min').onclick=()=>{w=[...curve[0].w];$('target').value=0;draw()};$('target').oninput=()=>{w=[...curve[Math.round(+$('target').value/2)].w];draw()};tiles();recalc();
initializeExcel();

async function applyExcel(buffer,label){
 const imported=await readPortfolioExcel(buffer,names);
 dataset=imported;
 $('source-status').textContent=label+' · '+dataset.length+' Monate mit mindestens einem Renditewert.';
 if(dataset.length){for(const id of ['start','end']){$(id).min=dataset[0].month;$(id).max=dataset.at(-1).month;} $('start').value=dataset[0].month;$('end').value=dataset.at(-1).month;}
 recalc();
}
async function initializeExcel(){
 $('excel-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!/\.xlsx$/i.test(file.name)){$('source-status').textContent='Bitte eine .xlsx-Datei auswählen.';return;}
  $('source-status').textContent='Excel-Datei wird gelesen …';
  try{await applyExcel(await file.arrayBuffer(),'Lokal geladen: '+file.name);}
  catch(error){$('source-status').textContent='Import fehlgeschlagen: '+error.message+(dataset.length?' Die bisherige Datenbasis bleibt aktiv.':'');}
  event.target.value='';
 };
 try{const response=await fetch('pfmxdaten.xlsx',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);await applyExcel(await response.arrayBuffer(),'Website-Datei: pfmxdaten.xlsx');}
 catch(error){$('source-status').textContent='pfmxdaten.xlsx konnte nicht geladen werden: '+error.message+'. Alternativ Excel-Datei unten auswählen.';}
}
