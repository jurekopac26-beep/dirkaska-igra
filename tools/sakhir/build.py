# Sakhir, Bahrajn: the game's track file from the track data (tools/sakhir/sakhir.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/sakhir/build.py   -> js/tracks/sakhir.js (centre line, heights, names, pits, terrain, land cover, scenery data, horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/nove-proge-1-0.md (Del 3, A16), the track: docs/proge/sakhir.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'sakhir.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)

# ---- the finish line: OSM has none; on the main straight 385 m after the data's first point (the junction where the pit lane leaves the
# circuit: tools/sakhir/config.json), level with the middle of the pit lane and of the pit building. The line and everything else moved so
# that the finish line is the origin and the first point ----
K0 = 77; OX, OZ = (float(v) for v in RAW0[K0])
RAW = np.roll(RAW0, -K0, 0) - [OX, OZ]
def mv(q): return [round(v - (OX if k % 2 == 0 else OZ), 1) for k, v in enumerate(q)]   # a flat [x, z, x, z, ...] list in the data's frame -> ours

# ---- the centre line: OSM's raceway ways of the Grand Prix layout, clockwise as raced (oneway=yes), its nodes' corners rounded (sigma 5 m) ----
P = np.stack([ndimage.gaussian_filter1d(RAW[:, 0], 1.0, mode='wrap'), ndimage.gaussian_filter1d(RAW[:, 1], 1.0, mode='wrap')], 1)

def smooth_bend(P, s0, s1, sig):
    # Turn 10, the tight left: OSM's few nodes round its apex make it a corner of ~10 m radius on the centre line (the inside edge ~3 m:
    # tighter than the hairpin of Turn 1, the slowest corner of the lap). Its curvature evened out along it (a Gaussian of sig m, faded in
    # and out over the first and the last 60 m: Tuzla's smooth_bend), the turn's total kept; the line rebuilt from it and its end's miss
    # spread smoothly along it: both ends and their headings as they were
    n = len(P); idx = np.arange(int(round(s0 / STEP)), int(round(s1 / STEP)) + 1) % n
    Q = P[idx]; d = np.diff(Q, axis=0); th = np.unwrap(np.arctan2(d[:, 1], d[:, 0])); ln = np.hypot(d[:, 0], d[:, 1])
    k = np.diff(th); u = np.arange(len(k)) * STEP; w = np.clip(np.minimum(u, u[-1] - u) / 60.0, 0, 1); w = 0.5 - 0.5 * np.cos(np.pi * w)
    k2 = k + w * (ndimage.gaussian_filter1d(k, sig / STEP, mode='nearest') - k); k2 += w * (k.sum() - k2.sum()) / w.sum()
    th2 = np.r_[th[0], th[0] + np.cumsum(k2)]
    Q2 = np.vstack([Q[0], Q[0] + np.cumsum(np.stack([ln * np.cos(th2), ln * np.sin(th2)], 1), 0)])
    f = np.r_[0, np.cumsum(ln)] / ln.sum(); f = f * f * (3 - 2 * f); Q2 += np.outer(f, Q[-1] - Q2[-1])
    P = P.copy(); P[idx] = Q2; return P, float(np.hypot(*(Q2 - Q).T).max())

P, T10_SHIFT = smooth_bend(P, 2440, 2660, 12.0)
SEG = np.hypot(*(np.roll(P, -1, 0) - P).T); LEN = float(SEG.sum()); CUM = np.r_[0, np.cumsum(SEG)[:-1]]

# ---- the heights: the ground model across the road (Copernicus DEM less the canopy and the buildings), its bumps and dips narrower than
# ~150 m and ~100 m taken out (the model's humps of the walls, the stands and the banks by the road, not the road), smoothed (sigma 30 m):
# the main straight in the desert's basin (8 m above the sea), the climb from Turn 3 to the top of the lap at Turn 4 (24 m), down through the
# esses to the hairpin in the valley (8 m), the back straight level, the climb from Turn 11 to Turn 13 (23 m) and down the long straight to
# the last corners; the main straight level, grades at most 4.5 % ----
def heights():
    h = np.roll(np.array(J['hRaw'], float), -K0); cap = 0.045 * STEP
    h = ndimage.gaussian_filter1d(ndimage.grey_closing(ndimage.grey_opening(h, size=31, mode='wrap'), size=21, mode='wrap'), 6.0, mode='wrap')
    i0 = int(round(-400 / STEP)); i1 = int(round(350 / STEP)); a = h[i0]; b = h[i1]   # the main straight level from Turn 15's exit to Turn 1's brakes
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
# (CLAUDE.md, Pravna varnost); the turns by their numbers in the lines, as the circuit numbers them (15: 9 right, 6 left) ----
NAMES = [
    ('Desna lasnica', 540, ['Hard on the brakes for Turn 1!', 'The tight right hairpin at the end of the main straight!', 'Down the gears into the first hairpin!']),
    ('Levi za lasnico', 655, ['The left of Turn 2, out of the hairpin!', 'Left, and back on the throttle!', 'Through Turn 2!']),
    ('Hitri desni pregib', 750, ['Flat through the right kink of Turn 3!', 'The fast kink, foot down!', 'Turn 3, and the straight up the hill!']),
    ('Desni na vrhu', 1340, ['Hard on the brakes for Turn 4!', 'The right at the top of the hill!', 'Round Turn 4, the highest point of the lap!']),
    ('Hitri levi', 1615, ['The fast left of Turn 5!', 'Into the esses, left first!', 'Through Turn 5, flat out!']),
    ('Desni v esih', 1710, ['The right of Turn 6!', 'Right, through the middle of the esses!', 'Turn 6, change direction!']),
    ('Levi v dolino', 1830, ['The left of Turn 7, down into the valley!', 'Left, and the road falls away!', 'Through Turn 7, the hairpin ahead!']),
    ('Lasnica v dolini', 2085, ['Hard on the brakes for the hairpin of Turn 8!', 'The tight right at the bottom of the valley!', 'Round the hairpin!']),
    ('Dolgi levi', 2445, ['The long left of Turn 9!', 'Left, and the brakes for Turn 10 at the end of it!', 'Through the long left, downhill!']),
    ('Ostri levi', 2545, ['Hard on the brakes for the tight left of Turn 10!', 'The tight left, braking in the turn!', 'Round Turn 10, the back straight ahead!']),
    ('Dolgi levi pod klancem', 3275, ['The long left of Turn 11!', 'Left, and up the hill!', 'Round the long left, the load builds!']),
    ('Hitri desni', 3570, ['Flat through the fast right of Turn 12!', 'The fast sweep up the hill!', 'Turn 12, foot down!']),
    ('Desni na vrhu klanca', 3945, ['The right of Turn 13, onto the long straight!', 'Right at the top of the climb!', 'Through Turn 13!']),
    ('Desni na koncu ravnine', 4730, ['Hard on the brakes for Turn 14!', 'The right at the end of the long straight!', 'Down the gears for Turn 14!']),
    ('Zadnji desni', 4825, ['The last right, onto the main straight!', 'Turn 15, and the run to the line!', 'Through the final corner!']),
    ('Ciljna ravnina', 5150, ['Down the main straight past the big grandstand!', 'Flat out along the main straight, the pits on the right!', 'The main straight, the lap is nearly done!']),
]
# the apexes of the circuit's 15 turns (their number boards, TV towers, photographers, recovery: World.rbring): 1 the right hairpin at the
# end of the main straight, 2 the left out of it, 3 the right kink, 4 the right at the top of the hill, 5-7 the esses (left, right, left),
# 8 the hairpin in the valley, 9 the long left, 10 the tight left, 11 the long left, 12 the fast right, 13 the right at the top of the climb,
# 14 the right at the end of the long straight, 15 the last right
TURNS = [552, 660, 755, 1355, 1620, 1715, 1835, 2092, 2455, 2552, 3280, 3575, 3950, 4738, 4830]

DESC = ('Dirkališče v puščavi na jugu otoka Bahrajn pri Sakhirju: 5,4 km v smeri urinega kazalca, 15 zavojev (9 desnih in 6 levih). '
        'Ciljna ravnina mimo glavne tribune pod belimi šotorskimi strehami, boksi na desni, desna lasnica na koncu ravnine, vzpon do desnega '
        'na vrhu, hitri esi navzdol do lasnice v dolini, dolgi in ostri levi, ravnina ob stezi za pospeševanje, dolgi levi in hitri desni '
        'navkreber, desni na vrhu in dolga ravnina do zadnjih dveh desnih. Popoldansko sonce v suhi meglici, pesek in kamenje puščave, mlada '
        'drevesa in palme, visoki stebri reflektorjev ob progi, tribune in boksi (zapelji vanje in mehaniki ti popravijo avto).')
DESC_EN = ('A circuit in the desert of the south of the island of Bahrain by Sakhir: 5.4 km, clockwise, 15 turns (9 right, 6 left). The '
           'main straight past the main grandstand under its white tent roofs, the pits on the right, the right hairpin at the end of the '
           'straight, the climb to the right at the top, the fast esses down to the hairpin in the valley, the long and the tight left, the '
           'straight by the drag strip, the long left and the fast right uphill, the right at the top and the long straight to the last two '
           'rights. An afternoon sun in a dry haze, the desert\'s sand and stones, young trees and palms, the tall floodlight masts by the '
           'track, grandstands and the pits (drive in and the mechanics fix your car).')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight (OSM's pit lane: it leaves at the finish line's 385 m before
# and comes back 385 m after it, ~14.5 m from the centre line between them); the 13 crews' boxes in the middle of the pit building, the
# player's the 7th; the garages along the lane (OSM: the pit building ~400 m, its front ~25 m from the centre line); the pit wall 2.5 m past
# the road's edge ----
PIT = [14.5, -385, 385, 5]   # (the player's box: the 7th crew's, 0 .. 10 m: Core's crewBoxes, the box centres pitRow[0] + 5 + 10 k)
PIT_ROW = [-60, 60]
PIT_BOX = [-210, 180, 1]   # (the garages: World's RB_LOOK.sakhir.pitBox; the crews' 13 open; the rest of the pit building behind them: sk.pitb)
WALLS = [[-385, 385, 1, 2.5]]   # the pit wall along the lane
# the barrier moved out (def.wide) where the main grandstand stands back from the road (its front ~18 m from the centre line, a lawn
# before it)
WIDE = [[-160, 185, -1, 1.5]]
# the grandstands (OSM building=grandstand outlines, J['bld'] by index: World's skStands builds them as they stand, not along the barrier):
# [index, name (a place of Bahrain), rows (none: as deep as the outline holds), roof (the share of the depth under the white tent roofs)]:
# the main grandstand left of the main straight, the stand left of Turn 1, the three by Turns 2 and 3, the two by Turn 14, the stand
# beyond the drag strip right of the back straight
STANDS = [[2, 'SAKHIR', 0, 1.0], [6, 'AWALI', 0, 0.62], [8, 'ZALLAQ', 0, 0.62], [3, 'RIFFA', 0, 0.62], [4, 'MANAMA', 0, 0.62],
          [5, 'ISA TOWN', 0, 0.62], [7, 'HAMAD TOWN', 0, 0.62], [0, 'MUHARRAQ', 0, 0.62]]
PIT_BLD = 1   # (the pit building's outline: the builder's garages along its front, the rest of it a box of its own behind them)
TOWER = [123.0, -773.1, 19.0, 38.0]   # (OSM w187123438: the round tower in the paddock by the pit exit: its centre in the data's frame, radius, height)
SECTORS = [1500, 3300]
# the three DRS zones (Race._drs): [turn, detection, activation (metres before / after that turn), the next turn]: detection 200 m before
# Turn 15, open from 80 m after it along the main straight to Turn 1; detection 50 m before Turn 1, open from 60 m after Turn 3 up the hill
# to Turn 4; detection 60 m before Turn 10, open from 60 m after it along the back straight to Turn 11
DRS = [[15, -200, 80, 1], [3, -255, 60, 4], [10, -60, 60, 11]]
REAL_KM = 5.412

# ---- from OSM, not in the track data: the floodlight masts round the circuit (man_made=mast, tower:type=lighting, the 126 within 130 m of
# the road; [x, z, ...] in the data's frame, 0.5 m) and the asphalt of the circuit's other layouts by the road (highway=raceway: the inner,
# the outer and the endurance circuits' links, the paddock and the oval layouts, the drag strip; [x, z, ...] per way, its nodes within 110 m
# of the road) ----
MASTS = [-10.5, -594, 56.5, -610, -2, -670, 59.5, -708, 7.5, -730.5, 60, -752, 5, -774, 63, -793, 4.5, -821, 7, -867, 9, -912.5, 22.5, -992, 100, -975.5,
         131.5, -932, 91, -826.5, 153, -828.5, 199.5, -850, 183.5, -926, 234, -867, 247, -930, 261.5, -853, 301, -927.5, 312, -822.5, 346, -924.5, 389.5,
         -907.5, 436, -893.5, 481, -884, 527, -873.5, 573, -863.5, 619.5, -853, 667.5, -847.5, 711.5, -838, 757.5, -827.5, 801, -820.5, 876.5, -808.5, 870.5,
         -740, 819.5, -697.5, 778.5, -664.5, 719, -608.5, 743, -548.5, 652.5, -547.5, 545.5, -572, 626, -495.5, 537, -419, 497, -404.5, 446, -369.5, 395, -354,
         355.5, -325.5, 291.5, -277.5, 291, -371.5, 296, -405, 310.5, -446, 255.5, -501, 322, -495, 260.5, -547.5, 331, -541.5, 265, -593, 338, -588.5, 270.5,
         -633.5, 342.5, -625, 353, -692.5, 270.5, -706.5, 334.5, -773.5, 210.5, -804.5, 274.5, -668, 174.5, -661, 173.5, -607.5, 247.5, -455, 246, -409, 237,
         -362, 231.5, -314.5, 162, -295.5, 233, -267.5, 160, -245, 236.5, -220.5, 158.5, -206, 235, -173.5, 156.5, -160, 233, -126.5, 154, -102, 236.5, -67,
         150.5, -10, 183, 41, 284.5, -61.5, 399.5, -43, 341.5, -100, 359.5, -131.5, 381.5, -172.5, 401, -228.5, 439, -279.5, 511, -339, 601, -308.5, 654.5,
         -275, 701, -240.5, 810.5, -174.5, 776, -109, 730.5, -53.5, 683, -21, 639.5, -3.5, 591.5, 8.5, 550, 28, 510, 57, 466, 76, 424, 97, 352, 17.5, 383,
         120.5, 341.5, 143, 279.5, 56, 301, 166, 254, 178, 212.5, 200.5, 175, 221.5, 129, 247, 49, 297, -9.5, 326, -74.5, 267.5, -64, 175, -49.5, 133.5, -38,
         85, 35.5, 43, 27.5, -2, -34.5, -57, -31.5, -103.5, -30, -146.5, 32.5, -143.5, -28, -199]
ALT = [
    [469.5, -243, 474.5, -250.5, 479.5, -257.5, 486.5, -265, 494, -272, 567.5, -336.5, 577.5, -345.5, 588.5, -354],   # w4818386 inner circuit
    [773.5, -217.5, 771, -215, 768, -213, 764.5, -211.5, 761, -211, 757.5, -211, 754, -212, 750.5, -214, 748, -216, 741, -225, 733, -237.5,
     726.5, -246.5, 719.5, -255, 712, -263, 704.5, -270, 697, -277, 687.5, -284.5, 677.5, -291, 671, -294.5, 664, -298, 659.5, -300, 655, -302.5,
     652, -304.5, 648.5, -307, 645.5, -311, 643, -315, 641, -319.5, 639.5, -324.5, 639, -329.5],   # w4818387 endurance circuit
    [689.5, -473, 687.5, -489, 687, -500, 687, -503.5, 686.5, -518.5, 687, -530, 687.5, -553.5, 687, -560, 686.5, -567.5, 685.5, -572.5, 683.5,
     -577.5, 681, -582.5, 677.5, -586.5, 674, -590, 670, -593, 665, -595, 660.5, -596.5, 655.5, -597.5, 632.5, -599.5],   # w4818389 inner circuit
    [205, -734, 199, -582.5, 177, -41.5, 168, 181, 167.5, 186],   # w271528378 drag strip
    [167.5, -3, 169.5, -58.5, 196, -735],   # w271528411 drag strip
    [297, -891.5, 297.5, -887, 298, -882.5, 297.5, -878, 296.5, -873.5, 295.5, -869.5, 282, -839, 267, -806.5, 248.5, -766, 244.5, -757.5],   # w562936453 paddock layout
    [34, -725, 68, -786.5, 72, -792.5, 76.5, -798, 81.5, -803, 87.5, -807, 94, -810.5, 100, -812.5, 106.5, -814, 113.5, -815, 120, -814.5, 126.5,
     -813.5, 131.5, -812, 136.5, -809.5, 141.5, -806.5, 145.5, -803, 172, -775, 182.5, -764, 188.5, -753.5, 192, -749, 194, -744.5, 195.5,
     -739.5, 196, -735],   # w562936458 flat oval layout
    [781.5, -730, 759, -688.5, 756, -682, 754, -675.5, 752.5, -668, 752.5, -661, 753, -653.5, 754.5, -646, 757.5, -638.5, 761, -632],   # w881756725 outer circuit
    [773.5, -217.5, 714, -119.5],   # w881756731 outer circuit
    [160, 192, 160, 185.5, 167.5, -3],   # w1251965000 drag strip
    [158.5, 224.5, 158.5, 220.5],   # w1251965004 drag strip
    [158.5, 220.5, 160, 192],   # w1251965005 drag strip
    [166.5, 216.5, 166.5, 220],   # w1251965006 drag strip
    [167.5, 186, 166.5, 216.5],   # w1251965007 drag strip
    [33.5, -840, 123, -872],   # w1359183362 the paddock layout's link
    [167.5, -3, 156.5, 26.5, 150, 43],   # w1487133866 flat oval layout
    [103, 110, 96, 113.5, 89, 115, 82.5, 115.5, 75.5, 115, 69, 113.5, 62.5, 111.5, 56, 108.5, 50, 104.5, 45, 100, 40, 94.5, 36.5, 89, 32, 82,
     28.5, 75, 25.5, 67.5, 22.5, 60.5, 18.5, 48, 12.5, 31, 10, 24.5, 7, 18, 0, 3.5],   # w1487133866 flat oval layout
]
DRAG = (3, 4, 9, 10, 11, 12, 13)   # (ALT's drag strip: wider)

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

# ---- the scenery: terrain (dem), land cover (lc), the ponds, the buildings, the grandstands, the roads and the masts (sk), the horizon (far) ----
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

def lakes():   # the ponds in the infield (OSM natural=water: inside Turns 9-11, by Turn 12 and inside Turns 2-4): ['', x, z, ...] in our frame, 0.5 m
    out = []
    for kind, name, closed, pts in J['lakes']:
        q = np.array(mv(pts)).reshape(-1, 2)
        if not closed or len(q) < 4: continue
        if np.hypot(*(q[0] - q[-1])) < 0.5: q = q[:-1]
        out.append([''] + [round(v * 2) / 2 for v in q.ravel()])
    return out

def dem_fixed():   # the ground model with the big buildings' pits filled: the buildings taken off the surface model (the stands' and the pit
    # building's heights guessed, OSM has none) dug hollows of 2-6 m where the ground was level; their footprints (and 20 m round) and the
    # tower's filled from the ground round them (a Laplace fill)
    g, a = grid('dem'); A = a.astype(np.float64) / 10 - 100
    X, Z = np.meshgrid(g['x0'] + (np.arange(g['nx']) + 0.5) * g['cell'], g['z0'] + (np.arange(g['nz']) + 0.5) * g['cell'])
    M = np.zeros(A.shape, bool)
    for b in J['bld']:
        x, z, l, w, ang = b[:5]
        if l * w < 1500: continue
        x -= OX; z -= OZ; ca, sa = math.cos(ang), math.sin(ang)
        u = (X - x) * ca + (Z - z) * sa; v = -(X - x) * sa + (Z - z) * ca
        M |= (np.abs(u) < l / 2 + 20) & (np.abs(v) < w / 2 + 20)
    M |= np.hypot(X - (TOWER[0] - OX), Z - (TOWER[1] - OZ)) < TOWER[2] + 20
    F = A.copy(); F[M] = A[~M].mean() if M.any() else 0
    for _ in range(500):
        F[M] = ((np.roll(F, 1, 0) + np.roll(F, -1, 0) + np.roll(F, 1, 1) + np.roll(F, -1, 1)) / 4)[M]
    return g, np.round((F + 100) * 10)

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings (20 m, the big buildings' pits filled) on 16 m cells, above the finish line in
    # steps of 0.05 m multiples from its lowest point
    gd, ad2 = dem_fixed()
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad2, X, Z, True) - H0
    lo = math.floor(hv.min() - 2); step = max(0.25, math.ceil((hv.max() + 2 - lo) / 254 * 20) / 20)
    dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.1, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 the circuit's own desert (OSM natural=sand: the infield and the ground round the circuit, sand and grit with
    # the young trees planted on it), 1 the lawns and the gardens (OSM landuse=grass, leisure=garden: watered, green, with palms; the trees
    # over 4 m), 2 the open desert (bare ground: ESA WorldCover's bare and sparse, OSM's shingle, and out past the data's 150 m: grit, stones
    # and a few shrubs), 3 paved (the car parks, the paddock and the buildings: OSM, and WorldCover's built-up off the circuit's sand: the
    # builder draws the road and its run-offs over it)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.full(wc.shape, 2, np.int8)
            cls[lu == 12] = 0
            cls[(wc == 50) & (lu == 0)] = 3
            cls[(lu == 14) | (lu == 1) | (lu == 2)] = 3
            cls[(lu == 4) | (lu == 10) | (lu == 13) | (ch >= 4) | (wc == 10) | (wc == 30)] = 1
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the buildings by the circuit (OSM, within 60 m): [x, z, length, width, angle (deg), height]: not the grandstands (stands) nor the pit
    # building (the builder's garages and pitb)
    SB = {k for k, *_ in STANDS} | {PIT_BLD}; bld = []
    for k, b in enumerate(J['bld']):
        if k in SB: continue
        x, z, l, w, ang, hgt, kind, s, d = b; x -= OX; z -= OZ
        hh = hgt if hgt > 0 else 12.0 if l * w > 4000 else 7.5 if l * w > 500 else 5.0 if l * w > 100 else 3.0
        bld += [round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang)), hh]
    # the grandstands: [x, z, length, width, angle (deg), rows, front (+1: the side of +the angle's normal faces the road, -1 the other),
    # roof (per cent of the depth)]
    stands = []
    for k, name, rows, roof in STANDS:
        x, z, l, w, ang = J['bld'][k][:5]; x -= OX; z -= OZ
        q = at(sd(x, z)[0]); nxv, nzv = -math.sin(ang), math.cos(ang); fr = 1 if (q[0] - x) * nxv + (q[1] - z) * nzv > 0 else -1
        stands.append([round(x, 1), round(z, 1), round(l, 1), round(w, 1), round(math.degrees(ang), 1), rows or int((w - 2.5) / 0.95), fr, int(round(roof * 100)), name])
    # the pit building behind the garages: a box from 9.3 m behind the garages' front (the builder's: 18 m past the pit wall) to the outline's
    # back, along the garages
    x, z, l, w, ang = J['bld'][PIT_BLD][:5]; x -= OX; z -= OZ; s0, d0 = sd(x, z); back = d0 + w / 2; f0 = 7 + 2.5 + 18 + 9.3
    a = at(PIT_BOX[0]); b = at(PIT_BOX[1]); hd = math.atan2(b[1] - a[1], b[0] - a[0]); mx = (a[0] + b[0]) / 2; mz = (a[1] + b[1]) / 2; dm = (f0 + back) / 2
    pitb = [round(mx - math.sin(hd) * dm, 1), round(mz + math.cos(hd) * dm, 1), round(math.hypot(b[0] - a[0], b[1] - a[1]), 1), round(back - f0, 1), round(math.degrees(hd), 1), 13]
    # the service roads round the circuit (OSM highway=service within 60 m, not in a tunnel): [n, x0, z0, x1, z1, ...]
    svc = []
    for r in J['roads']:
        if r[3] == 2 or r[0] != 'service': continue
        q = mv(r[-1]); svc += [len(q) // 2] + q
    alt = []
    for k, r in enumerate(ALT): q = mv(r); alt += [len(q) // 2 * (-1 if k in DRAG else 1)] + q   # (negative: the drag strip, wider)
    mast = [round(v * 2) / 2 for v in mv(MASTS)]
    tower = [round(TOWER[0] - OX, 1), round(TOWER[1] - OZ, 1), TOWER[2], TOWER[3]]
    # the trees by the circuit (OSM natural=tree, all within 80 m of the road, and the rows of natural=tree_row every 8 m): the date palms
    # along the roads, the car parks and the buildings, [x, z, ...] in our frame, 0.5 m
    tr = [v for t in J['trees'] for v in t[:2]]
    for _, q in J['treeRows']:
        for k in range(0, len(q) - 2, 2):
            ax, az, bx, bz = q[k:k + 4]; n = max(1, round(math.hypot(bx - ax, bz - az) / 8))
            for i in range(n + (1 if k + 4 >= len(q) else 0)): tr += [ax + (bx - ax) * i / n, az + (bz - az) * i / n]
    trees = [round(v * 2) / 2 for v in mv(tr)]
    return D, LC, dict(bld=bld, stands=stands, pitb=pitb, tower=tower, svc=svc, alt=alt, mast=mast, lakes=lakes(), trees=trees)

# ---- the horizon (def.far for Riverside's rsFar): the highest ground in rings round the circuit (the desert's low ridges and the hill
# in the south, the towns to the north) ----
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
    while k < len(a): n = abs(a[k]); yield a[k + 1:k + 1 + 2 * n]; k += 1 + 2 * n

def info():
    d1 = (np.roll(P, -1, 0) - np.roll(P, 1, 0)) / 2; d2 = np.roll(P, -1, 0) - 2 * P + np.roll(P, 1, 0)
    k = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.hypot(*d1.T) ** 3; ks = ndimage.uniform_filter1d(k, 3, mode='wrap')
    print('  tightest: R %.1f m at %.0f m; Turn 10 smoothed, the line moved at most %.1f m' % (1 / np.abs(ks).max(), CUM[np.abs(ks).argmax()], T10_SHIFT))
    hd = lambda s: (math.degrees(math.atan2(at(s + 3)[0] - at(s - 3)[0], -(at(s + 3)[1] - at(s - 3)[1]))) + 360) % 360   # (compass: 0 north, 90 east)
    print('  turns (heading in -> out):', ' '.join('%d:%.0f>%.0f' % (n + 1, hd(s - 80), hd(s + 80)) for n, s in enumerate(TURNS)))

def build_track():
    hk = H[::2]; skh = ','.join(str(int(round((v - H0) * 10))) for v in hk)   # every 10 m from the finish line, decimetres above it
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    names = []
    for lab, s, lines in NAMES:
        x, z = at(s); names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(x), f1(z), json.dumps(lines)))
    turns = '[' + ','.join('[%s,%s]' % tuple(f1(v) for v in at(s)) for s in TURNS) + ']'
    D, LC, SK = scenery(); FAR = far_rings()
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    src = '''/* Track definition 'sakhir'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Sakhir, Bahrain: the circuit in the desert of the south of the island of Bahrain by Sakhir, clockwise, in its real layout and scale:
  // the finish line on the main straight (no finish line in OSM: level with the middle of the pit lane; the pits on the right, the main
  // grandstand on the left), the right hairpin of Turn 1 at the end of the straight, the left of Turn 2, the right kink of Turn 3, the
  // climb to the right of Turn 4 at the top of the lap, the esses of Turns 5, 6 and 7 down to the hairpin of Turn 8 in the valley, the long
  // left of Turn 9 and the tight left of Turn 10, the back straight by the drag strip, the long left of Turn 11, the fast right of Turn 12
  // up the hill, the right of Turn 13 at the top, the long straight down to the rights of Turns 14 and 15 onto the main straight:
  // %(km)s km on our line (5.41 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/sakhir/config.json: the raceway ways
  // of the Grand Prix layout, oneway=yes in the race direction), the corners at its nodes rounded (sigma 5 m), the tight left of Turn 10
  // evened out (its few nodes made it tighter than the hairpin of Turn 1: smooth_bend, the line moved at most 4 m); metres, origin = the
  // finish line, x east, z south. GENERATED by tools/sakhir/build.py (edit the names, the pits, the stands and the text there).
  // Heights (SK_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), its bumps taken out,
  // smoothed, grades at most 4.5 %%, the main straight level; every 10 m from the finish line, decimetres above it (%(h0)s m a.s.l.):
  // the desert's basin and its low rises, %(hmin)s .. %(hmax)s m round the lap.
  // Scenery data for the world builder (js/world-sakhir.js on js/world-rbring.js): terrain (dem: the same model, the big buildings' pits in
  // it filled, 16 m cells, heights above the finish line), land cover (lc, 16 m cells: 0 the circuit's sand, 1 the lawns and the gardens,
  // 2 the open desert, 3 the car parks, the paddock and the buildings: ESA WorldCover, the canopy height and OSM), and sk: the buildings by
  // the circuit (bld: [x, z, length, width, angle (deg), height]: OSM), the grandstands (stands: [x, z, length, width, angle (deg), rows,
  // front, roof (%%), name]: OSM outlines), the pit building behind the garages (pitb: a box) and the round tower in the paddock (tower:
  // [x, z, radius, height]: OSM), the service roads round the circuit (svc: [points, x, z, ...]: OSM), the circuit's other layouts by the
  // road (alt: [points (negative: the drag strip), x, z, ...]: OSM raceways), the floodlight masts (mast: [x, z, ...]: OSM), the ponds in
  // the infield (lakes: [name, x, z, ...]: OSM); the horizon (far: the highest ground in rings round the circuit, Copernicus DEM, for
  // Riverside's rsFar).
  // The names: plain descriptions only (no names of people, firms, races or the circuit).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const SK_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xe2d9c8, sun: 0xffedd0, sunI: 1.2, sky: 0x9fc2e2, gnd: 0xb59c74, hemiI: 0.7, tint: [1.03, 1.0, 0.95], sat: 1.0, sunOff: [-74, 70, 38], split: [[0.97, 1.0, 1.04], [1.05, 1.0, 0.93]] },   // the desert of Bahrain in the afternoon: a low sun from the west, a dry pale haze, the sand's warm light from below
    say: 'Sakhir', rainP: 0.05,
    grassNat: 0.55, lawn: [0.96, 1.05, 0.84],
    zivali: { a: ['camel'], t: [], open: true },
    id: 'sakhir', name: 'Sakhir, Bahrajn', theme: 'sakhir', laps: 2, halfWidth: 7,
    desc: %(desc)s,
    en: { name: 'Sakhir, Bahrain', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.2, inner: 4.6, side: 6.5, gradeForce: true, elevSmooth: 10, realKm: %(real)s, runoffTarmac: true, offSurface: 'gravel',
    elev: SK_H.map((h, i) => [i / SK_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the apexes of Turns 1-15 (their number boards): the right hairpin, the left out of it, the right kink, the right at the top, the esses (left, right, left), the hairpin in the valley, the long left, the tight left, the long left, the fast right, the right at the top of the climb, the right at the end of the long straight, the last right
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right (negative: the left), from, to, the player's box] (metres from the finish line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the garages: RB_LOOK.sakhir.pitBox)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    wide: %(wide)s,   // the barrier back behind the lawn before the main grandstand
    drs: %(drs)s,   // the DRS zones: [turn, detection, activation (metres from that turn), the next turn]: the main straight from Turn 15 to Turn 1, the climb from Turn 3 to Turn 4, the back straight from Turn 10 to Turn 11
    sectors: %(sectors)s,   // the three sectors of the timing screens: up to the top and through the esses, the valley and the back straight, the climb, the long straight and the main straight
    dem: %(dem)s,
    lc: %(lc)s,
    sk: %(sk)s,
    far: %(far)s,
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (LEN / 1000), skh=skh, h0='%.1f' % H0, hmin='%.0f' % H.min(), hmax='%.0f' % H.max(), desc=json.dumps(DESC, ensure_ascii=False),
           desc_en=json.dumps(DESC_EN, ensure_ascii=False), real=REAL_KM, names='\n'.join(names), turns=turns,
           pit=json.dumps(PIT), row=json.dumps(PIT_ROW), walls=json.dumps(WALLS), wide=json.dumps(WIDE), drs=json.dumps(DRS),
           sectors=json.dumps(SECTORS), dem=js(D), lc=js(LC), sk=js(SK), far=js(FAR), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'sakhir.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (%.1f .. %.1f m above the finish line, %.1f m a.s.l.);' % (hk.min() - H0, hk.max() - H0, H0),
          'dem', D['nx'], 'x', D['nz'], 'lo %.1f step %.2f' % (D['lo'], D['step']), '; lc', LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars; buildings', len(SK['bld']) // 6,
          '; stands', len(SK['stands']), '; service roads', sum(1 for _ in svc_iter(SK['svc'])), '; other layouts', sum(1 for _ in svc_iter(SK['alt'])), '; masts', len(SK['mast']) // 2,
          '; lakes', len(SK['lakes']), '; trees', len(SK['trees']) // 2)
    g = np.abs(np.roll(H, -2) - np.roll(H, 2)) / (4 * STEP); print('  steepest grade %.1f %% at s %.0f' % (g.max() * 100, CUM[int(g.argmax())]))
    for k, v in (('dem', D), ('lc', LC), ('sk', SK), ('far', FAR)): print('  %-4s %5d KB' % (k, len(js(v).encode()) // 1024))
    print('  stands:', [(s[-1], s[5], s[6]) for s in SK['stands']], 'pitb', SK['pitb'])
    info()

if __name__ == '__main__':
    build_track()
