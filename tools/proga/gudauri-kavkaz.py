#!/usr/bin/env python3
"""Gudauri: the Greater Caucasus round the road, beyond its far grid (def.farDem, ~9 km round), out to ~36 km (js/world-gudauri.js, KAVKAZ).

A ring on a 500 m grid aligned with def.farDem (its nodes on the far grid's edge are the far grid's own), heights from Copernicus DEM GLO-30
(the main ridge to the north with Mkinvartsveri/Kazbek, 5,047 m, ~26 km off; the Gudamakari and Khevsureti ridges east; the Aragvi valley
south to the Zhinvali reservoir), each node's class from ESA WorldCover 2021 (10 m; 7 x 7 samples over its 500 m): water, forest, shrub,
grass, bare rock, snow and ice (the glaciers), mixed rock and snow, built. Sources: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 and
© Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA), ESA WorldCover 2021 v200 (CC BY 4.0).

  python3 tools/proga/gudauri-kavkaz.py            # writes the KAVKAZ line into js/world-gudauri.js
"""
import json, math, os, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from lib import Geo, CopDEM, cog_window, rle64, b64, log

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'js', 'world-gudauri.js')

# the game's origin (the start line; tools/proga/proga.py's Geo of the track, checked against def.farDem below)
ORIGIN = (42.45935, 44.48487)
# def.farDem of js/tracks/gudauri.js: x0 -9500, z0 -10250, 73 x 73, 250 m -> the ring: 500 m, its nodes on every other far node at the edge
CELL = 500; NX = NZ = 145; X0 = -9500 - 53 * CELL; Z0 = -10250 - 52 * CELL   # (x -36,000..36,000, z -36,250..35,750)
IN_I = (53, 89); IN_J = (52, 88)   # (the far grid's square in ring nodes: inside it the far grid's own)
LO = 400

def far_dem():
    src = open(os.path.join(ROOT, 'js', 'tracks', 'gudauri.js')).read()
    s = src[src.index('farDem: {') + 8:]; d = 0
    for k, ch in enumerate(s):
        d += ch == '{'; d -= ch == '}'
        if d == 0: s = s[:k + 1]; break
    F = json.loads(s); import base64
    raw = base64.b64decode(F['b64']); v = np.frombuffer(raw, '>u2').astype(np.float64)
    return F, (F.get('lo', 400) + v / 2).reshape(F['nz'], F['nx'])

def worldcover_block(lat, lon, n=7, half=250.0, G=None, X=None, Z=None):
    """The classes of n x n samples over each node's cell (10 m pixels, one window of the 3 x 3 degree tile)."""
    off = (np.arange(n) - (n - 1) / 2) / ((n - 1) / 2) * half * 0.86
    XX = (X[..., None, None] + off[None, None, None, :]); ZZ = (Z[..., None, None] + off[None, None, :, None])
    la, lo = G.to_ll(np.broadcast_to(XX, X.shape + (n, n)), np.broadcast_to(ZZ, X.shape + (n, n)))
    url = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N42E042_Map.tif'
    r = ((45 - la) * 12000).astype(int); c = ((lo - 42) * 12000).astype(int)
    # in strips of rows (the window over the whole ring would be 8,000 x 10,000 pixels)
    out = np.zeros(la.shape, np.uint8); rs = np.unique(r.ravel() // 600)
    for q in rs:
        m = (r // 600) == q; ra, rb = r[m].min(), r[m].max() + 1; ca, cb = c[m].min(), c[m].max() + 1
        w = cog_window(url, ra, rb, ca, cb); out[m] = w[r[m] - ra, c[m] - ca]
        log('worldcover strip', q, rb - ra, cb - ca)
    return out

def main():
    G = Geo(*ORIGIN)
    F, FH = far_dem()
    I, J = np.meshgrid(np.arange(NX), np.arange(NZ)); X = X0 + I * CELL; Z = Z0 + J * CELL
    la, lo = G.to_ll(X, Z)
    D = CopDEM(float(la.min()) - 0.01, float(lo.min()) - 0.01, float(la.max()) + 0.01, float(lo.max()) + 0.01)
    # the check: the model at the far grid's nodes against def.farDem (the same origin within a few metres)
    fx = F['x0'] + np.arange(F['nx']) * F['cell']; fz = F['z0'] + np.arange(F['nz']) * F['cell']; FX, FZ = np.meshgrid(fx, fz)
    fl, fo = G.to_ll(FX, FZ); h0 = D.sample(fl, fo); ac = h0.copy()
    for ox, oz in [(-F['cell'] / 3, 0), (F['cell'] / 3, 0), (0, -F['cell'] / 3), (0, F['cell'] / 3)]:
        a, o = G.to_ll(FX + ox, FZ + oz); ac = np.maximum(ac, D.sample(a, o))
    dh = 0.5 * h0 + 0.5 * ac - FH
    log('far grid check: mean', round(float(np.mean(dh)), 1), 'm, mean |d|', round(float(np.mean(np.abs(dh))), 1), 'm')
    H = np.nan_to_num(D.sample(la, lo), nan=LO)
    # (as proga.py's far grid: each node halfway to the highest of the model round it, the ridges keep their height on the coarse grid)
    acc = H.copy()
    for ox, oz in [(-CELL / 3, 0), (CELL / 3, 0), (0, -CELL / 3), (0, CELL / 3)]:
        a, o = G.to_ll(X + ox, Z + oz); acc = np.maximum(acc, np.nan_to_num(D.sample(a, o), nan=LO))
    H = 0.5 * H + 0.5 * acc
    inner = (I >= IN_I[0]) & (I <= IN_I[1]) & (J >= IN_J[0]) & (J <= IN_J[1])
    # the classes: 7 x 7 WorldCover samples per node
    S = worldcover_block(la, lo, G=G, X=X.astype(np.float64), Z=Z.astype(np.float64))
    fr = lambda *cl: np.isin(S, cl).mean(axis=(-1, -2))
    w_water, w_tree, w_shrub, w_grass = fr(80), fr(10), fr(20), fr(30, 40, 90, 100)
    w_bare, w_snow, w_built = fr(60), fr(70), fr(50)
    K = np.stack([w_water, w_tree, w_shrub, w_grass, w_bare, w_snow, w_built]); cls = np.argmax(K, axis=0)
    # 0 water, 1 forest, 2 shrub, 3 grass, 4 bare rock, 5 snow and ice, 6 built, 7 rock and snow (neither above two thirds)
    code = np.array([0, 1, 2, 3, 4, 5, 6])[cls]
    mix = (w_snow >= 0.25) & (w_bare >= 0.25) & (np.maximum(w_snow, w_bare) < 0.67); code = np.where(mix, 7, code)
    code = np.where(inner, 3, code)   # (inside the far grid: not drawn; one class keeps the runs long)
    v = np.clip(np.round((H - LO) * 2), 0, 65535).astype('>u2'); v = np.where(inner, 0, v).astype('>u2')
    log('heights', int(H[~inner].min()), '..', int(H[~inner].max()), 'm; classes', np.bincount(code[~inner].ravel(), minlength=8).tolist())
    ring = {'x0': X0, 'z0': Z0, 'nx': NX, 'nz': NZ, 'cell': CELL, 'lo': LO, 'in': [IN_I[0], IN_I[1], IN_J[0], IN_J[1]],
            'cls': rle64(code), 'b64': b64(v.tobytes())}
    line = '  const KAVKAZ = ' + json.dumps(ring, separators=(',', ':')) + ';'
    src = open(OUT).read(); src = re.sub(r'^  const KAVKAZ = .*;$', lambda _: line, src, count=1, flags=re.M)
    open(OUT, 'w').write(src); log('written', OUT, len(line), 'chars')

if __name__ == '__main__':
    main()
