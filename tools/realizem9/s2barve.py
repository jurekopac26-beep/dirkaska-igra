# Barve tal ob progi iz enega posnetka Sentinel-2 L2A po razredih ESA WorldCover (mediana, četrtini), kot barve igre (gama 1/2.2).
# Vir vrednosti v js/world-realizem9.js (Cusco, Isalo). Uporaba (iz korena repozitorija):
#   python3 -I tools/realizem9/s2barve.py <mapa za predpomnilnik> tools/cusco/config.json sentinel-s2-l2a-cogs/18/L/ZL/2025/7/S2A_18LZL_20250704_0_L2A/ 600
#   python3 -I tools/realizem9/s2barve.py <mapa za predpomnilnik> tools/isalo/config.json sentinel-s2-l2a-cogs/38/K/NV/2025/8/S2C_38KNV_20250810_0_L2A/ 120   (in 900: drevesa, gola tla)
# Zadnji argument: do katere razdalje od ceste (m) se vzorči. Contains modified Copernicus Sentinel data (2025); ESA WorldCover 2021 (CC BY 4.0).
import sys, os, json, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'proga'))
import numpy as np, lib
lib.RAW = sys.argv[1]; os.makedirs(lib.RAW, exist_ok=True)
C = json.load(open(sys.argv[2])); pre = sys.argv[3]; dmax = float(sys.argv[4]) if len(sys.argv) > 4 else 120
R = np.array([[p[0], p[1]] for p in C['route']], float)
la0 = R[:, 0].mean(); my = 111132.0; mx = 111320.0 * math.cos(math.radians(la0))
xy = np.stack([(R[:, 1] - R[0, 1]) * mx, (R[:, 0] - R[0, 0]) * my], -1)
pts = []
for a, b in zip(xy[:-1], xy[1:]):
    L = np.hypot(*(b - a)); n = max(1, int(L / 5))
    for t in np.arange(n) / n: pts.append(a + (b - a) * t)
pts = np.array(pts); tang = np.gradient(pts, axis=0); tang /= np.linalg.norm(tang, axis=1, keepdims=True); nor = np.stack([-tang[:, 1], tang[:, 0]], -1)
S = []
for o in np.arange(6, dmax + 1, 6):
    for sg in (-1, 1): S.append(pts + nor * o * sg)
S = np.concatenate(S); D = np.repeat(np.arange(6, dmax + 1, 6), 2 * len(pts))
# (keep only the samples whose nearest route point is the one they came from: not across a hairpin onto the road)
dd = np.min(np.hypot(S[:, None, 0] - pts[None, :, 0], S[:, None, 1] - pts[None, :, 1]), axis=1)
ok = dd > 5.5
lat = R[0, 0] + S[ok, 1] / my; lon = R[0, 1] + S[ok, 0] / mx; D = D[ok]
print('route', len(pts) * 5, 'm, samples', ok.sum())
j = json.loads(lib.fetch(lib.S2 + pre + pre.split('/')[-2] + '.json', 's2/' + pre.split('/')[-2] + '.json'))
txt = json.dumps(j); print('offset keys:', [k for k in ['boa_add_offset', 'boa_offset_applied', '"offset"'] if k in txt], j['properties'].get('s2:processing_baseline'))
B = np.stack([lib.s2_band(pre, b, lat, lon) for b in ['B04', 'B03', 'B02']], -1)
scl = lib.s2_band(pre, 'SCL', lat, lon)
print('B02 DN p1/p50:', np.percentile(B[:, 2], 1), np.percentile(B[:, 2], 50), ' SCL counts', {int(k): int((scl == k).sum()) for k in np.unique(scl)})
off = 1000.0 if np.percentile(B[:, 2], 0.5) > 900 else 0.0
rf = (B - off) / 10000.0
wc = lib.worldcover(lat, lon)
good = np.isin(scl, [4, 5])
g = lambda v: np.clip(v, 0, 1) ** (1 / 2.2)
print('offset used', off)
allm = np.median(rf[good], axis=0); print('ALL  n=%5d refl %s  game %s' % (good.sum(), np.round(allm, 4), np.round(g(allm), 3)))
for k in sorted(np.unique(wc)):
    m = good & (wc == k)
    if m.sum() < 20: continue
    md = np.median(rf[m], axis=0); q1 = np.percentile(rf[m], 25, axis=0); q3 = np.percentile(rf[m], 75, axis=0)
    near = m & (D <= 30)
    print('wc %3d n=%5d (<=30 m: %4d) refl %s  game %s  q1 %s q3 %s' % (k, m.sum(), near.sum(), np.round(md, 4), np.round(g(md), 3), np.round(g(q1), 3), np.round(g(q3), 3)))
# the reddest of the grassland (the red earth where the grass is thin): the share and the colour
m = good & (wc == 30)
if m.sum() > 100:
    rg = rf[m][:, 0] / np.maximum(rf[m][:, 1], 1e-4)
    print('grass R/G linear p50 %.3f p90 %.3f p97 %.3f' % tuple(np.percentile(rg, [50, 90, 97])))
    for t in (1.5, 1.6, 1.7):
        sel = rg > t; print('  R/G>%.1f share %.3f  game %s' % (t, sel.mean(), np.round(g(np.median(rf[m][sel], axis=0)), 3) if sel.sum() else '-'))
