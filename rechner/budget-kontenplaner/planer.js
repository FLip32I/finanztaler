'use strict';
const KEY='finanztaler-budget-v2';
const seed=()=>({income:2500,extra:0,groups:[{name:'Wohnen & Grundbedarf',items:[{name:'Miete & Nebenkosten',amount:950,period:'month'},{name:'Lebensmittel',amount:350,period:'month'},{name:'Mobilität',amount:150,period:'month'}]},{name:'Konsum & Freizeit',items:[{name:'Freizeit & Hobbys',amount:150,period:'month'},{name:'Abonnements',amount:30,period:'month'}]},{name:'Sparen & Rücklagen',items:[{name:'Sparrate',amount:400,period:'month'},{name:'Notgroschen',amount:100,period:'month'}]},{name:'Puffer & Sonstiges',items:[{name:'Ungeplante Ausgaben',amount:100,period:'month'}]}]});
let state=seed();let opened=new Set([0]);
const $=id=>document.getElementById(id), euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n), num=v=>Math.max(0,Number(v)||0), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>Math.max(1,Math.min(31,Math.round(Number(v)||1)));
const monthNow=()=>new Date().toISOString().slice(0,7);
const monthly=x=>num(x.amount)/(x.period==='year'?12:1);
function totals(){return state.groups.map(g=>g.items.reduce((a,x)=>a+monthly(x),0))}
function renderGroups(){const totalsNow=totals();$('groups').innerHTML=state.groups.map((g,i)=>`<article class="budget-group"><button class="group-toggle" type="button" data-toggle="${i}" aria-expanded="${opened.has(i)}"><span class="group-icon">${['⌂','◈','€','+'][i]}</span><span class="group-name">${esc(g.name)}<small>${g.items.length} Positionen</small></span><strong>${euro(totalsNow[i])}</strong><span class="chevron">${opened.has(i)?'⌃':'⌄'}</span></button>${opened.has(i)?`<div class="group-body"><div class="row-label"><span>Bezeichnung</span><span>Betrag</span><span>Zeitraum</span><span class="cf-day-label">Tag</span></div>${g.items.map((x,j)=>`<div class="budget-row"><input aria-label="Bezeichnung" data-g="${i}" data-j="${j}" data-field="name" value="${esc(x.name)}"><input aria-label="Betrag in Euro" type="number" min="0" step="0.01" data-g="${i}" data-j="${j}" data-field="amount" value="${x.amount}"><select aria-label="Zeitraum" data-g="${i}" data-j="${j}" data-field="period"><option value="month" ${x.period==='month'?'selected':''}>Monat</option><option value="year" ${x.period==='year'?'selected':''}>Jahr</option></select><input class="cf-day" aria-label="Zahlungstag" type="number" min="1" max="31" data-g="${i}" data-j="${j}" data-field="day" value="${day(x.day||1)}">${x.period==='year'?`<select aria-label="Fälligkeitsmonat" class="due-month" data-g="${i}" data-j="${j}" data-field="dueMonth">${Array.from({length:12},(_,k)=>`<option value="${k+1}" ${Number(x.dueMonth||1)===k+1?'selected':''}>${new Date(2026,k,1).toLocaleDateString('de-DE',{month:'short'})}</option>`).join('')}</select>`:''}<button class="delete-row" data-delete="${i}:${j}" aria-label="Position entfernen">×</button></div>`).join('')}<button class="add" data-add="${i}">+ Position hinzufügen</button></div>`:''}</article>`).join('')}
function renderSummary(){const t=totals(),inc=num(state.income)+num(state.extra)+extraSum(),sum=t.reduce((a,b)=>a+b,0),rest=inc-sum; $('incomeTotal').textContent=euro(inc);$('expenseTotal').textContent=euro(sum);$('remaining').textContent=euro(rest);$('remaining').className=rest<0?'negative':'positive';$('summaryHint').textContent=rest<0?'Dein Budget ist überplant. Passe die Beträge an.':'Noch nicht zugewiesener Betrag – du kannst ihn als Puffer einplanen.';const colors=['#236448','#d5a73c','#91bca0','#9aaab1'];$('distribution').innerHTML=t.map((v,i)=>`<span style="width:${inc?Math.max(0,Math.min(100,v/inc*100)):0}%;background:${colors[i]}"></span>`).join('');$('comparison').innerHTML=[['Grundbedarf',50,t[0]],['Freizeit',30,t[1]],['Sparen',20,t[2]]].map(([label,target,value])=>`<div class="comparison-row"><span>${label}</span><span>${target} %</span><strong>${inc?(value/inc*100).toLocaleString('de-DE',{maximumFractionDigits:1}):'0'} %</strong></div>`).join('');$('accountPlan').innerHTML=[['Girokonto / Grundbedarf',t[0]],['Spaßkonto',t[1]],['Spar- & Rücklagenkonto',t[2]],['Puffer',t[3]]].map(([label,v])=>`<div class="account-row"><span>${label}</span><b>${euro(v)} / Monat</b></div>`).join('')}
function render(){renderGroups();renderSummary();renderExtraIncomes();renderCashflow()}
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
$('csv').onclick=()=>{const rows=[['Kategorie','Position','Betrag','Zeitraum','Monatlich','Zahlungstag','Fälligkeitsmonat']];state.groups.forEach(g=>g.items.forEach(x=>rows.push([g.name,x.name,x.amount,x.period==='year'?'Jährlich':'Monatlich',monthly(x),day(x.day||1),x.period==='year'?(x.dueMonth||1):''])));rows.push(['','Einnahmen',num(state.income)+num(state.extra)+extraSum(),'Monatlich','']);const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='finanztaler-budget.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function sync(){
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
function setCashflowActive(active){cfActive=active;$('cashContent').hidden=!active;document.querySelectorAll('.cf-only').forEach(x=>x.hidden=!active);$('cashToggle').setAttribute('aria-expanded',String(active));$('cashToggle').innerHTML=active?'Cashflowplan ausblenden <span>⌃</span>':'Cashflowplan anzeigen <span>⌄</span>';$('cashOption').checked=active;document.body.classList.toggle('cf-active',active);if(active)renderCashflow()}
$('cashToggle').onclick=()=>setCashflowActive(!cfActive);
$('cashOption').addEventListener('change',e=>setCashflowActive(e.target.checked));
$('addExtraIncome').onclick=()=>{state.extraIncomes.push({name:'Weitere Einnahme',amount:0,day:1});renderExtraIncomes();renderSummary();renderCashflow()};
document.addEventListener('input',e=>{let x=e.target;if(x.dataset.extraIndex===undefined)return;let o=state.extraIncomes[+x.dataset.extraIndex];o[x.dataset.extraField]=x.dataset.extraField==='amount'?num(x.value):x.dataset.extraField==='day'?day(x.value):x.value;renderSummary();renderCashflow()});
document.addEventListener('click',e=>{let b=e.target.closest('[data-remove-extra]');if(!b)return;state.extraIncomes.splice(+b.dataset.removeExtra,1);renderExtraIncomes();renderSummary();renderCashflow()});
$('flowMonth').value=monthNow();
function renderCashflow(){
 const month=($('flowMonth').value||monthNow());const [y,m]=month.split('-').map(Number);
 if(!y||!m)return;
 const last=new Date(y,m,0).getDate();const clamp=v=>Math.min(last,day(v));
 const events=[];
 const salaryDay=day(state.incomeDay||28),priorSalary=salaryDay>=25;
 const prevLast=new Date(y,m-1,0).getDate();
 const previousMonth=new Date(y,m-2,1).toLocaleDateString('de-DE',{month:'short',year:'numeric'});
 if(num(state.income))events.push({d:priorSalary?Math.min(prevLast,salaryDay):clamp(salaryDay),label:priorSalary?'Gehalt aus dem Vormonat':'Gehalt',amount:num(state.income),kind:'income',prior:priorSalary});
 if(num(state.extra))events.push({d:clamp(state.extraDay||1),label:'Weitere regelmäßige Einnahmen',amount:num(state.extra),kind:'extra'});
 state.extraIncomes.forEach((x,k)=>{if(num(x.amount))events.push({d:clamp(x.day||1),label:x.name||'Weitere Einnahme',amount:num(x.amount),kind:'added',k})});
 state.groups.forEach((g,i)=>g.items.forEach((x,j)=>{
  if(x.period==='year'&&Number(x.dueMonth||1)!==m)return;
  if(!num(x.amount))return;
  events.push({d:clamp(x.day||1),label:x.name,amount:-num(x.amount),i,j,group:g.name});
 }));
 events.sort((a,b)=>Number(!!b.prior)-Number(!!a.prior)||a.d-b.d||(b.amount-a.amount));
 let balance=Number($('flowStart').value)||0,lowest=balance;
 $('flowOpening').textContent=euro(balance);
 $('flowEvents').innerHTML=events.map(e=>{balance+=e.amount;lowest=Math.min(lowest,balance);const ref=e.i!==undefined?`data-flow="${e.i}:${e.j}"`:e.k!==undefined?`data-flow-extra="${e.k}"`:`data-flow-income="${e.kind}"`;const dayEdit=`<input class="flow-day-edit" aria-label="Tag für ${esc(e.label)}" type="number" min="1" max="31" value="${e.d}" ${e.i!==undefined?`data-edit-flow="${e.i}:${e.j}"`:e.k!==undefined?`data-edit-extra="${e.k}"`:`data-edit-income="${e.kind}"`}>`;return `<div class="flow-event"><div>${dayEdit}${e.prior?`<small class="flow-month-label">${esc(previousMonth)}</small>`:''}</div><button type="button" class="flow-event-name" ${ref}>${esc(e.label)}<small>${e.group?esc(e.group):e.prior?'Für das Budget dieses Monats':'Einnahme'}</small></button><strong class="${e.amount<0?'flow-out':'flow-in'}">${e.amount>0?'+':''}${euro(e.amount)}</strong><strong class="${balance<0?'negative':''}">${euro(balance)}</strong></div>`}).join('')||'<p class="help">Keine Ereignisse in diesem Monat.</p>';
 $('flowClosing').textContent=euro(balance);$('flowLowest').textContent=euro(lowest);
}
$('flowMonth').addEventListener('change',renderCashflow);
$('flowStart').addEventListener('input',renderCashflow);
$('incomeDay').addEventListener('input',e=>{state.incomeDay=day(e.target.value);renderCashflow()});
document.addEventListener('change',e=>{const x=e.target;if(x.dataset.editFlow){const [i,k]=x.dataset.editFlow.split(':').map(Number);state.groups[i].items[k].day=day(x.value);renderCashflow()}else if(x.dataset.editExtra!==undefined){state.extraIncomes[+x.dataset.editExtra].day=day(x.value);renderCashflow()}else if(x.dataset.editIncome){state[x.dataset.editIncome==='income'?'incomeDay':'extraDay']=day(x.value);if(x.dataset.editIncome==='income')$('incomeDay').value=state.incomeDay;renderCashflow()}});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-flow],[data-flow-income],[data-flow-extra]');if(!btn)return;
 if(btn.dataset.flowExtra!==undefined){document.querySelector(`[data-extra-index="${btn.dataset.flowExtra}"][data-extra-field="name"]`)?.focus();document.querySelector('#eingaben').scrollIntoView({behavior:'smooth'});return;}
 if(btn.dataset.flowIncome){document.querySelector('[data-key="'+(btn.dataset.flowIncome==='income'?'income':'extra')+'"]').focus();document.querySelector('#eingaben').scrollIntoView({behavior:'smooth'});return;}
 const [i,j]=btn.dataset.flow.split(':').map(Number);opened.add(i);renderGroups();const input=document.querySelector(`[data-g="${i}"][data-j="${j}"][data-field="name"]`);if(input){input.scrollIntoView({behavior:'smooth',block:'center'});input.focus()}
});
sync();
setCashflowActive(false);
