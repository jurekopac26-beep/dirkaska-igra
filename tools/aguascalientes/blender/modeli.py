"""Aguascalientes, Mehika: the oval's two towers and its curved grandstands, modelled in Blender (bpy) and exported as compact arrays into
js/world-aguascalientes.js (between the markers AG_MODELI). Run:  python tools/aguascalientes/blender/modeli.py [--render out.png]
(python with the bpy module: pip install bpy). No names, logos or texts anywhere: the screens and the panels are plain colours.

The frame of every model: X along the track (metres), Y away from the track (from the stand's front line, from a tower's foot), Z up from
the track's height. The grandstands are modules of one 5 m bay (open at both ends) that World bends along the track (js/world-aguascalientes.js:
each vertex at s0 + X, offset front + Y); the caps close the ends. The towers are rigid (placed with the track's heading).

What the photos show (the oval's aerial photo from the south-west, the TV pictures; the web has no drawings of them):
 - the main grandstand outside the front straight, curving with it round the end of Turn 4 to past the start: a lower deck of 18 rows, a
   walkway, an upper deck of 20 steeper rows, on top the suites (a band of dark glass, white frames, a white roof sticking out over the top
   rows); its south end (towards Turn 4) without the suites
 - a small open steel stand outside Turn 4 (12 rows of aluminium planks on a frame, open below)
 - tower A in the infield, inside Turn 3: a slim dark pylon on two legs, two columns of lit panels (red and white, the running order) on
   its broad faces, a box head with screens on four faces
 - tower B outside the start of the front straight: a taller dark pylon with a strip of panels, a triangular head with screens on three
   faces, and a lattice gantry reaching over the track towards the infield (the start lights' and the cameras' bridge, 9 m clear)
"""
import base64, math, os, sys, json
import bpy, bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
JS = os.path.join(ROOT, 'js', 'world-aguascalientes.js')

# the palette (linear-ish vertex colours as the game's other buildings use them)
PAL = [
    [0.78, 0.78, 0.76],   # 0 concrete
    [0.6, 0.6, 0.58],     # 1 concrete in shade (risers, back ribs)
    [0.66, 0.67, 0.69],   # 2 the treads (grey seats under the crowd)
    [0.93, 0.93, 0.91],   # 3 white (frames, the suites' band, the aisles)
    [0.1, 0.13, 0.17],    # 4 dark glass
    [0.15, 0.16, 0.18],   # 5 the towers' dark steel
    [0.78, 0.12, 0.12],   # 6 red panel
    [0.95, 0.95, 0.92],   # 7 white panel (lit)
    [0.06, 0.07, 0.08],   # 8 screen frame, dark
    [0.05, 0.42, 0.29],   # 9 green trim
    [0.42, 0.44, 0.47],   # 10 the gantry's steel
    [0.86, 0.87, 0.88],   # 11 roof
    [0.76, 0.78, 0.8],    # 12 aluminium planks
    [0.32, 0.33, 0.35],   # 13 the bleachers' frame
    [0.5, 0.62, 0.72],    # 14 screen (lit, pale blue-grey: no picture)
]

def new_obj(name):
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new(); return ob, bm

def ear_clip(poly):
    """Triangles of a simple polygon [(y, z) ...], each counter-clockwise in (y, z); collinear points dropped."""
    P = list(poly)
    if sum(P[k][0] * P[(k + 1) % len(P)][1] - P[(k + 1) % len(P)][0] * P[k][1] for k in range(len(P))) < 0: P.reverse()
    cr = lambda a, b, c: (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    out = []; guard = 0
    while len(P) > 3 and guard < 100000:
        guard += 1; n = len(P); found = False
        for k in range(n):
            a, b, c = P[k - 1], P[k], P[(k + 1) % n]
            if abs(cr(a, b, c)) < 1e-9: P.pop(k); found = True; break   # (collinear)
            if cr(a, b, c) < 0: continue
            if any(cr(a, b, q) >= -1e-12 and cr(b, c, q) >= -1e-12 and cr(c, a, q) >= -1e-12 for q in P if q not in (a, b, c)): continue
            out.append((a, b, c)); P.pop(k); found = True; break
        if not found: raise RuntimeError('ear_clip: no ear')
    if len(P) == 3 and abs(cr(*P)) > 1e-9: out.append(tuple(P))
    return out

class Part:
    """A bmesh with a colour per face."""
    def __init__(self, name): self.ob, self.bm = new_obj(name); self.lay = self.bm.faces.layers.int.new('col')
    def face(self, pts, col):
        vs = [self.bm.verts.new(p) for p in pts]; f = self.bm.faces.new(vs); f[self.lay] = col; return f
    def box(self, x0, x1, y0, y1, z0, z1, col, sides=None, skip=()):   # an axis-aligned box; sides: {'+x': col, ...}; skip: faces left out
        c = lambda k: (sides or {}).get(k, col)
        P = lambda x, y, z: (x, y, z)
        F = {'-z': [P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)], '+z': [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
             '-y': [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], '+y': [P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)],
             '-x': [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], '+x': [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]}
        for k, pts in F.items():
            if k not in skip: self.face(pts, c(k))
    def beam(self, a, b, r, col):   # a square member from a to b (a lattice bar), no end faces
        ax = [b[i] - a[i] for i in range(3)]; L = math.sqrt(sum(v * v for v in ax)); ax = [v / L for v in ax]
        up = (0, 0, 1) if abs(ax[2]) < 0.9 else (1, 0, 0)
        u = [ax[1] * up[2] - ax[2] * up[1], ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0]]; ul = math.sqrt(sum(v * v for v in u)); u = [v / ul * r for v in u]
        w = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]]
        cs = [[u[i] * sx + w[i] * sy for i in range(3)] for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
        for k in range(4):
            c0, c1 = cs[k], cs[(k + 1) % 4]
            self.face([[a[i] + c0[i] for i in range(3)], [a[i] + c1[i] for i in range(3)], [b[i] + c1[i] for i in range(3)], [b[i] + c0[i] for i in range(3)]], col)
    def extrude(self, prof, cols, x0, x1):   # a profile [(y, z) ...] (counter-clockwise seen from +x) swept from x0 to x1, no end faces
        n = len(prof)
        for k in range(n - 1):
            (ya, za), (yb, zb) = prof[k], prof[k + 1]
            self.face([(x1, ya, za), (x1, yb, zb), (x0, yb, zb), (x0, ya, za)], cols[k])   # (the face's front is to the profile's left: its outside)
    def cap(self, prof, col, x):   # the profile's polygon at x, facing -x
        for t in ear_clip(prof[:-1]): self.face([(x, y, z) for (y, z) in reversed(t)], col)   # (bmesh's own triangulation trips on the stairs)
    def done(self):
        bmesh.ops.triangulate(self.bm, faces=self.bm.faces[:], ngon_method='EAR_CLIP')
        self.bm.to_mesh(self.ob.data); return self
    def export(self, q=0.02):
        bm = self.bm; bm.verts.ensure_lookup_table(); lay = self.lay
        V = []; I = []; C = []; vid = {}
        for f in bm.faces:
            tri = []
            for v in f.verts:
                key = tuple(int(round(c / q)) for c in v.co)
                if key not in vid: vid[key] = len(V) // 3; V.extend(key)
                tri.append(vid[key])
            I.extend(tri); C.append(f[lay])
        assert len(V) // 3 < 65536 and max(abs(v) for v in V) < 32767
        b64 = lambda arr, fmt: base64.b64encode(__import__('array').array(fmt, arr).tobytes()).decode()
        return {'v': b64(V, 'h'), 'i': b64(I, 'H'), 'c': b64(C, 'B'), 'nt': len(C)}

def profile_main(suites):
    """The main stand's section: (y, z) counter-clockwise seen from +x (y out from the front line, z up), its colours per edge, the rows'
    treads [y0, y1, z] for the crowd. The front wall 3.2 m, 18 rows of the lower deck (0.85 m deep, 0.45 up), the walkway, 20 rows of the
    upper deck (0.5 up), the top; with the suites the back wall at 40.5 m (the suites' box behind the top rows), without them at 35 m."""
    P = [(0.0, -1.5), (0.0, 3.2), (0.4, 3.2), (0.4, 2.3)]; Cc = [9, 0, 1]   # (the front wall: the track's face with a green band, below)
    rows = []; y = 0.4; z = 2.3
    for k in range(18):
        P += [(y + 0.85, z)]; Cc += [2]; rows.append([y, y + 0.85, z]); y += 0.85
        if k < 17: z += 0.45; P += [(y, z)]; Cc += [1]
    P += [(y, z + 0.45), (y + 1.8, z + 0.45), (y + 1.8, z + 1.5)]; Cc += [1, 0, 1]; y += 1.8; z += 1.5   # the walkway, the riser of the upper deck
    for k in range(20):
        P += [(y + 0.85, z)]; Cc += [2]; rows.append([y, y + 0.85, z]); y += 0.85
        if k < 19: z += 0.5; P += [(y, z)]; Cc += [1]
    top = z
    if suites: P += [(y, top + 0.9), (40.5, top + 0.9), (40.5, -1.5), (0.0, -1.5)]; Cc += [1, 0, 0, 0]
    else: P += [(y, top + 1.2), (y + 0.5, top + 1.2), (y + 0.5, -1.5), (0.0, -1.5)]; Cc += [1, 3, 0, 0]
    return P, Cc, rows, y, top

def stand_bay(name, suites):
    pt = Part(name); P, Cc, rows, yb, top = profile_main(suites)
    # the profile's edges: the first one is (0,-1.5)->(0,3.2), the front wall's face: a green band at the bottom, white above
    pt.extrude([(0.0, -1.5), (0.0, 0.9)], [9], 0, 5); pt.extrude([(0.0, 0.9), (0.0, 3.2)], [3], 0, 5)
    pt.extrude(P[1:], Cc[1:], 0, 5)
    if suites:   # the suites: their front of dark glass between white bands, white mullions, the roof sticking out
        z0 = top + 0.9; y0 = yb
        pt.extrude([(y0, z0), (y0, z0 + 0.7)], [3], 0, 5); pt.extrude([(y0, z0 + 0.7), (y0, z0 + 4.6)], [4], 0, 5); pt.extrude([(y0, z0 + 4.6), (y0, z0 + 6.4)], [3], 0, 5)
        for xm in (0.0, 2.5): pt.box(xm, xm + 0.22, y0 - 0.16, y0, z0 + 0.7, z0 + 4.6, 3, skip=('+y', '-z', '+z'))
        r0 = z0 + 6.4; pt.extrude([(y0 - 2.2, r0 + 0.55), (40.9, r0 + 0.55), (40.9, r0), (y0 - 2.2, r0), (y0 - 2.2, r0 + 0.55)], [11, 11, 11, 3], 0, 5)
        pt.extrude([(40.5, r0), (40.5, z0)], [0], 0, 5)   # (the suites' back, above the stand's back wall)
        pt.box(0.0, 0.7, 40.5, 41.3, -1.5, r0, 1, skip=('-y',))   # a rib of the back wall
    else:
        pt.box(0.0, 0.7, yb + 0.5, yb + 1.3, -1.5, top + 1.0, 1, skip=('-y',))
    return pt.done(), rows, top

def stand_caps(name, suites):   # the stand's end at x = 0 (facing -x; World mirrors it for the other end)
    pt = Part(name); P, Cc, rows, yb, top = profile_main(suites)
    pt.cap(P, 0, 0.0)   # (P ends where it starts)
    if suites:
        z0 = top + 0.9; r0 = z0 + 6.4
        pt.face([(0, yb, z0), (0, yb, r0), (0, 40.5, r0), (0, 40.5, z0)], 3)   # the suites' end, white
        pt.face([(0, yb - 2.2, r0), (0, yb - 2.2, r0 + 0.55), (0, 40.9, r0 + 0.55), (0, 40.9, r0)], 3)
    return pt.done()

def stand_aisle(name):   # the aisle's stairs: a white strip up the treads and risers (World puts one every fourth bay, the crowd round it)
    pt = Part(name); P, Cc, rows, yb, top = profile_main(False)
    for (y0, y1, z) in rows:
        pt.face([(2.1, y0, z + 0.02), (2.9, y0, z + 0.02), (2.9, y1, z + 0.02), (2.1, y1, z + 0.02)], 3)
    return pt.done()

def bleacher(name):   # the small open stand: 12 rows of aluminium planks (0.8 m, 0.4 up) on a steel frame, open below
    pt = Part(name); rows = []
    for k in range(12):
        y0 = 0.6 + k * 0.8; z = 0.9 + k * 0.4
        pt.box(0, 5, y0, y0 + 0.8, z - 0.06, z, 12, skip=('-x', '+x')); rows.append([y0, y0 + 0.8, z])
        pt.box(0, 5, y0 + 0.62, y0 + 0.8, z - 0.4, z - 0.06, 13, skip=('-x', '+x', '+z', '-z'))   # (the riser's toe board)
    pt.box(0, 5, 0, 0.6, -0.5, 1.0, 13, skip=('-x', '+x'))   # (the front step)
    for xm in (0.2, 4.8):   # the frame: a stringer under the rows, posts at the front and the back
        pt.beam((xm, 0.5, 0.3), (xm, 10.2, 5.0), 0.08, 13)
        pt.beam((xm, 10.4, -0.5), (xm, 10.4, 6.2), 0.07, 13); pt.beam((xm, 5.4, -0.5), (xm, 5.4, 2.8), 0.06, 13)
    pt.box(0, 5, 10.35, 10.45, 5.6, 6.3, 13, skip=('-x', '+x', '-z'))   # (the back rail)
    return pt.done(), rows

def bleacher_cap(name):   # its end: a rail up the side
    pt = Part(name); pt.beam((0.0, 0.6, 1.9), (0.0, 10.2, 6.0), 0.05, 13); return pt.done()

def screens(pt, corners, z0, z1, frame=0.18):   # screens on the faces of a convex head: corners (x, y) counter-clockwise from above
    n = len(corners)
    for k in range(n):
        (xa, ya), (xb, yb) = corners[k], corners[(k + 1) % n]; L = math.hypot(xb - xa, yb - ya); tx, ty = (xb - xa) / L, (yb - ya) / L; nx, ny = ty, -tx
        e = 0.03; a = (xa + tx * frame + nx * e, ya + ty * frame + ny * e); b = (xb - tx * frame + nx * e, yb - ty * frame + ny * e)
        pt.face([(a[0], a[1], z0 + frame), (b[0], b[1], z0 + frame), (b[0], b[1], z1 - frame), (a[0], a[1], z1 - frame)], 14)

def prism(pt, corners, z0, z1, col, top=None, bottom=True):
    n = len(corners)
    for k in range(n):
        (xa, ya), (xb, yb) = corners[k], corners[(k + 1) % n]
        pt.face([(xa, ya, z0), (xb, yb, z0), (xb, yb, z1), (xa, ya, z1)], col)
    pt.face([(x, y, z1) for (x, y) in corners], top if top is not None else col)
    if bottom: pt.face([(x, y, z0) for (x, y) in reversed(corners)], col)

def panels(pt, x0, x1, yf, z0, z1, n, sgn, cols=(6, 7)):   # a column of lit panels on a face at y = yf (facing sgn*y)
    h = (z1 - z0) / n
    for k in range(n):
        za = z0 + k * h + 0.08; zb = za + h - 0.16; y = yf + sgn * 0.03; c = cols[k % len(cols)]
        q = [(x0, y, za), (x1, y, za), (x1, y, zb), (x0, y, zb)]
        pt.face(q if sgn < 0 else list(reversed(q)), c)

def tower_a(name):   # the infield pylon: two dark legs, the panels between them on both broad faces, a box head with screens
    pt = Part(name)
    pt.box(-3.2, 3.2, -2.2, 2.2, -1.5, 0.25, 0)   # the concrete pad
    for xl in (-1.75, 1.0): pt.box(xl, xl + 0.75, -0.45, 0.45, 0.25, 16.6, 5, skip=('-z',))
    pt.box(-1.0, 1.0, -0.3, 0.3, 1.6, 16.6, 5, skip=('-z', '+z'))   # (the board between them)
    for sgn in (-1, 1): panels(pt, -0.9, -0.08, sgn * 0.3, 2.0, 16.2, 16, sgn); panels(pt, 0.08, 0.9, sgn * 0.3, 2.0, 16.2, 16, sgn, (7, 6))
    hc = [(-2.0, -1.5), (2.0, -1.5), (2.0, 1.5), (-2.0, 1.5)]
    prism(pt, hc, 16.6, 18.9, 8); screens(pt, hc, 16.6, 18.9)
    prism(pt, [(-2.15, -1.65), (2.15, -1.65), (2.15, 1.65), (-2.15, 1.65)], 18.9, 19.15, 5, 11)
    return pt.done()

def tower_b(name, reach, post):
    """The pylon outside the front straight (its foot at Y = 0, the track towards -Y): a dark shaft with a strip of panels on the track's
    face, a triangular head with screens on three faces, the lattice gantry from its side over the track (reach: metres towards -Y, its
    bottom chord 12 m up), a thin post under it at Y = -post (on the pit wall's line)."""
    pt = Part(name)
    pt.box(-2.0, 2.0, -2.0, 2.0, -1.5, 0.25, 0)
    pt.box(-0.8, 0.8, -0.8, 0.8, 0.25, 19.0, 5, skip=('-z',))
    for sgn in (-1, 1): panels(pt, -0.55, 0.55, sgn * 0.8, 3.0, 18.2, 14, sgn)
    r = 2.7; tri = [(r * math.cos(a), r * math.sin(a)) for a in (math.radians(-90), math.radians(30), math.radians(150))]
    prism(pt, tri, 19.0, 23.6, 8); screens(pt, tri, 19.0, 23.6, 0.22)
    prism(pt, [(x * 1.06, y * 1.06) for x, y in tri], 23.6, 23.9, 5, 11)
    # the gantry: four chords, verticals and diagonals every 2.2 m, a dark board along its track face
    zb, zt, hw = 12.0, 14.2, 0.65; n = max(2, int(round(reach / 2.2))); dy = reach / n
    for xs in (-hw, hw):
        for zz in (zb, zt): pt.beam((xs, -0.8, zz), (xs, -reach, zz), 0.1, 10)
        for k in range(n + 1):
            y = -0.8 - (reach - 0.8) * k / n
            pt.beam((xs, y, zb), (xs, y, zt), 0.06, 10)
            if k < n: y2 = -0.8 - (reach - 0.8) * (k + 1) / n; pt.beam((xs, y, zb) if k % 2 else (xs, y, zt), (xs, y2, zt) if k % 2 else (xs, y2, zb), 0.05, 10)
    for k in range(n + 1):
        y = -0.8 - (reach - 0.8) * k / n
        pt.beam((-hw, y, zt), (hw, y, zt), 0.05, 10); pt.beam((-hw, y, zb), (hw, y, zb), 0.05, 10)
    pt.box(-hw - 0.08, -hw - 0.02, -reach + 0.5, -2.0, zb + 0.35, zt - 0.35, 8, skip=('+x',))   # (the board: plain, no text)
    pt.box(hw + 0.02, hw + 0.08, -reach + 0.5, -2.0, zb + 0.35, zt - 0.35, 8, skip=('-x',))
    pt.box(-0.25, 0.25, -post - 0.25, -post + 0.25, -1.0, zb - 0.1, 10, skip=('-z',))   # the post under it
    return pt.done()

def main():
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob)
    bay, rows, top = stand_bay('ag_bay', True); low, _, topL = stand_bay('ag_bay_low', False)
    cap = stand_caps('ag_cap', True); capL = stand_caps('ag_cap_low', False); aisle = stand_aisle('ag_aisle')
    ble, brows = bleacher('ag_ble'); bcap = bleacher_cap('ag_ble_cap')
    ta = tower_a('ag_tower_a'); tb = tower_b('ag_tower_b', 44.5, 21.0)
    parts = {'bay': bay, 'low': low, 'cap': cap, 'capLow': capL, 'aisle': aisle, 'ble': ble, 'bleCap': bcap, 'towerA': ta, 'towerB': tb}
    data = {k: p.export() for k, p in parts.items()}
    data['pal'] = PAL; data['rows'] = [[round(a, 2) for a in r] for r in rows]; data['bleRows'] = [[round(a, 2) for a in r] for r in brows]; data['q'] = 0.02
    nt = sum(d['nt'] for d in data.values() if isinstance(d, dict) and 'nt' in d)
    body = 'AG_MOD = ' + json.dumps(data, separators=(',', ':')) + ';'
    src = open(JS, encoding='utf-8').read(); a = src.index('/* AG_MODELI */'); b = src.index('/* /AG_MODELI */')
    src = src[:a] + '/* AG_MODELI */ const ' + body + ' ' + src[b:]
    open(JS, 'w', encoding='utf-8').write(src)
    print('models:', {k: d['nt'] for k, d in data.items() if isinstance(d, dict) and 'nt' in d}, 'triangles', nt, 'bytes', len(body))
    if '--render' in sys.argv: render(sys.argv[sys.argv.index('--render') + 1], parts)

def render(path, parts):   # a look at the models (Cycles on the CPU): the bays in a row, the towers beside them
    import mathutils
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = 1100, 620
    mats = []
    for k, c in enumerate(PAL):
        m = bpy.data.materials.new('c%d' % k); m.use_nodes = True; bsdf = m.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (*c, 1); mats.append(m)
    def put(p, loc, rot=0):
        ob = p.ob; me = ob.data
        for m in mats: me.materials.append(m)
        p.bm.faces.ensure_lookup_table()
        for f, poly in zip(p.bm.faces, me.polygons): poly.material_index = f[p.lay]
        ob.location = loc; ob.rotation_euler = (0, 0, rot)
    put(parts['bay'], (0, 0, 0)); put(parts['cap'], (0, 0, 0)); put(parts['low'], (-5, 0, 0)); put(parts['aisle'], (-5, 0, 0)); put(parts['capLow'], (-5, 0, 0))
    put(parts['towerA'], (-22, -20, 0)); put(parts['towerB'], (18, -6, 0)); put(parts['ble'], (-40, 10, 0)); put(parts['bleCap'], (-40, 10, 0))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (-55, -95, 45); cam.rotation_euler = mathutils.Euler((math.radians(66), 0, math.radians(-28)))
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun); sun.rotation_euler = (math.radians(40), math.radians(20), math.radians(-30)); sun.data.energy = 3.5
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.62, 0.72, 1)
    gp = bpy.data.objects.new('ground', bpy.data.meshes.new('g')); sc.collection.objects.link(gp); bmg = bmesh.new(); bmesh.ops.create_grid(bmg, x_segments=1, y_segments=1, size=120); bmg.to_mesh(gp.data)
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

if __name__ == '__main__': main()
