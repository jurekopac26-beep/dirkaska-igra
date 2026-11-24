# Lusail, Katar: the game's track file from the track data (tools/lusail/lusail.json and its PNG grids, made by tools/proga-podatki.py; the
# lawns, the sand, the car parks and the palms cut out of the same OSM download by tools/lusail/zelenje.py: zel.png, palme.json).
#   python3 -I tools/lusail/build.py   -> js/tracks/lusail.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A18), the track: docs/proge/lusail.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'lusail.json')))
STEP = J['step']; RAW = np.array(J['line']).reshape(-1, 2); NP = len(RAW)
# (the finish line: OSM's raceway=start-finish node on the main straight is the data's first point and its origin: tools/lusail/config.json)

# ---- the centre line: OSM's raceway ways of the circuit, clockwise as raced (oneway=yes), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (a grey opening and closing: the model's humps of 1-3 m by the road are the fences, the stands and the parked
# cars, not the road), smoothed (sigma 30 m): the flat coastal desert, the lap 10-15 m above the sea, highest on the main straight and
# lowest round Turns 1-5; the main straight level, grades at most 2 % ----
def heights():
    h = np.array(J['hRaw'], float); cap = 0.02 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-560 / STEP)); i1 = int(round(380 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from Turn 16's exit to Turn 1's brakes
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

def dline(x, z): return float(np.hypot(P[:, 0] - x, P[:, 1] - z).min())   # metres from the centre line

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only, no names of people, firms, races or the circuit
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (16: 10 right, 6 left) ----
NAMES = [
    ('Desni na koncu ravnine', 505, ['Hard on the brakes for Turn 1!', 'The long right at the end of the main straight!', 'Down the gears into the first right!']),
    ('Levi proti severu', 810, ['The left of Turn 2!', 'Left, and back to the north!', 'Through Turn 2, on the throttle early!']),
    ('Hitri desni pregib', 1045, ['Flat through the right kink of Turn 3!', 'The fast kink, foot down!', 'Turn 3, and the run to the north end!']),
    ('Dvojni desni', 1445, ['The first part of the double right, Turn 4!', 'Right at the north end of the lap!', 'Into the double right!']),
    ('Desni proti jugu', 1615, ['The second right of Turn 5, back to the south!', 'Right again, the hairpin ahead!', 'Out of the double right!']),
    ('Lasnica', 1915, ['Hard on the brakes for the hairpin of Turn 6!', 'The tight left, the slowest of the lap!', 'Round the hairpin!']),
    ('Dolgi desni', 2340, ['The long right of Turn 7!', 'Round the long right-hander, the load builds!', 'Through the long sweep of Turn 7!']),
    ('Levi pregib', 2500, ['Flat through the left kink of Turn 8!', 'The kink, foot down!', 'Turn 8, and the right of Turn 9 ahead!']),
    ('Desni proti zahodu', 2665, ['The right of Turn 9!', 'Right, heading west!', 'Through Turn 9!']),
    ('Ostri levi', 2885, ['Hard on the brakes for the tight left of Turn 10!', 'The tight left, into the long left!', 'Round Turn 10!']),
    ('Dolgi levi', 3120, ['The long left of Turn 11!', 'Left, and keep it tight!', 'Round the long left, the fast rights ahead!']),
    ('Hitri desni', 3510, ['The fast right of Turn 12!', 'Into the fast rights, foot down!', 'Through Turn 12, flat out!']),
    ('Desni na vzhodu', 3700, ['The right of Turn 13, at the east end of the lap!', 'Right again, the load builds!', 'Through Turn 13!']),
    ('Tretji hitri desni', 3910, ['The third fast right, Turn 14!', 'Right, and the run back to the west!', 'Through Turn 14, foot down!']),
    ('Levi pred zadnjim', 4235, ['The left of Turn 15!', 'Left, the last corner ahead!', 'Through Turn 15!']),
    ('Zadnji desni', 4700, ['The last right, onto the main straight!', 'Turn 16, and the run to the line!', 'Through the final corner!']),
    ('Ciljna ravnina', 5050, ['Down the main straight past the big grandstand!', 'Flat out along the main straight, the pits on the right!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 16 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the right at the end of the
# main straight, 2 the left to the north, 3 the right kink, 4 and 5 the double right at the north end, 6 the hairpin, 7 the long right, 8 the
# left kink, 9 the right to the west, 10 the tight left, 11 the long left, 12, 13 and 14 the fast rights, 15 the left, 16 the last right
TURNS = [530, 830, 1060, 1466, 1636, 1936, 2361, 2516, 2681, 2906, 3140, 3531, 3721, 3931, 4257, 4722]

DESC = ('Dirkališče v puščavi severno od Dohe pri Lusailu: 5,4 km v smeri urinega kazalca, 16 zavojev (10 desnih in 6 levih) na ravnem. '
        'Dober kilometer dolga ciljna ravnina mimo glavne tribune na levi in boksov na desni, dolgi desni na koncu ravnine, levi, hitri desni '
        'pregib, dvojni desni na severnem koncu in ostra leva lasnica. Nato dolgi desni, vijuganje levo in desno do dolgega levega, trije hitri '
        'desni zapored, levi in zadnji desni na ciljno ravnino. Puščavsko sonce nad peskom, zalite zelenice in vrste palm ob cestah, '
        'tribune ob progi in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the desert north of Doha by Lusail: 5.4 km, clockwise, 16 turns (10 right, 6 left) on the flat. The main straight, '
           'over a kilometre long, past the main grandstand on the left and the pits on the right, the long right at the end of the straight, '
           'a left, the fast right kink, the double right at the north end and the tight left hairpin. Then the long right, the left and right '
           'bends to the long left, three fast rights in a row, a left and the last right onto the main straight. The desert sun over the sand, '
           'watered lawns and rows of palms along the roads, grandstands by the track and the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (the inside: OSM's pit lane, ~11 m from the centre line, the
# pit building ~22 m), from after the last corner to before Turn 1's brakes (as the real lane, which leaves after Turn 16 and comes back
# before Turn 1); the 13 crews' boxes in the middle of the pit building, the player's the 7th; the garages along the lane (OSM: the pit
# building ~400 m, its front ~22 m from the centre line); the pit wall 2.5 m past the road's edge ----
PIT = [15, -520, 360, -85]   # (the player's box: the 7th crew's, -90 .. -80 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-150, -30]
PIT_BOX = [-290, 100, 1]   # (the garages: World's RB_LOOK.lusail.pitBox; the crews' 13 open; the paddock building behind them: sk.pitb)
WALLS = [[-520, 360, 1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where OSM's grandstands stand back from the road: the main grandstand on the left of the main straight
# and the bleachers after it (their fronts ~27 m from the centre line), the bleachers on the right before Turn 4 (~27 m)
WIDE = [[-290, 360, -1, 12], [1185, 1290, 1, 11]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM: building=grandstand on the left of the main straight, 417 m long
# and 15 m deep, and leisure=bleachers on the left after it and on the right before Turn 4): their names places of Qatar
STANDS = [[-290, 125, -1, 16, 1, 4, 0, 'LUSAIL'], [135, 360, -1, 10, 0, 3, 0, 'DOHA'], [1185, 1290, 1, 9, 0, 2, 0, 'AL DAAYEN']]
SECTORS = [1800, 3420]
# the DRS zone (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 150 m before Turn 16,
# open from 80 m after it along the main straight to Turn 1
DRS = [[16, -150, 80, 1]]
REAL_KM = 5.419

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the buildings, the roads and the palms (sk), the horizon (far) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):   # a grid of the data (its corner in our frame: the data's origin is the finish line)
    g = dict(J['grids'][name]); a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

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

def dem_fixed():   # the ground model with the buildings' holes filled: the OSM buildings taken off it (the main grandstand, the pit building and
    # the paddock) dug pits of a few metres where the ground is level; their footprints (and 20 m round) filled from the ground round them (a
    # Laplace fill)
    g, a = grid('dem'); A = a.astype(np.float64) / 10 - 100
    X, Z = np.meshgrid(g['x0'] + (np.arange(g['nx']) + 0.5) * g['cell'], g['z0'] + (np.arange(g['nz']) + 0.5) * g['cell'])
    M = np.zeros(A.shape, bool)
    for b in J['bld']:
        x, z, l, w, ang = b[:5]; ca, sa = math.cos(ang), math.sin(ang)
        u = (X - x) * ca + (Z - z) * sa; v = -(X - x) * sa + (Z - z) * ca
        M |= (np.abs(u) < l / 2 + 20) & (np.abs(v) < w / 2 + 20)
    F = A.copy(); F[M] = A[~M].mean() if M.any() else 0
    for _ in range(500):
        F[M] = ((np.roll(F, 1, 0) + np.roll(F, -1, 0) + np.roll(F, 1, 1) + np.roll(F, -1, 1)) / 4)[M]
    return g, np.round((F + 100) * 10)

ZEL = dict(x0=J['grids']['lc']['x0'], z0=J['grids']['lc']['z0'], cell=8.0)   # (zel.png: tools/lusail/zelenje.py, over the land-cover grid)

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m, the buildings' holes filled) on 16 m cells, above the finish line in
    # steps of 0.05 m multiples from its lowest point (the flat desert within a few metres of the finish line round the circuit)
    gd, ad2 = dem_fixed()
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.1, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.08, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 the desert's gravel plain (ESA WorldCover's bare ground, and the unpaved car parks on it), 1 the lawns and
    # the gardens (OSM: leisure=garden, landuse=grass and greenery, the pitches, the shrubberies), 2 the sand (OSM natural=sand: the
    # infield's and the margins' drifts), 3 the paved and built land (the car parks WorldCover sees as built-up, the town past the circuit's
    # fence): ESA WorldCover and OSM over it
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); zg = dict(ZEL); za = np.asarray(Image.open(os.path.join(HERE, 'zel.png')))
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False)
            gx = np.floor((X - zg['x0']) / zg['cell']).astype(int); gz = np.floor((Z - zg['z0']) / zg['cell']).astype(int)
            ok = (gx >= 0) & (gz >= 0) & (gx < za.shape[1]) & (gz < za.shape[0]); zl = np.zeros(X.shape, np.uint8); zl[ok] = za[gz[ok], gx[ok]]
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 50) & (lu != 10) & (lu != 12)] = 3   # (built-up past the circuit's fence: the town; inside it the run-offs and the roads are the builder's own)
            dl = cKDTree(P).query(np.c_[X.ravel(), Z.ravel()])[0].reshape(X.shape)
            cls[(zl == 3) & ((wc == 50) | (lu == 14)) & (dl > 60)] = 3   # (the paved car parks, the others the desert's levelled gravel; not within 60 m of the centre line: WorldCover's built-up there is the track's own asphalt and run-offs)
            cls[zl == 2] = 2; cls[zl == 1] = 1
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: not the main grandstand (def.stands) nor
    # the pit building with the paddock (World's garages and race control: RB_LOOK.lusail.pitBox; the paddock building behind them: pitb)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b
        if l > 300: continue   # (the main grandstand and the pit building)
        hh = hgt if hgt > 0 else 3.2 if kind == 4 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the paddock building behind the garages (OSM's pit building reaches ~115 m from the centre line: the team buildings and the paddock's
    # hospitality; here one long block behind the garages and the race control tower): [x, z, length, width, angle (deg), height]
    s0, s1 = PIT_BOX[0], PIT_BOX[1]; sm = (s0 + s1) / 2; (xa, za_), (xb, zb) = at(s0), at(s1); xm, zm = at(sm); ang = math.atan2(zb - za_, xb - xa)
    nxr, nzr = -math.sin(ang), math.cos(ang)   # (the right of the straight: x east, z south)
    pitb = [round(xm + nxr * 50, 1), round(zm + nzr * 50, 1), round(s1 - s0 + 10, 1), 20.0, round(math.degrees(ang)), 11.0]
    # the service roads round the circuit (OSM highway=service and =unclassified within 60 m, not in a tunnel): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[3] == 2 or r[0] not in ('service', 'unclassified'): continue
        q = [round(v, 1) for v in r[-1]]; svc += [len(q) // 2] + q
    # the palms and the other lone trees (palme.json: OSM natural=tree and tree_row within 220 m): [x, z, ...], none on the road's verges;
    # all of them to 130 m from the centre line, every third further out (over half of them stand 130-220 m out, along the roads and the car
    # parks of the grounds: a thinner row there is as much horizon for a third of the phone's load)
    T = json.load(open(os.path.join(HERE, 'palme.json')))['tr']; tr = []
    for k in range(0, len(T) - 1, 2):
        x, z = T[k], T[k + 1]; d = dline(x, z)
        if d > 18 and (d <= 130 or (k // 2) % 3 == 0): tr += [x, z]
    return D, LC, dict(bld=bld, pitb=pitb, svc=svc, tr=tr)

# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the flat coastal desert, the new town of
# Lusail and its towers by the sea to the east, Doha's to the south) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea; 0 the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = math.floor((H0 - 20) / step) * step
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

def build_track():
    hk = H[::2]; luh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'lusail'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Lusail, Qatar: the circuit in the flat coastal desert north of Doha by the new town of Lusail, clockwise, in its real layout and scale:
  // the finish line on the main straight (OSM's start-finish node: the pits on the right, the main grandstand on the left), the long right
  // of Turn 1 at the end of the straight, the left of Turn 2, the right kink of Turn 3, the double right of Turns 4 and 5 at the north end,
  // the tight left hairpin of Turn 6, the long right of Turn 7, the left kink of Turn 8, the right of Turn 9, the tight left of Turn 10 into
  // the long left of Turn 11, the fast rights of Turns 12, 13 and 14, the left of Turn 15 and the last right of Turn 16 onto the main
  // straight: %(km)s km on our line (5.42 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/lusail/config.json: the raceway ways of
  // the circuit, oneway=yes in the race direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line, x east,
  // z south. GENERATED by tools/lusail/build.py (edit the names, the pits, the stands and the text there).
  // Heights (LU_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its bumps taken out,
  // smoothed, grades at most 2 %%, the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.): the
  // flat desert, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-lusail.js on js/world-rbring.js): terrain (dem: the same model, the buildings' holes in it
  // filled, 16 m cells, heights above the finish line), land cover (lc, 16 m cells: 0 the desert's gravel plain, 1 the lawns and the
  // gardens, 2 the sand, 3 the paved car parks and the town: ESA WorldCover and OSM, tools/lusail/zelenje.py), and sk: the buildings by the
  // circuit (bld: [x, z, length, width, angle (deg), height]: OSM), the paddock building behind the garages (pitb: a box), the service roads
  // round the circuit (svc: [points, x, z, ...]: OSM), the palms and the other lone trees (tr: [x, z, ...]: OSM); the horizon (far: the
  // highest ground in rings round the circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const LU_H = [%(luh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xe5d6c0, sun: 0xffe0b4, sunI: 1.24, sky: 0xa3c1de, gnd: 0xbca27e, hemiI: 0.7, tint: [1.03, 1.0, 0.95], sat: 1.02, haze: 0.16, hazeCol: [1, 0.86, 0.66], sunOff: [-82, 54, 50], split: [[0.97, 1.0, 1.04], [1.05, 1.0, 0.93]] },   // the coastal desert of Qatar late in the afternoon: a low, warm sun, a pale dusty haze, the sky pale blue over the sand
    say: 'Lusail', rainP: 0.04,
    grassNat: 0.5, lawn: [0.95, 1.06, 0.82],
    zivali: { a: ['camel'], t: [], open: true },
    id: 'lusail', name: 'Lusail, Katar', theme: 'lusail', laps: 2, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Lusail, Qatar', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.3, inner: 5, side: 7, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true, offSurface: 'gravel',
    elev: LU_H.map((h, i) => [i / LU_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-16 (their number boards): the right at the end of the straight, the left to the north, the right kink, the double right, the hairpin, the long right, the left kink, the right to the west, the tight left, the long left, the three fast rights, the left, the last right
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.lusail.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind wide verges by the grandstands: the main grandstand and the bleachers after it, the bleachers before Turn 4
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the main grandstand on the left of the main straight under its roof, the bleachers after it and before Turn 4
    stands: %(stands)s,
    zaslon: { d: -297, side: -1, off: 27.9 },   // the big screen (js/world-zaslon.js) at the start of the main grandstand on the left, turned towards the cars coming down the straight (node tools/zaslon-mesto.mjs lusail)
    drs: %(drs)s,   // the DRS zone: [turn, detection, activation (metres from that turn), the next turn]: the main straight from Turn 16 to Turn 1
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the north end and the hairpin, the middle of the lap to the long left, the fast rights and the main straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), luh=luh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), stands=js(STANDS).replace(',', ', '), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'lusail.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; trees', len(SK['tr']) // 2)
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
