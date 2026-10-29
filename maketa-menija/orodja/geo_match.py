# Mockup only: where each real track lies on the Earth. The game's worlds are flat (x east, z south, metres from an origin) with the
# road's real heights, so the place and turn that make the real land's heights along the road (geo_lib.DEM) follow the game's own
# heights best are the world's place. A coarse search round a first guess (from the circuit's published coordinates), then a fine one.
# Usage: python3 geo_match.py [vrsic,spa]  -> raw/geo/match.json (lat0, lon0, rot, the height offset, the fit)
import json, math, os, sys
import numpy as np
from geo_lib import DEM, CopDEM, Geo, RAW, track, radii

# first guesses: the origin of each world (lat, lon) and how far round it to look (m)
GUESS = {
    'vrsic': (46.4865, 13.7880, 1500),      # the junction in Kranjska Gora (the pass: 46.4356, 13.7444)
    'monaco': (43.7372, 7.4212, 700),       # Sainte-Devote
    'rbring': (47.2197, 14.7647, 1500),     # the start / finish line
    'suzuka': (34.8431, 136.5406, 1500),
    'spa': (50.4372, 5.9714, 1500),
    'nring': (50.3397, 6.9496, 2000),       # T13
    # (the later tracks: a known point of the road, 'start' or 'finish' of the race, or the world's 'origin', and how far round it to look;
    # their worlds are OpenStreetMap's projected lines, x east and z south, so the first guess of the turn is 0)
    'caracoles': ('finish', -32.8357, -70.1296, 4000),   # Portillo, by the Laguna del Inca
    'katu': ('start', 50.9128, 88.2050, 4000),           # the plateau road above the canyon
    'harju': ('origin', 62.243, 25.745, 400),            # (the track file's origin)
    'chapman': ('start', -34.0487, 18.3619, 1500),       # the end of Main Road in Hout Bay
    'bigsur': ('finish', 36.3600, -121.9010, 2500),      # Hurricane Point
    'tianmen': ('finish', 29.0495, 110.4826, 3000),      # the platform under the cave
    'uncompahgre': ('start', 38.0080, -107.6631, 800),
    'rastro': ('start', -28.395, -49.544, 1200),            # the road in the rainforest under the hairpins (docs/proge)
    'moki': ('start', 37.236, -109.932, 3500),              # past the junction with the Valley of the Gods Road
    'maunakea': ('finish', 19.8230, -155.4730, 2500),       # the end of the asphalt on the summit ridge
    'baldy': ('start', 34.2362, -117.6596, 800),            # past the junction of Glendora Ridge Road
}
COP = {'tianmen', 'rastro'}   # (matched on Copernicus DEM, the heights' own source: the terrain tiles have smoothed its cliffs)
SKIP = {'monaco': [(0.52, 0.65)]}   # parts of the lap whose road is not on the land (the tunnel)

def origin_guess(T, g):   # a guess given at the race's start or finish: the world's origin that puts that point there (no turn)
    if not isinstance(g[0], str): return g
    at, lat, lon, R = g
    if at == 'origin': return (lat, lon, R)
    P = np.array(T['pts'], dtype=np.float64); n = len(P); si = min(n - 1, int(round(T['startS'] / T['step']))); fi = min(n - 1, int(round(T['finishS'] / T['step']))) if T['open'] else si
    x, z = P[si if at == 'start' else fi, :2]; M, N = radii(lat)
    return (lat + math.degrees(z / M), lon - math.degrees(x / (N * math.cos(math.radians(lat)))), R)

def fit(T, g0, R, z=13, coarse=30, rots=np.arange(-3, 3.01, 0.5)):
    coarse = max(coarse, R / 60)   # (a wide search: coarser first)
    P = np.array(T['pts'], dtype=np.float64); x, zz, y = P[:, 0], P[:, 1], P[:, 2]
    keep = np.ones(len(P), bool); n = len(P)
    for a, b in SKIP.get(T['id'], []): keep[int(a * n):int(b * n)] = False
    x, zz, y = x[keep], zz[keep], y[keep]
    ext = max(np.abs(x).max(), np.abs(zz).max()) + R + 400
    M, N = radii(g0[0]); dlat = math.degrees(ext / M); dlon = math.degrees(ext / (N * math.cos(math.radians(g0[0]))))
    dem = (CopDEM if T['id'] in COP else DEM)(g0[0] - dlat, g0[1] - dlon, g0[0] + dlat, g0[1] + dlon, z)
    def score(lat0, lon0, rot):
        G = Geo(lat0, lon0, rot); la, lo = G.to_ll(x, zz); h = dem.sample(la, lo); d = h - y; c = np.median(d)
        return np.mean(np.abs(d - c)), c
    best = (1e9, 0, 0, 0, 0)
    for rot in rots:
        for dx in np.arange(-R, R + 0.1, coarse):
            for dz in np.arange(-R, R + 0.1, coarse):
                lat0 = g0[0] - math.degrees(dz / M); lon0 = g0[1] + math.degrees(dx / (N * math.cos(math.radians(g0[0]))))
                s, c = score(lat0, lon0, rot)
                if s < best[0]: best = (s, lat0, lon0, rot, c)
    # fine: 5 m and 0.1 degree round the best, then 1 m and 0.02
    for step, rstep, span in ((5, 0.1, 3), (1, 0.02, 3)):
        s0, la0, lo0, r0, c0 = best
        for rot in np.arange(r0 - span * rstep * 3, r0 + span * rstep * 3 + 1e-9, rstep):
            for dx in np.arange(-span * step * 6, span * step * 6 + 0.1, step):
                for dz in np.arange(-span * step * 6, span * step * 6 + 0.1, step):
                    lat0 = la0 - math.degrees(dz / M); lon0 = lo0 + math.degrees(dx / (N * math.cos(math.radians(la0))))
                    s, c = score(lat0, lon0, rot)
                    if s < best[0]: best = (s, lat0, lon0, rot, c)
    s, lat0, lon0, rot, c = best
    G = Geo(lat0, lon0, rot); la, lo = G.to_ll(x, zz); d = dem.sample(la, lo) - y - c
    # how sharp the fit is: the score 100 m away in each direction
    return { 'lat0': round(lat0, 6), 'lon0': round(lon0, 6), 'rot': round(rot, 2), 'offset': round(float(c), 1), 'mad': round(float(s), 2),
             'p90': round(float(np.percentile(np.abs(d), 90)), 1), 'range': round(float(y.max() - y.min()), 1),
             'moved': round(math.hypot((lat0 - g0[0]) * M * math.pi / 180, (lon0 - g0[1]) * N * math.cos(math.radians(g0[0])) * math.pi / 180), 1),
             'away100': round(float(np.mean([score(lat0 + a * 100 / M * 180 / math.pi, lon0 + b * 100 / (N * math.cos(math.radians(lat0))) * 180 / math.pi, rot)[0] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))])), 2) }

out_p = os.path.join(RAW, 'match.json')
out = json.load(open(out_p)) if os.path.exists(out_p) else {}
ids = sys.argv[1].split(',') if len(sys.argv) > 1 else list(GUESS)
for tid in ids:
    T = track(tid); g = origin_guess(T, GUESS[tid])
    r = fit(T, g[:2], g[2])
    out[tid] = r; print(tid, json.dumps(r), flush=True)
    json.dump(out, open(out_p, 'w'), indent=1)
