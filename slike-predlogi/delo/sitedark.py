# the light patch just inside the construction site's fence, by the hairpin (Mapa 8; user, 18. 10.: "naj bo ta mivka tukaj temna, kot je
# na gradbišču"): darkened to the site's own soil - its colour scaled to the lit soil's round it (filled in smoothly), its own fine grain
# kept, only ever darker; the fence's shadow and the run-off sand outside the fence untouched (the region starts at each column's fence shadow)
import sys, json, base64, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, sst
CX, CZ, SPAN = -328, 290, 60; S = 0.125
x0, z0, x1, z1 = -352.0, 281.0, -309.0, 299.0
nx = int(round((x1 - x0) / S)) + 1; nz = int(round((z1 - z0) / S)) + 1
X, Z = np.meshgrid(x0 + np.arange(nx) * S, z0 + np.arange(nz) * S)
im = Image.open('sh-g6-sitec.png').convert('RGB'); ppm = im.size[0] / SPAN
L = (x0 - S / 2 - (CX - SPAN / 2)) * ppm; T = (z0 - S / 2 - (CZ - SPAN / 2)) * ppm
C = np.asarray(im.resize((nx, nz), Image.BOX, box=(L, T, L + nx * S * ppm, T + nz * S * ppm)), np.float32)
lw = np.array([0.3, 0.59, 0.11]); lum = C @ lw
inside = np.zeros_like(lum, bool)
FL = np.asarray(im, np.float32) @ lw; ox, oz = CX - SPAN / 2, CZ - SPAN / 2
for i in range(nx):        # (the fence's shadow, read at the view's own resolution: the first dark run of 0.5 m down the column - not the fence's thin top
                           #  rail or its lit face, which the view shows leaning over the run-off side)
    px = int(round((X[0, i] - ox) * ppm)); py0 = int(round((z0 - oz) * ppm)); col = FL[py0:, px]
    dk = (col < 90).astype(np.int32); run = np.convolve(dk, np.ones(10, np.int32), 'valid'); k = np.nonzero(run == 10)[0]
    if len(k): inside[Z[:, i] >= z0 + k[0] / ppm - S / 2, i] = True
inside &= X < -317.5
CS0 = np.stack([gauss(C[..., c], 0.3 / S) for c in range(3)], -1)
inside &= ~dil((CS0[..., 2] < 0.33 * CS0[..., 0]) & ((CS0 @ lw) > 105), 4)     # (not the orange block by the hut)
# the lit soil round the patch: its colour filled in smoothly (2.5 m)
lsb = gauss(lum, 0.5 / S)
CS = np.stack([gauss(C[..., c], 0.4 / S) for c in range(3)], -1)
soil = inside & (lsb > 85) & (lsb < 122) & (CS[..., 2] < 0.45 * CS[..., 0]) & (CS[..., 1] < 0.66 * CS[..., 0])   # (the soil's own warm hue, not the patch's greyish one)
G0 = np.median(C[soil], 0); lumG = float(G0 @ lw); eps = 0.08          # (the soil's own colour where no soil is near: no dark fill)
den = gauss(soil.astype(np.float32), 2.5 / S); FILL = (np.stack([gauss(np.where(soil, C[..., c], 0), 2.5 / S) for c in range(3)], -1) + G0 * eps) / (den + eps)[..., None]
# the light patch (by the soil's own brightness), its rim (darker or lighter than the soil: both made the soil's)
A0 = sst(1.10, 1.28, lsb / lumG) * inside
core = A0 > 0.5
rim = dil(core, 8) & ~core & inside & (gauss(lum, 0.15 / S) > 70)
CL = np.stack([gauss(C[..., c], 0.75 / S) for c in range(3)], -1); gr = np.clip(C / np.maximum(CL, 1), 0.6, 1.5) ** 0.7
NEW = np.where(rim[..., None], FILL * np.clip(gr, 0.93, 1.07), np.minimum(FILL * np.clip(gr, 0.85, 1.15), C)); NEW = np.clip(NEW, 0, 255)   # (the rim's own line not kept)
A = np.maximum(A0, rim * 0.9)
A = np.minimum(A, gauss(A, 0.25 / S) * 1.6); A *= 1 - sst(-319.5, -317.5, X)
print('patch %.1f m2, soil %s' % ((A > 0.5).sum() * S * S, FILL[A > 0.5].mean(0).round()))
P = C * (1 - A[..., None]) + NEW * A[..., None]
Image.fromarray(np.concatenate([C, P], 0).astype(np.uint8)).save('sitedark-prev.png')
blk = {'x0': float(x0), 'z0': float(z0), 'S': S, 'nx': nx, 'nz': nz, 'c': base64.b64encode(NEW.round().astype(np.uint8).tobytes()).decode(),
       'a': base64.b64encode((np.clip(A, 0, 1) * 255).round().astype(np.uint8).tobytes()).decode()}
json.dump([blk], open('sitedark-blocks.json', 'w'))
if len(sys.argv) > 1:
    for (px, pz) in ((-330, 289.5), (-325, 290.5), (-335, 288.5), (-320, 290.0), (-335, 295.0)):
        i = int(round((px - x0) / S)); j = int(round((pz - z0) / S))
        print((px, pz), 'C', C[j, i].round(), 'CL', CL[j, i].round(), 'FILL', FILL[j, i].round(), 'NEW', NEW[j, i].round(), 'A %.2f' % A[j, i], 'P', P[j, i].round())
