# Cromwell, Nova Zelandija: what tools/proga-podatki.py leaves out, from the same OpenStreetMap download (its RAW directory): the circuit's
# own asphalt off the lap (the parts of the route's ways w234778728, w234778729 and w234778731 that the long lap does not use: the tool keeps
# the route's ways out of its roads), the speedway's whole oval, the power lines' pylons and the main roads round the circuit (beyond the
# tool's 150 m). Plain geometry only (no names: the circuit, its streets and the roads round it are named after people or races).
#   python3 -I tools/cromwell/okolica.py <RAW>   -> tools/cromwell/okolica.json (the tool's frame: x east, z south, origin the route's
#   first point). tools/cromwell/build.py reads it (sk.lk, sk.dt, sk.road and sk.lm of js/tracks/cromwell.js). Plan: docs/dirkalisca-celine.md.
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'cromwell.json')))
LAT0, LON0 = C['lat0'], C['lon0']
A, E2 = 6378137.0, 6.69437999014e-3
PH = math.radians(LAT0); NR = A / math.sqrt(1 - E2 * math.sin(PH) ** 2); MR = A * (1 - E2) / (1 - E2 * math.sin(PH) ** 2) ** 1.5

# the long lap's unused stretches of its own ways [way, first node, last node (indices along the way), what]
LINKS = [('234778731', 42, 43, 'the straight beside the chicane before the south loop'),
         ('234778728', 11, 12, 'the straight beside the bends north of the south-west hairpin'),
         ('234778729', 0, 7, 'the loop from the north end of the east straight to the esses'),
         ('234778729', 34, 37, 'the short cut of the far west loop'),
         ('234778731', 74, 75, 'the club lap\'s short cut past the bridge'),
         ('234778728', 0, 6, 'the link from the west loop to the straight over the bridge')]

def main(raw):
    J = json.load(open(os.path.join(raw, 'cromwell-osm.json'))); N = J['nodes']; W = J['ways']
    def xz(n): lat, lon = N[n][0], N[n][1]; return [round(math.radians(lon - LON0) * NR * math.cos(PH) * 2) / 2, round(-math.radians(lat - LAT0) * MR * 2) / 2]
    def near(q, r): return math.hypot(q[0] + 150, q[1] - 100) < r   # (from the middle of the circuit)
    out = {'about': 'tools/cromwell/okolica.py from the OSM download of tools/proga-podatki.py (tools/cromwell/config.json); the frame of tools/cromwell/cromwell.json',
           'links': '[osm, what, [x, z, ...]]: the long lap\'s unused stretches of its own raceway ways (asphalt as the circuit\'s)',
           'oval': '[osm, [x, z, ...]]: the speedway\'s oval (OSM highway=raceway, sport=car_racing: a clay oval west of the circuit), closed',
           'power': '[cables, [x, z, ...]]: the power lines (OSM power=line) as their pylons in order, those within 3 km',
           'roads': '[highway, lanes, [x, z, ...]]: the main roads round the circuit (OSM highway=trunk, primary, secondary, tertiary, unclassified), the stretches within 1.5 km',
           'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0)'}
    links = []
    for w, a, b, what in LINKS:
        ids = W[w][0][a:b + 1]; links.append(['w' + w, what, sum((xz(n) for n in ids if n in N), [])])
    out['links'] = links
    oval = []
    for wid, (ids, t) in W.items():
        if t.get('highway') == 'raceway' and t.get('sport') == 'car_racing':
            pts = sum((xz(n) for n in ids if n in N), [])
            if len(pts) >= 8 and near(pts[:2], 1200): oval.append(['w' + wid, pts])
    out['oval'] = oval
    pw = []
    for wid, (ids, t) in W.items():
        if t.get('power') != 'line': continue
        pts = []
        for n in ids:
            if n in N:
                p = xz(n)
                if near(p, 3000): pts += p
                elif pts: break
        if len(pts) >= 4: pw.append([int(t.get('cables', '3') or 3), pts])
    out['power'] = pw
    roads = []
    for wid, (ids, t) in W.items():
        hw = t.get('highway')
        if hw not in ('trunk', 'trunk_link', 'primary', 'secondary', 'tertiary', 'unclassified'): continue
        run = []
        for n in ids:
            if n not in N: continue
            p = xz(n)
            if near(p, 1500): run += p
            else:
                if len(run) >= 4: roads.append([hw, int(t.get('lanes', '2') or 2), run])
                run = []
        if len(run) >= 4: roads.append([hw, int(t.get('lanes', '2') or 2), run])
    out['roads'] = roads
    open(os.path.join(HERE, 'okolica.json'), 'w').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    print('links', [(l[0], len(l[2]) // 2) for l in links], 'oval', [(o[0], len(o[1]) // 2) for o in oval], 'power lines', [(p[0], len(p[1]) // 2) for p in pw],
          'roads', [(r[0], len(r[2]) // 2) for r in roads])

if __name__ == '__main__':
    main(sys.argv[1])
