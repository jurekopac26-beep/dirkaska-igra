# Cromwell, Nova Zelandija: the game's track file from the track data (tools/cromwell/cromwell.json and its PNG grids, made by
# tools/proga-podatki.py; the circuit's asphalt off the lap, the speedway's oval, the power lines and the main roads round it in
# tools/cromwell/okolica.json, made by tools/cromwell/okolica.py).
#   python3 -I tools/cromwell/build.py   -> js/tracks/cromwell.js (centre line, heights with the bridge, names, pits, the grandstand,
#   terrain, land cover, the buildings, the houses, the roads, the circuit's links, the karting track, the speedway's oval, the pond,
#   the power lines, the horizon)
# Edit the names, the pits, the stands, the bridge and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the
# track: docs/proge/cromwell.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'cromwell.json'))); OK = json.load(open(os.path.join(HERE, 'okolica.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish, no pit lane and no pit building here; the line is put 120 m down the east straight (the
# route's first point is its north end), by the middle of the pit building that the builder puts on its east side (the left of the cars),
# the line and its heights rolled to start there, the origin moved onto it
S0 = 120.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O

# ---- the centre line: OSM's raceways in the driving order, its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]
TG = np.roll(P, -1, 0) - P; ANG = np.unwrap(np.arctan2(TG[:, 1], TG[:, 0]))
KAP = ndimage.gaussian_filter1d(np.gradient(ANG) / SEG, 1.0, mode='wrap')   # the curvature at each point (1/m, + a right-hander: x east, z south)
TU = TG / SEG[:, None]; NRM = np.stack([-TU[:, 1], TU[:, 0]], 1)   # the unit tangent and the normal to the right of the travel direction

def at(s):   # [x, z] on the line s metres after the start line
    s = s % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); j = (i + 1) % NP; f = (s - CUM[i]) / SEG[i]
    return [round(float(P[i, 0] + (P[j, 0] - P[i, 0]) * f), 1), round(float(P[i, 1] + (P[j, 1] - P[i, 1]) * f), 1)]

def apex(s, side, w=30):   # the tightest point of a bend turning to side (1 right, -1 left) within w m of s
    best, bs = -1, s
    for d in np.arange(-w, w + 0.1, 1.0):
        q = (s + d) % LEN; i = int(np.searchsorted(CUM, q, 'right') - 1); k = KAP[i] * side
        if k > best: best, bs = k, s + d
    return round(float(bs) % LEN)

# ---- the crossing: where the line passes over itself (the bridge w677363476, OSM bridge=yes, layer=1: the straight north over the
# bridge passes over the run west from the esses) ----
def crossing():
    best = None
    for i in range(NP):
        a, b = P[i], P[(i + 1) % NP]
        for m in range(i + 20, NP):
            if NP - m + i < 20: continue
            c, d = P[m], P[(m + 1) % NP]; r = b - a; q = d - c; den = r[0] * q[1] - r[1] * q[0]
            if abs(den) < 1e-9: continue
            t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den; u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den
            if 0 <= t < 1 and 0 <= u < 1: best = (CUM[i] + t * SEG[i], CUM[m] + u * SEG[m], a + r * t)
    return best
SA, SB, XP = crossing()
BR0, BR1 = [(v - S0) % LEN for v in J['bridges'][0]]   # (the OSM bridge, metres after the start line)
S_UP, S_LO = (SA, SB) if BR0 - 5 <= SA <= BR1 + 5 else (SB, SA)

# ---- the heights: the river terrace is flat (the lap within 3 m: 216-219 m a.s.l.), the ground model's ripples smoothed away (sigma 10 m),
# the grades held to 3 %; then the crossing as built: the straight over the bridge on an embankment 4.4 m up, the run under it in a cutting
# 2.2 m down (7 m between the two at the crossing), each ramp a smooth step over 70-130 m (grades within 6 %) ----
GMAX = 0.03
UP = dict(h=4.4, a=-155, b=-25, c=20, d=145)   # (metres from the crossing on the upper leg: up from a to b, level to c, down to d)
LO = dict(h=-2.2, a=-85, b=-15, c=15, d=85)
def ramp(s, s0, R):
    d = (s - s0 + LEN / 2) % LEN - LEN / 2
    if d <= R['a'] or d >= R['d']: return 0.0
    if d < R['b']: t = (d - R['a']) / (R['b'] - R['a'])
    elif d <= R['c']: t = 1.0
    else: t = (R['d'] - d) / (R['d'] - R['c'])
    return R['h'] * t * t * (3 - 2 * t)
def heights():
    h = ndimage.gaussian_filter1d(np.roll(np.array(J['h'], float), -K0), 2.0, mode='wrap')
    for _ in range(400):
        g = (np.roll(h, -1) - h) / STEP; bad = np.abs(g) > GMAX
        if not bad.any(): break
        m = ndimage.maximum_filter1d((bad | np.roll(bad, 1)).astype(np.uint8), size=9, mode='wrap') > 0
        h = np.where(m, ndimage.gaussian_filter1d(h, 1.5, mode='wrap'), h)
    s = np.arange(NP) * STEP
    return h + np.array([ramp(v, S_UP, UP) + ramp(v, S_LO, LO) for v in s])
H = heights()
H0 = float(H[0])   # the start line's height above the sea (216.6 m): the game's zero

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its people, races, firms or sponsors, nor of the streets round it); s in metres from the start line ----
NAMES = [
    ('Šikana', 185, ['Brake for the chicane, right then left!', 'Through the chicane at the end of the straight!', 'Right, left, into the chicane!']),
    ('Jugovzhodna zanka', 450, ['Into the long loop, keep it turning right!', 'All the way round the south-east loop!', 'Round the long right by the pines!']),
    ('Povratna ravnina', 880, ['Foot down up the back straight!', 'Flat out back north!', 'Up the back straight!']),
    ('Esi', 1060, ['Left and right through the esses!', 'Quick through the esses!', 'Into the esses!']),
    ('Levi proti mostu', 1160, ['The long left onto the run under the bridge!', 'Hard left, the bridge is ahead!', 'Round the left towards the bridge!']),
    ('Pod mostom', 1300, ['Under the bridge!', 'Flat out under the bridge!', 'Through the cutting under the bridge!']),
    ('Zanka ob kartingu', 1460, ['Hard left round the loop by the karting track!', 'All the way round the loop, left!', 'Round the west loop!']),
    ('Dolga ravnina', 1800, ['Flat out down the long straight!', 'Foot down, south-west!', 'Down the long straight to the pines!']),
    ('Desni ob gozdu', 1989, ['Brake for the right by the pines!', 'Hard right at the edge of the woods!', 'Turn in right by the pines!']),
    ('Zahodna lasnica', 2140, ['The west hairpin, all the way left!', 'Hard on the brakes, the west hairpin!', 'Round the west hairpin!']),
    ('Desni pred lasnico', 2306, ['Quick right, the south hairpin is next!', 'The right before the hairpin!', 'Flick it right!']),
    ('Južna lasnica', 2394, ['Hard on the brakes, the south hairpin, left!', 'All the way round the south hairpin!', 'Round the hairpin at the bottom!']),
    ('Ovinki proti mostu', 2700, ['Through the bends north towards the bridge!', 'Right, then left, heading for the bridge!', 'Up through the bends!']),
    ('Levi-desni pred mostom', 2925, ['Left and right before the bridge!', 'Quick left-right, then up onto the bridge!', 'Through the kink before the bridge!']),
    ('Most', 3060, ['Up and over the bridge!', 'Over the bridge, the track below!', 'Across the bridge!']),
    ('Severni levi', 3200, ['The long left at the north end!', 'Round the long left!', 'Hold it through the long left!']),
    ('Ob ribniku', 3320, ['Down past the pond!', 'Flat out past the pond!', 'Along the pond to the hairpin!']),
    ('Severna lasnica', 3429, ['Hard on the brakes, the north hairpin, right!', 'All the way round the north hairpin!', 'Round the hairpin, right!']),
    ('Dolgi desni', 3740, ['The long right at the top!', 'Hold it through the long right!', 'Round the long right onto the run home!']),
    ('Ciljna ravnina', 3950, ['Down the main straight past the pits!', 'Flat out down the main straight!', 'The main straight, the lap is nearly done!']),
]
# the 22 corners' apexes: the chicane (4), the south-east loop (2), the esses (3), the loop by the karting track and the right after it, the
# right before the long straight, the right by the pines, the west hairpin, the right before the south hairpin, the south hairpin, the left
# in the bends to the bridge, the left-right before the bridge (2), the long left at the north end, the north hairpin, the long right at
# the top ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(170, 1), (199, -1), (264, -1), (294, 1), (444, 1), (618, 1), (1038, -1), (1088, 1), (1160, -1), (1460, -1),
                                 (1545, 1), (1666, 1), (1989, 1), (2140, -1), (2306, 1), (2394, -1), (2710, -1), (2912, -1), (2936, 1), (3200, -1),
                                 (3429, 1), (3740, 1)]]

DESC = ('Dirkališče na rečni terasi južno od Cromwella v Osrednjem Otagu: 4,1 km, 22 ovinkov, osmica z mostom, pod katerim krog pelje '
        'še enkrat. S ciljne ravnine v šikano in dolgo jugovzhodno zanko ob borovcih, nazaj na sever skozi ese, pod mostom v zanko ob '
        'kartingu, po dolgi ravnini do zahodne in južne lasnice, skozi ovinke proti mostu in čezenj, mimo ribnika do severne lasnice in '
        'z dolgim desnim nazaj na ciljno ravnino. Levo ob ciljni ravnini boksi z garažami (zapelji vanje in mehaniki ti popravijo avto), '
        'nasproti pokrita tribuna; suha trava, borovi gozdovi, sadovnjaki in gore Osrednjega Otaga na obzorju.')
DESC_EN = ('A circuit on the river terrace south of Cromwell in Central Otago: 4.1 km, 22 corners, a figure of eight with a bridge that the '
           'lap passes under once more. From the main straight into the chicane and the long south-east loop by the pines, back north '
           'through the esses, under the bridge into the loop by the karting track, down the long straight to the west and the south '
           'hairpins, through the bends to the bridge and over it, past the pond to the north hairpin and round the long right back '
           'onto the main straight. The pits with their garages on the left of the main straight (drive in and the mechanics fix your '
           'car), the covered grandstand across it; dry grass, pine woods, orchards and the ranges of Central Otago on the horizon.')

# ---- the pits (Core.Track.pitAt): no pit lane in OSM; the lane on the left of the main straight, 14 m from the centre line, from the
# end of the long diagonal to 40 m past the pit building (its junctions before and after: the acceleration lane ends before the chicane);
# the 13 crews' boxes in the pit building's 13 garages (js/world-cromwell.js), the player's in the middle at the start line; the pit wall
# 2.5 m past the road's edge ----
PIT = [-14, -170, 90, 0]
PIT_ROW = [-65, 55]
WALLS = [[-170, 90, -1, 2.5]]
# the grandstand [from, to, side, rows, roof, sections, orange, name]: covered, on the right across the straight from the pits (between it
# and the esses), named after the place (the builder's own: js/world-cromwell.js)
STANDS = [[-70, 10, 1, 10, 1, 3, 0, 'CROMWELL']]
SECTORS = [1160, 2640]
REAL_KM = 4.1

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery ----
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

def mv(fl, q=2): return [round((v - O[k % 2]) * q) / q for k, v in enumerate(fl)]   # [x, z, ...] of the tool's frame into the game's, to 1 / q m

def dline(X, Z):   # the distance of each point to the centre line (m: to its nearest point, every 5 m)
    dd, _ = spatial.cKDTree(P).query(np.stack([X.ravel(), Z.ravel()], 1)); return dd.reshape(X.shape)

def dense(fl, step=4.0):   # the points of a polyline [x, z, ...] every step m
    pts = np.array(fl, float).reshape(-1, 2); out = [pts[0]]
    for a, b in zip(pts[:-1], pts[1:]):
        n = max(1, int(math.ceil(np.hypot(*(b - a)) / step)))
        for t in range(1, n + 1): out.append(a + (b - a) * t / n)
    return np.array(out)

# ---- the pond: OSM's one (natural=water) in the north loop's infield, beside the run to the north hairpin (92 x 84 m) ----
LAKES = [np.array(l[3]).reshape(-1, 2) - O for l in J.get('lakes', [])]

def lake_mask(X, Z):   # True in the pond at the points X, Z (a regular grid: the polygon drawn on it)
    c = float(X[0, 1] - X[0, 0]); x0 = float(X[0, 0]); z0 = float(Z[0, 0])
    im = Image.new('L', (X.shape[1], X.shape[0]), 0); dr = ImageDraw.Draw(im)
    for L in LAKES: dr.polygon([((x - x0) / c, (z - z0) / c) for x, z in L], fill=1)
    return np.asarray(im) > 0

def lake_level():   # the pond's surface (m above the start line): 0.6 m under the lowest ground of its shore
    if not LAKES: return None
    gd, ad = grid('dem'); lv = []
    for L in LAKES: sh = sample(gd, ad, L[:, 0], L[:, 1], True) - H0; lv.append(float(np.percentile(sh, 10)) - 0.6)
    return round(min(lv), 2)

LV = lake_level()

def water():
    # the pond: OSM's shore drawn on 2 m cells, its signed distance (m, + in the water) on 4 m cells over the water and 24 m round it,
    # -30 .. 30 m in 0.25 m steps, run-length coded (as World's rbSea reads it: js/world-rbring.js)
    if not LAKES: return None
    A = np.concatenate(LAKES); f = 2.0; bx0 = math.floor((A[:, 0].min() - 60) / f) * f; bz0 = math.floor((A[:, 1].min() - 60) / f) * f
    bnx = int((A[:, 0].max() + 60 - bx0) / f); bnz = int((A[:, 1].max() + 60 - bz0) / f)
    X, Z = np.meshgrid(bx0 + (np.arange(bnx) + 0.5) * f, bz0 + (np.arange(bnz) + 0.5) * f); wet = lake_mask(X, Z)
    sd = (ndimage.distance_transform_edt(wet) - ndimage.distance_transform_edt(~wet)) * f
    zz, xx = np.nonzero(wet); WX = bx0 + (xx + 0.5) * f; WZ = bz0 + (zz + 0.5) * f
    c = 4.0; x0 = math.floor((WX.min() - 24) / c) * c; z0 = math.floor((WZ.min() - 24) / c) * c
    nx = int(math.ceil((WX.max() + 24 - x0) / c)) + 1; nz = int(math.ceil((WZ.max() + 24 - z0) / c)) + 1
    GX, GZ = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c)
    v = ndimage.map_coordinates(sd, [(GZ - bz0) / f - 0.5, (GX - bx0) / f - 0.5], order=1, mode='nearest')
    q = np.clip(np.round((np.clip(v, -30, 30) + 30) * 4), 0, 240).astype(np.uint8).ravel()
    out = []; k = 0   # (run-length coded: a run of 4 or more of one value as 255, the value, the count (4-254); the rest as they are)
    while k < len(q):
        m = k
        while m < len(q) and q[m] == q[k] and m - k < 254: m += 1
        if m - k >= 4: out += [255, int(q[k]), m - k]; k = m
        else: out.append(int(q[k])); k += 1
    return dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lv=LV, rle=b64bytes(out))

# ---- the roads: OSM's within 150 m (tools/proga-podatki.py: the streets of the estates east and north of the circuit, the service
# roads by the paddock) and the main roads farther out (okolica.json: the state highway north-west of the circuit, the country roads);
# [width, x, z, ...] ----
WID = {'tertiary': 7.5, 'unclassified': 6, 'residential': 6.5, 'service': 4.5, 'track': 3, 'footway': 2, 'cycleway': 2.5}
def main_road_width(kind, lanes):
    if kind in ('trunk', 'trunk_link', 'primary', 'secondary'): return round(max(2, lanes) * 3.6 + 1.6, 1)
    return 7.0 if kind == 'tertiary' else 6.0
ROADS = [[WID[r[0]]] + mv(r[8]) for r in J['roads'] if r[0] in WID] + [[main_road_width(r[0], r[1])] + mv(r[2]) for r in OK['roads']]

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, above the start line in 0.4 m steps from -32 m (the terrace
    # flat round the circuit, the ground within a few metres of the start line, the scarps down to the old river beds farther out)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -32.0, 0.4; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.08, b64=b64bytes(dem))
    rp = np.concatenate([dense(r[1:]) for r in ROADS]); rtree = spatial.cKDTree(rp)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    # the buildings (OSM, within 900 m): [x, z, length, width, angle (deg), height, kind (tools/proga-podatki.py's kinds)]
    bld = []
    for k, b in enumerate(J['bld']):
        x, z, l, w, ang, hgt, kind, s, d = b
        xx, zz = mv([x, z])
        hh = hgt or (7.5 if l > 150 else 4.0 if kind == 4 else 6.0 if l * w > 300 else 4.8)
        bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), int(kind if l < 150 else 5)]
    bp = np.array([[bld[k], bld[k + 1]] for k in range(0, len(bld), 7)]) if bld else np.zeros((1, 2)) + 1e6; btree = spatial.cKDTree(bp)
    # land cover, 16 m cells: 0 open (the circuit's lawns, the dry grass and the bare ground of the terrace), 1 woods (the pine plantations
    # south of the circuit, the copses in the loops' infields, the shelter belts), 2 fields (the orchards north of the circuit, the
    # crops), 3 built-up (the estates, the museum and the workshops north-west, the car parks); ESA WorldCover and the canopy height, OSM's
    # land use (the circuit's grounds: OSM recreation_ground, its lawns)
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (ch > 5)] = 1
            cls[((wc == 40) | (lu == 7) | (lu == 3)) & (ch <= 8)] = 2
            cls[(((wc == 50) & (lu != 4)) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 5)] = 3
            cls[(wc == 50) & (lu == 4) & (dl > 30) & (ch <= 5)] = 3   # (the workshops and the car parks in the circuit's grounds)
            cls[(lu == 10) & (ch <= 5)] = 0
            cls[lu == 9] = 1
            cls[(wc == 80) | (lu == 13)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the houses: WorldCover's built-up in the estates (OSM residential) and on the farms (no land use), no canopy over it, 40-520 m from
    # the centre line, 10 m from the roads and 14 m from OSM's buildings (those are drawn from their outlines): every 16 m cell's middle a
    # house (the builder picks its kind): [x, z, ...]
    X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5) * c, z0 + (np.arange(lnz) + 0.5) * c)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
    q = np.stack([X.ravel(), Z.ravel()], 1); rd = rtree.query(q)[0].reshape(X.shape); bd = btree.query(q)[0].reshape(X.shape)
    hs_m = (wc == 50) & ((lu == 1) | (lu == 0)) & (ch <= 6) & (dl > 40) & (dl < 520) & (rd > 10) & (bd > 14)
    rr = np.random.default_rng(4961); hs_m &= rr.random(hs_m.shape) < 0.62
    hs = []
    for zz, xx in zip(*np.nonzero(hs_m)): hs += [round(float(X[zz, xx] + (rr.random() - 0.5) * 6)), round(float(Z[zz, xx] + (rr.random() - 0.5) * 6))]
    # the circuit's own other ways (OSM highway=raceway): the long lap's unused stretches of its ways and the links of the shorter layouts
    # (asphalt as the circuit's: lk [[x, z, ...]]), the two links to the paddock north-west, the karting track west of the circuit
    # ([closed, x, z, ...]), the speedway's clay oval farther west (dt)
    lk, kart = [], []
    for r in J['roads']:
        if r[0] != 'raceway': continue
        fl = r[8]; pts = np.array(fl).reshape(-1, 2); g = mv(fl)
        if len(pts) > 40:
            closed = int(abs(g[0] - g[-2]) < 1 and abs(g[1] - g[-1]) < 1); kart.append([closed] + g); continue
        if pts[:, 0].max() < -460: continue   # (a piece of the speedway's oval: okolica.json has all of it)
        lk.append(g)
    lk += [mv(l[2]) for l in OK['links']]
    dt = [mv(o[1]) for o in OK['oval']]
    return D, LC, dict(bld=bld, hs=hs, road=ROADS, lk=lk, dt=dt, kart=kart, sea=water(), br=[round(BR0, 1), round(BR1, 1)], lm=landmarks()), lc, hv

def landmarks():
    # farther out (tools/cromwell/okolica.json, the tool's frame): the power lines [cables, x, z, y, ...] (y: the ground under each pylon,
    # m above the start line, from the 20 m ground model; beyond it its edge)
    gd, ad = grid('dem')
    def gy(x, z): return round(float(sample(gd, ad, np.array([x]), np.array([z]), True)[0] - H0), 1)
    def xyz(fl):
        g = mv(fl); out = []
        for k in range(0, len(g), 2): out += [g[k], g[k + 1], gy(g[k], g[k + 1])]
        return out
    return dict(pw=[[p[0]] + xyz(p[1]) for p in OK['power']])

# ---- the horizon (def.far for Riverside's rsFar, as Tocancipá): the highest ground in rings round the circuit, out to 24.5 km (the far
# grid: Copernicus DEM, 208 m) for the ranges round the Cromwell basin (the Pisa Range, the Dunstan Mountains, the Carrick Range, the
# Cairnmuir Mountains: 1,200-2,000 m) ----
FAR_R = [1500, 2100, 2800, 3600, 4500, 5500, 6700, 8000, 9500, 11200, 13100, 15200, 17500, 20000, 22500, 24500]
def far_rings(na=180, step=8):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = 150
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1100
        for a in range(na):
            m = lo
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (a + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 60):
                    i = int((cx + O[0] + math.sin(az) * r - g['x0']) / g['cell']); j = int((cz + O[1] - math.cos(az) * r - g['z0']) / g['cell'])   # (az clockwise from north)
                    if 0 <= i < g['nx'] and 0 <= j < g['nz']: m = max(m, A[j, i])
            out.append(int(min(255, max(0, round((m - lo) / step)))))
    return dict(x=round(cx, 1), z=round(cz, 1), base=round(H0, 1), na=na, r=FAR_R, lo=lo, step=step, b64=base64.b64encode(bytes(out)).decode())

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the start line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK, lc, hv = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'cromwell'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Cromwell, New Zealand: the circuit on the river terrace south of Cromwell in Central Otago (opened 2013), its long layout, a figure of
  // eight over its own bridge, in its real layout and scale: the start line on the east straight by the middle of the pit building, the
  // pits beside it on the left, the chicane, the long south-east loop, the back straight, the esses, the run under the bridge, the loop by
  // the karting track, the long straight, the west and the south hairpins, the bends to the bridge and over it, the long left, the north
  // hairpin by the pond and the long right onto the main straight: %(km)s km on our line (4.100 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/cromwell/config.json: the raceway's
  // ways 234778728, 234778729, 234778731, 234778732, 677363474-677363477), the corners at its nodes rounded (sigma 5 m); metres, origin = the
  // start line, x east, z south. GENERATED by tools/cromwell/build.py (edit the names, the pits, the stands, the bridge and the text there).
  // Heights (CW_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the grades held
  // to 3 %%; the crossing raised and cut as built (the straight over the bridge 4.4 m up on its embankment, the run under it 2.2 m down:
  // Track.cross); every 10 m from the start line, decimetres above it (%(h0)s m a.s.l.).
  // Scenery data for the world builder (js/world-cromwell.js): terrain (dem: the same model, 16 m cells, heights above the start line in
  // 0.4 m steps), land cover (lc, 16 m cells: 0 the circuit's lawns and the dry grass, 1 woods, 2 orchards and fields, 3 built-up: OSM, ESA
  // WorldCover, the canopy), and sk: the buildings ([x, z, length, width, angle (deg), height, kind]: OSM outlines as boxes within 900 m),
  // the houses (hs: WorldCover's built-up in the estates and on the farms), the roads ([width, x, z, ...]: OSM's, the state highway and the
  // country roads farther out), the circuit's links (lk: its unused stretches and the shorter layouts' links, [x, z, ...]), the karting
  // track ([closed, x, z, ...]), the speedway's clay oval (dt), the pond (sea: the signed distance to its shore, World's rbSea), the OSM
  // bridge (br: [from, to], metres after the start line) and lm, the power lines farther out (tools/cromwell/okolica.json); far: the horizon
  // (the highest ground in rings round the circuit out to 24.5 km, m a.s.l.: lo + byte x step). The names: plain descriptions only (no
  // names of people, firms, events, the circuit or its streets).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const CW_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xcbd6df, sun: 0xfff1da, sunI: 1.16, sky: 0x86b2de, gnd: 0x8f8a4e, hemiI: 0.74, tint: [1.02, 1.0, 0.95], sat: 1.0, sunOff: [70, 92, -40], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // Central Otago in summer: the driest air in the country, a high sun from the north, a clear blue sky, the dry grass of the terrace
    say: 'Cromwell', rainP: 0.12,
    grassNat: 0.62, lawn: [0.95, 1.04, 0.84],
    zivali: { a: ['sheep', 'hare', 'goose'], t: ['trough', 'waterTank'], open: true },   // (the merino sheep of the high country, the hares of the dry grass, the Canada geese by the water)
    id: 'cromwell', name: 'Cromwell, Nova Zelandija', theme: 'cromwell', laps: 4, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Cromwell, New Zealand', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, runoffTarmac: true, inner: 4.5, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s,   // (runoffTarmac: asphalt run-offs where the barriers stand far out)
    elev: CW_H.map((h, i) => [i / CW_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners and the straights by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the 22 corners' apexes: the chicane (4), the south-east loop (2), the esses (3), the loop by the karting track and the right after it, the right before the long straight, the right by the pines, the west hairpin, the right before the south hairpin, the south hairpin, the left in the bends to the bridge, the left-right before the bridge (2), the long left, the north hairpin, the long right
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the pit building's 13 garages: js/world-cromwell.js)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one across the straight from the pits
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the chicane, the south-east loop, the back straight and the esses; under the bridge to the south hairpin; the bends to the bridge, over it, the north end and the run home
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), h0='%.1f' % H0, skh=skh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), stands=js(STANDS).replace('],[', '], ['),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.environ.get('CROMWELL_OUT') or os.path.join(ROOT, 'js', 'tracks', 'cromwell.js'); open(path, 'w').write(src)
    g = np.diff(np.r_[H, H[0]]) / STEP * 100
    iu = int(round(S_UP / STEP)) % NP; il = int(round(S_LO / STEP)) % NP
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(g).max()),
          D['nx'], 'x', D['nz'], '(%.1f .. %.1f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(),
          '; buildings', len(SK['bld']) // 7, 'houses', len(SK['hs']) // 2, 'roads', len(SK['road']), 'links', [len(l) // 2 for l in SK['lk']],
          'oval', [len(l) // 2 for l in SK['dt']], 'karting', [(k[0], len(k) // 2) for k in SK['kart']], '; pond', SK['sea'] and (SK['sea']['nx'], SK['sea']['nz'], SK['sea']['lv']), '; turns', TURNS)
    print('  crossing at (%.1f, %.1f): the bridge leg s %.0f (%.2f m), the leg under it s %.0f (%.2f m): %.2f m apart; OSM bridge s %.0f-%.0f' % (
          XP[0] - O[0], XP[1] - O[1], S_UP, H[iu] - H0, S_LO, H[il] - H0, H[iu] - H[il], BR0, BR1))
    print('  power lines', [(p[0], len(p) // 3) for p in SK['lm']['pw']])
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))
    for k in SK: print('    sk.%-5s %5d KB' % (k, len(js(SK[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
