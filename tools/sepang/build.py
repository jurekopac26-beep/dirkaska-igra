# Sepang, Malezija: the game's track file from the track data (tools/sepang/sepang.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/sepang/build.py   -> js/tracks/sepang.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A13), the track:
# docs/proge/sepang.md. Made on tools/tuzla/build.py (the same steps: Tuzla, Turčija is this branch's base).
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'sepang.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); NP = len(RAW)

# ---- the centre line: OSM's raceway ways of the circuit (20 pieces), clockwise as raced (oneway=yes), from the finish line node, its nodes'
# corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the tool's (the ground model across the road, smoothed), the two long straights level, grades at most 8 % (the excess
# spread to the neighbours: none is steeper than 6 % here), then smoothed again (sigma 10 m) ----
def heights():
    h = np.array(J['h'], float); cap = 0.08 * STEP
    # the main straight from Turn 15 to the brakes of Turn 1 (s -250 .. 450) and the back straight from Turn 14 to the brakes of Turn 15
    # (4300 .. 5080) level: the ground model's bumps of 1-2 m along them are the roofs of the pit building and of the big grandstand between
    # the two straights, not the road (the pits and the stands stand on a level terrace)
    for a0, a1 in ((-250, 450), (4300, 5080)):
        i0 = int(round(a0 / STEP)); i1 = int(round(a1 / STEP)); a = h[i0]; b = h[i1]
        for i in range(i0, i1 + 1): h[i] = a + (b - a) * (i - i0) / (i1 - i0)
    for _ in range(400):
        d = np.roll(h, -1) - h; ex = np.clip(np.abs(d) - cap, 0, None) * np.sign(d) / 2
        if not np.any(ex): break
        h += ex; h -= np.roll(ex, 1)
    return ndimage.gaussian_filter1d(h, 2.0, mode='wrap')
H = heights()
H0 = float(H[0])   # the finish line's height above the sea (39.1 m): the game's zero

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races, sponsors or the
# circuit (CLAUDE.md, Pravna varnost: OSM's names of these corners are firms' and resorts', not used); the turns by their numbers in the
# lines, as the circuit numbers them ----
NAMES = [
    ('Zapirajoči se desni', 640, ['Hard on the brakes at the end of the main straight!', 'Into the long right of Turn 1, tightening all the way!', 'Turn 1, the right-hander that closes and closes!']),
    ('Leva lasnica', 790, ['Straight into the left hairpin of Turn 2!', 'Round the tight left of Turn 2!', 'Turn 2, the hairpin, and down the hill!']),
    ('Hitri desni v dolini', 1080, ['Flat through the long right at the bottom of the hill!', 'The sweeping right of Turn 3!', 'Turn 3, keep it pinned!']),
    ('Vzpon iz doline', 1350, ['Up the hill towards Turn 4!', 'Climbing out of the valley!', 'Full throttle up the slope!']),
    ('Ostri desni na vrhu', 1600, ['Hard on the brakes for the sharp right!', 'The tight right of Turn 4, at the top of the climb!', 'Down the gears for Turn 4!']),
    ('Hitri levi', 1960, ['Through the fast left of Turn 5!', 'Left, into the quick esses!', 'Turn 5, the fast left!']),
    ('Hitri desni', 2200, ['And the fast right of Turn 6!', 'Right, keep the speed up!', 'Through Turn 6, flat out!']),
    ('Dvojni desni', 2580, ['Turns 7 and 8, the double right!', 'Right, and right again!', 'Into the double right-hander!']),
    ('Spust proti lasnici', 2950, ['Down towards the hairpin!', 'Downhill, the speed building!', 'The short straight down to Turn 9!']),
    ('Lasnica na dnu', 3175, ['Hard on the brakes for the hairpin!', 'Round the tight left of Turn 9!', 'The hairpin at the bottom, and up the hill!']),
    ('Desni v klanec', 3300, ['The right of Turn 10, climbing!', 'Right, and up the hill!', 'Through Turn 10!']),
    ('Desni na vrhu hriba', 3535, ['The right over the top of the hill!', 'Turn 11, the highest point of the lap!', 'Right, and down the other side!']),
    ('Levi navzdol', 3860, ['Down through the fast left!', 'Turn 12, the downhill left!', 'Left, the car goes light!']),
    ('Dolgi desni', 4060, ['Into the long right of Turn 13!', 'The sweeping right, hold the line!', 'Turn 13, all the way round!']),
    ('Desni na zadnjo ravnino', 4225, ['The right onto the back straight!', 'Turn 14, and open the throttle!', 'Right, the long straight ahead!']),
    ('Zadnja ravnina', 4650, ['Down the back straight past the big grandstand!', 'Flat out down the back straight!', 'The long straight, in the slipstream!']),
    ('Zadnja lasnica', 5165, ['Hard on the brakes for the last hairpin!', 'The left hairpin of Turn 15!', 'Round the last corner and onto the main straight!']),
    ('Ciljna ravnina', 5400, ['Down the main straight between the pits and the grandstand!', 'Flat out along the main straight, the pits on the right!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 15 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the tightening right, 2 the
# left hairpin, 3 the fast right in the valley, 4 the sharp right at the top, 5 and 6 the fast left and right, 7 and 8 the double right, 9 the
# hairpin at the bottom, 10 the right up the hill, 11 the right at the top, 12 the left down the hill, 13 the long right, 14 the right onto the
# back straight, 15 the last hairpin
TURNS = [660, 790, 1080, 1600, 1960, 2200, 2580, 2685, 3175, 3300, 3535, 3860, 4060, 4225, 5165]

DESC = ('Dirkališče med nasadi oljnih palm južno od Kuala Lumpurja: 5,5 km v smeri urinega kazalca, 15 zavojev in 21 m višinske razlike. '
        'Široka ciljna ravnina med boksi in veliko tribuno, ki gleda na obe ravnini, zapirajoči se desni in leva lasnica, spust do hitrega '
        'desnega v dolini, vzpon do ostrega desnega na vrhu, hitri levi in desni in dvojni desni. Nato lasnica na dnu, vzpon do najvišje '
        'točke, hitri levi navzdol in desni na zadnjo ravnino, ki se vrne po drugi strani tribune do zadnje lasnice. Široke izletne cone s '
        'peskom, tropsko zelenje, tribune in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit among the oil palm plantations south of Kuala Lumpur: 5.5 km, clockwise, 15 turns and 21 m of height difference. The wide '
           'main straight between the pits and the big grandstand that faces both straights, the tightening right and the left hairpin, the '
           'drop to the fast right in the valley, the climb to the sharp right at the top, the fast left and right and the double right. Then '
           'the hairpin at the bottom, the climb to the highest point, the fast left down the hill and the right onto the back straight, which '
           'runs back along the other side of the grandstand to the last hairpin. Wide gravel run-offs, tropical green, grandstands and the '
           'pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (OSM's pit lane and pit building on the north side), 15 m
# from the centre line, from after the last hairpin to before Turn 1 (the real lane leaves round the outside of Turn 15 and comes back on
# the straight before Turn 1); the 13 crews' boxes in the middle of the pit building, the player's the 7th; the pit building along the lane
# (OSM: ~340 m, its front ~19 m from the centre line); the pit wall 2.5 m past the road's edge (OSM: 10-11 m from the centre line) ----
PIT = [15, -260, 450, 145]   # (the player's box: the 7th crew's, 5 .. 15 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [80, 200]
PIT_BOX = [-30, 300, 1]   # (the garages: World's RB_LOOK.sepang.pitBox)
# the walls by the road: the pit wall along the lane; on the left of both straights the wall in front of the big grandstand between them
# (OSM: its front 10-11 m from the centre line of either straight)
WALLS = [[-260, 450, 1, 2.5], [-240, 330, -1, 2.5], [4440, 4970, -1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the big covered grandstand between the straights (OSM building=
# grandstand, ~600 m: its seats face the main straight on one side and the back straight on the other), the covered stands outside Turn 1
# and before Turn 7 (OSM grandstands), open stands on the grassy banks (OSM's hillstands) inside Turn 5, outside Turns 10-11 and outside
# Turn 13. Their names: places round the circuit (OSM's are letters and numbers)
STANDS = [[-240, 320, -1, 14, 1, 5, 0, 'SEPANG'], [600, 720, -1, 10, 1, 2, 0, 'PUTRAJAYA'], [1810, 1890, -1, 7, 0, 2, 0, 'BANTING'],
          [2420, 2530, -1, 9, 1, 2, 0, 'NILAI'], [3360, 3460, -1, 7, 0, 2, 0, 'DENGKIL'], [4080, 4170, -1, 7, 0, 2, 0, 'SALAK TINGGI'],
          [4440, 4960, -1, 12, 1, 4, 0, 'SELANGOR']]
SECTORS = [1700, 3620]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 60 m before Turn
# 14, open from 100 m after it down the back straight to Turn 15; detection 150 m before Turn 15, open from 80 m after it along the main
# straight to Turn 1
DRS = [[14, -60, 100, 15], [15, -150, 80, 1]]
REAL_KM = 5.543
# OSM's buildings drawn otherwise: the two grandstands (outside Turn 1, before Turn 7: def.stands) - their centres
SKIP_BLD = [(-705.0, -18.8), (513.1, -64.4)]

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings (sk.bld), the service roads (sk.svc), the lone trees (sk.tr) ----
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
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, above the finish line in steps of 0.05 m multiples from
    # its lowest point (the low rolling hills of the estates: the valley at Turn 3 some 16 m below the finish line, the hill at Turn 11 5 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the circuit's lawns, the grass, the gravel traps), 1 the oil palms (OSM's estates, landuse=orchard with
    # trees=oil_palms, and WorldCover's trees outside OSM's land use: the estates all round the circuit), 2 the other trees (the rain trees, the
    # acacias and the secondary forest's patches on the circuit's grounds, by its lakes and roads: WorldCover's trees there), 3 built-up (the
    # car parks, the airport's and the town's grounds: OSM; WorldCover's built-up outside the circuit's grounds)
    g1, a1 = grid('lc'); g2, a2 = grid('lu')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 10] = 2; cls[(wc == 10) & (lu == 0)] = 1; cls[lu == 7] = 1; cls[(lu == 8) | (lu == 9)] = 2
            cls[(wc == 50) & (lu != 10) & (lu != 11)] = 3   # (built-up inside the circuit's grounds (OSM): its paved paddock, run-offs and
            cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3     # service roads, the builder's own: grass; the car parks built-up)
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building (the builder's garages
    # stand there), not the grandstands (def.stands draws them), nor in the barriers
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if l > 300: continue   # (the pit building with the paddock's, the big grandstand between the straights)
        if any(math.hypot(x - a, z - q) < 5 for a, q in SKIP_BLD): continue
        ca, sa = math.cos(ang), math.sin(ang); edge = []   # (the box's outline every metre: its distance from the road, where along it)
        for u, v, du, dv in ((-1, -1, 1, 0), (1, -1, 0, 1), (1, 1, -1, 0), (-1, 1, 0, -1)):
            n = max(1, int(math.ceil(l if du else w)))
            for k in range(n + 1):
                a = (u + du * 2 * k / n) * l / 2; q = (v + dv * 2 * k / n) * w / 2; edge.append(sd(x + a * ca - q * sa, z + a * sa + q * ca))
        if min(abs(q[1]) for q in edge) < 16: continue   # (in the barriers)
        hh = hgt if hgt > 0 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 60 m, not the two in their tunnels under it): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[0] != 'service' or r[3] == 2: continue
        q = r[-1]; svc += [len(q) // 2] + [round(v, 1) for v in q]
    # the lone trees (OSM natural=tree within 60 m): [x, z, kind]: 0 a palm (the ornamental ones in the courtyard of the big grandstand between
    # the straights), 1 a broadleaved tree (the rows along the service roads by Turns 3 and 4 and Turn 5)
    tr = []
    for x, z, kind in J['trees']:
        s, d = sd(x, z); yard = d < 0 and (s > 5300 or s < 330 or 4400 < s < 5000)
        tr += [round(x, 1), round(z, 1), 0 if yard else 1]
    return D, LC, dict(bld=bld, svc=svc, tr=tr)

def svc_iter(a):
    k = 0
    while k < len(a): n = a[k]; yield a[k + 1:k + 1 + 2 * n]; k += 1 + 2 * n

def build_track():
    hk = H[::2]; sph = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'sepang'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Sepang, Malaysia: the circuit among the oil palm estates south of Kuala Lumpur, clockwise, in its real layout and scale: the finish line
  // on the main straight (OSM raceway=start-finish; the pits on the right, the big grandstand on the left), the tightening right of Turn 1
  // and the left hairpin of Turn 2, the drop to the fast right of Turn 3 in the valley, the climb to the sharp right of Turn 4, the fast left
  // and right of Turns 5 and 6, the double right of Turns 7 and 8, the hairpin of Turn 9 at the bottom, the climb through Turns 10 and 11 to
  // the top of the lap, the left of Turn 12 down the hill, the long right of Turn 13, Turn 14 onto the back straight (on the other side of
  // the grandstand) and the last hairpin, Turn 15: %(km)s km on our line (5.543 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/sepang/config.json: the raceway ways of
  // the circuit, oneway=yes in the race direction, from the finish line node), the corners at its nodes rounded (sigma 5 m); metres,
  // origin = the finish line, x east, z south. GENERATED by tools/sepang/build.py (edit the names, the pits, the stands and the text there).
  // Heights (SP_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the two long
  // straights level; every 10 m from the finish line, decimetres above it (39.1 m a.s.l.): Turn 3 in the valley 16 m lower, Turn 11 on the
  // hill 5 m higher.
  // Scenery data for the world builder (js/world-sepang.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line), land cover (lc, 16 m cells: 0 the lawns and the grass, 1 the oil palms, 2 the other trees, 3 the car parks, the
  // airport's and the town's grounds: ESA WorldCover and OSM), and sk: the buildings by the circuit (bld: [x, z, length, width, angle (deg),
  // height]: OSM outlines as boxes), the service roads round it (svc: [points, x, z, ...]: OSM) and the lone trees (tr: [x, z, kind (0 a
  // palm, 1 a broadleaved tree)]: OSM).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SP_H = [%(sph)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc8d4d6, sun: 0xfff3da, sunI: 1.2, sky: 0x9dbfdf, gnd: 0x4b6a34, hemiI: 0.66, tint: [0.99, 1.01, 0.98], sat: 1.06, sunOff: [-72, 80, 30], split: [[0.96, 1.0, 1.04], [1.04, 1.01, 0.95]] },   // Sepang: a hot, humid afternoon in the tropics, the sun high in the west-south-west, a pale blue-green haze over the oil palms
    say: 'Sepang',
    grassNat: 0.75, lawn: [0.93, 1.02, 0.86],
    zivali: { a: ['macaque', 'egret', 'buffalo'], t: ['waterTank', 'signPost'] },
    id: 'sepang', name: 'Sepang, Malezija', theme: 'sepang', laps: 2, halfWidth: 7.5,
    desc: %(desc)s,
    en: { name: 'Sepang, Malaysia', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.2, inner: 4.5, side: 7, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: SP_H.map((h, i) => [i / SP_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-15 (their number boards): the tightening right, the left hairpin, the fast right in the valley, the sharp right at the top, the fast left and right, the double right (2), the hairpin at the bottom, the right up the hill, the right at the top, the left down the hill, the long right, the right onto the back straight, the last hairpin
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.sepang.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane; the walls in front of the big grandstand on the left of both straights
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the big grandstand between the straights (facing the main straight and, from its other side, the back straight), the covered stands outside Turn 1 and before Turn 7, the open stands on the banks inside Turn 5, outside Turns 10-11 and outside Turn 13
    stands: %(stands)s,
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the back straight from Turn 14 to Turn 15, the main straight from Turn 15 to Turn 1
    sectors: %(sectors)s,   // the three sectors of the timing screens: Turns 1-4, Turns 5-11, Turns 12-15 with the two straights
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), sph=sph, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'sepang.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line);' % (hk.min() - H0, hk.max() - H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6, '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; trees', len(SK['tr']) // 3)
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
