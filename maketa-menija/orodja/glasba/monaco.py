"""Monaco (La Condamine: the harbour street circuit, up the hill, the tight hairpin, through the tunnel, along the water):
French house / nu-disco glamour on a Mediterranean evening. A filtered disco chord loop (a brassy, stringy stab through a sweeping,
resonant low-pass with a slow phaser on it), a funky octave bass with ghost notes and chromatic walk-ups, glittering FM bells on the
hook, a nu-disco lead with a touch of portamento, disco strings (soft sustained chords, a lyrical B tune in octaves, upward runs),
a Rhodes-like FM piano and a harp for the evening glamour, swung sixteenth hats, tambourine and congas.
F major with jazz-tinged chords (maj9, m9, 9, 13sus, 7b9, the borrowed iv minor), 119.15 bpm: 14 bars from the drop to the race.
The hook: 'da-da DAAA, da-da DAAAAA': two quick notes up into a held major seventh on beat two, a turn, a syncopated held sixth;
answered by a line falling to the D9's F sharp and climbing back; then the same a step higher over Gm9, and a chromatic turn round
the dominant's flat nine (Bb Db C Bb) that falls home. The loop always ends on the dominant (C13sus, C7b9), so every return to F
is an arrival, the last one at the landing.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  dusk: a pad (Fmaj9 Dm9 Bbmaj9#11 C13sus under a held E), a few bells like the lights of a
                                     coast at night; at bar -8 (3.9 s, where the full intro is already playing) the curtain opens:
                                     a harp glissando, the electric piano with the hook's outline in slow motion; then the loop
                                     heard from far away (the party on the yachts, through a closed filter) while the bells tease
                                     the hook, the sea; the build (IV - V: the filter opens halfway, the floor lifts away (the
                                     kick and bass thinner), a roll, toms, a string run, a breath)
    drop  (20.0 s)     bar 0         the filter snaps open, the full kick and bass return, the chord hits unducked, an F boom:
                                     the groove, the hook, the disco chords
    A 0-3 (the hook: Fmaj9 | Am9 D9 | Gm9 | C13sus C7b9; the chords' resonant filter breathes with it, open on the call, closing
    on the answer), B 4-7 (the strings' tune falling chromatically over Bbmaj9 | Bbm6 | Am7 Abdim7 | Gm9 A7b9; the filter sweeps
    down and back; bells in sixteenths, congas, the guitar), the tunnel 8-9 (the filter closes, darker, no kick, the hook echoing;
    a roll out into the light), final A 10-13 (everything, the strings' counter-line), LANDING at bar 14 = 48.2 s: F6/9 (the
    hook's last run climbs the diminished chord to the tonic), unducked, the F boom, the harp, the crash; it rings out through
    the tail
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 14                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 119.15 bpm
B, b = S.bar, S.beat
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SWING = 0.14                                  # the odd sixteenths late (a house shuffle: hats, bass and tunes together)
def T(bar, p):                                # time of sixteenth p of a bar (swung); bar 0 = the drop, negative bars = the intro
    ip = int(round(p)); return S.t(bar, (p + (SWING if abs(p - ip) < 1e-6 and ip % 2 else 0.0)) / 4)
def L16(n): return n * b / 4                  # n sixteenths in seconds
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample (log: for cutoffs)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return np.exp(np.interp(x, tp, np.log(vp))) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(23)
def hum(x=0.07): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def disco_kick():
    """a round disco kick, with a beater knock at 165 Hz (what a phone speaker hears of it); the tail fades out (not cut mid-cycle)"""
    k = kick(dur=0.36, f0=140, f1=48, sweep=0.042, click=0.45, drive=1.5); n = len(k); t = np.arange(n) / SR
    knock = sine(165 * (1 + 0.35 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.05) * 0.32
    return sat(k * 0.9 + knock, 1.15) * np.clip((n / SR - t) / 0.1, 0, 1)

def impact_f(dur=3.0, seed=0, f=mtof(nm('F1'))):
    """the boom on the big downbeats, tuned to the tonic F (synth.impact is fixed at 55 Hz, an A under the F chords): a sine
    falling from 3.5x to F1, and a soft thud of noise; it blooms in 25 ms (the kick on the same beat is the attack)"""
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.tanh(sine(f * (1 + 2.5 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.7) * 1.6) * 0.8 + lp(noise(n, seed), 900) * np.exp(-t / 0.4) * 0.35
    return y * np.clip(t / 0.025, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)

def tambourine(dur=0.16, seed=0):
    """jingles: a few bright metallic partials and noise, rattling (the little cymbals shaking against each other)"""
    n = int(dur * SR); t = np.arange(n) / SR; m = np.zeros(n)
    for f, ph in ((5230, .1), (6470, .4), (7910, .7), (9350, .2), (11200, .5)): m += sine(f, n, ph)
    env = np.exp(-t / 0.045) * (0.7 + 0.3 * np.cos(TAU * 85 * t)) * np.clip(t / 0.0015, 0, 1)
    return hp(m * 0.12 + noise(n, seed) * 0.8, 5200, 0.2) * env

def conga(f, dur=0.3, slap=0.0, seed=0):
    """a conga: a skin tone falling a little in pitch, an overtone, the hand's slap"""
    n = int(dur * SR); t = np.arange(n) / SR
    body = sine(f * (1 + 0.14 * np.exp(-t / 0.012)), n) * np.exp(-t / 0.15) + 0.25 * sine(f * 1.59, n) * np.exp(-t / 0.05)
    hit = bp(noise(n, seed), 900 + 2600 * slap, 0.4) * np.exp(-t / (0.004 + 0.012 * slap)) * (0.35 + 0.9 * slap)
    return np.tanh((body + hit) * 1.3) * 0.5

def funk_bass(f, dur, vel=1.0, bright=1.0):
    """the funky bass: saw, narrow pulse and sine, a quick filter 'pop' on each note (harder notes brighter), a little drive"""
    r = 0.035; n = int((dur + r) * SR); t = np.arange(n) / SR
    x = saw(f, n) * 0.55 + pulse(f, n, 0.3) * 0.3 + sine(f, n) * 0.75
    fc = 240 + 260 * bright + (700 + 1700 * bright) * vel * np.exp(-t / 0.05)
    return sat(lp(x, fc, 0.32) * 1.3, 1.7) * adsr(n, 0.002, 0.08, 0.72, r, gate=dur)

def stab_note(f, dur, seed=0, bright=1.0, r=0.07):
    """one note of the disco chord: three saws a hair apart (strings and brass in one) and a soft square an octave up (the
    piano's attack), a quick filter envelope that leaves it bright: the resonant bus filter does the sweeping over all of it"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    x = (saw(f, n, rr.random()) * 0.45 + saw(f * 1.0045, n, rr.random()) * 0.35 + saw(f * 0.9955, n, rr.random()) * 0.35
         + pulse(f * 2, n, 0.5, rr.random()) * 0.1)
    return lp(x, 3000 + 4500 * bright * np.exp(-t / 0.07), 0.12) * adsr(n, 0.003, 0.12, 0.62, r, gate=dur)

def lead_voice(f, dur, glide_from=None, bright=1.0, vib=0.005):
    """the hook's voice: a pulse with a slowly moving width and two saws a hair apart, portamento from the note before on legato
    steps, a delayed vibrato, a filter that blooms on the attack"""
    r = 0.14; n = int((dur + r) * SR); t = np.arange(n) / SR
    fr = np.full(n, f) if glide_from is None else f * (glide_from / f) ** np.exp(-t / 0.018)
    fr = fr * (1 + vib * np.sin(TAU * 5.4 * t) * np.clip((t - 0.2) / 0.25, 0, 1))
    x = pulse(fr, n, 0.5 + 0.15 * np.sin(TAU * 0.7 * t)) * 0.45 + saw(fr * 1.003, n) * 0.35 + saw(fr * 0.997, n) * 0.25
    y = lp(x, np.minimum(2400 * bright + 4200 * bright * np.exp(-t / 0.15), 14000), 0.22)
    return y * adsr(n, 0.006, 0.25, 0.78, r, gate=dur)

def fm_bell(f, dur=1.2, bright=1.0, decay=1.0):
    """a glittering FM bell: a carrier, a modulator at 3.5x (the glassy, inharmonic strike, gone in a tenth of a second) and one at
    1x (the warm body), a second carrier an octave up, a hair sharp (the glint); the indices shrink on high notes (no aliasing)"""
    n = int(dur * SR); t = np.arange(n) / SR; ph = TAU * f * t
    lim = min(1.0, 1500.0 / f); lim2 = min(1.0, 700.0 / f)
    i1 = 2.3 * bright * lim * np.exp(-t / 0.09); i2 = 1.1 * lim * np.exp(-t / 0.6)
    y = np.sin(ph + i1 * np.sin(3.5 * ph) + i2 * np.sin(ph)) * np.exp(-t / (0.85 * decay))
    y += 0.3 * np.sin(2.0012 * ph + 0.8 * lim2 * np.exp(-t / 0.1) * np.sin(7.0 * ph)) * np.exp(-t / (0.32 * decay))
    return y * np.clip(t / 0.0012, 0, 1) * np.clip((dur - t) / 0.08, 0, 1) * 0.42   # (ends without a tick)

def fm_ep(f, dur, vel=0.8, r=0.6):
    """a Rhodes-like electric piano (FM): the tine's body (a 1:1 modulator, brighter when struck harder), its metallic ping, a
    soft second harmonic"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; ph = TAU * f * t
    idx = (0.5 + 1.3 * vel) * np.exp(-t / 0.45) * min(1.0, 800.0 / f) + 0.15
    y = np.sin(ph + idx * np.sin(ph)) + 0.18 * np.sin(2 * ph) * np.exp(-t / 0.3)
    if f * 15 < 19000: y += 0.12 * vel * np.sin(15 * ph) * np.exp(-t / 0.012)
    return y * adsr(n, 0.002, 1.6, 0.35, r, gate=dur) * 0.33

def string_ens(f, dur, a=0.12, r=0.45, bright=4200, vib=0.0045, seed=0, voices=5):
    """a disco string section: several saws a hair apart, each with its own vibrato, bowed brightness (a resonance near 2.7 kHz)"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed); x = np.zeros(n)
    for k in range(voices):
        v = 1 + vib * np.sin(TAU * (4.9 + 0.33 * k) * t + rr.uniform(0, 6)) * np.clip((t - 0.08) / 0.3, 0, 1)
        x += saw(f * (1 + (k - (voices - 1) / 2) * 0.003) * v, n, rr.random())
    x = lp(x, bright, 0.08) + bp(x, 2700, 0.35) * 0.22
    return hp1(x, 180) * adsr(n, a, 0.25, 0.88, r, gate=dur) * (0.55 / voices)

def harp(f, ring=2.0, seed=0):
    """a concert harp string: a plucked gut string (Karplus-Strong), round and warm, the soundboard's body"""
    x = pluck(f, ring, 0.9978, 0.42, seed, 0.3)
    return lp1(hp1(x + bp(x, 900, 0.3) * 0.3, 120), 5200) * 0.6

def guitar(ms, dur, vel=1.0, muted=False, up=False, seed=0):
    """a funky rhythm guitar (a single coil's bite): three strings strummed a few ms apart and choked short; muted = a scratch"""
    order = ms[::-1] if up else ms; n = int((dur + 0.05) * SR); out = np.zeros(n)
    for j, m in enumerate(order):
        o = int(j * 0.005 * SR); x = pluck(mtof(m), (n - o) / SR, 0.975 if muted else 0.991, 0.38 if muted else 0.62, seed + j, 0.17)
        out[o:o + len(x)] += x[:n - o]
    t = np.arange(n) / SR; env = np.exp(-t / (0.018 if muted else 0.09)) * np.clip((dur + 0.05 - t) / 0.03, 0, 1)
    return (bp(out, 1600, 0.3) * 0.8 + hp1(out, 500) * 0.35) * env * vel * 0.8

def sea(dur, seed=0):
    """the sea below at dusk: slow swells of surf (each wave brighter as it breaks) and the hiss of the wash"""
    n = int(dur * SR); t = np.arange(n) / SR
    sw = (0.5 - 0.5 * np.cos(TAU * t / 6.3 + seed)) ** 2 * (0.7 + 0.3 * np.sin(TAU * t / 15.0 + seed))
    x = lp(noise(n, seed), 350 + 2400 * sw, 0.1) * (0.25 + 0.75 * sw) + hp(noise(n, seed + 1), 3500, 0.1) * 0.25 * sw
    return hp1(x, 120)

def soft_clip(x, knee=0.5, ceil=0.78):   # untouched below the knee, rounded smoothly up to the ceiling above it (a stacked saw
    a = np.abs(x)                       # chord's attacks spike far above its body: this keeps them off the master limiter)
    return np.where(a <= knee, x, np.sign(x) * (knee + (ceil - knee) * np.tanh((a - knee) / (ceil - knee))))

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards (swells into the next hit)
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def whoosh(dur, f0=250, f1=3200, seed=0):   # air rushing past (into the tunnel): a band of noise up and back down
    n = int(dur * SR); x = np.linspace(0, 1, n); s = np.sin(np.pi * x)
    return bp(noise(n, seed), f0 * (f1 / f0) ** s, 0.55) * s ** 2

@nb.njit(cache=True, fastmath=True)
def _phaser(x, fc, stages, fb, mix):   # first-order allpass stages swept by fc (per sample), with feedback
    n = x.shape[0]; y = np.empty(n); z = np.zeros(16); last = 0.0
    for i in range(n):
        g = math.tan(math.pi * fc[i] / 44100.0); a = (g - 1.0) / (g + 1.0); v = x[i] + fb * last
        for s in range(stages):
            o = a * v + z[s]; z[s] = v - a * o; v = o
        last = v; y[i] = x[i] * (1.0 - mix) + v * mix
    return y
def phaser(x, rate=0.11, lo=300, hi=3200, stages=6, fb=0.4, mix=0.45, ph=0.0):   # the French-house swirl
    t = np.arange(len(x)) / SR; return _phaser(x, lo * (hi / lo) ** (0.5 + 0.5 * np.sin(TAU * rate * t + ph)), stages, fb, mix)

# ================================================================ harmony ========================================================
#          bass root   voicing (rootless, around middle C: the stabs, the strings' chords); each moves to the next by steps
V = {'Fmaj9':     ('F2',  [60, 64, 67, 69]),    # C E G A
     'Am9':       ('A2',  [60, 64, 67, 71]),    # C E G B
     'D9':        ('D2',  [60, 64, 66, 69]),    # C E F# A
     'Gm9':       ('G2',  [58, 62, 65, 69]),    # Bb D F A
     'C13sus':    ('C2',  [62, 65, 69, 70]),    # D F A Bb
     'C7b9':      ('C2',  [61, 64, 67, 70]),    # Db E G Bb
     'Bbmaj9':    ('Bb2', [62, 65, 69, 72]),    # D F A C
     'Bbm6':      ('Bb2', [61, 65, 67, 70]),    # Db F G Bb  (the borrowed iv minor: the evening's sigh)
     'Am7':       ('A2',  [60, 64, 67, 69]),    # C E G A
     'Abdim7':    ('Ab2', [59, 62, 65, 68]),    # B D F Ab   (passing, chromatic)
     'A7b9':      ('A2',  [58, 61, 64, 67]),    # Bb C# E G
     'Dm9':       ('D2',  [57, 60, 64, 65]),    # A C E F
     'C11':       ('C2',  [58, 62, 65, 67]),    # Bb D F G   (Bb over C)
     'Bbmaj9#11': ('Bb1', [60, 62, 65, 69]),    # C D F A (+ E above: the lydian sparkle)
     'F69':       ('F2',  [57, 62, 67, 72])}    # A D G C    (the landing)
A_LOOP = [[(0, 'Fmaj9')], [(0, 'Am9'), (2, 'D9')], [(0, 'Gm9')], [(0, 'C13sus'), (2, 'C7b9')]]
B_LOOP = [[(0, 'Bbmaj9')], [(0, 'Bbm6')], [(0, 'Am7'), (2, 'Abdim7')], [(0, 'Gm9'), (2, 'A7b9')]]
HARM = {-10: [(0, 'Fmaj9')], -9: [(0, 'Dm9')], -8: [(0, 'Bbmaj9#11')], -7: [(0, 'C13sus')],
        -2: [(0, 'Bbmaj9')], -1: [(0, 'C13sus'), (2, 'C7b9')], 8: [(0, 'Dm9')], 9: [(0, 'C11'), (2, 'C7b9')], 14: [(0, 'F69')]}
for k in range(4): HARM[-6 + k] = HARM[k] = HARM[10 + k] = A_LOOP[k]; HARM[4 + k] = B_LOOP[k]
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]; return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]
def chord_at(bar, beat): return next(c for b0, b1, c in chords_in(bar) if b0 <= beat < b1)
# the band (stabs, guitar, strings' chords, bell arps) anticipates changes by an eighth, as a disco band does: a change on beat 3
# arrives on the 'and' of 2; in these bars the next bar's chord also arrives on the 'and' of 4 (not where a held tune note would
# rub against it)
PUSH = {bar: bar in (-6, -5, -3, -2, 0, 1, 3, 5, 6, 10, 11) for bar in HARM}
WAIT = {3, 13}       # (here the tune holds the 13th into beat 3: the band waits for the beat to change to C7b9)
def heard(bar, p):   # the chord the band plays at sixteenth p of a bar
    if p >= 14 and PUSH[bar] and bar + 1 in HARM: return chord_at(bar + 1, 0)
    return chord_at(bar, (p + 2 if 6 <= p < 8 and bar not in WAIT else p) / 4)
CHANGES = []   # [(time, chord)]: every change of the band's chord, anticipations included
for bar in sorted(HARM):
    for b0, b1, c in chords_in(bar):
        if b0 == 0 and PUSH.get(bar - 1, False): continue
        t = S.t(bar, b0 - (0 if bar in WAIT else 0.5) if b0 > 0 else 0)
        if not CHANGES or CHANGES[-1][1] != c: CHANGES.append((t, c))
    if PUSH[bar] and bar + 1 in HARM and chord_at(bar + 1, 0) != CHANGES[-1][1]: CHANGES.append((S.t(bar, 3.5), chord_at(bar + 1, 0)))
def band_segments(bar):   # [(start, end, chord)] of the band's chords that start in this bar
    out = []
    for i, (t0, c) in enumerate(CHANGES):
        if S.t(bar) - 1e-6 <= t0 < S.t(bar + 1) - 1e-6: out.append((t0, CHANGES[i + 1][0] if i + 1 < len(CHANGES) else t0 + B, c))
    return out

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
HOOK = [[(2, 1, 'A5'), (3, 1, 'C6'), (4, 4, 'E6'), (8, 1, 'D6'), (9, 1, 'C6'), (10, 6, 'D6')],              # Fmaj9: up to the 7th
        [(0, 2, 'C6'), (2, 2, 'B5'), (4, 4, 'A5'), (8, 2, 'F#5'), (10, 2, 'A5'), (12, 4, 'C6')],            # Am9 D9: down, back up
        [(2, 1, 'Bb5'), (3, 1, 'D6'), (4, 4, 'F6'), (8, 1, 'E6'), (9, 1, 'D6'), (10, 6, 'E6')],             # Gm9: a step higher
        [(0, 2, 'D6'), (2, 2, 'C6'), (4, 4, 'A5'), (8, 2, 'Bb5'), (10, 2, 'Db6'), (12, 2, 'C6'), (14, 2, 'Bb5')]]   # the b9 turn
HOOK_END = [(0, 2, 'D6'), (2, 2, 'C6'), (4, 4, 'A5'), (8, 2, 'G5'), (10, 2, 'Bb5'), (12, 2, 'Db6'), (14, 2, 'E6')]   # up to F
PICKUP = [(12, 1, 'E5'), (13, 1, 'G5'), (14, 2, 'Bb5')]                                                       # (Bb falls to A)
BMEL = [[(0, 6, 'D6'), (6, 2, 'C6'), (8, 2, 'D6'), (10, 6, 'A5')],      # the strings' tune: long, a turn, a fall of a fourth;
        [(0, 6, 'Db6'), (6, 2, 'C6'), (8, 2, 'Db6'), (10, 6, 'G5')],    # its top falling chromatically D Db C Bb with the chords,
        [(0, 6, 'C6'), (6, 2, 'B5'), (8, 2, 'D6'), (10, 6, 'F5')],      # the falls a third lower each time,
        [(0, 6, 'Bb5'), (6, 2, 'A5'), (8, 2, 'C#6'), (10, 6, 'E6')]]    # then rising into the tunnel
COUNTER = [[(0, 16, 'E5')], [(0, 6, 'E5'), (6, 8, 'F#5'), (14, 2, 'F5')], [(0, 16, 'F5')], [(0, 8, 'F5'), (8, 8, 'E5')]]   # final A: guide tones
SLOW = [[(2, 2, 'A5'), (4, 4, 'C6'), (8, 8, 'E6')],                  # the hook's outline in slow motion (the globe: the electric
        [(0, 8, 'C6'), (8, 4, 'A5'), (12, 4, 'Bb5')]]                   # piano): A C E over Bbmaj9#11 (its 7th, 9th and #11), then
                                                                        # C A Bb over C13sus, the Bb falling to the bells' A
TUNNEL_BELLS = [[(2, 1, 'A5'), (3, 1, 'C6'), (4, 4, 'E6'), (8, 1, 'D6'), (9, 1, 'C6'), (10, 6, 'D6')],     # the hook's call over Dm9,
                [(0, 2, 'C6'), (2, 2, 'Bb5'), (4, 4, 'G5'), (8, 2, 'Bb5'), (10, 2, 'Db6')]]                # echoing in the tunnel

# (sixteenth, note, length in sixteenths, velocity): octaves on the eighths, ghost notes (quiet, short), a chromatic walk into
# each chord
BASS_A = [[(0, 'F2', 1.7, 1.0), (2, 'F3', .9, .85), (3, 'F3', .45, .35), (4, 'F2', 1.5, .9), (6, 'F3', .9, .8), (8, 'F2', 1.7, .95),
           (10, 'F3', .9, .85), (11, 'C3', .6, .42), (12, 'F2', 1.2, .85), (14, 'G2', .9, .75), (15, 'G#2', .9, .7)],
          [(0, 'A2', 1.7, 1.0), (2, 'A3', .9, .85), (3, 'A3', .45, .35), (4, 'A2', 1.5, .9), (6, 'A3', .9, .8), (7, 'E3', .6, .42),
           (8, 'D2', 1.7, 1.0), (10, 'D3', .9, .85), (11, 'D3', .45, .35), (12, 'D2', 1.2, .9), (14, 'D3', .9, .8), (15, 'F#2', .9, .72)],
          [(0, 'G2', 1.7, 1.0), (2, 'G3', .9, .85), (3, 'G3', .45, .35), (4, 'G2', 1.5, .9), (6, 'G3', .9, .8), (8, 'G2', 1.7, .95),
           (10, 'G3', .9, .85), (11, 'F3', .6, .42), (12, 'G2', 1.2, .85), (14, 'D2', .9, .75), (15, 'C#2', .9, .72)],
          [(0, 'C2', 1.7, 1.0), (2, 'C3', .9, .85), (3, 'C3', .45, .35), (4, 'C2', 1.5, .9), (6, 'C3', .9, .8), (7, 'G2', .6, .42),
           (8, 'C2', 1.7, 1.0), (10, 'C3', .9, .85), (11, 'Bb2', .6, .5), (12, 'C3', .9, .8), (13, 'Bb2', .9, .62), (14, 'G2', .9, .72),
           (15, 'E2', .9, .72)]]                                                  # (down the C7 chord to F)
BASS_A3B = BASS_A[3][:-3] + [(13, 'Bb2', .9, .62), (14, 'C3', .9, .72), (15, 'B2', .9, .72)]   # (into Bb, when the B part follows)
BASS_B = [[(0, 'Bb2', 2.5, 1.0), (3, 'Bb3', .9, .8), (6, 'F3', 1.5, .85), (8, 'Bb2', 1.7, .95), (10, 'Bb3', .9, .82), (11, 'Bb3', .45, .35),
           (12, 'F3', 1.2, .8), (14, 'D3', .9, .75), (15, 'B2', .9, .68)],
          [(0, 'Bb2', 2.5, 1.0), (3, 'Bb3', .9, .8), (6, 'F3', 1.5, .85), (8, 'Bb2', 1.7, .95), (10, 'Db3', .9, .82), (11, 'Db3', .45, .35),
           (12, 'F3', 1.2, .8), (14, 'G2', .9, .75), (15, 'Bb2', .9, .68)],
          [(0, 'A2', 2.5, 1.0), (3, 'A3', .9, .8), (6, 'D3', 1.5, .85), (8, 'Ab2', 1.7, .95), (10, 'Ab3', .9, .82), (11, 'Ab3', .45, .35),
           (12, 'B2', 1.2, .8), (14, 'D3', .9, .75), (15, 'Ab2', .9, .68)],
          [(0, 'G2', 2.5, 1.0), (3, 'G3', .9, .8), (6, 'E3', 1.5, .85), (8, 'A2', 1.7, .95), (10, 'A3', .9, .82), (11, 'A3', .45, .35),
           (12, 'E3', 1.2, .8), (13, 'G3', .9, .65), (14, 'A3', .9, .72), (15, 'C#3', .9, .72)]]

drums, hats, perc, bass, stabs, pad, strs, lead, bells, echo, ep, gtr, harpb, fx, atmos = (S.bus(x) for x in
    'drums hats perc bass stabs pad strings lead bells echo ep guitar harp fx atmos'.split())
kicks = []

def bass_line(bar, notes, gain=0.5, bright=1.0, upto=16):
    for p, name, ln, v in notes:
        if p < upto: bass.add(funk_bass(mtof(nm(name)), L16(ln), v, bright), T(bar, p), gain * v * hum(0.03))

STAB_A = [(0, 2.0, 1.0), (3, 1.5, 0.72), (6, 2.5, 0.9), (10, 2.5, 0.85), (14, 2.0, 0.8)]   # (sixteenth, length, velocity)
STAB_B = [(0, 3.0, 1.0), (6, 2.0, 0.85), (8, 1.5, 0.65), (11, 2.0, 0.8), (14, 2.0, 0.78)]
def stab_bar(bar, gain, rhy=STAB_A, end=True, upto=16, bright=1.0):
    """the disco chord on the sixteenths of the rhythm (the stabs on 6 and 14 carry the anticipated changes); end=False: no
    stab on 14 (a fill takes its place)"""
    for p, ln, v in rhy:
        if p >= upto or (p == 14 and not end): continue
        c = heard(bar, p)
        for j, m in enumerate(V[c][1]):
            stabs.add(stab_note(mtof(m), L16(ln), seed=(bar + 20) * 64 + p * 4 + j, bright=bright), T(bar, p), gain * v * hum(0.05),
                      pan=(-0.45, -0.15, 0.15, 0.45)[j])

def pad_bar(bar, gain, a=0.3, r=0.7, bright=3800, top=True, until=None):
    """the strings' sustained chords (the voicing, its top an octave up as well), spread across the stereo field; until: they let
    go there (a breath before what follows)"""
    for t0, t1, c in band_segments(bar):
        t1 = t1 if until is None else min(t1, until)
        if t1 <= t0: continue
        vs = list(V[c][1]) + ([V[c][1][-1] + 12] if top else [])
        for j, m in enumerate(vs):
            pad.add(string_ens(mtof(m), t1 - t0, a=a, r=r, bright=bright, seed=m * 3 + j, voices=4), t0, gain,
                    pan=float(np.linspace(-0.75, 0.75, len(vs))[j]))

def play(bar, phrase, gain=0.32, octave=0, bell=0.0, bell2=0.0, dst=None, pan=0.0, bright=1.0):
    """the lead (legato steps glide); bell: an FM bell in unison (the glitter on the hook); bell2: another an octave up;
    dst: another bus for all of it (the tunnel's echo)"""
    prev_end, prev_m = None, None
    for p, ln, name in phrase:
        m = nm(name) + 12 * octave; t0 = T(bar, p); t1 = T(bar, p + ln)
        legato = prev_end is not None and abs(prev_end - t0) < 0.03 and abs(m - prev_m) <= 4
        dur = (t1 - t0) * (0.96 if ln >= 2 else 0.8)
        if gain: (dst or lead).add(lead_voice(mtof(m), dur, glide_from=mtof(prev_m) if legato else None, bright=bright), t0,
                                   gain * hum(0.04) * (1.08 if p % 4 == 0 else 1.0), pan=pan)
        if bell: (dst or bells).add(fm_bell(mtof(m), 0.9 + 0.12 * ln, 1.0), t0, bell * hum(0.06), pan=0.18)
        if bell2: (dst or bells).add(fm_bell(mtof(m + 12), 0.8, 0.9), t0, bell2 * hum(0.06), pan=-0.32)
        prev_end, prev_m = t1, m

def strings_tune(bar, phrase, gain, octaves=(0, -12), a=0.05, bright=5200):   # a tune on the strings, in octaves
    for p, ln, name in phrase:
        m = nm(name); t0 = T(bar, p); dur = (T(bar, p + ln) - t0) * 0.95
        for o in octaves:
            strs.add(string_ens(mtof(m + o), dur, a=a, r=0.35, bright=bright, seed=m + o + bar, voices=5), t0,
                     gain * (1.0 if o == 0 else 0.7) * hum(0.04), pan=0.15 if o == 0 else -0.15)

def string_run(t0, t1, notes, gain, pan=0.0):   # the disco strings' sweep up (articulated, faster than it can be counted)
    k = len(notes); dt = (t1 - t0) / k
    for i, m in enumerate(notes):
        strs.add(string_ens(mtof(m), dt * 1.5, a=0.01, r=0.12, bright=6500, vib=0.002, seed=500 + m, voices=4), t0 + i * dt,
                 gain * (0.55 + 0.6 * i / k), pan=pan)

def harp_gliss(t0, notes, span, gain, ring=2.2):   # a harp glissando, spread left to right as it climbs
    for i, m in enumerate(notes):
        x = i / max(1, len(notes) - 1)
        harpb.add(harp(mtof(m), ring, seed=700 + m), t0 + span * x, gain * (0.7 + 0.5 * x) * hum(0.05), pan=-0.6 + 1.2 * x)

def chord_tones(c, lo, hi, extra=()):   # every tone of chord c (with its root, and any extra notes) between two midi notes, rising
    pcs = {nm(V[c][0]) % 12} | {m % 12 for m in list(V[c][1]) + list(extra)}; return [m for m in range(lo, hi + 1) if m % 12 in pcs]

ARP = (0, 2, 1, 3, 2, 4, 3, 1, 0, 3, 2, 4, 1, 3, 4, 2)
def bell_arp(bar, gain, positions, oct_=24, dst=None, decay=0.9, width=0.55):
    """the bells glittering over the chord (two octaves up), one tone per position, alternating left and right"""
    for i, p in enumerate(positions):
        c = heard(bar, p); tones = sorted(V[c][1]); tones = [m + oct_ for m in tones] + [tones[0] + oct_ + 12]
        m = tones[ARP[(p + bar) % len(ARP)] % len(tones)]
        (dst or bells).add(fm_bell(mtof(m), 1.0, 0.85, decay), T(bar, p), gain * (1.0 if p % 4 == 0 else 0.72) * hum(0.1),
                           pan=width if i % 2 else -width)

GTR = [(1, 'm', .3), (2, 'x', .75), (3, 'm', .3), (5, 'm', .28), (6, 'x', .6), (7, 'm', .32), (9, 'm', .3), (10, 'x', .75),
       (11, 'm', .3), (13, 'm', .28), (14, 'x', .6), (15, 'm', .32)]   # chords on the eighths' offbeats, scratches between
def gtr_bar(bar, gain):
    for p, kind, v in GTR:
        c = heard(bar, p); ms = [m + 12 for m in V[c][1][1:]]
        gtr.add(guitar(ms, L16(0.8 if kind == 'x' else 0.35), v, muted=kind == 'm', up=p % 2 == 1, seed=(bar + 20) * 16 + p), T(bar, p),
                gain * hum(0.08), pan=-0.55)

# drum sounds, made once
KICK = disco_kick(); CLAP = clap(0.3, seed=5); SNR = snare(0.22, tone=210, snappy=0.75, seed=6)
HC = [hat(0.045, seed=s, tone=7000) for s in range(4)]   # (tuned low enough that a phone speaker still hears their swing)
def _trim(x, d): x = x[:int(d * SR)].copy(); x *= np.clip((d - np.arange(len(x)) / SR) / 0.08, 0, 1); return x
HO = [_trim(hat(open_=True, seed=10 + s, tone=7600), 0.28) for s in range(3)]
TMB = [tambourine(0.16, seed=20 + s) for s in range(4)]; SHK = [shaker(0.08, seed=30 + s) for s in range(4)]
TOMS = {x: tom(mtof(nm(x)), 0.6) for x in 'A3 G3 E3 C#3 C3 Bb2 A2 G2 E2'.split()}   # (pitched: each fill is tuned to its chord)
RIDE = [ride(0.7, seed=s) for s in range(2)]
CONGA = [(3, 250, 0.5, 0.0), (6, 330, 0.65, 0.8), (7, 330, 0.45, 0.0), (11, 190, 0.6, 0.0), (14, 330, 0.6, 0.5), (15, 250, 0.45, 0.0)]
def K(t, g=0.55, fc=None, hpf=None):   # a kick the others duck to (fc: low-passed, heard from afar; hpf: thinned, its boom gone)
    x = KICK if fc is None else lp(KICK, fc, 0.1); drums.add(x if hpf is None else hp(x, hpf, 0.1), t, g); kicks.append(t)

HAT_V = (0.62, 0.34, 0.0, 0.46)   # closed hats on the sixteenths of each beat (the third is the open hat's place)
def groove(bar, kick_=True, clap_=1.0, hat_=1.0, ohat=1.0, tamb=0.0, conga_=0.0, shake=0.0, ghosts=True, kfc=None, khp=None, kg=0.55, upto=16):
    for k in range(4):
        if 4 * k >= upto: break
        if kick_: K(S.t(bar, k), kg, kfc, khp)
        if clap_ and k in (1, 3): drums.add(CLAP, S.t(bar, k), 0.3 * clap_ * hum(), pan=0.03); drums.add(SNR, S.t(bar, k), 0.12 * clap_ * hum())
        for s in range(4):
            p = 4 * k + s
            if p >= upto: break
            if s == 2 and ohat: hats.add(HO[k % 3], T(bar, p), 0.36 * ohat * hum(), pan=0.22)
            elif hat_ and HAT_V[s]: hats.add(HC[(k + s) % 4], T(bar, p), HAT_V[s] * hat_ * hum(0.15), pan=-0.38)
            if tamb: perc.add(TMB[s], T(bar, p) + rng.uniform(-0.0025, 0.0025), tamb * (1.0 if s == 0 and k in (1, 3) else 0.55 if s == 2 else 0.3) * hum(0.15), pan=0.55)
            if shake: perc.add(SHK[s], T(bar, p), shake * (0.6, 0.35, 0.9, 0.45)[s] * hum(0.15), pan=-0.6)
    if conga_:
        for p, f, v, sl in CONGA:
            if p < upto: perc.add(conga(f, 0.5, sl, seed=(bar + 20) * 16 + p), T(bar, p) + rng.uniform(-0.003, 0.003), conga_ * v * hum(0.1), pan=0.42 if f > 260 else 0.2)
    if ghosts:   # quiet snare ghost notes between the beats (the drummer's left hand)
        for p, g in (((7, 0.07), (13, 0.05)) if bar % 2 else ((10, 0.05), (15, 0.07))):
            if p < upto: drums.add(SNR, T(bar, p), g * hum(0.2), pan=-0.1)

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=200, tone1=280):   # a roll speeding up and swelling into the next bar
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, seed=int(t * 100) % 97), t, g0 + (g1 - g0) * x ** 1.5, pan=0.06)
        t += b / (rate0 + (rate1 - rate0) * x)

def tom_fill(bar, p0, notes, g=0.3):   # toms tumbling down the chord, one per sixteenth
    for i, x in enumerate(notes): drums.add(TOMS[x], T(bar, p0 + i), g * (0.85 + 0.15 * i / len(notes)), pan=0.45 - 0.9 * i / max(1, len(notes) - 1))

# ================================================================ INTRO: the globe (bars -10..-1) ================================
I0 = 0.25
# the air of the flight: a soft rush, brightening and swelling as the globe turns, gone under the build
n_ = int((S.t(-1) + 1.0 - I0) * SR); x_ = np.linspace(0, 1, n_); dur_ = n_ / SR
ag = np.clip(x_ * dur_ / 3.0, 0, 1) * (0.5 + 0.5 * x_) * np.clip((1 - x_) * dur_ / 3.0, 0, 1)
atmos.add((bp(noise(n_, 41), 420 * 2 ** (2.4 * x_), 0.45) * ag, bp(noise(n_, 42), 480 * 2 ** (2.4 * x_), 0.45) * ag), I0, 0.15)
# the dusk pad: four slow chords under a held E, a little brighter each time
PADV = {'Fmaj9': [60, 64, 67, 69, 76], 'Dm9': [60, 64, 65, 69, 76], 'Bbmaj9#11': [60, 62, 65, 69, 76], 'C13sus': [58, 62, 65, 69, 74]}
for i, bar in enumerate(range(-10, -6)):
    c = chord_at(bar, 0)
    for j, m in enumerate(PADV[c]):
        pad.add(voice_pad(mtof(m), B * 1.02, cutoff=1000 + 320 * i, a=1.8 if i == 0 else 0.5, r=1.3, voices=5, seed=40 + 7 * i + j),
                S.t(bar), 0.2 if i else 0.17, pan=(-0.7, -0.35, 0.0, 0.35, 0.7)[j])
    if i: bass.add(voice_bass(mtof(nm(V[c][0])), B * 0.98, cutoff=200, env_amt=0.3, a=1.5 if i == 1 else 0.4, r=0.6, sub=0.8), S.t(bar), 0.035)
# bells: the lights of the coast at night, a few, then more (bars -10, -9 are only the dusk: most starts of the full intro come later)
bell_arp(-9, 0.08, (4, 6, 10, 14)); bell_arp(-8, 0.12, (0, 2, 6, 8, 10, 14)); bell_arp(-7, 0.14, (0, 2, 4, 6, 8, 10, 12, 14))
# the curtain opens at bar -8 (3.9 s): a harp glissando up over Bbmaj9#11 (the lydian E with it), the electric piano rolls the
# chords softly (its tremolo is on the bus) and plays the hook's outline in slow motion
harp_gliss(S.t(-8), chord_tones('Bbmaj9#11', 62, 89, extra=[64]), 1.1, 0.24)
for bar in (-8, -7):
    c = chord_at(bar, 0)
    for j, m in enumerate(PADV[c][:4]): ep.add(fm_ep(mtof(m), B * 0.9, vel=0.5), S.t(bar) + 0.022 * j, 0.24, pan=-0.3 + 0.2 * j)
for bar, ph in zip((-8, -7), SLOW):
    for p, ln, name in ph: ep.add(fm_ep(mtof(nm(name)), L16(ln) * 0.95, vel=0.75, r=0.8), T(bar, p), 0.3, pan=0.1)
# a cymbal played backwards into the loop from afar, landing on a soft, distant crash
fx.add(rev_crash(1.6, seed=3), S.t(-6) - 1.6, 0.08); fx.add(lp(crash(2.4, seed=11), 6000), S.t(-6), 0.07, pan=-0.15)
# the loop from far away (bars -6..-3): the kick through a wall, the bass and chords through a closed filter (on the buses)
for bar in range(-6, -2):
    x = bar + 6
    for k in range(4): K(S.t(bar, k), 0.14 + 0.045 * x, fc=170 + 60 * x)
    if bar >= -4:
        for k in (1, 3): drums.add(lp(CLAP, 700 + 300 * x), S.t(bar, k), 0.12 + 0.04 * x)
    for k in range(4):
        for s in (0, 1, 3): hats.add(HC[(k + s) % 4], T(bar, 4 * k + s), HAT_V[s] * (0.12 + 0.05 * x), pan=-0.38)
    bass_line(bar, BASS_A3B if x == 3 else BASS_A[x], gain=0.13 + 0.03 * x, bright=0.6)
    stab_bar(bar, 0.26 + 0.04 * x)
    for t0, t1, c in band_segments(bar):   # the dusk pad goes on under it (the A loop's chords), softer
        for j, m in enumerate(V[c][1] + [V[c][1][-1] + 12]):
            pad.add(voice_pad(mtof(m), t1 - t0, cutoff=1900, a=0.35, r=0.9, voices=5, seed=90 + j), t0, 0.1,
                    pan=float(np.linspace(-0.7, 0.7, 5)[j]))
play(-6, HOOK[0], gain=0.0, bell=0.3); play(-5, HOOK[1], gain=0.0, bell=0.3)    # the bells tease the hook
bell_arp(-4, 0.13, range(0, 16, 2)); bell_arp(-3, 0.14, range(0, 16, 2))
atmos.add(sea(S.t(-1) - S.t(-5), seed=5) * np.clip(np.linspace(0, 1, int((S.t(-1) - S.t(-5)) * SR)) * 3, 0, 1) ** 2
          * np.clip(np.linspace(1, 0, int((S.t(-1) - S.t(-5)) * SR)) * 2.5, 0, 1), S.t(-5), 0.2, pan=-0.2)   # the sea below
# --- the build (bars -2, -1; it also works as the start of the short intro at 15.5 s): the filter opens, the roll, the toms
# (the floor lifts away: the kick thinner beat by beat, a rising low-cut on the bass (in the mix); the full kick returns at the drop)
groove(-2, clap_=0.75, hat_=0.7, ohat=0.6, tamb=0.12, kfc=900, khp=45, kg=0.48, ghosts=False)
bass_line(-2, BASS_B[0], gain=0.3, bright=0.8)
stab_bar(-2, 0.45); pad_bar(-2, 0.13, a=0.5)
bell_arp(-2, 0.12, range(16))
for k in range(3): K(S.t(-1, k), 0.5, fc=900 + 500 * k, hpf=70 + 25 * k)
drums.add(CLAP, S.t(-1, 1), 0.3)
for k in range(8): hats.add(HC[k % 4], T(-1, k), 0.2 + 0.02 * k, pan=-0.38)
bass_line(-1, [(0, 'C2', 1.7, 1.0), (2, 'C3', .9, .85), (4, 'C2', 1.5, .9), (6, 'C3', .9, .85), (8, 'C2', .9, .9), (9, 'C3', .9, .8),
               (10, 'C2', .9, .9), (11, 'C3', .9, .85), (12, 'C2', .9, .9), (13, 'C3', .9, .9)], gain=0.33)
stab_bar(-1, 0.5, rhy=[(0, 2.0, 1.0), (3, 1.5, 0.72), (6, 2.5, 0.9), (10, 2.5, 0.95)])
pad_bar(-1, 0.14, a=0.3, until=S.t(-1, 3))   # (the last beat is a breath: the pickup, the run, the riser)
snare_roll(S.t(-2), S.t(-1), 2, 4, 0.05, 0.13)
snare_roll(S.t(-1), T(-1, 8), 4, 8, 0.13, 0.24)
tom_fill(-1, 8, ('G3', 'E3', 'C3', 'Bb2', 'G2', 'E2'), g=0.32)   # (down the C7 chord)
string_run(T(-1, 6), T(-1, 13.5), [nm(x) for x in 'C5 D5 E5 F5 G5 A5 Bb5 C6 Db6 E6 F6 G6'.split()], 0.32)
play(-1, PICKUP, gain=0.34, bell=0.14)
fx.add(riser(2 * B, f0=300, f1=9000, seed=3), S.t(-2), 0.36)
fx.add(rev_crash(1.4, seed=5), S.t(0) - 1.4, 0.24)

# ================================================================ MAIN: La Condamine (bars 0..13) ================================
fx.add(impact_f(2.5), S.t(0), 0.22); fx.add(crash(2.6, seed=1), S.t(0), 0.32, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.08)
def string_hit(t, c, gain):   # the disco orchestra's hit on a downbeat: the chord short and bright, with its top an octave up
    for j, m in enumerate(V[c][1] + [V[c][1][-1] + 12, V[c][1][1] + 12]):
        strs.add(string_ens(mtof(m), 0.3, a=0.006, r=0.45, bright=7000, vib=0.0, seed=1200 + m, voices=4), t, gain, pan=-0.6 + 0.2 * j)
string_hit(S.t(0), 'Fmaj9', 0.38)
for bar in range(N):
    sec = 'A' if bar < 4 else 'B' if bar < 8 else 'tunnel' if bar < 10 else 'final'
    if sec == 'A':
        groove(bar, tamb=0.24)
        bass_line(bar, BASS_A3B if bar == 3 else BASS_A[bar], gain=0.36)
        stab_bar(bar, 0.75)
        pad_bar(bar, 0.14)
        play(bar, HOOK[bar], gain=0.42, bell=0.22)
    elif sec == 'B':
        groove(bar, tamb=0.16, conga_=0.5, upto=8 if bar == 7 else 16)
        bass_line(bar, BASS_B[bar - 4], gain=0.36)
        stab_bar(bar, 0.55, STAB_B, end=bar != 7)
        pad_bar(bar, 0.15)
        strings_tune(bar, BMEL[bar - 4], 0.95)
        bell_arp(bar, 0.11, range(16))
        gtr_bar(bar, 0.8)
    elif sec == 'final':
        groove(bar, tamb=0.18, conga_=0.55, upto=14 if bar == 13 else 16)
        bass_line(bar, BASS_A[bar - 10], gain=0.36)
        stab_bar(bar, 0.82, upto=13 if bar == 13 else 16)
        pad_bar(bar, 0.16)
        for k in range(4):   # the ride on the offbeats: the last time round shines
            if bar < 13 or k < 3: perc.add(RIDE[k % 2], T(bar, 4 * k + 2), 0.2 * hum(0.1), pan=0.35)
        play(bar, HOOK_END if bar == 13 else HOOK[bar - 10], gain=0.38, bell=0.22, bell2=0.07)
        strings_tune(bar, COUNTER[bar - 10], 0.55)   # the strings' counter-line under it (guide tones)
        gtr_bar(bar, 0.75)
# the tunnel (bars 8-9): the filter closes (on the buses), no kick, the hook's call echoing off the walls; then out into the light
groove(8, kick_=False, clap_=0.0, hat_=0.3, ohat=0.0, shake=0.08, ghosts=False)
bass.add(funk_bass(mtof(nm('D2')), L16(13), 0.7, 0.6), S.t(8), 0.15)
bass_line(8, [(14, 'D2', .9, .6), (15, 'B1', .9, .65)], gain=0.22)   # (turning round C)
stab_bar(8, 0.4); pad_bar(8, 0.2, a=0.4)
for j, m in enumerate([53, 57, 60, 64, 69]): ep.add(fm_ep(mtof(m), B * 0.95, vel=0.55), S.t(8) + 0.02 * j, 0.22, pan=-0.3 + 0.15 * j)
for i, ph in enumerate(TUNNEL_BELLS): play(8 + i, ph, gain=0.0, bell=0.28, dst=echo)
fx.add(whoosh(2 * B, seed=8), S.t(8) - 0.4, 0.07); fx.add(crash(2.0, seed=2), S.t(8), 0.07, pan=-0.2)
for k in range(4): K(S.t(9, k), 0.38 + 0.05 * k, fc=300 * 4 ** k)
groove(9, kick_=False, clap_=0.5, hat_=0.7, ohat=0.5, tamb=0.1, ghosts=False, upto=14)
bass_line(9, [(0, 'C2', 5.5, .9), (6, 'C3', .9, .8), (8, 'C2', .9, .9), (10, 'C3', .9, .85), (11, 'C2', .9, .8), (12, 'C3', .9, .9),
              (13, 'C2', .9, .85)], gain=0.27)
stab_bar(9, 0.7, rhy=[(0, 2.0, 1.0), (3, 1.5, 0.72), (6, 2.5, 0.9), (10, 2.5, 0.95)])
pad_bar(9, 0.15, a=0.2)
for j, m in enumerate([55, 58, 62, 65, 70]): ep.add(fm_ep(mtof(m), B * 0.45, vel=0.55), S.t(9) + 0.02 * j, 0.18, pan=-0.3 + 0.15 * j)
snare_roll(S.t(9), T(9, 8), 4, 6, 0.07, 0.15); snare_roll(T(9, 8), T(9, 14), 8, 12, 0.15, 0.27)
fx.add(riser(B, f0=500, f1=10000, seed=7), S.t(9), 0.3); fx.add(rev_crash(1.0, seed=9), S.t(10) - 1.0, 0.2)
play(9, PICKUP, gain=0.4, bell=0.14)
# out of the tunnel, along the water: the crash, a harp glissando, the loop wide open
fx.add(crash(2.5, seed=4), S.t(10), 0.3, pan=-0.1); fx.add(impact_f(2.0, seed=2), S.t(10), 0.16)
harp_gliss(S.t(10), chord_tones('Fmaj9', 65, 93), 0.55, 0.11); string_hit(S.t(10), 'Fmaj9', 0.2)
# fills: every fourth bar
for p, g in ((12, 0.1), (13, 0.13), (14, 0.17), (15, 0.22)): drums.add(SNR, T(3, p), g, pan=0.08)
fx.add(rev_crash(1.0, seed=6), S.t(4) - 1.0, 0.14); fx.add(crash(2.0, seed=7), S.t(4), 0.2, pan=-0.2)
tom_fill(7, 8, ('A3', 'G3', 'E3', 'C#3', 'Bb2', 'A2', 'A2', 'A2'), g=0.3)   # (down the A7b9 chord)
string_run(T(7, 8), T(7, 15), [nm(x) for x in 'E5 F5 G5 A5 Bb5 C#6 D6 E6 F6 G6 A6'.split()], 0.3)
fx.add(rev_crash(1.2, seed=8), S.t(8) - 1.2, 0.16)
for p, g in ((12, 0.1), (14, 0.15), (15, 0.19)): drums.add(SNR, T(11, p), g, pan=0.08)
fx.add(crash(2.0, seed=12), S.t(12), 0.16, pan=0.25)
hats.add(HO[0], T(11, 14), 0.3, pan=0.22)
# the last bar leads into the landing: the hook climbs to the tonic, toms tumbling, a roll, the strings sweep up, the cymbal
snare_roll(S.t(13, 2), T(13, 12), 6, 10, 0.12, 0.22)
tom_fill(13, 12, ('G3', 'E3', 'C3', 'Bb2'), g=0.34)   # (down the C7 chord, with the bass)
string_run(T(13, 8), T(13, 15.5), [nm(x) for x in 'C5 Db5 E5 F5 G5 Bb5 C6 Db6 E6 F6 G6 Bb6'.split()], 0.32)
fx.add(riser(B, f0=600, f1=10000, seed=8), S.t(13), 0.26); fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.26)

# ================================================================ LANDING: bar 14 = 48.2 s, the race starts ======================
drums.add(KICK, LAND, 0.55)   # (not in `kicks`: the final chord is not ducked by its own kick)
fx.add(impact_f(2.5, seed=5), LAND, 0.22); fx.add(crash(3.0, seed=6), LAND, 0.36, pan=0.1)
lb = funk_bass(mtof(nm('F2')), 2.5, 1.0) * np.exp(-np.arange(int(2.535 * SR)) / SR / 0.8); bass.add(lb, LAND, 0.4)
bass.add(funk_bass(mtof(nm('F3')), 0.5, 0.9), LAND, 0.18)
for j, m in enumerate(V['F69'][1]):   # the disco chord, ringing out (a natural decay, not a cut)
    stabs.add(stab_note(mtof(m), 2.2, seed=990 + j, r=0.3) * np.exp(-np.arange(int(2.5 * SR)) / SR / 0.9), LAND, 1.0, pan=(-0.45, -0.15, 0.15, 0.45)[j])
for j, m in enumerate([53, 57, 62, 67, 72, 77]):
    pad.add(string_ens(mtof(m), 1.4, a=0.02, r=1.0, bright=5500, seed=800 + j, voices=4), LAND, 0.28, pan=-0.7 + 0.28 * j)
string_hit(LAND, 'F69', 0.4)
for j, m in enumerate([57, 62, 65, 67, 72]): ep.add(fm_ep(mtof(m), 1.6, vel=0.8, r=1.0), LAND + 0.018 * j, 0.22, pan=-0.3 + 0.15 * j)
harp_gliss(LAND, chord_tones('F69', 65, 96), 0.45, 0.14, ring=2.4)
for i, (m, pn) in enumerate(((nm('F6'), 0.3), (nm('A6'), -0.3), (nm('C7'), 0.45))): bells.add(fm_bell(mtof(m), 2.3, 1.0, 1.6), LAND + 0.06 * i, 0.16, pan=pn)
lv = lead_voice(mtof(nm('F6')), 2.2, glide_from=mtof(nm('E6')), vib=0.007); lead.add(lv * np.exp(-np.arange(len(lv)) / SR / 1.3), LAND, 0.44)
strs.add(string_ens(mtof(nm('F5')), 1.5, a=0.02, r=0.9, bright=5200, seed=31), LAND, 0.26)

# ================================================================ MIX =============================================================
t_ = lambda bar, beat=0: S.t(bar, beat)
# the chords' resonant filter: the loop heard from afar opens through the build, only halfway (it snaps open on the drop's
# downbeat); under the hook it breathes (open on the hook's call, closing on its answer, two bars round); in B it sweeps down and
# back; the tunnel closes it; at the landing it opens, then closes slowly as the last chord rings out
fst = curve([(0, 300), (t_(-6), 300), (t_(-3), 750), (t_(-2), 900), (t_(-1), 1400), (t_(0) - 0.03, 3000), (t_(0), 7000), (t_(1), 3400),
             (t_(4) - 0.1, 3600), (t_(4), 5500), (t_(6), 1300), (t_(7, 2), 4000), (t_(8) - 0.15, 5000), (t_(8) + 0.25, 480), (t_(9), 520),
             (t_(10) - 0.1, 8000), (t_(10), 7000), (t_(11), 3800), (LAND - 0.03, 4200), (LAND, 7500), (S.len, 2500)], log=True)
tt = np.arange(S.n) / SR
breath = np.cos(np.pi * (tt - t_(0)) / B)   # +1 on the downbeats of bars 0, 2, 10, 12 (the hook's call), -1 on 1, 3, 11, 13
depth = curve([(0, 0), (t_(0), 0), (t_(0, 2), 0.65), (t_(4) - 0.2, 0.65), (t_(4), 0), (t_(10), 0), (t_(10, 2), 0.65), (LAND - 0.2, 0.65), (LAND, 0), (S.len, 0)])
fst *= 2 ** (depth * breath)   # (in octaves: about 2.2 to 5.5 kHz under the hook)
stabs.L = lp(stabs.L, fst, 0.7); stabs.R = lp(stabs.R, fst, 0.7)
stabs.L = phaser(stabs.L, ph=0.0); stabs.R = phaser(stabs.R, ph=1.2)
fpad = curve([(0, 1500), (t_(-6), 2600), (t_(-2), 2600), (t_(0) - 0.1, 9000), (t_(8) - 0.1, 9000), (t_(8) + 0.3, 900), (t_(9), 1000),
              (t_(10) - 0.1, 11000), (S.len, 11000)], log=True)
pad.L = lp(pad.L, fpad); pad.R = lp(pad.R, fpad)
def far(bus, points, res=0.1, until=None):   # a low-pass on a bus (crossfading back to the dry signal after `until`)
    fc = curve(points, log=True); yL, yR = lp(bus.L, fc, res), lp(bus.R, fc, res)
    if until is not None:
        w = np.clip((np.arange(S.n) / SR - (until - 0.25)) / 0.25, 0, 1); yL = yL * (1 - w) + bus.L * w; yR = yR * (1 - w) + bus.R * w
    bus.L, bus.R = yL, yR
far(bass, [(0, 250), (t_(-6), 300), (t_(-3), 600), (t_(-2), 600), (t_(0) - 0.03, 1400), (t_(0), 9000), (S.len, 9000)], until=t_(0) + 0.25)
lc = curve([(0, 20), (t_(-2), 25), (t_(-1), 45), (t_(0) - 0.03, 120), (S.len, 120)], log=True)   # the build's rising low-cut
wl = curve([(0, 0), (t_(-2) - 0.05, 0), (t_(-2), 1), (t_(0) - 0.005, 1), (t_(0), 0), (S.len, 0)])   # (only there: dry from the drop)
bass.L = bass.L * (1 - wl) + hp(bass.L, lc, 0.1) * wl; bass.R = bass.R * (1 - wl) + hp(bass.R, lc, 0.1) * wl
bfc = curve([(0, 20000), (t_(8) - 0.05, 20000), (t_(8) + 0.1, 500), (t_(9), 600), (t_(10) - 0.1, 8000), (S.len, 20000)], log=True)   # the tunnel
tun = lp(bass.L, bfc), lp(bass.R, bfc); w = curve([(0, 0), (t_(8) - 0.2, 0), (t_(8), 1), (t_(10) - 0.15, 1), (t_(10), 0), (S.len, 0)])
bass.L = bass.L * (1 - w) + tun[0] * w; bass.R = bass.R * (1 - w) + tun[1] * w
# the electric piano's stereo tremolo
trem = 0.28 * np.sin(TAU * 4.6 * tt); ep.L *= 1 + trem; ep.R *= 1 - trem
def dip(x, f, amt=0.25, res=0.3): return x - amt * bp(x, f, res)   # a gentle, wide cut (about -1.7 dB at f with these values)
pad.filt(lambda s: hp1(s, 190)); stabs.filt(lambda s: hp1(s, 170)); bells.filt(lambda s: hp1(s, 500))
lead.filt(lambda s: dip(hp1(s, 300), 1100))   # (the hook's fundamentals sit at 0.9-1.4 kHz: a little less there, no honk on a phone)
echo.filt(lambda s: lp(hp1(s, 500), 5000, 0.1)); ep.filt(lambda s: hp1(s, 140)); gtr.filt(lambda s: hp1(s, 350)); strs.filt(lambda s: hp1(s, 200))
bass.filt(lambda s: hp1(s, 35)); perc.filt(lambda s: lp(hp1(s, 150), 13000, 0.1)); hats.filt(lambda s: lp(hp1(s, 2500), 13000, 0.1))
fx.filt(lambda s: lp(s, 13000, 0.1))   # (no fizz above 13 kHz: it is lost on phones and in the mp3)
hats.L = phaser(hats.L, rate=0.07, lo=2500, hi=11000, stages=4, fb=0.3, mix=0.3); hats.R = phaser(hats.R, rate=0.07, lo=2500, hi=11000, stages=4, fb=0.3, mix=0.3, ph=1.5)
pad.width(1.5); stabs.width(1.3); strs.width(1.2)
# ducking from the kick (the French-house pump); not on the drop's downbeat, where the chord hits in full
sc = [k for k in kicks if abs(k - S.t(0)) > 1e-6]
bass.curve(S.sidechain(sc, depth=0.55, release=0.12)); stabs.curve(S.sidechain(sc, depth=0.5, release=0.16))
pad.curve(S.sidechain(sc, depth=0.4, release=0.2)); strs.curve(S.sidechain(sc, depth=0.2, release=0.16))
gtr.curve(S.sidechain(sc, depth=0.25, release=0.1)); ep.curve(S.sidechain(sc, depth=0.2, release=0.15))
bass.curve(S.sidechain([S.t(0), LAND], depth=0.5, release=0.03))   # (only out of the kick's way, on the two big downbeats)
stabs.filt(soft_clip)   # (the disco loop, compressed: its attacks rounded, its body untouched)
# sends: a warm evening hall, a short room for the drums, a dotted-eighth echo on the hook and the bells, the tunnel's long echo
verb_in = S.bus()
for x, a in ((pad, 0.3), (strs, 0.32), (lead, 0.2), (bells, 0.32), (echo, 0.45), (ep, 0.35), (harpb, 0.45), (stabs, 0.1), (gtr, 0.1),
             (perc, 0.08), (fx, 0.2), (atmos, 0.3)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.25, decay=2.6, damp=0.3, predelay=0.025)
vsc = S.sidechain(sc, depth=0.25, release=0.2); vl, vr = vl * 1.8 * vsc, vr * 1.8 * vsc
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.45, decay=0.7, damp=0.4)
dl = lead.send_delay(b * 0.75, 0.16, fb=0.33, damp=0.45)
db = bells.send_delay(b * 0.75, 0.22, fb=0.4, damp=0.4)
de = echo.send_delay(b * 0.75, 0.5, fb=0.55, damp=0.3)
BUSES = [drums, hats, perc, bass, stabs, pad, strs, lead, bells, echo, ep, gtr, harpb, fx, atmos]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in each section and its width in the main, before the master)
    SECS = (('globe', 0, t_(-6)), ('far', t_(-6), t_(-2)), ('build', t_(-2), t_(0)), ('A', t_(0), t_(4)), ('B', t_(4), t_(8)), ('tunnel', t_(8), t_(10)), ('final', t_(10), t_(14)))
    print('rms dB    ' + ''.join(f'{n_:>8s}' for n_, _, _ in SECS) + '   side/mid (main)')
    for x in BUSES + [type('v', (), {'L': vl, 'R': vr, 'name': 'verb'})]:
        row = []
        for _, a, z in SECS:
            a, z = int(a * SR), int(z * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); row.append(20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9))
        a, z = int(DROP * SR), int(END * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); sd = 0.5 * (x.L[a:z] - x.R[a:z])
        print(f'{x.name:8s}  ' + ''.join(f'{v:8.1f}' for v in row) + f'   {20 * np.log10(np.sqrt(np.mean(sd ** 2)) / (np.sqrt(np.mean(m ** 2)) + 1e-9) + 1e-9):6.1f}')
res = S.master(BUSES + [(vl, vr), (room_l, room_r), dl, db, de], HERE + '/out/monaco', lufs=-12.0, ceiling=-1.1, highs_db=0.75, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
