# Livorno, Italija (proga `livorno`), sklop 1: the track's data for the next steps (sklop 2: js/tracks/livorno.js, sklop 3: js/world-livorno.js),
# from route.json (route.py) and the open data round it. Writes tools/livorno/livorno.json and the grids tools/livorno/*.png (formats: the
# header of livorno.json, "about", and docs/proga-livorno.md).
#   frame: metres, origin = the start line (the seafront road on the bridge over the Rio Ardenza by the Rotonda), x east, z south
#          (Geo of maketa-menija/orodja/geo_lib.py with rot 0: x = dlon * N cos(lat0), z = -dlat * M, the radii at lat0).
#   line:  the centre line smoothed (OSM's corners rounded) every 5 m from the start line, round the lap (closed).
#   h:     the road's height there (m above sea level): Copernicus DEM GLO-30 (a surface model) less the tree crowns (Meta / WRI canopy height)
#          and less the buildings (OSM), smoothed along the road (a 40 m opening takes off what still stands up, then a 15 m Gaussian);
#          the route's bridges straight from end to end.
#   grids: dem (the ground, 20 m cells, near), far (the surface as seen from afar, 100 m cells, +-12 km), lc (ESA WorldCover classes, 10 m
#          cells, to 150 m from the road), lu (OSM land use, 10 m, same box), chm (canopy height m, 10 m, same box).
#   vectors (OSM, near the road): buildings, trees, walls / fences / guard rails, coast, cliffs, beaches, railway, other roads, side roads,
#          bridges, crossings and signals, landmarks, places.
# Data: © OpenStreetMap contributors (ODbL 1.0: the derived data here under the ODbL 1.0); Copernicus DEM GLO-30: produced using Copernicus
# WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA;
# all rights reserved; © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover
# consortium (CC BY 4.0); canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
# Usage: python3 -I tools/livorno/data.py RAW   (after osm.py and route.py; needs numpy, pillow, scipy, rasterio: pip install scipy rasterio)
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
if os.path.exists('/root/.ccr/ca-bundle.crt'): os.environ.setdefault('CURL_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
DEM_URL = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N43_00_E010_00_DEM/Copernicus_DSM_COG_10_N43_00_E010_00_DEM.tif'
WC_URL = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N42E009_Map.tif'
CHM_URL = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/120223132.tif'   # (zoom-9 quadkey of Livorno)
STEP = 5.0   # m between the points of `line`

A_WGS, F_WGS = 6378137.0, 1 / 298.257223563
E2 = F_WGS * (2 - F_WGS)
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)

class Frame:
    def __init__(self, lat0, lon0):
        self.lat0, self.lon0 = lat0, lon0; self.M, self.N = radii(lat0); self.c = math.cos(math.radians(lat0))
    def xz(self, lat, lon):
        return (np.radians(np.asarray(lon, float) - self.lon0) * self.N * self.c, -np.radians(np.asarray(lat, float) - self.lat0) * self.M)
    def ll(self, x, z):
        return (self.lat0 - np.degrees(np.asarray(z, float) / self.M), self.lon0 + np.degrees(np.asarray(x, float) / (self.N * self.c)))

# ---------------- rasters (windows of the cloud-optimised GeoTIFFs) ----------------
def read_window(url, lat0, lon0, lat1, lon1, out_shape=None, resampling='nearest'):
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.enums import Resampling
    from rasterio.warp import transform_bounds
    with rasterio.open('/vsicurl/' + url) as src:
        b = (lon0, lat0, lon1, lat1)
        if src.crs.to_epsg() != 4326: b = transform_bounds('EPSG:4326', src.crs, *b)
        win = from_bounds(*b, src.transform).round_offsets().round_lengths()
        a = src.read(1, window=win, out_shape=out_shape, resampling=getattr(Resampling, resampling))
        T = src.window_transform(win)
        if out_shape: T = T * T.scale(win.width / out_shape[1], win.height / out_shape[0])
        return a, T, src.crs.to_epsg()

def sample_grid(a, T, epsg, lat, lon, order=1):
    """Values of raster a (affine T, EPSG 4326 or 3857) at lat/lon arrays (bilinear: order 1, nearest: order 0)."""
    lat = np.asarray(lat, float); lon = np.asarray(lon, float)
    if epsg == 3857:
        X = np.radians(lon) * 6378137.0; Y = np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * 6378137.0
    else:
        X, Y = lon, lat
    col = (X - T.c) / T.a - 0.5; row = (Y - T.f) / T.e - 0.5
    return ndimage.map_coordinates(a.astype(np.float32), [row, col], order=order, mode='nearest')

# ---------------- geometry helpers ----------------
def resample(P, step, closed):
    P = np.asarray(P, float)
    Q = np.vstack([P, P[:1]]) if closed else P
    seg = np.hypot(*(Q[1:] - Q[:-1]).T); cum = np.concatenate([[0], np.cumsum(seg)]); L = cum[-1]
    n = int(round(L / step)); s = np.arange(n) * (L / n) if closed else np.linspace(0, L, n + 1)
    return np.stack([np.interp(s, cum, Q[:, 0]), np.interp(s, cum, Q[:, 1])], 1), L

def smooth_closed(P, sigma_pts):
    return np.stack([ndimage.gaussian_filter1d(P[:, 0], sigma_pts, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], sigma_pts, mode='wrap')], 1)

def curvature(P, h):   # signed curvature of a closed polyline with step h (positive: right turn in x east / z south)
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / (2 * h); d2 = (np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)) / h ** 2
    return (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.maximum(1e-9, np.hypot(d1[:, 0], d1[:, 1]) ** 3)

class Along:
    """Nearest point of the centre line (closed, every STEP m) to points: s (m from the start line), d (m, + right of the travel direction)."""
    def __init__(self, line, step):
        self.P = line; self.step = step; self.n = len(line); self.L = self.n * step
        T = np.roll(line, -1, 0) - line; self.T = T / np.hypot(*T.T)[:, None]
        from scipy.spatial import cKDTree
        self.kd = cKDTree(line)
    def query(self, pts):
        pts = np.atleast_2d(np.asarray(pts, float)); dd, ii = self.kd.query(pts)
        best_s = np.zeros(len(pts)); best_d = np.full(len(pts), 1e9)
        for o in (-1, 0):   # the segment before and after the nearest vertex
            j = (ii + o) % self.n; a = self.P[j]; t = self.T[j]
            v = pts - a; u = np.clip((v * t).sum(1), 0, self.step); q = a + t * u[:, None]; w = pts - q
            d = np.hypot(*w.T); side = np.sign(t[:, 0] * w[:, 1] - t[:, 1] * w[:, 0])   # (+: right of travel, x east / z south)
            m = d < np.abs(best_d); best_d[m] = (d * np.where(side == 0, 1, side))[m]; best_s[m] = (j * self.step + u)[m] % self.L
        return best_s, best_d

def r1(v, k=1):
    return float(round(float(v), k))

# ---------------- 1. the centre line ----------------
def build_line(R, F):
    lat = np.array([n[1] for n in R['nodes']]); lon = np.array([n[2] for n in R['nodes']])
    x, z = F.xz(lat, lon); P = np.stack([x, z], 1)
    D1, L = resample(P, 1.0, True)                 # every 1 m along OSM's polyline
    S = smooth_closed(D1, 3.0)                     # its corners rounded (sigma 3 m: the hairpins keep their ~10 m radius)
    line, L2 = resample(S, STEP, True)
    return line, L, L2

# ---------------- 2. the ground: the surface model less the trees and the buildings ----------------
BOX = (43.440, 10.290, 43.535, 10.400)   # the near box (lat0, lon0, lat1, lon1): the route and ~1.5 km round it

def bld_height(t):
    for k in ('height', 'building:height'):
        try: return float(str(t[k]).split()[0].replace(',', '.'))
        except Exception: pass
    try: return float(t['building:levels']) * 3.0 + 1.5
    except Exception: return 0.0

def ground_model(raw, D):
    """-> (dsm, gnd, T): the Copernicus DSM window over BOX (EPSG:4326, ~1 arc-second cells) and the ground under it: less the canopy
    (Meta / WRI, the mean over each cell, x 0.8: the radar sees a little into the crowns) and less the buildings (OSM footprints: the share of
    the cell under roofs x their height, 9 m when untagged, x 0.8)."""
    cache = os.path.join(raw, 'ground.npz')
    if os.path.exists(cache):
        import affine   # (rasterio's own)
        z = np.load(cache); return z['dsm'], z['gnd'], affine.Affine(*z['T'][:6])
    dsm, T, _ = read_window(DEM_URL, *BOX)
    H, W = dsm.shape
    print('dsm', dsm.shape, float(dsm.min()), float(dsm.max()), flush=True)
    # canopy: read at ~5 m (average), then the mean over each DEM cell
    import rasterio
    from rasterio.warp import transform_bounds
    with rasterio.open('/vsicurl/' + CHM_URL) as src:
        b = transform_bounds('EPSG:4326', src.crs, BOX[1], BOX[0], BOX[3], BOX[2])
        from rasterio.windows import from_bounds
        win = from_bounds(*b, src.transform).round_offsets().round_lengths()
    oh, ow = int(win.height // 4), int(win.width // 4)
    chm, Tc, ec = read_window(CHM_URL, *BOX, out_shape=(oh, ow), resampling='average')
    chm = chm.astype(np.float32); chm[chm > 60] = 0
    print('chm', chm.shape, float(chm.max()), flush=True)
    # each DEM cell's centre -> sample the canopy on a 5 x 5 sub-grid of the cell, the mean
    rows, cols = np.mgrid[0:H, 0:W]
    acc = np.zeros((H, W), np.float32)
    for fy in np.linspace(-0.4, 0.4, 5):
        for fx in np.linspace(-0.4, 0.4, 5):
            lon = T.c + (cols + 0.5 + fx) * T.a; lat = T.f + (rows + 0.5 + fy) * T.e
            acc += sample_grid(chm, Tc, ec, lat.ravel(), lon.ravel(), order=0).reshape(H, W)
    canopy = acc / 25
    # buildings: rasterised at 1/8 of a cell, the share of each cell under roofs times their height
    N = D['nodes']; S = 8
    img = Image.new('F', (W * S, H * S), 0.0); dr = ImageDraw.Draw(img)
    for wid, (refs, t) in D['ways'].items():
        if 'building' not in t or t.get('building') in ('roof', 'no'): continue
        pts = [N[r] for r in refs if r in N]
        if len(pts) < 3: continue
        hgt = bld_height(t) or 9.0
        dr.polygon([((p[1] - T.c) / T.a * S, (p[0] - T.f) / T.e * S) for p in pts], fill=float(hgt))
    b = np.asarray(img, np.float32).reshape(H, S, W, S).mean(axis=(1, 3))
    gnd = dsm - 0.8 * canopy - 0.8 * b
    gnd = np.where(dsm < 0.5, dsm, np.maximum(gnd, 0.3))   # (the sea stays at its own level; the land above it)
    np.savez_compressed(cache, dsm=dsm, gnd=gnd, T=np.array(tuple(T)))
    return dsm, gnd, T

# ---------------- 3. the road's heights ----------------
def route_spans(R, line, F, key):
    """s ranges [s0, s1] of the route's ways with tag key (e.g. bridge): the OSM nodes of each run located on the smoothed line."""
    A = Along(line, STEP); out = []
    lat = np.array([n[1] for n in R['nodes']]); lon = np.array([n[2] for n in R['nodes']])
    x, z = F.xz(lat, lon); s, _ = A.query(np.stack([x, z], 1))
    for w, nm, hw, i0, i1, tg in R['ways']:
        if tg.get(key) in (None, 'no'): continue
        a, b = s[i0], s[min(i1, len(s) - 1)]
        if b < a: b += A.L
        if out and a - out[-1][1] < 2: out[-1][1] = b
        else: out.append([a, b, nm])
    return out

MAXG = 0.12   # the steepest grade kept (the provincial road's hairpins; the surface model's steeper bits are its 30 m cells on the slopes)

def road_heights(line, F, gnd, T, bridges):
    """-> (raw, smoothed) heights along the line: the ground model across the road (the median of 5 samples from 8 m left to 8 m right:
    by the cliffs half the cells are sea), the bridges straight from bank to bank, dips under 60 m filled, a 35 m median, sigma 15 m, the
    grades at most MAXG."""
    n = len(line)
    Tn = np.roll(line, -1, 0) - np.roll(line, 1, 0); Tn = Tn / np.hypot(*Tn.T)[:, None]; Nr = np.stack([-Tn[:, 1], Tn[:, 0]], 1)
    cross = []
    for d in (-8, -4, 0, 4, 8):
        q = line + Nr * d; lat, lon = F.ll(q[:, 0], q[:, 1]); cross.append(sample_grid(gnd, T, 4326, lat, lon))
    h0 = np.median(np.stack(cross), 0)
    h1 = h0.copy()
    for a, b, nm in bridges:   # straight over the bridges, from the highest ground within 50 m before to the highest within 50 m after
        ia = int(round(a / STEP)); ib = int(round(b / STEP)); K = int(50 / STEP)
        i0 = max(range(ia - K, ia + 2), key=lambda i: h0[i % n]); i1 = max(range(ib - 1, ib + K + 1), key=lambda i: h0[i % n])
        ya, yb = h0[i0 % n], h0[i1 % n]
        for i in range(i0, i1 + 1): h1[i % n] = ya + (yb - ya) * (i - i0) / max(1, i1 - i0)
    h1 = ndimage.grey_closing(h1, size=int(60 / STEP) | 1, mode='wrap')   # (the narrow dips filled: gullies under the road, the sea in a cell by the cliffs)
    h1 = ndimage.median_filter(h1, size=7, mode='wrap')
    h2 = ndimage.gaussian_filter1d(h1, 15 / STEP, mode='wrap')
    h2 = limit_grade(h2, MAXG)
    h2 = ndimage.gaussian_filter1d(h2, 5 / STEP, mode='wrap')
    return h0, h2

def limit_grade(h, lim):   # the excess of each too steep step shared by its two ends, until none is left (closed: wraps)
    h = h.copy()
    for it in range(2000):
        g = (np.roll(h, -1) - h) / STEP; ex = np.sign(g) * np.maximum(np.abs(g) - lim, 0) * STEP
        if np.abs(ex).max() < 0.005: break
        h += ex * 0.5; h -= np.roll(ex, 1) * 0.5   # (point i up/down towards i+1, point i+1 the other way)
    return h

# ---------------- 4. grids (PNG: 16-bit heights in decimetres + 100 m, so the sea's -0.4 m stays positive; 8-bit classes) ----------------
NEAR = 150.0   # the land cover, land use and canopy grids: to this far from the road (0 beyond)
def grid_box(line, margin, cell):
    x0 = math.floor((line[:, 0].min() - margin) / cell) * cell; z0 = math.floor((line[:, 1].min() - margin) / cell) * cell
    nx = int(math.ceil((line[:, 0].max() + margin - x0) / cell)); nz = int(math.ceil((line[:, 1].max() + margin - z0) / cell))
    return x0, z0, nx, nz

def cell_centres(F, x0, z0, nx, nz, cell):
    X, Z = np.meshgrid(x0 + (np.arange(nx) + 0.5) * cell, z0 + (np.arange(nz) + 0.5) * cell)
    lat, lon = F.ll(X, Z); return X, Z, lat, lon

def save_png16(path, h):
    v = np.clip(np.round((h + 100.0) * 10), 0, 65535).astype(np.uint16)
    Image.fromarray(v).save(path, optimize=True)

def save_png8(path, a):
    Image.fromarray(np.asarray(a, np.uint8)).save(path, optimize=True)

def road_distance(line, X, Z):
    from scipy.spatial import cKDTree
    dense, _ = resample(line, 1.0, True)
    d, _ = cKDTree(dense).query(np.stack([X.ravel(), Z.ravel()], 1), distance_upper_bound=NEAR + 20)
    return d.reshape(X.shape)

# OSM land use -> one class per 10 m cell (later ones drawn over earlier ones)
LU = [  # (code, test(tags), name)
    (1, lambda t: t.get('landuse') in ('residential',), 'residential'),
    (2, lambda t: t.get('landuse') in ('commercial', 'retail', 'industrial', 'railway', 'construction', 'garages'), 'commercial / industrial / railway'),
    (3, lambda t: t.get('landuse') in ('farmland', 'farmyard', 'allotments', 'greenhouse_horticulture'), 'fields'),
    (4, lambda t: t.get('landuse') in ('meadow', 'grass', 'village_green', 'recreation_ground') or t.get('natural') == 'grassland', 'meadow / grass'),
    (5, lambda t: t.get('landuse') in ('vineyard',), 'vineyard'),
    (6, lambda t: t.get('landuse') in ('orchard',) and t.get('trees') == 'olive_trees' or t.get('crop') == 'olive', 'olive grove'),
    (7, lambda t: t.get('landuse') in ('orchard', 'plant_nursery'), 'orchard'),
    (8, lambda t: t.get('natural') in ('scrub', 'heath'), 'scrub (macchia)'),
    (9, lambda t: t.get('landuse') == 'forest' or t.get('natural') == 'wood', 'forest'),
    (10, lambda t: t.get('leisure') in ('park', 'garden', 'playground', 'pitch', 'sports_centre', 'golf_course') or t.get('landuse') == 'cemetery' or t.get('amenity') == 'grave_yard', 'park / garden / pitch / cemetery'),
    (11, lambda t: t.get('natural') in ('bare_rock', 'scree', 'shingle', 'rock') or t.get('landuse') == 'quarry', 'bare rock / quarry'),
    (12, lambda t: t.get('natural') in ('beach', 'sand'), 'beach'),
    (13, lambda t: t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') in ('basin', 'reservoir') or t.get('leisure') == 'marina', 'water'),
    (14, lambda t: t.get('amenity') == 'parking' or t.get('highway') in ('pedestrian',) and t.get('area') == 'yes' or t.get('place') == 'square', 'parking / square'),
]

def rel_rings(D, mem):
    N, W = D['nodes'], D['ways']
    segs = [[r for r in W[ref][0] if r in N] for typ, ref, role in mem if typ == 'way' and role in ('outer', '') and ref in W]
    rings = []
    while segs:   # join the outer ways into closed rings
        ring = segs.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for k, sg in enumerate(segs):
                if sg[0] == ring[-1]: ring += sg[1:]
                elif sg[-1] == ring[-1]: ring += sg[::-1][1:]
                elif sg[-1] == ring[0]: ring = sg + ring[1:]
                elif sg[0] == ring[0]: ring = sg[::-1] + ring[1:]
                else: continue
                segs.pop(k); changed = True; break
        if len(ring) > 3: rings.append([N[r] for r in ring])
    return rings

def raster_lu(D, F, x0, z0, nx, nz, cell):
    img = Image.new('L', (nx, nz), 0); dr = ImageDraw.Draw(img)
    polys = []
    for wid, (refs, t) in D['ways'].items():
        if len(refs) > 3 and refs[0] == refs[-1]: polys.append((t, [[D['nodes'][r] for r in refs if r in D['nodes']]]))
    for rid, (mem, t) in D['rels'].items():
        if t.get('type') == 'multipolygon': polys.append((t, rel_rings(D, mem)))
    for code, test, name in LU:
        for t, rings in polys:
            try: ok = test(t)
            except Exception: ok = False
            if not ok: continue
            for ring in rings:
                lat = np.array([p[0] for p in ring]); lon = np.array([p[1] for p in ring]); x, z = F.xz(lat, lon)
                pts = list(zip(((x - x0) / cell).tolist(), ((z - z0) / cell).tolist()))
                if len(pts) > 2: dr.polygon(pts, fill=code)
    return np.asarray(img)

def build_grids(F, line, dsm, gnd, T, D, out):
    info = {}
    # the ground near the road: 20 m cells, 1.2 km round the line
    c = 20.0; x0, z0, nx, nz = grid_box(line, 1200, c); X, Z, lat, lon = cell_centres(F, x0, z0, nx, nz, c)
    g = sample_grid(gnd, T, 4326, lat.ravel(), lon.ravel()).reshape(nz, nx)
    save_png16(os.path.join(out, 'dem.png'), g)
    info['dem'] = dict(file='dem.png', x0=x0, z0=z0, nx=nx, nz=nz, cell=c, enc='uint16 (h + 100) * 10, h in m above sea level; row 0 = z0 (north), col 0 = x0 (west)', what='ground: Copernicus DEM GLO-30 less 0.8 x the canopy (Meta / WRI) and 0.8 x the buildings (OSM), bilinear')
    print('dem', nx, nz, flush=True)
    # far: the surface (what one sees from afar), 100 m cells, +-12 km round the middle of the lap
    c = 100.0; cx = (line[:, 0].min() + line[:, 0].max()) / 2; cz = (line[:, 1].min() + line[:, 1].max()) / 2
    x0, z0 = math.floor((cx - 12000) / c) * c, math.floor((cz - 12000) / c) * c; nx = nz = 240
    X, Z, lat, lon = cell_centres(F, x0, z0, nx, nz, c)
    fa, Tf, _ = read_window(DEM_URL, float(lat.min()) - 0.01, max(10.0, float(lon.min()) - 0.01), float(lat.max()) + 0.01, float(lon.max()) + 0.01)
    fv = sample_grid(fa, Tf, 4326, lat.ravel(), lon.ravel()).reshape(nz, nx)
    fv[lon < 10.0] = 0.0   # (west of 10 deg E: the open sea, outside the DEM tile)
    save_png16(os.path.join(out, 'far.png'), fv)
    info['far'] = dict(file='far.png', x0=x0, z0=z0, nx=nx, nz=nz, cell=c, enc='as dem', what='surface (Copernicus DEM GLO-30 as it is: the hills with their woods and the town as seen from afar), 0 = sea')
    print('far', nx, nz, float(fv.max()), flush=True)
    # land cover, land use, canopy: 10 m cells, to NEAR m from the road
    c = 10.0; x0, z0, nx, nz = grid_box(line, NEAR + 20, c); X, Z, lat, lon = cell_centres(F, x0, z0, nx, nz, c)
    dist = road_distance(line, X, Z); near = dist <= NEAR
    wc, Tw, ew = read_window(WC_URL, float(lat.min()) - 0.002, float(lon.min()) - 0.002, float(lat.max()) + 0.002, float(lon.max()) + 0.002)
    lc = sample_grid(wc, Tw, ew, lat.ravel(), lon.ravel(), order=0).reshape(nz, nx).astype(np.uint8); lc[~near] = 0
    save_png8(os.path.join(out, 'lc.png'), lc)
    lu = raster_lu(D, F, x0, z0, nx, nz, c).copy(); lu[~near] = 0
    save_png8(os.path.join(out, 'lu.png'), lu)
    # the canopy at 10 m: the 1 m map read at 1/3 (average), sampled 3 x 3 per cell, the mean
    import rasterio
    from rasterio.warp import transform_bounds
    with rasterio.open('/vsicurl/' + CHM_URL) as src:
        from rasterio.windows import from_bounds
        b = transform_bounds('EPSG:4326', src.crs, float(lon.min()) - 0.002, float(lat.min()) - 0.002, float(lon.max()) + 0.002, float(lat.max()) + 0.002)
        win = from_bounds(*b, src.transform).round_offsets().round_lengths()
    chm, Tc, ec = read_window(CHM_URL, float(lat.min()) - 0.002, float(lon.min()) - 0.002, float(lat.max()) + 0.002, float(lon.max()) + 0.002,
                              out_shape=(int(win.height // 3), int(win.width // 3)), resampling='average')
    chm = np.where(chm > 60, 0, chm).astype(np.float32)
    acc = np.zeros(X.shape, np.float32)
    for fz in (-0.33, 0, 0.33):
        for fx in (-0.33, 0, 0.33):
            la2, lo2 = F.ll(X + fx * c, Z + fz * c); acc += sample_grid(chm, Tc, ec, la2.ravel(), lo2.ravel(), order=0).reshape(X.shape)
    ch = np.round(acc / 9).astype(np.uint8); ch[~near] = 0
    save_png8(os.path.join(out, 'chm.png'), ch)
    common = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c)
    info['lc'] = dict(file='lc.png', **common, enc='uint8 ESA WorldCover class: 10 trees, 20 shrubs, 30 grass, 40 crops, 50 built-up, 60 bare / sparse, 80 water, 90 wetland; 0 = farther than %d m from the road' % NEAR)
    info['lu'] = dict(file='lu.png', **common, enc='uint8 OSM land use: ' + ', '.join('%d %s' % (k, nm) for k, _, nm in LU) + '; 0 = none / farther than %d m' % NEAR)
    info['chm'] = dict(file='chm.png', **common, enc='uint8 canopy height in m (Meta / WRI 1 m map, the mean over each 10 m cell); 0 = none / farther than %d m' % NEAR)
    vals, cnt = np.unique(lc[near], return_counts=True); print('lc near:', dict(zip(vals.tolist(), cnt.tolist())))
    vals, cnt = np.unique(lu[near], return_counts=True); print('lu near:', dict(zip(vals.tolist(), cnt.tolist())))
    print('chm near: trees (>3 m) in %.0f %% of the cells within %d m, mean height %.1f m' % (100 * (ch[near] > 3).mean(), NEAR, ch[near][ch[near] > 3].mean()))
    return info

# ---------------- 5. vectors near the road (OSM) ----------------
# only geographic or descriptive labels go into the files (OSM's own names stay in osm.json: some name people)
GEO_ROADS = {'Via di Montenero', 'Via del Castellaccio', 'Via della Porcigliana', 'Via di Quercianella', 'Via del Littorale', 'Viale di Antignano', 'Via del Pastore',
             'Viale Italia', "Via dell'Ardenza", 'Via dei Bagni', 'Via della Salita di Montenero', 'Via della Vecchia Salita di Montenero', 'Via di Calafuria',
             'Via del Boccale', 'Strada Statale 1 Aurelia', 'Via Aurelia', 'Via della Valle Benedetta', 'Via del Vaiolo', 'Piazza di Montenero', 'Via di Collinaia'}
GEO_WATER = {'Rio Ardenza', 'Botro di Calafuria', 'Fosso del Boccale', 'Botro di Quercianella', 'Rio Maggiore', 'Botro del Romito'}
# landmarks: OSM way / relation id -> (label in the game (Slovenian), English, kind)
MARKS = {
    'w175843347': ('Stolp Calafuria', 'Calafuria tower', 'tower'),           # the coastal watchtower by the bridge
    'w241553307': ('Grad Boccale', 'Boccale castle', 'castle'),               # on the rocks below the road
    'w667753082': ('Grad na Romitu', 'Romito castle', 'castle'),              # (OSM's name is a person's; the old one is the place's)
    'w86572785': ('Grad Antignano', 'Antignano castle', 'castle'),            # at the corner in Antignano
    'w238130457': ('Stolp Castellaccio', 'Castellaccio tower', 'tower'),      # on the ridge
    'w1196135522': ('Svetišče Montenero', 'Montenero sanctuary', 'sanctuary'),   # (a generic building in the game)
    'w207529644': ('Pokopališče Montenero', 'Montenero cemetery', 'cemetery'),
    'w229010839': ('Pokopališče Antignano', 'Antignano cemetery', 'cemetery'),
    'w253776901': ('Kamnolom Calafuria', 'Calafuria quarry', 'quarry'),      # the old sandstone quarry by the road
    'w1119053110': ('Pristanišče Antignano', 'Antignano harbour', 'harbour'),
    'w1074522998': ('Pristanišče Ardenza', 'Ardenza harbour', 'harbour'),
    'w486977706': ('Kamp Miramare', 'Miramare camp site', 'camp'),
    'w40646430': ('Vzpenjača Montenero', 'Montenero funicular', 'funicular'),
}
TERRACE = ('Terasa ob morju', 'Seafront terrace', 'terrace')   # the Rotonda of Ardenza Mare (today named after a person): its pedestrian ways

def tree_kind(t):
    g = (t.get('genus', '') + ' ' + t.get('species', '') + ' ' + t.get('taxon', '')).lower()
    if 'pinus' in g or t.get('leaf_type') == 'needleleaved' and 'cupress' not in g: return 'p'
    if 'cupress' in g: return 'c'
    if 'olea' in g: return 'o'
    if any(k in g for k in ('phoenix', 'washingtonia', 'chamaerops', 'trachycarpus', 'palm', 'arec')): return 'm'
    if g.strip() or t.get('leaf_type') == 'broadleaved': return 'b'
    return ''

def bld_kind(t):
    b = t.get('building', 'yes'); h = t.get('historic', ''); m = t.get('man_made', '')
    if h in ('castle', 'fort') or b in ('castle',): return 3
    if m in ('tower',) or b in ('tower',) or h in ('tower',): return 2
    if b in ('church', 'chapel', 'cathedral', 'religious', 'shrine', 'basilica') or t.get('amenity') == 'place_of_worship': return 1
    if b in ('garage', 'garages', 'shed', 'roof', 'hut', 'kiosk', 'carport', 'cabin', 'service', 'barn', 'farm_auxiliary', 'storage_tank', 'container', 'toilets'): return 4
    if b in ('commercial', 'retail', 'industrial', 'warehouse', 'office', 'supermarket', 'hotel'): return 5
    if b in ('school', 'public', 'civic', 'hospital', 'train_station', 'station', 'government', 'university', 'kindergarten', 'sports_hall', 'stadium', 'transportation', 'fire_station'): return 6
    if b in ('greenhouse',): return 7
    if b in ('ruins',) or h == 'ruins': return 8
    if b in ('apartments', 'residential', 'terrace', 'dormitory'): return 9
    return 0   # (house, detached, villa, yes ...)
BLD_KINDS = '0 house / unknown, 1 church / chapel, 2 tower, 3 castle, 4 shed / garage / kiosk, 5 commercial / hotel / industrial, 6 public / station / school, 7 greenhouse, 8 ruin, 9 block of flats'

def obb(P):
    """Oriented box of a polygon (the hull's minimum-area rectangle): cx, cz, length, width, angle (rad, of the long side from +x towards +z)."""
    from scipy.spatial import ConvexHull
    P = np.asarray(P, float)
    try: H = P[ConvexHull(P).vertices]
    except Exception: H = P
    best = None
    for k in range(len(H)):
        e = H[(k + 1) % len(H)] - H[k]; L = math.hypot(*e)
        if L < 1e-6: continue
        u = e / L; v = np.array([-u[1], u[0]]); a = H @ u; b = H @ v
        area = (a.max() - a.min()) * (b.max() - b.min())
        if best is None or area < best[0]: best = (area, u, v, a.min(), a.max(), b.min(), b.max())
    area, u, v, a0, a1, b0, b1 = best
    c = u * (a0 + a1) / 2 + v * (b0 + b1) / 2; Lx, Ly = a1 - a0, b1 - b0
    ang = math.atan2(u[1], u[0])
    if Ly > Lx: Lx, Ly, ang = Ly, Lx, ang + math.pi / 2
    ang = (ang + math.pi / 2) % math.pi - math.pi / 2
    return c[0], c[1], Lx, Ly, ang, area

def poly_area(P):
    P = np.asarray(P, float); x, z = P[:, 0], P[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(z, -1)) - np.dot(z, np.roll(x, -1)))

def flat(P, k=1):
    return [round(float(v), k) for q in P for v in q]

def clip_near(P, d, lim, keep=1):
    """The runs of a polyline whose points lie within lim m of the road (and keep points beyond each end), as a list of polylines."""
    out, cur = [], []
    inside = np.abs(d) <= lim
    for k in range(len(P)):
        near = inside[max(0, k - keep):k + keep + 1].any()
        if near: cur.append(P[k])
        elif cur:
            if len(cur) > 1: out.append(cur)
            cur = []
    if len(cur) > 1: out.append(cur)
    return out

def build_vectors(F, line, L, R, D, bridges):
    A = Along(line, STEP); N, W = D['nodes'], D['ways']
    route_ways = {w[0] for w in R['ways']}; route_nodes = [n[0] for n in R['nodes']]; rset = set(route_nodes)
    def XZ(refs):
        pts = [N[r] for r in refs if r in N]
        if not pts: return np.zeros((0, 2))
        x, z = F.xz([p[0] for p in pts], [p[1] for p in pts]); return np.stack([x, z], 1)
    out = {}
    # buildings (OSM ways and multipolygons) with any part within 60 m of the centre line
    bld, outl = [], []
    items = [(k, refs, t) for k, (refs, t) in W.items() if 'building' in t and t.get('building') != 'no' and len(refs) > 3]
    items += [(k, None, t) for k, (mem, t) in D['rels'].items() if 'building' in t and t.get('type') == 'multipolygon']
    for k, refs, t in items:
        if refs is None:
            rings = rel_rings(D, D['rels'][k][0])
            if not rings: continue
            ring = max(rings, key=len); x, z = F.xz([p[0] for p in ring], [p[1] for p in ring]); P = np.stack([x, z], 1)
        else: P = XZ(refs)
        if len(P) < 3: continue
        s_, d_ = A.query(P)
        if np.abs(d_).min() > 60: continue
        cx, cz, Lx, Ly, ang, boxa = obb(P[:-1] if np.allclose(P[0], P[-1]) else P)
        sc, dc = A.query([[cx, cz]])
        h = bld_height(t)
        bld.append([r1(cx), r1(cz), r1(Lx), r1(Ly), round(ang, 3), r1(h), bld_kind(t), int(sc[0]), r1(dc[0])])
        if poly_area(P) < 0.8 * boxa and boxa > 60:   # not a rectangle: its outline too
            outl.append([len(bld) - 1, flat(P[:-1] if np.allclose(P[0], P[-1]) else P)])
    out['bld'] = bld; out['bldOutline'] = outl
    print('buildings within 60 m: %d (%d with outlines)' % (len(bld), len(outl)), flush=True)
    # trees and tree rows
    trees = []
    for nid, v in N.items():
        if len(v) > 2 and v[2].get('natural') == 'tree':
            x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]])
            if abs(d_[0]) <= 60: trees.append([r1(x), r1(z), tree_kind(v[2])])
    rows = []
    for k, (refs, t) in W.items():
        if t.get('natural') == 'tree_row':
            P = XZ(refs); s_, d_ = A.query(P)
            for part in clip_near(P, d_, 60): rows.append([tree_kind(t), flat(part)])
    out['trees'] = trees; out['treeRows'] = rows
    print('trees within 60 m: %d single, %d rows' % (len(trees), len(rows)), flush=True)
    # walls, fences, guard rails, hedges within 30 m
    walls = []
    for k, (refs, t) in W.items():
        b = t.get('barrier')
        if b not in ('wall', 'retaining_wall', 'fence', 'guard_rail', 'hedge', 'city_wall', 'jersey_barrier', 'handrail', 'railing'): continue
        P = XZ(refs)
        if len(P) < 2: continue
        s_, d_ = A.query(P)
        for part in clip_near(P, d_, 30):
            walls.append([b, r1(bld_height(t)), t.get('wall', '') or t.get('material', '') or t.get('fence_type', ''), flat(part)])
    out['walls'] = walls
    print('walls / fences / rails within 30 m: %d' % len(walls), flush=True)
    # the coast, cliffs, beaches and rocks, water
    coast, cliffs, areas, water = [], [], [], []
    for k, (refs, t) in W.items():
        nat = t.get('natural'); ww = t.get('waterway')
        if nat == 'coastline' or nat == 'cliff' or ww in ('stream', 'river', 'canal', 'ditch', 'drain'):
            P = XZ(refs)
            if len(P) < 2: continue
            s_, d_ = A.query(P)
            lim = 400 if nat == 'coastline' else 300 if nat == 'cliff' else 100
            for part in clip_near(P, d_, lim):
                if nat == 'coastline': coast.append(flat(part))
                elif nat == 'cliff': cliffs.append(flat(part))
                else: water.append([ww, t.get('name', '') if t.get('name', '') in GEO_WATER else '', 1 if t.get('tunnel') in ('yes', 'culvert') else 0, flat(part)])
        elif nat in ('beach', 'sand', 'bare_rock', 'scree', 'shingle', 'rock') and len(refs) > 3:
            P = XZ(refs); s_, d_ = A.query(P)
            if np.abs(d_).min() <= 300: areas.append([nat, flat(P)])
    for rid, (mem, t) in D['rels'].items():
        if t.get('type') == 'multipolygon' and t.get('natural') in ('beach', 'bare_rock', 'scree', 'shingle'):
            for ring in rel_rings(D, mem):
                x, z = F.xz([p[0] for p in ring], [p[1] for p in ring]); P = np.stack([x, z], 1); s_, d_ = A.query(P)
                if np.abs(d_).min() <= 300: areas.append([t['natural'], flat(P)])
    out['coast'] = coast; out['cliffs'] = cliffs; out['shore'] = areas; out['water'] = water
    print('coast %d pieces, cliffs %d, beaches / rocks %d, streams %d' % (len(coast), len(cliffs), len(areas), len(water)), flush=True)
    # the railway (and the funicular), within 200 m
    rail = []
    for k, (refs, t) in W.items():
        rw = t.get('railway')
        if rw not in ('rail', 'funicular', 'light_rail', 'abandoned', 'disused', 'narrow_gauge'): continue
        P = XZ(refs)
        if len(P) < 2: continue
        s_, d_ = A.query(P)
        for part in clip_near(P, d_, 200):
            rail.append([rw, 1 if t.get('bridge') else 0, 1 if t.get('tunnel') else 0, flat(part)])
    out['rail'] = rail
    print('railway pieces within 200 m: %d' % len(rail), flush=True)
    # other roads and paths within 60 m (clipped to 80 m), and the side roads that meet the route
    roads = []
    DR = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'track', 'pedestrian', 'footway',
          'path', 'steps', 'cycleway', 'bridleway', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'}
    for k, (refs, t) in W.items():
        hw = t.get('highway')
        if hw not in DR or k in route_ways or t.get('area') == 'yes': continue
        if t.get('footway') in ('crossing', 'sidewalk') or t.get('path') == 'crossing': continue
        P = XZ(refs)
        if len(P) < 2: continue
        s_, d_ = A.query(P)
        if np.abs(d_).min() > 60: continue
        par = 1 if (np.abs(d_) < 12).mean() > 0.6 and len(P) > 2 else 0
        for part in clip_near(P, d_, 80):
            roads.append([hw, t.get('lanes', ''), t.get('width', ''), 1 if t.get('bridge') else 2 if t.get('tunnel') else 0, int(t.get('layer', 0) or 0) if str(t.get('layer', '0')).lstrip('-').isdigit() else 0,
                          t.get('surface', ''), t.get('name', '') if t.get('name', '') in GEO_ROADS else '', par, flat(part)])
    out['roads'] = roads
    print('other roads / paths within 60 m: %d pieces' % len(roads), flush=True)
    # side roads: every drivable road or path that shares a node with the route (each branch leaving it: its first 60 m)
    side = []
    for k, (refs, t) in W.items():
        hw = t.get('highway')
        if hw not in DR or k in route_ways or t.get('area') == 'yes': continue
        if t.get('footway') in ('crossing',) or t.get('path') == 'crossing': continue
        for j, r in enumerate(refs):
            if r not in rset: continue
            for dirn in (1, -1):
                br = [refs[q] for q in (range(j, len(refs)) if dirn > 0 else range(j, -1, -1))]
                if len(br) < 2 or br[1] in rset and len(br) < 3: continue
                P = XZ(br); seg = np.hypot(*(P[1:] - P[:-1]).T); cum = np.concatenate([[0], np.cumsum(seg)])
                m = int(np.searchsorted(cum, 60)) + 1; P = P[:m]
                if len(P) < 2 or cum[min(len(cum) - 1, m - 1)] < 3: continue
                s0, d0 = A.query(P[:1]); t0 = A.T[int(s0[0] / STEP) % A.n]
                q = P[min(len(P) - 1, 2)] - P[0]
                if math.hypot(*q) < 1e-3: continue
                ang = math.degrees(math.atan2(t0[0] * q[1] - t0[1] * q[0], t0[0] * q[0] + t0[1] * q[1]))   # (+: to the right of the travel direction)
                side.append([int(s0[0]), 1 if ang > 0 else -1, round(ang), hw, t.get('lanes', '') or t.get('width', ''), 1 if t.get('oneway') == 'yes' else 0,
                             t.get('name', '') if t.get('name', '') in GEO_ROADS else '', flat(P)])
    side.sort(key=lambda e: e[0]); out['side'] = side
    print('side roads meeting the route: %d (%d drivable)' % (len(side), sum(1 for e in side if e[3] not in ('footway', 'path', 'steps', 'cycleway', 'pedestrian', 'bridleway'))), flush=True)
    # crossings, signals, signs on the route; lamps and bus stops by it
    marks, lamps, stops = [], [], []
    for r in route_nodes:
        v = N.get(r)
        if not v or len(v) < 3: continue
        t = v[2]; kind = t.get('highway') or ('calming' if t.get('traffic_calming') else '')
        if kind in ('crossing', 'traffic_signals', 'stop', 'give_way', 'calming', 'mini_roundabout'):
            x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]])
            marks.append([int(s_[0]), kind, t.get('crossing', '') or t.get('traffic_calming', '')])
    for nid, v in N.items():
        if len(v) < 3: continue
        t = v[2]
        if t.get('highway') in ('street_lamp', 'bus_stop') or t.get('public_transport') == 'platform' and t.get('bus') == 'yes':
            x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]])
            if abs(d_[0]) > 30: continue
            if t.get('highway') == 'street_lamp': lamps.append([r1(x), r1(z)])
            else: stops.append([int(s_[0]), 1 if d_[0] > 0 else -1, r1(abs(d_[0])), 1 if t.get('shelter') == 'yes' else 0])
    marks.sort(); stops.sort(); out['onRoad'] = marks; out['lamps'] = lamps; out['stops'] = stops
    print('on the road: %d crossings / signals / calming; %d lamps, %d bus stops by it' % (len(marks), len(lamps), len(stops)), flush=True)
    # the route's bridges, and the bridges over it (a railway or road on a bridge crossing the line)
    over = []
    for k, (refs, t) in W.items():
        if not (t.get('bridge') in ('yes', 'viaduct') and (t.get('railway') or t.get('highway'))) or k in route_ways: continue
        if rset.intersection(refs) or t.get('footway') in ('crossing', 'sidewalk'): continue   # (a street on the same deck, a crossing on it)
        P = XZ(refs)
        if len(P) < 2: continue
        s_, d_ = A.query(P)
        if np.abs(d_).min() > 15 or not (d_.min() < 0 < d_.max()): continue
        kk = int(np.argmin(np.abs(d_)))
        over.append([int(s_[kk]), 'rail' if t.get('railway') else 'road', t.get('railway') or t.get('highway')])
    out['bridges'] = [[r1(a), r1(b)] for a, b, nm in bridges]; out['over'] = sorted(over)
    print('route bridges %d; bridges over the route: %s' % (len(bridges), over), flush=True)
    # landmarks
    lm = []
    for key, (lab, en, kind) in MARKS.items():
        refs = W.get(key[1:], [None])[0] if key[0] == 'w' else None
        if not refs: print('  landmark missing', key, lab); continue
        P = XZ(refs); s_, d_ = A.query(P); kk = int(np.argmin(np.abs(d_)))
        lm.append([lab, en, kind, int(s_[kk]), r1(d_[kk]), flat(P)])
    terr = [k for k, (refs, t) in W.items() if t.get('highway') == 'pedestrian' and 'Ardenza' in t.get('old_name', '') and 'Rotonda' in t.get('old_name', '')]
    if terr:
        P = np.vstack([XZ(W[k][0]) for k in terr]); s_, d_ = A.query(P); kk = int(np.argmin(np.abs(d_)))
        from scipy.spatial import ConvexHull
        H = P[ConvexHull(P).vertices]
        lm.append([TERRACE[0], TERRACE[1], TERRACE[2], int(s_[kk]), r1(d_[kk]), flat(H)])
    out['landmarks'] = lm
    for e in lm: print('  landmark %-24s s=%6d  d=%7.1f m' % (e[0], e[3], e[4]))
    # places (the HUD's names): the nearest point of the road to OSM's place
    PLACES = [('Ardenza', None, 0.0), ('Montenero', '1025671728', None), ('Savolano', '6407666847', None), ('Castellaccio', '338918542', None),
              ('Romito', '2494947269', None), ('Calafuria', '2043808407', None), ('Boccale', '2043808406', None), ('Antignano', '9558246709', None)]
    pl = []
    for lab, nid, s0 in PLACES:
        if nid:
            v = N[nid]; x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]]); s0 = float(s_[0]); dd = float(d_[0])
        else: dd = 0.0
        i = int(round(s0 / STEP)) % A.n
        pl.append([lab, r1(line[i, 0]), r1(line[i, 1]), int(s0), r1(dd)])
    out['places'] = pl
    for e in pl: print('  place %-14s s=%6d  (OSM place %5.0f m from the road)' % (e[0], e[3], abs(e[4])))
    return out

def bends(line):
    """The bends: [s of the apex, radius (m), side (1 right, -1 left), turn (deg)] where the radius is under 60 m."""
    k = ndimage.gaussian_filter1d(curvature(line, STEP), 1.5, mode='wrap'); out = []
    on = np.abs(k) > 1 / 60
    idx = np.where(on)[0]
    if not len(idx): return out
    groups = np.split(idx, np.where(np.diff(idx) > 1)[0] + 1)
    for g in groups:
        sg = np.sign(k[g])
        for part in np.split(g, np.where(np.diff(sg) != 0)[0] + 1):
            a = part[np.argmax(np.abs(k[part]))]
            out.append([int(a * STEP), r1(1 / abs(k[a])), int(np.sign(k[a])), int(round(math.degrees(abs(k[part].sum()) * STEP)))])
    return out

def main():
    raw = sys.argv[1]
    R = json.load(open(os.path.join(raw, 'route.json')))
    D = json.load(open(os.path.join(raw, 'osm.json')))
    n0 = R['nodes'][0]; F = Frame(n0[1], n0[2])
    line, Lraw, L = build_line(R, F)
    k = curvature(line, L / len(line))
    print('line: %d points every %.3f m, %.1f m (OSM polyline %.1f m); tightest radius %.1f m' % (len(line), L / len(line), L, Lraw, 1 / np.abs(k).max()))
    tight = np.where(np.abs(k) > 1 / 15)[0]
    if len(tight):
        groups = np.split(tight, np.where(np.diff(tight) > 2)[0] + 1)
        print('  bends under 15 m radius at s =', ', '.join('%d (%.0f m)' % (g[0] * L / len(line), 1 / np.abs(k[g]).max()) for g in groups))
    dsm, gnd, T = ground_model(raw, D)
    print('ground: dsm %.1f-%.1f m, ground %.1f-%.1f m' % (dsm.min(), dsm.max(), gnd.min(), gnd.max()))
    bridges = route_spans(R, line, F, 'bridge')
    print('route bridges:', ', '.join('%s %.0f-%.0f' % (nm, a, b) for a, b, nm in bridges))
    h0, h = road_heights(line, F, gnd, T, bridges)
    g = np.diff(np.concatenate([h, h[:1]])) / STEP
    print('heights: %.1f-%.1f m (start %.1f m), max grade up %.1f %%, down %.1f %%; raw-smoothed rms %.1f m' % (h.min(), h.max(), h[0], g.max() * 100, -g.min() * 100, np.sqrt(((h0 - h) ** 2).mean())))
    for nm, s0 in (('Montenero Basso', 2900), ('Savolano', 4100), ('Castellaccio', 6950), ('Curva hairpin', 8459), ('Romito', 11600), ('Calafuria', 14000), ('Antignano', 17188)):
        i = int(s0 / STEP); print('   %-16s s=%5d  h=%6.1f  raw=%6.1f' % (nm, s0, h[i], h0[i]))
    if '--line-only' in sys.argv: return F, line, L, R, D, h0, h, dsm, gnd, T
    out_dir = HERE
    grids = build_grids(F, line, dsm, gnd, T, D, out_dir)
    vec = build_vectors(F, line, L, R, D, bridges)
    # the route's roads along the lap: [s0, s1, name (geographic ones only), highway, lanes, width, oneway today, surface, maxspeed, bridge]
    A = Along(line, STEP)
    lat = np.array([n[1] for n in R['nodes']]); lon = np.array([n[2] for n in R['nodes']]); x, z = F.xz(lat, lon); sN, _ = A.query(np.stack([x, z], 1))
    sN[-1] = sN[-1] if sN[-1] > 1 else L
    ways = []
    for w, nm, hw, i0, i1, tg in R['ways']:
        a, b = float(sN[i0]), float(sN[min(i1, len(sN) - 1)]) if i1 < len(sN) else L
        ways.append([r1(a), r1(b), nm if nm in GEO_ROADS else '', hw, tg.get('lanes', ''), tg.get('width', ''), tg.get('oneway', ''), tg.get('surface', ''), tg.get('maxspeed', ''), 1 if tg.get('bridge') else 0])
    about = {
        'track': 'Livorno, Italija (id livorno): the old road course of 1922-1930 by Livorno on today\'s roads, one lap clockwise from the start line at Ardenza Mare',
        'frame': 'metres; origin = the start line (lat0, lon0: the seafront road on the bridge over the Rio Ardenza by the Rotonda); x east, z south; x = (lon - lon0) * N cos(lat0), z = -(lat - lat0) * M (WGS84 radii at lat0)',
        'line': 'the centre line every %.3f m from the start line round the lap (closed; the last point joins the first): OSM\'s polyline every 1 m, a Gaussian of sigma 3 m (the corners rounded), resampled' % (L / len(line)),
        'h': 'the road\'s height at each point of line (m above sea level, 0.1 m): the ground model across the road (median of 5 samples, -8..8 m), the bridges straight from bank to bank, dips under 60 m filled, a 35 m median, sigma 15 m, grades at most 12 %, sigma 5 m',
        'hRaw': 'the ground model under each point of line before the smoothing (m, 0.1 m)',
        'ways': '[s0, s1, road name (geographic names only), OSM highway, lanes, width, oneway today, surface, maxspeed, bridge]: the route\'s OSM ways along the lap (s in m from the start line)',
        'bends': '[s of the apex, radius m, side (1 right, -1 left), turn deg]: the bends of line with a radius under 60 m',
        'bld': '[x, z, length, width, angle (rad, the long side from +x towards +z), height (m, 0 = not in OSM), kind, s, d (m, + right of the travel direction)]: the buildings with any part within 60 m (OSM); kinds: ' + BLD_KINDS,
        'bldOutline': '[index in bld, [x, z, ...]]: the outline of the buildings that are not a rectangle',
        'trees': '[x, z, kind]: single trees (OSM) within 60 m; kind p pine, c cypress, o olive, m palm, b broadleaved, \'\' unknown', 'treeRows': '[kind, [x, z, ...]]',
        'walls': '[barrier (OSM: wall, retaining_wall, fence, guard_rail, hedge ...), height (0 = untagged), wall / material, [x, z, ...]]: within 30 m',
        'coast': '[x, z, ...]: the coastline within 400 m (OSM: the land on the left of the way\'s direction, the sea on the right)', 'cliffs': '[x, z, ...]: cliffs within 300 m (OSM: the lower side on the right)',
        'shore': '[natural (beach, bare_rock ...), [x, z, ...] outline]: within 300 m', 'water': '[waterway, name (geographic), culvert / tunnel, [x, z, ...]]: streams within 100 m',
        'rail': '[railway (rail, funicular ...), bridge, tunnel, [x, z, ...]]: within 200 m',
        'roads': '[highway, lanes, width, 1 bridge / 2 tunnel, layer, surface, name (geographic), par (1: a carriageway alongside the route), [x, z, ...]]: other roads and paths within 60 m (clipped to 80 m)',
        'side': '[s, side (1 right, -1 left), angle (deg from the travel direction, + right), highway, lanes or width, oneway, name (geographic), [x, z, ...] the first 60 m from the junction]: every road and path that meets the route',
        'onRoad': '[s, kind (crossing, traffic_signals, stop, give_way, calming), detail]', 'lamps': '[x, z]: street lamps within 30 m', 'stops': '[s, side, distance, shelter]: bus stops within 30 m',
        'bridges': '[s0, s1]: the route on a bridge', 'over': '[s, rail / road, kind]: a railway or road on a bridge over the route',
        'landmarks': '[label (game, Slovenian), English, kind, s, d, [x, z, ...] outline]: s and d of its nearest point', 'places': '[label, x, z, s, d of OSM\'s place from the road]: the HUD\'s places',
        'grids': 'PNG files next to this one (see each entry)',
        'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0), downloaded %s; Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0)' % R.get('date', '2026-11-02'),
        'tools': 'tools/livorno/osm.py -> route.py -> data.py (see their headers)',
    }
    data = {'about': about, 'lat0': round(F.lat0, 7), 'lon0': round(F.lon0, 7), 'length': r1(L, 2), 'step': round(L / len(line), 4),
            'line': flat(line, 2), 'h': [r1(v) for v in h], 'hRaw': [r1(v) for v in h0], 'ways': ways, 'bends': bends(line), 'grids': grids}
    data.update(vec)
    path = os.path.join(out_dir, 'livorno.json')
    with open(path, 'w') as f:
        f.write('{\n' + ',\n'.join(json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) for k, v in data.items()) + '\n}\n')
    print('wrote', path, os.path.getsize(path) // 1024, 'KB; grids:', ', '.join('%s %d KB' % (g['file'], os.path.getsize(os.path.join(out_dir, g['file'])) // 1024) for g in grids.values()))
    return F, line, L, R, D, h0, h, dsm, gnd, T

if __name__ == '__main__':
    main()
