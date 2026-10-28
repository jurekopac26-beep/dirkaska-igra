# 27. 10., the user: 6 boat tracks along the old go-kart line (instead of the lagoon with two islands); one sheet per version + an overview sheet
import os
from PIL import Image, ImageDraw, ImageFont
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
OUT = SP + 'vse39-proge-za-colne/'; os.makedirs(OUT, exist_ok=True); TAG = 'bv5'
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
    ('Reka', 'Reka, široka 10 m, gre po črti stare steze za gokarte: osmica s križiščem pod leseno brvjo. Travnati bregovi z ozkim peščenim robom, boje na ovinkih (rdeče znotraj, rumene zunaj), start s šahovnico in lesenim pomolom.'),
    ('Široka proga s plažami', 'Proga je široka 17 m, na obeh bregovih je peščena plaža s senčniki in ležalniki. Po vodi tečeta dve vrsti rdeče-belih plovcev, ki progo delita na pasove.'),
    ('Kanal z zidovi', 'Kanal, širok 11 m, z betonskimi zidovi in belo obrobo, na zidu so gume za privez. Ob startu sta plavajoči pomol s štartnimi mesti in časovni stolp.'),
    ('Reka s skakalnicami in vrati', 'Reka, široka 13 m. Po vsej progi so plavajoče skakalnice (rumeno-črne) in napihljiva vrata v rdeči, rumeni in modri barvi.'),
    ('Divja reka', 'Širina se menja od 8 do 16 m, kot pri pravi reki. Ob ožinah so skale, ob bregovih trstičje, na travi palme.'),
    ('Vodni krog z robniki', 'Proga je široka 12 m, na obeh bregovih so rdeče-beli robniki kot na dirkališču. Nad startom je portal s šahovnico, ob startu tribuna.'),
]
COMMON = 'Laguna z otokoma je spet travnik. Voda je na vzhodu povezana s kanalom do morja, lesena brv in pomol HOME ostaneta.'
for k, (name, txt) in enumerate(V):
    allim = sh('all%d' % k); st = sh('start%d' % k); iso = sh('iso%d' % k); ch = sh('chase%d' % k)
    h2 = 452; st2 = st.resize((round(st.size[0] * h2 / st.size[1]), h2)); iso2 = iso.resize((round(iso.size[0] * h2 / iso.size[1]), h2)); ch2 = ch.resize((round(ch.size[0] * h2 / ch.size[1]), h2))
    d0 = ImageDraw.Draw(Image.new('RGB', (10, 10))); lines = wrap(d0, txt + ' ' + COMMON, F(R, 30), W - 2 * G)
    top = 30 + 64 + len(lines) * 40 + 20
    S = Image.new('RGB', (W, top + 450 + 40 + 44 + h2 + 60), 'white'); d = ImageDraw.Draw(S)
    d.text((G, 24), '%d  Proga za čolne: %s' % (k + 1, name), font=F(B, 52), fill=(20, 20, 20)); y = 96
    for ln in lines: d.text((G, y), ln, font=F(R, 30), fill=(60, 60, 60)); y += 40
    d.text((G, top - 6), 'Od zgoraj, cela proga (sever zgoraj)', font=F(R, 28), fill=(30, 30, 30)); S.paste(allim.resize((W, 450)), (0, top + 30))
    y2 = top + 30 + 450 + 24; x = G
    for im, cap in ((st2, 'Start od zgoraj'), (iso2, 'Izometrična kamera'), (ch2, 'Kamera za avtom')):
        d.text((x, y2), cap, font=F(R, 28), fill=(30, 30, 30)); S.paste(im, (x, y2 + 40)); x += im.size[0] + 12
    S.save(OUT + '48-%d-proga-za-colne-%s.jpg' % (k + 1, name.lower().replace(' ', '-').replace('š', 's').replace('č', 'c').replace('ž', 'z')), quality=90)
# the overview: the six from above, one under the other
S = Image.new('RGB', (W, 110 + 6 * (450 + 60)), 'white'); d = ImageDraw.Draw(S); d.text((G, 24), '0  Šest prog za čolne po črti stare steze za gokarte', font=F(B, 52), fill=(20, 20, 20))
for k, (name, _) in enumerate(V):
    y = 110 + k * 510; d.text((G, y), '%d  %s' % (k + 1, name), font=F(B, 32), fill=(30, 30, 30)); S.paste(sh('all%d' % k).resize((W, 450)), (0, y + 46))
S.save(OUT + '48-0-sest-prog-za-colne.jpg', quality=88)
print(sorted(os.listdir(OUT)))
