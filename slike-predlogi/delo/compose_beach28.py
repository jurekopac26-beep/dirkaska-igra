# 27. 10., the user: 6 boat tracks along the old go-kart line (instead of the lagoon with two islands); one sheet per version + an overview sheet
import os
from PIL import Image, ImageDraw, ImageFont
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
OUT = SP + 'vse40-plaze-6-verzij/'; os.makedirs(OUT, exist_ok=True); TAG = 'bb2'
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda p, s: ImageFont.truetype(p, s)
W, G = 1800, 18
sh = lambda n: Image.open(SP + 'sh-%s-%s.png' % (TAG, n)).convert('RGB')
def wrap(d, text, font, w):
    out, line = [], ''
    for word in text.split():
        t = (line + ' ' + word).strip()
        if d.textlength(t, font=font) <= w: line = t
        else: out.append(line); line = word
    if line: out.append(line)
    return out
V = [
    ('A Senčniki in dva pasova', 'Kot na prejšnjem listu: proga 17 m, na obeh bregovih 7 m mivke, senčniki in ležalniki, dve vrsti rdeče-belih plovcev delita progo na tri pasove.'),
    ('B Bela mivka in palme', 'Svetlejša, skoraj bela mivka (9 m), ob vodi plitvina, voda je tam svetlejša, turkizna. Namesto senčnikov palme, ena vrsta plovcev po sredini.'),
    ('C Plaža samo zunaj', 'Široka plaža (12 m) samo na zunanji strani zank, na notranji travnik do vode. Na plaži senčniki in rdeči stolpi za reševalce.'),
    ('D Promenada', 'Plaža 7 m, za njo lesena promenada ob vsej progi s svetilkami, z brega segajo v vodo kratki leseni pomoli.'),
    ('E Sipine', 'Mivka 10 m z nizkimi sipinami in šopi trave, za sipinami lesene letve kot ograja. Brez plovcev, samo boje na ovinkih.'),
    ('F Družinska plaža', 'Širša voda (22 m) s plitvim robom, tri vrste plovcev, na plaži senčniki, mreže za odbojko in pisane kabine, v vodi napihljivi obroči.'),
]
COMMON = 'Laguna z otokoma je spet travnik. Voda je na vzhodu povezana s kanalom do morja, lesena brv in pomol HOME ostaneta.'
for k, (name, txt) in enumerate(V):
    allim = sh('all%d' % k); st = sh('start%d' % k); iso = sh('iso%d' % k); ch = sh('chase%d' % k)
    h2 = 452; st2 = st.resize((round(st.size[0] * h2 / st.size[1]), h2)); iso2 = iso.resize((round(iso.size[0] * h2 / iso.size[1]), h2)); ch2 = ch.resize((round(ch.size[0] * h2 / ch.size[1]), h2))
    d0 = ImageDraw.Draw(Image.new('RGB', (10, 10))); lines = wrap(d0, txt + ' ' + COMMON, F(R, 30), W - 2 * G)
    top = 30 + 64 + len(lines) * 40 + 20
    S = Image.new('RGB', (W, top + 450 + 40 + 44 + h2 + 60), 'white'); d = ImageDraw.Draw(S)
    d.text((G, 24), '%d  Široka proga s plažami · %s' % (k + 1, name), font=F(B, 52), fill=(20, 20, 20)); y = 96
    for ln in lines: d.text((G, y), ln, font=F(R, 30), fill=(60, 60, 60)); y += 40
    d.text((G, top - 6), 'Od zgoraj, cela proga (sever zgoraj)', font=F(R, 28), fill=(30, 30, 30)); S.paste(allim.resize((W, 450)), (0, top + 30))
    y2 = top + 30 + 450 + 24; x = G
    for im, cap in ((st2, 'Start od zgoraj'), (iso2, 'Izometrična kamera'), (ch2, 'Kamera za avtom')):
        d.text((x, y2), cap, font=F(R, 28), fill=(30, 30, 30)); S.paste(im, (x, y2 + 40)); x += im.size[0] + 12
    S.save(OUT + '49-%d-plaze-%s.jpg' % (k + 1, name.lower().replace(' ', '-').replace('š', 's').replace('č', 'c').replace('ž', 'z')), quality=90)
# the overview: the six from above, one under the other
S = Image.new('RGB', (W, 110 + 6 * (450 + 60)), 'white'); d = ImageDraw.Draw(S); d.text((G, 24), '0  Široka proga s plažami v šestih verzijah', font=F(B, 52), fill=(20, 20, 20))
for k, (name, _) in enumerate(V):
    y = 110 + k * 510; d.text((G, y), '%d  %s' % (k + 1, name), font=F(B, 32), fill=(30, 30, 30)); S.paste(sh('all%d' % k).resize((W, 450)), (0, y + 46))
S.save(OUT + '49-0-plaze-6-verzij.jpg', quality=88)
print(sorted(os.listdir(OUT)))
