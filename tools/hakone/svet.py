# The scenery data of the Hakone world (plan: docs/proga-hakone.md, sklop 3) -> js/data/hakone.js (HK_DATA, read by js/world-hakone.js).
# Reads podatki/okolica.json, teren.json and proga.json (the game's line); nothing is downloaded. After proga.py.
#   python3 -I tools/hakone/svet.py
# What the world needs of the data, packed small (the 60 m rule: the detailed things only within ~60 m of the game's road):
#   bld      buildings within 60 m: flat [x, z, length, width (dm), angle (mrad), height (dm, 0 unknown), kind] (kinds as okolica.json)
#   trees    the canopy model's trees within 60 m: base64 of int16 x, int16 z (0.5 m from tx0, tz0), uint8 height (0.25 m), 5 bytes a tree
#   rail     the mountain railway within 75 m: [{p: flat [x, z, h] (dm, h above the sea), g: the kind of each segment (0 ground, 1 bridge,
#            2 tunnel)}], each line cut to the part within 110 m of the road; plat: the platforms' outlines (flat [x, z], dm)
#   paving   the old road's stone paving within 70 m (flat [x, z], dm); gates: the torii [x, z, width, angle, in the lake]
#   lakes    the shore lines the corridor reaches ([area, x, z, x, z, ...], m, as def.lakes of js/world-vrsic.js vrPrep: Shōjin, Otama-ga-ike, Ashi)
#   river    the Hayakawa's and the Sukumo's water areas by the road (flat [x, z], dm)
#   far, fuji  the view beyond the corridor (teren.json's, as they are: H = lo + v * step); fujiTop: its summit [x, z, h]
#   avenue   the cedar avenue along the old road [from, to] (the game's metres after the start line)
import base64, json, math, os, struct, sys
import numpy as np
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'podatki'); ROOT = os.path.dirname(os.path.dirname(HERE))
JS = os.path.join(ROOT, 'js', 'data', 'hakone.js')
oko = json.load(open(os.path.join(OUT, 'okolica.json'))); ter = json.load(open(os.path.join(OUT, 'teren.json'))); pro = json.load(open(os.path.join(OUT, 'proga.json')))

# the game's line, densified to ~1 m (its points are 3-10 m apart)
G = np.array(pro['points'], dtype=np.float64); G = np.vstack([G, G[:1]])
seg = np.hypot(*(G[1:] - G[:-1]).T); n = np.maximum(1, np.ceil(seg).astype(int))
LINE = np.vstack([G[k] + (G[k + 1] - G[k]) * (np.arange(n[k])[:, None] / n[k]) for k in range(len(G) - 1)]).astype(np.float32)
def dist(xs, zs, chunk=600):   # the distance to the game's centre line
    xs = np.atleast_1d(np.asarray(xs, np.float32)); zs = np.atleast_1d(np.asarray(zs, np.float32)); out = np.empty(len(xs), np.float32)
    for a in range(0, len(xs), chunk):
        dx = xs[a:a + chunk, None] - LINE[None, :, 0]; dz = zs[a:a + chunk, None] - LINE[None, :, 1]; out[a:a + chunk] = np.sqrt((dx * dx + dz * dz).min(axis=1))
    return out
dm = lambda v: int(round(float(v) * 10))
flat = lambda pts: [dm(c) for p in pts for c in p]

# ---------------- buildings ----------------
bld = []
for x, z, L, W, a, h, kind, d, side, s in oko['bld']:
    bld += [dm(x), dm(z), dm(L), dm(W), int(round(a * 1000)), dm(h), int(kind)]

# ---------------- trees ----------------
T = oko['trees']; tb = base64.b64decode(T['b64']); x0, z0, u = T['x0'], T['z0'], T['unit']
TX0, TZ0 = -12000.0, -2500.0
out = bytearray(); nt = 0
for k in range(T['n']):
    xi, zi, s, h, band = struct.unpack('>hhHBB', tb[k * 8:k * 8 + 8]); x = x0 + xi * u; z = z0 + zi * u
    out += struct.pack('>hhB', int(round((x - TX0) / 0.5)), int(round((z - TZ0) / 0.5)), min(255, int(round(h * 4)))); nt += 1

# ---------------- the railway ----------------
rail = []
for r in oko['rail']:
    if r['near'] > 75: continue
    P = r['pts']; g = r['seg']; d = dist([p[0] for p in P], [p[1] for p in P])
    keep = d < 110
    for k in range(len(P)):   # (one point more past the part kept at either end: the line runs on out of sight)
        if d[k] < 110: keep[max(0, k - 1)] = keep[min(len(P) - 1, k + 1)] = True
    k = 0
    while k < len(P):
        if not keep[k]: k += 1; continue
        j = k
        while j + 1 < len(P) and keep[j + 1]: j += 1
        if j > k: rail.append({'p': flat(P[k:j + 1]), 'g': [int(v) for v in g[k:j]]})
        k = j + 1
plat = [flat(p['pts']) for p in oko['platforms'] if p['d'] < 75]

# ---------------- the old road's stone paving, the torii ----------------
paving = []
for p in oko['paving']:
    P = p['pts']; d = dist([q[0] for q in P], [q[1] for q in P]); k = 0
    while k < len(P):
        if d[k] > 70: k += 1; continue
        j = k
        while j + 1 < len(P) and d[j + 1] <= 70: j += 1
        a, b = max(0, k - 1), min(len(P) - 1, j + 1)
        if b > a: paving.append(flat(P[a:b + 1]))
        k = j + 1
gates = [[round(g['x'], 1), round(g['z'], 1), round(g['w'], 1), round(g['ang'], 3), 1 if g.get('in_lake') else 0] for g in oko['gates'] if g['d'] < 60 or g.get('in_lake')]

# ---------------- the lakes the corridor reaches, the rivers by the road ----------------
def area(P):
    P = np.array(P); return float(abs(np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])) / 2)
lakes = []
for L in ter['lakes']:
    P = L['poly']; d = float(dist([p[0] for p in P], [p[1] for p in P]).min()); A = area(P)
    if d < 380 and A > 2000: lakes.append([round(A)] + [round(c, 1) for p in P for c in p])
river = [flat(r['pts']) for r in oko['river_areas']]

far = {k: ter['far'][k] for k in ('x0', 'z0', 'nx', 'nz', 'cell', 'lo', 'step', 'b64', 'lake', 'lakeH', 'sea', 'lc')}
fuji = {k: ter['fuji'][k] for k in ('x0', 'z0', 'nx', 'nz', 'cell', 'lo', 'step', 'b64', 'lake', 'lakeH', 'sea', 'lc')}
for g in (far, fuji): g['x0'] = round(g['x0'], 1); g['z0'] = round(g['z0'], 1)
fujiTop = next(([p['x'], p['z'], p['h']] for p in ter['peaks'] if p['name'] == 'Mount Fuji'), None)
# the cedar avenue (the plan: along the old road from the Hatajuku junction to ~17.4 km of the OpenStreetMap line), in the game's metres
s_of = lambda u: round(float(np.interp(u, np.array(pro['u']), np.array(pro['s']))), 1)
avenue = [s_of(15580), s_of(17400)]

D = {'bld': bld, 'tx0': TX0, 'tz0': TZ0, 'nTrees': nt, 'trees': base64.b64encode(bytes(out)).decode(), 'rail': rail, 'plat': plat, 'paving': paving, 'gates': gates,
     'lakes': lakes, 'river': river, 'far': far, 'fuji': fuji, 'fujiTop': fujiTop, 'avenue': avenue}
head = ('/* Hakone (theme \'hakone\'): the scenery data for js/world-hakone.js (metres, origin = the start line, x east, z south), made by tools/hakone/svet.py\n'
        '   from tools/hakone/podatki (not by hand; format in that tool and in docs/proga-hakone.md). Buildings, the railway, the old road\'s stone paving,\n'
        '   the torii, the lakes and the rivers: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0). Trees: High Resolution Canopy Height Maps (Meta and\n'
        '   World Resources Institute 2024, CC BY 4.0). The far view (far, fuji): Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V.\n'
        '   2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved), its land\n'
        '   cover ESA WorldCover 2021 (© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021), CC BY 4.0). Derived data under\n'
        '   the ODbL 1.0. */\n')
os.makedirs(os.path.dirname(JS), exist_ok=True)
open(JS, 'w', encoding='utf-8').write(head + 'var HK_DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('%s: %d buildings, %d trees, %d rail lines (%d points), %d platforms, %d paving lines, %d torii, %d lakes, %d rivers; %.0f KB' % (
    os.path.relpath(JS, ROOT), len(bld) // 7, nt, len(rail), sum(len(r['p']) // 3 for r in rail), len(plat), len(paving), len(gates), len(lakes), len(river), os.path.getsize(JS) / 1024))
