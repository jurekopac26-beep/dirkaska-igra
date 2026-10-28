# the user's red (add sand) and green (remove) marks on six map tiles of 24-M (17. 10.), isolated by difference with the rendered tile
import json, sys
import numpy as np
from PIL import Image
sys.path.insert(0, '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad')
from topmarks import comps, fill_inside
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
CXS, CZS = [-245, 0, 245], [-285, -40, 205]; TILES = [(cx, cz) for cz in CZS for cx in CXS]
JOBS = [('m_202711_0_1200x1500.jpg', 8), ('m_202711_1_1200x1500.jpg', 7), ('m_202711_2_1200x1500.jpg', 4), ('m_202711_3_1200x1500.jpg', 2), ('m_202711_4_1200x1500.jpg', 1), ('m_202723_0_1200x1500.jpg', 9)]
OUT = {}
for fn, k in JOBS:
    cx, cz = TILES[k - 1]; U = np.asarray(Image.open(SP + 'uimg/' + fn).convert('RGB')).astype(int)[:1200, :1200]; Rr = np.asarray(Image.open(SP + 'sh-fin-M%02d.png' % k).convert('RGB')).astype(int)
    D = np.abs(U - Rr).sum(axis=2) > 90; r, g, b = U[:, :, 0], U[:, :, 1], U[:, :, 2]
    RED = D & (r > 140) & (g < 70) & (b < 70) & (r - g > 90); GRN = D & (g > 140) & (r < 90) & (b < 90) & (g - r > 70)
    W = lambda u, v: [round(float(cx + (u - 600) * 250 / 1200), 2), round(float(cz + (v - 600) * 250 / 1200), 2)]
    res = {}
    for name, M in (('red', RED), ('green', GRN)):
        L = []
        for pts in comps(M, minpx=25):
            ins, area = fill_inside(pts); closed = len(ins) > 0.25 * area and len(ins) > 20
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            L.append({'n': len(pts), 'closed': closed, 'stroke': [W(x, y) for (x, y) in pts[::2]], 'inside': [W(x, y) for (x, y) in ins[::3]] if closed else [], 'bbox': [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]})
        res[name] = L
    OUT['M%02d' % k] = res
    for name in ('red', 'green'):
        for i, c in enumerate(res[name]):
            xs = [p[0] for p in c['stroke']]; zs = [p[1] for p in c['stroke']]
            print('Mapa %d' % (k + 1), name, i, c['n'], 'closed' if c['closed'] else 'open', len(c['inside']), 'x %.1f..%.1f z %.1f..%.1f' % (min(xs), max(xs), min(zs), max(zs)), c['bbox'])
json.dump(OUT, open(SP + 'marks17.json', 'w'))
