"""Japan (Mie: a figure-of-eight circuit with a bridge, uphill esses, a hairpin, fast sweepers): future bass with city-pop colours.
A koto (the long zither on movable bridges, plucked with ivory picks; computed here as a Karplus-Strong string whose length can move,
so a note can be pressed up behind its bridge as koto players do) tuned to hirajoshi plays the hook; a shakuhachi (bamboo flute, much
breath) sings the same hook first in slow motion over the globe; taiko drums thunder in the builds; wide pumping supersaw chords, an FM
electric piano and an octave bass carry city-pop harmony (major sevenths and ninths over the IV-V-iii-vi of Japanese pop); crisp drums.
A minor (the koto's strings: hirajoshi on A = A B C E F), 136.17 bpm: 16 bars from the drop to the race's start.
The hook: a short-short-long cell (mi la TI~, a fourth and a step up to the lydian #11 over Fmaj9) that falls back and leaps; the
answer turns on the scale's semitone at the top (ti do ti) and settles on a long E that the koto presses up a semitone and lets go.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)   bars -11..-1  air, a pad that grows, a glass wind chime; the koto tunes up (a slow arpeggio, handing its top
                                      note to the flute); the shakuhachi sings the hook at half speed (two breaths, the second fuller);
                                      the koto previews it an octave down, filtered, over a heartbeat; the build: taiko, shime and snare
                                      rolls, the riser, the koto's tremolo, then a gap (the drums fall back for the last eighth) where
                                      only the swells carry on (the drop's chord played backwards, the cymbal, the koto's sweep)
    drop  (20.0 s)      bar 0         the hook on the koto over the half-time future-bass groove; the taiko, a clap and the impact
                                      on the downbeat, the first chord unpumped (the drop hits in the middle range a phone plays)
    A bars 0-3 (half time; a snare fill into A'), A' 4-7 (four on the floor: a gear up; e-piano, koto arpeggios, a new answer),
    breath 8-9 (city pop: the e-piano, a slap bass, finger snaps, the shakuhachi), build 10-11 (taiko, the koto climbing, chord
    stutters, a gap), final 12-15 (everything: the shakuhachi joins the koto on the hook, one tune played two ways as in Japanese
    chamber music; a glass bell an octave over it; bVI-bVII into the tonic, the bass climbing E F G against the tune's B -> A),
    LANDING at bar 16 = 48.2 s: A minor (add 9): a taiko hit, the koto's strum, the crash, the flute's last A; it dies away to the end
    (--phone prints the arc as a phone plays it: each bar's level in 220 Hz-7 kHz and each drop against the half bar before it)
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 16                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 136.17 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                # 48.2 s: the final hit
SW = 0.035                                   # the hats' odd sixteenths a hair late (everything else dead on the grid: precise)
def T(bar, p=0.0, swing=0.0):                # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (swing if int(round(p)) % 2 else 0.0)) / 4)
def curve(points):                           # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
rng = np.random.default_rng(7)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
@nb.njit(cache=True, fastmath=True)
def _string(freq, g, c, exc):
    """a Karplus-Strong string whose length can change while it rings (pitch freq[i] every sample): an integer delay, a first-order
    allpass for the fraction (it loses nothing, so every note decays alike), a one-pole lowpass in the loop (c: 1 = bright); both
    filters' lags at the fundamental are taken off the delay, so every note is in tune; g: the loss per round trip"""
    n = freq.shape[0]; M = 8192; buf = np.zeros(M); y = np.zeros(n); s = 0.0; w = M; ne = exc.shape[0]; x1 = 0.0; y1 = 0.0
    for i in range(n):
        om = 2.0 * math.pi * freq[i] / 44100.0
        lag = math.atan2((1.0 - c) * math.sin(om), 1.0 - (1.0 - c) * math.cos(om)) / om
        D = 44100.0 / freq[i] - lag
        if D < 3.0: D = 3.0
        K = int(D - 0.5); d = D - K; dd = d
        for it in range(2):   # the allpass's true lag at the fundamental: correct its fraction twice
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

def loop_lp(f, t_hf):
    """the string's loop lowpass for a note of f Hz whose harmonics near 3 kHz should die in t_hf seconds (the same for every note,
    so high notes stay as bright as low ones); returns (c, the loss at the fundamental)"""
    q = 6.9 / ((1 - math.cos(TAU * 3000 / SR)) * t_hf * f); a = ((2 * q + 1) - math.sqrt(4 * q + 1)) / (2 * q); c = 1 - a
    om = TAU * f / SR; return c, c / math.sqrt(1 - 2 * a * math.cos(om) + a * a)

def koto(f, dur, vel=1.0, bend=None, bright=0.6, t60=2.0, seed=0, pick=0.12):
    """a koto string plucked with an ivory pick (tsume): the string starts in the shape the pick pulls it to (a triangle peaked at the
    pick's point) with a little grit from the pick, harder plucks are brighter, the string starts a hair sharp and settles;
    bend: [(seconds, semitones), ...] presses the string behind its bridge (oshide); the fundamental rings for t60 s, the upper
    harmonics die sooner; a hollow paulownia body"""
    n = int(dur * SR); t = np.arange(n) / SR
    semis = np.interp(t, *zip(*bend)) if bend else 0.0
    fr = f * 2 ** (semis / 12) * (1 + 0.003 * vel * np.exp(-t / 0.04))
    seed = abs(int(seed)); r = np.random.default_rng(seed); P = max(4, int(SR / f)); x = np.arange(P) / P
    tri = np.where(x < pick, x / pick, (1 - x) / (1 - pick)); tri -= tri.mean()
    nz = r.random(P) * 2 - 1; p = max(1, int(P * pick)); nz[p:] = nz[p:] - nz[:-p]; nz = lp1(nz, 1500 + 9000 * bright * vel)
    e = (tri * 1.5 + nz * (0.25 + 0.45 * bright * vel)) * (0.45 + 0.55 * vel)
    c, h0 = loop_lp(f, 0.15 + 0.6 * bright * (0.6 + 0.4 * vel))
    y = _string(fr, min(0.99995, 10 ** (-3 / (f * t60)) / h0), c, e)
    y = y + bp(y, 290, 0.3) * 0.3 + bp(y, 1300, 0.25) * 0.2                      # the paulownia body: a low boom, a nasal middle
    m = min(n, 400); y[:m] += hp(noise(m, seed + 3), 3000) * np.exp(-np.arange(m) / SR / 0.0012) * 0.2 * vel   # the pick's click
    y = hp1(y, 90); k = min(n, int(0.02 * SR)); y[n - k:] *= np.linspace(1, 0, k) ** 2
    return y * 0.6

HIRA = [m for m in range(45, 100) if (m - 69) % 12 in (0, 2, 3, 7, 8)]   # the koto's strings: hirajoshi on A (A B C E F)
OSHI = [(0, 0), (0.42, 0), (0.5, 1.0), (0.66, 1.0), (0.75, 0)]          # pressed up a semitone and let go (E -> F -> E)
YURI = [(0, 0), (0.4, 0), (0.5, 0.3), (0.62, -0.05), (0.74, 0.3), (0.86, 0.0), (0.98, 0.2), (1.1, 0)]   # the string rocked (vibrato)

def shakuhachi(notes, breath=0.6, vib=0.28, rel=0.3, slide=-1.0, fall=-1.2, seed=0, muraiki=0.5):
    """one breath of the shakuhachi: notes [(start s, dur s, midi, level)] played legato (the fingers change the note and the pitch
    glides a little between them); the first slides in from below (meri), long notes swell and their vibrato (yuri, from the head)
    grows, the breath roars on the attack (muraiki), and the phrase ends with the pitch falling away"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for s0, d, m, v in notes:
        i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 7.0) + p0                                          # the glide between notes (~25 ms)
    p = p + slide * np.exp(-t / 0.11)                                             # sliding up into the first note
    yuri = vib * np.clip((age - 0.3) / (0.6 * ln), 0, 1) ** 1.5 * (ln > 0.5)
    p = p + yuri * np.sin(TAU * 4.7 * t + 0.8 * np.sin(TAU * 0.6 * t))
    p = p + fall * np.clip((t - t_end + 0.1) / (rel + 0.1), 0, 1) ** 2           # the end falls away
    fr = mtof(p)
    tone = sine(fr, n) + 0.3 * sine(fr * 2, n, 0.25) + 0.1 * sine(fr * 3, n, 0.5) + 0.04 * sine(fr * 4, n, 0.75)
    nz = noise(n, seed)
    air = hp(bp(nz, fr, 0.96) * 1.4 + bp(nz, fr * 2, 0.94) * 0.5, 350) + hp(nz, 6000) * 0.03   # breath in the bore (on the note), at the edge
    lvs = lp1(lv, 14.0)                                                           # the level follows the notes smoothly
    swell = 0.8 + 0.25 * np.clip(age / np.maximum(ln, 0.1), 0, 1)
    env = np.clip(t / 0.06, 0, 1) * lvs * swell * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    wn = lp1(noise(n, seed + 1), 5.0); wn /= np.std(wn) + 1e-9; wob = 1 + 0.05 * wn  # the breath is never quite steady
    burst = bp(nz, 1700, 0.25) * np.exp(-t / 0.07) * np.clip(t / 0.008, 0, 1) * muraiki * lvs
    return ((tone * (1 - 0.3 * breath) + air * breath) * env * wob + burst) * 0.35

def taiko(f=62, dur=1.6, vel=1.0, seed=0):
    """an o-daiko (the big barrel drum, struck with bachi): the skin's modes falling in pitch after the hit, the boom of the barrel,
    the skin's middle (what a phone hears), the stick's crack"""
    n = int(dur * SR); t = np.arange(n) / SR; pf = f * (1 + 0.5 * np.exp(-t / 0.03))
    x = (0.6 * sine(pf, n) * np.exp(-t / 0.35) + 0.55 * sine(pf * 1.59, n, 0.2) * np.exp(-t / 0.2) + 0.35 * sine(pf * 2.14, n, 0.4) * np.exp(-t / 0.1)
         + 0.2 * sine(pf * 2.65, n, 0.1) * np.exp(-t / 0.06))
    x = x + lp(noise(n, seed), 500, 0.2) * np.exp(-t / 0.06) * 0.7 + bp(noise(n, seed + 1), 330, 0.5) * np.exp(-t / 0.12) * 1.0
    x = np.tanh(x * (1.2 + 0.8 * vel)) * vel + bp(noise(n, seed + 2), 2400, 0.3) * np.exp(-t / 0.005) * 0.5 * vel
    return x * np.clip(t / 0.001, 0, 1)
def shime(f=520, dur=0.22, vel=1.0, seed=0):   # a shime-daiko: small, tight, high (the fast patterns)
    n = int(dur * SR); t = np.arange(n) / SR
    x = sine(f * (1 + 0.2 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.06) + 0.4 * sine(f * 1.6, n) * np.exp(-t / 0.03)
    return (x + bp(noise(n, seed), 3000, 0.3) * np.exp(-t / 0.008) * 0.7) * vel * np.clip(t / 0.0005, 0, 1)
def ka(dur=0.08, seed=0):   # the bachi on the drum's wooden rim
    n = int(dur * SR); t = np.arange(n) / SR
    return (bp(noise(n, seed), 1700, 0.6) + 0.6 * sine(1180, n)) * np.exp(-t / 0.012) * np.clip(t / 0.0005, 0, 1)

def epiano(f, dur, vel=0.6, r=0.3):
    """an FM electric piano (the city-pop keyboard): a warm 1:1 body and a bell-like 1:14 tine that dies fast"""
    n = int((dur + r) * SR); t = np.arange(n) / SR
    ib = (0.5 + 1.3 * vel) * np.exp(-t / 0.45) + 0.2
    body = np.sin(TAU * f * t + ib * np.sin(TAU * f * t))
    it = (0.8 + 1.8 * vel) * np.exp(-t / 0.02)
    tine = np.sin(TAU * f * t + it * np.sin(TAU * 14.0 * f * t)) * np.exp(-t / 0.06)
    amp = np.exp(-t / (1.3 if f < 400 else 0.9)) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (r / 3))) * np.clip(t / 0.002, 0, 1)
    return (body * 0.75 + tine * 0.35 * vel) * amp * 0.4

def fb_chord(midis, dur, scoop=1.0, cutoff=6000, a=0.006, r=0.2, seed=0, detune=0.22):
    """the future-bass chord: wide supersaws (a different set of detuned saws left and right) scooping up into pitch on the hit"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; ps = 2 ** (-scoop * np.exp(-t / 0.05) / 12)
    L = np.zeros(n); R = np.zeros(n)
    for j, m in enumerate(midis):
        f = mtof(m) * ps
        L += supersaw(f, n, 5, detune, 0.85, seed + 11 * j); R += supersaw(f, n, 5, detune, 0.85, seed + 11 * j + 500)
    env = adsr(n, a, 0.3, 0.75, r, gate=dur); fc = np.minimum(cutoff * (0.75 + 0.5 * np.exp(-t / 0.18)), 18000)
    return lp(L, fc, 0.12) * env * 0.6, lp(R, fc, 0.12) * env * 0.6

def bass(f, dur, vel=1.0, bright=1.0):
    """the bass: a sine for the weight and a buzzing saw through a closing filter (its harmonics are what a phone plays)"""
    n = int((dur + 0.06) * SR); t = np.arange(n) / SR
    m = sat(lp(saw(f, n) * 0.6 + pulse(f * 2, n, 0.35) * 0.25, 250 + 1700 * bright * vel * np.exp(-t / 0.09), 0.2), 2.0)
    return (sine(f, n) * 0.75 + hp1(m, 140) * 0.8) * adsr(n, 0.003, 0.18, 0.8, 0.05, gate=dur) * vel

def slap(f, dur, pop=False, ghost=False, seed=0):
    """a slap bass (city pop): the thumb on a low string (bright, then dark), popped octaves, muted ghost notes"""
    n = int((dur + 0.05) * SR); t = np.arange(n) / SR
    if ghost: return (bp(noise(n, seed), 320, 0.3) * 0.6 + sine(f, n) * 0.5) * np.exp(-t / 0.02) * np.clip(t / 0.001, 0, 1) * 0.5
    x = saw(f, n) * 0.5 + sine(f, n) * 0.7 + pulse(f, n, 0.25) * 0.2
    y = lp(x, 300 + (3800 if pop else 2400) * np.exp(-t / (0.03 if pop else 0.05)), 0.3)
    m = min(n, 300); y[:m] += hp(noise(m, seed), 2000) * np.exp(-np.arange(m) / SR / 0.002) * (0.7 if pop else 0.4)
    return sat(y, 1.5) * adsr(n, 0.002, 0.12, 0.6, 0.04, gate=dur)

def furin(f=2600, dur=2.0, seed=0):
    """a glass wind chime (furin): a few inharmonic partials of a small glass bell, a tick of its clapper"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); r = np.random.default_rng(seed)
    for ratio, amp, dec in ((1.0, 1.0, 0.9), (2.71, 0.45, 0.5), (5.13, 0.25, 0.22), (8.3, 0.12, 0.1)):
        if f * ratio < 17000: x += amp * np.sin(TAU * f * ratio * (1 + 0.0007 * r.standard_normal()) * t + r.random() * 6) * np.exp(-t / dec)
    x += hp(noise(n, seed), 5000) * np.exp(-t / 0.002) * 0.3
    return x * np.clip(t / 0.0008, 0, 1) * 0.25

def glass(f, dur, vel=0.8, r=0.3):   # a glassy FM bell (1:3) for sparkle over the hook
    n = int((dur + r) * SR); t = np.arange(n) / SR; ie = (0.6 + 1.2 * vel) * np.exp(-t / 0.15)
    x = np.sin(TAU * f * t + ie * np.sin(TAU * 3.0 * f * t)) * np.exp(-t / 0.5)
    return x * np.clip(t / 0.002, 0, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (r / 3))) * 0.3

def lead_pluck(f, dur, vel=1.0):   # a soft synth pluck under the koto in the drops (body for the hook)
    n = int((dur + 0.15) * SR); t = np.arange(n) / SR
    x = pulse(f, n, 0.3) * 0.5 + saw(f * 1.004, n) * 0.4
    return lp(x, 900 + 4500 * vel * np.exp(-t / 0.07), 0.2) * adsr(n, 0.002, 0.25, 0.35, 0.12, gate=dur) * 0.35

def air(dur, seed=0):   # the air at altitude: noise through a slowly wandering band, swelling
    n = int(dur * SR); t = np.arange(n) / SR
    fc = 900 * 2 ** (1.2 * np.sin(TAU * 0.05 * t + seed) + 0.5 * np.sin(TAU * 0.13 * t + 2 * seed))
    return bp(noise(n, seed), fc, 0.7) * (0.6 + 0.4 * np.sin(TAU * 0.08 * t + seed) ** 2)

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def clap_hi(dur=0.3, seed=0, fc=2200):   # the engine's clap centred higher (2.2 kHz: the part of a clap a phone plays)
    n = int(dur * SR); t = np.arange(n) / SR; env = np.zeros(n)
    for k, o in enumerate([0, 0.011, 0.022]): env += np.exp(-np.clip(t - o, 0, None) / 0.007) * (t >= o) * (0.8 if k < 2 else 1)
    env += np.exp(-np.clip(t - 0.022, 0, None) / 0.09) * (t >= 0.022) * 0.6
    return bp(noise(n, seed), fc, 0.35) * env * 1.6
def crack(seed=0):   # the stick's crack on the snare's head: 5 ms of bright noise (3-5 kHz)
    n = int(0.03 * SR); t = np.arange(n) / SR
    return bp(noise(n, seed), 3800, 0.3) * np.exp(-t / 0.005) * np.clip(t / 0.0004, 0, 1)

def snap(seed=0):   # a finger snap (city pop's backbeat in the breath)
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (bp(noise(n, seed), 2300, 0.5) * 1.4 + hp(noise(n, seed + 1), 5000) * 0.4) * np.exp(-t / 0.018) * np.clip(t / 0.0006, 0, 1)

def gate16(n, pattern):   # a rhythmic gate over n samples: open on [(sixteenth, length), ...] from the start, soft edges (no clicks)
    g = np.zeros(n)
    for p, ln in pattern:
        a, z = int(p * s16 * SR), int(((p + ln) * s16 - 0.012) * SR); g[max(0, a):max(0, min(n, z))] = 1.0
    return lp1(lp1(g, 110), 110)

# ================================================================ harmony ========================================================
#            bass  voicing (midi): rootless city-pop voicings, each chord moving to the next by common tones and steps
CH = {'Fmaj9':  (41, [57, 60, 64, 67]),      # A3 C4 E4 G4 over F2
      'G9':     (43, [59, 62, 65, 69]),      # B3 D4 F4 A4 over G2 (all four voices a step up: parallel ninths)
      'Em7':    (40, [59, 62, 64, 67]),      # B3 D4 E4 G4 over E2
      'Am9':    (45, [57, 60, 64, 71]),      # A3 C4 E4 B4 over A2 (the ninth on top, clear of the third)
      'Am7':    (45, [57, 60, 64, 67]),
      'Dm9':    (38, [57, 60, 64, 65]),      # A3 C4 E4 F4 over D2
      'G13':    (43, [57, 59, 64, 65]),      # A3 B3 E4 F4 over G2
      'Cmaj9':  (36, [55, 59, 62, 64]),      # G3 B3 D4 E4 over C2
      'E7sus4': (40, [57, 59, 62, 64]),      # A3 B3 D4 E4 over E2
      'E7b9':   (40, [56, 59, 62, 65]),      # G#3 B3 D4 F4 over E2 (its flat nine is the koto's F)
      'Aadd9':  (33, [57, 60, 64, 71, 76])}  # the landing: A3 C4 E4 B4 E5 over A1
HARM = {-11: 'Am9', -10: 'Am9', -9: 'Fmaj9', -8: 'Fmaj9', -7: 'G9', -6: 'Em7', -5: 'Fmaj9', -4: 'G9', -3: 'Em7', -2: 'Am9',
        -1: [(0, 'E7sus4'), (3, 'E7b9')],
        0: 'Fmaj9', 1: 'G9', 2: 'Em7', 3: 'Am9', 4: 'Fmaj9', 5: 'G9', 6: 'Em7', 7: 'Am9',          # IV V iii vi (the royal road)
        8: 'Dm9', 9: 'G13', 10: 'Cmaj9', 11: [(0, 'E7sus4'), (2, 'E7b9')],                            # ii V I, then V of vi
        12: 'Fmaj9', 13: 'G9', 14: [(0, 'Em7'), (2, 'Am7')], 15: [(0, 'Fmaj9'), (2, 'G9')], 16: 'Aadd9'}   # bVI bVII i: home
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
POOL = {'Fmaj9': ['F4', 'A4', 'C5', 'E5'], 'G9': ['F4', 'A4', 'B4', 'E5'], 'Em7': ['E4', 'A4', 'B4', 'E5'], 'Am9': ['E4', 'A4', 'B4', 'C5'],
        'Am7': ['E4', 'A4', 'C5', 'E5'], 'Dm9': ['F4', 'A4', 'C5', 'E5'], 'G13': ['F4', 'A4', 'B4', 'E5'], 'Cmaj9': ['C4', 'E4', 'B4', 'E5'],
        'E7sus4': ['E4', 'A4', 'B4', 'E5'], 'E7b9': ['E4', 'B4', 'E5', 'F5']}   # the koto's strings that sound in each chord

# ================================================================ the tunes (sixteenth, length in sixteenths, note[, bend]) =======
HOOK = {0: [(0, 2, 'E5'), (2, 2, 'A5'), (4, 4, 'B5'), (8, 2, 'A5'), (10, 2, 'E5'), (12, 4, 'C6')],       # mi la TI~ la mi DO~
        1: [(0, 2, 'B5'), (2, 2, 'C6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 8, 'E5', OSHI)],              # ti do ti la MI~ (pressed)
        2: [(0, 2, 'E5'), (2, 2, 'A5'), (4, 4, 'B5'), (8, 2, 'A5'), (10, 2, 'E5'), (12, 4, 'E6')],       # the cell again, leaping up
        3: [(0, 2, 'B5'), (2, 2, 'C6'), (4, 10, 'A5', YURI)]}                                         # ti do LA~ home (rocked)
ANSWER = {6: [(0, 2, 'E5'), (2, 2, 'A5'), (4, 4, 'B5'), (8, 2, 'E6'), (10, 2, 'C6'), (12, 4, 'B5')],    # the second answer: higher,
          7: [(0, 2, 'A5'), (2, 2, 'C6'), (4, 4, 'E6'), (8, 2, 'B5'), (10, 2, 'A5'), (12, 4, 'E5')]}    # open on the fifth
CLIMB = {10: [(0, 2, 'E5'), (2, 2, 'A5'), (4, 4, 'B5'), (8, 2, 'A5'), (10, 2, 'C6'), (12, 4, 'E6')]}    # the build: the cell climbs
CADENCE = [(0, 2, 'B5'), (2, 2, 'C6'), (4, 4, 'A5'), (8, 2, 'E5'), (10, 2, 'A5'), (12, 4, 'B5')]       # bar 15: into the landing

drums, perc, taiko_b, bass_b, chords, keys, pad, kot, arp, flute, bells, fx = (S.bus(x) for x in
    'drums perc taiko bass chords keys pad koto arp flute bells fx'.split())
kicks, pumps, backbeats = [], [], []          # kick times (the sidechain), the chords' pump (every beat of the drops), the snares
# the gap: the builds' drums, risers and tremolos fall back (-10 dB) for the last eighth before each drop, so the drop lands in
# a space; only the swells into the downbeat (the chord played backwards, the cymbal, the koto's sweep) carry through it
build_b = S.bus('build')                      # the builds' taiko tumbles and rolls (folded into the taiko bus after the gap)
GAP = curve([(0, 1), (T(-1, 14) - 0.015, 1), (T(-1, 14) + 0.015, 0.3), (S.t(1), 0.3), (S.t(1) + 0.01, 1),
             (T(11, 14) - 0.015, 1), (T(11, 14) + 0.015, 0.3), (S.len, 0.3)])
def gapped(sig, t):                           # one sound (mono) through the gap curve, from its start time t
    i = int(round(t * SR)); g = GAP[i:i + len(sig)]; return sig * np.concatenate([g, np.full(len(sig) - len(g), GAP[-1])])

def play(bus, bar, phrase, gain, octave=0, pan=0.0, bright=0.62, t60=1.6, vel=1.0, ring=0.35, seed0=0, pluck_=0.0, glass_=0.0, double=0.0):
    """the koto plays a phrase; double: a second take (a few cents up, a hair late, to the right), pluck_ doubles it with the soft
    synth pluck, glass_ with the glass bell an octave up"""
    for i, note in enumerate(phrase):
        p, ln, name = note[:3]; bend = note[3] if len(note) > 3 else None
        m = nm(name) + 12 * octave; d = ln * s16; v = vel * hum(0.05) * (1.06 if p % 4 == 0 else 0.97); t = T(bar, p)
        ring_ = ring if ln > 2 else ring * 0.5
        bus.add(koto(mtof(m), d + ring_, v, bend, bright, t60, seed=seed0 + (bar + 20) * 37 + i), t, gain, pan)
        if double: bus.add(koto(mtof(m) * 1.0025, d + ring_, v * 0.9, bend, bright, t60, seed=seed0 + (bar + 20) * 37 + i + 5000), t + 0.011, gain * double, pan + 0.4)
        if pluck_: bus.add(lead_pluck(mtof(m), d * 0.9, v), t, gain * pluck_, pan)
        if glass_: bells.add(glass(mtof(m + 12), d * 0.9, 0.7), t, glass_ * v, pan=-pan + 0.1)

def gliss(bus, t_end, lo, hi, span, gain, pan=(-0.5, 0.5), down=False, seed=0, t60=1.2):
    """the koto's sweep across its strings (lo..hi, midi), the last string arriving at t_end"""
    st = [m for m in HIRA if lo <= m <= hi]; st = st[::-1] if down else st; k = len(st)
    for i, m in enumerate(st):
        x = i / max(1, k - 1)
        bus.add(koto(mtof(m), 1.4, 0.5 + 0.4 * x, None, 0.6, t60, seed=seed + i), t_end - span * (1 - x), gain, pan[0] + (pan[1] - pan[0]) * x)

APAT = [0, 2, 3, 1, 2, 3, 0, 2, 1, 2, 3, 0, 2, 3, 1, 3]       # which string of the pool each sixteenth (accents on the 3+3+2)
ACC = {0, 3, 6, 8, 11, 14}
def arp_bar(bar, gain, octave=-1, step=1, bright=0.55, t60=1.2, ring=0.45, upto=16, frm=0):
    for b0, b1, c in chords_in(bar):
        tones = [nm(x) + 12 * octave for x in POOL[c]]
        for p in range(max(b0 * 4, frm), min(b1 * 4, upto), step):
            v = (1.0 if p in ACC else 0.62) * hum(0.1)
            arp.add(koto(mtof(tones[APAT[p]]), ring, 0.55 * v + 0.3, None, bright, t60, seed=(bar + 20) * 16 + p + 999),
                    T(bar, p), gain * v, pan=(-0.6 if p % 2 == 0 else 0.6) * (0.55 if p in ACC else 1.0))

def chord_span(t0, ln, c, gain, cutoff=6000, scoop=1.0, chop=None, top=False, seed=0):
    v = CH[c][1] + ([CH[c][1][-1] + 12] if top else [])
    L, R = fb_chord(v, ln, scoop, cutoff, seed=seed)
    if chop is not None: g = gate16(len(L), chop); L, R = L * g, R * g
    chords.add((L, R), t0, gain)
def chord_bar(bar, gain, chop=None, **kw):   # chop: the gate's sixteenths in the bar (each chord gets its own part of it)
    for b0, b1, c in chords_in(bar):
        part = None if chop is None else [(p - 4 * b0, ln) for p, ln in chop if 4 * b0 <= p < 4 * b1]
        chord_span(S.t(bar, b0), (b1 - b0) * b, c, gain, chop=part, seed=(bar + 20) * 7 + b0, **kw)

def keys_bar(bar, gain, rhythm, vel=0.55, up=0):
    """the e-piano comps: [(sixteenth, length)], always on the chord the band is playing"""
    for p, ln in rhythm:
        c = chord_at(bar, p / 4)
        for j, m in enumerate(CH[c][1]):
            keys.add(epiano(mtof(m + up), ln * s16, vel * hum(0.08)), T(bar, p) + 0.005 * j, gain, pan=-0.35 + 0.23 * j)

SLAP = {8: [(0, 3, 'D2', 't'), (3, 1, 'D3', 'p'), (4, 1, 'D2', 'g'), (6, 2, 'D2', 't'), (8, 1, 'A2', 't'), (10, 2, 'C3', 't'), (12, 1, 'D3', 'p'),
             (13, 1, 'D2', 'g'), (14, 2, 'A2', 't')],                     # the breath's slap bass: thumb (t), popped octaves (p), ghosts (g)
        9: [(0, 3, 'G2', 't'), (3, 1, 'G3', 'p'), (4, 1, 'G2', 'g'), (6, 2, 'G2', 't'), (8, 1, 'D3', 't'), (10, 2, 'F3', 'p'), (12, 1, 'G3', 'p'),
             (13, 1, 'E3', 't'), (14, 2, 'D3', 't')]}
HALF = [(0, 3, 0), (3, 3, 0), (6, 2, 12), (8, 3, 0), (11, 3, 0), (14, 2, 7)]                          # 3+3+2 pushes
OCT = [(0, 2, 0), (2, 2, 12), (4, 2, 0), (6, 1, 12), (7, 1, 0, 'g'), (8, 2, 0), (10, 2, 12), (12, 2, 0), (14, 2, 12)]   # disco octaves
def bass_bar(bar, gain, pat, bright=1.0, upto=16):
    for b0, b1, c in chords_in(bar):
        R = CH[c][0]
        for item in pat:
            p, ln, iv = item[:3]; ghost = len(item) > 3
            if b0 * 4 <= p < min(b1 * 4, upto):
                bass_b.add(bass(mtof(R + iv), ln * s16 * 0.9, vel=0.45 if ghost else hum(0.04), bright=bright), T(bar, p), gain)

# drum sounds, made once
KICK = kick(dur=0.26, f0=195, f1=54, sweep=0.028, click=0.9, drive=1.9)
KICK[-1800:] *= np.linspace(1, 0, 1800) ** 2                          # (its tail faded to nothing, not cut at 18 %)
SNR = snare(0.24, tone=220, snappy=0.9, seed=4); CLP = clap_hi(seed=6); CRK = crack(seed=8)
HC = [hat(0.045, seed=s, tone=7000) for s in range(4)]; HO = [hat(open_=True, seed=s + 10, tone=6500) * 0.8 for s in range(2)]
SHK = [shaker(0.07, seed=s) for s in range(4)]; RIM = rim(seed=3); SNP = [snap(s) for s in range(3)]
def K(t, g=0.52, lpf=None):
    drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
def SN(t, g=1.0, pan=0.0):   # the backbeat: a snare, a clap and the stick's crack
    drums.add(SNR, t, 0.46 * g, pan=pan); drums.add(CLP, t, 0.4 * g, pan=pan + 0.06); drums.add(CRK, t, 0.6 * g, pan=pan)
def hats(bar, g=1.0, step=1, open_on=(), skip=(), pan=0.32):
    for p in range(0, 16, step):
        if p not in skip: perc.add(HC[p % 4], T(bar, p, SW), g * (0.4, 0.16, 0.29, 0.18)[p % 4] * hum(0.12), pan=pan)
    for p in open_on: perc.add(HO[(p // 4) % 2], T(bar, p, SW), g * 0.3, pan=pan - 0.1)
def shake(bar, g=1.0, upto=16):
    for p in range(upto): perc.add(SHK[p % 4], T(bar, p, SW), g * (0.6, 0.35, 0.9, 0.45)[p % 4] * hum(0.15), pan=-0.5)
def roll(t0, t1, n0, n1, g0, g1, src='snare', pan=0.0, bus=None):   # a roll from t0 to t1, n0 -> n1 hits per beat, swelling
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); g = g0 + (g1 - g0) * x ** 1.4
        if src == 'snare': (bus or drums).add(snare(0.16, tone=200 + 70 * x, seed=int(t * 100) % 97), t, g, pan=pan)
        elif src == 'hat': (bus or perc).add(HC[int(t * 100) % 4], t, g, pan=0.32)
        else: (bus or taiko_b).add(shime(500 + 60 * x, 0.2, 1.0, seed=int(t * 100) % 91), t, g, pan=pan + 0.3 * math.sin(t * 40))
        t += b / (n0 + (n1 - n0) * x)
def don(t, g=1.0, f=62, pan=0.0, bus=None): (bus or taiko_b).add(taiko(f, 1.6, min(1.0, g), seed=int(t * 1000) % 97), t, 0.22 * g, pan=pan)
def pump(bar0, bar1):
    for bar in range(bar0, bar1):
        for k in range(4): pumps.append(S.t(bar, k))

def groove_half(bar, fill=False):   # future-bass half time: the kick on 1 and the 'a' of 3, the snare on 3, eighth hats
    K(T(bar, 0)); K(T(bar, 11), 0.62)
    if bar % 2: K(T(bar, 14), 0.45)
    SN(T(bar, 8)); backbeats.append(T(bar, 8))
    drums.add(SNR, T(bar, 13), 0.05); drums.add(SNR, T(bar, 15 if bar % 2 == 0 else 6), 0.06)   # ghost notes
    hats(bar, 1.0, 2, open_on=(6,) if bar % 2 else ())
    perc.add(HC[1], T(bar, 7, SW), 0.07, pan=0.32); perc.add(HC[3], T(bar, 15, SW), 0.08, pan=0.32)
    shake(bar, 0.08)
    if fill: roll(T(bar, 12), T(bar, 16), 6, 8, 0.05, 0.16, 'hat')

def groove_four(bar, g=1.0, open_=True, ghosts=True, sn=1.0):   # four on the floor (city-pop disco drive), the backbeat on 2 and 4
    for k in range(4): K(S.t(bar, k), 0.52 * g)
    SN(S.t(bar, 1), g * sn); SN(S.t(bar, 3), g * sn); backbeats.extend([S.t(bar, 1), S.t(bar, 3)])
    hats(bar, g, 1, open_on=(2, 6, 10, 14) if open_ else ())
    shake(bar, 0.1 * g)
    if ghosts: drums.add(SNR, T(bar, 7), 0.05); drums.add(SNR, T(bar, 14 if bar % 2 else 10), 0.045)

# ================================================================ INTRO: the globe (bars -11..-1) ================================
I0 = S.t(-11)                                                    # 0.61 s: the air fades in
d_air = S.t(0) - I0 + 1.0; al, ar = air(d_air, 1), air(d_air, 2); x = np.linspace(0, 1, len(al))
ag = np.clip(x / 0.12, 0, 1) * (0.55 + 0.45 * x) * np.clip((S.t(0) + 0.3 - I0 - np.arange(len(al)) / SR) / 2.5, 0, 1)
fx.add((al * ag, ar * ag), I0, 0.32)
for tt, f, g, pn in ((1.1, 2637, 0.16, 0.5), (1.75, 3136, 0.12, 0.55), (2.6, 2093, 0.12, 0.45), (6.2, 2637, 0.12, -0.5), (6.6, 1976, 0.1, -0.45)):
    bells.add(furin(f, 2.2, seed=int(tt * 10)), tt, g, pan=pn)  # a glass wind chime, now and then (a glint in the air, not over it)
for t0, ln, c in spans(-11, -1):                                 # the pad: slow swells, growing and brighter as the globe turns
    x = (t0 - I0) / (S.t(-1) - I0)
    for j, m in enumerate(CH[c][1]):
        pad.add(voice_pad(mtof(m), ln, cutoff=650 + 2200 * x, a=2.2 if x < 0.1 else 0.9 if x < 0.3 else 0.35, r=1.0, voices=5, seed=m + j), t0, 0.1 + 0.29 * x, pan=[-0.65, -0.22, 0.22, 0.65][j])
for t0, ln, c in spans(-11, -5):                                 # a soft low drone
    bass_b.add(voice_sub(mtof(CH[c][0]), ln - 0.1, a=1.0, r=0.8), t0, 0.03)
# the koto tunes up: a slow climb over its strings, its top note handed to the flute
for i, s in enumerate(['A3', 'B3', 'C4', 'E4', 'F4', 'A4', 'B4', 'C5']):
    arp.add(koto(mtof(nm(s)), 3.0, 0.45 + 0.04 * i, None, 0.55, 3.0, seed=300 + i), T(-10, 2 * i) + 0.008 * rng.standard_normal(), 0.3, pan=-0.55 + 0.14 * i)
arp.add(koto(mtof(nm('E5')), 3.2, 0.7, None, 0.55, 3.2, seed=310), T(-9, 0), 0.3, pan=0.45)
# the shakuhachi sings the hook at half speed (two breaths, the second fuller)
def blow(bar, notes, gain, pan=0.15, **kw):
    t0 = T(bar, notes[0][0]); flute.add(shakuhachi([(T(bar, p) - t0, ln * s16, nm(name), lv) for p, ln, name, lv in notes], **kw), t0, gain, pan)
blow(-9, [(0, 4, 'E5', 0.8), (4, 4, 'A5', 0.9), (8, 8, 'B5', 1.0), (16, 4, 'A5', 0.85), (20, 4, 'E5', 0.8), (24, 7, 'C6', 0.95)], 0.27, muraiki=0.6)
blow(-7, [(0, 4, 'B5', 0.9), (4, 4, 'C6', 0.95), (8, 4, 'B5', 0.9), (12, 4, 'A5', 0.85), (16, 14, 'E5', 0.9)], 0.34, fall=-1.6, rel=0.45, seed=2)
for bar in range(-9, -5):                                        # the koto marks the bars: a low open fifth
    for s in ('A3', 'E4'): arp.add(koto(mtof(nm(s)), 2.0, 0.45, None, 0.45, 2.5, seed=bar * 3 + len(s)), T(bar, 0) + (0.02 if s == 'E4' else 0), 0.26, pan=-0.3)
arp.add(koto(mtof(nm('B4')), 1.6, 0.45, None, 0.5, 2.0, seed=41), T(-8, 14), 0.22, pan=0.4)
arp.add(koto(mtof(nm('A4')), 1.6, 0.4, None, 0.5, 2.0, seed=42), T(-6, 10), 0.22, pan=0.4)
# the koto previews the hook an octave down (filtered: far away), over a heartbeat; the bass and the e-piano come in
for i, bar in enumerate(range(-5, -1)): play(kot, bar, HOOK[i], 0.34 + 0.05 * i, octave=-1, pan=-0.1, bright=0.5, t60=1.8, vel=0.7 + 0.08 * i)
for bar in range(-5, -1):
    if bar < -2:   # (the build has its own kick and bass)
        for k in ((0, 2) if bar < -3 else (0, 1, 2, 3)): K(S.t(bar, k), 0.2 + 0.05 * (bar + 5), lpf=260)
        for b0, b1, c in chords_in(bar): bass_b.add(bass(mtof(CH[c][0]), (b1 - b0) * b * 0.96, 0.6, bright=0.2), S.t(bar, b0), 0.11 + 0.03 * (bar + 5))
    if bar >= -4: shake(bar, 0.06 + 0.02 * (bar + 4)); keys_bar(bar, 0.2 + 0.02 * (bar + 4), [(0, 6), (6, 2), (10, 6)], vel=0.4)
    if bar >= -3: hats(bar, 0.5, 2)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
for p, g in ((0, 0.75), (6, 0.42), (8, 0.6), (11, 0.42), (14, 0.55)): don(T(-2, p), g, pan=-0.1 + 0.05 * (p % 3))
for p in (4, 12): taiko_b.add(ka(seed=p), T(-2, p), 0.18, pan=0.2)
TUMBLE = ((0, 0.55), (3, 0.33), (6, 0.4), (8, 0.43), (10, 0.39), (11, 0.37), (12, 0.52), (13, 0.48))   # the taiko tumble (crescendo)
for p, g in TUMBLE: don(T(-1, p), g, f=58 if p % 2 else 66, pan=0.15 if p % 2 else -0.15, bus=build_b)
roll(S.t(-2), S.t(-1), 2, 4, 0.04, 0.12, 'shime'); roll(S.t(-1), T(-1, 14), 4, 8, 0.1, 0.16, 'shime', bus=build_b)
roll(S.t(-1), T(-1, 14), 2, 8, 0.05, 0.15, bus=build_b)
for k in range(4): K(S.t(-2, k), 0.3 + 0.02 * k)
for k, g in ((0, 0.42), (1, 0.36), (2, 0.34)): K(S.t(-1, k), g)   # the pulse goes on (thinned by the rising high-pass), stops for the last beat
bass_bar(-2, 0.18, HALF, bright=0.5)
for p in list(range(0, 8, 2)) + list(range(8, 14)): bass_b.add(bass(mtof(40), s16 * (1.7 if p < 8 else 0.85), 0.5 + 0.04 * p, bright=0.3 + 0.05 * p), T(-1, p), 0.14 + 0.009 * p)   # a pulsing E pedal, eighths then sixteenths
for k, (p, s) in enumerate([(q, 'E5') for q in range(0, 8)] + [(q, 'A5') for q in range(8, 12)] + [(q, 'B5') for q in range(12, 14)]):
    kot.add(gapped(koto(mtof(nm(s)), 0.4, 0.5 + 0.035 * k, None, 0.6, 1.0, seed=500 + k), T(-1, p)), T(-1, p), 0.2 + 0.007 * k, pan=0.15 * (-1) ** k)   # tremolo
chord_bar(-2, 0.1, cutoff=1400, scoop=0.0)
chord_span(S.t(-1), 3 * b, 'E7sus4', 0.15, cutoff=2400, scoop=0.0); chord_span(S.t(-1, 3), b * 0.5, 'E7b9', 0.14, cutoff=4000, scoop=0.0)
fx.add(gapped(riser(2 * B, f0=300, f1=9000, seed=3), S.t(-2)), S.t(-2), 0.25)
fx.add(rev_crash(1.3, seed=5), S.t(0) - 1.3, 0.25)
L_, R_ = fb_chord(CH['Fmaj9'][1] + [72, 76], 1.4, 0.0, 9000, a=0.01, r=0.05, seed=77)            # the drop's chord, played backwards
ramp = np.linspace(0, 1, len(L_)) ** 2.5; fx.add((L_[::-1] * ramp, R_[::-1] * ramp), S.t(0) - len(L_) / SR, 0.42)
gliss(kot, S.t(0) - 0.02, nm('A3'), nm('C5'), s16 * 1.8, 0.3, pan=(-0.6, 0.3), seed=600)        # the sweep up into the drop

# ================================================================ MAIN: the circuit (bars 0..15) ==================================
fx.add(impact(2.5), S.t(0), 0.22); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
don(S.t(0), 0.95, f=64); SN(S.t(0), 0.8)                         # the drop's downbeat: the taiko, the impact, a clap
for bar in range(16):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'breath' if bar < 10 else 'build' if bar < 12 else 'final'
    if sec == 'A':
        groove_half(bar, fill=bar == 3); pump(bar, bar + 1)
        chord_bar(bar, 0.78 if bar == 0 else 0.7, cutoff=9000, top=bar == 0, chop=None if bar < 2 else [(0, 3), (3, 3), (6, 2), (8, 3), (11, 3), (14, 2)])
        bass_bar(bar, 0.34, HALF)
    elif sec == 'A2':
        groove_four(bar, sn=1.25); pump(bar, bar + 1)
        chord_bar(bar, 0.64, cutoff=9500, chop=[(0, 3), (3, 3), (6, 2), (8, 3), (11, 3), (14, 2)] if bar >= 6 else None)
        bass_bar(bar, 0.32, OCT); arp_bar(bar, 0.2, octave=0); keys_bar(bar, 0.2, [(3, 2), (6, 2), (10, 2), (14, 2)], vel=0.5)
    elif sec == 'breath':
        for p in (4, 12): drums.add(SNP[p % 3], T(bar, p), 0.3, pan=-0.1); drums.add(RIM, T(bar, p), 0.08, pan=0.2)
        hats(bar, 0.55, 2); shake(bar, 0.07)
        keys_bar(bar, 0.2, [(0, 6), (6, 4), (10, 2), (12, 4)], vel=0.6)
        arp_bar(bar, 0.16, octave=0, step=2, ring=1.0, t60=2.0)
        for p, ln, name, kind in SLAP[bar]:
            bass_b.add(slap(mtof(nm(name)), ln * s16 * 0.9, pop=kind == 'p', ghost=kind == 'g', seed=bar * 16 + p), T(bar, p), 0.29 if kind != 'g' else 0.26)
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1]): pad.add(voice_pad(mtof(m), ln, cutoff=1500, a=0.3, r=0.8, seed=m + 5), t0, 0.22, pan=[-0.6, -0.2, 0.2, 0.6][j])
    elif sec == 'build':
        pump(bar, bar + 1)
        if bar == 10:
            groove_four(bar, 0.85, open_=False); chord_bar(bar, 0.46, cutoff=4500)
            bass_bar(bar, 0.36, OCT, bright=0.7); keys_bar(bar, 0.22, [(0, 2), (3, 2), (6, 2), (10, 2), (14, 2)], vel=0.5)
            for p, g in ((0, 0.8), (6, 0.5), (8, 0.7), (11, 0.5), (14, 0.65)): don(T(bar, p), g)
            roll(S.t(bar, 2), S.t(bar + 1), 2, 4, 0.03, 0.09, 'shime')   # the shime starts to run
        else:
            for k in range(3): K(S.t(bar, k), 0.7)
            SN(S.t(bar, 1))
            for b0, b1, c in chords_in(bar):   # the chord stutters in sixteenths, the E7b9 (the tension) louder
                chord_span(S.t(bar, b0), (b1 - b0) * b, c, 0.4 if b0 == 0 else 0.44, cutoff=5000, chop=[(p - 4 * b0, 1) for p in range(4 * b0, min(4 * b1, 14))], seed=(bar + 20) * 7 + b0)
            for p in range(0, 14, 2): bass_b.add(bass(mtof(40), s16 * 1.7, 0.6 + 0.03 * p, bright=0.5 + 0.04 * p), T(bar, p), 0.34)
            for p, g in ((0, 0.9), (4, 0.7), (6, 0.7), (8, 0.72), (10, 0.64), (11, 0.6), (12, 0.8), (13, 0.72)): don(T(bar, p), g, f=58 if p % 2 else 66, pan=0.15 if p % 2 else -0.15, bus=build_b)
            roll(S.t(bar), T(bar, 14), 4, 8, 0.08, 0.2, 'shime', bus=build_b); roll(S.t(bar, 2), T(bar, 14), 4, 8, 0.07, 0.18, bus=build_b)
    else:   # final
        groove_four(bar, sn=1.25); pump(bar, bar + 1)
        chord_bar(bar, 0.66, cutoff=11000, top=True, chop=[(0, 3), (3, 3), (6, 2), (8, 3), (11, 3), (14, 2)] if bar in (13, 15) else None)
        bass_bar(bar, 0.34, OCT, upto=16 if bar < 15 else 12); arp_bar(bar, 0.22, octave=0)
        keys_bar(bar, 0.2, [(2, 2), (6, 2), (10, 2), (14, 2)], vel=0.55)
        perc.add(ride(0.8, seed=bar), S.t(bar, 0), 0.18, pan=0.4)
        for k in range(4): perc.add(ride(0.6, seed=bar + k), T(bar, 4 * k + 2), 0.12, pan=0.4)
# the tunes
for bar in range(4): play(kot, bar, HOOK[bar], 0.62, pan=-0.2, double=0.55, pluck_=0.6)
for bar in (4, 5): play(kot, bar, HOOK[bar - 4], 0.62, pan=-0.2, double=0.55, pluck_=0.6)
for bar in (6, 7): play(kot, bar, ANSWER[bar], 0.62, pan=-0.2, double=0.55, pluck_=0.6)
blow(8, [(0, 4, 'E6', 1.0), (4, 2, 'A5', 0.8), (6, 10, 'C6', 0.95), (16, 3, 'B5', 0.85), (19, 3, 'E6', 0.95), (22, 2, 'B5', 0.8), (24, 8, 'A5', 0.9)],
     0.33, muraiki=0.8, fall=-1.2, seed=5)
play(kot, 10, CLIMB[10], 0.6, pan=-0.05, pluck_=0.4)
for k in range(14):   # bar 11: the koto's tremolo climbs (E6, then the F6 of E7b9), swelling
    s = 'E6' if k < 8 else 'F6'; kot.add(gapped(koto(mtof(nm(s)), 0.35, 0.5 + 0.03 * k, None, 0.6, 0.8, seed=700 + k), T(11, k)), T(11, k), 0.3 + 0.007 * k, pan=0.15 * (-1) ** k)
gliss(kot, S.t(12) - 0.02, nm('A3'), nm('C5'), s16 * 1.8, 0.3, pan=(-0.6, 0.3), seed=650)
# the final: the koto's second take steps back (0.25) so the shakuhachi can be heard on the same tune
for bar in (12, 13, 14): play(kot, bar, HOOK[bar - 12], 0.64, pan=-0.2, double=0.25, pluck_=0.6, glass_=0.16); play(kot, bar, HOOK[bar - 12], 0.26, octave=-1, pan=0.25, bright=0.55, seed0=3000)
play(kot, 15, CADENCE, 0.64, pan=-0.2, double=0.25, pluck_=0.6, glass_=0.16); play(kot, 15, CADENCE, 0.26, octave=-1, pan=0.25, bright=0.55, seed0=3000)
# the final: the shakuhachi joins the koto on the hook (the two play one tune together, each in its own way: the flute glides through
# the koto's quick notes), and it holds the last A over the landing
def flute_line(phrases, breathe=True):   # the koto's phrases (one per bar) as one breath of the flute; it breathes before the next
    notes = [(16 * k + p, ln, name, 0.85 + 0.15 * (ln >= 4)) for k, ph in enumerate(phrases) for p, ln, name, *_ in ph]
    if breathe: notes[-1] = notes[-1][:1] + (notes[-1][1] - 1,) + notes[-1][2:]
    return notes
blow(12, flute_line([HOOK[0], HOOK[1]]), 0.4, breath=0.35, vib=0.22, muraiki=0.25, slide=-0.6, fall=-0.6, rel=0.12, seed=8)
blow(14, flute_line([HOOK[2], CADENCE], False) + [(32, 10, 'A5', 1.0)], 0.4, breath=0.4, vib=0.3, muraiki=0.25, slide=-0.6, fall=-0.25, rel=0.6, seed=9)
# fills every fourth bar, the crashes
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
for k, p in enumerate((12, 13, 14, 15)):   # bar 3 -> A': a one-beat snare fill (sixteenths, rising), claps on the last two
    drums.add(snare(0.18, tone=205 + 22 * k, snappy=0.9, seed=40 + k), T(3, p), 0.17 + 0.07 * k, pan=0.1 * (k - 1.5))
drums.add(CLP, T(3, 14), 0.16, pan=0.12); drums.add(CLP, T(3, 15), 0.24, pan=-0.06); drums.add(CRK, T(3, 15), 0.3)
for p, g, f in ((8, 0.8, 70), (10, 0.7, 66), (12, 0.8, 62), (13, 0.6, 62), (14, 0.9, 58), (15, 0.7, 58)): don(T(7, p), g, f, pan=0.2 - 0.05 * (p - 8))
gliss(arp, S.t(8) - 0.02, nm('A4'), nm('E6'), s16 * 2, 0.22, pan=(0.5, -0.5), down=True, seed=660)
fx.add(downlifter(2 * B, seed=6), S.t(8), 0.12); fx.add(crash(2.5, seed=3), S.t(8), 0.16, pan=0.2)
bells.add(furin(2637, 2.0, seed=81), T(8, 2), 0.25, pan=0.5); bells.add(furin(2093, 2.0, seed=82), T(9, 6), 0.2, pan=-0.5)
fx.add(gapped(riser(2 * B, f0=400, f1=9000, seed=7), S.t(10)), S.t(10), 0.3); fx.add(rev_crash(1.2, seed=9), S.t(12) - 1.2, 0.22)
fx.add(crash(2.6, seed=4), S.t(12), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(12), 0.13); don(S.t(12), 0.85, f=64); SN(S.t(12), 0.7)   # the final's downbeat, like the drop's
fx.add(crash(1.8, seed=8), S.t(14), 0.14, pan=0.25)
# the last bar leads into the landing: the taiko tumble, a roll, a short riser, the cymbal swelling backwards
for p, g, f in ((8, 0.7, 70), (10, 0.75, 66), (11, 0.6, 66), (12, 0.85, 62), (13, 0.7, 62), (14, 0.95, 58)): don(T(15, p), g, f, pan=0.25 - 0.08 * (p - 8))
roll(S.t(15, 2), T(15, 15), 4, 8, 0.1, 0.3)
fx.add(riser(B, f0=600, f1=10000, seed=8), S.t(15), 0.3); fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.26)
for p, m in ((12, 40), (13, 41), (14, 43)): bass_b.add(bass(mtof(m), s16 * 0.9, 0.9), T(15, p), 0.4)   # E F G up into the A (the tune falls B -> A)

# ================================================================ LANDING: bar 16 = 48.2 s, the race starts ======================
K(LAND, 1.0); SN(LAND, 0.8); don(LAND, 1.3, f=55)
fx.add(impact(2.5, seed=5), LAND, 0.38); fx.add(crash(3.0, seed=6), LAND, 0.36, pan=0.1)
L_, R_ = fb_chord(CH['Aadd9'][1], 2.2, scoop=1.0, cutoff=8000, r=0.3, seed=99); e_ = np.exp(-np.arange(len(L_)) / SR / 0.9)
chords.add((L_ * e_, R_ * e_), LAND, 0.6)                      # the chord dies away over the whole tail (not held, then cut)
for j, s in enumerate(['A3', 'C4', 'E4', 'A4', 'B4', 'C5', 'E5', 'A5']):   # the koto's strum
    kot.add(koto(mtof(nm(s)), 2.4, 0.6 + 0.04 * j, None, 0.62, 2.4, seed=900 + j), LAND + 0.018 * j, 0.32, pan=-0.6 + 0.17 * j)
for s, g in (('A5', 0.4), ('C6', 0.3), ('E6', 0.26)): kot.add(koto(mtof(nm(s)), 2.4, 0.9, YURI if s == 'A5' else None, 0.65, 2.2, seed=950 + len(s) + int(g * 10)), LAND, g, pan=0.05)
for j, m in enumerate(CH['Aadd9'][1]): keys.add(epiano(mtof(m), 1.6, 0.6, r=0.8), LAND + 0.005 * j, 0.26, pan=-0.35 + 0.18 * j)
bells.add(glass(mtof(nm('A6')), 1.5, 0.8, r=0.8), LAND, 0.2, pan=-0.1)
lb = bass(mtof(45), 2.3, 1.0, bright=0.6); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass_b.add(lb, LAND, 0.42)   # A2, and the A1 under it
bass_b.add(voice_sub(mtof(33), 1.6, a=0.004, r=0.7) * np.exp(-np.arange(int(2.3 * SR)) / SR / 0.8), LAND, 0.3)

# ================================================================ MIX =============================================================
build_b.curve(GAP); taiko_b.L += build_b.L; taiko_b.R += build_b.R   # the builds' tumbles, through the gap, join the taiko
def duck(times, depth, release):   # the sidechain's gain curve, smoothed (its window ends with a small step otherwise: a click on the bass)
    return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)
HITS = {S.t(0), S.t(12), LAND}                # the drops' and the landing's first chords hit in full (no pump on them)
bass_b.curve(duck(kicks, 0.55, 0.14)); chords.curve(duck(sorted((set(pumps) | set(kicks)) - HITS), 0.6, 0.16))
kot.curve(duck(backbeats, 0.2, 0.05))   # the koto steps aside for the snare's crack (2 dB, 50 ms)
keys.curve(duck(kicks, 0.3, 0.12)); arp.curve(duck(kicks, 0.25, 0.12)); pad.curve(duck(kicks, 0.4, 0.18))
t_ = lambda bar, beat=0: S.t(bar, beat)
hpc = curve([(0, 20), (t_(-1, 1.5), 20), (t_(0) - 0.03, 260), (t_(0), 20), (t_(11, 1.5), 20), (t_(12) - 0.03, 200), (t_(12), 20), (S.len, 20)])
for x in (bass_b, drums, taiko_b): x.L = hp(x.L, hpc); x.R = hp(x.R, hpc)   # (the drop's low end lands harder)
fk = curve([(0, 2400), (t_(-5), 2400), (t_(-2), 5000), (t_(0) - 0.05, 7000), (t_(0), 18000), (S.len, 18000)])   # the preview: far, then near
kot.L = lp(kot.L, fk); kot.R = lp(kot.R, fk)
fc = curve([(0, 18000), (t_(8), 18000), (t_(8, 1), 1500), (t_(10), 4500), (t_(12) - 0.1, 14000), (S.len, 18000)])  # the breath closes, the build opens
chords.L = lp(chords.L, fc); chords.R = lp(chords.R, fc)
chords.filt(lambda x: hp1(x, 200) - 0.5 * bp(x, 1250, 0.25)); keys.filt(lambda x: hp1(x, 160)); pad.filt(lambda x: hp1(x, 150)); kot.filt(lambda x: hp1(x, 180) + 0.25 * bp(x, 2600, 0.3))
arp.filt(lambda x: hp1(x, 150)); flute.filt(lambda x: hp1(x, 250)); perc.filt(lambda x: lp1(x, 12000)); fx.filt(lambda x: lp1(x, 12000)); bells.filt(lambda x: hp1(x, 400)); bass_b.filt(lambda x: hp1(x, 32))
pad.width(1.4); arp.width(1.2)
# city-pop e-piano: a gentle stereo tremolo
tt = np.arange(S.n) / SR; trem = 0.22 * np.sin(TAU * 3.2 * tt); keys.L *= 1 + trem; keys.R *= 1 - trem
# sends: one bright hall for everything, a short room for the drums and the taiko, delays on the koto and the flute
verb_in = S.bus()
for x, a in ((pad, 0.4), (kot, 0.2), (arp, 0.35), (flute, 0.45), (chords, 0.1), (keys, 0.2), (bells, 0.45), (taiko_b, 0.3), (fx, 0.2), (perc, 0.05), (drums, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.2, decay=2.8, damp=0.25, predelay=0.025); vl, vr = vl * 1.3, vr * 1.3
room_l, room_r = reverb(drums.L * 0.12 + taiko_b.L * 0.2, drums.R * 0.12 + taiko_b.R * 0.2, size=0.5, decay=0.8, damp=0.4)
dk = kot.send_delay(b * 0.75, 0.16, fb=0.3, damp=0.45)
df = flute.send_delay(b * 1.0, 0.3, fb=0.42, damp=0.4)
# (checks while mixing, before the master: --stems each bus's level, phone-band level and width in the intro and the main; --win a b ...
#  each bus's level in those windows (s); --hookband who owns the hook's register (500-2500 Hz) in the drops; --clicks isolated bursts
#  above 12 kHz in the sustained parts, where a click would show)
STEMS = (('drums', drums), ('perc', perc), ('taiko', taiko_b), ('bass', bass_b), ('chords', chords), ('keys', keys), ('pad', pad), ('koto', kot),
         ('arp', arp), ('flute', flute), ('bells', bells), ('fx', fx), ('verb', type('v', (), {'L': vl, 'R': vr})))
def mono(x, a, z): return 0.5 * (x.L[int(a * SR):int(z * SR)] + x.R[int(a * SR):int(z * SR)])
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
if '--stems' in sys.argv:
    for nm_, x in STEMS:
        for sec, (a, z) in (('intro', (0, DROP)), ('main', (DROP, END))):
            m = mono(x, a, z); sd = 0.5 * (x.L[int(a * SR):int(z * SR)] - x.R[int(a * SR):int(z * SR)])
            print(f'{nm_:7s} {sec:5s} rms {db(m):6.1f} phone {db(lp(hp(hp(m, 220), 220), 7000)):6.1f} side/mid {db(sd) - db(m):6.1f}', end='   ' if sec == 'intro' else '\n')
if '--win' in sys.argv:
    w = [float(v) for v in sys.argv[sys.argv.index('--win') + 1:]]
    for nm_, x in STEMS: print(f'{nm_:7s}', '  '.join(f'{db(mono(x, a, z)):6.1f}' for a, z in zip(w[::2], w[1::2])))
if '--hookband' in sys.argv:
    for nm_, x in STEMS: print(f'{nm_:7s} hook band: drops 0-7 {db(lp(hp(mono(x, S.t(0), S.t(8)), 500, 0.3), 2500, 0.3)):6.1f}   final {db(lp(hp(mono(x, S.t(12), S.t(16)), 500, 0.3), 2500, 0.3)):6.1f}')
if '--clicks' in sys.argv:
    from scipy.ndimage import median_filter
    for nm_, x in STEMS[3:11]:
        y = hp(hp(mono(x, 0, S.len), 12000), 12000); e = (np.sqrt(lp1(y ** 2, 800)) + 1e-7)[::22]; r = 20 * np.log10(e / (median_filter(e, size=200) + 1e-6))
        ts = sorted({round(i * 22 / SR, 2) for i in np.where((r > 14) & (20 * np.log10(e) > -70))[0]})
        print(f'{nm_:7s} {len(ts)} bursts (plucks and the slap bass make them on purpose); outside the breath:', [float(t_) for t_ in ts if not 34.0 < t_ < 37.7][:10])
LUFS, CEIL, HIGHS_DB, LOWS_DB = -11.8, -1.1, 0.5, -1.0   # (the crispness is in the drums themselves: only a little master tilt)
res = S.master([drums, perc, taiko_b, bass_b, chords, keys, pad, kot, arp, flute, bells, fx, (vl, vr), (room_l, room_r), dk, df],
               HERE + '/out/japan', lufs=LUFS, ceiling=CEIL, highs_db=HIGHS_DB, lows_db=LOWS_DB)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
if '--phone' in sys.argv:   # the arc as a phone plays it (220 Hz-7 kHz): each bar, the intro against the main, each drop against its build
    w_ = wavfile.read(res['file'])[1].astype(float).mean(1) / 32768; ph_ = lp(hp(hp(w_, 220), 220), 7000)
    lvl = lambda a, z: db(ph_[int(a * SR):int(z * SR)])
    print('phone band per bar:', '  '.join(f'{k}:{lvl(S.t(k), S.t(k + 1)):.1f}' for k in range(-11, N)))
    print(f'intro 4-13 s {lvl(4, 13) - lvl(DROP, END):+.1f} dB against the main; bars 10-11 {lvl(S.t(10), S.t(12)) - lvl(S.t(8), S.t(10)):+.1f} dB against the breath')
    for k in (0, 12): print(f'the drop at bar {k}: {lvl(S.t(k), S.t(k + 0.5)) - lvl(S.t(k - 0.5), S.t(k)):+.1f} dB over the half bar before it')
