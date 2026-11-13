# Dadès, Maroko: the game's track data from the track's data (tools/dades/dades.json and its PNG grids, made by tools/proga-podatki.py with
# tools/dades/config.json). Plan: docs/nove-proge-1-0.md (Del 2, Dadès), the track: docs/proge/dades.md.
#   python3 -I tools/dades/build.py --osm RAW   -> first tools/dades/extra.json from the tool's OSM download (RAW/dades-osm.json): the whole
#                                                 course of the Oued Dadès, the viewpoints, the car parks, the buildings within 300 m, the
#                                                 power line along the road
#   python3 -I tools/dades/build.py [--png P]   -> the data block and DADES_H in js/tracks/dades.js (between »podatki (tools/dades/build.py)«
#                                                 and »konec podatkov«; the rest of the file is written by hand); --png: a plan of the line
# What it does: the centre line (OpenStreetMap, every 5 m) on 1 m samples, the legs of the hairpin stack pushed apart to GAP m (the game's road
# is 9 m wide, the real one ~6 m with its legs 8-15 m apart), the tips of the hairpins opened to RMIN m; the heights (the ground model in the
# gorge is unreliable: 30 m cells across a road cut into the foot of a cliff), shaped by hand from it: along the valley floor to the foot of the
# hairpins, up the hairpins (flatter in their tips, as built) to the saddle above them, down into the gorge and gently up along the river;
# the terrain (dem: the ground model on its 20 m grid, an 80 m trend in 0.1 m steps and 1 m residuals within 600 m of the road, the forms
# js/world-vrsic.js vrPrep reads), the land cover (lc, 16 m cells, run-length coded: 0 steppe, 1 trees (the oasis by the river), 2 shrubs,
# 3 built-up, 4 bare ground and rock, 5 water, 6 fields; ESA WorldCover 2021 and OpenStreetMap's orchards), the land beyond the corridor
# (farDem: Copernicus DEM on a 250 m grid ~9 km round, lo + v / 2 metres, as js/world-iroha.js irFar reads it) and the scenery
# (OpenStreetMap: the river, the buildings, the viewpoints, the car parks, the retaining walls, the power line).
import base64, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'dades.json'))); CFG = json.load(open(os.path.join(HERE, 'config.json')))
TRACK = os.path.join(ROOT, 'js', 'tracks', 'dades.js')
HW = 4.5      # the game's half width of the road (def.halfWidth)
GAP = 13.0    # the least distance between two legs of the hairpin stack (centre lines), m (as Kotor's, tools/proga on its branch)
RMIN = 5.5    # the least radius of the centre line in the tips of the hairpins, m (the real tips are 5.6-7.7 m; opening them more with
              # widen's smoothing pulls the tips in and shortens the loops by up to 100 m, as their legs are only GAP apart)
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

def log(*a): print(*a, flush=True)

# ---- the frame of dades.json (tools/proga-podatki.py Frame: metres, origin its first route point, x east, z south, WGS84 radii at lat0) ----
A_WGS, E2 = 6378137.0, 6.69437999014e-3
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)
LAT0, LON0 = J['lat0'], J['lon0']; RM, RN = radii(LAT0); CL = math.cos(math.radians(LAT0))
def xz(lat, lon): return (np.radians(np.asarray(lon, float) - LON0) * RN * CL, -np.radians(np.asarray(lat, float) - LAT0) * RM)
def ll(x, z): return (LAT0 - np.degrees(np.asarray(z, float) / RM), LON0 + np.degrees(np.asarray(x, float) / (RN * CL)))

# ================= the OSM extras (--osm RAW) =================
def obb(P):   # the least-area rectangle round points P (n x 2): cx, cz, length, width, angle of the long side (from +x towards +z)
    best = None
    for k in range(len(P) - 1):
        d = P[k + 1] - P[k]; L = math.hypot(*d)
        if L < 1e-6: continue
        u = d / L; v = np.array([-u[1], u[0]]); a = P @ u; b = P @ v
        area = (a.max() - a.min()) * (b.max() - b.min())
        if best is None or area < best[0]:
            c = u * (a.max() + a.min()) / 2 + v * (b.max() + b.min()) / 2; la, wb = a.max() - a.min(), b.max() - b.min()
            ang = math.atan2(u[1], u[0]) if la >= wb else math.atan2(v[1], v[0])
            best = (area, float(c[0]), float(c[1]), float(max(la, wb)), float(min(la, wb)), ang)
    return best[1:]

def osm_extra(raw):
    d = json.load(open(os.path.join(raw, 'dades-osm.json'))); N = d['nodes']; W = d['ways']
    line = np.array(J['line']).reshape(-1, 2); T = cKDTree(line)
    near = lambda P: T.query(P)[0]
    def pts(ns):
        a = np.array([N[n][:2] for n in ns if n in N], float); x, z = xz(a[:, 0], a[:, 1]); return np.stack([x, z], 1)
    r1 = lambda v: round(float(v), 1)
    river, bld, walls, parks, power = [], [], [], [], []
    for wid, (ns, t) in W.items():
        if t.get('waterway') == 'river':   # the Oued Dadès: its whole course within 700 m of the road (downstream, as OSM draws it)
            P = pts(ns); m = near(P) < 700
            if m.sum() > 2: river.append([v for p in P[m] for v in (r1(p[0]), r1(p[1]))])
        elif 'building' in t:   # the buildings within 300 m (the hotels and restaurants at the top of the hairpins and in the gorge: generic)
            P = pts(ns)
            if near(P).min() < 300 and len(P) >= 4:
                cx, cz, L, Wd, a = obb(P[:-1] if np.allclose(P[0], P[-1]) else P); bld.append([r1(cx), r1(cz), r1(L), r1(Wd), round(a, 3)])
        elif t.get('barrier') == 'retaining_wall':
            P = pts(ns)
            if near(P).min() < 40: walls.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
        elif t.get('amenity') == 'parking':
            P = pts(ns)
            if near(P).min() < 60: c = P.mean(0); parks.append([r1(c[0]), r1(c[1]), r1(max(6, math.sqrt(abs(float(np.sum(P[:-1, 0] * P[1:, 1] - P[1:, 0] * P[:-1, 1]))) / 2 / math.pi)))])
        elif t.get('power') in ('line', 'minor_line'):
            P = pts(ns); m = near(P) < 90
            if m.sum() > 2: power.append([v for p in P[m] for v in (r1(p[0]), r1(p[1]))])
    views = []
    for nid, v in N.items():
        if len(v) > 2 and v[2].get('tourism') == 'viewpoint':
            x, z = xz(v[0], v[1])
            if near([[float(x), float(z)]])[0] < 90: views.append([r1(x), r1(z)])
        elif len(v) > 2 and v[2].get('amenity') == 'parking':
            x, z = xz(v[0], v[1])
            if near([[float(x), float(z)]])[0] < 60: parks.append([r1(x), r1(z), 8.0])
    out = {'about': 'Dadès, Maroko: OSM extras for tools/dades/build.py (© OpenStreetMap contributors, ODbL 1.0), in the frame of dades.json (metres from '
                    'its first route point, x east, z south): river [[x, z, ...]] (the Oued Dadès downstream, within 700 m), bld [x, z, length, width, angle] '
                    '(within 300 m), walls [[x, z, ...]] (retaining walls), parks [x, z, r] (car parks), views [x, z] (viewpoints), power [[x, z, ...]] (power lines within 90 m)',
           'river': river, 'bld': bld, 'walls': walls, 'parks': parks, 'views': views, 'power': power}
    json.dump(out, open(os.path.join(HERE, 'extra.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    log('extra.json: river %d pieces, %d buildings, %d walls, %d car parks, %d viewpoints, %d power lines' % (len(river), len(bld), len(walls), len(parks), len(views), len(power)))

# ================= the centre line =================
def resample(x, z, step, *carry):
    d = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(z)))]); s = np.arange(0, d[-1] + 1e-6, step)
    return (np.interp(s, d, x), np.interp(s, d, z), s) + tuple(np.interp(s, d, c) for c in carry)

def separate(x, z, gap, adj, it=80):
    """Push apart the parts of the line closer than gap while more than adj samples apart along it (the legs of the hairpins), a little each
    step, smoothed (as tools/proga/proga.py separate): -> x, z, the mean and the most it moved."""
    x0, z0 = x.copy(), z.copy()
    for _ in range(it):
        P = np.stack([x, z], 1); pr = cKDTree(P).query_pairs(gap, output_type='ndarray')
        if len(pr): pr = pr[np.abs(pr[:, 0] - pr[:, 1]) > adj]
        if not len(pr): break
        dx = P[pr[:, 0]] - P[pr[:, 1]]; d = np.maximum(np.hypot(dx[:, 0], dx[:, 1]), 1e-6); push = ((gap - d) / 2 * 0.35)[:, None] * dx / d[:, None]
        F = np.zeros_like(P); np.add.at(F, pr[:, 0], push); np.add.at(F, pr[:, 1], -push)
        x = x + gaussian_filter1d(F[:, 0], 6); z = z + gaussian_filter1d(F[:, 1], 6)
    m = np.hypot(x - x0, z - z0)
    return x, z, float(m.mean()), float(m.max())

def curv(x, z, s):
    hd = np.unwrap(np.arctan2(np.gradient(z), np.gradient(x))); return gaussian_filter1d(np.gradient(hd) / np.gradient(s), 2), hd

def widen(x, z, u, rmin, it=30):
    """The tips of the hairpins opened up to the radius rmin (as tools/proga/proga.py widen, on the kotor branch): where the line bends tighter,
    blended a step at a time with a 3 m Gaussian of itself round the apex (+-10 m). u (the original arc length) is carried along."""
    for n in range(it):
        x, z, s, u = resample(x, z, 1.0, u)
        k, _ = curv(x, z, s); tight = np.where(np.abs(k) > 1 / rmin)[0]
        if not len(tight): return x, z, u, n
        w = np.zeros_like(s)
        for t in tight: w = np.maximum(w, np.exp(-((s - s[t]) / 10.0) ** 2))
        x = x * (1 - w) + gaussian_filter1d(x, 3, mode='nearest') * w; z = z * (1 - w) + gaussian_filter1d(z, 3, mode='nearest') * w
    x, z, s, u = resample(x, z, 1.0, u); return x, z, u, it

def turns(x, z, s, lim=1 / 60.0):
    """The bends: [(s of the apex, total turn (radians, + right), least radius)] where the curvature is over lim (as tools/proga/proga.py)."""
    k, hd = curv(x, z, s); out = []; i = 0
    while i < len(s):
        if abs(k[i]) > lim:
            j = i
            while j < len(s) - 1 and abs(k[j]) > lim / 2 and np.sign(k[j]) == np.sign(k[i]): j += 1
            a = i
            while a > 0 and abs(k[a - 1]) > lim / 2 and np.sign(k[a - 1]) == np.sign(k[i]): a -= 1
            m = a + int(np.argmax(np.abs(k[a:j + 1])))
            out.append((float(s[m]), float(hd[j] - hd[a]), float(1 / max(1e-9, np.max(np.abs(k[a:j + 1]))))))
            i = j + 1
        else: i += 1
    return out, k

def legs_gap(x, z, adj=40):   # the least distance between two parts of the line more than adj m apart along it
    P = np.stack([x, z], 1); d, j = cKDTree(P).query(P, k=60); best = 1e9
    for i in range(len(P)):
        for dd, jj in zip(d[i], j[i]):
            if abs(jj - i) > adj: best = min(best, dd); break
    return best

# ================= the heights =================
S5 = np.arange(len(J['h'])) * J['step']; HRAW = np.array(J['hRaw'])
# the shape of the road's profile (s on the data's line, the tool's frame: m from the first route point): the valley floor from the start of the
# run-up to the foot of the hairpins (S_FOOT), the climb up them to the saddle (S_TOP), the descent into the gorge to the river (S_RIVER) and
# gently up along it to the end of the road; the heights at those points from the ground model where it is good (the open slopes)
S_FOOT, S_TOP, S_RIVER = 450.0, 1600.0, 2980.0

def profile(u, s, hairpins):
    hr = ndimage.median_filter(np.interp(u, S5, HRAW), size=35, mode='nearest')   # (the ground model under the line, a 35 m running median)
    ds = s[1] - s[0]; out = np.zeros_like(s)
    seg = lambda a, b: (u >= a) & (u <= b)
    hF = float(np.median(hr[seg(S_FOOT - 60, S_FOOT + 30)])); hT = float(hr[seg(S_TOP - 40, S_TOP + 40)].max()); hR = float(np.median(hr[seg(S_RIVER, S_RIVER + 120)]))
    h0 = min(float(np.median(hr[seg(0, 40)])), hF - 4)
    # 1. the valley floor: straight up from h0 to hF (the model's bump where the road hugs the cliff's foot left out)
    m = u < S_FOOT; out[m] = h0 + (hF - h0) * (u[m] / S_FOOT)
    # 2. up the hairpins: the model's rise (monotone), its grade lowered in the tips (a share 0.35 within ~18 m of the apex), at most 12 %
    def shaped(m, a, b, ha, hb, up, flat):
        idx = np.where(m)[0]; h = hr[idx].copy()
        h = np.maximum.accumulate(h) if up else np.minimum.accumulate(h)
        h = gaussian_filter1d(h, 20, mode='nearest'); g = np.gradient(h, ds)
        w = np.ones_like(g)
        for sa in flat: w *= 1 - 0.65 * np.exp(-((s[idx] - sa) / 18.0) ** 2)
        g = np.where(np.sign(g) == (1 if up else -1), g, 0) * w + (1 if up else -1) * 0.015 * w   # (never against the climb, a little grade everywhere)
        tot = hb - ha
        for _ in range(60): g = np.clip(g * (tot / (np.sum(g) * ds or 1e-9)), -0.12, 0.12)
        out[idx] = ha + np.concatenate([[0], np.cumsum((g[1:] + g[:-1]) / 2 * ds)])
    shaped((u >= S_FOOT) & (u < S_TOP), S_FOOT, S_TOP, hF, hT, True, hairpins)
    # 3. down into the gorge (monotone), 4. along the river to the end (gently up, as the model)
    shaped((u >= S_TOP) & (u < S_RIVER), S_TOP, S_RIVER, hT, hR, False, [])
    m = u >= S_RIVER; hE = max(hR + 2, float(np.median(hr[u > u.max() - 80]))); shaped(m, S_RIVER, u.max(), hR, hE, True, [])
    out = gaussian_filter1d(out, 9, mode='nearest')   # (the joints rounded: the crest at the saddle, the dips at the foot and at the river)
    return out, (h0, hF, hT, hR, hE)

# ================= the grids =================
def grid(name):
    g = J['grids'][name]; a = np.array(Image.open(os.path.join(HERE, g['file'])))
    return g, (a.astype(np.float64) / 10 - 100 if a.dtype == np.uint16 or a.dtype == np.int32 else a)

def bilin(a, g, X, Z, order=1):
    i = (X - g['x0']) / g['cell'] - 0.5; j = (Z - g['z0']) / g['cell'] - 0.5
    return ndimage.map_coordinates(a, [j, i], order=order, mode='nearest')

def b64(b): return base64.b64encode(bytes(b)).decode()

def rle64(cls):
    v = np.asarray(cls).ravel(); s = []; k = 0
    while k < len(v):
        c = int(v[k]); n = 1
        while k + n < len(v) and v[k + n] == c: n += 1
        k += n
        if n < 8: s.append(A64[c * 8 + n - 1])
        else:
            s.append(A64[c * 8 + 7]); r = n - 8
            while True:
                if r >= 63: s.append(A64[63]); r -= 63
                else: s.append(A64[r]); break
    return ''.join(s)

def terrain(X, Z, ox, oz, base):
    """def.dem (as vrPrep reads it): the ground model's 20 m grid, an 80 m trend (2 bytes a node, 0.1 m) and 1 m residuals in each row's span of
    cells within 600 m of the road; heights above the sea (vrPrep takes D.base off)."""
    g, H = grid('dem'); cell = g['cell']; M = 520
    x0 = math.floor((X.min() - M + ox - g['x0']) / cell) * cell + g['x0']; z0 = math.floor((Z.min() - M + oz - g['z0']) / cell) * cell + g['z0']
    i0, j0 = int(round((x0 - g['x0']) / cell)), int(round((z0 - g['z0']) / cell))
    nx = min(g['nx'] - i0, int(math.ceil((X.max() + M + ox - x0) / cell)) + 1); nz = min(g['nz'] - j0, int(math.ceil((Z.max() + M + oz - z0) / cell)) + 1)
    H = H[j0:j0 + nz, i0:i0 + nx]; f = 4
    tnx = int(math.ceil((nx - 1) / f)) + 1; tnz = int(math.ceil((nz - 1) / f)) + 1
    Hs = ndimage.gaussian_filter(H, 2, mode='nearest'); TR = np.zeros((tnz, tnx))
    for j in range(tnz):
        for i in range(tnx): TR[j, i] = Hs[min(nz - 1, j * f), min(nx - 1, i * f)]
    lo = math.floor(TR.min()) - 1; tv = np.clip(np.round((TR - lo) / 0.1), 0, 65535).astype('>u2'); trq = lo + tv.astype(np.float64) * 0.1
    fi = np.arange(nx) / f; ti = np.minimum(tnx - 2, np.floor(fi).astype(int)); uu = fi - ti
    fj = np.arange(nz) / f; tj = np.minimum(tnz - 2, np.floor(fj).astype(int)); vv = fj - tj
    TB = (trq[tj][:, ti] * (1 - uu) + trq[tj][:, ti + 1] * uu) * (1 - vv)[:, None] + (trq[tj + 1][:, ti] * (1 - uu) + trq[tj + 1][:, ti + 1] * uu) * vv[:, None]
    GX, GZ = np.meshgrid(x0 - ox + np.arange(nx) * cell, z0 - oz + np.arange(nz) * cell)   # (the game's frame: the cells' corners as nodes, as vrDem reads them)
    dr, _ = cKDTree(np.stack([X[::4], Z[::4]], 1)).query(np.stack([GX.ravel(), GZ.ravel()], 1)); dr = dr.reshape(nz, nx)
    rows, res, clip = [], bytearray(), 0
    for j in range(nz):
        on = np.where(dr[j] < 600)[0]
        if not len(on): rows.append([0, 0]); continue
        a, b = int(on[0]), int(on[-1]) + 1; rows.append([a, b - a])
        r = np.round(H[j, a:b] - TB[j, a:b]); clip += int(np.sum(np.abs(r) > 127)); res += bytes((np.clip(r, -128, 127) + 128).astype(np.uint8))
    if clip: log('dem: %d residuals clipped to +-127 m' % clip)
    return {'x0': round(x0 - ox, 2), 'z0': round(z0 - oz, 2), 'nx': nx, 'nz': nz, 'cell': cell, 'base': round(float(base), 2),
            'tr': {'f': f, 'nx': tnx, 'nz': tnz, 'lo': lo, 'step': 0.1, 'b64': b64(tv.tobytes())}, 'rows': rows, 'res': b64(res)}

def landcover(X, Z, ox, oz):
    """def.lc: 16 m cells over the corridor (the road's box and 470 m), run-length coded: 0 steppe (WorldCover's grass), 1 trees (WorldCover's trees,
    OpenStreetMap's orchards: the oasis by the river), 2 shrubs, 3 built-up, 4 bare ground and rock, 5 water, 6 fields."""
    g, lc = grid('lc'); _, lu = grid('lu'); cell = 16.0; M = 470
    x0 = math.floor((X.min() - M) / cell) * cell; z0 = math.floor((Z.min() - M) / cell) * cell
    nx = int(math.ceil((X.max() + M - x0) / cell)); nz = int(math.ceil((Z.max() + M - z0) / cell))
    GX, GZ = np.meshgrid(x0 + (np.arange(nx) + 0.5) * cell, z0 + (np.arange(nz) + 0.5) * cell)
    votes = np.zeros((8, nz, nx))
    MAPC = {10: 1, 20: 2, 30: 0, 40: 6, 50: 3, 60: 4, 80: 5, 90: 5}
    for fx in (-0.3, 0.3):
        for fz in (-0.3, 0.3):
            a = bilin(lc.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int); b = bilin(lu.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int)
            for k, c in MAPC.items(): votes[c] += (a == k)
            votes[1] += 2 * (b == 7)   # (the orchards: trees)
            votes[0] += (a == 0) * 0.5   # (beyond the land cover's reach: steppe, the colours and the rock from the slopes)
    cls = votes.argmax(0).astype(np.uint8)
    cnt = np.bincount(cls.ravel(), minlength=8)
    log('land cover (16 m): ' + ', '.join('%s %d' % (n, cnt[k]) for k, n in enumerate(['steppe', 'trees', 'shrubs', 'built', 'bare', 'water', 'fields'])))
    return {'x0': float(x0), 'z0': float(z0), 'nx': nx, 'nz': nz, 'cell': cell, 'rle': rle64(cls)}

def far(X, Z, ox, oz):
    """def.farDem (as irFar reads it): the surface model on a 250 m grid ~9 km round the middle of the road, each node half its own height and
    half the highest round it (the ridges keep their height), lo + v / 2 metres; no lakes."""
    g, H = grid('far'); R, cell = 9000, 250
    cx, cz = (X.min() + X.max()) / 2, (Z.min() + Z.max()) / 2
    x0 = math.floor((cx - R) / cell) * cell; z0 = math.floor((cz - R) / cell) * cell; n = int(2 * R / cell) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell)
    h = bilin(H, g, GX + ox, GZ + oz); acc = h.copy()
    for dx, dz in [(-80, 0), (80, 0), (0, -80), (0, 80)]: acc = np.maximum(acc, bilin(H, g, GX + dx + ox, GZ + dz + oz))
    h = 0.5 * h + 0.5 * acc
    lo = int(math.floor(h.min() / 10) * 10); v = np.clip(np.round((h - lo) * 2), 0, 65535).astype('>u2')
    return {'x0': float(x0), 'z0': float(z0), 'nx': n, 'nz': n, 'cell': cell, 'lo': lo, 'b64': b64(v.tobytes()), 'lake': [n * n]}

# ================= the scenery =================
def scenery(X, Z, Hs, ox, oz, base):
    E = json.load(open(os.path.join(HERE, 'extra.json'))); T = cKDTree(np.stack([X, Z], 1)); r1 = lambda v: round(float(v), 1)
    g, DEM = grid('dem')
    out = {}
    # the river: downstream, every ~8 m, its water level: the ground model can't see the river's bed (a slot in the conglomerate it reads as the
    # cliffs' tops, 1690-1810 m along it, uphill and down), so the level comes from the road: 5 m (and 8 cm a metre farther out) under it where
    # the river runs within 70 m of it on the valley floor (the road less than 12 m above the start line: by the start and in the gorge's
    # bottom; not under the road's ledge above the slot), between those places along the river and past them falling gently (0.4 %), never
    # up downstream (isotonic: the conflicting places averaged): [x, z, level above the start line (0.1 m), ...]
    rv = []
    def pav(y):   # the non-increasing sequence nearest y (least squares)
        lv = []
        for v in y:
            lv.append([float(v), 1])
            while len(lv) > 1 and lv[-2][0] < lv[-1][0]:
                (a, n), (b, m) = lv[-2], lv[-1]; lv[-2:] = [[(a * n + b * m) / (n + m), n + m]]
        return np.concatenate([[v] * n for v, n in lv])
    for p in E['river']:
        P = np.array(p).reshape(-1, 2) - [ox, oz]; x, z, s = resample(P[:, 0], P[:, 1], 8.0)
        d, i = T.query(np.stack([x, z], 1)); road = Hs[i] + base
        near = (d < 70) & (Hs[i] < 12)
        if near.sum() < 2: continue
        a = (road - 5 - 0.08 * d)[near]; sa = s[near]
        lv = np.interp(s, sa, a)
        lv = np.where(s < sa[0], a[0] + (sa[0] - s) * 0.004, lv); lv = np.where(s > sa[-1], a[-1] - (s - sa[-1]) * 0.004, lv)
        lv = pav(lv)
        lv = np.where(near, np.minimum(lv, road - 4), lv); lv = np.minimum.accumulate(lv)
        keep = d < 640
        rv.append([v for k in np.where(keep)[0] for v in (r1(x[k]), r1(z[k]), int(round((lv[k] - base) * 10)))])
        log('river: %d points within 640 m of the road, its level %.1f -> %.1f m (the road %.1f -> %.1f where it runs beside it)' % (keep.sum(), lv[keep][0], lv[keep][-1], road[near][0], road[near][-1]))
    out['river'] = rv
    # the buildings (all generic: the hotels, the restaurants and the houses of the place; the game names none): [x, z, length, width, angle]
    out['bld'] = [[r1(b[0] - ox), r1(b[1] - oz), b[2], b[3], b[4]] for b in E['bld']]
    out['views'] = [[r1(v[0] - ox), r1(v[1] - oz)] for v in E['views']]
    out['parks'] = [[r1(p[0] - ox), r1(p[1] - oz), p[2]] for p in E['parks']]
    out['power'] = [[r1(v - (ox if k % 2 == 0 else oz)) for k, v in enumerate(p)] for p in E['power']]
    return out

def jsval(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
    if '--osm' in sys.argv: osm_extra(sys.argv[sys.argv.index('--osm') + 1]); return
    L = np.array(J['line']).reshape(-1, 2)
    x, z, s, u = resample(L[:, 0], L[:, 1], 1.0, np.arange(len(L)) * J['step'])
    x = gaussian_filter1d(x, 1.5, mode='nearest'); z = gaussian_filter1d(z, 1.5, mode='nearest')
    rt = CFG['route']; S0 = xz(rt[1][0], rt[1][1]); F0 = xz(rt[-2][0], rt[-2][1])
    i0 = int(np.argmin(np.hypot(x - S0[0], z - S0[1]))); i1 = int(np.argmin(np.hypot(x - F0[0], z - F0[1])))
    us, uf = u[i0], u[i1]
    g0 = legs_gap(x, z)
    x, z, mm, mx = separate(x, z, GAP, int(GAP * 2.6))
    x, z, u, nw = widen(x, z, u, RMIN); x, z, mm2, mx2 = separate(x, z, GAP, int(GAP * 2.6))
    x, z, s, u = resample(x, z, 1.0, u)
    i0 = int(np.argmin(np.abs(u - us))); i1 = int(np.argmin(np.abs(u - uf)))
    ox, oz = float(x[i0]), float(z[i0]); X, Z = x - ox, z - oz   # (the game's origin: the start line)
    bends, k = turns(X, Z, s)
    hp = [(sa, tot, r) for sa, tot, r in bends if abs(tot) > math.radians(150)]
    log('line: %.0f m (run-up %.0f, race %.0f, past the finish %.0f); legs %.1f m apart at least (OSM %.1f), moved %.1f m on average, %.1f at most; '
        'hairpins opened in %d steps; %d hairpins, the tightest %.1f m' % (s[-1], s[i0], s[i1] - s[i0], s[-1] - s[i1], legs_gap(X, Z), g0, mm, max(mx, mx2), nw, len(hp), min(r for _, _, r in hp)))
    # heights (the hairpins' apexes on the data's line, u)
    H, (h0, hF, hT, hR, hE) = profile(u, s, [sa for sa, _, _ in hp])
    # the finish a whole number of metres above the start line (the river's last 400 m a few cm steeper): the game's altitudes (Track.altAt)
    # scale the road's heights by def.alt's difference over the road's own, and on a road that ends only ~5 m above its start a fraction of
    # a metre would stretch every altitude by several %
    dF = round(H[i1] - H[i0]) - (H[i1] - H[i0]); H = H + dF * np.clip((s - (s[i1] - 400)) / 400, 0, 1)
    base = float(H[i0]); Hs = H - base; g = np.gradient(H, s)
    log('heights: run-up %.0f, foot of the hairpins %.0f, the saddle %.0f, the river %.0f, the end %.0f; start %.1f, finish %.1f m; steepest %.1f %% up, %.1f %% down' % (
        h0, hF, hT, hR, hE, H[i0], H[i1], g[i0:i1].max() * 100, -g[i0:i1].min() * 100))
    nE = int(round(s[-1] / 4)); fr = np.linspace(0, s[-1], nE + 1); HE = np.round(np.interp(fr, s, Hs) * 10).astype(int).tolist()
    pts = [[round(float(X[i]), 2), round(float(Z[i]), 2)] for i in range(0, len(X), 5)]
    if (len(X) - 1) % 5: pts.append([round(float(X[-1]), 2), round(float(Z[-1]), 2)])
    race = s[i1] - s[i0]; cps = []
    for f in (0.2, 0.4, 0.6, 0.8):   # the checkpoints: near each fifth of the race, on a straighter bit
        t = s[i0] + f * race; cand = [i for i in range(len(s)) if abs(s[i] - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(s[i] - t) / 60)
        cps.append([round(float(X[best]), 1), round(float(Z[best]), 1)])
    curves = [[round(float(sa - s[i0]), 1), int(round(float(np.interp(sa, s, H)))), 1 if tot > 0 else -1] for sa, tot, r in hp if s[i0] < sa < s[i1]]
    log('curves', curves); log('cps', cps)
    a0 = int(round(base)); data = {'alt': [a0, a0 + int(round(Hs[i1]))], 'altTop': int(round(H[i0:i1].max())), 'realKm': round(race / 1000, 2), 'finish': [round(float(X[i1]), 1), round(float(Z[i1]), 1)], 'cps': cps, 'curves': curves,
            'dem': terrain(X, Z, ox, oz, base), 'lc': landcover(X, Z, ox, oz), 'farDem': far(X, Z, ox, oz)}
    data.update(scenery(X, Z, Hs, ox, oz, base))
    data['points'] = pts
    keys = ['alt', 'altTop', 'realKm', 'finish', 'cps', 'curves', 'dem', 'lc', 'farDem', 'river', 'bld', 'views', 'parks', 'power', 'points']
    A, B = '    // ---- podatki (tools/dades/build.py) ----\n', '    // ---- konec podatkov ----\n'
    blk = A + ''.join('    %s: %s,\n' % (k_, jsval(data[k_])) for k_ in keys) + B
    src = open(TRACK).read(); i, j = src.index(A), src.index(B) + len(B); src = src[:i] + blk + src[j:]
    hA = '  const DADES_H = ['; i = src.index(hA); j = src.index('];', i); src = src[:i] + hA + ','.join(map(str, HE)) + src[j:]
    open(TRACK, 'w').write(src); log('written', TRACK, '%d KB' % (len(src.encode()) // 1024))
    if '--png' in sys.argv:   # a plan of the serpentines: the line (white), the data's line (red), the legs' barriers (grey)
        p = sys.argv[sys.argv.index('--png') + 1]; c = 3.0; xa, xb, za, zb = X.min() - 40, X.max() + 40, Z.min() - 40, Z.max() + 40
        sel = (s > s[i0] + 100) & (s < s[i0] + 1450); xa, xb, za, zb = X[sel].min() - 30, X[sel].max() + 30, Z[sel].min() - 30, Z[sel].max() + 30
        im = Image.new('RGB', (int((xb - xa) * c), int((zb - za) * c)), (30, 30, 30)); d = ImageDraw.Draw(im); P = lambda a, b: ((a - xa) * c, (b - za) * c)
        d.line([P(a - ox, b - oz) for a, b in L], fill=(200, 40, 40), width=1)
        nx_, nz_ = -np.gradient(Z), np.gradient(X); nl = np.hypot(nx_, nz_); nx_ /= nl; nz_ /= nl
        for sd in (-1, 1): d.line([P(X[i] + nx_[i] * sd * (HW + 1), Z[i] + nz_[i] * sd * (HW + 1)) for i in range(len(X))], fill=(120, 120, 120), width=1)
        d.line([P(a, b) for a, b in zip(X, Z)], fill=(255, 255, 255), width=1)
        for sa, tot, r in hp: q = int(sa); d.text(P(X[q] + 6, Z[q]), '%.0f r%.1f' % (sa - s[i0], r), fill=(255, 220, 0))
        im.save(p); log('plan', p, im.size)

if __name__ == '__main__':
    main()
