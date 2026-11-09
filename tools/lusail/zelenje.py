# Lusail, Katar: the circuit's lawns, sand, car parks and palms from the OSM download of tools/proga-podatki.py (its RAW/lusail-osm.json),
# for tools/lusail/build.py. The data tool's land use (lu.png) has the circuit's whole fenced grounds (leisure=sports_centre) as one park,
# so the lawns, the sand and the paved areas inside it are cut out here from their own OSM areas:
#   python3 -I tools/lusail/zelenje.py RAW/lusail-osm.json   -> tools/lusail/zel.png, tools/lusail/palme.json
# zel.png: 8 m cells over the data's land-cover grid (tools/lusail/lusail.json, grids.lc: x0, z0 in the data's frame), uint8: 0 nothing
# mapped (the desert's gravel plain), 1 a lawn or a garden (leisure=garden, landuse=grass, landuse=greenery, leisure=pitch, natural=shrubbery),
# 2 sand (natural=sand), 3 paved (amenity=parking, area:highway, closed ways with surface=asphalt); later classes drawn over earlier ones.
# palme.json: the lone trees (natural=tree, and natural=tree_row every 7 m along it) within 220 m of the centre line: [x, z, ...] (0.1 m).
# Data: © OpenStreetMap contributors (ODbL 1.0); the files derived from it are under the ODbL 1.0 too.
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'lusail.json'))); lat0, lon0 = J['lat0'], J['lon0']
D = json.load(open(sys.argv[1])); NODES, WAYS, RELS = D['nodes'], D['ways'], D.get('rels', {})
A_WGS, E2 = 6378137.0, 0.00669437999014   # (the data tool's frame: x = dlon N cos(lat0), z = -dlat M, WGS84 radii at lat0)
sn = math.sin(math.radians(lat0)); w = 1 - E2 * sn * sn; RM = A_WGS * (1 - E2) / w ** 1.5; RN = A_WGS / math.sqrt(w); CL = math.cos(math.radians(lat0))
def xz(n): la, lo = NODES[n][0], NODES[n][1]; return (math.radians(lo - lon0) * RN * CL, -math.radians(la - lat0) * RM)

P = np.array(J['line']).reshape(-1, 2)
G = J['grids']['lc']; CELL = 8.0; X0, Z0 = G['x0'], G['z0']; NX = int(G['nx'] * G['cell'] / CELL); NZ = int(G['nz'] * G['cell'] / CELL)

def kind(t):
    if t.get('amenity') == 'parking' or 'area:highway' in t or (t.get('surface') == 'asphalt' and t.get('area') != 'no' and 'highway' not in t): return 3
    if t.get('natural') == 'sand': return 2
    if t.get('leisure') in ('garden', 'pitch') or t.get('landuse') in ('grass', 'greenery') or t.get('natural') == 'shrubbery': return 1
    return 0

polys = {1: [], 2: [], 3: []}
for wid, (refs, tags) in WAYS.items():
    k = kind(tags)
    if k and len(refs) > 3 and refs[0] == refs[-1]: polys[k].append(([xz(n) for n in refs if n in NODES], False))
for rid, rel in RELS.items():   # multipolygons: their outer rings (closed member ways) drawn, the inner rings cut out again
    mem, tags = rel if isinstance(rel, list) else (rel.get('members', []), rel.get('tags', {}))
    k = kind(tags)
    if not k or tags.get('type') != 'multipolygon': continue
    for m in mem:
        typ, ref, role = (m + ['', '', ''])[:3] if isinstance(m, list) else (m.get('type'), str(m.get('ref')), m.get('role'))
        if typ in ('w', 'way') and str(ref) in WAYS:
            refs = WAYS[str(ref)][0]
            if len(refs) > 3 and refs[0] == refs[-1]: polys[k].append(([xz(n) for n in refs if n in NODES], role == 'inner'))

img = Image.new('L', (NX, NZ), 0); dr = ImageDraw.Draw(img)
px = lambda p: [((x - X0) / CELL, (z - Z0) / CELL) for x, z in p]
for k in (1, 2, 3):
    for p, inner in polys[k]:
        if len(p) >= 3: dr.polygon(px(p), fill=0 if inner else k)
img.save(os.path.join(HERE, 'zel.png'), optimize=True)
a = np.asarray(img); print('zel.png', NX, 'x', NZ, 'cells of %g m;' % CELL, ', '.join('%s %d' % (nm, int((a == k).sum())) for k, nm in ((1, 'lawn'), (2, 'sand'), (3, 'paved'))))

tr = []
def near(x, z): return float(np.hypot(P[:, 0] - x, P[:, 1] - z).min()) < 220
for nid, v in NODES.items():
    if len(v) > 2 and v[2] and v[2].get('natural') == 'tree':
        x, z = xz(nid)
        if near(x, z): tr += [round(x, 1), round(z, 1)]
for wid, (refs, tags) in WAYS.items():
    if tags.get('natural') != 'tree_row': continue
    q = [xz(n) for n in refs if n in NODES]
    for (ax, az), (bx, bz) in zip(q, q[1:]):
        L = math.hypot(bx - ax, bz - az); m = max(1, int(round(L / 7)))
        for t in range(m):
            x, z = ax + (bx - ax) * t / m, az + (bz - az) * t / m
            if near(x, z): tr += [round(x, 1), round(z, 1)]
json.dump({'about': 'Lusail: the lone trees (OSM natural=tree, natural=tree_row every 7 m) within 220 m of the centre line, [x, z, ...] in the frame of '
           'tools/lusail/lusail.json (m, x east, z south); tools/lusail/zelenje.py. © OpenStreetMap contributors, ODbL 1.0', 'tr': tr},
          open(os.path.join(HERE, 'palme.json'), 'w'), separators=(',', ':'))
print('palme.json', len(tr) // 2, 'trees')
