# (pictures only) where is there really asphalt just outside the circuit's edge? sampled off the latest top tiles (fn30 L00..L36, the edge
# taken off in the openings so the ground beyond shows): per circuit station and side, the share of asphalt-coloured samples 0.6..2.2 m out -> asphseen.json
import json, numpy as np
from PIL import Image
src = open('ebfix2.py').read(); exec(src[:src.index("R = json.load(open('eb7-D2-ribbons.json'))")])
C = json.load(open('loopviews.json')); TILES = []
for k, (cx, cz) in enumerate(C):
    TILES.append((cx, cz, np.asarray(Image.open('sh-fn30-L%02d.png' % k).convert('RGB')).astype(int)))
def sample(x, z):
    best = None
    for cx, cz, a in TILES:
        m = 23 - max(abs(x - cx), abs(z - cz))
        if m > 1 and (best is None or m > best[0]): best = (m, cx, cz, a)
    if best is None: return None
    _, cx, cz, a = best; px, py = int((x - cx + 23) * 900 / 46), int((z - cz + 23) * 900 / 46)
    return a[max(py - 1, 0):py + 2, max(px - 1, 0):px + 2].reshape(-1, 3).mean(0)
def kind(c):
    r, g, b = c
    if min(c) > 190: return 'white'
    if g > r + 12 and g > b + 5: return 'grass'
    if r > g + 30: return 'sand'
    if abs(r - b) < 35 and g <= r + 5 and g < 170: return 'asph'
    return 'other'
Q, N = RS['T']; hw = LN['T'][1]; out = {}
for sd in (-1, 1):
    fr = np.zeros(len(Q))
    for q in range(len(Q)):
        ks = [kind(c) for o in (0.6, 1.0, 1.4, 1.8, 2.2) for c in [sample(*(Q[q] + sd * N[q] * (hw + o)))] if c is not None]
        ks = [k for k in ks if k != 'white']
        fr[q] = sum(k == 'asph' for k in ks) / max(len(ks), 1)
    out[str(sd)] = fr.round(2).tolist()
    print('side', sd, 'stations with asphalt beyond the edge', int((fr >= 0.5).sum()))
json.dump(out, open('asphseen.json', 'w'))
