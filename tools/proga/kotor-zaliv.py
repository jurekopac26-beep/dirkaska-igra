#!/usr/bin/env python3
"""Kotor's own world over the bay (docs/proge/kotor.md, "Zaliv in mesto spodaj"): writes js/world-kotor.js from tools/proga/kotor-zaliv.tpl.js.

  python3 tools/proga/kotor-zaliv.py

What it puts in: the Bay of Kotor below the hairpins on a 62.5 m grid (x -7500..0, z -9000..-750 game metres from the start line, 42.4039866 N,
18.7795888 E; x east, z south), its heights from Copernicus DEM GLO-30 (lib.CopDEM; the sea flat at 0 m on OpenStreetMap's side of the
coastline within 120 m of it, the model's own sea beyond), the houses on its shore from OpenStreetMap's footprints (each its minimum-area
rectangle scaled to the footprint's area; standing on the lowest ground round it, as the model is a surface model; the eaves from
building:levels x 3 m + 1 m or height, else 2 storeys, 3 in the old town; tiles or a flat roof from roof:shape and the building's kind,
the tiles' shade at random) and the old town's walls (barrier=city_wall, historic=citywalls). Kept: every house in the old town, else
70 m2 and more to 3.5 km from the start, 120 m2 to 5.5 km, 200 m2 to 8 km (the far mesh's budget; tests/golden/perf.json).
Sources: OpenStreetMap (ODbL 1.0, the API's map call in 0.025 degree tiles: no Overpass mirror answered, 28. 11. 2026), Copernicus DEM.
No names are read or written. The downloads are cached in tools/proga/raw/kotor-zaliv/ (not in git).
"""
import os, sys, json, math, base64, xml.etree.ElementTree as ET
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib

LAT0, LON0 = 42.4039866, 18.7795888
OSM_TILES = [(lo, la) for lo in (18.680, 18.705, 18.730, 18.755) for la in (42.405, 42.430, 42.455, 42.480)]
OSM_TOWN = (18.760, 42.412, 18.780, 42.430)   # (Kotor's old town and Dobrota, apart: the tile over it is too dense for one call)


def osm(bbox, name):
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.3f,%.3f,%.3f,%.3f' % bbox
    return ET.fromstring(lib.fetch(url, 'kotor-zaliv/%s.osm' % name))


def read_osm():
    """The coastline, the buildings ([outline, building, levels, height, roof:shape, roof:colour]) and the walls, in game metres."""
    G = lib.Geo(LAT0, LON0); nodes = {}; ways = {}
    roots = [osm((lo, la, lo + 0.025, la + 0.025), 't_%.3f_%.3f' % (lo, la)) for lo, la in OSM_TILES] + [osm(OSM_TOWN, 'mesto')]
    for r in roots:
        for n in r.iter('node'):
            x, z = G.to_xz(float(n.get('lat')), float(n.get('lon'))); nodes[n.get('id')] = (float(x), float(z))
        for w in r.iter('way'):
            ways[w.get('id')] = ([nd.get('ref') for nd in w.iter('nd')], {k.get('k'): k.get('v') for k in w.iter('tag')})
    out = {'coast': [], 'bld': [], 'wall': []}
    for nd, t in ways.values():
        g = [(round(nodes[n][0], 1), round(nodes[n][1], 1)) for n in nd if n in nodes]
        if len(g) < 2: continue
        if t.get('natural') == 'coastline': out['coast'].append(g)
        elif 'building' in t: out['bld'].append([g, t.get('building'), t.get('building:levels'), t.get('height'), t.get('roof:shape'), t.get('roof:colour')])
        elif t.get('barrier') == 'city_wall' or t.get('historic') in ('citywalls', 'city_walls'): out['wall'].append(g)
    lib.log('osm', {k: len(v) for k, v in out.items()})
    return out


def grid(d):
    """The bay's grid: heights (0.5 m steps from -50 m, big-endian uint16, base64) and the wet nodes' runs; and the model's own heights."""
    G = lib.Geo(LAT0, LON0)
    X0, X1, Z0, Z1, C = -7500.0, 0.0, -9000.0, -750.0, 62.5
    nx = int((X1 - X0) / C) + 1; nz = int((Z1 - Z0) / C) + 1
    xs = X0 + np.arange(nx) * C; zs = Z0 + np.arange(nz) * C; XX, ZZ = np.meshgrid(xs, zs)
    la, lo = G.to_ll(XX, ZZ)
    dem = lib.CopDEM(la.min() - .01, lo.min() - .01, la.max() + .01, lo.max() + .01)
    H = dem.sample(la, lo)
    # signed distance to the coastline (OSM: land on the left, water on the right)
    P = np.stack([XX.ravel(), ZZ.ravel()], 1); best = np.full(len(P), 1e18); side = np.zeros(len(P))
    for w in d['coast']:
        A = np.array(w[:-1]); B = np.array(w[1:]); 
        for a, b in zip(A, B):
            ab = b - a; L2 = ab @ ab
            if L2 < 1e-6: continue
            t = np.clip(((P - a) @ ab) / L2, 0, 1); Q = a + t[:, None] * ab; dd = ((P - Q) ** 2).sum(1)
            m = dd < best - 1e-9
            if m.any():
                n = np.array([-ab[1], ab[0]])   # the right-hand normal in the game's x, z (z south)
                best[m] = dd[m]; side[m] = ((P[m] - a) @ n)
    dist = np.sqrt(best).reshape(nz, nx); sd = (side > 0).reshape(nz, nx)
    lib.log('agree', ((H < 0.5) == sd).mean())
    wet = np.where(dist < 120, sd, H < 0.5)   # (near the shore the coastline's side; away from it the model's sea, flat at 0)
    lib.log('wet nodes', wet.sum(), 'of', wet.size, 'dem on wet: mean', H[wet].mean(), 'max', H[wet].max(), 'dem on land min', H[~wet].min())
    # heights: the water's floor falls away from the shore; the land rises out of it (the shoreline where the coastline is)
    Hh = np.where(wet, -np.clip(0.5 * dist, 2, 30), np.maximum(H, 0.5 + 0.02 * dist))
    q = np.round((Hh + 50) * 2).astype(np.uint16)
    raw = q.astype('>u2').tobytes(); hb = base64.b64encode(raw).decode()
    runs = []; v = 0; c = 0
    for f in wet.ravel():
        if bool(f) != bool(v): runs.append(c); c = 0; v ^= 1
        c += 1
    runs.append(c)
    lib.log('grid', nx, nz, len(hb), len(runs))
    return {'x0': X0, 'z0': Z0, 'nx': nx, 'nz': nz, 'cell': C, 'b64': hb, 'wet': runs}, H


def houses(d, g, DSM):
    """The houses (11 bytes each, base64; see the template) and the walls (points every <= 12 m)."""
    X0, Z0, C, nx, nz = g['x0'], g['z0'], g['cell'], g['nx'], g['nz']
    X0, Z0, C, nx, nz = g['x0'], g['z0'], g['cell'], g['nx'], g['nz']
    def bil(A, x, z):
        u = np.clip((x - X0) / C, 0, nx - 1.001); v = np.clip((z - Z0) / C, 0, nz - 1.001); i = int(u); j = int(v); fu = u - i; fv = v - j
        return (A[j, i] * (1 - fu) + A[j, i + 1] * fu) * (1 - fv) + (A[j + 1, i] * (1 - fu) + A[j + 1, i + 1] * fu) * fv
    def hull(p):
        p = sorted(set(map(tuple, p)))
        if len(p) < 3: return p
        def cr(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
        lo, up = [], []
        for q in p:
            while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
            lo.append(q)
        for q in reversed(p):
            while len(up) >= 2 and cr(up[-2], up[-1], q) <= 0: up.pop()
            up.append(q)
        return lo[:-1] + up[:-1]
    def mar(p):
        h = np.array(hull(p)); best = None
        for k in range(len(h)):
            e = h[(k + 1) % len(h)] - h[k]; a = math.atan2(e[1], e[0]); c, s = math.cos(a), math.sin(a)
            u = h @ np.array([c, s]); v = h @ np.array([-s, c]); A = (u.max() - u.min()) * (v.max() - v.min())
            if best is None or A < best[0]:
                uc, vc = (u.max() + u.min()) / 2, (v.max() + v.min()) / 2
                best = (A, uc * c - vc * s, uc * s + vc * c, (u.max() - u.min()) / 2, (v.max() - v.min()) / 2, a)
        return best
    OLD = (-700, -2330, 260)   # (Kotor's old town, inside its walls: denser, taller)
    out = bytearray(); n = 0; rng = np.random.default_rng(7)
    for geom, b, lv, ht, rs, rc in d['bld']:
        p = np.array(geom)[:-1]; x, z = p[:, 0].mean(), p[:, 1].mean()
        if not (X0 + 30 < x < -30 and Z0 + 30 < z < -780): continue
        area = 0.5 * abs(np.dot(p[:, 0], np.roll(p[:, 1], -1)) - np.dot(np.roll(p[:, 0], -1), p[:, 1]))
        D = math.hypot(x, z); old = math.hypot(x - OLD[0], z - OLD[1]) < OLD[2]
        # (the size kept falls off with the distance from the road: the old town all, 70 m² to 3.5 km, 120 m² to 5.5 km, 200 m² to 8 km; the draw's budget)
        if area < 40 or D > 8000 or (not old and area < (70 if D < 3500 else 120 if D < 5500 else 200)): continue
        if b in ('ruins', 'collapsed', 'construction', 'roof'): continue
        A, cx, cz, hl, hw, ang = mar(p)
        if hl < hw: hl, hw, ang = hw, hl, ang + math.pi / 2
        k = math.sqrt(area / max(A, 1)); hl *= k; hw *= k   # (the rectangle of the footprint's own area: an L-shaped house no bigger than it is)
        base = min(bil(DSM, cx + ox, cz + oz) for ox, oz in [(0, 0), (25, 0), (-25, 0), (0, 25), (0, -25), (18, 18), (-18, -18), (18, -18), (-18, 18)])
        base = max(base, 0.6)
        try: L = float(lv)
        except: L = None
        try: Hh = float(str(ht).split()[0])
        except: Hh = None
        if Hh is None: Hh = (L * 3.0 + 1.0) if L else (3 if old else 2) * 3.0 + 1.0 + (3.0 if b in ('apartments', 'hotel') else 0)
        flat = rs == 'flat' or b in ('apartments', 'commercial', 'industrial', 'retail', 'hotel', 'school', 'hospital', 'garage') and rs not in ('gabled', 'hipped')
        col = int(rng.integers(0, 4)) if not flat else 4 + int(rng.integers(0, 2))   # (0-3 the terracotta tiles, 4-5 a flat roof's grey)
        v = [int(round((cx - X0) * 2)), int(round((cz - Z0) * 2)), int(round((base + 50) * 2))]
        out += b''.join(int(q).to_bytes(2, 'big') for q in v)
        out += bytes([min(255, int(round(hl * 4))), min(255, int(round(hw * 4))), int(round((ang % math.pi) / math.pi * 256)) % 256, min(255, int(round(Hh * 4))), col])
        n += 1
    walls = []
    for w in d['wall']:
        p = np.array(w); seg = [p[0]]
        for a, b2 in zip(p[:-1], p[1:]):
            L = np.hypot(*(b2 - a)); k = max(1, int(L // 12))
            for t in range(1, k + 1): seg.append(a + (b2 - a) * t / k)
        if not (X0 < p[:, 0].mean() < 0 and Z0 < p[:, 1].mean() < -750): continue
        walls.append([[round(q[0], 1), round(q[1], 1)] for q in seg])
    lib.log('buildings', n, 'bytes', len(out), 'walls', len(walls), sum(map(len, walls)))
    return base64.b64encode(bytes(out)).decode(), walls


def main():
    d = read_osm(); g, H = grid(d); hb, walls = houses(d, g, H)
    t = open(os.path.join(HERE, 'kotor-zaliv.tpl.js'), encoding='utf-8').read()
    bay = {k: g[k] for k in ('x0', 'z0', 'nx', 'nz', 'cell', 'wet', 'b64')}
    t = t.replace('/*BAY*/null', json.dumps(bay, separators=(',', ':'))).replace("/*HOUSES*/''", "'" + hb + "'").replace('/*WALLS*/[]', json.dumps(walls, separators=(',', ':')))
    p = os.path.join(HERE, '..', '..', 'js', 'world-kotor.js'); open(p, 'w', encoding='utf-8').write(t); lib.log('wrote', os.path.normpath(p), len(t))


if __name__ == '__main__':
    main()
