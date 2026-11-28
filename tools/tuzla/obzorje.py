# Tuzla, Turčija: the wide horizon for def.far (tools/tuzla/build.py) -> tools/tuzla/farw.png, farb.png and obzorje.json (their frames)
#   python3 -I tools/tuzla/obzorje.py   (needs rasterio, scipy and the network: public rasters only, read in windows)
# NOT IN THE GAME (28. 11. 2026): a test of def.far (API.rsFar, 16 rings to 38 km, 180 directions, the town's share per direction) showed
# nothing from the chase camera at 7 places (0 % changed: it looks down on the road) and only a pale band in a low view, hiding the near
# world past 200 m; kept as the research for a later look (the outputs are not in the repository: run it again)
# far.png (tools/proga-podatki.py) reaches 12 km; from the circuit's hills one sees farther: the Gulf of Izmit and the Sea of Marmara to
# the south and south-west (12-20 km), the hills of the Kocaeli peninsula to the north and east, the Samanli range across the gulf. Two
# grids of 200 m cells, +-40 km round the circuit's middle:
#   farw.png: the surface, Copernicus DEM GLO-30 (as it is: the woods and the town seen from afar), encoded like far.png, the sea at 0
#             (ESA WorldCover's water class 80 where the model is below 3 m)
#   farb.png: the share of built-up land in each cell, 0-250 (ESA WorldCover 2021: class 50; the town: Tuzla, Pendik, Gebze, Kartal by the
#             sea, the new quarters on the hills)
import importlib.util, json, math, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
spec = importlib.util.spec_from_file_location('pp', os.path.join(ROOT, 'tools', 'proga-podatki.py')); pp = importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)
J = json.load(open(os.path.join(HERE, 'tuzla.json')))
F = pp.Frame(J['lat0'], J['lon0']); line = np.array(J['line']).reshape(-1, 2)
R = 40000.0; c = 200.0; n = int(2 * R / c)
cx = (line[:, 0].min() + line[:, 0].max()) / 2; cz = (line[:, 1].min() + line[:, 1].max()) / 2
x0, z0 = math.floor((cx - R) / c) * c, math.floor((cz - R) / c) * c
X, Z, lat, lon = pp.cell_centres(F, x0, z0, n, n, c)
fb = (float(lat.min()) - 0.01, float(lon.min()) - 0.01, float(lat.max()) + 0.01, float(lon.max()) + 0.01)

# the surface: 4 x coarser than the model's 30 m (~120 m), each cell's highest of its 3 x 3 neighbours' bilinear samples (no hill missed)
a, T, ep = pp.read_mosaic(pp.dem_urls(*fb), *fb, out_shape='quarter')
h = np.full(lat.shape, -1e9)
for du in (-0.33, 0, 0.33):
    for dv in (-0.33, 0, 0.33):
        la, lo = F.ll(X + du * c, Z + dv * c); h = np.maximum(h, pp.sample_grid(a, T, ep, la.ravel(), lo.ravel()).reshape(lat.shape))
# the land cover: WorldCover at 40 m, the share of each class in a cell from its 5 x 5 samples
w, Tw, ew = pp.read_mosaic(pp.wc_urls(*fb), *fb, out_shape='quarter')
bu = np.zeros(lat.shape); wa = np.zeros(lat.shape); k = 0
for du in np.linspace(-0.4, 0.4, 5):
    for dv in np.linspace(-0.4, 0.4, 5):
        la, lo = F.ll(X + du * c, Z + dv * c); v = pp.sample_grid(w, Tw, ew, la.ravel(), lo.ravel(), order=0).reshape(lat.shape)
        bu += v == 50; wa += (v == 80) | (v == 0); k += 1
bu /= k; wa /= k
h[(wa > 0.5) & (h < 3)] = 0.0; h = np.maximum(h, 0.0)
pp.save_png16(os.path.join(HERE, 'farw.png'), h)
pp.save_png8(os.path.join(HERE, 'farb.png'), np.round(bu * 250))
G = {}
G['farw'] = dict(file='farw.png', x0=x0, z0=z0, nx=n, nz=n, cell=c, enc='as dem', what='the wide horizon (tools/tuzla/obzorje.py): Copernicus DEM GLO-30 surface, each cell the highest of 9 samples; 0 = sea (ESA WorldCover water)')
G['farb'] = dict(file='farb.png', x0=x0, z0=z0, nx=n, nz=n, cell=c, enc='uint8 share of built-up land x 250 (ESA WorldCover 2021, class 50)', what='the town seen from afar (tools/tuzla/obzorje.py)')
json.dump(G, open(os.path.join(HERE, 'obzorje.json'), 'w'), ensure_ascii=False, indent=1)
print('farw', n, n, float(h.max()), 'sea cells', int((h == 0).sum()), 'built share', float(bu.mean()))
