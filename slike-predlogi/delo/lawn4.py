# (pictures only) the SW bowl's inner verge by its kerb all lawn; lawn4 (19. 10. evening (3)): the low wall's real kerb blocks (rim-blocks.json) instead of a drawn line,
# the lawn right up to and under the kerb (no lime teeth, no lilac between them) -> lawn4.json
import json, base64, numpy as np
from scipy.spatial import cKDTree
S = 0.25; HW = 6.4
K = np.array([(-188.6, 127.5), (-190.0, 124.0), (-190.6, 121.0), (-190.5, 118.0), (-189.5, 115.0), (-187.5, 111.0), (-185.8, 107.5), (-183.7, 104.7), (-180, 98.7), (-176, 94.2), (-173.7, 91.7), (-171.8, 89.8), (-169.7, 90.7), (-165.7, 91.7), (-161.7, 93.3), (-158, 94.2), (-157, 94), (-153.3, 91), (-150, 88.7), (-147, 86)])
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2)
seg = np.hypot(*(np.roll(P, -1, 0) - P).T); cum = np.concatenate([[0], np.cumsum(seg)]); sd = np.arange(0, cum[-1], 0.1)
Q = np.stack([np.interp(sd, cum, np.concatenate([P[:, 0], P[:1, 0]])), np.interp(sd, cum, np.concatenate([P[:, 1], P[:1, 1]]))], 1); KD = cKDTree(Q)
X0, Z0, X1, Z1 = -200.0, 78.0, -144.0, 129.0; NX = int((X1 - X0) / S); NZ = int((Z1 - Z0) / S)
Xg, Zg = np.meshgrid(X0 + (np.arange(NX) + 0.5) * S, Z0 + (np.arange(NZ) + 0.5) * S); pts = np.stack([Xg.ravel(), Zg.ravel()], 1)
def segdist(p):
    best = np.full(len(p), 1e9); side = np.zeros(len(p))
    for a, b in zip(K[:-1], K[1:]):
        d = b - a; t = np.clip(((p - a) @ d) / (d @ d), 0, 1); q = a + t[:, None] * d; dd = np.hypot(*(p - q).T)
        cr = d[0] * (p[:, 1] - a[1]) - d[1] * (p[:, 0] - a[0]); m = dd < best; best[m] = dd[m]; side[m] = np.sign(cr[m])
    return best, side
DT = KD.query(pts)[0].reshape(NZ, NX)
RB = np.array(json.load(open('rim-blocks.json'))).reshape(-1, 4, 2); RC = RB.mean(1)
mb = (RC[:, 0] > X0 - 3) & (RC[:, 0] < X1 + 3) & (RC[:, 1] > Z0 - 3) & (RC[:, 1] < Z1 + 3); RB = RB[mb]; RC = RC[mb]
NRM = []
for c in RC:
    nb = RC[np.hypot(*(RC - c).T) < 2.6] - c; cov = nb.T @ nb; w, v = np.linalg.eigh(cov); d = v[:, -1]; n = np.array([-d[1], d[0]])
    dA, dB = KD.query([c + n * 0.45])[0][0], KD.query([c - n * 0.45])[0][0]
    if abs(dA - dB) > 0.3: low = n if dA > dB else -n
    else: low = n if np.hypot(*(c + n - (-115, 105))) < np.hypot(*(c - n - (-115, 105))) else -n
    NRM.append(low)
NRM = np.array(NRM); KR = cKDTree(RC); dR, iR = KR.query(pts)
sR = np.einsum('ij,ij->i', pts - RC[iR], NRM[iR])
dK = dR.reshape(NZ, NX); verge = (sR < 0.3).reshape(NZ, NX)
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
band = verge * (1 - sst(7.5, 8.5, dK)) * sst(HW + 2.4, HW + 3.0, DT)
paintcut = np.maximum(band, (1 - sst(1.0, 1.4, dK)) * sst(HW + 2.4, HW + 3.0, DT))
blob = 1 - sst(2.0, 2.7, np.hypot(Xg + 167.6, Zg - 84.5))
A = np.clip(np.maximum(band, blob * sst(HW + 2.4, HW + 3.0, DT)), 0, 1); A[A < 0.02] = 0
PC = np.clip(np.maximum(paintcut, A), 0, 1)
json.dump({'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ, 'm': base64.b64encode((A * 255).astype(np.uint8).tobytes()).decode(), 'p': base64.b64encode((PC * 255).astype(np.uint8).tobytes()).decode()}, open('lawn4.json', 'w'))
from PIL import Image; Image.fromarray((A * 255).astype(np.uint8)).save('lawn4-mask.png'); print('area', round(float(A.sum() * S * S), 1))
