# (pictures only) 20. 10. "naredi lepši prehod med različnima cestama": where the lane by the SE lot and the park road run into the circuit, the
# circuit's asphalt carried over theirs and faded out over 7 m from the circuit's edge (theirs is lighter) -> blend20.json (0.5 m grids, alpha)
import json, base64, numpy as np
from scipy.spatial import cKDTree
from scipy import ndimage as nd
from roadmask import per_line
from mk18_helpers import sst
LN = {n: (np.asarray(P, float), hw) for n, k, P, hw in per_line() if n in ('T', 'bend', 'jump')}
def dense(A, step):
    seg = np.hypot(*(A[1:] - A[:-1]).T); cum = np.r_[0, np.cumsum(seg)]; sd = np.arange(0, cum[-1], step)
    return np.stack([np.interp(sd, cum, A[:, 0]), np.interp(sd, cum, A[:, 1])], 1)
G = json.load(open('roads-geo.json'))
LN['bend'] = (np.array(G['R']['bend']['p'], float).reshape(-1, 2)[:116], LN['bend'][1])      # (without its hook)
KD = {k: cKDTree(dense(v[0], 0.05)) for k, v in LN.items()}
e = lambda k, p: KD[k].query(p)[0] - LN[k][1]
S = 0.5; out = []
for road in ('jump', 'bend'):
    P = dense(LN[road][0], 0.5); near = e('T', P) < (18.0 if road == 'bend' else 9.0)
    lab, n = nd.label(near)
    for li in range(1, n + 1):
        Q = P[lab == li]; x0, z0 = np.floor(Q.min(0) - 8); x1, z1 = np.ceil(Q.max(0) + 8)
        nx, nz = int((x1 - x0) / S) + 1, int((z1 - z0) / S) + 1; X, Z = np.meshgrid(x0 + np.arange(nx) * S, z0 + np.arange(nz) * S); pts = np.stack([X.ravel(), Z.ravel()], 1)
        eT = e('T', pts); eo = e(road, pts)
        a = (1 - sst(0.0, 7.0, eT)) * (1 - sst(-0.4, 0.05, eo)) * (eT > -2.0)
        # (21. 10., the user's black marks: by the beach inside the circuit the lane's bulge is under the sand - no band of the circuit's asphalt
        #  over the circuit there; at the park road's mouth by the bend (bE, x > 50) the circuit's asphalt carried 6 m and faded over 10 m more,
        #  so no lighter tongue of the park road's asphalt shows)
        X_, Z_ = pts[:, 0], pts[:, 1]
        if road == 'jump':
            box = sst(122.0, 126.0, X_) * (1 - sst(152.0, 156.0, X_)) * sst(41.0, 44.0, Z_) * (1 - sst(58.0, 61.0, Z_)); a = a * (1 - box)
            # (and not over the SE lot's terracotta strip at its corner: the bluish smear there, sheet 43-7)
            box2 = sst(146.0, 148.0, X_) * (1 - sst(161.0, 163.0, X_)) * sst(67.6, 68.6, Z_) * (1 - sst(72.5, 73.5, Z_)); a = a * (1 - box2)
        if road == 'bend' and X_.mean() > 50:
            a = (1 - sst(6.0, 16.0, eT)) * (1 - sst(-0.4, 0.05, eo)) * (eT > -2.0)
        a = a.reshape(nz, nx); a[a < 0.02] = 0
        if a.max() <= 0: continue
        out.append({'road': road, 'x0': float(x0), 'z0': float(z0), 'S': S, 'nx': nx, 'nz': nz, 'a': base64.b64encode((a * 255).round().astype(np.uint8).tobytes()).decode()})
        print(road, (x0, z0, x1, z1), 'cells', int((a > 0).sum()))
json.dump(out, open('blend20.json', 'w'))
