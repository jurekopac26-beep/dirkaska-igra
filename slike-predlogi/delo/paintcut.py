# (pictures only) mask where the circuit edge (shoulder, kerb, blend) lies, to cut the old 'paint-oldsand' grass cells off it
import json, base64, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
S = 0.25
rib = []
for V in 'ABC':
    for r in json.load(open('eb7-%s-ribbons.json' % V)):
        if r['road'] != 'T' or r['kind'] == 'L': continue
        p = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(r['n'], r['nr'], 2)
        a = np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(r['n'], r['nr']) if 'a' in r else np.full((r['n'], r['nr']), 255, np.uint8)
        rib.append((r['kind'], p, a))
allp = np.concatenate([p.reshape(-1, 2) for _, p, _ in rib])
x0, z0 = np.floor(allp.min(0)) - 4; x1, z1 = np.ceil(allp.max(0)) + 4
nx, nz = int((x1 - x0) / S), int((z1 - z0) / S)
print('box', x0, z0, nx, nz)
M = np.zeros((nz, nx), np.float32)
for kind, p, a in rib:
    im = Image.new('L', (nx, nz), 0); d = ImageDraw.Draw(im)
    n, nr = a.shape
    for i in range(n - 1):
        for j in range(nr - 1):
            v = int(a[i:i + 2, j:j + 2].mean()) if kind == 'B' else (255 if a[i:i + 2, j:j + 2].max() > 0 else 0)
            if v == 0: continue
            q = [p[i, j], p[i + 1, j], p[i + 1, j + 1], p[i, j + 1]]
            d.polygon([((x - x0) / S, (z - z0) / S) for x, z in q], fill=v)
    M = np.maximum(M, np.asarray(im, np.float32) / 255)
import os
if os.path.exists('dump8700.b64'):
    T = np.frombuffer(base64.b64decode(open('dump8700.b64').read()), np.float32).reshape(-1, 3, 2)
    im = Image.new('L', (nx, nz), 0); d = ImageDraw.Draw(im)
    for t in T: d.polygon([((x - x0) / S, (z - z0) / S) for x, z in t], fill=255)
    print('strip tris', len(T)); M = np.maximum(M, np.asarray(im, np.float32) / 255)
M = nd.grey_dilation(M, size=3)
M = nd.gaussian_filter(M, 1.5)
M = np.clip(M * 1.4, 0, 1)
Image.fromarray((M * 255).astype(np.uint8)).save('paintcut-mask.png')
json.dump({'x0': float(x0), 'z0': float(z0), 'S': S, 'nx': nx, 'nz': nz, 'm': base64.b64encode((M * 255).astype(np.uint8).tobytes()).decode()}, open('paintcut.json', 'w'))
print('ok', (M > 0.5).mean())
