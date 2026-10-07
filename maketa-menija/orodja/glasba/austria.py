"""Austria (Styria: a short fast circuit in green hills, the steep climb to the top hairpin, the long runs back down):
alpine-classical electro. A string section in a Viennese classical spirit (spiccato violins playing a bariolage arpeggio: the
moving notes under a shimmering repeated top note), legato strings that voice-lead every chord, pizzicato and timpani tuned to
tonic and dominant (as in a classical orchestra), a horn section for the arrivals, and over them the hook: a 'yodel flute' that
flips up a sixth three times in a row (ta-DAA ta-DAA ta-DAA: the climb) and then zig-zags back down (the long run). Its tone
changes with the register, reedy for the low 'chest' notes and pure for the high 'head' notes, and the pitch breaks upward on
every leap the way a yodeller's voice does.
The intro is a slow waltz (three waltz beats fill one 4/4 bar): the same hook in augmentation, oom-pah-pah pizzicato, a far horn
answering the flips from across the valley, then a rising sequence (D7-G, E7-A: the climb); at the build the kick enters far away
in four against the waltz's three and the strings' triplets straighten into sixteenths: the 3/4 lilt turns into the 4/4 drive.
D major, 136.17 bpm: 16 bars from the drop to the race's start.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  air, a far horn's long call; the waltz: the hook in 3/4 over D | G/D | D | A7/C# (the horn
                                     answers the flips); the climb D7/F# | G | E7/G#; the build on A: the far kick in 4 against
                                     the waltz's 3, the strings straighten into sixteenths, a timpani roll; in the last bar the
                                     kick stops after two beats, the low end drains away under a rising run, a sixteenth's stop
    drop  (20.0 s)     bar 0         the groove, the strings' arpeggio, the hook, the horns' chord, the boom on D
    A 0-3 (D | A7/C# | D/F# G | E7/G# A: a half cadence), B 4-7 (a descending sequence, B7/D# Em7 | A7/C# D: the flute's flips
    answered by the legato strings), breath 8-9 (the waltz returns, G/B -> Gm6/Bb, the flips echo off the hills), build 10-11
    (D/A -> A7 -> A7b9 over a drumming bass on A: the steep climb, an eighth's stop at the top), final A 12-15 (everything; in
    the last bar the groove gives way to a fill, the cadence D/A -> A7),
    LANDING at bar 16 = 48.2 s: D major from the boom up: timpani, the horns' and the strings' tutti chord, the flute's high D,
    the crash; it rings out through the tail
"""
import sys, os, json, numpy as np, numba as nb
from scipy.io import wavfile
from itertools import combinations
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 16                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 136.17 bpm
B, b = S.bar, S.beat
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
def T(bar, p): return S.t(bar, p / 4)         # sixteenth p of a bar (straight: a classical string section does not swing)
def W(bar, q): return S.t(bar, q * 4 / 3)     # waltz beat q (0, 1, 2) of a bar: three waltz beats fill one 4/4 bar
L16, LW = b / 4, b * 4 / 3                    # a sixteenth, a waltz beat (seconds)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample (log: for cutoffs)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return np.exp(np.interp(x, tp, np.log(vp))) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(7)
def hum(x=0.07): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

@nb.njit(cache=True, fastmath=True)
def _string(f, n, g, bright, seed, pickpos):
    """a plucked string (Karplus-Strong): a noise burst circulating in a delay line one period long, averaged with its neighbour
    on every pass (the damping), tuned exactly by an allpass (the fractional part of the period)"""
    np.random.seed(seed); L = 44100.0 / f - 0.5; N = int(L); frac = L - N   # (the averaging itself delays half a sample)
    if frac < 0.1: N -= 1; frac += 1.0
    buf = np.random.random(N) * 2.0 - 1.0; exc = buf.copy(); p = int(N * pickpos)
    for i in range(N):   # where it is plucked: a comb on the burst; how hard: a lowpass on it
        if i - p >= 0: exc[i] = buf[i] - buf[i - p]
    s = 0.0
    for i in range(N): s += bright * (exc[i] - s); buf[i] = s
    y = np.zeros(n); c = (1.0 - frac) / (1.0 + frac); ap_in = 0.0; ap_out = 0.0; prev = buf[N - 1]; idx = 0
    for i in range(n):
        cur = buf[idx]; v = g * 0.5 * (cur + prev); prev = cur
        o = c * v + ap_in - c * ap_out; ap_in = v; ap_out = o
        buf[idx] = o; y[i] = o; idx += 1
        if idx >= N: idx = 0
    return y
def string(f, dur, t60=0.5, bright=0.5, seed=1, pick=0.18):
    """(the shared engine's pluck() keeps re-reading one stale sample of its first burst, so its strings never die away and sit
    half a sample sharp: this one decays to -60 dB in t60 seconds and is in tune)"""
    n = int(dur * SR); y = hp1(_string(float(f), n, 10 ** (-3.0 / (max(t60, 0.01) * f)), bright, seed, pick), 30.0)
    k = min(n, int(0.02 * SR)); y[n - k:] *= np.linspace(1, 0, k) ** 2; return y

# ================================================================ instruments (defined here: synth.py is shared) ==================
def yodel(f, dur, head=0.5, flip_from=None, a=0.018, r=0.11, vib=0.006, seed=0, air=1.0):
    """the yodel flute. head 0..1: a reedy, hollow 'chest' tone (a pulse through a nasal band) or a pure, airy 'head' tone (a flute's
    high register); flip_from: the note it leaps from, which it reaches in ~15 ms with a small overshoot (the voice breaking upward)"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed); fr = np.full(n, float(f))
    if flip_from:
        sgn = 1.0 if f > flip_from else -1.0
        fr = f * (flip_from / f) ** np.exp(-t / 0.011) * (1 + 0.012 * sgn * np.exp(-t / 0.045) * (1 - np.exp(-t / 0.006)))
    fr = fr * (1 + vib * np.sin(TAU * 5.3 * t + rr.random() * 6) * np.clip((t - 0.17) / 0.25, 0, 1))
    pure = sine(fr, n) + 0.3 * sine(fr * 2, n, 0.25) + 0.12 * sine(fr * 3, n, 0.5) + 0.05 * sine(fr * 4, n, 0.1) + 0.02 * sine(fr * 5, n, 0.3)
    reed = lp(pulse(fr, n, 0.34, 0.92), np.minimum(fr * 5, 5200), 0.1)   # (phase: its fundamental in step with the pure tone's)
    x = pure * (0.6 + 0.4 * head) + (reed * 0.45 + bp(reed, 1250, 0.55) * 0.4) * (1 - head)
    chiff = bp(noise(n, seed), min(f * 3, 7000), 0.4) * np.exp(-t / 0.022) * 0.45          # the breath's attack
    breath = bp(noise(n, seed + 1), np.minimum(fr * 2, 9000), 0.25) * 0.05 + hp(noise(n, seed + 2), 6500) * 0.03 * air
    return (x + chiff + breath) * adsr(n, a, 0.2, 0.82, r, gate=dur) * 0.3

def spic(f, dur, bright=1.0, seed=0, a=0.004):
    """a violin section's spiccato: three saws a few cents apart, the bow's bite (a filter that opens on the stroke, rosin noise),
    the body's resonances (the wood near 480 Hz, the bridge near 2.9 kHz)"""
    n = int((dur + 0.07) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    x = saw(f * 0.9975, n, rr.random()) + saw(f * 1.0025, n, rr.random()) + 0.7 * saw(f, n, rr.random())
    y = lp(x, f * 2 + (1700 + 4300 * np.exp(-t / 0.035)) * bright, 0.12); y = y + bp(y, 2900, 0.45) * 0.4 + bp(y, 480, 0.4) * 0.25
    y *= 0.93 / (np.sqrt(np.mean(y[:int(0.06 * SR)] ** 2)) + 1e-9)   # every stroke equally loud (random phases: random accents)
    bow = bp(noise(n, seed), 5200, 0.25) * np.exp(-t / 0.01) * 0.35 * bright
    return hp1(y * 0.5 + bow * 1.2, 150) * adsr(n, a, 0.06, 0.4, 0.06, gate=dur)

def section(f, dur, a=0.3, r=0.6, bright=1.0, seed=0, vib=0.0045, voices=5):
    """legato strings: five players a little apart in pitch, each with their own vibrato; warm, with the bridge's presence"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed); x = np.zeros(n)
    for k in range(voices):
        fv = f * (1 + (k - (voices - 1) / 2) * 0.0032) * (1 + vib * np.sin(TAU * (4.6 + 0.41 * k) * t + rr.random() * 6) * np.clip(t / 0.4, 0, 1))
        x += saw(fv, n, rr.random())
    y = lp(x, 700 + 2400 * bright + f, 0.06); y = y + bp(y, 2700, 0.4) * 0.3 * bright
    l, rch = chorus(y, 0.0022, 0.33, 0.35); e = adsr(n, a, 0.4, 0.88, r, gate=dur)
    return (hp1(l * e, 120) * 0.17, hp1(rch * e, 120) * 0.17)

def pizz(f, t60=0.4, bright=0.6, seed=0):
    """pizzicato: a plucked string (Karplus-Strong) with the wooden body's resonances"""
    dur = min(1.6, t60 * 1.1 + 0.08); x = string(f, dur, t60, bright, seed, 0.18); t = np.arange(len(x)) / SR
    x = lp(x, np.minimum(f * 5 + 2500 * np.exp(-t / 0.03), 9000), 0.05)   # the finger's soft flesh: bright only at the very start
    x = x + bp(x, 1000, 0.45) * 0.5 + bp(x, 420, 0.4) * 0.4
    return hp1(x, 55) * 2.4

def timpani(f, dur=2.2, vel=1.0, seed=0):
    """a kettledrum: the membrane's modes (1 : 1.5 : 2 : 2.44 ...), the head's pitch sagging after the stroke, the felt mallet's thud"""
    n = int(dur * SR); t = np.arange(n) / SR; bend = 1 + 0.03 * vel * np.exp(-t / 0.07); x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 1.0), (1.505, 0.5, 0.65), (1.99, 0.32, 0.5), (2.44, 0.2, 0.35), (2.9, 0.12, 0.25), (3.35, 0.07, 0.18)):
        x += amp * sine(f * ratio * bend, n, (ratio * 0.37) % 1) * np.exp(-t / (dec * (0.6 + 0.4 * vel)))
    thud = lp(noise(n, seed), 250 + 500 * vel) * np.exp(-t / 0.018) * 0.9
    stick = bp(noise(n, seed + 1), 2500, 0.3) * np.exp(-t / 0.004) * 0.3 * vel
    return np.tanh((x * 0.6 + thud + stick) * (0.7 + 0.8 * vel)) * np.clip(t / 0.0008, 0, 1) * 0.4

def horn(f, dur, a=0.35, r=0.9, seed=0):
    """an alphorn-like horn far across the valley: the player leans into each note from below; the louder, the brighter"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    fr = f * (1 - 0.025 * np.exp(-t / 0.09)) * (1 + 0.0025 * np.sin(TAU * 4.3 * t + rr.random() * 6))
    x = saw(fr, n, 0.5) * 0.55 + pulse(fr, n, 0.45, 0.975) * 0.45; e = adsr(n, a, 0.5, 0.85, r, gate=dur)   # (fundamentals in step)
    return hp1(lp(x, 250 + 1700 * e ** 1.5 + f, 0.15) * e, 90) * 0.35

def brass(f, dur, a=0.014, r=0.7, bright=1.0, seed=0):
    """a horn section's sforzando: the note bitten off loud and bright, then held softer and rounder as the lips relax"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    fr = f * (1 - 0.012 * np.exp(-t / 0.03)) * (1 + 0.002 * np.sin(TAU * 4.8 * t + rr.random() * 6))
    x = saw(fr, n, 0.5) * 0.5 + saw(fr * 1.003, n, 0.5) * 0.3 + pulse(fr * 0.998, n, 0.42, 0.96) * 0.3   # (in step at the start)
    e = adsr(n, a, 0.35, 0.55, r, gate=dur); fc = 280 + f * 1.5 + 2600 * bright * np.exp(-t / 0.18) + 900 * bright * e
    return hp1(lp(x, fc, 0.18) * e, 80) * 0.3

def glock(f, dur=1.4, seed=0):
    """a glockenspiel: a struck steel bar (its modes at 1 : 2.76 : 5.40 : 8.93), the hammer's tick"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 0.9), (2.756, 0.35, 0.3), (5.404, 0.15, 0.1), (8.933, 0.06, 0.05)):
        if f * ratio < 18000: x += amp * sine(f * ratio, n) * np.exp(-t / dec)
    return (x + hp(noise(n, seed), 6000) * np.exp(-t / 0.003) * 0.3) * np.clip(t / 0.0005, 0, 1) * 0.25

def bass_note(f, dur, bright=1.0, a=0.003, r=0.035, sub=0.4):
    """the bass: a saw and a pulse through a filter that blips open on each note, driven a little; a sine under it for weight"""
    n = int((dur + r) * SR); t = np.arange(n) / SR
    x = saw(f, n, 0.5) * 0.55 + pulse(f, n, 0.42, 0.96) * 0.25   # (phases: their fundamentals in step with the sine's, every note)
    y = sat(lp(x, 150 + 2.5 * f + 1300 * bright * np.exp(-t / 0.055), 0.22), 1.9) * 0.8 + sine(f, n) * sub
    return y * adsr(n, a, 0.1, 0.78, r, gate=dur)

def air(dur, seed=0):
    """the air high over the hills: two bands of noise drifting slowly, in gusts"""
    n = int(dur * SR); t = np.arange(n) / SR
    f1 = 700 * 2 ** (0.9 * np.sin(TAU * 0.045 * t + seed) + 0.35 * np.sin(TAU * 0.12 * t + 2 * seed))
    f2 = 4200 * 2 ** (0.5 * np.sin(TAU * 0.06 * t + 3 * seed))
    x = bp(noise(n, seed), f1, 0.7) + bp(noise(n, seed + 9), f2, 0.5) * 0.35
    return x * (0.6 + 0.4 * np.sin(TAU * 0.07 * t + seed) ** 2)

def cymbal(dur=2.5, seed=0):   # the engine's crash with its top octave tamed (shimmer, not hiss, on earbuds)
    return lp(crash(dur, seed), 11000, 0.05)
def rev_crash(dur=1.4, seed=0):   # a cymbal played backwards (swells into the next hit)
    x = cymbal(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def impact_d(dur=3.0, seed=0, f=mtof(26)):
    """the boom on the drop and the landing, tuned to the tonic (D1: the engine's impact is a fixed A, which would put a dominant
    under the tonic chord): a sine falling onto D1, driven (its overtones D2, A2, F#3 are the D's own), and a dark noise thud"""
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.tanh(sine(f * (1 + 2.5 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.7) * 1.6) * 0.8
    return hp1(body + lp(noise(n, seed), 900) * np.exp(-t / 0.4) * 0.35, 28) * np.clip(t / 0.001, 0, 1)

# ================================================================ harmony ========================================================
# chord -> (bass note, root, pitch classes of the upper voices, the third: never doubled, the tones that must fall by step: the
# seventh, the suspended fourth, the flat ninth). A dominant seventh with its leading tone in the bass (V6/5) leaves it out of the
# upper voices (doubling the root instead), and D7/C keeps its seventh in the bass alone (it falls there: C -> B)
CH = {'Dadd9':  (38, 2, {2, 6, 9, 4}, 6, ()),    'D':      (38, 2, {2, 6, 9}, 6, ()),       'G/D':    (38, 7, {7, 11, 2}, 11, ()),
      'A7/C#':  (37, 9, {9, 4, 7}, 1, (7,)),     'D7/F#':  (42, 2, {2, 9, 0}, 6, (0,)),     'G':      (43, 7, {7, 11, 2}, 11, ()),
      'E7/G#':  (44, 4, {4, 11, 2}, 8, (2,)),    'A7sus4': (45, 9, {9, 2, 4, 7}, 2, (2, 7)), 'A7':     (45, 9, {9, 1, 4, 7}, 1, (7,)),
      'A7b9':   (45, 9, {1, 4, 7, 10}, 1, (7, 10)), 'D/F#': (42, 2, {2, 6, 9}, 6, ()),      'A':      (45, 9, {9, 1, 4}, 1, ()),
      'B7/D#':  (39, 11, {11, 6, 9}, 3, (9,)),   'Em7':    (40, 4, {4, 7, 11, 2}, 7, (2,)), 'D7/C':   (48, 2, {2, 6, 9}, 6, ()),
      'G/B':    (47, 7, {7, 11, 2}, 11, ()),     'Gm6/Bb': (46, 7, {7, 10, 2, 4}, 10, ()),  'D/A':    (45, 2, {2, 6, 9}, 6, ()),
      'G#dim7': (44, 8, {8, 11, 2, 5}, 8, ())}   # (its F rises to the 6/4's F#: the classical exception)
DOMINANT = {'A7/C#', 'D7/F#', 'E7/G#', 'A7', 'A7b9', 'A', 'B7/D#', 'D7/C'}   # their third is a leading tone (it rises a semitone
                                                                              # when the root moves up a fourth)
HARM = {-11: 'Dadd9', -10: 'Dadd9', -9: 'D', -8: 'G/D', -7: 'D', -6: 'A7/C#', -5: 'D7/F#', -4: 'G', -3: 'E7/G#',   # the waltz, the climb
        -2: 'A7sus4', -1: [(0, 'A7'), (2, 'A7b9')],                                                                   # the build
        0: 'D', 1: 'A7/C#', 2: [(0, 'D/F#'), (2, 'G')], 3: [(0, 'E7/G#'), (2, 'A')],                                  # A: a half cadence
        4: 'B7/D#', 5: 'Em7', 6: 'A7/C#', 7: [(0, 'D'), (2, 'D7/C')],                                                 # B: the sequence
        8: 'G/B', 9: 'Gm6/Bb', 10: 'D/A', 11: [(0, 'A7'), (2, 'A7b9')],                                               # breath, build
        12: 'D', 13: 'A7/C#', 14: [(0, 'D/F#'), (2, 'G'), (3, 'G#dim7')], 15: [(0, 'D/A'), (2, 'A7')], 16: 'D'}       # final A, landing
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]
    if isinstance(h, str): return [(0, 4, h)]
    return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]

def voicings(lo, hi, start, nv=4, anchor=0.15):
    """(bar, chord) -> nv upper voices between lo and hi, chosen chord by chord through the piece by a cost: every voice moves as
    little as possible, a seventh (or a suspended fourth, a flat ninth) that is not held into the next chord falls by step, a
    leading tone rises a semitone into its tonic, a doubled note is the root (or the fifth), never the third or the seventh;
    no voices closer than a tone or wider than a sixth, the top near where it began (anchor: how strongly). Where two rules
    clash (a seventh would fall onto the next chord's leading tone, which is already in the bass: A7/C# -> D7/F#, Em7 -> A7/C#)
    the leading tone is not doubled and the seventh moves on"""
    res, prev, pc_ = {}, list(start), None
    for bar in range(-11, 17):
        if bar == 12: prev, pc_ = list(res[(-1, 'A7b9')]), 'A7b9'   # the final A is a reprise: it leads on from where the first A began
        for _, _, c in chords_in(bar):
            _, root, pcs, third, _ = CH[c]; best = None
            for v in combinations([m for m in range(lo, hi + 1) if m % 12 in pcs], nv):
                g = np.diff(v)
                if {m % 12 for m in v} != pcs or g.min() < 2 or g.max() > 8: continue
                cost = sum(abs(x - y) for x, y in zip(v, prev)) + anchor * abs(v[-1] - start[-1])
                for k in pcs:   # doublings
                    d = sum(m % 12 == k for m in v) - 1
                    if d > 0: cost += d * (0 if k == root else 1 if (k - root) % 12 == 7 else 6 if k == third or k in CH[c][4] else 3)
                if pc_ is not None:
                    p_root, p_third, p_fall = CH[pc_][1], CH[pc_][3], CH[pc_][4]
                    for x, y in zip(prev, v):
                        if x % 12 in p_fall and x % 12 not in pcs and not 1 <= x - y <= 2: cost += 6     # the seventh falls
                        if pc_ in DOMINANT and (root - p_root) % 12 == 5 and x % 12 == p_third and y - x != 1: cost += 6   # the leading tone rises
                if best is None or cost < best[0]: best = (cost, v)
            res[(bar, c)] = best[1]; prev = list(best[1]); pc_ = c
    return res
PAD_V = voicings(54, 76, (57, 62, 66, 69))   # the legato strings (F#3..E5), under the tune
ARP_V = voicings(62, 86, (69, 74, 78, 81), anchor=0.6)   # the violins' arpeggio (D4..D6): its top, the repeated note, stays near A5

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
HOOK = [[(0, 1, 'A4'), (1, 3, 'F#5'), (4, 1, 'D5'), (5, 3, 'B5'), (8, 1, 'F#5'), (9, 3, 'D6'), (12, 1, 'B5'), (13, 1, 'C#6'), (14, 1, 'A5'), (15, 1, 'B5')],
        [(0, 1, 'G5'), (1, 1, 'A5'), (2, 1, 'F#5'), (3, 1, 'G5'), (4, 4, 'E5'), (8, 1, 'C#5'), (9, 3, 'A5'), (12, 2, 'G5'), (14, 2, 'E5')]]
HOOK_HC = [(0, 1, 'G#5'), (1, 1, 'A5'), (2, 1, 'F#5'), (3, 1, 'G#5'), (4, 4, 'E5'), (8, 1, 'E5'), (9, 5, 'C#6'), (14, 1, 'B5'), (15, 1, 'A5')]
HOOK_DIM = HOOK[0][:6] + [(12, 1, 'B5'), (13, 1, 'G#5'), (14, 1, 'F5'), (15, 1, 'D5')]            # over G - G#dim7: falls through it
CADENCE = [(0, 1, 'A4'), (1, 3, 'F#5'), (4, 1, 'F#5'), (5, 3, 'D6'), (8, 1, 'G5'), (9, 3, 'E6'),    # the last climb: up to the
           (12, 1, 'C#6'), (13, 1, 'A5'), (14, 1, 'B5'), (15, 1, 'C#6')]                            # top E, then up into the D
B_FLIPS = {4: [(0, 1, 'F#5'), (1, 3, 'D#6'), (4, 2, 'B5'), (6, 2, 'F#5'), (8, 1, 'B4'), (9, 3, 'B5'), (12, 2, 'A5'), (14, 2, 'F#5')],
           6: [(0, 1, 'E5'), (1, 3, 'C#6'), (4, 2, 'A5'), (6, 2, 'E5'), (8, 1, 'A4'), (9, 3, 'A5'), (12, 2, 'G5'), (14, 2, 'E5')]}
B_STRINGS = {5: [(0, 8, 'G5'), (8, 2, 'F#5'), (10, 2, 'E5'), (12, 4, 'B5')],                         # the strings answer, a step
             7: [(0, 8, 'F#5'), (8, 2, 'E5'), (10, 2, 'D5'), (12, 4, 'A5')]}                         # lower the second time
CLIMB = [(0, 1, 'C#5'), (1, 3, 'A5'), (4, 1, 'E5'), (5, 3, 'C#6'), (8, 1, 'G5'), (9, 5, 'E6')]      # the build's last bar: up and up
# the waltz (waltz beat, length in waltz beats, note): the hook's three flips, slowly, then its zig-zag; the climb's flips
WALTZ = {-9: [(0, 1, 'A4'), (1, 2, 'F#5')], -8: [(0, 1, 'D5'), (1, 2, 'B5')], -7: [(0, 1, 'F#5'), (1, 2, 'D6')],
         -6: [(0, .5, 'B5'), (.5, .5, 'C#6'), (1, .5, 'A5'), (1.5, .5, 'B5'), (2, .5, 'G5'), (2.5, .5, 'E5')],
         -5: [(0, 1, 'C5'), (1, 2, 'A5')], -4: [(0, 1, 'D5'), (1, 2, 'B5')], -3: [(0, 1, 'B4'), (1, 2, 'G#5')]}
MONTE = {-5: 'C6', -4: 'B5', -3: 'D6', -2: 'D6', -1: 'C#6'}   # the violins over the climb: sevenths fall to thirds, the D held over into a 4-3 suspension
BREATH = {8: [(0, 1, 'B4'), (1, 2, 'G5')], 9: [(0, 1, 'D5'), (1, 2, 'Bb5')]}                         # the waltz remembered

drums, perc, bass, pad, arp, lead, strl, pz, timp, glk, echo, fx, atm, hrn = (S.bus(x) for x in
    'drums perc bass pad arp lead strl pizz timp glock echo fx atmos horns'.split())
kicks = []

def play(bar, phrase, gain=0.5, octave=0, dst=None, waltz=False, gl=0.0):
    """the yodel flute: a low note before an upward leap of a fourth or more is 'chest', the note leapt to is 'head' and flips up"""
    dst = dst or lead; prev = None; notes = [(p, ln, nm(x) + 12 * octave) for p, ln, x in phrase]
    for i, (p, ln, m) in enumerate(notes):
        nxt = notes[i + 1][2] if i + 1 < len(notes) else None
        up_from = prev is not None and m - prev >= 5; up_next = nxt is not None and nxt - m >= 5
        head = 1.0 if up_from else 0.0 if up_next else 0.55
        t = W(bar, p) if waltz else T(bar, p); dur = ln * (LW if waltz else L16) * (0.97 if ln > 1 else 0.85)
        g = gain * hum(0.05) * (1.08 if up_from else 0.9 if up_next else 1.0)
        dst.add(yodel(mtof(m), dur, head, mtof(prev) if up_from else None, seed=(bar + 20) * 50 + i), t, g, pan=0.0)
        if gl and up_from: glk.add(glock(mtof(m + 12), 1.0, seed=i), t, gl * hum(), pan=0.3)   # a glint on each high note
        prev = m

# ================================================================ the parts ======================================================
PADQ = []   # legato strings: (start, end, voice, note, gain, brightness, attack, release); tied notes are merged before rendering
def pad_bar(bar, gain, bright=1.0, a=0.25, r=0.6, upto=4):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(PAD_V[(bar, c)]):
            PADQ.append([S.t(bar, b0), S.t(bar, min(b1, upto)), j, m, gain, bright, a, r])
def render_pad():
    q = sorted(PADQ, key=lambda e: (e[2], e[0])); merged = []
    for e in q:   # a voice that keeps its note into the next chord is held, not bowed again
        if merged and merged[-1][2] == e[2] and merged[-1][3] == e[3] and abs(merged[-1][1] - e[0]) < 1e-6 and abs(merged[-1][4] - e[4]) < 1e-6:
            merged[-1][1] = e[1]
        else: merged.append(list(e))
    for k, (t0, t1, j, m, g, br, a, r) in enumerate(merged):
        pad.add(section(mtof(m), t1 - t0, a=a, r=r, bright=br, seed=k), t0, g, pan=[-0.65, -0.22, 0.22, 0.65][j])

ARP16 = [0, 3, 2, 3, 1, 3, 2, 3, 0, 3, 2, 3, 1, 3, 2, 3]   # bariolage: the moving notes under the repeated top note
ARPW = {2: [0, 2, 3, 2, 1, 2], 4: [0, 3, 2, 3, 1, 3, 2, 3, 0, 3, 2, 3]}   # the waltz's broken chords (eighths, sixteenths)
def arp_bar(bar, gain, bright=1.0, up=0, ln=0.85, climb=False, upto=16):
    for b0, b1, c in chords_in(bar):
        v = list(ARP_V[(bar, c)])
        for p in range(b0 * 4, min(b1 * 4, upto)):
            if climb:   # the build: the four lowest chord tones above a floor that rises through the bar (the climb)
                lo_ = 64 + int(round(12 * (climb[0] + (climb[1] - climb[0]) * p / 16))); vv = [m for m in range(lo_, lo_ + 30) if m % 12 in CH[c][2]][:4]
            else: vv = v
            i = ARP16[p]; m = vv[i] + up; acc = 1.0 if p % 4 == 0 else 0.8 if p % 2 == 0 else 0.66
            arp.add(spic(mtof(m), L16 * ln, bright, seed=(bar + 20) * 32 + p), T(bar, p) + rng.uniform(-0.002, 0.002), gain * acc * hum(0.1), pan=-0.5 if i == 3 else 0.45)
def arp_waltz(bar, gain, sub=2, bright=0.7):
    c = chords_in(bar)[0][2]; v = ARP_V[(bar, c)]; pat = ARPW[sub]
    for k in range(3 * sub):
        i = pat[k]; acc = 1.0 if k % sub == 0 else 0.7
        arp.add(spic(mtof(v[i]), LW / sub * 0.85, bright, seed=(bar + 20) * 40 + k), W(bar, k / sub), gain * acc * hum(0.1), pan=-0.5 if i == 3 else 0.45)

def waltz_bar(bar, gain, upto=3):
    """oom-pah-pah in pizzicato: the basses on one, the upper strings' chord on two and three (two comes a touch early: the
    Viennese lilt)"""
    c = chords_in(bar)[0][2]; root = CH[c][0]; v = PAD_V[(bar, c)]
    pz.add(pizz(mtof(root), 0.7, 0.3, seed=bar + 40), W(bar, 0), gain * 1.15, pan=-0.05)
    pz.add(pizz(mtof(root + 12), 0.5, 0.5, seed=bar + 60), W(bar, 0) + 0.006, gain * 0.55, pan=-0.25)
    for q in range(1, upto):
        tq = W(bar, q) - (0.045 * LW if q == 1 else 0.0)
        for j, m in enumerate(v[1:]):
            pz.add(pizz(mtof(m), 0.32, 0.45, seed=(bar + 20) * 9 + q * 3 + j), tq + 0.005 * j, gain * 0.36 * (1.0 if q == 1 else 0.82) * hum(), pan=[-0.45, 0.05, 0.5][j])

def next_root(bar, beat):   # the bass note of the chord after this beat
    for bb in (bar, bar + 1):
        for b0, b1, c in chords_in(bb):
            if bb > bar or b0 > beat: return CH[c][0]
    return CH[chords_in(bar)[-1][2]][0]
def bass_bar(bar, gain, style='gallop', bright=1.0, upto=4, stop=16):
    """'gallop': the offbeat eighth and an octave sixteenth after it (oom - pa-pa against the kick), the next chord's root anticipated;
    'drum': straight eighths (a classical drum bass); 'long': one held note per chord. upto: the beat, stop: the sixteenth it ends at"""
    for b0, b1, c in chords_in(bar):
        root = CH[c][0]
        if style == 'long':
            bass.add(bass_note(mtof(root), (min(b1, upto) - b0) * b * 0.96, bright * 0.4, a=0.12, r=0.3), S.t(bar, b0), gain); continue
        for k in range(b0, min(b1, upto)):
            if style == 'gallop':
                if 4 * k + 2 < stop: bass.add(bass_note(mtof(root), L16 * 1.6, bright), T(bar, 4 * k + 2), gain * hum(0.04))
                nx = next_root(bar, k) if k == b1 - 1 else root
                if 4 * k + 3 < stop: bass.add(bass_note(mtof(nx + 12), L16 * 0.7, bright * 0.8), T(bar, 4 * k + 3), gain * 0.5 * hum(0.05))
            else:
                for e in (0, 2):
                    if 4 * k + e >= stop: continue
                    m = root + (12 if e == 2 and k % 2 else 0)
                    bass.add(bass_note(mtof(m), L16 * 1.5, bright), T(bar, 4 * k + e), gain * (0.8 if e == 0 else 1.0) * hum(0.04))

# drum sounds, made once
KICK = kick(dur=0.34, f0=165, f1=50, sweep=0.04, click=0.55, drive=1.6)
CLAP = clap(seed=5); SNR = snare(0.2, tone=200, snappy=0.75, seed=6)
HC = [hat(0.045, seed=s, tone=7000) for s in range(4)]; HO = [hat(open_=True, seed=s + 20, tone=6500) * 0.8 for s in range(3)]
SHK = [shaker(0.08, seed=s + 30) for s in range(4)]; RIM = rim(seed=3)
KICK_FAR = hp1(lp(KICK, 380), 110)   # the kick heard from far away: its click and its weight gone, only the thud
def K(t, g=0.44, snd=None): drums.add(KICK if snd is None else snd, t, g); kicks.append(t)

def groove(bar, kick_beats=range(4), clap_=True, chat=True, ohat=True, shake=0.1, ride_=False, ghosts=True, upto=4):
    for k in kick_beats: K(S.t(bar, k))
    for k in range(upto):
        if clap_ and k in (1, 3): drums.add(CLAP, S.t(bar, k), 0.24 * hum(), pan=0.03); drums.add(SNR, S.t(bar, k), 0.1)
        if ohat: perc.add(HO[k % 3], T(bar, 4 * k + 2), 0.26 * hum(), pan=0.3)
        if chat:
            for s_, g in ((0, 0.19), (1, 0.1), (3, 0.14)): perc.add(HC[(k + s_) % 4], T(bar, 4 * k + s_), g * hum(0.15), pan=-0.4)
        if shake:
            for s_ in range(4): perc.add(SHK[s_], T(bar, 4 * k + s_), shake * (0.55, 0.35, 0.9, 0.45)[s_] * hum(0.15), pan=0.55)
        if ride_: perc.add(ride(0.8, seed=k), S.t(bar, k), 0.2 * (1.0 if k % 2 == 0 else 0.8), pan=0.35)
    if ghosts:   # quiet snare ghosts between the beats
        for p in ((7, 10) if bar % 2 else (10, 15)):
            if p < 4 * upto: drums.add(SNR, T(bar, p), 0.045 * hum(0.2), pan=-0.1)

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=190, tone1=250):   # a roll speeding up and swelling into the next bar
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, seed=int(t * 100) % 97), t, g0 + (g1 - g0) * x ** 1.5, pan=0.06)
        t += b / (rate0 + (rate1 - rate0) * x)
def timp_roll(t0, t1, f, g0, g1, rate=13.0, seed=0):   # a timpani roll: quick alternating strokes, swelling
    t, k = t0, 0
    while t < t1 - 0.02:
        x = (t - t0) / (t1 - t0)
        timp.add(timpani(f, 1.0, vel=0.35 + 0.55 * x, seed=seed + k), t, (g0 + (g1 - g0) * x ** 1.4) * hum(0.12), pan=-0.2 + 0.08 * (k % 2))
        t += (1 / rate) * (1 + rng.uniform(-0.07, 0.07)); k += 1

# ================================================================ INTRO: the globe (bars -11..-1) ================================
far = S.bus('far')                                                    # sounds heard across the valley (mostly reverb)
A0 = 0.25; na = int((S.t(0) + 0.8 - A0) * SR); ta = np.arange(na) / SR + A0
aenv = np.clip((ta - A0) / 2.5, 0, 1) ** 1.5 * (0.7 + 0.3 * np.clip((ta - 4) / 8, 0, 1)) * np.clip((S.t(0) + 0.6 - ta) / 3.5, 0, 1)
atm.add((air(na / SR, 1) * aenv, air(na / SR, 2) * aenv), A0, 0.2)   # the air, swelling in, thinning as the build takes over
nh = int((S.t(-7) - S.t(-11)) * SR); th = np.arange(nh) / SR
for k, (m, pan) in enumerate(((81, -0.6), (86, 0.5), (88, -0.2), (90, 0.35))):   # a cloud of high string harmonics (D add 9)
    x = sine(mtof(m) * (1 + 0.0015 * np.sin(TAU * 0.3 * th + k)), nh) * (0.75 + 0.25 * np.sin(TAU * (0.5 + 0.13 * k) * th + k))
    atm.add(x * np.clip(th / 3.0, 0, 1) ** 2 * np.clip((nh / SR - th) / 3.0, 0, 1), S.t(-11), 0.011, pan=pan)
far.add(horn(mtof(nm('A3')), 2.6, a=0.8, r=1.4, seed=1), S.t(-11) + 0.3, 0.15, pan=-0.35)  # a far horn's long call across the valley
for bar, q, m, ln in ((-8, 1, 'B3', 0.95), (-8, 2, 'G4', 1.5), (-7, 1, 'A3', 0.95), (-7, 2, 'F#4', 1.8)):   # later it answers the
    far.add(horn(mtof(nm(m)), ln * LW, a=0.12, r=0.9, seed=40 + bar * 3 + q), W(bar, q), 0.3, pan=-0.35)   # flute's flips: up a sixth, twice
pad_bar(-10, 0.26, bright=0.45, a=1.8, r=1.0)                         # the strings open the journey (D add 9)
for bar in range(-9, -1):                                             # then follow the waltz and the climb, brightening
    pad_bar(bar, 0.23 + 0.014 * (bar + 9), bright=0.5 + 0.06 * (bar + 9), a=0.5 if bar < -5 else 0.3, r=0.8)
for bar in range(-9, -2): waltz_bar(bar, 0.26 + 0.015 * (bar + 9))  # oom-pah-pah
waltz_bar(-2, 0.24)                                                   # (its three against the kick's four, the last time)
for bar, ph in WALTZ.items(): play(bar, ph, gain=0.44 + 0.01 * (bar + 9), waltz=True, gl=0.035)   # the hook, slowly, in 3/4
for bar in (-7, -6): arp_waltz(bar, 0.13 + 0.02 * (bar + 7), sub=2, bright=0.6)                   # broken chords in eighths,
for bar in (-5, -4, -3): arp_waltz(bar, 0.16 + 0.02 * (bar + 5), sub=4, bright=0.7)               # then sixteenths (the climb)
for bar, m in MONTE.items():                                          # the violins' line over the climb, an octave doubled
    hold = 2 * B if bar == -3 else B if bar != -2 else 0
    if hold:
        dur = hold - 0.02 if bar != -1 else 2 * b
        strl.add(section(mtof(nm(m)), dur, a=0.35, r=0.5, bright=1.1, voices=4, seed=bar + 50), S.t(bar), 0.42, pan=-0.12)
        strl.add(section(mtof(nm(m) - 12), dur, a=0.35, r=0.5, bright=0.9, voices=4, seed=bar + 70), S.t(bar), 0.3, pan=0.15)
timp.add(timpani(mtof(38), 2.5, 0.45, seed=1), S.t(-9), 0.3)          # a soft stroke as the waltz begins
timp_roll(S.t(-2), S.t(-1, 3.75), mtof(45), 0.03, 0.2, seed=10)     # the roll on A (the dominant) into the build
# --- the build (bars -2, -1): it also works on its own from 15.5 s (the short intro)
for k in range(4): K(S.t(-2, k), 0.3 + 0.04 * k, snd=KICK_FAR)     # the kick enters far away: four against the waltz's three
for k in range(2): K(S.t(-1, k), 0.44)                                # then near, for two beats; the rest of the bar is the run
arp_bar(-2, 0.24, bright=0.75)                                        # the strings' triplets straighten into sixteenths
arp_bar(-1, 0.28, bright=0.9, climb=(0.3, 1.0), upto=8)
bass_bar(-2, 0.1, style='drum', bright=0.35); bass_bar(-1, 0.14, style='drum', bright=0.55, upto=2)
for k in range(16): perc.add(HC[k % 4], T(-2, k), 0.025 + 0.004 * k, pan=-0.35)      # ticking hats, growing
for k in range(15): perc.add(HC[k % 4], T(-1, k), 0.06 + 0.003 * k, pan=-0.35)
snare_roll(S.t(-2, 2), S.t(-1), 2, 4, 0.03, 0.08); snare_roll(S.t(-1), T(-1, 15) - 0.01, 4, 8, 0.08, 0.18)   # (up to the stop)
fx.add(riser(2 * B, f0=300, f1=9000, seed=3), S.t(-2), 0.24); fx.add(rev_crash(1.3, seed=5), S.t(0) - 1.3, 0.2)
for i, m in enumerate(['A4', 'Bb4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5']):   # the rising run into the drop (a 'tirata', its B flat from the A7b9)
    strl.add(spic(mtof(nm(m)), L16 * 0.9, 1.1, seed=300 + i), T(-1, 8 + i), 0.3 + 0.03 * i, pan=0.0)
    strl.add(spic(mtof(nm(m) - 12), L16 * 0.9, 0.9, seed=320 + i), T(-1, 8 + i), 0.18 + 0.02 * i, pan=0.2)

# ================================================================ MAIN: the flight (bars 0..15) ==================================
fx.add(impact_d(2.5), S.t(0), 0.4); fx.add(cymbal(2.6, seed=1), S.t(0), 0.28, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
timp.add(timpani(mtof(38), 2.4, 1.0, seed=2), S.t(0), 0.55)
def tutti(t, g, dur):   # the horns' chord on an arrival (D major: D3 A3 D4 F#4), bitten off: it carries the arrival on a phone
    for j, m in enumerate([50, 57, 62, 66]): hrn.add(brass(mtof(m), dur, r=0.35, seed=int(t * 10) + j), t + 0.005 * j, g, pan=-0.35 + 0.23 * j)
tutti(S.t(0), 0.3, 0.32)                                              # the drop: the full orchestra arrives
def sec_of(bar): return 'A' if bar < 4 else 'B' if bar < 8 else 'breath' if bar < 10 else 'build' if bar < 12 else 'final'
for bar in range(16):
    sec = sec_of(bar)
    # drums: A the plain groove; B adds the ride; the breath has none; the build comes back in half time; the final has everything
    if sec == 'A':       groove(bar)
    elif sec == 'B':     groove(bar, ride_=True, shake=0.12)
    elif sec == 'build':
        if bar == 10:
            for k in (0, 2): K(S.t(bar, k), 0.45)
            for s_ in range(16): perc.add(SHK[s_ % 4], T(bar, s_), (0.04 + 0.006 * s_) * (1.3 if s_ % 4 == 2 else 1.0), pan=0.5)
        else:
            for k in range(4): K(S.t(bar, k), 0.42)
            for s_ in range(0, 14): perc.add(HC[s_ % 4], T(bar, s_), 0.08 + 0.006 * s_, pan=-0.35)
    elif sec == 'final': groove(bar, ride_=True, shake=0.14) if bar < 15 else groove(bar, (0, 1), ride_=True, shake=0.14, upto=2)   # (bar 15: the fill)
    # the strings' harmony and the bass
    if sec == 'breath':
        pad_bar(bar, 0.3, bright=0.45, a=0.6, r=1.2); bass_bar(bar, 0.12, style='long')
    else:
        pad_bar(bar, {'A': 0.3, 'B': 0.32, 'build': 0.3 + 0.03 * (bar - 10), 'final': 0.33}[sec], bright=1.0 if sec != 'build' else 0.8 + 0.15 * (bar - 10),
                a=0.12, r=0.5)
        if sec == 'build': bass_bar(bar, 0.15, style='drum', bright=0.5 + 0.25 * (bar - 10), stop=16 if bar == 10 else 14)   # (bar 11: up to the gap)
        else:              bass_bar(bar, 0.27, style='gallop', bright=1.0)
    # the violins' arpeggio (in the breath: the waltz's broken chords, softly)
    if sec in ('A', 'B', 'final'): arp_bar(bar, 0.36 if sec != 'final' else 0.31, bright=1.0)
    if sec == 'final': arp_bar(bar, 0.07, bright=0.8, up=12)   # (and an octave above, softly: the final glitters)
    elif sec == 'breath':          arp_waltz(bar, 0.1 + 0.04 * (bar - 8), sub=2, bright=0.55)
    else:                          arp_bar(bar, 0.26 + 0.04 * (bar - 10), bright=0.8 + 0.15 * (bar - 10), climb=((bar - 10) * 0.5, (bar - 10) * 0.5 + 0.5), upto=16 if bar == 10 else 14)
# the tunes
for bar, ph in ((0, HOOK[0]), (1, HOOK[1]), (2, HOOK[0]), (3, HOOK_HC)): play(bar, ph, gain=0.62, gl=0.025)
for bar, ph in B_FLIPS.items(): play(bar, ph, gain=0.62, gl=0.02)
for bar, ph in B_STRINGS.items():                                     # the strings answer the flute (in octaves)
    for p, ln, x in ph:
        m = nm(x); d = ln * L16 * 0.98
        strl.add(section(mtof(m), d, a=0.06, r=0.35, bright=1.2, voices=4, seed=bar * 20 + p), T(bar, p), 0.72, pan=-0.12)
        strl.add(section(mtof(m - 12), d, a=0.06, r=0.35, bright=1.0, voices=4, seed=bar * 20 + p + 7), T(bar, p), 0.5, pan=0.15)
nb_ = int(2.4 * B * SR); tb_ = np.arange(nb_) / SR; benv = np.sin(np.pi * np.clip(tb_ / (nb_ / SR), 0, 1)) ** 1.5
atm.add((air(nb_ / SR, 5) * benv, air(nb_ / SR, 6) * benv), S.t(8) - 0.1, 0.16)   # the air again, high over the hills
for bar in (8, 9):                                                    # the breath: the waltz returns, the flips echo off the hills
    waltz_bar(bar, 0.45); play(bar, BREATH[bar], gain=0.6, waltz=True, dst=echo)
play(11, CLIMB, gain=0.64, gl=0.03)                                   # the climb to the top hairpin
for bar, ph in ((12, HOOK[0]), (13, HOOK[1]), (14, HOOK_DIM), (15, CADENCE)):
    play(bar, ph, gain=0.7, gl=0.045)
    for p, ln, x in ph:                                               # the violins double the tune an octave down
        strl.add(section(mtof(nm(x) - 12), ln * L16 * 0.95, a=0.02, r=0.18, bright=1.1, voices=3, seed=bar * 30 + p), T(bar, p), 0.22, pan=0.1)
# timpani on the tonic and the dominant (the classical orchestra's pair)
for bar, p, f, g in ((3, 8, 45, 0.42), (4, 0, 47, 0.28), (8, 0, 38, 0.4), (12, 0, 38, 0.55), (15, 8, 45, 0.4), (15, 12, 45, 0.42), (15, 14, 45, 0.46)):
    timp.add(timpani(mtof(f), 1.8, 0.8, seed=bar * 16 + p), T(bar, p), g)
timp_roll(S.t(10), S.t(11, 3.5), mtof(45), 0.04, 0.2, seed=40)        # the roll under the build (from D/A: no A against the B flat)
# fills every four bars
for p, g in zip(range(12, 16), (0.08, 0.11, 0.15, 0.2)): drums.add(SNR, T(3, p), g, pan=0.05)
fx.add(rev_crash(0.9, seed=7), S.t(4) - 0.9, 0.15); fx.add(cymbal(1.6, seed=2), S.t(4), 0.2, pan=-0.2)
for p, f in zip(range(8, 16), (220, 196, 175, 156, 139, 123, 110, 98)): drums.add(tom(f, 0.3), T(7, p), 0.22, pan=0.45 - 0.12 * (p - 8))
fx.add(rev_crash(1.2, seed=8), S.t(8) - 1.2, 0.18); fx.add(cymbal(1.6, seed=3), S.t(8), 0.22, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.12)
fx.add(riser(2 * B, f0=400, f1=9000, seed=7), S.t(10), 0.26); snare_roll(S.t(10, 2), S.t(11, 3.5), 2, 8, 0.05, 0.21)
fx.add(rev_crash(1.0, seed=9), S.t(12) - 1.0, 0.2); fx.add(cymbal(2.5, seed=4), S.t(12), 0.3, pan=-0.1)
fx.add(impact_d(2.0, seed=2), S.t(12), 0.24); tutti(S.t(12), 0.26, 0.32)                   # the final A arrives: the boom, the horns
# the last bar leads into the landing: on beat 3 the groove gives way to the fill (toms tumbling down, the roll, the timpani on A),
# the cymbal swelling backwards
for p, f in zip(range(0, 8, 2), (196, 165, 147, 123)): drums.add(tom(f, 0.3), T(15, 8 + p), 0.24, pan=0.4 - 0.25 * p / 2)
snare_roll(S.t(15, 2), S.t(16) - 0.02, 4, 8, 0.07, 0.2); fx.add(rev_crash(1.4, seed=10), S.t(16) - 1.4, 0.24)

# ================================================================ LANDING: bar 16 = 48.2 s, the race starts ======================
K(LAND, 0.5)
fx.add(impact_d(2.5, seed=5), LAND, 0.38); fx.add(cymbal(3.0, seed=6), LAND, 0.32, pan=0.1)
timp.add(timpani(mtof(38), 2.5, 1.0, seed=99), LAND, 0.5)
for j, m in enumerate([50, 57, 62, 66, 69]):                          # the horns' tutti chord (D major), held and ringing
    hrn.add(brass(mtof(m), 1.6, r=1.4, seed=900 + j), LAND + 0.006 * j, 0.36, pan=-0.4 + 0.2 * j)
for j, m in enumerate([50, 57, 62, 66, 69, 74, 78, 81]):                # the strings' tutti chord: D major, wide
    strl.add(section(mtof(m), 1.3, a=0.012, r=1.3, bright=1.3, voices=4, seed=700 + j), LAND, 0.28, pan=-0.7 + 0.2 * j)
lead.add(yodel(mtof(86), 1.5, 1.0, None, r=0.9, seed=5), LAND, 0.68)   # the flute's high D
for j, m in enumerate([86, 90, 93, 98]): glk.add(glock(mtof(m), 2.2, seed=j), LAND + 0.03 * j, 0.09, pan=-0.3 + 0.2 * j)
for j, m in enumerate([50, 57, 62, 66, 69, 74]): pz.add(pizz(mtof(m), 0.9, 0.35, seed=800 + j), LAND + 0.02 * j, 0.15, pan=-0.5 + 0.2 * j)   # (strummed)
lb = bass_note(mtof(38), 2.3, 0.7); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass.add(lb, LAND + 0.012, 0.38)

# ================================================================ MIX =============================================================
render_pad()
# a breath of silence at the top of the climb (the last eighth before the final A), for everything but the risers and the reverbs
gap = curve([(0, 1), (T(11, 14) - 0.004, 1), (T(11, 14) + 0.004, 0), (S.t(12) - 0.006, 0), (S.t(12), 1), (S.len, 1)])
for x in (drums, perc, bass, pad, arp, lead, strl, pz, timp, glk, hrn): x.curve(gap)
# and a sixteenth's stop before the drop, for the drums and the low end (the run's top note and the riser ring on into it)
gap0 = curve([(0, 1), (T(-1, 15) - 0.004, 1), (T(-1, 15) + 0.004, 0), (S.t(0) - 0.004, 0), (S.t(0), 1), (S.len, 1)])
for x in (drums, perc, bass, timp): x.curve(gap0)
# the builds' last bars drain the low end away (the bass and the timpani filtered from below, up to 320 Hz): the drop and the
# final A bring it all back at once
hpc = curve([(0, 20), (S.t(-1), 20), (S.t(0) - 0.01, 320), (S.t(0), 20), (S.t(11), 20), (T(11, 14), 320), (S.t(12) - 0.01, 320),
             (S.t(12), 20), (S.len, 20)], log=True)
for x in (bass, timp): x.L = hp(x.L, hpc); x.R = hp(x.R, hpc)
# the journey's crescendo: the waltz begins softly and grows into the climb (a conductor's hand on the orchestra, the intro only)
cresc = curve([(0, 0.5), (S.t(-9), 0.5), (S.t(-6), 0.7), (S.t(-3), 1.0), (S.len, 1.0)])
for x in (pad, pz, arp, strl, lead, glk, timp): x.curve(cresc)
# the bass's fader; the kick ducks the bass and (gently) the strings
bass.gain(0.72)
bass.curve(S.sidechain(kicks, depth=0.6, release=0.13)); pad.curve(S.sidechain(kicks, depth=0.35, release=0.16))
arp.curve(S.sidechain(kicks, depth=0.18, release=0.1)); strl.curve(S.sidechain(kicks, depth=0.15, release=0.12))
# the violins play softer under the flute (up to 3 dB, following the tune's level): the hook stays on top
le = lp1(np.abs(0.5 * (lead.L + lead.R)), 5.0); arp.curve(1 - 0.3 * np.clip(le / np.percentile(le[le > 1e-4], 90), 0, 1))
# the filter: the journey opens from muffled to bright; the breath closes it and the build reopens it
fc = curve([(0, 1400), (S.t(-9), 1800), (S.t(-5), 3000), (S.t(-2), 4200), (S.t(0) - 0.05, 16000), (S.t(8), 16000), (S.t(8, 1), 2200),
            (S.t(10), 2600), (S.t(12) - 0.1, 16000), (S.len, 16000)], log=True)
for x in (pad, arp): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 140)); strl.filt(lambda x: hp1(x, 110)); hrn.filt(lambda x: hp1(x, 90)); lead.filt(lambda x: hp1(x, 240))
echo.filt(lambda x: hp1(x, 240)); glk.filt(lambda x: hp1(x, 1200)); far.filt(lambda x: hp1(x, 100)); pz.filt(lambda x: hp1(x, 45))
bass.filt(lambda x: hp1(x, 32)); perc.filt(lambda x: lp(x, 13000, 0.3))   # (the metal's top octave tamed: shimmer, not hiss)
pad.width(1.35); arp.width(1.2); pz.width(1.2)
# sends: one golden concert hall for the orchestra (the horn almost entirely in it), a short room for the drums, echoes on the flute
verb_in = S.bus()
for x, a in ((pad, 0.3), (arp, 0.22), (lead, 0.2), (strl, 0.32), (pz, 0.3), (timp, 0.25), (hrn, 0.3), (glk, 0.5), (echo, 0.35), (fx, 0.2), (atm, 0.3),
             (far, 1.0), (perc, 0.06)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=2.8, damp=0.3, predelay=0.025); vl, vr = vl * 1.2, vr * 1.2
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.45, decay=0.7, damp=0.4)
dl = lead.send_delay(b * 0.75, 0.12, fb=0.3, damp=0.45)              # a dotted-eighth echo on the tune
el = echo.send_delay(LW, 0.5, fb=0.5, damp=0.35)                     # the breath's flips answer a waltz beat later, again and again
far.gain(0.35)
BUSES = [drums, perc, bass, pad, arp, lead, strl, pz, timp, glk, echo, fx, atm, far, hrn]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level and width in the intro and the main, before the master)
    for x in BUSES + [type('v', (), {'L': vl, 'R': vr, 'name': 'verb'})]:
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{x.name:7s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
if '--dump' in sys.argv:   # (a check while mixing: each bus written on its own, before the master)
    os.makedirs(HERE + '/out/austria_stems', exist_ok=True)
    for x in BUSES: wavfile.write(HERE + f'/out/austria_stems/{x.name}.wav', SR, (np.clip(np.stack([x.L, x.R], 1), -1, 1) * 32767).astype(np.int16))
res = S.master(BUSES + [(vl, vr), (room_l, room_r), dl, el], HERE + '/out/austria', lufs=-12.2, ceiling=-1.1, highs_db=1.5, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
