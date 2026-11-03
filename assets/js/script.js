const base=document.body.dataset.root||'./';const sections=[['Sparen','sparen/'],['Investieren','investieren/'],['FIRE-Bewegung','fire/'],['Wertekompass','wertekompass/'],['Buchempfehlungen','buchempfehlungen/'],['Rechner','rechner/']];const here=document.body.dataset.page||'';document.querySelector('#site-header').innerHTML=`<header class="site-header"><div class="container header-inner"><a class="brand" href="${base}" aria-label="Finanztaler Startseite"><img src="${base}assets/img/logo.webp" alt="finanztaler"></a><button class="menu-toggle" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="main-nav">☰</button><nav class="main-nav" id="main-nav" aria-label="Hauptnavigation">${sections.map(([label,path])=>`<a href="${base}${path}" ${here===path?'aria-current="page"':''}>${label}</a>`).join('')}</nav></div></header>`;document.querySelector('#site-footer').innerHTML=`<footer class="footer"><div class="container"><div class="footer-inner"><div><div class="footer-title">finanz<span>taler</span></div><p>Finanzen selbst in die Hand nehmen.</p></div><nav class="footer-links" aria-label="Footer"><a href="${base}rechtliches/ueber-uns/">Über uns</a><a href="${base}rechtliches/impressum/">Impressum</a><a href="${base}rechtliches/datenschutz/">Datenschutzerklärung</a><a href="#" id="privacy-settings-link" style="display:none">Datenschutzeinstellungen</a></nav></div><div class="footer-bottom">© ${new Date().getFullYear()} Finanztaler. Alle Rechte vorbehalten. · Keine individuelle Anlageberatung.</div></div></footer>`;const btn=document.querySelector('.menu-toggle'),navEl=document.querySelector('#main-nav');function closeMenu(){navEl.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Menü öffnen');btn.textContent='☰'}btn.addEventListener('click',()=>{const open=navEl.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');btn.textContent=open?'✕':'☰'});navEl.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});


// Google Privacy & Messaging: consent settings and GA4 (Basic Consent Mode).
// The existing AdSense publisher tag is retained so that Google's CMP can appear.
(function(){
  const link = document.getElementById('privacy-settings-link');
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({CONSENT_API_READY: function(){
    if(link){
      link.style.display='';
      link.addEventListener('click',function(event){
        event.preventDefault();
        window.googlefc.callbackQueue.push({CONSENT_API_READY:function(){
          if(typeof window.googlefc.showRevocationMessage==='function') window.googlefc.showRevocationMessage();
        }});
      });
    }
  }});
  window.googlefc.callbackQueue.push({CONSENT_MODE_DATA_READY:function(){
    if(typeof window.googlefc.getGoogleConsentModeValues!=='function')return;
    const consent=window.googlefc.getGoogleConsentModeValues();
    // Only load Analytics when analytics_storage has explicit consent.
    // UNKNOWN, DENIED, NOT_APPLICABLE and NOT_CONFIGURED do not enable tracking.
    if(!consent || consent.analyticsStoragePurposeConsentStatus!==1 || window.ftAnalyticsLoaded)return;
    window.ftAnalyticsLoaded=true;
    const id='G-TYXJ3CPX1T';
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',id);
    const tag=document.createElement('script');tag.async=true;
    tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
    document.head.appendChild(tag);
  }});
})();
