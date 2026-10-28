# 27. 10., the user: "Naredi celo novo mapo v 15 slikah od zgoraj" - the whole map in 15 equal parts (3 across, 5 down), each with its number,
# where it lies, what is on it and a small map with its frame; and an index (kazalo) with the 15 frames numbered on the whole map
import os
from PIL import Image, ImageDraw, ImageFont
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
OUT = SP + 'vse38-cela-mapa-15/'; os.makedirs(OUT, exist_ok=True); TAG = 'map15'
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
sh = lambda n: Image.open(SP + 'sh-%s-%s.png' % (TAG, n)).convert('RGB')
def wrap(d, text, font, w):
    out, line = [], ''
    for word in text.split():
        t = (line + ' ' + word).strip()
        if d.textlength(t, font=font) <= w: line = t
        else: out.append(line); line = word
    if line: out.append(line)
    return out
X0, Z0, TW, TH = -370.0, -410.0, 740.0 / 3, 740.0 / 5
HW, HH = 152 * 1500 / 900 / 2, 152 / 2   # (each shot: 152 m high, 253 m wide - a little more than its part, so the parts overlap a bit)
TILES = [(X0 + TW * (i + 0.5), Z0 + TH * (j + 0.5)) for j in range(5) for i in range(3)]
ROW = ['čisto zgoraj', 'zgoraj', 'na sredini', 'spodaj', 'čisto spodaj']; COL = ['levo', 'na sredini', 'desno']
POS = ['%s, %s' % (ROW[k // 3], COL[k % 3]) if not (k // 3 == 2 and k % 3 == 1) else 'sredina mape' for k in range(15)]
NAMES = [
    'SZ vogal: stara kmetija (hlev, silosa, hiša, njive, živali za ograjo), makadam ob severnem robu mape, krožna cesta z rdeče-belimi robniki in mivko ob ovinku.',
    'Nova kmetija ob morju: hiši in silosa, njiva z balami in traktorjem, pašnika s kravami in ovcami, ribnik; makadam do kmetije, krožna cesta ob gozdu, plaža in pomol s čolnom.',
    'Velik otok s palmami, lesenim pomolom in svetilnikom na severnem rtu; morje do roba mape.',
    'Motokros (zavoji, skoki, valovi), krožna cesta pred tunelom pod hribom, makadamske poti, spodaj zasnežen vrh hriba.',
    'Sever manjšega dirkališča: lunapark z vulkanom (teče samo lava), stolp za prosti pad, krožišči, vrtiljaki in vlakec; na zahodu gozd in makadam, na vzhodu plaža.',
    'Plaža s senčniki in palmami, morje z otočki in vrstama boj.',
    'Motokros, izhod krožne ceste iz tunela, zasnežen hrib z gondolo, makadam proti jugu.',
    'Sredina manjšega dirkališča: lunapark (ribnik, krožišče z vodnjakom, panoramsko kolo, vrtiljaki), rdeča in modra garaža ob progi, makadam na zahodu.',
    'Plaža, morje z otočki in bojami.',
    'Krožna cesta na zahodu, gozd, makadam, zahodni polkrožni zavoj manjšega dirkališča in rob reševalne baze.',
    'Reševalna baza: helidrom z rdečim helikopterjem, stavba z rdečim križem in rešilci; veliko parkirišče z avtošolo, garaže ob glavni ravnini, most za pešce, spodaj laguna.',
    'Vzhodni rob parkirišča z JV vogalom, ovinek manjšega dirkališča ob plaži, plaža s senčniki, morje z otoki in bojami.',
    'Gradbišče na JZ (žerjav, bagra, buldožer, tovornjak, ploščad za stavbo), esovki krožne ceste z rdeče-belimi robniki, zahodni del lagune.',
    'Laguna z dvema otočkoma, jet-skiji in lesenim mostom; esovki krožne ceste na jugu z mivko ob progi. Svetla lisa na vodi levo je odsev sonca.',
    'Nagnjen ovinek ob morju na JV (kot Karussell), plaža, morje do roba mape.',
]
m0 = sh('M00'); S0 = 740.0
def px(x, z): return (600 + x * 1200 / S0, 600 + (z + 40) * 1200 / S0)
# the index: the whole map with the 15 frames numbered
ov = m0.copy(); d = ImageDraw.Draw(ov)
for k, (cx, cz) in enumerate(TILES):
    a, b = px(cx - TW / 2, cz - TH / 2), px(cx + TW / 2, cz + TH / 2); d.rectangle([a[0], a[1], b[0], b[1]], outline=(255, 214, 64), width=3)
    c = px(cx, cz); d.ellipse([c[0] - 26, c[1] - 26, c[0] + 26, c[1] + 26], fill=(0, 0, 0)); t = str(k + 1); f = F(B, 30); d.text((c[0] - d.textlength(t, font=f) / 2, c[1] - 19), t, font=f, fill=(255, 214, 64))
can = Image.new('RGB', (1200, 1310), (24, 26, 30)); can.paste(ov, (0, 0)); d = ImageDraw.Draw(can)
d.text((24, 1218), 'Kazalo · cela nova mapa', font=F(B, 44), fill=(255, 214, 64)); d.text((24, 1270), 'rumeni okvirji: slike 1–15 (številka = slika); sever je zgoraj', font=F(R, 26), fill=(220, 224, 230))
can.save(OUT + '00-kazalo-cela-mapa.jpg', quality=90)
# the 15 parts
th0 = m0.resize((250, 250)); k2 = 250 / 1200
for k, (cx, cz) in enumerate(TILES):
    im = sh('T%02d' % (k + 1)); can = Image.new('RGB', (1500, 1180), (24, 26, 30)); can.paste(im, (0, 0)); d = ImageDraw.Draw(can)
    ttl = 'Mapa %d/15' % (k + 1); d.text((24, 918), ttl, font=F(B, 50), fill=(255, 214, 64)); d.text((24 + d.textlength(ttl, font=F(B, 50)) + 30, 930), POS[k], font=F(B, 36), fill=(255, 255, 255)); yy = 1000
    for ln in wrap(d, NAMES[k], F(R, 30), 1150): d.text((24, yy), ln, font=F(R, 30), fill=(210, 214, 220)); yy += 40
    assert yy <= 1170, (k, yy)
    th = th0.copy(); td = ImageDraw.Draw(th); a, b = px(cx - HW, cz - HH), px(cx + HW, cz + HH)
    td.rectangle([a[0] * k2, a[1] * k2, b[0] * k2, b[1] * k2], outline=(255, 40, 40), width=3); td.rectangle([0, 0, 249, 249], outline=(255, 255, 255), width=2)
    can.paste(th, (1500 - 262, 912)); can.save(OUT + '%02d-mapa-%s.jpg' % (k + 1, POS[k].replace(', ', '-').replace(' ', '-')), quality=90)
print(sorted(os.listdir(OUT)))
