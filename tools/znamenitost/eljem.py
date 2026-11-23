"""El Jem: the Roman amphitheatre of the 3rd century, modelled in Blender (bpy) from its OSM outline and the game's ground under it
(tools/znamenitost/eljem-tla.mjs), written as assets/landmarks/eljem.glb (near) and eljem-far.glb (the far level, from 420 m).
The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/eljem-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/eljem.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: the ellipse fitted to the outline (its centre, axes and reach), 64 bays round it; the sandstone facade of three storeys of
arches, each bay's arch a dark opening under its round head with its jambs and soffit, a half-column on each pier, a projecting band
over each storey and the cornice on top, the stumps of the lost attic; on the west the breach (the facade down to one storey or to its
foot, broken piers and a heap of fallen blocks), the seats inside in three tiers down to the arena's wall and the sand of the arena.
No inscriptions, no statues.
The far level: the storeys as plain bands with their dark arches, the seats as slopes and the arena, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the amphitheatre's centre (x, z) (the game puts the
model there). Budget (docs/proge/eljem.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
PTS, (CX, CZ) = [tuple(p) for p in D['pts']], D['FC']
if PTS[0] == PTS[-1]: PTS = PTS[:-1]
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']

# the materials: the game's colours (js/world-eljem.js, the fallback amphitheatre)
MATS = [('stone', (0.84, 0.70, 0.50)), ('stone_top', (0.78, 0.66, 0.48)), ('dark', (0.30, 0.24, 0.18)), ('sand', (0.88, 0.78, 0.60)),
        ('worn', (0.74, 0.60, 0.43)), ('seat', (0.80, 0.69, 0.52))]
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



# ---- the ellipse: the outline's principal axes about the game's centre, its half-axes the outline's reach along them ----
sxx = sum((x - CX) ** 2 for x, z in PTS); szz = sum((z - CZ) ** 2 for x, z in PTS); sxz = sum((x - CX) * (z - CZ) for x, z in PTS)
ANG = 0.5 * math.atan2(2 * sxz, sxx - szz)
UX, UZ, VX, VZ = math.cos(ANG), math.sin(ANG), -math.sin(ANG), math.cos(ANG)
EA = max(abs((x - CX) * UX + (z - CZ) * UZ) for x, z in PTS)
EB = max(abs((x - CX) * VX + (z - CZ) * VZ) for x, z in PTS)
EA, EB = EA * 0.985, EB * 0.985             # (the outline's points are the facade's outer corners: the face a little inside them)
AA, AB = 0.44 * EA, 0.32 * EB               # (the arena: about 65 by 39 m in the real one)
Y0 = sum(ground(x, z) for x, z in PTS) / len(PTS)


def E(t, a, b):
    return (CX + UX * a * math.cos(t) + VX * b * math.sin(t), CZ + UZ * a * math.cos(t) + VZ * b * math.sin(t))


def En(t, a, b):
    nx, nz = UX * math.cos(t) / a + VX * math.sin(t) / b, UZ * math.cos(t) / a + VZ * math.sin(t) / b
    l = math.hypot(nx, nz); return nx / l, nz / l


def even_t(n):
    """n parameters round the outer ellipse at equal lengths of its rim (the bays of equal width)"""
    K = 4000; cum = [0.0]; prev = E(0, EA, EB)
    for k in range(1, K + 1):
        p = E(2 * math.pi * k / K, EA, EB); cum.append(cum[-1] + math.hypot(p[0] - prev[0], p[1] - prev[1])); prev = p
    out, j = [], 0
    for q in range(n):
        s = cum[-1] * q / n
        while cum[j + 1] < s: j += 1
        f = (s - cum[j]) / ((cum[j + 1] - cum[j]) or 1); out.append(2 * math.pi * (j + f) / K)
    return out


NB = 64
TS = even_t(NB)
T_WALL = 2.6                                 # (the facade's depth: the dark of the arches this far in)
PIER = 0.95                                  # (half a pier: from each bay's end to its arch)
STOREYS = [(0.0, 11.2, 0.0), (11.2, 21.6, 1.05), (21.6, 31.0, 0.95)]   # (bottom, top above Y0, the sill in the arches)
BAND, TOPC = 1.35, 0.8                       # (the band over each storey, the cornice on top)


def off(t, d):
    """the point at depth d inside the facade's face at the parameter t, and the face's outward normal there"""
    (x, z), (nx, nz) = E(t, EA, EB), En(t, EA, EB)
    return (x - nx * d, z - nz * d), (nx, nz)


def west(t):
    """how far a bay is into the breach on the west (the side towards -x): 0 out of it, 1 at its middle"""
    x, z = E(t, EA, EB); a = math.atan2(z - CZ, x - CX)
    d = abs((a - math.pi + math.pi) % (2 * math.pi) - math.pi)
    return max(0.0, 1 - d / 0.46)


def levels(t):
    w = west(t)
    return 0 if w > 0.62 else 1 if w > 0.32 else 2 if w > 0.0 else 3


UP, DOWN = (0, 1, 0), (0, -1, 0)


def bay(G, k, detail, rnd):
    t0, t1 = TS[k], TS[(k + 1) % NB]
    if t1 < t0: t1 += 2 * math.pi
    (p0, n0), (p1, n1) = off(t0, 0), off(t1, 0)
    (q0, _), (q1, _) = off(t0, T_WALL), off(t1, T_WALL)
    L = math.hypot(p1[0] - p0[0], p1[1] - p0[1]); nx, nz = (n0[0] + n1[0]) / 2, (n0[1] + n1[1]) / 2; l = math.hypot(nx, nz); nx, nz = nx / l, nz / l
    ux, uz = (p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L
    OUTW, INW = (nx, 0, nz), (-nx, 0, -nz)
    F = lambda a, y, e=0.0: (p0[0] + ux * a + nx * e, y, p0[1] + uz * a + nz * e)          # (on the face, a along the bay, e out of it)
    B = lambda a, y: (p0[0] + ux * a - nx * T_WALL, y, p0[1] + uz * a - nz * T_WALL)       # (at the back of the facade)
    foot = min(ground(*p0), ground(*p1)) - 1.6
    lv = levels((t0 + t1) / 2)
    a1, a2 = PIER, L - PIER; R = (a2 - a1) / 2; am = (a1 + a2) / 2
    seg = 8 if detail else 5
    top_y = foot
    for si, (yb, yt, sill) in enumerate(STOREYS[:lv]):
        yb = foot if si == 0 else Y0 + yb; yt = Y0 + yt
        ye = yt - BAND; ys = ye - 0.55 - R; yo = yb + sill if si else Y0 - 0.2
        arch = [(am - R * math.cos(math.pi * j / seg), ys + R * math.sin(math.pi * j / seg)) for j in range(seg + 1)]
        if detail:
            # the face: the two piers, under the sill, the spandrels round the arch's head
            G.quad([F(0, yb), F(a1, yb), F(a1, ye), F(0, ye)], 'stone', d=OUTW)
            G.quad([F(a2, yb), F(L, yb), F(L, ye), F(a2, ye)], 'stone', d=OUTW)
            if yo > yb + 0.05: G.quad([F(a1, yb), F(a2, yb), F(a2, yo), F(a1, yo)], 'stone', d=OUTW)
            for j in range(seg):
                (xa, ya), (xb, yb2) = arch[j], arch[j + 1]
                G.quad([F(xa, ya), F(xb, yb2), F(xb, ye), F(xa, ye)], 'stone', d=OUTW)
            # the arch's depth: the jambs, the soffit, the sill's top, and the dark of the gallery behind it
            G.quad([F(a1, yo), B(a1, yo), B(a1, ys), F(a1, ys)], 'worn', d=(ux, 0, uz))
            G.quad([F(a2, yo), F(a2, ys), B(a2, ys), B(a2, yo)], 'worn', d=(-ux, 0, -uz))
            for j in range(seg):
                (xa, ya), (xb, yb2) = arch[j], arch[j + 1]
                G.quad([F(xa, ya), B(xa, ya), B(xb, yb2), F(xb, yb2)], 'worn', ref=F(am, ys, -T_WALL / 2))
            if si: G.quad([F(a1, yo), F(a2, yo), B(a2, yo), B(a1, yo)], 'stone_top', d=UP)
            G.quad([B(a1, yo), B(a2, yo)] + [B(x, y) for x, y in reversed(arch)], 'dark', d=OUTW)
            # the half-column on the bay's first pier (the next bay puts the other), the band over the storey standing out
            aa, bb = -0.4, 0.4
            G.quad([F(aa, yb, 0.45), F(bb, yb, 0.45), F(bb, ye, 0.45), F(aa, ye, 0.45)], 'stone', d=OUTW)
            G.quad([F(aa, yb, 0), F(aa, yb, 0.45), F(aa, ye, 0.45), F(aa, ye, 0)], 'worn', d=(-ux, 0, -uz))
            G.quad([F(bb, yb, 0.45), F(bb, yb, 0), F(bb, ye, 0), F(bb, ye, 0.45)], 'worn', d=(ux, 0, uz))
            e = 0.55
            G.quad([F(0, ye, e), F(L, ye, e), F(L, yt, e), F(0, yt, e)], 'stone', d=OUTW)
            G.quad([F(0, ye, 0), F(L, ye, 0), F(L, ye, e), F(0, ye, e)], 'worn', d=DOWN)
            G.quad([F(0, yt, e), F(L, yt, e), F(L, yt, 0), F(0, yt, 0)], 'stone_top', d=UP)
        else:
            G.quad([F(0, yb), F(L, yb), F(L, yt), F(0, yt)], 'stone', d=OUTW)
            G.quad([F(a1, yo, 0.06), F(a2, yo, 0.06)] + [F(x, y, 0.06) for x, y in reversed(arch)], 'dark', d=OUTW)
        top_y = yt
    # the back of the facade (towards the seats) and its top
    if lv:
        G.quad([B(L, foot), B(0, foot), B(0, top_y), B(L, top_y)], 'stone', d=INW)
        if lv == 3 and detail:
            e = 0.35   # (the cornice on top, the stumps of the attic on some bays)
            G.quad([F(0, top_y, e), F(L, top_y, e), F(L, top_y + TOPC, e), F(0, top_y + TOPC, e)], 'stone', d=OUTW)
            G.quad([F(0, top_y, 0), F(L, top_y, 0), F(L, top_y, e), F(0, top_y, e)], 'worn', d=DOWN)
            top_y += TOPC
            G.quad([F(0, top_y, e), F(L, top_y, e), B(L, top_y), B(0, top_y)], 'stone_top', d=UP)
            if rnd.random() < 0.45:
                h = 1.0 + rnd.random() * 3.6; c = (F(L / 2, 0)[0] - nx * T_WALL / 2, F(L / 2, 0)[2] - nz * T_WALL / 2)
                G.box(c[0], top_y, c[1], L * (0.4 + rnd.random() * 0.6), h, T_WALL * 0.8, math.atan2(uz, ux), 'stone', 'stone_top')
        else:
            G.quad([F(0, top_y), F(L, top_y), B(L, top_y), B(0, top_y)], 'stone_top', d=UP)
            if lv == 3 and not detail:
                G.quad([B(L, top_y), B(0, top_y), B(0, top_y + TOPC), B(L, top_y + TOPC)], 'stone', d=INW)
                G.quad([F(0, top_y), F(L, top_y), F(L, top_y + TOPC), F(0, top_y + TOPC)], 'stone', d=OUTW)
                G.quad([F(0, top_y + TOPC), F(L, top_y + TOPC), B(L, top_y + TOPC), B(0, top_y + TOPC)], 'stone_top', d=UP)
    if lv < 3 and detail:
        # the breach: broken piers standing over the last whole storey (or the foot), and the fallen blocks before them
        base = top_y if lv else Y0
        for a in (PIER * 0.5, L - PIER * 0.5):
            h = (1.5 + rnd.random() * (6.0 if lv else 3.5)) * (1 - 0.5 * west((t0 + t1) / 2))
            c = F(a, 0, -T_WALL / 2)
            G.box(c[0], base - 0.2, c[2], PIER * 1.6, h, T_WALL, math.atan2(uz, ux), 'worn', 'stone_top')
        if lv <= 1:
            for q in range(3):
                c = F(rnd.random() * L, 0, 1.5 + rnd.random() * 6)
                s = 0.9 + rnd.random() * 1.4
                G.box(c[0], ground(c[0], c[2]) - 0.3, c[2], s * 1.4, s * 0.8, s, rnd.random() * math.pi, 'worn', 'stone_top')
    return lv


# ---- the seats: three tiers from the facade's back down to the arena's wall, each of rows of steps; the arena's wall and its sand ----
TIERS = [(0.0, 0.34, 21.0, 15.0), (0.37, 0.68, 14.2, 8.6), (0.71, 1.0, 7.8, 3.6)]   # (from, to across the ring; top, bottom above Y0)


def ring(f, t):
    """the point a fraction f across the ring from the facade's back (0) to the arena's rim (1), at the parameter t"""
    (bx, bz), _ = off(t, T_WALL); ax, az = E(t, AA, AB)
    return bx + (ax - bx) * f, bz + (az - bz) * f


def seats(G, detail):
    n = NB if detail else NB // 2
    ts = TS if detail else TS[::2]
    for k in range(n):
        t0, t1 = ts[k], ts[(k + 1) % n]
        if t1 < t0: t1 += 2 * math.pi
        lv = levels((t0 + t1) / 2)
        cx, cz = E((t0 + t1) / 2, AA * 0.2, AB * 0.2)
        ref_in = (cx, Y0 + 40, cz)
        for ti, (f0, f1, y0, y1) in enumerate(TIERS):
            if lv <= 1 and ti == 0: continue               # (the breach: the top tier gone with the facade)
            if lv == 0 and ti == 1: y0, y1 = y0 - 6.0, y1 - 4.0
            rows = 7 if detail else 1
            for r in range(rows):
                fa, fb = f0 + (f1 - f0) * r / rows, f0 + (f1 - f0) * (r + 1) / rows
                ya, yb = y0 + (y1 - y0) * r / rows, y0 + (y1 - y0) * (r + 1) / rows
                A0, A1, B0, B1 = ring(fa, t0), ring(fa, t1), ring(fb, t0), ring(fb, t1)
                if detail:
                    G.quad([(A0[0], Y0 + ya, A0[1]), (A1[0], Y0 + ya, A1[1]), (B1[0], Y0 + ya, B1[1]), (B0[0], Y0 + ya, B0[1])],
                           'seat' if (r + ti) % 2 else 'stone_top', d=UP)
                    G.quad([(B0[0], Y0 + ya, B0[1]), (B1[0], Y0 + ya, B1[1]), (B1[0], Y0 + yb, B1[1]), (B0[0], Y0 + yb, B0[1])], 'worn', ref=(A0[0], Y0 + ya + 9, A0[1]))
                else:
                    G.quad([(A0[0], Y0 + ya, A0[1]), (A1[0], Y0 + ya, A1[1]), (B1[0], Y0 + yb, B1[1]), (B0[0], Y0 + yb, B0[1])], 'seat', d=UP)
            # the walkway between two tiers, and the wall down to the next one
            if ti < 2:
                fa, fb = f1, TIERS[ti + 1][0]; ny = TIERS[ti + 1][2]
                A0, A1, B0, B1 = ring(fa, t0), ring(fa, t1), ring(fb, t0), ring(fb, t1)
                yy = Y0 + y1
                if lv == 0 and ti == 1: yy -= 4.0
                G.quad([(A0[0], yy, A0[1]), (A1[0], yy, A1[1]), (B1[0], yy, B1[1]), (B0[0], yy, B0[1])], 'stone_top', d=UP)
                nyy = Y0 + ny - (6.0 if lv == 0 and ti == 0 else 0)
                if nyy < yy: G.quad([(B0[0], yy, B0[1]), (B1[0], yy, B1[1]), (B1[0], nyy, B1[1]), (B0[0], nyy, B0[1])], 'worn', ref=(A0[0], yy + 9, A0[1]))
        # the top tier's upper edge meets the facade's back; where the top tier is gone, the vaults' rubble slope instead
        if lv <= 1:
            A0, A1 = ring(0.0, t0), ring(0.0, t1); B0, B1 = ring(TIERS[1][0], t0), ring(TIERS[1][0], t1)
            ya = Y0 + (2.0 if lv == 0 else 11.2); yb = Y0 + TIERS[1][2] - (6.0 if lv == 0 else 0)
            G.quad([(A0[0], ya, A0[1]), (A1[0], ya, A1[1]), (B1[0], yb, B1[1]), (B0[0], yb, B0[1])], 'worn', d=UP)
        # the arena's wall
        A0, A1 = ring(1.0, t0), ring(1.0, t1); yw = Y0 + TIERS[2][3]
        G.quad([(A0[0], yw, A0[1]), (A1[0], yw, A1[1]), (A1[0], Y0, A1[1]), (A0[0], Y0, A0[1])], 'stone', ref=(A0[0] * 2 - cx, Y0, A0[1] * 2 - cz))
    # the arena's sand
    m = 48 if detail else 24
    G.quad([(lambda p: (p[0], Y0 + 0.05, p[1]))(E(2 * math.pi * q / m, AA, AB)) for q in range(m)], 'sand', d=UP)


def build(detail):
    G = Mesh(); rnd = random.Random(2895)
    lvs = [bay(G, k, detail, rnd) for k in range(NB)]
    seats(G, detail)
    return G, sum(1 for v in lvs if v < 3)


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the amphitheatre's centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
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
for detail, fn in ((True, 'eljem.glb'), (False, 'eljem-far.glb')):
    G, nbr = build(detail)
    ob = to_blender(G, 'eljem' if detail else 'eljem_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', nbr, 'bays broken,', os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
