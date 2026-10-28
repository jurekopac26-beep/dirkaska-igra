# (pictures only) the SW bowl's inner verge by its red-white kerb all lawn (19. 10. evening): mask -> lawn2.json
import json, base64, numpy as np
from scipy.spatial import cKDTree
S = 0.25; HW = 6.4
K = np.array([(-185.5, 107.5), (-183.7, 104.7), (-180, 98.7), (-176, 94.2), (-173.7, 91.7), (-171.8, 89.8), (-169.7, 90.7), (-165.7, 91.7), (-161.7, 93.3), (-158, 94.2), (-157, 94), (-153.3, 91), (-150, 88.7), (-147, 86)])
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2)
seg = np.hypot(*(np.roll(P, -1, 0) - P).T); cum = np.concatenate([[0], np.cumsum(seg)]); sd = np.arange(0, cum[-1], 0.1)
Q = np.stack([np.interp(sd, cum, np.concatenate([P[:, 0], P[:1, 0]])), np.interp(sd, cum, np.concatenate([P[:, 1], P[:1, 1]]))], 1); KD = cKDTree(Q)
X0, Z0, X1, Z1 = -189.0, 78.0, -144.0, 110.0; NX = int((X1 - X0) / S); NZ = int((Z1 - Z0) / S)
Xg, Zg = np.meshgrid(X0 + (np.arange(NX) + 0.5) * S, Z0 + (np.arange(NZ) + 0.5) * S); pts = np.stack([Xg.ravel(), Zg.ravel()], 1)
def segdist(p):
    best = np.full(len(p), 1e9); side = np.zeros(len(p))
    for a, b in zip(K[:-1], K[1:]):
        d = b - a; t = np.clip(((p - a) @ d) / (d @ d), 0, 1); q = a + t[:, None] * d; dd = np.hypot(*(p - q).T)
        cr = d[0] * (p[:, 1] - a[1]) - d[1] * (p[:, 0] - a[0]); m = dd < best; best[m] = dd[m]; side[m] = np.sign(cr[m])
    return best, side
dK, sK = segdist(pts); _, sref = segdist(np.array([[-168.0, 86.0]])); dK = dK.reshape(NZ, NX); verge = (sK == sref[0]).reshape(NZ, NX)
DT = KD.query(pts)[0].reshape(NZ, NX)
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
band = verge * sst(0.08, 0.22, dK) * (1 - sst(3.6, 4.3, dK)) * sst(HW + 2.4, HW + 3.0, DT)
blob = 1 - sst(2.0, 2.7, np.hypot(Xg + 167.6, Zg - 84.5))
A = np.clip(np.maximum(band, blob * sst(HW + 2.4, HW + 3.0, DT)), 0, 1); A[A < 0.02] = 0
json.dump({'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ, 'm': base64.b64encode((A * 255).astype(np.uint8).tobytes()).decode()}, open('lawn2.json', 'w'))
from PIL import Image; Image.fromarray((A * 255).astype(np.uint8)).save('lawn2-mask.png'); print('area', round(float(A.sum() * S * S), 1))
