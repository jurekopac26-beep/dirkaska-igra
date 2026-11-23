# Ella, Šrilanka: the lanes by the road from OpenStreetMap (the side streets, the driveways, the tracks, the footpaths, the steps, the footbridge)
# and the zebra crossing, for js/world-ella.js to draw on the ground: scenery only (not the road: the cars do not drive on them, the barrier and
# the verge stay as they are).
#   python3 -I tools/ella/obcestje.py OSM [--dry]   -> »ways« and »crossings« in js/tracks/ella.js, between »obcestje (tools/ella/obcestje.py)«
#                                                    and »konec obcestja« (after build.py's block; the block is added there the first time)
# OSM: the API's map call for the track's box (config.json box), saved as an .osm file:
#   https://api.openstreetmap.org/api/0.6/map?bbox=81.032,6.84,81.074,6.885   (© OpenStreetMap contributors, ODbL)
# Only the geometry and the tags highway, service, bridge, surface, tracktype and width are read; no names.
# ways: [kind, surface, width in dm, x0, z0, x1, z1, ...] in the game's frame (metres, the start line at 0, 0), the parts of each way between the
#   game's asphalt edge (the centre line + HW) and RMAX m from it (none beyond the line's ends), simplified to 0.25 m; a part that comes from
#   the road starts at its edge.
#   kind: 0 a street (residential, unclassified, ... and the road to Passara), 1 a service road or driveway, 2 a track, 3 a footpath, 4 steps,
#   5 a footbridge; surface: 0 asphalt, 1 concrete, 2 paving stones, 3 gravel or compacted, 4 earth (the laterite); untagged: the streets
#   asphalt, the service roads and the steps concrete, the tracks and the paths earth.
# crossings: [x, z] the zebra crossings on the road (the nodes highway=crossing, crossing=zebra / marked / crossing_ref=zebra within 6 m).
import json, math, os, re, sys
import xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'ella.json')))
TRACK = os.path.join(ROOT, 'js', 'tracks', 'ella.js')
HW = 4.5       # the game's half width of the road (def.halfWidth): a way's part closer to the centre line is under the asphalt
RMAX = 70.0    # the farthest a way is kept from the asphalt's edge, m
TOL = 0.25     # the simplification's tolerance, m
MINL = 3.0     # the shortest part kept, m
NEAR = 40.0    # ... and a part is kept only if it comes this close to the asphalt's edge somewhere (not the far bits in the forest)
ENDS = 30      # nothing beyond the ends of the game's line or in its last 15 m (its 0.5 m samples): the road ends there

KIND = {'primary': 0, 'secondary': 0, 'tertiary': 0, 'unclassified': 0, 'residential': 0, 'living_street': 0, 'service': 1, 'track': 2,
        'footway': 3, 'path': 3, 'pedestrian': 3, 'cycleway': 3, 'bridleway': 3, 'steps': 4}
WDEF = {'primary': 7.0, 'secondary': 6.5, 'tertiary': 6.0, 'unclassified': 5.0, 'residential': 4.5, 'living_street': 4.0, 'service': 3.5,
        'track': 3.0, 'footway': 1.5, 'path': 1.2, 'pedestrian': 3.0, 'cycleway': 1.5, 'bridleway': 1.5, 'steps': 1.5}
SURF = {'asphalt': 0, 'paved': 0, 'chipseal': 0, 'concrete': 1, 'concrete:plates': 1, 'concrete:lanes': 1, 'paving_stones': 2, 'sett': 2,
        'cobblestone': 2, 'unhewn_cobblestone': 2, 'bricks': 2, 'gravel': 3, 'fine_gravel': 3, 'compacted': 3, 'pebblestone': 3, 'dirt': 4,
        'earth': 4, 'ground': 4, 'mud': 4, 'sand': 4, 'unpaved': 4, 'grass': 4}
SDEF = [0, 1, 4, 4, 1, 3]   # the surface when untagged, by kind (a footbridge: its deck)

def log(*a): print(*a, flush=True)

# ---- the frame of ella.json (tools/proga-podatki.py Frame: metres, origin its first route point, x east, z south, WGS84 radii at lat0), and
#      the game's (js/tracks/ella.js points: the same, shifted to the start line) ----
A, E2 = 6378137.0, 6.69437999014e-3
s0 = math.sin(math.radians(J['lat0'])); w0 = 1 - E2 * s0 * s0
RM, RN = A * (1 - E2) / w0 ** 1.5, A / math.sqrt(w0); CL = math.cos(math.radians(J['lat0']))
SRC = open(TRACK, encoding='utf-8').read()
P = np.array(json.loads(re.search(r'\n\s*points:\s*(\[\[.*?\]\])\s*,\s*\n', SRC, re.S).group(1)), float)
OFF = np.array(J['line'][:2], float) - P[0]
def game(lat, lon): return np.array([math.radians(lon - J['lon0']) * RN * CL, -math.radians(lat - J['lat0']) * RM]) - OFF
D = np.concatenate([np.linspace(P[i], P[i + 1], max(2, int(math.ceil(np.hypot(*(P[i + 1] - P[i])) / 0.5)) + 1)) for i in range(len(P) - 1)])
LO, HI = D.min(0) - RMAX - HW - 10, D.max(0) + RMAX + HW + 10

def dist(Q, idx=False):   # the distance of each point to the game's centre line (and the nearest of its 0.5 m samples)
    Q = np.atleast_2d(np.asarray(Q, float)); out = np.empty(len(Q)); ix = np.empty(len(Q), int)
    for a in range(0, len(Q), 256):
        q = Q[a:a + 256]; m = (np.abs(D[None, :, 0] - q[:, None, 0]) < RMAX + 20) & (np.abs(D[None, :, 1] - q[:, None, 1]) < RMAX + 20)
        d2 = ((q[:, None, :] - D[None, :, :]) ** 2).sum(-1); d2[~m] = 1e12; k = d2.argmin(1); out[a:a + 256] = np.sqrt(d2[np.arange(len(q)), k]); ix[a:a + 256] = k
    return (out, ix) if idx else out

def rdp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; ab = b - a; l = np.hypot(*ab)
    v = pts - a; d = np.abs(ab[0] * v[:, 1] - ab[1] * v[:, 0]) / l if l > 1e-9 else np.hypot(v[:, 0], v[:, 1])
    k = int(np.argmax(d))
    if d[k] <= tol: return np.array([a, b])
    return np.concatenate([rdp(pts[:k + 1], tol)[:-1], rdp(pts[k:], tol)])

def parts(Q):   # the way's parts between the asphalt's edge and RMAX m from it (1 m samples, the crossings of the edge found to 1 cm)
    S = [Q[0]]
    for i in range(len(Q) - 1):
        n = max(1, int(math.ceil(np.hypot(*(Q[i + 1] - Q[i])))))
        S += [Q[i] + (Q[i + 1] - Q[i]) * (k / n) for k in range(1, n + 1)]
    S = np.array(S); d, ix = dist(S, True); ok = (d >= HW) & (d <= HW + RMAX) & (ix >= ENDS) & (ix < len(D) - ENDS); out, cur = [], []
    def edge(a, b):   # a inside, b outside (or the other way): the point on the edge between them
        lo, hi = 0.0, 1.0; ia = dist([a])[0] < HW
        for _ in range(12):
            m = (lo + hi) / 2
            if (dist([a + (b - a) * m])[0] < HW) == ia: lo = m
            else: hi = m
        return a + (b - a) * hi
    for k in range(len(S)):
        if ok[k]:
            if not cur and k > 0 and d[k - 1] < HW: cur.append(edge(S[k - 1], S[k]))
            cur.append(S[k])
        else:
            if cur and d[k] < HW: cur.append(edge(S[k - 1], S[k]))
            if cur: out.append(np.array(cur)); cur = []
    if cur: out.append(np.array(cur))
    return [p for p in out if np.hypot(*np.diff(p, axis=0).T).sum() >= MINL and dist(p).min() <= HW + NEAR]

def width(tg, hw):
    m = re.match(r'\s*([0-9]+(?:\.[0-9]+)?)', tg.get('width', ''))
    return float(m.group(1)) if m and 0.5 <= float(m.group(1)) <= 12 else WDEF[hw]

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a: sys.exit('python3 -I tools/ella/obcestje.py OSM [--dry]')
    root = ET.parse(a[0]).getroot()
    N = {n.get('id'): (float(n.get('lat')), float(n.get('lon')), {t.get('k'): t.get('v') for t in n.iter('tag')}) for n in root.iter('node')}
    ways, cnt = [], {}
    for w in root.iter('way'):
        tg = {t.get('k'): t.get('v') for t in w.iter('tag')}; hw = tg.get('highway')
        if hw not in KIND or tg.get('area') == 'yes': continue
        Q = np.array([game(N[r][0], N[r][1]) for r in (x.get('ref') for x in w.iter('nd')) if r in N])
        if len(Q) < 2 or (Q.max(0) < LO).any() or (Q.min(0) > HI).any(): continue
        kind = KIND[hw]
        if kind == 3 and tg.get('bridge') not in (None, 'no'): kind = 5
        surf = SURF.get(tg.get('surface', ''), 1 if tg.get('tracktype') == 'grade1' else SDEF[kind])
        wd = width(tg, hw)
        if hw == 'service' and tg.get('service') == 'driveway' and 'width' not in tg: wd = 3.0
        if kind == 5 and 'width' not in tg: wd = 1.6
        for p in parts(Q):
            p = rdp(p, TOL); ways.append([kind, surf, int(round(wd * 10))] + [round(float(v), 1) for v in p.ravel()])
            cnt[kind] = cnt.get(kind, 0) + 1
    cr = []
    for lat, lon, tg in N.values():
        if tg.get('highway') == 'crossing' and (tg.get('crossing') in ('zebra', 'marked', 'uncontrolled') or tg.get('crossing_ref') == 'zebra'):
            q = game(lat, lon)
            if dist([q])[0] <= 6: cr.append([round(float(q[0]), 1), round(float(q[1]), 1)])
    ways.sort(key=lambda r: (r[0], r[3], r[4]))
    log('ways: %d parts (%s), %d points; crossings: %d' % (len(ways), ', '.join('kind %d: %d' % kv for kv in sorted(cnt.items())),
        sum((len(r) - 3) // 2 for r in ways), len(cr)))
    blk = ('    // ---- obcestje (tools/ella/obcestje.py) ----\n    ways: %s,\n    crossings: %s,\n    // ---- konec obcestja ----\n'
           % (json.dumps(ways, separators=(',', ':')), json.dumps(cr, separators=(',', ':'))))
    if '--dry' in sys.argv: return
    A0, B0 = '    // ---- obcestje (tools/ella/obcestje.py) ----\n', '    // ---- konec obcestja ----\n'
    if A0 in SRC: i = SRC.index(A0); j = SRC.index(B0, i) + len(B0); out = SRC[:i] + blk + SRC[j:]
    else: k = SRC.index('    // ---- konec podatkov ----\n') + len('    // ---- konec podatkov ----\n'); out = SRC[:k] + blk + SRC[k:]
    open(TRACK, 'w', encoding='utf-8').write(out); log('-> js/tracks/ella.js')

if __name__ == '__main__': main()
