# Aguascalientes, Mehika: the infield's roads off the lap (the road course's other loops and the oval's piece the lap leaves), from OSM.
#   python3 -I tools/proga-podatki.py tools/aguascalientes/config.json <raw>   (the OSM extract: <raw>/aguascalientes-osm.json)
#   python3 -I tools/aguascalientes/pads.py <raw>   -> tools/aguascalientes/pads.json, then python3 -I tools/aguascalientes/build.py
# Each OSM raceway way of the road course is cut into the pieces whose every 3 m sample lies more than 4 m from the lap's line (the parts the
# lap does not drive); the pit road's chord (w184905704) is left out (the game's level pits are there). The data's frame (before build.py's
# shift to the finish line), with the two mouths of the service road's tunnel under the back stretch (w184905700, layer -1: its first and last
# node). OSM: (c) OpenStreetMap contributors, ODbL 1.0.
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OVAL = '184905703'; WAYS = [OVAL] + ['6773613%02d' % i for i in range(3, 11)]
d = json.load(open(os.path.join(sys.argv[1], 'aguascalientes-osm.json'))); W = d['ways']; N = d['nodes']
A = json.load(open(os.path.join(HERE, 'aguascalientes.json')))
lat0, lon0 = A['lat0'], A['lon0']; a = 6378137.0; e2 = 0.00669437999014
s = math.sin(math.radians(lat0)); M = a * (1 - e2) / (1 - e2 * s * s) ** 1.5; Nn = a / math.sqrt(1 - e2 * s * s); c = math.cos(math.radians(lat0))
P = lambda nid: (math.radians(N[nid][1] - lon0) * Nn * c, -math.radians(N[nid][0] - lat0) * M)
l = A['line']; L = [(l[i], l[i + 1]) for i in range(0, len(l), 2)]
def dl(x, z):
    best = 1e9
    for i in range(len(L)):
        ax, az = L[i]; bx, bz = L[(i + 1) % len(L)]; ux, uz = bx - ax, bz - az; l2 = ux * ux + uz * uz or 1
        t = max(0, min(1, ((x - ax) * ux + (z - az) * uz) / l2)); best = min(best, math.hypot(x - ax - t * ux, z - az - t * uz))
    return best
out = []
for wid in WAYS:
    nds = W[wid][0]; cur = []
    for k in range(len(nds) - 1):
        p, q = P(nds[k]), P(nds[k + 1]); n = max(2, int(math.hypot(q[0] - p[0], q[1] - p[1]) / 3))
        if all(dl(p[0] + (q[0] - p[0]) * t / n, p[1] + (q[1] - p[1]) * t / n) < 4 for t in range(n + 1)):
            if len(cur) > 1: out.append((wid, cur))
            cur = []
        else:
            if not cur: cur = [p]
            cur.append(q)
    if len(cur) > 1: out.append((wid, cur))
tn = W['184905700'][0]
json.dump({'pads': [[1 if wid == OVAL else 0, [round(v, 1) for p in pl for v in p]] for wid, pl in out],
           'tunnel': [round(v, 1) for nid in (tn[0], tn[-1]) for v in P(nid)]}, open(os.path.join(HERE, 'pads.json'), 'w'), separators=(',', ':'))
for wid, pl in out: print(wid, len(pl), round(sum(math.hypot(pl[i + 1][0] - pl[i][0], pl[i + 1][1] - pl[i][1]) for i in range(len(pl) - 1))), 'm')
