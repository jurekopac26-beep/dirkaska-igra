"""Livingstone: the old steel arch bridge over the gorge of the Zambezi, modelled in Blender (bpy) on the game's own road over the gorge and
the ground under it (tools/znamenitost/livingstone-tla.mjs), written as assets/landmarks/livingstone.glb (near) and livingstone-far.glb (the
far level, from 420 m). The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours,
no textures) and swaps them for the simple bridge of js/world-livingstone.js.

  node tools/znamenitost/livingstone-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/livingstone.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: a braced-spandrel steel arch, its two trussed ribs leaning in towards the crown (wider apart at the springings), the bottom chord
a parabola from the stone seats low on the gorge's walls up to the crown under the deck, the top chord level under the deck, the panels'
verticals and diagonals between them, the lateral struts and the X bracing between the ribs; the end posts over the springings; the steel
trestles under the approach spans on the cliffs; the deck along the road (its girders, the fascias, the footways out to the railing; no faces turned down: all of it is below the camera
behind the car), the
railing's posts and rails, the masonry abutments at both ends. No inscriptions, no plaques, no flags, no statues.
The far level: the deck, the chords, the end posts and the seats, every second panel's vertical, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the bridge's centre (x, z) (the game puts the model there).
Budget (docs/proge/livingstone.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
S, (CX, CZ), I0, I1, IC = D['S'], D['FC'], D['i0'], D['i1'], D['ic']
BASE = S[0]['i']
K = lambda i: S[i - BASE]   # the sample of the track's index i
GOFF = list(range(-16, 17, 2))   # the offsets of the ground samples across the road (m)

# the materials: the game's colours (js/world-livingstone.js, the simple bridge)
MATS = [('steel', (0.62, 0.64, 0.62)), ('steel_dark', (0.46, 0.48, 0.47)), ('stone', (0.50, 0.46, 0.42)), ('deck', (0.56, 0.55, 0.53)),
        ('rail', (0.60, 0.62, 0.60)), ('rail_dark', (0.44, 0.46, 0.45))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def lerp(a, b, t): return a + (b - a) * t


def ground(i, o):
    """the game's ground at the sample i, o metres across (left negative), from the grid of offsets (clamped at +-16 m)"""
    g = K(i)['g']; f = (max(-16, min(16, o)) + 16) / 2; j = min(len(g) - 2, int(f)); u = f - j
    return lerp(g[j], g[j + 1], u)


def at(i, o, dy=0.0):
    """the point o metres across the road at the sample i (fractional i between samples), dy above the deck"""
    a = int(math.floor(i)); a = max(BASE, min(BASE + len(S) - 2, a)); u = i - a
    p, q = K(a), K(a + 1)
    x, z = lerp(p['x'], q['x'], u), lerp(p['z'], q['z'], u)
    nx, nz = lerp(p['nx'], q['nx'], u), lerp(p['nz'], q['nz'], u); l = math.hypot(nx, nz) or 1
    return (x + nx / l * o, lerp(p['y'], q['y'], u) + dy, z + nz / l * o)


class Mesh:
    """vertices in the game's frame (x, y up, z); faces as vertex lists with a material"""
    def __init__(s): s.v, s.f, s.m = [], [], []

    def quad(s, ps, mat, ref=None, d=None):
        """a face facing away from the point ref, or along the direction d (the game draws the front faces only, lit by their normals)"""
        nx = ny = nz = 0.0
        for k in range(len(ps)):
            (ax, ay, az), (bx, by, bz) = ps[k], ps[(k + 1) % len(ps)]
            nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by)
        cx, cy, cz = (sum(p[i] for p in ps) / len(ps) for i in range(3))
        dx, dy, dz = d if d else (cx - ref[0], cy - ref[1], cz - ref[2])
        if nx * dx + ny * dy + nz * dz < 0: ps = ps[::-1]; nx, ny, nz = -nx, -ny, -nz
        if ny < -0.25 * math.sqrt(nx * nx + ny * ny + nz * nz): return   # (the faces turned down: under the deck, never seen by the camera behind the car)
        b = len(s.v); s.v.extend(ps); s.f.append(tuple(range(b, b + len(ps)))); s.m.append(M[mat])

    def beam(s, p0, p1, w, h, mat, caps=False, up=(0.0, 1.0, 0.0)):
        """a steel member from p0 to p1: a box section w wide and h deep (h along up, as far as the member allows)"""
        dx, dy, dz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]; l = math.sqrt(dx * dx + dy * dy + dz * dz)
        if l < 1e-4: return
        dx, dy, dz = dx / l, dy / l, dz / l
        # u: across (perpendicular to the member and to up), v: the member's depth
        ux, uy, uz = dy * up[2] - dz * up[1], dz * up[0] - dx * up[2], dx * up[1] - dy * up[0]; ul = math.sqrt(ux * ux + uy * uy + uz * uz)
        if ul < 1e-3: ux, uy, uz = 1.0, 0.0, 0.0; ul = 1.0
        ux, uy, uz = ux / ul, uy / ul, uz / ul
        vx, vy, vz = uy * dz - uz * dy, uz * dx - ux * dz, ux * dy - uy * dx
        corner = lambda p, a, b: (p[0] + ux * a + vx * b, p[1] + uy * a + vy * b, p[2] + uz * a + vz * b)
        cs = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
        A = [corner(p0, a, b) for a, b in cs]; B = [corner(p1, a, b) for a, b in cs]
        mid = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2)
        for k in range(4): s.quad([A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]], mat, mid)
        if caps: s.quad(A, mat, mid); s.quad(B, mat, mid)

    def block(s, i, o, y0, y1, la, lo, mat):
        """a masonry block centred o metres across at the sample i: la along the road, lo across, from y0 to y1 (its top and four sides)"""
        p = K(int(round(i))); hd = math.atan2(p['nz'], p['nx'])
        tx, tz = -p['nz'], p['nx']; nx, nz = p['nx'], p['nz']; cx, cz = p['x'] + nx * o, p['z'] + nz * o
        P = lambda a, b, y: (cx + tx * a + nx * b, y, cz + tz * a + nz * b)
        q = [P(-la / 2, -lo / 2, y0), P(la / 2, -lo / 2, y0), P(la / 2, lo / 2, y0), P(-la / 2, lo / 2, y0)]
        t = [P(-la / 2, -lo / 2, y1), P(la / 2, -lo / 2, y1), P(la / 2, lo / 2, y1), P(-la / 2, lo / 2, y1)]
        c = (cx, (y0 + y1) / 2, cz)
        for k in range(4): s.quad([q[k], q[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, c)
        s.quad(t, mat, c)


# ---- the arch: the springings 78 m either side of the crown (as the simple bridge), on the gorge's walls ----
DS = D['ds']
NA = int(round(78 / DS)); IA, IB = max(I0 + 1, IC - NA), min(I1 - 1, IC + NA)
YA = min(K(IA)['y'] - 6, ground(IA, 0) + 1); YB = min(K(IB)['y'] - 6, ground(IB, 0) + 1)
PANEL = 4   # samples per panel (~8 m)
NP = max(2, int(round((IB - IA) / PANEL)))
CROWN = 6.6   # the bottom chord's crown below the deck (m)
TOPC = 2.6    # the top chord below the deck (m)


def u_of(i): return (i - IA) / (IB - IA)


def bottom(i):
    """the bottom chord's height at the (fractional) sample i: a parabola from the seats to the crown"""
    u = u_of(i); base = lerp(YA, YB, u); top = K(IC)['y'] - CROWN
    return base + (top - base) * (1 - (2 * u - 1) ** 2)


def rib_off(i):
    """the ribs' offset from the centre line: 5.6 m at the crown, 8.6 m at the springings (they lean in)"""
    u = u_of(i); return 5.6 + 3.0 * (2 * u - 1) ** 2


def rib_pt(i, sd, y):
    p = at(i, sd * rib_off(i)); return (p[0], y, p[2])


def deck_y(i): return at(i, 0)[1]


def build(detail):
    G = Mesh()
    # ---- the deck: from the abutment to the abutment; its underside out to the railing, the fascias, the footways, two girders ----
    for i in range(I0 - 1, I1 + 1):
        j = i + 1; P, Q = K(i), K(j)
        L0, L1 = P['bl'] + 0.45, Q['bl'] + 0.45; R0, R1 = P['br'] + 0.45, Q['br'] + 0.45
        for (o0, o1, sd) in ((-L0, -L1, -1), (R0, R1, 1)):
            G.quad([at(i, o0, -1.25), at(j, o1, -1.25), at(j, o1, 0.12), at(i, o0, 0.12)], 'steel', at(i, 0, -0.6))
            # the footway between the asphalt's edge and the railing (a little below the road's surface, so the road covers its inner edge)
            w0, w1 = P['w'] - 0.3, Q['w'] - 0.3
            G.quad([at(i, sd * w0, -0.04), at(j, sd * w1, -0.04), at(j, o1, 0.12), at(i, o0, 0.12)], 'deck', d=(0, 1, 0))
            if detail:   # the footway's kerb face towards the road
                G.quad([at(i, sd * w0, -0.04), at(j, sd * w1, -0.04), at(j, sd * w1, -0.3), at(i, sd * w0, -0.3)], 'deck', d=(-sd * P['nx'], 0, -sd * P['nz']))
        for sd in (-1, 1):   # two deep plate girders under the deck
            o = sd * 4.2
            G.beam(at(i, o, -2.3), at(j, o, -2.3), 0.5, 2.2, 'steel_dark')
    # the cross girders under the deck (every 2 samples), from girder to girder and out under the footways
    for i in range(I0, I1 + 1, 2 if detail else 6):
        G.beam(at(i, -(K(i)['bl'] + 0.3), -1.6), at(i, K(i)['br'] + 0.3, -1.6), 0.35, 0.7, 'steel_dark')

    # ---- the railing: posts every 2 m, a top and a middle rail ----
    if detail:
        for i in range(I0, I1 + 1):
            for sd in (-1, 1):
                o = sd * ((K(i)['br'] if sd > 0 else K(i)['bl']) + 0.16)
                p = at(i, o, 0.12)
                G.beam(p, (p[0], p[1] + 1.0, p[2]), 0.1, 0.1, 'rail', caps=True, up=(K(i)['nx'], 0, K(i)['nz']))
        for i in range(I0, I1):
            for sd in (-1, 1):
                o0 = sd * ((K(i)['br'] if sd > 0 else K(i)['bl']) + 0.16); o1 = sd * ((K(i + 1)['br'] if sd > 0 else K(i + 1)['bl']) + 0.16)
                for (dy, w, mat) in ((1.12, 0.1, 'rail'), (0.62, 0.06, 'rail_dark')):
                    G.beam(at(i, o0, dy), at(i + 1, o1, dy), w, w, mat)

    # ---- the two ribs: the top chord level under the deck, the bottom chord's parabola, the panels' verticals and diagonals ----
    nodes = [IA + (IB - IA) * k / NP for k in range(NP + 1)]
    cw, ch = (1.1, 1.4) if detail else (1.4, 1.6)
    for sd in (-1, 1):
        steps = 24 if detail else 12
        for k in range(steps):   # the bottom chord, smooth
            a, b = IA + (IB - IA) * k / steps, IA + (IB - IA) * (k + 1) / steps
            G.beam(rib_pt(a, sd, bottom(a)), rib_pt(b, sd, bottom(b)), cw, ch * 1.3, 'steel', up=(0, 1, 0))
        for k in range(NP):   # the top chord, panel by panel
            a, b = nodes[k], nodes[k + 1]
            G.beam(rib_pt(a, sd, deck_y(a) - TOPC), rib_pt(b, sd, deck_y(b) - TOPC), cw, ch, 'steel')
        for k, n in enumerate(nodes):   # the verticals (the end posts over the springings heavier)
            if not detail and k % 2 and 0 < k < NP: continue
            end = k in (0, NP)
            G.beam(rib_pt(n, sd, bottom(n)), rib_pt(n, sd, deck_y(n) - TOPC), 1.3 if end else 0.55, 1.3 if end else 0.7, 'steel' if end else 'steel_dark', up=(K(int(n))['nx'], 0, K(int(n))['nz']))
        if detail:
            for k in range(NP):   # the diagonals: from the bottom node at the springing's side up to the top node towards the crown
                a, b = nodes[k], nodes[k + 1]
                if (a + b) / 2 < IC: p0, p1 = rib_pt(a, sd, bottom(a)), rib_pt(b, sd, deck_y(b) - TOPC)
                else: p0, p1 = rib_pt(b, sd, bottom(b)), rib_pt(a, sd, deck_y(a) - TOPC)
                if abs(p1[1] - p0[1]) > 1.2: G.beam(p0, p1, 0.45, 0.55, 'steel_dark')
    # between the ribs: struts at every node (bottom and top), X bracing in the bottom chords' plane
    for k, n in enumerate(nodes):
        if not detail and k % 2: continue
        G.beam(rib_pt(n, -1, bottom(n)), rib_pt(n, 1, bottom(n)), 0.5, 0.6, 'steel_dark')
        if detail: G.beam(rib_pt(n, -1, deck_y(n) - TOPC), rib_pt(n, 1, deck_y(n) - TOPC), 0.4, 0.5, 'steel_dark')
    if detail:
        for k in range(NP):
            a, b = nodes[k], nodes[k + 1]
            G.beam(rib_pt(a, -1, bottom(a)), rib_pt(b, 1, bottom(b)), 0.3, 0.35, 'steel_dark')
            G.beam(rib_pt(a, 1, bottom(a)), rib_pt(b, -1, bottom(b)), 0.3, 0.35, 'steel_dark')

    # ---- the springings' stone seats in the gorge's walls, the end posts' stone feet ----
    for (i, y) in ((IA, YA), (IB, YB)):
        G.block(i, 0, y - 8, y + 0.4, 7, 2 * rib_off(i) + 4, 'stone')

    # ---- the approach spans: steel trestles on the cliffs between the abutment and the end post, where the ground is >4 m below ----
    for (a, b) in ((I0, IA), (IB, I1)):
        mids = [round(lerp(a, b, t)) for t in ((0.5,) if abs(b - a) < 14 else (1 / 3, 2 / 3))]
        for i in mids:
            gy = min(ground(i, -6), ground(i, 6)); top = deck_y(i) - 3.4
            if top - gy < 4: continue
            for sd in (-1, 1):
                G.beam(at(i, sd * 5.0, -3.4 - (top - gy)), at(i, sd * 4.2, -3.4), 0.7, 0.7, 'steel', up=(K(i)['nx'], 0, K(i)['nz']))
                G.block(i, sd * 5.0, gy - 2, gy + 0.6, 2.4, 2.4, 'stone')
            G.beam(at(i, -4.2, -3.4), at(i, 4.2, -3.4), 0.5, 0.6, 'steel_dark')
            if detail:
                n = max(1, int((top - gy) // 8))
                for q in range(n):   # cross bracing up the trestle
                    y0, y1 = -3.4 - (top - gy) * q / n, -3.4 - (top - gy) * (q + 1) / n
                    o0, o1 = lerp(4.2, 5.0, q / n), lerp(4.2, 5.0, (q + 1) / n)
                    G.beam(at(i, -o0, y0), at(i, o1, y1), 0.25, 0.3, 'steel_dark'); G.beam(at(i, o0, y0), at(i, -o1, y1), 0.25, 0.3, 'steel_dark')
                    G.beam(at(i, -o1, y1), at(i, o1, y1), 0.3, 0.35, 'steel_dark')

    # ---- the masonry abutments at both ends ----
    for i in (I0, I1):
        y = min(ground(i, 0), deck_y(i) - 1.5)
        G.block(i, 0, y - 3, deck_y(i) - 1.2, 5, K(i)['bl'] + K(i)['br'] + 1.5, 'stone')
    return G


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the bridge's centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
    me.from_pydata([(x - CX, -(z - CZ), y) for (x, y, z) in G.v], [], G.f)
    for (n, col) in MATS:
        mt = bpy.data.materials.get(n) or bpy.data.materials.new(n)
        mt.diffuse_color = (*col, 1.0); mt.use_nodes = True
        bs = mt.node_tree.nodes.get('Principled BSDF')
        if bs: bs.inputs['Base Color'].default_value = (*col, 1.0); bs.inputs['Roughness'].default_value = 0.8
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
for detail, fn in ((True, 'livingstone.glb'), (False, 'livingstone-far.glb')):
    G = build(detail)
    ob = to_blender(G, 'livingstone' if detail else 'livingstone_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', NP, 'panels,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
