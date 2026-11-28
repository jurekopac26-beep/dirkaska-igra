# Lombok, Indonezija: the far horizon (def.far2) beyond the far grid's ~12 km: Rinjani (3726 m, ~56 km north-north-east), the hills of
# the island's middle and, ~106 km west-north-west over the strait, Agung on Bali. Copernicus DEM GLO-30 (ESA, the credits in README.md:
# Zasluge), read at ~185 m (the highest of its cells: no peak missed), the highest ground in rings round the circuit like far_rings in
# build.py (a step of 15 m: Rinjani fits a byte).
#   python3 -I tools/lombok/far2.py   -> tools/lombok/far2.json (build.py puts it in js/tracks/lombok.js as far2)
import base64, json, math, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'lombok.json')))
LAT0, LON0 = J['lat0'], J['lon0']
A_, E2 = 6378137.0, 0.00669437999014
_s = math.sin(math.radians(LAT0)); M = A_ * (1 - E2) / (1 - E2 * _s * _s) ** 1.5; N = A_ / math.sqrt(1 - E2 * _s * _s)
RAW = np.array(J['line']).reshape(-1, 2); CX, CZ = (float(v) for v in RAW.mean(0))   # the circuit's middle (the data's frame, m)
CLAT = LAT0 - math.degrees(CZ / M); CLON = LON0 + math.degrees(CX / (N * math.cos(math.radians(LAT0))))

R2 = [14000, 17500, 22000, 28000, 35000, 44000, 52000, 60000, 72000, 90000, 112000]   # the rings' outer distances (m); the first starts at 11500
NA, STEP, PX = 180, 15, 600   # directions, m a byte, the mosaic's cells a degree

def mosaic():
    import rasterio
    LA0, LA1, LO0, LO1 = -10, -8, 115, 117
    out = np.zeros(((LA1 - LA0) * PX, (LO1 - LO0) * PX), np.float32)
    for la in range(LA0, LA1):
        for lo in range(LO0, LO1):
            n = 'Copernicus_DSM_COG_10_S%02d_00_E%03d_00_DEM' % (-la, lo); url = 'https://copernicus-dem-30m.s3.amazonaws.com/%s/%s.tif' % (n, n)
            try:
                with rasterio.open('/vsicurl/' + url) as src: a = src.read(1)
                f = a.shape[0] // PX; a = a[:f * PX, :a.shape[1] // PX * PX].reshape(PX, f, PX, -1).max(axis=(1, 3))   # (the highest of each cell)
            except Exception as e:   # (no tile over the open sea)
                print('  no tile', n, type(e).__name__); continue
            r0 = (LA1 - 1 - la) * PX; c0 = (lo - LO0) * PX; out[r0:r0 + PX, c0:c0 + PX] = np.maximum(a, 0); print('  tile', n, int(a.max()), 'm')
    return out, LA1, LO0

def main():
    A, la1, lo0 = mosaic(); res = bytearray()
    def h(lat, lon):
        j = int((la1 - lat) * PX); i = int((lon - lo0) * PX)
        return A[j, i] if 0 <= j < A.shape[0] and 0 <= i < A.shape[1] else 0.0
    cosl = math.cos(math.radians(CLAT)); top = []
    for k, r1 in enumerate(R2):
        r0 = R2[k - 1] if k else 11500
        for q in range(NA):
            m = 0.0
            for da in (-0.33, 0, 0.33):
                az = (q + da) / NA * 2 * math.pi
                for r in np.arange(r0, r1 + 1, 120):
                    m = max(m, h(CLAT + math.degrees(math.cos(az) * r / M), CLON + math.degrees(math.sin(az) * r / (N * cosl))))   # (az clockwise from north)
            res.append(int(min(255, max(0, round(m / STEP)))))
            top.append((m, r1, q * 2))
    print('  highest: %.0f m in the ring to %d m at %d deg' % max(top))
    json.dump(dict(na=NA, r=R2, lo=0, step=STEP, b64=base64.b64encode(bytes(res)).decode()), open(os.path.join(HERE, 'far2.json'), 'w'))

if __name__ == '__main__': main()
