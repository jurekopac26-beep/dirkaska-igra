# (pictures only) the step where the circuit's kerb by the park turns into the wide kerb (x 89, z -64; seen on the stage view): the wide kerb (widek3)
# now starts exactly as wide as the circuit's kerb and widens to 2 m over its first 4 m, fully opaque; the circuit's kerb runs 1 m under its start
# (no faded gap); the terracotta strip moves out with the kerb's outer edge over the same 4 m instead of jumping 1.1 m
import json, base64, numpy as np
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
R = json.load(open('eb7-D3-ribbons-v1.json'))
def dec(r):
    n, nr = int(r['n']), int(r['nr'])
    return (np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(n, nr, 2).astype(float).copy(),
            np.frombuffer(base64.b64decode(r['c']), np.uint8).reshape(n, nr, 3).astype(float).copy(),
            np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(n, nr).astype(float).copy())
def enc(r, p, c, a):
    r['p'] = base64.b64encode(p.astype(np.float32).tobytes()).decode(); r['c'] = base64.b64encode(np.clip(c, 0, 255).round().astype(np.uint8).tobytes()).decode()
    r['a'] = base64.b64encode(np.clip(a, 0, 255).round().astype(np.uint8).tobytes()).decode()
assert R[0]['road'] == 'T' and R[0]['kind'] == 'S' and R[1]['kind'] == 'L' and R[2]['kind'] == 'K'
pS, cS, aS = dec(R[0]); pL, _, _ = dec(R[1]); pK, cK, aK = dec(R[2])
W0 = np.array([88.73, -64.18])          # the wide kerb's first station
# the circuit's kerb: full up to station 1142 (z -63.06), as at 1146
for q in range(1142, 1146): aK[q] = aK[1146]
# the strip: from the plain offsets to the wide kerb's over the wide kerb's first 4 m
NORM, KB = np.array([0.24, 2.52, 2.56]), np.array([2.30, 3.62, 3.66])
for q in range(1125, 1146):
    d = np.hypot(*(pL[q, 0] - W0)) * (1 if pL[q, 0, 1] > W0[1] else -1)
    t = sst(0.0, 4.0, d); N = pS[q, 2] - pL[q, 0]; N /= np.hypot(*N)
    if 0 < t < 1 or q >= 1143: pS[q] = pL[q, 0] + N[None] * (NORM + (KB - NORM) * t)[:, None]
enc(R[0], pS, cS, aS); enc(R[2], pK, cK, aK)
json.dump(R, open('eb7-D3-ribbons.json', 'w'))
# the wide kerb's start
s = open('widek3-v1-page.js').read(); i = s.index('const RS = ') + len('const RS = '); RS, j = json.JSONDecoder().raw_decode(s[i:]); r = RS[0]
n, nr = r['n'], r['nr']; p = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(n, nr, 2).astype(float).copy(); a = np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(n, nr).copy()
OFF = np.hypot(*(p[16] - p[16, 0]).T); FULL = a[16].copy()
for q in range(0, 20):
    sc = 0.742 + 0.258 * sst(0, 20, q); D = p[q, -1] - p[q, 0]; D /= np.hypot(*D)
    p[q] = p[q, 0] + D[None] * (OFF * sc)[:, None]; a[q] = FULL
r['p'] = base64.b64encode(p.astype(np.float32).tobytes()).decode(); r['a'] = base64.b64encode(a.tobytes()).decode()
s2 = s[:i] + json.dumps(RS) + s[i + j:]
s2 = s2.replace("// (pictures only) [widek3:", "// (pictures only) [widek3: its start as wide as the circuit's kerb, widening to 2 m over 4 m, opaque (jogfix.py, 20. 10.);", 1)
open('widek3-page.js', 'w').write(s2)
print('ok', OFF.round(2), FULL)
# the lane's (jump's) north edge by the truck lane's corner (x 80..120): the wide kerb there is cut off (box20 'w', the user's "zbriši notranjega"),
# so the lane's own kerb and strip come back as everywhere else (the strip at its plain offsets, the kerb drawn)
R = json.load(open('eb7-D3-ribbons.json'))
for si, li, ki in ((13, 14, 15), (17, 18, 19)):
    assert R[si]['road'] == 'jump' and R[si]['kind'] == 'S' and R[ki]['kind'] == 'K'
    pS, cS, aS = dec(R[si]); pL, _, _ = dec(R[li]); pK, cK, aK = dec(R[ki])
    off = np.hypot(*(pS[:, 0] - pL[:, 0]).T); x, z = pL[:, 0, 0], pL[:, 0, 1]
    ref = [q for q in range(len(off)) if off[q] < 0.5 and aK[q].max() >= 250]
    if not ref: continue
    KA = aK[ref[0]].copy(); KC = cK[ref[0]].copy(); SC = cS[ref[0]].copy(); n_ = 0
    for q in range(len(off)):
        if off[q] > 1.5 and 80 < x[q] < 120 and -26 < z[q] < 50:
            N = pS[q, 2] - pL[q, 0]; N /= np.hypot(*N); pS[q] = pL[q, 0] + N[None] * NORM[:, None]
            cK[q] = KC; cS[q] = SC      # (the kerb's and strip's colours there were never set: the wide kerb drew it)
            if aS[q].max() > 0: aK[q] = np.maximum(aK[q], KA * (aS[q, 1] / 255))
            n_ += 1
    enc(R[si], pS, cS, aS); enc(R[ki], pK, cK, aK); print('jump', si, 'stations back to the plain kerb', n_)
json.dump(R, open('eb7-D3-ribbons.json', 'w'))
