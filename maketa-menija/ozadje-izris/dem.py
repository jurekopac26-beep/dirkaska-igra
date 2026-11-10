# Maketa ozadja menija: višine iz Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 in © Airbus Defence and Space GmbH 2014-2018,
# licenca ESA/Copernicus) v lokalno mrežo v metrih okoli točke pogleda (x proti vzhodu, y proti severu, z navzgor, ukrivljenost Zemlje
# z lomom svetlobe k = 0,13 upoštevana). Ploščice prenese z odprtega vedra AWS (copernicus-dem-30m), če jih še ni v mapi DEM.
# Zagon: python3 dem.py <prizori.json> <prizor> <mapa DEM> <izhod.npz>   (potrebuje numpy, rasterio)
import json, math, os, sys, urllib.request
import numpy as np
import rasterio
from rasterio.windows import from_bounds

R_EARTH, K_REFR = 6371000.0, 0.13

def tile_name(lat, lon):
    return 'Copernicus_DSM_COG_10_%s%02d_00_%s%03d_00_DEM' % ('N' if lat >= 0 else 'S', abs(math.floor(lat)), 'E' if lon >= 0 else 'W', abs(math.floor(lon)))

def fetch(name, folder):
    path = os.path.join(folder, name + '.tif')
    if not os.path.exists(path):
        os.makedirs(folder, exist_ok=True)
        urllib.request.urlretrieve('https://copernicus-dem-30m.s3.amazonaws.com/%s/%s.tif' % (name, name), path)
    return path

def sampler(lat0, lon0, half_deg, folder):
    """one lat/lon mosaic of the tiles round the point (bilinear lookups)"""
    tiles = {}
    for la in range(math.floor(lat0 - half_deg[0]), math.floor(lat0 + half_deg[0]) + 1):
        for lo in range(math.floor(lon0 - half_deg[1]), math.floor(lon0 + half_deg[1]) + 1):
            with rasterio.open(fetch(tile_name(la, lo), folder)) as src:
                tiles[(la, lo)] = (src.read(1).astype(np.float32), src.transform)
    def get(lat, lon):
        out = np.full(lat.shape, np.nan, np.float32)
        for (la, lo), (a, tr) in tiles.items():
            m = (np.floor(lat) == la) & (np.floor(lon) == lo)
            if not m.any(): continue
            col = (lon[m] - tr.c) / tr.a - 0.5; row = (lat[m] - tr.f) / tr.e - 0.5
            c0 = np.clip(np.floor(col).astype(int), 0, a.shape[1] - 2); r0 = np.clip(np.floor(row).astype(int), 0, a.shape[0] - 2)
            fc = np.clip(col - c0, 0, 1); fr = np.clip(row - r0, 0, 1)
            out[m] = (a[r0, c0] * (1 - fc) * (1 - fr) + a[r0, c0 + 1] * fc * (1 - fr) + a[r0 + 1, c0] * (1 - fc) * fr + a[r0 + 1, c0 + 1] * fc * fr)
        return out
    return get

def ll(lat0, lon0, x, y):
    """local metres (x east, y north) to lat/lon (spherical, exact enough for ±40 km)"""
    lat = lat0 + np.degrees(y / R_EARTH)
    lon = lon0 + np.degrees(x / (R_EARTH * np.cos(np.radians(lat0))))
    return lat, lon

def xy(lat0, lon0, lat, lon):
    return (np.radians(lon - lon0) * R_EARTH * math.cos(math.radians(lat0)), np.radians(lat - lat0) * R_EARTH)

def build(cfg, folder):
    lat0, lon0 = cfg['view'][0], cfg['view'][1]
    x0, x1, y0, y1 = cfg['extent']          # metres round the point of view
    step = cfg.get('step', 30.0)
    xs = np.arange(x0, x1 + 1e-6, step, dtype=np.float64); ys = np.arange(y0, y1 + 1e-6, step, dtype=np.float64)
    X, Y = np.meshgrid(xs, ys)
    half = (max(abs(y0), abs(y1)) / 111000 + 0.01, max(abs(x0), abs(x1)) / (111000 * math.cos(math.radians(lat0))) + 0.01)
    get = sampler(lat0, lon0, half, folder)
    lat, lon = ll(lat0, lon0, X, Y)
    Z = get(lat, lon)
    Z = np.where(np.isnan(Z), np.nanmin(Z), Z)
    # the ground at the point of view: the lowest surface within 60 m (the DSM has the trees' crowns on it)
    r = np.hypot(X, Y)
    h0 = float(np.percentile(Z[r < 60], 5)) if (r < 60).any() else float(get(np.array([lat0]), np.array([lon0]))[0])
    drop = (X ** 2 + Y ** 2) / (2 * R_EARTH) * (1 - K_REFR)
    return dict(xs=xs, ys=ys, Z=(Z - h0 - drop).astype(np.float32), Zabs=Z.astype(np.float32), h0=h0)

if __name__ == '__main__':
    scenes = json.load(open(sys.argv[1]))
    cfg = scenes[sys.argv[2]]
    if 'base' in cfg: cfg = {**scenes[cfg['base']], **cfg}
    d = build(cfg, sys.argv[3])
    np.savez_compressed(sys.argv[4], **d)
    # a short check: the ground at the view, the target's distance, bearing and angle, the highest angle along the view's bearings
    tx, ty = xy(cfg['view'][0], cfg['view'][1], cfg['target'][0], cfg['target'][1])
    X, Y = np.meshgrid(d['xs'], d['ys']); Z = d['Z']
    dist = np.hypot(X, Y); ang = np.degrees(np.arctan2(Z - cfg.get('eye', 1.35), np.maximum(dist, 1))); brg = np.degrees(np.arctan2(X, Y)) % 360
    m = (dist > 400)
    print('h0 %.1f m, target %.0f m away, bearing %.1f°' % (d['h0'], math.hypot(tx, ty), math.degrees(math.atan2(tx, ty)) % 360))
    b0 = cfg['bearing']
    for b in range(int(b0) - 24, int(b0) + 25, 4):
        sel = m & (np.abs(((brg - b + 180) % 360) - 180) < 2)
        if sel.any():
            i = np.argmax(np.where(sel, ang, -90)); print('  bearing %4d: skyline %.2f° at %.1f km, %.0f m' % (b, ang.flat[i], dist.flat[i] / 1000, d['Zabs'].flat[i]))
