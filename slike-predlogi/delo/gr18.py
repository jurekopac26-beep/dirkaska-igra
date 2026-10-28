# one grass for the whole map (the user: "popravi, da je trava na celi mapi enaka"): every grass cell of the part views (cls18) under one layer of
# the meadow's own look (its material, the map's median grass colour, the mown stripes), soft at its edges; not the fields (yellow-green), not the
# islands, not water / roads / kerbs -> gr18.json (50 m blocks of 1 m nodes)
import json, base64, sys
import numpy as np
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
sys.path.insert(0, SP)
from mk18_helpers import gauss, dil, fill_holes, sst
Cl = np.load(SP + 'cls18.npz'); C = Cl['col'].astype(np.float32)
grass, keep = Cl['grass'], Cl['keep']; r, g, b = C[..., 0], C[..., 1], C[..., 2]
water = keep & (b > r + 35)
# the yellow-green crop fields stay (only by the two farms; elsewhere a yellow-green patch is a blotch in the meadow and gets the grass)
GXa, GZa, Sa = -372.0, -412.0, 0.5; XX = GXa + (np.arange(grass.shape[1]) + 0.5) * Sa; ZZ = GZa + (np.arange(grass.shape[0]) + 0.5) * Sa; XX, ZZ = np.meshgrid(XX, ZZ)
farms = ((XX < -150) & (ZZ < -330)) | ((XX > -125) & (XX < 60) & (ZZ < -290))
field = grass & farms & (r / np.maximum(g, 1) > 0.83) & ((r + g + b) / 3 > 95)
# the islands: land not joined to the main land (2 m cells, flood from the biggest)
land = ~water; L2 = land[::4, ::4]; H, W = L2.shape; lab = np.zeros(L2.shape, np.int32); n = 0; sizes = [0]
for j0 in range(H):
    for i0 in range(W):
        if not L2[j0, i0] or lab[j0, i0]: continue
        n += 1; st = [(j0, i0)]; lab[j0, i0] = n; c = 0
        while st:
            j, i = st.pop(); c += 1
            for jj, ii in ((j + 1, i), (j - 1, i), (j, i + 1), (j, i - 1)):
                if 0 <= jj < H and 0 <= ii < W and L2[jj, ii] and not lab[jj, ii]: lab[jj, ii] = n; st.append((jj, ii))
        sizes.append(c)
main = lab == int(np.argmax(sizes)); mainland = np.repeat(np.repeat(main, 4, 0), 4, 1)[:grass.shape[0], :grass.shape[1]]
m = grass & ~field & ~dil(keep, 1)          # the islands too (the user: the grass the same on the whole map)
# north-east of the snow hill: the old removed loop's brown ground (sand-like, but no way there any more) -> grass too
W18 = json.load(open(SP + 'ways18.json')); sand = Cl['sand']
bx = (XX > -200) & (XX < -110) & (ZZ > -170) & (ZZ < -55); dmin = np.full(grass.shape, 1e9, np.float32)
for wid, kind, hw, P in W18:
    if kind not in ('dirt', 'forest') or hw <= 0: continue
    P = np.array(P, np.float32)
    if np.abs(P).max() > 2000 or not ((P[:, 0] > -215) & (P[:, 0] < -95) & (P[:, 1] > -185) & (P[:, 1] < -40)).any(): continue
    for k in range(len(P) - 1):
        ax, az = P[k]; bx2, bz = P[k + 1]; dx, dz = bx2 - ax, bz - az; l2 = dx * dx + dz * dz or 1.0
        t = np.clip(((XX - ax) * dx + (ZZ - az) * dz) / l2, 0, 1); dmin = np.minimum(dmin, np.hypot(XX - ax - dx * t, ZZ - az - dz * t) - hw)
L0 = C.mean(2); snowy = (L0 > 200) & (np.abs(r - b) < 45)
orphan = bx & sand & (dmin > 2.5) & ~dil(snowy, 4) & ~dil(keep, 1)
m = m | orphan
# the park's lawns: small round sand dots (old splats) -> grass
pk_ = (XX > -5) & (XX < 125) & (ZZ > -170) & (ZZ < 70) & sand & ~dil(keep, 2)
L2 = pk_; H, W2 = L2.shape; lab = np.zeros(L2.shape, np.int32); n2 = 0; small = np.zeros_like(L2)
ys, xs_ = np.nonzero(L2)
for y0, x0 in zip(ys, xs_):
    if lab[y0, x0]: continue
    n2 += 1; st = [(y0, x0)]; lab[y0, x0] = n2; cells = []
    while st:
        y, x = st.pop(); cells.append((y, x))
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W2 and L2[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n2; st.append((yy, xx))
    if len(cells) < 240:
        for y, x in cells: small[y, x] = True
m = m | dil(small, 1)
print('park sand dots -> grass', int(small.sum()))
print('orphan sand -> grass', int(orphan.sum()))
# 1 m nodes: the mask averaged over 2 x 2 cells, then softened
m1 = m.reshape(m.shape[0] // 2, 2, m.shape[1] // 2, 2).mean((1, 3))
A = sst(0.25, 0.75, gauss(m1, 0.8))
GX0, GZ0, S = -372.0, -412.0, 1.0; NZ, NX = A.shape
xs = GX0 + (np.arange(NX) + 0.5) * S; zs = GZ0 + (np.arange(NZ) + 0.5) * S
B = 50; L = []
pk = lambda a: base64.b64encode(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8).tobytes()).decode()
for j0 in range(0, NZ - 1, B):
    for i0 in range(0, NX - 1, B):
        j1, i1 = min(NZ, j0 + B + 1), min(NX, i0 + B + 1); a = A[j0:j1, i0:i1]
        if a.max() < 0.02: continue
        L.append({'x0': float(xs[i0]), 'z0': float(zs[j0]), 'nx': i1 - i0, 'nz': j1 - j0, 'a': pk(a)})
json.dump({'S': S, 'blocks': L}, open(SP + 'gr18.json', 'w'))
print('cells', int((A > 0.02).sum()), 'blocks', len(L), 'fields', int(field.sum()), 'islands off', int((grass & ~mainland).sum()))
