# Kildare, Irska: the game's track file from the track data (tools/kildare/kildare.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/kildare/build.py             -> js/tracks/kildare.js (centre line, heights, names, surfaces, stands, terrain, land cover, scenery)
#   python3 -I tools/kildare/build.py --osm RAW   -> first tools/kildare/extra.json from tools/proga-podatki.py's OSM download (RAW/kildare-osm.json):
#                                                    the power lines, the circuit's other raceways (the layouts this lap leaves out), the footbridge
#   python3 -I tools/kildare/build.py --info      -> the bends, where the buildings, the power lines and the other raceways meet the lap
# Edit the names, the surfaces, the stands and the text here, not in the generated file. Distances here are metres after the start line on
# the data's line (kildare.json: OSM as it is); the script carries them onto the game's line (its tight corners rounded, below).
# Plan: docs/nove-proge-1-0.md (A5), the track: docs/proge/kildare.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'kildare.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (90.0 m): the game's zero
RCUM = np.r_[0, np.cumsum(np.hypot(*np.diff(RAW, axis=0).T))]

# ---- the centre line: OSM's raceways of the rallycross lap (tools/kildare/config.json), from the start line (OSM raceway "Start/Finish") in
# their one-way direction, clockwise. Three corners are joints of two raceways at a point (OSM: the lap turns from one onto the other there):
# the west hairpin (140 deg, where the link leaves the circuit's south straight), the sharp right at the link's top (93 deg) and the left
# onto the gravel (119 deg); each rounded to an arc that touches both (radius R: the wedge of tarmac between the two roads' inner edges,
# where the cars turn), then all of the line's corners at its nodes (sigma 5 m), and the line spaced evenly again ----
FILLETS = [(463, 9.0), (536, 12.0), (619, 10.5)]   # (the joint: m after the start line on the data's line, the arc's radius)

def unit(v): return v / np.hypot(*v)

def fillet(L, sv, R):
    cum = np.r_[0, np.cumsum(np.hypot(*np.diff(L, axis=0).T))]
    pt = lambda s: np.array([np.interp(s, cum, L[:, 0]), np.interp(s, cum, L[:, 1])])
    # the two roads' lines: fitted to the line 10 .. 35 m before the joint and 8 .. 22 m after it; the joint V where they meet
    def fit(a, b):
        ss = np.arange(a, b + 0.1, 2.5); Q = np.array([pt(s) for s in ss]); c = Q.mean(0); u, sv_, vt = np.linalg.svd(Q - c); d = vt[0]
        if d @ (Q[-1] - Q[0]) < 0: d = -d
        return c, d
    c1, a = fit(sv - 35, sv - 10); c2, b = fit(sv + 8, sv + 22)
    A = np.array([a, -b]).T; t1, t2 = np.linalg.solve(A, c2 - c1); V = c1 + a * t1
    th = math.acos(np.clip(a @ b, -1, 1)); t = R * math.tan(th / 2); turn = np.sign(a[0] * b[1] - a[1] * b[0])
    n = np.array([-a[1], a[0]]) * turn   # (towards the inside of the turn)
    T1 = V - a * t; C = T1 + n * R; T2 = V + b * t
    a0 = math.atan2(*(T1 - C)[::-1]); a1 = math.atan2(*(T2 - C)[::-1]); da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
    arc = np.array([C + R * np.array([math.cos(a0 + da * f), math.sin(a0 + da * f)]) for f in np.linspace(0, 1, max(3, int(abs(da) * R / 1.0)))])
    # the line up to where it passes the arc's first point, the arc, the line on from where it passes its last
    i1 = int(np.argmin(np.hypot(*(L - T1).T) + 1e3 * (np.abs(cum - (sv - t)) > 40))); i2 = int(np.argmin(np.hypot(*(L - T2).T) + 1e3 * (np.abs(cum - (sv + t)) > 40)))
    return np.vstack([L[:i1], arc, L[i2 + 1:]]), dict(V=V, t=t, deg=math.degrees(th), dev=float(np.hypot(*(V - C)) - R))

FL = RAW.copy(); FINFO = []
for sv, R in FILLETS:   # (the data's s of each joint on the line as it is when its turn comes: the earlier ones shortened it)
    s_now = float(np.r_[0, np.cumsum(np.hypot(*np.diff(FL, axis=0).T))][np.argmin(np.hypot(*(FL - RAW[int(round(sv / STEP))]).T))])
    FL, inf = fillet(FL, s_now, R); FINFO.append((sv, R, inf))

def resample(L, n):
    Lc = np.vstack([L, L[:1]]); c = np.r_[0, np.cumsum(np.hypot(*np.diff(Lc, axis=0).T))]; ss = np.arange(n) * c[-1] / n
    return np.stack([np.interp(ss, c, Lc[:, 0]), np.interp(ss, c, Lc[:, 1])], 1)

P0 = resample(FL, NP)
P = resample(np.stack([ndimage.gaussian_filter1d(P0[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(P0[:, 1], 1.0, mode='wrap')], 1), NP)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south), and the distance to the line
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl), float(d[i])

def sn(s0):   # the data line's s (OSM as it is) on the game's line
    s0 = s0 % RCUM[-1]; x = np.interp(s0, RCUM, RAW[:, 0]); z = np.interp(s0, RCUM, RAW[:, 1]); s = sd(x, z)[0]
    return round(s - LEN if s - s0 > LEN / 2 else s, 1)

def sm(s): return s if s < LEN / 2 else s - LEN   # (metres from the start line, before it negative)

# ---- the surfaces (def.surf): OSM's raceways surface=gravel, the rallycross's own (the gravel right after the start and the gravel straight
# up the west side); the rest asphalt (the circuit's raceways, the link to the gravel untagged) ----
GRAVEL = [w[:2] for w in J['ways'] if len(w) > 7 and w[7] == 'gravel']   # ([from, to] on the data's line)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, sponsors or the circuit
# (CLAUDE.md, Pravna varnost): the real corners are named after firms, a shop, a tyre maker and people ----
NAMES = [
    ('Desni na makadamu', 100, ['Onto the gravel, right and right again!', 'Sliding round the gravel right!', 'The double right on the gravel!']),
    ('Hitri levi', 235, ['Back on the tarmac, quick through the left!', 'The fast left, flat out!', 'Through the fast left-hander!']),
    ('Južna ravnina', 380, ['Down the south straight!', 'Flat out along the south straight!', 'Along the straight, the hairpin ahead!']),
    ('Zahodna lasnica', 463, ['The west hairpin, right round!', 'Hard on the brakes for the west hairpin!', 'Slow, slow, right round the hairpin!']),
    ('Ostri desni', 536, ['The sharp right at the top of the link!', 'Tight through the sharp right!', 'Right, and along the short straight!']),
    ('Levi na makadam', 619, ['Left, off the tarmac onto the gravel!', 'Onto the gravel through the left!', 'Left, and onto the loose stuff!']),
    ('Makadamska ravnina', 745, ['Flat out up the gravel straight!', 'Up the gravel, the stones flying!', 'Along the gravel straight!']),
    ('Severna lasnica', 900, ['The north hairpin, back onto the tarmac!', 'Right round the north hairpin!', 'Slow, slow, round the hairpin at the top!']),
    ('Ciljna ravnina', 1060, ['Down the finish straight past the pits!', 'Flat out along the finish straight!', 'The finish straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the gravel right (2), the fast left, the west hairpin, the sharp
# right, the left onto the gravel, the right on the gravel straight, the north hairpin
TURNS = [62, 125, 235, 463, 536, 619, 648, 900]

DESC = ('Kratka proga za reli kros na dirkališču v grofiji Kildare na vzhodu Irske, zahodno od Dublina: 1,2 km asfalta in makadama v smeri '
        'urinega kazalca, skoraj ravno. Ciljna ravnina, dvojni desni na makadamu, hitri levi, južna ravnina, zahodna lasnica, ostri desni, levi '
        'na makadam, makadamska ravnina in severna lasnica nazaj na asfalt. Ob progi trava, ograje in gume, tribuna, brv čez progo, garaže '
        'boksov, stolp ob ciljni črti, ceste drugih postavitev dirkališča in daljnovod.')
DESC_EN = ('A short rallycross track at the circuit in County Kildare in the east of Ireland, west of Dublin: 1.2 km of tarmac and gravel, '   # (no č, š or ž in the English: tests/lang.test.js)
           'clockwise, almost flat. The finish straight, the double right on the gravel, the fast left, the south straight, the west hairpin, '
           'the sharp right, the left onto the gravel, the gravel straight and the north hairpin back onto the tarmac. Grass, fences and tyre '
           'walls, a grandstand, a footbridge over the track, the pit garages, the tower by the line, the roads of the circuit\'s other '
           'layouts and a power line.')

# ---- no pits: a rallycross race has no stops (the circuit's pit lane, right of the finish straight, and its garages stand as they are) ----
# grandstands [from, to, side, rows, roof, sections, orange, name]: the circuit's grandstand by the gravel right after the start (OSM: left
# of the straight, 31 m from the line; the game's tiers where it stands, its OSM box left out of the buildings), from 48 m: the footbridge's
# steps come down just before it (OSM: 40 m)
STANDS = [[48, 82, -1, 6, 0, 2, 0, 'KILDARE']]
# the pit wall (Core: def.walls [from, to, side, metres past the road's edge, ease], data s): right of the finish straight, the pit lane
# behind it (OSM: its middle 11 m from ours; js/world-kildare.js draws it), to where the lane comes in after the line
WALLS = [[-200, 8, 1, 1.2, 20]]
# ... and the barriers on the insides of the tight bends ([from, to, side, metres past the edge, ease], game s: metres after the start line):
# pulled in so that none folds back on itself (Core's barrier on the inside of a bend tighter than its offset; as js/tracks/sosnova.js)
IN_WALLS = [[438, 456, 1, 2, 8], [500, 514, 1, 8, 10], [566, 588, -1, 4, 8], [804, 822, -1, 14, 10], [836, 850, 1, 10, 10]]
SECTORS = [300, 700]
REAL_KM = 1.2
LAPS = 8

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the OSM extras (--osm RAW): from the raw download ----
def osm_extra(raw):
    d = json.load(open(os.path.join(raw, 'kildare-osm.json'))); N = d['nodes']; W = d['ways']
    lat0, lon0 = J['lat0'], J['lon0']; A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F); s = math.sin(math.radians(lat0)); w = 1 - E2 * s * s
    M = A * (1 - E2) / w ** 1.5; Nr = A / math.sqrt(w); c = math.cos(math.radians(lat0))   # (tools/proga-podatki.py's Frame)
    xz = lambda n: (math.radians(N[n][1] - lon0) * Nr * c, -math.radians(N[n][0] - lat0) * M)
    tags = lambda n: N[n][2] if len(N[n]) > 2 else {}
    near = lambda x, z: float(np.hypot(RAW[:, 0] - x, RAW[:, 1] - z).min())
    ways = [(wid, wv[0], wv[1]) for wid, wv in W.items() if isinstance(wv, list) and len(wv) > 1 and isinstance(wv[1], dict)]
    # the power lines: every line and minor line with a pylon within 900 m of the lap, as chains of ways sharing their ends (one per line),
    # its pylons from the last one past 900 m to the first one past it on the other side: [kV, [x, z, kind (1 a tower, 2 a pole), ...]]
    lines = {}
    for wid, nodes, t in ways:
        if t.get('power') not in ('line', 'minor_line'): continue
        try: kv = int(str(t.get('voltage', '0')).split(';')[0]) // 1000
        except ValueError: kv = 0
        nodes = [n for n in nodes if n in N]
        if not nodes or min(near(*xz(n)) for n in nodes) > 900: continue
        lines.setdefault(kv, []).append(nodes)
    power = []
    for kv, ws in sorted(lines.items(), reverse=True):
        ws = [list(x) for x in ws]
        while ws:   # (chain the ways end to end)
            ch = ws.pop(0); grown = True
            while grown:
                grown = False
                for k, x in enumerate(ws):
                    if x[0] == ch[-1]: ch += x[1:]
                    elif x[-1] == ch[-1]: ch += x[::-1][1:]
                    elif x[-1] == ch[0]: ch = x + ch[1:]
                    elif x[0] == ch[0]: ch = x[::-1] + ch[1:]
                    else: continue
                    ws.pop(k); grown = True; break
            dd = [near(*xz(n)) for n in ch]; ins = [k for k, v in enumerate(dd) if v <= 900]
            if not ins: continue
            a = max(0, ins[0] - 1); b = min(len(ch) - 1, ins[-1] + 1); out = []
            for n in ch[a:b + 1]:
                x, z = xz(n); pw = tags(n).get('power', ''); out += [round(x, 1), round(z, 1), 1 if pw in ('tower', 'portal', 'terminal') else 2]
            if len(out) >= 6: power.append([kv, out])
    # the circuit's other raceways (its layouts this lap leaves out, the rallycross's other gravel): every raceway with a node within 150 m
    # of the lap, its nodes as they are: [surface (0 asphalt, 5 gravel), [x, z, ...]] (World draws them up to the barriers of the lap)
    route = set(str(w[0]) for w in json.load(open(os.path.join(raw, 'kildare-route.json')))['ways'])
    race = []
    for wid, nodes, t in ways:
        if t.get('highway') != 'raceway' or wid in route: continue
        pts = [xz(n) for n in nodes if n in N]
        if len(pts) < 2 or min(near(x, z) for x, z in pts) > 150: continue
        race.append([5 if t.get('surface') in ('gravel', 'dirt', 'unpaved', 'compacted', 'fine_gravel') else 0, [round(v, 1) for p in pts for v in p]])
    # the footbridge over the lap (OSM: a footway on a bridge, its steps at both ends): [x, z, ...] of its deck
    foot = []
    for wid, nodes, t in ways:
        if t.get('highway') == 'footway' and t.get('bridge') and t.get('bridge') != 'no':
            pts = [xz(n) for n in nodes if n in N]
            if pts and min(near(x, z) for x, z in pts) < 30: foot.append([round(v, 1) for p in pts for v in p])
    json.dump({'about': 'Kildare, Irska: OSM extras for tools/kildare/build.py (© OpenStreetMap contributors, ODbL 1.0): power: [kV, [x, z, kind (1 a tower, 2 a pole), ...]], the power lines within 900 m; race: [surface (0 asphalt, 5 gravel), [x, z, ...]], the raceways of the circuit that the rallycross lap leaves out, within 150 m; foot: [[x, z, ...]], the footbridge over the lap; the frame of kildare.json (x east, z south, metres from its first route point)',
               'power': power, 'race': race, 'foot': foot}, open(os.path.join(HERE, 'extra.json'), 'w'), separators=(',', ':'))
    print('extra.json:', len(power), 'power lines', [(p[0], len(p[1]) // 3) for p in power], ';', len(race), 'raceways', [(r[0], len(r[1]) // 2) for r in race], '; footbridge', foot)

def extra(): return json.load(open(os.path.join(HERE, 'extra.json')))   # (in the data's frame, as kildare.json)

# ---- the scenery: terrain (dem), land cover (lc), the buildings (sk.bld), the power lines (sk.power), the other raceways (sk.race), the
# footbridge (sk.foot) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
    gx = (X - g['x0']) / g['cell'] - 0.5; gz = (Z - g['z0']) / g['cell'] - 0.5
    v = ndimage.map_coordinates(a.astype(np.float32), [gz, gx], order=1 if heights else 0, mode='nearest')
    return v / 10.0 - 100.0 if heights else v

def rle_lc(c):   # World's land-cover classes (0-3), run-length coded as World.nrPrep reads them
    flatc = c.ravel(); out = []; k = 0; n = len(flatc)
    while k < n:
        v = int(flatc[k]); m = k
        while m < n and flatc[m] == v: m += 1
        run = m - k; k = m
        if run <= 15: out.append(A64[v * 16 + run - 1])
        else:
            out.append(A64[v * 16 + 15]); r = run - 16
            while r >= 63: out.append(A64[63]); r -= 63
            out.append(A64[r])
    return ''.join(out)

def b64bytes(a): return base64.b64encode(np.asarray(a, np.uint8).tobytes()).decode()

def is_stand(s, d, l, w): return 30 < s < 95 and -45 < d < -15 and l * w > 300   # (the grandstand: the game's own tiers where it stands)

def bkind(s, d, l, w, hgt):   # 0 a building of the paddock, 4 the pit garages (a long row, its doors to the straight), 5 a hall, 6 the tower by the line
    if hgt > 9 and l * w < 200: return 6
    if l > 4 * w and l > 40: return 4
    return 5 if l * w > 300 else 0

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -20 m (the
    # circuit's land within 2 m of the start line all round, the farmland round it a few metres either way)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the circuit's grass, the pasture), 1 forest (the woods, the hedgerows' trees), 2 fields (crops), 3
    # built-up (the paddock, the car parks, the farmyards); OSM's land use first, ESA WorldCover and the canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (wc == 20) | (ch > 5)] = 1
            cls[(wc == 40) & (ch <= 5)] = 2
            cls[(wc == 50) & (ch <= 6)] = 3
            cls[lu == 9] = 1; cls[(lu == 8) & (ch > 4)] = 1
            cls[(lu == 3) & (ch <= 5)] = 2
            cls[((lu == 4) | (lu == 10) | (lu == 13)) & (ch <= 5)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height, kind (bkind)]; not the grandstand
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, _, _ = b; s, d, _ = sd(x, z)
        if is_stand(s, d, l, w): continue
        k = bkind(s, d, l, w, hgt); hh = hgt if hgt > 2 else 4.6 if k == 4 else 7.0 if l * w > 300 else 4.5 if l * w > 60 else 3.0
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), k]
    X = extra()
    pw = [p for p in X['power'] if min(sd(p[1][k], p[1][k + 1])[2] for k in range(0, len(p[1]), 3)) < 700]   # (the power lines with a pylon within 700 m)
    return D, LC, dict(bld=bld, power=pw, race=X['race'], foot=X['foot'])

# ---- the horizon (def.far for Riverside's rsFar, js/world-riverside.js): the highest ground in rings round the circuit ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray()
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for a in range(na):
            m = 0.0
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (a + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round(m / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=0, step=step, b64=base64.b64encode(bytes(out)).decode())

def info():
    print('length %.1f m (the data %.1f m), %d points; heights %.1f .. %.1f m above the sea (start %.1f)' % (LEN, RCUM[-1], NP, H.min(), H.max(), H0))
    for sv, R, inf in FINFO: print('joint at %d m: %.0f deg, rounded to R %.1f m (from %.1f m before it to %.1f m after; the arc %.1f m inside the joint)' % (sv, inf['deg'], R, inf['t'], inf['t'], inf['dev']))
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('tightest: R %.1f m at %.0f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()]))
    print('bends (R < 80 m):', ' '.join('%.0f:%s%.0f' % (CUM[i], 'R' if ks[i] > 0 else 'L', 1 / abs(ks[i])) for i in range(NP) if abs(ks[i]) > 1 / 80 and abs(ks[i]) >= abs(ks[i - 1]) and abs(ks[i]) >= abs(ks[(i + 1) % NP])))
    off = [np.hypot(P[:, 0] - x, P[:, 1] - z).min() for x, z in RAW]; print('off the data line: %.1f m at most (at %.0f m of the data)' % (max(off), RCUM[int(np.argmax(off))]))
    print('gravel (data -> game):', [(a, b, sn(a), sn(b)) for a, b in GRAVEL])
    for b in J['bld']:
        s, dd, _ = sd(b[0], b[1]); print('building %5.1f x %4.1f h %4.1f: at %5.0f m, %6.1f m to the side%s' % (b[2], b[3], b[5], sm(s), dd, ' (the grandstand: left out)' if is_stand(s, dd, b[2], b[3]) else ' kind %d' % bkind(s, dd, b[2], b[3], b[5])))
    if os.path.exists(os.path.join(HERE, 'extra.json')):
        X = extra()
        for kv, p in X['power']:
            dd = [sd(p[q], p[q + 1]) for q in range(0, len(p), 3)]; m = min(dd, key=lambda v: v[2])
            print('power %d kV, %d pylons: the nearest %.0f m from the lap (at %.0f m)' % (kv, len(p) // 3, m[2], m[0]))
        for sf, p in X['race']:
            dd = [sd(p[q], p[q + 1]) for q in range(0, len(p), 2)]; m = min(dd, key=lambda v: v[2])
            print('raceway %s, %d nodes: nearest %.1f m (at %.0f m)' % ('gravel' if sf else 'asphalt', len(p) // 2, m[2], m[0]))
        for p in X['foot']: print('footbridge: at', [round(sd(p[q], p[q + 1])[0]) for q in range(0, len(p), 2)])

def build_track():
    hk = H[::2]; kh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line (of the data's line), decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(sn(s)); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(sn(s))) for s in TURNS) + ']'
    surf = [[sn(a), sn(b), 'makadam'] for a, b in GRAVEL]
    stands = [[sn(st[0]), sn(st[1])] + st[2:] for st in STANDS]
    walls = [[round(sm(sn(w[0])), 1), round(sm(sn(w[1])), 1)] + w[2:] for w in WALLS] + IN_WALLS
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'kildare'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Kildare, Ireland: the rallycross lap of the circuit in County Kildare, west of Dublin, clockwise, in its layout and scale as OpenStreetMap
  // maps it (the circuit's raceways with the rallycross's gravel): the start line on the finish straight, the double right on the gravel, the
  // fast left, the south straight, the west hairpin, the sharp right at the top of the link, the left onto the gravel, the gravel straight and
  // the north hairpin onto the finish straight: %(km)s km on our line (1.2 km). No pits: a rallycross race has no stops.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/kildare/config.json: the lap's 12 raceways
  // in their one-way direction, clockwise); the three joints where it turns from one raceway onto another rounded to arcs (9-12 m), the
  // corners at its nodes (sigma 5 m); metres, x east, z south, origin = the start line.
  // GENERATED by tools/kildare/build.py (edit the names, the surfaces, the stands and the text there).
  // Heights (KD_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (90.0 m a.s.l.): within 2.1 m of it all round.
  // Scenery data for the world builder (js/world-kildare.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 the circuit's grass and the pasture, 1 the woods and the hedgerows' trees, 2
  // fields, 3 the paddock, the car parks, the farmyards: OSM, ESA WorldCover, the canopy), and sk: bld, the buildings by the circuit ([x, z,
  // length, width, angle (deg), height, kind (0 a building of the paddock, 4 the pit garages, 5 a hall, 6 the tower by the line)]: OSM
  // outlines as boxes; not the grandstand: def.stands), power, the power lines ([kV, [x, z, kind (1 a lattice tower, 2 a pole), ...]]: OSM),
  // race, the circuit's other raceways ([surface (0 asphalt, 5 gravel), [x, z, ...]]: OSM; the layouts this lap leaves out), foot, the
  // footbridge over the lap ([[x, z, ...]]: OSM).
  // The names: plain descriptions only (no names of people, firms, sponsors, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const KD_H = [%(kh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc4ccd2, sun: 0xfff1df, sunI: 0.94, sky: 0xa8bed2, gnd: 0x4b6c33, hemiI: 0.72, tint: [0.98, 1.0, 0.99], sat: 1.0, sunOff: [-62, 60, 76], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // the Irish midlands in summer: a soft, damp light, the sun from the south-west, cloud and haze over the green land
    say: 'Kildare', rainP: 0.5,
    grassNat: 0.35, lawn: [0.95, 1.04, 0.92],
    zivali: { a: ['fox', 'hare', 'horse', 'cowK', 'sheep'], t: ['logPile', 'fallenTree'], open: true },
    id: 'kildare', name: 'Kildare, Irska', theme: 'kildare', laps: %(laps)d, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Kildare, Ireland', desc: %(desc_en)s },
    start: %(start)s, runoff: 0.9, inner: 3.5, side: 5.5, noGravel: true, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: KD_H.map((h, i) => [i / KD_H.length, h / 10]),
    // the road's surfaces (Core: def.surf, m after the start line): gravel (makadam) where OSM's raceways are gravel, the rallycross's own: the
    // double right after the start and the gravel straight up the west side; asphalt elsewhere
    surf: %(surf)s,
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the gravel right (2), the fast left, the west hairpin, the sharp right, the left onto the gravel, the right on the gravel straight, the north hairpin
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the circuit's grandstand by the gravel right after the start
    stands: %(stands)s,
    walls: %(walls)s,   // the pit wall 1.2 m past the road's edge, the pit lane behind it; the tight bends' insides, none folding back
    maxRivals: 25,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the shortest circuit, its flying start's column (4/5 of a lap at most) would stand car on car with more (26 already do, the formula cars)
    sectors: %(sectors)s,   // the three sectors of the timing screens: the gravel right and the south straight, the hairpin and the link, the gravel straight and the finish straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    // the horizon (js/world-kildare.js: Riverside's rsFar): the highest ground in %(nfar)d rings out to %(rfar)s km round the circuit in 2 deg directions, m above the
    // sea (lo + byte x step: Copernicus DEM GLO-30 as it is, the woods and the towns with it): the low hills of north Kildare, the Wicklow Mountains to the east
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), start='[%s, %s]' % tuple(f1(v + 0.0) for v in at(0)), kh=kh, laps=LAPS, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM,
           surf=json.dumps(surf), names='\n'.join(names), turns=turns, stands=js(stands).replace(',', ', '), walls=json.dumps(walls), sectors=json.dumps([sn(s) for s in SECTORS]), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR),
           nfar=len(FAR_R), rfar='%g' % (FAR_R[-1] / 1000), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'kildare.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; buildings', len(SK['bld']) // 7, '; power', len(SK['power']), '; raceways', len(SK['race']), '; surf', surf)
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))

if __name__ == '__main__':
    if '--osm' in sys.argv: osm_extra(sys.argv[sys.argv.index('--osm') + 1])
    elif '--info' in sys.argv: info()
    else: build_track()
