"""Local-only proof against the built Worker. All records are synthetic QA data.
Start wrangler dev --local on 127.0.0.1:8787 with an empty migrated local D1.
"""
import json
import pathlib
import subprocess
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

BASE = 'http://127.0.0.1:8787'
REPORT = pathlib.Path('.hermes/reviews/ajk-interest-form')
REPORT.mkdir(parents=True, exist_ok=True)
results = []
valid = dict(name='Penguji Tempatan', role='ajk', masjid_name='Masjid Ujian Tempatan', venue_type='masjid', area='Presint 16', state='W.P. Putrajaya', phone='0123456789', email='qa@example.test', needs=['hebahan_program'], consent='on', source='local-proof')

def send(label, payload=None, ip='192.0.2.10', expected=200, accept='application/json', origin: str | None=BASE, content_type='application/json', method='POST'):
    headers = {'Accept': accept, 'CF-Connecting-IP': ip, 'Content-Type': content_type}
    if origin is not None:
        headers['Origin'] = origin
    if isinstance(payload, bytes):
        data = payload
    elif payload is None:
        data = None
    elif content_type == 'application/json':
        data = json.dumps(payload).encode()
    else:
        data = urllib.parse.urlencode(payload, doseq=True).encode()
    req = urllib.request.Request(BASE + '/api/ajk-interest', data=data, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read().decode()
    assert response.status == expected, (label, response.status, body[:300])
    assert response.headers.get('Cache-Control') == 'private, no-store', label
    entry = {'case': label, 'status': response.status, 'cache_control': response.headers.get('Cache-Control')}
    if accept == 'application/json' and body:
        entry['response'] = json.loads(body)
    else:
        entry['html_bytes'] = len(body.encode())
    results.append(entry)
    return body

assert 'phone' not in send('valid JSON', valid)
send('duplicate preserves original', {**valid, 'name': 'Nama Diubah', 'notes': 'Must not be saved'})
send('invalid fields', {**valid, 'phone': 'bad', 'name': ''}, ip='192.0.2.11', expected=422)
send('honeypot pretends success even invalid', {'website': 'https://bot.test', 'name': 'Bot Tempatan'}, ip='192.0.2.12')
for n in range(6):
    send('rate submission ' + str(n + 1), {**valid, 'masjid_name': 'Masjid Rate ' + str(n)}, ip='192.0.2.13', expected=200 if n < 5 else 429)
body = send('native HTML validation retains values', {**valid, 'role': ''}, ip='192.0.2.14', expected=422, accept='text/html', content_type='application/x-www-form-urlencoded')
assert 'value="0123456789"' in body and 'value="qa@example.test"' in body and 'role-error' in body
(REPORT / 'native-error.html').write_text(body)
body = send('native HTML success', {**valid, 'masjid_name': 'Surau Native', 'venue_type': 'surau'}, ip='192.0.2.14', accept='text/html', content_type='application/x-www-form-urlencoded')
assert 'Terima kasih, Penguji Tempatan.' in body and '0123456789' not in body and 'qa@example.test' not in body
send('untrusted origin', valid, origin='https://evil.test', expected=403)
send('missing origin', valid, origin=None, expected=403)
send('body >8KB', b'x' * 8193, expected=413)
send('unsupported type', b'test', content_type='text/plain', expected=415)
send('malformed JSON', b'{', expected=400)
for method in ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']:
    send('method ' + method, method=method, expected=405)
# One IP: 6 concurrent requests must still admit exactly 5.
def concurrent(n):
    req = urllib.request.Request(BASE + '/api/ajk-interest', data=json.dumps({**valid, 'masjid_name': f'Masjid Concurrent {n}'}).encode(), headers={'Origin': BASE, 'Accept': 'application/json', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.15'})
    try:
        with urllib.request.urlopen(req) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code
with ThreadPoolExecutor(max_workers=6) as pool:
    statuses = sorted(pool.map(concurrent, range(6)))
assert statuses == [200] * 5 + [429], statuses
results.append({'case': 'atomic concurrent rate limit', 'statuses': statuses})
# Independent real D1 readback. Only synthetic rows are exposed in this evidence.
command = ['pnpm', 'exec', 'wrangler', 'd1', 'execute', 'jm-web-db', '--local', '--json', '--command', 'SELECT id,created_at,name,role,masjid_name,venue_type,area,state,phone,email,needs,congregation_size,notes,notes IS NULL AS notes_is_null,consent_at,ip_hash,user_agent,source,status FROM ajk_interest ORDER BY created_at']
raw = subprocess.check_output(command, text=True)
rows = json.loads(raw)[0]['results']
assert len(rows) == 12, len(rows)
original = [row for row in rows if row['masjid_name'] == valid['masjid_name']]
assert len(original) == 1 and original[0]['name'] == valid['name'] and original[0]['notes_is_null'] == 1
assert all(row['name'] != 'Bot Tempatan' and len(row['ip_hash']) == 64 and row['status'] == 'new' for row in rows)
(REPORT / 'worker-proof.json').write_text(json.dumps({'synthetic_data_only': True, 'cases': results, 'rows': rows}, indent=2) + '\n')
print(json.dumps({'cases': len(results), 'rows': len(rows), 'statuses': statuses, 'result': 'PASS'}, indent=2))
