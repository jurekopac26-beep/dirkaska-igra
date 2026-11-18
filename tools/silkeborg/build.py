# Silkeborg, Danska: the game's track file from the track data (tools/silkeborg/silkeborg.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/silkeborg/build.py   -> js/tracks/silkeborg.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (A1), the track: docs/proge/silkeborg.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'silkeborg.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (61.7 m): the game's zero

# ---- the centre line: OSM's raceway (ways 102145330 and 338068116, the long layout of 2003), its nodes' corners rounded (sigma 5 m) ----
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
    ('Dvojni levi', 215, ['Into the double left, hard on the brakes!', 'The double left, two bites at it!', 'Round the double left!']),
    ('Hitri desni', 475, ['Flat through the fast right!', 'The fast right, past the sand!', 'Through the fast right-hander!']),
    ('Ovinek pri tribunah', 615, ['The grandstand corner, the crowd is right there!', 'Hard left by the grandstands!', 'Round the grandstand corner!']),
    ('Dvojni desni', 765, ['Into the double right!', 'Right, and right again!', 'The double right, tight and twisty!']),
    ('S-zavoji', 1000, ['Left, then right, through the esses!', 'Into the esses!', 'Flicking through the esses!']),
    ('Gozdni ovinek', 1285, ['The forest corner, the pines close in!', 'Left at the forest corner!', 'Round the forest corner!']),
    ('Dolgi levi', 1420, ['The long left, along the bottom of the circuit!', 'Holding it through the long left!', 'Round the long left!']),
    ('Ovinek pri gomili', 1635, ['Barrow corner, by the old burial mound!', 'Hard left at the barrow!', 'Round barrow corner!']),
    ('Ovinek ob resavi', 1805, ['Right at the heath corner!', 'The heath corner, over the sand and heather!', 'Through the heath corner!']),
    ('Zadnji ovinek', 1985, ['The last corner, onto the straight!', 'The fast left onto the finish straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 2150, ['Down the finish straight past the pits!', 'Flat out along the finish straight!', 'The finish straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): T1, T2, the kink, the grandstand corner, the double right (2), the
# esses (2), the forest corner, the long left, the barrow corner, the heath corner, the right before the last corner, the last corner
TURNS = [215, 300, 475, 615, 765, 862, 990, 1100, 1285, 1420, 1635, 1805, 1875, 1985]

DESC = ('Kratko, zavito dirkališče na peščeni resavi pri Silkeborgu na Jutlandiji: 2,3 km, 16 ovinkov in skoraj brez ravnih odsekov. '
        'Dvojni levi na koncu ciljne ravnine, ostri levi pri tribunah, dvojni desni in S-zavoji na notranjem delu, dolgi levi ob borovem gozdu, '
        'ovinek pri prazgodovinski gomili in hitri zadnji ovinek. Ob progi pesek, resa in borovci, boksi ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A short, twisty circuit on the sandy heath by Silkeborg in Jutland: 2.3 km, 16 corners and hardly a straight. '
           'The double left at the end of the finish straight, the hard left by the grandstands, the double right and the esses in the infield, '
           'the long left along the pine woods, the corner by the prehistoric burial mound and the fast last corner. Sand, heather and pines '
           'by the track, the pits along the finish straight (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the finish straight, 14 m from the centre line, from the exit of the last corner to
# before the double left (the real lane leaves before the last corner and joins in the double left: here it runs along the straight only);
# the 13 crews' boxes and the garages where the real pit building is (s -20 .. 82); the pit wall 2.5 m past the road's edge ----
PIT = [14, -200, 165, 25]
PIT_ROW = [-40, 80]
PIT_BOX = [-40, 90, 1]   # (the garages: World's RB_LOOK.silkeborg.pitBox)
WALLS = [[-200, 165, 1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the two by the double left and the four along the run to the grandstand corner (OSM)
STANDS = [[195, 240, 1, 7, 0, 2, 0, 'SKELLERUP'], [535, 600, 1, 7, 0, 4, 0, 'HÅRUP']]
SECTORS = [750, 1500]
REAL_KM = 2.3

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the sand (sk.sand), the burial mounds (sk.mounds), the buildings (sk.bld) ----
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
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, 0.25 m steps above the start line from -42 m
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -42.0, 0.25; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (grass, fields, sand), 1 forest (the plantations), 2 heath and scrub, 3 built-up and car parks;
    # OSM's land use first (the circuit's grass and sand are OSM's), ESA WorldCover and the canopy height for the rest
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (ch > 5)] = 1
            cls[(wc == 20) | (wc == 90) | (wc == 100)] = 2
            cls[(wc == 50) & (ch <= 6)] = 3
            cls[lu == 9] = 1; cls[(lu == 8) & (ch <= 6)] = 2; cls[(lu == 8) & (ch > 6)] = 1
            cls[(lu == 4) | (lu == 3) | (lu == 12) | (lu == 10)] = 0
            cls[((lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 6)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    pl = lambda fl: [round(v * 2) / 2 for v in fl]
    sand = [pl(sh[1]) for sh in J['shore'] if sh[0] == 'sand']
    # the burial mounds (OSM: historic=archaeological_site, tumulus): [x, z, radius, height]; Bronze Age barrows here are 15-25 m across and 2-3 m high
    mounds = []
    for lat, lon, r, h in [(56.1735831, 9.6605211, 9, 2.2), (56.1721177, 9.6648402, 10, 2.6), (56.1708988, 9.6594236, 9, 2.0)]:
        la = math.radians(J['lat0']); a = 6378137.0; e2 = 6.69437999014e-3
        Mr = a * (1 - e2) / (1 - e2 * math.sin(la) ** 2) ** 1.5; Nr = a / math.sqrt(1 - e2 * math.sin(la) ** 2)
        x = math.radians(lon - J['lon0']) * Nr * math.cos(la); z = -math.radians(lat - J['lat0']) * Mr
        mounds.append([round(x, 1), round(z, 1), r, h])
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building's two (the game's own
    # pit building stands there: RB_LOOK.silkeborg.pitBox), nor the six grandstands (def.stands)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if abs(l - 11.9) < 0.2 and abs(w - 7.5) < 0.2: continue   # (the grandstands)
        if s < 100 and 20 < d < 35: continue                      # (the pit building)
        hh = 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the fences round the circuit and the spectators' banks (OSM barrier=fence, within 30 m): [x, z, ...]
    fence = [pl(w[3]) for w in J['walls'] if w[0] == 'fence']
    return D, LC, dict(sand=sand, mounds=mounds, bld=bld, fence=fence)

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'silkeborg'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Silkeborg, Denmark: the circuit on the heath at Skellerup east of Silkeborg (Jutland), its long layout of 2003, anticlockwise, in its real
  // layout and scale: the start line on the finish straight (OSM raceway=start-finish), the pits beside it on the right, the double left, the
  // run along the grandstands to the grandstand corner, the infield (the double right, the esses), the forest corner, the long left along the
  // south, the corner by the burial mound, the heath corner and the fast last corner onto the straight: %(km)s km on our line (2.3 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/silkeborg/config.json: the raceway's ways
  // 102145330 and 338068116 in their one-way direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east,
  // z south. GENERATED by tools/silkeborg/build.py (edit the names, the pits, the stands and the text there).
  // Heights (SK_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (61.7 m a.s.l.): nearly flat, the south loop 3 m lower.
  // Scenery data for the world builder (js/world-silkeborg.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.25 m steps), land cover (lc, 16 m cells: 0 grass, fields and sand, 1 the pine and spruce plantations, 2 heath and scrub,
  // 3 built-up and car parks: OSM, ESA WorldCover, the canopy), and sk: the sand round the circuit ([x, z, ...] outlines: OSM natural=sand), the
  // three burial mounds of the Bronze Age ([x, z, radius, height]: OSM historic=archaeological_site), the buildings by the circuit ([x, z,
  // length, width, angle (deg), height]: OSM outlines as boxes, not the pit building and the grandstands, which the builder makes), the fences.
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SK_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc8d4de, sun: 0xfff2dc, sunI: 1.06, sky: 0xc4d8ee, gnd: 0x56603a, hemiI: 0.64, tint: [1.0, 1.0, 0.98], sat: 1.0, sunOff: [-70, 66, 74], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // Jutland in late summer: a clear northern light, low sun from the south-west, a little haze
    say: 'Silkeborg',
    grassNat: 0.5, lawn: [0.98, 1.0, 0.9],
    zivali: { a: ['roe', 'hare', 'fox'], t: ['huntStand', 'logPile', 'fallenTree'], open: true },
    id: 'silkeborg', name: 'Silkeborg, Danska', theme: 'silkeborg', laps: 6, halfWidth: 5.5,
    desc: %(desc)s,
    en: { name: 'Silkeborg, Denmark', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4, side: 7, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: SK_H.map((h, i) => [i / SK_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the double left (2), the fast right, the grandstand corner, the double right (2), the esses (2), the forest corner, the long left, the barrow corner, the heath corner (2), the last corner
    pit: %(pit)s,   // pit lane on the right of the finish straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.silkeborg.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: by the double left and along the run to the grandstand corner
    stands: %(stands)s,
    zaslon: { d: 84, side: -1, off: 17.5 },   // the big screen (js/world-zaslon.js) on the left by the start (across from the pits), turned towards the cars coming (node tools/zaslon-mesto.mjs silkeborg)
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the grandstand corner, the infield and the forest, the south loop and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace(',', ', ').replace('[[', '[[').replace('], [', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'silkeborg.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; sand', len(SK['sand']), 'mounds', len(SK['mounds']), 'buildings', len(SK['bld']) // 6, 'fences', len(SK['fence']))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
