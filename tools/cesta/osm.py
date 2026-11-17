#!/usr/bin/env python3
"""OpenStreetMap round a track of the game, for the side roads, lamps and stops of the package Realizem E.

  node tools/cesta/crte.js <id> > crte.json
  python3 -I tools/cesta/osm.py crte.json <id> <raw-dir>      (downloads the tiles the track's corridor touches, fits the map to the track)

It downloads and measures the fit (docs/realizem/paket-e.md, "Prenos OSM"); tools/cesta/izvoz.py then writes the side roads, lamps and
stops in the game's coordinates. The downloads stay outside the repository (<raw-dir>, kept between runs). Needs numpy and scipy.

Data: (c) OpenStreetMap contributors, ODbL 1.0 (api.openstreetmap.org/api/0.6/map). Names are never read."""
import sys, os, json, math, ssl, time, shutil, urllib.request, urllib.error, xml.etree.ElementTree as ET
import numpy as np
from scipy.spatial import cKDTree

A, E2 = 6378137.0, 0.00669437999014          # WGS84
TW, TH, PAS = 0.03, 0.02, 200.0              # a tile (degrees of longitude and latitude), the corridor's half width (m)
UA = 'osm-extract-script/1.0'                # a generic client name: no project, no contact
API = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.5f,%.5f,%.5f,%.5f'
ROADS = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'track',
         'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link', 'road', 'raceway'}

class Geo:
    """The game's world on the Earth (as maketa-menija/orodja/geo_lib.py): the origin at (lat0, lon0), x east, z south, turned by rot degrees."""
    def __init__(self, lat0, lon0, rot=0.0, scale=1.0):
        s = math.sin(math.radians(lat0)); q = 1 - E2 * s * s
        self.lat0, self.lon0, self.rot, self.scale = lat0, lon0, rot, scale
        self.M, self.N, self.c = A * (1 - E2) / q ** 1.5, A / math.sqrt(q), math.cos(math.radians(lat0))
    def to_ll(self, x, z):
        x = np.asarray(x, float) * self.scale; z = np.asarray(z, float) * self.scale; r = math.radians(self.rot)
        e = x * math.cos(r) + z * math.sin(r); s = -x * math.sin(r) + z * math.cos(r)
        return self.lat0 - np.degrees(s / self.M), self.lon0 + np.degrees(e / (self.N * self.c))
    def to_xz(self, lat, lon):
        e = np.radians(np.asarray(lon, float) - self.lon0) * self.N * self.c; s = -np.radians(np.asarray(lat, float) - self.lat0) * self.M
        r = math.radians(self.rot)
        return (e * math.cos(r) - s * math.sin(r)) / self.scale, (e * math.sin(r) + s * math.cos(r)) / self.scale

def tiles(geo, px, pz):
    """The tiles (their south-west corners' indices) the corridor of the track touches."""
    T = set()
    for dx, dz in ((-PAS, -PAS), (PAS, -PAS), (-PAS, PAS), (PAS, PAS)):
        la, lo = geo.to_ll(np.asarray(px) + dx, np.asarray(pz) + dz)
        T |= set(zip(np.floor(la / TH).astype(int).tolist(), np.floor(lo / TW).astype(int).tolist()))
    return sorted(T)

def fetch(box, raw, depth=0):
    """One box (west, south, east, north) into raw/, kept between runs; a box with too many nodes (HTTP 400) is split in four."""
    path = os.path.join(raw, 't_%.5f_%.5f_%.5f_%.5f.osm' % box)
    if os.path.exists(path): return [path]
    ctx = ssl.create_default_context(cafile=os.environ.get('CURL_CA_BUNDLE') or os.environ.get('SSL_CERT_FILE') or None)
    try:
        with urllib.request.urlopen(urllib.request.Request(API % box, headers={'User-Agent': UA}), timeout=180, context=ctx) as r, open(path + '.part', 'wb') as f:
            shutil.copyfileobj(r, f)
    except urllib.error.HTTPError as e:
        if e.code != 400 or depth >= 3: raise
        w, s, e_, n = box; mx, my = (w + e_) / 2, (s + n) / 2; out = []
        for b in ((w, s, mx, my), (mx, s, e_, my), (w, my, mx, n), (mx, my, e_, n)): out += fetch(b, raw, depth + 1)
        return out
    os.replace(path + '.part', path); time.sleep(1.0)
    return [path]

def parse(paths):
    """Nodes (id -> lat, lon), tagged nodes (id -> tags) and ways with a highway tag (id -> node ids, tags); the name tags are dropped."""
    nodes, tagged, ways = {}, {}, {}
    for p in paths:
        for _, el in ET.iterparse(p, events=('end',)):
            if el.tag == 'node':
                i = int(el.get('id')); nodes[i] = (float(el.get('lat')), float(el.get('lon')))
                t = {c.get('k'): c.get('v') for c in el if c.tag == 'tag' and not c.get('k').startswith(('name', 'ref', 'operator', 'brand', 'wikidata', 'wikipedia'))}
                if t: tagged[i] = t
                el.clear()
            elif el.tag == 'way':
                t = {c.get('k'): c.get('v') for c in el if c.tag == 'tag' and not c.get('k').startswith(('name', 'ref', 'operator', 'brand', 'wikidata', 'wikipedia'))}
                if 'highway' in t: ways[int(el.get('id'))] = ([int(c.get('ref')) for c in el if c.tag == 'nd'], t)
                el.clear()
            elif el.tag == 'relation': el.clear()
    return nodes, tagged, ways

def dense(xz, step=1.0):
    """A polyline's points every `step` metres at most."""
    out = []
    for a, b in zip(xz[:-1], xz[1:]):
        n = max(1, int(math.ceil(math.hypot(b[0] - a[0], b[1] - a[1]) / step)))
        for k in range(n): out.append((a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n))
    out.append(tuple(xz[-1]))
    return out

def fit(P, Q, rounds=40):
    """The rigid move (R, t) of the map's points Q onto the track's centre line P (closest points, trimmed), with the distances before and after."""
    R, t = np.eye(2), np.zeros(2); d0 = cKDTree(Q).query(P)[0]
    for k in range(rounds):
        Qk = Q @ R.T + t; d, j = cKDTree(Qk).query(P); cut = max(6.0, 40.0 * 0.8 ** k); ok = d < cut
        if ok.sum() < 20: break
        a, b = Qk[j[ok]], P[ok]; ca, cb = a.mean(0), b.mean(0); U, S, Vt = np.linalg.svd((a - ca).T @ (b - cb))
        D = np.diag([1.0, np.sign(np.linalg.det(Vt.T @ U.T))]); Rk = Vt.T @ D @ U.T
        R, t = Rk @ R, Rk @ (t - ca) + cb
    d1, j = cKDTree(Q @ R.T + t).query(P); ok = d1 < 6.0; a, b = (Q @ R.T + t)[j[ok]], P[ok]
    scale = math.sqrt(((b - b.mean(0)) ** 2).sum() / ((a - a.mean(0)) ** 2).sum())
    return R, t, d0, d1, scale

def stats(d): return 'median %.1f m, p90 %.1f m, max %.1f m, within 3 m %.0f %%' % (np.median(d), np.percentile(d, 90), d.max(), 100.0 * (d < 3).mean())

def main():
    C = json.load(open(sys.argv[1]))[sys.argv[2]]; raw = sys.argv[3]; os.makedirs(raw, exist_ok=True)
    g = C['geo']
    if not g: print('%s: no place on the Earth in js/geo.js' % C['id']); return
    geo = Geo(g['lat0'], g['lon0'], g['rot'], g.get('scale', 1.0)); px, pz = np.asarray(C['px']), np.asarray(C['pz'])
    paths = []
    for i, j in tiles(geo, px, pz): paths += fetch((j * TW, i * TH, (j + 1) * TW, (i + 1) * TH), raw)
    nodes, tagged, ways = parse(paths)
    ids = np.fromiter(nodes.keys(), dtype=np.int64); ll = np.asarray([nodes[i] for i in ids.tolist()]); x, z = geo.to_xz(ll[:, 0], ll[:, 1]); xz = dict(zip(ids.tolist(), zip(x.tolist(), z.tolist())))
    best = None
    for kinds in ({'raceway'}, ROADS - {'raceway'}):       # a circuit is fitted to its own line, a road to the roads round it: the better of the two
        Q = []
        for refs, t in ways.values():
            if t.get('highway') in kinds and len(refs) > 1 and all(r in xz for r in refs): Q += dense([xz[r] for r in refs])
        if len(Q) < 50: continue
        P, Q = np.column_stack([px, pz]), np.asarray(Q); R, t, d0, d1, scale = fit(P, Q)
        if best is None or (d1 < 3).mean() > (best[4] < 3).mean(): best = (kinds, R, t, d0, d1, scale, len(Q))
    if best is None: print('%s: no roads of the map near the track (%d tiles, %d ways)' % (C['id'], len(paths), len(ways))); return
    kinds, R, t, d0, d1, scale, nq = best
    print('%s: %d tiles, %d nodes, %d highway ways, fitted to %s (%d points)' % (C['id'], len(paths), len(nodes), len(ways), 'raceway' if 'raceway' in kinds else 'roads', nq))
    print('  as placed : ' + stats(d0))
    print('  fitted    : ' + stats(d1) + '; turn %.3f deg, shift %.1f, %.1f m at the origin, scale %.4f' % (math.degrees(math.atan2(R[1, 0], R[0, 0])), t[0], t[1], scale))

if __name__ == '__main__': main()
