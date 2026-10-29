# Sestavi slike za predstavitev: zaporedji 29 (met darila) in 35 (iskanje) ter liste s telefoni (kamera igralca, Blizu).
# gas/m5/hud/m29N.jpg, m35N.jpg -> gas/m5/izdelki/kako29.jpg, kako35.jpg; gas/k/kNN.png -> gas/m5/izdelki/kameraN.jpg
import os, sys
from PIL import Image, ImageDraw, ImageFont
G = os.path.dirname(os.path.abspath(__file__))
HUD = os.path.join(G, 'm5', 'hud'); K = os.path.join(G, 'k'); OUT = os.path.join(G, 'm5', 'izdelki'); os.makedirs(OUT, exist_ok=True)
SUF = sys.argv[1] if len(sys.argv) > 1 else ''
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
BG = (18, 22, 28); FG = (243, 239, 230); MUT = (185, 194, 204); ACC = (242, 163, 58)

def seq(first, name, caps):
    W, H, g = 1280, 720, 8; tw, th = (W - g) // 2, (H - g) // 2
    sh = Image.new('RGB', (W, H), BG)
    for i, cap in enumerate(caps):
        p = os.path.join(HUD, 'm%d%s.jpg' % (first + i + 1, SUF))
        if not os.path.exists(p): continue
        t = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
        ov = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        d.rectangle((0, th - 50, tw, th), fill=(12, 15, 20, 225))
        d.ellipse((10, th - 45, 50, th - 5), fill=ACC); d.text((30, th - 25), str(i + 1), font=F(B, 24), fill=BG, anchor='mm')
        d.text((62, th - 25), cap, font=F(B, 21), fill=FG, anchor='lm')
        t = Image.alpha_composite(t.convert('RGBA'), ov).convert('RGB')
        sh.paste(t, ((i % 2) * (tw + g), (i // 2) * (th + g)))
    sh.save(os.path.join(OUT, name + SUF + '.jpg'), quality=92)

seq(290, 'kako29', ['Približaj se hiši z lučkami', 'Drži VRZI: pika pokaže, kam pade', 'Spusti: darilo leti po loku', 'Zadetek: +1 darilo, +100 točk'])
seq(350, 'kako35', ['Alarm: reševalec kaže smer', 'Štirikolesnik do vode, presedi', 'Skuter: plavalec se pokaže na valu', 'Na sani in nazaj na obalo'])

MIS = {1: ('Požar na vrhu', 'gasilsko vozilo'), 2: ('Zlata ura', 'reševalno vozilo'), 4: ('Vlečna služba', 'vlečno vozilo z avtom'),
       6: ('Srce v hladilni torbi', 'športni avto za policijo'), 7: ('Cisterna', 'cisterna'), 8: ('Izgubljeni v gozdu', 'poltovornjak z žarometom'),
       9: ('Krilo vetrnice', 'tovornjak s krilom'), 10: ('Pobegla čreda', 'poltovornjak'), 11: ('Ognjena reka', 'terensko vozilo'),
       13: ('Lovec na tornado', 'lovec na nevihte'), 17: ('Ledeni most', 'tovornjak na ledu'), 19: ('Pred plimo', 'terenec z zdravnikom'),
       23: ('Lovec na meteorite', 'terensko vozilo'), 26: ('Zadnji odstotek', 'električni avto'), 29: ('Božična noč', 'poltovornjak z darili'),
       30: ('Ratrak', 'ratrak'), 33: ('Odvoz snega', 'kiper'), 34: ('Mestni avtobus', 'mestni avtobus'), 35: ('Reševalci na plaži', 'štirikolesnik'),
       37: ('Poplava', 'dvoživka'), 39: ('Konji v prikolici', 'terenec s prikolico'), 40: ('Varnostni avto', 'varnostni avto'),
       43: ('Vroče zavore', 'tovornjak'), 45: ('Turistični vlakec', 'turistični vlakec'), 46: ('Požar v predoru', 'gasilsko vozilo'),
       47: ('Gozdni požar', 'gasilska cisterna 4×4'), 48: ('Narasla reka', 'visok reševalni tovornjak'), 49: ('Zataknjeno kolo', 'avtolestev'),
       50: ('Panji na pašo', 'tovornjak s panji'), 51: ('Dinozaver na tovornjaku', 'tovornjak z dinozavrom'), 52: ('Hiša na tovornjaku', 'tovornjak s hišo'),
       53: ('Snežne verige', 'avtobus z verigami'), 54: ('Dirka tovornjakov', 'dirkalni tovornjak'), 55: ('Medvedi na cesti', 'terenec nadzornika')}
ORDER = [1, 2, 4, 6, 7, 8, 9, 10, 11, 13, 17, 19, 23, 26, 29, 30, 33, 34, 35, 37, 39, 40, 43, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55]

def wrap(d, t, f, w):
    words, lines, cur = t.split(), [], ''
    for wd in words:
        c = (cur + ' ' + wd).strip()
        if d.textlength(c, font=f) <= w: cur = c
        else: lines.append(cur); cur = wd
    lines.append(cur); return lines

def phone_sheet(ks, name):
    W = 1664; pw, ph, bz = 226, 490, 7; fw = pw + 2 * bz; gap = (W - 6 * fw) // 5
    Hh = ph + 2 * bz + 96
    sh = Image.new('RGB', (W, Hh), BG); d = ImageDraw.Draw(sh)
    x0 = (W - (len(ks) * fw + (len(ks) - 1) * gap)) // 2
    for i, k in enumerate(ks):
        x = x0 + i * (fw + gap)
        d.rounded_rectangle((x, 0, x + fw, ph + 2 * bz), 30, fill=(6, 7, 9), outline=(70, 76, 86), width=2)
        p = os.path.join(K, 'k%02d%s.png' % (k, SUF))
        if os.path.exists(p):
            im = Image.open(p).convert('RGB').resize((pw, ph), Image.LANCZOS)
            m = Image.new('L', (pw, ph), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw, ph), 24, fill=255)
            sh.paste(im, (x + bz, bz), m)
        d.rounded_rectangle((x + fw / 2 - 30, bz + 8, x + fw / 2 + 30, bz + 18), 5, fill=(6, 7, 9))
        t, v = MIS[k]; y = ph + 2 * bz + 12
        d.text((x, y), '%02d' % k, font=F(B, 22), fill=ACC)
        tl = wrap(d, t, F(B, 19), fw - 44)
        for j, ln in enumerate(tl[:2]): d.text((x + 40, y + 2 + j * 24), ln, font=F(B, 19), fill=FG)
        d.text((x, y + 6 + 24 * max(1, min(2, len(tl)))), v, font=F(R, 17), fill=MUT)
    sh.save(os.path.join(OUT, name + SUF + '.jpg'), quality=92)

for n in range(6): phone_sheet(ORDER[n * 6:n * 6 + 6], 'kamera%d' % (n + 1))
print('sestavljeno')
