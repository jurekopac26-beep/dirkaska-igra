import sys, glob
from PIL import Image
fs = sorted(glob.glob('shots/*.png'))
sel = sys.argv[2].split(',') if len(sys.argv) > 2 else None
if sel: fs = [f for f in fs if any(s in f for s in sel)]
ims = [Image.open(f).convert('RGB') for f in fs]
w = ims[0].width // 2; h = ims[0].height // 2
per = 5
rows = (len(ims) + per - 1) // per
c = Image.new('RGB', (per * (w + 8), rows * (h + 8)), (30, 30, 30))
for i, im in enumerate(ims): c.paste(im.resize((w, h)), ((i % per) * (w + 8), (i // per) * (h + 8)))
c.save(sys.argv[1], quality=80); print(c.size, len(ims))
