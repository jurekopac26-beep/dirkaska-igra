# The terrain of the Hakone lap -> tools/hakone/podatki/teren.json (format: docs/proga-hakone.md, "Podatki"). After pot.py.
#  dem   the corridor: Copernicus DEM GLO-30 on a 32 m grid, the canopy taken out (Meta / WRI canopy heights x CANOPY: the surface model stands
#        on the tree tops), in the form js/world-vrsic.js vrPrep reads (a 256 m trend, 1 m residuals within 650 m of the road)
#  far   the view beyond the corridor: the same model on a 200 m grid over the Hakone caldera, Odawara and the coast of Sagami Bay (heights,
#        WorldCover land cover, Lake Ashi and the sea as runs of wet nodes)
#  fuji  the view to the west-north-west on a 500 m grid: Mount Fuji, the Gotemba plain, the Ashigara hills
#  lakes the lakes near the road and Lake Ashi whole (OpenStreetMap shore lines), peaks (OpenStreetMap names and heights, Mount Fuji)
# Usage: python3 -I tools/hakone/teren.py
import json, math, os, sys
import numpy as np
sys.dont_write_bytecode = True   # (no __pycache__ in the repository)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import osm, frame, line, Dem, worldcover, canopy, merc, sample_grid, rle_lc, b64, save

CANOPY = 0.6      # the share of the canopy height the surface model stands above the ground in the woods (X-band radar: most of the crown)
F = frame(); LN, P = line(); dem = Dem()
px = np.array(P['points']); base = P['h'][0]
# ---------------- the corridor ----------------
CELL, M, NEAR = 32.0, 720.0, 650.0
x0 = math.floor((px[:, 0].min() - M) / CELL) * CELL; z0 = math.floor((px[:, 1].min() - M) / CELL) * CELL
nx = int(math.ceil((px[:, 0].max() + M - x0) / CELL)) + 1; nz = int(math.ceil((px[:, 1].max() + M - z0) / CELL)) + 1
gx, gz = np.meshgrid(x0 + np.arange(nx) * CELL, z0 + np.arange(nz) * CELL)
la, lo = F.ll(gx, gz); H = dem.sample(la.ravel(), lo.ravel()).reshape(nz, nx)
# the canopy out: its mean height over each cell (the canopy model averaged to ~10 m, sampled at the cell's 3 x 3 sub-points)
lat_a, lon_a = la.min() - 0.003, lo.min() - 0.003; lat_b, lon_b = la.max() + 0.003, lo.max() + 0.003
try:
    C, cx0, cy0, cd = canopy(lat_a, lon_a, lat_b, lon_b, 'corridor', down=8)
    ch = np.zeros_like(H)
    for ox in (-10.7, 0, 10.7):
        for oz in (-10.7, 0, 10.7):
            l2, o2 = F.ll(gx + ox, gz + oz); mx, my = merc(l2, o2); ch += sample_grid(C, cx0, cy0, cd, mx, my) / 9
    Hd = H - CANOPY * ch
    print('canopy: mean %.1f m over the corridor, %.0f %% of cells over 10 m' % (ch.mean(), 100 * np.mean(ch > 10)))
except Exception as e:
    print('no canopy heights (%s): the surface model as it is' % str(e)[:100]); Hd = H; ch = None
# the cells near the road: the residuals' spans
dist = np.full((nz, nx), np.inf); pts = px[::2]   # (the distance from the road, row by row)
for j in range(nz):
    zz = z0 + j * CELL; m = np.abs(pts[:, 1] - zz) < NEAR + CELL
    if not m.any(): continue
    q = pts[m]; d = np.sqrt((gx[j][:, None] - q[None, :, 0]) ** 2 + (zz - q[None, :, 1]) ** 2).min(axis=1); dist[j] = d
F8 = 8; tnx = int(math.ceil((nx - 1) / F8)) + 1; tnz = int(math.ceil((nz - 1) / F8)) + 1
tx, tz = x0 + np.arange(tnx) * F8 * CELL, z0 + np.arange(tnz) * F8 * CELL
TX, TZ = np.meshgrid(tx, tz); tla, tlo = F.ll(TX, TZ)
# the trend: the terrain averaged over each trend node's 256 m square (the same model, the canopy out as above, on a 32 m sub-grid)
T = np.zeros((tnz, tnx))
for j in range(tnz):
    for i in range(tnx):
        a, b = j * F8, i * F8; blk = Hd[max(0, a - 4):a + 5, max(0, b - 4):b + 5]
        if blk.size: T[j, i] = blk.mean()
        else:
            l2, o2 = F.ll(TX[j, i], TZ[j, i]); T[j, i] = float(dem.sample(l2, o2)[0])
lo_t = math.floor(T.min()) - 1.0; tv = np.clip(np.round((T - lo_t) / 0.1), 0, 65535).astype(np.uint16)
Tq = lo_t + tv * 0.1
def trend_at(i, j):
    fi, fj = i / F8, j / F8; ti = min(tnx - 2, int(fi)); tj = min(tnz - 2, int(fj)); u, v = fi - ti, fj - tj
    return (Tq[tj, ti] * (1 - u) + Tq[tj, ti + 1] * u) * (1 - v) + (Tq[tj + 1, ti] * (1 - u) + Tq[tj + 1, ti + 1] * u) * v
rows, res, clip = [], bytearray(), 0
for j in range(nz):
    near = np.where(dist[j] <= NEAR)[0]
    if not len(near): rows.append([0, 0]); continue
    a, b = int(near[0]), int(near[-1]) + 1; rows.append([a, b - a])
    for i in range(a, b):
        r = int(round(Hd[j, i] - trend_at(i, j)))
        if r < -128 or r > 127: clip += 1; r = max(-128, min(127, r))
        res.append(r + 128)
tb = bytearray()
for v in tv.ravel(): tb += bytes([int(v) >> 8, int(v) & 255])
demo = {'x0': x0, 'z0': z0, 'nx': nx, 'nz': nz, 'cell': CELL, 'base': round(base, 2),
        'tr': {'f': F8, 'nx': tnx, 'nz': tnz, 'lo': lo_t, 'step': 0.1, 'b64': b64(tb)}, 'rows': rows, 'res': b64(res)}
print('corridor dem %d x %d (%.1f x %.1f km), %d residual cells (%d clipped to +-128 m), %.0f KB' % (nx, nz, nx * CELL / 1000, nz * CELL / 1000, len(res), clip, (len(demo['res']) + len(demo['tr']['b64'])) / 1024))
# ---------------- the far views ----------------
WC_CLS = {10: 1, 20: 2, 30: 0, 40: 6, 50: 3, 60: 4, 70: 4, 80: 5, 90: 0, 95: 1, 100: 0, 0: 5}   # -> 0 open, 1 forest, 2 shrubs, 3 built-up, 4 bare, 5 water, 6 fields
N_, NT, W, R = osm()
def ring(rel):   # the outer ring of a multipolygon relation, its ways joined end to end
    segs = [list(W[ref][0]) for typ, ref, role in R[rel][0] if typ == 'way' and role in ('outer', '') and ref in W]
    out = segs.pop(0)
    while segs:
        for k, sg in enumerate(segs):
            if sg[0] == out[-1]: out += sg[1:]; segs.pop(k); break
            if sg[-1] == out[-1]: out += sg[::-1][1:]; segs.pop(k); break
        else: break
    return out
def poly_xz(ids):
    ids = [i for i in ids if i in N_]; xs, zs = F.xz([N_[i][0] for i in ids], [N_[i][1] for i in ids]); return np.stack([xs, zs], 1)
def inpoly(pg, x, z):   # even-odd rule, vectorised over points
    x = np.asarray(x, dtype=np.float64); z = np.asarray(z, dtype=np.float64); inside = np.zeros(x.shape, bool); n = len(pg)
    for k in range(n):
        ax, az = pg[k]; bx, bz = pg[(k + 1) % n]
        c = ((az > z) != (bz > z)) & (x < (bx - ax) * (z - az) / (bz - az + 1e-12) + ax); inside ^= c
    return inside
def dp(pg, tol):   # Douglas-Peucker on a closed ring
    pg = np.asarray(pg)
    def rec(a, b):
        if b <= a + 1: return [a]
        ax, az = pg[a]; bx, bz = pg[b]; dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
        d = np.abs((pg[a + 1:b, 0] - ax) * dz - (pg[a + 1:b, 1] - az) * dx) / L; k = int(np.argmax(d))
        return rec(a, a + 1 + k) + rec(a + 1 + k, b) if d[k] > tol else [a]
    n = len(pg) - 1 if np.allclose(pg[0], pg[-1]) else len(pg)   # (a closed ring: split at the point farthest from the first)
    if n < 4: return pg[:n]
    kf = int(np.argmax(np.hypot(pg[:n, 0] - pg[0, 0], pg[:n, 1] - pg[0, 1])))
    pg = np.concatenate([pg[:n], pg[:1]]); idx = rec(0, kf) + rec(kf, n); return pg[idx]
ashi = poly_xz(ring(10349338)); ASHI_H = 723.0
def far_grid(name, lat0, lon0, lat1, lon1, cell, lo_h=-20.0, point=False, node=None):
    xa, za = F.xz(lat1, lon0); xb, zb = F.xz(lat0, lon1); ax, az = (float(node[0]) % cell, float(node[1]) % cell) if node else (0.0, 0.0)   # (node: a point the grid has a node on)
    fx0 = math.floor((float(xa) - ax) / cell) * cell + ax; fz0 = math.floor((float(za) - az) / cell) * cell + az; fnx = int((float(xb) - fx0) / cell) + 1; fnz = int((float(zb) - fz0) / cell) + 1
    GX, GZ = np.meshgrid(fx0 + np.arange(fnx) * cell, fz0 + np.arange(fnz) * cell); la2, lo2 = F.ll(GX, GZ)
    if point: Hf = dem.sample(la2.ravel(), lo2.ravel()).reshape(fnz, fnx)
    else:   # the mean of 5 x 5 points over the node's cell (no aliasing of the 30 m model)
        Hf = np.zeros(GX.shape)
        for ox in np.linspace(-0.4, 0.4, 5) * cell:
            for oz in np.linspace(-0.4, 0.4, 5) * cell:
                l3, o3 = F.ll(GX + ox, GZ + oz); Hf += dem.sample(l3.ravel(), o3.ravel()).reshape(fnz, fnx) / 25
    lake = inpoly(ashi, GX.ravel(), GZ.ravel()).reshape(fnz, fnx)
    sea = (Hf <= 0.5) & ~lake
    Hf[lake] = ASHI_H; Hf[sea] = 0.0
    hv = np.clip(np.round((Hf - lo_h) / 0.5), 0, 65535).astype(np.uint16); hb = bytearray()
    for v in hv.ravel(): hb += bytes([int(v) >> 8, int(v) & 255])
    def runs(mask):
        m = mask.ravel(); out = []; k = 0; cur = False
        while k < len(m):
            j = k
            while j < len(m) and bool(m[j]) == cur: j += 1
            out.append(j - k); k = j; cur = not cur
        return out
    # land cover: the commonest WorldCover class over each node's cell
    a, top, left, d = worldcover(float(la2.min()) - 0.01, float(lo2.min()) - 0.01, float(la2.max()) + 0.01, float(lo2.max()) + 0.01, name)
    lc = np.zeros(GX.shape, np.uint8); half = cell / 2 / 111000
    for j in range(fnz):
        for i in range(fnx):
            r0 = int((top - (la2[j, i] + half)) / d); r1 = int((top - (la2[j, i] - half)) / d) + 1
            c0 = int((lo2[j, i] - half / math.cos(math.radians(35.2)) - left) / d); c1 = int((lo2[j, i] + half / math.cos(math.radians(35.2)) - left) / d) + 1
            blk = a[max(0, r0):max(0, r1), max(0, c0):max(0, c1)]
            if blk.size:
                v, c = np.unique(blk, return_counts=True); lc[j, i] = WC_CLS.get(int(v[np.argmax(c)]), 0)
            else: lc[j, i] = 5 if sea[j, i] else 0
    lc[lake | sea] = 5
    print('%s grid %d x %d at %.0f m (%.1f x %.1f km): heights %.0f..%.0f m, lake nodes %d, sea nodes %d' % (name, fnx, fnz, cell, fnx * cell / 1000, fnz * cell / 1000, Hf.min(), Hf.max(), lake.sum(), sea.sum()))
    return {'x0': fx0, 'z0': fz0, 'nx': fnx, 'nz': fnz, 'cell': cell, 'lo': lo_h, 'step': 0.5, 'b64': b64(hb), 'lake': runs(lake), 'lakeH': ASHI_H, 'sea': runs(sea), 'lc': rle_lc(lc)}
far = far_grid('far', 35.12, 138.98, 35.32, 139.22, 200.0)
fuji = far_grid('fuji', 35.15, 138.55, 35.55, 138.98, 500.0, point=True, node=F.xz(35.36075, 138.72743))   # (a node on the summit)
# ---------------- lakes and peaks ----------------
lakes = [{'name': 'Ashi', 'ja': '芦ノ湖', 'h': ASHI_H, 'poly': [[round(float(a), 1), round(float(b), 1)] for a, b in dp(ashi, 8.0)]}]
for wid, (refs, t) in W.items():
    if t.get('natural') != 'water' or t.get('water') == 'river' or refs[0] != refs[-1]: continue
    pg = poly_xz(refs)
    if len(pg) < 4: continue
    dmin = min(LN.near(float(a), float(b), 400)[0] for a, b in pg[::max(1, len(pg) // 40)])
    if dmin > 300: continue
    area = 0.5 * abs(np.dot(pg[:, 0], np.roll(pg[:, 1], 1)) - np.dot(pg[:, 1], np.roll(pg[:, 0], 1)))
    lp, lo_ = F.ll(pg[:, 0], pg[:, 1]); hh = float(np.percentile(dem.sample(lp, lo_), 20))
    lakes.append({'name': t.get('name:en') or t.get('name:ja-Latn') or t.get('name') or 'pond', 'ja': t.get('name'), 'h': round(hh, 1), 'area': round(area), 'near': round(dmin, 1), 'osm': wid, 'poly': [[round(float(a), 1), round(float(b), 1)] for a, b in dp(pg, 2.0)]})
peaks = []
for nid, t in NT.items():
    if t.get('natural') in ('peak', 'volcano') and nid in N_ and t.get('name'):
        x, z = F.xz(*N_[nid]); peaks.append({'name': t.get('name:en') or t.get('name:ja-Latn') or t.get('name'), 'ja': t['name'], 'x': round(float(x)), 'z': round(float(z)), 'h': float(t['ele']) if t.get('ele', '').replace('.', '').isdigit() else round(float(dem.sample(*N_[nid])[0]))})
x, z = F.xz(35.36075, 138.72743); peaks.append({'name': 'Mount Fuji', 'ja': '富士山', 'x': round(float(x)), 'z': round(float(z)), 'h': 3776.0})
save('teren.json', {
    'about': 'The terrain of the Hakone lap: Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA), the canopy taken out with the High Resolution Canopy Height Maps (Meta and World Resources Institute 2024, CC BY 4.0); land cover © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium (CC BY 4.0); lakes and peaks © OpenStreetMap contributors (ODbL 1.0). Made by tools/hakone/teren.py; format in docs/proga-hakone.md.',
    'dem': demo, 'far': far, 'fuji': fuji, 'lakes': lakes, 'peaks': sorted(peaks, key=lambda p: -p['h'])})
print('lakes:', [(l['name'], l.get('near'), len(l['poly'])) for l in lakes]); print('peaks:', [(p['name'], p['h']) for p in sorted(peaks, key=lambda p: -p['h'])][:14])
