# Batangas, Filipini: the game's track file from the track data (tools/batangas/batangas.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/batangas/build.py   -> js/tracks/batangas.js (centre line, heights, names, pits, stands, terrain, land cover, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md, the track: docs/proge/batangas.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'batangas.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: the data's first point is OSM's finish line (a node of the raceway way on the main straight, by the pits), so the
# line stays as it is; everything moved so that the finish line is the origin ----
K0 = 0; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway way of the circuit, clockwise as raced, its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (a grey opening and closing: the trees' and the buildings' remains by the road), smoothed (sigma 30 m): a
# plateau 99-110 m above the sea; the main straight level, grades at most 3 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.03 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-200 / STEP)); i1 = int(round(330 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from the last corner to Turn 1's brakes
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

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races or the circuit
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (17: 11 right, 6 left) ----
NAMES = [
    ('Desni na koncu ravnine', 360, ['Hard on the brakes for the hairpin of Turn 1!', 'The tight right at the end of the main straight!', 'Down the gears into the first hairpin!']),
    ('Dolgi desni', 950, ['Round the long right of Turn 2!', 'Keep it tight through the long right!', 'The long right, patience on the throttle!']),
    ('Ostri levi', 1274, ['Brake hard for the tight left of Turn 3!', 'The hairpin left!', 'Round the tight left, Turn 3!']),
    ('Desni za ostrim levim', 1389, ['Straight into the right of Turn 4!', 'Right after the hairpin!', 'Through Turn 4!']),
    ('Trije levi', 1664, ['Into the three lefts!', 'Left, left and left again, Turns 5 to 7!', 'The run of lefts begins!']),
    ('Ravnina proti zahodu', 2050, ['Flat out down the straight to the west!', 'The long run west!', 'Foot down towards the far end!']),
    ('Zahodni ostri desni', 2384, ['Hard on the brakes for the western hairpin!', 'The tight right of Turn 8!', 'Round the far hairpin!']),
    ('Šikana', 2690, ['Left and right through the chicane!', 'Over the kerbs in the chicane!', 'Turns 9 and 10, the chicane!']),
    ('Desni za šikano', 2779, ['The right of Turn 11!', 'Out of the chicane and into the right!', 'Through Turn 11!']),
    ('Dvojni desni', 3360, ['The double right onto the main straight!', 'Right and right again, Turns 12 and 13!', 'The last corners, then the main straight!']),
    ('Ciljna ravnina', 3510, ['Down the main straight past the pits!', 'Flat out past the grandstand!', 'The main straight, the line ahead!']),
]
# the apexes of Turns 1-13 (their number boards): the hairpin right at the end of the main straight, the long right, the tight left and the
# right after it, the three lefts, the western hairpin right, the chicane (left, right), the right after it and the double right
TURNS = [360, 950, 1274, 1389, 1664, 1759, 1854, 2384, 2674, 2714, 2779, 3334, 3389]

DESC = ('Dirkališče na planoti v pokrajini Batangas južno od Manile, pri Rosariu: 3,6 km v smeri urinega kazalca, 13 zavojev (8 desnih in 5 '
        'levih) na skoraj ravni planoti okoli 100 m nad morjem. Ciljna ravnina mimo glavne tribune in boksov do ostrega desnega, dolgi desni, '
        'ostri levi in desni za njim, trije levi drug za drugim, ravnina proti zahodu do ostrega desnega na zahodnem koncu, šikana, desni za '
        'njo in dvojni desni na ciljno ravnino. Tropsko zelenje, kokosove palme, mangovci in sladkorni trs, griči na obzorju, tribune ob '
        'progi in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on the plateau of Batangas province south of Manila, near Rosario: 3.6 km, clockwise, 13 turns (8 right, 5 left) on a '
           'nearly level plateau about 100 m above the sea. The main straight past the main grandstand and the pits to the tight right, the long '
           'right, the tight left and the right after it, three lefts one after another, the straight to the west to the tight right at the far '
           'end, the chicane, the right after it and the double right onto the main straight. Tropical green, coconut palms, mango trees and '
           'sugar cane, hills on the horizon, grandstands by the track and the pits (drive in and the mechanics fix the car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (OSM's pit lane w185557423, 13-25 m from the centre line),
# from before the double right to after the main straight's middle (the real lane leaves before Turn 12 and comes back ~200 m after the
# line); the 13 crews' boxes along the pit buildings (OSM: two buildings 69 m and 76 m long, 23-25 m to the right of the centre line), the
# player's the 7th; the pit wall 2.5 m past the road's edge ----
PIT = [14, -320, 200, -85]   # (the player's box: the 7th crew's, -90 .. -80 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-150, -30]
PIT_BOX = [-175, 30, 1]   # (the garages: World's RB_LOOK.batangas.pitBox; the crews' 13 open)
WALLS = [[-320, 200, 1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where the grandstands stand back from the road: the main grandstand on the left of the main straight
# (OSM: a building 51 m long, 26 m from the centre line)
WIDE = [[-60, 30, -1, 9]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the main grandstand on the left of the main straight (roofed, where OSM's
# long building opposite the pits stands), open blocks inside Turn 1, inside the long right of Turn 2, outside Turn 3, outside the western
# hairpin; their names places of Batangas
STANDS = [[-55, 25, -1, 12, 1, 3, 0, 'BATANGAS'], [285, 345, 1, 6, 0, 2, 0, 'ROSARIO'], [890, 1010, 1, 7, 0, 3, 0, 'LIPA'],
          [1205, 1260, 1, 6, 0, 2, 0, 'IBAAN'], [2330, 2410, -1, 7, 0, 2, 0, 'PADRE GARCIA']]
SECTORS = [1200, 2450]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 120 m before Turn
# 7, open from 80 m after it down the straight to the west to Turn 8; detection 150 m before Turn 13, open from 40 m after it along the main
# straight to Turn 1
DRS = [[7, -120, 80, 8], [13, -150, 40, 1]]
REAL_KM = 3.62

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
    # land cover, 16 m cells: 0 open (the grass, the sugar cane and the fields of the plateau), 1 the trees (the coconut palms, the mango and
    # the bamboo groves), 2 the scrub (the bushes on the grass), 3 built-up (the villages, the car parks): ESA WorldCover, the canopy height (Meta /
    # WRI: bushes 2-5 m, trees over 5 m) and OSM's woods, scrub, car parks and buildings over it
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(ch >= 2) & (ch < 5)] = 2; cls[ch >= 5] = 1; cls[wc == 10] = 1; cls[wc == 20] = 2
            cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved run-offs and roads, the builder's own: grass)
            cls[lu == 9] = 1; cls[lu == 8] = 2; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: not the pit buildings on the right of the
    # main straight (World's pitBox: the garages) nor the long building opposite them (def.stands: the main grandstand)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        if l > 45 and (s > 3400 or s < 100): continue   # (the pit buildings and the main grandstand's building)
        hh = hgt if hgt > 0 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 120 m, not the two in their tunnels under it): [n, x0, z0, x1, z1, ...];
    # the dirt tracks (highway=track, compacted) as trk
    svc = []; trk = []
    for r in J['roads']:
        if r[3] == 2: continue
        q = mv(r[-1])
        if r[0] == 'service': svc += [len(q) // 2] + q
        elif r[0] == 'track': trk += [len(q) // 2] + q
    return D, LC, dict(bld=bld, svc=svc, trk=trk)


# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the hills of Batangas, the mountains to the north and the volcanoes to the west) ----
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
    src = '''/* Track definition 'batangas'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Batangas, Philippines: the circuit on the plateau of Batangas province near Rosario, clockwise, in its real layout and scale: the finish
  // line on the main straight (OSM's; the main grandstand on the left, the pits on the right), the hairpin right of Turn 1 at the end of
  // the straight, the long right of Turn 2, the tight left of Turn 3 and the right of Turn 4, the three lefts of Turns 5-7, the straight to
  // the west, the hairpin right of Turn 8 at the far end, the chicane of Turns 9 and 10, the right of Turn 11 and the double right of Turns
  // 12 and 13 onto the main straight: %(km)s km on our line (3.62 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/batangas/config.json: the raceway way
  // of the circuit, clockwise as raced), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line, x east, z south.
  // GENERATED by tools/batangas/build.py (edit the names, the pits, the stands and the text there).
  // Heights (BT_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its spikes taken out,
  // smoothed, grades at most 3 %%, the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.): the
  // plateau, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-batangas.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line), land cover (lc, 16 m cells: 0 the grass and the fields, 1 the trees, 2 the scrub, 3 the villages and the car parks:
  // ESA WorldCover, the canopy height and OSM), and sk: the buildings by the circuit (bld: [x, z, length, width, angle (deg), height]: OSM),
  // the service roads round the circuit (svc, trk: [points, x, z, ...]: OSM); the horizon (far: the highest ground in rings round the
  // circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const BT_H = [%(lbh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd3e0e4, sun: 0xfff0d6, sunI: 1.14, sky: 0x86b6e4, gnd: 0x587a3a, hemiI: 0.7, tint: [0.99, 1.02, 0.97], sat: 1.06, sunOff: [-58, 88, -36], split: [[0.97, 1.0, 1.04], [1.04, 1.01, 0.95]] },   // the plateau of Batangas: a humid tropical haze, a high sun, lush green grass and trees
    say: 'Batangas',
    grassNat: 0.25, lawn: [0.96, 1.04, 0.9],
    zivali: { a: ['buffalo', 'egret'], t: ['palmHut'], open: true },
    id: 'batangas', name: 'Batangas, Filipini', theme: 'batangas', laps: 3, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Batangas, Philippines', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: BT_H.map((h, i) => [i / BT_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-13 (their number boards): the hairpin right, the long right, the tight left, the right after it, the three lefts, the western hairpin, the chicane (2), the right after it, the double right (2)
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.batangas.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind a wide verge by the main grandstand on the left of the main straight
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand on the left of the main straight, open blocks inside Turn 1, inside Turn 2, outside Turn 3 and outside Turn 8
    stands: %(stands)s,
    zaslon: { d: -20, side: -1, off: 27.5 },   // the big screen (js/world-zaslon.js) by the main grandstand, turned towards the cars coming (node tools/zaslon-mesto.mjs batangas)
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
    path = os.path.join(ROOT, 'js', 'tracks', 'batangas.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; tracks', sum(1 for _ in svc_iter(SK['trk'])))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
