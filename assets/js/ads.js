/* Finanztaler Werbeplätze: Layout vorbereiten, ohne ungefragtes Tracking.
   Publisher-ID: ca-pub-5554850334897452
   Echte Anzeigen erst nach Freigabe, CMP/Consent und Eintrag der Ad-Slot-IDs.
*/
(()=>{
  'use strict';
  const options = { top: true, middle: true, bottom: false };
  const createAd = (position) => {
    const el = document.createElement('aside');
    el.className = `ft-ad ft-ad--${position}`;
    el.setAttribute('aria-label','Werbefläche');
    el.innerHTML = '<div class="ft-ad__label">Werbung</div><div class="ft-ad__space">Anzeigenplatz</div>';
    return el;
  };
  const insert = () => {
    const main = document.querySelector('main');
    if(!main || main.dataset.ftAdsReady === '1') return;
    if(document.body.matches('[data-page="datenschutz"], [data-page="impressum"]') || /(?:^|\/)(?:datenschutz|impressum)\.html$/.test(location.pathname)) return;
    main.dataset.ftAdsReady = '1';
    const sections = [...main.children].filter(el => el.matches('section, article, .container'));
    if(options.top && sections.length) sections[0].after(createAd('top'));
    if(options.middle && sections.length > 2) sections[Math.floor(sections.length/2)].after(createAd('middle'));
    if(options.bottom) main.append(createAd('bottom'));
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',insert);
  else insert();
})();
