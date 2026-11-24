# Envalira, Andora: the game's track file from the track data (tools/envalira/envalira.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/envalira/build.py   -> js/tracks/envalira.js (centre line, heights, names, terrain, land cover, buildings)
# Edit the names and the text here, not in the generated file. The track: docs/proge/envalira.md; on ice (def.ice): docs/dez-sneg.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'envalira.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); NP = len(RAW)
H0 = float(H[0])   # the start line's height above the sea (2372.9 m): the game's zero

# ---- the centre line: OSM's raceway (way 330829785, the ice ring under the pass), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms or the ice circuit (CLAUDE.md, Pravna varnost) ----
NAMES = [
    ('Prva lasnica', 115, ['Into the first hairpin, gently on the ice!', 'The long right hairpin, feather the throttle!', 'Round the first hairpin, sliding wide!']),
    ('Levi lok', 210, ['The left-hand sweep, let it slide!', 'Through the left sweep on the ice!', 'Holding the slide through the left!']),
    ('S-zavoji', 330, ['Right, then left, through the esses!', 'Flicking it through the esses on the ice!', 'Into the esses, sideways!']),
    ('Druga lasnica', 455, ['The second hairpin, the long right!', 'All the way round the second hairpin!', 'Round the long right, between the snow banks!']),
    ('Ciljna ravnina', 650, ['Down the straight to the line!', 'Onto the straight, careful on the throttle!', 'The straight, the lap is nearly done!']),
]
# the corners' apexes (World.rbring): the first hairpin, the left sweep, the esses (right, left), the kink left, the second hairpin
TURNS = [115, 210, 305, 360, 425, 455]

DESC = ("Krog na ledu pod prelazom Port d'Envalira v Andori, na 2.370 m nad morjem: 730 m zaledenele ceste med snežnimi nasipi. "
        'Dve dolgi desni lasnici, levi lok in S-zavoji, nato kratka ravnina do cilja. Oprijem je le okoli petine suhega asfalta: '
        'zavore, plin in volan z občutkom, avto drsi. Naokoli sneg in gore Pirenejev, ob progi nekaj stavb.')
DESC_EN = ("An ice circuit under the Port d'Envalira pass in Andorra, 2,370 m above the sea: 730 m of frozen road between snow banks. "
           'Two long right hairpins, a left sweep and the esses, then a short straight to the line. The grip is only about a fifth of dry tarmac: '
           'brake, throttle and steer with feeling, the car slides. Snow and the Pyrenees all round, a few buildings by the track.')

SECTORS = [245, 490]
REAL_KM = 0.73

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
    M = 700; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, above the start line in 1.5 m steps (the mountains
    # round the pass: 190 m below the ring to 150 m above it; World reads one byte a cell)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -240.0, 1.5; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the pastures and the bare slopes under the snow), 3 built-up and car parks (OSM, ESA WorldCover);
    # no forest up here (2,370 m, above the mountain pines of the valley)
    g1, a1 = grid('lc'); g2, a2 = grid('lu')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 50] = 3; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the ring (OSM, within 60 m): [x, z, length, width, angle (deg), height]; OSM gives one height (4.5 m), the others by size
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        hh = hgt if hgt > 0 else 7.0 if l * w > 300 else 4.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    return D, LC, dict(bld=bld)

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = """/* Track definition 'envalira'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Envalira, Andorra: the ice ring under the pass of Port d'Envalira (2,408 m), on the shoulder above the pass road, clockwise, in its real
  // layout and scale: the start line where OSM's way begins, the first long right hairpin, the left sweep, the esses, the second long right
  // hairpin and the straight back to the line: %(km)s km on our line (0.73 km). On ice in every season (def.ice: Core's COLD.ice, docs/dez-sneg.md),
  // between snow banks 2.5 m past the road's edge (def.edgeBar), no kerbs, no gravel, no pits.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/envalira/config.json: the raceway's way
  // 330829785 in its node order), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south.
  // GENERATED by tools/envalira/build.py (edit the names and the text there).
  // Heights (EV_H): Copernicus DEM GLO-30 less the buildings (OSM), smoothed; every 10 m from the start line, decimetres above it (2,372.9 m
  // a.s.l.): nearly level, 10 m between the lowest and the highest point.
  // Scenery data for the world builder (js/world-envalira.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 1.5 m steps), land cover (lc, 16 m cells: 0 open, 3 built-up and car parks: OSM, ESA WorldCover), and sk: the buildings by
  // the ring ([x, z, length, width, angle (deg), height]: OSM outlines as boxes).
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const EV_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xdfe8f2, sun: 0xfff6ea, sunI: 1.12, sky: 0x8fb6e6, gnd: 0xd8dde6, hemiI: 0.72, tint: [0.98, 1.0, 1.03], sat: 0.96, sunOff: [60, 58, 80], split: [[0.97, 1.0, 1.05], [1.03, 1.0, 0.97]] },   // the Pyrenees in winter at 2,400 m: a deep blue sky, the low sun from the south, bright snow, clear air
    say: 'Envalira',
    zivali: { a: ['fox'], t: [], open: true },
    id: 'envalira', name: 'Envalira, Andora', theme: 'envalira', laps: 8, halfWidth: 5, ice: true,
    desc: %(desc)s,
    en: { name: 'Envalira, Andorra', desc: %(desc_en)s },
    maxRivals: 21,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): the shortest circuit (0.72 km): with more its flying start's column would stand car on car
    start: [0, 0], edgeBar: 2.5, noCurbs: true, noGravel: true, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: EV_H.map((h, i) => [i / EV_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the first hairpin, the left sweep, the esses (2), the kink, the second hairpin
    stands: [],
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the left sweep, the esses and the second hairpin, the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
""" % dict(km='%.2f' % (LEN / 1000), skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'envalira.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights; dem', D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'],
          len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6)

if __name__ == '__main__':
    build_track()
