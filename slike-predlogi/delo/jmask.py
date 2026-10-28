# ground clean-up from the top views: in each box, every 0.5 m cell classed (sand / grass / hole / other) off the quarter renders (q17), the
# sand-grass edge smoothed (a blurred sand field), the colours of each smoothed (sand more: its dark red blotches go), shadows and tyre tracks
# (darker, same hue) left as they are, asphalt / kerbs / water / things left as they are -> jn-<tag>.json for jn-page.js
import sys, os, json, base64
import numpy as np
from PIL import Image
def gaussian_filter(a, s):
    r = int(3 * s + 1); k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); k /= k.sum(); a = np.asarray(a, float)
    p = np.pad(a, ((0, 0), (r, r)), mode='edge'); a = sum(k[i] * p[:, i:i + a.shape[1]] for i in range(2 * r + 1))
    p = np.pad(a, ((r, r), (0, 0)), mode='edge'); return sum(k[i] * p[i:i + a.shape[0], :] for i in range(2 * r + 1))
def comps(m):
    # 4-connected components of a bool grid -> label grid, sizes
    lab = np.zeros(m.shape, int); sizes = [0]; H, W = m.shape; n = 0
    for y0 in range(H):
        for x0 in range(W):
            if not m[y0, x0] or lab[y0, x0]: continue
            n += 1; st = [(y0, x0)]; lab[y0, x0] = n; c = 0
            while st:
                y, x = st.pop(); c += 1
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
            sizes.append(c)
    return lab, np.array(sizes)
def binary_dilation(m, iterations=1):
    for _ in range(iterations):
        g = m.copy(); g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]; m = g
    return m
sys.path.insert(0, '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad')
from cropq import SP
tag = 'base18'
TT = [[-245, -285], [0, -285], [245, -285], [-245, -40], [0, -40], [245, -40], [-245, 205], [0, 205], [245, 205]]
def sample(tag, x0, z0, x1, z1, ppm=4.8):
    # mosaic of the single-camera part views (no seams), ppm px per metre
    W, Hh = int(round((x1 - x0) * ppm)), int(round((z1 - z0) * ppm)); out = Image.new('RGB', (W, Hh))
    for k, (cx, cz) in enumerate(TT):
        if cx + 125 < x0 or cx - 125 > x1 or cz + 125 < z0 or cz - 125 > z1: continue
        f = SP + 'sh-%s-M0%d.png' % (tag, k + 1)
        if not os.path.exists(f): continue
        im = Image.open(f).convert('RGB'); out.paste(im, (int(round((cx - 125 - x0) * ppm)), int(round((cz - 125 - z0) * ppm))))
    return out
R = [('tun5', -270, -52, -228, -2), ('mx2', -345, -275, -250, -180), ('mxL', -345, -100, -288, -8), ('m8b', -300, 150, -240, 215), ('ro2', -250, -365, -205, -325), ('farm3', -30, -335, 45, -300), ('j4', -80, -250, -30, -200),
     ('mx5', -340, -25, -285, 25), ('bus5', -190, 25, -130, 80), ('m8', -205, 135, -160, 175), ('m9', -140, 215, 125, 315), ('m10', 120, 190, 345, 315)]
S = 0.5
def nblur(v, w, s):
    a = gaussian_filter(v * w, s); b = gaussian_filter(w.astype(float), s); return a / np.maximum(b, 1e-6), b
out = []
for name, x0, z0, x1, z1 in R:
    im = sample(tag, x0, z0, x1, z1)
    # the touch buttons drawn on each quarter: unknown there
    U = np.zeros((im.size[1], im.size[0]), bool)
    for k in range(9):
        pass
    A = np.asarray(im).astype(float)
    # button boxes per quarter (quarter origin at multiples of 125 m from the tiles' corners)
    T = [[-245, -285], [0, -285], [245, -285], [-245, -40], [0, -40], [245, -40], [-245, 205], [0, 205], [245, 205]]
    for cx, cz in T:
        for dx, dz in ((-62.5, -62.5), (62.5, -62.5), (-62.5, 62.5), (62.5, 62.5)):
            qx, qz = cx + dx - 62.5, cz + dz - 62.5
            for (u0, v0, u1, v1) in ():
                a0, b0 = int((qx - x0) * 4.8 + u0), int((qz - z0) * 9.6 + v0); a1, b1 = int((qx - x0) * 9.6 + u1), int((qz - z0) * 9.6 + v1)
                a0, b0, a1, b1 = max(0, a0), max(0, b0), min(U.shape[1], a1), min(U.shape[0], b1)
                if a1 > a0 and b1 > b0: U[b0:b1, a0:a1] = True
    nx, nz = int(round((x1 - x0) / S)), int(round((z1 - z0) / S))
    C = np.asarray(Image.fromarray(A.astype(np.uint8)).resize((nx, nz), Image.BOX)).astype(float)
    Uc = np.asarray(Image.fromarray((U * 255).astype(np.uint8)).resize((nx, nz), Image.BOX)) > 20
    hp = (np.abs(A[..., 0] - 162) < 20) & (np.abs(A[..., 1] - 164) < 20) & (np.abs(A[..., 2] - 205) < 22) & (A[..., 2] - A[..., 0] > 25)
    hp = binary_dilation(hp, 2); Hc = np.asarray(Image.fromarray((hp * 255).astype(np.uint8)).resize((nx, nz), Image.BOX)) > 30
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; L = (r + g + b) / 3
    hole = (np.abs(r - 162) < 18) & (np.abs(g - 164) < 18) & (np.abs(b - 205) < 20) & (b - r > 25)
    water = (b > r + 35) & (b > 100) & ~hole
    grass = (g > r + 3) & (g >= b - 4) & ~hole & ~water
    sand = (r > g + 8) & (r > b + 18) & ~hole & ~water & ~grass
    kerb = (r > 165) & (g < 70) & (r - g > 120); conv = np.zeros_like(grass)
    if name in ('tun5', 'm9', 'm10', 'bus5', 'mxL'):
        yel = (b < 0.62 * g) & (np.abs(r - g) < 32) & (g > 95) & ~hole & ~water; grass |= yel; sand &= ~yel; conv |= yel
    sand &= ~kerb
    hole |= Hc; grass &= ~Hc; sand &= ~Hc; unk = Uc | hole
    xs_ = x0 + (np.arange(nx) + 0.5) * S; zs_ = z0 + (np.arange(nz) + 0.5) * S; XX_, ZZ_ = np.meshgrid(xs_, zs_)
    for nm, bx0, bz0, bx1, bz1 in (('m9', -42, 243, -12, 248),):
        if name != nm: continue
        fp = (XX_ > bx0) & (XX_ < bx1) & (ZZ_ > bz0) & (ZZ_ < bz1) & ~grass & ~sand; unk |= fp; hole |= fp
    other = ~(grass | sand | unk)
    # sand field: 1 sand, 0 grass, unknown filled
    # small islands: grass inside sand under 50 m2 -> sand, sand specks in grass under 12 m2 -> grass
    lab, sz = comps(grass); small = (sz < 200)[lab] & grass; grass &= ~small; sand |= small; conv |= small
    # the grass wedge at the farm way's mouth (map 3): sand, as the junction round it
    for nm, bx0, bz0, bx1, bz1 in (('farm3', -16, -327, -3, -304),):
        if name != nm: continue
        xs = x0 + (np.arange(nx) + 0.5) * S; zs = z0 + (np.arange(nz) + 0.5) * S; XX, ZZ = np.meshgrid(xs, zs)
        fb = (XX > bx0) & (XX < bx1) & (ZZ > bz0) & (ZZ < bz1) & grass; grass &= ~fb; sand |= fb; conv |= fb
    lab, sz = comps(sand); small = (sz < 48)[lab] & sand; sand &= ~small; grass |= small; conv |= small
    ind = sand.astype(float); w = (grass | sand).astype(float)
    f, _ = nblur(ind, w, {'ro2': 7.0, 'farm3': 4.0}.get(name, 2.6))       # sigma 1.3 m (3.5 m where the steps are big)
    # shadows / tracks: darker than the same class round them with the hue kept
    def cls_ref(mask, s):
        # the class's colour round each cell; where none is near, from farther (then the class's mean), never black
        out = []
        mk_ = mask.astype(float); gm = [C[..., k][mask].mean() if mask.any() else 128.0 for k in range(3)]
        for k in range(3):
            a, w_ = nblur(C[..., k], mk_, s); a2, w2 = nblur(C[..., k], mk_, s * 5)
            v = np.where(w_ > 0.02, a, np.where(w2 > 0.002, a2, gm[k])); out.append(v)
        return np.stack(out, -1)
    for it in range(2):
        okS = sand & ~unk if it == 0 else sand & ~unk & ~shS & ~blot
        okG = grass & ~unk if it == 0 else grass & ~unk & ~shG
        refS = cls_ref(okS, 6.0); refG = cls_ref(okG, 6.0)
        LS = refS.sum(-1) / 3; LG = refG.sum(-1) / 3
        rgS = refS[..., 0] / np.maximum(refS[..., 1], 1); rg = r / np.maximum(g, 1)
        blot = sand & (rg > rgS * 1.18) & (L < LS * 0.95)
        shS = sand & ~blot & (L < LS * 0.78)
        shG = grass & (L < LG * 0.72)
        rgG = refG[..., 0] / np.maximum(refG[..., 1], 1); blotG = grass & ((rg > rgG * 1.12) | (rg < rgG * 0.85))
    shS &= ~conv; shG &= ~conv; blot &= ~conv
    bad = conv.copy()
    if name in ('farm3', 'mx5', 'mxL', 'mx2', 'j4', 'm9'):
        sh = shS | shG; er = ~binary_dilation(~sh, 2); big = binary_dilation(er, 2) & sh; shS &= ~big; shG &= ~big; bad |= big
    colS = cls_ref(sand & ~unk & ~shS & ~blot & ~bad, 4.0)      # sigma 2 m
    colG = cls_ref(grass & ~unk & ~shG & ~bad & ~blotG & ~(L < LG * 0.85), 2.0)             # sigma 1 m
    keep = binary_dilation(other | water, iterations=1)
    paint = (~keep & ~shS & ~shG & ~Uc).astype(float)
    paint = gaussian_filter(paint, 0.7)
    # the box's rim: soft over 5 m
    ii, jj = np.meshgrid(np.arange(nx), np.arange(nz)); dr = np.minimum.reduce([ii, jj, nx - 1 - ii, nz - 1 - jj]) * S
    paint *= np.clip(dr / 5.0, 0, 1) ** 1.5
    pack = lambda a: base64.b64encode(np.clip(a, 0, 255).astype(np.uint8).tobytes()).decode()
    out.append({'name': name, 'x0': x0, 'z0': z0, 'S': S, 'nx': nx, 'nz': nz, 'dy': {'farm3': 0.32}.get(name, 0.0), 'f': pack(f * 255), 'p': pack(paint * 255), 'cs': pack(colS), 'cg': pack(colG)})
    print(name, nx, nz, 'sand %.2f grass %.2f other %.2f unk %.2f shS %.3f shG %.3f blot %.3f' % (sand.mean(), grass.mean(), other.mean(), unk.mean(), shS.mean(), shG.mean(), blot.mean()))
    # a preview: what would show
    pv = np.where((f > 0.5)[..., None], colS, colG); pv = pv * paint[..., None] + C * (1 - paint[..., None])
    Image.fromarray(np.clip(pv, 0, 255).astype(np.uint8)).resize((nx * 2, nz * 2)).save(SP + 'jnpv-%s.png' % name)
json.dump(out, open(SP + 'jn-%s.json' % tag, 'w')); print('ok')
