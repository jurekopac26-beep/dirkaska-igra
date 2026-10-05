# Mockup only: raw/maps (routemap.mjs, flyover.mjs) -> site/assets/maps/*.webp|webm and site/routes.js (window.ROUTES): for each track
# the route over the top map, the heights along it, the places, and frame by frame where the flyover video shows the start, the finish
# and the places. A track without its map from above yet is left out; one without its flyover yet goes without it. (The intro before
# the race, the helicopter's flight: heli.mjs, intro_data.py, intro_assets.py.)
import json, math, os, re, shutil, subprocess, sys
from PIL import Image, ImageEnhance

RAW, SITE = 'raw/maps', sys.argv[1] if len(sys.argv) > 1 else '..'
try:
    import imageio_ffmpeg; FF0 = imageio_ffmpeg.get_ffmpeg_exe()   # pip install imageio-ffmpeg (has VP9)
except ImportError: FF0 = 'ffmpeg'
FF = os.environ.get('FFMPEG', FF0)
OUT = os.path.join(SITE, 'assets', 'maps')
os.makedirs(OUT, exist_ok=True)
TRACKS = ['vrsic', 'pikes', 'ouninpohja', 'gora', 'jezero', 'riviera', 'monaco', 'rbring', 'suzuka', 'spa', 'nring']
ROADS = ('vrsic', 'pikes')   # the open roads (the others' corners, by number, name the places of a track that has no names of its own)
# the game's own names of the places along a track, in English where they are Slovenian words (proper names stay)
EN = {'Prvi ovinek': 'First Curve', 'S-zavoji': 'S Curves', 'Pod mostom': 'Under the Bridge', 'Lasnica': 'Hairpin', 'Zadnja ravnina': 'Back Straight',
      'Zadnji ovinek': 'Last Corner', 'Predor': 'Tunnel', 'tržnica': 'Market', 'mestni trg': 'Town Square', 'stari trg': 'Old Square',
      'trg ob mostovih': 'Bridges Square', 'nabrežje': 'Riverside', 'Gozdni vrhovi': 'Forest crests', 'Ribnik': 'Pond', 'Vas': 'Village', 'Vrh za vasjo': 'Crest past the village'}
# the game's names of corners that are brands, people or a circuit's famous (some registered) corner names: plain English words in the
# mockup instead, one name for a place everywhere (the game itself is not changed); its villages, mountains, streams and fields stay
NEUTRAL = {"200R": "Fast Right", "Spoon": "Double Left", "130R": "Fast Left", "La Source": "First Hairpin", "Eau Rouge": "Steep Climb", "Raidillon": "Crest", "Kemmel": "Long Straight", "Les Combes": "Hilltop Chicane", "Malmedy": "Downhill Right", "Bruxelles": "Right Hairpin", "Pouhon": "Double Left", "Fagnes": "Forest Esses", "Campus": "Chicane", "Blanchimont": "Fast Left", "Bus Stop": "Last Chicane", "Beau Rivage": "Uphill Run", "Tabac": "Harbour Left", "Piscine": "Pool Chicane", "Karussell": "Banked Hairpin", "Kleines Karussell": "Small Banked Turn", "Schwalbenschwanz": "Fast Double Right", "Fuchsröhre": "Downhill Dip", "Kesselchen": "Valley Climb", "Eiskurve": "Cold Corner", "Brünnchen": "Spring Bend", "Pflanzgarten": "Big Jump", "Sprunghügel": "Small Jump", "Wippermann": "Twisty Section", "Antoniusbuche": "Long Straight End", "Naarajärvi": "Lake Naarajärvi", "Jasna": "Lake Jasna", "Eriški most": "Erika Bridge", "Dunlop": "Uphill Left", "Degner": "Double Right", "Casio Triangle": "Last Chicane", "Lasnica Fairmont": "Lasnica Grand", "Fairmont Hairpin": "Grand Hairpin", "Anthony Noghès": "Last Corner", "La Rascasse": "Harbour Corner", "Mirabeau": "Downhill Right", "Massenet": "Long Left", "Paul Frère": "Long Right", "Speaker's Corner": "Short Left", "Stefan-Bellof-S": "Fast Esses", "Hansen's Corner": "Reservoir Bend", "Amazon": "Fast Crest", "Mutanen": "Farm Bend"}
SUBST = [["Ruska kapelica", "Russian Chapel"], ["Ruski križ", "Russian Cross"]]
def neutral(n):
    n = NEUTRAL.get(n, n)
    for a, b in SUBST: n = n.replace(a, b)
    return re.sub(r'(\d)\.(\d{3}) m\b', r'\1,\2 m', n)   # (1.158 m, the Slovene way: 1,158 m)
def en(n):
    m = re.match(r'(Zavoj|Serpentina) (\d+)(.*)$', n)
    if m: return ('Turn ' if m.group(1) == 'Zavoj' else 'Hairpin ') + m.group(2) + m.group(3)
    if n.startswith('Lasnica '): return n[8:] + ' Hairpin'
    return EN.get(n, n)

def grade(im):   # the rainy grade of the game (less saturated, a little cooler)
    rgb, a = im.convert('RGB'), im.split()[3]
    rgb = ImageEnhance.Color(rgb).enhance(0.8)
    r, g, b = rgb.split()
    rgb = Image.merge('RGB', (r.point(lambda v: int(v * 0.97)), g, b.point(lambda v: min(255, int(v * 1.03)))))
    out = rgb.convert('RGBA'); out.putalpha(a); return out

def thin(pts, n):   # about n points along a polyline (evenly by index)
    if len(pts) <= n: return pts
    k = (len(pts) - 1) / (n - 1)
    return [pts[round(i * k)] for i in range(n)]

def pace(route, d, mpp):   # the corners of a track from its route on the top map: [metres, side (-1 left, 1 right), grade 1 (hairpin) .. 6 (flat kink)]
    P = [(x * mpp, y * mpp) for x, y in route]
    n = len(P); head = []
    for i in range(n):
        a, b = P[max(0, i - 2)], P[min(n - 1, i + 2)]
        head.append(math.atan2(b[1] - a[1], b[0] - a[0]))
    kap = [0.0] * n
    for i in range(1, n - 1):
        dh = head[i + 1] - head[i - 1]
        while dh > math.pi: dh -= 2 * math.pi
        while dh < -math.pi: dh += 2 * math.pi
        ds = max(1e-3, d[i + 1] - d[i - 1]); kap[i] = dh / ds
    out, i = [], 0
    while i < n:
        if abs(kap[i]) > 1 / 320:
            j, s = i, 1 if kap[i] > 0 else -1
            while j < n and abs(kap[j]) > 1 / 420 and (1 if kap[j] > 0 else -1) == s: j += 1
            ang = sum(kap[k] * max(1, (d[min(n - 1, k + 1)] - d[max(0, k - 1)]) / 2) for k in range(i, j))
            rmin = 1 / max(abs(kap[k]) for k in range(i, j))
            if abs(ang) > 0.35:
                g = 1 if rmin < 22 else 2 if rmin < 45 else 3 if rmin < 80 else 4 if rmin < 140 else 5 if rmin < 230 else 6
                out.append([d[(i + j) // 2], s, g])
            i = j
        else: i += 1
    return out

data = {}
for t in TRACKS:
    R = {}
    if not os.path.exists(os.path.join(RAW, 'top-%s.json' % t)): print(t, 'no map yet'); continue
    # the map from above (map version 2): the land fills it (no transparency)
    J = json.load(open(os.path.join(RAW, 'top-%s.json' % t)))
    for sfx in ('', '-rain'):
        im = Image.open(os.path.join(RAW, 'top-%s%s.png' % (t, sfx))).convert('RGBA')
        if sfx: im = grade(im)
        bg = Image.new('RGB', im.size, (26, 38, 52)); bg.paste(im, (0, 0), im)
        bg.save(os.path.join(OUT, 'top-%s%s.webp' % (t, sfx)), 'WEBP', quality=78, method=6)
    pts = [(round(x, 1), round(y, 1)) for x, y in J['route']]
    R['top'] = { 'W': J['W'], 'H': J['H'], 'route': thin(pts, 220), 'mpp': J['mPerPx'] }
    L = J['raceLen']; R['len'] = L; R['open'] = J['open']
    # the height along the run (every ~1/120 of it)
    d, h = J['d'], J['h']; prof = []
    for k in range(121):
        s = L * k / 120; i = min(len(d) - 1, max(0, next((q for q in range(len(d)) if d[q] >= s), len(d) - 1)))
        prof.append(round(h[i], 1))
    R['prof'] = prof
    R['places'] = [[neutral(q['n']), round(q['d'])] for q in J['names'] if q.get('hud', True)]
    # the places the flyover's corner shows (the menu's own list in data.js comes first): the game's names, or the corners by number
    H = [[0, 'Start' if R['open'] else 'Start · finish']] + [[max(1, q[1] - 40), en(q[0])] for q in R['places']]
    if len(H) == 1 and t not in ROADS: H += [[max(1, round(c[0]) - 40), 'Turn %d' % (k + 1)] for k, c in enumerate(pace(J['route'], J['d'], J['mPerPx']))]
    if not R['open']: H.append([round(L - 150), 'Start · finish'])
    R['hud'] = H
    # the flyover (map version 1): the video, its first frame, and per frame [metres, start, finish, 0, places] where the menu shows them
    # (the start near the start, the finish near the end, a place near it; elsewhere 0: the menu hides it there anyway)
    fj = os.path.join(RAW, 'fly-%s.json' % t)
    if os.path.exists(fj):
        F = json.load(open(fj)); F['places'] = [neutral(x) for x in F['places']]
        src, dst = os.path.join(RAW, 'fly-%s.webm' % t), os.path.join(OUT, 'fly-%s.webm' % t)
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            if F['W'] <= 720: shutil.copyfile(src, dst)   # drawn at the menu's size already
            else:   # smaller for a phone: 660 px wide (the names still use the frame's own size)
                subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vf', 'scale=660:-2', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42',
                                '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', dst], check=True)
        Image.open(os.path.join(RAW, 'fly-%s-poster.jpg' % t)).convert('RGB').save(os.path.join(OUT, 'fly-%s.webp' % t), 'WEBP', quality=72, method=6)
        pd = []
        for nm in F['places']:
            q = next((x for x in R['places'] if x[0] == nm or nm in x[0]), None)
            pd.append(q[1] if q else L / 3 if nm == 'Split 1' else 2 * L / 3 if nm == 'Split 2' else -1e9)
        keep = lambda P, on: P if on and P and P[2] else 0
        fr = [[f[0], keep(f[1], f[0] < L * 0.14), keep(f[2], f[0] > L * 0.78), 0, [keep(P, abs(f[0] - pd[i]) < L * 0.09) for i, P in enumerate(f[4])]] for f in F['frames']]
        R['fly'] = { 'fps': F['fps'], 'W': F['W'], 'H': F['H'], 'places': F['places'], 'frames': fr }
    data[t] = R
    print(t, 'len', L, 'places', len(R['places']), 'hud', len(H), 'fly', 'fly' in R)

with open(os.path.join(SITE, 'routes.js'), 'w') as f:
    f.write('/* The tracks: routes over the maps, heights, places and flyover frames (made by routes.py, do not edit). */\n')
    f.write('window.ROUTES = ' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('routes.js', os.path.getsize(os.path.join(SITE, 'routes.js')) // 1024, 'KB')
