# (pictures only) the circuit's, the lane's and the park road's edge ribbons after the marks of 20. 10. (eb7-D2 -> eb7-D3-ribbons.json, ebfix2.json):
# - "povsod kjer je uvoz in izvoz iz boksov naj bo črtkana črta" (and at the park path crossing the park road, where the road to the south straight
#   crosses the lane, the ring road, the dirt roads' mouths, where two of the roads meet): no kerb, no strip there - the white line dashed, the dashes
#   drawn as their own crisp pieces (1.5 m on, 1.5 m off, centred in the opening) instead of the old soft alpha;
# - along the box lanes the gap between the circuit's edge and the lane filled with the circuit's asphalt (gap strips -> ebfix2.json);
# - "robnik naj gre po črtkani črti" (the lane by the SE lot, where its north edge bulges past the circuit's inner edge, x 118..160): its edge there gone,
#   the circuit's own edge runs on (kerbjoin FOLLOW) and the lane's asphalt bulge beyond the circuit's strip covered with the beach's sand (sand strips);
# - the circuit's strip and kerb filled where the removed kiosk and the old paving had cut them (x 86..96 by the park; the south straight x -31..-10.5)
import json, base64, math, numpy as np
from scipy.spatial import cKDTree
from scipy import ndimage as nd
from roadmask import per_line
from mk18_helpers import sst
import tracks_all_mouths as TM
LN = {n: (np.asarray(P, float), hw) for n, k, P, hw in per_line() if n in ('T', 'bend', 'jump', 'nord')}
def dense(A, step):
    seg = np.hypot(*(A[1:] - A[:-1]).T); cum = np.r_[0, np.cumsum(seg)]; sd = np.arange(0, cum[-1], step)
    return np.stack([np.interp(sd, cum, A[:, 0]), np.interp(sd, cum, A[:, 1])], 1)
def resamp(P):      # (as edgeband8: 0.5 m stations from the first point, normals from np.gradient)
    seg = np.hypot(*(P[1:] - P[:-1]).T); s = np.r_[0, np.cumsum(seg)]; ss = np.arange(0, s[-1], 0.5)
    Q = np.stack([np.interp(ss, s, P[:, 0]), np.interp(ss, s, P[:, 1])], 1); T_ = np.gradient(Q, axis=0); T_ /= np.maximum(np.hypot(*T_.T), 1e-6)[:, None]
    return Q, np.stack([-T_[:, 1], T_[:, 0]], 1)
RS = {k: resamp(LN[k][0]) for k in ('T', 'bend', 'jump')}
KD = {k: cKDTree(dense(LN[k][0], 0.05)) for k in LN}
def e(k, pts): return KD[k].query(np.atleast_2d(pts))[0] - LN[k][1]
LJ = json.load(open('lanes20.json'))
# (21. 10.: "zbrisi kamikaza bokse, naredi da bo tukaj lepa trava" - its lane gone, the circuit's edge runs on there)
LANES = [(it['name'], np.array(it['p'], float), it['hw'] or 4.5) for it in LJ['lanes'] if 'apron' not in it['name'] and not it['name'].startswith('kamikaze')]
# (21. 10.: "boksi naj imajo asfaltni uvoz in izvoz tako kot drugi boksi" (the green garage's lane), "bencinska crpalka naj bo zdruzena s cesto" (its
#  ramps): their asphalt was under the grass in the pictures, now shown - their openings without the asphseen check)
ZONL = ('car lane', 'fuel station')
LANES = [(n, dense(p, 0.1), hw) for n, p, hw in LANES]; LKD = [(n, cKDTree(p), hw) for n, p, hw in LANES]
LKDO = [(n, cKDTree(p[e('T', p) > 0.3]), hw) for n, p, hw in LANES if (e('T', p) > 0.3).any()]
PA = {it['name'].split(' (')[0].split(':')[0]: (dense(np.array(it['p'], float), 0.1), it['hw']) for it in LJ['paths'] if len(it['p']) >= 2}
PATHS = {'bend': [PA['Park lane 1']], 'jump': [PA['Asphalt route']], 'T': [PA['Asphalt route']]}
PKD = {k: [(cKDTree(p), hw) for p, hw in v] for k, v in PATHS.items()}
MOUTHS = [(np.array(m, float), w) for n, m, u, w in TM.MOUTHS]
NODASH = [((118, 30, 162, 74), 'T')]      # (the circuit's inner edge along the lane's bulge by the SE lot: kerbjoin FOLLOW draws the edge there)
SANDBOX = (118, 34, 160, 64)
ZFILL = [(-60, 33, -45, 48)]
FILL = [('T', (86, -46, 96, -33)), ('T', (-31, 140, -10.5, 148))]
def dec(r):
    p = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(r['n'], r['nr'], 2).astype(float)
    c = np.frombuffer(base64.b64decode(r['c']), np.uint8).reshape(r['n'], r['nr'], 3).astype(float)
    a = np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(r['n'], r['nr']).astype(float); return p, c, a
def enc(r, p, c, a):
    r['n'], r['nr'] = int(p.shape[0]), int(p.shape[1])
    r['p'] = base64.b64encode(p.astype(np.float32).tobytes()).decode(); r['c'] = base64.b64encode(np.clip(c, 0, 255).round().astype(np.uint8).tobytes()).decode()
    r['a'] = base64.b64encode(np.clip(a, 0, 255).round().astype(np.uint8).tobytes()).decode()
R = json.load(open('eb7-D2-ribbons.json'))
D = []
for r in R:
    if r['road'] not in RS: D.append(None); continue
    p, c, a = dec(r); Q, N = RS[r['road']]; assert len(Q) == r['n'], (r['road'], len(Q), r['n'])
    sd = np.sign(np.mean(np.einsum('ij,ij->i', p[:, 0] - Q, N))); D.append([r['road'], int(sd), r['kind'], p, c, a])
# --- 1. the openings: per road and side, per station
Z = {}
for road in ('T', 'bend', 'jump'):
    Q, N = RS[road]; hw = LN[road][1]; cyc = road == 'T'
    for sd in (-1, 1):
        tp = Q + sd * N * (hw + 1.0); box = np.zeros(len(Q), bool); mouth = np.zeros(len(Q), bool)
        boxL = np.zeros(len(Q), bool)
        for n_, kd, lhw in LKD:
            if road == 'T' and n_.startswith(ZONL): boxL |= kd.query(tp)[0] < lhw + 0.8
        for n_, kd, lhw in (LKD if road == 'T' else LKDO): box |= kd.query(tp)[0] < lhw + 0.8      # (the park road's and the lane's: only the box lanes' parts out of the circuit -
                                                                                                  #  the truck lane runs into the circuit beside the lane's corner, not into the lane)
        for kd, phw in PKD.get(road, []): box |= kd.query(tp)[0] < phw + 0.6
        for other in LN:
            if other != road: mouth |= e(other, tp) < 0.0
        for m, w in MOUTHS: mouth |= np.hypot(*(tp - m).T) < w / 2 + 1.0
        for (x0, z0, x1, z1), rr in NODASH:
            if rr == road: nd_ = (tp[:, 0] > x0) & (tp[:, 0] < x1) & (tp[:, 1] > z0) & (tp[:, 1] < z1); box &= ~nd_; mouth &= ~nd_
        # (gaps under 8 m between openings closed; closing = dilate then erode)
        def close(zb, k):
            if cyc: zb = np.roll(zb, 1000)
            zb = nd.binary_erosion(nd.binary_dilation(zb, np.ones(k, bool)), np.ones(k, bool))
            return np.roll(zb, -1000) if cyc else zb
        zone = close(box | mouth, 3); zone = close(zone, 17)
        lab, nl = nd.label(zone)
        for li in range(1, nl + 1):
            if (lab == li).sum() < 3: zone[lab == li] = False
        if road != 'T':      # (the lane's and the park road's line only where it is outside the circuit's asphalt - no dashes inside it)
            lm = Q + sd * N * (hw - 0.23); zone &= e('T', lm) > 0.25
        if road == 'T':      # (only where the lane's or road's asphalt really shows beyond the edge in the latest pictures - asphseen.py: no dashes along grass)
            AS = np.array(json.load(open('asphseen.json'))[str(int(sd))]) >= 0.5
            AS = np.roll(nd.binary_closing(np.roll(AS, 1000), np.ones(7, bool)), -1000)
            z0 = zone.copy(); zone = zone & AS; zone = close(zone, 7)
            lab, nl = nd.label(zone)
            for li in range(1, nl + 1):
                if (lab == li).sum() < 6: zone[lab == li] = False
            print('  T', sd, 'opening stations kept', int(zone.sum()), 'of', int(z0.sum()))
            zone |= close(boxL, 3)
            # (21. 10., 43-3 Policija: the police lane now runs into the circuit before the train's track - no opening north of z -157.5 there)
            lmp = Q + sd * N * (hw - 0.23); zone &= ~((lmp[:, 0] > 104.0) & (lmp[:, 0] < 115.0) & (lmp[:, 1] < -157.5) & (lmp[:, 1] > -172.0))
            # (the user's green mark at the truck lane's corner (jA): the dashes along the circuit's edge on to where the lane's new line meets it)
            lm_ = Q + sd * N * (hw - 0.23); zone |= (lm_[:, 0] > 112.4) & (lm_[:, 0] < 114.2) & (lm_[:, 1] > 33.0) & (lm_[:, 1] < 36.9)
            # (21. 10., the user's orange mark at the west fork: the two openings by the island's nose one dashed line - the 5 m of edge between them off)
            for (x0_, z0_, x1_, z1_) in ZFILL:
                lm_ = Q + sd * N * (hw - 0.23); inb = (lm_[:, 0] > x0_) & (lm_[:, 0] < x1_) & (lm_[:, 1] > z0_) & (lm_[:, 1] < z1_)
                zone |= np.roll(nd.binary_closing(np.roll(zone, 1000), np.ones(31, bool)), -1000) & inb
        Z[(road, sd)] = (zone, box & zone)
        print(road, sd, 'opening stations', int(zone.sum()), 'box', int((box & zone).sum()))
# --- 2. fills (before the openings): rows at their max along the box
for i, d in enumerate(D):
    if d is None: continue
    road, sd, kind, p, c, a = d
    for rr, (x0, z0, x1, z1) in FILL:
        if rr != road or kind not in ('S', 'K'): continue
        m = (p[:, 0, 0] > x0) & (p[:, 0, 0] < x1) & (p[:, 0, 1] > z0) & (p[:, 0, 1] < z1)
        if m.sum() and a[m].max() > 0: a[m] = a[m].max(0)[None, :]
# --- 2a. (21. 10., sheet 43-4 kNW) the piece of the circuit's terracotta strip left alone on the bowl's infield (x -184..-176.5): off, as the rest there
for d in D:
    if d is None or d[0] != 'T' or d[2] not in ('S', 'B'): continue
    p, a = d[3], d[5]; x, z = p[:, 0, 0], p[:, 0, 1]; m = (x > -184.5) & (x < -176.0) & (z > 138.0) & (z < 143.5)
    if m.any(): a[m] = 0
# --- 2b. the strip under the wide kerb where the removed kiosk had cut it (x 86..96): the strip's rows as along the wide kerb (1.94..3.3 m)
for d in D:
    if d is None or d[0] != 'T' or d[2] != 'S': continue
    road, sd, kind, p, c, a = d; Q, N = RS['T']; hw = LN['T'][1]
    m = (p[:, 0, 0] > 86) & (p[:, 0, 0] < 96) & (p[:, 0, 1] > -47) & (p[:, 0, 1] < -32)
    if not m.any(): continue
    for k, o in enumerate((1.94, 3.26, 3.3)): p[m, k] = Q[m] + sd * N[m] * (hw + o)
    a[m] = np.array([255, 255, 0.0])[None, :]
# --- 3. the lane's bulge by the SE lot (x 118..160): its edge beyond the circuit's asphalt gone
for d in D:
    if d is None or d[0] != 'jump': continue
    p, a = d[3], d[5]; x, z = p[..., 0], p[..., 1]
    m = (x > SANDBOX[0]) & (x < SANDBOX[2]) & (z > SANDBOX[1]) & (z < SANDBOX[3]); eT = e('T', p.reshape(-1, 2)).reshape(x.shape)
    a[m & (eT > -0.45)] = 0
# --- 4. kerb, strip, beach off in the openings; the line's own alpha off there (crisp dashes below)
DASH = []
for d in D:
    if d is None: continue
    road, sd, kind, p, c, a = d; zone, box = Z[(road, sd)]; cyc = road == 'T'
    kill = nd.gaussian_filter1d(zone.astype(float), 0.8, mode='wrap' if cyc else 'nearest'); kill = np.maximum(kill, zone)
    if kind == 'L':
        a *= (1 - kill)[:, None]; a[zone] = 0
        lab, nl = nd.label(zone if not cyc else zone)
        if cyc and zone[0] and zone[-1]: lab[lab == lab[-1]] = lab[0]
        for li in range(1, nl + 1):
            qs = np.nonzero(lab == li)[0]
            if not len(qs): continue
            if cyc and qs[0] == 0 and qs[-1] == len(zone) - 1 and len(qs) < len(zone):      # (wrapping zone: order it from its start)
                br = np.nonzero(np.diff(qs) > 1)[0]; qs = np.r_[qs[br[0] + 1:], qs[:br[0] + 1] + len(zone)] if len(br) else qs
            q0, q1 = qs[0], qs[-1]; Lz = (q1 - q0) * 0.5 + 0.5; nd_ = max(1, int((Lz + 1.5) // 3.0)); st0 = q0 * 0.5 - 0.25 + (Lz - (nd_ * 3.0 - 1.5)) / 2
            S_ = []; AL = []
            for k in range(nd_):
                sa = st0 + 3.0 * k; sb = sa + 1.5
                for s_, al in ((sa - 0.02, 0), (sa, 1), (sa + 0.75, 1), (sb, 1), (sb + 0.02, 0)): S_.append(s_); AL.append(al)
            S_ = np.array(S_) / 0.5; nq = len(zone)
            i0 = np.floor(S_).astype(int); t = (S_ - i0)[:, None, None]; ia = (i0 % nq) if cyc else np.clip(i0, 0, nq - 1); ib = ((i0 + 1) % nq) if cyc else np.clip(i0 + 1, 0, nq - 1)
            pp = p[ia] * (1 - t) + p[ib] * t; cc = c[ia] * (1 - t[..., :1]) + c[ib] * t[..., :1]
            cc = np.where(cc.sum(-1, keepdims=True) < 30, np.array([237, 235, 240.0]), cc)
            aa = np.array(AL)[:, None] * np.array([0, 255, 255, 0.0])[None, :]
            DASH.append((road, pp, cc, aa))
    else:
        a *= (1 - kill)[:, None]
# --- 5. gap strips along the box lanes (circuit edge -> the lane's asphalt), sand strips over the lane's bulge
GAPS = []
for (road, sd), (zone, box) in Z.items():
    if not box.any(): continue
    Q, N = RS[road]; hw = LN[road][1]; offs = np.arange(0.0, 6.01, 0.1); g = np.full(len(Q), np.nan)
    for j, o in enumerate(offs):
        pt = Q + sd * N * (hw + o); inl = np.zeros(len(Q), bool)
        for n_, kd, lhw in LKD: inl |= kd.query(pt)[0] < lhw - 0.05
        g[np.isnan(g) & inl & box] = o
    lab, nl = nd.label(box & ~np.isnan(g))
    for li in range(1, nl + 1):
        qs = np.nonzero(lab == li)[0]
        if len(qs) < 3: continue
        gg = nd.maximum_filter1d(np.nan_to_num(g[qs], nan=0.0), 3)
        rows = [[(Q[q] + sd * N[q] * (hw + o_)).round(3).tolist() for o_ in (-0.22, gg[k] + 0.15, gg[k] + 0.5)] for k, q in enumerate(qs) if gg[k] > 0.05]
        if len(rows) >= 3: GAPS.append(rows)
SAND = []      # (a 0.5 m grid: alpha over the lane's bulge - its asphalt and its old kerb beyond the circuit's strip)
x0, z0, x1, z1 = SANDBOX; SS = 0.5; nx, nz = int((x1 - x0) / SS) + 1, int((z1 - z0) / SS) + 1
Xg, Zg = np.meshgrid(x0 + np.arange(nx) * SS, z0 + np.arange(nz) * SS); pts = np.stack([Xg.ravel(), Zg.ravel()], 1)
eTg = e('T', pts); eJg = e('jump', pts)
ag = sst(1.95, 2.45, eTg) * (1 - sst(1.4, 2.2, eJg)); ag = ag.reshape(nz, nx); ag = nd.gaussian_filter(ag, 0.6); ag[ag < 0.02] = 0
SAND = {'x0': x0, 'z0': z0, 'S': SS, 'nx': nx, 'nz': nz, 'a': base64.b64encode((np.clip(ag, 0, 1) * 255).round().astype(np.uint8).tobytes()).decode()}
# --- write
out = []
for r, d in zip(R, D):
    if d is not None: enc(r, d[3], d[4], d[5])
    out.append(r)
for road, pp, cc, aa in DASH:
    out.append({'road': road, 'kind': 'L', 'nr': 4, 'n': 0, 'lit': 1, 'p': '', 'c': '', 'a': ''}); enc(out[-1], pp, cc, aa)
json.dump(out, open('eb7-D3-ribbons.json', 'w'))
json.dump({'gaps': GAPS, 'sand': SAND, 'sandrgb': [229, 164, 121]}, open('ebfix2.json', 'w'))
print('ribbons', len(out), 'dash ribbons', len(DASH), 'gap strips', len(GAPS), 'sand cells', int((ag > 0).sum()))
# (a list of the openings, for checking: road, side, first and last station and where they are)
SEG = []
for (road, sd), (zone, box) in Z.items():
    Q, N = RS[road]; lab, nl = nd.label(zone)
    for li in range(1, nl + 1):
        qs = np.nonzero(lab == li)[0]; SEG.append([road, sd, int(qs[0]), int(qs[-1]), Q[qs[0]].round(1).tolist(), Q[qs[-1]].round(1).tolist()])
json.dump(SEG, open('ebfix2-seg.json', 'w'))
