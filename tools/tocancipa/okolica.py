# Tocancipá, Kolumbija: the landmarks beyond the reach of tools/proga-podatki.py (it keeps what lies within a few hundred metres of the road),
# from the same OpenStreetMap download (its RAW directory): the coal-fired power plant 1.2-1.5 km north of the circuit (its stacks, boiler
# houses, turbine hall, cooling towers and coal yards), the power lines' pylons and the main roads (the trunk road with its frontage roads
# south-west of the circuit, beyond the tool's 150 m). Plain geometry only (no names: the plant is named after a person and run by a firm).
#   python3 -I tools/tocancipa/okolica.py <RAW>   -> tools/tocancipa/okolica.json (the tool's frame: x east, z south, origin the route's
#   first point). tools/tocancipa/build.py reads it (sk.lm of js/tracks/tocancipa.js). Plan: docs/dirkalisca-celine.md.
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'tocancipa.json')))
LAT0, LON0 = C['lat0'], C['lon0']
A, E2 = 6378137.0, 6.69437999014e-3
PH = math.radians(LAT0); NR = A / math.sqrt(1 - E2 * math.sin(PH) ** 2); MR = A * (1 - E2) / (1 - E2 * math.sin(PH) ** 2) ** 1.5

def main(raw):
    J = json.load(open(os.path.join(raw, 'tocancipa-osm.json'))); N = J['nodes']; W = J['ways']
    def xz(n): lat, lon = N[n][0], N[n][1]; return [round(math.radians(lon - LON0) * NR * math.cos(PH) * 2) / 2, round(-math.radians(lat - LAT0) * MR * 2) / 2]
    def near(q, r): return math.hypot(q[0] + 50, q[1] + 230) < r   # (from the middle of the circuit)
    out = {'about': 'tools/tocancipa/okolica.py from the OSM download of tools/proga-podatki.py (tools/tocancipa/config.json); the frame of tools/tocancipa/tocancipa.json',
           'stacks': '[x, z, height (m), osm]: the chimneys (OSM man_made=chimney; no height in OSM: 70 m for the power plant\'s, from the 1960s, 35 m for the factory\'s south of the circuit)',
           'plant': '[kind, height (m), osm, [x, z, ...]]: the power plant\'s buildings (OSM outlines): boiler (power=generator, steam), hall (the turbine hall), cool (man_made=cooling: mechanical-draft cooling towers), sub (the substation\'s yard)',
           'coal': '[osm, [x, z, ...]]: the coal yards (OSM landuse=landfill by the plant: the coal stored in heaps)',
           'power': '[cables, [x, z, ...]]: the power lines (OSM power=line) as their pylons in order, those within 4 km',
           'roads': '[highway, lanes, oneway, [x, z, ...]]: the trunk road, its links and the other main roads (OSM highway=trunk, trunk_link, primary, secondary, tertiary), the stretches within 900 m of the circuit',
           'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0)'}
    st = []
    for nid, v in N.items():
        if len(v) > 2 and v[2].get('man_made') == 'chimney':
            p = xz(nid)
            if near(p, 2500): st.append(p + [float(v[2].get('height', '0') or 0) or (70.0 if p[1] < -900 else 35.0), 'n' + nid])
    out['stacks'] = sorted(st, key=lambda s: s[3])
    plant = []
    for wid, (ids, t) in W.items():
        pts = sum((xz(n) for n in ids if n in N), [])
        if len(pts) < 6 or not near(pts[:2], 2500): continue
        if t.get('power') == 'generator' and t.get('building'):
            kind = 'hall' if t.get('generator:type') == 'steam_turbine' else 'boiler'
            plant.append([kind, 22.0 if kind == 'hall' else 38.0, 'w' + wid, pts])
        elif t.get('man_made') == 'cooling': plant.append(['cool', 13.0, 'w' + wid, pts])
        elif t.get('power') == 'substation' and math.hypot(pts[0] + 290, pts[1] + 1175) < 300: plant.append(['sub', 0.0, 'w' + wid, pts])
    out['plant'] = sorted(plant, key=lambda p: p[2])
    out['coal'] = sorted([['w' + wid, sum((xz(n) for n in ids if n in N), [])] for wid, (ids, t) in W.items()
                          if t.get('landuse') == 'landfill' and near(xz(ids[0]), 2500)], key=lambda c: c[0])
    pw = []
    for wid, (ids, t) in W.items():
        if t.get('power') != 'line': continue
        tw = [xz(n) for n in ids if n in N and len(N[n]) > 2 and N[n][2].get('power') in ('tower', 'portal')]
        tw = [p for p in tw if near(p, 4000)]
        if len(tw) >= 2: pw.append([int(str(t.get('cables', '3')).split(';')[0] or 3), sum(tw, []), 'w' + wid])
    out['power'] = sorted(pw, key=lambda r: r[2])
    line = [(C['line'][k], C['line'][k + 1]) for k in range(0, len(C['line']), 2)]
    def dl(p): return min(math.hypot(p[0] - a, p[1] - b) for a, b in line[::4])
    rd = []
    for wid, (ids, t) in sorted(W.items()):
        if t.get('highway') not in ('trunk', 'trunk_link', 'primary', 'secondary', 'tertiary'): continue
        run = []
        for n in ids + [None]:
            p = xz(n) if n in N else None
            if p is not None and dl(p) < 900: run.append(p); continue
            if len(run) >= 2: rd.append([t['highway'], int(str(t.get('lanes', '2')).split(';')[0] or 2), int(t.get('oneway') == 'yes'), sum(run, []), 'w' + wid])
            run = []
    out['roads'] = rd
    path = os.path.join(HERE, 'okolica.json'); open(path, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print('wrote', path, '; stacks', [s[2:] for s in out['stacks']], '; plant', [(p[0], p[2]) for p in out['plant']], '; coal', len(out['coal']),
          '; power', [(p[0], len(p[1]) // 2) for p in out['power']], '; roads', [(r[0], r[1], r[2], len(r[3]) // 2) for r in out['roads']])

if __name__ == '__main__':
    main(sys.argv[1])
