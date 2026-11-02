# The Hakone lap from OpenStreetMap and Copernicus DEM GLO-30 -> tools/hakone/podatki/pot.json (format: docs/proga-hakone.md, "Podatki").
# National road 1 from the Sanmaibashi junction in Hakone-Yumoto up through Tōnosawa, Ōhiradai, Miyanoshita, Kowakidani and Ashinoyu to its
# highest point (~874 m) and down to the Hatajuku entrance junction in Moto-Hakone (on the hairpins above the lake), then prefectural road 732
# (the old Tōkaidō: Hatajuku, the Seven Bends) back down to Sanmaibashi. The start line on road 1 in Yumoto, START m past Sanmaibashi, by
# the station. Usage: python3 -I tools/hakone/pot.py
import heapq, json, math, os, sys, collections
import numpy as np
sys.dont_write_bytecode = True   # (no __pycache__ in the repository)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import osm, Frame, Dem, Line, save

SAN, HAT = 257060821, 257062497   # the Sanmaibashi junction (三枚橋, road 1 / road 732), the Hatajuku entrance junction (畑宿入口)
REL1, REL732 = 32989, 14116871    # the route relations of national road 1 and prefectural road 732
START = 390.0                     # the start line, m along road 1 from Sanmaibashi (the straight before the station bend)
STEP = 5.0                        # the resampled line's step (m)
GRADE = {'1': 0.10, '732': 0.13}  # the steepest grade the cleaned heights keep (road 1 is signed up to 10 %, the old road is steeper)

N, NT, W, R = osm()
def dll(a, b):
    (la1, lo1), (la2, lo2) = N[a], N[b]
    return math.hypot((la2 - la1) * 110950, (lo2 - lo1) * 111320 * math.cos(math.radians(la1)))
def graph(rid, hw):
    G = collections.defaultdict(list)
    for typ, ref, role in R[rid][0]:
        if typ != 'way' or ref not in W: continue
        refs, t = W[ref]
        if t.get('highway') not in hw: continue
        ow = t.get('oneway') == 'yes' or role == 'forward'   # (the one-way carriageways of a split road: along their direction only)
        for a, b in zip(refs, refs[1:]):
            if a in N and b in N:
                d = dll(a, b); G[a].append((b, d, ref))
                if not ow: G[b].append((a, d, ref))
    return G
def path(G, s, e):
    D = {s: 0}; P = {}; q = [(0, s)]
    while q:
        d, u = heapq.heappop(q)
        if u == e: break
        if d > D[u]: continue
        for v, w, way in G[u]:
            if d + w < D.get(v, 1e18): D[v] = d + w; P[v] = (u, way); heapq.heappush(q, (d + w, v))
    out = [(e, None)]; u = e
    while u != s: u, way = P[u]; out.append((u, way))
    out.reverse()
    return [(n, out[k + 1][1] if k + 1 < len(out) else None) for k, (n, _) in enumerate(out)]
p1 = path(graph(REL1, ('trunk', 'trunk_link', 'primary')), SAN, HAT)
p2 = path(graph(REL732, ('secondary', 'tertiary')), HAT, SAN)
nodes, ways, roads = [], [], []
for seg, road in ((p1, '1'), (p2, '732')):
    for k, (n, way) in enumerate(seg):
        if nodes and k == 0: ways[-1] = way; roads[-1] = road; continue   # (the junction once: the way on from it is the new road's)
        nodes.append(n); ways.append(way); roads.append(road)
# nodes[-1] == nodes[0] (Sanmaibashi): the closed lap; ways[k] leads from nodes[k] to nodes[k + 1]
lat = np.array([N[n][0] for n in nodes]); lon = np.array([N[n][1] for n in nodes])
F0 = Frame(lat[0], lon[0]); x0, z0 = F0.xz(lat, lon); s0 = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x0), np.diff(z0)))])
# the start line START m past Sanmaibashi: the origin of the game's frame
k = int(np.searchsorted(s0, START) - 1); u = (START - s0[k]) / (s0[k + 1] - s0[k])
olat, olon = round(float(lat[k] + (lat[k + 1] - lat[k]) * u), 7), round(float(lon[k] + (lon[k + 1] - lon[k]) * u), 7)
F = Frame(olat, olon); X, Z = F.xz(lat, lon); S0 = np.concatenate([[0], np.cumsum(np.hypot(np.diff(X), np.diff(Z)))]); L = float(S0[-1])
sr = lambda s: (s - START) % L   # (metres past Sanmaibashi -> metres past the start line)
# the OSM nodes in driving order from the start line (the start point itself first)
order = list(range(k + 1, len(nodes) - 1)) + list(range(0, k + 1))
NX = [0.0] + [float(X[i]) for i in order] + [0.0]; NZ = [0.0] + [float(Z[i]) for i in order] + [0.0]
NS = np.concatenate([[0], np.cumsum(np.hypot(np.diff(NX), np.diff(NZ)))]); L = float(NS[-1])
NW = [ways[k]] + [ways[i] for i in order]              # the way leading on from each node
NR = [roads[k]] + [roads[i] for i in order]
NID = [None] + [nodes[i] for i in order]
print('lap %.1f m (road 1 %.0f m, road 732 %.0f m), %d OSM nodes; origin (start line) %.7f %.7f' % (L, sum(NS[j + 1] - NS[j] for j in range(len(NW)) if NR[j] == '1'), sum(NS[j + 1] - NS[j] for j in range(len(NW)) if NR[j] == '732'), len(NID), olat, olon))
# ---------------- the line every 2 m (heights) and every STEP m (the output) ----------------
def at(s, arr): return np.interp(s, NS, arr)
seg_of = lambda s: np.clip(np.searchsorted(NS, s, side='right') - 1, 0, len(NW) - 1)
S2 = np.arange(0, L, 2.0); X2, Z2 = at(S2, NX), at(S2, NZ); j2 = seg_of(S2)
WT = lambda w: W[w][1] if w in W else {}
br2 = np.array([1 if WT(NW[j]).get('bridge') else 0 for j in j2]); rd2 = np.array([NR[j] for j in j2])
dem = Dem(); la2, lo2 = F.ll(X2, Z2); H0 = dem.sample(la2, lo2)
H = H0.copy(); n = len(S2); i = 0
while i < n:   # bridges: straight across between their ends (the model shows the valley under them)
    if br2[i]:
        a = i
        while i < n and br2[i]: i += 1
        a0, b0 = (a - 3) % n, (i + 3) % n
        if a0 < b0: H[a0:b0 + 1] = np.linspace(H[a0], H[b0], b0 - a0 + 1)
    else: i += 1
def wrap(a, w): return np.concatenate([a[-w:], a, a[:w]])
def roll(a, w, f):
    from numpy.lib.stride_tricks import sliding_window_view
    return f(sliding_window_view(wrap(a, w), 2 * w + 1), axis=1)
def gauss(a, sig):
    r = int(3 * sig); kk = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2); kk /= kk.sum(); return np.convolve(wrap(a, r), kk, mode='valid')
Hc = roll(roll(H, 15, np.min), 15, np.max)     # an opening over 60 m: the canopy and the roofs over the road out (the model is a surface model)
Hc = gauss(Hc, 15)                             # 30 m: the 30 m cells' steps along the road
g = np.array([GRADE[r] for r in rd2]) * 2.0    # the steepest rise per 2 m sample
def lips(h):   # the mean of the largest g-Lipschitz profile below h and the smallest above it (both on the closed lap)
    lo = h.copy(); hi = h.copy()
    for _ in range(2):
        for j in range(1, n): lo[j] = min(lo[j], lo[j - 1] + g[j]); hi[j] = max(hi[j], hi[j - 1] - g[j])
        lo[0] = min(lo[0], lo[-1] + g[0]); hi[0] = max(hi[0], hi[-1] - g[0])
        for j in range(n - 2, -1, -1): lo[j] = min(lo[j], lo[j + 1] + g[j]); hi[j] = max(hi[j], hi[j + 1] - g[j])
    return (lo + hi) / 2
Hc = gauss(lips(Hc), 5)
G2 = np.gradient(Hc, 2.0) * 100
print('heights %.0f..%.0f m; |grade| over 8 %%: %.0f %% of the lap, over 10 %%: %.0f %%, steepest %.1f %%; mean |cleaned - model| %.1f m' % (Hc.min(), Hc.max(), np.mean(np.abs(G2) > 8) * 100, np.mean(np.abs(G2) > 10) * 100, np.abs(G2).max(), np.mean(np.abs(Hc - H0))))
S5 = np.arange(0, L, STEP); X5, Z5 = at(S5, NX), at(S5, NZ)
H5 = np.interp(S5, S2, Hc); H5r = np.interp(S5, S2, H0)
# ---------------- intervals along the lap ----------------
def runs(flag_of_seg, label_of_seg=lambda j: None):
    out = []; j = 0; m = len(NW)
    while j < m:
        if flag_of_seg(j):
            a = j; lab = label_of_seg(j)
            while j < m and flag_of_seg(j) and label_of_seg(j) == lab: j += 1
            out.append([round(float(NS[a]), 1), round(float(NS[j]), 1)] + ([lab] if lab is not None else []))
        else: j += 1
    return out
bridges = runs(lambda j: bool(WT(NW[j]).get('bridge')), lambda j: WT(NW[j]).get('bridge:name'))
road = runs(lambda j: True, lambda j: NR[j])
lanes = runs(lambda j: True, lambda j: WT(NW[j]).get('lanes') or '?')
maxspeed = runs(lambda j: True, lambda j: WT(NW[j]).get('maxspeed') or '?')
oneway = runs(lambda j: WT(NW[j]).get('oneway') == 'yes')
# ---------------- the shape: curvature, hairpins ----------------
tx, tz = np.gradient(X2), np.gradient(Z2); tl = np.hypot(tx, tz); hds = np.unwrap(np.arctan2(gauss(tz / tl, 3), gauss(tx / tl, 3)))   # (the heading, smoothed as a unit vector: no jump where the lap closes)
dh = np.diff(np.arctan2(np.sin(hds), np.cos(hds)), append=hds[0]); dh = (dh + np.pi) % (2 * np.pi) - np.pi; K = (dh + np.roll(dh, 1)) / 4.0   # (rad/m; + = to the right, x east z south)
hp = []
for i in range(0, n, 5):
    jj = min(n - 1, i + 40)
    if abs(hds[jj] - hds[i]) > math.radians(150): hp.append(i)
groups = []
for i in hp:
    if groups and i - groups[-1][-1] <= 20: groups[-1].append(i)
    else: groups.append([i])
hairpins = []
for gq in groups:
    a, b = gq[0], min(n - 1, gq[-1] + 40); i = a + int(np.argmax(np.abs(K[a:b])))
    hairpins.append({'s': round(float(S2[i]), 1), 'r': round(float(1 / abs(K[i])), 1), 'turn': 'R' if K[i] > 0 else 'L', 'h': round(float(Hc[i]), 1), 'road': rd2[i]})
# ---------------- places, junctions and the nodes on the road ----------------
ln = Line(X2, Z2, S2)
places = []
for nid, t in NT.items():
    if nid not in N: continue
    kind = t.get('place') or ('station' if t.get('railway') == 'station' else None) or ('bus_stop' if t.get('highway') == 'bus_stop' else None) or (t.get('natural') if t.get('natural') in ('peak', 'water') else None)
    if not kind or not t.get('name'): continue
    if any(w in t['name'] for w in ('ホテル', 'ユネッサン', '小涌園', '送迎', '学園', '郵便局', '蓬莱園', '甘酒', '見晴', '猿の茶屋')): continue   # (stops named after a hotel, a firm, a tea house or a school: not for the game)
    px, pz = F.xz(*N[nid]); d, s, side, _ = ln.near(float(px), float(pz), 1000)
    if d < (90 if kind == 'bus_stop' else 1000): places.append({'s': round(s, 1), 'd': round(d, 1), 'side': side, 'kind': kind, 'ja': t.get('name'), 'en': t.get('name:en') or t.get('name:ja-Latn') or t.get('name:ja_rm'), 'osm': nid})
places.sort(key=lambda p: p['s'])
on_road = {}
for j, nid in enumerate(NID):
    if nid is not None: on_road[nid] = float(NS[j])
route_ways = set(w for w in NW if w)
junctions = []
for wid, (refs, t) in W.items():
    h = t.get('highway')
    if wid in route_ways or h not in ('trunk', 'trunk_link', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'service', 'living_street', 'track', 'motorway_link'): continue
    for e in (0, -1):
        nid = refs[e]
        if nid not in on_road: continue
        rr = refs if e == 0 else refs[::-1]; xs, zs = F.xz([N[r][0] for r in rr if r in N], [N[r][1] for r in rr if r in N])
        dd = np.concatenate([[0], np.cumsum(np.hypot(np.diff(xs), np.diff(zs)))])
        if len(xs) < 2 or dd[-1] < 6: continue
        m = int(np.searchsorted(dd, 40.0)) + 1   # the first ~40 m away from the road
        s = on_road[nid]; i = int(s / 2.0) % n; ax, az = math.cos(hds[i]), math.sin(hds[i]); vx, vz = xs[min(m, len(xs) - 1)] - xs[0], zs[min(m, len(xs) - 1)] - zs[0]
        ang = math.degrees(math.atan2(ax * vz - az * vx, ax * vx + az * vz))   # (+ = to the right of the driving direction; 0 ahead, 180 back)
        junctions.append({'s': round(s, 1), 'side': 'R' if ang > 0 else 'L', 'ang': round(ang), 'hw': h, 'name': t.get('name'), 'lanes': t.get('lanes'), 'osm': wid,
                          'pts': [[round(float(a), 1), round(float(b), 1)] for a, b in zip(xs[:m + 1], zs[:m + 1])]})
junctions.sort(key=lambda q: q['s'])
marks = []
for nid, s in on_road.items():
    t = NT.get(nid, {})
    kind = 'signals' if t.get('highway') == 'traffic_signals' else 'crossing' if t.get('highway') == 'crossing' else 'level_crossing' if t.get('railway') == 'level_crossing' else None
    if kind: marks.append({'s': round(s, 1), 'kind': kind, 'name': t.get('name'), 'en': t.get('name:en')})
marks.sort(key=lambda q: q['s'])
i = int(np.argmax(Hc)); summit = {'s': round(float(S2[i]), 1), 'h': round(float(Hc[i]), 1)}
out = {
    'about': 'The Hakone lap: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0) centre line of national road 1 and prefectural road 732, heights from Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA). Made by tools/hakone/pot.py; format in docs/proga-hakone.md.',
    'origin': {'lat': olat, 'lon': olon, 'frame': 'x east, z south, metres from the start line (local tangent plane, WGS84 radii at the origin)'},
    'length': round(L, 1), 'step': STEP, 'start_from_sanmaibashi': START, 'sanmaibashi': round(sr(0.0), 1), 'hatajuku_junction': round(sr(float(S0[len(p1) - 1])), 1),
    'points': [[round(float(a), 2), round(float(b), 2)] for a, b in zip(X5, Z5)],
    'h': [round(float(v), 1) for v in H5], 'h_model': [round(float(v), 1) for v in H5r],
    'osm_nodes': [[round(a, 2), round(b, 2), round(float(s), 1), nid, w] for a, b, s, nid, w in zip(NX, NZ, NS, NID + [None], NW + [None])],
    'road': road, 'bridges': bridges, 'lanes': lanes, 'maxspeed': maxspeed, 'oneway': oneway,
    'hairpins': hairpins, 'summit': summit, 'places': places, 'junctions': junctions, 'marks': marks,
}
save('pot.json', out)
print('hairpins %d, places %d, junctions %d, marks %d, summit %s, bridges %d' % (len(hairpins), len(places), len(junctions), len(marks), summit, len(bridges)))
