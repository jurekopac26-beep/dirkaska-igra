# the asphalt roads' wide edge, now as the ORIGINAL Toskana circuit had it (user, 18. 10.: "zamenjaj rob za rob, ki je bil na original
# Toskana progi"): a white edge line at the asphalt's edge and a 2.2 m shoulder of terracotta earth outside it (colour read off the plain
# Toskana race: lit (192, 106, 75), shaded about 0.79 of it; flat, a faint variation every couple of metres), instead of the grey asphalt
# shoulder; same rules (not at junction mouths, kerbs, things). Ribbons along the game's own road lines (smooth at any angle).
# v4 (user: "nadaljuj"): round the WHOLE smaller circuit (T, the original Toskana line), both sides, as the original had it: the line
# where no kerb is, the tricolour kerb (green by the asphalt, cream, red; 1.5 m, long stripes) on the inside of every bend and on the
# outside of the hairpins (tkerb.py), the strip from the asphalt (or from the kerb's outer edge) to 2.2 m; not over paved ground beside
# the circuit (the lot, the heliport, the banked bowl), not on other roads, things, the user's wide red-white kerb (the strip beyond it)
# Colours and where it may go are read off the 9 top views after the old-sand pass (0.5 m fields):
#   line: everywhere but the junction mouths (another road), the gravel roads' joins, the beach's join, the 17. 10. makadam joins, the
#         motocross exit; shoulder: also not beside a run-off zone (wide sand); kerbs, barriers, fences and things stay on top.
import sys, json, base64, math, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, edt, sst
from roadmask import per_line, dist_lines
import oldsand3 as O
import os
EBV = os.environ.get('EBV', 'A')      # (18. 10., the user: the edge everywhere round the smaller circuit, both sides, not by the lot; the beach a little over it - 3 versions)
VW, VKW, VKM, VLINE = {'A': (2.2, 1.5, 'orig', 1), 'B': (3.4, 1.8, 'wide', 1), 'C': (3.0, 1.5, 'all', 0)}[EBV]
import tkerb
if VKM == 'wide': tkerb.make(300, 0.025, 7)
import pvn
import tracks_all_mouths as TM
MOUTH_T = [(np.array(m, np.float32), w) for n, m, u, w in TM.MOUTHS]
MOUTH_T.append((np.array([21.3, -249.2], np.float32), 7.0))      # (the park lane's NE corner by the beach: the corner kerb's arc meets the sand there, no strip between)      # (where a dirt road joins: the strip and line leave a gap its width)
def mouth_gap(x, z):
    g = 1.0
    for m, w in MOUTH_T:
        d = math.hypot(x - m[0], z - m[1]); g = min(g, sst(w / 2 + 0.5, w / 2 + 2.0, d))
    return g
TK_G, TK_C, TK_R, TK_D = [np.array(v, np.float32) for v in ((125, 163, 135), (222, 206, 175), (214, 97, 87), (164, 74, 67))]
TERRM = np.array([133, 89, 62], np.float32)      # (material colours, as world.js: dirt [0.52,0.35,0.245]; kerb #588a72 / #9daf94 / #97524a, its outer edge darkened)
TKM = {id(TK_G): np.array([88, 138, 114], np.float32), id(TK_C): np.array([157, 175, 148], np.float32), id(TK_R): np.array([151, 82, 74], np.float32), id(TK_D): np.array([112, 60, 55], np.float32)}
TK_ROWS = [(o * VKW / 1.5, c_, a_) for o, c_, a_ in [(0.0, TK_G, 1), (0.55, TK_G, 1), (0.575, TK_C, 1), (0.97, TK_C, 1), (0.995, TK_R, 1), (1.125, TK_R, 1), (1.48, TK_D, 1), (1.5, TK_D, 0)]]

WB = 2.2
TERR = np.array([192, 106, 75], np.float32)
S2 = 0.5; N2 = 500
# only where the user asked for it (Mapa 6): the S-road above the big lot, both edges; the east road, its park (west) side
EBZONES = [((-52, 34, 72, 78), 'both', 'jump'), ((-450, -450, 450, 450), 'both', 'T')]   # (the T stretch: from the user's stroke's top)
def zone_w(x, z, cx_road, road=None):
    w = 0.0
    for (x0, z0, x1, z1), side, rn in EBZONES:
        if road is not None and road != rn: continue
        e = min(x - x0, x1 - x, z - z0, z1 - z)
        if e <= 0: continue
        if side == 'west' and x > cx_road: continue
        w = max(w, min(1.0, e / 6.0))
    return w
LINES = per_line()
# where the wide red-white kerb (kerb.py) lies along the road, the terracotta shoulder goes on outside it, 1.3 m wide (on the original
# Toskana the kerbs sat on the shoulder's inner part, the earth showing beyond them)
KR = json.load(open('kerb-ribbons.json'))[0]
_kp = np.frombuffer(base64.b64decode(KR['p']), np.float32).reshape(KR['n'], KR['nr'], 2); _ka = np.frombuffer(base64.b64decode(KR['a']), np.uint8).reshape(KR['n'], KR['nr'])
_kc = _kp[:, 1:-1].reshape(-1, 2)[(_ka[:, 1:-1].reshape(-1) > 120)]
def on_kerb(x, z): return bool(len(_kc)) and float(np.min(np.hypot(_kc[:, 0] - x, _kc[:, 1] - z))) < 1.1     # (its samples sit at 0-0.16 and 1.7-2 m across)
ASPH = [l for l in LINES if l[1] == 'asph']

def fields(k):
    cx, cz = O.TT[k]; im = Image.open('sh-%s-M0%d.png' % (O.TAG, k + 1)).convert('RGB')
    x0 = cx - 125 + S2 / 2; z0 = cz - 125 + S2 / 2; X, Z = np.meshgrid(x0 + np.arange(N2) * S2, z0 + np.arange(N2) * S2)
    # the view after the old-sand pass, at 0.25 m, then 0.5 m
    S = O.S; NC = O.NC; xa = cx - 125 + S / 2; za = cz - 125 + S / 2
    C0 = np.asarray(im.resize((NC, NC), Image.BOX), np.float32); A = np.zeros((NC, NC), np.float32); Nn = np.zeros((NC, NC, 3), np.float32)
    try: bl = json.load(open('os3-blocks-%d.json' % (k + 1)))
    except Exception: bl = []
    for b in bl:
        i0 = int(round((b['x0'] - xa) / S)); j0 = int(round((b['z0'] - za) / S))
        a = np.frombuffer(base64.b64decode(b['a']), np.uint8).reshape(b['nz'], b['nx']) / 255.0
        c = np.frombuffer(base64.b64decode(b['c']), np.uint8).reshape(b['nz'], b['nx'], 3).astype(np.float32)
        sl = (slice(j0, j0 + b['nz']), slice(i0, i0 + b['nx']))
        Nn[sl] = np.where((a > A[sl])[..., None], c, Nn[sl]); A[sl] = np.maximum(A[sl], a)
    Cp = C0 * (1 - A[..., None]) + Nn * A[..., None]
    C = Cp.reshape(N2, 2, N2, 2, 3).mean((1, 3))
    F = np.asarray(im, np.float32); fr, fg, fb = F[..., 0], F[..., 1], F[..., 2]; fmx = F.max(-1); fmn = F.min(-1); fs = (fmx - fmn) / np.maximum(fmx, 1)
    fwhite = (fmn > 195) & (fs < 0.16); fred = (fr > 160) & (fg < 95) & (fb < 95)
    fkerb = fred & (np.asarray(Image.fromarray((fwhite * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)), np.float32) > 0)
    fkerb = fkerb | (fwhite & (np.asarray(Image.fromarray((fred * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)), np.float32) > 0))
    fobj = (fb > fr + 6) | ((fr > 150) & (fb < 0.28 * fr)) | (fred & ~fkerb)
    fdark = fmx < 70
    down = lambda m: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((N2, N2), Image.BOX), np.float32) / 255
    KERB = down(fkerb); OBJ = down(fobj); DK = down(fdark)
    KERB0 = KERB.copy()
    KERB = np.maximum(KERB, gauss((KERB > 0.1).astype(np.float32), 1.0 / S2) * 3)       # a kerb owns the edge for a metre round it
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b
    mx = C.max(-1); sat = (mx - C.min(-1)) / np.maximum(mx, 1)
    DL = dist_lines(X, Z, LINES)
    dA = np.minimum.reduce([DL[n] for n, kd, _, _ in ASPH]); dGv = np.minimum.reduce([DL[n] for n, kd, _, _ in LINES if kd == 'gravel'])
    grass = (g > r + 4) & (g > b + 12); water = dil(ero((b > r + 25) & (b > g), 3), 3)      # (not the blue umbrellas and roofs)
    warm = (r >= g) & (r >= b) & ~grass & (g / np.maximum(r, 1) > 0.42) & (b / np.maximum(r, 1) > 0.28) & (sat >= 0.17) & (lum > 80)
    asphc = (sat < 0.17) & (lum > 55) & (lum < 150) & ~grass
    dG = edt(grass, cap=60) * (S2 / 0.5); dW = edt(water, cap=60) * (S2 / 0.5)
    wide = warm & (dG > 4.5)
    ring = (dA > 0.4) & (dA < 3.5)
    fw = gauss((wide & ring).astype(np.float32), 2.5 / S2) / np.maximum(gauss(ring.astype(np.float32), 2.5 / S2), 1e-3)
    MKP = np.zeros(X.shape, bool)
    for L in ('mak',):
        for B in O.MK18['layers'][L]:
            a = O.dec(B['a']).reshape(B['nz'], B['nx'])
            fi = np.round((X - B['x0']) / O.MK18['S']).astype(int); fj = np.round((Z - B['z0']) / O.MK18['S']).astype(int)
            ok = (fi >= 0) & (fi < B['nx']) & (fj >= 0) & (fj < B['nz'])
            if ok.any(): MKP[ok] |= a[fj[ok], fi[ok]] > 25
    okL = sst(4.0, 8.0, dGv) * sst(12, 20, dW)      # (the 17. 10. makadam ribbons along these two roads were old verge: the user wants the edge there)
    for sb in O.SKIP: okL *= ~((X >= sb[0] - 6) & (X <= sb[2] + 6) & (Z >= sb[1] - 6) & (Z <= sb[3] + 6))
    okS = okL * sst(0.3, 0.1, fw)
    # the asphalt's colour by its edge, carried out; shadows across, from the asphalt and grass round
    ins = asphc & (dA < -0.8) & (dA > -4.5) & (KERB < 0.05)
    wl_ = gauss(np.where(ins, lum, 0), 3 / S2) / np.maximum(gauss(ins.astype(np.float32), 3 / S2), 1e-3)
    lit = ins & (lum > 0.8 * wl_)
    def nb(m, s):
        d = gauss(m.astype(np.float32), s / S2); return np.stack([gauss(np.where(m, C[..., c], 0), s / S2) for c in range(3)], -1) / np.maximum(d, 1e-4)[..., None], d
    G1, d1 = nb(lit, 2.0); G2, d2 = nb(lit, 5.0); G3, d3 = nb(lit, 12.0)
    GA = np.where((d1 > 0.03)[..., None], G1, np.where((d2 > 0.02)[..., None], G2, G3))
    lG = 0.3 * GA[..., 0] + 0.59 * GA[..., 1] + 0.11 * GA[..., 2]
    gl = gauss(np.where(grass, lum, 0), 4 / S2) / np.maximum(gauss(grass.astype(np.float32), 4 / S2), 1e-3)
    rr = np.where(grass, np.clip(lum / np.maximum(gl, 1), 0.3, 1.05), np.clip(lum / np.maximum(lG, 1), 0.3, 1.05))
    sref = (ins | grass) & ~((dA > -0.6) & (dA < WB + 0.3))
    sw = gauss(sref.astype(np.float32), 1.0 / S2); sh = np.where(sw > 0.05, gauss(np.where(sref, rr, 0), 1.0 / S2) / np.maximum(sw, 1e-3), 1.0)
    PAV = asphc & (dA > 0.3); PV = gauss(PAV.astype(np.float32), 0.75 / S2)      # (paved ground right beside a road: a lane merging, a lot, bays)
    return dict(x0=x0, z0=z0, KERB=KERB, KERB0=KERB0, OBJ=OBJ, DK=DK, okL=okL, okS=okS, GA=GA, sh=sh, DL=DL, PV=PV)

def build():
    FD = {}
    def fld(x, z):
        k = int(np.argmin([(x - a) ** 2 + (z - b) ** 2 for a, b in O.TT]))
        if k not in FD: print('fields', k + 1, flush=True); FD[k] = fields(k)
        f = FD[k]; i = int(np.clip(round((x - f['x0']) / S2), 0, N2 - 1)); j = int(np.clip(round((z - f['z0']) / S2), 0, N2 - 1)); return f, j, i
    # which tiles hold any asphalt road: all of them do; fields are made on demand
    ribbons = []
    for name, kind, P, hw in ASPH:
        # resample at 0.5 m
        seg = np.hypot(*(P[1:] - P[:-1]).T); s = np.r_[0, np.cumsum(seg)]; L = s[-1]
        ss = np.arange(0, L, 0.5); Q = np.stack([np.interp(ss, s, P[:, 0]), np.interp(ss, s, P[:, 1])], 1)
        T_ = np.gradient(Q, axis=0); T_ /= np.maximum(np.hypot(T_[:, 0], T_[:, 1]), 1e-6)[:, None]; Nrm = np.stack([-T_[:, 1], T_[:, 0]], 1)
        TI = None
        if name == 'T':      # (each sample's nearest point of the original line, for its kerbs)
            TI = np.array([int(np.argmin(np.hypot(*(tkerb.P - Q[q]).T))) for q in range(len(Q))])
        for side in (-1, 1):
            rowsL = [(-0.36, 0.0), (-0.34, 1.0), (-0.12, 1.0), (-0.10, 0.0)]
            rowsS = [(-0.12, 1.0), (VW - 0.04, 1.0), (VW, 0.0)] if name == 'T' else [(-0.01, 1.0), (WB - 0.04, 1.0), (WB, 0.0)]
            rowsB = [(round(o_, 2), 1.0) for o_ in np.arange(0.2, VW + 0.61, 0.2)]
            kinds = (('S', rowsS), ('L', rowsL)) + ((('K', TK_ROWS), ('B', rowsB)) if name == 'T' else ())
            if name == 'T':      # (where the beach lies beyond the strip: how much of the edge the sand covers, its colour there)
                BQ = np.zeros(len(Q)); BC = np.zeros((len(Q), 3))
                for q in range(len(Q)):
                    cs = [pvn.sand(Q[q, 0] + side * Nrm[q, 0] * (hw + VW + d_), Q[q, 1] + side * Nrm[q, 1] * (hw + VW + d_)) for d_ in (1.0, 2.0, 3.0, 4.0)]
                    ok_ = [c_ for c_ in cs if c_ is not None]
                    beachy = Q[q, 0] > 95 or (Q[q, 1] < -228 and Q[q, 0] > 0)      # (the beach: along the sea and north of the park; not the light run-off sand elsewhere)
                    if len(ok_) >= 3 and beachy: BQ[q] = 1.0; BC[q] = np.median(np.array(ok_), 0)
                import scipy.ndimage as nd
                BQ = nd.gaussian_filter1d(nd.grey_opening(BQ, size=11, mode='wrap'), 4.0, mode='wrap')
                fill = BC.copy(); has = BC.sum(1) > 0
                for ch in range(3): fill[:, ch] = np.interp(np.arange(len(Q)), np.nonzero(has)[0], BC[has, ch], period=len(Q)) if has.any() else 226
                BC = np.stack([nd.gaussian_filter1d(fill[:, ch], 6.0, mode='wrap') for ch in range(3)], 1)
            for kindR, rows in kinds:
                pos = []; col = []; ok = []
                for q in range(len(Q)):
                    kb = on_kerb(Q[q, 0] + side * Nrm[q, 0] * (hw + 1.0), Q[q, 1] + side * Nrm[q, 1] * (hw + 1.0))
                    kt = TI is not None and not kb and (VKM == 'all' or tkerb.kerb_side(TI[q], side))
                    if name == 'T':      # (the circuit: one paved-ground decision per sample; the first red-white fence or kerb out from the asphalt)
                        PQ = sum(pvn.pv(Q[q, 0] + side * Nrm[q, 0] * (hw + d_), Q[q, 1] + side * Nrm[q, 1] * (hw + d_)) > 0.5 for d_ in (0.8, 1.4, 2.0, 2.6, 3.2)) >= 3
                        PQ = PQ or sum(pvn.pv(Q[q, 0] + side * Nrm[q, 0] * (hw + d_), Q[q, 1] + side * Nrm[q, 1] * (hw + d_)) > 0.5 for d_ in np.arange(3.0, 14.1, 1.0)) >= 9      # (a lot a few metres off, past a strip of grass: no edge on that side either)
                        OC = 99.0
                        if not kb:
                            for d_ in np.arange(0.3, 2.45, 0.15):
                                if pvn.kerb(Q[q, 0] + side * Nrm[q, 0] * (hw + d_), Q[q, 1] + side * Nrm[q, 1] * (hw + d_)) > 0.35: OC = d_; break
                    if kindR == 'L':      # (no edge line where the ground beside is paved too: a lane joining, a lot's mouth)
                        xo = Q[q, 0] + side * Nrm[q, 0] * (hw + 1.2); zo = Q[q, 1] + side * Nrm[q, 1] * (hw + 1.2); fo, jo, io = fld(xo, zo); pvo = float(fo['PV'][jo, io]) if name == 'T' else 0.0
                    else: pvo = 0.0
                    if kindR == 'S': rows_q = [(1.94, 1.0), (3.26, 1.0), (3.3, 0.0)] if kb else rows      # (the strip runs under the tricolour kerb, as on the original)
                    else: rows_q = rows
                    for row in rows_q:
                        o, a0 = row[0], row[-1]
                        x = Q[q, 0] + side * Nrm[q, 0] * (hw + o); z = Q[q, 1] + side * Nrm[q, 1] * (hw + o)
                        zw = zone_w(x, z, Q[q, 0], name)
                        if zw <= 0 or (kindR == 'K' and not kt) or (kindR == 'L' and not VLINE) or (kindR == 'B' and BQ[q] < 0.02): pos.append((round(float(x), 2), round(float(z), 2))); col.append([0, 0, 0]); ok.append(0); continue
                        f, j, i = fld(x, z)
                        # another road's asphalt here (a junction's mouth, a lane beside): nothing
                        oth = min([f['DL'][n][j, i] for n, kd, _, _ in ASPH if n != name] + [40.0])
                        if name == 'T':      # (the circuit: masks from the current views only - paved ground, the red-white kerbs standing there, dirt-road mouths)
                            a = a0 * mouth_gap(x, z) * sst(0.0, 0.6, oth) * (0.0 if PQ else 1.0) * (0.0 if (kindR != 'L' and o > OC - 0.25) else 1.0) * (1 - sst(0.2, 0.5, pvn.blue(x, z)))      # (not okL: its 'water' took the park's blue pools)
                            if kindR == 'L':
                                xw = Q[q, 0] + side * Nrm[q, 0] * (hw - 0.23); zw_ = Q[q, 1] + side * Nrm[q, 1] * (hw - 0.23)
                                wl = max(pvn.white(xw + side * Nrm[q, 0] * d_, zw_ + side * Nrm[q, 1] * d_) for d_ in (-0.5, -0.25, 0.0, 0.25, 0.5))
                                a *= (0.0 if (kb or kt) else 1.0) * (1 - sst(0.2, 0.45, pvn.red(x, z))) * (1 - sst(0.2, 0.45, wl))   # (not beside a white line already there)
                            if kindR == 'B':
                                s_ = q * 0.5; n1 = 0.5 + 0.5 * math.sin(s_ * 0.21 + 1.3 + side) * math.sin(s_ * 0.057 + 0.4); n2 = 0.5 + 0.5 * math.sin(s_ * 0.9 + 2 * side)
                                cov = (0.42 + 0.30 * n1 + 0.06 * n2) * (VW + (VKW * 0.35 if kt else 0.0))      # (from the outside in: 40-80 % of the strip, now and then onto the kerb's red)
                                cB = VW - cov
                                a = BQ[q] * sst(cB - 0.35, cB + 0.35, o) * (0.0 if PQ else 1.0) * mouth_gap(x, z) * (0.85 + 0.15 * math.sin(s_ * 2.3 + o * 3.0))
                                c = BC[q]
                                pos.append((round(float(x), 2), round(float(z), 2))); col.append([int(np.clip(v, 0, 255)) for v in c]); ok.append(int(round(np.clip(a, 0, 1) * 255))); continue
                            if kindR == 'L': c = np.array([237, 235, 240])
                            elif kindR == 'K': c = TKM[id(row[1])]
                            else: c = TERRM * (1 + 0.035 * math.sin(q * 0.5 * 0.37 + side) * math.sin(q * 0.5 * 0.11 + 2.0))
                            pos.append((round(float(x), 2), round(float(z), 2))); col.append([int(np.clip(v, 0, 255)) for v in c]); ok.append(int(round(a * 255))); continue
                        a = a0 * zw * f['okL'][j, i] * sst(0.0, 0.6, oth)
                        if kindR == 'S' and name == 'T':      # (on the circuit the strip is depth-tested: things standing on it hide it themselves; shadows do not cut it)
                            a *= (1 - sst(0.3, 0.6, f['KERB0'][j, i]) * (0 if kb else 1)) * (0.0 if f['OBJ'][j, i] > 0.45 else 1.0) * (1 - sst(0.25, 0.55, f['PV'][j, i]))
                        elif kindR == 'S': a *= (1 - sst(0.3, 0.6, f['KERB0'][j, i]) * (0 if kb else 1)) * (1 - sst(0.2, 0.5, f['OBJ'][j, i])) * (1 - sst(0.4, 0.7, f['DK'][j, i])) * (1 - sst(0.25, 0.55, f['PV'][j, i]))
                        elif kindR == 'L': a *= (1 - sst(0.3, 0.6, f['OBJ'][j, i])) * (1 - sst(0.3, 0.6, f['KERB0'][j, i])) * (0.0 if (kb or kt) else 1.0) * (1 - sst(0.15, 0.4, pvo))
                        else: a *= (1 - sst(0.3, 0.6, f['OBJ'][j, i])) * (1 - sst(0.3, 0.6, f['KERB0'][j, i])) * (1 - sst(0.25, 0.55, f['PV'][j, i]))
                        if name == 'T' and kindR != 'L':      # (the current views' paved ground; read 0.6 m out at least, off the circuit's own asphalt)
                            oo = max(o, 0.6); a *= 1 - sst(0.15, 0.4, pvn.pv(Q[q, 0] + side * Nrm[q, 0] * (hw + oo), Q[q, 1] + side * Nrm[q, 1] * (hw + oo)))
                        shv = f['sh'][j, i]
                        if kindR == 'L': c = np.array([255, 255, 255]) * np.clip(shv, 0.45, 1.0)
                        elif kindR == 'K': c = row[1] * np.clip(shv, 0.45, 1.0)
                        else: c = TERR * np.clip(shv, 0.45, 1.0) * (1 + 0.035 * math.sin(q * 0.5 * 0.37 + side) * math.sin(q * 0.5 * 0.11 + 2.0))
                        pos.append((round(float(x), 2), round(float(z), 2))); col.append([int(np.clip(v, 0, 255)) for v in c]); ok.append(int(round(a * 255)))
                ribbons.append({'road': name, 'side': side, 'kind': kindR, 'nr': len(rows), 'n': len(Q), 'p': pos, 'c': col, 'a': ok, 'lit': 1 if (name == 'T' and kindR != 'B') else 0})
        print(name, 'done', flush=True)
    return ribbons

if __name__ == '__main__':
    R = build()
    # pack: flat arrays
    out = []
    import scipy.ndimage as nd
    for r in R:
        if max(r['a']) == 0: continue
        if r['road'] == 'T':      # (no fragments along the circuit: short pieces opened away, then softened)
            A = np.array(r['a'], np.float32).reshape(r['n'], r['nr'])
            A = nd.grey_opening(A, size=(7, 1), mode='wrap')      # (pieces under 3.5 m go; holes - things, mouths - stay)
            A = nd.gaussian_filter1d(A, 0.8, axis=0, mode='wrap')
            r['a'] = [int(v) for v in np.clip(A, 0, 255).round().reshape(-1)]
        out.append({'road': r['road'], 'kind': r['kind'], 'nr': r['nr'], 'n': r['n'], 'lit': r.get('lit', 0),
                    'p': base64.b64encode(np.array(r['p'], np.float32).tobytes()).decode(),
                    'c': base64.b64encode(np.array(r['c'], np.uint8).tobytes()).decode(),
                    'a': base64.b64encode(np.array(r['a'], np.uint8).tobytes()).decode()})
    json.dump(out, open('eb5-%s-ribbons.json' % EBV, 'w')); print(len(out), 'ribbons')
