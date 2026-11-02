# Download the OpenStreetMap data round the Hakone lap (lib.BOX) from the OSM API (api/0.6/map; overpass-api.de is blocked here) in
# 0.02 x 0.02 degree chunks; a chunk with too many nodes (HTTP 400, over 50,000) is split in four. -> HAKONE_CACHE/osm/*.xml
# Usage: python3 -I tools/hakone/osm.py
import os, sys, time, urllib.request, urllib.error
sys.dont_write_bytecode = True   # (no __pycache__ in the repository)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BOX, CACHE

out = os.path.join(CACHE, 'osm'); os.makedirs(out, exist_ok=True)
UA = {'User-Agent': 'dirkaska-igra track data (one-off, a few dozen requests)'}

def get(a0, b0, a1, b1, depth=0):
    name = os.path.join(out, '%.5f_%.5f_%.5f_%.5f.xml' % (a0, b0, a1, b1))
    if os.path.exists(name) and os.path.getsize(name) > 200: return
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.5f,%.5f,%.5f,%.5f' % (b0, a0, b1, a1)
    for t in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r: data = r.read()
            open(name + '.part', 'wb').write(data); os.replace(name + '.part', name)
            print('ok', depth, '%.4f %.4f %.4f %.4f' % (a0, b0, a1, b1), len(data), flush=True); return
        except urllib.error.HTTPError as e:
            if e.code == 400 and depth < 7:   # (too many nodes: four smaller boxes)
                ma, mb = (a0 + a1) / 2, (b0 + b1) / 2
                for (p0, q0, p1, q1) in [(a0, b0, ma, mb), (a0, mb, ma, b1), (ma, b0, a1, mb), (ma, mb, a1, b1)]: get(p0, q0, p1, q1, depth + 1)
                return
            print('http', e.code, url, flush=True); time.sleep(2 ** t * 4)
        except Exception as e:
            print('err', e, url, flush=True); time.sleep(2 ** t * 4)
    raise SystemExit('FAILED ' + url)

la0, lo0, la1, lo1 = BOX; step = 0.02; a = la0
while a < la1 - 1e-9:
    b = lo0
    while b < lo1 - 1e-9: get(a, b, min(la1, a + step), min(lo1, b + step)); b += step
    a += step
# Lake Ashi whole (its west shore lies outside the box): the relation with all its ways and nodes
for rid in (10349338,):
    name = os.path.join(out, 'rel_%d.xml' % rid)
    if not os.path.exists(name):
        with urllib.request.urlopen(urllib.request.Request('https://api.openstreetmap.org/api/0.6/relation/%d/full' % rid, headers=UA), timeout=180) as r: open(name, 'wb').write(r.read())
        print('ok relation', rid, flush=True)
print('done:', len(os.listdir(out)), 'files in', out)
