# What stands round the Hakone lap -> tools/hakone/podatki/okolica.json (format: docs/proga-hakone.md, "Podatki"). After pot.py and teren.py.
# The 60 m rule (the plan): the detailed things only within ~60 m of the road (what the camera behind the car sees); farther only the terrain.
#  lc       land cover of the corridor (16 m cells, js/world-vrsic.js vrPrep's run-length code; 0 open, 1 forest, 2 scrub, 3 settlement,
#           4 bare rock, 5 water): ESA WorldCover 2021, the canopy heights and OpenStreetMap (buildings, water, land use) over it
#  bld      buildings within 60 m (OpenStreetMap footprints as oriented boxes, heights from OSM height / levels)
#  trees    single trees within 60 m (the tops of the canopy height model: x, z, height)
#  rail     the mountain railway within 150 m (centre lines with cleaned heights, bridges, tunnels; stations, platforms)
#  and the walls, the old road's stone paving, the torii, the streams and weirs, parking, power pylons, bus stops and vending machines near the road
# Usage: python3 -I tools/hakone/okolica.py
import json, math, os, sys, collections
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view as swv
from PIL import Image, ImageDraw
sys.dont_write_bytecode = True   # (no __pycache__ in the repository)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import osm, frame, line, Dem, worldcover, canopy, merc, sample_grid, rle_lc, b64, save, OUT

NEAR = 60.0
F = frame(); LN, P = line(); dem = Dem(); N, NT, W, R = osm()
TER = json.load(open(os.path.join(OUT, 'teren.json'))); D = TER['dem']
px = np.array(P['points'])
def xz_of(refs):
    refs = [r for r in refs if r in N]; x, z = F.xz([N[r][0] for r in refs], [N[r][1] for r in refs]); return np.stack([np.atleast_1d(x), np.atleast_1d(z)], 1)
def near_pts(pg, rmax=NEAR + 40):   # (distance, s, side) of the polyline's nearest point to the road (its vertices and the middles of its edges)
    q = list(pg) + [((pg[k] + pg[k + 1]) / 2) for k in range(len(pg) - 1)]; best = (math.inf, 0, 0)
    for a, b in q:
        d, s, side, _ = LN.near(float(a), float(b), rmax)
        if d < best[0]: best = (d, s, side)
    return best
r1 = lambda v: round(float(v), 1)
RP = px.astype(np.float32)
def road_dist(xs, zs, chunk=1500):   # the distance to the nearest of the road's 5 m points (within ~0.3 m of the line's own at 10 m and more)
    xs = np.asarray(xs, np.float32); zs = np.asarray(zs, np.float32); out = np.empty(len(xs), np.float32)
    for a in range(0, len(xs), chunk):
        dx = xs[a:a + chunk, None] - RP[None, :, 0]; dz = zs[a:a + chunk, None] - RP[None, :, 1]; out[a:a + chunk] = np.sqrt((dx * dx + dz * dz).min(axis=1))
    return out
def pts_out(pg): return [[r1(a), r1(b)] for a, b in pg]
# ---------------- buildings ----------------
def hull(p):
    p = sorted(set(map(tuple, np.round(p, 3))))
    if len(p) < 3: return np.array(p)
    def cr(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for q in p:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(up) >= 2 and cr(up[-2], up[-1], q) <= 0: up.pop()
        up.append(q)
    return np.array(lo[:-1] + up[:-1])
def box(pg):   # the smallest box round a footprint: centre, length (the long side), width, angle of the long side (rad, atan2(dz, dx))
    h = hull(pg); best = None
    if len(h) < 3: return None
    for k in range(len(h)):
        e = h[(k + 1) % len(h)] - h[k]; a = math.atan2(e[1], e[0]); c, s = math.cos(a), math.sin(a)
        u = h[:, 0] * c + h[:, 1] * s; v = -h[:, 0] * s + h[:, 1] * c; ar = (u.max() - u.min()) * (v.max() - v.min())
        if best is None or ar < best[0]: best = (ar, a, u.min(), u.max(), v.min(), v.max())
    ar, a, u0, u1, v0, v1 = best; c, s = math.cos(a), math.sin(a); cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
    x, z = cu * c - cv * s, cu * s + cv * c; L, Wd = u1 - u0, v1 - v0
    if Wd > L: L, Wd, a = Wd, L, a + math.pi / 2
    a = (a + math.pi / 2) % math.pi - math.pi / 2
    return x, z, L, Wd, a
KIND = {'house': 0, 'detached': 0, 'residential': 0, 'yes': 0, 'hut': 0, 'kiosk': 0, 'toilets': 0, 'hotel': 1, 'apartments': 1, 'retail': 1, 'commercial': 1, 'school': 1, 'museum': 1, 'musuem': 1, 'public': 1, 'kindergarten': 1,
        'temple': 2, 'shrine': 2, 'train_station': 3, 'transportation': 3, 'roof': 4, 'garage': 5, 'shed': 5, 'service': 5, 'greenhouse': 5, 'parking': 5, 'industrial': 5}
bld, bmask, bl = [], [], []
for wid, (refs, t) in W.items():
    if 'building' not in t or len(refs) < 4: continue
    pg = xz_of(refs)
    if len(pg) < 4: continue
    bmask.append(pg); bl.append((pg, t))
cen = np.array([pg.mean(axis=0) for pg, t in bl]); rad = np.array([np.hypot(*(pg - pg.mean(axis=0)).T).max() for pg, t in bl]); cd0 = road_dist(cen[:, 0], cen[:, 1])
for (pg, t), d0, rr in zip(bl, cd0, rad):
    if d0 - rr > NEAR: continue
    d, s, side = near_pts(pg)
    if d > NEAR: continue
    b = box(pg)
    if not b: continue
    x, z, L, Wd, a = b; k = KIND.get(t['building'], 0)
    if t.get('amenity') == 'place_of_worship': k = 2
    if k == 0 and (t.get('tourism') in ('hotel', 'guest_house') or L * Wd > 500): k = 1
    try: h = float(t.get('height', '0').replace('m', '').strip() or 0)
    except ValueError: h = 0.0
    if not h and t.get('building:levels', '').isdigit(): h = int(t['building:levels']) * 3.2
    bld.append([r1(x), r1(z), r1(L), r1(Wd), round(a, 3), r1(h), k, r1(d), side, round(s)])
bld.sort(key=lambda b: b[-1])
print('buildings within %d m: %d (heights known %d); kinds %s' % (NEAR, len(bld), sum(1 for b in bld if b[5] > 0), dict(collections.Counter(b[6] for b in bld))))
# ---------------- land cover ----------------
CELL = 16.0; lx0, lz0 = D['x0'], D['z0']; lnx = int(D['nx'] * D['cell'] / CELL); lnz = int(D['nz'] * D['cell'] / CELL)
GX, GZ = np.meshgrid(lx0 + (np.arange(lnx) + 0.5) * CELL, lz0 + (np.arange(lnz) + 0.5) * CELL)   # (cell centres; the cell (i, j) spans x0 + i * 16 ...)
la, lo = F.ll(GX, GZ)
wc, top, left, dd = worldcover(float(la.min()) - 0.002, float(lo.min()) - 0.002, float(la.max()) + 0.002, float(lo.max()) + 0.002, 'corridor')
votes = collections.defaultdict(lambda: np.zeros(GX.shape))
for ox in (-5.3, 0, 5.3):
    for oz in (-5.3, 0, 5.3):
        l2, o2 = F.ll(GX + ox, GZ + oz); r = np.clip(((top - l2) / dd).astype(int), 0, wc.shape[0] - 1); c = np.clip(((o2 - left) / dd).astype(int), 0, wc.shape[1] - 1)
        v = wc[r, c]
        for cls, ours in ((10, 1), (20, 2), (30, 0), (40, 0), (50, 3), (60, 4), (80, 5), (90, 0)): votes[ours] += (v == cls)
keys = sorted(votes); lc = np.array(keys, np.uint8)[np.argmax(np.stack([votes[k] for k in keys]), axis=0)]
# the canopy: a forest where the trees are tall, open where WorldCover's trees are none (the canopy model averaged to ~8 m)
C8, cx0, cy0, cd = canopy(float(la.min()) - 0.002, float(lo.min()) - 0.002, float(la.max()) + 0.002, float(lo.max()) + 0.002, 'lc', down=7)
mx, my = merc(la, lo); ch = sample_grid(C8, cx0, cy0, cd, mx, my)
lc[(lc == 1) & (ch < 2.0)] = 0; lc[(lc == 0) & (ch > 8.0)] = 1; lc[(lc == 2) & (ch > 8.0)] = 1
# OpenStreetMap over it: the land use, the water, the buildings (rasterised on a 4 m grid, a cell takes a class covering a third of it)
S4 = 4; mw, mh = lnx * 4, lnz * 4
def raster(polys):
    im = Image.new('L', (mw, mh), 0); dr = ImageDraw.Draw(im)
    for pg in polys:
        if len(pg) >= 3: dr.polygon([((a - lx0) / S4, (b - lz0) / S4) for a, b in pg], fill=1)
    m = np.array(im, dtype=np.float32); return m.reshape(lnz, 4, lnx, 4).mean(axis=(1, 3))
def polys_where(f):
    out = []
    for wid, (refs, t) in W.items():
        if refs[0] == refs[-1] and len(refs) > 3 and f(t): out.append(xz_of(refs))
    for rid, (m, t) in R.items():
        if t.get('type') == 'multipolygon' and f(t):
            for typ, ref, role in m:
                if typ == 'way' and role == 'outer' and ref in W and W[ref][0][0] == W[ref][0][-1]: out.append(xz_of(W[ref][0]))
    return out
open_ = raster(polys_where(lambda t: t.get('landuse') in ('grass', 'meadow', 'farmland', 'cemetery') or t.get('leisure') in ('park', 'golf_course', 'pitch', 'garden') or t.get('natural') in ('grassland',)))
wood = raster(polys_where(lambda t: t.get('landuse') == 'forest' or t.get('natural') == 'wood'))
scrub = raster(polys_where(lambda t: t.get('natural') in ('scrub', 'heath')))
rock = raster(polys_where(lambda t: t.get('natural') in ('bare_rock', 'scree', 'sand', 'shingle')))
town = raster(polys_where(lambda t: t.get('landuse') in ('residential', 'commercial', 'retail', 'railway', 'religious') or t.get('amenity') == 'parking'))
water = raster(polys_where(lambda t: t.get('natural') == 'water' or t.get('waterway') == 'riverbank'))
blds = raster(bmask)
for m, cls in ((open_, 0), (wood, 1), (scrub, 2), (rock, 4), (town, 3)): lc[m > 0.5] = cls
lc[blds > 0.2] = 3; lc[water > 0.4] = 5
# the far cells (over 700 m from the road) as forest: nothing is built there and the code stays short
dfar = np.full(GX.shape, np.inf); pp = px[::4]
for j in range(lnz):
    zz = GZ[j, 0]; m = np.abs(pp[:, 1] - zz) < 760
    if m.any(): q = pp[m]; dfar[j] = np.sqrt((GX[j][:, None] - q[None, :, 0]) ** 2 + (zz - q[None, :, 1]) ** 2).min(axis=1)
lc[dfar > 700] = 1
lco = {'x0': lx0, 'z0': lz0, 'nx': lnx, 'nz': lnz, 'cell': CELL, 'rle': rle_lc(lc)}
near = dfar <= 60
print('land cover %d x %d: %.0f KB; within 60 m of the road: %s' % (lnx, lnz, len(lco['rle']) / 1024, {k: '%.0f %%' % (100 * np.mean(lc[near] == k)) for k in range(6)}))
# ---------------- single trees (the canopy model's tops within 60 m) ----------------
la_r, lo_r = F.ll(px[:, 0], px[:, 1])
C1, ax0, ay0, ad = canopy(float(la_r.min()) - 0.0008, float(lo_r.min()) - 0.0008, float(la_r.max()) + 0.0008, float(lo_r.max()) + 0.0008, 'road', down=1)
# the road's buffers on the canopy grid (web mercator cells): the band within 10, 20 ... 60 m of the centre line
mxr, myr = merc(la_r, lo_r); cpx = list(zip(((mxr - ax0) / ad).tolist(), ((ay0 - myr) / ad).tolist())); kscale = 1 / math.cos(math.radians(F.lat0))   # (mercator m per ground m)
band = np.zeros(C1.shape, np.uint8)
for dm in (60, 50, 40, 30, 20, 10):
    im = Image.new('L', (C1.shape[1], C1.shape[0]), 0); ImageDraw.Draw(im).line(cpx + cpx[:1], fill=1, width=int(round(2 * dm * kscale / ad)), joint='curve')
    band[np.array(im) > 0] = dm
pad = np.pad(C1, 2); mx5 = swv(pad, (5, 5)).max(axis=(2, 3))
cand = np.argwhere((C1 >= 4) & (C1 >= mx5) & (band > 0))
ccx = ax0 + (cand[:, 1] + 0.5) * ad; ccy = ay0 - (cand[:, 0] + 0.5) * ad
lon_c = np.degrees(ccx / 6378137.0); lat_c = np.degrees(2 * np.arctan(np.exp(ccy / 6378137.0)) - np.pi / 2); tx, tz = F.xz(lat_c, lon_c)
th = C1[cand[:, 0], cand[:, 1]]; tb = band[cand[:, 0], cand[:, 1]]
o = np.argsort(-th); tx, tz, th, tb = tx[o], tz[o], th[o], tb[o]   # (the tallest first: a lower top within its crown is dropped)
cellh = {}; trees = []
for a, b, h, dd_ in zip(tx, tz, th, tb):
    r = max(2.5, 0.16 * h + 1.0); g = (int(a // 6), int(b // 6)); ok = True
    for gx in (g[0] - 1, g[0], g[0] + 1):
        for gz in (g[1] - 1, g[1], g[1] + 1):
            for (qa, qb, qr) in cellh.get((gx, gz), ()):
                if (a - qa) ** 2 + (b - qb) ** 2 < (0.6 * (r + qr)) ** 2: ok = False; break
            if not ok: break
        if not ok: break
    if ok: cellh.setdefault(g, []).append((a, b, r)); trees.append([r1(a), r1(b), int(round(h)), int(dd_)])
n_all = len(trees)
trees = [t for t in trees if t[3] <= 20 or (t[3] <= 40 and t[2] >= 7) or t[2] >= 11]   # (all by the road; farther back only the taller ones, which show over the first row)
# binary, along the road: x, z (int16, 0.5 m from the corridor's x0, z0), s (uint16, m past the start line), height (uint8, m), band (uint8: 1 = within 10 m of the centre line ... 6 = 50-60 m)
T = np.array(trees, dtype=np.float64)
idx = np.concatenate([np.argmin((T[a:a + 1500, 0:1] - RP[None, :, 0]) ** 2 + (T[a:a + 1500, 1:2] - RP[None, :, 1]) ** 2, axis=1) for a in range(0, len(T), 1500)])
ts = idx * P['step']; o = np.argsort(ts, kind='stable'); T, ts = T[o], ts[o]; tb_ = bytearray()
for (a, b, h, d_), sv in zip(T, ts):
    xi, zi = int(round((a - D['x0']) * 2)), int(round((b - D['z0']) * 2)); tb_ += int(xi).to_bytes(2, 'big', signed=True) + int(zi).to_bytes(2, 'big', signed=True) + int(min(65535, sv)).to_bytes(2, 'big') + bytes([int(min(255, h)), int(d_ // 10)])
trees_out = {'x0': D['x0'], 'z0': D['z0'], 'unit': 0.5, 'n': len(T), 'rec': 'int16 x, int16 z (unit m from x0, z0), uint16 s (m), uint8 h (m), uint8 band (1: within 10 m of the centre line ... 6: 50-60 m); big-endian, 8 bytes a tree, sorted by s', 'b64': b64(tb_)}
print('trees within %d m: %d of %d tops kept (within 20 m: %d); heights %s; %.0f KB' % (NEAR, len(T), n_all, int(np.sum(T[:, 3] <= 20)), np.percentile(T[:, 2], [10, 50, 90]).round(1).tolist(), len(trees_out['b64']) / 1024))
# ---------------- the railway ----------------
rail_ways = {wid: (refs, t) for wid, (refs, t) in W.items() if t.get('railway') in ('rail', 'narrow_gauge')}
deg = collections.Counter()
for refs, t in rail_ways.values(): deg[refs[0]] += 1; deg[refs[-1]] += 1
def chains():   # the ways joined end to end where only two meet (so a line runs on through the stations' switches)
    used = set(); out = []
    ends = collections.defaultdict(list)
    for wid, (refs, t) in rail_ways.items(): ends[refs[0]].append(wid); ends[refs[-1]].append(wid)
    for wid in rail_ways:
        if wid in used: continue
        used.add(wid); seq = [(wid, False)]; refs = list(rail_ways[wid][0])
        for direction in (1, -1):
            while True:
                tip = refs[-1] if direction == 1 else refs[0]
                nxt = [w for w in ends[tip] if w not in used]
                if deg[tip] != 2 or not nxt: break
                w = nxt[0]; used.add(w); r2 = list(rail_ways[w][0])
                if direction == 1:
                    r2 = r2 if r2[0] == tip else r2[::-1]; refs += r2[1:]; seq.append((w, r2[0] != rail_ways[w][0][0]))
                else:
                    r2 = r2 if r2[-1] == tip else r2[::-1]; refs = r2[:-1] + refs; seq.insert(0, (w, r2[-1] != rail_ways[w][0][-1]))
        out.append((refs, [w for w, _ in seq]))
    return out
node_way = collections.defaultdict(list)
for wid, (r, t) in rail_ways.items():
    for k in range(len(r) - 1): node_way[(r[k], r[k + 1])].append(t); node_way[(r[k + 1], r[k])].append(t)
rail = []
for refs, wl in chains():
    pg = xz_of(refs)
    if len(pg) < 2: continue
    dmin = float(road_dist(pg[:, 0], pg[:, 1]).min())
    if dmin > 150: continue
    fl = [(1 if any(t.get('bridge') for t in node_way[(a, b)]) else 0) | (2 if any(t.get('tunnel') for t in node_way[(a, b)]) else 0) for a, b in zip(refs, refs[1:])]
    # heights: the model every 2 m along the line, bridges straight across, tunnels straight through, smoothed, at most 8.5 % (the line's steepest is 80 per mille)
    seg = np.hypot(np.diff(pg[:, 0]), np.diff(pg[:, 1])); s = np.concatenate([[0], np.cumsum(seg)]); Ls = s[-1]
    if Ls < 10: continue
    S2 = np.arange(0, Ls + 1e-6, 2.0); X2 = np.interp(S2, s, pg[:, 0]); Z2 = np.interp(S2, s, pg[:, 1]); l2, o2 = F.ll(X2, Z2); H = dem.sample(l2, o2)
    si = np.clip(np.searchsorted(s, S2, side='right') - 1, 0, len(fl) - 1); f2 = np.array(fl)[si]
    k = 0; n = len(S2)
    while k < n:
        if f2[k]:
            a = k
            while k < n and f2[k]: k += 1
            a0, b0 = max(0, a - 3), min(n - 1, k + 3); H[a0:b0 + 1] = np.linspace(H[a0], H[b0], b0 - a0 + 1)
        else: k += 1
    w = 15
    if n > 2 * w + 2:
        Hp = np.pad(H, w, mode='edge'); H = swv(Hp, 2 * w + 1).min(axis=1)
        Hp = np.pad(H, w, mode='edge'); H = swv(Hp, 2 * w + 1).max(axis=1)
        sig = 10; kk = np.exp(-0.5 * (np.arange(-30, 31) / sig) ** 2); kk /= kk.sum(); H = np.convolve(np.pad(H, 30, mode='edge'), kk, mode='valid')
    lo_, hi_ = H.copy(), H.copy(); g = 0.085 * 2.0
    for j in range(1, n): lo_[j] = min(lo_[j], lo_[j - 1] + g); hi_[j] = max(hi_[j], hi_[j - 1] - g)
    for j in range(n - 2, -1, -1): lo_[j] = min(lo_[j], lo_[j + 1] + g); hi_[j] = max(hi_[j], hi_[j + 1] - g)
    H = (lo_ + hi_) / 2; hv = np.interp(s, S2, H)
    names = sorted(set(rail_ways[w][1].get('bridge:name') or '' for w in wl) - {''})
    rail.append({'pts': [[r1(a), r1(b), r1(h)] for (a, b), h in zip(pg, hv)], 'seg': fl, 'near': r1(dmin), 'bridges': names, 'osm': wl})
stations = []
for nid, t in NT.items():
    if t.get('railway') in ('station', 'halt') and nid in N:
        x, z = F.xz(*N[nid]); d, s, side, _ = LN.near(float(x), float(z), 400)
        if d <= 300: stations.append({'ja': t.get('name'), 'en': t.get('name:en'), 'kind': t['railway'], 'x': r1(x), 'z': r1(z), 'd': r1(d), 's': round(s), 'side': side})
platforms = []
for wid, (refs, t) in W.items():
    if t.get('railway') == 'platform':
        pg = xz_of(refs); d, s, side = near_pts(pg, 200)
        if d <= 120: platforms.append({'pts': pts_out(pg), 'd': r1(d)})
print('railway: %d lines within 150 m (%.1f km), %d stations / halts within 300 m, %d platforms' % (len(rail), sum(np.hypot(*np.diff(np.array(r['pts'])[:, :2], axis=0).T).sum() for r in rail) / 1000, len(stations), len(platforms)))
# ---------------- walls, old road paving, gates, water, parking, pylons, small things ----------------
def lines_where(f, rmax=NEAR, closed_ok=True):
    out = []
    for wid, (refs, t) in W.items():
        if not f(t): continue
        pg = xz_of(refs)
        if len(pg) < 2 or road_dist(pg[:, 0], pg[:, 1]).min() > rmax + 30: continue
        d, s, side = near_pts(pg, rmax + 40)
        if d <= rmax: out.append((pg, t, d, s, side, wid))
    return out
walls = [{'kind': t['barrier'], 'pts': pts_out(pg), 'd': r1(d), 'side': side} for pg, t, d, s, side, wid in lines_where(lambda t: t.get('barrier') in ('retaining_wall', 'wall', 'fence', 'guard_rail', 'hedge', 'city_wall'))]
old_ids = set(ref for typ, ref, role in R.get(5185746, ([], {}))[0] if typ == 'way')
STONE = ('sett', 'cobblestone', 'unhewn_cobblestone', 'stone', 'rock', 'paving_stones')
paving = [{'kind': t.get('highway'), 'surface': t.get('surface'), 'old_road': wid in old_ids, 'pts': pts_out(pg), 'd': r1(d), 'side': side, 's': round(s)}
          for pg, t, d, s, side, wid in lines_where(lambda t: t.get('highway') in ('path', 'footway', 'steps', 'pedestrian') and (t.get('surface') in STONE or '石畳' in t.get('name', '') or '旧街道' in t.get('name', '')))
          ] + [{'kind': W[wid][1].get('highway'), 'surface': W[wid][1].get('surface'), 'old_road': True, 'pts': pts_out(pg), 'd': r1(d), 'side': side, 's': round(s)}
               for pg, t, d, s, side, wid in lines_where(lambda t: t.get('highway') in ('path', 'footway', 'steps'), NEAR) if wid in old_ids and t.get('surface') not in STONE and '石畳' not in t.get('name', '')]
gates = []
for wid, (refs, t) in W.items():
    if t.get('man_made') != 'ceremonial_gate': continue
    pg = xz_of(refs)
    if len(pg) < 2: continue
    c = pg.mean(axis=0); e = pg[-1] - pg[0]; d, s, side, _ = LN.near(float(c[0]), float(c[1]), 3000)
    gates.append({'x': r1(c[0]), 'z': r1(c[1]), 'w': r1(np.hypot(*e)), 'ang': round(math.atan2(e[1], e[0]), 3), 'd': r1(d), 's': round(s), 'side': side, 'in_lake': '平和' in t.get('name', ''), 'osm': wid})
streams = [{'kind': t['waterway'], 'name': t.get('name'), 'pts': pts_out(pg), 'd': r1(d)} for pg, t, d, s, side, wid in lines_where(lambda t: t.get('waterway') in ('river', 'stream', 'canal', 'weir', 'dam', 'waterfall'), 100)]
river_areas = [{'pts': pts_out(pg), 'd': r1(d)} for pg, t, d, s, side, wid in lines_where(lambda t: (t.get('natural') == 'water' and t.get('water') in ('river', 'stream', None)) or t.get('waterway') == 'riverbank', 100) if len(pg) > 3 and t.get('water') in ('river', 'stream')]
parking = [{'pts': pts_out(pg), 'd': r1(d), 'side': side, 's': round(s)} for pg, t, d, s, side, wid in lines_where(lambda t: t.get('amenity') == 'parking') if len(pg) > 3]
def points_where(f, rmax):
    out = []
    for nid, t in NT.items():
        if nid in N and f(t):
            x, z = F.xz(*N[nid]); d, s, side, _ = LN.near(float(x), float(z), rmax + 5)
            if d <= rmax: out.append({'x': r1(x), 'z': r1(z), 'd': r1(d), 's': round(s), 'side': side})
    return out
pylons = points_where(lambda t: t.get('power') == 'tower', 150)
power_lines = [{'pts': pts_out(pg), 'd': r1(d)} for pg, t, d, s, side, wid in lines_where(lambda t: t.get('power') in ('line', 'minor_line'), 150)]
bus_stops = points_where(lambda t: t.get('highway') == 'bus_stop', 25)
vending = points_where(lambda t: t.get('amenity') == 'vending_machine', 40)
shrines = points_where(lambda t: t.get('amenity') == 'place_of_worship' or t.get('historic') == 'wayside_shrine', 60)
print('walls %d, paving %d (old road %d), gates %d (within 60 m: %d), streams %d, river areas %d, parking %d, pylons %d, power lines %d, bus stops %d, vending %d, shrines %d' % (
    len(walls), len(paving), sum(1 for p in paving if p['old_road']), len(gates), sum(1 for g in gates if g['d'] <= 60), len(streams), len(river_areas), len(parking), len(pylons), len(power_lines), len(bus_stops), len(vending), len(shrines)))
save('okolica.json', {
    'about': 'What stands round the Hakone lap: © OpenStreetMap contributors (ODbL 1.0); land cover © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium (CC BY 4.0); trees and the canopy: High Resolution Canopy Height Maps (Meta and World Resources Institute 2024, CC BY 4.0); the railway heights: Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA). Made by tools/hakone/okolica.py; format in docs/proga-hakone.md.',
    'near': NEAR, 'lc': lco, 'bld': bld, 'trees': trees_out, 'rail': rail, 'stations': stations, 'platforms': platforms, 'walls': walls, 'paving': paving, 'gates': gates,
    'streams': streams, 'river_areas': river_areas, 'parking': parking, 'pylons': pylons, 'power_lines': power_lines, 'bus_stops': bus_stops, 'vending': vending, 'shrines': shrines})
