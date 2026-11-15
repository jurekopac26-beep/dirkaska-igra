"""Isalo: the Queen of Isalo, the sandstone rock by the RN7 that looks like a seated figure with a crown, modelled in Blender (bpy) on the
game's ground under it (tools/znamenitost/isalo-tla.mjs), written as assets/landmarks/isalo.glb (near) and isalo-far.glb (the far level,
from 420 m). The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/isalo-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/isalo.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: a weathered block of layered sandstone (the beds as ledges, their colours in bands of pale ochre, pink and a grey crust),
on it the figure: the lap, the body narrowing to the shoulders, the neck, the head and on it a crown of three knobs, all of the same
eroded stone; a scree of fallen blocks at its foot. Its shape is the rock's (a rock that looks like a figure), no statue, no inscription.
The far level: the same rock with fewer rings and points, no scree.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the rock's point (x, z) (the game puts the model there).
Budget (docs/proge/isalo.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
CX, CZ = D['QC']
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']

# the materials: the game's colours (js/world-isalo.js, the fallback rock)
MATS = [('ochre', (0.86, 0.66, 0.48)), ('pink', (0.88, 0.70, 0.60)), ('pale', (0.92, 0.80, 0.64)), ('crust', (0.64, 0.60, 0.54)),
        ('dark', (0.52, 0.40, 0.34)), ('lichen', (0.56, 0.58, 0.48))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def ground(x, z):
    fx, fz = (x - X0) / ST, (z - Z0) / ST
    i, j = max(0, min(NX - 2, int(math.floor(fx)))), max(0, min(NZ - 2, int(math.floor(fz))))
    u, v = max(0.0, min(1.0, fx - i)), max(0.0, min(1.0, fz - j))
    h = lambda a, b: H[b * NX + a]
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v


def hsh(a, b, c=0):
    v = math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453
    return v - math.floor(v)


def vnoise(x, y, seed):
    """value noise, smooth, in [0, 1]"""
    i, j = math.floor(x), math.floor(y); u, v = x - i, y - j; u, v = u * u * (3 - 2 * u), v * v * (3 - 2 * v)
    a, b, c, d = hsh(i, j, seed), hsh(i + 1, j, seed), hsh(i, j + 1, seed), hsh(i + 1, j + 1, seed)
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v


class Mesh:
    """vertices in the game's frame (x, y up, z); faces as vertex lists with a material"""
    def __init__(s): s.v, s.f, s.m = [], [], []

    def quad(s, ps, mat, ref=None, d=None):
        """a face facing away from the point ref, or along the direction d (the game draws the front faces only)"""
        nx = ny = nz = 0.0
        for k in range(len(ps)):
            (ax, ay, az), (bx, by, bz) = ps[k], ps[(k + 1) % len(ps)]
            nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by)
        cx, cy, cz = (sum(p[i] for p in ps) / len(ps) for i in range(3))
        dx, dy, dz = d if d else (cx - ref[0], cy - ref[1], cz - ref[2])
        if nx * dx + ny * dy + nz * dz < 0: ps = ps[::-1]
        b = len(s.v); s.v.extend(ps); s.f.append(tuple(range(b, b + len(ps)))); s.m.append(M[mat])


# ---- the figure's profile: half widths (a along the shoulders, b front to back) at the height y above the block's foot; the shoulders'
#      axis at the angle ANG (the figure looks across the road) ----
ANG = 0.6
PROF = [  # (y, a, b)
    (0.0, 6.6, 5.4), (1.2, 6.4, 5.2), (1.3, 6.0, 4.9), (2.4, 5.8, 4.7), (2.5, 5.2, 4.3), (3.0, 5.0, 4.1),   # the block, its beds as ledges
    (3.1, 4.0, 3.3), (3.6, 3.9, 3.1),                                                                         # the lap
    (3.7, 3.4, 2.7), (5.0, 3.1, 2.4), (5.9, 3.6, 2.3), (6.4, 3.3, 2.1),                                       # the body and the shoulders
    (6.8, 1.8, 1.4), (7.1, 1.05, 0.95), (7.4, 1.0, 0.95),                                                     # the neck
    (7.7, 1.45, 1.35), (8.3, 1.62, 1.5), (8.9, 1.5, 1.4), (9.3, 1.15, 1.05), (9.5, 0.7, 0.65),               # the head
]


def prof(y):
    for k in range(len(PROF) - 1):
        (y0, a0, b0), (y1, a1, b1) = PROF[k], PROF[k + 1]
        if y <= y1:
            t = 0 if y1 == y0 else (y - y0) / (y1 - y0); t = t * t * (3 - 2 * t) if (a1 - a0) * (a1 - a0) < 0.5 else t
            return a0 + (a1 - a0) * t, b0 + (b1 - b0) * t
    return PROF[-1][1], PROF[-1][2]


def band(y, th):
    """the colour of the stone at the height y, the angle th: beds of pale ochre and pink, a grey crust on the weather side, dark in the
    joints (the ledges)"""
    bed = math.floor(y / 0.55); w = vnoise(th * 2.0, y * 0.8, 7)
    for (yy, *_r) in PROF[:8]:
        if abs(y - yy) < 0.06 and yy > 0.5: return 'dark'
    if w > 0.68: return 'crust'
    if y < 1.0 and vnoise(th * 3, y, 9) > 0.6: return 'lichen'
    return ('ochre', 'pink', 'pale', 'ochre')[int(hsh(bed, 3) * 4)]


def column(G, cx, cz, y0, ys, prof_fn, npts, seed, rough, cap=True):
    """a lathe of rings at the heights ys (the profile prof_fn(y) -> (a, b)), the radius roughened by noise (the eroded faces)"""
    c, s = math.cos(ANG), math.sin(ANG)
    rings = []
    for y in ys:
        a, b = prof_fn(y); ring = []
        for k in range(npts):
            th = 2 * math.pi * k / npts
            n = 1 + rough * (vnoise(math.cos(th) * 1.6 + 5, y * 0.9 + math.sin(th) * 1.6, seed) - 0.5) + rough * 0.5 * (vnoise(th * 5, y * 3, seed + 1) - 0.5)
            u, v = a * math.cos(th) * n, b * math.sin(th) * n
            ring.append((cx + c * u - s * v, y0 + y, cz + s * u + c * v))
        rings.append(ring)
    for j in range(len(rings) - 1):
        ym = (ys[j] + ys[j + 1]) / 2
        for k in range(npts):
            ps = [rings[j][k], rings[j][(k + 1) % npts], rings[j + 1][(k + 1) % npts], rings[j + 1][k]]
            G.quad(ps, band(ym, 2 * math.pi * (k + 0.5) / npts), (cx, y0 + ym, cz))
    if cap:
        top = rings[-1]; tc = (cx, y0 + ys[-1] + 0.25, cz)
        for k in range(npts): G.quad([top[k], top[(k + 1) % npts], tc], 'crust', d=(0, 1, 0))
    return rings


def scree(G, y_foot, n, detail):
    """the fallen blocks at the foot: irregular boxes, tilted, half sunk"""
    for q in range(n):
        a = hsh(q, 11) * 2 * math.pi; d = 7.5 + hsh(q, 12) * 4.5
        x, z = CX + math.cos(a) * d, CZ + math.sin(a) * d
        r = 0.5 + hsh(q, 13) * 1.1; y = ground(x, z) - r * 0.35
        ang, tl = hsh(q, 14) * math.pi, (hsh(q, 15) - 0.5) * 0.5
        c, s = math.cos(ang), math.sin(ang)
        lx, ly, lz = r * (1.2 + hsh(q, 16) * 0.6), r * (0.7 + hsh(q, 17) * 0.4), r * (0.9 + hsh(q, 18) * 0.5)
        P = lambda u, h, v: (x + c * u - s * v, y + h + u * tl * 0.5, z + s * u + c * v)
        j = lambda k: 0.85 + hsh(q, k) * 0.3
        b = [P(-lx * j(20), 0, -lz * j(21)), P(lx * j(22), 0, -lz * j(23)), P(lx * j(24), 0, lz * j(25)), P(-lx * j(26), 0, lz * j(27))]
        t = [P(-lx * 0.8 * j(28), ly, -lz * 0.8 * j(29)), P(lx * 0.8 * j(30), ly * j(31), -lz * 0.8), P(lx * 0.8, ly * j(32), lz * 0.8 * j(33)), P(-lx * 0.8, ly, lz * 0.8)]
        o = (x, y + ly / 2, z); mat = ('ochre', 'pink', 'crust')[q % 3]
        for k in range(4): G.quad([b[k], b[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, o)
        G.quad(t, 'crust' if q % 2 else mat, d=(0, 1, 0))


def build(detail):
    G = Mesh()
    foot = [ground(CX + 7 * math.cos(a / 8 * math.pi), CZ + 7 * math.sin(a / 8 * math.pi)) for a in range(16)]
    y0 = min(foot) - 1.2   # (the block's foot under the ground all round)
    lift = ground(CX, CZ) - y0   # (the profile's heights are above the ground at the centre: the block rises from y0)
    pf = lambda y: prof(max(0.0, y - lift + 1.2)) if y > lift - 1.2 else prof(0.0)
    top = PROF[-1][0] + lift - 1.2
    step = 0.12 if detail else 0.6
    ys, y = [], 0.0
    while y < top: ys.append(round(y, 3)); y += step
    for (yy, *_r) in PROF:   # (the ledges exactly where the profile breaks)
        Y = yy + lift - 1.2
        if 0 < Y < top: ys += [Y - 0.03, Y + 0.03] if detail else [Y]
    ys = sorted(set(ys + [top]))
    column(G, CX, CZ, y0, ys, pf, 44 if detail else 14, 3, 0.16 if detail else 0.1)
    # the crown: three knobs on the head, in a row across
    c, s = math.cos(ANG), math.sin(ANG)
    hy = y0 + top - 0.35
    for k, (off, hgt, r) in enumerate(((-0.62, 1.15, 0.42), (0.0, 1.45, 0.46), (0.62, 1.1, 0.4))):
        kx, kz = CX + c * off, CZ + s * off
        kp = lambda yy, r=r, hgt=hgt: (r * (1.0 - 0.55 * max(0, (yy - hgt * 0.6) / (hgt * 0.4)) ** 2), r * 0.9 * (1.0 - 0.55 * max(0, (yy - hgt * 0.6) / (hgt * 0.4)) ** 2))
        kys = [hgt * t / (8 if detail else 3) for t in range((8 if detail else 3) + 1)]
        column(G, kx, kz, hy, kys, kp, 12 if detail else 6, 20 + k, 0.12)
    if detail: scree(G, y0, 14, detail)
    return G


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the rock's point -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
    me.from_pydata([(x - CX, -(z - CZ), y) for (x, y, z) in G.v], [], G.f)
    for (n, col) in MATS:
        mt = bpy.data.materials.get(n) or bpy.data.materials.new(n)
        mt.diffuse_color = (*col, 1.0); mt.use_nodes = True
        bs = mt.node_tree.nodes.get('Principled BSDF')
        if bs: bs.inputs['Base Color'].default_value = (*col, 1.0); bs.inputs['Roughness'].default_value = 0.95
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
for detail, fn in ((True, 'isalo.glb'), (False, 'isalo-far.glb')):
    G = build(detail)
    ob = to_blender(G, 'isalo' if detail else 'isalo_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
