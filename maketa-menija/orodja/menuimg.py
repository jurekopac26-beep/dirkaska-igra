# Mockup only: raw/carimg/*.png (from carimgs.mjs) -> ../assets/cars/img/*.webp and the pictures of the main menu buttons.
from PIL import Image

def crop(im, pad):
    a = im.split()[3].point(lambda x: 255 if x > 8 else 0); bb = a.getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))

def load(name, pad=10):
    return crop(Image.open('raw/carimg/%s.png' % name).convert('RGBA'), pad)

for m in ['kaze', 'vortex', 'pico', 'strega', 'rally', 'formula']:
    im = load(m); im.thumbnail((520, 320), Image.LANCZOS)
    im.save('../assets/cars/img/%s.webp' % m, 'WEBP', quality=86, method=6); print(m, im.size)

# Multiplayer: the red car in front on the left, the blue one a little further away on the right
L, R = load('duel_l', 6), load('duel_r', 6)
R = R.resize((int(R.width * 0.9), int(R.height * 0.9)), Image.LANCZOS)
ox, oy = int(L.width * 0.5), int(L.height * 0.28)
W, H = max(ox + R.width, L.width), max(R.height, oy + L.height)
c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
c.alpha_composite(R, (W - R.width, 0)); c.alpha_composite(L, (0, oy))
c.thumbnail((560, 300), Image.LANCZOS); c.save('../assets/menu/multiplayer.webp', 'WEBP', quality=86, method=6); print('multiplayer', c.size)

# Career: the rally car (the cup next to it is drawn by the page)
cc = load('career_car'); cc.thumbnail((520, 320), Image.LANCZOS)
cc.save('../assets/menu/career.webp', 'WEBP', quality=86, method=6); print('career', cc.size)
