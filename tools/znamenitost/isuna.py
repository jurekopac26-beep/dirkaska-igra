"""Isuna: the old iron chain footbridge over the Paro Chhu below the road (OSM way 452848825), modelled in Blender (bpy) on the game's ground
under it (tools/znamenitost/isuna-tla.mjs), written as assets/landmarks/isuna.glb (near) and isuna-far.glb (the far level, from 420 m).
The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/isuna-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/isuna.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: a whitewashed stone gatehouse at each end of the deck (its walls battered, a red-brown band under the eaves, the open gap under the
dark shingled roof, a gilded pinnacle on top, small dark windows, the dark doorway the deck goes through in its wooden frame), the two pairs of
iron chains hanging from high in the gatehouses, the hangers every 0.75 m, the plank deck hung from them (sagging), the handrail and the lower
rail, and strings of plain coloured flags under the chains (no inscriptions, no statues). The measures as js/world-isuna.js (BR).
The far level: the gatehouses' blocks, band, roofs and pinnacles, the deck and the main chains in long pieces.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the bridge's middle (x, z) (the game puts the model there).
Budget (docs/proge/isuna.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
CX, CZ = D['MC']
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']

# the bridge (js/world-isuna.js BR): the deck's ends on OSM's line, the gatehouses' size and height above the deck, the deck above the higher bank
# and its sag, the chains' height at the ends and at the middle, the deck's width
A, B = (-1385.3, 261.2), (-1351.5, 232.5)
TW, TH, DECK, SAG, CH, CHM, W = 7.0, 6.6, 0.7, 1.2, 4.2, 1.1, 1.5

# the materials: the game's colours (js/world-isuna.js, the fallback bridge)
MATS = [('white', (0.93, 0.92, 0.87)), ('band', (0.5, 0.2, 0.14)), ('roof', (0.3, 0.22, 0.17)), ('dark', (0.12, 0.1, 0.09)),
        ('iron', (0.22, 0.21, 0.2)), ('gold', (0.86, 0.66, 0.22)), ('blue', (0.16, 0.36, 0.72)), ('green', (0.2, 0.52, 0.3))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def ground(x, z):
    fx, fz = (x - X0) / ST, (z - Z0) / ST
    i, j = max(0, min(NX - 2, int(math.floor(fx)))), max(0, min(NZ - 2, int(math.floor(fz))))
    u, v = max(0.0, min(1.0, fx - i)), max(0.0, min(1.0, fz - j))
    h = lambda a, b: H[b * NX + a]
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v


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

    def gable(s, x, y, z, lx, lz, hh, ang, mat, ends):
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, h: (x + c * a - sn * b, y + h, z + sn * a + c * b)
        a, b = lx / 2, lz / 2
        o = (x, y, z)
        s.quad([P(-a, -b, 0), P(a, -b, 0), P(a, 0, hh), P(-a, 0, hh)], mat, o)
        s.quad([P(a, b, 0), P(-a, b, 0), P(-a, 0, hh), P(a, 0, hh)], mat, o)
        s.quad([P(-a, b, 0), P(-a, -b, 0), P(-a, 0, hh)], ends, o)
        s.quad([P(a, -b, 0), P(a, b, 0), P(a, 0, hh)], ends, o)

    def cyl(s, x, y, z, r, h, n, mat):
        ring = [(x + r * math.cos(2 * math.pi * k / n), z + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
        for k in range(n):
            (ax, az), (bx, bz) = ring[k], ring[(k + 1) % n]
            s.quad([(ax, y, az), (ax, y + h, az), (bx, y + h, bz), (bx, y, bz)], mat, (x, y + h / 2, z))

    def dome(s, x, y, z, r, h, n, rows, mat):
        prev = [(x + r * math.cos(2 * math.pi * k / n), y, z + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
        for j in range(1, rows + 1):
            t = j / rows; rr, yy = r * math.cos(t * math.pi / 2), y + h * math.sin(t * math.pi / 2)
            cur = [(x + rr * math.cos(2 * math.pi * k / n), yy, z + rr * math.sin(2 * math.pi * k / n)) for k in range(n)]
            for k in range(n):
                if j == rows: s.quad([prev[k], (x, y + h, z), prev[(k + 1) % n]], mat, (x, y, z))
                else: s.quad([prev[k], cur[k], cur[(k + 1) % n], prev[(k + 1) % n]], mat, (x, y, z))
            prev = cur

    def beam(s, p, q, r, mat, side):
        """a square bar of half-width r from the point p to q (each (x, y, z)), its sides along the bridge's normal side (nx, nz) and up"""
        dx, dy, dz = q[0] - p[0], q[1] - p[1], q[2] - p[2]; l = math.sqrt(dx * dx + dy * dy + dz * dz) or 1
        sx, sz = side
        # the bar's second axis: up (the bars along the bridge), or along the bridge (the vertical hangers)
        ux, uy, uz = (sz, 0.0, -sx) if abs(dy) > 0.9 * l else (0.0, 1.0, 0.0)
        o = [(sx * a * r + ux * b * r, uy * b * r, sz * a * r + uz * b * r) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        P = [(p[0] + v[0], p[1] + v[1], p[2] + v[2]) for v in o]; Q = [(q[0] + v[0], q[1] + v[1], q[2] + v[2]) for v in o]
        c = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2)
        for k in range(4): s.quad([P[k], P[(k + 1) % 4], Q[(k + 1) % 4], Q[k]], mat, c)

    def frustum(s, x, y, z, a0, a1, h, ang, mat, top=None):
        """a square block a0 wide at its foot (y), a1 at its top (y + h): the battered walls"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, yy: (x + c * a - sn * b, yy, z + sn * a + c * b)
        q = [P(-a0 / 2, -a0 / 2, y), P(a0 / 2, -a0 / 2, y), P(a0 / 2, a0 / 2, y), P(-a0 / 2, a0 / 2, y)]
        t = [P(-a1 / 2, -a1 / 2, y + h), P(a1 / 2, -a1 / 2, y + h), P(a1 / 2, a1 / 2, y + h), P(-a1 / 2, a1 / 2, y + h)]
        o = (x, y + h / 2, z)
        for k in range(4): s.quad([q[k], q[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, o)
        s.quad(t, top or mat, o)

    def hip(s, x, y, z, a, h, ang, mat):
        """a hipped roof a wide, rising h to a short ridge"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda u, v, yy: (x + c * u - sn * v, yy, z + sn * u + c * v)
        b = [P(-a / 2, -a / 2, y), P(a / 2, -a / 2, y), P(a / 2, a / 2, y), P(-a / 2, a / 2, y)]
        r0, r1 = P(-a * 0.12, 0, y + h), P(a * 0.12, 0, y + h)
        o = (x, y, z)
        s.quad([b[0], b[1], r1, r0], mat, o); s.quad([b[2], b[3], r0, r1], mat, o)
        s.quad([b[3], b[0], r0], mat, o); s.quad([b[1], b[2], r1], mat, o)

    def flag(s, p, ux, uz, w, h, mat):
        """a cloth flag hanging from p (both faces), w along the string (ux, uz), h down"""
        a = (p[0], p[1], p[2]); b = (p[0] + ux * w, p[1], p[2] + uz * w); c2 = (b[0], b[1] - h, b[2]); d = (a[0], a[1] - h, a[2])
        nx, nz = -uz, ux
        s.quad([a, b, c2, d], mat, d=(nx, 0, nz)); s.quad([a, b, c2, d], mat, d=(-nx, 0, -nz))


L = math.hypot(B[0] - A[0], B[1] - A[1]); UX, UZ = (B[0] - A[0]) / L, (B[1] - A[1]) / L; NXX, NZZ = -UZ, UX; ANG = math.atan2(UZ, UX)
YD = max(ground(*A), ground(*B)) + DECK


def at(t, o): return (A[0] + UX * t + NXX * o, A[1] + UZ * t + NZZ * o)


def dy(u): return YD - SAG * (1 - (2 * u - 1) ** 2)


def cy(u): return YD + CHM + (CH - CHM) * (2 * u - 1) ** 2


def gatehouse(G, tc, detail):
    cx, cz = at(tc, 0); h = TW / 2
    y0 = min(ground(*at(tc + p, q)) for p in (-h, h) for q in (-h, h)) - 1.0
    top = YD + TH
    if detail: G.frustum(cx, y0, cz, TW + 0.5, TW - 0.3, top - 1.0 - y0, ANG, 'white')
    else: G.box(cx, y0, cz, TW, top - 1.0 - y0, TW, ANG, 'white')
    G.box(cx, top - 1.0, cz, TW - 0.2, 0.85, TW - 0.2, ANG, 'band')
    if detail:
        G.box(cx, top - 0.15, cz, TW - 0.6, 0.45, TW - 0.6, ANG, 'dark')   # the open gap under the roof
        G.box(cx, top + 0.3, cz, TW + 1.4, 0.18, TW + 1.4, ANG, 'roof')    # the eaves
        G.hip(cx, top + 0.48, cz, TW + 1.4, 1.9, ANG, 'roof')
        G.cyl(cx, top + 2.2, cz, 0.3, 0.7, 8, 'gold'); G.dome(cx, top + 2.9, cz, 0.3, 0.55, 8, 2, 'gold')
    else:
        G.gable(cx, top - 0.15, cz, TW + 1.4, TW + 1.4, 2.2, ANG, 'roof', 'roof')
        G.cyl(cx, top + 1.7, cz, 0.3, 1.2, 5, 'gold')
    if not detail: return
    c, sn = math.cos(ANG), math.sin(ANG)
    # the doorway on the deck's line, both faces: dark, in a wooden frame; the windows high on the two side faces
    for e in (-1, 1):
        aa = e * (TW + 0.5 - (0.8) * (YD - 0.2 - y0) / (top - 1.0 - y0)) / 2 + e * 0.05
        P = lambda b, yy: (cx + c * aa - sn * b, yy, cz + sn * aa + c * b)
        G.quad([P(-1.25, YD - 0.25), P(1.25, YD - 0.25), P(1.25, YD + 3.25), P(-1.25, YD + 3.25)], 'roof', d=(c * e, 0, sn * e))
        aa2 = aa + e * 0.04; P2 = lambda b, yy: (cx + c * aa2 - sn * b, yy, cz + sn * aa2 + c * b)
        G.quad([P2(-1.0, YD - 0.2), P2(1.0, YD - 0.2), P2(1.0, YD + 2.95), P2(-1.0, YD + 2.95)], 'dark', d=(c * e, 0, sn * e))
    for e in (-1, 1):
        for q in (-1, 1):
            yb = top - 2.9; bb = e * ((TW + 0.5 - 0.8 * (yb - y0) / (top - 1.0 - y0)) / 2 + 0.05)
            P = lambda a, yy: (cx + c * a - sn * bb, yy, cz + sn * a + c * bb)
            G.quad([P(q * 1.6 - 0.4, yb), P(q * 1.6 + 0.4, yb), P(q * 1.6 + 0.4, yb + 1.0), P(q * 1.6 - 0.4, yb + 1.0)], 'dark', d=(-sn * e, 0, c * e))


def build(detail):
    G = Mesh()
    gatehouse(G, -TW / 2, detail); gatehouse(G, L + TW / 2, detail)
    seg = 0.75 if detail else 3.0
    n = int(math.ceil(L / seg)); side = (NXX, NZZ)
    def P3(u, o, y): x, z = at(u * L, o); return (x, y, z)
    for k in range(n):
        u0, u1, um = k / n, (k + 1) / n, (k + 0.5) / n
        x, z = at(um * L, 0)
        G.box(x, dy(um) - 0.16, z, L / n + 0.04, 0.16, W, ANG, 'roof', bottom=True)
        for sd in (-1, 1):
            o = sd * (W / 2 + 0.06)
            G.beam(P3(u0, o, cy(u0)), P3(u1, o, cy(u1)), 0.09, 'iron', side)
            if not detail: continue
            G.beam(P3(u0, o + sd * 0.25, cy(u0) + 0.25), P3(u1, o + sd * 0.25, cy(u1) + 0.25), 0.07, 'iron', side)   # (the second chain)
            G.beam(P3(u0, o, dy(u0) + 1.0), P3(u1, o, dy(u1) + 1.0), 0.04, 'iron', side)
            G.beam(P3(u0, o, dy(u0) + 0.45), P3(u1, o, dy(u1) + 0.45), 0.03, 'iron', side)
            G.beam(P3(u0, o, dy(u0)), P3(u0, o, cy(u0)), 0.025, 'iron', side)
            # the flags: hung under the outer chain, blue, white, red-brown, green, gold in turn
            fm = ('blue', 'white', 'band', 'green', 'gold')[(k + (sd > 0) * 2) % 5]
            G.flag(P3(u0, o + sd * 0.3, cy(u0) + 0.18), UX, UZ, L / n * 0.85, 0.55, fm)
    return G


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the bridge's middle -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
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
for detail, fn in ((True, 'isuna.glb'), (False, 'isuna-far.glb')):
    G = build(detail)
    ob = to_blender(G, 'isuna' if detail else 'isuna_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
