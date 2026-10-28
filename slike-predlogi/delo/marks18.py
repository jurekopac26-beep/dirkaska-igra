# the user's marks of 17. 10. evening (green = light run-off sand, red = makadam road): the strokes isolated by the difference with the pictures
# we sent (vse18-novo), per tile -> marks18.npz (bool masks per colour in world cells of 0.5 m, over the whole map) + a preview
import numpy as np
from PIL import Image
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
IM = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/images/'
J = [(19, '28-M02-mapa-zgoraj-levo.jpg', -370, -410), (20, '28-M03-mapa-zgoraj-na-sredini.jpg', -125, -410), (21, '28-M05-mapa-levo-na-sredini.jpg', -370, -165),
     (22, '28-M08-mapa-spodaj-levo.jpg', -370, 80), (23, '28-M09-mapa-spodaj-na-sredini.jpg', -125, 80)]
S = 0.5; GX0, GZ0, GX1, GZ1 = -372, -412, 372, 332; NX, NZ = int((GX1 - GX0) / S), int((GZ1 - GZ0) / S)
RED = np.zeros((NZ, NX), bool); GRN = np.zeros((NZ, NX), bool)
for n, orig, x0, z0 in J:
    U = np.asarray(Image.open(IM + '%d.webp' % n).convert('RGB')).astype(int)[:1200]
    O = np.asarray(Image.open(SP + 'vse18-novo/' + orig).convert('RGB')).astype(int)[:1200]
    D = np.abs(U - O).sum(2) > 70
    r, g, b = U[..., 0], U[..., 1], U[..., 2]
    red = D & (r > 140) & (g < 60) & (b < 60) & (r - g > 100)
    grn = D & (g > 130) & (r < 90) & (b < 90) & (g - r > 70)
    for M, OUT, nm in ((red, RED, 'red'), (grn, GRN, 'grn')):
        vs, us = np.nonzero(M)
        print(n, nm, len(us), (us.min(), vs.min(), us.max(), vs.max()) if len(us) else '')
        xs = x0 + (us + 0.5) / 4.8; zs = z0 + (vs + 0.5) / 4.8
        i = ((xs - GX0) / S).astype(int); j = ((zs - GZ0) / S).astype(int); OUT[j, i] = True
np.savez_compressed(SP + 'marks18.npz', red=RED, grn=GRN, g=np.array([GX0, GZ0, S, NX, NZ]))
pv = np.zeros((NZ, NX, 3), np.uint8) + 40; pv[GRN] = (0, 200, 0); pv[RED] = (220, 0, 0)
Image.fromarray(pv).resize((NX // 2, NZ // 2)).save(SP + 'marks18-pv.png'); print('ok', NX, NZ)
