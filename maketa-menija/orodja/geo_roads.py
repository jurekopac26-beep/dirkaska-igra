# Mockup only: where a flat track lies on the Earth, by its roads (geo_match.py finds the hilly ones by their heights; in a flat town or
# on a flat circuit the heights say little). The game's road is the real road from OpenStreetMap, so the place and turn that put the
# game's centre line on the real roads best are the world's place. The roads: Overture Maps' transportation segments (made from
# OpenStreetMap, ODbL), read from Overture's public bucket on AWS by the box round the first guess -> raw/geo/roads-<track>.json.
# Usage: python3 geo_roads.py detroit[,toronto] [--check]   (--check: only how far the track lies from the roads where it is now)
#   -> raw/geo/match.json (lat0, lon0, rot and the height offset, as geo_match.py; 'roads': the mean distance to the roads in metres)
import json, math, os, sys
import numpy as np
from scipy import ndimage
from geo_lib import DEM, Geo, RAW, track, radii

RELEASE = os.environ.get('OVERTURE', '2026-10-21.0')
# first guesses: the start line (lat, lon) and how far round it to look (m)
GUESS = {
    'detroit': (42.3300, -83.0380, 800),
    'medvode': (46.1418, 14.4091, 300),     # (by the heights: geo_match.py, then here closer)
    'moki': (37.2651, -109.9335, 300),
    'longford': (-41.5850, 147.1300, 1500),     # the Pit Straight on Illawarra Road, north of the town
    'newcastle': (-32.9275, 151.7860, 700),     # Wharf Road along the harbour
    'townsville': (-19.27210, 146.81057, 300),  # Boundary Street by the park (the track's own note)
    'chapman': (-34.0485, 18.3560, 1200),       # Hout Bay, the end of Main Road by the beach
    'sani': (-29.6150, 29.3250, 2500),          # the valley of the Mkhomazana under the hairpins
    'marrakesh': (31.58102, -7.98273, 300),     # the start line (the track's own note)
    'montreal': (45.50178, -73.52325, 300),     # the start line on the pit straight (from the track's own header)
    'toronto': (43.63408, -79.41205, 300),
    'troisrivieres': (46.34737, -72.55930, 300),
    'greatalpine': (-37.5517, 147.8764, 200),   # (by the heights: geo_match.py, then here closer)
    'hotham': (-37.0029, 147.0940, 200),
}
SKIP = {'townsville': [(0.40, 0.89)]}   # parts of the lap whose road is not in Overture (the raceway through the park): left out of the score
CELL = 2.0   # metres per cell of the distance map

def roads(tid, la0, lo0, la1, lo1):
    p = os.path.join(RAW, 'roads-' + tid + '.json')
    if os.path.exists(p): return json.load(open(p))
    import pyarrow.dataset as ds, pyarrow.fs as fs
    from shapely import wkb
    s3 = fs.S3FileSystem(anonymous=True, region='us-west-2')
    d = ds.dataset('overturemaps-us-west-2/release/' + RELEASE + '/theme=transportation/type=segment/', filesystem=s3, format='parquet')
    f = (ds.field('bbox', 'xmax') > lo0) & (ds.field('bbox', 'xmin') < lo1) & (ds.field('bbox', 'ymax') > la0) & (ds.field('bbox', 'ymin') < la1) & (ds.field('subtype') == 'road')   # (every road that reaches into the box)
    t = d.to_table(filter=f, columns=['geometry'])
    L = [[[round(x, 7), round(y, 7)] for x, y in wkb.loads(g).coords] for g in t.column('geometry').to_pylist()]
    json.dump(L, open(p, 'w')); return L

def fit(tid, g, check=None):
    T = track(tid); P = np.array(T['pts'], dtype=np.float64); x, z = P[:, 0], P[:, 1]
    u = np.arange(len(P)) / len(P); keep = np.ones(len(P), bool)
    for a, b in SKIP.get(tid, []): keep &= ~((u >= a) & (u < b))
    x, z = x[keep], z[keep]
    lat, lon, R = g; ext = max(np.abs(x).max(), np.abs(z).max()) + R + 300
    M, N = radii(lat); c = math.cos(math.radians(lat)); dlat = math.degrees(ext / M); dlon = math.degrees(ext / (N * c))
    L = roads(tid, lat - dlat, lon - dlon, lat + dlat, lon + dlon)
    # the roads drawn on a grid round the guess (east, south; metres), then each cell's distance to the nearest road
    n = int(2 * ext / CELL) + 1; grid = np.ones((n, n), bool)
    G0 = Geo(lat, lon, 0.0)
    for line in L:
        a = np.array(line); e, s = G0.to_xz(a[:, 1], a[:, 0])
        for i in range(len(a) - 1):
            k = int(max(abs(e[i + 1] - e[i]), abs(s[i + 1] - s[i])) / CELL) + 2
            ee = np.linspace(e[i], e[i + 1], k); ss = np.linspace(s[i], s[i + 1], k)
            ci = ((ee + ext) / CELL).astype(int); ri = ((ss + ext) / CELL).astype(int); ok = (ci >= 0) & (ci < n) & (ri >= 0) & (ri < n)
            grid[ri[ok], ci[ok]] = False
    D = ndimage.distance_transform_edt(grid) * CELL
    def score(e0, s0, rot):   # the mean distance (capped at 25 m) of the turned and moved centre line to the roads
        r = math.radians(rot); e = x * math.cos(r) + z * math.sin(r) + e0; s = -x * math.sin(r) + z * math.cos(r) + s0
        ci = np.clip(((e + ext) / CELL).astype(int), 0, n - 1); ri = np.clip(((s + ext) / CELL).astype(int), 0, n - 1)
        return float(np.mean(np.minimum(D[ri, ci], 25.0)))
    if check:
        e0, s0 = G0.to_xz(check['lat0'], check['lon0']); return score(float(e0), float(s0), check['rot'])
    best = (1e9, 0, 0, 0)
    for rot in np.arange(-3, 3.01, 0.5):
        for e0 in np.arange(-R, R + 0.1, 10):
            for s0 in np.arange(-R, R + 0.1, 10):
                v = score(e0, s0, rot)
                if v < best[0]: best = (v, e0, s0, rot)
    for step, rstep in ((2, 0.1), (0.5, 0.02)):
        v0, e1, s1, r1 = best
        for rot in np.arange(r1 - 6 * rstep, r1 + 6 * rstep + 1e-9, rstep):
            for e0 in np.arange(e1 - 10 * step, e1 + 10 * step + 0.01, step):
                for s0 in np.arange(s1 - 10 * step, s1 + 10 * step + 0.01, step):
                    v = score(e0, s0, rot)
                    if v < best[0]: best = (v, e0, s0, rot)
    v, e0, s0, rot = best
    la0, lo0 = G0.to_ll(e0, s0)   # (the guess's frame is not turned: east, south)
    G = Geo(float(la0), float(lo0), rot); la, lo = G.to_ll(x, z)
    dem = DEM(la.min() - 0.01, lo.min() - 0.01, la.max() + 0.01, lo.max() + 0.01, 13); off = float(np.median(dem.sample(la, lo) - P[keep, 2]))
    return {'lat0': round(float(la0), 6), 'lon0': round(float(lo0), 6), 'rot': round(float(rot), 2), 'offset': round(off, 1), 'roads': round(v, 2),
            'moved': round(math.hypot(e0, s0), 1), 'away20': round(float(np.mean([score(e0 + a, s0 + b, rot) for a, b in ((20, 0), (-20, 0), (0, 20), (0, -20))])), 2)}

if __name__ == '__main__':
    out_p = os.path.join(RAW, 'match.json'); out = json.load(open(out_p)) if os.path.exists(out_p) else {}
    ids = sys.argv[1].split(','); chk = '--check' in sys.argv
    for tid in ids:
        if chk:
            m = out[tid]; g = (m['lat0'], m['lon0'], 300); print(tid, 'roads', round(fit(tid, g, check=m), 2), 'm'); continue
        r = fit(tid, GUESS[tid]); out[tid] = r; print(tid, json.dumps(r), flush=True)
        json.dump(out, open(out_p, 'w'), indent=1)
