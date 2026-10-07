# Mockup only: Monaco's place on the Earth. Its land (the town's buildings) does not give the road's heights, so the lap is fitted to
# the harbour instead: the quay sections (Nouvelle Chicane, Tabac, Piscine, Rascasse) a few tens of metres from the water and never in
# it, the tunnel along the coast, Casino Square by the casino and the hairpin by the Fairmont (ESA WorldCover water, published coordinates).
import json, math, numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from geo_lib import *
B = (43.722, 7.400, 43.752, 7.450); W, H = 2000, 1200   # ~2 m per pixel
lc = landcover(B[0], B[1], B[2], B[3], W, H)
water = lc == 80
mpx = (B[2] - B[0]) * 111150 / H
dist = ndimage.distance_transform_edt(~water) * mpx   # metres to the nearest water
T = track('monaco'); P = np.array(T['pts']); n = len(P)
names = {'Sainte Dévote': (-1.8, 3.8), 'Casino': (728.1, -193.8), 'Fairmont': (948.4, -166.7), 'Portier': (1050.4, -232), 'Nouvelle Chicane': (511.1, 53.9), 'Tabac': (101.7, 68.8), 'Piscine': (21.2, 199.4), 'Rascasse': (41.2, 448.2), 'Noghes': (-64.8, 458.5)}
idx = {k: int(np.argmin(np.hypot(P[:, 0] - v[0], P[:, 1] - v[1]))) for k, v in names.items()}
print({k: round(v / n, 3) for k, v in idx.items()})
def seg(a, b): return np.arange(idx[a], idx[b] + 1) if idx[a] <= idx[b] else np.r_[np.arange(idx[a], n), np.arange(0, idx[b] + 1)]
quay = np.r_[seg('Nouvelle Chicane', 'Rascasse')]
tun = np.arange(int(0.5337 * n), int(0.6347 * n))
land = np.setdiff1d(np.arange(n), tun)
L = {'casino': (43.73944, 7.42889), 'fairmont': (43.73994, 7.42987)}
def to_px(la, lo): return ((lo - B[1]) / (B[3] - B[1]) * W, (B[2] - la) / (B[2] - B[0]) * H)
def cost(lat0, lon0, rot):
    G = Geo(lat0, lon0, rot); la, lo = G.to_ll(P[:, 0], P[:, 1]); x, y = to_px(la, lo)
    xi = np.clip(x.astype(int), 0, W - 1); yi = np.clip(y.astype(int), 0, H - 1)
    dw = dist[yi, xi]
    c = np.mean(dw[land] < 4) * 40                      # the road on the water
    c += np.mean(np.clip(dw[quay] - 40, 0, None) ** 2) / 400   # the quay sections away from the water
    c += np.mean(np.clip(dw[tun] - 70, 0, None) ** 2) / 900    # the tunnel inland from the coast
    for k, (a, b) in (('Casino', L['casino']), ('Fairmont', L['fairmont'])):
        i = idx[k]; dd = haversine(float(la[i]), float(lo[i]), a, b); c += (max(0, dd - 60) / 80) ** 2
    return c
g0 = (43.7375, 7.42083); M, N = radii(g0[0]); best = (1e9,)
for rot in np.arange(-12, 12.01, 1):
    for dx in np.arange(-400, 401, 20):
        for dz in np.arange(-400, 401, 20):
            la0 = g0[0] - math.degrees(dz / M); lo0 = g0[1] + math.degrees(dx / (N * math.cos(math.radians(g0[0]))))
            c = cost(la0, lo0, rot)
            if c < best[0]: best = (c, la0, lo0, rot)
for step, rs in ((4, 0.25), (1, 0.05)):
    c0, la_, lo_, r_ = best
    for rot in np.arange(r_ - 8 * rs, r_ + 8 * rs + 1e-9, rs):
        for dx in np.arange(-10 * step, 10 * step + 0.1, step):
            for dz in np.arange(-10 * step, 10 * step + 0.1, step):
                la0 = la_ - math.degrees(dz / M); lo0 = lo_ + math.degrees(dx / (N * math.cos(math.radians(la_))))
                c = cost(la0, lo0, rot)
                if c < best[0]: best = (c, la0, lo0, rot)
c, lat0, lon0, rot = best
print('best', round(c, 3), round(lat0, 6), round(lon0, 6), round(rot, 2))
G = Geo(lat0, lon0, rot); la, lo = G.to_ll(P[:, 0], P[:, 1])
img = Image.fromarray(lc_rgb(lc)); d = ImageDraw.Draw(img)
xy = list(zip(*to_px(la, lo))); d.line(xy + [xy[0]], fill=(255, 30, 30), width=4)
for i in tun: x, y = xy[i]; d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 255, 255))
for k, (a, b) in L.items(): x, y = to_px(a, b); d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 230, 0))
for k, i in idx.items(): x, y = xy[i]; d.text((x + 6, y - 6), k, fill=(0, 0, 0))
img.crop((500, 200, 1500, 1000)).save('raw/geo/monaco_fit.png')
m = json.load(open('raw/geo/match.json')); m['monaco'] = {'lat0': round(lat0, 6), 'lon0': round(lon0, 6), 'rot': round(float(rot), 2), 'offset': 0, 'how': 'harbour + landmarks'}
json.dump(m, open('raw/geo/match.json', 'w'), indent=1)
