"""Luanda: the old fort on the hill above the bay, modelled in Blender (bpy) from its OSM outline and the game's ground under it
(tools/znamenitost/luanda-tla.mjs), written as assets/landmarks/luanda.glb (near) and luanda-far.glb (the far level, from 420 m).
The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/luanda-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/luanda.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: the battered ochre curtain walls along the outline, their feet below the ground, the walkway on top, a white cordon under
the parapet, the parapet with its embrasures, a white sentry box with a domed cap on each bastion's point, a gate in the wall towards the
road, and the yard's low white and ochre buildings with red tiled roofs. No inscriptions, no flags, no statues.
The far level: the walls, their top and the buildings' blocks and roofs, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the fort's centre (x, z) (the game puts the model there).
Budget (docs/proge/luanda.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
PTS, (CX, CZ) = [tuple(p) for p in D['pts']], D['FC']
if PTS[0] == PTS[-1]: PTS = PTS[:-1]
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']

# the materials: the game's colours (js/world-luanda.js, the fallback fort)
MATS = [('ochre', (0.86, 0.68, 0.46)), ('ochre_top', (0.80, 0.64, 0.46)), ('white', (0.95, 0.94, 0.90)), ('roof', (0.68, 0.34, 0.22)),
        ('dark', (0.20, 0.17, 0.15)), ('stone', (0.62, 0.56, 0.48))]
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
TOP = [ground(*PTS[k]) + 7.5 for k in range(N)]   # the walls' tops at the outline's points: 7.5 m above the ground there


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
            top = max(TOP[k] * (1 - t) + TOP[(k + 1) % N] * t, ground(x, z) + 5.5)
            out.append((x, z, m, top, k, q == 0))
    return out


UP, DOWN = (0, 1, 0), (0, -1, 0)
OUTW = lambda r: (r['m'][0], 0, r['m'][1])
IN = lambda r: (-r['m'][0], 0, -r['m'][1])
W_TOP, W_FOOT = 3.2, 4.4    # (m: the wall's thickness at the walkway and at the foot, the outer face battered)


def walls(G, step, detail):
    S = wall_samples(step); n = len(S)
    rows = []
    for (x, z, (mx, mz), top, k, corner) in S:
        oT = (x + mx * W_TOP / 2, z + mz * W_TOP / 2); iT = (x - mx * W_TOP / 2, z - mz * W_TOP / 2)
        oF = (x + mx * (W_FOOT - W_TOP / 2), z + mz * (W_FOOT - W_TOP / 2))
        foot = min(ground(*oF), ground(*iT), ground(x, z)) - 2.0
        rows.append(dict(oT=oT, iT=iT, oF=oF, top=top, foot=foot, k=k, corner=corner, m=(mx, mz)))
    cord = 1.5     # (the cordon: this far under the walkway)
    for a in range(n):
        A, B = rows[a], rows[(a + 1) % n]
        P = lambda r, key, y: (r[key][0], y, r[key][1])
        # the outer face, battered: from the foot up to the cordon; the cordon (white) a band standing out 0.15 m; above it the parapet's face
        ca, cb = A['top'] - cord, B['top'] - cord
        bat = lambda r, y: (r['oF'][0] + (r['oT'][0] - r['oF'][0]) * (y - r['foot']) / (r['top'] - r['foot']), y,
                            r['oF'][1] + (r['oT'][1] - r['oF'][1]) * (y - r['foot']) / (r['top'] - r['foot']))
        G.quad([P(A, 'oF', A['foot']), P(B, 'oF', B['foot']), bat(B, cb - 0.2), bat(A, ca - 0.2)], 'ochre', d=OUTW(A))
        if detail:
            out = lambda r, y, e: (bat(r, y)[0] + r['m'][0] * e, y, bat(r, y)[2] + r['m'][1] * e)
            G.quad([out(A, ca - 0.2, 0), out(B, cb - 0.2, 0), out(B, cb - 0.2, 0.18), out(A, ca - 0.2, 0.18)], 'white', d=DOWN)
            G.quad([out(A, ca - 0.2, 0.18), out(B, cb - 0.2, 0.18), out(B, cb + 0.15, 0.18), out(A, ca + 0.15, 0.18)], 'white', d=OUTW(A))
            G.quad([out(A, ca + 0.15, 0.18), out(B, cb + 0.15, 0.18), out(B, cb + 0.15, 0), out(A, ca + 0.15, 0)], 'white', d=UP)
            G.quad([bat(A, ca + 0.15), bat(B, cb + 0.15), P(B, 'oT', B['top']), P(A, 'oT', A['top'])], 'ochre', d=OUTW(A))
        else:
            G.quad([bat(A, ca - 0.2), bat(B, cb - 0.2), bat(B, cb + 0.15), bat(A, ca + 0.15)], 'white', d=OUTW(A))
            G.quad([bat(A, ca + 0.15), bat(B, cb + 0.15), P(B, 'oT', B['top']), P(A, 'oT', A['top'])], 'ochre', d=OUTW(A))
        # the inner face (plain) and the walkway on top
        G.quad([P(B, 'iT', B['foot']), P(A, 'iT', A['foot']), P(A, 'iT', A['top']), P(B, 'iT', B['top'])], 'ochre', d=IN(A))
        G.quad([P(A, 'oT', A['top']), P(B, 'oT', B['top']), P(B, 'iT', B['top']), P(A, 'iT', A['top'])], 'ochre_top', d=UP)
    return rows


def parapet(G, rows):
    """the parapet on the walkway's outer edge, 0.8 m thick: a low continuous breast and on it the merlons between the embrasures"""
    n = len(rows)
    for a in range(n):
        A, B = rows[a], rows[(a + 1) % n]
        ax, az = A['oT']; bx, bz = B['oT']
        (amx, amz), (bmx, bmz) = A['m'], B['m']
        ix = lambda x, z, mx, mz: (x - mx * 0.8, z - mz * 0.8)
        aix, aiz = ix(ax, az, amx, amz); bix, biz = ix(bx, bz, bmx, bmz)
        ya, yb = A['top'], B['top']
        br = 0.55   # (the breast under the embrasures)
        G.quad([(aix, ya, aiz), (aix, ya + br, aiz), (bix, yb + br, biz), (bix, yb, biz)], 'ochre', d=IN(A))
        G.quad([(ax, ya + br, az), (aix, ya + br, aiz), (bix, yb + br, biz), (bx, yb + br, bz)], 'ochre_top', d=UP)
        G.quad([(ax, ya, az), (bx, yb, bz), (bx, yb + br, bz), (ax, ya + br, az)], 'ochre', d=OUTW(A))
        l = math.hypot(bx - ax, bz - az)
        if l < 1.2: continue
        m = max(1, int(round(l / 2.6)))
        ang = math.atan2(bz - az, bx - ax)
        for q in range(m):
            t = (q + 0.5) / m
            cx, cz = (ax + aix) / 2 + ((bx + bix) / 2 - (ax + aix) / 2) * t, (az + aiz) / 2 + ((bz + biz) / 2 - (az + aiz) / 2) * t
            y = ya + (yb - ya) * t + br
            G.box(cx, y, cz, l / m - 0.75, 0.75, 0.8, ang, 'ochre', 'ochre_top')


def sentries(G, rows, n_side, rows_dome):
    """a white sentry box on each bastion's point (the sharp outward corners of the outline)"""
    put = 0
    for k in range(N):
        (px, pz), (ax, az), (bx, bz) = PTS[k], PTS[(k - 1) % N], PTS[(k + 1) % N]
        e1, e2 = math.atan2(pz - az, px - ax), math.atan2(bz - pz, bx - px)
        tn = (e2 - e1 + math.pi) % (2 * math.pi) - math.pi
        mx, mz = MIT[k]
        if abs(tn) < 0.9 or inside(px + mx * 0.3 * 4, pz + mz * 0.3 * 4): continue   # (only the outward points)
        l = math.hypot(mx, mz); ux, uz = mx / l, mz / l
        x, z, y = px + ux * (W_TOP / 2 * l - 0.6), pz + uz * (W_TOP / 2 * l - 0.6), TOP[k]
        G.box(x, y - 1.4, z, 1.3, 1.4, 1.3, math.atan2(uz, ux) + math.pi / 4, 'white')      # (its corbel)
        G.cyl(x, y, z, 0.95, 2.3, n_side, 'white')
        if rows_dome:
            G.quad([(x + ux * 0.96 - uz * 0.18, y + 1.1, z + uz * 0.96 + ux * 0.18), (x + ux * 0.96 + uz * 0.18, y + 1.1, z + uz * 0.96 - ux * 0.18),
                    (x + ux * 0.96 + uz * 0.18, y + 1.9, z + uz * 0.96 - ux * 0.18), (x + ux * 0.96 - uz * 0.18, y + 1.9, z + uz * 0.96 + ux * 0.18)], 'dark', d=(ux, 0, uz))
            G.dome(x, y + 2.3, z, 1.1, 1.1, n_side, rows_dome, 'white')
        put += 1
    return put


def gate(G, rows):
    """the gate: a dark arched opening in the outer face of the longest wall nearest the road (towards +x, the bay's side)"""
    best = None
    for k in range(N):
        (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]
        l = math.hypot(bx - ax, bz - az); nx, nz = enorm(k)
        sc = l * max(0.0, nx)                   # (the walls facing the road: east)
        if l > 18 and (best is None or sc > best[0]): best = (sc, k)
    if not best: return
    k = best[1]; (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]; nx, nz = enorm(k)
    mx, mz = (ax + bx) / 2, (az + bz) / 2; g = ground(mx + nx * W_FOOT, mz + nz * W_FOOT)
    ux, uz = (bx - ax), (bz - az); l = math.hypot(ux, uz); ux, uz = ux / l, uz / l
    o = W_FOOT - W_TOP / 2 + 0.06 - 0.25
    w, h = 2.0, 3.6
    pts = [(-w, 0), (w, 0), (w, h)] + [(w * math.cos(a * math.pi / 8), h + w * 0.7 * math.sin(a * math.pi / 8)) for a in range(1, 8)] + [(-w, h)]
    P = lambda a, y: (mx + ux * a + nx * o, g + y, mz + uz * a + nz * o)
    G.quad([P(a, y) for a, y in pts], 'dark', d=(nx, 0, nz))
    G.box(mx + nx * (o + 0.1), g + h + w * 0.7, mz + nz * (o + 0.1), 2 * w + 1.4, 0.6, 0.5, math.atan2(uz, ux), 'white')   # (the stone frame's lintel)
    for s in (-1, 1): G.box(mx + ux * s * (w + 0.35) + nx * (o + 0.1), g, mz + uz * s * (w + 0.35) + nz * (o + 0.1), 0.7, h + w * 0.7, 0.5, math.atan2(uz, ux), 'white')


def yard(G, detail):
    """the yard's low buildings: the long white one along the longest wall's direction at the centre, an ochre one beside it"""
    lg, la = 0, 0
    for k in range(N):
        (ax, az), (bx, bz) = PTS[k], PTS[(k + 1) % N]; l = math.hypot(bx - ax, bz - az)
        if l > lg: lg, la = l, math.atan2(bz - az, bx - ax)
    c, s = math.cos(la), math.sin(la)
    blds = [(CX, CZ, 30, 9, 6.5, 'white', 2.2), (CX - s * 16, CZ + c * 16, 14, 8, 5.5, 'ochre', 2.0)]
    for (x, z, lx, lz, h, mat, rh) in blds:
        if not inside(x, z): continue
        corners = [(x + c * a - s * b, z + s * a + c * b) for a in (-lx / 2, lx / 2) for b in (-lz / 2, lz / 2)]
        y0 = min(ground(*p) for p in corners) - 1.0; y = ground(x, z)
        G.box(x, y0, z, lx, (y + h - 1) - y0, lz, la, mat)
        G.gable(x, y + h - 1, z, lx + 0.6, lz + 0.6, rh, la, 'roof', mat)
        if not detail: continue
        # the windows and the doors: dark openings a little off the long walls, regularly spaced; the shutters' sills white
        nw = int(lx // 3.2)
        for side in (-1, 1):
            for q in range(nw):
                a = -lx / 2 + (q + 0.5) * lx / nw; b = side * (lz / 2 + 0.03)
                door = (q == nw // 2)
                hh, ww, yb = (2.4, 1.3, y - 0.9) if door else (1.4, 0.9, y + 1.6)
                P = lambda da, yy: (x + c * (a + da) - s * b, yy, z + s * (a + da) + c * b)
                quad = [P(-ww / 2, yb), P(ww / 2, yb), P(ww / 2, yb + hh), P(-ww / 2, yb + hh)]
                G.quad(quad, 'dark', d=(-s * side, 0, c * side))
                if not door:
                    P2 = lambda da, yy, e: (x + c * (a + da) - s * (b + side * e), yy, z + s * (a + da) + c * (b + side * e))
                    sill = [P2(-ww / 2 - 0.1, yb - 0.12, 0.02), P2(ww / 2 + 0.1, yb - 0.12, 0.02), P2(ww / 2 + 0.1, yb, 0.02), P2(-ww / 2 - 0.1, yb, 0.02)]
                    G.quad(sill, 'stone' if mat == 'white' else 'white', d=(-s * side, 0, c * side))


def build(detail):
    G = Mesh()
    rows = walls(G, 3.0 if detail else 9.0, detail)
    if detail: parapet(G, rows)
    ns = sentries(G, rows, 12 if detail else 6, 3 if detail else 0)
    if detail: gate(G, rows)
    yard(G, detail)
    return G, ns


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
for detail, fn in ((True, 'luanda.glb'), (False, 'luanda-far.glb')):
    G, ns = build(detail)
    ob = to_blender(G, 'luanda' if detail else 'luanda_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', ns, 'sentry boxes,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
