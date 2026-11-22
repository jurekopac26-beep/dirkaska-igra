"""Pari ZDAJ | POTEM za 27 avtov KOLIBRI (brez pilotnih treh): na avto ena slika, štiri vrstice (Visoki spredaj 34f, Visoki zadaj 34r,
po treh trkih na Spa, Belgija od blizu, isto s kamere za avtom), levo main, desno veja #480. Uporaba: python3 30-avtov/sestavi.py <prej> <potem> <izhod>"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

IMENA = [('ris', 'RIS G'), ('sokol', 'SOKOL R'), ('levs', 'LEV S'), ('orel', 'OREL GT3'), ('tornado', 'TORNADO V8'), ('kozorog', 'KOZOROG TC'),
         ('gozdar', 'GOZDAR'), ('tur', 'TUR 6x6'), ('zmaj', 'ZMAJ 85'), ('gams', 'GAMS RH'), ('lev', 'LEV R'), ('rally', 'BURJA R7'),
         ('jastreb', 'JASTREB 6'), ('skorpijon', 'ŠKORPIJON H'), ('perun', 'PERUN V12'), ('muscle', 'VIHAR V8'), ('modras', 'MODRAS V10'),
         ('jelen', 'JELEN GT'), ('sakal', 'ŠAKAL D'), ('panter', 'PANTER 6'), ('goljat', 'GOLJAT'), ('ev', 'STRELA EV'),
         ('formula', 'FORMULA ORKAN'), ('lm', 'TAIFUN LM'), ('titan', 'TITAN'), ('cisterna', 'TITAN CISTERNA'), ('kamen', 'KAMEN PUŠČAVA')]
VRSTE = [('34f', 'Visoki, spredaj (garaža)'), ('34r', 'Visoki, zadaj (garaža)'), ('trk', 'po treh trkih (Spa, Belgija)'), ('za', 'isto, kamera za avtom')]
TW, TH, GAP, HEAD, MAXB = 960, 540, 8, 48, 480 * 1024
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def tile(d, ime, izrez=None):
    p = os.path.join(d, ime + '.png')
    if not os.path.exists(p):
        t = Image.new('RGB', (TW, TH), (60, 60, 60)); ImageDraw.Draw(t).text((20, 20), 'ni slike: ' + ime, fill='white', font=ImageFont.truetype(FB, 28)); return t
    im = Image.open(p).convert('RGB')
    if izrez:   # (garaža: osrednji izrez, avto 1,5-krat večji)
        w, h = im.size; cw, ch = int(w * izrez), int(h * izrez); im = im.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2))
    return im.resize((TW, TH), Image.LANCZOS)


def label(dr, xy, text, f):
    x, y = xy; b = dr.textbbox((x, y), text, font=f)
    dr.rectangle((b[0] - 8, b[1] - 6, b[2] + 8, b[3] + 6), fill=(20, 20, 20)); dr.text((x, y), text, fill='white', font=f)


def main(prej, potem, out):
    os.makedirs(out, exist_ok=True)
    fh, ft = ImageFont.truetype(FB, 26), ImageFont.truetype(FB, 22)
    for i, (cid, ime) in enumerate(IMENA, 1):
        W, H = 2 * TW + GAP, HEAD + 4 * TH + 3 * GAP
        c = Image.new('RGB', (W, H), (245, 245, 245)); dr = ImageDraw.Draw(c)
        dr.text((16, 10), f'{ime}  ({cid})', fill=(20, 20, 20), font=fh)
        dr.text((TW - 230, 12), 'ZDAJ (main)', fill=(20, 20, 20), font=ft); dr.text((TW + GAP + 16, 12), 'POTEM (#480)', fill=(20, 20, 20), font=ft)
        for r, (v, opis) in enumerate(VRSTE):
            y = HEAD + r * (TH + GAP)
            z = 2 / 3 if v in ('34f', '34r') else None
            c.paste(tile(prej, f'{cid}-{v}', z), (0, y)); c.paste(tile(potem, f'{cid}-{v}', z), (TW + GAP, y))
            label(dr, (16, y + 14), opis, ft)
        name = os.path.join(out, f'{i:02d}-{cid}.jpg')
        for q in (86, 82, 78, 74, 70, 66):
            c.save(name, 'JPEG', quality=q, optimize=True, progressive=True)
            if os.path.getsize(name) <= MAXB: break
        print(name, os.path.getsize(name) // 1024, 'KB q', q)


if __name__ == '__main__':
    main(*sys.argv[1:4])
