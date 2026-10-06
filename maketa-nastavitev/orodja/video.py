# The frames of video.mjs put together and made into the clips over Upravljanje: for each control (Tipke, Volan, Nagib) and each side of
# the phone, the game's 3D frame with that control's HUD over it, 432 px on the short side; H.264 (MP4: phones, Safari, Chrome) and VP9
# (WebM: the rest), and a poster (the first frame), in maketa-nastavitev/posnetki/video/. What the mockup moves with the clip (the
# steering, the gas, the brake, the arrows pressed; where each control is on the screen) goes to posnetki/video.js (REAL_VIDEO).
#   python3 maketa-nastavitev/orodja/video.py [track]          (POSNETKI_OUT: elsewhere, to look first)
import sys, os, json, subprocess, tempfile, shutil
from PIL import Image
track = sys.argv[1] if len(sys.argv) > 1 else 'riviera'
SRC = os.path.join(tempfile.gettempdir(), 'posnetki')
M = (os.environ.get('POSNETKI_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'posnetki')) + '/'
os.makedirs(M + 'video', exist_ok=True)
out = {}
for o in ['port', 'land']:
    d = os.path.join(SRC, 'video-%s-%s' % (o, track)) + '/'
    meta = json.load(open(d + 'meta.json'))
    n, fps = meta['n'], meta['fps']
    size = (432, 934) if o == 'port' else (934, 432)   # (the phones in the cards are at most a few hundred points: enough for a sharp phone screen)
    for c in ['buttons', 'wheel', 'tilt']:
        tmp = tempfile.mkdtemp()
        for i in range(n):
            im = Image.open(d + '3d-%04d.jpg' % i).convert('RGBA'); hud = Image.open(d + 'hud-%s-%04d.png' % (c, i)).convert('RGBA')
            if im.size != hud.size: im = im.resize(hud.size, Image.BICUBIC)
            im.alpha_composite(hud); im = im.convert('RGB').resize(size, Image.LANCZOS)
            im.save('%s/%04d.png' % (tmp, i))
            if i == 0: im.save(M + 'video/control-%s-%s.jpg' % (c, o), quality=80, optimize=True, progressive=True)
        base = M + 'video/control-%s-%s' % (c, o)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', tmp + '/%04d.png', '-c:v', 'libx264', '-profile:v', 'main', '-level', '3.1',
                        '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'slow', '-movflags', '+faststart', '-an', base + '.mp4'], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', tmp + '/%04d.png', '-c:v', 'libvpx-vp9', '-crf', '41', '-b:v', '0',
                        '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', base + '.webm'], check=True)
        shutil.rmtree(tmp)
        print(o, c, os.path.getsize(base + '.mp4') // 1024, 'KB mp4,', os.path.getsize(base + '.webm') // 1024, 'KB webm')
    r = meta['rec']
    out[o] = {'w': meta['W'], 'h': meta['H'], 'fps': fps, 'n': n, 'steer': [round(v, 2) for v in r['steer']],
              'gas': ''.join(map(str, r['gas'])), 'brake': ''.join(map(str, r['brake'])), 'left': ''.join(map(str, r['left'])), 'right': ''.join(map(str, r['right'])),
              'rects': meta['rects']}
head = ("/* The clips over Upravljanje (Riviera, France: 4 s of an S-bend, the autopilot driving), with what the mockup moves with them: per frame\n"
        "   the steering (smoothed), the gas, the brake and the arrows pressed (strings of 0 and 1); rects: where each control is on the screen\n"
        "   (fractions), in each layout. Made by orodja/video.mjs and orodja/video.py. */\n")
open(M + 'video.js', 'w').write(head + 'window.REAL_VIDEO = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('video.js')
