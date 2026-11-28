# Obala pod prelazom Llogara (docs/proge/llogara.md): podroben pas obale v daljnem pogledu proge llogara.
#   python3 tools/llogara/obala.py [--zapisi]
# Iz js/tracks/llogara.js vzame daljno mrežo (farDem, 250 m) in sredinsko črto; celice daljne mreže ob obali (kopno in morje v isti celici,
# razširjeno za dve celici, ne bliže cesti kot 650 m) na novo vzorči na podmreži (SUB x SUB): višine iz Copernicus DEM GLO-30, morje in
# pozidano iz ESA WorldCover 2021, barve kopnega iz Sentinel-2 L2A (10. 8. 2025, senčenje terena odstranjeno, kot tools/proga colours()).
# Morje: barva po oddaljenosti od obale (bela pena ob obali, turkizni plitvi pas, nato globoka modra far.wet): privzetek, ne meritev globine.
# Z --zapisi zamenja blok med »// ---- obala (tools/llogara/obala.py) ----« in »// ---- konec obale ----« v js/world-llogara.js.
import json, math, os, re, sys, base64
import numpy as np
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'proga'))
from lib import Geo, CopDEM, worldcover, s2_band, fetch, S2

ORIGIN = (40.20679, 19.585)   # (the start line, docs/proge/llogara.md; tools/proga's origin to a few metres: far from the road it does not show)
SCENE = 'sentinel-s2-l2a-cogs/34/T/CK/2025/8/S2A_34TCK_20250810_0_L2A/'
SUB = 5   # (the fine cells: 50 m)
REACH = 6500   # (m from the road's top)
DEEP = (0.04, 0.22, 0.42)   # (LOOK.far.wet)

src = open(os.path.join(ROOT, 'js', 'tracks', 'llogara.js')).read()
F = json.loads(re.search(r'farDem: (\{.*?\}),?\n', src).group(1))
P = np.array(json.loads(re.search(r'points: (\[\[.*?\]\]),?\n', src).group(1)))
nx, nz, cell, x0, z0 = F['nx'], F['nz'], F['cell'], F['x0'], F['z0']
b = base64.b64decode(F['b64']); FH = (np.frombuffer(b, '>u2').astype(float) / 2 + F['lo']).reshape(nz, nx)
wet = np.zeros(nx * nz, bool); p = 0; v = 0
for k in F['lake']:
    if v: wet[p:p + k] = True
    p += k; v ^= 1
wet = wet.reshape(nz, nx)
GX, GZ = np.meshgrid(x0 + np.arange(nx) * cell, z0 + np.arange(nz) * cell)
from scipy.spatial import cKDTree
kd = cKDTree(P); dr = kd.query(np.stack([GX.ravel(), GZ.ravel()], -1))[0].reshape(nz, nx)

# the cells: the shore's (wet and dry corners) and two round them; none near the road (the near world's land, the corridor's hole)
c4 = lambda a: np.stack([a[:-1, :-1], a[:-1, 1:], a[1:, :-1], a[1:, 1:]])
shore = c4(wet).any(0) & ~c4(wet).all(0)
cellm = ndimage.binary_dilation(shore, np.ones((5, 5), bool)) & (c4(dr).min(0) >= 650)
# (only the coast below the pass, within REACH of the road's top: farther along it the haze takes it all, the far grid's 250 m does)
CX, CZ = (GX[:-1, :-1] + cell / 2), (GZ[:-1, :-1] + cell / 2)
cellm &= np.hypot(CX - 900, CZ - 1300) < REACH
cj, ci = np.nonzero(cellm)
J0, J1, I0, I1 = cj.min(), cj.max() + 1, ci.min(), ci.max() + 1
print('cells %d (shore %d), box i %d-%d j %d-%d' % (cellm.sum(), shore.sum(), I0, I1, J0, J1))
M = cellm[J0:J1, I0:I1]; ni, nj = I1 - I0, J1 - J0
# the fine nodes over the box
fx = x0 + (I0 + np.arange(ni * SUB + 1) / SUB) * cell; fz = z0 + (J0 + np.arange(nj * SUB + 1) / SUB) * cell
FX, FZ = np.meshgrid(fx, fz)
used = np.zeros(FX.shape, bool)
for j, i in zip(*np.nonzero(M)): used[j * SUB:(j + 1) * SUB + 1, i * SUB:(i + 1) * SUB + 1] = True
# the region's edge: fine nodes of a used cell's side that a coarse (unrefined) cell shares
Mp = np.pad(M, 1)
edge = np.zeros(FX.shape, bool)
for j, i in zip(*np.nonzero(M)):
    y0, xa = j * SUB, i * SUB
    if not Mp[j + 1, i]: edge[y0:y0 + SUB + 1, xa] = True             # west neighbour coarse
    if not Mp[j + 1, i + 2]: edge[y0:y0 + SUB + 1, xa + SUB] = True   # east
    if not Mp[j, i + 1]: edge[y0, xa:xa + SUB + 1] = True             # north
    if not Mp[j + 2, i + 1]: edge[y0 + SUB, xa:xa + SUB + 1] = True   # south
    # (the corners shared only diagonally with a coarse cell)
    for dj, di, yy, xx in [(0, 0, y0, xa), (0, 2, y0, xa + SUB), (2, 0, y0 + SUB, xa), (2, 2, y0 + SUB, xa + SUB)]:
        if not Mp[j + dj, i + di]: edge[yy, xx] = True

G = Geo(*ORIGIN)
la, lo = G.to_ll(FX, FZ)
D = CopDEM(float(la.min()) - 0.01, float(lo.min()) - 0.01, float(la.max()) + 0.01, float(lo.max()) + 0.01)
H = np.nan_to_num(D.sample(la, lo), nan=0.0)
# the sea: WorldCover's water, at the fine node and round it (a node is sea when most of its 50 m is)
acc = np.zeros(FX.shape)
for ox, oz in [(0, 0), (-15, -15), (15, -15), (-15, 15), (15, 15)]:
    a, o = G.to_ll(FX + ox, FZ + oz); acc += (worldcover(a, o) == 80)
sea = acc >= 3
blt = worldcover(la, lo) == 50
H = np.where(sea, -1.0, np.maximum(H, 0.6))   # (the sea just below the land's lowest; the land at least a little above it)
# the edge: the far grid's own heights along the coarse cells' sides (linear between its nodes: the seams close)
gi = (FX - x0) / cell; gj = (FZ - z0) / cell
i_ = np.clip(np.floor(gi).astype(int), 0, nx - 2); j_ = np.clip(np.floor(gj).astype(int), 0, nz - 2); u = gi - i_; w = gj - j_
FHi = (FH[j_, i_] * (1 - u) + FH[j_, i_ + 1] * u) * (1 - w) + (FH[j_ + 1, i_] * (1 - u) + FH[j_ + 1, i_ + 1] * u) * w
H = np.where(edge, FHi, H)
# the land's colour: Sentinel-2 (true colour; the shading of the scene's sun taken out; the brightness as tools/proga's)
j_m = json.loads(fetch(S2 + SCENE + SCENE.split('/')[-2] + '.json', 's2/' + SCENE.split('/')[-2] + '.json'))['properties']
az, el = math.radians(j_m['view:sun_azimuth']), math.radians(j_m['view:sun_elevation'])
rgb = np.zeros(FX.shape + (3,))
for ox, oz in [(0, 0), (-10, -10), (10, -10), (-10, 10), (10, 10)]:
    a, o = G.to_ll(FX + ox, FZ + oz); rgb += np.stack([s2_band(SCENE, bd, a, o) for bd in ['B04', 'B03', 'B02']], -1)
rgb = rgb / 5 / 10000.0
gy_, gx_ = np.gradient(ndimage.gaussian_filter(np.maximum(H, 0), 0.7), cell / SUB)
n = np.stack([-gx_, np.ones_like(H), -gy_], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
sun = np.array([math.sin(az) * math.cos(el), math.sin(el), -math.cos(az) * math.cos(el)])
sh = np.clip(n @ sun / max(0.2, math.sin(el)), 0.35, 1.6)
rgb = np.clip(rgb / sh[..., None], 0, 1) ** (1 / 2.2)
land = used & ~sea
med = np.median(rgb[land].mean(-1)); rgb = np.clip(rgb * (0.44 / max(0.05, med)), 0, 1)
# the sea's colour by the distance from the shore (the fine nodes' metres): the foam at the shore, the turquoise of the shallows over the
# pebbles and the limestone, the deep blue out from ~350 m
ds = ndimage.distance_transform_edt(sea) * (cell / SUB)   # (from the nearest land node)
dl = ndimage.distance_transform_edt(~sea) * (cell / SUB)
FOAM, TURQ = np.array([0.8, 0.88, 0.9]), np.array([0.12, 0.52, 0.6])
t1 = np.clip((ds - 50) / 60, 0, 1)[..., None]; t2 = np.clip((ds - 110) / 260, 0, 1)[..., None]
seac = FOAM * (1 - t1) + TURQ * t1; seac = seac * (1 - t2) + np.array(DEEP) * t2
# the land at the shore: the pale pebbles and limestone where it is low and gentle (the beaches), the cliffs' grey where it is steep
slope = np.hypot(gx_, gy_)
beach = (dl <= 50) & (H < 25) & (slope < 0.35)
rgb = np.where(beach[..., None], rgb * 0.3 + np.array([0.86, 0.84, 0.78]) * 0.7, rgb)
rgb = np.where(blt[..., None] & ~sea[..., None], rgb * 0.5 + np.array([0.86, 0.8, 0.72]) * 0.5, rgb)   # (the villages: white walls, terracotta)
col = np.where(sea[..., None], seac, rgb)
# the blend into the far view's own colours at the region's edge (JS: by the distance from the edge, in fine cells)
de = ndimage.distance_transform_edt(~edge)
wb = np.clip(de / (2 * SUB), 0, 1)
print('nodes used %d, sea %d, beach %d, built %d' % (used.sum(), (sea & used).sum(), (beach & used).sum(), (blt & used & ~sea).sum()))
q = bytearray(); hv = bytearray()
for (j, i) in zip(*np.nonzero(used)):
    r, g, bb = col[j, i]; vv = (int(round(r * 31)) << 11) | (int(round(g * 63)) << 5) | int(round(bb * 31)); q += bytes([vv >> 8, vv & 255])
    h = int(np.clip(round((H[j, i] + 10) * 2), 0, 65535)); hv += bytes([h >> 8, h & 255, int(round(wb[j, i] * 255))])
mrow = ''.join('1' if m else '0' for m in M.ravel())
mhex = '%x' % int('1' + mrow, 2)
out = {'i0': int(I0), 'j0': int(J0), 'ni': int(ni), 'nj': int(nj), 'sub': SUB, 'mask': mhex, 'h': base64.b64encode(bytes(hv)).decode(), 'c': base64.b64encode(bytes(q)).decode()}
print('bytes: h %d, c %d' % (len(out['h']), len(out['c'])))
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'obala.json'), 'w'))
if '--zapisi' in sys.argv:
    p_ = os.path.join(ROOT, 'js', 'world-llogara.js'); s = open(p_).read()
    A, B = '  // ---- obala (tools/llogara/obala.py) ----\n', '  // ---- konec obale ----\n'
    blk = A + '  const COAST = ' + json.dumps(out, separators=(',', ':')) + ';\n' + B
    s = s[:s.index(A)] + blk + s[s.index(B) + len(B):] if A in s else s
    open(p_, 'w').write(s); print('zapisano')
