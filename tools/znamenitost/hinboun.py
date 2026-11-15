"""Phou Hin Boun: the stone forest by road 8, the grey limestone karst spires beside the lookout, modelled in Blender (bpy) on the game's
ground (tools/znamenitost/hinboun-tla.mjs: the heights and the distance to the road), written as assets/landmarks/hinboun.glb (near) and
hinboun-far.glb (the far level, from 420 m). The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as
the vertex colours, no textures).

  node tools/znamenitost/hinboun-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/hinboun.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: a field of sharp, fluted grey spires of weathered limestone (5-22 m, in clusters, leaning a little, darker at the foot, with
green shrubs in the clefts and at their feet), none nearer than 14 m to the road's centre line, and a plain lookout where OSM has the viewpoint, ~22 m from the road: a stone
platform with a low wall and an open timber shelter under a tiled roof. No inscriptions, no flags, no statues.
The far level: fewer, coarser spires and the shelter's roof, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the stone forest's centre (x, z) (the game puts the
model there). Budget (docs/proge/hinboun.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
CX, CZ = D['FC']
X0, Z0, ST, NX, NZ, H, DR = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h'], D['d']

# the materials: the game's colours (js/world-hinboun.js, the fallback spires)
MATS = [('lime', (0.92, 0.91, 0.86)), ('lime_dark', (0.64, 0.64, 0.60)), ('lime_top', (0.98, 0.97, 0.93)), ('shrub', (0.24, 0.40, 0.19)),
        ('wood', (0.48, 0.33, 0.21)), ('roof', (0.56, 0.27, 0.18)), ('stone', (0.58, 0.55, 0.50))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def grid(A, x, z):
    fx, fz = (x - X0) / ST, (z - Z0) / ST
    i, j = max(0, min(NX - 2, int(math.floor(fx)))), max(0, min(NZ - 2, int(math.floor(fz))))
    u, v = max(0.0, min(1.0, fx - i)), max(0.0, min(1.0, fz - j))
    a = lambda p, q: A[q * NX + p]
    return (a(i, j) * (1 - u) + a(i + 1, j) * u) * (1 - v) + (a(i, j + 1) * (1 - u) + a(i + 1, j + 1) * u) * v


ground = lambda x, z: grid(H, x, z)
road = lambda x, z: grid(DR, x, z)


class Mesh:
    """vertices in the game's frame (x, y up, z); faces as vertex lists with a material"""
    def __init__(s): s.v, s.f, s.m = [], [], []

    def face(s, ps, mat, ref):
        """a face turned away from the point ref (the game draws the front faces only, lit by their normals)"""
        nx = ny = nz = 0.0
        for k in range(len(ps)):
            (ax, ay, az), (bx, by, bz) = ps[k], ps[(k + 1) % len(ps)]
            nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by)
        cx, cy, cz = (sum(p[i] for p in ps) / len(ps) for i in range(3))
        if nx * (cx - ref[0]) + ny * (cy - ref[1]) + nz * (cz - ref[2]) < 0: ps = ps[::-1]
        b = len(s.v); s.v.extend(ps); s.f.append(tuple(range(b, b + len(ps)))); s.m.append(M[mat])

    def box(s, x, y, z, lx, ly, lz, ang, mat, top=None):
        """a box without its bottom (it stands on something), turned by ang about y"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, h: (x + a * c - b * sn, y + h, z + a * sn + b * c)
        q = [(-lx / 2, -lz / 2), (lx / 2, -lz / 2), (lx / 2, lz / 2), (-lx / 2, lz / 2)]
        ref = (x, y + ly / 2, z)
        for k in range(4):
            (a0, b0), (a1, b1) = q[k], q[(k + 1) % 4]
            s.face([P(a0, b0, 0), P(a1, b1, 0), P(a1, b1, ly), P(a0, b0, ly)], mat, ref)
        s.face([P(a, b, ly) for a, b in q], top or mat, (x, y - 1, z))


def spire(G, rnd, x, z, r0, h, n, rows):
    """one karst spire: rings of n points, narrowing upwards with a fluted, jagged outline, leaning a little, its foot below the ground;
    the lower rings dark (wet, mossy), the upper pale; a sharp point slightly off the axis"""
    gy = min(ground(x + dx, z + dz) for dx, dz in ((r0, 0), (-r0, 0), (0, r0), (0, -r0), (0, 0))) - 1.6
    lean, la = rnd.uniform(0, 0.12), rnd.uniform(0, 2 * math.pi)
    phase = rnd.uniform(0, 2 * math.pi)
    jit = [rnd.uniform(0.6, 1.3) if i % 2 else rnd.uniform(0.45, 0.8) for i in range(n)]   # (flutes: every other point drawn in)
    rings, prev = [], [1e9] * n
    for k in range(rows + 1):
        t = k / rows
        y = gy + (h + 1.6) * (t ** 0.9) * 0.93
        r = r0 * (1 - t) ** 0.75 * (1 + 0.1 * math.sin(t * 9 + phase))
        ox, oz = math.cos(la) * lean * (y - gy), math.sin(la) * lean * (y - gy)
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n + phase + 0.25 * math.sin(k * 1.7 + i)
            rr = min(r * jit[i] * (0.75 + 0.5 * rnd.random() if k else 1.0), prev[i] * 0.97)   # (never wider than below: no faces down)
            prev[i] = rr
            ring.append((x + ox + math.cos(a) * rr, y, z + oz + math.sin(a) * rr))
        rings.append(ring)
    top = (x + math.cos(la) * lean * (h + 1.6) + rnd.uniform(-0.3, 0.3) * r0, gy + h + 1.6, z + math.sin(la) * lean * (h + 1.6) + rnd.uniform(-0.3, 0.3) * r0)
    for k in range(rows):
        t = k / rows
        mat = 'lime_dark' if t < 0.3 else ('lime_top' if t > 0.7 else 'lime')
        if rnd.random() < 0.15: mat = 'lime_dark'
        cy = (rings[k][0][1] + rings[k + 1][0][1]) / 2
        ref = (x + math.cos(la) * lean * (cy - gy), cy, z + math.sin(la) * lean * (cy - gy))
        for i in range(n):
            a, b = rings[k][i], rings[k][(i + 1) % n]
            c, d = rings[k + 1][(i + 1) % n], rings[k + 1][i]
            G.face([a, b, c, d], mat, ref)
    ref = (top[0], rings[-1][0][1] - 1, top[2])
    for i in range(n):
        G.face([rings[-1][i], rings[-1][(i + 1) % n], top], 'lime_top', ref)
    return gy + 1.6


def shrub(G, rnd, x, y, z, r, n):
    """a low clump of shrubs: a squat cone of n sides, no bottom"""
    hh = r * rnd.uniform(0.7, 1.1)
    ring = [(x + math.cos(2 * math.pi * i / n) * r * rnd.uniform(0.8, 1.15), y - 0.3, z + math.sin(2 * math.pi * i / n) * r * rnd.uniform(0.8, 1.15)) for i in range(n)]
    mid = [(x + (p[0] - x) * 0.7, y + hh * 0.6, z + (p[2] - z) * 0.7) for p in ring]
    top = (x, y + hh, z)
    for i in range(n):
        j = (i + 1) % n
        G.face([ring[i], ring[j], mid[j], mid[i]], 'shrub', (x, y, z))
        G.face([mid[i], mid[j], top], 'shrub', (x, y, z))


def place(detail, look):
    """the spires' feet: clusters inside 46 m of the centre, none nearer than 14 m to the road's centre line nor on the lookout's
    platform (look: its centre), so the lookout keeps its view"""
    rnd = random.Random(8)
    heads = [(rnd.uniform(-38, 38), rnd.uniform(-38, 38)) for _ in range(9)]
    out = []
    for _ in range(4000):
        if len(out) >= (64 if detail else 30): break
        hx, hz = heads[rnd.randrange(len(heads))]
        x, z = CX + hx + rnd.gauss(0, 9), CZ + hz + rnd.gauss(0, 9)
        if math.hypot(x - CX, z - CZ) > 46 or road(x, z) < 14: continue
        r0 = rnd.uniform(2.0, 4.4)
        if math.hypot(x - look[0], z - look[1]) < r0 + 6: continue
        if any(math.hypot(x - a, z - b) < (r0 + c) * 0.9 for a, b, c, _ in out): continue
        far = min(1.0, (road(x, z) - 14) / 30)
        h = rnd.uniform(4, 10) + far * rnd.uniform(3, 9) + r0 * 1.4
        out.append((x, z, r0, h))
    return out


# OSM's viewpoint by road 8 (node 1164277586, tools/hinboun/build.py LOOKOUT: 18.17808 N, 104.48406 E) in the game's metres
LOOK_OSM = ((104.48406 - 104.4735906) * 111320 * math.cos(math.radians(18.1775048)), -(18.17808 - 18.1775048) * 110574)


def lookout_pos():
    """where OSM has the lookout (the viewpoint by road 8, ~22 m from the road's centre line towards the spires): the point of the
    grid 20-24 m from the road nearest OSM's viewpoint node"""
    best = None
    for k in range(NX * NZ):
        x, z = X0 + (k % NX) * ST, Z0 + (k // NX) * ST
        if 20 <= DR[k] <= 24:
            dd = math.hypot(x - LOOK_OSM[0], z - LOOK_OSM[1])
            if best is None or dd < best[0]: best = (dd, x, z)
    return best[1], best[2]


def lookout(G, detail, look):
    """at OSM's viewpoint (look), facing the spires: a stone platform with a low wall on three sides and an open timber shelter with a
    hipped tiled roof (OSM: the viewpoint's sala)"""
    x, z = look
    ang = math.atan2(CZ - z, CX - x)   # facing the spires
    y = max(ground(x + dx, z + dz) for dx in (-4, 0, 4) for dz in (-4, 0, 4)) + 0.3
    c, s = math.cos(ang), math.sin(ang)
    P = lambda a, b: (x + a * c - b * s, z + a * s + b * c)
    fy = min(ground(x + dx, z + dz) for dx in (-5, 0, 5) for dz in (-5, 0, 5)) - 0.5
    G.box(x, fy, z, 7, y - fy, 6.5, ang, 'stone')
    if detail:
        for a, b, lx, lz in ((3.3, 0, 0.45, 6.5), (0, 3.05, 7, 0.45), (0, -3.05, 7, 0.45)):
            px, pz = P(a, b); G.box(px, y, pz, lx, 0.8, lz, ang, 'stone')
        for a, b in ((-2, -2), (2, -2), (2, 2), (-2, 2)):
            px, pz = P(a, b); G.box(px, y, pz, 0.4, 2.6, 0.4, ang, 'wood')
    # the roof: a low hipped pyramid over the shelter, its eaves out past the posts
    ry, e = y + 2.6, 2.7
    q = [P(-e, -e), P(e, -e), P(e, e), P(-e, e)]
    ridge = [P(-0.8, 0), P(0.8, 0)]
    pts = [(px, ry, pz) for px, pz in q]
    r0, r1 = (ridge[0][0], ry + 1.7, ridge[0][1]), (ridge[1][0], ry + 1.7, ridge[1][1])
    ref = (x, ry - 1, z)
    G.face([pts[0], pts[1], r1, r0], 'roof', ref)
    G.face([pts[2], pts[3], r0, r1], 'roof', ref)
    G.face([pts[1], pts[2], r1], 'roof', ref)
    G.face([pts[3], pts[0], r0], 'roof', ref)
    return x, z


def build(detail):
    G = Mesh()
    rnd = random.Random(15)
    look = lookout_pos()
    sp = place(detail, look)
    for (x, z, r0, h) in sp:
        gy = spire(G, rnd, x, z, r0, h, 8 if detail else 5, 7 if detail else 3)
        if detail:
            for _ in range(rnd.randint(1, 3)):
                a = rnd.uniform(0, 2 * math.pi); sx, sz = x + math.cos(a) * (r0 + 0.6), z + math.sin(a) * (r0 + 0.6)
                if road(sx, sz) > 12 and math.hypot(sx - look[0], sz - look[1]) > 5.5: shrub(G, rnd, sx, ground(sx, sz), sz, rnd.uniform(0.9, 1.8), 6)
            if h > 12 and rnd.random() < 0.5:   # a tuft in a cleft half way up
                t = rnd.uniform(0.35, 0.55); a = rnd.uniform(0, 2 * math.pi); rr = r0 * (1 - t) ** 0.75
                shrub(G, rnd, x + math.cos(a) * rr, gy + h * t, z + math.sin(a) * rr, rnd.uniform(0.6, 1.0), 5)
    lx, lz = lookout(G, detail, look)
    return G, len(sp), (lx, lz)


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
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
for detail, fn in ((True, 'hinboun.glb'), (False, 'hinboun-far.glb')):
    G, ns, lk = build(detail)
    ob = to_blender(G, 'hinboun' if detail else 'hinboun_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', ns, 'spires, lookout at', '%.1f %.1f' % lk, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
