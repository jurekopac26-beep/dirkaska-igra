# Aguascalientes, Mehika: the game's track file from the track data (tools/aguascalientes/aguascalientes.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/aguascalientes/build.py   -> js/tracks/aguascalientes.js (centre line, heights, names, pits, stands, terrain, land cover, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md, the track: docs/proge/aguascalientes.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'aguascalientes.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: the data's first point is the start (OSM has no finish-line node: the apex of the dogleg of the front straight,
# n1954783786), so the line stays as it is; everything moved so that the finish line is the origin ----
K0 = 0; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway way of the oval (w184905703), counter-clockwise as raced, its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (a grey opening and closing: the trees' and the buildings' remains by the road), smoothed (sigma 30 m): the
# high plateau ~1860 m above the sea; the front straight level, grades at most 1.5 % (an oval: nearly flat) ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.015 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-230 / STEP)); i1 = int(round(200 / STEP)); a = h[i0]; b = h[i1]   # the front straight level from Turn 4 to Turn 1
    for i in range(i0, i1 + 1): h[i] = a + (b - a) * (i - i0) / (i1 - i0)
    for _ in range(400):
        d = np.roll(h, -1) - h; ex = np.clip(np.abs(d) - cap, 0, None) * np.sign(d) / 2
        if not np.any(ex): break
        h += ex; h -= np.roll(ex, 1)
    return ndimage.gaussian_filter1d(h, 2.0, mode='wrap')
H = heights()
H0 = float(H[0])   # the finish line's height above the sea: the game's zero

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races or the circuit
# (CLAUDE.md, Pravna varnost); four lefts in two half circles, the back straight, the dogleg of the front straight ----
NAMES = [
    ('Prvi levi', 330, ['Into Turn 1, the first of the lefts!', 'Down into Turn 1!', 'Turn 1, keep it low on the line!']),
    ('Drugi levi', 450, ['Through Turn 2 onto the back straight!', 'Out of Turn 2, foot down!', 'Turn 2, the exit matters here!']),
    ('Zadnja ravnina', 640, ['Flat out down the back straight!', 'The back straight, look for the draft!', 'Side by side down the back straight!']),
    ('Tretji levi', 900, ['Into Turn 3!', 'Brake and turn in for Turn 3!', 'Turn 3, the far end of the oval!']),
    ('Četrti levi', 1000, ['Turn 4, the last of the lefts!', 'Through Turn 4 towards the line!', 'Out of Turn 4 onto the front straight!']),
    ('Lomljena ravnina', 1240, ['Through the dogleg of the front straight!', 'The kink in front of the grandstand!', 'Flat through the dogleg!']),
]
# the apexes of Turns 1-4 (their number boards): the two half circles at the ends of the oval
TURNS = [330, 450, 900, 1000]

DESC = ('Oval na visoki planoti južno od mesta Aguascalientes v osrednji Mehiki: 1,34 km v nasprotni smeri urinega kazalca, štirje levi '
        'zavoji v dveh polkrogih, ravnina zadaj in lomljena ciljna ravnina mimo glavne tribune, okoli 1860 m nad morjem. Suha trava, '
        'grmičevje in redka drevesa, polja in nizki griči na obzorju, boksi v notranjosti ovala (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('An oval on the high plateau south of the city of Aguascalientes in central Mexico: 1.34 km, counter-clockwise, four lefts in two '
           'half circles, the back straight and the dogleg of the front straight past the main grandstand, about 1860 m above the sea. Dry '
           'grass, scrub and a few trees, fields and low hills on the horizon, the pits inside the oval (drive in and the mechanics fix the car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the front straight, inside the oval (OSM's pit lane w677361305 runs from Turn 4
# behind the dogleg and along the inside of Turns 1 and 2: here beside the front straight, 15 m from the centre line), from Turn 4's exit
# to Turn 1; the 13 crews' boxes along the garages, the player's the 7th; the pit wall 2.5 m past the road's edge ----
PIT = [-15, -230, 170, -45]   # (the player's box: the 7th crew's, -50 .. -40 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-110, 10]
PIT_BOX = [-135, 35, -1]   # (the garages: World's RB_LOOK.aguascalientes.pitBox; the crews' 13 open)
WALLS = [[-230, 170, -1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where the main grandstand stands back from the road, outside the front straight
WIDE = [[-150, 70, 1, 9]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the main grandstand outside the front straight (roofed), an open block
# outside Turn 4; their names places of the state of Aguascalientes
STANDS = [[-140, 60, 1, 14, 1, 4, 0, 'AGUASCALIENTES'], [1000, 1070, 1, 7, 0, 2, 0, 'CALVILLO']]
SECTORS = [450, 900]
REAL_KM = 1.41

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings and the roads (sk), the horizon (far) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):   # a grid of the data, its corner moved to our frame
    g = dict(J['grids'][name]); g['x0'] -= OX; g['z0'] -= OZ; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

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
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, above the finish line in steps of 0.05 m multiples from
    # its lowest point (the plateau round the oval)
    gd, ad = grid('dem'); ad2 = ad
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the dry grass and the fields of the plateau), 1 the trees (the mesquites, the pepper trees and the
    # eucalypts), 2 the scrub (the bushes on the grass), 3 built-up (the villages, the car parks): ESA WorldCover, the canopy height (Meta /
    # WRI: bushes 2-5 m, trees over 5 m) and OSM's woods, scrub, car parks and buildings over it
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(ch >= 2) & (ch < 5)] = 2; cls[ch >= 5] = 1; cls[wc == 10] = 1; cls[wc == 20] = 2
            cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved run-offs and roads, the builder's own: grass)
            cls[lu == 9] = 1; cls[lu == 8] = 2; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height] (none in OSM now)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        hh = hgt if hgt > 0 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 120 m, not the one in its tunnel under the back straight): [n, x0, z0, x1, z1, ...];
    # the dirt tracks (highway=track, compacted) as trk
    svc = []; trk = []
    for r in J['roads']:
        if r[3] == 2: continue
        q = mv(r[-1])
        if r[0] == 'service': svc += [len(q) // 2] + q
        elif r[0] == 'track': trk += [len(q) // 2] + q
    return D, LC, dict(bld=bld, svc=svc, trk=trk)


# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the low hills and the sierras round the valley of Aguascalientes) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=4):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea; the sea 0)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = int(H0 - 80)   # (the lowest height the rings hold: a little below the circuit)
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for q in range(na):
            m = 0.0
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (q + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round((m - lo) / step)))))   # (m above lo, in steps: the valley floor at ~1860 m, the sierras to ~2800 m)
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=lo, step=step, b64=base64.b64encode(bytes(out)).decode())

def svc_iter(a):
    k = 0
    while k < len(a): n = a[k]; yield a[k + 1:k + 1 + 2 * n]; k += 1 + 2 * n

def info():
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('  tightest: R %.1f m at %.0f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()]))
    hd = lambda s: (math.degrees(math.atan2(at(s + 3)[0] - at(s - 3)[0], -(at(s + 3)[1] - at(s - 3)[1]))) + 360) % 360   # (compass: 0 north, 90 east)
    print('  turns (heading in -> out):', ' '.join('%d:%.0f>%.0f' % (n + 1, hd(s - 80), hd(s + 80)) for n, s in enumerate(TURNS)))

def build_track():
    hk = H[::2]; lbh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'aguascalientes'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Aguascalientes, Mexico: the oval on the high plateau south of the city of Aguascalientes, counter-clockwise, in its real layout and
  // scale: the finish line at the apex of the dogleg of the front straight (the main grandstand outside on the right, the pits inside on
  // the left), Turns 1 and 2 (a half circle, left), the back straight, Turns 3 and 4 (the other half circle) and the dogleg onto the line:
  // %(km)s km on our line (1.41 km by the racing line). No banking (the shared world builder draws the road level across).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/aguascalientes/config.json: the
  // raceway way of the oval, counter-clockwise as raced), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line,
  // x east, z south.
  // GENERATED by tools/aguascalientes/build.py (edit the names, the pits, the stands and the text there).
  // Heights (AG_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its spikes taken out,
  // smoothed, grades at most 1.5 %%, the front straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.):
  // the plateau, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-aguascalientes.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells,
  // heights above the finish line), land cover (lc, 16 m cells: 0 the dry grass and the fields, 1 the trees, 2 the scrub, 3 the villages
  // and the car parks: ESA WorldCover, the canopy height and OSM), and sk: the buildings by the circuit (bld: [x, z, length, width, angle
  // (deg), height]: OSM), the service roads round the circuit (svc, trk: [points, x, z, ...]: OSM); the horizon (far: the highest ground
  // in rings round the circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const AG_H = [%(lbh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xdcdcd4, sun: 0xfff3dc, sunI: 1.2, sky: 0x6ea4de, gnd: 0x8c7d52, hemiI: 0.66, tint: [1.03, 1.0, 0.94], sat: 0.98, sunOff: [-58, 92, -30], split: [[0.97, 1.0, 1.05], [1.05, 1.01, 0.93]] },   // the high plateau of Aguascalientes: thin dry air, a strong sun, golden dry grass
    say: 'Aguascalientes',
    grassNat: 0.45, lawn: [1.06, 1.0, 0.8],
    zivali: { a: ['coyote', 'hare', 'horse'], t: ['windpump', 'waterTank'], open: true },
    id: 'aguascalientes', name: 'Aguascalientes, Mehika', theme: 'aguascalientes', laps: 5, halfWidth: 7,
    desc: %(desc)s,
    en: { name: 'Aguascalientes, Mexico', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: AG_H.map((h, i) => [i / AG_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-4 (their number boards): the two half circles at the ends of the oval
    pit: %(pit)s,   // pit lane on the left of the front straight, inside the oval: [centre offset (negative: left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.aguascalientes.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind a wide verge by the main grandstand outside the front straight
    maxRivals: 21,   // the most rivals the menu's Opponents gives a race here (game.js rivSet; tests/rivals-n.test.js): a bigger field starts flying, and its column (Race._flyColumn, 4/5 of the lap at most) does not fit the 1340 m oval: its cars would stand on each other
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand outside the front straight, an open block outside Turn 4
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: Turns 1 and 2, the back straight and Turns 3 and 4, the front straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), lbh=lbh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'aguascalientes.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; tracks', sum(1 for _ in svc_iter(SK['trk'])))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
