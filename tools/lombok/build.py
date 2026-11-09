# Lombok, Indonezija: the game's track file from the track data (tools/lombok/lombok.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/lombok/build.py   -> js/tracks/lombok.js (centre line, heights, names, pits, stands, terrain, land cover, sea, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A14), the track: docs/proge/lombok.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'lombok.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: OSM has none; about the middle of the pit lane (OSM w278760894), 155 m after the data's first point (the OSM node
# nearest to it: tools/lombok/config.json). The line and everything else moved so that the finish line is the origin and the first point ----
K0 = 31; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway way of the circuit, clockwise as raced (oneway=yes), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (a grey opening and closing: the model's humps of 3-11 m with sides of 10-30 % at 1.1, 2.1 and 2.9 km are the
# bushes, a footbridge and the stands, not the road; its dips the streams' channels beside the culverts), smoothed (sigma 30 m): a coastal
# plain 3-7 m above the sea; the main straight level, grades at most 3 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.03 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-330 / STEP)); i1 = int(round(340 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from Turn 17 to Turn 1's brakes
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
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (17: 11 right, 6 left) ----
NAMES = [
    ('Desni na koncu ravnine', 430, ['Hard on the brakes for Turn 1!', 'The right at the end of the main straight!', 'Down the gears into the first right!']),
    ('Desni pred esom', 690, ['The right of Turn 2!', 'Right, and into the esses!', 'Through Turn 2, the esses next!']),
    ('Dvojni levi', 795, ['Left and left again, Turns 3 and 4!', 'Through the double left!', 'The esses, left, then left!']),
    ('Desni pod hribom', 1049, ['The right under the hill, Turn 5!', 'Round Turn 5, the hill above us!', 'Right, at the foot of the hill!']),
    ('Hitri desni', 1273, ['The fast right of Turn 6!', 'Flat through Turn 6!', 'Right, and keep it on the throttle!']),
    ('Desni proti zahodu', 1498, ['Round the right of Turn 7!', 'Right, heading west now!', 'Through Turn 7!']),
    ('Levi ob tribunah', 1640, ['The left by the grandstands, Turn 8!', 'Left, past the stands!', 'Through Turn 8, the crowd on the right!']),
    ('Ravnina proti morju', 1960, ['Down the straight towards the sea!', 'Flat out, the sea ahead!', 'The long run down to the coast!']),
    ('Desni ob morju', 2178, ['Hard on the brakes for the right by the sea!', 'The tight right of Turn 10, the beach just beyond!', 'Round Turn 10 by the coast!']),
    ('Desni pod gričem', 2483, ['The right under the knoll, Turn 11!', 'Right, round the foot of the knoll!', 'Through Turn 11!']),
    ('Levi na sever', 2692, ['The left of Turn 12, heading north!', 'Left, past the stands!', 'Through Turn 12!']),
    ('Levi proti zahodu', 3030, ['The left of Turn 13!', 'Left, and out towards the west!', 'Round Turn 13!']),
    ('Desni na zahodni strani', 3215, ['The fast right of Turn 14!', 'Right, on the far side of the circuit!', 'Through Turn 14!']),
    ('Dolgi desni', 3560, ['The long right of Turn 15!', 'Round the long right-hander, the load builds!', 'Through the long sweep of Turn 15!']),
    ('Ostri desni', 3712, ['Hard on the brakes for the tight right!', 'The slowest corner, Turn 16!', 'Round the hairpin right!']),
    ('Zadnji levi', 3916, ['The last left, onto the main straight!', 'Left, Turn 17, the last corner!', 'Through the final left!']),
    ('Ciljna ravnina', 4140, ['Down the main straight past the stands!', 'Flat out along the main straight, the pits on the left!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 17 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the right at the end of the
# main straight, 2 the right before the esses, 3 and 4 the double left, 5 the right under the hill, 6 the fast right, 7 the right towards the
# west, 8 the left by the grandstands, 9 the right kink, 10 the right by the sea, 11 the right under the knoll, 12 and 13 the two lefts,
# 14 the fast right, 15 the long right, 16 the tight right, 17 the last left
TURNS = [445, 699, 760, 830, 1049, 1273, 1498, 1640, 1778, 2178, 2483, 2692, 3030, 3215, 3560, 3712, 3916]

DESC = ('Dirkališče ob plažah južne obale Lomboka pri Kuti: 4,3 km v smeri urinega kazalca, 17 zavojev (11 desnih in 6 levih) na skoraj '
        'ravni obalni ravnici, le 10 m nad morjem. Ciljna ravnina mimo velikih tribun in boksov, desni na koncu ravnine, es z dvojnim levim, '
        'desni pod hribom in hitri desni, nato ravnina proti morju do desnega zavoja tik ob plaži. Zadnji del vijuga po zahodni strani do '
        'dolgega desnega, ostrega desnega in zadnjega levega na ciljno ravnino. Tropsko sonce, suha trava in grmičevje, palme, morje na '
        'jugu, tribune okrog kroga in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit by the beaches of the south coast of Lombok near Kuta: 4.3 km, clockwise, 17 turns (11 right, 6 left) on a nearly level '
           'coastal plain only 10 m above the sea. The main straight past the big grandstands and the pits, the right at the end of the straight, '
           'the esses with the double left, the right under the hill and the fast right, then the straight towards the sea to the right just by '
           'the beach. The last part winds along the west side to the long right, the tight right and the last left onto the main straight. '
           'Tropical sun, dry grass and scrub, palms, the sea to the south, grandstands round the lap and the pits (drive in and the mechanics fix '
           'your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight (the outside: OSM's pit lane and the pit building there, the
# lane ~20 m from the centre line), from after the last corner to before Turn 1's brakes (the real lane leaves at Turn 16 and comes back
# after Turn 1); the 13 crews' boxes in the middle of the pit building, the player's the 7th; the garages along the lane (OSM: the pit
# building ~340 m, its front ~28 m from the centre line); the pit wall 2.5 m past the road's edge ----
PIT = [-15, -290, 230, -45]   # (the player's box: the 7th crew's, -50 .. -40 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-110, 10]
PIT_BOX = [-230, 190, -1]   # (the garages: World's RB_LOOK.lombok.pitBox; the crews' 13 open)
WALLS = [[-290, 230, -1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where OSM's grandstands stand back from the road (40-60 m from the centre line): here at ~25-35 m
WIDE = [[-250, 350, 1, 10], [480, 640, 1, 9], [930, 1150, 1, 9], [1200, 1410, 1, 9], [1520, 1690, 1, 6], [2740, 2800, 1, 12], [3070, 3220, 1, 14],
        [3250, 3320, -1, 12]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM building=grandstand, 21 of them, the main ones along the main
# straight, rows of blocks round the infield and on the west side): the main grandstand on the right of the main straight (roofed) and its
# open continuation towards Turn 1, the blocks between Turns 1 and 2, inside Turn 5, inside Turn 6, by Turns 7 and 8, outside Turn 12, between
# Turns 13 and 14 (right), outside Turn 14 (left) and outside Turns 15-16 (left); their names places of south Lombok
STANDS = [[-245, 135, 1, 14, 1, 4, 0, 'LOMBOK'], [180, 345, 1, 10, 0, 2, 0, 'KUTA'], [485, 635, 1, 8, 0, 4, 0, 'PRAYA'],
          [935, 1145, 1, 8, 0, 4, 0, 'PUJUT'], [1205, 1405, 1, 8, 0, 4, 0, 'SEGER'], [1525, 1685, 1, 8, 0, 4, 0, 'SENGKOL'],
          [2665, 2790, 1, 8, 0, 3, 0, 'GERUPUK'], [3040, 3210, 1, 8, 0, 4, 0, 'MERESE'], [3200, 3315, -1, 8, 0, 3, 0, 'TANJUNG'],
          [3570, 3760, -1, 8, 0, 3, 0, 'RINJANI']]
SECTORS = [1440, 2900]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 120 m before Turn
# 8, open from 160 m after it down the straight towards the sea to Turn 10; detection 150 m before Turn 17, open from 60 m after it along the
# main straight to Turn 1
DRS = [[8, -120, 160, 10], [17, -150, 60, 1]]
REAL_KM = 4.31

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the sea (sk.sea), the buildings and the roads (sk), the horizon (far) ----
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

SEA_FLOOR = -1.8   # (m a.s.l.: the sea's cells of the ground model lowered under the water, the shore between them and the land)

def sea_mask(A):   # the ground model's sea: its cells at 0 m (Copernicus DEM's sea) joined to the grid's edge
    lab, n = ndimage.label(A <= 0.05); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    return np.isin(lab, list(edge))

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m) on 16 m cells, above the finish line in steps of 0.05 m multiples from
    # its lowest point; the sea (the model's 0 m joined to the open water) lowered to SEA_FLOOR under the water (the hills to the east ~140 m)
    gd, ad = grid('dem'); A = ad.astype(np.float64) / 10 - 100; A[sea_mask(A)] = SEA_FLOOR; ad2 = np.round((A + 100) * 10)
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the dry grass and the bare earth of the coastal plain, the fields), 1 the trees (the groves, the palms by
    # the villages), 2 the scrub (the bushes on the grass), 3 built-up (the villages, the car parks): ESA WorldCover, the canopy height (Meta /
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
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: only the long building beyond the end of
    # the pit lane (the paddock's: its garages, World's pitBox, stand where OSM's pit building is; OSM's grandstands: def.stands)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        if l > 300: continue   # (the pit building)
        if 28 < l < 40 and 12 < w < 13.5: continue   # (the blocks of grandstands round the lap: def.stands)
        if l > 40 and w < 12 and d > 0: continue   # (the main grandstand's parts along the main straight: def.stands)
        hh = hgt if hgt > 0 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit (OSM highway=service within 120 m, not the two in their tunnels under it): [n, x0, z0, x1, z1, ...];
    # the dirt tracks (highway=track, compacted) as trk
    svc = []; trk = []
    for r in J['roads']:
        if r[3] == 2: continue
        q = mv(r[-1])
        if r[0] == 'service': svc += [len(q) // 2] + q
        elif r[0] == 'track': trk += [len(q) // 2] + q
    # the sea: its level (the finish line's zero: the sea at -H0) and the plane's extent (World: 9 km wide round the circuit's middle x, from z0
    # to the south; the coast south of the circuit at z 1.0-1.5 km, the bay to the west from z ~0.9 km; the land under it hides the plane)
    cx = float(P[:, 0].mean())
    SEA = dict(y=round(-H0, 2), x=round(cx, 1), z0=850)
    return D, LC, dict(bld=bld, svc=svc, trk=trk, sea=SEA)

# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the hills of south Lombok, the headlands) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea; the sea 0)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray()
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for q in range(na):
            m = 0.0
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (q + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round(m / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=0, step=step, b64=base64.b64encode(bytes(out)).decode())

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
    src = '''/* Track definition 'lombok'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Lombok, Indonesia: the circuit by the beaches of the south coast of Lombok near Kuta, clockwise, in its real layout and scale: the
  // finish line on the main straight (no finish line in OSM: about the middle of the pit lane; the big grandstands on the right, the pits
  // on the left), Turn 1 at the end of the straight, Turn 2 and the esses of Turns 3 and 4, the right of Turn 5 under the hill, the fast
  // right of Turn 6, Turn 7, the left of Turn 8 by the grandstands and the kink of Turn 9, the straight towards the sea, the right of Turn 10
  // just by the beach, Turn 11 under the knoll, the lefts of Turns 12 and 13, the fast right of Turn 14, the long right of Turn 15, the
  // tight right of Turn 16 and the last left of Turn 17 onto the main straight: %(km)s km on our line (4.31 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/lombok/config.json: the raceway way of
  // the circuit, oneway=yes in the race direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line, x east,
  // z south. GENERATED by tools/lombok/build.py (edit the names, the pits, the stands and the text there).
  // Heights (LB_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its spikes taken out,
  // smoothed, grades at most 3 %%, the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.): the
  // coastal plain, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-lombok.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line, the sea's cells lowered under the water), land cover (lc, 16 m cells: 0 the grass and the bare earth, 1 the trees, 2 the
  // scrub, 3 the villages and the car parks: ESA WorldCover, the canopy height and OSM), and sk: the building beyond the pit lane (bld: [x,
  // z, length, width, angle (deg), height]: OSM), the service roads and the dirt tracks round the circuit (svc, trk: [points, x, z, ...]:
  // OSM), the sea (sea: its level and the plane's middle x and north edge z0: Copernicus DEM's sea); the horizon (far: the
  // highest ground in rings round the circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const LB_H = [%(lbh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd5dfe6, sun: 0xfff2da, sunI: 1.18, sky: 0x8db9e6, gnd: 0x6f7a44, hemiI: 0.66, tint: [1.0, 1.01, 0.97], sat: 1.04, sunOff: [-62, 84, -40], split: [[0.97, 1.0, 1.04], [1.04, 1.01, 0.95]] },   // the south coast of Lombok in the dry season: a high tropical sun from the north-west in the afternoon, a humid haze off the sea, the grass gone straw-green
    say: 'Lombok',
    grassNat: 0.6, lawn: [1.02, 1.02, 0.84],
    zivali: { a: ['macaque', 'buffalo', 'egret'], t: ['palmHut'], open: true },
    id: 'lombok', name: 'Lombok, Indonezija', theme: 'lombok', laps: 3, halfWidth: 6.5,
    desc: %(desc)s,
    en: { name: 'Lombok, Indonesia', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: LB_H.map((h, i) => [i / LB_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-17 (their number boards): the right at the end of the straight, the right before the esses, the double left (2), the right under the hill, the fast right, the right towards the west, the left by the stands, the kink, the right by the sea, the right under the knoll, the two lefts (2), the fast right, the long right, the tight right, the last left
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.lombok.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind wide verges by the grandstands: the main straight's right, between Turns 1 and 2, inside Turns 5 and 6, by Turns 7-8, after Turn 12, by Turns 13-14 (both sides)
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand along the main straight and its open continuation, the blocks between Turns 1 and 2, inside Turns 5 and 6, by Turns 7-8, outside Turn 12, by Turns 13-14 (both sides) and outside Turns 15-16
    stands: %(stands)s,
    zaslon: { d: 139, side: 1, off: 27.5 },   // the big screen (js/world-zaslon.js) by the grandstand on the right, turned towards the cars coming (node tools/zaslon-mesto.mjs lombok)
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the straight towards the sea from Turn 8 to Turn 10, the main straight from Turn 17 to Turn 1
    sectors: %(sectors)s,   // the three sectors of the timing screens: Turns 1-7, Turns 8-12 by the sea, the west side
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), lbh=lbh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'lombok.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; tracks', sum(1 for _ in svc_iter(SK['trk'])))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
