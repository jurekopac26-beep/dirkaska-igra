# Mockup only: every track on the Earth -> raw/geo/places.json.
# real: the game's world at real scale, placed by geo_match.py / geo_monaco.py (its origin, turn and height offset: real height = game
# height + offset); scaled: a shortened copy of a real road (its start at the real start, turned towards the real finish, the finish pin
# on the real finish); invented: a made-up track, placed at a chosen real spot (for the journey on the globe only).
import sys, json, math, os
import numpy as np
from geo_lib import RAW, DEM, Geo, track, radii, haversine

M = json.load(open(os.path.join(RAW, 'match.json')))
CFG = {
    'vrsic': dict(kind='real', start='Kranjska Gora', finish='Vršič pass', country='Slovenia', region='Julian Alps', l1='alps'),
    'ljubljana': dict(kind='real', lat0=46.05112, lon0=14.50631, rot=0.0, start='Ljubljana', country='Slovenia', region='Ljubljana', l1='alps'),
    'monaco': dict(kind='real', start='Monaco', country='Monaco', region='Côte d\'Azur', l1='riviera'),
    'rbring': dict(kind='real', start='Spielberg', country='Austria', region='Styria', l1='alps'),
    'suzuka': dict(kind='real', start='Suzuka', country='Japan', region='Mie', l1='japan'),
    'spa': dict(kind='real', start='Francorchamps', country='Belgium', region='Ardennes', l1='benelux'),
    'nring': dict(kind='real', start='Nürburg', country='Germany', region='Eifel', l1='benelux'),
    'pikes': dict(kind='scaled', s=(38.91350, -105.03680), f=(38.84050, -105.04420), start='Crystal Reservoir', finish='Summit', country='USA', region='Colorado', l1='colorado'),
    'ouninpohja': dict(kind='scaled', s=(61.753636, 24.908667), bearing=0.0, start='Hämepohja', finish='Flying finish', country='Finland', region='Jämsä', l1='finland'),
    # (the made-up worlds put where the real land round them fits their own (geo_fit.py): the lake circuit on the dry plain under the
    # Karavanke (its own lake in the infield), the seaside town on the south coast of the Piran peninsula, its shore on the real shore)
    'jezero': dict(kind='invented', c=(46.387448, 14.168398), start='Lesce', country='Slovenia', region='Upper Carniola', l1='alps'),
    'riviera': dict(kind='invented', o=(45.492821, 13.541245, 154.0), start='Piran', country='Slovenia', region='Slovenian coast', l1='alps'),
    'gora': dict(kind='invented', c=(46.3420, 13.9300), start='Pokljuka', country='Slovenia', region='Julian Alps', l1='alps'),
}
# the regional boxes (centre lat, lon; size km) shared by the tracks near each other
L1 = {'alps': (46.6, 14.2, 760), 'benelux': (50.4, 6.4, 700), 'riviera': (43.9, 7.4, 700), 'japan': (34.9, 136.6, 800), 'colorado': (38.9, -105.1, 800), 'finland': (61.8, 24.9, 800)}

def bearing(la1, lo1, la2, lo2):
    p1, p2, dl = math.radians(la1), math.radians(la2), math.radians(lo2 - lo1)
    return math.degrees(math.atan2(math.sin(dl) * math.cos(p2), math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl))) % 360

ONLY = sys.argv[1].split(',') if len(sys.argv) > 1 else None   # (only these again; the others as they were)
out = json.load(open(os.path.join(RAW, 'places.json')))['tracks'] if ONLY else {}
for tid, c in CFG.items():
    if ONLY and tid not in ONLY: continue
    T = track(tid); P = np.array(T['pts'], dtype=np.float64); n = len(P)
    # the race's start and finish along the road (a closed track: its start line, where the race also ends)
    si = min(n - 1, int(round(T['startS'] / T['step']))); fi = min(n - 1, int(round(T['finishS'] / T['step']))) if T['open'] else si
    if c['kind'] == 'real':
        m = M.get(tid, {}); lat0, lon0, rot = c.get('lat0', m.get('lat0')), c.get('lon0', m.get('lon0')), c.get('rot', m.get('rot', 0.0))
        G = Geo(lat0, lon0, rot)
    elif c['kind'] == 'scaled':
        # the start on the real start, the road's start -> finish turned towards the real finish (or the given bearing)
        sx, sz = P[si, 0], P[si, 1]; fx, fz = P[fi, 0], P[fi, 1]
        game_b = math.degrees(math.atan2(fx - sx, -(fz - sz))) % 360   # (the game's north is -z)
        want = bearing(c['s'][0], c['s'][1], c['f'][0], c['f'][1]) if 'f' in c else c['bearing']
        rot = want - game_b
        G0 = Geo(c['s'][0], c['s'][1], rot); la, lo = G0.to_ll(-sx, -sz)   # the origin such that the start lands on the real start
        lat0, lon0 = float(la), float(lo); G = Geo(lat0, lon0, rot)
    elif 'o' in c:   # the world's origin and turn given
        lat0, lon0, rot = c['o']; G = Geo(lat0, lon0, rot)
    else:
        cx, cz = P[:, 0].mean(), P[:, 1].mean(); G0 = Geo(c['c'][0], c['c'][1], 0.0); la, lo = G0.to_ll(-cx, -cz)
        lat0, lon0, rot = float(la), float(lo), 0.0; G = Geo(lat0, lon0, rot)
    la, lo = G.to_ll(P[:, 0], P[:, 1])
    # the real heights along the road, and the offset of the game's heights from them (the real tracks: from geo_match.py)
    dlat = (la.max() - la.min()) / 2 + 0.05; dlon = (lo.max() - lo.min()) / 2 + 0.07
    dem = DEM(la.min() - 0.05, lo.min() - 0.07, la.max() + 0.05, lo.max() + 0.07, 12)
    h = dem.sample(la, lo)
    off = M[tid]['offset'] if c['kind'] == 'real' and tid in M and 'offset' in M[tid] and tid != 'monaco' else float(np.median(h - P[:, 2]))
    start = (float(la[si]), float(lo[si])); finish = (float(la[fi]), float(lo[fi]))
    if c['kind'] == 'scaled' and 'f' in c: finish = c['f']
    alt = lambda p: float(dem.sample(np.array([p[0]]), np.array([p[1]]))[0]) if abs(p[0] - la.mean()) < dlat + 0.04 else float(DEM(p[0] - 0.01, p[1] - 0.01, p[0] + 0.01, p[1] + 0.01, 12).sample(np.array([p[0]]), np.array([p[1]]))[0])
    # the detail boxes: round the track (and both pins), at least 14 km (L3) and 80 km (L2)
    pts_lat = np.r_[la, start[0], finish[0]]; pts_lon = np.r_[lo, start[1], finish[1]]
    cla, clo = (pts_lat.min() + pts_lat.max()) / 2, (pts_lon.min() + pts_lon.max()) / 2
    Mr, Nr = radii(cla); ext = max((pts_lat.max() - pts_lat.min()) * math.pi / 180 * Mr, (pts_lon.max() - pts_lon.min()) * math.pi / 180 * Nr * math.cos(math.radians(cla)))
    l3 = max(14.0, ext / 1000 + 6)
    out[tid] = dict(kind=c['kind'], lat0=round(lat0, 7), lon0=round(lon0, 7), rot=round(float(rot), 3), offset=round(float(off), 1),
        start=[round(start[0], 6), round(start[1], 6), round(alt(start))], finish=[round(finish[0], 6), round(finish[1], 6), round(alt(finish))],
        center=[round(cla, 6), round(clo, 6)], l3km=round(l3, 1), l2km=80, l1=c['l1'], open=bool(T['open']),
        names=dict(start=c['start'], finish=c.get('finish', c['start']), country=c['country'], region=c['region']))
    print(tid, json.dumps(out[tid], ensure_ascii=False))
json.dump(dict(tracks=out, l1={k: dict(lat=v[0], lon=v[1], km=v[2]) for k, v in L1.items()}), open(os.path.join(RAW, 'places.json'), 'w'), indent=1, ensure_ascii=False)
