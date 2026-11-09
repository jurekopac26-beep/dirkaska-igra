# Santo Antão, Zelenortski otoki: the game's track data from the track's data (tools/santoantao/santoantao.json and its PNG grids, made by
# tools/proga-podatki.py with tools/santoantao/config.json). Plan: docs/nove-proge-1-0.md (Del 2, Santo Antão), the track: docs/proge/santoantao.md.
#   python3 -I tools/santoantao/build.py --osm RAW   -> first tools/santoantao/extra.json from the tool's OSM download (RAW/santoantao-osm.json):
#                                                       the viewpoints and the information board on the Delgadim saddle, the paths along the
#                                                       ridge, the houses and the fields in the valleys below (within 600 m)
#   python3 -I tools/santoantao/build.py [--png P]   -> the data block and SANTOANTAO_H in js/tracks/santoantao.js (between »podatki
#                                                       (tools/santoantao/build.py)« and »konec podatkov«; the rest of the file is written by
#                                                       hand); --png: a plan and a profile of the road
# What it does: the centre line (OpenStreetMap, every 5 m) on 1 m samples (its hairpins' legs are 26 m apart at least and their tips' radius
# 9.7 m: the line as it is); the heights (the ground model can't see the road on the knife-edge of the Delgadim ridge, its 30 m cells averaging
# the drops on both sides, nor in the cuts into the slopes lower down; the tool's profile, an envelope of the model along the road, smoothed,
# with grades up to 16 %, as a target): the profile nearest it (least squares) with its grade at most 12 % and at most ~6 % in the tips of the
# hairpins (as built: flatter round the tips), its changes of grade smooth; the terrain (dem: the ground model on its 20 m grid, an 80 m trend
# in 0.1 m steps and 1 m residuals within 600 m of the road, the forms js/world-vrsic.js vrPrep reads), the land cover (lc, 16 m cells,
# run-length coded: 0 grass, 1 trees, 2 shrubs, 3 built-up, 4 bare ground and rock, 5 water, 6 fields; ESA WorldCover 2021, OpenStreetMap's
# bare rock, fields and woods), the land beyond the corridor (farDem: Copernicus DEM on a 300 m grid ~12 km round, lo + v / 2 metres, the sea
# as its wet nodes, as js/world-iroha.js irFar reads it) and the scenery (OpenStreetMap: the viewpoints and the board on the saddle, the paths,
# the houses and the fields in the valleys, the rock outcrops and the cliffs, the lone tree).
import base64, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d
from scipy.optimize import lsq_linear
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'santoantao.json'))); CFG = json.load(open(os.path.join(HERE, 'config.json')))
TRACK = os.path.join(ROOT, 'js', 'tracks', 'santoantao.js')
HW = 4.5       # the game's half width of the road (def.halfWidth)
GMAX = 0.12    # the steepest grade of the game's road
GTIP = 0.5     # the share of it left at a hairpin's apex (a Gaussian dip of 18 m round it): ~6 %
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

def log(*a): print(*a, flush=True)

# ---- the frame of santoantao.json (tools/proga-podatki.py Frame: metres, origin its first route point, x east, z south, WGS84 radii at lat0) ----
A_WGS, E2 = 6378137.0, 6.69437999014e-3
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)
LAT0, LON0 = J['lat0'], J['lon0']; RM, RN = radii(LAT0); CL = math.cos(math.radians(LAT0))
def xz(lat, lon): return (np.radians(np.asarray(lon, float) - LON0) * RN * CL, -np.radians(np.asarray(lat, float) - LAT0) * RM)

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
    d = json.load(open(os.path.join(raw, 'santoantao-osm.json'))); N = d['nodes']; W = d['ways']
    line = np.array(J['line']).reshape(-1, 2); T = cKDTree(line)
    near = lambda P: T.query(P)[0]
    def pts(ns):
        a = np.array([N[n][:2] for n in ns if n in N], float); x, z = xz(a[:, 0], a[:, 1]); return np.stack([x, z], 1)
    r1 = lambda v: round(float(v), 1)
    bld, paths, fields, woods = [], [], [], []
    for wid, (ns, t) in W.items():
        if 'building' in t:   # the houses of the hamlets in the valleys below the ridge (300-600 m off the road; generic, the game names none)
            P = pts(ns)
            if near(P).min() < 600 and len(P) >= 4:
                cx, cz, L, Wd, a = obb(P[:-1] if np.allclose(P[0], P[-1]) else P); bld.append([r1(cx), r1(cz), r1(max(L, 4)), r1(max(Wd, 3.5)), round(a, 3)])
        elif t.get('highway') in ('footway', 'path', 'track'):   # the paths down the ridge (the hikers' trail from the saddle) within 80 m
            P = pts(ns); m = near(P) < 80
            if m.sum() >= 2: paths.append([v for p in P[m] for v in (r1(p[0]), r1(p[1]))])
        elif t.get('landuse') in ('farmland', 'orchard') and len(ns) >= 4:   # the terraced fields in the valleys (within 600 m): their outlines
            P = pts(ns)
            if near(P).min() < 600: fields.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
        elif t.get('natural') == 'wood' and len(ns) >= 4:
            P = pts(ns)
            if near(P).min() < 600: woods.append([v for p in P for v in (r1(p[0]), r1(p[1]))])
    views, boards = [], []
    for nid, v in N.items():
        if len(v) < 3 or not v[2]: continue
        tg = v[2]; x, z = xz(v[0], v[1]); dd = near([[float(x), float(z)]])[0]
        if tg.get('tourism') == 'viewpoint' and dd < 90: views.append([r1(x), r1(z)])
        elif tg.get('tourism') == 'information' and dd < 60: boards.append([r1(x), r1(z)])   # (a nature board on the saddle: generic in the game, no text of its own)
    out = {'about': 'Santo Antão, Zelenortski otoki: OSM extras for tools/santoantao/build.py (© OpenStreetMap contributors, ODbL 1.0), in the frame of '
                    'santoantao.json (metres from its first route point, x east, z south): bld [x, z, length, width, angle] (the houses within 600 m), '
                    'paths [[x, z, ...]] (footways, paths and tracks within 80 m), fields [[x, z, ...]] (the outlines of the fields and orchards within 600 m), '
                    'woods [[x, z, ...]] (within 600 m), views [x, z] (viewpoints within 90 m), boards [x, z] (information boards within 60 m)',
           'bld': bld, 'paths': paths, 'fields': fields, 'woods': woods, 'views': views, 'boards': boards}
    json.dump(out, open(os.path.join(HERE, 'extra.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    log('extra.json: %d houses, %d paths, %d fields, %d woods, %d viewpoints, %d boards' % (len(bld), len(paths), len(fields), len(woods), len(views), len(boards)))

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

def profile(u, s, tips):
    """The road's heights on the 1 m line (u: the data's arc length at each sample): the profile nearest the tool's (least squares, on 5 m
    steps), its grade at most GMAX and less round the hairpins' apexes (tips: s of each), its changes of grade penalised (no kinks)."""
    ds = 5.0; n = int(s[-1] // ds) + 1; sc = np.arange(n) * ds
    tgt = np.interp(np.interp(sc, s, u), S5, HT)
    gm = np.full(n - 1, GMAX); mid = (sc[1:] + sc[:-1]) / 2
    for t in tips: gm *= 1 - (1 - GTIP) * np.exp(-((mid - t) / 18.0) ** 2)
    # the unknowns: h0 and the n-1 grades; rows: the heights (h0 + the grades' sum) against the target, the grades' changes (weight LAM)
    LAM = 9.0; A = np.zeros((n + n - 2, n)); A[:n, 0] = 1
    for i in range(1, n): A[i, 1:i + 1] = ds
    for i in range(n - 2): A[n + i, 1 + i] = -LAM * ds; A[n + i, 2 + i] = LAM * ds
    b = np.concatenate([tgt, np.zeros(n - 2)])
    lo = np.concatenate([[-np.inf], -gm]); hi = np.concatenate([[np.inf], gm])
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

def poly_mask(polys, ox, oz, x0, z0, nx, nz, cell):   # the cells (centres) inside any of the outlines [[x, z, ...]] (the data's frame)
    im = Image.new('L', (nx, nz), 0); dr = ImageDraw.Draw(im)
    for p in polys:
        P = np.array(p).reshape(-1, 2)
        if len(P) >= 3: dr.polygon([((a - ox - x0) / cell - 0.5, (b - oz - z0) / cell - 0.5) for a, b in P], fill=1)
    return np.array(im, bool)

def landcover(X, Z, ox, oz):
    """def.lc: 16 m cells over the corridor (the road's box and 470 m), run-length coded: 0 grass (WorldCover's grassland: the dry slopes' grass),
    1 trees (WorldCover's trees, OSM's woods), 2 shrubs, 3 built-up, 4 bare ground and rock (WorldCover's bare, OSM's bare rock on the steep
    faces), 5 water, 6 fields (WorldCover's crops, OSM's fields and orchards: the terraces in the valleys)."""
    g, lc = grid('lc'); _, lu = grid('lu'); cell = 16.0; M = 470
    x0 = math.floor((X.min() - M) / cell) * cell; z0 = math.floor((Z.min() - M) / cell) * cell
    nx = int(math.ceil((X.max() + M - x0) / cell)); nz = int(math.ceil((Z.max() + M - z0) / cell))
    GX, GZ = np.meshgrid(x0 + (np.arange(nx) + 0.5) * cell, z0 + (np.arange(nz) + 0.5) * cell)
    votes = np.zeros((8, nz, nx))
    MAPC = {10: 1, 20: 2, 30: 0, 40: 6, 50: 3, 60: 4, 80: 5, 90: 5}
    _, Hg = grid('dem'); gd = J['grids']['dem']
    for fx in (-0.3, 0.3):
        for fz in (-0.3, 0.3):
            a = bilin(lc.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int); b = bilin(lu.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int)
            for k, c in MAPC.items(): votes[c] += (a == k)
            votes[6] += 1.5 * (b == 3); votes[1] += 1.5 * ((b == 7) | (b == 9))   # (OSM's fields and orchards, its woods)
            votes[0] += (a == 0) * 0.5   # (beyond the land cover's reach: grass, the colours and the rock from the slopes)
    # OSM's bare rock covers nearly all the ridge (its whole mapped area, grass and shrubs too): rock only where it is steep (over ~40 deg)
    hx = bilin(Hg, gd, GX + ox + 8, GZ + oz) - bilin(Hg, gd, GX + ox - 8, GZ + oz); hz = bilin(Hg, gd, GX + ox, GZ + oz + 8) - bilin(Hg, gd, GX + ox, GZ + oz - 8)
    sl = np.hypot(hx, hz) / 16; b = bilin(lu.astype(float), g, GX + ox, GZ + oz, 0).astype(int)
    votes[4] += 3 * ((b == 11) & (sl > 0.85))
    E = json.load(open(os.path.join(HERE, 'extra.json')))
    votes[6] += 3 * poly_mask(E['fields'], ox, oz, x0, z0, nx, nz, cell); votes[1] += 3 * poly_mask(E['woods'], ox, oz, x0, z0, nx, nz, cell)
    cls = votes.argmax(0).astype(np.uint8)
    cnt = np.bincount(cls.ravel(), minlength=8)
    log('land cover (16 m): ' + ', '.join('%s %d' % (n, cnt[k]) for k, n in enumerate(['grass', 'trees', 'shrubs', 'built', 'bare', 'water', 'fields'])))
    return {'x0': float(x0), 'z0': float(z0), 'nx': nx, 'nz': nz, 'cell': cell, 'rle': rle64(cls)}

def far(X, Z, ox, oz):
    """def.farDem (as irFar reads it): the surface model on a 300 m grid ~12 km round the middle of the road, each node half its own height and
    half the highest round it (the ridges keep their height), lo + v / 2 metres; the sea (the model's 0) as its wet nodes (lake: the run
    lengths of dry and wet nodes, from a dry one), drawn flat at the sea's level (def.far.lake)."""
    g, H = grid('far'); R, cell = 11700, 300
    cx, cz = (X.min() + X.max()) / 2, (Z.min() + Z.max()) / 2
    x0 = math.floor((cx - R) / cell) * cell; z0 = math.floor((cz - R) / cell) * cell; n = int(2 * R / cell) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell)
    h = bilin(H, g, GX + ox, GZ + oz); acc = h.copy(); wet = bilin(H, g, GX + ox, GZ + oz, 0) <= 0.05
    for dx, dz in [(-90, 0), (90, 0), (0, -90), (0, 90)]: acc = np.maximum(acc, bilin(H, g, GX + dx + ox, GZ + dz + oz))
    h = np.where(wet, 0, 0.5 * h + 0.5 * acc)
    lo = int(math.floor(h.min() / 10) * 10); v = np.clip(np.round((h - lo) * 2), 0, 65535).astype('>u2')
    w = wet.ravel(); runs = []; cur = False; k = 0
    while k < len(w):
        m = k
        while m < len(w) and bool(w[m]) == cur: m += 1
        runs.append(m - k); k = m; cur = not cur
    log('far: %d x %d nodes of %d m, %.0f %% sea' % (n, n, cell, 100 * w.mean()))
    return {'x0': float(x0), 'z0': float(z0), 'nx': n, 'nz': n, 'cell': cell, 'lo': lo, 'b64': b64(v.tobytes()), 'lake': runs}

# ================= the scenery =================
def scenery(X, Z, ox, oz):
    E = json.load(open(os.path.join(HERE, 'extra.json'))); r1 = lambda v: round(float(v), 1)
    T = cKDTree(np.stack([X, Z], 1)); out = {}
    sh = lambda p: [r1(v - (ox if k % 2 == 0 else oz)) for k, v in enumerate(p)]
    out['views'] = [[r1(v[0] - ox), r1(v[1] - oz)] for v in E['views']]
    out['boards'] = [[r1(v[0] - ox), r1(v[1] - oz)] for v in E['boards']]
    out['paths'] = [sh(p) for p in E['paths']]
    # the houses (all generic: the game names none): [x, z, length, width, angle]
    out['bld'] = [[r1(b[0] - ox), r1(b[1] - oz), b[2], b[3], b[4]] for b in E['bld']]
    # the rock outcrops by the road (OSM's bare rock outlines within 120 m, the road's own strip left out) and the cliffs (the lower side on the right)
    rocks = []
    for kind, p in J['shore']:
        if kind != 'bare_rock': continue
        P = np.array(p).reshape(-1, 2) - [ox, oz]; d = T.query(P)[0]
        if d.min() < 120: rocks.append([v for q in P for v in (r1(q[0]), r1(q[1]))])
    out['rocks'] = rocks
    out['cliffs'] = [sh(c) for c in J['cliffs']]
    out['trees'] = [[r1(t[0] - ox), r1(t[1] - oz)] for t in J['trees']]
    return out

def jsval(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
    if '--osm' in sys.argv: osm_extra(sys.argv[sys.argv.index('--osm') + 1]); return
    L = np.array(J['line']).reshape(-1, 2)
    x, z, s, u = resample(L[:, 0], L[:, 1], 1.0, np.arange(len(L)) * J['step'])
    x = gaussian_filter1d(x, 1.5, mode='nearest'); z = gaussian_filter1d(z, 1.5, mode='nearest')
    x, z, s, u = resample(x, z, 1.0, u)
    rt = CFG['route']; S0 = xz(rt[1][0], rt[1][1]); F0 = xz(rt[-2][0], rt[-2][1])
    i0 = int(np.argmin(np.hypot(x - S0[0], z - S0[1]))); i1 = int(np.argmin(np.hypot(x - F0[0], z - F0[1])))
    ox, oz = float(x[i0]), float(z[i0]); X, Z = x - ox, z - oz   # (the game's origin: the start line)
    bends, k = turns(X, Z, s)
    tight = [(sa, tot, r) for sa, tot, r in bends if abs(tot) > math.radians(112)]   # (the bends flattened in the profile: the hairpins and the tight S-bends)
    hp = [(sa, tot, r) for sa, tot, r in tight if abs(tot) > math.radians(135)]   # (the hairpins: the HUD's and the commentator's, def.curves)
    log('line: %.0f m (run-up %.0f, race %.0f, past the finish %.0f); legs %.1f m apart at least; %d hairpins (%d bends over 112 deg), the tightest %.1f m' % (
        s[-1], s[i0], s[i1] - s[i0], s[-1] - s[i1], legs_gap(X, Z), len(hp), len(tight), min(r for _, _, r in tight)))
    H, tgt = profile(u, s, [sa for sa, _, _ in tight])
    # the finish a whole number of metres below the start line (the last 400 m before it a few cm steeper or flatter): the game's altitudes
    # (Track.altAt) scale the road's heights by def.alt's difference over the road's own
    dF = round(H[i1] - H[i0]) - (H[i1] - H[i0]); H = H + dF * np.clip((s - (s[i1] - 400)) / 400, 0, 1)
    base = float(H[i0]); Hs = H - base; g = np.gradient(H, s)
    top = i0 + int(np.argmax(H[i0:i1]))
    log('heights: start %.1f, the saddle (lowest before the top) %.1f, the top %.1f at %.0f m, finish %.1f m; steepest %.1f %% up, %.1f %% down; off the tool\'s by %.1f m at most' % (
        H[i0], H[i0:top].min(), H[top], s[top] - s[i0], H[i1], g[i0:i1].max() * 100, -g[i0:i1].min() * 100, float(np.abs(H - tgt).max())))
    nE = int(round(s[-1] / 4)); fr = np.linspace(0, s[-1], nE + 1); HE = np.round(np.interp(fr, s, Hs) * 10).astype(int).tolist()
    pts = [[round(float(X[i]), 2), round(float(Z[i]), 2)] for i in range(0, len(X), 5)]
    if (len(X) - 1) % 5: pts.append([round(float(X[-1]), 2), round(float(Z[-1]), 2)])
    race = s[i1] - s[i0]; cps = []
    for f in (0.2, 0.4, 0.6, 0.8):   # the checkpoints: near each fifth of the race, on a straighter bit
        t = s[i0] + f * race; cand = [i for i in range(len(s)) if abs(s[i] - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(s[i] - t) / 60)
        cps.append([round(float(X[best]), 1), round(float(Z[best]), 1)])
    curves = [[round(float(sa - s[i0]), 1), int(round(float(np.interp(sa, s, H)))), 1 if tot > 0 else -1] for sa, tot, r in hp if s[i0] < sa < s[i1]]
    log('curves', curves); log('cps', cps)
    a0 = int(round(base)); data = {'alt': [a0, a0 + int(round(Hs[i1]))], 'altTop': int(round(H[top])), 'top': round(float(s[top] - s[i0]), 1),
            'realKm': round(race / 1000, 2), 'finish': [round(float(X[i1]), 1), round(float(Z[i1]), 1)], 'cps': cps, 'curves': curves,
            'dem': terrain(X, Z, ox, oz, base), 'lc': landcover(X, Z, ox, oz), 'farDem': far(X, Z, ox, oz)}
    data.update(scenery(X, Z, ox, oz))
    data['points'] = pts
    keys = ['alt', 'altTop', 'top', 'realKm', 'finish', 'cps', 'curves', 'dem', 'lc', 'farDem', 'views', 'boards', 'paths', 'bld', 'rocks', 'cliffs', 'trees', 'points']
    A, B = '    // ---- podatki (tools/santoantao/build.py) ----\n', '    // ---- konec podatkov ----\n'
    blk = A + ''.join('    %s: %s,\n' % (k_, jsval(data[k_])) for k_ in keys) + B
    src = open(TRACK).read(); i, j = src.index(A), src.index(B) + len(B); src = src[:i] + blk + src[j:]
    hA = '  const SANTOANTAO_H = ['; i = src.index(hA); j = src.index('];', i); src = src[:i] + hA + ','.join(map(str, HE)) + src[j:]
    open(TRACK, 'w').write(src); log('written', TRACK, '%d KB' % (len(src.encode()) // 1024))
    if '--png' in sys.argv:   # the plan of the road (white, the hairpins marked) over the ground model's shading, and its profile (red; the tool's grey)
        p = sys.argv[sys.argv.index('--png') + 1]; c = 0.5; xa, xb, za, zb = X.min() - 150, X.max() + 150, Z.min() - 150, Z.max() + 150
        im = Image.new('RGB', (int((xb - xa) * c), int((zb - za) * c) + 260), (30, 30, 30)); d = ImageDraw.Draw(im); P = lambda a, b: ((a - xa) * c, (b - za) * c)
        d.line([P(a, b) for a, b in zip(X, Z)], fill=(255, 255, 255), width=2)
        for sa, tot, r in hp: q = int(sa); d.text(P(X[q] + 8, Z[q]), '%.0f r%.0f' % (sa - s[i0], r), fill=(255, 220, 0))
        y0 = im.size[1] - 10; sy = 240 / (H.max() - H.min()); sx = im.size[0] / s[-1]
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], tgt[::5])], fill=(140, 140, 140), width=1)
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], H[::5])], fill=(255, 60, 60), width=2)
        im.save(p); log('plan', p, im.size)

if __name__ == '__main__':
    main()
