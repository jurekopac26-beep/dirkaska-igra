# Prikaz na zaslonu (HUD) čez makete misij 46–55, popravljenih misij 6 in 45 ter zaporedij 29 (met darila) in 35 (iskanje):
# gas/m5/mNN.png -> gas/m5/hud/mNN.jpg. Gradniki so iz hud_miss.py … hud_miss4.py.
import os, sys
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'hud_miss4.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def draw4(k):')], os.path.join(_here, 'hud_miss4.py'), 'exec'))
D = os.path.join(_here, 'm5'); OUT = os.path.join(D, 'hud'); os.makedirs(OUT, exist_ok=True)
SUF = sys.argv[1] if len(sys.argv) > 1 else ''
_pin, _pin_below = pin, pin_below
def pin(d, p, *a, **k):          # oznaka samo, če je točka v kadru
    if 0.02 < p[0] < 0.98 and 0.1 < p[1] < 0.95: _pin(d, p, *a, **k)
def pin_below(d, p, *a, **k):
    if 0.02 < p[0] < 0.98 and 0.05 < p[1] < 0.85: _pin_below(d, p, *a, **k)

MIS = {
    6: ('Srce v hladilni torbi', 'Mulholland Highway, ZDA', 'Za policijo dostavi organ v bolnišnico, dokler je hladen', '06:12'),
    29: ('Božična noč', 'Štajerska, Avstrija', 'Vrzi darilo v zlati krog pred vsako hišo z lučkami', '04:48'),
    35: ('Reševalci na plaži', 'Newcastle, Avstralija', 'S štirikolesnikom in skuterjem reši plavalca', '01:45'),
    45: ('Turistični vlakec', 'Riviera, Francija', 'Vozi vlakec tako, da vagončki ne zadenejo robnika', '06:15'),
    46: ('Požar v predoru', 'Uncompahgre, ZDA', 'Reši ujete iz zadimljenega predora in pogasi ogenj', '05:30'),
    47: ('Gozdni požar', 'Great Alpine Road, Avstralija', 'Ustavi ogenj pred kmetijo; vodo natoči v jezercu', '07:10'),
    48: ('Narasla reka', 'Longford, Avstralija', 'Prepelji vse s kmetije čez most, preden ga reka zalije', '03:40'),
    49: ('Zataknjeno kolo', 'Suzuka, Japonska', 'Z avtolestvijo reši ljudi iz kabin obstalega kolesa', '06:00'),
    50: ('Panji na pašo', 'Medvode, Slovenija', 'Prepelji panje na pašo mirno, brez sunkov in lukenj', '05:20'),
    51: ('Dinozaver na tovornjaku', 'Crystal Palace, Anglija', 'Pripelji dinozavra v park, ne da zadene veje ali most', '04:15'),
    52: ('Hiša na tovornjaku', 'Big Sur, ZDA', 'Prepelji hišo po obalni cesti in čez most brez praske', '08:40'),
    53: ('Snežne verige', 'Los Caracoles, Čile', 'Namesti verige in pripelji avtobus čez prelaz pred zaporo', '07:30'),
    54: ('Dirka tovornjakov', 'Nürburg, Nemčija', 'Zmagaj dirko tovornjakov, ne da pregreješ zavore', '02:45'),
    55: ('Medvedi na cesti', 'Beartooth, ZDA', 'Razženi zastoj in medvede varno spravi s ceste', '04:20'),
}

def step(d, n, title, col=ACC):
    t = 'KORAK %d / 4 · %s' % (n, title); w = d.textlength(t, font=F(B, 20)) + 40
    d.rounded_rectangle((W / 2 - w / 2, 76, W / 2 + w / 2, 116), 20, fill=col); text(d, (W / 2, 96), t, F(B, 20), (18, 22, 28, 255), 'mm')

def inset(im, d, k, iw=400, ih=227):
    ix, iy = W - 16 - iw, 16; p = os.path.join(D, 'm%02d_inset%s.png' % (k, SUF))
    if os.path.exists(p):
        ins = Image.open(p).convert('RGBA').resize((iw, ih), Image.LANCZOS)
        mask = Image.new('L', (iw, ih), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, iw, ih), 14, fill=255)
        im.paste(ins, (ix, iy), mask)
    d.rounded_rectangle((ix, iy, ix + iw, iy + ih), 14, outline=FG, width=3)
    return ix, iy, iw, ih

def ping(d, p, col, rs=(16, 30, 46)):
    for k, r in enumerate(rs): d.ellipse((p[0] - r, p[1] - r * 0.6, p[0] + r, p[1] + r * 0.6), outline=col[:3] + (255 - k * 70,), width=4 - k)

def sound(d, cx, cy, col, n=3):
    for k in range(n): d.arc((cx - 14 - k * 12, cy - 14 - k * 12, cx + 14 + k * 12, cy + 14 + k * 12), -50, 50, fill=col, width=4)

def draw5(k):
    src = os.path.join(D, 'm%02d%s.png' % (k, SUF))
    if not os.path.exists(src): return
    im = Image.open(src).convert('RGBA').resize((W, H), Image.LANCZOS)
    jp = os.path.join(D, 'm%02d.json' % k)
    pts = json.load(open(jp)) if os.path.exists(jp) else {}
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x = W - 336
    if k == 6:
        base(d, 6, 96); panel(d, (x, 16, W - 16, 210))
        bar(d, x + 18, 30, 284, 'ORGAN', '4,2 °C', 0.8, GRN); bar(d, x + 18, 88, 284, 'SPREMSTVO', '38 m', 0.6, BLU)
        text(d, (x + 18, 152), 'BOLNIŠNICA', F(B, 17), MUT); text(d, (W - 34, 150), '9,6 km', F(B, 22), FG, 'ra')
        if 'policija' in pts: pin(d, pts['policija'], 'POLICIJA', BLU, 'promet se umika', dx=110)
        hint(d, 'Drži se policije: avti pred njo zapeljejo na rob in ustavijo')
    if k == 45:
        base(d, k, 14)
        if 'razgled' in pts: pin(d, pts['razgled'], 'RAZGLED', GRN, 'ustavi tukaj', dx=60)
        panel(d, (x, 16, W - 16, 330))
        text(d, (x + 18, 26), 'OVINEK', F(B, 17), MUT)
        ox, oy = x + 160, 150
        d.arc((ox - 110, oy - 80, ox + 70, oy + 80), 270, 90, fill=(255, 255, 255, 70), width=34)
        d.arc((ox - 110, oy - 80, ox + 70, oy + 80), 270, 90, fill=GRN, width=3)
        d.line((ox - 20, oy - 52, ox + 34, oy - 30, ox + 46, oy + 10), fill=RED, width=3)
        for (cx_, cy_, c) in ((ox + 2, oy + 75, FG), (ox + 40, oy + 52, FG), (ox + 58, oy + 12, FG), (ox + 40, oy - 30, RED)):
            d.rounded_rectangle((cx_ - 9, cy_ - 9, cx_ + 9, cy_ + 9), 3, fill=c)
        row(d, x, 250, 'POTNIKI', '38'); row(d, x, 288, 'ZADNJI', 'reže ovinek', RED)
        hint(d, 'Zavij široko: zadnji vagonček reže ovinek in zadene robnik')
    if k == 46:
        base(d, k, 18)
        if 'portal' in pts: pin(d, pts['portal'], 'PREDOR', RED, '5 ljudi v dimu')
        panel(d, (x, 16, W - 16, 252))
        bar(d, x + 18, 30, 284, 'VIDLJIVOST V DIMU', '6 m', 0.15, RED, True)
        bar(d, x + 18, 88, 284, 'ZRAK V JEKLENKAH', 'še 9 min', 0.6, BLU)
        row(d, x, 154, 'REŠENI', '2 / 5', GRN); row(d, x, 194, 'DO OGNJA', '320 m', ACC)
        btn(d, W - 90, H - 90, 60, 'GASI', (196, 22, 28, 235), 22)
        hint(d, 'V dimu sledi utripalkam ujetih avtov, ljudi naloži, nato pogasi ogenj')
    if k == 47:
        base(d, k, 22)
        if 'jezerce' in pts: pin(d, pts['jezerce'], 'JEZERCE', BLU, 'natoči vodo')
        if 'hisa' in pts: pin(d, pts['hisa'], 'KMETIJA', GRN, 'še cela')
        panel(d, (x, 16, W - 16, 240))
        bar(d, x + 18, 30, 284, 'VODA', '2.100 l', 0.52, BLU)
        row(d, x, 96, 'OGENJ DO HIŠE', '140 m', RED)
        text(d, (x + 18, 136), 'VETER', F(B, 17), MUT); arrow(d, x + 150, 146, 150, 52, ACC, 8); text(d, (W - 34, 134), '35 km/h', F(B, 22), FG, 'ra')
        row(d, x, 196, 'POGAŠENO', '38 %', GRN)
        btn(d, W - 90, H - 90, 60, 'GASI', (196, 22, 28, 235), 22)
        hint(d, 'Gasi rob ognja ob cesti; ko zmanjka vode, jo natoči v jezercu')
    if k == 48:
        base(d, k, 14)
        if 'kmetija' in pts: pin(d, pts['kmetija'], 'ŠE 4 LJUDJE', YEL, 'čakajo na kmetiji')
        panel(d, (x, 16, W - 16, 230))
        bar(d, x + 18, 30, 284, 'VODA DO MOSTU', '45 cm', 0.7, RED, True)
        row(d, x, 96, 'EVAKUIRANI', '5 / 9', GRN); row(d, x, 136, 'MOST ZDRŽI', 'še 03:40', YEL); row(d, x, 176, 'PLAVJE', 'udarja ob most', ACC)
        hint(d, 'Čez most pelji počasi in po sredini; plavje udarja ob opornice')
    if k == 49:
        base(d, k, 0)
        if 'kabina' in pts: pin(d, pts['kabina'], 'KABINA 6', YEL, '2 osebi', dx=-150)
        panel(d, (x, 16, W - 16, 268))
        text(d, (x + 18, 26), 'LESTEV', F(B, 17), MUT)
        row(d, x, 56, 'DOLŽINA', '28,4 m'); row(d, x, 94, 'KOT', '66°')
        bar(d, x + 18, 128, 284, 'NIHANJE KOŠA', 'vetrovno', 0.45, YEL)
        row(d, x, 190, 'REŠENI', '6 / 16', GRN); row(d, x, 228, 'V KOŠU', '2 / 3')
        pill_btn(d, W - 236, H - 176, W - 26, H - 122, 'DVIGNI', (31, 79, 168, 235)); pill_btn(d, W - 236, H - 110, W - 26, H - 56, 'IZTEGNI', (31, 79, 168, 235))
        hint(d, 'Lestev dvigni in iztegni počasi: v vetru se koš ziblje')
    if k == 50:
        base(d, k, 24)
        if 'pasa' in pts: pin(d, pts['pasa'], 'PAŠA', GRN, 'lipa v cvetu')
        panel(d, (x, 16, W - 16, 236))
        text(d, (x + 18, 26), 'ČEBELE', F(B, 17), MUT)
        face(d, x + 38, 78, 17, 1, GRN); bar(d, x + 76, 52, 226, '', 'mirne', 0.85, GRN)
        row(d, x, 116, 'SUNKI', '1', YEL); row(d, x, 154, 'DO PAŠE', '2,1 km'); row(d, x, 192, 'SONCE ZAIDE', 'čez 9 min', ACC)
        hint(d, 'Pelji mehko: vsak sunek razburi čebele, zato luknje obvozi')
    if k == 51:
        base(d, k, 12)
        if 'most' in pts: pin(d, pts['most'], 'MOST 5,0 m', YEL)
        panel(d, (x, 16, W - 16, 252))
        row(d, x, 30, 'VIŠINA TOVORA', '4,9 m'); row(d, x, 70, 'POD MOSTOM', '5,0 m')
        bar(d, x + 18, 108, 284, 'PROSTOR', '10 cm', 0.12, YEL, True)
        row(d, x, 174, 'DINOZAVER', '100 %', GRN); row(d, x, 212, 'VEJE', 'nizko levo', ACC)
        pill_btn(d, W - 316, H - 110, W - 26, H - 50, 'SPUSTI PODVOZJE', (31, 79, 168, 235))
        hint(d, 'Pred mostom spusti podvozje, pod vejami pelji po sredini ceste')
    if k == 52:
        base(d, k, 16)
        if 'most' in pts: pin(d, pts['most'], 'MOST', ACC, 'po sredini, počasi', dx=-210)
        panel(d, (x, 16, W - 16, 274))
        row(d, x, 30, 'ŠIRINA TOVORA', '4,8 m'); row(d, x, 70, 'CESTA', '7,0 m')
        text(d, (x + 18, 110), 'PROSTOR OB STRANEH', F(B, 17), MUT)
        cx = x + 160
        d.rectangle((cx - 90, 140, cx + 90, 210), fill=(70, 74, 80, 255)); d.rectangle((cx - 62, 150, cx + 70, 200), fill=(185, 201, 214, 255))
        text(d, (cx - 112, 175), '0,4', F(B, 18), YEL, 'mm'); text(d, (cx + 112, 175), '0,9', F(B, 18), GRN, 'mm')
        row(d, x, 232, 'PROMET ČAKA', '4 vozila', ACC)
        hint(d, 'Spremljevalni avto ustavlja promet; most prevozi po sredini')
    if k == 53:
        base(d, k, 12)
        if 'tovornjak' in pts: pin(d, pts['tovornjak'], 'ZDRSNIL', RED, 'brez verig')
        if 'galerija' in pts: pin(d, pts['galerija'], 'GALERIJA', ACC)
        panel(d, (x, 16, W - 16, 296))
        text(d, (x + 18, 26), 'VERIGE', F(B, 17), MUT); text(d, (W - 34, 24), '4 / 4', F(B, 22), GRN, 'ra')
        bx = x + 160; d.rounded_rectangle((bx - 30, 60, bx + 30, 136), 8, outline=FG, width=2)
        for (wy, ch) in ((70, True), (112, True), (126, False)):
            for s in (-1, 1):
                c = GRN if ch else (255, 255, 255, 90); d.rounded_rectangle((bx + s * 38 - 7, wy - 8, bx + s * 38 + 7, wy + 8), 3, fill=c)
                if ch:
                    for j in range(3): d.line((bx + s * 38 - 7, wy - 8 + j * 6, bx + s * 38 + 7, wy - 4 + j * 6), fill=(18, 22, 28, 255), width=2)
        bar(d, x + 18, 150, 284, 'OPRIJEM', '72 %', 0.72, GRN)
        row(d, x, 214, 'ZAPORA', 'čez 18 min', RED); row(d, x, 252, 'POTNIKI', '46')
        hint(d, 'Na snegu vozi enakomerno: sunek plina zavrti kolesa tudi z verigami')
    if k == 54:
        base(d, k, 158)
        if 'igralec' in pts: pin(d, pts['igralec'], 'TI · 3.', ACC)
        d.rounded_rectangle((W / 2 - 128, 76, W / 2 + 128, 116), 20, fill=(196, 22, 28, 225)); text(d, (W / 2, 96), 'OMEJEVALNIK 160', F(B, 20), FG, 'mm')
        panel(d, (x, 16, W - 16, 322))
        row(d, x, 30, 'POLOŽAJ', '3 / 8'); row(d, x, 68, 'KROG', '2 / 4')
        gauge(d, x + 160, 200, 68, 0.78, 'ZAVORE', '610 °C', 0.75)
        bar(d, x + 18, 256, 284, 'VODA ZA HLAJENJE', '55 %', 0.55, BLU)
        btn(d, W - 90, H - 90, 60, 'VODA', (31, 79, 168, 235), 22)
        hint(d, 'Pred ovinkom zaviraj zgodaj in zavore ohladi z vodo')
    if k == 55:
        base(d, k, 8)
        if 'medvedi' in pts: pin(d, pts['medvedi'], 'MEDVEDKA Z MLADIČEMA', ACC, 'ne bližje kot 25 m')
        panel(d, (x, 16, W - 16, 232))
        row(d, x, 30, 'MEDVEDI', 'mirni', GRN)
        bar(d, x + 18, 68, 284, 'RAZDALJA', '32 m', 0.64, GRN)
        row(d, x, 134, 'TURISTI ZUNAJ', '3', RED); row(d, x, 174, 'ZASTOJ', '7 vozil', YEL)
        pill_btn(d, W - 236, H - 196, W - 26, H - 142, 'MEGAFON', (31, 79, 168, 235)); btn(d, W - 90, H - 82, 46, 'HUPA', (240, 122, 18, 235), 18)
        hint(d, 'Z megafonom pošlji turiste v avte, nato medvede s hupo počasi odženi')
    # ---- 29: kako vržeš darilo
    if 291 <= k <= 294:
        f = k - 290; base(d, 29, {1: 32, 2: 24, 3: 22, 4: 20}[f])
        step(d, f, {1: 'PRIBLIŽAJ SE', 2: 'DRŽI VRZI', 3: 'SPUSTI', 4: 'ZADETEK'}[f])
        if 'tarca' in pts and f in (1, 2, 3):
            tx, ty = P(pts, 'tarca'); text(d, (tx, ty - 34), 'ZLATI KROG', F(B, 16), YEL, 'mm')
        if f == 1 and 'tarca' in pts: pin(d, pts['tarca'], 'HIŠA Z LUČKAMI', YEL, '34 m pred tabo', dx=-40)
        if f in (2, 3) and 'arc' in pts:
            A = [(p[0] * W, p[1] * H) for p in pts['arc']]
            if f == 3: A = A[:15]
            dots(d, A, (255, 240, 170, 235) if f == 2 else (255, 240, 170, 120), 4, 18)
        if f == 2 and 'pika' in pts:
            px, py = P(pts, 'pika'); d.ellipse((px - 12, py - 7, px + 12, py + 7), outline=FG, width=3)
            text(d, (px + 70, py + 22), 'TU PADE', F(B, 16), FG, 'mm')
        if f == 3 and 'darilo' in pts: ping(d, P(pts, 'darilo'), (255, 240, 170, 255), (20, 34))
        if f == 4 and 'darilo' in pts:
            gx, gy = P(pts, 'darilo'); outlined(d, (gx, gy - 70), '+1', F(B, 52), YEL); outlined(d, (gx, gy - 26), 'ZADETEK · +100', F(B, 22), FG)
        panel(d, (x, 16, W - 16, 196))
        row(d, x, 30, 'DARILA', '%d / 12' % (7 if f < 4 else 8), FG)
        for i in range(12): gift(d, x + 18 + (i % 6) * 48, 70 + (i // 6) * 44, 34, i < (7 if f < 4 else 8))
        row(d, x, 160, 'ZADETKI V KROG', '%d' % (6 if f < 4 else 7), GRN)
        if f == 2:
            mx, my0, my1 = W - 182, H - 196, H - 40
            d.rounded_rectangle((mx - 14, my0, mx + 14, my1), 10, fill=(14, 18, 24, 200))
            hh = (my1 - my0 - 8) * 0.62; d.rounded_rectangle((mx - 10, my1 - 4 - hh, mx + 10, my1 - 4), 8, fill=YEL)
            text(d, (mx, my0 - 16), 'MOČ', F(B, 15), FG, 'mm')
        pressed = f == 2
        if pressed: d.ellipse((W - 162, H - 162, W - 18, H - 18), outline=YEL, width=6)
        btn(d, W - 90, H - 90, 60, 'VRZI', (196, 22, 28, 235) if f != 1 else (110, 30, 34, 200))
        hint(d, {1: 'Hiše z lučkami čakajo na darilo: zlati krog je pred vrati',
                 2: 'Dlje držiš VRZI, dlje leti. Ko je pika v krogu, spusti',
                 3: 'Darilo leti po loku tja, kjer je bila pika; ti vozi naprej',
                 4: 'V krogu je zadetek; darilo zunaj kroga ostane v snegu'}[f])
    # ---- 35: kako iščeš plavalca
    if 351 <= k <= 354:
        f = k - 350; base(d, 35, {1: 0, 2: 26, 3: 34, 4: 18}[f])
        step(d, f, {1: 'ALARM', 2: 'DO VODE', 3: 'IŠČI', 4: 'REŠEN'}[f], ACC if f < 4 else GRN)
        if f in (1, 2) and 'obmocje' in pts: pin(d, pts['obmocje'], 'ZADNJIČ VIDEN', RED, 'krog iskanja 40 m')
        if f == 1 and 'opazovalec' in pts and 'obmocje' in pts:
            a = P(pts, 'opazovalec'); b_ = P(pts, 'obmocje'); dots(d, [a, b_], (255, 120, 100, 230), 4, 16)
            pin_below(d, pts['opazovalec'], 'REŠEVALEC KAŽE SMER', ACC)
        if f == 2 and 'skuter' in pts: pin_below(d, pts['skuter'], 'SKUTER', BLU, 'presedi tukaj', dx=90)
        if f == 3 and 'plavalec' in pts:
            sp_ = P(pts, 'plavalec'); ping(d, sp_, RED); outlined(d, (sp_[0], sp_[1] - 44), 'VIDEN!', F(B, 22), RED); sound(d, sp_[0] + 52, sp_[1] - 8, YEL)
        if f == 4 and 'plavalec' in pts: pin(d, pts['plavalec'], 'NA SANEH', GRN, 'nazaj na obalo')
        if f in (3, 4):
            ix, iy, iw, ih = inset(im, d, k)
            text(d, (ix + 14, iy + ih - 26), 'POGLED Z VOZILA', F(B, 15), FG)
            py0 = iy + ih + 12
        else: py0 = 16
        pnl_h = 150
        panel(d, (x, py0, W - 16, py0 + pnl_h))
        if f in (1, 2): row(d, x, py0 + 14, 'PLAVALEC', '~70 m'); bar(d, x + 18, py0 + 54, 284, 'MOČ PLAVALCA', '%d %%' % (60 if f == 1 else 48), 0.6 if f == 1 else 0.48, RED, True)
        if f == 3: row(d, x, py0 + 14, 'PLAVALEC', '16 m'); bar(d, x + 18, py0 + 54, 284, 'MOČ PLAVALCA', '35 %', 0.35, RED, True)
        if f == 4: row(d, x, py0 + 14, 'DO OBALE', '58 m'); bar(d, x + 18, py0 + 54, 284, 'MOČ PLAVALCA', '35 %', 0.35, YEL)
        row(d, x, py0 + 116, 'VALOVI', '1,8 m', YEL)
        if f == 1:
            d.rounded_rectangle((W / 2 - 230, 128, W / 2 + 230, 164), 18, fill=(14, 18, 24, 200))
            d.rounded_rectangle((W / 2 - 226, 132, W / 2 - 4, 160), 14, fill=ACC); text(d, (W / 2 - 115, 146), 'ŠTIRIKOLESNIK', F(B, 16), (18, 22, 28, 255), 'mm')
            text(d, (W / 2 + 115, 146), 'SKUTER', F(B, 16), MUT, 'mm')
        if f == 2: pill_btn(d, W - 326, H - 110, W - 26, H - 50, 'PRESEDI NA SKUTER', (31, 79, 168, 235))
        if f == 3: pill_btn(d, W - 266, H - 110, W - 26, H - 50, 'VRZI OBROČ', (232, 69, 42, 235))
        hint(d, {1: 'Reševalec na stolpu pokaže, kje so plavalca nazadnje videli',
                 2: 'S štirikolesnikom pelji do vode, najbližje krogu, in presedi',
                 3: 'Plavalec se pokaže le na vrhu vala in zakliče; krog se zmanjša',
                 4: 'Ustavi ob plavalcu, ga potegni na sani in ga pripelji na obalo'}[f])
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, 'm%02d%s.jpg' % (k, SUF)), quality=90)

for k in [6, 45] + list(range(46, 56)) + [291, 292, 293, 294, 351, 352, 353, 354]: draw5(k)
for k, (t, track, goal, clock) in MIS.items():
    w = ImageDraw.Draw(Image.new('RGB', (10, 10))).textlength(goal, font=F(R, 15))
    if w > 430: print('PREDOLGO', k, int(w), goal)
print('hud5 ok')
