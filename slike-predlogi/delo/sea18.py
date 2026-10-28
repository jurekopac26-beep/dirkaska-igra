# the sea cleaned up from the part views (map24): its colour smoothed (the shallow halos round the islands drawn in blocks, the steps in the
# water's tone go; ~2.5 m blur), the shadows on it (palms) and the things in it (buoys, boats, piers) kept; along the shores the beach's sand
# carried over the stair-stepped edge (a smoothed edge, the sand's own colour) -> sea18.json (blocks: 1 m water layer, 0.5 m shore sand layer)
import json, base64, sys
import numpy as np
from PIL import Image
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
sys.path.insert(0, SP)
from mk18_helpers import gauss, dil, sst
T = [[-245, -285], [0, -285], [245, -285], [-245, -40], [0, -40], [245, -40], [-245, 205], [0, 205], [245, 205]]
S = 0.5; X0, Z0, X1, Z1 = 50.0, -412.0, 372.0, 332.0; NX, NZ = int((X1 - X0) / S), int((Z1 - Z0) / S)
C = np.zeros((NZ, NX, 3), np.float32); W = np.zeros((NZ, NX), np.float32)
for k, (cx, cz) in enumerate(T):
    if cx + 125 < X0: continue
    im = Image.open(SP + 'sh-map24-M0%d.png' % (k + 1)).convert('RGB').resize((500, 500), Image.BOX); A = np.asarray(im).astype(np.float32)
    i0 = int(round((cx - 125 - X0) / S)); j0 = int(round((cz - 125 - Z0) / S)); a0, b0 = max(0, -i0), max(0, -j0); i1, j1 = min(NX, i0 + 500), min(NZ, j0 + 500)
    C[j0 + b0:j1, i0 + a0:i1] += A[b0:j1 - j0, a0:i1 - i0]; W[j0 + b0:j1, i0 + a0:i1] += 1
C /= np.maximum(W, 1)[..., None]
r, g, b = C[..., 0], C[..., 1], C[..., 2]; L = C.mean(2)
xs = X0 + (np.arange(NX) + 0.5) * S; zs = Z0 + (np.arange(NZ) + 0.5) * S; XX, ZZ = np.meshgrid(xs, zs)
lagoon = (XX < 135) & (ZZ > 140) & (ZZ < 255)
water = (b > r + 35) & (b > 95) & ~lagoon
sand = (r > g + 8) & (r > b + 18) & ~water
def nb(v, w, s):
    a = gauss(v * w, s); q = gauss(w.astype(np.float32), s); return a / np.maximum(q, 1e-4), q
# the water's own tone round each cell (8 m), and its shadows / things: darker than it by a quarter, or not water-coloured -> kept
ref = np.stack([nb(C[..., k], water.astype(np.float32), 8.0)[0] for k in range(3)], -1); Lr = ref.mean(2)
shadow = water & (L < Lr * 0.9)
okW = water & ~shadow
colW = np.stack([nb(C[..., k], okW.astype(np.float32), 5.0)[0] for k in range(3)], -1)       # 2.5 m
things = ~(water | sand) & ~dil(~(water | sand), 0)
keepW = dil(~water & ~sand, 1) | dil(shadow, 1)
aW = gauss((water & ~keepW).astype(np.float32), 0.8)
# the shores: the sand / water edge smoothed (1.5 m), the sand's colour carried over the notches
ind = sand.astype(np.float32); wsw = (sand | water).astype(np.float32); f, _ = nb(ind, wsw, 3.0)
near = dil(water, 8) & dil(sand, 8)                      # within ~4 m of both
colS = np.stack([nb(C[..., k], sand.astype(np.float32), 4.0)[0] for k in range(3)], -1)
aS = sst(0.4, 0.6, f) * near * (~dil(~(water | sand), 1))
aW = aW * (1 - aS)
pk = lambda a: base64.b64encode(np.clip(a, 0, 255).astype(np.uint8).tobytes()).decode()
out = {'water': [], 'shore': []}
# water at 1 m nodes (2 x 2 cells averaged), blocks of 50 m; shore at 0.5 m, blocks of 50 m
aW1 = aW.reshape(NZ // 2, 2, NX // 2, 2).mean((1, 3)); cW1 = colW.reshape(NZ // 2, 2, NX // 2, 2, 3).mean((1, 3))
for (A, Cc, s, B, key) in ((aW1, cW1, 1.0, 50, 'water'), (aS, colS, 0.5, 100, 'shore')):
    nz, nx = A.shape; x0g = X0 + s / 2; z0g = Z0 + s / 2
    for j0 in range(0, nz - 1, B):
        for i0 in range(0, nx - 1, B):
            j1, i1 = min(nz, j0 + B + 1), min(nx, i0 + B + 1); a = A[j0:j1, i0:i1]
            if a.max() < 0.03: continue
            out[key].append({'x0': x0g + i0 * s, 'z0': z0g + j0 * s, 'S': s, 'nx': i1 - i0, 'nz': j1 - j0, 'a': pk(a * 255), 'c': pk(Cc[j0:j1, i0:i1])})
json.dump(out, open(SP + 'sea18.json', 'w'))
pv = C.copy(); pv = pv * (1 - aW[..., None]) + colW * aW[..., None]; pv = pv * (1 - aS[..., None]) + colS * aS[..., None]
Image.fromarray(np.clip(pv, 0, 255).astype(np.uint8)).resize((NX // 2, NZ // 2)).save(SP + 'sea18-pv.png')
print('water blocks', len(out['water']), 'shore blocks', len(out['shore']), 'shadow', shadow.mean().round(4))
