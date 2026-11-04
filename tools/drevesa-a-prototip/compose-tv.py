import os, json, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); O = '/home/user/izboljsave/drevesa'; os.makedirs(O, exist_ok=True)
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; Rg = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BG, CT, CN, CP = (20, 22, 26), (235, 238, 242), (170, 235, 150), (255, 220, 140)
F = lambda f, s: ImageFont.truetype(f, s)
perf = json.loads(open(sys.argv[1]).read().splitlines()[0]) if len(sys.argv) > 1 else {}
NAMES = {'A': 'Mehke krogle', 'B': 'Igrače: preproste oblike', 'C': 'Brokoli: grozdi kroglic', 'D': 'Goste listne karte (najbližje Into the Wind)', 'E': 'Ostre pastelne ploskve'}
VERTS = {'A': (219, 282, 270), 'B': (96, 96, 90), 'C': (426, 426, 318), 'D': (462, 414, 588), 'E': (159, 159, 144)}
NOW = (132, 147, 204)
def cost(v):
    s = 'Oglišč na drevo (smreka / macesen / bukev): %d / %d / %d  (zdaj %d / %d / %d)' % (VERTS[v] + NOW)
    p, z = perf.get(v), perf.get('zdaj')
    if p and z: s2 = 'Telefon, cel Vršič: klici risanja največ %d (zdaj %d) · oglišča povp. %dk, največ %dk (zdaj %dk / %dk, meja ~900k)' % (p['maxCalls'], z['maxCalls'], p['avgKverts'], p['maxKverts'], z['avgKverts'], z['maxKverts']) + ('  → ČEZ MEJO' if p['maxKverts'] > 900 else '')
    else: s2 = ''
    return s, s2
for k, v in enumerate('ABCDE'):
    a = Image.open(os.path.join(D, f'dv{v}-smreke.png')).convert('RGB').resize((960, 540)); b = Image.open(os.path.join(D, f'dv{v}-bukve.png')).convert('RGB').resize((960, 540))
    c = Image.open(os.path.join(D, f'dv{v}-zaavtom.png')).convert('RGB'); LH, G = 46, 8; ch = 2 * (540 + LH) + G - LH; cw = round(c.size[0] * ch / c.size[1]); c = c.resize((cw, ch))
    W, H = 960 + G + cw, 70 + 2 * (540 + LH) + G + 96
    o = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(o)
    d.text((18, 14), f'Drevesa {v} · {NAMES[v]}', font=F(B, 36), fill=CT)
    for j, (im, lab) in enumerate([(a, 'Smreke in macesni (izometrična)'), (b, 'Bukve (izometrična)')]):
        y = 70 + j * (540 + LH + G); d.text((14, y + 8), lab, font=F(B, 26), fill=CN); o.paste(im, (0, y + LH))
    d.text((960 + G + 14, 78), 'Za avtom', font=F(B, 26), fill=CN); o.paste(c, (960 + G, 70 + LH))
    s1, s2 = cost(v); d.text((18, H - 86), s1, font=F(Rg, 24), fill=(190, 200, 210)); d.text((18, H - 48), s2, font=F(Rg, 24), fill=(190, 200, 210))
    o.save(os.path.join(O, f'drevesa-{v}.jpg'), quality=88); print('drevesa', v)
# overview: now and the five versions at the same two places
cells = [('e3-prej', 'Zdaj'), ('dvA-smreke', 'A'), ('dvB-smreke', 'B'), ('dvC-smreke', 'C'), ('dvD-smreke', 'D'), ('dvE-smreke', 'E'), ('e3b-prej', 'Zdaj'), ('dvA-bukve', 'A'), ('dvB-bukve', 'B'), ('dvC-bukve', 'C'), ('dvD-bukve', 'D'), ('dvE-bukve', 'E')]
w, h, LH, G = 640, 360, 40, 6; W = 3 * w + 2 * G; H = 64 + 4 * (h + LH) + 3 * G
o = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(o); d.text((18, 12), 'Pregled: zdaj in 5 različic dreves na istih mestih', font=F(B, 34), fill=CT)
for k, (n, lab) in enumerate(cells):
    x, y = (k % 3) * (w + G), 64 + (k // 3) * (h + LH + G); full = lab if lab == 'Zdaj' else f'{lab} · {NAMES[lab].split(" (")[0]}'
    d.text((x + 12, y + 6), full, font=F(B, 24), fill=CP if lab == 'Zdaj' else CN); o.paste(Image.open(os.path.join(D, n + '.png')).convert('RGB').resize((w, h)), (x, y + LH))
o.save(os.path.join(O, 'drevesa-0-pregled.jpg'), quality=86); print('pregled')
