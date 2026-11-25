# Luanda, Angola: the side roads by the route for js/world-luanda-obcestje.js (its WAYS line), from tools/luanda/luanda.json's 'roads'
# (OpenStreetMap, © OpenStreetMap contributors, ODbL 1.0; downloaded 2026-11-15 by tools/proga-podatki.py: the ways other than the route's
# own within 60 m of it, clipped to 80 m).   python3 -I tools/luanda/obcestje.py   -> rewrites the WAYS line in js/world-luanda-obcestje.js
# Each way: [width in m, surface (0 asphalt, 1 paving, 2 earth), ends, x0, z0, x1, z1, ...] (metres, the game's frame: luanda.json's);
#   ends: 1 the first point, 2 the last one goes on to a bridge or a tunnel that is not drawn (the builder fades the way out there);
#   the width a list [s0, w0, s1, w1, ...] where it changes along the way (m along it and the width there, straight between).
#   The ways that meet end to end (the same surface, turning by under 45 degrees, 75 where no other way meets; not at the route: the
#   streets on its two sides are two) are written as one, and where the width changes at such a node it goes from the one to the other
#   over up to 30 m about it (assumed: OSM marks only the node).
#   width: OSM width=* if tagged (none of these is); else lanes=* x the lane (3.5 m on the primary roads and their links, 3.25 m on the
#   secondary and tertiary ones, 3.0 m on the rest); else by the kind of road (DEF; assumed). surface: OSM surface=*; untagged, a road is
#   taken as asphalt (as the tagged ones round it), a footway as paving, a path as earth (assumed). Left out: the bridges (OSM bridge=yes:
#   no height in OSM) and what lies farther than 70 m from the route (the builder draws up to 62 m from its centre line)
import json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'luanda.json')))
LN = J['line']; P = [(LN[i], LN[i + 1]) for i in range(0, len(LN), 2)]
LANE = {'primary': 3.5, 'primary_link': 3.5, 'trunk': 3.5, 'trunk_link': 3.5, 'secondary': 3.25, 'secondary_link': 3.25, 'tertiary': 3.25, 'tertiary_link': 3.25}
DEF = {'primary': 7.0, 'trunk': 7.0, 'secondary': 6.5, 'tertiary': 6.5, 'primary_link': 4.0, 'trunk_link': 4.0, 'secondary_link': 4.0, 'tertiary_link': 4.0,
       'unclassified': 5.5, 'residential': 5.5, 'living_street': 5.0, 'service': 4.0, 'pedestrian': 6.0, 'track': 3.0, 'footway': 3.0, 'cycleway': 2.0,
       'path': 1.5, 'bridleway': 1.5, 'steps': 2.0}
PAVED = {'asphalt': 0, 'paved': 0, 'concrete': 1, 'paving_stones': 1, 'sett': 1, 'cobblestone': 1, 'unhewn_cobblestone': 1, 'concrete:plates': 1,
         'unpaved': 2, 'ground': 2, 'dirt': 2, 'earth': 2, 'sand': 2, 'compacted': 2, 'gravel': 2, 'fine_gravel': 2}
FOOT = {'footway', 'path', 'steps', 'cycleway', 'bridleway', 'pedestrian'}

def dline(x, z):
    best = 1e9
    for (ax, az), (bx, bz) in zip(P, P[1:]):
        dx, dz = bx - ax, bz - az; l2 = dx * dx + dz * dz or 1; t = max(0, min(1, ((x - ax) * dx + (z - az) * dz) / l2))
        best = min(best, math.hypot(x - ax - t * dx, z - az - t * dz))
    return best

def rdp(Q, eps):
    if len(Q) < 3: return Q
    (ax, az), (bx, bz) = Q[0], Q[-1]; dx, dz = bx - ax, bz - az; l = math.hypot(dx, dz) or 1
    k, dm = 0, -1
    for i in range(1, len(Q) - 1):
        d = abs((Q[i][0] - ax) * dz - (Q[i][1] - az) * dx) / l
        if d > dm: k, dm = i, d
    return rdp(Q[:k + 1], eps)[:-1] + rdp(Q[k:], eps) if dm > eps else [Q[0], Q[-1]]

def width(hw, lanes, w):
    m = re.match(r'^\s*([0-9.]+)\s*(m)?\s*$', str(w or ''))
    if m: return float(m.group(1))
    if str(lanes).isdigit() and int(lanes) > 0 and hw not in FOOT: return int(lanes) * LANE.get(hw, 3.0)
    return DEF.get(hw, 4.0)

def surface(hw, s):
    if s in PAVED: return PAVED[s]
    return 2 if hw in ('path', 'track', 'bridleway') else 1 if hw in FOOT else 0

def segd(x, z, Q):
    best = 1e9
    for (ax, az), (bx, bz) in zip(Q, Q[1:]):
        dx, dz = bx - ax, bz - az; l2 = dx * dx + dz * dz or 1; t = max(0, min(1, ((x - ax) * dx + (z - az) * dz) / l2))
        best = min(best, math.hypot(x - ax - t * dx, z - az - t * dz))
    return best

LINES = [(r[3] or int(r[4] or 0) != 0, [(r[8][i], r[8][i + 1]) for i in range(0, len(r[8]), 2)]) for r in J['roads']]
def onto_bridge(x, z, own):   # an end that meets a way not drawn (a bridge, a tunnel) and no other way that is
    return any(sk and segd(x, z, Q) < 1.0 for sk, Q in LINES) and not any(not sk and Q is not own and segd(x, z, Q) < 1.0 for sk, Q in LINES)

# the streets as they run on: the ways that meet end to end at a node (the same surface, turning by under 45 degrees there, under 75 where
# no other way meets) joined into one line, so their ribbon goes on without a seam; where the width changes there (OSM: another lane
# count from that node on), it goes from the one to the other over up to 30 m about the node (assumed: OSM marks only the node)
D = []
for (hw, lanes, w, br, layer, surf, name, par, pts), (skip, Q) in zip(J['roads'], LINES):
    if skip or len(Q) < 2: continue   # (bridges and tunnels: no height in OSM)
    D.append(dict(hw=hw, wd=round(width(hw, lanes, w), 2), sc=surface(hw, surf), Q=Q))
key = lambda p: (round(p[0] * 20), round(p[1] * 20))
ENDS, MID = {}, set(key(p) for d in D for p in d['Q'][1:-1])
for i, d in enumerate(D):
    for e in (0, 1): ENDS.setdefault(key(d['Q'][-e]), []).append((i, e))
def away(i, e):   # the direction from the node into way i at its end e (to a point 4 m along it, or its other end)
    Q = D[i]['Q'] if e == 0 else D[i]['Q'][::-1]; acc = 0
    for (ax, az), (bx, bz) in zip(Q, Q[1:]):
        acc += math.hypot(bx - ax, bz - az)
        if acc >= 4: break
    dx, dz = bx - Q[0][0], bz - Q[0][1]; l = math.hypot(dx, dz) or 1
    return dx / l, dz / l
pair = {}
for k, L in ENDS.items():
    i0, e0 = L[0]
    if dline(*D[i0]['Q'][-e0]) < 10: continue   # (on the route: a street that crosses it is two, one on each side)
    lim, C = 75 if len(L) == 2 and k not in MID else 45, []
    for a_ in range(len(L)):
        for b_ in range(a_ + 1, len(L)):
            (i, e), (j, f) = L[a_], L[b_]
            if i == j or D[i]['sc'] != D[j]['sc']: continue
            u, v = away(i, e), away(j, f)
            dfl = math.degrees(math.acos(max(-1.0, min(1.0, -(u[0] * v[0] + u[1] * v[1])))))
            if dfl < lim: C.append((dfl, L[a_], L[b_]))
    used = set()
    for dfl, p_, q_ in sorted(C):
        if p_ in used or q_ in used: continue
        used |= {p_, q_}; pair[p_] = q_; pair[q_] = p_
seen, chains = [False] * len(D), []
for i0 in range(len(D)):
    if seen[i0]: continue
    i, e, vis = i0, 0, {i0}   # back to the chain's first way (entered at its end e)
    while (i, e) in pair and pair[(i, e)][0] not in vis: j, f = pair[(i, e)]; i, e = j, 1 - f; vis.add(i)
    ch = []
    while True:
        seen[i] = True; ch.append((i, e))
        if (i, 1 - e) not in pair or seen[pair[(i, 1 - e)][0]]: break
        i, e = pair[(i, 1 - e)]
    chains.append(ch)

out = []; stat = {}; joined = tapers = 0
for ch in chains:
    # resample at 2 m along the whole chain; the width along it: (s, w) breakpoints
    R, sR, cut = [], [], []
    for n_, (i, e) in enumerate(ch):
        Q = D[i]['Q'] if e == 0 else D[i]['Q'][::-1]
        for (ax, az), (bx, bz) in zip(Q, Q[1:]):
            m = max(1, int(math.ceil(math.hypot(bx - ax, bz - az) / 2)))
            for j in range(0 if not R else 1, m + 1):
                x, z = ax + (bx - ax) * j / m, az + (bz - az) * j / m
                sR.append(sR[-1] + math.hypot(x - R[-1][0], z - R[-1][1]) if R else 0.0); R.append((x, z))
        cut.append(sR[-1])
    BP, s0 = [(0.0, D[ch[0][0]]['wd'])], 0.0
    for n_ in range(len(ch) - 1):
        w0, w1, sj = D[ch[n_][0]]['wd'], D[ch[n_ + 1][0]]['wd'], cut[n_]
        if w0 != w1:
            T = min(30.0, sj - s0, cut[n_ + 1] - sj); BP += [(sj - T / 2, w0), (sj + T / 2, w1)]; tapers += 1
        s0 = sj
    BP.append((sR[-1], D[ch[-1][0]]['wd'])); joined += len(ch) - 1
    def wAt(sv):
        if sv <= BP[0][0]: return BP[0][1]
        for (sa, wa), (sb, wb) in zip(BP, BP[1:]):
            if sv <= sb: return wa + (wb - wa) * ((sv - sa) / (sb - sa) if sb > sa else 1)
        return BP[-1][1]
    # keep the runs within 70 m of the route (one point past each end of a run, so the builder fades it out itself)
    near = [dline(x, z) < 70 for x, z in R]; k = 0
    while k < len(R):
        if not near[k]: k += 1; continue
        a = k
        while k < len(R) and near[k]: k += 1
        a0, k0 = max(0, a - 1), min(len(R), k + 1); run = R[a0:k0]
        if len(run) < 2 or sR[k0 - 1] - sR[a0] < 3: continue
        first, lastw = D[ch[0][0]], D[ch[-1][0]]
        ends = (1 if a0 == 0 and onto_bridge(*R[0], first['Q']) else 0) | (2 if k0 == len(R) and onto_bridge(*R[-1], lastw['Q']) else 0)
        sa, sb = sR[a0], sR[k0 - 1]
        ws = [(0.0, wAt(sa))] + [(sv - sa, w) for sv, w in BP if sa < sv < sb] + [(sb - sa, wAt(sb))]
        ws = [(round(sv, 1), round(w, 2)) for sv, w in ws]
        wspec = ws[0][1] if all(w == ws[0][1] for _, w in ws) else [v for p_ in ws for v in p_]
        run = rdp(run, 0.25); sc = first['sc']
        out.append([wspec, sc, ends] + [round(v, 1) for p_ in run for v in p_])
        for i, _ in ch: stat[D[i]['hw']] = stat.get(D[i]['hw'], 0) + 1

src = '  const WAYS = ' + json.dumps(out, separators=(',', ':')) + ';\n'
path = os.path.join(ROOT, 'js', 'world-luanda-obcestje.js'); js = open(path).read()
js2, n = re.subn(r'^  const WAYS = .*\n', lambda m: src, js, count=1, flags=re.M)
if n != 1: raise SystemExit('no WAYS line in ' + path)
open(path, 'w').write(js2)
print('ways', len(out), 'points', sum((len(o) - 3) // 2 for o in out), 'bytes', len(src), 'joined', joined, 'tapers', tapers, stat)
