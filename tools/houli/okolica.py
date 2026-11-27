# Houli, Tajvan: the landmarks beyond the reach of tools/proga-podatki.py (it keeps what lies within a few hundred metres of the road), from
# the same OpenStreetMap download (its RAW directory): the amusement park's two big wheels and its ride, the high-speed railway on its
# viaduct, the power lines' pylons. Plain geometry only (no names: the park, the mall and the railway are brands or firms).
#   python3 -I tools/houli/okolica.py <RAW>   -> tools/houli/okolica.json (the tool's frame: x east, z south, origin the route's first point)
# tools/houli/build.py reads it (sk.lm of js/tracks/houli.js). Plan: docs/dirkalisca-celine.md.
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'houli.json')))
LAT0, LON0 = C['lat0'], C['lon0']
A, E2 = 6378137.0, 6.69437999014e-3
PH = math.radians(LAT0); NR = A / math.sqrt(1 - E2 * math.sin(PH) ** 2); MR = A * (1 - E2) / (1 - E2 * math.sin(PH) ** 2) ** 1.5

def main(raw):
    J = json.load(open(os.path.join(raw, 'houli-osm.json'))); N = J['nodes']; W = J['ways']
    def xz(n): lat, lon = N[n][0], N[n][1]; return [round(math.radians(lon - LON0) * NR * math.cos(PH) * 2) / 2, round(-math.radians(lat - LAT0) * MR * 2) / 2]
    def near(q, r): return math.hypot(q[0] + 300, q[1] - 130) < r   # (from the middle of the circuit)
    out = {'about': 'tools/houli/okolica.py from the OSM download of tools/proga-podatki.py (tools/houli/config.json); the frame of tools/houli/houli.json',
           'wheels': '[x, z, height (m), osm]: the big wheels (OSM attraction=big_wheel; the height from OSM where tagged, else a guess from the footprint)',
           'ride': '[osm, [x, z, ...]]: the amusement ride by the circuit (OSM attraction=amusement_ride, its outline)',
           'rail': '[bridge (1 a viaduct), [x, z, ...]]: the high-speed railway (OSM railway=rail, highspeed=yes) within 4 km',
           'power': '[cables, [x, z, ...]]: the power lines (OSM power=line) as their pylons in order, those within 4 km',
           'sources': '© OpenStreetMap contributors (ODbL 1.0; the derived data here under the ODbL 1.0)'}
    wh = []
    for nid, v in N.items():
        if len(v) > 2 and v[2].get('attraction') == 'big_wheel':
            h = float(v[2].get('height', '0') or 0); wh.append(xz(nid) + [h or 40.0, 'n' + nid])
    for wid, (ids, t) in W.items():
        if t.get('attraction') != 'big_wheel': continue
        pts = [xz(n) for n in ids if n in N]; cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
        if any(math.hypot(w[0] - cx, w[1] - cz) < 80 for w in wh): continue   # (the big one: its node above, this its base)
        span = max(math.hypot(p[0] - q[0], p[1] - q[1]) for p in pts for q in pts)
        wh.append([round(cx * 2) / 2, round(cz * 2) / 2, round(min(60.0, max(30.0, span * 1.4))), 'w' + wid])   # (no height in OSM: ~1.4 x its footprint's span)
    out['wheels'] = sorted(wh, key=lambda w: w[3])
    out['ride'] = [[('w' + wid), sum((xz(n) for n in ids if n in N), [])] for wid, (ids, t) in W.items()
                   if t.get('attraction') == 'amusement_ride' and near(xz(ids[0]), 1200)]
    rail = []
    for wid, (ids, t) in W.items():
        if t.get('railway') == 'rail' and t.get('highspeed') == 'yes':
            pts = [xz(n) for n in ids if n in N]
            if any(near(p, 4000) for p in pts): rail.append([1 if t.get('bridge') else 0, sum(pts, []), 'w' + wid])
    out['rail'] = sorted(rail, key=lambda r: r[2])
    pw = []
    for wid, (ids, t) in W.items():
        if t.get('power') != 'line': continue
        tw = [xz(n) for n in ids if n in N and len(N[n]) > 2 and N[n][2].get('power') == 'tower']
        tw = [p for p in tw if near(p, 4000)]
        if len(tw) >= 2: pw.append([int(str(t.get('cables', '3')).split(';')[0] or 3), sum(tw, []), 'w' + wid])
    out['power'] = sorted(pw, key=lambda r: r[2])
    path = os.path.join(HERE, 'okolica.json'); open(path, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print('wrote', path, '; wheels', [w[2:] for w in out['wheels']], '; rides', len(out['ride']), '; rail', [(r[0], len(r[1]) // 2) for r in out['rail']], '; power', [(p[0], len(p[1]) // 2) for p in out['power']])

if __name__ == '__main__':
    main(sys.argv[1])
