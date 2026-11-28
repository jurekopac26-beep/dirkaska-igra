#!/usr/bin/env python3
"""Izoard's own world south of the col (docs/proge/izoard.md, "Casse Déserte"): writes js/world-izoard.js from tools/proga/izoard-casse.tpl.js.

  python3 tools/proga/izoard-casse.py

What it puts in: the scree basin under the col's south side (the Casse Déserte) and the slopes round it on a 31.25 m grid (x -500..3500,
z 1500..3500 game metres from the start line, 44.836835 N, 6.7221912 E; x east, z south; one eighth of the far grid's 250 m, on its nodes),
its heights from Copernicus DEM GLO-30 (lib.CopDEM) and its colour from Sentinel-2 L2A (the track's own scene, S2A_32TLQ_20250709: true
colour, the terrain's shading at the time of the scene divided out, as tools/proga/proga.py does for the corridor); the needles of
cargneule standing out of the scree (placed at random, seed 11, on OpenStreetMap's natural=bare_rock where the slope is steep: their
places are an approximation, their kind and size from the geology of the place); and the road down the south side (OpenStreetMap
highway=secondary) where it is more than 60 m from the game's road. Sources: OpenStreetMap (ODbL 1.0, the API's map call: no Overpass
mirror answered, 28. 11. 2026), Copernicus DEM, Sentinel-2 (Copernicus). No names are read or written. The downloads are cached in
tools/proga/raw/izoard-casse/ (not in git).
"""
import os, sys, json, math, base64, xml.etree.ElementTree as ET
import numpy as np
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib

LAT0, LON0 = 44.836835, 6.7221912
X0, X1, Z0, Z1, C = -500.0, 3500.0, 1500.0, 3500.0, 31.25
SCENE = 'S2A_32TLQ_20250709_0_L2A'
OSM_BOX = (6.725, 44.795, 6.765, 44.822)


def read_osm():
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.3f,%.3f,%.3f,%.3f' % OSM_BOX
    r = ET.fromstring(lib.fetch(url, 'izoard-casse/jug.osm'))
    G = lib.Geo(LAT0, LON0); nodes = {}
    for n in r.iter('node'):
        x, z = G.to_xz(float(n.get('lat')), float(n.get('lon'))); nodes[n.get('id')] = (float(x), float(z))
    rock, road = [], []
    for w in r.iter('way'):
        t = {k.get('k'): k.get('v') for k in w.iter('tag')}; g = [nodes[nd.get('ref')] for nd in w.iter('nd') if nd.get('ref') in nodes]
        if len(g) < 2: continue
        if t.get('natural') == 'bare_rock' and len(g) > 3 and g[0] == g[-1]: rock.append(np.array(g))
        elif t.get('highway') == 'secondary': road.append(np.array(g))
    lib.log('osm', 'bare_rock', len(rock), 'road ways', len(road))
    return rock, road


def track():
    """The game's road (js/tracks/izoard.js, its points), x, z."""
    import subprocess
    js = "const vm=require('vm'),fs=require('fs');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('js/tracks/izoard.js','utf8')+';this.D=TRACK_DEFS[0]',c);process.stdout.write(JSON.stringify(c.D.points))"
    return np.array(json.loads(subprocess.check_output(['node', '-e', js], cwd=os.path.join(HERE, '..', '..'))), float)


def inside(poly, x, z):
    xs, zs = poly[:, 0], poly[:, 1]; c = np.zeros(np.shape(x), bool)
    for k in range(len(poly) - 1):
        a, b = (zs[k] > z) != (zs[k + 1] > z), xs[k] + (z - zs[k]) * (xs[k + 1] - xs[k]) / np.where(zs[k + 1] == zs[k], 1e-9, zs[k + 1] - zs[k])
        c ^= a & (x < b)
    return c


def main():
    G = lib.Geo(LAT0, LON0)
    nx = int((X1 - X0) / C) + 1; nz = int((Z1 - Z0) / C) + 1
    XX, ZZ = np.meshgrid(X0 + np.arange(nx) * C, Z0 + np.arange(nz) * C); la, lo = G.to_ll(XX, ZZ)
    dem = lib.CopDEM(la.min() - .01, lo.min() - .01, la.max() + .01, lo.max() + .01)
    H = np.nan_to_num(dem.sample(la, lo), nan=float(np.nanmean(dem.sample(la, lo))))
    hlo = int(math.floor(H.min() / 10) * 10); hb = base64.b64encode(np.clip(np.round((H - hlo) * 2), 0, 65535).astype('>u2').tobytes()).decode()
    lib.log('grid', nx, nz, 'heights', H.min(), H.max())
    # the colour: Sentinel-2, 9 samples round each node, the scene's sun on the terrain divided out (as proga.colours), a gamma
    zone = SCENE.split('_')[1]; y, mo = SCENE.split('_')[2][:4], int(SCENE.split('_')[2][4:6]); n = len(zone) - 3
    pre = 'sentinel-s2-l2a-cogs/%s/%s/%s/%s/%d/%s/' % (zone[:n], zone[n], zone[n + 1:], y, mo, SCENE)
    meta = json.loads(lib.fetch(lib.S2 + pre + SCENE + '.json', 's2/' + SCENE + '.json'))['properties']
    acc = np.zeros(XX.shape + (3,))
    for ox, oz in [(0, 0), (-8, -8), (8, -8), (-8, 8), (8, 8), (-12, 0), (12, 0), (0, -12), (0, 12)]:
        a, o = G.to_ll(XX + ox, ZZ + oz); acc += np.stack([lib.s2_band(pre, b, a, o) for b in ['B04', 'B03', 'B02']], -1)
    rgb = acc / 9 / 10000.0
    az, el = math.radians(meta['view:sun_azimuth']), math.radians(meta['view:sun_elevation'])
    gz_, gx_ = np.gradient(ndimage.gaussian_filter(H, 0.7), C); nrm = np.stack([-gx_, np.ones_like(H), -gz_], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    sun = np.array([math.sin(az) * math.cos(el), math.sin(el), -math.cos(az) * math.cos(el)])
    sh = np.clip(nrm @ sun / max(0.2, math.sin(el)), 0.35, 1.6)
    rgb = np.clip(rgb / sh[..., None], 0, 1) ** (1 / 2.2); rgb = np.clip(rgb * (0.44 / max(0.05, np.median(rgb.mean(-1)))), 0, 1)
    q = bytearray()
    for r, g, b in rgb.reshape(-1, 3):
        v = (int(round(r * 31)) << 11) | (int(round(g * 63)) << 5) | int(round(b * 31)); q += bytes([v >> 8, v & 255])
    lib.log('colour', 'median', np.median(rgb.reshape(-1, 3), 0), 'sun', meta['view:sun_azimuth'], meta['view:sun_elevation'])
    rock, road = read_osm(); P = track()
    def dtrack(x, z): return np.sqrt(((P[::3, None, 0] - x[None]) ** 2 + (P[::3, None, 1] - z[None]) ** 2).min(0))
    def hat(x, z):
        u = np.clip((x - X0) / C, 0, nx - 1.001); v = np.clip((z - Z0) / C, 0, nz - 1.001); i = u.astype(int); j = v.astype(int); fu = u - i; fv = v - j
        return (H[j, i] * (1 - fu) + H[j, i + 1] * fu) * (1 - fv) + (H[j + 1, i] * (1 - fu) + H[j + 1, i + 1] * fu) * fv
    # the needles: in the basin, on bare rock, steep (the slope over 0.55), not near the road; at random, at least 22 m apart
    rng = np.random.default_rng(11); cx = rng.uniform(X0 + 60, X1 - 60, 40000); cz = rng.uniform(Z0 + 60, Z1 - 60, 40000)
    ok = np.zeros(len(cx), bool)
    for p in rock: ok |= inside(p, cx, cz)
    sl = np.hypot(hat(cx + 10, cz) - hat(cx - 10, cz), hat(cx, cz + 10) - hat(cx, cz - 10)) / 20
    ok &= (sl > 0.55) & (dtrack(cx, cz) > 120) & (cx > 900) & (cx < 2300) & (cz > 2000) & (cz < 3300)   # (the basin of the Casse Déserte, not the bare rock of the peaks round it)
    nd = []
    for x, z in zip(cx[ok], cz[ok]):
        if len(nd) >= 70: break
        if all((x - a) ** 2 + (z - b) ** 2 > 22 ** 2 for a, b, *_ in nd):
            ht = float(rng.uniform(6, 16)); nd.append([round(float(x), 1), round(float(z), 1), round(ht, 1), round(ht * float(rng.uniform(0.2, 0.32)), 1)])
    lib.log('needles', len(nd), 'of', int(ok.sum()))
    # the road down the south side: every ~15 m, more than 60 m from the game's road, inside the grid
    rd = []
    for w in road:
        pts = [w[0]]
        for a, b in zip(w[:-1], w[1:]):
            k = max(1, int(np.hypot(*(b - a)) // 15)); pts += [a + (b - a) * t / k for t in range(1, k + 1)]
        pts = np.array(pts); m = (dtrack(pts[:, 0], pts[:, 1]) > 60) & (pts[:, 0] > X0 + 40) & (pts[:, 0] < X1 - 40) & (pts[:, 1] > Z0 + 40) & (pts[:, 1] < Z1 - 40)
        run = []
        for p, f in zip(pts, m):
            if f: run.append([round(float(p[0]), 1), round(float(p[1]), 1)])
            elif len(run) > 2: rd.append(run); run = []
            else: run = []
        if len(run) > 2: rd.append(run)
    lib.log('road runs', len(rd), sum(map(len, rd)))
    # the scree by the road under the col (s 3700 to the col): Sentinel-2's NDVI (B08, B04) under 0.28 on an 8 m grid 9-70 m from the road;
    # k 1-3 how bare (under 0.28, 0.21, 0.14): how many stones the game strews there (js: SCREE)
    TX, TZ = np.meshgrid(np.arange(-600, 1700, 8.0), np.arange(-600, 2500, 8.0)); TX, TZ = TX.ravel(), TZ.ravel()
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; dd = np.full(len(TX), 1e9); ss = np.zeros(len(TX))
    for k in range(0, len(P), 2):
        e = np.hypot(TX - P[k, 0], TZ - P[k, 1]); m = e < dd; dd[m] = e[m]; ss[m] = seg[k]
    m = (dd > 9) & (dd < 70) & (ss > 3700); TX, TZ = TX[m], TZ[m]; a, o = G.to_ll(TX, TZ)
    b4, b8 = lib.s2_band(pre, 'B04', a, o), lib.s2_band(pre, 'B08', a, o); ndvi = (b8 - b4) / (b8 + b4 + 1e-6)
    sc = [[int(x), int(z), int(1 + (v < 0.21) + (v < 0.14))] for x, z, v in zip(TX, TZ, ndvi) if v < 0.28]
    lib.log('scree cells', len(sc), 'of', len(TX))
    casse = {'x0': X0, 'z0': Z0, 'nx': nx, 'nz': nz, 'cell': C, 'lo': hlo, 'b64': hb, 'col': base64.b64encode(bytes(q)).decode()}
    t = open(os.path.join(HERE, 'izoard-casse.tpl.js'), encoding='utf-8').read()
    t = t.replace('/*CASSE*/null', json.dumps(casse, separators=(',', ':'))).replace('/*NEEDLES*/[]', json.dumps(nd, separators=(',', ':'))).replace('/*ROAD*/[]', json.dumps(rd, separators=(',', ':'))).replace('/*SCREE*/[]', json.dumps(sc, separators=(',', ':')))
    p = os.path.join(HERE, '..', '..', 'js', 'world-izoard.js'); open(p, 'w', encoding='utf-8').write(t); lib.log('wrote', os.path.normpath(p), len(t))


if __name__ == '__main__':
    main()
