# Pärnu, Estonija: the game's track file from the track data (tools/parnu/parnu.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/parnu/build.py   -> js/tracks/parnu.js (centre line, heights, names, pits, stands, terrain, land cover, the pond, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/parnu.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'parnu.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish here; the line is put by the middle of the pit building (OSM w320391625, 234 m long, its
# middle 44 m after the route's first point: tools/parnu/config.json), the line and its heights rolled to start there, the origin moved onto it
S0 = 44.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O; H = np.roll(np.array(J['h']), -K0)
H0 = float(H[0])   # the start line's height above the sea (3.4 m): the game's zero

# ---- the centre line: OSM's raceway (the layout since 2012, counterclockwise as raced), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]
TG = np.roll(P, -1, 0) - P; ANG = np.unwrap(np.arctan2(TG[:, 1], TG[:, 0]))
KAP = ndimage.gaussian_filter1d(np.gradient(ANG) / SEG, 1.0, mode='wrap')   # the curvature at each point (1/m, + a right-hander: x east, z south)

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def apex(s, side, w=30):   # the tightest point of a bend turning to side (1 right, -1 left) within w m of s
    best, bs = -1, s
    for d in np.arange(-w, w + 0.1, 1.0):
        q = (s + d) % LEN; i = int(np.searchsorted(CUM, q, 'right') - 1); k = KAP[i] * side
        if k > best: best, bs = k, s + d
    return round(float(bs) % LEN)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its people, races or sponsors) ----
NAMES = [
    ('Leva lasnica', 394, ['Hard on the brakes for the left hairpin!', 'Round the tight left hairpin!', 'The left hairpin at the end of the straight!']),
    ('Zahodna ravnina', 640, ['Flat out down the west straight!', 'Foot down along the west straight!', 'The long west straight!']),
    ('Šikana', 945, ['Left, right through the chicane!', 'Over the kerbs in the chicane!', 'Into the chicane!']),
    ('Esi', 1055, ['Left and right through the esses!', 'Quick through the esses!', 'Through the esses!']),
    ('Južna zanka', 1175, ['Round the long left of the south loop!', 'All the way round the south loop!', 'Through the south loop!']),
    ('Vzhodna ravnina', 1520, ['Flat out up the east straight!', 'The long east straight, foot down!', 'Along the east straight!']),
    ('Vijuge', 1760, ['Left, right, left through the twists!', 'Quick hands through the twists!', 'Into the twisty part!']),
    ('Desni ob ribniku', 2099, ['The tight right by the pond!', 'Hard on the brakes, right by the pond!', 'Round the right by the pond!']),
    ('Severna lasnica', 2160, ['The north hairpin, all the way round to the left!', 'Round the north hairpin!', 'Left, and left again, round the hairpin!']),
    ('Dolgi levi', 2432, ['The long left!', 'All the way round the long left!', 'Through the long left!']),
    ('Desni okljuk', 2771, ['The long right-hand loop!', 'All the way round the right-hand loop!', 'Through the right-hand loop!']),
    ('Zadnji ovinek', 2985, ['The last corner, onto the straight!', 'The right onto the main straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 3090, ['Down the main straight past the pits!', 'Flat out down the main straight!', 'The main straight, the lap is nearly done!']),
]
# the 15 corners' apexes (the turn numbers of the sources: the left hairpin, the chicane (2), the esses' right, the south loop (2), the twists
# (4), the right by the pond, the north hairpin, the long left, the right-hand loop, the last corner) ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(394, -1), (928, -1), (987, 1), (1075, 1), (1175, -1), (1275, -1), (1759, -1), (1798, 1), (1936, 1), (2010, -1),
                                 (2099, 1), (2153, -1), (2432, -1), (2771, 1), (2985, 1)]]

DESC = ('Dirkališče na ravnih obalnih travnikih pri Papsaareju severozahodno od Pärnuja: 3,2 km, 15 ovinkov, v nasprotni smeri urinega kazalca. '
        'S ciljne ravnine v levo lasnico, po zahodni ravnini do šikane in esov, skozi južno zanko na vzhodno ravnino, vijuge in desni ob ribniku do '
        'severne lasnice, dolgi levi, desni okljuk in zadnji ovinek. Ob progi travniki, jarki in trstičje, borov in brezov gozd, ribnik v notranjosti; '
        'dolga stavba boksov z 29 garažami desno ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on the flat coastal meadows at Papsaare north-west of Pärnu: 3.2 km, 15 corners, anticlockwise. From the main straight into '
           'the left hairpin, down the west straight to the chicane and the esses, round the south loop onto the east straight, the twists and the '
           'right by the pond to the north hairpin, the long left, the right-hand loop and the last corner. Meadows, ditches and reeds by the track, '
           'pine and birch woods, a pond in the infield; the long pit building with 29 garages on the right of the main straight (drive in and the '
           'mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 14 m from the centre line, from the exit of the last corner to
# before the kink at the left hairpin (OSM w827039000 between the pit wall and the garages); the 13 crews' boxes in the middle of the pit
# building (its 29 garages: js/world-parnu.js), the player's in the middle at the start line; the pit wall 2.5 m past the road's edge ----
PIT = [14, -150, 300, 0]
PIT_ROW = [-65, 55]
WALLS = [[-150, 300, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: a small covered one facing the pits (not in OSM), named after the town
STANDS = [[-45, 45, -1, 6, 1, 3, 0, 'PÄRNU']]
SECTORS = [1100, 2150]
REAL_KM = 3.172

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the pond (sk.sea), the buildings, the paddock's roads, the ditches and the fences (sk) ----
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

def mv(fl): return [round((v - O[k % 2]) * 2) / 2 for k, v in enumerate(fl)]   # [x, z, ...] of the tool's frame into the game's, to 0.5 m

LAKE = (np.array(J['lakes'][0][3]).reshape(-1, 2) - O) if J.get('lakes') else None   # the pond's shore (OSM natural=water), the game's frame

def lake_mask(X, Z):   # True in the pond at the points X, Z (a regular grid: the polygon drawn on it)
    if LAKE is None: return np.zeros(X.shape, bool)
    c = float(X[0, 1] - X[0, 0]); x0 = float(X[0, 0]); z0 = float(Z[0, 0])
    im = Image.new('L', (X.shape[1], X.shape[0]), 0); ImageDraw.Draw(im).polygon([((x - x0) / c, (z - z0) / c) for x, z in LAKE], fill=1)
    return np.asarray(im) > 0

def lake_level():   # the pond's surface (m above the start line): 0.5 m under the lowest ground of its shore (the ground model is not flat there)
    if LAKE is None: return None
    gd, ad = grid('dem'); sh = sample(gd, ad, LAKE[:, 0], LAKE[:, 1], True) - H0
    return round(float(np.percentile(sh, 10)) - 0.5, 2)

LV = lake_level()

def water():
    # the pond: OSM's shore drawn on 2 m cells, its signed distance (m, + in the water) on 4 m cells over the water and 24 m round it, -30 .. 30 m
    # in 0.25 m steps, run-length coded (as World's rbSea reads it: js/world-rbring.js)
    if LAKE is None: return None
    f = 2.0; bx0 = math.floor((LAKE[:, 0].min() - 60) / f) * f; bz0 = math.floor((LAKE[:, 1].min() - 60) / f) * f
    bnx = int((LAKE[:, 0].max() + 60 - bx0) / f); bnz = int((LAKE[:, 1].max() + 60 - bz0) / f)
    X, Z = np.meshgrid(bx0 + (np.arange(bnx) + 0.5) * f, bz0 + (np.arange(bnz) + 0.5) * f); wet = lake_mask(X, Z)
    sd = (ndimage.distance_transform_edt(wet) - ndimage.distance_transform_edt(~wet)) * f
    zz, xx = np.nonzero(wet); WX = bx0 + (xx + 0.5) * f; WZ = bz0 + (zz + 0.5) * f
    c = 4.0; x0 = math.floor((WX.min() - 24) / c) * c; z0 = math.floor((WZ.min() - 24) / c) * c
    nx = int(math.ceil((WX.max() + 24 - x0) / c)) + 1; nz = int(math.ceil((WZ.max() + 24 - z0) / c)) + 1
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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, 0.12 m steps above the start line from -6 m (the coastal plain:
    # the circuit within 2 m of the start line, the river and the ditches a little lower, the ground in the grid up to 26 m above the sea)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -6.0, 0.12; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.08, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (meadows, the circuit's grass, reeds and wet meadows, the pond), 1 woods (pine and birch, the taller scrub),
    # 2 fields, 3 built-up and the paddock's asphalt; OSM's land use first (its grass over WorldCover's built-up round the track), ESA
    # WorldCover and the canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (ch > 5)] = 1
            cls[(wc == 40) & (ch <= 5)] = 2
            cls[(wc == 50) & (ch <= 5)] = 3
            cls[(lu == 9) | ((lu == 8) & (ch > 3))] = 1
            cls[(lu == 8) & (ch <= 3)] = 0
            cls[(lu == 3) & (ch <= 5)] = 2
            cls[((lu == 4) | (lu == 13)) & (ch <= 5)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building (the builder's own, with
    # its 29 garages) and the pavilion past its north end (pav: [x, z, length, width, angle], the builder's glass pavilion)
    bld = []; pav = None
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        sn = (s - S0) % LEN; xx, zz = mv([x, z])
        if l > 200: continue                                                   # (the pit building)
        if 120 < sn < 200 and d > 0 and l > 40: pav = [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang), 1)]; continue
        hh = hgt or (6.5 if l * w > 300 else 4.2 if l * w > 100 else 3.2)
        bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the paddock's and the marshals' roads (OSM highway=service and the like, within 60 m): [width, x, z, ...]
    wid = {'service': 4.5, 'residential': 6, 'footway': 2, 'track': 3}
    road = [[wid.get(r[0], 4)] + mv(r[8]) for r in J['roads'] if r[0] in wid]
    # the ditches across the coastal meadows (OSM waterway=ditch and drain, within 100 m), the fences round the circuit (barrier=fence): [x, z, ...]
    ditch = [mv(w[3]) for w in J['water'] if w[0] in ('ditch', 'drain', 'stream')]
    fence = [mv(w[3]) for w in J['walls'] if w[0] == 'fence']
    return D, LC, dict(sea=water(), bld=bld, pav=pav, road=road, ditch=ditch, fence=fence), lc, hv

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK, lc, hv = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'parnu'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Pärnu, Estonia: the circuit on the coastal meadows at Papsaare north-west of Pärnu, its layout since 2012, counterclockwise, in its real
  // layout and scale: the start line by the middle of the pit building, the pits beside it on the right, the left hairpin, the west straight,
  // the chicane and the esses, the south loop, the east straight, the twists, the right by the pond, the north hairpin, the long left, the
  // right-hand loop and the last corner: %(km)s km on our line (3.172 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/parnu/config.json: the raceway's ways
  // 248122258, 1225017291, 45482078, 45482081 and 248122257), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line,
  // x east, z south. GENERATED by tools/parnu/build.py (edit the names, the pits, the stands and the text there).
  // Heights (PA_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (%(h0)s m a.s.l.): the coastal plain, the whole lap within 2 m.
  // Scenery data for the world builder (js/world-parnu.js): terrain (dem: the same model, 16 m cells, heights above the start line in 0.12 m
  // steps), land cover (lc, 16 m cells: 0 meadows, the circuit's grass and the wet meadows, 1 woods, 2 fields, 3 built-up and the paddock's
  // asphalt: OSM, ESA WorldCover, the canopy), and sk: the pond in the infield (sea: OSM's shore as a signed distance, its level lv), the
  // buildings by the circuit ([x, z, length, width, angle (deg), height]: OSM outlines as boxes, not the pit building, which the builder
  // makes), the pavilion past the pit building (pav), the paddock's roads ([width, x, z, ...]), the ditches and the fences ([x, z, ...]).
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const PA_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc9d6e0, sun: 0xfff3de, sunI: 1.04, sky: 0xa9c8e8, gnd: 0x56703a, hemiI: 0.68, tint: [0.98, 1.0, 1.0], sat: 0.98, sunOff: [-64, 58, 74], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // the Baltic summer by the sea: a lower northern sun from the south-west, a cool clear haze
    say: 'Pärnu', rainP: 0.2,
    grassNat: 0.45, lawn: [0.95, 1.03, 0.95],
    zivali: { a: ['roe', 'hare', 'fox', 'stork', 'goose'], t: ['storkNest', 'huntStand', 'logPile'], open: true },
    id: 'parnu', name: 'Pärnu, Estonija', theme: 'parnu', laps: 4, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Pärnu, Estonia', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 3.8, side: 5.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: PA_H.map((h, i) => [i / PA_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners and the straights by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the 15 corners' apexes: the left hairpin, the chicane (2), the esses, the south loop (2), the twists (4), the right by the pond, the north hairpin, the long left, the right-hand loop, the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the middle garages of the pit building: js/world-parnu.js)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the small covered one facing the pits
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the hairpin, the west straight and the chicane; the south loop, the east straight and the twists; the north hairpin and the run home
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.environ.get('PARNU_OUT') or os.path.join(ROOT, 'js', 'tracks', 'parnu.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(np.diff(H)).max() / STEP * 100),
          D['nx'], 'x', D['nz'], '(%.1f .. %.1f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(), '; pond level', LV,
          '; buildings', len(SK['bld']) // 6, 'pavilion', SK['pav'], 'roads', len(SK['road']), 'ditches', len(SK['ditch']), 'fences', len(SK['fence']), '; turns', TURNS)
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
