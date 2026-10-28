# before / after of the marks of 22. 10. (vse35-oznake-22-10): before = fresh restore without the day's pages (fn40b), after = with them (fn40a)
import os
src = open('compose_pp.py').read(); src = src[:src.find("sheet('38-1-stari-pesek.jpg'")]
ns = {}; exec(src, ns); sheet = ns['sheet']; W = ns['W']; G = ns['G']; f1 = ns['f1']; f2 = ns['f2']; f3 = ns['f3']
from PIL import Image, ImageDraw
OUT = 'vse35-oznake-22-10'; os.makedirs(OUT, exist_ok=True)
_d = ImageDraw.Draw(Image.new('RGB', (10, 10)))
def wrap(text, width=W - 2 * G - 10):   # (the subtitle split into lines that fit the sheet)
    out, cur = [], ''
    for w_ in text.split(' '):
        t = (cur + ' ' + w_).strip()
        if _d.textlength(t, font=f2) > width and cur: out.append(cur); cur = w_
        else: cur = t
    if cur: out.append(cur)
    return out
def crop(src, dst, cx, cz, span, x0, x1, z0, z1):
    im = Image.open(src).convert('RGB'); ppm = im.size[0] / span; L = cx - span / 2; T = cz - span / 2
    im.crop((int((x0 - L) * ppm), int((z0 - T) * ppm), int((x1 - L) * ppm), int((z1 - T) * ppm))).save(dst)
def sheet8(name, title, sub, rows):
    L = wrap(' '.join(sub)); assert len(L) <= 2, (name, L)
    sheet(name, title, L, rows); os.replace('vse28-prej-potem/' + name, OUT + '/' + name)
B = lambda n: 'sh-fn40b-%s.png' % n
A = lambda n: 'sh-fn41a-%s.png' % n
def cams(name, title, sub, pairs):
    sub = wrap(' '.join(sub))
    w = (W - 5 * G) // 4; hh = round(w * 960 / 540); S = Image.new('RGB', (W, 170 + ((len(pairs) + 1) // 2) * (hh + 110)), 'white'); d = ImageDraw.Draw(S)
    d.text((G, 20), title, fill=(20, 20, 20), font=f1); y = 80
    for line in sub: d.text((G, y), line, fill=(60, 60, 60), font=f2); y += 34
    y = 170
    for i in range(0, len(pairs), 2):
        for k, (a, b, cap) in enumerate(pairs[i:i + 2]):
            x = G + k * 2 * (w + G); d.text((x, y), cap, fill=(30, 30, 30), font=f2)
            for j, (f, t, c) in enumerate(((a, 'PREJ', (190, 40, 40)), (b, 'POTEM', (30, 140, 60)))):
                im = Image.open(f).convert('RGB').resize((w, hh)); xx = x + j * (w + G); S.paste(im, (xx, y + 40))
                d.rectangle([xx + 8, y + 48, xx + 150, y + 90], fill=c); d.text((xx + 18, y + 52), t, fill='white', font=f3)
        y += hh + 110
    S.save(OUT + '/' + name, quality=90); print(name, S.size)
crop(B('jEnd'), 'pp8-jend-b.png', 152, 66, 40, 141, 165, 56, 80); crop(A('jEnd'), 'pp8-jend-a.png', 152, 66, 40, 141, 165, 56, 80)
sheet8('45-1-vogal-parkirisca.jpg', '1  Vogal parkirišča JV – stare sence zbrisane (list 44-1)', ['Sence odstranjenih palet, gum in bal so bile zapečene v staro barvo tal – zbrisane, z njimi zeleni šopi.', 'Zbrisani še rdeče-bel drobec robnika, modra črtica (skozi tla se je videlo morje) in črna guba v terakoti.'], [
    (B('lotc'), A('lotc'), 0, 'Vogal parkirišča JV'), (B('corner'), A('corner'), 0, 'Od blizu: terakota ob robniku'), ('pp8-jend-b.png', 'pp8-jend-a.png', 0, 'Konec pasu ob parkirišču')])
sheet8('45-2-helidrom-parkirisce.jpg', '2  Helidrom: desno od ceste vse parkirišče, cesti združeni (list 44-3)', ['Desno od ceste je vse parkirišče do roba ceste (brez šotora, zidu, ograje, stožcev, gum, sodov, ovir, trave in peska; svetilke ostanejo).', 'Na stiku s severno cesto ni več ograje, letve in ploščic – cesti loči samo črtkana črta.'], [
    (B('heli'), A('heli'), 0, 'Cesta med helidromom (levo) in parkiriščem (desno)'), (B('wedge'), A('wedge'), 0, 'Klin ob cesti od blizu'), (B('mouth'), A('mouth'), 0, 'Stik s severno cesto (modra oznaka)'), (B('heliW'), A('heliW'), 0, 'Širše')])
sheet8('45-3-izometricna.jpg', '3  Izometrična kamera (telefon ležeče)', ['Ista mesta s kamero, ki ostane v igri. Parkirišča so bila s to kamero zelena (moja plast trave je pri poševnem', 'pogledu prekrila asfalt) – zdaj so siva kot od zgoraj.'], [
    (B('hl-iso'), A('hl-iso'), 0, 'Cesta ob helidromu'), (B('mouth-iso'), A('mouth-iso'), 0, 'Stik s severno cesto'), (B('lotc-iso'), A('lotc-iso'), 0, 'Vogal parkirišča JV'), (B('jEnd-iso'), A('jEnd-iso'), 0, 'Konec pasu ob parkirišču')])
cams('45-4-kamera-za-avtom.jpg', '4  Kamera za avtom (telefon pokonci)', ['Ista mesta s kamero za avtom.'], [
    (B('wedge-chase'), A('wedge-chase'), 'Zavoj s severne ceste k helidromu'), (B('mouth-chase'), A('mouth-chase'), 'Severna cesta mimo stika'), (B('lotc-chase'), A('lotc-chase'), 'Ovinek ob vogalu parkirišča')])
