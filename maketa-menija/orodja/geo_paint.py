# Mockup only: painting the real land for the globe. Land cover (ESA WorldCover) in natural colours, shaded by the real relief (AWS
# Terrain Tiles), with a little texture per kind of land (forest canopy, fields, roofs, rock) so a close view does not look smeared.
# Three scales: L1 a region (~800 km, colours taken from the globe's own Blue Marble so it melts into it), L2 a track's surroundings
# (80 km), L3 the track's own land (14 km, as seen when the camera comes down to it).
import math
import numpy as np
from PIL import Image
from scipy import ndimage
from geo_lib import DEM, landcover, grid_ll, hillshade, bm_sample, radii

CLASSES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]
# the close-up colours (sRGB), near the game's own: dark forest, bright meadows, warm fields, grey-beige towns, pale rock, blue water
DETAIL = {0: (38, 74, 116), 10: (44, 70, 34), 20: (92, 100, 56), 30: (108, 132, 62), 40: (150, 146, 88), 50: (156, 146, 134), 60: (150, 146, 136),
          70: (234, 238, 244), 80: (44, 86, 126), 90: (84, 110, 78), 95: (40, 90, 60), 100: (128, 134, 114)}

# the season of a track's land as the game shows it (the same on the globe, in the drone's far land): Vršič in October, the larches and
# beeches turning, the first snow from about 1350 m (drones.json's snow line for its far land, there in the game's heights: + 800.8 m)
SEASON = {'vrsic': {'autumn': 1.0, 'snow': (1350.0, 1550.0)}}

def box_km(lat, lon, km):
    M, N = radii(lat); d = km * 500
    return (lat - math.degrees(d / M), lon - math.degrees(d / (N * math.cos(math.radians(lat)))), lat + math.degrees(d / M), lon + math.degrees(d / (N * math.cos(math.radians(lat)))))

def bm_palette(box, n=420):
    """Each kind of land's colour on the Blue Marble over a wide box (the globe's colours), the close-up colour where it is rare."""
    lc = landcover(*box, n, n); la, lo = grid_ll(*box, n, n); c = bm_sample(la, lo); pal = {}
    for k in CLASSES:
        m = lc == k
        pal[k] = tuple(float(v) for v in (c[m].mean(axis=0) if m.sum() > 60 else np.array(DETAIL[k]) * 0.62))
    # (the sea outside the land cover tiles, and water: the Blue Marble's own water)
    return pal

def mix(p, q, f): return {k: tuple(p[k][i] * (1 - f) + q[k][i] * f for i in range(3)) for k in p}

def vnoise(shape, cell, seed):
    """Smooth value noise (0..1) with features about `cell` pixels across."""
    rng = np.random.default_rng(seed); h, w = shape
    g = rng.random((int(h / cell) + 3, int(w / cell) + 3)).astype(np.float32)
    return np.clip(ndimage.zoom(g, (h / (g.shape[0] - 2), w / (g.shape[1] - 2)), order=3)[:h, :w], 0, 1)

def fbm(shape, cell, seed, oct=3):
    a, s, t = 0, 0, 1.0
    for o in range(oct): a = a + vnoise(shape, max(1.2, cell / 2 ** o), seed + o * 17) * t; s += t; t *= 0.5
    return a / s

def paint(box, W, pal, dem_z, zfac=1.2, detail=0.0, mpp=None, lc_res=None, seed=1, water_fix=True, season=None, relief=1.0):
    """The land over box (lat0, lon0, lat1, lon1) as a W x W picture: the colours of pal by land cover, soft edges, shaded by the relief.
    detail (0..1): how much texture each kind of land gets (canopy, fields, roofs, rock); season: SEASON's (autumn colours in the
    woods, snow from a height); relief (0..1): how much of the relief's shading is painted in (less where the picture is lit again in 3D).
    Returns (rgb uint8, heights at W x W, land cover)."""
    if mpp is None: M, N = radii((box[0] + box[2]) / 2); mpp = (box[2] - box[0]) * math.pi / 180 * M / W
    n0 = lc_res or W
    lc = landcover(*box, n0, n0)
    dem = DEM(box[0], box[1], box[2], box[3], dem_z); la, lo = grid_ll(*box, W, W); h = dem.sample(la, lo).astype(np.float32)
    if n0 != W: lc = np.asarray(Image.fromarray(lc).resize((W, W), Image.NEAREST))
    if water_fix:   # shadows taken for water on steep slopes, and specks of water
        gy, gx = np.gradient(h, mpp); steep = np.hypot(gx, gy) > 0.22
        wat = lc == 80; lab, nl = ndimage.label(wat); sizes = ndimage.sum(np.ones_like(lab), lab, range(1, nl + 1)) if nl else []
        small = np.zeros(nl + 1, bool); small[1:] = np.asarray(sizes) < max(4, (60 / mpp) ** 2)
        bad = wat & (steep | small[lab]); lc = lc.copy(); lc[bad] = 60 if detail else 30
    # soft land-cover colours: each kind's mask blurred a little, the colours mixed by the masks
    rgb = np.zeros((W, W, 3), np.float32); wsum = np.zeros((W, W), np.float32); sig = max(0.7, 9.0 / mpp) if detail else 0.8
    for k in CLASSES:
        m = (lc == k).astype(np.float32)
        if not m.any(): continue
        m = ndimage.gaussian_filter(m, sig); c = np.array(pal[k], np.float32)
        layer = np.broadcast_to(c, (W, W, 3)).copy()
        if detail:
            if k == 10:   # canopy: crowns and gaps
                n1 = fbm((W, W), max(1.5, 14 / mpp), seed + 1); n2 = vnoise((W, W), max(2, 60 / mpp), seed + 2)
                layer *= (0.8 + 0.42 * n1 * detail + 0.1 * (n2 - 0.5))[..., None]; layer[..., 0] += 10 * (n2 - 0.5) * detail
            elif k in (30, 20, 90):
                n1 = fbm((W, W), max(2, 40 / mpp), seed + 3); layer *= (0.9 + 0.2 * n1 * detail)[..., None]
            elif k == 40:   # fields: a patchwork
                cell = max(3, 140 / mpp); n1 = vnoise((W, W), cell, seed + 4); q = np.floor(n1 * 6) / 6
                tint = np.stack([0.9 + 0.25 * q, 0.92 + 0.18 * (1 - q), 0.85 + 0.1 * q], -1); layer *= 1 + (tint - 1) * detail
            elif k == 50:   # roofs and streets
                n1 = vnoise((W, W), max(1.2, 9 / mpp), seed + 5); n2 = vnoise((W, W), max(1.2, 25 / mpp), seed + 6)
                roof = np.stack([1.05 + 0.25 * (n2 > 0.62), 0.98 + 0.05 * (n2 > 0.62), 0.95 - 0.05 * (n2 > 0.62)], -1)
                layer *= (0.75 + 0.45 * n1 * detail)[..., None] * (1 + (roof - 1) * detail)
            elif k in (60, 100):   # rock and scree
                n1 = fbm((W, W), max(1.5, 20 / mpp), seed + 7, 4); layer *= (0.78 + 0.4 * n1 * detail)[..., None]
            elif k in (80, 0):   # water: darker away from the shore
                d = ndimage.distance_transform_edt(lc == k) * mpp; layer *= (1.08 - 0.22 * np.clip(d / 400, 0, 1))[..., None]
        rgb += layer * m[..., None]; wsum += m
    rgb /= np.maximum(wsum, 1e-6)[..., None]
    water = ndimage.gaussian_filter(((lc == 80) | (lc == 0)).astype(np.float32), 1.0)
    if season and season.get('autumn'):   # the woods turning: patches of orange and yellow crowns (beech, larch) among the dark spruces, fewer up high
        a = season['autumn']; m = ndimage.gaussian_filter((lc == 10).astype(np.float32), sig)
        n3 = fbm((W, W), max(2.0, 120 / mpp), seed + 21, 3); n4 = vnoise((W, W), max(1.2, 24 / mpp), seed + 22); cn = fbm((W, W), max(1.5, 14 / mpp), seed + 1)
        dec = np.clip((n3 - 0.45) / 0.2, 0, 1) * (1 - np.clip((h - 1450) / 350, 0, 1))
        col = np.stack([150 + 40 * n4, 92 + 50 * n4, 34 + 14 * n4], -1) * (0.74 + 0.4 * cn)[..., None]
        w = (m * dec * 0.88 * a)[..., None]; rgb = rgb * (1 - w) + col * w
        g = ndimage.gaussian_filter(((lc == 30) | (lc == 20)).astype(np.float32), sig)[..., None] * 0.35 * a   # (the meadows a little straw-coloured)
        rgb = rgb * (1 - g) + rgb * np.array([1.1, 0.98, 0.78], np.float32) * g
    if season and season.get('snow'):   # the first snow: from the snow line up, thinner on steep faces, none on the water
        s0, s1 = season['snow']; gy, gx = np.gradient(h, mpp); sl = np.hypot(gx, gy)
        nz = fbm((W, W), max(2.0, 140 / mpp), seed + 23, 3); nf = fbm((W, W), max(1.5, 30 / mpp), seed + 24, 3)
        f = np.clip((h + (nz - 0.5) * 140 + (nf - 0.5) * 80 - s0) / (s1 - s0), 0, 1); f = f * f * (3 - 2 * f)
        f = f * (1 - 0.85 * np.clip((sl - 0.55) / 0.55, 0, 1)) * (1 - water)   # (the limestone walls stay grey)
        rgb = rgb * (1 - f[..., None]) + np.array([236, 240, 246], np.float32) * (0.94 + 0.08 * nz)[..., None] * f[..., None]
    # the relief: a soft light from the north-west, a little light from the north-east, the valleys a little darker
    hh = ndimage.gaussian_filter(h, 14 / mpp) if 14 / mpp > 0.6 else h   # (the heights come at ~30 m: smoothed, no steps in the shading)
    hs = hillshade(hh, mpp, az=315, alt=40, z=zfac) * 0.75 + hillshade(hh, mpp, az=45, alt=55, z=zfac) * 0.25
    flat = math.sin(math.radians(40)) * 0.75 + math.sin(math.radians(55)) * 0.25
    sh = 0.45 + 0.55 * hs / flat
    if detail:
        rough = fbm((W, W), max(1.5, 16 / mpp), seed + 9, 3) - 0.5; sh *= 1 + rough * 0.12 * detail
    sh = sh * (1 - water) + water * 1.0   # (water is flat)
    sh = 1 + (sh - 1) * relief
    out = np.clip(rgb * sh[..., None], 0, 255).astype(np.uint8)
    return out, h, lc

def heights(box, n, z):
    dem = DEM(box[0], box[1], box[2], box[3], z); la, lo = grid_ll(*box, n, n)
    # (corners of the cells, n x n, the box's edges included)
    lat = np.linspace(box[2], box[0], n); lon = np.linspace(box[1], box[3], n); LA, LO = np.meshgrid(lat, lon, indexing='ij')
    return dem.sample(LA, LO).astype(np.float32)

def save_heights(h, path):
    """16-bit heights in a PNG (red: high byte, green: low byte) in decimetres above the lowest; returns (lowest, highest)."""
    lo, hi = float(np.floor(h.min())), float(np.ceil(h.max())); v = np.clip(np.round((h - lo) * 10), 0, 65535).astype(np.uint32)
    rgb = np.stack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)], -1)
    Image.fromarray(rgb, 'RGB').save(path, optimize=True); return lo, hi
