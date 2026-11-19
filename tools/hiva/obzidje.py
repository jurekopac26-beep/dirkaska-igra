# Hiva: the landmark's data from OpenStreetMap (the walls of Itchan Kala, their towers and the four gates) -> tools/hiva/obzidje.json
#   python3 -I tools/hiva/obzidje.py [map.osm]
# Without a file it downloads the box round the old town from the OSM API (api.openstreetmap.org/api/0.6/map; ODbL 1.0, README.md, "Zasluge").
# The shared tools/proga-podatki.py keeps only the walls within 30 m of the road (its DIST walls); the old town's walls stand 6-70 m from it,
# so the landmark takes them here, whole, in the data's frame (tools/hiva/hiva.json: metres from lat0/lon0, x east, z south), and
# tools/hiva/build.py world writes them into js/data/hiva.js (cwall, towers, gates). Nothing is added that OSM does not have.
import json, math, os, sys, urllib.request, xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'hiva.json')))
BOX = (41.372, 60.352, 41.384, 60.368)   # (south, west, north, east): Itchan Kala and the streets round it
NEAR_WALL, NEAR_TOWER, NEAR_GATE = 100.0, 90.0, 100.0   # (metres from the road's centre line; the camera sees ~60 m beside it)

A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F)
s = math.sin(math.radians(J['lat0'])); w = 1 - E2 * s * s
M, N = A * (1 - E2) / w ** 1.5, A / math.sqrt(w); C = math.cos(math.radians(J['lat0']))
def xz(lat, lon): return (math.radians(lon - J['lon0']) * N * C, -math.radians(lat - J['lat0']) * M)

line = np.array(J['line'], float).reshape(-1, 2)   # (the centre line: x, z, ...)
def dist(p): return float(np.min(np.hypot(line[:, 0] - p[0], line[:, 1] - p[1])))

if len(sys.argv) > 1: root = ET.parse(sys.argv[1]).getroot()
else:
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%s,%s,%s,%s' % (BOX[1], BOX[0], BOX[3], BOX[2])
    root = ET.fromstring(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'dirkaska-igra track tools'}), timeout=120).read())
nodes = {n.get('id'): xz(float(n.get('lat')), float(n.get('lon'))) for n in root.iter('node')}
def tags(e): return {t.get('k'): t.get('v') for t in e.findall('tag')}
def num(v, d):
    try: return float(str(v).split()[0].replace(',', '.'))
    except (TypeError, ValueError): return d
r1 = lambda v: round(v, 1)

out = {'about': 'OSM (ODbL 1.0), the data\'s frame of hiva.json: cwall [osm id, height, [x, z, ...]] (barrier=city_wall, not ruins, within %d m), '
       'towers [osm id, x, z] (tower:type=defensive, within %d m), gates [osm id, height, [x, z, ...]] (historic=city_gate footprints; height: '
       'height, else building:levels x 3.5 m, else 12 m)' % (NEAR_WALL, NEAR_TOWER), 'cwall': [], 'towers': [], 'gates': []}
for wy in root.iter('way'):
    t = tags(wy); pts = [nodes[x.get('ref')] for x in wy.findall('nd') if x.get('ref') in nodes]
    if len(pts) < 2: continue
    d = min(dist(p) for p in pts)
    if t.get('barrier') == 'city_wall' and t.get('historic') != 'ruins' and d < NEAR_WALL:
        out['cwall'].append([int(wy.get('id')), num(t.get('height'), 9.0), [r1(v) for p in pts for v in p]])
    elif t.get('historic') == 'city_gate' and d < NEAR_GATE:
        h = num(t.get('height'), 0) or num(t.get('building:levels'), 0) * 3.5 or 12.0
        out['gates'].append([int(wy.get('id')), h, [r1(v) for p in pts for v in p]])
for n in root.iter('node'):
    if tags(n).get('tower:type') == 'defensive':
        p = nodes[n.get('id')]
        if dist(p) < NEAR_TOWER: out['towers'].append([int(n.get('id')), r1(p[0]), r1(p[1])])
for k in ('cwall', 'towers', 'gates'): out[k].sort()
path = os.path.join(HERE, 'obzidje.json'); json.dump(out, open(path, 'w'), separators=(',', ':')); open(path, 'a').write('\n')
print('wrote', path, '; walls', len(out['cwall']), '(%d points)' % sum(len(c[2]) // 2 for c in out['cwall']), '; towers', len(out['towers']), '; gates', len(out['gates']))
