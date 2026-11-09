# Seul, Južna Koreja: the game's files from the track data (tools/seoul/seoul.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/seoul/build.py track   -> js/tracks/seoul.js (centre line, heights, widths, names, the commentator)
#   python3 -I tools/seoul/build.py world   -> js/data/seoul.js (the scenery data for js/world-seoul.js)
# Edit the track's names, widths and description here, not in the generated files. Description of the track: docs/proge/seoul.md; the plan:
# docs/nove-proge-1-0.md (Del 2, B11).
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'seoul.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); HT = np.array(J['h'], float); L = J['length']; NP = len(LINE)

# ---- the tool's frame (tools/proga-podatki.py, Frame): metres from the tool's first point, x east, z south (WGS84 radii at lat0) ----
A_WGS, F_WGS = 6378137.0, 1 / 298.257223563
E2 = F_WGS * (2 - F_WGS)
def ll_xz(lat, lon):
    s = math.sin(math.radians(J['lat0'])); w = 1 - E2 * s * s; M = A_WGS * (1 - E2) / w ** 1.5; Nr = A_WGS / math.sqrt(w)
    return math.radians(lon - J['lon0']) * Nr * math.cos(math.radians(J['lat0'])), -math.radians(lat - J['lat0']) * M
def s_of(lat, lon):
    x, z = ll_xz(lat, lon); return float(np.argmin(np.hypot(LINE[:, 0] - x, LINE[:, 1] - z))) * STEP

# the start line on the south circular road and the finish line on Sowol-ro 3-gil (OSM's nodes of tools/seoul/config.json); the road before the
# start (the grid) and after the finish (the cars past the line) is the same one-way road, ~245 m and ~237 m
S0 = s_of(37.5451355, 126.9959928); S1 = s_of(37.5533420, 126.9793610)
def sidx(s): return int(min(NP - 1, max(0, round(s / STEP))))
def xz(s): i = sidx(s); return [round(float(LINE[i, 0]), 1), round(float(LINE[i, 1]), 1)]

def curv(P):
    a = np.vstack([P[:1], P[:-1]]); b = np.vstack([P[1:], P[-1:]])
    d1 = (b - a) / 2; d2 = b - 2 * P + a
    return (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.maximum(np.hypot(d1[:, 0], d1[:, 1]) ** 3, 1e-9)

# ---- heights: the tool's (the ground model across the road, the canopy and the buildings taken out, smoothed, grades at most 12 %);
#      metres above the sea, every 10 m of the road from its first point ----
def game_heights():
    s = np.arange(NP) * STEP; u = np.arange(0, L + 1e-6, 10.0)
    return np.interp(u, s, ndimage.gaussian_filter1d(HT, 1.5, mode='nearest'))

# ---- half widths by road (metres on the tool's line): the bus roads of the park two lanes wide, widened a little to race width; Sowol-ro's
#      four lanes; its side street to the line ----
WIDTHS = [  # [from, to, half width] in metres from the road's first point (the tool's s: OSM's ways in seoul.json)
    (0, 1161, 4.6),        # the south circular road (남산남측순환로): the run-up, the pine wood, the city wall, up to the bus stops at the top
    (1161, 2428, 4.4),     # the park road (남산공원길) past the tower and down the west side
    (2428, 2651, 6.2),     # Sowol-ro (4 lanes one way)
    (2651, 1e9, 5.0),      # its side street to the line (소월로3길) and the road past it
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        b = min(b, L); a2 = a + (15 if a > 0 else 0); b2 = b - (15 if b < L else 0)
        K.append([round(a2 - S0, 1), hw]); K.append([round(b2 - S0, 1), hw])   # (def.widths: metres after the start line, the run-up before it negative)
    return K

# ---- names on the HUD ({n: label, d: metres after the start line, say}): geographic and plain descriptions only (docs/nove-proge-1-0.md,
#      Pravna varnost: the road and the park named after the poet without a name, the tower without its name). English: js/lang.js ----
def h_at(d): return int(round(float(np.interp(S0 + d, np.arange(NP) * STEP, HT))))
NAMES = [
    ('Borov gozd', 45, ['Into the pine wood!', 'Up through the pines of Namsan!']),
    ('Razgledišče', 290, ['Past the viewpoint, the whole city on the left!', 'The viewpoint, and Seoul spread out below!']),
    ('Mestno obzidje', 575, ['Through the gap in the old city wall!', 'Along the old city wall now!']),
    ('Namsan', None, ['Over the top of Namsan!', 'The top of the hill, and down the other side!']),
    ('Pod stolpom', 1112, ['Under the tower on the summit!', 'Past the tower, flat out!']),
    ('Dvojni desni', 1425, ['Two rights through the woods!', 'Double right, hard on the brakes!']),
    ('V mesto', 2183, ['Out of the park and into the city!', 'Onto the city street, the line is close!']),
    ('Huam-dong', None, ['Into Huam-dong and the line!', 'Down among the houses, and the line!']),
]

DESC = ('Mestna proga čez hrib Namsan sredi Seula: 2,5 km enosmernih parkovnih cest od južnega pobočja skozi borov gozd, mimo razgledišča '
        'nad mestom in skozi vrzel v starem mestnem obzidju, ob obzidju na vrh pod stolpom, nato po zahodnem pobočju navzdol in po mestni '
        'ulici do cilja v Huam-dongu. Ograje ulične dirke, mesto in reka Han v daljavi.')
DESC_EN = ('A city track over Namsan hill in the middle of Seoul: 2.5 km of one-way park roads from the south slope through the pine wood, past '
           'the viewpoint over the city and through a gap in the old city wall, along the wall to the top below the tower, then down the west '
           'slope and along a city street to the line in Huam-dong. Street-race barriers, the city and the Han River in the distance.')

# medal times of the time trial (s): the stock rally car on the autopilot x 1.01, 1.06, 1.14 (as tools/nova-proga.mjs --medalje), dry and wet
MEDALS = {'cs': [75, 79, 85], 'wet': {'cs': [82, 86, 92]}}   # the stock rally car on the autopilot (74.2 s, in the rain 81.1 s) x 1.01, 1.06, 1.14 (as tools/nova-proga.mjs --medalje)

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = LINE; n = NP; hk = game_heights()
    k = curv(P); print('line %.1f m, %d points, tightest radius %.1f m; start s %.0f, finish s %.0f (race %.0f m)' % (L, n, 1 / np.abs(k).max(), S0, S1, S1 - S0))
    top = float(np.argmax(HT)) * STEP
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    hs = ','.join(str(int(round(v * 10))) for v in hk)
    names = []
    for lab, d, lines in NAMES:
        if lab == 'Namsan': d = round(top - S0)
        if lab == 'Huam-dong': d = round(S1 - S0) - 60   # (on the side street, short of the line: the HUD shows the places before it)
        names.append('      {"n": %s, "d": %s, "say": %s},' % (json.dumps('%s · %d m' % (lab, h_at(d)), ensure_ascii=False), f1(d), json.dumps(lines)))
    alt = [h_at(0), h_at(S1 - S0)]
    cps = []   # the checkpoints of the time trial: near each fifth of the race, on a straighter bit (as tools/proga/proga.py)
    for f in (0.2, 0.4, 0.6, 0.8):
        t = S0 + f * (S1 - S0); cand = [i for i in range(n) if abs(i * STEP - t) < 120]; best = min(cand, key=lambda i: abs(k[i]) * 400 + abs(i * STEP - t) / 60)
        cps.append(xz(best * STEP))
    src = '''/* Track definition 'seoul'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Seoul, South Korea: a city track over Namsan, the wooded hill in the middle of the city (docs/proge/seoul.md): %(km)s km of the park's
  // one-way bus roads in their one-way direction, from the south slope (~%(a0)s m) up through the pine wood, past the viewpoint over the city
  // and through the gap in the old city wall, along the wall to the top (~%(atop)s m) below the tower on the summit, then down the west slope
  // through the woods and along Sowol-ro and its side street to the line in Huam-dong (~%(a1)s m). Closed for the race and lined with the
  // barriers of a street race (concrete blocks and catch fences); the tower, the pavilions, the school, the libraries and the houses generic
  // (no names, signs or brands; the road and the park named after the poet without a name, the statue and the poem stone without words).
  // One card, four ways to drive it (def.modes), as Bâlea: a race over the closed road, a time trial, a duel in the traffic of the open road
  // (def.traffic) and a run from the police (generic patrol cars: def.police).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/seoul/config.json): every 5 m from ~245 m
  // before the start line to ~237 m past the finish (the grid and the cars after the line); metres, origin = the tool's first point (the
  // south circular road below the start), x east, z south. GENERATED by tools/seoul/build.py (edit the names, widths and text there).
  // Heights (SE_H): the ground model under the road (Copernicus DEM GLO-30 less the canopy and the buildings, smoothed, grades at most 12 %%),
  // metres above the sea, every 10 m of the road from its first point, decimetres. Data: the OSM-derived data in this file under the ODbL 1.0.
  const SE_H = [%(hs)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc9d3dc, sun: 0xfff1de, sunI: 1.08, sky: 0xa9c3dc, gnd: 0x4d5f3e, hemiI: 0.64, tint: [1.0, 1.0, 1.01], sat: 1.04, sunOff: [-52, 86, 72], split: [[0.96, 0.99, 1.05], [1.03, 1.0, 0.96]] },   // Seoul: a clear spring afternoon, the city's haze in the distance, the sun from the south-west
    say: 'Seoul',
    id: 'seoul', name: 'Seul, Južna Koreja', theme: 'seoul', open: true, modes: ['race', 'tt', 'traffic', 'police'], laps: 1, halfWidth: 4.6,
    maxRivals: 60,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the grid on the road before the line
    desc: %(desc)s,
    en: { name: 'Seoul, South Korea', desc: %(desc_en)s },
    runoff: 0.3, inner: 1.6, side: 1.6, offSurface: 'paving', noCurbs: true, noGravel: true, runoffTarmac: true, gradeForce: true, elevSmooth: 8, noBirds: true,
    elev: SE_H.map((h, i) => [i / (SE_H.length - 1), h / 10]),
    widths: %(widths)s,
    // medal times of the time trial (s), dry and in the rain: the stock rally car on the autopilot x 1.01 (gold), 1.06 (silver), 1.14 (bronze) (cs: Circuit Superstars physics)
    medals: { cs: %(mcs)s, wet: { cs: %(mwet)s } },
    // the traffic of the open road (the duel, the run from the police): [car, van, bus, motorbike, truck] and a cyclist every so many metres each way; the park's
    // roads are the buses' (the city's green buses up to the tower), the taxis and the tourists' cars, the delivery vans and scooters below in the town
    traffic: { mix: [0.56, 0.14, 0.2, 0.08, 0.02], bike: 5200 },
    // the police of the run (their patrol cars: the label on the band along both sides, its colour, the text's): generic, no agency's name or badge
    police: { label: 'POLICE', band: '#1d4fa0', text: '#f4f6fa' }, escTo: 'V mesto',   // (and the results of an escape: 'V mesto v ...')
    // named places ({ n: HUD label, d: metres after the start line, say: the commentator's lines }; the HUD's English: js/lang.js, Lang.place)
    names: [
%(names)s
    ],
    // the commentator's own lines on this road (Comm: instead of Vršič's)
    comm: {
      introPass: ["Welcome to {track}! {cars} cars, two and a half kilometres over Namsan, right in the middle of the city, and you start {grid}.", "Here we are on Namsan, the city all around us. A race over the hill, and you line up {grid}.", "Welcome to Seoul! {cars} cars, up through the woods and down into the city. You start {grid}."],
      goPass: ["And away they go, up into the pines!", "And they're off! Up to the tower!", "The race is on! Over the hill and into the city!"],
      introPassTT: ["Welcome to {track}! Over Namsan and down into the city, just you and the clock.", "Here we are below the pines of Namsan. {cps} checkpoints between you and the line.", "Welcome to {track}! No rivals this time, only the clock and the hill."],
      goPassTT: ["Green light! The clock is running!", "Go! Up to the tower!", "And you're away! Over the hill!"],
      introTraffic: ["Welcome to {track}, and the park roads are open today: buses, taxis and vans. Just you and {rival}, first down into the city wins!", "Here we are on Namsan. A duel with {rival} through the traffic. Mind the buses at the top!"],
      introPolice: ["Welcome to {track}! The police want a word with you, and they are right behind. Over the hill and lose them in the city!", "Here we are on Namsan, and the lights are already flashing. Two and a half kilometres to the city. Do not stop!"],
      escaped: ["You made it into the city! The police will have to wait for another day!", "Escaped! Over the hill and gone into the streets!"],
      summitRecord: ["In Huam-dong! A new personal best, {time}!", "Record run! {time} over Namsan!", "What a run! New personal best, {time}!"],
      summitEven: ["At the line in {time}. That is your record to the thousandth!", "{time} at the line, dead level with your best!"],
      summit: ["At the line in {time}, {delta} seconds off your best.", "Across the line in Huam-dong. {time}, just {delta} short of the record.", "That's Namsan. {time}. {delta} seconds to find next time."],
    },
    start: %(start)s,
    cps: %(cps)s,
    alt: %(alt)s,
    realKm: %(km)s,
    finish: %(finish)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % ((S1 - S0) / 1000), a0=alt[0], a1=alt[1], atop=int(round(HT.max())), hs=hs, desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN), widths=json.dumps(widths()), names='\n'.join(names), pts=pts, start=json.dumps(xz(S0)), finish=json.dumps(xz(S1)),
           alt=json.dumps(alt), cps=json.dumps(cps), mcs=json.dumps(MEDALS['cs']), mwet=json.dumps(MEDALS['wet']['cs']))
    path = os.path.join(ROOT, 'js', 'tracks', 'seoul.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB; heights %.1f-%.1f m above the sea; names %s' % (hk.min(), hk.max(), [nm.split('"n": ')[1].split(',')[0] for nm in names]))

# ---- the scenery data for js/world-seoul.js (js/data/seoul.js: var SE_DATA) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
    gx = (X - g['x0']) / g['cell'] - 0.5; gz = (Z - g['z0']) / g['cell'] - 0.5
    v = ndimage.map_coordinates(a.astype(np.float32), [gz, gx], order=1 if heights else 0, mode='nearest')
    return v / 10.0 - 100.0 if heights else v

def rle_lc(c):
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

# the point features of OSM by the road (nodes: the tool takes landmarks from ways and relations only): [kind, lat, lon]; generic shapes in the
# world, no words: the viewpoints' decks, the poem stone (no inscription), the statue (a figure on a plinth, no name), the shelters
POINTS = [
    ('viewpoint', 37.5467459, 126.9934040),   # n11347760069, the lookout over Itaewon
    ('viewpoint', 37.5510820, 126.9905000),   # n14322799828, the lookout over the city at night
    ('viewpoint', 37.5523690, 126.9819000),   # n13824139901, above Sowol-ro
    ('stone', 37.5524940, 126.9832020),       # n14096241505, the poem stone
    ('statue', 37.5521460, 126.9817300),      # n9653155799, the statue
    ('shelter', 37.5522950, 126.9815260),     # n13948963801
]

HEAD = """/* Seoul (theme 'seoul'): the scenery data for js/world-seoul.js (metres, origin = the tool's first point, x east, z south). GENERATED by
   tools/seoul/build.py world from tools/seoul/seoul.json (tools/proga-podatki.py; docs/proge/seoul.md).
   dem: the ground (Copernicus DEM GLO-30 less the canopy and the buildings; 16 m cells, bytes: lo + v * step m above the sea, World.nrPrep's
   form); lc: the land cover (16 m cells, run-length coded: 0 open, 1 woods, 2 park and lawns, 3 town); far: the ground beyond (200 m cells,
   +-4 km, bytes: lo + v * step m above the sea; the surface model opened, the town's blocks taken out, the river at 0); towers: the city's
   blocks 300 m to 1.5 km from the road [x, z, height, width] (where the surface model stands above the opened ground on the town's land);
   bld: OSM buildings within 250 m [x, z, length, width, angle, height (0 unknown), kind: 0 house, 1 church, 2 tower, 3 castle, 4 shed,
   5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats, s, d]; out: outlines [index into bld, [x, z, ...]]; walls [0 wall, 1 retaining,
   2 hedge, 3 fence, 4 guard rail, 5 the city wall, [x, z, ...]]; roads: the other roads and paths within 70 m [highway, lanes, width,
   1 bridge / 2 tunnel, [x, z, ...]]; marks [label, kind, s, d, outline or line]; pts [kind, x, z]; stops [s, side, distance, shelter]; cross: the
   zebra crossings on the road [s, 1 with traffic lights]; lamps [x, z].
   Data: © OpenStreetMap contributors (ODbL 1.0: the derived data here under the ODbL 1.0); Copernicus DEM GLO-30 (produced using Copernicus
   WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA;
   all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
   Only geographic and descriptive labels. */
var SE_DATA = """

def far_city():
    """the city beyond the corridor from the surface model (100 m cells): the ground as its grey opening (500 m), the blocks where the surface
    stands 8 m and more above it on the town's land (not too high, not too steep: the hills' woods left out), 300 m (past OSM's buildings) to
    1.5 km from the road (the chase camera sees ~450 m, the game draws nothing past 700 m); the river below 8 m"""
    gf, af = grid('far'); a = af.astype(np.float32) / 10.0 - 100.0
    fp = np.ones((5, 5), bool)
    op = ndimage.gaussian_filter(ndimage.grey_dilation(ndimage.grey_erosion(a, footprint=fp), footprint=fp), 1.0)
    gy, gx = np.gradient(ndimage.gaussian_filter(op, 2.0), gf['cell']); slope = np.hypot(gx, gy)
    ex = a - op; wet = a < 8.0
    city = (op < 120) & (slope < 0.12) & (ex > 8) & ~wet
    c = gf['cell']; X = gf['x0'] + (np.arange(gf['nx']) + 0.5) * c; Z = gf['z0'] + (np.arange(gf['nz']) + 0.5) * c
    from scipy.spatial import cKDTree
    tree = cKDTree(LINE)
    towers = []
    jj, ii = np.nonzero(city)
    d, _ = tree.query(np.stack([X[ii], Z[jj]], 1))
    gd, ad = grid('dem'); hg = sample(gd, ad, X[ii], Z[jj], True)   # (the ground model: the hill's woods above ~95 m, as the land cover farther out)
    inD = (X[ii] > gd['x0']) & (X[ii] < gd['x0'] + gd['nx'] * gd['cell']) & (Z[jj] > gd['z0']) & (Z[jj] < gd['z0'] + gd['nz'] * gd['cell'])
    for j, i, dd, h0, ind in zip(jj, ii, d, hg, inD):
        if dd < 300 or dd > 1500 or (ind and h0 > 95): continue   # (nearer: OSM's buildings within 250 m, the park's woods; farther: past the haze)
        h = float(np.clip(ex[j, i] * 1.7, 12, 150)); r1 = (math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1; r2 = (math.sin(i * 39.346 + j * 11.135) * 24634.6345) % 1
        towers.append([round(float(X[i] + (r1 - 0.5) * 40)), round(float(Z[j] + (r2 - 0.5) * 40)), int(round(h)), int(round(22 + r2 * 20))])
    # the far ground: the opening (no blocks), the river down at 0; 200 m cells, +-4 km round the road
    g = np.where(wet, 0.0, op)
    n2 = gf['nx'] // 2; g2 = g[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).mean(axis=(1, 3)); w2 = wet[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).mean(axis=(1, 3)) > 0.5
    g2 = np.where(w2, 0.0, g2)
    cx = (LINE[:, 0].min() + LINE[:, 0].max()) / 2; cz = (LINE[:, 1].min() + LINE[:, 1].max()) / 2; C2 = c * 2
    i0 = int((cx - 4000 - gf['x0']) // C2); j0 = int((cz - 4000 - gf['z0']) // C2); n = int(8000 // C2) + 1
    i0 = max(0, min(n2 - n, i0)); j0 = max(0, min(n2 - n, j0)); g3 = g2[j0:j0 + n, i0:i0 + n]
    FAR = dict(x0=gf['x0'] + i0 * C2, z0=gf['z0'] + j0 * C2, n=n, cell=C2, lo=0, step=4, b64=b64bytes(np.clip(np.round(g3 / 4), 0, 255)))
    return FAR, towers

def build_world():
    P = LINE; M = 700
    x0 = math.floor((P[:, 0].min() - M) / 16) * 16; z0 = math.floor((P[:, 1].min() - M) / 16) * 16
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    # the ground: the tool's model (20 m cells), on 16 m cells
    gd, ad = grid('dem'); c = 16; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c)
    hv = sample(gd, ad, X, Z, True)
    lo = math.floor(float(hv.min())); step = math.ceil((float(hv.max()) - lo) / 255 * 100) / 100
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.2, b64=b64bytes(dem))
    # the land cover: the woods (WorldCover's trees, OSM's forest, a canopy over 4 m), the park's lawns, the town; farther than the tool's band
    # (300 m) the woods on the hill above ~95 m, the town below
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); c = 16
    lnx = int(math.ceil((x1 - x0) / c)); lnz = int(math.ceil((z1 - z0) / c))
    votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); hg = sample(gd, ad, X, Z, True)
            cls = np.full(wc.shape, 3, np.int8)
            far = wc == 0
            cls[far & (hg > 95)] = 1
            cls[~far & ((lu == 10) | (lu == 4) | (wc == 30))] = 2
            cls[~far & ((wc == 10) | (lu == 9) | (ch > 4)) & (lu != 14) & (lu != 1)] = 1
            cls[~far & (wc == 50) & (ch <= 4)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    FAR, towers = far_city()
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 5, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    oidx = {}
    for k, o in enumerate(J.get('bldOutline', [])): oidx[o[0]] = pl(o[1])
    data = {
        'dem': D, 'lc': LC, 'far': FAR, 'towers': towers,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6], b[7], round(b[8], 1)] for b in J['bld']],
        'out': [[k, v] for k, v in oidx.items()],
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'roads': [[r[0], r[1], r[2], r[3], pl(r[8])] for r in J['roads']],
        'marks': [[m[0], m[2], m[3], m[4], pl(m[5])] for m in J['landmarks']],
        'pts': [[k, *[round(v, 1) for v in ll_xz(la, lo_)]] for k, la, lo_ in POINTS],
        'stops': [[s[0], s[1], s[2], s[3]] for s in J['stops']],
        'cross': [[c[0], 1 if c[1] == 'traffic_signals' or c[2] == 'traffic_signals' else 0] for c in J['onRoad'] if c[1] in ('crossing', 'traffic_signals')],
        'lamps': J['lamps'],
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'seoul.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], 'lo', lo, 'step', step, '; lc', lnx, 'x', lnz, 'classes', np.bincount(lc.ravel(), minlength=4).tolist(), '; towers', len(towers))
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
