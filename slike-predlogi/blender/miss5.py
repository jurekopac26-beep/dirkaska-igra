# Makete misij 46–55 ter popravki misij 6, 29, 35 in 45 v Blenderju (samo slike).
# Uporaba: bl/bin/python gas/miss5.py <misija> <izhod> [hitro]
#   46–55 nove misije, 6 (s prometom), 45 (Riviera), 291–294 (kako vržeš darilo), 351–354 (kako iščeš plavalca)
# Gradniki so iz miss.py, miss2.py, miss3.py in miss4.py; tu so novi gradniki in scene.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'miss4.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def m36():')], os.path.join(_here, 'miss4.py'), 'exec'))

# ---------------------------------------------------------------- pomožno
def ribbon_r(name, off0, off1, lift, m, i0=0, i1=None):
    """trak ob cesti samo na delu ceste ROAD[i0:i1]; off > 0 levo"""
    bm = bmesh.new(); prev = None; R = ROAD[i0:i1]
    for i, (x, y, z) in enumerate(R):
        j = min(i + 1, len(R) - 1); k = max(i - 1, 0)
        tx, ty = R[j][0] - R[k][0], R[j][1] - R[k][1]; L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        a = bm.verts.new((x + nx * off0, y + ny * off0, z + lift)); b = bm.verts.new((x + nx * off1, y + ny * off1, z + lift))
        if prev: bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)
    return mk(name, bm, m)

def flat(f, pads):
    """višine f(x, y) z ravnimi ploščadmi [(cx, cy, r, z)]"""
    def g(x, y):
        z = f(x, y)
        for (cx, cy, r, zz) in pads:
            w = 1 - sst(r, r + 9, math.hypot(x - cx, y - cy)); z = z * (1 - w) + zz * w
        return z
    return g

def hazards(hw=0.9, yf=2.25, yr=-2.25, z=0.66):
    """vklopljene varnostne utripalke (oranžne luči na vogalih)"""
    am = mat('utrip', '#ffa21a', 0.3, 0.0, 14); lst = []
    for s in (-1, 1):
        x0, x1 = sorted((s * (hw - 0.06), s * (hw + 0.03)))
        lst += [(x0, x1, yf - 0.3, yf + 0.02, z, z + 0.12), (x0, x1, yr - 0.02, yr + 0.3, z, z + 0.12)]
    boxes('utripalke', lst, am)

def traffic_car(colr, hazard=False, lights=True, sporty=False):
    car(colr, lights=lights, sporty=sporty)
    if hazard: hazards()

def amber_bar(y, z, hw=0.6):
    box('ab_osn', -hw, hw, y - 0.14, y + 0.14, z, z + 0.05, kit.BLACK)
    box('ab_luc', -hw + 0.03, hw - 0.03, y - 0.11, y + 0.11, z + 0.05, z + 0.15, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9), 0.02)

def peaks(lst, snow=0.55):
    """oddaljeni vrhovi: (x, y, r, h)"""
    rk = mat('vrh_s', '#7d7a76', 0.9); sn = mat('vrh_sn', '#f2f5f8', 0.6)
    for (x, y, r, h) in lst:
        rcyl('vrh', r, h, (x, y, h / 2 - 2), rk, r2=r * 0.08, n=9, smooth=False, rot=(0, 0, random.uniform(0, 3)))
        rcyl('vrh_sneg', r * (1 - snow) + 0.5, h * (1 - snow) + 0.2, (x, y, h - 2 - h * (1 - snow) / 2 + 0.1), sn, r2=r * 0.08 * 1.05, n=9, smooth=False)

# ---------------------------------------------------------------- 46 požar v predoru
def tunnel_portal(w=13.0, hh=8.6, L=12.0, ow=4.4, oh=3.4):
    """betonski portal predora: čelo pri y = 0, predor gre v +Y; temna odprtina, globoko notri žari ogenj"""
    cm = mat('beton_p', '#bdb8ae', 0.85); dk = mat('predor_t', '#050505', 1.0)
    box('portal', -w / 2, w / 2, 0, L, -0.6, hh, cm)
    box('portal_venec', -w / 2 - 0.3, w / 2 + 0.3, -0.5, 0.7, hh - 0.7, hh + 0.25, cm, 0.05)
    for s in (-1, 1): rbox('krilo_p', (8.2, 0.9, hh - 2.5), (s * 9.3, 3.0, (hh - 2.5) / 2 - 0.4), cm, rot=(0, 0, s * 0.83))
    box('odprtina', -ow, ow, -0.03, L + 0.1, -0.2, oh, dk)
    rcyl('odprtina_lok', ow, L + 0.13, (0, L / 2 + 0.035, oh), dk, rot=(math.pi / 2, 0, 0), n=28)
    for (z0, z1, e) in ((0.0, 0.6, 3.5), (0.6, 1.3, 1.4), (1.3, 2.2, 0.5)):
        box('zar', -ow * 0.5, ow * 0.5, -0.06, -0.04, z0, z1, mat('zar%g' % e, '#ff6a12', 0.5, 0.0, e))
    no_shadow(box('dim_v', -ow, ow, -1.4, -0.3, 0.0, oh + ow * 0.9, tm('dim_v', '#5a5552', 0.32, rough=1.0)))

def firefighter():
    person('#c9a64a', refl=True)
    box('flasa', -0.14, 0.14, -0.3, -0.13, 0.95, 1.5, mat('flasa', '#d9d9d4', 0.3, 0.6))
    sph('celada', 0.15, (0, 0, 1.72), mat('celada', '#f2c230', 0.4), scl=(1, 1.1, 0.7))

# ---------------------------------------------------------------- 47 gozdni požar
def embers(x0, x1, y0, y1, n=220, z0=1.0, z1=16.0):
    bm = bmesh.new()
    for k in range(n):
        x, y = random.uniform(x0, x1), random.uniform(y0, y1)
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=random.uniform(0.05, 0.13), matrix=MT((x, y, T(x, y) + random.uniform(z0, z1))))
    no_shadow(mk('iskre', bm, mat('iskra', '#ffb040', 0.4, 0.0, 30)))

def flames(pts, s=1.4, z0=0.0, n=6):
    """plameni z oranžnim jedrom (manj presvetljeni kot fire)"""
    fo = mat('plamen_g', '#ff6a12', 0.5, 0.0, 7); fy = mat('plamen_gj', '#ffb030', 0.5, 0.0, 11)
    bm = bmesh.new(); bm2 = bmesh.new()
    for (x, y) in pts:
        z = T(x, y) + z0
        for i in range(n):
            dx, dy = random.gauss(0, 1.0 * s), random.gauss(0, 0.8 * s); hh = random.uniform(1.6, 4.2) * s; r = random.uniform(0.4, 0.9) * s
            bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=r, radius2=0.02, depth=hh, matrix=Matrix.Translation((x + dx, y + dy, z + hh / 2)) @ Matrix.Rotation(random.gauss(0, 0.15), 4, 'X'))
            bmesh.ops.create_cone(bm2, cap_ends=True, segments=6, radius1=r * 0.5, radius2=0.02, depth=hh * 0.55, matrix=Matrix.Translation((x + dx, y + dy, z + hh * 0.28)))
    mk('plameni', bm, fo, smooth=True); mk('plameni_j', bm2, fy, smooth=True)

def burnt_tree(x, y, s=1.0):
    b = snap(); ch = mat('oglje', '#1d1a18', 0.95); lean = random.uniform(-0.1, 0.1)
    rcyl('deblo_o', 0.3, 12, (lean * 6, 0, 6), ch, rot=(0, lean, 0), r2=0.1, n=7)
    for k in range(3):
        a = random.uniform(0, 6.28); hgt = random.uniform(6, 10)
        rbox('veja_o', (0.1, 0.1, 2.6), (lean * hgt + math.cos(a) * 0.9, math.sin(a) * 0.9, hgt), ch, rot=(math.sin(a) * 0.7, -math.cos(a) * 0.7, 0))
    group(b, 'pozgano', x, y, random.uniform(0, 6), tilt=False, scale=s)

def farmhouse(x, y, h):
    b = snap(); wm = mat('zid_f', '#efe6d4', 0.8); rf = mat('plocevina', '#9aa0a6', 0.45, 0.6); vr = mat('veranda', '#6b5440', 0.85)
    box('hisa_f', -6, 6, -4.5, 4.5, 0, 3.2, wm)
    hexa('streha_f', [(-6.6, -5.1, 3.2), (6.6, -5.1, 3.2), (6.6, 5.1, 3.2), (-6.6, 5.1, 3.2), (-6.6, -0.05, 5.6), (6.6, -0.05, 5.6), (6.6, 0.05, 5.6), (-6.6, 0.05, 5.6)], rf)
    hexa('veranda_s', [(-6.6, -5.1, 3.2), (6.6, -5.1, 3.2), (6.6, -7.6, 2.6), (-6.6, -7.6, 2.6), (-6.6, -5.1, 3.35), (6.6, -5.1, 3.35), (6.6, -7.6, 2.75), (-6.6, -7.6, 2.75)], rf)
    for xx in (-6.2, -2, 2, 6.2): box('steber_v', xx - 0.1, xx + 0.1, -7.5, -7.3, 0, 2.6, vr)
    boxes('okna_f', [(-4.5, -2.5, -4.53, -4.5, 1.0, 2.2), (2.5, 4.5, -4.53, -4.5, 1.0, 2.2), (-0.6, 0.6, -4.53, -4.5, 0, 2.2)], mat('okno_h', '#2a3440', 0.2))
    rcyl('rezervoar', 1.6, 2.6, (8.5, 2, 1.3), mat('rezervoar', '#c9ced3', 0.4, 0.7), n=20)
    return group(b, 'kmetija', x, y, h, tilt=False)

# ---------------------------------------------------------------- 48 narasla reka
def flood_truck(colr='#f07a12'):
    cm = mat('kab' + colr, colr, 0.35); hw, r = 1.2, 0.62
    kit.cab('kabina', hw, 1.0, 3.2, 1.25, 3.3, 0.25, cm, 0.08)
    kit.windscreen(hw, 3.2, 1.25, 3.3, 0.25, 2.2, 3.15)
    kit.side_window(hw, 1.9, kit.yfront(3.2, 0.25, 1.25, 3.3, 2.2) - 0.12, kit.yfront(3.2, 0.25, 1.25, 3.3, 3.1) - 0.12, 2.2, 3.1)
    box('sasija', -0.45, 0.45, -3.6, 3.2, 0.9, 1.25, kit.DARK)
    box('odbijac', -1.18, 1.18, 3.15, 3.4, 0.9, 1.3, kit.DARK, 0.04)
    plain_lights(hw, 3.24, 1.55)
    box('keson_r', -hw, hw, -3.8, 0.8, 1.25, 1.65, cm, 0.04)
    rl = [(-hw, -hw + 0.08, -3.8, 0.8, 2.3, 2.4), (hw - 0.08, hw, -3.8, 0.8, 2.3, 2.4), (-hw, hw, -3.8, -3.72, 2.3, 2.4), (-hw, hw, 0.72, 0.8, 1.65, 2.4)]
    for yy in (-3.75, -2.2, -0.7, 0.75):
        for s in (-1, 1): rl.append((s * hw - 0.05, s * hw + 0.05, yy - 0.05, yy + 0.05, 1.65, 2.4))
    boxes('ograja_k', rl, kit.DARK)
    for s in (-1, 1): box('klop', s * 0.95 - 0.2, s * 0.95 + 0.2, -3.6, 0.6, 1.65, 1.95, mat('klop_k', '#3a3d42', 0.6))
    cols = ['#2f6fb0', '#e8506a', '#3a9a4a', '#f2c230', '#9a4ac4', '#f2f2ee']
    for k, (xx, yy) in enumerate(((-0.9, -0.2), (-0.9, -1.4), (-0.9, -2.6), (0.9, -0.6), (0.9, -1.9))):
        b2 = snap(); seated(cols[k % len(cols)]); group(b2, 'putnik', xx, yy, math.pi / 2 * (1 if xx < 0 else -1), z=1.55, tilt=False)
    rcyl('dihalnik', 0.09, 2.2, (hw + 0.12, 2.6, 2.7), kit.BLACK, n=8)
    amber_bar(2.2, 3.3, 0.75)
    wheels([(2.2, False), (-2.4, False)], r, 0.42, 1.0)

def timber_bridge(i0, i1):
    """lesen most na delu ceste ROAD[i0:i1]: krov, ograja in lesene opornice do dna reke"""
    wd = mat('les_most', '#7a6046', 0.9); wd2 = mat('les_most_t', '#4f3e30', 0.9)
    ribbon_r('krov', -RHW - 0.5, RHW + 0.5, -0.02, wd2, i0, i1)
    for s in (-1, 1): rail(s * (RHW + 0.5), -0.7, 0.0, wd2, i0, i1, 'rob_mostu')
    bm = bmesh.new()
    for i in range(i0, i1, 2):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 0.3)); z = ROAD[i][2]
            bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, z + 0.55), (0, 0, h), (0.16, 0.16, 1.1)))
    mk('stebricki', bm, wd)
    for s in (-1, 1):
        for zz in (0.55, 1.0): rail(s * (RHW + 0.3), zz, zz + 0.12, wd, i0, i1, 'letev')
    bm = bmesh.new()
    for i in range(i0 + 3, i1 - 2, 6):
        x, y, z = ROAD[i]; h = heading_at(i)
        for s in (-1, -0.33, 0.33, 1):
            px, py = x + math.cos(h) * s * (RHW + 0.2), y + math.sin(h) * s * (RHW + 0.2)
            zb = BASE(px, py) - 0.5
            bmesh.ops.create_cube(bm, size=1.0, matrix=MT((px, py, (zb + z - 0.6) / 2), (0, 0, h), (0.35, 0.35, z - 0.6 - zb)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, z - 0.85), (0, 0, h), (2 * RHW + 1.4, 0.4, 0.4)))
    mk('opornice', bm, wd2)

def viaduct(x, y0, y1, zt, span=11.0, w=5.0):
    """opečni železniški viadukt z oboki vzdolž osi y"""
    br = mat('opeka_v', '#9a5a44', 0.9); bm = bmesh.new()
    r = (span - 2.0) / 2; zs = zt - 1.2 - r - 0.3; n = int(round((y1 - y0) / span))
    for k in range(n + 1):
        y = y0 + k * span; zb = min(BASE(x - w / 2, y), BASE(x + w / 2, y)) - 2.0
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y, (zb + zt - 1.2) / 2), (0, 0, 0), (w, 2.0, zt - 1.2 - zb)))
        if k < n:
            cy = y + span / 2
            for j in range(10):
                a0, a1 = math.pi * j / 10, math.pi * (j + 1) / 10
                ya, yb = cy - r * math.cos(a0), cy - r * math.cos(a1); zb2 = zs + r * math.sin((a0 + a1) / 2)
                bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, (ya + yb) / 2, (zb2 + zt - 1.2) / 2), (0, 0, 0), (w, yb - ya + 0.02, zt - 1.2 - zb2)))
    yA, yB = y0 - 1, y0 + n * span + 1
    bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, (yA + yB) / 2, zt - 0.6), (0, 0, 0), (w + 0.4, yB - yA, 1.2)))
    for s in (-1, 1): bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x + s * (w / 2 + 0.05), (yA + yB) / 2, zt + 0.5), (0, 0, 0), (0.3, yB - yA, 1.0)))
    mk('viadukt', bm, br)

def logs(lst, z):
    bm = bmesh.new()
    for (x, y, a, L) in lst:
        bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.32, radius2=0.25, depth=L, matrix=MT((x, y, z), (math.pi / 2, 0, a)))
    mk('hlodi', bm, mat('hlod', '#5a4632', 0.9))

# ---------------------------------------------------------------- 49 zataknjeno kolo
def ferris_wheel(R=24.0, hub=27.0, n=18):
    st = mat('kolo_jeklo', '#ece9e2', 0.4, 0.3); bm = bmesh.new()
    for yy in (-1.4, 1.4):
        torus_bm(bm, R, 0.32, MT((0, yy, hub), (math.pi / 2, 0, 0)), 72, 6)
        torus_bm(bm, 2.2, 0.25, MT((0, yy, hub), (math.pi / 2, 0, 0)), 16, 6)
        for k in range(n):
            a = 2 * math.pi * k / n
            tube(bm, (0, yy, hub), (R * math.sin(a), yy, hub - R * math.cos(a)), 0.09, 4)
            a2 = 2 * math.pi * (k + 0.5) / n
            tube(bm, (R * math.sin(a), yy, hub - R * math.cos(a)), (2.2 * math.sin(a2), yy, hub - 2.2 * math.cos(a2)), 0.06, 4)
    for k in range(n):
        a = 2 * math.pi * k / n
        tube(bm, (R * math.sin(a), -1.4, hub - R * math.cos(a)), (R * math.sin(a), 1.4, hub - R * math.cos(a)), 0.12, 4)
    mk('kolo', bm, st)
    lb = bmesh.new()
    for s in (-1, 1):
        for yy in (-6.0, 6.0):
            tube(lb, (s * 12.5, yy, -0.5), (0, yy * 0.3, hub), 0.5, 8)
        tube(lb, (s * 12.5, -6.0, 2.0), (s * 12.5, 6.0, 2.0), 0.3, 6)
    mk('noge', lb, mat('noge_k', '#d9d6cf', 0.5, 0.2))
    cyl('os', 0.9, 4.6, (0, 0, hub), kit.DARK, 'Y', 16)
    gc = ['#e8506a', '#f2c230', '#2f6fb0', '#3a9a4a', '#f07a12', '#9a4ac4']
    G = []
    for k in range(n):
        a = 2 * math.pi * k / n; px, pz = R * math.sin(a), hub - R * math.cos(a)
        rbox('gondola', (2.0, 2.3, 2.1), (px, 0, pz - 1.95), mat('gond' + gc[k % len(gc)], gc[k % len(gc)], 0.4), bev=0.25)
        box('gond_okno', px - 1.02, px + 1.02, -0.95, 0.95, pz - 1.85, pz - 1.15, kit.GLASS)
        box('gond_obesa', px - 0.06, px + 0.06, -0.06, 0.06, pz - 0.9, pz, kit.DARK)
        G.append((px, pz - 1.95))
    box('postaja_k', -7, 7, -5, 5, 0, 1.2, mat('ploscad_k', '#bdb8ae', 0.8))
    hexa('streha_pk', [(-6, -4, 3.6), (6, -4, 3.6), (6, 4, 3.6), (-6, 4, 3.6), (-6, -4, 3.9), (6, -4, 3.9), (6, 4, 3.9), (-6, 4, 3.9)], mat('streha_pk', '#2f6fb0', 0.5))
    return G

def raised_ladder(L):
    """dvižna lestev vzdolž +Y od 0 do L (zgradi ob izhodišču, postavi in nagni)"""
    for i, (w, z0, a, b) in enumerate(((0.95, 0.0, 0.0, 0.45), (0.8, 0.14, 0.3, 0.75), (0.66, 0.28, 0.6, 1.0))):
        m = kit.ALU if i % 2 == 0 else kit.WHITE
        kit.ladder(-w / 2, w / 2, L * a, L * b, z0, 0.32, m, 0.09)
        for s in (-1, 1): box('stranica_l', s * w / 2 - 0.04, s * w / 2 + 0.04, L * a, L * b, z0, z0 + 0.45, m)
    box('podnozje_l', -0.6, 0.6, -0.8, 1.2, -0.35, 0.1, kit.RED)

def basket():
    box('kos_tla', -0.75, 0.75, -0.55, 0.55, 0, 0.08, kit.TREAD)
    lst = []
    for (x, y) in ((-0.72, -0.52), (0.72, -0.52), (-0.72, 0.52), (0.72, 0.52)): lst.append((x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0, 1.1))
    for z in (0.55, 1.05):
        lst += [(-0.76, 0.76, -0.56, -0.48, z, z + 0.06), (-0.76, 0.76, 0.48, 0.56, z, z + 0.06), (-0.76, -0.68, -0.56, 0.56, z, z + 0.06), (0.68, 0.76, -0.56, 0.56, z, z + 0.06)]
    boxes('kos_ograja', lst, kit.ALU)
    box('kos_rob', -0.78, 0.78, -0.58, -0.5, 0.0, 0.3, kit.RED)

# ---------------------------------------------------------------- 50 panji na pašo
def apiary_truck():
    cm = mat('kab_cb', '#f2f2ee', 0.35); hw, r = 1.15, 0.45
    c = kit.cab('kabina', hw, 1.6, 3.4, 0.7, 2.7, 0.25, cm, 0.08); kit.arch(c, 2.4, r, r + 0.08, hw)
    kit.windscreen(hw, 3.4, 0.7, 2.7, 0.25, 1.6, 2.6)
    kit.side_window(hw, 2.1, kit.yfront(3.4, 0.25, 0.7, 2.7, 1.6) - 0.1, kit.yfront(3.4, 0.25, 0.7, 2.7, 2.5) - 0.1, 1.6, 2.5)
    box('sasija', -0.45, 0.45, -4.4, 3.2, 0.45, 0.75, kit.DARK)
    box('odbijac', -1.12, 1.12, 3.32, 3.5, 0.4, 0.72, kit.DARK, 0.03)
    plain_lights(hw, 3.42, 0.85)
    wd = mat('les_cb', '#a0703f', 0.8); rf = mat('streha_cb', '#6b4a32', 0.8)
    b = box('cebelnjak', -1.25, 1.25, -4.6, 1.4, 0.75, 3.0, wd, 0.03); kit.arch(b, -2.9, r, r + 0.1, hw)
    hexa('streha_cb', [(-1.5, -4.9, 3.0), (1.5, -4.9, 3.0), (1.5, 1.7, 3.0), (-1.5, 1.7, 3.0), (-0.05, -4.9, 3.8), (0.05, -4.9, 3.8), (0.05, 1.7, 3.8), (-0.05, 1.7, 3.8)], rf)
    pc = ['#f2c230', '#2f6fb0', '#d6332a', '#3a9a4a', '#f2f2ee', '#e8762a', '#5aa0d8']
    P = {c: [] for c in pc}; slots = []; art = []
    for s in (-1, 1):
        for row in range(3):
            for col in range(8):
                y0 = -4.4 + col * 0.72; z0 = 0.95 + row * 0.68
                x0, x1 = sorted((s * 1.25, s * 1.29))
                P[random.choice(pc)].append((x0, x1, y0, y0 + 0.68, z0, z0 + 0.64))
                xa, xb = sorted((s * 1.29, s * 1.3))
                slots.append((xa, xb, y0 + 0.18, y0 + 0.42, z0 + 0.05, z0 + 0.1))
                art.append((xa, xb, y0 + 0.2, y0 + 0.4, z0 + 0.2, z0 + 0.42))
    for c, lst in P.items():
        if lst: boxes('koncnica', lst, mat('konc_s' + c, c, 0.45, 0.0, 0.25))
    boxes('zrelo', slots, kit.BLACK); boxes('poslikava', art, mat('poslikava', '#7a3a2a', 0.7))
    wheels([(2.4, False), (-2.9, True)], r, 0.3, 0.95)

def bees(cx, cy, cz, n=70, r=2.2):
    bm = bmesh.new()
    for k in range(n):
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.035, matrix=MT((cx + random.gauss(0, r), cy + random.gauss(0, r), cz + random.gauss(0, r * 0.5))))
    no_shadow(mk('cebele', bm, mat('cebela', '#3a2a10', 0.6)))

def hive_hut(x, y, h):
    b = snap(); wd = mat('les_ul', '#8a6440', 0.85)
    box('ulnjak', -2.0, 2.0, -1.2, 1.2, 0.3, 2.2, wd)
    hexa('streha_u', [(-2.3, -1.6, 2.2), (2.3, -1.6, 2.2), (2.3, 1.5, 2.6), (-2.3, 1.5, 2.6), (-2.3, -1.6, 2.35), (2.3, -1.6, 2.35), (2.3, 1.5, 2.75), (-2.3, 1.5, 2.75)], mat('streha_u', '#5a4636', 0.8))
    pc = ['#f2c230', '#2f6fb0', '#d6332a', '#3a9a4a']
    for k in range(5): box('konc_u', -1.9 + k * 0.76, -1.9 + k * 0.76 + 0.66, -1.24, -1.2, 0.6, 1.9, mat('konc' + pc[k % 4], pc[k % 4], 0.6))
    group(b, 'ulnjak', x, y, h, tilt=False)

# ---------------------------------------------------------------- 51 dinozaver na tovornjaku
def dino(colr='#6f8a5a'):
    """kip stegozavra: hrbtne plošče v dveh vrstah, bodice na repu (spredaj +Y)"""
    m = mat('dino' + colr, colr, 0.85); dk = mat('dino_t', '#4f6440', 0.9)
    pa, pb = mat('dino_p1', '#d0702e', 0.7), mat('dino_p2', '#a8542a', 0.7)
    sph('telo_d', 1.0, (0, -0.2, 1.95), m, scl=(1.05, 2.5, 1.15), sub=3)
    sph('vrat_d', 1.0, (0, 2.3, 1.55), m, scl=(0.45, 0.95, 0.45), sub=2, rot=(0.35, 0, 0))
    sph('glava_d', 1.0, (0, 3.25, 1.25), m, scl=(0.32, 0.6, 0.3), sub=2)
    for k in range(8):
        t = k / 7; sph('rep_d', 1.0, (0, -2.5 - t * 4.2, 1.9 - t * 0.9), m, scl=(0.75 - 0.55 * t, 0.9, 0.7 - 0.5 * t), sub=2)
    for (a, sx) in ((0.5, -1), (0.5, 1), (0.9, -1), (0.9, 1)):
        rcyl('bodica', 0.08, 0.9, (sx * 0.35, -6.2 + (a - 0.5) * 1.2, 1.25), dk, r2=0.01, rot=(0, sx * 1.0, 0), n=6)
    for k in range(9):
        t = k / 8; y = 1.6 - t * 5.4; hgt = 0.35 + 0.6 * math.sin(math.pi * min(1.0, 0.15 + t * 0.95))
        zb = 2.9 - 0.9 * (t - 0.4) ** 2
        for s in (-1, 1):
            yy = y + (0.3 if s > 0 else 0.0)
            hexa('plosca', [(s * 0.12 - 0.02, yy - 0.32, zb), (s * 0.12 + 0.02, yy - 0.32, zb), (s * 0.12 + 0.02, yy + 0.32, zb), (s * 0.12 - 0.02, yy + 0.32, zb),
                            (s * (0.2 + 0.15 * hgt) - 0.02, yy - 0.05, zb + hgt), (s * (0.2 + 0.15 * hgt) + 0.02, yy - 0.05, zb + hgt), (s * (0.2 + 0.15 * hgt) + 0.02, yy + 0.05, zb + hgt), (s * (0.2 + 0.15 * hgt) - 0.02, yy + 0.05, zb + hgt)], pa if (k + (s > 0)) % 2 else pb)
    for (lx, ly, rr, hh) in ((-0.6, 1.3, 0.3, 1.4), (0.6, 1.3, 0.3, 1.4), (-0.7, -1.4, 0.42, 1.9), (0.7, -1.4, 0.42, 1.9)):
        rcyl('noga_d', rr, hh, (lx, ly, hh / 2), m, n=10); sph('stopalo_d', rr * 1.25, (lx, ly + 0.15, 0.1), dk, scl=(1, 1.3, 0.35), sub=1)

def lowboy_tractor(colr='#2f6fb0'):
    cm = mat('kab' + colr, colr, 0.35); hw, r = 1.25, 0.5
    c = kit.cab('kabina', hw, 1.0, 3.4, 0.8, 3.4, 0.3, cm, 0.08); kit.arch(c, 2.4, r, r + 0.1, hw)
    kit.windscreen(hw, 3.4, 0.8, 3.4, 0.3, 1.9, 3.25)
    kit.side_window(hw, 2.0, kit.yfront(3.4, 0.3, 0.8, 3.4, 1.9) - 0.12, kit.yfront(3.4, 0.3, 0.8, 3.4, 3.2) - 0.12, 1.9, 3.2)
    box('sasija', -0.45, 0.45, -2.6, 3.2, 0.5, 0.9, kit.DARK)
    box('odbijac', -1.22, 1.22, 3.32, 3.55, 0.42, 0.85, kit.DARK, 0.04)
    plain_lights(hw, 3.44, 0.95); kit.mirrors(hw, 3.0, 1.9)
    amber_bar(2.6, 3.4, 0.9)
    wheels([(2.4, False), (-0.7, True), (-2.0, True)], r, 0.34, 1.0)

def lowboy(load=None, deck_len=12.0):
    lowboy_tractor('#2f6fb0')
    dm = mat('prik_lb', '#3a3d42', 0.6)
    hexa('labod', [(-1.25, -2.6, 1.3), (1.25, -2.6, 1.3), (1.25, 0.4, 1.3), (-1.25, 0.4, 1.3), (-1.25, -2.6, 1.75), (1.25, -2.6, 1.75), (1.25, 0.4, 1.75), (-1.25, 0.4, 1.75)], dm)
    hexa('rampa_lb', [(-1.3, -4.0, 0.55), (1.3, -4.0, 0.55), (1.3, -2.6, 1.3), (-1.3, -2.6, 1.3), (-1.3, -4.0, 0.85), (1.3, -4.0, 0.85), (1.3, -2.6, 1.75), (-1.3, -2.6, 1.75)], dm)
    y1 = -4.0 - deck_len
    box('plato_lb', -1.4, 1.4, y1, -4.0, 0.55, 0.85, dm)
    box('zadek_lb', -1.4, 1.4, y1 - 2.6, y1, 0.85, 1.35, dm)
    wheels([(y1 - 0.6, True), (y1 - 1.6, True), (y1 - 2.6 + 0.4, True)], 0.42, 0.3, 1.0)
    stripe(1.4, y1 - 2.6, -2.6, 0.62, 0.78, mat('odsevni_t', '#f2f2ee', 0.4))
    if load: b2 = snap(); load(); group(b2, 'tovor', 0, -4.0 - deck_len / 2, 0, z=0.85, tilt=False)

def rail_bridge(xb, zr, clear=5.0, hw=30.0, th=1.6, d=7.0):
    """opečni železniški most čez cesto (cesta vzdolž osi x)"""
    br = mat('opeka_m', '#8a4c3a', 0.9); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=MT((xb, 0, zr + clear + th / 2), (0, 0, 0), (d, 2 * hw, th)))
    for s in (-1, 1):
        y0 = s * (RHW + 4.4); y1 = s * hw
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((xb, (y0 + y1) / 2, zr + clear / 2 - 0.5), (0, 0, 0), (d, abs(y1 - y0), clear + 1.0)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((xb + s * (d / 2 - 0.2), 0, zr + clear + th + 0.5), (0, 0, 0), (0.4, 2 * hw, 1.0)))
    mk('most_zel', bm, br)
    yl = mat('pas_r', '#f2c230', 0.5); bl = mat('pas_c', '#1d1d1f', 0.5)
    ly, lb = [], []
    for s in (-1, 1):
        xa, xb2 = sorted((xb + s * d / 2, xb + s * (d / 2 + 0.03)))
        yy = -RHW - 4.4; k = 0
        while yy < RHW + 4.4:
            (ly if k % 2 == 0 else lb).append((xa, xb2, yy, yy + 0.6, zr + clear, zr + clear + 0.4)); yy += 0.6; k += 1
    boxes('pas_r', ly, yl); boxes('pas_c', lb, bl)
    rm = mat('tir', '#9aa0a6', 0.3, 0.9)
    boxes('tiri_m', [(xb + s * 0.72 - 0.05, xb + s * 0.72 + 0.05, -hw, hw, zr + clear + th, zr + clear + th + 0.18) for s in (-1, 1)], rm)

# ---------------------------------------------------------------- 52 hiša na tovornjaku
def house_load():
    cm = mat('kab_hl', '#2f4f6f', 0.35); wh = mat('fasada_h', '#b9c9d6', 0.7); tr = mat('obroba_h', '#f2f2ee', 0.5)
    yl = mat('rumena_t', '#f2c230', 0.5); am = mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)
    box('hauba_t', -1.0, 1.0, 2.4, 4.4, 0.9, 2.1, cm, 0.1)
    box('kabina_t', -1.25, 1.25, 0.2, 2.5, 0.9, 3.3, cm, 0.08)
    box('vetrobran_t', -1.1, 1.1, 2.5, 2.54, 2.15, 3.0, kit.GLASS)
    kit.side_window(1.25, 1.2, 2.3, 2.3, 2.1, 3.0)
    box('sasija_t', -0.45, 0.45, -2.2, 4.3, 0.5, 0.9, kit.DARK)
    box('odbijac_t', -1.2, 1.2, 4.3, 4.6, 0.45, 0.85, kit.CHROME, 0.04)
    box('tabla_s', -0.95, 0.95, 4.6, 4.64, 0.95, 1.4, yl)
    for s in (-1, 1): rcyl('auspuh', 0.1, 2.4, (s * 1.05, 0.05, 3.2), kit.CHROME, n=10)
    amber_bar(1.4, 3.3, 0.9)
    wheels([(3.6, False), (-0.8, True), (-2.1, True)], 0.52, 0.32, 1.0)
    box('prikolica_h', -1.3, 1.3, -17.0, -0.6, 1.1, 1.4, kit.DARK)
    wheels([(-14.6, True), (-15.9, True)], 0.5, 0.3, 1.0)
    box('hisa_t', -2.4, 2.4, -16.4, -1.4, 1.4, 4.5, wh)
    box('streha_ht', -2.55, 2.55, -16.55, -1.25, 4.5, 4.7, mat('strehica', '#4a4d55', 0.8))
    box('folija', -2.42, 2.42, -1.42, -1.36, 1.4, 4.5, tm('folija', '#f4f6f8', 0.7, rough=0.3))
    lst = []
    for s in (-1, 1):
        for yy in (-14.5, -11.3, -8.1, -4.9):
            xa, xb = sorted((s * 2.4, s * 2.44)); lst.append((xa, xb, yy, yy + 1.6, 2.4, 3.8))
    boxes('okna_ht', lst, kit.GLASS)
    for s in (-1, 1):
        xa, xb = sorted((s * 2.41, s * 2.43)); boxes('obroba', [(xa, xb, yy - 0.1, yy + 1.7, 2.3, 2.4) for yy in (-14.5, -11.3, -8.1, -4.9)], tr)
    box('tabla_z', -1.6, 1.6, -16.6, -16.56, 1.6, 2.2, yl)
    for (x, y) in ((-2.4, -16.4), (2.4, -16.4), (-2.4, -1.4), (2.4, -1.4)): box('luc_h', x - 0.12, x + 0.12, y - 0.12, y + 0.12, 4.7, 4.86, am)

def pilot_car():
    pickup('#f2f2ee', light=False)
    amber_bar(0.3, 2.05, 0.65)
    box('tabla_p', -0.95, 0.95, -0.9, -0.85, 2.1, 2.6, mat('rumena_t', '#f2c230', 0.5))
    box('drog_p', -0.04, 0.04, -0.9, -0.86, 1.95, 2.1, kit.BLACK)

def arch_bridge(i0, i1, xa, xb, zs):
    """betonski ločni most: krov sledi cesti ROAD[i0:i1], lok od xa do xb na višini zs (cesta vzdolž osi x)"""
    cm = mat('beton_m', '#ddd8ce', 0.8)
    ribbon_r('krov_l', -RHW - 1.2, RHW + 1.2, -0.03, cm, i0, i1)
    for s in (-1, 1):
        rail(s * (RHW + 1.2), -1.3, 0.0, cm, i0, i1, 'rob_l'); rail(s * (RHW + 1.0), 0.0, 1.0, cm, i0, i1, 'ograja_l')
    yc = sum(ROAD[i][1] for i in range(i0, i1)) / (i1 - i0)
    zd = lambda x: ROAD[idx_near(x, yc)][2]
    bm = bmesh.new(); n = 28; L = xb - xa
    def zarc(t): return zs + (zd(xa + L * t) - 2.4 - zs) * (1 - (2 * t - 1) ** 2)
    for s in (-1, 1):
        prev = None
        for k in range(n + 1):
            t = k / n; p = Vector((xa + L * t, yc + s * (RHW - 0.6), zarc(t)))
            if prev is not None: tube(bm, prev, p, 0.85, 8)
            prev = p
        for k in range(1, 14):
            t = k / 14; x = xa + L * t; z = zarc(t)
            if zd(x) - 1.3 - z > 0.3: bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, yc + s * (RHW - 0.6), (z + zd(x) - 1.3) / 2), (0, 0, 0), (0.9, 0.9, zd(x) - 1.3 - z)))
    for x in (xa - 2.5, xb + 2.5): bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, yc, (zs - 6 + zd(x) - 1.3) / 2), (0, 0, 0), (5.0, 2 * RHW + 2.4, zd(x) - 1.3 - zs + 6)))
    mk('lok_most', bm, cm)

# ---------------------------------------------------------------- 53 snežne verige
def coach(c1='#f2f2ee', c2='#1f6fb0', chains=True):
    m1 = mat('avtob_' + c1, c1, 0.35); m2 = mat('avtob2_' + c2, c2, 0.4); hw = 1.27
    b = box('bus_telo', -hw, hw, -6.2, 6.0, 0.45, 3.65, m1, 0.12)
    for y in (4.3, -2.6, -3.9): kit.arch(b, y, 0.5, 0.62, hw)
    for s in (-1, 1):
        xa, xb = sorted((s * hw, s * (hw + 0.012))); box('okna_bus', xa, xb, -5.8, 4.6, 2.05, 3.25, kit.GLASS)
    box('vetrobran_bus', -1.18, 1.18, 6.0, 6.03, 1.25, 3.45, kit.GLASS)
    stripe(hw + 0.005, -6.2, 6.0, 1.1, 1.5, m2); stripe(hw + 0.005, -6.2, 6.0, 1.62, 1.72, m2)
    box('klima', -0.9, 0.9, -3.5, 1.5, 3.65, 3.95, m1, 0.08)
    box('cilj_bus', -0.9, 0.9, 6.0, 6.04, 3.2, 3.45, mat('cilj_luc', '#ffb030', 0.3, 0.0, 6))
    plain_lights(1.15, 6.03, 0.75)
    for s in (-1, 1): box('zadnja_bus', min(s * 0.9, s * 1.2), max(s * 0.9, s * 1.2), -6.23, -6.2, 0.9, 1.2, kit.REDL)
    wheels([(4.3, False), (-2.6, True), (-3.9, False)], 0.5, 0.32, 1.02)
    if chains:
        bm = bmesh.new()
        for (y, dual) in ((-2.6, True), (4.3, False)):
            ww = 0.32 * (1.85 if dual else 1)
            for s in (-1, 1):
                x = s * (1.02 + (ww - 0.32) / 2)
                for k in range(14):
                    a = 2 * math.pi * k / 14
                    bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y + 0.52 * math.sin(a), 0.5 - 0.52 * math.cos(a)), (a, 0, 0), (ww + 0.06, 0.05, 0.05)))
                    bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x, y + 0.52 * math.sin(a + 0.22), 0.5 - 0.52 * math.cos(a + 0.22)), (a + 0.22, 0.7, 0), (ww * 0.6, 0.04, 0.04)))
        mk('verige', bm, mat('veriga', '#9aa0a6', 0.35, 0.9))

def snow_shed(i0, i1, side=1, hgt=5.8):
    """galerija proti plazovom na ROAD[i0:i1]; side: +1 pobočje levo od smeri ceste"""
    cm = mat('beton_g', '#a9a59c', 0.85); sn = mat('sneg_g', '#f4f7fa', 0.6)
    ribbon_r('streha_g', -RHW - 1.2, RHW + 1.2, hgt, cm, i0, i1)
    ribbon_r('sneg_g', -RHW - 1.0, RHW + 1.0, hgt + 0.45, sn, i0, i1)
    rail(-RHW - 1.2, hgt - 0.7, hgt + 0.45, cm, i0, i1, 'rob_g'); rail(RHW + 1.2, hgt - 0.7, hgt + 0.45, cm, i0, i1, 'rob_g')
    rail(side * (RHW + 1.1), -0.3, hgt, cm, i0, i1, 'zid_g')
    bm = bmesh.new()
    for i in range(i0, i1, 4):
        x, y, z = ROAD[i]; h = heading_at(i); off = -side * (RHW + 0.8)
        px, py = x - math.cos(h) * off, y - math.sin(h) * off
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((px, py, z + hgt / 2), (0, 0, h), (0.7, 0.7, hgt)))
    mk('stebri_g', bm, cm)

# ---------------------------------------------------------------- 54 dirka tovornjakov
def race_truck(c1, c2='#f2f2ee', spray=True):
    m1 = mat('rt' + c1, c1, 0.35); m2 = mat('rt2' + c2, c2, 0.4); hw, r = 1.25, 0.55
    c = kit.cab('kabina', hw, 0.4, 2.7, 0.75, 3.55, 0.35, m1, 0.1); kit.arch(c, 1.7, r, r + 0.1, hw)
    kit.windscreen(hw, 2.7, 0.75, 3.55, 0.35, 2.05, 3.4)
    kit.side_window(hw, 1.3, kit.yfront(2.7, 0.35, 0.75, 3.55, 2.05) - 0.12, kit.yfront(2.7, 0.35, 0.75, 3.55, 3.3) - 0.12, 2.05, 3.3)
    box('spojler_s', -hw - 0.02, hw + 0.02, 2.45, 2.95, 0.18, 0.78, m2, 0.06)
    hexa('spojler_z', [(-hw, 0.4, 3.55), (hw, 0.4, 3.55), (hw, 2.3, 3.55), (-hw, 2.3, 3.55), (-hw, 0.3, 4.25), (hw, 0.3, 4.25), (hw, 2.0, 3.65), (-hw, 2.0, 3.65)], m1, 0.05)
    box('sasija', -0.5, 0.5, -3.4, 2.4, 0.45, 0.9, kit.DARK)
    b = box('zadek_rt', -1.22, 1.22, -3.7, 0.4, 0.6, 1.55, m1, 0.05); kit.arch(b, -2.3, r, r + 0.1, 1.22)
    stripe(hw + 0.005, 0.4, 2.7, 1.55, 2.0, m2); stripe(1.225, -3.7, 0.4, 1.0, 1.25, m2)
    for s in (-1, 1): cyl('st_krog', 0.42, 0.02, (s * (hw + 0.012), 1.5, 2.6), mat('krog_b', '#f2f2ee', 0.5), 'X', 18)
    box('krilo_rt', -1.1, 1.1, -3.9, -3.55, 1.9, 2.0, kit.BLACK)
    for s in (-1, 1): box('nosilec_rt', s * 0.7 - 0.04, s * 0.7 + 0.04, -3.8, -3.65, 1.55, 1.9, kit.BLACK)
    wheels([(1.7, False), (-2.3, True)], r, 0.36, 1.0)
    if spray:
        sm = tm('prsenje', '#f2f6fa', 0.22, rough=0.8)
        for k in range(10):
            for s in (-1, 1): no_shadow(sph('prsenje', 0.35 + 0.12 * k, (s * (1.1 + 0.05 * k), -2.6 - k * 0.75, 0.5 + 0.12 * k), sm, sub=2))

def grandstand(L=60.0, rows=9):
    """tribuna: spredaj (y = 0) gleda proti -Y"""
    cm = mat('tribuna', '#b9b6af', 0.8); rf = mat('tribuna_s', '#e9e6df', 0.6)
    bm = bmesh.new()
    for k in range(rows): hexa_bm(bm, bb(-L / 2, L / 2, k * 0.85, (k + 1) * 0.85, 0, 0.6 + k * 0.55))
    mk('stopnice_t', bm, cm)
    cols = ['#d6332a', '#2f6fb0', '#f2c230', '#f2f2ee', '#3a9a4a', '#1d1d1f']
    G = {c: bmesh.new() for c in cols}
    for k in range(rows):
        x = -L / 2 + 0.4
        while x < L / 2 - 0.4:
            if random.random() < 0.8:
                hexa_bm(G[random.choice(cols)], bb(x - 0.18, x + 0.18, k * 0.85 + 0.25, k * 0.85 + 0.55, 0.6 + k * 0.55, 1.25 + k * 0.55))
            x += 0.55
    for c, b_ in G.items(): mk('gledalci', b_, mat('gled' + c, c, 0.8))
    top = rows * 0.55 + 4.0
    box('streha_t', -L / 2 - 1, L / 2 + 1, -1.5, rows * 0.85 + 1, top, top + 0.35, rf)
    for x in range(int(-L / 2), int(L / 2) + 1, 10): box('steber_t', x - 0.15, x + 0.15, rows * 0.85 + 0.3, rows * 0.85 + 0.6, 0, top, cm)
    box('zadnja_t', -L / 2, L / 2, rows * 0.85, rows * 0.85 + 0.3, 0, top, cm)

def tyre_wall(off, i0, i1, rows=3):
    """kupi gum ob progi; off > 0 levo"""
    bm = bmesh.new()
    for i in range(i0, i1, 1):
        x, y, z = ROAD[i]; h = heading_at(i); px, py = x - math.cos(h) * off, y - math.sin(h) * off
        for r in range(rows):
            bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.33, radius2=0.33, depth=0.24, matrix=MT((px, py, T(px, py) + 0.12 + r * 0.25)))
    mk('gume_s', bm, kit.RUB)

# ---------------------------------------------------------------- 55 medvedi
def bear(colr='#5a3a22'):
    m = mat('medved' + colr, colr, 0.95); dk = mat('gobec_m', '#8a6a4a', 0.9)
    sph('telo_m', 1.0, (0, 0, 1.0), m, scl=(0.55, 1.05, 0.6), sub=2)
    sph('grba_m', 1.0, (0, 0.45, 1.35), m, scl=(0.45, 0.45, 0.35), sub=2)
    sph('glava_m', 1.0, (0, 1.1, 1.2), m, scl=(0.3, 0.38, 0.3), sub=2)
    sph('gobec_m', 1.0, (0, 1.45, 1.12), dk, scl=(0.15, 0.2, 0.14), sub=1)
    for sx in (-1, 1): sph('uho_m', 0.09, (sx * 0.18, 1.02, 1.47), m, sub=1)
    for (lx, ly) in ((-0.3, 0.6), (0.3, 0.6), (-0.3, -0.6), (0.3, -0.6)): rcyl('noga_m', 0.16, 0.85, (lx, ly, 0.42), m, n=8)

def ranger():
    pickup('#2f4a36', light=False)
    kit.lightbar(0.25, 1.97, 0.7, col=kit.REDL)
    stripe(0.99, -2.7, 2.6, 0.75, 0.85, mat('rang_trak', '#e9c46a', 0.5))

# ---------------------------------------------------------------- Riviera (45)
def sailboat(L=9.0):
    wh = mat('jadrnica', '#f4f4f0', 0.3); sl = mat('jadro', '#f8f8f4', 0.6)
    hexa('trup_jd', [(-L * 0.14, -L / 2, -0.1), (L * 0.14, -L / 2, -0.1), (0.05, L / 2, 0.2), (-0.05, L / 2, 0.2),
                     (-L * 0.17, -L / 2, 1.0), (L * 0.17, -L / 2, 1.0), (0.2, L / 2 + 0.6, 1.3), (-0.2, L / 2 + 0.6, 1.3)], wh, 0.04)
    rcyl('jambor', 0.06, L * 1.3, (0, 0.6, 1.0 + L * 0.65), kit.ALU, n=6)
    hexa('jadro', [(0, 0.7, 1.6), (0.02, 0.7, 1.6), (0.02, -L * 0.42, 1.6), (0, -L * 0.42, 1.6), (0, 0.7, L * 1.25), (0.02, 0.7, L * 1.25), (0.02, 0.6, L * 1.25), (0, 0.6, L * 1.25)], sl)
    hexa('flok', [(0, 0.8, 1.5), (0.02, 0.8, 1.5), (0.02, L / 2, 1.3), (0, L / 2, 1.3), (0, 0.8, L * 1.15), (0.02, 0.8, L * 1.15), (0.02, 0.75, L * 1.15), (0, 0.75, L * 1.15)], sl)

def umbrella(x, y, colr):
    z = T(x, y); rcyl('drog_d', 0.03, 2.2, (x, y, z + 1.1), kit.DARK, n=6)
    rcyl('senčnik', 1.3, 0.4, (x, y, z + 2.2), mat('dez_' + colr, colr, 0.6), r2=0.05, n=10)
    box('lezalnik', x - 0.35, x + 0.35, y - 1.9, y - 0.1, z + 0.05, z + 0.35, mat('lezalnik', '#f2f2ee', 0.6))

def viewpoint(x, y, h, r=7.0):
    b = snap(); st = mat('kamen_r', '#d8cdb8', 0.85)
    rcyl('terasa', r, 0.6, (0, 0, -0.3), st, n=28)
    bm = bmesh.new()
    for k in range(26):
        a = math.pi * 1.1 * (k / 25) - math.pi * 0.05
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((r * math.sin(a), -r * math.cos(a), 0.5), (0, 0, a), (0.18, 0.18, 1.0)))
    torus_bm(bm, r, 0.12, MT((0, 0, 1.0)), 40, 4)
    mk('balustrada', bm, st)
    rcyl('daljnogled_s', 0.07, 1.1, (1.5, -r + 1.3, 0.55), kit.DARK, n=8); rbox('daljnogled', (0.25, 0.5, 0.25), (1.5, -r + 1.3, 1.2), mat('dalj', '#2f6f4f', 0.4))
    for (bx, by) in ((-2.5, -r + 1.6), (3.5, -r + 2.4)): box('klop_r', bx - 1.0, bx + 1.0, by - 0.25, by + 0.25, 0.0, 0.45, mat('klop_rv', '#3f6b3a', 0.5))
    return group(b, 'razgled', x, y, h, tilt=False)

# ---------------------------------------------------------------- misije 46–55
def m46():   # Požar v predoru · Uncompahgre
    global BASE, T
    xc = lambda y: -14 + 14 * sst(-160, -20, y)
    B0 = lambda x, y: 26 * sst(12, 55, abs(x - xc(y))) + 1.5 * math.sin(y / 40) + 2.0 * noise(x, y, 9, 11)
    BASE = B0
    set_road([(-14, -175), (-12, -110), (-4, -50), (0, 0), (0, 40), (0, 75)], 3.4)
    BASE = lambda x, y: B0(x, y) + (46 + 10 * noise(x * 1.3, y * 1.1, 7, 5)) * sst(20, 36, y) * (1 + 0.15 * math.sin(x / 13))
    T0 = T
    T = lambda x, y: BASE(x, y) if y > 16.6 else T0(x, y)
    def colf(x, y, z, sl):
        c = mix(lin('#6f7d48'), lin('#86915a'), noise(x, y))
        rk = mix(lin('#8a6f5c'), lin('#a8907a'), 0.5 + 0.5 * math.sin(z * 0.7 + 2 * noise(x, y, 5, 7)))
        return mix(c, rk, sst(0.25, 0.45, sl))
    terrain(340, 230, colf, 0, -40)
    road('asfalt', center=True)
    zr = ROAD[idx_near(0, 16)][2]
    b = snap(); tunnel_portal(); group(b, 'portal', 0, 16, 0, z=zr - 0.3, tilt=False)
    smoke(-1.5, 14.5, zr + 2.5, 1.2, 9, (-0.3, -0.45), True); smoke(1.5, 14.0, zr + 2.5, 1.3, 9, (0.35, -0.5), False)
    st = tm('dim_p', '#3a3634', 0.42, rough=1.0)
    for k in range(10): no_shadow(sph('dim_odp', random.uniform(1.0, 2.2), (random.gauss(0, 2.4), 15.0 - random.uniform(0, 4), zr + random.uniform(5.0, 8.5)), st, scl=(1.4, 1, 0.7), sub=2))
    point_light(0, 13.2, zr + 1.6, 3500, (1.0, 0.45, 0.15), 1.5)
    i = idx_near(0, 2); x, y, h = on_road(i, 0.4)
    b = snap(); kit.v_us(); e = group(b, 'gasilci_p', x, y, h)
    point_light(x, y + 1.6, T(x, y) + 3.4, 60, (1.0, 0.15, 0.1), 0.3)
    hb = bmesh.new(); pp = catmull([(x + 1.5, y - 1.0), (x + 2.8, y + 3.0), (2.4, 10.0), (0.8, 14.0), (0.4, 16.2)], 0.6)
    for (a, c2) in zip(pp, pp[1:]): tube(hb, (a[0], a[1], T(a[0], a[1]) + 0.37), (c2[0], c2[1], T(c2[0], c2[1]) + 0.37), 0.07, 6)
    mk('cev', hb, mat('cev_g', '#d8c69a', 0.7))
    for (px, py, hh) in ((1.4, 13.8, 0.2), (-0.6, 13.0, -0.3), (x + 1.9, y - 2.2, -math.pi / 2)):
        b = snap(); firefighter(); group(b, 'gasilec', px, py, hh)
    for (yy, c) in ((-18, '#d8d8d4'), (-27, '#2f5d9a'), (-36, '#8a1f1f')):
        i2 = idx_near(0, yy); x2, y2, h2 = on_road(i2, -(RHW - 0.9))
        b = snap(); traffic_car(c, hazard=True, lights=False); group(b, 'reseni', x2, y2, h2 + math.pi)
        x3, y3, h3 = on_road(i2 + 1, -(RHW + 1.6)); b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2c230'])); group(b, 'resen', x3, y3, h3 + 1.2)
    xa, ya, ha = on_road(idx_near(0, -12), RHW - 1.2); b = snap(); van_ambulance(); group(b, 'resevalno', xa, ya, ha)
    xp, yp, hp = on_road(idx_near(-3, -54), 1.2); b = snap(); car('#d9d9d4', lights=True, police=True); group(b, 'policija', xp, yp, hp + 0.9)
    for (yy, c) in ((-64, '#3a6e47'), (-73, '#f2f2ee'), (-82, '#5a5d63')):
        x3, y3, h3 = on_road(idx_near(-4, yy), 1.7); b = snap(); traffic_car(c, lights=False); group(b, 'zastoj', x3, y3, h3)
    forest(340, -170, 170, -175, 120, 7, 'iglavec', keep=lambda x, y: (y < 10 or y > 40) and BASE(x, y) < 80)
    bmr = bmesh.new()
    for k in range(50):
        x2, y2 = random.uniform(-80, 80), random.uniform(-60, 30)
        if near_road(x2, y2, 5) or abs(x2) < 8 and y2 > 8: continue
        boulder(bmr, x2, y2, T(x2, y2), random.uniform(0.6, 2.0))
    mk('skale', bmr, mat('skala_u', '#8a7a6a', 0.9))
    sky(colr='#9fc4ea', sun=(46, -25), sun_e=3.6)
    return dict(cam=(26, -36, zr + 22), tgt=(0, 7, zr + 5), lens=30, pts={'portal': (0, 15.5, zr + 9.6), 'gasilci': (x, y, zr + 3.5)})

def m47():   # Gozdni požar · Great Alpine Road
    global BASE
    f0 = lambda x, y: 0.32 * y + 7 * math.sin(x / 38) * math.cos(y / 45) + 3 * noise(x, y, 17, 23)
    hx, hy, dx, dy = 14, -30, -30, -40
    BASE = flat(f0, [(hx, hy, 11, f0(hx, hy)), (dx, dy, 10, f0(dx, dy))])
    set_road([(-170, -4), (-90, 6), (-30, -2), (30, 6), (100, -4), (180, 4)], 3.3)
    fy = lambda x: 24 + 6 * math.sin(x / 23) + 2.5 * math.sin(x / 9)
    def colf(x, y, z, sl):
        c = mix(lin('#7f8a4a'), lin('#9a9a5a'), noise(x, y))
        c = mix(c, lin('#c2ad74'), 0.6 * sst(-12, -22, y))
        burnt = sst(fy(x) - 1.0, fy(x) + 3.0, y)
        return mix(c, mix(lin('#2a2420'), lin('#3e3530'), noise(x * 2, y * 2)), burnt)
    terrain(380, 230, colf, 0, 10); road('asfalt', lines=True)
    flames([(xx, fy(xx) + random.uniform(-0.8, 0.8)) for xx in range(-90, 92, 3)], 1.4)
    for xx in range(-80, 90, 32): point_light(xx, fy(xx) - 2, T(xx, fy(xx)) + 4, 7000, (1.0, 0.5, 0.2), 3)
    for xx in range(-80, 90, 24): smoke(xx, fy(xx) + 4, T(xx, fy(xx)) + 2, 2.4, 11, (1.3, 0.5), xx % 48 == 0)
    embers(-90, 90, -8, 42, 280, 1.0, 18.0)
    n = 0
    while n < 80:
        x, y = random.uniform(-180, 180), random.uniform(-60, 130)
        if near_road(x, y, 6) or abs(y - fy(x)) < 3: continue
        if y > fy(x): burnt_tree(x, y, random.uniform(0.8, 1.15))
        elif y > -12 or abs(x - hx) > 18: eucalyptus(x, y, random.uniform(0.8, 1.15))
        n += 1
    for xx in (-40, 6, 52):
        yy = fy(xx) - 0.5; eucalyptus(xx, yy, 1.0); flames([(xx, yy)], 1.6, z0=8.5, n=9)
    farmhouse(hx, hy, 0.15)
    dz = BASE(dx, dy)
    rcyl('jez_breg', 12.0, 0.5, (dx, dy, dz - 0.15), mat('blato', '#7a6248', 0.95), n=28)
    rcyl('jez_voda', 9.5, 0.2, (dx, dy, dz + 0.12), tm('voda_j', '#4f6260', 0.95, rough=0.08), n=28)
    fence_line([(-70, -16), (70, -16)])
    i = idx_near(4, 2); x, y, h = on_road(i, -1.5)
    b = snap(); kit.v_gozdni(); e = group(b, 'cisterna_g', x, y, h)
    nz = e.matrix_world @ Vector((0.3, 0.6, 3.3))
    jet(nz, (x - 2, fy(x) - 2.0, T(x, fy(x) - 2.0) + 0.6), 3.0)
    for (kx, ky) in ((-8, -19), (-3, -23), (-12, -25)):
        b = snap(); kangaroo(hop=True); group(b, 'kenguru', kx, ky, math.pi / 2 + random.uniform(-0.3, 0.3), scale=1.1)
    sky(colr='#c48a5c', strength=0.8, sun=(70, -55), sun_e=2.6, sun_c=(1.0, 0.6, 0.32))
    return dict(cam=(-56, -86, f0(-56, -86) + 38), tgt=(-6, -20, T(-6, -20) + 3), lens=30,
                pts={'jezerce': (dx, dy, dz + 1.5), 'hisa': (hx, hy, BASE(hx, hy) + 6.5), 'fronta': (24, fy(24), T(24, fy(24)) + 6)})

def m48():   # Narasla reka · Longford
    global BASE, T
    B0 = lambda x, y: 1.3 + 0.9 * noise(x, y, 21, 17)
    BASE = B0
    set_road([(-6, -170), (-3, -70), (0, -26), (0, 26), (3, 70), (10, 170)], 3.2)
    ry = lambda x: 3 * math.sin(x / 40)
    BASE = lambda x, y: B0(x, y) - 4.4 * (1 - sst(9, 21, abs(y - ry(x))))
    T0 = T
    T = lambda x, y: BASE(x, y) if abs(y - ry(x)) < 18.5 else T0(x, y)
    W = 1.2
    def colf(x, y, z, sl):
        c = mix(lin('#6f8c42'), lin('#5f7a3a'), noise(x, y, 21, 25))
        return mix(lin('#6a5a44'), c, sst(W - 0.3, W + 0.6, z))
    terrain(360, 220, colf, 0, 0)
    road2('#55585c', lines=True, center=False, shoulder=None)
    ib0, ib1 = idx_near(0, -19.5), idx_near(0, 19.5)
    sm = mat('bankina', '#7d7466', 0.95)
    for (a, c) in ((0, ib0 + 1), (ib1 - 1, None)):
        for s in (-1, 1): ribbon_r('bankina', s * RHW, s * (RHW + 0.8), 0.02, sm, a, c)
    timber_bridge(ib0, ib1)
    box('reka', -400, 400, -60, 60, -3, W, tm('reka_v', '#7a5e40', 0.93, rough=0.12))
    for yy in (-11, -3, 6, 13):
        x0 = -200
        while x0 < 200:
            L = random.uniform(4, 10)
            if abs(x0) > 8 and random.random() < 0.6: foam_seg(x0, yy + ry(x0) + random.uniform(-2, 2), x0 + L, yy + ry(x0 + L) + random.uniform(-2, 2), W + 0.02, 0.35, 0.22, '#e8dccb')
            x0 += L + random.uniform(10, 26)
    foam_seg(-RHW - 1.2, -17, -RHW - 1.2, 17, W + 0.03, 1.4, 0.7, '#f0e6d8')
    for yy in range(-15, 16, 6): foam_seg(RHW + 1.0, yy - 0.5, RHW + 7.0, yy + 0.5, W + 0.03, 0.9, 0.55, '#f0e6d8')
    L1 = [(-RHW - 1.8 - random.uniform(0, 2.5), random.uniform(-14, 14), random.uniform(-0.3, 0.3), random.uniform(4, 8)) for k in range(9)]
    L2 = [(random.uniform(-150, -20), random.uniform(-12, 12), random.uniform(0, 3), random.uniform(3, 7)) for k in range(10)]
    logs(L1 + L2, W + 0.05)
    viaduct(86, -66, 66, 12.0, 11.0)
    for yy in range(-66, 67, 11):
        if abs(yy - ry(86)) < 18: foam_seg(83.5, yy - 1.0, 88.5, yy + 1.4, W + 0.02, 1.0, 0.5, '#f0e6d8')
    farmhouse(22, 52, 0.1)
    for (px, py) in ((12, 38), (13.2, 38.6), (11, 39.4), (14.4, 39.0)):
        b = snap(); person_wave(random.choice(['#e8506a', '#2f6fb0', '#f2c230', '#3a9a4a'])); group(b, 'caka', px, py, math.pi + random.uniform(-0.4, 0.4))
    i = idx_near(0, 4); x, y, h = on_road(i, -0.6)
    b = snap(); flood_truck('#f07a12'); e = group(b, 'resevalni_t', x, y, h + math.pi, z=ROAD[i][2] + 0.04, tilt=False); headlights(e, 3.3, 1.5, 600)
    n = 0
    while n < 46:
        x2 = random.uniform(-170, 170); s = random.choice((-1, 1)); y2 = ry(x2) + s * random.uniform(19, 34)
        if abs(x2) < 10 or abs(x2 - 86) < 6 or (-45 < x2 < 12 and y2 < -15): continue
        eucalyptus(x2, y2, random.uniform(0.7, 1.05)); n += 1
    for k in range(7):
        b = snap(); sheep(); group(b, 'ovca', random.uniform(-48, -32), random.uniform(-44, -34), random.uniform(0, 6))
    fence_line([(-120, -24), (-12, -24)]); fence_line([(12, -24), (120, -24)])
    rain(x, y, 60, 700, 30, 0.2)
    sky(colr='#98a4ae', strength=1.0, sun=(52, -30), sun_e=1.8, sun_c=(0.9, 0.92, 1.0))
    zb = ROAD[i][2]
    return dict(cam=(-30, -36, zb + 19), tgt=(16, 10, zb + 0.5), lens=28, pts={'kmetija': (13, 39, BASE(13, 39) + 2.6), 'most': (0, 0, zb + 2)})

def m49():   # Zataknjeno kolo · Suzuka
    global BASE
    BASE = lambda x, y: 0.6 * noise(x, y, 31, 27) + 6 * sst(110, 170, y)
    set_road([(-170, 2), (-60, -2), (0, 0), (70, 4), (170, 0)], 3.6)
    def colf(x, y, z, sl):
        c = mix(lin('#6f8c42'), lin('#5f7a3a'), noise(x, y))
        return mix(c, lin('#b9b2a4'), sst(9, 12, y) * (1 - sst(88, 92, y)) * (1 - sst(70, 74, abs(x - 10))))
    terrain(360, 240, colf, 0, 40); road('asfalt', center=True)
    wx, wy = 0, 46; zw = T(wx, wy)
    b = snap(); G = ferris_wheel(); group(b, 'kolo_v', wx, wy, 0, z=zw, tilt=False)
    gx, gz = G[5]
    b = snap(); kit.v_lestev()
    for nme in list(snap() - b):
        if nme.startswith(('lestev', 'kosara')): bpy.data.objects.remove(bpy.data.objects[nme])
    e = group(b, 'lestev', 36, 42.75, 0)
    pv = e.matrix_world @ Vector((0, -2.75, 2.75))
    bx, by, bz = wx + gx + 1.0 + 0.85, wy, zw + gz - 1.05
    tip = Vector((bx + 0.70, by - 0.39, bz + 0.3))
    d = tip - pv; hl = math.hypot(d.x, d.y); L = d.length
    yaw = math.atan2(-d.x, d.y); pitch = math.atan2(d.z, hl)
    b = snap(); raised_ladder(L); el = group(b, 'lestev_d', pv.x, pv.y, yaw, z=pv.z, tilt=False); el.rotation_euler = (pitch, 0, yaw)
    b = snap(); basket()
    b2 = snap(); firefighter(); group(b2, 'gasilec_k', -0.3, 0.1, 0, z=0.08, tilt=False)
    b2 = snap(); person('#e8506a'); group(b2, 'resen_k', 0.35, 0.15, 0.5, z=0.08, tilt=False)
    group(b, 'kos', bx, by, yaw, z=bz, tilt=False)
    sk = mat('koza', '#e2b493', 0.7)
    for (dxh, c) in ((-0.45, '#2f6fb0'), (0.4, '#f2c230')):
        sph('glava_g', 0.13, (wx + gx + dxh, wy - 1.0, zw + gz + 0.45), sk)
    rbox('roka_g', (0.08, 0.08, 0.6), (wx + gx - 0.65, wy - 1.25, zw + gz + 0.95), sk, rot=(0.3, 0.3, 0))
    spot(36, 44.5, zw + 3.6, bx, by, bz + 0.8, 20000, 0.35, (1.0, 0.95, 0.85))
    for k in range(14):
        b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2c230', '#3a9a4a', '#f2f2ee', '#9a4ac4'])); group(b, 'gledalec', random.uniform(8, 30), random.uniform(22, 30), math.pi + random.uniform(-0.5, 0.5))
    for xx in range(4, 34, 2): cone_traffic(xx, 32.5)
    b = snap(); van_ambulance(); group(b, 'resevalno', 52, 22, math.pi / 2 + 0.3)
    b = snap(); car('#d9d9d4', lights=True, police=True); group(b, 'policija', -16, 16, -0.4)
    for k in range(5):
        cx_, cy_ = -40 + k * 9, 70 + random.uniform(-3, 3)
        box('stojnica', cx_ - 1.6, cx_ + 1.6, cy_ - 1.2, cy_ + 1.2, T(cx_, cy_), T(cx_, cy_) + 2.4, mat('stojnica', '#f2efe8', 0.6))
        hexa('stojnica_s', [(cx_ - 1.9, cy_ - 1.5, T(cx_, cy_) + 2.4), (cx_ + 1.9, cy_ - 1.5, T(cx_, cy_) + 2.4), (cx_ + 1.9, cy_ + 1.5, T(cx_, cy_) + 2.4), (cx_ - 1.9, cy_ + 1.5, T(cx_, cy_) + 2.4),
                             (cx_ - 1.9, cy_ - 0.05, T(cx_, cy_) + 3.3), (cx_ + 1.9, cy_ - 0.05, T(cx_, cy_) + 3.3), (cx_ + 1.9, cy_ + 0.05, T(cx_, cy_) + 3.3), (cx_ - 1.9, cy_ + 0.05, T(cx_, cy_) + 3.3)],
             mat('stojnica_r' + str(k % 3), ['#d6332a', '#2f6fb0', '#f2c230'][k % 3], 0.5))
    rcyl('vrtiljak', 6.0, 1.0, (-34, 40, T(-34, 40) + 0.5), mat('vrtiljak', '#e9dcc0', 0.6), n=24)
    rcyl('vrtiljak_s', 6.8, 2.6, (-34, 40, T(-34, 40) + 5.0), mat('vrtiljak_s', '#d6332a', 0.5), r2=0.4, n=24)
    for k in range(10): rcyl('vrtiljak_d', 0.08, 3.4, (-34 + 5 * math.cos(k * 0.628), 40 + 5 * math.sin(k * 0.628), T(-34, 40) + 2.2), kit.ALU, n=6)
    for k in range(22):
        x2, y2 = random.uniform(-80, 90), random.choice((random.uniform(12, 16), random.uniform(84, 100)))
        if random.random() < 0.5: maple(x2, y2, random.uniform(0.9, 1.2))
        else: tree(x2, y2, random.uniform(0.9, 1.2), 'listavec')
    for (lx, ly) in ((-10, 20), (20, 20), (50, 34), (-30, 60), (40, 70)): lamp_post(lx, ly, energy=400)
    sky(colr='#8ea4c4', strength=0.75, sun=(78, -60), sun_e=2.8, sun_c=(1.0, 0.62, 0.36))
    return dict(cam=(56, -16, 18), tgt=(14, 44, 19), lens=28, pts={'kabina': (wx + gx, wy, zw + gz + 1.6), 'kos': (bx, by, bz + 1.4)})

def m50():   # Panji na pašo · Medvode
    global BASE
    BASE = lambda x, y: 10 * math.sin(x / 50) * math.cos(y / 60) + 0.12 * y + 25 * sst(60, 140, y) + 2 * noise(x, y)
    set_road([(-170, -22), (-90, -8), (-24, -14), (30, -2), (100, -12), (180, -2)], 3.0)
    def colf(x, y, z, sl):
        c = mix(lin('#6f8f3e'), lin('#88a24a'), noise(x, y, 11, 15))
        c = mix(c, lin('#a8b45a'), 0.4 * sst(0.55, 0.75, noise(x * 3, y * 3)))
        return mix(c, lin('#d9cf6a'), 0.3 * sst(0.7, 0.85, noise(x * 7, y * 7)))
    terrain(380, 230, colf, 0, 20); road('makadam', lines=False)
    kozolec(-34, 10, 0.2)
    church(70, 92, 0.3, '#f2efe8', '#8a3b2a', '#3a3d42', 24)
    for (hx, hy, hh) in ((96, 22, 0.2), (110, 34, 1.4), (88, 40, -0.3), (122, 18, 0.8), (104, 52, 0.1)):
        house(hx, hy, hh, 8, 10, 3.4, random.choice(['#f2efe8', '#efe3c8', '#e9dcc8']), '#8a3b2a')
    forest(150, -170, 170, 70, 160, 6, 'listavec'); forest(90, -170, 170, 80, 160, 6, 'iglavec')
    forest(26, -170, 170, -120, -50, 6, 'listavec')
    oak(46, 30, 1.3)
    for (ux, uy) in ((38, 24), (44, 20), (52, 25)): hive_hut(ux, uy, math.pi + 0.3)
    bees(44, 22, T(44, 22) + 2.0, 60, 2.5)
    i = idx_near(0, -8); x, y, h = on_road(i, 1.2)
    b = snap(); apiary_truck(); e = group(b, 'cebele', x, y, h); headlights(e, 3.4, 0.85, 300)
    sky(colr='#f0c08a', strength=0.85, sun=(76, -100), sun_e=3.0, sun_c=(1.0, 0.75, 0.48))
    cam = behind(x, y, h, 12, 7, side=8); tgt = ahead(x, y, h, 6, 1.0, side=-1)
    return dict(cam=cam, tgt=tgt, lens=28, pts={'pasa': (44, 22, T(44, 22) + 4), 'cebele': (x, y, T(x, y) + 4.2)})

def m51():   # Dinozaver na tovornjaku · Crystal Palace
    global BASE
    BASE = lambda x, y: 0.05 * x + 1.5 * math.sin(y / 30) + 0.5 * noise(x, y)
    set_road([(-170, 0), (-60, 1), (0, 0), (60, -1), (170, 0)], 3.6)
    terrain(360, 200, lambda x, y, z, sl: mix(lin('#5f7f3a'), lin('#6f8c42'), noise(x, y)), 0, 0)
    road2('#4a4d52', lines=False, center=True, shoulder=None)
    pv = mat('plocnik', '#b9b6af', 0.85); rb = mat('robnik', '#d9d6cf', 0.7)
    for s in (-1, 1):
        ribbon('plocnik', s * RHW, s * (RHW + 3.6), 0.16, pv); rail(s * RHW, -0.2, 0.16, rb, name='robnik')
    xb = 34; zr = ROAD[idx_near(xb, 0)][2]
    rail_bridge(xb, zr, 5.0)
    for yy in (-9, 7):
        b = snap(); wagon('#2f6f4f'); group(b, 'vlak', xb, yy, 0, z=zr + 6.6, tilt=False)
    for s in (-1, 1):
        terrace(-170, xb - 6, s * (RHW + 3.6), s); terrace(xb + 6, 170, s * (RHW + 3.6), s)
    for xx in range(-150, 160, 13):
        if abs(xx - xb) < 10: continue
        for s in (-1, 1): tree(xx + random.uniform(-2, 2), s * (RHW + 2.4), 1.35, 'listavec')
    bm_v = mat('veja_v', '#4a3626', 0.9)
    for (vx, s) in ((14, 1), (-10, -1)):
        rbox('veja', (0.22, 4.2, 0.22), (vx, s * (RHW + 0.6), zr + 4.8), bm_v, rot=(s * 0.25, 0, 0))
        sph('listje_v', 1.6, (vx, s * (RHW - 1.0), zr + 5.0), mat('listje', '#4f7a34', 0.9), scl=(1.4, 1.2, 0.7), sub=2)
    cols = ['#d8d8d4', '#2a2a2c', '#7f8a93', '#2f5d9a', '#8a1f1f', '#3a6e47', '#f2f2ee']
    for xx in range(-140, 150, 7):
        if abs(xx - xb) < 12: continue
        for s in (-1, 1):
            if random.random() < 0.7:
                x2, y2, h2 = on_road(idx_near(xx, 0), s * (RHW - 1.0))
                b = snap(); car(random.choice(cols)); group(b, 'parkiran', x2, y2, h2 + (0 if s < 0 else math.pi))
    i = idx_near(-6, 0); x, y, h = on_road(i, 0.0)
    b = snap(); lowboy(dino); e = group(b, 'dino_t', x, y, h)
    x2, y2, h2 = on_road(i + 22, 0.2); b = snap(); car('#f2f2ee', lights=True); amber_bar(-0.3, 1.47); group(b, 'spremstvo', x2, y2, h2)
    for k in range(5):
        s = random.choice((-1, 1)); x3, y3, h3 = on_road(idx_near(random.uniform(-40, 20), 0), s * (RHW + 1.8))
        b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2c230'])); group(b, 'pesec', x3, y3, h3 + math.pi / 2 * s)
    sky(colr='#b4c0cc', strength=1.0, sun=(48, 30), sun_e=2.6)
    cam = behind(x, y, h, 34, 15, side=-2.5); tgt = ahead(x, y, h, 10, 0.5)
    return dict(cam=cam, tgt=tgt, lens=28, pts={'most': (xb - 3.5, 0, zr + 5.8), 'dino': (x - 10, y, zr + 5.2)})

def m52():   # Hiša na tovornjaku · Big Sur
    global BASE, T
    B0 = lambda x, y: 30 + 0.22 * y + 3 * math.sin(x / 50)
    def cliff(x, y): return B0(x, y) * sst(-50, -18, y) - 8 * (1 - sst(-64, -46, y))
    BASE = cliff
    set_road([(-170, 8), (-90, 2), (-20, -2), (40, 0), (110, 0), (180, 8)], 3.5)
    canyon = lambda x, y: 34 * math.exp(-((x - 70) / 13) ** 2) * sst(-70, -10, y) * (1 - sst(40, 120, y))
    BASE = lambda x, y: cliff(x, y) - canyon(x, y)
    T0 = T
    T = lambda x, y: BASE(x, y) if abs(x - 70) < 24 and abs(y) < 12 else T0(x, y)
    def colf(x, y, z, sl):
        c = mix(lin('#6f7a45'), lin('#8a8a55'), noise(x, y))
        c = mix(c, lin('#7a6a58'), sst(0.3, 0.55, sl))
        return mix(lin('#c9b48a'), c, sst(0.5, 2.0, z))
    terrain(420, 240, colf, 20, -20); road('asfalt', center=True)
    box('morje', -600, 600, -600, 60, -12, 0.0, tm('morje_bs', '#2a6f8a', 0.9, rough=0.08))
    shore_foam(-200, 220, -90, 10, 1.5, 0.5, 0.6, 0.7)
    for k in range(9):
        yy = -64 - k * 9; x0 = -200
        while x0 < 220:
            L = random.uniform(10, 26); foam_seg(x0, yy + random.uniform(-1.5, 1.5), x0 + L, yy + random.uniform(-1.5, 1.5), 0.02, 1.0, 0.35); x0 += L + random.uniform(8, 20)
    rk = mat('cer', '#4a4440', 0.9)
    for k in range(12):
        sx, sy = random.uniform(-150, 200), random.uniform(-62, -50)
        sph('cer', 1.0, (sx, sy, -0.8), rk, scl=(random.uniform(2, 4), random.uniform(1.5, 3), random.uniform(2, 3.5)), sub=2)
    for k in range(5): cloud(random.uniform(-300, 300), random.uniform(-420, -220), 12, random.uniform(60, 120), random.uniform(25, 40), 8, '#f2f4f6', 0.45)
    i0, i1 = idx_near(42, 0), idx_near(98, 0)
    arch_bridge(i0, i1, 52, 88, 4.0)
    n = 0
    while n < 70:
        x2, y2 = random.uniform(-190, 220), random.uniform(-30, 110)
        if near_road(x2, y2, 6) or abs(x2 - 70) < 16: continue
        if y2 > 20: tree(x2, y2, random.uniform(0.8, 1.2), 'iglavec')
        else: bush(x2, y2, random.uniform(0.8, 1.4), '#4f5a36')
        n += 1
    i = idx_near(6, -1); x, y, h = on_road(i, 0.9)
    b = snap(); house_load(); e = group(b, 'hisa_t', x, y, h)
    xp, yp, hp = on_road(i + 30, 1.6); b = snap(); pilot_car(); group(b, 'spremstvo1', xp, yp, hp)
    xq, yq, hq = on_road(i - 26, 1.6); b = snap(); pilot_car(); group(b, 'spremstvo2', xq, yq, hq)
    for (dd, c) in ((-48, '#2f5d9a'), (-56, '#f2f2ee'), (-64, '#8a1f1f')):
        x3, y3, h3 = on_road(i + dd, -2.4); b = snap(); traffic_car(c, hazard=True); group(b, 'caka', x3, y3, h3 + math.pi)
    b = snap(); camper('#f2f2ee'); x3, y3, h3 = on_road(i - 72, -2.4); group(b, 'kamper', x3, y3, h3 + math.pi)
    sky(colr='#a8c8e8', sun=(42, -30), sun_e=3.6)
    zr = ROAD[i][2]
    return dict(cam=(-8, -84, zr + 26), tgt=(36, 0, zr - 10), lens=30, pts={'most': (70, 0, ROAD[idx_near(70, 0)][2] + 3), 'hisa': (x - 9, y, zr + 5.2)})

def m53():   # Snežne verige · Los Caracoles
    global BASE
    BASE = lambda x, y: 0.55 * y + 6 * math.sin(x / 30) + 2 * noise(x, y)
    set_road([(-40, -130), (40, -105), (-30, -80), (40, -55), (-30, -30), (40, -5), (-30, 20), (40, 45), (-10, 70)], 3.2)
    def colf(x, y, z, sl):
        sn = mix(lin('#f2f5f8'), lin('#dfe5ec'), noise(x, y))
        rk = mix(lin('#6e6a64'), lin('#8a8478'), noise(x * 2, y * 2))
        return mix(sn, rk, sst(0.36, 0.52, sl))
    terrain(420, 320, colf, 0, -30)
    bmr = bmesh.new()
    for k in range(90):
        x2, y2 = random.uniform(-120, 120), random.uniform(-150, 90)
        if near_road(x2, y2, 4): continue
        boulder(bmr, x2, y2, T(x2, y2), random.uniform(0.8, 3.0))
    mk('skale_a', bmr, mat('skala_a', '#5f5b55', 0.9))
    pm = mat('kol_s', '#f07a12', 0.5); bmp = bmesh.new()
    for i in range(0, len(ROAD), 12):
        for s in (-1, 1):
            x2, y2, h2 = on_road(i, s * (RHW + 1.4)); bmesh.ops.create_cube(bmp, size=1.0, matrix=MT((x2, y2, T(x2, y2) + 1.0), (0, 0, 0), (0.1, 0.1, 2.0)))
    mk('snezni_koli', bmp, pm)
    road2('#c9cfd6', lines=False, center=False, shoulder='#e9eef2', rough=0.6)
    km = mat('kolesnice', '#5e646c', 0.4)
    for (a, c) in ((0.5, 1.0), (2.2, 2.7)):
        for s in (-1, 1): ribbon('kolesnice', s * a, s * c, 0.05, km)
    snm = mat('sneg_rob', '#f4f7fa', 0.6)
    for s in (-1, 1): rail(s * (RHW + 0.85), -0.4, 0.75, snm, name='snezni_rob')
    peaks([(-260, 300, 150, 300), (-40, 420, 190, 360), (220, 360, 160, 280), (360, 160, 130, 220), (-380, 120, 120, 200)])
    snow_shed(idx_near(-6, 28), idx_near(28, 40), side=1)
    i = idx_near(10, -16); x, y, h = on_road(i, 1.3)
    b = snap(); coach(); e = group(b, 'avtobus_v', x, y, h); headlights(e, 6.0, 0.8, 800)
    j = idx_near(36, -54); xj, yj, hj = on_road(j, 0.0)
    b = snap(); box_truck('#2f6fb0', '#e9e6df'); hazards(1.3, 3.45, -5.2, 0.9); group(b, 'zaprt', xj, yj, hj + 0.9)
    for (dd, c) in ((-20, '#8a1f1f'), (-30, '#f2f2ee')):
        x3, y3, h3 = on_road(i + dd, 1.3); b = snap(); traffic_car(c); group(b, 'za_busom', x3, y3, h3)
    snowfall(x, y + 20, 70, 1400, 30)
    sky(colr='#9db6cf', strength=1.0, sun=(40, -20), sun_e=2.6)
    cam = (24, -124, BASE(24, -124) + 60)
    return dict(cam=cam, tgt=(4, 8, T(4, 8)), lens=26, pts={'bus': (x, y, T(x, y) + 4.2), 'galerija': (10, 34, T(10, 34) + 7.5), 'tovornjak': (xj, yj, T(xj, yj) + 4.5)})

def m54():   # Dirka tovornjakov · Nürburg
    global BASE
    BASE = lambda x, y: 8 * math.sin(x / 70) * math.cos(y / 60) + 0.04 * y + 35 * math.exp(-((x + 130) ** 2 + (y - 170) ** 2) / 4000)
    set_road([(-170, -30), (-90, -28), (-30, -20), (12, 0), (24, 40), (16, 90), (0, 170)], 7.0, smooth=6)
    gx, gy = 40, -16
    def colf(x, y, z, sl):
        c = mix(lin('#5f7f3a'), lin('#6f8c42'), noise(x, y))
        return mix(c, lin('#c9b48a'), (1 - sst(16, 22, math.hypot(x - gx, y - gy))) * (1 - near_road(x, y, 1.2)))
    terrain(400, 260, colf, 0, 20); road('asfalt', lines=True)
    ia, ib = idx_near(-20, -18), idx_near(26, 50)
    kerbs(RHW - 0.9, RHW + 0.2, ia, ib); kerbs(-RHW + 0.9, -RHW - 0.2, ia, ib)
    tyre_wall(-(RHW + 22), idx_near(0, -12), idx_near(32, 26), 3)
    fm = tm('mreza_t', '#9aa0a6', 0.28, rough=0.6)
    rail(-(RHW + 23), 0.0, 3.6, fm, idx_near(-10, -16), idx_near(32, 30), 'mreza')
    b = snap(); grandstand(64, 9); group(b, 'tribuna', -18, 30, 0.785, tilt=False)
    castle(-130, 172, 1.2)
    keep = lambda x, y: not near_road(x, y, 14) and math.hypot(x - gx, y - gy) > 34 and math.hypot(x + 18, y - 30) > 42 and math.hypot(x + 130, y - 172) > 30
    forest(260, -200, 200, -110, 150, 0, 'iglavec', keep=keep); forest(120, -200, 200, -110, 150, 0, 'listavec', keep=keep)
    cols = [('#d6332a', '#f2f2ee'), ('#f2c230', '#1d1d1f'), ('#1f4fa8', '#f2f2ee'), ('#2f2f33', '#f07a12'), ('#3a9a4a', '#f2f2ee'), ('#f07a12', '#1f4fa8')]
    ip = idx_near(14, 6)
    E = None
    for k, (c1, c2) in enumerate(cols):
        ii = ip + 16 * (2 - k); x2, y2, h2 = on_road(ii, (-2.0 if k % 2 else 1.6))
        b = snap(); race_truck(c1, c2, spray=(k != 0)); e = group(b, 'dirkalni_t' if k == 2 else 'tekmec_t', x2, y2, h2 + (0.12 if k == 2 else 0))
        if k == 2: E = (x2, y2)
    sky(colr='#a9c0d6', sun=(46, 200), sun_e=3.4)
    return dict(cam=(58, -46, 24), tgt=(8, 4, 2), lens=30, pts={'igralec': (E[0], E[1], T(E[0], E[1]) + 4.6)})

def m55():   # Medvedi na cesti · Beartooth
    global BASE
    f0 = lambda x, y: 6 * math.sin(x / 45) * math.cos(y / 38) + 3 * noise(x, y, 13, 17) + 0.04 * y
    lakes = [(-62, 44, 18), (74, -48, 22)]
    def base(x, y):
        z = f0(x, y)
        for (cx, cy, r) in lakes: z -= 6.0 * (1 - sst(r * 0.6, r * 1.3, math.hypot(x - cx, y - cy)))
        return z
    BASE = base
    set_road([(-170, -10), (-80, 6), (-20, 0), (40, -8), (110, 4), (180, 0)], 3.2)
    def colf(x, y, z, sl):
        c = mix(lin('#8a8a52'), lin('#a49a62'), noise(x, y, 9, 13))
        c = mix(c, lin('#6f6a5e'), sst(0.3, 0.5, sl))
        sn = sst(0.58, 0.66, noise(x * 2.3 + 40, y * 2.1)) * sst(0.0, 2.5, z)
        return mix(c, lin('#f2f5f8'), sn)
    terrain(380, 230, colf, 0, 0); road('asfalt', center=True)
    for (cx, cy, r) in lakes: rcyl('jezero', r * 1.15, 0.2, (cx, cy, f0(cx, cy) - 2.8), tm('jezero_v', '#3f6f8f', 0.92, rough=0.06), n=36)
    sw = mat('sneg', '#eef2f6', 0.6)
    for i in range(0, len(ROAD), 9):
        if random.random() < 0.3:
            s = random.choice((-1, 1)); x2, y2, h2 = on_road(i, s * (RHW + 2.4))
            sph('snezni_kup', 1.0, (x2, y2, T(x2, y2) - 0.05), sw, scl=(random.uniform(1.6, 3.0), random.uniform(0.8, 1.4), random.uniform(0.25, 0.45)), sub=2, rot=(0, 0, h2))
    rk = mat('skala_b', '#6f6a62', 0.9); bmr = bmesh.new()
    for k in range(60):
        x2, y2 = random.uniform(-180, 180), random.uniform(-110, 110)
        if near_road(x2, y2, 4): continue
        boulder(bmr, x2, y2, T(x2, y2), random.uniform(0.5, 1.8))
    mk('skale', bmr, rk)
    peaks([(720, -150, 150, 150), (780, 120, 170, 180), (660, 340, 140, 140), (-640, 300, 150, 160)], 0.45)
    ib = idx_near(12, -3); bx, by, bh = on_road(ib, 0.4)
    b = snap(); bear('#5a3a22'); group(b, 'medved', bx, by, bh + math.pi / 2 + 0.3)
    for (dd, sd) in ((-3, 2.2), (2, -1.4)):
        cx_, cy_, ch_ = on_road(ib + dd, sd); b = snap(); bear('#6b4a2c'); group(b, 'mladic', cx_, cy_, ch_ + math.pi / 2 + random.uniform(-0.4, 0.4), scale=0.5)
    cols = ['#d8d8d4', '#2f5d9a', '#8a1f1f', '#3a6e47', '#f2f2ee', '#2a2a2c']
    for k, dd in enumerate((12, 20, 28)):
        x2, y2, h2 = on_road(ib + dd, -1.6); b = snap(); car(cols[k], lights=True); group(b, 'turist', x2, y2, h2 + math.pi)
    for k, dd in enumerate((-12, -20)):
        x2, y2, h2 = on_road(ib + dd, 1.6); b = snap(); car(cols[k + 3]); group(b, 'turist', x2, y2, h2)
    x2, y2, h2 = on_road(ib - 29, 1.6); b = snap(); camper('#f2f2ee'); group(b, 'kamper', x2, y2, h2)
    for (dd, sd) in ((-10, RHW + 1.2), (-11, RHW + 1.8), (14, -(RHW + 1.4))):
        x3, y3, h3 = on_road(ib + dd, sd); b = snap(); person(random.choice(['#e8506a', '#f2c230', '#2f6fb0'])); group(b, 'turist_z', x3, y3, math.atan2(-(bx - x3), by - y3))
    ir = ib - 16; x, y, h = on_road(ir, -1.5)
    b = snap(); ranger(); e = group(b, 'nadzornik', x, y, h); headlights(e, 2.7, 0.9, 600)
    sky(colr='#9cc4ec', sun=(42, -20), sun_e=3.8)
    cam = behind(x, y, h, 14, 15, side=-6); tgt = (bx, by, T(bx, by) + 0.5)
    return dict(cam=cam, tgt=tgt, lens=28, pts={'medvedi': (bx, by, T(bx, by) + 2.6), 'nadzornik': (x, y, T(x, y) + 3.2)})

# ---------------------------------------------------------------- popravki: 6 (promet), 45 (Riviera)
def m06():   # Srce v hladilni torbi · Mulholland, noč, s prometom (brez pešcev in kolesarjev)
    global BASE
    BASE = lambda x, y: 26 + 9 * math.sin(x / 33) + 5 * math.cos(y / 21) - 0.0008 * (x * x)
    set_road([(-150, -40), (-90, -10), (-50, -40), (-10, -5), (30, -30), (70, 5), (140, -10)], 3.4)
    terrain(320, 160, pal('#4a5a34', '#5a6a3c', '#6b675f', (0.35, 0.6)), 0, 0)
    road('asfalt', center=True)
    forest(120, -160, 160, -160, 160, 8, kind='listavec')
    ml = mat('mesto_luc', '#ffc979', 0.5, 0.0, 30); bm = bmesh.new()
    for k in range(900):
        x, y = random.uniform(-260, 260), random.uniform(90, 260)
        hexa_bm(bm, bb(x, x + 0.6, y, y + 0.6, -6, -5.4))
    mk('mesto', bm, ml); box('mesto_tla', -300, 300, 80, 300, -7, -6, mat('mesto_t', '#1c1d20', 0.9))
    i = min(range(len(ROAD)), key=lambda k: abs(ROAD[k][0] + 20))
    x, y, h = on_road(i, 1.2); b = snap(); car('#d9d9d4', lights=True, police=True); e = group(b, 'policija', x, y, h); headlights(e)
    point_light(x, y, T(x, y) + 3, 400, (0.2, 0.4, 1.0), 1.5)
    x2, y2, h2 = on_road(i - 12, 1.2); b = snap(); car('#b5121b', lights=True, sporty=True); e2 = group(b, 'igralec', x2, y2, h2); headlights(e2)
    # promet: pred policijo se umaknejo na desni rob in ustavijo; nasproti vozeči ustavijo na svojem robu
    for (di, sd, rev, c, haz) in ((11, 3.0, False, '#d8d8d4', True), (20, 3.0, False, '#2f5d9a', True), (29, 3.1, False, '#1d1d1f', True),
                                  (44, 1.7, False, '#8a1f1f', False), (7, -3.0, True, '#7f8a93', True), (16, -3.0, True, '#f2f2ee', True),
                                  (37, -1.7, True, '#3a6e47', False), (52, -1.7, True, '#c9a227', False), (-26, 1.7, False, '#5a5d63', False)):
        xx, yy, hh = on_road(i + di, sd); b = snap(); traffic_car(c, hazard=haz); e3 = group(b, 'promet', xx, yy, hh + (math.pi if rev else 0)); headlights(e3, 2.3, 0.7, 450)
    xt, yt, ht = on_road(i + 25, -3.0); b = snap(); box_truck('#e9e6df', '#d9d6cf'); hazards(1.3, 3.45, -5.2, 0.9); et = group(b, 'tovornjak', xt, yt, ht + math.pi); headlights(et, 3.4, 0.9, 500)
    sky(colr='#2a3d63', strength=0.8, sun=(38, 120), sun_e=1.6, sun_c=(0.62, 0.72, 1.0))
    return dict(cam=(x2 - 26, y2 - 36, T(x2, y2) + 30), tgt=(x + 8, y + 2, T(x, y)), lens=32, pts={'policija': (x, y, T(x, y) + 2.2), 'igralec': (x2, y2, T(x2, y2) + 2.0)})

def m45():   # Turistični vlakec · Riviera
    global BASE
    def base(x, y):
        if y < -24: return 2.5 * sst(-42, -24, y) - 4 * (1 - sst(-62, -42, y))
        hill = 2.5 + 0.30 * max(0.0, y + 12) + 1.2 * math.sin(x / 40) * sst(-12, 10, y) + 7 * sst(32, 70, y)
        k = (1 - sst(-26, -14, x)) * (1 - sst(4, 12, y))
        return hill * (1 - k) + 2.5 * k
    BASE = base
    set_road([(-150, -16), (-60, -16), (0, -15), (24, -8), (30, 4), (18, 14), (-20, 19), (-70, 26), (-150, 32)], 4.0, smooth=4)
    def colf(x, y, z, sl):
        if y < -23: return mix(lin('#c4bcab'), lin('#a9a193'), noise(x * 3, y * 3))
        c = mix(lin('#7d8a5c'), lin('#66764a'), noise(x, y))
        return mix(c, lin('#b0a088'), sst(0.4, 0.6, sl))
    terrain(400, 250, colf, 0, 0); road('asfalt', lines=True)
    box('morje', -500, 500, -500, 30, -8, 0.0, tm('morje_r', '#1f7aa8', 0.88, rough=0.05))
    shore_foam(-200, 200, -52, -34, 1.6, 0.4, 0.25, 0.35)
    for k in range(4): foam_line(-200, 200, -52 - k * 9 + random.uniform(-1, 1), 0.02, 0.5, alpha=0.15)
    iL = idx_near(4, -15)
    ribbon_r('promenada', -(RHW + 0.8), -(RHW + 7.5), 0.22, mat('promenada', '#e2dccf', 0.8), 0, iL)
    rail(-(RHW + 7.5), -2.0, 0.22, mat('zid_obala', '#cfc6b4', 0.85), 0, iL, 'obzidje')
    rail(-(RHW + 0.8), -0.1, 0.22, mat('robnik', '#d9d6cf', 0.7), 0, iL, 'robnik')
    random.seed(45)
    for i in range(4, iL, 12):
        x, y, h = on_road(i, RHW + 4.2); palm(x, y, 0.95)
    uc = ['#f2c230', '#2f6fb0', '#e8506a', '#f2f2ee']
    for row, yy in enumerate((-30.5, -35.0)):
        xx = -140
        while xx < -12:
            umbrella(xx, yy, uc[int((xx + 140) // 32) % 4]); xx += 4.6
    for k in range(16):
        b = snap(); person(random.choice(['#e8506a', '#f2c230', '#2f6fb0', '#f2f2ee']), lying=True); group(b, 'kopalec', random.uniform(-140, -14), random.uniform(-38, -28), random.uniform(0, 6), tilt=False)
    wc = ['#f0d9b5', '#f2c9c0', '#efe3c8', '#e8cfa8', '#f6ead6', '#e9b8a0']
    x = -150
    while x < -28:
        w = random.uniform(16, 22); monaco_block(x + w / 2, -1.0, 0, w, 12, random.randint(5, 7), random.choice(wc)); x += w + 2.5
    for (rowy, fl) in ((40, (3, 4)), (54, (3, 5)), (68, (3, 4))):
        x = -150
        while x < 26:
            w = random.uniform(10, 15); monaco_block(x + w / 2, rowy + random.uniform(-1, 1), 0, w, 9, random.randint(*fl), random.choice(wc), '#3f6b3a', '#c0643a'); x += w + 1.5
    church(-40, 84, 0.0, '#f0e6d2', '#c0643a', '#c0643a', 28)
    gm = mat('vrt', '#5f8a3f', 0.9); fl = [mat('cvet' + c, c, 0.7) for c in ('#e8506a', '#f2c230', '#f2f2ee', '#9a4ac4')]
    sph('vrt_otok', 1.0, (8, 1, T(8, 1) - 0.2), gm, scl=(11, 6, 0.6), sub=2)
    for k in range(40):
        a = random.uniform(0, 6.28); r = math.sqrt(random.random())
        sph('cvet', 0.35, (8 + 9 * r * math.cos(a), 1 + 4.5 * r * math.sin(a), T(8, 1) + 0.35), fl[k % 4], sub=1)
    for (px, py) in ((3, 2), (13, 0), (-6, 6)): palm(px, py, 1.0)
    for k in range(8): cypress(random.uniform(-18, 0), random.uniform(6, 13), 0.9)
    viewpoint(40, 1, 0)
    for k in range(4):
        b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2f2ee', '#f2c230'])); group(b, 'turist', 41 + random.uniform(-2, 3), random.uniform(-3, 4), random.uniform(0, 6))
    for k in range(9):
        b = snap(); sailboat(random.uniform(7, 11)); group(b, 'jadrnica', random.uniform(-120, 90), random.uniform(-160, -70), random.uniform(0, 6.28), z=0.0, tilt=False)
    iT = idx_near(31, 2)
    x, y, h = on_road(iT, 1.4)
    b = snap(); road_train_loco(); group(b, 'lokomotiva', x, y, h)
    for n, off in enumerate((7, 13, 19)):
        xi, yi, hi = on_road(max(0, iT - off), 1.4 - (1.1 if n == 2 else 0.0))
        b = snap(); road_train_wagon(n); group(b, 'vagon', xi, yi, hi + (0.25 if n == 2 else 0.0))
    for k in range(12):
        x2, y2, h2 = on_road(random.randrange(4, iL), RHW + random.uniform(2.0, 6.5))
        b = snap(); person(random.choice(['#e8506a', '#2f6fb0', '#f2f2ee', '#f2c230', '#1d1d1f'])); group(b, 'pesec', x2, y2, h2 + random.choice((0, math.pi)))
    for (i2, sd, c) in ((idx_near(-60, -16), 1.6, '#c4161c'), (idx_near(-40, 20), -1.6, '#f2f2ee')):
        x2, y2, h2 = on_road(i2, sd); b = snap(); car(c, sporty=True); group(b, 'avto', x2, y2, h2 + (math.pi if sd < 0 else 0))
    sky(colr='#8fc3ef', sun=(42, -25), sun_e=3.8, sun_c=(1.0, 0.95, 0.88))
    return dict(cam=(62, -78, 40), tgt=(4, -4, 6), lens=28, pts={'vlak': (x, y, T(x, y) + 3), 'razgled': (40, 1, T(40, 1) + 2.5)})

# ---------------------------------------------------------------- 29: kako vržeš darilo (4 slike)
def m29s(f):
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
    hs = houses[12]; hx, hy = hs.location.x, hs.location.y
    it = idx_near(hx, hy); dh = math.hypot(hx - ROAD[it][0], hy - ROAD[it][1])
    rx, ry, _ = on_road(it, dh - 7.2); rz = T(rx, ry)
    ring(rx, ry, 1.6, '#ffd23a', 12, 0.12)
    no_shadow(rcyl('krog_sij', 1.5, 0.02, (rx, ry, rz + 0.08), tm('krog_s', '#ffd23a', 0.22, emit=1.5), n=32))
    point_light(rx, ry, rz + 1.2, 140, (1.0, 0.8, 0.3), 0.5)
    pos = {1: -34, 2: -12, 3: -6, 4: 6}[f]
    def truck_at(ii, left):
        x, y, h = on_road(ii, 1.4)
        b = snap(); pickup('#b5121b', light=True)
        cols = [('#2f6fb0', '#ffd23a'), ('#3a9a4a', '#d6332a'), ('#f2c230', '#2f6fb0'), ('#d6332a', '#f2f2ee')]
        for k, (c, r) in enumerate(cols[:left]):
            b2 = snap(); present(c, r); group(b2, 'darilo', -0.4 + (k % 2) * 0.7, -1.2 - (k // 2) * 0.8, k * 0.4, z=1.0, tilt=False)
        e = group(b, 'dostava', x, y, h); headlights(e, 2.7, 0.9, 900)
        return x, y, h, e
    x, y, h, e = truck_at(it + pos, {1: 4, 2: 4, 3: 3, 4: 3}[f])
    pts = {'tarca': (rx, ry, rz + 0.2), 'auto': (x, y, T(x, y) + 2.0)}
    # met: iz kesona (položaj ob pritisku) do točke, kjer pristane
    xt, yt, ht = on_road(it - 12, 1.4); ft = Vector((xt, yt, 0)); fh = Vector((-math.sin(ht), math.cos(ht), 0))
    B = Vector((xt, yt, T(xt, yt) + 1.5)) - fh * 1.6
    Lp = Vector((rx + 0.25, ry - 0.2, rz + 0.25))
    arc = lambda t: B.lerp(Lp, t) + Vector((0, 0, 5.0 * 4 * t * (1 - t)))
    if f == 2:
        pts['arc'] = [tuple(arc(k / 24)) for k in range(25)]; pts['pika'] = tuple(Lp)
        no_shadow(rcyl('pika', 0.38, 0.03, (Lp.x, Lp.y, rz + 0.12), mat('pika_m', '#ffffff', 0.3, 0.0, 12), n=20))
    if f == 3:
        g = arc(0.58); pts['arc'] = [tuple(arc(k / 24)) for k in range(25)]; pts['darilo'] = tuple(g)
        b = snap(); present('#9a4ac4', '#ffd23a'); gg = group(b, 'v_letu', g.x, g.y, 0.6, z=g.z, tilt=False, scale=1.5); gg.rotation_euler = (0.5, 0.3, 0.6)
    if f == 4:
        b = snap(); present('#9a4ac4', '#ffd23a'); group(b, 'zadetek', Lp.x, Lp.y, 0.7, z=rz + 0.02, tilt=False, scale=1.5)
        sp = mat('iskrica', '#fff2b0', 0.3, 0.0, 30); bm = bmesh.new()
        for k in range(36):
            a = random.uniform(0, 6.28); r = random.uniform(0.4, 2.2)
            bmesh.ops.create_icosphere(bm, subdivisions=0, radius=random.uniform(0.05, 0.12), matrix=MT((Lp.x + r * math.cos(a), Lp.y + r * math.sin(a), rz + random.uniform(0.4, 2.8))))
        no_shadow(mk('iskrice', bm, sp))
        point_light(hx, hy, T(hx, hy) + 3, 900, (1.0, 0.7, 0.35), 2)
        pts['darilo'] = (Lp.x, Lp.y, rz + 0.8)
    snowfall(x + 10, y, 50, 1100, 25)
    stars(300)
    sky(colr='#1f2a44', strength=0.55, sun=(40, 160), sun_e=0.7, sun_c=(0.65, 0.75, 1.0))
    cam = behind(x, y, h, 16, 11, side=-4); tgt = ahead(x, y, h, 11, 0.5, side=3.5)
    if f == 4: cam = behind(x, y, h, 12, 10, side=-6); tgt = (rx, ry, rz + 0.5)
    return dict(cam=cam, tgt=tgt, lens=28, pts=pts)

# ---------------------------------------------------------------- 35: kako iščeš plavalca (4 slike)
def m35s(f):
    global BASE
    BASE = lambda x, y: 1.6 - 0.06 * y + 0.12 * math.sin(x / 9) + 6 * sst(-30, -70, y) + 40 * sst(120, 200, -x) * sst(40, -20, y)
    def colf(x, y, z, sl):
        c = mix(lin('#e8d4a6'), lin('#c9b082'), sst(18, 30, y))
        return mix(c, lin('#5f7f3a'), sst(4, 8, z))
    terrain(460, 220, colf, 0, 30)
    box('morje', -400, 400, 26, 500, -4, 0.0, tm('morje_b', '#2a86a8', 0.88, rough=0.05))
    random.seed(35)
    for k in range(5): foam_line(-200, 200, 30 + k * 11 + random.uniform(-1, 1), 0.02, 0.8 + 0.15 * k, alpha=0.45)
    b = snap(); lifeguard_tower(); group(b, 'stolp', -12, 6, math.radians(10), tilt=False)
    for x in (-30, 14): surf_flag(x, 22)
    cols = ['#e8506a', '#f2c230', '#2f6fb0', '#3a9a4a']
    for k in range(30):
        x, y = random.uniform(-90, 90), random.uniform(-8, 18)
        if abs(x) < 28: continue
        b = snap(); person(random.choice(cols), lying=random.random() < 0.6); group(b, 'kopalec', x, y, random.uniform(0, 6), tilt=False)
    um = [mat('dez_' + c, c, 0.6) for c in ('#e8506a', '#f2c230', '#2f6fb0')]
    for k in range(9):
        x, y = random.uniform(-80, 80), random.uniform(-6, 14)
        if abs(x + 12) < 9 or abs(x - 2) < 7: continue
        rcyl('drog_d', 0.03, 2.2, (x, y, T(x, y) + 1.1), kit.DARK, n=6); rcyl('dežnik', 1.3, 0.4, (x, y, T(x, y) + 2.2), um[k % 3], r2=0.05, n=10)
    for k in range(12): building(-160 + k * 14, -110, 12, 12, random.uniform(10, 28), random.choice(['#efe3c8', '#e8cfa8', '#dcd2bf']))
    b = snap(); person_wave('#d6332a'); group(b, 'opazovalec', -9.5, 9.5, math.radians(-20))
    zc = {1: (14, 80, 22), 2: (14, 80, 22), 3: (13, 83, 11)}.get(f)
    if zc:
        no_shadow(rcyl('obmocje', zc[2], 0.04, (zc[0], zc[1], 0.05), tm('obm_r', '#ff3a2a', 0.16, emit=0.6), n=56))
        ring(zc[0], zc[1], zc[2], '#ff5a3a', 5, 0.16, z=-0.04)
    sk = mat('sled_q', '#b39a70', 0.95)
    if f == 1:
        b = snap(); quad('#d6332a'); group(b, 'stirikolesnik', -8, 3, math.radians(-25))
        b = snap(); jetski('#d6332a'); group(b, 'skuter', 3, 24.5, 0.0, z=T(3, 24.5) + 0.05, tilt=False)
    if f == 2:
        b = snap(); quad('#d6332a'); group(b, 'stirikolesnik', -0.4, 20.5, math.radians(-15))
        for s in (-0.62, 0.62):
            pp = catmull([(-8, 3), (-6, 9), (-3, 15), (-0.4 + s, 19)], 0.8)
            bm = bmesh.new()
            for (a, c2) in zip(pp, pp[1:]): tube(bm, (a[0] + s, a[1], T(a[0], a[1]) + 0.02), (c2[0] + s, c2[1], T(c2[0], c2[1]) + 0.02), 0.13, 4)
            mk('sled', bm, sk)
        b = snap(); jetski('#d6332a'); group(b, 'skuter', 3, 24.5, 0.0, z=T(3, 24.5) + 0.05, tilt=False)
    if f in (3, 4):
        b = snap(); quad('#d6332a'); group(b, 'stirikolesnik', -0.4, 20.5, math.radians(-15))
        b = snap(); jetski('#2f6fb0' if False else '#d6332a')
        if f == 4:
            b2 = snap(); person('#2f6fb0', lying=True); group(b2, 'na_saneh', 0, -2.2, 0, z=0.15, tilt=False)
        jx, jy, jh = ((8.5, 67.0, math.radians(-14)) if f == 3 else (11.2, 81.0, math.pi - 0.2))
        group(b, 'skuter', jx, jy, jh, z=0.0, tilt=False)
        sm = tm('pena_j', '#ffffff', 0.6, rough=0.5)
        bk = Vector((math.sin(jh), -math.cos(jh), 0))
        for k in range(18): no_shadow(sph('pena', random.uniform(0.2, 0.6), (jx + bk.x * (2.5 + k * 0.5) + random.gauss(0, 0.4), jy + bk.y * (2.5 + k * 0.5) + random.gauss(0, 0.4), 0.15), sm, sub=1))
    skin = mat('koza', '#e2b493', 0.7)
    if f == 3:
        wm = tm('val', '#2a86a8', 0.9, rough=0.05)
        sph('val', 1.0, (13, 83.5, -0.3), wm, scl=(10, 1.8, 1.0), sub=3)
        foam_seg(4, 83.5, 22, 83.5, 0.62, 0.7, 0.6)
        sph('plavalec', 0.15, (13, 83.2, 0.85), skin); rbox('roka_p', (0.09, 0.09, 0.65), (13.25, 83.2, 1.25), skin, rot=(0, -0.35, 0))
    if f == 4:
        torus('resilni', 0.45, 0.1, (12.4, 83.6, 0.12), mat('obroc_r', '#f07a12', 0.5), n1=20, n2=6)
    sky(colr='#86bdf0', sun=(42, 150), sun_e=4.0)
    pts = {'stolp': (-12, 6, T(-12, 6) + 7.6), 'opazovalec': (-9.5, 9.5, T(-9.5, 9.5) + 2.0)}
    if zc: pts['obmocje'] = (zc[0], zc[1], 0.3)
    if f in (1, 2): pts['skuter'] = (3, 24.5, T(3, 24.5) + 1.2); pts['quad'] = ((-8, 3) if f == 1 else (-0.4, 20.5)) + (T(-8, 3) + 1.6 if f == 1 else T(-0.4, 20.5) + 1.6,)
    if f == 3: pts['plavalec'] = (13, 83.2, 1.0); pts['skuter'] = (8.5, 67.0, 1.0)
    if f == 4: pts['plavalec'] = (11.2, 81.0, 1.0)
    R = dict(cam=(-4, -40, 30), tgt=(8, 50, 0.0), lens=26, pts=pts, inset_hide=['obmocje', 'obroc'])
    if f == 3: R['inset'] = dict(cam=(9.0, 70.5, 3.4), tgt=(13.0, 83.2, 0.8), lens=45)
    if f == 4: R['inset'] = dict(cam=(15.5, 77.5, 5.0), tgt=(11.3, 81.5, 0.4), lens=32)
    return R

# ---------------------------------------------------------------- izris
def render5(R):
    render2(R)
    if 'inset' in R:
        hid = [o for o in bpy.data.objects if o.name.startswith(tuple(R.get('inset_hide', [])))] if R.get('inset_hide') else []
        for o in hid: o.hide_render = True
        I = R['inset']
        cd = bpy.data.cameras.new('cam2'); cd.lens = I.get('lens', 24); cd.clip_end = 4000; cd.clip_start = 0.05
        co = bpy.data.objects.new('cam2', cd); col().objects.link(co); co.location = I['cam']
        co.rotation_euler = (Vector(I['tgt']) - Vector(I['cam'])).to_track_quat('-Z', 'Y').to_euler()
        SC.camera = co; SC.render.resolution_x, SC.render.resolution_y = (240, 136) if FAST else (480, 272)
        SC.render.filepath = os.path.join(OUT, 'm%02d_inset%s.png' % (M, '_hitro' if FAST else ''))
        bpy.ops.render.render(write_still=True)
        for o in hid: o.hide_render = False
        SC.camera = bpy.data.objects['cam']

if 291 <= M <= 294: R = m29s(M - 290)
elif 351 <= M <= 354: R = m35s(M - 350)
else: R = {6: m06, 45: m45, 46: m46, 47: m47, 48: m48, 49: m49, 50: m50, 51: m51, 52: m52, 53: m53, 54: m54, 55: m55}[M]()
render5(R)
from bpy_extras.object_utils import world_to_camera_view
SC.camera = bpy.data.objects['cam']
def _proj(p):
    v = world_to_camera_view(SC, SC.camera, Vector(p)); return (v.x, 1 - v.y)
pts = {}
for k, p in R.get('pts', {}).items():
    pts[k] = [_proj(q) for q in p] if isinstance(p, list) else _proj(p)
json.dump(pts, open(os.path.join(OUT, 'm%02d.json' % M), 'w'))
print('MISIJA', M, 'ok', len(bpy.data.objects), 'objektov')
