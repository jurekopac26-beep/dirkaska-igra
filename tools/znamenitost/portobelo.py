"""Portobelo: the ruined Spanish sea battery of coral stone on the slope above the bay, modelled in Blender (bpy) from its OSM outline and
the game's ground under it (tools/znamenitost/portobelo-tla.mjs), written as assets/landmarks/portobelo.glb (near) and portobelo-far.glb
(the far level, from 420 m). The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex
colours, no textures).

  node tools/znamenitost/portobelo-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/portobelo.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: the low battered grey walls of coral stone along the outline (their feet below the ground, darker and wet at the bottom), the
platform on top, a pale rounded cordon under the parapet, the thick parapet with its wide gun ports, an old iron cannon on a low carriage
in each gun port of the walls facing the road and the bay, a stone sentry box with a domed cap on each bastion's point and an arched
gate in the wall towards the road. No inscriptions, no flags, no statues.
The far level: the walls, their top, the parapet as one band and the sentry boxes, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the fort's centre (x, z) (the game puts the model there).
Budget (docs/proge/portobelo.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
PTS, (CX, CZ) = [tuple(p) for p in D['pts']], D['FC']
if PTS[0] == PTS[-1]: PTS = PTS[:-1]
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']

# the materials: the game's colours (js/world-portobelo.js, the fallback fort): grey coral stone, its top, the wet foot, the cordon
MATS = [('stone', (0.62, 0.60, 0.55)), ('stone_top', (0.56, 0.55, 0.50)), ('wet', (0.36, 0.37, 0.32)), ('pale', (0.74, 0.72, 0.66)),
        ('dark', (0.12, 0.11, 0.10)), ('iron', (0.17, 0.17, 0.18)), ('wood', (0.33, 0.25, 0.18))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def ground(x, z):
    fx, fz = (x - X0) / ST, (z - Z0) / ST
    i, j = max(0, min(NX - 2, int(math.floor(fx)))), max(0, min(NZ - 2, int(math.floor(fz))))
    u, v = max(0.0, min(1.0, fx - i)), max(0.0, min(1.0, fz - j))
    h = lambda a, b: H[b * NX + a]
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v


def inside(x, z):
    c, n = False, len(PTS)
    for k in range(n):
        (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % n]
        if (az > z) != (bz > z) and x < ax + (z - az) * (bx - ax) / (bz - az): c = not c
    return c


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


# ---- the outline: orientation, the outward normals and the mitred offsets ----
N = len(PTS)
area = sum(PTS[k][0] * PTS[(k + 1) % N][1] - PTS[(k + 1) % N][0] * PTS[k][1] for k in range(N))
ORI = 1 if area > 0 else -1


def enorm(k):
    (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]
    l = math.hypot(bx - ax, bz - az) or 1
    return (bz - az) / l * ORI, -(bx - ax) / l * ORI   # (outward for ORI's turn; checked below)


nx0, nz0 = enorm(0); mx0, mz0 = (PTS[0][0] + PTS[1][0]) / 2, (PTS[0][1] + PTS[1][1]) / 2
if inside(mx0 + nx0 * 3, mz0 + nz0 * 3): ORI = -ORI


def miter(k):
    """the vertex k's offset direction (outward), scaled so the offset walls meet; clamped at the sharp points"""
    (ax, az), (bx, bz) = enorm((k - 1) % N), enorm(k)
    sx, sz = ax + bx, az + bz; l = math.hypot(sx, sz) or 1; sx, sz = sx / l, sz / l
    d = sx * bx + sz * bz
    f = 1 / max(d, 0.4)
    return sx * f, sz * f


MIT = [miter(k) for k in range(N)]
TOP = [ground(*PTS[k]) + 4.4 for k in range(N)]   # the walls' tops at the outline's points: 4.4 m above the ground there (a low battery)


def wall_samples(step):
    """samples along the outline: (x, z, outward miter (mx, mz), the top's height); the corners exactly, the edges every <= step m"""
    out = []
    for k in range(N):
        (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]
        l = math.hypot(bx - ax, bz - az); n = max(1, int(math.ceil(l / step)))
        nx, nz = enorm(k)
        for q in range(n):
            t = q / n; x, z = ax + (bx - ax) * t, az + (bz - az) * t
            m = MIT[k] if q == 0 else (nx, nz)
            top = max(TOP[k] * (1 - t) + TOP[(k + 1) % N] * t, ground(x, z) + 3.4)
            out.append((x, z, m, top, k, q == 0))
    return out


UP, DOWN = (0, 1, 0), (0, -1, 0)
OUTW = lambda r: (r['m'][0], 0, r['m'][1])
IN = lambda r: (-r['m'][0], 0, -r['m'][1])
W_TOP, W_FOOT = 2.6, 3.5    # (m: the wall's thickness at the platform and at the foot, the outer face battered)
ROAD = (0.0, -1.0)          # (the road and the bay from the fort: north, -z; the road's nearest point is ~55 m from the centre)


def walls(G, step, detail):
    S = wall_samples(step); n = len(S)
    rows = []
    for (x, z, (mx, mz), top, k, corner) in S:
        oT = (x + mx * W_TOP / 2, z + mz * W_TOP / 2); iT = (x - mx * W_TOP / 2, z - mz * W_TOP / 2)
        oF = (x + mx * (W_FOOT - W_TOP / 2), z + mz * (W_FOOT - W_TOP / 2))
        g = min(ground(*oF), ground(*iT), ground(x, z))
        rows.append(dict(oT=oT, iT=iT, oF=oF, top=top, foot=g - 2.0, wet=g + 0.9, k=k, corner=corner, m=(mx, mz)))
    cord = 1.0     # (the cordon: this far under the platform)
    for a in range(n):
        A, B = rows[a], rows[(a + 1) % n]
        P = lambda r, key, y: (r[key][0], y, r[key][1])
        bat = lambda r, y: (r['oF'][0] + (r['oT'][0] - r['oF'][0]) * (y - r['foot']) / (r['top'] - r['foot']), y,
                            r['oF'][1] + (r['oT'][1] - r['oF'][1]) * (y - r['foot']) / (r['top'] - r['foot']))
        ca, cb = A['top'] - cord, B['top'] - cord
        wa, wb = min(A['wet'], ca - 0.5), min(B['wet'], cb - 0.5)
        # the outer face, battered: the wet dark foot, the grey stone up to the cordon, the rounded pale cordon, the parapet's foot above it
        G.quad([P(A, 'oF', A['foot']), P(B, 'oF', B['foot']), bat(B, wb), bat(A, wa)], 'wet', d=OUTW(A))
        G.quad([bat(A, wa), bat(B, wb), bat(B, cb - 0.15), bat(A, ca - 0.15)], 'stone', d=OUTW(A))
        if detail:
            out = lambda r, y, e: (bat(r, y)[0] + r['m'][0] * e, y, bat(r, y)[2] + r['m'][1] * e)
            G.quad([out(A, ca - 0.15, 0), out(B, cb - 0.15, 0), out(B, cb - 0.05, 0.16), out(A, ca - 0.05, 0.16)], 'pale', d=(A['m'][0], -1, A['m'][1]))
            G.quad([out(A, ca - 0.05, 0.16), out(B, cb - 0.05, 0.16), out(B, cb + 0.12, 0.16), out(A, ca + 0.12, 0.16)], 'pale', d=OUTW(A))
            G.quad([out(A, ca + 0.12, 0.16), out(B, cb + 0.12, 0.16), out(B, cb + 0.2, 0), out(A, ca + 0.2, 0)], 'pale', d=(A['m'][0], 1, A['m'][1]))
            G.quad([bat(A, ca + 0.2), bat(B, cb + 0.2), P(B, 'oT', B['top']), P(A, 'oT', A['top'])], 'stone', d=OUTW(A))
        else:
            G.quad([bat(A, ca - 0.15), bat(B, cb - 0.15), bat(B, cb + 0.2), bat(A, ca + 0.2)], 'pale', d=OUTW(A))
            G.quad([bat(A, ca + 0.2), bat(B, cb + 0.2), P(B, 'oT', B['top']), P(A, 'oT', A['top'])], 'stone', d=OUTW(A))
        # the inner face (plain) and the platform on top
        G.quad([P(B, 'iT', B['foot']), P(A, 'iT', A['foot']), P(A, 'iT', A['top']), P(B, 'iT', B['top'])], 'stone', d=IN(A))
        G.quad([P(A, 'oT', A['top']), P(B, 'oT', B['top']), P(B, 'iT', B['top']), P(A, 'iT', A['top'])], 'stone_top', d=UP)
    return rows


def barrel(G, x, y, z, ux, uz, r0, r1, l, n, mat):
    """a horizontal cylinder from (x, y, z) along (ux, uz), its radius r0 at the breech and r1 at the muzzle, with a closed breech"""
    px, pz = -uz, ux
    ring = lambda t, r: [(x + ux * t + px * r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z + uz * t + pz * r * math.cos(2 * math.pi * k / n)) for k in range(n)]
    a, b = ring(0, r0), ring(l, r1)
    for k in range(n): G.quad([a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]], mat, (x + ux * l / 2, y, z + uz * l / 2))
    G.quad(a[::-1], mat, d=(-ux, 0, -uz)); G.quad(b, 'dark', d=(ux, 0, uz))


def parapet(G, rows, detail):
    """the thick parapet on the platform's outer edge (1.3 m): a breast and on it the long merlons between the wide gun ports; in the gun
    ports of the walls facing the road an iron cannon on a low wooden carriage"""
    n, guns = len(rows), 0
    for a in range(n):
        A, B = rows[a], rows[(a + 1) % n]
        ax, az = A['oT']; bx, bz = B['oT']
        (amx, amz), (bmx, bmz) = A['m'], B['m']
        ix = lambda x, z, mx, mz: (x - mx * 1.3, z - mz * 1.3)
        aix, aiz = ix(ax, az, amx, amz); bix, biz = ix(bx, bz, bmx, bmz)
        ya, yb = A['top'], B['top']
        br = 0.45 if detail else 1.1   # (the breast under the gun ports; the far level: the parapet as one band)
        G.quad([(aix, ya, aiz), (aix, ya + br, aiz), (bix, yb + br, biz), (bix, yb, biz)], 'stone', d=IN(A))
        G.quad([(ax, ya + br, az), (aix, ya + br, aiz), (bix, yb + br, biz), (bx, yb + br, bz)], 'stone_top', d=UP)
        G.quad([(ax, ya, az), (bx, yb, bz), (bx, yb + br, bz), (ax, ya + br, az)], 'stone', d=OUTW(A))
    if not detail: return 0
    # the merlons and the gun ports along each edge of the outline (between its corners, offset onto the platform's outer edge)
    for k in range(N):
        (pax, paz), (pbx, pbz) = PTS[k], PTS[(k + 1) % N]
        nx, nz = enorm(k)
        (amx, amz), (bmx, bmz) = MIT[k], MIT[(k + 1) % N]
        o = W_TOP / 2 - 0.65   # (the merlons' middle: 0.65 m in from the outer edge)
        ax, az, bx, bz = pax + amx * o, paz + amz * o, pbx + bmx * o, pbz + bmz * o
        l = math.hypot(bx - ax, bz - az)
        if l < 2.0: continue
        m = max(1, int(round(l / 4.0)))
        ang = math.atan2(bz - az, bx - ax)
        top = lambda t: max(TOP[k] * (1 - t) + TOP[(k + 1) % N] * t, ground(pax + (pbx - pax) * t, paz + (pbz - paz) * t) + 3.4)
        for q in range(m):
            t = (q + 0.5) / m
            G.box(ax + (bx - ax) * t, top(t) + 0.45 - 0.02, az + (bz - az) * t, l / m - 1.3, 0.77, 1.3, ang, 'stone', 'stone_top')
            # the cannon in the gun port after this merlon (t = (q + 1) / m), on the walls that face the road and the bay
            if q == m - 1 or nx * ROAD[0] + nz * ROAD[1] < 0.55 or guns >= 7: continue
            t2 = (q + 1) / m
            gx, gz, gy = ax + (bx - ax) * t2, az + (bz - az) * t2, top(t2)
            G.box(gx - nx * 1.3, gy, gz - nz * 1.3, 1.1, 0.45, 1.5, ang, 'wood')
            barrel(G, gx - nx * 2.0, gy + 0.62, gz - nz * 2.0, nx, nz, 0.26, 0.17, 2.7, 10, 'iron')
            guns += 1
    return guns


def sentries(G, rows, n_side, rows_dome):
    """a stone sentry box on each bastion's point (the sharp outward corners of the outline)"""
    put = 0
    for k in range(N):
        (px, pz), (ax, az), (bx, bz) = PTS[k], PTS[(k - 1) % N], PTS[(k + 1) % N]
        e1, e2 = math.atan2(pz - az, px - ax), math.atan2(bz - pz, bx - px)
        tn = (e2 - e1 + math.pi) % (2 * math.pi) - math.pi
        mx, mz = MIT[k]
        if abs(tn) < 0.9 or inside(px + mx * 0.3 * 4, pz + mz * 0.3 * 4): continue   # (only the outward points)
        l = math.hypot(mx, mz); ux, uz = mx / l, mz / l
        x, z, y = px + ux * (W_TOP / 2 * l - 0.5), pz + uz * (W_TOP / 2 * l - 0.5), TOP[k]
        G.box(x, y - 1.2, z, 1.2, 1.2, 1.2, math.atan2(uz, ux) + math.pi / 4, 'pale')      # (its corbel)
        G.cyl(x, y, z, 0.85, 2.1, n_side, 'stone')
        if rows_dome:
            G.quad([(x + ux * 0.86 - uz * 0.16, y + 1.0, z + uz * 0.86 + ux * 0.16), (x + ux * 0.86 + uz * 0.16, y + 1.0, z + uz * 0.86 - ux * 0.16),
                    (x + ux * 0.86 + uz * 0.16, y + 1.7, z + uz * 0.86 - ux * 0.16), (x + ux * 0.86 - uz * 0.16, y + 1.7, z + uz * 0.86 + ux * 0.16)], 'dark', d=(ux, 0, uz))
            G.dome(x, y + 2.1, z, 1.0, 0.9, n_side, rows_dome, 'pale')
        put += 1
    return put


def gate(G, rows):
    """the gate: a dark arched opening in the outer face of the longest wall facing the road (north)"""
    best = None
    for k in range(N):
        (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]
        l = math.hypot(bx - ax, bz - az); nx, nz = enorm(k)
        sc = l * max(0.0, nx * ROAD[0] + nz * ROAD[1])
        if l > 10 and (best is None or sc > best[0]): best = (sc, k)
    if not best: return
    k = best[1]; (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]; nx, nz = enorm(k)
    mx, mz = (ax + bx) / 2, (az + bz) / 2; g = ground(mx + nx * W_FOOT, mz + nz * W_FOOT)
    ux, uz = (bx - ax), (bz - az); l = math.hypot(ux, uz); ux, uz = ux / l, uz / l
    o = W_FOOT - W_TOP / 2 + 0.06 - 0.2
    w, h = 1.4, 2.4
    pts = [(-w, 0), (w, 0), (w, h)] + [(w * math.cos(a * math.pi / 8), h + w * 0.8 * math.sin(a * math.pi / 8)) for a in range(1, 8)] + [(-w, h)]
    P = lambda a, y: (mx + ux * a + nx * o, g + y, mz + uz * a + nz * o)
    G.quad([P(a, y) for a, y in pts], 'dark', d=(nx, 0, nz))
    G.box(mx + nx * (o + 0.1), g + h + w * 0.8, mz + nz * (o + 0.1), 2 * w + 1.2, 0.5, 0.45, math.atan2(uz, ux), 'pale')   # (the stone frame's lintel)
    for s in (-1, 1): G.box(mx + ux * s * (w + 0.3) + nx * (o + 0.1), g - 0.3, mz + uz * s * (w + 0.3) + nz * (o + 0.1), 0.6, h + w * 0.8 + 0.3, 0.45, math.atan2(uz, ux), 'pale')


def build(detail):
    G = Mesh()
    rows = walls(G, 2.5 if detail else 8.0, detail)
    guns = parapet(G, rows, detail)
    ns = sentries(G, rows, 12 if detail else 6, 3 if detail else 0)
    if detail: gate(G, rows)
    return G, ns, guns
def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the fort's centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
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
for detail, fn in ((True, 'portobelo.glb'), (False, 'portobelo-far.glb')):
    G, ns, guns = build(detail)
    ob = to_blender(G, 'portobelo' if detail else 'portobelo_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', ns, "sentry boxes,", guns, "cannons,", os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
