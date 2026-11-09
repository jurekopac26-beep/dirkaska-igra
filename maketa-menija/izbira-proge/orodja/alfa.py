# the transparent car picture from avto.mjs's two shots (on black and on white: the difference is the alpha), cut to the car
# usage: python3 alfa.py <name> (reads <name>_k.png and <name>_w.png from OUT, writes ../mk/<name>.webp)
import sys, os, numpy as np
from PIL import Image
n = sys.argv[1]; d = os.environ.get('OUT', '/tmp/maketa-izbira-proge') + '/'
k = np.asarray(Image.open(d + n + '_k.png').convert('RGB')).astype(float); w = np.asarray(Image.open(d + n + '_w.png').convert('RGB')).astype(float)
a = np.clip(1 - (w - k).mean(axis=2) / 255, 0, 1)
col = np.clip(np.where(a[..., None] > 0.004, k / np.maximum(a[..., None], 0.004), 0), 0, 255)
im = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), 'RGBA'); ys, xs = np.nonzero(a > 0.03)
im.crop((xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3)).save(os.path.join(os.path.dirname(__file__), '..', 'mk', n + '.webp'), quality=90)
