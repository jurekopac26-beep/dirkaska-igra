# the masks for "no old sand on the circuit's inner side" (user, 18./19. 10.: "zbriši po celi mali progi celoten stari pesek na notranji strani
# ceste"; "zbriši stari pesek" - the jagged makadam teeth along the asphalt's edge): 0.5 m, over the smaller circuit (T)
#   R: the makadam family (the dirt ways' makadam, the 17. 10. makadam and light-sand layers): inside the loop from 2 m in on the asphalt to
#      12 m past its edge; outside the loop only on the asphalt's edge (the teeth), not at the dirt roads' mouths
#   G: the old infield gravel family (its bed, its verge sand and the sand blown onto the asphalt): everywhere inside the loop
import json, base64, numpy as np
from PIL import Image, ImageDraw
import scipy.ndimage as nd
import tracks_all_mouths as TM
S = 0.5; X0, Z0, X1, Z1 = -225.0, -280.0, 195.0, 185.0
NX = int((X1 - X0) / S); NZ = int((Z1 - Z0) / S)
P = np.array(json.load(open('roads-geo.json'))['T']['p'], float).reshape(-1, 2); HW = 6.4
px = lambda p: ((p[0] - X0) / S, (p[1] - Z0) / S)
im = Image.new('L', (NX, NZ), 0); ImageDraw.Draw(im).polygon([px(p) for p in P], fill=255); INS = np.asarray(im) > 127
ln = Image.new('L', (NX, NZ), 0); ImageDraw.Draw(ln).line([px(p) for p in P] + [px(P[0])], fill=255, width=1); D = nd.distance_transform_edt(np.asarray(ln) < 128) * S
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
Xg, Zg = np.meshgrid(X0 + (np.arange(NX) + 0.5) * S, Z0 + (np.arange(NZ) + 0.5) * S)
inner = INS * sst(HW - 3.3, HW - 2.8, D) * (1 - sst(HW + 11.0, HW + 13.0, D))
outer = (~INS) * sst(HW - 2.3, HW - 1.8, D) * (1 - sst(HW + 0.1, HW + 0.5, D))
keep = np.ones_like(D)
for n, m, u, w in TM.MOUTHS:
    dm = np.hypot(Xg - m[0], Zg - m[1]); keep = np.minimum(keep, sst(w / 2 + 4.0, w / 2 + 6.0, dm))
R = np.maximum(inner, outer) * keep
G = INS * sst(HW - 4.5, HW - 4.0, D)
for nm, A in (('R', R), ('G', G)):
    a = (np.clip(A, 0, 1) * 255).round().astype(np.uint8)
    Image.fromarray(a).save('nsmask-%s.png' % nm)
json.dump({'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ, 'R': base64.b64encode(np.ascontiguousarray((np.clip(R, 0, 1) * 255).round().astype(np.uint8)).tobytes()).decode(),
           'G': base64.b64encode(np.ascontiguousarray((np.clip(G, 0, 1) * 255).round().astype(np.uint8)).tobytes()).decode()}, open('nsmask.json', 'w'))
print(NX, NZ, 'R area %.0f m2' % (R.sum() * S * S), 'G area %.0f m2' % (G.sum() * S * S))
for n, m, u, w in TM.MOUTHS:
    i = int((m[0] - X0) / S); j = int((m[1] - Z0) / S)
    if 0 <= i < NX and 0 <= j < NZ: print(n, 'dT %.1f' % D[j, i], 'inside' if INS[j, i] else 'outside')
for p in ((-170, 84), (150, 127), (99.9, -23.7), (-7.8, 144.5), (-18.5, -244.6)):
    i = int((p[0] - X0) / S); j = int((p[1] - Z0) / S); print(p, 'dT %.1f' % D[j, i], 'in' if INS[j, i] else 'out', 'R %.2f G %.2f' % (R[j, i], G[j, i]))
