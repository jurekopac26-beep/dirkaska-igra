"""Thailand (Bang Saen: a street circuit along the beach by the Gulf of Thailand; palms, flat, warm): tropical house.
A ranat ek (the Thai xylophone: hardwood bars over a boat-shaped resonator, two hard mallets an octave apart, its long notes played
as a rapid tremolo) plays the hook; a khim (the hammered dulcimer: courses of three metal strings struck with soft bamboo beaters,
so every note shimmers) rolls the chords; a khlui (the bamboo duct flute, breathy, its long notes turned with grace notes) sings over
the beach; the ching (a pair of small cup cymbals: the open 'ching' and the damped 'chap' keep the time) and a taphon-like hand drum
(a deep open stroke and a slap) sit in a soft tropical-house groove: a gentle four-on-the-floor kick, finger snaps, shakers, a round
bouncing bass, warm pads, the waves and the palms.
A major pentatonic (A B C# E F#) over F#m7 Dmaj9 A E, 110.64 bpm: 13 bars from the drop to the race's start.
The hook: quick turns (two sixteenths round a note, as in Thai melody) that open into a held note the ranat rolls, climbing to F#
over F#m7, to the high A over Dmaj9, then down home; the answer climbs an octave higher.
Original: the melodies, the chords' voicing, the rhythms and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -9..-1  the waves and the palms in a warm breeze; a pad; the khim's slow rolls; the khlui sings the
                                    hook at half speed; the ching starts to keep the time; the ranat previews the hook softly;
                                    the hand drum and a muffled pulse; the build (Bm9, Esus4 -> E): the khim's tremolo, the
                                    ranat's roll, a riser, an eighth of air, the ranat's pickup
    drop  (20.0 s)     bar 0        the ranat in octaves and the groove
    A 0-3 (F#m7 Dmaj9 A Esus4-E), A' 4-7 (Bm9 Dmaj9 F#m7 Esus4-E: the khim's rolls, the hand drum, a higher answer), the breath 8
    (Dmaj9#11: no kick, the waves, the khlui; then Esus4: the khim's tremolo and the roll into the final), final 9-12 (everything:
    the khlui doubles the hook), LANDING at bar 13 = 48.2 s: A (add 9): the ranat's octave A, the khim's roll, the ching, the
    crash; it rings out through the tail
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 13                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 110.64 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SW = 0.1                                      # the odd sixteenths a little late (a relaxed, warm shuffle)
def T(bar, p=0.0, swing=SW):                  # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (swing if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(67)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def ranat(f, dur=1.0, vel=1.0, seed=0, hard=1.0):
    """a ranat ek bar struck with a hard mallet: the wooden bar's partials (inharmonic, the upper ones dying fast), the boat-shaped
    resonator under it lengthening the fundamental, the mallet's knock"""
    n = int(dur * SR); t = np.arange(n) / SR; ph = np.random.default_rng(abs(int(seed)))
    x = 0.9 * sine(f, n, ph.random()) * (0.6 * np.exp(-t / 0.55) + 0.4 * np.exp(-t / 0.12))
    for ratio, amp, dec in ((3.93, 0.32 * hard, 0.05), (2.05, 0.12, 0.1), (6.9, 0.12 * hard, 0.02)):
        if f * ratio < 16000: x += amp * sine(f * ratio, n, ph.random()) * np.exp(-t / dec)
    x += bp(noise(n, abs(int(seed))), 1800 + 1500 * hard, 0.35) * np.exp(-t / 0.006) * 0.3 * hard
    return x * np.clip(t / 0.0006, 0, 1) * vel * 0.4

def khim(f, dur=1.8, vel=1.0, seed=0, t60=2.2):
    """a khim course: three metal strings tuned a hair apart (Karplus-Strong), struck with a soft beater (a short, round push, not
    a pluck: warm), the soundboard's ring"""
    seed = abs(int(seed)); out = 0
    for k, dt in enumerate((0.0, 0.0023, -0.0019)):
        out = out + pluck(f * (1 + dt), dur, 10 ** (-3 / (f * t60)), 0.42 + 0.15 * vel, seed + 31 * k, 0.5) * (1.0 if k == 0 else 0.7)
    out = hp1(out, 150) + bp(out, 2500, 0.4) * 0.3
    return out * 0.26 * vel

def khlui(notes, breath=0.35, vib=0.22, rel=0.3, seed=0):
    """the khlui played legato: notes [(start s, dur s, midi, level)]; a soft, hollow tone (a duct flute: few harmonics, much breath),
    the pitch gliding between notes, a slow, wide vibrato on long ones"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for s0, d, m, v in notes:
        i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 25.0) + p0
    p = p + vib * np.clip((age - 0.25) / (0.5 * ln + 0.05), 0, 1) * (ln > 0.4) * np.sin(TAU * 4.8 * t)
    fr = mtof(p); nz = noise(n, seed)
    tone = sine(fr, n) + 0.18 * sine(fr * 2, n, 0.2) + 0.1 * sine(fr * 3, n, 0.45)
    air = hp(bp(nz, fr, 0.93) * 1.2 + bp(nz, fr * 2, 0.9) * 0.3, 350) + hp(nz, 6000) * 0.03
    art = 0.55 + 0.45 * np.clip(age / 0.03, 0, 1)
    env = np.clip(t / 0.05, 0, 1) * lp1(lv, 30.0) * art * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    return ((tone * (1 - 0.3 * breath) + air * breath) * env + bp(nz, 2000, 0.3) * np.exp(-age / 0.02) * lv * 0.35) * 0.32

def ching(open_=True, vel=1.0, seed=0):
    """the ching: two small thick cup cymbals struck together; open (left to ring: 'ching') or pressed together ('chap': damped)"""
    n = int((1.2 if open_ else 0.12) * SR); t = np.arange(n) / SR; ph = np.random.default_rng(abs(int(seed)) + 5); x = np.zeros(n)
    f0 = 2650 * (1 + 0.008 * ph.standard_normal())   # (the two cups never meet the same way twice: the pitch wanders a little)
    for ratio, amp, dec in ((1.0, 1.0, 0.32), (1.53, 0.6, 0.24), (2.37, 0.45, 0.17), (3.11, 0.3, 0.12), (4.02, 0.2, 0.08)):
        x += amp * sine(f0 * ratio * (1 + 0.002 * ph.standard_normal()), n, ph.random()) * np.exp(-t / (dec if open_ else 0.02))
    x += hp(noise(n, abs(int(seed))), 5000) * np.exp(-t / (0.01 if open_ else 0.03)) * (0.4 if open_ else 1.0)
    return x * np.clip(t / 0.0005, 0, 1) * vel * 0.12

def taphon(slap=False, vel=1.0, seed=0):   # a two-headed barrel drum played by hand: the big head's open tone, the small head's slap
    n = int((0.25 if slap else 0.6) * SR); t = np.arange(n) / SR; seed = abs(int(seed))
    if slap: x = bp(noise(n, seed), 1300, 0.45) * np.exp(-t / 0.02) + 0.6 * sine(420 * (1 + 0.2 * np.exp(-t / 0.005)), n) * np.exp(-t / 0.05)
    else: x = sine(118 * (1 + 0.25 * np.exp(-t / 0.02)), n) * np.exp(-t / 0.22) + 0.3 * sine(190, n, 0.3) * np.exp(-t / 0.1) + bp(noise(n, seed), 500, 0.4) * np.exp(-t / 0.015) * 0.4
    return x * np.clip(t / 0.0005, 0, 1) * vel * 0.6

def bass(f, dur, vel=1.0, bright=1.0):
    """the round tropical-house bass: a sine, a soft square through a gentle filter (its upper harmonics for small speakers)"""
    n = int((dur + 0.06) * SR); t = np.arange(n) / SR
    m = sat(lp(pulse(f, n, 0.5) * 0.5 + saw(f, n) * 0.2, 200 + 1000 * bright * vel * np.exp(-t / 0.09), 0.2), 1.6)
    return (sine(f, n) * 0.85 + hp1(m, 140) * 0.7) * adsr(n, 0.004, 0.2, 0.7, 0.06, gate=dur) * vel

def snap(seed=0):   # a finger snap
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (bp(noise(n, seed), 2300, 0.5) * 1.4 + hp(noise(n, seed + 1), 5000) * 0.4) * np.exp(-t / 0.018) * np.clip(t / 0.0006, 0, 1)

def beach(dur, seed=0):
    """the sea and the palms: waves rolling in (a slow swell of low noise, the foam's hiss as each one breaks), the palm leaves
    rustling in a warm breeze"""
    n = int(dur * SR); t = np.arange(n) / SR
    ph = (t / 6.5 + seed * 0.17) % 1.0; wave = np.clip(ph / 0.35, 0, 1) ** 2 * np.exp(-np.clip(ph - 0.35, 0, None) / 0.25)
    sea = lp(noise(n, seed), 600, 0.1) * (0.3 + 0.7 * wave) + hp(noise(n, seed + 1), 3500) * wave ** 2 * 0.35
    rustle = bp(noise(n, seed + 2), 4200, 0.3) * (0.2 + 0.8 * lp1(np.abs(noise(n, seed + 3)), 1.5) * 2) * 0.12
    return sea * 0.6 + rustle

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  pad voicing (midi)          the khim's roll (one stroke each, low to high)
CH = {'F#m7':    (42, [57, 61, 64, 68], [61, 64, 66, 69, 73]),
      'Dmaj9':   (38, [57, 61, 64, 66], [62, 66, 69, 73, 76]),
      'A':       (45, [57, 61, 64, 69], [61, 64, 69, 73, 76]),
      'Esus4':   (40, [57, 59, 64, 69], [59, 64, 69, 71, 76]),
      'E':       (40, [56, 59, 64, 68], [59, 64, 68, 71, 76]),
      'Bm9':     (47, [57, 61, 62, 66], [62, 66, 69, 73, 74]),
      'Dmaj9#11':(38, [57, 61, 64, 68], [62, 64, 68, 69, 73]),
      'Aadd9':   (45, [57, 59, 61, 64, 69], [61, 64, 69, 71, 76])}   # the landing
A_ = {0: 'F#m7', 1: 'Dmaj9', 2: 'A', 3: [(0, 'Esus4'), (2, 'E')]}
HARM = {-9: 'Dmaj9#11', -8: 'Dmaj9#11', -7: 'F#m7', -6: 'Dmaj9', -5: 'A', -4: [(0, 'Esus4'), (2, 'E')], -3: 'F#m7', -2: 'Bm9',
        -1: [(0, 'Esus4'), (2, 'E')], 4: 'Bm9', 5: 'Dmaj9', 6: 'F#m7', 7: [(0, 'Esus4'), (2, 'E')], 8: [(0, 'Dmaj9#11'), (2, 'Esus4')], 13: 'Aadd9'}
for k in range(4): HARM[k] = A_[k]; HARM[k + 9] = A_[k]
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

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
HOOK = {0: [(0, 1, 'E6'), (1, 1, 'F#6'), (2, 2, 'E6'), (4, 2, 'C#6'), (6, 2, 'B5'), (8, 3, 'C#6'), (11, 1, 'E6'), (12, 4, 'F#6')],
        1: [(0, 2, 'A6'), (2, 2, 'F#6'), (4, 2, 'E6'), (6, 2, 'F#6'), (8, 4, 'E6'), (12, 2, 'C#6'), (14, 2, 'B5')],
        2: [(0, 1, 'C#6'), (1, 1, 'E6'), (2, 2, 'C#6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 3, 'B5'), (11, 1, 'C#6'), (12, 4, 'E6')],
        3: [(0, 2, 'F#6'), (2, 2, 'E6'), (4, 2, 'B5'), (6, 2, 'E6'), (8, 4, 'B5'), (12, 2, 'A5'), (14, 2, 'B5')]}
ANSWER = {6: [(0, 1, 'A6'), (1, 1, 'B6'), (2, 2, 'A6'), (4, 2, 'F#6'), (6, 2, 'E6'), (8, 3, 'F#6'), (11, 1, 'A6'), (12, 4, 'B6')],
          7: [(0, 2, 'A6'), (2, 2, 'F#6'), (4, 2, 'E6'), (6, 2, 'C#6'), (8, 4, 'B5'), (12, 4, 'E6')]}
SECOND = {4: [(0, 1, 'D6'), (1, 1, 'E6'), (2, 2, 'D6'), (4, 2, 'B5'), (6, 2, 'A5'), (8, 3, 'B5'), (11, 1, 'D6'), (12, 4, 'F#6')],   # over Bm9
          5: HOOK[1]}
CADENCE = [(0, 2, 'F#6'), (2, 2, 'E6'), (4, 2, 'B5'), (6, 2, 'E6'), (8, 2, 'B5'), (10, 2, 'C#6'), (12, 1, 'E6'), (13, 1, 'F#6')]

drums, perc, chg, bass_b, pad, khm, rn, flt, fx, sea = (S.bus(x) for x in 'drums perc ching bass pad khim ranat khlui fx sea'.split())
kicks = []

def play(bar, phrase, gain, octaves=True, pan=0.1, hard=1.0, roll_from=4, seed0=0):
    """the ranat plays a phrase: two mallets an octave apart; notes of roll_from sixteenths or longer as a tremolo (the mallets
    alternating, about ten strokes a second)"""
    for i, (p, ln, name) in enumerate(phrase):
        m = nm(name); t = T(bar, p); sd = seed0 + (bar + 20) * 29 + i; v = hum(0.05) * (1.05 if p % 4 == 0 else 0.96)
        if ln >= roll_from:
            k = int(ln * s16 / (s16 * 0.75))
            for j in range(k):
                x = j / max(1, k - 1); vv = v * (0.85 + 0.15 * math.sin(math.pi * x)) * (1.0 if j % 2 == 0 else 0.8)
                rn.add(ranat(mtof(m if j % 2 == 0 or not octaves else m - 12), 0.6, vv, sd * 13 + j, hard), t + j * s16 * 0.75, gain, pan + (0.15 if j % 2 else -0.15))
        else:
            rn.add(ranat(mtof(m), 1.0, v, sd, hard), t, gain, pan - 0.15)
            if octaves: rn.add(ranat(mtof(m - 12), 1.0, v * 0.8, sd + 500, hard), t + 0.004, gain, pan + 0.15)

def roll_khim(t, tones, gain, gap=0.045, pan=0.0, seed=0, ring=1.6):   # a khim roll: the beaters run up the chord's strings
    for i, m in enumerate(tones): khm.add(khim(mtof(m), ring, 0.6 + 0.3 * i / len(tones), seed + i), t + i * gap, gain, pan - 0.5 + 0.25 * i)
def khim_bar(bar, gain, style='roll', upto=16):
    """the khim: a roll up the chord on each half bar ('roll'), its strings struck in eighths ('eighths'), or a tremolo ('trem')"""
    for b0, b1, c in chords_in(bar):
        tones = CH[c][2]
        if style == 'roll':
            for k in range(b0, b1, 2):
                if 4 * k < upto: roll_khim(T(bar, 4 * k, 0), tones, gain, pan=-0.2, seed=(bar + 20) * 40 + k)
        elif style == 'eighths':
            for p in range(4 * b0, min(4 * b1, upto), 2):
                m = tones[[0, 2, 4, 3, 1, 3, 4, 2][(p // 2) % 8]]; khm.add(khim(mtof(m), 0.9, 0.6 * hum(0.1), (bar + 20) * 40 + p), T(bar, p), gain, pan=-0.45 if p % 4 == 0 else 0.45)
        else:
            for p in range(4 * b0 * 2, min(4 * b1, upto) * 2):
                m = tones[3 + (p % 2)]; x = (p - 8 * b0) / max(1, (min(4 * b1, upto) - 4 * b0) * 2)
                khm.add(khim(mtof(m), 0.35, (0.4 + 0.6 * x) * (1 if p % 2 == 0 else 0.8), (bar + 20) * 90 + p), T(bar, p / 2, 0), gain, pan=0.3 if p % 2 else -0.3)

def pad_bar(bar, gain, cutoff=2600, a=0.1, r=0.7):
    for t0, ln, c in spans(bar, bar + 1):
        for j, m in enumerate(CH[c][1][:4]): pad.add(voice_pad(mtof(m), ln, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), t0, gain, pan=[-0.7, -0.25, 0.25, 0.7][j])

BASS = [(0, 3, 0), (3, 1, 0), (6, 2, 12), (8, 3, 0), (11, 1, 7), (12, 2, 12), (14, 2, 7)]
def bass_bar(bar, gain, bright=1.0, upto=16):
    for b0, b1, c in chords_in(bar):
        R = CH[c][0] - (12 if CH[c][0] > 44 else 0)
        for p, ln, iv in BASS:
            if 4 * b0 <= p < min(4 * b1, upto): bass_b.add(bass(mtof(R + iv), ln * s16 * 0.9, hum(0.04) * (1.0 if p % 4 == 0 else 0.85), bright), T(bar, p), gain)

TAPH = [(0, False, 1.0), (3, True, 0.7), (6, False, 0.75), (10, True, 0.85), (11, False, 0.6), (14, True, 0.7)]
def ching_bar(bar, g=1.0, upto=16, chap=True):   # the ching keeps the time: open on the offbeats, damped ('chap') on 2 and 4
    for k in range(4):
        if 4 * k + 2 < upto: chg.add(ching(True, hum(0.08), seed=bar * 8 + k), T(bar, 4 * k + 2), 0.5 * g, pan=0.35)
        if chap and k in (1, 3) and 4 * k < upto: chg.add(ching(False, hum(0.08), seed=bar * 8 + k + 4), T(bar, 4 * k), 0.5 * g, pan=0.35)

# drum sounds, made once
KICK = kick(dur=0.36, f0=140, f1=48, sweep=0.045, click=0.3, drive=1.4); KICK[-1500:] *= np.linspace(1, 0, 1500) ** 2
SNP = [snap(s) for s in range(3)]; CLP = clap(seed=8); RIM = rim(seed=4); SHK = [shaker(0.08, seed=s) for s in range(4)]
HC = [hat(0.04, seed=s, tone=9000) for s in range(4)]
def K(t, g=0.55, lpf=None): drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
def groove(bar, g=1.0, upto=16, kick_=True, taph=False):
    for k in range(4):
        if kick_ and 4 * k < upto: K(S.t(bar, k), 0.55 * g)
        if k in (1, 3) and 4 * k < upto: drums.add(SNP[k % 3], T(bar, 4 * k), 0.36 * g * hum(), pan=-0.1); drums.add(CLP, T(bar, 4 * k), 0.12 * g, pan=0.1)
    for p in range(upto):
        perc.add(SHK[p % 4], T(bar, p), g * 0.14 * (0.55, 0.35, 0.9, 0.45)[p % 4] * hum(0.15), pan=-0.45)
        if p % 4 == 2: perc.add(HC[p % 4], T(bar, p), g * 0.1 * hum(0.1), pan=0.5)
    for p in ((7, 13) if bar % 2 else (10,)):
        if p < upto: drums.add(RIM, T(bar, p), 0.08 * g, pan=-0.25)
    for p, sl, v in TAPH if taph else ():
        if p < upto: perc.add(taphon(sl, v * hum(0.08), seed=bar * 16 + p), T(bar, p), 0.3 * g, pan=0.2)

def gap(t1, buses):   # an eighth of air before the hit at t1: these buses fade out (15 ms) at t1 - b/2 and come back at t1
    x = np.arange(S.n) / SR; g = np.clip(1 - (x - (t1 - b / 2)) / 0.015, 0, 1) + np.clip((x - t1 + 0.004) / 0.004, 0, 1)
    for bus in buses: bus.curve(np.minimum(g, 1.0))

def ranat_roll(t0, t1, m, g0, g1, seed=0):   # the ranat's tremolo on one note pair (octave), swelling into the hit at t1
    t = t0; i = 0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); rn.add(ranat(mtof(m - 12 * (i % 2)), 0.5, 0.6 + 0.4 * x, seed + i), t, g0 + (g1 - g0) * x ** 1.3, pan=0.15 if i % 2 else -0.15)
        t += s16 * (0.75 - 0.25 * x); i += 1

def blow(bar, notes, gain, pan=0.2, **kw):   # a khlui phrase: [(sixteenth from the bar, length, note, level)]
    t0 = T(bar, notes[0][0], 0); flt.add(khlui([(T(bar, p, 0) - t0, ln * s16, nm(x), lv) for p, ln, x, lv in notes], **kw), t0, gain, pan)
def as_line(phrases, lv=0.85):
    return [(16 * k + p, ln, name, lv + 0.15 * (ln >= 3)) for k, ph in enumerate(phrases) for p, ln, name in ph]

# ================================================================ INTRO: the globe (bars -9..-1) =================================
I0 = S.t(-9)                                                     # 0.48 s
d_ = S.t(0) - I0 + 1.5; bl, br = beach(d_, 1), beach(d_, 2); x = np.linspace(0, 1, len(bl))
bg = np.clip(x / 0.1, 0, 1) * np.clip((S.t(0) + 0.3 - I0 - np.arange(len(bl)) / SR) / 3.0, 0, 1)
sea.add((bl * bg, br * bg), I0, 0.5)
for t0, ln, c in spans(-9, -2):                                  # the pad, warm, opening
    x = (t0 - I0) / (S.t(-2) - I0)
    for j, m in enumerate(CH[c][1][:4]):
        pad.add(voice_pad(mtof(m), ln, cutoff=900 + 1700 * x, a=1.5 if x < 0.1 else 0.5, r=1.0, voices=5, seed=m + j), t0, 0.24 + 0.16 * x, pan=[-0.7, -0.25, 0.25, 0.7][j])
for t0, ln, c in spans(-9, -6): bass_b.add(voice_sub(mtof(CH[c][0]), ln - 0.1, a=1.0, r=0.8), t0, 0.035)
for bar in range(-9, -3): khim_bar(bar, 0.36 if bar < -6 else 0.4)
# the khlui sings the hook at half speed (two breaths)
blow(-7, [(0, 2, 'E6', 0.75), (2, 2, 'F#6', 0.8), (4, 4, 'E6', 0.9), (8, 4, 'C#6', 0.85), (12, 4, 'B5', 0.8), (16, 6, 'C#6', 0.9), (22, 2, 'E6', 0.8), (24, 7, 'F#6', 1.0)], 0.34, seed=1)
blow(-5, [(0, 4, 'A6', 0.9), (4, 4, 'F#6', 0.85), (8, 4, 'E6', 0.85), (12, 4, 'F#6', 0.85), (16, 8, 'E6', 1.0), (24, 4, 'C#6', 0.85), (28, 3, 'B5', 0.8)], 0.36, seed=2)
for bar in range(-6, -2): ching_bar(bar, 0.5 + 0.12 * (bar + 6), chap=bar >= -4)
for bar in (-4, -3):                                             # the ranat previews the hook (softer mallets), the hand drum, a pulse
    play(bar, HOOK[bar + 4], 0.3, octaves=False, hard=0.5, seed0=200)
    for p, sl, v in TAPH: perc.add(taphon(sl, v, seed=bar * 16 + p), T(bar, p), 0.22, pan=0.2)
    for k in range(4): K(S.t(bar, k), 0.2 + 0.04 * (bar + 4), lpf=300)
    for b0, b1, c in chords_in(bar): bass_b.add(bass(mtof(CH[c][0] - (12 if CH[c][0] > 44 else 0)), (b1 - b0) * b * 0.95, 0.6, 0.3), S.t(bar, b0), 0.16)
    for p in range(0, 16, 2): perc.add(SHK[p % 4], T(bar, p), 0.08, pan=-0.45)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
for bar in (-2, -1):
    for k in range(4 if bar == -2 else 3): K(S.t(bar, k), 0.3 + 0.03 * k)
    for p in range(0, 16 if bar == -2 else 14): perc.add(SHK[p % 4], T(bar, p), 0.06 + 0.004 * p, pan=-0.45)
    pad_bar(bar, 0.26, cutoff=1500 if bar == -2 else 2600, a=0.2)
    ching_bar(bar, 0.8, upto=16 if bar == -2 else 14)
khim_bar(-2, 0.36, 'eighths'); khim_bar(-1, 0.32, 'trem', upto=14)
bass_bar(-2, 0.2, bright=0.5)
for p in range(0, 14, 2): bass_b.add(bass(mtof(40), s16 * 1.7, 0.4 + 0.05 * p, 0.6), T(-1, p), 0.18 + 0.006 * p)
ranat_roll(S.t(-1, 1), T(-1, 14, 0), nm('B5'), 0.1, 0.3, seed=300)
fx.add(riser_cut(2 * B - b / 2, f0=300, f1=9000, seed=3), S.t(-2), 0.2)
fx.add(rev_crash(1.2, seed=5), S.t(0) - 1.2, 0.2)
gap(S.t(0), (pad, khm, perc, bass_b, drums, chg))
play(-1, [(14, 1, 'C#6'), (15, 1, 'D6')], 0.45, seed0=250)       # the ranat's pickup (in the air)

# ================================================================ MAIN: the beach circuit (bars 0..12) ===========================
fx.add(impact(2.5), S.t(0), 0.22); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
chg.add(ching(True, 1.0, seed=99), S.t(0), 0.7, pan=0.3)
roll_khim(S.t(0), CH['F#m7'][2] + [78, 81], 0.4, gap=0.03, seed=990)
for bar in range(13):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'breath' if bar < 9 else 'final'
    upto = 14 if bar == 12 else 16
    if sec in ('A', 'A2'):
        groove(bar, taph=sec == 'A2'); bass_bar(bar, 0.34); pad_bar(bar, 0.26, cutoff=3200); ching_bar(bar)
        khim_bar(bar, 0.28 if sec == 'A' else 0.32, 'eighths' if sec == 'A2' else 'roll')
    elif sec == 'breath':
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1][:4]): pad.add(voice_pad(mtof(m), ln, cutoff=1800, a=0.3, r=0.8, seed=m + 9), t0, 0.3, pan=[-0.7, -0.25, 0.25, 0.7][j])
        bass_b.add(bass(mtof(38), 2 * b * 0.95, 0.8, 0.3), S.t(bar), 0.22)
        for p in range(8, 14, 2): bass_b.add(bass(mtof(40), s16 * 1.7, 0.6 + 0.05 * p, 0.6), T(bar, p), 0.24)
        roll_khim(S.t(bar), CH['Dmaj9#11'][2], 0.36, gap=0.06, seed=950, ring=2.4)
        for p in range(8 * 2, 14 * 2):   # then the khim's tremolo on Esus4
            m = CH['Esus4'][2][3 + (p % 2)]; x = (p - 16) / 12
            khm.add(khim(mtof(m), 0.35, (0.4 + 0.6 * x) * (1 if p % 2 == 0 else 0.8), 900 + p), T(bar, p / 2, 0), 0.34, pan=0.3 if p % 2 else -0.3)
        for k in (2, 3): K(S.t(bar, k), 0.42)
        for p in range(8, 14): perc.add(SHK[p % 4], T(bar, p), 0.1, pan=-0.45)
        ching_bar(bar, 0.7, upto=14, chap=False)
    else:
        groove(bar, upto=upto, taph=True); bass_bar(bar, 0.34, upto=upto); pad_bar(bar, 0.26, cutoff=4200); ching_bar(bar, upto=upto)
        khim_bar(bar, 0.3, 'eighths', upto=upto)
        perc.add(ride(0.7, seed=bar), S.t(bar), 0.12, pan=0.35)
# the tunes
for bar in range(4): play(bar, HOOK[bar], 0.55)
for bar in (4, 5): play(bar, SECOND[bar], 0.55)
for bar in (6, 7): play(bar, ANSWER[bar], 0.55)
blow(8, [(0, 1, 'F#6', 0.6), (1, 5, 'E6', 1.0), (6, 2, 'C#6', 0.8), (8, 1, 'C#6', 0.6), (9, 5, 'B5', 0.9)], 0.4, seed=3, rel=0.2)
for bar in range(9, 12): play(bar, HOOK[bar - 9], 0.58)
play(12, CADENCE, 0.58)
blow(9, as_line([HOOK[0], HOOK[1]]), 0.26, seed=4, pan=-0.25)
blow(11, as_line([HOOK[2], CADENCE]) + [(32, 10, 'E6', 1.0)], 0.26, seed=5, pan=-0.25, rel=0.5)
# fills, crashes
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
for p, sl, v in ((12, False, 0.8), (13, True, 0.7), (14, False, 0.9), (15, True, 0.8)): perc.add(taphon(sl, v, seed=p), T(3, p), 0.34, pan=0.2)
for p, sl, v in ((8, False, 0.8), (10, True, 0.7), (11, False, 0.8), (12, True, 0.8), (13, False, 0.9), (14, True, 0.9), (15, True, 0.9)): perc.add(taphon(sl, v, seed=p + 20), T(7, p), 0.36, pan=0.2)
fx.add(crash(2.5, seed=3), S.t(8), 0.2, pan=0.2); fx.add(downlifter(B, seed=6), S.t(8), 0.1)
wl, wr = beach(B + 1.5, 7), beach(B + 1.5, 8); ge = np.sin(np.pi * np.arange(len(wl)) / len(wl)) ** 2
sea.add((wl * ge, wr * ge), S.t(8) - 0.4, 0.45)
fx.add(riser_cut(B / 2 - b / 2, f0=600, f1=10000, seed=7), S.t(8, 2), 0.24); ranat_roll(S.t(8, 2), T(8, 14, 0), nm('B5'), 0.15, 0.34, seed=600)
fx.add(rev_crash(1.0, seed=9), S.t(9) - 1.0, 0.2)
gap(S.t(9), (pad, khm, perc, bass_b, drums, chg))
fx.add(crash(2.6, seed=4), S.t(9), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(9), 0.13); chg.add(ching(True, 1.0, seed=98), S.t(9), 0.7, pan=0.3)
roll_khim(S.t(9), CH['F#m7'][2] + [78, 81], 0.36, gap=0.03, seed=980)
# the last bar into the landing: the ranat's roll, the hand drum, a riser, an eighth of air
ranat_roll(S.t(12, 2), T(12, 14, 0), nm('B6'), 0.12, 0.3, seed=700)
for p, sl, v in ((8, False, 0.8), (10, True, 0.8), (11, False, 0.8), (12, True, 0.9), (13, False, 1.0)): perc.add(taphon(sl, v, seed=p + 40), T(12, p), 0.36, pan=0.2)
fx.add(riser_cut(B - b / 2, f0=600, f1=11000, seed=8), S.t(12), 0.2); fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.24)
gap(LAND, (pad, khm, perc, bass_b, drums, chg))

# ================================================================ LANDING: bar 13 = 48.2 s, the race starts ======================
drums.add(KICK, LAND, 0.7); drums.add(CLP, LAND, 0.3); drums.add(SNP[0], LAND, 0.3)
fx.add(impact(2.5, seed=5), LAND, 0.3); fx.add(crash(3.0, seed=6), LAND, 0.34, pan=0.1); chg.add(ching(True, 1.0, seed=97), LAND, 0.8, pan=0.3)
perc.add(taphon(False, 1.0, seed=3), LAND, 0.4, pan=0.2)
for m in (nm('A6'), nm('A5')): rn.add(ranat(mtof(m), 1.6, 1.0, seed=m), LAND, 0.5, pan=0.1)
roll_khim(LAND, CH['Aadd9'][2] + [81], 0.42, gap=0.035, seed=970, ring=2.4)
for j, m in enumerate(CH['Aadd9'][1]): pad.add(voice_pad(mtof(m), 1.0, cutoff=4200, a=0.01, r=1.3, seed=m), LAND, 0.24, pan=[-0.7, -0.35, 0, 0.35, 0.7][j])
lb = bass(mtof(33), 2.3, 1.0, 0.6); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass_b.add(lb, LAND, 0.42)

# ================================================================ MIX =============================================================
def duck(times, depth, release): return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)   # (smoothed: no click)
bass_b.curve(duck(kicks, 0.55, 0.14)); pad.curve(duck(kicks, 0.45, 0.2)); khm.curve(duck(kicks, 0.2, 0.12)); chg.curve(duck(kicks, 0.1, 0.08))
fc = curve([(0, 2600), (S.t(-3), 3200), (S.t(-2), 1300), (S.t(-1, 2), 4500), (S.t(0) - 0.05, 12000), (S.t(0), 16000), (S.t(8), 16000),
            (S.t(8, 1), 2600), (S.t(8, 2), 2800), (S.t(9) - 0.05, 14000), (S.len, 16000)], log=True)
for x in (pad, khm): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 150)); khm.filt(lambda x: hp1(x, 200)); rn.filt(lambda x: hp1(x, 200)); flt.filt(lambda x: hp1(x, 250)); chg.filt(lambda x: hp1(x, 1500))
bass_b.filt(lambda x: hp1(x, 32)); perc.filt(lambda x: lp1(x, 13000)); sea.filt(lambda x: hp1(x, 80))
pad.width(1.8); khm.width(1.5); rn.gain(1.1); khm.gain(1.5); chg.gain(1.2); perc.width(1.3)
# sends: a warm, open reverb (the evening air by the sea), a short room for the drums, a dotted-eighth echo on the ranat and the khlui
verb_in = S.bus()
for x, a in ((pad, 0.3), (khm, 0.3), (rn, 0.18), (flt, 0.4), (chg, 0.2), (fx, 0.2), (perc, 0.06), (sea, 0.1)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.1, decay=2.4, damp=0.3, predelay=0.025); vl, vr = vl * 1.3, vr * 1.3
room_l, room_r = reverb(drums.L * 0.1, drums.R * 0.1, size=0.45, decay=0.6, damp=0.4)
dr = rn.send_delay(b * 0.75, 0.14, fb=0.32, damp=0.45); df = flt.send_delay(b * 0.75, 0.2, fb=0.35, damp=0.4)
BUSES = [drums, perc, chg, bass_b, pad, khm, rn, flt, fx, sea, (vl, vr), (room_l, room_r), dr, df]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in the intro and the main, before the master)
    for x in BUSES:
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x; nm_ = x.name if isinstance(x, Bus) else 'send'
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); print(f'{nm_:9s} {sec:5s} rms {20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/thailand', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.5, lows_db=-1.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
