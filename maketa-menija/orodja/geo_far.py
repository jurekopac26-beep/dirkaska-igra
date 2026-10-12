# Mockup only: the real land round a real track's game world, in the world's own coordinates (x east, z south, metres; y the game's
# height: the real height less the world's offset) -> raw/geo/<track>-far.json: a grid of heights and of land cover (WorldCover
# classes) for drone_page.js, which builds it as low land round the world's own strip (the drone's high shots and the arrival from
# the globe see the real mountains round the track).
# Usage: python3 geo_far.py [vrsic,spa] [--notex]   (a made-up or shortened track: the drawn hills of routemap_page.js, under the picture of
# the real place it stands for: its land cover, without the real relief's shading)
import json, math, os, sys
import numpy as np
from PIL import Image
from geo_lib import RAW, DEM, Geo, track, landcover
from geo_paint import paint, DETAIL, SEASON

P = json.load(open(os.path.join(RAW, 'places.json')))['tracks']
ids = sys.argv[1].split(',') if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else list(P)
for tid in ids:
    t = P[tid]; T = track(tid); pts = np.array(T['pts']); G = Geo(t['lat0'], t['lon0'], t['rot'])
    if t['kind'] != 'real':   # a shortened or made-up track: the game's own drawn hills, under the picture of the real place it stands for
        cx, cz = (pts[:, 0].min() + pts[:, 0].max()) / 2, (pts[:, 1].min() + pts[:, 1].max()) / 2
        half = max(12000.0, (pts[:, 0].max() - pts[:, 0].min()) / 2 + 9000, (pts[:, 1].max() - pts[:, 1].min()) / 2 + 9000); cell = 60.0
        n = int(math.ceil(2 * half / cell)); x0, z0 = cx - half, cz - half
        X, Z = np.meshgrid(x0 + np.arange(n + 1) * cell, z0 + np.arange(n + 1) * cell); la, lo = G.to_ll(X, Z)
        box = (float(la.min()), float(lo.min()), float(la.max()), float(lo.max()))
        img, _, _ = paint(box, 4096, DETAIL, 13, zfac=1.0, detail=1.0, lc_res=2600, seed=5, season=SEASON.get(tid), relief=0.0)   # (no shading: the hills are not the real ones)
        Image.fromarray(img).save(os.path.join(RAW, tid + '-far.webp'), 'WEBP', quality=86, method=4)
        json.dump(dict(x0=round(x0, 1), z0=round(z0, 1), cell=cell, nx=n, nz=n, tex='raw/geo/%s-far.webp' % tid, ll=[round(v, 6) for v in box], geo=[t['lat0'], t['lon0'], t['rot']], synth=True),
                  open(os.path.join(RAW, tid + '-far.json'), 'w'), separators=(',', ':'))
        print(tid, 'drawn hills under the real place\'s picture', n + 1, 'x', n + 1, flush=True); continue
    cx, cz = (pts[:, 0].min() + pts[:, 0].max()) / 2, (pts[:, 1].min() + pts[:, 1].max()) / 2
    half = max(12000.0, (pts[:, 0].max() - pts[:, 0].min()) / 2 + 9000, (pts[:, 1].max() - pts[:, 1].min()) / 2 + 9000)
    cell = 60.0 if half <= 13000 else 80.0
    n = int(math.ceil(2 * half / cell)); x0, z0 = cx - half, cz - half
    xs = x0 + np.arange(n + 1) * cell; zs = z0 + np.arange(n + 1) * cell; X, Z = np.meshgrid(xs, zs)
    la, lo = G.to_ll(X, Z)
    dem = DEM(la.min() - 0.01, lo.min() - 0.01, la.max() + 0.01, lo.max() + 0.01, 13)
    h = dem.sample(la, lo) - t['offset']
    # land cover: the classes on a lat/lon grid over the same box, looked up at each node
    W = int((lo.max() - lo.min()) * 111320 * math.cos(math.radians(la.mean())) / 20); H = int((la.max() - la.min()) * 111320 / 20)
    lc = landcover(la.min(), lo.min(), la.max(), lo.max(), W, H)
    ci = np.clip(((lo - lo.min()) / (lo.max() - lo.min()) * W).astype(int), 0, W - 1); ri = np.clip(((la.max() - la) / (la.max() - la.min()) * H).astype(int), 0, H - 1)
    # each node's class: the most common within its cell (a 3 x 3 look round it on the 20 m grid)
    cls = np.zeros_like(ci, dtype=np.uint8); votes = {}
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            v = lc[np.clip(ri + dy, 0, H - 1), np.clip(ci + dx, 0, W - 1)]
            for k in np.unique(v): votes.setdefault(int(k), np.zeros(v.shape, np.int16)); votes[int(k)] += (v == k)
    ks = sorted(votes); cls = np.array(ks, np.uint8)[np.argmax(np.stack([votes[k] for k in ks]), axis=0)]
    out = dict(x0=round(x0, 1), z0=round(z0, 1), cell=cell, nx=n, nz=n, h=[round(float(v), 1) for v in h.ravel()], lc=cls.ravel().tolist())
    # its picture: the land painted as on the globe (the same colours, canopy, fields, roofs, the season), a little of the relief's
    # shading in it (the game lights it again); the page lays it on by each point's latitude and longitude (geo: the world's placing)
    if '--notex' not in sys.argv:
        box = (float(la.min()), float(lo.min()), float(la.max()), float(lo.max()))
        img, _, _ = paint(box, 4096, DETAIL, 13, zfac=1.1, detail=1.0, lc_res=2600, seed=5, season=SEASON.get(tid), relief=0.5)
        Image.fromarray(img).save(os.path.join(RAW, tid + '-far.webp'), 'WEBP', quality=86, method=4)
        out.update(tex='raw/geo/%s-far.webp' % tid, ll=[round(v, 6) for v in box], geo=[t['lat0'], t['lon0'], t['rot']])
    json.dump(out, open(os.path.join(RAW, tid + '-far.json'), 'w'), separators=(',', ':'))
    print(tid, 'far grid', n + 1, 'x', n + 1, 'cell', cell, 'h', round(float(h.min())), '..', round(float(h.max())), 'classes', {int(k): int((cls == k).sum()) for k in np.unique(cls)}, flush=True)
