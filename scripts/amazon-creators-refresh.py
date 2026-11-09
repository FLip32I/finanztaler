"""Fetch official Creators API image URLs; never download product images or publish tokens."""
import json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[1]
ASIN = re.compile(r'(?:/dp/|/gp/product/|[?&]asin=)([A-Z0-9]{10})(?:[/?&#]|$)', re.I)

def request_json(url, data, headers=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type':'application/json', **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Don't log payloads, credentials or complete authentication responses.
        raise RuntimeError(f'Amazon HTTP {error.code}; Zugang, Berechtigung und API-Limit prüfen.') from None

def asin_from_url(url):
    match = ASIN.search(url)
    return match.group(1).upper() if match else None

def resolve_asin(product):
    if product.get('asin'):
        value = product['asin'].strip().upper()
        if not re.fullmatch(r'[A-Z0-9]{10}', value):
            raise ValueError('Ungültige ASIN für '+product['id'])
        return value
    url = product['link']
    direct = asin_from_url(url)
    if direct:
        return direct
    # The short-link code is NOT an ASIN. Follow the exact existing affiliate link.
    req = urllib.request.Request(url, headers={'User-Agent':'Finanztaler-LinkResolver/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return asin_from_url(response.url)
    except (OSError, ValueError):
        return None

def main():
    client_id = os.environ.get('AMAZON_CREATORS_CLIENT_ID', '')
    secret = os.environ.get('AMAZON_CREATORS_CLIENT_SECRET', '')
    if not client_id or not secret:
        raise RuntimeError('GitHub-Secrets AMAZON_CREATORS_CLIENT_ID und AMAZON_CREATORS_CLIENT_SECRET fehlen.')
    config = json.loads((ROOT/'config/amazon-products.json').read_text())
    products = config['products']
    resolved = []
    for p in products:
        asin = resolve_asin(p)
        if asin:
            resolved.append((p, asin))
        else:
            print('::warning::ASIN für '+p['id']+' nicht auflösbar. Exakte ASIN in config/amazon-products.json ergänzen.')
    if not resolved:
        raise RuntimeError('Keine ASIN auflösbar; Produktkonfiguration prüfen.')
    token = request_json('https://api.amazon.co.uk/auth/o2/token', {
        'grant_type':'client_credentials','client_id':client_id,
        'client_secret':secret,'scope':'creatorsapi::default'
    }).get('access_token')
    if not token:
        raise RuntimeError('Amazon hat keinen Zugriffstoken geliefert.')
    output = {}
    unique = list(dict.fromkeys(asin for _, asin in resolved))
    fetched = {}
    failed = 0
    for start in range(0, len(unique), 10):
        if start:
            time.sleep(1.1)
        data = request_json('https://creatorsapi.amazon/catalog/v1/getItems', {
            'itemIds':unique[start:start+10], 'itemIdType':'ASIN',
            'marketplace':'www.amazon.de','partnerTag':config['partnerTag'],
            'resources':['images.primary.medium','images.primary.large']
        }, {'Authorization':'Bearer '+token,'x-marketplace':'www.amazon.de'})
        for item in data.get('itemsResult', {}).get('items', []):
            fetched[item.get('asin')] = item
        failed += len(data.get('errors', []))
    for product, asin in resolved:
        item = fetched.get(asin, {})
        primary = item.get('images', {}).get('primary', {})
        image = primary.get('large') or primary.get('medium') or {}
        image_url = image.get('url', '')
        detail_url = item.get('detailPageURL', '')
        if not image_url.startswith('https://') or not detail_url.startswith('https://www.amazon.de/'):
            print('::warning::Kein verwendbares API-Bild für '+product['id'])
            continue
        output[product['id']] = {'asin':asin, 'imageUrl':image_url,
            'width':image.get('width', 500),'height':image.get('height', 500),
            'detailPageUrl':detail_url}
    if not output:
        raise RuntimeError('Keine Produktbilder geliefert. ACTIVE allein bestätigt noch keinen erfolgreichen Produktdatenzugriff.')
    now = datetime.now(timezone.utc)
    payload = {'generatedAt':now.isoformat(), 'expiresAt':(now+timedelta(hours=23)).isoformat(), 'products':output}
    path = ROOT/'assets/data/amazon-products.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n')
    print(str(len(output))+' offizielle API-Bildverweise aktualisiert; '+str(failed)+' API-Teilfehler.')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('::error::'+str(error), file=sys.stderr)
        sys.exit(1)
