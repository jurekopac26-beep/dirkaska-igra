# London, Anglija: the game's files from the track data (tools/london/london.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/london/build.py track   -> js/tracks/london.js (centre line, heights, widths, names)
#   python3 -I tools/london/build.py world   -> js/data/london.js (the scenery data for js/world-london.js)
# Edit the track's names, widths and description here, not in the generated files. Description of the track: docs/proge/london.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'london.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); L = J['length']; NP = len(LINE)
RIVER = 1.0   # the Thames in the game (m above sea level): about half tide at Westminster (high water ~3.5 m, low water ~-3 m)

def curv(P):
    a = np.roll(P, 1, 0); b = np.roll(P, -1, 0)
    d1 = (b - a) / 2; d2 = b - 2 * P + a
    return (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.maximum(np.hypot(d1[:, 0], d1[:, 1]) ** 3, 1e-9)

# ---- the middle of the street: Parliament Street and Whitehall are two one-way carriageways in OSM (the route runs on one of them, and
#      changes from the southbound to the northbound one at s ~1680); the race uses the whole street, its centre line between the two.
#      [s on the tool's line (m), shift to the right of the travel direction (m)], measured once from the OSM download of 8. 11. 2026
#      (the nearest points of both carriageways, half their offsets); 0 where the street is one two-way road ----
SHIFT = [(0, 6.5), (20, 6.05), (40, 5.8), (60, 5.75), (80, 5.75), (100, 6.0), (120, 6.05), (140, 6.35), (160, 6.1), (180, 5.55), (200, 5.55),
         (220, 5.25), (240, 4.8), (260, 4.65), (280, 4.5), (300, 4.15), (320, 1.55), (340, 0.0), (1550, 0.0), (1570, -5.6), (1575, -6.6),
         (1580, -6.7), (1600, -6.2), (1620, -6.8), (1670, -6.7), (1675, -6.5), (1680, -2.1), (1685, 0.0), (1690, 2.7), (1695, 6.4), (1700, 6.85),
         (1720, 6.85), (1740, 7.2), (1760, 7.6), (1780, 7.7), (1800, 7.3), (1820, 6.95)]

def shifted_line():
    s = np.arange(NP) * STEP
    xs = np.array([a for a, b in SHIFT]); vs = np.array([b for a, b in SHIFT])
    sh = np.interp(s, xs, vs, period=L)
    t = np.roll(LINE, -1, 0) - np.roll(LINE, 1, 0); t /= np.maximum(np.hypot(t[:, 0], t[:, 1]), 1e-9)[:, None]
    nrm = np.stack([-t[:, 1], t[:, 0]], 1)   # (right of the travel direction: x east, z south)
    P = LINE + nrm * sh[:, None]
    return np.stack([ndimage.gaussian_filter1d(P[:, 0], 2.0, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], 2.0, mode='wrap')], 1)

# ---- the centre line for the game: the street corners (radius 3-9 m in OSM's lines) rounded to at least RMIN, the rest as it is ----
RMIN = 16.0
def game_line():
    P = shifted_line()
    for it in range(60):
        k = np.abs(curv(P)); tight = k > 1 / RMIN
        if not tight.any(): break
        w = ndimage.gaussian_filter1d(ndimage.maximum_filter1d(tight.astype(float), 9, mode='wrap'), 2, mode='wrap')
        S = np.stack([ndimage.gaussian_filter1d(P[:, 0], 1.5, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], 1.5, mode='wrap')], 1)
        P = P * (1 - w[:, None]) + S * w[:, None]
    seg = np.hypot(*np.diff(np.vstack([P, P[:1]]), axis=0).T); cs = np.concatenate([[0], np.cumsum(seg)]); tot = cs[-1]
    n = int(round(tot / STEP)); u = np.arange(n) * tot / n
    Q = np.stack([np.interp(u, cs, np.append(P[:, 0], P[0, 0])), np.interp(u, cs, np.append(P[:, 1], P[0, 1]))], 1)
    return Q, tot

# ---- heights: the surface model (Copernicus DEM GLO-30) is no ground in the town (the buildings and the plane trees in it: 2.7-24 m along
#      the road); the real lie of the streets instead (m above sea level, from the tool's lower envelope where it is clean): Parliament Square
#      and the embankment ~4-5 m, Whitehall rising gently to ~13 m at Charing Cross, the avenue down to the river ----
H_AT = [(0, 6.0), (150, 7.6), (330, 11.0), (450, 13.0), (560, 11.2), (700, 7.2), (800, 5.2), (1000, 4.8), (1200, 4.6), (1420, 4.5),
        (1570, 4.2), (1700, 4.9)]
def game_heights(n):
    s = np.arange(NP) * STEP
    h = np.interp(s, [a for a, b in H_AT], [b for a, b in H_AT], period=L)
    h = ndimage.gaussian_filter1d(h, 6, mode='wrap')
    u = np.arange(n) / n
    return np.interp(u, np.arange(NP) / NP, h, period=1)

def road_h_tool():   # the same profile at the tool's line points (for the world's ground)
    s = np.arange(NP) * STEP
    return ndimage.gaussian_filter1d(np.interp(s, [a for a, b in H_AT], [b for a, b in H_AT], period=L), 6, mode='wrap')

# ---- half widths by street (metres after the start line, on the tool's line): Whitehall and Parliament Street, Bridge Street wide, the
#      avenue and the embankment a little narrower ----
WIDTHS = [  # [from, to, half width]
    (0, 440, 7.0),         # Whitehall, northbound
    (440, 800, 6.6),       # Charing Cross, the avenue down to the river
    (800, 1410, 6.6),      # the embankment
    (1410, 1570, 7.0),     # Bridge Street
    (1570, 1e9, 7.0),      # Parliament Street, Whitehall to the line
]
def widths(Ln, sc):
    K = []
    for a, b, hw in WIDTHS:
        a = a * sc; b = min(b * sc, Ln)
        K.append([round(a + (12 if a > 0 else 0), 1), hw]); K.append([round(b - (12 if b < Ln else 0), 1), hw])
    return K

# ---- names on the HUD ([label, s on the tool's line, the commentator's lines]): streets, squares and plain descriptions only (no people;
#      the embankment's name and the avenue's are after people, so plain descriptions there). English of the descriptive ones: js/lang.js ----
NAMES = [
    ('Whitehall', 20, ['Up Whitehall, flat out!', 'Along Whitehall, the square ahead!']),
    ('Trafalgarski trg', 440, ['Hard right at Trafalgar Square!', 'Round the bottom of Trafalgar Square!']),
    ('Proti reki', 560, ['Down the avenue to the river!', 'Downhill towards the Thames!']),
    ('Nabrežje Temze', 815, ['Right onto the embankment!', 'Along the Thames now!']),
    ('Westminstrski most', 1405, ['Right at Westminster Bridge!', 'Hard on the brakes for the bridge corner!']),
    ('Urni stolp', 1470, ['Past the clock tower!', 'Under the clock tower, flat out!']),
    ('Parlamentarni trg', 1555, ['Right at Parliament Square!', 'Round Parliament Square, onto the straight!']),
]

DESC = ('Mestna proga skozi središče Londona: start na Whitehallu, desno pri Trafalgarskem trgu, po aveniji navzdol do Temze, ob nabrežju proti '
        'jugu do Westminstrskega mostu in mimo urnega stolpa, nato desno pri Parlamentarnem trgu nazaj na Whitehall. Ograje ulične dirke, 1,8 km.')
DESC_EN = ('A city race through the centre of London: the start on Whitehall, right at Trafalgar Square, down the avenue to the Thames, south '
           'along the embankment to Westminster Bridge and past the clock tower, then right at Parliament Square back onto Whitehall. '
           'Street-race barriers, 1.8 km.')

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P, Ln = game_line(); n = len(P); hk = game_heights(n)
    k = curv(P); print('game line %.1f m, %d points, tightest radius %.1f m' % (Ln, n, 1 / np.abs(k).max()))
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    lh = ','.join(str(int(round(v * 10))) for v in hk[::2])   # every 10 m, decimetres above the sea
    sc = Ln / L
    names = []
    for lab, s, lines in NAMES:
        i = int(round(s * sc / (Ln / n))) % n
        names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(round(P[i, 0], 1)), f1(round(P[i, 1], 1)), json.dumps(lines)))
    src = '''/* Track definition 'london'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // London, England: a city race through the centre (docs/proge/london.md), one lap clockwise: the start on Whitehall (northbound), right at
  // Charing Cross by Trafalgar Square, down the avenue to the Thames, south along the embankment to Westminster Bridge, right past the clock
  // tower along Bridge Street and right at Parliament Square onto Parliament Street and Whitehall: %(km)s km. The streets are closed for the race
  // and lined with the barriers of a street race (concrete blocks and catch fences); the buildings generic (no names, signs, statues or brands).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/london/config.json), on Whitehall and
  // Parliament Street the middle between the two carriageways, the corners of the streets rounded to at least %(rmin)s m; metres, origin = the
  // tool's first point (the start line on Whitehall's northbound carriageway: def.start is the line in the middle of the street), x east, z south.
  // GENERATED by tools/london/build.py (edit the names, widths and text there).
  // Heights (LN_H): the lie of the streets (the surface model has the buildings and the plane trees in it), metres above the sea: Parliament
  // Square and the embankment ~4-5 m, Whitehall rising gently to ~13 m at Charing Cross; every 10 m from the start line, decimetres.
  // Data: the OSM-derived data in this file under the ODbL 1.0.
  const LN_H = [%(lh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xcfd6dd, sun: 0xfff0dc, sunI: 1.1, sky: 0xbdd0e4, gnd: 0x6a6964, hemiI: 0.66, tint: [1.0, 1.0, 1.01], sat: 1.0, sunOff: [-60, 74, 70], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // London: a bright spring day with a little haze over the river, the sun from the south-west
    say: 'London',
    id: 'london', pending: true, name: 'London, Anglija', theme: 'london', laps: 6, halfWidth: 7.0,
    desc: %(desc)s,
    en: { name: 'London, England', desc: %(desc_en)s },
    start: [%(sx)s, %(sz)s], runoff: 0.32, inner: 1.6, side: 1.6, offSurface: 'paving', noGravel: true, runoffTarmac: true, gradeForce: true, elevSmooth: 14, noBirds: true, realKm: %(km)s,
    rivals: 11,
    maxRivals: 30,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the flying start's column keeps its cars ~0.8 s apart, which on the long fast straights is ~45 m a car, and it is 4/5 of a lap at most: with 34 rivals already two formula cars stand on each other
    elev: LN_H.map((h, i) => [i / LN_H.length, h / 10]),
    widths: %(widths)s,
    // places and corners on the HUD ([label, x, z, the commentator's lines]; the descriptive labels have their English in js/lang.js)
    names: [
%(names)s
    ],
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (Ln / 1000), rmin=f1(RMIN), lh=lh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), widths=json.dumps(widths(Ln, sc)),
           names='\n'.join(names), pts=pts, sx=f1(round(P[0, 0], 1)), sz=f1(round(P[0, 1], 1)))
    path = os.path.join(ROOT, 'js', 'tracks', 'london.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB; heights %.1f-%.1f m above the sea' % (hk.min(), hk.max()))

# ---- the scenery data for js/world-london.js (js/data/london.js: var LN_DATA) ----
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

def thames():
    """the Thames as one closed ring: OSM's riverbank multipolygon comes cut where the download ends, as two open chains (the north bank
    and the south bank); joined end to start they close straight across the river at both ends, far out of sight"""
    ch = [np.array(fl).reshape(-1, 2) for kind, name, closed, fl in J['lakes'] if kind == 'river' and not closed]
    ring = ch.pop(0)
    while ch:
        k = int(np.argmin([np.hypot(*(c[0] - ring[-1])) for c in ch])); ring = np.vstack([ring, ch.pop(k)])
    Q = [ring[0]]
    for p in ring[1:]:
        if np.hypot(*(p - Q[-1])) >= 1.5: Q.append(p)
    return np.array(Q)

def poly_mask(P, X0, Z0, cell, nx, nz):
    img = Image.new('L', (nx, nz), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(img).polygon([((x - X0) / cell - 0.5, (z - Z0) / cell - 0.5) for x, z in P], fill=1)
    return np.asarray(img).astype(bool)

HEAD = """/* London (theme 'london'): the scenery data for js/world-london.js (metres, origin = the tool's first point, x east, z south). GENERATED by
   tools/london/build.py world from tools/london/london.json (tools/proga-podatki.py; docs/proge/london.md).
   dem: the ground (the streets' lie from the road's heights, the river's bed below the water; 16 m cells, bytes: lo + v * step m above the sea,
   World.nrPrep's form); lc: the land cover (16 m cells, run-length coded: 0 open, 1 trees, 2 park and lawns, 3 town); far: the surface (200 m
   cells, +-12 km, bytes of 1 m above the sea, the town's roofs in it); bld: OSM buildings within 150 m [x, z, length, width, angle, height (0 unknown),
   kind: 0 house, 1 church, 2 tower, 3 castle, 4 shed, 5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats, s, d]; out: outlines [index into bld,
   [x, z, ...]]; water: the Thames [name, [x, z, ...] closed ring]; walls [0 wall, 1 retaining, 2 hedge, 3 fence, 4 guard rail, [x, z, ...]];
   roads: the other streets and bridges within 60 m [highway, lanes, width, 1 bridge, [x, z, ...]]; rail: the railway's bridge over the river
   [x, z, ...]; marks [label, kind, s, d, outline]; trees [x, z, kind]; lamps [x, z]; wb: Westminster Bridge's line [x, z, ...]. Data: © OpenStreetMap contributors (ODbL 1.0: the derived
   data here under the ODbL 1.0); Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and
   Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and
   World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0). Only geographic and descriptive labels. */
var LN_DATA = """

def build_world():
    P, Ln = game_line(); M = 700; sc = Ln / L
    x0 = math.floor((P[:, 0].min() - M) / 16) * 16; z0 = math.floor((P[:, 1].min() - M) / 16) * 16
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    TH = thames()
    # the ground: the road's height of the nearest point of the line (the town is flat round the lap), the river's bed 3 m below the water
    c = 16; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    seed = np.ones((nz, nx), bool); hr = road_h_tool(); hv = np.zeros((nz, nx))
    gi = np.clip(np.round((LINE[:, 0] - x0) / c).astype(int), 0, nx - 1); gj = np.clip(np.round((LINE[:, 1] - z0) / c).astype(int), 0, nz - 1)
    seed[gj, gi] = False; hv[gj, gi] = hr
    d, (ij, ii) = ndimage.distance_transform_edt(seed, return_indices=True)
    rel = hv[ij, ii]
    rel = ndimage.gaussian_filter(rel, 2.0)
    wet = poly_mask(TH, x0 - c / 2, z0 - c / 2, c, nx, nz)   # (the cell's centre: x0 + i * c)
    rel = np.where(wet, RIVER - 3.0, rel)
    lo, step = -4.0, 0.25; dem = np.clip(np.round((rel - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.0, b64=b64bytes(dem))
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); c = 16
    lnx = int(math.ceil((x1 - x0) / c)); lnz = int(math.ceil((z1 - z0) / c))
    votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.full(wc.shape, 3, np.int8)   # (the town by default)
            cls[(lu == 10) | (lu == 4) | (wc == 30)] = 2
            cls[(ch > 5) & ((lu == 10) | (lu == 4) | (wc == 10) | (wc == 30))] = 1
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).mean(axis=(1, 3))
    FAR = dict(x0=gf['x0'], z0=gf['z0'], n=n2, cell=gf['cell'] * 2, lo=0, step=1, b64=b64bytes(np.clip(np.round(fh), 0, 255)))
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    oidx = {}
    for k, o in enumerate(J.get('bldOutline', [])): oidx[o[0]] = pl(o[1])
    data = {
        'dem': D, 'lc': LC, 'far': FAR,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6], round(b[7] * sc), round(b[8], 1)] for b in J['bld']],
        'out': [[k, v] for k, v in oidx.items()],
        'water': [['Temza', [round(float(v), 1) for v in TH.ravel()]]],
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'roads': [[r[0], r[1], r[2], r[3], pl(r[8])] for r in J['roads'] if r[0] not in ('footway', 'path', 'steps', 'cycleway', 'track') or r[3] == 1],
        'rail': [pl(r[3]) for r in J['rail'] if r[1] == 1 and r[0] == 'rail'],
        'marks': [[m[0], m[2], round(m[3] * sc), m[4], pl(m[5])] for m in J['landmarks']],
        'trees': [[t[0], t[1], t[2]] for t in J['trees']],
        'lamps': J['lamps'],
        # Westminster Bridge: its longest OSM way (the bridge's whole length, the lap turns off at its west end), for the arches in the world
        'wb': pl(max((r for r in J['roads'] if r[6] == 'Westminster Bridge' and r[3] == 1), key=lambda r: len(r[8]) and sum(math.hypot(r[8][k + 2] - r[8][k], r[8][k + 3] - r[8][k + 1]) for k in range(0, len(r[8]) - 2, 2)))[8]),
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'london.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, 'classes', np.bincount(lc.ravel(), minlength=4).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
