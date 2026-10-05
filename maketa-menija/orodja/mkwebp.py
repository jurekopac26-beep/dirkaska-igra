# Mockup only: raw/tracks/w_<id>.png and w_<id>-rain.png (dio2.mjs with "wet" in the job) -> site/assets/tracks/<id>.webp and <id>-rain.webp.
# Both are cut to the same box (the dry model's), so the wet model lies exactly over the dry one; the wet one also gets the game's
# rainy colour grade (render.js: less saturated, a little cooler).
import os, sys
from PIL import Image, ImageEnhance
IDS = ['jezero', 'riviera', 'gora', 'ljubljana', 'monaco', 'rbring', 'suzuka', 'spa', 'pikes', 'ouninpohja', 'nring']
OUT = sys.argv[1] if len(sys.argv) > 1 else '../assets/tracks'
if len(sys.argv) > 2: IDS = sys.argv[2:]   # (python3 mkwebp.py <folder> <track> ...: only those)

def grade(im):
    rgb, a = im.convert('RGB'), im.split()[3]
    rgb = ImageEnhance.Color(rgb).enhance(0.8)
    r, g, b = rgb.split()
    rgb = Image.merge('RGB', (r.point(lambda v: int(v * 0.97)), g, b.point(lambda v: min(255, int(v * 1.03)))))
    out = rgb.convert('RGBA'); out.putalpha(a); return out

tot = 0
for tid in IDS:
    dry = Image.open('raw/tracks/w_%s.png' % tid).convert('RGBA'); wet = Image.open('raw/tracks/w_%s-rain.png' % tid).convert('RGBA')
    bb = dry.split()[3].point(lambda x: 255 if x > 10 else 0).getbbox(); pad = 14
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(dry.width, bb[2] + pad), min(dry.height, bb[3] + pad))
    for im, name in ((dry, tid), (grade(wet), tid + '-rain')):
        im = im.crop(bb)
        if im.width > 820: im = im.resize((820, round(im.height * 820 / im.width)), Image.LANCZOS)
        f = os.path.join(OUT, name + '.webp'); im.save(f, 'WEBP', quality=80, method=6); tot += os.path.getsize(f)
    print(tid, im.size)
print('total', tot // 1024, 'KB')
