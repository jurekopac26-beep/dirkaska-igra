# list prej/zdaj za uporabnika: python3 -I listi.py <opis.json>
# opis: {"out": "pot.jpg", "head": "naslov", "sub": "podnaslov",
#        "rows": [{"title": "...", "sub": "...", "h": 560, "tiles": [["pot/prej.png", "PREJ"], ["pot/zdaj.png", "ZDAJ"]]}]}
import json, sys
from PIL import Image, ImageDraw, ImageFont
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
BG, FG, DIM, ACC = (24, 26, 32), (235, 235, 240), (160, 165, 175), (255, 210, 80)
TW = 1880
def label(im, txt):
    im = im.copy(); d = ImageDraw.Draw(im); w = d.textlength(txt, font=F(B, 22)); d.rectangle([0, 0, w + 20, 34], fill=(0, 0, 0)); d.text((10, 5), txt, font=F(B, 22), fill=ACC); return im
def fit(im, w, h): im = im.convert('RGB'); r = min(w / im.width, h / im.height); return im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
def section(r):
    tiles = [(Image.open(p), lab) for p, lab in r['tiles']]; th = r.get('h', 560)
    n = len(tiles); gap = 10; tw = (TW - 40 - gap * (n - 1)) // n
    row = Image.new('RGB', (TW, 110 + th + 20), BG); d = ImageDraw.Draw(row)
    d.text((20, 16), r['title'], font=F(B, 34), fill=FG); d.text((20, 62), r.get('sub', ''), font=F(R, 24), fill=DIM)
    x = 20
    for im, lab in tiles:
        t = label(fit(im, tw, th), lab); row.paste(t, (x + (tw - t.width) // 2, 110)); x += tw + gap
    return row
o = json.load(open(sys.argv[1], encoding='utf-8')); rows = [section(r) for r in o['rows']]
out = Image.new('RGB', (TW, sum(r.height for r in rows) + 150), BG); d = ImageDraw.Draw(out)
d.text((20, 20), o['head'], font=F(B, 38), fill=FG); d.text((20, 78), o.get('sub', ''), font=F(R, 26), fill=DIM)
y = 130
for r in rows: out.paste(r, (0, y)); y += r.height
out.save(o['out'], quality=86); print(o['out'], out.size)
