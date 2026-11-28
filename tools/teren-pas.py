#!/usr/bin/env python3
"""AAA V3' (docs/grafika-aaa.md): a finer real terrain in the band +-60 m beside the road, from a public lidar model.

  python3 -I tools/teren-pas.py <id> <track.json> <tile cache dir> [--write out.json]

<track.json>: the track's def (points, dem) as JSON (node: vm-load js/tracks/<id>.js, JSON.stringify({points, dem})).
The heights: Mapterhorn's terrain tiles (tiles.mapterhorn.com, terrarium webp; the sources per area in its attribution: Wallonie MNT 2021-2022
© SPW CC BY 4.0, swissALTI3D © swisstopo OGD, Wales DTM 1m © Welsh Government / NRW OGL v3.0). Never Google Maps / Earth / Street View.

The track's frame: metres, origin = the start line (LAT0, LON0), x east, z south (tools/proga/lib.py Geo). The origin is registered against the
track's own coarse grid (def.dem) by a search of shifts: the lidar box-averaged to that grid's cell, the best match near the road.

Output (def.dem.fine): {x0, z0, cell, bx, bz, B, step, m (the blocks' mask, base64 bits), b64 (the blocks' residuals, a signed byte each, in
step metres)}: the lidar box-averaged onto a `cell` m grid minus the track's own coarse terrain (bilinear on def.dem, as the world builder),
the long waves (~LP m) taken out so the band keeps the coarse grid's level at its edge; only the B x B blocks with a node within ~90 m of the line.
"""
import sys, json, math, base64, io, os, urllib.request
import numpy as np
from PIL import Image

TRACKS = {   # approximate start line (registered below), the fine grid's cell (the terrain mesh: NR 8 m, VR 5 m), the long-wave cut (m)
    'spa': dict(lat=50.4427, lon=5.9695, cell=8, z=15),
    'pembrey': dict(lat=51.7058825, lon=-4.3238681, cell=8, z=15, reg=False),   # (the origin of tools/pembrey/pembrey.json; the flat airfield
    # gives the search no hold on GLO-30)
    'furka': dict(lat=50.0, lon=0.0, cell=5, z=15),   # (set from tools/proga/proge.json below)
}
B = 8; STEP = 0.1; LP = 48.0; KEEP = 90.0


def geo(lat0):
    a, e2 = 6378137.0, 6.69437999014e-3; s = math.sin(math.radians(lat0)); w = 1 - e2 * s * s
    return a * (1 - e2) / w ** 1.5, a / math.sqrt(w)   # M, N


def coarse_grid(D):
    """the track's coarse terrain (heights above the road's zero) as the world builder decodes it"""
    if 'tr' in D:   # VR (Furka): a 2-byte trend on f cells and 1 m residuals in each row's span
        TR = D['tr']; tb = base64.b64decode(TR['b64']); tr = np.array([TR['lo'] + (tb[2 * k] * 256 + tb[2 * k + 1]) * TR['step'] for k in range(TR['nx'] * TR['nz'])], np.float32)
        rb = base64.b64decode(D['res']); dem = np.zeros((D['nz'], D['nx']), np.float32); q = 0
        for j in range(D['nz']):
            a, n = D['rows'][j]; fj = j / TR['f']; tj = min(TR['nz'] - 2, int(fj)); v = fj - tj
            for i in range(D['nx']):
                fi = i / TR['f']; ti = min(TR['nx'] - 2, int(fi)); u = fi - ti; k0 = tj * TR['nx'] + ti
                h = (tr[k0] * (1 - u) + tr[k0 + 1] * u) * (1 - v) + (tr[k0 + TR['nx']] * (1 - u) + tr[k0 + TR['nx'] + 1] * u) * v
                if a <= i < a + n: h += rb[q] - 128; q += 1
                dem[j, i] = h - D['base']
        return dem
    b = base64.b64decode(D['b64']); base = D.get('base', 300)
    return (D['lo'] + np.frombuffer(b, np.uint8).astype(np.float32) * D['step'] - base).reshape(D['nz'], D['nx'])


def bilin(g, D, x, z):
    gx = np.clip((x - D['x0']) / D['cell'], 0, D['nx'] - 1.001); gz = np.clip((z - D['z0']) / D['cell'], 0, D['nz'] - 1.001)
    i = gx.astype(int); j = gz.astype(int); u = gx - i; v = gz - j
    return (g[j, i] * (1 - u) + g[j, i + 1] * u) * (1 - v) + (g[j + 1, i] * (1 - u) + g[j + 1, i + 1] * u) * v


class Tiles:
    def __init__(s, cache, z): s.cache = cache; s.z = z; s.mem = {}

    def tile(s, tx, ty):
        k = (tx, ty)
        if k not in s.mem:
            f = os.path.join(s.cache, f'{s.z}-{tx}-{ty}.webp')
            if not os.path.exists(f):
                req = urllib.request.Request(f'https://tiles.mapterhorn.com/{s.z}/{tx}/{ty}.webp', headers={'User-Agent': 'terrain-band-tool'})
                with urllib.request.urlopen(req, timeout=60) as r: open(f, 'wb').write(r.read())
            a = np.asarray(Image.open(f).convert('RGB')).astype(np.float64)
            s.mem[k] = (a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768).astype(np.float32)
        return s.mem[k]

    def h(s, lat, lon):   # bilinear on the tiles' pixel centres
        n = 2 ** s.z * 512; X = (lon + 180) / 360 * n - 0.5; lr = np.radians(lat); Y = (1 - np.log(np.tan(lr) + 1 / np.cos(lr)) / math.pi) / 2 * n - 0.5
        x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int); u = X - x0; v = Y - y0; out = np.zeros(X.shape)
        for dy in (0, 1):
            for dx in (0, 1):
                px = x0 + dx; py = y0 + dy; tx = px // 512; ty = py // 512; w = (u if dx else 1 - u) * (v if dy else 1 - v); val = np.zeros(X.shape)
                for key in set(zip(tx.ravel().tolist(), ty.ravel().tolist())):
                    m = (tx == key[0]) & (ty == key[1]); t = s.tile(*key); val[m] = t[py[m] - key[1] * 512, px[m] - key[0] * 512]
                out += w * val
        return out


def to_ll(x, z, lat0, lon0):
    M, N = geo(lat0)
    return lat0 - np.degrees(z / M), lon0 + np.degrees(x / (N * math.cos(math.radians(lat0))))


def seg_dist(P, x, z):   # distance of (x, z) to the polyline P (closed)
    d = np.full(x.shape, 1e9); Q = np.roll(P, -1, 0)
    for (ax, az), (bx, bz) in zip(P, Q):
        dx, dz = bx - ax, bz - az; l2 = dx * dx + dz * dz or 1; t = np.clip(((x - ax) * dx + (z - az) * dz) / l2, 0, 1)
        d = np.minimum(d, np.hypot(x - ax - dx * t, z - az - dz * t))
    return d


def box_avg(T, lat0, lon0, x, z, c, k=4):   # the lidar averaged over a c x c cell around each (x, z): k x k samples
    acc = np.zeros(x.shape)
    for a in range(k):
        for b in range(k):
            ox = (a + 0.5) / k * c - c / 2; oz = (b + 0.5) / k * c - c / 2; la, lo = to_ll(x + ox, z + oz, lat0, lon0); acc += T.h(la, lo)
    return acc / (k * k)


def main():
    tid, src, cache = sys.argv[1], sys.argv[2], sys.argv[3]; out = sys.argv[sys.argv.index('--write') + 1] if '--write' in sys.argv else None
    cfg = dict(TRACKS[tid])
    if tid == 'furka':
        pj = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proga', 'proge.json')))['furka']; cfg['lat'], cfg['lon'] = pj['pot'][1]
    d = json.load(open(src)); D = d['dem']; P = np.array(d['points'], float); g = coarse_grid(D); T = Tiles(cache, cfg['z'])
    # registration: coarse nodes within 250 m of the line, lidar box-averaged to the coarse cell, the best shift (m) on a 4 m then 1 m search
    jj, ii = np.mgrid[0:D['nz'], 0:D['nx']]; cx = D['x0'] + ii * D['cell']; cz = D['z0'] + jj * D['cell']; near = seg_dist(P, cx, cz) < 250
    cx, cz, cg = cx[near], cz[near], g[near]; sel = np.arange(cx.size)[:: max(1, cx.size // 1500)]; cx, cz, cg = cx[sel], cz[sel], cg[sel]
    lat0, lon0 = cfg['lat'], cfg['lon']; M, N = geo(lat0)

    def score(sx, sz):   # the lidar at (x + sx, z + sz) against the coarse grid: rms after taking out the mean offset
        h = np.zeros(cx.shape)
        for a in range(3):
            for b in range(3):
                la, lo = to_ll(cx + sx + (a - 1) * D['cell'] / 3, cz + sz + (b - 1) * D['cell'] / 3, lat0, lon0); h += T.h(la, lo) / 9
        r = h - cg; return float(np.sqrt(np.mean((r - np.median(r)) ** 2))), float(np.median(r))

    best = (*score(0, 0), 0, 0)
    for st, rng in (((32, 320), (8, 32), (2, 8), (0.5, 2)) if cfg.get('reg', True) else ()):
        bx, bz = best[2], best[3]
        for sx in np.arange(-rng, rng + 1e-6, st):
            for sz in np.arange(-rng, rng + 1e-6, st):
                rms, off = score(bx + sx, bz + sz)
                if rms < best[0]: best = (rms, off, bx + sx, bz + sz)
    rms, off, sx, sz = best; lat0, lon0 = to_ll(np.array(sx), np.array(sz), lat0, lon0); lat0, lon0 = float(lat0), float(lon0)
    print(f'{tid}: origin {lat0:.7f} {lon0:.7f} (shift {sx:+.1f} {sz:+.1f} m), lidar - coarse: median {off:+.2f} m, rms {rms:.2f} m')
    # the fine grid: nodes on `cell` m, blocks of B x B nodes with a node within KEEP m of the line
    c = cfg['cell']; x0 = math.floor((P[:, 0].min() - KEEP - 2 * c) / c) * c; z0 = math.floor((P[:, 1].min() - KEEP - 2 * c) / c) * c
    nbx = math.ceil((P[:, 0].max() + KEEP + 2 * c - x0) / (c * B)); nbz = math.ceil((P[:, 1].max() + KEEP + 2 * c - z0) / (c * B))
    nx, nz = nbx * B, nbz * B; jj, ii = np.mgrid[0:nz, 0:nx]; fx = x0 + ii * c; fz = z0 + jj * c; dist = seg_dist(P, fx, fz)
    mask = np.zeros((nbz, nbx), bool)
    for bj in range(nbz):
        for bi in range(nbx): mask[bj, bi] = dist[bj * B:(bj + 1) * B, bi * B:(bi + 1) * B].min() <= KEEP
    # the lidar on the fine grid (box average over the cell) where a block is kept
    keep = np.kron(mask, np.ones((B, B), bool)); fine = np.full((nz, nx), np.nan)
    la_ok = keep.copy(); fine[la_ok] = box_avg(T, lat0, lon0, fx[la_ok], fz[la_ok], c, 4)
    coarse = bilin(g, D, fx, fz); res = np.where(keep, fine - off - coarse, 0.0)
    # the long waves out (a separable Gaussian, sigma LP / 2.5 m, on the kept nodes): the band keeps the coarse grid's level at its edge
    sg = LP / 2.5 / c; R = int(3 * sg) + 1; kern = np.exp(-0.5 * (np.arange(-R, R + 1) / sg) ** 2)
    def blur(a):
        a = np.apply_along_axis(lambda v: np.convolve(v, kern, 'same'), 1, a); return np.apply_along_axis(lambda v: np.convolve(v, kern, 'same'), 0, a)
    w = blur(keep.astype(float)); lo = blur(res) / np.maximum(w, 1e-6); hp = np.where(keep, res - lo, 0.0)
    band = keep & (dist <= 60)
    print(f'  fine {c} m: {nx}x{nz} nodes, {int(mask.sum())} of {nbx * nbz} blocks; in the band: residual rms {np.sqrt(np.mean(res[band] ** 2)):.2f} m '
          f'(mean {res[band].mean():+.2f}), after the long waves out rms {np.sqrt(np.mean(hp[band] ** 2)):.2f} m, |max| {np.abs(hp[band]).max():.1f} m')
    q = np.clip(np.round(hp / STEP), -127, 127).astype(int) + 128
    blocks = bytearray()
    for bj in range(nbz):
        for bi in range(nbx):
            if mask[bj, bi]: blocks += bytes(q[bj * B:(bj + 1) * B, bi * B:(bi + 1) * B].astype(np.uint8).ravel().tolist())
    bits = np.packbits(mask.ravel(), bitorder='little').tobytes()
    o = dict(x0=x0, z0=z0, cell=c, bx=nbx, bz=nbz, B=B, step=STEP, m=base64.b64encode(bits).decode(), b64=base64.b64encode(bytes(blocks)).decode())
    print(f'  {len(o["b64"]) + len(o["m"])} characters')
    if out: json.dump(dict(fine=o, lat0=lat0, lon0=lon0), open(out, 'w'), separators=(',', ':'))


if __name__ == '__main__':
    main()
