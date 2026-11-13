#!/usr/bin/env python3
"""The roads that meet a track, the street lamps and the bus stops beside it from OpenStreetMap, in the game's coordinates: the data
of the package Realizem E for World.cesta.stranske (docs/realizem/paket-e.md, "E1").

  node tools/cesta/crte.js <id> > crte.json
  python3 -I tools/cesta/osm.py crte.json <id> <raw-dir>              (downloads the tiles; they stay outside the repository)
  python3 -I tools/cesta/izvoz.py crte.json <id> <raw-dir> [--vpisi]  (prints the rows and the count of what was dropped and why;
                                                                       --vpisi writes them into js/tracks/<id>.js)

A junction is a node of the map that a way of the track shares with another road: nothing is invented, a track without such nodes gets
no side roads. The map is laid on the game's line in three steps, because the game's line is smoothed and not everywhere to scale: one
similarity fit of the whole track, a rigid fit of the few hundred metres round each junction, then the junction itself is put on the
centre line. The rules for what stays are those of Livorno (tools/livorno/build.py, side_roads): the first 64 m, on along the way that
continues it; no paths, no junction at the start, on a bridge, in a gallery or in a banked corner, no loops and lay-bys, the weaker of
two mouths that would run into each other, a road that comes back to the lap stops short of it. A way of the map that goes on beyond an
open road's ends is the track where a long stretch of it lies on the game's line (its junctions out there are dropped: far, end), an
open road has no junction from 70 m before its finish line on (the gantry, the crowd, the run-off beyond: finish), and
a road the track's own model has already (def.sideRoads, def.junctions: driven on, with walls of its own; def.views: a view point's
lay-by) gets no road for the look beside it (own). A junction the game cannot draw (the road would climb the game's hillside) is left
out by hand, per track (PROGE, izpusti: hand).

Rows: stranske [m after the start line, side (1 right, -1 left), class (0 a driveway or a track, 1 a street, 2 tertiary, 3 secondary or
a main road), width (m), one-way, end (0 fades into the terrain, 1 joins another of these roads), [x, z, ...]]; svetilke [x, z];
postaje [m after the start line, side, distance from the centre line, shelter].

Data: (c) OpenStreetMap contributors, ODbL 1.0. Names are never read (osm.parse drops them). Needs numpy and scipy."""
import sys, os, re, json, glob, math
import numpy as np
from scipy.spatial import cKDTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import osm

SIDE_CLASS = {'service': 0, 'track': 0, 'residential': 1, 'unclassified': 1, 'living_street': 1, 'tertiary': 2, 'tertiary_link': 2,
              'secondary': 3, 'secondary_link': 3, 'primary': 3, 'primary_link': 3, 'trunk': 3, 'trunk_link': 3}
SIDE_W = [3.6, 5.2, 6.4, 7.2]   # the carriageway's width by class (m), where OSM gives neither lanes nor a width
# per track: the start area without junctions (m after the line, m before it: the wall, the fence and the crowd of the start), how
# close to the game's line a way of the map must lie to be the track itself (the median of its points, m) and from how far before
# an open road's finish line there is no junction (cilj, m); izpusti: junctions left out by hand ([m after the start line, side]), where
# the game's ground beside the road is not the map's and World.cesta.stranske cannot draw the road (its edges never cross the barrier's
# line): the data say only what is drawn
PROGE = {'nring': dict(start=(230, 290), trk=12.0, kinds={'raceway'}), 'montreal': dict(kinds={'raceway'}),
         # Rio do Rastro: a farm track that runs along the road inside the barrier's line (3962 m, left) and a 22 m stub that curls back
         # beside the finish's wide verge (4914 m, right)
         'rastro': dict(izpusti=[(3962, -1), (4914, 1)]),
         # Chapman's Peak: two drives on the mountain's side (2073 m and 3631 m, right), where the game's hillside stands 7 m above the road
         # ten metres behind the barrier's line: a strip that follows the ground would climb a bank no car could
         'chapman': dict(izpusti=[(2073, 1), (3631, 1)])}
PRIVZETO = dict(start=(150, 330), trk=6.0, kinds=osm.ROADS - {'raceway'}, cilj=70.0)
RUN, FAR, OWN = 150.0, 25.0, 30.0   # a way that goes on beyond the game's line is the track with this long a stretch on it (m); a junction
                                    # this far off the line is not on the track; no road for the look this near a mouth of the track's own

def side_width(cls, t):
    ow = t.get('oneway') == 'yes'
    for k, lanes in (('width', False), ('lanes', True)):
        try: f = float(str(t.get(k, '')).replace(',', '.').split()[0])
        except (ValueError, IndexError): continue
        if lanes and f >= 1: return round(min(8.0, max(3.0, 3.0 * f + (1.0 if f < 2 else 0.4))), 1), ow
        if not lanes and f >= 3: return round(min(8.0, max(3.0, f)), 1), ow
    return round(min(8.0, max(3.0, SIDE_W[cls] * (0.8 if ow else 1))), 1), ow

def longest(P, ok):
    """The longest stretch (m) of the polyline P whose points are all ok."""
    best = cur = 0.0
    for i in range(1, len(P)):
        cur = cur + math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) if ok[i] and ok[i - 1] else 0.0
        best = max(best, cur)
    return best

def similarity(P, Q, rounds=60):
    """The similarity (scale, R, t) of the map's points Q onto the track's centre line P (closest points, trimmed)."""
    s, R, t = 1.0, np.eye(2), np.zeros(2)
    for k in range(rounds):
        Qk = s * Q @ R.T + t; d, j = cKDTree(Qk).query(P); ok = d < max(4.0, 60.0 * 0.85 ** k)
        if ok.sum() < 20: break
        a, b = Qk[j[ok]], P[ok]; ca, cb = a.mean(0), b.mean(0); A, B = a - ca, b - cb
        U, S, Vt = np.linalg.svd(A.T @ B); D = np.diag([1.0, np.sign(np.linalg.det(Vt.T @ U.T))]); Rk = Vt.T @ D @ U.T
        sk = float((S * np.diag(D)).sum() / (A ** 2).sum()); s, R, t = sk * s, Rk @ R, sk * Rk @ (t - ca) + cb
    return s, R, t

def local(tree, D, Qt, qtree, c):
    """The rigid move (R, t) that lays the map's track points round c on the game's line D: a window wide enough to hold a bend."""
    r = 200.0
    while True:
        idx = qtree.query_ball_point(c, r); S = Qt[idx]
        if len(S) >= 40 and (math.sqrt(max(0.0, float(np.linalg.eigvalsh(np.cov(S.T))[0]))) > 25 or r > 1200): break
        if r > 1200: return np.eye(2), np.zeros(2)
        r *= 1.5
    R, t = np.eye(2), np.zeros(2)
    for k in range(25):
        Sk = S @ R.T + t; d, j = tree.query(Sk); ok = d < max(2.5, 16.0 * 0.8 ** k)
        if ok.sum() < 20: break
        a, b = Sk[ok], D[j[ok]]; ca, cb = a.mean(0), b.mean(0); U, _, Vt = np.linalg.svd((a - ca).T @ (b - cb))
        Dg = np.diag([1.0, np.sign(np.linalg.det(Vt.T @ U.T))]); Rk = Vt.T @ Dg @ U.T; R, t = Rk @ R, Rk @ (t - ca) + cb
    return R, t

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; write = '--vpisi' in sys.argv
    C = json.load(open(args[0]))[args[1]]; raw = args[2]; cfg = dict(PRIVZETO, **PROGE.get(C['id'], {}))
    g = C['geo']; geo = osm.Geo(g['lat0'], g['lon0'], g['rot'], g.get('scale', 1.0))
    G = np.column_stack([C['px'], C['pz']]); N = C['N']; ds = C['ds']; L = N * ds; op = C['open']; W_ = np.asarray(C['w'])
    nodes, tagged, ways = osm.parse(sorted(glob.glob(os.path.join(raw, '*.osm'))))
    ids = list(nodes.keys()); ll = np.asarray([nodes[i] for i in ids]); x, z = geo.to_xz(ll[:, 0], ll[:, 1])
    # the game's centre line, a point each ~0.4 m (the index is the place along it)
    K = 5; Gn = G if op else np.vstack([G, G[:1]])
    D = np.concatenate([Gn[i] + (Gn[i + 1] - Gn[i]) * (np.arange(K) / K)[:, None] for i in range(len(Gn) - 1)]); st = ds / K; nd = len(D)
    tree = cKDTree(D); Tn = (np.roll(D, -3, 0) - np.roll(D, 3, 0)) if not op else np.gradient(D, axis=0); Tn /= np.hypot(Tn[:, 0], Tn[:, 1])[:, None]
    hs = (G[1, 0] - G[0, 0]) * C['n0'][1] - (G[1, 1] - G[0, 1]) * C['n0'][0]; Nr = np.column_stack([-Tn[:, 1], Tn[:, 0]]) * (1 if hs > 0 else -1)   # the right-hand normal
    # step 1: the whole map onto the line
    xz0 = np.column_stack([x, z]); at0 = dict(zip(ids, range(len(ids))))
    Q = np.asarray([p for refs, t in ways.values() if t.get('highway') in cfg['kinds'] and len(refs) > 1 for p in osm.dense([tuple(xz0[at0[r]]) for r in refs if r in at0])])
    s, R, t = similarity(G, Q); XZ = s * xz0 @ R.T + t; xz = lambda r: XZ[at0[r]]
    # the ways of the track itself, their nodes and points
    trk = set()
    for wid, (refs, tg) in ways.items():
        if tg.get('highway') not in cfg['kinds'] or len(refs) < 2: continue
        P = osm.dense([tuple(xz(r)) for r in refs if r in at0], 2.0); d, _ = tree.query(np.asarray(P))
        if np.median(d) < cfg['trk'] or op and longest(P, d < cfg['trk']) >= RUN: trk.add(wid)   # (an open road goes on beyond the game's line)
    tn = {r for w in trk for r in ways[w][0]}
    Qt = np.asarray([p for w in trk for p in osm.dense([tuple(xz(r)) for r in ways[w][0] if r in at0])]); qtree = cKDTree(Qt)
    dq, _ = cKDTree(Qt).query(G)
    print('%s: %d ways of the map are the track; the line after the similarity fit (scale %.4f): %s' % (C['id'], len(trk), s, osm.stats(dq)))
    dist = lambda a, b: float(np.hypot(a[0] - b[0], a[1] - b[1]))
    circ = (lambda a, b: abs(a - b)) if op else (lambda a, b: min(abs(a - b), L - abs(a - b)))
    after = lambda sm: (sm - C['start']) % L if not op else sm - C['start']     # m after the start line
    hw_at = lambda sm: float(W_[int(round(sm / ds)) % N])
    def near(p): d, k = tree.query(p); return float(d), float(k * st)
    plen = lambda P: sum(dist(P[i + 1], P[i]) for i in range(len(P) - 1))
    def clip(P, m):   # the first m metres
        out = [P[0]]; acc = 0.0
        for i in range(1, len(P)):
            l = dist(P[i], P[i - 1])
            if acc + l >= m:
                if m - acc > 0.05: out.append(P[i - 1] + (P[i] - P[i - 1]) * ((m - acc) / max(l, 1e-9)))
                return out
            acc += l; out.append(P[i])
        return out
    def walk(P):   # a point each metre of the way: the index is the metres from the junction
        out = [P[0]]; acc = 0.0; nxt = 1.0
        for i in range(1, len(P)):
            l = dist(P[i], P[i - 1])
            while nxt <= acc + l + 1e-9: out.append(P[i - 1] + (P[i] - P[i - 1]) * ((nxt - acc) / max(l, 1e-9))); nxt += 1.0
            acc += l
        return out
    # OSM splits the ways: a short piece goes on along the way that continues it from its last node (never a bridge or a tunnel)
    plain = lambda tg: tg.get('highway') in SIDE_CLASS and tg.get('bridge', 'no') == 'no' and tg.get('tunnel', 'no') == 'no'
    ends = {}
    for wid, (refs, tg) in ways.items():
        if wid in trk or not plain(tg) or len(refs) < 2: continue
        ends.setdefault(refs[0], []).append(refs); ends.setdefault(refs[-1], []).append(refs[::-1])
    def carry(refs):
        refs = list(refs)
        for _ in range(6):
            P = [xz(r) for r in refs]
            if plen(P) >= 64 or refs[-1] in tn: break
            d0 = P[-1] - P[-2]; d0 = d0 / max(1e-9, float(np.hypot(*d0))); best = None
            for q in ends.get(refs[-1], []):
                if q[1] == refs[-2]: continue
                d1 = xz(q[1]) - xz(q[0]); c = float(np.dot(d0, d1)) / max(1e-9, float(np.hypot(*d1)))
                if c > 0.5 and (best is None or c > best[0]): best = (c, q)
            if best is None: break
            refs += best[1][1:]
        return refs
    # the places without junctions: the bridges of the track's data and the banked corners
    br = [near(np.asarray(p))[1] for p in C.get('mostovi', [])]; bank = [(a * ds, b * ds) for a, b in C.get('bank', [])]
    cand = []; why = {}; resid = []
    def drop(k): why[k] = why.get(k, 0) + 1
    for wid, (refs, tg) in ways.items():
        if wid in trk or len(refs) < 2: continue
        for k, r0 in enumerate(refs):
            if r0 not in tn: continue
            for br_ in ([refs[k::-1]] if k else []) + ([refs[k:]] if k < len(refs) - 1 else []):
                if len(br_) < 2 or br_[1] in tn and len(br_) == 2: continue
                hw = tg.get('highway')
                if hw == 'raceway': drop('raceway'); continue                       # another circuit or its pit lane: no public road
                if hw not in SIDE_CLASS: drop('path'); continue
                if not plain(tg): drop('bridge'); continue
                # steps 2 and 3: the surroundings of the junction onto the game's line, the junction onto the line itself
                P0 = np.asarray([xz(r) for r in carry(br_)]); Rl, tl = local(tree, D, Qt, qtree, P0[0]); P1 = P0 @ Rl.T + tl
                d, kk = tree.query(P1[0])
                if d > FAR: drop('far'); continue                                        # on the way's continuation beyond the game's line
                resid.append(float(d)); P = clip([p for p in P1 + (D[kk] - P1[0])], 64.0)
                d0, s0 = near(P[0]); hw0 = hw_at(s0); sa = after(s0)
                if op and (s0 < 40 or s0 > L - 40): drop('end'); continue                # the road's own continuation beyond the game's line
                if sa < cfg['start'][0] or sa > L - cfg['start'][1]: drop('start'); continue   # the start: the wall, the fence and the crowd
                if op and C.get('cilj') and sa > C['cilj'] - cfg['cilj']: drop('finish'); continue   # an open road's finish: the gantry, the crowd, the run-off
                if any(circ(s0, b) < 24 for b in br) or any(a - 24 < sa < b + 24 for a, b in C.get('brez', [])): drop('bridge'); continue   # no junction on or under a bridge, nor in a gallery
                if any(a - 30 <= s0 <= b + 30 for a, b in bank): drop('bank'); continue  # nor in a banked corner
                cls = SIDE_CLASS[hw]; w, ow = side_width(cls, tg)
                Wk = walk(P); N_ = [near(p) for p in Wk]; left = False; ret = None
                for k2, (d, sm) in enumerate(N_):   # away from the lap (its own width clear of the edge), then back at it
                    if not left: left = d > hw0 + 6 + w / 2
                    elif d < hw_at(sm) + 3 + w / 2: ret = (k2, sm); break
                if ret and circ(ret[1], s0) < 200: drop('loop'); continue                 # a ring, a lay-by, a carriageway alongside
                cut = len(Wk) if ret is None else max(0, ret[0] - 8)                      # a road to another part of the lap stops short of it
                if cut - 1 < 14 or max(d for d, sm in N_[:cut]) < hw0 + 10: drop('link' if ret else 'short'); continue   # never really leaves the roadside
                k0 = int(round(s0 / st)) % nd; o = 0.0
                for k2 in (12, 20, 30, cut - 1):
                    q = Wk[min(cut - 1, k2)] - D[k0]; o = float(Nr[k0] @ q)
                    if abs(o) > hw0 + 1: break
                if any(sd == (1 if o > 0 else -1) and circ(sa, m if op else m % L) < OWN for m, sd in C.get('ima', [])): drop('own'); continue   # the track's own side road is there
                if any(sd == (1 if o > 0 else -1) and abs(sa - m) < 4 for m, sd in cfg.get('izpusti', [])): drop('hand'); continue   # left out by hand (PROGE)
                tk = Tn[k0]; q = Wk[min(cut - 1, 12)] - Wk[0]; sn = abs(float(tk[0] * q[1] - tk[1] * q[0])) / max(1e-9, float(np.hypot(q[0], q[1])))
                cand.append(dict(s=s0, sa=sa, side=1 if o > 0 else -1, cls=cls, w=w, ow=int(ow), P=P, W=Wk, N=N_, hw0=hw0, cut=cut, end=0, mouth=w / max(0.45, sn),
                                 tags=' '.join('%s=%s' % (a, tg[a]) for a in ('highway', 'service', 'access', 'surface') if a in tg)))
    # the higher class first, then the longer road: two mouths on the same side that would run into each other leave one; a road that runs
    # into another of these roads ends there (end 1), and so does the other one where it is met at its tip
    cand.sort(key=lambda e: (-e['cls'], -e['cut'])); out = []
    for e in cand:
        if any(f['side'] == e['side'] and circ(e['s'], f['s']) < (e['mouth'] + f['mouth']) / 2 + 7 for f in out): drop('pair'); continue
        hit = None
        if out:
            A = [(f, k) for f in out for k in range(8, f['cut'])]; tr = cKDTree(np.array([f['W'][k] for f, k in A]))
            for k in range(8, e['cut']):
                p = e['W'][k]; d, j = tr.query(p); f, kf = A[j]
                if d > f['w'] / 2 + 1.5: continue
                tt = f['W'][min(kf + 1, len(f['W']) - 1)] - f['W'][kf - 1]; tt = tt / max(1e-9, float(np.hypot(tt[0], tt[1]))); q = p - f['W'][kf]
                u = float(tt[0] * q[0] + tt[1] * q[1]); v = float(-tt[1] * q[0] + tt[0] * q[1])
                if abs(v) < f['w'] / 2 - 0.3 and (kf < f['cut'] - 1 or u <= 0.5): hit = (k, f, kf); break   # its centre on the other road
        if hit:
            k, f, kf = hit
            if k < 14 or max(d for d, sm in e['N'][:k + 1]) < e['hw0'] + 10: drop('meet'); continue   # too short to that point
            e['cut'] = k + 1; e['end'] = 1
            if kf >= f['cut'] - 6: f['cut'] = min(f['cut'], kf + int(math.ceil(e['w'] / 2)) + 1); f['end'] = 1
        out.append(e)
    out.sort(key=lambda e: e['sa']); rows = []
    for e in out:
        Pc = clip(e['P'], float(e['cut'] - 1)); keep = [Pc[0]]   # the corners that matter (0.8 m apart), the end always
        for i in range(1, len(Pc)):
            if dist(Pc[i], keep[-1]) >= 0.8 or i == len(Pc) - 1: keep.append(Pc[i])
        rows.append([int(round(e['sa'])), e['side'], e['cls'], e['w'], e['ow'], e['end'], [round(float(v), 1) for p in keep for v in p]])
        print('  %6d m  %s  class %d  %.1f m  %2d m%s  %s' % (e['sa'], 'right' if e['side'] > 0 else 'left ', e['cls'], e['w'], e['cut'] - 1, ' joins' if e['end'] else '', e['tags']))
    # street lamps and bus stops within 30 m of the centre line, each laid on the game's line as the junctions are
    lamps, stops = [], []
    for i, tg in tagged.items():
        if tg.get('highway') not in ('street_lamp', 'bus_stop'): continue
        p = xz(i); d, _ = tree.query(p)
        if d > 45: continue
        Rl, tl = local(tree, D, Qt, qtree, p); p = Rl @ p + tl; d, kk = tree.query(p)
        if d > 30: continue
        if tg['highway'] == 'street_lamp': lamps.append([round(float(p[0]), 1), round(float(p[1]), 1)])
        else: stops.append([int(round(after(kk * st))), 1 if float(Nr[kk] @ (p - D[kk])) > 0 else -1, round(float(d), 1), 1 if tg.get('shelter') == 'yes' else 0])
    lamps.sort(); stops.sort()
    print('%s: %d side roads (dropped: %s); the junctions lay %.1f m (median), %.1f m (most) off the line before the last step; %d lamps, %d stops'
          % (C['id'], len(rows), ', '.join('%s %d' % kv for kv in sorted(why.items())) or 'none', np.median(resid) if resid else 0, max(resid) if resid else 0, len(lamps), len(stops)))
    data = [('stranske', rows), ('svetilke', lamps), ('postaje', stops)]
    if not write:
        for k, v in data: print(k + ': ' + json.dumps(v, separators=(',', ':')))
        return
    # into the track's file: the block before the centre line's points (an earlier block is replaced)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'js', 'tracks', C['id'] + '.js'); src = open(path, encoding='utf-8').read()
    src = re.sub(r'    // roads for the look only .*?\n(?:    (?://|stranske:|svetilke:|postaje:).*\n)*', '', src)
    blk = ('    // roads for the look only (package Realizem E, World.cesta.stranske; tools/cesta/izvoz.py from OpenStreetMap, ODbL): the roads that\n'
           '    // meet the track [m after the start line, side, class, width, one-way, end, [x, z, ...]], street lamps [x, z] and bus stops\n'
           '    // [m after the start line, side, distance from the centre line, shelter]; nobody drives there\n')
    blk += ''.join('    %s: %s,\n' % (k, json.dumps(v, separators=(',', ':'))) for k, v in data if v)
    m = re.search(r'^    points: ', src, re.M); assert m, 'no points line in ' + path
    if any(v for k, v in data): src = src[:m.start()] + blk + src[m.start():]
    open(path, 'w', encoding='utf-8').write(src); print('written: js/tracks/%s.js' % C['id'])

if __name__ == '__main__': main()
