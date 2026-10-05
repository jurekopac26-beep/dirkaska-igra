# Mockup only: raw/carimg/*.png (from carimgs.mjs) -> ../assets/cars/img/*.webp and the pictures of the main menu buttons.
from PIL import Image, ImageEnhance

def crop(im, pad):
    a = im.split()[3].point(lambda x: 255 if x > 8 else 0); bb = a.getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))

def load(name, pad=10):
    return crop(Image.open('raw/carimg/%s.png' % name).convert('RGBA'), pad)

# every car in every paint (8 colours of the game), for the car boxes of a race
for m in ['pico', 'kaze', 'rally', 'vortex', 'strega', 'formula']:
    for c in range(8):
        im = load('%s-%d' % (m, c)); im.thumbnail((240, 136), Image.LANCZOS)
        im.save('../assets/cars/img/%s-%d.webp' % (m, c), 'WEBP', quality=86, method=6)
    print(m, im.size)

# Multiplayer: the red car in front on the left, the blue one a little further away on the right
L, R = load('duel_l', 6), load('duel_r', 6)
R = R.resize((int(R.width * 0.9), int(R.height * 0.9)), Image.LANCZOS)
ox, oy = int(L.width * 0.4), int(L.height * 0.28)
W, H = max(ox + R.width, L.width), max(R.height, oy + L.height)
c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
c.alpha_composite(R, (W - R.width, 0)); c.alpha_composite(L, (0, oy))
c.thumbnail((560, 300), Image.LANCZOS); c.save('../assets/menu/multiplayer.webp', 'WEBP', quality=86, method=6); print('multiplayer', c.size)

# Career: the rally car (the cup next to it is drawn by the page)
cc = load('career_car'); cc.thumbnail((520, 320), Image.LANCZOS)
cc.save('../assets/menu/career.webp', 'WEBP', quality=86, method=6); print('career', cc.size)

# the three single race modes (step 1 of Single race)
def loadk(name, k=1.0):
    im = load(name, 6)
    return im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
def compose(cars):   # cars from the back to the front: (picture, x, y)
    W = max(x + im.width for im, x, y in cars); H = max(y + im.height for im, x, y in cars)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for im, x, y in cars: c.alpha_composite(im, (x, y))
    return c
def save(c, name):
    c.thumbnail((560, 300), Image.LANCZOS); c.save('../assets/menu/%s.webp' % name, 'WEBP', quality=86, method=6); print(name, c.size, round(c.width / c.height, 2))

# Circuit race: three cars side by side into a corner (blue at the back, yellow, red in front)
b, y, r = loadk('pico-2', 0.8), loadk('strega-3', 0.9), loadk('kaze-0')
save(compose([(b, 0, 0), (y, int(b.width * 0.42), int(b.height * 0.2)), (r, int(b.width * 0.42 + y.width * 0.42), int(b.height * 0.2 + y.height * 0.22))]), 'mode-race')
# Police chase: the police car (light bar on) right behind a red car
p, r = loadk('police', 0.9), loadk('kaze-0')
save(compose([(p, 0, 0), (r, int(p.width * 0.5), int(p.height * 0.3))]), 'mode-chase')
# Time trial: the car and its ghost (the best run so far) just behind
f = loadk('formula-3')
g = f.resize((round(f.width * 0.92), round(f.height * 0.92)), Image.LANCZOS)
rgb = ImageEnhance.Color(g.convert('RGB')).enhance(0.1)
cy = Image.new('RGB', g.size, (90, 200, 255)); rgb = Image.blend(rgb, cy, 0.55)
ghost = rgb.convert('RGBA'); ghost.putalpha(g.split()[3].point(lambda a: int(a * 0.42)))
save(compose([(ghost, 0, 0), (f, int(g.width * 0.36), int(g.height * 0.22))]), 'mode-trial')
