"""Morocco (Marrakesh: a street circuit between the old town's pink walls, the palms and the Agdal gardens, the snowy High Atlas on the
horizon): desert trance. A guembri (the three-string bass lute with a camel-skin face, plucked and slapped with the thumb, its metal
rattle buzzing) plays the riff in the low register; qraqeb (pairs of iron castanets) clatter the long-short-short of the trance music
of the country's south; a darbuka drums its doum and tek; an oud plucks the hook; a rhaita (the shrill double-reed shawm of the
festivals and the city squares) sings the chorus; hand claps, a ney's breath over the globe, warm desert pads over a drone, and a
four-on-the-floor kick under it all. D minor, the chorus' cadence on the major dominant (A7 with the scale's Eb, the 'hijaz' colour)
and the landing on D major. 127.66 bpm: 15 bars from the drop to the race's start.
The hook: up a minor third and a step in the 3+3+2 lilt (A C D), a leap to the F, back down to the A; answered from the G below to a
long D; then the call reaches higher (F G A) and turns back to D. The chorus sings it a step at a time over Bb - C - Dm - A7.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind over the desert and the mountains, a drone and pads; the ney sings the hook at half speed;
                                     the guembri muffled, far away; the qraqeb come in softly and grow; the build: the darbuka's roll,
                                     the riser, a hand-clap pickup
    drop  (20.0 s)     bar 0         the groove, the guembri riff and the oud's hook
    A bars 0-3 (Dm), A' 4-7 (Dm C Bb A7: the claps, the oud's new answer), breath 8-9 (the drone, the rhaita alone in the hijaz
    mode, the qraqeb), chorus 10-13 (Bb C Dm A7: everything, the rhaita and the oud an octave apart), the run 14 (Bb A7, the rhaita
    climbing, the darbuka rolling), LANDING at bar 15 = 48.2 s on D major
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 15                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 127.66 bpm
B, b = S.bar, S.beat
LAND = 4 * N
def T(beat): return S.drop + beat * b
assert abs(S.main_bars - N) < 1e-9 and abs(T(LAND) - END) < 1e-9
rng = np.random.default_rng(17)
def hum(x=0.08): return 1 + rng.uniform(-x, x)
def curve(points): tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
def ramp(n, points): tp, vp = zip(*points); return np.interp(np.arange(n) / SR, tp, vp)

# ================================================================ instruments ======================================================
def guembri(f, dur=0.5, seed=0, slap=0.0, buzz=0.35):
    """the guembri: a low string over a skin (a dull, round pluck: Karplus-Strong, dark), the thumb's slap on the skin (a knock), and
    the sersera (the metal plate on its neck) buzzing along with the string"""
    seed = abs(int(seed)); y = pluck(f, dur + 0.05, 10 ** (-3 / (f * 1.1)), 0.35, seed, 0.2); n = len(y); t = np.arange(n) / SR
    body = lp(y, 700, 0.2) * 1.4 + bp(y, 160, 0.4) * 0.6
    env = lp1(np.abs(y), 30.0)
    rattle = bp(noise(n, seed + 3), 3200, 0.5) * env * buzz * 3.0
    knock = (bp(noise(n, seed + 5), 400, 0.5) * 1.2 + sine(110, n) * 0.6) * np.exp(-t / 0.012) * slap
    out = sat(body + rattle + knock, 1.5)
    k = int(0.02 * SR); out[-k:] *= np.linspace(1, 0, k)
    return out

def oud(f, dur=0.9, seed=0, bright=0.7):
    """the oud: a fretless lute, plucked with a long quill near the bridge (bright, quickly fading), its bowl's warm resonances"""
    seed = abs(int(seed)); y = pluck(f, dur + 0.3, 10 ** (-3 / (f * 0.9)), bright, seed, 0.11); n = len(y); t = np.arange(n) / SR
    y = hp(y, 120) * 0.8 + bp(y, 280, 0.45) * 0.5 + bp(y, 1400, 0.4) * 0.35
    y += hp(noise(n, seed + 9), 3000) * np.exp(-t / 0.0025) * 0.3
    return y

def reed_line(notes, seed=0, vib=0.35, tail=0.5, bright=1.0):
    """the rhaita, one breath line: notes (beat, beats, midi, how[, velocity]); how: 't' tongued, 's' slurred from the note before,
    'o' an ornament (a quick turn: the step above, the note, the step below), 'g' glided up from a step below. Two detuned reeds (a
    narrow pulse and a saw) through the shawm's bell (two formants), a strong vibrato on the held notes. Returns (start s, mono)."""
    t0 = T(notes[0][0]) - 0.1; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR)
    r = np.random.default_rng(seed); idx = lambda bt: int(round((T(bt) - t0) * SR))
    pitch = np.full(n, float(notes[0][2])); amp = np.zeros(n); vd = np.zeros(n)
    for i, nt in enumerate(notes):
        bt, ln, m, how = nt[:4]; vel = nt[4] if len(nt) > 4 else 1.0
        a = idx(bt); e = min(n, idx(bt + ln)); pitch[a:] = m
        if how == 's' and i:
            m0 = notes[i - 1][2]; k = int(0.04 * SR); seg = pitch[a:a + k]; pitch[a:a + k] = m0 + (m - m0) * (0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, len(seg))))
        if how == 'o':
            k = int(0.035 * SR); pitch[a:a + k] = m + 2; pitch[a + k:a + 2 * k] = m; pitch[a + 2 * k:a + 3 * k] = m - 1
        if how == 'g':
            k = int(0.07 * SR); seg = pitch[a:a + k]; pitch[a:a + k] = (m - 2) + 2 * np.linspace(0, 1, len(seg)) ** 1.5
        att = int((0.008 if how in 'to' else 0.03) * SR)
        seg = np.ones(e - a); seg[:att] = np.linspace(0.3 if how == 's' else 0.0, 1.0, len(seg[:att]))
        if i + 1 < len(notes) and notes[i + 1][3] != 's':
            g = int(0.025 * SR); seg[-g:] *= np.linspace(1, 0.3, len(seg[-g:]))
        amp[a:e] = np.maximum(amp[a:e], seg * vel)
        if ln * b > 0.3:
            v0 = a + int(0.12 * SR)
            if v0 < e: vd[v0:e] = vib * np.clip(np.arange(e - v0) / SR / 0.2, 0, 1)
    e_last = idx(notes[-1][0] + notes[-1][1]); amp[e_last:] = amp[e_last - 1] * np.exp(-np.arange(n - e_last) / SR / 0.06)
    amp = lp1(np.concatenate([np.zeros(64), amp]), 90.0)[64:]
    f = mtof(pitch + vd * np.sin(np.cumsum(TAU * 6.2 / SR * np.ones(n)) + r.random() * 6))
    x = pulse(f, n, 0.18) * 0.6 + saw(f * 1.004, n) * 0.5
    y = bp(x, 1150, 0.62) * 1.2 + bp(x, 2700 * bright, 0.55) * 0.8 + lp(x, 600) * 0.25 + hp(noise(n, seed + 1), 4000) * 0.05
    return t0, sat(y * amp, 1.3)

def ney(notes, seed=0):   # the ney (an end-blown reed flute: much breath, a soft, hollow tone), the same breath line as the rhaita
    t0 = T(notes[0][0]) - 0.1; t1 = T(notes[-1][0] + notes[-1][1]) + 0.8; n = int((t1 - t0) * SR); idx = lambda bt: int(round((T(bt) - t0) * SR))
    pitch = np.full(n, float(notes[0][2])); amp = np.zeros(n)
    for i, nt in enumerate(notes):
        bt, ln, m, how = nt[:4]; vel = nt[4] if len(nt) > 4 else 1.0; a = idx(bt); e = min(n, idx(bt + ln)); pitch[a:] = m
        if how == 's' and i: k = int(0.08 * SR); seg = pitch[a:a + k]; pitch[a:a + k] = notes[i - 1][2] + (m - notes[i - 1][2]) * np.linspace(0, 1, len(seg))
        att = int(0.12 * SR); seg = np.ones(e - a) * vel; seg[:att] *= np.linspace(0, 1, len(seg[:att])) ** 1.5; seg[-int(0.08 * SR):] *= np.linspace(1, 0.2, int(0.08 * SR))
        amp[a:e] = np.maximum(amp[a:e], seg)
    amp = lp1(np.concatenate([np.zeros(64), amp]), 25.0)[64:]
    t = np.arange(n) / SR; f = mtof(pitch + 0.15 * np.sin(TAU * 4.8 * t) * np.clip(amp, 0, 1))
    x = sine(f, n) + 0.3 * sine(2 * f, n, 0.25) + 0.1 * sine(3 * f, n, 0.6)
    br = bp(noise(n, seed), f * 1.5, 0.55) * 1.6 + bp(noise(n, seed + 1), 2500, 0.2) * 0.4
    return t0, (x * 0.7 + br * 0.5) * amp

def qraqeb(seed=0, dur=0.12, open_=1.0):   # a pair of iron castanets struck together: inharmonic metal ringing, a sharp clack
    n = int(dur * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); x = np.zeros(n)
    for k, fr in enumerate((2300, 3450, 4700, 6100, 7900)):
        x += bp(noise(n, seed * 7 + k), fr * (1 + 0.03 * r.standard_normal()), 0.9) * (1.0 - 0.12 * k)
    clack = hp(noise(n, seed + 99), 2000) * np.exp(-t / 0.002)
    return (x * np.exp(-t / (0.03 * open_)) + clack * 0.8) * 0.5

def doum(seed=0): n = int(0.4 * SR); t = np.arange(n) / SR; return sat(sine(92 * (1 + 0.5 * np.exp(-t / 0.02)), n) * np.exp(-t / 0.2) + lp(noise(n, seed), 600) * np.exp(-t / 0.02) * 0.4, 1.3)
def tek(seed=0, soft=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return ((bp(noise(n, seed), 3300, 0.5) * 1.1 + sine(720, n) * 0.5) * np.exp(-t / 0.012) + hp(noise(n, seed + 1), 6000) * np.exp(-t / 0.003) * 0.5) * soft

def wind(dur, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = 600 * 2 ** (1.1 * np.sin(TAU * t / (10.0 + 2.5 * k) + 1.1 * k) + 0.35 * np.sin(TAU * t / 3.3 + k))
        out.append(bp(noise(n, seed + k), fc, 0.7) * (0.65 + 0.35 * np.sin(TAU * t / 6.1 + 2 * k)))
    return tuple(out)

def impact_d(dur=3.0, seed=0):   # the boom on the drop and the landing, tuned to D
    n = int(dur * SR); t = np.arange(n) / SR
    boom = np.tanh(sine(73.4 * (1 + 1.7 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.6) * 1.8) * 0.6 + sine(36.7, n) * np.exp(-t / 0.5) * np.clip(t / 0.008, 0, 1) * 0.3
    return boom + lp(noise(n, seed), 1000) * np.exp(-t / 0.3) * 0.3

def rev_cymbal(dur, seed=0): x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

# ================================================================ harmony ========================================================
CH = {'Dm':     (38, [57, 62, 65, 69]),          # A3 D4 F4 A4
      'C':      (36, [55, 60, 64, 67]),          # G3 C4 E4 G4
      'Bbmaj7': (34, [57, 62, 65, 69]),          # A3 D4 F4 A4 over Bb
      'A7':     (33, [55, 61, 64, 67]),          # G3 C#4 E4 G4 over A
      'D5':     (38, [50, 57, 62, 69]),          # the drone: D3 A3 D4 A4 (no third: the hijaz mode over it)
      'D':      (38, [54, 57, 62, 66, 69]),      # the landing: F#3 A3 D4 F#4 A4
      'Dsky':   (38, [50, 57, 62, 64, 69]),      # the globe: D3 A3 D4 E4 A4 (open)
      'Dmsky':  (38, [50, 57, 62, 65, 69]),      # the globe: D3 A3 D4 F4 A4
      'Csky':   (36, [48, 55, 62, 64, 67]),      # the globe: C3 G3 D4 E4 G4 (Cadd9)
      'Gm7':    (43, [55, 58, 62, 65])}          # G3 Bb3 D4 F4
CHORDS = [(-48, -36, 'Dsky'), (-36, -24, 'Dmsky'), (-24, -16, 'Csky'), (-16, -8, 'Bbmaj7'), (-8, -4, 'Gm7'), (-4, 0, 'A7'),   # intro
          (0, 16, 'Dm'),                                                                            # A: the riff on D
          (16, 20, 'Dm'), (20, 24, 'C'), (24, 28, 'Bbmaj7'), (28, 32, 'A7'),                      # A': i VII VI V
          (32, 40, 'D5'),                                                                           # breath: the drone
          (40, 44, 'Bbmaj7'), (44, 48, 'C'), (48, 52, 'Dm'), (52, 56, 'A7'), (56, 58, 'Bbmaj7'), (58, 60, 'A7'),   # chorus, the run
          (60, 80, 'D')]                                                                            # the landing
def chord_at(beat): return next(c for s, e, c in CHORDS if s <= beat < e)
KIND = {'Dm': 'm', 'C': 'dom', 'Bbmaj7': 'maj7', 'A7': 'dom', 'D5': 'hijaz', 'D': 'dom', 'Dsky': 'm', 'Dmsky': 'm', 'Csky': 'dom', 'Gm7': 'm'}
PANS = {4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8), 6: (-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)}

# ================================================================ the tunes =======================================================
#   the hook (oud): A C D in 3+3+2, a leap to F, back to A; from G below to a long D; the call higher (F G A), back to D
HOOK = [(0.0, 0.75, 69), (0.75, 0.75, 72), (1.5, 0.5, 74), (2.0, 0.75, 77), (2.75, 0.25, 74), (3.0, 0.5, 72), (3.5, 0.5, 69),
        (4.0, 0.75, 67), (4.75, 0.75, 69), (5.5, 0.5, 72), (6.0, 1.5, 74), (7.5, 0.5, 72),
        (8.0, 0.75, 69), (8.75, 0.75, 72), (9.5, 0.5, 74), (10.0, 0.75, 77), (10.75, 0.75, 79), (11.5, 0.5, 81),
        (12.0, 0.5, 79), (12.5, 0.5, 77), (13.0, 0.5, 74), (13.5, 0.5, 72), (14.0, 2.0, 74)]
ANS2 = [(24.0, 0.75, 77), (24.75, 0.75, 74), (25.5, 0.5, 70), (26.0, 1.0, 69), (27.0, 0.5, 70), (27.5, 0.5, 74),     # over Bbmaj7
        (28.0, 0.5, 70), (28.5, 0.5, 69), (29.0, 0.5, 73), (29.5, 0.5, 76), (30.0, 0.75, 79), (30.75, 0.25, 77), (31.0, 0.5, 76), (31.5, 0.5, 73)]   # A7: Bb A C# E G F E C#
OUD = HOOK + [(nt[0] + 16,) + nt[1:] for nt in HOOK[:12]] + ANS2
#   the rhaita: the breath (alone, hijaz on D: D Eb F# G A Bb C), the chorus, the run, the landing
BREATH = [(32.5, 1.5, 81, 'g', 0.8), (34.0, 0.5, 82, 'o', 0.85), (34.5, 0.5, 81, 't', 0.8), (35.0, 1.0, 79, 's', 0.8),
          (36.0, 0.5, 78, 't', 0.85), (36.5, 0.5, 79, 't', 0.85), (37.0, 0.5, 78, 's', 0.8), (37.5, 0.5, 75, 't', 0.8), (38.0, 1.75, 74, 's', 0.8)]
CHORUS = [(40.0, 0.75, 86, 't'), (40.75, 0.75, 84, 't'), (41.5, 0.5, 86, 't'), (42.0, 1.0, 89, 'o'), (43.0, 0.5, 86, 't'), (43.5, 0.5, 84, 't'),
          (44.0, 0.75, 84, 't'), (44.75, 0.75, 82, 't'), (45.5, 0.5, 84, 't'), (46.0, 1.0, 88, 'o'), (47.0, 0.5, 86, 't'), (47.5, 0.5, 84, 't'),
          (48.0, 0.75, 81, 't'), (48.75, 0.75, 84, 't'), (49.5, 0.5, 86, 't'), (50.0, 1.0, 89, 'o'), (51.0, 0.5, 91, 't'), (51.5, 0.5, 89, 't'),
          (52.0, 0.75, 88, 't'), (52.75, 0.25, 89, 't'), (53.0, 0.5, 88, 's'), (53.5, 0.5, 85, 't'), (54.0, 0.5, 82, 't'), (54.5, 0.5, 81, 't'),
          (55.0, 0.5, 85, 't'), (55.5, 0.5, 88, 't'),
          (56.0, 0.5, 89, 't'), (56.5, 0.5, 91, 't'), (57.0, 1.0, 93, 'o'), (58.0, 0.5, 91, 't'), (58.5, 0.25, 89, 't'), (58.75, 0.25, 88, 's'),
          (59.0, 0.5, 85, 't'), (59.5, 0.5, 88, 't'),
          (LAND, 3.5, 86, 'g')]                                                                       # ... the D on the race's start
#   the ney over the globe: the hook at half speed
FAR = [(-36.0, 1.5, 69, 't'), (-34.5, 1.5, 72, 's'), (-33.0, 1.0, 74, 's'), (-32.0, 1.5, 77, 's'), (-30.5, 0.5, 74, 's'), (-30.0, 1.0, 72, 's'), (-29.0, 3.0, 69, 's'),
       (-24.0, 1.5, 67, 't'), (-22.5, 1.5, 69, 's'), (-21.0, 1.0, 72, 's'), (-20.0, 4.0, 74, 's')]
for nt in [(a, l, m, 'p') for a, l, m in OUD] + BREATH + CHORUS + FAR:   # (a check: no held note a half step above a chord tone)
    c = chord_at(nt[0]); pcs = {CH[c][0] % 12} | {m % 12 for m in CH[c][1]}
    assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)

drums, perc, gb, ou, rh, pad, far, fx, air, hands = (S.bus(x) for x in 'drums perc guembri oud rhaita pad far fx air hands'.split())
kicks = []

# ================================================================ players ========================================================
KICK = kick(0.34, f0=140, f1=46, sweep=0.034, click=0.4, drive=1.5)
QQ = [qraqeb(k) for k in range(6)]; QQo = [qraqeb(10 + k, 0.2, 2.2) for k in range(2)]
DOUM = [doum(k) for k in range(2)]; TEK = [tek(k) for k in range(4)]; KA = [tek(20 + k, 0.5) for k in range(4)]
CLAP = [clap(seed=k) for k in range(4)]; HH = [hat(0.04, seed=k, tone=9500) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8200) for k in range(2)]
def K(beat, g=0.5): drums.add(KICK, T(beat), g); kicks.append(T(beat))

RIFF = [(0, 0, 1.0, 0.6), (3, 0, 0.7, 0.0), (4, 12, 0.6, 0.8), (6, 10, 0.8, 0.0), (7, 12, 0.55, 0.5), (8, 7, 0.9, 0.0),
        (10, 10, 0.7, 0.0), (11, 7, 0.6, 0.4), (12, 5, 0.9, 0.0), (14, 3, 0.7, 0.0), (15, 5, 0.6, 0.5)]   # (16th, degree, velocity, slap)
DEG = {'m': {0: 0, 12: 12, 10: 10, 7: 7, 5: 5, 3: 3}, 'dom': {0: 0, 12: 12, 10: 10, 7: 7, 5: 5, 3: 4},
       'maj7': {0: 0, 12: 12, 10: 11, 7: 7, 5: 5, 3: 4}, 'hijaz': {0: 0, 12: 12, 10: 10, 7: 7, 5: 5, 3: 1}}
def guembri_bar(bar, g=0.45, upto=16, dark=False):
    for k, d, v, sl in RIFF:
        if k >= upto: continue
        beat = 4 * bar + k / 4; c = chord_at(beat); root = CH[c][0]
        while root > 40: root -= 12
        m = root + DEG[KIND[c]][d]; x = guembri(mtof(m), 0.45 if k % 4 else 0.6, seed=bar * 16 + k, slap=sl)
        gb.add(lp(x, 500) if dark else x, T(beat + (0.02 if k % 2 else 0.0)), g * v * hum(0.06))

def qraqeb_bar(bar, g=0.2, accent=1.0, upto=4.0):   # per beat: TAK . ta-tak (the long-short-short of the trance music)
    for q in range(4):
        if q >= upto: break
        for o, v in ((0.0, 1.0), (0.5, 0.62), (0.75, 0.8)):
            beat = 4 * bar + q + o; perc.add(QQ[int(rng.integers(6))], T(beat) + rng.normal(0, 0.003), g * v * (accent if o == 0 else 1.0) * hum(0.1), pan=-0.6 if o else -0.45)

def darbuka_bar(bar, g=0.3, fill=False):   # the maqsum: doum tek . tek doum . tek . (in eighths), ka between
    pat = [('D', 0.0), ('T', 0.5), ('T', 1.5), ('D', 2.0), ('T', 3.0)] + ([('K', 0.75), ('K', 2.75), ('K', 3.5), ('K', 3.75)] if fill else [('K', 2.5)])
    for kind, o in pat:
        beat = 4 * bar + o
        if kind == 'D': perc.add(DOUM[int(o) % 2], T(beat), g * 1.1 * hum(0.06), pan=0.15)
        elif kind == 'T': perc.add(TEK[int(o * 2) % 4], T(beat), g * 0.75 * hum(0.08), pan=0.5)
        else: perc.add(KA[int(o * 4) % 4], T(beat), g * 0.6 * hum(0.12), pan=0.6)

def oud_line(notes, g=0.22, up=0, pan=-0.2, seed0=0):
    for i, (bt, ln, m) in enumerate(notes):
        ou.add(oud(mtof(m + up), max(0.4, ln * b + 0.2), seed=seed0 + i, bright=0.72), T(bt) + rng.normal(0, 0.004), g * hum(0.06), pan=pan)
        if ln >= 1.0:   # the oud's tremolo (risha) on the held notes
            for k in range(1, int(ln * 4)): ou.add(oud(mtof(m + up), 0.25, seed=seed0 + 50 * i + k, bright=0.6), T(bt + k / 4), g * 0.45 * hum(0.1), pan=pan)

def pad_chords(b0, b1, gain, cutoff=2500, a=0.4, r=1.0):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        vs = CH[c][1]
        for j, m in enumerate(vs): pad.add(voice_pad(mtof(m), (e0 - s0) * b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=m + 5 * j), T(s0), gain, pan=PANS[len(vs)][j])

def drone(b0, b1, gain):   # the drone under it all: D, its fifth and octave (a low organ-ish reed)
    for m, p in ((38, 0.0), (45, -0.3), (50, 0.3)):
        pad.add(voice_reed(mtof(m), (b1 - b0) * b, bright=0.5, a=1.5, r=1.5, vib=0.0), T(b0), gain, pan=p)

def claps(bar, g=0.16):   # the hand claps: the qraqeb's long-short-short on beats 2 and 4, and a call on the and-of-4
    for q in (1, 3):
        for o, v in ((0.0, 1.0), (0.5, 0.6), (0.75, 0.75)): hands.add(CLAP[int(rng.integers(4))], T(4 * bar + q + o) + rng.normal(0, 0.004), g * v * hum(0.1), pan=float(rng.uniform(-0.5, 0.5)))

# ================================================================ INTRO: the globe (bars -11..-1) ================================
wl, wr = wind(T(-2) + 0.5, seed=21); wg = ramp(len(wl), [(0, 0), (0.3, 0), (3.0, 1.0), (T(-12), 0.9), (T(-4), 0.4), (T(-1), 0.0), (99, 0)])
air.add((wl * wg, wr * wg), 0.0, 0.12)
pad_chords(-48, -16, 0.15, cutoff=1400, a=2.5, r=1.8); pad_chords(-16, 0, 0.15, cutoff=1800, a=0.6, r=1.0)
drone(-48, -16, 0.05)
t0, x = ney(FAR, seed=3); far.add(x, t0, 0.24, pan=0.1)
for bar in range(-6, -2): guembri_bar(bar, 0.2 + 0.04 * (bar + 6), upto=8 if bar < -4 else 16, dark=True)
for bar in range(-8, -2): qraqeb_bar(bar, 0.04 + 0.025 * (bar + 8), upto=2 if bar < -6 else 4)
for k in (-16, -12): perc.add(DOUM[0], T(k), 0.18)
# --- the build (bars -2, -1): the kick, the darbuka rolling up, the riser, the claps' pickup
for k in range(8): K(-8 + k, 0.34 + 0.015 * k)
for bar in (-2, -1): guembri_bar(bar, 0.36, upto=12 if bar == -1 else 16); qraqeb_bar(bar, 0.22)
for k in range(24): perc.add(KA[k % 4] if k % 3 else TEK[k % 4], T(-6 + k / 4), 0.1 + 0.012 * k, pan=0.35)
for k in range(8): perc.add(TEK[k % 4], T(-1 + k / 8), 0.32 + 0.02 * k, pan=0.3)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.28); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.28)
for o in (-1.0, -0.5, -0.25): hands.add(CLAP[int(o * 8) % 4], T(o), 0.2, pan=0.2)

# ================================================================ MAIN (bars 0..14) =================================================
fx.add(impact_d(3.0, seed=1), T(0), 0.48); perc.add(crash(2.8, seed=41), T(0), 0.28, pan=-0.35); perc.add(crash(2.8, seed=42), T(0), 0.22, pan=0.35)
for bar in range(N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec != 'BR':
        for k in range(4): K(t4 + k, 0.5)
        for k in range(4): perc.add(OH[k % 2], T(t4 + k + 0.5), 0.07 if sec == 'A' else 0.1, pan=0.4)
        if sec != 'A':
            for k in range(16): perc.add(HH[k % 4], T(t4 + k / 4), (0.05 if k % 2 else 0.035) * hum(0.15), pan=0.5)
        guembri_bar(bar, 0.46)
        qraqeb_bar(bar, 0.22 if sec == 'A' else 0.26, accent=1.2)
        darbuka_bar(bar, 0.28 if sec == 'A' else 0.32, fill=bar in (3, 7, 13, 14))
        if sec != 'A': claps(bar, 0.12 if sec == 'A2' else 0.16)
    else:
        guembri_bar(bar, 0.36, upto=8 if bar == 8 else 16)
        qraqeb_bar(bar, 0.18 if bar == 8 else 0.22)
        if bar == 8: K(t4, 0.42); perc.add(crash(2.6, seed=8), T(t4), 0.2, pan=-0.3); fx.add(downlifter(B, seed=2), T(t4), 0.16)
        else:
            for k in range(4): K(t4 + k, 0.3 + 0.05 * k)
            for k in range(16): perc.add(KA[k % 4] if k % 2 else TEK[k % 4], T(t4 + k / 4), 0.1 + 0.015 * k, pan=0.35)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.24); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.26)
    if bar in (4, 10): perc.add(crash(2.6, seed=bar), T(t4), 0.26, pan=0.3)
    if bar == 14:
        for k in range(16): perc.add(TEK[k % 4], T(t4 + k / 4), 0.14 + 0.016 * k, pan=0.3 - 0.04 * k)
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.28)
pad_chords(0, 32, 0.1); pad_chords(32, 40, 0.12, cutoff=1600, a=0.8, r=1.0); pad_chords(40, LAND, 0.13, cutoff=3200)
drone(0, 40, 0.035); drone(32, 40, 0.04)
oud_line(OUD, 0.24)
oud_line([(a, l, m) for a, l, m, *_ in CHORUS[:-1]], 0.13, up=-12, pan=0.3, seed0=500)              # the oud an octave under the rhaita
t0, x = reed_line(BREATH, seed=1, vib=0.4); rh.add(x, t0, 0.2, pan=-0.05)
t0, x = reed_line(CHORUS, seed=2); rh.add(x, t0, 0.22, pan=0.05)

# ================================================================ LANDING: bar 15 = 48.2 s, the race starts ======================
L0 = T(LAND)
K(LAND, 0.75); perc.add(DOUM[0], L0, 0.4, pan=0.2); fx.add(impact_d(3.0, seed=4), L0, 0.48)
perc.add(crash(3.2, seed=51), L0, 0.3, pan=-0.35); perc.add(crash(3.2, seed=52), L0, 0.25, pan=0.35)
for j, m in enumerate([50, 57, 62, 66, 69, 74]): pad.add(voice_pad(mtof(m), 1.3, cutoff=5000, a=0.008, r=1.3, voices=5, seed=m), L0, 0.2, pan=PANS[6][j])
for j, m in enumerate([50, 57, 62, 66, 69]): ou.add(oud(mtof(m), 2.0, seed=300 + j), L0 + 0.02 * j, 0.2, pan=-0.3 + 0.15 * j)   # the oud's strum
lb = guembri(mtof(38), 1.8, seed=7, slap=1.0); gb.add(lb, L0, 0.55)
for k in range(3): perc.add(QQo[k % 2], L0 + k * 0.09, 0.3 - 0.07 * k, pan=-0.3)

# ================================================================ MIX =============================================================
gb.curve(S.sidechain(kicks, depth=0.35, release=0.12)); pad.curve(S.sidechain(kicks, depth=0.45, release=0.2)); ou.curve(S.sidechain(kicks, depth=0.12, release=0.1))
fc = curve([(0, 600), (T(-24), 1000), (T(-12), 1600), (T(-0.1), 3800), (T(0), 3200), (T(32) + 0.1, 1500), (T(40) - 0.05, 4000), (S.len, 5500)])
pad.L = lp(pad.L, fc, 0.1); pad.R = lp(pad.R, fc, 0.1)
pad.filt(lambda x: hp1(x, 140)); ou.filt(lambda x: hp1(x, 150)); rh.filt(lambda x: hp1(x, 250)); gb.filt(lambda x: hp1(x, 35)); hands.filt(lambda x: hp1(x, 300))
pad.width(1.6); hands.width(1.3); pad.gain(1.5)
for bus_, d_ in ((ou, 0.0025), (rh, 0.0015)):   # (a little width: a chorus on the oud and the rhaita)
    m_ = 0.5 * (bus_.L + bus_.R); s_ = 0.5 * (bus_.L - bus_.R); l_, r_ = chorus(m_, d_, 0.45, 0.35); bus_.L, bus_.R = l_ + s_, r_ - s_
perc.gain(1.0); hands.gain(4.5); ou.gain(2.6); gb.gain(2.0); rh.gain(1.3)   # (the balance)
rh.curve(curve([(0, 1.0), (T(LAND) + 0.5, 1.0), (S.len - 0.25, 0.1), (S.len, 0.1)]))
verb_in = S.bus()
for x, a in ((pad, 0.25), (rh, 0.22), (ou, 0.2), (far, 0.6), (hands, 0.15), (fx, 0.2), (perc, 0.06), (drums, 0.03)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=2.6, damp=0.35, predelay=0.02)
dr = rh.send_delay(b * 0.75, 0.15, fb=0.35, damp=0.5); df = far.send_delay(b * 1.5, 0.35, fb=0.5, damp=0.45); do = ou.send_delay(b * 0.75, 0.1, fb=0.3, damp=0.5)
BUSES = [drums, perc, gb, ou, rh, pad, far, fx, air, hands]
if '--stems' in sys.argv:
    for nm_, x in zip('drums perc guembri oud rhaita pad far fx air hands'.split(), BUSES):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:8s} {sec:5s} rms {20 * np.log10(r):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES + [(vl, vr), dr, df, do], HERE + '/out/morocco', lufs=-12.0, ceiling=-1.1, highs_db=1.5, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
