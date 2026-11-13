# Quezaltepeque, Salvador: the game's track file from the track data (tools/quezaltepeque/quezaltepeque.json and its PNG grids, made by
# tools/proga-podatki.py).   python3 -I tools/quezaltepeque/build.py   -> js/tracks/quezaltepeque.js (centre line, heights, names, pits,
# stands, terrain, land cover, horizon). Edit the names, the pits, the stands and the text here, not in the generated file.
# Plan: docs/nove-proge-1-0.md, the track: docs/proge/quezaltepeque.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'quezaltepeque.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: OSM has no node for it, so it goes to the middle of the pit building on the right of the main straight (the data's
# first point is the main straight's south-western end, where the pit lane comes back): K0 points on; everything moved so that the
# finish line is the origin ----
K0 = int(round(260 / STEP)); OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway way of the circuit, clockwise as raced, its nodes' corners rounded ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (the trees' and the buildings' remains by the road), smoothed (sigma 30 m): the circuit on the lava plain
# at the foot of the Quezaltepeque volcano, about 500-520 m above the sea; the main straight by the pits an even slope, grades at most 6 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.06 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-250 / STEP)); i1 = int(round(190 / STEP)); a = h[i0]; b = h[i1]   # the pit lane's length of the main straight: an even slope
    for i in range(i0, i1 + 1): h[i] = a + (b - a) * (i - i0) / (i1 - i0)
    for _ in range(400):
        d = np.roll(h, -1) - h; ex = np.clip(np.abs(d) - cap, 0, None) * np.sign(d) / 2
        if not np.any(ex): break
        h += ex; h -= np.roll(ex, 1)
    return ndimage.gaussian_filter1d(h, 2.0, mode='wrap')
H = heights()
H0 = float(H[0])   # the finish line's height above the sea: the game's zero

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races, the circuit or
# its viewpoints (CLAUDE.md, Pravna varnost); 11 turns (8 right, 3 left), numbered in the lines as we number them ----
NAMES = [
    ('Desni na koncu ravnine', 415, ['Hard on the brakes for the right of Turn 1!', 'The first right at the end of the main straight!', 'Down the gears into Turn 1!']),
    ('Dva desna', 620, ['Right and right again, Turns 2 and 3!', 'The two rights, one after the other!', 'Keep it tidy through the rights!']),
    ('Desni pred levimi', 880, ['The right of Turn 4!', 'Through Turn 4, the lefts are next!', 'Turn 4, then the long left!']),
    ('Dolgi levi pri tribuni', 1040, ['Round the long left past the grandstand!', 'The long left of Turn 5, the fans close by!', 'Patience on the throttle through the long left!']),
    ('Levi in desni', 1180, ['Left and right, Turns 6 and 7!', 'Flick left, then right!', 'Through the left and the right!']),
    ('Ostri desni', 1390, ['Brake hard for the tight right of Turn 8!', 'The tightest corner of the lap!', 'Round the tight right!']),
    ('Ravnina ob lavi', 1580, ['Flat out along the old lava flow!', 'Black rock beyond the fence, foot down!', 'The run past the lava field!']),
    ('Dolgi lasnični', 1800, ['All the way round the long hairpin of Turn 9!', 'Round the hairpin, Turn 9!', 'The long hairpin right!']),
    ('Levi lasnični', 2260, ['The hairpin left of Turn 10!', 'Swing left round Turn 10!', 'The only hairpin to the left!']),
    ('Zadnji lasnični', 2845, ['Hard on the brakes for the last hairpin!', 'The hairpin onto the main straight!', 'Turn 11, the last corner!']),
    ('Ciljna ravnina', 3100, ['Down the main straight past the pits!', 'Flat out past the grandstand!', 'The main straight, the line ahead!']),
]
# the apexes of Turns 1-11 (their number boards): the right at the end of the main straight, the two rights, the right before the lefts,
# the long left, the left and the right, the tight right, the long hairpin right, the hairpin left and the last hairpin
TURNS = [415, 555, 690, 880, 1045, 1135, 1220, 1390, 1800, 2260, 2845]

DESC = ('Dirkališče na lavni ravnici ob vznožju ognjenika San Salvador (Quezaltepeque), severozahodno od prestolnice: 3,2 km v smeri '
        'urinega kazalca, 11 zavojev (8 desnih in 3 levi) okoli 500 m nad morjem. Ciljna ravnina mimo boksov in tribune, štirje desni, dolgi '
        'levi pri tribuni, levi in desni, ostri desni, ravnina ob strjeni lavi, dolgi lasnični, levi lasnični in zadnji lasnični na ciljno '
        'ravnino. Tropsko zelenje, črna lava za ograjo, ognjenik na obzorju, tribune ob progi in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on the lava plain at the foot of the San Salvador volcano (Quezaltepeque), north-west of the capital: 3.2 km, clockwise, 11 '
           'turns (8 right, 3 left) about 500 m above the sea. The main straight past the pits and the grandstand, four rights, the long left by '
           'the grandstand, a left and a right, the tight right, the straight along the old lava flow, the long hairpin, the hairpin left and '
           'the last hairpin onto the main straight. Tropical green, black lava beyond the fence, the volcano on the horizon, grandstands by the '
           'track and the pits (drive in and the mechanics fix the car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (OSM's pit lane, 12-14 m from the centre line), from the
# main straight's start to before Turn 1; the 13 crews' boxes along the pit building (OSM: 140 m long, 18-31 m to the right of the centre
# line), the player's the 7th; the pit wall 2.5 m past the road's edge ----
PIT = [13, -250, 180, -5]   # (the player's box: the 7th crew's, -10 .. 0 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-70, 50]
PIT_BOX = [-72, 72, 1]   # (the garages: World's RB_LOOK.quezaltepeque.pitBox; the crews' 13 open)
WALLS = [[-245, 175, 1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where the main grandstand stands back from the road on the left of the main straight (OSM: the
# viewpoint and the car park there, ~30 m from the centre line)
WIDE = [[-50, 40, -1, 9]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the main grandstand on the left of the main straight (roofed), the open
# blocks on the right outside the long left of Turn 5 (OSM: two bleachers) and on the right before the last hairpin (OSM: a viewpoint); their names places of El Salvador
STANDS = [[-45, 30, -1, 10, 1, 3, 0, 'QUEZALTEPEQUE'], [1030, 1095, 1, 6, 0, 2, 0, 'OPICO'], [2395, 2450, 1, 5, 0, 2, 0, 'LA LIBERTAD']]
SECTORS = [1000, 1950]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 100 m before
# Turn 8, open from 60 m after it along the lava field to Turn 9; detection 150 m before Turn 11, open from 60 m after it along the main
# straight to Turn 1
DRS = [[8, -100, 60, 9], [11, -150, 60, 1]]
REAL_KM = 3.21

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings and the roads (sk), the horizon (far) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):   # a grid of the data, its corner moved to our frame
    g = dict(J['grids'][name]); g['x0'] -= OX; g['z0'] -= OZ; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

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
    # its lowest point (the plateau round the circuit, the hills to the north and the east)
    gd, ad = grid('dem'); ad2 = ad
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the grass and the fields), 1 the trees (the broadleaf groves, the palms), 2 the scrub (the bushes on the
    # grass and on the old lava), 3 built-up (the car parks, the houses): ESA WorldCover, the canopy height (Meta / WRI: bushes 2-5 m, trees
    # over 5 m) and OSM's woods, scrub, car parks and buildings over it; the old lava flow (OSM's bare rock) a mask of its own (sk.lava, the
    # same cells, run-length coded as lc: 1 the lava), scrub on the land cover
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32); lav = np.zeros((lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(ch >= 2) & (ch < 5)] = 2; cls[ch >= 5] = 1; cls[wc == 10] = 1; cls[wc == 20] = 2
            cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved run-offs and roads, the builder's own: grass)
            cls[lu == 9] = 1; cls[lu == 8] = 2; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            cls[lu == 11] = 2; lav += (lu == 11)
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8); lava = (lav >= 2).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: not the pit buildings on the right of the
    # main straight (World's pitBox: the garages) nor the long building opposite them (def.stands: the main grandstand)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        if l > 100: continue   # (the pit building: World's pitBox, the garages)
        hh = hgt if hgt > 0 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 120 m, not the one over the track's bridge): [n, x0, z0, x1, z1, ...];
    # the dirt tracks (highway=track, compacted) as trk
    svc = []; trk = []
    for r in J['roads']:
        if r[3] == 2: continue
        q = mv(r[-1])
        if r[0] in ('service', 'unclassified'): svc += [len(q) // 2] + q
        elif r[0] == 'track': trk += [len(q) // 2] + q
    return D, LC, dict(bld=bld, svc=svc, trk=trk, lava=rle_lc(lava))


# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the San Salvador volcano to the south-east, the hills and the ranges round the valley) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea; the sea 0)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray()
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for q in range(na):
            m = 0.0
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (q + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round(m / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=0, step=step, b64=base64.b64encode(bytes(out)).decode())

def svc_iter(a):
    k = 0
    while k < len(a): n = a[k]; yield a[k + 1:k + 1 + 2 * n]; k += 1 + 2 * n

def info():
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('  tightest: R %.1f m at %.0f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()]))
    hd = lambda s: (math.degrees(math.atan2(at(s + 3)[0] - at(s - 3)[0], -(at(s + 3)[1] - at(s - 3)[1]))) + 360) % 360   # (compass: 0 north, 90 east)
    print('  turns (heading in -> out):', ' '.join('%d:%.0f>%.0f' % (n + 1, hd(s - 80), hd(s + 80)) for n, s in enumerate(TURNS)))

def build_track():
    hk = H[::2]; lbh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'quezaltepeque'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Quezaltepeque, El Salvador: the circuit on the lava plain at the foot of the San Salvador volcano (Quezaltepeque), clockwise, in its
  // real layout and scale: the finish line in the middle of the main straight (the main grandstand on the left, the pits on the right),
  // the right of Turn 1, the rights of Turns 2-4, the long left of Turn 5, the left and the right of Turns 6 and 7, the tight right of
  // Turn 8, the straight along the old lava flow, the long hairpin right of Turn 9, the hairpin left of Turn 10 and the last hairpin of
  // Turn 11 onto the main straight: %(km)s km on our line (3.21 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/quezaltepeque/config.json: the
  // raceway way of the circuit, clockwise as raced), its corners rounded; metres, origin = the finish line, x east, z south.
  // GENERATED by tools/quezaltepeque/build.py (edit the names, the pits, the stands and the text there).
  // Heights (QZ_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its spikes taken out,
  // smoothed, grades at most 6 %%, the pit lane's length of the main straight an even slope; every 10 m from the finish line, decimetres
  // above it (%(h0)s m a.s.l.): %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-quezaltepeque.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights
  // above the finish line), land cover (lc, 16 m cells: 0 the grass and the fields, 1 the trees, 2 the scrub, 3 the built-up ground and
  // the car parks: ESA WorldCover, the canopy height and OSM), and sk: the buildings by the circuit (bld: [x, z, length, width, angle
  // (deg), height]: OSM), the service roads round the circuit (svc, trk: [points, x, z, ...]: OSM), the old lava flow (lava: [points,
  // x, z, ...]: OSM's nature reserve on it); the horizon (far: the highest ground in rings round the circuit, Copernicus DEM, for
  // Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races, the circuit or its viewpoints).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const QZ_H = [%(lbh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd6dfe0, sun: 0xfff1d8, sunI: 1.12, sky: 0x8bb8e2, gnd: 0x5d7a3c, hemiI: 0.7, tint: [0.99, 1.01, 0.97], sat: 1.04, sunOff: [-58, 88, -36], split: [[0.97, 1.0, 1.04], [1.04, 1.01, 0.95]] },   // the valley under the San Salvador volcano: a humid tropical haze, a high sun
    say: 'Quezaltepeque',
    grassNat: 0.25, lawn: [0.96, 1.04, 0.9],
    zivali: { a: ['cow', 'egret'], t: ['palmHut'], open: true },
    id: 'quezaltepeque', name: 'Quezaltepeque, Salvador', theme: 'quezaltepeque', laps: 3, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Quezaltepeque, El Salvador', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: QZ_H.map((h, i) => [i / QZ_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-11 (their number boards): the right, the three rights, the long left, the left and the right, the tight right, the long hairpin, the hairpin left, the last hairpin
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.quezaltepeque.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind a wide verge by the main grandstand on the left of the main straight
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand on the left of the main straight, open blocks outside the long left (T4) and by the hairpin left (T9)
    stands: %(stands)s,
    zaslon: { d: -20, side: -1, off: 27.5 },   // the big screen (js/world-zaslon.js) by the main grandstand, turned towards the cars coming (node tools/zaslon-mesto.mjs quezaltepeque)
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the straight to the west from Turn 7 to Turn 8, the main straight from Turn 13 to Turn 1
    sectors: %(sectors)s,   // the three sectors of the timing screens: Turns 1-4, Turns 5-8, the chicane and the double right
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), lbh=lbh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'quezaltepeque.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; tracks', sum(1 for _ in svc_iter(SK['trk'])))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
