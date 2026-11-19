# Tocancipá, Kolumbija: the game's track file from the track data (tools/tocancipa/tocancipa.json and its PNG grids, made by
# tools/proga-podatki.py; the landmarks farther out and the main roads in tools/tocancipa/okolica.json, made by tools/tocancipa/okolica.py).
#   python3 -I tools/tocancipa/build.py   -> js/tracks/tocancipa.js (centre line, heights, names, pits, the grandstand, terrain, land cover, the
#   greenhouses, the buildings, the roads, the circuit's links, the dirt track and the karting track, the ponds, the houses, the landmarks
#   farther out, the horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/tocancipa.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'tocancipa.json'))); OK = json.load(open(os.path.join(HERE, 'okolica.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish here; the line is put by the middle of the pit building (OSM w1233326669, 131 m long, its
# middle 148 m after the route's first point: tools/tocancipa/config.json), the line and its heights rolled to start there, the origin moved onto it
S0 = 148.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O

# ---- the heights: the savanna is flat (the lap within 3 m: 2,563-2,566 m), the ground model's ripples of a metre or two smoothed away
# (sigma 10 m) and the grades held to 3 % ----
GMAX = 0.03
def heights():
    h = ndimage.gaussian_filter1d(np.roll(np.array(J['h'], float), -K0), 2.0, mode='wrap')
    for _ in range(400):
        g = (np.roll(h, -1) - h) / STEP; bad = np.abs(g) > GMAX
        if not bad.any(): break
        m = ndimage.maximum_filter1d((bad | np.roll(bad, 1)).astype(np.uint8), size=9, mode='wrap') > 0
        h = np.where(m, ndimage.gaussian_filter1d(h, 1.5, mode='wrap'), h)
    return h
H = heights()
H0 = float(H[0])   # the start line's height above the sea (2,563 m): the game's zero

# ---- the centre line: OSM's raceway (clockwise as raced), its nodes' corners rounded (sigma 5 m) ----
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

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its people, races, firms or sponsors); s in metres from the start line ----
NAMES = [
    ('Prvi desni', 405, ['Hard on the brakes for the first right!', 'Into the first corner, right!', 'Turn in right at the end of the straight!']),
    ('Zahodna zanka', 560, ['Keep turning right round the pond!', 'All the way round the west loop!', 'Round the loop by the water!']),
    ('Levi za zanko', 660, ['The tight left out of the loop!', 'Hard left after the loop!', 'Flick it left out of the loop!']),
    ('Srednji esi', 805, ['Left and right through the middle esses!', 'Quick through the esses!', 'Into the esses in the middle!']),
    ('Dolgi levi', 1135, ['The long left!', 'Hold it through the long left!', 'Round the long left-hander!']),
    ('Vzhodna ravnina', 1390, ['Flat out down the east straight!', 'Foot down along the east straight!', 'Down the east straight!']),
    ('Vzhodna zanka', 1610, ['Into the east loop, right!', 'Round the east loop by the pond!', 'Keep it turning right round the east loop!']),
    ('Povratna ravnina', 1880, ['Foot down on the run back!', 'Flat out back across the field!', 'Down the straight back south!']),
    ('Levi pred lasnico', 2025, ['The left before the hairpin!', 'Quick left, the hairpin is next!', 'Through the left before the hairpin!']),
    ('Južna lasnica', 2170, ['Hard on the brakes, the south hairpin!', 'All the way round the hairpin, right!', 'Round the south hairpin!']),
    ('Levi za lasnico', 2310, ['The long left out of the hairpin!', 'Hard left after the hairpin!', 'Round the left after the hairpin!']),
    ('Zadnji ovinek', 2450, ['The last corner, right onto the straight!', 'Round the last corner!', 'Through the last corner, the line is near!']),
    ('Ciljna ravnina', 2590, ['Down the main straight past the pits!', 'Flat out down the main straight!', 'The main straight, the lap is nearly done!']),
]
# the 13 corners' apexes: the first right and the west loop round the pond, the left after it, the middle esses (2), the long left and the
# kink onto the east straight, the east loop (2), the left before the hairpin, the south hairpin, the left after it, the last corner
# ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(405, 1), (560, 1), (660, -1), (800, -1), (900, 1), (1130, -1), (1240, -1), (1600, 1), (1710, 1), (2030, -1),
                                 (2170, 1), (2310, -1), (2450, 1)]]

DESC = ('Dirkališče na Bogotski savani pri Tocancipáju, 2600 m nad morjem: 2,7 km, 13 ovinkov, v smeri urinega kazalca. S ciljne ravnine v '
        'prvi desni in zahodno zanko okrog ribnika, levi za zanko, srednji esi, dolgi levi na vzhodno ravnino, vzhodna zanka okrog drugega '
        'ribnika, povratna ravnina, južna lasnica, levi za njo in zadnji ovinek. Desno ob ciljni ravnini boksi z garažami (zapelji vanje in '
        'mehaniki ti popravijo avto), nasproti pokrita tribuna; rastlinjaki s cvetjem, pašniki s kravami, evkaliptusi, termoelektrarna z '
        'dimniki na severu in griči Vzhodnih Kordiljer na obzorju.')
DESC_EN = ('A circuit on the Bogotá savanna by Tocancipá, 2,600 m above the sea: 2.7 km, 13 corners, clockwise. From the main straight into '
           'the first right and the west loop round a pond, the left after it, the middle esses, the long left onto the east straight, the '
           'east loop round another pond, the run back, the south hairpin, the left after it and the last corner. The pits with their '
           'garages on the right of the main straight (drive in and the mechanics fix your car), the covered grandstand across it; '
           'greenhouses full of flowers, pastures with cows, eucalyptus woods, a power station with its stacks to the north and the hills '
           'of the Eastern Cordillera on the horizon.')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 14 m from the centre line (OSM w258412094: 14.3 m), from the
# exit of the last corner to 100 m before the first (the real lane leaves inside the last corner and joins at 261 m: OSM); the 13 crews'
# boxes in the pit building's 13 garages (js/world-tocancipa.js), the player's in the middle at the start line; the pit wall 2.5 m past
# the road's edge ----
PIT = [14, -150, 262, 0]
PIT_ROW = [-65, 55]
WALLS = [[-150, 262, 1, 2.5]]
# the grandstand [from, to, side, rows, roof, sections, orange, name]: OSM's covered stand across the straight from the pits (w1233326678,
# 70 x 12 m, 25-37 m from the centre line: its outline in sk.gs, the builder's own), named after the place
STANDS = [[-71, -3, -1, 10, 1, 3, 0, 'TOCANCIPÁ']]
SECTORS = [930, 1775]
REAL_KM = 2.725

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

def profile(poly, d0, d1, step, side):
    # an outline's near and far edge, measured out from the centre line (side -1 left, 1 right) every step m from d0 to d1 after the start
    # line: [[d, near, far], ...] (0, 0 where the normal misses it)
    pts = np.array(poly).reshape(-1, 2); out = []
    for d in np.arange(d0, d1 + 0.01, step):
        s = d % LEN; i = int(np.searchsorted(CUM, s, 'right') - 1); px, pz = at(s); nx, nz = NRM[i] * side; hits = []
        for k in range(len(pts)):
            ax, az = pts[k]; bx, bz = pts[(k + 1) % len(pts)]; ex, ez = bx - ax, bz - az; den = nx * ez - nz * ex
            if abs(den) < 1e-9: continue
            t = ((ax - px) * ez - (az - pz) * ex) / den; u = ((ax - px) * nz - (az - pz) * nx) / den
            if 0 <= u <= 1 and t > 0: hits.append(t)
        out.append([round(float(d)), round(min(hits), 1), round(max(hits), 1)] if len(hits) >= 2 else [round(float(d)), 0, 0])
    return out

def outline_of(k):   # the OSM outline of building k of J['bld'] (game frame), its box where OSM drew a rectangle
    for idx, fl in J['bldOutline']:
        if idx == k: return mv(fl, 10)
    x, z, l, w, a = J['bld'][k][:5]; c, s = math.cos(a), math.sin(a)
    return mv(sum(([x + c * u * l / 2 - s * v * w / 2, z + s * u * l / 2 + c * v * w / 2] for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1))), []), 10)

# ---- the ponds: OSM's two (natural=water) in the infields of the two loops, the west one (76 x 61 m) and the east one (49 x 57 m) ----
LAKES = [np.array(l[3]).reshape(-1, 2) - O for l in J.get('lakes', [])]

def lake_mask(X, Z):   # True in a pond at the points X, Z (a regular grid: the polygons drawn on it)
    c = float(X[0, 1] - X[0, 0]); x0 = float(X[0, 0]); z0 = float(Z[0, 0])
    im = Image.new('L', (X.shape[1], X.shape[0]), 0); dr = ImageDraw.Draw(im)
    for L in LAKES: dr.polygon([((x - x0) / c, (z - z0) / c) for x, z in L], fill=1)
    return np.asarray(im) > 0

def lake_level():   # the ponds' surface (m above the start line): 0.5 m under the lowest ground of the lower one's shore (one level for both: World's rbSea)
    if not LAKES: return None
    gd, ad = grid('dem'); lv = []
    for L in LAKES: sh = sample(gd, ad, L[:, 0], L[:, 1], True) - H0; lv.append(float(np.percentile(sh, 10)) - 0.5)
    return round(min(lv), 2)

LV = lake_level()

def water():
    # the ponds: OSM's shores drawn on 2 m cells, their signed distance (m, + in the water) on 4 m cells over the water and 24 m round it,
    # -30 .. 30 m in 0.25 m steps, run-length coded (as World's rbSea reads it: js/world-rbring.js); one grid over both
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

# ---- the roads: OSM's within 150 m (tools/proga-podatki.py) and the main roads farther out (okolica.json: the trunk road with its links,
# the frontage roads, the secondary road); [width, x, z, ...] ----
WID = {'secondary': 8, 'tertiary': 7.5, 'tertiary_link': 5.5, 'unclassified': 5.5, 'residential': 5, 'service': 4.5, 'track': 3, 'footway': 2, 'cycleway': 2.5}
def main_road_width(kind, lanes):
    if kind in ('trunk', 'trunk_link', 'primary', 'secondary'): return round(lanes * 3.6 + 1.2, 1)
    return 4.5 if lanes <= 1 else 7.5 if lanes <= 2 else round(lanes * 3.4, 1)
ROADS = [[WID[r[0]]] + mv(r[8]) for r in J['roads'] if r[0] in WID and r[0] != 'tertiary'] + [[main_road_width(r[0], r[1])] + mv(r[3]) for r in OK['roads']]

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, above the start line in 0.2 m steps from -20 m (the savanna
    # flat round the circuit, the ground in the grid within a few metres of the start line, the first slopes of the hills to the north-west)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.2; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.08, b64=b64bytes(dem))
    # the main roads and the trunk road (the greenhouses and the houses kept off them)
    rp = np.concatenate([dense(r[1:]) for r in ROADS]); rtree = spatial.cKDTree(rp)
    tp = np.concatenate([dense(mv(r[3])) for r in OK['roads'] if r[0] in ('trunk', 'trunk_link')]); ttree = spatial.cKDTree(tp)
    # the greenhouses (the flower farms of the savanna, roofed in white plastic): WorldCover's built-up where OSM has no land use (not the
    # villages, the industry, the circuit's grounds), no canopy over it, more than 40 m from the centre line, 60 m from the trunk road and
    # 10 m from any other road, in blocks of 800 m2 or more; on WorldCover's 10 m cells: runs along its rows [i, j, n, ...] from (x0, z0)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    GX, GZ = np.meshgrid(g1['x0'] - O[0] + (np.arange(g1['nx']) + 0.5) * g1['cell'], g1['z0'] - O[1] + (np.arange(g1['nz']) + 0.5) * g1['cell'])
    gq = np.stack([GX.ravel(), GZ.ravel()], 1)
    rdd = rtree.query(gq)[0].reshape(GX.shape); tdd = ttree.query(gq)[0].reshape(GX.shape)
    gh = (a1 == 50) & (a2 == 0) & (a3 <= 5) & (dline(GX, GZ) > 40) & (tdd > 60) & (rdd > 10)
    lab, n = ndimage.label(gh); big = ndimage.sum(gh, lab, range(1, n + 1)) >= 8; gh &= big[np.maximum(lab - 1, 0)] & (lab > 0)
    ghr = []
    for j in range(gh.shape[0]):
        i = 0
        while i < gh.shape[1]:
            if gh[j, i]:
                k = i
                while k < gh.shape[1] and gh[j, k]: k += 1
                ghr += [i, j, k - i]; i = k
            else: i += 1
    GH = dict(x0=round(float(g1['x0'] - O[0]), 2), z0=round(float(g1['z0'] - O[1]), 2), cell=g1['cell'], r=ghr)
    # land cover, 16 m cells: 0 open (the circuit's lawns, the pastures of kikuyo grass), 1 woods (the eucalyptus and pine plantations, the
    # copses), 2 fields (crops, ploughed ground), 3 built-up (the villages, the industry, the car parks, the greenhouses, the paddock); ESA
    # WorldCover and the canopy height, OSM's land use (the circuit's grounds, OSM recreation_ground: its lawns)
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (wc == 20) | (ch > 5)] = 1
            cls[((wc == 40) | (wc == 60)) & (ch <= 5) & (lu != 4) & (lu != 10)] = 2
            cls[(((wc == 50) & (lu != 4)) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 5)] = 3
            cls[(wc == 50) & (lu == 4) & (dl > 22) & (ch <= 5)] = 3   # (the paddock and the car parks in the circuit's grounds)
            cls[(lu == 10) & (ch <= 5)] = 0
            cls[lu == 9] = 1
            cls[(lu == 3) & (ch <= 5)] = 2
            cls[(wc == 80) | (lu == 13)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the houses: WorldCover's built-up in the villages and the gated estates (OSM residential) and the farmsteads (no land use, not the
    # greenhouses' blocks), no canopy over it, 40-520 m from the centre line, 30 m from the trunk road, 8 m from the other roads, every 16 m
    # cell's middle a house (the builder picks its kind): [x, z, ...]
    X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5) * c, z0 + (np.arange(lnz) + 0.5) * c)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
    q = np.stack([X.ravel(), Z.ravel()], 1); rd = rtree.query(q)[0].reshape(X.shape); td = ttree.query(q)[0].reshape(X.shape)
    gi = np.clip(((X - GH['x0']) / GH['cell']).astype(int), 0, gh.shape[1] - 1); gj = np.clip(((Z - GH['z0']) / GH['cell']).astype(int), 0, gh.shape[0] - 1)
    hs_m = (wc == 50) & ((lu == 1) | ((lu == 0) & ~gh[gj, gi])) & (ch <= 6) & (dl > 40) & (dl < 520) & (td > 30) & (rd > 8)
    rr = np.random.default_rng(4961); hs_m &= rr.random(hs_m.shape) < 0.62
    hs = []
    for zz, xx in zip(*np.nonzero(hs_m)): hs += [round(float(X[zz, xx] + (rr.random() - 0.5) * 6)), round(float(Z[zz, xx] + (rr.random() - 0.5) * 6))]
    # the buildings (OSM, within 900 m): [x, z, length, width, angle (deg), height, kind (tools/proga-podatki.py's kinds)]; not the pit
    # building nor the grandstand (the builder's own: their outlines measured out from the centre line, sk.rb and sk.gs), nor the power
    # station's (sk.lm)
    bld = []; rb = gs = None
    for k, b in enumerate(J['bld']):
        x, z, l, w, ang, hgt, kind, s, d = b
        sn = (s - S0) % LEN; xx, zz = mv([x, z])
        if l > 120 and 0 < d < 40 and (sn < 30 or sn > LEN - 30): rb = k; continue
        if 60 < l < 90 and -45 < d < 0 and LEN - 80 < sn < LEN: gs = k; continue
        if z < -1000: continue
        hh = hgt or (9.0 if kind == 5 or l > 150 else 4.0 if kind == 4 else 6.5 if l * w > 200 else 5.5)
        bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), int(kind if l < 150 else 5)]
    rbP = profile(outline_of(rb), -70, 70, 7, 1) if rb is not None else None
    gsP = profile(outline_of(gs), -80, 15, 5, -1) if gs is not None else None
    # the circuit's own other ways (OSM highway=raceway): the links of its shorter layouts and the drag strip's run-off past the last corner
    # (asphalt as the circuit's: lk [[x, z, ...]]), the dirt track by the south hairpin (dt), the karting track north-west of the circuit
    # ([closed, x, z, ...]); not the pit lane (World's)
    lk, dt, kart = [], [], []
    for r in J['roads']:
        if r[0] != 'raceway': continue
        fl = r[8]; pts = np.array(fl).reshape(-1, 2); g = mv(fl)
        if len(pts) > 40 and np.hypot(*(pts[0] - [122.4, -31.8])) < 5: continue   # (the pit lane: World's own)
        if r[5] == 'dirt': dt.append(g); continue
        if pts[:, 0].max() < -380:
            closed = int(abs(g[0] - g[-2]) < 1 and abs(g[1] - g[-1]) < 1); kart.append([closed] + g); continue
        lk.append(g)
    return D, LC, dict(bld=bld, rb=rbP, gs=gsP, hs=hs, gh=GH, road=ROADS, lk=lk, dt=dt, kart=kart, sea=water(), lm=landmarks()), lc, hv, gh

def landmarks():
    # farther out (tools/tocancipa/okolica.json, the tool's frame): the power station 1.2-1.5 km north (its stacks [x, z, y, height], its
    # buildings [kind, height, y, x, z, ...]: the boiler houses, the turbine hall, the cooling towers' cells, the substation's yard; its coal
    # yards [y, x, z, ...]), the factory's stack south of the circuit, the power lines [cables, x, z, y, ...] (y: the ground under each point,
    # m above the start line, from the 20 m ground model; beyond it its edge)
    gd, ad = grid('dem')
    def gy(x, z): return round(float(sample(gd, ad, np.array([x]), np.array([z]), True)[0] - H0), 1)
    def xyz(fl):
        g = mv(fl); out = []
        for k in range(0, len(g), 2): out += [g[k], g[k + 1], gy(g[k], g[k + 1])]
        return out
    st = [[*mv(s[:2]), gy(*mv(s[:2])), s[2]] for s in OK['stacks']]
    pl = []
    for kind, h, osm, fl in OK['plant']:
        g = mv(fl); pl.append([kind, h, round(min(gy(g[k], g[k + 1]) for k in range(0, len(g), 2)), 1)] + g)
    coal = []
    for osm, fl in OK['coal']:
        g = mv(fl); coal.append([round(min(gy(g[k], g[k + 1]) for k in range(0, len(g), 2)), 1)] + g)
    pw = [[p[0]] + xyz(p[1]) for p in OK['power']]
    return dict(st=st, pl=pl, coal=coal, pw=pw)

# ---- the horizon (def.far for Riverside's rsFar, as Yahuarcocha): the highest ground in rings round the circuit, out to 19.5 km (the far
# grid: Copernicus DEM, 167 m) for the ridges of the Eastern Cordillera round the savanna (3,000-3,600 m) ----
FAR_R = [1500, 2100, 2800, 3600, 4500, 5500, 6700, 8000, 9500, 11200, 13100, 15200, 17300, 19500]
def far_rings(na=180, step=6):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = 2400
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
    D, LC, SK, lc, hv, gh = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'tocancipa'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Tocancipá, Colombia: the circuit on the Bogotá savanna by Tocancipá, 2,600 m above the sea (opened 1982), its long layout, clockwise,
  // in its real layout and scale: the start line by the middle of the pit building, the pits beside it on the right, the first right and
  // the west loop round a pond, the left after it, the middle esses, the long left onto the east straight, the east loop round another
  // pond, the run back, the south hairpin, the left after it and the last corner: %(km)s km on our line (2.725 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/tocancipa/config.json: the raceway's
  // way 60009149), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south. GENERATED by
  // tools/tocancipa/build.py (edit the names, the pits, the stands and the text there).
  // Heights (TC_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the grades held
  // to 3 %%; every 10 m from the start line, decimetres above it (%(h0)s m a.s.l.).
  // Scenery data for the world builder (js/world-tocancipa.js): terrain (dem: the same model, 16 m cells, heights above the start line in
  // 0.2 m steps), land cover (lc, 16 m cells: 0 the circuit's lawns and the pastures, 1 woods, 2 fields, 3 built-up: OSM, ESA WorldCover,
  // the canopy), and sk: the buildings ([x, z, length, width, angle (deg), height, kind]: OSM outlines as boxes within 900 m, not the pit
  // building and the grandstand, which the builder makes from their outlines measured out from the centre line: rb, gs [[d, near, far]]),
  // the houses (hs: WorldCover's built-up in the villages and on the farms), the greenhouses (gh: WorldCover's built-up with no land use in
  // OSM, as runs [i, j, n] along the rows of its 10 m cells from x0, z0), the roads ([width, x, z, ...]: OSM's, the trunk road and its
  // frontage roads farther out), the circuit's links (lk) and the dirt track (dt) ([x, z, ...]), the karting track ([closed, x, z, ...]),
  // the ponds (sea: the signed distance to their shores, World's rbSea) and lm, the landmarks farther out (tools/tocancipa/okolica.json:
  // the power station's stacks, buildings and coal yards, a factory's stack, the power lines' pylons); far: the horizon (the highest
  // ground in rings round the circuit out to 19.5 km, m a.s.l.: lo + byte x step). The names: plain descriptions only (no names of people,
  // firms, events, the circuit or the power station).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const TC_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xc8d1d6, sun: 0xfff4e4, sunI: 1.08, sky: 0x9cb9d6, gnd: 0x4e7a32, hemiI: 0.76, tint: [0.98, 1.0, 1.0], sat: 1.02, sunOff: [-58, 88, 30], split: [[0.97, 1.0, 1.04], [1.02, 1.0, 0.97]] },   // the savanna at 2,600 m near the equator: a high sun from the west through thin cloud, a cool clear haze
    say: 'Tocancipá', rainP: 0.3,
    grassNat: 0.55, lawn: [0.9, 1.06, 0.86],
    zivali: { a: ['egret', 'cow', 'cowK', 'horse'], t: ['trough'], open: true },   // (the dairy cattle of the savanna and the egrets that follow them)
    id: 'tocancipa', name: 'Tocancipá, Kolumbija', theme: 'tocancipa', laps: 5, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Tocancipá, Colombia', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, runoffTarmac: true, inner: 4.5, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s,   // (runoffTarmac: asphalt run-offs where the barriers stand far out)
    elev: TC_H.map((h, i) => [i / TC_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners and the straights by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the 13 corners' apexes: the first right, the west loop, the left after it, the middle esses (2), the long left, the kink onto the east straight, the east loop (2), the left before the hairpin, the south hairpin, the left after it, the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the pit building's 13 garages: js/world-tocancipa.js)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the covered one across the straight (its outline: sk.gs)
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the first right to the middle esses; the long left, the east straight and the east loop; the run back, the hairpin and the run home
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
    path = os.environ.get('TOCANCIPA_OUT') or os.path.join(ROOT, 'js', 'tracks', 'tocancipa.js'); open(path, 'w').write(src)
    g = np.diff(np.r_[H, H[0]]) / STEP * 100
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(g).max()),
          D['nx'], 'x', D['nz'], '(%.1f .. %.1f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(),
          '; buildings', len(SK['bld']) // 7, 'houses', len(SK['hs']) // 2, 'greenhouse cells', int(gh.sum()), 'roads', len(SK['road']), 'links', [len(l) // 2 for l in SK['lk']],
          'dirt', [len(l) // 2 for l in SK['dt']], 'karting', [(k[0], len(k) // 2) for k in SK['kart']], '; ponds', SK['sea'] and (SK['sea']['nx'], SK['sea']['nz'], SK['sea']['lv']), '; turns', TURNS)
    print('  pit building', SK['rb'] and [r for r in SK['rb'] if r[1]][:3], '...', SK['rb'] and [r for r in SK['rb'] if r[1]][-3:])
    print('  grandstand', SK['gs'] and [r for r in SK['gs'] if r[1]][:3], '...', SK['gs'] and [r for r in SK['gs'] if r[1]][-3:])
    print('  landmarks: stacks', len(SK['lm']['st']), 'plant', [(p[0], p[2]) for p in SK['lm']['pl']], 'coal', [c[0] for c in SK['lm']['coal']], 'power lines', len(SK['lm']['pw']))
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))
    for k in SK: print('    sk.%-5s %5d KB' % (k, len(js(SK[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
