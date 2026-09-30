import sys, os
from PIL import Image
PICK = {'jezero': 'hero_jezero', 'riviera': 'hero_riviera', 'gora': 'hero_gora', 'ljubljana': 'hero_ljubljana', 'monaco': 'hero_monaco', 'rbring': 'hero_rbring',
        'suzuka': 'hero_suzuka', 'spa': 'try_spa_-1.1', 'pikes': 'try_pikes_2.0', 'ouninpohja': 'try_ouninpohja_2.0', 'nring': 'try_nring_0.45'}
for a in sys.argv[1:]:
    k, v = a.split('='); PICK[k] = v
tot = 0
for tid, src in PICK.items():
    im = Image.open('raw/tracks/%s.png' % src).convert('RGBA')
    a = im.split()[3].point(lambda x: 255 if x > 10 else 0)
    bb = a.getbbox(); pad = 14
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))
    im = im.crop(bb)
    if im.width > 820: im = im.resize((820, round(im.height * 820 / im.width)), Image.LANCZOS)
    out = '../assets/tracks/%s.webp' % tid
    im.save(out, 'WEBP', quality=80, method=6)
    tot += os.path.getsize(out); print(tid, src, im.size, os.path.getsize(out) // 1024, 'KB')
print('total', tot // 1024, 'KB')
