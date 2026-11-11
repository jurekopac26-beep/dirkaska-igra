# Sestavi sliko primerjave videza ljudi (zdaj / potem; pravilo »primerjava v slikah«, CLAUDE.md) za stran Odločitve: glavni posnetek s kamere za avtom z rumeno lupo (povečava iz iste
# kamere) za prej in za potem, pod njima lupe drugih mest drug ob drugem (prej | potem), spodaj številke. WebP do ~300 KB.
#   python3 tools/ljudje/videz/sestavi.py <ime> <proga> <naslov> <podnaslov> <glavni posnetek> [vrstica posnetek ...] [--film] [--izrez K]
#   posnetek: ime iz stats.json (npr. bathurst-zar-45); --film: vrstice so tri zaporedne lupe (gibanje), samo za potem
#   --izrez K: kamera za avtom samo enkrat (potem, rumen okvir), pod njo pari lup prej | potem, izrezani K-krat ožje okoli ljudi (tudi glavni);
#   vrstica posnetek@K ima svoj izrez, film:posnetek je vrstica treh zaporednih lup
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
BASE = os.path.join(REPO, 'test-results', 'ljudje', 'videz')
argv = sys.argv[1:]; IZ = None
if '--izrez' in argv: i = argv.index('--izrez'); IZ = float(argv[i + 1]); del argv[i:i + 2]
args = [a for a in argv if not a.startswith('--')]
FILM = '--film' in argv
ime, proga, naslov, podnaslov, glavni, vrstice = args[0], args[1], args[2], args[3], args[4], args[5:]
W = 1080
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font = lambda s, b=False: ImageFont.truetype(FB if b else F, s)
YEL = (255, 210, 58)

def stats(v):
    p = os.path.join(BASE, v, 'stats.json')
    return json.load(open(p)).get(proga, {}) if os.path.exists(p) else {}

SP, SV = stats('prej'), stats(ime)
shot = lambda S, f: next((s for s in S.get('shots', []) if s['f'] == f), None)
img = lambda v, f, suf='': Image.open(os.path.join(BASE, v, f + suf + '.png')).convert('RGB')

def chip(d, xy, text, size=26, fill=(10, 14, 20, 210), col=(255, 255, 255)):
    f = font(size, True); x, y = xy; tw = d.textlength(text, font=f)
    d.rounded_rectangle([x, y, x + tw + 24, y + size + 16], 10, fill=fill); d.text((x + 12, y + 6), text, font=f, fill=col)

def panel(v, f, label):
    S = SP if v == 'prej' else SV; s = shot(S, f)
    main = img(v, f).resize((W, round(W * 591 / 1280)), Image.LANCZOS); H = main.size[1]
    ov = Image.new('RGBA', main.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    k = math.tan(math.radians(s['fov'] / 2)) / math.tan(math.radians(s['fovMain'] / 2))
    rw, rh = W * k, H * k; fx, fy = s['at'][0] * W, s['at'][1] * H
    cx, cy = max(rw / 2, min(W - rw / 2, fx)), max(rh / 2, min(H - rh / 2, fy))
    iw = 600; ih = round(iw * 415 / 900)
    corners = [(14, 14), (W - iw - 14, 14), (14, H - ih - 14), (W - iw - 14, H - ih - 14)]
    ix, iy = max(corners, key=lambda c: math.hypot(c[0] + iw / 2 - fx, c[1] + ih / 2 - fy))
    d.rounded_rectangle([cx - rw / 2, cy - rh / 2, cx + rw / 2, cy + rh / 2], 6, outline=YEL, width=4)
    ex, ey = ix + (iw if ix < cx else 0), iy + (ih if iy < cy else 0); sx, sy = cx + (-rw / 2 if ix < cx else rw / 2), cy + (-rh / 2 if iy < cy else rh / 2)
    n = 18
    for i in range(n):
        if i % 2: continue
        a, b = i / n, (i + 1) / n; d.line([sx + (ex - sx) * a, sy + (ey - sy) * a, sx + (ex - sx) * b, sy + (ey - sy) * b], fill=YEL, width=3)
    z = img(v, f, '_zoom').resize((iw, ih), Image.LANCZOS)
    out = main.convert('RGBA'); out.alpha_composite(ov)
    out.paste(z, (ix, iy)); d = ImageDraw.Draw(out)
    d.rounded_rectangle([ix - 3, iy - 3, ix + iw + 3, iy + ih + 3], 10, outline=YEL, width=5)
    chip(d, (ix + 10, iy + 8), 'lupa', 19, fill=YEL + (255,), col=(17, 17, 17))
    lx = 14 if ix > W / 2 else W - 14 - d.textlength(label, font=font(28, True)) - 24
    chip(d, (lx, H - 60 if iy < H / 2 else 14), label, 28)
    return out.convert('RGB')

def crop(im, k):   # the middle of a loupe, k times narrower (a bit above the middle: the people stand up from their feet)
    if not k or k <= 1: return im
    w, h = im.size; cw, ch = w / k, h / k; x0, y0 = (w - cw) / 2, (h - ch) * 0.4
    return im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch)))

def context(f, k, label):   # (--izrez) the chase camera once (potem), the yellow frame = the part of it in the loupes below
    s = shot(SV, f)
    main = img(ime, f).resize((W, round(W * 591 / 1280)), Image.LANCZOS); H = main.size[1]
    kk = math.tan(math.radians(s['fov'] / 2)) / math.tan(math.radians(s['fovMain'] / 2))
    rw, rh = W * kk, H * kk; fx, fy = s['at'][0] * W, s['at'][1] * H
    cx, cy = max(rw / 2, min(W - rw / 2, fx)), max(rh / 2, min(H - rh / 2, fy))
    cw, ch = rw / (k or 1), rh / (k or 1); x0, y0 = cx - rw / 2 + (rw - cw) / 2, cy - rh / 2 + (rh - ch) * 0.4
    out = main.convert('RGBA'); d = ImageDraw.Draw(out)
    d.rounded_rectangle([x0 - 3, y0 - 3, x0 + cw + 3, y0 + ch + 3], 6, outline=YEL, width=4)
    chip(d, (14, H - 60 if cy < H / 2 else 14), label, 28)
    return out.convert('RGB')

def pair(f, label, kz=None):   # the loupes of one place: prej | potem
    w = (W - 6) // 2; h = round(w * 415 / 900)
    row = Image.new('RGB', (W, h + 44), (14, 19, 25)); d = ImageDraw.Draw(row)
    d.text((14, 8), label, font=font(24, True), fill=(238, 242, 246))
    for k, v in enumerate(['prej', ime]):
        z = crop(img(v, f, '_zoom'), kz).resize((w, h), Image.LANCZOS); x = k * (w + 6); row.paste(z, (x, 44)); dd = ImageDraw.Draw(row)
        chip(dd, (x + 10, 54), 'ZDAJ' if v == 'prej' else 'POTEM', 22, fill=((40, 46, 56, 255) if v == 'prej' else YEL + (255,)), col=((255, 255, 255) if v == 'prej' else (17, 17, 17)))
    return row

def film(f, label, kz=None):   # three loupes one after another (the motion), potem only
    w = (W - 12) // 3; h = round(w * 415 / 900)
    row = Image.new('RGB', (W, h + 44), (14, 19, 25)); d = ImageDraw.Draw(row)
    d.text((14, 8), label, font=font(24, True), fill=(238, 242, 246))
    for k, suf in enumerate(['_zoom', '_film1', '_film2']):
        z = crop(img(ime, f, suf), kz).resize((w, h), Image.LANCZOS); row.paste(z, (k * (w + 6), 44))
    return row

def what(f):
    s = shot(SV, f) or shot(SP, f)
    if not s: return f
    if s['kind'] == 'gneca': return 'Gledalci ob ograji, %d m pred njimi' % s['da']
    names = {'zar': 'Žar pred avtodomom', 'marsali': 'Maršali', 'boksi': 'Mehaniki pri zidu boksov', 'gasilci': 'Gasilci in reševalci', 'foto': 'Fotografi in TV kamera',
             'piknik': 'Piknik', 'hisa2': 'Družina pri hiši', 'kolesarji': 'Kolesarji', 'foto2': 'Fotografi na bregu', 'tribuna': 'Tribuna', 'vhod': 'Vhod', 'oder': 'Oder',
             'golaz': 'Golaž v kotlu', 'nogomet': 'Nogomet na travi', 'badminton': 'Badminton in frizbi', 'ribici': 'Ribiči', 'cebelarji': 'Čebelarji', 'delavci': 'Delavci na progi'}
    return '%s, %d m pred prizorom' % (names.get(s['name'], s['name']), s['da'])

parts = []
head = Image.new('RGB', (W, 118), (23, 58, 94)); d = ImageDraw.Draw(head)
d.text((24, 16), naslov, font=font(40, True), fill=(255, 255, 255)); d.text((24, 70), podnaslov, font=font(25), fill=(185, 200, 216))
parts.append(head)
def spec(r):   # posnetek[@K] or film:posnetek[@K]
    fm = r.startswith('film:'); r = r[5:] if fm else r; k = IZ
    if '@' in r: r, k = r.split('@'); k = float(k)
    return r, k, fm or FILM
if IZ:
    g, kg, _ = spec(glavni); glavni = g
    parts.append(context(g, kg, 'Kamera za avtom · ' + what(g)))
    parts.append(pair(g, 'Povečava: ' + what(g), kg))
    for r in vrstice:
        f, k, fm = spec(r); parts.append(film(f, 'Potem, gibanje (tri lupe v ~0,5 s): ' + what(f), k) if fm else pair(f, what(f), k))
else:
    parts.append(panel('prej', glavni, 'ZDAJ · ' + what(glavni)))
    parts.append(Image.new('RGB', (W, 6), (14, 19, 25)))
    parts.append(panel(ime, glavni, 'POTEM · ' + what(glavni)))
    for f in vrstice: parts.append(film(f, 'Potem, gibanje (tri lupe v ~0,3 s): ' + what(f)) if FILM else pair(f, what(f)))
# the numbers
pp, pv = SP.get('perPerson', {}), SV.get('perPerson', {})
def avg(P, k): return P.get(k, {}).get('avg')
lines = []
o1, o2 = avg(pp, 'oseba'), avg(pv, 'oseba'); t1, t2 = avg(pp, 'tribuna'), avg(pv, 'tribuna')
c1, c2 = SP.get('crowd', {}).get('vertsPerFigure'), SV.get('crowd', {}).get('vertsPerFigure')
txt = 'Oglišča na osebo v prizoru: %s → %s' % (o1, o2)
if t1: txt += ' · na tribuni: %s → %s' % (t1, t2)
lines.append(txt)
if c1: lines.append('Gledalec ali redar ob progi (instanciran): %s → %s oglišč' % (c1, c2))
g1, g2 = (shot(SP, glavni) or {}).get('gl'), (shot(SV, glavni) or {}).get('gl')
if g1 and g2: lines.append('Ta sličica (vse podaje): %d → %d klicev risanja, %dk → %dk oglišč' % (g1['calls'], g2['calls'], round(g1['verts'] / 1000), round(g2['verts'] / 1000)))
foot = Image.new('RGB', (W, 26 + 36 * len(lines)), (14, 19, 25)); d = ImageDraw.Draw(foot)
for i, t in enumerate(lines): d.text((24, 14 + i * 36), t, font=font(24), fill=(200, 212, 226))
parts.append(foot)
H = sum(p.size[1] for p in parts); out = Image.new('RGB', (W, H), (14, 19, 25)); y = 0
for p in parts: out.paste(p, (0, y)); y += p.size[1]
dst = os.path.join(BASE, 'slike'); os.makedirs(dst, exist_ok=True)
fn = os.path.join(dst, '%s-%s.webp' % (ime, proga))
q = 82
while True:
    out.save(fn, 'WEBP', quality=q, method=6)
    if os.path.getsize(fn) < 300_000 or q <= 50: break
    q -= 6
print(fn, out.size, os.path.getsize(fn) // 1024, 'KB, q', q)
