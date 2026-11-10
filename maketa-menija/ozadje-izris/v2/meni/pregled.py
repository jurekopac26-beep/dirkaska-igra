# Posnetke menija (png iz posnetki.mjs) shrani kot webp v to mapo in sestavi pregleda: »kot je« (slike v2 čez cel zaslon)
# in »pregled« (današnji meni in tri ozadja, postavljena za meni).
# Zagon: python pregled.py <mapa s png>   (Pillow)
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = sys.argv[1]
V = ['1-alpe', '2-hribi', '3-vecer']
for n in ['meni-zdaj'] + ['meni-' + v for v in V]:
    for view in ('pokonci', 'lezece'):
        Image.open(os.path.join(SRC, f'{n}-{view}.png')).convert('RGB').save(os.path.join(HERE, f'{n}-{view}.webp'), quality=80, method=6)
# kot-je: the three as they are, side by side (pokonci) or one under another (lezece); pregled: today's menu and the three placed for it
# (pokonci in a row, lezece two by two); at half size
for name, files, view, cols in [('kot-je', ['kot-je-' + v for v in V], 'pokonci', 3), ('kot-je', ['kot-je-' + v for v in V], 'lezece', 1),
                                ('pregled', ['meni-zdaj'] + ['meni-' + v for v in V], 'pokonci', 4), ('pregled', ['meni-zdaj'] + ['meni-' + v for v in V], 'lezece', 2)]:
    ims = [Image.open(os.path.join(SRC, f'{f}-{view}.png')).convert('RGB') for f in files]
    w, h = ims[0].size; w, h = w // 2, h // 2; g = 12; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w + (cols - 1) * g, rows * h + (rows - 1) * g), (16, 18, 24))
    for i, im in enumerate(ims): sheet.paste(im.resize((w, h), Image.LANCZOS), ((i % cols) * (w + g), (i // cols) * (h + g)))
    sheet.save(os.path.join(HERE, f'{name}-{view}.webp'), quality=78, method=6)
for f in sorted(os.listdir(HERE)):
    if f.endswith('.webp'): print(f, os.path.getsize(os.path.join(HERE, f)))
