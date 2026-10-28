# soft blend between the two sand colours (light run-off sand / the darker motocross dirt and makadam), read off a close top view:
# each sand pixel keeps its own detail (grain, tyre marks, shadows) as a ratio to the mean of its own side, and that ratio is laid on a
# widely blurred mean of both sides, so the colour runs over several metres instead of jumping at a line; grass, asphalt, things kept
import sys, json, base64, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, sst

def run(png, cx, cz, span, box, S=0.25, sig_big=2.5, rim=4.0, out=None, dbg=None, road=None, tl=172.0, ell=None):
    im = np.asarray(Image.open(png).convert('RGB'), np.float32)
    N = im.shape[0]; ppm = N / span
    x0, z0, x1, z1 = box; nx = int(round((x1 - x0) / S)) + 1; nz = int(round((z1 - z0) / S)) + 1
    # area mean of the render round each node
    xs = x0 + np.arange(nx) * S; zs = z0 + np.arange(nz) * S
    I = Image.fromarray(im.astype(np.uint8))
    w = int(round((x1 - x0 + S) * ppm)); h = int(round((z1 - z0 + S) * ppm))
    L = (x0 - S / 2 - (cx - span / 2)) * ppm; T = (z0 - S / 2 - (cz - span / 2)) * ppm
    C = np.asarray(I.resize((nx, nz), Image.BOX, box=(L, T, L + w, T + h)), np.float32)
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b; mx = C.max(-1); mn = C.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    grass = (g > r + 4) & (g > b + 15)
    grey = (sat < 0.16) & ~grass                                     # asphalt, kerbs' white, lines, the gate's metal
    warm = (r >= g) & (g >= b - 4) & ~grass & ~grey
    orange = warm & ((g / np.maximum(r, 1)) < 0.52) & (r > 170)     # the truck, markers
    sand = warm & ~orange
    xs_, zs_ = np.meshgrid(xs, zs)
    if road is not None:   # road margin (m) on a 1 m grid from the box's corner: the asphalt and the sand drawn over it are left alone
        rm, rx0, rz0 = road; fi = np.clip(xs_ - rx0, 0, rm.shape[1] - 1.001); fj = np.clip(zs_ - rz0, 0, rm.shape[0] - 1.001)
        i0 = fi.astype(int); j0 = fj.astype(int); u = fi - i0; v = fj - j0
        M = rm[j0, i0] * (1 - u) * (1 - v) + rm[j0, i0 + 1] * u * (1 - v) + rm[j0 + 1, i0] * (1 - u) * v + rm[j0 + 1, i0 + 1] * u * v
        offr = sst(0.0, 0.8, M); sand = sand & (M > 0.0)
    else: offr = 1.0
    # shadows: much darker than the sand round them (kept as part of the ratio, not sampled for the mean)
    lb = gauss(np.where(sand, lum, 0), 6) / np.maximum(gauss(sand.astype(np.float32), 6), 1e-3)
    shad = sand & (lum < 0.78 * lb)
    lit = sand & ~shad
    # the two sides: split the lit sand by brightness against the local wide mean (two clusters)
    t = tl   # light run-off sand ~199, the motocross pad ~148, makadam ~159 (lum of the close view)
    light = lit & (lum >= t); dark = lit & (lum < t)
    # a side is only a side when it holds at least a few metres: clean the split
    k = int(round(0.75 / S))
    lightA = gauss(light.astype(np.float32), 1.0 / S) ; darkA = gauss(dark.astype(np.float32), 1.0 / S)
    side = lightA >= darkA                                             # True = light side
    def nb(mask, s):
        m = mask.astype(np.float32); den = gauss(m, s / S)
        return np.stack([gauss(C[..., c] * m, s / S) for c in range(3)], -1) / np.maximum(den, 1e-4)[..., None], den
    LPl, dl = nb(lit & side, 1.2); LPd, dd = nb(lit & ~side, 1.2); LPa, da = nb(lit, 1.2)
    LPs = np.where(side[..., None], LPl, LPd)
    LPs = np.where((np.where(side, dl, dd) < 0.05)[..., None], LPa, LPs)
    R = C / np.maximum(LPs, 1)
    R = np.where(lit[..., None], np.clip(R, 0.8, 1.25), np.clip(R, 0.25, 1.25))
    # right at the old line the pixels are a mix of both sides: no detail of their own there (else the line shows as a bright thread)
    la = gauss(light.astype(np.float32), 0.45 / S); da = gauss(dark.astype(np.float32), 0.45 / S); f = np.abs(la - da) / np.maximum(la + da, 1e-3)
    wb = (1 - sst(0.05, 0.75, f)) * lit
    R = R * (1 - wb[..., None]) + wb[..., None]
    # the thin greyish seam and the tape's little posts right on the old line: taken into the sand (painted over with the new colour)
    la6 = gauss(light.astype(np.float32), 0.6 / S); da6 = gauss(dark.astype(np.float32), 0.6 / S)
    absorb = (la6 > 0.08) & (da6 > 0.08) & ~sand & ~orange & (lum > 100)
    if road is not None: absorb &= (M > 0.3)
    R = np.where(absorb[..., None], 1.0, R); sand = sand | absorb
    BIG, dB = nb(lit, sig_big)
    BIG2, _ = nb(lit, sig_big * 2)
    BIG = np.where((dB < 0.03)[..., None], BIG2, BIG)
    NEW = np.clip(BIG * R, 0, 255)
    # alpha: sand only, soft at the kept things, faded to nothing at the box's rim
    A = gauss(sand.astype(np.float32), 0.3 / S); A = sst(0.55, 0.95, A) * sand
    jj, ii = np.mgrid[0:nz, 0:nx]; e = np.minimum(np.minimum(ii, nx - 1 - ii), np.minimum(jj, nz - 1 - jj)) * S
    A = A * sst(0, 1, e / rim) * offr
    if ell:
        ex, ez, rx, rz, fd = ell; q = np.sqrt(((xs_ - ex) / rx) ** 2 + ((zs_ - ez) / rz) ** 2); A = A * (1 - sst(1.0, 1.0 + fd / min(rx, rz), q))
    if dbg:
        sh = np.concatenate([C, NEW, np.stack([A * 255] * 3, -1), np.stack([side * 255] * 3, -1)], 1)
        Image.fromarray(sh.astype(np.uint8)).save(dbg)
    res = {'x0': x0, 'z0': z0, 'S': S, 'nx': nx, 'nz': nz,
           'c': base64.b64encode(NEW.round().astype(np.uint8).tobytes()).decode(),
           'a': base64.b64encode((A * 255).round().astype(np.uint8).tobytes()).decode()}
    if out: json.dump(res, open(out, 'w'))
    return res, C, NEW, A

if __name__ == '__main__':
    a = json.loads(sys.argv[1])
    run(**a)
