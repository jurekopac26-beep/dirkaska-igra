# Mockup only: the real land for the journey on the globe and round the game's worlds.
# Elevation: the AWS Terrain Tiles (terrarium PNGs, web mercator; SRTM, EU-DEM, NED and others), cached in raw/geo/tiles/.
# Land cover: ESA WorldCover 10 m 2021 (CC BY 4.0), read from its cloud-optimised GeoTIFFs on AWS.
import io, json, math, os, time, urllib.request
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw', 'geo')
TILES = os.path.join(RAW, 'tiles')
os.makedirs(TILES, exist_ok=True)
CA = '/root/.ccr/ca-bundle.crt'
if os.path.exists(CA): os.environ.setdefault('CURL_CA_BUNDLE', CA); os.environ.setdefault('SSL_CERT_FILE', CA)

def fetch(url, path, tries=4):
    if os.path.exists(path): return open(path, 'rb').read()
    for k in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r: data = r.read()
            os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(data); return data
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(2 ** k)

# ---------------- elevation (terrarium tiles) ----------------
def tile_xy(lat, lon, z):   # fractional tile coordinates (web mercator)
    n = 2 ** z; x = (lon + 180) / 360 * n
    la = math.radians(lat); y = (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n
    return x, y

def tile_ll(x, y, z):   # tile coordinates -> lat, lon
    n = 2 ** z; lon = x / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon

def terrarium(z, x, y):
    p = os.path.join(TILES, 'terrarium', str(z), str(x), '%d.png' % y)
    d = fetch('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/%d/%d/%d.png' % (z, x, y), p)
    a = np.asarray(Image.open(io.BytesIO(d)).convert('RGB')).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

class DEM:
    """The elevation over a lat/lon box at tile zoom z, as one mosaic; sample(lat, lon) bilinear (arrays)."""
    def __init__(self, lat0, lon0, lat1, lon1, z):
        self.z = z
        xa, ya = tile_xy(max(lat0, lat1), min(lon0, lon1), z); xb, yb = tile_xy(min(lat0, lat1), max(lon0, lon1), z)
        self.tx0, self.ty0, tx1, ty1 = int(xa), int(ya), int(xb), int(yb)
        rows = []
        for ty in range(self.ty0, ty1 + 1): rows.append(np.concatenate([terrarium(z, tx, ty) for tx in range(self.tx0, tx1 + 1)], axis=1))
        self.a = np.concatenate(rows, axis=0)
    def sample(self, lat, lon):
        lat = np.asarray(lat, dtype=np.float64); lon = np.asarray(lon, dtype=np.float64); n = 2 ** self.z
        x = (lon + 180) / 360 * n; la = np.radians(lat); y = (1 - np.log(np.tan(la) + 1 / np.cos(la)) / np.pi) / 2 * n
        px = (x - self.tx0) * 256 - 0.5; py = (y - self.ty0) * 256 - 0.5
        H, W = self.a.shape; px = np.clip(px, 0, W - 1.001); py = np.clip(py, 0, H - 1.001)
        i = np.floor(px).astype(int); j = np.floor(py).astype(int); fx = px - i; fy = py - j
        a = self.a
        return (a[j, i] * (1 - fx) + a[j, i + 1] * fx) * (1 - fy) + (a[j + 1, i] * (1 - fx) + a[j + 1, i + 1] * fx) * fy

# ---------------- the game's flat world <-> the globe ----------------
A_WGS, F_WGS = 6378137.0, 1 / 298.257223563
E2 = F_WGS * (2 - F_WGS)
def radii(lat):   # meridian (M) and prime vertical (N) radii of curvature at lat (degrees)
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)

class Geo:
    """A game world placed on the Earth: its origin at (lat0, lon0), turned by rot degrees (the game's north = true north turned
    clockwise by rot), x east, z south, metres. to_ll(x, z) -> lat, lon (arrays); to_xz(lat, lon) -> x, z."""
    def __init__(self, lat0, lon0, rot=0.0, scale=1.0):
        self.lat0, self.lon0, self.rot, self.scale = lat0, lon0, rot, scale
        self.M, self.N = radii(lat0); self.c = math.cos(math.radians(lat0))
    def to_ll(self, x, z):
        x = np.asarray(x, dtype=np.float64) * self.scale; z = np.asarray(z, dtype=np.float64) * self.scale
        r = math.radians(self.rot); e = x * math.cos(r) + z * math.sin(r); s = -x * math.sin(r) + z * math.cos(r)   # east, south (true)
        return self.lat0 - np.degrees(s / self.M), self.lon0 + np.degrees(e / (self.N * self.c))
    def to_xz(self, lat, lon):
        e = np.radians(np.asarray(lon, dtype=np.float64) - self.lon0) * self.N * self.c; s = -np.radians(np.asarray(lat, dtype=np.float64) - self.lat0) * self.M
        r = math.radians(self.rot); x = e * math.cos(r) - s * math.sin(r); z = e * math.sin(r) + s * math.cos(r)
        return x / self.scale, z / self.scale

def track(tid):
    return json.load(open(os.path.join(RAW, tid + '-track.json')))

def haversine(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2); dp = p2 - p1; dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371008.8 * math.asin(math.sqrt(a))

# ---------------- land cover (ESA WorldCover 10 m 2021, 3x3 degree COG tiles) ----------------
# classes: 10 tree cover, 20 shrubland, 30 grassland, 40 cropland, 50 built-up, 60 bare / sparse, 70 snow and ice, 80 water,
# 90 herbaceous wetland, 95 mangroves, 100 moss and lichen (0: no data)
WC_URL = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_%s_Map.tif'
def wc_tile(lat, lon):
    la = int(math.floor(lat / 3) * 3); lo = int(math.floor(lon / 3) * 3)
    return '%s%02d%s%03d' % ('N' if la >= 0 else 'S', abs(la), 'E' if lo >= 0 else 'W', abs(lo)), la, lo

def landcover(lat0, lon0, lat1, lon1, W, H):
    """The WorldCover classes on a W x H lat/lon grid over the box (north at the top), the most common class in each cell."""
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.enums import Resampling
    out = np.zeros((H, W), np.uint8)
    la0, la1, lo0, lo1 = min(lat0, lat1), max(lat0, lat1), min(lon0, lon1), max(lon0, lon1)
    env = dict(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif', GDAL_HTTP_MULTIRANGE='YES', GDAL_HTTP_MERGE_CONSECUTIVE_RANGES='YES', VSI_CACHE='TRUE', GDAL_CACHEMAX=512)
    tiles = set()
    for la in np.arange(math.floor(la0 / 3) * 3, la1, 3):
        for lo in np.arange(math.floor(lo0 / 3) * 3, lo1, 3): tiles.add(wc_tile(la + 0.1, lo + 0.1))
    with rasterio.Env(**env):
        for name, tla, tlo in sorted(tiles):
            # the part of the box in this tile, and where it goes in the output grid
            a0, a1, b0, b1 = max(la0, tla), min(la1, tla + 3), max(lo0, tlo), min(lo1, tlo + 3)
            if a0 >= a1 or b0 >= b1: continue
            c0 = int(round((b0 - lo0) / (lo1 - lo0) * W)); c1 = int(round((b1 - lo0) / (lo1 - lo0) * W))
            r0 = int(round((la1 - a1) / (la1 - la0) * H)); r1 = int(round((la1 - a0) / (la1 - la0) * H))
            if c1 <= c0 or r1 <= r0: continue
            try:
                with rasterio.open('/vsicurl/' + WC_URL % name) as src:
                    win = from_bounds(b0, a0, b1, a1, src.transform)
                    out[r0:r1, c0:c1] = src.read(1, window=win, out_shape=(r1 - r0, c1 - c0), resampling=Resampling.mode)
            except Exception as e:
                print('worldcover', name, 'missing:', str(e)[:120])   # (open sea has no tile)
    return out

WC_COL = {0: (40, 70, 110), 10: (52, 92, 46), 20: (120, 132, 70), 30: (150, 170, 90), 40: (196, 190, 120), 50: (150, 140, 135), 60: (170, 160, 140), 70: (240, 244, 248), 80: (60, 110, 170), 90: (90, 140, 120), 95: (40, 110, 80), 100: (160, 170, 150)}
def lc_rgb(lc):
    rgb = np.zeros(lc.shape + (3,), np.uint8)
    for k, c in WC_COL.items(): rgb[lc == k] = c
    return rgb

# ---------------- painting the land: land cover in colours taken from the globe's own picture, shaded by the relief ----------------
BM_PATH = os.path.join(RAW, 'src', 'bmng.jpg')   # (geo_data.py puts it there)
_BM = None
def bm():
    global _BM
    if _BM is None: _BM = np.asarray(Image.open(BM_PATH).convert('RGB')).astype(np.float32)
    return _BM
def bm_sample(lat, lon):   # the Blue Marble colour (equirectangular, bilinear)
    a = bm(); H, W = a.shape[:2]
    x = (np.asarray(lon) + 180) / 360 * W - 0.5; y = (90 - np.asarray(lat)) / 180 * H - 0.5
    x = np.mod(x, W); y = np.clip(y, 0, H - 1.001); i = np.floor(x).astype(int); j = np.floor(y).astype(int); fx = (x - i)[..., None]; fy = (y - j)[..., None]
    i1 = (i + 1) % W
    return (a[j, i] * (1 - fx) + a[j, i1] * fx) * (1 - fy) + (a[j + 1, i] * (1 - fx) + a[j + 1, i1] * fx) * fy

def hillshade(h, mpp, az=315, alt=42, z=1.0):
    gy, gx = np.gradient(h * z, mpp)
    slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
    a, e = math.radians(az), math.radians(alt)
    s = np.sin(e) * np.cos(slope) + np.cos(e) * np.sin(slope) * np.cos(a - aspect)
    return np.clip(s, 0, 1)

def grid_ll(lat0, lon0, lat1, lon1, W, H):   # the lat/lon of each cell's centre of a W x H grid, north at the top
    lon = lon0 + (np.arange(W) + 0.5) / W * (lon1 - lon0); lat = lat1 - (np.arange(H) + 0.5) / H * (lat1 - lat0)
    return np.meshgrid(lat, lon, indexing='ij')
