# Houli, Tajvan: the game's track file from the track data (tools/houli/houli.json and its PNG grids, made by tools/proga-podatki.py; the
# landmarks farther out in tools/houli/okolica.json, made by tools/houli/okolica.py).
#   python3 -I tools/houli/build.py   -> js/tracks/houli.js (centre line, heights, names, pits, the grandstand, terrain, land cover, the
#   buildings, the roads and the karting tracks, the houses of the villages, the landmarks farther out, the horizon)
# Edit the names, the pits, the stands and the text here, not in the generated file. Plan: docs/dirkalisca-celine.md, the track: docs/proge/houli.md.
import base64, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage, spatial

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'houli.json'))); OK = json.load(open(os.path.join(HERE, 'okolica.json')))
STEP = J['step']; RAW0 = np.array(J['line']).reshape(-1, 2); NP = len(RAW0)
# the start line: OSM has no raceway=start-finish here; the line is put by the middle of the race building (OSM w1137180474, 320 m long, its
# middle 159 m after the route's first point: tools/houli/config.json), the line and its heights rolled to start there, the origin moved onto it
S0 = 160.0; K0 = int(round(S0 / STEP)); O = RAW0[K0].copy()
RAW = np.roll(RAW0, -K0, 0) - O

# ---- the heights: the ground model is older than the circuit (opened 2018: the terraces were levelled and banked for it), its steepest
# stretches (12 % into the east hairpin) are the old slopes; smoothed again (sigma 10 m) and the grades held to 8.5 % where steeper ----
GMAX = 0.085
def heights():
    h = ndimage.gaussian_filter1d(np.roll(np.array(J['h'], float), -K0), 2.0, mode='wrap')
    for _ in range(400):
        g = (np.roll(h, -1) - h) / STEP; bad = np.abs(g) > GMAX
        if not bad.any(): break
        m = ndimage.maximum_filter1d((bad | np.roll(bad, 1)).astype(np.uint8), size=9, mode='wrap') > 0
        h = np.where(m, ndimage.gaussian_filter1d(h, 1.5, mode='wrap'), h)
    return h
H = heights()
H0 = float(H[0])   # the start line's height above the sea (236.5 m): the game's zero

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
    ('Prvi desni', 415, ['Hard on the brakes for the first right!', 'Into the first corner, right!', 'The tight right at the end of the straight!']),
    ('Zahodna ravnina', 600, ['Foot down along the west straight!', 'Flat out on the short west straight!', 'Down the west straight!']),
    ('Levi pred lasnico', 770, ['The left before the hairpin!', 'Quick left, the hairpin is coming!', 'Through the left before the hairpin!']),
    ('Jugozahodna lasnica', 935, ['Hard on the brakes, the south-west hairpin!', 'All the way round the hairpin, right!', 'Round the south-west hairpin!']),
    ('Hitri desni', 1190, ['The fast right!', 'Keep it flat through the fast right!', 'Through the quick right-hander!']),
    ('Levi ob kartingu', 1270, ['The tight left by the karting track!', 'Hard left by the karting!', 'Round the left by the karting track!']),
    ('Severni esi', 1540, ['Left and right through the north esses!', 'Quick through the north esses!', 'Into the north esses!']),
    ('Severna ravnina', 1700, ['Flat out down the north straight!', 'The long north straight, foot down!', 'Along the north straight!']),
    ('Šikana pri hotelih', 2025, ['Right, left, right through the chicane by the hotels!', 'Hard on the brakes for the chicane by the hotels!', 'Over the kerbs in the chicane!']),
    ('Vzhodni levi', 2365, ['The left on the east side!', 'Turn in left, the east hairpin is next!', 'Through the east left!']),
    ('Vzhodna lasnica', 2450, ['The east hairpin, all the way round to the right!', 'Hard on the brakes for the east hairpin!', 'Round the east hairpin!']),
    ('Južna ravnina', 2600, ['Flat out along the south straight!', 'Foot down on the south straight!', 'Down the south straight!']),
    ('Dvojni desni', 2830, ['Right, and right again!', 'Through the double right!', 'Two rights in a row!']),
    ('Levi v notranjosti', 3110, ['The left in the infield!', 'Hard left in the infield!', 'Round the infield left!']),
    ('Notranji esi', 3215, ['Left and right through the infield esses!', 'Quick hands through the esses!', 'Into the infield esses!']),
    ('Zadnji ovinek', 3345, ['The last corner, left onto the straight!', 'Round the last corner!', 'Through the last corner, the line is near!']),
    ('Ciljna ravnina', 3430, ['Down the main straight past the race building!', 'Flat out down the main straight!', 'The main straight, the lap is nearly done!']),
]
# the 20 corners' apexes: the first right and the kink after it, the left before the hairpin, the south-west hairpin, the kink and the fast
# right, the left by the karting, the north esses (2), the chicane by the hotels (3), the east left, the east hairpin, the double right (2),
# the infield left, the infield esses (2), the last corner ([its estimate, the side it turns to])
TURNS = [apex(s, d) for s, d in [(415, 1), (480, -1), (770, -1), (935, 1), (1055, 1), (1190, 1), (1270, -1), (1535, -1), (1605, 1), (2020, 1), (2070, -1),
                                 (2130, 1), (2365, -1), (2450, 1), (2830, 1), (2895, 1), (3110, -1), (3215, -1), (3285, 1), (3345, -1)]]

DESC = ('Dirkališče na planoti Houli severno od Taichunga: 3,5 km, 20 ovinkov, v smeri urinega kazalca. S ciljne ravnine v prvi desni, po zahodni '
        'ravnini v jugozahodno lasnico, mimo kartinga v severne ese, po severni ravnini v šikano pri hotelih, skozi vzhodno lasnico na južno '
        'ravnino, dvojni desni, notranje ese in zadnji ovinek. Desno ob ciljni ravnini dolga dirkalna stavba s petimi etažami in garažami '
        '(zapelji vanje in mehaniki ti popravijo avto), nasproti velika tribuna; hoteli, zabaviščni park z velikima kolesoma, viadukt hitre '
        'železnice, kafrovci, bambus in betelove palme, polja in vasi na planoti.')
DESC_EN = ('A circuit on the Houli terrace north of Taichung: 3.5 km, 20 corners, clockwise. From the main straight into the first right, down '
           'the west straight to the south-west hairpin, past the karting track into the north esses, along the north straight to the chicane '
           'by the hotels, round the east hairpin onto the south straight, the double right, the infield esses and the last corner. The long '
           'five-storey race building with its garages on the right of the main straight (drive in and the mechanics fix your car), the big '
           'grandstand across it; hotels, an amusement park with two big wheels, the high-speed railway on its viaduct, camphor trees, bamboo '
           'and betel palms, fields and villages on the terrace.')

# ---- the pits (Core.Track.pitAt): the lane on the right of the main straight, 13 m from the centre line, from the exit of the last corner to
# 155 m before the first; the 13 crews' boxes in the middle of the race building's garages (js/world-houli.js), the player's in the middle
# at the start line; the pit wall 2.5 m past the road's edge ----
PIT = [13, -150, 260, 0]
PIT_ROW = [-65, 55]
WALLS = [[-150, 260, 1, 2.5]]
# the grandstand [from, to, side, rows, roof, sections, orange, name]: OSM's big stand across the straight from the race building (w1137180475:
# its outline in sk.gs, the builder's own), named after the district
STANDS = [[82, 364, -1, 20, 1, 6, 0, 'HOULI']]
SECTORS = [1140, 2290]
REAL_KM = 3.5

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

def scenery():
    M = 560; c = 16
    x0 = math.floor((P[:, 0].min() - M) / c) * c; z0 = math.floor((P[:, 1].min() - M) / c) * c
    nx = int(math.ceil((P[:, 0].max() + M - x0) / c)) + 1; nz = int(math.ceil((P[:, 1].max() + M - z0) / c)) + 1
    # terrain: Copernicus DEM less the canopy and the buildings on 16 m cells, above the start line in 0.3 m steps from -60 m (the terrace
    # falls away north and west of the circuit to the valleys, the ground in the grid from 50 m below the start line to 30 m above it)
    gd, ad = grid('dem'); X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True) - H0
    lo, step = -60.0, 0.36; dem = np.clip(np.round((hv - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.1, b64=b64bytes(dem))
    # land cover, 16 m cells: 0 open (the circuit's lawns, grass, bare ground), 1 woods (camphor and other broadleaves, bamboo, betel palms),
    # 2 fields and orchards, 3 built-up (the villages, the factories, the car parks); ESA WorldCover and the canopy height, OSM's land use (the
    # circuit's grounds, OSM leisure, are WorldCover's built-up: its lawns here)
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm')
    lnx = nx - 1; lnz = nz - 1; votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.zeros(wc.shape, np.int8)
            cls[(wc == 10) | (wc == 20) | (ch > 5)] = 1
            cls[(wc == 40) & (ch <= 5)] = 2
            cls[((wc == 50) | (lu == 1) | (lu == 2) | (lu == 14)) & (ch <= 5)] = 3
            cls[(lu == 10) & (ch <= 5)] = 0
            cls[(lu == 9) | (lu == 7)] = 1
            cls[(lu == 3) & (ch <= 5)] = 2
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    # the houses of the villages: WorldCover's built-up outside the circuit's grounds and the resort (OSM land use none or residential), no
    # canopy over it, more than 40 m from the centre line, every 16 m cell's middle a house (the builder picks its kind): [x, z, ...]
    X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5) * c, z0 + (np.arange(lnz) + 0.5) * c)
    wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False); dl = dline(X, Z)
    hs_m = (wc == 50) & ((lu == 0) | (lu == 1)) & (ch <= 6) & (dl > 40) & (dl < 520)
    rr = np.random.default_rng(7301); hs_m &= rr.random(hs_m.shape) < 0.62
    hs = []
    for zz, xx in zip(*np.nonzero(hs_m)): hs += [round(float(X[zz, xx] + (rr.random() - 0.5) * 6)), round(float(Z[zz, xx] + (rr.random() - 0.5) * 6))]
    # the buildings (OSM, within 900 m): [x, z, length, width, angle (deg), height, kind (tools/proga-podatki.py's kinds)]; not the race
    # building nor the grandstand (the builder's own: their outlines measured out from the centre line, sk.rb and sk.gs)
    bld = []; rb = gs = None
    for k, b in enumerate(J['bld']):
        x, z, l, w, ang, hgt, kind, s, d = b
        sn = (s - S0) % LEN; xx, zz = mv([x, z])
        if l > 300 and abs(d) < 60 and (sn < 60 or sn > LEN - 60): rb = k; continue
        if l > 250 and d < 0 and 150 < sn < 300: gs = k; continue
        hh = hgt or (7.5 if kind == 6 else 9.0 if kind == 5 else 4.0 if kind == 4 else 6.5 if l * w > 200 else 5.5)
        bld += [xx, zz, round(l, 1), round(w, 1), round(math.degrees(ang)), round(hh, 1), int(kind)]
    rbP = profile(outline_of(rb), -175, 175, 7, 1) if rb is not None else None
    gsP = profile(outline_of(gs), 70, 380, 7, -1) if gs is not None else None
    # the roads (OSM highway=..., within 150 m): [width, x, z, ...]; the karting tracks in the infield (OSM highway=raceway: the long one a
    # closed loop, its link): [closed, x, z, ...]
    wid = {'secondary': 9, 'tertiary': 7.5, 'tertiary_link': 5.5, 'unclassified': 5.5, 'residential': 5, 'service': 4.5, 'track': 3, 'footway': 2}
    road = [[wid.get(r[0], 4)] + mv(r[8]) for r in J['roads'] if r[0] in wid]
    kart = []
    for r in J['roads']:
        if r[0] != 'raceway': continue
        fl = mv(r[8]); closed = int(abs(fl[0] - fl[-2]) < 1 and abs(fl[1] - fl[-1]) < 1)
        if r[5] == 'asphalt': kart.append([closed] + fl)
        else: road.append([6] + fl)   # (the raceway by the infield without a surface in OSM: the paddock's road round it)
    return D, LC, dict(bld=bld, rb=rbP, gs=gsP, hs=hs, road=road, kart=kart, lm=landmarks()), lc, hv

def landmarks():
    # farther out (tools/houli/okolica.json, the tool's frame): the big wheels [x, z, y, height], the rides' outlines [x, z, ...], the high-speed
    # railway [viaduct, x, z, y, ...] and the power lines [cables, x, z, y, ...] (y: the ground under each point, m above the start line, from
    # the 20 m ground model; beyond it its edge)
    gd, ad = grid('dem')
    def gy(x, z): return round(float(sample(gd, ad, np.array([x]), np.array([z]), True)[0] - H0), 1)
    def xyz(fl):
        g = mv(fl); out = []
        for k in range(0, len(g), 2): out += [g[k], g[k + 1], gy(g[k], g[k + 1])]
        return out
    wh = [[*mv(w[:2]), gy(*mv(w[:2])), w[2]] for w in OK['wheels']]
    ride = [mv(r[1]) for r in OK['ride']]
    rail = [[r[0]] + xyz(r[1]) for r in OK['rail']]
    pw = [[p[0]] + xyz(p[1]) for p in OK['power']]
    return dict(wh=wh, ride=ride, rail=rail, pw=pw)

# ---- the horizon (def.far for Riverside's rsFar, as Yahuarcocha): the highest ground in rings round the circuit, out to 11.8 km (the far
# grid: Copernicus DEM, 100 m) for the hills of the foothills east and north-east (500-600 m) and the valleys falling away west ----
FAR_R = [1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10600, 11800]
def far_rings(na=180, step=4):
    g = J['grids']['far']; A = np.array(Image.open(os.path.join(HERE, g['file'])), dtype=np.float64) / 10 - 100   # (m above the sea)
    cx, cz = float(P[:, 0].mean()), float(P[:, 1].mean()); out = bytearray(); lo = 0
    for k, r1 in enumerate(FAR_R):
        r0 = FAR_R[k - 1] if k else 1200
        for a in range(na):
            m = lo
            for da in (-0.33, 0, 0.33):   # (a third of a direction's width either side: no peak missed between two)
                az = (a + da) / na * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 50):
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
    src = '''/* Track definition 'houli'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Houli, Taiwan: the circuit at Yuemei on the Houli terrace north of Taichung (opened 2018), clockwise, in its real layout and scale: the
  // start line by the middle of the race building, the pits beside it on the right, the first right, the west straight, the south-west
  // hairpin, the fast right and the left by the karting, the north esses, the north straight, the chicane by the hotels, the east hairpin, the
  // south straight, the double right, the infield esses and the last corner: %(km)s km on our line (3.5 km).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/houli/config.json: the raceway's way
  // 779852386), the corners at its nodes rounded (sigma 5 m); metres, origin = the start line, x east, z south. GENERATED by
  // tools/houli/build.py (edit the names, the pits, the stands and the text there).
  // Heights (HL_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the grades held
  // to 8.5 %% (the model is older than the circuit); every 10 m from the start line, decimetres above it (%(h0)s m a.s.l.).
  // Scenery data for the world builder (js/world-houli.js): terrain (dem: the same model, 16 m cells, heights above the start line in 0.36 m
  // steps), land cover (lc, 16 m cells: 0 the circuit's lawns and grass, 1 woods, 2 fields and orchards, 3 built-up: OSM, ESA WorldCover,
  // the canopy), and sk: the buildings ([x, z, length, width, angle (deg), height, kind]: OSM outlines as boxes within 900 m, not the race
  // building and the grandstand, which the builder makes from their outlines measured out from the centre line: rb, gs [[d, near, far]]),
  // the houses of the villages (hs: WorldCover's built-up beyond the circuit's grounds), the roads ([width, x, z, ...]), the karting tracks
  // ([closed, x, z, ...]) and lm, the landmarks farther out (tools/houli/okolica.json: the amusement park's big wheels and rides, the
  // high-speed railway's viaduct, the power lines' pylons); far: the horizon (the highest ground in rings round the circuit out to 11.8 km,
  // m a.s.l.: lo + byte x step). The names: plain descriptions only (no names of people, firms, events, the circuit, the hotels or the park).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the land cover:
  // ESA WorldCover 2021 (CC BY 4.0); the canopy: Meta and World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const HL_H = [%(skh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xd2d6cf, sun: 0xfff0d8, sunI: 1.02, sky: 0xaec8e2, gnd: 0x5a7a3a, hemiI: 0.72, tint: [1.0, 1.0, 0.98], sat: 1.0, sunOff: [-38, 72, 80], split: [[0.98, 1.0, 1.03], [1.03, 1.0, 0.96]] },   // the subtropical autumn: a higher sun from the south, a warm soft haze
    say: 'Houli', rainP: 0.12,
    grassNat: 0.5, lawn: [0.95, 1.04, 0.9],
    zivali: { a: ['egret', 'buffalo'], t: ['waterTank', 'vending'] },   // (in the glades of the woods by the road only: no buffaloes on the circuit's lawns)
    id: 'houli', name: 'Houli, Tajvan', theme: 'houli', laps: 4, halfWidth: 6,
    desc: %(desc)s,
    en: { name: 'Houli, Taiwan', desc: %(desc_en)s },
    start: [0, 0], runoff: 1.0, runoffTarmac: true, inner: 4.5, side: 6, gradeForce: true, elevSmooth: 10, realKm: %(real)s,   // (runoffTarmac: asphalt run-offs where the barriers stand far out)
    elev: HL_H.map((h, i) => [i / HL_H.length, h / 10]),
    // named places ([HUD label, x, z, the commentator's lines]): the corners and the straights by plain descriptions, in their order round the lap
    names: [
%(names)s
    ],
    turns: %(turns)s,   // the 20 corners' apexes: the first right and its kink, the left before the hairpin, the south-west hairpin, the kink, the fast right, the left by the karting, the north esses (2), the chicane (3), the east left, the east hairpin, the double right (2), the infield left, the infield esses (2), the last corner
    pit: %(pit)s,   // pit lane on the right of the main straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: %(row)s,   // the first and the last of the 13 crews' boxes (the middle garages of the race building: js/world-houli.js)
    walls: %(walls)s,   // the pit wall 2.5 m past the road's edge along the lane
    // grandstands [from, to, side (-1 left, 1 right), rows, roof, sections, orange, name]: the big one across the straight (its outline: sk.gs)
    stands: %(stands)s,
    sectors: %(sectors)s,   // the three sectors of the timing screens: the first right to the karting; the north esses, the north straight and the chicane; the east hairpin and the run home
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
    path = os.environ.get('HOULI_OUT') or os.path.join(ROOT, 'js', 'tracks', 'houli.js'); open(path, 'w').write(src)
    g = np.diff(np.r_[H, H[0]]) / STEP * 100
    print('wrote', path, len(src.encode()) // 1024, 'KB;', NP, 'points, %.1f m;' % LEN, len(hk), 'heights (start %.1f m, %.1f .. %.1f, max grade %.1f %%); dem' % (H0, H.min() - H0, H.max() - H0, np.abs(g).max()),
          D['nx'], 'x', D['nz'], '(%.1f .. %.1f m); lc' % (hv.min(), hv.max()), LC['nx'], 'x', LC['nz'], len(LC['rle']), 'chars, classes', np.bincount(lc.ravel(), minlength=4).tolist(),
          '; buildings', len(SK['bld']) // 7, 'houses', len(SK['hs']) // 2, 'roads', len(SK['road']), 'karting', [(k[0], len(k) // 2) for k in SK['kart']], '; turns', TURNS)
    print('  race building', SK['rb'] and [r for r in SK['rb'] if r[1]][:3], '...', SK['rb'] and [r for r in SK['rb'] if r[1]][-3:])
    print('  grandstand', SK['gs'] and [r for r in SK['gs'] if r[1]][:3], '...', SK['gs'] and [r for r in SK['gs'] if r[1]][-3:])
    for k in ('dem', 'lc', 'sk', 'far'): print('  %-4s %5d KB' % (k, len(js({'dem': D, 'lc': LC, 'sk': SK, 'far': FAR}[k]).encode()) // 1024))

if __name__ == '__main__':
    build_track()
