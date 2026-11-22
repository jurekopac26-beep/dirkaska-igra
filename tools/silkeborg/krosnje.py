# Silkeborg, Danska: the tree crowns round the circuit from the canopy height model (Meta and World Resources Institute, High Resolution
# Canopy Height Maps, CC BY 4.0: about 1 m pixels, the trees' top heights), for the trees by the track at their real places and heights.
#   python3 -I tools/silkeborg/krosnje.py   -> tools/silkeborg/krosnje.png and krosnje.json (8 m cells over the lap and 272 m round it)
# Then python3 -I tools/silkeborg/build.py puts them in the track file (def.sk.ch, read by js/world-silkeborg.js). Needs rasterio (reads the
# model's 1.2 m tiles straight from its public bucket, only the window round the circuit).
import json, math, os, warnings
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'silkeborg.json')))
LINE = np.array(J['line'], float).reshape(-1, 2)
M, C, SUB, TH = 272, 8, 0.5, 3   # the margin round the lap (the builder's trees go 260 m out, jittered), the cell, the sampling step, a tree's least height (m)
la = math.radians(J['lat0']); a = 6378137.0; e2 = 6.69437999014e-3
Mr = a * (1 - e2) / (1 - e2 * math.sin(la) ** 2) ** 1.5; Nr = a / math.sqrt(1 - e2 * math.sin(la) ** 2)

def lonlat(X, Z): return J['lon0'] + np.degrees(X / (Nr * math.cos(la))), J['lat0'] - np.degrees(Z / Mr)

def tile_url(lat, lon):   # the model's tiles: level-9 quadkeys of Web Mercator
    n = 512; x = int((lon + 180) / 360 * n); r = math.radians(lat); y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)
    q = ''.join(str((1 if x >> (8 - i) & 1 else 0) + (2 if y >> (8 - i) & 1 else 0)) for i in range(9))
    return 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/%s.tif' % q

def main():
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds, transform
    x0 = math.floor((LINE[:, 0].min() - M) / C) * C; z0 = math.floor((LINE[:, 1].min() - M) / C) * C
    nx = int(math.ceil((LINE[:, 0].max() + M - x0) / C)); nz = int(math.ceil((LINE[:, 1].max() + M - z0) / C))
    lo_a, la_a = lonlat(x0, z0 + nz * C); lo_b, la_b = lonlat(x0 + nx * C, z0)
    k = int(C / SUB); X, Z = np.meshgrid(x0 + (np.arange(nx * k) + 0.5) * SUB, z0 + (np.arange(nz * k) + 0.5) * SUB)
    lon, lat = lonlat(X, Z); mx, my = transform('EPSG:4326', 'EPSG:3857', lon.ravel(), lat.ravel()); mx = np.array(mx); my = np.array(my)
    urls = sorted({tile_url(lt, lo) for lo in (lo_a, lo_b) for lt in (la_a, la_b)}); S = np.zeros(mx.size, np.float32); done = np.zeros(mx.size, bool)
    for url in urls:   # (the window crosses into the tile to the south: each sample from its own tile)
        with rasterio.open(url) as src:
            L, Bo, R, Tp = src.bounds; ins = (mx >= L) & (mx < R) & (my > Bo) & (my <= Tp) & ~done
            if not ins.any(): continue
            win = from_bounds(max(mx[ins].min() - 5, L), max(my[ins].min() - 5, Bo), min(mx[ins].max() + 5, R), min(my[ins].max() + 5, Tp), src.transform)
            win = win.round_offsets().round_lengths(); A = src.read(1, window=win); T = src.window_transform(win)
        col, row = ~T * (mx[ins], my[ins])
        S[ins] = A[np.clip(np.floor(row).astype(int), 0, A.shape[0] - 1), np.clip(np.floor(col).astype(int), 0, A.shape[1] - 1)]; done |= ins
    assert done.all(); S = S.reshape(X.shape)
    B = S.reshape(nz, k, nx, k).transpose(0, 2, 1, 3).reshape(nz, nx, k * k)   # the samples of each cell
    tree = B >= TH; cov = tree.mean(2); low = ((B >= 1) & ~tree).mean(2)   # (1-3 m: young trees, bushes, the tall heather; and the model's noise)
    with np.errstate(all='ignore'), warnings.catch_warnings():
        warnings.simplefilter('ignore'); top = np.nan_to_num(np.nanpercentile(np.where(tree, B, np.nan), 90, axis=2))
    img = np.stack([np.clip(np.round(top), 0, 255), np.round(cov * 100), np.round(low * 100)], 2).astype(np.uint8)
    Image.fromarray(img, 'RGB').save(os.path.join(HERE, 'krosnje.png'), optimize=True)
    meta = dict(file='krosnje.png', x0=x0, z0=z0, nx=nx, nz=nz, cell=C, urls=urls,
                enc='R: the top height (the 90th percentile of the samples of %d m or more, m; 0 = none), G: the cover (the share of those samples, %%), B: the share of the samples of 1-%d m (%%); row 0 = z0 (north), col 0 = x0 (west)' % (TH, TH),
                what='Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0), sampled every %.1f m' % SUB)
    json.dump(meta, open(os.path.join(HERE, 'krosnje.json'), 'w'), indent=1)
    print('cells %d x %d (%d m), x0 %d z0 %d; with trees %.1f %%, cover %.1f %%; tops: median %.0f m, p90 %.0f m, max %.0f m' % (
        nx, nz, C, x0, z0, 100 * (cov >= 0.1).mean(), 100 * cov.mean(), np.median(top[cov >= 0.1]), np.percentile(top[cov >= 0.1], 90), top.max()))

if __name__ == '__main__':
    main()
