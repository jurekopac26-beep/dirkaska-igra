"""README razdelek za 30-avtov/: razlika v pikah ZDAJ | POTEM (siva, prag 24) po pogledih. Uporaba: python3 30-avtov/readme.py <prej> <potem> <izhod.md> [uvod.md]"""
import sys
from PIL import Image, ImageChops
sys.path.insert(0, sys.path[0]); from sestavi import IMENA

def raz(a, b):
    x = Image.open(a).convert('L'); y = Image.open(b).convert('L')
    d = ImageChops.difference(x, y).point(lambda v: 255 if v > 24 else 0)
    return 100 * d.histogram()[255] / (x.size[0] * x.size[1])

def f(v, n=2): return f'{v:.{n}f}'.replace('.', ',')

prej, potem, out = sys.argv[1:4]
vrst = []
for i, (cid, ime) in enumerate(IMENA, 1):
    r = {v: raz(f'{prej}/{cid}-{v}.png', f'{potem}/{cid}-{v}.png') for v in ('34f', '34r', 'trk', 'za')}
    vrst.append(f"| [`30-avtov/{i:02d}-{cid}.jpg`](30-avtov/{i:02d}-{cid}.jpg) | {ime} (`{cid}`) | {f(r['34f'])} / {f(r['34r'])} | {f(r['trk'], 1)} | {f(r['za'], 1)} |")
    print(cid, {k: round(v, 2) for k, v in r.items()})
uvod = open(sys.argv[4]).read() if len(sys.argv) > 4 else ''
open(out, 'w').write(uvod + '\n| Slika | Avto | Garaža spredaj / zadaj | Po trku | Kamera za avtom |\n|---|---|---|---|---|\n' + '\n'.join(vrst) + '\n')
