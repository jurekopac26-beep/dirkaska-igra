# Makete 10 misij v Blenderju (samo slike). Uporaba: bl/bin/python gas/miss.py <misija 1-10> <izhod> [hitro]
import bpy, bmesh, math, sys, os, json, random
from mathutils import Vector, Matrix, kdtree
M = int(sys.argv[1]); OUT = sys.argv[2]; FAST = len(sys.argv) > 3
bpy.ops.wm.read_factory_settings(use_empty=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import *
SC = bpy.context.scene
random.seed(M * 7 + 3)

# ---------------------------------------------------------------- skupine (zgradi ob izhodišču, nato postavi)
def snap(): return set(bpy.data.objects.keys())
def group(before, name, x, y, h=0.0, z=None, tilt=True, scale=1.0):
    e = bpy.data.objects.new(name, None); col().objects.link(e)
    for n in snap() - before:
        o = bpy.data.objects[n]
        if o is not e and o.parent is None: o.parent = e
    zz = T(x, y) if z is None else z
    e.location = (x, y, zz); e.scale = (scale,) * 3
    if tilt and z is None:
        fx, fy = -math.sin(h), math.cos(h); rx, ry = fy, -fx
        p = math.atan2(T(x + fx * 2, y + fy * 2) - T(x - fx * 2, y - fy * 2), 4)
        r = -math.atan2(T(x + rx, y + ry) - T(x - rx, y - ry), 2)
        e.rotation_euler = (p, r, h)
    else: e.rotation_euler = (0, 0, h)
    bpy.context.view_layer.update()
    return e

# ---------------------------------------------------------------- teren in cesta
BASE = lambda x, y: 0.0
ROAD = []          # [(x, y, z)] gosta sredina ceste
KD = None; RHW = 3.6
def T(x, y):       # višina terena z izravnano cesto
    z0 = BASE(x, y)
    if not ROAD: return z0
    (px, py, pz), i, d = KD.find((x, y, 0))
    zc = ROAD[i][2]
    if d < RHW + 0.3: return zc - 0.3
    if d < RHW + 2.5: return zc - 0.03
    if d > RHW + 9: return z0
    t = (d - RHW - 2.5) / 6.5; t = t * t * (3 - 2 * t)
    return zc * (1 - t) + z0 * t

def catmull(pts, step=1.0):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = [Vector((*q, 0)) for q in P[i - 1:i + 3]]
        n = max(2, int((p2 - p1).length / step))
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector((*pts[-1], 0)))
    return [(v.x, v.y) for v in out]

def set_road(pts, hw=3.6, smooth=9):
    global KD, RHW
    RHW = hw
    c = catmull(pts, 1.0)
    zs = [BASE(x, y) for x, y in c]
    zz = []
    for i in range(len(zs)):
        a, b = max(0, i - smooth), min(len(zs), i + smooth + 1); zz.append(sum(zs[a:b]) / (b - a))
    ROAD[:] = [(x, y, z) for (x, y), z in zip(c, zz)]
    KD = kdtree.KDTree(len(ROAD))
    for i, (x, y, z) in enumerate(ROAD): KD.insert((x, y, 0), i)
    KD.balance()

def ribbon(name, off0, off1, lift, m, dash=None):
    bm = bmesh.new(); prev = None
    for i, (x, y, z) in enumerate(ROAD):
        j = min(i + 1, len(ROAD) - 1); k = max(i - 1, 0)
        tx, ty = ROAD[j][0] - ROAD[k][0], ROAD[j][1] - ROAD[k][1]; L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        a = bm.verts.new((x + nx * off0, y + ny * off0, z + lift)); b = bm.verts.new((x + nx * off1, y + ny * off1, z + lift))
        on = True if dash is None else (i // dash[0]) % dash[1] == 0
        if prev and on: bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)
    return mk(name, bm, m)

def road(surface='asfalt', lines=True, center=False):
    m = {'asfalt': mat('asfalt', '#4f5256', 0.88), 'makadam': mat('makadam', '#9a8b72', 0.95),
         'sneg': mat('cesta_sneg', '#d9dee4', 0.7)}[surface]
    ribbon('cesta', -RHW, RHW, 0.04, m)
    ribbon('bankina', -RHW - 0.8, -RHW, 0.02, mat('bankina', '#7d7466', 0.95)); ribbon('bankina', RHW, RHW + 0.8, 0.02, mat('bankina', '#7d7466', 0.95))
    if lines:
        w = mat('crta', '#e9e7df', 0.6)
        ribbon('crta', -RHW + 0.25, -RHW + 0.4, 0.05, w); ribbon('crta', RHW - 0.4, RHW - 0.25, 0.05, w)
    if center: ribbon('sredina', -0.07, 0.07, 0.05, mat('crta', '#e9e7df', 0.6), dash=(3, 2))

def noise(x, y, sx=13, sy=17):
    return (math.sin(x / sx + math.sin(y / 9)) + math.sin(y / sy + x / 29) + 2) / 4

def sst(a, b, v):
    t = min(1.0, max(0.0, (v - a) / (b - a))); return t * t * (3 - 2 * t)

def mix(c1, c2, t):
    return tuple(p * (1 - t) + q * t for p, q in zip(c1, c2))

def terrain(size, n, colorfn, cx=0, cy=0):
    """colorfn(x, y, z, naklon) -> barva (linearna rgb); barva gre v oglišča kot v igri"""
    bm = bmesh.new(); V = []; C = []
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            x = cx - size / 2 + size * i / n; y = cy - size / 2 + size * j / n
            z = T(x, y); row.append(bm.verts.new((x, y, z - 0.02)))
            gx = (T(x + 1, y) - T(x - 1, y)) / 2; gy = (T(x, y + 1) - T(x, y - 1)) / 2
            sl = 1 - 1 / math.sqrt(1 + gx * gx + gy * gy)
            C.append(colorfn(x, y, z, sl))
        V.append(row)
    for j in range(n):
        for i in range(n):
            bm.faces.new((V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]))
    m = bpy.data.materials.new('teren'); m.use_nodes = True; nt = m.node_tree
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'barva'
    bs = nt.nodes['Principled BSDF']; bs.inputs['Roughness'].default_value = 0.95
    nt.links.new(at.outputs['Color'], bs.inputs['Base Color'])
    o = mk('teren', bm, m, smooth=True)
    ca = o.data.color_attributes.new('barva', 'FLOAT_COLOR', 'POINT')
    for k, c in enumerate(C): ca.data[k].color = (*c, 1)
    return o

def pal(base1, base2, rock=None, rk=(0.32, 0.55), snow=None, snowz=1e9, ns=(13, 17)):
    c1, c2 = lin(base1), lin(base2); cr = lin(rock) if rock else None; cs = lin(snow) if snow else None
    def f(x, y, z, sl):
        c = mix(c1, c2, sst(0.35, 0.65, noise(x, y, *ns)))
        c = mix(c, c2, 0.25 * sst(0.4, 0.6, noise(x * 3.1, y * 2.7)))
        if cr: c = mix(c, cr, sst(rk[0], rk[1], sl))
        if cs: c = mix(c, cs, sst(snowz - 4, snowz + 4, z + 3 * math.sin(x / 7)))
        return c
    return f

GRASS = lambda: mat('trava', '#5f7f3a', 0.95)
GRASS2 = lambda: mat('trava2', '#6f8c42', 0.95)
ROCK = lambda: mat('skala', '#7f7b74', 0.9)
SNOW = lambda: mat('sneg', '#eef2f6', 0.6)
DIRT = lambda: mat('zemlja', '#8a7556', 0.95)

def patch(x, y, k=0.9, sx=13, sy=17):
    return math.sin(x / sx + math.sin(y / 9)) + math.sin(y / sy + x / 29) > k

def near_road(x, y, m=6):
    if not ROAD: return False
    return KD.find((x, y, 0))[2] < RHW + m

# ---------------------------------------------------------------- narava in hiše
TREE_T = {}
def tree(x, y, s=1.0, kind='iglavec'):
    if kind not in TREE_T:
        bm = bmesh.new(); kit.cyl_bm(bm, 0.18, 1.6, 6, 'Z', (0, 0, 0.8))
        tr = mk('debla', bm, mat('deblo', '#4a3626', 0.9)); kit.PARTS.remove(tr)
        bm = bmesh.new()
        if kind == 'iglavec':
            for (r, h, z) in ((1.9, 3.4, 2.6), (1.45, 2.8, 4.2), (0.95, 2.2, 5.6)):
                bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r, radius2=0.05, depth=h,
                                      matrix=Matrix.Translation((0, 0, z)))
            cm = mat('iglice', '#2f4a2a', 0.9)
        else:
            bmesh.ops.create_icosphere(bm, subdivisions=2, radius=2.2, matrix=Matrix.Translation((0, 0, 3.6)))
            cm = mat('listje', '#4f7a34', 0.9)
        cr = mk('krosnja', bm, cm, smooth=True); kit.PARTS.remove(cr)
        TREE_T[kind] = (tr.data, cr.data); bpy.data.objects.remove(tr); bpy.data.objects.remove(cr)
    for me in TREE_T[kind]:
        o = bpy.data.objects.new('drevo', me); col().objects.link(o)
        o.location = (x, y, T(x, y) - 0.1); o.scale = (s, s, s * random.uniform(0.85, 1.2)); o.rotation_euler.z = random.random() * 6

def forest(n, x0, x1, y0, y1, avoid=8, kind='iglavec', keep=lambda x, y: True):
    k = 0; tries = 0
    while k < n and tries < n * 20:
        tries += 1
        x, y = random.uniform(x0, x1), random.uniform(y0, y1)
        if near_road(x, y, avoid) or not keep(x, y): continue
        tree(x, y, random.uniform(0.8, 1.3), kind); k += 1

def house(x, y, h, w=7, d=9, hh=3.2, wall='#e8e0cf', roof='#8a3b2a', name='hisa'):
    b = snap()
    box(name, -w / 2, w / 2, -d / 2, d / 2, 0, hh, mat('zid' + wall, wall, 0.8))
    rm = mat('streha' + roof, roof, 0.7)
    hexa('streha', [(-w / 2 - 0.4, -d / 2 - 0.4, hh), (w / 2 + 0.4, -d / 2 - 0.4, hh), (w / 2 + 0.4, d / 2 + 0.4, hh), (-w / 2 - 0.4, d / 2 + 0.4, hh),
                    (-0.05, -d / 2 - 0.4, hh + w * 0.42), (0.05, -d / 2 - 0.4, hh + w * 0.42), (0.05, d / 2 + 0.4, hh + w * 0.42), (-0.05, d / 2 + 0.4, hh + w * 0.42)], rm)
    g = mat('okno_h', '#2a3440', 0.2)
    lst = []
    for yy in (-d / 4, d / 4):
        lst += [(w / 2, w / 2 + 0.03, yy - 0.6, yy + 0.6, 1.2, 2.3), (-w / 2 - 0.03, -w / 2, yy - 0.6, yy + 0.6, 1.2, 2.3)]
    lst.append((-0.6, 0.6, d / 2, d / 2 + 0.03, 0, 2.1))
    boxes('okna', lst, g)
    return group(b, name, x, y, h, tilt=False)

def building(x, y, w, d, hh, wall, roof='#5d5f63', h=0.0, lit=0.0):
    b = snap()
    box('blok', -w / 2, w / 2, -d / 2, d / 2, 0, hh, mat('blok' + wall, wall, 0.85))
    box('blok_streha', -w / 2 + 0.2, w / 2 - 0.2, -d / 2 + 0.2, d / 2 - 0.2, hh, hh + 0.3, mat('ravna' + roof, roof, 0.9))
    g = mat('okno_lit' if lit else 'okno_b', '#ffd48a' if lit else '#2c3846', 0.2, 0.0, lit)
    lst = []; z = 1.2
    while z < hh - 1.2:
        xx = -w / 2 + 1.2
        while xx < w / 2 - 1.2:
            if not lit or random.random() < 0.55:
                lst += [(xx, xx + 0.9, d / 2, d / 2 + 0.03, z, z + 1.3), (xx, xx + 0.9, -d / 2 - 0.03, -d / 2, z, z + 1.3)]
            xx += 2.0
        yy = -d / 2 + 1.2
        while yy < d / 2 - 1.2:
            if not lit or random.random() < 0.55:
                lst += [(w / 2, w / 2 + 0.03, yy, yy + 0.9, z, z + 1.3), (-w / 2 - 0.03, -w / 2, yy, yy + 0.9, z, z + 1.3)]
            yy += 2.0
        z += 3.0
    if lst: boxes('okna', lst, g)
    return group(b, 'stavba', x, y, h, tilt=False, z=T(x, y))

def fence_line(pts, m=None, post=2.5):
    m = m or mat('ograja', '#8a6a46', 0.9)
    lst = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0); n = max(1, int(L / post))
        for k in range(n + 1):
            x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n; z = T(x, y)
            lst.append((x - 0.07, x + 0.07, y - 0.07, y + 0.07, z, z + 1.3))
        for zz in (0.55, 1.05):
            n2 = max(1, int(L / 1.0))
            for k in range(n2):
                xa, ya = x0 + (x1 - x0) * k / n2, y0 + (y1 - y0) * k / n2
                xb, yb = x0 + (x1 - x0) * (k + 1) / n2, y0 + (y1 - y0) * (k + 1) / n2
                z = T((xa + xb) / 2, (ya + yb) / 2)
                lst.append((min(xa, xb) - 0.04, max(xa, xb) + 0.04, min(ya, yb) - 0.04, max(ya, yb) + 0.04, z + zz, z + zz + 0.1))
    boxes('ograja', lst, m)

# ---------------------------------------------------------------- učinki
def fire(x, y, z, s=1.0, n=14, light=True):
    fo = mat('plamen', '#ff6a12', 0.5, 0.0, 28); fy = mat('plamen_j', '#ffd23a', 0.5, 0.0, 45)
    bm = bmesh.new(); bm2 = bmesh.new()
    for i in range(n):
        dx, dy = random.gauss(0, 1.1 * s), random.gauss(0, 1.1 * s); hh = random.uniform(1.4, 3.2) * s
        r = random.uniform(0.35, 0.8) * s
        bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=r, radius2=0.02, depth=hh,
                              matrix=Matrix.Translation((x + dx, y + dy, z + hh / 2)) @ Matrix.Rotation(random.gauss(0, 0.15), 4, 'X'))
        bmesh.ops.create_cone(bm2, cap_ends=True, segments=6, radius1=r * 0.55, radius2=0.02, depth=hh * 0.6,
                              matrix=Matrix.Translation((x + dx, y + dy, z + hh * 0.3)))
    mk('ogenj', bm, fo, smooth=True); mk('ogenj_j', bm2, fy, smooth=True)
    if light:
        ld = bpy.data.lights.new('ogenj', 'POINT'); ld.energy = 9000 * s * s; ld.color = (1.0, 0.55, 0.2); ld.shadow_soft_size = 2
        lo = bpy.data.objects.new('ogenj', ld); col().objects.link(lo); lo.location = (x, y, z + 2.5 * s)

def smoke(x, y, z, s=1.0, n=10, drift=(1.5, 0.8), dark=True):
    sm = bpy.data.materials.new('dim'); sm.use_nodes = True; bsdf = sm.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*lin('#3a3836' if dark else '#a9a6a1'), 1); bsdf.inputs['Roughness'].default_value = 1
    bsdf.inputs['Alpha'].default_value = 0.55
    bm = bmesh.new()
    for i in range(n):
        t = i / n
        r = (1.2 + 3.5 * t) * s * random.uniform(0.8, 1.2)
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r,
                                   matrix=Matrix.Translation((x + drift[0] * 10 * t * s + random.gauss(0, 0.6), y + drift[1] * 10 * t * s + random.gauss(0, 0.6), z + 3 * s + 16 * t * s)))
    mk('dim', bm, sm, smooth=True)

def jet(p0, p1, arc=3.0, r=0.09):
    cu = bpy.data.curves.new('curek', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 2
    sp = cu.splines.new('POLY'); N = 16; sp.points.add(N - 1)
    for i in range(N):
        t = i / (N - 1); p = Vector(p0).lerp(Vector(p1), t); p.z += arc * 4 * t * (1 - t)
        sp.points[i].co = (*p, 1); sp.points[i].radius = 1 + 2.5 * t
    wm = bpy.data.materials.new('voda'); wm.use_nodes = True; bs = wm.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*lin('#cfe9ff'), 1); bs.inputs['Alpha'].default_value = 0.75
    bs.inputs['Emission Color'].default_value = (*lin('#bfe2ff'), 1); bs.inputs['Emission Strength'].default_value = 1.2
    o = bpy.data.objects.new('curek', cu); col().objects.link(o); cu.materials.append(wm)
    bm = bmesh.new()
    for i in range(40):
        q = Vector(p1) + Vector((random.gauss(0, 0.9), random.gauss(0, 0.9), random.gauss(0, 0.6)))
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(0.05, 0.14), matrix=Matrix.Translation(q))
    mk('kaplje', bm, wm)

def beam(p0, p1, r1=2.5):
    d = Vector(p1) - Vector(p0); L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=20, radius1=0.15, radius2=r1, depth=L)
    bmesh.ops.translate(bm, vec=(0, 0, L / 2), verts=bm.verts)
    bm_m = bpy.data.materials.new('snop'); bm_m.use_nodes = True; bs = bm_m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (1, 0.95, 0.8, 1); bs.inputs['Alpha'].default_value = 0.07
    bs.inputs['Emission Color'].default_value = (1, 0.93, 0.75, 1); bs.inputs['Emission Strength'].default_value = 2.0
    o = mk('snop', bm, bm_m, smooth=True)
    o.location = p0; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    sd = bpy.data.lights.new('reflektor', 'SPOT'); sd.energy = 60000; sd.spot_size = 0.5; sd.color = (1, 0.95, 0.85)
    so = bpy.data.objects.new('reflektor', sd); col().objects.link(so); so.location = p0
    so.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def headlights(e, y=2.3, z=0.8, energy=1500, dist=0.0):
    for s in (-1, 1):
        sd = bpy.data.lights.new('far', 'SPOT'); sd.energy = energy; sd.spot_size = 0.9; sd.color = (1, 0.95, 0.85)
        so = bpy.data.objects.new('far', sd); col().objects.link(so); so.parent = e
        so.location = (s * 0.6, y, z); so.rotation_euler = (math.radians(-80), 0, 0)

def point_light(x, y, z, energy, colr=(1, 1, 1), r=0.3):
    ld = bpy.data.lights.new('luc', 'POINT'); ld.energy = energy; ld.color = colr; ld.shadow_soft_size = r
    lo = bpy.data.objects.new('luc', ld); col().objects.link(lo); lo.location = (x, y, z)

# ---------------------------------------------------------------- vozila (ob izhodišču, spredaj +Y, tla z = 0)
def car(color='#2f5d9a', lights=False, police=False, sporty=False):
    body = mat('avto' + color, color, 0.3, 0.1); r = 0.33
    L2 = 2.25; hw = 0.9
    zb = 0.75 if sporty else 0.85; zt = 1.25 if sporty else 1.45
    o = hexa('karoserija', [(-hw, -L2, 0.3), (hw, -L2, 0.3), (hw, L2, 0.3), (-hw, L2, 0.3),
                            (-hw, -L2 + 0.1, zb), (hw, -L2 + 0.1, zb), (hw, L2 - 0.25, zb - 0.1), (-hw, L2 - 0.25, zb - 0.1)], body, 0.08, 3)
    for y in (-1.35, 1.35): kit.arch(o, y, r, r + 0.06, hw)
    hexa('steklo', [(-hw + 0.06, -1.3, zb - 0.02), (hw - 0.06, -1.3, zb - 0.02), (hw - 0.06, 0.95, zb - 0.04), (-hw + 0.06, 0.95, zb - 0.04),
                    (-hw + 0.16, -0.95, zt), (hw - 0.16, -0.95, zt), (hw - 0.16, 0.3, zt), (-hw + 0.16, 0.3, zt)], kit.GLASS, 0.05)
    box('streha', -hw + 0.15, hw - 0.15, -0.93, 0.28, zt - 0.02, zt + 0.04, mat('avto_w' if police else 'avto' + color, '#f2f2ee' if police else color, 0.3), 0.03)
    for s in (-1, 1):
        box('luc_s', min(s * 0.5, s * 0.82), max(s * 0.5, s * 0.82), L2 - 0.02, L2 + 0.01, 0.62, 0.74, kit.HEAD if lights else mat('far_off', '#d9dde0', 0.2))
        box('luc_z', min(s * 0.5, s * 0.82), max(s * 0.5, s * 0.82), -L2 - 0.01, -L2 + 0.02, 0.62, 0.74, kit.REDL)
    if police:
        stripe(hw, -2.2, 2.0, 0.45, 0.62, mat('pol_modra', '#1f3f8f', 0.4))
        kit.lightbar(-0.3, zt + 0.04, 0.55)
    wheels([(1.35, False), (-1.35, False)], r, 0.22, 0.72)

def van_ambulance():
    hw, r = 1.0, 0.38
    wh = mat('bela_r', '#f4f2ec', 0.35)
    o = hexa('furgon', [(-hw, -2.9, 0.38), (hw, -2.9, 0.38), (hw, 2.7, 0.38), (-hw, 2.7, 0.38),
                        (-hw, -2.9, 2.55), (hw, -2.9, 2.55), (hw, 1.55, 2.55), (-hw, 1.55, 2.55)], wh, 0.08, 3)
    for y in (1.85, -1.75): kit.arch(o, y, r, r + 0.07, hw)
    hexa('nos', [(-hw, 2.6, 0.38), (hw, 2.6, 0.38), (hw, 3.05, 0.38), (-hw, 3.05, 0.38),
                 (-hw, 2.6, 1.15), (hw, 2.6, 1.15), (hw, 2.95, 1.05), (-hw, 2.95, 1.05)], wh, 0.08, 3)
    kit.windscreen(hw, 2.7, 1.15, 2.55, 1.15, 1.25, 2.4, 0.08)
    kit.side_window(hw, 1.3, 2.3, 1.6, 1.35, 2.15)
    ye, gr = mat('rum_kar', '#f5d000', 0.4), mat('zel_kar', '#1f8a4c', 0.4)
    for s in (-1, 1):
        lst_y, lst_g = [], []
        y = -2.85; k = 0
        while y < 2.6:
            for row, (z0, z1) in enumerate(((0.75, 1.05), (1.05, 1.35))):
                (lst_y if (k + row) % 2 == 0 else lst_g).append((min(s * hw, s * (hw + 0.02)), max(s * hw, s * (hw + 0.02)), y, y + 0.48, z0, z1))
            y += 0.5; k += 1
        boxes('karo_r', lst_y, ye); boxes('karo_z', lst_g, gr)
    kit.lightbar(2.2, 2.55, 0.8)
    box('mod_zad', -0.9, 0.9, -2.95, -2.75, 2.45, 2.6, kit.BLUE, 0.02)
    for s in (-1, 1): box('far', min(s * 0.55, s * 0.9), max(s * 0.55, s * 0.9), 3.03, 3.07, 0.75, 0.92, kit.HEAD)
    wheels([(1.85, False), (-1.75, False)], r, 0.26, 0.8)

def truck(cab_c='#e8761a', body='plug', hw=1.25, r=0.5):
    cm = mat('kab' + cab_c, cab_c, 0.35)
    c = kit.cab('kabina', hw, 1.0, 3.3, 0.78, 3.0, 0.28, cm, 0.08); kit.arch(c, 2.2, r, r + 0.1, hw)
    kit.windscreen(hw, 3.3, 0.78, 3.0, 0.28, 1.85, 2.88)
    kit.side_window(hw, 1.9, kit.yfront(3.3, 0.28, 0.78, 3.0, 1.85) - 0.12, kit.yfront(3.3, 0.28, 0.78, 3.0, 2.8) - 0.12, 1.85, 2.8)
    box('sasija', -0.45, 0.45, -6.5 if body in ('cisterna', 'krilo') else -4.0, 3.2, 0.5, 0.85, kit.DARK)
    box('odbijac', -1.22, 1.22, 3.22, 3.45, 0.42, 0.8, kit.DARK, 0.04)
    kit.front_lights(hw, 3.33, 0.88)
    amb = mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)
    box('luc_osn', -0.8, 0.8, 2.6, 2.85, 3.0, 3.05, kit.BLACK); box('luc_a', -0.75, 0.75, 2.62, 2.83, 3.05, 3.15, amb, 0.03)
    if body == 'plug':
        hexa('plug', [(-1.7, 4.1, 0.15), (1.7, 3.5, 0.15), (1.75, 3.62, 0.15), (-1.65, 4.25, 0.15),
                      (-1.7, 4.0, 1.25), (1.7, 3.4, 1.25), (1.75, 3.55, 1.35), (-1.65, 4.18, 1.35)], mat('plug', '#f2c230', 0.45), 0.04)
        box('posip', -1.2, 1.2, -4.0, 0.9, 0.85, 2.4, mat('kesona', '#d7dbe0', 0.5, 0.4), 0.05)
        wheels([(2.2, False), (-1.8, True)], r, 0.34, 1.0)
    elif body == 'vleka':
        box('plato', -1.25, 1.25, -4.2, 0.9, 0.85, 1.15, kit.DARK, 0.03)
        hexa('roka', [(-0.2, -3.6, 1.15), (0.2, -3.6, 1.15), (0.2, 0.5, 1.15), (-0.2, 0.5, 1.15),
                      (-0.15, -4.7, 2.9), (0.15, -4.7, 2.9), (0.15, -4.3, 3.1), (-0.15, -4.3, 3.1)], cm, 0.04)
        wheels([(2.2, False), (-1.8, True)], r, 0.34, 1.0)
    elif body == 'cisterna':
        cyl('cisterna', 1.15, 7.2, (0, -2.9, 2.05), mat('inox', '#c9ced3', 0.25, 0.9), 'Y', 28)
        for y in (-6.4, 0.6): cyl('dno', 1.17, 0.12, (0, y, 2.05), mat('inox2', '#aeb4ba', 0.3, 0.9), 'Y', 28)
        box('pohodna', -0.3, 0.3, -6.0, 0.2, 3.2, 3.26, kit.TREAD)
        box('tabla', -0.25, 0.25, -6.52, -6.48, 1.0, 1.35, mat('oranzna_t', '#f07a12', 0.5))
        wheels([(2.2, False), (-1.6, True), (-4.6, True), (-5.6, True)], r, 0.34, 1.0)
    elif body == 'krilo':
        box('nizka', -1.25, 1.25, -14.0, -0.2, 0.6, 0.85, kit.DARK, 0.03)
        hexa('krilo', [(-1.6, -48.0, 1.0), (1.4, -48.0, 1.0), (1.8, -0.5, 1.0), (-1.8, -0.5, 1.0),
                       (-0.35, -48.0, 1.25), (0.25, -48.0, 1.25), (0.9, -0.5, 3.4), (-0.9, -0.5, 3.4)], mat('krilo', '#eef0f2', 0.35), 0.15, 3)
        box('vrh_krila', -1.9, 1.9, -1.2, 0.2, 0.85, 3.6, mat('koren', '#d7dade', 0.4, 0.3), 0.2)
        box('voz_zad', -1.25, 1.25, -40.0, -36.0, 0.5, 0.95, kit.DARK)
        wheels([(2.2, False), (-1.8, True), (-37.0, True), (-38.5, True)], r, 0.34, 1.0)
        box('dolg_tovor', -1.25, 1.25, 3.46, 3.5, 1.0, 1.4, mat('rum_tab', '#ffd200', 0.5))

def tow_hook(y=-4.6, z=2.9, drop=1.2):
    box('vrv', -0.02, 0.02, y - 0.02, y + 0.02, z - drop, z, kit.BLACK)

def helicopter(col_c='#c4161c'):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0)
    bmesh.ops.scale(bm, vec=(1.25, 3.2, 1.3), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0.6, 2.2), verts=bm.verts)
    mk('trup', bm, mat('heli' + col_c, col_c, 0.3), smooth=True)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
    bmesh.ops.scale(bm, vec=(1.0, 1.4, 0.8), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 2.7, 2.35), verts=bm.verts)
    mk('kabina_st', bm, kit.GLASS, smooth=True)
    hexa('rep', [(-0.35, -2.2, 2.2), (0.35, -2.2, 2.2), (0.35, -2.2, 3.0), (-0.35, -2.2, 3.0),
                 (-0.1, -8.0, 2.9), (0.1, -8.0, 2.9), (0.1, -8.0, 3.3), (-0.1, -8.0, 3.3)], mat('heli' + col_c, col_c, 0.3), 0.04)
    box('smernik', -0.05, 0.05, -8.4, -7.4, 2.9, 4.2, mat('heli' + col_c, col_c, 0.3), 0.05)
    disk = bpy.data.materials.new('rotor'); disk.use_nodes = True; b = disk.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1); b.inputs['Alpha'].default_value = 0.22
    cyl('rotor', 6.2, 0.03, (0, 0.3, 3.75), disk, 'Z', 40)
    cyl('rotor_rep', 0.9, 0.03, (0.12, -8.0, 3.4), disk, 'X', 20)
    cyl('glava', 0.3, 0.4, (0, 0.3, 3.5), kit.DARK, 'Z', 12)
    for s in (-1, 1):
        box('drsnik', min(s * 1.1, s * 1.2), max(s * 1.1, s * 1.2), -1.4, 2.6, 0.2, 0.3, kit.DARK, 0.04)
        box('noga', min(s * 0.8, s * 1.15), max(s * 0.8, s * 1.15), 0.4, 0.55, 0.25, 1.3, kit.DARK)
    stripe(1.26, -1.8, 2.5, 1.9, 2.1, kit.WHITE)

def bucket(drip=True):
    box('vrv', -0.02, 0.02, -0.02, 0.02, 1.6, 9.0, kit.BLACK)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.9, radius2=1.2, depth=1.6, matrix=Matrix.Translation((0, 0, 0.8)))
    mk('vedro', bm, mat('vedro', '#e0631a', 0.6), smooth=True)
    if drip:
        wm = bpy.data.materials.new('kap'); wm.use_nodes = True; bs = wm.node_tree.nodes['Principled BSDF']
        bs.inputs['Base Color'].default_value = (*lin('#cfe9ff'), 1); bs.inputs['Alpha'].default_value = 0.6
        bm = bmesh.new()
        for i in range(30):
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(0.04, 0.09),
                                       matrix=Matrix.Translation((random.gauss(0, 0.4), random.gauss(0, 0.4), -random.uniform(0, 4))))
        mk('kaplje', bm, wm)

def pickup(color='#3c6e47', light=False):
    hw, r = 0.98, 0.4
    cm = mat('pick' + color, color, 0.35)
    h = hexa('hauba', [(-hw, 1.4, 0.55), (hw, 1.4, 0.55), (hw, 2.7, 0.55), (-hw, 2.7, 0.55),
                       (-0.92, 1.4, 1.22), (0.92, 1.4, 1.22), (0.9, 2.6, 1.1), (-0.9, 2.6, 1.1)], cm, 0.08, 3)
    kit.arch(h, 1.75, r, r + 0.08, hw)
    c = kit.cab('kabina', hw, -0.15, 1.45, 0.55, 1.95, 0.55, cm, 0.08, rear_s=0.05, top_hw=0.88); kit.arch(c, 1.75, r, r + 0.08, hw)
    kit.windscreen(0.9, 1.45, 0.55, 1.95, 0.55, 1.28, 1.88, 0.1)
    kit.side_window(hw - 0.03, -0.05, 1.15, 0.95, 1.28, 1.85)
    bd = box('keson', -hw, hw, -2.75, -0.2, 0.55, 1.2, cm, 0.04); kit.arch(bd, -1.6, r, r + 0.08, hw)
    box('keson_tla', -0.9, 0.9, -2.7, -0.25, 1.0, 1.21, kit.DARK)
    for s in (-1, 1): box('zaromet', min(s * 0.62, s * 0.9), max(s * 0.62, s * 0.9), 2.65, 2.71, 0.85, 1.0, kit.HEAD if light else mat('far_off', '#d9dde0', 0.2), 0.02)
    box('odbijac', -0.98, 0.98, 2.62, 2.82, 0.38, 0.65, kit.DARK, 0.04)
    rack = [(-0.9, 0.9, 0.2, 0.3, 1.95, 2.05)]
    boxes('nosilec', rack, kit.BLACK)
    if light:
        cyl('reflektor', 0.22, 0.3, (0.45, 0.55, 2.2), kit.HEAD, 'Y', 14)
    wheels([(1.75, False), (-1.6, False)], r, 0.28, 0.82, rim_m=kit.ALU)

def cow(c2='#151515'):
    w = mat('krava_b', '#f1eee6', 0.8); b = mat('krava_c' + c2, c2, 0.8)
    box('telo', -0.32, 0.32, -0.8, 0.8, 0.75, 1.4, w, 0.12)
    box('lisa', -0.33, 0.1, -0.5, 0.2, 0.95, 1.41, b, 0.05); box('lisa2', 0.0, 0.33, 0.3, 0.75, 0.8, 1.3, b, 0.05)
    box('glava', -0.17, 0.17, 0.8, 1.3, 1.05, 1.45, w, 0.08); box('gobec', -0.15, 0.15, 1.2, 1.38, 1.02, 1.2, mat('gobec', '#d9a99a', 0.8), 0.04)
    for x in (-0.22, 0.22):
        for y in (-0.6, 0.6): box('noga', x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, 0.8, w)

def person(shirt='#2b5fae', lying=False, refl=False):
    sm = mat('majica' + shirt, shirt, 0.8); sk = mat('koza', '#e2b493', 0.7); pn = mat('hlace', '#2a2d33', 0.8)
    if lying:
        box('telo', -0.2, 0.2, -0.3, 0.45, 0.05, 0.3, sm, 0.06); box('noge', -0.2, 0.2, -1.2, -0.3, 0.05, 0.25, pn, 0.05)
        cyl('glava', 0.12, 0.22, (0, 0.62, 0.15), sk, 'Y', 10)
    else:
        box('noge', -0.17, 0.17, -0.1, 0.1, 0, 0.85, pn, 0.04); box('telo', -0.22, 0.22, -0.13, 0.13, 0.85, 1.5, sm, 0.06)
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.12, matrix=Matrix.Translation((0, 0, 1.65))); mk('glava', bm, sk, smooth=True)
        if refl: box('odsevni', -0.23, 0.23, -0.14, 0.14, 1.15, 1.25, kit.YEL)

def cone_traffic(x, y):
    b = snap()
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.22, radius2=0.03, depth=0.7, matrix=Matrix.Translation((0, 0, 0.35)))
    mk('stozec', bm, mat('stozec', '#ff5a10', 0.6), smooth=True)
    group(b, 'stozec', x, y)

# ---------------------------------------------------------------- svet, svetloba, kamera, izris
def sky(day=True, colr='#a9c6e8', strength=0.9, sun=(42, -35), sun_e=3.6, sun_c=(1, 1, 1)):
    w = bpy.data.worlds.new('w'); SC.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*lin(colr), 1); bg.inputs['Strength'].default_value = strength
    if sun_e:
        sd = bpy.data.lights.new('sonce', 'SUN'); sd.energy = sun_e; sd.angle = math.radians(2.5); sd.color = sun_c
        so = bpy.data.objects.new('sonce', sd); col().objects.link(so); so.rotation_euler = (math.radians(sun[0]), 0, math.radians(sun[1]))

def render(cam_loc, target, lens=35, res=(1280, 720), name='misija'):
    SC.render.engine = 'CYCLES'; SC.cycles.device = 'CPU'; SC.cycles.samples = 12 if FAST else 64
    SC.cycles.use_denoising = True; SC.cycles.max_bounces = 4; SC.cycles.transparent_max_bounces = 16
    SC.view_settings.view_transform = 'AgX'
    try: SC.view_settings.look = 'AgX - Punchy'
    except Exception: pass
    cd = bpy.data.cameras.new('cam'); cd.lens = lens; cd.clip_end = 2000
    co = bpy.data.objects.new('cam', cd); col().objects.link(co); co.location = cam_loc
    d = Vector(target) - Vector(cam_loc); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    SC.camera = co
    if FAST: res = (res[0] // 2, res[1] // 2)
    SC.render.resolution_x, SC.render.resolution_y = res
    SC.render.filepath = os.path.join(OUT, 'm%02d%s.png' % (M, '_hitro' if FAST else ''))
    bpy.ops.render.render(write_still=True)

def heading_at(i):
    a, b = ROAD[max(0, i - 3)], ROAD[min(len(ROAD) - 1, i + 3)]
    return math.atan2(-(b[0] - a[0]), b[1] - a[1])

def on_road(i, side=0.0):
    x, y, z = ROAD[i]; h = heading_at(i)
    return x + math.cos(h) * side, y + math.sin(h) * side, h

# ---------------------------------------------------------------- misije
def alpine(snowline=60, rock=0.45):
    mats = [GRASS(), ROCK(), SNOW(), GRASS2()]
    def pick(x, y, z, sl):
        if z > snowline + random.uniform(-4, 4): return 2
        if sl > rock: return 1
        return 3 if patch(x, y) else 0
    return mats, pick

def m01():   # Požar na vrhu · Vršič
    global BASE
    BASE = lambda x, y: 34 * math.exp(-((x - 10) ** 2 + (y - 30) ** 2) / 2600) + 6 * math.sin(x / 23) * math.cos(y / 31) - 0.08 * y
    set_road([(-120, -90), (-60, -70), (-20, -40), (-50, -10), (-10, 5), (30, -5), (40, 15), (8, 26), (-30, 40), (-60, 70)], 3.4)
    terrain(420, 260, pal('#5f7f3a', '#78923f', '#7f7b74', (0.3, 0.55), '#eef2f6', 80), 0, 0); road('asfalt')
    hx, hy = 14, 34
    house(hx, hy, 0.4, 8, 10, 3.4, '#e9e1cf', '#7c3a28')
    fire(hx - 1, hy - 1, T(hx, hy) + 3.0, 1.3, 16); fire(hx + 2, hy + 3, T(hx, hy) + 4.2, 1.0, 10, False)
    smoke(hx, hy, T(hx, hy) + 5, 1.3, 12, (1.6, 0.6))
    i = min(range(len(ROAD)), key=lambda k: (ROAD[k][0] - 24) ** 2 + (ROAD[k][1] - 22) ** 2)
    x, y, h = on_road(i, 0.0)
    b = snap(); kit.v_eu(); e = group(b, 'gasilci', x, y, h + 0.5)
    nz = e.matrix_world @ Vector((0, 0.3, 3.4))
    jet(nz, (hx + 1, hy + 0.5, T(hx, hy) + 4.0), 2.2)
    forest(160, -150, 150, -150, 150, 10, keep=lambda x, y: BASE(x, y) < 60 and math.hypot(x - hx, y - hy) > 16)
    sky(); return dict(cam=(hx - 30, hy - 52, T(hx, hy) + 42), tgt=(hx + 4, hy - 6, T(hx, hy) + 1), lens=35)

def m02():   # Zlata ura · Monte Carlo
    global BASE
    BASE = lambda x, y: max(0.0, 0.18 * (x + 10)) if x > -10 else 0.0
    set_road([(-40, -140), (-30, -80), (-22, -30), (-20, 10), (-12, 60), (10, 120)], 4.2)
    wm = mat('morje', '#1d4f7a', 0.06, 0.1)
    box('morje', -200, -33, -200, 200, -0.6, -0.2, wm)
    pv, gv = lin('#b9b2a6'), lin('#5d7d3c'); terrain(320, 160, lambda x, y, z, sl: mix(pv, gv, sst(11, 13, x)), 0, 0)
    road('asfalt', center=True)
    random.seed(5)
    for k in range(14):
        y = -120 + k * 18; building(random.uniform(14, 30), y, random.uniform(10, 16), random.uniform(10, 14), random.uniform(10, 26),
                                    random.choice(['#efe3c8', '#e8cfa8', '#f1e9dc', '#e6b98e', '#dcd2bf']), h=0)
    hb = building(-2, 92, 22, 16, 20, '#f2f2ee')
    zz = T(-2, 92) + 20.3
    box('H_plosca', -8, 4, 86, 98, zz, zz + 0.05, mat('H_pod', '#3a3d42', 0.9))
    boxes('H', [(-3.8, -3.0, 89, 95, zz + 0.05, zz + 0.08), (-0.2, 0.6, 89, 95, zz + 0.05, zz + 0.08), (-3.0, -0.2, 91.6, 92.4, zz + 0.05, zz + 0.08)], kit.WHITE)
    box('H_tabla', 3, 9, 100.1, 100.4, 12, 16, mat('H_modra', '#1f4fb3', 0.5)); boxes('H_t', [(4.6, 5.2, 100.4, 100.45, 12.6, 15.4), (6.8, 7.4, 100.4, 100.45, 12.6, 15.4), (5.2, 6.8, 100.4, 100.45, 13.7, 14.3)], kit.WHITE)
    i = min(range(len(ROAD)), key=lambda k: abs(ROAD[k][1] + 10))
    x, y, h = on_road(i, -1.5); b = snap(); car('#9a2f2f'); e1 = group(b, 'avto1', x, y, h + 0.9)
    x2, y2, _ = on_road(i + 6, 1.6); b = snap(); car('#3f6fa8'); e2 = group(b, 'avto2', x2, y2, h - 2.4)
    e2.rotation_euler.y = 1.45; e2.location.z += 0.9
    for d in ((-3.5, -8), (3.2, -9), (-3.6, 12)): cone_traffic(x + d[0], y + d[1])
    b = snap(); person('#2b5fae', lying=True); group(b, 'ponesreceni', x + 2.4, y - 3.5, 0.3)
    b = snap(); person('#d23b2b', refl=True); group(b, 'resevalec', x + 3.2, y - 2.6, 2.4)
    xa, ya, ha = on_road(i - 14, 1.6); b = snap(); van_ambulance(); ea = group(b, 'resevalno', xa, ya, ha)
    box('stekla', x - 2, x + 3, y - 1, y + 4, 0.05, 0.07, mat('crepinje', '#9fb7c9', 0.1, 0.5))
    for k in range(5):
        xx, yy, hh = on_road(min(len(ROAD) - 1, i + 30 + k * 9), random.choice((-1.6, 1.6)))
        b = snap(); car(random.choice(['#d8d8d4', '#2a2a2c', '#7f8a93', '#2f5d9a'])); group(b, 'promet', xx, yy, hh)
    sky(sun=(50, -30)); return dict(cam=(x - 34, y - 30, 24), tgt=(x + 3, y + 4, 0), lens=34, hud_pos=(x, y))

def m03():   # Zasuti prelaz · Beartooth
    global BASE
    BASE = lambda x, y: 18 * math.sin(x / 40) + 0.35 * y + 6 * math.cos(y / 17 + x / 50)
    set_road([(-140, -60), (-70, -35), (-20, -10), (30, 5), (90, 30), (150, 50)], 3.4)
    mats = [SNOW(), ROCK(), mat('sneg2', '#dfe6ee', 0.6)]
    terrain(320, 200, pal('#eef2f6', '#dde5ee', '#6f6c68', (0.45, 0.7)), 0, 0)
    road('sneg', lines=False)
    i0 = min(range(len(ROAD)), key=lambda k: abs(ROAD[k][0] - 10))
    sm = mat('plaz', '#f4f7fa', 0.5)
    bm = bmesh.new()
    for k in range(40):
        x, y, h = on_road(i0 + random.randint(-6, 40), random.uniform(-6, 6))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0,
                                   matrix=Matrix.Translation((x, y, T(x, y) + 0.2)) @ Matrix.Diagonal((random.uniform(2, 4.5), random.uniform(2, 4.5), random.uniform(0.9, 2.0), 1)))
    mk('plaz', bm, sm, smooth=True)
    for k, c in ((8, '#b33a2a'), (24, '#2f5d9a')):
        x, y, h = on_road(i0 + k, 1.4); b = snap(); car(c, lights=True); e = group(b, 'zasut', x, y, h); e.location.z -= 0.55
    x, y, h = on_road(i0 - 7, 0.0); b = snap(); truck('#e8761a', 'plug'); group(b, 'plug', x, y, h)
    forest(160, -160, 160, -160, 160, 12)
    sm2 = mat('snezinka', '#ffffff', 0.5); bm = bmesh.new()
    for k in range(260):
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.06, matrix=Matrix.Translation((x + random.uniform(-30, 30), y + random.uniform(-10, 60), T(x, y) + random.uniform(1, 30))))
    mk('sneg_pada', bm, sm2)
    sky(colr='#c7d3df', strength=1.1, sun=(35, -60), sun_e=2.2)
    return dict(cam=(x - 26, y - 30, T(x, y) + 26), tgt=(x + 6, y + 12, T(x, y)), lens=36)

def m04():   # Vlečna služba · Pikes Peak
    global BASE
    BASE = lambda x, y: 0.42 * y + 10 * math.sin(x / 30) + 4 * math.cos(y / 13)
    set_road([(-80, -100), (-20, -60), (-60, -30), (0, 0), (-40, 30), (20, 60), (-20, 100)], 3.2)
    mats = [mat('gramoz_r', '#9a7b62', 0.95), ROCK(), mat('trava_r', '#7f8452', 0.95)]
    terrain(260, 190, pal('#8f7a63', '#7c8450', '#76716b', (0.3, 0.5)), 0, 0)
    road('asfalt')
    i = min(range(len(ROAD)), key=lambda k: (ROAD[k][0] + 10) ** 2 + (ROAD[k][1] + 2) ** 2)
    x, y, h = on_road(i, 0)
    b = snap(); truck('#ffd21a', 'vleka'); tow_hook(); e = group(b, 'vlecno', x, y, h + math.pi)
    p = e.matrix_world @ Vector((0, -5.6, 0)); b = snap(); car('#3a7a5a'); e2 = group(b, 'pokvarjen', p.x, p.y, h + math.pi, tilt=False, z=T(p.x, p.y) + 0.55)
    e2.rotation_euler.x = math.radians(-12)
    for k in (8, 10): x2, y2, _ = on_road(i + k * 3, 3.0); cone_traffic(x2, y2)
    sky(colr='#a9c4e6', sun=(40, 10)); return dict(cam=(x + 26, y - 30, T(x, y) + 24), tgt=(x - 1, y - 2, T(x, y)), lens=38)

def m05():   # Vedro iz jezera · Los Caracoles
    global BASE
    LV = 0.14 * 62 + 9 * math.sin(-40 / 35) * math.cos(62 / 45) + 0.5
    def base(x, y):
        z = 0.14 * y + 9 * math.sin(x / 35) * math.cos(y / 45) + 0.0004 * (x + 40) ** 2
        d = math.hypot(x + 40, y - 62)
        if d > 70: return z + max(0.0, LV + 1.0 - z) * (1 - sst(70, 115, d))
        t = sst(30, 70, d)
        return (LV - 2.5 - 3 * (1 - d / 30) if d < 30 else LV - 2.5) * (1 - t) + max(z, LV + 1.0) * t
    BASE = base
    set_road([(70, -140), (50, -90), (75, -60), (45, -30), (70, 0), (40, 30), (60, 60)], 3.4)
    mats = [mat('suha_trava', '#9c9a5c', 0.95), ROCK(), mat('pobocje', '#7a7a50', 0.95), mat('pogorisce', '#2b2722', 0.95)]
    pf = pal('#a19e5e', '#7a7a50', '#7f7b74', (0.3, 0.5)); burn = lin('#2b2722')
    terrain(320, 220, lambda x, y, z, sl: mix(pf(x, y, z, sl), burn, 1 - sst(14, 24, math.hypot(x + 10, y + 20) + 4 * math.sin(x / 3 + y / 4))), 0, 0)
    road('asfalt')
    lz = LV; cyl('jezero', 42, 1.0, (-40, 62, lz - 0.5), mat('jezero', '#1f6fa0', 0.25, 0.0), 'Z', 48, smooth=False)
    forest(170, -160, 160, -160, 160, 8, keep=lambda x, y: math.hypot(x + 40, y - 62) > 48 and math.hypot(x + 10, y + 20) > 26, kind='iglavec')
    for (fx, fy, s) in ((-12, -18, 1.2), (-2, -30, 0.9), (-24, -8, 1.0), (6, -14, 0.8), (-18, -32, 0.7)):
        fire(fx, fy, T(fx, fy), s, 10, light=(s > 1)); smoke(fx, fy, T(fx, fy), s * 0.9, 7, (1.0, 1.4))
    hx, hy = -14, 8; hz = T(hx, hy) + 26
    b = snap(); helicopter('#c4161c'); e = group(b, 'heli', hx, hy, math.radians(200), z=hz)
    b = snap(); bucket(); group(b, 'vedro', hx, hy, 0, z=hz - 9.0 + 1.6 - 0.2)
    sky(colr='#c9d6e6', sun=(48, 40)); return dict(cam=(hx + 52, hy - 58, hz + 22), tgt=(hx - 12, hy + 6, T(hx, hy) + 6), lens=32)

def m06():   # Srce v hladilni torbi · Mulholland, noč
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
    x, y, h = on_road(i, -1.6); b = snap(); car('#d9d9d4', lights=True, police=True); e = group(b, 'policija', x, y, h); headlights(e)
    point_light(x, y, T(x, y) + 3, 400, (0.2, 0.4, 1.0), 1.5)
    x2, y2, h2 = on_road(i - 12, -1.6); b = snap(); car('#b5121b', lights=True, sporty=True); e2 = group(b, 'igralec', x2, y2, h2); headlights(e2)
    x3, y3, h3 = on_road(i + 28, 1.6); b = snap(); car('#7f8a93', lights=True); e3 = group(b, 'promet', x3, y3, h3 + math.pi); headlights(e3)
    sky(colr='#2a3d63', strength=0.8, sun=(38, 120), sun_e=1.6, sun_c=(0.62, 0.72, 1.0))
    return dict(cam=(x2 - 22, y2 - 30, T(x2, y2) + 24), tgt=(x + 2, y + 2, T(x, y)), lens=34)

def m07():   # Cisterna · Sani Pass
    global BASE
    BASE = lambda x, y: 0.55 * y + 8 * math.sin(x / 25)
    set_road([(-40, -120), (40, -95), (-30, -70), (40, -45), (-30, -20), (40, 5), (-30, 30), (40, 55)], 3.2)
    mats = [mat('juzna_trava', '#8c8a4f', 0.95), mat('bazalt', '#6e665c', 0.9), mat('zelena_s', '#6b7a3f', 0.95)]
    terrain(260, 200, pal('#8c8a4f', '#6b7a3f', '#6e665c', (0.3, 0.5)), 0, -30)
    road('makadam', lines=False)
    i = min(range(len(ROAD)), key=lambda k: (ROAD[k][0] - 5) ** 2 + (ROAD[k][1] + 30) ** 2)
    x, y, h = on_road(i, 0); b = snap(); truck('#2f6fb0', 'cisterna'); group(b, 'cisterna', x, y, h)
    sky(colr='#bcd2ea', sun=(46, -20)); return dict(cam=(x + 30, y - 34, T(x, y) + 30), tgt=(x - 2, y + 2, T(x, y)), lens=36)

def m08():   # Izgubljeni v gozdu · Ouninpohja, noč
    global BASE
    BASE = lambda x, y: 6 * math.sin(x / 19) * math.cos(y / 23) + 3 * math.sin(y / 9)
    set_road([(-140, -60), (-60, -40), (0, -10), (50, 20), (140, 30)], 3.0)
    terrain(300, 160, pal('#3d4c2c', '#56603a', ns=(7, 9)), 0, 0)
    road('makadam', lines=False)
    forest(520, -150, 150, -150, 150, 5, keep=lambda x, y: math.hypot(x - 13, y + 12) > 5)
    i = min(range(len(ROAD)), key=lambda k: abs(ROAD[k][0] + 5))
    x, y, h = on_road(i, 0.5); b = snap(); pickup('#c4161c', light=True); e = group(b, 'pickup', x, y, h); headlights(e, 2.7, 0.9, 900)
    px, py = x + 18, y + 22
    lamp = e.matrix_world @ Vector((0.45, 0.6, 2.25))
    beam(lamp, (px, py, T(px, py) + 0.8), 1.6)
    b = snap(); person('#f07a12'); group(b, 'pohodnik', px, py, 3.6)
    sky(colr='#2a3d63', strength=0.75, sun=(38, 140), sun_e=1.5, sun_c=(0.62, 0.72, 1.0))
    return dict(cam=(x - 24, y - 26, T(x, y) + 24), tgt=(x + 7, y + 10, T(x, y)), lens=34, thermal=(px, py))

def m09():   # Krilo vetrnice · Katu-Jaryk
    global BASE
    BASE = lambda x, y: 0.38 * y + 9 * math.sin(x / 28) + 3 * math.cos(y / 11)
    set_road([(-120, -150), (-40, -110), (-80, -60), (10, -40), (-50, 0), (40, 20), (60, 80)], 3.6)
    mats = [mat('step', '#8d9a52', 0.95), ROCK(), mat('step2', '#7a8b48', 0.95)]
    terrain(320, 180, pal('#8d9a52', '#6f8446', '#7f7b74', (0.3, 0.5)), 0, -40)
    road('asfalt')
    forest(60, -160, 160, -200, 120, 14, kind='iglavec')
    i = min(range(len(ROAD)), key=lambda k: (ROAD[k][0] + 30) ** 2 + (ROAD[k][1] + 4) ** 2)
    x, y, h = on_road(i, 0); b = snap(); truck('#2a2d33', 'krilo'); group(b, 'krilo', x, y, h, tilt=False)
    x2, y2, h2 = on_road(i + 22, 0); b = snap(); pickup('#f2f2ee'); e = group(b, 'spremstvo', x2, y2, h2)
    amb = mat('amber_luc', '#ffa21a', 0.3, 0.0, 9)
    sky(colr='#b6cde6', sun=(44, 30)); return dict(cam=(x + 48, y - 40, T(x, y) + 46), tgt=(x - 10, y - 10, T(x, y)), lens=34)

def m10():   # Pobegla čreda · Harju
    global BASE
    BASE = lambda x, y: 8 * math.sin(x / 40) * math.cos(y / 35) + 0.05 * y
    set_road([(-140, -30), (-60, -24), (0, -30), (60, -20), (140, -28)], 3.2)
    terrain(300, 150, pal('#6f8c42', '#5a7a36', ns=(21, 25)), 0, 0)
    road('asfalt', center=True)
    pen = [(-30, 8), (-6, 8), (-6, 30), (-30, 30), (-30, 8)]
    fence_line([(-30, 8), (-14, 8)]); fence_line([(-10, 8), (-6, 8), (-6, 30), (-30, 30), (-30, 8)])
    house(-48, 22, 0.2, 10, 14, 4.2, '#b33a2a', '#4a4d52', 'skedenj')
    forest(70, -150, 150, 40, 150, 6, kind='listavec'); forest(40, -150, 150, -150, -50, 6, kind='iglavec')
    for (cx, cy) in ((-20, 14), (-14, 22), (-24, 25), (-11, 15)):
        b = snap(); cow(); group(b, 'krava', cx, cy, random.uniform(0, 6))
    for (cx, cy) in ((8, 2), (16, 12), (22, -6), (4, 18), (30, 6)):
        b = snap(); cow(random.choice(['#151515', '#6b3a20'])); group(b, 'krava', cx, cy, random.uniform(0, 6))
    b = snap(); pickup('#3c6e47'); group(b, 'pickup', 16, 0, math.radians(70))
    sky(sun=(50, -40)); return dict(cam=(14, -36, 30), tgt=(2, 14, 0), lens=34)

R = [None, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10][M]()
render(R['cam'], R['tgt'], R.get('lens', 35))
# položaj točk na sliki (za HUD)
from bpy_extras.object_utils import world_to_camera_view
pts = {}
for k in ('hud_pos', 'thermal'):
    if k in R:
        x, y = R[k]; v = world_to_camera_view(SC, SC.camera, Vector((x, y, T(x, y) + 1))); pts[k] = (v.x, 1 - v.y)
json.dump(pts, open(os.path.join(OUT, 'm%02d.json' % M), 'w'))
print('MISIJA', M, 'ok', len(bpy.data.objects), 'objektov')
