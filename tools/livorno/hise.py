# Livorno, Italija: what the houses by the road need beyond their bounding rectangles (the prototype of docs/hise-ob-cesti.md, index.html?hise=3).
#   python3 -I tools/livorno/hise.py [the folder of OSM tiles]   -> tools/livorno/hise.json (tools/livorno/build.py world puts it into LV_DATA.hise)
# From tools/livorno/livorno.json (tools/proga-podatki.py): the buildings' outlines cut into rectangular wings, which walls stand against a
# neighbour (a row of houses, a wing against its house), the roads and paths between the houses. With the folder of OSM tiles
# (api.openstreetmap.org/api/0.6/map?bbox=..., the *.osm files along the route; outside the repository) also what the track data does not hold:
# the roofs' shapes and the floors where OSM has them, where the road has a sidewalk, the swimming pools. Without the folder that part is kept
# as it is in hise.json. Data: (c) OpenStreetMap contributors, ODbL 1.0 (the derived data under the ODbL 1.0).
import collections, json, math, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'livorno.json')))
OUT = os.path.join(HERE, 'hise.json')
B = J['bld']; STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); NP = len(LINE)

def r1(v): return round(float(v), 1)
def r2(v): return round(float(v), 2)

# ---- a building's frame: world = centre + (lx * c - lz * s, lx * s + lz * c) ----
def to_local(b, pts):
    c, s = math.cos(b[4]), math.sin(b[4]); p = np.asarray(pts, float).reshape(-1, 2) - [b[0], b[1]]
    return np.stack([p[:, 0] * c + p[:, 1] * s, -p[:, 0] * s + p[:, 1] * c], 1)
def to_world(b, lx, lz):
    c, s = math.cos(b[4]), math.sin(b[4]); return b[0] + lx * c - lz * s, b[1] + lx * s + lz * c

def in_poly(poly, X, Z):
    n = len(poly); inside = np.zeros(X.shape, bool)
    for k in range(n):
        x0, z0 = poly[k]; x1, z1 = poly[(k + 1) % n]
        if z0 == z1: continue
        cond = ((z0 > Z) != (z1 > Z)) & (X < (x1 - x0) * (Z - z0) / (z1 - z0) + x0)
        inside ^= cond
    return inside

def largest_rect(m):
    """the largest rectangle of ones in a boolean matrix -> (area, i0, j0, i1, j1), columns i0..i1-1 and rows j0..j1-1"""
    nz, nx = m.shape; h = np.zeros(nx, int); best = (0, 0, 0, 0, 0)
    for j in range(nz):
        h = np.where(m[j], h + 1, 0); st = []
        for i in range(nx + 1):
            cur = h[i] if i < nx else 0; start = i
            while st and st[-1][1] >= cur:
                s0, hh = st.pop(); a = hh * (i - s0)
                if a > best[0]: best = (a, s0, j - hh + 1, i, j + 1)
                start = s0
            st.append((start, cur))
    return best

# ---- the wings of a building with an outline: the largest rectangles (in its own frame) that cover it, the largest first ----
def wings(b, outline):
    L, W = b[2], b[3]; poly = to_local(b, outline)
    if len(poly) > 1 and np.allclose(poly[0], poly[-1]): poly = poly[:-1]
    cell = 0.25 if max(L, W) < 40 else 0.5; nx = max(1, int(math.ceil(L / cell))); nz = max(1, int(math.ceil(W / cell)))
    X, Z = np.meshgrid((np.arange(nx) + 0.5) * cell - L / 2, (np.arange(nz) + 0.5) * cell - W / 2)
    m = in_poly(poly, X, Z); a0 = m.sum() * cell * cell; out = []
    xs = sorted(set(round(float(v), 2) for v in poly[:, 0])); zs = sorted(set(round(float(v), 2) for v in poly[:, 1]))
    snap = lambda v, cs: min(cs, key=lambda c: abs(c - v)) if cs and min(abs(c - v) for c in cs) < 0.4 else v
    while len(out) < 5:
        a, i0, j0, i1, j1 = largest_rect(m)
        w, d = (i1 - i0) * cell, (j1 - j0) * cell
        if min(w, d) < 2.0 or w * d < max(7.0, 0.05 * a0): break
        m[j0:j1, i0:i1] = False
        xa, xb = snap(i0 * cell - L / 2, xs), snap(i1 * cell - L / 2, xs); za, zb = snap(j0 * cell - W / 2, zs), snap(j1 * cell - W / 2, zs)
        out.append([(xa + xb) / 2, (za + zb) / 2, xb - xa, zb - za])
    cov = sum(w[2] * w[3] for w in out) / max(a0, 1e-6)
    return out, cov

# ---- every building as its rectangles in the world: [index of the building, wing, cx, cz, L, W, angle] ----
OUTL = {o[0]: o[1] for o in J['bldOutline']}
WINGS = {}; covs = []
for i, o in OUTL.items():
    w, cov = wings(B[i], o)
    if len(w) >= 2: WINGS[i] = w; covs.append(cov)
RECTS = []
for i, b in enumerate(B):
    if i in WINGS:
        for k, (lx, lz, wl, ww) in enumerate(WINGS[i]): x, z = to_world(b, lx, lz); RECTS.append([i, k, x, z, wl, ww, b[4]])
    else: RECTS.append([i, -1, b[0], b[1], b[2], b[3], b[4]])
CELL = 24; GRID = collections.defaultdict(list)
for n, r in enumerate(RECTS):
    rad = math.hypot(r[4], r[5]) / 2 + 1
    for a in range(int(math.floor((r[2] - rad) / CELL)), int(math.floor((r[2] + rad) / CELL)) + 1):
        for c in range(int(math.floor((r[3] - rad) / CELL)), int(math.floor((r[3] + rad) / CELL)) + 1): GRID[(a, c)].append(n)
def inside(r, x, z, pad):
    c, s = math.cos(r[6]), math.sin(r[6]); dx, dz = x - r[2], z - r[3]
    return abs(dx * c + dz * s) < r[4] / 2 + pad and abs(-dx * s + dz * c) < r[5] / 2 + pad

# ---- which walls stand against another building (1: a row of houses) or another wing of the same one (2); how far a wing's roof may run on
#      into its house behind that wall (half the depth of the wing it meets) ----
SIDES = [(-1, 0), (1, 0), (0, -1), (0, 1)]   # -x, +x, -z, +z in the rectangle's own frame
def attach(n):
    r = RECTS[n]; c, s = math.cos(r[6]), math.sin(r[6]); att = []; ext = []
    for sx, sz in SIDES:
        half = r[4] / 2 if sx else r[5] / 2; along = r[5] if sx else r[4]; hit1 = hit2 = 0; depth = 0.0
        for t in (0.1, 0.3, 0.5, 0.7, 0.9):
            lx = sx * (half + 0.4) + (0 if sx else (t - 0.5) * along); lz = sz * (half + 0.4) + ((t - 0.5) * along if sx else 0)
            x, z = r[2] + lx * c - lz * s, r[3] + lx * s + lz * c; own = other = None
            for m in GRID.get((int(math.floor(x / CELL)), int(math.floor(z / CELL))), ()):
                q = RECTS[m]
                if m == n or not inside(q, x, z, 0.2): continue
                if q[0] == r[0]: own = q
                else: other = q
            if own is not None:
                hit2 += 1; qc, qs = math.cos(own[6]), math.sin(own[6]); wx, wz = sx * c - sz * s, sx * s + sz * c   # (the wall's normal in the world)
                depth = max(depth, own[4] if abs(wx * qc + wz * qs) > 0.7 else own[5])
            elif other is not None: hit1 += 1
        att.append(2 if hit2 >= 2 else 1 if hit1 >= 2 else 0); ext.append(r1(depth / 2) if hit2 >= 2 else 0)
    return att, ext
ATT = {}; EXT = {}
for n in range(len(RECTS)): ATT[n], EXT[n] = attach(n)
att_plain = [0] * len(B); wings_out = []
byb = collections.defaultdict(list)
for n, r in enumerate(RECTS): byb[r[0]].append(n)
for i in range(len(B)):
    ns = byb[i]
    if i in WINGS:
        ws = []
        for n, (lx, lz, wl, ww) in zip(ns, WINGS[i]): ws.append([r1(lx), r1(lz), r1(wl), r1(ww), ATT[n][0] + 3 * ATT[n][1] + 9 * ATT[n][2] + 27 * ATT[n][3]] + EXT[n])
        wings_out.append([i, ws])
    else: a = ATT[ns[0]]; att_plain[i] = (a[0] > 0) + 2 * (a[1] > 0) + 4 * (a[2] > 0) + 8 * (a[3] > 0)

# ---- the roads and paths between the houses (livorno.json's roads: within 60 m of the route): [class, width, [x, z, ...]]; class 0 asphalt,
#      1 paving, 2 gravel or earth ----
from scipy.spatial import cKDTree
KD = cKDTree(LINE)
WID = {'secondary': 6, 'tertiary': 6, 'residential': 5, 'unclassified': 5, 'living_street': 5, 'service': 3, 'pedestrian': 4, 'footway': 1.8, 'cycleway': 2.4, 'path': 1.2,
       'track': 2.4, 'steps': 1.6}
SURF = {'asphalt': 0, 'concrete': 0, 'paved': 0, 'paving_stones': 1, 'sett': 1, 'cobblestone': 1, 'concrete:plates': 1, 'fine_gravel': 2, 'gravel': 2, 'unpaved': 2, 'ground': 2,
        'dirt': 2, 'compacted': 2, 'earth': 2, 'sand': 2, 'grass': 2}
def simplify(p, tol):
    if len(p) < 3: return p
    a, b = p[0], p[-1]; d = b - a; l = np.hypot(*d)
    dist = np.abs((p[:, 0] - a[0]) * d[1] - (p[:, 1] - a[1]) * d[0]) / l if l > 1e-6 else np.hypot(p[:, 0] - a[0], p[:, 1] - a[1])
    k = int(dist.argmax())
    if dist[k] < tol: return np.array([a, b])
    return np.vstack([simplify(p[:k + 1], tol)[:-1], simplify(p[k:], tol)])
roads_out = []
for hw, lanes, width, bt, layer, surf, name, par, fl in J['roads']:
    if hw not in WID or bt or layer: continue
    p = np.array(fl, float).reshape(-1, 2); d, _ = KD.query(p); keep = d < 72
    cls = SURF.get(surf, 2 if hw in ('path', 'track') else 1 if hw in ('footway', 'pedestrian', 'steps') else 0)
    try: w = float(width) if width else WID[hw]
    except ValueError: w = WID[hw]
    w = min(max(w, 1.0), 8.0); k = 0
    while k < len(p):   # (the runs of points near the route)
        if not keep[k]: k += 1; continue
        m = k
        while m < len(p) and keep[m]: m += 1
        if m - k >= 2:
            q = simplify(p[k:m], 0.25)
            if np.hypot(*(q[1:] - q[:-1]).T).sum() > 3: roads_out.append([cls, r1(w), [r1(v) for v in q.ravel()]])
        k = m

# ---- from the OSM tiles: the roofs' shapes and the floors, where the road has a sidewalk, the swimming pools ----
def osm_part(folder):
    import xml.etree.ElementTree as ET
    A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F); la0 = math.radians(J['lat0']); w_ = 1 - E2 * math.sin(la0) ** 2
    M, N = A * (1 - E2) / w_ ** 1.5, A / math.sqrt(w_); cl = math.cos(la0)
    xz = lambda lat, lon: (math.radians(lon - J['lon0']) * N * cl, -math.radians(lat - J['lat0']) * M)
    nodes, ways = {}, {}
    for f in sorted(os.listdir(folder)):
        if not f.endswith('.osm'): continue
        for ev, el in ET.iterparse(os.path.join(folder, f), events=('end',)):
            if el.tag == 'node': nodes[el.get('id')] = xz(float(el.get('lat')), float(el.get('lon'))); el.clear()
            elif el.tag == 'way': ways[el.get('id')] = ([nd.get('ref') for nd in el.findall('nd')], {q.get('k'): q.get('v') for q in el.findall('tag')}); el.clear()
    BK = cKDTree(np.array([[b[0], b[1]] for b in B]))
    roof, levels, pools = {}, {}, []
    SH = {'gabled': 1, 'hipped': 2, 'flat': 3, 'pyramidal': 4, 'half-hipped': 2, 'skillion': 3}
    # the track's tangent and its right-hand normal (x east, z south) at each point of the line
    T = LINE[(np.arange(NP) + 1) % NP] - LINE[np.arange(NP) - 1]; T /= np.hypot(*T.T)[:, None]; NR = np.stack([-T[:, 1], T[:, 0]], 1)
    walk = np.zeros((2, NP), bool)
    def mark(p, sides=None, maxd=14.0, par=0.8):
        for k in range(len(p) - 1):
            a, b = p[k], p[k + 1]; l = np.hypot(*(b - a))
            if l < 0.2: continue
            dv = (b - a) / l
            for t in np.arange(0, l, 2.0):
                q = a + dv * t; dd, i = KD.query(q)
                if dd > maxd: continue
                cs = float(dv @ T[i])
                if abs(cs) < par: continue
                lat = float((q - LINE[i]) @ NR[i])
                if sides is None:
                    if abs(lat) >= 2: walk[1 if lat > 0 else 0, i] = True
                elif abs(lat) <= 6:
                    for sd in sides: walk[1 if (sd if cs > 0 else -sd) > 0 else 0, i] = True
    for refs, t in ways.values():
        if not t: continue
        p = np.array([nodes[r] for r in refs if r in nodes], float)
        if len(p) < 2: continue
        hw = t.get('highway')
        if 'building' in t and refs[0] == refs[-1] and len(p) >= 4:
            c = p[:-1].mean(0); d, i = BK.query(c); b = B[i]
            if d < max(3.0, 0.35 * min(b[2], b[3])):
                if t.get('roof:shape') in SH: roof[i] = SH[t['roof:shape']]
                try: levels[i] = max(1, min(9, int(float(t['building:levels']))))
                except (KeyError, ValueError): pass
        elif t.get('leisure') == 'swimming_pool' and refs[0] == refs[-1] and len(p) >= 4:
            q = p[:-1]; c = q.mean(0); d, _ = KD.query(c)
            if d < 62:
                u, s_, vt = np.linalg.svd(q - c); ax = vt[0]; l = (q - c) @ ax; w = (q - c) @ np.array([-ax[1], ax[0]])
                pools.append([r1(c[0] + ax[0] * (l.max() + l.min()) / 2 - ax[1] * (w.max() + w.min()) / 2), r1(c[1] + ax[1] * (l.max() + l.min()) / 2 + ax[0] * (w.max() + w.min()) / 2),
                              r1(l.max() - l.min()), r1(w.max() - w.min()), r2(math.atan2(ax[1], ax[0]))])
        if hw == 'footway' and t.get('footway') == 'sidewalk': mark(p)
        elif hw == 'pedestrian': mark(p)
        elif hw == 'footway' and t.get('footway') not in ('crossing', 'link', 'traffic_island'): mark(p, maxd=11.0, par=0.9)
        elif hw == 'cycleway': mark(p, maxd=11.0, par=0.9)
        if t.get('barrier') == 'kerb': mark(p, maxd=11.0, par=0.9)
        if hw and t.get('sidewalk') in ('both', 'left', 'right'): mark(p, sides={'both': (-1, 1), 'left': (-1,), 'right': (1,)}[t['sidewalk']])
    def runs(a, fill=24, minlen=16):   # (gaps up to 24 m closed, runs under 16 m dropped) -> [from, to] in metres after the start line
        a = a.copy(); idx = np.flatnonzero(a)
        for k in range(len(idx) - 1):
            if 1 < idx[k + 1] - idx[k] <= fill / STEP: a[idx[k]:idx[k + 1]] = True
        out = []; i = 0
        while i < NP:
            if not a[i]: i += 1; continue
            j = i
            while j < NP and a[j]: j += 1
            if (j - i) * STEP >= minlen: out.append([int(round(i * STEP)), int(round(j * STEP))])
            i = j
        return out
    # walk2, a guess for the streets the map has no sidewalk drawn on: where houses stand along the road (two or more within 18 m of the centre
    # line on that side in any 40 m), in runs of 80 m at least; not where the map says sidewalk=no
    built = np.zeros((2, NP), np.int16); no = np.zeros(NP, bool)
    for b in B:
        if b[2] * b[3] < 30: continue
        dd, i = KD.query([b[0], b[1]])
        if dd > 18 + min(b[2], b[3]) / 2: continue
        lat = float((np.array([b[0], b[1]]) - LINE[i]) @ NR[i]); sd = 1 if lat > 0 else 0
        for j in range(i - int(20 / STEP), i + int(20 / STEP) + 1): built[sd, j % NP] += 1
    for refs, t in ways.values():
        if t.get('highway') and t.get('sidewalk') in ('no', 'none'):
            for r in refs:
                if r in nodes:
                    dd, i = KD.query(nodes[r])
                    if dd < 8: no[max(0, i - 8):i + 9] = True
    w2 = [runs((built[k] >= 2) & ~no | walk[k], fill=30, minlen=80) for k in (0, 1)]
    return {'roof': {str(k): v for k, v in sorted(roof.items())}, 'levels': {str(k): v for k, v in sorted(levels.items())}, 'walk': [runs(walk[0]), runs(walk[1])], 'walk2': w2, 'pools': pools}

old = json.load(open(OUT)) if os.path.exists(OUT) else {}
osm = osm_part(sys.argv[1]) if len(sys.argv) > 1 else old.get('osm', {'roof': {}, 'levels': {}, 'walk': [[], []], 'walk2': [[], []], 'pools': []})
data = {
    'about': 'Livorno: the houses by the road (tools/livorno/hise.py). att: a hex digit a building (bits: a neighbour against its wall at -x, +x, -z, +z of its own frame); '
             'wings: [building, [[x, z, length, width (its own frame), walls (base 3: -x, +x, -z, +z; 1 a neighbour, 2 a wing of its own), how far the roof may run on '
             'behind each wall], ...]]; roads: [class (0 asphalt, 1 paving, 2 gravel), width, [x, z, ...]]; osm: roof {building: 1 gabled, 2 hipped, 3 flat, 4 pyramidal}, '
             'levels {building: floors}, walk [left, right]: [from, to] m after the start line where the road has a sidewalk, walk2: the same with the built-up '
             'streets the map has none drawn on (a guess: houses along the road), pools [x, z, length, width, angle]. '
             '(c) OpenStreetMap contributors, ODbL 1.0.',
    'att': ''.join('%x' % a for a in att_plain), 'wings': wings_out, 'roads': roads_out, 'osm': osm,
}
json.dump(data, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
nw = collections.Counter(len(w[1]) for w in wings_out)
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')
print('  outlines', len(OUTL), '-> buildings with wings', len(wings_out), dict(nw), '; covered %.2f (median)' % (float(np.median(covs)) if covs else 0))
print('  attached walls: buildings', sum(1 for a in att_plain if a), 'of', len(B), '; roads', len(roads_out), 'lines, %.1f km' % (sum(np.hypot(*(np.diff(np.array(r[2]).reshape(-1, 2), axis=0)).T).sum() for r in roads_out) / 1000))
print('  osm: roofs', len(osm['roof']), dict(collections.Counter(osm['roof'].values())), '; levels', len(osm['levels']), '; sidewalk left %d m, right %d m (with the guess %d m, %d m); pools %d' % (
    sum(b - a for a, b in osm['walk'][0]), sum(b - a for a, b in osm['walk'][1]), sum(b - a for a, b in osm['walk2'][0]), sum(b - a for a, b in osm['walk2'][1]), len(osm['pools'])))
