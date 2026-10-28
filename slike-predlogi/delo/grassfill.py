# (pictures only) the grass sheet's holes along the circuit's (and the park road's, the lane's) edge strip where that strip is not drawn any more
# (the openings of 20. 10., the corners and links of kerbjoin hide it) and no road, lane, path or paving lies there: the light bare ground showed
# (light green patches at the kerb's ends, e.g. by the red garage, by the truck lane's corner) -> grassfill.json (rows along the edge, alpha)
import json, base64, math, numpy as np
src = open('ebfix2.py').read(); exec(src[:src.index("R = json.load(open('eb7-D2-ribbons.json'))")])
R = json.load(open('eb7-D3-ribbons.json')); R0 = json.load(open('eb7-D2-ribbons.json'))
KJ = json.load(open('kerbjoin.json'))['mask']; KM = np.frombuffer(base64.b64decode(KJ['m']), np.uint8).reshape(KJ['nz'], KJ['nx'])
def kj(pts):
    i = np.floor((pts[:, 0] - KJ['x0']) / KJ['S']).astype(int); j = np.floor((pts[:, 1] - KJ['z0']) / KJ['S']).astype(int)
    ok = (i >= 0) & (j >= 0) & (i < KJ['nx']) & (j < KJ['nz']); out = np.zeros(len(pts), bool); out[ok] = KM[j[ok], i[ok]] > 0; return out
APRON = [dense(np.array(json.loads(it['p']) if isinstance(it['p'], str) else it['p'], float), 0.1) for it in LJ['lanes'] if 'apron' in it['name']]
AKD = [cKDTree(p) for p in APRON]
ALLP = [(cKDTree(p), hw) for k, (p, hw) in PA.items() if hw and hw > 0.5]
OFFS = np.array([0.0, 0.5, 1.0, 1.5, 2.0, 2.5]); BASE = np.array([1, 1, 1, 1, 1, 0.0])
out = []
for i, r in enumerate(R):
    if r['kind'] != 'S' or r['road'] not in RS: continue
    road = r['road']; Q, N = RS[road]; hw = LN[road][1]; n, nr = int(r['n']), int(r['nr'])
    if n != len(Q): continue
    p = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(n, nr, 2).astype(float); a = np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(n, nr).astype(float)
    sd = np.sign(np.mean(np.einsum('ij,ij->i', p[:, 0] - Q, N)))
    rowpt = Q + sd * N * (hw + 1.0)
    if i >= len(R0) or R0[i]['road'] != road or R0[i]['kind'] != 'S' or int(R0[i]['n']) != n: continue
    a0 = np.frombuffer(base64.b64decode(R0[i]['a']), np.uint8).reshape(n, nr).astype(float)
    cand = (a0[:, 1] >= 128) & ((a[:, 1] < 128) | kj(rowpt))      # (a strip was drawn there before 20. 10. and is not now)
    if road == 'T': w = nd.gaussian_filter1d(cand.astype(float), 1.0, mode='wrap')
    else: w = nd.gaussian_filter1d(cand.astype(float), 1.0)
    P = Q[:, None, :] + sd * N[:, None, :] * (hw + OFFS)[None, :, None]; flat = P.reshape(-1, 2)
    ex = np.ones(len(flat))
    for k in LN:
        if k != road: ex *= sst(0.2, 0.6, e(k, flat))
    for kd, phw in ALLP: ex *= sst(0.3, 0.7, kd.query(flat)[0] - phw)
    for m, wd in MOUTHS: ex *= sst(0.3, 0.8, np.hypot(*(flat - m).T) - wd / 2)
    for kd in AKD: ex *= sst(0.2, 0.6, kd.query(flat)[0] - 4.5)
    for n_, kd, lhw in LKD: ex *= sst(0.1, 0.5, kd.query(flat)[0] - lhw)
    for (x0, z0, x1, z1) in [b for b, rr in NODASH] + [SANDBOX]:      # (the SE lot's bulge: sand and the circuit's own kerb there)
        ex *= ~((flat[:, 0] > x0 - 2) & (flat[:, 0] < x1 + 2) & (flat[:, 1] > z0 - 2) & (flat[:, 1] < z1 + 2))
    al = (w[:, None] * BASE[None, :]) * ex.reshape(P.shape[:2])
    on = al.max(1) > 0.02
    lab, nl = nd.label(on)
    for li in range(1, nl + 1):
        idx = np.flatnonzero(lab == li); s0, s1 = max(idx[0] - 1, 0), min(idx[-1] + 2, n)
        if s1 - s0 < 3: continue
        out.append({'road': road, 'p': P[s0:s1].round(3).tolist(), 'a': al[s0:s1].round(3).tolist()})
        print(road, int(sd), 'stations', s1 - s0, 'at', P[s0, 0].round(1), '->', P[s1 - 1, 0].round(1), 'max', al[s0:s1].max().round(2))
json.dump(out, open('grassfill.json', 'w'))
print('strips', len(out))
