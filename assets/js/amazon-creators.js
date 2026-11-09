/* No credentials here: GitHub Actions supplies only fresh official image URLs. */
'use strict';
(async()=>{
  let expiryTimer;
  const inserted=[];
  function removeImages(){
    inserted.forEach(({card,link})=>{link.remove();card.classList.remove('has-amazon-image')});
    inserted.length=0;
  }
  function allowed(url,kind){
    try{
      const u=new URL(url);
      return u.protocol==='https:'&&(kind==='image'?
        /(^|\.)(media-amazon\.com|ssl-images-amazon\.com)$/.test(u.hostname):
        u.hostname==='www.amazon.de');
    }catch{return false}
  }
  try{
    const response=await fetch(new URL('../data/amazon-products.json',document.currentScript?.src||new URL('../assets/js/amazon-creators.js',location.href)),{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json(),expires=Date.parse(data.expiresAt),generated=Date.parse(data.generatedAt),now=Date.now();
    if(!Number.isFinite(expires)||!Number.isFinite(generated)||expires<=now||generated>now+300000||expires-generated>24*3600000)return;
    for(const card of document.querySelectorAll('.favorite-card[data-amazon-product]')){
      const product=data.products?.[card.dataset.amazonProduct];
      if(!product||!allowed(product.imageUrl,'image')||!allowed(product.detailPageUrl,'link'))continue;
      const link=document.createElement('a');link.className='amazon-product-image';
      link.href=product.detailPageUrl;link.target='_blank';link.rel='sponsored noopener noreferrer';
      const title=card.querySelector('h3')?.textContent||'Produkt';
      link.setAttribute('aria-label',title+' bei Amazon ansehen – Werbung');
      const img=document.createElement('img');img.alt=title;img.loading='lazy';img.decoding='async';
      img.width=Number(product.width)||500;img.height=Number(product.height)||500;
      img.addEventListener('error',()=>{link.remove();card.classList.remove('has-amazon-image')},{once:true});
      img.src=product.imageUrl;link.append(img);card.append(link);card.classList.add('has-amazon-image');
      inserted.push({card,link});
    }
    expiryTimer=setTimeout(removeImages,Math.max(0,expires-Date.now()));
    document.addEventListener('visibilitychange',()=>{if(Date.now()>=expires){clearTimeout(expiryTimer);removeImages()}});
  }catch{/* Existing text and affiliate buttons remain usable if the API feed is unavailable. */}
})();
