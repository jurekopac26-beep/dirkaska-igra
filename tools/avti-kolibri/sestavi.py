#!/usr/bin/env python3
"""The pairs before / after of tools/avti-kolibri/slike.mjs side by side: left ZDAJ (a copy of main), right POTEM (the working tree),
each sheet a JPEG of at most ~300 KB (CLAUDE.md: slike do ~300 KB).

  python3 tools/avti-kolibri/sestavi.py <prej-dir> <potem-dir> <out-dir> [car ...]

Per car (default: tiger medved superkombi): <id>-visoki.jpg (the showroom, the computer's Visoki: front and rear), <id>-visoki-detajli.jpg
(the nose and the tail close up), <id>-notranjost.jpg
(the cabin through the driver's door, the bay under the bonnet), <id>-trk-telefon.jpg (Spa, the chase camera on an upright phone after
the knocks: through a long lens and as the phone shows it), <id>-trk-racunalnik.jpg (the same knocks, Visoki, the photo mode's
camera: Razbijanje · nov način on, and the game's default settings with grazes along a flank); telefon-cel.jpg (the whole cars on the
phone), kolibri-vzor.jpg and kolibri-vzor-trk.jpg (the KOLIBRI's same views, the level aimed at)."""
import io
import os
import sys
from PIL import Image, ImageDraw, ImageFont

PREJ, POTEM, OUT = sys.argv[1:4]
CARS = sys.argv[4:] or ['tiger', 'medved', 'superkombi']
NAME = {'tiger': 'TIGER GT', 'medved': 'MEDVED 4x4', 'superkombi': 'SUPERKOMBI', 'kolibri': 'KOLIBRI'}
LIMIT = 300 * 1024
BG, INK, DIM = (16, 21, 29), (240, 242, 246), (150, 158, 170)
FONT = next((f for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf') if os.path.exists(f)), None)


def font(px):
    return ImageFont.truetype(FONT, px) if FONT else ImageFont.load_default()


def load(d, name, w):
    im = Image.open(os.path.join(d, name + '.png')).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def tag(im, text, px=17):
    """a small label in the panel's top left corner"""
    d = ImageDraw.Draw(im, 'RGBA'); f = font(px); w = d.textlength(text, font=f)
    d.rectangle([0, 0, w + 16, px + 12], fill=(10, 13, 18, 190)); d.text((8, 5), text, font=f, fill=INK)
    return im


def sheet(rows, heads, title, gap=6):
    """rows: lists of panels (one per column, the same size across a column); heads: the columns' headings"""
    cw = [max(r[c].width for r in rows) for c in range(len(heads))]
    W = sum(cw) + gap * (len(cw) - 1); top, bar = 34, 30
    H = top + bar + sum(max(p.height for p in r) for r in rows) + gap * (len(rows) - 1)
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((8, 7), title, font=font(19), fill=INK)
    x = 0
    for c, h in enumerate(heads):
        d.rectangle([x, top, x + cw[c] - 1, top + bar - 1], fill=(34, 42, 54) if c == 0 else (30, 74, 46))
        f = font(19); d.text((x + (cw[c] - d.textlength(h, font=f)) / 2, top + 4), h, font=f, fill=INK)
        x += cw[c] + gap
    y = top + bar
    for r in rows:
        x = 0
        for c, p in enumerate(r):
            im.paste(p, (x, y)); x += cw[c] + gap
        y += max(p.height for p in r) + gap
    return im


def save(im, name):
    os.makedirs(OUT, exist_ok=True); path = os.path.join(OUT, name + '.jpg')
    for q in (88, 84, 80, 76, 72, 68, 64, 60, 56, 52):
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True, progressive=True)
        if b.tell() <= LIMIT:
            break
    open(path, 'wb').write(b.getvalue())
    print('%s  %d x %d  %d KB  q%d' % (name + '.jpg', im.width, im.height, round(b.tell() / 1024), q))


def pair(name, w, label):
    return [tag(load(PREJ, name, w), label), tag(load(POTEM, name, w), label)]


HEADS = ['ZDAJ (main)', 'POTEM (pilot)']


def make(name, title, rows, heads=HEADS):
    """one sheet; rows: a function (a picture not made yet: the sheet left out)"""
    try:
        save(sheet(rows(), heads, title), name)
    except FileNotFoundError as e:
        print('%s.jpg  left out (no %s)' % (name, os.path.basename(e.filename)))


for car in CARS:
    N = NAME[car]
    make(car + '-visoki', N + ' · računalnik, Detajli avtov: Visoki', lambda: [pair(car + '-visoki-spredaj', 800, 'spredaj'), pair(car + '-visoki-zadaj', 800, 'zadaj')])
    make(car + '-visoki-detajli', N + ' · računalnik, Visoki: podrobnosti od blizu', lambda: [pair(car + '-visoki-nos', 800, 'nos od blizu'), pair(car + '-visoki-rep', 800, 'rep od blizu')])
    make(car + '-notranjost', N + ' · notranjost (vidna, ko avto ni več cel)', lambda: [pair(car + '-kabina', 800, 'kabina (vrata odstranjena)'), pair(car + '-motor', 800, 'pod pokrovom (pokrov in odbijač odstranjena)')])
    make(car + '-trk-telefon', N + ' · po trku · Spa, kamera za avtom, telefon pokonci (Normalni), Razbijanje · nov način',
         lambda: [pair(car + '-trk-telefon-blizu', 640, 'povečano (isti pogled, dolg objektiv)'), pair(car + '-trk-telefon', 640, 'kot na telefonu (spodnji del zaslona)')])
    make(car + '-trk-racunalnik', N + ' · po trku · Spa, računalnik (Visoki), foto način',
         lambda: [pair(car + '-trk-racunalnik', 800, 'Razbijanje · nov način vklopljen'), pair(car + '-trk-privzeto', 800, 'privzete nastavitve (isti trki in oplazenja ob levem boku)')])
if len(CARS) > 1:
    make('telefon-cel', 'Nepoškodovan avto · Spa, kamera za avtom, telefon pokonci (Normalni)',
         lambda: [pair(c + '-cel-telefon-blizu', 640, NAME[c] + ' · povečano') for c in CARS] + [pair(CARS[0] + '-cel-telefon', 640, NAME[CARS[0]] + ' · kot na telefonu')])
    kv = (('visoki-spredaj', 'spredaj'), ('visoki-zadaj', 'zadaj'), ('visoki-nos', 'nos od blizu'), ('visoki-rep', 'rep od blizu'), ('kabina', 'kabina (vrata odstranjena)'), ('motor', 'pod pokrovom'))
    make('kolibri-vzor', 'KOLIBRI · vzor (računalnik, Visoki; enak na main in v pilotu)', lambda: [[tag(load(POTEM, 'kolibri-' + v, 800), t) for v, t in kv[r:r + 2]] for r in (0, 2, 4)], ['KOLIBRI', 'KOLIBRI'])
    make('kolibri-vzor-trk', 'KOLIBRI · vzor po trku · Spa, računalnik (Visoki), foto način (enak na main in v pilotu)',
         lambda: [[tag(load(POTEM, 'kolibri-trk-racunalnik', 800), 'isti trki kot pri treh avtih'), tag(load(POTEM, 'kolibri-trk-privzeto', 800), 'isti trki in oplazenja ob levem boku')]],
         ['Razbijanje · nov način vklopljen', 'privzete nastavitve'])
