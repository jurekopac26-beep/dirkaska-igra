# Ronski ledenik od blizu (proga Furka, Švica; dodelava O-28-36): višine in led za js/world-furka-ledenik.js.
# Viri: Copernicus DEM GLO-30 (© DLR e.V. 2010–2014 in © Airbus Defence and Space GmbH 2014–2018, licenca Copernicus DEM),
# ESA WorldCover 2021 v200 (© ESA WorldCover project 2021, CC BY 4.0). Nič iz Googla. Branje po kosih prek tools/proga/lib.py.
#
# Mreža je poravnana z oddaljenim pogledom proge (farDem: x0 -9000, z0 -9500, celica 250 m): celica 250/6 m, tako da se robna oglišča
# ujemajo z oglišči oddaljene mreže (world-furka-ledenik.js tam zapolni luknjo brez šiva). Na oglišče: višina (2 bajta: lo + v / 2 m),
# delež ledu (WorldCover 70, 4 x 4 vzorci po 10 m: 0–255), voda (80: jezero pod ledenikom) in gola skala ali grušč (60: morene).
#   python3 tools/furka-ledenik.py            (zapiše podatkovni del v js/world-furka-ledenik.js)
import math, os, re, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proga'))
from lib import Geo, CopDEM, worldcover, b64, log   # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'world-furka-ledenik.js')
START = (46.57044, 8.39622)   # (izhodišče igre: startna črta, tools/proga/proge.json; nekaj metrov od zglajene črte)
FC = 250.0                    # (celica oddaljene mreže)
SUB = 6                       # (pod-celic na celico oddaljene mreže: 41,7 m)
X0, X1 = -1750.0, 500.0       # (od zahodnega boka doline do vzhodnega; jezik, ledni slap, spodnji del zgornjega ledenika)
Z0, Z1 = -4750.0, -1000.0     # (od ledenega slapu pod Dammastockom do jezera)

def main():
    G = Geo(*START); cell = FC / SUB
    nx = int(round((X1 - X0) / cell)) + 1; nz = int(round((Z1 - Z0) / cell)) + 1
    GX, GZ = np.meshgrid(X0 + np.arange(nx) * cell, Z0 + np.arange(nz) * cell)
    la, lo = G.to_ll(GX, GZ)
    D = CopDEM(float(la.min()) - 0.005, float(lo.min()) - 0.005, float(la.max()) + 0.005, float(lo.max()) + 0.005)
    H = np.nan_to_num(D.sample(la, lo), nan=0.0)
    ice = np.zeros(GX.shape); wat = np.zeros(GX.shape); bare = np.zeros(GX.shape)
    for a in range(4):
        for b in range(4):
            ox, oz = (a - 1.5) * cell / 4, (b - 1.5) * cell / 4
            sa, so = G.to_ll(GX + ox, GZ + oz); wc = worldcover(sa, so)
            ice += (wc == 70) / 16; wat += (wc == 80) / 16; bare += (wc == 60) / 16
    lo_ = int(math.floor(H.min() / 10) * 10)
    v = np.clip(np.round((H - lo_) * 2), 0, 65535).astype('>u2')
    q = lambda m: np.clip(np.round(m * 255), 0, 255).astype(np.uint8)
    data = {'x0': X0, 'z0': Z0, 'nx': nx, 'nz': nz, 'cell': cell, 'lo': lo_, 'h': b64(v.tobytes()), 'ice': b64(q(ice).tobytes()),
            'wat': b64(q(wat).tobytes()), 'bare': b64(q(bare).tobytes())}
    log('ledenik: %d x %d oglišč, %.0f–%.0f m, led %.0f %%, voda %.1f %%' % (nx, nz, H.min(), H.max(), 100 * (ice > 0.5).mean(), 100 * (wat > 0.5).mean()))
    js = '  const LD = ' + str(data).replace("'", '"') + ';'
    src = open(OUT, encoding='utf-8').read()
    src2 = re.sub(r'(// podatki \(tools/furka-ledenik\.py\)\n).*?(\n  // konec podatkov)', lambda m: m.group(1) + js + m.group(2), src, flags=re.S)
    if src2 == src and js not in src: sys.exit('ni oznak podatkov v ' + OUT)
    open(OUT, 'w', encoding='utf-8').write(src2); log('zapisano', OUT)

if __name__ == '__main__':
    main()
