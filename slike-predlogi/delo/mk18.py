# the user's marks of 17. 10. evening as ground layers: GREEN -> the run-off zones' light sand, RED -> makadam (darker, for driving); and the
# dirt ways' makadam carried on through the light sand near them (a ribbon along each way, soft at its sides), so sand and makadam meet softly
# everywhere. In: marks18.npz, cls18.npz, ways18.json. Out: mk18.json (50 m blocks of node alphas, 0.5 m) for mk18-page.js + previews
import json, base64, sys
import numpy as np
from PIL import Image
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
def gauss(a, s):
    r = int(3 * s + 1); k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); k /= k.sum(); a = np.asarray(a, np.float32)
    p = np.pad(a, ((0, 0), (r, r)), mode='edge'); a = sum(k[i] * p[:, i:i + a.shape[1]] for i in range(2 * r + 1))
    p = np.pad(a, ((r, r), (0, 0)), mode='edge'); return sum(k[i] * p[i:i + a.shape[0], :] for i in range(2 * r + 1))
def dil(m, n):
    for _ in range(n):
        g = m.copy(); g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]; m = g
    return m
def ero(m, n): return ~dil(~m, n)
def fill_holes(m):
    # what the outside can't reach is inside
    out = np.zeros_like(m); H, W = m.shape; st = [(j, i) for j in (0, H - 1) for i in range(W)] + [(j, i) for i in (0, W - 1) for j in range(H)]
    st = [(j, i) for j, i in st if not m[j, i]]
    for j, i in st: out[j, i] = True
    while st:
        j, i = st.pop()
        for jj, ii in ((j + 1, i), (j - 1, i), (j, i + 1), (j, i - 1)):
            if 0 <= jj < H and 0 <= ii < W and not m[jj, ii] and not out[jj, ii]: out[jj, ii] = True; st.append((jj, ii))
    return ~out
def edt(m, cap=60):
    # distance (m) to the nearest True cell, chamfer 3-4, capped
    INF = 1e6; D = np.where(m, 0, INF).astype(np.float32); H, W = D.shape; a, b = 1.0, 1.4142
    for _ in range(2):
        for j in range(H):
            row = D[j]
            if j: row = np.minimum(row, np.minimum(D[j - 1] + a, np.minimum(np.r_[INF, D[j - 1][:-1]] + b, np.r_[D[j - 1][1:], INF] + b)))
            for i in range(1, W): row[i] = min(row[i], row[i - 1] + a)
            D[j] = row
        for j in range(H - 1, -1, -1):
            row = D[j]
            if j < H - 1: row = np.minimum(row, np.minimum(D[j + 1] + a, np.minimum(np.r_[INF, D[j + 1][:-1]] + b, np.r_[D[j + 1][1:], INF] + b)))
            for i in range(W - 2, -1, -1): row[i] = min(row[i], row[i + 1] + a)
            D[j] = row
    return np.minimum(D * 0.5, cap)
sst = lambda a, b, x: (lambda t: t * t * (3 - 2 * t))(np.clip((x - a) / (b - a), 0, 1))
M = np.load(SP + 'marks18.npz'); Cl = np.load(SP + 'cls18.npz')
GX0, GZ0, S, NX, NZ = [float(v) for v in M['g']]; NX, NZ = int(NX), int(NZ)
RED, GRN = M['red'], M['grn']; sand, light, grass, keep = Cl['sand'], Cl['light'], Cl['grass'], Cl['keep']
xs = GX0 + (np.arange(NX) + 0.5) * S; zs = GZ0 + (np.arange(NZ) + 0.5) * S; XX, ZZ = np.meshgrid(xs, zs)
nz1 = 0.5 + 0.25 * np.sin(0.37 * XX * 1.3 + 0.21 * ZZ * 1.3 + 1.3) + 0.25 * np.sin(0.23 * ZZ * 1.3 - 0.31 * XX * 1.3 + 0.4)
paint = gauss((~dil(keep, 1)).astype(np.float32), 0.8)          # not on asphalt, kerbs, lines, water, snow (soft)
# GREEN: light sand where drawn (gaps up to 1.5 m closed, holes filled), a soft 2 m edge
g = fill_holes(ero(dil(GRN, 3), 3)); fg = gauss(g.astype(np.float32), 2.0)
A_s = np.maximum(sst(0.22, 0.7, fg + 0.12 * (nz1 - 0.5)), gauss(g.astype(np.float32), 1.0)) * paint
# RED: makadam where drawn (scribbles read as one area: gaps up to 3 m closed), a soft 2.5 m edge
r_ = fill_holes(ero(dil(RED, 6), 6)); fr = gauss(r_.astype(np.float32), 4.5)
A_r = np.maximum(sst(0.18, 0.75, fr + 0.12 * (nz1 - 0.5)), gauss(r_.astype(np.float32), 1.2)) * paint   # soft outside, full on what was drawn (thin strokes too)
# the ways' makadam through the light sand: a ribbon along each dirt / forest way (not the motocross), full in its middle, soft at its sides,
# only where the ground is sand-like (on grass the way keeps its own edge), and only near the light sand (fading out 14..26 m from it)
W = json.load(open(SP + 'ways18.json'))
ribbon = np.zeros((NZ, NX), np.float32); used = []
for wid, kind, hw, P in W:
    if not (kind in ('dirt', 'forest')) or wid == 'mx' or hw <= 0: continue
    P = np.array(P, np.float32)
    if len(P) < 2 or np.abs(P).max() > 2000: continue
    x0, z0 = P.min(0) - hw - 2; x1, z1 = P.max(0) + hw + 2
    i0, i1 = max(0, int((x0 - GX0) / S)), min(NX, int((x1 - GX0) / S) + 1); j0, j1 = max(0, int((z0 - GZ0) / S)), min(NZ, int((z1 - GZ0) / S) + 1)
    if i1 <= i0 or j1 <= j0: continue
    X, Z = XX[j0:j1, i0:i1], ZZ[j0:j1, i0:i1]; d = np.full(X.shape, 1e9, np.float32)
    for k in range(len(P) - 1):
        ax, az = P[k]; bx, bz = P[k + 1]; dx, dz = bx - ax, bz - az; l2 = dx * dx + dz * dz or 1.0
        t = np.clip(((X - ax) * dx + (Z - az) * dz) / l2, 0, 1); d = np.minimum(d, np.hypot(X - ax - dx * t, Z - az - dz * t))
    prof = 1 - sst(hw - 2.6, hw + 0.2, d + 0.5 * (nz1[j0:j1, i0:i1] - 0.5))
    ribbon[j0:j1, i0:i1] = np.maximum(ribbon[j0:j1, i0:i1], prof); used.append(wid)
# every drivable dirt way is makadam (darker), the run-off zones light sand: the ribbon along the whole way, but not on the snow (its ways stay
# lightly snowy) and not in the motocross
C0 = Cl['col'].astype(np.float32); Lw = C0.mean(2); snow = (Lw > 205) & (np.abs(C0[..., 0] - C0[..., 2]) < 40)
zone = 1 - np.clip(gauss(dil(snow, 10).astype(np.float32), 3.0) * 1.5, 0, 1)
sandlike = gauss(dil(sand, 2).astype(np.float32), 1.0)
A_w = ribbon * zone * sandlike * paint
A_w = A_w * (1 - sst(0.3, 0.8, fg))                       # where the user drew light sand, no makadam ribbon over it
A_m = np.maximum(A_r, A_w)
# narrow grass gaps (under ~3 m) left between the sand / makadam areas (old and new): light sand there
anyS = (sand | (A_s > 0.4) | (A_m > 0.4)); gap = ero(dil(anyS, 4), 4) & ~anyS & ~dil(keep, 1) & dil((fg > 0.5) | (fr > 0.5), 12)   # only by the user's new areas
A_s = np.maximum(A_s, gauss(gap.astype(np.float32), 1.0) * paint)
print('ways', len(used), 'cells sand %d mak %d (marks %d, ways %d)' % ((A_s > 0.02).sum(), (A_m > 0.02).sum(), (A_r > 0.02).sum(), (A_w > 0.02).sum()))
# blocks of 100 x 100 cells (50 m), nodes = cell centres (101 x 101, the last row / column the next block's first)
B = 100; out = {'S': S, 'layers': {}}
pk = lambda a: base64.b64encode(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8).tobytes()).decode()
for name, A in (('sand', A_s), ('mak', A_m)):
    L = []
    for j0 in range(0, NZ - 1, B):
        for i0 in range(0, NX - 1, B):
            j1, i1 = min(NZ, j0 + B + 1), min(NX, i0 + B + 1); a = A[j0:j1, i0:i1]
            if a.max() < 0.02: continue
            L.append({'x0': float(xs[i0]), 'z0': float(zs[j0]), 'nx': i1 - i0, 'nz': j1 - j0, 'a': pk(a)})
    out['layers'][name] = L; print(name, 'blocks', len(L))
json.dump(out, open(SP + 'mk18.json', 'w'))
# preview over the current map colours
col = Cl['col'].astype(np.float32); pv = col.copy()
SC = np.array([250, 178, 128], np.float32); MC = np.array([196, 158, 112], np.float32)
pv = pv * (1 - A_s[..., None]) + SC * A_s[..., None]; pv = pv * (1 - A_m[..., None]) + MC * A_m[..., None]
Image.fromarray(np.clip(pv, 0, 255).astype(np.uint8)).save(SP + 'mk18-pv.png'); print('ok')
