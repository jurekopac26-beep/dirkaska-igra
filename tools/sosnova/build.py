# Sosnová, Češka: the game's track file from the track data (tools/sosnova/sosnova.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/sosnova/build.py             -> js/tracks/sosnova.js (centre line, heights, names, stands, terrain, land cover, scenery data)
#   python3 -I tools/sosnova/build.py --osm RAW   -> first tools/sosnova/extra.json from tools/proga-podatki.py's OSM download (RAW/sosnova-osm.json):
#                                                    the power lines over the circuit, the circuit's asphalt that this layout leaves out
#   python3 -I tools/sosnova/build.py --info      -> where the streams, the power lines and the buildings meet the circuit (m after the start line)
# Edit the names, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (A3), the track: docs/proge/sosnova.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'sosnova.json')))
STEP = J['step']
# the start line 35 m before the route's first point (7 points of 5 m): on the finish straight opposite the paddock's office (OSM: the route
# starts at the junction where the link from the infield joins the straight, tools/sosnova/config.json)
SHIFT = 7
RAW = np.roll(np.array(J['line']).reshape(-1, 2), SHIFT, 0); H = np.roll(np.array(J['h']), SHIFT); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (255.6 m): the game's zero

# ---- the centre line: OSM's raceways (the outer loop and the two inner parts, clockwise), their nodes' corners rounded (sigma 5 m); in the
# chicane after the lower hairpin (OSM: a 6 m radius on the centre line, where the cars barely turn on the 11 m wide road) eased out to ~10 m ----
def smooth(sg): return np.stack([ndimage.gaussian_filter1d(RAW[:, 0], sg, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], sg, mode='wrap')], 1)
_s = np.arange(NP) * STEP
_wt = np.clip(np.minimum((_s - 175) / 20, (275 - _s) / 20), 0, 1)[:, None]   # (the chicane, 195 .. 255 m after the start line, eased in and out over 20 m)
P = smooth(1.0) * (1 - _wt) + smooth(3.0) * _wt
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl), float(d[i])

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms or the circuit (CLAUDE.md, Pravna varnost) ----
NAMES = [
    ('Levi za ciljem', 84, ['Into the left at the end of the straight!', 'Hard on the brakes for the first left!', 'Round the left past the line!']),
    ('Spodnja lasnica', 150, ['The lower hairpin, right round by the paddock!', 'Slow, slow, right round the lower hairpin!', 'Round the hairpin below the paddock!']),
    ('Šikana', 215, ['The chicane, left and right!', 'Tight through the chicane!', 'Left, then right, through the chicane!']),
    ('Dolgi levi', 340, ['The long left at the top of the infield!', 'Holding it round the long left!', 'Left, and left again, round the long left!']),
    ('Zahodna ravnina', 480, ['Down the west straight!', 'Flat out down the west straight!', 'Along the straight by the fields!']),
    ('Zahodna lasnica', 575, ['The west hairpin!', 'Right round the hairpin in the corner!', 'Hard on the brakes for the west hairpin!']),
    ('Desni čez potok', 720, ['The long right, over the stream!', 'Round the right over the brook!', 'Through the long right-hander!']),
    ('Severna ravnina', 870, ['The north straight, under the power lines!', 'Flat out under the power lines!', 'Along the north straight!']),
    ('Hitri desni', 969, ['Quick through the fast right!', 'The fast right at the end of the straight!', 'Through the fast right-hander!']),
    ('Esovka', 1105, ['Left and right through the esses!', 'Through the esses over the stream!', 'Flick it through the esses!']),
    ('Vzhodna lasnica', 1206, ['The east hairpin, right round!', 'Slow, slow, round the east hairpin!', 'Round the hairpin by the meadow!']),
    ('Dvojni levi', 1345, ['Left, and left again, round the double left!', 'Into the double left!', 'Through the double left!']),
    ('Zadnja lasnica', 1555, ['The last hairpin, onto the straight!', 'Round the last hairpin!', 'Right round the last hairpin, the line ahead!']),
    ('Ciljna ravnina', 1645, ['Down the finish straight past the paddock!', 'Flat out along the finish straight!', 'The finish straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the left past the line, the lower hairpin, the chicane (2), the long
# left (2), the west hairpin, the fast right, the esses (2), the east hairpin, the double left (2), the last hairpin
TURNS = [84, 150, 205, 230, 307, 376, 575, 969, 1088, 1122, 1206, 1309, 1378, 1562]

DESC = ('Kratko dirkališče na travnikih pri vasi Sosnová blizu Češke Lipe na severu Češke: 1,7 km v smeri urinega kazalca, skoraj ravno, '
        's štirimi lasnicami in ostro šikano. Ciljna ravnina ob depoju, levi za ciljem, spodnja lasnica, šikana, dolgi levi in zahodna ravnina, '
        'lasnica v zahodnem kotu, dolgi desni čez potok, severna ravnina pod daljnovodi, hitri desni, esovka, vzhodna lasnica, dvojni levi '
        'in zadnja lasnica nazaj na ravnino. Ob progi travniki, potoka, štirje daljnovodi, borov in brezov gozd ter garaže depoja.')
DESC_EN = ('A short circuit on the meadows by the village of Sosnová in the north of Czechia: 1.7 km, clockwise, almost flat, '   # (no č, š or ž in the English: tests/lang.test.js)
           'with four hairpins and a tight chicane. The finish straight by the paddock, the left past the line, the lower hairpin, the chicane, '
           'the long left and the west straight, the hairpin in the west corner, the long right over the stream, the north straight under the '
           'power lines, the fast right, the esses, the east hairpin, the double left and the last hairpin back onto the straight. Meadows, two '
           'streams, four power lines, pine and birch woods and the paddock\'s garages by the track.')

# ---- no pits: the finish straight (140 m between the last hairpin and the left past the line) is too short for a pit lane with the 13
# crews' boxes (tests/pits.test.js); the paddock's garages, its office and its hall (OSM) stand on its left as they are ----
# the barriers held this side of the paddock's buildings left of the finish straight (the garages 12 m from the centre line) and of the
# stream that runs by the circuit left of the long right (def.sk.brooks: 20 m from the centre line; the run-off outside the bend reaches past it)
# and on the inside of the tight bends between bends the other way (the left past the line, the chicane, the long left's entry, the esses),
# where the run-off of the bend before or after reached round the inside and the barrier folded back on itself
WALLS = [[-110, 20, -1, 4, 20], [600, 670, -1, 9, 15], [70, 88, -1, 3.5, 10], [186, 212, -1, 3.5, 14], [296, 312, -1, 3.5, 10], [1076, 1092, -1, 3.5, 10],
         [164, 174, 1, 3.5, 8], [218, 242, 1, 3.5, 10], [1114, 1126, 1, 3.5, 8]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: a bank of seats on the grass by the start line, across from the paddock
STANDS = [[-25, 15, 1, 5, 0, 2, 0, 'SOSNOVÁ']]
SECTORS = [440, 1060]
REAL_KM = 1.7

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the OSM extras (--osm RAW): the power lines, from the raw download ----
def osm_extra(raw):
    d = json.load(open(os.path.join(raw, 'sosnova-osm.json'))); N = d['nodes']; W = d['ways']
    lat0, lon0 = J['lat0'], J['lon0']; A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F); s = math.sin(math.radians(lat0)); w = 1 - E2 * s * s
    M = A * (1 - E2) / w ** 1.5; Nr = A / math.sqrt(w); c = math.cos(math.radians(lat0))   # (tools/proga-podatki.py's Frame)
    xz = lambda n: (math.radians(N[n][1] - lon0) * Nr * c, -math.radians(N[n][0] - lat0) * M)
    tags = lambda n: N[n][2] if len(N[n]) > 2 else {}
    near = lambda x, z: float(np.hypot(P[:, 0] - x, P[:, 1] - z).min())
    # the power lines: every line and minor line with a pylon within 900 m of the circuit, as chains of ways sharing their ends (one per
    # line), its pylons from the last one past 900 m to the first one past it on the other side: [kV, [x, z, kind (1 a tower, 2 a pole), ...]]
    lines = {}
    for wid, wv in W.items():
        if not (isinstance(wv, list) and len(wv) > 1 and isinstance(wv[1], dict)): continue
        t = wv[1]
        if t.get('power') not in ('line', 'minor_line'): continue
        kv = int(str(t.get('voltage', '0')).split(';')[0]) // 1000
        nodes = [n for n in wv[0] if n in N]
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
    json.dump({'about': 'Sosnová, Češka: OSM extras for tools/sosnova/build.py (© OpenStreetMap contributors, ODbL 1.0): power: [kV, [x, z, kind (1 a tower, 2 a pole), ...]], the power lines within 900 m; the frame of sosnova.json (x east, z south, metres from its first route point)',
               'power': power}, open(os.path.join(HERE, 'extra.json'), 'w'), separators=(',', ':'))
    print('extra.json:', len(power), 'power lines', [(p[0], len(p[1]) // 3) for p in power])

def extra(): return json.load(open(os.path.join(HERE, 'extra.json')))   # (in the data's frame, as sosnova.json)

# ---- the scenery: terrain (dem), land cover (lc), the streams (sk.brooks), the buildings (sk.bld), the power lines (sk.power) ----
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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -20 m (the
    # meadows round the circuit within a few metres of it, the valley of the Ploučnice to the north lower, the wooded hills round higher)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (meadows, grass), 1 forest (pine, birch), 2 fields (crops), 3 built-up (the paddock, the car parks, the
    # village); OSM's land use first, ESA WorldCover and the canopy height for the rest
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
    # the streams (OSM waterway=stream), each piece from upstream to downstream: [culvert (1: piped underground, not drawn), [x, z, ...] in
    # 0.5 m]; World finds the culverts under the circuit where an open piece is under the road
    brooks = [[1 if w[2] else 0, [round(v * 2) / 2 for v in w[3]]] for w in J['water'] if w[0] in ('stream', 'river', 'ditch', 'drain')]
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height, kind (0 a house, 4 a shed or garage, 5 a
    # hall, 6 the paddock's office)]; the garage rows by the straight (30 m long, 6 m deep) kind 4
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        hh = hgt if hgt > 2 else 7.0 if l * w > 500 else 4.2 if (l * w > 100 and kind != 0) or l > 2.8 * w else 5.5 if l * w > 100 else 3.2
        k = 4 if l > 2.8 * w else kind if kind in (4, 5, 6) else 0
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), k]
    X = extra()   # (the power lines: those with a pylon within 700 m)
    pw = [p for p in X['power'] if min(sd(p[1][k], p[1][k + 1])[2] for k in range(0, len(p[1]), 3)) < 700]
    return D, LC, dict(brooks=brooks, bld=bld, power=pw)

def info():
    print('length %.1f m, %d points; heights %.1f .. %.1f m above the sea (start %.1f)' % (LEN, NP, H.min(), H.max(), H0))
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('tightest: R %.1f m at %.0f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()]))
    print('bends (R < 30 m):', ' '.join('%.0f:%s%.0f' % (CUM[i], 'R' if ks[i] > 0 else 'L', 1 / abs(ks[i])) for i in range(NP) if abs(ks[i]) > 1 / 30 and abs(ks[i]) >= abs(ks[i - 1]) and abs(ks[i]) >= abs(ks[(i + 1) % NP])))
    for w in J['water']:
        p = w[3]; best = min((sd(p[q], p[q + 1]) for q in range(0, len(p), 2)), key=lambda v: v[2]); print('stream %s culvert %s: nearest at %.0f m, %.1f m to the side (%.1f m)' % (w[0], w[2], best[0], best[1], best[2]))
    for b in J['bld']: s, dd, _ = sd(b[0], b[1]); print('building %4.1f x %4.1f kind %d: at %.0f m, %.1f m to the side' % (b[2], b[3], b[6], s, dd))
    X = json.load(open(os.path.join(HERE, 'extra.json')))
    for kv, p in X['power']:
        cr = []
        for q in range(0, len(p) - 3, 3):
            for t in np.linspace(0, 1, 40):
                x = p[q] + (p[q + 3] - p[q]) * t; z = p[q + 1] + (p[q + 4] - p[q + 1]) * t; s, dd, dist = sd(x, z)
                if dist < 2.5: cr.append(round(s))
        print('power %d kV, %d pylons: over the circuit at' % (kv, len(p) // 3), sorted(set(v // 10 * 10 for v in cr)))

def build_track():
    hk = H[::2]; ssh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'sosnova'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Sosnová, Czechia: the circuit on the meadows by the village of Sosnová south of Česká Lípa (Liberec region), clockwise, in its real
  // layout and scale (the combined layout: the outer loop with the two inner parts): the start line on the finish straight by the paddock,
  // the left past the line, the lower hairpin, the chicane, the long left, the west straight, the west hairpin, the long right over the
  // stream, the north straight under the power lines, the fast right, the esses, the east hairpin, the double left and the last hairpin onto
  // the straight: %(km)s km on our line (1.7 km). No pits: the straight is too short for a pit lane with the 13 crews' boxes.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/sosnova/config.json: the raceways'
  // nodes in their order, clockwise), the corners at its nodes rounded (sigma 5 m; the chicane's 6 m radius eased to ~10 m); metres, x east,
  // z south, origin = the junction where the link from the infield meets the straight, 35 m past the start line (start: the first point).
  // GENERATED by tools/sosnova/build.py (edit the names, the stands and the text there).
  // Heights (SO_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (255.6 m a.s.l.): within 3 m of it all round.
  // Scenery data for the world builder (js/world-sosnova.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 meadows and grass, 1 the woods, 2 fields, 3 the paddock, the car parks, the
  // village: OSM, ESA WorldCover, the canopy), and sk: brooks, the streams from upstream to downstream ([[piped, [x, z, ...]], ...]: OSM
  // waterway=stream, piped: tunnel=culvert, underground; they go under the circuit in culverts), bld, the buildings by the circuit ([x, z, length, width, angle (deg), height,
  // kind (0 a house, 4 the garages, 5 a hall, 6 the paddock's office)]: OSM outlines as boxes), power, the power lines ([kV, [x, z, kind (1 a
  // lattice tower, 2 a pole), ...]]: OSM). (The raceways' links across the infield that this layout leaves out are not drawn: the barriers
  // and the run-offs of the legs round them would leave only pieces of them.)
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SO_H = [%(ssh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc8d2da, sun: 0xfff0d8, sunI: 1.0, sky: 0xb4cce6, gnd: 0x566a36, hemiI: 0.68, tint: [1.0, 1.0, 0.97], sat: 1.0, sunOff: [-58, 72, 70], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.95]] },   // northern Bohemia in late summer: a soft light, the sun from the south-west, a little haze over the meadows
    say: 'Sosnová',
    grassNat: 0.45, lawn: [1.0, 1.0, 0.9],
    zivali: { a: ['roe', 'boar', 'fox', 'hare'], t: ['huntStand', 'logPile', 'fallenTree'], open: true },
    id: 'sosnova', name: 'Sosnová, Češka', theme: 'sosnova', laps: 7, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Sosnová, Czechia', desc: %(desc_en)s },
    start: %(start)s, runoff: 0.9, inner: 3.5, side: 5.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: SO_H.map((h, i) => [i / SO_H.length, h / 10]),
    maxRivals: 60,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the shortest circuit, its flying start's column (4/5 of a lap at most) would stand car on car with more (67 already do, the formula cars)
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the left past the line, the lower hairpin, the chicane (2), the long left (2), the west hairpin, the fast right, the esses (2), the east hairpin, the double left (2), the last hairpin
    walls: %(walls)s,   // the barriers this side of the paddock's buildings by the finish straight and of the stream left of the long right
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: on the grass by the start line, across from the paddock
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the infield to the west straight, the west and the north, the east loops and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), start=json.dumps(at(0)).replace(',', ', '), ssh=ssh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '), sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'sosnova.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; brooks', [len(c[1]) // 2 for c in SK['brooks']], 'points; buildings', len(SK['bld']) // 7, '; power', len(SK['power']))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    if '--osm' in sys.argv: osm_extra(sys.argv[sys.argv.index('--osm') + 1])
    elif '--info' in sys.argv: info()
    else: build_track()
