#!/usr/bin/env python3
# The co-driver's recorded voice (docs/sovoznik.md, razdelek Glas): every word he says (Core.CD_EN, the distances) spoken by the open
# English speech model Kokoro-82M (Apache 2.0; its voices Apache 2.0), cut, made equally loud and put into one sheet: an MP3 in base64
# with each word's place in it (js/data/sovoznik-en.js; the game reads a call word by word, Comm.note). Optionally sample calls (MP3) as
# the game puts them together, for the question on the page Odločitve.
#
#   pip install onnxruntime numpy           (and ffmpeg with libmp3lame)
#   python3 tools/sovoznik-glas.py                                        # writes js/data/sovoznik-en.js (voice bm_george: the user's choice, 6 Nov 2026)
#   python3 tools/sovoznik-glas.py --voice am_michael --samples DIR --no-sheet   # sample calls of another voice (the first sheet was am_michael)
#
# The model and the voices come from npm (`npm pack`, into --cache; Hugging Face is not reachable from the sessions' environment):
#   kokoro-js@1.2.1 (the official package, Apache 2.0: its voices/*.bin, 510 x 256 float32 each)
#   kokoro-q8-shards@1.0.0 (model_quantized.onnx of onnx-community/Kokoro-82M-v1.0-ONNX in 6 pieces, Apache 2.0; sha256 checked below)
# The words' phonemes are written out below (from the misaki lexicons, Apache 2.0: us_gold / gb_gold, as Kokoro was trained on them);
# the symbols' numbers are Kokoro's own (its config.json, vocab). A word the co-driver gets later: its phonemes here, then run it again.
import argparse, base64, hashlib, json, os, subprocess, sys, tempfile
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000
Q8_SHA = 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478'
# Kokoro-82M's phoneme symbols in the order of their numbers (config.json "vocab")
SYM = ';:,.!?—…"()“” ̃ʣʥʦʨᵝꭧAIOQSTWYᵊabcdefhijklmnopqrstuvwxyzɑɐɒæβɔɕçɖðʤəɚɛɜɟɡɥɨɪʝɯɰŋɳɲɴøɸθœɹɾɻʁɽʂʃʈʧʊʋʌɣɤχʎʒʔˈˌːʰʲ↓→↗↘ᵻ'
IDS = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 31, 33, 35, 36, 39, 41, 42, 43, 44, 45, 46, 47, 48, 50,
       51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 75, 76, 77, 78, 80, 81, 82, 83, 85, 86, 87, 90, 92, 99,
       101, 102, 103, 110, 111, 112, 113, 114, 115, 116, 118, 119, 120, 123, 125, 126, 128, 129, 130, 131, 132, 133, 135, 136, 138, 139, 140, 142,
       143, 147, 148, 156, 157, 158, 162, 164, 169, 171, 172, 173, 177]
VOCAB = dict(zip(SYM, IDS))

# the words (the tokens of Track.paceNotes: Core.CD_EN's keys, the distances dNNN): American and British phonemes
NUM_US = {1: 'wˈʌn', 2: 'tˈu', 3: 'θɹˈi', 4: 'fˈɔɹ', 5: 'fˈIv'}
NUM_GB = {1: 'wˈʌn', 2: 'tˈuː', 3: 'θɹˈiː', 4: 'fˈɔː', 5: 'fˈIv'}
WORDS = {
    'L': ('lˈɛft', 'lˈɛft'), 'R': ('ɹˈIt', 'ɹˈIt'),
    '1': (NUM_US[1], NUM_GB[1]), '2': (NUM_US[2], NUM_GB[2]), '3': (NUM_US[3], NUM_GB[3]), '4': (NUM_US[4], NUM_GB[4]), '5': (NUM_US[5], NUM_GB[5]),
    '6': ('sˈɪks', 'sˈɪks'),
    'flat': ('flˈæt', 'flˈat'), 'hairpin': ('hˈɛɹpˌɪn', 'hˈɛːpɪn'), 'square': ('skwˈɛɹ', 'skwˈɛː'), 'long': ('lˈɔŋ', 'lˈɒŋ'),
    'tightens': ('tˈItᵊnz', 'tˈItᵊnz'), 'opens': ('ˈOpᵊnz', 'ˈQpᵊnz'), 'over': ('ˈOvəɹ', 'ˈQvə'), 'crest': ('kɹˈɛst', 'kɹˈɛst'),
    'jump': ('ʤˈʌmp', 'ʤˈʌmp'), 'bigjump': ('bˈɪɡ ʤˈʌmp', 'bˈɪɡ ʤˈʌmp'), 'onto': ('ˈɑntˌu', 'ˈɒntuː'), 'gravel': ('ɡɹˈævᵊl', 'ɡɹˈavᵊl'),
    'tarmac': ('tˈɑɹmˌæk', 'tˈɑːmak'), 'cobbles': ('kˈɑbᵊlz', 'kˈɒbᵊlz'), 'ring': ('ɹˈWndəbˌWt', 'ɹˈWndəbˌWt'), 'straight': ('stɹˈAt', 'stɹˈAt'),
    'chicane': ('ʃəkˈAn', 'ʃɪkˈAn'), 'into': ('ˈɪntu', 'ˈɪntuː'), 'and': ('ˈænd', 'ˈand'), 'caution': ('kˈɔʃən', 'kˈɔːʃᵊn'),
    'fin': ('tə fˈɪnəʃ', 'tə fˈɪnɪʃ'),
}
for m in range(100, 501, 50):   # one hundred ... five hundred (one fifty, two fifty ...)
    n, half = m // 100, m % 100
    WORDS['d%d' % m] = tuple(num[n] + ' ' + ('fˈɪfti' if half else 'hˈʌndɹəd') for num in (NUM_US, NUM_GB))

# the pauses between two words of a call (s; the game's are the same: js/comm.js recGap): a comma after 'caution' and before the distance
def gap(a, b):
    return 0.17 if a == 'caution' else 0.13 if b[0] == 'd' and b[1:].isdigit() else 0.06

# sample calls for the question (the tokens as Track.paceNotes gives them)
SAMPLES = {
    'left-four-long': ['L', '4', 'long'],
    'caution-jump': ['caution', 'jump'],
    'right-two-into-hairpin-left': ['R', '2', 'into', 'hairpin', 'L', 'd100'],
    'caution-left-three-tightens': ['caution', 'L', '3', 'tightens', 'and', 'R', '5', 'over', 'crest', 'd200'],
}

def npm_get(pkg, cache):
    d = os.path.join(cache, pkg.replace('@', '-'))
    if not os.path.isdir(os.path.join(d, 'package')):
        os.makedirs(d, exist_ok=True)
        tgz = subprocess.run(['npm', 'pack', pkg, '--silent'], cwd=d, check=True, capture_output=True, text=True).stdout.strip().splitlines()[-1]
        subprocess.run(['tar', 'xzf', tgz], cwd=d, check=True)
    return os.path.join(d, 'package')

def model(cache):
    p = os.path.join(cache, 'model_quantized.onnx')
    if not os.path.exists(p):
        q8 = npm_get('kokoro-q8-shards@1.0.0', cache)
        with open(p + '.part', 'wb') as f:
            for i in range(6):
                with open(os.path.join(q8, 'kokoro-q8.part%d.bin' % i), 'rb') as g: f.write(g.read())
        os.replace(p + '.part', p)
    with open(p, 'rb') as f:
        if hashlib.sha256(f.read()).hexdigest() != Q8_SHA: sys.exit('model_quantized.onnx: not the expected file (sha256)')
    return p

class Kokoro:
    def __init__(self, cache, voice):
        import onnxruntime as ort
        self.sess = ort.InferenceSession(model(cache), providers=['CPUExecutionProvider'])
        self.pack = np.fromfile(os.path.join(npm_get('kokoro-js@1.2.1', cache), 'voices', voice + '.bin'), dtype=np.float32).reshape(510, 256)
    def say(self, ph, speed):
        toks = [VOCAB[c] for c in ph if c in VOCAB]
        st = self.pack[min(len(toks), 510) - 1][None, :]
        return self.sess.run(None, {'input_ids': np.array([[0, *toks, 0]], dtype=np.int64), 'style': st, 'speed': np.array([speed], dtype=np.float32)})[0].ravel()

def quick(a, tempo):
    """faster, the pitch kept (ffmpeg atempo): the model says a word alone slowly (~0.45 s), a co-driver reads quickly"""
    if abs(tempo - 1) < 1e-3: return a
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-af', 'atempo=%.3f' % tempo, '-f', 'f32le', 'pipe:1'],
                       input=np.asarray(a, dtype='<f4').tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype='<f4')

def tidy(a, level):
    """one word: its silence cut (15 ms before, 30 ms after), short fades, as loud as the others (rms of its voiced part), peaks under -1 dB"""
    a = a.astype(np.float64)
    env = np.convolve(np.abs(a), np.ones(48) / 48, mode='same')
    on = np.nonzero(env > env.max() * 0.02)[0]
    i0, i1 = max(on[0] - int(0.015 * SR), 0), min(on[-1] + int(0.03 * SR), len(a))
    a = a[i0:i1].copy()
    fi, fo = int(0.004 * SR), int(0.012 * SR)
    a[:fi] *= np.linspace(0, 1, fi); a[-fo:] *= np.linspace(1, 0, fo)
    fr = a[: len(a) // 240 * 240].reshape(-1, 240)
    rms = np.sqrt((fr ** 2).mean(axis=1)); voiced = rms[rms > rms.max() * 0.25]
    a *= level / np.sqrt((voiced ** 2).mean())
    pk = np.abs(a).max()
    if pk > 0.89: a = np.tanh(a / 0.89 * 1.2) / np.tanh(1.2) * 0.89 if pk > 1.1 else a * 0.89 / pk
    return a

# the game's own helmet (js/comm.js recOut: 150 Hz high-pass, +3 dB at 3 kHz), on the samples only: the sheet stays clean
HELMET = 'highpass=f=150,equalizer=f=3000:t=q:w=1:g=3'
def mp3(pcm, out, kbps, helmet=False):   # (kbps < 10: LAME's variable rate -V kbps, the silence between the words almost free)
    with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as f:
        f.write((np.clip(pcm, -1, 1) * 32767).astype('<i2').tobytes()); raw = f.name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', raw] + (['-af', HELMET] if helmet else []) + ['-c:a', 'libmp3lame'] + (['-q:a', str(kbps)] if kbps < 10 else ['-b:a', '%dk' % kbps]) + ['-id3v2_version', '0', '-write_id3v1', '0', out], check=True)   # (no ID3 tags: frames only)
    os.unlink(raw)

def call(clips, toks):
    out = []
    for i, t in enumerate(toks):
        if i: out.append(np.zeros(int(gap(toks[i - 1], t) * SR)))
        out.append(clips[t])
    return np.concatenate(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='bm_george')   # (the shipped voice: a run without --voice must not swap it)
    ap.add_argument('--lex', choices=['us', 'gb'], help='the phonemes (default: by the voice, b*_ British)')
    ap.add_argument('--speed', type=float, default=1.3)   # (the model's own pace: isolated words ~0.4 s; faster, they slur)
    ap.add_argument('--tempo', type=float, default=1.15)   # (then faster still, the pitch kept: quick; 1.25 and more: the speech recognition misses words)
    ap.add_argument('--kbps', type=int, default=7)   # (LAME -V7: ~37 kbps on average, the sheet ~155 KB)
    ap.add_argument('--cache', default=os.path.join(tempfile.gettempdir(), 'sovoznik-glas'))
    ap.add_argument('--samples', help='a directory: the sample calls as MP3 (SAMPLES)')
    ap.add_argument('--no-sheet', action='store_true')
    ap.add_argument('--out', default=os.path.join(ROOT, 'js', 'data', 'sovoznik-en.js'))
    A = ap.parse_args()
    os.makedirs(A.cache, exist_ok=True)
    gb = (A.lex or ('gb' if A.voice[0] == 'b' else 'us')) == 'gb'
    K = Kokoro(A.cache, A.voice)
    clips = {k: tidy(quick(K.say(v[1 if gb else 0] + ',', A.speed), A.tempo), 0.16) for k, v in WORDS.items()}
    if A.samples:
        os.makedirs(A.samples, exist_ok=True)
        every = [np.zeros(int(0.3 * SR))]
        for name, toks in SAMPLES.items():
            pcm = np.concatenate([np.zeros(int(0.15 * SR)), call(clips, toks), np.zeros(int(0.3 * SR))])
            mp3(pcm, os.path.join(A.samples, '%s_%s.mp3' % (A.voice, name)), 64, True)
            every += [call(clips, toks), np.zeros(int(0.9 * SR))]
        mp3(np.concatenate(every), os.path.join(A.samples, '%s.mp3' % A.voice), 64, True)   # (all of them, 0.9 s apart: one file a voice)
    if A.no_sheet: return
    # the sheet: the words one after another, 0.12 s of silence between them (the decoder's delay and the game's own trim, Comm, fit in it)
    parts, at, pos = [np.zeros(int(0.08 * SR))], {}, int(0.08 * SR)
    for k, a in clips.items():
        at[k] = [round(pos / SR, 3), round((pos + len(a)) / SR, 3)]
        parts += [a, np.zeros(int(0.12 * SR))]; pos += len(a) + int(0.12 * SR)
    pcm = np.concatenate(parts)
    with tempfile.TemporaryDirectory() as d:
        mp3(pcm, os.path.join(d, 's.mp3'), A.kbps)
        data = open(os.path.join(d, 's.mp3'), 'rb').read()
    js = ('// the co-driver\'s voice (docs/sovoznik.md, Glas): his words in one sheet, an MP3 (%s, %d Hz) in base64, each word\'s place in it\n'
          '// [from, to] s. Made by tools/sovoznik-glas.py (voice %s of Kokoro-82M, Apache 2.0; README, Zasluge): do not edit by hand\n'
          '(typeof window !== \'undefined\' ? window : globalThis).SOVOZNIK_EN = { voice: %s, rate: %d, len: %.3f, clips: %s,\n  mp3: \'%s\' };\n') % (
        ('LAME -V%d' % A.kbps if A.kbps < 10 else '%d kbps' % A.kbps), SR, A.voice, json.dumps(A.voice), SR, len(pcm) / SR, json.dumps(at, separators=(',', ':')), base64.b64encode(data).decode())
    open(A.out, 'w', encoding='utf-8').write(js)
    print('%s: %d words, %.1f s, MP3 %d B, file %d B' % (os.path.relpath(A.out, ROOT), len(at), len(pcm) / SR, len(data), len(js.encode())))

if __name__ == '__main__':
    main()
