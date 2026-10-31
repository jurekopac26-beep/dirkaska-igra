"""China (Tianmen Mountain, Zhangjiajie, Hunan: a road of 99 bends up limestone cliffs to a huge natural arch, subtropical forest,
mist): liquid drum & bass.
A guzheng (the long zither on movable bridges, tuned to the pentatonic and plucked with fingerpicks; computed here as a Karplus-
Strong string whose length can move, so a note can be pressed up behind its bridge, rocked, or sounded in a rapid tremolo, and the
hand can sweep across all the strings) plays the hook and the sweeps; a dizi (the bamboo flute with a membrane over one hole, which
gives it a bright buzz) doubles it in the final and ornaments the breath with grace notes; an erhu (the two-string fiddle, bowed,
sliding between its notes) sings the second theme; gongs (a tam-tam's wash, the opera gong whose pitch bends up when it is struck)
mark the turns. Around them: rolling breakbeats, a warm sub bass, lush pads and an electric piano, the mist.
D major pentatonic (D E F# A B, and its minor mode on B), 170.21 bpm: 20 bars from the drop to the race's start.
The hook climbs the pentatonic in short steps to a held note, as the road climbs the cliff in short bends, and settles a step lower
each time (D, B, F#, A); the answer climbs to the high F#.
Original: the melodies, the chords' voicing, the rhythms and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -13..-1  mist and wind; the tam-tam swells; the guzheng sweeps its strings and outlines the hook with
                                     pressed notes; the pad, the electric piano; the erhu far away; a filtered beat; the build (Em9,
                                     A7sus4): the guzheng's tremolo, the snare roll, a riser, the opera gong bending up, an eighth of
                                     air, the dizi's pickup
    drop  (20.0 s)     bar 0         a guzheng sweep, the gong, the breakbeat and the hook
    A 0-3 (Bm9 Gmaj7 Dmaj9 Asus2/C#), A' 4-7 (the hook again, the dizi's echo, a higher answer), B 8-11 (Gmaj9 F#m7 Em9 A13sus4:
    the erhu's theme over the guzheng's broken chords), the mist 12-13 (no drums: the tam-tam, the dizi's ornaments), the climb 14-15
    (Em9, A7sus4: the tremolo, the roll), final 16-19 (everything: the dizi doubles the hook, the erhu below it), LANDING at bar 20 =
    48.2 s: D6/9 (the whole pentatonic as one chord): the gong, a sweep, the crash; it rings out through the tail
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 20                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 170.21 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SW = 0.1                                      # the hats' odd sixteenths a little late (the break's shuffle)
def T(bar, p=0.0, swing=0.0):                 # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (swing if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(53)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
@nb.njit(cache=True, fastmath=True)
def _string(freq, g, c, exc):
    """a Karplus-Strong string whose length can change while it rings (pitch freq[i] every sample): an integer delay, a first-order
    allpass for the fraction, a one-pole lowpass in the loop (c: 1 = bright); both filters' lags at the fundamental are taken off
    the delay, so every note is in tune; g: the loss per round trip"""
    n = freq.shape[0]; M = 8192; buf = np.zeros(M); y = np.zeros(n); s = 0.0; w = M; ne = exc.shape[0]; x1 = 0.0; y1 = 0.0
    for i in range(n):
        om = 2.0 * math.pi * freq[i] / 44100.0
        lag = math.atan2((1.0 - c) * math.sin(om), 1.0 - (1.0 - c) * math.cos(om)) / om
        D = 44100.0 / freq[i] - lag
        if D < 3.0: D = 3.0
        K = int(D - 0.5); d = D - K; dd = d
        for it in range(2):
            eta = (1.0 - dd) / (1.0 + dd)
            ph = math.atan2(-math.sin(om), eta + math.cos(om)) - math.atan2(-eta * math.sin(om), 1.0 + eta * math.cos(om))
            dd += d - (-ph / om)
        eta = (1.0 - dd) / (1.0 + dd)
        v = buf[(w - K) % M]
        a = eta * v + x1 - eta * y1; x1 = v; y1 = a
        s += c * (a - s)
        o = s * g
        if i < ne: o += exc[i]
        buf[w % M] = o; y[i] = o; w += 1
    return y

def loop_lp(f, t_hf):   # the loop lowpass for a note of f Hz whose harmonics near 3 kHz die in t_hf s; (c, the loss at the fundamental)
    q = 6.9 / ((1 - math.cos(TAU * 3000 / SR)) * t_hf * f); a = ((2 * q + 1) - math.sqrt(4 * q + 1)) / (2 * q); c = 1 - a
    om = TAU * f / SR; return c, c / math.sqrt(1 - 2 * a * math.cos(om) + a * a)

def guzheng(f, dur, vel=1.0, bend=None, bright=0.65, t60=2.4, seed=0, pick=0.14):
    """a guzheng string plucked with a fingerpick: the string pulled to a triangle with a little grit, harder plucks brighter;
    bend: [(seconds, semitones), ...] (the left hand pressing the string behind its bridge, or rocking it); the paulownia box's
    warm low body and its ring"""
    n = int(dur * SR); t = np.arange(n) / SR; seed = abs(int(seed))
    semis = np.interp(t, *zip(*bend)) if bend else 0.0
    fr = f * 2 ** (semis / 12) * (1 + 0.002 * vel * np.exp(-t / 0.03))
    r = np.random.default_rng(seed); P = max(4, int(SR / f)); x = np.arange(P) / P
    tri = np.where(x < pick, x / pick, (1 - x) / (1 - pick)); tri -= tri.mean()
    nz = r.random(P) * 2 - 1; nz = lp1(nz, 2000 + 9000 * bright * vel)
    e = (tri * 1.5 + nz * (0.3 + 0.4 * bright * vel)) * (0.45 + 0.55 * vel)
    c, h0 = loop_lp(f, 0.2 + 0.7 * bright * (0.6 + 0.4 * vel))
    y = _string(fr, min(0.99995, 10 ** (-3 / (f * t60)) / h0), c, e)
    y = y + bp(y, 220, 0.3) * 0.3 + bp(y, 1100, 0.3) * 0.2 + bp(y, 3200, 0.3) * 0.1
    y = hp1(y, 80); k = min(n, int(0.02 * SR)); y[n - k:] *= np.linspace(1, 0, k) ** 2
    return y * 0.55

ZHENG = [m for m in range(50, 100) if m % 12 in (2, 4, 6, 9, 11)]   # the strings: D major pentatonic, D3 up
PRESS = [(0, 0), (0.12, 0), (0.24, 2.0), (0.5, 2.0), (0.62, 0)]      # pressed up a whole tone, held, let go
ROCK = [(0, 0), (0.25, 0), (0.33, 0.35), (0.45, -0.05), (0.57, 0.35), (0.69, 0.0), (0.81, 0.3), (0.95, 0)]   # rocked (vibrato)
SCOOP = [(0, -1.0), (0.09, 0)]                                       # pressed before the pluck, released into the note

def dizi(notes, breath=0.22, vib=0.2, rel=0.25, seed=0, buzz=0.5):
    """the dizi played legato: notes [(start s, dur s, midi, level)]; a bright, reedy tone (its membrane buzzes in sympathy: the
    tone driven through a soft clip and a resonance near 3 kHz), tongued attacks, vibrato on long notes, breath"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for s0, d, m, v in notes:
        i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 35.0) + p0
    p = p + vib * np.clip((age - 0.2) / (0.4 * ln + 0.05), 0, 1) * (ln > 0.3) * np.sin(TAU * 5.8 * t)
    fr = mtof(p); nz = noise(n, seed)
    tone = sine(fr, n) + 0.4 * sine(fr * 2, n, 0.2) + 0.2 * sine(fr * 3, n, 0.4) + 0.1 * sine(fr * 4, n, 0.6)
    mem = np.tanh(tone * 2.2); mem = bp(mem, 3000, 0.4) * 0.5 + hp(mem, 5000) * 0.15
    air = hp(bp(nz, fr, 0.94), 400) * 1.1 + hp(nz, 7000) * 0.02
    art = 0.5 + 0.5 * np.clip(age / 0.025, 0, 1)
    env = np.clip(t / 0.03, 0, 1) * lp1(lv, 40.0) * art * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    return ((tone * (1 - breath) + mem * buzz + air * breath) * env + bp(nz, 2500, 0.3) * np.exp(-age / 0.012) * lv * 0.4) * 0.26

def erhu(notes, rel=0.3, vib=0.3, seed=0, slide=0.09):
    """the erhu bowed legato: notes [(start s, dur s, midi, level[, slide in from semitones])]; the finger slides between notes
    (slow, sung), vibrato pressed into long notes, the bow's grain, the python-skin body's nasal resonances"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for nt in notes:
        s0, d, m, v = nt[:4]; i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 1 / (TAU * slide)) + p0
    for nt in notes:
        if len(nt) > 4: i0 = int(nt[0] * SR); k = min(n - i0, int(0.2 * SR)); p[i0:i0 + k] += nt[4] * np.exp(-np.arange(k) / SR / 0.06)
    p = p + vib * np.clip((age - 0.25) / (0.5 * ln + 0.05), 0, 1) ** 1.2 * (ln > 0.35) * np.sin(TAU * 6.0 * t + 0.5 * np.sin(TAU * 0.5 * t))
    fr = mtof(p); nz = noise(n, seed)
    src = saw(fr, n) * (1 + 0.08 * lp1(nz, 300.0) / 0.05) * 0.5 + pulse(fr, n, 0.2) * 0.2
    y = bp(src, 750, 0.55) * 0.9 + bp(src, 1650, 0.5) * 0.5 + bp(src, 3200, 0.45) * 0.25 + lp(src, 500, 0.1) * 0.25
    env = np.clip(t / 0.1, 0, 1) * lp1(lv, 12.0) * (0.85 + 0.2 * np.clip(age / np.maximum(ln, 0.1), 0, 1)) * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    return hp1(y, 200) * env * 0.5

def tamtam(dur=6.0, f=70, seed=0, swell=0.6):
    """a tam-tam (the big flat gong): many inharmonic partials, the high ones swelling after the stroke (its 'bloom'), a shimmer"""
    n = int(dur * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); x = np.zeros(n)
    for k in range(26):
        ratio = 1.0 + k * 0.73 + r.uniform(-0.2, 0.2); fr = f * ratio
        if fr > 9000: break
        hi = min(1.0, ratio / 10); env = np.exp(-t / (dur * (0.5 - 0.3 * hi))) * (1 - hi + hi * np.clip(t / swell, 0, 1) ** 1.5)
        x += sine(fr * (1 + 0.0015 * np.sin(TAU * r.uniform(0.2, 0.9) * t)), n, r.random()) * env / (1 + 0.15 * k)
    x += bp(noise(n, seed), 2500, 0.2) * np.exp(-t / 1.2) * np.clip(t / 0.5, 0, 1) * 0.2 + lp(noise(n, seed + 1), 300) * np.exp(-t / 0.08) * 0.5
    return x * np.clip(t / 0.003, 0, 1) * 0.12

def opera_gong(f=620, dur=1.4, up=True, seed=0):
    """the opera gong (a small gong whose pitch slides up, or the bigger one down, as it settles after the stroke)"""
    n = int(dur * SR); t = np.arange(n) / SR; fr = f * 2 ** ((3.0 if up else -2.5) * (1 - np.exp(-t / 0.18)) / 12)
    x = sine(fr, n) + 0.4 * sine(fr * 1.47, n, 0.3) + 0.25 * sine(fr * 2.09, n, 0.6) + 0.12 * sine(fr * 2.94, n, 0.1)
    return (x * np.exp(-t / 0.5) + bp(noise(n, seed), 1800, 0.3) * np.exp(-t / 0.01) * 0.6) * np.clip(t / 0.0008, 0, 1) * 0.3

def epiano(f, dur, vel=0.6, r=0.3):   # an FM electric piano: a warm body and a bell-like tine
    n = int((dur + r) * SR); t = np.arange(n) / SR
    body = np.sin(TAU * f * t + ((0.4 + 1.1 * vel) * np.exp(-t / 0.5) + 0.2) * np.sin(TAU * f * t))
    tine = np.sin(TAU * f * t + (0.8 + 1.5 * vel) * np.exp(-t / 0.02) * np.sin(TAU * 14.0 * f * t)) * np.exp(-t / 0.06)
    amp = np.exp(-t / (1.4 if f < 400 else 1.0)) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (r / 3))) * np.clip(t / 0.002, 0, 1)
    return (body * 0.75 + tine * 0.28 * vel) * amp * 0.36

def sub(f, dur, vel=1.0, warm=0.3):   # the liquid sub bass: a sine, gently warmed (its second harmonic for small speakers)
    n = int((dur + 0.08) * SR); x = sine(f, n); return (x + warm * np.tanh(x * 2.5) * 0.5 + warm * 0.3 * sine(f * 2, n)) * adsr(n, 0.006, 0.2, 0.9, 0.08, gate=dur) * vel
def reese(f, dur, cutoff=900, vel=1.0):   # a reese (two detuned saws beating, low-passed): the mid bass in the final
    n = int((dur + 0.08) * SR); x = saw(f, n) + saw(f * 1.008, n) + 0.5 * saw(f * 0.996 * 2, n)
    return hp1(lp(x, cutoff, 0.2), 120) * adsr(n, 0.01, 0.2, 0.85, 0.08, gate=dur) * vel * 0.3

def mist(dur, seed=0):   # mist in the forest: soft, slowly breathing noise, a wandering band, distant drips
    n = int(dur * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed)
    fc = 900 * 2 ** (1.0 * np.sin(TAU * 0.04 * t + seed) + 0.5 * np.sin(TAU * 0.11 * t + 2 * seed))
    x = bp(noise(n, seed), fc, 0.6) * (0.5 + 0.5 * np.sin(TAU * 0.06 * t + seed) ** 2)
    drops = np.zeros(n)
    for _ in range(int(dur * 1.2)):
        a = int(r.uniform(0, dur - 0.2) * SR); m = int(0.05 * SR); f0 = r.uniform(1400, 2600); tt = np.arange(m) / SR
        drops[a:a + m] += np.sin(TAU * f0 * (1 + 0.6 * tt / 0.05) * tt) * np.exp(-tt / 0.012) * r.uniform(0.2, 0.6)
    return x + drops * 0.4

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  pad / e-piano voicing          the guzheng's broken chord (strings of the pentatonic)
CH = {'Bm9':     (35, [57, 61, 62, 66], ['B3', 'F#4', 'A4', 'D5', 'E5']),
      'Gmaj7':   (31, [54, 59, 62, 66], ['D4', 'F#4', 'B4', 'D5', 'F#5']),
      'Dmaj9':   (38, [54, 57, 61, 64], ['D4', 'A4', 'E5', 'F#5', 'A5']),
      'Asus2/C#':(37, [52, 57, 59, 64], ['A3', 'E4', 'A4', 'B4', 'E5']),
      'Em9':     (40, [54, 59, 62, 67], ['E4', 'B4', 'D5', 'F#5', 'B5']),
      'A6sus':   (33, [52, 57, 59, 62], ['A3', 'E4', 'B4', 'D5', 'F#5']),
      'Gmaj9':   (31, [54, 57, 59, 62], ['D4', 'A4', 'B4', 'F#5', 'A5']),
      'F#m7':    (42, [52, 57, 61, 64], ['F#4', 'A4', 'E5', 'F#5', 'A5']),
      'A13sus4': (33, [55, 59, 62, 66], ['A3', 'D4', 'B4', 'E5', 'F#5']),
      'Gmaj7#11':(31, [54, 59, 61, 66], ['D4', 'B4', 'E5', 'F#5', 'B5']),
      'A7sus4':  (33, [55, 59, 62, 64], ['A3', 'D4', 'E4', 'A4', 'D5']),
      'D69':     (38, [54, 57, 59, 64, 66], ['D4', 'A4', 'B4', 'E5', 'F#5'])}   # the landing: the pentatonic as one chord
A_ = {0: 'Bm9', 1: 'Gmaj7', 2: 'Dmaj9', 3: 'Asus2/C#'}
HARM = {-13: 'Gmaj7#11', -12: 'Gmaj7#11', -11: 'Bm9', -10: 'Bm9', -9: 'Gmaj7', -8: 'Gmaj7', -7: 'Dmaj9', -6: 'Asus2/C#', -5: 'Bm9', -4: 'Gmaj7',
        -3: 'Dmaj9', -2: 'Em9', -1: 'A7sus4',
        4: 'Em9', 5: 'Gmaj7', 6: 'Bm9', 7: 'A6sus', 8: 'Gmaj9', 9: 'F#m7', 10: 'Em9', 11: 'A13sus4', 12: 'Gmaj7#11', 13: 'Gmaj7#11',
        14: 'Em9', 15: 'A7sus4', 20: 'D69'}
for k in range(4): HARM[k] = HARM[k + 16] = A_[k]
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]
    if isinstance(h, str): return [(0, 4, h)]
    return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]
def chord_at(bar, beat): return next(c for b0, b1, c in chords_in(bar) if b0 <= beat < b1)
def spans(bar0, bar1):   # the chords of bars bar0..bar1-1 as (start s, length s, chord); a chord held over bars is one span
    out = []
    for bar in range(bar0, bar1):
        for b0, b1, c in chords_in(bar):
            t0, ln = S.t(bar, b0), (b1 - b0) * b
            if out and out[-1][2] == c and abs(out[-1][0] + out[-1][1] - t0) < 1e-6: out[-1] = (out[-1][0], out[-1][1] + ln, c)
            else: out.append((t0, ln, c))
    return out

# ================================================================ the tunes (sixteenth, length in sixteenths, note[, bend]) ======
HOOK = {0: [(0, 4, 'F#5'), (4, 2, 'A5'), (6, 2, 'B5'), (8, 6, 'D6', ROCK), (14, 2, 'E6')],
        1: [(0, 4, 'D6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 8, 'B5', ROCK)],
        2: [(0, 4, 'A5'), (4, 2, 'F#5'), (6, 2, 'E5'), (8, 4, 'F#5'), (12, 2, 'A5'), (14, 2, 'D6')],
        3: [(0, 6, 'E6', PRESS), (6, 2, 'D6'), (8, 4, 'B5'), (12, 4, 'A5', ROCK)]}
ANSWER = {6: [(0, 4, 'B5'), (4, 2, 'D6'), (6, 2, 'E6'), (8, 6, 'F#6', ROCK), (14, 2, 'E6')],
          7: [(0, 4, 'D6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 8, 'F#5', ROCK)]}
CADENCE = [(0, 6, 'E6', PRESS), (6, 2, 'D6'), (8, 2, 'B5'), (10, 2, 'A5'), (12, 2, 'B5'), (14, 2, 'E6')]
THEME = [(0, 8, 'B5', 0.9), (8, 4, 'A5', 0.85), (12, 4, 'F#5', 0.85, -1.5), (16, 6, 'A5', 0.9, -2.0), (22, 2, 'B5', 0.8), (24, 8, 'E6', 1.0, -2.0),
         (32, 8, 'D6', 0.95), (40, 4, 'B5', 0.85), (44, 4, 'A5', 0.85), (48, 8, 'E6', 1.0, -2.0), (56, 6, 'D6', 0.9)]   # the erhu, bars 8-11

drums, perc, bass_b, pad, keys, zh, arp, dz, eh, gong, fx = (S.bus(x) for x in 'drums perc bass pad keys guzheng arp dizi erhu gong fx'.split())
kicks = []

def play(bar, phrase, gain, pan=-0.1, bright=0.65, vel=1.0, seed0=0, octave=0):
    """the guzheng plays a phrase (its bends on the long notes)"""
    for i, note in enumerate(phrase):
        p, ln, name = note[:3]; bend = note[3] if len(note) > 3 else None; m = nm(name) + 12 * octave
        d = ln * s16; ring = 0.6 if ln > 2 else 0.35
        zh.add(guzheng(mtof(m), d + ring, vel * hum(0.05) * (1.05 if p % 4 == 0 else 0.97), bend, bright, 2.2, seed=seed0 + (bar + 20) * 37 + i), T(bar, p), gain, pan)

def sweep(bus, t_end, lo, hi, span, gain, pan=(-0.5, 0.5), down=False, seed=0):
    """the hand sweeping across the guzheng's strings (lo..hi, midi), the last string arriving at t_end"""
    st = [m for m in ZHENG if lo <= m <= hi]; st = st[::-1] if down else st; k = len(st)
    for i, m in enumerate(st):
        x = i / max(1, k - 1)
        bus.add(guzheng(mtof(m), 1.6, 0.45 + 0.45 * x, None, 0.6, 1.6, seed=seed + i), t_end - span * (1 - x), gain, pan[0] + (pan[1] - pan[0]) * x)

def yao(bus, t0, m, dur, gain, pan=0.0, seed=0, swell=(0.5, 1.0)):   # the guzheng's tremolo (yao zhi: the pick shaken on one string)
    k = int(dur / (s16 * 0.5))
    for i in range(k):
        x = i / max(1, k - 1)
        bus.add(guzheng(mtof(m), s16 * 1.4, (swell[0] + (swell[1] - swell[0]) * x) * (1 if i % 2 == 0 else 0.8), None, 0.62, 1.0, seed=seed + i), t0 + i * s16 * 0.5, gain, pan)

APAT = [0, 2, 4, 3, 1, 3, 4, 2, 0, 2, 3, 4, 1, 3, 4, 2]       # which string of the broken chord each sixteenth
def arp_bar(bar, gain, step=2, octave=0, upto=16, ring=0.9):
    for b0, b1, c in chords_in(bar):
        tones = [nm(x) + 12 * octave for x in CH[c][2]]
        for p in range(4 * b0, min(4 * b1, upto), step):
            v = (1.0 if p % 4 == 0 else 0.7) * hum(0.1)
            arp.add(guzheng(mtof(tones[APAT[p]]), ring, 0.5 * v + 0.25, None, 0.55, 1.6, seed=(bar + 20) * 16 + p + 999), T(bar, p), gain * v, pan=(-0.55 if p % 4 < 2 else 0.55))

def pad_bar(bar, gain, cutoff=2600, a=0.15, r=0.8):
    for t0, ln, c in spans(bar, bar + 1):
        for j, m in enumerate(CH[c][1][:4]): pad.add(voice_pad(mtof(m), ln, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), t0, gain, pan=[-0.7, -0.25, 0.25, 0.7][j])

def keys_bar(bar, gain, rhythm=((0, 6), (7, 3), (10, 6)), vel=0.5):
    for p, ln in rhythm:
        c = chord_at(bar, p / 4)
        for j, m in enumerate(CH[c][1][:4]): keys.add(epiano(mtof(m + 12), ln * s16, vel * hum(0.08)), T(bar, p) + 0.004 * j, gain, pan=-0.35 + 0.23 * j)

def bass_bar(bar, gain, reese_=0.0, upto=16):
    """the sub follows the kick: the root held from the downbeat, again on the kick before the second snare"""
    for b0, b1, c in chords_in(bar):
        R = CH[c][0] + (12 if CH[c][0] < 33 else 0)
        for p, ln in ((0, 9), (10, 6)):
            if 4 * b0 <= p < min(4 * b1, upto):
                ln_ = min(ln, upto - p); bass_b.add(sub(mtof(R), ln_ * s16 * 0.95, 1.0), T(bar, p), gain)
                if reese_: bass_b.add(reese(mtof(R + 12), ln_ * s16 * 0.9, 700 + 500 * (p == 0)), T(bar, p), reese_)

# drum sounds, made once
KICK = kick(dur=0.3, f0=160, f1=52, sweep=0.03, click=0.6, drive=1.8); KICK[-1500:] *= np.linspace(1, 0, 1500) ** 2
SNR = snare(0.26, tone=215, snappy=1.0, seed=4); GHOST = [snare(0.12, tone=240, snappy=0.7, seed=10 + s) for s in range(3)]; CLP = clap(seed=6)
HC = [hat(0.04, seed=s, tone=8500) for s in range(4)]; HO = [hat(open_=True, seed=s + 10, tone=7500) * 0.7 for s in range(2)]
SHK = [shaker(0.06, seed=s) for s in range(4)]
def K(t, g=0.55, lpf=None): drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
BREAK = {'k': [(0, 1.0), (10, 0.9)], 'k2': [(0, 1.0), (7, 0.6), (10, 0.9)], 'g': [(7, 0.5), (9, 0.35), (14, 0.4), (15, 0.3)]}
def breakbeat(bar, g=1.0, upto=16, var=0, ride_=False, lpf=None):
    """the two-step break: the kick on 1 and on the 'and' of 3, the snare on 2 and 4, ghost notes, shuffled hats"""
    for p, v in BREAK['k2' if var else 'k']:
        if p < upto: K(T(bar, p), 0.55 * v * g, lpf)
    for p in (4, 12):
        if p < upto: drums.add(SNR if lpf is None else lp(SNR, lpf), T(bar, p), 0.42 * g * hum(0.05), pan=0.04); drums.add(CLP, T(bar, p), 0.12 * g, pan=0.06)
    for p, v in BREAK['g']:
        if p < upto: drums.add(GHOST[p % 3], T(bar, p, SW), 0.12 * v * g * hum(0.2), pan=-0.08)
    for p in range(0, upto, 2): perc.add(HC[p % 4], T(bar, p, SW), g * (0.2 if p % 4 == 2 else 0.12) * hum(0.12), pan=0.35)
    for p in range(1, upto, 2): perc.add(SHK[p % 4], T(bar, p, SW), g * 0.07 * hum(0.15), pan=-0.4)
    if ride_:
        for p in range(0, upto, 4): perc.add(ride(0.6, seed=p), T(bar, p + 2), 0.12 * g, pan=-0.3)
    elif upto > 14: perc.add(HO[bar % 2], T(bar, 14, SW), 0.12 * g, pan=0.3)

def roll(t0, t1, n0, n1, g0, g1, tone0=200, tone1=280):   # a snare roll, faster and louder towards t1
    t = t0; i = 0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.14, tone=tone0 + (tone1 - tone0) * x, seed=i % 97), t, g0 + (g1 - g0) * x ** 1.4, pan=0.05)
        t += b / (n0 + (n1 - n0) * x); i += 1

def gap(t1, buses):   # an eighth of air before the hit at t1: these buses fade out (15 ms) at t1 - b/2 and come back at t1
    x = np.arange(S.n) / SR; g = np.clip(1 - (x - (t1 - b / 2)) / 0.015, 0, 1) + np.clip((x - t1 + 0.004) / 0.004, 0, 1)
    for bus in buses: bus.curve(np.minimum(g, 1.0))

def blow(bar, notes, gain, pan=0.15, **kw):   # a dizi phrase: [(sixteenth from the bar, length, note, level)]
    t0 = T(bar, notes[0][0]); dz.add(dizi([(T(bar, p) - t0, ln * s16, nm(x), lv) for p, ln, x, lv in notes], **kw), t0, gain, pan)
def bow(bar, notes, gain, pan=-0.15, **kw):   # an erhu phrase: [(sixteenth, length, note, level[, slide])]
    t0 = T(bar, notes[0][0]); eh.add(erhu([(T(bar, nt[0]) - t0, nt[1] * s16, nm(nt[2]), nt[3]) + tuple(nt[4:]) for nt in notes], **kw), t0, gain, pan)
def as_line(phrases, lv=0.9):   # guzheng phrases (one per bar) as one legato line for the dizi
    return [(16 * k + nt[0], nt[1], nt[2], lv + 0.1 * (nt[1] >= 4)) for k, ph in enumerate(phrases) for nt in ph]

# ================================================================ INTRO: the globe (bars -13..-1) ================================
I0 = S.t(-13)                                                    # 1.67 s
d_ = S.t(0) - I0 + 1.5; ml, mr = mist(d_, 1), mist(d_, 2); x = np.linspace(0, 1, len(ml))
mg = np.clip(x / 0.08, 0, 1) * (0.65 + 0.35 * x) * np.clip((S.t(0) + 0.3 - I0 + 0.8 - np.arange(len(ml)) / SR) / 3.0, 0, 1)
fx.add((ml * mg, mr * mg), I0 - 0.8, 0.42)
gong.add(tamtam(7.0, seed=1, swell=1.5), I0, 0.32, pan=-0.1)
sweep(zh, S.t(-12), nm('D4'), nm('A6'), 1.0, 0.2, pan=(-0.6, 0.6), seed=100)      # the curtain: a sweep up the strings
for t0, ln, c in spans(-13, -2):                                 # the pad, opening
    x = (t0 - I0) / (S.t(-2) - I0)
    for j, m in enumerate(CH[c][1][:4]):
        pad.add(voice_pad(mtof(m), ln, cutoff=700 + 1900 * x, a=1.6 if x < 0.1 else 0.5, r=1.0, voices=5, seed=m + j), t0, 0.27 + 0.16 * x, pan=[-0.7, -0.25, 0.25, 0.7][j])
for t0, ln, c in spans(-13, -6): bass_b.add(voice_sub(mtof(CH[c][0] + (12 if CH[c][0] < 33 else 0)), ln - 0.1, a=1.2, r=0.8), t0, 0.035)
# the guzheng outlines the hook in long, pressed notes; the erhu far away
for bar, ph in ((-11, [(0, 8, 'F#5'), (8, 8, 'B5', ROCK)]), (-10, [(0, 12, 'D6', PRESS)]), (-9, [(0, 8, 'B5'), (8, 8, 'A5', ROCK)]), (-8, [(4, 12, 'F#5', ROCK)])):
    play(bar, ph, 0.5, pan=-0.15, vel=0.8, seed0=300)
bow(-7, [(0, 8, 'A5', 0.8, -2.0), (8, 4, 'F#5', 0.75), (12, 4, 'E5', 0.75), (16, 12, 'F#5', 0.9, -1.5), (28, 4, 'A5', 0.8)], 0.36, pan=0.25, seed=1)
for bar in range(-7, -3): arp_bar(bar, 0.3 + 0.03 * (bar + 7), step=4 if bar < -5 else 2, ring=1.4)
for bar in (-5, -4, -3): keys_bar(bar, 0.15 + 0.02 * (bar + 5), rhythm=((0, 8), (10, 6)), vel=0.45)
gong.add(tamtam(5.0, seed=2, swell=1.0), S.t(-7), 0.2, pan=0.2)
for bar in (-5, -4, -3):                                         # a filtered beat, far away
    breakbeat(bar, 0.4 + 0.1 * (bar + 5), lpf=600 if bar < -3 else 1200)
    for b0, b1, c in chords_in(bar): bass_b.add(sub(mtof(CH[c][0] + (12 if CH[c][0] < 33 else 0)), (b1 - b0) * b * 0.95, 0.6, 0.2), S.t(bar, b0), 0.18)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
for bar in (-2, -1):
    breakbeat(bar, 0.6 if bar == -2 else 0.55, upto=16 if bar == -2 else 8)
    pad_bar(bar, 0.24, cutoff=1400 if bar == -2 else 2600, a=0.2)
    arp_bar(bar, 0.24, step=1, upto=16 if bar == -2 else 14, ring=0.5)
bass_bar(-2, 0.24); bass_b.add(sub(mtof(45), 7 * b / 2, 0.8), S.t(-1), 0.2)
yao(zh, S.t(-1), nm('A5'), 3.5 * b, 0.22, pan=0.1, seed=400, swell=(0.4, 1.0))
roll(S.t(-1), T(-1, 14), 4, 8, 0.1, 0.24)
fx.add(riser_cut(2 * B - b / 2, f0=300, f1=10000, seed=3), S.t(-2), 0.22)
gong.add(opera_gong(620, 1.0, True, seed=1), T(-1, 8), 0.3, pan=0.3)
fx.add(rev_crash(1.0, seed=5), S.t(0) - 1.0, 0.2)
gap(S.t(0), (pad, arp, perc, bass_b, drums, keys, zh))
blow(-1, [(14, 1, 'B4', 0.7), (15, 1, 'E5', 0.85)], 0.45, rel=0.03)      # the dizi's pickup (in the air)
sweep(zh, S.t(0) - 0.01, nm('A4'), nm('F#5'), s16 * 1.6, 0.26, pan=(-0.5, 0.2), seed=450)

# ================================================================ MAIN: the 99 bends (bars 0..19) ================================
fx.add(impact(2.5), S.t(0), 0.24); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
gong.add(tamtam(4.0, seed=3, swell=0.4), S.t(0), 0.3, pan=-0.2)
for bar in range(20):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'B' if bar < 12 else 'mist' if bar < 14 else 'climb' if bar < 16 else 'final'
    upto = 14 if bar == 19 else 16
    if sec in ('A', 'A2', 'B'):
        breakbeat(bar, var=bar % 4 == 3, ride_=sec == 'B'); bass_bar(bar, 0.4, reese_=0.12 if sec != 'A' else 0.0)
        pad_bar(bar, 0.24, cutoff=3200); keys_bar(bar, 0.17 if sec == 'A' else 0.2)
        if sec != 'A': arp_bar(bar, 0.22, step=2 if sec == 'A2' else 1, ring=0.7)
    elif sec == 'mist':
        pad_bar(bar, 0.3, cutoff=1700, a=0.5); keys_bar(bar, 0.14, rhythm=((0, 16),), vel=0.4)
        bass_b.add(sub(mtof(43), B * 0.95, 0.7), S.t(bar), 0.2)
        arp_bar(bar, 0.2, step=4, ring=1.6)
        for p in range(0, 16, 2): perc.add(SHK[p % 4], T(bar, p, SW), 0.05, pan=-0.4)
    elif sec == 'climb':
        breakbeat(bar, 0.85 + 0.1 * (bar - 14), upto=14 if bar == 15 else 16, var=1)
        bass_bar(bar, 0.36, reese_=0.1, upto=14 if bar == 15 else 16); pad_bar(bar, 0.22, cutoff=2200, a=0.2)
        arp_bar(bar, 0.24, step=1, ring=0.5, upto=14 if bar == 15 else 16)
    else:
        breakbeat(bar, upto=upto, var=bar % 2, ride_=True); bass_bar(bar, 0.4, reese_=0.16, upto=upto)
        pad_bar(bar, 0.24, cutoff=4200); keys_bar(bar, 0.2); arp_bar(bar, 0.2, step=2, octave=1, ring=0.6, upto=upto)
# the tunes
for bar in range(4): play(bar, HOOK[bar], 0.6)
for bar in (4, 5): play(bar, HOOK[bar - 4], 0.6)
for bar in (6, 7): play(bar, ANSWER[bar], 0.6)
blow(4, [(8, 2, 'F#6', 0.6), (10, 2, 'E6', 0.6), (12, 4, 'D6', 0.7)], 0.24, pan=0.45, seed=3)      # the dizi echoes a fragment
blow(5, [(8, 2, 'A6', 0.6), (10, 2, 'F#6', 0.6), (12, 4, 'E6', 0.7)], 0.24, pan=0.45, seed=4)
bow(8, THEME, 0.5, seed=2)
for bar in (8, 9, 10, 11): play(bar, [(0, 2, CH[HARM[bar]][2][3])], 0.3, pan=0.2, vel=0.7, seed0=700)   # the guzheng marks the bars
# the mist: the tam-tam, the dizi's ornamented phrase (grace notes before the long notes), a slow sweep down
gong.add(tamtam(6.0, seed=4, swell=1.0), S.t(12), 0.3, pan=0.15)
blow(12, [(0, 1, 'E6', 0.6), (1, 7, 'D6', 1.0), (8, 1, 'B5', 0.6), (9, 3, 'A5', 0.85), (12, 4, 'B5', 0.9), (16, 1, 'F#6', 0.6), (17, 7, 'E6', 1.0),
          (24, 2, 'D6', 0.8), (26, 2, 'B5', 0.8), (28, 4, 'A5', 0.9)], 0.38, seed=5, vib=0.28)
sweep(zh, S.t(13, 2), nm('D4'), nm('B6'), 1.2, 0.16, pan=(0.6, -0.6), down=True, seed=800)
yao(zh, S.t(15), nm('E6'), 3.5 * b, 0.2, pan=0.1, seed=820, swell=(0.4, 1.0))
gong.add(opera_gong(620, 1.0, True, seed=2), T(15, 8), 0.3, pan=0.3)
for bar in range(16, 19): play(bar, HOOK[bar - 16], 0.62)
play(19, CADENCE, 0.62)
blow(16, as_line([HOOK[0], HOOK[1]]), 0.3, seed=6, pan=0.3)
blow(18, as_line([HOOK[2], CADENCE]) + [(32, 10, 'F#6', 1.0)], 0.3, seed=7, pan=0.3, rel=0.5)
bow(16, [(0, 16, 'D5', 0.75, -2.0), (16, 16, 'B4', 0.75), (32, 16, 'A4', 0.75, -1.5), (48, 8, 'B4', 0.8), (56, 6, 'C#5', 0.8)], 0.32, pan=-0.35, seed=3)
# fills, crashes
fx.add(rev_crash(0.9, seed=7), S.t(4) - 0.9, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
roll(T(3, 12), T(3, 16), 4, 6, 0.06, 0.16); gong.add(opera_gong(500, 1.0, False, seed=3), T(7, 12), 0.22, pan=-0.3)
fx.add(rev_crash(0.9, seed=8), S.t(8) - 0.9, 0.18); fx.add(crash(2.0, seed=9), S.t(8), 0.22, pan=0.2)
roll(T(11, 8), T(11, 16), 4, 8, 0.06, 0.2)
fx.add(crash(2.5, seed=3), S.t(12), 0.2, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(12), 0.1)
fx.add(riser_cut(2 * B - b / 2, f0=400, f1=10000, seed=7), S.t(14), 0.24); roll(S.t(15), T(15, 14), 4, 8, 0.1, 0.26)
fx.add(rev_crash(1.0, seed=9), S.t(16) - 1.0, 0.2)
gap(S.t(16), (pad, arp, perc, bass_b, drums, keys, zh))
sweep(zh, S.t(16) - 0.01, nm('A4'), nm('F#5'), s16 * 1.6, 0.26, pan=(-0.5, 0.2), seed=850)
fx.add(crash(2.6, seed=4), S.t(16), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(16), 0.14); gong.add(tamtam(4.0, seed=5, swell=0.4), S.t(16), 0.26)
# the last bar into the landing: a roll, the opera gong, a riser, an eighth of air
roll(S.t(19, 2), T(19, 14), 4, 8, 0.1, 0.26); gong.add(opera_gong(620, 1.0, True, seed=4), T(19, 8), 0.26, pan=0.3)
fx.add(riser_cut(B - b / 2, f0=600, f1=11000, seed=8), S.t(19), 0.22); fx.add(rev_crash(1.2, seed=10), LAND - 1.2, 0.24)
gap(LAND, (pad, arp, perc, bass_b, drums, keys, zh, eh))

# ================================================================ LANDING: bar 20 = 48.2 s, the race starts ======================
K(LAND, 0.75); drums.add(SNR, LAND, 0.36); drums.add(CLP, LAND, 0.2)
gong.add(tamtam(3.0, seed=6, swell=0.3), LAND, 0.36); fx.add(impact(2.5, seed=5), LAND, 0.3); fx.add(crash(3.0, seed=6), LAND, 0.34, pan=0.1)
sweep(zh, LAND + 0.35, nm('D4'), nm('F#6'), 0.35, 0.22, pan=(-0.6, 0.6), seed=900)
for j, s in enumerate(['D4', 'A4', 'B4', 'E5', 'F#5', 'A5']): zh.add(guzheng(mtof(nm(s)), 2.4, 0.8, None, 0.65, 2.4, seed=950 + j), LAND + 0.012 * j, 0.3, pan=-0.5 + 0.2 * j)
for j, m in enumerate(CH['D69'][1]): pad.add(voice_pad(mtof(m), 1.0, cutoff=4200, a=0.01, r=1.3, seed=m), LAND, 0.24, pan=[-0.7, -0.35, 0, 0.35, 0.7][j])
for j, m in enumerate(CH['D69'][1]): keys.add(epiano(mtof(m + 12), 1.6, 0.6, r=0.8), LAND + 0.004 * j, 0.22, pan=-0.35 + 0.18 * j)
lb = sub(mtof(38), 2.3, 1.0); lb *= np.exp(-np.arange(len(lb)) / SR / 0.8); bass_b.add(lb, LAND, 0.45)

# ================================================================ MIX =============================================================
def duck(times, depth, release): return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)   # (smoothed: no click)
bass_b.curve(duck(kicks, 0.4, 0.1)); pad.curve(duck(kicks, 0.35, 0.18)); keys.curve(duck(kicks, 0.2, 0.12)); arp.curve(duck(kicks, 0.15, 0.1))
fc = curve([(0, 2600), (S.t(-3), 3000), (S.t(-2), 1200), (S.t(-1, 2), 4500), (S.t(0) - 0.05, 12000), (S.t(0), 16000), (S.t(12), 16000),
            (S.t(12, 1), 2200), (S.t(14), 2600), (S.t(16) - 0.05, 14000), (S.len, 16000)], log=True)
for x in (pad, arp): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 150)); keys.filt(lambda x: hp1(x, 160)); zh.filt(lambda x: hp1(x, 180) + 0.2 * bp(x, 2600, 0.3)); arp.filt(lambda x: hp1(x, 180))
dz.filt(lambda x: hp1(x, 300)); eh.filt(lambda x: hp1(x, 220)); gong.filt(lambda x: hp1(x, 45)); bass_b.filt(lambda x: hp1(x, 30)); perc.filt(lambda x: lp1(x, 13000))
pad.width(1.8); arp.width(1.5); zh.gain(1.3); bass_b.gain(0.55); dz.gain(1.6); eh.gain(1.4); gong.gain(1.3); perc.gain(1.5); perc.width(1.3)
tt = np.arange(S.n) / SR; trem = 0.18 * np.sin(TAU * 2.8 * tt); keys.L *= 1 + trem; keys.R *= 1 - trem
# sends: a large, soft hall (the mist and the cliffs), a short room for the break, echoes on the guzheng and the dizi
verb_in = S.bus()
for x, a in ((pad, 0.35), (keys, 0.2), (zh, 0.25), (arp, 0.35), (dz, 0.4), (eh, 0.35), (gong, 0.4), (fx, 0.2), (perc, 0.05), (drums, 0.03)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.35, decay=3.6, damp=0.3, predelay=0.03); vl, vr = vl * 1.25, vr * 1.25
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.45, decay=0.6, damp=0.4)
dzh = zh.send_delay(b * 0.75, 0.14, fb=0.3, damp=0.45); ddz = dz.send_delay(b * 1.5, 0.2, fb=0.35, damp=0.4)
BUSES = [drums, perc, bass_b, pad, keys, zh, arp, dz, eh, gong, fx, (vl, vr), (room_l, room_r), dzh, ddz]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in the intro and the main, before the master)
    for x in BUSES:
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x; nm_ = x.name if isinstance(x, Bus) else 'send'
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); print(f'{nm_:9s} {sec:5s} rms {20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/china', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.5, lows_db=-1.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
