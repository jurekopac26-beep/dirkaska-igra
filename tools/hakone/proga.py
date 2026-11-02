# The Hakone lap as the game drives it (plan: docs/proga-hakone.md, sklop 2) -> js/tracks/hakone.js (the block between the markers HK-DATA) and
# tools/hakone/podatki/proga.json (the game's line with the metres along it, for the next steps). Reads podatki/pot.json, teren.json, okolica.json.
#   python3 -I tools/hakone/proga.py
# The centre line: the OpenStreetMap line of pot.json on a 1 m grid, the Sanmaibashi junction (a single node, ~90 degrees left) rounded on an arc of
# R_SAN, smoothed (a Gaussian of SIG m along the road), then the hairpins opened as on the Irohazaka: every pair of points a metres apart along the
# road at least the chord of an R_MIN circle apart (so no bend tighter than R_MIN and the legs of a hairpin 2 R_MIN apart or more), the line held to
# the smoothed road by a spring that eases where it has to move. The points the game reads: a few metres apart in the bends, up to 10 m on the
# straights (the game's own centripetal Catmull-Rom through them: catmullRom in js/core.js, done here too, so every metre along the road below is
# the game's). Heights: pot.json's (Copernicus GLO-30, the canopy and the bridges taken out, grades capped), on the new line by the metres of the
# old one; the hairpins flatter than the legs between them (HP_F of the grade there, the height made up on the legs within the grade caps + 0.5 %).
import json, math, os, sys
import numpy as np
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'podatki'); ROOT = os.path.dirname(os.path.dirname(HERE))
JS = os.path.join(ROOT, 'js', 'tracks', 'hakone.js')
R_MIN = 10.5      # the tightest bend (m) and half the closest legs of a hairpin
R_SAN = 16.0      # the arc round the Sanmaibashi corner (m)
SIG = 4.0         # the smoothing of the OpenStreetMap line (m)
STEP = 2.0        # the working line's step (m)
HP_F = 0.45       # the share of the grade left in a hairpin
GMAX = {'1': 0.105, '732': 0.135}   # the steepest grade after the hairpins are flattened (pot.json caps the real profile at 10 % and 13 %)
H_STEP = 5.0      # the heights' step along the game's road (m)

pot = json.load(open(os.path.join(OUT, 'pot.json'))); ter = json.load(open(os.path.join(OUT, 'teren.json'))); oko = json.load(open(os.path.join(OUT, 'okolica.json')))
on = pot['osm_nodes']
NX = np.array([o[0] for o in on]); NZ = np.array([o[1] for o in on]); NS = np.array([o[2] for o in on]); L0 = float(NS[-1])
H5 = np.array(pot['h']); S5 = np.arange(len(H5)) * pot['step']
def h_at(u): return np.interp(np.asarray(u) % L0, np.concatenate([S5, [L0]]), np.concatenate([H5, H5[:1]]))
road_of = lambda u: next((r[2] for r in pot['road'] if r[0] <= (u % L0) < r[1]), '1')
cw = lambda u, c: ((u - c + L0 / 2) % L0) - L0 / 2   # (u - c along the closed lap, in [-L0/2, L0/2))

# ---------------- the line on a 1 m grid, Sanmaibashi rounded, smoothed ----------------
n1 = int(round(L0)); u1 = np.arange(n1) * (L0 / n1)
P = np.stack([np.interp(u1, NS, NX), np.interp(u1, NS, NZ)], 1)
def fillet(P, uS, Rf):
    i = int(np.argmin(np.abs(cw(u1, uS)))); C = P[i].copy()
    a = P[i] - P[i - 25]; a /= np.hypot(*a); b = P[(i + 25) % n1] - P[i]; b /= np.hypot(*b)
    th = math.acos(max(-1.0, min(1.0, float(a @ b)))); t = Rf * math.tan(th / 2)
    P1, P2 = C - a * t, C + b * t; sg = 1 if a[0] * b[1] - a[1] * b[0] > 0 else -1; O = P1 + np.array([-a[1], a[0]]) * sg * Rf
    a1 = math.atan2(P1[1] - O[1], P1[0] - O[0]); a2 = math.atan2(P2[1] - O[1], P2[0] - O[0]); da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
    m = np.abs(cw(u1, uS)) < t; f = (cw(u1[m], uS) + t) / (2 * t); ang = a1 + da * f
    P = P.copy(); P[m] = O + Rf * np.stack([np.cos(ang), np.sin(ang)], 1)
    return P, math.degrees(th)
P, san_turn = fillet(P, pot['sanmaibashi'], R_SAN)
def smooth(P, sig):
    r = int(3 * sig) + 1; k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2); k /= k.sum()
    return np.stack([np.convolve(np.concatenate([P[-r:, c], P[:, c], P[:r, c]]), k, mode='valid') for c in range(2)], 1)
P = smooth(P, SIG); REF = P.copy()   # (the smoothed road: the spring's rest)
def ref_at(u):
    uu = np.concatenate([u1, [L0]]); return np.stack([np.interp(u % L0, uu, np.concatenate([REF[:, c], REF[:1, c]])) for c in range(2)], 1)

# ---------------- the hairpins opened ----------------
def resample(P, u, n):   # the closed line P (u: its points' metres along the OSM line) every L/n m
    Q = np.vstack([P, P[:1]]); s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(Q, axis=0).T))]); L = float(s[-1])
    uu = np.unwrap(np.concatenate([u, [u[0] + L0]]), period=L0); t = np.arange(n) * (L / n)
    return np.stack([np.interp(t, s, Q[:, 0]), np.interp(t, s, Q[:, 1])], 1), np.interp(t, s, uu) % L0, L
def need(a): return 2 * R_MIN * np.sin(np.minimum(a, math.pi * R_MIN) / (2 * R_MIN))
def pairs(P, cell):   # every pair of points in neighbouring cells (i < j)
    n = len(P); c = np.floor(P / cell).astype(np.int64); key = c[:, 0] * 1000003 + c[:, 1]; order = np.argsort(key, kind='stable'); ks = key[order]; I, J = [], []
    for dx in (-1, 0, 1):
        for dz in (-1, 0, 1):
            k2 = (c[:, 0] + dx) * 1000003 + c[:, 1] + dz; lo = np.searchsorted(ks, k2, 'left'); cnt = np.searchsorted(ks, k2, 'right') - lo; tot = int(cnt.sum())
            if not tot: continue
            ii = np.repeat(np.arange(n), cnt); jj = order[np.repeat(lo, cnt) + np.arange(tot) - np.repeat(np.cumsum(cnt) - cnt, cnt)]; m = jj > ii
            I.append(ii[m]); J.append(jj[m])
    return np.concatenate(I), np.concatenate(J)
def gaps(P, h, amin):   # the pairs closer than the chord rule allows (v > 0: by how much)
    n = len(P); I, J = pairs(P, 2 * R_MIN + 0.5); di = np.abs(I - J); a = np.minimum(di, n - di) * h; m = a >= amin; I, J, a = I[m], J[m], a[m]
    D = P[I] - P[J]; d = np.hypot(D[:, 0], D[:, 1]); return I, J, a, d, need(a) - d, D
n2 = int(round(L0 / STEP)); P, u, L = resample(P, u1.copy(), n2)
ACT = np.zeros(n1)   # (where the line had to move, on the 1 m grid: the spring eased there)
for it in range(400):
    h = L / n2; I, J, a, d, v, D = gaps(P, h, 6.0)
    if it > 20 and not (v > 0).any(): break   # (every pair within the rule)
    v = v + 0.06; bad = v > 0   # (aim a little past the rule)
    push = np.zeros_like(P)
    if bad.any():
        dv = D[bad] * (0.45 * v[bad] / np.maximum(d[bad], 1e-6))[:, None]; np.add.at(push, I[bad], dv); np.add.at(push, J[bad], -dv)
        cnt = np.zeros(n2); np.add.at(cnt, I[bad], 1); np.add.at(cnt, J[bad], 1); push /= np.maximum(1, cnt ** 0.25)[:, None]
        mag = np.hypot(push[:, 0], push[:, 1]); push *= np.minimum(1, 0.6 / np.maximum(mag, 1e-9))[:, None]
        A = np.zeros(n1); A[np.round(u[np.unique(np.concatenate([I[bad], J[bad]]))]).astype(int) % n1] = 1
        ACT = np.maximum(ACT * 0.995, np.minimum(1, np.convolve(np.concatenate([A[-80:], A, A[:80]]), np.ones(161), mode='valid')))
    P = P + push
    P = P + 0.03 * (0.5 * (np.roll(P, 1, 0) + np.roll(P, -1, 0)) - P)
    k = 0.03 * (1 - 0.97 * np.interp(u, np.concatenate([u1, [L0]]), np.concatenate([ACT, ACT[:1]])))
    P = P + k[:, None] * (ref_at(u) - P)
    P, u, L = resample(P, u, n2)
_, _, _, _, v, _ = gaps(P, L / n2, 4.0)
dev = np.hypot(*(P - ref_at(u)).T)
print('Sanmaibashi: a turn of %.0f degrees on an arc of %.0f m; relaxed in %d steps: worst %.3f m inside the rule; moved from the smoothed road %.2f m on average, %.2f m at most' % (san_turn, R_SAN, it, max(0.0, float(v.max())), dev.mean(), dev.max()))
# the start line first (u = 0)
i0 = int(np.argmin(np.abs(cw(u, 0.0)))); P = np.roll(P, -i0, 0); u = np.roll(u, -i0)

# ---------------- the points the game reads, its own spline through them ----------------
def curv(P, w):
    a = np.roll(P, w, 0); b = np.roll(P, -w, 0); A_ = np.hypot(*(P - a).T); B_ = np.hypot(*(b - P).T); C_ = np.hypot(*(b - a).T)
    return 2 * ((P[:, 0] - a[:, 0]) * (b[:, 1] - a[:, 1]) - (P[:, 1] - a[:, 1]) * (b[:, 0] - a[:, 0])) / np.maximum(A_ * B_ * C_, 1e-9)
K = np.abs(curv(P, 3)); K = np.maximum.reduce([np.roll(K, s) for s in range(-6, 7)])   # (the tightest bend within 12 m)
sp = np.clip(0.9 * np.sqrt(1 / np.maximum(K, 1e-4)), 3.0, 10.0)   # (3 m in a hairpin, 10 m on a straight)
Q = np.vstack([P, P[:1]]); s2 = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(Q, axis=0).T))]); L2 = float(s2[-1])
sel = [0]; t = 0.0
while True:
    t += float(np.interp(t, s2[:-1], sp))
    if t > L2 - 0.6 * float(np.interp(t % L2, s2[:-1], sp)): break
    sel.append(t)
sel = np.array(sel)
PX, PZ = np.round(np.interp(sel, s2, Q[:, 0]), 2), np.round(np.interp(sel, s2, Q[:, 1]), 2)
PU = np.interp(sel, s2, np.unwrap(np.concatenate([u, [u[0] + L0]]), period=L0)); PU -= L0 * round(PU[0] / L0)   # (u, rising from ~0 to ~L0)
PX[0], PZ[0] = round(float(P[0, 0]), 2), round(float(P[0, 1]), 2)
def catmull(px, pz, n=32):   # js/core.js catmullRom (closed, centripetal): the dense line and each point's index in it
    N = len(px); out = []
    for i in range(N):
        p = [(px[(i + o) % N], pz[(i + o) % N]) for o in (-1, 0, 1, 2)]
        t0 = 0.0; t1 = t0 + math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) ** 0.5; t2 = t1 + math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]) ** 0.5; t3 = t2 + math.hypot(p[3][0] - p[2][0], p[3][1] - p[2][1]) ** 0.5
        T = t1 + (t2 - t1) * np.arange(n) / n
        Lp = lambda a, b, ta, tb: (((tb - T) * a[0] + (T - ta) * b[0]) / (tb - ta), ((tb - T) * a[1] + (T - ta) * b[1]) / (tb - ta))
        A1, A2, A3 = Lp(p[0], p[1], t0, t1), Lp(p[1], p[2], t1, t2), Lp(p[2], p[3], t2, t3)
        B1 = (((t2 - T) * A1[0] + (T - t0) * A2[0]) / (t2 - t0), ((t2 - T) * A1[1] + (T - t0) * A2[1]) / (t2 - t0))
        B2 = (((t3 - T) * A2[0] + (T - t1) * A3[0]) / (t3 - t1), ((t3 - T) * A2[1] + (T - t1) * A3[1]) / (t3 - t1))
        out.append(np.stack([((t2 - T) * B1[0] + (T - t1) * B2[0]) / (t2 - t1), ((t2 - T) * B1[1] + (T - t1) * B2[1]) / (t2 - t1)], 1))
    D = np.vstack(out); S = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(np.vstack([D, D[:1]]), axis=0).T))]); return D, S
GD, GS = catmull(PX, PZ); LG = float(GS[-1]); PS = GS[np.arange(len(PX)) * 32]   # (the game's lap length, each point's metres along it)
# the game's line against the working one: how far apart (to the working line's segments, every 7th point of the game's)
A_, B_ = P, np.roll(P, -1, 0); AB = B_ - A_; L2s = np.maximum((AB ** 2).sum(1), 1e-12); gap = []
for k in range(0, len(GD), 7):
    j = int(np.searchsorted(s2, GS[k] * L2 / LG)); jj = np.arange(j - 30, j + 30) % len(P); q = GD[k] - A_[jj]; t = np.clip((q * AB[jj]).sum(1) / L2s[jj], 0, 1)
    gap.append(float(np.min(np.hypot(*(q - AB[jj] * t[:, None]).T))))
print('%d points (%.1f m apart on average); the game\'s lap %.1f m (OpenStreetMap %.1f m); its line within %.2f m of the working one (mean %.3f m)' % (len(PX), LG / len(PX), LG, L0, max(gap), float(np.mean(gap))))
def s_of(q):   # metres along the OSM line (pot.json s) -> the game's metres after the start line
    q = np.asarray(q, dtype=float) % L0; return np.interp(q, np.concatenate([PU, [PU[0] + L0]]), np.concatenate([PS, [LG]]))
def u_of(s): return np.interp(np.asarray(s, dtype=float) % LG, np.concatenate([PS, [LG]]), np.concatenate([PU, [PU[0] + L0]])) % L0

# ---------------- heights ----------------
NU = int(round(LG)); SU = np.arange(NU) * (LG / NU)   # (the game's line every ~1 m: its bends)
GU = np.stack([np.interp(SU, GS[:-1], GD[:, 0]), np.interp(SU, GS[:-1], GD[:, 1])], 1); KU = curv(GU, 3)
nH = int(round(LG / H_STEP)); SH = np.arange(nH) * (LG / nH); UH = u_of(SH)
gcap = lambda add: np.array([GMAX[road_of(q)] - 0.005 + add for q in UH]) * (LG / nH)   # (the steepest rise per step: pot.json's caps, + add)
def lips(H, g):   # the mean of the largest g-Lipschitz profile below H and the smallest above it (the closed lap)
    lo = H.copy(); hi = H.copy(); n = len(H)
    for _ in range(2):
        for j in range(1, n): lo[j] = min(lo[j], lo[j - 1] + g[j]); hi[j] = max(hi[j], hi[j - 1] - g[j])
        lo[0] = min(lo[0], lo[-1] + g[0]); hi[0] = max(hi[0], hi[-1] - g[0])
        for j in range(n - 2, -1, -1): lo[j] = min(lo[j], lo[j + 1] + g[j]); hi[j] = max(hi[j], hi[j + 1] - g[j])
    return (lo + hi) / 2
H0 = lips(h_at(UH), gcap(0.0))   # (pot.json's heights on the new line, its caps again: a hairpin's arc is shorter here, its grade steeper)
kh = np.interp(SH, SU, np.abs(KU)); kh = np.maximum.reduce([np.roll(kh, s) for s in range(-2, 3)])
b = np.clip((kh - 1 / 30) / (1 / 18 - 1 / 30), 0, 1)   # (1 in a hairpin's bend, 0 below 1/30 m^-1)
b = np.clip(np.convolve(np.concatenate([b[-4:], b, b[:4]]), np.ones(9) / 9, mode='valid') * 1.6, 0, 1)   # (eased in and out over ~20 m)
def warp(f):   # the heights along a warped road: phi' = w / c between anchors (no hairpin within 150 m), w = 1 - (1 - f) b: the hairpins flatter,
    # the legs between them steeper, the heights at the anchors kept
    w = 1 - (1 - f) * b; near = np.convolve(np.concatenate([b[-30:], b, b[:30]]), np.ones(61), mode='valid') > 0
    anc = np.where(~near)[0]; phi = SH.copy()
    for a0, a1 in zip(anc, np.concatenate([anc[1:], [anc[0] + nH]])):
        if a1 - a0 < 2: continue
        idx = np.arange(a0, a1 + 1) % nH; ww = w[idx]; cum = np.concatenate([[0], np.cumsum((ww[:-1] + ww[1:]) / 2)]); cum *= (a1 - a0) / cum[-1]
        phi[idx[:-1]] = (a0 + cum[:-1]) * (LG / nH)
    return np.interp(phi % LG, SH, H0, period=LG)
def grade(H): return (np.roll(H, -1) - np.roll(H, 1)) / (2 * LG / nH)
HW = lips(warp(HP_F), gcap(0.005))   # (and every grade within the caps + 0.5 %)
gin = np.abs(grade(HW))[b > 0.9].mean(); gout = np.abs(grade(HW))[b < 0.01].mean(); gin0 = np.abs(grade(H0))[b > 0.9].mean()
print('heights %.0f..%.0f m; in the hairpins %.1f %% (were %.1f %%), elsewhere %.1f %%, steepest %.1f %%; from the model %.1f m on average' % (HW.min(), HW.max(), gin * 100, gin0 * 100, gout * 100, np.abs(grade(HW)).max() * 100,
      float(np.mean(np.abs(HW - np.interp(UH, S5, np.array(pot['h_model']))))) ))
HD = [int(round((x - HW[0]) * 100)) for x in HW]   # (centimetres above the start line: decimetres every 5 m would put 2 % steps into the grade)

# ---------------- what lies along the road, in the game's metres ----------------
r1 = lambda x: round(float(x), 1)
alt = lambda s: round(float(np.interp(s % LG, SH, HW, period=LG)), 1)   # (m above the sea)
bridges = [[r1(s_of(b0)), r1(s_of(b1))] for b0, b1, *_ in pot['bridges']]
hairpins = []   # [metres after the start line, m above the sea, 1 right / -1 left, the tightest radius (m), the road]
KR = curv(GU, 6)   # (the bends over 12 m, as the game's own curvature smooths them)
for hp in pot['hairpins']:
    s = float(s_of(hp['s'])); m = np.abs(((SU - s + LG / 2) % LG) - LG / 2) < 40; j = np.where(m)[0][np.argmax(np.abs(KU[m]))]
    hairpins.append([r1(SU[j]), alt(SU[j]), 1 if KU[j] > 0 else -1, round(1 / abs(float(KR[j])), 1), hp['road']])
HPU = [hp['s'] for hp in pot['hairpins']]
near_hp = lambda u: min(range(len(HPU)), key=lambda k: abs(HPU[k] - u))
SEVEN = (near_hp(18784.0), near_hp(19990.0))   # (the Seven Bends: the twelve hairpins from the first one below Sarusuberi to the last above Hatajuku)
# the HUD's places: metres along the OpenStreetMap line (pot.json: its places (a station, a bus stop, a quarter), hairpins and summit; a new OSM
# download moves them a little) -> the game's
PL = {'yumoto': 140.0, 'tonosawa': 1160.0, 'deyama': 1940.4, 'ohiradai': HPU[0] - 40, 'sennindai': 5095.0, 'miyanoshita': 5940.0, 'sokokura': 6700.0,
      'kowakidani': 7600.0, 'ninotaira': 8552.0, 'ashinoyu': 12935.0, 'summit': pot['summit']['s'], 'shojin': 13900.0, 'motohakone': 15314.2,
      'otama': 16106.6, 'sarusuberi': 17934.0 - 40, 'sevenbends': HPU[SEVEN[0]] - 40, 'hatajuku': 20591.8, 'sukumogawa': 22300.0,
      'yumotochaya': 23830.0, 'okuyumoto': 24055.4, 'sanmaibashi': pot['sanmaibashi'] - 30}
dd = {k: r1(s_of(v)) for k, v in PL.items()}
hud = [[r1(hairpins[SEVEN[0]][0] - 30), r1(hairpins[SEVEN[1]][0] + 25), 'chicane'], [r1(hairpins[0][0] - 28), r1(hairpins[0][0] + 28), 'bend']]
print('bridges %d, hairpins %d (the tightest r %.1f m), the Seven Bends %.0f-%.0f m' % (len(bridges), len(hairpins), min(h[3] for h in hairpins), hud[0][0], hud[0][1]))
out = {'about': 'The Hakone lap as the game drives it: made by tools/hakone/proga.py from pot.json (OpenStreetMap, ODbL 1.0; Copernicus DEM GLO-30).',
       'length': r1(LG), 'points': [[float(a), float(b)] for a, b in zip(PX, PZ)], 's': [r1(x) for x in PS], 'u': [r1(x % L0) for x in PU],
       'h_step': LG / nH, 'h': [round(float(x), 2) for x in HW], 'bridges': bridges, 'hairpins': hairpins, 'places': dd}
json.dump(out, open(os.path.join(OUT, 'proga.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

# ---------------- js/tracks/hakone.js: the block between the markers ----------------
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
dem = dict(ter['dem']); dem['base'] = round(float(HW[0]), 2)   # (the terrain's zero: the start line's height, as the road's)
pts = ','.join('[%s,%s]' % (('%.2f' % x).rstrip('0').rstrip('.'), ('%.2f' % z).rstrip('0').rstrip('.')) for x, z in zip(PX, PZ))
blk = ('  const HK = {\n'
       '    start: %s, d: %s,\n' % (J([float(PX[0]), float(PZ[0])]), J(dd)) +
       '    bridges: %s,\n' % J(bridges) +
       '    hairpins: %s,\n' % J(hairpins) +
       '    hudSigns: %s,\n' % J(hud) +
       '    h: %s,\n' % J(HD) +
       '    dem: %s,\n' % J(dem) +
       '    lc: %s,\n' % J(oko['lc']) +
       '    points: [%s],\n' % pts +
       '  };\n')
src = open(JS, encoding='utf-8').read()
a0 = src.index('// ---- HK-DATA:'); a0 = src.index('\n', a0) + 1; a1 = src.index('  // ---- HK-DATA end ----')
open(JS, 'w', encoding='utf-8').write(src[:a0] + blk + src[a1:])
print('written %s (%d KB)' % (os.path.relpath(JS, ROOT), os.path.getsize(JS) // 1024))
