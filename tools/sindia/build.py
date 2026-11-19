# Sindia, Senegal: the game's track file from the track data (tools/sindia/sindia.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/sindia/build.py   -> js/tracks/sindia.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/sindia.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'sindia.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish and no node there; it is put by the middle of the pit building (OSM w432510630), 40 m
# after the route's first point (tools/sindia/config.json): the line and its heights rolled to start there, the origin moved onto it
S0 = 40.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O; H = np.roll(np.array(J['h']), -K0)
H0 = float(H[0])   # the start line's height above the sea (39.5 m): the game's zero

# ---- the centre line: OSM's raceway (the circuit's ways, one-way as raced: clockwise), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]
TG = np.roll(P, -1, 0) - P; ANG = np.unwrap(np.arctan2(TG[:, 1], TG[:, 0]))
KAP = np.gradient(ANG) / SEG   # the curvature at each point (1/m, + a right-hander: x east, z south)

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def off(s, d):   # [x, z] d metres to the right (negative: the left) of the line s metres after the start line
    x, z = at(s); i = int(np.searchsorted(CUM, s % LEN, 'right') - 1); t = TG[i] / np.hypot(*TG[i])
    return [round(float(x - t[1] * d), 1), round(float(z + t[0] * d), 1)]

def apex(s, side, w=35):   # the tightest point of a bend turning to side (1 right, -1 left) within w m of s
    best, bs = -1, s
    for d in np.arange(-w, w + 0.1, 1.0):
        q = (s + d) % LEN; i = int(np.searchsorted(CUM, q, 'right') - 1); k = KAP[i] * side
        if k > best: best, bs = k, s + d
    return round(float(bs) % LEN)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: the real corners are
# numbered, Tour 1 .. Tour 22 in OSM; no names of the circuit, its people, races or sponsors) ----
NAMES = [
    ('Levi na koncu ravnine', 227, ['Hard on the brakes for the left at the end of the straight!', 'Into the first left!', 'Round the left at the end of the straight!']),
    ('Levi na vrhu', 439, ['Left over the top!', 'The left at the top of the rise!', 'Through the left over the crest!']),
    ('Levi v dolino', 557, ['Left and down into the valley!', 'The left, downhill now!', 'Through the left into the valley!']),
    ('Hitra esa', 946, ['Right, left through the fast esses!', 'Flat through the esses!', 'Through the fast esses!']),
    ('Ostri desni', 1278, ['Hard on the brakes for the sharp right!', 'The sharp right!', 'Round the sharp right!']),
    ('Dolgi desni', 1460, ['The long right, down at the bottom of the valley!', 'All the way round the long right!', 'Through the long right!']),
    ('Ovinek pri baobabu', 2320, ['Right at the baobab corner!', 'Past the old baobab and right!', 'Through the baobab corner!']),
    ('Trojni ovinek', 2824, ['Right, left, right through the triple bend!', 'Over the kerbs in the triple bend!', 'Into the triple bend at the top!']),
    ('Hitri desni', 3123, ['Flat through the fast right!', 'The fast right, downhill!', 'Through the fast right-hander!']),
    ('Dolgi levi', 3424, ['The long left!', 'All the way round the long left!', 'Through the long left!']),
    ('Desni na dnu', 3960, ['The long right at the bottom!', 'Right, all the way round at the bottom!', 'Through the right at the bottom!']),
    ('Lasnica', 4265, ['Hard on the brakes for the hairpin!', 'Round the tight left hairpin!', 'The hairpin, all the way round!']),
    ('Zadnji ovinek', 4330, ['The last corner, onto the straight!', 'The right onto the main straight!', 'Through the last corner!']),
    ('Ciljna ravnina', 4470, ['Up the main straight past the pits!', 'Flat out up the straight!', 'The main straight, the lap is nearly done!']),
]
# the corners' apexes (TV towers, photographers, recovery: World.rbring): the left at the end of the straight, the left over the top, the
# left into the valley, the fast esses (2), the sharp right, the long right, the baobab corner, the triple bend (3), the fast right, the long
# left, the right at the bottom, the hairpin, the last corner ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(227, -1), (439, -1), (557, -1), (888, 1), (1004, -1), (1278, 1), (1480, 1), (2304, 1), (2758, 1), (2824, -1), (2931, 1),
                                 (3123, 1), (3424, -1), (3981, 1), (4250, -1), (4333, 1)]]

DESC = ('Dirkališče v savani pri Sindii jugovzhodno od Dakarja: 4,7 km, 21 ovinkov, v smeri urinega kazalca. S ciljne ravnine levi na koncu '
        'ravnine in levi na vrhu, levi v dolino, hitra esa, ostri in dolgi desni na dnu doline, vzpon do ovinka pri baobabu, trojni ovinek na vrhu, '
        'hitri desni, dolgi levi in desni na dnu, nato lasnica in zadnji ovinek. Ob progi suha trava, baobabi in akacije na rdečkastih peščenih tleh, '
        'boksi levo ob ciljni ravnini (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the savanna at Sindia south-east of Dakar: 4.7 km, 21 corners, clockwise. From the main straight the left at its end and the '
           'left over the top, the left into the valley, the fast esses, the sharp right and the long right at the bottom of the valley, the climb to '
           'the baobab corner, the triple bend at the top, the fast right, the long left and the right at the bottom, then the hairpin and the last '
           'corner. Dry grass, baobabs and acacias on reddish sandy ground by the track, the pits on the left of the main straight (drive in and the '
           'mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight, 14 m from the centre line (OSM w180617876: 13.5-15 m), from the
# exit of the last corner to before the left at the end of the straight (the real lane leaves before the hairpin, running inside it, and joins
# at the left over the top: here it runs along the straight only); the 13 crews' boxes by the pit building (OSM w432510630, 85 m: the game's
# is longer, 130 m, for the 13 garages every 10 m: RB_LOOK.sindia.pitBox); the pit wall 2.5 m past the road's edge (in OSM 3-4 m) ----
PIT = [-14, -260, 180, 5]
PIT_ROW = [-55, 65]
WALLS = [[-260, 180, -1, 2.5]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: a covered one facing the pits, an open one round the hairpin (not in OSM:
# the spectators' places by the main straight and the hairpin); named after the village and the region
STANDS = [[-100, 70, 1, 7, 1, 5, 0, 'SINDIA'], [4205, 4290, 1, 5, 0, 2, 0, 'THIÈS']]
SECTORS = [1480, 3000]
REAL_KM = 4.7
# a few old baobabs by the track, alone on the savanna (not in OSM; the land cover's scattered trees round them): [x, z, height] at [s, d]
BAOBABS = [(2290, -44, 19), (1255, -52, 16), (700, -55, 15), (3600, -55, 17), (4060, 62, 15)]

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the old baobabs (sk.bb) ----
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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, 0.2 m steps above the start line from -28 m (the circuit's
    # lowest point is 11 m below the start line, the plateau round it a little higher)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -28.0, 0.2; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.1, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 the savanna's dry grass, 1 shrubs and trees, 2 fields (millet, groundnuts, fallow), 3 built-up (the paddock,
    # the car parks); ESA WorldCover and the canopy height, OSM's land use (the circuit's grounds: no fields)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 20) | (wc == 10) | (ch > 3)] = 1
            cls[(wc == 40) & (ch <= 3) & (lu != 10)] = 2
            cls[((wc == 50) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 4)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the old baobabs: [x, z, height, ...]
    bb = []
    for s, d, h in BAOBABS: bb += off(s, d) + [h]
    return D, LC, dict(bb=bb), lc

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK, lc = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'sindia'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Sindia, Senegal: the circuit in the savanna at Sindia south-east of Dakar, clockwise, in its real layout and scale: the start line on the
  // main straight by the pit building (the pits on the left), the left at the end of the straight, the left over the top, the left into the
  // valley, the fast esses, the sharp right, the long right at the bottom of the valley, the climb to the baobab corner, the triple bend at
  // the top, the fast right, the long left, the right at the bottom, the hairpin and the last corner: %(km)s km on our line (4.7 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/sindia/config.json: the raceway's ways
  // in their one-way direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south.
  // GENERATED by tools/sindia/build.py (edit the names, the pits, the stands and the text there).
  // Heights (SN_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed; every 10 m from the
  // start line, decimetres above it (%(h0)s m a.s.l.): two shallow valleys, the lowest point at the right at the bottom (11 m below the start line).
  // Scenery data for the world builder (js/world-sindia.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above the
  // start line in 0.2 m steps), land cover (lc, 16 m cells: 0 the savanna's dry grass, 1 shrubs and trees, 2 fields, 3 built-up: ESA WorldCover,
  // the canopy, OSM), and sk: a few old baobabs by the track (bb: [x, z, height, ...]; not in OSM).
  // The names: plain descriptions only (no names of people, firms, events or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SN_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xe4dac8, sun: 0xfff2da, sunI: 1.14, sky: 0xb8cadb, gnd: 0x8f7a60, hemiI: 0.7, tint: [1.02, 1.0, 0.96], sat: 0.9, sunOff: [55, 80, 50], split: [[0.97, 1.0, 1.04], [1.05, 1.0, 0.93]] },   // the dry season: a high hot sun, the dust haze of the harmattan over the savanna
    say: 'Sindia', rainP: 0.05,
    grassNat: 0.6, lawn: [1.08, 0.98, 0.78],
    zivali: { a: ['cowB', 'donkey', 'egret'], t: ['palmHut', 'trough'], open: true },
    id: 'sindia', name: 'Sindia, Senegal', theme: 'sindia', laps: 3, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Sindia, Senegal', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, inner: 4.2, side: 5, gradeForce: true, elevSmooth: 10, realKm: %(real)s,
    elev: SN_H.map((h, i) => [i / SN_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the corners' apexes: the left at the end of the straight, the left over the top, the left into the valley, the fast esses (2), the sharp right, the long right, the baobab corner, the triple bend (3), the fast right, the long left, the right at the bottom, the hairpin, the last corner
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.sindia.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one facing the pits, round the hairpin
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the long right, the climb and the triple bend, the last part and the straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.environ.get('SINDIA_OUT') or os.path.join(ROOT, 'js', 'tracks', 'sindia.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(np.diff(H)).max() / STEP * 100),
          D['nx'], 'x', D['nz'], '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(), '; turns', TURNS)
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
