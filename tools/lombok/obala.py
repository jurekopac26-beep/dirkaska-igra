# Lombok, Indonezija: the coast by the circuit from OSM (natural=beach, natural=cliff, place=islet): tools/lombok/obala.json for build.py.
#   python3 -I tools/lombok/obala.py <the area's OSM file (.osm, the map's export round the circuit)>
# In the data's frame of lombok.json (x east, z south, metres from lat0/lon0, WGS84 radii at lat0); only what lies within 1.6 km of the circuit.
import json, math, os, sys
import xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); J = json.load(open(os.path.join(HERE, 'lombok.json')))
A, F = 6378137.0, 1 / 298.257223563; E2 = F * (2 - F); lat0, lon0 = J['lat0'], J['lon0']
s = math.sin(math.radians(lat0)); w = 1 - E2 * s * s; M = A * (1 - E2) / w ** 1.5; N = A / math.sqrt(w); C = math.cos(math.radians(lat0))
LINE = np.array(J['line'], float).reshape(-1, 2); R = 1600

def xz(la, lo): return (math.radians(lo - lon0) * N * C, -math.radians(la - lat0) * M)
def near(pts): P = np.array(pts); return min(float(np.min(np.hypot(LINE[:, 0] - x, LINE[:, 1] - z))) for x, z in P[::2]) < R
def flat(pts): return [round(v, 1) for p in pts for v in p]

root = ET.parse(sys.argv[1]).getroot(); nodes = {}; ways = {}; rels = []
for e in root:
    t = {k.get('k'): k.get('v') for k in e.findall('tag')}
    if e.tag == 'node': nodes[e.get('id')] = xz(float(e.get('lat')), float(e.get('lon')))
    elif e.tag == 'way': ways[e.get('id')] = ([n.get('ref') for n in e.findall('nd')], t)
    elif e.tag == 'relation': rels.append(([(m.get('ref'), m.get('role')) for m in e.findall('member') if m.get('type') == 'way'], t))

def rings(wids):   # a multipolygon's outer ways joined end to end into closed rings
    segs = [list(ways[w][0]) for w in wids if w in ways]; out = []
    while segs:
        r = segs.pop(0)
        while r[0] != r[-1]:
            for i, q in enumerate(segs):
                if q[0] == r[-1]: r += q[1:]
                elif q[-1] == r[-1]: r += q[::-1][1:]
                elif q[-1] == r[0]: r = q + r[1:]
                elif q[0] == r[0]: r = q[::-1] + r[1:]
                else: continue
                segs.pop(i); break
            else: break
        if r[0] == r[-1]: out.append(r)
    return out

def pts(refs): return [nodes[n] for n in refs if n in nodes]
beach, cliff, islet = [], [], []
for wid, (refs, t) in sorted(ways.items()):
    p = pts(refs)
    if len(p) < 2 or not near(p): continue
    if t.get('natural') == 'beach' and refs[0] == refs[-1]: beach.append(flat(p[:-1]))
    elif t.get('natural') == 'cliff': cliff.append(flat(p))
    elif t.get('place') == 'islet' and refs[0] == refs[-1]: islet.append(flat(p[:-1]))
for mem, t in rels:
    if t.get('natural') != 'beach': continue
    for r in rings([ref for ref, role in mem if role in ('outer', '')]):
        p = pts(r)
        if len(p) > 3 and near(p): beach.append(flat(p[:-1]))
json.dump(dict(about='OSM (ODbL) natural=beach, natural=cliff, place=islet within %d m of the circuit; the frame of lombok.json' % R,
               beach=beach, cliff=cliff, islet=islet), open(os.path.join(HERE, 'obala.json'), 'w'), separators=(',', ':'))
print('beach', len(beach), 'cliff', len(cliff), 'islet', len(islet))
