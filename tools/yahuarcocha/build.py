# Yahuarcocha, Ekvador: the game's track file from the track data (tools/yahuarcocha/yahuarcocha.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/yahuarcocha/build.py   -> js/tracks/yahuarcocha.js (centre line, heights, names, pits, stands, terrain, land cover, the lake, the horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/yahuarcocha.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'yahuarcocha.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no pits and no start line here; the line is put by the middle of the paddock between the two straights (ESA
# WorldCover's built-up there), 250 m along the long straight from the route's first point (tools/yahuarcocha/config.json): the line and its
# heights rolled to start there, the origin moved onto it
S0 = 250.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O; H = np.roll(np.array(J['h']), -K0)
H0 = float(H[0])   # the start line's height above the sea: the game's zero

# ---- the centre line: OSM's raceway (no one-way in OSM: clockwise, as raced since 1983), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]
TG = np.roll(P, -1, 0) - P; ANG = np.unwrap(np.arctan2(TG[:, 1], TG[:, 0]))
KAP = np.gradient(ANG) / SEG   # the curvature at each point (1/m, + a right-hander: x east, z south)

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def off(s, d):   # [x, z] d metres to the right (negative: the left) of the line s metres after the start line
    x, z = at(s); i = int(np.searchsorted(CUM, s % LEN, 'right') - 1); t = TG[i] / np.hypot(*TG[i])
    return [round(float(x - t[1] * d), 1), round(float(z + t[0] * d), 1)]

def apex(s, side, w=35):   # the tightest point of a bend turning to side (1 right, -1 left) within w m of s
    best, bs = -1, s
    for d in np.arange(-w, w + 0.1, 1.0):
        q = (s + d) % LEN; i = int(np.searchsorted(CUM, q, 'right') - 1); k = KAP[i] * side
        if k > best: best, bs = k, s + d
    return round(float(bs) % LEN)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its people, races or sponsors) ----
NAMES = [
    ('Rahli desni', 430, ['Flat through the gentle right!', 'The gentle right off the main straight!', 'Through the kink to the right!']),
    ('Dolgi desni', 880, ['All the way round the long right!', 'The long right at the top!', 'Through the long right-hander!']),
    ('Desni ob poljih', 1380, ['The long right by the fields!', 'Downhill into the right by the fields!', 'Round the right by the fields!']),
    ('Ostri desni', 1655, ['Hard on the brakes for the sharp right!', 'The sharp right at the bottom!', 'Round the sharp right!']),
    ('Levi v klanec', 1880, ['Left and up the hill!', 'The left, climbing now!', 'Through the left up the hill!']),
    ('Leva lasnica', 2120, ['Hard on the brakes for the left hairpin!', 'Round the tight left hairpin!', 'The left hairpin, all the way round!']),
    ('Desni navzdol', 2240, ['Right and down the hill!', 'The right, downhill now!', 'Through the right going down!']),
    ('Desni ob gozdu', 2390, ['The right by the eucalyptus wood!', 'Round the right past the trees!', 'Through the right by the wood!']),
    ('Dolgi levi', 2600, ['The long left!', 'All the way round the long left!', 'Through the long left!']),
    ('Ravnina ob jezeru', 2900, ['Down the straight by the lake!', 'Flat out along the lake!', 'The lake on the left, foot down!']),
    ('Esa ob jezeru', 3195, ['Left, right through the esses by the lake!', 'Over the kerbs in the esses!', 'Through the esses by the lake!']),
    ('Lasnica ob jezeru', 3320, ['Hard on the brakes for the hairpin by the lake!', 'Round the tight right hairpin!', 'The hairpin by the lake, all the way round!']),
    ('Ciljna ravnina', 3470, ['Up the main straight past the pits!', 'Flat out up the straight!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the gentle right, the long right, the right by the fields, the sharp
# right, the left up the hill, the left hairpin, the right downhill, the right by the wood, the long left (2), the esses (2), the hairpin by
# the lake ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(430, 1), (880, 1), (1420, 1), (1675, 1), (1890, -1), (2125, -1), (2255, 1), (2400, 1), (2570, -1), (2650, -1),
                                 (3180, -1), (3205, 1), (3320, 1)]]

DESC = ('Dirkališče ob jezeru Yahuarcocha v Andih severovzhodno od Ibarre, 2.200 m nad morjem: 3,6 km, v smeri urinega kazalca. S ciljne ravnine '
        'rahli desni in dolgi desni na vrhu, navzdol v desni ob poljih in ostri desni, levi v klanec do leve lasnice, desni navzdol in desni ob gozdu, '
        'dolgi levi, ravnina ob jezeru, esa in lasnica ob jezeru. Ob progi suha trava, evkaliptusi in agave, trstičje ob jezeru, na obzorju vulkana '
        'Imbabura in Cotacachi; boksi desno ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit by the lake Yahuarcocha in the Andes north-east of Ibarra, 2,200 m above the sea: 3.6 km, clockwise. From the main straight the '
           'gentle right and the long right at the top, down into the right by the fields and the sharp right, the left up the hill to the left hairpin, '
           'the right downhill and the right by the wood, the long left, the straight by the lake, the esses and the hairpin by the lake. Dry grass, '
           'eucalyptus trees and agaves by the track, reeds by the lake, the volcanoes Imbabura and Cotacachi on the horizon; the pits on the right of '
           'the main straight (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 14 m from the centre line, from the exit of the hairpin by the
# lake to before the gentle right; the 13 crews' boxes by the pit building in the paddock between the two straights (not in OSM: the
# garages RB_LOOK.yahuarcocha.pitBox); the pit wall 2.5 m past the road's edge ----
PIT = [14, -230, 250, 5]
PIT_ROW = [-55, 65]
WALLS = [[-230, 250, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: a covered one facing the pits, an open one round the left hairpin (not in
# OSM); named after the lake and the town
STANDS = [[-100, 70, -1, 7, 1, 5, 0, 'YAHUARCOCHA'], [2085, 2165, 1, 5, 0, 2, 0, 'IBARRA']]
SECTORS = [1250, 2450]
REAL_KM = 3.6

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the lake (sk.sea), the horizon (far) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):   # X, Z in the game's frame (origin the start line): the grids are in the tool's (origin the route's first point)
    gx = (X + O[0] - g['x0']) / g['cell'] - 0.5; gz = (Z + O[1] - g['z0']) / g['cell'] - 0.5
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

LAKE = (np.array(J['lakes'][0][3]).reshape(-1, 2) - O) if J.get('lakes') else None   # the lake's shore (OSM natural=water, water=lake), the game's frame

def lake_level():   # the lake's surface (m above the start line): the ground model over the water is flat, its median there
    g, a = grid('dem'); X, Z = np.meshgrid(g['x0'] - O[0] + (np.arange(g['nx']) + 0.5) * g['cell'], g['z0'] - O[1] + (np.arange(g['nz']) + 0.5) * g['cell'])
    m = lake_mask(X, Z); h = a.astype(np.float64) / 10.0 - 100.0
    return round(float(np.median(h[m])) - H0, 2) if m.any() else None

def lake_mask(X, Z):   # True in the lake at the points X, Z (a regular grid: the polygon drawn on it)
    if LAKE is None: return np.zeros(X.shape, bool)
    c = float(X[0, 1] - X[0, 0]); x0 = float(X[0, 0]); z0 = float(Z[0, 0])
    im = Image.new('L', (X.shape[1], X.shape[0]), 0); ImageDraw.Draw(im).polygon([((x - x0) / c, (z - z0) / c) for x, z in LAKE], fill=1)
    return np.asarray(im) > 0

LV = lake_level()

def water():
    # the lake: OSM's shore drawn on 2 m cells within 450 m of the road, its signed distance (m, + in the water) on 8 m cells over the water and
    # 40 m round it, -30 .. 30 m in 0.25 m steps, run-length coded (as World's Abu Dabi reads it: js/world-rbring.js, rbSea)
    if LAKE is None: return None
    f = 2.0; bx0 = math.floor((P[:, 0].min() - 500) / f) * f; bz0 = math.floor((P[:, 1].min() - 500) / f) * f
    bnx = int((P[:, 0].max() + 500 - bx0) / f); bnz = int((P[:, 1].max() + 500 - bz0) / f)
    X, Z = np.meshgrid(bx0 + (np.arange(bnx) + 0.5) * f, bz0 + (np.arange(bnz) + 0.5) * f); wet = lake_mask(X, Z)
    sd = (ndimage.distance_transform_edt(wet) - ndimage.distance_transform_edt(~wet)) * f
    zz, xx = np.nonzero(wet); WX = bx0 + (xx + 0.5) * f; WZ = bz0 + (zz + 0.5) * f
    d, _ = spatial.cKDTree(P).query(np.c_[WX, WZ]); near = d < 450
    if not near.any(): return None
    c = 8.0; x0 = math.floor((WX[near].min() - 40) / c) * c; z0 = math.floor((WZ[near].min() - 40) / c) * c
    nx = int(math.ceil((WX[near].max() + 40 - x0) / c)) + 1; nz = int(math.ceil((WZ[near].max() + 40 - z0) / c)) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c)
    v = ndimage.map_coordinates(sd, [(GZ - bz0) / f - 0.5, (GX - bx0) / f - 0.5], order=1, mode='nearest')
    q = np.clip(np.round((np.clip(v, -30, 30) + 30) * 4), 0, 240).astype(np.uint8).ravel()
    out = []; k = 0   # (run-length coded: a run of 4 or more of one value as 255, the value, the count (4-254); the rest as they are)
    while k < len(q):
        m = k
        while m < len(q) and q[m] == q[k] and m - k < 254: m += 1
        if m - k >= 4: out += [255, int(q[k]), m - k]; k = m
        else: out.append(int(q[k])); k += 1
    return dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lv=LV, rle=b64bytes(out))

# ---- the horizon (def.far for Riverside's rsFar, as Pembrey and Kildare): the highest ground in rings round the circuit, out to 29 km (the
# far grid: tools/yahuarcocha/config.json farKm 30) for the volcanoes Imbabura (16 km south-west) and Cotacachi (28 km west) ----
FAR_R = [1500, 2200, 3000, 4000, 5200, 6600, 8200, 10000, 12000, 14500, 17000, 20000, 23500, 27500]
def far_rings(na=180, step=20):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = 2000
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for a in range(na):
            m = lo
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (a + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 60):
                    i = int((cx + O[0] + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz + O[1] - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round((m - lo) / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=lo, step=step, snow={'summer': 4480, 'autumn': 4480, 'winter': 4380, 'spring': 4480},
                b64=base64.b64encode(bytes(out)).decode())

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, 1.3 m steps above the start line from -20 m (the lake 13 m below
    # it, the hills round the valley up to 310 m above it within the grid)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 1.3; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 the valley's dry grass and pasture, 1 eucalyptus woods, trees and shrubs, 2 fields (maize, beans), 3 built-up
    # (the paddock, the houses by the roads); ESA WorldCover and the canopy height, OSM's land use; the lake: grass under the water
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 20) | (wc == 10) | (ch > 3)] = 1
            cls[(wc == 40) & (ch <= 3) & (lu != 10)] = 2
            cls[((wc == 50) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 4)] = 3
            cls[(wc == 80) | (lu == 13)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    return D, LC, dict(sea=water()), lc, hv

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK, lc, hv = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'yahuarcocha'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Yahuarcocha, Ekvador: the circuit by the lake Yahuarcocha in the Andes north-east of Ibarra, clockwise, in its real layout and scale: the
  // start line on the main straight by the paddock (the pits on the right), the gentle right, the long right at the top, the right by the
  // fields, the sharp right, the left up the hill, the left hairpin, the right downhill, the right by the wood, the long left, the straight
  // by the lake, the esses and the hairpin by the lake: %(km)s km on our line (3.6 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/yahuarcocha/config.json: the raceway's
  // way, clockwise), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south.
  // GENERATED by tools/yahuarcocha/build.py (edit the names, the pits, the stands and the text there).
  // Heights (YA_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from
  // the start line, decimetres above it (%(h0)s m a.s.l.): the highest point at the long right at the top, the lowest by the lake.
  // Scenery data for the world builder (js/world-yahuarcocha.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights
  // above the start line in 1.3 m steps), land cover (lc, 16 m cells: 0 dry grass and pasture, 1 woods, trees and shrubs, 2 fields, 3
  // built-up: ESA WorldCover, the canopy, OSM), sk.sea: the lake (OSM's shore: its signed distance on 8 m cells, its level lv m above the
  // start line) and far: the horizon (the highest ground in rings round the circuit out to 27.5 km, m a.s.l.: lo + byte x step).
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const YA_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd3dde6, sun: 0xfff6e6, sunI: 1.18, sky: 0x8fb4dc, gnd: 0x7c7a5a, hemiI: 0.7, tint: [1.0, 1.0, 0.98], sat: 0.95, sunOff: [30, 95, 40], split: [[0.97, 1.0, 1.04], [1.04, 1.0, 0.95]] },   // the Andes at 2,200 m on the equator: a high strong sun, a clear deep sky
    say: 'Yahuarcocha', rainP: 0.12,
    grassNat: 0.6, lawn: [1.08, 0.99, 0.74],
    zivali: { a: ['cowB', 'horse', 'sheep', 'egret'], t: ['trough'], open: true },
    id: 'yahuarcocha', name: 'Yahuarcocha, Ekvador', theme: 'yahuarcocha', laps: 4, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Yahuarcocha, Ecuador', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 4.2, side: 5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: YA_H.map((h, i) => [i / YA_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the gentle right, the long right, the right by the fields, the sharp right, the left up the hill, the left hairpin, the right downhill, the right by the wood, the long left (2), the esses (2), the hairpin by the lake
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.yahuarcocha.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one facing the pits, round the left hairpin
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the right by the fields, the hills and the hairpins, the lake and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.environ.get('YAHUARCOCHA_OUT') or os.path.join(ROOT, 'js', 'tracks', 'yahuarcocha.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(np.diff(H)).max() / STEP * 100),
          D['nx'], 'x', D['nz'], '(%.0f .. %.0f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(), '; lake level', LV, '; turns', TURNS)
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
