# python3 loop.py <id> [--map]: measure a route from loops.json (length, corners, twist, elevation, sights to 60-90 m);
# pictures and res_<id>.pkl go to $ZAVITE_CACHE. --map: area map only (entry's "extent").
import sys, json, os, math, pickle
import numpy as np
from tool import load, graph, route, summarize_parts, corners, profile, sights, lonlat, twist
from draw import draw
HERE = os.path.dirname(os.path.abspath(__file__))
from tool import CACHE
city = sys.argv[1]
cfg = json.load(open(os.path.join(HERE, os.environ.get('LOOPS_FILE', 'loops.json')))).get(city, {})
d = load(cfg.get('data', city)); G = graph(d)
if '--map' in sys.argv or not cfg.get('wps'):
    ext = cfg.get('extent')
    if ext:
        (la0, lo0), (la1, lo1) = ext
        x0, y0 = d['xy'](la0, lo0); x1, y1 = d['xy'](la1, lo1)
        extent = (min(x0, x1), max(x0, x1), min(y0, y1), max(y0, y1))
    else: extent = None
    draw(d, os.path.join(CACHE, f'map_{city}.png'), extent=extent, title=city)
    print('map written'); sys.exit()
closed = not cfg.get('open', False)
R = route(d, [tuple(p) for p in cfg['wps']], avoid=[tuple(p) for p in cfg.get('avoid', [])], closed=closed)
L = R['line']
print(f"{city}: length {L.length:.0f} m  ({'krog' if closed else 'od tocke do tocke'})")
for nm, cls, l in summarize_parts(R['parts']): print(f'   {l:5d} m  {cls:12s} {nm}')
nc, nh, cl = corners(L, closed=closed)
print(f'corners {nc} (hairpins {nh})')
tw = twist(L, closed=closed)
print(f'twist {tw[0]:.0f} deg/km, straights {tw[1]*100:.0f} % of length, longest straight {tw[2]:.0f} m')
try:
    h = profile(d, L)
    print(f'elevation {h.min():.0f}-{h.max():.0f} m (diff {h.max()-h.min():.0f} m)')
except Exception as e:
    print('elevation failed', e); h = None
S = sights(d, L, maxd=cfg.get('maxd', 90))
seen = set(); keep = []
for s in S:
    key = (s['name'], s['kind'])
    if not s['name'] or key in seen: continue
    seen.add(key); keep.append(s)
for i, s in enumerate(keep[:120]):
    print(f"  {i+1:3d} {s['dist']:5.1f} m  {s['kind']:8s} {s['name'][:60]:60s} {s['cls'][:70]}")
pickle.dump(dict(line=list(L.coords), parts=R['parts'], length=L.length, corners=(nc, nh), twist=tw, closed=closed, elev=None if h is None else (float(h.min()), float(h.max())),
                 sights=[dict(name=s['name'], kind=s['kind'], cls=s['cls'], dist=s['dist']) for s in keep]), open(os.path.join(CACHE, f'res_{city}.pkl'), 'wb'))
keep_draw = [s for s in keep[:120] if s['g'].representative_point().distance(L) < 1500]
pad = cfg.get('pad', 120)
x0, y0, x1, y1 = L.bounds
try:
    draw(d, os.path.join(CACHE, f'route_{city}.png'), route=R, wps=cfg['wps'], sights=keep_draw, extent=(x0 - pad, x1 + pad, y0 - pad, y1 + pad), title=f'{city} {L.length:.0f} m')

except Exception as e:
    print('draw failed', e)
