# The frames of posnetki.mjs put together (the game's 3D photo with the game's HUD over it, as the player sees the screen; Retro and
# Normalno blown up from the resolution the game draws them at: Retro in blocks, Normalno soft), made 3/4 of their size and written into
# the mockup: maketa-nastavitev/posnetki/<port|land>/<setting>-<option>.jpg and posnetki/real.js (the list, where our car is on each).
#   python3 maketa-nastavitev/orodja/sestavi.py [track]
import sys, os, glob, json, tempfile
from PIL import Image
track = sys.argv[1] if len(sys.argv) > 1 else 'riviera'
SRC = os.path.join(tempfile.gettempdir(), 'posnetki')
M = (os.environ.get('POSNETKI_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'posnetki')) + '/'   # (POSNETKI_OUT: elsewhere, to look first)
man = {}
for o in ['port', 'land']:
    d = os.path.join(SRC, o + '-' + track) + '/'
    meta = json.load(open(d + 'meta.json')); os.makedirs(M + o, exist_ok=True)
    names = ['base'] + [k for k in meta['pos'] if k != 'base']
    hud0 = Image.open(d + 'base-hud.png').convert('RGBA')
    for n in names:
        im = Image.open(d + n + '-3d.png').convert('RGB')
        hud = Image.open(d + n + '-hud.png').convert('RGBA') if os.path.exists(d + n + '-hud.png') else hud0
        if im.size != hud.size: im = im.resize(hud.size, Image.NEAREST if 'retro' in n else Image.BICUBIC)
        im = im.convert('RGBA'); im.alpha_composite(hud); im = im.convert('RGB')
        w, h = im.size
        im = im.resize((w * 3 // 4, h * 3 // 4), Image.NEAREST if 'retro' in n else Image.LANCZOS)
        im.save(M + o + '/' + n + '.jpg', quality=80, optimize=True, progressive=True)
    man[o] = {'w': meta['W'], 'h': meta['H'], 'pos': {k: [v['x'], v['y']] for k, v in meta['pos'].items()}, 'frames': names}
    print(o, len(names), 'frames')
head = ("/* Real frames from the game (Riviera, France: a race paused 18 s after the start, the same second drawn with every option): the 3D\n"
        "   view from the game's own photo (Render.snapshot), the game's HUD over it. pos: where our car is on the screen (CSS px).\n"
        "   Made by orodja/posnetki.mjs and orodja/sestavi.py. */\n")
open(M + 'real.js', 'w').write(head + 'window.REAL_FRAMES = ' + json.dumps(man, separators=(',', ':')) + ';\n')
