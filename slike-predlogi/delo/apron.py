# the banked south-west hairpin's apron inside the loop (19. 10.): after the old sand went, its ground showed lilac with dark blots;
# a lawn overlay over it (the infield's grass, its tint and mown stripes), from the circuit's kerb out to the heliport lot's fence and asphalt.
# Read off a top view of the area (apron.png: centre -169,100, span 110, the edge ribbons hidden); 0.5 m grid; soft edges.
import json, base64, numpy as np
from PIL import Image, ImageDraw
import scipy.ndimage as nd
CX, CZ, SPAN = -169.0, 100.0, 110.0; S = 0.5
x0, z0, x1, z1 = -212.0, 46.0, -126.0, 155.0
nx = int((x1 - x0) / S) + 1; nz = int((z1 - z0) / S) + 1
X, Z = np.meshgrid(x0 + np.arange(nx) * S, z0 + np.arange(nz) * S)
im = Image.open('sh-apr-apron.png').convert('RGB'); ppm = im.size[0] / SPAN
F = np.asarray(im, np.float32)
def samp(A, X, Z):
    px = np.clip(((X - (CX - SPAN / 2)) * ppm).astype(int), 0, im.size[0] - 1); pz = np.clip(((Z - (CZ - SPAN / 2)) * ppm).astype(int), 0, im.size[1] - 1); return A[pz, px]
r, g, b = F[..., 0], F[..., 1], F[..., 2]; lum = 0.3 * r + 0.59 * g + 0.11 * b; mx = F.max(-1); sat = (mx - F.min(-1)) / np.maximum(mx, 1)
lotA = (lum < 100) & (sat < 0.24) & (g < r + 6)              # (the lot's dark asphalt, the circuit's too; not grass)
red = (r > 150) & (g < 90) & (b < 90); white = (F.min(-1) > 200) & (sat < 0.12)
fence = nd.binary_dilation(red | white, iterations=3)      # (the red-white fences and kerbs)
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2); HW = 6.4
mk = Image.new('L', (nx, nz), 0); ImageDraw.Draw(mk).polygon([((p[0] - x0) / S, (p[1] - z0) / S) for p in P], fill=255); INS = np.asarray(mk) > 127
seg_d = np.full(X.shape, 1e9)
for i in range(len(P)):
    a = P[i]; c = P[(i + 1) % len(P)]; d = c - a; L2 = max((d ** 2).sum(), 1e-9)
    t = np.clip(((X - a[0]) * d[0] + (Z - a[1]) * d[1]) / L2, 0, 1); seg_d = np.minimum(seg_d, np.hypot(X - a[0] - d[0] * t, Z - a[1] - d[1] * t))
LOT = samp(lotA, X, Z); FEN = samp(fence, X, Z)
LOT = nd.binary_opening(LOT, iterations=4)                 # (not the dark blots: only the big asphalt)
LOT = nd.binary_closing(LOT, iterations=2) & (seg_d > HW + 1.0)
LOT = nd.binary_fill_holes(LOT)
A = INS & (seg_d > HW + 1.9) & ~LOT & ~nd.binary_dilation(FEN, iterations=2)      # (not over the red-white kerbs and fences)
A = nd.binary_opening(A, iterations=1)
A = nd.gaussian_filter(A.astype(np.float32), 0.8)
A = np.where(LOT | (seg_d < HW + 1.6), 0, A); A = np.clip((A - 0.15) / 0.7, 0, 1)
print('apron %.0f m2' % ((A > 0.5).sum() * S * S))
Image.fromarray((A * 255).astype(np.uint8)).resize((nx * 2, nz * 2)).save('apron-mask.png')
json.dump({'x0': x0, 'z0': z0, 'S': S, 'nx': nx, 'nz': nz, 'a': base64.b64encode(np.ascontiguousarray((A * 255).round().astype(np.uint8)).tobytes()).decode()}, open('apron.json', 'w'))
