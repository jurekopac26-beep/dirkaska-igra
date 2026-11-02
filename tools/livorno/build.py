# Livorno, Italija: the game's files from the track data (tools/livorno/livorno.json and its PNG grids, made by tools/proga-podatki.py).
#   python3 -I tools/livorno/build.py track   -> js/tracks/livorno.js (centre line, heights, widths, names, the 100-car race)
#   python3 -I tools/livorno/build.py world   -> js/data/livorno.js (the scenery data for js/world-livorno.js)
# Edit the track's names, widths and description here, not in the generated files. Plan and decisions: docs/proga-livorno.md.
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
J = json.load(open(os.path.join(HERE, 'livorno.json')))
STEP = J['step']; LINE = np.array(J['line']).reshape(-1, 2); H = np.array(J['h']); L = J['length']; NP = len(LINE)

def sidx(s): return int(round(s / STEP)) % NP
def xz(s): i = sidx(s); return [round(float(LINE[i, 0]), 1), round(float(LINE[i, 1]), 1)]

# ---- the centre line for the game: the roundabout on Via di Montenero straightened (1922 had none: decision 4 in the plan) ----
def game_line():
    P = LINE.copy()
    S = np.stack([ndimage.gaussian_filter1d(P[:, 0], 8, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], 8, mode='wrap')], 1)
    s = np.arange(NP) * STEP
    def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
    w = np.minimum(sstep(1800, 1860, s), sstep(1990, 1930, s))
    return P * (1 - w[:, None]) + S * w[:, None]

# ---- half widths by road (metres after the start line): the real roads' widths kept in proportion, widened to race width ----
WIDTHS = [  # [from, to, half width]
    (0, 178, 6.0),         # the seafront road (Viale Italia) by the terrace
    (178, 1022, 4.6),      # the streets of Ardenza
    (1022, 3199, 5.0),     # Via di Montenero
    (3199, 11597, 4.6),    # the provincial road SP9: Via del Castellaccio, Via della Porcigliana, Via di Quercianella
    (11597, 17195, 5.4),   # Via del Littorale, the coast road
    (17195, 17437, 4.6),   # Via dei Bagni in Antignano
    (17437, L, 6.0),       # Viale di Antignano, the seafront to the line
]
def widths():
    K = []
    for a, b, hw in WIDTHS:
        K.append([round(a + (12 if a > 0 else 0), 1), hw]); K.append([round(b - (12 if b < L else 0), 1), hw])
    return K

# ---- names on the HUD ([label, s, the commentator's lines]): only places and plain descriptions (docs/proga-livorno.md, Pravna varnost) ----
NAMES = [
    ('Terasa ob morju', 175, ['Right at the seafront terrace, into the streets of Ardenza!', 'Off the seafront and into Ardenza!']),
    ('Ardenza Terra', 860, ['Ardenza Terra, right by the railway!', 'Through Ardenza Terra!']),
    ('Pod železnico', 1120, ['Under the railway and up the hill!', 'Under the railway bridge, the climb begins!']),
    ('Montenero', 3200, ['Montenero, left off the main road!', 'Up to Montenero, past the cemetery!']),
    ('Savolano', 4440, ['Savolano, and the hairpins are next!', 'Through Savolano!']),
    ('Lasnice Savolano', 4560, ['Into the hairpins above Savolano!', 'Hairpin after hairpin above Savolano!']),
    ('Stolp Castellaccio', 6700, ['Past the old tower on the ridge!', 'Up on the ridge by the tower!']),
    ('Castellaccio', 7460, ['Castellaccio, the top of the lap!', 'Over the top at Castellaccio!']),
    ('Vzhodna lasnica', 8470, ['The east hairpin, hard on the brakes!', 'Round the east hairpin!']),
    ('Le Piagge', 9276, ['Down through Le Piagge!', 'Le Piagge, flowing downhill now!']),
    ('Pian della Pineta', 9956, ['Through the pines at Pian della Pineta!', 'Pian della Pineta, deep in the woods!']),
    ('Lasnici nad Romitom', 11040, ['Two hairpins down to the sea at Romito!', 'The Romito hairpins, mind the drop!']),
    ('Romito', 11600, ['Romito! Onto the coast road!', 'Down to the sea at Romito!']),
    ('Calafuria', 13937, ['Calafuria, past the old watchtower!', 'Over the bridge at Calafuria!']),
    ('Boccale', 14639, ['Boccale, the castle on the rocks below!', 'Along the cliffs at Boccale!']),
    ('Miramare', 15161, ['Miramare, the long straight to Antignano!', 'Flat out past Miramare!']),
    ('Antignano', 16852, ['Into Antignano!', 'Antignano, the town by the sea!']),
    ('Grad Antignano', 17195, ['Left at the old castle in Antignano!', 'Round the castle corner!']),
    ('Ardenza', 18400, ['Along the sea to Ardenza and the line!', 'Back to Ardenza, the finish is near!']),
]
EN_NAMES = {'Terasa ob morju': 'Seafront Terrace', 'Pod železnico': 'Under the Railway', 'Lasnice Savolano': 'Savolano Hairpins', 'Stolp Castellaccio': 'Castellaccio Tower',
            'Vzhodna lasnica': 'East Hairpin', 'Lasnici nad Romitom': 'Romito Hairpins', 'Grad Antignano': 'Antignano Castle'}

DESC = ('Stara cestna proga ob Livornu (1922–1930) po današnjih cestah: od morja v Ardenzi skozi Montenero in Savolano na greben pri Castellacciu (287 m), '
        'skozi borov gozd navzdol do morja pri Romitu in ob pečinah skozi Calafurio in Antignano nazaj. En krog, 19,1 km, 100 avtov z letečim štartom.')
DESC_EN = ('The old road course by Livorno (1922-1930) on today\'s roads: from the sea at Ardenza through Montenero and Savolano up to the ridge at Castellaccio (287 m), '
           'down through the pines to the sea at Romito and back along the cliffs through Calafuria and Antignano. One lap, 19.1 km, 100 cars from a flying start.')

def f1(v): return ('%.1f' % v).rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def build_track():
    P = game_line()
    pts = ','.join('[%s,%s]' % (f1(round(x, 1)), f1(round(z, 1))) for x, z in P)
    hk = H[::2]; lvh = ','.join(str(int(round(v * 10))) for v in hk)   # every 10 m, decimetres above the sea
    names = []
    for lab, s, lines in NAMES:
        x, z = float(P[sidx(s), 0]), float(P[sidx(s), 1])
        names.append('      [%s, %s, %s, %s],' % (json.dumps(lab, ensure_ascii=False), f1(round(x, 1)), f1(round(z, 1)), json.dumps(lines)))
    brO = [xz((a + b) / 2) for a, b in J['bridges'] if b - a > 20]
    brU = [xz(e[0]) for e in J['over'] if e[1] == 'rail'][:1]
    src = '''/* Track definition 'livorno'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Livorno, Italy: the old road course of 1922-1930 by Livorno on today's roads, one lap clockwise (docs/proga-livorno.md): the start on the seafront
  // road on the bridge over the Rio Ardenza by the seafront terrace (Ardenza Mare), the streets of Ardenza, under the railway, Via di Montenero, the
  // provincial road SP9 (Via del Castellaccio, Via della Porcigliana past Savolano and its hairpins, Via di Quercianella over the ridge at
  // Castellaccio and down through the pines to the coast at Romito), the coast road along the cliffs (Via del Littorale: Calafuria, Boccale,
  // Miramare), Antignano past its castle and the seafront back to the line: %(km)s km (the reports of the time said 22.5 km: the roads have changed).
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/proga-podatki.py (tools/livorno/config.json), the corners rounded
  // (sigma 3 m), the roundabout of today on Via di Montenero straightened; metres, origin = the start line, x east, z south. GENERATED by
  // tools/livorno/build.py (edit the names, widths and text there).
  // Heights (LV_H): Copernicus DEM GLO-30 less the tree crowns (Meta / WRI canopy height) and the buildings (OSM), smoothed, the grades at most
  // 12 %%, the bridges straight from bank to bank; every 10 m from the start line, decimetres above the sea (the start 3.8 m, the ridge 287 m).
  // Widths: the real roads' in proportion, widened to race width (the seafront 12 m, the coast road 10.8 m, Via di Montenero 10 m, the provincial
  // road and the streets 9.2 m). The names: places and plain descriptions only (no names of people, events or firms).
  // Data: the OSM-derived data in this file under the ODbL 1.0; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved; the canopy: Meta and
  // World Resources Institute, High Resolution Canopy Height Maps (CC BY 4.0).
  const LV_H = [%(lvh)s];
  TRACK_DEFS.push({
    id: 'livorno', name: 'Livorno, Italija', theme: 'livorno', laps: 1, halfWidth: 5.0,
    desc: %(desc)s,
    en: { name: 'Livorno, Italy', desc: %(desc_en)s },
    start: [0, 0], runoff: 0.42, inner: 3.0, side: 3.4, gradeForce: true, elevSmooth: 16, realKm: %(km)s,
    rivals: 20,   // a full field (Core: 20 rivals at least, the tests' races)
    raceRivals: 99, flyStart: true,   // the game's Circuit race here: 99 rivals (100 cars) from a flying start along the seafront, as at Nürburg (game.js newRace)
    elev: LV_H.map((h, i) => [i / LV_H.length, h / 10]),
    widths: %(widths)s,
    // the bridges: the road over the coves of the coast and the streams (brO), the railway over the road in Ardenza (brU); the world builder draws them
    brO: %(brO)s, brU: %(brU)s,
    // places and corners on the HUD ([label, x, z, the commentator's lines]; the descriptive labels have their English in js/lang.js)
    names: [
%(names)s
    ],
    points: [%(pts)s]
  });
})();
''' % dict(km='%.2f' % (L / 1000), lvh=lvh, desc=json.dumps(DESC, ensure_ascii=False), desc_en=json.dumps(DESC_EN), widths=json.dumps(widths()),
           brO=json.dumps(brO), brU=json.dumps(brU), names='\n'.join(names), pts=pts)
    path = os.path.join(ROOT, 'js', 'tracks', 'livorno.js'); open(path, 'w').write(src)
    print('wrote', path, len(src) // 1024, 'KB;', NP, 'points,', len(hk), 'heights')

if __name__ == '__main__':
    what = sys.argv[1:] or ['track']
    if 'track' in what: build_track()
