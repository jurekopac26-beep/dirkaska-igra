# Listi za gasilski avto: 50-0 pregled 6 verzij, 50-1..50-6 vsaka verzija iz 4 pogledov.
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, 'listi'); os.makedirs(OUT, exist_ok=True)
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
BG, FG, MUT, ACC = (18, 22, 28), (243, 239, 230), (185, 194, 204), (242, 163, 58)
KS = [k for k in range(6) if os.path.exists(os.path.join(D, 'r', 'v%d.json' % k))]

def info(k): return json.load(open(os.path.join(D, 'r', 'v%d.json' % k)))
def img(k, v): return Image.open(os.path.join(D, 'r', 'v%d_%s.png' % (k, v))).convert('RGB')
def label(d, xy, t, f=None):
    f = f or F(B, 26); x, y = xy; w = d.textlength(t, font=f)
    d.rectangle([x, y, x + w + 20, y + 40], fill=(0, 0, 0)); d.text((x + 10, y + 5), t, font=f, fill=FG)

for k in KS:
    I = info(k); W, H = 1920, 70 + 720 + 540
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c)
    d.text((24, 16), '50-%d  Gasilski avto · %s' % (k + 1, I['name']), font=F(B, 34), fill=FG)
    c.paste(img(k, 'front'), (0, 70)); c.paste(img(k, 'rear'), (960, 70))
    label(d, (12, 82), 'spredaj'); label(d, (972, 82), 'zadaj')
    c.paste(img(k, 'iso'), (0, 790)); label(d, (12, 802), 'izometrična kamera (ležeče)')
    ch = img(k, 'chase').resize((304, 540), Image.LANCZOS); c.paste(ch, (960, 790)); label(d, (968, 802), 'za avtom', F(B, 20))
    x, y = 1300, 820
    rows = [('Dolžina', '%.1f m' % I['L']), ('Višina', '%.1f m' % I['H']), ('Trikotniki', '{:,}'.format(I['tris']).replace(',', '.')),
            ('Oglišča', '{:,}'.format(I['verts']).replace(',', '.')), ('Delov / materialov', '%d / %d' % (I['parts'], I['mats'])),
            ('Datoteka .glb', '%d kB' % (I.get('glb', 0) // 1024))]
    d.text((x, y), 'Model v Blenderju', font=F(B, 30), fill=ACC); y += 56
    for a, b in rows:
        d.text((x, y), a, font=F(R, 26), fill=MUT); d.text((x + 330, y), b, font=F(B, 26), fill=FG); y += 46
    d.text((x, y + 20), 'Generičen, brez znamk in napisov.', font=F(R, 22), fill=MUT)
    c.save(os.path.join(OUT, '50-%d.jpg' % (k + 1)), quality=88)

c = Image.new('RGB', (1920, 70 + 2 * 540), BG); d = ImageDraw.Draw(c)
d.text((24, 16), '50-0  Gasilski avto v Blenderju · 6 verzij', font=F(B, 34), fill=FG)
for i, k in enumerate(KS):
    t = img(k, 'front').resize((640, 480), Image.LANCZOS); x, y = (i % 3) * 640, 70 + (i // 3) * 540
    c.paste(t, (x, y)); I = info(k)
    d.text((x + 14, y + 488), I['name'], font=F(B, 24), fill=FG)
    d.text((x + 14, y + 516), '{:,} trikotnikov'.format(I['tris']).replace(',', '.'), font=F(R, 18), fill=MUT)
c.save(os.path.join(OUT, '50-0.jpg'), quality=88)
print('ok', KS)
