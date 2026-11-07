# Orodje za podatke proge (docs/nove-proge.md, Recept): skupni deli.
# Vsi viri so odprti: OpenStreetMap prek Overture Maps (ODbL), Copernicus DEM GLO-30, ESA WorldCover 2021 (CC BY 4.0), Sentinel-2 L2A
# (Copernicus, »Contains modified Copernicus Sentinel data«), High Resolution Canopy Height Maps (Meta in WRI, CC BY 4.0). Nič iz Googla.
# Prenosi gredo v tools/proga/raw/ (ni v repozitoriju). Branje oblačno optimiziranih GeoTIFF-ov (COG) gre po kosih (HTTP Range), brez GDAL.
import io, json, math, os, time, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
os.makedirs(RAW, exist_ok=True)
CA = '/root/.ccr/ca-bundle.crt'
if os.path.exists(CA):
    os.environ.setdefault('SSL_CERT_FILE', CA); os.environ.setdefault('CURL_CA_BUNDLE', CA)

def log(*a):
    print(*a, flush=True)

def http(url, rng=None, tries=5):
    """GET (optionally bytes rng=(a, b) inclusive), retried with backoff."""
    for k in range(tries):
        try:
            rq = urllib.request.Request(url, headers={'Range': 'bytes=%d-%d' % rng} if rng else {})
            with urllib.request.urlopen(rq, timeout=120) as r: return r.read()
        except Exception as e:
            if getattr(e, 'code', 0) in (403, 404) or k == tries - 1: raise
            time.sleep(2 ** k)

def fetch(url, path):
    """The whole file, cached in raw/."""
    p = os.path.join(RAW, path)
    if os.path.exists(p): return open(p, 'rb').read()
    d = http(url); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(d); return d

class HttpFile(io.RawIOBase):
    """A remote file read in 256 KiB blocks (HTTP Range), cached on disk: enough for tifffile to read a COG's header."""
    B = 1 << 18
    def __init__(self, url):
        self.url, self.pos, self.blocks = url, 0, {}
        self.dir = os.path.join(RAW, 'blk', ''.join(c if c.isalnum() else '_' for c in url[-120:]))
        os.makedirs(self.dir, exist_ok=True)
        rq = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(rq, timeout=60) as r: self.size = int(r.headers['Content-Length'])
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, o, wh=0):
        self.pos = o if wh == 0 else self.pos + o if wh == 1 else self.size + o; return self.pos
    def block(self, k):
        if k in self.blocks: return self.blocks[k]
        p = os.path.join(self.dir, str(k))
        if os.path.exists(p): d = open(p, 'rb').read()
        else:
            d = http(self.url, (k * self.B, min(self.size, (k + 1) * self.B) - 1)); open(p, 'wb').write(d)
        self.blocks[k] = d; return d
    def read(self, n=-1):
        if n < 0: n = self.size - self.pos
        n = max(0, min(n, self.size - self.pos)); out = bytearray()
        while n > 0:
            k, o = divmod(self.pos, self.B); d = self.block(k)[o:o + n]
            if not d: break
            out += d; self.pos += len(d); n -= len(d)
        return bytes(out)
    def readinto(self, b):
        d = self.read(len(b)); b[:len(d)] = d; return len(d)
    def ranges(self, rs):
        """Several byte ranges [(offset, count)], fetched directly (tiles), merged where close."""
        out = {}
        rs = sorted(set(rs)); grp = []
        for o, c in rs:
            if grp and o - (grp[-1][0] + grp[-1][1]) < 65536: grp.append((o, c))
            else:
                if grp: out.update(self._grp(grp))
                grp = [(o, c)]
        if grp: out.update(self._grp(grp))
        return out
    def _grp(self, g):
        a, b = g[0][0], g[-1][0] + g[-1][1] - 1
        key = os.path.join(self.dir, 'r%d_%d' % (a, b))
        d = open(key, 'rb').read() if os.path.exists(key) else None
        if d is None: d = http(self.url, (a, b)); open(key, 'wb').write(d)
        return {(o, c): d[o - a:o - a + c] for o, c in g}

_TIFS = {}
def cog(url, level=0):
    """(tifffile page of the given overview level, the HttpFile) of a remote COG."""
    import tifffile
    if url not in _TIFS:
        f = HttpFile(url); _TIFS[url] = (tifffile.TiffFile(f), f)
    t, f = _TIFS[url]
    return t.pages[level], f, t

def cog_window(url, r0, r1, c0, c1, level=0):
    """Rows r0..r1-1, columns c0..c1-1 of a tiled COG (page `level`), as a numpy array (one band or (h, w, bands))."""
    page, f, t = cog(url, level)
    H, W = page.imagelength, page.imagewidth
    th, tw = (page.tilelength, page.tilewidth) if page.is_tiled else (page.rowsperstrip, W)   # (strips: tiles as wide as the image)
    ntx = (W + tw - 1) // tw
    r0, c0 = max(0, r0), max(0, c0); r1, c1 = min(H, r1), min(W, c1)
    need = [(ty, tx) for ty in range(r0 // th, (r1 - 1) // th + 1) for tx in range(c0 // tw, (c1 - 1) // tw + 1)]
    offs, cnts = page.dataoffsets, page.databytecounts
    rq = [(offs[ty * ntx + tx], cnts[ty * ntx + tx]) for ty, tx in need if cnts[ty * ntx + tx]]
    data = f.ranges(rq)
    spp = page.samplesperpixel
    out = None
    for ty, tx in need:
        k = ty * ntx + tx
        if not cnts[k]: continue
        a, idx, shape = page.decode(data[(offs[k], cnts[k])], k)
        a = np.asarray(a).reshape(shape[1:]) if a.ndim == 4 else a   # (1, th, tw, spp) -> (th, tw, spp)
        if a.ndim == 3 and a.shape[2] == 1: a = a[..., 0]
        if out is None: out = np.zeros((r1 - r0, c1 - c0) + a.shape[2:], a.dtype)
        y0, x0 = ty * th, tx * tw
        ya, yb, xa, xb = max(r0, y0), min(r1, y0 + th), max(c0, x0), min(c1, x0 + tw)
        out[ya - r0:yb - r0, xa - c0:xb - c0] = a[ya - y0:yb - y0, xa - x0:xb - x0]
    return out

def geokeys(url, level=0):
    """The COG's pixel scale and tie point (ModelPixelScale, ModelTiepoint) from page 0: (x0, y0, dx, dy)."""
    page, f, t = cog(url, 0)
    sc = page.tags['ModelPixelScaleTag'].value; tp = page.tags['ModelTiepointTag'].value
    p = t.pages[level]
    fx = page.imagewidth / p.imagewidth; fy = page.imagelength / p.imagelength
    return tp[3] - tp[0] * sc[0], tp[4] + tp[1] * sc[1], sc[0] * fx, sc[1] * fy

# ---------------- the game's flat world <-> the globe (as maketa-menija/orodja/geo_lib.py) ----------------
A_WGS, F_WGS = 6378137.0, 1 / 298.257223563
E2 = F_WGS * (2 - F_WGS)
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)

class Geo:
    """The game's world: origin at (lat0, lon0), x east, z south, metres (true north up: no rotation)."""
    def __init__(self, lat0, lon0):
        self.lat0, self.lon0 = lat0, lon0; self.M, self.N = radii(lat0); self.c = math.cos(math.radians(lat0))
    def to_ll(self, x, z):
        x = np.asarray(x, np.float64); z = np.asarray(z, np.float64)
        return self.lat0 - np.degrees(z / self.M), self.lon0 + np.degrees(x / (self.N * self.c))
    def to_xz(self, lat, lon):
        return np.radians(np.asarray(lon, np.float64) - self.lon0) * self.N * self.c, -np.radians(np.asarray(lat, np.float64) - self.lat0) * self.M

# ---------------- Overture Maps (OpenStreetMap and others, ODbL) ----------------
OVERTURE = os.environ.get('OVERTURE', '2026-10-21.0')
def overture(theme, typ, box, cols, name):
    """Every feature of theme/type whose bbox reaches into box (lat0, lon0, lat1, lon1), as a list of dicts (geometry: WKB), cached."""
    import pickle
    p = os.path.join(RAW, 'ov-%s-%s.pkl' % (name, typ))
    if os.path.exists(p): return pickle.load(open(p, 'rb'))
    import pyarrow.dataset as ds, pyarrow.fs as fs
    la0, lo0, la1, lo1 = box
    s3 = fs.S3FileSystem(anonymous=True, region='us-west-2')
    d = ds.dataset('overturemaps-us-west-2/release/%s/theme=%s/type=%s/' % (OVERTURE, theme, typ), filesystem=s3, format='parquet')
    cols = [c for c in cols if c in d.schema.names]
    f = (ds.field('bbox', 'xmax') > lo0) & (ds.field('bbox', 'xmin') < lo1) & (ds.field('bbox', 'ymax') > la0) & (ds.field('bbox', 'ymin') < la1)
    L = d.to_table(filter=f, columns=cols).to_pylist()
    pickle.dump(L, open(p, 'wb')); log('overture', typ, len(L)); return L

# ---------------- Copernicus DEM GLO-30 (1" tiles on AWS) ----------------
def cop_url(la, lo):
    n = 'Copernicus_DSM_COG_10_%s%02d_00_%s%03d_00_DEM' % ('N' if la >= 0 else 'S', abs(la), 'E' if lo >= 0 else 'W', abs(lo))
    return 'https://copernicus-dem-30m.s3.amazonaws.com/%s/%s.tif' % (n, n)

class CopDEM:
    """The heights over a lat/lon box (Copernicus GLO-30, metres above the EGM2008 geoid): sample(lat, lon) bilinear."""
    def __init__(self, la0, lo0, la1, lo1):
        self.parts = []
        for la in range(math.floor(la0), math.floor(la1) + 1):
            for lo in range(math.floor(lo0), math.floor(lo1) + 1):
                url = cop_url(la, lo); page, f, t = cog(url)
                W, H = page.imagewidth, page.imagelength   # (3600 x 3600 up to 50 degrees; fewer columns higher up)
                ra = int((la + 1 - min(la1, la + 1)) * H) - 2; rb = int(math.ceil((la + 1 - max(la0, la)) * H)) + 2
                ca = int((max(lo0, lo) - lo) * W) - 2; cb = int(math.ceil((min(lo1, lo + 1) - lo) * W)) + 2
                ra, ca = max(ra, 0), max(ca, 0); rb, cb = min(rb, H), min(cb, W)
                a = cog_window(url, ra, rb, ca, cb).astype(np.float64)
                # pixel centres: lat = la+1 - (r+0.5)/H, lon = lo + (c+0.5)/W (the tiles are pixel-is-point at the corners: offset by half a cell)
                self.parts.append((la, lo, H, W, ra, ca, a))
    def sample(self, lat, lon):
        lat = np.asarray(lat, np.float64); lon = np.asarray(lon, np.float64); out = np.full(lat.shape, np.nan)
        for la, lo, H, W, ra, ca, a in self.parts:
            m = (lat >= la) & (lat < la + 1) & (lon >= lo) & (lon < lo + 1)
            if not m.any(): continue
            r = (la + 1 - lat[m]) * H - ra; c = (lon[m] - lo) * W - ca
            r = np.clip(r, 0, a.shape[0] - 1.001); c = np.clip(c, 0, a.shape[1] - 1.001)
            i = np.floor(r).astype(int); j = np.floor(c).astype(int); u = r - i; v = c - j
            out[m] = (a[i, j] * (1 - v) + a[i, j + 1] * v) * (1 - u) + (a[i + 1, j] * (1 - v) + a[i + 1, j + 1] * v) * u
        return out

# ---------------- ESA WorldCover 2021 (10 m, 3x3 degree COG tiles) ----------------
# 10 trees, 20 shrubs, 30 grass, 40 crops, 50 built-up, 60 bare/sparse, 70 snow and ice, 80 water, 90 wetland, 95 mangroves, 100 moss and lichen
def worldcover(lat, lon):
    """The class at each (lat, lon) (nearest 10 m cell)."""
    lat = np.asarray(lat, np.float64); lon = np.asarray(lon, np.float64); out = np.zeros(lat.shape, np.uint8)
    tla = np.floor(lat / 3) * 3; tlo = np.floor(lon / 3) * 3
    for a, b in set(zip(tla.ravel().tolist(), tlo.ravel().tolist())):
        name = '%s%02d%s%03d' % ('N' if a >= 0 else 'S', abs(a), 'E' if b >= 0 else 'W', abs(b))
        url = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_%s_Map.tif' % name
        m = (tla == a) & (tlo == b)
        r = ((a + 3 - lat[m]) * 12000).astype(int); c = ((lon[m] - b) * 12000).astype(int)
        w = cog_window(url, r.min(), r.max() + 1, c.min(), c.max() + 1)
        out[m] = w[r - r.min(), c - c.min()]
    return out

# ---------------- Sentinel-2 L2A (COGs on AWS: sentinel-cogs, UTM tiles) ----------------
S2 = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/'
def mgrs(lat, lon):
    """The MGRS 100 km square of (lat, lon): (zone, band, square), e.g. (35, 'T', 'LL')."""
    from pyproj import Proj
    zone = int((lon + 180) // 6) + 1; band = 'CDEFGHJKLMNPQRSTUVWX'[int((lat + 80) // 8)]
    e, n = Proj(proj='utm', zone=zone, ellps='WGS84', south=lat < 0)(lon, lat)
    if lat < 0: n -= 0   # (the bucket's southern tiles use the false northing already)
    cols = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'][(zone - 1) % 3]; rows = 'ABCDEFGHJKLMNPQRSTUV'
    col = cols[int(e // 100000) - 1]; row = rows[(int(n // 100000) + (5 if zone % 2 == 0 else 0)) % 20]
    return zone, band, col + row

def s2_scenes(lat, lon, months, years):
    """The scenes over (lat, lon) in the given months and years: [(prefix, cloud %, data coverage %, sun azimuth, sun elevation, date)]."""
    zone, band, sq = mgrs(lat, lon); out = []
    for y in years:
        for mo in months:
            pre = 'sentinel-s2-l2a-cogs/%d/%s/%s/%d/%d/' % (zone, band, sq, y, mo)
            x = http(S2 + '?list-type=2&delimiter=/&prefix=' + pre).decode()
            import re
            for p in re.findall(r'<Prefix>(' + re.escape(pre) + r'[^<]+/)</Prefix>', x):
                try: j = json.loads(fetch(S2 + p + p.split('/')[-2] + '.json', 's2/' + p.split('/')[-2] + '.json'))
                except Exception: continue
                pr = j.get('properties', {})
                out.append((p, pr.get('eo:cloud_cover', 100), pr.get('s2:nodata_pixel_percentage', 100), pr.get('view:sun_azimuth', 0), pr.get('view:sun_elevation', 0), pr.get('datetime', '')[:10], j))
    return out

def s2_band(prefix, band, lat, lon):
    """Band values at (lat, lon) arrays (nearest pixel; B02/B03/B04/B08: 10 m, B11/SCL: 20 m), as float (reflectance x 10000 + offset as stored)."""
    from pyproj import Proj
    zone = int(prefix.split('/')[1]); P = Proj(proj='utm', zone=zone, ellps='WGS84', south=prefix.split('/')[2] < 'N')
    url = S2 + prefix + band + '.tif'
    x0, y0, dx, dy = geokeys(url)
    e, n = P(np.asarray(lon), np.asarray(lat))
    c = ((e - x0) / dx).astype(int); r = ((y0 - n) / dy).astype(int)
    w = cog_window(url, r.min(), r.max() + 1, c.min(), c.max() + 1)
    return w[r - r.min(), c - c.min()].astype(np.float64)

# ---------------- High Resolution Canopy Height Maps (Meta and WRI, CC BY 4.0: 1 m, quadkey tiles of zoom 9, EPSG:3857) ----------------
CHM = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/'
def quadkey(x, y, z):
    q = ''
    for i in range(z, 0, -1):
        d = 0; m = 1 << (i - 1)
        if x & m: d += 1
        if y & m: d += 2
        q += str(d)
    return q

def canopy(lat, lon, level=0):
    """Canopy height (m) at (lat, lon) arrays from the 1 m map (level > 0: an overview, coarser). 0 where there is no tile."""
    lat = np.asarray(lat, np.float64); lon = np.asarray(lon, np.float64); out = np.zeros(lat.shape)
    R = 6378137.0; mx = np.radians(lon) * R; my = np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * R
    z = 9; n = 2 ** z; tx = ((lon + 180) / 360 * n).astype(int); la = np.radians(lat); ty = ((1 - np.log(np.tan(la) + 1 / np.cos(la)) / np.pi) / 2 * n).astype(int)
    for a, b in set(zip(tx.ravel().tolist(), ty.ravel().tolist())):
        url = CHM + quadkey(a, b, z) + '.tif'; m = (tx == a) & (ty == b)
        try: x0, y0, dx, dy = geokeys(url, level)
        except Exception as e: log('canopy: no tile', quadkey(a, b, z), str(e)[:80]); continue
        c = ((mx[m] - x0) / dx).astype(int); r = ((y0 - my[m]) / dy).astype(int)
        w = cog_window(url, r.min(), r.max() + 1, c.min(), c.max() + 1, level)
        out[m] = w[r - r.min(), c - c.min()]
    return out

# ---------------- encodings the game reads (js/world-vrsic.js vrPrep; js/world-iroha.js irFar) ----------------
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
def rle64(cls):
    """Run-length code of a class grid (row by row): a symbol = class * 8 + run - 1; a run of 8 or more: 7, then digits of 64 until one below 63."""
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

def b64(b):
    import base64
    return base64.b64encode(bytes(b)).decode()
