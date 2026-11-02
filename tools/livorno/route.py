# Livorno, Italija (proga `livorno`), sklop 1: the track's centre line on today's roads in OpenStreetMap (© OpenStreetMap contributors,
# ODbL 1.0). The lap of 1922-1930 (22.5 km by the reports of the time, 19.1 km on today's roads): the start on the bridge over the Rio
# Ardenza by the Rotonda of Ardenza Mare (the seafront road, heading north), inland by the streets of Ardenza (one of them was Via del
# Pastore) to Ardenza Terra and under the railway, up Via di Montenero to Montenero, the provincial road SP9 (named after the course in
# OSM: Via del Castellaccio, Via della Porcigliana past Savolano up to the ridge at Castellaccio, Via di Quercianella down the hills to the
# coast at Romito), and back north on the coast road (Via del Littorale) through Calafuria, Boccale and Antignano to the Rotonda.
# Why these roads: docs/proga-livorno.md (Potek proge).
# The route is a chain of waypoints (in lap order, each snapped to the nearest node of a road of that name); between two waypoints the
# shortest way over the drivable roads, roads of the expected names counting as shorter (one-way streets are driven either way: the
# race closed the roads). -> RAW/route.json: the OSM nodes in lap order [lat, lon], the ways passed (name, highway, lanes, width ...),
# the length. Usage: python3 -I tools/livorno/route.py RAW   (after osm.py)
import heapq, json, math, os, sys, time

DRIVE = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service',
         'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'}
# waypoints: (lat, lon, the road's name in OSM, why). The race's roads by the old reports: Via di Montenero, Via del Castellaccio,
# Via di Quercianella, Via del Littorale; at Ardenza (1925) Via del Pastore. The rest is the shortest way between.
ROUTE = [
    (43.51189, 10.31907, 'Viale di Antignano', 'start: the seafront road on the bridge over the Rio Ardenza by the Rotonda, northbound'),
    (43.51292, 10.31831, 'Viale Italia', 'the Rotonda (on the left, by the sea)'),
    (43.51360, 10.31900, None, 'the diagonal street from the Rotonda inland (towards Via del Pastore)'),
    (43.51450, 10.31990, None, ''),
    (43.51540, 10.32055, None, ''),
    (43.51555, 10.32200, 'Via del Pastore', ''),
    (43.51566, 10.32490, 'Via del Pastore', 'Ardenza Terra'),
    (43.51540, 10.32522, None, 'the street along the railway at Ardenza Terra'),
    (43.51480, 10.32556, None, ''),
    (43.51440, 10.32582, 'Via dell\'Ardenza', 'over the Rio Ardenza, then under the railway'),
    (43.51300, 10.32640, 'Via di Montenero', ''),
    (43.50500, 10.33800, 'Via di Montenero', ''),
    (43.49999, 10.34231, 'Via di Montenero', 'Montenero (Basso): Via del Castellaccio, the provincial road SP9 Circuito di Montenero'),
    (43.49830, 10.34660, 'Via del Castellaccio', ''),
    (43.49906, 10.34809, 'Via del Castellaccio', ''),
    (43.49760, 10.35257, 'Via della Porcigliana', 'Savolano'),
    (43.49990, 10.35500, 'Via della Porcigliana', 'the bends above Savolano'),
    (43.49300, 10.35900, 'Via della Porcigliana', 'up to the ridge'),
    (43.49096, 10.35832, 'Via di Quercianella', 'the ridge by the tower of Castellaccio'),
    (43.48851, 10.36309, 'Via di Quercianella', 'Castellaccio'),
    (43.47992, 10.36927, 'Via di Quercianella', ''),
    (43.47675, 10.36237, 'Via di Quercianella', ''),
    (43.47054, 10.35741, 'Via di Quercianella', ''),
    (43.46510, 10.35998, 'Via di Quercianella', 'the bends down to the coast'),
    (43.46390, 10.35808, 'Via di Quercianella', 'the coast road at Romito'),
    (43.46530, 10.35444, 'Via del Littorale', 'Romito'),
    (43.46516, 10.34929, 'Via del Littorale', ''),
    (43.47152, 10.33452, 'Via del Littorale', 'Calafuria'),
    (43.47746, 10.33090, 'Via del Littorale', 'Boccale'),
    (43.48300, 10.33290, 'Via del Littorale', ''),
    (43.48945, 10.32933, 'Via del Littorale', ''),
    (43.49215, 10.32784, 'Via del Littorale', 'Antignano'),
    (43.49700, 10.32540, 'Via del Littorale', ''),
    (43.50086, 10.32133, 'Viale di Antignano', ''),
    (43.50966, 10.31922, 'Viale di Antignano', 'back to the Rotonda'),
]
PREFER = {'Via di Montenero', 'Via del Castellaccio', 'Via della Porcigliana', 'Via di Quercianella', 'Via del Littorale', 'Viale di Antignano', 'Via del Pastore',
          'Viale Italia', "Via dell'Ardenza", 'Via dei Bagni'}
# (waypoints with no name snap to the nearest node of any drivable road: the streets named after people are not named in the files)

def dist(a, b):   # metres between two [lat, lon] (local flat earth; short steps)
    k = math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot((b[0] - a[0]) * 111195, (b[1] - a[1]) * 111195 * k)

def main():
    raw = sys.argv[1]
    D = json.load(open(os.path.join(raw, 'osm.json')))
    N, W = D['nodes'], D['ways']
    G = {}          # node -> [(node, cost, length, way)]
    byname = {}     # name -> set of nodes
    for wid, (refs, t) in W.items():
        if t.get('highway') not in DRIVE or t.get('area') == 'yes': continue
        nm = t.get('name', '')
        f = 1.0 if nm in PREFER else 4.0
        refs = [r for r in refs if r in N]
        for a, b in zip(refs, refs[1:]):
            L = dist(N[a], N[b])
            G.setdefault(a, []).append((b, L * f, L, wid)); G.setdefault(b, []).append((a, L * f, L, wid))
        byname.setdefault(nm, set()).update(refs)
    def snap(lat, lon, nm):
        cand = byname.get(nm) if nm else set(G)
        return min(cand, key=lambda r: dist(N[r], (lat, lon)))
    def path(s, e):
        best = {s: 0.0}; prev = {}; q = [(0.0, s)]
        while q:
            c, u = heapq.heappop(q)
            if u == e: break
            if c > best.get(u, 1e18): continue
            for v, cost, L, wid in G.get(u, ()):
                nc = c + cost
                if nc < best.get(v, 1e18): best[v] = nc; prev[v] = (u, wid); heapq.heappush(q, (nc, v))
        out = [e]; ws = []
        while out[-1] != s: u, wid = prev[out[-1]]; ws.append(wid); out.append(u)
        return out[::-1], ws[::-1]
    wps = [snap(la, lo, nm) for la, lo, nm, _ in ROUTE]
    nodes, ways = [wps[0]], []
    for a, b in zip(wps, wps[1:] + wps[:1]):
        p, ws = path(a, b)
        nodes += p[1:]; ways += ws
    nodes = nodes[:-1]   # (the loop closes on the first node)
    # drop doubled-back spurs (a waypoint snapped a little past a junction)
    changed = True
    while changed:
        changed = False
        for i in range(1, len(nodes) - 1):
            if nodes[i - 1] == nodes[i + 1]:
                del nodes[i:i + 2]; del ways[i - 1:i + 1]; changed = True; break
    L = sum(dist(N[a], N[b]) for a, b in zip(nodes, nodes[1:] + nodes[:1]))
    seq = []   # runs of the same way: [way, name, highway, from index, to index, tags]
    for i, w in enumerate(ways):
        if seq and seq[-1][0] == w: seq[-1][4] = i + 1
        else:
            t = W[w][1]
            seq.append([w, t.get('name', '') if t.get('name', '') in PREFER else '', t.get('highway'), i, i + 1, {k: t[k] for k in ('lanes', 'width', 'oneway', 'bridge', 'tunnel', 'surface', 'maxspeed', 'ref', 'layer', 'sidewalk') if k in t}])
    json.dump({'date': time.strftime('%Y-%m-%d', time.gmtime(os.path.getmtime(os.path.join(raw, 'osm.json')))), 'length': round(L, 1), 'nodes': [[r, N[r][0], N[r][1]] for r in nodes], 'ways': seq,
               'waypoints': [[la, lo, nm, why] for la, lo, nm, why in ROUTE]}, open(os.path.join(raw, 'route.json'), 'w'), separators=(',', ':'))
    print('route: %d nodes, %.1f m' % (len(nodes), L))
    acc = 0.0
    names = []
    for w, nm, hw, i0, i1, tg in seq:
        ln = sum(dist(N[nodes[i]], N[nodes[(i + 1) % len(nodes)]]) for i in range(i0, i1))
        if names and names[-1][0] == nm: names[-1][1] += ln
        else: names.append([nm, ln, acc])
        acc += ln
    for nm, ln, a in names: print('  %7.0f m  %-30s %6.0f m' % (a, nm or '(unnamed)', ln))

if __name__ == '__main__':
    main()
