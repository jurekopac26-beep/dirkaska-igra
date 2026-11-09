# Abu Dabi, ZAE: the game's track file from the track data (tools/abudabi/abudabi.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/abudabi/build.py   -> js/tracks/abudabi.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/abudabi.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage
from shapely.geometry import LineString, Point, Polygon

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'abudabi.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); NP = len(RAW)
# the start line: OSM has no raceway=start-finish; it is the route's first point (tools/abudabi/config.json: the middle of the pit boxes
# along the main straight), so the tool's frame is the game's
O = np.zeros(2)

# ---- the centre line: OSM's raceway (relation 'the 2025 layout': ways 168477013, 1469184731, 1469184732, 1255169703), anticlockwise as raced,
# its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

# ---- heights: the island is made ground 2-9 m above the sea, the DEM along the line has the stands' and the buildings' remains in it: a
# running median over 125 m, smoothed over 30 m, the grade eased towards 3.5 % (4 % at the most) ----
def clamp_grade(h, g):
    h = h.copy(); n = len(h); lim = g * STEP
    for _ in range(200):
        moved = False
        for i in range(n):
            j = (i + 1) % n; d = h[j] - h[i]
            if abs(d) > lim + 1e-9: m = (h[i] + h[j]) / 2; h[i] = m - math.copysign(lim / 2, d); h[j] = m + math.copysign(lim / 2, d); moved = True
        if not moved: break
    return h
H = clamp_grade(ndimage.gaussian_filter1d(ndimage.median_filter(np.array(J['h']), size=25, mode='wrap'), 6, mode='wrap'), 0.035)
H0 = float(H[0])   # the start line's height above the sea: the game's zero
SEA = round(0.3 - H0, 2)   # the marina's and the sea's water in the game's frame (0.3 m above the sea's level: the DEM's water is at 0)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its owners, the hotel or the sponsors) ----
NAMES = [
    ('Levi na koncu ravnine', 280, ['Hard on the brakes for the left at the end of the straight!', 'Into the first left!', 'Round the left at the end of the straight!']),
    ('Hitri levi', 530, ['The fast left, flat out!', 'Through the fast left!', 'Left and on!']),
    ('Dolgi desni', 740, ['The long right, holding it all the way round!', 'All the way round the long right!', 'Through the long right!']),
    ('Lasnica', 1350, ['Hard on the brakes for the hairpin!', 'Round the tight left hairpin!', 'The hairpin, all the way round!']),
    ('Šikana', 2575, ['Left, right through the chicane at the end of the straight!', 'Hard on the brakes, into the chicane!', 'Through the chicane!']),
    ('Dolgi levi', 3660, ['The long left, flat out!', 'All the way round the long left!', 'Through the long left!']),
    ('Desni ob marini', 4130, ['Right along the marina!', 'The right by the boats!', 'Through the marina right!']),
    ('Ostri desni', 4265, ['Hard on the brakes for the sharp right!', 'The sharp right!', 'Round the sharp right!']),
    ('Levi pred hotelom', 4380, ['Left towards the hotel!', 'Left, and under the hotel!', 'Through the left before the hotel!']),
    ('Levi za hotelom', 4495, ['Out from under the hotel, and left!', 'The left past the hotel!', 'Through the left after the hotel!']),
    ('Desni pred zadnjim', 4805, ['The right before the last corner!', 'Right, nearly home!', 'Through the right before the last!']),
    ('Zadnji ovinek', 5015, ['The last corner, onto the straight!', 'The right onto the main straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 5150, ['Down the main straight past the pits!', 'Flat out down the straight!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the left at the end of the straight, the fast left, the long right,
# the hairpin, the chicane (2), the long left, the kink and the right by the marina, the sharp right, the two lefts by the hotel, the right
# before the last, the last corner
TURNS = [280, 530, 740, 1350, 2545, 2610, 3660, 3995, 4130, 4265, 4380, 4495, 4805, 5015]

DESC = ('Dirkališče na otoku Yas v Abu Dabiju: 5,3 km, 16 ovinkov, v nasprotni smeri urinega kazalca. Levi na koncu ciljne ravnine, hitri levi, '
        'dolgi desni in lasnica, več kot kilometer dolga ravnina do šikane, druga ravnina do dolgega levega, nato ovinki ob marini, pod hotelom, '
        'ki stoji čez progo, in zadnji ovinek. Ob progi pesek, palme in zalivane trate, velika pokrita tribuna nasproti boksov (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on Yas Island in Abu Dhabi: 5.3 km, 16 corners, anticlockwise. The left at the end of the main straight, the fast left, '
           'the long right and the hairpin, a straight of more than a kilometre to the chicane, another to the long left, then the corners by the '
           'marina, under the hotel that stands over the track, and the last corner. Sand, palms and watered lawns by the track, the big covered '
           'grandstand facing the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 18 m from the centre line, from the exit of the last corner
# to the braking zone of the first (the real lane runs on after the first corners and leaves through a tunnel under the track: here it runs
# along the straight only); the crews' boxes in the middle of the real pit building (OSM: s -124 .. 250, RB_LOOK.abudabi.pitBox); the pit
# wall 2.5 m past the road's edge ----
PIT = [18, -250, 230, 60]
PIT_ROW = [0, 120]
WALLS = [[-250, 230, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM): the big covered one facing the pits, the one round the outside of
# the hairpin, the one before the chicane, the two along the straight to the long left; shades over all of them (the desert sun); named by
# the quarters of the compass, the island and the marina
STANDS = [[-140, 230, -1, 10, 1, 9, 0, 'YAS'], [1280, 1420, 1, 8, 1, 4, 0, 'NORTH'], [2400, 2525, 1, 8, 1, 4, 0, 'WEST'],
          [2915, 3180, 1, 8, 1, 6, 0, 'SOUTH'], [3380, 3615, 1, 8, 1, 5, 0, 'MARINA']]
SECTORS = [1460, 3800]
REAL_KM = 5.281
# the hotel over the track (OSM's outlines as boxes: [x, z, length, width, angle (deg), height]): the west wing with its podium, the east
# wing, and the bridge between them over the track (between s 4437 and 4468: [x, z, length, width, angle (deg), its underside above the
# road, its thickness]); a hotel by its shape only, no name; the podium cut back to 13 m from the centre line (keep_clear)
HOTEL = [[47.6, 288.7, 132.4, 44.4, 177, 47], [164.8, 267.7, 136.4, 31.6, 84, 52], [8.1, 298.7, 203.1, 82.4, 163, 10]]
BRIDGE = [131.4, 274.5, 35.2, 29.0, 0, 7.5, 5.0]

def box_poly(x, z, l, w, deg):
    a = math.radians(deg); ca, sa = math.cos(a), math.sin(a)
    return Polygon([(x + (u * l * ca - v * w * sa) / 2, z + (u * l * sa + v * w * ca) / 2) for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1))])

def keep_clear(b, dmin):   # a box cut back, 1 m at a time from its side nearest the centre line, until it stands dmin m from it (the podium by the track)
    x, z, l, w, deg = b[:5]; a = math.radians(deg); ca, sa = math.cos(a), math.sin(a)
    for _ in range(200):
        if box_poly(x, z, l, w, deg).distance(LINE) >= dmin: break
        best = None
        for ux, uz, half, k in ((ca, sa, l / 2, 0), (-ca, -sa, l / 2, 0), (-sa, ca, w / 2, 1), (sa, -ca, w / 2, 1)):   # (the four sides' middles)
            d = LINE.distance(Point(x + ux * half, z + uz * half))
            if best is None or d < best[0]: best = (d, ux, uz, k)
        _, ux, uz, k = best; x -= ux * 0.5; z -= uz * 0.5
        if k == 0: l -= 1
        else: w -= 1
    return [round(x, 1), round(z, 1), round(l, 1), round(w, 1)] + list(b[4:])

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings (sk.bld), the fences (sk.fence), the palms (sk.palm), the water (sk.sea) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):   # X, Z in the game's frame (the tool's: the origin is the start line)
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

LINE = LineString(np.vstack([P, P[:1]]))

def water():
    # the sea and the marina's basins: ESA WorldCover's water (class 80, 10 m cells; OSM's coastline is cut off 500 m from the road and does not
    # close), on 2.5 m cells smoothed (the cells' steps rounded off), the basins over 3000 m2; their signed distance (m, + in the water) on 8 m
    # cells over the water within 450 m of the road, -30 .. 30 m in 0.25 m steps, run-length coded
    g, a = grid('lc'); f = 4; cf = g['cell'] / f
    I, K = np.meshgrid(np.arange(g['nx'] * f), np.arange(g['nz'] * f))
    wet = ndimage.map_coordinates((a == 80).astype(np.float32), [(K + 0.5) / f - 0.5, (I + 0.5) / f - 0.5], order=1, mode='nearest')
    wet = ndimage.gaussian_filter(wet, 2.0) > 0.5
    lab, n = ndimage.label(wet)
    if n == 0: return None
    sizes = ndimage.sum(wet, lab, range(1, n + 1)) * cf * cf; wet = np.isin(lab, 1 + np.nonzero(sizes > 3000)[0])
    sd = (ndimage.distance_transform_edt(wet) - ndimage.distance_transform_edt(~wet)) * cf
    zz, xx = np.nonzero(wet); X = g['x0'] + (xx + 0.5) * cf; Z = g['z0'] + (zz + 0.5) * cf
    from scipy import spatial
    d, _ = spatial.cKDTree(P).query(np.c_[X, Z]); near = d < 450
    if not near.any(): return None
    c = 8.0; x0 = math.floor((X[near].min() - 40) / c) * c; z0 = math.floor((Z[near].min() - 40) / c) * c
    nx = int(math.ceil((X[near].max() + 40 - x0) / c)) + 1; nz = int(math.ceil((Z[near].max() + 40 - z0) / c)) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c)
    v = ndimage.map_coordinates(sd, [(GZ - g['z0']) / cf - 0.5, (GX - g['x0']) / cf - 0.5], order=1, mode='nearest')
    q = np.clip(np.round((np.clip(v, -30, 30) + 30) * 4), 0, 240).astype(np.uint8).ravel()
    out = []; k = 0   # (run-length coded: a run of 4 or more of one value as 255, the value, the count (4-254); the rest as they are)
    while k < len(q):
        m = k
        while m < len(q) and q[m] == q[k] and m - k < 254: m += 1
        if m - k >= 4: out += [255, int(q[k]), m - k]; k = m
        else: out.append(int(q[k])); k += 1
    return dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lv=SEA, rle=b64bytes(out))

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells (a 3-cell median: the remains of the big buildings out), 0.1 m
    # steps above the start line from -8 m (the island 2-9 m above the sea, the water at 0: the marina's basins dug deeper by the builder)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = ndimage.median_filter(sample(gd, ad, X, Z, True), size=3) - H0
    lo, step = -8.0, 0.1; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.06, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (sand, the bare ground of the island, the water), 1 palms and gardens' trees, 2 watered lawns, 3 paved
    # (car parks, roads, the circuit's own grounds): ESA WorldCover and the canopy height, OSM's land use for the paved ground (not its
    # grass: much of the circuit's grounds tagged grass is sand and gravel in WorldCover)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (ch > 3)] = 1
            cls[((wc == 30) | (wc == 40)) & (ch <= 3)] = 2
            cls[(wc == 50) & (ch <= 3)] = 3
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 3) & (wc != 30) & (wc != 40) & (wc != 10)] = 3
            cls[(lu == 12) | (wc == 80)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building, the stands and the
    # hotel (the game's own there: RB_LOOK.abudabi.pitBox, def.stands, def.sk.ht), nothing over the track
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if l > 200: continue                                                   # (the pit building, the stands, the hotel's grounds)
        if box_poly(x, z, l, w, math.degrees(ang)).distance(LINE) < 14: continue
        hh = hgt or (7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2)
        xx, zz = mv([x, z]); bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the fences round the circuit (OSM barrier=fence, within 30 m): [x, z, ...]
    fence = [mv(w[3]) for w in J['walls'] if w[0] == 'fence']
    # the palms (OSM natural=tree and tree_row: date palms here): [x, z, ...], the rows a palm every 8 m
    palm = []
    for t in J['trees']: palm += mv(t[:2])
    for k, pts in J['treeRows']:
        q = np.array(pts).reshape(-1, 2)
        for a, b in zip(q[:-1], q[1:]):
            n = max(1, int(round(np.hypot(*(b - a)) / 8)))
            for t in range(n + 1): palm += mv(list(a + (b - a) * t / n))
    sea = water()
    return D, LC, dict(bld=bld, fence=fence, palm=palm, ht=[keep_clear(b, 13) for b in HOTEL], hb=BRIDGE, sea=sea)

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'abudabi'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Abu Dabi, ZAE: the circuit on Yas Island in Abu Dhabi, its layout since 2021, anticlockwise, in its real layout and scale: the start line
  // on the main straight in the middle of the pit boxes (the pits on the right), the left at the end of the straight, the fast left, the long
  // right, the hairpin, the straight of more than a kilometre to the chicane, the straight to the long left, the right by the marina, the
  // sharp right, the two lefts by the hotel that stands over the track (under its bridge between them), the right before the last and the
  // last corner: %(km)s km on our line (5.281 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/abudabi/config.json: the raceway's ways
  // of the 2025 layout in their one-way direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east,
  // z south. GENERATED by tools/abudabi/build.py (edit the names, the pits, the stands and the text there).
  // Heights (AD_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), a running median and
  // smoothed; every 10 m from the start line, decimetres above it (%(h0)s m a.s.l.): the island is flat, made ground a few metres above the sea.
  // Scenery data for the world builder (js/world-abudabi.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.1 m steps), land cover (lc, 16 m cells: 0 sand and bare ground, 1 palms and gardens' trees, 2 watered lawns, 3 paved:
  // OSM, ESA WorldCover, the canopy), and sk: the buildings by the circuit ([x, z, length, width, angle (deg), height]: OSM outlines as boxes,
  // not the pit building and the grandstands, which the builder makes), the fences ([x, z, ...]: OSM barrier=fence), the palms ([x, z, ...]:
  // OSM's trees), the hotel (ht: its wings as boxes; hb: the bridge between them over the track: [x, z, length, width, angle, its underside
  // above the road, its thickness]) and the water (sea: the signed distance to the shore of the marina's basins and the sea (OSM coastline,
  // ESA WorldCover), + in the water, on 8 m cells, (d + 30) * 4, run-length coded: 255, the value, the count; lv: the water's level).
  // The names: plain descriptions only (no names of people, firms, events, the circuit or the hotel).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const AD_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xe6dccb, sun: 0xfff4dc, sunI: 1.2, sky: 0xa9c6e2, gnd: 0xb59c74, hemiI: 0.7, tint: [1.03, 1.0, 0.95], sat: 0.98, sunOff: [70, 84, -40], split: [[0.98, 1.0, 1.03], [1.05, 1.0, 0.94]] },   // the Gulf's winter afternoon: a high bright sun, a pale sky, a sandy haze over the island
    say: 'Abu Dhabi', rainP: 0.04,
    grassNat: 0.3, lawn: [0.96, 1.04, 0.86],
    zivali: { a: ['egret'], t: [], city: true },
    id: 'abudabi', name: 'Abu Dabi, ZAE', theme: 'abudabi', laps: 3, halfWidth: 7.5,
    desc: %(desc)s,
    en: { name: 'Abu Dhabi, UAE', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 4.2, side: 5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: AD_H.map((h, i) => [i / AD_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the left at the end of the straight, the fast left, the long right, the hairpin, the chicane (2), the long left, the kink and the right by the marina, the sharp right, the lefts before and after the hotel, the right before the last, the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the crews' boxes (the garages: RB_LOOK.abudabi.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one facing the pits, round the hairpin, before the chicane, along the straight to the long left
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the hairpin, the two straights and the long left, the marina and the hotel
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'abudabi.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(np.diff(H)).max() / STEP * 100),
          D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6, 'fences', len(SK['fence']), 'palms', len(SK['palm']) // 2,
          'sea', None if not SK['sea'] else '%d x %d' % (SK['sea']['nx'], SK['sea']['nz']))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
