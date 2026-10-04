# Mockup only: the Earth for the journey on the globe -> site/assets/geo/*.webp|png and site/geo.js (window.GEO: the tracks' places and lands, the
# countries' names and the outlines of the tracks' countries; the borders, towns and areas only in raw/geo/geo.json).
# earth: the Blue Marble (NASA, public domain); l1-<region>: each region's painted land (~800 km); l2-<track>, l3-<track>: a track's
# surroundings (80 km) and its own land (14 km), each with its heights (-h.png, 16 bit); the borders, the countries' outlines and the
# names on the map (Natural Earth, public domain); the real tracks' roads on the land (the game's own line, placed by geo_places.py).
# Usage: python3 geo_build.py [site] [only: earth,l1,tracks,vectors] [tracks: vrsic,spa]
import json, math, os, sys
import numpy as np
import shapefile
from PIL import Image
from shapely.geometry import shape, LineString, MultiLineString, Polygon, MultiPolygon
from geo_lib import RAW, HERE, BM_PATH, Geo, track, radii
from geo_paint import box_km, bm_palette, mix, paint, heights, save_heights, DETAIL, SEASON

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else ['earth', 'l1', 'tracks', 'vectors']
IDS = sys.argv[3].split(',') if len(sys.argv) > 3 else None
OUT = os.path.join(SITE, 'assets', 'geo'); os.makedirs(OUT, exist_ok=True)
P = json.load(open(os.path.join(RAW, 'places.json')))
GJ = os.path.join(RAW, 'geo.json'); G = json.load(open(GJ)) if os.path.exists(GJ) else {'tracks': {}, 'l1': {}}
def webp(img, path, q): Image.fromarray(img).save(path, 'WEBP', quality=q, method=6); return os.path.getsize(path) // 1024
def rbox(b): return [round(v, 6) for v in b]

if 'earth' in ONLY:
    im = Image.open(BM_PATH).convert('RGB').resize((4096, 2048), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32); a = np.clip((a - 4) * 1.06, 0, 255).astype(np.uint8)   # (a touch more contrast)
    print('earth', webp(a, os.path.join(OUT, 'earth.webp'), 84), 'KB')

PAL = {}
def region_pal(r):
    if r not in PAL:
        L = P['l1'][r]; PAL[r] = bm_palette(box_km(L['lat'], L['lon'], L['km']))
    return PAL[r]

if 'l1' in ONLY:
    for r, L in P['l1'].items():
        b = box_km(L['lat'], L['lon'], L['km']); pal = {k: tuple(min(255, c * 1.08) for c in v) for k, v in region_pal(r).items()}
        img, h, lc = paint(b, 2048, pal, 8, zfac=3.2, detail=0.0, lc_res=2048, water_fix=False)
        G['l1'][r] = {'box': rbox(b), 'img': 'assets/geo/l1-%s.webp' % r}
        print('l1', r, webp(img, os.path.join(OUT, 'l1-%s.webp' % r), 80), 'KB', flush=True)
        json.dump(G, open(GJ, 'w'))

if 'tracks' in ONLY:
    for tid, t in P['tracks'].items():
        if IDS and tid not in IDS: continue
        c = t['center']; pal = region_pal(t['l1'])
        b2 = box_km(c[0], c[1], t['l2km']); b3 = box_km(c[0], c[1], t['l3km'])
        img2, _, _ = paint(b2, 2048, mix(pal, DETAIL, 0.55), 11, zfac=1.5, detail=0.5, lc_res=2048, seed=4, season=SEASON.get(tid))
        img2 = np.asarray(Image.fromarray(img2).resize((1024, 1024), Image.LANCZOS))   # (seen from 30 km up and higher: 1024 is enough, and lighter on a phone)
        k2 = webp(img2, os.path.join(OUT, 'l2-%s.webp' % tid), 84); lo2, hi2 = save_heights(heights(b2, 257, 11), os.path.join(OUT, 'l2-%s-h.png' % tid))
        img3, _, _ = paint(b3, 2048, DETAIL, 13, zfac=1.25, detail=1.0, lc_res=int(min(2048, t['l3km'] * 100)), seed=3, season=SEASON.get(tid))
        k3 = webp(img3, os.path.join(OUT, 'l3-%s.webp' % tid), 82); lo3, hi3 = save_heights(heights(b3, 257, 13), os.path.join(OUT, 'l3-%s-h.png' % tid))
        e = {k: t[k] for k in ('kind', 'lat0', 'lon0', 'rot', 'offset', 'start', 'finish', 'open', 'names', 'l1')}
        e['l2'] = {'box': rbox(b2), 'img': 'assets/geo/l2-%s.webp' % tid, 'h': 'assets/geo/l2-%s-h.png' % tid, 'lo': lo2, 'hi': hi2}
        e['l3'] = {'box': rbox(b3), 'img': 'assets/geo/l3-%s.webp' % tid, 'h': 'assets/geo/l3-%s-h.png' % tid, 'lo': lo3, 'hi': hi3}
        if t['kind'] == 'real':   # the road on the land: the game's own line, its real heights
            T = track(tid); Pt = np.array(T['pts']); Gg = Geo(t['lat0'], t['lon0'], t['rot']); la, lo = Gg.to_ll(Pt[:, 0], Pt[:, 1])
            k = max(1, len(Pt) // 400); e['route'] = [[round(float(a), 6), round(float(b), 6), round(float(y + t['offset']), 1)] for a, b, y in zip(la[::k], lo[::k], Pt[::k, 2])]
        G['tracks'][tid] = e
        print(tid, 'l2', k2, 'KB, l3', k3, 'KB', flush=True)
        json.dump(G, open(GJ, 'w'))

def read(name):
    r = shapefile.Reader(os.path.join(RAW, 'ne', name, name)); f = [x[0] for x in r.fields[1:]]
    return [(dict(zip(f, rec.record)), shape(rec.shape.__geo_interface__)) for rec in r.shapeRecords()]
def lines(g, tol, d=3):   # polylines of a line or polygon outline, simplified, as flat [lon, lat, lon, lat, ...]
    g = g.simplify(tol, preserve_topology=False); out = []
    parts = []
    if isinstance(g, (LineString,)): parts = [g]
    elif isinstance(g, MultiLineString): parts = list(g.geoms)
    elif isinstance(g, Polygon): parts = [g.exterior]
    elif isinstance(g, MultiPolygon): parts = [p.exterior for p in g.geoms]
    for p in parts:
        cs = list(p.coords)
        if len(cs) >= 2: out.append([round(v, d) for xy in cs for v in xy[:2]])
    return out

if 'vectors' in ONLY:
    # the borders between countries (on land), simplified to ~1 km
    B = []
    for rec, g in read('ne_50m_admin_0_boundary_lines_land'): B += lines(g, 0.01)
    G['borders'] = B
    # the countries: name, where to write it, how important (Natural Earth's label rank), and the outline of the ones with a track
    C, OUTL = [], {}
    keep = {t['names']['country'] for t in P['tracks'].values()}
    SHORT = {'United States of America': 'USA', "People's Republic of China": 'China', 'Democratic Republic of the Congo': 'DR Congo', 'Republic of the Congo': 'Congo',
             'The Bahamas': 'Bahamas', 'Federated States of Micronesia': 'Micronesia'}
    for rec, g in read('ne_10m_admin_0_countries'):
        nm = rec.get('NAME_EN') or rec['NAME']; nm = SHORT.get(nm, nm)
        if rec['TYPE'] in ('Dependency', 'Lease') or (rec['TYPE'] == 'Indeterminate' and nm != 'Antarctica'): continue   # (no bases, leases and small dependencies)
        C.append([nm, round(rec['LABEL_X'], 3), round(rec['LABEL_Y'], 3), int(rec['LABELRANK']), round(float(rec.get('MIN_LABEL') or 0), 1)])
        if nm in keep and nm != 'USA': OUTL[nm] = lines(g, 0.0005 if nm == 'Monaco' else 0.01, 4 if nm == 'Monaco' else 3)
        if nm == 'USA': OUTL['USA'] = [l for l in lines(g, 0.04, 2) if len(l) >= 40]   # (the 48 states and Alaska, coarser: it is drawn from far up; no small islands)
    for rec, g in read('ne_50m_admin_1_states_provinces'):
        if rec['name'] == 'Colorado': OUTL['Colorado'] = lines(g, 0.01); C.append(['Colorado', round(rec['longitude'], 3), round(rec['latitude'], 3), 6, 4.0])
    G['countries'] = C; G['outlines'] = OUTL
    # towns: the capitals of the world, and the bigger places round the tracks
    boxes = [v['box'] for v in G['l1'].values()]
    inb = lambda la, lo: any(b[0] <= la <= b[2] and b[1] <= lo <= b[3] for b in boxes)
    T = []; EN = {'København': 'Copenhagen', 'Nürnberg': 'Nuremberg', 'Antwerpen': 'Antwerp', 'Nur-Sultan': 'Astana', 'Ōsaka': 'Osaka', 'Kōbe': 'Kobe', 'Kōchi': 'Kochi', 'Kōfu': 'Kofu', 'Roma': 'Rome'}   # (the names in English, as the menu is)
    for rec, g in read('ne_10m_populated_places_simple'):
        la, lo = rec['latitude'], rec['longitude']; cap = 'capital' in (rec['featurecla'] or '').lower() and 'Admin-0' in (rec['featurecla'] or '')
        if cap or (inb(la, lo) and rec['scalerank'] <= 7):
            T.append([EN.get(rec['name'], rec['name']), round(lo, 3), round(la, 3), int(rec['scalerank']), 1 if cap else 0])
    G['towns'] = T
    # the seas and the mountain ranges (big ones)
    S = []
    import re
    EN_A = {'APPENNINI': 'Apennines', 'KJØLEN MOUNTAINS': 'Scandinavian Mountains', 'CHAÎNE ANNAMITIQUE': 'Annamite Range', 'HAUT ATLAS': 'High Atlas', 'ATLAS SAHARIEN': 'Saharan Atlas', 'SIKHOTE-ALIN’ RANGE': 'Sikhote-Alin'}
    def area_name(n):   # (in English, written out: no "MTS." on the map)
        n = EN_A.get(n, n); n = re.sub(r'\s+', ' ', n).strip(); n = n.title() if n.isupper() else n
        n = re.sub(r'\bMts\.', 'Mountains', n); n = re.sub(r'\bRa\.', 'Range', n); n = re.sub(r'\bCord\.', 'Cordillera', n)
        return n.replace('’', '')
    for rec, g in read('ne_50m_geography_marine_polys'):
        if rec['scalerank'] <= 2 or rec['featurecla'] in ('ocean',): p = g.representative_point(); S.append([area_name(rec['name']), round(p.x, 2), round(p.y, 2), int(rec['scalerank']), 'sea'])
    for rec, g in read('ne_10m_geography_regions_points'):
        pass
    for rec, g in read('ne_10m_geography_regions_polys'):
        if rec['FEATURECLA'] == 'Range/mtn' and rec['SCALERANK'] <= 3: p = g.representative_point(); S.append([area_name(rec['NAME']), round(p.x, 2), round(p.y, 2), int(rec['SCALERANK']), 'range'])
    G['areas'] = S
    print('vectors: borders', len(B), 'countries', len(C), 'outlines', list(OUTL), 'towns', len(T), 'areas', len(S))
    json.dump(G, open(GJ, 'w'))

# (the globe shows only the two countries of the journey: their outlines and names; the borders, towns and areas stay in geo.json)
OUT_KEYS = ('tracks', 'l1', 'countries', 'outlines')
with open(os.path.join(SITE, 'geo.js'), 'w') as f:
    f.write('/* The Earth for the journey before a race: where each track is, the land round it, the countries\' outlines and names (made by geo_build.py, do not edit). */\n')
    f.write('window.GEO = ' + json.dumps({k: G[k] for k in OUT_KEYS if k in G}, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('geo.js', os.path.getsize(os.path.join(SITE, 'geo.js')) // 1024, 'KB')
