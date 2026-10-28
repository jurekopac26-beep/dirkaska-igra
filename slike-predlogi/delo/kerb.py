# a wide kerb along the circuit's park-side edge (Mapa 6; user, 18. 10.: "naredi, da bo tukaj širok robnik"): red and white blocks like
# the circuit's own kerbs (1.6 m blocks, colours read off them), 2 m wide instead of 1.5, laid right outside the asphalt's edge along the
# user's stroke, with a dark seam to the white edge line, a slight bevel at its outer edge, shadows carried over from the view; tapered
# at both ends; not under things (stalls, frames, umbrellas)
import sys, json, base64, math, numpy as np
sys.path.insert(0, '.')
from roadmask import per_line
from mk18_helpers import sst, dil, edt
import edgeband2 as E

KW = 2.0; BL = 1.6
RED = np.array([225, 58, 46], np.float32); WHITE = np.array([240, 237, 233], np.float32); SEAM = np.array([70, 62, 66], np.float32)
st = json.load(open('kerb-stroke.json')); SX = np.array(st['x']); SZ = np.array(st['z'])
# the stroke on a 0.5 m grid, distance to it
gx0, gz0 = SX.min() - 15, SZ.min() - 15; nx = int((SX.max() - gx0 + 15) / 0.5) + 1; nz = int((SZ.max() - gz0 + 15) / 0.5) + 1
M = np.zeros((nz, nx), bool); M[((SZ - gz0) / 0.5).astype(int), ((SX - gx0) / 0.5).astype(int)] = True
DS = edt(M, cap=60) * 1.0      # edt returns half-cells -> metres at 0.5 m cells
def dstroke(x, z):
    i = int((x - gx0) / 0.5); j = int((z - gz0) / 0.5)
    return DS[j, i] if (0 <= i < nx and 0 <= j < nz) else 99.0
f = E.fields(4)
def fval(name, x, z):
    i = int(np.clip(round((x - f['x0']) / 0.5), 0, 499)); j = int(np.clip(round((z - f['z0']) / 0.5), 0, 499)); return f[name][j, i]
# the edge it follows: the circuit's park-side edge, round the junction's rounded corner (radius from the view: the grass starts 4.75 m
# from the edges' crossing along the corner's bisector), then the lower road's north edge
Lm = {n: (k, P, hw) for n, k, P, hw in per_line()}
def edge(name, side, x0, x1, z0, z1):
    k, P, hw = Lm[name]; m = (P[:, 0] > x0) & (P[:, 0] < x1) & (P[:, 1] > z0) & (P[:, 1] < z1); Q = P[m]
    Tg = np.gradient(Q, axis=0); Tg /= np.hypot(Tg[:, 0], Tg[:, 1])[:, None]; N = np.stack([-Tg[:, 1], Tg[:, 0]], 1); return Q + side * N * hw
ET = edge('T', -1, 80, 125, -90, 60); EJ = edge('jump', -1, 55, 125, 30, 60)
C0, uT, uJ = np.load('corner.npy'); th = math.acos(float(np.clip(np.dot(uT, uJ), -1, 1))); bis = (uT + uJ) / np.linalg.norm(uT + uJ)
R = 4.75 / (1 / math.sin(th / 2) - 1); tl = R / math.tan(th / 2); Cc = C0 + bis * R / math.sin(th / 2)
TPT = C0 + uT * tl; TPJ = C0 + uJ * tl
# T part: from the top down to the tangent point (ET runs north->south)
ET = ET[np.argsort(ET[:, 1])]; partT = ET[ET[:, 1] < TPT[1] - 0.3]
a0 = math.atan2(*(TPT - Cc)[::-1]); a1 = math.atan2(*(TPJ - Cc)[::-1]); da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
arc = np.array([Cc + R * np.array([math.cos(a0 + da * t), math.sin(a0 + da * t)]) for t in np.linspace(0, 1, 30)])
EJ = EJ[np.argsort(-EJ[:, 0])]; partJ = EJ[EJ[:, 0] < TPJ[0] - 0.3]
PE = np.vstack([partT, TPT[None], arc[1:-1], TPJ[None], partJ])
seg = np.hypot(*(PE[1:] - PE[:-1]).T); SS = np.r_[0, np.cumsum(seg)]
ss = np.arange(0, SS[-1], 0.2); Q = np.stack([np.interp(ss, SS, PE[:, 0]), np.interp(ss, SS, PE[:, 1])], 1)
Tg = np.gradient(Q, axis=0); Tg /= np.maximum(np.hypot(Tg[:, 0], Tg[:, 1]), 1e-6)[:, None]; Nr = np.stack([-Tg[:, 1], Tg[:, 0]], 1)
k0 = int(np.argmin(np.hypot(*(Q - (C0 + bis * 4.75)).T)))
if np.dot(Nr[k0], bis) < 0: Nr = -Nr                      # outward: into the grass
hw = 0.0; side = 1
ribs = []
w = np.array([(1 - sst(4.0, 7.0, dstroke(*(Q[q] + Nr[q] * 1.0)))) * (Q[q][0] > 89) for q in range(len(Q))])   # (ends at the gift box)
idx = np.nonzero(w > 0.5)[0]; runs = np.split(idx, np.nonzero(np.diff(idx) > 5)[0] + 1); run = max(runs, key=len)
q0, q1 = max(0, run[0] - 15), min(len(Q) - 1, run[-1] + 15)
print('kerb length %.1f m, corner R %.1f m' % ((run[-1] - run[0]) * 0.2, R))
if True:
    rows = [(-0.02, 'seam', 0), (0.0, 'seam', 1), (0.12, 'seam', 1), (0.16, 'k', 1), (KW - 0.3, 'k', 1), (KW - 0.08, 'b', 1), (KW, 'b', 0)]
    pos, col, al = [], [], []
    for q in range(q0, q1 + 1):
        u = (q - run[0]) * 0.2; taper = sst(-3.0, 0.0, u) * sst(-3.0, 0.0, (run[-1] - q) * 0.2)
        wid = 0.35 + 0.65 * taper
        blk = int(math.floor(u / BL)) % 2; kc = RED if blk == 0 else WHITE
        for (o, kind, a0_) in rows:
            oo = o if kind == 'seam' else 0.16 + (o - 0.16) * wid
            x, z = Q[q] + Nr[q] * oo
            sh = float(fval('sh', x, z)); obj = float(fval('OBJ', x, z))
            c = SEAM if kind == 'seam' else (kc if kind == 'k' else kc * 0.86)
            a = a0_ * taper * (1 - sst(0.2, 0.5, obj))
            pos.append((round(float(x), 2), round(float(z), 2))); col.append([int(np.clip(v * sh, 0, 255)) for v in c]); al.append(int(round(np.clip(a, 0, 1) * 255)))
    ribs.append({'kind': 'K', 'n': int(q1 - q0 + 1), 'nr': len(rows), 'p': base64.b64encode(np.array(pos, np.float32).tobytes()).decode(),
                 'c': base64.b64encode(np.array(col, np.uint8).tobytes()).decode(), 'a': base64.b64encode(np.array(al, np.uint8).tobytes()).decode(), 'road': 'T'})
json.dump(ribs, open('kerb-ribbons.json', 'w')); print(len(ribs), 'kerb ribbons')
