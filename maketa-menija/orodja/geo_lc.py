# Mockup only: the real land cover over a real track's far land (geo_far.py's box, F.ll), as a picture for the helicopter's flight
# (heli.mjs, drone_page.js plantLand: the land round the game's strip planted with the game's own trees, bushes and houses where the real
# land cover has them) -> raw/geo/<track>-far-lc.png: ESA WorldCover 2021 classes (10 trees, 20 shrubs, 30 grass, 40 crops, 50 built-up,
# 60 bare, 80 water, ...) as the grey value, north at the top, ~10 m a pixel (WorldCover's own cells). After geo_far.py.
# Usage: python3 geo_lc.py [vrsic,spa]
import json, math, os, sys
import numpy as np
from PIL import Image
from geo_lib import RAW, landcover

ids = sys.argv[1].split(',') if len(sys.argv) > 1 else sorted(f[:-9] for f in os.listdir(RAW) if f.endswith('-far.json'))
for tid in ids:
    F = json.load(open(os.path.join(RAW, tid + '-far.json')))
    if 'll' not in F: print(tid, 'no far box'); continue
    la0, lo0, la1, lo1 = F['ll']
    W = int(round((lo1 - lo0) * 111320 * math.cos(math.radians((la0 + la1) / 2)) / 10)); H = int(round((la1 - la0) * 111320 / 10))
    lc = landcover(la0, lo0, la1, lo1, W, H)
    Image.fromarray(lc.astype(np.uint8), 'L').save(os.path.join(RAW, tid + '-far-lc.png'), optimize=True)
    print(tid, 'land cover', W, 'x', H, {int(k): int((lc == k).sum()) for k in np.unique(lc)}, flush=True)
