# Orodje za podatke proge (docs/nove-proge.md): iz odprtih virov pripravi podatke za js/tracks/<id>.js.
#   python3 tools/proga/proga.py <id> [--zapisi]
# Nastavitve proge so v tools/proga/proge.json (opis polj v tools/proga/README.md). Brez --zapisi samo izpiše povzetek in shrani
# tools/proga/raw/<id>.json; z --zapisi zamenja blok med vrsticama »// ---- podatki (tools/proga) ----« in »// ---- konec podatkov ----«
# v js/tracks/<id>.js (vse drugo v datoteki proge je ročno: imena, komentator, opis).
# Viri: OpenStreetMap prek Overture Maps (ceste, voda, stavbe; ODbL), Copernicus DEM GLO-30 (višine), ESA WorldCover 2021 (raba tal,
# CC BY 4.0), Sentinel-2 L2A (raba tal in barve tal; Contains modified Copernicus Sentinel data), Meta/WRI krošnje (CC BY 4.0).
import heapq, json, math, os, sys
import numpy as np
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from shapely import wkb
from shapely.geometry import LineString, Point, Polygon, MultiPolygon
from shapely.ops import substring

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = json.load(open(os.path.join(HERE, 'proge.json')))

# ---------------- the road: a route over Overture's road segments (split at their connectors), from waypoint to waypoint ----------------
ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'living_street', 'unclassified']
def route(seg, way, G, classes=None):
    """The centre line (x, z arrays, metres) of the shortest route over the roads through the waypoints [(lat, lon), ...] (only roads
    of the given classes: no footpaths, tracks or service roads that would cut across the hairpins)."""
    nodes = {}; adj = {}
    def nid(k):
        if k not in nodes: nodes[k] = len(nodes)
        return nodes[k]
    lines = []
    for r in seg:
        if r.get('subtype') != 'road' or r.get('class') not in (classes or ROADS): continue
        g = wkb.loads(r['geometry']); c = np.array(g.coords); g = LineString(np.stack(G.to_xz(c[:, 1], c[:, 0]), 1)); cons = sorted([(c['at'], c['connector_id']) for c in (r.get('connectors') or [])])
        if not cons or cons[0][0] > 0: cons = [(0.0, r['id'] + ':a')] + cons
        if cons[-1][0] < 1: cons.append((1.0, r['id'] + ':b'))
        for (a, ca), (b, cb) in zip(cons, cons[1:]):
            if b - a < 1e-9: continue
            part = substring(g, a, b, normalized=True); c = np.array(part.coords)   # (the connectors' places: shares of the length in metres)
            x, z = c[:, 0], c[:, 1]; L = float(np.sum(np.hypot(np.diff(x), np.diff(z))))
            i, j = nid(ca), nid(cb); e = len(lines); lines.append((x, z, i, j))
            adj.setdefault(i, []).append((j, L, e, 1)); adj.setdefault(j, []).append((i, L, e, -1))
    # each waypoint: snapped onto the nearest edge, split there
    def snap(lat, lon):
        px, pz = G.to_xz(lat, lon); best = (1e18, 0, 0)
        for e, (x, z, i, j) in enumerate(lines):
            d = np.hypot(x - px, z - pz); k = int(np.argmin(d))
            if d[k] < best[0]: best = (d[k], e, k)
        return best
    X, Z = [], []
    for (la0, lo0), (la1, lo1) in zip(way, way[1:]):
        d0, e0, k0 = snap(la0, lo0); d1, e1, k1 = snap(la1, lo1)
        if e0 == e1:
            x, z = lines[e0][0], lines[e0][1]; sl = slice(k0, k1 + 1) if k1 >= k0 else slice(k0, (k1 - 1) if k1 > 0 else None, -1)
            X += list(x[sl]); Z += list(z[sl]); continue
        # Dijkstra from both ends of e0 (with the part of e0 to reach them) to both ends of e1
        x0, z0, a0, b0 = lines[e0]; cum0 = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x0), np.diff(z0)))])
        x1, z1, a1, b1 = lines[e1]; cum1 = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x1), np.diff(z1)))])
        dist = {a0: cum0[k0], b0: cum0[-1] - cum0[k0]}; prev = {a0: None, b0: None}; pq = [(dist[a0], a0), (dist[b0], b0)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist.get(u, 1e18): continue
            for v, L, e, sg in adj.get(u, []):
                if d + L < dist.get(v, 1e18): dist[v] = d + L; prev[v] = (u, e, sg); heapq.heappush(pq, (d + L, v))
        ends = [(dist.get(a1, 1e18) + cum1[k1], a1), (dist.get(b1, 1e18) + cum1[-1] - cum1[k1], b1)]
        tot, end = min(ends)
        path = []; u = end
        while prev[u] is not None: u0, e, sg = prev[u]; path.append((e, sg)); u = u0
        path.reverse(); start = u
        px, pz = (list(x0[k0::-1]), list(z0[k0::-1])) if start == a0 else (list(x0[k0:]), list(z0[k0:]))
        for e, sg in path:
            x, z = lines[e][0], lines[e][1]
            if sg < 0: x, z = x[::-1], z[::-1]
            px += list(x[1:]); pz += list(z[1:])
        if end == a1: px += list(x1[1:k1 + 1]); pz += list(z1[1:k1 + 1])
        else: px += list(x1[-2:k1 - 1 if k1 > 0 else None:-1]); pz += list(z1[-2:k1 - 1 if k1 > 0 else None:-1])
        X += px; Z += pz
    X, Z = np.array(X), np.array(Z); keep = np.concatenate([[True], np.hypot(np.diff(X), np.diff(Z)) > 0.01])
    return X[keep], Z[keep]

def resample(x, z, step):
    d = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(z)))]); s = np.arange(0, d[-1] + 1e-6, step)
    return np.interp(s, d, x), np.interp(s, d, z), s

def separate(x, z, gap, adj, it=60):
    """Push apart the parts of the line that come closer than `gap` (metres) while more than `adj` apart along it (the legs of a hairpin),
    a little each step, then smooth: returns the line and how far it moved (mean, max)."""
    x0, z0 = x.copy(), z.copy(); n = len(x)
    for _ in range(it):
        P = np.stack([x, z], 1); moved = False
        from scipy.spatial import cKDTree
        T = cKDTree(P); pairs = T.query_pairs(gap, output_type='ndarray')
        if len(pairs):
            pairs = pairs[np.abs(pairs[:, 0] - pairs[:, 1]) > adj]
        if len(pairs):
            dx = P[pairs[:, 0]] - P[pairs[:, 1]]; d = np.maximum(np.hypot(dx[:, 0], dx[:, 1]), 1e-6); push = ((gap - d) / 2 * 0.35)[:, None] * dx / d[:, None]
            F = np.zeros_like(P); np.add.at(F, pairs[:, 0], push); np.add.at(F, pairs[:, 1], -push)
            F[:, 0] = gaussian_filter1d(F[:, 0], 6); F[:, 1] = gaussian_filter1d(F[:, 1], 6); x = x + F[:, 0]; z = z + F[:, 1]; moved = True
        if not moved: break
    m = np.hypot(x - x0, z - z0)
    return x, z, float(m.mean()), float(m.max())

def turns(x, z, s, lim=1 / 60.0):
    """The bends of the line: [(s at the apex, total turn in radians (+ right), smallest radius)]: where the curvature is over `lim`."""
    hd = np.unwrap(np.arctan2(np.gradient(z), np.gradient(x))); k = gaussian_filter1d(np.gradient(hd) / np.gradient(s), 2)
    out = []; i = 0
    while i < len(s):
        if abs(k[i]) > lim:
            j = i
            while j < len(s) - 1 and abs(k[j]) > lim / 2 and np.sign(k[j]) == np.sign(k[i]): j += 1
            a = i
            while a > 0 and abs(k[a - 1]) > lim / 2 and np.sign(k[a - 1]) == np.sign(k[i]): a -= 1
            tot = hd[j] - hd[a]; m = a + int(np.argmax(np.abs(k[a:j + 1])))
            out.append((float(s[m]), float(tot), float(1 / max(1e-9, np.max(np.abs(k[a:j + 1]))))))
            i = j + 1
        else: i += 1
    return out, k

# ---------------- heights along the road ----------------
def profile(h, s, C, bends):
    """The road's heights from the model's along its line: a running median, monotone (an uphill road: def `gor`), smoothed, the
    grade limited and lowered through the hairpins (as built)."""
    V = C.get('visine', {}); step = s[1] - s[0]
    med = ndimage.median_filter(h, size=max(3, int(V.get('mediana', 60) / step) | 1), mode='nearest')
    if V.get('gor', True): med = np.maximum.accumulate(med)   # (the road climbs all the way: hollows in the model filled)
    sm = gaussian_filter1d(med, V.get('glajenje', 40) / step, mode='nearest')
    # the grade: lower through the hairpins (a share of it), more on the legs, the total climb kept
    g = np.gradient(sm, s); w = np.ones_like(s)
    for sa, tot, r in bends:
        if abs(tot) > math.radians(150): w *= 1 - (1 - V.get('serpentine', 0.6)) * np.exp(-((s - sa) / V.get('serpentine_m', 18)) ** 2)
    g2 = g * w; gmax = V.get('naklon', 0.12)
    for _ in range(40):
        g2 = np.clip(g2 * (np.sum(g * step) / max(1e-9, np.sum(g2 * step))), -gmax, gmax)
    out = sm[0] + np.concatenate([[0], np.cumsum((g2[1:] + g2[:-1]) / 2 * step)])
    return out

# ---------------- the terrain grids (the forms js/world-vrsic.js vrPrep reads) ----------------
def grids(C, G, X, Z, D, base):
    M = 460; cell = 32; x0 = math.floor((X.min() - M) / cell) * cell; z0 = math.floor((Z.min() - M) / cell) * cell
    nx = int(math.ceil((X.max() + M - x0) / cell)) + 1; nz = int(math.ceil((Z.max() + M - z0) / cell)) + 1
    gx = x0 + np.arange(nx) * cell; gz = z0 + np.arange(nz) * cell; GX, GZ = np.meshgrid(gx, gz)
    la, lo = G.to_ll(GX, GZ); H = D.sample(la, lo)
    f = 8; tnx = int(math.ceil((nx - 1) / f)) + 1; tnz = int(math.ceil((nz - 1) / f)) + 1
    # the trend: the model smoothed (a 128 m Gaussian), sampled every 256 m, 0.1 m steps
    Hs = ndimage.gaussian_filter(H, 4, mode='nearest'); TR = np.zeros((tnz, tnx))
    for j in range(tnz):
        for i in range(tnx): TR[j, i] = Hs[min(nz - 1, j * f), min(nx - 1, i * f)]
    lo_ = math.floor(TR.min()) - 1; tv = np.clip(np.round((TR - lo_) / 0.1), 0, 65535).astype('>u2')
    trq = lo_ + tv.astype(np.float64) * 0.1
    fi = np.arange(nx) / f; ti = np.minimum(tnx - 2, np.floor(fi).astype(int)); u = fi - ti
    fj = np.arange(nz) / f; tj = np.minimum(tnz - 2, np.floor(fj).astype(int)); v = fj - tj
    TB = (trq[tj][:, ti] * (1 - u) + trq[tj][:, ti + 1] * u) * (1 - v)[:, None] + (trq[tj + 1][:, ti] * (1 - u) + trq[tj + 1][:, ti + 1] * u) * v[:, None]
    # residuals (1 m) in each row's span of cells within 650 m of the road
    from scipy.spatial import cKDTree
    T = cKDTree(np.stack([X[::4], Z[::4]], 1)); dr, _ = T.query(np.stack([GX.ravel(), GZ.ravel()], 1)); dr = dr.reshape(nz, nx)
    rows = []; res = bytearray(); clip = 0
    for j in range(nz):
        on = np.where(dr[j] < 650)[0]
        if not len(on): rows.append([0, 0]); continue
        a, b = int(on[0]), int(on[-1]) + 1; rows.append([a, b - a])
        r = np.round(H[j, a:b] - TB[j, a:b]); clip += int(np.sum(np.abs(r) > 127)); res += bytes((np.clip(r, -128, 127) + 128).astype(np.uint8))
    dem = {'x0': float(x0), 'z0': float(z0), 'nx': nx, 'nz': nz, 'cell': cell, 'base': round(float(base), 2),
           'tr': {'f': f, 'nx': tnx, 'nz': tnz, 'lo': lo_, 'step': 0.1, 'b64': b64(tv.tobytes())}, 'rows': rows, 'res': b64(res)}
    if clip: log('dem: %d residuals clipped to +-127 m' % clip)
    return dem, (x0, z0, nx, nz, cell, H, dr, rows)

# land cover classes in the track file (the shared world of the passes, js/world-prelaz.js): 0 alpine grass, 1 forest, 2 dwarf pine and shrubs,
# 3 built-up, 4 rock faces, 5 water, 6 snow, 7 scree and bare ground
def landcover(C, G, geo, D, lakes, scene):
    x0, z0, nx, nz, cell, H, dr, rows = geo
    c2 = 16; lnx, lnz = nx * 2, nz * 2
    gx = x0 + (np.arange(lnx) + 0.5) * c2; gz = z0 + (np.arange(lnz) + 0.5) * c2; GX, GZ = np.meshgrid(gx, gz)
    la, lo = G.to_ll(GX, GZ)
    wc = worldcover(la, lo)
    cls = np.zeros(wc.shape, np.uint8)
    cls[wc == 10] = 1; cls[wc == 20] = 2; cls[wc == 50] = 3; cls[wc == 60] = 7; cls[wc == 70] = 6; cls[wc == 80] = 5; cls[wc == 100] = 0; cls[wc == 90] = 0
    # Sentinel-2 (one clear summer scene, 10/20 m bands averaged over each cell's four corners and centre): snow by its NDSI, bare ground
    # by a low NDVI, green grass by a high one
    if scene:
        def band(b):
            acc = 0
            for ox, oz in [(0, 0), (-4, -4), (4, -4), (-4, 4), (4, 4)]:
                a, o = G.to_ll(GX + ox, GZ + oz); acc = acc + s2_band(scene, b, a, o)
            return acc / 5
        R, Gg, B, N8, S11 = (band(b) for b in ['B04', 'B03', 'B02', 'B08', 'B11'])
        ndvi = (N8 - R) / np.maximum(1, N8 + R); ndsi = (Gg - S11) / np.maximum(1, Gg + S11); bright = (R + Gg + B) / 3
        snow = (ndsi > 0.42) & (bright > 2500); bare = (ndvi < C.get("ndvi_golo", 0.3)) & ~snow & (cls != 5); green = ndvi > 0.45
        cls[snow] = 6; cls[bare & (cls != 3)] = 7; cls[green & np.isin(cls, [6, 7])] = 0
    # the trees by their height (the canopy map): under ~3.5 m dwarf pine and juniper (shrubs), the rest forest
    if C.get('krosnje', True):
        m = cls == 1
        if m.any():
            acc = np.zeros(int(m.sum()))
            for ox, oz in [(0, 0), (-4, -4), (4, 4), (-4, 4), (4, -4)]:
                a, o = G.to_ll(GX[m] + ox, GZ[m] + oz); acc = np.maximum(acc, canopy(a, o))
            sub = cls[m]; sub[acc < 3.5] = 2; cls[m] = sub
            log('trees by the canopy map: %d cells, %d of them under 3.5 m (shrubs)' % (int(m.sum()), int((acc < 3.5).sum())))
    # the steep bare ground: rock faces (slope over ~38 degrees)
    Hf = ndimage.zoom(H, 2, order=1)[:lnz, :lnx]; gy_, gx_ = np.gradient(Hf, c2); sl = np.hypot(gx_, gy_)
    cls[(cls == 7) & (sl > 0.78)] = 4; cls[(cls == 0) & (sl > 1.2)] = 4
    # OpenStreetMap's lakes (the model's water elsewhere: the streams' beds, grass)
    from shapely import contains_xy
    wet = np.zeros(cls.shape, bool)
    for L in lakes: wet |= contains_xy(Polygon(np.array(L[1:]).reshape(-1, 2)), GX, GZ)
    cls[(cls == 5) & ~wet] = 0; cls[wet] = 5
    cnt = {k: int(np.sum(cls == k)) for k in range(8)}
    return {'x0': float(x0), 'z0': float(z0), 'nx': lnx, 'nz': lnz, 'cell': c2, 'rle': rle64(cls)}, cls, cnt

def colours(C, G, geo, D, scene, meta):
    """The ground's colour from Sentinel-2 (true colour, the terrain's shading at the time of the scene taken out): on the 32 m terrain grid,
    in each row's span near the road (as the residuals), RGB 5-6-5 big-endian."""
    x0, z0, nx, nz, cell, H, dr, rows = geo
    gx = x0 + np.arange(nx) * cell; gz = z0 + np.arange(nz) * cell; GX, GZ = np.meshgrid(gx, gz)
    acc = np.zeros(GX.shape + (3,))
    for ox, oz in [(0, 0), (-8, -8), (8, -8), (-8, 8), (8, 8), (-12, 0), (12, 0), (0, -12), (0, 12)]:
        a, o = G.to_ll(GX + ox, GZ + oz); acc += np.stack([s2_band(scene, b, a, o) for b in ['B04', 'B03', 'B02']], -1)
    rgb = acc / 9 / 10000.0
    # the shading: the sun of the scene on the terrain (32 m normals), divided out (not below 0.35: the shadows stay a little darker)
    az, el = math.radians(meta[0]), math.radians(meta[1])
    gy_, gx_ = np.gradient(ndimage.gaussian_filter(H, 0.7), cell); n = np.stack([-gx_, np.ones_like(H), -gy_], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    sun = np.array([math.sin(az) * math.cos(el), math.sin(el), -math.cos(az) * math.cos(el)])   # (x east, y up, z south; azimuth from north)
    # (the grid's z is south: the normal's z-component is -dh/dz_south... a north-facing slope faces -z)
    sh = np.clip(n @ np.array([sun[0], sun[1], sun[2]]) / max(0.2, math.sin(el)), 0.35, 1.6)
    rgb = rgb / sh[..., None]
    # into the game's colour space: a gamma, the scene's brightness normalised (the median ground ~0.42)
    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2); med = np.median(rgb[dr < 650].mean(-1)); rgb = np.clip(rgb * (0.44 / max(0.05, med)), 0, 1)
    q = bytearray()
    for j in range(nz):
        a, k = rows[j]
        for i in range(a, a + k):
            r, g, b = rgb[j, i]; v = (int(round(r * 31)) << 11) | (int(round(g * 63)) << 5) | int(round(b * 31)); q += bytes([v >> 8, v & 255])
    return {'b64': b64(q)}

def far(C, G, X, Z, D):
    """The land beyond the corridor (the horizon): heights on a coarse grid ~`dalec` metres round the road (2 bytes a node: lo + v / 2
    metres), the lakes (WorldCover's water) as runs [dry, wet, dry, ...]."""
    R = C.get('dalec', 9000); cell = C.get('dalec_celica', 250)
    cx, cz = (X.min() + X.max()) / 2, (Z.min() + Z.max()) / 2
    x0 = math.floor((cx - R) / cell) * cell; z0 = math.floor((cz - R) / cell) * cell; n = int(2 * R / cell) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(n) * cell, z0 + np.arange(n) * cell); la, lo = G.to_ll(GX, GZ)
    Dbig = CopDEM(float(la.min()) - 0.01, float(lo.min()) - 0.01, float(la.max()) + 0.01, float(lo.max()) + 0.01)
    H = np.nan_to_num(Dbig.sample(la, lo), nan=0.0)
    # (each node the highest of the model round it: the ridges keep their height on the coarse grid)
    acc = H.copy()
    for ox, oz in [(-cell / 3, 0), (cell / 3, 0), (0, -cell / 3), (0, cell / 3)]:
        a, o = G.to_ll(GX + ox, GZ + oz); acc = np.maximum(acc, np.nan_to_num(Dbig.sample(a, o), nan=0.0))
    H = 0.5 * H + 0.5 * acc
    lo_ = int(math.floor(H.min() / 10) * 10); v = np.clip(np.round((H - lo_) * 2), 0, 65535).astype('>u2')
    wet = worldcover(la, lo) == 80; runs = []; cur = False; k = 0
    for w in wet.ravel():
        if bool(w) != cur: runs.append(k); k = 0; cur = not cur
        k += 1
    runs.append(k)
    return {'x0': float(x0), 'z0': float(z0), 'nx': n, 'nz': n, 'cell': cell, 'lo': lo_, 'b64': b64(v.tobytes()), 'lake': runs}

# ---------------- OpenStreetMap's buildings, lakes and streams (Overture) ----------------
def osm(C, G, box, X, Z, name):
    from scipy.spatial import cKDTree
    T = cKDTree(np.stack([X[::2], Z[::2]], 1))
    near = lambda x, z: T.query([x, z])[0]
    bld = []
    for r in overture('buildings', 'building', box, ['id', 'subtype', 'class', 'height', 'num_floors', 'geometry'], name):
        g = wkb.loads(r['geometry'])
        if g.geom_type == 'MultiPolygon': g = max(g.geoms, key=lambda q: q.area)
        c = np.array(g.exterior.coords); x, z = G.to_xz(c[:, 1], c[:, 0]); p = Polygon(np.stack([x, z], 1))
        cx, cz = p.centroid.x, p.centroid.y
        if near(cx, cz) > 700: continue
        mr = np.array(p.minimum_rotated_rectangle.exterior.coords)[:4]; e1 = mr[1] - mr[0]; e2 = mr[2] - mr[1]
        L, W = np.hypot(*e1), np.hypot(*e2); e = e1
        if W > L: L, W, e = W, L, e2
        hgt = r.get('height') or (r.get('num_floors') or 0) * 3.0 or 0
        kind = 1 if L * W < 30 else 2 if L * W > 260 else 0   # 1 a kiosk or shed, 0 a house or hut, 2 a big house (a hotel, a hall)
        bld.append([round(cx, 1), round(cz, 1), round(L, 1), round(W, 1), round(math.atan2(e[1], e[0]), 2), round(float(hgt), 1), kind])
    lakes, streams = [], []
    for r in overture('base', 'water', box, ['id', 'subtype', 'class', 'geometry'], name):
        g = wkb.loads(r['geometry'])
        if g.geom_type in ('Polygon', 'MultiPolygon'):
            for q in (g.geoms if g.geom_type == 'MultiPolygon' else [g]):
                c = np.array(q.exterior.coords); x, z = G.to_xz(c[:, 1], c[:, 0]); p = Polygon(np.stack([x, z], 1)).simplify(1.5)
                if p.area < 150 or T.query([p.centroid.x, p.centroid.y])[0] > 900: continue
                cc = np.array(p.exterior.coords)[:-1]; a = [round(p.area)]
                for u, w in cc: a += [round(float(u), 1), round(float(w), 1)]
                lakes.append(a)
        elif g.geom_type == 'LineString' and r.get('subtype') in ('stream', 'river'):
            c = np.array(g.coords); x, z = G.to_xz(c[:, 1], c[:, 0]); ls = LineString(np.stack([x, z], 1)).simplify(2)
            cc = np.array(ls.coords); d = T.query(cc)[0]
            if d.min() > 600: continue
            p = []
            for u, w in cc: p += [round(float(u), 1), round(float(w), 1)]
            streams.append({'p': p})
    # the aerialways (cable cars and chairlifts: the lines, their pylons and stations) and the car parks by the road (OpenStreetMap)
    cables, pyl, pulls = [], [], []
    for r in overture('base', 'infrastructure', box, ['id', 'subtype', 'class', 'geometry'], name):
        g = wkb.loads(r['geometry'])
        if r.get('subtype') == 'aerialway' and g.geom_type == 'LineString':
            c = np.array(g.coords); x, z = G.to_xz(c[:, 1], c[:, 0])
            if T.query(np.stack([x, z], 1))[0].min() > 500: continue
            p = []
            for u, w in zip(x, z): p += [round(float(u), 1), round(float(w), 1)]
            cables.append({'k': r.get('class'), 'p': p})
        elif r.get('subtype') == 'aerialway' and g.geom_type == 'Point':
            x, z = G.to_xz(g.y, g.x)
            if near(x, z) < 700: pyl += [round(float(x), 1), round(float(z), 1), 1 if r.get('class') == 'aerialway_station' else 0]
        elif r.get('class') == 'parking' and g.geom_type in ('Polygon', 'Point'):
            if g.geom_type == 'Polygon':
                c = np.array(g.exterior.coords); x, z = G.to_xz(c[:, 1], c[:, 0]); p = Polygon(np.stack([x, z], 1)); cx, cz, rr = p.centroid.x, p.centroid.y, math.sqrt(p.area / math.pi)
            else: cx, cz = G.to_xz(g.y, g.x); rr = 8.0
            d = near(cx, cz)
            if d < 40: pulls.append([round(float(cx), 1), round(float(cz), 1), round(float(rr), 1), round(float(d), 1)])
    return bld, lakes, streams, cables, pyl, pulls

def trees(C, G, X, Z):
    """Trees from the canopy height map: the highest point of each 4 m cell over 2.5 m, within `drevesa` metres of the road, as
    [x, z, height (dm)] flat (at most 4000, the nearest first)."""
    R = C.get('drevesa', 0)
    if not R: return []
    from scipy.spatial import cKDTree
    T = cKDTree(np.stack([X[::4], Z[::4]], 1)); c = 4.0
    xs = np.arange(X.min() - R, X.max() + R, c); zs = np.arange(Z.min() - R, Z.max() + R, c); GX, GZ = np.meshgrid(xs, zs)
    d = T.query(np.stack([GX.ravel(), GZ.ravel()], 1))[0].reshape(GX.shape); m = d < R
    la, lo = G.to_ll(GX[m], GZ[m]); h = canopy(la, lo)
    out = sorted([(float(dd), float(x), float(z), float(hh)) for dd, x, z, hh in zip(d[m], GX[m], GZ[m], h) if hh > 2.5])[:4000]
    o = []
    for dd, x, z, hh in out: o += [round(x, 1), round(z, 1), int(round(hh * 10))]
    return o

def jsval(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
    tid = sys.argv[1]; C = CFG[tid]; write = '--zapisi' in sys.argv
    box = C['okvir']; name = tid
    G0 = Geo(*C['start'])
    seg = overture('transportation', 'segment', box, ['id', 'names', 'subtype', 'class', 'road_surface', 'road_flags', 'width_rules', 'connectors', 'geometry'], name)
    x, z = route(seg, C['pot'], G0, C.get('razredi'))
    x, z, s = resample(x, z, 1.0)
    # the start and the finish snapped onto the line; the run-up before the start and the road past the finish
    sx, sz = G0.to_xz(*C['start']); fx, fz = G0.to_xz(*C['cilj'])
    i0 = int(np.argmin(np.hypot(x - sx, z - sz))); i1 = int(np.argmin(np.hypot(x - fx, z - fz)))
    a = max(0, i0 - int(C.get('zalet', 170))); b = min(len(x) - 1, i1 + int(C.get('po_cilju', 200)))
    x, z = x[a:b + 1], z[a:b + 1]; i0 -= a; i1 -= a
    x = gaussian_filter1d(x, C.get('gauss', 3), mode='nearest'); z = gaussian_filter1d(z, C.get('gauss', 3), mode='nearest')
    S0, F0 = (x[i0], z[i0]), (x[i1], z[i1])
    hw = C['polsirina']; gap = C.get('razmik', 2 * hw + 10)
    x, z, mm, mx = separate(x, z, gap, int(gap * 2.6))
    x, z, s = resample(x, z, 1.0)
    i0 = int(np.argmin(np.hypot(x - S0[0], z - S0[1]))); i1 = int(np.argmin(np.hypot(x - F0[0], z - F0[1])))
    # the game's origin: the start line
    ox, oz = x[i0], z[i0]; la_s, lo_s = G0.to_ll(ox, oz); G = Geo(float(la_s), float(lo_s))
    x, z = x - ox, z - oz
    bends, k = turns(x, z, s)
    hairs = [(sa, tot, r) for sa, tot, r in bends if abs(tot) > math.radians(150) and s[i0] < sa < s[i1]]
    log('line: %.0f m (run-up %.0f, race %.0f, past the finish %.0f); moved %.1f m on average, %.1f at most; %d hairpins, the tightest %.1f m' % (
        s[-1], s[i0], s[i1] - s[i0], s[-1] - s[i1], mm, mx, len(hairs), min([r for _, _, r in hairs] or [0])))
    # heights
    la, lo = G.to_ll(x, z); pad = 0.06
    D = CopDEM(float(la.min()) - pad, float(lo.min()) - pad * 1.4, float(la.max()) + pad, float(lo.max()) + pad * 1.4)
    h = D.sample(la, lo); hp = profile(h, s, C, bends)
    base = hp[i0]; alt = [int(round(hp[i0])), int(round(hp[i1]))]
    g = np.gradient(hp, s)
    log('heights: %d -> %d m (model %d -> %d), steepest %.1f %%, the model off the road by %.1f m on average' % (alt[0], alt[1], h[i0], h[i1], g[i0:i1].max() * 100, np.mean(np.abs(h - hp))))
    nE = int(round(s[-1] / 4)); fr = np.linspace(0, s[-1], nE + 1); HE = np.round((np.interp(fr, s, hp) - base) * 10).astype(int).tolist()
    pts = [[round(float(x[i]), 2), round(float(z[i]), 2)] for i in range(0, len(x), 5)]
    if (len(x) - 1) % 5: pts.append([round(float(x[-1]), 2), round(float(z[-1]), 2)])
    race = s[i1] - s[i0]
    cps = []
    for f in (0.2, 0.4, 0.6, 0.8):   # the checkpoints: near each fifth of the race, on a straighter bit
        t = s[i0] + f * race; cand = [i for i in range(len(s)) if abs(s[i] - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(s[i] - t) / 60)
        cps.append([round(float(x[best]), 1), round(float(z[best]), 1)])
    curves = [[round(float(sa - s[i0]), 1), int(round(float(np.interp(sa, s, hp)))), 1 if tot > 0 else -1] for sa, tot, r in hairs]
    # the corridor's data
    dem, geo = grids(C, G, x, z, D, base)
    bld, lakes, streams, cables, pyl, pulls = osm(C, G, box, x, z, name)
    scene = C.get('s2'); meta = None
    if scene:
        zone = scene.split('_')[1]; y, mo = scene.split('_')[2][:4], int(scene.split('_')[2][4:6])
        scene = 'sentinel-s2-l2a-cogs/%s/%s/%s/%s/%d/%s/' % (zone[:2], zone[2], zone[3:], y, mo, scene)
        j = json.loads(fetch(S2 + scene + scene.split('/')[-2] + '.json', 's2/' + scene.split('/')[-2] + '.json'))['properties']
        meta = (j['view:sun_azimuth'], j['view:sun_elevation'])
    lc, cls, cnt = landcover(C, G, geo, D, lakes, scene)
    col = colours(C, G, geo, D, scene, meta) if scene else None
    fard = far(C, G, x, z, D)
    tr = trees(C, G, x, z)
    log('land cover (16 m): ' + ', '.join('%s %d' % (n_, cnt[k_]) for k_, n_ in enumerate(['grass', 'forest', 'shrubs', 'built', 'rock', 'water', 'snow', 'scree'])))
    log('buildings %d, lakes %d, streams %d, aerialways %d (pylons and stations %d), car parks %d, trees %d, far %dx%d' % (len(bld), len(lakes), len(streams), len(cables), len(pyl) // 3, len(pulls), len(tr) // 3, fard['nx'], fard['nz']))
    out = {'points': pts, 'H': HE, 'alt': alt, 'realKm': round(race / 1000, 2), 'finish': [round(float(x[i1]), 1), round(float(z[i1]), 1)], 'cps': cps, 'curves': curves,
           'dem': dem, 'lc': lc, 'col': col, 'bld': bld, 'lakes': lakes, 'streams': streams, 'cables': cables, 'pylons': pyl, 'pulls': pulls, 'farDem': fard, 'trees': tr,
           'origin': [round(float(la_s), 7), round(float(lo_s), 7)]}
    json.dump(out, open(os.path.join(RAW, tid + '.json'), 'w'))
    log('curves', curves); log('cps', cps, 'finish', out['finish'], 'origin', out['origin'])
    if write:
        p = os.path.join(ROOT, 'js', 'tracks', tid + '.js'); src = open(p).read()
        A, B = '    // ---- podatki (tools/proga) ----\n', '    // ---- konec podatkov ----\n'
        V = C.get('ime_h', tid.upper() + '_H')
        blk = A + ''.join('    %s: %s,\n' % (k_, jsval(out[k_])) for k_ in ['alt', 'realKm', 'finish', 'cps', 'curves', 'dem', 'lc', 'col', 'bld', 'lakes', 'streams', 'cables', 'pylons', 'pulls', 'farDem', 'trees', 'points']) + B
        i, j = src.index(A), src.index(B) + len(B); src = src[:i] + blk + src[j:]
        hA = '  const %s = [' % V; i = src.index(hA); j = src.index('];', i); src = src[:i] + hA + ','.join(map(str, HE)) + src[j:]
        open(p, 'w').write(src); log('written', p)

if __name__ == '__main__':
    main()
