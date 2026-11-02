# Podatki nove prave proge iz odprtih virov: eno orodje za vse nove proge (odločitev uporabnika 2. 11. 2026; prva proga z njim je
# Livorno, Italija, glej docs/proga-livorno.md; Hakone, Japonska ga uporabi enako).
#
# NAVODILA
#   1. Nastavitve proge v tools/<id>/config.json (vzorec: tools/livorno/config.json):
#        id        kratek id proge (izhod: tools/<id>/<id>.json in mreže PNG ob njem)
#        box       [lat0, lon0, lat1, lon1]: območje, iz katerega se prenese OSM (pot in ~1,5 km okoli nje)
#        closed    true: krog (črta zaprta, štart = prva točka poti); false: odprta cesta od prve do zadnje točke
#        route     točke poti v vrstnem redu vožnje: [lat, lon, ime ceste v OSM ali null, opomba]; vsaka se pripne na najbližje
#                  vozlišče ceste s tem imenom (null: katere koli ceste), med dvema točkama gre najkrajša pot po cestah
#        prefer    imena cest, ki štejejo za krajše (ceste iz virov o progi); druge so 4-krat »daljše«
#        geoRoads, geoWater   zemljepisna imena cest in voda, ki smejo v izhod (druga imena se zbrišejo: OSM ima veliko ulic po osebah)
#        marks     znamenitosti: [oznaka v igri (slovensko), angleško, vrsta, [OSM id-ji: "w123" pot, "r456" relacija; več: konveksni ovoj]]
#        places    kraji za HUD: [oznaka, id vozlišča OSM (kraj; najbližja točka ceste) ali null, s v m (kadar id manjka)]
#        dist      (neobvezno) razdalje od ceste v m: {"bld": 60, "trees": 60, "walls": 30, "coast": 400, "cliffs": 300, "shore": 300,
#                  "water": 100, "rail": 200, "roads": 60, "grid": 150, "lamps": 30}
#        osmStep   (neobvezno) velikost kosov OSM v stopinjah [dlat, dlon], privzeto [0.03, 0.025] (API: največ 50.000 točk na zahtevo)
#   2. Python: numpy in pillow sta v seji; pip install --break-system-packages scipy rasterio
#   3. python3 -I tools/proga-podatki.py tools/<id>/config.json RAW [osm] [route] [data]   (brez korakov: vsi trije)
#        RAW: mapa ZUNAJ repozitorija za surove prenose (npr. scratchpad seje): RAW/osm/ (kosi), RAW/<id>-osm.json, RAW/<id>-route.json,
#        RAW/<id>-ground.npz (predpomnilnik tal). Korak data piše tools/<id>/<id>.json (opis vsakega ključa v njegovem "about") ter
#        dem.png, far.png, lc.png, lu.png, chm.png. Ponovni zagon prenese samo, česar še ni v RAW.
#   4. Preveri pot na sliki (npr. preprost izris `line` in `places`) in v viru o progi; popravi točke v config.json in ponovi route + data.
#
# Kaj nastane (podrobno v "about" izhoda): sredinska črta vsakih ~5 m (OSM, vogali zaobljeni), višine ceste (Copernicus DEM GLO-30, ki je
# površinski model, brez krošenj Meta/WRI in stavb OSM; zglajene, strmine do MAXG, mostovi ravni), ceste poti po s, ovinki, stavbe, drevesa,
# zidovi, obala, pečine, plaže, potoki, železnica, druge in stranske ceste, prehodi, luči, postajališča, mostovi, znamenitosti, kraji;
# mreže: tla (20 m), površina od daleč (100 m, ±12 km), raba tal ESA WorldCover in OSM ter višina krošenj (10 m, ob cesti).
# Koordinate: metri, izhodišče = prva točka poti (štart), x proti vzhodu, z proti jugu (Geo iz maketa-menija/orodja/geo_lib.py, rot 0).
# Viri: OSM API (api.openstreetmap.org; overpass-api.de je v oblačnih sejah blokiran), Copernicus DEM GLO-30, ESA WorldCover 2021 in
# Meta/WRI višina krošenj na AWS (rasterio bere samo potrebne dele datotek). Licence so v "sources" izhoda (za README, »Zasluge«).
import heapq, json, math, os, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
if os.path.exists('/root/.ccr/ca-bundle.crt'): os.environ.setdefault('CURL_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
STEP = 5.0     # m between the points of `line`
MAXG = 0.12    # the steepest grade kept (the surface model's steeper bits are its 30 m cells on the slopes and at the hairpins)
DIST = {'bld': 60, 'trees': 60, 'walls': 30, 'coast': 400, 'cliffs': 300, 'shore': 300, 'water': 100, 'rail': 200, 'roads': 60, 'grid': 150, 'lamps': 30}
UA = 'dirkaska-igra-tracks/1.0 (track data for a racing game; one-off downloads)'
C = {}         # the track's config (load_config)

def load_config(path):
    c = json.load(open(path))
    c['_dir'] = os.path.dirname(os.path.abspath(path)); c.setdefault('closed', True)
    c['dist'] = dict(DIST, **c.get('dist', {}))
    for k in ('prefer', 'geoRoads', 'geoWater'): c[k] = set(c.get(k, []))
    return c

def r1(v, k=1):
    return float(round(float(v), k))

# ================= 1. OSM (api.openstreetmap.org/api/0.6/map, in tiles) =================
def http_get(url, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=180) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (400, 509) or k == tries - 1: raise   # (400: too many nodes, the caller splits the tile)
        except Exception:
            if k == tries - 1: raise
        time.sleep(2 ** (k + 1))

def osm_tile(raw, la0, lo0, la1, lo1, depth=0):
    name = '%.4f_%.4f_%.4f_%.4f.osm' % (la0, lo0, la1, lo1)
    path = os.path.join(raw, 'osm', name)
    if os.path.exists(path): return [path]
    try:
        data = http_get('https://api.openstreetmap.org/api/0.6/map?bbox=%.5f,%.5f,%.5f,%.5f' % (lo0, la0, lo1, la1))
    except urllib.error.HTTPError as e:
        if e.code == 400 and depth < 4:   # (too many nodes: in four)
            lm, om = (la0 + la1) / 2, (lo0 + lo1) / 2; out = []
            for a, b, c, d in ((la0, lo0, lm, om), (la0, om, lm, lo1), (lm, lo0, la1, om), (lm, om, la1, lo1)): out += osm_tile(raw, a, b, c, d, depth + 1)
            return out
        raise
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(data)
    print('osm tile', name, len(data) // 1024, 'KB', flush=True); time.sleep(1)
    return [path]

def step_osm(raw):
    """-> RAW/<id>-osm.json: {"nodes": {id: [lat, lon] or [lat, lon, tags]}, "ways": {id: [refs, tags]}, "rels": {id: [[[type, ref, role], ...], tags]}}"""
    box = C['box']; dlat, dlon = C.get('osmStep', [0.03, 0.025]); paths = []
    la = box[0]
    while la < box[2] - 1e-9:
        lo = box[1]
        while lo < box[3] - 1e-9:
            paths += osm_tile(raw, la, lo, min(la + dlat, box[2]), min(lo + dlon, box[3])); lo += dlon
        la += dlat
    nodes, ways, rels = {}, {}, {}
    for p in paths:
        for ev, el in ET.iterparse(p, events=('end',)):
            if el.tag == 'node':
                tags = {t.get('k'): t.get('v') for t in el.findall('tag')}; v = [float(el.get('lat')), float(el.get('lon'))]
                if tags: v.append(tags)
                nodes[el.get('id')] = v; el.clear()
            elif el.tag == 'way':
                ways[el.get('id')] = [[nd.get('ref') for nd in el.findall('nd')], {t.get('k'): t.get('v') for t in el.findall('tag')}]; el.clear()
            elif el.tag == 'relation':
                rels[el.get('id')] = [[[m.get('type'), m.get('ref'), m.get('role')] for m in el.findall('member')], {t.get('k'): t.get('v') for t in el.findall('tag')}]; el.clear()
    json.dump({'box': box, 'nodes': nodes, 'ways': ways, 'rels': rels}, open(os.path.join(raw, C['id'] + '-osm.json'), 'w'), separators=(',', ':'))
    print('osm: %d nodes, %d ways, %d relations' % (len(nodes), len(ways), len(rels)))

# ================= 2. the route (waypoints, the shortest way between them over the drivable roads) =================
DRIVE = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service',
         'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'}

def ll_dist(a, b):   # metres between two [lat, lon] (local flat earth; short steps)
    k = math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot((b[0] - a[0]) * 111195, (b[1] - a[1]) * 111195 * k)

def step_route(raw):
    """-> RAW/<id>-route.json: the OSM nodes in driving order [id, lat, lon], the runs of ways passed [way, name (only C.prefer's), highway,
    from, to, tags], the length. One-way streets count both ways (a race closes the roads); a road of C.prefer counts as 4 times shorter."""
    osm = os.path.join(raw, C['id'] + '-osm.json'); D = json.load(open(osm)); N, W = D['nodes'], D['ways']
    G, byname = {}, {}
    for wid, (refs, t) in W.items():
        if t.get('highway') not in DRIVE or t.get('area') == 'yes': continue
        nm = t.get('name', ''); f = 1.0 if nm in C['prefer'] else 4.0
        refs = [r for r in refs if r in N]
        for a, b in zip(refs, refs[1:]):
            L = ll_dist(N[a], N[b]); G.setdefault(a, []).append((b, L * f, L, wid)); G.setdefault(b, []).append((a, L * f, L, wid))
        byname.setdefault(nm, set()).update(refs)
    def snap(lat, lon, nm):
        cand = byname.get(nm) if nm else set(G)
        if not cand: raise SystemExit('route: no drivable road named %r in the box' % nm)
        return min(cand, key=lambda r: ll_dist(N[r], (lat, lon)))
    def path(s, e):
        best = {s: 0.0}; prev = {}; q = [(0.0, s)]
        while q:
            c, u = heapq.heappop(q)
            if u == e: break
            if c > best.get(u, 1e18): continue
            for v, cost, L, wid in G.get(u, ()):
                nc = c + cost
                if nc < best.get(v, 1e18): best[v] = nc; prev[v] = (u, wid); heapq.heappush(q, (nc, v))
        if e not in prev and e != s: raise SystemExit('route: no way between nodes %s and %s' % (s, e))
        out = [e]; ws = []
        while out[-1] != s: u, wid = prev[out[-1]]; ws.append(wid); out.append(u)
        return out[::-1], ws[::-1]
    wps = [snap(p[0], p[1], p[2]) for p in C['route']]
    closed = C['closed']; nodes, ways = [wps[0]], []
    for a, b in zip(wps, wps[1:] + (wps[:1] if closed else [])):
        p, ws = path(a, b); nodes += p[1:]; ways += ws
    if closed: nodes = nodes[:-1]   # (the loop closes on the first node)
    changed = True
    while changed:   # drop doubled-back spurs (a waypoint snapped a little past a junction)
        changed = False
        for i in range(1, len(nodes) - 1):
            if nodes[i - 1] == nodes[i + 1]: del nodes[i:i + 2]; del ways[i - 1:i + 1]; changed = True; break
    pairs = list(zip(nodes, nodes[1:] + (nodes[:1] if closed else [])))
    L = sum(ll_dist(N[a], N[b]) for a, b in pairs)
    seq = []
    for i, w in enumerate(ways):
        if seq and seq[-1][0] == w: seq[-1][4] = i + 1
        else:
            t = W[w][1]
            seq.append([w, t.get('name', '') if t.get('name', '') in C['prefer'] else '', t.get('highway'), i, i + 1,
                        {k: t[k] for k in ('lanes', 'width', 'oneway', 'bridge', 'tunnel', 'surface', 'maxspeed', 'ref', 'layer', 'sidewalk') if k in t}])
    json.dump({'date': time.strftime('%Y-%m-%d', time.gmtime(os.path.getmtime(osm))), 'closed': closed, 'length': round(L, 1),
               'nodes': [[r, N[r][0], N[r][1]] for r in nodes], 'ways': seq}, open(os.path.join(raw, C['id'] + '-route.json'), 'w'), separators=(',', ':'))
    print('route: %d nodes, %.1f m' % (len(nodes), L))
    acc, names = 0.0, []
    for w, nm, hw, i0, i1, tg in seq:
        ln = sum(ll_dist(N[pairs[i][0]], N[pairs[i][1]]) for i in range(i0, i1))
        if names and names[-1][0] == nm: names[-1][1] += ln
        else: names.append([nm, ln, acc])
        acc += ln
    for nm, ln, a in names: print('  %7.0f m  %-30s %6.0f m' % (a, nm or '(unnamed)', ln))

# ================= 3. data: the frame, the rasters, the geometry =================
A_WGS, F_WGS = 6378137.0, 1 / 298.257223563
E2 = F_WGS * (2 - F_WGS)
def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_WGS * (1 - E2) / w ** 1.5, A_WGS / math.sqrt(w)

class Frame:
    """metres, origin (lat0, lon0) = the start line; x east, z south: x = dlon * N cos(lat0), z = -dlat * M (WGS84 radii at lat0)."""
    def __init__(self, lat0, lon0):
        self.lat0, self.lon0 = lat0, lon0; self.M, self.N = radii(lat0); self.c = math.cos(math.radians(lat0))
    def xz(self, lat, lon):
        return (np.radians(np.asarray(lon, float) - self.lon0) * self.N * self.c, -np.radians(np.asarray(lat, float) - self.lat0) * self.M)
    def ll(self, x, z):
        return (self.lat0 - np.degrees(np.asarray(z, float) / self.M), self.lon0 + np.degrees(np.asarray(x, float) / (self.N * self.c)))

# the rasters' tiles over a box (lat0, lon0, lat1, lon1)
def _ns(la, w): return ('N%0*d' if la >= 0 else 'S%0*d') % (w, abs(la))
def _ew(lo, w): return ('E%0*d' if lo >= 0 else 'W%0*d') % (w, abs(lo))
def dem_urls(la0, lo0, la1, lo1):   # Copernicus DEM GLO-30, 1 x 1 degree tiles named by their south-west corner (none over the open sea)
    out = []
    for la in range(math.floor(la0), math.floor(la1 - 1e-9) + 1):
        for lo in range(math.floor(lo0), math.floor(lo1 - 1e-9) + 1):
            n = 'Copernicus_DSM_COG_10_%s_00_%s_00_DEM' % (_ns(la, 2), _ew(lo, 3)); out.append('https://copernicus-dem-30m.s3.amazonaws.com/%s/%s.tif' % (n, n))
    return out
def wc_urls(la0, lo0, la1, lo1):    # ESA WorldCover 2021, 3 x 3 degree tiles
    out = []
    for la in range(math.floor(la0 / 3) * 3, math.floor((la1 - 1e-9) / 3) * 3 + 1, 3):
        for lo in range(math.floor(lo0 / 3) * 3, math.floor((lo1 - 1e-9) / 3) * 3 + 1, 3):
            out.append('https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_%s%s_Map.tif' % (_ns(la, 2), _ew(lo, 3)))
    return out
def chm_urls(la0, lo0, la1, lo1):   # Meta / WRI canopy height, web mercator zoom-9 tiles named by their quadkey
    def txy(lat, lon):
        n = 512; x = int((lon + 180) / 360 * n); r = math.radians(lat); y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n); return x, y
    x0, y0 = txy(la1, lo0); x1, y1 = txy(la0, lo1); out = []
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            q = ''.join(str((1 if x >> (8 - i) & 1 else 0) + (2 if y >> (8 - i) & 1 else 0)) for i in range(9))
            out.append('https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/%s.tif' % q)
    return out

def read_window(url, lat0, lon0, lat1, lon1, out_shape=None, resampling='nearest'):
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.enums import Resampling
    from rasterio.warp import transform_bounds
    with rasterio.open('/vsicurl/' + url) as src:
        b = (lon0, lat0, lon1, lat1)
        if src.crs.to_epsg() != 4326: b = transform_bounds('EPSG:4326', src.crs, *b)
        win = from_bounds(*b, src.transform).round_offsets().round_lengths()
        if out_shape == 'quarter': out_shape = (int(win.height // 4), int(win.width // 4))
        elif out_shape == 'third': out_shape = (int(win.height // 3), int(win.width // 3))
        a = src.read(1, window=win, out_shape=out_shape, resampling=getattr(Resampling, resampling))
        T = src.window_transform(win)
        if out_shape: T = T * T.scale(win.width / out_shape[1], win.height / out_shape[0])
        return a, T, src.crs.to_epsg()

def read_mosaic(urls, lat0, lon0, lat1, lon1, out_shape=None, resampling='nearest', fill=0):
    """A window of one raster, or of several tiles merged (rasterio.merge; tiles that do not exist, e.g. the open sea, left out)."""
    import rasterio
    have = []
    for u in urls:
        try:
            with rasterio.open('/vsicurl/' + u): have.append(u)
        except Exception: print('  (no tile: %s)' % u.rsplit('/', 1)[-1])
    if not have: raise RuntimeError('no tile over the box')
    if len(have) == 1: return read_window(have[0], lat0, lon0, lat1, lon1, out_shape, resampling)
    from rasterio.merge import merge
    from rasterio.enums import Resampling
    from rasterio.warp import transform_bounds
    srcs = [rasterio.open('/vsicurl/' + u) for u in have]
    try:
        epsg = srcs[0].crs.to_epsg(); b = (lon0, lat0, lon1, lat1)
        if epsg != 4326: b = transform_bounds('EPSG:4326', srcs[0].crs, *b)
        f = 4 if out_shape == 'quarter' else 3 if out_shape == 'third' else 1
        a, T = merge(srcs, bounds=b, res=(abs(srcs[0].res[0]) * f, abs(srcs[0].res[1]) * f), resampling=getattr(Resampling, resampling), nodata=fill)
        return a[0], T, epsg
    finally:
        for s in srcs: s.close()

def sample_grid(a, T, epsg, lat, lon, order=1):
    """Values of raster a (affine T, EPSG 4326 or 3857) at lat/lon arrays (bilinear: order 1, nearest: order 0)."""
    lat = np.asarray(lat, float); lon = np.asarray(lon, float)
    if epsg == 3857: X = np.radians(lon) * 6378137.0; Y = np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * 6378137.0
    else: X, Y = lon, lat
    col = (X - T.c) / T.a - 0.5; row = (Y - T.f) / T.e - 0.5
    return ndimage.map_coordinates(a.astype(np.float32), [row, col], order=order, mode='nearest')

# ---- geometry (closed: a lap; open: a road with two ends) ----
def resample(P, step, closed):
    P = np.asarray(P, float)
    Q = np.vstack([P, P[:1]]) if closed else P
    seg = np.hypot(*(Q[1:] - Q[:-1]).T); cum = np.concatenate([[0], np.cumsum(seg)]); L = cum[-1]
    n = int(round(L / step)); s = np.arange(n) * (L / n) if closed else np.linspace(0, L, n + 1)
    return np.stack([np.interp(s, cum, Q[:, 0]), np.interp(s, cum, Q[:, 1])], 1), L

def mode():
    return 'wrap' if C['closed'] else 'nearest'

def smooth(P, sigma_pts):
    return np.stack([ndimage.gaussian_filter1d(P[:, 0], sigma_pts, mode=mode()), ndimage.gaussian_filter1d(P[:, 1], sigma_pts, mode=mode())], 1)

def curvature(P, h):   # signed curvature (positive: a right turn, x east / z south)
    if C['closed']: d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / (2 * h); d2 = (np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)) / h ** 2
    else: d1 = np.gradient(P, h, axis=0); d2 = np.gradient(d1, h, axis=0)
    return (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.maximum(1e-9, np.hypot(d1[:, 0], d1[:, 1]) ** 3)

def normals(P):
    if C['closed']: T = np.roll(P, -1, 0) - np.roll(P, 1, 0)
    else: T = np.gradient(P, axis=0)
    T = T / np.hypot(*T.T)[:, None]; return np.stack([-T[:, 1], T[:, 0]], 1)

class Along:
    """Nearest point of the centre line (every STEP m) to points: s (m from the start line), d (m, + right of the travel direction)."""
    def __init__(self, line, step):
        from scipy.spatial import cKDTree
        self.P = line; self.step = step; self.n = len(line); self.closed = C['closed']
        self.L = self.n * step if self.closed else (self.n - 1) * step
        T = np.roll(line, -1, 0) - line
        if not self.closed: T[-1] = T[-2]
        self.T = T / np.hypot(*T.T)[:, None]; self.kd = cKDTree(line)
    def query(self, pts):
        pts = np.atleast_2d(np.asarray(pts, float)); dd, ii = self.kd.query(pts)
        best_s = np.zeros(len(pts)); best_d = np.full(len(pts), 1e9)
        for o in (-1, 0):   # the segment before and after the nearest vertex
            j = (ii + o) % self.n if self.closed else np.clip(ii + o, 0, self.n - 2)
            a = self.P[j]; t = self.T[j]
            v = pts - a; u = np.clip((v * t).sum(1), 0, self.step); q = a + t * u[:, None]; w = pts - q
            d = np.hypot(*w.T); side = np.sign(t[:, 0] * w[:, 1] - t[:, 1] * w[:, 0])   # (+: right of travel, x east / z south)
            m = d < np.abs(best_d); best_d[m] = (d * np.where(side == 0, 1, side))[m]
            s = j * self.step + u; best_s[m] = (s % self.L if self.closed else s)[m]
        return best_s, best_d

def build_line(R, F):
    lat = np.array([n[1] for n in R['nodes']]); lon = np.array([n[2] for n in R['nodes']])
    x, z = F.xz(lat, lon); P = np.stack([x, z], 1)
    D1, L = resample(P, 1.0, C['closed'])      # every 1 m along OSM's polyline
    S = smooth(D1, 3.0)                        # its corners rounded (sigma 3 m: the hairpins keep their ~10 m radius)
    line, L2 = resample(S, STEP, C['closed'])
    return line, L, L2

# ================= the ground: the surface model less the trees and the buildings =================
def bld_height(t):
    for k in ('height', 'building:height'):
        try: return float(str(t[k]).split()[0].replace(',', '.'))
        except Exception: pass
    try: return float(t['building:levels']) * 3.0 + 1.5
    except Exception: return 0.0

def ground_model(raw, D):
    """-> (dsm, gnd, T): the Copernicus DSM over the box (EPSG:4326, ~1 arc-second cells) and the ground under it: less the canopy (Meta / WRI,
    the mean over each cell, x 0.8: the radar sees a little into the crowns) and less the buildings (OSM footprints: the share of the cell under
    roofs x their height, 9 m when untagged, x 0.8)."""
    cache = os.path.join(raw, C['id'] + '-ground.npz')
    if os.path.exists(cache):
        import affine   # (rasterio's own)
        z = np.load(cache); return z['dsm'], z['gnd'], affine.Affine(*z['T'][:6])
    box = C['box']
    dsm, T, _ = read_mosaic(dem_urls(*box), *box)
    H, W = dsm.shape
    print('dsm', dsm.shape, float(dsm.min()), float(dsm.max()), flush=True)
    chm, Tc, ec = read_mosaic(chm_urls(*box), *box, out_shape='quarter', resampling='average')
    chm = chm.astype(np.float32); chm[chm > 60] = 0
    print('chm', chm.shape, float(chm.max()), flush=True)
    rows, cols = np.mgrid[0:H, 0:W]; acc = np.zeros((H, W), np.float32)
    for fy in np.linspace(-0.4, 0.4, 5):   # the canopy on a 5 x 5 sub-grid of each DEM cell, the mean
        for fx in np.linspace(-0.4, 0.4, 5):
            lon = T.c + (cols + 0.5 + fx) * T.a; lat = T.f + (rows + 0.5 + fy) * T.e
            acc += sample_grid(chm, Tc, ec, lat.ravel(), lon.ravel(), order=0).reshape(H, W)
    canopy = acc / 25
    N = D['nodes']; S = 8   # the buildings rasterised at 1/8 of a cell
    img = Image.new('F', (W * S, H * S), 0.0); dr = ImageDraw.Draw(img)
    for wid, (refs, t) in D['ways'].items():
        if 'building' not in t or t.get('building') in ('roof', 'no'): continue
        pts = [N[r] for r in refs if r in N]
        if len(pts) < 3: continue
        dr.polygon([((p[1] - T.c) / T.a * S, (p[0] - T.f) / T.e * S) for p in pts], fill=float(bld_height(t) or 9.0))
    b = np.asarray(img, np.float32).reshape(H, S, W, S).mean(axis=(1, 3))
    gnd = dsm - 0.8 * canopy - 0.8 * b
    gnd = np.where(dsm < 0.5, dsm, np.maximum(gnd, 0.3))   # (the sea stays at its own level; the land above it)
    np.savez_compressed(cache, dsm=dsm, gnd=gnd, T=np.array(tuple(T)))
    return dsm, gnd, T

# ================= the road's heights =================
def route_s(R, line, F):
    """s of each OSM node of the route on the smoothed line."""
    A = Along(line, STEP)
    lat = np.array([n[1] for n in R['nodes']]); lon = np.array([n[2] for n in R['nodes']]); x, z = F.xz(lat, lon)
    return A, A.query(np.stack([x, z], 1))[0]

def route_spans(R, line, F, key):
    """s ranges [s0, s1, name] of the route's ways with tag key (e.g. bridge)."""
    A, s = route_s(R, line, F); out = []
    for w, nm, hw, i0, i1, tg in R['ways']:
        if tg.get(key) in (None, 'no'): continue
        a, b = s[i0], s[min(i1, len(s) - 1)]
        if b < a and A.closed: b += A.L
        if out and a - out[-1][1] < 2: out[-1][1] = b
        else: out.append([a, b, nm])
    return out

def limit_grade(h, lim):   # the excess of each too steep step shared by its two ends, until none is left
    h = h.copy()
    for it in range(2000):
        if C['closed']:
            g = (np.roll(h, -1) - h) / STEP; ex = np.sign(g) * np.maximum(np.abs(g) - lim, 0) * STEP
            if np.abs(ex).max() < 0.005: break
            h += ex * 0.5; h -= np.roll(ex, 1) * 0.5   # (point i towards i+1, point i+1 the other way)
        else:
            g = np.diff(h) / STEP; ex = np.sign(g) * np.maximum(np.abs(g) - lim, 0) * STEP
            if not len(ex) or np.abs(ex).max() < 0.005: break
            h[:-1] += ex * 0.5; h[1:] -= ex * 0.5
    return h

def road_heights(line, F, gnd, T, bridges):
    """-> (raw, smoothed) heights along the line: the ground model across the road (the median of 5 samples from 8 m left to 8 m right: by
    the cliffs half the cells are sea), the bridges straight from bank to bank, dips under 60 m filled, a 35 m median, sigma 15 m, the grades at
    most MAXG, sigma 5 m."""
    n = len(line); Nr = normals(line); cross = []
    idx = (lambda i: i % n) if C['closed'] else (lambda i: min(max(i, 0), n - 1))
    for d in (-8, -4, 0, 4, 8):
        q = line + Nr * d; lat, lon = F.ll(q[:, 0], q[:, 1]); cross.append(sample_grid(gnd, T, 4326, lat, lon))
    h0 = np.median(np.stack(cross), 0); h1 = h0.copy()
    for a, b, nm in bridges:   # straight over the bridges, from the highest ground within 50 m before to the highest within 50 m after
        ia = int(round(a / STEP)); ib = int(round(b / STEP)); K = int(50 / STEP)
        i0 = max(range(ia - K, ia + 2), key=lambda i: h0[idx(i)]); i1 = max(range(ib - 1, ib + K + 1), key=lambda i: h0[idx(i)])
        ya, yb = h0[idx(i0)], h0[idx(i1)]
        for i in range(i0, i1 + 1): h1[idx(i)] = ya + (yb - ya) * (i - i0) / max(1, i1 - i0)
    h1 = ndimage.grey_closing(h1, size=int(60 / STEP) | 1, mode=mode())   # (the narrow dips filled: gullies under the road, the sea in a cell by the cliffs)
    h1 = ndimage.median_filter(h1, size=7, mode=mode())
    h2 = ndimage.gaussian_filter1d(h1, 15 / STEP, mode=mode())
    h2 = limit_grade(h2, MAXG)
    h2 = ndimage.gaussian_filter1d(h2, 5 / STEP, mode=mode())
    return h0, h2
# ================= grids (PNG: 16-bit heights in decimetres + 100 m, so the sea's -0.4 m stays positive; 8-bit classes) =================
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
    dense, _ = resample(line, 1.0, C['closed']); near = C['dist']['grid']
    d, _ = cKDTree(dense).query(np.stack([X.ravel(), Z.ravel()], 1), distance_upper_bound=near + 20)
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
    # far: the surface (what one sees from afar), 100 m cells, +-12 km round the middle of the road
    c = 100.0; cx = (line[:, 0].min() + line[:, 0].max()) / 2; cz = (line[:, 1].min() + line[:, 1].max()) / 2
    x0, z0 = math.floor((cx - 12000) / c) * c, math.floor((cz - 12000) / c) * c; nx = nz = 240
    X, Z, lat, lon = cell_centres(F, x0, z0, nx, nz, c)
    fb = (float(lat.min()) - 0.01, float(lon.min()) - 0.01, float(lat.max()) + 0.01, float(lon.max()) + 0.01)
    urls = dem_urls(*fb)
    fa, Tf, _ = read_mosaic(urls, *fb)
    fv = sample_grid(fa, Tf, 4326, lat.ravel(), lon.ravel()).reshape(nz, nx)
    if len(urls) == 1:   # (one tile: outside it the open sea)
        u = urls[0].rsplit('_DEM.tif', 1)[0]; la = int(u[-13:-11]) * (1 if u[-14] == 'N' else -1); lo = int(u[-6:-3]) * (1 if u[-7] == 'E' else -1)
        fv[(lat < la) | (lat > la + 1) | (lon < lo) | (lon > lo + 1)] = 0.0
    save_png16(os.path.join(out, 'far.png'), fv)
    info['far'] = dict(file='far.png', x0=x0, z0=z0, nx=nx, nz=nz, cell=c, enc='as dem', what='surface (Copernicus DEM GLO-30 as it is: the hills with their woods and the town as seen from afar), 0 = sea')
    print('far', nx, nz, float(fv.max()), flush=True)
    # land cover, land use, canopy: 10 m cells, to NEAR m from the road
    NEAR = C['dist']['grid']
    c = 10.0; x0, z0, nx, nz = grid_box(line, NEAR + 20, c); X, Z, lat, lon = cell_centres(F, x0, z0, nx, nz, c)
    dist = road_distance(line, X, Z); near = dist <= NEAR
    gb = (float(lat.min()) - 0.002, float(lon.min()) - 0.002, float(lat.max()) + 0.002, float(lon.max()) + 0.002)
    wc, Tw, ew = read_mosaic(wc_urls(*gb), *gb)
    lc = sample_grid(wc, Tw, ew, lat.ravel(), lon.ravel(), order=0).reshape(nz, nx).astype(np.uint8); lc[~near] = 0
    save_png8(os.path.join(out, 'lc.png'), lc)
    lu = raster_lu(D, F, x0, z0, nx, nz, c).copy(); lu[~near] = 0
    save_png8(os.path.join(out, 'lu.png'), lu)
    # the canopy at 10 m: the 1 m map read at 1/3 (average), sampled 3 x 3 per cell, the mean
    chm, Tc, ec = read_mosaic(chm_urls(*gb), *gb, out_shape='third', resampling='average')
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

# ================= vectors near the road (OSM) =================
# only geographic or descriptive labels go into the files (OSM's own names stay in RAW: many streets and places are named after people):
# C['geoRoads'], C['geoWater'] (names allowed), C['marks'] (landmarks), C['places'] (the HUD's places)

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
    A = Along(line, STEP); N, W = D['nodes'], D['ways']; DS = C['dist']
    route_ways = {w[0] for w in R['ways']}; route_nodes = [n[0] for n in R['nodes']]; rset = set(route_nodes)
    def XZ(refs):
        pts = [N[r] for r in refs if r in N]
        if not pts: return np.zeros((0, 2))
        x, z = F.xz([p[0] for p in pts], [p[1] for p in pts]); return np.stack([x, z], 1)
    out = {}
    # buildings (OSM ways and multipolygons) with any part within DS['bld'] m of the centre line
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
        if np.abs(d_).min() > DS['bld']: continue
        cx, cz, Lx, Ly, ang, boxa = obb(P[:-1] if np.allclose(P[0], P[-1]) else P)
        sc, dc = A.query([[cx, cz]])
        h = bld_height(t)
        bld.append([r1(cx), r1(cz), r1(Lx), r1(Ly), round(ang, 3), r1(h), bld_kind(t), int(sc[0]), r1(dc[0])])
        if poly_area(P) < 0.8 * boxa and boxa > 60:   # not a rectangle: its outline too
            outl.append([len(bld) - 1, flat(P[:-1] if np.allclose(P[0], P[-1]) else P)])
    out['bld'] = bld; out['bldOutline'] = outl
    print('buildings within %d m: %d (%d with outlines)' % (DS['bld'], len(bld), len(outl)), flush=True)
    # trees and tree rows
    trees = []
    for nid, v in N.items():
        if len(v) > 2 and v[2].get('natural') == 'tree':
            x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]])
            if abs(d_[0]) <= DS['trees']: trees.append([r1(x), r1(z), tree_kind(v[2])])
    rows = []
    for k, (refs, t) in W.items():
        if t.get('natural') == 'tree_row':
            P = XZ(refs); s_, d_ = A.query(P)
            for part in clip_near(P, d_, DS['trees']): rows.append([tree_kind(t), flat(part)])
    out['trees'] = trees; out['treeRows'] = rows
    print('trees within %d m: %d single, %d rows' % (DS['trees'], len(trees), len(rows)), flush=True)
    # walls, fences, guard rails, hedges within 30 m
    walls = []
    for k, (refs, t) in W.items():
        b = t.get('barrier')
        if b not in ('wall', 'retaining_wall', 'fence', 'guard_rail', 'hedge', 'city_wall', 'jersey_barrier', 'handrail', 'railing'): continue
        P = XZ(refs)
        if len(P) < 2: continue
        s_, d_ = A.query(P)
        for part in clip_near(P, d_, DS['walls']):
            walls.append([b, r1(bld_height(t)), t.get('wall', '') or t.get('material', '') or t.get('fence_type', ''), flat(part)])
    out['walls'] = walls
    print('walls / fences / rails within %d m: %d' % (DS['walls'], len(walls)), flush=True)
    # the coast, cliffs, beaches and rocks, water
    coast, cliffs, areas, water = [], [], [], []
    for k, (refs, t) in W.items():
        nat = t.get('natural'); ww = t.get('waterway')
        if nat == 'coastline' or nat == 'cliff' or ww in ('stream', 'river', 'canal', 'ditch', 'drain'):
            P = XZ(refs)
            if len(P) < 2: continue
            s_, d_ = A.query(P)
            lim = DS['coast'] if nat == 'coastline' else DS['cliffs'] if nat == 'cliff' else DS['water']
            for part in clip_near(P, d_, lim):
                if nat == 'coastline': coast.append(flat(part))
                elif nat == 'cliff': cliffs.append(flat(part))
                else: water.append([ww, t.get('name', '') if t.get('name', '') in C['geoWater'] else '', 1 if t.get('tunnel') in ('yes', 'culvert') else 0, flat(part)])
        elif nat in ('beach', 'sand', 'bare_rock', 'scree', 'shingle', 'rock') and len(refs) > 3:
            P = XZ(refs); s_, d_ = A.query(P)
            if np.abs(d_).min() <= DS['shore']: areas.append([nat, flat(P)])
    for rid, (mem, t) in D['rels'].items():
        if t.get('type') == 'multipolygon' and t.get('natural') in ('beach', 'bare_rock', 'scree', 'shingle'):
            for ring in rel_rings(D, mem):
                x, z = F.xz([p[0] for p in ring], [p[1] for p in ring]); P = np.stack([x, z], 1); s_, d_ = A.query(P)
                if np.abs(d_).min() <= DS['shore']: areas.append([t['natural'], flat(P)])
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
        for part in clip_near(P, d_, DS['rail']):
            rail.append([rw, 1 if t.get('bridge') else 0, 1 if t.get('tunnel') else 0, flat(part)])
    out['rail'] = rail
    print('railway pieces within %d m: %d' % (DS['rail'], len(rail)), flush=True)
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
        if np.abs(d_).min() > DS['roads']: continue
        par = 1 if (np.abs(d_) < 12).mean() > 0.6 and len(P) > 2 else 0
        for part in clip_near(P, d_, DS['roads'] + 20):
            roads.append([hw, t.get('lanes', ''), t.get('width', ''), 1 if t.get('bridge') else 2 if t.get('tunnel') else 0, int(t.get('layer', 0) or 0) if str(t.get('layer', '0')).lstrip('-').isdigit() else 0,
                          t.get('surface', ''), t.get('name', '') if t.get('name', '') in C['geoRoads'] else '', par, flat(part)])
    out['roads'] = roads
    print('other roads / paths within %d m: %d pieces' % (DS['roads'], len(roads)), flush=True)
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
                s0, d0 = A.query(P[:1]); t0 = A.T[min(int(s0[0] / STEP), A.n - 1) % A.n]
                q = P[min(len(P) - 1, 2)] - P[0]
                if math.hypot(*q) < 1e-3: continue
                ang = math.degrees(math.atan2(t0[0] * q[1] - t0[1] * q[0], t0[0] * q[0] + t0[1] * q[1]))   # (+: to the right of the travel direction)
                side.append([int(s0[0]), 1 if ang > 0 else -1, round(ang), hw, t.get('lanes', '') or t.get('width', ''), 1 if t.get('oneway') == 'yes' else 0,
                             t.get('name', '') if t.get('name', '') in C['geoRoads'] else '', flat(P)])
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
            if abs(d_[0]) > DS['lamps']: continue
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
    # landmarks (C['marks']: [label, English, kind, [OSM ids]]; several ids: their convex hull)
    from scipy.spatial import ConvexHull
    lm = []
    for lab, en, kind, ids in C.get('marks', []):
        Ps = []
        for key in ids:
            if key[0] == 'w' and key[1:] in W: Ps.append(XZ(W[key[1:]][0]))
            elif key[0] == 'r' and key[1:] in D['rels']:
                for ring in rel_rings(D, D['rels'][key[1:]][0]):
                    x, z = F.xz([p[0] for p in ring], [p[1] for p in ring]); Ps.append(np.stack([x, z], 1))
        if not Ps: print('  landmark missing:', lab, ids); continue
        P = np.vstack(Ps) if len(Ps) > 1 else Ps[0]
        if len(Ps) > 1 and len(P) > 2: P = P[ConvexHull(P).vertices]
        s_, d_ = A.query(P); kk = int(np.argmin(np.abs(d_)))
        lm.append([lab, en, kind, int(s_[kk]), r1(d_[kk]), flat(P)])
    out['landmarks'] = lm
    for e in lm: print('  landmark %-24s s=%6d  d=%7.1f m' % (e[0], e[3], e[4]))
    # places (the HUD's names, C['places']: [label, OSM node id or null, s]): the nearest point of the road to OSM's place
    pl = []
    for lab, nid, s0 in C.get('places', []):
        if nid:
            v = N[nid]; x, z = F.xz(v[0], v[1]); s_, d_ = A.query([[float(x), float(z)]]); s0 = float(s_[0]); dd = float(d_[0])
        else: dd = 0.0
        i = int(round(s0 / STEP)); i = i % A.n if A.closed else min(i, A.n - 1)
        pl.append([lab, r1(line[i, 0]), r1(line[i, 1]), int(s0), r1(dd)])
    out['places'] = pl
    for e in pl: print('  place %-14s s=%6d  (OSM place %5.0f m from the road)' % (e[0], e[3], abs(e[4])))
    return out

def bends(line):
    """The bends: [s of the apex, radius (m), side (1 right, -1 left), turn (deg)] where the radius is under 60 m."""
    k = ndimage.gaussian_filter1d(curvature(line, STEP), 1.5, mode=mode()); out = []
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

# ================= the data step =================
def step_data(raw):
    R = json.load(open(os.path.join(raw, C['id'] + '-route.json'))); D = json.load(open(os.path.join(raw, C['id'] + '-osm.json')))
    closed = C['closed']; n0 = R['nodes'][0]; F = Frame(n0[1], n0[2])
    line, Lraw, L = build_line(R, F)
    k = curvature(line, L / len(line))
    print('line: %d points every %.3f m, %.1f m (OSM polyline %.1f m); tightest radius %.1f m' % (len(line), L / len(line) if closed else L / (len(line) - 1), L, Lraw, 1 / np.abs(k).max()))
    dsm, gnd, T = ground_model(raw, D)
    print('ground: dsm %.1f-%.1f m, ground %.1f-%.1f m' % (dsm.min(), dsm.max(), gnd.min(), gnd.max()))
    bridges = route_spans(R, line, F, 'bridge')
    print('route bridges:', ', '.join('%s %.0f-%.0f' % (nm, a, b) for a, b, nm in bridges))
    h0, h = road_heights(line, F, gnd, T, bridges)
    g = (np.diff(np.concatenate([h, h[:1]])) if closed else np.diff(h)) / STEP
    print('heights: %.1f-%.1f m (start %.1f m), max grade up %.1f %%, down %.1f %%; raw-smoothed rms %.1f m' % (h.min(), h.max(), h[0], g.max() * 100, -g.min() * 100, np.sqrt(((h0 - h) ** 2).mean())))
    out_dir = C['_dir']
    grids = build_grids(F, line, dsm, gnd, T, D, out_dir)
    vec = build_vectors(F, line, L, R, D, bridges)
    # the route's roads along it: [s0, s1, name (geographic ones only), highway, lanes, width, oneway today, surface, maxspeed, bridge]
    A, sN = route_s(R, line, F)
    if closed and sN[-1] < 1: sN[-1] = L
    ways = []
    for w, nm, hw, i0, i1, tg in R['ways']:
        a = float(sN[i0]); b = float(sN[i1]) if i1 < len(sN) else L
        ways.append([r1(a), r1(b), nm if nm in C['geoRoads'] else '', hw, tg.get('lanes', ''), tg.get('width', ''), tg.get('oneway', ''), tg.get('surface', ''), tg.get('maxspeed', ''), 1 if tg.get('bridge') else 0])
    step = L / len(line) if closed else L / (len(line) - 1)
    about = {
        'track': C.get('about', C['id']),
        'frame': 'metres; origin = the start line (lat0, lon0: the first point of the route); x east, z south; x = (lon - lon0) * N cos(lat0), z = -(lat - lat0) * M (WGS84 radii at lat0)',
        'line': 'the centre line every %.3f m from the start line %s: OSM\'s polyline every 1 m, a Gaussian of sigma 3 m (the corners rounded), resampled' % (step, 'round the lap (closed; the last point joins the first)' if closed else 'to the end of the road (open)'),
        'h': 'the road\'s height at each point of line (m above sea level, 0.1 m): the ground model across the road (median of 5 samples, -8..8 m), the bridges straight from bank to bank, dips under 60 m filled, a 35 m median, sigma 15 m, grades at most %d %%, sigma 5 m' % round(MAXG * 100),
        'hRaw': 'the ground model under each point of line before the smoothing (m, 0.1 m)',
        'ways': '[s0, s1, road name (geographic names only), OSM highway, lanes, width, oneway today, surface, maxspeed, bridge]: the route\'s OSM ways in driving order (s in m from the start line)',
        'bends': '[s of the apex, radius m, side (1 right, -1 left), turn deg]: the bends of line with a radius under 60 m',
        'bld': '[x, z, length, width, angle (rad, the long side from +x towards +z), height (m, 0 = not in OSM), kind, s, d (m, + right of the travel direction)]: the buildings with any part within %d m (OSM); kinds: ' % C['dist']['bld'] + BLD_KINDS,
        'bldOutline': '[index in bld, [x, z, ...]]: the outline of the buildings that are not a rectangle',
        'trees': '[x, z, kind]: single trees (OSM) within %d m; kind p pine, c cypress, o olive, m palm, b broadleaved, \'\' unknown' % C['dist']['trees'], 'treeRows': '[kind, [x, z, ...]]',
        'walls': '[barrier (OSM: wall, retaining_wall, fence, guard_rail, hedge ...), height (0 = untagged), wall / material, [x, z, ...]]: within %d m' % C['dist']['walls'],
        'coast': '[x, z, ...]: the coastline within %d m (OSM: the land on the left of the way\'s direction, the sea on the right)' % C['dist']['coast'], 'cliffs': '[x, z, ...]: cliffs within %d m (OSM: the lower side on the right)' % C['dist']['cliffs'],
        'shore': '[natural (beach, bare_rock ...), [x, z, ...] outline]: within %d m' % C['dist']['shore'], 'water': '[waterway, name (geographic), culvert / tunnel, [x, z, ...]]: streams within %d m' % C['dist']['water'],
        'rail': '[railway (rail, funicular ...), bridge, tunnel, [x, z, ...]]: within %d m' % C['dist']['rail'],
        'roads': '[highway, lanes, width, 1 bridge / 2 tunnel, layer, surface, name (geographic), par (1: a carriageway alongside the route), [x, z, ...]]: other roads and paths within %d m (clipped to %d m)' % (C['dist']['roads'], C['dist']['roads'] + 20),
        'side': '[s, side (1 right, -1 left), angle (deg from the travel direction, + right), highway, lanes or width, oneway, name (geographic), [x, z, ...] the first 60 m from the junction]: every road and path that meets the route',
        'onRoad': '[s, kind (crossing, traffic_signals, stop, give_way, calming), detail]', 'lamps': '[x, z]: street lamps within %d m' % C['dist']['lamps'], 'stops': '[s, side, distance, shelter]: bus stops within %d m' % C['dist']['lamps'],
        'bridges': '[s0, s1]: the route on a bridge', 'over': '[s, rail / road, kind]: a railway or road on a bridge over the route',
        'landmarks': '[label (game, Slovenian), English, kind, s, d, [x, z, ...] outline]: s and d of its nearest point', 'places': '[label, x, z, s, d of OSM\'s place from the road]: the HUD\'s places',
        'grids': 'PNG files next to this one (see each entry)',
        'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0), downloaded %s; Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0)' % R.get('date', ''),
        'tools': 'tools/proga-podatki.py with %s/config.json (see the tool\'s header)' % os.path.relpath(out_dir, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    }
    data = {'about': about, 'lat0': round(F.lat0, 7), 'lon0': round(F.lon0, 7), 'closed': closed, 'length': r1(L, 2), 'step': round(step, 4),
            'line': flat(line, 2), 'h': [r1(v) for v in h], 'hRaw': [r1(v) for v in h0], 'ways': ways, 'bends': bends(line), 'grids': grids}
    data.update(vec)
    path = os.path.join(out_dir, C['id'] + '.json')
    with open(path, 'w') as f:
        f.write('{\n' + ',\n'.join(json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) for k, v in data.items()) + '\n}\n')
    print('wrote', path, os.path.getsize(path) // 1024, 'KB; grids:', ', '.join('%s %d KB' % (g['file'], os.path.getsize(os.path.join(out_dir, g['file'])) // 1024) for g in grids.values()))

def main():
    if len(sys.argv) < 3: print(__doc__ or 'usage: python3 -I tools/proga-podatki.py tools/<id>/config.json RAW [osm] [route] [data]'); sys.exit(2)
    C.update(load_config(sys.argv[1])); raw = sys.argv[2]; os.makedirs(raw, exist_ok=True)
    steps = [a for a in sys.argv[3:] if a in ('osm', 'route', 'data')] or ['osm', 'route', 'data']
    if 'osm' in steps: step_osm(raw)
    if 'route' in steps: step_route(raw)
    if 'data' in steps: step_data(raw)

if __name__ == '__main__':
    main()
