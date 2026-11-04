"""For every named road (or ref) of an OSM extract: the best 2.75 km window by twistiness + share with the main element in the portrait camera view."""
import importlib.util, math, sys
from collections import defaultdict
spec = importlib.util.spec_from_file_location('prep', __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'prep.py')); P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
MAJOR = ('trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential')
def elems(N, Wy, cls, xy):
    E = []
    for ids, t in Wy.values():
        if len(ids) < 2: continue
        hit = (cls == 'lift' and t.get('aerialway') and t['aerialway'] not in ('station', 'pylon', 'zip_line', 'magic_carpet')) or \
              (cls == 'water' and (t.get('natural') in ('water', 'coastline', 'beach') or t.get('water') or t.get('leisure') == 'marina')) or \
              (cls == 'farm' and (t.get('landuse') in ('farmland', 'orchard') or 'crop' in t)) or \
              (cls == 'rail' and t.get('railway') in ('narrow_gauge', 'rail', 'light_rail')) or (cls == 'cliff' and t.get('natural') in ('cliff', 'bare_rock')) or \
              (cls == 'piste' and ('piste:type' in t or (t.get('aerialway') and t['aerialway'] not in ('station', 'pylon', 'zip_line', 'magic_carpet'))))
        if not hit: continue
        q = [xy(N[i]) for i in ids]
        for a, b in zip(q, q[1:]):
            n = max(1, int(math.dist(a, b) // 8))
            for s in range(n + 1): E.append((a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n))
    for mem, t in RL:
        hit = (cls == 'water' and (t.get('natural') in ('water', 'coastline') or t.get('water') or t.get('landuse') == 'reservoir')) or (cls == 'farm' and (t.get('landuse') in ('farmland',) or 'crop' in t))
        if not hit: continue
        for m, role in mem:
            if m in Wy and len(Wy[m][0]) > 1:
                q = [xy(N[i]) for i in Wy[m][0]]
                for a, b in zip(q, q[1:]):
                    n = max(1, int(math.dist(a, b) // 8))
                    for s in range(n + 1): E.append((a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n))
    G = defaultdict(list)
    for p in E: G[(int(p[0] // 60), int(p[1] // 60))].append(p)
    return G
RL = []
def window(S, F, G, cls, W=2750):
    if len(S) < 400: return None
    H = [math.atan2(S[min(len(S) - 1, i + 3)][0] - S[max(0, i - 3)][0], S[min(len(S) - 1, i + 3)][1] - S[max(0, i - 3)][1]) for i in range(len(S))]
    T = [0.0] + [abs((H[i] - H[i - 1] + math.pi) % (2 * math.pi) - math.pi) for i in range(1, len(H))]
    vis = []
    for i in range(len(S)):
        if cls in ('bridge', 'tunnel'):
            vis.append(any(F[j].get(cls) not in (None, 'no') for j in range(i, min(len(S), i + 20)))); continue
        a_, b_ = S[max(0, i - 3)], S[min(len(S) - 1, i + 3)]; fx, fy = b_[0] - a_[0], b_[1] - a_[1]; l = math.hypot(fx, fy) or 1; fx /= l; fy /= l; rx, ry = fy, -fx
        ok = False
        for gx in range(int(S[i][0] // 60) - 2, int(S[i][0] // 60) + 3):
            for gy in range(int(S[i][1] // 60) - 2, int(S[i][1] // 60) + 3):
                for x, y in G.get((gx, gy), ()):
                    A = (x - S[i][0]) * fx + (y - S[i][1]) * fy
                    if -8 < A < 110 and abs((x - S[i][0]) * rx + (y - S[i][1]) * ry) < 13 + 0.33 * max(0, A): ok = True; break
                if ok: break
            if ok: break
        vis.append(ok)
    n = min(int(W // 5), len(S) - 1); best = None
    for i in range(0, max(1, len(S) - n), 4):
        j = i + n; turn = math.degrees(sum(T[i + 1:j + 1])) / (n * 5 / 1000); v = sum(vis[i:j:2]) / max(1, len(range(i, j, 2)))
        hp = 0; k = i
        while k < j:
            m = k
            while m < j and (m - k) * 5 < 80: m += 1
            if math.degrees(abs((H[m] - H[k] + math.pi) % (2 * math.pi) - math.pi)) > 140: hp += 1; k = m
            else: k += 4
        sc = min(turn, 1200) / 1200 + 1.2 * v + 0.08 * min(hp, 8)
        if best is None or sc > best[0]: best = (sc, i, j, turn, v, hp)
    return best
def scan(path, cls, top=3, only=None):
    global RL
    N, Wy, Rl = P.load(path); RL = Rl
    keys = defaultdict(float)
    for ids, t in Wy.values():
        if t.get('highway') in MAJOR and len(ids) > 1:
            k = t.get('name:en') or t.get('name') or t.get('ref')
            if k: keys[k] += 1
    o = next(iter(N.values()))
    xy = lambda p: ((p[1] - o[1]) * 111320 * math.cos(math.radians(o[0])), (p[0] - o[0]) * 110540)
    G = elems(N, Wy, cls, xy) if cls not in ('bridge', 'tunnel') else None
    res = []
    for key in keys:
        if only and not any(o_ in key for o_ in only): continue
        try: ch, tg = P.chain_of(Wy, key)
        except ValueError: continue
        pts = [xy(N[i]) for i in ch]; S = []; F = []
        for k, (a, b) in enumerate(zip(pts, pts[1:])):
            m = max(1, int(math.dist(a, b) // 5))
            for s in range(m): S.append((a[0] + (b[0] - a[0]) * s / m, a[1] + (b[1] - a[1]) * s / m)); F.append(tg[k])
        b = window(S, F, G, cls)
        if not b: continue
        sc, i, j, turn, v, hp = b
        ll = lambda p: (o[0] + p[1] / 110540, o[1] + p[0] / (111320 * math.cos(math.radians(o[0]))))
        res.append((sc, key, turn, hp, v, ll(S[i]), ll(S[j])))
    res.sort(reverse=True)
    for sc, key, turn, hp, v, a, b in res[:top]:
        print('  %-12s %-30s %4d deg/km %d hp  %s in view %3d%%  %.5f,%.5f -> %.5f,%.5f' % (path.split('/')[-1][:-4], key[:30], turn, hp, cls, 100 * v, a[0], a[1], b[0], b[1]))
if __name__ == '__main__':
    cls = sys.argv[1]; only = [x for x in sys.argv[2:] if not x.endswith('.xml')] or None
    for p in [x for x in sys.argv[2:] if x.endswith('.xml')]: scan(p, cls, 6 if only else 3, only)
