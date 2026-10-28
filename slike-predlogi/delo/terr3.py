# (pictures only) the terracotta strip by the SE lot as one ribbon along the circuit (19. 10. evening, 3): a clean outer edge that bends only
# slowly (no wrinkles), crisp; from the kerb's back to the lot. Stations from terr2's region A; the outer line = terr2's envelope smoothed over ~30 m.
import json, base64, numpy as np
from PIL import Image, ImageDraw
import scipy.ndimage as nd
from scipy.spatial import cKDTree
HW = 6.4
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2)
seg = np.hypot(*(np.roll(P, -1, 0) - P).T); cum = np.concatenate([[0], np.cumsum(seg)]); L = cum[-1]
sd = np.arange(0, L, 0.25); Q = np.stack([np.interp(sd, cum, np.concatenate([P[:, 0], P[:1, 0]])), np.interp(sd, cum, np.concatenate([P[:, 1], P[:1, 1]]))], 1)
T = np.gradient(Q, axis=0); T /= np.linalg.norm(T, axis=1)[:, None]; N = np.stack([-T[:, 1], T[:, 0]], 1)
def inside(x, z):
    c = False
    for i in range(len(P)):
        a, b = P[i], P[i - 1]
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]: c = not c
    return c
# region A of terr2 (the mask) -> which stations had the strip, and how far out
R = json.load(open('terr2.json'))[0]; A = np.frombuffer(base64.b64decode(R['m']), np.uint8).reshape(R['nz'], R['nx']) / 255.0
def sampleA(x, z):
    i = ((x - R['x0']) / R['S']).astype(int); j = ((z - R['z0']) / R['S']).astype(int); ok = (i >= 0) & (j >= 0) & (i < R['nx']) & (j < R['nz'])
    return np.where(ok, A[np.clip(j, 0, R['nz'] - 1), np.clip(i, 0, R['nx'] - 1)], 0)
sel = np.where((Q[:, 0] > 95) & (Q[:, 1] > 35))[0]
# the inward normal (towards the lot = inside the loop)
for k in sel[::40]:
    if not inside(*(Q[k] + N[k] * 9)): pass
sgn = np.ones(len(Q))
for k in sel: sgn[k] = 1 if inside(*(Q[k] + N[k] * 9)) else -1
Nin = N * sgn[:, None]
ds = np.arange(HW + 1.7, HW + 4.8, 0.1)
act = np.zeros(len(Q)); wout = np.full(len(Q), np.nan)
for k in sel:
    pts = Q[k] + Nin[k] * ds[:, None]; a = sampleA(pts[:, 0], pts[:, 1])
    if a.max() > 0.5: act[k] = 1; wout[k] = ds[np.where(a > 0.5)[0].max()]
# contiguous active ranges (gaps under 3 m closed), the outer line smoothed hard
act = nd.binary_closing(act > 0, structure=np.ones(13)).astype(float)
w = np.where(np.isnan(wout), np.nan, wout)
idx = np.where(act > 0)[0]
wf = np.interp(np.arange(len(Q)), idx[~np.isnan(w[idx])], w[idx][~np.isnan(w[idx])])
wf = nd.maximum_filter1d(wf, 41, mode='nearest'); wf = nd.uniform_filter1d(wf, 121, mode='nearest'); wf = nd.uniform_filter1d(wf, 61, mode='nearest')
wf = np.clip(wf, HW + 2.95, HW + 4.4)
# ribbons: one per active range, rows from the kerb's back (hw+1.7) to the outer line, a 0.12 m feather row past it
J = np.array(json.load(open('roads-geo.json'))['R']['jump']['p'], float).reshape(-1, 2)
Js = np.concatenate([np.linspace(J[i], J[i + 1], 12, endpoint=False) for i in range(len(J) - 1)]); KJ = cKDTree(Js)
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
lab, nlab = nd.label(act > 0); out = []; MR = 14
for r in range(1, nlab + 1):
    ks = np.where(lab == r)[0]
    if len(ks) < 8: continue
    ks = np.arange(ks[0] - 4, ks[-1] + 5); ks = ks[(ks >= 0) & (ks < len(Q))]; n = len(ks)
    s_rel = np.arange(n) * 0.25; ends = sst(0, 1.5, s_rel) * sst(0, 1.5, s_rel[::-1])
    xs, zs, al = [], [], []
    for jj, k in enumerate(ks):
        dset = list(np.linspace(HW + 1.7, wf[k], MR)) + [wf[k] + 0.12]
        for m, d in enumerate(dset):
            p = Q[k] + Nin[k] * d; xs.append(p[0]); zs.append(p[1])
            a = ends[jj] * (0.0 if m == MR else 1.0) * (0.0 if m == 0 and False else 1.0)
            a *= sst(6.2 + 0.2, 6.2 + 0.8, KJ.query(p)[0]) if p[0] < 127 else 1.0
            al.append(a)
    out.append({'n': n, 'm': MR + 1, 'x': [round(v, 3) for v in xs], 'z': [round(v, 3) for v in zs], 'a': [round(v, 3) for v in al]})
    print('ribbon', r, 'stations', n, 'from', Q[ks[0]].round(1), 'to', Q[ks[-1]].round(1), 'w-hw', round(float(wf[ks].min() - HW), 2), '..', round(float(wf[ks].max() - HW), 2))
json.dump(out, open('terr3.json', 'w'))
