# Makete misij 11–25 v Blenderju (samo slike). Uporaba: bl/bin/python gas/miss2.py <misija 11-25> <izhod> [hitro]
# Gradniki (teren, cesta, drevesa, vozila, ogenj ...) so iz miss.py; tu so novi gradniki in scene.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'miss.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('# ---------------------------------------------------------------- misije')], os.path.join(_here, 'miss.py'), 'exec'))
from mathutils import Euler

# ---------------------------------------------------------------- osnovni gradniki
def tm(name, hexc, alpha, emit=0.0, rough=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexc), 1); b.inputs['Alpha'].default_value = alpha
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(hexc), 1); b.inputs['Emission Strength'].default_value = emit
    return m

def MT(loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    return Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scl, 1))

def rbox(name, size, loc, m, rot=(0, 0, 0), bev=0.0, seg=2):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=MT(loc, rot, size))
    o = mk(name, bm, m)
    if bev: kit.bevel(o, bev, seg)
    return o

def rcyl(name, r, d, loc, m, rot=(0, 0, 0), n=12, r2=None, smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r, radius2=r if r2 is None else r2, depth=d, matrix=MT(loc, rot))
    return mk(name, bm, m, smooth)

def sph(name, r, loc, m, scl=(1, 1, 1), sub=2, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r, matrix=MT(loc, rot, scl))
    return mk(name, bm, m, smooth=True)

def torus_bm(bm, R, r, M, n1=24, n2=8, rz=None):
    rz = r if rz is None else rz; V = []
    for i in range(n1):
        a = 2 * math.pi * i / n1; row = []
        for j in range(n2):
            b = 2 * math.pi * j / n2
            p = Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), rz * math.sin(b)))
            row.append(bm.verts.new(M @ p))
        V.append(row)
    for i in range(n1):
        for j in range(n2):
            bm.faces.new((V[i][j], V[(i + 1) % n1][j], V[(i + 1) % n1][(j + 1) % n2], V[i][(j + 1) % n2]))

def torus(name, R, r, loc, m, rot=(0, 0, 0), n1=24, n2=8, rz=None):
    bm = bmesh.new(); torus_bm(bm, R, r, MT(loc, rot), n1, n2, rz); return mk(name, bm, m, smooth=True)

def idx_near(x, y):
    return min(range(len(ROAD)), key=lambda k: (ROAD[k][0] - x) ** 2 + (ROAD[k][1] - y) ** 2)

def road2(hexc, lines=False, center=False, shoulder='#7d7466', rough=0.9):
    ribbon('cesta', -RHW, RHW, 0.04, mat('cesta' + hexc, hexc, rough))
    if shoulder:
        sm = mat('bank' + shoulder, shoulder, 0.95)
        ribbon('bankina', -RHW - 0.8, -RHW, 0.02, sm); ribbon('bankina', RHW, RHW + 0.8, 0.02, sm)
    if lines:
        w = mat('crta', '#e9e7df', 0.6)
        ribbon('crta', -RHW + 0.25, -RHW + 0.4, 0.05, w); ribbon('crta', RHW - 0.4, RHW - 0.25, 0.05, w)
    if center: ribbon('sredina', -0.07, 0.07, 0.05, mat('crta', '#e9e7df', 0.6), dash=(3, 2))

def strip(pts, off0, off1, z, m, closed=True, step=0.1):
    c = catmull(pts + ([pts[0]] if closed else []), step)
    bm = bmesh.new(); prev = None
    for i, (x, y) in enumerate(c):
        j = min(i + 1, len(c) - 1); k = max(i - 1, 0)
        tx, ty = c[j][0] - c[k][0], c[j][1] - c[k][1]; L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        a = bm.verts.new((x + nx * off0, y + ny * off0, z)); b = bm.verts.new((x + nx * off1, y + ny * off1, z))
        if prev: bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)
    return mk('trak', bm, m)

def area_light(x, y, z, size, energy, colr=(1, 1, 1)):
    ld = bpy.data.lights.new('povrsinska', 'AREA'); ld.size = size; ld.energy = energy; ld.color = colr
    lo = bpy.data.objects.new('povrsinska', ld); col().objects.link(lo); lo.location = (x, y, z)

def spot(x, y, z, tx, ty, tz, energy, size=0.6, colr=(1, 0.95, 0.85)):
    sd = bpy.data.lights.new('reflektor', 'SPOT'); sd.energy = energy; sd.spot_size = size; sd.color = colr
    so = bpy.data.objects.new('reflektor', sd); col().objects.link(so); so.location = (x, y, z)
    so.rotation_euler = (Vector((tx, ty, tz)) - Vector((x, y, z))).to_track_quat('-Z', 'Y').to_euler()

def no_shadow(o):
    try: o.visible_shadow = False
    except Exception: pass
    return o

def stars(n=500, R=1500, seed=4):
    rnd = random.Random(seed); bm = bmesh.new()
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi); e = math.radians(rnd.uniform(6, 80))
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=rnd.uniform(1.2, 3.2),
                                   matrix=MT((R * math.cos(e) * math.cos(a), R * math.cos(e) * math.sin(a), R * math.sin(e))))
    no_shadow(mk('zvezde', bm, mat('zvezda', '#ffffff', 0.5, 0.0, 12)))

# ---------------------------------------------------------------- ljudje, živali, rastline
def person_wave(shirt='#2b5fae'):
    person(shirt)
    rbox('roka_gor', (0.09, 0.09, 0.55), (0.3, 0, 1.75), mat('koza', '#e2b493', 0.7), rot=(0, -0.35, 0))

def fan(shirt, flag=None):
    person(shirt)
    if flag:
        rcyl('drog', 0.015, 2.2, (0.3, 0, 1.7), mat('drog_l', '#8a6a46', 0.8), n=6)
        rbox('zastava', (0.02, 0.9, 0.6), (0.3, 0.45, 2.45), mat('zast' + flag, flag, 0.7))

def palm(x, y, s=1.0, lean=None):
    lean = random.uniform(-0.25, 0.25) if lean is None else lean
    b = snap(); tr = mat('palma_deblo', '#8a7458', 0.9); lf = mat('palma_list', '#3f7a35', 0.8)
    h = 7.0
    for k in range(5):
        z0 = k * h / 5
        rcyl('deblo', 0.24 - 0.025 * k, h / 5 + 0.05, (lean * z0 * 0.3, 0, z0 + h / 10), tr, rot=(0, lean * 0.3, 0), n=8)
    tx = lean * h * 0.3
    for k in range(9):
        a = k * 2 * math.pi / 9 + random.uniform(-0.2, 0.2)
        rbox('list', (0.55, 3.0, 0.05), (tx + math.cos(a) * 1.35, math.sin(a) * 1.35, h - 0.45), lf, rot=(-0.5, 0, a - math.pi / 2))
    sph('kokos', 0.35, (tx, 0, h - 0.1), mat('kokos', '#6b5a3a', 0.8), sub=1)
    return group(b, 'palma', x, y, random.uniform(0, 6.28), tilt=False, scale=s)

def cypress(x, y, s=1.0):
    b = snap(); m = mat('cipresa', '#2f3d2a', 0.9)
    rcyl('cipresa', 0.9, 9.0, (0, 0, 5.2), m, r2=0.12, n=10)
    sph('cip_spodaj', 0.95, (0, 0, 1.2), m, scl=(1, 1, 1.4), sub=1)
    group(b, 'cipresa', x, y, 0, tilt=False, scale=s * random.uniform(0.85, 1.15))

def eucalyptus(x, y, s=1.0):
    b = snap()
    tr = mat('evk_deblo', '#d8d0bf', 0.8); lf = mat('evk_listje', '#71805a', 0.9)
    lean = random.uniform(-0.08, 0.08)
    rcyl('deblo', 0.32, 14, (lean * 7, 0, 7), tr, rot=(0, lean, 0), r2=0.14, n=8)
    for k in range(5):
        a = random.uniform(0, 6.28); hgt = random.uniform(9, 15); rr = random.uniform(1.6, 2.6)
        sph('krosnja', rr, (lean * hgt + math.cos(a) * 1.8, math.sin(a) * 1.8, hgt + 1.0), lf, scl=(1.2, 1.2, 0.7), sub=2)
    rbox('veja', (0.12, 0.12, 3.0), (lean * 9 + 0.8, 0, 9.5), tr, rot=(0, 0.6, 0))
    return group(b, 'evkaliptus', x, y, random.uniform(0, 6.28), tilt=False, scale=s)

def bush(x, y, s=1.0, colr='#3f5a32'):
    sph('grm', random.uniform(0.8, 1.4) * s, (x, y, T(x, y) + 0.3 * s), mat('grm' + colr, colr, 0.9), scl=(1.2, 1.2, 0.8), sub=1)

def kangaroo(hop=False):
    fur = mat('kenguru', '#9a7458', 0.9); lt = mat('kenguru_s', '#cdb294', 0.9); dk = mat('kenguru_t', '#4a3a2e', 0.8)
    sph('telo', 0.32, (0, -0.05, 0.78), fur, scl=(0.8, 1.0, 1.5), rot=(0.45, 0, 0))
    sph('trebuh', 0.24, (0, 0.12, 0.8), lt, scl=(0.8, 0.6, 1.2), rot=(0.4, 0, 0))
    sph('glava', 0.13, (0, 0.34, 1.32), fur, scl=(0.85, 1.4, 0.9), rot=(-0.2, 0, 0))
    for s in (-1, 1):
        rbox('uho', (0.05, 0.07, 0.2), (s * 0.06, 0.28, 1.47), fur, rot=(0, s * 0.25, 0))
        sph('stegno', 0.17, (s * 0.17, -0.12, 0.42), fur, scl=(0.8, 1.3, 1.2))
        rbox('stopalo', (0.09, 0.5, 0.07), (s * 0.15, 0.08, 0.04), dk, rot=(0.5 if hop else 0, 0, 0))
        rbox('taca', (0.05, 0.05, 0.22), (s * 0.1, 0.27, 0.9), fur, rot=(0.6, 0, 0))
    rcyl('rep', 0.1, 1.1, (0, -0.62, 0.38), fur, rot=(math.pi / 2 + 0.35, 0, 0), r2=0.025)
    sph('nos', 0.03, (0, 0.52, 1.3), dk)

def emu():
    fe = mat('emu', '#5a4a3a', 0.95); sk = mat('emu_k', '#6f86a0', 0.8); lg = mat('emu_n', '#6b6560', 0.8)
    sph('telo', 0.42, (0, -0.05, 1.05), fe, scl=(0.8, 1.15, 0.85))
    rcyl('vrat', 0.06, 0.65, (0, 0.33, 1.5), sk, rot=(-0.35, 0, 0), r2=0.045)
    sph('glava', 0.08, (0, 0.44, 1.83), sk, scl=(0.8, 1.3, 0.8)); rbox('kljun', (0.04, 0.12, 0.03), (0, 0.55, 1.82), kit.DARK)
    for s in (-1, 1):
        rcyl('noga', 0.04, 0.85, (s * 0.12, 0.0, 0.45), lg, rot=(0.1 * s, 0, 0))
        rbox('prsti', (0.12, 0.18, 0.03), (s * 0.12, 0.06, 0.02), lg)

def koala():
    gr = mat('koala', '#8f9296', 0.95); lt = mat('koala_s', '#c9cbcd', 0.95)
    sph('telo', 0.2, (0, 0, 0.0), gr, scl=(0.9, 0.8, 1.2))
    sph('glava', 0.15, (0, 0.06, 0.28), gr)
    for s in (-1, 1): sph('uho', 0.08, (s * 0.14, 0.04, 0.38), lt, scl=(1, 0.5, 1))
    sph('nos', 0.05, (0, 0.2, 0.26), kit.DARK, scl=(0.8, 0.6, 1.2))

def sheep():
    sph('ovca', 0.45, (0, 0, 0.75), mat('volna', '#ece8de', 0.95), scl=(0.8, 1.3, 0.75), sub=1)
    sph('ovca_g', 0.16, (0, 0.6, 0.85), mat('ovca_glava', '#2a2522', 0.8), scl=(0.8, 1.2, 0.9))
    for x in (-0.18, 0.18):
        for y in (-0.35, 0.35): box('noga', x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0, 0.5, mat('ovca_glava', '#2a2522', 0.8))

# ---------------------------------------------------------------- stavbe in okolje
def church(x, y, h, wall='#f2efe8', roof='#8a3b2a', spire='#3a3d42', tall=22, lit=0):
    b = snap()
    wm = mat('cerkev' + wall, wall, 0.8); rm = mat('cerk_streha' + roof, roof, 0.7); sm = mat('zvonik' + spire, spire, 0.35, 0.5)
    box('ladja', -4, 4, -8, 8, 0, 7, wm)
    hexa('streha', [(-4.4, -8.4, 7), (4.4, -8.4, 7), (4.4, 8.4, 7), (-4.4, 8.4, 7),
                    (-0.05, -8.4, 11), (0.05, -8.4, 11), (0.05, 8.4, 11), (-0.05, 8.4, 11)], rm)
    box('zvonik', -2, 2, 8, 12, 0, tall * 0.6, wm)
    rcyl('konica', 2.7, tall * 0.4, (0, 10, tall * 0.8), sm, r2=0.05, n=4, smooth=False, rot=(0, 0, math.pi / 4))
    g = mat('okno_c' + str(lit), '#ffd48a' if lit else '#2c3846', 0.3, 0.0, lit)
    boxes('okna', [(4, 4.03, yy - 0.4, yy + 0.4, 2.5, 5.0) for yy in (-5, -1.5, 2)] + [(-4.03, -4, yy - 0.4, yy + 0.4, 2.5, 5.0) for yy in (-5, -1.5, 2)], g)
    return group(b, 'cerkev', x, y, h, tilt=False)

def kozolec(x, y, h):
    b = snap(); w = mat('les', '#8a6a46', 0.9); wd = mat('les_t', '#6b5034', 0.9); rf = mat('kozolec_streha', '#5a4636', 0.8)
    L, D = 14, 5.5
    for i in range(6):
        xx = -L / 2 + i * L / 5
        for yy in (-D / 2, D / 2): box('steber', xx - 0.15, xx + 0.15, yy - 0.15, yy + 0.15, 0, 5.2, wd)
    lst = []
    for i in range(8):
        zz = 0.9 + i * 0.5
        for yy in (-D / 2, D / 2): lst.append((-L / 2, L / 2, yy - 0.05, yy + 0.05, zz, zz + 0.08))
    boxes('late', lst, w)
    hexa('streha', [(-L / 2 - 0.6, -D / 2 - 1.0, 5.2), (L / 2 + 0.6, -D / 2 - 1.0, 5.2), (L / 2 + 0.6, D / 2 + 1.0, 5.2), (-L / 2 - 0.6, D / 2 + 1.0, 5.2),
                    (-L / 2 - 0.6, -0.05, 7.4), (L / 2 + 0.6, -0.05, 7.4), (L / 2 + 0.6, 0.05, 7.4), (-L / 2 - 0.6, 0.05, 7.4)], rf)
    box('seno', -L / 2 + 0.3, L / 2 - 0.3, -D / 2 - 0.08, -D / 2 + 0.08, 1.0, 3.3, mat('seno', '#c9a85a', 0.95))
    return group(b, 'kozolec', x, y, h, tilt=False)

def butte(x, y, w, d, h, c='#a8522f'):
    b = snap(); m = mat('skala' + c, c, 0.9); m2 = mat('pas' + c, '#c7754a', 0.9)
    hexa('butte', [(-w / 2, -d / 2, 0), (w / 2, -d / 2, 0), (w / 2, d / 2, 0), (-w / 2, d / 2, 0),
                   (-w * 0.45, -d * 0.45, h), (w * 0.45, -d * 0.45, h), (w * 0.45, d * 0.45, h), (-w * 0.45, d * 0.45, h)], m, 1.5)
    box('pas', -w * 0.478, w * 0.478, -d * 0.478, d * 0.478, h * 0.55, h * 0.62, m2)
    rcyl('talus', max(w, d) * 0.78, h * 0.35, (0, 0, h * 0.17), mat('talus', '#c9875a', 0.95), r2=max(w, d) * 0.46, n=18)
    return group(b, 'butte', x, y, 0, tilt=False)

def kasbah(x, y, h=0.0):
    b = snap(); m = mat('kasba', '#b5764a', 0.95)
    box('kasba', -9, 9, -7, 7, 0, 8, m)
    for sx in (-1, 1):
        for sy in (-1, 1):
            hexa('stolp', [(sx * 9 - 2, sy * 7 - 2, 0), (sx * 9 + 2, sy * 7 - 2, 0), (sx * 9 + 2, sy * 7 + 2, 0), (sx * 9 - 2, sy * 7 + 2, 0),
                           (sx * 9 - 1.6, sy * 7 - 1.6, 12), (sx * 9 + 1.6, sy * 7 - 1.6, 12), (sx * 9 + 1.6, sy * 7 + 1.6, 12), (sx * 9 - 1.6, sy * 7 + 1.6, 12)], m)
    boxes('cine', [(xx, xx + 0.7, -7.2, -6.8, 8, 8.8) for xx in range(-8, 9, 2)], m)
    return group(b, 'kasba', x, y, h, tilt=False)

def terrace(x0, x1, yfront, side):
    """vrstne hiše iz opeke; side=+1: severno od ceste (fasada gleda proti -Y)"""
    brick = [mat('opeka1', '#9c5a43', 0.85), mat('opeka2', '#a8654a', 0.85), mat('opeka3', '#8f4f3c', 0.85)]
    slate = mat('skrilj', '#4a4d55', 0.7); wf = mat('okvir_b', '#f2f0ea', 0.5); gl = kit.GLASS
    doors = ['#1f3c6e', '#2f6b3a', '#8a1f1f', '#1a1a1c', '#d9b43a']
    D, H = 9.0, 6.8; out = -side
    x = x0; i = 0
    while x < x1 - 4:
        w = 5.0; m = brick[i % 3]
        ya, yb = (yfront, yfront + D) if side > 0 else (yfront - D, yfront)
        z0 = T(x + w / 2, yfront) - 0.1
        box('hisa', x, x + w, ya, yb, z0, z0 + H, m)
        yc = (ya + yb) / 2
        hexa('streha', [(x, ya - 0.3, z0 + H), (x + w, ya - 0.3, z0 + H), (x + w, yb + 0.3, z0 + H), (x, yb + 0.3, z0 + H),
                        (x, yc - 0.05, z0 + H + 3.0), (x + w, yc - 0.05, z0 + H + 3.0), (x + w, yc + 0.05, z0 + H + 3.0), (x, yc + 0.05, z0 + H + 3.0)], slate)
        box('dimnik', x - 0.45, x + 0.45, yc - 0.55, yc + 0.55, z0 + H + 2.0, z0 + H + 4.2, m)
        for dx in (-0.2, 0.2): rcyl('lonec', 0.12, 0.5, (x + dx, yc, z0 + H + 4.45), mat('lonec', '#b5643c', 0.8), n=8)
        fy = ya if side > 0 else yb
        def win(xa, xb, za, zb, dep=0.08):
            y1, y2 = sorted((fy, fy + out * dep))
            box('okvir', xa - 0.1, xb + 0.1, y1, y2, za - 0.1, zb + 0.1, wf)
            y1, y2 = sorted((fy, fy + out * (dep + 0.04)))
            box('steklo', xa, xb, y1, y2, za, zb, gl)
        y1, y2 = sorted((fy, fy + out * 0.7))
        box('erker', x + 0.5, x + 2.9, y1, y2, z0, z0 + 2.6, m)
        win(x + 0.7, x + 2.7, z0 + 0.9, z0 + 2.3, 0.78)
        win(x + 0.7, x + 1.7, z0 + 3.8, z0 + 5.4); win(x + 2.4, x + 3.4, z0 + 3.8, z0 + 5.4)
        y1, y2 = sorted((fy, fy + out * 0.06))
        box('vrata', x + 3.6, x + 4.6, y1, y2, z0, z0 + 2.3, mat('vrata' + doors[i % 5], doors[i % 5], 0.4))
        x += w; i += 1

# ---------------------------------------------------------------- vozila (ob izhodišču, spredaj +Y)
def plain_lights(hw, y, z):
    for s in (-1, 1):
        box('zaromet', min(s * (hw - 0.15), s * (hw - 0.45)), max(s * (hw - 0.15), s * (hw - 0.45)), y - 0.02, y + 0.02, z, z + 0.18, kit.HEAD, 0.02)

def box_truck(cab_c='#2f6fb0', box_c='#e9e6df', hw=1.25, r=0.5):
    cm = mat('kab' + cab_c, cab_c, 0.35)
    c = kit.cab('kabina', hw, 1.0, 3.3, 0.78, 3.0, 0.28, cm, 0.08); kit.arch(c, 2.2, r, r + 0.1, hw)
    kit.windscreen(hw, 3.3, 0.78, 3.0, 0.28, 1.85, 2.88)
    kit.side_window(hw, 1.9, kit.yfront(3.3, 0.28, 0.78, 3.0, 1.85) - 0.12, kit.yfront(3.3, 0.28, 0.78, 3.0, 2.8) - 0.12, 1.85, 2.8)
    box('sasija', -0.45, 0.45, -5.0, 3.2, 0.5, 0.85, kit.DARK)
    box('odbijac', -1.22, 1.22, 3.22, 3.45, 0.42, 0.8, kit.DARK, 0.04)
    plain_lights(hw, 3.34, 0.9)
    b = box('tovor', -hw - 0.05, hw + 0.05, -5.2, 0.85, 0.85, 3.6, mat('tovor' + box_c, box_c, 0.5), 0.05); kit.arch(b, -3.2, r, r + 0.12, hw)
    kit.mirrors(hw, 3.0, 1.85)
    wheels([(2.2, False), (-3.2, True)], r, 0.34, 1.0)

def icecream_van():
    hw, r = 1.0, 0.38
    pk = mat('roza', '#f4b6cc', 0.4); wh = mat('bela_r', '#f4f2ec', 0.35)
    o = hexa('furgon', [(-hw, -2.6, 0.38), (hw, -2.6, 0.38), (hw, 2.4, 0.38), (-hw, 2.4, 0.38),
                        (-hw, -2.6, 2.5), (hw, -2.6, 2.5), (hw, 1.3, 2.5), (-hw, 1.3, 2.5)], pk, 0.1, 3)
    for y in (1.6, -1.6): kit.arch(o, y, r, r + 0.07, hw)
    hexa('nos', [(-hw, 2.3, 0.38), (hw, 2.3, 0.38), (hw, 2.85, 0.38), (-hw, 2.85, 0.38),
                 (-hw, 2.3, 1.15), (hw, 2.3, 1.15), (hw, 2.75, 1.05), (-hw, 2.75, 1.05)], pk, 0.08, 3)
    kit.windscreen(hw, 2.4, 1.15, 2.5, 1.1, 1.25, 2.35, 0.08)
    box('streha_b', -hw + 0.05, hw - 0.05, -2.55, 1.25, 2.5, 2.62, wh, 0.05)
    box('okno_strezba', -hw - 0.02, -hw, -1.5, 0.5, 1.35, 2.15, kit.GLASS)
    box('pult', -hw - 0.28, -hw, -1.5, 0.5, 1.25, 1.33, wh)
    rd = mat('tenda_r', '#e8506a', 0.5)
    for i in range(8):
        y0 = -1.6 + i * 0.28
        hexa('tenda', [(-hw, y0, 2.3), (-hw, y0 + 0.28, 2.3), (-hw - 0.75, y0 + 0.28, 2.0), (-hw - 0.75, y0, 2.0),
                       (-hw, y0, 2.34), (-hw, y0 + 0.28, 2.34), (-hw - 0.75, y0 + 0.28, 2.04), (-hw - 0.75, y0, 2.04)], wh if i % 2 else rd)
    rcyl('kornet', 0.02, 1.1, (0, -0.6, 3.2), mat('vafelj', '#d9a35a', 0.7), r2=0.38, n=14)
    for (dx, dz, c) in ((0, 3.95, '#f6d2e0'), (0.12, 4.35, '#fbf6ee'), (-0.08, 4.7, '#7a4a2e')):
        sph('kepica', 0.36 - (dz - 3.95) * 0.15, (dx, -0.6, dz), mat('kepica' + c, c, 0.6))
    for s in (-1, 1): box('far', min(s * 0.55, s * 0.9), max(s * 0.55, s * 0.9), 2.83, 2.87, 0.75, 0.92, kit.HEAD)
    wheels([(1.6, False), (-1.6, False)], r, 0.26, 0.8)

def wbin(colr='#2f7d4f', lid_open=False):
    bm_ = mat('smetnjak' + colr, colr, 0.6)
    hexa('kos', [(-0.3, -0.35, 0.05), (0.3, -0.35, 0.05), (0.3, 0.35, 0.05), (-0.3, 0.35, 0.05),
                 (-0.34, -0.4, 1.0), (0.34, -0.4, 1.0), (0.34, 0.4, 1.0), (-0.34, 0.4, 1.0)], bm_, 0.03)
    if lid_open: rbox('pokrov', (0.7, 0.04, 0.82), (0, -0.44, 1.38), bm_, rot=(0.15, 0, 0))
    else: box('pokrov', -0.36, 0.36, -0.44, 0.42, 1.0, 1.05, bm_, 0.02)
    for x in (-0.28, 0.28): cyl('kolesce', 0.1, 0.06, (x, -0.32, 0.1), kit.RUB, 'X', 10)

def garbage_truck():
    hw, r = 1.25, 0.5
    cabm = mat('kab_bela', '#f1f1ec', 0.35); gr = mat('smet_zel', '#2f7d4f', 0.4)
    c = kit.cab('kabina', hw, 2.0, 3.9, 0.7, 2.9, 0.15, cabm, 0.08); kit.arch(c, 3.0, r, r + 0.1, hw)
    kit.windscreen(hw, 3.9, 0.7, 2.9, 0.15, 1.7, 2.75)
    kit.side_window(hw, 2.3, kit.yfront(3.9, 0.15, 0.7, 2.9, 1.7) - 0.1, kit.yfront(3.9, 0.15, 0.7, 2.9, 2.7) - 0.1, 1.7, 2.7)
    box('sasija', -0.45, 0.45, -4.4, 3.7, 0.5, 0.85, kit.DARK)
    box('odbijac', -1.22, 1.22, 3.85, 4.1, 0.42, 0.8, kit.DARK, 0.04)
    plain_lights(hw, 3.92, 0.9)
    b = box('nadgradnja', -hw, hw, -4.2, 1.9, 0.85, 3.3, gr, 0.12)
    for y in (-1.2, -2.5): kit.arch(b, y, r, r + 0.12, hw)
    box('zadek', -hw - 0.05, hw + 0.05, -4.9, -4.1, 0.6, 3.1, mat('zadek_siv', '#c9ccd0', 0.4, 0.5), 0.15)
    stripe(hw + 0.01, -4.2, 1.9, 1.0, 1.15, kit.WHITE)
    box('luc_osn', -0.7, 0.7, 2.6, 2.85, 2.95, 3.0, kit.BLACK); box('luc_a', -0.65, 0.65, 2.62, 2.83, 3.0, 3.1, mat('amber_luc', '#ffa21a', 0.3, 0.0, 9), 0.03)
    arm = mat('roka_s', '#5b6066', 0.4, 0.6)
    rbox('roka1', (0.22, 0.26, 1.9), (-hw - 0.45, 0.9, 1.9), arm, rot=(0, 0.45, 0))
    rbox('roka2', (0.22, 0.26, 1.3), (-hw - 0.3, 0.9, 3.25), arm, rot=(0, -0.95, 0))
    b2 = snap(); wbin('#2f7d4f'); e = group(b2, 'dvignjen', -hw + 0.15, 0.9, 0, z=3.0, tilt=False)
    e.rotation_euler = (0, 2.3, math.pi / 2)
    wheels([(3.0, False), (-1.2, True), (-2.5, True)], r, 0.32, 1.0)

def chaser():
    dk = mat('oklep', '#30343a', 0.45, 0.4); og = mat('oklep_or', '#f07a12', 0.5)
    hexa('oklep_sp', [(-1.2, -3.0, 0.3), (1.2, -3.0, 0.3), (1.2, 3.0, 0.3), (-1.2, 3.0, 0.3),
                      (-1.3, -3.0, 1.5), (1.3, -3.0, 1.5), (1.3, 3.4, 1.2), (-1.3, 3.4, 1.2)], dk, 0.05)
    hexa('oklep_zg', [(-1.3, -3.0, 1.5), (1.3, -3.0, 1.5), (1.3, 3.4, 1.2), (-1.3, 3.4, 1.2),
                      (-0.95, -2.6, 2.6), (0.95, -2.6, 2.6), (0.95, 1.4, 2.6), (-0.95, 1.4, 2.6)], dk, 0.05)
    rbox('reza', (1.4, 0.9, 0.06), (0, 2.42, 1.95), kit.GLASS, rot=(2.506, 0, 0))
    for s in (-1, 1): rbox('reza_s', (0.06, 1.6, 0.18), (s * 1.13, 0.6, 2.05), kit.GLASS, rot=(0, s * 0.3, 0))
    stripe(1.3, -3.0, 3.2, 1.25, 1.42, og)
    rcyl('kupola', 0.45, 0.4, (0, -1.2, 2.8), dk, n=14)
    rcyl('jambor', 0.04, 1.6, (0, -1.2, 3.8), kit.ALU, n=6)
    for k in range(3):
        a = k * 2 * math.pi / 3
        rbox('rocica', (0.4, 0.03, 0.03), (0.2 * math.cos(a), -1.2 + 0.2 * math.sin(a), 4.55), kit.ALU, rot=(0, 0, a))
        sph('lonček', 0.08, (0.4 * math.cos(a), -1.2 + 0.4 * math.sin(a), 4.55), kit.ALU, sub=1)
    plain_lights(1.2, 3.42, 0.9)
    wheels([(2.0, False), (-2.0, False)], 0.52, 0.38, 1.02)

def probe():
    og = mat('sonda', '#ff8a1a', 0.45)
    hexa('sonda', [(-0.35, -0.35, 0), (0.35, -0.35, 0), (0.35, 0.35, 0), (-0.35, 0.35, 0),
                   (-0.2, -0.2, 0.45), (0.2, -0.2, 0.45), (0.2, 0.2, 0.45), (-0.2, 0.2, 0.45)], og, 0.03)
    rcyl('antena', 0.012, 1.0, (0, 0, 0.95), kit.ALU, n=6)
    rbox('zastavica', (0.02, 0.35, 0.22), (0, 0.18, 1.35), mat('zast_r', '#ffd23a', 0.6, 0.0, 2))

def rc_buggy(colr):
    car(colr, sporty=True)
    rcyl('antena', 0.04, 3.2, (0.55, -1.7, 2.6), kit.BLACK, n=6)
    for s in (-1, 1): rbox('nosilec', (0.06, 0.06, 0.6), (s * 0.5, -2.0, 1.45), kit.DARK)
    rbox('krilo', (2.0, 0.6, 0.08), (0, -2.1, 1.75), mat('krilo' + colr, colr, 0.4))

def ferry():
    wh = mat('trajekt_bel', '#f2f2ee', 0.35); hull = mat('trajekt_trup', '#1f3c6e', 0.4); red = mat('trajekt_rd', '#c4161c', 0.5)
    L, W = 90, 18
    hexa('trup', [(-W / 2 + 1, -L / 2, -4), (W / 2 - 1, -L / 2, -4), (W / 2 - 1, L / 2 - 14, -4), (-W / 2 + 1, L / 2 - 14, -4),
                  (-W / 2, -L / 2, 5.5), (W / 2, -L / 2, 5.5), (W / 2, L / 2 - 14, 5.5), (-W / 2, L / 2 - 14, 5.5)], hull)
    hexa('premec', [(-W / 2 + 1, L / 2 - 14, -4), (W / 2 - 1, L / 2 - 14, -4), (0.4, L / 2 - 2, -4), (-0.4, L / 2 - 2, -4),
                    (-W / 2, L / 2 - 14, 5.5), (W / 2, L / 2 - 14, 5.5), (0.4, L / 2 + 1, 6.5), (-0.4, L / 2 + 1, 6.5)], hull)
    box('bok_bel', -W / 2 - 0.02, W / 2 + 0.02, -L / 2, L / 2 - 14, 2.2, 5.5, wh)
    stripe(W / 2, -L / 2, L / 2 - 14, 1.6, 2.2, red)
    box('krma_odprtina', -3.6, 3.6, -L / 2 - 0.05, -L / 2 + 0.2, 1.6, 5.2, kit.DARK)
    for k, (y0, y1, z0, z1, w2) in enumerate(((-34, 26, 5.5, 8.6, 8.6), (-26, 20, 8.6, 11.6, 7.6), (-12, 14, 11.6, 14.2, 6.0))):
        box('nadgradnja', -w2, w2, y0, y1, z0, z1, wh, 0.2)
        wins = []
        yy = y0 + 1.2
        while yy < y1 - 1.5:
            for s in (-1, 1): wins.append((min(s * w2, s * (w2 + 0.03)), max(s * w2, s * (w2 + 0.03)), yy, yy + 1.4, z0 + 1.0, z0 + 2.2))
            yy += 2.2
        boxes('okna', wins, kit.GLASS)
    rcyl('dimnik', 2.0, 6.0, (0, -16, 17.2), mat('dimnik_m', '#1f3c6e', 0.4), n=16)
    rcyl('dimnik_pas', 2.05, 0.8, (0, -16, 18.6), mat('dimnik_r', '#f2c230', 0.5), n=16)
    for s in (-1, 1):
        for y in (-20, -8, 4): sph('resilni', 1.0, (s * 8.9, y, 9.5), mat('resilni_c', '#f07a12', 0.5), scl=(1.0, 3.2, 0.9))
    rbox('rampa', (7.0, 9.0, 0.35), (0, -L / 2 - 4.4, 2.54), mat('rampa_k', '#5b6066', 0.5, 0.5), rot=(-0.21, 0, 0))
    for s in (-1, 1): rcyl('veriga', 0.05, 7.5, (s * 3.2, -L / 2 - 3.0, 5.6), kit.DARK, rot=(-0.95, 0, 0), n=6)

def locomotive(c1='#f2b632', c2='#2a2d33'):
    m1 = mat('lok' + c1, c1, 0.4); m2 = mat('lok2' + c2, c2, 0.5)
    box('lok_telo', -1.45, 1.45, -9.5, 8.0, 1.2, 4.2, m1, 0.12)
    hexa('lok_nos', [(-1.45, 8.0, 1.2), (1.45, 8.0, 1.2), (1.45, 9.6, 1.2), (-1.45, 9.6, 1.2),
                     (-1.45, 8.0, 4.2), (1.45, 8.0, 4.2), (1.45, 9.0, 3.4), (-1.45, 9.0, 3.4)], m1, 0.1)
    box('lok_pas', -1.47, 1.47, -9.5, 9.1, 1.9, 2.3, m2)
    rbox('lok_okno', (2.3, 0.06, 0.75), (0, 8.55, 3.45), kit.GLASS, rot=(-0.67, 0, 0))
    box('lok_podvozje', -1.3, 1.3, -9.0, 8.8, 0.6, 1.2, kit.DARK)
    for y in (-6.5, 6.0):
        box('podstavni', -1.2, 1.2, y - 1.6, y + 1.6, 0.35, 0.8, kit.DARK)
        for dy in (-0.9, 0.9):
            for s in (-1, 1): cyl('kolo_v', 0.45, 0.14, (s * 0.72, y + dy, 0.45), kit.DARK, 'X', 14)
    for s in (-1, 1): box('lok_far', min(s * 0.6, s * 1.0), max(s * 0.6, s * 1.0), 9.58, 9.64, 1.55, 1.8, kit.HEAD)
    box('lok_far_z', -0.25, 0.25, 9.0, 9.08, 3.95, 4.15, kit.HEAD)

def wagon(colr='#8a8f96'):
    m = mat('vagon' + colr, colr, 0.6, 0.2)
    hexa('vagon', [(-1.3, -7, 1.4), (1.3, -7, 1.4), (1.3, 7, 1.4), (-1.3, 7, 1.4),
                   (-1.5, -7.4, 3.9), (1.5, -7.4, 3.9), (1.5, 7.4, 3.9), (-1.5, 7.4, 3.9)], m, 0.06)
    box('vag_podv', -1.2, 1.2, -7, 7, 0.6, 1.4, kit.DARK)
    for y in (-5.5, 5.5):
        box('podstavni', -1.1, 1.1, y - 1.2, y + 1.2, 0.35, 0.75, kit.DARK)
        for dy in (-0.7, 0.7):
            for s in (-1, 1): cyl('kolo_v', 0.42, 0.14, (s * 0.72, y + dy, 0.42), kit.DARK, 'X', 12)

def rail_line(x0, y0, ang, L0, L1, z=0.0):
    M = MT((x0, y0, z), (0, 0, ang))
    bm = bmesh.new()
    hexa_bm(bm, [(L0, -2.2, 0), (L1, -2.2, 0), (L1, 2.2, 0), (L0, 2.2, 0), (L0, -1.6, 0.32), (L1, -1.6, 0.32), (L1, 1.6, 0.32), (L0, 1.6, 0.32)])
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); mk('gramoz', bm, mat('gramoz_z', '#8a847a', 0.95))
    bm = bmesh.new(); t = L0
    while t < L1:
        bmesh.ops.create_cube(bm, size=1.0, matrix=MT((t, 0, 0.38), (0, 0, 0), (0.26, 2.6, 0.14))); t += 0.65
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); mk('prage', bm, mat('prag', '#5a4a3c', 0.9))
    bm = bmesh.new()
    for s in (-1, 1): bmesh.ops.create_cube(bm, size=1.0, matrix=MT(((L0 + L1) / 2, s * 0.72, 0.52), (0, 0, 0), (L1 - L0, 0.08, 0.15)))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); mk('tiri', bm, mat('tir', '#9aa0a6', 0.3, 0.9))

def barrier(arm_len=5.5):
    gm = mat('siva_k', '#7f858c', 0.5, 0.3)
    box('steber', -0.12, 0.12, -0.12, 0.12, 0, 1.3, gm)
    box('ohisje', -0.3, 0.3, -0.25, 0.25, 0.5, 1.1, kit.DARK)
    rcyl('drog', 0.07, 3.4, (0, 0.35, 1.7), gm, n=8)
    box('tabla', -0.6, 0.6, 0.42, 0.48, 2.2, 2.6, kit.BLACK)
    for s in (-1, 1): rcyl('utripalka', 0.14, 0.08, (s * 0.35, 0.5, 2.4), mat('utripalka', '#ff2010', 0.3, 0.0, 16), rot=(math.pi / 2, 0, 0))
    for s in (-1, 1): rbox('kriz', (1.3, 0.05, 0.18), (0, 0.42, 3.1), kit.WHITE, rot=(0, s * 0.785, 0))
    rd = mat('zap_rd', '#d6201a', 0.5)
    n = int(arm_len / 0.5)
    for k in range(n): box('zapornica', 0.3 + k * 0.5, 0.8 + k * 0.5, -0.05, 0.05, 1.0, 1.12, rd if k % 2 == 0 else kit.WHITE)

def balloon(cols=('#d6332a', '#f2c230', '#2f6fb0', '#f2f2ee')):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
    for v in bm.verts:
        z = v.co.z; s = 1.0 if z > 0 else (1 + z * 0.6)
        v.co.x *= 9 * s; v.co.y *= 9 * s; v.co.z = z * 11 + 14.5
    o = mk('balon', bm, mat('bal' + cols[0], cols[0], 0.6), smooth=True)
    for c in cols[1:]: o.data.materials.append(mat('bal' + c, c, 0.6))
    for p in o.data.polygons:
        a = math.atan2(p.center.y, p.center.x); p.material_index = int((a + math.pi) / (2 * math.pi) * 24) % len(cols)
    box('kosara', -0.7, 0.7, -0.7, 0.7, 0, 1.1, mat('pletenje', '#8a6a3c', 0.95), 0.05)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p0 = Vector((sx * 0.65, sy * 0.65, 1.1)); p1 = Vector((sx * 2.0, sy * 2.0, 4.0)); d = p1 - p0
            rcyl('vrv', 0.02, d.length, tuple((p0 + p1) / 2), kit.DARK, rot=d.to_track_quat('Z', 'Y').to_euler(), n=4)
    rcyl('plamen', 0.25, 0.9, (0, 0, 2.2), mat('gorilnik', '#ffb13a', 0.4, 0.0, 30), r2=0.02, n=8)
    for dx in (-0.3, 0.3): sph('potnik', 0.13, (dx, 0.1, 1.35), mat('koza', '#e2b493', 0.7))

def combine():
    cm = mat('kombajn', '#d4552b', 0.4); gr = mat('kombajn_siv', '#5b6066', 0.5, 0.4)
    box('telo', -1.5, 1.5, -4.0, 2.0, 1.0, 3.6, cm, 0.12)
    box('rezervoar', -1.4, 1.4, -2.5, 1.0, 3.6, 4.4, cm, 0.1)
    box('kabina_k', -1.0, 1.0, 1.0, 2.6, 3.0, 4.6, kit.GLASS, 0.06); box('streha_k', -1.05, 1.05, 0.95, 2.65, 4.6, 4.75, cm)
    hexa('dovod', [(-0.8, 2.0, 1.0), (0.8, 2.0, 1.0), (0.8, 4.2, 0.4), (-0.8, 4.2, 0.4),
                   (-0.8, 2.0, 2.3), (0.8, 2.0, 2.3), (0.8, 4.2, 1.4), (-0.8, 4.2, 1.4)], gr)
    box('heder', -4.0, 4.0, 4.0, 5.6, 0.25, 1.1, cm, 0.05)
    rcyl('motovilo', 0.65, 7.8, (0, 5.4, 1.5), gr, rot=(0, math.pi / 2, 0), n=10)
    for k in range(6):
        a = k * math.pi / 3
        rbox('letev', (7.8, 0.06, 0.06), (0, 5.4 + 0.7 * math.cos(a), 1.5 + 0.7 * math.sin(a)), mat('letev_r', '#e8c21a', 0.5))
    rcyl('polz', 0.18, 6.2, (-3.6, -1.0, 4.3), gr, rot=(0, math.pi / 2, 0), n=10)
    cyl('kolo_k', 0.85, 0.6, (-1.25, 0.8, 0.85), kit.RUB, 'X', 20); cyl('kolo_k', 0.85, 0.6, (1.25, 0.8, 0.85), kit.RUB, 'X', 20)
    cyl('kolo_kz', 0.55, 0.4, (-1.1, -3.2, 0.55), kit.RUB, 'X', 16); cyl('kolo_kz', 0.55, 0.4, (1.1, -3.2, 0.55), kit.RUB, 'X', 16)
    du = tm('pleve', '#e9dcb0', 0.35, rough=1.0)
    for k in range(7): sph('prah', random.uniform(0.8, 1.6), (random.gauss(0, 1.0), -5.0 - k * 0.9, 1.5 + random.uniform(0, 1.5)), du, sub=1)
    zr = mat('zrnje', '#d8b04a', 0.95)
    for k in range(18): sph('zrno', 0.07, (-6.6 + random.gauss(0, 0.15), -1.0 + random.gauss(0, 0.15), 4.0 - k * 0.12), zr, sub=0)

def tractor_trailer(colr='#2f6fb0'):
    cm = mat('traktor' + colr, colr, 0.4)
    box('hauba', -0.6, 0.6, 0.6, 2.8, 0.9, 1.9, cm, 0.08)
    box('kabina_tr', -0.85, 0.85, -0.9, 0.6, 1.2, 3.0, kit.GLASS, 0.05); box('streha_tr', -0.9, 0.9, -1.0, 0.7, 2.95, 3.1, cm)
    for s in (-1, 1):
        cyl('zadnje', 0.85, 0.5, (s * 0.95, -0.4, 0.85), kit.RUB, 'X', 20); cyl('zadnje_p', 0.5, 0.52, (s * 0.95, -0.4, 0.85), mat('plat_r', '#e8c21a', 0.5), 'X', 16)
        cyl('sprednje', 0.5, 0.3, (s * 0.75, 2.1, 0.5), kit.RUB, 'X', 16)
    box('prikolica', -1.3, 1.3, -8.5, -2.2, 1.0, 2.6, mat('prik', '#a33a2a', 0.5), 0.05)
    sph('kup_zrnja', 1.0, (0, -5.3, 2.4), mat('zrnje', '#d8b04a', 0.95), scl=(1.15, 2.8, 0.45))
    for s in (-1, 1): cyl('kolo_p', 0.55, 0.35, (s * 1.1, -5.3, 0.55), kit.RUB, 'X', 16)

def bike(ox=0.0, oy=0.0, oz=0.0, jersey=None, colr='#d9d9d4'):
    fm = mat('okvir' + colr, colr, 0.35, 0.3)
    for yy in (-0.5, 0.5): torus('kolo', 0.31, 0.03, (ox, oy + yy, oz + 0.34), kit.RUB, rot=(0, math.pi / 2, 0), n1=20, n2=5)
    rbox('okvir', (0.035, 0.6, 0.035), (ox, oy + 0.05, oz + 0.82), fm)
    rbox('okvir', (0.035, 0.035, 0.75), (ox, oy + 0.18, oz + 0.58), fm, rot=(-0.75, 0, 0))
    rbox('okvir', (0.035, 0.035, 0.55), (ox, oy - 0.18, oz + 0.6), fm, rot=(0.3, 0, 0))
    rbox('vilice', (0.03, 0.03, 0.5), (ox, oy + 0.46, oz + 0.58), fm, rot=(-0.25, 0, 0))
    rbox('krmilo', (0.42, 0.03, 0.03), (ox, oy + 0.42, oz + 0.92), kit.BLACK)
    rbox('sedez', (0.08, 0.25, 0.04), (ox, oy - 0.25, oz + 0.92), kit.BLACK)
    if jersey:
        jm = mat('dres' + jersey, jersey, 0.6); sk = mat('koza', '#e2b493', 0.7); sh = mat('hlace_k', '#1a1a1c', 0.7)
        rbox('trup', (0.34, 0.62, 0.22), (ox, oy + 0.08, oz + 1.13), jm, rot=(0.5, 0, 0), bev=0.05)
        sph('glava', 0.11, (ox, oy + 0.42, oz + 1.36), sk); sph('celada', 0.13, (ox, oy + 0.4, oz + 1.41), jm, scl=(1, 1.3, 0.75))
        for s in (-1, 1):
            rbox('roka', (0.07, 0.07, 0.4), (ox + s * 0.17, oy + 0.4, oz + 1.08), sk, rot=(0.6, 0, 0))
            rbox('noga', (0.11, 0.11, 0.62), (ox + s * 0.1, oy - 0.1, oz + 0.62), sh, rot=(-0.25 + s * 0.35, 0, 0))

def team_car(colr='#1f4fa8'):
    car(colr)
    boxes('stresni', [(-0.75, -0.7, -0.9, 0.3, 1.47, 1.55), (0.7, 0.75, -0.9, 0.3, 1.47, 1.55), (-0.75, 0.75, -0.9, -0.85, 1.47, 1.55), (-0.75, 0.75, 0.25, 0.3, 1.47, 1.55)], kit.BLACK)
    for x in (-0.4, 0.0, 0.4): bike(x, -0.3, 1.55, None, random.choice(['#d9d9d4', '#f2c230', '#2a2d33']))
    rbox('roka_bidon', (0.4, 0.08, 0.08), (1.05, 0.3, 1.05), mat('koza', '#e2b493', 0.7))
    rcyl('bidon', 0.04, 0.2, (1.3, 0.3, 1.05), mat('bidon', '#f2f2ee', 0.4))

def camper(colr='#f2f2ee'):
    m = mat('kamper' + colr, colr, 0.4)
    box('kamper', -1.15, 1.15, -3.2, 2.0, 0.45, 3.0, m, 0.15)
    box('kamper_nos', -1.1, 1.1, 2.0, 3.0, 0.45, 1.6, m, 0.1)
    rbox('kamper_okno', (2.0, 0.06, 0.8), (0, 2.25, 2.0), kit.GLASS, rot=(-0.6, 0, 0))
    stripe(1.15, -3.2, 2.0, 1.4, 1.55, mat('kamper_trak', '#2f6fb0', 0.5))
    boxes('kamp_okna', [(1.15, 1.18, -2.4, -1.2, 1.8, 2.5), (-1.18, -1.15, -2.4, -1.2, 1.8, 2.5)], kit.GLASS)
    wheels([(2.3, False), (-1.9, False)], 0.38, 0.25, 0.85)

# ---------------------------------------------------------------- učinki
def lava(path, w, step=1.0):
    c = catmull(path, step)
    crust = mat('lava_skorja', '#241410', 0.7, 0.0, 0.2); core = mat('lava', '#ff7a10', 0.4, 0.0, 2.6)
    for (ww, lift, m) in ((w * 1.35, 0.18, crust), (w * 0.6, 0.26, core)):
        bm = bmesh.new(); prev = None
        for i, (x, y) in enumerate(c):
            j = min(i + 1, len(c) - 1); k = max(i - 1, 0)
            tx, ty = c[j][0] - c[k][0], c[j][1] - c[k][1]; L = math.hypot(tx, ty) or 1
            nx, ny = -ty / L, tx / L; f = 0.75 + 0.25 * math.sin(i / 7.0)
            pa = (x + nx * ww * f / 2, y + ny * ww * f / 2); pb = (x - nx * ww * f / 2, y - ny * ww * f / 2)
            a = bm.verts.new((*pa, T(*pa) + lift)); b = bm.verts.new((*pb, T(*pb) + lift))
            if prev: bm.faces.new((prev[0], prev[1], b, a))
            prev = (a, b)
        mk('lava', bm, m, smooth=True)
    for i in range(0, len(c), 30): point_light(c[i][0], c[i][1], T(*c[i]) + 3, 2500, (1.0, 0.45, 0.15), 2)

def rock_fall(p, d, L=6.0):
    sph('kamen', 0.7, p, mat('kamen_zar', '#ff8a2a', 0.6, 0.0, 1.8))
    dv = Vector(d).normalized()
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.05, radius2=0.55, depth=L)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p) - dv * L / 2) @ dv.to_track_quat('Z', 'Y').to_matrix().to_4x4(), verts=bm.verts)
    no_shadow(mk('sled', bm, tm('sled_o', '#ffa040', 0.35, emit=2.5), smooth=True))

def ring(x, y, R, colr, strength=10, r=0.12, z=None):
    zz = (T(x, y) if z is None else z) + 0.1
    torus('obroc', R, r, (x, y, zz), mat('obroc' + colr, colr, 0.3, 0.0, strength), rz=0.03, n1=40, n2=6)

def fireball(x, y, z, s=1.0):
    core = tm('eksplozija_j', '#ffc040', 1.0, emit=4); outer = tm('eksplozija_o', '#ff9020', 0.9, emit=2.2)
    for k in range(9): sph('ogn', random.uniform(0.8, 1.6) * s, (x + random.gauss(0, 1.1 * s), y + random.gauss(0, 1.1 * s), z + random.gauss(0, 0.9 * s)), outer)
    for k in range(5): sph('ogn_j', random.uniform(0.5, 1.0) * s, (x + random.gauss(0, 0.6 * s), y + random.gauss(0, 0.6 * s), z + random.gauss(0, 0.5 * s)), core)
    smoke(x, y, z + 1.5 * s, 0.8 * s, 8, (0.4, 0.2), True)
    point_light(x, y, z, 80000 * s * s, (1.0, 0.55, 0.2), 3)
    dk = mat('delci', '#2a2522', 0.8)
    for k in range(14):
        a = random.uniform(0, 6.28); e = random.uniform(0.2, 1.2); d = random.uniform(2.5, 6) * s
        rbox('delec', (0.25, 0.18, 0.08), (x + d * math.cos(a) * math.cos(e), y + d * math.sin(a) * math.cos(e), z + d * math.sin(e)), dk, rot=(random.random() * 3, random.random() * 3, 0))

def meteor(p0, d, L=70, r=1.4):
    dv = Vector(d).normalized()
    for (rr, mm, LL) in ((r, tm('meteor_g', '#e6f6ff', 1.0, emit=30), L), (r * 2.4, tm('meteor_o', '#ff9a4a', 0.3, emit=8), L * 0.7)):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=rr * 0.04, radius2=rr, depth=LL)
        rq = dv.to_track_quat('Z', 'Y')
        bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p0) - dv * LL / 2) @ rq.to_matrix().to_4x4(), verts=bm.verts)
        no_shadow(mk('meteor', bm, mm, smooth=True))
    no_shadow(sph('meteor_glava', r * 1.15, p0, tm('meteor_gl', '#ffffff', 1.0, emit=40)))

def meteorite(x, y, glow=True):
    z = T(x, y)
    torus('krater', 2.2, 0.5, (x, y, z + 0.05), mat('krater', '#8a6a4a', 0.95), rz=0.25)
    sph('krater_dno', 2.0, (x, y, z - 0.25), mat('krater_t', '#5a4636', 0.95), scl=(1, 1, 0.15))
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.5, matrix=MT((x, y, z + 0.3)))
    for v in bm.verts: v.co += Vector((random.gauss(0, 0.08), random.gauss(0, 0.08), random.gauss(0, 0.08)))
    mk('meteorit', bm, mat('meteorit_z', '#ff5a1a', 0.4, 0.0, 9) if glow else mat('meteorit', '#3a3330', 0.6, 0.4))
    if glow:
        point_light(x, y, z + 1.0, 900, (1.0, 0.45, 0.15), 0.5)
        smoke(x, y, z + 0.4, 0.14, 5, (0.15, 0.3), True)

def aurora(y0=520, z0=110, z1=240, x0=-520, x1=520):
    m = tm('sij', '#4dff9a', 0.22, emit=5)
    for k in range(2):
        bm = bmesh.new(); prev = None; x = x0
        while x <= x1:
            yy = y0 + k * 70 + 45 * math.sin(x / 95 + k)
            a = bm.verts.new((x, yy, z0 + k * 25)); b = bm.verts.new((x, yy + 12, z1 + k * 30 + 28 * math.sin(x / 55)))
            if prev: bm.faces.new((prev[0], prev[1], b, a))
            prev = (a, b); x += 10
        no_shadow(mk('sij', bm, m, smooth=True))

def cloud(x, y, z, sx, sy, sz, colr='#4a4f57', alpha=1.0, shadow=False):
    m = tm('oblak' + colr, colr, alpha, rough=1.0) if alpha < 1 else mat('oblak' + colr, colr, 1.0)
    o = sph('oblak', 1.0, (x, y, z), m, scl=(sx, sy, sz), sub=3)
    if not shadow: no_shadow(o)
    return o

def render2(R):
    SC.render.engine = 'CYCLES'; SC.cycles.device = 'CPU'; SC.cycles.samples = 12 if FAST else 64
    SC.cycles.use_denoising = True; SC.cycles.max_bounces = 4; SC.cycles.transparent_max_bounces = 24
    SC.view_settings.view_transform = 'AgX'
    try: SC.view_settings.look = 'AgX - Punchy'
    except Exception: pass
    cd = bpy.data.cameras.new('cam'); cd.lens = R.get('lens', 35); cd.clip_end = 4000; cd.clip_start = R.get('clip', 0.1)
    co = bpy.data.objects.new('cam', cd); col().objects.link(co); co.location = R['cam']
    d = Vector(R['tgt']) - Vector(R['cam']); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if 'dof' in R:
        cd.dof.use_dof = True; cd.dof.focus_distance = (Vector(R['dof']) - Vector(R['cam'])).length; cd.dof.aperture_fstop = R.get('fstop', 2.8)
    SC.camera = co
    SC.render.resolution_x, SC.render.resolution_y = (640, 360) if FAST else (1280, 720)
    SC.render.filepath = os.path.join(OUT, 'm%02d%s.png' % (M, '_hitro' if FAST else ''))
    bpy.ops.render.render(write_still=True)

# ---------------------------------------------------------------- misije 11–25
def m11():   # Ognjena reka · Mauna Kea
    global BASE
    cx, cy = 150, 110
    def base(x, y):
        d = math.hypot(x - cx, y - cy)
        z = 0.12 * y + 4 * math.sin(x / 23) * math.cos(y / 31) + 75 * math.exp(-d * d / 9000)
        if d < 18: z -= 10 * (1 - d / 18)
        return z + 30 * sst(150, 260, y) * (0.6 + 0.4 * math.sin(x / 60))
    BASE = base
    set_road([(-160, -70), (-90, -40), (-30, -20), (20, -15), (70, -25), (130, -10), (200, 10)], 3.4)
    def colf(x, y, z, sl):
        c = mix(lin('#4a3f38'), lin('#6f5a48'), sst(0.4, 0.65, noise(x, y, 9, 13)))
        c = mix(c, lin('#8c8a5c'), 0.5 * sst(0.55, 0.75, noise(x * 1.7, y * 1.3, 7, 9)))
        return mix(c, lin('#3a2f2a'), sst(0.25, 0.5, sl))
    terrain(460, 230, colf, 20, 30); road('asfalt')
    lava([(136, 98), (112, 62), (84, 30), (58, 4), (44, -18), (38, -42), (30, -75)], 7)
    lava([(142, 94), (126, 56), (112, 26), (101, 0), (96, -12), (93, -45), (90, -80)], 5)
    zc = BASE(cx, cy)
    fire(cx, cy, zc - 3, 3.5, 16); smoke(cx, cy, zc + 4, 4.0, 14, (-0.7, 0.3), True)
    for (dx, dy) in ((-60, 250), (-30, 266), (5, 255)):
        zz = BASE(dx, dy); w = mat('kupola', '#f2f2ee', 0.3, 0.2)
        rcyl('observatorij', 7, 6, (dx, dy, zz + 3), w, n=24); sph('kupola', 7, (dx, dy, zz + 6), w, scl=(1, 1, 0.9))
    i = idx_near(-8, -17); x, y, h = on_road(i, 1.6)
    b = snap(); pickup('#f2f2ee', light=True); e = group(b, 'terenec', x, y, h); headlights(e, 2.7, 0.9, 900)
    x2, y2, h2 = on_road(i - 14, 1.6); b = snap(); pickup('#9aa0a6', light=True); group(b, 'terenec2', x2, y2, h2)
    for k, off in enumerate((22, 34, 46)):
        rx, ry, rh = on_road(min(len(ROAD) - 1, i + off), random.uniform(-2, 2)); rz = T(rx, ry)
        ring(rx, ry, 3.0, '#ff2a1a', 10)
        hz = rz + 14 + k * 6
        rock_fall((rx - 4, ry + 3, hz), (0.45, -0.3, -1))
    sky(colr='#7d6a5e', strength=0.6, sun=(58, 40), sun_e=2.2, sun_c=(1.0, 0.75, 0.55))
    return dict(cam=(x - 30, y - 42, T(x, y) + 28), tgt=(x + 60, y + 60, T(x, y) + 9), lens=22)

def m12():   # Avtek na daljinca · Suzuka (boks)
    fl = mat('tla_boks', '#a3a8ad', 0.35)
    box('tla', -14, 14, -10, 14, -0.05, 0.0, fl)
    boxes('crte_tla', [(-14, 14, -0.6, -0.5, 0.0, 0.004), (-14, 14, 6.5, 6.6, 0.0, 0.004), (-5.05, -4.95, -10, 14, 0, 0.004), (4.95, 5.05, -10, 14, 0, 0.004)],
          mat('rumena_crta', '#e8c21a', 0.5))
    wall = mat('stena', '#3a3f46', 0.7)
    box('stena_z', -14, 14, 14, 14.4, 0, 6, wall); box('stena_l', -14.4, -14, -10, 14.4, 0, 6, wall); box('stena_d', 14, 14.4, -10, 14.4, 0, 6, wall)
    box('panel', -10, 10, 13.95, 14.0, 2.4, 4.6, mat('panel_m', '#1f3c6e', 0.5))
    box('omara', -7.5, -4.5, 12.6, 13.9, 0, 1.05, mat('omara_rd', '#c4161c', 0.35), 0.03)
    boxes('predali', [(-7.4, -4.6, 12.58, 12.6, z, z + 0.02) for z in (0.25, 0.5, 0.75)], kit.DARK)
    for (x, n) in ((8.0, 4), (9.0, 3), (10.0, 4), (11.0, 2)):
        for k in range(n): torus('guma_p', 0.28, 0.06, (x, 13.2, 0.12 + k * 0.25), kit.RUB, rz=0.12, n1=20, n2=8)
    b = snap(); car('#f2f2ee', sporty=True); rbox('krilo_d', (1.9, 0.5, 0.06), (0, -2.0, 1.55), kit.BLACK); group(b, 'dirkalnik', 1.5, 8.2, math.radians(180), z=0)
    tape = mat('trak_b', '#f2f2ee', 0.5)
    loop = [(-4, 2.0), (-2, 0.8), (2, 0.6), (5, 1.6), (6.4, 4), (6.0, 7), (4, 10.6), (0, 11.4), (-3.6, 10.6), (-5.2, 7), (-5.2, 4)]
    strip(loop, 0.9, 0.96, 0.004, tape); strip(loop, -0.96, -0.9, 0.004, tape)
    for (x, y, n) in ((-2.2, 4.6, 4), (-1.5, 5.2, 3), (3.6, 3.2, 2), (5.0, 9.4, 3), (-4.3, 9.6, 2)):
        for k in range(n): torus('guma', 0.28, 0.06, (x, y, 0.12 + k * 0.24), kit.RUB, rz=0.12, n1=22, n2=8)
    rbox('deska', (0.32, 1.5, 0.03), (-2.4, 3.3, 0.42), mat('deska', '#c9a46a', 0.8), rot=(0.62, 0, 0))
    rbox('deska2', (0.32, 1.2, 0.03), (2.9, 1.6, 0.18), mat('deska', '#c9a46a', 0.8), rot=(0.3, 0, -0.5))
    for (x, y) in ((-0.5, 1.2), (1.5, 1.0), (6.0, 5.5), (-5.0, 5.5)):
        b = snap(); cone_traffic(x, y); bpy.data.objects[[n for n in snap() - b if n.startswith('stozec')][0]].scale = (0.32, 0.32, 0.32)
    rcs = [('#e8321a', 0.4, 1.1, math.radians(-75)), ('#2f6fb0', -1.6, 1.6, math.radians(-95)), ('#f2c230', -2.35, 3.6, math.radians(-10)), ('#3a9a4a', 4.4, 1.5, math.radians(-40))]
    for (c, x, y, h) in rcs:
        b = snap(); rc_buggy(c); e = group(b, 'rc', x, y, h, z=0.0 if (x, y) != (-2.35, 3.6) else 0.35, tilt=False, scale=0.1)
        if (x, y) == (-2.35, 3.6): e.rotation_euler = (0.62, 0, h)
    b = snap(); person('#c4161c'); group(b, 'mehanik', -7.5, -1.5, math.radians(-60), z=0, tilt=False)
    box('oddajnik', -7.2, -6.95, -1.25, -1.05, 1.15, 1.3, kit.BLACK)
    for (x, y) in ((-6, 0), (6, 0), (0, 8), (-6, 8), (6, 8)): area_light(x, y, 5.8, 4, 650)
    sky(colr='#c9d4e0', strength=0.35, sun=(60, 10), sun_e=1.2)
    rc = rcs[0]
    return dict(cam=(rc[1] - 0.9, rc[2] - 1.25, 0.42), tgt=(rc[1] + 0.6, rc[2] + 1.4, 0.18), lens=22, dof=(rc[1], rc[2], 0.1), fstop=2.2, clip=0.02)

def m13():   # Lovec na tornado · Detroit
    global BASE
    BASE = lambda x, y: 0.6 * math.sin(x / 37) * math.cos(y / 29)
    set_road([(-260, -20), (-120, -12), (0, 0), (120, 8), (260, 14)], 3.6)
    def colf(x, y, z, sl):
        fx, fy = math.floor((x + 3 * math.sin(y / 20)) / 46), math.floor(y / 38)
        c = [lin('#c9b25e'), lin('#6f8c42'), lin('#8a9a4e'), lin('#a8935a')][(fx * 7 + fy * 3) % 4]
        return mix(c, lin('#5f7f3a'), 0.3 * noise(x * 2, y * 2))
    terrain(560, 220, colf, 0, 80); road('asfalt', center=True)
    pm = mat('drog_d', '#6b5034', 0.9)
    for i in range(0, len(ROAD), 32):
        x, y, h = on_road(i, -8); z = T(x, y)
        rcyl('drog', 0.13, 9, (x, y, z + 4.5), pm, n=8); rbox('precka', (2.2, 0.12, 0.12), (x, y, z + 8.4), pm, rot=(0, 0, h))
    house(-60, 40, 0.3, 8, 10, 3.2, '#e9e1cf', '#5d5f63'); house(-40, 54, 0.2, 10, 14, 4.5, '#9c2f25', '#4a4d52', 'skedenj')
    rcyl('silos', 2.6, 12, (-28, 62, T(-28, 62) + 6), mat('silos', '#b9bec4', 0.4, 0.5), n=18); sph('silos_k', 2.6, (-28, 62, T(-28, 62) + 12), mat('silos', '#b9bec4', 0.4, 0.5), scl=(1, 1, 0.6))
    tx, ty = 75, 120; tz = T(tx, ty)
    fm = tm('lijak', '#857c72', 0.7, rough=1.0); fm2 = tm('lijak2', '#4e4842', 0.85, rough=1.0)
    bm = bmesh.new(); bm2 = bmesh.new(); z = 0.0
    while z < 115:
        r0 = 3 + 0.0035 * z * z; r1 = 3 + 0.0035 * (z + 8) ** 2; ox = 6 * math.sin(z / 40)
        bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=r0, radius2=r1, depth=8, matrix=MT((tx + ox, ty, tz + z + 4)))
        bmesh.ops.create_cone(bm2, cap_ends=False, segments=16, radius1=r0 * 0.55, radius2=r1 * 0.55, depth=8, matrix=MT((tx + ox, ty, tz + z + 4)))
        z += 8
    no_shadow(mk('tornado', bm, fm, smooth=True)); no_shadow(mk('tornado_j', bm2, fm2, smooth=True))
    dm = tm('prasni', '#7a6a55', 0.35, rough=1.0)
    for k in range(10): no_shadow(sph('prah', random.uniform(5, 10), (tx + random.gauss(0, 7), ty + random.gauss(0, 7), tz + random.uniform(1, 9)), dm, sub=2))
    dk = mat('delci_t', '#3a3330', 0.8)
    for k in range(60):
        a = random.uniform(0, 6.28); r = random.uniform(8, 30); hh = random.uniform(2, 55)
        rbox('delec', (random.uniform(0.3, 1.2), 0.2, 0.05), (tx + r * math.cos(a), ty + r * math.sin(a), tz + hh), dk, rot=(random.random() * 3, random.random() * 3, random.random() * 3))
    om = tm('oblak_t', '#6a7076', 1.0, emit=0.35, rough=1.0)
    no_shadow(sph('oblak', 1.0, (40, 190, 150), om, scl=(330, 260, 22), sub=3)); no_shadow(sph('oblak', 1.0, (tx, ty, 126), om, scl=(70, 60, 14), sub=3))
    sm = mat('mesto_m', '#8a96a3', 0.8)
    for k in range(26):
        bx = -220 + k * 17 + random.uniform(-4, 4); hh = random.uniform(30, 140) if abs(bx - 20) < 120 else random.uniform(15, 50)
        box('nebotičnik', bx - 6, bx + 6, 430, 445, -1, hh, sm)
    i = idx_near(-14, -2); x, y, h = on_road(i, 1.6)
    b = snap(); chaser(); e = group(b, 'lovec', x, y, h); headlights(e, 3.4, 0.9, 900)
    for (px, py) in ((40, 70), (58, 92)):
        b = snap(); probe(); group(b, 'sonda', px, py, random.uniform(0, 6))
    px, py, _ = on_road(i + 26, -1.4); b = snap(); probe(); group(b, 'sonda', px, py, 0.3)
    sky(colr='#6f7d74', strength=1.0, sun=(72, -150), sun_e=2.3, sun_c=(1.0, 0.88, 0.7))
    return dict(cam=(x - 14, y - 24, 9), tgt=(x + 30, y + 60, 14), lens=20)

def m14():   # Sladoledar · Rio de Janeiro
    global BASE
    BASE = lambda x, y: -0.5 * sst(14, 40, y) + 0.08 * math.sin(x / 9) * sst(14, 40, y)
    set_road([(-260, -2), (260, -2)], 4.6)
    def colf(x, y, z, sl):
        if y < 3.6: return lin('#9aa0a6')
        if y < 11: return lin('#ece6da')
        return mix(lin('#ead6aa'), lin('#cdb383'), sst(28, 40, y))
    terrain(520, 260, colf, 0, 30); road('asfalt', center=True)
    bm = bmesh.new(); bm_m = mat('mozaik_c', '#1d1d1f', 0.7)
    for k in range(4):
        yc = 4.6 + 6.0 * (k + 0.5) / 4; prev = None; x = -150
        while x <= 150:
            off = 0.42 * math.sin(x * 2 * math.pi / 4.2 + k * 0.7); z = T(x, yc) + 0.015
            a = bm.verts.new((x, yc + off - 0.3, z)); b_ = bm.verts.new((x, yc + off + 0.3, z))
            if prev: bm.faces.new((prev[0], prev[1], b_, a))
            prev = (a, b_); x += 0.3
    mk('valovi', bm, bm_m)
    box('morje', -500, 500, 38, 700, -1.6, -0.3, tm('morje', '#2a7fa0', 0.88, rough=0.06))
    box('pena', -500, 500, 37.5, 39.0, -0.32, -0.28, tm('pena', '#ffffff', 0.55, rough=0.6))
    for x in range(-140, 141, 14): palm(x + random.uniform(-2, 2), 4.9 if (x // 14) % 2 else 10.4)
    cols = ['#e8506a', '#f2c230', '#2f6fb0', '#3a9a4a', '#f07a12', '#9a4ac4']
    for k in range(48):
        x, y = random.uniform(-120, 120), random.uniform(16, 33)
        umbrella_c = random.choice(cols)
        b = snap(); rcyl('drog', 0.03, 2.3, (0, 0, 1.15), mat('drog_b', '#e9e6df', 0.5)); rcyl('sencnik', 1.3, 0.45, (0, 0, 2.3), mat('sen' + umbrella_c, umbrella_c, 0.6), r2=0.05, n=10)
        group(b, 'sencnik', x, y, 0, tilt=False)
        box('brisaca', x + 0.8, x + 1.6, y - 0.9, y + 0.9, T(x, y) + 0.01, T(x, y) + 0.03, mat('bris' + umbrella_c, random.choice(cols), 0.8))
        if random.random() < 0.6: b = snap(); person(random.choice(cols), lying=True); group(b, 'kopalec', x + 1.2, y, random.uniform(0, 6), tilt=False)
    vx = 0.0; b = snap(); icecream_van(); group(b, 'sladoledar', vx, -0.3, -math.pi / 2)
    for k, (dx, dy, sc) in enumerate(((2.5, 5.3, 0.62), (4.0, 5.6, 0.7), (-2.0, 5.2, 0.6), (9.0, 5.4, 0.66), (14, 6.0, 0.63))):
        b = snap(); person_wave(cols[k % len(cols)]) if k != 2 else person(cols[k]); group(b, 'otrok', vx + dx, dy, math.pi + random.uniform(-0.4, 0.4), tilt=False, scale=sc)
    b = snap(); person('#f2f2ee'); group(b, 'mama', vx + 3.4, 6.2, math.pi, tilt=False)
    for x in (-60, -45, 45, 62):
        building(x, -24, 14, 12, random.uniform(22, 40), random.choice(['#efe3c8', '#e8cfa8', '#f1e9dc', '#dcd2bf']))
    rk = mat('granit', '#6d7a64', 0.85)
    sph('kruh', 1.0, (vx + 110, 300, -10), rk, scl=(30, 26, 60), sub=3); sph('hrib', 1.0, (vx + 60, 280, -10), rk, scl=(24, 20, 34), sub=3)
    sky(colr='#9fcbef', strength=1.0, sun=(40, 160), sun_e=4.0)
    return dict(cam=(vx - 16, -24, 15), tgt=(vx + 5, 18, 4), lens=28)

def m15():   # Na tirih · Longford
    global BASE
    ang = math.radians(-20); ux, uy = math.cos(ang), math.sin(ang)
    def base(x, y):
        dperp = abs(-uy * x + ux * y)
        z = 3 * math.sin(x / 45) * math.cos(y / 55) + 2 * math.sin((x + y) / 70)
        return z * sst(6, 30, dperp)
    BASE = base
    set_road([(-140, -110), (-60, -45), (0, 0), (55, 45), (130, 120)], 3.4)
    terrain(420, 210, pal('#a3a067', '#8c8a55', '#7f7b6a', (0.3, 0.5)), 0, 0); road('asfalt', center=True)
    rail_line(0, 0, ang, -220, 220, z=-0.45)
    hr = math.atan2(-(ROAD[idx_near(10, 8)][0] - ROAD[idx_near(-10, -8)][0]), ROAD[idx_near(10, 8)][1] - ROAD[idx_near(-10, -8)][1])
    fx, fy = -math.sin(hr), math.cos(hr); rx, ry = math.cos(hr), math.sin(hr)
    for (d, s) in ((-6.5, 1), (6.5, -1)):
        bx, by = fx * d + rx * s * (RHW + 0.8), fy * d + ry * s * (RHW + 0.8)
        b = snap(); barrier(4.2); group(b, 'zapornica', bx, by, hr + (math.pi if s > 0 else 0.0), tilt=False)
    b = snap(); car('#7a5a3c'); rbox('pokrov_m', (1.5, 1.1, 0.04), (0, 2.0, 1.45), mat('avto#7a5a3c', '#7a5a3c', 0.3, 0.1), rot=(-0.95, 0, 0))
    group(b, 'pokvarjen', fx * 0.3, fy * 0.3, hr + 0.15)
    smoke(fx * 2.4, fy * 2.4, T(0, 0) + 1.0, 0.16, 6, (0.2, 0.15), False)
    b = snap(); pickup('#2f4f7f'); group(b, 'potiskam', -fx * 4.85, -fy * 4.85, hr + 0.08)
    b = snap(); person_wave('#d6332a'); group(b, 'voznik', rx * 4.5 + fx * 1.5, ry * 4.5 + fy * 1.5, hr + math.pi / 2, tilt=False)
    t = 60; lx, ly = ux * t, uy * t; hl = math.atan2(ux, -uy)
    b = snap(); locomotive(); e = group(b, 'lokomotiva', lx, ly, hl, z=0.15, tilt=False)
    for k in range(5):
        tt = t + 18.6 + k * 15.2; b = snap(); wagon(random.choice(['#8a8f96', '#6f7f8a', '#9c6a4a'])); group(b, 'vagon', ux * tt, uy * tt, hl, z=0.15, tilt=False)
    spot(lx - ux * 9.5, ly - uy * 9.5, 1.8, lx - ux * 60, ly - uy * 60, 0, 90000, 0.5)
    for k in range(40):
        x, y = random.uniform(-150, 150), random.uniform(-150, 150)
        if abs(-uy * x + ux * y) > 14 and not near_road(x, y, 9): eucalyptus(x, y, random.uniform(0.7, 1.1))
    fence_line([(30, -60), (90, -40), (110, 10)])
    for k in range(8):
        b = snap(); sheep(); group(b, 'ovca', random.uniform(60, 100), random.uniform(-40, -5), random.uniform(0, 6))
    sky(colr='#b4cde6', sun=(48, -60), sun_e=3.4)
    return dict(cam=(-24, -30, 16), tgt=(24, 0, 1), lens=30)

def m16():   # Za balonom · Toskana
    global BASE
    BASE = lambda x, y: 10 * math.sin(x / 55) * math.cos(y / 65) + 7 * math.sin((x + y) / 40) + 0.05 * y
    set_road([(-160, -90), (-90, -50), (-40, -40), (0, -10), (30, 30), (80, 60), (150, 80)], 2.8)
    def colf(x, y, z, sl):
        k = (math.floor((x + 8 * math.sin(y / 25)) / 55) * 3 + math.floor((y + 6 * math.sin(x / 30)) / 45) * 5) % 4
        c = [lin('#c9a95a'), lin('#7d8c4a'), lin('#8a6a4a'), lin('#b9a05e')][k]
        return mix(c, lin('#6f7f45'), 0.25 * noise(x * 2.3, y * 2.1))
    terrain(480, 230, colf, 0, 30); road2('#d8c9a8', shoulder='#c9b48c')
    ip = idx_near(-6, -16)
    for i in range(max(0, ip - 60), min(len(ROAD), ip + 70), 9):
        for s in (-1, 1):
            x, y, h = on_road(i, s * 5.5); cypress(x, y)
    house(46, -24, 0.4, 9, 12, 6, '#d9b48a', '#a5543a', 'kmetija'); house(-60, 30, 1.0, 8, 9, 5, '#e2c39a', '#a5543a')
    bm = bmesh.new(); vm = mat('trta', '#4f6b2e', 0.9); y = 0.0
    while y < 38:
        x = 62.0
        while x < 110:
            bmesh.ops.create_cube(bm, size=1.0, matrix=MT((x + 1.5, y, T(x + 1.5, y) + 0.6), (0, 0, 0), (3.0, 0.5, 1.2))); x += 3.1
        y += 2.6
    mk('vinograd', bm, vm)
    bx, by = 18, 32; bz = T(bx, by) + 18
    b = snap(); balloon(); group(b, 'balon', bx, by, 0.4, z=bz, tilt=False)
    b = snap(); balloon(('#3a9a4a', '#f2f2ee', '#f07a12')); group(b, 'balon2', -90, 160, 0, z=T(-90, 160) + 75, tilt=False, scale=0.9)
    lx, ly = 40, 60; lz = T(lx, ly)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=1.0, radius2=1.0, depth=0.05, matrix=MT((lx, ly, lz + 0.15), (0, 0, 0.4), (11, 7, 1)))
    mk('pristanek', bm, tm('pristanek', '#ff8a1a', 0.35, emit=1.5))
    ring(lx, ly, 7.5, '#ff8a1a', 4, 0.15)
    i = idx_near(-6, -16); x, y, h = on_road(i, 0)
    b = snap(); pickup('#2f5d9a'); box('prikolica', -1.0, 1.0, -6.5, -3.4, 0.45, 1.3, mat('prik_s', '#c9ccd0', 0.5, 0.3)); group(b, 'ekipa', x, y, h)
    mm = tm('megla', '#ffffff', 0.18, rough=1.0)
    for (mx, my) in ((-80, 60), (20, 120), (110, -40), (-120, -20)):
        no_shadow(sph('megla', 1.0, (mx, my, BASE(mx, my) + 2), mm, scl=(45, 30, 3), sub=2))
    sky(colr='#f2c6a0', strength=0.95, sun=(80, 90), sun_e=3.2, sun_c=(1.0, 0.74, 0.52))
    return dict(cam=(-40, -60, 12), tgt=(18, 32, 16), lens=24, pts={'balon': (bx, by, bz + 12), 'pristanek': (lx, ly, lz)})

def m17():   # Ledeni most · Trois-Rivières
    global BASE
    def base(x, y):
        a = abs(y) - 85
        return 0.0 if a < 0 else 0.25 * a + 6 * sst(0, 60, a) * (0.5 + 0.5 * math.sin(x / 37))
    BASE = base
    set_road([(-6, -200), (-3, -90), (0, 0), (4, 90), (8, 200)], 3.8)
    def colf(x, y, z, sl):
        if abs(y) < 84:
            c = mix(lin('#d6e6ef'), lin('#9fbfd4'), sst(0.45, 0.7, noise(x * 0.8, y * 0.8, 11, 7)))
            return mix(c, lin('#f2f6f8'), 0.5 * sst(0.55, 0.75, noise(x * 2.1, y * 1.9)))
        return mix(lin('#f2f5f7'), lin('#dfe6ec'), noise(x, y))
    terrain(460, 230, colf, 0, 0); road2('#9fb3c2', shoulder=None, rough=0.5)
    sm = mat('snezni_rob', '#f6f8fa', 0.6); bm = bmesh.new()
    for i in range(0, len(ROAD), 3):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 0.7))
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=MT((x, y, T(x, y) + 0.1), (0, 0, h), (0.9, 2.2, 0.45)))
    mk('snezni_rob', bm, sm, smooth=True)
    for i in range(0, len(ROAD), 14):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 2.2)); tree(x, y, 0.3)
    forest(260, -230, 230, 95, 230, 6); forest(220, -230, 230, -230, -95, 6)
    random.seed(17)
    for k in range(16):
        x = random.uniform(-120, 120); y = random.uniform(110, 150)
        if abs(x) > 14: building(x, y, random.uniform(8, 12), random.uniform(8, 10), random.uniform(6, 10), random.choice(['#e8e0cf', '#c9b59a', '#d9d0c0']), '#5a5d63', lit=4)
    church(26, 128, 0, '#e8e2d4', '#5a5d63', '#c9ced3', 30, lit=3)
    for k in range(12): point_light(random.uniform(-110, 110), random.uniform(112, 150), 30, 4000, (1.0, 0.78, 0.5), 3)
    i = idx_near(-1, -14); x, y, h = on_road(i, 1.4)
    b = snap(); box_truck('#2f6fb0', '#e9e6df'); e = group(b, 'tovornjak', x, y, h, tilt=False); headlights(e, 3.4, 0.9, 1400)
    cm = mat('razpoka', '#36536d', 0.4); lst = []
    for k in range(34):
        a = random.uniform(0, 6.28); L = random.uniform(2, 9); r0 = random.uniform(1.5, 5)
        cx_, cy_ = x + math.cos(a) * (r0 + L / 2), y - 6 + math.sin(a) * (r0 + L / 2)
        rbox('razpoka', (L, 0.06, 0.02), (cx_, cy_, 0.03), cm, rot=(0, 0, a))
    for k in range(10):
        a = random.uniform(-0.6, 0.6) + math.pi / 2; L = random.uniform(3, 8)
        rbox('razpoka_n', (L, 0.05, 0.02), (x + random.uniform(-3, 3), y + 9 + random.uniform(0, 8), 0.03), cm, rot=(0, 0, a))
    aurora(y0=260, z0=30, z1=120)
    sky(colr='#3e4f7a', strength=0.65, sun=(86, -100), sun_e=1.1, sun_c=(1.0, 0.62, 0.68))
    return dict(cam=(x + 14, y - 24, 12), tgt=(x - 3, y + 22, 2), lens=28)

def m18():   # Kaskader · Moki Dugway
    global BASE
    BASE = lambda x, y: 2.5 * math.sin(x / 31) * math.cos(y / 27) + 1.5 * math.sin((x - y) / 19)
    set_road([(-200, -40), (-90, -25), (0, 0), (90, 25), (200, 40)], 3.6)
    terrain(480, 230, pal('#c4703c', '#d9925c', '#9c4f2a', (0.25, 0.45)), 0, 60); road2('#b88a62', shoulder='#c98a5a')
    for (x, y, w, d, h) in ((-160, 320, 70, 45, 85), (-40, 380, 50, 40, 120), (60, 300, 90, 55, 70), (170, 360, 40, 35, 110), (260, 280, 60, 50, 60)):
        butte(x, y, w, d, h)
    for k in range(90):
        x, y = random.uniform(-200, 200), random.uniform(-80, 220)
        if not near_road(x, y, 4): bush(x, y, 0.5, '#7f8a6a')
    i = idx_near(6, 1.5); x, y, h = on_road(i, 0)
    b = snap(); hexa('rampa', [(-1.6, -2.2, 0), (1.6, -2.2, 0), (1.6, 2.2, 0), (-1.6, 2.2, 0), (-1.6, -2.2, 0.05), (1.6, -2.2, 0.05), (1.6, 2.2, 1.3), (-1.6, 2.2, 1.3)], mat('rampa_l', '#9a6a3c', 0.8))
    group(b, 'rampa', x, y, h)
    cx_, cy_, ch = on_road(i + 9, 0); b = snap(); car('#a3201c', sporty=True); e = group(b, 'kaskader', cx_, cy_, ch, z=T(cx_, cy_) + 3.6, tilt=False); e.rotation_euler.x = 0.18
    fireball(x - 4, y + 7, T(x, y) + 3.5, 1.4)
    b = snap()
    gm = mat('zerjav_k', '#2a2d33', 0.5, 0.3); sv = mat('srebrna', '#b9bec4', 0.3, 0.8)
    box('podnozje', -0.8, 0.8, -1.0, 1.0, 0.0, 0.5, gm, 0.05); box('steber', -0.15, 0.15, -0.15, 0.15, 0.5, 2.2, gm)
    rbox('roka', (0.22, 7.5, 0.22), (0, 1.5, 3.4), sv, rot=(0.35, 0, 0)); box('kamera', -0.25, 0.25, 4.9, 5.5, 4.3, 4.7, kit.BLACK, 0.03)
    box('protiutez', -0.35, 0.35, -2.4, -1.8, 1.7, 2.3, gm)
    group(b, 'zerjav', x + 8, y + 12, math.radians(150))
    rail = mat('tir_d', '#9aa0a6', 0.3, 0.8)
    for s in (-1, 1): rbox('dolly_tir', (12, 0.06, 0.06), (x - 6, y - 8 + s * 0.4, T(x - 6, y - 8) + 0.06), rail, rot=(0, 0, h + math.pi / 2))
    b = snap(); box('vozicek', -0.6, 0.6, -0.5, 0.5, 0.1, 0.5, gm); box('kam2', -0.2, 0.2, -0.3, 0.3, 1.2, 1.6, kit.BLACK); person('#2a2d33'); group(b, 'snemalec', x - 4, y - 8, h + math.pi / 2)
    b = snap(); person('#f2f2ee'); group(b, 'reziser', x - 12, y + 10, math.radians(160))
    b = snap(); box('stol', -0.3, 0.3, -0.3, 0.3, 0.45, 0.5, kit.BLACK); box('naslon', -0.3, 0.3, -0.33, -0.3, 0.5, 0.95, kit.BLACK); group(b, 'stol', x - 11, y + 11.2, math.radians(160))
    for (dx, dy) in ((-16, 4), (14, 14)):
        b = snap(); rcyl('stojalo', 0.03, 1.6, (0, 0, 0.8), gm, n=6); rbox('odsevnik', (1.3, 0.03, 1.3), (0, 0, 2.0), sv, rot=(0.3, 0, 0)); group(b, 'odsevnik', x + dx, y + dy, random.uniform(0, 6))
    for k in range(3):
        b = snap(); box('prikolica', -1.3, 1.3, -5, 5, 0.6, 3.4, mat('prik_b', '#eceae4', 0.4), 0.2); group(b, 'prikolica', x - 40 + k * 9, y + 28, 0.3)
    b = snap(); box('dron', -0.25, 0.25, -0.25, 0.25, 0, 0.12, kit.BLACK)
    for (dx, dy) in ((-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3)): cyl('propeler', 0.2, 0.02, (dx, dy, 0.14), tm('prop', '#222222', 0.3), 'Z', 12)
    group(b, 'dron', x + 14, y + 6, 0, z=T(x, y) + 9, tilt=False)
    sky(colr='#9cc0e6', sun=(42, -130), sun_e=4.0)
    return dict(cam=(x - 14, y - 22, T(x, y) + 8), tgt=(x + 8, y + 5, T(x, y) + 3), lens=26)

def m19():   # Pred plimo · Townsville
    global BASE
    def base(x, y):
        z = 0.12 * math.sin(x / 7) * math.cos(y / 5) + 0.62 - 0.006 * y
        d = math.hypot(x - 14, y - 235); z += 9 * math.exp(-d * d / 1600)
        return z + 2.5 * sst(-60, -130, y)
    BASE = base
    set_road([(-6, -190), (-2, -60), (2, 60), (6, 180), (12, 218)], 3.2)
    def colf(x, y, z, sl):
        c = mix(lin('#b9a77f'), lin('#97875f'), sst(0.4, 0.6, noise(x * 1.5, y * 1.5, 5, 7)))
        return mix(c, lin('#5f7f3a'), sst(1.6, 2.6, z))
    terrain(460, 260, colf, 0, 40); road2('#5d5f61', shoulder='#8f8468')
    wl = 0.4
    box('morje', -400, 400, -60, 520, -3, wl, tm('morje_p', '#2f9db0', 0.7, rough=0.05))
    pm = mat('kol', '#1d1d1f', 0.6); pw = mat('kol_b', '#f2f2ee', 0.6)
    for i in range(0, len(ROAD), 18):
        for s in (-1, 1):
            x, y, h = on_road(i, s * (RHW + 1.4)); z = T(x, y)
            for k in range(4): rcyl('kol', 0.09, 0.6, (x, y, z + 0.3 + k * 0.6), pm if k % 2 else pw, n=8)
    for yy in (70, 140):
        i = idx_near(0, yy); x, y, h = on_road(i, RHW + 5); z = T(x, y)
        b = snap(); rm = mat('stolp', '#e9e6df', 0.5)
        for (dx, dy) in ((-1.2, -1.2), (1.2, -1.2), (-1.2, 1.2), (1.2, 1.2)): box('noga', dx - 0.1, dx + 0.1, dy - 0.1, dy + 0.1, -1, 4.2, rm)
        box('ploscad', -1.6, 1.6, -1.6, 1.6, 4.2, 4.4, rm); boxes('ograja', [(-1.6, 1.6, -1.6, -1.5, 4.4, 5.3), (-1.6, 1.6, 1.5, 1.6, 4.4, 5.3), (-1.6, -1.5, -1.6, 1.6, 4.4, 5.3)], mat('ograja_r', '#d6201a', 0.5))
        group(b, 'zavetje', x, y, h, z=z, tilt=False)
    for k in range(14): palm(14 + random.uniform(-26, 26), 235 + random.uniform(-22, 22))
    house(22, 232, 0.4, 5, 6, 3, '#dcd2bc', '#8a7a5a', 'koca')
    for k in range(30):
        x, y = random.uniform(-160, 160), random.uniform(-150, -70)
        if not near_road(x, y, 6): bush(x, y, 1.2, '#2f4a2a')
    i = idx_near(1, 34); x, y, h = on_road(i, 1.4)
    b = snap(); pickup('#f2f2ee'); group(b, 'zdravnik', x, y, h)
    pm2 = tm('pljusk', '#ffffff', 0.55, rough=0.4)
    for k in range(26):
        a = random.uniform(-1.2, 1.2) + h + math.pi / 2; r = random.uniform(1.0, 2.6)
        sph('pljusk', random.uniform(0.08, 0.22), (x + math.cos(a) * r, y + math.sin(a) * r + 1.8, wl + random.uniform(0.05, 0.9)), pm2, sub=1)
    sky(colr='#a6cbe8', sun=(52, 120), sun_e=3.6)
    return dict(cam=(x - 18, y - 30, 14), tgt=(x + 3, y + 40, 0), lens=30)

def m20():   # Fotosafari · Great Alpine Road
    global BASE
    BASE = lambda x, y: 8 * math.sin(x / 45) * math.cos(y / 50) + 0.08 * y
    set_road([(-160, -70), (-80, -40), (-20, -35), (30, -10), (90, 10), (160, 30)], 3.2)
    terrain(440, 220, pal('#a09a5a', '#7f8a4c', '#8a7f6a', (0.3, 0.5)), 0, 20); road('asfalt')
    cx, cy = 6, -12
    for k in range(120):
        x, y = random.uniform(-180, 180), random.uniform(-140, 200)
        if math.hypot(x - cx, y - cy) > 22 and not near_road(x, y, 7): eucalyptus(x, y, random.uniform(0.75, 1.15))
    kang = [(cx - 4, cy + 2, 0.4, False), (cx + 3, cy - 1, 2.2, False), (cx + 8, cy + 6, 1.0, True), (cx - 9, cy + 9, -0.4, False)]
    for (x, y, hh, hop) in kang:
        b = snap(); kangaroo(hop); group(b, 'kenguru', x, y, hh, z=T(x, y) + (0.9 if hop else 0), tilt=False)
    for (x, y, hh) in ((cx + 14, cy + 14, 2.6), (cx + 17, cy + 11, 2.0)):
        b = snap(); emu(); group(b, 'emu', x, y, hh)
    tx, ty = cx - 15, cy + 12; e = eucalyptus(tx, ty, 1.0)
    b = snap(); koala(); group(b, 'koala', tx + 0.35, ty - 0.2, 0.3, z=T(tx, ty) + 5.2, tilt=False)
    i = idx_near(0, -26); x, y, h = on_road(i, 1.4)
    b = snap(); pickup('#d9c9a0')
    boxes('lok', [(-0.9, -0.85, -1.0, -0.95, 1.2, 2.3), (0.85, 0.9, -1.0, -0.95, 1.2, 2.3), (-0.9, 0.9, -1.0, -0.95, 2.25, 2.33)], kit.BLACK)
    group(b, 'safari', x, y, h)
    b = snap(); person('#7a8a5a'); box('fotoaparat', -0.12, 0.12, 0.1, 0.3, 1.5, 1.68, kit.BLACK); group(b, 'fotograf', x - math.cos(h) * 0.1, y - math.sin(h) * 0.1 - 1.4, h + 0.9, z=T(x, y) + 0.95, tilt=False)
    kx, ky = kang[1][0], kang[1][1]
    sky(colr='#a9c6e8', sun=(42, -30), sun_e=3.6)
    return dict(cam=(x - 8, y - 14, T(x, y) + 7), tgt=(cx, cy, T(cx, cy) + 1), lens=34, pts={'fokus': (kx, ky, T(kx, ky) + 0.9)})

def m21():   # Zadnji trajekt · Riviera
    global BASE
    BASE = lambda x, y: 1.5 if y > -40 else 1.5 + 0.38 * (-40 - y) + 4 * math.sin(x / 23) * sst(-40, -70, y)
    set_road([(-70, -150), (-40, -88), (-12, -44), (0, -18), (0, 0.5)], 3.6)
    terrain(240, 140, pal('#8a8a5a', '#a09060', '#9a8a70', (0.35, 0.55)), 0, -160); road('asfalt')
    con = mat('beton', '#b9b4aa', 0.8)
    box('pomol', -150, 150, -40, 0, -6, 1.5, con)
    box('morje', -500, 500, 0, 800, -8, 0, tm('morje_r', '#24557a', 0.92, rough=0.07))
    for x in range(-60, 61, 6):
        if abs(x) > 6: rcyl('bitva', 0.25, 0.6, (x, -1.0, 1.8), kit.DARK, n=10)
    for x in range(-120, 121, 16): palm(x + random.uniform(-2, 2), -34 + random.uniform(-2, 2))
    cols = ['#e8c39e', '#f2d8a7', '#d99a7c', '#efe3c8', '#e6b98e', '#f0cfa0']
    for k in range(40):
        x, y = random.uniform(-110, 110), random.uniform(-180, -52)
        if not near_road(x, y, 7): house(x, y, random.uniform(-0.3, 0.3), random.uniform(7, 10), random.uniform(8, 11), random.uniform(5, 9), random.choice(cols), '#b5532f')
    ys = 12; L = 90
    b = snap(); ferry(); group(b, 'trajekt', 0, ys + L / 2, 0, z=0.0, tilt=False)
    fm = tm('brazda', '#ffffff', 0.4, rough=0.5)
    for k in range(14): no_shadow(sph('pena', 1.0, (random.uniform(-6, 6), random.uniform(2, ys), 0.02), fm, scl=(random.uniform(1.5, 3.5), random.uniform(1, 2.5), 0.05)))
    b = snap(); car('#f2c230', sporty=True, lights=True); e = group(b, 'skok', 0, 1.6, 0, z=3.0, tilt=False); e.rotation_euler.x = 0.12
    sk = mat('sled', '#2a2a2c', 0.9)
    for s in (-0.75, 0.75): box('sled', s - 0.12, s + 0.12, -22, -0.5, 1.505, 1.52, sk)
    for (x, y) in ((-6, -6), (-8, -4), (7, -5)):
        b = snap(); person_wave(random.choice(['#c4161c', '#2f6fb0', '#f2f2ee'])); group(b, 'gledalec', x, y, math.pi * 0.9, z=1.5, tilt=False)
    sky(colr='#f0a37a', strength=0.95, sun=(82, -90), sun_e=3.0, sun_c=(1.0, 0.7, 0.5))
    return dict(cam=(-22, -14, 6), tgt=(2, 8, 3.5), lens=28)

def m22():   # Smetarski dan · Crystal Palace
    global BASE
    BASE = lambda x, y: 0.04 * x
    set_road([(-220, 0), (220, 0)], 3.4)
    def colf(x, y, z, sl):
        a = abs(y)
        if a < 6.5: return lin('#a3a7ab')
        if a < 10: return mix(lin('#5f7f3a'), lin('#6f8c42'), noise(x, y))
        return lin('#7d7f82')
    terrain(460, 120, colf, 0, 0); road('asfalt', lines=False)
    cm = mat('robnik', '#c9ccd0', 0.7)
    for s in (-1, 1):
        rbox('robnik', (440, 0.25, 0.14), (0, s * 3.5, 0), cm)
    terrace(-70, 70, 10, 1); terrace(-70, 70, -10, -1)
    hm = mat('zid_vrt', '#8f4f3c', 0.85)
    for s in (-1, 1): box('zidek', -70, 70, s * 6.6 - 0.15, s * 6.6 + 0.15, -3, T(0, 0) + 0.8, hm)
    cols = ['#d8d8d4', '#2a2a2c', '#7f8a93', '#2f5d9a', '#9a2f2f', '#3a6a4a']
    for k, x in enumerate(range(-60, 61, 7)):
        if abs(x - 2) > 9:
            b = snap(); car(cols[k % len(cols)]); group(b, 'parkiran', x, -2.2, math.pi / 2 if k % 3 else -math.pi / 2)
    bc = ['#2f7d4f', '#2a2a2c', '#2f5d9a']
    for k, x in enumerate(range(-55, 61, 5)):
        if abs(x - 6) < 2: continue
        b = snap(); wbin(bc[k % 3], lid_open=(x < 0)); group(b, 'smetnjak', x + random.uniform(-0.6, 0.6), 4.1, math.pi + random.uniform(-0.3, 0.3))
    b = snap(); garbage_truck(); e = group(b, 'smetarji', 2, 1.4, -math.pi / 2)
    for (dx, dy) in ((-5.5, 3.4), (-6.8, 3.9)):
        b = snap(); person('#ff8a1a', refl=True); group(b, 'delavec', dx, dy, random.uniform(0, 6))
    sky(colr='#c4d3e2', strength=1.0, sun=(66, 140), sun_e=2.8, sun_c=(1.0, 0.88, 0.75))
    return dict(cam=(-16, -4.5, 9), tgt=(6, 3, 1.5), lens=30, pts={'roka': (2.0, 3.1, 3.4)})

def m23():   # Lovec na meteorite · Marrakesh (puščava ponoči)
    global BASE
    BASE = lambda x, y: 4 * math.sin(x / 18 + math.sin(y / 30)) * sst(-20, 40, y) + 2 * math.cos(y / 23 + x / 41)
    set_road([(-200, -60), (-90, -40), (0, -24), (90, -10), (200, 10)], 2.6)
    def colf(x, y, z, sl):
        c = mix(lin('#c79a64'), lin('#b8875a'), sst(0.4, 0.6, noise(x, y, 17, 21)))
        return mix(c, lin('#7a5a40'), sst(0.62, 0.8, noise(x * 1.3, y * 1.1, 9, 13)) * (1 - sst(-20, 40, y)))
    terrain(500, 230, colf, 0, 60); road2('#9a7a58', shoulder=None)
    stars()
    for (p, d) in (((-160, 300, 110), (0.8, -0.2, -0.45)), ((-40, 380, 150), (0.6, -0.3, -0.6)), ((90, 330, 95), (0.7, -0.1, -0.5)),
                   ((200, 420, 140), (-0.4, -0.3, -0.6)), ((-120, 430, 170), (0.9, -0.2, -0.4))):
        meteor(p, d, L=60, r=1.6)
    mx, my = 14, 12
    meteorite(mx, my, True); meteorite(-18, 28, True); meteorite(36, 40, False)
    rx, ry = 6, 34; ring(rx, ry, 3.5, '#ffd23a', 10); ring(rx, ry, 2.0, '#ffd23a', 6, 0.08)
    meteor((rx - 18, ry + 26, T(rx, ry) + 60), (0.28, -0.4, -1), L=40, r=1.0)
    kasbah(-130, 190, 0.2)
    am = mat('atlas', '#2a3048', 0.95); bm = bmesh.new(); prev = None; x = -900
    while x <= 900:
        hgt = 140 + 70 * math.sin(x / 140) + 40 * math.sin(x / 53)
        a = bm.verts.new((x, 900, -10)); b_ = bm.verts.new((x, 900, hgt))
        if prev: bm.faces.new((prev[0], prev[1], b_, a))
        prev = (a, b_); x += 30
    mk('atlas', bm, am)
    i = idx_near(0, -24); x, y, h = on_road(i, 0)
    b = snap(); pickup('#c8b28a', light=True); box('luc_streha', -0.7, 0.7, 0.15, 0.35, 2.05, 2.18, mat('luc_bela', '#fff6e0', 0.2, 0.0, 12))
    e = group(b, 'terenec', x + 6, y + 10, math.atan2(-(mx - x - 6), my - y - 10)); headlights(e, 2.7, 0.9, 1600)
    for k in range(2):
        b = snap(); pickup('#7f8a93', light=True); e2 = group(b, 'tekmec', -60 + k * 140, 70 + k * 25, random.uniform(0, 6)); headlights(e2, 2.7, 0.9, 1200)
    sk = mat('sledi', '#8a6a48', 0.95)
    sky(colr='#1b2540', strength=0.65, sun=(46, 150), sun_e=1.3, sun_c=(0.65, 0.75, 1.0))
    return dict(cam=(x - 20, y - 26, T(x, y) + 12), tgt=(x + 14, y + 40, T(x, y) + 12), lens=18)

def m24():   # Žetev pred nevihto · Medvode
    global BASE
    def base(x, y):
        z = 0.5 * math.sin(x / 40) * math.cos(y / 50)
        z += 60 * math.exp(-((x - 60) ** 2 + (y - 330) ** 2) / 9000) + 25 * math.exp(-((x + 120) ** 2 + (y - 300) ** 2) / 6000)
        return z
    BASE = base
    set_road([(-260, -40), (-100, -36), (0, -34), (100, -30), (260, -26)], 3.0)
    xcut = 6.0
    def colf(x, y, z, sl):
        if -70 < x < 70 and -26 < y < 46:
            if x < xcut: return lin('#e3cf8f') if int((x + 70) / 4) % 2 else lin('#d6c07a')
            return lin('#c9a245')
        c = mix(lin('#6f8c42'), lin('#5f7f3a'), noise(x, y))
        return mix(c, lin('#3f5a32'), sst(14, 24, z))
    terrain(560, 240, colf, 0, 120); road('asfalt')
    wm = mat('zito', '#cfa43e', 0.95)
    box('zito', xcut, 70, -26, 46, T(30, 10) - 0.05, T(30, 10) + 0.9, wm, 0.15)
    cy0 = 6.0
    box('zito_pas', xcut - 8, xcut, cy0 + 6, 46, T(0, 20) - 0.05, T(0, 20) + 0.9, wm, 0.15)
    for k in range(70):
        x, y = random.uniform(-150, 170), random.uniform(170, 330)
        if BASE(x, y) > 6: tree(x, y, 1.0, random.choice(['iglavec', 'listavec']))
    forest(60, -200, 200, 60, 160, 6, kind='listavec', keep=lambda x, y: not (-80 < x < 80 and -30 < y < 60))
    kozolec(-30, 54, 0.0); church(60, 330, 0, '#f2efe8', '#7a2e22', '#7a2e22', 24)
    house(-110, -5, 0.2, 9, 11, 6, '#efe9dc', '#8a3b2a'); house(-125, 15, 0.2, 8, 10, 5.5, '#e8e0cf', '#8a3b2a')
    b = snap(); combine(); group(b, 'kombajn', xcut - 4, cy0, 0)
    b = snap(); tractor_trailer('#2f6fb0'); group(b, 'traktor', xcut - 11.2, cy0 + 2.5, 0)
    for (x, y, sx, sy, sz) in ((-40, 300, 160, 70, 26), (80, 260, 140, 80, 30), (180, 320, 120, 60, 24), (-160, 260, 110, 60, 22)):
        no_shadow(sph('oblak', 1.0, (x, y, 95), tm('oblak_n', '#5a6068', 1.0, emit=0.3, rough=1.0), scl=(sx, sy, sz), sub=3))
    rm = tm('dez', '#8f98a3', 0.25, rough=1.0)
    for k in range(12): no_shadow(rbox('dez', (random.uniform(10, 30), 2, 90), (random.uniform(-160, 200), random.uniform(250, 330), 45), rm))
    sky(colr='#7f8a96', strength=0.8, sun=(52, -40), sun_e=3.6, sun_c=(1.0, 0.86, 0.62))
    return dict(cam=(xcut - 30, cy0 - 34, 14), tgt=(xcut + 10, cy0 + 30, 8), lens=26)

def m25():   # Spremljevalni avto · Spa
    global BASE
    BASE = lambda x, y: 0.22 * y + 6 * math.sin(x / 33) * math.cos(y / 29)
    set_road([(-120, -90), (-60, -50), (-10, -25), (20, 5), (35, 45), (30, 100)], 3.0)
    terrain(400, 200, pal('#5f7f3a', '#6f8c42', '#6b6f5a', (0.35, 0.55)), 0, 0); road('asfalt')
    forest(200, -200, 200, -200, 200, 13, kind='listavec'); forest(80, -200, 200, -200, 200, 13)
    i0 = idx_near(14, -4)
    jerseys = ['#f2c230', '#d6332a', '#2f6fb0', '#f2f2ee']
    for k, j in enumerate(jerseys):
        x, y, h = on_road(i0 + 4 + k * 3, random.uniform(-1.0, 1.0))
        b = snap(); bike(0, 0, 0, j, '#2a2d33'); group(b, 'kolesar', x, y, h)
    x, y, h = on_road(i0, 1.0); b = snap(); team_car('#1f4fa8'); e = group(b, 'ekipa', x, y, h)
    cols = ['#d6332a', '#f2c230', '#2f6fb0', '#f2f2ee', '#3a9a4a', '#f07a12', '#1d1d1f']
    for i in range(i0 - 30, min(len(ROAD) - 1, i0 + 60), 2):
        for s in (-1, 1):
            if random.random() < 0.7:
                fx, fy, fh = on_road(i, s * (RHW + random.uniform(1.0, 2.6)))
                b = snap(); fan(random.choice(cols), random.choice(cols) if random.random() < 0.25 else None)
                group(b, 'navijac', fx, fy, fh + (math.pi / 2 if s > 0 else -math.pi / 2) + random.uniform(-0.5, 0.5))
    for k in range(4):
        cx_, cy_, ch = on_road(i0 - 20 + k * 22, -(RHW + 6)); b = snap(); camper(random.choice(['#f2f2ee', '#e8e0cf'])); group(b, 'kamper', cx_, cy_, ch + 0.2)
    sky(sun=(42, -40), sun_e=3.6)
    return dict(cam=(x - 12, y - 18, T(x, y) + 9), tgt=(x + 4, y + 9, T(x, y) + 1.2), lens=30)

R = {11: m11, 12: m12, 13: m13, 14: m14, 15: m15, 16: m16, 17: m17, 18: m18, 19: m19, 20: m20, 21: m21, 22: m22, 23: m23, 24: m24, 25: m25}[M]()
render2(R)
from bpy_extras.object_utils import world_to_camera_view
pts = {}
for k, p in R.get('pts', {}).items():
    v = world_to_camera_view(SC, SC.camera, Vector(p)); pts[k] = (v.x, 1 - v.y)
json.dump(pts, open(os.path.join(OUT, 'm%02d.json' % M), 'w'))
print('MISIJA', M, 'ok', len(bpy.data.objects), 'objektov')
