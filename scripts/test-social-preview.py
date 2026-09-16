"""Stdlib regression: python scripts/test-social-preview.py [SSR URL ...]."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
import hashlib, re, struct, sys
ROOT = Path(__file__).resolve().parents[1]
class Meta(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags = {}
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'meta': self.tags[d.get('property', d.get('name'))] = d.get('content')
def check(path, data):
    assert re.search(r'-(?:[0-9a-f]{12}|jm-202609-v2)\.png$', path), f'Unversioned image: {path}'
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Expected PNG'
    assert struct.unpack('>II', data[16:24]) == (1200, 630)
    assert data == (ROOT / 'public' / path.lstrip('/')).read_bytes(), 'Artwork bytes differ'
if not sys.argv[1:]:
    src = ROOT / 'src/lib/site.ts'
    if src.exists():
        path = re.search(r"ogImage: '([^']+)'", src.read_text())[1]
    else:
        text = (ROOT / 'app/components/LandingPage.vue').read_text()
        path = re.search(r'const ogImage = `\$\{site\}([^`]+)`', text)[1]
    assert (ROOT / 'public' / path.lstrip('/')).exists(), f'Missing image: {path}'
    check(path, (ROOT / 'public' / path.lstrip('/')).read_bytes())
    print('PASS local versioned artwork', path)
for url in sys.argv[1:]:
    for ua in ['Mozilla/5.0', 'TelegramBot (like TwitterBot)', 'facebookexternalhit/1.1']:
        with urlopen(Request(url, headers={'User-Agent': ua}), timeout=30) as r:
            assert r.status == 200; parser = Meta(); parser.feed(r.read().decode())
        image = parser.tags['og:image']
        assert image == parser.tags['twitter:image'] and image.startswith('https://')
        with urlopen(Request(image, headers={'User-Agent': ua}), timeout=30) as r:
            assert r.status == 200 and r.headers.get_content_type() == 'image/png'; data = r.read()
        check(urlsplit(image).path, data)
        print('PASS SSR', url, ua, image, hashlib.sha256(data).hexdigest())
