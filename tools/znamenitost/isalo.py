"""Isalo: the Queen of Isalo, the sandstone rock by the RN7 that looks like a seated figure with a crown, modelled in Blender (bpy) on the
game's ground under it (tools/znamenitost/isalo-tla.mjs), written as assets/landmarks/isalo.glb (near) and isalo-far.glb (the far level,
from 420 m). The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/isalo-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/isalo.py /tmp/tla.json        (python with bpy: pip install bpy)

The model (data: the OSM point, node 726552822, and the public DEM, see below): a weathered plinth of layered sandstone drawn out
towards the rise, its beds tilted, on it the figure: the lap, the body narrowing to the shoulders, the neck, the head and on it a crown
of four knobs, all of the same eroded stone (lumps and runnels, ochre with pink and pale patches washed down the faces, a grey crust);
a scree of fallen blocks at its foot, most towards the rise. Its shape is the rock's (a rock that looks like a figure), no statue, no inscription.
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


# ---- the shape. What the data say: OSM has the rock as a point (natural=rock, node 726552822); Copernicus DEM GLO-30 has a cell ~5-6 m
#      above its neighbours on that point, on the northern foot of a rocky rise that climbs ~15 m to the south and south-west within 90 m.
#      So: a rock ~10 m high above the ground at its point, on a broad rocky plinth drawn out towards the rise (SPA), its beds tilting up
#      that way (TILT), the fallen blocks mostly on that side. Above the plinth the eroded mass the name comes from: a broad seated body,
#      narrower at the top, leaning, a waist and a knob of a head with a few weathered knobs on it; every section off-centre and lumpy
#      (harmonics with their own phases up the rock), cut by vertical runnels. No statue: all of it the same weathered stone. ----
ANG = 0.6    # the body's long axis (it looks across the road)
SPA = 2.05   # the plinth's long axis: towards the rise (south-south-west in the game's frame, x east, z south)
TILT = (-0.035, 0.07)   # the beds' rise per metre (x, z): up towards the rise
# the sections: (y above the ground at the rock's point, half width along the axis, across, the axis' angle, the centre's offset x, z)
SECT = [
    (-1.6, 9.0, 6.4, SPA, 0.9, 2.6), (0.15, 8.5, 6.0, SPA, 0.9, 2.4),                       # the plinth: its lowest bed under the ground
    (0.55, 7.6, 5.5, SPA, 0.8, 2.1), (1.15, 7.2, 5.2, SPA, 0.7, 1.9),                         # its second bed, a sloping ledge
    (1.6, 5.5, 4.3, SPA, 0.6, 1.5), (2.1, 4.7, 3.8, 1.4, 0.5, 1.2),                           # its third
    (2.6, 4.0, 3.3, ANG, 0.3, 0.6), (3.2, 3.8, 3.1, ANG, 0.25, 0.5),                          # the lap
    (3.7, 3.3, 2.7, ANG, 0.15, 0.4), (4.8, 3.1, 2.45, ANG, 0.0, 0.3), (5.8, 3.5, 2.3, ANG, -0.15, 0.15),   # the body, the shoulders
    (6.3, 3.0, 2.0, ANG, -0.25, 0.05), (6.75, 1.7, 1.35, ANG, -0.4, -0.05),
    (7.05, 1.1, 0.95, ANG, -0.5, -0.12), (7.35, 1.05, 0.92, ANG, -0.55, -0.15),               # the waist (the neck)
    (7.7, 1.45, 1.3, ANG, -0.6, -0.2), (8.3, 1.62, 1.45, ANG, -0.68, -0.24), (8.9, 1.48, 1.32, ANG, -0.72, -0.28),   # the head
    (9.3, 1.1, 1.0, ANG, -0.75, -0.3), (9.5, 0.7, 0.62, ANG, -0.76, -0.3),
]
JOINTS = [0.35, 1.38, 2.35, 3.45, 6.55]   # the bed joints (dark), where the sections step in
YTOP = SECT[-1][0]


def sect(y):
    """the section at the height y: (a, b, angle, ox, oz), smooth between the rows"""
    if y <= SECT[0][0]: return SECT[0][1:]
    for k in range(len(SECT) - 1):
        y0, y1 = SECT[k][0], SECT[k + 1][0]
        if y <= y1:
            t = (y - y0) / (y1 - y0); t = t * t * (3 - 2 * t)
            return tuple(SECT[k][i] + (SECT[k + 1][i] - SECT[k][i]) * t for i in range(1, 6))
    return SECT[-1][1:]


def shape(th, y, seed):
    """the section's radius factor at the angle th: lumps (harmonics whose phases and sizes drift up the rock, each bed its own) and the
    runnels (narrow vertical grooves, deeper up the body)"""
    bed = sum(1 for j in JOINTS if y > j)
    f, low = 1.0, 1.0 + 0.9 * max(0.0, min(1.0, (2.2 - y) / 2.0))   # the plinth broken more than the body
    for h, amp in ((2, 0.09 * low), (3, 0.075 * low), (4, 0.045 * low), (6, 0.025)):
        ph = 2 * math.pi * (hsh(bed, h, seed) + 0.35 * vnoise(y * 0.3, h * 3.1, seed + h))
        f += amp * (0.6 + 0.8 * vnoise(y * 0.45, h * 1.7, seed + 10 + h)) * math.cos(h * th + ph)
    deep = 0.0 if y < 1.5 else min(1.0, (y - 1.5) / 2.0) * (0.0 if y > 6.6 else 1.0)
    for g in range(6):
        gt = 2 * math.pi * hsh(g, 41, seed); dth = (th - gt + math.pi) % (2 * math.pi) - math.pi
        f -= deep * (0.07 + 0.06 * hsh(g, 42, seed)) * math.exp(-(dth / 0.09) ** 2)
    return f


def band(y, th):
    """the colour of the stone at the height y (above the ground at the point), the angle th: ochre with pink and pale patches drawn out
    down the faces (the wash of the rain), a grey crust in streaks on the weather side and on the head, lichen low down, dark in the
    two deep joints only (the others are steps, not cracks)"""
    for j in (JOINTS[1], JOINTS[4]):
        if abs(y - j) < 0.07: return 'dark'
    w = vnoise(th * 2.0, y * 0.35, 7)
    if w > 0.68 or (y > 7.0 and w > 0.52): return 'crust'
    if y < 1.0 and vnoise(th * 3, y, 9) > 0.58: return 'lichen'
    v = vnoise(th * 3.5, y * 0.22 + 0.1 * math.sin(th * 2), 5)
    return 'pink' if v < 0.36 else 'pale' if v > 0.66 else 'ochre'


def lift(x, z):
    """the beds' tilt at (x, z) (none at the foot: the plinth's lowest ring stays under the ground)"""
    return TILT[0] * (x - CX) + TILT[1] * (z - CZ)


def rock(G, gc, detail):
    """the rock as rings up its height: each ring the section with its lumps and runnels, roughened by noise (the eroded faces);
    the lowest ring under the ground wherever it stands, the beds tilted"""
    npts, step, rough = (48, 0.14, 0.13) if detail else (14, 0.55, 0.08)
    ys, y = [], SECT[0][0]
    while y < YTOP: ys.append(round(y, 3)); y += step
    for j in JOINTS: ys += [j - 0.07, j + 0.07] if detail else [j]
    ys = sorted(set(ys + [YTOP]))
    rings = []
    for q, y in enumerate(ys):
        a, b, ang, ox, oz = sect(y); c, s = math.cos(ang), math.sin(ang); ring = []
        tl = max(0.0, min(1.0, (y + 0.5) / 1.5))
        for k in range(npts):
            th = 2 * math.pi * k / npts
            n = shape(th, y, 3) * (1 + rough * (vnoise(math.cos(th) * 1.6 + 5, y * 0.9 + math.sin(th) * 1.6, 3) - 0.5) + rough * 0.5 * (vnoise(th * 5, y * 3, 4) - 0.5))
            u, v = a * math.cos(th) * n, b * math.sin(th) * n
            x, z = CX + ox + c * u - s * v, CZ + oz + s * u + c * v
            yy = ground(x, z) - 0.5 if q == 0 else gc + y + tl * lift(x, z)
            ring.append((x, yy, z))
        rings.append(ring)
    for j in range(len(rings) - 1):
        ym = (ys[j] + ys[j + 1]) / 2; a, b, ang, ox, oz = sect(ym); ctr = (CX + ox, gc + ym, CZ + oz)
        for k in range(npts):
            ps = [rings[j][k], rings[j][(k + 1) % npts], rings[j + 1][(k + 1) % npts], rings[j + 1][k]]
            G.quad(ps, band(ym, 2 * math.pi * (k + 0.5) / npts), ctr)
    top = rings[-1]; a, b, ang, ox, oz = sect(YTOP); tc = (CX + ox, gc + YTOP + 0.2 + lift(CX + ox, CZ + oz), CZ + oz)
    for k in range(npts): G.quad([top[k], top[(k + 1) % npts], tc], 'crust', d=(0, 1, 0))
    return tc


def knob(G, x, y, z, hgt, r, lean, seed, detail):
    """a weathered knob on the head: a short irregular column, leaning, rounded at the top"""
    npts, nr = (10, 6) if detail else (5, 2)
    rings = []
    for t in range(nr + 1):
        f = t / nr; rr = r * (1.0 - 0.75 * f ** 2.2) * (1 + 0.25 * (vnoise(f * 3, seed, seed) - 0.5)); ring = []
        for k in range(npts):
            th = 2 * math.pi * k / npts; n = 1 + 0.22 * (vnoise(math.cos(th) * 1.3 + seed, math.sin(th) * 1.3 + f * 2, seed) - 0.5)
            ring.append((x + lean[0] * f * hgt + rr * n * math.cos(th), y + f * hgt, z + lean[1] * f * hgt + rr * n * 0.85 * math.sin(th)))
        rings.append(ring)
    for j in range(nr):
        ctr = (x + lean[0] * (j + 0.5) / nr * hgt, y + (j + 0.5) / nr * hgt, z + lean[1] * (j + 0.5) / nr * hgt)
        for k in range(npts):
            G.quad([rings[j][k], rings[j][(k + 1) % npts], rings[j + 1][(k + 1) % npts], rings[j + 1][k]], 'pale' if (j + seed) % 3 == 0 else 'crust', ctr)
    tc = (x + lean[0] * hgt, y + hgt + r * 0.15, z + lean[1] * hgt)
    for k in range(npts): G.quad([rings[-1][k], rings[-1][(k + 1) % npts], tc], 'crust', d=(0, 1, 0))


def scree(G, n):
    """the fallen blocks: irregular boxes, tilted, half sunk; most on the side of the rise (the plinth's long axis)"""
    for q in range(n):
        a = SPA + (hsh(q, 11) - 0.5) * (2.6 if q % 3 else 6.2); d = 8.0 + hsh(q, 12) * 6.0
        x, z = CX + 0.8 + math.cos(a) * d, CZ + 2.2 + math.sin(a) * d
        r = 0.4 + hsh(q, 13) * 1.2; y = ground(x, z) - r * 0.35
        ang, tl = hsh(q, 14) * math.pi, (hsh(q, 15) - 0.5) * 0.6
        c, s = math.cos(ang), math.sin(ang)
        lx, ly, lz = r * (1.1 + hsh(q, 16) * 0.8), r * (0.6 + hsh(q, 17) * 0.5), r * (0.8 + hsh(q, 18) * 0.6)
        P = lambda u, h, v: (x + c * u - s * v, y + h + u * tl * 0.5, z + s * u + c * v)
        j = lambda k: 0.8 + hsh(q, k) * 0.4
        b = [P(-lx * j(20), 0, -lz * j(21)), P(lx * j(22), 0, -lz * j(23)), P(lx * j(24), 0, lz * j(25)), P(-lx * j(26), 0, lz * j(27))]
        t = [P(-lx * 0.75 * j(28), ly, -lz * 0.8 * j(29)), P(lx * 0.8 * j(30), ly * j(31), -lz * 0.7), P(lx * 0.7, ly * j(32), lz * 0.8 * j(33)), P(-lx * 0.8, ly * j(34), lz * 0.75)]
        o = (x, y + ly / 2, z); mat = ('ochre', 'pink', 'crust', 'pale')[q % 4]
        for k in range(4): G.quad([b[k], b[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, o)
        G.quad(t, 'crust' if q % 2 else 'lichen' if q % 5 == 0 else mat, d=(0, 1, 0))


def build(detail):
    G = Mesh()
    gc = ground(CX, CZ)
    tc = rock(G, gc, detail)
    # the knobs on the head (the "crown"): four of different heights, not in a row, leaning out
    a, b, ang, ox, oz = sect(YTOP - 0.3); c, s = math.cos(ang), math.sin(ang)
    for k, (u, v, hgt, r) in enumerate(((-0.55, 0.15, 0.95, 0.36), (0.05, -0.2, 1.25, 0.42), (0.6, 0.25, 0.8, 0.33), (0.1, 0.45, 0.55, 0.3))):
        kx, kz = CX + ox + c * u - s * v, CZ + oz + s * u + c * v
        knob(G, kx, gc + YTOP - 0.45 + lift(kx, kz), kz, hgt, r, (0.12 * u, 0.12 * v), 20 + k, detail)
    if detail: scree(G, 16)
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
