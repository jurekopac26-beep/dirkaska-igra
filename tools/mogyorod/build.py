# Mogyoród, Madžarska: the game's track file from the track data (tools/mogyorod/mogyorod.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/mogyorod/build.py   -> js/tracks/mogyorod.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/mogyorod.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'mogyorod.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish and no node there; the sources give 610 m from pole to the first corner's apex, so it is
# 212 m after the route's first point (tools/mogyorod/config.json): the line and its heights rolled to start there, the origin moved onto it
S0 = 212.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O; H = np.roll(np.array(J['h']), -K0)
H0 = float(H[0])   # the start line's height above the sea (236.4 m): the game's zero

# ---- the centre line: OSM's raceway (ways 231328650 and 1333262244, the layout since 2003), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions and place names only; the real corners named after people
# get descriptions (CLAUDE.md, Pravna varnost); Buda, Pest and the Danube are the real corners' geographic names ----
NAMES = [
    ('Desna lasnica', 613, ['Hard on the brakes for the right hairpin!', 'Down the hill into the right hairpin!', 'Round the right hairpin!']),
    ('Levi v dolino', 1078, ['Left and down into the valley!', 'The long left, downhill!', 'Through the left into the valley!']),
    ('Ovinek pri izviru', 1308, ['The spring corner, a quick right!', 'Right at the spring corner!', 'Through the spring corner!']),
    ('Slepi levi', 1783, ['Over the crest into the blind left!', 'The blind left, flat out over the top!', 'Through the blind left!']),
    ('Dolgi desni', 2050, ['The long right, holding it all the way round!', 'All the way round the long right!', 'Through the long right!']),
    ('Šikana', 2373, ['Right, left through the chicane!', 'Over the kerbs in the chicane!', 'Into the chicane!']),
    ('Ovinek Buda', 2573, ['Left at the Buda corner!', 'Into the Buda corner!', 'Through Buda!']),
    ('Ovinek Pešta', 2708, ['Right at the Pest corner!', 'Into the Pest corner!', 'Through Pest!']),
    ('Ovinek Donava', 2921, ['The Danube corner, a fast left!', 'Left through the Danube corner!', 'Round the Danube corner!']),
    ('Hitri desni', 3078, ['Flat through the fast right!', 'The fast right, down in the dip!', 'Through the fast right-hander!']),
    ('Ostri desni', 3498, ['Hard on the brakes for the sharp right!', 'The sharp right!', 'Round the sharp right!']),
    ('Leva lasnica', 3768, ['The left hairpin, all the way round!', 'Round the long left hairpin!', 'Left, and left again, round the hairpin!']),
    ('Zadnji ovinek', 4043, ['The last corner, onto the straight!', 'The long right onto the main straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 4260, ['Down the main straight past the pits!', 'Flat out down the long straight!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring), the real 14 turns: the right hairpin, the left into the valley, the
# spring corner, the blind left, the long right, the chicane (2), Buda, Pest, the Danube, the fast right, the sharp right, the left hairpin,
# the last corner
TURNS = [613, 1078, 1308, 1783, 2050, 2353, 2393, 2573, 2708, 2921, 3078, 3498, 3768, 4043]

DESC = ('Dirkališče v gričih pri Mogyoródu severovzhodno od Budimpešte: 4,4 km, 14 ovinkov in 800 m dolga ciljna ravnina navzdol do desne lasnice. '
        'Levi v dolino, ovinek pri izviru, slepi levi čez vrh, dolgi desni, šikana in ovinki Buda, Pešta in Donava, nato ostri desni, leva lasnica '
        'in dolgi zadnji ovinek. Ob progi suha poletna trava, polja, vinogradi in listnati gozd, velika pokrita tribuna nasproti boksov (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the hills at Mogyoród north-east of Budapest: 4.4 km, 14 corners and an 800 m main straight down to the right hairpin. '
           'The left into the valley, the spring corner, the blind left over the crest, the long right, the chicane and the Buda, Pest and Danube '
           'corners, then the sharp right, the left hairpin and the long last corner. Dry summer grass, fields, vineyards and broadleaved woods by '
           'the track, the big covered grandstand facing the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 18 m from the centre line, from the exit of the last corner
# to before the right hairpin (the real lane leaves before the last corner and joins after the hairpin: here it runs along the straight
# only); the 13 crews' boxes in the middle of the real pit building (s -38 .. 273, OSM w123905481: the garages, RB_LOOK.mogyorod.pitBox);
# the pit wall 2.5 m past the road's edge ----
PIT = [18, -250, 440, 80]
PIT_ROW = [20, 140]
WALLS = [[-250, 440, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM): the big covered one facing the pits, the two on the short straight
# before the sharp right and the one at the last corner; named after the towns round the circuit
STANDS = [[-30, 240, -1, 10, 1, 9, 0, 'MOGYORÓD'], [3245, 3350, -1, 7, 0, 3, 0, 'GÖDÖLLŐ'], [4015, 4065, -1, 7, 0, 2, 0, 'FÓT']]
SECTORS = [1450, 3000]
REAL_KM = 4.381

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings (sk.bld), the fences (sk.fence) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):   # X, Z in the game's frame (origin the start line): the grids are in the tool's (origin the route's first point)
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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, 0.25 m steps above the start line from -48 m (the circuit's
    # lowest point is 35 m below the start line, the hills round it rise above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -48.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (grass, meadows, the circuit's own grounds), 1 woods, 2 fields, vineyards and orchards, 3 built-up and
    # car parks; OSM's land use first, ESA WorldCover and the canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (ch > 5)] = 1
            cls[(wc == 40) & (ch <= 5)] = 2
            cls[(wc == 50) & (ch <= 6)] = 3
            cls[lu == 9] = 1; cls[(lu == 8) & (ch > 6)] = 1
            cls[((lu == 3) | (lu == 5) | (lu == 7)) & (ch <= 5)] = 2
            cls[((lu == 4) | (lu == 10) | (lu == 12)) & (ch <= 5)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building and the grandstands
    # (the game's own stand there: RB_LOOK.mogyorod.pitBox, def.stands)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        sn = (s - S0) % LEN
        if l > 200: continue                                                   # (the pit building, the covered grandstand)
        if l > 40 and d < 0 and (3200 < sn < 3400 or 4000 < sn < 4100): continue   # (the grandstands: def.stands)
        hh = hgt or (7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2)
        xx, zz = mv([x, z]); bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the fences round the circuit (OSM barrier=fence, within 30 m): [x, z, ...]
    fence = [mv(w[3]) for w in J['walls'] if w[0] == 'fence']
    return D, LC, dict(bld=bld, fence=fence)

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'mogyorod'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Mogyoród, Hungary: the circuit in the hills at Mogyoród north-east of Budapest, its layout since 2003, clockwise, in its real layout and
  // scale: the start line on the main straight (610 m from pole to the right hairpin's apex), the pits beside it on the right, the downhill
  // run to the right hairpin, the left into the valley, the spring corner, the blind left over the crest, the long right, the chicane, the
  // Buda, Pest and Danube corners, the fast right, the sharp right, the left hairpin and the long last corner: %(km)s km on our line (4.381 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/mogyorod/config.json: the raceway's ways
  // 231328650 and 1333262244 in their one-way direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east,
  // z south. GENERATED by tools/mogyorod/build.py (edit the names, the pits, the stands and the text there).
  // Heights (MG_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (%(h0)s m a.s.l.): the main straight runs down to the hairpin, the lowest point in the valley by the spring corner (33.5 m below the start line).
  // Scenery data for the world builder (js/world-mogyorod.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 grass and meadows, 1 woods, 2 fields, vineyards and orchards, 3 built-up and car
  // parks: OSM, ESA WorldCover, the canopy), and sk: the buildings by the circuit ([x, z, length, width, angle (deg), height]: OSM outlines as
  // boxes, not the pit building and the grandstands, which the builder makes) and the fences ([x, z, ...]: OSM barrier=fence).
  // The names: plain descriptions and place names only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const MG_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd6dae0, sun: 0xfff0d2, sunI: 1.12, sky: 0xb4cdea, gnd: 0x6a6838, hemiI: 0.66, tint: [1.02, 1.0, 0.95], sat: 1.0, sunOff: [-60, 78, 56], split: [[0.97, 1.0, 1.04], [1.04, 1.0, 0.95]] },   // the Pannonian summer: a high hot sun, a light haze over the dry hills
    say: 'Mogyoród',
    grassNat: 0.55, lawn: [1.02, 0.98, 0.84],
    zivali: { a: ['roe', 'hare', 'fox'], t: ['huntStand', 'logPile', 'fallenTree'], open: true },
    id: 'mogyorod', name: 'Mogyoród, Madžarska', theme: 'mogyorod', laps: 3, halfWidth: 6.5,
    desc: %(desc)s,
    en: { name: 'Mogyoród, Hungary', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 4.2, side: 5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: MG_H.map((h, i) => [i / MG_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions and place names, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the right hairpin, the left into the valley, the spring corner, the blind left, the long right, the chicane (2), Buda, Pest, the Danube, the fast right, the sharp right, the left hairpin, the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.mogyorod.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one facing the pits, on the short straight before the sharp right, at the last corner
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the spring corner, through the hills to the Danube corner, the last part and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'mogyorod.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f); dem' % (H0, H.min() - H0, H.max() - H0), D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6, 'fences', len(SK['fence']))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
