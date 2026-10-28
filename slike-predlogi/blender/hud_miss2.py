# Prikaz na zaslonu (HUD) čez makete misij 11–25: gas/m2/mNN.png -> gas/m2/hud/mNN.jpg
# Osnovni gradniki (plošče, trakovi, merilnik, napis spodaj) so iz hud_miss.py.
import os
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'hud_miss.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def draw(k):')], os.path.join(_here, 'hud_miss.py'), 'exec'))
D = os.path.join(_here, 'm2'); OUT = os.path.join(D, 'hud'); os.makedirs(OUT, exist_ok=True)

MIS = {
    11: ('Ognjena reka', 'Mauna Kea, ZDA', 'Pripelji raziskovalce v dolino, preden lava zapre cesto', '00:22'),
    12: ('Avtek na daljinca', 'Suzuka, Japonska', 'Trije krogi po boksu med gumami, orodjem in deskami', '01:12'),
    13: ('Lovec na tornado', 'Detroit, ZDA', 'Postavi štiri sonde na pot tornada in se umakni', '03:40'),
    14: ('Sladoledar', 'Rio de Janeiro, Brazilija', 'Ustavi se pri otrocih, ki mahajo, in jim prodaj sladoled', '05:10'),
    15: ('Na tirih', 'Longford, Avstralija', 'Potisni pokvarjen avto s tirov, preden pripelje vlak', '00:18'),
    16: ('Za balonom', 'Toskana, Italija', 'Sledi balonu čez polja in bodi tam, kjer bo pristal', '04:35'),
    17: ('Ledeni most', 'Trois-Rivières, Kanada', 'Pelji tovornjak čez led z ravno pravo hitrostjo', '03:05'),
    18: ('Kaskader', 'Moki Dugway, ZDA', 'Zadeni vse oznake prizora: skok, drsenje, eksplozija', '00:41'),
    19: ('Pred plimo', 'Townsville, Avstralija', 'Pripelji zdravnika na otok, preden morje prekrije cesto', '04:20'),
    20: ('Fotosafari', 'Great Alpine Road, Avstralija', 'Počasi se približaj živalim in jih ujemi v kader', '07:30'),
    21: ('Zadnji trajekt', 'Riviera, Francija', 'Pridi do pristanišča in skoči na rampo, preden se zapre', '00:04'),
    22: ('Smetarski dan', 'Crystal Palace, Anglija', 'Izprazni vseh 20 smetnjakov, preden se začne promet', '06:48'),
    23: ('Lovec na meteorite', 'Marrakesh, Maroko', 'Poberi osem meteoritov, preden jih najdejo tekmeci', '06:15'),
    24: ('Žetev pred nevihto', 'Medvode, Slovenija', 'Požanji polje s kombajnom, preden začne padati toča', '04:10'),
    25: ('Spremljevalni avto', 'Spa, Belgija', 'Kolesarju podaj bidon: izenači hitrost in pritisni ODDAJ', '02:50'),
}

def row(d, x, y, label, val, c=FG):
    text(d, (x + 18, y), label, F(B, 17), MUT); text(d, (W - 34, y - 2), val, F(B, 22), c, 'ra')

def btn(d, cx, cy, r, t, col, fs=24):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col); text(d, (cx, cy), t, F(B, fs), FG, 'mm')

def pill_btn(d, x0, y0, x1, y1, t, col):
    d.rounded_rectangle((x0, y0, x1, y1), (y1 - y0) // 2, fill=col); text(d, ((x0 + x1) / 2, (y0 + y1) / 2), t, F(B, 22), FG, 'mm')

def radar(d, x, y, s, kind):
    panel(d, (x, y, x + s, y + s), 16)
    cx, cy, r = x + s / 2, y + s / 2 + 8, s / 2 - 22
    col = (60, 200, 120, 255) if kind == 'vihar' else (230, 170, 90, 255)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(10, 30, 22, 230) if kind == 'vihar' else (40, 26, 14, 230))
    for k in (0.33, 0.66, 1.0): d.ellipse((cx - r * k, cy - r * k, cx + r * k, cy + r * k), outline=col[:3] + (110,), width=2)
    d.line((cx - r, cy, cx + r, cy), fill=col[:3] + (70,), width=1); d.line((cx, cy - r, cx, cy + r), fill=col[:3] + (70,), width=1)
    text(d, (x + 14, y + 10), 'RADAR', F(B, 15), MUT)
    if kind == 'vihar':
        for (dx, dy, rr, c) in ((22, -28, 30, (230, 200, 40, 200)), (28, -32, 20, (240, 120, 30, 230)), (32, -34, 10, (230, 40, 40, 255))):
            d.ellipse((cx + dx - rr, cy + dy - rr, cx + dx + rr, cy + dy + rr), fill=c)
        d.arc((cx + 18, cy - 26, cx + 52, cy + 4), 200, 40, fill=(230, 40, 40, 255), width=5)
        for (dx, dy) in ((6, -14), (14, -20)): d.ellipse((cx + dx - 4, cy + dy - 4, cx + dx + 4, cy + dy + 4), fill=(255, 140, 30, 255))
    else:
        for (dx, dy) in ((-20, -30), (18, -40), (-38, 10), (34, 20)): d.ellipse((cx + dx - 6, cy + dy - 6, cx + dx + 6, cy + dy + 6), fill=(255, 110, 30, 255))
        d.ellipse((cx + 6 - 14, cy - 22 - 14, cx + 6 + 14, cy - 22 + 14), outline=(255, 210, 60, 255), width=3)
        for (dx, dy) in ((-50, -50), (46, -12)): d.ellipse((cx + dx - 5, cy + dy - 5, cx + dx + 5, cy + dy + 5), fill=(170, 170, 180, 255))
    d.polygon([(cx, cy - 9), (cx + 7, cy + 7), (cx - 7, cy + 7)], fill=YEL)

def band_gauge(d, cx, cy, r, lo, hi, v, vmax, label, val):
    d.arc((cx - r, cy - r, cx + r, cy + r), 180, 360, fill=RED, width=14)
    a0, a1 = 180 + 180 * lo / vmax, 180 + 180 * hi / vmax
    d.arc((cx - r, cy - r, cx + r, cy + r), a0, a1, fill=GRN, width=14)
    a = math.pi * (1 - v / vmax); d.line((cx, cy, cx + (r - 20) * math.cos(a), cy - (r - 20) * math.sin(a)), fill=FG, width=5)
    d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=FG)
    text(d, (cx, cy + 22), val, F(B, 22), FG, 'mm'); text(d, (cx, cy - r - 22), label, F(B, 16), MUT, 'mm')

def brackets(d, cx, cy, w, h, col=FG, L=26, wd=4):
    x0, y0, x1, y1 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
    for (x, y, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line((x, y, x + sx * L, y), fill=col, width=wd); d.line((x, y, x, y + sy * L), fill=col, width=wd)
    d.line((cx - 10, cy, cx + 10, cy), fill=col, width=2); d.line((cx, cy - 10, cx, cy + 10), fill=col, width=2)

def outlined(d, xy, t, f, c, o=(14, 18, 24, 255), w=4):
    for dx in range(-w, w + 1, 2):
        for dy in range(-w, w + 1, 2): d.text((xy[0] + dx, xy[1] + dy), t, font=f, fill=o, anchor='mm')
    d.text(xy, t, font=f, fill=c, anchor='mm')

def draw2(k):
    src = os.path.join(D, 'm%02d.png' % k)
    if not os.path.exists(src): return
    im = Image.open(src).convert('RGBA').resize((W, H), Image.LANCZOS)
    jp = os.path.join(D, 'm%02d.json' % k)
    pts = json.load(open(jp)) if os.path.exists(jp) else {}
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x = W - 336
    if k == 11:
        base(d, k, 64); panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'PREHODI ODPRTI', '1 / 3', RED); bar(d, x + 18, 76, 284, 'PEPEL', '55 %', 0.55, (170, 170, 180, 255)); bar(d, x + 18, 134, 284, 'AVTO', '82 %', 0.82, GRN)
        hint(d, 'Rdeči krog pomeni, da tja pade žareč kamen')
    if k == 12:
        base(d, k, 18); panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'KROG', '2 / 3'); row(d, x, 72, 'MESTO', '1 / 4', GRN); bar(d, x + 18, 120, 284, 'BATERIJA', '62 %', 0.62, YEL)
        btn(d, W - 90, H - 90, 60, 'TURBO', (196, 22, 28, 230))
        hint(d, 'Skoči z deske na kup gum in prehiti vse tri')
    if k == 13:
        base(d, k, 72); radar(d, W - 236, 16, 220, 'vihar'); panel(d, (x, 248, W - 16, 352))
        row(d, x, 262, 'SONDE', '2 / 4'); bar(d, x + 18, 300, 284, 'VETER', '180 km/h', 0.9, RED, True)
        btn(d, W - 90, H - 90, 60, 'ODLOŽI', (240, 122, 18, 235), 20)
        hint(d, 'Odloži sondo na pot tornada in takoj obrni')
    if k == 14:
        base(d, k, 0); panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'PRODANO', '12'); text(d, (x + 18, 74), 'KOVANCI', F(B, 17), MUT)
        d.ellipse((W - 128, 70, W - 104, 94), fill=YEL); text(d, (W - 34, 72), '+ 48', F(B, 22), FG, 'ra')
        bar(d, x + 18, 120, 284, 'HLADILNIK', '−14 °C', 0.7, BLU)
        btn(d, W - 90, H - 90, 60, 'PRODAJ', (232, 80, 106, 235), 20)
        hint(d, 'Ustavi se ob otroku, ki maha, in pritisni PRODAJ')
    if k == 15:
        base(d, k, 6); panel(d, (x, 16, W - 16, 230))
        bar(d, x + 18, 30, 284, 'VLAK', '640 m', 0.35, RED, True); text(d, (x + 160, 112), 'TUUUT!', F(B, 40), RED, 'mm')
        row(d, x, 160, 'AVTO NA TIRIH', 'še 1,2 m'); text(d, (x + 18, 196), 'potiskaj naprej', F(R, 16), MUT)
        hint(d, 'Potiskaj nežno, sicer pokvarjen avto zasučeš')
    if k == 16:
        base(d, k, 54); panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'VIŠINA BALONA', '45 m'); row(d, x, 72, 'PRISTANEK', '~ 1,2 km', YEL)
        text(d, (x + 18, 120), 'VETER', F(B, 17), MUT); text(d, (W - 34, 118), '12 km/h', F(B, 22), FG, 'ra')
        ax, ay = x + 170, 160; d.line((ax - 30, ay + 12, ax + 30, ay - 12), fill=FG, width=5); d.polygon([(ax + 38, ay - 16), (ax + 20, ay - 18), (ax + 30, ay - 2)], fill=FG)
        if 'pristanek' in pts:
            px, py = pts['pristanek'][0] * W, pts['pristanek'][1] * H
            d.ellipse((px - 70, py - 26, px + 70, py + 26), outline=(255, 138, 26, 255), width=4); text(d, (px, py - 42), 'PRISTANEK', F(B, 16), (255, 170, 80, 255), 'mm')
        hint(d, 'Bodi v oranžnem krogu, ko se balon spusti')
    if k == 17:
        base(d, k, 31); panel(d, (x, 16, W - 16, 300))
        band_gauge(d, x + 160, 150, 100, 25, 35, 31, 60, 'VARNA HITROST 25–35', '31 km/h')
        bar(d, x + 18, 190, 284, 'LED', '41 cm', 0.6, BLU); bar(d, x + 18, 242, 284, 'RAZPOKE', '30 %', 0.3, RED)
        hint(d, 'Drži hitrost v zelenem pasu: prepočasi se led ugreza, prehitro poči')
    if k == 18:
        base(d, k, 96); panel(d, (x, 16, W - 16, 210))
        cx0, cy0 = x + 18, 30
        d.rectangle((cx0, cy0 + 16, cx0 + 64, cy0 + 56), fill=(20, 20, 22, 255))
        for i in range(4): d.polygon([(cx0 + i * 16, cy0 + 16), (cx0 + i * 16 + 8, cy0 + 16), (cx0 + i * 16 + 16, cy0), (cx0 + i * 16 + 8, cy0)], fill=FG)
        d.rectangle((cx0, cy0, cx0 + 64, cy0 + 2), fill=FG)
        text(d, (cx0 + 80, cy0 + 4), 'PRIZOR 3', F(B, 20)); text(d, (cx0 + 80, cy0 + 30), 'POSNETEK 2', F(R, 17), MUT)
        text(d, (x + 18, 100), '★★☆', F(B, 40), YEL); text(d, (x + 18, 156), 'NASLEDNJE: DRSENJE MIMO', F(B, 15), MUT); text(d, (x + 18, 178), 'KAMERE', F(B, 15), MUT)
        outlined(d, (W / 2, 104), 'AKCIJA!', F(B, 48), RED)
        hint(d, 'Skoči čez rampo, ko poči eksplozija')
    if k == 19:
        base(d, k, 34); panel(d, (x, 16, W - 16, 196))
        bar(d, x + 18, 30, 284, 'MORJE NA CESTI', '+0,3 m', 0.45, BLU, True); row(d, x, 92, 'OTOK', '1,8 km'); row(d, x, 136, 'ZDRAVNIK', 'v avtu', GRN)
        hint(d, 'Ko voda doseže kolesa, avto začne drseti')
    if k == 20:
        base(d, k, 5)
        if 'fokus' in pts:
            brackets(d, pts['fokus'][0] * W, pts['fokus'][1] * H, 170, 120)
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'ALBUM', '3 / 6')
        for i in range(6):
            sx = x + 18 + i * 49; d.rounded_rectangle((sx, 64, sx + 42, 96), 5, fill=(242, 163, 58, 255) if i < 3 else (255, 255, 255, 40))
        bar(d, x + 18, 120, 284, 'PLAŠNOST', '30 %', 0.3, GRN)
        btn(d, W - 90, H - 90, 60, 'SLIKAJ', (40, 46, 56, 235), 20); d.ellipse((W - 102, H - 128, W - 78, H - 116), outline=FG, width=3)
        hint(d, 'Počasi! Glasen motor živali prestraši')
    if k == 21:
        base(d, k, 142)
        d.rounded_rectangle((W / 2 - 70, 16, W / 2 + 70, 66), 25, fill=(196, 22, 28, 235)); text(d, (W / 2, 41), '00:04', F(B, 30), FG, 'mm')
        panel(d, (x, 16, W - 16, 150))
        bar(d, x + 18, 30, 284, 'HITROST ZA SKOK', '142 / 130', 1.0, GRN); row(d, x, 96, 'RAMPA', '18°', YEL)
        outlined(d, (W / 2, 140), 'SKOK!', F(B, 64), YEL)
        hint(d, 'Polna hitrost do roba pomola!')
    if k == 22:
        base(d, k, 0); panel(d, (x, 16, W - 16, 150))
        row(d, x, 30, 'SMETNJAKI', '7 / 20'); row(d, x, 72, 'PROMET ČEZ', '12 min', YEL); text(d, (x + 18, 112), 'roka zgrabi sama', F(R, 16), MUT)
        if 'roka' in pts:
            px, py = pts['roka'][0] * W, pts['roka'][1] * H
            for a in range(200, 340, 12): d.arc((px - 90, py - 60, px + 90, py + 60), a, a + 6, fill=YEL, width=4)
        btn(d, W - 90, H - 90, 60, 'PRIMI', (47, 125, 79, 235))
        hint(d, 'Ustavi se ob smetnjaku, roka ga zgrabi sama')
    if k == 23:
        base(d, k, 38); radar(d, W - 236, 16, 220, 'puscava'); panel(d, (x, 248, W - 16, 392))
        row(d, x, 262, 'METEORITI', '3 / 8'); row(d, x, 304, 'NASLEDNJI UDAR', '00:07', YEL); row(d, x, 346, 'TEKMECI', '2')
        hint(d, 'Žareč kamen je prevroč: počakaj, da se ohladi')
    if k == 24:
        base(d, k, 8); panel(d, (x, 16, W - 16, 196))
        bar(d, x + 18, 30, 284, 'POŽETO', '64 %', 0.64, YEL); bar(d, x + 18, 88, 284, 'REZERVOAR', '80 %', 0.8, ACC); row(d, x, 150, 'TOČA', 'čez 04:10', RED)
        pill_btn(d, W - 236, H - 110, W - 26, H - 50, 'PRETOVORI', (240, 122, 18, 235))
        hint(d, 'Ko je rezervoar poln, zapelji ob prikolico in pritisni PRETOVORI')
    if k == 25:
        base(d, k, 33); panel(d, (x, 16, W - 16, 196))
        text(d, (x + 18, 30), 'IZENAČI HITROST', F(B, 17), MUT)
        bx0, bx1, by = x + 18, W - 34, 70
        d.rounded_rectangle((bx0, by, bx1, by + 18), 9, fill=(255, 255, 255, 40))
        g0, g1 = bx0 + (bx1 - bx0) * 0.44, bx0 + (bx1 - bx0) * 0.62
        d.rounded_rectangle((g0, by, g1, by + 18), 9, fill=GRN)
        for (f, lab, c, anc, dx) in ((0.47, 'KOLESAR 31', YEL, 'rm', 8), (0.6, 'TI 33', FG, 'lm', -8)):
            px = bx0 + (bx1 - bx0) * f; d.polygon([(px, by + 22), (px - 8, by + 36), (px + 8, by + 36)], fill=c)
            text(d, (px + dx, by + 52), lab, F(B, 15), c, anc)
        row(d, x, 150, 'BIDONI', '2 / 4')
        btn(d, W - 90, H - 90, 60, 'ODDAJ', (31, 79, 168, 235))
        hint(d, 'Pridi ob kolesarja z enako hitrostjo in pritisni ODDAJ')
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, 'm%02d.jpg' % k), quality=90)

for k in range(11, 26): draw2(k)
print('hud2 ok')
