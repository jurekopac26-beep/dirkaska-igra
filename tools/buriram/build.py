# Buriram, Tajska: the game's track file from the track data (tools/buriram/buriram.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/buriram/build.py   -> js/tracks/buriram.js (centre line, heights, names, pits, stands, terrain, land cover, scenery data, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A15), the track: docs/proge/buriram.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'buriram.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: OSM has none; on the main straight 265 m after the data's first point (the OSM node nearest to the middle of the pit
# lane: tools/buriram/config.json), about level with the middle of the pit building. The line and everything else moved so that the finish
# line is the origin and the first point ----
K0 = 53; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway way of the circuit, clockwise as raced (oneway=yes), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (a grey opening and closing: the model's humps and hollows of 2-4 m in the infield are the trees, the banks
# and the drains by the road, not the road), smoothed (sigma 30 m): the plateau of the north-east falling gently from the main straight
# (177 m above the sea) to the hairpin at the north end (165 m) and back; the main straight level, grades at most 3 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.03 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-250 / STEP)); i1 = int(round(200 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from Turn 12's exit to Turn 1's brakes
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
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (12: 7 right, 5 left) ----
NAMES = [
    ('Desni na koncu ravnine', 270, ['Hard on the brakes for Turn 1!', 'The right at the end of the main straight!', 'Down the gears into the first right!']),
    ('Hitri levi pregib', 905, ['Flat through the left kink of Turn 2!', 'The fast kink, foot down!', 'Through Turn 2, the hairpin ahead!']),
    ('Lasnica', 1315, ['Hard on the brakes for the hairpin!', 'The tight right of Turn 3!', 'Round the hairpin, the slowest of the lap!']),
    ('Ravnina proti jugu', 1750, ['Flat out down the straight to the south!', 'The long run back down the plateau!', 'Full throttle, the infield ahead!']),
    ('Levi pred ribnikom', 2220, ['The left of Turn 4!', 'Left, and into the infield!', 'Through Turn 4, the pond ahead!']),
    ('Ostri levi', 2535, ['The tight left of Turn 5!', 'Hard on the brakes for the tight left!', 'Round Turn 5, the pond on the inside!']),
    ('Levi ob ribniku', 2685, ['The long left of Turn 6, round the pond!', 'Left again, the water on the inside!', 'Through the long sweep of Turn 6!']),
    ('Desni proti severu', 2875, ['The right of Turn 7, heading north!', 'Right, and up the infield!', 'Through Turn 7!']),
    ('Desni ob mokrišču', 3225, ['The right of Turn 8, by the wetland!', 'Right, the reeds on the inside!', 'Round Turn 8!']),
    ('Dolgi desni', 3450, ['The long right of Turn 9!', 'Round the long right-hander, the load builds!', 'Through the long sweep of Turn 9!']),
    ('Levi na vzhodu', 3650, ['The left of Turn 10!', 'Left, on the east side of the circuit!', 'Through Turn 10!']),
    ('Desni pregib', 3800, ['The right kink of Turn 11!', 'Flat through Turn 11!', 'The kink, and the run to the last corner!']),
    ('Ostri desni', 4250, ['Hard on the brakes for the last corner!', 'The tight right of Turn 12, onto the main straight!', 'Round the final right!']),
    ('Ciljna ravnina', 4430, ['Down the main straight past the big grandstand!', 'Flat out along the main straight, the pits on the left!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 12 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the right at the end of the
# main straight, 2 the left kink, 3 the hairpin, 4 the left before the pond, 5 the tight left, 6 the long left by the pond, 7 the right to the
# north, 8 the right by the wetland, 9 the long right, 10 the left on the east side, 11 the right kink, 12 the tight right onto the straight
TURNS = [285, 905, 1330, 2225, 2535, 2685, 2875, 3226, 3450, 3650, 3800, 4258]

DESC = ('Dirkališče sredi riževih polj severovzhodne Tajske pri Buriramu: 4,5 km v smeri urinega kazalca, 12 zavojev (7 desnih in 5 levih) '
        'na skoraj ravni planoti. Ciljna ravnina mimo velike glavne tribune nad boksi, desni na koncu ravnine, dolga ravnina proti severu s '
        'hitrim levim pregibom do ostre desne lasnice, nato ravnina nazaj proti jugu. Zadnji del vijuga okrog ribnika in mokrišč, levo in desno, '
        'do ostrega desnega na ciljno ravnino. Tropsko sonce ob koncu deževne dobe, zelena in zlata riževa polja s sladkornimi palmami, '
        'tribune ob progi in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit among the rice fields of north-east Thailand near Buriram: 4.5 km, clockwise, 12 turns (7 right, 5 left) on a nearly '
           'level plateau. The main straight past the big main grandstand above the pits, the right at the end of the straight, the long '
           'straight to the north with the fast left kink to the tight right hairpin, then the straight back to the south. The last part winds '
           'round a pond and the wetlands, left and right, to the tight right onto the main straight. Tropical sun at the end of the rainy '
           'season, green and golden rice fields with sugar palms, grandstands by the track and the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the left of the main straight (the outside: OSM's pit lane, ~12 m from the centre line, and
# the pit building under the main grandstand there), from after the last corner to before Turn 1's brakes (the real lane leaves before Turn
# 12 and comes back after Turn 1); the 13 crews' boxes in the middle of the pit building, the player's the 7th; the garages along the lane
# (OSM: the main grandstand's building ~215 m, its front ~28 m from the centre line, and the building after it); the pit wall 2.5 m past
# the road's edge ----
PIT = [-15, -220, 150, -55]   # (the player's box: the 7th crew's, -60 .. -50 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-120, 0]
PIT_BOX = [-160, 120, -1]   # (the garages: World's RB_LOOK.buriram.pitBox; the crews' 13 open; the main grandstand behind and above them: World's brMain)
WALLS = [[-220, 150, -1, 2.5]]   # the pit wall along the lane
# the barriers moved out (def.wide) where OSM's grandstands stand back from the road: the roofed stand after Turn 1 (its front ~20 m from
# the centre line), the bleachers before and after the hairpin (36-70 m: here at ~25-30 m) and outside Turns 9-11 (54-90 m: here at ~28 m)
WIDE = [[545, 770, -1, 5], [1110, 1230, -1, 12], [1610, 1700, -1, 14], [3495, 3525, -1, 12], [3785, 3950, -1, 14]]
# grandstands [from, to, side, rows, roof, sections, orange, name] (OSM: the three roofed buildings on the left after Turn 1, leisure=bleachers
# in blocks on the left before the hairpin, after it and outside Turns 9-11; the main grandstand over the pits is World's own): their names
# places of the province of Buriram and of the plateau
STANDS = [[550, 765, -1, 14, 1, 3, 0, 'ISAN'], [1115, 1225, -1, 9, 0, 3, 0, 'NANG RONG'], [1614, 1694, -1, 9, 0, 3, 0, 'PHANOM RUNG'],
          [3500, 3520, -1, 8, 0, 1, 0, 'SATUEK'], [3790, 3880, -1, 9, 0, 3, 0, 'KRASANG'], [3900, 3945, -1, 9, 0, 1, 0, 'KHORAT']]
SECTORS = [1450, 3000]
# the two DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 150 m before Turn
# 12, open from 60 m after it along the main straight to Turn 1; detection 120 m before Turn 1, open from 120 m after it up the long straight
# to the north to the hairpin
DRS = [[12, -150, 60, 1], [1, -120, 120, 3]]
REAL_KM = 4.554

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the pond and the wetlands, the buildings and the roads (sk), the horizon (far) ----
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

def inside(poly, X, Z):   # points (arrays) inside a polygon [[x, z], ...]
    res = np.zeros(X.shape, bool); n = len(poly)
    for i in range(n):
        ax, az = poly[i]; bx, bz = poly[(i + 1) % n]
        c = ((az > Z) != (bz > Z)) & (X < (bx - ax) * (Z - az) / ((bz - az) or 1e-9) + ax); res ^= c
    return res

def pairs(a): return [[a[k], a[k + 1]] for k in range(0, len(a) - 1, 2)]

# the wetlands in the infield (OSM natural=wetland: ways 1489057473 inside Turns 7-10 and 1489057474 inside Turns 9-11, and the wet meadow
# 1327506925 between the long straights; [x, z, ...] in the data's frame, 0.5 m): no trees, wet grass and reeds (World's brMarsh)
WET = [[-107.5, -402.5, -86.5, -395.0, -74.0, -392.5, -65.5, -396.5, -60.0, -403.0, -56.5, -409.5, -59.0, -422.5, -67.0, -439.5, -75.5, -460.0, -85.0, -481.0,
        -101.0, -504.5, -111.0, -521.0, -124.5, -553.0, -130.0, -568.5, -131.0, -579.5, -131.0, -585.5, -133.0, -588.5, -138.5, -590.0, -183.5, -594.5, -187.5, -592.0,
        -191.0, -588.5, -198.0, -504.5, -197.0, -493.0, -193.0, -476.0, -190.0, -467.0, -181.5, -454.0, -171.0, -440.0],
       [-180.5, -615.0, -181.0, -609.0, -177.5, -606.0, -171.0, -603.5, -135.5, -601.5, -131.5, -603.5, -131.0, -606.0, -130.5, -611.0, -127.0, -619.5, -113.5, -645.0,
        -107.5, -653.0, -58.0, -694.0, -52.0, -702.5, -49.0, -712.0, -49.0, -721.0, -52.0, -728.0, -56.5, -733.0, -60.5, -736.0, -66.0, -738.0, -74.5, -738.0,
        -87.5, -737.0, -103.5, -734.5, -112.0, -733.5, -133.5, -730.0, -141.5, -726.5, -152.0, -721.5, -157.0, -717.0, -163.0, -712.0, -169.0, -704.5, -172.5, -691.0],
       [-424.0, -239.0, -439.0, -245.0, -451.0, -259.5, -451.5, -275.5, -366.0, -640.5, -358.5, -645.5, -348.5, -644.5, -353.5, -577.5, -406.0, -260.0]]

def lakes():   # the pond in the infield inside Turns 4-6 (OSM natural=water, water=pond): ['', x, z, ...] in our frame, 0.5 m
    out = []
    for kind, name, closed, pts in J['lakes']:
        q = np.array(mv(pts)).reshape(-1, 2)
        if not closed or len(q) < 4: continue
        if np.hypot(*(q[0] - q[-1])) < 0.5: q = q[:-1]
        out.append([name] + [round(v * 2) / 2 for v in q.ravel()])
    return out

def dem_fixed():   # the ground model with the buildings' holes filled: the model is older than the circuit's buildings, the OSM buildings (the
    # main grandstand's 32 m) taken off it dug pits of 4-16 m where the ground was level; their footprints (and 20 m round) filled from the
    # ground round them (a Laplace fill)
    g, a = grid('dem'); A = a.astype(np.float64) / 10 - 100
    X, Z = np.meshgrid(g['x0'] + (np.arange(g['nx']) + 0.5) * g['cell'], g['z0'] + (np.arange(g['nz']) + 0.5) * g['cell'])
    M = np.zeros(A.shape, bool)
    for b in J['bld']:
        x, z, l, w, ang = b[:5]; x -= OX; z -= OZ; ca, sa = math.cos(ang), math.sin(ang)
        u = (X - x) * ca + (Z - z) * sa; v = -(X - x) * sa + (Z - z) * ca
        M |= (np.abs(u) < l / 2 + 20) & (np.abs(v) < w / 2 + 20)
    F = A.copy(); F[M] = A[~M].mean() if M.any() else 0
    for _ in range(500):
        F[M] = ((np.roll(F, 1, 0) + np.roll(F, -1, 0) + np.roll(F, 1, 1) + np.roll(F, -1, 1)) / 4)[M]
    return g, np.round((F + 100) * 10)

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m, the buildings' holes filled) on 16 m cells, above the finish line in
    # steps of 0.05 m multiples from its lowest point (the plateau within some 15 m of the finish line round the circuit)
    gd, ad2 = dem_fixed()
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.12, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the circuit's lawns and the grass round it), 1 the trees (the rows and the groves by the roads and the
    # car parks, the trees round the villages), 2 the rice fields and the wet ground (the paddies of the plain beyond the circuit's grounds and
    # out past the data's 150 m, the wetlands and the pond in the infield: no trees but a few sugar palms on the dykes), 3 built-up (the car
    # parks, the paddock's and the villages' buildings): ESA WorldCover, the canopy height (Meta / WRI: trees over 5 m) and OSM over it
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    LK = lakes(); wet = [pairs(L[1:]) for L in LK] + [pairs(mv(r)) for r in WET]
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[wc == 0] = 2   # (out past the data: the plain's paddies)
            cls[((wc == 40) | (wc == 90) | (wc == 80)) & (lu != 10)] = 2
            cls[(ch >= 5) | (wc == 10)] = 1
            cls[(wc == 50) & (lu != 10)] = 3   # (built-up inside the circuit's grounds (OSM): its paved run-offs and roads, the builder's own: grass)
            cls[lu == 9] = 1; cls[(lu == 1) | (lu == 2) | (lu == 14)] = 3
            for poly in wet: cls[inside(poly, X, Z)] = 2
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: only the building behind the end of the pit
    # building (the main grandstand's own and the garages: World's; the three roofed buildings after Turn 1: def.stands)
    bld = []
    for b in J['bld']:
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        if hgt >= 30: continue   # (the main grandstand: brMain in js/world-buriram.js)
        q = sd(x, z)
        if 500 < q[0] < 800: continue   # (the roofed stand after Turn 1: def.stands)
        hh = hgt if hgt > 0 else 9.0 if l * w > 2000 else 7.5 if l * w > 500 else 5.5 if l * w > 100 else 3.2
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the service roads round the circuit and the private road along its east side (OSM highway=service and =unclassified within 60 m, not
    # in a tunnel): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[3] == 2 or r[0] not in ('service', 'unclassified'): continue
        q = mv(r[-1]); svc += [len(q) // 2] + q
    wetl = [[round(v * 2) / 2 for v in mv(r)] for r in WET]
    return D, LC, dict(bld=bld, svc=svc, lakes=LK, wet=wetl)

# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the plateau's low swells, the woods and
# the villages on it, the town of Buriram to the east) ----
FAR_R = [1500, 2000, 2700, 3500, 4500, 5600, 7000, 8500, 10000, 11500]   # the rings' outer distances (m from the circuit's middle; the far grid reaches ~12 km)
def far_rings(na=180, step=2):
    g, a = grid('far'); A = a.astype(np.float64) / 10 - 100   # (m above the sea)
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
    hk = H[::2]; brh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'buriram'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Buriram, Thailand: the circuit among the rice fields of the plateau of north-east Thailand by the town of Buriram, clockwise, in its
  // real layout and scale: the finish line on the main straight (no finish line in OSM: level with the middle of the pit building; the pits
  // and the big main grandstand above them on the left), the right of Turn 1 at the end of the straight, the long straight to the north with
  // the fast left kink of Turn 2, the hairpin of Turn 3, the straight back to the south, the lefts of Turns 4, 5 and 6 round the pond, the
  // rights of Turns 7, 8 and 9 by the wetlands, the left of Turn 10, the right kink of Turn 11 and the tight right of Turn 12 onto the main
  // straight: %(km)s km on our line (4.55 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/buriram/config.json: the raceway way of
  // the circuit, oneway=yes in the race direction), the corners at its nodes rounded (sigma 5 m); metres, origin = the finish line, x east,
  // z south. GENERATED by tools/buriram/build.py (edit the names, the pits, the stands and the text there).
  // Heights (BR_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its bumps taken out,
  // smoothed, grades at most 3 %%, the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.): the
  // plateau, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-buriram.js on js/world-rbring.js): terrain (dem: the same model, the buildings' holes in it
  // filled, 16 m cells, heights above the finish line), land cover (lc, 16 m cells: 0 the lawns and the grass, 1 the trees, 2 the rice
  // fields, the wetlands and the pond, 3 the car parks and the villages: ESA WorldCover, the canopy height and OSM), and sk: the building
  // behind the end of the pit building (bld: [x, z, length, width, angle (deg), height]: OSM), the service roads round the circuit (svc:
  // [points, x, z, ...]: OSM), the pond in the infield (lakes: [name, x, z, ...]: OSM), the wetlands (wet: [x, z, ...]: OSM); the horizon
  // (far: the highest ground in rings round the circuit, Copernicus DEM, for Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const BR_H = [%(brh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd3dde2, sun: 0xfff1d8, sunI: 1.16, sky: 0x8bb6e0, gnd: 0x5f7a3c, hemiI: 0.68, tint: [0.99, 1.01, 0.97], sat: 1.05, sunOff: [-62, 84, 48], split: [[0.97, 1.0, 1.04], [1.04, 1.01, 0.95]] },   // the plateau of the north-east at the end of the rainy season: a high tropical sun in the afternoon, a humid haze, the paddies green and gold
    say: 'Buriram',
    grassNat: 0.55, lawn: [0.98, 1.04, 0.86],
    zivali: { a: ['buffalo', 'egret'], t: ['palmHut', 'waterTank'], open: true },
    id: 'buriram', name: 'Buriram, Tajska', theme: 'buriram', laps: 3, halfWidth: 6.5,
    desc: %(desc)s,
    en: { name: 'Buriram, Thailand', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.1, inner: 4.2, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true,
    elev: BR_H.map((h, i) => [i / BR_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-12 (their number boards): the right at the end of the straight, the left kink, the hairpin, the left before the pond, the tight left, the long left by the pond, the right to the north, the right by the wetland, the long right, the left on the east side, the right kink, the tight right
    pit: %(pit)s,   // pit lane on the left of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.buriram.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barriers back behind wide verges by the grandstands: after Turn 1, before and after the hairpin, outside Turns 9-11
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the roofed stand after Turn 1, the bleachers before and after the hairpin and outside Turns 9-11 (the main grandstand over the pits: World's own)
    stands: %(stands)s,
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the main straight from Turn 12 to Turn 1, the long straight from Turn 1 to the hairpin
    sectors: %(sectors)s,   // the three sectors of the timing screens: to the hairpin and back up past it, the infield round the pond, the east side and the main straight
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
    path = os.path.join(ROOT, 'js', 'tracks', 'buriram.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; lakes', len(SK['lakes']), '; wetlands', len(SK['wet']))
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    info()

if __name__ == '__main__':
    build_track()
