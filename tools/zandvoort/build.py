# Zandvoort, Nizozemska: the game's track file from the track data (tools/zandvoort/zandvoort.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/zandvoort/build.py   -> js/tracks/zandvoort.js (centre line, heights, banking, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (B4), the track: docs/proge/zandvoort.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'zandvoort.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the finish line's height above the sea (4.7 m): the game's zero

# ---- the centre line: OSM's raceway ways (oneway=yes in the race direction: clockwise) from the finish line node, its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the finish line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the finish line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

def near(x, z):   # metres from the centre line
    return float(np.hypot(P[:, 0] - x, P[:, 1] - z).min())

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only. The real corners are named after people, a race series
# and firms (and the circuit after a firm): none of that goes to the game (CLAUDE.md, Pravna varnost); the dune names of the place stay out too ----
NAMES = [
    ('Lasnica na koncu ravnine', 365, ['Hard on the brakes for the hairpin at the end of the straight!', 'Right round the hairpin, the dunes towering over it!', 'Into the hairpin, the whole field squeezing in!']),
    ('Desni za boksi', 690, ['The quick right behind the pits!', 'Through the right behind the paddock!', 'Right-hander, behind the pits!']),
    ('Nagnjeni levi', 830, ['The banked left, lean on the bowl!', 'Round the banked left, flat on the slope!', 'Use the banking through the left!']),
    ('Greben sipine', 1120, ['Over the crest of the dune!', 'Up and over the dune ridge, light on the wheels!', 'Blind over the top of the dune!']),
    ('Hitra esa', 1340, ['Left and right through the fast esses!', 'Flat through the esses in the dunes!', 'Through the fast S on the ridge!']),
    ('Desni v dolino', 1730, ['The long fast right, down into the dune valley!', 'Downhill into the fast right!', 'Holding it through the right into the valley!']),
    ('Ostri desni', 2025, ['The sharp right at the far end!', 'Brake for the sharp right-hander!', 'Round the sharp right!']),
    ('Desni ob ribniku', 2260, ['The tight right by the ponds!', 'Right, past the pond in the dunes!', 'Round the right by the water!']),
    ('Levi okoli sipine', 2510, ['The long left round the dune!', 'Round the dune, a long left-hander!', 'Through the left round the sand hill!']),
    ('Šikana', 3140, ['Right and left through the chicane!', 'Hard on the brakes for the chicane!', 'Through the chicane at the end of the back straight!']),
    ('Desni pred zadnjim', 3515, ['The right before the last corner!', 'Through the right, the banking ahead!', 'Right-hander, set it up for the bowl!']),
    ('Nagnjeni zadnji ovinek', 3760, ['The banked last corner, flat out on the slope!', 'Round the banked bowl onto the straight!', 'All the way round the banking!']),
    ('Ciljna ravnina', 4150, ['Down the straight by the sea!', 'Flat out along the main straight, the pits on the right!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the hairpin, the right behind the pits, the banked left, the esses (2),
# the right into the valley, the sharp right, the right by the ponds, the left round the dune, the chicane (2), the right before the last
# corner, the banked last corner
TURNS = [369, 689, 818, 1242, 1422, 1762, 2021, 2251, 2510, 3089, 3192, 3517, 3756]

# ---- banked corners (Core.Track: def.bank = [[from, to, slope]]): the left after the hairpin and the last corner onto the straight, both
# 32 % (18 degrees) at their steepest (OSM description of both ways), the slope from the corner's entry to its exit ----
BANK = [[795, 900, 0.32], [3655, 3860, 0.32]]

DESC = ('Dirkališče v sipinah ob Severnem morju pri Zandvoortu: 4,3 km v smeri urinega kazalca, ozko in zavito, s klanci čez sipine. '
        'Ciljna ravnina ob obali, lasnica na njenem koncu, nagnjeni levi, čez greben sipine v hitro eso in v dolino, zanka okoli sipin in ribnikov, '
        'po zadnji ravnini v šikano in skozi nagnjeni zadnji ovinek nazaj na ravnino. Ob progi sipine s šopi trave in rakitovcem, peščeni žepi, '
        'velike tribune in boksi ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the dunes by the North Sea at Zandvoort: 4.3 km, clockwise, narrow and twisty, up and down over the dunes. '
           'The main straight along the coast, the hairpin at its end, the banked left, over the crest of a dune into the fast esses and down into '
           'the valley, a loop round the dunes and the ponds, along the back straight into the chicane and round the banked last corner onto the '
           'straight. Dunes of marram grass and sea buckthorn, sand, big grandstands and the pits along the main straight '
           '(drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (OSM: way 38144527, highway=raceway; the real lane leaves the
# circuit at the exit of the last corner and joins it after the hairpin, cutting inside it: here it runs along the straight at 14 m, as on the
# other circuits, and joins before the hairpin's braking); the 13 crews' boxes and the garages along the pit building (OSM, 186 m, the finish
# line by its south end); the pit wall 2.5 m past the road's edge ----
PIT = [14, -240, 255, 95]
PIT_ROW = [10, 175]
PIT_BOX = [0, 186, 1]   # (the garages: World's RB_LOOK.zandvoort.pitBox)
WALLS = [[-240, 255, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the main stand opposite the pits (OSM building=grandstand), the stands on the
# dunes outside the hairpin, outside the banked left and outside the banked last corner (the orange crowds of a home race)
STANDS = [[-45, 40, -1, 10, 1, 4, 1, 'ZANDVOORT'], [330, 420, -1, 9, 0, 3, 1, 'NOORD-HOLLAND'], [790, 860, 1, 8, 0, 2, 1, 'KENNEMERLAND'], [3710, 3790, -1, 8, 0, 3, 1, 'NEDERLAND']]
SECTORS = [1450, 2900]
REAL_KM = 4.259

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the ponds (sk.pond), the sand (sk.sand), the buildings (sk.bld) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
    gx = (X - g['x0']) / g['cell'] - 0.5; gz = (Z - g['z0']) / g['cell'] - 0.5
    v = ndimage.map_coordinates(a.astype(np.float32), [gz, gx], order=1 if heights else 0, mode='nearest')
    return v / 10.0 - 100.0 if heights else v

def rle(c, nv):   # run-length code as World.nrPrep reads the land cover (nv classes of 16 runs each in the 64 symbols)
    flatc = c.ravel(); out = []; k = 0; n = len(flatc); R = 64 // nv
    while k < n:
        v = int(flatc[k]); m = k
        while m < n and flatc[m] == v: m += 1
        run = m - k; k = m
        if run <= R - 1: out.append(A64[v * R + run - 1])
        else:
            out.append(A64[v * R + R - 1]); r = run - R
            while r >= 63: out.append(A64[63]); r -= 63
            out.append(A64[r])
    return ''.join(out)

def b64bytes(a): return base64.b64encode(np.asarray(a, np.uint8).tobytes()).decode()

def road_dist(X, Z):   # metres from the centre line on a grid (the line every ~5 m)
    from scipy.spatial import cKDTree
    d, _ = cKDTree(P).query(np.stack([X.ravel(), Z.ravel()], 1)); return d.reshape(X.shape)

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the finish line from -8 m (the beach
    # and the sea's edge 5 m below it, the dunes up to 27 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -8.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 the circuit's lawns (mown: OSM grass within 30 m of the road, the circuit's grounds (one leisure=sports_centre
    # round it all) only within 14 m: past them the dunes, as they are behind its fences), 1 the woods (pine, birch, poplar
    # in the dune valleys: the canopy over 4 m), 2 the dunes (marram grass, sea buckthorn and creeping willow, sand, the ponds: OSM scrub and
    # heath, beach, ESA grass and bare ground), 3 built-up (the paddock, the car parks, the holiday park and the town: OSM, ESA built-up)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); rd = road_dist(X, Z)
            cls = np.full(wc.shape, 2, np.int8)
            cls[((lu == 4) & (rd < 30)) | ((lu == 10) & (rd < 14))] = 0
            cls[(ch > 4) | ((wc == 10) & (ch > 2)) | (lu == 9)] = 1
            cls[((lu == 1) | (lu == 2) | (lu == 14) | (wc == 50)) & (ch <= 4)] = 3
            cls[(lu == 13) | (lu == 12)] = 2
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle(lc, 4))
    # the ponds in the dune valleys (OSM natural=water on 10 m cells, lu class 13) within 200 m of the road: a mask on 5 m cells (bilinear from
    # the 10 m grid), World lowers the ground under it and lays the water over it
    gl, al = grid('lu'); pc = 5.0; m = 220
    near = road_dist(*np.meshgrid(gl['x0'] + (np.arange(gl['nx']) + 0.5) * gl['cell'], gl['z0'] + (np.arange(gl['nz']) + 0.5) * gl['cell']))
    wm = ((al == 13) & (near < 200)).astype(np.float32)
    lab, nlab = ndimage.label(wm > 0); keep = np.zeros_like(wm)
    DRY = [(159, -288)]   # (the infiltration basin inside the hairpin: OSM landuse=basin, intermittent, dry most of the year: grass, not a pond)
    for k in range(1, nlab + 1):
        if (lab == k).sum() < 3: continue   # (no specks under 300 m2)
        if any(lab[int((z - gl['z0']) / gl['cell']), int((x - gl['x0']) / gl['cell'])] == k for x, z in DRY): continue
        keep[lab == k] = 1
    ys, xs = np.nonzero(keep)
    if len(xs):
        px0 = gl['x0'] + xs.min() * gl['cell'] - 20; pz0 = gl['z0'] + ys.min() * gl['cell'] - 20
        pnx = int(((xs.max() - xs.min() + 1) * gl['cell'] + 40) / pc); pnz = int(((ys.max() - ys.min() + 1) * gl['cell'] + 40) / pc)
        X, Z = np.meshgrid(px0 + (np.arange(pnx) + 0.5) * pc, pz0 + (np.arange(pnz) + 0.5) * pc)
        gx = (X - gl['x0']) / gl['cell'] - 0.5; gz = (Z - gl['z0']) / gl['cell'] - 0.5
        v = ndimage.map_coordinates(ndimage.gaussian_filter(keep, 0.6), [gz, gx], order=1, mode='constant')
        pm = (v > 0.32).astype(np.uint8)
        POND = dict(x0=round(px0, 1), z0=round(pz0, 1), nx=pnx, nz=pnz, cell=pc, rle=rle(pm, 2))
    else: POND = None
    # the sand (OSM natural=sand, beach, shingle in the dunes) within 150 m of the road: outlines [x, z, ...] in 0.5 m
    sand = []
    for kind, pts in J['shore']:
        a = np.array(pts).reshape(-1, 2)
        if min(near_pt for near_pt in (float(np.hypot(P[:, 0] - x, P[:, 1] - z).min()) for x, z in a[::max(1, len(a) // 40)])) > 150: continue
        sand.append([round(v * 2) / 2 for v in a.ravel()])
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building and the main stand
    # (the builder's garages and def.stands), nor where the game's pit lane runs
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if l * w > 1500: continue   # (the pit building, 186 x 28 m: RB_LOOK.zandvoort.pitBox; the main stand, 77 x 28 m: STANDS)
        if -250 < (s if s < LEN - 300 else s - LEN) < 265 and 0 < d < 14 + 6 + math.hypot(l, w) / 2: continue   # (in the way of the pit lane)
        hh = 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    sk = dict(bld=bld, sand=sand)
    if POND: sk['pond'] = POND
    return D, LC, sk

def build_track():
    hk = H[::2]; zvh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'zandvoort'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Zandvoort, the Netherlands: the circuit in the dunes by the North Sea north of Zandvoort (Noord-Holland), clockwise, in its real layout and
  // scale: the finish line on the main straight along the coast (OSM raceway=finish), the pits beside it on the right, the hairpin at its north
  // end, the right behind the pits, the banked left (18 degrees), over the crest of a dune into the fast esses and the long right down into the
  // valley, the loop round the dunes and the ponds at the far end, the back straight, the chicane, the right before the last corner and the
  // banked last corner (18 degrees) onto the straight: %(km)s km on our line (4.26 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/zandvoort/config.json: the circuit's
  // raceway ways, oneway=yes in the race direction, from the finish line node), the corners at its nodes rounded (sigma 5 m); metres,
  // origin = the finish line, x east, z south. GENERATED by tools/zandvoort/build.py (edit the names, the pits, the stands and the text there).
  // Heights (ZV_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from
  // the finish line, decimetres above it (4.7 m a.s.l.): the circuit low in the dunes, the esses on the ridge 6 m higher.
  // Scenery data for the world builder (js/world-zandvoort.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line in 0.25 m steps), land cover (lc, 16 m cells: 0 the circuit's grass, 1 the woods, 2 the dunes, 3 the paddock, the car parks
  // and the houses: OSM, ESA WorldCover, the canopy), and sk: the ponds in the dune valleys (pond: a mask on 5 m cells, OSM natural=water),
  // the sand in the dunes (sand: [x, z, ...] outlines, OSM natural=sand and beach), the buildings by the circuit ([x, z, length, width,
  // angle (deg), height]: OSM outlines as boxes).
  // The names: plain descriptions only (no names of people, firms, races or the circuit: its corners are named after people and firms).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const ZV_H = [%(zvh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xcdd6dc, sun: 0xfff2dc, sunI: 1.02, sky: 0xb4cce4, gnd: 0x6f7650, hemiI: 0.7, tint: [1.0, 1.0, 0.99], sat: 0.98, sunOff: [-70, 62, 70], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // the Dutch coast in summer: a hazy sea light, the sky pale over the dunes
    say: 'Zandvoort',
    grassNat: 0.5, lawn: [1.0, 1.0, 0.92],
    zivali: { a: ['fox', 'hare', 'roe', 'goose'], t: ['signPost', 'picnic'], open: true },
    id: 'zandvoort', name: 'Zandvoort, Nizozemska', theme: 'zandvoort', laps: 3, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Zandvoort, Netherlands', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 4, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: ZV_H.map((h, i) => [i / ZV_H.length, h / 10]),
    bank: %(bank)s,   // the banked left after the hairpin and the banked last corner: 32 %% (18 degrees), as the real ones
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the hairpin, the right behind the pits, the banked left, the esses (2), the right into the valley, the sharp right, the right by the ponds, the left round the dune, the chicane (2), the right before the last corner, the banked last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.zandvoort.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main stand opposite the pits, the stands on the dunes outside the hairpin, the banked left and the banked last corner
    stands: %(stands)s,
    zaslon: { d: -49, side: -1, off: 16.5 },   // the big screen (js/world-zaslon.js) by the grandstand on the left, turned towards the cars coming (node tools/zaslon-mesto.mjs zandvoort)
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the esses, the loop at the far end, the back straight and the banked last corner
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), zvh=zvh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           bank=json.dumps(BANK), pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'zandvoort.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; sand', len(SK['sand']), 'outlines; buildings', len(SK['bld']) // 6, '; ponds', SK.get('pond', {}).get('nx'), 'x', SK.get('pond', {}).get('nz'))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))
    pit0 = sd(-92.7, 225.2)[0]; print('  the real pit lane leaves the circuit at s %.0f (%.0f before the line)' % (pit0, LEN - pit0))

if __name__ == '__main__':
    build_track()
