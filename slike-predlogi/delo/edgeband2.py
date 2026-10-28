# the asphalt roads' wide edge as ribbons along the game's own road lines (smooth at any angle): a white edge line just inside the asphalt
# (0.28 m) and a 1.6 m shoulder of the same asphalt outside it, a clean edge to the grass; it covers the ragged sand and coloured bits there.
# Colours and where it may go are read off the 9 top views after the old-sand pass (0.5 m fields):
#   line: everywhere but the junction mouths (another road), the gravel roads' joins, the beach's join, the 17. 10. makadam joins, the
#         motocross exit; shoulder: also not beside a run-off zone (wide sand); kerbs, barriers, fences and things stay on top.
import sys, json, base64, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, '.')
from mk18_helpers import gauss, dil, ero, edt, sst
from roadmask import per_line, dist_lines
import oldsand3 as O

WB = 2.2
S2 = 0.5; N2 = 500
# only where the user asked for it (Mapa 6): the S-road above the big lot, both edges; the east road, its park (west) side
EBZONES = [((-52, 34, 72, 78), 'both', 'jump'), ((74, -76, 118, 26), 'west', 'T')]   # (the T stretch: from the user's stroke's top)
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
    return dict(x0=x0, z0=z0, KERB=KERB, KERB0=KERB0, OBJ=OBJ, DK=DK, okL=okL, okS=okS, GA=GA, sh=sh, DL=DL)

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
        for side in (-1, 1):
            rowsL = [(-0.46, 0.0), (-0.38, 1.0), (-0.10, 1.0), (-0.03, 0.0)]
            rowsS = [(-0.08, 1.0), (WB - 0.12, 1.0), (WB, 0.0)]
            for kindR, rows in (('S', rowsS), ('L', rowsL)):
                pos = []; col = []; ok = []
                for q in range(len(Q)):
                    for (o, a0) in rows:
                        x = Q[q, 0] + side * Nrm[q, 0] * (hw + o); z = Q[q, 1] + side * Nrm[q, 1] * (hw + o)
                        zw = zone_w(x, z, Q[q, 0], name)
                        if zw <= 0: pos.append((round(float(x), 2), round(float(z), 2))); col.append([0, 0, 0]); ok.append(0); continue
                        f, j, i = fld(x, z)
                        # another road's asphalt here (a junction's mouth): nothing
                        oth = min([f['DL'][n][j, i] for n, kd, _, _ in ASPH if n != name] + [40.0])
                        a = a0 * zw * f['okL'][j, i] * sst(0.0, 0.6, oth)      # (where asked for, the shoulder is solid: no old verge shows through)
                        if kindR == 'S': a *= (1 - sst(0.3, 0.6, f['KERB0'][j, i])) * (1 - sst(0.2, 0.5, f['OBJ'][j, i])) * (1 - sst(0.4, 0.7, f['DK'][j, i]))
                        else: a *= (1 - sst(0.3, 0.6, f['OBJ'][j, i])) * (1 - sst(0.3, 0.6, f['KERB0'][j, i]))
                        shv = f['sh'][j, i]
                        c = (np.array([228, 228, 224]) * np.clip(shv, 0.45, 1.0)) if kindR == 'L' else f['GA'][j, i] * shv
                        pos.append((round(float(x), 2), round(float(z), 2))); col.append([int(np.clip(v, 0, 255)) for v in c]); ok.append(int(round(a * 255)))
                ribbons.append({'road': name, 'side': side, 'kind': kindR, 'nr': len(rows), 'n': len(Q), 'p': pos, 'c': col, 'a': ok})
        print(name, 'done', flush=True)
    return ribbons

if __name__ == '__main__':
    R = build()
    # pack: flat arrays
    out = []
    for r in R:
        if max(r['a']) == 0: continue
        out.append({'road': r['road'], 'kind': r['kind'], 'nr': r['nr'], 'n': r['n'],
                    'p': base64.b64encode(np.array(r['p'], np.float32).tobytes()).decode(),
                    'c': base64.b64encode(np.array(r['c'], np.uint8).tobytes()).decode(),
                    'a': base64.b64encode(np.array(r['a'], np.uint8).tobytes()).decode()})
    json.dump(out, open('eb2-ribbons.json', 'w')); print(len(out), 'ribbons')
