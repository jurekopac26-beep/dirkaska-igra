# Kildare, Irska: the roads by the circuit's grounds for js/world-kildare-obcestje.js (its WAYS line), from OpenStreetMap
# (© OpenStreetMap contributors, ODbL 1.0; the API's map call https://api.openstreetmap.org/api/0.6/map?bbox=-6.7560,53.2520,-6.7360,53.2625,
# downloaded 2026-11-22).   python3 -I tools/kildare/obcestje.py <map.osm>   -> rewrites the WAYS line in js/world-kildare-obcestje.js
# Each way: [OSM way, width in m, surface (0 asphalt, 1 pale gravel, 2 earth), centre line (1 broken white), start, end, x0, z0, x1, z1, ...]
#   (metres, the game's frame: x east and z south of the middle of the start line, as tools/kildare/kildare.json's; lat0 53.2570015,
#   lon0 -6.7450997 on WGS84); start, end: 0 a true end of the way (or a node it shares with another one drawn), 1 cut 250 m from the lap
#   (the builder fades it into the ground there), 2 the join with the stretch the realism package draws itself (PR #854,
#   js/world-realizem15.js: its 27 ways within 66 m of the lap, NEAR here; this one goes on from 6 m before its cut, over its fade).
#   Drawn: every highway=* way of the map but the raceways (the circuit's own: def.sk.race and the lap), the steps and the bridges (OSM
#   bridge=*: no height in OSM; the footbridge is the circuit's own), up to 250 m from the lap.
#   width: OSM width=* if tagged (none of these is); else lanes=* x the lane (3.25 m on the secondary road: way 23568074, lanes=2,
#   surface=asphalt; assumed, as tools/luanda/obcestje.py); else by the kind of road (service 3.6 m and footway 1.8 m as #854,
#   unclassified 5.5 m; assumed). surface: OSM surface=*; untagged, a service road or a footway as pale gravel (as #854), the others as
#   asphalt (assumed). centre line: on the two-lane asphalt road (OSM has no tag for the marking itself; its pattern, 3 m of line and 9 m
#   of gap, 0.1 m wide, is assumed)
import math, os, re, sys, json
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
LAT0, LON0 = 53.2570015, -6.7450997
FAR, CUT, FADE, KEPT = 250.0, 66.0, 6.0, 30.0
NEAR = {38715379, 87185965, 88611279, 88611291, 88611296, 265528120, 265528122, 265528123, 981347880, 1323583460, 1323583461, 1323583468,
        1323583469, 1323583470, 1323583471, 1323583472, 1323583473, 1323583475, 1323583480, 1323583483, 1323583484, 1323583485, 1323583486,
        1323583487, 1323583488, 1323583489, 1323583490}
LANE = {'primary': 3.5, 'primary_link': 3.5, 'trunk': 3.5, 'trunk_link': 3.5, 'secondary': 3.25, 'secondary_link': 3.25, 'tertiary': 3.25, 'tertiary_link': 3.25}
DEF = {'primary': 7.0, 'trunk': 7.0, 'secondary': 6.5, 'tertiary': 6.5, 'unclassified': 5.5, 'residential': 5.5, 'living_street': 5.0,
       'service': 3.6, 'track': 3.0, 'footway': 1.8, 'path': 1.5, 'cycleway': 2.0, 'bridleway': 1.5}
SURF = {'asphalt': 0, 'paved': 0, 'concrete': 0, 'unpaved': 2, 'ground': 2, 'dirt': 2, 'earth': 2, 'grass': 2, 'compacted': 1, 'gravel': 1, 'fine_gravel': 1}
FOOT = {'footway', 'path', 'cycleway', 'bridleway', 'steps', 'pedestrian'}
SKIP = {'raceway', 'steps', 'proposed', 'construction', 'platform', 'elevator'}

A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F); S0 = math.sin(math.radians(LAT0)); W0 = 1 - E2 * S0 * S0
MR, NR, C0 = A * (1 - E2) / W0 ** 1.5, A / math.sqrt(W0), math.cos(math.radians(LAT0))
xz = lambda lat, lon: (math.radians(lon - LON0) * NR * C0, -math.radians(lat - LAT0) * MR)

src = open(os.path.join(ROOT, 'js', 'tracks', 'kildare.js'), encoding='utf-8').read()
LAP = [(float(a), float(b)) for a, b in re.findall(r'\[(-?[0-9.]+),(-?[0-9.]+)\]', re.search(r'points: \[(\[.*?\])\]', src).group(1))]
SEG = list(zip(LAP, LAP[1:] + LAP[:1]))

def dlap(x, z):
    best = 1e9
    for (ax, az), (bx, bz) in SEG:
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

def dense(Q, step=1.0):   # the way every <= 1 m, with its length along it
    out = [(Q[0][0], Q[0][1], 0.0)]
    for (ax, az), (bx, bz) in zip(Q, Q[1:]):
        L = math.hypot(bx - ax, bz - az); n = max(1, math.ceil(L / step))
        for k in range(1, n + 1): out.append((ax + (bx - ax) * k / n, az + (bz - az) * k / n, out[-1][2] + L / n))
    return out

def runs(D, keep):   # the stretches where keep(distance to the lap) holds: [(u0, u1)] along the way
    R, u0, prev = [], None, None
    for x, z, u in D:
        ok = keep(dlap(x, z))
        if ok and u0 is None: u0 = u
        if not ok and u0 is not None: R.append((u0, prev)); u0 = None
        prev = u
    if u0 is not None: R.append((u0, prev))
    return R

def piece(Q, u0, u1):   # the way between u0 and u1 along it (its own nodes kept)
    out, u = [], 0.0
    for (ax, az), (bx, bz) in zip(Q, Q[1:]):
        L = math.hypot(bx - ax, bz - az)
        a, b = max(u0, u), min(u1, u + L)
        if b >= a and L > 0:
            p = (ax + (bx - ax) * (a - u) / L, az + (bz - az) * (a - u) / L); q = (ax + (bx - ax) * (b - u) / L, az + (bz - az) * (b - u) / L)
            if not out or math.hypot(out[-1][0] - p[0], out[-1][1] - p[1]) > 1e-6: out.append(p)
            if math.hypot(q[0] - out[-1][0], q[1] - out[-1][1]) > 1e-6: out.append(q)
        u += L
    return out

def main(path):
    root = ET.parse(path).getroot()
    N = {n.get('id'): (float(n.get('lat')), float(n.get('lon'))) for n in root.iter('node')}
    W = []
    for w in root.iter('way'):
        t = {e.get('k'): e.get('v') for e in w.findall('tag')}; hw = t.get('highway')
        if not hw or hw in SKIP or t.get('area') == 'yes' or t.get('bridge', 'no') != 'no' or t.get('tunnel', 'no') != 'no': continue
        nodes = [r.get('ref') for r in w.findall('nd') if r.get('ref') in N]
        if len(nodes) > 1: W.append((int(w.get('id')), hw, t, nodes))
    out, metres = [], 0.0
    for wid, hw, t, nodes in sorted(W):
        m = re.match(r'^\s*([0-9.]+)\s*(m)?\s*$', t.get('width', ''))
        lanes = t.get('lanes', '')
        wd = float(m.group(1)) if m else int(lanes) * LANE.get(hw, 3.0) if lanes.isdigit() and int(lanes) > 0 and hw not in FOOT else DEF.get(hw, 3.6)
        s = t.get('surface')
        sf = SURF[s] if s in SURF else 1 if hw in ('service', 'footway', 'path', 'track') else 0
        cl = 1 if sf == 0 and lanes == '2' else 0
        Q = [xz(*N[n]) for n in nodes]; D = dense(Q); U = D[-1][2]
        if wid in NEAR:   # beyond the realism package's cut: from 6 m before it (its fade) on; a short excursion beyond 66 m between
            #               two stretches within it (under KEPT m: ways 38715379, 981347880) is #854's own, which draws it without a cut
            R = [(u0, u1) for u0, u1 in runs(D, lambda d: d > CUT) if u0 == 0 or u1 == U or u1 - u0 >= KEPT]
            R = [(max(0.0, u0 - FADE) if u0 > 0 else 0.0, min(U, u1 + FADE) if u1 < U else U, u0 > 0, u1 < U) for u0, u1 in R]
        else:
            R = [(0.0, U, False, False)]
        for u0, u1, j0, j1 in R:
            sub = [p for p in D if u0 - 1e-6 <= p[2] <= u1 + 1e-6]
            for a, b in runs(sub, lambda d: d <= FAR):
                a, b = u0 if a == sub[0][2] else a, u1 if b == sub[-1][2] else b
                if b - a < 3: continue
                P = rdp(piece(Q, a, b), 0.1)
                e0 = 2 if j0 and a == u0 else 1 if a > 1e-6 else 0
                e1 = 2 if j1 and b == u1 else 1 if b < U - 1e-6 else 0
                out.append([wid, round(wd, 2), sf, cl, e0, e1] + [round(v, 1) for p in P for v in p]); metres += b - a
    js = os.path.join(ROOT, 'js', 'world-kildare-obcestje.js')
    txt = open(js, encoding='utf-8').read()
    txt, n = re.subn(r'^  const WAYS = .*\n', lambda _: '  const WAYS = ' + json.dumps(out, separators=(',', ':')) + ';\n', txt, flags=re.M)
    assert n == 1, 'WAYS line not found'
    open(js, 'w', encoding='utf-8').write(txt)
    print('%d ways, %.0f m (%s)' % (len(out), metres, ', '.join('%d %s %.1f m' % (r[0], 'AGE'[r[2]], r[1]) for r in out)))

if __name__ == '__main__':
    main(sys.argv[1])
