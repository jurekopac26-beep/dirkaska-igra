# Ngorongoro, Tanzanija: the game's track data from the track's data (tools/ngorongoro/ngorongoro.json and its PNG grids, made by
# tools/proga-podatki.py with tools/ngorongoro/config.json). Plan: docs/nove-proge-1-0.md (Del 2, A9), the track: docs/proge/ngorongoro.md.
#   python3 -I tools/ngorongoro/build.py --osm RAW   -> first tools/ngorongoro/extra.json from the tool's OSM download (RAW/ngorongoro-osm.json):
#                                                       the viewpoint at Windy Gap and its lay-by, the gate of the descent road (its fence, the
#                                                       rangers' hut, the toilets and their steps), the paths on the rim, the huts of the boma
#                                                       on the rim (generic: the game names none)
#   python3 -I tools/ngorongoro/build.py --far RAW   -> then tools/ngorongoro/crater.png and craterlc.png: the whole crater beyond the corridor
#                                                       (Copernicus DEM GLO-30 and ESA WorldCover 2021 on a 100 m grid ~15 km round the crater's
#                                                       middle: the tool's far grid, 12 km round the road, misses the crater's east rim)
#   python3 -I tools/ngorongoro/build.py [--png P]   -> the data block and NGORONGORO_H in js/tracks/ngorongoro.js (between »podatki
#                                                       (tools/ngorongoro/build.py)« and »konec podatkov«; the rest of the file is written by
#                                                       hand); --png: a plan and a profile of the road
# What it does: the centre line (OpenStreetMap, every 5 m) on 1 m samples (as it is, but for the one hairpin's tip: OpenStreetMap's corner,
# 7.5 m round, opened to ~9.5 m, the line smoothed more within ~25 m of it); the heights (the
# ground model along the road, the tool's profile, an envelope of it, smoothed: 12-16.5 % down the crater wall, a shoulder half way down) as a
# target: the profile nearest it (least squares) only ever going down (a little up allowed on the rim road of the run-up), its grade at most
# 17 % and at most ~9 % round the hairpin's tip, its changes of grade smooth; the terrain (dem: the ground model on its 20 m grid, an 80 m trend
# in 0.1 m steps and 1 m residuals within 600 m of the road, the forms js/world-vrsic.js vrPrep reads), the land cover (lc, 16 m cells,
# run-length coded: 0 grass, 1 trees, 2 shrubs, 3 built-up, 4 bare ground and rock, 5 water, 6 wetland; ESA WorldCover 2021), the crater
# beyond the corridor (farDem: the model on a 300 m grid ~15 km round the crater's middle, lo + v / 2 metres, Lake Magadi its wet nodes (lake:
# runs), the land cover of each node (cls: run-length coded as lc, 7 fields), read by js/world-ngorongoro.js ngFar) and the scenery
# (OpenStreetMap: the viewpoint and the lay-by, the gate, its fence and huts, the paths, the boma's huts, the cliff, the streams).
import base64, importlib.util, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d
from scipy.optimize import lsq_linear
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'ngorongoro.json'))); CFG = json.load(open(os.path.join(HERE, 'config.json')))
TRACK = os.path.join(ROOT, 'js', 'tracks', 'ngorongoro.js')
HW = 4.5       # the game's half width of the road (def.halfWidth)
GMAX = 0.17    # the steepest grade of the game's road (down)
GUP = 0.015    # the most it may climb (the rim road of the run-up, a few cm; the descent itself never)
TIPR = 10.0    # the hairpin's tip opened to about this radius (m)
GTIP = 0.55    # the share of GMAX left at a hairpin's apex (a Gaussian dip of 18 m round it): ~9 %
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
CRATER = (7000.0, 2600.0, 15000.0)   # the crater grid (the data's frame): its middle and half its side, metres

def log(*a): print(*a, flush=True)

# ---- the frame of ngorongoro.json (tools/proga-podatki.py Frame: metres, origin its first route point, x east, z south, WGS84 radii at lat0) ----
A_WGS, E2 = 6378137.0, 6.69437999014e-3
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)
LAT0, LON0 = J['lat0'], J['lon0']; RM, RN = radii(LAT0); CL = math.cos(math.radians(LAT0))
def xz(lat, lon): return (np.radians(np.asarray(lon, float) - LON0) * RN * CL, -np.radians(np.asarray(lat, float) - LAT0) * RM)
def ll(x, z): return (LAT0 - np.degrees(np.asarray(z, float) / RM), LON0 + np.degrees(np.asarray(x, float) / (RN * CL)))

def tool():   # the shared tool's raster helpers (its file name has a hyphen: loaded by path)
    sp = importlib.util.spec_from_file_location('proga_podatki', os.path.join(ROOT, 'tools', 'proga-podatki.py'))
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m

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
    d = json.load(open(os.path.join(raw, 'ngorongoro-osm.json'))); N = d['nodes']; W = d['ways']
    line = np.array(J['line']).reshape(-1, 2); T = cKDTree(line)
    near = lambda P: T.query(P)[0]
    def pts(ns):
        a = np.array([N[n][:2] for n in ns if n in N], float); x, z = xz(a[:, 0], a[:, 1]); return np.stack([x, z], 1)
    r1 = lambda v: round(float(v), 1)
    bld, huts, paths, fences, parks, steps = [], [], [], [], [], []
    for wid, (ns, t) in W.items():
        if 'building' in t:   # the rangers' hut and the toilets at the gate (kind 1: toilets, 0: a hut); the boma's round huts on the rim (~500 m off)
            P = pts(ns)
            if len(P) < 4 or near(P).min() > 650: continue
            cx, cz, L, Wd, a = obb(P[:-1] if np.allclose(P[0], P[-1]) else P)
            if near(P).min() > 200: huts.append([r1(cx), r1(cz), r1(max(3, min(8, (L + Wd) / 2)))])
            else: bld.append([r1(cx), r1(cz), r1(max(L, 3.5)), r1(max(Wd, 3)), round(a, 3), 1 if t.get('amenity') == 'toilets' else 0])
        elif t.get('barrier') == 'fence':
            P = pts(ns)
            if near(P).min() < 120: fences.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
        elif t.get('amenity') == 'parking':   # the lay-by at Windy Gap: its outline
            P = pts(ns)
            if near(P).min() < 120: parks.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
        elif t.get('highway') == 'steps':
            P = pts(ns)
            if near(P).min() < 60: steps.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
        elif t.get('highway') in ('footway', 'path', 'track', 'unclassified', 'service'):   # the paths and tracks on the rim within 120 m
            P = pts(ns); m = near(P) < 120
            if m.sum() >= 2: paths.append([v for p in P[m] for v in (r1(p[0]), r1(p[1]))])
    views, gates = [], []
    for nid, v in N.items():
        if len(v) < 3 or not v[2]: continue
        tg = v[2]; x, z = xz(v[0], v[1]); dd = near([[float(x), float(z)]])[0]
        if tg.get('tourism') == 'viewpoint' and dd < 150: views.append([r1(x), r1(z)])
        elif tg.get('barrier') in ('lift_gate', 'gate') and dd < 20: gates.append([r1(x), r1(z)])
    out = {'about': 'Ngorongoro, Tanzanija: OSM extras for tools/ngorongoro/build.py (© OpenStreetMap contributors, ODbL 1.0), in the frame of '
                    'ngorongoro.json (metres from its first route point, x east, z south): bld [x, z, length, width, angle, kind 0 hut, 1 toilets] (within '
                    '200 m), huts [x, z, size] (the round huts 200-650 m off: a boma on the rim, generic), paths [[x, z, ...]] (footways, paths and tracks '
                    'within 120 m), fences [[x, z, ...]], parks [[x, z, ...]] (the lay-by), steps [[x, z, ...]], views [x, z] (viewpoints within 150 m), '
                    'gates [x, z] (the barrier across the road)',
           'bld': bld, 'huts': huts, 'paths': paths, 'fences': fences, 'parks': parks, 'steps': steps, 'views': views, 'gates': gates}
    json.dump(out, open(os.path.join(HERE, 'extra.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    log('extra.json: %d buildings, %d huts, %d paths, %d fences, %d lay-bys, %d steps, %d viewpoints, %d gates' % (
        len(bld), len(huts), len(paths), len(fences), len(parks), len(steps), len(views), len(gates)))

# ================= the crater beyond the corridor (--far RAW) =================
def crater_far(raw):
    """crater.png (uint16 (h + 100) * 10) and craterlc.png (the WorldCover class, the most common in each cell) on a 100 m grid (the data's
    frame), CRATER's square: the crater's floor, Lake Magadi, its walls and its rim all round, the highlands beyond."""
    t = tool(); cx, cz, R = CRATER; cell = 100.0; n = int(2 * R / cell) + 1
    x0, z0 = cx - R, cz - R
    la0, lo0 = ll(x0 + n * cell + 300, z0 + n * cell + 300); la1, lo1 = ll(x0 - 300, z0 - 300)   # (south-west, north-east corners)
    la0, la1 = float(min(la0, la1)), float(max(la0, la1)); lo0, lo1 = float(min(lo0, lo1)), float(max(lo0, lo1))
    log('crater box: lat %.4f .. %.4f, lon %.4f .. %.4f' % (la0, la1, lo0, lo1))
    a, T, ep = t.read_mosaic(t.dem_urls(la0, lo0, la1, lo1), la0, lo0, la1, lo1, 'third', 'average', fill=0)
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell); LA, LO = ll(GX, GZ)
    H = t.sample_grid(a, T, ep, LA.ravel(), LO.ravel(), 1).reshape(n, n)
    w, Tw, ew = t.read_mosaic(t.wc_urls(la0, lo0, la1, lo1), la0, lo0, la1, lo1, 'third', 'nearest', fill=0)
    votes = {}
    for fx in (-0.33, 0, 0.33):
        for fz in (-0.33, 0, 0.33):
            LA2, LO2 = ll(GX + fx * cell, GZ + fz * cell); c = t.sample_grid(w, Tw, ew, LA2.ravel(), LO2.ravel(), 0).reshape(n, n).astype(int)
            for k in (10, 20, 30, 40, 50, 60, 80, 90): votes.setdefault(k, np.zeros((n, n)))[...] += (c == k)
    ks = sorted(votes); C = np.array(ks, np.uint8)[np.argmax(np.stack([votes[k] for k in ks]), 0)]
    Image.fromarray(np.clip(np.round((H + 100) * 10), 0, 65535).astype(np.uint16)).save(os.path.join(HERE, 'crater.png'))
    Image.fromarray(C).save(os.path.join(HERE, 'craterlc.png'))
    meta = {'about': 'the crater beyond the corridor for tools/ngorongoro/build.py: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 and © Airbus Defence and '
                     'Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA) and ESA WorldCover 2021 (© ESA WorldCover project / '
                     'Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, CC BY 4.0) on a 100 m grid in the frame of '
                     'ngorongoro.json; crater.png uint16 (h + 100) * 10, craterlc.png the WorldCover class; row 0 = z0 (north), col 0 = x0 (west)',
            'x0': x0, 'z0': z0, 'nx': n, 'nz': n, 'cell': cell}
    json.dump(meta, open(os.path.join(HERE, 'crater.json'), 'w'), indent=1)
    u, k = np.unique(C, return_counts=True)
    log('crater grid: %d x %d nodes of %.0f m, heights %.0f .. %.0f m; classes %s' % (n, n, cell, H.min(), H.max(), dict(zip(u.tolist(), k.tolist()))))

# ================= the centre line =================
def resample(x, z, step, *carry):
    d = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(z)))]); s = np.arange(0, d[-1] + 1e-6, step)
    return (np.interp(s, d, x), np.interp(s, d, z), s) + tuple(np.interp(s, d, c) for c in carry)

def curv(x, z, s):
    hd = np.unwrap(np.arctan2(np.gradient(z), np.gradient(x))); return gaussian_filter1d(np.gradient(hd) / np.gradient(s), 2), hd

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
S5 = np.arange(len(J['h'])) * J['step']; HT = np.array(J['h']); HRAW = np.array(J['hRaw'])

def profile(u, s, tips, s0):
    """The road's heights on the 1 m line (u: the data's arc length at each sample): the profile nearest the tool's (least squares, on 5 m
    steps), going down only (GUP at most up on the run-up before s0, the start line), its grade at most GMAX and less round the hairpin's apex (tips: s of each), its changes of grade
    penalised (no kinks)."""
    ds = 5.0; n = int(s[-1] // ds) + 1; sc = np.arange(n) * ds
    tgt = np.interp(np.interp(sc, s, u), S5, HT)
    gm = np.full(n - 1, GMAX); mid = (sc[1:] + sc[:-1]) / 2
    for t in tips: gm *= 1 - (1 - GTIP) * np.exp(-((mid - t) / 18.0) ** 2)
    LAM = 9.0; A = np.zeros((n + n - 2, n)); A[:n, 0] = 1
    for i in range(1, n): A[i, 1:i + 1] = ds
    for i in range(n - 2): A[n + i, 1 + i] = -LAM * ds; A[n + i, 2 + i] = LAM * ds
    b = np.concatenate([tgt, np.zeros(n - 2)])
    lo = np.concatenate([[-np.inf], -gm]); hi = np.concatenate([[np.inf], np.where(mid < s0, GUP, 0.0)])
    r = lsq_linear(A, b, bounds=(lo, hi), method='trf', lsmr_tol='auto', max_iter=4000)
    hc = A[:n] @ r.x
    log('profile: %s, the target off by %.1f m rms, %.1f m at most' % (r.message[:40], float(np.sqrt(np.mean((hc - tgt) ** 2))), float(np.abs(hc - tgt).max())))
    return np.interp(s, sc, hc), np.interp(s, sc, tgt)

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
    """def.lc: 16 m cells over the corridor (the road's box and 470 m), run-length coded: 0 grass (WorldCover's grassland and its few crops: the
    short grass of the rim, the lower wall and the floor), 1 trees (the few acacias and the montane bush in the gullies), 2 shrubs (the wall's
    bush half way down), 3 built-up (the gate), 4 bare ground and rock, 5 water, 6 wetland (the springs' sedges)."""
    g, lc = grid('lc'); cell = 16.0; M = 470
    x0 = math.floor((X.min() - M) / cell) * cell; z0 = math.floor((Z.min() - M) / cell) * cell
    nx = int(math.ceil((X.max() + M - x0) / cell)); nz = int(math.ceil((Z.max() + M - z0) / cell))
    GX, GZ = np.meshgrid(x0 + (np.arange(nx) + 0.5) * cell, z0 + (np.arange(nz) + 0.5) * cell)
    votes = np.zeros((8, nz, nx))
    MAPC = {10: 1, 20: 2, 30: 0, 40: 0, 50: 3, 60: 4, 80: 5, 90: 6}
    for fx in (-0.3, 0.3):
        for fz in (-0.3, 0.3):
            a = bilin(lc.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int)
            for k, c in MAPC.items(): votes[c] += (a == k)
            votes[0] += (a == 0) * 0.5   # (beyond the land cover's reach: grass)
    cls = votes.argmax(0).astype(np.uint8)
    cnt = np.bincount(cls.ravel(), minlength=8)
    log('land cover (16 m): ' + ', '.join('%s %d' % (n, cnt[k]) for k, n in enumerate(['grass', 'trees', 'shrubs', 'built', 'bare', 'water', 'wetland'])))
    return {'x0': float(x0), 'z0': float(z0), 'nx': nx, 'nz': nz, 'cell': cell, 'rle': rle64(cls)}

def far(X, Z, ox, oz):
    """def.farDem (js/world-ngorongoro.js ngFar; the form js/world-iroha.js irFar reads, and cls): the crater grid (crater.png) on 300 m nodes
    CRATER's square, each node half its own height and half the highest round it (the rims keep their height), lo + v / 2 metres; Lake Magadi
    (WorldCover's open water on the floor) as its wet nodes (lake: the run lengths of dry and wet nodes, from a dry one), drawn flat at the lake's
    level (def.far.lake); cls: each node's land cover (0 grass, 1 trees, 2 shrubs, 3 built-up, 4 bare, 5 water, 6 wetland, 7 fields), run-length
    coded as lc."""
    meta = json.load(open(os.path.join(HERE, 'crater.json'))); g = {'x0': meta['x0'] - meta['cell'] / 2, 'z0': meta['z0'] - meta['cell'] / 2, 'cell': meta['cell']}
    H = np.array(Image.open(os.path.join(HERE, 'crater.png'))).astype(np.float64) / 10 - 100; C = np.array(Image.open(os.path.join(HERE, 'craterlc.png'))).astype(np.float64)
    cx, cz, R = CRATER; cell = 300; n = int(2 * R / cell) + 1
    x0 = cx - R - ox; z0 = cz - R - oz   # (the game's frame)
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell)
    h = bilin(H, g, GX + ox, GZ + oz); acc = h.copy()
    for dx, dz in [(-100, 0), (100, 0), (0, -100), (0, 100)]: acc = np.maximum(acc, bilin(H, g, GX + dx + ox, GZ + dz + oz))
    h = 0.5 * h + 0.5 * acc
    MAPC = {10: 1, 20: 2, 30: 0, 40: 7, 50: 3, 60: 4, 80: 5, 90: 6, 0: 0}
    votes = np.zeros((8, n, n))
    for fx in (-100, 0, 100):
        for fz in (-100, 0, 100):
            c = bilin(C, g, GX + fx + ox, GZ + fz + oz, 0).astype(int)
            for k, v in MAPC.items(): votes[v] += (c == k) * (1.6 if v == 5 else 1)   # (the lake's edge: a little generous)
    cls = votes.argmax(0).astype(np.uint8)
    wet = (cls == 5) & (h < 1800); cls[(cls == 5) & ~wet] = 6   # (Lake Magadi on the floor; the ponds up on the rims: wetland, at their own height)
    cls[wet] = 5
    lakeH = float(np.median(h[wet])) if wet.any() else 0
    h = np.where(wet, lakeH, h)
    lo = int(math.floor(h.min() / 10) * 10); v = np.clip(np.round((h - lo) * 2), 0, 65535).astype('>u2')
    w = wet.ravel(); runs = []; cur = False; k = 0
    while k < len(w):
        m = k
        while m < len(w) and bool(w[m]) == cur: m += 1
        runs.append(m - k); k = m; cur = not cur
    lx = float((GX[wet]).mean()) if wet.any() else 0; lz = float((GZ[wet]).mean()) if wet.any() else 0
    cnt = np.bincount(cls.ravel(), minlength=8)
    log('far: %d x %d nodes of %d m, Lake Magadi %d nodes at %.0f m (its middle %.0f, %.0f); classes %s' % (n, n, cell, int(w.sum()), lakeH, lx, lz, cnt.tolist()))
    return {'x0': float(x0), 'z0': float(z0), 'nx': n, 'nz': n, 'cell': cell, 'lo': lo, 'b64': b64(v.tobytes()), 'lake': runs, 'cls': rle64(cls)}, [round(lx), round(lz), round(lakeH)]

# ================= the scenery =================
def scenery(X, Z, ox, oz):
    E = json.load(open(os.path.join(HERE, 'extra.json'))); r1 = lambda v: round(float(v), 1)
    sh = lambda p: [r1(v - (ox if k % 2 == 0 else oz)) for k, v in enumerate(p)]
    out = {}
    out['views'] = [[r1(v[0] - ox), r1(v[1] - oz)] for v in E['views']]
    out['gates'] = [[r1(v[0] - ox), r1(v[1] - oz)] for v in E['gates']]
    out['bld'] = [[r1(b[0] - ox), r1(b[1] - oz), b[2], b[3], b[4], b[5]] for b in E['bld']]
    out['huts'] = [[r1(b[0] - ox), r1(b[1] - oz), b[2]] for b in E['huts']]
    out['fences'] = [sh(p) for p in E['fences']]
    out['parks'] = [sh(p) for p in E['parks']]
    out['steps'] = [sh(p) for p in E['steps']]
    out['paths'] = [sh(p) for p in E['paths']]
    out['cliffs'] = [sh(c) for c in J['cliffs']]
    out['streams'] = [sh(w[3]) for w in J['water'] if w[0] == 'stream']
    return out

def jsval(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
    if '--osm' in sys.argv: osm_extra(sys.argv[sys.argv.index('--osm') + 1]); return
    if '--far' in sys.argv: crater_far(sys.argv[sys.argv.index('--far') + 1]); return
    L = np.array(J['line']).reshape(-1, 2)
    x, z, s, u = resample(L[:, 0], L[:, 1], 1.0, np.arange(len(L)) * J['step'])
    x = gaussian_filter1d(x, 1.5, mode='nearest'); z = gaussian_filter1d(z, 1.5, mode='nearest')
    x, z, s, u = resample(x, z, 1.0, u)
    # the hairpin's tip (OpenStreetMap's: a corner, 7.5 m round once smoothed) opened to ~10 m: the line smoothed more within ~25 m of it
    b0, _ = turns(x, z, s)
    for sa, tot, r in b0:
        if abs(tot) > math.radians(112) and r < TIPR:
            w = np.exp(-((s - sa) / 22.0) ** 2); xs = gaussian_filter1d(x, 10, mode='nearest'); zs = gaussian_filter1d(z, 10, mode='nearest')
            x = x * (1 - w) + xs * w; z = z * (1 - w) + zs * w
    x, z, s, u = resample(x, z, 1.0, u)
    rt = CFG['route']; S0 = xz(rt[1][0], rt[1][1]); F0 = xz(rt[-2][0], rt[-2][1])
    i0 = int(np.argmin(np.hypot(x - S0[0], z - S0[1]))); i1 = int(np.argmin(np.hypot(x - F0[0], z - F0[1])))
    ox, oz = float(x[i0]), float(z[i0]); X, Z = x - ox, z - oz   # (the game's origin: the start line)
    bends, k = turns(X, Z, s)
    tight = [(sa, tot, r) for sa, tot, r in bends if abs(tot) > math.radians(112)]   # (the bends flattened in the profile: the hairpin)
    hp = [(sa, tot, r) for sa, tot, r in tight if abs(tot) > math.radians(130)]   # (the hairpins: the HUD's and the commentator's, def.curves)
    log('line: %.0f m (run-up %.0f, race %.0f, past the finish %.0f); legs %.1f m apart at least; %d hairpins (%d bends over 112 deg), the tightest %.1f m' % (
        s[-1], s[i0], s[i1] - s[i0], s[-1] - s[i1], legs_gap(X, Z), len(hp), len(tight), min([r for _, _, r in tight] or [0])))
    for sa, tot, r in bends: log('  bend at %6.0f m: %4.0f deg, r %.1f m' % (sa - s[i0], math.degrees(tot), r))
    H, tgt = profile(u, s, [sa for sa, _, _ in tight], s[i0])
    # the finish a whole number of metres below the start line (the last 400 m before it a few cm steeper or flatter): the game's altitudes
    # (Track.altAt) scale the road's heights by def.alt's difference over the road's own
    dF = round(H[i1] - H[i0]) - (H[i1] - H[i0]); H = H + dF * np.clip((s - (s[i1] - 400)) / 400, 0, 1)
    base = float(H[i0]); Hs = H - base; g = np.gradient(H, s)
    log('heights: start %.1f, finish %.1f m; steepest %.1f %% down (over 20 m: %.1f %%), %.2f %% up; off the tool\'s by %.1f m at most' % (
        H[i0], H[i1], -g[i0:i1].min() * 100, -np.min((H[i0 + 20:i1] - H[i0:i1 - 20]) / 20) * 100, g[i0:i1].max() * 100, float(np.abs(H - tgt).max())))
    nE = int(round(s[-1] / 4)); fr = np.linspace(0, s[-1], nE + 1); HE = np.round(np.interp(fr, s, Hs) * 10).astype(int).tolist()
    pts = [[round(float(X[i]), 2), round(float(Z[i]), 2)] for i in range(0, len(X), 5)]
    if (len(X) - 1) % 5: pts.append([round(float(X[-1]), 2), round(float(Z[-1]), 2)])
    race = s[i1] - s[i0]; cps = []
    for f in (0.2, 0.4, 0.6, 0.8):   # the checkpoints: near each fifth of the race, on a straighter bit
        t = s[i0] + f * race; cand = [i for i in range(len(s)) if abs(s[i] - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(s[i] - t) / 60)
        cps.append([round(float(X[best]), 1), round(float(Z[best]), 1)])
    curves = [[round(float(sa - s[i0]), 1), int(round(float(np.interp(sa, s, H)))), 1 if tot > 0 else -1] for sa, tot, r in hp if s[i0] < sa < s[i1]]
    log('curves', curves); log('cps', cps)
    fd, lake = far(X, Z, ox, oz)
    a0 = int(round(base)); data = {'alt': [a0, a0 + int(round(Hs[i1]))], 'realKm': round(race / 1000, 2), 'finish': [round(float(X[i1]), 1), round(float(Z[i1]), 1)],
            'cps': cps, 'curves': curves, 'dem': terrain(X, Z, ox, oz, base), 'lc': landcover(X, Z, ox, oz), 'farDem': fd, 'far': {'lake': lake}}
    data.update(scenery(X, Z, ox, oz))
    data['points'] = pts
    keys = ['alt', 'realKm', 'finish', 'cps', 'curves', 'dem', 'lc', 'farDem', 'far', 'views', 'gates', 'bld', 'huts', 'fences', 'parks', 'steps', 'paths', 'cliffs', 'streams', 'points']
    A, B = '    // ---- podatki (tools/ngorongoro/build.py) ----\n', '    // ---- konec podatkov ----\n'
    blk = A + ''.join('    %s: %s,\n' % (k_, jsval(data[k_])) for k_ in keys) + B
    src = open(TRACK).read(); i, j = src.index(A), src.index(B) + len(B); src = src[:i] + blk + src[j:]
    hA = '  const NGORONGORO_H = ['; i = src.index(hA); j = src.index('];', i); src = src[:i] + hA + ','.join(map(str, HE)) + src[j:]
    open(TRACK, 'w').write(src); log('written', TRACK, '%d KB' % (len(src.encode()) // 1024))
    if '--png' in sys.argv:   # the plan of the road (white, the bends marked) over the ground model's shading, and its profile (red; the tool's grey)
        p = sys.argv[sys.argv.index('--png') + 1]; c = 0.4; xa, xb, za, zb = X.min() - 150, X.max() + 150, Z.min() - 150, Z.max() + 150
        im = Image.new('RGB', (int((xb - xa) * c), int((zb - za) * c) + 260), (30, 30, 30)); d = ImageDraw.Draw(im); P = lambda a, b: ((a - xa) * c, (b - za) * c)
        d.line([P(a, b) for a, b in zip(X, Z)], fill=(255, 255, 255), width=2)
        for sa, tot, r in bends: q = int(sa); d.text(P(X[q] + 8, Z[q]), '%.0f r%.0f' % (sa - s[i0], r), fill=(255, 220, 0) if abs(tot) > math.radians(112) else (160, 160, 160))
        y0 = im.size[1] - 10; sy = 240 / (H.max() - H.min()); sx = im.size[0] / s[-1]
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], tgt[::5])], fill=(140, 140, 140), width=1)
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], H[::5])], fill=(255, 60, 60), width=2)
        im.save(p); log('plan', p, im.size)

if __name__ == '__main__':
    main()
