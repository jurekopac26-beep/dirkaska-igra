# (pictures only) where two kerbed roads meet (the circuit T, the lane by the SE lot 'jump', the park road 'bend'; version D, user 19. 10. night:
# "popravi da se robniki lepo združijo med sabo tam kjer se združujejo"): every corner between their edges rounded - a circle of radius r tangent to
# both edges; along it the same edge as on the roads (white line, tricolour kerb, rust-red strip), 2.5 m on along each road over the roads' own;
# the corner between the edges and the arc filled with the circuit's asphalt; the roads' own edge ribbons hidden in the corner -> kerbjoin.json
import json, math, numpy as np
from scipy.spatial import cKDTree
from scipy import ndimage as nd
G = json.load(open('roads-geo.json'))
def dense(A, step, closed):
    if closed: A = np.vstack([A, A[:1]])
    seg = np.hypot(*(A[1:] - A[:-1]).T); cum = np.r_[0, np.cumsum(seg)]; sd = np.arange(0, cum[-1], step)
    return np.stack([np.interp(sd, cum, A[:, 0]), np.interp(sd, cum, A[:, 1])], 1)
ROADS = {'T': (dense(np.array(G['T']['p'], float).reshape(-1, 2), 0.05, True), 6.4, True),
         'jump': (dense(np.array(G['R']['jump']['p'], float).reshape(-1, 2), 0.05, False), 6.2, False),
         'bend': (dense(np.array(G['R']['bend']['p'], float).reshape(-1, 2)[:116], 0.05, False), 6.2, False)}      # (its last 5 points turn back on themselves inside the circuit's asphalt - a hook; up to the hook's top only)
KD = {k: cKDTree(v[0]) for k, v in ROADS.items()}
def e(k, p): return KD[k].query(np.atleast_2d(p))[0] - ROADS[k][1]
def sst(a, b, x): t = min(max((x - a) / (b - a), 0.0), 1.0); return t * t * (3 - 2 * t)
R0 = 5.0
SKIP = [(147.6, 67.7), (127.9, 46.6), (149.8, 54.8)]      # (the corner onto the lane's bulge by the SE lot: the circuit's edge runs on there - FOLLOW)
TK = [(0.0, 1), (0.55, 1), (0.575, 2), (0.97, 2), (0.995, 3), (1.125, 3), (1.48, 4), (1.5, 4)]      # (offset, colour index)
COL = {1: (88, 138, 114), 2: (157, 175, 148), 3: (151, 82, 74), 4: (112, 60, 55)}
LROWS = [(-0.36, 0), (-0.34, 1), (-0.12, 1), (-0.10, 0)]; SROWS = [(-0.12, 1), (2.16, 1), (2.2, 0)]
corners = []
for A, B in (('T', 'jump'), ('T', 'bend'), ('jump', 'bend')):
    # candidate centres: eA = eB = r, all other roads at least r off
    PA, PB = ROADS[A][0], ROADS[B][0]
    x0, x1 = max(PA[:, 0].min(), PB[:, 0].min()) - 20, min(PA[:, 0].max(), PB[:, 0].max()) + 20
    z0, z1 = max(PA[:, 1].min(), PB[:, 1].min()) - 20, min(PA[:, 1].max(), PB[:, 1].max()) + 20
    if x0 >= x1 or z0 >= z1: continue
    S = 0.25; X, Z = np.meshgrid(np.arange(x0, x1, S), np.arange(z0, z1, S)); pts = np.stack([X.ravel(), Z.ravel()], 1)
    eA = e(A, pts).reshape(X.shape); eB = e(B, pts).reshape(X.shape)
    others = [k for k in ROADS if k not in (A, B)]; eO = np.min([e(k, pts).reshape(X.shape) for k in others], 0) if others else np.full(X.shape, 99.0)
    cand = (np.abs(eA - R0) < 0.25) & (np.abs(eB - R0) < 0.25) & (eO > R0 - 0.3)
    lab, n = nd.label(cand)
    for li in range(1, n + 1):
        m = lab == li; c = np.array([X[m].mean(), Z[m].mean()])
        for it in range(30):      # (Newton on (eA - r, eB - r))
            h = 0.02; f = np.array([e(A, c)[0] - R0, e(B, c)[0] - R0])
            J = np.array([[(e(A, c + [h, 0])[0] - e(A, c - [h, 0])[0]) / (2 * h), (e(A, c + [0, h])[0] - e(A, c - [0, h])[0]) / (2 * h)],
                          [(e(B, c + [h, 0])[0] - e(B, c - [h, 0])[0]) / (2 * h), (e(B, c + [0, h])[0] - e(B, c - [0, h])[0]) / (2 * h)]])
            try: d = np.linalg.solve(J, f)
            except np.linalg.LinAlgError: break
            c = c - np.clip(d, -1, 1)
            if np.abs(f).max() < 1e-3: break
        if abs(e(A, c)[0] - R0) > 0.02 or abs(e(B, c)[0] - R0) > 0.02: continue
        # tangent points on both edges
        def foot(k, c):
            i = KD[k].query(c)[1]; p = ROADS[k][0][i]; u = (c - p) / np.linalg.norm(c - p); return p + u * ROADS[k][1], i, u
        TA, iA, uA = foot(A, c); TB, iB, uB = foot(B, c)
        def capped(k, i, u):      # (the tangent on an open road's round end cap, not along its side: no corner)
            P = ROADS[k][0]; n = len(P); t = P[min(i + 4, n - 1)] - P[max(i - 4, 0)]; t = t / max(np.linalg.norm(t), 1e-6)
            return not ROADS[k][2] and abs(float(np.dot(u, t))) > 0.3
        if capped(A, iA, uA) or capped(B, iB, uB): print('  cap', A, B, c.round(1)); continue
        ang = math.degrees(math.acos(np.clip(np.dot((TA - c) / R0, (TB - c) / R0), -1, 1)))
        if ang < 5 or ang > 175: continue
        if any(np.linalg.norm(c - q['c']) < 1.0 for q in corners): continue
        corners.append({'A': A, 'B': B, 'c': c, 'TA': TA, 'TB': TB, 'iA': int(iA), 'iB': int(iB), 'uA': uA, 'uB': uB, 'ang': ang})
print(len(corners), 'corners'); [print(q['A'], q['B'], q['c'].round(1), 'arc', round(q['ang'], 1)) for q in corners]
json.dump([{k: (v.tolist() if isinstance(v, np.ndarray) else v) for k, v in q.items()} for q in corners], open('kerbjoin-corners.json', 'w'))

# ---- ribbons, fill, hide mask
corners = [q for q in corners if R0 / math.cos(math.radians(q['ang'] / 2)) < 20]
      # (a real corner: the edges meet within 20 m; not two roads side by side)
print(len(corners), 'kept')
def edge_pt(k, j, side_u):
    P, hw, closed = ROADS[k]; n = len(P); j = j % n if closed else int(np.clip(j, 0, n - 1))
    a, b = P[max(j - 2, 0) if not closed else (j - 2) % n], P[min(j + 2, n - 1) if not closed else (j + 2) % n]; t = (b - a) / max(np.linalg.norm(b - a), 1e-6); nr = np.array([-t[1], t[0]])
    if np.dot(nr, side_u) < 0: nr = -nr
    return P[j] + nr * hw, nr
OUT = []
for q in corners:
    A, B = q['A'], q['B']; c = np.array(q['c']); TA = np.array(q['TA']); TB = np.array(q['TB'])
    w = (TA - c) + (TB - c); w /= np.linalg.norm(w)
    ts = np.arange(0, 25, 0.02); pp = c[None, :] + ts[:, None] * w[None, :]; f = np.maximum(e(A, pp), e(B, pp)); k0 = int(np.argmax(f <= 0.03)) if (f <= 0.03).any() else -1
    if k0 < 0: print('  no apex (the roads only pass by)', A, B, c.round(1), round(float(f.min()), 2)); continue
    apex = pp[k0]
    if any(np.hypot(*(apex - np.array(sk))) < 1.5 for sk in SKIP): print('  skip', A, B, apex.round(1)); continue
    def ext(k, i0, T, u):      # (2.5 m along the edge, away from the apex, ending at the tangent point)
        P = ROADS[k][0]; s1 = np.linalg.norm(edge_pt(k, i0 + 40, u)[0] - apex); s0 = np.linalg.norm(edge_pt(k, i0 - 40, u)[0] - apex); sg = 1 if s1 > s0 else -1
        pts = [edge_pt(k, i0 + sg * j, u) for j in range(50, 0, -5)]      # far .. near (0.25 m steps)
        return [(p, n) for p, n in pts]
    EA = ext(A, q['iA'], TA, np.array(q['uA'])); EB = ext(B, q['iB'], TB, np.array(q['uB']))
    a0 = math.atan2(TA[1] - c[1], TA[0] - c[0]); a1 = math.atan2(TB[1] - c[1], TB[0] - c[0]); da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
    NA = max(6, int(abs(da) * R0 / 0.25)); ARC = []
    for t in range(NA + 1):
        a = a0 + da * t / NA; p = c + R0 * np.array([math.cos(a), math.sin(a)]); ARC.append((p, (c - p) / R0))
    LINE = EA + ARC + [(p, n) for p, n in reversed(EB)]
    def rows(offs):
        return [[(p + n * min(o, R0 - 0.05)).round(3).tolist() for (o, _) in offs] for p, n in LINE]
    OUT.append({'A': A, 'B': B, 'apex': apex.round(3).tolist(), 'c': c.round(3).tolist(), 'rt': float(max(np.linalg.norm(TA - apex), np.linalg.norm(TB - apex))),
                'L': rows(LROWS), 'K': rows(TK), 'S': rows(SROWS), 'fan': [apex.round(3).tolist()] + [p.round(3).tolist() for p, n in ARC]})
    print(A, B, 'apex', apex.round(1), 'tangent length', round(OUT[-1]['rt'], 1), 'stations', len(LINE))
# where a road runs into the circuit alongside it (its edge parallel to the circuit's, a step between them - the park road's start, the lane's end
# by the SE lot, the park road's end): no corner - an S-link, the circuit's edge eased over to the road's (a smooth curve, 8-10 m), the same edge along it
# (2.5-4 m on over each road's own), the asphalt carried out to it
MERGES = [('T', 'bend', (-16.4, -16.2), 10.0, {'dash': 1}),      # (20. 10.: the box lane's entry there - "povsod kjer je uvoz in izvoz iz boksov naj bo črtkana črta": the link a dashed line only)
          ('T', 'bend', (86.9, -73.1), 8.0, {'pts': {'T': (88.6, -64.5), 'bend': (75.5, -89.5)}})]      # (20. 10. "da gre zavoj ceste lepo v loku": one long even curve from the park road's edge on its straight part to the circuit's)
# where the lane's asphalt only bulges a little past the circuit's inner edge by the SE lot (its line ends inside the circuit, its mouth is on the
# other side): the circuit's own edge on along there, unbroken, solid line; the lane's edge and the corner onto it gone
FOLLOW = [('T', (143.1, 67.4), (160.4, 70.2)), ('T', (125.6, 35.0), (156.9, 55.9))]      # (20. 10. "robnik naj gre po črtkani črti": the circuit's inner edge along the lane's bulge, x 125..157)
def tang(k, i):
    P, hw, closed = ROADS[k]; n = len(P)
    a, b = (P[(i - 8) % n], P[(i + 8) % n]) if closed else (P[max(i - 8, 0)], P[min(i + 8, n - 1)]); t = b - a; return t / max(np.linalg.norm(t), 1e-9)
def edge(k, sd):
    P, hw, closed = ROADS[k]; T_ = np.array([tang(k, i) for i in range(len(P))]); NR = np.stack([-T_[:, 1], T_[:, 0]], 1) * sd; return P + NR * hw, NR, T_
LINKS = []
for A, B, Mq, LL, *opt in MERGES:
    opt = opt[0] if opt else {}; Mq = np.array(Mq, float); info = {}
    for k, o in ((A, B), (B, A)):
        Mk = np.array(opt['pts'][k], float) if 'pts' in opt else Mq
        P = ROADS[k][0]; i0 = KD[k].query(Mk)[1]; t = tang(k, i0); sd = 1.0 if (-t[1] * (Mk - P[i0])[0] + t[0] * (Mk - P[i0])[1]) > 0 else -1.0
        E, NR, T_ = edge(k, sd); ie = int(np.argmin(np.hypot(*(E - Mk).T))); n = len(P); h = 0 if 'pts' in opt else int(round(LL / 2 / 0.05))
        idx = lambda j, n=n, cl=ROADS[k][2]: (j % n) if cl else int(np.clip(j, 0, n - 1))
        dr = 1 if e(o, E[idx(ie + 40)])[0] > e(o, E[idx(ie - 40)])[0] else -1      # (the kept edge: the side away from the other road)
        if not ROADS[k][2] and ie > n - 1 - max(2 * h, 200): dr = -1      # (by an open road's end: back along it)
        if not ROADS[k][2] and ie < max(2 * h, 200): dr = 1
        info[k] = (E, NR, T_, idx, idx(ie + dr * h), dr)
    (EA_, NA_, TA_, ixA, ia, drA), (EB_, NB_, TB_, ixB, ib, drB) = info[A], info[B]
    p0, p1 = EA_[ia], EB_[ib]; d = np.linalg.norm(p1 - p0); m0 = -drA * TA_[ia] * d; m1 = drB * TB_[ib] * d
    nH = max(8, int(d / 0.25)); H = []
    for j in range(nH + 1):
        t = j / nH; h00, h10, h01, h11 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t, -2 * t**3 + 3 * t**2, t**3 - t**2
        H.append(h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1)
    H = np.array(H); TH = np.gradient(H, axis=0); TH /= np.linalg.norm(TH, axis=1)[:, None]; NH = np.stack([-TH[:, 1], TH[:, 0]], 1)
    for j in range(len(H)):
        w = j / nH; ow = (1 - w) * NA_[ia] + w * NB_[ib]
        if np.dot(NH[j], ow) < 0: NH[j] = -NH[j]
    XA = [(EA_[ixA(ia + drA * j)], NA_[ixA(ia + drA * j)]) for j in range(80, 0, -5)]      # (4 m of the circuit's own edge before, far .. near)
    XB = [(EB_[ixB(ib + drB * j)], NB_[ixB(ib + drB * j)]) for j in range(5, 81, 5)]      # (4 m of the road's own after, near .. far)
    LINE = XA + list(zip(H, NH)) + XB
    rows = lambda offs: [[(p + n * o).round(3).tolist() for (o, _) in offs] for p, n in LINE]
    strip = [[(p - n * 2.5).round(3).tolist(), (p - n * 0.05).round(3).tolist()] for p, n in zip(H, NH)]
    LINKS.append({'A': A, 'B': B, 'H': H, 'NH': NH})
    q_ = {'A': A, 'B': B, 'link': 1, 'apex': Mq.round(3).tolist(), 'rt': float(d / 2 + 4), 'L': rows(LROWS), 'K': rows(TK), 'S': rows(SROWS), 'strip': strip}
    if opt.get('dash'):      # (a dashed line only: 1.5 m on, 1.5 m off along the link, the cuts crisp)
        PL = np.array([p for p, n in LINE]); NL = np.array([n for p, n in LINE]); sl = np.r_[0, np.cumsum(np.hypot(*np.diff(PL, axis=0).T))]; tot = sl[-1]
        nd_ = max(1, int((tot + 1.5) // 3.0)); st0 = (tot - (nd_ * 3.0 - 1.5)) / 2; SS = []; AA = []
        for k_ in range(nd_):
            sa = st0 + 3.0 * k_; sb = sa + 1.5
            for s_, al in ((sa - 0.02, 0), (sa, 1), (sa + 0.375, 1), (sa + 0.75, 1), (sa + 1.125, 1), (sb, 1), (sb + 0.02, 0)): SS.append(min(max(s_, 0), tot)); AA.append(al)
        px_ = np.interp(SS, sl, PL[:, 0]); pz_ = np.interp(SS, sl, PL[:, 1]); nx_ = np.interp(SS, sl, NL[:, 0]); nz_ = np.interp(SS, sl, NL[:, 1])
        q_['L'] = [[[round(px_[i] + nx_[i] * o, 3), round(pz_[i] + nz_[i] * o, 3)] for (o, _) in LROWS] for i in range(len(SS))]; q_['La'] = AA; q_['K'] = None; q_['S'] = None; q_['dash'] = 1
    OUT.append(q_)
    print('link', A, B, Mq, 'length', round(d, 1), 'stations', len(LINE))

for k, Pa, Pb in FOLLOW:
    Pa, Pb = np.array(Pa, float), np.array(Pb, float); P = ROADS[k][0]; i0 = KD[k].query(Pa)[1]; t = tang(k, i0)
    sd = 1.0 if (-t[1] * (Pa - P[i0])[0] + t[0] * (Pa - P[i0])[1]) > 0 else -1.0; E, NR, T_ = edge(k, sd)
    ia, ib = int(np.argmin(np.hypot(*(E - Pa).T))), int(np.argmin(np.hypot(*(E - Pb).T))); st = 5 if ib > ia else -5
    H = E[ia:ib + st:st] if st > 0 else E[ia:ib + st if ib + st >= 0 else None:st]; NH = NR[ia:ib + st:st] if st > 0 else NR[ia:ib + st if ib + st >= 0 else None:st]
    LINE = list(zip(H, NH)); rows = lambda offs: [[(p + n * o).round(3).tolist() for (o, _) in offs] for p, n in LINE]
    LINKS.append({'A': k, 'B': k, 'H': H, 'NH': NH})
    OUT.append({'A': k, 'B': k, 'link': 1, 'apex': ((Pa + Pb) / 2).round(3).tolist(), 'rt': float(np.linalg.norm(Pb - Pa) / 2 + 2), 'L': rows(LROWS), 'K': rows(TK), 'S': rows(SROWS)})
    print('follow', k, Pa, Pb, 'stations', len(LINE))

# the ends over each road's own edge laid exactly on that road's edge ribbons (eb7-D2: their 0.5 m stations, their normals), eased over the
# 2.5-4 m to this corner's own line - no step where the road's own ribbon takes over
import base64
EBR = json.load(open('eb7-D2-ribbons.json')); GR = {}      # (the roads' own rows before the 20. 10. dashes - positions only)
for r in EBR:
    gl = GR.setdefault(r['road'], [])
    if not gl or r['kind'] in gl[-1]: gl.append({})
    gl[-1][r['kind']] = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(r['n'], r['nr'], 2).astype(float)
def eb_at(road, p0):      # (the road's edge rows at the station nearest p0 - on the side nearest; interpolated along)
    best = None
    for side in GR[road]:
        K0 = side['K'][:, 0]; d = np.hypot(*(K0 - p0).T); i = int(np.argmin(d))
        if best is None or d[i] < best[0]: best = (d[i], side, i)
    d0, side, i = best; K0 = side['K'][:, 0]; n = len(K0)
    j = i + 1 if i + 1 < n and (i == 0 or np.hypot(*(K0[i + 1] - p0)) < np.hypot(*(K0[i - 1] - p0))) else i - 1
    a, b = (i, j) if j > i else (j, i); v = K0[b] - K0[a]; t = float(np.clip(np.dot(p0 - K0[a], v) / max(np.dot(v, v), 1e-9), 0, 1))
    return d0, {k: side[k][a] * (1 - t) + side[k][b] * t for k in ('L', 'K', 'S')}
def snap(q, roadA, roadB, m, full=False):
    N = len(q['K'])
    for blk, road in ((range(0, m), roadA), (range(N - m, N), roadB)):
        for qq in blk:
            w = 1.0 if full else (min(1.0, 2 * (m - qq) / m) if qq < m else min(1.0, 2 * (qq - (N - m) + 1) / m))      # (fully on the road's own rows over the outer half, eased over the inner half)
            d0, R = eb_at(road, np.array(q['K'][qq][0]))
            if d0 > 0.6: continue      # (no ribbon of that road there)
            for kk, nm_ in (('L', 'L'), ('K', 'K'), ('S', 'S')):
                if len(q[nm_][qq]) != len(R[kk]): continue
                q[nm_][qq] = [(np.array(pt) * (1 - w) + R[kk][r] * w).round(3).tolist() for r, pt in enumerate(q[nm_][qq])]
for q in OUT:
    if q.get('dash'): continue
    if not q.get('link'): snap(q, q['A'], q['B'], 10)
    elif q['A'] == q['B']: N = len(q['K']); snap(q, q['A'], q['A'], N // 2 + 1, full=True)
    else: snap(q, q['A'], q['B'], 16)

# the rust-red strip not over paved ground where a lot lies right behind the corner (the SE lot's west corner: kerb and line only there), as along the
# roads; read 0.6 m out at least (the views' paved reading is not used at the other corners: it takes their old asphalt mouths for paving)
import pvn
PAVED_AT = [(118.6, 57.0)]
for q in OUT:
    if not any(np.hypot(q['apex'][0] - a_[0], q['apex'][1] - a_[1]) < 3 for a_ in PAVED_AT): continue
    Sa = []
    for st in q['S']:
        a_, b_ = np.array(st[0]), np.array(st[1]); n = (b_ - a_) / (SROWS[1][0] - SROWS[0][0]); p = a_ - n * SROWS[0][0]
        Sa.append([round(float(r[1] * (1 - sst(0.25, 0.55, pvn.pv(*(p + n * max(r[0], 0.6)))))), 3) for r in SROWS])
    q['Sa'] = Sa
print('strip alpha: paved stations', sum(1 for q in OUT for r in q.get('Sa', []) if r[1] < 0.5))

# the hide mask (the roads' own edge ribbons in each corner), 0.2 m over all corners
xs = [p for q in OUT for p in (q['apex'][0] - q['rt'] - 3, q['apex'][0] + q['rt'] + 3)]; zs = [p for q in OUT for p in (q['apex'][1] - q['rt'] - 3, q['apex'][1] + q['rt'] + 3)]
MX0, MZ0, MS = math.floor(min(xs)), math.floor(min(zs)), 0.2; MNX, MNZ = int((max(xs) - MX0) / MS) + 1, int((max(zs) - MZ0) / MS) + 1
MX0, MZ0, MNX, MNZ = -80, -104, 1235, 901      # (one box for every run: the page's shader keeps its first box)
if not (MX0 <= min(xs) and MZ0 <= min(zs) and MX0 + MNX * MS >= max(xs) and MZ0 + MNZ * MS >= max(zs)): print('  (mask box clips)', round(min(xs), 1), round(max(xs), 1), round(min(zs), 1), round(max(zs), 1))
clipi = lambda i0, i1, j0, j1: (max(i0, 0), min(i1, MNX), max(j0, 0), min(j1, MNZ))
M = np.zeros((MNZ, MNX), np.uint8)
def side_ok(k, pts, c):      # (on the same side of road k as the point c)
    P = ROADS[k][0]; n = len(P); _, ii = KD[k].query(pts); _, ic = KD[k].query(c)
    def sg(i, p):
        t = np.array([tang(k, int(j)) for j in np.atleast_1d(i)]); v = np.atleast_2d(p) - P[np.atleast_1d(i)]; return np.sign(-t[:, 1] * v[:, 0] + t[:, 0] * v[:, 1])
    return sg(ii, pts) == sg(ic, c)[0]
for q in OUT:
    if q.get('link'): continue
    ax, az, rt = q['apex'][0], q['apex'][1], q['rt'] + 1.6      # (to inside the stretch where this corner's rows lie on the roads' own: no step where the roads' ribbons take over)
    i0, i1 = int((ax - rt - MX0) / MS), int((ax + rt - MX0) / MS) + 1; j0, j1 = int((az - rt - MZ0) / MS), int((az + rt - MZ0) / MS) + 1
    i0, i1, j0, j1 = clipi(i0, i1, j0, j1)
    X, Z = np.meshgrid(MX0 + (np.arange(i0, i1) + 0.5) * MS, MZ0 + (np.arange(j0, j1) + 0.5) * MS); pts = np.stack([X.ravel(), Z.ravel()], 1)
    m = (e(q['A'], pts) > -0.5) & (e(q['B'], pts) > -0.5) & (np.hypot(pts[:, 0] - ax, pts[:, 1] - az) < rt)
    if m.any(): mi = np.nonzero(m)[0]; m[mi] = side_ok(q['A'], pts[mi], np.array(q['c'])) & side_ok(q['B'], pts[mi], np.array(q['c']))
    M[j0:j1, i0:i1] |= (m.reshape(X.shape) * 255).astype(np.uint8)
for L_ in LINKS:
    H, NH = L_['H'], L_['NH']; x0_, x1_ = H[:, 0].min() - 4, H[:, 0].max() + 4; z0_, z1_ = H[:, 1].min() - 4, H[:, 1].max() + 4
    i0, i1 = int((x0_ - MX0) / MS), int((x1_ - MX0) / MS) + 1; j0, j1 = int((z0_ - MZ0) / MS), int((z1_ - MZ0) / MS) + 1
    i0, i1, j0, j1 = clipi(i0, i1, j0, j1)
    X, Z = np.meshgrid(MX0 + (np.arange(i0, i1) + 0.5) * MS, MZ0 + (np.arange(j0, j1) + 0.5) * MS); pts = np.stack([X.ravel(), Z.ravel()], 1)
    dd, kk = cKDTree(H).query(pts); so = np.einsum('ij,ij->i', pts - H[kk], NH[kk])      # (signed: out from the asphalt +)
    m = (kk > 0) & (kk < len(H) - 1) & (so > -2.6) & (so < 3.3) & (dd < 3.4)
    M[j0:j1, i0:i1] |= (m.reshape(X.shape) * 255).astype(np.uint8)
import base64
json.dump({'corners': OUT, 'mask': {'x0': MX0, 'z0': MZ0, 'S': MS, 'nx': MNX, 'nz': MNZ, 'm': base64.b64encode(M.tobytes()).decode()},
           'TK': [[o, COL[ci]] for o, ci in TK], 'LR': LROWS, 'SR': SROWS}, open('kerbjoin.json', 'w'))
print('mask', MNX, MNZ, int((M > 0).sum()))
