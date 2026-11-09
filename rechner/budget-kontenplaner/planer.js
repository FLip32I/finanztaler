'use strict';
const KEY='finanztaler-budget-v2';
const seed=()=>({income:2500,extra:0,groups:[{name:'Wohnen & Grundbedarf',items:[{name:'Miete & Nebenkosten',amount:950,period:'month'},{name:'Lebensmittel',amount:350,period:'month'},{name:'Mobilität',amount:150,period:'month',day:15}]},{name:'Konsum & Freizeit',items:[{name:'Freizeit & Hobbys',amount:150,period:'month'},{name:'Abonnements',amount:30,period:'month',day:3}]},{name:'Sparen & Rücklagen',items:[{name:'Sparrate',amount:400,period:'month'},{name:'Notgroschen',amount:100,period:'month'}]},{name:'Puffer & Sonstiges',items:[{name:'Ungeplante Ausgaben',amount:100,period:'month',day:15}]}]});
let state=seed();let opened=new Set([0]);
const $=id=>document.getElementById(id), euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n), num=v=>Math.max(0,Number(v)||0), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>Math.max(1,Math.min(31,Math.round(Number(v)||1)));
const monthNow=()=>new Date().toISOString().slice(0,7);
const monthly=x=>num(x.amount)/(x.period==='year'?12:1);
function totals(){return state.groups.map(g=>g.items.reduce((a,x)=>a+monthly(x),0))}
function renderGroups(){const totalsNow=totals();$('groups').innerHTML=state.groups.map((g,i)=>`<article class="budget-group"><button class="group-toggle" type="button" data-toggle="${i}" aria-expanded="${opened.has(i)}"><span class="group-icon">${['⌂','◈','€','+'][i]}</span><span class="group-name">${esc(g.name)}<small>${g.items.length} Positionen</small></span><strong>${euro(totalsNow[i])}</strong><span class="chevron">${opened.has(i)?'⌃':'⌄'}</span></button>${opened.has(i)?`<div class="group-body"><div class="row-label"><span>Bezeichnung</span><span>Betrag</span><span>Zeitraum</span><span class="cf-day-label">Tag</span></div>${g.items.map((x,j)=>`<div class="budget-row"><input aria-label="Bezeichnung" data-g="${i}" data-j="${j}" data-field="name" value="${esc(x.name)}"><input aria-label="Betrag in Euro" type="number" min="0" step="0.01" data-g="${i}" data-j="${j}" data-field="amount" value="${x.amount}"><select aria-label="Zeitraum" data-g="${i}" data-j="${j}" data-field="period"><option value="month" ${x.period==='month'?'selected':''}>Monat</option><option value="year" ${x.period==='year'?'selected':''}>Jahr</option></select><input class="cf-day" aria-label="Zahlungstag" type="number" min="1" max="31" data-g="${i}" data-j="${j}" data-field="day" value="${day(x.day||1)}">${x.period==='year'?`<select aria-label="Fälligkeitsmonat" class="due-month" data-g="${i}" data-j="${j}" data-field="dueMonth">${Array.from({length:12},(_,k)=>`<option value="${k+1}" ${Number(x.dueMonth||1)===k+1?'selected':''}>${new Date(2026,k,1).toLocaleDateString('de-DE',{month:'short'})}</option>`).join('')}</select>`:''}<button class="delete-row" data-delete="${i}:${j}" aria-label="Position entfernen">×</button></div>`).join('')}<button class="add" data-add="${i}">+ Position hinzufügen</button></div>`:''}</article>`).join('')}
function renderSummary(){renderAccountFlow();const t=totals(),inc=num(state.income)+num(state.extra)+extraSum(),sum=t.reduce((a,b)=>a+b,0),rest=inc-sum; $('incomeTotal').textContent=euro(inc);$('expenseTotal').textContent=euro(sum);$('remaining').textContent=euro(rest);$('remaining').className=rest<0?'negative':'positive';$('summaryHint').textContent=rest<0?'Dein Budget ist überplant. Passe die Beträge an.':'Noch nicht zugewiesener Betrag – du kannst ihn als Puffer einplanen.';const colors=['#236448','#d5a73c','#91bca0','#9aaab1'];$('distribution').innerHTML=t.map((v,i)=>`<span style="width:${inc?Math.max(0,Math.min(100,v/inc*100)):0}%;background:${colors[i]}"></span>`).join('');$('comparison').innerHTML=[['Grundbedarf',50,t[0]],['Freizeit',30,t[1]],['Sparen',20,t[2]]].map(([label,target,value])=>`<div class="comparison-row"><span>${label}</span><span>${target} %</span><strong>${inc?(value/inc*100).toLocaleString('de-DE',{maximumFractionDigits:1}):'0'} %</strong></div>`).join('');$('accountPlan').innerHTML=[['Girokonto / Grundbedarf',t[0]],['Spaßkonto',t[1]],['Spar- & Rücklagenkonto',t[2]],['Puffer',t[3]]].map(([label,v])=>`<div class="account-row"><span>${label}</span><b>${euro(v)} / Monat</b></div>`).join('')}
function render(){renderGroups();renderSummary();renderExtraIncomes();renderAssignments();renderCashflow()}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.key){state[el.dataset.key]=num(el.value);renderSummary();renderCashflow()}else if(el.dataset.field){const item=state.groups[+el.dataset.g].items[+el.dataset.j];item[el.dataset.field]=el.dataset.field==='amount'?num(el.value):el.dataset.field==='day'?day(el.value):el.value;if(el.dataset.field==='period')renderGroups();
 document.querySelectorAll('[data-toggle]').forEach(b=>{const i=+b.dataset.toggle;b.querySelector('strong').textContent=euro(totals()[i])});
 renderSummary();renderCashflow()}});
document.addEventListener('change',e=>{if(e.target.dataset.field==='dueMonth'){const el=e.target;state.groups[+el.dataset.g].items[+el.dataset.j].dueMonth=+el.value;renderCashflow()}if(e.target.dataset.field==='period'){const el=e.target;state.groups[+el.dataset.g].items[+el.dataset.j].period=el.value;renderSummary()}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.toggle!==undefined){const i=+b.dataset.toggle;opened.has(i)?opened.delete(i):opened.add(i);renderGroups()}if(b.dataset.add!==undefined){const i=+b.dataset.add;state.groups[i].items.push({name:'Neue Position',amount:0,period:'month',day:1});opened.add(i);render()}if(b.dataset.delete){const [i,j]=b.dataset.delete.split(':').map(Number);state.groups[i].items.splice(j,1);render()}});
function valid(s){return s&&Number.isFinite(s.income)&&Number.isFinite(s.extra)&&Array.isArray(s.groups)&&s.groups.length===4&&s.groups.every(g=>Array.isArray(g.items)&&g.items.length<200&&g.items.every(x=>typeof x.name==='string'&&Number.isFinite(x.amount)&&x.amount>=0&&['month','year'].includes(x.period)))}
$('save').onclick=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));$('notice').textContent='Dein Plan wurde lokal in diesem Browser gespeichert.'}catch{$('notice').textContent='Speichern ist hier nicht verfügbar.'}};
$('load').onclick=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(!valid(s))throw Error();state=s;sync();$('notice').textContent='Gespeicherter Plan geladen.'}catch{$('notice').textContent='Kein gültiger gespeicherter Plan gefunden.'}};
$('reset').onclick=()=>{if(confirm('Aktuelle Eingaben auf das Beispiel zurücksetzen?')){state=seed();opened=new Set([0]);sync();$('notice').textContent='Beispiel wiederhergestellt.'}};
$('print').onclick=()=>window.print();
$('csv').onclick=()=>{const rows=[['Kategorie','Position','Betrag','Zeitraum','Monatlich','Zahlungstag','Fälligkeitsmonat']];if(state.accountsEnabled)rows[0].push('Konto','Verwendung','Zahlungsart','Übertragstag');state.groups.forEach((g,i)=>g.items.forEach(x=>{const row=[g.name,x.name,x.amount,x.period==='year'?'Jährlich':'Monatlich',monthly(x),day(x.day||1),x.period==='year'?(x.dueMonth||1):''];if(state.accountsEnabled){const a=assignmentFor(x,i);row.push(accountName(a.id),a.mode==='saving'?'Sparen / Investieren':'Ausgabe',a.method,a.id==='giro'?'':a.transferDay)}rows.push(row)}));rows.push(['','Einnahmen',num(state.income)+num(state.extra)+extraSum(),'Monatlich','']);const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='finanztaler-budget.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function sync(){
 normalizeAccounts();
 state.extraIncomes=Array.isArray(state.extraIncomes)?state.extraIncomes:[];
 if(num(state.extra)){state.extraIncomes.push({name:'Weitere regelmäßige Einnahmen',amount:num(state.extra),day:day(state.extraDay||1)});state.extra=0;}
 state.incomeDay=day(state.incomeDay||28);state.extraDay=day(state.extraDay||1);
 state.salaryTiming=['start','end','custom'].includes(state.salaryTiming)?state.salaryTiming:'end';
 document.querySelectorAll('[data-key]').forEach(x=>x.value=state[x.dataset.key]);
 $('incomeDay').value=state.incomeDay;render();
}


// Cashflow: echte Zahlungstage statt auf Monate umgelegter Jahreskosten.
state.incomeDay=state.incomeDay||28;state.extraDay=state.extraDay||1;
state.extraIncomes=Array.isArray(state.extraIncomes)?state.extraIncomes:[];
state.salaryTiming=state.salaryTiming||'end';
let cfActive=false;
const extraSum=()=>state.extraIncomes.reduce((s,x)=>s+num(x.amount),0);
function renderExtraIncomes(){
 $('extraIncomeRows').innerHTML=state.extraIncomes.map((x,i)=>`<div class="extra-income-row"><input aria-label="Einnahme" data-extra-index="${i}" data-extra-field="name" value="${esc(x.name)}"><input aria-label="Betrag" type="number" min="0" step="0.01" data-extra-index="${i}" data-extra-field="amount" value="${num(x.amount)}"><input class="cf-day" aria-label="Zahlungstag" type="number" min="1" max="31" data-extra-index="${i}" data-extra-field="day" value="${day(x.day||1)}"><button type="button" data-remove-extra="${i}" aria-label="Einnahme entfernen">×</button></div>`).join('');
}
function setCashflowActive(active){
 cfActive=active;$('cashflow').hidden=false;
 $('cashToggle').disabled=!active;
 $('cashToggle').setAttribute('aria-expanded',String(active));
 $('cashContent').hidden=!active;
 $('cashLockedHint').hidden=active;
 document.querySelectorAll('.cf-only').forEach(x=>x.hidden=!active);
 $('cashOption').checked=active;document.body.classList.toggle('cf-active',active);
 if(active)renderCashflow();
}
$('cashOption').addEventListener('change',e=>setCashflowActive(e.target.checked));
$('cashToggle').onclick=()=>{if(!cfActive)return;const expanded=$('cashContent').hidden;$('cashContent').hidden=!expanded;$('cashToggle').setAttribute('aria-expanded',String(expanded));if(expanded)renderCashflow()};
$('addExtraIncome').onclick=()=>{state.extraIncomes.push({name:'Weitere Einnahme',amount:0,day:1});renderExtraIncomes();renderSummary();renderCashflow()};
document.addEventListener('input',e=>{let x=e.target;if(x.dataset.extraIndex===undefined)return;let o=state.extraIncomes[+x.dataset.extraIndex];o[x.dataset.extraField]=x.dataset.extraField==='amount'?num(x.value):x.dataset.extraField==='day'?day(x.value):x.value;renderSummary();renderCashflow()});
document.addEventListener('click',e=>{let b=e.target.closest('[data-remove-extra]');if(!b)return;state.extraIncomes.splice(+b.dataset.removeExtra,1);renderExtraIncomes();renderSummary();renderCashflow()});
const flowYear=new Date().getFullYear();
$('flowMonth').innerHTML=Array.from({length:12},(_,i)=>`<option value="${flowYear}-${String(i+1).padStart(2,'0')}">${new Date(flowYear,i,1).toLocaleDateString('de-DE',{month:'long'})}</option>`).join('');
$('flowMonth').value=monthNow();
function renderCashflow(){
 const month=($('flowMonth').value||monthNow());const [y,m]=month.split('-').map(Number);
 if(!y||!m)return;
 $('flowStart').closest('label').hidden=false;
 if(state.accountsEnabled){renderMultiCashflow(y,m);return;}
 const last=new Date(y,m,0).getDate();const clamp=v=>Math.min(last,day(v));
 const events=[];
 const salaryDay=day(state.incomeDay||28);
 if(num(state.income))events.push({d:clamp(salaryDay),label:'Gehalt',amount:num(state.income),kind:'income'});
 if(num(state.extra))events.push({d:clamp(state.extraDay||1),label:'Weitere regelmäßige Einnahmen',amount:num(state.extra),kind:'extra'});
 state.extraIncomes.forEach((x,k)=>{if(num(x.amount))events.push({d:clamp(x.day||1),label:x.name||'Weitere Einnahme',amount:num(x.amount),kind:'added',k})});
 state.groups.forEach((g,i)=>g.items.forEach((x,j)=>{
  if(x.period==='year'&&Number(x.dueMonth||1)!==m)return;
  if(!num(x.amount))return;
  events.push({d:clamp(x.day||1),label:x.name,amount:-num(x.amount),i,j,group:g.name});
 }));
 events.sort((a,b)=>a.d-b.d||(b.amount-a.amount));
 if(state.flowStart===undefined)state.flowStart=num(state.income);
 if(document.activeElement!==$('flowStart'))$('flowStart').value=Number(state.flowStart)||0;
 $('flowStartHint').textContent='Beispielsweise dein Gehaltseingang aus dem Vormonat, abzüglich bereits bezahlter Ausgaben.';
 let cumulative=0,minimum=0,beforeSalary=0,beforeMinimum=0;
 for(const event of events){cumulative+=event.amount;minimum=Math.min(minimum,cumulative);if(event.d<clamp(salaryDay)){beforeSalary+=event.amount;beforeMinimum=Math.min(beforeMinimum,beforeSalary);}}
 $('flowRequired').textContent=(num(state.income)?'Bis zum Gehalt am '+clamp(salaryDay)+'. benötigst du mindestens '+euro(-beforeMinimum)+' am Monatsanfang. ':'')+'Für den gesamten Monat sind mindestens '+euro(-minimum)+' Startguthaben nötig, um nicht ins Minus zu rutschen.';
 let balance=Number($('flowStart').value)||0,lowest=balance;
 $('flowOpening').textContent=euro(balance);
 $('flowEvents').innerHTML=events.map(e=>{balance+=e.amount;lowest=Math.min(lowest,balance);const ref=e.i!==undefined?`data-flow="${e.i}:${e.j}"`:e.k!==undefined?`data-flow-extra="${e.k}"`:`data-flow-income="${e.kind}"`;const dayEdit=`<input class="flow-day-edit" aria-label="Tag für ${esc(e.label)}" type="number" min="1" max="31" value="${e.d}" ${e.i!==undefined?`data-edit-flow="${e.i}:${e.j}"`:e.k!==undefined?`data-edit-extra="${e.k}"`:`data-edit-income="${e.kind}"`}>`;return `<div class="flow-event"><div>${dayEdit}</div><button type="button" class="flow-event-name" ${ref}>${esc(e.label)}<small>${e.group?esc(e.group):'Einnahme'}</small></button><strong class="${e.amount<0?'flow-out':'flow-in'}">${e.amount>0?'+':''}${euro(e.amount)}</strong><strong class="${balance<0?'negative':''}">${euro(balance)}</strong></div>`}).join('')||'<p class="help">Keine Ereignisse in diesem Monat.</p>';
 $('flowClosing').textContent=euro(balance);$('flowLowest').textContent=euro(lowest);
}
$('flowMonth').addEventListener('change',renderCashflow);
$('flowStart').addEventListener('input',e=>{if(state.accountsEnabled){const a=accountById($('flowAccount').value);a.opening=Number(e.target.value)||0;if(a.id==='giro')state.flowStart=a.opening}else{state.flowStart=Number(e.target.value)||0;if(state.accounts)accountById('giro').opening=state.flowStart}renderCashflow()});
$('incomeDay').addEventListener('input',e=>{state.incomeDay=day(e.target.value);renderCashflow()});
document.addEventListener('change',e=>{const x=e.target;if(x.dataset.editFlow){const [i,k]=x.dataset.editFlow.split(':').map(Number);state.groups[i].items[k].day=day(x.value);renderCashflow()}else if(x.dataset.editExtra!==undefined){state.extraIncomes[+x.dataset.editExtra].day=day(x.value);renderCashflow()}else if(x.dataset.editIncome){state[x.dataset.editIncome==='income'?'incomeDay':'extraDay']=day(x.value);if(x.dataset.editIncome==='income')$('incomeDay').value=state.incomeDay;renderCashflow()}});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-flow],[data-flow-income],[data-flow-extra]');if(!btn)return;
 if(btn.dataset.flowExtra!==undefined){document.querySelector(`[data-extra-index="${btn.dataset.flowExtra}"][data-extra-field="name"]`)?.focus();document.querySelector('#eingaben').scrollIntoView({behavior:'smooth'});return;}
 if(btn.dataset.flowIncome){document.querySelector('[data-key="'+(btn.dataset.flowIncome==='income'?'income':'extra')+'"]').focus();document.querySelector('#eingaben').scrollIntoView({behavior:'smooth'});return;}
 const [i,j]=btn.dataset.flow.split(':').map(Number);opened.add(i);renderGroups();const input=document.querySelector(`[data-g="${i}"][data-j="${j}"][data-field="name"]`);if(input){input.scrollIntoView({behavior:'smooth',block:'center'});input.focus()}
});
initAccountControls();
sync();
setCashflowActive(false);


function renderAccountFlow(){
 const t=totals(),income=num(state.income)+num(state.extra)+extraSum(),expenses=t.reduce((a,b)=>a+b,0),rest=income-expenses,total=Math.max(income,expenses);
 const unit=$('accountFlow').dataset.unit||'eur',selected=Number($('accountFlow').dataset.selected??-1);
 const fmt=v=>unit==='pct'?(income?(v/income*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %':'–'):euro(v);
 const labels=['Grundbedarf','Alltag & Freizeit','Sparen & Rücklagen','Puffer','Noch frei'],colors=['#236448','#c59b32','#80a68a','#84979f','#c4cdbd'];
 const groupTargets=t.map((value,i)=>({value,i,label:labels[i],color:colors[i]}));if(rest>0)groupTargets.push({value:rest,i:4,label:labels[4],color:colors[4]});
 const targets=$('sankeyLevel').value==='items'?state.groups.flatMap((g,i)=>g.items.map(x=>({value:monthly(x),i,label:x.name,color:colors[i]}))).concat(rest>0?[groupTargets[groupTargets.length-1]]:[]):groupTargets;
 const visible=targets.filter(x=>x.value>0),scale=total?280/total:0;
 const sources=[{value:income,label:'Einnahmen',color:'#236448'}];if(rest<0)sources.push({value:-rest,label:'Fehlbetrag',color:'#b24d35'});
 let sy=45; sources.forEach(x=>{x.y=sy;x.height=x.value*scale;x.offset=0;sy+=x.height+22});
 let ty=30;visible.forEach(x=>{x.y=ty;x.height=x.value*scale;ty+=x.height+36});
 const height=Math.max(360,ty+10,sy+10);
 let paths='',nodes='';
 for(const target of visible){let offset=0;for(const source of sources){const amount=total?target.value*source.value/total:0,h=amount*scale;if(!h)continue;
 const y1=source.y+source.offset,y2=target.y+offset;
 paths+=`<path d="M 180 ${y1} C 320 ${y1},360 ${y2},500 ${y2} L 500 ${y2+h} C 360 ${y2+h},320 ${y1+h},180 ${y1+h} Z" fill="${source.label==='Fehlbetrag'?source.color:target.color}" opacity=".32"><title>${esc(source.label)} → ${esc(target.label)}: ${esc(fmt(amount))}</title></path>`;source.offset+=h;offset+=h;}
 nodes+=`<rect x="500" y="${target.y}" width="14" height="${target.height}" fill="${target.color}"/><text x="528" y="${target.y+target.height/2-3}" fill="#163c31" font-size="14" font-weight="700">${esc(target.label)}</text><text x="528" y="${target.y+target.height/2+16}" fill="#587064" font-size="13">${esc(fmt(target.value))}</text>`;
 }
 const sourceNodes=sources.filter(x=>x.value>0).map(x=>`<rect x="166" y="${x.y}" width="14" height="${x.height}" fill="${x.color}"/><text x="150" y="${x.y+x.height/2-3}" text-anchor="end" font-size="14" fill="${x.color}" font-weight="700">${esc(x.label)}</text><text x="150" y="${x.y+x.height/2+16}" text-anchor="end" font-size="13" fill="#587064">${esc(fmt(x.value))}</text>`).join('');
 const group=state.groups[selected];
 $('accountFlow').innerHTML=(total?`<div class="sankey-scroll"><svg viewBox="0 0 740 ${height}" role="img" aria-label="Monatliche Budgetverteilung"><title>Monatliche Budgetverteilung</title>${paths}${sourceNodes}${nodes}</svg></div>`:'<p>Trage Einnahmen oder Ausgaben ein, um die Verteilung zu sehen.</p>')+`<div class="sankey-categories" aria-label="Bereich auswählen">${groupTargets.map(x=>`<button type="button" data-sankey-group="${x.i}" aria-expanded="${selected===x.i}" aria-controls="sankeyDetail"><span style="background:${x.color}" aria-hidden="true"></span>${esc(x.label)} <b>${esc(fmt(x.value))}</b></button>`).join('')}</div><div id="sankeyDetail">${selected>=0?`<h3>${esc(labels[selected])}</h3>${group?group.items.map(x=>`<div class="account-row"><span>${esc(x.name)}</span><b>${esc(fmt(monthly(x)))}</b></div>`).join(''):'<p>Dieser Betrag ist noch keinem Budgetbereich zugewiesen.</p>'}`:''}</div>${rest<0?`<p class="af-deficit">Deine Ausgaben übersteigen die Einnahmen um ${euro(-rest)} pro Monat. Der rote Geldstrom zeigt diesen ungedeckten Betrag.</p>`:''}${unit==='pct'?'<p class="help">Prozentwerte beziehen sich auf die Einnahmen. Bei einer Überplanung liegt die Summe über 100 %. Ohne Einnahmen sind Prozentwerte nicht definiert.</p>':''}`;
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-sankey-unit],[data-sankey-group]');if(!button)return;
 if(button.dataset.sankeyUnit){$('accountFlow').dataset.unit=button.dataset.sankeyUnit;document.querySelectorAll('[data-sankey-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
 else {const next=button.dataset.sankeyGroup;$('accountFlow').dataset.selected=$('accountFlow').dataset.selected===next?'-1':next;}
 renderAccountFlow();
 // Preserve keyboard focus when the selected area's buttons are re-rendered.
 if(button.dataset.sankeyGroup!==undefined)document.querySelector(`[data-sankey-group="${button.dataset.sankeyGroup}"]`)?.focus();
});

$('sankeyLevel').addEventListener('change',renderAccountFlow);

// Konten bleiben vollständig optional; manuelle Zuordnungen überleben Umbenennungen.
function normalizeAccounts(){
 const defaults=[['giro','Girokonto','giro'],['fun','Spaßkonto','fun'],['savings','Sparkonto','savings'],['depot','Depot 1','depot']];
 if(!Array.isArray(state.accounts))state.accounts=[];
 for(const [id,name,type] of defaults)if(!state.accounts.some(a=>a.id===id))state.accounts.push({id,name,type,opening:id==='giro'?Number(state.flowStart??state.income)||0:0});
 state.accounts=state.accounts.filter(a=>a&&typeof a.id==='string').map(a=>({...a,name:typeof a.name==='string'?a.name:'',type:['giro','fun','savings','depot','other'].includes(a.type)?a.type:'other',opening:Number(a.opening)||0}));
 state.accountsEnabled=state.accountsEnabled===true;
}
function accountById(id){return state.accounts.find(a=>a.id===id)||state.accounts.find(a=>a.id==='giro')}
function accountName(id){const a=accountById(id);return a.name.trim()||({giro:'Girokonto',fun:'Spaßkonto',savings:'Sparkonto',depot:'Depot'}[a.type]||'Eigenes Konto')}
function automaticAccount(x,i){
 const n=x.name.toLocaleLowerCase('de-DE');let type='giro';
 if(/notgroschen|rücklag|ruecklag|sparkonto|urlaub|reserve/.test(n))type='savings';
 else if(/sparrate|depot|etf|aktie|invest|fonds|wertpapier/.test(n))type='depot';
 else if(/spaß|spass|freizeit|hobb|kino|restaurant|shopping/.test(n))type='fun';
 else if(i===2)type='savings';
 return state.accounts.find(a=>a.type===type)?.id||'giro';
}
function assignmentFor(x,i){const id=state.accounts.some(a=>a.id===x.accountId)?x.accountId:automaticAccount(x,i);return {id,mode:x.accountMode|| (i===2||/notgroschen|sparrate|rücklag|ruecklag|reserve|depot|invest|etf|fonds/.test(x.name.toLocaleLowerCase('de-DE'))?'saving':'expense'),method:x.accountMethod|| (id==='giro'?'Lastschrift':'Dauerauftrag'),transferDay:day(x.transferDay??(day(state.incomeDay||28)%31+1))}}
function optionsAccount(selected){return state.accounts.map(a=>`<option value="${esc(a.id)}" ${selected===a.id?'selected':''}>${esc(accountName(a.id))}</option>`).join('')}
function renderAssignments(){
 normalizeAccounts();document.body.classList.toggle('accounts-active',state.accountsEnabled);$('paymentPlan').hidden=!state.accountsEnabled;$('accountsOption').checked=state.accountsEnabled;$('accountsDetails').hidden=!state.accountsEnabled;$('flowAccountLabel').hidden=!state.accountsEnabled;
 const selected=$('flowAccount').value||'all';$('flowAccount').innerHTML='<option value="all">Alle Konten</option>'+optionsAccount(selected);$('flowAccount').value=state.accounts.some(a=>a.id===selected)?selected:'all';
 if(!state.accountsEnabled)return;
 $('accountEditors').innerHTML=state.accounts.map(a=>`<div class="account-editor"><label>Kontotyp<select data-account-id="${esc(a.id)}" data-account-field="type" ${['giro','fun','savings','depot'].includes(a.id)?'disabled':''}>${[['giro','Girokonto'],['fun','Spaßkonto'],['savings','Sparkonto'],['depot','Depot'],['other','Sonstiges']].map(([v,t])=>`<option value="${v}" ${a.type===v?'selected':''}>${t}</option>`).join('')}</select></label><label>Eigener Name (optional)<input data-account-id="${esc(a.id)}" data-account-field="name" value="${esc(a.name)}" placeholder="${esc(accountName(a.id))}" maxlength="80"></label>${['giro','fun','savings','depot'].includes(a.id)?'<span></span>':`<button type="button" data-remove-account="${esc(a.id)}">Entfernen</button>`}</div>`).join('');

}
function initAccountControls(){
 $('accountsOption').onchange=e=>{normalizeAccounts();state.accountsEnabled=e.target.checked;if(state.accountsEnabled){$('accountsDetails').open=true}renderAssignments();renderCashflow()};
 $('flowAccount').onchange=renderCashflow;
 $('addAccount').onclick=()=>{state.accounts.push({id:'custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:'',type:'other',opening:0});renderAssignments();$('accountEditors').lastElementChild.querySelector('input').focus()};
 document.addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.accountId){const a=accountById(el.dataset.accountId),field=el.dataset.accountField;a[field]=field==='opening'?Number(el.value)||0:el.value;if(a.id==='giro'&&field==='opening')state.flowStart=a.opening;renderAssignments();renderCashflow()}
  if(el.dataset.assignment){const [i,j]=el.dataset.assignment.split(':').map(Number),x=state.groups[i].items[j],f=el.dataset.assignmentField;x[f]=['transferDay','day'].includes(f)?day(el.value):el.value;renderAssignments();if(f==='day')renderGroups();renderCashflow()}
  if(el.dataset.field==='name')renderAssignments();
 });
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.removeAccount){const id=b.dataset.removeAccount;state.accounts=state.accounts.filter(a=>a.id!==id);state.groups.forEach(g=>g.items.forEach(x=>{if(x.accountId===id)delete x.accountId}));renderAssignments();renderCashflow()}
  if(b.dataset.autoAccount){const [i,j]=b.dataset.autoAccount.split(':').map(Number),x=state.groups[i].items[j];for(const f of ['accountId','accountMode','accountMethod','transferDay'])delete x[f];renderAssignments();renderCashflow()}
 });
}
function multiEvents(y,m){
 const last=new Date(y,m,0).getDate(),clamp=v=>Math.min(last,day(v)),events=[];
 const push=(account,d,label,amount,detail,ref,transfer=false)=>events.push({account,d:clamp(d),label,amount,detail,ref,transfer});
 if(num(state.income))push('giro',state.incomeDay||28,'Gehalt',num(state.income),'Einnahme', 'income:income');
 state.extraIncomes.forEach((x,k)=>{if(num(x.amount))push('giro',x.day||1,x.name||'Weitere Einnahme',num(x.amount),'Einnahme','extra:'+k)});
 state.groups.forEach((g,i)=>g.items.forEach((x,j)=>{
  if(!num(x.amount)||(x.period==='year'&&Number(x.dueMonth||1)!==m))return;
  const a=assignmentFor(x,i),ref=i+':'+j;
  if(a.mode==='saving'&&a.id==='giro'){push('giro',x.day||1,x.name,0,'Reserve auf dem Girokonto',ref);return;}
  if(a.id!=='giro'){
   const detail=accountName('giro')+' → '+accountName(a.id)+' · '+a.method;
   push('giro',a.transferDay,x.name,-num(x.amount),detail,ref,true);
   push(a.id,a.transferDay,x.name,num(x.amount),detail,ref,true);
   if(a.mode==='saving')return;
  }
  push(a.id,x.day||1,x.name,-num(x.amount),g.name+' · '+(a.id==='giro'?a.method:'Ausgabe'),ref);
 }));
 return events.sort((a,b)=>a.d-b.d||b.amount-a.amount);
}
function inlineAccountCells(e){
 if(!/^\d+:\d+$/.test(e.ref))return `<div class="cf-account-column flow-account-cell">${esc(accountName('giro'))}</div><div class="cf-account-column">Geldeingang</div>`;
 const [i,j]=e.ref.split(':').map(Number),x=state.groups[i].items[j],a=assignmentFor(x,i),ref=esc(e.ref);
 const origin=e.transfer?`<small>${esc(accountName('giro'))} →</small>`:'';
 const konto=`${origin}<select data-inline-ref="${ref}" data-inline-field="accountId" aria-label="Konto für ${esc(x.name)}"><option value="" ${!x.accountId?'selected':''}>Automatisch: ${esc(accountName(automaticAccount(x,i)))}</option>${optionsAccount(x.accountId||'')}</select>`;
 const method=e.transfer?a.method:(x.expenseMethod||(a.id==='giro'?a.method:'Lastschrift'));
 const field=e.transfer||a.id==='giro'?'accountMethod':'expenseMethod';
 const methods=e.transfer?['Lastschrift','Überweisung','Dauerauftrag']:['Lastschrift','Überweisung','Dauerauftrag','Kartenzahlung','Barzahlung'];
 return `<div class="cf-account-column flow-account-cell">${konto}</div><div class="cf-account-column flow-method-cell"><select data-inline-ref="${ref}" data-inline-field="${field}" aria-label="Zahlungsart für ${esc(x.name)}">${methods.map(m=>`<option ${method===m?'selected':''}>${m}</option>`).join('')}</select><details><summary>Verwendung</summary><select data-inline-ref="${ref}" data-inline-field="accountMode" aria-label="Verwendung für ${esc(x.name)}"><option value="expense" ${a.mode==='expense'?'selected':''}>Ausgabe</option><option value="saving" ${a.mode==='saving'?'selected':''}>Sparen / Investieren</option></select></details></div>`;
}
function renderPaymentPlan(events){
 const sourceName=e=>!e.transfer&&e.amount>0?'Einnahme':accountName(e.account);
 const rows=events.filter(e=>e.amount<0||(!e.transfer&&e.amount>0))
  .sort((a,b)=>sourceName(a).localeCompare(sourceName(b),'de')||a.d-b.d||a.label.localeCompare(b.label,'de'))
  .map(e=>{
  let from,to,method;
  if(e.ref.startsWith('income:')||e.ref.startsWith('extra:')){from='Einnahme';to=accountName('giro');method='Geldeingang'}
  else {const [i,j]=e.ref.split(':').map(Number),x=state.groups[i].items[j],a=assignmentFor(x,i);from=accountName(e.account);to=e.transfer?accountName(a.id):'Extern: '+e.label;method=e.transfer?a.method:(x.expenseMethod||(a.id==='giro'?a.method:'Lastschrift'));}
  return `<tr><td>${e.d}.</td><td>${esc(e.label)}${e.transfer?'<small class="account-transfer"> · Übertrag</small>':''}</td><td>${esc(from)}</td><td>${esc(to)}</td><td>${esc(method)}</td><td>${euro(Math.abs(e.amount))}</td></tr>`
 });
 $('paymentPlanTable').innerHTML=rows.length?`<table class="cf-payments"><thead><tr><th>Tag</th><th>Zweck</th><th>Von Konto</th><th>Nach / Empfänger</th><th>Zahlungsart</th><th>Betrag</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<p class="help">Keine Zahlungen im gewählten Monat.</p>';
}
function renderMultiCashflow(y,m){
 const selected=$('flowAccount').value||'all',all=selected==='all',account=accountById(selected),events=multiEvents(y,m);
 const balances=Object.fromEntries(state.accounts.map(a=>[a.id,a.opening]));
 const minimums={...balances};let total=state.accounts.reduce((sum,a)=>sum+a.opening,0),lowestTotal=total;
 const opening=all?total:account.opening;let running=0,required=0;
 $('flowStart').closest('label').hidden=all;
 if(!all&&document.activeElement!==$('flowStart'))$('flowStart').value=account.opening;
 $('flowStartHint').textContent=all?'Alle Konten: Der Kontostand in jeder Zeile gehört zum zahlenden Konto, bei Einnahmen zum empfangenden Konto. Wähle ein einzelnes Konto, um dessen Startguthaben im Cashflow zu ändern.':'Startguthaben für '+accountName(account.id)+'. Interne Überträge werden auf beiden Konten berücksichtigt.';
 $('flowOpening').textContent=euro(opening);
 const rows=[];
 for(const e of events){
  balances[e.account]+=e.amount;minimums[e.account]=Math.min(minimums[e.account],balances[e.account]);
  if(!e.transfer){total+=e.amount;lowestTotal=Math.min(lowestTotal,total)}
  if(e.account===account.id){running+=e.amount;required=Math.min(required,running)}
  if(all?(e.transfer&&e.amount>0):e.account!==account.id)continue;
  let attrs='';
  if(e.transfer)attrs=`data-edit-transfer="${e.ref}"`;
  else if(e.ref.startsWith('income:'))attrs='data-edit-income="income"';
  else if(e.ref.startsWith('extra:'))attrs=`data-edit-extra="${e.ref.split(':')[1]}"`;
  else attrs=`data-edit-flow="${e.ref}"`;
  const btn=e.ref.startsWith('income:')?'data-flow-income="income"':e.ref.startsWith('extra:')?`data-flow-extra="${e.ref.split(':')[1]}"`:`data-flow="${e.ref}"`;
  rows.push(`<div class="flow-event"><div><input class="flow-day-edit" type="number" min="1" max="31" aria-label="Tag für ${esc(e.label)}" value="${e.d}" ${attrs}></div><button type="button" class="flow-event-name" ${btn}>${esc(e.label)}<small>${esc(e.detail)}</small>${e.transfer?'<small class="account-transfer">Interner Übertrag</small>':''}</button>${inlineAccountCells(e)}<strong class="${e.amount<0?'flow-out':'flow-in'}">${e.amount>0?'+':''}${euro(e.amount)}</strong><strong class="${balances[e.account]<0?'negative':''}">${euro(balances[e.account])}${all?`<small>${esc(accountName(e.account))}</small>`:''}</strong></div>`);
 }
 $('flowEvents').innerHTML=rows.join('')||'<p class="help">Keine Ereignisse im gewählten Monat.</p>';
 $('flowClosing').textContent=euro(all?total:balances[account.id]);$('flowLowest').textContent=euro(all?lowestTotal:minimums[account.id]);
 const overdrawn=state.accounts.filter(a=>minimums[a.id]<0);
 $('flowRequired').textContent=all?('Summen oben: alle Konten inklusive Sparen und Depot; interne Überträge verändern diese Summe nicht. '+(overdrawn.length?'Konten mit negativem Zwischenstand: '+overdrawn.map(a=>accountName(a.id)+' ('+euro(minimums[a.id])+')').join(', ')+'.':'Kein Konto fällt im Monatsverlauf unter null.')):accountName(account.id)+': Mindestens '+euro(Math.max(0,-required))+' Startguthaben für diesen Monat erforderlich.';
 renderPaymentPlan(events);
}
document.addEventListener('change',e=>{
 const el=e.target;if(!el.dataset.inlineRef)return;
 const [i,j]=el.dataset.inlineRef.split(':').map(Number),x=state.groups[i].items[j],field=el.dataset.inlineField;
 if(field==='accountId'&&!el.value)delete x.accountId;else x[field]=el.value;
 renderAssignments();renderCashflow();
});

document.addEventListener('change',e=>{const el=e.target;if(el.dataset.editTransfer){const [i,j]=el.dataset.editTransfer.split(':').map(Number);state.groups[i].items[j].transferDay=day(el.value);renderAssignments();renderCashflow()}});
