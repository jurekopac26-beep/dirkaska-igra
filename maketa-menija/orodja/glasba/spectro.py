"""a picture of a music file to check it by eye: a log-frequency spectrogram (30 Hz .. 16 kHz), the loudness under it, the drop and the end marked"""
import sys, numpy as np
from scipy.io import wavfile
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import DROP, END
def spectro(path, out, W=1400, H=420):
    sr, x = wavfile.read(path); m = x.astype(float).mean(1) / 32768; hop = max(1, len(m) // W); nf = 4096
    win = np.hanning(nf); cols = []
    for i in range(W):
        a = i * hop; seg = m[a:a + nf]
        if len(seg) < nf: seg = np.pad(seg, (0, nf - len(seg)))
        cols.append(np.abs(np.fft.rfft(seg * win)))
    S = np.array(cols).T; f = np.fft.rfftfreq(nf, 1 / sr); fl = np.geomspace(30, 16000, H)
    img = np.array([np.interp(fl, f, S[:, i]) for i in range(W)]).T[::-1]
    db = 20 * np.log10(img + 1e-7); db = np.clip((db - db.max() + 80) / 80, 0, 1)
    rgb = np.stack([np.clip(db * 3 - 1.2, 0, 1), np.clip(db * 2 - 0.5, 0, 1) ** 1.2, np.clip(1.2 - np.abs(db * 2.2 - 1.1), 0, 1) * 0.9 + db * 0.1], -1)
    im = Image.fromarray((rgb * 255).astype(np.uint8)); im = im.resize((W, H)); full = Image.new('RGB', (W, H + 90), (12, 12, 16)); full.paste(im, (0, 0)); d = ImageDraw.Draw(full)
    dur = len(m) / sr; rms = [20 * np.log10(np.sqrt(np.mean(m[i * hop:(i + 1) * hop] ** 2)) + 1e-9) for i in range(W)]
    for i in range(W - 1): d.line([(i, H + 85 - max(0, rms[i] + 50) * 1.6), (i + 1, H + 85 - max(0, rms[i + 1] + 50) * 1.6)], fill=(240, 200, 60))
    for t, c in ((DROP, (255, 60, 60)), (END, (60, 160, 255)), (DROP - 4.5, (120, 255, 120))): x0 = int(t / dur * W); d.line([(x0, 0), (x0, H + 90)], fill=c)
    for fr in (100, 1000, 10000): y = H - int(np.log(fr / 30) / np.log(16000 / 30) * H); d.line([(0, y), (8, y)], fill=(255, 255, 255)); d.text((10, y - 6), str(fr), fill=(220, 220, 220))
    full.save(out)
if __name__ == '__main__': spectro(sys.argv[1], sys.argv[2])
