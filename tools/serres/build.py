# Serres, Grčija: the game's track file from the track data (tools/serres/serres.json and its PNG grids, made by tools/proga-podatki.py;
# the karting track's whole loop, the outlines of the bleachers, the paddock, the camp site and the karting's grounds, the pitches, the
# solar parks, the power line, the railway and the main roads farther out in tools/serres/okolica.json, made by tools/serres/okolica.py).
#   python3 -I tools/serres/build.py   -> js/tracks/serres.js (centre line, heights, names, pits, the bleachers, terrain, land cover, the
#   buildings, the media centre, the houses, the roads, the circuit's stubs, the karting track, the brook, the concrete walls, the
#   landmarks farther out, the horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track:
# docs/proge/serres.md.
import base64, json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'serres.json'))); OK = json.load(open(os.path.join(HERE, 'okolica.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: the route's first point is OSM's start line (the node on the main straight by the south-east end of the pit building:
# tools/serres/config.json), so the line and its heights start there as they are, the origin on it
S0 = 0.0; K0 = 0; O = RAW0[0].copy()
RAW = RAW0 - O

# ---- the heights: the plain of Serres is flat (the lap within 5 m: 18.7-24.0 m a.s.l., falling gently to the south-west with the brook),
# the ground model's ripples smoothed away (sigma 10 m) and the grades held to 3 % ----
GMAX = 0.03
def heights():
    h = ndimage.gaussian_filter1d(np.array(J['h'], float), 2.0, mode='wrap')
    for _ in range(400):
        g = (np.roll(h, -1) - h) / STEP; bad = np.abs(g) > GMAX
        if not bad.any(): break
        m = ndimage.maximum_filter1d((bad | np.roll(bad, 1)).astype(np.uint8), size=9, mode='wrap') > 0
        h = np.where(m, ndimage.gaussian_filter1d(h, 1.5, mode='wrap'), h)
    return h
H = heights()
H0 = float(H[0])   # the start line's height above the sea: the game's zero

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

def sd_of(x, z):   # [s (metres after the start line, -LEN/2 .. LEN/2), d (m, + right)] of a point (game frame) to the centre line
    d2 = (P[:, 0] - x) ** 2 + (P[:, 1] - z) ** 2; i = int(d2.argmin()); v = np.array([x, z]) - P[i]
    s = (CUM[i] + float(v @ TU[i])) % LEN
    return (s if s < LEN / 2 else s - LEN), float(v @ NRM[i])

# ---- names on the HUD ([label, s, the commentator's lines]): plain descriptions only (CLAUDE.md, Pravna varnost: no names of the circuit,
# its people, races, firms or sponsors, nor of the roads round it); s in metres from the start line ----
NAMES = [
    ('Lasnica na koncu ravnine', 470, ['Hard on the brakes, the long right at the end of the straight!', 'All the way round the hairpin at the end of the straight!', 'Round the long hairpin, right!']),
    ('Dvojni levi', 860, ['Left and left again!', 'Through the double left!', 'Two lefts, keep it tidy!']),
    ('Južna lasnica', 1103, ['The south hairpin, all the way right!', 'Hard on the brakes, the south hairpin!', 'Round the hairpin at the bottom!']),
    ('Esi', 1320, ['Left, right, left through the esses!', 'Quick through the esses!', 'Into the esses towards the pits!']),
    ('Kratki levi', 1571, ['A short left behind the paddock!', 'Quick left!', 'Through the short left!']),
    ('Levi v notranjosti', 1740, ['Hard left into the infield!', 'The long left into the infield loop!', 'Round the left into the infield!']),
    ('Notranja ravnina', 1880, ['Foot down along the infield straight!', 'Flat out through the infield!', 'Down the infield straight!']),
    ('Jugozahodna lasnica', 2065, ['The south-west hairpin, all the way right!', 'Hard on the brakes, the hairpin by the fields!', 'Round the south-west hairpin!']),
    ('Ob potoku', 2290, ['Flat out along the brook!', 'Down the west straight by the brook!', 'Along the brook, the plane trees on the left!']),
    ('Dolgi desni', 2489, ['The long right at the west end!', 'Hold it through the long right!', 'Round the long right!']),
    ('Severni levi', 2678, ['Left by the railway!', 'The left at the north end!', 'Quick left, the railway alongside!']),
    ('Severni desni', 2758, ['And right!', 'The right at the north end!', 'Right, then down to the last corner!']),
    ('Zadnji ovinek', 2923, ['The last corner, right onto the main straight!', 'Through the last right, the pits are ahead!', 'Round the last corner!']),
    ('Ciljna ravnina', 3060, ['Down the main straight past the pits!', 'Flat out down the main straight!', 'The main straight, the lap is nearly done!']),
]
# the 16 corners' apexes: the long hairpin at the end of the straight (2), the double left (2), the south hairpin, the esses (3), the short
# left, the left into the infield, the south-west hairpin (2), the long right, the left and the right at the north end, the last corner
# ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(440, 1), (600, 1), (804, -1), (914, -1), (1103, 1), (1257, -1), (1322, 1), (1386, -1), (1571, -1), (1760, -1),
                                 (2015, 1), (2120, 1), (2489, 1), (2678, -1), (2758, 1), (2923, 1)]]

DESC = ('Dirkališče na ravnici pod Serresom v grški Makedoniji: 3,2 km, 16 ovinkov, v smeri urinega kazalca. S ciljne ravnine v dolgo '
        'lasnico na koncu ravnine, skozi dvojni levi do južne lasnice, po esih proti boksom, okoli notranje zanke z jugozahodno lasnico, '
        'ob potoku do dolgega desnega in mimo železnice skozi severna ovinka nazaj na ciljno ravnino. Desno ob ciljni ravnini boksi z '
        'garažami (zapelji vanje in mehaniki ti popravijo avto) in medijsko središče, nasproti odprta tribuna; karting, sončne '
        'elektrarne, polja ravnice in gore nad Serresom na obzorju.')
DESC_EN = ('A circuit on the plain below Serres in Greek Macedonia: 3.2 km, 16 corners, clockwise. From the main straight into the long '
           'hairpin at its end, through the double left to the south hairpin, up the esses towards the pits, round the infield loop with '
           'its south-west hairpin, along the brook to the long right and past the railway through the two north corners back onto the '
           'main straight. The pits with their garages and the media centre on the right of the main straight (drive in and the mechanics '
           'fix your car), the open bleachers across it; the karting track, the solar parks, the fields of the plain and the mountains '
           'above Serres on the horizon.')

# ---- the pits (Core.Track.pitAt): OSM's pit lane leaves the circuit before the last corner and runs inside it to the pit building on the
# right of the main straight, 15 m from the centre line, and rejoins past the bleachers 133 m after the start line; the game's lane from just
# after the last corner (its own junction: World's), 14 m from the centre line, its ramp in 40 m long, out to 133 m. The pit building (OSM
# w243154734's 91 m by the start line) with its 18 garages from 170 m before the start line to 10 m after it, the 13 crews' boxes in its
# last 13 (js/world-serres.js), the player's in the middle of those; the pit wall 2.5 m past the road's edge (OSM: 3.3 m) ----
PIT = [14, -210, 133, -55, 40]
PIT_ROW = [-120, 0]
WALLS = [[-210, 133, 1, 2.5]]
GARAGES = [-170, 10]   # (the pit building's 18 garages: from, to)
# the bleachers [from, to, side, rows, roof, sections, orange, name]: OSM's (leisure=bleachers, 58 x 10 m) on the left across the straight
# from the pits, open, named after the place (the builder's own: js/world-serres.js, its outline sk.gs)
STANDS = [[-60, -2, -1, 10, 0, 3, 0, 'SERRES']]
SECTORS = [1180, 2170]
REAL_KM = 3.186

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
        out.append([round(float(d)), round(float(min(hits)), 1), round(float(max(hits)), 1)] if len(hits) >= 2 else [round(float(d)), 0, 0])
    return out

def closed_pts(fl):   # an outline [x, z, ...] without its repeated last point
    if len(fl) >= 4 and abs(fl[0] - fl[-2]) < 0.01 and abs(fl[1] - fl[-1]) < 0.01: return fl[:-2]
    return fl

# ---- the concrete walls by the circuit (OSM barrier=wall, concrete, 1 m): where one runs within 25 m of the centre line along it, its
# stretch [from, to, side] (metres after the start line): the left of the main straight in front of the bleachers, the left of the west
# straight by the brook, the outside of the north left, the right before the esses (the pit wall is World's: def.walls) ----
def walls_by_track():
    out = []
    for w in J['walls']:
        g = mv(w[3]); q = [sd_of(*p) for p in dense(g, 2.0)]
        q = [(s, d) for s, d in q if 5 < abs(d) < 25]
        if len(q) < 6: continue
        side = 1 if np.median([d for _, d in q]) > 0 else -1
        if side > 0 and min(s for s, _ in q) > -260 and max(s for s, _ in q) < 140: continue   # (the pit wall: World's)
        ss = sorted(s % LEN for s, _ in q)
        if ss[-1] - ss[0] > LEN / 2: ss = sorted(s - LEN if s > LEN / 2 else s for s in ss)   # (a wall across the start line: from before it)
        out.append([round(ss[0]), round(ss[-1]), side])
    return out
CW = walls_by_track()

# ---- the roads: OSM's within 150 m (tools/proga-podatki.py: the farm tracks and the service roads round the circuit, its own access roads)
# and the main roads farther out (okolica.json: the ring road east of the circuit, the roads across the plain); [width, x, z, ...] ----
WID = {'service': 4.5, 'track': 3, 'footway': 2, 'cycleway': 2.5, 'residential': 5}
def main_road_width(kind, lanes):
    if kind in ('trunk', 'trunk_link', 'primary', 'secondary'): return round(max(2, lanes) * 3.6 + 1.6, 1)
    return 7.0 if kind.startswith('tertiary') else 6.0 if kind == 'unclassified' else 5.5
ROADS = [[WID[r[0]]] + mv(r[8]) for r in J['roads'] if r[0] in WID] + [[main_road_width(r[0], r[1])] + mv(r[2]) for r in OK['roads']]

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, above the start line in 0.2 m steps from -20 m (the plain
    # flat round the circuit, falling a few metres to the south-west)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -20.0, 0.2; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.06, b64=b64bytes(dem))
    rp = np.concatenate([dense(r[1:]) for r in ROADS]); rtree = spatial.cKDTree(rp)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    # the buildings (OSM, within 900 m): [x, z, length, width, angle (deg), height, kind (tools/proga-podatki.py's kinds)]; not the pit
    # building (the builder's own along the pit lane, with its 18 garages) nor the media centre behind its south-east end (sk.mc: [x, z,
    # length, width, angle (deg), height])
    bld = []; mc = None
    for k, b in enumerate(J['bld']):
        x, z, l, w, ang, hgt, kind, s, d = b
        xx, zz = mv([x, z]); sn, dn = sd_of(xx, zz)
        if l > 80 and 15 < dn < 45 and -120 < sn < 40: continue   # (the pit building)
        if 15 < l < 30 and 50 < dn < 90 and -20 < sn < 40: mc = [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), 8.4]; continue
        hh = hgt or (8.0 if l > 120 else 4.0 if kind == 4 else 6.5 if l * w > 600 else 5.0)
        bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), int(kind if l < 150 else 5)]
    bp = np.array([[bld[k], bld[k + 1]] for k in range(0, len(bld), 7)]) if bld else np.zeros((1, 2)) + 1e6; btree = spatial.cKDTree(bp)
    # land cover, 16 m cells: 0 open (the circuit's lawns, the grass and the fallow ground), 1 woods (the poplar rows and the copses, the
    # plane trees along the brook), 2 fields (cotton, maize and wheat, the orchards; the plain beyond the 500 m of WorldCover's grid round the
    # circuit), 3 built-up (the farms and the town's edge, the paddock and the car parks); ESA WorldCover and the canopy height, OSM's land
    # use (the circuit's grounds: OSM sports_centre, its lawns)
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 0] = 2   # (beyond WorldCover's 500 m round the circuit: the plain's fields)
            cls[(wc == 10) | (ch > 5)] = 1
            cls[((wc == 40) | (lu == 3) | (lu == 7)) & (ch <= 5) & (lu != 10) & (lu != 4)] = 2
            cls[(((wc == 50) & (lu != 10) & (lu != 4)) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 5)] = 3
            cls[(wc == 50) & (lu == 10) & (dl > 30) & (ch <= 5)] = 3   # (the paddock, the karting's yard and the car parks in the circuit's grounds)
            cls[(lu == 10) & (wc != 50) & (ch <= 5)] = 0
            cls[lu == 9] = 1
            cls[(wc == 80) | (lu == 13)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the houses: WorldCover's built-up on the farms and at the town's edge (OSM residential, no land use), no canopy over it, 40-520 m from
    # the centre line, 10 m from the roads and 14 m from OSM's buildings (those are drawn from their outlines): every 16 m cell's middle a
    # house (the builder picks its kind): [x, z, ...]
    X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5) * c, z0 + (np.arange(lnz) + 0.5) * c)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
    q = np.stack([X.ravel(), Z.ravel()], 1); rd = rtree.query(q)[0].reshape(X.shape); bd = btree.query(q)[0].reshape(X.shape)
    hs_m = (wc == 50) & ((lu == 1) | (lu == 0)) & (ch <= 6) & (dl > 40) & (dl < 520) & (rd > 10) & (bd > 14)
    rr = np.random.default_rng(4961); hs_m &= rr.random(hs_m.shape) < 0.62
    hs = []
    for zz, xx in zip(*np.nonzero(hs_m)): hs += [round(float(X[zz, xx] + (rr.random() - 0.5) * 6)), round(float(Z[zz, xx] + (rr.random() - 0.5) * 6))]
    # the circuit's own other ways (OSM highway=raceway): the two stubs straight on from the main straight's ends (asphalt as the circuit's:
    # lk [[x, z, ...]]), the karting track north-east of the main straight ([closed, x, z, ...]: okolica.json, its whole loop); not the pit
    # lane (World's) nor the karting's pieces within 150 m (okolica.json has all of it)
    kp = np.array(OK['kart'][0][2]).reshape(-1, 2) - O if OK['kart'] else np.zeros((1, 2)) + 1e6; ktree = spatial.cKDTree(kp)
    lk = []
    for r in J['roads']:
        if r[0] != 'raceway': continue
        fl = r[8]; pts = np.array(fl).reshape(-1, 2); g = mv(fl)
        if len(pts) > 12: continue   # (the pit lane: World's own; the karting's pieces)
        if ktree.query(pts - O)[0].max() < 8: continue
        lk.append(g)
    kart = [[k[1]] + mv(closed_pts(k[2]) if k[1] else k[2]) for k in OK['kart']]
    gs = profile(mv(closed_pts(OK['outl']['stand'][1]), 10), -70, 5, 5, -1)
    pad = mv(closed_pts(OK['outl']['paddock'][1]))
    camp = mv(closed_pts(OK['outl']['camp'][1]))
    kyard = mv(closed_pts(OK['outl']['kartyard'][1]))
    # the brook (OSM waterway=stream) west and south of the circuit: its line [x, z, ...] (the builder lays its bed and its water as Kågeröd's
    # river, the plane trees and the reeds along it)
    river = [mv(w[3]) for w in J['water'] if w[0] in ('stream', 'river', 'ditch', 'drain', 'canal')]
    SK = dict(bld=bld, mc=mc, gs=gs, pad=pad, camp=camp, kyard=kyard, hs=hs, road=ROADS, lk=lk, kart=kart, river=river, cw=CW, gar=GARAGES, lm=landmarks())
    return D, LC, SK, lc, hv

def landmarks():
    # farther out (tools/serres/okolica.json, the tool's frame): the power line [cables, x, z, y, ...], the railway [service, x, z, y, ...]
    # (the main line north of the circuit and the branches), the solar parks [y, x, z, ...], the pitches of the sports grounds east of the
    # circuit [sport, y, x, z, ...] (y: the ground, m above the start line, from the 20 m ground model; beyond it its edge)
    gd, ad = grid('dem')
    def gy(x, z): return round(float(sample(gd, ad, np.array([x]), np.array([z]), True)[0] - H0), 1)
    def xyz(fl):
        g = mv(fl); out = []
        for k in range(0, len(g), 2): out += [g[k], g[k + 1], gy(g[k], g[k + 1])]
        return out
    def ymin(g): return round(min(gy(g[k], g[k + 1]) for k in range(0, len(g), 2)), 1)
    pw = [[p[0]] + xyz(p[1]) for p in OK['power']]
    rail = [[r[0]] + xyz(r[1]) for r in OK['rail']]
    solar = []
    for osm, fl in OK['solar']:
        g = mv(closed_pts(fl)); solar.append([ymin(g)] + g)
    pitch = []
    for sport, osm, fl in OK['pitch']:
        g = mv(closed_pts(fl)); pitch.append([sport, ymin(g)] + g)
    return dict(pw=pw, rail=rail, solar=solar, pitch=pitch)

# ---- the horizon (def.far for Riverside's rsFar, as Tocancipá): the highest ground in rings round the circuit, out to 29.5 km (the far
# grid: Copernicus DEM, 250 m) for the mountains round the plain of Serres (to the north above the town, to the east, the hills to the
# south and the west: 600-1,900 m) ----
FAR_R = [1500, 2100, 2800, 3600, 4500, 5500, 6700, 8000, 9500, 11200, 13100, 15200, 17500, 20000, 22500, 25000, 27500, 29500]
def far_rings(na=180, step=8):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = 0
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
    src = '''/* Track definition 'serres'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Serres, Greece: the circuit on the plain south-west of Serres in Greek Macedonia, in its real layout and scale: the start
  // line on the main straight by the south-east end of the pit building, the pits beside it on the right, the long hairpin at the end of
  // the straight, the double left, the south hairpin, the esses, the short left, the infield loop with its south-west hairpin, the straight
  // along the brook, the long right, the left and the right by the railway and the last corner onto the main straight: %(km)s km on our
  // line (3.186 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/serres/config.json: the raceway's ways
  // from the start line round the lap, relation 3288097), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x
  // east, z south. GENERATED by tools/serres/build.py (edit the names, the pits, the stands and the text there).
  // Heights (SR_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the grades held
  // to 3 %%; every 10 m from the start line, decimetres above it (%(h0)s m a.s.l.).
  // Scenery data for the world builder (js/world-serres.js): terrain (dem: the same model, 16 m cells, heights above the start line in
  // 0.2 m steps), land cover (lc, 16 m cells: 0 the circuit's lawns and the grass, 1 woods, 2 fields and orchards, 3 built-up: OSM, ESA
  // WorldCover, the canopy), and sk: the buildings ([x, z, length, width, angle (deg), height, kind]: OSM outlines as boxes within 900 m), the
  // media centre (mc: [x, z, length, width, angle (deg), height]), the bleachers' outline measured out from the centre line (gs: [d, near,
  // far]), the outlines of the paddock (pad), the camp site (camp) and the karting's yard (kyard) ([x, z, ...]), the houses (hs: WorldCover's
  // built-up on the farms and at the town's edge), the roads ([width, x, z, ...]: OSM's, the main roads farther out), the circuit's stubs
  // (lk: [x, z, ...]), the karting track ([closed, x, z, ...]), the brook (river: [x, z, ...]), OSM's concrete walls by the circuit (cw:
  // [from, to, side], metres after the start line), the pit building's garages (gar: [from, to]) and lm, farther out: the power line, the
  // railway, the solar parks and the pitches (tools/serres/okolica.json); far: the horizon (the highest ground in rings round the circuit
  // out to 29.5 km, m a.s.l.: lo + byte x step). The names: plain descriptions only (no names of people, firms, events, the circuit or its
  // roads).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SR_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd2d7da, sun: 0xfff0d4, sunI: 1.18, sky: 0x8db5dc, gnd: 0x9a8f52, hemiI: 0.72, tint: [1.03, 1.0, 0.94], sat: 1.0, sunOff: [72, 96, -28], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // the plain of Macedonia in summer: a hot high sun, a hazy pale blue sky, the stubble and the dry grass
    say: 'Serres', rainP: 0.1,
    grassNat: 0.66, lawn: [0.97, 1.02, 0.8],
    zivali: { a: ['stork', 'sheep', 'hare', 'donkey'], t: ['storkNest', 'beehive', 'trough'], open: true },   // (the white storks of the plain, nesting on the poles, the flocks on the stubble, the hares of the fields, a donkey by a farm)
    id: 'serres', name: 'Serres, Grčija', theme: 'serres', laps: 5, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Serres, Greece', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, runoffTarmac: true, inner: 4.5, side: 7, gradeForce: true, elevSmooth: 10, realKm: %(real)s,   // (runoffTarmac: asphalt run-offs where the barriers stand far out)
    elev: SR_H.map((h, i) => [i / SR_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners and the straights by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the 16 corners' apexes: the long hairpin at the end of the straight (2), the double left (2), the south hairpin, the esses (3), the short left, the left into the infield, the south-west hairpin (2), the long right, the left and the right at the north end, the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box, the ramp in] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the last 13 of the pit building's 18 garages: js/world-serres.js)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the open bleachers across the straight from the pits
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the long hairpin, the double left and the south hairpin; the esses and the infield loop; along the brook, the north end and the main straight
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
    path = os.environ.get('SERRES_OUT') or os.path.join(ROOT, 'js', 'tracks', 'serres.js'); open(path, 'w').write(src)
    g = np.diff(np.r_[H, H[0]]) / STEP * 100
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(g).max()),
          D['nx'], 'x', D['nz'], '(%.1f .. %.1f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(),
          '; buildings', len(SK['bld']) // 7, 'media centre', SK['mc'], 'houses', len(SK['hs']) // 2, 'roads', len(SK['road']), 'stubs', [len(l) // 2 for l in SK['lk']],
          'karting', [(k[0], len(k) // 2) for k in SK['kart']], 'brook', [len(r) // 2 for r in SK['river']], '; turns', TURNS)
    print('  concrete walls', SK['cw'], '; bleachers', [p for p in SK['gs'] if p[2]][:3], '...')
    print('  power', [(p[0], len(p) // 3) for p in SK['lm']['pw']], 'rail', len(SK['lm']['rail']), 'solar', [len(s) // 2 for s in SK['lm']['solar']], 'pitches', [p[0] for p in SK['lm']['pitch']])
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))
    for k in SK: print('    sk.%-5s %5d KB' % (k, len(js(SK[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
