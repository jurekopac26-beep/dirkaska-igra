# Makete misij 26–35 v Blenderju (samo slike). Uporaba: bl/bin/python gas/miss3.py <misija 26-35> <izhod> [hitro]
# Gradniki so iz miss.py in miss2.py; tu so novi gradniki in scene.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'miss2.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('# ---------------------------------------------------------------- misije 11–25')], os.path.join(_here, 'miss2.py'), 'exec'))

# ---------------------------------------------------------------- vreme in svetloba
def snowfall(cx, cy, w, n=500, zmax=30, r=0.07):
    bm = bmesh.new()
    for k in range(n):
        x, y = cx + random.uniform(-w, w), cy + random.uniform(-w, w)
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=r, matrix=MT((x, y, T(x, y) + random.uniform(1, zmax))))
    no_shadow(mk('sneg_pada', bm, mat('snezinka', '#ffffff', 0.5, 0.0, 0.6)))

def rain(cx, cy, w, n=600, zmax=25, tilt=0.35, avoid=None):
    bm = bmesh.new()
    for k in range(n):
        x, y = cx + random.uniform(-w, w), cy + random.uniform(-w, w)
        z = T(x, y) + random.uniform(1, zmax)
        if avoid and (Vector((x, y, z)) - Vector(avoid[0])).length < avoid[1]: continue
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, z), (0, tilt, 0), (0.014, 0.014, 1.2)))
    no_shadow(mk('dez', bm, tm('kaplja_d', '#cfe0ee', 0.2, emit=0.12)))

def foam_seg(x0, y0, x1, y1, z=0.0, w=1.2, alpha=0.55, colr='#ffffff'):
    """pena vzdolž poljubne daljice"""
    m = tm('pena_s' + colr, colr, alpha, rough=0.6); bm = bmesh.new()
    L = math.hypot(x1 - x0, y1 - y0); a = math.atan2(y1 - y0, x1 - x0); t = 0.0
    while t < L:
        q = random.gauss(0, 0.5)
        x = x0 + (x1 - x0) * t / L - math.sin(a) * q; y = y0 + (y1 - y0) * t / L + math.cos(a) * q
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y, z), (0, 0, a), (random.uniform(1.5, 3.2), w, 0.25)))
        t += random.uniform(1.4, 2.8)
    no_shadow(mk('pena', bm, m, smooth=True))

def behind(x, y, h, back, up, side=0.0, zref=None):
    """točka za vozilom: back metrov nazaj, side v desno, up nad cesto"""
    fx, fy = -math.sin(h), math.cos(h)
    px, py = x - fx * back + fy * side, y - fy * back - fx * side
    return (px, py, (T(x, y) if zref is None else zref) + up)

def ahead(x, y, h, d, up=0.0, side=0.0):
    fx, fy = -math.sin(h), math.cos(h)
    px, py = x + fx * d + fy * side, y + fy * d - fx * side
    return (px, py, T(px, py) + up)

def lightning(p0, p1, segs=9):
    m = mat('blisk', '#e8f0ff', 0.3, 0.0, 60)
    a = Vector(p0); b = Vector(p1); prev = a
    for k in range(1, segs + 1):
        t = k / segs; q = a.lerp(b, t) + (Vector((random.gauss(0, 6), random.gauss(0, 6), 0)) if k < segs else Vector((0, 0, 0)))
        d = q - prev
        no_shadow(rcyl('blisk', 0.25, d.length, tuple((prev + q) / 2), m, rot=d.to_track_quat('Z', 'Y').to_euler(), n=5))
        prev = q
    point_light(p1[0], p1[1], p1[2] + 20, 4e6, (0.8, 0.85, 1.0), 10)

def lamp_post(x, y, colr=(1.0, 0.65, 0.3), energy=900, hgt=6.0):
    z = T(x, y); gm = mat('drog_l2', '#3a3d42', 0.5, 0.4)
    rcyl('drog', 0.08, hgt, (x, y, z + hgt / 2), gm, n=8)
    sph('svetilka', 0.25, (x, y, z + hgt), mat('svet_luc', '#ffc070', 0.3, 0.0, 12), sub=1)
    point_light(x, y, z + hgt - 0.3, energy, colr, 0.3)

def string_lights(p0, p1, n=14, cols=('#ff3a2a', '#ffd23a', '#3ad66a', '#3a8aff')):
    a = Vector(p0); b = Vector(p1); bm = {c: bmesh.new() for c in cols}
    for k in range(n + 1):
        q = a.lerp(b, k / n); q.z -= 0.25 * math.sin(math.pi * k / n)
        bmesh.ops.create_icosphere(bm[cols[k % len(cols)]], subdivisions=0, radius=0.09, matrix=MT(tuple(q)))
    for c, b_ in bm.items(): no_shadow(mk('lucke', b_, mat('lucka' + c, c, 0.3, 0.0, 14)))

# ---------------------------------------------------------------- vozila in predmeti
def ev_car(colr='#f2f2ee'):
    car(colr, lights=True)
    stripe(0.9, -2.0, 2.0, 0.5, 0.6, mat('ev_modra', '#1f8fd6', 0.4))
    box('maska_ev', -0.6, 0.6, 2.24, 2.27, 0.42, 0.58, mat('ev_crna', '#1d1d1f', 0.3))

def charger_station():
    gm = mat('postaja', '#e9e6df', 0.4); gn = mat('zelena_luc', '#3ad66a', 0.3, 0.0, 6)
    box('tla_p', -4.2, 4.2, -3.2, 3.2, 0, 0.06, mat('tla_postaje', '#6b6f75', 0.8))
    for (x, y) in ((-3.6, -2.6), (3.6, -2.6), (-3.6, 2.6), (3.6, 2.6)): box('steber', x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0, 4.2, gm)
    box('streha_p', -4.2, 4.2, -3.2, 3.2, 4.2, 4.5, gm, 0.05); box('streha_luc', -3.8, 3.8, -2.8, 2.8, 4.17, 4.2, gn)
    for x in (-1.3, 1.3):
        box('polnilnik', x - 0.3, x + 0.3, -0.2, 0.2, 0, 1.7, gm, 0.05); box('zaslon', x - 0.2, x + 0.2, -0.22, -0.2, 1.1, 1.5, gn)

def karst(x, y, r, h, seed=0):
    """kraški stolp: več nagnjenih kosov apnenca, zelenje na policah in vrhu"""
    rnd = random.Random(seed); z0 = BASE(x, y) - 8
    rm = mat('apnenec', '#8a8780', 0.92); gm = mat('gozd_k', '#3d6634', 0.9)
    br = bmesh.new(); bg = bmesh.new(); zc = z0; rr = r; k = 0; cx, cy = x, y
    while zc < z0 + h:
        hh = rnd.uniform(0.14, 0.22) * h; r2 = rr * rnd.uniform(0.82, 0.96)
        bmesh.ops.create_cone(br, cap_ends=True, segments=11, radius1=rr, radius2=r2, depth=hh, matrix=MT((cx, cy, zc + hh / 2), (rnd.gauss(0, 0.03), rnd.gauss(0, 0.03), rnd.uniform(0, 6))))
        for q in range(2):
            a = rnd.uniform(0, 6.28)
            bmesh.ops.create_icosphere(bg, subdivisions=1, radius=1.0, matrix=MT((cx + r2 * 0.8 * math.cos(a), cy + r2 * 0.8 * math.sin(a), zc + hh * rnd.uniform(0.6, 1.0)), (0, 0, 0), (r2 * 0.55, r2 * 0.55, r2 * 0.32)))
        zc += hh; rr = r2; cx += rnd.gauss(0, r * 0.05); cy += rnd.gauss(0, r * 0.05); k += 1
    bmesh.ops.create_icosphere(bg, subdivisions=2, radius=1.0, matrix=MT((cx, cy, zc), (0, 0, 0), (rr * 1.1, rr * 1.1, rr * 0.55)))
    mk('stolp', br, rm); mk('zelenje', bg, gm, smooth=True)

def boat():
    wh = mat('coln_bel', '#f2f2ee', 0.35); bl = mat('coln_moder', '#2f6fb0', 0.4)
    hexa('trup', [(-0.7, -2.6, 0.0), (0.7, -2.6, 0.0), (0.15, 2.4, 0.15), (-0.15, 2.4, 0.15),
                  (-1.05, -2.6, 0.95), (1.05, -2.6, 0.95), (0.45, 2.8, 1.05), (-0.45, 2.8, 1.05)], wh, 0.06)
    box('rob_c', -1.07, 1.07, -2.6, 1.6, 0.6, 0.75, bl)
    box('konzola', -0.4, 0.4, -0.4, 0.4, 0.95, 1.5, wh, 0.05); rbox('vetrobran_c', (0.8, 0.04, 0.35), (0, 0.42, 1.65), kit.GLASS, rot=(-0.3, 0, 0))
    box('motor', -0.25, 0.25, -3.05, -2.6, 0.3, 1.45, kit.DARK, 0.05)

def boat_trailer():
    fm = mat('prik_okvir', '#9aa0a6', 0.4, 0.6)
    boxes('prik_okvir', [(-0.8, -0.7, -3.2, 2.6, 0.45, 0.55), (0.7, 0.8, -3.2, 2.6, 0.45, 0.55), (-0.05, 0.05, 2.6, 4.2, 0.45, 0.55), (-0.8, 0.8, -1.0, -0.9, 0.45, 0.55)], fm)
    for s in (-1, 1): cyl('kolo_pr', 0.33, 0.22, (s * 0.95, -1.0, 0.33), kit.RUB, 'X', 14)
    b = snap(); boat(); group(b, 'coln', 0, -0.4, 0, z=0.55, tilt=False)

def lighthouse():
    wm = mat('svetilnik_b', '#f2f2ee', 0.4); rm = mat('svetilnik_r', '#c4161c', 0.4); bk = mat('svetilnik_c', '#1d1d1f', 0.4)
    rcyl('stolp_s', 2.2, 16, (0, 0, 8), wm, r2=1.6, n=20)
    rcyl('balkon', 2.3, 0.3, (0, 0, 16.2), bk, n=20)
    rcyl('lanterna', 1.3, 2.4, (0, 0, 17.5), mat('lanterna_t', '#3a3020', 0.2, 0.0, 0.3), n=16)
    sph('kupola_s', 1.4, (0, 0, 18.7), rm, scl=(1, 1, 0.7))
    box('hisica', -3, 3, -6.5, -2.0, 0, 3.2, wm); hexa('streha_h', [(-3.3, -6.8, 3.2), (3.3, -6.8, 3.2), (3.3, -1.7, 3.2), (-3.3, -1.7, 3.2),
                                                                   (-3.3, -4.25, 4.8), (3.3, -4.25, 4.8), (3.3, -4.25, 4.8), (-3.3, -4.25, 4.8)], rm)

def cargo_ship():
    hm = mat('ladja_trup', '#2a3d5a', 0.5); wh = mat('ladja_bel', '#e9e6df', 0.5); lt = mat('ladja_luc', '#ffd890', 0.3, 0.0, 10)
    hexa('trup_l', [(-10, -55, -6), (10, -55, -6), (10, 45, -6), (-10, 45, -6), (-11, -55, 6), (11, -55, 6), (11, 45, 6), (-11, 45, 6)], hm)
    hexa('premec_l', [(-10, 45, -6), (10, 45, -6), (0.5, 60, -6), (-0.5, 60, -6), (-11, 45, 6), (11, 45, 6), (0.5, 64, 8), (-0.5, 64, 8)], hm)
    cols = ['#b5432f', '#2f6fb0', '#e8a21a', '#3a8a4a', '#8a8f96']
    for i in range(7):
        for j in range(2):
            box('kontejner', -9 + j * 9.2, -0.2 + j * 9.2, -30 + i * 9.5, -21.5 + i * 9.5, 6, 6 + random.randint(1, 3) * 2.6, mat('kont' + cols[(i + j) % 5], cols[(i + j) % 5], 0.6))
    box('most_l', -9, 9, -52, -40, 6, 20, wh)
    boxes('okna_l', [(-9.05, 9.05, -40.05, -39.95, z, z + 1.0) for z in (9, 12, 15, 18)], lt)
    point_light(0, 62, 10, 3000, (1, 0.9, 0.7), 1); point_light(0, -46, 22, 3000, (1, 0.9, 0.7), 1)

def chalet(x, y, h, w=9, d=11, hh=6.0, wall='#efe6d4', wood='#7a5234', lit=3, xmas=True):
    b = snap()
    wm = mat('zid_c' + wall, wall, 0.8); wd = mat('les_c' + wood, wood, 0.85); sn = mat('sneg_streha', '#f4f7fa', 0.6)
    box('pritlicje', -w / 2, w / 2, -d / 2, d / 2, 0, hh * 0.5, wm)
    box('nadstropje', -w / 2, w / 2, -d / 2, d / 2, hh * 0.5, hh, wd)
    P = [(-w / 2 - 1.0, -d / 2 - 1.0, hh), (w / 2 + 1.0, -d / 2 - 1.0, hh), (w / 2 + 1.0, d / 2 + 1.0, hh), (-w / 2 - 1.0, d / 2 + 1.0, hh),
         (-w / 2 - 1.0, -0.05, hh + w * 0.32), (w / 2 + 1.0, -0.05, hh + w * 0.32), (w / 2 + 1.0, 0.05, hh + w * 0.32), (-w / 2 - 1.0, 0.05, hh + w * 0.32)]
    hexa('streha_c', P, wd); hexa('sneg_s', [(p[0], p[1], p[2] + 0.35) for p in P], sn)
    box('dimnik_c', w / 4 - 0.5, w / 4 + 0.5, 0.6, 1.6, hh, hh + w * 0.32 + 1.5, wm)
    g = mat('okno_lit' + str(lit), '#ffcf7a', 0.3, 0.0, lit)
    lst = []
    for yy in (-d / 4, d / 4):
        for zz in (1.0, hh * 0.5 + 0.8):
            lst += [(w / 2, w / 2 + 0.04, yy - 0.7, yy + 0.7, zz, zz + 1.3), (-w / 2 - 0.04, -w / 2, yy - 0.7, yy + 0.7, zz, zz + 1.3)]
    for xx in (-w / 4, w / 4): lst.append((xx - 0.7, xx + 0.7, -d / 2 - 0.04, -d / 2, hh * 0.5 + 0.8, hh * 0.5 + 2.1))
    boxes('okna_c', lst, g)
    box('balkon_c', -w / 2 + 0.5, w / 2 - 0.5, -d / 2 - 1.2, -d / 2, hh * 0.5, hh * 0.5 + 0.12, wd)
    if xmas: string_lights((-w / 2 - 1.0, -d / 2 - 1.05, hh - 0.1), (w / 2 + 1.0, -d / 2 - 1.05, hh - 0.1), 18)
    return group(b, 'koca', x, y, h, tilt=False)

def xmas_tree(x, y, s=1.0):
    b = snap(); gm = mat('jelka', '#244a2a', 0.9)
    for (r, hh, z) in ((2.6, 3.6, 2.2), (2.0, 3.0, 4.0), (1.4, 2.6, 5.7), (0.8, 2.0, 7.2)):
        rcyl('jelka', r, hh, (0, 0, z), gm, r2=0.1, n=10)
    sph('zvezda', 0.45, (0, 0, 8.4), mat('zvezda_z', '#ffd23a', 0.3, 0.0, 20), sub=1)
    cols = ['#ff3a2a', '#ffd23a', '#3a8aff', '#ffffff']
    for k in range(40):
        a = random.uniform(0, 6.28); z = random.uniform(1.0, 7.4); r = 2.6 * (1 - (z - 0.8) / 8.2) + 0.1
        sph('kroglica', 0.12, (r * math.cos(a), r * math.sin(a), z), mat('krog' + cols[k % 4], cols[k % 4], 0.3, 0.0, 10), sub=1)
    group(b, 'jelka', x, y, 0, tilt=False, scale=s)
    point_light(x, y, T(x, y) + 4, 1500, (1.0, 0.8, 0.5), 2)

def present(colr, rib):
    box('darilo', -0.3, 0.3, -0.3, 0.3, 0, 0.5, mat('dar' + colr, colr, 0.5))
    boxes('trak_d', [(-0.32, 0.32, -0.05, 0.05, -0.01, 0.52), (-0.05, 0.05, -0.32, 0.32, -0.01, 0.52)], mat('trak' + rib, rib, 0.4))

def snowcat(colr='#c4161c'):
    cm = mat('ratrak' + colr, colr, 0.4)
    for s in (-1, 1): box('gosenica', s * 1.55 - 0.45, s * 1.55 + 0.45, -2.4, 2.4, 0.0, 1.0, kit.DARK, 0.3)
    box('telo_r', -1.25, 1.25, -1.8, 1.6, 0.9, 2.0, cm, 0.1)
    box('kabina_r', -1.05, 1.05, -0.2, 1.6, 2.0, 3.3, kit.GLASS, 0.08); box('streha_r', -1.1, 1.1, -0.25, 1.65, 3.3, 3.45, cm)
    hexa('plug_r', [(-2.9, 2.6, 0.0), (2.9, 2.6, 0.0), (2.9, 3.2, 0.0), (-2.9, 3.2, 0.0), (-2.9, 2.5, 1.4), (2.9, 2.5, 1.4), (2.9, 3.4, 1.5), (-2.9, 3.4, 1.5)], cm, 0.05)
    box('freza', -2.9, 2.9, -3.6, -2.6, 0.0, 0.7, cm, 0.15); box('glajenje', -2.9, 2.9, -4.5, -3.6, 0.0, 0.08, mat('guma_r', '#2a2a2c', 0.8))
    rcyl('vitel', 0.5, 0.9, (0, -1.2, 2.45), kit.DARK, rot=(0, math.pi / 2, 0), n=14); rbox('roka_v', (0.2, 3.0, 0.2), (0, -0.4, 3.5), kit.DARK, rot=(0.45, 0, 0))
    box('luc_r', -1.0, 1.0, 1.3, 1.45, 3.45, 3.6, mat('luc_bela', '#fff6e0', 0.2, 0.0, 14))
    for s in (-1, 1): box('far_r', min(s * 0.6, s * 0.95), max(s * 0.6, s * 0.95), 1.6, 1.64, 1.6, 1.8, kit.HEAD)

def egg_crate():
    wd = mat('zaboj', '#a07848', 0.85); st = mat('slama', '#d9b85a', 0.95)
    boxes('zaboj', [(-0.8, 0.8, -0.8, -0.7, 0, 0.7), (-0.8, 0.8, 0.7, 0.8, 0, 0.7), (-0.8, -0.7, -0.8, 0.8, 0, 0.7), (0.7, 0.8, -0.8, 0.8, 0, 0.7), (-0.8, 0.8, -0.8, 0.8, 0, 0.08)], wd)
    for k in range(18): sph('slama', 0.18, (random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), 0.55), st, scl=(1.4, 1, 0.5), sub=1)
    sph('jajce', 0.55, (0, 0, 1.1), mat('jajce', '#e9dcc0', 0.6), scl=(0.95, 0.95, 1.3), sub=3)
    sk = mat('pega', '#9a7a5a', 0.7)
    for k in range(14):
        a = random.uniform(0, 6.28); e = random.uniform(-0.9, 0.9)
        sph('pega', 0.06, (0.53 * math.cos(a) * math.cos(e), 0.53 * math.sin(a) * math.cos(e), 1.1 + 0.7 * math.sin(e)), sk, sub=1)
    cr = mat('razpoka_j', '#3a2a1a', 0.6)
    for k in range(4): rbox('razpoka', (0.025, 0.02, 0.35), (0.5 * math.cos(k * 0.5 + 0.3), 0.5 * math.sin(k * 0.5 + 0.3), 1.25), cr, rot=(0.2 * k, 0.3, k * 0.5 + 0.3))
    rcyl('stojalo', 0.025, 1.6, (0.75, 0.75, 1.4), kit.DARK, n=6)
    rcyl('grelec', 0.05, 0.35, (0.4, 0.4, 2.1), mat('grelec', '#ff8a2a', 0.3, 0.0, 8), r2=0.3, rot=(0.6, -0.6, 0), n=10)

def monkey():
    fur = mat('opica', '#8a7a68', 0.95); face = mat('opica_obraz', '#d0646a', 0.8)
    sph('telo', 0.22, (0, 0, 0.35), fur, scl=(0.8, 1.0, 1.1), rot=(0.3, 0, 0))
    sph('glava', 0.13, (0, 0.12, 0.62), fur)
    sph('obraz', 0.08, (0, 0.21, 0.62), face, scl=(1, 0.5, 1))
    for s in (-1, 1):
        rbox('roka', (0.06, 0.06, 0.32), (s * 0.15, 0.12, 0.3), fur, rot=(0.4, 0, 0)); rbox('noga', (0.07, 0.07, 0.25), (s * 0.12, -0.05, 0.12), fur)
    rcyl('rep', 0.03, 0.18, (0, -0.22, 0.3), fur, rot=(1.2, 0, 0), n=6)

def maple(x, y, s=1.0):
    b = snap(); cols = ['#c8452a', '#e08a2a', '#d9b33a', '#b8352a']
    rcyl('deblo', 0.25, 4.0, (0, 0, 2.0), mat('deblo', '#4a3626', 0.9), n=8)
    c = random.choice(cols)
    for k in range(4): sph('krosnja_j', random.uniform(1.6, 2.3), (random.uniform(-1, 1), random.uniform(-1, 1), 4.6 + random.uniform(-0.6, 1.0)), mat('javor' + c, c, 0.9), sub=1)
    group(b, 'javor', x, y, random.uniform(0, 6), tilt=False, scale=s)

def torii():
    rd = mat('torii', '#c8321e', 0.5); bk = mat('torii_c', '#1d1d1f', 0.5)
    for s in (-1, 1): rcyl('steber_t', 0.3, 6.5, (s * 3.0, 0, 3.25), rd, n=12)
    box('greda_t', -3.6, 3.6, -0.3, 0.3, 4.9, 5.4, rd); hexa('kasagi', [(-4.4, -0.35, 6.3), (4.4, -0.35, 6.3), (4.4, 0.35, 6.3), (-4.4, 0.35, 6.3),
                                                                      (-4.7, -0.4, 6.8), (4.7, -0.4, 6.8), (4.7, 0.4, 6.8), (-4.7, 0.4, 6.8)], bk)

def kei_truck(colr='#f2f2ee'):
    m = mat('kei' + colr, colr, 0.35)
    kit.cab('kabina_k', 0.75, 0.6, 1.7, 0.45, 1.9, 0.12, m, 0.06); kit.windscreen(0.75, 1.7, 0.45, 1.9, 0.12, 1.15, 1.8, 0.07)
    box('keson_k', -0.75, 0.75, -1.6, 0.55, 0.55, 0.75, m, 0.03)
    boxes('stranice', [(-0.75, -0.7, -1.6, 0.55, 0.75, 1.05), (0.7, 0.75, -1.6, 0.55, 0.75, 1.05), (-0.75, 0.75, -1.65, -1.6, 0.75, 1.05)], m)
    om = mat('kaki', '#e8761a', 0.6); cm = mat('gajba', '#5a7a9a', 0.7)
    for (x, y) in ((-0.35, -1.1), (0.35, -1.1), (-0.35, -0.3), (0.35, -0.3)):
        box('gajba', x - 0.32, x + 0.32, y - 0.36, y + 0.36, 0.75, 1.05, cm)
        for k in range(5): sph('sadez', 0.09, (x + random.uniform(-0.2, 0.2), y + random.uniform(-0.25, 0.25), 1.1), om, sub=1)
    plain_lights(0.75, 1.72, 0.7)
    wheels([(1.1, False), (-1.0, False)], 0.27, 0.18, 0.6)

def snowblower():
    om = mat('freza_or', '#f07a12', 0.45)
    box('telo_f', -1.3, 1.3, -2.5, 2.0, 0.6, 2.4, om, 0.1); box('kabina_f', -1.0, 1.0, -0.6, 1.4, 2.4, 3.5, kit.GLASS, 0.05); box('streha_f', -1.05, 1.05, -0.65, 1.45, 3.5, 3.62, om)
    box('ohisje', -1.7, 1.7, 2.0, 3.3, 0.1, 1.5, om, 0.1); rcyl('polz', 0.6, 3.2, (0, 2.8, 0.75), kit.DARK, rot=(0, math.pi / 2, 0), n=12)
    rcyl('lijak1', 0.35, 2.4, (0.6, 2.1, 2.4), om, rot=(0, 0.35, 0), n=12); rcyl('lijak2', 0.35, 1.6, (1.3, 2.1, 3.7), om, rot=(0, 1.25, 0), n=12)
    box('luc_f', -0.9, 0.9, 0.3, 0.5, 3.62, 3.75, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9))
    wheels([(1.3, False), (-1.6, False)], 0.6, 0.45, 1.05)

def dump_truck(colr='#e9e6df'):
    cm = mat('kiper' + colr, colr, 0.4)
    c = kit.cab('kabina', 1.25, 1.0, 3.3, 0.78, 3.0, 0.28, cm, 0.08); kit.arch(c, 2.2, 0.5, 0.6, 1.25)
    kit.windscreen(1.25, 3.3, 0.78, 3.0, 0.28, 1.85, 2.88)
    box('sasija', -0.45, 0.45, -4.5, 3.2, 0.5, 0.85, kit.DARK)
    plain_lights(1.25, 3.34, 0.9)
    gm = mat('kiper_k', '#5b6066', 0.5, 0.4)
    boxes('kiper', [(-1.25, 1.25, -4.6, 0.8, 0.95, 1.05), (-1.25, -1.15, -4.6, 0.8, 1.05, 2.6), (1.15, 1.25, -4.6, 0.8, 1.05, 2.6), (-1.25, 1.25, 0.7, 0.8, 1.05, 2.9), (-1.25, 1.25, -4.6, -4.5, 1.05, 2.6)], gm)
    sph('sneg_kup', 1.0, (0, -1.9, 2.3), mat('sneg_k', '#eef2f6', 0.6), scl=(1.1, 2.4, 0.7))
    box('luc_osn', -0.7, 0.7, 2.6, 2.85, 3.0, 3.05, kit.BLACK); box('luc_a', -0.65, 0.65, 2.62, 2.83, 3.05, 3.15, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9), 0.03)
    wheels([(2.2, False), (-2.6, True), (-3.8, True)], 0.5, 0.34, 1.0)

def snow_arc(p0, p1, arc=3.0):
    sm = tm('sneg_curek', '#f4f7fa', 0.75, emit=0.4, rough=0.8)
    for i in range(40):
        t = i / 39; p = Vector(p0).lerp(Vector(p1), t); p.z += arc * 4 * t * (1 - t)
        for k in range(3):
            no_shadow(sph('sneg_c', random.uniform(0.12, 0.3) * (0.6 + t), tuple(p + Vector((random.gauss(0, 0.2), random.gauss(0, 0.2), random.gauss(0, 0.15)))), sm, sub=1))

def montreal_row(x0, x1, yfront, side):
    """vrstne hiše z zunanjimi stopnicami; side=+1 severno od ceste"""
    brick = [mat('opeka_m1', '#8f4f3c', 0.85), mat('opeka_m2', '#a8654a', 0.85), mat('opeka_m3', '#7a4636', 0.85)]
    ir = mat('zelezo', '#1d1d1f', 0.5, 0.5); g = mat('okno_m', '#ffcf7a', 0.3, 0.0, 3); out = -side
    x = x0; i = 0
    while x < x1 - 6:
        w = 7.0; ya, yb = (yfront, yfront + 12) if side > 0 else (yfront - 12, yfront)
        z0 = T(x + w / 2, yfront) - 0.1; H = 10.5
        box('hisa_m', x, x + w, ya, yb, z0, z0 + H, brick[i % 3])
        box('venec', x, x + w, min(ya, yb) - 0.0, max(ya, yb), z0 + H, z0 + H + 0.4, mat('venec', '#5a5d63', 0.6))
        fy = ya if side > 0 else yb
        for zz in (1.2, 4.6, 8.0):
            for xx in (x + 1.0, x + 4.6):
                y1, y2 = sorted((fy, fy + out * 0.06)); box('okno_m', xx, xx + 1.4, y1, y2, z0 + zz, z0 + zz + 1.6, g if random.random() < 0.6 else kit.GLASS)
        y1, y2 = sorted((fy + out * 0.0, fy + out * 1.6)); box('balkon_m', x + 0.4, x + w - 0.4, y1, y2, z0 + 3.4, z0 + 3.55, ir)
        for k in range(12):
            t = k / 12
            sx = x + 3.0 + t * 2.6; sy = fy + out * (1.0 + t * 1.6); sz = z0 + 3.4 * (1 - t)
            box('stopnica', sx, sx + 0.6, min(sy, sy + out * 0.5), max(sy, sy + out * 0.5), sz - 0.08, sz, ir)
        x += w; i += 1

def city_bus(c1='#f2f2ee', c2='#1f4fa8'):
    m1 = mat('bus_b', c1, 0.35); m2 = mat('bus_m', c2, 0.4)
    box('bus', -1.27, 1.27, -6.0, 6.0, 0.35, 3.1, m1, 0.15)
    for s in (-1, 1): box('okna_b', min(s * 1.27, s * 1.29), max(s * 1.27, s * 1.29), -5.6, 5.0, 1.35, 2.6, kit.GLASS)
    box('vetrobran_b', -1.15, 1.15, 5.98, 6.02, 1.0, 2.8, kit.GLASS)
    stripe(1.28, -6.0, 6.0, 0.5, 1.0, m2)
    box('napis_b', -0.9, 0.9, 6.0, 6.04, 2.75, 3.0, mat('cilj_luc', '#ffb030', 0.3, 0.0, 6))
    for (y0, y1) in ((4.0, 5.3), (-0.6, 0.7)): box('vrata_b', 1.27, 1.31, y0, y1, 0.4, 2.7, mat('vrata_odp', '#1d1d1f', 0.4))
    plain_lights(1.2, 6.02, 0.6)
    wheels([(4.2, False), (-3.4, False)], 0.5, 0.32, 1.0)

def bus_shelter():
    gm = mat('postaja_k', '#5b6066', 0.4, 0.5)
    box('streha_ps', -2.2, 2.2, -0.9, 0.9, 2.6, 2.75, gm); box('zadnja_s', -2.2, 2.2, 0.8, 0.85, 0.1, 2.6, kit.GLASS)
    for x in (-2.15, 2.15): box('steber_ps', x - 0.05, x + 0.05, -0.9, 0.9, 0, 2.6, gm)
    box('klop', -1.4, 1.4, 0.3, 0.7, 0.45, 0.55, gm)
    box('znak_p', 2.5, 2.6, -0.05, 0.05, 0, 2.8, gm); box('znak_ploscica', 2.3, 2.8, -0.08, 0.08, 2.4, 2.9, mat('znak_bus', '#1f4fa8', 0.4))

def traffic_light(red=False):
    gm = mat('semafor', '#2a2d33', 0.5)
    rcyl('drog_s', 0.1, 4.5, (0, 0, 2.25), gm, n=8); box('glava_s', -0.25, 0.25, -0.2, 0.2, 3.6, 4.7, gm)
    for k, (c, on) in enumerate((('#ff2a1a', red), ('#ffb000', False), ('#3ad66a', not red))):
        sph('luc_s', 0.13, (0, -0.22, 4.45 - k * 0.35), mat('sem' + c + str(on), c, 0.3, 0.0, 10 if on else 0.2), sub=1)

def quad(colr='#d6332a'):
    m = mat('quad' + colr, colr, 0.4)
    box('telo_q', -0.55, 0.55, -0.9, 0.9, 0.45, 0.85, m, 0.12)
    box('sedez_q', -0.3, 0.3, -0.6, 0.2, 0.85, 1.0, kit.BLACK, 0.05)
    rbox('krmilo_q', (0.8, 0.04, 0.04), (0, 0.55, 1.15), kit.BLACK)
    for (x, y) in ((-0.62, 0.65), (0.62, 0.65), (-0.62, -0.65), (0.62, -0.65)): cyl('kolo_q', 0.32, 0.28, (x, y, 0.32), kit.RUB, 'X', 14)
    box('deska_q', -0.25, 0.25, -1.5, 0.6, 1.15, 1.22, mat('deska_r', '#f2c230', 0.5))
    b = snap(); person('#f2c230'); group(b, 'voznik_q', 0, -0.25, 0, z=0.4, tilt=False)

def jetski(colr='#d6332a'):
    m = mat('skuter' + colr, colr, 0.4)
    hexa('trup_j', [(-0.45, -1.4, 0.0), (0.45, -1.4, 0.0), (0.1, 1.4, 0.2), (-0.1, 1.4, 0.2),
                    (-0.55, -1.4, 0.55), (0.55, -1.4, 0.55), (0.25, 1.5, 0.6), (-0.25, 1.5, 0.6)], m, 0.05)
    box('sedez_j', -0.25, 0.25, -1.0, 0.3, 0.55, 0.75, kit.BLACK, 0.05); rbox('krmilo_j', (0.7, 0.04, 0.04), (0, 0.6, 0.95), kit.BLACK)
    box('sani', -0.6, 0.6, -2.9, -1.5, 0.05, 0.15, mat('sani_r', '#f2c230', 0.5), 0.04)
    b = snap(); person('#f2c230'); group(b, 'voznik_j', 0, -0.4, 0, z=0.45, tilt=False)

def lifeguard_tower():
    wm = mat('stolp_b', '#e9e6df', 0.5); rd = mat('stolp_r', '#d6332a', 0.5)
    for (x, y) in ((-1.4, -1.4), (1.4, -1.4), (-1.4, 1.4), (1.4, 1.4)): box('noga_s', x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0, 4.0, wm)
    box('kabina_s', -1.7, 1.7, -1.7, 1.7, 4.0, 6.3, rd, 0.05); box('okno_s', -1.5, 1.5, -1.75, -1.7, 4.8, 5.9, kit.GLASS)
    hexa('streha_s', [(-2.0, -2.0, 6.3), (2.0, -2.0, 6.3), (2.0, 2.0, 6.3), (-2.0, 2.0, 6.3), (-0.1, -0.1, 7.3), (0.1, -0.1, 7.3), (0.1, 0.1, 7.3), (-0.1, 0.1, 7.3)], wm)

def surf_flag(x, y):
    z = T(x, y); rcyl('drog_z', 0.03, 3.0, (x, y, z + 1.5), mat('drog_b', '#e9e6df', 0.5), n=6)
    box('zast_r', x, x + 0.04, y, y + 0.9, z + 2.35, z + 2.65, mat('zast_rd', '#d6332a', 0.6))
    box('zast_y', x, x + 0.04, y, y + 0.9, z + 2.05, z + 2.35, mat('zast_ru', '#f2c230', 0.6))

def foam_line(x0, x1, y, z, w=1.2, colr='#ffffff', alpha=0.6):
    m = tm('pena' + colr, colr, alpha, rough=0.6); bm = bmesh.new(); x = x0
    while x < x1:
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y + random.gauss(0, 0.6), z), (0, 0, 0), (random.uniform(1.5, 3.5), w, 0.25)))
        x += random.uniform(1.5, 3.0)
    no_shadow(mk('pena', bm, m, smooth=True))

def render3(R):
    render2(R)
    if 'inset' in R:
        I = R['inset']
        cd = bpy.data.cameras.new('cam2'); cd.lens = I.get('lens', 24); cd.clip_end = 4000; cd.clip_start = 0.05
        co = bpy.data.objects.new('cam2', cd); col().objects.link(co); co.location = I['cam']
        co.rotation_euler = (Vector(I['tgt']) - Vector(I['cam'])).to_track_quat('-Z', 'Y').to_euler()
        SC.camera = co; SC.render.resolution_x, SC.render.resolution_y = (240, 136) if FAST else (480, 272)
        SC.render.filepath = os.path.join(OUT, 'm%02d_inset%s.png' % (M, '_hitro' if FAST else ''))
        bpy.ops.render.render(write_still=True)
        SC.camera = bpy.data.objects['cam']

# ---------------------------------------------------------------- misije 26–35
def rail(off, z0, z1, m, i0=0, i1=None, name='ograja'):
    """navpičen trak ob cesti (odbojna ograja); off > 0 levo, < 0 desno od smeri ceste"""
    bm = bmesh.new(); prev = None; R = ROAD[i0:i1]
    for i, (x, y, z) in enumerate(R):
        j = min(i + 1, len(R) - 1); k = max(i - 1, 0)
        tx, ty = R[j][0] - R[k][0], R[j][1] - R[k][1]; L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        a = bm.verts.new((x + nx * off, y + ny * off, z + z0)); b = bm.verts.new((x + nx * off, y + ny * off, z + z1))
        if prev: bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)
    return mk(name, bm, m)

def shore_foam(x0, x1, y0, y1, step=1.4, band=0.45, alpha=0.6, p=0.8):
    """pena povsod, kjer teren seka morsko gladino (z = 0)"""
    m = tm('pena_o', '#ffffff', alpha, rough=0.6); bm = bmesh.new(); x = x0
    while x < x1:
        y = y0
        while y < y1:
            if abs(BASE(x, y)) < band and random.random() < p:
                bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x + random.uniform(-0.6, 0.6), y + random.uniform(-0.6, 0.6), 0.05), (0, 0, random.uniform(0, 3)), (random.uniform(1.2, 2.4), random.uniform(0.6, 1.2), 0.22)))
            y += step
        x += step
    no_shadow(mk('pena', bm, m, smooth=True))

def m26():   # Zadnji odstotek · Tianmen
    global BASE
    def base(x, y):
        z = 0.42 * y + 3 * math.sin(x / 17) + 2 * math.cos(y / 13) + 0.004 * x * x * (1 - 0.75 * sst(-90, -180, y))
        return z - 46 * sst(-95, -190, y)
    BASE = base
    pts = [(-70, -78), (-20, -66), (30, -56)]
    y = -44
    for k in range(9):
        pts.append((-30 if k % 2 == 0 else 30, y)); y += 13
    set_road(pts, 3.0, smooth=6)
    terrain(460, 230, pal('#4f7a3a', '#5f8a45', '#7f7b74', (0.4, 0.6)), 0, -80); road('asfalt')
    for k, (x, y, r, h) in enumerate(((-150, -180, 26, 150), (-80, -250, 30, 190), (10, -300, 34, 210), (95, -245, 28, 185),
                                      (165, -195, 24, 160), (-215, -270, 30, 190), (210, -285, 28, 200), (-30, -205, 18, 130))):
        karst(x, y, r, h, k)
    mm = tm('megla_t', '#f4f6f8', 0.16, emit=0.35, rough=1.0)
    for (mx, my, mz, sx, sy) in ((-120, -200, -95, 90, 40), (60, -230, -110, 100, 40), (-20, -290, -130, 120, 40), (150, -260, -95, 80, 40),
                                 (-180, -280, -90, 70, 40), (0, -160, -88, 130, 30), (-60, -250, -75, 80, 30), (90, -300, -120, 90, 40)):
        no_shadow(sph('megla', 1.0, (mx, my, mz), mm, scl=(sx, sy, 6), sub=3))
    i = idx_near(-6, 55); x, y, h = on_road(i, -1.4)
    keep = lambda x_, y_: -150 < y_ < 140 and BASE(x_, y_) < 75 and not (x - 28 < x_ < x + 40 and y_ > y - 8)
    forest(170, -200, 200, -150, 140, 6, kind='iglavec', keep=keep); forest(150, -200, 200, -150, 140, 6, kind='listavec', keep=keep)
    b = snap(); ev_car('#f2f2ee'); e = group(b, 'ev', x, y, h + math.pi); headlights(e, 2.3, 0.75, 900)
    ci = idx_near(-40, -72); cx_, cy_, ch = on_road(ci, RHW + 7)
    b = snap(); charger_station(); b2 = snap(); car('#2f6fb0'); group(b2, 'polni', 1.3, -1.6, 0, z=0.06, tilt=False); group(b, 'polnilnica', cx_, cy_, ch, tilt=False)
    point_light(cx_, cy_, T(cx_, cy_) + 3.8, 400, (0.4, 1.0, 0.5), 2)
    sky(colr='#b9cde0', strength=1.0, sun=(58, 25), sun_e=3.2, sun_c=(1.0, 0.88, 0.74))
    zc = T(x, y) + 34; hd = math.hypot(18, 160)
    return dict(cam=(x + 10, y + 34, zc), tgt=(x - 8, y - 126, zc - hd * math.tan(math.radians(21))), lens=18, pts={'polnilnica': (cx_, cy_, T(cx_, cy_) + 5)})

def m27():   # Splavi čoln · Uncompahgre
    global BASE
    def base(x, y):
        z = 2.2 - 0.11 * (y - 6) if y > 6 else 2.2 + 0.04 * (6 - y)
        z += 70 * sst(70, 170, abs(x)) * (0.7 + 0.3 * math.sin(y / 40))
        z += 130 * sst(230, 340, y) * (0.6 + 0.4 * math.sin(x / 70))
        return z + 0.6 * math.sin(x / 9) * math.cos(y / 11) * sst(30, 0, y)
    BASE = base
    set_road([(-60, -70), (-30, -40), (-6, -18), (0, 4), (0, 26), (0, 50)], 3.0)
    terrain(520, 240, pal('#5f7a3a', '#6f7f45', '#7f7b74', (0.3, 0.5), '#eef2f6', 88), 0, 90)
    road2('#a9a79c', shoulder='#8f8a7a')
    box('jezero', -258, 258, 26, 348, -6, 0.0, tm('jezero_g', '#2a6f8a', 0.8, rough=0.06))
    wdm = mat('pomol_l', '#8a6a46', 0.85)
    box('pomol', 5.2, 7.4, 16, 52, 0.55, 0.75, wdm)
    for yy in range(18, 52, 4):
        for xx in (5.4, 7.2): rcyl('kol_p', 0.12, 3.0, (xx, yy, -0.6), mat('kol_l', '#5a4636', 0.9), n=8)
    forest(240, -250, 250, -120, 220, 9, keep=lambda x, y: BASE(x, y) > 1.0 and BASE(x, y) < 75 and not (-30 < x < 30 and -60 < y < 30))
    for k, (px, py) in enumerate(((-22, -34), (-30, -40), (-14, -44))):
        b = snap(); pickup(['#7f8a93', '#2a2d33', '#b5121b'][k]); group(b, 'parkiran', px, py, math.radians(20 + k * 8))
    i = idx_near(0, 3); x, y, h = on_road(i, 0)
    b = snap(); pickup('#2f5d9a'); e = group(b, 'vlecno', x, y, h + math.pi)
    tx, ty = x + 0.6, y + 7.6
    b = snap(); boat_trailer(); et = group(b, 'prikolica', tx, ty, h + math.pi + 0.28)
    sky(colr='#a9c6e8', sun=(42, -50), sun_e=3.6)
    z0 = T(x, y)
    return dict(cam=(x - 9, y - 16, z0 + 7.5), tgt=(x + 2, y + 30, z0 + 3.5), lens=22,
                inset=dict(cam=(tx + 0.2, ty + 3.2, T(tx, ty) + 2.3), tgt=(tx - 0.8, ty + 26, 0.0), lens=22))

def m28():   # Svetilnik v nevihti · Big Sur
    global BASE
    def seg_d(x, y, ax, ay, bx, by):
        dx, dy = bx - ax, by - ay; t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - ax - t * dx, y - ay - t * dy), t
    def base(x, y):
        z = 30 + 4 * math.sin(y / 23) * math.cos(x / 19) + 0.25 * max(0.0, -x - 20)
        d, t = seg_d(x, y, 16, 64, 84, 76); head = sst(14, 4, d) * (1 - 0.45 * t)
        return z - 46 * sst(16, 34, x) * (1 - head)
    BASE = base
    set_road([(2, -140), (0, -60), (4, 0), (8, 50), (6, 120), (0, 200)], 3.4)
    def colf(x, y, z, sl):
        c = mix(lin('#3f4f30'), lin('#556240'), noise(x, y))
        return mix(c, lin('#5a5048'), sst(0.25, 0.5, sl))
    terrain(520, 240, colf, 60, 60); road('asfalt', center=True)
    box('morje_n', -600, 600, -600, 600, -12, -0.3, tm('morje_n', '#1f3340', 0.92, rough=0.12))
    shore_foam(14, 120, -150, 240, 1.5, 0.5, 0.6, 0.7)
    for (xx, y0, y1) in ((44, -150, 50), (58, -120, 40), (74, -140, 30), (96, 92, 240), (120, 60, 220), (150, -40, 120), (180, 20, 90)):
        yy = y0
        while yy < y1:
            L = random.uniform(8, 22); foam_seg(xx + random.uniform(-3, 3), yy, xx + random.uniform(-3, 3) + 2, yy + L, 0.0, 1.0, 0.35); yy += L + random.uniform(6, 16)
    wc = tm('bela_kapa', '#ffffff', 0.5, rough=0.6); bm = bmesh.new()
    for k in range(160):
        wx, wy = random.uniform(40, 260), random.uniform(-120, 260)
        if BASE(wx, wy) < -3: bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((wx, wy, 0.0), (0, 0, random.uniform(0, 3)), (random.uniform(1.0, 2.6), 0.6, 0.2)))
    no_shadow(mk('kape', bm, wc, smooth=True))
    rk = mat('cer', '#4a4440', 0.9)
    for (sx, sy, a, b_, c) in ((96, 70, 6, 5, 9), (93, 86, 4, 4, 7), (101, 58, 5, 4, 6), (58, 48, 4, 3, 5), (46, 102, 5, 4, 6), (70, 97, 3, 3, 4)):
        sph('cer', 1.0, (sx, sy, -1.5), rk, scl=(a, b_, c), sub=2)
        foam_seg(sx - a - 2, sy - b_ - 1, sx + a + 2, sy + b_ + 1, 0.05, 1.3, 0.55)
    lx, ly = 78, 74; b = snap(); lighthouse(); group(b, 'svetilnik', lx, ly, math.radians(200), tilt=False, scale=1.45)
    b = snap(); cargo_ship(); group(b, 'ladja', 178, 140, math.radians(125), z=0.0, tilt=False)
    sm = tm('pljusk_v', '#e9f2f8', 0.45, rough=0.6)
    for (px, py) in ((96, 70), (101, 58), (93, 86), (88, 78)):
        for k in range(6): no_shadow(sph('pljusk', random.uniform(1.0, 2.6), (px + random.gauss(0, 2), py + random.gauss(0, 2), random.uniform(1, 7)), sm, sub=2))
    i = idx_near(7, 20); x, y, h = on_road(i, 1.6)
    b = snap(); pickup('#f2f2ee', light=True); box('utripalka', -0.3, 0.3, 0.1, 0.4, 2.05, 2.25, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9))
    e = group(b, 'servis', x, y, h); headlights(e, 2.7, 0.9, 1600); point_light(x, y, T(x, y) + 2.6, 60, (1.0, 0.6, 0.15), 0.1)
    lightning((235, 205, 170), (196, 172, -0.3)); point_light(200, 175, 80, 6e5, (0.8, 0.85, 1.0), 20)
    cam = (-20, -20, T(-20, -20) + 28)
    rain(x + 30, y + 30, 75, 2600, 40, 0.45, avoid=(cam, 20))
    sky(colr='#2a3646', strength=1.0, sun=(50, 200), sun_e=1.4, sun_c=(0.7, 0.78, 1.0))
    dx, dy = math.cos(math.radians(50)), math.sin(math.radians(50))
    return dict(cam=cam, tgt=(cam[0] + dx * 100, cam[1] + dy * 100, cam[2] - 26.8), lens=30,
                pts={'svetilnik': (lx, ly, T(lx, ly) + 30), 'ladja': (178 + 37.7, 140 + 26.4, 22)})

def m29():   # Božična noč · Štajerska
    global BASE
    BASE = lambda x, y: 6 * math.sin(x / 60) * math.cos(y / 70) + 0.04 * y + 25 * sst(80, 180, abs(x))
    set_road([(-160, -20), (-60, -8), (0, 0), (60, 10), (160, 24)], 3.2)
    terrain(420, 200, pal('#eef2f6', '#dfe6ee', '#9aa3ab', (0.45, 0.7)), 0, 20); road2('#9aa6b2', shoulder='#e9eef2', rough=0.6)
    random.seed(29)
    houses = []
    for k in range(-5, 6):
        for s in (-1, 1):
            if k == 0 and s < 0: continue
            i = idx_near(k * 15, 0 + k * 1.6); x, y, h = on_road(i, s * random.uniform(13, 16))
            houses.append(chalet(x, y, h - s * math.pi / 2, random.uniform(8, 10), random.uniform(9, 11), random.uniform(5.5, 7)))
    church(4, 32, math.radians(90), '#f2efe8', '#5a5d63', '#3a3d42', 26, lit=4)
    xmas_tree(3, 15, 1.0)
    for i in range(0, len(ROAD), 18):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 1.6)); lamp_post(x, y, energy=500)
    i = idx_near(-14, -2); x, y, h = on_road(i, 1.4)
    b = snap(); pickup('#b5121b', light=True)
    cols = [('#2f6fb0', '#ffd23a'), ('#3a9a4a', '#d6332a'), ('#f2c230', '#2f6fb0'), ('#d6332a', '#f2f2ee')]
    for k, (c, r) in enumerate(cols):
        b2 = snap(); present(c, r); group(b2, 'darilo', -0.4 + (k % 2) * 0.7, -1.2 - (k // 2) * 0.8, k * 0.4, z=1.0, tilt=False)
    e = group(b, 'dostava', x, y, h); headlights(e, 2.7, 0.9, 900)
    hs = houses[12]; tx_, ty_ = hs.location.x, hs.location.y
    gx, gy = x + (tx_ - x) * 0.35, y + (ty_ - y) * 0.35; gz = T(x, y) + 5.5
    b = snap(); present('#9a4ac4', '#ffd23a'); g = group(b, 'v_letu', gx, gy, 0.6, z=gz, tilt=False, scale=1.6); g.rotation_euler = (0.5, 0.3, 0.6)
    snowfall(x + 10, y, 50, 1100, 25)
    stars(300)
    sky(colr='#1f2a44', strength=0.55, sun=(40, 160), sun_e=0.7, sun_c=(0.65, 0.75, 1.0))
    cam = behind(x, y, h, 22, 13, side=-5); tgt = ahead(x, y, h, 16, 1.5, side=3)
    return dict(cam=cam, tgt=tgt, lens=28, pts={'tarca': (tx_, ty_, T(tx_, ty_) + 9.5), 'darilo': (gx, gy, gz + 0.5), 'auto': (x, y, T(x, y) + 2)})

def m30():   # Ratrak · Mount Baldy (noč)
    global BASE
    def groomed(x, y): return (-24 < x < 9.5 and y < 24) or (-24 < x < 2 and y < 60)
    def base(x, y):
        z = 0.42 * y + 3 * math.sin(x / 21) * math.cos(y / 17) + 0.004 * x * x
        z = z + (-110 - z) * sst(-150, -250, y)
        if -34 < x < 34 and -110 < y < 140 and not groomed(x, y):
            z += 0.6 * math.sin(x / 1.3) * math.sin(y / 1.6) * sst(34, 30, abs(x))
        return z
    BASE = base
    def colf(x, y, z, sl):
        c = mix(lin('#eef2f6'), lin('#e2e9f0'), noise(x, y))
        return mix(c, lin('#3a3d42'), sst(-70, -100, z))
    terrain(420, 280, colf, 0, -60)
    cm = mat('urejeno', '#d2dbe4', 0.7); bm = bmesh.new()
    def line(x, y0, y1):
        prev = None; y = y0
        while y <= y1:
            a = bm.verts.new((x - 0.12, y, T(x, y) + 0.03)); b = bm.verts.new((x + 0.12, y, T(x, y) + 0.03))
            if prev: bm.faces.new((prev[0], prev[1], b, a))
            prev = (a, b); y += 2.0
    xx = -23.7
    while xx < 9.3:
        line(xx, -100, 23 if xx > 2 else 59); xx += 0.6
    mk('rebra', bm, cm)
    forest(300, -200, 200, -110, 150, 0, keep=lambda x, y: abs(x) > 36)
    tm_ = mat('zicnica', '#3a3d42', 0.5, 0.5)
    tw = [(-40, y) for y in range(-100, 160, 40)]
    for (x, y) in tw:
        z = T(x, y); box('steber_z', x - 0.3, x + 0.3, y - 0.3, y + 0.3, z, z + 12, tm_); box('precka_z', x - 2.5, x + 2.5, y - 0.2, y + 0.2, z + 12, z + 12.4, tm_)
    for (a, b_) in zip(tw, tw[1:]):
        for dx in (-2.3, 2.3):
            p0 = Vector((a[0] + dx, a[1], T(*a) + 12)); p1 = Vector((b_[0] + dx, b_[1], T(*b_) + 12)); d = p1 - p0
            rcyl('vrv_z', 0.04, d.length, tuple((p0 + p1) / 2), tm_, rot=d.to_track_quat('Z', 'Y').to_euler(), n=5)
            for t in (0.3, 0.7):
                q = p0.lerp(p1, t); box('sedez_z', q.x - 0.5, q.x + 0.5, q.y - 0.3, q.y + 0.3, q.z - 2.2, q.z - 1.8, tm_)
    gx, gy = 5, 22
    b = snap(); snowcat('#c4161c'); box('utripalka_r', -0.2, 0.2, 0.0, 0.3, 3.45, 3.65, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)); e = group(b, 'ratrak', gx, gy, 0)
    spot(gx, gy + 1.8, T(gx, gy) + 3.5, gx, gy + 30, T(gx, gy + 30), 90000, 0.9)
    spot(gx, gy - 2, T(gx, gy) + 3.5, gx, gy - 24, T(gx, gy - 24), 50000, 0.9)
    ax, ay = 5, 150; p0 = Vector((gx, gy - 0.4, T(gx, gy) + 4.6)); p1 = Vector((ax, ay, T(ax, ay) + 1)); d = p1 - p0
    rcyl('jeklenica', 0.035, d.length, tuple((p0 + p1) / 2), mat('jeklenica', '#c9ccd0', 0.4, 0.8), rot=d.to_track_quat('Z', 'Y').to_euler(), n=5)
    lm = mat('mesto_luc', '#ffc979', 0.5, 0.0, 30); bm = bmesh.new()
    for k in range(1600):
        x, y = random.uniform(-700, 700), random.uniform(-900, -280)
        if random.random() < 0.5 and abs(math.sin(x / 37) * math.cos(y / 41)) < 0.3: continue
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, -109.5), (0, 0, 0), (1.0, 1.0, 0.5)))
    mk('mesto', bm, lm); box('mesto_tla', -900, 900, -1200, -260, -115, -110.5, mat('mesto_t', '#14161a', 0.9))
    stars(400)
    sky(colr='#1b2540', strength=0.6, sun=(42, 160), sun_e=1.0, sun_c=(0.65, 0.75, 1.0))
    zc = T(gx + 7, gy + 24) + 12
    cam = (gx + 7, gy + 24, zc); hd = math.hypot(14, 110)
    return dict(cam=cam, tgt=(gx - 7, gy - 86, zc - hd * math.tan(math.radians(25))), lens=22)

def m31():   # Dinozavrovo jajce · Riverside
    global BASE
    px, py = -32, 34
    def pit(x, y): return max(abs(x - px) / 12, abs(y - py) / 8)
    def base(x, y):
        z = 5 * math.sin(x / 37) * math.cos(y / 41) + 3 * math.sin((x + y) / 23)
        return z - 3.2 * (1 - sst(0.85, 1.25, pit(x, y)))
    BASE = base
    set_road([(-60, 40), (-30, 14), (-6, -4), (30, -12), (90, -20), (200, -30)], 3.0)
    def colf(x, y, z, sl):
        c = mix(lin('#b39e62'), lin('#9c8c52'), sst(0.35, 0.65, noise(x, y)))
        c = mix(c, lin('#8f8a58'), 0.35 * sst(0.55, 0.75, noise(x * 2.3, y * 1.9)))
        return mix(c, lin('#a8875e'), 1 - sst(0.9, 1.2, pit(x, y)))
    terrain(440, 220, colf, 0, 40); road2('#b39a74', shoulder=None)
    wm = mat('vrvica', '#f2f2ee', 0.5); lst = []
    zt = BASE(px - 20, py) + 0.15
    for k in range(-6, 7): lst.append((px + k * 2 - 0.02, px + k * 2 + 0.02, py - 8, py + 8, zt, zt + 0.03))
    for k in range(-4, 5): lst.append((px - 12, px + 12, py + k * 2 - 0.02, py + k * 2 + 0.02, zt, zt + 0.03))
    for (sx, sy) in ((px - 12, py - 8), (px + 12, py - 8), (px - 12, py + 8), (px + 12, py + 8), (px, py - 8), (px, py + 8)):
        lst.append((sx - 0.05, sx + 0.05, sy - 0.05, sy + 0.05, zt - 0.4, zt + 0.5))
    boxes('mreza', lst, wm)
    bn = mat('kost', '#efe6cf', 0.6); zb = BASE(px, py) + 0.15
    for k in range(10): box('vretence', px - 6 + k * 1.1, px - 5.5 + k * 1.1, py - 0.2, py + 0.2, zb, zb + 0.35, bn, 0.05)
    for k in range(7):
        x0 = px - 4 + k * 1.1
        for s in (-1, 1): rbox('rebro', (0.12, 2.2, 0.12), (x0, py + s * 1.0, zb + 0.6), bn, rot=(s * 0.9, 0, 0))
    box('lobanja', px + 5.2, px + 7.0, py - 0.6, py + 0.6, zb, zb + 0.9, bn, 0.15)
    for k in range(6): box('rep', px - 7 - k * 1.0, px - 6.4 - k * 1.0, py - 0.15 + k * 0.25, py + 0.15 + k * 0.25, zb, zb + 0.25, bn, 0.04)
    cv = mat('platno', '#d9c9a0', 0.8)
    for (tx, ty) in ((px - 18, py + 14), (px + 16, py + 12), (px - 6, py + 20)):
        b = snap(); hexa('sotor', [(-2.5, -3, 0), (2.5, -3, 0), (2.5, 3, 0), (-2.5, 3, 0), (-0.05, -3, 2.6), (0.05, -3, 2.6), (0.05, 3, 2.6), (-0.05, 3, 2.6)], cv); group(b, 'sotor', tx, ty, random.uniform(0, 3), tilt=False)
    b = snap(); box('senca', -3, 3, -3, 3, 2.6, 2.7, mat('senca_p', '#e8e0c8', 0.8))
    for (sx, sy) in ((-2.9, -2.9), (2.9, -2.9), (-2.9, 2.9), (2.9, 2.9)): rcyl('drog_s', 0.05, 2.6, (sx, sy, 1.3), kit.DARK, n=6)
    group(b, 'nadstresek', px + 9, py - 5, 0.2, z=BASE(px + 9, py - 5), tilt=False)
    for (dx, dy) in ((-3, -2), (2, 3), (-8, 4), (6, -5), (9, -6)):
        b = snap(); person(random.choice(['#c9a46a', '#7a8a5a', '#f2f2ee'])); rcyl('klobuk', 0.2, 0.06, (0, 0, 1.82), mat('klobuk', '#b39a64', 0.8), n=12); group(b, 'paleontolog', px + dx, py + dy, random.uniform(0, 6), tilt=False)
    i = idx_near(-6, -4); x, y, h = on_road(i, -1.2)
    b = snap(); pickup('#d9c9a0'); b2 = snap(); egg_crate(); group(b2, 'jajce', 0, -1.5, 0, z=1.0, tilt=False); e = group(b, 'prevoz', x, y, h + math.pi)
    mx, my = -70, 190; mz = BASE(mx, my)
    stm = mat('muzej', '#ece6d8', 0.6)
    b = snap()
    box('muzej', -30, 30, -14, 14, -1, 16, stm)
    for k in range(10): rcyl('steber_m', 0.9, 14, (-22 + k * 4.9, -16, 7), stm, n=12)
    hexa('timpanon', [(-26, -18, 14), (26, -18, 14), (26, -14, 14), (-26, -14, 14), (-0.5, -18, 22), (0.5, -18, 22), (0.5, -14, 22), (-0.5, -14, 22)], stm)
    sph('kupola_m', 9, (0, 0, 16), mat('kupola_m', '#7f9aa8', 0.4, 0.4), scl=(1, 1, 0.8))
    group(b, 'muzej', mx, my, math.radians(-160), z=mz, tilt=False)
    for k in range(8): palm(mx - 30 + k * 8.5 + random.uniform(-1, 1), my - 26 + random.uniform(-2, 2))
    for k in range(170):
        x_, y_ = random.uniform(-210, 210), random.uniform(-160, 250)
        if not near_road(x_, y_, 4) and pit(x_, y_) > 1.6: bush(x_, y_, random.uniform(0.45, 1.0), random.choice(['#6b7448', '#7a7f50', '#5f6a40']))
    for k in range(30):
        x_, y_ = random.uniform(-210, 210), random.uniform(-100, 250)
        if not near_road(x_, y_, 8) and pit(x_, y_) > 2.5: tree(x_, y_, random.uniform(0.9, 1.3), 'listavec')
    sky(colr='#b4cde6', sun=(40, -60), sun_e=3.2)
    cam = (8, -26, T(8, -26) + 20)
    return dict(cam=cam, tgt=(-24, 26, cam[2] - math.hypot(32, 52) * math.tan(math.radians(18))), lens=22,
                pts={'muzej': (mx, my, mz + 28), 'jajce': (x, y, T(x, y) + 2.6)})

def m32():   # Opičja tolpa · Irohazaka
    global BASE
    BASE = lambda x, y: 0.35 * y + 4 * math.sin(x / 19) * math.cos(y / 23)
    pts = [(-70, -70), (-10, -60), (40, -50)]
    y = -38
    for k in range(7):
        pts.append((-34 if k % 2 == 0 else 34, y)); y += 16
    set_road(pts, 3.0, smooth=6)
    terrain(320, 220, pal('#7a5a32', '#8a6a3a', '#6f6a62', (0.4, 0.6)), 0, 20); road('asfalt', center=True)
    gm = mat('ograja_k', '#c9ccd0', 0.4, 0.6); lst = []
    for i in range(0, len(ROAD), 3):
        x, y, h = on_road(i, RHW + 0.9); z = ROAD[i][2]
        lst.append((x - 0.07, x + 0.07, y - 0.07, y + 0.07, z - 0.3, z + 0.75))
    boxes('ograja', lst, gm); rail(-(RHW + 0.9), 0.45, 0.75, gm)
    tx, ty, th = on_road(len(ROAD) - 4, 0); b = snap(); torii(); group(b, 'torii', tx, ty, th, tilt=False)
    i = idx_near(0, -30); x, y, h = on_road(i, -1.3)
    cam = behind(x, y, h, 14, 11, side=-4)
    def clear(px_, py_):
        ax, ay = cam[0], cam[1]; dx, dy = x - ax, y - ay; L2 = dx * dx + dy * dy
        t = max(0.0, min(1.0, ((px_ - ax) * dx + (py_ - ay) * dy) / L2))
        return math.hypot(px_ - ax - t * dx, py_ - ay - t * dy) > 4.5 and math.hypot(px_ - x, py_ - y) > 8
    k = 0
    while k < 240:
        a = random.uniform(0, 6.28); r = random.uniform(8, 75); mx, my = x + r * math.cos(a), y + r * math.sin(a)
        if not near_road(mx, my, 3.2) and clear(mx, my): maple(mx, my, random.uniform(0.85, 1.3)); k += 1
    for k in range(150):
        mx, my = random.uniform(-160, 160), random.uniform(-110, 130)
        if not near_road(mx, my, 4) and clear(mx, my): maple(mx, my, random.uniform(0.8, 1.2))
    for k in range(60):
        mx, my = random.uniform(-160, 160), random.uniform(-110, 130)
        if not near_road(mx, my, 5) and clear(mx, my): tree(mx, my, random.uniform(1.1, 1.6), 'iglavec')
    b = snap(); kei_truck('#f2f2ee')
    for (dx, dy, hh, zz) in ((-0.35, -1.4, 2.4, 1.05), (0.35, -0.6, 0.6, 1.05), (0.0, 1.0, 3.1, 1.92)):
        b2 = snap(); monkey(); group(b2, 'opica_n', dx, dy, hh, z=zz, tilt=False, scale=1.2)
    e = group(b, 'tovornjacek', x, y, h)
    for (d, sd) in ((7, 0.6), (10, -1.0), (13, 1.8), (16, -0.2)):
        mx, my, mz = ahead(x, y, h, d, 0.0, side=sd)
        b = snap(); monkey(); group(b, 'opica', mx, my, h + math.pi + random.uniform(-0.8, 0.8), scale=1.3)
    for k in range(5):
        mx, my, mh = on_road(i + random.randint(-8, 24), RHW + 0.9)
        b = snap(); monkey(); group(b, 'opica_o', mx, my, mh + math.pi / 2, z=ROAD[idx_near(mx, my)][2] + 0.75, tilt=False, scale=1.2)
    sky(colr='#b4cde6', sun=(45, -60), sun_e=3.6)
    return dict(cam=cam, tgt=ahead(x, y, h, 8, 0.6, side=-1), lens=28)

def m33():   # Odvoz snega · Montréal (noč)
    global BASE
    BASE = lambda x, y: 0.02 * x
    set_road([(-220, 0), (220, 0)], 5.0)
    def colf(x, y, z, sl):
        return lin('#e9eef2') if abs(y) < 9 else lin('#c9d0d6')
    terrain(460, 120, colf, 0, 0); road2('#3d4045', shoulder=None, rough=0.6)
    sm = mat('sneg_kup', '#f2f5f8', 0.6); bm = bmesh.new()
    for k in range(-100, 100, 2):
        for s in (-1, 1):
            if s > 0 and k < 6: continue
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((k + random.uniform(-0.5, 0.5), s * (5.6 + random.uniform(0, 0.6)), 0.02 * k + 0.4), (0, 0, random.uniform(0, 3)), (1.8, 1.0, 0.9)))
    mk('kupi', bm, sm, smooth=True)
    montreal_row(-90, 90, 9.5, 1); montreal_row(-90, 90, -9.5, -1)
    for x in range(-80, 81, 20):
        for s in (-1, 1): lamp_post(x, s * 7.2, energy=700)
    bx, by = 4.0, 2.4
    b = snap(); snowblower(); group(b, 'freza', bx, by, -math.pi / 2)
    kx, ky = 7.5, -2.4
    b = snap(); dump_truck('#e9e6df'); e = group(b, 'kiper', kx, ky, -math.pi / 2); headlights(e, 3.3, 0.9, 900)
    c0 = (bx + 2.1, by - 1.9, T(bx, by) + 3.9); c1 = (kx - 1.9, ky + 0.2, T(kx, ky) + 2.7)
    snow_arc(c0, c1, 1.6)
    b = snap(); truck('#f07a12', 'plug'); group(b, 'plug', 30, 2.0, -math.pi / 2)
    for (dx, dy) in ((-4, 5.0), (-7, 4.4)):
        b = snap(); person('#ff8a1a', refl=True); group(b, 'delavec', dx, dy, random.uniform(0, 6))
    point_light(bx, 0, T(bx, 0) + 6, 2500, (1.0, 0.6, 0.2), 1)
    snowfall(0, 0, 40, 1000, 22)
    stars(200)
    sky(colr='#2a3550', strength=0.6, sun=(40, 150), sun_e=0.8, sun_c=(0.65, 0.75, 1.0))
    return dict(cam=(-15, 6.6, T(-15, 6.6) + 10.5), tgt=(6, -1.2, T(6, 0) + 1.5), lens=26, pts={'curek': (c1[0], c1[1], c1[2] + 0.3)})

def m34():   # Mestni avtobus · Toronto
    global BASE
    BASE = lambda x, y: 0.0
    set_road([(-260, 0), (260, 0)], 6.5)
    def colf(x, y, z, sl): return lin('#a9adb1') if abs(y) < 14 else lin('#8f9399')
    terrain(520, 140, colf, 0, 0); road('asfalt', center=True)
    random.seed(34)
    for s in (-1, 1):
        x = -200
        while x < 200:
            w = random.uniform(16, 26); hh = random.uniform(30, 110)
            building(x + w / 2, s * (16 + 10), w, 18, hh, random.choice(['#a8c4d8', '#c9b59a', '#8faabd', '#d9d0c0', '#7f9aa8']), h=0, lit=0)
            x += w + 4
    for (x, y) in ((-60, -9.5), (-30, 9.5), (40, -9.5), (60, 9.5)): bush(x, y, 1.2, '#4f7a3a')
    b = snap(); bus_shelter(); group(b, 'postaja', 8, -9.4, math.pi, tilt=False)
    b = snap(); city_bus(); group(b, 'avtobus', 3, -4.6, -math.pi / 2, tilt=False)
    cols = ['#d6332a', '#2f6fb0', '#f2c230', '#3a9a4a', '#f2f2ee', '#1d1d1f', '#9a4ac4']
    for k, (dx, dy) in enumerate(((6.0, -8.0), (7.2, -8.6), (9.0, -8.2), (10.4, -8.8), (5.0, -8.8), (11.6, -8.0))):
        b = snap(); person(cols[k % len(cols)]); group(b, 'potnik', dx, dy, math.radians(random.uniform(-40, 40)) + math.pi / 2 * 0, tilt=False, scale=random.uniform(0.85, 1.0))
    for k, (x, y) in enumerate(((-30, 1.6), (-14, -1.6), (22, 1.6), (44, -4.8), (-48, 4.8))):
        b = snap(); car(cols[k % len(cols)]); group(b, 'avto', x, y, math.pi / 2 if y > 0 else -math.pi / 2)
    for (x, y) in ((26, 8.2), (26, -8.2)):
        b = snap(); traffic_light(y > 0); group(b, 'semafor', x, y, -math.pi / 2 if y > 0 else math.pi / 2, tilt=False)
    boxes('prehod', [(28, 32, yy - 0.25, yy + 0.25, 0.05, 0.07) for yy in range(-6, 7)], mat('prehod_b', '#f2f2ee', 0.6))
    boxes('stop_crta', [(27.2, 27.6, -6.5, 0, 0.05, 0.07)], mat('prehod_b', '#f2f2ee', 0.6))
    ym = mat('rumena_c', '#f2c230', 0.6)
    boxes('postajalisce', [(-2, 14, -6.45, -6.3, 0.05, 0.07), (-2, -1.85, -6.45, -3.0, 0.05, 0.07), (13.85, 14, -6.45, -3.0, 0.05, 0.07)], ym)
    sky(colr='#a9c8e8', sun=(40, -80), sun_e=3.6, sun_c=(1.0, 0.9, 0.78))
    return dict(cam=(-16, -12.5, 11), tgt=(8, -3.5, 1.5), lens=26, pts={'postaja': (12.5, -6.4, 0.1)})

def m35():   # Reševalci na plaži · Newcastle
    global BASE
    BASE = lambda x, y: 1.6 - 0.06 * y + 0.12 * math.sin(x / 9) + 6 * sst(-30, -70, y) + 40 * sst(120, 200, -x) * sst(40, -20, y)
    def colf(x, y, z, sl):
        c = mix(lin('#e8d4a6'), lin('#c9b082'), sst(18, 30, y))
        return mix(c, lin('#5f7f3a'), sst(4, 8, z))
    terrain(460, 220, colf, 0, 30)
    box('morje', -400, 400, 26, 500, -4, 0.0, tm('morje_b', '#2a86a8', 0.88, rough=0.05))
    for k in range(6): foam_line(-200, 200, 30 + k * 9 + random.uniform(-1, 1), 0.02, 1.0 + 0.2 * k, alpha=0.55)
    b = snap(); lifeguard_tower(); group(b, 'stolp', -12, 6, math.radians(10), tilt=False)
    for x in (-30, 14): surf_flag(x, 22)
    cols = ['#e8506a', '#f2c230', '#2f6fb0', '#3a9a4a']
    for k in range(30):
        x, y = random.uniform(-90, 90), random.uniform(-8, 18)
        if abs(x + 12) < 8 or (abs(x - 2) < 5 and y > 8): continue
        b = snap(); person(random.choice(cols), lying=random.random() < 0.6); group(b, 'kopalec', x, y, random.uniform(0, 6), tilt=False)
    um = [mat('dez_' + c, c, 0.6) for c in ('#e8506a', '#f2c230', '#2f6fb0')]
    for k in range(9):
        x, y = random.uniform(-80, 80), random.uniform(-6, 14)
        if abs(x + 12) < 8 or abs(x - 2) < 6: continue
        rcyl('drog_d', 0.03, 2.2, (x, y, T(x, y) + 1.1), kit.DARK, n=6); rcyl('dežnik', 1.3, 0.4, (x, y, T(x, y) + 2.2), um[k % 3], r2=0.05, n=10)
    qx, qy = 2, 23
    b = snap(); quad('#d6332a'); group(b, 'stirikolesnik', qx, qy, math.radians(-10))
    sk = mat('sled_q', '#b39a70', 0.95)
    for s in (-0.62, 0.62): box('sled', qx + s - 0.13, qx + s + 0.13, -6, qy - 1, T(qx, 10) + 0.01, T(qx, 10) + 0.03, sk)
    jx, jy = 6, 50
    b = snap(); jetski('#d6332a'); group(b, 'skuter', jx, jy, math.radians(-15), z=0.0, tilt=False)
    sm = tm('pena_j', '#ffffff', 0.6, rough=0.5)
    for k in range(18): no_shadow(sph('pena', random.uniform(0.2, 0.6), (jx - 0.2 * k * 0.26 + random.gauss(0, 0.5), jy - 2.5 - k * 0.5, 0.15), sm, sub=1))
    sx, sy = 13, 84
    sph('plavalec', 0.14, (sx, sy, 0.15), mat('koza', '#e2b493', 0.7)); rbox('roka_p', (0.09, 0.09, 0.6), (sx + 0.2, sy, 0.45), mat('koza', '#e2b493', 0.7), rot=(0, -0.3, 0))
    ring(sx, sy, 2.4, '#ffd23a', 6, 0.1, z=-0.08)
    for k in range(3):
        b = snap(); person('#1d1d1f'); rbox('deska_s', (0.5, 2.0, 0.08), (0, 0.4, 0.05), mat('deska_s', random.choice(['#f2f2ee', '#f2c230', '#2f6fb0']), 0.5)); group(b, 'surfer', -40 + k * 18, 66 + k * 6, 0.3, z=-1.2, tilt=False)
    for k in range(12): building(-160 + k * 14, -110, 12, 12, random.uniform(10, 28), random.choice(['#efe3c8', '#e8cfa8', '#dcd2bf']))
    sky(colr='#86bdf0', sun=(42, 150), sun_e=4.0)
    return dict(cam=(-16, -14, 12), tgt=(6, 46, 0.0), lens=26, pts={'plavalec': (sx, sy, 0.3), 'skuter': (jx, jy, 1.0)})

R = {26: m26, 27: m27, 28: m28, 29: m29, 30: m30, 31: m31, 32: m32, 33: m33, 34: m34, 35: m35}[M]()
render3(R)
from bpy_extras.object_utils import world_to_camera_view
SC.camera = bpy.data.objects['cam']
pts = {}
for k, p in R.get('pts', {}).items():
    v = world_to_camera_view(SC, SC.camera, Vector(p)); pts[k] = (v.x, 1 - v.y)
json.dump(pts, open(os.path.join(OUT, 'm%02d.json' % M), 'w'))
print('MISIJA', M, 'ok', len(bpy.data.objects), 'objektov')
