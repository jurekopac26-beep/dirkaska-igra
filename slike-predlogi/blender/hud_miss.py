# Prikaz na zaslonu (HUD) čez makete misij: gas/m/mNN.png -> gas/m/hud/mNN.jpg
import json, math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'm'); OUT = os.path.join(D, 'hud'); os.makedirs(OUT, exist_ok=True)
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
W, H = 1280, 720
PAN = (14, 18, 24, 190); FG = (243, 239, 230, 255); MUT = (185, 194, 204, 255); ACC = (242, 163, 58, 255)
RED = (235, 64, 52, 255); GRN = (88, 200, 120, 255); BLU = (80, 160, 255, 255); YEL = (255, 210, 60, 255)

MIS = {
    1: ('Požar na vrhu', 'Vršič, Slovenija', 'Pridi do hiše, preden zgori, in pogasi ogenj', '02:41'),
    2: ('Zlata ura', 'Monte Carlo, Monako', 'Odpelji ponesrečenca v bolnišnico, preden mu odpove srce', '01:58'),
    3: ('Zasuti prelaz', 'Beartooth, ZDA', 'S plugom odkoplji zasute avte, preden zmrznejo', '04:05'),
    4: ('Vlečna služba', 'Pikes Peak, ZDA', 'Pokvarjen avto zvleci v dolino brez nove škode', '05:30'),
    5: ('Vedro iz jezera', 'Los Caracoles, Čile', 'S helikopterjem zajemaj vodo in pogasi gozdni požar', '03:12'),
    6: ('Srce v hladilni torbi', 'Mulholland Highway, ZDA', 'Za policijo dostavi organ v bolnišnico, dokler je hladen', '06:12'),
    7: ('Cisterna', 'Sani Pass, Južna Afrika', 'Pripelji polno cisterno čez prelaz, ne da se prevrne', '07:44'),
    8: ('Izgubljeni v gozdu', 'Ouninpohja, Finska', 'Ponoči z žarometom in termokamero najdi tri pohodnike', '09:20'),
    9: ('Krilo vetrnice', 'Katu-Jaryk, Rusija', 'Pelji 48 m dolgo krilo skozi serpentine brez praske', '11:05'),
    10: ('Pobegla čreda', 'Harju, Finska', 'S poltovornjakom zaženi pobegle krave nazaj v ogrado', '03:20'),
}

def panel(d, box, r=14, fill=PAN): d.rounded_rectangle(box, r, fill=fill)
def text(d, xy, t, f, c=FG, anchor='la'): d.text(xy, t, font=f, fill=c, anchor=anchor)

def bar(d, x, y, w, label, val, frac, col, warn=False):
    text(d, (x, y), label, F(B, 17), MUT); text(d, (x + w, y), val, F(B, 19), RED if warn else FG, 'ra')
    d.rounded_rectangle((x, y + 26, x + w, y + 40), 7, fill=(255, 255, 255, 40))
    d.rounded_rectangle((x, y + 26, x + max(14, int(w * frac)), y + 40), 7, fill=col)

def base(d, k, speed):
    t, track, goal, clock = MIS[k]
    panel(d, (16, 16, 470, 118))
    text(d, (32, 26), 'MISIJA %02d' % k, F(B, 16), ACC); text(d, (130, 26), track, F(R, 16), MUT)
    text(d, (32, 48), t.upper(), F(B, 28))
    text(d, (32, 88), goal, F(R, 15), FG)
    panel(d, (W / 2 - 70, 16, W / 2 + 70, 66), 25); text(d, (W / 2, 41), clock, F(B, 30), FG, 'mm')
    panel(d, (16, H - 96, 196, H - 16), 18); text(d, (40, H - 88), str(speed), F(B, 46)); text(d, (130, H - 52), 'km/h', F(R, 18), MUT)

def hint(d, t):
    w = d.textlength(t, font=F(R, 18))
    panel(d, (W / 2 - w / 2 - 20, H - 66, W / 2 + w / 2 + 20, H - 24), 21, (14, 18, 24, 170)); text(d, (W / 2, H - 45), t, F(R, 18), FG, 'mm')

def gauge(d, cx, cy, r, frac, label, val, red_from=0.75):
    d.arc((cx - r, cy - r, cx + r, cy + r), 180, 360, fill=(255, 255, 255, 70), width=12)
    d.arc((cx - r, cy - r, cx + r, cy + r), 180 + 180 * red_from, 360, fill=RED, width=12)
    a = math.pi * (1 - frac); d.line((cx, cy, cx + (r - 18) * math.cos(a), cy - (r - 18) * math.sin(a)), fill=FG, width=5)
    d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=FG)
    text(d, (cx, cy + 22), val, F(B, 22), FG, 'mm'); text(d, (cx, cy - r - 22), label, F(B, 16), MUT, 'mm')

def ecg(d, x0, y0, w, h, bpm):
    pts = []; beat = w / 3.2
    for i in range(int(w)):
        p = (i % beat) / beat; y = 0
        if 0.30 < p < 0.34: y = -0.15
        elif 0.40 < p < 0.43: y = 0.25
        elif 0.43 < p < 0.47: y = -1.0 * (1 - abs(p - 0.45) / 0.02)
        elif 0.47 < p < 0.50: y = 0.35
        elif 0.62 < p < 0.72: y = -0.22 * math.sin((p - 0.62) / 0.1 * math.pi)
        pts.append((x0 + i, y0 + h / 2 + y * h * 0.45))
    for i in range(0, int(w), 24): d.line((x0 + i, y0, x0 + i, y0 + h), fill=(255, 80, 80, 35))
    d.line(pts, fill=(255, 90, 90, 255), width=3)

def minimap(d, x, y, s, k):
    panel(d, (x, y, x + s, y + s), 16)
    if k == 5:
        d.ellipse((x + 22, y + 18, x + 92, y + 78), fill=(40, 110, 170, 255))
        for fx, fy in ((120, 128), (140, 112), (104, 140), (150, 140), (128, 150)): d.ellipse((x + fx - 7, y + fy - 7, x + fx + 7, y + fy + 7), fill=(255, 110, 30, 255))
        d.polygon([(x + 96, y + 92), (x + 108, y + 98), (x + 96, y + 104)], fill=FG)
    if k == 10:
        d.rectangle((x + 30, y + 40, x + 90, y + 95), outline=(200, 160, 110, 255), width=3)
        random.seed(3)
        for i in range(4): d.ellipse((x + 40 + i * 12 - 4, y + 60 - 4, x + 40 + i * 12 + 4, y + 60 + 4), fill=FG)
        for (cx, cy) in ((120, 70), (140, 100), (150, 54), (112, 120), (160, 130)): d.ellipse((x + cx - 4, y + cy - 4, x + cx + 4, y + cy + 4), fill=YEL)
        d.polygon([(x + 128, y + 104), (x + 140, y + 110), (x + 128, y + 116)], fill=ACC)

def draw(k):
    src = os.path.join(D, 'm%02d.png' % k)
    if not os.path.exists(src): return
    im = Image.open(src).convert('RGBA').resize((W, H), Image.LANCZOS)
    pts = json.load(open(os.path.join(D, 'm%02d.json' % k))) if os.path.exists(os.path.join(D, 'm%02d.json' % k)) else {}
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x = W - 336
    if k == 1:
        base(d, k, 0); panel(d, (x, 16, W - 16, 210))
        bar(d, x + 18, 30, 284, 'HIŠA', '64 %', 0.64, RED); bar(d, x + 18, 88, 284, 'OGENJ', '38 %', 0.38, ACC); bar(d, x + 18, 146, 284, 'VODA', '1.420 l', 0.47, BLU)
        cx, cy = W * 0.42, H * 0.37
        d.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), outline=FG, width=3); d.line((cx - 48, cy, cx - 22, cy), fill=FG, width=3); d.line((cx + 22, cy, cx + 48, cy), fill=FG, width=3)
        d.ellipse((W - 150, H - 150, W - 30, H - 30), fill=(196, 22, 28, 230)); text(d, (W - 90, H - 90), 'GASI', F(B, 26), FG, 'mm')
        hint(d, 'Povleci s prstom, da usmeriš curek na ogenj')
    if k == 2:
        base(d, k, 72); panel(d, (x - 40, 16, W - 16, 200))
        text(d, (x - 22, 28), '♥', F(B, 30), RED); text(d, (x + 16, 32), '138 / min', F(B, 24)); text(d, (W - 32, 36), 'KRITIČNO', F(B, 18), RED, 'ra')
        ecg(d, x - 22, 74, 336, 96, 138)
        panel(d, (x, 212, W - 16, 262), 14); text(d, (x + 18, 237), '+  BOLNIŠNICA   1,4 km', F(B, 20), FG, 'lm')
        hint(d, 'Vozi mirno: vsak sunek in trk dvigne utrip')
    if k == 3:
        base(d, k, 18); panel(d, (x, 16, W - 16, 210))
        text(d, (x + 18, 30), 'ODKOPANI AVTI', F(B, 17), MUT); text(d, (W - 34, 30), '1 / 3', F(B, 22), FG, 'ra')
        bar(d, x + 18, 84, 284, 'TEMPERATURA V AVTU', '6 °C', 0.35, BLU, True); bar(d, x + 18, 142, 284, 'GORIVO PLUGA', '72 %', 0.72, ACC)
        hint(d, 'Spusti plug in potiskaj sneg s ceste')
    if k == 4:
        base(d, k, 23); panel(d, (x, 16, W - 16, 250))
        gauge(d, x + 160, 150, 100, 0.68, 'NAPETOST VRVI', '68 %')
        bar(d, x + 18, 186, 284, 'ŠKODA NA AVTU', '12 %', 0.12, RED)
        hint(d, 'Zaviraj nežno, da se vrv ne strga')
    if k == 5:
        base(d, k, 41); panel(d, (x, 16, W - 16, 150))
        bar(d, x + 18, 30, 284, 'VEDRO', '100 %', 1.0, BLU); text(d, (x + 18, 92), 'ŽARIŠČA', F(B, 17), MUT); text(d, (W - 34, 90), '2 / 5', F(B, 22), FG, 'ra')
        minimap(d, W - 196, 166, 180, 5)
        hint(d, 'Spusti se nad jezero, zajemi vodo in jo odvrzi na ogenj')
    if k == 6:
        base(d, k, 96); panel(d, (x, 16, W - 16, 210))
        bar(d, x + 18, 30, 284, 'ORGAN', '4,2 °C', 0.8, GRN); bar(d, x + 18, 88, 284, 'SPREMSTVO', '38 m', 0.6, BLU)
        text(d, (x + 18, 152), 'BOLNIŠNICA', F(B, 17), MUT); text(d, (W - 34, 150), '9,6 km', F(B, 22), FG, 'ra')
        hint(d, 'Drži se policije: ona ti odpira pot skozi promet')
    if k == 7:
        base(d, k, 28); panel(d, (x, 16, W - 16, 270))
        gauge(d, x + 160, 150, 100, 0.55, 'NAGIB', '18°', 0.72)
        text(d, (x + 18, 196), 'PLJUSKANJE', F(B, 17), MUT)
        wave = [(x + 18 + i, 236 + 12 * math.sin(i / 18) * (0.4 + i / 300)) for i in range(284)]; d.line(wave, fill=BLU, width=4)
        hint(d, 'Počasi skozi ovinke, da gorivo ne zaniha cisterne')
    if k == 8:
        base(d, k, 14); tw, th = 336, 210; tx, ty = W - 16 - tw, 16
        th_im = Image.new('RGB', (tw, th)); td = ImageDraw.Draw(th_im)
        for i in range(th): td.line((0, i, tw, i), fill=(28 + i // 10, 10, 60 + i // 6))
        for (bx, by, rr) in ((70, 160, 40), (260, 60, 30), (300, 180, 50)): td.ellipse((bx - rr, by - rr, bx + rr, by + rr), fill=(60, 30, 100))
        td.ellipse((180, 70, 200, 92), fill=(255, 220, 90)); td.rounded_rectangle((174, 90, 206, 150), 8, fill=(255, 150, 40)); td.rectangle((178, 148, 202, 186), fill=(230, 90, 40))
        th_im = th_im.filter(ImageFilter.GaussianBlur(3)); ov.paste(th_im.convert('RGBA'), (tx, ty))
        d.rectangle((tx, ty, tx + tw, ty + th), outline=FG, width=2); text(d, (tx + 10, ty + 8), 'TERMOKAMERA', F(B, 15), FG)
        d.rectangle((tx + 160, ty + 60, tx + 220, ty + 196), outline=YEL, width=2)
        panel(d, (tx, ty + th + 12, W - 16, ty + th + 120))
        text(d, (tx + 18, ty + th + 26), 'NAJDENI', F(B, 17), MUT); text(d, (W - 34, ty + th + 24), '1 / 3', F(B, 22), FG, 'ra')
        bar(d, tx + 18, ty + th + 58, 300, 'BATERIJA ŽAROMETA', '74 %', 0.74, YEL)
        hint(d, 'Obračaj žaromet; pohodniki svetijo na termokameri')
    if k == 9:
        base(d, k, 9); panel(d, (x, 16, W - 16, 230))
        text(d, (x + 18, 30), 'PROSTOR DO SKALE', F(B, 17), MUT); text(d, (W - 34, 28), '0,4 m', F(B, 26), RED, 'ra')
        text(d, (x + 18, 86), 'ZADNJA OS', F(B, 17), MUT)
        d.rounded_rectangle((x + 18, 116, W - 34, 136), 10, fill=(255, 255, 255, 40)); d.rounded_rectangle((x + 190, 112, x + 214, 140), 6, fill=ACC)
        text(d, (x + 18, 146), 'L', F(B, 16), MUT); text(d, (W - 34, 146), 'D', F(B, 16), MUT, 'ra')
        bar(d, x + 18, 172, 284, 'KRILO', '100 %', 1.0, GRN)
        d.ellipse((W - 150, H - 150, W - 30, H - 30), fill=(40, 46, 56, 230)); text(d, (W - 90, H - 90), 'OS L/D', F(B, 20), FG, 'mm')
        hint(d, 'Z drugim drsnikom krmiš zadnjo os prikolice')
    if k == 10:
        base(d, k, 22); panel(d, (x, 16, W - 16, 86))
        text(d, (x + 18, 30), 'V OGRADI', F(B, 17), MUT); text(d, (W - 34, 28), '4 / 9', F(B, 26), FG, 'ra')
        minimap(d, W - 196, 100, 180, 10)
        hint(d, 'Prehitro jih razpršiš, prepočasi pobegnejo v gozd')
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, 'm%02d.jpg' % k), quality=90)

for k in range(1, 11): draw(k)
print('hud ok')
