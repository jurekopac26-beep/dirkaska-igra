# Santo Antão, Zelenortski otoki: the tree crowns by the road from the canopy height model (Meta and World Resources Institute, High Resolution
# Canopy Height Maps, CC BY 4.0: about 1 m pixels, the trees' top heights), for the trees by the road at their real places and heights (as
# tools/silkeborg/krosnje.py for Silkeborg; tools/proga-podatki.py's chm.png has the model's mean over 10 m cells, which mixes a cell's cover
# and its trees' height).
#   python3 -I tools/santoantao/krosnje.py   -> tools/santoantao/krosnje.png and krosnje.json (8 m cells over the road and 272 m round it, in the
#                                               frame of santoantao.json) and the crowns (def.ch, within 280 m of the line, in the game's frame:
#                                               build.py's start line) in js/tracks/santoantao.js, between »krošnje (tools/santoantao/krosnje.py)«
#                                               and »konec krošenj« (before build.py's data block, which it leaves as it is); read by
#                                               js/world-santoantao.js
#   python3 -I tools/santoantao/krosnje.py --zapisi   -> only the block in js/tracks/santoantao.js, from the committed krosnje.png (no download)
# Needs rasterio (reads the model's 1.2 m tiles straight from its public bucket, only the window round the road) and scipy (build.py's line).
import json, math, os, re, sys, warnings
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build as B   # (the frame, the line and the start line as build.py has them)

J = B.J; LINE = np.array(J['line'], float).reshape(-1, 2)
M, C, SUB, TH, NEAR = 272, 8, 0.5, 3, 280   # the margin round the road, the cell, the sampling step, a tree's least height (m), the crowns kept
la = math.radians(J['lat0']); Mr, Nr = B.radii(J['lat0'])
A64 = B.A64

def lonlat(X, Z): return J['lon0'] + np.degrees(X / (Nr * math.cos(la))), J['lat0'] - np.degrees(Z / Mr)   # (build.py's xz inverted)

def tile_url(lat, lon):   # the model's tiles: level-9 quadkeys of Web Mercator
    n = 512; x = int((lon + 180) / 360 * n); r = math.radians(lat); y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)
    q = ''.join(str((1 if x >> (8 - i) & 1 else 0) + (2 if y >> (8 - i) & 1 else 0)) for i in range(9))
    return 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/%s.tif' % q

def origin():   # build.py main's line on 1 m samples and its start line (the game's origin)
    x, z, s, u = B.resample(LINE[:, 0], LINE[:, 1], 1.0, np.arange(len(LINE)) * J['step'])
    x = B.gaussian_filter1d(x, 1.5, mode='nearest'); z = B.gaussian_filter1d(z, 1.5, mode='nearest')
    x, z, s, u = B.resample(x, z, 1.0, u)
    S0 = B.xz(B.CFG['route'][1][0], B.CFG['route'][1][1]); i0 = int(np.argmin(np.hypot(x - S0[0], z - S0[1])))
    ox, oz = float(x[i0]), float(z[i0])
    pts = json.loads(re.search(r'\n    points: (\[\[.*?\]\]),\n', open(B.TRACK).read()).group(1))   # (the check: the track's points are this line's)
    assert all(abs(px - round(float(x[i * 5]) - ox, 2)) < 0.011 and abs(pz - round(float(z[i * 5]) - oz, 2)) < 0.011 for i, (px, pz) in enumerate(pts[:-1])), 'not build.py\'s line'
    return ox, oz, np.c_[x - ox, z - oz]

def sample():
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform
    x0 = math.floor((LINE[:, 0].min() - M) / C) * C; z0 = math.floor((LINE[:, 1].min() - M) / C) * C
    nx = int(math.ceil((LINE[:, 0].max() + M - x0) / C)); nz = int(math.ceil((LINE[:, 1].max() + M - z0) / C))
    lo_a, la_a = lonlat(x0, z0 + nz * C); lo_b, la_b = lonlat(x0 + nx * C, z0)
    k = int(C / SUB); X, Z = np.meshgrid(x0 + (np.arange(nx * k) + 0.5) * SUB, z0 + (np.arange(nz * k) + 0.5) * SUB)
    lon, lat = lonlat(X, Z); mx, my = transform('EPSG:4326', 'EPSG:3857', lon.ravel(), lat.ravel()); mx = np.array(mx); my = np.array(my)
    urls = sorted({tile_url(lt, lo) for lo in (lo_a, lo_b) for lt in (la_a, la_b)}); S = np.zeros(mx.size, np.float32); done = np.zeros(mx.size, bool)
    for url in urls:   # (each sample from its own tile, should the window cross into another)
        with rasterio.open(url) as src:
            L, Bo, R, Tp = src.bounds; ins = (mx >= L) & (mx < R) & (my > Bo) & (my <= Tp) & ~done
            if not ins.any(): continue
            win = from_bounds(max(mx[ins].min() - 5, L), max(my[ins].min() - 5, Bo), min(mx[ins].max() + 5, R), min(my[ins].max() + 5, Tp), src.transform)
            win = win.round_offsets().round_lengths(); A = src.read(1, window=win); T = src.window_transform(win)
        col, row = ~T * (mx[ins], my[ins])
        S[ins] = A[np.clip(np.floor(row).astype(int), 0, A.shape[0] - 1), np.clip(np.floor(col).astype(int), 0, A.shape[1] - 1)]; done |= ins
    assert done.all(); S = S.reshape(X.shape); S[S > 60] = 0   # (as tools/proga-podatki.py: the model's no-data)
    Bk = S.reshape(nz, k, nx, k).transpose(0, 2, 1, 3).reshape(nz, nx, k * k)   # the samples of each cell
    tree = Bk >= TH; cov = tree.mean(2); low = ((Bk >= 1) & ~tree).mean(2)   # (1-3 m: young trees, shrubs, the cane in the fields; and the model's noise)
    with np.errstate(all='ignore'), warnings.catch_warnings():
        warnings.simplefilter('ignore'); top = np.nan_to_num(np.nanpercentile(np.where(tree, Bk, np.nan), 90, axis=2))
    img = np.stack([np.clip(np.round(top), 0, 255), np.round(cov * 100), np.round(low * 100)], 2).astype(np.uint8)
    Image.fromarray(img, 'RGB').save(os.path.join(HERE, 'krosnje.png'), optimize=True)
    meta = dict(file='krosnje.png', x0=x0, z0=z0, nx=nx, nz=nz, cell=C, urls=urls,
                enc='R: the top height (the 90th percentile of the samples of %d m or more, m; 0 = none), G: the cover (the share of those samples, %%), B: the share of the samples of 1-%d m (%%); row 0 = z0 (north), col 0 = x0 (west), the frame of santoantao.json' % (TH, TH),
                what='Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0), sampled every %.1f m' % SUB)
    json.dump(meta, open(os.path.join(HERE, 'krosnje.json'), 'w'), indent=1)
    print('cells %d x %d (%d m), x0 %d z0 %d; with trees %.1f %%, cover %.1f %%; tops: median %.0f m, p90 %.0f m, max %.0f m' % (
        nx, nz, C, x0, z0, 100 * (cov >= 0.1).mean(), 100 * cov.mean(), np.median(top[cov >= 0.1]), np.percentile(top[cov >= 0.1], 90), top.max()))

def rle_ch(top, cov):   # as tools/silkeborg/build.py: c < 36 a cell with crowns (its top 4 + 2 (c % 12) m, its cover's level c // 12: 0 sparse
    out = []; z = 0     # (under 35 %), 1 half (under 65 %), 2 closed), c >= 36 c - 35 cells without (under 10 % cover or under 3 m)
    def flush():
        nonlocal z
        while z > 0: r = min(z, 28); out.append(A64[35 + r]); z -= r
    for t, c in zip(top.ravel(), cov.ravel()):
        if c < 10 or t < TH: z += 1; continue
        flush(); lv = 0 if c < 35 else 1 if c < 65 else 2; h = min(11, max(0, int(round((t - 4) / 2)))); out.append(A64[lv * 12 + h])
    flush(); return ''.join(out)

def write():
    kj = json.load(open(os.path.join(HERE, 'krosnje.json'))); ka = np.asarray(Image.open(os.path.join(HERE, kj['file']))).astype(int); kc = kj['cell']
    ox, oz, P = origin()
    KX, KZ = np.meshgrid(kj['x0'] + (np.arange(kj['nx']) + 0.5) * kc - ox, kj['z0'] + (np.arange(kj['nz']) + 0.5) * kc - oz)
    out = (B.cKDTree(P).query(np.c_[KX.ravel(), KZ.ravel()])[0] > NEAR).reshape(KX.shape)
    top, cov = np.where(out, 0, ka[..., 0]), np.where(out, 0, ka[..., 1])
    ch = dict(x0=round(kj['x0'] - ox, 2), z0=round(kj['z0'] - oz, 2), nx=kj['nx'], nz=kj['nz'], cell=kc, rle=rle_ch(top, cov))
    A, E = '    // ---- krošnje (tools/santoantao/krosnje.py) ----\n', '    // ---- konec krošenj ----\n'
    blk = A + '    ch: %s,\n' % B.jsval(ch) + E
    src = open(B.TRACK).read()
    if A in src: i, j = src.index(A), src.index(E) + len(E)
    else: i = j = src.index('    // ---- podatki (tools/santoantao/build.py) ----\n')
    src = src[:i] + blk + src[j:]; open(B.TRACK, 'w').write(src)
    n = ((cov >= 10) & (top >= TH)).sum()
    print('origin %.2f %.2f; crowns within %d m: %d cells (%.0f %% sparse, %.0f %% half, %.0f %% closed), %d chars' % (
        ox, oz, NEAR, n, 100 * ((cov >= 10) & (cov < 35) & (top >= TH)).sum() / max(n, 1), 100 * ((cov >= 35) & (cov < 65) & (top >= TH)).sum() / max(n, 1),
        100 * ((cov >= 65) & (top >= TH)).sum() / max(n, 1), len(ch['rle'])))

if __name__ == '__main__':
    if '--zapisi' not in sys.argv: sample()   # (--zapisi: only the block, from the committed krosnje.png)
    write()
