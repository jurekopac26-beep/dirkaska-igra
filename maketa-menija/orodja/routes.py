# Mockup only: raw/maps (routemap.mjs, flyover.mjs) -> site/assets/maps/*.webp|webm|jpg and site/routes.js (window.ROUTES): for each
# open road and rally stage the route over the top map and over the 3D block, the height profile, the places, the pace notes (the
# corners along a rally stage) and, frame by frame, where the flyover video shows the start, the finish, the point and the places.
import json, math, os, shutil, subprocess, sys
from PIL import Image, ImageEnhance

RAW, SITE = 'raw/maps', sys.argv[1] if len(sys.argv) > 1 else '..'
try:
    import imageio_ffmpeg; FF0 = imageio_ffmpeg.get_ffmpeg_exe()   # pip install imageio-ffmpeg (has VP9)
except ImportError: FF0 = 'ffmpeg'
FF = os.environ.get('FFMPEG', FF0)
OUT = os.path.join(SITE, 'assets', 'maps')
os.makedirs(OUT, exist_ok=True)
TRACKS = ['vrsic', 'pikes', 'ouninpohja', 'gora']

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

def pace(route, d, mpp):   # corners of a rally stage from the route on the top map: [metres, side (-1 left, 1 right), grade 1 (hairpin) .. 6 (flat kink)]
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
    # the map from above (version 2): the land fills it (no transparency)
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
    R['places'] = [[q['n'], round(q['d'])] for q in J['names'] if q.get('hud', True)]
    if t in ('ouninpohja', 'gora'): R['notes'] = pace(J['route'], J['d'], J['mPerPx'])
    # the 3D block (version 3): cut to what is drawn, the route moved with it
    B = json.load(open(os.path.join(RAW, 'block-%s.json' % t)))
    im = Image.open(os.path.join(RAW, 'block-%s.png' % t)).convert('RGBA')
    bb = im.split()[3].point(lambda x: 255 if x > 10 else 0).getbbox(); pad = 14
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))
    sc = min(1.0, 820 / (bb[2] - bb[0]))
    for sfx in ('', '-rain'):
        q = Image.open(os.path.join(RAW, 'block-%s%s.png' % (t, sfx))).convert('RGBA')
        if sfx: q = grade(q)
        q = q.crop(bb)
        if sc < 1: q = q.resize((round(q.width * sc), round(q.height * sc)), Image.LANCZOS)
        q.save(os.path.join(OUT, 'block-%s%s.webp' % (t, sfx)), 'WEBP', quality=80, method=6)
        W2, H2 = q.size
    bp = [(round((x - bb[0]) * sc, 1), round((y - bb[1]) * sc, 1)) for x, y in B['route']]
    R['block'] = { 'W': W2, 'H': H2, 'route': thin(bp, 220), 'vis': thin(B['vis'], 220) }
    # the flyover (version 1): the video, its first frame, and per frame [metres, start, finish, point, places]
    fj = os.path.join(RAW, 'fly-%s.json' % t)
    if os.path.exists(fj):
        F = json.load(open(fj))
        dst = os.path.join(OUT, 'fly-%s.webm' % t)   # smaller for a phone: 660 px wide (the names still use the frame's own size)
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(os.path.join(RAW, 'fly-%s.webm' % t)):
            subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-i', os.path.join(RAW, 'fly-%s.webm' % t), '-vf', 'scale=660:-2', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42',
                            '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', dst], check=True)
        Image.open(os.path.join(RAW, 'fly-%s-poster.jpg' % t)).convert('RGB').save(os.path.join(OUT, 'fly-%s.webp' % t), 'WEBP', quality=70, method=6)
        R['fly'] = { 'fps': F['fps'], 'W': F['W'], 'H': F['H'], 'places': F['places'], 'frames': F['frames'] }
    data[t] = R
    print(t, 'len', L, 'places', len(R['places']), 'notes', len(R.get('notes', [])), 'fly', 'fly' in R, 'block', R['block']['W'], R['block']['H'])

with open(os.path.join(SITE, 'routes.js'), 'w') as f:
    f.write('/* The open roads and rally stages: routes over the maps, heights, places, pace notes and flyover frames (made by routes.py, do not edit). */\n')
    f.write('window.ROUTES = ' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('routes.js', os.path.getsize(os.path.join(SITE, 'routes.js')) // 1024, 'KB')
