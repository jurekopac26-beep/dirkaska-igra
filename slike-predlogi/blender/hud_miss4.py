# Prikaz na zaslonu (HUD) čez makete misij 36–45: gas/m4/mNN.png -> gas/m4/hud/mNN.jpg
# Gradniki (plošče, trakovi, merilniki, gumbi, oznake) so iz hud_miss.py, hud_miss2.py in hud_miss3.py.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'hud_miss3.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def draw3(k):')], os.path.join(_here, 'hud_miss3.py'), 'exec'))
D = os.path.join(_here, 'm4'); OUT = os.path.join(D, 'hud'); os.makedirs(OUT, exist_ok=True)
SUF = sys.argv[1] if len(sys.argv) > 1 else ''

MIS = {
    36: ('Plaz', 'Vršič, Slovenija', 'Z iskalnikom najdi zasute in jih odkoplji, dokler je čas', '11:20'),
    37: ('Poplava', 'Bang Saen, Tajska', 'Z dvoživko poberi ljudi s streh, preden voda naraste', '09:40'),
    38: ('Peščeni vihar', 'Moki Dugway, ZDA', 'Pridi do tabora, preden te prekrije stena prahu', '02:10'),
    39: ('Konji v prikolici', 'Monterey, ZDA', 'Pripelji konja do hleva mirna, brez ostrih sunkov', '05:50'),
    40: ('Varnostni avto', 'Bathurst, Avstralija', 'Vodi kolono s pravo hitrostjo, dokler ne očistijo proge', '01:35'),
    41: ('Dirkalni taksi', 'Nürburg, Nemčija', 'Krog pod 8:30 z navdušenimi potniki, a brez slabosti', '08:12'),
    42: ('Ogledalo za zvezde', 'Palomar Mountain, ZDA', 'Pripelji ogledalo do kupole samo z rdečimi lučmi', '04:30'),
    43: ('Vroče zavore', 'Rio do Rastro, Brazilija', 'Spusti se varno, ali zapelji na izletni pas', '03:05'),
    44: ('Skalni podor', "Chapman's Peak, Južna Afrika", 'Odstrani skale s ceste, preden jo odprejo za promet', '12:00'),
    45: ('Turistični vlakec', 'Monte Carlo, Monako', 'Vozi vlakec tako, da vagončki ne zadenejo robnika', '06:15'),
}

def pin_below(d, p, label, col=ACC, sub=None, dx=0):
    px, py = p[0] * W, p[1] * H; lx = px + dx
    w = d.textlength(label, font=F(B, 16)) + 28
    if sub: w = max(w, d.textlength(sub, font=F(R, 14)) + 28)
    hg = 54 if sub else 34; x0, y0 = lx - w / 2, py + 18
    d.rounded_rectangle((x0, y0, x0 + w, y0 + hg), 10, fill=(14, 18, 24, 215), outline=col, width=2)
    d.polygon([(lx - 9, y0), (lx + 9, y0), (px, py + 4)], fill=col)
    text(d, (lx, y0 + 17), label, F(B, 16), col, 'mm')
    if sub: text(d, (lx, y0 + 38), sub, F(R, 14), FG, 'mm')

def arrow(d, cx, cy, ang, L, col, w=10):
    a = math.radians(ang); ux, uy = math.sin(a), -math.cos(a); px, py = -uy, ux
    tip = (cx + ux * L / 2, cy + uy * L / 2); tail = (cx - ux * L / 2, cy - uy * L / 2)
    d.line((tail, (tip[0] - ux * 14, tip[1] - uy * 14)), fill=col, width=w)
    d.polygon([tip, (tip[0] - ux * 22 + px * 14, tip[1] - uy * 22 + py * 14), (tip[0] - ux * 22 - px * 14, tip[1] - uy * 22 - py * 14)], fill=col)

def bars(d, x, y, n, on, col):
    for i in range(n):
        h = 8 + i * 7; d.rounded_rectangle((x + i * 14, y + 36 - h, x + i * 14 + 9, y + 36), 2, fill=col if i < on else (255, 255, 255, 45))

def toggle(d, x0, y0, x1, y1, left, right, active_left, col):
    d.rounded_rectangle((x0, y0, x1, y1), (y1 - y0) // 2, fill=(255, 255, 255, 35))
    xm = (x0 + x1) / 2
    if active_left: d.rounded_rectangle((x0 + 3, y0 + 3, xm, y1 - 3), (y1 - y0) // 2, fill=col)
    else: d.rounded_rectangle((xm, y0 + 3, x1 - 3, y1 - 3), (y1 - y0) // 2, fill=col)
    text(d, ((x0 + xm) / 2, (y0 + y1) / 2), left, F(B, 17), FG if active_left else MUT, 'mm')
    text(d, ((xm + x1) / 2, (y0 + y1) / 2), right, F(B, 17), MUT if active_left else FG, 'mm')

def face(d, cx, cy, r, mood, col):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    for s in (-1, 1): d.ellipse((cx + s * r * 0.35 - 3, cy - r * 0.25 - 3, cx + s * r * 0.35 + 3, cy - r * 0.25 + 3), fill=(20, 24, 30, 255))
    if mood > 0: d.arc((cx - r * 0.5, cy - r * 0.35, cx + r * 0.5, cy + r * 0.55), 20, 160, fill=(20, 24, 30, 255), width=3)
    else: d.line((cx - r * 0.4, cy + r * 0.35, cx + r * 0.4, cy + r * 0.3), fill=(20, 24, 30, 255), width=3)

def horse_icon(d, cx, cy, col):
    d.polygon([(cx - 12, cy + 18), (cx - 8, cy - 6), (cx - 2, cy - 18), (cx + 2, cy - 24), (cx + 5, cy - 16), (cx + 14, cy - 2), (cx + 14, cy + 6), (cx + 4, cy + 4), (cx + 2, cy + 18)], fill=col)

def draw4(k):
    src = os.path.join(D, 'm%02d%s.png' % (k, SUF))
    if not os.path.exists(src): return
    im = Image.open(src).convert('RGBA').resize((W, H), Image.LANCZOS)
    jp = os.path.join(D, 'm%02d.json' % k)
    pts = json.load(open(jp)) if os.path.exists(jp) else {}
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x = W - 336
    if k == 36:
        base(d, k, 6)
        if 'zasuti' in pts:
            px, py = P(pts, 'zasuti')
            for (rw, a) in ((70, 120), (48, 170), (26, 230)): d.ellipse((px - rw, py - rw * 0.4, px + rw, py + rw * 0.4), outline=(88, 200, 120, a), width=3)
        panel(d, (x, 16, W - 16, 250))
        text(d, (x + 18, 26), 'ISKALNIK', F(B, 17), MUT)
        text(d, (x + 18, 50), '4,8 m', F(B, 44), FG); arrow(d, x + 230, 82, 35, 56, GRN, 9)
        bars(d, x + 18, 110, 5, 4, GRN)
        row(d, x, 166, 'ZASUTI', '1 / 2'); row(d, x, 206, 'ZRAK', 'še 11 min', YEL)
        btn(d, W - 90, H - 90, 60, 'SONDA', (196, 22, 28, 235), 20)
        hint(d, 'Sledi puščici iskalnika, nato s sondo poišči zasutega in ga odkoplji')
    if k == 37:
        base(d, k, 7)
        if 'ljudje' in pts: pin_below(d, pts['ljudje'], 'POMOČ!', RED, '2 osebi na strehi')
        panel(d, (x, 16, W - 16, 210))
        row(d, x, 30, 'REŠENI', '3 / 8', GRN)
        bar(d, x + 18, 72, 284, 'GLOBINA VODE', '1,4 m', 0.56, BLU)
        bar(d, x + 18, 130, 284, 'VODA NARAŠČA', '+5 cm/min', 0.7, RED, True)
        pill_btn(d, W - 266, H - 110, W - 26, H - 50, 'VRZI OBROČ', (232, 69, 42, 235))
        hint(d, 'Pelji ob hišo, ustavi in vrzi obroč; tok te nosi proti morju')
    if k == 38:
        base(d, k, 42)
        if 'tabor' in pts: pin(d, pts['tabor'], 'TABOR', ACC, '1,2 km')
        cx0, cx1, cy = W / 2 - 230, W / 2 + 230, 92
        d.rounded_rectangle((cx0, cy - 18, cx1, cy + 18), 18, fill=(14, 18, 24, 200))
        for i, t in enumerate(('Z', '·', 'S', '·', 'V')):
            text(d, (cx0 + 60 + i * 85, cy), t, F(B, 18), FG if t != '·' else MUT, 'mm')
        d.polygon([(W / 2 + 70, cy - 16), (W / 2 + 82, cy), (W / 2 + 70, cy + 16), (W / 2 + 58, cy)], fill=ACC)
        panel(d, (x, 16, W - 16, 210))
        bar(d, x + 18, 30, 284, 'VIDLJIVOST', '35 m', 0.25, RED, True)
        row(d, x, 92, 'KOLI OB POTI', '14 / 30'); row(d, x, 132, 'STENA PRAHU', 'čez 01:40', RED); row(d, x, 172, 'PISK TABORA', 'desno', ACC)
        hint(d, 'Ko ne vidiš več, se drži kolov ob poti in poslušaj pisk tabora')
    if k == 39:
        base(d, k, 48)
        panel(d, (x, 16, W - 16, 220))
        text(d, (x + 18, 26), 'MIR KONJ', F(B, 17), MUT)
        face(d, x + 36, 78, 17, 1, GRN); face(d, x + 80, 78, 17, 0, YEL)
        bar(d, x + 120, 52, 182, '', '80 %', 0.8, GRN)
        row(d, x, 116, 'SUNKI', '2', YEL); row(d, x, 154, 'DO HLEVA', '3,4 km'); text(d, (x + 18, 192), 'zaviraj zgodaj, ovinki počasi', F(R, 16), MUT)
        hint(d, 'Konji čutijo vsak sunek: zaviraj zgodaj in skozi ovinke pelji počasi')
    if k == 40:
        base(d, k, 80)
        d.rounded_rectangle((W / 2 - 170, 76, W / 2 + 170, 122), 23, fill=(242, 194, 48, 240)); text(d, (W / 2, 99), 'VARNOSTNI AVTO', F(B, 24), (18, 22, 28, 255), 'mm')
        panel(d, (x, 16, W - 16, 210))
        row(d, x, 30, 'DELTA', '+0,4 s', GRN); row(d, x, 70, 'KOLONA', '9 avtov')
        bar(d, x + 18, 110, 284, 'ODSTRANJEVANJE', '70 %', 0.7, YEL)
        text(d, (x + 18, 170), 'krog pred koncem ugasni luči', F(R, 16), MUT)
        pill_btn(d, W - 266, H - 110, W - 26, H - 50, 'UGASNI LUČI', (240, 122, 18, 235))
        hint(d, 'Vozi s pravo hitrostjo: prepočasi se gume ohladijo, prehitro kolona razpade')
    if k == 41:
        base(d, k, 128)
        panel(d, (x, 16, W - 16, 290))
        text(d, (x + 18, 26), 'ČAS KROGA', F(B, 17), MUT); text(d, (x + 18, 48), '8:12,4', F(B, 40)); text(d, (W - 34, 64), 'cilj 8:30', F(B, 18), GRN, 'ra')
        bar(d, x + 18, 104, 284, 'NAVDUŠENJE', '85 %', 0.85, GRN)
        bar(d, x + 18, 162, 284, 'SLABOST', '30 %', 0.3, YEL)
        text(d, (x + 18, 226), 'POTNIKI', F(B, 17), MUT)
        for i, (m, c) in enumerate(((1, GRN), (1, GRN), (0, YEL))): face(d, x + 160 + i * 52, 236, 18, m, c)
        hint(d, 'Hitro, a gladko: ostri sunki potnikom obrnejo želodec')
    if k == 42:
        base(d, k, 18)
        if 'kupola' in pts: pin_below(d, pts['kupola'], 'KUPOLA', (255, 90, 80, 255), 'samo rdeče luči')
        panel(d, (x, 16, W - 16, 236))
        text(d, (x + 18, 26), 'LUČI', F(B, 17), MUT); toggle(d, x + 90, 20, W - 34, 54, 'RDEČE', 'BELE', True, (196, 22, 28, 235))
        bar(d, x + 18, 72, 284, 'TRESLJAJI', '25 %', 0.25, GRN)
        row(d, x, 136, 'DO KUPOLE', '3,1 km'); row(d, x, 176, 'OGLEDALO', '100 %', GRN)
        hint(d, 'Bele luči motijo opazovanje: pelji počasi ob rdeči luči in mesecu')
    if k == 43:
        base(d, k, 54)
        if 'rampa' in pts: pin_below(d, pts['rampa'], 'IZLETNI PAS', YEL, '400 m')
        panel(d, (x, 16, W - 16, 300))
        gauge(d, x + 160, 140, 86, 0.84, 'ZAVORE', '640 °C', 0.7)
        text(d, (x + 18, 196), 'PRESTAVA', F(B, 17), MUT); text(d, (W - 34, 182), '3', F(B, 48), FG, 'ra')
        text(d, (x + 18, 250), 'zavore se grejejo', F(R, 16), RED)
        btn(d, W - 90, H - 90, 60, 'NIŽJE', (31, 79, 168, 235), 20)
        hint(d, 'Prestavi nižje in zaviraj z motorjem; če zavore odpovejo, zapelji na izletni pas')
    if k == 44:
        base(d, k, 4)
        if 'pada' in pts: pin_below(d, pts['pada'], 'PADA!', RED, 'umakni se', dx=120)
        panel(d, (x, 16, W - 16, 300))
        bar(d, x + 18, 30, 284, 'CESTA OČIŠČENA', '45 %', 0.45, GRN)
        gauge(d, x + 160, 196, 78, 0.62, 'NEVARNOST PODORA', 'srednja', 0.75)
        row(d, x, 244, 'PROMET ČEZ', '12 min', YEL)
        btn(d, W - 90, H - 90, 60, 'ZAJEMI', (240, 122, 18, 235), 20)
        hint(d, 'Ko z vrha pada kamen, se umakni pod mrežo in počakaj')
    if k == 45:
        base(d, k, 14)
        panel(d, (x, 16, W - 16, 330))
        text(d, (x + 18, 26), 'OVINEK', F(B, 17), MUT)
        ox, oy = x + 160, 150
        d.arc((ox - 110, oy - 80, ox + 70, oy + 80), 270, 90, fill=(255, 255, 255, 70), width=34)
        d.arc((ox - 110, oy - 80, ox + 70, oy + 80), 270, 90, fill=GRN, width=3)
        d.line((ox - 20, oy - 52, ox + 34, oy - 30, ox + 46, oy + 10), fill=RED, width=3)
        for i, (cx_, cy_, c) in enumerate(((ox + 2, oy + 75, FG), (ox + 40, oy + 52, FG), (ox + 58, oy + 12, FG), (ox + 40, oy - 30, RED))):
            d.rounded_rectangle((cx_ - 9, cy_ - 9, cx_ + 9, cy_ + 9), 3, fill=c)
        row(d, x, 250, 'POTNIKI', '38'); row(d, x, 288, 'ZADNJI', 'reže ovinek', RED)
        hint(d, 'Zavij široko: zadnji vagonček reže ovinek in zadene robnik')
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, 'm%02d%s.jpg' % (k, SUF)), quality=90)

for k in range(36, 46): draw4(k)
for k, (t, track, goal, clock) in MIS.items():
    w = ImageDraw.Draw(Image.new('RGB', (10, 10))).textlength(goal, font=F(R, 15))
    if w > 430: print('PREDOLGO', k, int(w), goal)
print('hud4 ok')
