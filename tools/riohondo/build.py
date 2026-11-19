# Termas de Río Hondo, Argentina: the game's track file from the track data (tools/riohondo/riohondo.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/riohondo/build.py   -> js/tracks/riohondo.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A19), the track: docs/proge/riohondo.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'riohondo.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: OSM has none; on the main straight 240 m after the data's first point (the OSM node nearest to the middle of the pit
# lane: tools/riohondo/config.json), about level with the middle of the pit lane. The line and everything else moved so that the finish line
# is the origin and the first point ----
K0 = 48; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway ways of the circuit, clockwise as raced (oneway=yes), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy), its bumps and dips narrower than ~150 m and ~100 m
# taken out (a grey opening and closing: the model's humps and hollows of 1-3 m are the monte's thickets, the banks and the drains by the
# road, not the road), smoothed (sigma 30 m): the plain falling gently from the north-east (285 m above the sea, the back straight's end)
# towards the reservoir in the south-west (277 m, the first corners); the main straight level, grades at most 3 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.03 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-215 / STEP)); i1 = int(round(260 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from Turn 14's exit to Turn 1's brakes
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
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (14: 9 right, 5 left) ----
NAMES = [
    ('Desni na koncu ravnine', 285, ['Hard on the brakes for Turn 1!', 'The long right at the end of the main straight!', 'Into the first right, two apexes to hit!']),
    ('Dolgi desni', 415, ['Still turning, the second apex of Turn 2!', 'The long right goes on and on!', 'Round Turn 2, the grandstands on the outside!']),
    ('Ostri levi', 755, ['Hard on the brakes for the tight left!', 'The left of Turn 3!', 'Round Turn 3, then the right onto the long straight!']),
    ('Desni na dolgo ravnino', 990, ['The right of Turn 4, onto the long straight!', 'A good exit here is worth a lot!', 'Through Turn 4, then flat out!']),
    ('Dolga ravnina', 1400, ['Flat out down the long straight!', 'A kilometre of straight across the plain!', 'Full throttle, the hairpin ahead!']),
    ('Lasnica na koncu ravnine', 2085, ['Hard on the brakes for the hairpin!', 'The tight right of Turn 5!', 'Round the hairpin, the slowest of the lap!']),
    ('Hitri levi', 2440, ['Flat through the fast left of Turn 6!', 'The long fast sweep to the left!', 'Through Turn 6, keep it tight!']),
    ('Ostri desni', 2925, ['Hard on the brakes for Turn 7!', 'The tight right of Turn 7!', 'Round Turn 7, and the long right goes on!']),
    ('Desni na vzhodu', 3070, ['The long right of Turn 8!', 'Right again, on the east side of the circuit!', 'Through Turn 8, the infield ahead!']),
    ('Levi v notranjosti', 3390, ['The left of Turn 9!', 'Hard on the brakes, left into the infield!', 'Round Turn 9!']),
    ('Hitri desni', 3530, ['The quick right of Turn 10!', 'Right, and the long left ahead!', 'Through Turn 10!']),
    ('Dolgi levi', 3670, ['The long left of Turn 11!', 'Round the long left-hander, the load builds!', 'Through the long sweep of Turn 11!']),
    ('Desni pregib', 4240, ['The right kink of Turn 12!', 'Flat through Turn 12!', 'The kink, and the last corners ahead!']),
    ('Desni pred ciljem', 4340, ['Hard on the brakes for Turn 13!', 'The tight right before the finish!', 'Round Turn 13, the pit entry on the left!']),
    ('Levi na ciljno ravnino', 4520, ['The left of Turn 14, onto the main straight!', 'Left, and the last corner of the lap!', 'Through Turn 14, a good exit is vital!']),
    ('Ciljna ravnina', 4640, ['Down the main straight, the pits on the left!', 'Flat out along the main straight!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 14 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 and 2 the long right at the
# end of the main straight, 3 the tight left, 4 the right onto the long straight, 5 the hairpin, 6 the fast left, 7 and 8 the long right on
# the east side, 9 the left into the infield, 10 the quick right, 11 the long left, 12 the right kink, 13 the tight right, 14 the left onto
# the main straight
TURNS = [319, 449, 789, 1019, 2173, 2580, 2957, 3110, 3427, 3566, 3800, 4272, 4406, 4555]

DESC = ('Dirkališče na ravnini severozahodne Argentine pri Termas de Río Hondo, ob velikem jezeru za jezom: 4,8 km v smeri urinega kazalca, '
        '14 zavojev (9 desnih in 5 levih). Ciljna ravnina mimo boksov, dolgi desni z dvema temenoma na koncu ravnine, ostri levi in desni na '
        'kilometrsko ravnino do lasnice, nato hitri levi in vijuganje po vzhodnem delu in notranjosti do ostrega desnega in levega na ciljno '
        'ravnino. Jesensko popoldne v Gran Chacu: suha trava, gozdiči algarrob in kebrač, polja, jezero na jugu, tribune v prvem ovinku '
        'in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit on the plain of north-western Argentina near Termas de Río Hondo, by the big lake behind the dam: 4.8 km, clockwise, 14 '
           'turns (9 right, 5 left). The main straight past the pits, the long double-apex right at the end of the straight, the tight left and '
           'the right onto the kilometre-long straight to the hairpin, then the fast left and the twists of the east side and the infield to the '
           'tight right and the left onto the main straight. An autumn afternoon in the Gran Chaco: dry grass, thickets of carob and quebracho '
           'trees, fields, the lake to the south, grandstands at the first corner and the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight (the outside: OSM's pit lane, 15-19 m from the centre line),
# from after the last corner to before Turn 1's brakes (the real lane leaves in Turn 13 and comes back in Turn 1); the 13 crews' boxes in
# the middle of the lane, the player's the 7th; the garages along the lane (no pit building in OSM: the builder's own); the pit wall 2.5 m
# past the road's edge ----
PIT = [-16, -200, 175, 5]   # (the player's box: the 7th crew's, 0 .. 10 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-60, 60]
PIT_BOX = [-140, 150, -1]   # (the garages: World's RB_LOOK.riohondo.pitBox; the crews' 13 open)
WALLS = [[-200, 175, -1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where OSM's two grandstands stand back from the road on the outside of Turns 1-2 (their fronts 63-82 m
# from the centre line, the run-off between: here at ~30 m)
WIDE = [[350, 465, -1, 16]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM: the two building=grandstand on the outside of Turns 1-2): their names
# places of the province and of the plain round the lake
STANDS = [[358, 400, -1, 12, 0, 2, 0, 'LAS TERMAS'], [406, 458, -1, 14, 1, 2, 0, 'SANTIAGO']]
SECTORS = [1300, 3250]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 60 m before Turn
# 14, open from 60 m after it along the main straight to Turn 1; detection 100 m before Turn 4, open from 80 m after it down the long
# straight to the hairpin
DRS = [[14, -60, 60, 1], [4, -100, 80, 5]]
REAL_KM = 4.806

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the lake, the roads (sk), the horizon (far) ----
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

# the lake: the reservoir behind the dam on the river (OSM natural=water, water=reservoir; the ground model flat at 272.0 m over it), its
# level here a little over that (the model's water); the terrain's water cells lowered under it, the land by it kept above it
LAKE = 272.2

def water_runs(W):   # a mask's cells as runs along its rows: [row, first, last + 1, ...]
    out = []
    for j in range(W.shape[0]):
        r = W[j]; i = 0; n = len(r)
        while i < n:
            if not r[i]: i += 1; continue
            k = i
            while k < n and r[k]: k += 1
            out += [j, i, k]; i = k
    return out

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); gd, ad = grid('dem')
    # terrain: Copernicus DEM less the canopy (20 m) on 16 m cells, above the finish line in steps of 0.05 m multiples from its lowest point;
    # the lake's cells (the model's flat water at its level, where ESA WorldCover or OSM has water, or out past the land-cover data) 1.6 m
    # under the lake's level, the land by it at least 0.35 m over it
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False)
    wat = (hv <= LAKE + 0.1) & ((wc == 80) | (lu == 13) | (wc == 0))
    lab, n = ndimage.label(wat); keep = np.zeros(n + 1, bool)
    for k in range(1, n + 1):   # (only the lake: the water cells joined to the grid's edge or to more than 40 cells)
        m = lab == k; keep[k] = m.sum() > 40 or m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()
    wat = keep[lab] & wat
    yL = LAKE - H0; hv = hv - H0
    hv = np.where(wat, np.minimum(hv, yL - 1.6), np.maximum(hv, yL + 0.35))
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # the lake's water: the terrain's cells with a water corner (dilated by one: the shore's crossing covered) as runs along the rows; past
    # the terrain the horizon's grid (100 m cells, the model flat at 272.0 m) within 4.2 km of the circuit
    wq = ndimage.binary_dilation(wat[:-1, :-1] | wat[1:, :-1] | wat[:-1, 1:] | wat[1:, 1:], iterations=1)
    gf, af = grid('far'); A = af.astype(np.float64) / 10 - 100
    fx = gf['x0'] + (np.arange(gf['nx']) + 0.5) * gf['cell']; fz = gf['z0'] + (np.arange(gf['nz']) + 0.5) * gf['cell']; FX, FZ = np.meshgrid(fx, fz)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); xe = x0 + (nx - 1) * c; ze = z0 + (nz - 1) * c
    out_t = (FX + 50 <= x0) | (FX - 50 >= xe) | (FZ + 50 <= z0) | (FZ - 50 >= ze)   # (the far cells wholly outside the terrain)
    wf = (A <= LAKE + 0.2) & out_t & (np.hypot(FX - cx, FZ - cz) < 4200)
    lake = dict(y=round(yL, 2), near=[x0, z0, c, water_runs(wq)], far=[round(gf['x0'], 1), round(gf['z0'], 1), gf['cell'], water_runs(wf)])
    # land cover, 16 m cells: 0 open (the circuit's lawns and its dry grass, the grassland round it), 1 the monte (the thickets and the woods of
    # the Chaco: carob and quebracho trees, the shrubs among them), 2 the fields (the crops, bare and sown; the lake and its muddy shore: no
    # trees), 3 built-up (the houses and the yards by the roads, the car parks): ESA WorldCover, the canopy height (Meta / WRI: trees over 4 m)
    # and OSM over it
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz_ in (-0.25, 0.25):
        for fx_ in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx_) * c, z0 + (np.arange(lnz) + 0.5 + fz_) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 0] = 1   # (out past the data: the monte and the fields of the plain, the monte's)
            cls[((wc == 40) | (wc == 60) | (wc == 80) | (wc == 90) | (lu == 13)) & (lu != 10)] = 2
            cls[((ch >= 4) | (wc == 10) | (wc == 20)) & (wc != 80)] = 1
            cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved run-offs and roads, the builder's own: grass)
            cls[lu == 9] = 1; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the service roads round the circuit: the ring road round its grounds (23-150 m from the track) and the ways to the paddock and the car
    # parks (OSM highway=service and =unclassified within 160 m, not in a tunnel): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[3] == 2 or r[0] not in ('service', 'unclassified'): continue
        q = mv(r[-1]); svc += [len(q) // 2] + q
    return D, LC, dict(svc=svc, lake=lake)

# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the plain's monte and fields, the lake to
# the south and the east, the town to the east, the first hills of the sierras far to the west) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = math.floor((LAKE - 2) / step) * step
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for q in range(na):
            m = lo
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (q + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 40):
                    i = int((cx + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north: x east, z south)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round((m - lo) / step)))))
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
    for x, z in ((-565, -352), (-638, -267)):   # (OSM's grandstands, in the data's frame)
        print('  grandstand at s %.0f, %.0f m to the right' % sd(x - OX, z - OZ))

def build_track():
    hk = H[::2]; brh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'riohondo'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Termas de Río Hondo, Argentina: the circuit on the plain of the Gran Chaco west of the town of Termas de Río Hondo, by the reservoir
  // behind the dam on the river, clockwise, in its real layout and scale: the finish line on the main straight (no finish line in OSM: level
  // with the middle of the pit lane on the left), the long double-apex right of Turns 1 and 2 at the end of the straight, the tight left of
  // Turn 3, the right of Turn 4 onto the long straight, the hairpin of Turn 5, the fast left of Turn 6, the long right of Turns 7 and 8, the
  // left of Turn 9, the quick right of Turn 10, the long left of Turn 11, the right kink of Turn 12, the tight right of Turn 13 and the left
  // of Turn 14 onto the main straight: %(km)s km on our line (4.81 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/riohondo/config.json: the raceway ways
  // of the circuit, oneway=yes in the race direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line, x east,
  // z south. GENERATED by tools/riohondo/build.py (edit the names, the pits, the stands and the text there).
  // Heights (RH_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height), its bumps taken out, smoothed, grades at most 3 %%,
  // the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.): the plain, %(hmin)s .. %(hmax)s m round
  // the lap.
  // Scenery data for the world builder (js/world-riohondo.js on js/world-rbring.js): terrain (dem: the same model, 16 m cells, heights above
  // the finish line, the lake's cells under its level), land cover (lc, 16 m cells: 0 the lawns and the grass, 1 the monte's thickets and
  // woods, 2 the fields and the lake's shore, 3 the houses and the car parks: ESA WorldCover, the canopy height and OSM), and sk: the service
  // roads round the circuit (svc: [points, x, z, ...]: OSM), the lake (lake: its level, its water as runs of the terrain's cells and, past the
  // terrain, of the horizon's 100 m cells: [x0, z0, cell, [row, first, last + 1, ...]]: the ground model's water, ESA WorldCover and OSM);
  // the horizon (far: the highest ground in rings round the circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const RH_H = [%(brh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd8d8d0, sun: 0xfff0d8, sunI: 1.14, sky: 0x8db5df, gnd: 0x6c7343, hemiI: 0.66, tint: [1.0, 1.0, 0.97], sat: 1.03, sunOff: [-60, 82, -52], split: [[0.97, 1.0, 1.04], [1.05, 1.01, 0.94]] },   // the Gran Chaco in the autumn: a warm afternoon sun in the north-west, a dusty haze, the grass going straw-green, the monte dark olive
    say: 'Termas de Rio Hondo', rainP: 0.2,
    grassNat: 0.8, lawn: [1.0, 1.02, 0.84],
    zivali: { a: ['cowK', 'horse', 'egret', 'hare'], t: ['windpump', 'waterTank', 'fallenTree'], open: true },
    id: 'riohondo', name: 'Termas de Río Hondo, Argentina', theme: 'riohondo', laps: 2, halfWidth: 7,
    desc: %(desc)s,
    en: { name: 'Termas de Río Hondo, Argentina', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: RH_H.map((h, i) => [i / RH_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-14 (their number boards): the long right's two apexes, the tight left, the right onto the long straight, the hairpin, the fast left, the long right's two parts, the left into the infield, the quick right, the long left, the right kink, the tight right, the left onto the main straight
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.riohondo.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind a wide run-off by the grandstands on the outside of Turns 1-2
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the two on the outside of Turns 1-2
    stands: %(stands)s,
    zaslon: { d: 28, side: 1, off: 18 },   // the big screen (js/world-zaslon.js) across from the pits on the right of the main straight, turned towards the cars coming down it (node tools/zaslon-mesto.mjs riohondo)
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the main straight from Turn 14 to Turn 1, the long straight from Turn 4 to the hairpin
    sectors: %(sectors)s,   // the three sectors of the timing screens: the first corners to the long straight, the long straight and the east side, the infield and the main straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), brh=brh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'riohondo.js'); open(path, 'w').write(src)
    L = SK['lake']
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars',
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; lake y %.2f, runs %d near, %d far' % (L['y'], len(L['near'][3]) // 3, len(L['far'][3]) // 3))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
