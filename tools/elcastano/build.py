# El Castaño, Venezuela: the game's track data from the track's data (tools/elcastano/elcastano.json and its PNG grids, made by
# tools/proga-podatki.py with tools/elcastano/config.json), the track: docs/proge/elcastano.md.
#   python3 -I tools/elcastano/build.py [--png P]   -> the data block and ELC_H in js/tracks/elcastano.js (between »podatki
#                                                    (tools/elcastano/build.py)« and »konec podatkov«; the rest of the file is written by hand);
#                                                    --png: a plan and a profile
# What it does: the centre line (OpenStreetMap, the regional road L-6 every 5 m) on 1 m samples, the legs of its many hairpins pushed apart to
# GAP m where they come closer and their tips (OSM's corners, some under 2 m round) opened to RMIN m; the heights: the profile nearest the
# ground model along the road (least squares, a 35 m running median of it as the target), its grade at most GMAX up and GDN down and at most
# ~GTIP x GMAX in the tips of the hairpins, its changes of grade smooth; the terrain (dem: the ground model on its 20 m grid, an 80 m trend in
# 0.1 m steps and 1 m residuals within 600 m of the road, the forms js/world-vrsic.js vrPrep reads), the land cover (lc, 16 m cells,
# run-length coded in World.gore's classes: 0 open, 1 forest, 2 shrubs, 3 built-up, 4 rock, 5 water; ESA WorldCover 2021), the land beyond
# the corridor (farDem: Copernicus DEM on a 250 m grid ~10 km round, lo + v / 2 metres, as js/world-iroha.js irFar reads it: the ridges of
# the coastal range, in the national park) and the scenery (OpenStreetMap: the road's three bridges, the river and the streams).
import base64, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d
from scipy.optimize import lsq_linear
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'elcastano.json'))); CFG = json.load(open(os.path.join(HERE, 'config.json')))
TRACK = os.path.join(ROOT, 'js', 'tracks', 'elcastano.js')
HW = 4.0       # the game's half width of the road (def.halfWidth; the real road ~6 m, OSM's width 4 m)
GAP = 12.5     # the least distance between two legs of a hairpin (centre lines), m: the game's road and a 4.5 m bank between them
RMIN = 6.0     # the least radius of the centre line in the tips of the hairpins, m (OSM's corners 1.8-10 m)
GMAX = 0.14    # the steepest grade of the game's road up (the model: 13.5 % at most)
GDN = 0.06     # ... and down (the climb dips a little along the river)
GTIP = 0.55    # the share of GMAX left at a hairpin's apex (a Gaussian dip of 18 m round it): ~8 %
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

def log(*a): print(*a, flush=True)

# ---- the frame of elcastano.json (tools/proga-podatki.py Frame: metres, origin its first route point, x east, z south, WGS84 radii at lat0) ----
A_WGS, E2 = 6378137.0, 6.69437999014e-3
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)
LAT0, LON0 = J['lat0'], J['lon0']; RM, RN = radii(LAT0); CL = math.cos(math.radians(LAT0))
def xz(lat, lon): return (np.radians(np.asarray(lon, float) - LON0) * RN * CL, -np.radians(np.asarray(lat, float) - LAT0) * RM)

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
    """The tips of the hairpins opened up to the radius rmin (as tools/proga/proga.py widen): where the line bends tighter, blended a step at a
    time with a 3 m Gaussian of itself round the apex (+-10 m). u (the original arc length) is carried along."""
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

def profile(u, s, tips):
    """The road's heights on the 1 m line (u: the data's arc length at each sample): the profile nearest the target (a 35 m running median of the
    ground model under the line; least squares, on 5 m steps), its grade between -GDN and GMAX and at most GMAX x ~GTIP round the hairpins'
    apexes (tips: s of each), its changes of grade penalised (no kinks)."""
    ds = 5.0; n = int(s[-1] // ds) + 1; sc = np.arange(n) * ds
    tgt = np.interp(np.interp(sc, s, u), S5, ndimage.median_filter(HRAW, size=7, mode='nearest'))
    gm = np.full(n - 1, GMAX); mid = (sc[1:] + sc[:-1]) / 2
    for t in tips: gm *= 1 - (1 - GTIP) * np.exp(-((mid - t) / 18.0) ** 2)
    # the unknowns: h0 and the n-1 grades; rows: the heights (h0 + the grades' sum) against the target, the grades' changes (weight LAM)
    LAM = 9.0; A = np.zeros((n + n - 2, n)); A[:n, 0] = 1
    for i in range(1, n): A[i, 1:i + 1] = ds
    for i in range(n - 2): A[n + i, 1 + i] = -LAM * ds; A[n + i, 2 + i] = LAM * ds
    b = np.concatenate([tgt, np.zeros(n - 2)])
    lo = np.concatenate([[-np.inf], -np.minimum(gm, GDN)]); hi = np.concatenate([[np.inf], gm])
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
    i0, j0 = max(0, i0), max(0, j0); x0, z0 = g['x0'] + i0 * cell, g['z0'] + j0 * cell
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

LC_NAMES = ['open', 'forest', 'shrubs', 'built', 'rock', 'water']

def landcover(X, Z, ox, oz):
    """def.lc: 16 m cells over the corridor (the road's box and 470 m), run-length coded in World.gore's classes: 0 open (WorldCover's
    grassland and crops), 1 forest (its trees: the cloud forest), 2 shrubs, 3 built-up, 4 bare rock, 5 water (and wetland)."""
    g, lc = grid('lc'); cell = 16.0; M = 470
    x0 = math.floor((X.min() - M) / cell) * cell; z0 = math.floor((Z.min() - M) / cell) * cell
    nx = int(math.ceil((X.max() + M - x0) / cell)); nz = int(math.ceil((Z.max() + M - z0) / cell))
    GX, GZ = np.meshgrid(x0 + (np.arange(nx) + 0.5) * cell, z0 + (np.arange(nz) + 0.5) * cell)
    votes = np.zeros((6, nz, nx)); MAPC = {10: 1, 20: 2, 30: 0, 40: 0, 50: 3, 60: 4, 80: 5, 90: 5}
    for fx in (-0.3, 0.3):
        for fz in (-0.3, 0.3):
            a = bilin(lc.astype(float), g, GX + fx * cell + ox, GZ + fz * cell + oz, 0).astype(int)
            for k, c in MAPC.items(): votes[c] += (a == k)
            votes[1] += (a == 0) * 0.5   # (beyond the land cover's reach: the forest)
    cls = votes.argmax(0).astype(np.uint8); cnt = np.bincount(cls.ravel(), minlength=6)
    log('land cover (16 m): ' + ', '.join('%s %d' % (nm, cnt[k]) for k, nm in enumerate(LC_NAMES)))
    return {'x0': float(x0), 'z0': float(z0), 'nx': nx, 'nz': nz, 'cell': cell, 'rle': rle64(cls)}

def far(X, Z, ox, oz):
    """def.farDem (as irFar reads it): the surface model on a 250 m grid ~10 km round the middle of the road, each node half its own height and
    half the highest round it (the ridges keep their height), lo + v / 2 metres; no lakes."""
    g, H = grid('far'); R, cell = 10000, 250
    cx, cz = (X.min() + X.max()) / 2, (Z.min() + Z.max()) / 2
    x0 = math.floor((cx - R) / cell) * cell; z0 = math.floor((cz - R) / cell) * cell; n = int(2 * R / cell) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell)
    h = bilin(H, g, GX + ox, GZ + oz); acc = h.copy()
    for dx, dz in [(-80, 0), (80, 0), (0, -80), (0, 80)]: acc = np.maximum(acc, bilin(H, g, GX + dx + ox, GZ + dz + oz))
    h = 0.5 * h + 0.5 * acc
    lo = int(math.floor(h.min() / 10) * 10); v = np.clip(np.round((h - lo) * 2), 0, 65535).astype('>u2')
    log('far: %d x %d nodes of %d m, %.0f-%.0f m' % (n, n, cell, h.min(), h.max()))
    return {'x0': float(x0), 'z0': float(z0), 'nx': n, 'nz': n, 'cell': cell, 'lo': lo, 'b64': b64(v.tobytes()), 'lake': [n * n]}

# ================= the scenery =================
def scenery(X, Z, s, u, i0, ox, oz):
    r1 = lambda v: round(float(v), 1); out = {}
    # the bridges (OSM's bridge=yes on the road: [from, to] in metres after the start line; js/core.js: no barriers there, the deck drawn by
    # js/world-elcastano.js over the stream)
    out['bridges'] = [[r1(np.interp(a, u, s) - s[i0]), r1(np.interp(b, u, s) - s[i0])] for a, b in J['bridges']]
    # the river and the streams (OSM, within 480 m): def.riverBeds [width, x, z, ...] every ~8 m in the game's frame (js/world-vrsic.js vrPrep:
    # World.gore draws the water down each bed); the Río Madre Vieja ~6 m wide, the quebradas ~3 m, the unnamed streams ~2 m
    beds = []
    for kind, name, _, xs in J['water']:
        a = np.array(xs, float).reshape(-1, 2) - [ox, oz]
        if len(a) < 2: continue
        d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(a, axis=0).T))]); n = max(2, int(math.ceil(d[-1] / 8)) + 1); t = np.linspace(0, d[-1], n)
        w = 6 if kind == 'river' else 3 if name else 2
        beds.append([w] + [r1(v) for q in zip(np.interp(t, d, a[:, 0]), np.interp(t, d, a[:, 1])) for v in q])
    out['riverBeds'] = beds
    return out

def jsval(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
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
    tight = [(sa, tot, r) for sa, tot, r in bends if abs(tot) > math.radians(112)]   # (the bends flattened in the profile)
    hp = [(sa, tot, r) for sa, tot, r in tight if abs(tot) > math.radians(125)]   # (the serpentines: the HUD's and the commentator's, def.curves)
    log('line: %.0f m (run-up %.0f, race %.0f, past the finish %.0f); legs %.1f m apart at least (OSM %.1f), moved %.1f m on average, %.1f at most; '
        'tips opened in %d steps; %d serpentines (%d bends over 112 deg), the tightest %.1f m' % (s[-1], s[i0], s[i1] - s[i0], s[-1] - s[i1], legs_gap(X, Z), g0, mm, max(mx, mx2), nw,
                                                                                         len(hp), len(tight), min(r for _, _, r in tight)))
    for sa, tot, r in tight: log('  bend at %.0f m: %.0f deg, r %.1f m' % (sa - s[i0], math.degrees(tot), r))
    H, tgt = profile(u, s, [sa for sa, _, _ in tight])
    # the finish a whole number of metres above the start line (the last 400 m before it a few cm steeper or flatter): the game's altitudes
    # (Track.altAt) scale the road's heights by def.alt's difference over the road's own
    dF = round(H[i1] - H[i0]) - (H[i1] - H[i0]); H = H + dF * np.clip((s - (s[i1] - 400)) / 400, 0, 1)
    base = float(H[i0]); Hs = H - base; g = np.gradient(H, s)
    log('heights: start %.1f, finish %.1f m; steepest %.1f %% up, %.1f %% down; off the target by %.1f m at most' % (
        H[i0], H[i1], g[i0:i1].max() * 100, -g[i0:i1].min() * 100, float(np.abs(H - tgt).max())))
    nE = int(round(s[-1] / 4)); fr = np.linspace(0, s[-1], nE + 1); HE = np.round(np.interp(fr, s, Hs) * 10).astype(int).tolist()
    pts = [[round(float(X[i]), 2), round(float(Z[i]), 2)] for i in range(0, len(X), 5)]
    if (len(X) - 1) % 5: pts.append([round(float(X[-1]), 2), round(float(Z[-1]), 2)])
    race = s[i1] - s[i0]; cps = []
    for f in (0.2, 0.4, 0.6, 0.8):   # the checkpoints: near each fifth of the race, on a straighter bit
        t = s[i0] + f * race; cand = [i for i in range(len(s)) if abs(s[i] - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(s[i] - t) / 60)
        cps.append([round(float(X[best]), 1), round(float(Z[best]), 1)])
    curves = [[round(float(sa - s[i0]), 1), int(round(float(np.interp(sa, s, H)))), 1 if tot > 0 else -1] for sa, tot, r in hp if s[i0] < sa < s[i1]]
    log('curves', curves); log('cps', cps)
    a0 = int(round(base)); data = {'alt': [a0, a0 + int(round(Hs[i1]))], 'realKm': round(race / 1000, 2), 'finish': [round(float(X[i1]), 1), round(float(Z[i1]), 1)], 'cps': cps, 'curves': curves,
            'dem': terrain(X, Z, ox, oz, base), 'lc': landcover(X, Z, ox, oz), 'farDem': far(X, Z, ox, oz)}
    data.update(scenery(X, Z, s, u, i0, ox, oz))
    data['points'] = pts
    keys = ['alt', 'realKm', 'finish', 'cps', 'curves', 'bridges', 'dem', 'lc', 'farDem', 'riverBeds', 'points']
    A, B = '    // ---- podatki (tools/elcastano/build.py) ----\n', '    // ---- konec podatkov ----\n'
    blk = A + ''.join('    %s: %s,\n' % (k_, jsval(data[k_])) for k_ in keys) + B
    src = open(TRACK).read(); i, j = src.index(A), src.index(B) + len(B); src = src[:i] + blk + src[j:]
    hA = '  const ELC_H = ['; i = src.index(hA); j = src.index('];', i); src = src[:i] + hA + ','.join(map(str, HE)) + src[j:]
    open(TRACK, 'w').write(src); log('written', TRACK, '%d KB' % (len(src.encode()) // 1024))
    if '--png' in sys.argv:   # the plan of the road (white, the serpentines marked, the legs' 9 m road in grey) and its profile (red; the target grey)
        p = sys.argv[sys.argv.index('--png') + 1]; c = 0.45; xa, xb, za, zb = X.min() - 60, X.max() + 60, Z.min() - 60, Z.max() + 60
        im = Image.new('RGB', (int((xb - xa) * c), int((zb - za) * c) + 260), (30, 30, 30)); d = ImageDraw.Draw(im); P = lambda a, b: ((a - xa) * c, (b - za) * c)
        d.line([P(a - ox, b - oz) for a, b in L], fill=(200, 40, 40), width=1)
        d.line([P(a, b) for a, b in zip(X, Z)], fill=(255, 255, 255), width=2)
        for sa, tot, r in tight: q = int(sa); d.text(P(X[q] + 8, Z[q]), '%.0f r%.0f' % (sa - s[i0], r), fill=(255, 220, 0))
        y0 = im.size[1] - 10; sy = 240 / (H.max() - H.min()); sx = im.size[0] / s[-1]
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], tgt[::5])], fill=(140, 140, 140), width=1)
        d.line([(a * sx, y0 - (b - H.min()) * sy) for a, b in zip(s[::5], H[::5])], fill=(255, 60, 60), width=2)
        for q in (i0, i1): d.line([(s[q] * sx, y0), (s[q] * sx, y0 - 240)], fill=(80, 160, 255))
        im.save(p); log('plan', p, im.size)

if __name__ == '__main__':
    main()
