# Pregled podatkov proge (tools/proga/raw/<id>.json): raba tal, barve tal in cesta v slikah raw/<id>-lc.png, raw/<id>-col.png
import json, sys, os, base64
import numpy as np
from PIL import Image, ImageDraw
from lib import RAW, A64
tid = sys.argv[1]; D = json.load(open(os.path.join(RAW, tid + '.json')))
L = D['lc']; cls = []; s = L['rle']; p = 0
while p < len(s):
    v = A64.index(s[p]); p += 1; n = (v & 7) + 1
    if (v & 7) == 7:
        while True:
            e = A64.index(s[p]); p += 1; n += e
            if e != 63: break
    cls += [v >> 3] * n
cls = np.array(cls[:L['nx'] * L['nz']]).reshape(L['nz'], L['nx'])
pal = np.array([[150, 170, 90], [40, 80, 40], [100, 120, 60], [200, 60, 60], [110, 105, 100], [40, 90, 170], [250, 250, 255], [175, 165, 150]], np.uint8)
im = Image.fromarray(pal[cls]).resize((L['nx'] * 2, L['nz'] * 2), Image.NEAREST); dr = ImageDraw.Draw(im)
P = np.array(D['points']); X = (P[:, 0] - L['x0']) / L['cell'] * 2; Z = (P[:, 1] - L['z0']) / L['cell'] * 2
dr.line(list(zip(X, Z)), fill=(0, 0, 0), width=2); im.save(os.path.join(RAW, tid + '-lc.png'))
M = D['dem']; c = base64.b64decode(D['col']['b64']); img = np.zeros((M['nz'], M['nx'], 3), np.uint8); q = 0
for j, (a, n) in enumerate(M['rows']):
    for i in range(a, a + n):
        v = c[q] * 256 + c[q + 1]; q += 2; img[j, i] = [(v >> 11) * 255 // 31, ((v >> 5) & 63) * 255 // 63, (v & 31) * 255 // 31]
im = Image.fromarray(img).resize((M['nx'] * 4, M['nz'] * 4), Image.BILINEAR); dr = ImageDraw.Draw(im)
X = (P[:, 0] - M['x0']) / M['cell'] * 4; Z = (P[:, 1] - M['z0']) / M['cell'] * 4; dr.line(list(zip(X, Z)), fill=(0, 0, 0), width=1); im.save(os.path.join(RAW, tid + '-col.png'))
print('ok')
