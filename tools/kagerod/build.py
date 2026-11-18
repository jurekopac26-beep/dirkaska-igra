# Kågeröd, Švedska: the game's track file from the track data (tools/kagerod/kagerod.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/kagerod/build.py   -> js/tracks/kagerod.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (A2), the track: docs/proge/kagerod.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'kagerod.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (79.6 m): the game's zero

# ---- the centre line: OSM's raceway (way 229220546, the closed loop, in its node order: clockwise), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms or the circuit (CLAUDE.md, Pravna varnost) ----
NAMES = [
    ('Dvojni desni', 395, ['Into the double right at the end of the straight!', 'Right, and right again, round the double right!', 'Hard on the brakes for the double right!']),
    ('Dolgi desni', 760, ['The long right, round the paddock!', 'Holding it through the long right!', 'Round the long right-hander!']),
    ('Hitri levi', 880, ['Flat through the fast left!', 'The fast left, down towards the hill!', 'Through the fast left-hander!']),
    ('Levi pod klancem', 1045, ['The tight left at the foot of the hill!', 'Hard left, below the hill!', 'Round the left below the hill!']),
    ('Klanec', 1120, ['Up the hill now!', 'Climbing towards the hairpin!', 'Full throttle up the hill!']),
    ('Lasnica na vrhu', 1205, ['The hairpin at the top of the hill!', 'Right round the hilltop hairpin!', 'Slow, slow, round the hairpin at the top!']),
    ('Levi na spustu', 1330, ['Left on the way down!', 'The downhill left, careful over the crest!', 'Through the left on the descent!']),
    ('Desni nad reko', 1470, ['Right, and over the river!', 'The right over the little river!', 'Through the right over the river!']),
    ('Gozdni ovinek', 1650, ['The forest corner, deep in the trees!', 'Right round the forest corner!', 'Round the long forest corner!']),
    ('Levi ob reki', 1775, ['Left by the river, back over the water!', 'Hard left by the river!', 'Round the river left!']),
    ('Zadnji ovinek', 1880, ['The last corner, onto the straight!', 'The fast right onto the finish straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 2010, ['Down the finish straight past the pits!', 'Flat out along the finish straight, the river beside it!', 'The finish straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the double right (2), the long right, the fast left, the left below
# the hill, the hilltop hairpin, the downhill left, the right over the river, the forest corner (2), the river left, the last corner
TURNS = [350, 400, 760, 880, 1045, 1205, 1330, 1470, 1620, 1670, 1775, 1880]

DESC = ('Kratko dirkališče v gozdu ob reki Vege å pri Kågerödu v Skåniji: 2,1 km v smeri urinega kazalca, z vzponi in spusti. '
        'Ciljna ravnina ob reki, dvojni desni na njenem koncu, dolgi desni okoli depoja, ostri levi pod klancem, vzpon do lasnice na vrhu in spust, '
        'nato dvakrat čez reko skozi gozdni ovinek in zadnji ovinek nazaj na ravnino. Ob progi bukov in smrekov gozd, reka, travniki in polja, '
        'boksi ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A short circuit in the woods by the Vege å river at Kågeröd in Skåne: 2.1 km, clockwise, up and down a hillside. '
           'The finish straight along the river, the double right at its end, the long right round the paddock, the tight left below the hill, '
           'the climb to the hairpin at the top and the run back down, then twice over the river through the forest corner and the last corner '
           'onto the straight. Beech and spruce woods, the river, meadows and fields by the track, the pits along the finish straight '
           '(drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the finish straight (OSM: way 401177312, highway=raceway, ~10 m from the centre
# line; here 14 m, as on the other circuits), from the exit of the last corner to before the double right (the real lane leaves the circuit in
# the last corner and joins it before the double right); the 13 crews' boxes and the garages by the start line; the pit wall 2.5 m past the
# road's edge ----
PIT = [14, -165, 300, 10]   # (the player's box: the 7th crew's, in front of the middle garage, 5 .. 15 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-55, 65]
PIT_BOX = [-55, 75, 1]   # (the garages: World's RB_LOOK.kagerod.pitBox)
# the pit wall along the lane; the barriers held this side of the river where it runs by the circuit (def.sk.river): left of the double
# right at the end of the straight, left of the right over
# the river (it comes out from under the road there), right of the left by the river, left of the last corner (it runs along the outside)
WALLS = [[-165, 300, 1, 2.5], [290, 380, -1, 12, 20], [1478, 1512, -1, 8, 15], [1745, 1790, 1, 7, 15], [1810, 1960, -1, 4, 20]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the banks of seats on the grass above the long right and outside the hilltop hairpin
STANDS = [[640, 690, -1, 6, 0, 2, 0, 'KÅGERÖD'], [1150, 1185, -1, 6, 0, 2, 0, 'SKÅNE']]
SECTORS = [700, 1400]
REAL_KM = 2.1

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the river (sk.river), the buildings (sk.bld) ----
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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -20 m (the
    # valley of the Vege å 17 m below the start line, the hills to the north-east 29 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (meadows, grass, the river's banks), 1 forest (beech, spruce), 2 fields (crops), 3 built-up (the paddock,
    # the car parks); OSM's land use first, ESA WorldCover and the canopy height for the rest
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
    # the river: the Vege å from upstream (east of the circuit) to downstream (north-west), one line through its two culverts under the
    # circuit ([x, z, ...] in 0.5 m; OSM waterway=river, the culverts tunnel=yes); World finds the culverts where the line is under the road
    pieces = [w[3] for w in J['water'] if w[1] == 'Vege å']
    ends = {}
    for pc in pieces: ends[(pc[0], pc[1])] = pc
    finish = set((pc[-2], pc[-1]) for pc in pieces)
    head = [pc for pc in pieces if (pc[0], pc[1]) not in finish][0]   # (the piece whose start is no other piece's end: upstream)
    riv = list(head); seen = {id(head)}
    while True:
        nxt = ends.get((riv[-2], riv[-1]))
        if nxt is None or id(nxt) in seen: break
        seen.add(id(nxt)); riv += nxt[2:]
    river = [round(v * 2) / 2 for v in riv]
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not where the game's pit lane runs
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if -175 < (s if s < LEN - 200 else s - LEN) < 310 and 0 < d < 14 + 6 + math.hypot(l, w) / 2: continue   # (in the way of the pit lane: the game's lane is wider than the real one)
        hh = 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    return D, LC, dict(river=river, bld=bld)

def build_track():
    hk = H[::2]; kgh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'kagerod'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Kågeröd, Sweden: the circuit in the woods by the Vege å river west of Kågeröd (Svalöv, Skåne), clockwise, in its real layout and scale:
  // the start line on the finish straight along the river (OSM raceway=start-finish), the pits beside it on the right, the double right at the
  // end of the straight, the long right round the paddock, the fast left, the tight left below the hill, the climb to the hairpin at the top,
  // the left on the way down, the right over the river, the forest corner, the left by the river (over it again) and the last corner onto
  // the straight: %(km)s km on our line (2.1 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/kagerod/config.json: the raceway's way
  // 229220546 in its node order, clockwise), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south.
  // GENERATED by tools/kagerod/build.py (edit the names, the pits, the stands and the text there).
  // Heights (KG_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (79.6 m a.s.l.): the straight and the double right by the river, the hairpin at the top 12 m higher.
  // Scenery data for the world builder (js/world-kagerod.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 meadows and grass, 1 the woods, 2 fields, 3 the paddock and the car parks:
  // OSM, ESA WorldCover, the canopy), and sk: the river Vege å from upstream to downstream ([x, z, ...]: OSM waterway=river; it goes under the
  // circuit twice, in culverts), the buildings by the circuit ([x, z, length, width, angle (deg), height]: OSM outlines as boxes).
  // The names: plain descriptions only (no names of people, firms, events or the circuit, nor of the castle it is named after).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const KG_H = [%(kgh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc4d2dc, sun: 0xfff3de, sunI: 1.04, sky: 0xbcd4ec, gnd: 0x4c6634, hemiI: 0.66, tint: [0.99, 1.0, 0.98], sat: 1.02, sunOff: [-64, 68, 78], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // Skåne in early summer: a clear northern light, the sun from the south-west, a little haze over the fields
    say: 'Kågeröd',
    grassNat: 0.35, lawn: [0.96, 1.02, 0.94],
    zivali: { a: ['roe', 'boar', 'fox', 'hare'], t: ['huntStand', 'logPile', 'fallenTree'], open: true },
    id: 'kagerod', name: 'Kågeröd, Švedska', theme: 'kagerod', laps: 6, halfWidth: 5.5,
    maxRivals: 80,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the shortest circuit, its flying start's column (4/5 of a lap at most) would stand car on car with more (85 already do, the formula cars)
    desc: %(desc)s,
    en: { name: 'Kågeröd, Sweden', desc: %(desc_en)s },
    start: [0, 0], runoff: 0.9, inner: 3.5, side: 5.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,   // (the run-offs narrower than at Silkeborg: a tight circuit in the woods)
    elev: KG_H.map((h, i) => [i / KG_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the double right (2), the long right, the fast left, the left below the hill, the hilltop hairpin, the downhill left, the right over the river, the forest corner (2), the river left, the last corner
    pit: %(pit)s,   // pit lane on the right of the finish straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitLanes: [15, 15],   // the way in right after the last corner, the way out 24 m before the double right: no room for a deceleration or acceleration lane, only the taper (Core.Track.pitJ)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.kagerod.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane; the barriers this side of the river where it runs by the circuit
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: on the grass above the long right and outside the hilltop hairpin
    stands: %(stands)s,
    zaslon: { d: 636, side: -1, off: 22 },   // the big screen (js/world-zaslon.js) by the grandstand on the left, turned towards the cars coming (node tools/zaslon-mesto.mjs kagerod)
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the long right, the hill, the river loop and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), kgh=kgh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', '),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'kagerod.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; river', len(SK['river']) // 2, 'points; buildings', len(SK['bld']) // 6)
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
