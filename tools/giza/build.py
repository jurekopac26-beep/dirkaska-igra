# Giza, Egipt: the game's files from the track data (tools/giza/giza.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/giza/build.py track   -> js/tracks/giza.js (centre line, heights, widths, names, the open road's four ways to drive it)
#   python3 -I tools/giza/build.py world   -> js/data/giza.js (the scenery data for js/world-giza.js)
# Edit the track's names, widths, medals and description here, not in the generated files. The track: docs/proge/giza.md (v6; decision O-28-33: the sand right by the road, no fences the sources do not show).
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'giza.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); L = J['length']; NP = len(LINE)

def sidx(s): return max(0, min(NP - 1, int(round(s / STEP))))   # (an open road: no wrap)
def xz(s): i = sidx(s); return [round(float(LINE[i, 0]), 1), round(float(LINE[i, 1]), 1)]

S0 = 247.0          # the start line, metres along the road's line: on the plateau road by the Sphinx, westbound (the run-up from the south rolls up behind it)
S1 = L - 150.0      # the finish line, at the main road ~150 m before the end of the line (the road past it: a slot for every car of the field, tests/rivals-n.test.js)
def d2s(d): return S0 + d   # metres after the start line -> along the line

# ---- half widths by road (metres after the start line): the real roads in proportion, widened to race width ----
WIDTHS = [  # [from, to, half width]
    (-S0, 3895, 4.5),      # the plateau's roads: past the Sphinx, round the pyramids, up to the viewpoint and down (paved service roads, 2 lanes)
    (3895, 5763, 5.5),     # the desert road (2 lanes and a hard shoulder of sand)
    (5763, 6518, 4.8),     # the link road across the sand
    (6518, 7902, 5.5),     # the desert road on towards the town
    (7902, 9435, 4.6),     # through the town's streets (2 lanes between the houses)
    (9435, S1 - S0, 5.4),  # out to the main road
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        K.append([round(a + (12 if a > -S0 else 0), 1), hw]); K.append([round(b - (12 if b < S1 - S0 else 0), 1), hw])
    return K
# the barriers (core.js _buildEdges): out in the sand on the plateau and the desert road (nothing along the road there: decision O-28-33),
# pulled in to the houses in the town (def.walls: [from, to, side, metres past the road edge])
TOWN = (7902, S1 - S0)

# ---- names on the HUD ({n, d: metres after the start line, say}): places and plain descriptions only (no names of people, events or firms) ----
NAMES = [
    ('Sfinga', 100, ['The Sphinx on your left, look at it!', 'Past the Sphinx and up onto the plateau!']),
    ('Piramide', 600, ['The great pyramids right beside you!', 'Between the pyramids, four and a half thousand years of them!']),
    ('Pod tretjo piramido', 1750, ['The smallest of the three on your left!', 'Round the third pyramid, out to the sand!']),
    ('Razgledišče', 2650, ['Up to the viewpoint, all three pyramids in a row!', 'The top of the plateau, mind the hairpin!']),
    ('Puščavska cesta', 4050, ['Down onto the desert road, flat out across the sand!', 'Nothing but sand on both sides!']),
    ('Mesto', 7900, ['Into the town, the streets close in!', 'Between the houses, keep it tidy!']),
    ('Do glavne ceste', 9450, ['Out to the main road, nearly home!', 'The last of the town, the finish ahead!']),
]
EN_NAMES = {'Sfinga': 'The Sphinx', 'Piramide': 'The Pyramids', 'Pod tretjo piramido': 'Below the Third Pyramid', 'Razgledišče': 'The Viewpoint',
            'Puščavska cesta': 'The Desert Road', 'Mesto': 'The Town', 'Do glavne ceste': 'To the Main Road'}

DESC = ('Proga v Gizi v Egiptu: od Sfinge na planoto mimo vseh treh piramid, na razgledišče nad puščavo, po puščavski cesti čez pesek in skozi '
        'mestne ulice do glavne ceste. Ob cesti pesek, kot v resnici. Dirka s tekmeci, vožnja proti uri, dvoboj v prometu ali beg pred policijo.')
DESC_EN = ('A course at Giza, Egypt: from the Sphinx up onto the plateau past all three pyramids, to the viewpoint above the desert, along the desert road '
           'across the sand and through the town streets to the main road. Sand by the road, as it really is. '
           'A race against rivals, a run against the clock, a duel in the traffic or a run from the police.')
# medal times (s): the stock rally car on the autopilot x 1.01, 1.06, 1.14 (the medal run of tools/nova-proga.mjs --medalje)
MEDALS = {'cs': [267, 280, 301], 'wet': {'cs': [309, 324, 349]}, 'winter': {'cs': [302, 317, 341], 'wet': {'cs': [361, 379, 408]}}}

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = LINE
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    luh = ','.join(str(int(round(v * 10))) for v in H)   # every 5 m from points[0], decimetres above the sea
    names = []
    for lab, d, lines in NAMES:
        names.append('      %s,' % json.dumps({'n': lab, 'd': d, 'say': lines}, ensure_ascii=False))
    span = S1 - S0; cps = [xz(d2s(span * k / 5)) for k in range(1, 5)]
    src = '''/* Track definition 'giza'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Giza, Egipt: a course on today's roads (docs/proge/giza.md, v6): from the plateau road by the Sphinx up past the three pyramids (stone
  // frustums on their OSM outlines, the Sphinx in blocks: js/world-giza.js), round the third one to the viewpoint at the top of the plateau and its hairpin, down
  // to the desert road across the sand, and through the town's streets to the main road: %(km)s km of racing. Sand right by the road on the
  // plateau and in the desert, as it really is (decision O-28-33: the barriers out in the sand, no fences the sources do not show).
  // One card, four ways to drive it (def.modes). They drive on the right in Egypt.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/giza/config.json); metres, origin = the
  // first point of the road (the start line 247 m on), x east, z south. GENERATED by tools/giza/build.py (edit the names, widths and text there).
  // Heights (GZ_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 5 m from
  // points[0], decimetres above the sea. Widths: the real roads in proportion, widened to race width. The names: places and plain descriptions.
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the canopy: Meta and
  // World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const GZ_H = [%(luh)s];
  TRACK_DEFS.push({
    look: { fog: 0xe8dcc2, sun: 0xfff2d6, sunI: 1.32, sky: 0xa9c6df, gnd: 0xb09268, hemiI: 0.62, tint: [1.06, 1.0, 0.92], sat: 1.0, sunOff: [-60, 80, 50], split: [[0.97, 1.0, 1.05], [1.06, 1.0, 0.92]] },   // Giza: a clear dry afternoon over the desert, a pale dusty haze, the sun in the south-west
    say: 'Giza',
    zivali: { a: ['camel', 'donkey'], city: true },
    id: 'giza', name: 'Giza, Egipt', theme: 'giza', open: true, modes: ['race', 'tt', 'traffic', 'police'], laps: 1,
    maxRivals: 60,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the ~150 m of road past the line, two rows a side
    halfWidth: 4.8,
    desc: %(desc)s,
    en: { name: 'Giza, Egypt', desc: %(desc_en)s, escTo: 'To the main road' },
    realKm: %(km)s, alt: [%(a0)s, %(a1)s],
    start: %(start)s, finish: %(finish)s, cps: %(cps)s,
    runoff: 1.0, inner: 7.0, side: 8.0, noCurbs: true, noGravel: true, offSurface: 'gravel', gradeForce: true, elevSmooth: 20,
    walls: %(walls)s,   // in the town the houses close in (metres after the start line, side, metres past the road edge)
    elev: GZ_H.map((h, i) => [i / (GZ_H.length - 1), h / 10]),
    widths: %(widths)s,
    // medal times of the time trial (s), dry and in the rain, in summer and in winter: the stock rally car on the autopilot x 1.01 (gold), 1.06 (silver), 1.14 (bronze) (cs: Circuit Superstars physics)
    medals: %(medals)s,
    // the traffic of the open road (the duel, the run from the police): the share of each kind of vehicle [car, van, bus, motorbike, truck], a cyclist every so many metres each way
    traffic: { mix: [0.58, 0.2, 0.12, 0.06, 0.04], bike: 4000 },
    police: { label: 'POLICE', band: '#1d3f8a', text: '#ffffff' }, escTo: 'Do glavne ceste',
    // named places ({ n: HUD label, d: metres after the start line, say: the commentator's lines })
    names: [
%(names)s
    ],
    // the commentator's own lines on this road
    comm: {
      introPass: ["Welcome to {track}! {cars} cars, the pyramids, the desert and the town, and you start {grid}.", "Here we are by the Sphinx, the pyramids up ahead. A long race to the main road, and you line up {grid}."],
      goPass: ["And away they go, up onto the plateau!", "And they're off! The pyramids dead ahead!", "The race is on! Past the pyramids and out into the desert!"],
      introPassTT: ["Welcome to {track}! Just you, the pyramids and the clock.", "Here we are by the Sphinx. {cps} checkpoints between you and the main road."],
      goPassTT: ["Green light! The clock is running!", "Go! Up past the pyramids and across the sand!"],
      introTraffic: ["Welcome to {track}, and the road is open today! Just you and {rival}, first to the main road wins!", "Here we are by the Sphinx. A duel with {rival} across the desert and through the town. Keep right!"],
      introPolice: ["Welcome to {track}! The police want a word with you, and they are right behind. Get to the main road without getting caught!", "Here we are by the Sphinx, and the lights are already flashing. Do not stop!"],
      escaped: ["You made it to the main road! The police will have to wait for another day!", "Escaped! Past the pyramids and away!"],
      summitRecord: ["At the finish! A new personal best, {time}!", "Record run! {time} from the Sphinx to the main road!"],
      summitEven: ["At the finish in {time}. That is your record to the thousandth!", "{time}, dead level with your best!"],
      summit: ["At the finish in {time}, {delta} seconds off your best.", "Across the line at the main road. {time}, just {delta} short of the record."],
    },
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % ((S1 - S0) / 1000), luh=luh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), a0=int(round(H[sidx(S0)])), a1=int(round(H[sidx(S1)])),
           start=json.dumps(xz(S0)), finish=json.dumps(xz(S1)), cps=json.dumps(cps), widths=json.dumps(widths()), medals=json.dumps(MEDALS, separators=(',', ':')).replace('"', ''), walls=json.dumps([[TOWN[0], round(TOWN[1], 1), -1, 3.4], [TOWN[0], round(TOWN[1], 1), 1, 3.4]]),
           names='\n'.join(names), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'giza.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB;', NP, 'points, the race', round(S1 - S0), 'm')

# ---- the scenery data for js/world-giza.js (js/data/giza.js: var GZ_DATA) ----
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

HEAD = """/* Giza (theme 'giza'): the scenery data for js/world-giza.js (metres, origin = the first point of the road (247 m before the start
   line), x east, z south). GENERATED by tools/giza/build.py world from tools/giza/giza.json (tools/proga-podatki.py; docs/proge/giza.md).
   dem: the ground (Copernicus DEM GLO-30 less the tree crowns and the buildings; 32 m cells, bytes: lo + v * step m above the sea, World.nrPrep's
   form); lc: the land cover (16 m cells, run-length coded as World.nrPrep reads it: 0 open, 1 forest, 2 scrub, 3 settlement; ESA WorldCover, OSM,
   the canopy); far: the surface (100 m cells, +-12 km, bytes of 2 m); bld: OSM buildings within 60 m [x, z, length, width, angle, height
   (0 unknown), kind: 0 house, 1 church, 2 tower, 3 castle, 4 shed, 5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats]; walls [0 wall,
   1 retaining, 2 hedge, 3 fence, 4 guard rail, [x, z, ...]]; coast (the land on the left of each line); cliffs (the lower side on the right);
   rail [bridge, tunnel, [x, z, ...]]; marks [label, kind, s, d, outline]; trees [x, z, kind]; bridges [s0, s1] (the road on a bridge);
   onRoad [s, kind, x]: OSM's nodes on the lap's own ways (kind 0 a marked pedestrian crossing, x 1 on a primary or secondary road; 1 a stop
   sign, 2 a give-way sign, x the lane the line lies across: 1 the lap's own, -1 the oncoming one). Data: © OpenStreetMap contributors (ODbL 1.0: the
   derived data here under the ODbL 1.0); Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence
   and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and
   World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0). Only geographic and descriptive labels. */
var GZ_DATA = """

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
    P = LINE; M = 800
    x0 = math.floor((P[:, 0].min() - M) / 32) * 32; z0 = math.floor((P[:, 1].min() - M) / 32) * 32
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    # terrain: the ground model (20 m) resampled to 32 m cells, 1.5 m steps from -1.5 m (the sea's floor is the builder's)
    gd, ad = grid('dem'); c = 32; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True)
    lo, step = -1.5, 1.5; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.25, b64=b64bytes(dem))
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
    # the far land: the surface model (100 m cells, +-12 km), 2 m steps
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).max(axis=(1, 3))   # (200 m cells: the hills' tops kept)
    FAR = dict(x0=gf['x0'], z0=gf['z0'], n=n2, cell=gf['cell'] * 2, lo=0, step=2, b64=b64bytes(np.clip(np.round(fh / 2), 0, 255)))
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    data = {
        'dem': D, 'lc': LC, 'far': FAR,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6]] for b in J['bld']],
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'coast': [pl(c_) for c_ in J['coast']],
        'cliffs': [pl(c_) for c_ in J['cliffs']],
        'rail': [[e[1], e[2], pl(e[3])] for e in J['rail'] if e[0] == 'rail'],
        'marks': [[m[0], m[2], m[3], m[4], pl(m[5])] for m in J['landmarks']],
        'trees': [[t[0], t[1], t[2]] for t in J['trees']],
        'bridges': [[round(a_, 1), round(b_, 1)] for a_, b_ in J['bridges']],
        'onRoad': on_road(),
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'giza.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, len(LC['rle']), 'chars; classes', np.bincount(lc.ravel(), minlength=4).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
