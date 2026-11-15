# Livingstone, Zambija: the game's files from the track data (tools/livingstone/livingstone.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/livingstone/build.py track   -> js/tracks/livingstone.js (centre line, heights, widths, names, the open road's four ways to drive it)
#   python3 -I tools/livingstone/build.py world   -> js/data/livingstone.js (the scenery data for js/world-livingstone.js)
# Edit the track's names, widths, medals and description here, not in the generated files. The track: docs/proge/livingstone.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'livingstone.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); L = J['length']; NP = len(LINE)
H0 = float(H[0])   # the road's zero: heights in the game are metres above points[0]

def sidx(s): return max(0, min(NP - 1, int(round(s / STEP))))   # (an open road: no wrap)
def xz(s): i = sidx(s); return [round(float(LINE[i, 0]), 1), round(float(LINE[i, 1]), 1)]

S0 = 120.0          # the start line, metres along the road's line (the grid lines up behind it)
S1 = L - 150.0      # the finish line, on the trunk road on the far bank ~150 m before the end of the data (the road past it: a slot for every car of the field)
def d2s(d): return S0 + d   # metres after the start line -> along the line
BR = J['bridges'][0]          # the old bridge over the gorge (s along the line, OSM bridge=yes)
BD = (round(BR[0] - S0), round(BR[1] - S0))   # ... in metres after the start line

# ---- half widths by road (metres after the start line): the real roads in proportion, widened to race width ----
WIDTHS = [  # [from, to, half width]
    (-S0, 1945, 5.2),        # the trunk road south of the town through the dry woodland (2 lanes, wide verges)
    (1945, BD[0] - 30, 5.0), # past the border post and down towards the gorge
    (BD[0] - 30, BD[1] + 30, 4.4),   # the old bridge (one lane each way, the deck between the parapets)
    (BD[1] + 30, S1 - S0, 5.0),      # the trunk road on the far bank
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        K.append([round(a + (12 if a > -S0 else 0), 1), hw]); K.append([round(b - (12 if b < S1 - S0 else 0), 1), hw])
    return K

# ---- names on the HUD ({n, d: metres after the start line, say}): places and plain descriptions only (no names of people, events or firms) ----
NAMES = [
    ('Južno od mesta', 60, ['South out of town, through the dry woodland!', 'The long road south, the spray of the falls ahead!']),
    ('Gozdna savana', 1105, ['Through the dry woodland, flat out!', 'Mopane and acacia on both sides!']),
    ('Mejni prehod', 1945, ['Past the border post!', 'The border post, and the gorge is close now!']),
    ('Nad sotesko', 2385, ['Down towards the gorge, the falls thunder on the right!', 'The spray of the falls over the trees!']),
    ('Stari most', BD[0] + 20, ['Onto the old bridge, a hundred metres above the river!', 'The steel arch over the gorge, the river far below!']),
    ('Drugi breg', BD[1] + 40, ['Off the bridge and onto the far bank!', 'Across the border, and on to the finish!']),
    ('Zadnji kilometer', round(S1 - S0 - 900), ['The last kilometre, give it everything!', 'Up the far bank to the finish!']),
]
EN_NAMES = {'Južno od mesta': 'South of Town', 'Gozdna savana': 'The Woodland', 'Mejni prehod': 'The Border Post', 'Nad sotesko': 'Above the Gorge',
            'Stari most': 'The Old Bridge', 'Drugi breg': 'The Far Bank', 'Zadnji kilometer': 'The Last Kilometre'}

DESC = ('Proga pri Livingstonu v Zambiji: po glavni cesti južno od mesta skozi suho gozdno savano, mimo mejnega prehoda, navzdol proti soteski reke '
        'Zambezi ob slapovih in čez stari jekleni ločni most sto metrov nad reko na drugi breg. Dirka s tekmeci, vožnja proti uri, dvoboj v prometu '
        'ali beg pred policijo.')
DESC_EN = ('A course by Livingstone in Zambia: down the trunk road south of the town through the dry woodland, past the border post, down towards '
           'the gorge of the Zambezi by the falls and over the old steel arch bridge, a hundred metres above the river, to the far bank. '
           'A race against rivals, a run against the clock, a duel in the traffic or a run from the police.')
# medal times (s): the stock rally car on the autopilot x 1.01, 1.06, 1.14 (the medal run of tools/nova-proga.mjs --medalje)
MEDALS = {'cs': [120, 126, 135], 'wet': {'cs': [138, 145, 156]}, 'winter': {'cs': [135, 142, 152], 'wet': {'cs': [165, 173, 186]}}}

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = LINE
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    luh = ','.join(str(int(round((v - H0) * 10))) for v in H)   # every 5 m from points[0], decimetres above points[0]
    names = []
    for lab, d, lines in NAMES:
        names.append('      %s,' % json.dumps({'n': lab, 'd': d, 'say': lines}, ensure_ascii=False))
    span = S1 - S0; cps = [xz(d2s(span * k / 5)) for k in range(1, 5)]
    src = '''/* Track definition 'livingstone'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Livingstone, Zambija: the trunk road south of the town on today's roads (docs/proge/livingstone.md): through the dry woodland past the
  // border post, down to the gorge of the Zambezi below the falls and over the old steel arch bridge (the game's model,
  // assets/landmarks/livingstone.glb, World.znamenitost) to the far bank: %(km)s km of racing. One card, four ways to drive it (def.modes).
  // They drive on the left in Zambia: def.leftHand (the traffic keeps left, see Core: tfSide).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/livingstone/config.json); metres, origin = the
  // first point of the road (the start line 120 m on), x east, z south. GENERATED by tools/livingstone/build.py (edit the names, widths and text there).
  // Heights (LV_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed (the bridge's deck
  // level over the gorge); every 5 m from points[0], decimetres above points[0] (%(h0)s m above the sea). Widths: the real roads in proportion,
  // widened to race width. The names: places and plain descriptions.
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the canopy: Meta and
  // World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const LV_H = [%(luh)s];
  TRACK_DEFS.push({
    look: { fog: 0xd8d6cc, sun: 0xfff0d2, sunI: 1.24, sky: 0x9fc3e4, gnd: 0x7a6a4a, hemiI: 0.6, tint: [1.04, 1.0, 0.94], sat: 1.05, sunOff: [55, 80, -50], split: [[0.97, 1.0, 1.05], [1.05, 1.0, 0.94]] },   // Livingstone: a hazy dry-season afternoon over the woodland, the sun high in the north
    say: 'Livingstone',
    zivali: { a: ['egret', 'buffalo'], t: ['palmHut'], open: true },
    id: 'livingstone', name: 'Livingstone, Zambija', theme: 'livingstone', open: true, leftHand: true, modes: ['race', 'tt', 'traffic', 'police'], laps: 1,
    maxRivals: 60,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the ~130 m of road past the line, two rows a side
    halfWidth: 5.4,
    desc: %(desc)s,
    en: { name: 'Livingstone, Zambia', desc: %(desc_en)s, escTo: 'To the far bank' },
    realKm: %(km)s, alt: [%(a0)s, %(a1)s],
    start: %(start)s, finish: %(finish)s, cps: %(cps)s,
    runoff: 0.55, inner: 3.0, side: 3.4, noCurbs: true, noGravel: true, offSurface: 'gravel', gradeForce: true, elevSmooth: 20,
    elev: LV_H.map((h, i) => [i / (LV_H.length - 1), h / 10]),
    widths: %(widths)s,
    // the old bridge over the gorge, metres after the start line (Core: fenceRuns leaves the run of the barrier out there; the bridge's own railing is the world's)
    bridges: %(br)s,
    // medal times of the time trial (s), dry and in the rain, in summer and in winter: the stock rally car on the autopilot x 1.01 (gold), 1.06 (silver), 1.14 (bronze) (cs: Circuit Superstars physics)
    medals: %(medals)s,
    // the traffic of the open road (the duel, the run from the police): the share of each kind of vehicle [car, van, bus, motorbike, truck], a cyclist every so many metres each way
    traffic: { mix: [0.6, 0.18, 0.1, 0.08, 0.04], bike: 3000 },
    police: { label: 'POLICE', band: '#1d3f86', text: '#ffffff' }, escTo: 'Na drugi breg',
    // named places ({ n: HUD label, d: metres after the start line, say: the commentator's lines })
    names: [
%(names)s
    ],
    // the commentator's own lines on this road
    comm: {
      introPass: ["Welcome to {track}! {cars} cars, the woodland, the gorge and the old bridge, and you start {grid}.", "Here we are south of the town. A race through the woodland and over the gorge, and you line up {grid}."],
      goPass: ["And away they go into the woodland!", "And they're off! Next stop, the border post!", "The race is on! Next stop, the bridge over the gorge!"],
      introPassTT: ["Welcome to {track}! Just you, the woodland and the clock.", "Here we are south of the town. {cps} checkpoints between you and the far bank."],
      goPassTT: ["Green light! The clock is running!", "Go! Through the woodland and over the gorge!"],
      introTraffic: ["Welcome to {track}, and the road is open today! Just you and {rival}, first to the far bank wins!", "Here we are south of the town. A duel with {rival} in the traffic to the bridge. Keep left!"],
      introPolice: ["Welcome to {track}! The police want a word with you, and they are right behind. Get over the bridge without getting caught!", "Here we are south of the town, and the lights are already flashing. Do not stop!"],
      escaped: ["You made it to the far bank! The police will have to wait for another day!", "Escaped! Over the gorge and away!"],
      summitRecord: ["At the finish! A new personal best, {time}!", "Record run! {time} over the gorge!"],
      summitEven: ["At the finish in {time}. That is your record to the thousandth!", "{time}, dead level with your best!"],
      summit: ["At the finish in {time}, {delta} seconds off your best.", "Across the line on the far bank. {time}, just {delta} short of the record."],
    },
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % ((S1 - S0) / 1000), luh=luh, h0=int(round(H0)), desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), a0=int(round(H[sidx(S0)])), a1=int(round(H[sidx(S1)])),
           start=json.dumps(xz(S0)), finish=json.dumps(xz(S1)), cps=json.dumps(cps), widths=json.dumps(widths()), medals=json.dumps(MEDALS, separators=(',', ':')).replace('"', ''),
           names='\n'.join(names), pts=pts, br=json.dumps([[round(BR[0] - S0, 1), round(BR[1] - S0, 1)]]))
    path = os.path.join(ROOT, 'js', 'tracks', 'livingstone.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB;', NP, 'points, the race', round(S1 - S0), 'm')

# ---- the scenery data for js/world-livingstone.js (js/data/livingstone.js: var LV_DATA) ----
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

HEAD = """/* Livingstone (theme 'livingstone'): the scenery data for js/world-livingstone.js (metres, origin = the first point of the road (120 m before
   the start line), x east, z south). GENERATED by tools/livingstone/build.py world from tools/livingstone/livingstone.json (tools/proga-podatki.py;
   docs/proge/livingstone.md). dem: the ground (Copernicus DEM GLO-30 less the tree crowns and the buildings; 20 m cells, bytes: lo + v * step m
   above the sea, base: the height of the road's zero (points[0]), World.nrPrep's form); water: the river's lines; lc: the land cover (16 m cells, run-length coded as World.nrPrep reads it: 0 open, 1 forest, 2 scrub, 3 settlement; ESA WorldCover, OSM,
   the canopy); far: the surface (100 m cells, +-12 km, bytes of 2 m); bld: OSM buildings within 60 m [x, z, length, width, angle, height
   (0 unknown), kind: 0 house, 1 church, 2 tower, 3 castle, 4 shed, 5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats]; walls [0 wall,
   1 retaining, 2 hedge, 3 fence, 4 guard rail, [x, z, ...]]; cliffs (the lower side on the right);
   rail [bridge, tunnel, [x, z, ...]]; marks [label, kind, s, d, outline]; trees [x, z, kind]; bridges [s0, s1] (the road on a bridge);
   onRoad [s, kind, x]: OSM's nodes on the lap's own ways (kind 0 a marked pedestrian crossing, x 1 on a primary or secondary road; 1 a stop
   sign, 2 a give-way sign, x the lane the line lies across: 1 the lap's own, -1 the oncoming one). Data: © OpenStreetMap contributors (ODbL 1.0: the
   derived data here under the ODbL 1.0); Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence
   and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and
   World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0). Only geographic and descriptive labels. */
var LV_DATA = """

def on_road():
    """the markings across the road, from OSM's nodes on the lap's own ways (J['onRoad']): [s, kind, x]. kind 0: a marked pedestrian crossing
    (crossing = zebra / uncontrolled; one of unknown marking is left out), x 1 on a primary or secondary road (its stripes longer); kind 1 a
    stop sign, 2 a give-way sign: x the lane the line lies across, 1 the lap's own, -1 the oncoming one (OSM has the sign's place, not its
    direction: the junction it stands at is taken to be the nearer end of the route's way there). Speed bumps are not drawn"""
    ends = sorted(set([round(w[0]) for w in J['ways']] + [round(w[1]) for w in J['ways']])); out = []
    for s, kind, det in J['onRoad']:
        if kind == 'crossing' and det in ('zebra', 'uncontrolled'):
            hw = next((w[3] for w in J['ways'] if w[0] <= s <= w[1]), ''); out.append([s, 0, 1 if hw in ('primary', 'secondary', 'trunk') else 0])
        elif kind in ('stop', 'give_way'):
            ahead = min([e - s for e in ends if e >= s] or [1e9]); behind = min([s - e for e in ends if e < s] or [1e9])
            out.append([s, 1 if kind == 'stop' else 2, 1 if ahead <= behind else -1])
    return out

def build_world():
    P = LINE; M = 700
    x0 = math.floor((P[:, 0].min() - M) / 20) * 20; z0 = math.floor((P[:, 1].min() - M) / 20) * 20
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    # terrain: the ground model in its own 20 m cells (the gorge below the bridge is ~100 m wide), 1 m steps from 755 m above the sea
    gd, ad = grid('dem'); c = 20; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True)
    lo, step = 755.0, 1.0; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=round(H0, 1), noise=0.25, b64=b64bytes(dem))
    # land cover: 16 m cells, World's classes 0 open, 1 forest, 2 scrub (macchia), 3 settlement; from ESA WorldCover, OSM's land use and the canopy
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); c = 16
    lnx = int(math.ceil((x1 - x0) / c)); lnz = int(math.ceil((z1 - z0) / c))
    votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 20) | (lu == 8) | ((wc == 30) & (ch > 1))] = 2
            cls[(wc == 10) | (lu == 9) | (ch > 4)] = 1
            cls[((wc == 50) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            cls[(wc == 80) | (lu == 13) | (lu == 12)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the far land: the surface model (100 m cells, +-12 km), 2 m steps from 700 m above the sea
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).max(axis=(1, 3))   # (200 m cells: the hills' tops kept)
    FAR = dict(x0=gf['x0'], z0=gf['z0'], n=n2, cell=gf['cell'] * 2, lo=700, step=2, b64=b64bytes(np.clip(np.round((fh - 700) / 2), 0, 255)))   # m above the sea
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    data = {
        'dem': D, 'lc': LC, 'far': FAR,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6]] for b in J['bld']],
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'water': [pl(w[3]) for w in J['water'] if w[0] == 'river'],
        'cliffs': [pl(c_) for c_ in J['cliffs']],
        'rail': [[e[1], e[2], pl(e[3])] for e in J['rail'] if e[0] == 'rail'],
        'marks': [[m[0], m[2], m[3], m[4], pl(m[5])] for m in J['landmarks']],
        'trees': [[t[0], t[1], t[2]] for t in J['trees']],
        'bridges': [[round(a_, 1), round(b_, 1)] for a_, b_ in J['bridges']],
        'onRoad': on_road(),
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'livingstone.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, len(LC['rle']), 'chars; classes', np.bincount(lc.ravel(), minlength=4).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
