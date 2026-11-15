# Učka: the view beyond the corridor (def.far in js/tracks/ucka.js), read by ucFar (js/world-ucka.js).
#   python3 tools/ucka/daljava.py            # prints the summary
#   python3 tools/ucka/daljava.py --zapisi   # and writes the far: line into js/tracks/ucka.js
# From the summit (~1,350 m) the camera sees the Kvarner bay, the coast of the Opatija riviera below, the islands (Cres, Krk) and Velebit
# far to the south-east, the Istrian hills to the west. The rings: heights on a polar grid round the road's middle (radii growing by a
# factor, so ~1.5 degrees across at every distance), from 280 m to 140 km (the sea's horizon from 1,350 m with the usual refraction); each
# node the higher of its own height and the mean of the highest round it (the ridges keep their height on the coarse grid), lowered by the
# earth's curve in js (radius 7/6 of the earth's: the refraction), 1 byte a node (per ring lo + v * step); the sea (the model's 0 m: Copernicus has no tiles
# over the open sea) as runs [land, sea, land, ...]. Source: Copernicus DEM GLO-30 (as tools/proga-podatki.py, its helpers).
import importlib.util, json, math, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
spec = importlib.util.spec_from_file_location('pp', os.path.join(ROOT, 'tools', 'proga-podatki.py')); pp = importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)

LAT0, LON0 = 45.290297, 14.203244          # the track's frame (js/tracks/ucka.js: the start line)
CX, CZ = -10.0, 290.0                       # the rings' centre: the road's middle
NA, R0, R1, FAC = 240, 280.0, 140000.0, 1.06
RE = 6371000.0 * 7 / 6                     # (the earth's radius with the refraction: js drops a node by r * r / (2 * re))

def main():
    F = pp.Frame(LAT0, LON0)
    rr = [R0]
    while rr[-1] < R1: rr.append(min(R1, rr[-1] * FAC))
    az = np.arange(NA) / NA * 2 * math.pi
    RR, AZ = np.meshgrid(np.array(rr), az, indexing='ij')
    X = CX + np.sin(AZ) * RR; Z = CZ - np.cos(AZ) * RR       # (azimuth clockwise from north; north is -z)
    lat, lon = F.ll(X, Z)
    box = (float(lat.min()) - 0.02, float(lon.min()) - 0.02, float(lat.max()) + 0.02, float(lon.max()) + 0.02)
    a, T, epsg = pp.read_mosaic(pp.dem_urls(*box), *box, out_shape='quarter', resampling='average')
    a = np.nan_to_num(a.astype(np.float32), nan=0.0); a[a < -50] = 0.0
    H = pp.sample_grid(a, T, epsg, lat, lon)
    acc = np.full_like(H, -1e9); cell = RR * (2 * math.pi / NA)   # (a node's width across)
    for ox, oz in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        la2, lo2 = F.ll(X + ox * cell / 3, Z + oz * cell / 3); acc = np.maximum(acc, pp.sample_grid(a, T, epsg, la2, lo2))
    H = np.maximum(H, 0.5 * H + 0.5 * acc)
    sea = H < 0.5
    base = 1330.0                            # (the track's base: js/tracks/ucka.js dem.base, the start's ground)
    L = np.where(sea, np.nan, H)               # (land heights, metres above the sea; the curve is added in js)
    lo = np.nan_to_num(np.nanmin(L, axis=1), nan=0.0); hi = np.nan_to_num(np.nanmax(L, axis=1), nan=0.0)
    lo = np.floor(lo); st = np.maximum(0.25, np.ceil((hi - lo) / 255 * 4) / 4)   # (per ring: lo + v * step, ~1-9 m)
    v = np.clip(np.round((np.nan_to_num(L, nan=0.0) - lo[:, None]) / st[:, None]), 0, 255).astype(np.uint8)
    runs, cur, k = [], False, 0
    for w in sea.ravel():
        if bool(w) != cur: runs.append(k); k = 0; cur = not cur
        k += 1
    runs.append(k)
    import base64
    far = {'c': [CX, CZ], 'r': [round(x, 1) for x in rr], 'na': NA, 'lo': [int(x) for x in lo], 'st': [float(x) for x in st], 'base': base, 're': RE, 'b64': base64.b64encode(v.tobytes()).decode(), 'sea': runs}
    print('rings %d x %d, highest %.0f m, sea %.0f %%, %d bytes' % (len(rr), NA, float(H.max()), 100 * float(sea.mean()), len(far['b64'])))
    if '--zapisi' in sys.argv:
        p = os.path.join(ROOT, 'js', 'tracks', 'ucka.js'); s = open(p, encoding='utf-8').read()
        line = '    far: %s,   // (tools/ucka/daljava.py: the view beyond the corridor, ucFar)\n' % json.dumps(far, separators=(',', ':'))
        s = re.sub(r'    far: .*\n', '', s)
        s = s.replace('    names: [],\n', '    names: [],\n' + line, 1)   # (outside the importer's block)
        open(p, 'w', encoding='utf-8').write(s); print('written', p)

if __name__ == '__main__': main()
