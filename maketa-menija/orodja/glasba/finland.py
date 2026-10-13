"""Finland (Ouninpohja: gravel over crest after crest, big jumps, spruce forest, lakes glinting between the trees): Nordic melodic techno.
A kantele (Finland's plucked national instrument: steel strings over a spruce box; computed here as a Karplus-Strong string with a
lightly damped loop, so the steel keeps ringing bright, and a twin string a hair sharper) sings the hook and rolls the broken chords;
cold, airy pads in open voicings; a rolling sixteenth-note bass under a four-on-the-floor; a glassy lead for the B part; wind in the
spruces and a loon across a lake on the globe. E minor (the harmonic minor's D# only in the cadences), 127.66 bpm: 15 bars from the
drop to the race's start.
The hook: its rhythm is 3+2+3+2+3+3 sixteenths (long-short, long-short, as Finnish words fall, stressed on the first syllable); its
call stays on the five strings of the old kantele (E F# G A B) until it leaps a minor sixth, and the answer climbs above them and
falls home. Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  wind in the spruces and a dark pad swelling; the kantele's open strings touched once (3.1 s);
                                     the call at half speed from bar -8 (5.0 s); a loon calls across the lake (7.3 s), another answers
                                     far off (11.5 s); the answer's outline; the arp and a muffled pulse; the call's first bar at
                                     speed, then only its first cell (the leap and the answer are kept for the drop); the build (iv - V):
                                     the roll and the riser stop a beat early, so the pickup sings alone into the drop
    drop  (20.0 s)     bar 0         the groove and the hook: Em9 Cmaj9 G/B Dadd9
    A 0-3 (the hook), B 4-7 (the glass lead: three steps down and a fifth up, each crest lower; Am9 Em/G Cmaj9 B7; the filter dips
    and opens again), the jump 8 (airtime over a crest: no drums, no bass, the call echoing over the lake, softer), touchdown 9 (a
    thump and gravel, then the drive back: the kantele runs up the D chord, stabs, the arp an octave up, a riser), final A 10-13
    (everything, a resonant sweep on the stabs), the launch 14 (Am7 - B7), LANDING at bar 15 = 48.2 s: E minor, the kantele strummed,
    the crash; it rings out through the tail
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 15                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 127.66 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SWING = 0.05                                  # the odd sixteenths a hair late (a techno shuffle, barely felt)
def T(bar, p=0.0):                            # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (SWING if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample (log: for cutoffs)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return np.exp(np.interp(x, tp, np.log(vp))) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(358)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
@nb.njit(cache=True, fastmath=True)
def _steel(f, n, t60, damp, bright, seed, pick):
    """one steel string (Karplus-Strong): a delay line of one period, a gentle one-zero lowpass in the loop (damp: 0 none .. 0.5 the
    classic average) and an allpass for the fraction of a sample; the delays add up to exactly one period (in tune). It is excited
    by one period of soft noise (bright: its lowpass) combed at the pluck position. t60: seconds to -60 dB at the fundamental."""
    np.random.seed(seed)
    L = 44100.0 / f - damp; N = int(L - 0.2); frac = L - N; c = (1.0 - frac) / (1.0 + frac)
    g = 10.0 ** (-3.0 / (t60 * f)); M = N + 4
    exc = np.zeros(N); s = 0.0
    for i in range(N):
        s += bright * ((np.random.random() * 2.0 - 1.0) - s); exc[i] = s
    p = max(1, int(N * pick)); ex = exc.copy()
    for i in range(p, N): ex[i] = exc[i] - exc[i - p]
    buf = np.zeros(M); y = np.zeros(n); w = 0; prev = 0.0; apx = 0.0; apy = 0.0
    for i in range(n):
        r = buf[(w - N + M) % M]
        v = g * ((1.0 - damp) * r + damp * prev); prev = r
        o = c * v + apx - c * apy; apx = v; apy = o
        if i < N: o += ex[i]
        buf[w] = o; y[i] = o; w += 1
        if w >= M: w = 0
    return y

def kantele(f, dur, bright=0.34, t60=2.4, seed=0, pick=0.21):
    """the kantele: a steel string plucked with a fingertip (a soft attack, but the steel rings on bright: the loop is damped less
    for the high strings) and its twin a hair sharper (the shimmer of the undamped strings); left mostly the one, right mostly the
    other. The spruce box's resonances are added on the bus. Returns (left, right)."""
    n = int(dur * SR); d = min(0.3, 0.035 * 440.0 / f)
    a = _steel(float(f), n, t60, d, bright, seed, pick)
    z = _steel(float(f) * 2 ** (1.4 / 1200), n, t60 * 0.85, d, bright * 0.85, seed + 977, pick * 1.4)
    k = min(n, int(0.05 * SR)); env = np.ones(n); env[n - k:] = np.linspace(1, 0, k) ** 2; env[:24] = np.linspace(0, 1, 24)
    return ((a * 0.8 + z * 0.35) * env * 1.5, (z * 0.8 + a * 0.35) * env * 1.5)

def ice_saws(f, n, seed=0):
    """six saws detuned at uneven spacings (so they shimmer instead of throbbing), less for the low notes (no slow wobble)"""
    r = np.random.default_rng(seed); dt = 0.0045 * min(1.0, f / 350.0); out = np.zeros(n)
    for o in (-1.0, -0.58, -0.2, 0.23, 0.61, 1.0): out += saw(f * (1 + o * dt * (1 + 0.15 * r.random())), n, r.random())
    return out / 4.3

def cold_pad(f, dur, cutoff=3000, a=0.05, r=0.5, seed=0):
    """a cold, airy pad voice: two stacks of detuned saws, one per side (wide), through a soft lowpass"""
    n = int((dur + r) * SR); e = adsr(n, a, 0.5, 0.85, r, gate=dur)
    l = lp(ice_saws(f, n, seed * 2), cutoff, 0.1); rr = lp(ice_saws(f, n, seed * 2 + 1), cutoff, 0.1)
    return (l * e * 0.55, rr * e * 0.55)

def glass(f, dur, a=0.06, r=0.4, vib=0.0035, seed=0):
    """the B part's lead: a hollow, glassy tone (a triangle, a thin pulse and the octave), two voices a few cents apart, a breath of
    noise and a slow vibrato that blooms on long notes: cold air through a reed. Returns (left, right)."""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    v = 1 + vib * np.sin(TAU * 5.0 * t + rr.random() * 6) * np.clip((t - 0.25) / 0.5, 0, 1)
    out = []
    for dt in (-0.0022, 0.0022):
        fr = f * v * (1 + dt)
        x = tri(fr, n, rr.random()) * 0.55 + pulse(fr, n, 0.2, rr.random()) * 0.16 + sine(fr * 2, n, rr.random()) * 0.22
        out.append(lp(x, 4800, 0.08))
    br = bp(noise(n, seed + 3), min(f * 2.0, 9000), 0.5) * 0.05
    e = adsr(n, a, 0.4, 0.8, r, gate=dur)
    return ((out[0] + br) * e * 0.42, (out[1] + br) * e * 0.42)

def saw_pluck(f, dur=0.3, seed=0):
    """a trance pluck (three detuned saws through a lowpass that snaps shut): the hook's hard edge"""
    n = int((dur + 0.12) * SR); t = np.arange(n) / SR
    y = lp(supersaw(f, n, 3, 0.12, 0.7, seed), 500 + 6000 * np.exp(-t / 0.05), 0.15)
    return y * np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.16) * 0.5

def roll_bass(f, dur, accent=1.0, bright=1.0):
    """the rolling bass: a saw, a thin pulse and a sine on the fundamental through a lowpass that blips open on each note, plus its
    growl (the same tone through a band near its fifth harmonic, 300-560 Hz, so the roll is heard on a phone too), driven together"""
    n = int((dur + 0.03) * SR); t = np.arange(n) / SR
    x = saw(f, n) * 0.55 + pulse(f * 1.003, n, 0.4) * 0.18 + sine(f, n, 0.25) * 0.6
    y = lp(x, 300 + 2000 * bright * accent * np.exp(-t / 0.05), 0.32)
    y = sat(y + bp(y, min(5 * f, 560), 0.45) * 1.5, 2.0)
    return y * adsr(n, 0.002, 0.07, 0.6, 0.025, gate=dur) * (0.75 + 0.29 * accent)

def soft_clip(x, c):   # a soft knee: transparent below about c/2, never above c (for noise: the cymbals' and the risers' peaks)
    return x / (1 + (np.abs(x) / c) ** 4) ** 0.25

@nb.njit(cache=True, fastmath=True)
def _ride(L, R, thr, ta, tr):
    """the gain of a fast peak limiter: the gain each sample needs to stay under thr, dipping ta seconds ahead of a peak (a backward
    pass) and coming back over tr seconds after it (a forward pass). A gain ride, not a waveshaper: no distortion of the tone."""
    n = L.shape[0]; need = np.ones(n)
    for i in range(n):
        p = max(abs(L[i]), abs(R[i]))
        if p > thr[i]: need[i] = thr[i] / p
    ka = 1.0 - math.exp(-1.0 / (ta * 44100.0)); kr = 1.0 - math.exp(-1.0 / (tr * 44100.0))
    e = 1.0; gb = np.ones(n)
    for i in range(n - 1, -1, -1):
        e += (1.0 - e) * ka
        if need[i] < e: e = need[i]
        gb[i] = e
    e = 1.0; gf = np.ones(n)
    for i in range(n):
        e += (1.0 - e) * kr
        if gb[i] < e: e = gb[i]
        gf[i] = e
    return gf
def hold_peaks(bus, thr, ta=0.0015, tr=0.04):   # hold a bus's peaks under thr (a number or a curve)
    g = _ride(bus.L, bus.R, np.broadcast_to(np.asarray(thr, dtype=float), bus.L.shape).copy(), ta, tr); bus.L *= g; bus.R *= g

def boom(f=41.2, dur=2.6, seed=0):
    """the impact, tuned to the key (low E): a sine dropping onto its note, and a thud of dark noise"""
    n = int(dur * SR); t = np.arange(n) / SR
    return np.tanh(sine(f * (1 + 2.0 * np.exp(-t / 0.06)), n) * np.exp(-t / 0.9) * 1.6) * 0.8 + lp(noise(n, seed), 1200) * np.exp(-t / 0.35) * 0.3

def spruce_wind(dur, seed=0):
    """wind in the spruces: noise through a slowly wandering band, in gusts, and the hiss of the needles (left and right apart)"""
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = 850 * 2 ** (0.9 * np.sin(TAU * 0.06 * t + seed + 1.7 * k) + 0.4 * np.sin(TAU * 0.17 * t + 2 * seed + k))
        x = bp(noise(n, seed * 10 + k), fc, 0.6) * 0.6 + hp(noise(n, seed * 10 + k + 5), 5000) * 0.1
        out.append(x * (0.45 + 0.55 * np.sin(TAU * 0.08 * t + seed + 0.6 * k) ** 2))
    return tuple(out)

def loon(f0, f1, dur=2.8, seed=0):
    """a loon's wail across a lake (the diver of the Finnish lakes): a pure, hollow tone that scoops up to its note, holds, breaks up
    to a second note and sags away with a slow tremble"""
    n = int(dur * SR); t = np.arange(n) / SR
    st = lambda t0, w: 0.5 * (1 + np.tanh((t - t0) / w))
    lg = np.log2(f0) - 0.3 * (1 - st(0.15, 0.05)) + (np.log2(f1) - np.log2(f0)) * st(dur * 0.45, 0.05) - 0.12 * st(dur * 0.85, 0.12)
    fr = 2 ** lg * (1 + 0.007 * np.sin(TAU * 4.2 * t) * st(0.7, 0.2))
    x = sine(fr, n) + 0.3 * sine(fr * 2, n) + 0.1 * sine(fr * 3, n) + bp(noise(n, seed), fr * 2, 0.4) * 0.05
    env = np.clip(t / 0.2, 0, 1) ** 2 * np.clip((dur - t) / 0.8, 0, 1) * (1 - 0.25 * st(dur * 0.43, 0.04) * (1 - st(dur * 0.47, 0.04)))
    return lp(x, 2500) * env * 0.35

def whoosh(dur, seed=0):
    """the car flying over a crest: air rushing up and away, passing from left to right"""
    n = int(dur * SR); x = np.linspace(0, 1, n); fc = 300 * 25 ** np.sin(np.pi * x); env = np.sin(np.pi * x) ** 2
    l = bp(noise(n, seed), fc, 0.6) * env; r = bp(noise(n, seed + 1), fc * 1.05, 0.6) * env
    return (l * np.cos(x * np.pi / 2), r * np.sin(x * np.pi / 2))

def gravel(seed=0, dur=0.08):
    """gravel spraying off the tyres: a handful of tiny stones (clicks of bright noise) within a few hundredths of a second"""
    n = int(dur * SR); r = np.random.default_rng(seed); x = np.zeros(n); t = np.arange(n) / SR
    for k in range(int(r.integers(6, 14))):
        i = int(r.integers(0, n - 300)); ln = int(r.integers(40, 200))
        x[i:i + ln] += r.uniform(0.3, 1.0) * np.exp(-np.arange(ln) / (ln / 5)) * noise(ln, int(r.integers(1 << 30)))
    return hp(x, 3000, 0.2) * np.exp(-t / (dur * 0.6))

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

# ================================================================ harmony ========================================================
# chord -> (bass, pad voicing, the arp's four strings) in midi. The A part's pads keep G3-D4 as a frame and move the upper voices by
# step (F#4-E4-G4-E4, B4-B4-B4-A4); no root-position block triads: ninths, inversions, the bass walking E C B D under them.
CH = {'Em9':      (40, [55, 62, 66, 71], [64, 71, 74, 78]),       # G3 D4 F#4 B4 over E2
      'Cmaj9':    (36, [55, 62, 64, 71], [60, 67, 71, 74]),       # G3 D4 E4 B4 over C2
      'G/B':      (35, [55, 62, 67, 71], [59, 67, 71, 74]),       # G3 D4 G4 B4 over B1
      'Dadd9':    (38, [54, 62, 64, 69], [62, 69, 74, 76]),       # F#3 D4 E4 A4 over D2
      'Am9':      (45, [55, 60, 64, 71], [57, 64, 71, 72]),       # G3 C4 E4 B4 over A2
      'Em/G':     (43, [55, 59, 64, 71], [55, 64, 71, 74]),       # G3 B3 E4 B4 over G2
      'Cmaj9b':   (36, [55, 59, 64, 74], [60, 67, 71, 76]),       # G3 B3 E4 D5 over C2 (the B part's: the top voice lifts)
      'B7sus4':   (35, [54, 59, 64, 69], [59, 66, 69, 76]),       # F#3 B3 E4 A4 over B1
      'B7':       (35, [54, 59, 63, 69], [59, 66, 69, 75]),       # F#3 B3 D#4 A4 over B1 (the harmonic minor's leading tone)
      'Cmaj7#11': (36, [55, 59, 64, 66], [60, 67, 71, 78]),       # G3 B3 E4 F#4 over C2 (the jump: a cold lydian shimmer)
      'Dsus4':    (38, [57, 62, 67, 69], [62, 69, 74, 79]),       # A3 D4 G4 A4 over D2 (every voice rising out of the jump)
      'D':        (38, [57, 62, 66, 69], [62, 69, 74, 78]),       # A3 D4 F#4 A4 over D2
      'Am7':      (33, [55, 60, 64, 69], [57, 64, 69, 72]),       # G3 C4 E4 A4 over A1
      'Em':       (40, [55, 59, 64, 66, 71], [52, 59, 64, 67])}   # the landing: G3 B3 E4 F#4 B4 over E2
HARM = {-10: 'Em9', -9: 'Em9', -8: 'Em9', -7: 'Em9', -6: 'Cmaj9', -5: 'Cmaj9', -4: [(0, 'G/B'), (2, 'Dadd9')], -3: 'Em9', -2: 'Am9',
        -1: [(0, 'B7sus4'), (2, 'B7')],
        0: 'Em9', 1: 'Cmaj9', 2: 'G/B', 3: 'Dadd9', 4: 'Am9', 5: 'Em/G', 6: 'Cmaj9b', 7: [(0, 'B7sus4'), (3, 'B7')],
        8: 'Cmaj7#11', 9: [(0, 'Dsus4'), (2, 'D')], 10: 'Em9', 11: 'Cmaj9', 12: 'G/B', 13: 'Dadd9', 14: [(0, 'Am7'), (2, 'B7')], 15: 'Em'}
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]
    if isinstance(h, str): return [(0, 4, h)]
    return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]
def spans(bar0, bar1):   # the chords of bars bar0..bar1-1 as (start s, length s, chord); a chord held over bars is one span
    out = []
    for bar in range(bar0, bar1):
        for b0, b1, c in chords_in(bar):
            t0, t1 = S.t(bar, b0), S.t(bar, b1)
            if out and out[-1][2] == c and abs(out[-1][0] + out[-1][1] - t0) < 1e-6: out[-1] = (out[-1][0], t1 - out[-1][0], c)
            else: out.append((t0, t1 - t0, c))
    return out

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
HOOK = [[(0, 3, 'B5'), (3, 2, 'G5'), (5, 3, 'A5'), (8, 2, 'E5'), (10, 3, 'G5'), (13, 3, 'F#5')],      # Em9: the call, on five strings
        [(0, 3, 'B5'), (3, 2, 'G5'), (5, 3, 'A5'), (8, 2, 'E5'), (10, 6, 'C6')],                     # Cmaj9: ... and the leap
        [(0, 3, 'D6'), (3, 2, 'B5'), (5, 3, 'C6'), (8, 2, 'G5'), (10, 3, 'B5'), (13, 3, 'A5')],      # G/B: the answer, a third higher
        [(0, 3, 'A5'), (3, 2, 'F#5'), (5, 3, 'G5'), (8, 2, 'D5'), (10, 6, 'E5')]]                    # Dadd9: falls home (open, the 9th)
HOOK_END = [(0, 3, 'A5'), (3, 2, 'F#5'), (5, 3, 'G5'), (8, 2, 'A5'), (10, 6, 'B5')]                  # the final's last bar: up, not home
LAUNCH = [(0, 3, 'C6'), (3, 2, 'B5'), (5, 3, 'A5'), (8, 2, 'B5'), (10, 6, 'D#6')]                    # Am7 - B7: the leading tone, held
B_TUNE = [[(0, 4, 'C6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 8, 'E6')],                                 # the B part: three steps down and
          [(0, 4, 'B5'), (4, 2, 'A5'), (6, 2, 'G5'), (8, 8, 'D6')],                                 # a fifth up, each crest a step lower
          [(0, 4, 'A5'), (4, 2, 'G5'), (6, 2, 'E5'), (8, 8, 'B5')],
          [(0, 4, 'B5'), (4, 2, 'A5'), (6, 2, 'F#5'), (8, 4, 'E5'), (12, 4, 'D#5')]]
SLOW_CALL = [[(0, 6, 'B5'), (6, 4, 'G5'), (10, 6, 'A5'), (16, 4, 'E5'), (20, 6, 'G5'), (26, 6, 'F#5')],   # the globe: the call at
             [(0, 6, 'B5'), (6, 4, 'G5'), (10, 6, 'A5'), (16, 4, 'E5'), (20, 12, 'C6')]]                 # half speed
OUTLINE = [(0, 6, 'D6'), (6, 4, 'B5'), (10, 6, 'A5')]                                                # the answer's outline
CELL = [(0, 3, 'B5'), (3, 2, 'G5'), (5, 3, 'A5'), (8, 8, 'E5')]                                         # the build: the call's cell only
ECHO = [(2, 2, 'B5'), (5, 3, 'G5'), (8, 2, 'A5'), (12, 4, 'E5')]                                       # the jump: the call over the lake
TOUCH = [(0, 3, 'A5'), (3, 2, 'G5'), (5, 3, 'A5'), (8, 2, 'D5'), (10, 2, 'E5'), (12, 2, 'F#5'), (14, 2, 'A5')]   # touchdown: back up

kant, arp, lead, pad, stabs, bass, drums, perc, fx, atmos, echo = (S.bus(x) for x in 'kantele arp lead pad stabs bass drums perc fx atmos echo'.split())
kicks = []

def sing(bar, phrase, gain=0.5, octave=0, bright=0.34, t60=2.4, ring=0.9, pan=0.0, dst=None, pluck_=0.0, glass_=0.0, sparkle=0.0, grel=0.25):
    """the kantele plays a phrase; pluck_: a saw pluck doubles it (an edge), glass_: the glass lead sustains it (grel: its release),
    sparkle: a second kantele an octave higher"""
    dst = dst or kant
    for i, (p, ln, name) in enumerate(phrase):
        m = nm(name) + 12 * octave; t = T(bar, p); dur = ln / 4 * b; g = gain * hum(0.05) * (1.08 if p % 4 == 0 else 1.0); sd = (bar + 20) * 50 + i
        dst.add(kantele(mtof(m), dur + ring, bright, t60, seed=sd), t, g, pan=pan)
        if sparkle: dst.add(kantele(mtof(m + 12), dur + ring * 0.7, bright * 0.9, t60 * 0.8, seed=sd + 7), t, g * sparkle, pan=0.25 - pan)
        if pluck_: lead.add(saw_pluck(mtof(m), seed=sd), t, g * pluck_)
        if glass_: lead.add(glass(mtof(m), dur * 0.95, a=0.02, r=grel, seed=sd), t, g * glass_)

ARP_A = [0, 2, 3, 1, 3, 0, 2, 3, 1, 3, 0, 2, 3, 1, 2, 3]     # the broken chord in the hook's 3+2+3+2+3+3 (the low strings lead each group)
ACC_A = {0, 3, 5, 8, 10, 13}
ARP_B = [0, 1, 2, 3, 2, 1]                                  # the B part: a six-step wave rolling across the four-beat bar
def arp_bar(bar, gain, octave=0, step=1, pattern='A', bright=0.36, t60=1.3, ring=0.5, upto=16):
    for b0, b1, c in chords_in(bar):
        tones = [m + 12 * octave for m in CH[c][2]]
        for p in range(b0 * 4, min(b1 * 4, upto), step):
            if pattern == 'A': j, v = ARP_A[p], (1.0 if p in ACC_A else 0.62)
            else: j, v = ARP_B[(bar * 16 + p) % 6], (1.0 if p % 4 == 0 else 0.72 if p % 2 == 0 else 0.56)
            arp.add(kantele(mtof(tones[j]), ring, bright, t60, seed=(bar + 20) * 64 + p), T(bar, p), gain * v * hum(0.1), pan=0.45 if p % 2 else -0.45)

PADPAN = [-0.55, -0.18, 0.18, 0.55, 0.0]
def pad_span(t0, ln, c, gain, a=0.04, r=0.4, cutoff=3200):
    for j, m in enumerate(CH[c][1]):
        pad.add(cold_pad(mtof(m), ln, cutoff, a, r, seed=m * 3 + j), t0, gain, pan=PADPAN[j])

def stab_bar(bar, gain, upto=16):
    """offbeat chord stabs (trance's 'and' between the kicks): short, bright, in the final"""
    for b0, b1, c in chords_in(bar):
        for p in range(b0 * 4 + 2, min(b1 * 4, upto), 4):
            for j, m in enumerate(CH[c][1]):
                stabs.add(cold_pad(mtof(m), b * 0.13, 5200, a=0.004, r=0.08, seed=bar * 40 + p * 4 + j), T(bar, p), gain * hum(0.06), pan=PADPAN[j] * 0.8)

ROLL = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15]           # the rolling bass: the three sixteenths after each kick
SCALE = {4, 6, 7, 9, 11, 0, 2}                             # E natural minor
def bass_bar(bar, gain, bright=1.0, pops=(6, 14), steps=ROLL, walk=True, ln=0.82):
    """the rolling bass (an octave pop on the 'and' of beats 2 and 4); walk: the last note steps towards the next bar's root
    (by a step of the scale; over B7 the leading tone D#)"""
    last, nxt = CH[chords_in(bar)[-1][2]][0], CH[chords_in(bar + 1)[0][2]][0]
    for b0, b1, c in chords_in(bar):
        sc = (SCALE - {2}) | {3} if c == 'B7' else SCALE
        for p in steps:
            if b0 * 4 <= p < b1 * 4:
                m = CH[c][0] + (12 if p in pops else 0)
                if walk and p == steps[-1] and nxt != last: m = next(nxt + d for d in ((2, 1) if last > nxt else (-2, -1)) if (nxt + d) % 12 in sc)
                bass.add(roll_bass(mtof(m), s16 * ln, 1.0 if p % 4 == 2 else 0.7, bright), T(bar, p), gain * hum(0.04))

# drum sounds, made once
KICK = kick(dur=0.36, f0=170, f1=50, sweep=0.034, click=0.6, drive=2.2)
CLAP = clap(seed=5); SNR = snare(0.2, tone=200, snappy=0.75, seed=6)
HC = [hat(0.045, seed=s, tone=8500) for s in range(4)]; HO = [hat(open_=True, seed=s + 20, tone=7000) for s in range(3)]
SHK = [shaker(0.08, seed=s) for s in range(4)]; RIM = rim(seed=3); RIDE = [ride(0.9, seed=s) for s in range(2)]
TOMS = {f: tom(f, 0.35) for f in (82, 98, 110, 123, 147, 165, 196)}
def K(t, g=0.44, lpf=None):
    drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)

def groove(bar, kick_=True, clap_=True, chat=0.15, ohat=0.0, shake=0.0, ride_=0.0, toms=0.0, grav=0.0, ghosts=0.07, hat_step=1):
    for k in range(4):
        if kick_: K(S.t(bar, k))
        if clap_ and k in (1, 3): drums.add(CLAP, T(bar, 4 * k), 0.32 * hum(), pan=0.03); drums.add(SNR, T(bar, 4 * k), 0.12 * hum())
        if ohat: perc.add(HO[k % 3], T(bar, 4 * k + 2), ohat * hum(), pan=0.28)
        if ride_: perc.add(RIDE[k % 2], T(bar, 4 * k), ride_ * hum(), pan=-0.3)
    for p in range(16):
        if chat and p % hat_step == 0 and not (ohat and p % 4 == 2): perc.add(HC[p % 4], T(bar, p), chat * (0.55, 0.3, 1.0, 0.38)[p % 4] * hum(0.15), pan=-0.4)
        if shake: perc.add(SHK[p % 4], T(bar, p), shake * (0.5, 0.35, 0.8, 0.45)[p % 4] * hum(0.15), pan=0.55)
    if ghosts:   # quiet rimshots between the beats
        for p in ((7, 15) if bar % 2 else (10, 13)): drums.add(RIM, T(bar, p), ghosts * hum(0.2), pan=-0.25)
    if toms:     # forest drums: low toms on the off-steps
        for p, f, pn in ((3, 98, 0.35), (6, 82, -0.35), (11, 98, 0.35), (14, 123, -0.2)): drums.add(TOMS[f], T(bar, p), toms * hum(0.1), pan=pn)
    if grav:     # gravel spraying off the tyres
        for p in ((2, 7, 10, 15) if bar % 2 else (3, 6, 11, 14)): perc.add(gravel(seed=bar * 16 + p), T(bar, p), grav * hum(0.3), pan=rng.uniform(-0.7, 0.7))

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=190, tone1=250):   # a roll speeding up and swelling into the next bar
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0)
        drums.add(snare(0.15, tone=tone0 + (tone1 - tone0) * x, snappy=0.8, seed=int(t * 1000) % 97), t, (g0 + (g1 - g0) * x ** 1.5) * hum(0.06), pan=0.05)
        t += b / (rate0 + (rate1 - rate0) * x)

# ================================================================ INTRO: the globe (bars -10..-1) ================================
I0 = S.t(-10)                                                    # 1.20 s: the first sound
wl, wr = spruce_wind(S.t(0) + 1.5 - I0, seed=3); x_ = I0 + np.arange(len(wl)) / SR
wg = np.interp(x_, [I0, I0 + 3.0, S.t(-3), S.t(0), S.t(0) + 1.5], [0, 1, 1, 0.35, 0])
atmos.add((wl * wg, wr * wg), I0, 0.22)                          # the wind in the spruces
atmos.add(loon(mtof(nm('B4')), mtof(nm('E5')), 2.8, seed=1), S.t(-7, 1.0), 0.14, pan=-0.55)   # a loon across the lake (7.3 s) ...
atmos.add(loon(mtof(nm('E5')), mtof(nm('D5')), 2.4, seed=2), S.t(-5, 2.0), 0.06, pan=0.65)    # ... and one answering, further away
for i, (t0, ln, c) in enumerate(spans(-10, 0)):                  # the pad: a slow swell, then the chords quicken towards the build
    pad_span(t0, ln, c, 0.3, a=2.5 if i == 0 else 0.5, r=1.0 if t0 < S.t(-3) else 0.35, cutoff=2600)
for t0, ln, c in spans(-10, -3):                                 # a dark drone under it (the forest floor)
    bass.add(voice_bass(mtof(CH[c][0]), ln - 0.1, cutoff=170, env_amt=0.0, a=1.5 if t0 < S.t(-9) else 0.4, r=0.8), t0, 0.03 if t0 < S.t(-5) else 0.045)
for j, (m, t0) in enumerate(((64, S.t(-9)), (71, S.t(-9) + 0.03), (71, S.t(-9, 2.5)), (76, S.t(-9, 2.5) + 0.03))):   # the open strings
    kant.add(kantele(mtof(m), 3.0, 0.3, 3.6, seed=40 + j), t0, 0.16, pan=-0.2 + 0.15 * j)                     # touched (E-B, B-E)
for i, ph in enumerate(SLOW_CALL): sing(-8 + 2 * i, ph, gain=0.3, bright=0.34, t60=3.2, ring=1.8, pan=0.1)   # the call, half speed
sing(-4, OUTLINE, gain=0.3, bright=0.36, t60=3.0, ring=1.5, pan=0.1)                                        # the answer's outline
sing(-3, HOOK[0], gain=0.32, bright=0.3, t60=2.2); sing(-2, CELL, gain=0.34, bright=0.31, t60=2.4)          # the call at speed, its cell
sing(-1, [(0, 8, 'B5')], gain=0.42, bright=0.4, ring=0.5)                                                  # B, let go before the breath
sing(-1, [(12, 2, 'F#5'), (14, 2, 'A5')], gain=0.33, bright=0.4)                                            # the pickup, alone in it
for bar, g, st in ((-5, 0.1, 2), (-4, 0.12, 2), (-3, 0.14, 1), (-2, 0.17, 1)): arp_bar(bar, g, step=st)
arp_bar(-1, 0.2, upto=12)                                        # (the last beat before the drop is left to the pickup)
for p in (2, 6, 10, 14): bass.add(roll_bass(mtof(40), s16 * 1.6, 0.8, 0.3), T(-3, p), 0.2)                 # the bass wakes: offbeats,
bass_bar(-2, 0.22, bright=0.4, pops=(), walk=False); bass_bar(-1, 0.26, bright=0.55, pops=(), steps=ROLL[:-3])          # then rolling
# the pulse: a heartbeat, a muffled kick, then the build (bars -2, -1: works on its own from 15.5 s, the short intro)
for k in (0, 2): K(S.t(-4, k), 0.2, lpf=180)
for k in range(4): K(S.t(-3, k), 0.28, lpf=300); perc.add(SHK[k], T(-3, 4 * k + 2), 0.06, pan=0.5)
for k in range(4): K(S.t(-2, k), 0.36, lpf=600 * 2 ** k)
for k in range(3): K(S.t(-1, k), 0.42)
for p in range(0, 16, 2): perc.add(HC[p % 4], T(-2, p + 1), 0.05 + 0.004 * p, pan=-0.35)
for p in range(12): perc.add(HC[p % 4], T(-1, p), (0.07, 0.04, 0.1, 0.05)[p % 4], pan=-0.35)
# the roll and the riser stop a beat early: a breath (the pickup alone, the cymbal swelling backwards) and then the drop
snare_roll(S.t(-2), S.t(-1), 2, 4, 0.05, 0.13); snare_roll(S.t(-1), T(-1, 12), 4, 8, 0.13, 0.2)
ris = riser(2 * B - b, f0=300, f1=9000, seed=3); k_ = int(2 * s16 * SR); ris[-k_:] *= np.linspace(1, 0, k_) ** 2
fx.add(ris, S.t(-2), 0.22); fx.add(rev_crash(1.4, seed=5), S.t(0) - 1.4, 0.12)

# ================================================================ MAIN: the stage (bars 0..14) ===================================
fx.add(impact(2.5), S.t(0), 0.25); fx.add(crash(2.6, seed=1), S.t(0), 0.38, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
for bar in range(N):
    sec = 'A' if bar < 4 else 'B' if bar < 8 else 'jump' if bar == 8 else 'touch' if bar == 9 else 'final' if bar < 14 else 'launch'
    # drums
    if sec == 'A':       groove(bar, ohat=0.2 if bar >= 2 else 0.0, shake=0.1 if bar >= 2 else 0.0)
    elif sec == 'B':     groove(bar, ohat=0.22 if bar < 6 else 0.26, shake=0.0 if bar < 6 else 0.12, toms=0.22, hat_step=2 if bar < 6 else 1)
    elif sec == 'jump':  [perc.add(SHK[p % 4], T(bar, p), 0.03 + 0.008 * (p - 8), pan=0.5) for p in (8, 10, 12, 14)]
    elif sec == 'touch':   # the touchdown: the kick comes back, claps on 2 and 4 (the thump on 1 is with the fills below)
        for k in range(4): K(S.t(bar, k), 0.4 + 0.02 * k)
        for k in (1, 3): drums.add(CLAP, T(bar, 4 * k), 0.24, pan=0.03)
        for p in range(0, 16, 2): perc.add(HC[p % 4], T(bar, p + 1), 0.07 + 0.004 * p, pan=-0.35)
    elif sec == 'final': groove(bar, ohat=0.24, shake=0.12, ride_=0.16, grav=0.1)
    else:
        for k in range(3): K(S.t(bar, k))
        drums.add(CLAP, T(bar, 4), 0.36, pan=0.03)
        for p in range(14): perc.add(HC[p % 4], T(bar, p), 0.15 * (0.55, 0.3, 1.0, 0.38)[p % 4], pan=-0.4)
    # bass
    if sec == 'B' and bar < 6: bass_bar(bar, 0.45, bright=0.9, steps=[2, 6, 10, 14], ln=1.5)   # B breathes: offbeat eighths
    elif sec in ('A', 'B', 'final'): bass_bar(bar, 0.46 if sec == 'final' else 0.43, bright={'A': 1.0, 'B': 1.2, 'final': 1.35}[sec], walk=bar != 7)
    elif sec == 'touch': bass_bar(bar, 0.38, bright=0.8, pops=(), steps=[2, 5, 6, 7, 9, 10, 11, 13, 14, 15], walk=False)
    elif sec == 'launch': bass_bar(bar, 0.44, bright=1.4, pops=(), steps=ROLL[:-2])
    if sec in ('final', 'launch'): stab_bar(bar, 0.5 if sec == 'final' else 0.55, upto=14 if sec == 'launch' else 16)
    elif sec == 'touch': stab_bar(bar, 0.32)                                   # the drive back after the jump
    # pads (the B part's open a little more each bar; the launch's stop short of the landing chord) and the arp
    for b0, b1, c in chords_in(bar):
        pad_span(S.t(bar, b0), (b1 - b0) * b, c, 0.22 if sec == 'jump' else 0.3, a=0.6 if sec == 'jump' else 0.04, r=1.2 if sec == 'jump' else 0.08 if sec == 'launch' else 0.35,
                 cutoff=2400 * 1.2 ** (bar - 4) if sec == 'B' else 3200)
    if sec == 'A':       arp_bar(bar, 0.18, bright=0.26, ring=0.3) if bar < 2 else arp_bar(bar, 0.23)   # (darker under the hook's first bars)
    elif sec == 'B':     arp_bar(bar, 0.23, octave=1, pattern='B')
    elif sec == 'jump':  arp_bar(bar, 0.18, step=2, ring=1.0, t60=2.5)
    elif sec == 'touch': arp_bar(bar, 0.25, octave=1)
    elif sec == 'final': arp_bar(bar, 0.18, bright=0.26, ring=0.3) if bar < 12 else arp_bar(bar, 0.25, octave=1)
    else:                arp_bar(bar, 0.2, octave=1, upto=14)
# the tunes
for i in range(4): sing(i, HOOK[i], gain=0.6, pluck_=0.18)
for i, ph in enumerate(B_TUNE):   # the glass lead sings the B part, the kantele plucks along softly
    sing(4 + i, ph, gain=0.22, bright=0.42)
    for j, (p, ln, name) in enumerate(ph): lead.add(glass(mtof(nm(name)), ln / 4 * b * 1.02, seed=i * 10 + j), T(4 + i, p), 0.85)
sing(8, ECHO, gain=0.3, dst=echo, ring=1.4)                       # the jump: the call over the lake ...
lead.add(glass(mtof(nm('E5')), B * 0.9, a=0.1, r=0.8, seed=99), S.t(8), 0.32)    # ... over the glass lead's resolution (D# -> E)
sing(9, TOUCH, gain=0.42, pluck_=0.15)                           # touchdown: up the D chord into the final
for i, ph in enumerate(HOOK[:3] + [HOOK_END]): sing(10 + i, ph, gain=0.6, pluck_=0.3, glass_=0.2, sparkle=0.2)
sing(14, LAUNCH[:-1], gain=0.62, pluck_=0.3, glass_=0.2, sparkle=0.2)   # the launch; its leading tone (D#6) is held up to the landing
sing(14, LAUNCH[-1:], gain=0.62, pluck_=0.3, glass_=0.2, sparkle=0.2, ring=0.03, grel=0.05)   # and stops there: E6 takes over
# fills: every fourth bar, and the jump
for p, g in ((13, 0.1), (14, 0.14), (15, 0.2)): drums.add(SNR, T(3, p), g)
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.16); fx.add(crash(2.0, seed=2), S.t(4), 0.18, pan=-0.2)
for p, f in zip(range(12, 16), (165, 147, 123, 98)): drums.add(TOMS[f], T(7, p), 0.22 if p == 12 else 0.3, pan=0.4 - 0.25 * (p - 12))
fx.add(crash(2.5, seed=3), S.t(8), 0.12, pan=0.2); fx.add(whoosh(B * 0.9, seed=5), S.t(8), 0.15); fx.add(downlifter(B, seed=6), S.t(8), 0.08)
# touchdown (bar 9): the thump of the landing car (a clap and a snare, a dull impact), gravel spraying out across, then a riser and a roll
fx.add(rev_crash(0.9, seed=9), S.t(9) - 0.9, 0.14); fx.add(impact(1.6, seed=9), S.t(9), 0.24)
drums.add(CLAP, S.t(9), 0.34, pan=0.03); drums.add(SNR, S.t(9), 0.14)
for k in range(6): perc.add(gravel(seed=700 + k, dur=0.12), S.t(9) + 0.035 * k, 0.3 * (1 - k / 7), pan=-0.7 + 0.28 * k)
fx.add(riser(B, f0=400, f1=8000, seed=7), S.t(9), 0.4); snare_roll(S.t(9, 2), T(9, 15), 4, 8, 0.1, 0.26)
fx.add(rev_crash(0.8, seed=11), S.t(10) - 0.8, 0.16); fx.add(crash(2.5, seed=4), S.t(10), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(10), 0.2)
for p, g in ((14, 0.12), (15, 0.18)): drums.add(SNR, T(13, p), g)
fx.add(crash(2.0, seed=8), S.t(14), 0.2, pan=0.2)
# the launch (bar 14) leads into the landing: a roll, toms tumbling down, a riser, the cymbal swelling backwards
snare_roll(S.t(14, 2), T(14, 15), 4, 10, 0.12, 0.32)
for p, f in zip(range(8, 16, 2), (196, 165, 123, 98)): drums.add(TOMS[f], T(14, p), 0.32, pan=0.45 - 0.3 * (p - 8) / 2)
fx.add(riser(B, f0=500, f1=10000, seed=8), S.t(14), 0.3); fx.add(rev_crash(1.5, seed=10), LAND - 1.5, 0.22)

# ================================================================ LANDING: bar 15 = 48.2 s, the race starts ======================
K(LAND, 0.5)                                                     # (big in the mids: the strum, the crash; the lows held back)
fx.add(hp1(boom(seed=5), 35), LAND, 0.25); fx.add(crash(3.0, seed=6), LAND, 0.36, pan=0.1)
pad_span(LAND, 1.2, 'Em', 0.42, a=0.01, r=1.6, cutoff=4200)
for j, m in enumerate([52, 59, 64, 67, 71, 76, 78, 83]):   # the kantele strummed up the chord
    kant.add(kantele(mtof(m), 2.5, 0.42, 3.0, seed=900 + j), LAND + 0.018 * j, 0.36, pan=-0.6 + 0.17 * j)
sing(15, [(0, 8, 'E6')], gain=0.5, pluck_=0.3, glass_=0.3, ring=1.6, t60=3.0)
lb = voice_bass(mtof(40), 2.3, cutoff=300, env_amt=2.0, a=0.003, r=0.2); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7)
bass.add(lb, LAND, 0.45)
for m, pn in ((nm('E5'), -0.3), (nm('B5'), 0.3)): lead.add(glass(mtof(m), 1.2, a=0.01, r=1.2, seed=m), LAND, 0.3, pan=pn)

# ================================================================ MIX =============================================================
for x in (kant, arp, echo):   # the kantele's spruce box: a warm wooden resonance and the steel's zing
    x.filt(lambda s: hp1(s + bp(s, 420, 0.4) * 0.3 + bp(s, 2900, 0.3) * 0.25, 110))
# the steel strings' spiky peaks held down on their own bus (else the master's limiter would duck the whole mix on every downbeat);
# the landing's strum is held only a little
hold_peaks(kant, curve([(0, 0.5), (LAND - 0.01, 0.5), (LAND, 0.8), (S.len, 0.8)]))
fx.filt(lambda s: soft_clip(s, 0.3))   # (the cymbals' and the risers' noise peaks: rounding them is inaudible, but they hit the limiter)
frost = (hp(noise(S.n, 71), 6500, 0.1), hp(noise(S.n, 72), 6500, 0.1))   # the frost: air above the pads, swelling at the jump
fg = curve([(0, 0), (I0, 0), (S.t(-8), 0.02), (S.t(-2), 0.03), (S.t(0), 0.045), (S.t(8), 0.045), (S.t(8, 2), 0.07), (S.t(9), 0.05),
            (S.t(15), 0.06), (S.len, 0.0)]) * (0.8 + 0.2 * np.sin(TAU * 0.11 * np.arange(S.n) / SR))
atmos.add((frost[0] * fg, frost[1] * fg), 0, 1.0)
# the filter: the globe opens from dark to bright; the B part dips and opens again over its four bars; the jump closes it and the
# touchdown reopens it
fc = curve([(0, 500), (S.t(-7), 900), (S.t(-5), 1500), (S.t(-3), 2400), (S.t(-1), 3800), (S.t(0) - 0.05, 7000), (S.t(0), 12000),
            (S.t(4) - 0.05, 12000), (S.t(4), 3500), (S.t(7, 3), 12000), (S.t(8), 12000), (S.t(8, 1), 1600), (S.t(9) - 0.02, 1800),
            (S.t(9), 3500), (S.t(10) - 0.05, 10000), (S.t(10), 14000), (S.len, 14000)], log=True)
for x in (pad, arp): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
# the stabs: a slow resonant sweep from the touchdown up to the launch
fs = curve([(0, 1600), (S.t(9), 1600), (S.t(10), 2600), (S.t(14), 9000), (S.t(15), 12000), (S.len, 12000)], log=True)
stabs.L = lp(stabs.L, fs, 0.3); stabs.R = lp(stabs.R, fs, 0.3)
pad.filt(lambda s: hp1(s, 150)); stabs.filt(lambda s: hp1(s, 260)); lead.filt(lambda s: hp1(s, 220)); bass.filt(lambda s: hp1(s, 32))
pad.width(1.4); arp.width(1.3)
# the globe: everything but the drums grows through the intro (a journey, not a loop)
swell = curve([(0, 0.6), (S.t(-9), 0.64), (S.t(-7), 0.7), (S.t(-5), 0.78), (S.t(-3), 0.88), (S.t(-1), 1.0), (S.len, 1.0)])
for x in (pad, kant, arp, bass, atmos): x.curve(swell)
pad.curve(curve([(0, 1), (S.t(-1, 3), 1), (S.t(0) - 0.01, 0.5), (S.t(0) + 0.005, 1), (S.len, 1)]))   # the pad breathes in before the drop
# ducking from the kick
bass.curve(S.sidechain(kicks, depth=0.75, release=0.11)); pad.curve(S.sidechain(kicks, depth=0.45, release=0.18))
arp.curve(S.sidechain(kicks, depth=0.3, release=0.12)); stabs.curve(S.sidechain(kicks, depth=0.35, release=0.1)); kant.curve(S.sidechain(kicks, depth=0.12, release=0.1))
lead.curve(S.sidechain(kicks, depth=0.15, release=0.12)); atmos.curve(S.sidechain(kicks, depth=0.3, release=0.15))
# sends: a long, cold 'lake' hall, a short room for the drums, delays on the kantele, the arp, the glass lead and the echo
def mute(t0, t1): return curve([(0, 1), (t0 - 0.01, 1), (t0, 0), (t1, 0), (t1 + 0.01, 1), (S.len, 1)])
lt = mute(T(14, 10) - 0.005, LAND + 0.015)   # the launch's leading tone (D#6) stays out of the hall and the echoes: no D# over the landing
verb_in = S.bus()
for x, a in ((pad, 0.3), (stabs, 0.18), (kant, 0.35 * lt), (arp, 0.35 * lt), (lead, 0.3 * lt), (echo, 0.45), (fx, 0.2), (atmos, 0.5), (perc, 0.06)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=3.4, damp=0.25, predelay=0.025)
vsc = S.sidechain(kicks, depth=0.25, release=0.2); vl, vr = vl * 1.2 * vsc, vr * 1.2 * vsc
room_l, room_r = reverb(drums.L * 0.1, drums.R * 0.1, size=0.4, decay=0.6, damp=0.4)
def send_delay(x, t, amount, fb, damp, gate=None):   # a bus's ping-pong delay (wet), its input muted where gate is 0
    m = 0.5 * (x.L + x.R); a, c = pingpong(m if gate is None else m * gate, t, fb, damp); return a * amount, c * amount
dk = send_delay(kant, b * 0.75, 0.16, 0.35, 0.45, lt)
da = send_delay(arp, b * 0.75, 0.14, 0.3, 0.5, lt)
dl = send_delay(lead, b * 1.5, 0.18, 0.38, 0.45, mute(S.t(14) - 0.005, LAND + 0.015))
de = send_delay(echo, b * 1.0, 0.38, 0.5, 0.35)            # the call answered across the lake
if '--stems' in sys.argv:   # (a check while mixing: each bus's level and width in the intro and the main, before the master)
    for nm_, x in (('drums', drums), ('perc', perc), ('bass', bass), ('pad', pad), ('stabs', stabs), ('kantele', kant), ('arp', arp), ('lead', lead),
                   ('echo', echo), ('fx', fx), ('atmos', atmos), ('verb', type('v', (), {'L': vl, 'R': vr}))):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:8s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master([drums, perc, bass, pad, stabs, kant, arp, lead, echo, fx, atmos, (vl, vr), (room_l, room_r), dk, da, dl, de], HERE + '/out/finland',
               lufs=-11.4, ceiling=-1.1, highs_db=2.0, lows_db=-3.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
