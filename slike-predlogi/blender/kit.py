# Gradniki za modele v Blenderju (gasilski avti in misije). Uvozi se PO bpy.ops.wm.read_factory_settings.
import bpy, bmesh, math
from mathutils import Vector, Matrix
def col(): return bpy.context.scene.collection

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

MATS = {}
def mat(name, hexc, rough=0.5, metal=0.0, emit=0.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(hexc), 1)
        b.inputs['Emission Strength'].default_value = emit
    MATS[name] = m; return m

PARTS = []; CUTTERS = []
def mk(name, bm, m, smooth=False):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
        try: me.set_sharp_from_angle(angle=math.radians(40))
        except Exception: pass
    o = bpy.data.objects.new(name, me); col().objects.link(o); o.data.materials.append(m)
    PARTS.append(o); return o

def bevel(o, w, seg=2):
    md = o.modifiers.new('bev', 'BEVEL'); md.width = w; md.segments = seg
    md.limit_method = 'ANGLE'; md.angle_limit = math.radians(50); md.harden_normals = False
    return o

def hexa_bm(bm, P):
    v = [bm.verts.new(p) for p in P]
    for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([v[i] for i in f])

def bb(x0, x1, y0, y1, z0, z1):
    return [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]

def hexa(name, P, m, bev=0.0, seg=2):
    bm = bmesh.new(); hexa_bm(bm, P); o = mk(name, bm, m)
    if bev: bevel(o, bev, seg)
    return o

def box(name, x0, x1, y0, y1, z0, z1, m, bev=0.0, seg=2):
    return hexa(name, bb(x0, x1, y0, y1, z0, z1), m, bev, seg)

def boxes(name, lst, m):
    bm = bmesh.new()
    for b in lst: hexa_bm(bm, bb(*b))
    return mk(name, bm, m)

def cyl_bm(bm, r, d, n, axis, c):
    g = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r, radius2=r, depth=d)
    vs = g['verts']
    if axis == 'X': bmesh.ops.rotate(bm, verts=vs, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    if axis == 'Y': bmesh.ops.rotate(bm, verts=vs, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    bmesh.ops.translate(bm, vec=c, verts=vs)

def cyl(name, r, d, c, m, axis='Z', n=16, bev=0.0, seg=2, smooth=True):
    bm = bmesh.new(); cyl_bm(bm, r, d, n, axis, c); o = mk(name, bm, m, smooth)
    if bev: bevel(o, bev, seg)
    return o

def arch(target, y, z, r, hw):
    bm = bmesh.new(); cyl_bm(bm, r, hw * 3, 24, 'X', (0, y, z))
    me = bpy.data.meshes.new('cut'); bm.to_mesh(me); bm.free()
    c = bpy.data.objects.new('cut', me); col().objects.link(c); c.hide_render = True; c.display_type = 'WIRE'
    CUTTERS.append(c)
    md = target.modifiers.new('arch', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = c; md.solver = 'EXACT'
    # bevel naj bo za lokom, da zaobli tudi rob loka
    if 'bev' in target.modifiers:
        target.modifiers.move(len(target.modifiers) - 1, 0)

# ---------------------------------------------------------------- materiali
RED = mat('rdeca', '#c4161c', 0.32, 0.0)
RED2 = mat('rdeca_temna', '#8f0f14', 0.4)
WHITE = mat('bela', '#eceae4', 0.35)
YEL = mat('rumena_odsevna', '#f2d21b', 0.3)
LIME = mat('limeta', '#c9d62c', 0.32)
ALU = mat('alu', '#b9bec4', 0.32, 0.75)
ALUD = mat('alu_utor', '#6f757c', 0.45, 0.6)
TREAD = mat('alu_hodnik', '#9aa0a6', 0.55, 0.7)
DARK = mat('sasija', '#26282b', 0.6)
BLACK = mat('crna', '#151617', 0.7)
RUB = mat('guma', '#1a1a1b', 0.85)
RIM = mat('platisce', '#c9ccd0', 0.3, 0.8)
GLASS = mat('steklo', '#1b2430', 0.08, 0.2)
BLUE = mat('modra_luc', '#1f5bff', 0.2, 0.0, 9.0)
REDL = mat('rdeca_luc', '#ff2a1a', 0.3, 0.0, 3.0)
HEAD = mat('zaromet', '#fff3d6', 0.1, 0.0, 4.0)
AMB = mat('smernik', '#ff9a1a', 0.3, 0.0, 2.5)
CHROME = mat('krom', '#dfe3e8', 0.12, 1.0)

# ---------------------------------------------------------------- deli
def wheels(axles, r, w, tx, tyre_m=RUB, rim_m=RIM, n=20):
    for i, (y, dual) in enumerate(axles):
        for s in (-1, 1):
            ww = w * (1.85 if dual else 1)
            x = s * (tx + (ww - w) / 2)
            cyl('guma%d%d' % (i, s), r, ww, (x, y, r), tyre_m, 'X', n, bev=r * 0.16, seg=3)
            cyl('platisce%d%d' % (i, s), r * 0.6, ww + 0.012, (x, y, r), rim_m, 'X', n)
            cyl('pesto%d%d' % (i, s), r * 0.2, ww + 0.04, (x, y, r), DARK, 'X', 10)

def cab(name, hw, y0, y1, z0, z1, s, m, bev=0.07, rear_s=0.0, top_hw=None):
    th = top_hw if top_hw else hw
    P = [(-hw, y0, z0), (hw, y0, z0), (hw, y1, z0), (-hw, y1, z0),
         (-th, y0 + rear_s, z1), (th, y0 + rear_s, z1), (th, y1 - s, z1), (-th, y1 - s, z1)]
    return hexa(name, P, m, bev, 3)

def yfront(y1, s, z0, z1, z):
    return y1 - s * (z - z0) / (z1 - z0)

def windscreen(hw, y1, z0, z1, s, za, zb, inset=0.12, t=0.018, m=GLASS):
    L = math.hypot(z1 - z0, s); ny, nz = (z1 - z0) / L, s / L
    pts = []
    for off in (0.0, t):
        for (x, z) in ((-hw + inset, za), (hw - inset, za), (hw - inset, zb), (-hw + inset, zb)):
            y = yfront(y1, s, z0, z1, z)
            pts.append((x, y + ny * off, z + nz * off))
    P = [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]]
    return hexa('vetrobran', P, m)

def side_window(hw, yr, yf_b, yf_t, zb, zt, m=GLASS, t=0.014):
    for s in (-1, 1):
        x0, x1 = s * hw, s * (hw + t)
        P = [(x0, yr, zb), (x0, yf_b, zb), (x0, yf_t, zt), (x0, yr, zt),
             (x1, yr, zb), (x1, yf_b, zb), (x1, yf_t, zt), (x1, yr, zt)]
        hexa('okno', P, m)

def shutters(hw, segs, gap=0.1):
    pan, gro = [], []
    for s in (-1, 1):
        for (y0, y1, z0, z1) in segs:
            xa, xb = s * hw, s * (hw + 0.014)
            pan.append((min(xa, xb), max(xa, xb), y0, y1, z0, z1))
            z = z0 + gap
            while z < z1 - 0.04:
                xc = s * (hw + 0.022)
                gro.append((min(xb, xc), max(xb, xc), y0 + 0.02, y1 - 0.02, z, z + 0.012)); z += gap
    boxes('rolete', pan, ALU); boxes('utori', gro, ALUD)

def stripe(hw, y0, y1, z0, z1, m, t=0.02):
    lst = []
    for s in (-1, 1):
        xa, xb = s * hw, s * (hw + t)
        lst.append((min(xa, xb), max(xa, xb), y0, y1, z0, z1))
    boxes('trak', lst, m)

def ladder(x0, x1, y0, y1, z, step=0.32, m=ALU, rail=0.06):
    lst = [(x0, x0 + rail, y0, y1, z, z + rail), (x1 - rail, x1, y0, y1, z, z + rail)]
    y = y0 + step / 2
    while y < y1:
        lst.append((x0, x1, y, y + 0.035, z + 0.01, z + rail - 0.01)); y += step
    return boxes('lestev', lst, m)

def lightbar(y, z, hw, d=0.28, col=BLUE):
    box('luc_osnova', -hw, hw, y - d / 2, y + d / 2, z, z + 0.05, BLACK)
    box('luc_l', -hw + 0.02, -0.08, y - d / 2 + 0.02, y + d / 2 - 0.02, z + 0.05, z + 0.15, col, 0.03)
    box('luc_d', 0.08, hw - 0.02, y - d / 2 + 0.02, y + d / 2 - 0.02, z + 0.05, z + 0.15, col, 0.03)
    box('luc_sred', -0.08, 0.08, y - d / 2 + 0.03, y + d / 2 - 0.03, z + 0.05, z + 0.13, WHITE)

def mirrors(hw, y, z):
    for s in (-1, 1):
        box('ogl_roka', min(s * hw, s * (hw + 0.22)), max(s * hw, s * (hw + 0.22)), y - 0.03, y + 0.03, z + 0.3, z + 0.34, BLACK)
        box('ogledalo', min(s * (hw + 0.16), s * (hw + 0.24)), max(s * (hw + 0.16), s * (hw + 0.24)), y - 0.06, y + 0.04, z, z + 0.42, BLACK, 0.02)

def front_lights(hw, y, z, w=0.3, h=0.18):
    for s in (-1, 1):
        x0, x1 = s * (hw - 0.12 - w), s * (hw - 0.12)
        box('zaromet', min(x0, x1), max(x0, x1), y - 0.02, y + 0.02, z, z + h, HEAD, 0.02)
        x2 = s * (hw - 0.12 - w - 0.14)
        box('smernik', min(x2, x0 - s * 0.02), max(x2, x0 - s * 0.02), y - 0.02, y + 0.02, z, z + h, AMB)
        box('modra_spr', min(x2, x0 - s * 0.02), max(x2, x0 - s * 0.02), y - 0.02, y + 0.02, z + h + 0.06, z + h + 0.14, BLUE)

def rear_lights(hw, y, z):
    for s in (-1, 1):
        box('zadnja', min(s * (hw - 0.08), s * (hw - 0.38)), max(s * (hw - 0.08), s * (hw - 0.38)), y - 0.02, y + 0.02, z, z + 0.16, REDL, 0.02)
        box('zadnja_mod', min(s * (hw - 0.08), s * (hw - 0.22)), max(s * (hw - 0.08), s * (hw - 0.22)), y - 0.02, y + 0.02, z + 1.6, z + 1.75, BLUE, 0.02)

# ---------------------------------------------------------------- verzije
INFO = {}

def v_eu():   # A: evropsko gasilsko vozilo, kabina nad motorjem, dvojna kabina, rolete, lestev na strehi
    hw, r = 1.25, 0.5
    fa, ra = 2.35, -1.6
    INFO.update(name='A · Evropsko gasilsko vozilo', L=7.6, H=3.25, ymin=-3.85, ymax=3.75)
    box('sasija', -0.45, 0.45, -3.7, 3.4, 0.5, 0.85, DARK)
    c = cab('kabina', hw, 1.0, 3.62, 0.78, 3.0, 0.28, RED, 0.08); arch(c, fa, r, r + 0.1, hw)
    windscreen(hw, 3.62, 0.78, 3.0, 0.28, 1.85, 2.88)
    side_window(hw, 2.55, yfront(3.62, 0.28, 0.78, 3.0, 1.85) - 0.12, yfront(3.62, 0.28, 0.78, 3.0, 2.8) - 0.12, 1.85, 2.8)
    side_window(hw, 1.15, 2.45, 2.45, 1.85, 2.8)
    box('maska', -0.85, 0.85, 3.6, 3.66, 1.05, 1.55, BLACK, 0.02)
    box('odbijac', -1.22, 1.22, 3.52, 3.78, 0.42, 0.8, DARK, 0.04)
    front_lights(hw, 3.67, 0.88)
    b = box('nadgradnja', -hw, hw, -3.85, 0.95, 0.85, 3.0, RED, 0.05); arch(b, ra, r, r + 0.12, hw)
    shutters(hw, [(-0.75, 0.85, 0.98, 2.9), (-2.25, -0.95, 1.3, 2.9), (-3.7, -2.45, 0.98, 2.9)])
    stripe(hw + 0.014, -3.85, 3.5, 0.88, 0.97, WHITE)
    stripe(hw, 1.0, 3.45, 1.5, 1.62, YEL)
    box('hodnik', -1.1, 1.1, -3.7, 0.8, 3.0, 3.04, TREAD)
    ladder(-0.42, 0.42, -3.6, 0.7, 3.06)
    lightbar(3.05, 3.0, 0.82)
    for s in (-1, 1): box('mod_zad', min(s * 1.0, s * 1.2), max(s * 1.0, s * 1.2), -3.78, -3.6, 3.0, 3.12, BLUE, 0.02)
    mirrors(hw, 3.15, 1.85)
    box('zadaj_stopnica', -1.2, 1.2, -4.0, -3.8, 0.5, 0.62, TREAD)
    box('zadaj_rolete', -1.05, 1.05, -3.87, -3.85, 0.95, 2.85, ALU)
    rear_lights(hw, -3.87, 0.66)
    wheels([(fa, False), (ra, True)], r, 0.34, 1.0)

def v_us():   # B: ameriški s haubo, bela streha, kromiran odbijač
    hw, r = 1.22, 0.52
    fa, ra = 2.95, -1.9
    INFO.update(name='B · Ameriški s haubo', L=8.6, H=2.95, ymin=-4.3, ymax=4.3)
    box('sasija', -0.45, 0.45, -4.2, 4.0, 0.5, 0.85, DARK)
    hood = hexa('hauba', [(-0.95, 2.35, 0.9), (0.95, 2.35, 0.9), (0.95, 4.05, 0.9), (-0.95, 4.05, 0.9),
                          (-0.9, 2.35, 1.95), (0.9, 2.35, 1.95), (0.9, 3.95, 1.85), (-0.9, 3.95, 1.85)], RED, 0.1, 3)
    for s in (-1, 1):
        f = box('blatnik', min(s * 0.8, s * 1.24), max(s * 0.8, s * 1.24), 2.2, 3.75, 0.8, 1.35, RED, 0.14, 3)
        arch(f, fa, r, r + 0.1, hw)
    box('maska', -0.78, 0.78, 4.03, 4.09, 0.95, 1.78, CHROME, 0.03)
    for z in (1.05, 1.2, 1.35, 1.5, 1.65): box('maska_r', -0.7, 0.7, 4.09, 4.11, z, z + 0.04, BLACK)
    box('odbijac', -1.25, 1.25, 4.05, 4.35, 0.45, 0.78, CHROME, 0.05)
    for s in (-1, 1):
        cyl('zaromet', 0.11, 0.05, (s * 0.95, 3.72, 1.22), HEAD, 'Y', 12)
        box('mod_bl', min(s * 0.98, s * 1.18), max(s * 0.98, s * 1.18), 3.6, 3.7, 1.36, 1.44, REDL)
    c = cab('kabina', hw, 0.6, 2.4, 0.8, 2.92, 0.15, RED, 0.08)
    box('streha_bela', -hw + 0.02, hw - 0.02, 0.62, 2.22, 2.6, 2.95, WHITE, 0.07)
    windscreen(hw, 2.4, 0.8, 2.92, 0.15, 1.95, 2.55, 0.1)
    side_window(hw, 1.55, 2.25, 2.22, 1.9, 2.55); side_window(hw, 0.72, 1.45, 1.45, 1.9, 2.55)
    lightbar(1.6, 2.95, 0.85, col=REDL)
    b = box('nadgradnja', -hw, hw, -4.3, 0.55, 0.85, 2.7, RED, 0.05); arch(b, ra, r, r + 0.12, hw)
    shutters(hw, [(-1.05, 0.45, 0.98, 2.6), (-2.6, -1.2, 1.32, 2.6), (-4.15, -2.75, 0.98, 2.6)])
    stripe(hw + 0.014, -4.3, 0.55, 2.62, 2.7, WHITE); stripe(hw, 0.6, 2.4, 1.6, 1.68, WHITE)
    box('cevi', -1.0, 1.0, -4.1, 0.3, 2.7, 2.82, BLACK)
    ladder(0.55, 1.15, -4.2, 0.2, 2.84)
    mirrors(hw, 2.2, 1.85)
    box('zadaj_stopnica', -1.2, 1.2, -4.5, -4.3, 0.5, 0.62, TREAD)
    rear_lights(hw, -4.32, 0.68)
    wheels([(fa, False), (ra, True)], r, 0.34, 0.98, rim_m=CHROME)

def v_lestev():   # C: avtolestev, dve zadnji osi, vrtljiva lestev čez kabino
    hw, r = 1.25, 0.5
    fa, ra1, ra2 = 2.55, -1.3, -2.65
    INFO.update(name='C · Avtolestev', L=8.4, H=3.4, ymin=-4.0, ymax=4.4)
    box('sasija', -0.45, 0.45, -3.9, 3.6, 0.5, 0.85, DARK)
    c = cab('kabina', hw, 1.65, 3.82, 0.78, 2.95, 0.3, RED, 0.08); arch(c, fa, r, r + 0.1, hw)
    windscreen(hw, 3.82, 0.78, 2.95, 0.3, 1.8, 2.82)
    side_window(hw, 1.8, yfront(3.82, 0.3, 0.78, 2.95, 1.8) - 0.12, yfront(3.82, 0.3, 0.78, 2.95, 2.75) - 0.12, 1.8, 2.75)
    box('maska', -0.85, 0.85, 3.8, 3.86, 1.05, 1.5, BLACK, 0.02)
    box('odbijac', -1.22, 1.22, 3.72, 3.98, 0.42, 0.8, DARK, 0.04)
    front_lights(hw, 3.87, 0.88)
    b = box('nadgradnja', -hw, hw, -4.0, 1.6, 0.85, 2.0, RED, 0.05)
    arch(b, ra1, r, r + 0.12, hw); arch(b, ra2, r, r + 0.12, hw)
    shutters(hw, [(0.1, 1.5, 0.98, 1.9), (-3.85, -3.4, 0.98, 1.9)])
    stripe(hw + 0.014, -4.0, 3.7, 0.88, 0.97, WHITE)
    stripe(hw, 1.65, 3.6, 1.5, 1.6, YEL)
    for s in (-1, 1):
        for y in (1.2, -3.6):
            box('opora', min(s * 1.25, s * 1.55), max(s * 1.25, s * 1.55), y - 0.15, y + 0.15, 0.6, 0.9, DARK)
            box('opora_noga', min(s * 1.42, s * 1.55), max(s * 1.42, s * 1.55), y - 0.1, y + 0.1, 0.25, 0.6, DARK)
    cyl('vrtljivka', 0.95, 0.35, (0, -2.75, 2.18), DARK, 'Z', 24)
    box('podstavek', -0.55, 0.55, -3.3, -2.2, 2.35, 2.75, RED, 0.05)
    box('upr_mesto', 0.6, 1.1, -3.4, -2.9, 2.35, 3.0, RED, 0.04)
    box('upr_okno', 0.62, 1.12, -2.88, -2.86, 2.65, 2.92, GLASS)
    for i, (w, z) in enumerate(((0.92, 2.78), (0.78, 2.86), (0.64, 2.94))):
        y0 = -3.9 + i * 0.25; y1 = 4.2 - i * 0.35
        ladder(-w / 2, w / 2, y0, y1, z, 0.3, ALU if i % 2 == 0 else WHITE, 0.09)
    box('kosara', -0.55, 0.55, 4.0, 4.4, 2.6, 3.4, ALU, 0.03)
    box('kosara_tla', -0.55, 0.55, 4.0, 4.4, 2.6, 2.68, TREAD)
    lightbar(3.0, 2.95, 0.82)
    mirrors(hw, 3.3, 1.8)
    rear_lights(hw, -4.02, 0.66)
    wheels([(fa, False), (ra1, True), (ra2, True)], r, 0.32, 1.0)

def v_letalisko():   # D: letališko gasilsko vozilo, tri osi, velike gume, top na strehi
    hw, r = 1.5, 0.7
    fa, ra1, ra2 = 3.7, -1.5, -3.3
    INFO.update(name='D · Letališko gasilsko vozilo', L=11.2, H=3.6, ymin=-5.5, ymax=5.7)
    box('sasija', -0.55, 0.55, -5.3, 5.2, 0.7, 1.1, DARK)
    c = cab('kabina', hw, 3.45, 5.6, 0.95, 3.15, 0.85, LIME, 0.1, top_hw=1.38); arch(c, fa, r, r + 0.12, hw)
    windscreen(1.45, 5.6, 0.95, 3.15, 0.85, 1.6, 3.0, 0.1)
    side_window(hw - 0.04, 3.6, yfront(5.6, 0.85, 0.95, 3.15, 1.75) - 0.1, yfront(5.6, 0.85, 0.95, 3.15, 2.95) - 0.1, 1.75, 2.95)
    box('odbijac', -1.48, 1.48, 5.45, 5.8, 0.65, 1.05, DARK, 0.05)
    front_lights(hw, 5.62, 1.12, 0.28, 0.16)
    box('top_bl_osn', -0.18, 0.18, 5.6, 5.85, 1.05, 1.25, DARK)
    box('top_bl', -0.06, 0.06, 5.8, 6.1, 1.1, 1.2, ALU)
    b = hexa('nadgradnja', [(-hw, -5.5, 1.05), (hw, -5.5, 1.05), (hw, 3.4, 1.05), (-hw, 3.4, 1.05),
                            (-1.38, -5.4, 3.35), (1.38, -5.4, 3.35), (1.38, 3.4, 3.35), (-1.38, 3.4, 3.35)], LIME, 0.06)
    for a in (ra1, ra2): arch(b, a, r, r + 0.12, hw)
    shutters(hw, [(0.4, 3.2, 1.25, 3.0), (-2.65, -2.15, 1.6, 3.0), (-5.3, -4.15, 1.25, 3.0)])
    stripe(hw + 0.014, -5.5, 5.4, 1.12, 1.32, RED)
    box('streha', -1.3, 1.3, -5.3, 3.3, 3.35, 3.4, TREAD)
    cyl('top_osn', 0.32, 0.3, (0, 4.1, 3.3), DARK, 'Z', 16)
    hexa('top', [(-0.12, 4.0, 3.5), (0.12, 4.0, 3.5), (0.12, 5.15, 3.62), (-0.12, 5.15, 3.62),
                 (-0.12, 4.0, 3.72), (0.12, 4.0, 3.72), (0.12, 5.15, 3.76), (-0.12, 5.15, 3.76)], ALU, 0.03)
    lightbar(3.3, 3.15, 0.9)
    for s in (-1, 1): box('mod_zad', min(s * 1.05, s * 1.3), max(s * 1.05, s * 1.3), -5.45, -5.25, 3.4, 3.52, BLUE, 0.02)
    mirrors(1.4, 4.6, 2.0)
    rear_lights(hw, -5.52, 1.05)
    wheels([(fa, False), (ra1, False), (ra2, False)], r, 0.55, 1.12)

def v_gozdni():   # E: gozdni 4x4, visok, terenske gume, zaščitni lok, strešni nosilec
    hw, r = 1.2, 0.6
    fa, ra = 2.0, -1.55
    INFO.update(name='E · Gozdni gasilski 4x4', L=6.9, H=3.35, ymin=-3.35, ymax=3.6)
    box('sasija', -0.45, 0.45, -3.2, 3.1, 0.75, 1.1, DARK)
    c = cab('kabina', hw, 0.95, 3.3, 1.05, 3.1, 0.25, RED, 0.08); arch(c, fa, r, r + 0.12, hw)
    box('kabina_bela', -hw - 0.005, hw + 0.005, 0.95, 3.32, 1.05, 1.55, WHITE, 0.06)
    windscreen(hw, 3.3, 1.05, 3.1, 0.25, 2.0, 2.98)
    side_window(hw, 2.3, yfront(3.3, 0.25, 1.05, 3.1, 2.0) - 0.12, yfront(3.3, 0.25, 1.05, 3.1, 2.9) - 0.12, 2.0, 2.9)
    side_window(hw, 1.08, 2.2, 2.2, 2.0, 2.9)
    front_lights(hw, 3.34, 1.62, 0.26, 0.16)
    box('odbijac', -1.18, 1.18, 3.25, 3.5, 0.75, 1.1, DARK, 0.04)
    lok = [(-1.0, -0.92, 3.5, 3.58, 0.8, 1.75), (0.92, 1.0, 3.5, 3.58, 0.8, 1.75), (-1.0, 1.0, 3.5, 3.58, 1.68, 1.76),
           (-1.0, 1.0, 3.5, 3.58, 1.15, 1.22)]
    boxes('zascitni_lok', lok, BLACK)
    b = box('nadgradnja', -hw, hw, -3.35, 0.9, 1.1, 2.95, RED, 0.05); arch(b, ra, r, r + 0.12, hw)
    box('nadgr_bela', -hw - 0.005, hw + 0.005, -3.35, 0.9, 1.1, 1.5, WHITE, 0.04)
    shutters(hw, [(-0.85, 0.8, 1.55, 2.85), (-2.25, -0.95, 1.9, 2.85), (-3.25, -2.35, 1.55, 2.85)])
    stripe(hw + 0.014, -3.35, 3.3, 1.48, 1.56, YEL)
    rack = [(-1.05, 1.05, -3.2, -3.12, 2.98, 3.2), (-1.05, 1.05, 0.7, 0.78, 2.98, 3.2),
            (-1.05, -0.98, -3.2, 0.78, 3.14, 3.2), (0.98, 1.05, -3.2, 0.78, 3.14, 3.2)]
    boxes('stresni_nosilec', rack, BLACK)
    box('lopata', 0.2, 0.9, -2.6, -0.2, 3.0, 3.12, ALU)
    lightbar(2.75, 3.1, 0.72)
    mirrors(hw, 2.9, 2.0)
    rear_lights(hw, -3.37, 1.2)
    box('rezervna', -0.5, 0.5, -3.55, -3.37, 1.3, 2.3, RUB, 0.12)
    wheels([(fa, False), (ra, False)], r, 0.42, 0.98, rim_m=WHITE, n=24)

def v_pickup():   # F: hitro intervencijsko vozilo, poltovornjak s cisterno in navijalom
    hw, r = 0.98, 0.4
    fa, ra = 1.75, -1.6
    INFO.update(name='F · Hitro intervencijsko vozilo', L=5.5, H=2.1, ymin=-2.75, ymax=2.75)
    box('sasija', -0.4, 0.4, -2.6, 2.4, 0.35, 0.6, DARK)
    hood = hexa('hauba', [(-hw, 1.4, 0.55), (hw, 1.4, 0.55), (hw, 2.7, 0.55), (-hw, 2.7, 0.55),
                          (-0.92, 1.4, 1.22), (0.92, 1.4, 1.22), (0.9, 2.6, 1.1), (-0.9, 2.6, 1.1)], RED, 0.08, 3)
    arch(hood, fa, r + 0.0, r + 0.08, hw)
    c = cab('kabina', hw, -0.15, 1.45, 0.55, 1.95, 0.55, RED, 0.08, rear_s=0.05, top_hw=0.88)
    arch(c, fa, r, r + 0.08, hw)
    windscreen(0.9, 1.45, 0.55, 1.95, 0.55, 1.28, 1.88, 0.1)
    side_window(hw - 0.03, -0.05, 1.15, 0.95, 1.28, 1.85)
    box('maska', -0.6, 0.6, 2.68, 2.72, 0.7, 1.0, BLACK, 0.02)
    box('odbijac', -0.98, 0.98, 2.62, 2.82, 0.38, 0.65, DARK, 0.04)
    for s in (-1, 1):
        box('zaromet', min(s * 0.62, s * 0.9), max(s * 0.62, s * 0.9), 2.65, 2.71, 0.85, 1.0, HEAD, 0.02)
        box('modra_spr', min(s * 0.3, s * 0.5), max(s * 0.3, s * 0.5), 2.71, 2.74, 0.72, 0.8, BLUE)
    bed = box('keson', -hw, hw, -2.75, -0.2, 0.55, 1.2, RED, 0.04); arch(bed, ra, r, r + 0.08, hw)
    box('keson_tla', -0.9, 0.9, -2.7, -0.25, 1.0, 1.21, DARK)
    box('cisterna', -0.75, 0.75, -1.65, -0.3, 1.2, 1.85, WHITE, 0.08, 3)
    box('crpalka', -0.75, 0.0, -2.6, -1.75, 1.2, 1.6, RED2, 0.04)
    cyl('navijalo', 0.3, 0.6, (0.4, -2.2, 1.55), RED2, 'X', 18)
    cyl('cev', 0.24, 0.58, (0.4, -2.2, 1.55), BLACK, 'X', 18)
    stripe(hw, -2.75, 2.7, 0.78, 0.86, WHITE); stripe(hw, -2.75, 2.7, 0.88, 0.92, YEL)
    lightbar(0.62, 1.95, 0.72)
    mirrors(hw - 0.04, 1.2, 1.25)
    for s in (-1, 1):
        box('zadnja', min(s * 0.8, s * 0.96), max(s * 0.8, s * 0.96), -2.77, -2.74, 0.85, 1.1, REDL, 0.02)
    wheels([(fa, False), (ra, False)], r, 0.28, 0.82, rim_m=ALU)


def cut_all(prefixes=('trak', 'karo_')):
    for o in list(PARTS):
        if o.name.startswith(prefixes):
            for c in CUTTERS:
                md = o.modifiers.new('arch', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = c; md.solver = 'EXACT'

VERSIONS = [v_eu, v_us, v_lestev, v_letalisko, v_gozdni, v_pickup]
