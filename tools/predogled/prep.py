"""tools/predogled/prep.py <id...>: scene data for the track previews (proge.json, podatki/osm/<id>.xml -> podatki/scenes/<id>.json): the car spot on the planned section and the OSM features around it (local metres)."""
import sys, os, json, math, xml.etree.ElementTree as ET
from collections import defaultdict

SP = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(SP, 'podatki')
OUT = os.path.join(DATA, 'scenes'); os.makedirs(OUT, exist_ok=True)
R = 560.0  # radius of exported features (m)

# per track: osm file, road key, section [start,end] or toward [lat,lon] (car 150 m before it), look
T = json.load(open(os.path.join(SP, 'proge.json'), encoding='utf-8'))

def load(path):
    r = ET.parse(path if os.path.isabs(path) else os.path.join(DATA, 'osm', path)).getroot()
    N = {n.get('id'): (float(n.get('lat')), float(n.get('lon')), {t.get('k'): t.get('v') for t in n.findall('tag')}) for n in r.iter('node')}
    W = {}
    for w in r.iter('way'):
        W[w.get('id')] = ([nd.get('ref') for nd in w.findall('nd') if nd.get('ref') in N], {t.get('k'): t.get('v') for t in w.findall('tag')})
    Rl = []
    for rel in r.iter('relation'):
        Rl.append(([(m.get('ref'), m.get('role')) for m in rel.findall('member') if m.get('type') == 'way'], {t.get('k'): t.get('v') for t in rel.findall('tag')}))
    return N, W, Rl

def chain_of(W, key):
    sel = [(ids, t) for ids, t in W.values() if len(ids) > 1 and t.get('highway') and key in (t.get('name', '') + '|' + t.get('name:en', '') + '|' + t.get('ref', ''))]
    adj = defaultdict(list)
    for i, (ids, t) in enumerate(sel): adj[ids[0]].append(i); adj[ids[-1]].append(i)
    used = set(); chains = []
    for i in range(len(sel)):
        if i in used: continue
        used.add(i); ch = list(sel[i][0]); tg = [sel[i][1]] * (len(ch) - 1)
        for end in (1, 0):
            while True:
                node = ch[-1] if end else ch[0]
                nxt = [j for j in adj[node] if j not in used]
                if not nxt: break
                j = nxt[0]; used.add(j); ids = sel[j][0]; seq = ids if ids[0] == node else ids[::-1]
                if end: ch += seq[1:]; tg += [sel[j][1]] * (len(seq) - 1)
                else: ch = seq[::-1][:-1] + ch; tg = [sel[j][1]] * (len(seq) - 1) + tg
        chains.append((ch, tg))
    return max(chains, key=lambda c: len(c[0]))

def rings_of(W, members):
    """join member ways into closed rings"""
    segs = [list(W[m][0]) for m in members if m in W and len(W[m][0]) > 1]
    rings = []
    while segs:
        cur = segs.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for k, s in enumerate(segs):
                if s[0] == cur[-1]: cur += s[1:]
                elif s[-1] == cur[-1]: cur += s[::-1][1:]
                elif s[-1] == cur[0]: cur = s[:-1] + cur
                elif s[0] == cur[0]: cur = s[::-1][:-1] + cur
                else: continue
                segs.pop(k); changed = True; break
        if cur[0] == cur[-1] and len(cur) > 3: rings.append(cur)
    return rings

def build(tid):
    d = T[tid]; N, W, Rl = load(os.path.join(DATA, 'osm', tid + '.xml'))
    ch, tg = chain_of(W, d['key'])
    o0 = N[ch[0]]
    def xy0(p, o): return ((p[1] - o[1]) * 111320 * math.cos(math.radians(o[0])), (p[0] - o[0]) * 110540)
    P = [xy0(N[i], o0) for i in ch]
    # resample 5 m
    S = []; F = []
    for k in range(len(P) - 1):
        a, b = P[k], P[k + 1]; n = max(1, int(math.dist(a, b) // 5))
        for s in range(n): S.append((a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n)); F.append(tg[k])
    S.append(P[-1]); F.append(tg[-1])
    def ll(p): return (o0[0] + p[1] / 110540, o0[1] + p[0] / (111320 * math.cos(math.radians(o0[0]))))
    def nearest(lat, lon):
        q = xy0((lat, lon), o0); return min(range(len(S)), key=lambda i: math.dist(S[i], q))
    # feature points for scoring
    G = defaultdict(list)
    def addpts(pts, c):
        for a, b in zip(pts, pts[1:]):
            n = max(1, int(math.dist(a, b) // 8))
            for s in range(n + 1):
                x = a[0] + (b[0] - a[0]) * s / n; y = a[1] + (b[1] - a[1]) * s / n; G[(int(x // 60), int(y // 60))].append((x, y, c))
    def cls(t):
        c = []
        if t.get('aerialway') and t['aerialway'] not in ('station', 'pylon', 'zip_line', 'magic_carpet'): c.append('lift')
        if t.get('natural') in ('water', 'coastline', 'bay') or t.get('water') or t.get('landuse') == 'reservoir': c.append('water')
        if t.get('natural') == 'beach': c.append('beach')
        if t.get('leisure') == 'marina': c.append('marina')
        if 'piste:type' in t: c.append('piste')
        if t.get('natural') == 'cliff': c.append('cliff')
        if t.get('landuse') in ('farmland', 'orchard') or 'crop' in t: c.append('farm')
        if t.get('waterway') in ('stream', 'river'): c.append('stream')
        if 'building' in t: c.append('bldg')
        return c
    for ids, t in W.values():
        cs = cls(t)
        if cs and len(ids) > 1:
            pts = [xy0(N[i], o0) for i in ids]
            for c in cs: addpts(pts if c != 'bldg' else pts[:1], c)
    for mem, t in Rl:
        for c in cls(t):
            for m, role in mem:
                if m in W and len(W[m][0]) > 1: addpts([xy0(N[i], o0) for i in W[m][0]], c)
    for nid, (la, lo, t) in N.items():
        if t.get('aerialway') == 'station':
            q = xy0((la, lo), o0); G[(int(q[0] // 60), int(q[1] // 60))].append((q[0], q[1], 'lift'))
    WT = dict(lift=3, piste=1.2, water=2.2, beach=2, marina=2, cliff=0.5, farm=1.4, stream=0.8)
    def near_cls(p):
        out = set(); nb = 0
        for gx in (int(p[0] // 60) - 1, int(p[0] // 60), int(p[0] // 60) + 1):
            for gy in (int(p[1] // 60) - 1, int(p[1] // 60), int(p[1] // 60) + 1):
                for x, y, c in G.get((gx, gy), ()):
                    if (x - p[0]) ** 2 + (y - p[1]) ** 2 < 3600:
                        if c == 'bldg': nb += 1
                        else: out.add(c)
        return out, nb
    NC = [None] * len(S)
    def nc(i):
        if NC[i] is None: NC[i] = near_cls(S[i])
        return NC[i]
    H = [math.atan2(S[min(len(S) - 1, i + 3)][0] - S[max(0, i - 3)][0], S[min(len(S) - 1, i + 3)][1] - S[max(0, i - 3)][1]) for i in range(len(S))]
    def score_view(i, dr):
        a_, b_ = S[max(0, min(len(S) - 1, i - 3 * dr))], S[max(0, min(len(S) - 1, i + 3 * dr))]
        fx, fy = b_[0] - a_[0], b_[1] - a_[1]; L = math.hypot(fx, fy) or 1; fx /= L; fy /= L; rx, ry = fy, -fx
        c0 = S[i]; cnt = defaultdict(int); nb = 0
        for gx_ in range(int(c0[0] // 60) - 3, int(c0[0] // 60) + 4):
            for gy_ in range(int(c0[1] // 60) - 3, int(c0[1] // 60) + 4):
                for x, y, c in G.get((gx_, gy_), ()):
                    a = (x - c0[0]) * fx + (y - c0[1]) * fy; l = (x - c0[0]) * rx + (y - c0[1]) * ry
                    if -8 < a < 125 and abs(l) < 13 + 0.33 * max(0, a):
                        if c == 'bldg': nb += 1
                        else: cnt[c] += 1
        sc_ = sum(WT.get(c, 0) * min(v, 30) / 30 for c, v in cnt.items()) + min(1.2, nb * 0.06)
        js = [i + dr * k for k in range(0, 25) if 0 <= i + dr * k < len(S)]
        if len(js) < 12: return -1
        br = sum(1 for j in js if F[j].get('bridge') not in (None, 'no')) / len(js)
        tu = sum(1 for j in js if F[j].get('tunnel') not in (None, 'no')) / len(js)
        if d.get('must') == 'tu' and tu == 0: return -1
        if d.get('must') == 'br' and br == 0: return -1
        turn = sum(abs((H[js[j + 1]] - H[js[j]] + math.pi) % (2 * math.pi) - math.pi) for j in range(len(js) - 1))
        sc_ += 3 * br + 3 * tu + math.degrees(turn) / 250
        if d.get('want') == 'water': sc_ += 1.5 * min(1, (cnt['water'] + cnt['marina'] + cnt['beach']) / 30)
        if d.get('focus'): sc_ += 7 * min(1, cnt[d['focus']] / 18)
        if d.get('must') == 'tu' and F[i].get('tunnel') not in (None, 'no'): sc_ += 3
        if d.get('want') == 'bridge': sc_ += 2 * br
        return sc_
    def score(i, dr):
        js = [i + dr * k for k in range(0, 29, 2) if 0 <= i + dr * k < len(S)]
        if len(js) < 10: return -1
        sc = 0.0; cnt = defaultdict(int); nb = 0
        for j in js:
            c, b = nc(j); nb += b
            for x in c: cnt[x] += 1
        for x, v in cnt.items(): sc += WT.get(x, 0) * v / len(js)
        sc += min(1.5, nb * 0.02)
        br = sum(1 for j in js if F[j].get('bridge') not in (None, 'no')) / len(js)
        tu = sum(1 for j in js if F[j].get('tunnel') not in (None, 'no')) / len(js)
        sc += 3 * br + 3 * tu
        turn = 0.0
        for j in range(len(js) - 1):
            a, b = js[j], js[j + 1]
            turn += abs((H[b] - H[a] + math.pi) % (2 * math.pi) - math.pi)
        sc += math.degrees(turn) / 300
        if d.get('want') == 'water': sc += 2 * (cnt['water'] + cnt['marina'] + cnt['beach']) / len(js)
        if d.get('want') == 'bridge': sc += 2 * br
        if d.get('must') == 'tu' and tu == 0: return -1
        if d.get('must') == 'br' and br == 0: return -1
        return sc
    if 'car' in d:
        k = nearest(d['car'][0], d['car'][1]); lo, hi = k, k; drs = (d['car'][2],)
    elif 'toward' in d:
        k = nearest(*d['toward']); lo, hi = max(0, k - 70), min(len(S) - 1, k + 10)
        drs = (1,) if k > len(S) // 2 else (-1,)
    if 'car' in d: pass
    elif 'toward' in d: pass
    else:
        if 'sec' in d:
            a, b = nearest(*d['sec'][0]), nearest(*d['sec'][1]); lo, hi = min(a, b), max(a, b)
        else: lo, hi = 0, len(S) - 1
        drs = (1, -1)
    best = None
    for i in range(lo, hi + 1, 2):
        for dr in drs:
            s = score_view(i, dr)
            if best is None or s > best[0]: best = (s, i, dr)
    _, icar, dr = best
    # origin at the car; track in travel order from 400 m behind to 700 m ahead
    car = S[icar]; lat0, lon0 = ll(car)
    org = (lat0, lon0)
    def xy(p): return [round((p[1] - lon0) * 111320 * math.cos(math.radians(lat0)), 2), round((p[0] - lat0) * 110540, 2)]
    idx = [icar + dr * k for k in range(-80, 141) if 0 <= icar + dr * k < len(S)]
    track = dict(pts=[xy(ll(S[i])) for i in idx], br=[1 if F[i].get('bridge') not in (None, 'no') else 0 for i in idx],
                 tu=[1 if F[i].get('tunnel') not in (None, 'no') else 0 for i in idx], icar=idx.index(icar))
    def within(pts): return any(p[0] * p[0] + p[1] * p[1] < R * R for p in pts)
    sc = dict(id=tid, origin=[lat0, lon0], track=track, roads=[], lifts=[], stations=[], bldg=[], water=[], beach=[], wood=[], farm=[],
              pisteA=[], pisteL=[], cliff=[], stream=[], marina=[], falls=[], waterPts=[], coast=[], cfg=d['cfg'])
    WID = dict(motorway=10, trunk=8, primary=7.5, secondary=7, tertiary=6.5, unclassified=5.5, residential=5.5, service=4, track=3.5, living_street=5, raceway=10)
    trackset = set(ch)
    for wid, (ids, t) in W.items():
        if len(ids) < 2: continue
        pts = [xy((N[i][0], N[i][1])) for i in ids]
        if not within(pts): continue
        hw = t.get('highway')
        closed = ids[0] == ids[-1] and len(ids) > 3
        if hw in WID and not t.get('area') == 'yes':
            if all(i in trackset for i in ids): continue
            if t.get('tunnel') not in (None, 'no'): continue
            sc['roads'].append(dict(pts=pts, w=WID[hw], br=1 if t.get('bridge') not in (None, 'no') else 0))
        a = t.get('aerialway')
        if a and a not in ('station', 'pylon', 'zip_line', 'magic_carpet'):
            pyl = [xy((N[i][0], N[i][1])) for i in ids if N[i][2].get('aerialway') == 'pylon']
            sc['lifts'].append(dict(type=a, pts=pts, pylons=pyl))
        if 'building' in t and closed:
            h = None
            try:
                if t.get('height'): h = float(t['height'].split()[0])
                elif t.get('building:levels'): h = float(t['building:levels']) * 3 + 1
            except ValueError: h = None
            sc['bldg'].append(dict(ring=pts, h=h))
        if closed and (t.get('natural') == 'water' or t.get('water') or t.get('landuse') == 'reservoir'): sc['water'].append(pts)
        if t.get('natural') in ('water', 'coastline') or t.get('water') or t.get('landuse') == 'reservoir': sc['waterPts'] += pts[::2]
        if t.get('natural') == 'coastline': sc['coast'].append(pts)
        if closed and t.get('natural') == 'beach': sc['beach'].append(pts)
        if closed and (t.get('natural') in ('wood', 'scrub') or t.get('landuse') == 'forest'): sc['wood'].append(pts)
        if closed and (t.get('landuse') in ('farmland', 'orchard', 'meadow') or 'crop' in t): sc['farm'].append(pts)
        if closed and t.get('leisure') == 'marina': sc['marina'].append(pts)
        if 'piste:type' in t:
            if closed and t.get('area') == 'yes': sc['pisteA'].append(pts)
            else: sc['pisteL'].append(pts)
        if t.get('natural') == 'cliff': sc['cliff'].append(pts)
        if t.get('waterway') in ('stream', 'river'): sc['stream'].append(dict(pts=pts, w=6 if t['waterway'] == 'river' else 2))
    for mem, t in Rl:
        kind = None
        if t.get('natural') == 'water' or t.get('water') or t.get('landuse') == 'reservoir': kind = 'water'
        elif t.get('natural') in ('wood', 'scrub') or t.get('landuse') == 'forest': kind = 'wood'
        elif t.get('natural') == 'beach': kind = 'beach'
        elif t.get('landuse') in ('farmland', 'orchard') or 'crop' in t: kind = 'farm'
        elif t.get('leisure') == 'marina': kind = 'marina'
        if not kind: continue
        outer = [m for m, role in mem if role in ('outer', '')]
        for ring in rings_of(W, outer):
            pts = [xy((N[i][0], N[i][1])) for i in ring]
            if within(pts) or kind == 'water':
                sc[kind].append(pts)
        if kind == 'water':
            for m, role in mem:
                if m in W: sc['waterPts'] += [xy((N[i][0], N[i][1])) for i in W[m][0][::2]]
    for nid, (la, lo, t) in N.items():
        p = xy((la, lo))
        if p[0] * p[0] + p[1] * p[1] > R * R: continue
        if t.get('aerialway') == 'station': sc['stations'].append(p)
        if t.get('waterway') == 'waterfall' or t.get('natural') == 'waterfall': sc['falls'].append(p)
    sc['waterPts'] = [p for p in sc['waterPts'] if p[0] * p[0] + p[1] * p[1] < (R * 1.6) ** 2][:4000]
    # elevation tiles (terrarium z15) covering the area
    z = 15; n = 2 ** z
    def tile(lat, lon):
        x = (lon + 180) / 360 * n; la = math.radians(lat)
        y = (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n
        return x, y
    dl = 640 / 110540; dlo = 640 / (111320 * math.cos(math.radians(lat0)))
    x0, y0 = tile(lat0 + dl, lon0 - dlo); x1, y1 = tile(lat0 - dl, lon0 + dlo)
    sc['tiles'] = [[z, x, y] for x in range(int(x0), int(x1) + 1) for y in range(int(y0), int(y1) + 1)]
    json.dump(sc, open(os.path.join(OUT, tid + '.json'), 'w'), separators=(',', ':'))
    return '%-13s car %.5f,%.5f dir %+d  roads %d lifts %d bldg %d water %d wood %d farm %d piste %d/%d tiles %d' % (
        tid, lat0, lon0, dr, len(sc['roads']), len(sc['lifts']), len(sc['bldg']), len(sc['water']), len(sc['wood']), len(sc['farm']), len(sc['pisteA']), len(sc['pisteL']), len(sc['tiles']))

if __name__ == '__main__':
    for tid in (sys.argv[1:] or list(T)):
        print(build(tid))
