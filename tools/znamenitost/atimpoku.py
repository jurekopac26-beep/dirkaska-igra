"""Atimpoku: the Adomi bridge over the Volta, modelled in Blender (bpy) on the game's own road over it
(tools/znamenitost/atimpoku-tla.mjs: the centre line every 2 m, its normal, the half-widths and the ground), written as
assets/landmarks/atimpoku.glb (near) and atimpoku-far.glb (the far level, from 420 m). The game reads both with js/znamenitost.js (one
draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/atimpoku-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/atimpoku.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: the deck under the game's road (a slab with its edge girders and the cross beams under it, a narrow ledge outside the
parapets), the two steel arch ribs over the river (245 m between their springings, ~45 m above the deck), each a truss of two chords
with its posts and diagonals, braced across over the road (cross beams and X diagonals where the ribs are high enough), the hangers
from the ribs down to the deck, the arch's two big concrete piers on the banks, the twin columns with their cap beams under the approach
spans and the abutments at both ends. No inscriptions, no lamps with signs, no statues.
The far level: the deck, the ribs as single beams, the piers; nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the bridge's centre (x, z) (the game puts the model there).
Budget (docs/proge/atimpoku.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
CX, CZ = D['c']
SB0, SB1, SA0, SA1 = D['s']
SP = D['p']   # [s, x, y, z, nx, nz, halfL, halfR, ground]

# the materials: the game's colours (js/world-atimpoku.js, the fallback bridge)
MATS = [('steel', (0.62, 0.66, 0.66)), ('steel_top', (0.70, 0.74, 0.74)), ('steel_dark', (0.48, 0.52, 0.52)),
        ('concrete', (0.74, 0.72, 0.68)), ('concrete_top', (0.80, 0.78, 0.74)), ('cable', (0.30, 0.32, 0.33))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def at(s):
    """the road at s (linear between the samples): x, y, z, nx, nz, halfL, halfR, ground, tx, tz"""
    k = max(0, min(len(SP) - 2, int((s - SP[0][0]) // 2)))
    a, b = SP[k], SP[k + 1]; u = max(0.0, min(1.0, (s - a[0]) / (b[0] - a[0])))
    r = [a[i] + (b[i] - a[i]) * u for i in range(1, 9)]
    tx, tz = b[1] - a[1], b[3] - a[3]; l = math.hypot(tx, tz) or 1
    return r + [tx / l, tz / l]


def P(s, o, dy=0.0):
    """the point o across the road (+ towards halfR's side) at s, dy above the road's centre"""
    x, y, z, nx, nz = at(s)[:5]
    return (x + nx * o, y + dy, z + nz * o)


def half(s, side):
    r = at(s); return (r[6] if side > 0 else r[5]) + 0.9


class Mesh:
    """vertices in the game's frame (x, y up, z); faces as vertex lists with a material"""
    def __init__(s): s.v, s.f, s.m = [], [], []

    def quad(s, ps, mat, ref=None, d=None):
        """a face facing away from the point ref, or along the direction d (its winding turned so: the game draws the front faces only,
        lit by their normals)"""
        nx = ny = nz = 0.0
        for k in range(len(ps)):
            (ax, ay, az), (bx, by, bz) = ps[k], ps[(k + 1) % len(ps)]
            nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by)
        cx, cy, cz = (sum(p[i] for p in ps) / len(ps) for i in range(3))
        dx, dy, dz = d if d else (cx - ref[0], cy - ref[1], cz - ref[2])
        if nx * dx + ny * dy + nz * dz < 0: ps = ps[::-1]
        b = len(s.v); s.v.extend(ps); s.f.append(tuple(range(b, b + len(ps)))); s.m.append(M[mat])

    def box(s, x, y, z, lx, ly, lz, ang, mat, top=None, bottom=False):
        """a box lx (along ang) by lz (across), from y to y+ly"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, h: (x + c * a - sn * b, y + h, z + sn * a + c * b)
        a, b = lx / 2, lz / 2
        q = [P(-a, -b, 0), P(a, -b, 0), P(a, b, 0), P(-a, b, 0)]
        t = [P(-a, -b, ly), P(a, -b, ly), P(a, b, ly), P(-a, b, ly)]
        o = (x, y + ly / 2, z)
        for k in range(4): s.quad([q[k], q[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, o)
        s.quad(t, top or mat, o)
        if bottom: s.quad(q, mat, o)


def beam(G, a, b, lx, lz, bw, bh, mat, top=None, bottom=True):
    """a straight beam from a to b, its section bw wide along the horizontal (lx, lz) and bh high (the four long sides; without the bottom
    under the deck, where no one on the road ever looks: the road on the banks is level with the deck)"""
    hw, hh = bw / 2, bh / 2
    q = lambda p, sx, sy: (p[0] + lx * hw * sx, p[1] + hh * sy, p[2] + lz * hw * sx)
    a00, a10, a11, a01 = q(a, -1, -1), q(a, 1, -1), q(a, 1, 1), q(a, -1, 1)
    b00, b10, b11, b01 = q(b, -1, -1), q(b, 1, -1), q(b, 1, 1), q(b, -1, 1)
    o = tuple((a[i] + b[i]) / 2 for i in range(3))
    G.quad([a01, a11, b11, b01], top or mat, o)
    if bottom: G.quad([a00, b00, b10, a10], mat, o)
    G.quad([a00, a01, b01, b00], mat, o); G.quad([a10, b10, b11, a11], mat, o)


def strut(G, a, b, w, mat):
    """a thin member between any two points (a square section w, its sides square to the member)"""
    dx, dy, dz = b[0] - a[0], b[1] - a[1], b[2] - a[2]; l = math.sqrt(dx * dx + dy * dy + dz * dz) or 1
    dx, dy, dz = dx / l, dy / l, dz / l
    ux, uy, uz = (0, 1, 0) if abs(dy) < 0.9 else (1, 0, 0)
    px, py, pz = dy * uz - dz * uy, dz * ux - dx * uz, dx * uy - dy * ux; pl = math.sqrt(px * px + py * py + pz * pz); px, py, pz = px / pl, py / pl, pz / pl
    qx, qy, qz = dy * pz - dz * py, dz * px - dx * pz, dx * py - dy * px
    h = w / 2
    c = lambda p, sa, sb: (p[0] + (px * sa + qx * sb) * h, p[1] + (py * sa + qy * sb) * h, p[2] + (pz * sa + qz * sb) * h)
    ra = [c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1)]; rb = [c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)]
    o = tuple((a[i] + b[i]) / 2 for i in range(3))
    for k in range(4): G.quad([ra[k], ra[(k + 1) % 4], rb[(k + 1) % 4], rb[k]], mat, o)


RISE = 45


def rib(s):
    t = max(0.0, min(1.0, (s - SA0) / (SA1 - SA0)))
    return at(s)[1] - 3 + (RISE + 3) * 4 * t * (1 - t)


def ribO(s, side): return side * (half(s, side) + 1.2)


def ribP(s, side, dy):
    p = P(s, ribO(s, side)); return (p[0], rib(s) + dy, p[2])


def deck(G, detail):
    st = 6 if detail else 12
    s = SB0 - 4
    while s < SB1 + 4:
        s2 = min(s + st, SB1 + 4); r = at(s)
        oL, oR = -(half(s, -1) + 2.0), half(s, 1) + 2.0; oc, wd = (oL + oR) / 2, oR - oL
        if detail:
            beam(G, P(s, oc, -0.33), P(s2, oc, -0.33), r[3], r[4], wd, 0.36, 'concrete', 'concrete_top', bottom=False)           # (the slab)
            for side, o in ((-1, oL + 0.6), (1, oR - 0.6)):                                                          # (the edge girders)
                beam(G, P(s, o, -1.6), P(s2, o, -1.6), r[3], r[4], 1.0, 2.2, 'steel_dark', 'steel', bottom=False)
            beam(G, P(s, oL + 1.4, -1.0), P(s, oR - 1.4, -1.0), r[8], r[9], 0.5, 1.0, 'steel_dark', bottom=False)                  # (a cross beam)
            for o in (oc - wd * 0.2, oc + wd * 0.2):                                                                 # (the stringers)
                beam(G, P(s, o, -0.95), P(s2, o, -0.95), r[3], r[4], 0.5, 0.9, 'steel_dark', bottom=False)
        else:
            beam(G, P(s, oc, -1.3), P(s2, oc, -1.3), r[3], r[4], wd, 2.4, 'steel_dark', 'concrete_top', bottom=False)
        s = s2


def ribs(G, detail):
    ns = 64 if detail else 22
    S = [SA0 + (SA1 - SA0) * k / ns for k in range(ns + 1)]
    for side in (-1, 1):
        for k in range(ns):
            s0, s1 = S[k], S[k + 1]; r = at(s0)
            if detail:
                for dy in (1.4, -1.4):                                                                                # (the two chords)
                    beam(G, ribP(s0, side, dy), ribP(s1, side, dy), r[3], r[4], 1.3, 0.8, 'steel', 'steel_top')
                strut(G, ribP(s0, side, -1.0), ribP(s0, side, 1.0), 0.45, 'steel')                                    # (a post)
                a, b = (ribP(s0, side, -1.0), ribP(s1, side, 1.0)) if k % 2 == 0 else (ribP(s0, side, 1.0), ribP(s1, side, -1.0))
                strut(G, a, b, 0.4, 'steel')                                                                          # (a diagonal)
            else:
                beam(G, ribP(s0, side, 0), ribP(s1, side, 0), r[3], r[4], 1.6, 3.2, 'steel', 'steel_top')
        if detail: strut(G, ribP(S[-1], side, -1.0), ribP(S[-1], side, 1.0), 0.45, 'steel')


def bracing(G, detail):
    if not detail: return
    prev, s = None, SA0 + 20
    while s < SA1 - 19:
        y = rib(s)
        if y - at(s)[1] >= 9:
            r = at(s); a, b = ribP(s, -1, 1.4), ribP(s, 1, 1.4)
            beam(G, a, b, r[8], r[9], 0.9, 1.1, 'steel', 'steel_top')
            a2, b2 = ribP(s, -1, -1.2), ribP(s, 1, -1.2)
            beam(G, a2, b2, r[8], r[9], 0.6, 0.7, 'steel')
            if prev:
                strut(G, prev[0], b, 0.45, 'steel'); strut(G, prev[1], a, 0.45, 'steel')                              # (the X over the road)
            prev = (a, b)
        else: prev = None
        s += 16


def hangers(G, detail):
    if not detail: return
    s = SA0 + 8
    while s < SA1 - 7:
        for side in (-1, 1):
            y, yd = rib(s) - 1.8, at(s)[1] - 0.4
            if y - yd < 1: continue
            p = P(s, ribO(s, side)); strut(G, (p[0], yd, p[2]), (p[0], y, p[2]), 0.18, 'cable')
        s += 8


def pier(G, s, ln, top, kind, detail):
    r = at(s); oL, oR = -half(s, -1), half(s, 1); oc = (oL + oR) / 2; wd = oR - oL + 1.5
    g = r[7] - 2
    if top - g < 1.5: return
    p = P(s, oc); ang = math.atan2(r[9], r[8])
    if kind == 'cols' and detail:
        for o in (oL + 1.6, oR - 1.6):                                                                               # (two columns, a cap)
            q = P(s, o); G.box(q[0], g, q[2], ln, top - 1.2 - g, ln, ang, 'concrete', 'concrete_top')
        G.box(p[0], top - 1.2, p[2], ln + 0.6, 1.2, wd, ang, 'concrete', 'concrete_top')
    elif kind == 'arch' and detail:
        G.box(p[0], g, p[2], ln, top - 1.5 - g, wd + 2.0, ang, 'concrete', 'concrete_top')                          # (the pier and its cap)
        G.box(p[0], top - 1.5, p[2], ln + 1.0, 1.5, wd + 3.0, ang, 'concrete', 'concrete_top')
        G.box(p[0], g, p[2], ln + 3, min(top - g, 14.6 - g + 1.2), wd + 4.0, ang, 'concrete', 'concrete_top')         # (its footing at the water)
    else:
        G.box(p[0], g, p[2], ln, top - g, wd, ang, 'concrete', 'concrete_top')


def piers(G, detail):
    y = lambda s: at(s)[1]
    pier(G, SA0, 7, y(SA0) - 2.5, 'arch', detail); pier(G, SA1, 7, y(SA1) - 2.5, 'arch', detail)
    pier(G, SB0 - 2, 5, y(SB0) - 0.2, 'end', detail); pier(G, SB1 + 2, 5, y(SB1) - 0.2, 'end', detail)
    s = SB0 + 28
    while s < SA0 - 15: pier(G, s, 2.2, y(s) - 2.6, 'cols', detail); s += 28
    s = SB1 - 28
    while s > SA1 + 15: pier(G, s, 2.2, y(s) - 2.6, 'cols', detail); s -= 28


def build(detail):
    G = Mesh()
    deck(G, detail); ribs(G, detail); bracing(G, detail); hangers(G, detail); piers(G, detail)
    return G


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the bridge's centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
    me.from_pydata([(x - CX, -(z - CZ), y) for (x, y, z) in G.v], [], G.f)
    for (n, col) in MATS:
        mt = bpy.data.materials.get(n) or bpy.data.materials.new(n)
        mt.diffuse_color = (*col, 1.0); mt.use_nodes = True
        bs = mt.node_tree.nodes.get('Principled BSDF')
        if bs: bs.inputs['Base Color'].default_value = (*col, 1.0); bs.inputs['Roughness'].default_value = 0.9
        me.materials.append(mt)
    for p, m in zip(me.polygons, G.m): p.material_index = m; p.use_smooth = False
    me.validate(); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    return ob


def export(ob, path):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_texcoords=False, export_normals=True, export_tangents=False, export_materials='EXPORT',
                              export_cameras=False, export_lights=False, export_extras=False, export_animations=False)


bpy.ops.wm.read_factory_settings(use_empty=True)
os.makedirs(OUT, exist_ok=True)
for detail, fn in ((True, 'atimpoku.glb'), (False, 'atimpoku-far.glb')):
    G = build(detail)
    ob = to_blender(G, 'atimpoku' if detail else 'atimpoku_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
