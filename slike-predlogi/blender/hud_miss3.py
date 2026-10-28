# Prikaz na zaslonu (HUD) čez makete misij 26–35: gas/m3/mNN.png -> gas/m3/hud/mNN.jpg
# Gradniki (plošče, trakovi, merilniki, gumbi) so iz hud_miss.py in hud_miss2.py.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'hud_miss2.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def draw2(k):')], os.path.join(_here, 'hud_miss2.py'), 'exec'))
D = os.path.join(_here, 'm3'); OUT = os.path.join(D, 'hud'); os.makedirs(OUT, exist_ok=True)
SUF = sys.argv[1] if len(sys.argv) > 1 else ''      # '_hitro' za predogled

MIS = {
    26: ('Zadnji odstotek', 'Tianmen, Kitajska', 'Spusti se do polnilnice, preden se baterija izprazni', '06:40'),
    27: ('Splavi čoln', 'Uncompahgre, ZDA', 'Z vzvratno vožnjo spusti prikolico s čolnom v jezero', '01:30'),
    28: ('Svetilnik v nevihti', 'Big Sur, ZDA', 'Popravi svetilnik, preden ladja zaide na čeri', '03:15'),
    29: ('Božična noč', 'Štajerska, Avstrija', 'Vrzi darilo v zlati krog pred vsako hišo z lučkami', '04:48'),
    30: ('Ratrak', 'Mount Baldy, ZDA', 'Uredi progo, preden zjutraj pridejo prvi smučarji', '05:20'),
    31: ('Dinozavrovo jajce', 'Riverside, ZDA', 'Pripelji jajce v muzej, da ne poči in se ne ohladi', '08:30'),
    32: ('Opičja tolpa', 'Irohazaka, Japonska', 'Pripelji kakije na vrh, preden jih opice pokradejo', '04:05'),
    33: ('Odvoz snega', 'Montréal, Kanada', 'Vozi ob snežni frezi, da curek pada v tvoj kiper', '06:30'),
    34: ('Mestni avtobus', 'Toronto, Kanada', 'Ustavi ob vsaki postaji, odpri vrata in vozi mehko', '12:40'),
    35: ('Reševalci na plaži', 'Newcastle, Avstralija', 'S štirikolesnikom in skuterjem reši plavalca', '01:45'),
}

def pin(d, p, label, col=ACC, sub=None, dx=0):
    px, py = p[0] * W, p[1] * H; lx = px + dx
    w = d.textlength(label, font=F(B, 16)) + 28
    if sub: w = max(w, d.textlength(sub, font=F(R, 14)) + 28)
    hg = 54 if sub else 34; x0, y0 = lx - w / 2, py - 18 - hg
    d.rounded_rectangle((x0, y0, x0 + w, y0 + hg), 10, fill=(14, 18, 24, 215), outline=col, width=2)
    d.polygon([(lx - 9, y0 + hg), (lx + 9, y0 + hg), (px, py - 4)], fill=col)
    text(d, (lx, y0 + 17), label, F(B, 16), col, 'mm')
    if sub: text(d, (lx, y0 + 38), sub, F(R, 14), FG, 'mm')

def battery(d, x, y, w, h, frac, col):
    d.rounded_rectangle((x, y, x + w, y + h), 8, outline=FG, width=3)
    d.rounded_rectangle((x + w + 2, y + h * 0.3, x + w + 10, y + h * 0.7), 3, fill=FG)
    d.rounded_rectangle((x + 7, y + 7, x + 7 + max(12, (w - 14) * frac), y + h - 7), 4, fill=col)

def angle_gauge(d, cx, cy, r, val, lim, label, vtxt):
    for a0, a1, c in ((-60, -lim, RED), (-lim, lim, GRN), (lim, 60, RED)):
        d.arc((cx - r, cy - r, cx + r, cy + r), 270 + a0, 270 + a1, fill=c, width=12)
    a = math.radians(val - 90); d.line((cx, cy, cx + (r - 18) * math.cos(a), cy + (r - 18) * math.sin(a)), fill=FG, width=5)
    d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=FG)
    text(d, (cx, cy + 22), vtxt, F(B, 22), FG, 'mm'); text(d, (cx, cy - r - 22), label, F(B, 16), MUT, 'mm')

def gift(d, x, y, s, on):
    c = (232, 80, 106, 255) if on else (255, 255, 255, 45)
    d.rounded_rectangle((x, y, x + s, y + s), 4, fill=c)
    if on:
        d.rectangle((x + s / 2 - 2, y, x + s / 2 + 2, y + s), fill=YEL); d.rectangle((x, y + s / 2 - 2, x + s, y + s / 2 + 2), fill=YEL)

def dots(d, pts, col=FG, r=4, every=18):
    acc = 0.0
    for (a, b) in zip(pts, pts[1:]):
        L = math.hypot(b[0] - a[0], b[1] - a[1]); t = 0.0
        while t < L:
            if acc <= 0:
                x, y = a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L
                d.ellipse((x - r, y - r, x + r, y + r), fill=col); acc = every
            step = min(2.0, L - t); t += step; acc -= step

def bez(a, c, b, n=40):
    return [((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]) for t in [i / n for i in range(n + 1)]]

def P(pts, k): return (pts[k][0] * W, pts[k][1] * H)

def draw3(k):
    src = os.path.join(D, 'm%02d%s.png' % (k, SUF))
    if not os.path.exists(src): return
    im = Image.open(src).convert('RGBA').resize((W, H), Image.LANCZOS)
    jp = os.path.join(D, 'm%02d.json' % k)
    pts = json.load(open(jp)) if os.path.exists(jp) else {}
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x = W - 336
    if k == 26:
        base(d, k, 28)
        if 'polnilnica' in pts: pin(d, pts['polnilnica'], 'POLNILNICA', GRN, '2,4 km')
        panel(d, (x, 16, W - 16, 236))
        text(d, (x + 18, 26), 'BATERIJA', F(B, 17), MUT)
        battery(d, x + 18, 52, 160, 52, 0.03, RED); text(d, (W - 34, 54), '3 %', F(B, 40), RED, 'ra')
        row(d, x, 122, 'DOMET', '2,1 km', RED); row(d, x, 158, 'DO POLNILNICE', '2,4 km'); row(d, x, 194, 'REKUPERACIJA', '+0,4 %', GRN)
        hint(d, 'Zaviraj z motorjem: na vsakem ovinku dobiš nekaj energije')
    if k == 27:
        base(d, k, 4)
        iw, ih = 400, 227; ix, iy = W - 16 - iw, 16
        ins_p = os.path.join(D, 'm27_inset%s.png' % SUF)
        if os.path.exists(ins_p):
            ins = Image.open(ins_p).convert('RGBA').resize((iw, ih), Image.LANCZOS)
            mask = Image.new('L', (iw, ih), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, iw, ih), 14, fill=255)
            im.paste(ins, (ix, iy), mask)
        d.rounded_rectangle((ix, iy, ix + iw, iy + ih), 14, outline=FG, width=3)
        segs = ((1.0, 0.8, RED), (0.8, 0.62, YEL), (0.62, 0.48, GRN))
        for side in (-1, 1):
            for (t0, t1, c) in segs:
                xa = ix + iw / 2 + side * iw * (0.12 + 0.3 * (t0 - 0.48) / 0.52); xb = ix + iw / 2 + side * iw * (0.12 + 0.3 * (t1 - 0.48) / 0.52)
                d.line((xa, iy + ih * t0, xb, iy + ih * t1), fill=c, width=5)
                d.line((xb, iy + ih * t1, xb - side * 16, iy + ih * t1), fill=c, width=4)
        path = bez((ix + iw / 2, iy + ih), (ix + iw * 0.5, iy + ih * 0.62), (ix + iw * 0.36, iy + ih * 0.45))
        dots(d, path, (80, 160, 255, 255), 3, 12)
        d.rounded_rectangle((ix + 10, iy + 10, ix + 178, iy + 38), 14, fill=(14, 18, 24, 200)); text(d, (ix + 94, iy + 24), 'ZADNJA KAMERA', F(B, 15), FG, 'mm')
        d.rounded_rectangle((ix + iw - 54, iy + 10, ix + iw - 10, iy + 50), 10, fill=(196, 22, 28, 235)); text(d, (ix + iw - 32, iy + 30), 'R', F(B, 26), FG, 'mm')
        panel(d, (x, iy + ih + 14, W - 16, iy + ih + 214))
        angle_gauge(d, x + 160, iy + ih + 140, 78, 16, 30, 'KOT PRIKOLICE', '16°')
        row(d, x, iy + ih + 178, 'DO VODE', '6,5 m', YEL)
        hint(d, 'Volan obrni v nasprotno smer, kot naj gre prikolica')
    if k == 28:
        base(d, k, 46)
        if 'svetilnik' in pts: pin(d, pts['svetilnik'], 'SVETILNIK', RED, 'luč ne sveti', dx=-80)
        if 'ladja' in pts: pin(d, pts['ladja'], 'LADJA', YEL, '1,4 km do čeri', dx=80)
        panel(d, (x, 16, W - 16, 300))
        row(d, x, 30, 'SERVISER', 'v avtu', GRN)
        bar(d, x + 18, 72, 284, 'LADJA DO ČERI', '1,4 km', 0.3, RED, True)
        gauge(d, x + 160, 250, 74, 0.78, 'SUNKI VETRA', '95 km/h', 0.7)
        hint(d, 'Sunki vetra te potiskajo proti robu klifa, drži se sredine')
    if k == 29:
        base(d, k, 24)
        if 'tarca' in pts:
            tx, ty = P(pts, 'tarca')
            for (rw, rh, wd, c) in ((86, 30, 5, YEL), (60, 20, 3, (255, 240, 170, 255))): d.ellipse((tx - rw, ty - rh, tx + rw, ty + rh), outline=c, width=wd)
            text(d, (tx, ty - 46), 'TARČA', F(B, 16), YEL, 'mm')
            if 'auto' in pts and 'darilo' in pts:
                a = P(pts, 'auto'); g = P(pts, 'darilo'); c = (2 * g[0] - (a[0] + tx) / 2, 2 * g[1] - (a[1] + ty) / 2)
                dots(d, bez(a, c, (tx, ty)), (255, 240, 170, 230), 4, 20)
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'DARILA', '7 / 12')
        for i in range(12): gift(d, x + 18 + (i % 6) * 48, 70 + (i // 6) * 44, 34, i < 7)
        row(d, x, 160, 'ZADETKI V KROG', '6', GRN)
        btn(d, W - 90, H - 90, 60, 'VRZI', (196, 22, 28, 235))
        hint(d, 'Vrzi darilo v zlati krog pred vrati, ne v okno')
    if k == 30:
        base(d, k, 9)
        panel(d, (x, 16, W - 16, 330))
        bar(d, x + 18, 30, 284, 'UREJENO', '62 %', 0.62, GRN)
        gauge(d, x + 160, 196, 80, 0.72, 'VITEL', '72 %', 0.85)
        row(d, x, 232, 'NAKLON', '38 %', YEL); row(d, x, 270, 'SMUČARJI OB', '7:00')
        hint(d, 'Na strmini drži vitel napet, sicer ratrak zdrsne')
    if k == 31:
        base(d, k, 38)
        if 'muzej' in pts: pin(d, pts['muzej'], 'MUZEJ', ACC, '6,2 km')
        panel(d, (x, 16, W - 16, 300))
        band_gauge(d, x + 160, 140, 84, 30, 38, 34, 50, 'TEMPERATURA JAJCA', '34 °C')
        text(d, (x + 18, 184), 'RAZPOKE', F(B, 17), MUT)
        for i in range(5):
            cx_ = x + 112 + i * 28; c = RED if i < 2 else (255, 255, 255, 50)
            d.line((cx_, 184, cx_ + 8, 194, cx_ + 2, 202, cx_ + 10, 212), fill=c, width=4)
        text(d, (W - 34, 184), '2 / 5', F(B, 22), RED, 'ra')
        bar(d, x + 18, 232, 284, 'TRESLJAJI', '40 %', 0.4, YEL)
        hint(d, 'Vsaka luknja jajce strese: pelji mehko in pazi na grelec')
    if k == 32:
        base(d, k, 22)
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'KAKIJI', '17 / 20')
        for i in range(20):
            cx_ = x + 30 + (i % 10) * 28; cy_ = 80 + (i // 10) * 28
            d.ellipse((cx_ - 10, cy_ - 10, cx_ + 10, cy_ + 10), fill=(232, 118, 26, 255) if i < 17 else (255, 255, 255, 45))
        row(d, x, 150, 'OPICE NA AVTU', '3', RED)
        btn(d, W - 90, H - 90, 60, 'HUPA', (240, 122, 18, 235))
        hint(d, 'Hupaj, da opice skočijo s tovornjaka, a ne povozi nobene')
    if k == 33:
        base(d, k, 6)
        if 'curek' in pts: brackets(d, pts['curek'][0] * W, pts['curek'][1] * H, 150, 96, GRN)
        panel(d, (x, 16, W - 16, 236))
        text(d, (x + 18, 30), 'POD CUREK', F(B, 17), MUT)
        bx0, bx1, by = x + 18, W - 34, 64
        d.rounded_rectangle((bx0, by, bx1, by + 18), 9, fill=(255, 255, 255, 40))
        d.rounded_rectangle((bx0 + (bx1 - bx0) * 0.38, by, bx0 + (bx1 - bx0) * 0.62, by + 18), 9, fill=GRN)
        mx_ = bx0 + (bx1 - bx0) * 0.55; d.polygon([(mx_, by + 22), (mx_ - 9, by + 38), (mx_ + 9, by + 38)], fill=FG)
        text(d, (mx_, by + 54), 'ZADENEŠ', F(B, 15), GRN, 'mm')
        bar(d, x + 18, 136, 284, 'KIPER', '70 %', 0.7, BLU); row(d, x, 196, 'POLNI KIPERJI', '3')
        hint(d, 'Vozi enako hitro kot freza, da sneg pada v kiper')
    if k == 34:
        base(d, k, 18)
        if 'postaja' in pts: pin(d, pts['postaja'], 'POSTAJA', YEL, 'vrata ob rumeni črti')
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'POSTAJA', '4 / 9'); row(d, x, 72, 'ZAMUDA', '+0:20', YEL)
        text(d, (x + 18, 120), 'UDOBJE', F(B, 17), MUT); text(d, (W - 34, 112), '★★★★☆', F(B, 30), YEL, 'ra')
        text(d, (x + 18, 158), 'potniki stojijo, zaviraj mehko', F(R, 16), MUT)
        pill_btn(d, W - 236, H - 110, W - 26, H - 50, 'ODPRI VRATA', (31, 79, 168, 235))
        hint(d, 'Ustavi tako, da so vrata ob rumeni črti, in zaviraj mehko')
    if k == 35:
        base(d, k, 31)
        if 'plavalec' in pts:
            sx, sy = P(pts, 'plavalec')
            for (r_, wd) in ((40, 4), (26, 3)): d.ellipse((sx - r_, sy - r_ * 0.45, sx + r_, sy + r_ * 0.45), outline=RED, width=wd)
            outlined(d, (sx, sy - 40), 'POMOČ!', F(B, 22), RED)
        d.rounded_rectangle((W / 2 - 230, 80, W / 2 + 230, 124), 22, fill=(14, 18, 24, 200))
        d.rounded_rectangle((W / 2 - 226, 84, W / 2 - 4, 120), 18, fill=ACC); text(d, (W / 2 - 115, 102), 'ŠTIRIKOLESNIK', F(B, 18), (18, 22, 28, 255), 'mm')
        text(d, (W / 2 + 115, 102), 'SKUTER', F(B, 18), MUT, 'mm')
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'PLAVALEC', '62 m'); bar(d, x + 18, 76, 284, 'MOČ PLAVALCA', '35 %', 0.35, RED, True); row(d, x, 150, 'VALOVI', '1,8 m', YEL)
        pill_btn(d, W - 326, H - 110, W - 26, H - 50, 'PRESEDI NA SKUTER', (31, 79, 168, 235))
        hint(d, 'Na robu vode presedi na skuter in pelji do plavalca')
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, 'm%02d%s.jpg' % (k, SUF)), quality=90)

if __name__ == '__main__' or True:
    for k in range(26, 36): draw3(k)
    for k, (t, track, goal, clock) in MIS.items():
        w = ImageDraw.Draw(Image.new('RGB', (10, 10))).textlength(goal, font=F(R, 15))
        if w > 430: print('PREDOLGO', k, int(w), goal)
    print('hud3 ok')
