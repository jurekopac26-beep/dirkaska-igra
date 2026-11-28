"""Hiva: the walls of the old town (Itchan Kala) with their round towers and four gates, and the two minarets inside, modelled in Blender
(bpy) from OpenStreetMap (tools/hiva/obzidje.py -> js/data/hiva.js) and the game's ground under them (tools/znamenitost/hiva-tla.mjs),
written as assets/landmarks/hiva.glb (near) and hiva-far.glb (the far level, from 420 m).
The game reads both with js/znamenitost.js (one draw call each, the materials' base colours as the vertex colours, no textures).

  node tools/znamenitost/hiva-tla.mjs /tmp/tla.json
  python -I tools/znamenitost/hiva.py /tmp/tla.json        (python with bpy: pip install bpy)

The model: the mud-brick walls along OSM's outlines of their footprints (battered: the tops drawn in from the feet, the feet below the
ground), the rounded merlons on their outer edges, the round battered towers at OSM's defensive towers with a ring of merlons, the gates as
blocks in their footprints (their smallest bounding rectangles) with merlons round the top, two flanking towers and a portal with a pointed
arch on the outer face, a pointed arch on the inner one, and the two minarets after OSM's nodes (as js/world-hiva.js): the short wide one
banded in turquoise, blue and white tiles with its flat unfinished top, the tall slender one in brick with bands of tiles, its lantern of
arches and a small tiled dome. No inscriptions, no flags, no statues.
The far level: the walls, the towers, the gates' blocks and the minarets, nothing smaller.
Coordinates: the game's (x, y, z) with y up and metres above the sea, relative to the walls' centre (x, z) (the game puts the model there).
Budget (docs/proge/hiva.md): <= 8 materials, <= 60k vertices; the far level well under the near one."""
import sys, os, json, math
import bpy, bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'landmarks')
D = json.load(open(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]))
CX, CZ = D['FC']
X0, Z0, ST, NX, NZ, H = D['x0'], D['z0'], D['st'], D['nx'], D['nz'], D['h']
# the two minarets (OSM nodes, the track's frame, as MINARETS in js/world-hiva.js): x, z, height, base radius, kind
MINARETS = [(153.6, -109.7, 29.0, 7.0, 'short'), (332.6, 84.3, 45.0, 4.8, 'tall')]

# the materials: the game's colours (js/world-hiva.js, the fallback walls and minarets)
MATS = [('mud', (0.80, 0.66, 0.48)), ('mud_top', (0.86, 0.73, 0.55)), ('mud_dark', (0.70, 0.56, 0.40)), ('dark', (0.18, 0.14, 0.11)),
        ('turquoise', (0.24, 0.60, 0.58)), ('blue', (0.20, 0.42, 0.66)), ('white', (0.90, 0.88, 0.80)), ('brick', (0.66, 0.50, 0.35))]
M = {n: k for k, (n, _) in enumerate(MATS)}


def ground(x, z):
    fx, fz = (x - X0) / ST, (z - Z0) / ST
    i, j = max(0, min(NX - 2, int(math.floor(fx)))), max(0, min(NZ - 2, int(math.floor(fz))))
    u, v = max(0.0, min(1.0, fx - i)), max(0.0, min(1.0, fz - j))
    h = lambda a, b: H[b * NX + a]
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v


def ground_s(x, z, r=6.0):
    """the ground smoothed over r (the walls' tops follow it, not each bump under one foot)"""
    return sum(ground(x + dx * r, z + dz * r) for dx, dz in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7))) / 9


def gmin(pts, r=0.0):
    return min(ground(x + dx, z + dz) for (x, z) in pts for dx, dz in ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r)))


def inside(P, x, z):
    c, n = False, len(P)
    for k in range(n):
        (ax, az), (bx, bz) = P[k], P[(k + 1) % n]
        if (az > z) != (bz > z) and x < ax + (z - az) * (bx - ax) / (bz - az): c = not c
    return c


def shrink(P, d):
    """the polygon P moved inwards by d along each corner's mitre (small d; either winding)"""
    out, n = [], len(P)
    for k in range(n):
        (px, pz), (x, z), (qx, qz) = P[k - 1], P[k], P[(k + 1) % n]
        e1 = (x - px, z - pz); e2 = (qx - x, qz - z)
        l1, l2 = math.hypot(*e1) or 1.0, math.hypot(*e2) or 1.0
        n1 = (-e1[1] / l1, e1[0] / l1); n2 = (-e2[1] / l2, e2[0] / l2)
        mx, mz = n1[0] + n2[0], n1[1] + n2[1]; ml = math.hypot(mx, mz) or 1.0
        cs = max(0.3, (mx * n1[0] + mz * n1[1]) / ml)
        out.append((x - mx / ml * d / cs, z - mz / ml * d / cs))
    area = lambda Q: abs(sum(Q[k - 1][0] * Q[k][1] - Q[k][0] * Q[k - 1][1] for k in range(len(Q))))
    return out if area(out) < area(P) else shrink(P, -d) if d > 0 else out


class Mesh:
    """vertices in the game's frame (x, y up, z); faces as vertex lists with a material"""
    def __init__(s): s.v, s.f, s.m = [], [], []

    def quad(s, ps, mat, ref=None, d=None):
        """a face facing away from the point ref, or along the direction d (its winding turned so: the game draws the front faces only)"""
        nx = ny = nz = 0.0
        for k in range(len(ps)):
            (ax, ay, az), (bx, by, bz) = ps[k], ps[(k + 1) % len(ps)]
            nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by)
        cx, cy, cz = (sum(p[i] for p in ps) / len(ps) for i in range(3))
        dx, dy, dz = d if d else (cx - ref[0], cy - ref[1], cz - ref[2])
        if nx * dx + ny * dy + nz * dz < 0: ps = ps[::-1]
        b = len(s.v); s.v.extend(ps); s.f.append(tuple(range(b, b + len(ps)))); s.m.append(M[mat])

    def box(s, x, y, z, lx, ly, lz, ang, mat, top=None):
        """a box lx (along ang) by lz (across), from y to y+ly (no bottom)"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, h: (x + c * a - sn * b, y + h, z + sn * a + c * b)
        a, b = lx / 2, lz / 2
        q = [P(-a, -b, 0), P(a, -b, 0), P(a, b, 0), P(-a, b, 0)]
        t = [P(-a, -b, ly), P(a, -b, ly), P(a, b, ly), P(-a, b, ly)]
        o = (x, y + ly / 2, z)
        for k in range(4): s.quad([q[k], q[(k + 1) % 4], t[(k + 1) % 4], t[k]], mat, o)
        s.quad(t, top or mat, o)

    def merlon(s, x, y, z, w, dep, h, ang, mat):
        """a merlon with a pointed top (the rounded mud-brick merlons of Khiva, simplified): w along ang, dep across, h to the point"""
        c, sn = math.cos(ang), math.sin(ang)
        P = lambda a, b, hh: (x + c * a - sn * b, y + hh, z + sn * a + c * b)
        a, b, hs = w / 2, dep / 2, h * 0.62
        prof = lambda bb: [P(-a, bb, 0), P(a, bb, 0), P(a, bb, hs), P(0, bb, h), P(-a, bb, hs)]
        f, k = prof(-b), prof(b)
        o = (x, y + hs / 2, z)
        s.quad(f, mat, o); s.quad(k, mat, o)
        for i in (1, 2, 3, 4): s.quad([f[i], k[i], k[(i + 1) % 5], f[(i + 1) % 5]], mat, o)

    def frustum(s, x, y, z, r0, r1, h, n, mat, cap=None, a0=0.0):
        ring = lambda r, yy: [(x + r * math.cos(a0 + 2 * math.pi * k / n), yy, z + r * math.sin(a0 + 2 * math.pi * k / n)) for k in range(n)]
        lo, hi = ring(r0, y), ring(r1, y + h)
        for k in range(n): s.quad([lo[k], lo[(k + 1) % n], hi[(k + 1) % n], hi[k]], mat, (x, y + h / 2, z))
        if cap: s.quad(hi, cap, d=(0, 1, 0))

    def dome(s, x, y, z, r, h, n, rows, mat):
        prev = [(x + r * math.cos(2 * math.pi * k / n), y, z + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
        for j in range(1, rows + 1):
            t = j / rows; rr, yy = r * math.cos(t * math.pi / 2), y + h * math.sin(t * math.pi / 2)
            cur = [(x + rr * math.cos(2 * math.pi * k / n), yy, z + rr * math.sin(2 * math.pi * k / n)) for k in range(n)]
            for k in range(n):
                if j == rows: s.quad([prev[k], (x, y + h, z), prev[(k + 1) % n]], mat, (x, y, z))
                else: s.quad([prev[k], cur[k], cur[(k + 1) % n], prev[(k + 1) % n]], mat, (x, y, z))
            prev = cur

    def arch(s, cx, y, cz, ux, uz, nx, nz, w, h, mat):
        """a flat pointed arch (w wide, h to the point) standing at (cx, y, cz) in the plane along (ux, uz), facing (nx, nz)"""
        P = lambda a, hh: (cx + ux * a, y + hh, cz + uz * a)
        hs = h - w * 0.62
        pts = [P(-w / 2, 0), P(w / 2, 0), P(w / 2, hs)]
        for q in (1, 2, 3): t = q / 4; pts.append(P(w / 2 * (1 - t) ** 1.25, hs + (h - hs) * math.sin(t * math.pi / 2)))
        pts.append(P(0, h))
        for q in (3, 2, 1): t = q / 4; pts.append(P(-w / 2 * (1 - t) ** 1.25, hs + (h - hs) * math.sin(t * math.pi / 2)))
        pts.append(P(-w / 2, hs))
        s.quad(pts, mat, d=(nx, 0, nz))


def poly_pts(fl):
    P = [(fl[k], fl[k + 1]) for k in range(0, len(fl) - 1, 2)]
    if len(P) > 2 and math.hypot(P[0][0] - P[-1][0], P[0][1] - P[-1][1]) < 0.5: P = P[:-1]
    return P


def outward(P, k):
    """the edge k's unit outward normal (tested against the polygon)"""
    (ax, az), (bx, bz) = P[k], P[(k + 1) % len(P)]
    l = math.hypot(bx - ax, bz - az) or 1.0
    nx, nz = (bz - az) / l, -(bx - ax) / l
    mx, mz = (ax + bx) / 2, (az + bz) / 2
    if inside(P, mx + nx * 0.3, mz + nz * 0.3): nx, nz = -nx, -nz
    return nx, nz


def merlon_row(G, ax, az, ay, bx, bz, by, nx, nz, step, w=1.3):
    """merlons along the edge (a -> b) on the top, their outer faces at the edge, the wall's outward normal (nx, nz)"""
    l = math.hypot(bx - ax, bz - az)
    if l < 1.6: return 0
    n = max(1, int(round(l / step))); ang = math.atan2(bz - az, bx - ax)
    for q in range(n):
        t = (q + 0.5) / n
        G.merlon(ax + (bx - ax) * t - nx * 0.4, ay + (by - ay) * t - 0.05, az + (bz - az) * t - nz * 0.4, min(w, l / n - 0.5), 0.8, 1.55, ang, 'mud_top')
    return n


def walls(G, detail):
    """the closed outlines: their skins battered inwards (the feet below the ground) and their tops; the open lines: battered prisms"""
    nm = 0
    for hgt, fl in D['cwall']:
        hgt = hgt or 9.0
        P = poly_pts(fl)
        closed = len(P) > 3 and math.hypot(fl[0] - fl[-2], fl[1] - fl[-1]) < 0.5
        if closed:
            n = len(P)
            T = shrink(P, 0.8)
            top = [ground_s(x, z) + hgt for (x, z) in P]
            foot = [ground(x, z) - 1.5 for (x, z) in P]
            for k in range(n):
                k2 = (k + 1) % n; nx, nz = outward(P, k)
                if math.hypot(P[k2][0] - P[k][0], P[k2][1] - P[k][1]) < 0.05: continue
                G.quad([(P[k][0], foot[k], P[k][1]), (P[k2][0], foot[k2], P[k2][1]), (T[k2][0], top[k2], T[k2][1]), (T[k][0], top[k], T[k][1])],
                       'mud', d=(nx, 0.2, nz))
                # the outer edges (facing away from the town's centre): a row of merlons
                mx, mz = (P[k][0] + P[k2][0]) / 2, (P[k][1] + P[k2][1]) / 2
                if detail and nx * (mx - CX) + nz * (mz - CZ) > 0:
                    nm += merlon_row(G, T[k][0], T[k][1], top[k], T[k2][0], T[k2][1], top[k2], nx, nz, 2.5)
            G.quad([(T[k][0], top[k], T[k][1]) for k in range(n)], 'mud_top', d=(0, 1, 0))
        else:
            for k in range(len(P) - 1):
                (ax, az), (bx, bz) = P[k], P[k + 1]
                l = math.hypot(bx - ax, bz - az)
                if l < 0.3: continue
                ux, uz = (bx - ax) / l, (bz - az) / l; nx, nz = uz, -ux
                if nx * ((ax + bx) / 2 - CX) + nz * ((az + bz) / 2 - CZ) < 0: nx, nz = -nx, -nz
                ax, az, bx, bz = ax - ux, az - uz, bx + ux, bz + uz
                y0 = gmin([(ax, az), (bx, bz), ((ax + bx) / 2, (az + bz) / 2)], 3.5) - 1.5
                y1 = ground_s((ax + bx) / 2, (az + bz) / 2) + hgt
                o = ((ax + bx) / 2, y0, (az + bz) / 2)
                Q = lambda x, z, s, w, y: (x + nx * s * w, y, z + nz * s * w)
                fo = [Q(ax, az, 1, 3.6, y0), Q(bx, bz, 1, 3.6, y0), Q(bx, bz, 1, 2.8, y1), Q(ax, az, 1, 2.8, y1)]
                fi = [Q(ax, az, -1, 3.6, y0), Q(bx, bz, -1, 3.6, y0), Q(bx, bz, -1, 2.8, y1), Q(ax, az, -1, 2.8, y1)]
                G.quad(fo, 'mud', o); G.quad(fi, 'mud', o)
                G.quad([fo[0], fi[0], fi[3], fo[3]], 'mud', o); G.quad([fo[1], fi[1], fi[2], fo[2]], 'mud', o)
                G.quad([fo[2], fo[3], fi[3], fi[2]], 'mud_top', d=(0, 1, 0))
                if detail: nm += merlon_row(G, fo[3][0], fo[3][2], y1, fo[2][0], fo[2][2], y1, nx, nz, 2.5)
    return nm


def tower(G, x, z, r, h, n, nmer, y=None):
    """a round battered tower from below the ground to h above it, a ring of merlons on its top"""
    g = ground(x, z) if y is None else y
    yb = gmin([(x, z)], r) - 1.5
    G.frustum(x, yb, z, r + 0.5, r - 0.3, g + h - yb, n, 'mud', cap='mud_top')
    for k in range(nmer):
        a = 2 * math.pi * (k + 0.5) / nmer
        G.merlon(x + math.cos(a) * (r - 0.7), g + h - 0.05, z + math.sin(a) * (r - 0.7), 1.3, 0.8, 1.55, a + math.pi / 2, 'mud_top')


def gates(G, detail):
    out = []
    for h, fl in D['gates']:
        P = poly_pts(fl); best = None
        for k in range(len(P)):
            a = math.atan2(P[(k + 1) % len(P)][1] - P[k][1], P[(k + 1) % len(P)][0] - P[k][0]); ca, sa = math.cos(a), math.sin(a)
            us = [x * ca + z * sa for x, z in P]; vs = [-x * sa + z * ca for x, z in P]
            ar = (max(us) - min(us)) * (max(vs) - min(vs))
            if not best or ar < best[0]: best = (ar, a, (max(us) + min(us)) / 2, (max(vs) + min(vs)) / 2, max(us) - min(us), max(vs) - min(vs))
        _, a, u, v, Lb, Wb = best; ca, sa = math.cos(a), math.sin(a)
        cx, cz = u * ca - v * sa, u * sa + v * ca
        y0 = gmin(P) - 1.0; yt = y0 + 1.0 + h
        # the block: OSM's footprint itself (not its bounding rectangle, whose corners stand out past the footprint's rounded ones)
        n = len(P)
        for k in range(n):
            k2 = (k + 1) % n
            if math.hypot(P[k2][0] - P[k][0], P[k2][1] - P[k][1]) < 0.05: continue
            G.quad([(P[k][0], y0, P[k][1]), (P[k2][0], y0, P[k2][1]), (P[k2][0], yt, P[k2][1]), (P[k][0], yt, P[k][1])], 'mud', d=(outward(P, k)[0], 0.0, outward(P, k)[1]))
        G.quad([(x, yt, z) for (x, z) in P], 'mud_top', d=(0, 1, 0))
        # the passage runs across the walls: along the rectangle's axis nearer the direction from the town's centre
        rx, rz = cx - CX, cz - CZ; rl = math.hypot(rx, rz) or 1.0; rx, rz = rx / rl, rz / rl
        if abs(ca * rx + sa * rz) >= abs(-sa * rx + ca * rz): px, pz, hp, qx, qz, hq = ca, sa, Lb / 2, -sa, ca, Wb / 2
        else: px, pz, hp, qx, qz, hq = -sa, ca, Wb / 2, ca, sa, Lb / 2
        if px * rx + pz * rz < 0: px, pz = -px, -pz   # (p points out of the town)
        if not detail: out.append((cx, cz)); continue
        # merlons round the top, along the footprint's edges
        for k in range(n):
            (ax, az), (bx, bz) = P[k], P[(k + 1) % n]; nx, nz = outward(P, k)
            merlon_row(G, ax, az, yt, bx, bz, yt, nx, nz, 2.5)
        # the outer face: a portal (a shallow raised frame) with a dark pointed arch; the inner face: the arch.
        # Everything stays inside OSM's footprint (the frame and the towers set in from the outer face): the roads
        # turn just outside the gates (the east one at the corner of its outer face), so nothing may stand out onto them.
        fw = min(2 * hq * 0.5, 12.0); ah = min(h * 0.62, 7.5); aw = min(fw * 0.55, 5.0)
        ox, oz = cx + px * hp, cz + pz * hp
        G.box(ox - px * 0.3, y0, oz - pz * 0.3, fw, yt - y0 + 1.2, 0.5, math.atan2(qz, qx), 'mud_top')
        G.arch(ox + px * 0.03, y0 + 1.0, oz + pz * 0.03, qx, qz, px, pz, aw, ah + 1.0, 'dark')
        ix, iz = cx - px * hp, cz - pz * hp
        G.arch(ix - px * 0.03, y0 + 1.0, iz - pz * 0.03, qx, qz, -px, -pz, aw, ah + 1.0, 'dark')
        # two towers flanking the portal, wholly inside the footprint
        tr = max(2.6, min(4.0, hq * 0.3, hp * 0.5 - 0.6))
        for j in (1, -1):
            tower(G, ox - px * (tr + 0.6) + qx * j * (hq - tr - 0.6), oz - pz * (tr + 0.6) + qz * j * (hq - tr - 0.6), tr, yt - y0 - 1.0 + 1.6, 14, 6, y=y0 + 1.0)
        out.append((cx, cz))
    return out


def minarets(G, detail):
    for x, z, h, r0, kind in MINARETS:
        y = gmin([(x, z)], r0) - 0.5
        n = 24 if detail else 12
        if kind == 'short':
            G.frustum(x, y - 1.0, z, r0 + 0.4, r0 + 0.4, 2.0, n, 'brick', cap='brick')
            r1 = r0 * 0.78; nb = 18 if detail else 6
            pat = ['turquoise', 'white', 'blue', 'turquoise', 'brick', 'blue'] if detail else ['turquoise', 'blue', 'turquoise']
            for k in range(nb):
                t0, t1 = k / nb, (k + 1) / nb
                G.frustum(x, y + 1.0 + (h - 1.0) * t0, z, r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1, (h - 1.0) / nb, n, pat[k % len(pat)])
            G.frustum(x, y + h, z, r1 * 1.05, r1 * 1.05, 0.6, n, 'white', cap='brick')
        else:
            G.frustum(x, y - 1.0, z, r0 + 0.5, r0 + 0.5, 2.2, n, 'brick', cap='brick')
            r1 = r0 * 0.5; nb = 21 if detail else 7
            for k in range(nb):
                t0, t1 = k / nb, (k + 1) / nb
                c = 'brick' if k % 3 != 2 else ('turquoise' if (k // 3) % 2 == 0 else 'white')
                if not detail: c = 'brick' if k % 2 == 0 else 'turquoise'
                G.frustum(x, y + 1.2 + (h - 1.2) * t0, z, r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1, (h - 1.2) / nb, n, c)
            # the gallery, the lantern of arches, the cornice and the small tiled dome
            yt = y + h
            G.frustum(x, yt, z, r1 * 1.55, r1 * 1.55, 0.5, n, 'white', cap='white')
            G.frustum(x, yt + 0.5, z, r1 * 1.15, r1 * 1.15, 3.2, n, 'brick')
            if detail:
                for k in range(8):
                    a = 2 * math.pi * (k + 0.5) / 8; c, s = math.cos(a), math.sin(a)
                    G.arch(x + c * (r1 * 1.15 + 0.03), yt + 0.9, z + s * (r1 * 1.15 + 0.03), -s, c, c, s, 0.75, 2.2, 'dark')
            G.frustum(x, yt + 3.7, z, r1 * 1.3, r1 * 1.3, 0.4, n, 'white', cap='white')
            G.dome(x, yt + 4.1, z, r1 * 1.05, r1 * 1.1, n, 4 if detail else 2, 'turquoise')
            if detail: G.frustum(x, yt + 4.1 + r1 * 1.1 - 0.1, z, 0.12, 0.05, 1.2, 6, 'white')


def build(detail):
    G = Mesh()
    nm = walls(G, detail)
    for x, z in D['towers']: tower(G, x, z, 3.8, 9.0 + 1.8, 18 if detail else 8, 7 if detail else 0)
    gs = gates(G, detail)
    minarets(G, detail)
    return G, nm, len(gs)


def to_blender(G, name):
    me = bpy.data.meshes.new(name)
    # the game's (x, y up, z) about the walls' centre -> Blender's Z-up (x, -z, y); the glTF exporter turns it back to Y-up
    me.from_pydata([(x - CX, -(z - CZ), y) for (x, y, z) in G.v], [], G.f)
    for (n, col) in MATS:
        mt = bpy.data.materials.get(n) or bpy.data.materials.new(n)
        mt.diffuse_color = (*col, 1.0); mt.use_nodes = True
        bs = mt.node_tree.nodes.get('Principled BSDF')
        if bs: bs.inputs['Base Color'].default_value = (*col, 1.0); bs.inputs['Roughness'].default_value = 0.9
        me.materials.append(mt)
    for p, m in zip(me.polygons, G.m): p.material_index = m; p.use_smooth = False
    me.validate(); me.update()
    # the long tops of the walls are concave n-gons: cut them into triangles here (ear clipping), not left to the exporter
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bm.to_mesh(me); bm.free(); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    return ob


def export(ob, path):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_texcoords=False, export_normals=True, export_tangents=False, export_materials='EXPORT',
                              export_cameras=False, export_lights=False, export_extras=False, export_animations=False)


bpy.ops.wm.read_factory_settings(use_empty=True)
os.makedirs(OUT, exist_ok=True)
for detail, fn in ((True, 'hiva.glb'), (False, 'hiva-far.glb')):
    G, nm, ng = build(detail)
    ob = to_blender(G, 'hiva' if detail else 'hiva_far')
    export(ob, os.path.join(OUT, fn))
    print(fn, len(G.v), 'vertices before the split,', len(G.f), 'faces,', nm, 'merlons on the walls,', ng, 'gates,',
          os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
