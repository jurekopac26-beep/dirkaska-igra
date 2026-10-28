# old sand removed over the whole map (user, 18. 10.: "zbriši povsod, kjer je še ostala stara mivka, naj se povsod lepo vidi rob ceste"),
# read off the 9 top views (4.8 px/m) on a 0.25 m grid. What goes: the old verge strips between an asphalt edge and the grass - the
# terracotta gravel strip, the pale and the warm sand bands, their shadowed bits - and, in the places the user marked, also the grey pebble
# strip. What stays: the asphalt (the game's own road lines, so the edge is exact), its white lines, kerbs and barriers (red next to white),
# things (blue, orange, pure red), wide sand (run-off zones, beach, site, motocross), the 17. 10. light sand and makadam, the gravel roads.
# Painted: the grass beside it on the same row (the mown stripes run on), with the grass's grain; shadows carried over from the grass round it.
import sys, json, base64, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, edt, sst
from oldsand import gauss2
from roadmask import dist_masks

TAG = 'map28'
TT = [[-245, -285], [0, -285], [245, -285], [-245, -40], [0, -40], [245, -40], [-245, 205], [0, 205], [245, 205]]
S = 0.25; NC = 1000; HALF = 122.5
MK18 = json.load(open('mk18.json'))
STROKES = [(np.load('m6-strokes.npy'), 0, -40), (np.load('m6b-strokes.npy'), 0, -40), (np.load('m3p-strokes.npy'), 0, -285)]
SKIP = [(-340, -268, -272, -202),      # the motocross start blend
        (-345, -40, -265, 30),         # the motocross exit onto the road (tyre tracks, by hand)
        (-362, 226, -108, 332)]        # the construction site and its sand strip to the road (sand on purpose)
KEEPC = [(-18.75, 70.0, 4.3),           # the dome by the parking lot (Mapa 6, bottom)
         (82.3, -187.1, 19.0)]          # the volcano (Mapa 3)
KEEPB = [(56.5, -199.0, 64.0, -178.5)]  # the volcano train's station (its brown roof is not sand)
KEEPL = [([(68.75, -216.8), (61.5, -211.0), (57.8, -200.6), (56.8, -190.2), (56.8, -179.8), (57.8, -170.4), (61.5, -164.2), (68.75, -160.0)], 1.5)]   # the volcano train's ring, west side
PEBBLEBOX = [(-24, -100, 0, -50)]       # the grey pebble strip in the wedge between the two roads (Mapa 6)
LOTBOX = [(-14.0, 58, 0, 98)]          # east of the fence there: the lot's asphalt under the old sand (all of it, the blotches' green rims too)
BAND = 4.5                             # how far from the asphalt an old strip reaches

def dec(b): return np.frombuffer(base64.b64decode(b), np.uint8)

def tile(k, dbg=True):
    cx, cz = TT[k]; im = Image.open('sh-%s-M0%d.png' % (TAG, k + 1)).convert('RGB')
    x0 = cx - 125 + S / 2; z0 = cz - 125 + S / 2
    xs = x0 + np.arange(NC) * S; zs = z0 + np.arange(NC) * S; X, Z = np.meshgrid(xs, zs)
    C = np.asarray(im.resize((NC, NC), Image.BOX), np.float32)
    F = np.asarray(im, np.float32); fr, fg, fb = F[..., 0], F[..., 1], F[..., 2]; fmx = F.max(-1); fmn = F.min(-1); fs = (fmx - fmn) / np.maximum(fmx, 1)
    fwhite = (fmn > 195) & (fs < 0.16); fred = (fr > 160) & (fg < 95) & (fb < 95)
    fcream = (F @ np.array([0.3, 0.59, 0.11]) > 175) & (fs < 0.35)
    fkerb = fwhite | (fred & (np.asarray(Image.fromarray(((fwhite | fcream) * 255).astype(np.uint8)).filter(__import__('PIL.ImageFilter', fromlist=['x']).MaxFilter(9)), np.float32) > 0))
    fobj = (fb > fr + 6) | ((fr > 150) & (fb < 0.28 * fr)) | fred | ((fmn > 200) & (fs < 0.12)) | ((fb > fg + 5) & (fr > 150)) | ((F @ np.array([0.3, 0.59, 0.11]) > 190) & (fs < 0.25)) | ((fr > 170) & (fg > 140) & (fb < 0.6 * fg))   # blue, orange, pure red, white, pink, cream, yellow things
    down = lambda m: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((NC, NC), Image.BOX), np.float32) / 255
    KERB = down(fkerb); OBJ = down(fobj)
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b
    mx = C.max(-1); sat = (mx - C.min(-1)) / np.maximum(mx, 1)
    gr_, br_ = g / np.maximum(r, 1), b / np.maximum(r, 1)
    D = dist_masks(X, Z); dA = D['asph']
    grass = (g > r + 4) & (g > b + 12)
    water = dil(ero((b > r + 25) & (b > g), 6), 6)          # (water, not small blue things)
    warm = (r >= g) & (g >= b + 8) & ~grass & (gr_ > 0.42) & (br_ > 0.28) & (br_ < 0.68) & (sat >= 0.17) & (lum > 30)
    pebble = (r >= g) & ~grass & (sat < 0.17) & (lum > 95) & (lum < 175) & (br_ > 0.7)
    dark = (lum <= 45) & ~grass & ~water
    asphc0 = ((sat < 0.17) & (lum > 55) & (lum < 150) & ~grass).astype(np.float32)
    dG = edt(grass, cap=60) * (S / 0.5); dW = edt(water, cap=60) * (S / 0.5)
    # protected
    wide = warm & (dG > 4.5) & (lum > 80)
    PROT = dil(wide, int(6 / S)) | (dW < 22) | (D['gravel'] < 2.0)
    MKP = np.zeros(X.shape, bool)
    for L in ('sand', 'mak'):
        for B in MK18['layers'][L]:
            a = dec(B['a']).reshape(B['nz'], B['nx'])
            fi = np.round((X - B['x0']) / MK18['S']).astype(int); fj = np.round((Z - B['z0']) / MK18['S']).astype(int)
            ok = (fi >= 0) & (fi < B['nx']) & (fj >= 0) & (fj < B['nz'])
            if ok.any(): PROT[ok] |= a[fj[ok], fi[ok]] > 25; MKP[ok] |= a[fj[ok], fi[ok]] > 25
    for sb in SKIP: PROT |= (X >= sb[0]) & (X <= sb[2]) & (Z >= sb[1]) & (Z <= sb[3])
    KEEP = dil(KERB > 0.1, 2) | dil(OBJ > 0.12, 1) | (dA <= 0) | water            # kerbs and things with half a metre round them
    for (kx, kz, kr) in KEEPC: KEEP |= (X - kx) ** 2 + (Z - kz) ** 2 < kr * kr
    for kb in KEEPB: KEEP |= (X >= kb[0]) & (X <= kb[2]) & (Z >= kb[1]) & (Z <= kb[3])
    for pts, kr in KEEPL:
        for (ax, az), (bx_, bz) in zip(pts[:-1], pts[1:]):
            dx, dz = bx_ - ax, bz - az; L2 = dx * dx + dz * dz; t = np.clip(((X - ax) * dx + (Z - az) * dz) / L2, 0, 1)
            KEEP |= np.hypot(X - ax - dx * t, Z - az - dz * t) < kr
    # the user's marks
    MK = np.zeros(X.shape, bool)
    for m, tcx, tcz in STROKES:
        pi = np.round((X - tcx) * 4.8 + 600).astype(int); pj = np.round((Z - tcz) * 4.8 + 600).astype(int)
        ok = (pi >= 0) & (pi < 1200) & (pj >= 0) & (pj < 1200); MK[ok] |= m[pj[ok], pi[ok]]
    ZM = dil(MK, int(2.0 / S))
    inPB = np.zeros(X.shape, bool)
    for pb in PEBBLEBOX: inPB |= (X >= pb[0]) & (X <= pb[2]) & (Z >= pb[1]) & (Z <= pb[3])
    old_m = (warm | (pebble & inPB)) & ZM & ~KEEP
    lightRO = warm & (lum > 165) & (gr_ < 0.78)                     # the light run-off sand: never an old strip
    PROTb = (dW < 22) | (D['gravel'] < 2.0) | MKP | dil(lightRO, int(1.0 / S))
    for sb in SKIP: PROTb |= (X >= sb[0]) & (X <= sb[2]) & (Z >= sb[1]) & (Z <= sb[3])
    old_b = warm & (dA > 0) & (dA + dG <= 3.5) & ~PROTb & ~KEEP
    # the terracotta gravel strip goes even beside a run-off zone (its colour is its own: redder and darker than the light sand)
    terra = warm & (gr_ < 0.63) & (br_ < 0.46) & (lum > 45)
    PROT2 = (dW < 22) | (D['gravel'] < 2.0)
    for sb in SKIP: PROT2 |= (X >= sb[0]) & (X <= sb[2]) & (Z >= sb[1]) & (Z <= sb[3])
    old_b |= terra & (dA > 0) & (dA <= 3.0) & ~PROT2 & ~KEEP & ~MKP
    # old sand blotches lying on a lot's asphalt (small warm patches with asphalt all round them)
    import scipy.ndimage as nd
    PROT3 = (dW < 8) | (D['gravel'] < 2.0)
    for sb in SKIP: PROT3 |= (X >= sb[0]) & (X <= sb[2]) & (Z >= sb[1]) & (Z <= sb[3])
    blob = warm & (lum > 70) & ~KEEP & (dA > 2.5) & ~PROT3 & ~(warm & (lum > 165) & (gr_ < 0.78))   # (a 17. 10. makadam ribbon lying alone on a lot's asphalt goes too; not the sand at a road's kerbs)
    lab, nb_ = nd.label(blob)
    # per cell: lot asphalt all round it (3 m), no grass near (a ribbon running off the lot onto the grass is cut at the lot's edge)
    nb_m = (~blob).astype(np.float32); den = np.maximum(gauss(nb_m, 1.5 / S), 1e-3)
    lotlike = np.maximum(asphc0, ((C.min(-1) > 185) & (sat < 0.15)).astype(np.float32))
    nbA = gauss(lotlike * nb_m, 1.5 / S) / den; nbG = gauss((grass & ~blob).astype(np.float32), 1.5 / S) / den
    lotb = blob & (nbA > 0.5) & (nbG < 0.08)
    lotb &= ~((X >= -16) & (X <= 0) & (Z >= 148) & (Z <= 182))      # the dirt road to the jetty, where it crosses the parking strip
    inLB = np.zeros(X.shape, bool)
    for lb in LOTBOX: inLB |= (X >= lb[0]) & (X <= lb[2]) & (Z >= lb[1]) & (Z <= lb[3])
    lbx = inLB & ~KEEP & ~((sat < 0.17) & (lum > 55) & (lum < 150) & ~grass) & (lum > 40)
    lbx = dil(lbx, 2) & inLB & ~KEEP
    ERASE = old_m | old_b | lotb | lbx
    # shadowed bits of a strip and the strip's soft edge into the grass: next to what goes, not grass, not kept
    near = dil(ERASE, int(0.75 / S))
    grassS = (g > r + 12) & (g > b + 20)                            # clearly grass
    mix = near & ~grassS & ~KEEP & (lum > 35) & ~((sat < 0.17) & (lum < 150)) & (~PROTb | ZM)
    paint = (ERASE | mix) & (np.abs(X - cx) <= HALF) & (np.abs(Z - cz) <= HALF)
    # what lies under it: the grass, or (on a parking lot / yard) the asphalt round it: the nearer of the two, the lot only well off the roads
    asphc = (sat < 0.17) & (lum > 55) & (lum < 150) & ~grass & ~((C.min(-1) > 195))
    lotS = asphc & (dA > 1.5) & ~dil(paint, 1) & ~KEEP
    dGr = edt(grass & ~paint, cap=60) * (S / 0.5); dLo = edt(lotS, cap=60) * (S / 0.5)
    # under the old sand: asphalt where the asphalt round it closes over it (a lane's ring under a path's sand), else the nearer of the two
    import scipy.ndimage as nd
    asphClosed = nd.binary_closing(lotS | (dA <= 0), structure=np.ones((3, 3), bool), iterations=int(2.5 / S))
    onlot = paint & asphClosed & ~(dA <= 0) & ZM & (dLo < 3)
    for lb in LOTBOX: onlot |= paint & (X >= lb[0]) & (X <= lb[2]) & (Z >= lb[1]) & (Z <= lb[3])
    onlot |= paint & dil(lotb, int(1 / S))                      # a blotch on a lot: the lot's asphalt
    def classfill(seed, aniso):
        wl = gauss(np.where(seed, lum, 0), 4 / S) / np.maximum(gauss(seed.astype(np.float32), 4 / S), 1e-3)
        lit = seed & (lum > 0.78 * wl)
        def nb(sx, sz):
            if aniso: d = gauss2(lit, sx / S, sz / S); return np.stack([gauss2(np.where(lit, C[..., c], 0), sx / S, sz / S) for c in range(3)], -1) / np.maximum(d, 1e-4)[..., None], d
            d = gauss(lit.astype(np.float32), sx / S); return np.stack([gauss(np.where(lit, C[..., c], 0), sx / S) for c in range(3)], -1) / np.maximum(d, 1e-4)[..., None], d
        if aniso: (G1, d1), (G2, d2), (G3, d3) = nb(4.0, 0.35), nb(8.0, 1.0), nb(20.0, 3.0)
        else: (G1, d1), (G2, d2), (G3, d3) = nb(1.5, 0), nb(4.0, 0), nb(10.0, 0)
        GC = np.where((d1 > 0.04)[..., None], G1, np.where((d2 > 0.02)[..., None], G2, G3))
        lG = 0.3 * GC[..., 0] + 0.59 * GC[..., 1] + 0.11 * GC[..., 2]
        gsh = np.clip(lum / np.maximum(lG, 1), 0.3, 1.05)
        shw = gauss(seed.astype(np.float32), 0.8 / S); shs = gauss(np.where(seed, gsh, 0), 0.8 / S) / np.maximum(shw, 1e-3)
        sh = np.where(shw > 0.05, shs, 1.0)
        if not aniso: sh = np.where(dark, sh, 1.0)          # (a lot: its own even colour, no shade carried over)
        sh = np.where(dark, np.minimum(sh, np.clip(lum / np.maximum(lG, 1) * 1.6, 0.3, 1.0)), sh)
        Rg = C / np.maximum(GC, 1); clean = ero(lit, int(2 / S)); n = int((16 if aniso else 6) / S)
        cs = gauss(clean.astype(np.float32), n / 4); cs[:n] = cs[-n:] = 0; cs[:, :n] = cs[:, -n:] = 0
        j, i = np.unravel_index(np.argmax(cs), cs.shape); j = max(0, j - n // 2); i = max(0, i - n // 2)
        Pt = np.where(clean[j:j + n, i:i + n, None], Rg[j:j + n, i:i + n], 1.0)
        Pt = np.concatenate([Pt, Pt[:, ::-1]], 1); Pt = np.concatenate([Pt, Pt[::-1]], 0)
        RG = np.tile(Pt, (NC // Pt.shape[0] + 1, NC // Pt.shape[1] + 1, 1))[:NC, :NC]
        return np.clip(GC * np.clip(RG, 0.85, 1.18) * sh[..., None], 0, 255)
    NEW = classfill(grass, True)
    onl_ext = dil(onlot, 3) & ~(paint & ~onlot)                       # the lot fill's own soft rim is lot colour too
    if onlot.any(): NEW = np.where(onl_ext[..., None], classfill(lotS, False), NEW)
    # the soft rim grows only into what is not asphalt (no green halo on a road or lot), except round the lot fill
    rim_ok = np.where(onl_ext, 1.0, (~(asphc0 > 0.5) & ~KEEP).astype(np.float32))
    A = np.maximum(paint.astype(np.float32), gauss(paint.astype(np.float32), 0.3 / S) * dil(paint, 2) * rim_ok)
    A *= sst(0.0, 0.2, dA)                                  # exact at the asphalt's edge
    A *= 1 - sst(0.1, 0.4, KERB) * (dA < 3)                  # kerbs, white lines
    A *= 1 - sst(0.2, 0.5, OBJ)
    A *= (np.abs(X - cx) <= HALF) & (np.abs(Z - cz) <= HALF)
    stats = {'lotblot_m2': round(float(lotb.sum() * S * S)), 'onlot_m2': round(float(onlot.sum() * S * S)), 'tile': k + 1, 'erase_m2': round(float(ERASE.sum() * S * S)), 'marked_m2': round(float(old_m.sum() * S * S)), 'paint_m2': round(float((A > 0.5).sum() * S * S))}
    if dbg:
        P = C * (1 - A[..., None]) + NEW * A[..., None]
        V = C.copy(); V[A > 0.5] = V[A > 0.5] * 0.35 + np.array([255, 0, 255]) * 0.65
        Image.fromarray(P.astype(np.uint8)).save('os3-after-M0%d.png' % (k + 1)); Image.fromarray(V.astype(np.uint8)).save('os3-mask-M0%d.png' % (k + 1))
    blocks = []; BS = 200
    for bj in range(0, NC, BS):
        for bi in range(0, NC, BS):
            a = A[bj:bj + BS + 1, bi:bi + BS + 1]
            if (a > 0.004).sum() == 0: continue
            c = NEW[bj:bj + BS + 1, bi:bi + BS + 1]
            blocks.append({'x0': float(x0 + bi * S), 'z0': float(z0 + bj * S), 'S': S, 'nx': a.shape[1], 'nz': a.shape[0],
                           'c': base64.b64encode(c.round().astype(np.uint8).tobytes()).decode(), 'a': base64.b64encode((a * 255).round().astype(np.uint8).tobytes()).decode()})
    return stats, blocks

if __name__ == '__main__':
    ks = [int(a) - 1 for a in sys.argv[1:]] or range(9)
    for k in ks:
        st, bl = tile(k); print(st, len(bl), flush=True)
        json.dump(bl, open('os3-blocks-%d.json' % (k + 1), 'w'))
