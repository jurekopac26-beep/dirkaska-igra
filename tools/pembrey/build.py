# Pembrey, Wales: the game's track file from the track data (tools/pembrey/pembrey.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/pembrey/build.py          -> js/tracks/pembrey.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
#   python3 -I tools/pembrey/build.py --info   -> the bends, and where the buildings stand by the circuit (m after the start line, m to the side)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (A4), the track: docs/proge/pembrey.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'pembrey.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (5.6 m): the game's zero

# ---- the centre line: OSM's 17 lit one-way raceways of the circuit (tools/pembrey/config.json), from the start line (OSM raceway=start-finish)
# in their one-way direction, clockwise; their nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south), and the distance to the line
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl), float(d[i])

def sm(s): return s if s < LEN / 2 else s - LEN   # (metres from the start line, before it negative)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, aircraft, other circuits
# or the circuit (CLAUDE.md, Pravna varnost): the real corners are named after a car maker, a racing driver, an aircraft and a circuit ----
NAMES = [
    ('Severna lasnica', 372, ['The hairpin at the north end!', 'Hard on the brakes, right round the hairpin!', 'Slow, slow, round the north hairpin!']),
    ('Hitri desni', 505, ['Quick through the fast right!', 'The fast right, down the infield!', 'Through the fast right-hander!']),
    ('Dolgi levi', 668, ['The long left past the paddock!', 'Holding it round the long left!', 'Left, and keep it tight, round the long left!']),
    ('Levi pri depoju', 905, ['The left by the paddock!', 'Turning left, out towards the east!', 'Through the left by the paddock!']),
    ('Desni na vzhodu', 1165, ['The long right on the east side!', 'Round the long right towards the hairpin!', 'Through the right in the open!']),
    ('Vzhodna lasnica', 1405, ['The east hairpin, right round!', 'Hard on the brakes for the east hairpin!', 'Right round the hairpin in the corner!']),
    ('Dolga ravnina', 1600, ['Down the long straight by the woods!', 'Flat out down the long straight!', 'The long straight, top gear!']),
    ('Desni ob gozdu', 1805, ['The right by the woods!', 'Through the right at the end of the straight!', 'Round the right, the pines beside it!']),
    ('Dolgi desni', 2080, ['The long right onto the finish straight!', 'Holding it round the long right!', 'Round the long right-hander, the pits ahead!']),
    ('Ciljna ravnina', 2260, ['Down the finish straight past the pits!', 'Flat out along the finish straight!', 'The finish straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the north hairpin, the fast right, the long left, the left by the
# paddock, the right on the east side, the east hairpin (2), the right by the woods, the long right (2)
TURNS = [374, 507, 665, 905, 1170, 1372, 1430, 1805, 2045, 2120]

DESC = ('Kratko dirkališče na nekdanjem letališču pri vasi Pembrey ob zalivu Carmarthen v južnem Walesu: 2,3 km v smeri urinega kazalca, '
        'ravno kot miza, kjer dirkajo tudi tovornjaki. Ciljna ravnina ob boksih, severna lasnica, hitri desni, dolgi levi in levi pri depoju, '
        'desni na vzhodu, vzhodna lasnica, dolga ravnina ob gozdu, desni ob gozdu in dolgi desni nazaj na ravnino. Ob progi trava, gume in '
        'ograje, boksi in depo, borov gozd ob morju (zapelji v bokse in mehaniki ti popravijo avto).')
DESC_EN = ('A short circuit on an old airfield by the village of Pembrey on Carmarthen Bay in south Wales: 2.3 km, clockwise, flat as a table, '   # (no č, š or ž in the English: tests/lang.test.js)
           'where trucks race too. The finish straight past the pits, the north hairpin, the fast right, the long left and the left by the paddock, '
           'the right on the east side, the east hairpin, the long straight by the woods, the right by the woods and the long right back onto the '
           'straight. Grass, tyre walls and fences, the pits and the paddock, the pine woods by the sea (drive into the pits and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the finish straight (OSM: way 893412424, raceway=pit_lane, ~13 m from the centre
# line; here 14 m, as on the other circuits), from the exit of the long right (the real lane leaves the circuit after the right by the woods
# and runs inside the long right) to 150 m past the start line, where the real one joins it; the 13 crews' boxes and the garages where the
# real ones stand (OSM: two rows of garages, 140 .. 10 m before the start line); the pit wall 2.5 m past the road's edge along the lane ----
PIT = [14, -190, 150, -75, 50]
PIT_ROW = [-140, -20]
PIT_BOX = [-140, -10, 1]   # (the garages: World's RB_LOOK.pembrey.pitBox)
# the pit wall along the lane (the circuit's other barriers: the builder's, round the bends and the straights)
WALLS = [[-190, 150, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: a bank of seats on the grass across the finish straight from the pits,
# and one outside the east hairpin
STANDS = [[25, 75, -1, 6, 0, 2, 0, 'PEMBREY'], [1385, 1420, -1, 5, 0, 2, 0, 'CYMRU']]
SECTORS = [700, 1450]
REAL_KM = 2.3

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings (sk.bld) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
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

def in_pits(s, d, l, w):   # (a building in the way of the game's pit lane or its garages: the game's are wider and deeper than the real ones)
    q = sm(s); return PIT[1] - 10 < q < PIT[2] and 0 < d < 14 + 6 + math.hypot(l, w) / 2 or PIT_BOX[0] - 25 < q < PIT_BOX[1] + 25 and 0 < d < 42 + math.hypot(l, w) / 2 - 6

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -20 m (the old
    # airfield within a metre or two of the start line all round; the dunes under the pine woods to the south and the west a few metres
    # higher, the sea's edge 5 m lower)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the airfield's grass, the meadows), 1 forest (the pine woods), 2 fields (crops), 3 built-up (the paddock,
    # the car parks, the old airfield's aprons); OSM's land use first, ESA WorldCover and the canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (wc == 20) | (ch > 5)] = 1
            cls[(wc == 40) & (ch <= 5)] = 2
            cls[(wc == 50) & (ch <= 6)] = 3
            cls[lu == 9] = 1; cls[(lu == 8) & (ch > 4)] = 1
            cls[(lu == 3) & (ch <= 5)] = 2
            cls[((lu == 4) | (lu == 10) | (lu == 13)) & (ch <= 5)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height, kind (0 a building of the paddock, 4 a
    # marshals' post, 5 a hall)]; not where the game's pit lane and garages are
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if in_pits(s, d, l, w): continue
        hh = hgt if hgt > 2 else 7.0 if l * w > 300 else 2.7 if l * w < 12 else 4.2
        k = 4 if l * w < 12 else 5 if l * w > 300 else 0
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), k]
    return D, LC, dict(bld=bld)

# ---- the horizon (def.far for Riverside's rsFar, js/world-riverside.js): the highest ground in rings round the circuit ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea; the sea 0)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray()
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for a in range(na):
            m = 0.0
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (a + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round(m / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=0, step=step, b64=base64.b64encode(bytes(out)).decode())

def info():
    print('length %.1f m, %d points; heights %.1f .. %.1f m above the sea (start %.1f)' % (LEN, NP, H.min(), H.max(), H0))
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('tightest: R %.1f m at %.0f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()]))
    print('bends (R < 80 m):', ' '.join('%.0f:%s%.0f' % (CUM[i], 'R' if ks[i] > 0 else 'L', 1 / abs(ks[i])) for i in range(NP) if abs(ks[i]) > 1 / 80 and abs(ks[i]) >= abs(ks[i - 1]) and abs(ks[i]) >= abs(ks[(i + 1) % NP])))
    for b in J['bld']:
        s, dd, _ = sd(b[0], b[1]); print('building %4.1f x %4.1f h %.1f: at %.0f m, %.1f m to the side%s' % (b[2], b[3], b[5], sm(s), dd, ' (pits: left out)' if in_pits(s, dd, b[2], b[3]) else ''))

def build_track():
    hk = H[::2]; peh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'pembrey'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Pembrey, Wales: the circuit on the old airfield by the village of Pembrey on Carmarthen Bay (Carmarthenshire), clockwise, in its real
  // layout and scale: the start line on the finish straight (OSM raceway=start-finish), the pits beside it on the right, the north hairpin,
  // the fast right, the long left, the left by the paddock, the right on the east side, the east hairpin, the long straight by the woods, the
  // right by the woods and the long right onto the finish straight: %(km)s km on our line (2.3 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/pembrey/config.json: the circuit's 17
  // lit one-way raceways in their one-way direction, clockwise), the corners at its nodes rounded (sigma 5 m); metres, x east, z south,
  // origin = the start line.
  // GENERATED by tools/pembrey/build.py (edit the names, the pits, the stands and the text there).
  // Heights (PE_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (5.6 m a.s.l.): within 2 m of it all round.
  // Scenery data for the world builder (js/world-pembrey.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 the airfield's grass and the meadows, 1 the pine woods, 2 fields, 3 the paddock,
  // the car parks and the old aprons: OSM, ESA WorldCover, the canopy), and sk: bld, the buildings by the circuit ([x, z, length, width,
  // angle (deg), height, kind (0 a building of the paddock, 4 a marshals' post, 5 a hall)]: OSM outlines as boxes; the pit garages are the
  // game's own, where the real ones stand).
  // The names: plain descriptions only (no names of people, firms, aircraft, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const PE_H = [%(peh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc3cdd4, sun: 0xfff1de, sunI: 0.98, sky: 0xaec6dc, gnd: 0x4d6a34, hemiI: 0.7, tint: [0.98, 1.0, 0.99], sat: 1.0, sunOff: [-60, 66, 74], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // the coast of south Wales in summer: a soft, clean sea light, the sun from the south-west, a little haze off the bay
    say: 'Pembrey', rainP: 0.45,
    grassNat: 0.4, lawn: [0.96, 1.02, 0.94],
    zivali: { a: ['fox', 'hare', 'roe'], t: ['logPile', 'fallenTree'], open: true },
    id: 'pembrey', name: 'Pembrey, Wales', theme: 'pembrey', laps: 6, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Pembrey, Wales', desc: %(desc_en)s },
    start: %(start)s, runoff: 0.9, inner: 3.5, side: 5.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: PE_H.map((h, i) => [i / PE_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the north hairpin, the fast right, the long left, the left by the paddock, the right on the east side, the east hairpin (2), the right by the woods, the long right (2)
    pit: %(pit)s,   // pit lane on the right of the finish straight: [centre offset to the right, from, to, the player's box, the way in's length] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.pembrey.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: across the finish straight from the pits, outside the east hairpin
    stands: %(stands)s,
    zaslon: { d: 21, side: -1, off: 16 },   // the big screen (js/world-zaslon.js) by the grandstand on the left, turned towards the cars coming (node tools/zaslon-mesto.mjs pembrey)
    sectors: %(sectors)s,   // the three sectors of the timing screens: the north end and the infield, the east side and the hairpin, the long straight and the long right
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    // the horizon (js/world-pembrey.js: Riverside's rsFar): the highest ground in %(nfar)d rings out to %(rfar)s km round the circuit in 2 deg directions, m above the
    // sea (lo + byte x step: Copernicus DEM GLO-30 as it is, the woods and the towns with it): Mynydd Pen-bre and the hills of Carmarthenshire, the Gower across the estuary
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), start=json.dumps(at(0)).replace(',', ', '), peh=peh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '), sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), nfar=len(FAR_R), rfar='%g' % (FAR_R[-1] / 1000), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'pembrey.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; buildings', len(SK['bld']) // 7)
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))

if __name__ == '__main__':
    if '--info' in sys.argv: info()
    else: build_track()
