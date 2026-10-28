# where the ORIGINAL Toskana drew its tricolour kerbs (js/core.js 931-937, js/world.js 1152): T.curb where |k| > 1/190 (R < 190 m),
# grown by 5 samples (10 m) each way; drawn on the inside of every such bend, on the outside only where |k| >= 0.035 (hairpin cores)
import json, numpy as np
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2); N = len(P)
def curv(P):
    a = np.roll(P, 1, 0); b = np.roll(P, -1, 0)
    t1 = P - a; t2 = b - P; l1 = np.hypot(*t1.T); l2 = np.hypot(*t2.T)
    cr = t1[:, 0] * t2[:, 1] - t1[:, 1] * t2[:, 0]; ang = np.arcsin(np.clip(cr / (l1 * l2), -1, 1))
    return ang / ((l1 + l2) / 2)
k = curv(P)
ks = np.convolve(np.r_[k[-3:], k, k[:3]], np.ones(7) / 7, 'valid')        # (a touch smoothed: the line is a sampled spline)
curb = np.abs(ks) > 1 / 190
cd = curb.copy()
for d in range(1, 6): cd |= np.roll(curb, d) | np.roll(curb, -d)
T_ = np.roll(P, -1, 0) - np.roll(P, 1, 0); T_ /= np.hypot(*T_.T)[:, None]; NRM = np.stack([-T_[:, 1], T_[:, 0]], 1)
def _raw(i, side):
    if not cd[i]: return False
    inside = side * ks[i] > 1 / 400    # (the centre of curvature lies on +NRM when k > 0; not where the line is all but straight)
    return inside or abs(ks[i]) >= 0.035
def _clean(m, gap=5, short=5):
    """whole pieces: gaps under `gap` samples filled, pieces under `short` samples (10 m) dropped (round the loop)"""
    n = len(m); m = m.copy()
    for _ in range(2):
        for val, lim in ((False, gap), (True, short)):
            runs = []; i0 = None
            start = next((i for i in range(n) if m[i] != m[i - 1]), None)
            if start is None: break
            i = start; cur = m[start]; L = 0; seq = []
            for k in range(n):
                j = (start + k) % n
                if m[j] == cur: L += 1
                else: seq.append((cur, (j - L) % n, L)); cur = m[j]; L = 1
            seq.append((cur, (start + n - L) % n, L))
            for v, a, L in seq:
                if v == val and L < lim:
                    for t in range(L): m[(a + t) % n] = not val
    return m
KS = {s: _clean(np.array([_raw(i, s) for i in range(N)])) for s in (-1, 1)}
def kerb_side(i, side):
    """the original drew a kerb at sample i on this side (side: +1 = along NRM, -1 = against), in whole pieces"""
    return bool(KS[side][i])
if __name__ == '__main__':
    import sys
    L = {s: sum(kerb_side(i, s) for i in range(N)) * 2 for s in (-1, 1)}; print('kerb metres', L, 'curb samples', int(cd.sum()), 'of', N, 'hairpin', int((np.abs(ks) >= 0.035).sum()))
    from PIL import Image, ImageDraw
    im = Image.open('sh-tosk-wide2.png').convert('RGB'); d = ImageDraw.Draw(im)
    px = lambda x, z: (600 + (x + 15) * 1200 / 420, 600 + (z + 45) * 1200 / 420)
    for i in range(N):
        for s in (-1, 1):
            if kerb_side(i, s):
                q = P[i] + s * NRM[i] * 9.0; d.ellipse([px(*q)[0] - 2, px(*q)[1] - 2, px(*q)[0] + 2, px(*q)[1] + 2], fill=(255, 255, 0) if s > 0 else (0, 255, 255))
    im.save('tkerb-chk.png')
def make(rlim=190, hair=0.035, grow=5):
    """kerb flags for other rules (the 3 versions of 18. 10.): kerb where R < rlim (grown `grow` samples), the outside where |k| >= hair"""
    global KS
    cb = np.abs(ks) > 1 / rlim; c2 = cb.copy()
    for d in range(1, grow + 1): c2 |= np.roll(cb, d) | np.roll(cb, -d)
    def raw(i, side): return bool(c2[i]) and (side * ks[i] > 1 / 400 or abs(ks[i]) >= hair)
    KS = {s: _clean(np.array([raw(i, s) for i in range(N)])) for s in (-1, 1)}
    return KS
def fill(maxgap=10, top_z=None, top_side=1, top_max=30):
    """(19. 10., the user: "dodaj robnik še zgoraj kjer manjka") the kerbs' gaps up to `maxgap` samples closed; on the north straight (z < top_z)
    the `top_side` side's gaps up to `top_max` samples too"""
    global KS
    n = N
    for s in (-1, 1):
        m = KS[s].copy(); start = next((i for i in range(n) if m[i] != m[i - 1]), None)
        if start is None: continue
        cur = m[start]; L = 0; a = start; runs = []
        for k in range(n):
            j = (start + k) % n
            if m[j] == cur: L += 1
            else: runs.append((cur, a, L)); cur = m[j]; a = j; L = 1
        runs.append((cur, a, L))
        for v, a, L in runs:
            if v: continue
            idx = [(a + t) % n for t in range(L)]
            top = top_z is not None and s == top_side and all(P[i, 1] < top_z for i in idx)
            if L <= maxgap or (top and L <= top_max):
                for i in idx: m[i] = True
        KS[s] = m
    return KS
