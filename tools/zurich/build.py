# Zürich, Švica: the game's files from the track data (tools/zurich/zurich.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/zurich/build.py track   -> js/tracks/zurich.js (centre line, heights, widths, names)
#   python3 -I tools/zurich/build.py world   -> js/data/zurich.js (the scenery data for js/world-zurich.js)
# Edit the track's names, widths and description here, not in the generated files. Description of the track: docs/proge/zurich.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'zurich.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); L = J['length']; NP = len(LINE)
LAKE = 405.9   # the lake's level (and the Limmat's in the town: its weir is downstream of the course), m above the sea

def sidx(s): return int(round(s / STEP)) % NP

def curv(P):
    a = np.roll(P, 1, 0); b = np.roll(P, -1, 0)
    d1 = (b - a) / 2; d2 = b - 2 * P + a
    return (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / np.maximum(np.hypot(d1[:, 0], d1[:, 1]) ** 3, 1e-9)

# ---- the centre line for the game: the corners of the streets (radius 2-9 m in OSM's lines) rounded to at least RMIN, the rest as it is ----
RMIN = 13.0
def game_line():
    P = LINE.copy()
    for it in range(40):
        k = np.abs(curv(P)); tight = k > 1 / RMIN
        if not tight.any(): break
        w = ndimage.gaussian_filter1d(ndimage.maximum_filter1d(tight.astype(float), 9, mode='wrap'), 2, mode='wrap')
        S = np.stack([ndimage.gaussian_filter1d(P[:, 0], 1.5, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], 1.5, mode='wrap')], 1)
        P = P * (1 - w[:, None]) + S * w[:, None]
    # resample evenly (the rounding pulls the points of a corner together)
    seg = np.hypot(*np.diff(np.vstack([P, P[:1]]), axis=0).T); cs = np.concatenate([[0], np.cumsum(seg)]); tot = cs[-1]
    n = int(round(tot / STEP)); u = np.arange(n) * tot / n
    Q = np.stack([np.interp(u, cs, np.append(P[:, 0], P[0, 0])), np.interp(u, cs, np.append(P[:, 1], P[0, 1]))], 1)
    return Q, tot

# ---- heights: the road's profile from the tool (Copernicus DEM GLO-30 less the buildings, smoothed, grades up to 12 %%) as it is, the real
#      climb from the lake up the hill (~78 m); only the lakeside quay kept at least 2.4 m above the lake (the surface model dips into the water there) ----
BRIDGES = [[a, b] for a, b in J['bridges'] if b - a > 20]   # (the short ones are culverts: no parapets)
def game_heights(Pn):
    s0 = np.arange(NP) * STEP
    hs = ndimage.gaussian_filter1d(H, 6, mode='wrap')
    h = np.maximum(hs, LAKE + 2.4)
    for a, b in BRIDGES: h[(s0 > a - 25) & (s0 < b + 25)] = LAKE + 2.6
    h = ndimage.gaussian_filter1d(h, 4, mode='wrap')
    # onto the game line's points (by the share of the lap)
    u = np.arange(len(Pn)) / len(Pn)
    return np.interp(u, np.arange(NP) / NP, h, period=1)

# ---- the tram's spans (s on the tool's line, m): where OSM's tram tracks (railway=tram, which the tool does not export) run within 5 m of the
#      line, measured once from the OSM download of 7. 11. 2026: Klosbachstrasse up to Römerhof, Hottingerstrasse and Rämistrasse to Bellevue ----
TRAM = [[1475, 2075], [3215, 4335]]

# ---- half widths by road (metres after the start line): the streets as wide as a race needs, the quays narrower, Bahnhofstrasse widest ----
WIDTHS = [  # [from, to, half width]
    (0, 660, 6.0),         # Utoquai, along the lake
    (660, 1480, 5.6),      # Feldeggstrasse, Kreuzplatz
    (1480, 2430, 5.6),     # Klosbachstrasse, up the hill
    (2430, 3220, 5.4),     # Bergstrasse and Dolderstrasse (the narrowest, up on the hill)
    (3220, 3840, 5.6),     # Hottingerstrasse
    (3840, 4400, 6.0),     # Heimplatz, Rämistrasse, Bellevue
    (4400, 1e9, 6.0),      # Utoquai to the line
]
def widths(Ln):
    K = []
    for a, b, hw in WIDTHS:
        b = min(b, Ln)
        K.append([round(a + (12 if a > 0 else 0), 1), hw]); K.append([round(b - (12 if b < Ln else 0), 1), hw])
    return K

# ---- names on the HUD ([label, s, the commentator's lines]): streets, squares and plain descriptions only (no people) ----
NAMES = [
    ('Utoquai', 40, ['Along the lake, the water on the right!', 'Down the quay by the lake!']),
    ('Feldeggstrasse', 665, ['Left, away from the lake!', 'Into Feldeggstrasse!']),
    ('Kreuzplatz', 1365, ['Through Kreuzplatz!', 'Kreuzplatz, the climb starts here!']),
    ('Klosbachstrasse', 1500, ['Up Klosbachstrasse, the hill ahead!', 'Climbing up Klosbachstrasse!']),
    ('Römerhof', 2425, ['Römerhof, hard left and up!', 'Left at Römerhof, still climbing!']),
    ('Dolderstrasse', 2660, ['Over the top, down Dolderstrasse!', 'The top of the hill, now downhill!']),
    ('Hottingerstrasse', 3235, ['Down Hottingerstrasse, the town below!', 'Downhill through Hottingen!']),
    ('Heimplatz', 3845, ['Heimplatz, left down Rämistrasse!', 'Round Heimplatz and down to the lake!']),
    ('Bellevue', 4385, ['Bellevue, left onto the lake!', 'Round Bellevue, back to the water!']),
]
EN_NAMES = {}

DESC = ('Mestna proga od jezera na hrib: start na nabrežju Utoquai ob Züriškem jezeru, levo po Feldeggstrasse do Kreuzplatza, nato navzgor po '
        'Klosbachstrasse in Bergstrasse skoraj 80 m nad jezero, navzdol po Dolderstrasse, Hottingerstrasse in Rämistrasse in okoli Bellevueja nazaj '
        'k jezeru. Ograje ulične dirke, 4,7 km.')
DESC_EN = ('A city race from the lake up the hill: the start on the Utoquai by the lake of Zürich, left along Feldeggstrasse to Kreuzplatz, then up '
           'Klosbachstrasse and Bergstrasse almost 80 m above the lake, down Dolderstrasse, Hottingerstrasse and Rämistrasse and round Bellevue back '
           'to the lake. Street-race barriers, 4.7 km.')

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P, Ln = game_line(); n = len(P); hk = game_heights(P)
    k = curv(P); print('game line %.1f m, %d points, tightest radius %.1f m' % (Ln, n, 1 / np.abs(k).max()))
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    zh = ','.join(str(int(round((v - LAKE) * 10))) for v in hk[::2])   # every 10 m, decimetres above the lake
    sc = Ln / L
    names = []
    for lab, s, lines in NAMES:
        i = int(round(s * sc / (Ln / n))) % n
        names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(round(P[i, 0], 1)), f1(round(P[i, 1], 1)), json.dumps(lines)))
    src = '''/* Track definition 'zurich'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Zürich, Switzerland: a city race from the lake up the hill (docs/proge/zurich.md), one lap anticlockwise: the start on the Utoquai by the
  // lake (southbound), left along Feldeggstrasse to Kreuzplatz, up Klosbachstrasse to Römerhof and up Bergstrasse, down Dolderstrasse through
  // Hottingen, Hottingerstrasse to Heimplatz, down Rämistrasse to Bellevue and back onto the Utoquai: %(km)s km. The streets are closed for the race and
  // lined with the barriers of a street race (concrete blocks and catch fences); the buildings generic (no names, signs or brands).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/zurich/config.json), the corners of the
  // streets rounded to at least %(rmin)s m; metres, origin = the start line, x east, z south. GENERATED by tools/zurich/build.py (edit the names,
  // widths and text there).
  // Heights (ZH_H): Copernicus DEM GLO-30 less the buildings (OSM) along the line, smoothed, grades up to 12 %%: the quay at least 2.4 m above
  // the lake (405.9 m), the top of the hill on Bergstrasse ~80 m above it; every 10 m from the start line, decimetres above the lake.
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
  const ZH_H = [%(zh)s];
  TRACK_DEFS.push({
    // ---- its own, once in the shared lists (tools/razdeli-proge.mjs): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)
    look: { fog: 0xcfdbe6, sun: 0xfff1da, sunI: 1.16, sky: 0xbcd5f0, gnd: 0x6d6c64, hemiI: 0.64, tint: [1.0, 1.0, 1.01], sat: 1.04, sunOff: [70, 86, 60], split: [[0.97, 1.0, 1.04], [1.03, 1.0, 0.96]] },   // Zürich: a clear late-summer afternoon, the sun from the south-west over the lake
    say: 'Zurich',
    zivali: { a: ['swan', 'duck'], t: [], city: true },
    // test: the user's decision 7. 11. 2026 (the buildings and streets not like Zürich's): a test track, frozen until deleted (CLAUDE.md)
    id: 'zurich', test: true, name: 'Zürich, Švica', theme: 'zurich', laps: 3, halfWidth: 6.0,
    desc: %(desc)s,
    en: { name: 'Zürich, Switzerland', desc: %(desc_en)s },
    start: [0, 0], runoff: 0.32, inner: 1.6, side: 1.6, offSurface: 'paving', noGravel: true, runoffTarmac: true, gradeForce: true, elevSmooth: 14, noBirds: true, realKm: %(km)s,
    rivals: 11,
    elev: ZH_H.map((h, i) => [i / ZH_H.length, h / 10]),
    widths: %(widths)s,
    // the bridges (s from the start line, m): parapets instead of the barriers' blocks, the deck under the road
    bridgesS: %(br)s,
    // places and corners on the HUD ([label, x, z, the commentator's lines]; the descriptive labels have their English in js/lang.js)
    names: [
%(names)s
    ],
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (Ln / 1000), rmin=f1(RMIN), zh=zh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), widths=json.dumps(widths(Ln)),
           br=json.dumps([[round(a * sc, 1), round(b * sc, 1)] for a, b in BRIDGES]), names='\n'.join(names), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'zurich.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB; heights %.1f-%.1f m above the lake' % (hk.min() - LAKE, hk.max() - LAKE))

# ---- the scenery data for js/world-zurich.js (js/data/zurich.js: var ZH_DATA) ----
A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'   # (World's NR_A64)

def grid(name):
    g = J['grids'][name]; a = np.asarray(Image.open(os.path.join(HERE, g['file']))); return g, a

def sample(g, a, X, Z, heights):
    gx = (X - g['x0']) / g['cell'] - 0.5; gz = (Z - g['z0']) / g['cell'] - 0.5
    v = ndimage.map_coordinates(a.astype(np.float32), [gz, gx], order=1 if heights else 0, mode='nearest')
    return v / 10.0 - 100.0 if heights else v

def rle_lc(c):
    flatc = c.ravel(); out = []; k = 0; n = len(flatc)
    while k < n:
        v = int(flatc[k]); m = k
        while m < n and flatc[m] == v: m += 1
        run = m - k; k = m
        if run <= 15: out.append(A64[v * 16 + run - 1])
        else:
            out.append(A64[v * 16 + 15]); r = run - 16
            while r >= 63: out.append(A64[63]); r -= 63
            out.append(A64[r])
    return ''.join(out)

def b64bytes(a): return base64.b64encode(np.asarray(a, np.uint8).tobytes()).decode()

def water_rings(x0, z0, x1, z1):
    """the Limmat and the lake as closed rings in the corridor's box (the lake's ring, cut off where OSM's data ends, closed round the box's
    south-east, where the lake goes on); small ponds and fountains left out"""
    out = []
    for kind, name, closed, fl in J['lakes']:
        P = np.array(fl).reshape(-1, 2)
        if not closed and name not in ('Zürichsee', 'Limmat'): continue
        if closed:
            a = 0.5 * abs(np.dot(P[:-1, 0], P[1:, 1]) - np.dot(P[1:, 0], P[:-1, 1]))
            if a < 600: continue   # (fountains, ponds)
        else:
            far = 6000.0
            if name == 'Zürichsee':   # its shore from the west round to the east; the open water to the south-east
                P = np.vstack([P, [[P[-1, 0] + far, P[-1, 1] + far], [P[0, 0] + far, P[0, 1] + far]]]) if P[0, 0] < P[-1, 0] else np.vstack([P, [[P[-1, 0] + far, P[-1, 1] + far], [P[0, 0] + far, P[0, 1] + far]]])
            else:   # the Limmat's outline cut at the box: closed straight across its ends
                pass
        # clip to the box (coarsely: keep the points within it plus a margin; the far points kept as they are)
        m = 200
        keep = (P[:, 0] > x0 - m) & (P[:, 0] < x1 + m) & (P[:, 1] > z0 - m) & (P[:, 1] < z1 + m)
        if not keep.any(): continue
        P = np.clip(P, [x0 - m - 6000, z0 - m - 6000], [x1 + m + 6000, z1 + m + 6000])
        # simplify (points closer than 1.5 m dropped)
        Q = [P[0]]
        for p in P[1:]:
            if np.hypot(*(p - Q[-1])) >= 1.5: Q.append(p)
        out.append([name or kind, [round(float(v), 1) for v in np.array(Q).ravel()]])
    return out

HEAD = """/* Zürich (theme 'zurich'): the scenery data for js/world-zurich.js (metres, origin = the start line, x east, z south). GENERATED by
   tools/zurich/build.py world from tools/zurich/zurich.json (tools/proga-podatki.py; docs/proge/zurich.md).
   dem: the ground (Copernicus DEM GLO-30 less the buildings, the shore at least 2.4 m above the lake; 32 m cells, bytes: lo + v * step m
   above the lake, World.nrPrep's form); lc: the land cover (16 m cells, run-length coded: 0 open, 1 trees, 2 park, 3 town); far: the surface (200 m
   cells, +-12 km, bytes of 2 m above the lake, 0 = the lake); bld: OSM buildings within 140 m [x, z, length, width, angle, height (0 unknown), kind: 0
   house, 1 church, 2 tower, 3 castle, 4 shed, 5 commercial, 6 public, 7 greenhouse, 8 ruin, 9 flats, s, d]; out: outlines [index into bld, [x, z, ...]];
   water: the Limmat and the lake [name, [x, z, ...] closed ring]; walls [0 wall, 1 retaining, 2 hedge, 3 fence, 4 guard rail, [x, z, ...]];
   roads: the other streets and bridges within 60 m [highway, lanes, width, 1 bridge, [x, z, ...]]; marks [label, kind, s, d, outline]; trees [x, z, kind];
   lamps [x, z]; bridges [s0, s1] (the road on a bridge); tram [s0, s1] (the tram's rails in the road). Data: © OpenStreetMap contributors (ODbL 1.0: the derived data here under the ODbL 1.0);
   Copernicus DEM GLO-30 (produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
   COPERNICUS by the European Union and ESA; all rights reserved); ESA WorldCover 2021 (CC BY 4.0); Meta and World Resources Institute, High
   Resolution Canopy Height Maps (CC BY 4.0). Only geographic and descriptive labels. */
var ZH_DATA = """

def build_world():
    P, Ln = game_line(); M = 700; sc = Ln / L
    x0 = math.floor((P[:, 0].min() - M) / 32) * 32; z0 = math.floor((P[:, 1].min() - M) / 32) * 32
    x1 = P[:, 0].max() + M; z1 = P[:, 1].max() + M
    gd, ad = grid('dem'); c = 32; nx = int(math.ceil((x1 - x0) / c)) + 1; nz = int(math.ceil((z1 - z0) / c)) + 1
    X, Z = np.meshgrid(x0 + np.arange(nx) * c, z0 + np.arange(nz) * c); hv = sample(gd, ad, X, Z, True)
    hv = ndimage.gaussian_filter(hv, 1.2)
    rel = np.maximum(hv, LAKE + 2.4)   # (the real relief, as the road's heights; the shore at least 2.4 m above the lake)
    rel = np.where(hv < LAKE + 0.3, LAKE - 1.0, rel)
    lo, step = -3.0, 0.75; dem = np.clip(np.round((rel - LAKE - lo) / step), 0, 255)
    D = dict(x0=x0, z0=z0, nx=nx, nz=nz, cell=c, lo=lo, step=step, base=0, noise=0.05, b64=b64bytes(dem))
    g1, a1 = grid('lc'); g2, a2 = grid('lu'); g3, a3 = grid('chm'); c = 16
    lnx = int(math.ceil((x1 - x0) / c)); lnz = int(math.ceil((z1 - z0) / c))
    votes = np.zeros((4, lnz, lnx), np.float32)
    for fz in (-0.25, 0.25):
        for fx in (-0.25, 0.25):
            X, Z = np.meshgrid(x0 + (np.arange(lnx) + 0.5 + fx) * c, z0 + (np.arange(lnz) + 0.5 + fz) * c)
            wc = sample(g1, a1, X, Z, False); lu = sample(g2, a2, X, Z, False); ch = sample(g3, a3, X, Z, False)
            cls = np.full(wc.shape, 3, np.int8)   # (the town by default)
            cls[(lu == 10) | (lu == 4) | (wc == 30)] = 2
            cls[(ch > 5) | (wc == 10)] = 1
            cls[(wc == 80) | (lu == 13)] = 0
            for k in range(4): votes[k] += (cls == k)
    lc = votes.argmax(0).astype(np.uint8)
    LC = dict(x0=x0, z0=z0, nx=lnx, nz=lnz, cell=c, rle=rle_lc(lc))
    gf, af = grid('far'); fh = af.astype(np.float32) / 10.0 - 100.0
    n2 = gf['nx'] // 2; fh = fh[:n2 * 2, :n2 * 2].reshape(n2, 2, n2, 2).max(axis=(1, 3))
    FAR = dict(x0=gf['x0'], z0=gf['z0'], n=n2, cell=gf['cell'] * 2, lo=0, step=2, b64=b64bytes(np.clip(np.round((fh - LAKE) / 2), 0, 255)))
    pl = lambda fl: [round(v, 1) for v in fl]
    KIND_W = {'wall': 0, 'city_wall': 0, 'retaining_wall': 1, 'hedge': 2, 'fence': 3, 'railing': 3, 'handrail': 3, 'guard_rail': 4, 'jersey_barrier': 4}
    oidx = {}
    for k, o in enumerate(J.get('bldOutline', [])): oidx[o[0]] = pl(o[1])
    data = {
        'dem': D, 'lc': LC, 'far': FAR,
        'bld': [[b[0], b[1], b[2], b[3], round(b[4], 2), b[5], b[6], round(b[7] * sc), round(b[8], 1)] for b in J['bld']],
        'out': [[k, v] for k, v in oidx.items()],
        'water': water_rings(x0, z0, x1, z1),
        'walls': [[KIND_W.get(w[0], 3), pl(w[3])] for w in J['walls']],
        'roads': [[r[0], r[1], r[2], r[3], pl(r[8])] for r in J['roads'] if r[0] not in ('footway', 'path', 'steps', 'cycleway', 'track') or r[3] == 1],
        'marks': [[m[0], m[2], round(m[3] * sc), m[4], pl(m[5])] for m in J['landmarks']],
        'trees': [[t[0], t[1], t[2]] for t in J['trees']],
        'lamps': J['lamps'],
        'bridges': [[round(a_ * sc, 1), round(b_ * sc, 1)] for a_, b_ in BRIDGES],
        'tram': [[round(a_ * sc, 1), round(b_ * sc, 1)] for a_, b_ in TRAM],
    }
    src = HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    path = os.path.join(ROOT, 'js', 'data', 'zurich.js'); open(path, 'w').write(src)
    print('wrote', path, len(src.encode()) // 1024, 'KB; dem', D['nx'], 'x', D['nz'], '; lc', lnx, 'x', lnz, 'classes', np.bincount(lc.ravel(), minlength=4).tolist())
    for k in data: print('  %-7s %6d KB' % (k, len(json.dumps(data[k], ensure_ascii=False, separators=(',', ':')).encode()) // 1024))

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
    if 'world' in what: build_world()
