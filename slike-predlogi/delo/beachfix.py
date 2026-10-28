# one beach everywhere north of the park (user, 18. 10.: "popravi, da je tukaj povsod enaka plaža", Mapa 3): the sand's colour set by the
# distance from the water alone, as the real beach shows it (Mapa 7: the wet edge darker, then the dry sand, lighter inland), so the
# brighter band, the darker band and the light shards by the road go; the umbrellas, the palm, small things and their shadows stay
# (shadows as a ratio laid on the new colour); the sand drawn over the road's edge is left as it is
import sys, json, base64, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, edt, sst
from roadmask import dist_masks

K = 2; CX, CZ = 0, -285; S = 0.25; NC = 1000; HALF = 122.5
# Mapa 7's beach, median colour by the distance from the water (m)
# (smoothed: no step anywhere, so no contour line shows along the shore)
# user, later: the inland part too "take barve in sence kot plaža": no lightening inland, the beach's own tone all the way to the road
PD = [0, 3, 6, 10, 14, 30]
PC = [(175, 129, 98), (186, 133, 99), (192, 137, 101), (197, 140, 103), (199, 141, 104), (199, 141, 104)]

def run(dbg=True):
    im = Image.open('sh-map28-M0%d.png' % K).convert('RGB')
    x0 = CX - 125 + S / 2; z0 = CZ - 125 + S / 2; X, Z = np.meshgrid(x0 + np.arange(NC) * S, z0 + np.arange(NC) * S)
    C = np.asarray(im.resize((NC, NC), Image.BOX), np.float32); r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b
    mx = C.max(-1); sat = (mx - C.min(-1)) / np.maximum(mx, 1)
    water = (b > r + 20) & (b > g); water = ero(dil(water, 2), 2)
    dW = edt(water, cap=120) * (S / 0.5)
    sandc = (r > g + 12) & (g > b - 2) & (sat > 0.18) & (g / np.maximum(r, 1) > 0.55) & (g / np.maximum(r, 1) < 0.9) & (b / np.maximum(r, 1) > 0.35)
    sand = sandc & (lum > 60)
    dA = dist_masks(X, Z)['asph']
    REG = ((X >= 5) & (Z >= -290) & (Z <= -205)) | ((X >= 50) & (Z < -290))
    REG &= ~((X >= 50) & (X <= 94) & (Z >= -373) & (Z <= -361))        # not the wooden jetty
    LP = gauss(np.where(sand & (lum > 120), lum, 0), 2 / S) / np.maximum(gauss((sand & (lum > 120)).astype(np.float32), 2 / S), 1e-3)
    shad = sand & (lum < 0.78 * LP)
    lit = sand & ~shad
    # the profile, smooth in d
    Pd = np.stack([np.interp(dW, PD, [c[q] for c in PC]) for q in range(3)], -1)
    # grain: the beach's own fine detail, a clean patch, small
    LPc = np.stack([gauss(np.where(lit, C[..., q], 0), 1.0 / S) for q in range(3)], -1) / np.maximum(gauss(lit.astype(np.float32), 1.0 / S), 1e-3)[..., None]
    Rr = np.clip(C / np.maximum(LPc, 1), 0.94, 1.06)
    clean = ero(lit & REG, int(2 / S)); n = int(8 / S)
    cs = gauss(clean.astype(np.float32), n / 4); cs[:n] = cs[-n:] = 0; cs[:, :n] = cs[:, -n:] = 0
    j, i = np.unravel_index(np.argmax(cs), cs.shape); j = max(0, j - n // 2); i = max(0, i - n // 2)
    Pt = np.where(clean[j:j + n, i:i + n, None], Rr[j:j + n, i:i + n], 1.0); Pt = np.concatenate([Pt, Pt[:, ::-1]], 1); Pt = np.concatenate([Pt, Pt[::-1]], 0)
    RG = np.tile(Pt, (NC // Pt.shape[0] + 1, NC // Pt.shape[1] + 1, 1))[:NC, :NC]
    shr = np.where(shad, np.clip(lum / np.maximum(LP, 1), 0.3, 1.0), 1.0)
    # the beach's soft shading (low dunes), the same everywhere
    dune = 1 + 0.035 * np.sin(0.21 * X + 0.13 * Z) * np.sin(0.17 * Z - 0.09 * X + 1.1) + 0.02 * np.sin(0.11 * X - 0.23 * Z + 0.4)
    NEW = np.clip(Pd * dune[..., None] * RG * shr[..., None], 0, 255)
    # where: the beach's sand in the region; not on the water, not on the road (the sand drawn over its edge stays), not on things
    A = (sand & REG).astype(np.float32)
    A = np.maximum(A, gauss(A, 0.3 / S) * dil(A > 0, 1) * sandc)     # (not into the umbrellas' shadows: they keep their full size)
    A *= sst(0.0, 1.0, dW)                     # the water's edge as it is
    A *= sst(-0.5, 1.5, dA)                    # off the asphalt
    A *= sst(0, 1, np.minimum(X - 5, 1e9) / 6) * sst(0, 1, (HALF - (X - CX)) / 6)
    e = np.where(X < 50, Z + 290, 99); A *= sst(0, 1, e / 6)  # north edge of the extension (the farm's pasture)
    A *= np.where(Z < -290, sst(50, 55, X), 1.0)                # soft against the farm yard's dirt
    A *= sst(-404, -396, Z)                                      # and softly off towards the deck at the top
    A *= (np.abs(X - CX) <= HALF) & (np.abs(Z - CZ) <= HALF)
    if dbg:
        P = C * (1 - A[..., None]) + NEW * A[..., None]
        Image.fromarray(P.astype(np.uint8)).save('bf-after-M02.png')
    blocks = []; BS = 200
    for bj in range(0, NC, BS):
        for bi in range(0, NC, BS):
            a = A[bj:bj + BS + 1, bi:bi + BS + 1]
            if (a > 0.004).sum() == 0: continue
            c = NEW[bj:bj + BS + 1, bi:bi + BS + 1]
            blocks.append({'x0': float(x0 + bi * S), 'z0': float(z0 + bj * S), 'S': S, 'nx': a.shape[1], 'nz': a.shape[0],
                           'c': base64.b64encode(c.round().astype(np.uint8).tobytes()).decode(), 'a': base64.b64encode((a * 255).round().astype(np.uint8).tobytes()).decode()})
    json.dump(blocks, open('bf-blocks.json', 'w')); return len(blocks), float((A > 0.5).sum() * S * S)

if __name__ == '__main__':
    print(run())
