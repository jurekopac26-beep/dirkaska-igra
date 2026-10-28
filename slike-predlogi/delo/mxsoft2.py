# soft blend between the two sand colours (light run-off sand / the darker motocross pad and makadam), read off a close top view.
# The colour is a wide blur of both sides, so it runs over several metres; the grain runs over with it: the light sand's sparkle fades
# out into the smooth pad (its own pixels on its side, a patch of it repeated on the other), the pad's own marks fade the other way.
# Shadows keep their darkness; grass, asphalt, the road's sand and things (gate, truck) are left as they are.
import sys, json, base64, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from mk18_helpers import gauss, sst

def run(png, cx, cz, span, box, S=0.25, sig_big=3.5, rim=4.0, out=None, road=None, tl=180.0, ell=None, patch=None, dbg=None):
    im = Image.open(png).convert('RGB'); N = im.size[0]; ppm = N / span
    x0, z0, x1, z1 = box; nx = int(round((x1 - x0) / S)) + 1; nz = int(round((z1 - z0) / S)) + 1
    xs = x0 + np.arange(nx) * S; zs = z0 + np.arange(nz) * S; X, Z = np.meshgrid(xs, zs)
    L = (x0 - S / 2 - (cx - span / 2)) * ppm; T = (z0 - S / 2 - (cz - span / 2)) * ppm
    C = np.asarray(im.resize((nx, nz), Image.BOX, box=(L, T, L + nx * S * ppm, T + nz * S * ppm)), np.float32)
    # thin things (the gate's orange pole, white bits) read at the view's own resolution: a cell they cross is not painted
    F = np.asarray(im, np.float32); fr, fg, fb = F[..., 0], F[..., 1], F[..., 2]; fs = (F.max(-1) - F.min(-1)) / np.maximum(F.max(-1), 1)
    fobj = ((fr > 150) & (fg < 0.62 * fr) & (fb < 0.38 * fr)) | ((F.min(-1) > 200) & (fs < 0.15)) | (fb > fr + 5)
    OBJ = np.asarray(Image.fromarray((fobj * 255).astype(np.uint8)).resize((nx, nz), Image.BOX, box=(L, T, L + nx * S * ppm, T + nz * S * ppm)), np.float32) / 255
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b
    sat = (C.max(-1) - C.min(-1)) / np.maximum(C.max(-1), 1)
    grass = (g > r + 4) & (g > b + 15)
    grey = (sat < 0.16) & ~grass
    warm = (r >= g) & (g >= b - 4) & ~grass & ~grey
    orange = warm & ((g / np.maximum(r, 1)) < 0.52) & (r > 170)
    sand = warm & ~orange
    M = np.full(X.shape, 99.0)
    if road is not None:
        rm, rx0, rz0 = road; fi = np.clip(X - rx0, 0, rm.shape[1] - 1.001); fj = np.clip(Z - rz0, 0, rm.shape[0] - 1.001)
        i0 = fi.astype(int); j0 = fj.astype(int); u = fi - i0; v = fj - j0
        M = rm[j0, i0] * (1 - u) * (1 - v) + rm[j0, i0 + 1] * u * (1 - v) + rm[j0 + 1, i0] * (1 - u) * v + rm[j0 + 1, i0 + 1] * u * v
    sand &= M > 0
    G = lambda a, s: gauss(np.asarray(a, np.float32), s / S)
    def nbs(v, m, s): return G(np.where(m, v, 0), s) / np.maximum(G(m, s), 1e-4)
    def nb(m, s): d = np.maximum(G(m, s), 1e-4); return np.stack([G(np.where(m, C[..., c], 0), s) for c in range(3)], -1) / d[..., None], d
    lb = nbs(lum, sand, 1.5)
    shad = sand & (lum < 0.78 * lb)
    lit = sand & ~shad
    # the sides by the smoothed brightness (light peak ~194, pad ~146, the pad's edge ~170)
    Ls = nbs(lum, lit, 0.5)
    side = lit & (Ls >= tl); dside = lit & (Ls < tl)
    # the greyish seam and the tape posts right on the old line become sand too
    s6 = G(side, 0.6); d6 = G(dside, 0.6)
    absorb = (s6 > 0.08) & (d6 > 0.08) & ~sand & ~orange & (lum > 100) & (M > 0.3)
    samp = lit
    LPl, dl = nb(side, 1.2); LPd, dd = nb(dside, 1.2); LPa, _ = nb(samp, 1.2)
    Rl = np.clip(C / np.maximum(LPl, 1), 0.75, 1.3); Rd = np.clip(C / np.maximum(LPd, 1), 0.75, 1.3)
    # a patch of the light sand's grain, mirrored and repeated
    px0, pz0, pw = patch; pi = int((px0 - x0) / S); pj = int((pz0 - z0) / S); n = int(pw / S)
    Pt = Rl[pj:pj + n, pi:pi + n]; Pt = np.concatenate([Pt, Pt[:, ::-1]], 1); Pt = np.concatenate([Pt, Pt[::-1]], 0)
    Rg = np.tile(Pt, (nz // (2 * n) + 1, nx // (2 * n) + 1, 1))[:nz, :nx]
    fL = (G(side, sig_big) / np.maximum(G(lit, sig_big), 1e-4))[..., None]
    sv = G(side.astype(np.float32) + 0.5 * absorb, 0.4); dv = G(dside.astype(np.float32) + 0.5 * absorb, 0.4)
    wb = np.clip(1 - np.abs(sv - dv) / np.maximum(sv + dv, 1e-3), 0, 1)[..., None]   # 1 on the old line, 0 a little off it
    sd = side[..., None]
    Dl = np.where(sd, Rl, Rg); Dd = np.where(sd, 1.0, Rd)
    Dl = Dl * (1 - wb) + Rg * wb; Dd = Dd * (1 - wb) + wb
    D = fL * Dl + (1 - fL) * Dd
    LPs = np.where(sd, LPl, LPd); LPs = np.where(((np.where(side, dl, dd)) < 0.05)[..., None], LPa, LPs)
    Rsh = np.clip(C / np.maximum(LPs, 1), 0.25, 1.0)
    D = np.where(shad[..., None], Rsh, D)
    D = np.where(absorb[..., None], fL * Rg + (1 - fL), D)
    BIG, dB = nb(samp, sig_big); BIG2, _ = nb(samp, sig_big * 2); BIG = np.where((dB < 0.03)[..., None], BIG2, BIG)
    NEW = np.clip(BIG * D, 0, 255)
    paint = sand | absorb
    A = sst(0.55, 0.95, G(paint, 0.3)) * paint
    A *= 1 - sst(0.03, 0.3, G(grass, 0.5))
    A *= 1 - sst(0.04, 0.2, np.maximum(OBJ, G(OBJ, 0.25)))                                          # the sand's own soft edge into the grass stays as it is
    e = np.minimum(np.minimum(X - x0, x1 - X), np.minimum(Z - z0, z1 - Z)); A *= sst(0, 1, e / rim) * sst(0.0, 0.8, M)
    if ell:
        ex, ez, rx, rz, fd = ell; q = np.sqrt(((X - ex) / rx) ** 2 + ((Z - ez) / rz) ** 2); A *= 1 - sst(1.0, 1.0 + fd / min(rx, rz), q)
    if dbg:
        P = C * (1 - A[..., None]) + NEW * A[..., None]
        Image.fromarray(np.concatenate([C, P], 1).astype(np.uint8)).save(dbg)
    res = {'x0': x0, 'z0': z0, 'S': S, 'nx': nx, 'nz': nz,
           'c': base64.b64encode(NEW.round().astype(np.uint8).tobytes()).decode(),
           'a': base64.b64encode((A * 255).round().astype(np.uint8).tobytes()).decode()}
    if out: json.dump(res, open(out, 'w'))
    return res, C, NEW, A
