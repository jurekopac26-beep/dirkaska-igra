# Mockup only: the intro's media into the site: the helicopter's flights (raw/maps/heli-<track>.webm, their first frames as posters) and
# the music (music/out/<country>.wav -> MP3, and the rotor), each only when its source is newer.
# Usage: python3 intro_assets.py [site]
import os, sys, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')
MAPS, MUS = os.path.join(HERE, 'raw', 'maps'), os.path.join(HERE, 'glasba', 'out')
FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
newer = lambda a, b: os.path.exists(a) and (not os.path.exists(b) or os.path.getmtime(a) > os.path.getmtime(b))
os.makedirs(os.path.join(SITE, 'assets', 'maps'), exist_ok=True); os.makedirs(os.path.join(SITE, 'assets', 'music'), exist_ok=True)
for f in sorted(os.listdir(MAPS)):
    if f.startswith('heli-') and f.endswith('.webm'):
        src, dst = os.path.join(MAPS, f), os.path.join(SITE, 'assets', 'maps', f)
        if newer(src, dst): open(dst, 'wb').write(open(src, 'rb').read()); print('video', f, os.path.getsize(dst) // 1024, 'KB')
    if f.startswith('heli-') and f.endswith('-poster.jpg'):
        src, dst = os.path.join(MAPS, f), os.path.join(SITE, 'assets', 'maps', f.replace('-poster.jpg', '.webp'))
        if newer(src, dst): Image.open(src).convert('RGB').save(dst, 'WEBP', quality=78, method=6); print('poster', os.path.basename(dst), os.path.getsize(dst) // 1024, 'KB')
for f in sorted(os.listdir(MUS)) if os.path.isdir(MUS) else []:
    if f.endswith('.wav'):
        src, dst = os.path.join(MUS, f), os.path.join(SITE, 'assets', 'music', f[:-4] + '.mp3')
        if newer(src, dst):
            subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-c:a', 'libmp3lame', '-b:a', '96k' if f.startswith('rotor') else '160k', dst], check=True)
            print('music', os.path.basename(dst), os.path.getsize(dst) // 1024, 'KB')
