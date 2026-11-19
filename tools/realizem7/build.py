#!/usr/bin/env python3
"""REALIZEM 7 (docs/realizem/k7-mestne.md): what OpenStreetMap has by the road of the town tracks and their own data (js/data/<id>.js, made by
tools/<id>/build.py) leaves out, written into the RZ7 block of js/world-realizem7.js (between its <rz7> markers):
  h  [[i, m], ...]           buildings: the height of <ID>_DATA.bld[i] where OSM has one now (height, else building:levels x 3 + 1.5 m, as
                             tools/proga-podatki.py) and the data has 0 (matched by the centre, within 2 m, and the size, within 20 %)
  w  [[k, h, x, z, ...], ...] barriers within 60 m of the road that the track does not draw: walls (k 0), retaining walls (1) and hedges (2)
                             beyond its 30 m or missing from its data (more than 3 m from its lines), fences and railings (3) all; h the OSM
                             height (0 = none). Not the city walls, and nothing inside or within 12 m of the track's landmark (<ID>_DATA.marks:
                             the amphitheatre, the forts, the old town's walls), which the tracks draw themselves
  p  [[w, sd, x, z, ...], ...] the sidewalks (footway=sidewalk) within 30 m: the centre line, w the OSM width (0 = none), sd the side of the
                             road (+1: on the right of the line's direction, x east, z south)
The OSM API's map calls (tiles of 0.004 deg over the road +-150 m) are kept in --osm DIR (fetched when missing;
default: realizem7-osm in the system's temporary folder, outside the repository).
  python3 -I tools/realizem7/build.py [--osm DIR] luanda mombasa
"""
import glob, json, math, os, re, sys, tempfile, time, urllib.request, xml.etree.ElementTree as ET
import numpy as np

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
A_, E2 = 6378137.0, 0.00669437999014
TILE = 0.004
KIND = {'wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3}
DATA = {'luanda': 'LU_DATA', 'mombasa': 'MO_DATA'}

def radii(lat):
    s = math.sin(math.radians(lat)); w = 1 - E2 * s * s
    return A_ * (1 - E2) / w ** 1.5, A_ / math.sqrt(w)

def r1(v): return round(float(v), 1)

def js_value(path, key):
    """one value of a js/data/<id>.js object (JSON), by its key"""
    src = open(path, encoding='utf8').read(); m = re.search(r'"%s"\s*:' % key, src)
    return json.JSONDecoder().raw_decode(src, m.end())[0] if m else []

def fetch_tiles(tid, lat0, lon0, line, M, N, c, osmdir):
    tiles = set()
    for x, z in line:
        lat = lat0 - math.degrees(z / M); lon = lon0 + math.degrees(x / (N * c)); dla = math.degrees(150 / M); dlo = math.degrees(150 / (N * c))
        for la in (lat - dla, lat, lat + dla):
            for lo in (lon - dlo, lon, lon + dlo): tiles.add((math.floor(lo / TILE), math.floor(la / TILE)))
    os.makedirs(os.path.join(osmdir, tid), exist_ok=True)
    for i, j in sorted(tiles):
        f = os.path.join(osmdir, tid, 't_%d_%d.osm' % (i, j))
        if os.path.exists(f) and os.path.getsize(f) > 0: continue
        url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.4f,%.4f,%.4f,%.4f' % (i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE)
        req = urllib.request.Request(url, headers={'User-Agent': 'osm-data-fetch/1.0'})
        for k in range(4):
            try:
                with urllib.request.urlopen(req, timeout=120) as r: open(f, 'wb').write(r.read()); break
            except Exception as e:
                print('  retry', url, e, flush=True); time.sleep(2 ** k)
        time.sleep(1)

class Road:
    def __init__(self, line):
        self.a = line[:-1]; self.ab = line[1:] - line[:-1]; self.L2 = (self.ab ** 2).sum(1) + 1e-9
    def dist(self, P):
        """distance of points P to the road's centre line and the side (+1 on the right of the travel direction)"""
        P = np.atleast_2d(P); d = np.empty(len(P)); sd = np.empty(len(P))
        for k in range(0, len(P), 256):
            Q = P[k:k + 256][:, None, :]; t = np.clip(((Q - self.a) * self.ab).sum(2) / self.L2, 0, 1)
            C = self.a + t[..., None] * self.ab; dd = np.sqrt(((Q - C) ** 2).sum(2)); j = dd.argmin(1); i = np.arange(len(j))
            d[k:k + 256] = dd[i, j]; cr = self.ab[j, 0] * (Q[:, 0, 1] - self.a[j, 1]) - self.ab[j, 1] * (Q[:, 0, 0] - self.a[j, 0]); sd[k:k + 256] = np.sign(cr)
        return d, sd

def seg_dist(P, S):
    """distance of each point of P to the nearest segment of the polylines S (a list of k x 2 arrays)"""
    if not S: return np.full(len(P), 1e9)
    a = np.concatenate([s[:-1] for s in S]); b = np.concatenate([s[1:] for s in S]); ab = b - a; L2 = (ab ** 2).sum(1) + 1e-9
    t = np.clip(((P[:, None, :] - a) * ab).sum(2) / L2, 0, 1); C = a + t[..., None] * ab
    return np.sqrt(((P[:, None, :] - C) ** 2).sum(2)).min(1)

def densify(P, step):
    out = [P[0]]
    for p, q in zip(P[:-1], P[1:]):
        n = max(1, int(math.ceil(np.hypot(*(q - p)) / step)))
        out += [p + (q - p) * k / n for k in range(1, n + 1)]
    return np.array(out)

def runs(mask):
    """the index ranges [i0, i1] where mask holds, at least 2 points long"""
    out, i = [], 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j + 1 < len(mask) and mask[j + 1]: j += 1
            if j > i: out.append((i, j))
            i = j + 1
        else: i += 1
    return out

def height(t):
    for k in ('height', 'building:height'):
        try: return float(str(t[k]).split()[0].replace(',', '.'))
        except Exception: pass
    try: return float(t['building:levels']) * 3.0 + 1.5
    except Exception: return 0.0

def track(tid, osmdir):
    d = json.load(open(os.path.join(REPO, 'tools', tid, tid + '.json')))
    lat0, lon0 = d['lat0'], d['lon0']; M, N = radii(lat0); c = math.cos(math.radians(lat0))
    line = np.array(d['line'], float).reshape(-1, 2); road = Road(line)
    fetch_tiles(tid, lat0, lon0, line, M, N, c, osmdir)
    nodes, ways = {}, {}
    for f in sorted(glob.glob(os.path.join(osmdir, tid, '*.osm'))):
        for e in ET.parse(f).getroot():
            if e.tag == 'node': nodes[int(e.get('id'))] = (float(e.get('lat')), float(e.get('lon')))
            elif e.tag == 'way': ways[int(e.get('id'))] = ([int(n.get('ref')) for n in e.findall('nd')], {t.get('k'): t.get('v') for t in e.findall('tag')})
    def xz(refs):
        if any(r not in nodes for r in refs): return None
        return np.array([(math.radians(nodes[r][1] - lon0) * N * c, -math.radians(nodes[r][0] - lat0) * M) for r in refs])
    data = os.path.join(REPO, 'js', 'data', tid + '.js')
    bld = js_value(data, 'bld'); walls = js_value(data, 'walls'); cwall = js_value(data, 'cwall')
    have = [np.array(fl, float).reshape(-1, 2) for k, fl in walls if k <= 2] + [np.array(fl, float).reshape(-1, 2) for h, fl in cwall]
    marks = [np.array(e[4], float).reshape(-1, 2) for e in js_value(data, 'marks')]
    def in_mark(Q):
        out = seg_dist(Q, [np.vstack([M_, M_[:1]]) for M_ in marks]) < 12
        for M_ in marks:   # (inside: the crossings of a ray to +x)
            a, b = M_, np.roll(M_, -1, 0); c = ((a[:, 1] > Q[:, None, 1]) != (b[:, 1] > Q[:, None, 1])) & (Q[:, None, 0] < a[:, 0] + (Q[:, None, 1] - a[:, 1]) * (b[:, 0] - a[:, 0]) / (b[:, 1] - a[:, 1] + 1e-12))
            out |= c.sum(1) % 2 == 1
        return out
    out = {'h': [], 'w': [], 'p': []}
    # buildings: the heights OSM has and the data has not
    B = np.array([b[:6] for b in bld], float) if bld else np.zeros((0, 6))
    for refs, t in ways.values():
        if 'building' not in t: continue
        h = height(t)
        if h <= 0: continue
        P = xz(refs)
        if P is None or len(P) < 4: continue
        cx, cz = P[:-1].mean(0); ar = abs(np.dot(P[:-1, 0], np.roll(P[:-1, 1], -1)) - np.dot(P[:-1, 1], np.roll(P[:-1, 0], -1))) / 2
        if not len(B): continue
        dd = np.hypot(B[:, 0] - cx, B[:, 1] - cz); i = int(dd.argmin())
        if dd[i] < 2 and B[i, 5] == 0 and abs(B[i, 2] * B[i, 3] - ar) < 0.2 * B[i, 2] * B[i, 3] + 4: out['h'].append([i, r1(h)])
    # barriers
    for wid, (refs, t) in sorted(ways.items()):
        k = KIND.get(t.get('barrier'))
        if k is None: continue
        P = xz(refs)
        if P is None or len(P) < 2: continue
        Q = densify(P, 2.0); dr, _ = road.dist(Q); dw = seg_dist(Q, have) if k <= 2 else np.full(len(Q), 1e9)
        try: h = float(str(t.get('height', '0')).split()[0].replace(',', '.'))
        except Exception: h = 0.0
        if not h and t.get('barrier') in ('railing', 'handrail'): h = 1.0   # (a railing: the usual 1 m; a fence without a height: the wrapper's default)
        for i0, i1 in runs((dr <= 60) & (dw > 3.0) & ~in_mark(Q)):
            S = Q[i0:i1 + 1]
            if np.hypot(*(S[-1] - S[0])) < 1.5 and len(S) < 3: continue
            keep = [S[0]]   # (the straight runs as one segment: points closer than 0.15 m to the chord dropped)
            for p in S[1:-1]:
                a, b = keep[-1], S[-1]; ab = b - a; L = np.hypot(*ab)
                if L < 1e-6 or abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L > 0.15 or np.hypot(*(p - a)) > 12: keep.append(p)
            keep.append(S[-1])
            out['w'].append([k, r1(h)] + [r1(v) for p in keep for v in p])
    # sidewalks
    for wid, (refs, t) in sorted(ways.items()):
        if t.get('footway') != 'sidewalk': continue
        P = xz(refs)
        if P is None or len(P) < 2: continue
        Q = densify(P, 2.0); dr, sd = road.dist(Q)
        try: w = float(str(t.get('width', '0')).split()[0].replace(',', '.'))
        except Exception: w = 0.0
        for i0, i1 in runs(dr <= 30):
            S = Q[i0:i1 + 1]; seg = S[1:] - S[:-1]; mid = (S[1:] + S[:-1]) / 2
            # the side of the road from the sidewalk: the road's nearest point to the right (+1) or the left of the sidewalk's direction
            near = np.array([line[np.hypot(*(line - m).T).argmin()] for m in mid])
            cr = seg[:, 0] * (near[:, 1] - mid[:, 1]) - seg[:, 1] * (near[:, 0] - mid[:, 0]); side = 1 if (cr > 0).sum() >= len(cr) / 2 else -1
            keep = [S[0]] + [p for i, p in enumerate(S[1:-1], 1) if i % 3 == 0] + [S[-1]]
            out['p'].append([r1(w), side] + [r1(v) for p in keep for v in p])
    L = lambda K: sum(np.hypot(*(np.diff(np.array(e[2:]).reshape(-1, 2), axis=0).T)).sum() for e in out[K])
    print('%s: heights %d, barriers %d (%.0f m: %s), sidewalks %d (%.0f m)' % (tid, len(out['h']), len(out['w']), L('w'),
          {k: round(sum(np.hypot(*(np.diff(np.array(e[2:]).reshape(-1, 2), axis=0).T)).sum() for e in out['w'] if e[0] == k)) for k in range(4)},
          len(out['p']), L('p')), flush=True)
    return out

def main():
    args = sys.argv[1:]; osmdir = os.path.join(tempfile.gettempdir(), 'realizem7-osm')   # (outside the repository: the tiles are not committed)
    if '--osm' in args: i = args.index('--osm'); osmdir = args[i + 1]; del args[i:i + 2]
    ids = args or list(DATA)
    res = {tid: track(tid, osmdir) for tid in ids}
    js = os.path.join(REPO, 'js', 'world-realizem7.js'); src = open(js, encoding='utf8').read()
    m = re.search(r'(// <rz7>\n)(.*?)(\n\s*// </rz7>)', src, re.S)
    if not m: sys.exit('no <rz7> markers in ' + js)
    g = m.group(2); old = json.loads(g[g.index('{'):g.rindex('}') + 1])
    old.update(res)
    body = '  const RZ7 = {\n' + ',\n'.join('    "%s": %s' % (k, json.dumps(old[k], separators=(',', ':'))) for k in sorted(old)) + '\n  };'
    open(js, 'w', encoding='utf8').write(src[:m.start(2)] + body + src[m.end(2):])

if __name__ == '__main__':
    main()
