# Hiva, Uzbekistan: the game's files from the track data (tools/hiva/hiva.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/hiva/build.py track   -> js/tracks/hiva.js (centre line, heights, widths, names: a city course, laps round the old walls)
#   python3 -I tools/hiva/build.py world   -> js/data/hiva.js (the scenery data for js/world-hiva.js)
# Edit the track's names, widths and description here, not in the generated files. The track: docs/proge/hiva.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'hiva.json')))
OB = json.load(open(os.path.join(HERE, 'obzidje.json')))   # (the landmark from OSM: python3 -I tools/hiva/obzidje.py)
STEP = J['step']; LINE0 = np.array(J['line']).reshape(-1, 2); H0 = np.array(J['h']); L = J['length']; NP = len(LINE0)

# ---- the start line: on the straight north along the west side (the data's s = 3010, ~35 m before its first point), the grid behind it ----
S_START = 3010.0
K0 = int(round(S_START / STEP)) % NP          # the data's point that becomes points[0]
def d2s(d): return (S_START + d) % L          # metres after the start line -> the data's s
def sidx(d): return int(round(d / STEP)) % NP # metres after the start line -> the game's point

def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def game_line():
    """the data's line, the corners rounded a little (sigma 6 m) and the two square jogs on the west side, where the route crosses the square
    before the west gate (the data's s 15-70 and 180-250), rounded into quick bends (sigma 15 m); rotated so that points[0] is the start line"""
    P = LINE0.copy(); s = np.arange(NP) * STEP
    g = lambda sig: np.stack([ndimage.gaussian_filter1d(P[:, 0], sig, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], sig, mode='wrap')], 1)
    A = g(1.2); B = g(3.0)
    w = np.maximum(np.minimum(sstep(5, 25, s), sstep(85, 65, s)), np.minimum(sstep(165, 185, s), sstep(265, 245, s)))
    Q = A * (1 - w[:, None]) + B * w[:, None]
    Q = np.roll(Q, -K0, axis=0); Q -= Q[0]   # (origin = the start line)
    return Q

def heights(): return np.roll(H0, -K0)

# ---- half widths by road (metres after the start line): the real streets in proportion, widened to race width ----
def dd(s): return round((s - S_START) % L, 1)
WIDTHS = [  # [from, to, half width] (the data's s)
    (2785, 3046 + 35, 4.6),   # the street along the west wall to the square (the start)
    (35, 200, 5.2),           # the square before the west gate (paved, open)
    (200, 537, 4.4),          # the lane along the north-west wall
    (537, 767, 5.0),          # the road past the north gate
    (767, 1541, 4.6),         # the streets of the outer town to the east
    (1541, 2006, 4.4),        # the lanes back to the east gate
    (2006, 2785, 4.6),        # down the east side and along the south wall
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        da = dd(a); db = da + (b - a)
        K.append([round(da + (12 if da > 0 else 0), 1), hw]); K.append([round(min(db, L) - (12 if db < L else 0), 1), hw])
        if db > L: K.append([0, hw]); K.append([round(db - L - 12, 1), hw])   # (the street over the line)
    K.sort(key=lambda k: k[0])
    return K

# ---- names on the HUD ([label, the data's s, the commentator's lines]): places and plain descriptions only (the streets here bear people's names) ----
NAMES = [
    ('Zahodna vrata', 150, ['Across the square before the west gate!', 'The west gate on the right, the old town behind the walls!']),
    ('Ob obzidju', 330, ['Along the old mud-brick walls!', 'The walls right beside you, ten metres of them!']),
    ('Severna vrata', 760, ['Past the north gate!', 'The north gate, and out to the east!']),
    ('Zunanje mesto', 1150, ['Through the streets of the outer town!', 'Out in the outer town, flat roofs and poplars!']),
    ('Vzhodna vrata', 1975, ['Back past the east gate!', 'The east gate, the market by the walls!']),
    ('Pod minaretom', 2080, ['The tall minaret over the walls!', 'Look up: the old minaret above the town!']),
    ('Južna vrata', 2410, ['The south gate, and along the south wall!', 'Past the south gate!']),
    ('Ob južnem obzidju', 2620, ['Along the south wall, the towers flash by!', 'Down the south wall to the last corner!']),
]
EN_NAMES = {'Zahodna vrata': 'West Gate', 'Ob obzidju': 'Along the Walls', 'Severna vrata': 'North Gate', 'Zunanje mesto': 'Outer Town',
            'Vzhodna vrata': 'East Gate', 'Pod minaretom': 'Under the Minaret', 'Južna vrata': 'South Gate', 'Ob južnem obzidju': 'Along the South Wall'}

# ---- the commentator's own lines (def.comm, js/game.js ownLine): a lap race round the walls of the old town; places only, no people ----
COMM = {
    'intro': ['Welcome to {track}! {laps} laps round the walls of the old town, {cars} cars, and you start {grid}.',
              'Good afternoon from {track}, an oasis between two deserts! {laps} laps round the mud-brick walls, and you line up {grid}.',
              'Here we are at {track}, under the walls of the old town and its minarets. {cars} cars, {laps} laps, you start {grid}.'],
    'introOne': ['Welcome to {track}! One lap round the walls of the old town, {cars} cars, and you start {grid}.'],
    'go': ['Lights out, and away they go across the square before the west gate!', "And they're off, the walls on the right!",
           'Green light! Into the dust of the square, and up to the walls!'],
    'lap': ['Lap {lap} of {laps}, round the walls again.', 'Into lap {lap}. Past the west gate once more!', "That's lap {lap}. Mind the walls."],
    'final': ['Final lap round the old town! Give it everything!', 'Last lap! One more time past the four gates!', 'One lap to go, the walls and the minarets one last time!'],
    'win': ['Chequered flag under the walls of the old town! Victory!', 'And you win it! What a drive round the walls of the old town!'],
}

DESC = ('Mestna proga v Hivi v Uzbekistanu, krog okoli obzidja Ičan Kale, starega mesta za zidovi iz blatne opeke: čez trg pred zahodnimi vrati, '
        'tik ob obzidju mimo severnih vrat, po ulicah zunanjega mesta na vzhodu, nazaj mimo vzhodnih vrat in ob južnem obzidju na štart. '
        'Krog 3,05 km, minareti nad zidovi.')
DESC_EN = ('A city course in Khiva in Uzbekistan, a lap round the walls of Itchan Kala, the old town behind its mud-brick walls: across the square '
           'before the west gate, right along the walls past the north gate, through the streets of the outer town to the east, back past the '
           'east gate and along the south wall to the line. A lap of 3.05 km, the minarets above the walls.')

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = game_line(); Hs = heights()
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    hvh = ','.join(str(int(round(v * 10))) for v in Hs)   # every 5 m from the start line, decimetres above the sea
    names = []
    for lab, s, lines in NAMES:
        x, z = float(P[sidx(dd(s)), 0]), float(P[sidx(dd(s)), 1])
        names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(round(x, 1)), f1(round(z, 1)), json.dumps(lines)))
    src = '''/* Track definition 'hiva'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Hiva, Uzbekistan: a city course on today's streets round the walls of Itchan Kala, the old town of Khiva (docs/proge/hiva.md), clockwise:
  // the start on the street north along the west wall, across the square before the west gate, the lane along the north-west wall, the road
  // past the north gate, the streets of the outer town to the east, the lanes back to the east gate, down the east side and along the south
  // wall past the south gate to the line: %(km)s km a lap. The walls (mud brick, ~9 m, the towers, the four gates and the minarets inside):
  // the game's model, assets/landmarks/hiva.glb (World.znamenitost), the world builder's simpler one until it is read. They drive on the right.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/hiva/config.json), the corners rounded
  // (sigma 6 m), the two square jogs across the square before the west gate rounded into quick bends; metres, origin = the start line, x east,
  // z south. GENERATED by tools/hiva/build.py (edit the names, widths and text there).
  // Heights (HV_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 5 m from the
  // start line, decimetres above the sea (the oasis is flat: 93-99 m). Widths: the real streets in proportion, widened to race width. The names:
  // places and plain descriptions only (the streets bear people's names: none on the HUD).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the canopy: Meta and
  // World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const HV_H = [%(hvh)s];
  TRACK_DEFS.push({
    look: { fog: 0xe2d8c4, sun: 0xfff0d2, sunI: 1.28, sky: 0xa9c4e0, gnd: 0x8a7656, hemiI: 0.6, tint: [1.04, 1.0, 0.94], sat: 1.04, sunOff: [70, 88, -40], split: [[0.97, 1.0, 1.05], [1.05, 1.0, 0.94]] },   // Khiva: a dry, dusty afternoon in the oasis, the sun high
    say: 'Khiva',
    rainP: 0.06,   // (Khiva: a desert oasis, ~100 mm of rain a year, the most in spring)
    comm: %(comm)s,
    zivali: { a: ['stork'], t: [], city: true },
    id: 'hiva', name: 'Hiva, Uzbekistan', theme: 'hiva', laps: 3, halfWidth: 4.6,
    desc: %(desc)s,
    en: { name: 'Khiva, Uzbekistan', desc: %(desc_en)s },
    start: [0, 0], runoff: 0.42, inner: 2.6, side: 3.0, noCurbs: true, noGravel: true, offSurface: 'paving', gradeForce: true, elevSmooth: 16, realKm: %(km)s,
    elev: HV_H.map((h, i) => [i / HV_H.length, h / 10]),
    widths: %(widths)s,
    // places on the HUD ([label, x, z, the commentator's lines]; the descriptive labels have their English in js/lang.js)
    names: [
%(names)s
    ],
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (L / 1000), hvh=hvh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), widths=json.dumps(widths()),
           names='\n'.join(names), pts=pts, comm=json.dumps(COMM))
    path = os.path.join(ROOT, 'js', 'tracks', 'hiva.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB;', NP, 'points; corners', [round(float(np.degrees(a)), 0) for a in sharp(P)][:6])

def sharp(P):
    """the sharpest turns of the line over 10 m (for the build's report)"""
    d = np.roll(P, -2, 0) - P; a = np.arctan2(d[:, 1], d[:, 0]); da = np.abs((np.roll(a, -2) - a + np.pi) % (2 * np.pi) - np.pi)
    return sorted(da, reverse=True)

# ---- the scenery data for js/world-hiva.js (js/data/hiva.js: var HV_DATA) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
    """the grid's value at world points (bilinear for heights, nearest for classes)"""
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

HEAD = """/* Hiva (theme 'hiva'): the scenery data for js/world-hiva.js (metres, origin = the start line, x east, z south). GENERATED by
   tools/hiva/build.py world from tools/hiva/hiva.json (tools/proga-podatki.py; docs/proge/hiva.md).
   dem: the ground (Copernicus DEM GLO-30 less the tree crowns and the buildings; 32 m cells, bytes: lo + v * step m above the sea, World.nrPrep's
   form); lc: the land cover (16 m cells, run-length coded as World.nrPrep reads it: 0 open, 1 forest, 2 scrub, 3 settlement; ESA WorldCover, OSM,
   the canopy); far: the surface (200 m cells, bytes of 2 m); bld: OSM buildings within 60 m [x, z, length, width, angle, height (0 unknown),
   kind: 0 house, 1 church, 2 tower, 3 castle, 4 shed, 5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats]; walls [0 wall, 1 retaining,
   2 hedge, 3 fence, 4 guard rail, [x, z, ...]] (the city wall is not here: it is the landmark's,
   from tools/hiva/obzidje.py: cwall [height, [x, z, ...]] OSM's city_wall outlines, towers [x, z] its defensive towers, gates [height, [x, z, ...]]
   the four gates' footprints); marks [label,
   kind, s, d, outline]; onRoad [s, kind, x]: OSM's nodes on the lap's own ways (kind 0 a marked pedestrian crossing, x 1 on a primary or
   secondary road; 1 a stop sign, 2 a give-way sign, x the lane the line lies across: 1 the lap's own, -1 the oncoming one); s: metres after the
   start line. Data: © OpenStreetMap contributors (ODbL 1.0: the derived data here under the ODbL 1.0); Copernicus DEM GLO-30 (produced using
   Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and
   ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
   Only geographic and descriptive labels. */
var HV_DATA = """

def on_road():
    """the markings across the road, from OSM's nodes on the lap's own ways (J['onRoad']): [s after the start line, kind, x] (as Luanda's)"""
    ends = sorted(set([round(w[0]) for w in J['ways']] + [round(w[1]) for w in J['ways']])); out = []
    for s, kind, det in J['onRoad']:
        if kind == 'crossing' and det in ('zebra', 'uncontrolled'):
            hw = next((w[3] for w in J['ways'] if w[0] <= s <= w[1]), ''); out.append([dd(s), 0, 1 if hw in ('primary', 'secondary', 'trunk') else 0])
        elif kind in ('stop', 'give_way'):
            ahead = min([e - s for e in ends if e >= s] or [1e9]); behind = min([s - e for e in ends if e < s] or [1e9])
            out.append([dd(s), 1 if kind == 'stop' else 2, 1 if ahead <= behind else -1])
    return sorted(out)

def build_world():
    P = game_line(); M = 800; O = LINE0[K0]   # (the data's frame -> the game's: minus the start line's point)
    sh = lambda fl: [round(v - (O[0] if i % 2 == 0 else O[1]), 1) for i, v in enumerate(fl)]
    x0 = math.floor((P[:, 0].min() - M) / 32) * 32; z0 = math.floor((P[:, 1].min() - M) / 32) * 32
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    # terrain: the ground model resampled to 32 m cells, 1 m steps from 80 m (the oasis: 90-100 m)
    gd, ad = grid('dem'); c = 32; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X + O[0], Z + O[1], True)
    lo, step = 80.0, 0.5; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.25, b64=b64bytes(dem))
    # land cover: 16 m cells, World's classes 0 open, 1 forest (the orchards, the poplar rows), 2 scrub, 3 settlement
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); c = 16
    lnx = int(math.ceil((x1 - x0) / c)); lnz = int(math.ceil((z1 - z0) / c))
    votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c + O[0], z0 + (np.arange(lnz) + 0.5 + fz) * c + O[1])
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 20) | (lu == 8) | ((wc == 30) & (ch > 1))] = 2
            cls[(wc == 10) | (lu == 9) | (ch > 4)] = 1
            cls[((wc == 50) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            cls[(wc == 80) | (lu == 13) | (lu == 12)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the far land: the surface model (200 m cells: the tops kept), 2 m steps
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).max(axis=(1, 3))
    FAR = dict(x0=round(gf['x0'] - O[0], 1), z0=round(gf['z0'] - O[1], 1), n=n2, cell=gf['cell'] * 2, lo=0, step=2, b64=b64bytes(np.clip(np.round(fh / 2), 0, 255)))
    KIND_W = {'wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    data = {
        'dem': D, 'lc': LC, 'far': FAR,
        'bld': [[round(b[0] - O[0], 1), round(b[1] - O[1], 1), b[2], b[3], round(b[4], 2), b[5], b[6]] for b in J['bld'] if max(b[2], b[3]) < 90],
        'walls': [[KIND_W.get(w[0], 3), sh(w[3])] for w in J['walls'] if w[0] != 'city_wall'],
        'cwall': [[h, sh(fl)] for _, h, fl in OB['cwall']],   # (tools/hiva/obzidje.py: OSM's walls whole, not clipped at 30 m)
        'towers': [sh(t[1:]) for t in OB['towers']], 'gates': [[h, sh(fl)] for _, h, fl in OB['gates']],
        'marks': [[m[0], m[2], dd(m[3]), m[4], sh(m[5])] for m in J['landmarks']],
        'onRoad': on_road(),
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'hiva.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, len(LC['rle']), 'chars; classes', np.bincount(lc.ravel(), minlength=4).tolist(), '; origin shift', O.round(1).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
