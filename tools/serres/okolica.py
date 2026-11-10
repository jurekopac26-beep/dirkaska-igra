# Serres, Grčija: what tools/proga-podatki.py leaves out, from the same OpenStreetMap download (its RAW directory): the karting track's
# whole loop (the tool keeps the roads within 150 m of the lap), the outlines of the bleachers across the straight from the pits, of the
# paddock, the camp site and the karting's grounds, the sports grounds east of the circuit (their pitches), the solar parks, the power
# line's pylons, the railway farther out (the main line east to the town's station and the branch to the old sugar works) and the main
# roads round the circuit (beyond the tool's 150 m). Plain geometry only (no names: the circuit, its karting and its camp site are named
# after the circuit, the ring road is the town's).
#   python3 -I tools/serres/okolica.py <RAW>   -> tools/serres/okolica.json (the tool's frame: x east, z south, origin the route's first
#   point). tools/serres/build.py reads it (sk.kart, sk.gs, sk.pad, sk.lm and sk.road of js/tracks/serres.js). Plan: docs/dirkalisca-celine.md.
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'serres.json')))
LAT0, LON0 = C['lat0'], C['lon0']
A, E2 = 6378137.0, 6.69437999014e-3
PH = math.radians(LAT0); NR = A / math.sqrt(1 - E2 * math.sin(PH) ** 2); MR = A * (1 - E2) / (1 - E2 * math.sin(PH) ** 2) ** 1.5

# the outlines by their OSM ways: the bleachers (leisure=bleachers), the paddock (amenity=parking), the camp site (tourism=camp_site), the
# karting's grounds (leisure=sports_centre, sport=motor;karting)
OUTL = {'stand': '1029314651', 'paddock': '559633751', 'camp': '559633725', 'kartyard': '559633724'}

def main(raw):
    J = json.load(open(os.path.join(raw, 'serres-osm.json'))); N = J['nodes']; W = J['ways']
    def xz(n): lat, lon = N[n][0], N[n][1]; return [round(math.radians(lon - LON0) * NR * math.cos(PH) * 2) / 2, round(-math.radians(lat - LAT0) * MR * 2) / 2]
    def near(q, r): return math.hypot(q[0] + 100, q[1] - 100) < r   # (from the middle of the circuit)
    out = {'about': 'tools/serres/okolica.py from the OSM download of tools/proga-podatki.py (tools/serres/config.json); the frame of tools/serres/serres.json',
           'kart': '[osm, closed, [x, z, ...]]: the karting track (OSM highway=raceway, sport=karting) north-east of the main straight, its whole loop',
           'outl': '{what: [osm, [x, z, ...]]}: the outlines (closed): the bleachers across the straight from the pits, the paddock behind the pits, the camp site and the karting\'s grounds north-east of the straight',
           'pitch': '[sport, osm, [x, z, ...]]: the sports grounds\' pitches (OSM leisure=pitch: soccer, basketball, tennis) within 1 km, closed',
           'solar': '[osm, [x, z, ...]]: the solar parks (OSM power=plant, plant:source=solar) within 2 km, closed',
           'power': '[cables, [x, z, ...]]: the power line (OSM power=line, 150 kV) as its pylons in order, those within 3.5 km',
           'rail': '[service, [x, z, ...]]: the railway (OSM railway=rail) within 1.3 km: the main line ("" ) and the branch to the old sugar works (spur)',
           'roads': '[highway, lanes, [x, z, ...]]: the main roads round the circuit (OSM highway=primary, secondary, tertiary, unclassified and their links), the stretches within 1.5 km',
           'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0)'}
    kart = []
    for wid, (ids, t) in W.items():
        if t.get('highway') == 'raceway' and t.get('sport') == 'karting':
            pts = sum((xz(n) for n in ids if n in N), []); kart.append(['w' + wid, int(ids[0] == ids[-1]), pts])
    out['kart'] = kart
    out['outl'] = {k: ['w' + w, sum((xz(n) for n in W[w][0] if n in N), [])] for k, w in OUTL.items()}
    pitch = []
    for wid, (ids, t) in sorted(W.items()):
        if t.get('leisure') != 'pitch' or ids[0] != ids[-1]: continue
        pts = sum((xz(n) for n in ids if n in N), [])
        if near(pts[:2], 1000): pitch.append([t.get('sport', ''), 'w' + wid, pts])
    out['pitch'] = pitch
    solar = []
    for wid, (ids, t) in sorted(W.items()):
        if t.get('power') == 'plant' and t.get('plant:source') == 'solar':
            pts = sum((xz(n) for n in ids if n in N), [])
            if near(pts[:2], 2000): solar.append(['w' + wid, pts])
    out['solar'] = solar
    pw = []
    for wid, (ids, t) in sorted(W.items()):
        if t.get('power') != 'line': continue
        pts = []
        for n in ids:
            if n not in N: continue
            p = xz(n)
            if near(p, 3500): pts += p
            elif pts: break
        if len(pts) >= 4: pw.append([int(t.get('cables', '3') or 3), pts])
    out['power'] = pw
    rail = []
    for wid, (ids, t) in sorted(W.items()):
        if t.get('railway') != 'rail' or t.get('service') == 'yard': continue
        run = []
        for n in ids + [None]:
            p = xz(n) if n in N else None
            if p is not None and near(p, 1300): run += p; continue
            if len(run) >= 4: rail.append([t.get('service', ''), run])
            run = []
    out['rail'] = rail
    roads = []
    for wid, (ids, t) in sorted(W.items()):
        hw = t.get('highway')
        if hw not in ('primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'unclassified'): continue
        run = []
        for n in ids + [None]:
            p = xz(n) if n in N else None
            if p is not None and near(p, 1500): run += p; continue
            if len(run) >= 4: roads.append([hw, int(str(t.get('lanes', '2')).split(';')[0] or 2), run])
            run = []
    out['roads'] = roads
    open(os.path.join(HERE, 'okolica.json'), 'w').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    print('kart', [(k[0], k[1], len(k[2]) // 2) for k in kart], 'outlines', {k: len(v[1]) // 2 for k, v in out['outl'].items()}, 'pitches', [(p[0], p[1]) for p in pitch],
          'solar', [(s[0], len(s[1]) // 2) for s in solar], 'power', [(p[0], len(p[1]) // 2) for p in pw], 'rail', [(r[0], len(r[1]) // 2) for r in rail],
          'roads', [(r[0], r[1], len(r[2]) // 2) for r in roads])

if __name__ == '__main__':
    main(sys.argv[1])
