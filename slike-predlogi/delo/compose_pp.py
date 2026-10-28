# before / after sheets (19. 10.): the old sand gone, the white line all round (dashed only at openings), the top kerb, other fixes
import json
from PIL import Image, ImageDraw, ImageFont
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f1 = ImageFont.truetype(FB, 40); f2 = ImageFont.truetype(FR, 26); f3 = ImageFont.truetype(FB, 28)
W = 1800; G = 16
def pair(a, b, h, cap):
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB'); w = (W - 3 * G) // 2
    A = A.resize((w, round(A.height * w / A.width))); B = B.resize((w, round(B.height * w / B.width))); hh = max(A.height, B.height)
    im = Image.new('RGB', (W, hh + 50), 'white'); d = ImageDraw.Draw(im); d.text((G, 6), cap, fill=(30, 30, 30), font=f2)
    im.paste(A, (G, 46)); im.paste(B, (2 * G + w, 46))
    for x0, t, c in ((G, 'PREJ', (190, 40, 40)), (2 * G + w, 'POTEM', (30, 140, 60))):
        d.rectangle([x0 + 8, 54, x0 + 150, 96], fill=c); d.text((x0 + 18, 58), t, fill='white', font=f3)
    return im
def sheet(name, title, sub, rows):
    parts = [pair(*r) for r in rows]; H = 170 + sum(p.height + G for p in parts)
    S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((G, 20), title, fill=(20, 20, 20), font=f1)
    y = 80
    for line in sub: d.text((G, y), line, fill=(60, 60, 60), font=f2); y += 34
    y = 170
    for p in parts: S.paste(p, (0, y)); y += p.height + G
    S.save('vse28-prej-potem/' + name, quality=90); print(name, S.size)
sheet('38-1-stari-pesek.jpg', '1  Stari pesek ob mali progi – zbrisan', ['Zobčasti pesek ob asfaltu na notranji strani (tvoj obris), pas peska ob parkirišču, pesek pri priključku', 'in stari pesek v notranjosti so zbrisani po celem krogu.'], [
    ('sh-ni6-nw-base.png', 'sh-fin-A-spotNW.png', 0, 'Mesto, ki si ga obkrožil (severozahodni ovinek, notranja stran) – blizu'),
    ('sh-ni6-ea-base.png', 'sh-fin-A-spotE.png', 0, 'Vzhodna ravnina, notranja stran ob rdeče-belem robniku – blizu'),
    ('sh-v4-A-se.png', 'sh-fin-A-se.png', 0, 'Jugovzhodni ovinek ob parkirišču: pas starega peska zbrisan'),
    ('sh-v4-A-lot.png', 'sh-fin-A-lot.png', 0, 'Južna ravnina: pesek pri priključku in stare lise v notranjosti zbrisani')])
sheet('38-2-bela-crta-robnik.jpg', '2  Bela črta ves čas ob progi, robnik zgoraj', ['Bela črta teče ob obeh robovih cele proge, tudi ob robnikih; črtkana je samo tam, kjer se priključi druga cesta,', 'pas ali odprto parkirišče. Zgoraj (severna ravnina, zunanja stran) je dodan manjkajoči robnik.'], [
    ('sh-v4-A-iso.png', 'sh-fin-A-iso.png', 0, 'Izometrična kamera ob plaži (tvoja slika): črta zdaj tudi na notranji strani'),
    ('sh-v4-A-nw.png', 'sh-fin-A-nw.png', 0, 'Severozahodni ovinek: robnik zgoraj dodan, črta na obeh straneh, brez peska'),
    ('sh-v4-A-ne.png', 'sh-fin-A-ne.png', 0, 'Severna ravnina ob plaži: robnik brez vrzeli, črta ob robniku'),
    ('sh-v4-A-east.png', 'sh-fin-A-east.png', 0, 'Vzhodna ravnina: črta ob rdeče-belem robniku')])
sheet('38-3-druge-nepravilnosti.jpg', '3  Druge nepravilnosti', ['Notranjost nagnjenega ovinka na jugozahodu: namesto peska, lis in luknjic trava. Zobčasti pesek, ki je segal na asfalt,', 'je zbrisan tudi na zunanji strani.'], [
    ('sh-v4-A-sw.png', 'sh-fin-A-sw.png', 0, 'Jugozahodni nagnjeni ovinek: notranjost'),
    ('sh-lp-P23.png', 'sh-fin-L23.png', 0, 'Zahodni rob ob prehodu za motokros'),
    ('sh-lp-P13.png', 'sh-fin-L13.png', 0, 'Vzhodna ravnina, notranja stran')])
sheet('38-4-cela-proga.jpg', '4  Cela mala proga od zgoraj', ['Levo kot je bila, desno po vseh popravkih (različica 1 roba).'], [
    ('sh-v4-A-all.png', 'sh-fin-A-all.png', 0, 'Cela mala proga'),
    ('sh-v4-A-chase.png', 'sh-fin-A-chase.png', 0, 'Kamera za avtom')])
# the three edge versions after the fixes
w3 = (W - 4 * G) // 3; ims = [Image.open('sh-fin-%s-all.png' % v).convert('RGB').resize((w3, w3)) for v in 'ABC']
ch = [Image.open('sh-fin-%s-iso.png' % v).convert('RGB') for v in 'ABC']; ch = [c.resize((w3, round(c.height * w3 / c.width))) for c in ch]
S = Image.new('RGB', (W, 140 + w3 + ch[0].height + 3 * G + 60), 'white'); d = ImageDraw.Draw(S)
d.text((G, 20), '5  Tri različice roba – po popravkih (izbira je še odprta)', fill=(20, 20, 20), font=f1)
for i, (t, a, c) in enumerate(zip(('1 kot originalna Toskana', '2 širši rob', '3 robnik povsod'), ims, ch)):
    x = G + i * (w3 + G); d.text((x, 90), t, fill=(30, 30, 30), font=f3); S.paste(a, (x, 140)); S.paste(c, (x, 140 + w3 + G))
S.save('vse28-prej-potem/38-5-tri-razlicice.jpg', quality=90); print('38-5', S.size)
