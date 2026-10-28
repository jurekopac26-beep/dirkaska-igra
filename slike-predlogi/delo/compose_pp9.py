# before / after of the red circles on sheet 45-1 (tyre marks by the SE lot corner): before = fn41a (the sheet's after), after = fn42c
import os
src = open('compose_pp8.py').read(); src = src[:src.find("crop(B('jEnd')")]
ns = {}; exec(src, ns)
for k in ('sheet8', 'cams', 'crop', 'wrap'): globals()[k] = ns[k]
ns['OUT'] = 'vse36-oznake-22-10b'; os.makedirs(ns['OUT'], exist_ok=True)
B = lambda n: 'sh-fn41a-%s.png' % n
A = lambda n: 'sh-fn42c-%s.png' % n
from PIL import Image, ImageDraw
W, G, f1, f2, f3 = ns['W'], ns['G'], ns['f1'], ns['f2'], ns['f3']
def cams1(name, title, sub, pairs):   # (one chase pair, larger and centred)
    w = 700; hh = round(w * 960 / 540); a, b, cap = pairs[0]; S = Image.new('RGB', (W, 230 + hh + 40), 'white'); d = ImageDraw.Draw(S)
    d.text((G, 20), title, fill=(20, 20, 20), font=f1); d.text((G, 80), ' '.join(sub), fill=(60, 60, 60), font=f2)
    x0 = (W - 2 * w - G) // 2; d.text((x0, 150), cap, fill=(30, 30, 30), font=f2)
    for j, (f, t, c) in enumerate(((a, 'PREJ', (190, 40, 40)), (b, 'POTEM', (30, 140, 60)))):
        im = Image.open(f).convert('RGB').resize((w, hh)); xx = x0 + j * (w + G); S.paste(im, (xx, 190))
        d.rectangle([xx + 8, 198, xx + 150, 240], fill=c); d.text((xx + 18, 202), t, fill='white', font=f3)
    S.save(ns['OUT'] + '/' + name, quality=90); print(name, S.size)
crop(B('jEnd'), 'pp9-jend-b.png', 152, 66, 40, 141, 165, 56, 80); crop(A('jEnd'), 'pp9-jend-a.png', 152, 66, 40, 141, 165, 56, 80)
sheet8('46-1-sledi-ob-vogalu.jpg', '1  Vogal parkirišča JV – temne sledi zbrisane (rdeči krogi na listu 45-1)', ['Zbrisane sledi gum in temne lise obrabe na asfaltu ob robniku, posvetljen še temen pas idealne linije.', 'Sledi pojenjajo mehko vzdolž vse vzhodne strani parkirišča; na drugih ovinkih ostanejo.'], [
    (B('lotc'), A('lotc'), 0, 'Vogal parkirišča JV'), (B('corner'), A('corner'), 0, 'Od blizu: asfalt ob robniku'), ('pp9-jend-b.png', 'pp9-jend-a.png', 0, 'Konec pasu ob parkirišču')])
sheet8('46-2-izometricna.jpg', '2  Izometrična kamera (telefon ležeče)', ['Isto mesto s kamero, ki ostane v igri.'], [
    (B('lotc-iso'), A('lotc-iso'), 0, 'Vogal parkirišča JV'), (B('jEnd-iso'), A('jEnd-iso'), 0, 'Konec pasu ob parkirišču')])
cams1('46-3-kamera-za-avtom.jpg', '3  Kamera za avtom (telefon pokonci)', ['Isto mesto s kamero za avtom.'], [
    (B('lotc-chase'), A('lotc-chase'), 'Ovinek ob vogalu parkirišča')])
