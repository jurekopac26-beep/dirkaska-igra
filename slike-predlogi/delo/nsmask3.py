# the masks for the smaller circuit's clean-up (19. 10.; nsmask.py's R and G, and three more), 0.5 m:
#   R: the makadam family - inside the loop from 2.8 m in on the asphalt to 12 m past its edge; outside only on the asphalt's edge; not at mouths
#   G: the old infield gravel's transparent layers - everywhere inside the loop
#   E: the old grit shoulder (its jagged teeth along the asphalt's edge) - both sides, from 3.3 m in on the asphalt to 6 m past its edge
#   K: other roads' and lots' asphalt over the circuit's own (the darker patches on it) - the circuit's asphalt but its last 0.3 m
#   LS: the lots' raised flat slabs - not over the circuit's asphalt; by the SE bend's lot not nearer than 3 m past the edge (their stair-
#       stepped cells over the old dirt strip); KB: the grass overlays (gr18) not over the kerbs' band
#   B: the banked hairpin's bowl apron inside the loop - its blotches evened out; HB: the hole patches lying on it
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
keep = np.ones_like(D)
for n, m, u, w in TM.MOUTHS:
    dm = np.hypot(Xg - m[0], Zg - m[1]); keep = np.minimum(keep, sst(w / 2 + 4.0, w / 2 + 6.0, dm))
inner = INS * sst(HW - 3.3, HW - 2.8, D) * (1 - sst(HW + 11.0, HW + 13.0, D))
outer = (~INS) * sst(HW - 2.3, HW - 1.8, D) * (1 - sst(HW + 0.1, HW + 0.5, D))
M = {'R': np.maximum(inner, outer) * keep,
     'G': INS * sst(HW - 4.5, HW - 4.0, D),
     'E': sst(HW - 3.8, HW - 3.3, D) * np.where(INS, 1 - sst(HW + 6.0, HW + 8.0, D), 1 - sst(HW + 0.3, HW + 0.6, D)) * keep,      # (outside: only on the asphalt - beyond it the grit layer is the run-offs' own sand)
     'K': 1 - sst(HW - 0.6, HW - 0.25, D),
     'LS': np.maximum(1 - sst(HW - 0.6, HW - 0.25, D), (Xg > 100) * (Zg > 40) * (1 - sst(HW + 2.7, HW + 3.0, D))),
     'KB': sst(HW - 1.2, HW - 0.8, D) * (1 - sst(HW + 1.7, HW + 2.1, D)),
     'B': INS * sst(HW - 0.5, HW + 0.5, D),
     'HB': INS * sst(HW - 0.5, HW + 0.5, D) * ((Xg > -210) & (Xg < -128) & (Zg > 46) & (Zg < 154))}      # (the old hole patches on the bowl apron)
out = {'x0': X0, 'z0': Z0, 'S': S, 'nx': NX, 'nz': NZ}
for k, A in M.items():
    a = (np.clip(A, 0, 1) * 255).round().astype(np.uint8); Image.fromarray(a).save('nsmask3-%s.png' % k)
    out[k] = base64.b64encode(np.ascontiguousarray(a).tobytes()).decode(); print(k, 'area %.0f m2' % (A.sum() * S * S))
json.dump(out, open('nsmask3.json', 'w'))
