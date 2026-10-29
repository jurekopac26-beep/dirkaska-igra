# Mockup only: raw/geo/places.json and raw/geo/geo.json from the game's js/geo.js, when raw/ is new (it is not in git): the tracks placed
# before stay as they are, and geo_places.py, geo_build.py and intro_data.py, given only the new tracks, add them to these.
# Usage: python3 seed_raw.py [site]
import json, math, os, sys
from geo_lib import RAW, HERE, js_read, radii

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..')
G = js_read(SITE, 'geo.js', 'window.GEO')
pp, gp = os.path.join(RAW, 'places.json'), os.path.join(RAW, 'geo.json')
if not os.path.exists(pp):
    src = open(os.path.join(HERE, 'geo_places.py'), encoding='utf-8').read(); i = src.index('L1 = {'); L1 = eval(src[i + 5:src.index('}', i) + 1])   # (its regional boxes)
    T = {}
    for tid, e in G['tracks'].items():
        b2, b3 = e['l2']['box'], e['l3']['box']; cla, clo = (b3[0] + b3[2]) / 2, (b3[1] + b3[3]) / 2; M, N = radii(cla)
        T[tid] = dict({k: e[k] for k in ('kind', 'lat0', 'lon0', 'rot', 'offset', 'start', 'finish')}, center=[round(cla, 6), round(clo, 6)],
                      l3km=round((b3[2] - b3[0]) * math.pi / 180 * M / 1000, 1), l2km=80, l1=e['l1'], open=e['open'], names=e['names'])
    json.dump(dict(tracks=T, l1={k: dict(lat=v[0], lon=v[1], km=v[2]) for k, v in L1.items()}), open(pp, 'w'), indent=1, ensure_ascii=False)
    print('places.json', len(T), 'tracks')
if not os.path.exists(gp):
    json.dump(G, open(gp, 'w')); print('geo.json', list(G))
