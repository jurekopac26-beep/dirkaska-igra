# Biķernieki, Latvija: the game's track file from the track data (tools/bikernieki/bikernieki.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/bikernieki/build.py   -> js/tracks/bikernieki.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (A6), the track: docs/proge/bikernieki.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'bikernieki.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); NP = len(RAW)

# ---- the centre line: OSM's raceway ways of the speed ring (Ātruma aplis), clockwise as raced, their nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the tool's (the ground model across the road, smoothed, grades at most 12 %), the steepest pieces (the drop off the dunes to
# the main straight, s ~2950) eased to 10 % (the excess spread to the neighbours), then smoothed again (sigma 10 m) ----
def heights():
    h = np.array(J['h'], float); cap = 0.10 * STEP
    for _ in range(400):
        d = np.roll(h, -1) - h; ex = np.clip(np.abs(d) - cap, 0, None) * np.sign(d) / 2
        if not np.any(ex): break
        h += ex; h -= np.roll(ex, 1)
    return ndimage.gaussian_filter1d(h, 2.0, mode='wrap')
H = heights()
H0 = float(H[0])   # the start line's height above the sea (6.2 m): the game's zero

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms or the circuit (CLAUDE.md, Pravna varnost) ----
NAMES = [
    ('Desni pregib', 330, ['Flat through the right kink!', 'A brush of the brakes through the kink!', 'Through the kink, the hairpin ahead!']),
    ('Lasnica', 560, ['Hard on the brakes for the hairpin!', 'Right round the hairpin, past the stands!', 'Slow, slow, round the hairpin!']),
    ('Levi za lasnico', 665, ['The left after the hairpin, into the woods!', 'Left, and up into the pines!', 'Through the left after the hairpin!']),
    ('Vzpon skozi gozd', 800, ['Climbing through the pine woods!', 'Up the long rise through the trees!', 'Full throttle up through the woods!']),
    ('Desni v gozdu', 940, ['The right in the woods!', 'Right, deep in the forest!', 'Round the right among the pines!']),
    ('Spust k jezeru', 1230, ['Down towards the lake!', 'Over the crest and down to the water!', 'Dropping down to the lake!']),
    ('Levi ob jezeru', 1335, ['The left by the lake!', 'Hard left, the lake beside us!', 'Round the left by the water!']),
    ('Klanec od jezera', 1640, ['Up the hill from the lake!', 'The steep climb away from the water!', 'Climbing hard up the dunes!']),
    ('Zahodni ovinek', 1920, ['The west corner, a long right!', 'Right round the west corner!', 'Holding it through the west corner!']),
    ('Gozdna ravnina', 2150, ['Flat out down the forest straight!', 'The long straight through the woods!', 'Pines on both sides, flat out!']),
    ('Severni ovinek', 2390, ['The north corner, right and long!', 'Right round the north corner!', 'Through the north corner, the far end of the lap!']),
    ('Desni na klancu', 2750, ['The right on the climb!', 'Right, and climbing!', 'Up through the right!']),
    ('Levi na vrhu', 2860, ['Left over the top!', 'The left on the crest, light on the wheels!', 'Over the top through the left!']),
    ('Spust', 2960, ['And down the steep drop!', 'Down off the dunes!', 'The descent to the straight!']),
    ('Desni pred ravnino', 3285, ['The right before the straight!', 'Right, the stands ahead!', 'Round the right, the straight is near!']),
    ('Levi na ravnino', 3445, ['The last left, onto the straight!', 'Left, onto the main straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 3560, ['Down the main straight past the stands!', 'Flat out along the main straight!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the right kink, the hairpin, the left after it, the right in the
# woods, the right before the lake, the left by the lake, the west corner, the north corner, the right on the climb, the left on the top,
# the right before the straight, the left onto it
TURNS = [315, 555, 660, 940, 1226, 1331, 1916, 2386, 2751, 2856, 3282, 3442]

DESC = ('Dirkališče v gozdnem parku Biķernieki na vzhodu Rige: 3,65 km v smeri urinega kazalca, po peščenih sipinah in borovem gozdu. '
        'Dolga glavna ravnina mimo tribun in boksov, desni pregib in lasnica na njenem koncu, vzpon skozi gozd, spust k jezeru Linezers s '
        'trstičjem ob bregu, strm klanec na sipine, zahodni in severni ovinek ob gozdni ravnini, levi na vrhu in strm spust nazaj na ravnino. '
        'Ob progi bori, breze in smreke, jezero, tribune in boksi ob glavni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the Biķernieki forest park on the east side of Riga: 3.65 km, clockwise, over the sandy dunes and through the pine woods. '
           'The long main straight past the stands and the pits, the right kink and the hairpin at its end, the climb through the woods, the drop '
           'to the lake Linezers with reeds along its shore, the steep climb onto the dunes, the west and the north corners round the forest '
           'straight, the left over the top and the steep drop back to the straight. Pines, birches and spruces by the track, the lake, '
           'the stands and the pits along the main straight (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight (the paddock's side: OSM has the buildings and a tyre barrier
# there), 14 m from the centre line as on the other circuits, from 80 m after the last corner to before the bleachers on the way to the
# hairpin; the 13 crews' boxes and the garages by the start line; the pit wall 2.5 m past the road's edge ----
PIT = [-14, -120, 240, 10]   # (the player's box: the 7th crew's, in front of the middle garage, 5 .. 15 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-55, 65]
PIT_BOX = [-55, 75, -1]   # (the garages: World's RB_LOOK.bikernieki.pitBox)
WALLS = [[-120, 240, -1, 2.5]]   # the pit wall along the lane
# grandstands [from, to, side, rows, roof, sections, orange, name]: OSM's on the left of the main straight before the start line (the
# main stands, roofed), the bleachers on the left of the right before the straight and along the straight's run to the hairpin
STANDS = [[-394, -314, -1, 5, 0, 2, 0, 'MEŽCIEMS'], [-290, -132, -1, 8, 1, 3, 0, 'BIĶERNIEKI'],
          [262, 370, -1, 5, 0, 2, 0, 'RĪGA'], [380, 460, -1, 5, 0, 1, 0, 'LATVIJA'], [472, 540, -1, 5, 0, 1, 0, 'VIDZEME']]
SECTORS = [1230, 2400]
REAL_KM = 3.65

# the reedbeds on the lake's shore (OSM natural=wetland, wetland=reedbed: ways 688089979 and 688089993; [x, z, ...], 0.5 m)
REEDS = [[-349.5, -163.5, -349.0, -159.0, -352.5, -138.5, -354.0, -137.0, -353.0, -122.5, -353.0, -110.0, -347.0, -121.5, -345.0, -129.0, -344.5, -160.5, -347.5, -171.5, -350.5, -178.0],
         [-485.0, -246.5, -476.5, -266.0, -459.0, -278.5, -449.5, -284.5, -440.5, -286.0, -418.5, -279.5, -439.0, -283.0, -446.5, -281.0, -459.0, -274.0, -464.0, -269.0, -472.5, -257.5,
          -475.0, -251.5, -475.0, -245.5, -475.0, -241.5, -477.0, -235.5, -481.0, -232.0, -489.0, -230.0]]

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the lakes (sk.lakes), the reeds (sk.reeds), the buildings (sk.bld) ----
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

def inside(poly, X, Z):   # even-odd test of the points (X, Z arrays) in a polygon [[x, z], ...]
    res = np.zeros(X.shape, bool); n = len(poly)
    for i in range(n):
        ax, az = poly[i]; bx, bz = poly[(i + 1) % n]
        c = ((az > Z) != (bz > Z)) & (X < (bx - ax) * (Z - az) / ((bz - az) or 1e-9) + ax); res ^= c
    return res

def pairs(a): return [[a[k], a[k + 1]] for k in range(0, len(a) - 1, 2)]

def lakes():   # the lakes and ponds within 250 m (OSM natural=water, closed rings over 200 m^2): ['Linezers' or '', x, z, ...] in 0.5 m
    out = []
    for kind, name, closed, pts in J['lakes']:
        q = np.array(pts).reshape(-1, 2)
        if not closed or len(q) < 4: continue
        if 0.5 * abs(np.dot(q[:, 0], np.roll(q[:, 1], 1)) - np.dot(q[:, 1], np.roll(q[:, 0], 1))) < 200: continue
        if np.hypot(*(q[0] - q[-1])) < 0.5: q = q[:-1]
        out.append([name] + [round(v * 2) / 2 for v in q.ravel()])
    return out

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -20 m (the
    # lowland by the main straight and the lakes 1-6 m below the start line, the dunes in the woods 20-30 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (grass, the paddock's lawns, the clearings), 1 forest (pine, birch, spruce), 2 water (the lakes and
    # their reedbeds: no trees, no farms), 3 built-up (the paddock, the car parks, the town); OSM's land use first, ESA WorldCover and the
    # canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    LK = lakes(); wet = [pairs(L[1:]) for L in LK] + [pairs(r) for r in REEDS]
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (wc == 20) | (ch > 5)] = 1
            cls[(wc == 50) & (ch <= 6)] = 3
            cls[lu == 9] = 1; cls[(lu == 8) & (ch > 4)] = 1
            cls[((lu == 3) | (lu == 4) | (lu == 10)) & (ch <= 5)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for poly in wet: cls[inside(poly, X, Z)] = 2
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the main stands (def.stands draws
    # them), not where the game's pit lane and pit building are (the left of the straight), nor in the barriers
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if hgt == 13: continue   # (the main stands: OSM building=grandstand, 13 m)
        ca, sa = math.cos(ang), math.sin(ang); edge = []   # (the box's outline every metre: its distance from the road, where along it)
        for u, v, du, dv in ((-1, -1, 1, 0), (1, -1, 0, 1), (1, 1, -1, 0), (-1, 1, 0, -1)):
            n = max(1, int(math.ceil(l if du else w)))
            for k in range(n + 1):
                a = (u + du * 2 * k / n) * l / 2; c = (v + dv * 2 * k / n) * w / 2; edge.append(sd(x + a * ca - c * sa, z + a * sa + c * ca))
        if min(abs(q[1]) for q in edge) < 12.5: continue   # (in the barriers)
        if any(-130 < (q[0] if q[0] < LEN - 600 else q[0] - LEN) < 250 and q[1] < 0 and -q[1] < (45 if -80 < (q[0] if q[0] < LEN - 600 else q[0] - LEN) < 100 else 22) for q in edge): continue   # (the pit lane, the apron and the garages)
        hh = hgt if hgt > 0 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    return D, LC, dict(lakes=LK, reeds=REEDS, bld=bld)

def build_track():
    hk = H[::2]; bkh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'bikernieki'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Biķernieki, Latvia: the circuit in the Biķernieki forest park on the east side of Riga, its speed ring (Ātruma aplis), clockwise, in
  // its real layout and scale: the start line on the main straight (the stands and the pits beside it on the left), the right kink and
  // the hairpin at its south end, the left after it, the climb through the woods, the right in the woods, the drop to the lake Linezers,
  // the left by the lake, the steep climb onto the dunes, the west corner, the forest straight, the north corner, the right on the climb,
  // the left over the top, the steep drop, the right before the straight and the left onto it: %(km)s km on our line (3.65 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/bikernieki/config.json: the raceway's
  // ways of the speed ring, clockwise), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south.
  // GENERATED by tools/bikernieki/build.py (edit the names, the pits, the stands and the text there).
  // Heights (BK_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, grades at most
  // 10 %%; every 10 m from the start line, decimetres above it (6.2 m a.s.l.): the straight and the lake low, the north loop on the dunes 20 m higher.
  // Scenery data for the world builder (js/world-bikernieki.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights
  // above the start line in 0.25 m steps), land cover (lc, 16 m cells: 0 grass and clearings, 1 the woods, 2 the lakes and their reedbeds,
  // 3 the paddock, the car parks and the town: OSM, ESA WorldCover, the canopy), and sk: the lakes and ponds (lakes: [name, x, z, ...]: OSM
  // natural=water), the reedbeds on the lake's shore (reeds: [x, z, ...]: OSM wetland=reedbed), the buildings by the circuit ([x, z, length,
  // width, angle (deg), height]: OSM outlines as boxes).
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const BK_H = [%(bkh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc6d2dc, sun: 0xfff2dc, sunI: 1.02, sky: 0xb8d0ea, gnd: 0x4a6232, hemiI: 0.66, tint: [0.99, 1.0, 0.98], sat: 1.0, sunOff: [-62, 66, 80], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // Riga in early summer: a clear Baltic light, the sun from the south-west, a little haze over the pines
    say: 'Biķernieki',
    grassNat: 0.4, lawn: [0.97, 1.02, 0.94],
    zivali: { a: ['roe', 'fox', 'hare'], t: ['logPile', 'fallenTree'], open: true },
    id: 'bikernieki', name: 'Biķernieki, Latvija', theme: 'bikernieki', laps: 4, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Biķernieki, Latvia', desc: %(desc_en)s },
    start: [0, 0], runoff: 0.9, inner: 3.5, side: 5.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: BK_H.map((h, i) => [i / BK_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the right kink, the hairpin, the left after it, the right in the woods, the right before the lake, the left by the lake, the west corner, the north corner, the right on the climb, the left on the top, the right before the straight, the left onto it
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.bikernieki.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: by the right before the straight, the main stands before the start line, the bleachers on the way to the hairpin
    stands: %(stands)s,
    zaslon: { d: 186, side: 1, off: 16 },   // the big screen (js/world-zaslon.js) on the right by the start (across from the pits), turned towards the cars coming (node tools/zaslon-mesto.mjs bikernieki)
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the lake, the dunes and the north loop, the drop and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), bkh=bkh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'bikernieki.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the start line);' % (hk.min() - H0, hk.max() - H0),
          'dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; lakes', len(SK['lakes']), '; buildings', len(SK['bld']) // 6)
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
