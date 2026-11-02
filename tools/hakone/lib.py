# Shared helpers of the Hakone track data tools (tools/hakone, plan: docs/proga-hakone.md).
# The downloads live outside the repository, in the cache (HAKONE_CACHE, default ~/.cache/hakone): osm/*.xml (osm.py), dem/*.tif and the
# WorldCover / canopy windows (teren.py, okolica.py). Run every script from the repository root with python3 -I (numpy, Pillow; rasterio for
# the windows of WorldCover and the canopy heights: pip install rasterio).
import json, math, os, pickle, glob, urllib.request, xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'podatki')
CACHE = os.environ.get('HAKONE_CACHE', os.path.expanduser('~/.cache/hakone'))
BOX = (35.185, 139.010, 35.255, 139.120)   # lat0, lon0, lat1, lon1: the OSM download (the lap and ~650 m round it)

# ---------------- OpenStreetMap ----------------
def osm():
    """All OSM chunks merged: N {id: (lat, lon)}, NT {id: tags}, W {id: (node ids, tags)}, R {id: (members [(type, ref, role)], tags)}."""
    pk = os.path.join(CACHE, 'osm_all.pkl'); files = sorted(glob.glob(os.path.join(CACHE, 'osm', '*.xml')))
    if not files: raise SystemExit('no OSM data in %s/osm: python3 -I tools/hakone/osm.py first' % CACHE)
    if os.path.exists(pk) and os.path.getmtime(pk) > max(os.path.getmtime(f) for f in files): return pickle.load(open(pk, 'rb'))
    N, NT, W, R = {}, {}, {}, {}
    for f in files:
        for ev, el in ET.iterparse(f, events=('end',)):
            if el.tag == 'node':
                i = int(el.get('id')); N[i] = (float(el.get('lat')), float(el.get('lon')))
                t = {c.get('k'): c.get('v') for c in el if c.tag == 'tag'}
                if t: NT[i] = t
                el.clear()
            elif el.tag == 'way':
                W[int(el.get('id'))] = ([int(c.get('ref')) for c in el if c.tag == 'nd'], {c.get('k'): c.get('v') for c in el if c.tag == 'tag'}); el.clear()
            elif el.tag == 'relation':
                i = int(el.get('id')); m = [(c.get('type'), int(c.get('ref')), c.get('role')) for c in el if c.tag == 'member']
                t = {c.get('k'): c.get('v') for c in el if c.tag == 'tag'}
                if i in R: m = R[i][0] + [x for x in m if x not in R[i][0]]
                R[i] = (m, t); el.clear()
    pickle.dump((N, NT, W, R), open(pk, 'wb'))
    return N, NT, W, R

# ---------------- the game's frame ----------------
# x east, z south, metres, origin = the start line (pot.py writes it to podatki/pot.json); a local tangent plane with the WGS84 radii at the
# origin's latitude (as maketa-menija/orodja/geo_lib.py Geo with rot 0, scale 1)
A_WGS, E2 = 6378137.0, 0.0066943799901413165
class Frame:
    def __init__(self, lat0, lon0):
        self.lat0, self.lon0 = lat0, lon0; s = math.sin(math.radians(lat0)); w = 1 - E2 * s * s
        self.M = A_WGS * (1 - E2) / w ** 1.5; self.N = A_WGS / math.sqrt(w); self.c = math.cos(math.radians(lat0))
    def xz(self, lat, lon):
        lat = np.asarray(lat, dtype=np.float64); lon = np.asarray(lon, dtype=np.float64)
        return np.radians(lon - self.lon0) * self.N * self.c, -np.radians(lat - self.lat0) * self.M
    def ll(self, x, z):
        x = np.asarray(x, dtype=np.float64); z = np.asarray(z, dtype=np.float64)
        return self.lat0 - np.degrees(z / self.M), self.lon0 + np.degrees(x / (self.N * self.c))
def frame():
    o = json.load(open(os.path.join(OUT, 'pot.json')))['origin']; return Frame(o['lat'], o['lon'])

# ---------------- Copernicus DEM GLO-30 ----------------
DEM_URL = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N35_00_E%03d_00_DEM/Copernicus_DSM_COG_10_N35_00_E%03d_00_DEM.tif'
def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000: return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'dirkaska-igra track data'}), timeout=600) as r: open(path + '.part', 'wb').write(r.read())
    os.replace(path + '.part', path); return path
class Dem:
    """The two 1 x 1 degree tiles (N35 E138: Mount Fuji, N35 E139: Hakone), 3600 x 3600, pixel is point: pixel (0, 0) at (36 N, lon0)."""
    def __init__(self):
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        self.t = {}
        for lo in (138, 139):
            p = fetch(DEM_URL % (lo, lo), os.path.join(CACHE, 'dem', 'cop30_N35E%03d.tif' % lo))
            self.t[lo] = np.array(Image.open(p), dtype=np.float32)
    def sample(self, lat, lon):
        lat = np.atleast_1d(np.asarray(lat, dtype=np.float64)); lon = np.atleast_1d(np.asarray(lon, dtype=np.float64)); out = np.full(lat.shape, np.nan)
        for lo, a in self.t.items():
            m = (lon >= lo) & (lon < lo + 1) & (lat >= 35) & (lat < 36)
            if not m.any(): continue
            r = (36.0 - lat[m]) * 3600; c = (lon[m] - lo) * 3600
            r0 = np.clip(np.floor(r).astype(int), 0, a.shape[0] - 2); c0 = np.clip(np.floor(c).astype(int), 0, a.shape[1] - 2); u = r - r0; v = c - c0
            out[m] = a[r0, c0] * (1 - u) * (1 - v) + a[r0, c0 + 1] * (1 - u) * v + a[r0 + 1, c0] * u * (1 - v) + a[r0 + 1, c0 + 1] * u * v
        return out

# ---------------- the road: distance from it ----------------
class Line:
    """The lap's centre line (points every few metres, closed): distance, arc length and side of any point (x, z), via a 32 m hash grid."""
    def __init__(self, x, z, s, cell=32.0):
        self.x, self.z, self.s, self.cell = np.asarray(x), np.asarray(z), np.asarray(s), cell; self.h = {}
        for k in range(len(self.x) - 1):
            for gx in {int(math.floor(self.x[k] / cell)), int(math.floor(self.x[k + 1] / cell))}:
                for gz in {int(math.floor(self.z[k] / cell)), int(math.floor(self.z[k + 1] / cell))}: self.h.setdefault((gx, gz), []).append(k)
    def near(self, x, z, rmax=200.0):
        """(distance, s, side: +1 right of the driving direction / -1 left, segment) of the nearest point of the line within rmax, else (inf, ...)"""
        best = (math.inf, 0.0, 0, -1); r = int(math.ceil(rmax / self.cell)); gx0, gz0 = int(math.floor(x / self.cell)), int(math.floor(z / self.cell)); seen = set()
        for gx in range(gx0 - r, gx0 + r + 1):
            for gz in range(gz0 - r, gz0 + r + 1):
                for k in self.h.get((gx, gz), ()):
                    if k in seen: continue
                    seen.add(k); ax, az, bx, bz = self.x[k], self.z[k], self.x[k + 1], self.z[k + 1]; dx, dz = bx - ax, bz - az; L2 = dx * dx + dz * dz or 1e-9
                    u = max(0.0, min(1.0, ((x - ax) * dx + (z - az) * dz) / L2)); px, pz = ax + u * dx, az + u * dz; d = math.hypot(x - px, z - pz)
                    if d < best[0]:
                        cr = dx * (z - az) - dz * (x - ax)   # (x east, z south: a point to the right of the way has cross > 0)
                        best = (d, self.s[k] + u * math.sqrt(L2), 1 if cr > 0 else -1, k)
        return best if best[0] <= rmax else (math.inf, 0.0, 0, -1)
def line():
    P = json.load(open(os.path.join(OUT, 'pot.json'))); p = np.array(P['points']); n = len(p)
    return Line(p[:, 0], p[:, 1], np.arange(n) * P['step']), P

# ---------------- encodings the game already reads ----------------
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (NR_A64 in js/world.js: the run-length codes of def.lc)
def rle_lc(a):
    """Land cover classes (0..7) as the run-length code of js/world-vrsic.js vrPrep: a symbol = class * 8 + run - 1; a run of 8 or more: 7,
    then digits of 64 (the extra length) until one below 63."""
    a = np.asarray(a).ravel(); out = []; k = 0; n = len(a)
    while k < n:
        c = int(a[k]); j = k
        while j < n and a[j] == c: j += 1
        run = j - k
        if run <= 7: out.append(A64[c * 8 + run - 1])
        else:
            out.append(A64[c * 8 + 7]); e = run - 8
            while e >= 63: out.append(A64[63]); e -= 63
            out.append(A64[e])
        k = j
    return ''.join(out)
def b64(b):
    import base64
    return base64.b64encode(bytes(b)).decode('ascii')
def save(name, obj):
    os.makedirs(OUT, exist_ok=True); p = os.path.join(OUT, name)
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote %s (%.0f KB)' % (os.path.relpath(p), os.path.getsize(p) / 1024))

# ---------------- windows of big rasters (rasterio over HTTP range requests), cached as .npz ----------------
WC_URL = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N33E138_Map.tif'
CHM_URL = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/%s.tif'
def _env():
    import rasterio
    ca = '/root/.ccr/ca-bundle.crt'
    kw = dict(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif', GDAL_HTTP_MULTIRANGE='YES', GDAL_HTTP_MERGE_CONSECUTIVE_RANGES='YES', VSI_CACHE='TRUE', GDAL_CACHEMAX=512)
    if os.path.exists(ca): kw['CURL_CA_BUNDLE'] = ca
    return rasterio.Env(**kw)
def worldcover(lat0, lon0, lat1, lon1, name):
    """ESA WorldCover 2021 (10 m, its own lat/lon grid) over a box -> (classes uint8 north at the top, lat of row 0's top edge, lon of column
    0's left edge, cell in degrees). Classes: 10 trees, 20 shrubs, 30 grass, 40 crops, 50 built-up, 60 bare, 70 snow, 80 water, 90 wetland."""
    p = os.path.join(CACHE, 'wc_%s.npz' % name)
    if not os.path.exists(p):
        import rasterio
        from rasterio.windows import from_bounds
        with _env(), rasterio.open('/vsicurl/' + WC_URL) as src:
            win = from_bounds(lon0, lat0, lon1, lat1, src.transform).round_offsets().round_lengths()
            a = src.read(1, window=win); t = src.window_transform(win)
        np.savez_compressed(p, a=a, lat_top=t.f, lon_left=t.c, d=t.a)
    z = np.load(p); return z['a'], float(z['lat_top']), float(z['lon_left']), float(z['d'])
def quadkey(lat, lon, z=9):
    x = int((lon + 180) / 360 * 2 ** z); y = int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** z)
    return ''.join(str(((x >> (i - 1)) & 1) + 2 * ((y >> (i - 1)) & 1)) for i in range(z, 0, -1))
def canopy(lat0, lon0, lat1, lon1, name, down=1):
    """Canopy heights (Meta / WRI High Resolution Canopy Height Maps 2024, CC BY 4.0: m above the ground, ~1.2 m web mercator cells) over a
    box, averaged over down x down cells -> (heights float32 north at the top, x of column 0's left edge, y of row 0's top edge, cell: EPSG:3857 m)."""
    p = os.path.join(CACHE, 'chm_%s_%d.npz' % (name, down))
    if not os.path.exists(p):
        import rasterio
        from rasterio.windows import from_bounds
        from rasterio.warp import transform_bounds
        from rasterio.enums import Resampling
        with _env(), rasterio.open('/vsicurl/' + CHM_URL % quadkey((lat0 + lat1) / 2, (lon0 + lon1) / 2)) as src:
            b = transform_bounds('EPSG:4326', src.crs, lon0, lat0, lon1, lat1)
            win = from_bounds(*b, src.transform).round_offsets().round_lengths(); t = src.window_transform(win)
            h, w = int(win.height // down), int(win.width // down)
            a = src.read(1, window=win, out_shape=(h, w), resampling=Resampling.average if down > 1 else Resampling.nearest).astype(np.float32)
        np.savez_compressed(p, a=a, x0=t.c, y0=t.f, d=t.a * down)
    z = np.load(p); return z['a'], float(z['x0']), float(z['y0']), float(z['d'])
def merc(lat, lon):   # EPSG:3857 metres
    lat = np.asarray(lat, dtype=np.float64); lon = np.asarray(lon, dtype=np.float64)
    return np.radians(lon) * 6378137.0, np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * 6378137.0
def sample_grid(a, x0, y0, d, mx, my):   # bilinear on a north-up grid of cell centres (x0, y0: the top-left corner)
    c = (np.asarray(mx) - x0) / d - 0.5; r = (y0 - np.asarray(my)) / d - 0.5
    c0 = np.clip(np.floor(c).astype(int), 0, a.shape[1] - 2); r0 = np.clip(np.floor(r).astype(int), 0, a.shape[0] - 2); u = np.clip(c - c0, 0, 1); v = np.clip(r - r0, 0, 1)
    return a[r0, c0] * (1 - u) * (1 - v) + a[r0, c0 + 1] * u * (1 - v) + a[r0 + 1, c0] * (1 - u) * v + a[r0 + 1, c0 + 1] * u * v
