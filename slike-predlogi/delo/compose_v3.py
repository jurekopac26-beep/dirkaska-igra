# the 3 versions of the smaller circuit's edge (everywhere, both sides, not by the lot; the beach a little over it), one sheet each
from PIL import Image, ImageDraw, ImageFont
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'; OUT = SP + 'vse27-robovi/'
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; F = lambda p, s: ImageFont.truetype(p, s)
Y, G = (255, 214, 64), (210, 214, 220)
TXT = {'A': ('Različica 1 · kot originalna Toskana', 'Bela črta ob asfaltu, 2,2 m pas rdeče-oranžne zemlje, zeleno-belo-rdeči robnik (1,5 m) na notranji strani ovinkov in v lasnicah. Okoli cele proge, zunaj in znotraj.'),
       'B': ('Različica 2 · širši rob', 'Pas zemlje 3,4 m, robnik 1,8 m in v več ovinkih (tudi v blažjih), bela črta ob asfaltu na ravninah. Okoli cele proge, zunaj in znotraj.'),
       'C': ('Različica 3 · robnik povsod', 'Zeleno-belo-rdeči robnik (1,5 m) okoli cele proge na obeh straneh, za njim 3 m pas zemlje, brez bele črte.')}
COMMON = 'Ob parkirišču roba ni. Na plaži pesek rahlo prekrije pas in robnik (od zunaj navznoter, valovito).'
def wrap(d, text, font, w):
    out, line = [], ''
    for word in text.split():
        t = (line + ' ' + word).strip()
        if d.textlength(t, font=font) <= w: line = t
        else: out.append(line); line = word
    if line: out.append(line)
    return out
def label(im, t):
    d = ImageDraw.Draw(im); f = F(B, 24); w = d.textlength(t, font=f); d.rectangle([0, 0, w + 20, 36], fill=(24, 26, 30)); d.text((10, 5), t, font=f, fill=Y); return im
def crop(v, n, fr=0.55):
    im = Image.open(SP + 'sh-v4-%s-%s.png' % (v, n)).convert('RGB'); w = im.size[0]; a = int(w * (1 - fr) / 2); return im.crop((a, a, w - a, w - a))
for i, v in enumerate('ABC'):
    can = Image.new('RGB', (1800, 1820), (24, 26, 30)); d = ImageDraw.Draw(can)
    d.text((24, 18), TXT[v][0], font=F(B, 48), fill=Y); yy = 84
    for ln in wrap(d, TXT[v][1] + ' ' + COMMON, F(R, 28), 1750): d.text((24, yy), ln, font=F(R, 28), fill=G); yy += 36
    y0 = 215
    can.paste(label(Image.open(SP + 'sh-v4-%s-all.png' % v).convert('RGB').resize((880, 880)), 'celo manjše dirkališče'), (0, y0))
    can.paste(label(crop(v, 'beach').resize((450, 450)), 'plaža'), (900, y0)); can.paste(label(crop(v, 'ne').resize((450, 450)), 'plaža ob vrhu zanke'), (1350, y0))
    can.paste(label(crop(v, 'nw').resize((450, 420)), 'lasnica'), (900, y0 + 460)); can.paste(label(crop(v, 'sw').resize((450, 420)), 'zahodni ovinek'), (1350, y0 + 460))
    can.paste(label(Image.open(SP + 'sh-v4-%s-iso.png' % v).convert('RGB').resize((1000, 562)), 'izometrična kamera (ob plaži)'), (0, y0 + 900))
    can.paste(label(crop(v, 'se', 0.6).resize((380, 380)), 'ob parkirišču'), (1010, y0 + 900)); can.paste(label(Image.open(SP + 'sh-v4-%s-chase.png' % v).convert('RGB').resize((316, 562)), 'za avtom'), (1430, y0 + 900))
    can = can.crop((0, 0, 1800, y0 + 900 + 562)); can.save(OUT + '37-R%d-%s.jpg' % (i + 1, TXT[v][0].split('· ')[1].replace(' ', '-')), quality=90); print(v, can.size)
