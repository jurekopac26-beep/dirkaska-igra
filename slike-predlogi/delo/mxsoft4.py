# the motocross start blend again, after the start gate was moved west and turned along the user's red line (user, 18. 10.: "naj bo tako
# postavljen"): read off the new view (gate turned, blend off); the ground layers there are unlit, so the gate's own shadow is read off two
# views with those layers hidden (with / without the gate) as a darkening and laid at the new place; the old place filled with sand
import sys, json, base64, numpy as np
from PIL import Image
import scipy.ndimage as nd
sys.path.insert(0, '.')
import mxsoft2
from mk18_helpers import gauss, dil, sst
DX, DZ = -12.1, -0.9
CX, CZ, SPAN, BOX, S = -306, -235, 70, (-340, -268, -272, -202), 0.25
rm = np.load('rdm-mxs.npy')
res, C, NEW, A = mxsoft2.run('sh-g4-mxs.png', CX, CZ, SPAN, BOX, road=(rm, -340, -268), ell=(-308, -237, 32, 20, 6), patch=(-314, -262, 8))
x0, z0, x1, z1 = BOX; nz, nx = A.shape; X, Z = np.meshgrid(x0 + np.arange(nx) * S, z0 + np.arange(nz) * S)
def grid(png):
    im = Image.open(png).convert('RGB'); ppm = im.size[0] / SPAN; L = (x0 - S / 2 - (CX - SPAN / 2)) * ppm; T = (z0 - S / 2 - (CZ - SPAN / 2)) * ppm
    return np.asarray(im.resize((nx, nz), Image.BOX, box=(L, T, L + nx * S * ppm, T + nz * S * ppm)), np.float32)
O = grid('sh-rt5-mxs.png')                         # the old view (old gate, its shadow)
lumO = O @ np.array([0.3, 0.59, 0.11]); satO = (O.max(-1) - O.min(-1)) / np.maximum(O.max(-1), 1)
objO = ((satO < 0.16) | ((O[..., 0] > 170) & (O[..., 1] < 0.6 * O[..., 0]))) & (X > -307.5) & (X < -303.5) & (Z > -246.5) & (Z < -234.5)   # the old gate's own parts
sandO = ~objO & (O[..., 0] > O[..., 1])
mean = gauss(np.where(sandO & (lumO > 100), lumO, 0), 2.0 / S) / np.maximum(gauss((sandO & (lumO > 100)).astype(np.float32), 2.0 / S), 1e-3)
box = (X > -312) & (X < -298) & (Z > -254) & (Z < -228)          # (not the road east of it)
ratio = np.where(box & sandO & (lumO < 0.9 * mean), np.clip(lumO / np.maximum(mean, 1), 0.25, 1.0), 1.0)
ratio = np.minimum(ratio, np.where(box & objO, 0.55, 1.0))   # under the old gate's parts the shadow continues (they stood in it)
oldsh = box & (ratio < 0.97); oldsh = dil(oldsh, 3)
# the old place: the blend's own sand there, with the pad's grain, feathered into what is round it (no shadow, no green terrain through holes)
Cn = C; lumN = Cn @ np.array([0.3, 0.59, 0.11])
fill = oldsh & box
okN = ~dil(fill, 2) & (Cn[..., 0] > Cn[..., 1] + 8) & (lumN > 100)
den = gauss(okN.astype(np.float32), 2.0 / S); SM = np.stack([gauss(np.where(okN, NEW[..., c], 0), 2.0 / S) for c in range(3)], -1) / np.maximum(den, 1e-3)[..., None]
# grain: a clean patch of the pad (6 m, south of the old gate), as a ratio to its own smooth colour, mirrored and repeated
pi = int((-312 - x0) / S); pj = int((-233 - z0) / S); n = int(6 / S)
Pt = Cn[pj:pj + n, pi:pi + n]; Pr = Pt / np.maximum(np.stack([gauss(Pt[..., c], 1.0 / S) for c in range(3)], -1), 1)
Pr = np.concatenate([Pr, Pr[:, ::-1]], 1); Pr = np.concatenate([Pr, Pr[::-1]], 0)
RG = np.clip(np.tile(Pr, (nz // Pr.shape[0] + 1, nx // Pr.shape[1] + 1, 1))[:nz, :nx], 0.85, 1.15)
w = np.clip(gauss(dil(fill, 2).astype(np.float32), 0.75 / S) * 1.6, 0, 1)[..., None]
A0 = A.copy(); NW = SM * RG
NEW = np.where((A0 < 0.5)[..., None], NW, NEW * (1 - w) + NW * w)     # (where the blend drew nothing before, only the sand round it)
A = np.maximum(A, w[..., 0])
# the new place: the turned gate's real shadow, as the darkening between the two views with the layers hidden (not the checkered decal they hide)
GL = grid('sh-g4-mxsL2.png'); GN = grid('sh-g4-mxsN.png'); lw = np.array([0.3, 0.59, 0.11])
satL = (GL.max(-1) - GL.min(-1)) / np.maximum(GL.max(-1), 1)
rN = np.clip((GL @ lw) / np.maximum(GN @ lw, 1), 0.25, 1.0)
near = (X > -332) & (X < -308) & (Z > -252) & (Z < -224)
white = near & (satL < 0.1) & ((GL @ lw) > 170) & ((GN @ lw) < 170)
decal = dil(white, 4) & near & False                                 # (the decal's squares: round its white ones)
rN = np.where(near & ~decal & (GN[..., 0] > GN[..., 1]), rN, 1.0)
satN = (Cn.max(-1) - Cn.min(-1)) / np.maximum(Cn.max(-1), 1)
objN = (satN < 0.16) | ((Cn[..., 0] > 170) & (Cn[..., 1] < 0.6 * Cn[..., 0]))
newsh = (rN < 0.97) & ~dil(objN, 1)
base = np.where(newsh[..., None] & (A[..., None] < 0.5), SM * RG, NEW)
NEW = np.where(newsh[..., None], base * rN[..., None], NEW)
A = np.where(newsh, np.maximum(A, 1.0), A)
res['c'] = base64.b64encode(np.clip(NEW, 0, 255).round().astype(np.uint8).tobytes()).decode()
res['a'] = base64.b64encode((np.clip(A, 0, 1) * 255).round().astype(np.uint8).tobytes()).decode()
t = open('mxsoft-page.tpl.js').read().replace('__DATA__', json.dumps([res])); open('mxsoft-page.js', 'w').write(t)
P = C * (1 - A[..., None]) + NEW * A[..., None]
Image.fromarray(np.concatenate([C, P], 1).astype(np.uint8)).save('mxs4-prev.png')
print('old place %.1f m2, new shadow %.1f m2' % (fill.sum() * S * S, newsh.sum() * S * S))
if len(sys.argv) > 1:
    for (px, pz) in ((-295, -252), (-296, -253), (-294, -251), (-297, -250)):
        i = int(round((px - x0) / S)); j = int(round((pz - z0) / S))
        print((px, pz), 'C', C[j, i].round(), 'NEW', NEW[j, i].round(), 'A %.2f' % A[j, i], 'fill', fill[j, i], 'newsh', newsh[j, i], 'rN %.2f' % rN[j, i], 'ratio %.2f' % ratio[j, i], 'box', box[j, i])
