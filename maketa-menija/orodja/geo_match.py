# Mockup only: where each real track lies on the Earth. The game's worlds are flat (x east, z south, metres from an origin) with the
# road's real heights, so the place and turn that make the real land's heights along the road (geo_lib.DEM) follow the game's own
# heights best are the world's place. A coarse search round a first guess (from the circuit's published coordinates), then a fine one.
# Usage: python3 geo_match.py [vrsic,spa]  -> raw/geo/match.json (lat0, lon0, rot, the height offset, the fit)
import json, math, os, sys
import numpy as np
from geo_lib import DEM, Geo, RAW, track, radii

# first guesses: the origin of each world (lat, lon) and how far round it to look (m)
GUESS = {
    'vrsic': (46.4865, 13.7880, 1500),      # the junction in Kranjska Gora (the pass: 46.4356, 13.7444)
    'monaco': (43.7372, 7.4212, 700),       # Sainte-Devote
    'rbring': (47.2197, 14.7647, 1500),     # the start / finish line
    'suzuka': (34.8431, 136.5406, 1500),
    'spa': (50.4372, 5.9714, 1500),
    'nring': (50.3397, 6.9496, 2000),       # T13
    'medvode': (46.1405, 14.4140, 1500),    # the football ground on Medvoška cesta
    'baldy': (34.2370, -117.6585, 1500),    # Mount Baldy village, by Glendora Ridge Road
    'beartooth': (45.0050, -109.4050, 2500),    # below the Rock Creek Vista
    'bigsur': (36.3880, -121.9050, 1500),   # north of the Rocky Creek Bridge
    'maunakea': (19.7950, -155.4620, 2000), # the end of the gravel above the visitor station
    'moki': (37.2700, -109.9300, 2000),     # by the Valley of the Gods Road
    'monterey': (36.58646, -121.75664, 400),   # the start / finish (OpenStreetMap)
    'mulholland': (34.1080, -118.7830, 2000),  # Cornell, by Cornell School Road
    'palomar': (33.2947, -116.8934, 1000),     # South Grade Road, 0.70 km above State Route 76 (OpenStreetMap)
    'riverside': (33.9367, -117.2726, 1500),   # the old circuit east of the town
    'uncompahgre': (38.0160, -107.6720, 1500), # above Ouray
    'iroha': (36.7345, 139.5310, 1500),        # the second Irohazaka, its lower curves (OpenStreetMap: national road 120 up from Umagaeshi)
    'greatalpine': (-37.5517, 147.8764, 400),  # where the road leaves the Tambo (its shape on the roads of OpenStreetMap)
    'hotham': (-37.0029, 147.0940, 400),       # below Mount Little Blowhard (its shape on the roads of OpenStreetMap)
    'caracoles': (-32.8630, -70.1580, 2500),   # by the Juncalillo river below the curves (from Portillo back along the road)
    'rastro': (-28.3930, -49.5390, 2500),      # below the hairpins (from the viewpoint at the top back along the road)
    'katu': (50.9100, 88.2200, 3000),          # the edge of the Ulagan plateau above the Chulyshman
    'tianmen': (29.0570, 110.4800, 2500),      # bend 54 (from the square below the cave back along the road)
}
SKIP = {'monaco': [(0.52, 0.65)]}   # parts of the lap whose road is not on the land (the tunnel)

def fit(T, g0, R, z=13, coarse=30, rots=np.arange(-3, 3.01, 0.5)):
    P = np.array(T['pts'], dtype=np.float64); x, zz, y = P[:, 0], P[:, 1], P[:, 2]
    keep = np.ones(len(P), bool); n = len(P)
    for a, b in SKIP.get(T['id'], []): keep[int(a * n):int(b * n)] = False
    x, zz, y = x[keep], zz[keep], y[keep]
    ext = max(np.abs(x).max(), np.abs(zz).max()) + R + 400
    M, N = radii(g0[0]); dlat = math.degrees(ext / M); dlon = math.degrees(ext / (N * math.cos(math.radians(g0[0]))))
    dem = DEM(g0[0] - dlat, g0[1] - dlon, g0[0] + dlat, g0[1] + dlon, z)
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
    T = track(tid); g = GUESS[tid]
    r = fit(T, g[:2], g[2])
    out[tid] = r; print(tid, json.dumps(r), flush=True)
    json.dump(out, open(out_p, 'w'), indent=1)
