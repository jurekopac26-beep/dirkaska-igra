# (pictures only) terracotta strip overlays (19. 10. evening): A = carried on to the SE lot's edge where the grass verge was (smooth outer edge);
# C = one even strip along the north side of the road by the heliport (x -144..-100), 2.2 m past the asphalt -> terr2.json
import json, base64, numpy as np
from PIL import Image, ImageDraw
import scipy.ndimage as nd
from scipy.spatial import cKDTree
S = 0.25; HW = 6.4
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2)
# a dense centre line with arc length, for the stations
seg = np.hypot(*(np.roll(P, -1, 0) - P).T); cum = np.concatenate([[0], np.cumsum(seg)]); L = cum[-1]
sd = np.arange(0, L, 0.25); Q = np.stack([np.interp(sd, cum, np.concatenate([P[:, 0], P[:1, 0]])), np.interp(sd, cum, np.concatenate([P[:, 1], P[:1, 1]]))], 1); KD = cKDTree(Q)
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def grid(X0, Z0, X1, Z1):
    NX = int((X1 - X0) / S); NZ = int((Z1 - Z0) / S); px = lambda p: ((p[0] - X0) / S, (p[1] - Z0) / S)
    im = Image.new('L', (NX, NZ), 0); ImageDraw.Draw(im).polygon([px(p) for p in P], fill=255); INS = np.asarray(im) > 127
    Xg, Zg = np.meshgrid(X0 + (np.arange(NX) + 0.5) * S, Z0 + (np.arange(NZ) + 0.5) * S)
    D, I = KD.query(np.stack([Xg.ravel(), Zg.ravel()], 1)); return NX, NZ, INS, Xg, Zg, D.reshape(NZ, NX), sd[I].reshape(NZ, NX)
out = []
# --- A: the SE lot side
X0, Z0, X1, Z1 = 100.0, 40.0, 195.0, 145.0
NX, NZ, INS, Xg, Zg, D, ST = grid(X0, Z0, X1, Z1)
G = np.asarray(Image.open('greenpx.png')) > 127
NL = np.asarray(Image.open('nonlot.png')) > 127
GI = G & INS & (D > HW + 1.5) & (D < HW + 4.6)
NI = NL & INS & (D > HW + 2.0) & (D < HW + 4.6)
nb = int(np.ceil(L / 0.25)); wmax = np.full(nb, np.nan); act = np.zeros(nb)
si = (ST[GI] / 0.25).astype(int)
for k in si: act[k] = 1
sn = (ST[NI] / 0.25).astype(int); dn = D[NI]
for k, d in zip(sn, dn): wmax[k] = d if np.isnan(wmax[k]) else max(wmax[k], d)
act = nd.maximum_filter1d(act, 13, mode='wrap')                                  # +-1.5 m along the line
w = np.where(np.isnan(wmax), HW + 2.9, wmax); w = nd.maximum_filter1d(w, 17, mode='wrap'); w = nd.uniform_filter1d(w, 33, mode='wrap')   # envelope, smoothed over ~8 m
w = np.clip(w + 0.15, HW + 2.95, HW + 4.6); actS = nd.uniform_filter1d(act, 17, mode='wrap')                     # soft ends
k = np.clip((ST / 0.25).astype(int), 0, nb - 1)
J = np.array(json.load(open('roads-geo.json'))['R']['jump']['p'], float).reshape(-1, 2)
Js = np.concatenate([np.linspace(J[i], J[i + 1], 12, endpoint=False) for i in range(len(J) - 1)]); DJ = cKDTree(Js).query(np.stack([Xg.ravel(), Zg.ravel()], 1))[0].reshape(NZ, NX)
A = np.maximum(sst(6.2 + 0.2, 6.2 + 0.8, DJ), sst(124.0, 127.0, Xg)) * INS * sst(HW + 1.65, HW + 1.9, D) * (1 - sst(w[k] - 0.08, w[k], D)) * np.clip(actS[k] * 1.6, 0, 1) * (Xg > 100) * (Zg > 40)
A[A < 0.02] = 0; Image.fromarray((A * 255).astype(np.uint8)).save('terr2-A.png')
out.append({'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ, 'm': base64.b64encode((A * 255).astype(np.uint8).tobytes()).decode()})
print('A area', round(float(A.sum() * S * S), 1))
# --- C: the north side by the heliport
X0, Z0, X1, Z1 = -147.0, 28.0, -97.0, 50.0
NX, NZ, INS, Xg, Zg, D, ST = grid(X0, Z0, X1, Z1)
C = (~INS) * sst(HW - 0.02, HW + 0.06, D) * (1 - sst(HW + 2.12, HW + 2.22, D)) * sst(-144.5, -142.0, Xg) * (1 - sst(-101.5, -99.0, Xg))
C[C < 0.02] = 0; Image.fromarray((C * 255).astype(np.uint8)).save('terr2-C.png')
out.append({'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ, 'm': base64.b64encode((C * 255).astype(np.uint8).tobytes()).decode()})
print('C area', round(float(C.sum() * S * S), 1))
json.dump(out, open('terr2.json', 'w'))
