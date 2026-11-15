# Atimpoku, Ghana: the game's files from the track data (tools/atimpoku/atimpoku.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/atimpoku/build.py track   -> js/tracks/atimpoku.js (centre line, heights, widths, names, the open road's four ways to drive it)
#   python3 -I tools/atimpoku/build.py world   -> js/data/atimpoku.js (the scenery data for js/world-atimpoku.js)
# Edit the track's names, widths, medals and description here, not in the generated files. The track: docs/proge/atimpoku.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'atimpoku.json')))
STEP = J['step']; LINE0 = np.array(J['line']).reshape(-1, 2); H0 = np.array(J['h'])

# ---- the roundabout at Atimpoku: OSM's route turns from the Akosombo road onto the bridge road with a kink (two one-way ways meeting at a
# point); the line between s 2380 and 2490 is replaced by one smooth curve (a cubic Bezier along both tangents, ~20 m radius at its tightest):
# an approximation of the turn round the roundabout's south side. Every s along the line past it is moved by the change of length (smap). ----
RA, RB = 2380.0, 2490.0
def _resample(P, H, step):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; n = int(d[-1] // step) + 1; s = np.arange(n) * step
    return np.c_[np.interp(s, d, P[:, 0]), np.interp(s, d, P[:, 1])], np.interp(s, d, H), d[-1]
def _smooth():
    ia, ib = int(round(RA / STEP)), int(round(RB / STEP))
    p0, p3 = LINE0[ia], LINE0[ib]; t0 = LINE0[ia] - LINE0[ia - 2]; t1 = LINE0[ib + 2] - LINE0[ib]
    t0 = t0 / np.hypot(*t0); t1 = t1 / np.hypot(*t1); k = 0.42 * np.hypot(*(p3 - p0))
    u = np.linspace(0, 1, 201)[1:-1, None]; p1 = p0 + t0 * k; p2 = p3 - t1 * k
    B = (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3
    hb = np.interp(u[:, 0], [0, 1], [H0[ia], H0[ib]])
    P = np.r_[LINE0[:ia + 1], B, LINE0[ib:]]; Hh = np.r_[H0[:ia + 1], hb, H0[ib:]]
    blen = float(np.sum(np.hypot(*np.diff(np.r_[[p0], B, [p3]], axis=0).T)))
    return P, Hh, blen, ia * STEP, ib * STEP
_P, _H, BLEN, RA, RB = _smooth()
LINE, H, L = _resample(_P, _H, STEP); NP = len(LINE)
def smap(s):   # an s of the OSM line (atimpoku.json) -> the s of the smoothed line
    if s <= RA: return s
    if s >= RB: return s - (RB - RA) + BLEN
    return RA + (s - RA) / (RB - RA) * BLEN

def sidx(s): return max(0, min(NP - 1, int(round(s / STEP))))   # (an open road: no wrap)
def xz(s): i = sidx(s); return [round(float(LINE[i, 0]), 1), round(float(LINE[i, 1]), 1)]

S0 = 120.0          # the start line, metres along the road's line (the grid lines up behind it)
S1 = L - 150.0      # the finish line, on the main road up the east bank ~150 m before the line ends (the road past it: a slot for every car of the field, tests/rivals-n.test.js)
def d2s(d): return S0 + d   # metres after the start line -> along the line
WL = 14.6            # the level of the Volta (Kpong lake) at the bridge, m above the sea (the ground model's flat water)

# ---- half widths by road (metres after the start line): the real roads in proportion, widened to race width ----
DB0, DB1 = smap(J['bridges'][0][0]) - S0, smap(J['bridges'][0][1]) - S0   # the Adomi bridge (metres after the start line)
DRA = smap(2353.4) - S0                                                     # the end of the road from the Akosombo side
WIDTHS = [  # [from, to, half width]
    (-S0, DRA, 4.8),           # the road down from the Akosombo side to Atimpoku (2 lanes)
    (DRA, DB0, 5.4),           # round the roundabout onto the main road (2 lanes and shoulders)
    (DB0, DB1, 4.8),           # over the Adomi bridge (2 lanes between the trusses' railings)
    (DB1, S1 - S0, 5.4),       # up the main road on the east bank (2 lanes and shoulders)
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        K.append([round(a + (12 if a > -S0 else 0), 1), hw]); K.append([round(b - (12 if b < S1 - S0 else 0), 1), hw])
    return K

# ---- names on the HUD ({n, d: metres after the start line, say}): places and plain descriptions only (no names of people, events or firms) ----
NAMES = [
    ('Cesta iz Akosomba', 60, ['Down the road from Akosombo!', 'The hills of the Volta all round!']),
    ('Atimpoku', round(DRA) - 260, ['Into Atimpoku, the river just ahead!', 'Through Atimpoku, the bridge is near!']),
    ('Krožišče', round(DRA) + 20, ['Round the roundabout and onto the bridge road!', 'Hard round the roundabout!']),
    ('Most Adomi', round(DB0) + 10, ['Onto the Adomi bridge!', 'The great arch of the Adomi bridge above!']),
    ('Čez Volto', round(DB0) + 180, ['High over the Volta!', 'The river far below, keep it straight!']),
    ('Vzhodni breg', round(DB1) + 60, ['Off the bridge onto the east bank!', 'The east bank, and the bends begin!']),
]
EN_NAMES = {'Cesta iz Akosomba': 'Road from Akosombo', 'Krožišče': 'The Roundabout', 'Most Adomi': 'Adomi Bridge', 'Čez Volto': 'Over the Volta', 'Vzhodni breg': 'East Bank'}

DESC = ('Cesta ob reki Volti v Gani: od strani Akosomba skozi Atimpoku, okoli krožišča in čez viseči most Adomi iz leta 1957 visoko nad Volto, '
        'nato po glavni cesti na vzhodnem bregu. Dirka s tekmeci, vožnja proti uri, dvoboj v prometu ali beg pred policijo.')
DESC_EN = ('A road by the Volta river in Ghana: down from the Akosombo side through Atimpoku, round the roundabout and over the Adomi suspension '
           'bridge of 1957, high above the Volta, then up the main road on the east bank. '
           'A race against rivals, a run against the clock, a duel in the traffic or a run from the police.')
# medal times (s): estimated from Luanda's by length (the medal run of tools/nova-proga.mjs --medalje is still to be made: docs/proge/atimpoku.md)
MEDALS = {'cs': [83, 87, 94], 'wet': {'cs': [95, 100, 108]}, 'winter': {'cs': [93, 97, 105], 'wet': {'cs': [113, 119, 128]}}}

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = LINE
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    luh = ','.join(str(int(round(v * 10))) for v in H)   # every 5 m from points[0], decimetres above the sea
    names = []
    for lab, d, lines in NAMES:
        names.append('      %s,' % json.dumps({'n': lab, 'd': d, 'say': lines}, ensure_ascii=False))
    span = S1 - S0; cps = [xz(d2s(span * k / 5)) for k in range(1, 5)]
    src = '''/* Track definition 'atimpoku'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Atimpoku, Ghana: a road by the Volta river on today's roads (docs/proge/atimpoku.md): down from the Akosombo side through Atimpoku, round
  // the roundabout (the line through it smoothed: tools/atimpoku/build.py) and over the Adomi suspension bridge of 1957 high above the Volta
  // (the steel arch and its deck: the game's model, assets/landmarks/atimpoku.glb, World.znamenitost), then up the main road on the east bank:
  // %(km)s km of racing. One card, four ways to drive it (def.modes). They drive on the right in Ghana.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/atimpoku/config.json); metres, origin = the
  // first point of the road (the start line 120 m on), x east, z south. GENERATED by tools/atimpoku/build.py (edit the names, widths and text there).
  // Heights (AT_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 5 m from
  // points[0], decimetres above the sea. Widths: the real roads in proportion, widened to race width. The names: places and plain descriptions.
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the canopy: Meta and
  // World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const AT_H = [%(luh)s];
  TRACK_DEFS.push({
    look: { fog: 0xcfd9d6, sun: 0xfff0d2, sunI: 1.18, sky: 0x9fc2df, gnd: 0x5c6a3e, hemiI: 0.66, tint: [1.0, 1.02, 0.96], sat: 1.1, sunOff: [55, 80, -50], split: [[0.97, 1.0, 1.05], [1.04, 1.0, 0.95]] },   // Atimpoku: a humid hazy afternoon over the green hills of the Volta, the sun high in the north
    say: 'Atimpoku',
    zivali: { a: ['egret'], t: ['palmHut'], city: true },
    id: 'atimpoku', name: 'Atimpoku, Gana', theme: 'atimpoku', open: true, modes: ['race', 'tt', 'traffic', 'police'], laps: 1,
    maxRivals: 60,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the ~130 m of road past the line, two rows a side
    halfWidth: 5.4,
    desc: %(desc)s,
    en: { name: 'Atimpoku, Ghana', desc: %(desc_en)s, escTo: 'To the east bank' },
    realKm: %(km)s, alt: [%(a0)s, %(a1)s],
    start: %(start)s, finish: %(finish)s, cps: %(cps)s,
    runoff: 0.55, inner: 3.0, side: 3.4, noCurbs: true, noGravel: true, offSurface: 'gravel', gradeForce: true, elevSmooth: 20,
    elev: AT_H.map((h, i) => [i / (AT_H.length - 1), h / 10]),
    widths: %(widths)s,
    // medal times of the time trial (s), dry and in the rain, in summer and in winter (cs: Circuit Superstars physics); estimated, docs/proge/atimpoku.md
    medals: %(medals)s,
    // the traffic of the open road (the duel, the run from the police): the share of each kind of vehicle [car, van, bus, motorbike, truck], a cyclist every so many metres each way
    traffic: { mix: [0.5, 0.2, 0.14, 0.08, 0.08], bike: 3000 },
    police: { label: 'POLICE', band: '#1c2f6b', text: '#ffffff' }, escTo: 'Na vzhodni breg',
    // named places ({ n: HUD label, d: metres after the start line, say: the commentator's lines })
    names: [
%(names)s
    ],
    // the commentator's own lines on this road
    comm: {
      introPass: ["Welcome to {track}! {cars} cars, the Volta and the great bridge over it, and you start {grid}.", "Here we are above the Volta. A race through Atimpoku and over the Adomi bridge, and you line up {grid}."],
      goPass: ["And away they go down to the river!", "And they're off! Next stop, the bridge!", "The race is on! Over the Volta to the east bank!"],
      introPassTT: ["Welcome to {track}! Just you, the river and the clock.", "Here we are above the Volta. {cps} checkpoints between you and the east bank."],
      goPassTT: ["Green light! The clock is running!", "Go! Down to the bridge and over the river!"],
      introTraffic: ["Welcome to {track}, and the road is open today! Just you and {rival}, first over the river wins!", "Here we are above the Volta. A duel with {rival} through the traffic. Keep right!"],
      introPolice: ["Welcome to {track}! The police want a word with you, and they are right behind. Get over the river without getting caught!", "Here we are above the Volta, and the lights are already flashing. Do not stop!"],
      escaped: ["You made it to the east bank! The police will have to wait for another day!", "Escaped! Over the bridge and away!"],
      summitRecord: ["At the finish! A new personal best, {time}!", "Record run! {time} over the Volta!"],
      summitEven: ["At the finish in {time}. That is your record to the thousandth!", "{time}, dead level with your best!"],
      summit: ["At the finish in {time}, {delta} seconds off your best.", "Across the line on the east bank. {time}, just {delta} short of the record."],
    },
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % ((S1 - S0) / 1000), luh=luh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), a0=int(round(H[sidx(S0)])), a1=int(round(H[sidx(S1)])),
           start=json.dumps(xz(S0)), finish=json.dumps(xz(S1)), cps=json.dumps(cps), widths=json.dumps(widths()), medals=json.dumps(MEDALS, separators=(',', ':')).replace('"', ''),
           names='\n'.join(names), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'atimpoku.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB;', NP, 'points, the race', round(S1 - S0), 'm')

# ---- the scenery data for js/world-atimpoku.js (js/data/atimpoku.js: var AT_DATA) ----
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

HEAD = """/* Atimpoku (theme 'atimpoku'): the scenery data for js/world-atimpoku.js (metres, origin = the first point of the road (120 m before the start
   line), x east, z south). GENERATED by tools/atimpoku/build.py world from tools/atimpoku/atimpoku.json (tools/proga-podatki.py; docs/proge/atimpoku.md).
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
var AT_DATA = """

def on_road():
    """the markings across the road, from OSM's nodes on the lap's own ways (J['onRoad']): [s, kind, x]. kind 0: a marked pedestrian crossing
    (crossing = zebra / uncontrolled; one of unknown marking is left out), x 1 on a primary or secondary road (its stripes longer); kind 1 a
    stop sign, 2 a give-way sign: x the lane the line lies across, 1 the lap's own, -1 the oncoming one (OSM has the sign's place, not its
    direction: the junction it stands at is taken to be the nearer end of the route's way there). Speed bumps are not drawn"""
    ends = sorted(set([round(smap(w[0])) for w in J['ways']] + [round(smap(w[1])) for w in J['ways']])); out = []
    for s, kind, det in J['onRoad']:
        s = round(smap(s), 1)
        if kind == 'crossing' and det in ('zebra', 'uncontrolled'):
            hw = next((w[3] for w in J['ways'] if smap(w[0]) <= s <= smap(w[1])), ''); out.append([s, 0, 1 if hw in ('primary', 'secondary', 'trunk') else 0])
        elif kind in ('stop', 'give_way'):
            ahead = min([e - s for e in ends if e >= s] or [1e9]); behind = min([s - e for e in ends if e < s] or [1e9])
            out.append([s, 1 if kind == 'stop' else 2, 1 if ahead <= behind else -1])
    return out

def build_world():
    P = LINE; M = 800
    x0 = math.floor((P[:, 0].min() - M) / 32) * 32; z0 = math.floor((P[:, 1].min() - M) / 32) * 32
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    # terrain: the ground model (20 m) resampled to 32 m cells, 1.5 m steps from 0 m (the river's bed is the builder's: P.pad)
    gd, ad = grid('dem'); c = 32; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True)
    lo, step = 0.0, 1.5; dem = np.clip(np.round((hv - lo) / step), 0, 255)
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
    # the river (the Volta's Kpong lake: a flat level, WL): water where WorldCover or OSM has it or the ground model is at the water's level
    # (the bridge's shadow and deck closed over), as a signed distance to its edge (32 m cells, bytes of 2 m from -128 m: < 0 in the water)
    X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5) * c, z0 + (np.arange(lnz) + 0.5) * c)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); hd = sample(gd, ad, X, Z, True)
    wet = (hd <= WL + 0.4) | (((wc == 80) | (lu == 13)) & (hd <= WL + 3))
    wet = ndimage.binary_closing(wet, np.ones((5, 5)), iterations=2); wet = ndimage.binary_opening(wet, np.ones((3, 3)))
    lab, nl = ndimage.label(wet); sizes = ndimage.sum(wet, lab, range(1, nl + 1))
    wet = np.isin(lab, 1 + np.flatnonzero(sizes >= 40))   # (the river, not the puddles of the model)
    dist = ndimage.distance_transform_edt(~wet) * c - ndimage.distance_transform_edt(wet) * c
    dist = dist[::2, ::2]   # (every other cell: 32 m cells centred on the 16 m cells' centres)
    WD = dict(x0=x0 - 8, z0=z0 - 8, nx=dist.shape[1], nz=dist.shape[0], cell=2 * c, lo=-128, step=2, level=WL, b64=b64bytes(np.clip(np.round((dist + 128) / 2), 0, 255)))
    lc[wet] = 0
    LC['rle'] = rle_lc(lc)
    # the far land: the surface model (100 m cells, +-12 km), 2 m steps
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).max(axis=(1, 3))   # (200 m cells: the hills' tops kept)
    FAR = dict(x0=gf['x0'], z0=gf['z0'], n=n2, cell=gf['cell'] * 2, lo=0, step=2, b64=b64bytes(np.clip(np.round(fh / 2), 0, 255)))
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    data = {
        'dem': D, 'lc': LC, 'far': FAR, 'water': WD,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6]] for b in J['bld']],
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'coast': [pl(c_) for c_ in J['coast']],
        'cliffs': [pl(c_) for c_ in J['cliffs']],
        'rail': [[e[1], e[2], pl(e[3])] for e in J['rail'] if e[0] == 'rail'],
        'marks': [[m[0], m[2], round(smap(m[3]), 1), m[4], pl(m[5])] for m in J['landmarks']],
        'trees': [[t[0], t[1], t[2]] for t in J['trees']],
        'bridges': [[round(smap(a_), 1), round(smap(b_), 1)] for a_, b_ in J['bridges']],
        'onRoad': on_road(),
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'atimpoku.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, len(LC['rle']), 'chars; classes', np.bincount(lc.ravel(), minlength=4).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
