# Tuzla, Turčija: the game's track file from the track data (tools/tuzla/tuzla.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/tuzla/build.py   -> js/tracks/tuzla.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A12), the track: docs/proge/tuzla.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'tuzla.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); NP = len(RAW)

# ---- the centre line: OSM's raceway way of the circuit, counter-clockwise as raced (oneway=yes), from the finish line node, its nodes'
# corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)

def smooth_bend(P, s0, s1, sig):
    # Turn 8, the long left: OSM's nodes thick round its four apexes and 30-60 m chords between them (on the polyline the road straight
    # there and the apexes sharp: radii of 45 m, where the real corner is one long sweep). Its curvature evened out along it (a Gaussian
    # of sig m, faded in and out over the first and the last 60 m), the turn's total kept; the line rebuilt from it and its end's miss
    # (a few metres) spread smoothly along it: both ends and their headings as they were
    n = len(P); idx = np.arange(int(round(s0 / STEP)), int(round(s1 / STEP)) + 1) % n
    Q = P[idx]; d = np.diff(Q, axis=0); th = np.unwrap(np.arctan2(d[:, 1], d[:, 0])); ln = np.hypot(d[:, 0], d[:, 1])
    k = np.diff(th); u = np.arange(len(k)) * STEP; w = np.clip(np.minimum(u, u[-1] - u) / 60.0, 0, 1); w = 0.5 - 0.5 * np.cos(np.pi * w)
    k2 = k + w * (ndimage.gaussian_filter1d(k, sig / STEP, mode='nearest') - k); k2 += w * (k.sum() - k2.sum()) / w.sum()
    th2 = np.r_[th[0], th[0] + np.cumsum(k2)]
    Q2 = np.vstack([Q[0], Q[0] + np.cumsum(np.stack([ln * np.cos(th2), ln * np.sin(th2)], 1), 0)])
    f = np.r_[0, np.cumsum(ln)] / ln.sum(); f = f * f * (3 - 2 * f); Q2 += np.outer(f, Q[-1] - Q2[-1])
    P = P.copy(); P[idx] = Q2; return P, float(np.hypot(*(Q2 - Q).T).max())

P, T8_SHIFT = smooth_bend(P, 2140, 2800, 25.0)
SEG =np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the tool's (the ground model across the road, smoothed, grades at most 12 %), the main straight level, the steepest
# pieces (the drop into Turn 1 and the descent from Turn 8 to Turn 9) eased to 10 % (the excess spread to the neighbours), then smoothed
# again (sigma 10 m) ----
def heights():
    h = np.array(J['h'], float); cap = 0.10 * STEP
    # the main straight level from Turn 14 to the brakes of Turn 1 (s -420 .. 150): the ground model's bumps of 2-3 m there are the pit
    # building's and the main grandstand's roofs, not the road (the pits and the stands stand on a level terrace)
    i0 = int(round(-420 / STEP)); i1 = int(round(150 / STEP)); a = h[i0]; b = h[i1]
    for i in range(i0, i1 + 1): h[i] = a + (b - a) * (i - i0) / (i1 - i0)
    for _ in range(400):
        d = np.roll(h, -1) - h; ex = np.clip(np.abs(d) - cap, 0, None) * np.sign(d) / 2
        if not np.any(ex): break
        h += ex; h -= np.roll(ex, 1)
    return ndimage.gaussian_filter1d(h, 2.0, mode='wrap')
H = heights()
H0 = float(H[0])   # the finish line's height above the sea (129.2 m): the game's zero

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def sd(x, z):   # metres after the start line and to the right of the travel direction (x east, z south)
    d = np.hypot(P[:, 0] - x, P[:, 1] - z); i = int(d.argmin()); j = (i + 1) % NP; tx, tz = P[j] - P[i]; tl = math.hypot(tx, tz)
    return float(CUM[i]), float(((x - P[i, 0]) * -tz + (z - P[i, 1]) * tx) / tl)

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races or the circuit
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them ----
NAMES = [
    ('Spust v prvi levi', 235, ['Hard on the brakes and down into Turn 1!', 'The plunging left of Turn 1!', 'Down the hill through the first left!']),
    ('Dolgi desni v dolini', 430, ['The long right at the bottom of the dip!', 'Through the sweeping right of Turn 2!', 'Right, and up the hill!']),
    ('Vzpon na hrib', 700, ['Up the steep climb!', 'Climbing hard towards Turn 3!', 'Full throttle up the hill!']),
    ('Levi na vrhu', 980, ['The fast left over the top of the hill!', 'Through the left at the top of the climb!', 'Left, over the crest at Turn 3!']),
    ('Ostri desni', 1120, ['Hard on the brakes for the tight right!', 'The sharp right of Turn 4!', 'Round the right-hander at the top!']),
    ('Dvojni levi', 1300, ['The double left, down the hill!', 'Left and left again, falling away!', 'Through Turns 5 and 6!']),
    ('Desni na dnu', 1871, ['The long right at the foot of the hill!', 'Round Turn 7, at the bottom of the valley!', 'Through the right, and up towards Turn 8!']),
    ('Dolgi levi s štirimi temeni', 2391, ['Turn 8, four apexes, hold it flat!', 'The long left, the load builds and builds!', 'Round the four-apex left-hander!']),
    ('Spust v dolino', 3000, ['Down the long drop!', 'Flat out down the hill!', 'Dropping down towards Turn 9!']),
    ('Levi po spustu', 3271, ['Hard on the brakes for the left at the bottom!', 'The left of Turn 9, at the foot of the drop!', 'Through the tight left in the dip!']),
    ('Desni na zadnjo ravnino', 3361, ['The right onto the back straight!', 'Right, and open the throttle!', 'Through Turn 10, the long straight ahead!']),
    ('Desni pregib', 3891, ['Flat through the kink on the back straight!', 'The right kink, foot to the floor!', 'Through Turn 11 at full speed!']),
    ('Levi na koncu ravnine', 4657, ['Hard on the brakes at the end of the back straight!', 'The left of Turn 12!', 'Down the gears for the left!']),
    ('Desni v šikani', 4762, ['The right of the last chicane!', 'Right, then left onto the straight!', 'Through Turn 13!']),
    ('Levi na ciljno ravnino', 4877, ['The last left, onto the main straight!', 'Left, onto the straight!', 'Through Turn 14, the last corner!']),
    ('Ciljna ravnina', 5050, ['Down the main straight past the stands!', 'Flat out along the main straight, the pits on the left!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 14 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the drop left, 2 the long
# right, 3 the left at the top, 4 the tight right, 5 and 6 the double left, 7 the right at the bottom, 8 the long left (its first apex), 9 the
# left at the foot of the drop, 10 the right onto the back straight, 11 the kink, 12 the left at its end, 13 and 14 the last chicane
TURNS = [235, 430, 980, 1120, 1275, 1376, 1871, 2281, 3271, 3361, 3891, 4657, 4762, 4877]

DESC = ('Dirkališče na hribih nad Tuzlo na azijski strani Istanbula: 5,3 km v nasprotni smeri urinega kazalca, 14 zavojev in 40 m višinske razlike. '
        'Ciljna ravnina mimo velike tribune in boksov, strm spust v prvi levi, dolgi desni v dolini, vzpon na hrib, ostri desni na vrhu, '
        'dvojni levi navzdol in desni na dnu doline. Nato slavni dolgi levi s štirimi temeni, dolg spust do levega zavoja, zadnja ravnina z '
        'desnim pregibom in šikana nazaj na ciljno ravnino. Široke asfaltne izletne cone, suhi travnati griči, tribune in boksi '
        '(zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on the hills above Tuzla on the Asian side of Istanbul: 5.3 km, anticlockwise, 14 turns and 40 m of height difference. '
           'The main straight past the big grandstand and the pits, the steep drop into the first left, the long right in the dip, the climb up '
           'the hill, the tight right at the top, the double left on the way down and the right at the bottom of the valley. Then the famous '
           'long left with four apexes, the long drop to the left at its foot, the back straight with its kink and the chicane back onto the '
           'main straight. Wide asphalt run-offs, dry grassy hills, grandstands and the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight (the infield's side: OSM's pit lane and pit building there),
# 15 m from the centre line, from after the last corner to before Turn 1 (the real lane leaves after Turn 13 and comes back after Turn 2,
# round the inside of Turn 1: here it joins the circuit before it); the 13 crews' boxes in the middle of the pit building, the player's the
# 7th; the pit building along the lane (OSM: ~355 m, its front ~27 m from the centre line); the pit wall 2.5 m past the road's edge ----
PIT = [-15, -390, 120, -75]   # (the player's box: the 7th crew's, 5 .. 15 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-140, -20]
PIT_BOX = [-260, 90, -1]   # (the garages: World's RB_LOOK.tuzla.pitBox; 35 garages, the crews' 13 open)
WALLS = [[-390, 120, -1, 2.5]]   # the pit wall along the lane
# the barrier on the right of the main straight moved out (def.wide): the main grandstand stands back behind a wide verge, as in OSM (its
# front 28 m from the centre line)
WIDE = [[-265, 135, 1, 8]]
# grandstands [from, to, side, rows, roof, sections, orange, name]: the main grandstand on the right of the main straight (OSM building=
# grandstand, ~400 m, roofed), and OSM's bleachers round the lap: outside Turn 1, outside Turns 5 and 6, outside the start of Turn 8,
# outside Turn 9, inside the back straight by the kink, outside Turn 12, and on the right of the main straight's start after Turn 14; the one
# outside Turn 1 roofed and longer back towards the straight (OSM's building=roof over it, s 155-235)
STANDS = [[-265, 135, 1, 14, 1, 4, 0, 'TUZLA'], [160, 300, 1, 10, 1, 2, 0, 'AKFIRAT'], [1370, 1450, 1, 7, 0, 2, 0, 'ANADOLU'],
          [2225, 2310, 1, 8, 0, 2, 0, 'İSTANBUL'], [3200, 3285, 1, 7, 0, 2, 0, 'MARMARA'], [3850, 3905, -1, 6, 0, 1, 0, 'KOCAELİ'],
          [4545, 4625, 1, 8, 0, 2, 0, 'TÜRKİYE'], [4975, 5045, 1, 7, 0, 2, 0, 'ORHANLI']]
SECTORS = [1550, 3330]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 130 m before Turn
# 10 (before Turn 9), open from 130 m after Turn 10 down the back straight to Turn 12; detection 230 m before Turn 14 (at Turn 12), open from
# 60 m after Turn 14 along the main straight to Turn 1
DRS = [[10, -130, 130, 12], [14, -230, 60, 1]]
REAL_KM = 5.338

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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, above the finish line in steps of 0.05 m multiples from
    # its lowest point (the valleys round the circuit some 40 m below the finish line, the hills to the north 60 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the dry grass of the hills, the stubble, the bare earth), 1 the groves (pine, a few oaks), 2 the scrub
    # (the maquis's low bushes), 3 built-up (the paddock, the car parks, the service roads, the town): ESA WorldCover with OSM's scrub, woods,
    # car parks and buildings over it
    g1, a1 = grid('lc'); g2, a2 = grid('lu')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 10] = 1; cls[wc == 20] = 2; cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved
            cls[lu == 9] = 1; cls[lu == 8] = 2; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3   # run-offs and service roads, the builder's own: grass)
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]; not the pit building and the paddock's
    # (the builder's garages stand there), not the main grandstand (def.stands draws it), nor in the barriers
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if l > 300: continue   # (the pit building with the paddock's, the main grandstand: OSM outlines of ~390 m)
        if kind == 4 and l * w > 2000: continue   # (the roof over the stand outside Turn 1: def.stands draws it, roofed)
        ca, sa = math.cos(ang), math.sin(ang); edge = []   # (the box's outline every metre: its distance from the road, where along it)
        for u, v, du, dv in ((-1, -1, 1, 0), (1, -1, 0, 1), (1, 1, -1, 0), (-1, 1, 0, -1)):
            n = max(1, int(math.ceil(l if du else w)))
            for k in range(n + 1):
                a = (u + du * 2 * k / n) * l / 2; q = (v + dv * 2 * k / n) * w / 2; edge.append(sd(x + a * ca - q * sa, z + a * sa + q * ca))
        if min(abs(q[1]) for q in edge) < 14: continue   # (in the barriers)
        hh = hgt if hgt > 0 else 9.0 if kind == 4 and l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 120 m, not the two in their tunnels under it): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[0] != 'service' or r[3] == 2: continue
        q = r[-1]; svc += [len(q) // 2] + [round(v, 1) for v in q]
    return D, LC, dict(bld=bld, svc=svc)

def svc_iter(a):
    k = 0
    while k < len(a): n = a[k]; yield a[k + 1:k + 1 + 2 * n]; k += 1 + 2 * n

def build_track():
    hk = H[::2]; tzh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'tuzla'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Tuzla, Turkey: the circuit on the hills above Tuzla on the Asian side of Istanbul, anticlockwise, in its real layout and scale: the
  // finish line on the main straight (OSM raceway=start-finish; the big grandstand on the right, the pits on the left), the steep drop into
  // Turn 1, the long right of Turn 2 in the dip, the climb to Turn 3 at the top of the hill, the tight right of Turn 4, the double left of
  // Turns 5 and 6 on the way down, the right of Turn 7 at the bottom of the valley, the long left of Turn 8 with its four apexes, the drop to
  // the left of Turn 9, Turn 10 onto the back straight, its kink (Turn 11), Turn 12 at its end and the chicane of Turns 13 and 14 onto the
  // main straight: %(km)s km on our line (5.338 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/tuzla/config.json: the raceway way of
  // the circuit, oneway=yes in the race direction, from the finish line node), the corners at its nodes rounded (sigma 5 m); metres,
  // origin = the finish line, x east, z south. GENERATED by tools/tuzla/build.py (edit the names, the pits, the stands and the text there).
  // Heights (TZ_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, grades at most
  // 10 %%, the main straight level; every 10 m from the finish line, decimetres above it (129.2 m a.s.l.): Turn 3 on the hill 19 m higher,
  // Turn 9 in the dip 21 m lower.
  // Scenery data for the world builder (js/world-tuzla.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line), land cover (lc, 16 m cells: 0 the dry grass, 1 the groves, 2 the scrub, 3 the paddock, the car parks, the service roads
  // and the town: ESA WorldCover and OSM), and sk: the buildings by the circuit (bld: [x, z, length, width, angle (deg), height]: OSM outlines as
  // boxes) and the service roads round it (svc: [points, x, z, ...]: OSM).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const TZ_H = [%(tzh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd3d9e1, sun: 0xfff0d2, sunI: 1.1, sky: 0xa9c5e8, gnd: 0x7c7448, hemiI: 0.62, tint: [1.02, 1.0, 0.96], sat: 0.98, sunOff: [-58, 74, 66], split: [[0.97, 1.0, 1.04], [1.04, 1.0, 0.95]] },   // Istanbul in late summer: a strong afternoon sun from the south-west, a warm haze over the hills, the grass gone gold
    say: 'Tuzla',
    grassNat: 0.55, lawn: [1.03, 1.0, 0.86],
    zivali: { a: ['fox', 'hare', 'stork'], t: ['signPost', 'waterTank'], open: true },
    id: 'tuzla', name: 'Tuzla, Turčija', theme: 'tuzla', laps: 2, halfWidth: 6.5,
    desc: %(desc)s,
    en: { name: 'Tuzla, Turkey', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: TZ_H.map((h, i) => [i / TZ_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-14 (their number boards): the drop left, the long right, the left at the top, the tight right, the double left (2), the right at the bottom, the long left (its first apex), the left at the foot of the drop, the right onto the back straight, the kink, the left at its end, the last chicane (2)
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.tuzla.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the main grandstand back behind a wide verge on the right of the main straight
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand along the main straight, the roofed stand outside Turn 1, the bleachers outside Turns 5-6, Turn 8, Turn 9, by the kink, outside Turn 12 and after Turn 14
    stands: %(stands)s,
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the back straight from Turn 10 to Turn 12, the main straight from Turn 14 to Turn 1
    sectors: %(sectors)s,   // the three sectors of the timing screens: Turns 1-6, Turns 7-9 with the long left, the back straight and the last chicane
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), tzh=tzh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'tuzla.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line);' % (hk.min() - H0, hk.max() - H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6, '; service roads', sum(1 for _ in svc_iter(SK['svc'])))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f; Turn 8 evened out (the line moved at most %.1f m)' % (g.max() * 100, CUM[int(g.argmax())], T8_SHIFT))
    for k in ('dem', 'lc', 'sk'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
