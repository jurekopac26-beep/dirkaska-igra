# Tools for designing and measuring a short city loop on Overture (OSM-derived) data.
import pickle, math, io, os, json, functools, urllib.request
import numpy as np
import shapely
from shapely.geometry import LineString, Point, Polygon, MultiPolygon, mapping
from shapely.ops import substring, linemerge, transform
import networkx as nx
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
import tempfile
CACHE = os.environ.get('ZAVITE_CACHE', os.path.join(tempfile.gettempdir(), 'zavite')); os.makedirs(CACHE, exist_ok=True)
DRIVE = {'motorway': 1.0, 'trunk': 1.0, 'primary': 1.0, 'secondary': 1.0, 'tertiary': 1.0, 'residential': 1.15,
         'unclassified': 1.15, 'living_street': 1.4, 'service': 2.2, 'pedestrian': 2.8, 'unknown': 1.6}
WIDTH = {'motorway': 3.2, 'trunk': 3.0, 'primary': 2.6, 'secondary': 2.2, 'tertiary': 1.9, 'residential': 1.3, 'unclassified': 1.3,
         'living_street': 1.0, 'service': 0.7, 'pedestrian': 1.0, 'footway': 0.4, 'cycleway': 0.4, 'path': 0.4, 'steps': 0.4,
         'track': 0.5, 'unknown': 0.8, 'sidewalk': 0.3, 'crosswalk': 0.3, 'bridleway': 0.4}
# Overture place categories that count as sights (checked by hand afterwards)
SIGHT_CATS = {'landmark_and_historical_building', 'monument', 'museum', 'art_museum', 'history_museum', 'science_museum',
              'church_cathedral', 'church', 'cathedral', 'mosque', 'synagogue', 'buddhist_temple', 'hindu_temple', 'shinto_shrine',
              'temple', 'palace', 'castle', 'fort', 'fountain', 'tourist_attraction', 'theatre', 'theater', 'opera_and_ballet',
              'performing_arts_theater', 'concert_hall', 'bridge', 'city_hall', 'town_hall', 'government_building', 'arch',
              'tower', 'observatory', 'statue', 'sculpture_statue', 'memorial', 'memorial_park', 'public_plaza', 'square',
              'plaza', 'stadium_arena', 'library', 'national_park', 'park', 'botanical_garden', 'historic_site', 'heritage_site',
              'religious_organization', 'place_of_worship', 'gate', 'lighthouse', 'clock_tower', 'parliament', 'courthouse',
              'train_station', 'opera_house', 'art_gallery', 'architectural_landmark', 'ruins', 'archaeological_site', 'obelisk'}
SIGHT_TAGS = {'historic', 'tourism', 'memorial'}
NATURAL = {'peak', 'cliff', 'waterfall', 'rock', 'cave_entrance', 'volcano', 'spring', 'glacier', 'stone', 'gorge', 'valley', 'ridge', 'saddle', 'arch', 'beach', 'bay', 'cape', 'lake', 'pond', 'reservoir', 'river', 'stream'}

def load(name):
    d = pickle.load(open(os.path.join(CACHE, f'data_{name}.pkl'), 'rb'))
    lon0, lat0, lon1, lat1 = d['bbox']
    c = ((lon0 + lon1) / 2, (lat0 + lat1) / 2)
    fwd = Transformer.from_crs('EPSG:4326', f'+proj=aeqd +lat_0={c[1]} +lon_0={c[0]} +datum=WGS84 +units=m', always_xy=True)
    inv = Transformer.from_crs(f'+proj=aeqd +lat_0={c[1]} +lon_0={c[0]} +datum=WGS84 +units=m', 'EPSG:4326', always_xy=True)
    P = lambda g: transform(fwd.transform, g)
    for layer in ('segment', 'building', 'place', 'infra', 'landuse', 'water', 'land'):
        if layer not in d: d[layer] = []
        for r in d[layer]:
            r['g'] = P(r['geom'])
            nm = r.get('names') or {}
            r['name'] = (nm.get('primary') if nm else None) or ''
            common = (nm.get('common') if nm else None) or []
            r['name_en'] = dict(common).get('en', '') if common else ''
    d['fwd'], d['inv'], d['center'] = fwd, inv, c
    d['xy'] = lambda lat, lon: fwd.transform(lon, lat)
    return d

def graph(d):
    G = nx.Graph()
    for r in d['segment']:
        if r.get('subtype') != 'road': continue
        cls = r.get('class') or 'unknown'
        if cls not in DRIVE: continue
        g = r['g']
        if g.geom_type != 'LineString' or g.length == 0: continue
        cons = sorted((c['at'], c['connector_id']) for c in (r.get('connectors') or []))
        if len(cons) < 2: continue
        flags = set()
        for f in r.get('road_flags') or []:
            for v in f.get('values') or []: flags.add(v)
        lvl = 0
        for lr in r.get('level_rules') or []:
            if lr.get('value'): lvl = lr['value']
        for (a0, n0), (a1, n1) in zip(cons, cons[1:]):
            if a1 <= a0: continue
            sub = substring(g, a0, a1, normalized=True)
            L = sub.length
            if L <= 0: continue
            w = L * DRIVE[cls]
            if G.has_edge(n0, n1) and G[n0][n1]['w'] <= w: continue
            G.add_edge(n0, n1, w=w, L=L, geom=sub, a=n0, cls=cls, name=r['name'], sid=r['id'], flags=flags, level=lvl,
                       sub=r.get('subclass'))
    pos = {}
    for u, v, e in G.edges(data=True):
        cs = list(e['geom'].coords)
        if e['a'] == u: pos.setdefault(u, cs[0]); pos.setdefault(v, cs[-1])
        else: pos.setdefault(v, cs[0]); pos.setdefault(u, cs[-1])
    nx.set_node_attributes(G, pos, 'xy')
    d['G'] = G
    d['nodes'] = list(G.nodes)
    d['nodexy'] = np.array([G.nodes[n]['xy'] for n in d['nodes']])
    return G

def nearest(d, lat, lon):
    x, y = d['xy'](lat, lon)
    i = int(np.argmin(((d['nodexy'] - (x, y)) ** 2).sum(1)))
    return d['nodes'][i], math.dist(d['nodexy'][i], (x, y))

def edge_coords(G, u, v):
    e = G[u][v]
    cs = list(e['geom'].coords)
    return cs if e['a'] == u else cs[::-1]

def route(d, wps, avoid=(), closed=True):
    """wps: list of (lat, lon) [, ...]; a closed loop through them in order. avoid: list of (lat,lon) nodes to avoid."""
    G = d['G']
    H = G
    if avoid:
        H = G.copy()
        for lat, lon in avoid:
            n, dist = nearest(d, lat, lon)
            if n in H: H.remove_node(n)
    ns = []
    for p in wps:
        n, dist = nearest(d, *p)
        ns.append(n)
        if dist > 25: print(f'  ! waypoint {p} snapped {dist:.0f} m away')
    path = []
    for a, b in zip(ns, ns[1:] + (ns[:1] if closed else [])):
        sp = nx.shortest_path(H, a, b, weight='w')
        path += sp if not path else sp[1:]
    coords, parts = [], []
    for u, v in zip(path, path[1:]):
        cs = edge_coords(G, u, v)
        coords += cs if not coords else cs[1:]
        e = G[u][v]
        parts.append((e['name'], e['cls'], e['L'], e['flags'], e['level']))
    line = LineString(coords)
    return dict(path=path, line=line, parts=parts, length=line.length)

def summarize_parts(parts):
    out = []
    for name, cls, L, flags, lvl in parts:
        key = (name or '(brez imena)', cls)
        if out and out[-1][0] == key: out[-1][1] += L
        else: out.append([key, L])
    return [(k[0], k[1], round(L)) for k, L in out]

def resample(line, step=5.0):
    n = max(2, int(line.length / step))
    return np.array([line.interpolate(i * line.length / n).coords[0] for i in range(n + 1)])

def corners(line, closed=True):
    """Count corners: radius < 90 m and > 35 deg of turn; hairpin > 130 deg (like the earlier list)."""
    pts = resample(line, 5.0)
    if closed: pts = np.vstack([pts[:-1], pts[:6]])
    hd = np.unwrap(np.arctan2(np.diff(pts[:, 1]), np.diff(pts[:, 0])))
    dh = np.diff(hd)  # per 5 m
    # smooth over 15 m
    k = 3
    dhs = np.convolve(dh, np.ones(k) / k, mode='same')
    curv = np.abs(dhs) / 5.0  # 1/m
    tight = curv > 1 / 90.0
    res, i, n = [], 0, len(tight)
    while i < n:
        if tight[i]:
            j = i
            while j < n and tight[j]: j += 1
            turn = abs(np.degrees(dh[i:j].sum()))
            if turn > 35: res.append((i * 5.0, turn, 1 / max(curv[i:j].max(), 1e-6)))
            i = j
        else: i += 1
    hair = sum(1 for _, t, _ in res if t > 130)
    return len(res), hair, res

@functools.lru_cache(maxsize=None)
def tile(z, x, y):
    cache = os.path.join(CACHE, 'tiles'); os.makedirs(cache, exist_ok=True)
    fn = os.path.join(cache, f'{z}_{x}_{y}.png')
    if not os.path.exists(fn):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        open(fn, 'wb').write(urllib.request.urlopen(url, timeout=60).read())
    from PIL import Image
    a = np.asarray(Image.open(fn).convert('RGB')).astype(float)
    return a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768

def elev(lat, lon, z=15):
    n = 2 ** z
    xf = (lon + 180) / 360 * n
    yf = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    x, y = int(xf), int(yf)
    px, py = (xf - x) * 256, (yf - y) * 256
    t = tile(z, x, y)
    i, j = min(int(py), 255), min(int(px), 255)
    return float(t[i, j])

def profile(d, line, step=25):
    pts = resample(line, step)
    hs = []
    for x, y in pts:
        lon, lat = d['inv'].transform(x, y)
        hs.append(elev(lat, lon))
    return np.array(hs)

def sights(d, line, maxd=100):
    """Candidate sights near the line: named buildings, sight places, base features with wikidata or sight tags."""
    out = []
    buf = line.buffer(maxd)
    for r in d['building']:
        if not r['name'] or not r['g'].intersects(buf): continue
        out.append(('building', r['name'], r.get('class') or '', r['g'], r))
    for r in d['place']:
        tx = r.get('taxonomy') or {}
        prim = tx.get('primary') or ''
        hier = set(tx.get('hierarchy') or [])
        alts = set(tx.get('alternates') or [])
        cats = {prim} | hier | alts | {r.get('basic_category') or ''}
        if not (cats & SIGHT_CATS): continue
        if (r.get('confidence') or 0) < 0.4: continue
        if r.get('brand') and (r['brand'] or {}).get('names'): continue
        if not r['g'].intersects(buf): continue
        out.append(('place', r['name'], prim + ('/' + r.get('basic_category') if r.get('basic_category') else ''), r['g'], r))
    for layer in ('infra', 'landuse', 'land', 'water'):
        for r in d[layer]:
            if layer in ('land', 'water') and not (r.get('wikidata') or (r['name'] and (r.get('class') or '') in NATURAL)): continue
            st = r.get('source_tags') or []
            st = dict(st) if st else {}
            if not (r.get('wikidata') or st.get('wikidata') or (set(st) & SIGHT_TAGS)): continue
            if not r['g'].intersects(buf): continue
            out.append((layer, r['name'] or st.get('name', ''), f"{r.get('subtype')}/{r.get('class')} " + ' '.join(f'{k}={v}' for k, v in st.items() if k in ('historic', 'tourism', 'memorial', 'man_made', 'amenity', 'wikidata', 'building')), r['g'], r))
    res = []
    for kind, name, cls, g, r in out:
        dist = line.distance(g)
        res.append(dict(kind=kind, name=name, cls=cls, dist=dist, g=g, r=r))
    res.sort(key=lambda s: s['dist'])
    return res

def lonlat(d, x, y):
    return d['inv'].transform(x, y)

def twist(line, closed=True):
    """Twistiness: degrees of turning per km, share of the length on straights (radius > 250 m over 30 m), longest straight (m)."""
    pts = resample(line, 5.0)
    if closed: pts = np.vstack([pts[:-1], pts[:8]])
    hd = np.unwrap(np.arctan2(np.diff(pts[:, 1]), np.diff(pts[:, 0])))
    hs = np.convolve(hd, np.ones(4) / 4, mode='valid')
    dh = np.abs(np.diff(hs))
    dh[dh < np.radians(0.5)] = 0
    n = len(line.coords) and (len(pts) - (8 if closed else 0))
    total = np.degrees(dh[:max(1, n - 4)].sum())
    km = line.length / 1000
    win = 6   # 30 m
    straight = []
    for i in range(len(hd) - win):
        straight.append(abs(hd[i + win] - hd[i]) < (win * 5.0) / 250.0)
    straight = np.array(straight[:max(1, n - win)])
    share = float(straight.mean()) if len(straight) else 0.0
    longest, run = 0, 0
    for v in straight:
        run = run + 1 if v else 0
        longest = max(longest, run)
    return total / km, share, longest * 5.0
