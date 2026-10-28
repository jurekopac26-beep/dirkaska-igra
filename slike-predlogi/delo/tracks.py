# tyre tracks where an unpaved road (makadam, gravel, the motocross exit) joins an asphalt road (user, 18. 10.: "kot da bi nekdo večkrat
# peljal iz cross proge na cesto, v obe smeri"; "naredi take sledi povsod, kjer se makadamska cesta združi z asfaltno"): many cars leave
# the dirt road, cross to the asphalt edge and drive away along the road both ways - into the near lane one way, across to the far lane
# the other; the dirt they carry rubs off along the road; ruts on the dirt side; a dirty haze at the mouth. Ribbons (smooth at any scale).
import sys, json, base64, math, numpy as np
from PIL import Image
sys.path.insert(0, '.')
from roadmask import per_line
from mk18_helpers import sst

LINES = per_line(); ASPH = [l for l in LINES if l[1] == 'asph']
TT = [[-245, -285], [0, -285], [245, -285], [-245, -40], [0, -40], [245, -40], [-245, 205], [0, 205], [245, 205]]
_T = {}
def tile_img(k):
    if k not in _T: _T[k] = np.asarray(Image.open('sh-map28-M0%d.png' % (k + 1)).convert('RGB'), np.float32)
    return _T[k]
def sample(x, z, r=0.0):
    k = int(np.argmin([(x - a) ** 2 + (z - b) ** 2 for a, b in TT])); cx, cz = TT[k]; im = tile_img(k)
    px = int(round((x - cx) * 4.8 + 600)); pz = int(round((z - cz) * 4.8 + 600)); rr = int(round(r * 4.8))
    px = min(max(px, rr), 1199 - rr); pz = min(max(pz, rr), 1199 - rr)
    return im[pz - rr:pz + rr + 1, px - rr:px + rr + 1].reshape(-1, 3)
def bad(x, z):
    # what tracks must not cover: grass (a road line running into the tunnel), things (cones, markers, posts, blue things, gates)
    p = sample(x, z, 0.35); r, g, b = p[:, 0], p[:, 1], p[:, 2]; lum = p @ [0.3, 0.59, 0.11]
    grass = (g > r + 4) & (g > b + 12)
    thing = ((r > 150) & (b < 0.45 * r) & (g < 0.8 * r) & ~((g > 0.55 * r) & (g < 0.78 * r) & (b > 0.4 * r))) | ((r > 180) & (g > 170) & (b < 120)) | (b > r + 10) | (lum < 45)
    return float((grass | thing).mean())
def shade(x, z):
    a = sample(x, z, 0.3).mean(0); b = np.median(sample(x, z, 4.0), 0)
    la = a @ [0.3, 0.59, 0.11]; lb = b @ [0.3, 0.59, 0.11]
    return float(np.clip(la / max(lb, 1), 0.25, 1.0)) if la < 0.78 * lb else 1.0

class Road:
    def __init__(self, P, hw):
        self.P = P; self.hw = hw; seg = np.hypot(*(P[1:] - P[:-1]).T); self.SS = np.r_[0, np.cumsum(seg)]
    def at(self, s):
        P, SS = self.P, self.SS; s = float(np.clip(s, 0, SS[-1])); x = np.interp(s, SS, P[:, 0]); z = np.interp(s, SS, P[:, 1])
        s2 = min(s + 0.5, SS[-1]); s1 = max(s - 0.5, 0); dx = np.interp(s2, SS, P[:, 0]) - np.interp(s1, SS, P[:, 0]); dz = np.interp(s2, SS, P[:, 1]) - np.interp(s1, SS, P[:, 1]); l = math.hypot(dx, dz) or 1
        return np.array([x, z]), np.array([dx / l, dz / l])
    def proj(self, pt):
        a = self.P[:-1]; b = self.P[1:]; d = b - a; L2 = (d ** 2).sum(1); L2[L2 == 0] = 1
        t = np.clip(((pt - a) * d).sum(1) / L2, 0, 1); q = a + d * t[:, None]; dist = np.hypot(*(pt - q).T); i = int(np.argmin(dist))
        return self.SS[i] + t[i] * math.sqrt(L2[i]), dist[i]
def nearest_road(pt):
    best = None
    for n, k, P, hw in ASPH:
        R = Road(P, hw); s, d = R.proj(pt)
        if best is None or d - hw < best[0]: best = (d - hw, R, s, n)
    return best
def bez(p0, p1, p2, p3, n):
    t = np.linspace(0, 1, n)[:, None]; return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
def noise1(u, seed): return 0.6 + 0.4 * (0.5 + 0.5 * math.sin(u * 0.9 + seed) * math.sin(u * 0.37 + 2 * seed))

def junction(M_in, U, width=6.0, starts=None, passes=14, seed=1, dirt=None, strength=1.0, toward=None):
    """M_in: mouth (world, at the asphalt edge, middle of the dirt road); U: a point ~15 m up the dirt road; starts: optional start points"""
    rng = np.random.default_rng(seed)
    e, R, s0, rn = nearest_road(np.array(M_in, np.float32)); c0, t0 = R.at(s0)
    nrm = np.array([-t0[1], t0[0]]); nrm = nrm if np.dot(np.array(M_in) - c0, nrm) > 0 else -nrm      # towards the dirt road's side
    M0 = c0 + nrm * (R.hw + 0.2)
    up = np.array(U, np.float32) - M0; up /= max(np.linalg.norm(up), 1e-6)
    if dirt is None:
        dirt = np.median(np.vstack([sample(*(M0 + up * d), 1.5) for d in (9, 12, 15)]), 0)
    DC = np.array(dirt, np.float32) * 0.86; RC = np.array(dirt, np.float32) * 0.78
    ribs = []
    def add_rib(pts, alphas, color, rows):
        T = np.gradient(pts, axis=0); T /= np.maximum(np.hypot(T[:, 0], T[:, 1]), 1e-6)[:, None]; N = np.stack([-T[:, 1], T[:, 0]], 1)
        P_, C_, A_ = [], [], []
        for q in range(len(pts)):
            sh = shade(*pts[q]); okq = 1 - sst(0.15, 0.45, bad(*pts[q]))
            for (o, a0) in rows:
                x, z = pts[q] + N[q] * o; a0 = a0 * okq; P_.append((round(float(x), 2), round(float(z), 2))); C_.append([int(np.clip(v * sh, 0, 255)) for v in color]); A_.append(int(round(np.clip(a0 * alphas[q], 0, 1) * 255)))
        if max(A_) > 0: ribs.append({'n': len(pts), 'nr': len(rows), 'p': P_, 'c': C_, 'a': A_})
    for q in range(passes):
        dirn = 1 if q % 2 == 0 else -1
        if toward is not None: dirn = 1 if np.dot(t0, toward) > 0 else -1      # (all one way: the user's stroke)
        # each car keeps its line across the dirt (no criss-crossing): its place across the dirt road is its place along the road's edge
        lat = rng.uniform(-(min(width, 8) / 2 - 1), min(width, 8) / 2 - 1); perp = np.array([-up[1], up[0]]); sgn = 1 if np.dot(perp, t0) > 0 else -1
        if starts: st = np.array(starts[q % len(starts)], np.float32) + rng.normal(0, 0.9, 2)
        else: st = M0 + up * rng.uniform(8, 12) + perp * lat
        sm = s0 + sgn * lat * 0.8
        cm, tm = R.at(sm); nm = np.array([-tm[1], tm[0]]); nm = nm if np.dot(nm, nrm) > 0 else -nm
        M = cm + nm * (R.hw + 0.3)
        h = dirn * tm; rside = np.array([-h[1], h[0]]); tgt = (R.hw * 0.5) * (1 if np.dot(rside, nm) > 0 else -1) + rng.normal(0, 0.45)
        L1 = rng.uniform(9, 13); L2 = rng.uniform(10, 24)
        ce, te = R.at(sm + dirn * L1); ne = np.array([-te[1], te[0]]); ne = ne if np.dot(ne, nrm) > 0 else -ne
        E1 = ce + ne * tgt
        dl = np.linalg.norm(M - st)
        off = bez(st, st + (M - st) * 0.4, M + up * min(4.0, dl * 0.4), M, max(8, int(dl / 0.5)))
        on = bez(M, M - nm * 3.5 + h * 3.5, E1 - dirn * te * 4.0, E1, 40)
        tail = []
        for u in np.arange(0.5, L2, 0.5):
            cc, tt = R.at(sm + dirn * (L1 + u)); nn = np.array([-tt[1], tt[0]]); nn = nn if np.dot(nn, nrm) > 0 else -nn; tail.append(cc + nn * tgt)
        pts = np.vstack([off, on[1:], np.array(tail)])
        sl = np.r_[0, np.cumsum(np.hypot(*(pts[1:] - pts[:-1]).T))]; se = sl[len(off) - 1]
        a0 = rng.uniform(0.5, 0.75) * strength; fade = rng.uniform(14, 28)      # (softer: single tracks, not a brown band)
        on_al = np.array([a0 * (math.exp(-(u - se) / fade) if u >= se else 0.0) * noise1(u, q * 1.7) for u in sl])
        rut_al = np.array([(0.0 if u >= se else 0.32 * noise1(u, q + 3.1) * sst(0, 4, u)) for u in sl]) * strength
        T = np.gradient(pts, axis=0); T /= np.maximum(np.hypot(T[:, 0], T[:, 1]), 1e-6)[:, None]; N = np.stack([-T[:, 1], T[:, 0]], 1)
        for side in (-0.8, 0.8):
            W = pts + N * side
            add_rib(W, on_al, DC, [(-0.3, 0), (-0.15, 1), (0.15, 1), (0.3, 0)])
            add_rib(W, rut_al, RC, [(-0.2, 0), (-0.1, 1), (0.1, 1), (0.2, 0)])
        add_rib(pts, on_al * 0.2, DC, [(-1.5, 0), (-0.6, 1), (0.6, 1), (1.5, 0)])
    # the haze at the mouth: a fan over the near half of the road
    hz = []
    for u in np.arange(-10, 10.01, 0.5):
        cc, tt = R.at(s0 + u); nn = np.array([-tt[1], tt[0]]); nn = nn if np.dot(nn, nrm) > 0 else -nn; hz.append((cc, nn, u))
    P_, C_, A_ = [], [], []
    for cc, nn, u in hz:
        for o in (R.hw + 0.3, R.hw * 0.5, 0.0, -R.hw * 0.5):
            x, z = cc + nn * o; w_ = math.exp(-(u / 7.0) ** 2) * (0.2 if o > 0 else 0.1 if o == 0 else 0.0) * strength
            P_.append((round(float(x), 2), round(float(z), 2))); C_.append([int(v) for v in DC]); A_.append(int(round(w_ * 255)))
    ribs.append({'n': len(hz), 'nr': 4, 'p': P_, 'c': C_, 'a': A_})
    return ribs, {'road': rn, 'mouth': [round(float(M0[0]), 1), round(float(M0[1]), 1)], 'dirt': [int(v) for v in dirt]}

def pack(ribs, ro):
    out = []
    for r in ribs:
        out.append({'kind': 'T', 'ro': ro, 'nr': r['nr'], 'n': r['n'], 'p': base64.b64encode(np.array(r['p'], np.float32).tobytes()).decode(),
                    'c': base64.b64encode(np.array(r['c'], np.uint8).tobytes()).decode(), 'a': base64.b64encode(np.array(r['a'], np.uint8).tobytes()).decode()})
    return out

if __name__ == '__main__':
    # the motocross exit (Mapa 5): from the two lanes' ends
    ribs, info = junction((-310.0, -0.5), (-312.0, -12.0), width=14, starts=[(-321.6, -6.6), (-305.5, -13.0)], passes=16, seed=7)
    print(info, len(ribs))
    json.dump(pack(ribs, 5.4), open('trk-mx.json', 'w'))
