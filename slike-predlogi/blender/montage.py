# hiter pregled: montage.py <izhod.jpg> <širina ploščice> <stolpci> slike...
import sys
from PIL import Image, ImageDraw, ImageFont
out, tw, cols = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]
th = int(tw * ims[0].height / ims[0].width); rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw + (cols + 1) * 6, rows * (th + 22) + 6), (30, 30, 34)); d = ImageDraw.Draw(sh)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
for k, (f, im) in enumerate(zip(fs, ims)):
    x, y = 6 + (k % cols) * (tw + 6), 6 + (k // cols) * (th + 22)
    sh.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 18)); d.text((x, y), f.split('/')[-1], font=F, fill=(240, 240, 240))
sh.save(out, quality=88)
