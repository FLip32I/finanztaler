/* Finanztaler: 2 manuell platzierte, responsive Anzeigenplätze.
   Publisher: ca-pub-5554850334897452
   Ohne CMP und echte Ad-Slot-IDs werden ausschließlich neutrale Platzhalter angezeigt.
   Um Anzeigen zu aktivieren: zertifizierte CMP integrieren, Ad-Slot-IDs eintragen,
   und window.finanztalerAdsConsent = true nur nach gültiger Einwilligung setzen;
   anschließend window.finanztalerLoadAds() aufrufen.
*/
(()=>{
  'use strict';
  const publisher='ca-pub-5554850334897452';
  const slots={top:'',middle:''}; // Hier die numerischen AdSense-Anzeigenblock-IDs eintragen
  const eligible=()=>!/^\/rechtliches\//.test(location.pathname);
  function create(position){
    const outer=document.createElement('aside');outer.className='ft-ad ft-ad--'+position;
    outer.setAttribute('aria-label','Werbung');outer.dataset.adPosition=position;
    const inner=document.createElement('div');inner.className='ft-ad__inner';
    const label=document.createElement('div');label.className='ft-ad__label';label.textContent='Werbung';
    const space=document.createElement('div');space.className='ft-ad__space';space.textContent='Anzeigenplatz';
    inner.append(label,space);outer.append(inner);return outer;
  }
  function insert(){
    const main=document.querySelector('main');if(!main||!eligible()||main.dataset.ftAdsReady)return;
    main.dataset.ftAdsReady='1';
    const sections=[...main.children].filter(e=>e.matches('section,article'));
    if(!sections.length)return;
    sections[0].after(create('top'));
    if(sections.length>2)sections[Math.floor(sections.length/2)].after(create('middle'));
    else main.append(create('middle'));
  }
  window.finanztalerLoadAds=()=>{
    if(window.finanztalerAdsConsent!==true)return;
    if(!slots.top||!slots.middle)return;
    const ads=[...document.querySelectorAll('.ft-ad')];if(!ads.length)return;
    const script=document.createElement('script');script.async=true;
    script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+publisher;
    script.crossOrigin='anonymous';document.head.append(script);
    ads.forEach(el=>{
      const slot=slots[el.dataset.adPosition];if(!slot)return;
      const space=el.querySelector('.ft-ad__space');space.replaceChildren();
      space.style.cssText='display:block;min-height:0;border:0;background:transparent';
      const ins=document.createElement('ins');ins.className='adsbygoogle';
      ins.style.display='block';ins.dataset.adClient=publisher;ins.dataset.adSlot=slot;
      ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';space.append(ins);
      (window.adsbygoogle=window.adsbygoogle||[]).push({});
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insert);
  else insert();
})();
