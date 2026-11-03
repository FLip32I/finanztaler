/* Small XLSX reader: OOXML ZIP, shared/inline strings and cached numeric values.
   No external services. No evaluation of workbook formulas or macros. */
async function readPortfolioExcel(buffer, expectedNames) {
  const bytes=new Uint8Array(buffer), view=new DataView(buffer), decoder=new TextDecoder();
  if(bytes.length>20*1024*1024) throw Error('Die Excel-Datei darf höchstens 20 MB groß sein.');
  let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--) if(view.getUint32(p,true)===0x06054b50){end=p;break;}
  if(end<0) throw Error('Bitte eine gültige .xlsx-Datei verwenden (kein .xls).');
  const count=view.getUint16(end+10,true), files=new Map();let p=view.getUint32(end+16,true), total=0;
  if(count>3000) throw Error('Die Arbeitsmappe enthält zu viele Dateien.');
  for(let i=0;i<count;i++){
    if(p+46>bytes.length||view.getUint32(p,true)!==0x02014b50)throw Error('Beschädigte Excel-Datei.');
    const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),size=view.getUint32(p+20,true),unpacked=view.getUint32(p+24,true),n=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),offset=view.getUint32(p+42,true);
    const name=decoder.decode(bytes.subarray(p+46,p+46+n));total+=unpacked;
    if(total>80*1024*1024||unpacked>30*1024*1024)throw Error('Die entpackte Arbeitsmappe ist zu groß.');
    files.set(name,{flags,method,size,unpacked,offset});p+=46+n+extra+comment;
  }
  async function xml(name,optional=false){
    const f=files.get(name);if(!f){if(optional)return null;throw Error('Excel-Bestandteil fehlt: '+name);}
    if(f.flags&1)throw Error('Passwortgeschützte Excel-Dateien werden nicht unterstützt.');
    const o=f.offset;if(o+30>bytes.length||view.getUint32(o,true)!==0x04034b50)throw Error('Beschädigter Excel-Bestandteil.');
    const a=o+30+view.getUint16(o+26,true)+view.getUint16(o+28,true);
    if(a+f.size>bytes.length)throw Error('Unvollständige Excel-Datei.');
    let raw=bytes.subarray(a,a+f.size);
    if(f.method===8){
      try{raw=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());}
      catch{throw Error('Excel konnte nicht entpackt werden. Bitte einen aktuellen Chrome-, Edge- oder Firefox-Browser verwenden.');}
    }else if(f.method!==0)throw Error('Nicht unterstützte Excel-Kompression.');
    if(raw.length!==f.unpacked)throw Error('Beschädigte Excel-Daten.');
    const doc=new DOMParser().parseFromString(decoder.decode(raw),'application/xml');
    if(doc.getElementsByTagName('parsererror').length)throw Error('Ungültiges Excel-XML.');return doc;
  }
  const all=(root,name)=>Array.from(root.getElementsByTagNameNS('*',name));
  const workbook=await xml('xl/workbook.xml'), relations=await xml('xl/_rels/workbook.xml.rels');
  const sheet=all(workbook,'sheet').find(s=>s.getAttribute('name')==='Monatsrenditen');
  if(!sheet)throw Error('Das Tabellenblatt „Monatsrenditen“ fehlt. Bitte die Vorlage verwenden.');
  const relId=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  const rel=all(relations,'Relationship').find(r=>r.getAttribute('Id')===relId);
  if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('Ungültiges Datenblatt.');
  const parts=('xl/'+rel.getAttribute('Target')).replace(/^xl\/\//,'/').split('/'),path=[];
  for(const part of parts){if(part==='..')path.pop();else if(part&&part!=='.')path.push(part);}
  const shared=await xml('xl/sharedStrings.xml',true),strings=shared?all(shared,'si').map(s=>all(s,'t').map(t=>t.textContent).join('')):[];
  const doc=await xml(path.join('/'));
  const matrix=all(doc,'row').map(row=>{
    const result=[];
    for(const cell of all(row,'c')){
      const letters=(cell.getAttribute('r')||'').match(/^[A-Z]+/);if(!letters)continue;
      let col=0;for(const c of letters[0])col=col*26+c.charCodeAt(0)-64;col--;
      if(col>100)continue;
      const type=cell.getAttribute('t'),value=all(cell,'v')[0]?.textContent;
      if(type==='e')throw Error('Excel-Fehler in Zelle '+cell.getAttribute('r')+'.');
      if(type==='inlineStr')result[col]=all(cell,'t').map(t=>t.textContent).join('');
      else if(type==='s')result[col]=strings[Number(value)];
      else if(type==='str'||type==='d')result[col]=value;
      else if(value!==undefined&&value!=='')result[col]=Number(value);
      else if(all(cell,'f').length)throw Error('Formel ohne gespeicherten Wert in '+cell.getAttribute('r')+'. In Excel neu berechnen und speichern.');
    }
    return result;
  });
  const parsed=validatePortfolioRows(matrix,expectedNames,all(workbook,'workbookPr')[0]?.getAttribute('date1904')==='1');
  return parsed;
}
function validatePortfolioRows(matrix,names,date1904=false){
  const header=matrix[0]||[];
  if(String(header[0]||'').trim()!=='Datum')throw Error('In A1 muss „Datum“ stehen.');
  const columns=names.map(name=>{
    const matches=header.map((v,i)=>String(v??'').trim()===name?i:-1).filter(i=>i>=0);
    if(matches.length!==1)throw Error('Spalte fehlt oder ist doppelt: '+name);return matches[0];
  });
  const output=[],seen=new Set();
  for(let i=1;i<matrix.length;i++){
    const row=matrix[i];if(!row.some(v=>v!==null&&v!==undefined&&v!==''))continue;
    let raw=row[0],month;
    if(typeof raw==='number'){
      const d=new Date((raw-(date1904?24107:25569))*86400000);month=d.toISOString().slice(0,7);
    }else{
      const text=String(raw??'').trim();const iso=text.match(/^(\d{4})-(\d{2})(?:-\d{2}(?:T.*)?)?$/),de=text.match(/^\d{1,2}\.(\d{1,2})\.(\d{4})$/);
      if(iso)month=iso[1]+'-'+iso[2];else if(de)month=de[2]+'-'+de[1].padStart(2,'0');
    }
    if(!month||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||+month.slice(0,4)<1900||+month.slice(0,4)>2200)throw Error('Ungültiges Datum in Zeile '+(i+1)+'. Erwartet: YYYY-MM.');
    if(seen.has(month))throw Error('Doppelter Monat: '+month);seen.add(month);
    const values=columns.map((col,j)=>{
      let v=row[col];if(v===null||v===undefined||v==='')return null;
      if(typeof v==='string'){
        const text=v.trim();if(!text)return null;
        if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)\s*%?$/.test(text))throw Error('Ungültige Rendite: '+month+', '+names[j]);
        v=Number(text.replace('%','').replace(',','.'))/(text.includes('%')?100:1);
      }
      if(!Number.isFinite(v)||v<=-1)throw Error('Ungültige Rendite: '+month+', '+names[j]+'. Werte müssen größer als −100 % sein.');
      return v;
    });
    if(values.some(v=>v!==null))output.push({month,values});
  }
  return output.sort((a,b)=>a.month.localeCompare(b.month));
}
