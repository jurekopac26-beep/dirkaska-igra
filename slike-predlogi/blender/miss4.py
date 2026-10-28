# Makete misij 36–45 v Blenderju (samo slike). Uporaba: bl/bin/python gas/miss4.py <misija 36-45> <izhod> [hitro]
# Gradniki so iz miss.py, miss2.py in miss3.py; tu so novi gradniki in scene.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'miss3.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def m26():')], os.path.join(_here, 'miss3.py'), 'exec'))

# ---------------------------------------------------------------- pomožno
def tube(bm, p0, p1, r, n=6):
    a = Vector(p0); b = Vector(p1); d = b - a; L = d.length
    if L < 1e-4: return
    bmesh.ops.create_cone(bm, cap_ends=False, segments=n, radius1=r, radius2=r, depth=L,
                          matrix=Matrix.Translation((a + b) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4())

def sag_line(bm, p0, p1, r=0.02, sag=0.8, segs=8):
    a = Vector(p0); b = Vector(p1); prev = a
    for s in range(1, segs + 1):
        t = s / segs; q = a.lerp(b, t); q.z -= sag * 4 * t * (1 - t)
        tube(bm, prev, q, r, 4); prev = q

def boulder(bm, x, y, z, r):
    res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=MT((x, y, z), (random.random() * 3, random.random() * 3, random.random() * 3), (r, r * random.uniform(0.7, 1.0), r * random.uniform(0.55, 0.85))))
    for v in res['verts']: v.co += Vector((random.gauss(0, 0.1 * r), random.gauss(0, 0.1 * r), random.gauss(0, 0.1 * r)))

def town(x0, x1, y0, y1, step=16, p=0.7, wall='#e9e1d2', roof='#8a4a3a', hmax=4.0):
    bw = bmesh.new(); br = bmesh.new(); gx = x0
    while gx < x1:
        gy = y0
        while gy < y1:
            if random.random() < p:
                x, y = gx + random.uniform(-3, 3), gy + random.uniform(-3, 3); w, d = random.uniform(7, 11), random.uniform(7, 10); h = random.uniform(3.0, hmax); z = T(x, y)
                a = random.uniform(0, 0.4)
                bmesh.ops.create_cube(bw, size=1.0, matrix=MT((x, y, z + h / 2 - 0.3), (0, 0, a), (w, d, h + 0.6)))
                bmesh.ops.create_cone(br, cap_ends=True, segments=4, radius1=max(w, d) * 0.74, radius2=0.1, depth=2.6, matrix=MT((x, y, z + h + 1.0), (0, 0, a + math.pi / 4), (w / max(w, d), d / max(w, d), 1)))
            gy += step
        gx += step
    mk('mesto_z', bw, mat('mesto_z' + wall, wall, 0.8)); mk('mesto_s', br, mat('mesto_s' + roof, roof, 0.7))

def seated(shirt='#2b5fae'):
    sm = mat('majica' + shirt, shirt, 0.8); sk = mat('koza', '#e2b493', 0.7)
    box('trup_s', -0.2, 0.2, -0.12, 0.14, 0.45, 1.05, sm, 0.05)
    box('noge_s', -0.18, 0.18, 0.14, 0.55, 0.42, 0.6, mat('hlace', '#2a2d33', 0.8), 0.04)
    sph('glava_s', 0.12, (0, 0.0, 1.2), sk)

# ---------------------------------------------------------------- 36 plaz
def dog(colr='#3a2a1e'):
    m = mat('pes' + colr, colr, 0.8)
    sph('telo_p', 1.0, (0, 0, 0.45), m, scl=(0.17, 0.42, 0.18))
    sph('glava_p', 0.13, (0, 0.45, 0.65), m, scl=(0.9, 1.2, 0.9))
    rbox('gobec_p', (0.09, 0.14, 0.08), (0, 0.58, 0.62), m)
    for s in (-1, 1):
        rbox('uho_p', (0.04, 0.06, 0.12), (s * 0.08, 0.42, 0.78), m)
        for yy in (-0.28, 0.28): rbox('noga_p', (0.06, 0.06, 0.36), (s * 0.09, yy, 0.18), m)
    rcyl('rep_p', 0.03, 0.35, (0, -0.48, 0.62), m, rot=(-0.8, 0, 0), n=6)
    rbox('telovnik_p', (0.36, 0.42, 0.06), (0, 0.0, 0.63), mat('telovnik_p', '#f07a12', 0.6))

def rescuer(shirt='#d6332a', tool='sonda'):
    person(shirt)
    if tool == 'sonda': rcyl('sonda', 0.014, 2.6, (0.32, 0.25, 1.0), mat('sonda', '#c9ccd0', 0.4, 0.8), rot=(0.25, -0.1, 0), n=6)
    if tool == 'lopata':
        rcyl('drzaj', 0.02, 1.2, (0.3, 0.3, 0.9), mat('lopata_d', '#2a2d33', 0.6), rot=(0.7, 0, 0), n=6)
        rbox('lopata', (0.25, 0.3, 0.03), (0.3, 0.72, 0.5), mat('lopata_r', '#d6332a', 0.5), rot=(0.7, 0, 0))
    box('kapa', -0.12, 0.12, -0.12, 0.12, 1.74, 1.84, mat('kapa_r', '#1d1d1f', 0.8))

def pickup_plow(colr='#c4161c'):
    pickup(colr, light=True)
    hexa('plug_p', [(-1.35, 3.05, 0.2), (1.35, 3.05, 0.2), (1.35, 3.35, 0.2), (-1.35, 3.35, 0.2),
                    (-1.35, 2.95, 1.05), (1.35, 2.95, 1.05), (1.35, 3.5, 1.15), (-1.35, 3.5, 1.15)], mat('plug_r', '#f2c230', 0.45), 0.03)
    box('nosilec_p', -0.3, 0.3, 2.7, 3.05, 0.45, 0.65, kit.DARK)
    box('utripalka_p', -0.45, 0.45, 0.15, 0.35, 2.05, 2.2, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9))

# ---------------------------------------------------------------- 37 poplava
def shophouses(x0, x1, yfront, side):
    """vrstne trgovske hiše; side=+1 severno od ceste (fasada proti -Y); vrne strehe [(x, y, z)]"""
    cols = ['#e8d9b0', '#cfe3d4', '#f0c9c0', '#f2e6a8', '#d6e2ef', '#efe9e1', '#e9c58f', '#d9e8c4']
    signs = ['#d6332a', '#2f6fb0', '#3a9a4a', '#f2c230', '#9a4ac4', '#e8761a']
    out = -side; roofs = []; x = x0; i = 0
    rolo = mat('rolo', '#9aa0a6', 0.5, 0.5); bal = mat('balkon_t', '#d9d6cf', 0.6); kl = mat('klima', '#e9e9e6', 0.5)
    while x < x1:
        w = random.choice((4.2, 4.5, 4.8)); H = random.choice((9.5, 10.5, 12.5))
        ya, yb = (yfront, yfront + 14) if side > 0 else (yfront - 14, yfront)
        fy = ya if side > 0 else yb; z0 = T(x + w / 2, yfront) - 0.1
        c = cols[i % len(cols)]
        box('trgovina', x, x + w - 0.08, ya, yb, z0, z0 + H, mat('trg' + c, c, 0.85))
        box('venec_t', x, x + w - 0.08, min(ya, yb), max(ya, yb), z0 + H, z0 + H + 0.5, mat('venec_t', '#d9d6cf', 0.7))
        y1, y2 = sorted((fy, fy + out * 0.06)); box('rolo', x + 0.3, x + w - 0.4, y1, y2, z0, z0 + 3.0, rolo)
        sc = signs[(i * 7) % len(signs)]
        y1, y2 = sorted((fy, fy + out * 0.25)); box('tabla', x + 0.2, x + w - 0.3, y1, y2, z0 + 3.2, z0 + 4.0, mat('tabla' + sc, sc, 0.5))
        for zz in (4.7, 7.7):
            if zz + 1.6 < H:
                y1, y2 = sorted((fy, fy + out * 0.05)); box('okno_t', x + 0.6, x + w - 0.7, y1, y2, z0 + zz, z0 + zz + 1.5, kit.GLASS)
        y1, y2 = sorted((fy, fy + out * 0.9)); box('balkon_t', x + 0.3, x + w - 0.4, y1, y2, z0 + 4.2, z0 + 4.32, bal)
        y1, y2 = sorted((fy + out * 0.05, fy + out * 0.6)); box('klima', x + w - 1.3, x + w - 0.5, y1, y2, z0 + 6.7, z0 + 7.3, kl)
        if random.random() < 0.4: rcyl('rezervoar', 0.7, 1.4, (x + w / 2, (ya + yb) / 2 + 3, z0 + H + 1.2), mat('rezervoar', '#3a6fb0', 0.5), n=12)
        roofs.append((x + w / 2, fy + side * 2.5, z0 + H + 0.5))
        x += w; i += 1
    return roofs

def power_line(xs, y, h=8.6):
    g = mat('beton_d', '#a9a7a2', 0.8); bm = bmesh.new(); bw = bmesh.new()
    for x in xs:
        z = T(x, y)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.16, radius2=0.11, depth=h + 0.6, matrix=MT((x, y, z + (h + 0.6) / 2)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, z + h - 0.6), (0, 0, 0), (0.14, 1.8, 0.14)))
        if random.random() < 0.4: bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x + 0.45, y, z + h - 2.2), (0, 0, 0), (0.5, 0.7, 1.0)))
    mk('drogovi', bm, g)
    for a, b in zip(xs, xs[1:]):
        for k in range(8):
            dz = -0.16 * k - (0.5 if k > 3 else 0); dy = ((k % 3) - 1) * 0.3
            sag_line(bw, (a, y + dy, T(a, y) + h - 0.5 + dz), (b, y + dy, T(b, y) + h - 0.5 + dz), 0.025, random.uniform(0.5, 1.2), 8)
    no_shadow(mk('zice', bw, mat('zica', '#1d1d1f', 0.6)))

def amphibian(colr='#f07a12'):
    m = mat('amfibija' + colr, colr, 0.45); wh = mat('amf_bel', '#f2f2ee', 0.4)
    hexa('trup_a', [(-1.15, -4.2, 0.45), (1.15, -4.2, 0.45), (0.9, 3.7, 0.65), (-0.9, 3.7, 0.65),
                    (-1.35, -4.4, 1.9), (1.35, -4.4, 1.9), (1.25, 4.7, 1.9), (-1.25, 4.7, 1.9)], m, 0.08)
    box('rob_a', -1.38, 1.38, -4.4, 4.0, 1.9, 2.05, wh)
    for (x, y) in ((-1.15, -3.9), (1.15, -3.9), (-1.15, 0.9), (1.15, 0.9)): box('stebric_a', x - 0.05, x + 0.05, y - 0.05, y + 0.05, 2.05, 3.6, kit.DARK)
    box('streha_a', -1.35, 1.35, -4.2, 1.3, 3.6, 3.75, wh, 0.03)
    box('vetrobran_a', -1.1, 1.1, 1.2, 1.26, 2.05, 3.0, kit.GLASS)
    for s in (-1, 1): torus('obroc_a', 0.36, 0.08, (s * 1.4, -1.2, 1.35), mat('obroc_r', '#e8452a', 0.5), rot=(0, math.pi / 2, 0))
    box('luc_a', -0.3, 0.3, 0.6, 0.9, 3.75, 3.9, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9))
    wheels([(2.4, False), (-2.6, False)], 0.62, 0.4, 1.12)
    for k, (x, y) in enumerate(((0.55, 0.3), (-0.6, -1.4), (0.6, -2.4), (-0.6, -3.2))):
        b = snap(); seated(['#2f6fb0', '#f2c230', '#e8506a', '#3a9a4a'][k]); group(b, 'potnik_a', x, y, 0, z=1.2, tilt=False)

# ---------------------------------------------------------------- 38 peščeni vihar
def marker_poles(i0, i1, step, off):
    w = mat('kol_b', '#f2f2ee', 0.5); o = mat('kol_o', '#ff8a1a', 0.3, 0.0, 2.0); bm = bmesh.new(); bo = bmesh.new()
    for i in range(i0, i1, step):
        for s in (-1, 1):
            x, y, h = on_road(i, s * off); z = T(x, y)
            bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, z + 0.75), (0, 0, h), (0.09, 0.09, 1.5)))
            bmesh.ops.create_cube(bo, size=1.0, matrix=MT((x, y, z + 1.38), (0, 0, h), (0.1, 0.1, 0.18)))
    mk('koli', bm, w); mk('odsevniki', bo, o)

def haboob(x0, x1, yfun, n=36):
    cols = ['#b9784a', '#a86a40', '#c98a5a', '#9a6040']
    for k in range(n):
        x = x0 + (x1 - x0) * (k + random.random()) / n; y = yfun(x) + random.gauss(0, 18)
        sz = random.uniform(45, 95); m = tm('prah%d' % (k % 4), cols[k % 4], random.uniform(0.82, 0.95), emit=0.22, rough=1.0)
        no_shadow(sph('vihar', 1.0, (x, y, sz * 0.45), m, scl=(random.uniform(55, 90), random.uniform(45, 65), sz), sub=3))
        if random.random() < 0.6: no_shadow(sph('vihar_v', 1.0, (x + random.uniform(-30, 30), y + random.uniform(-10, 10), sz * 0.9), m, scl=(random.uniform(30, 50), 30, random.uniform(20, 35)), sub=2))
    for k in range(n):
        x = x0 + (x1 - x0) * (k + random.random()) / n; y = yfun(x) - random.uniform(25, 45)
        m = tm('prah_n%d' % (k % 2), cols[k % 2], 0.55, emit=0.25, rough=1.0)
        no_shadow(sph('vihar_n', 1.0, (x, y, 8), m, scl=(random.uniform(18, 30), random.uniform(12, 20), random.uniform(10, 18)), sub=2))

def dust_air(cx, cy, w, n=500, zmax=9):
    bm = bmesh.new()
    for k in range(n):
        x, y = cx + random.uniform(-w, w), cy + random.uniform(-w, w)
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=random.uniform(0.05, 0.16), matrix=MT((x, y, T(x, y) + random.uniform(0.3, zmax))))
    no_shadow(mk('prah_zrak', bm, tm('prah_z', '#d9a070', 0.45, emit=0.3)))
    bm = bmesh.new()
    for k in range(90):
        x, y = cx + random.uniform(-w, w), cy + random.uniform(-w, w)
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y, T(x, y) + 0.15), (0, 0, -0.6), (random.uniform(2, 5), 0.5, 0.18)))
    no_shadow(mk('prah_tla', bm, tm('prah_t', '#c98a5a', 0.16, emit=0.1), smooth=True))

def beacon(x, y, hgt=6.0):
    z = T(x, y)
    rcyl('drog_b', 0.08, hgt, (x, y, z + hgt / 2), mat('drog_l2', '#3a3d42', 0.5, 0.4), n=8)
    sph('svetilnik_b', 0.35, (x, y, z + hgt + 0.2), mat('beacon', '#ffa21a', 0.3, 0.0, 40), sub=2)
    point_light(x, y, z + hgt + 0.2, 4000, (1.0, 0.6, 0.2), 0.3)

# ---------------------------------------------------------------- 39 konji
def oak(x, y, s=1.0):
    b = snap(); tr = mat('hrast_d', '#4a3a2a', 0.9); lf = mat('hrast_l', '#3f5a2f', 0.9)
    rcyl('deblo_h', 0.35, 3.0, (0, 0, 1.5), tr, r2=0.25, n=8)
    for k in range(3): rbox('veja_h', (0.18, 0.18, 2.2), (math.cos(k * 2.1) * 0.6, math.sin(k * 2.1) * 0.6, 3.2), tr, rot=(math.sin(k * 2.1) * 0.7, -math.cos(k * 2.1) * 0.7, 0))
    for k in range(5):
        a = random.uniform(0, 6.28); r = random.uniform(0.8, 2.4)
        sph('krosnja_h', random.uniform(1.6, 2.4), (math.cos(a) * r, math.sin(a) * r, 4.4 + random.uniform(-0.4, 0.8)), lf, scl=(1.25, 1.25, 0.72), sub=1)
    group(b, 'hrast', x, y, random.uniform(0, 6), tilt=False, scale=s)

def horse(colr='#7a4a2a', mane='#2a1a12', graze=False):
    m = mat('konj' + colr, colr, 0.7); mn = mat('griva' + mane, mane, 0.8)
    sph('telo_k', 1.0, (0, 0, 1.45), m, scl=(0.38, 1.0, 0.45))
    if graze:
        rcyl('vrat_k', 0.2, 1.0, (0, 1.1, 1.2), m, rot=(0.5, 0, 0), r2=0.14)
        sph('glava_k', 1.0, (0, 1.55, 0.55), m, scl=(0.13, 0.3, 0.15), rot=(-1.2, 0, 0))
        rbox('griva_k', (0.06, 0.1, 0.9), (0, 1.0, 1.35), mn, rot=(0.5, 0, 0))
    else:
        rcyl('vrat_k', 0.2, 0.85, (0, 1.05, 2.05), m, rot=(-0.6, 0, 0), r2=0.14)
        sph('glava_k', 1.0, (0, 1.45, 2.3), m, scl=(0.13, 0.3, 0.15), rot=(-0.6, 0, 0))
        rbox('griva_k', (0.06, 0.1, 0.8), (0, 0.95, 2.15), mn, rot=(-0.6, 0, 0))
        for s in (-1, 1): rbox('uho_k', (0.03, 0.05, 0.12), (s * 0.06, 1.33, 2.5), m)
    for x in (-0.2, 0.2):
        for y in (-0.7, 0.7): box('noga_k', x - 0.06, x + 0.06, y - 0.06, y + 0.06, 0, 1.15, m)
    rcyl('rep_k', 0.12, 0.9, (0, -1.15, 1.2), mn, rot=(0.4, 0, 0), r2=0.04, n=8)

def horse_trailer(colr='#f2f2ee', c2='#7a1f2a'):
    m = mat('prik_k' + colr, colr, 0.4); m2 = mat('prik_t' + c2, c2, 0.5)
    hexa('prik_telo', [(-1.1, -2.7, 0.55), (1.1, -2.7, 0.55), (1.1, 2.0, 0.55), (-1.1, 2.0, 0.55),
                       (-1.1, -2.7, 2.6), (1.1, -2.7, 2.6), (1.1, 2.0, 2.6), (-1.1, 2.0, 2.6)], m, 0.12, 3)
    hexa('prik_nos', [(-1.1, 2.0, 0.55), (1.1, 2.0, 0.55), (0.9, 2.8, 0.85), (-0.9, 2.8, 0.85),
                      (-1.1, 2.0, 2.6), (1.1, 2.0, 2.6), (0.9, 2.6, 2.4), (-0.9, 2.6, 2.4)], m, 0.1)
    stripe(1.1, -2.7, 2.0, 1.15, 1.3, m2)
    box('rampa', -1.0, 1.0, -2.74, -2.7, 0.6, 2.2, m2)
    for s in (-1, 1): box('okno_p', min(s * 1.1, s * 1.13), max(s * 1.1, s * 1.13), 0.8, 1.9, 1.75, 2.3, kit.GLASS)
    box('vleka_p', -0.08, 0.08, 2.6, 3.9, 0.55, 0.7, kit.DARK)
    wheels([(-0.3, False), (-1.2, False)], 0.36, 0.22, 1.0)
    hm = mat('konj#6a3a1e', '#6a3a1e', 0.7); wm = mat('konj#2a2220', '#2a2220', 0.7)
    for s, mm in ((-1, hm), (1, wm)):
        sph('glava_v', 1.0, (s * 1.3, 1.5, 2.05), mm, scl=(0.13, 0.3, 0.15), rot=(-0.4, 0, s * 0.4))
        rcyl('vrat_v', 0.13, 0.4, (s * 1.18, 1.35, 2.15), mm, rot=(0, s * 0.9, 0), n=8)

def barn(x, y, h):
    b = snap(); r = mat('hlev_r', '#a8322a', 0.8); wt = mat('hlev_b', '#f2f0ea', 0.6); rf = mat('hlev_s', '#4a4d55', 0.7)
    box('hlev', -8, 8, -6, 6, 0, 6, r)
    hexa('streha_h', [(-8.5, -6.6, 6), (8.5, -6.6, 6), (8.5, 6.6, 6), (-8.5, 6.6, 6), (-8.5, -0.05, 10.5), (8.5, -0.05, 10.5), (8.5, 0.05, 10.5), (-8.5, 0.05, 10.5)], rf)
    box('vrata_h', -2.5, 2.5, -6.05, -6.0, 0, 4.5, r)
    for a in (0.73, -0.73): rbox('kriz_h', (0.25, 0.04, 6.3), (0, -6.08, 2.25), wt, rot=(0, a, 0))
    boxes('okvir_h', [(-2.6, 2.6, -6.09, -6.04, 4.4, 4.6), (-2.6, -2.4, -6.09, -6.04, 0, 4.6), (2.4, 2.6, -6.09, -6.04, 0, 4.6), (-8.05, 8.05, -6.06, -6.0, 5.8, 6.0)], wt)
    box('kupola_h', -0.8, 0.8, -0.8, 0.8, 10.2, 11.6, wt); hexa('kupola_s', [(-1.1, -1.1, 11.6), (1.1, -1.1, 11.6), (1.1, 1.1, 11.6), (-1.1, 1.1, 11.6), (-0.05, -0.05, 12.6), (0.05, -0.05, 12.6), (0.05, 0.05, 12.6), (-0.05, 0.05, 12.6)], rf)
    return group(b, 'hlev', x, y, h, tilt=False)

# ---------------------------------------------------------------- 40 varnostni avto
def race_car(colr, c2='#f2f2ee'):
    car(colr, sporty=True)
    box('krilo_z', -0.85, 0.85, -2.3, -2.0, 1.05, 1.12, kit.BLACK)
    for s in (-1, 1): box('nosilec_k', s * 0.5 - 0.04, s * 0.5 + 0.04, -2.2, -2.1, 0.72, 1.05, kit.BLACK)
    stripe(0.9, -2.2, 2.2, 0.5, 0.62, mat('trak_d' + c2, c2, 0.4))
    for s in (-1, 1): cyl('st_krog', 0.27, 0.02, (s * 0.91, 0.0, 0.6), mat('krog_b', '#f2f2ee', 0.5), 'X', 16)

def safety_car():
    car('#f2f2ee', lights=True, sporty=True)
    stripe(0.9, -2.2, 2.2, 0.45, 0.6, mat('sc_zelena', '#3ad66a', 0.4))
    am = mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)
    box('sc_bar', -0.62, 0.62, -0.42, -0.14, 1.27, 1.36, kit.BLACK)
    for s in (-1, 1): box('sc_luc', min(s * 0.12, s * 0.58), max(s * 0.12, s * 0.58), -0.4, -0.16, 1.36, 1.46, am)

def kerbs(off0, off1, i0=0, i1=None):
    R = ROAD[i0:i1]; bm_r = bmesh.new(); bm_w = bmesh.new(); prev = None
    for i, (x, y, z) in enumerate(R):
        j = min(i + 1, len(R) - 1); k = max(i - 1, 0)
        tx, ty = R[j][0] - R[k][0], R[j][1] - R[k][1]; L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        bm = bm_r if (i // 2) % 2 == 0 else bm_w
        a = (x + nx * off0, y + ny * off0, z + 0.06); b = (x + nx * off1, y + ny * off1, z + 0.06)
        if prev:
            va = [bm.verts.new(p) for p in (prev[0], prev[1], b, a)]; bm.faces.new(va)
        prev = (a, b)
    mk('kerb_r', bm_r, mat('kerb_rdec', '#d6332a', 0.6)); mk('kerb_b', bm_w, mat('kerb_bel', '#f2f2ee', 0.6))

# ---------------------------------------------------------------- 41 dirkalni taksi
def castle(x, y, s=1.0):
    b = snap(); st = mat('grad_k', '#8f8a80', 0.9); st2 = mat('grad_t', '#7a756c', 0.9)
    for (tx, ty, r, h) in ((0, 0, 5.5, 28), (20, 8, 3.8, 17), (-16, 12, 3.6, 12), (6, 24, 3.2, 15)):
        rcyl('stolp_g', r, h, (tx, ty, h / 2), st, n=14)
        for k in range(10):
            if random.random() < 0.75:
                a = k * 2 * math.pi / 10; box('zob_g', tx + r * 0.85 * math.cos(a) - 0.5, tx + r * 0.85 * math.cos(a) + 0.5, ty + r * 0.85 * math.sin(a) - 0.5, ty + r * 0.85 * math.sin(a) + 0.5, h, h + 1.2, st2)
    for (p, q, hh) in (((0, 0), (20, 8), 9), ((20, 8), (6, 24), 6), ((6, 24), (-16, 12), 4), ((-16, 12), (0, 0), 7)):
        L = math.hypot(q[0] - p[0], q[1] - p[1]); a = math.atan2(q[1] - p[1], q[0] - p[0])
        rbox('zid_g', (L, 1.6, hh), ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, hh / 2), st, rot=(0, 0, a))
    group(b, 'grad', x, y, 0.4, tilt=False, scale=s)

# ---------------------------------------------------------------- 42 ogledalo za zvezde
def observatory():
    wh = mat('kupola_b', '#e9ecf0', 0.35, 0.2)
    rcyl('valj_k', 14, 12, (0, 0, 6), wh, n=40)
    sph('kupola_k', 14.6, (0, 0, 12), wh, sub=4)
    box('reza_k', -2.0, 2.0, -15.5, 0.0, 13.5, 27.5, mat('reza_r', '#3a0c0a', 0.5, 0.0, 1.2))
    box('vrata_k', -1.5, 1.5, -14.1, -13.9, 0, 3, kit.DARK)
    box('stavba_k', 18, 34, -6, 6, 0, 6, mat('stavba_b', '#d9dce0', 0.6))

def flatbed_crate():
    cm = mat('kab_t', '#3a3d42', 0.4)
    c = kit.cab('kabina', 1.25, 1.0, 3.3, 0.78, 3.0, 0.28, cm, 0.08); kit.arch(c, 2.2, 0.5, 0.6, 1.25)
    kit.windscreen(1.25, 3.3, 0.78, 3.0, 0.28, 1.85, 2.88)
    box('sasija', -0.45, 0.45, -6.0, 3.2, 0.5, 0.85, kit.DARK)
    box('plato_f', -1.25, 1.25, -6.2, 0.8, 0.85, 1.05, mat('plato_l', '#5b6066', 0.6, 0.3))
    rm = mat('rdeca_m', '#ff2a1a', 0.3, 0.0, 8)
    for s in (-1, 1):
        box('rdeca_s', min(s * 0.85, s * 1.2), max(s * 0.85, s * 1.2), 3.33, 3.37, 0.9, 1.05, rm)
        box('rdeca_z', min(s * 0.8, s * 1.2), max(s * 0.8, s * 1.2), -6.25, -6.2, 0.9, 1.1, rm)
        for yy in (-5.5, -3.0, -0.5): box('rdeca_b', min(s * 1.25, s * 1.28), max(s * 1.25, s * 1.28), yy - 0.08, yy + 0.08, 0.95, 1.08, rm)
    wd = mat('zaboj_s', '#c9a46a', 0.85); ym = mat('trak_y', '#f2c230', 0.5)
    box('zaboj_o', -1.15, 1.15, -5.6, -0.2, 1.05, 3.6, wd, 0.04)
    for yy in (-4.6, -2.9, -1.2):
        boxes('trak', [(-1.18, -1.15, yy - 0.06, yy + 0.06, 1.05, 3.6), (1.15, 1.18, yy - 0.06, yy + 0.06, 1.05, 3.6), (-1.18, 1.18, yy - 0.06, yy + 0.06, 3.6, 3.63)], ym)
    wheels([(2.2, False), (-3.4, True), (-4.6, True)], 0.5, 0.34, 1.0)

def milky_way(R=1400, n=2600):
    rnd = random.Random(7); bm = bmesh.new(); bg = []
    for i in range(n):
        a = math.radians(rnd.uniform(-60, 160)); e = math.radians(max(4, 78 * math.sin((a + math.radians(60)) / math.radians(220) * math.pi) + rnd.gauss(0, 4)))
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=rnd.uniform(0.6, 1.6), matrix=MT((R * math.cos(e) * math.cos(a), R * math.cos(e) * math.sin(a), R * math.sin(e))))
    no_shadow(mk('rimska', bm, mat('zvezda_m', '#eef2ff', 0.5, 0.0, 10)))
    gm = tm('rimska_sij', '#b9c6ff', 0.07, emit=1.2, rough=1.0)
    for k in range(16):
        a = math.radians(-60 + k * 14); e = math.radians(max(6, 78 * math.sin((a + math.radians(60)) / math.radians(220) * math.pi)))
        no_shadow(sph('sij_m', 1.0, (R * 0.95 * math.cos(e) * math.cos(a), R * 0.95 * math.cos(e) * math.sin(a), R * 0.95 * math.sin(e)), gm, scl=(110, 110, 60), sub=2))

# ---------------------------------------------------------------- 43 vroče zavore
def rf_tree(x, y, s=1.0):
    b = snap(); cols = ['#3f7f3a', '#4f8f3f', '#2f6f35', '#5f9a45']
    rcyl('deblo_d', 0.3, 6, (0, 0, 3), mat('deblo_d', '#5a4a3a', 0.9), n=6)
    c = random.choice(cols)
    for k in range(3): sph('krosnja_d', random.uniform(2.0, 3.0), (random.uniform(-1, 1), random.uniform(-1, 1), 6 + random.uniform(0, 1.5)), mat('dz' + c, c, 0.9), sub=1)
    group(b, 'drevo_d', x, y, random.uniform(0, 6), tilt=False, scale=s)

def araucaria(x, y, s=1.0):
    b = snap(); tr = mat('arav_d', '#6a5040', 0.9); lf = mat('arav_l', '#2f4a2a', 0.9)
    rcyl('deblo_a', 0.3, 16, (0, 0, 8), tr, r2=0.2, n=6)
    for k in range(7):
        a = k * 2 * math.pi / 7; L = 3.5
        rbox('veja_a', (0.15, L, 0.15), (math.cos(a) * L / 2, math.sin(a) * L / 2, 15.2), tr, rot=(0, 0, a - math.pi / 2))
        sph('sop_a', 1.4, (math.cos(a) * L, math.sin(a) * L, 15.8), lf, scl=(1.2, 1.2, 0.5), sub=1)
    sph('vrh_a', 2.0, (0, 0, 16.2), lf, scl=(1.4, 1.4, 0.45), sub=1)
    group(b, 'araukarija', x, y, random.uniform(0, 6), tilt=False, scale=s)

def hot_truck():
    box_truck('#c4161c', '#e9e6df')
    gl = mat('vroce', '#ff6a10', 0.4, 0.0, 14)
    for y in (2.2, -3.2):
        for s in (-1, 1): cyl('zavora', 0.3, 0.06, (s * 1.36, y, 0.5), gl, 'X', 16)

# ---------------------------------------------------------------- 44 skalni podor
def wheel_loader(colr='#f2c230'):
    m = mat('nakl' + colr, colr, 0.45)
    box('zadek_n', -1.2, 1.2, -3.4, -0.4, 0.9, 2.3, m, 0.1)
    box('motor_n', -1.0, 1.0, -3.3, -1.6, 2.3, 2.9, m, 0.1)
    box('kabina_n', -0.95, 0.95, -1.5, 0.3, 2.3, 3.9, kit.GLASS, 0.05); box('streha_n', -1.05, 1.05, -1.6, 0.4, 3.9, 4.05, m)
    box('spredaj_n', -0.8, 0.8, 0.3, 2.4, 0.8, 1.6, m, 0.05)
    for s in (-1, 1): rbox('roka_n', (0.25, 2.6, 0.3), (s * 0.9, 2.5, 2.1), m, rot=(0.45, 0, 0))
    hexa('lopata_n', [(-1.5, 3.4, 2.1), (1.5, 3.4, 2.1), (1.5, 4.6, 2.3), (-1.5, 4.6, 2.3),
                      (-1.5, 3.2, 3.4), (1.5, 3.2, 3.4), (1.5, 4.4, 3.1), (-1.5, 4.4, 3.1)], mat('lopata_k', '#4a4d55', 0.5, 0.4), 0.04)
    wheels([(1.6, False), (-2.2, False)], 0.85, 0.6, 1.1)
    box('utripalka_n', -0.2, 0.2, -1.0, -0.6, 4.05, 4.25, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9))
    bm = bmesh.new()
    for k in range(5): boulder(bm, random.uniform(-0.9, 0.9), random.uniform(3.6, 4.2), random.uniform(3.0, 3.5), random.uniform(0.3, 0.55))
    mk('kamni_n', bm, mat('peščenjak', '#b07a52', 0.9))

def rock_drop(p, d, r=1.0, L=8.0):
    bm = bmesh.new(); boulder(bm, *p, r); mk('pada', bm, mat('peščenjak', '#b07a52', 0.9))
    dv = Vector(d).normalized()
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r * 0.3, radius2=r * 1.5, depth=L)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p) - dv * L / 2) @ dv.to_track_quat('Z', 'Y').to_matrix().to_4x4(), verts=bm.verts)
    no_shadow(mk('prah_p', bm, tm('prah_p', '#c9a880', 0.3, emit=0.15), smooth=True))

def stop_sign(x, y, h):
    z = T(x, y)
    rcyl('drog_z', 0.04, 2.2, (x, y, z + 1.1), mat('drog_b', '#e9e6df', 0.5), n=6)
    cyl('znak_s', 0.42, 0.04, (x, y, z + 2.3), mat('znak_r', '#d6332a', 0.5), 'Y', 8)

# ---------------------------------------------------------------- 45 turistični vlakec
def monaco_block(x, y, h, w, d, floors, wall, shutter='#3f6b3a', roof='#b5643c'):
    b = snap(); wm = mat('mc' + wall, wall, 0.85); sh = mat('polkna' + shutter, shutter, 0.6); rm = mat('mc_streha' + roof, roof, 0.75)
    H = floors * 3.1 + 0.6
    box('blok_mc', -w / 2, w / 2, -d / 2, d / 2, 0, H, wm)
    k = min(d * 0.35, w * 0.3)
    hexa('streha_mc', [(-w / 2 - 0.4, -d / 2 - 0.4, H), (w / 2 + 0.4, -d / 2 - 0.4, H), (w / 2 + 0.4, d / 2 + 0.4, H), (-w / 2 - 0.4, d / 2 + 0.4, H),
                       (-w / 2 + k, -0.1, H + k * 0.8), (w / 2 - k, -0.1, H + k * 0.8), (w / 2 - k, 0.1, H + k * 0.8), (-w / 2 + k, 0.1, H + k * 0.8)], rm)
    gl = []; sl = []; bl = []
    for f in range(floors):
        z = 0.9 + f * 3.1; xx = -w / 2 + 1.4
        while xx < w / 2 - 1.4:
            gl.append((xx - 0.5, xx + 0.5, -d / 2 - 0.04, -d / 2, z, z + 1.7))
            sl += [(xx - 1.05, xx - 0.55, -d / 2 - 0.08, -d / 2, z, z + 1.7), (xx + 0.55, xx + 1.05, -d / 2 - 0.08, -d / 2, z, z + 1.7)]
            xx += 3.0
        if f % 2 == 1: bl.append((-w / 2 + 0.6, w / 2 - 0.6, -d / 2 - 0.9, -d / 2, z - 0.15, z - 0.02))
    boxes('okna_mc', gl, kit.GLASS); boxes('polkna_mc', sl, sh)
    if bl: boxes('balkoni_mc', bl, mat('balkon_mc', '#f2efe8', 0.6))
    return group(b, 'blok_mc', x, y, h, tilt=False, z=T(x, y) - 0.4)

def yacht(L=14):
    wh = mat('jahta', '#f4f4f0', 0.3); dk = mat('jahta_t', '#2a3a4a', 0.2)
    hexa('trup_j', [(-L * 0.15, -L / 2, -0.2), (L * 0.15, -L / 2, -0.2), (0.05, L / 2, 0.3), (-0.05, L / 2, 0.3),
                    (-L * 0.19, -L / 2, 1.6), (L * 0.19, -L / 2, 1.6), (0.3, L / 2 + 1, 2.0), (-0.3, L / 2 + 1, 2.0)], wh, 0.05)
    box('nadgradnja_j', -L * 0.12, L * 0.12, -L * 0.35, L * 0.12, 1.6, 3.0, wh, 0.1)
    box('okna_j', -L * 0.125, L * 0.125, -L * 0.22, L * 0.08, 2.0, 2.6, dk)

def road_train_loco():
    rd = mat('vlak_r', '#c4161c', 0.4); bk = mat('vlak_c', '#1d1d1f', 0.4); gd = mat('vlak_z', '#e0b040', 0.3, 0.6)
    box('podvozje_v', -0.9, 0.9, -1.6, 2.2, 0.35, 0.7, bk)
    cyl('kotel_v', 0.62, 2.0, (0, 1.1, 1.35), bk, 'Y', 18)
    cyl('obroc_v', 0.66, 0.1, (0, 0.5, 1.35), gd, 'Y', 18); cyl('obroc_v2', 0.66, 0.1, (0, 1.7, 1.35), gd, 'Y', 18)
    rcyl('dimnik_v', 0.2, 1.0, (0, 1.8, 2.3), bk, r2=0.3, n=12)
    box('kabina_v', -0.9, 0.9, -1.6, 0.1, 0.7, 2.4, rd, 0.05); box('streha_v', -1.0, 1.0, -1.7, 0.2, 2.4, 2.55, bk)
    box('okno_v', -0.75, 0.75, 0.08, 0.12, 1.5, 2.2, kit.GLASS)
    for s in (-1, 1): box('luc_v', min(s * 0.3, s * 0.55), max(s * 0.3, s * 0.55), 2.15, 2.2, 0.75, 0.95, kit.HEAD)
    wheels([(1.5, False), (-1.0, False)], 0.38, 0.22, 0.85)

def road_train_wagon(n=0):
    wh = mat('vag_b', '#f2efe8', 0.5); rd = mat('vlak_r', '#c4161c', 0.4); bk = mat('vlak_c', '#1d1d1f', 0.4)
    box('dno_vg', -1.0, 1.0, -2.0, 2.0, 0.45, 0.65, rd, 0.04)
    for (x, y) in ((-0.95, -1.95), (0.95, -1.95), (-0.95, 1.95), (0.95, 1.95)): box('stebric_vg', x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0.65, 2.3, wh)
    box('streha_vg', -1.1, 1.1, -2.1, 2.1, 2.3, 2.42, rd, 0.03); stripe(1.1, -2.1, 2.1, 2.22, 2.3, wh)
    for yy in (-1.3, 0.0, 1.3): box('klop_vg', -0.9, 0.9, yy - 0.35, yy - 0.2, 0.65, 1.15, wh)
    box('oje_vg', -0.06, 0.06, 2.0, 2.7, 0.45, 0.55, bk)
    wheels([(1.3, False), (-1.3, False)], 0.3, 0.18, 0.9)
    cols = ['#e8506a', '#2f6fb0', '#f2c230', '#3a9a4a', '#f2f2ee', '#9a4ac4']
    for k, yy in enumerate((-1.1, 0.2, 1.5)):
        for s in (-1, 1):
            if random.random() < 0.85:
                b = snap(); seated(cols[(k * 2 + (s > 0) + n) % len(cols)]); group(b, 'turist', s * 0.42, yy - 0.25, 0, z=0.3, tilt=False, scale=0.85)

# ---------------------------------------------------------------- misije 36–45
def m36():   # Plaz · Vršič
    global BASE
    def base(x, y):
        z = 0.30 * y + 6 * math.sin(x / 45) * math.cos(y / 60)
        z += 170 * sst(110, 290, y) * (0.65 + 0.35 * math.sin(x / 47 + 1.0))
        z += 70 * sst(90, 180, abs(x - 10))
        gx = x - 4 - 0.05 * (y - 10)
        return z - 7 * math.exp(-(gx / 16) ** 2) * sst(14, 50, y) * (1 - sst(160, 230, y))
    BASE = base
    set_road([(-170, -40), (-80, -16), (0, 0), (80, 14), (170, 38)], 3.2)
    terrain(460, 230, pal('#e6ecf2', '#d9e1ea', '#6f6c68', (0.42, 0.62)), 0, 60)
    road2('#7d858e', shoulder='#e9eef2', rough=0.5)
    sm = mat('sneg_rob', '#f2f5f8', 0.6); bm = bmesh.new()
    for i in range(0, len(ROAD), 3):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 1.0))
            if -26 < x < 30: continue
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y, T(x, y) + 0.2), (0, 0, h), (0.9, 1.6, 0.6)))
    mk('robovi', bm, sm, smooth=True)
    def mound(x, y):
        r = math.hypot((x - 3) / 24, (y - 1.5) / 10)
        return max(0.0, 1.6 * (1 - r * r))
    sn = mat('plazovina', '#f4f7fa', 0.55); sn2 = mat('plazovina2', '#cfd9e4', 0.6)
    bm = bmesh.new(); bm2 = bmesh.new()
    for k in range(480):
        a = random.uniform(0, 6.28); r = math.sqrt(random.random())
        x = 3 + 23 * r * math.cos(a); y = 1.5 + 9.5 * r * math.sin(a); s = random.uniform(0.5, 1.5) * (1.2 - 0.6 * r)
        bmesh.ops.create_icosphere(bm if k % 3 else bm2, subdivisions=1, radius=1.0, matrix=MT((x, y, T(x, y) + mound(x, y) * random.uniform(0.5, 1.0)), (random.random() * 3, random.random() * 3, random.random() * 3), (s * 1.2, s, s * 0.8)))
    for k in range(240):
        y = random.uniform(12, 160); x = 4 + 0.05 * (y - 10) + random.gauss(0, 6); s = random.uniform(0.4, 1.3)
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y, T(x, y) + 0.2), (random.random() * 3, random.random() * 3, 0), (s * 1.3, s, s * 0.6)))
    mk('plazovina', bm, sn, smooth=True); mk('plazovina2', bm2, sn2, smooth=True)
    forest(240, -230, 230, -170, 150, 8, keep=lambda x, y: (y < -14 or abs(x - 4 - 0.05 * (y - 10)) > 26) and BASE(x, y) < 75 and not (-60 < x < 20 and -75 < y < -8) and not (-30 < x < 36 and -14 < y < 18))
    b = snap(); car('#2f6fb0'); e = group(b, 'zasut', 16, 3.0, 0, z=T(16, 3.0) - 0.75, tilt=False); e.rotation_euler = (0.14, -0.22, 0.9)
    i = idx_near(31, 6); x, y, h = on_road(i, -1.4)
    b = snap(); pickup_plow('#c4161c'); e = group(b, 'resevalci', x, y, h + math.pi); headlights(e, 3.0, 0.9, 900)
    for k, (px, py, tool) in enumerate(((0, 4.5, 'sonda'), (5, 6.0, 'sonda'), (-5, 3.0, 'lopata'), (9, 1.0, 'sonda'))):
        b = snap(); rescuer(['#d6332a', '#f07a12', '#d6332a', '#2f6fb0'][k], tool); group(b, 'resevalec', px, py, random.uniform(0, 6), z=T(px, py) + mound(px, py), tilt=False, scale=1.15)
    b = snap(); dog('#3a2a1e'); group(b, 'pes', 7.5, 3.5, 2.2, z=T(7.5, 3.5) + mound(7.5, 3.5), tilt=False)
    b = snap(); helicopter('#c4161c'); group(b, 'heli', 46, 58, 2.3, z=T(46, 58) + 28, tilt=False)
    bm = bmesh.new()
    for k in range(160):
        x2, y2 = random.uniform(-220, 220), random.uniform(30, 280)
        if abs(x2 - 4 - 0.05 * (y2 - 10)) < 22 and y2 < 170: continue
        boulder(bm, x2, y2, BASE(x2, y2) - 0.5, random.uniform(1.5, 5.0) * (1 + sst(110, 250, y2)))
    mk('skale_s', bm, mat('skala_t', '#4a4846', 0.9))
    sky(colr='#6fa0d0', strength=0.8, sun=(55, 15), sun_e=2.8, sun_c=(1.0, 0.95, 0.88))
    zc = T(3, 1.5)
    return dict(cam=(-30, -30, zc + 11), tgt=(8, 34, zc + 20), lens=18, pts={'zasuti': (7, 4.5, T(7, 4.5) + mound(7, 4.5) + 0.3), 'avto': (16, 3.0, T(16, 3) + 0.8)})

def m37():   # Poplava · Bang Saen
    global BASE
    BASE = lambda x, y: 0.0
    set_road([(-200, 0), (200, 0)], 5.0)
    terrain(420, 160, lambda x, y, z, sl: lin('#8f8a80'), 0, 0); road2('#4a4d52', shoulder=None)
    random.seed(37)
    roofs_n = shophouses(-120, 120, 7.5, 1); roofs_s = shophouses(-120, 120, -7.5, -1)
    power_line([-110 + k * 22 for k in range(11)], 6.4)
    box('poplava', -205, 205, -78, 78, -1, 1.15, tm('poplava', '#7a6a48', 0.88, rough=0.1))
    cols = ['#d6332a', '#2f6fb0', '#f2f2ee', '#f2c230', '#3a9a4a']
    for k in range(36):
        x, y = random.uniform(-70, 60), random.uniform(-4.5, 4.5)
        if -16 < x < 2 and abs(y + 1.6) < 3: continue
        c = random.choice(cols); s = random.uniform(0.4, 0.9)
        rbox('smeti', (s, s * random.uniform(0.6, 1.2), s * 0.6), (x, y, 1.15), mat('smet' + c, c, 0.6), rot=(random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), random.uniform(0, 3)))
    for (x, y, hh) in ((-42, -3.4, 1.62), (26, 3.2, -1.52)):
        b = snap(); car(random.choice(['#f2f2ee', '#c4161c', '#2f5d9a'])); group(b, 'potopljen', x, y, hh, z=-0.2, tilt=False)
    b = snap(); amphibian('#f07a12'); group(b, 'amfibija', -8, -1.6, -math.pi / 2, z=0.0, tilt=False)
    for (x0, y0, x1, y1) in ((-12.6, -2.6, -32, -7.0), (-12.6, -0.6, -32, 3.8), (-3.4, -2.8, -1.8, -4.2), (-3.4, -0.4, -1.8, 1.0)):
        foam_seg(x0, y0, x1, y1, 1.17, 0.35, 0.35)
    picks = sorted(roofs_n, key=lambda r: abs(r[0] - 18))[:4]
    for k, (x, y, z) in enumerate(picks):
        for j in range(random.choice((1, 2))):
            b = snap(); person_wave(cols[(k + j) % len(cols)]); group(b, 'na_strehi', x + j * 0.9, y, math.pi + random.uniform(-0.4, 0.4), z=z, tilt=False)
    for (x, y, z) in sorted(roofs_s, key=lambda r: abs(r[0] - 30))[:2]:
        b = snap(); person_wave('#e8506a'); group(b, 'na_strehi', x, y, random.uniform(-0.4, 0.4), z=z, tilt=False)
    for x in (-60, -20, 40):
        b = snap(); person_wave('#3a9a4a'); group(b, 'balkon_m', x, -7.0, 0, z=4.3, tilt=False)
    cam = (-38, -4, 15)
    rain(0, 0, 60, 1800, 25, 0.15, avoid=(cam, 14))
    sky(colr='#7f8a96', strength=1.0, sun=(50, 140), sun_e=1.8, sun_c=(0.9, 0.92, 1.0))
    ps = picks[0]
    return dict(cam=cam, tgt=(6, 1.5, 2.0), lens=26, pts={'ljudje': (ps[0], ps[1], ps[2] + 2.2), 'amfibija': (-8, -1.6, 4.2)})

def m38():   # Peščeni vihar · Moki Dugway
    global BASE
    BASE = lambda x, y: 1.2 * math.sin(x / 37) * math.cos(y / 29) + 0.6 * math.sin((x + y) / 13)
    set_road([(-10, -160), (0, -60), (12, 40), (8, 140), (30, 240)], 3.0)
    def colf(x, y, z, sl):
        c = mix(lin('#c46a3c'), lin('#b35e33'), noise(x, y))
        return mix(c, lin('#8f4a2a'), 0.4 * sst(0.6, 0.8, noise(x * 2.3, y * 1.7)))
    terrain(600, 220, colf, 0, 120); road2('#b9774a', shoulder=None, rough=0.95)
    for (x, y, w, d, hh) in ((-170, 230, 70, 45, 75), (60, 330, 90, 55, 95), (210, 170, 55, 40, 60), (-80, 400, 80, 60, 120), (-240, 90, 40, 30, 45), (150, 380, 60, 50, 85)):
        butte(x, y, w, d, hh)
    marker_poles(0, len(ROAD), 14, RHW + 1.3)
    cx, cy = 32, 88
    for k, (dx, dy, a) in enumerate(((0, 0, 0.3), (9, 5, 1.1))):
        b = snap(); camper(['#f2f2ee', '#e9e1d2'][k]); group(b, 'tabor', cx + dx, cy + dy, a)
    b = snap(); hexa('sotor_t', [(-2.5, -3, 0), (2.5, -3, 0), (2.5, 3, 0), (-2.5, 3, 0), (-0.05, -3, 2.6), (0.05, -3, 2.6), (0.05, 3, 2.6), (-0.05, 3, 2.6)], mat('platno_t', '#e8761a', 0.8)); group(b, 'sotor', cx - 8, cy + 4, 0.6, tilt=False)
    beacon(cx - 3, cy - 4, 7.0)
    haboob(-460, 220, lambda x: 330 - 0.2 * (x + 420), 44)
    i = idx_near(2, -30); x, y, h = on_road(i, -1.4)
    b = snap(); pickup('#e9e6df', light=True)
    boxes('lucke_s', [(xx - 0.12, xx + 0.12, 0.25, 0.4, 2.06, 2.2) for xx in (-0.6, -0.2, 0.2, 0.6)], mat('luc_bela', '#fff6e0', 0.2, 0.0, 14))
    e = group(b, 'terenec', x, y, h); headlights(e, 2.7, 0.9, 1800)
    dust_air(x, y + 10, 40, 600, 9)
    sky(colr='#c98f5f', strength=1.1, sun=(76, -110), sun_e=3.0, sun_c=(1.0, 0.75, 0.5))
    return dict(cam=behind(x, y, h, 16, 7.5, side=3), tgt=ahead(x, y, h, 60, 8, side=-10), lens=24, pts={'tabor': (cx - 3, cy - 4, T(cx - 3, cy - 4) + 7.5)})

def m39():   # Konji v prikolici · Monterey
    global BASE
    BASE = lambda x, y: 14 * math.sin(x / 70) * math.cos(y / 55) + 8 * math.sin((x + y) / 40) + 0.08 * y
    set_road([(-160, -50), (-80, -24), (-20, -6), (40, 4), (100, 24), (170, 40)], 3.0)
    def colf(x, y, z, sl):
        c = mix(lin('#c9a85a'), lin('#b8954a'), noise(x, y))
        c = mix(c, lin('#8f8a4a'), 0.5 * sst(0.55, 0.75, noise(x * 1.7, y * 2.1)))
        return mix(c, lin('#8a7a5a'), sst(0.3, 0.5, sl))
    terrain(420, 220, colf, 0, 20)
    road('asfalt', lines=True)
    ym = mat('rumena_s', '#f2c230', 0.6)
    ribbon('sredina_r1', -0.17, -0.06, 0.05, ym); ribbon('sredina_r2', 0.06, 0.17, 0.05, ym)
    wf = mat('ograja_b', '#f2f0ea', 0.6)
    i0, i1 = idx_near(-75, -22), idx_near(55, 8)
    fence_line([on_road(i, -(RHW + 3.0))[:2] for i in range(i0, i1, 5)], wf, 3.0)
    bx, by = -62, 46
    barn(bx, by, 0.2)
    fence_line([(bx + 12, by - 12), (bx + 40, by - 14), (bx + 42, by + 12), (bx + 12, by + 14), (bx + 12, by - 12)], wf, 3.0)
    for k, (dx, dy, a, c) in enumerate(((22, -4, 0.4, '#7a4a2a'), (30, 4, 2.2, '#f2efe8'), (34, -8, 4.0, '#2a2220'))):
        b = snap(); horse(c, '#2a1a12', graze=k != 1); group(b, 'konj', bx + dx, by + dy, a)
    k = 0
    while k < 110:
        x, y = random.uniform(-200, 200), random.uniform(-80, 120)
        if near_road(x, y, 7) or (abs(x - bx) < 50 and abs(y - by) < 24): continue
        oak(x, y, random.uniform(0.8, 1.3)); k += 1
    i = idx_near(-22, -7); x, y, h = on_road(i, 1.3)
    b = snap(); pickup('#3a3d42'); e = group(b, 'vlecno_k', x, y, h)
    tx, ty, tz = behind(x, y, h, 6.9, 0)
    b = snap(); horse_trailer(); group(b, 'prikolica_k', tx, ty, h + 0.04)
    sky(colr='#a9c8e8', sun=(45, -40), sun_e=3.6, sun_c=(1.0, 0.94, 0.85))
    return dict(cam=behind(x, y, h, -7, 5.0, side=11), tgt=behind(x, y, h, 4.0, 1.2), lens=26)

def m40():   # Varnostni avto · Bathurst
    global BASE
    BASE = lambda x, y: 70 * math.exp(-((y - 0.1 * x) / 90) ** 2) + 6 * math.sin(x / 50)
    set_road([(-220, -14), (-120, -10), (-40, -2), (30, 6), (100, 12), (200, 22)], 5.5)
    def colf(x, y, z, sl):
        c = mix(lin('#9a9a5a'), lin('#a8a060'), noise(x, y))
        return mix(c, lin('#7a7a4a'), 0.4 * sst(0.55, 0.75, noise(x * 2, y * 2)))
    terrain(520, 240, colf, 0, -60); road('asfalt', lines=True)
    cw = mat('beton_z', '#d0cdc6', 0.85); fm = tm('mreza_l', '#9aa0a6', 0.28, rough=0.6)
    for s in (-1, 1):
        rail(s * (RHW + 0.6), -0.3, 1.0, cw, name='zid'); ribbon('zid_vrh', s * (RHW + 0.45), s * (RHW + 0.75), 1.0, cw)
        rail(s * (RHW + 0.62), 1.0, 3.4, fm, name='mreza')
        kerbs(s * (RHW - 0.7), s * RHW)
    ps = [(x, y) for (x, y, z) in ROAD[::14]]
    fb = bmesh.new()
    for i in range(0, len(ROAD), 5):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 0.62)); tube(fb, (x, y, ROAD[i][2] + 1.0), (x, y, ROAD[i][2] + 3.5), 0.05, 5)
    mk('stebri_m', fb, kit.DARK)
    k = 0
    while k < 140:
        x, y = random.uniform(-250, 250), random.uniform(-200, 120)
        if near_road(x, y, 9) or (-40 < x < 70 and 20 < y < 70): continue
        eucalyptus(x, y, random.uniform(0.8, 1.2)); k += 1
    for k in range(10):
        x, y = -40 + k * 11 + random.uniform(-2, 2), 34 + random.uniform(-4, 10)
        b = snap(); camper(random.choice(['#f2f2ee', '#e9e1d2', '#cfe3d4'])); group(b, 'kamper', x, y, random.uniform(-0.5, 0.5))
    for k in range(14):
        x, y = -40 + k * 8 + random.uniform(-2, 2), 24 + random.uniform(-1, 2)
        b = snap(); fan(random.choice(['#2f6fb0', '#d6332a', '#f2c230', '#1d1d1f']), random.choice([None, None, '#2f6fb0', '#d6332a'])); group(b, 'navijac', x, y, math.pi + random.uniform(-0.5, 0.5))
    town(-260, 260, -330, -190, 16, 0.75)
    si = idx_near(6, 4); sx, sy, sh = on_road(si, 0)
    b = snap(); safety_car(); e = group(b, 'sc', sx, sy, sh); headlights(e, 2.3, 0.7, 700)
    cols = ['#d6332a', '#1f4fa8', '#f2c230', '#2f2f33', '#3a9a4a', '#e8761a', '#9a4ac4', '#2aa0c8', '#f2f2ee']
    for k in range(9):
        x, y, h = on_road(si - 13 * (k + 1), (0.4 if k % 2 else -0.4))
        b = snap(); race_car(cols[k], cols[(k + 3) % len(cols)]); group(b, 'dirkalnik', x, y, h)
    for k in range(3):
        x, y, h = on_road(idx_near(36, 7), RHW + 2.4 + k * 1.2)
        b = snap(); fan('#f07a12', '#f2d21a'); group(b, 'redar', x + k * 1.5, y, h + math.pi / 2)
    x, y, h = on_road(idx_near(68, 9), RHW - 1.3)
    b = snap(); race_car('#2aa0c8', '#f2f2ee'); e = group(b, 'razbit', x, y, h + 0.55)
    smoke(x, y, T(x, y) + 1.2, 0.5, 8, (0.6, 0.2), False)
    x, y, h = on_road(idx_near(78, 10), RHW - 3.2)
    b = snap(); truck('#f2c230', 'vleka'); group(b, 'vlecna', x, y, h + 0.2)
    sky(colr='#9cc6ea', sun=(40, -20), sun_e=3.8)
    px, py, _ = ahead(sx, sy, sh, 17, 0, side=-8)
    return dict(cam=(px, py, ROAD[si][2] + 8), tgt=behind(sx, sy, sh, 24, 0.4), lens=26, pts={'sc': (sx, sy, ROAD[si][2] + 2.2)})

def m41():   # Dirkalni taksi · Nürburg
    global BASE, T
    BASE = lambda x, y: 14 * math.sin(x / 80) * math.cos(y / 65) + 0.06 * y + 40 * math.exp(-((x - 170) ** 2 + (y - 60) ** 2) / 3000)
    set_road([(-140, -50), (-60, -40), (-10, -30), (18, -12), (22, 8), (6, 24), (-24, 30), (-90, 44), (-170, 60)], 4.5, smooth=6)
    i0, i1 = idx_near(6, -27), idx_near(-12, 29)
    T0 = T
    def depth(d): return 2.0 * sst(RHW - 0.2, RHW + 4.6, d) * (1 - sst(RHW + 6.5, RHW + 11, d))
    def T_bank(x, y):
        (px, py, _), i, d = KD.find((x, y, 0))
        z = T0(x, y)
        if i0 <= i <= i1:
            h = heading_at(i); hx, hy = -math.sin(h), math.cos(h)
            if hx * (y - py) - hy * (x - px) > 0: z -= depth(d)
        return z
    T = T_bank
    def colf(x, y, z, sl):
        c = mix(lin('#4f6a35'), lin('#5f7a3f'), noise(x, y))
        return mix(c, lin('#6f6a5a'), sst(0.35, 0.55, sl))
    terrain(460, 260, colf, 0, 20); road('asfalt', lines=True)
    cm = mat('beton_k', '#b9b6af', 0.75); cd = mat('beton_kt', '#8f8c86', 0.8); bm = {0: bmesh.new(), 1: bmesh.new()}
    for i in range(i0, i1):
        cols = []
        for (ii, ) in ((i,), (i + 1,)):
            x, y, z = ROAD[ii]; h = heading_at(ii); nx, ny = -math.cos(h), -math.sin(h)
            cols.append([(x + nx * o, y + ny * o, z + 0.03 - depth(o)) for o in [RHW - 0.1 + k * 0.95 for k in range(6)]])
        b_ = bm[1 if (i // 3) % 5 == 0 else 0]
        for k in range(5):
            v = [b_.verts.new(p) for p in (cols[0][k], cols[0][k + 1], cols[1][k + 1], cols[1][k])]; b_.faces.new(v)
    mk('karusel', bm[0], cm); mk('karusel_s', bm[1], cd)
    castle(170, 60, 1.2)
    town(110, 240, -20, 40, 15, 0.6, '#efe9df', '#3f3a3a')
    cx, cy = 2, 0
    keep = lambda x, y: not near_road(x, y, 6) and math.hypot(x - cx, y - cy) > 16 and not (abs(x - 170) < 40 and abs(y - 60) < 40) and not (100 < x < 250 and -30 < y < 50)
    forest(420, -230, 230, -110, 150, 0, kind='iglavec', keep=keep); forest(220, -230, 230, -110, 150, 0, kind='listavec', keep=keep)
    ia = (i0 + i1) // 2; x, y, h = on_road(ia, -(RHW + 2.6)); z = T(x, y)
    b = snap(); car('#2a2d33', lights=True, sporty=True)
    box('taksi_znak', -0.3, 0.3, -0.35, -0.05, 1.27, 1.45, mat('taksi_y', '#f2c230', 0.4, 0.0, 2))
    rbox('roka_t', (0.09, 0.09, 0.55), (0.95, -0.5, 1.25), mat('koza', '#e2b493', 0.7), rot=(0, 0.5, 0))
    e = group(b, 'taksi', x, y, h, z=z, tilt=False); e.rotation_euler = (0, -0.41, h); headlights(e, 2.3, 0.7, 700)
    for (dd, sd, c) in ((24, 1.4, '#c4161c'), (-30, 1.6, '#f2f2ee')):
        xx, yy, hh = on_road(min(len(ROAD) - 1, max(0, ia + dd)), sd)
        b = snap(); car(c, sporty=True); group(b, 'turist', xx, yy, hh)
    sky(colr='#a9c0d6', sun=(48, 210), sun_e=3.2)
    vx, vy = cx - x, cy - y; L = math.hypot(vx, vy); vx, vy = vx / L, vy / L
    return dict(cam=(x + vx * 11, y + vy * 11, z + 5.5), tgt=(x - vx * 6, y - vy * 6, z + 1.5), lens=26)

def m42():   # Ogledalo za zvezde · Palomar Mountain (noč)
    global BASE
    def base(x, y):
        z = 0.40 * y + 5 * math.sin(x / 30) * math.cos(y / 40) + 0.004 * x * x
        return z + (60 - z) * sst(115, 150, y)
    BASE = base
    set_road([(-80, -70), (-10, -60), (40, -48), (-30, -30), (35, -10), (-30, 10), (30, 30), (-20, 50), (15, 75), (0, 110), (0, 150)], 3.0, smooth=6)
    terrain(400, 230, pal('#4a5a32', '#56663a', '#6f6a5e', (0.4, 0.6)), 0, 60); road('asfalt', lines=False)
    stn = mat('kamen_z', '#8a8578', 0.9)
    rail(-(RHW + 0.6), -0.2, 0.7, stn, name='zidek'); rail(RHW + 0.6, -0.2, 0.7, stn, name='zidek')
    forest(260, -200, 200, -170, 170, 6, kind='iglavec', keep=lambda x, y: y > 20 and not (-40 < x < 40 and 150 < y < 200))
    k = 0
    while k < 150:
        x, y = random.uniform(-200, 200), random.uniform(-170, 40)
        if near_road(x, y, 6): continue
        oak(x, y, random.uniform(0.7, 1.1)); k += 1
    b = snap(); observatory(); group(b, 'zvezdarna', 0, 178, 0, tilt=False)
    i = idx_near(8, 33); x, y, h = on_road(i, 1.3)
    b = snap(); flatbed_crate(); e = group(b, 'tovornjak_o', x, y, h)
    point_light(x, y, T(x, y) + 2.5, 120, (1.0, 0.15, 0.1), 1.0)
    ex, ey, eh = on_road(min(len(ROAD) - 1, i + 22), 1.3)
    b = snap(); car('#f2f2ee'); box('amber_e', -0.5, 0.5, -0.3, -0.1, 1.45, 1.6, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)); group(b, 'spremstvo', ex, ey, eh)
    point_light(ex, ey, T(ex, ey) + 2.2, 150, (1.0, 0.6, 0.15), 0.4)
    stars(1200); milky_way()
    lm = mat('mesto_luc', '#ffc979', 0.5, 0.0, 30); bm = bmesh.new()
    for k in range(1400):
        xx, yy = random.uniform(-1400, 1400), random.uniform(-1500, -700)
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((xx, yy, -60), (0, 0, 0), (1.6, 1.6, 0.6)))
    mk('mesto', bm, lm); box('mesto_tla', -1600, 1600, -1700, -600, -66, -60.5, mat('mesto_t', '#0e1014', 0.9))
    no_shadow(box('sij_mesta', -1600, 1600, -760, -740, -60, 30, tm('sij_m', '#ff9a4a', 0.12, emit=1.5, rough=1.0)))
    sky(colr='#13203a', strength=0.75, sun=(58, 200), sun_e=1.6, sun_c=(0.62, 0.72, 1.0))
    zc = T(x, y)
    return dict(cam=(x + 16, y - 36, zc + 16), tgt=(x - 2, y + 70, zc + 10), lens=20, pts={'kupola': (0, 178, T(0, 178) + 30), 'tovornjak': (x, y, zc + 4.5)})

def m43():   # Vroče zavore · Rio do Rastro
    global BASE
    BASE = lambda x, y: 0.85 * y + 4 * math.sin(x / 25) * math.cos(y / 30) + 0.003 * x * x
    pts = [(-120, -82), (-50, -74)] + [((45 if k % 2 == 0 else -45), -60 + 13 * k) for k in range(11)] + [(10, 92), (0, 110)]
    set_road(pts, 3.0, smooth=5)
    terrain(360, 260, pal('#3f7a35', '#4f8a3f', '#6f6a5a', (0.45, 0.65)), 0, 10); road('asfalt')
    k = 0
    while k < 480:
        x, y = random.uniform(-180, 180), random.uniform(-120, 140)
        if near_road(x, y, 4.5): continue
        rf_tree(x, y, random.uniform(0.8, 1.3)); k += 1
    k = 0
    while k < 24:
        x, y = random.uniform(-170, 170), random.uniform(-110, 140)
        if near_road(x, y, 6): continue
        araucaria(x, y, random.uniform(0.9, 1.2)); k += 1
    fm = tm('megla_r', '#f4f6f8', 0.2, emit=0.3, rough=1.0)
    for k in range(8):
        x, y = random.uniform(-120, 120), random.uniform(-90, 0)
        no_shadow(sph('megla', 1.0, (x, y, BASE(x, y) + random.uniform(6, 14)), fm, scl=(random.uniform(30, 50), random.uniform(8, 14), random.uniform(3, 5)), sub=2))
    ka = 4; ax, ay = 45 if ka % 2 == 0 else -45, -60 + 13 * ka
    ia = idx_near(ax, ay); h = heading_at(ia)
    gm = mat('gramoz_i', '#cdb894', 0.95); bm = bmesh.new(); prev = None
    dx, dy = (0.9, 0.44) if ax > 0 else (-0.9, 0.44)
    sx, sy = ax + (4 if ax > 0 else -4), ay + 1
    for s in range(0, 61, 2):
        px, py = sx + dx * s, sy + dy * s; nx, ny = -dy, dx
        a = bm.verts.new((px + nx * 2.6, py + ny * 2.6, T(px + nx * 2.6, py + ny * 2.6) + 0.3)); b_ = bm.verts.new((px - nx * 2.6, py - ny * 2.6, T(px - nx * 2.6, py - ny * 2.6) + 0.3))
        if prev: bm.faces.new((prev[0], prev[1], b_, a))
        prev = (a, b_)
    mk('izletni_pas', bm, gm)
    rw = [mat('kol_r', '#d6332a', 0.5), mat('kol_b', '#f2f2ee', 0.5)]
    for s in range(0, 61, 5):
        for sd in (-1, 1):
            px, py = sx + dx * s - dy * 3.1 * sd, sy + dy * s + dx * 3.1 * sd
            box('kol_i', px - 0.1, px + 0.1, py - 0.1, py + 0.1, T(px, py), T(px, py) + 1.1, rw[(s // 5) % 2])
    bx_, by_ = sx - dx * 3 + dy * 4.5, sy - dy * 3 - dx * 4.5
    rcyl('drog_t', 0.06, 2.6, (bx_, by_, T(bx_, by_) + 1.3), kit.DARK, n=6); box('tabla_i', bx_ - 1.0, bx_ + 1.0, by_ - 0.05, by_ + 0.05, T(bx_, by_) + 2.2, T(bx_, by_) + 3.2, mat('tabla_z', '#2f7d4f', 0.5))
    ti = idx_near(-5, -60 + 13 * 6 + 6.5); x, y, h = on_road(ti, -1.4)
    b = snap(); hot_truck(); e = group(b, 'tovornjak_z', x, y, h + math.pi); headlights(e, 3.3, 0.9, 900)
    for yy in (2.2, -3.2):
        for sd in (-1, 1):
            wx, wy, _ = ahead(x, y, h + math.pi, yy, 0, side=sd * 1.36)
            smoke(wx, wy, T(wx, wy) + 0.8, 0.35, 6, (random.uniform(-0.5, 0.5), 0.4), False)
            point_light(wx, wy, T(wx, wy) + 0.6, 60, (1.0, 0.4, 0.1), 0.2)
    town(-220, 60, -220, -150, 16, 0.5, '#efe9df', '#a84a32')
    sky(colr='#b4cde6', strength=1.0, sun=(42, -40), sun_e=3.4)
    zc = T(-20, 70) + 30
    return dict(cam=(-20, 70, zc), tgt=(20, 0, 0), lens=24, pts={'rampa': (sx + dx * 30, sy + dy * 30, T(sx + dx * 30, sy + dy * 30) + 1.5), 'tovornjak': (x, y, T(x, y) + 4.5)})

def m44():   # Skalni podor · Chapman's Peak
    global BASE
    def base(x, y):
        f = 1 - 0.88 * sst(190, 320, y)
        z = (150 * sst(-70, 70, x) + 40 * sst(60, 160, x) + 5 * math.sin(y / 30) * math.cos(x / 25)) * f
        z += 4 * sst(-60, -20, x) * (1 - f)
        z -= 14 * (1 - sst(-90, -50, x))
        return z + 270 * math.exp(-((x + 250) ** 2 + (y - 470) ** 2) / 7000)
    BASE = base
    set_road([(6, -200), (0, -110), (8, -30), (-2, 50), (6, 130), (-6, 210), (-30, 270)], 3.2)
    def colf(x, y, z, sl):
        c = mix(lin('#6f7a4a'), lin('#7f8a55'), noise(x, y))
        c = mix(c, lin('#b07a52'), sst(0.28, 0.45, sl))
        return mix(c, lin('#e8d9b0'), sst(6, 2, z) * sst(160, 230, y))
    terrain(520, 240, colf, 0, 100); road('asfalt', lines=True)
    box('morje', -900, 900, -900, 1000, -30, 0.0, tm('morje_c', '#2a7f9a', 0.9, rough=0.08))
    shore_foam(-150, 80, -160, 360, 1.6, 0.6, 0.6, 0.6)
    stn = mat('kamen_p', '#9a8a78', 0.9)
    rail(RHW + 0.4, -0.2, 0.8, stn, name='parapet'); ribbon('parapet_v', RHW + 0.25, RHW + 0.55, 0.8, stn)
    fi0, fi1 = idx_near(4, -10), idx_near(2, 110)
    rail(-(RHW + 3.5), 0.0, 4.5, tm('mreza_p', '#8a9096', 0.3, rough=0.6), fi0, fi1, name='lovilna')
    fb = bmesh.new()
    for i in range(fi0, fi1, 5):
        x, y, h = on_road(i, RHW + 3.5); tube(fb, (x, y, ROAD[i][2]), (x, y, ROAD[i][2] + 4.6), 0.07, 5)
    mk('stebri_l', fb, kit.DARK)
    bm = bmesh.new()
    for (dx, dy, r) in ((-1.0, 48, 2.2), (1.5, 52, 1.6), (-2.0, 55, 1.2), (0.5, 58, 1.8), (2.4, 46, 0.9), (-2.6, 51, 0.8), (1.0, 44, 0.7), (0, 62, 1.0), (-1.5, 60, 0.6)):
        x, y, h = on_road(idx_near(dx, dy), dx * 0.5)
        boulder(bm, x, y, ROAD[idx_near(dx, dy)][2] + r * 0.55, r)
    mk('podor', bm, mat('peščenjak', '#b07a52', 0.9))
    li = idx_near(0, 38); x, y, h = on_road(li, 0.8)
    b = snap(); wheel_loader('#f2c230'); e = group(b, 'nakladalnik', x, y, h)
    dx_, dy_, dh = on_road(idx_near(4, 18), 0.6)
    b = snap(); dump_truck('#e9e6df'); group(b, 'kiper', dx_, dy_, dh)
    for s in range(6):
        cx_, cy_, ch = on_road(idx_near(6, 4) + s * 3, -1.0 + s * 0.4); cone_traffic(cx_, cy_)
    sx_, sy_, sh_ = on_road(idx_near(6, 2), RHW + 1.2); stop_sign(sx_, sy_, sh_)
    for (dx, dy) in ((3.5, 30), (-2.5, 33)):
        x2, y2, h2 = on_road(idx_near(dx, dy), dx * 0.6)
        b = snap(); person('#f07a12', refl=True); group(b, 'delavec', x2, y2, h2 + random.uniform(-1, 1))
    for (px, py) in ((12, 64), (18, 57), (9, 71)):
        rock_drop((px, py, BASE(px, py) + 7), (-0.55, 0.1, -0.83), random.uniform(0.8, 1.4), 9)
    town(-110, 70, 270, 345, 15, 0.6, '#f2efe8', '#7a4a3a')
    for k in range(9):
        b = snap(); yacht(random.uniform(8, 13)); group(b, 'coln', random.uniform(-150, -40), random.uniform(330, 400), random.uniform(0, 6), z=0.0, tilt=False)
    bm = bmesh.new(); gb = bmesh.new()
    for k in range(260):
        x2, y2 = random.uniform(-60, 200), random.uniform(-150, 260)
        if near_road(x2, y2, 6) or BASE(x2, y2) < 2: continue
        if k % 3 == 0: boulder(bm, x2, y2, BASE(x2, y2), random.uniform(1.0, 3.0))
        else: bmesh.ops.create_icosphere(gb, subdivisions=1, radius=1.0, matrix=MT((x2, y2, BASE(x2, y2) + 0.3), (0, 0, random.uniform(0, 3)), (random.uniform(1.2, 2.6), random.uniform(1.0, 2.0), 0.8)))
    mk('skale_p', bm, mat('pescenjak_t', '#8f5f40', 0.9)); mk('fynbos', gb, mat('fynbos', '#5f6a40', 0.9), smooth=True)
    sky(colr='#9fc8ec', sun=(50, -90), sun_e=3.8)
    zl = ROAD[li][2]
    return dict(cam=(-34, 8, zl + 16), tgt=(2, 56, zl + 5), lens=26, pts={'pada': (12, 64, BASE(12, 64) + 7), 'nakladalnik': (x, y, zl + 5)})

def m45():   # Turistični vlakec · Monte Carlo
    global BASE
    def base(x, y):
        k = sst(-55, -40, y)
        return (0.28 * (y + 45) + 2 * math.sin(x / 30)) * k - 4 * (1 - k)
    BASE = base
    set_road([(-140, -16), (-60, -18), (0, -16), (26, -8), (32, 4), (20, 14), (-20, 18), (-80, 24), (-150, 30)], 4.0, smooth=4)
    def colf(x, y, z, sl):
        return lin('#c9c2b4') if z > 0.4 else lin('#bfb6a4')
    terrain(420, 220, colf, 0, -10); road('asfalt', lines=True)
    box('morje', -500, 500, -500, -46, -6, 0.0, tm('morje_m', '#1f6f9a', 0.88, rough=0.06))
    qm = mat('pomol_m', '#d9d2c4', 0.8)
    box('obala', -300, 300, -50, -44, -1, 1.2, qm); box('valolom', 60, 72, -150, -50, -1, 1.6, qm); box('valolom2', -120, 72, -152, -142, -1, 1.6, qm)
    random.seed(45)
    wc = ['#e9c58f', '#f0c9c0', '#efe3c8', '#e8cfa8', '#f2e6d0', '#e9b8a0']
    x = -150
    while x < 70:
        w = random.uniform(14, 20); monaco_block(x + w / 2, 42 + random.uniform(-1, 2), 0, w, 12, random.randint(4, 6), random.choice(wc)); x += w + 2
    x = -150
    while x < 10:
        w = random.uniform(14, 20); monaco_block(x + w / 2, -32, 0, w, 10, random.randint(3, 5), random.choice(wc)); x += w + 2
    gm = mat('vrt', '#5f8a3f', 0.9); fl = [mat('cvet' + c, c, 0.7) for c in ('#e8506a', '#f2c230', '#f2f2ee', '#9a4ac4')]
    sph('vrt_otok', 1.0, (10, 1, T(10, 1) - 0.2), gm, scl=(10, 6, 0.6), sub=2)
    for k in range(40):
        a = random.uniform(0, 6.28); r = math.sqrt(random.random())
        sph('cvet', 0.35, (10 + 8 * r * math.cos(a), 1 + 4.5 * r * math.sin(a), T(10, 1) + 0.35), fl[k % 4], sub=1)
    for (px, py) in ((6, 2), (14, 0)): palm(px, py, 1.0)
    for i in range(0, len(ROAD), 16):
        for s in (-1, 1):
            if random.random() < 0.6:
                x, y, h = on_road(i, s * (RHW + 1.8))
                if math.hypot(x - 10, y - 1) > 12: palm(x, y, random.uniform(0.8, 1.0))
    for k in range(10):
        b = snap(); yacht(random.uniform(10, 22)); group(b, 'jahta', random.uniform(-100, 50), random.uniform(-130, -62), math.pi / 2 + random.uniform(-0.2, 0.2), z=0.0, tilt=False)
    iL = idx_near(31, 2)
    x, y, h = on_road(iL, 1.4)
    b = snap(); road_train_loco(); group(b, 'lokomotiva', x, y, h)
    for n, off in enumerate((7, 13, 19)):
        xi, yi, hi = on_road(max(0, iL - off), 1.4 - (1.1 if n == 2 else 0.0))
        b = snap(); road_train_wagon(n); group(b, 'vagon', xi, yi, hi + (0.25 if n == 2 else 0.0))
    for k in range(14):
        i = random.randrange(0, len(ROAD)); s = random.choice((-1, 1)); x2, y2, h2 = on_road(i, s * (RHW + 1.2))
        if math.hypot(x2 - 10, y2 - 1) < 12: continue
        b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2f2ee', '#f2c230', '#1d1d1f'])); group(b, 'pesec', x2, y2, h2 + random.choice((0, math.pi)))
    for (i, s, c) in ((idx_near(-60, -18), 1.4, '#c4161c'), (idx_near(-40, 18), -1.4, '#f2f2ee')):
        x2, y2, h2 = on_road(i, s); b = snap(); car(c, sporty=True); group(b, 'avto', x2, y2, h2 + (math.pi if s < 0 else 0))
    sky(colr='#8fc3ef', sun=(45, -30), sun_e=3.8, sun_c=(1.0, 0.95, 0.85))
    return dict(cam=(72, -6, 32), tgt=(18, 6, 10), lens=28, pts={'vlak': (x, y, T(x, y) + 3)})

R = {36: m36, 37: m37, 38: m38, 39: m39, 40: m40, 41: m41, 42: m42, 43: m43, 44: m44, 45: m45}[M]()
render3(R)
from bpy_extras.object_utils import world_to_camera_view
SC.camera = bpy.data.objects['cam']
pts = {}
for k, p in R.get('pts', {}).items():
    v = world_to_camera_view(SC, SC.camera, Vector(p)); pts[k] = (v.x, 1 - v.y)
json.dump(pts, open(os.path.join(OUT, 'm%02d.json' % M), 'w'))
print('MISIJA', M, 'ok', len(bpy.data.objects), 'objektov')
