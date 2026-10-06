# a contact sheet of screenshots: python3 sheet.py DIR OUT name1 name2 ... (crop: header, stage and the info under it)
import sys, os
from PIL import Image, ImageDraw
d, out, names = sys.argv[1], sys.argv[2], sys.argv[3:]
y0, y1 = int(os.environ.get('Y0', 160)), int(os.environ.get('Y1', 1300))
ims = []
for n in names:
    p = f'{d}/{n}.png'
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGB')
    im = im.crop((0, y0, im.width, min(im.height, y1)))
    w = 412; h = round(im.height * w / im.width); im = im.resize((w, h))
    dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 70, 16), fill=(0, 0, 0)); dr.text((3, 2), n, fill=(255, 255, 0))
    ims.append(im)
cols = int(os.environ.get('COLS', 5)); rows = (len(ims) + cols - 1) // cols; h = max(i.height for i in ims)
sheet = Image.new('RGB', (cols * 412, rows * h), (40, 40, 40))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 412, (i // cols) * h))
sheet.save(out, quality=88); print(sheet.size)
