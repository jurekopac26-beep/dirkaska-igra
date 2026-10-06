# Mockup only: where to put an invented track's world on the real Earth so the real land round it fits the world's own: the seaside
# street circuit's coast (its sea south of z = 236 m, a straight shore) on a real straight stretch of coast; the lake circuit on dry land
# (its own little lake in the infield, no real lake round it). Searches the land cover round the present placing (raw/geo/<id>-far-lc.png).
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy.signal import fftconvolve
from scipy import ndimage
from geo_lib import RAW, Geo
P = json.load(open(os.path.join(RAW, 'places.json')))['tracks']

def load(tid, res=20.0):   # the land cover on a res-metre grid in a local east/north frame round the far box's centre
    F = json.load(open(os.path.join(RAW, tid + '-far.json'))); lc = np.asarray(Image.open(os.path.join(RAW, tid + '-far-lc.png')))
    la0, lo0, la1, lo1 = F['ll']; n = lc.shape[0]; lat_c, lon_c = (la0 + la1) / 2, (lo0 + lo1) / 2
    G = Geo(lat_c, lon_c, 0.0); half = 11000; m = int(2 * half / res)
    xs = -half + (np.arange(m) + 0.5) * res; X, Z = np.meshgrid(xs, xs); la, lo = G.to_ll(X, Z)
    r = np.clip(((la1 - la) / (la1 - la0) * n).astype(int), 0, n - 1); c = np.clip(((lo - lo0) / (lo1 - lo0) * n).astype(int), 0, n - 1)
    return lc[r, c], G, xs

if 'riviera' in sys.argv:
    lc, G, xs = load('riviera'); res = xs[1] - xs[0]; wat = np.where(lc == 80, 1.0, -1.0)
    best = []
    for rot in np.arange(0, 360, 2.0):
        # the template in the world's frame (x east, z south once turned by rot): sea where z > 236, land where z < 236 (40 m either side
        # left out), over x -1400..1400, z -1000..1500, sampled on the local grid by turning it
        k = int(3000 / res); ii = (np.arange(-k, k + 1)) * res; KX, KZ = np.meshgrid(ii, ii)   # (local east, south offsets)
        r = math.radians(rot); wx = KX * math.cos(r) - KZ * math.sin(r); wz = KX * math.sin(r) + KZ * math.cos(r)   # (the world's x, z from east, south: Geo.to_xz)
        inside = (np.abs(wx) < 1400) & (wz > -1000) & (wz < 1500) & (np.abs(wz - 236) > 40)
        T = np.where(inside, np.where(wz > 236, 1.0, -1.0), 0.0)
        # the land part weighs more where the world's town is (|x| < 700, z < 236)
        T = np.where(inside & (wz < 236) & (np.abs(wx) < 700), -1.6, T)
        sc = fftconvolve(wat, T[::-1, ::-1], mode='same') / np.abs(T).sum()
        i = np.unravel_index(np.argmax(sc), sc.shape); best.append((float(sc[i]), rot, float(xs[i[1]]), float(xs[i[0]])))
    best.sort(reverse=True)
    for s, rot, x, z in best[:8]:
        la, lo = G.to_ll(np.array(x), np.array(z)); print('riviera fit %.3f rot %.0f centre %.6f %.6f' % (s, rot, float(la), float(lo)))
if 'jezero' in sys.argv:
    lc, G, xs = load('jezero'); res = xs[1] - xs[0]
    wat = (lc == 80).astype(float); fo = (lc == 10).astype(float); op = np.isin(lc, (30, 40)).astype(float); bu = (lc == 50).astype(float)
    k = int(2600 / res); ii = np.arange(-k, k + 1) * res; KX, KZ = np.meshgrid(ii, ii); disk = (np.hypot(KX, KZ) < 2600).astype(float); disk /= disk.sum()
    core = (np.hypot(KX, KZ) < 1100).astype(float); core /= core.sum()
    W = fftconvolve(wat, disk, mode='same'); Fo = fftconvolve(fo, disk, mode='same'); Op = fftconvolve(op, core, mode='same'); Bu = fftconvolve(bu, core, mode='same')
    d = np.hypot(*np.meshgrid(xs, xs)); score = -6 * W + 0.6 * np.minimum(Fo, 0.5) + 0.8 * np.minimum(Op, 0.6) - 2 * Bu - d / 40000
    score[d > 9000] = -9
    for _ in range(8):
        i = np.unravel_index(np.argmax(score), score.shape); x, z = xs[i[1]], xs[i[0]]; la, lo = G.to_ll(np.array(x), np.array(z))
        print('jezero score %.3f water %.3f forest %.2f open %.2f built %.2f at %.6f %.6f (%.1f km from the present)' % (score[i], W[i], Fo[i], Op[i], Bu[i], float(la), float(lo), d[i] / 1000))
        score[np.hypot(*np.meshgrid(xs - x, xs - z)) < 1500] = -9
