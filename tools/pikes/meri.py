# Realizem G · Pikes Peak, ZDA: ESA WorldCover classes and Sentinel-2 colours in the band 8–60 m either side of the real road
# (OSM: the "Pikes Peak Highway" secondary ways, chained, from the point nearest the game's start to the summit).
# Run: python3 tools/pikes/meri.py tools/proga-podatki.py <map.osm> <out dir>
#   map.osm: https://api.openstreetmap.org/api/0.6/map?bbox=-105.075,38.835,-105.015,38.92 (OSM, ODbL 1.0)
# Writes <out dir>/cover.json (the shares and colours, tools/pikes/cover.json) with build_cover from tools/proga-podatki.py.
import sys, json, importlib.util, xml.etree.ElementTree as ET, numpy as np
spec = importlib.util.spec_from_file_location('pp', sys.argv[1]); pp = importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)
r = ET.parse(sys.argv[2]).getroot(); out = sys.argv[3]
nodes = {n.get('id'): (float(n.get('lat')), float(n.get('lon'))) for n in r.iter('node')}
ways = []
for w in r.iter('way'):
    t = {x.get('k'): x.get('v') for x in w.iter('tag')}
    if t.get('highway') == 'secondary' and t.get('name') == 'Pikes Peak Highway': ways.append([nd.get('ref') for nd in w.iter('nd')])
# chain the ways end to end
chains = [ways.pop(0)]
while ways:
    c = chains[-1]; done = False
    for i, w in enumerate(ways):
        if w[0] == c[-1]: c += w[1:]; ways.pop(i); done = True; break
        if w[-1] == c[-1]: c += w[::-1][1:]; ways.pop(i); done = True; break
        if w[-1] == c[0]: c[:0] = w[:-1]; ways.pop(i); done = True; break
        if w[0] == c[0]: c[:0] = w[::-1][:-1]; ways.pop(i); done = True; break
    if not done: chains.append(ways.pop(0))
print('chains', [len(c) for c in chains])
c = max(chains, key=len); ll = np.array([nodes[i] for i in c])
st, fi = (38.9135, -105.0368), (38.8405, -105.0442)
i0 = int(np.argmin(np.hypot(ll[:, 0] - st[0], ll[:, 1] - st[1]))); i1 = int(np.argmin(np.hypot(ll[:, 0] - fi[0], ll[:, 1] - fi[1])))
print('ends', ll[0], ll[-1], 'start', i0, ll[i0], 'summit', i1, ll[i1])
seg = ll[min(i0, i1):max(i0, i1) + 1]
if i0 > i1: seg = seg[::-1]
pp.C.update({'closed': False, 'dist': {'grid': 200}})
F = pp.Frame(st[0], st[1]); x, z = F.xz(seg[:, 0], seg[:, 1]); line, L = pp.resample(np.stack([x, z], 1), 10.0, False)
print('length', round(L), 'm')
cover, grid = pp.build_cover(F, line, 10.0, out)
json.dump({'lat0': st[0], 'lon0': st[1], 'len': round(L), 'cover': cover}, open(out + '/cover.json', 'w'))
