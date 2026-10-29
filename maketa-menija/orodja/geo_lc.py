# Mockup only: the real land cover over each track's far land (raw/geo/<track>-far.json, its lat/lon box ll) -> raw/geo/<track>-far-lc.png:
# the ESA WorldCover classes (10 trees, 20 shrubs, 30 grass, 40 crops, 50 built-up, 60 bare, 70 snow, 80 water, 90 wetland, ...) as the
# grey level, north at the top, n x n pixels over the box (about 12 m a pixel). drone_page.js plants the helicopter's land round the game's
# strip from it (the woods, the scrub, the villages) and intro_data.py moves a town's or a lake's mark onto it.
# Usage: python3 geo_lc.py [vrsic,spa]   (after geo_far.py)
import json, math, os, sys
import numpy as np
from PIL import Image
from geo_lib import RAW, landcover

ids = sys.argv[1].split(',') if len(sys.argv) > 1 else [f[:-9] for f in sorted(os.listdir(RAW)) if f.endswith('-far.json')]
for tid in ids:
    F = json.load(open(os.path.join(RAW, tid + '-far.json')))
    if 'll' not in F: print(tid, 'no box (geo_far.py --notex)'); continue
    la0, lo0, la1, lo1 = F['ll']; span = (la1 - la0) * 111320
    n = int(min(2048, max(512, span / 12)))
    lc = landcover(la0, lo0, la1, lo1, n, n)
    Image.fromarray(lc, 'L').save(os.path.join(RAW, tid + '-far-lc.png'), optimize=True)
    print(tid, 'land cover', n, 'x', n, {int(k): int((lc == k).sum()) for k in np.unique(lc)}, flush=True)
