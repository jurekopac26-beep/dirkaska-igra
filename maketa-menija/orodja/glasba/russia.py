"""Russia (the Katu-Yaryk pass in the Altai: a gravel road dropping in hairpins down a sheer wall into the deep canyon of the
Chulyshman river; wild, vast, Siberian): Siberian trance.
A domra (the round-bodied Russian lute, played with a pick in a fast tremolo, so its long notes shimmer) sings the hook, doubled by a
wide trance lead; balalaikas strum the offbeats and roll their chords in tremolo in the builds; a bayan (the Russian button accordion,
its dark cassotto reeds) breathes the chords; deep bells (a big bell's slow strokes, the small bells' quick peal) ring over the
canyon; a throat-sung drone (as the Altai singers' kai: one low voice whose overtones whistle a tune above it) opens the globe; a low
choir, rolling offbeat trance bass, a big four-on-the-floor kick, wind in the canyon and the river far below.
B minor (natural, the harmonic minor's A# in the cadences), 144.68 bpm: 17 bars from the drop to the race's start.
The hook climbs a minor triad to a long high note that the domra's tremolo holds, then steps down (the descent), each bar lower:
Bm G Em F#7; the answer climbs higher (to the G over G major) before the cadence.
Original: the melodies, the chords' voicing, the rhythms and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind down the canyon, a big bell far off (slower than the beat), the throat-sung drone on B
                                     with its overtones tracing the hook's outline; a dark pad; the bayan's chords; the domra
                                     previews the hook at half speed, far away; the balalaikas' tremolo; a muffled pulse; the build
                                     (Em, F#7sus4 -> F#7): the kick, the rolling bass, the roll, the riser, an eighth of air,
                                     the domra's pickup
    drop  (20.0 s)     bar 0         the bell, the chord, the groove and the hook
    A 0-3 (Bm G Em F#7), A' 4-7 (Bm D/A G Em-F#7: the bayan, the choir, a higher answer), the canyon floor 8-10 (no kick: Gmaj7 Em9
    Bm/F#: the river, the bayan's slow tune, the small bells' peal, the choir), the climb back 11-12 (Em, F#7sus4 -> F#7b9: the
    balalaikas' tremolo, the roll), final 13-16 (everything: the big bell marks the return, the lead an octave up, the choir),
    LANDING at bar 17 = 48.2 s: B minor: the big bell, the chord, a full tremolo strum, the crash; it rings out through the tail
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 17                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 144.68 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
def T(bar, p=0.0):                            # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro); straight
    return S.t(bar, p / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(41)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def lute(f, dur, vel=1.0, seed=0, t60=0.9, bright=0.8, body=(560, 2600)):
    """a plucked steel string of the domra / balalaika family (Karplus-Strong), picked near the bridge with a plectrum: bright, quick;
    the body's resonances (a round shell for the domra, a triangular box for the balalaika)"""
    seed = abs(int(seed)); x = pluck(f, dur, 10 ** (-3 / (f * t60)), bright * (0.7 + 0.3 * vel), seed, 0.1)
    return (hp1(x, 200) + bp(x, body[0], 0.4) * 0.3 + bp(x, body[1], 0.45) * 0.35) * 0.34 * vel

def domra(bus, t, m, d, gain, pan=0.0, seed=0, rate=None):
    """the domra's note: a short note is one stroke of the pick; a long one is played in tremolo (down, up, down, ... about 14 strokes a
    second, locked to the tempo: sextuplet sixteenths), the up-strokes lighter, swelling a little through the note"""
    rate = rate or s16 * 2 / 3
    if d < 0.2: bus.add(lute(mtof(m), d + 0.35, 1.0, seed, 0.8, 0.85, (620, 2900)), t, gain, pan); return
    k = max(2, int(round(d / rate)))
    for i in range(k):
        x = i / k; v = (1.0 if i % 2 == 0 else 0.72) * (0.85 + 0.2 * math.sin(math.pi * x)) * hum(0.05)
        bus.add(lute(mtof(m) * (1 + 0.0015 * (i % 2)), rate * 2.2 if i < k - 1 else 0.45, v, seed * 37 + i, 0.8, 0.82, (620, 2900)), t + i * rate, gain, pan)

def balalaika_strum(bus, t, tones, vel=1.0, up=False, ring=0.3, pan=0.0, seed=0):
    order = tones[::-1] if up else tones
    for i, m in enumerate(order): bus.add(lute(mtof(m), ring, vel * (0.8 if up else 1.0) * hum(0.06), seed + i, 0.6, 0.9, (480, 3300)), t + i * 0.006, 1.0, pan + 0.15 * (i - 1))

def bayan(f, dur, bright=1.0, a=0.06, r=0.15, seed=0):
    """the bayan's reeds through its cassotto (a wooden chamber that darkens them): two reeds a hair apart, a low reed, a warm
    middle; the bellows' slow swell"""
    n = int((dur + r) * SR); rr = np.random.default_rng(abs(int(seed))); t = np.arange(n) / SR
    x = pulse(f, n, 0.3, rr.random()) + 0.55 * pulse(f * 1.0018, n, 0.33, rr.random()) + 0.35 * pulse(f * 0.5, n, 0.4, rr.random())
    y = lp(x, 1700 * bright, 0.1) * 0.6 + bp(x, 850, 0.5) * 0.35
    env = adsr(n, a, 0.2, 0.9, r, gate=dur) * (1 + 0.03 * np.sin(TAU * 0.8 * t))
    return hp1(y, 120) * env * 0.26

def bell(f, dur=5.0, seed=0, tierce=1.2, ring=1.0, clank=0.5, strike=0.8):
    """a Russian bell: the hum an octave down, the strike tone, a minor tierce, the fifth, the nominal and higher partials, each a
    slowly beating doublet; the clapper's clang"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); flare = 1 + strike * np.exp(-t / 0.05); ph = np.random.default_rng(seed + 77)
    for ratio, amp, dec in ((0.5, 0.6, 3.6), (1.0, 0.45, 2.4), (tierce, 0.25, 1.8), (1.5, 0.2, 1.4), (2.0, 0.38, 1.5),
                            (2 * tierce, 0.1, 0.8), (2.66, 0.1, 0.7), (3.0, 0.1, 0.6), (4.1, 0.06, 0.4)):
        p0 = ph.random(); x += amp * (sine(f * ratio, n, p0) + 0.6 * sine(f * ratio * 1.0013, n, p0)) * np.exp(-t / (dec * ring)) * (flare if ratio >= 2 else 1)
    x += bp(noise(n, seed), f * 3.2, 0.3) * np.exp(-t / 0.015) * clank
    return x * np.clip(t / 0.0015, 0, 1) * 0.3

def kai(f0, dur, contour, seed=0, vowel=520):
    """a throat-sung drone: one low voice (a buzzing glottal pulse) through a vowel, and one overtone picked out by a very narrow
    resonance (the singer's tongue), whistling a tune of harmonics above it. contour: [(seconds, harmonic number)]"""
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.003 * np.sin(TAU * 4.6 * t) + 0.002 * np.sin(TAU * 0.3 * t))
    src = pulse(f, n, 0.1) * 0.7 + saw(f, n) * 0.3
    h = np.interp(t, *zip(*contour)); h = lp1(lp1(h, 12.0), 12.0)   # (the tongue glides between the harmonics)
    y = bp(src, vowel, 0.6) * 0.45 + lp(src, 300, 0.2) * 0.35 + bp(src, f * h, 0.985) * 1.6 + bp(src, f * h * 2, 0.97) * 0.2
    return hp1(y, 70) * np.clip(t / 1.2, 0, 1) * np.clip((dur - t) / 1.0, 0, 1) * 0.35

def lead(f, dur, cutoff=5000, a=0.006, r=0.18, seed=0):
    """the trance lead: two detuned supersaws, a filter blip on each note (stereo)"""
    n = int((dur + r) * SR); t = np.arange(n) / SR
    L = supersaw(f, n, 5, 0.25, 0.8, seed); R = supersaw(f, n, 5, 0.25, 0.8, seed + 500); fc = cutoff * (0.7 + 0.6 * np.exp(-t / 0.1))
    e = adsr(n, a, 0.2, 0.8, r, gate=dur); return lp(L, fc, 0.15) * e * 0.3, lp(R, fc, 0.15) * e * 0.3

def chord_stab(midis, dur, cutoff=4000, a=0.004, r=0.12, seed=0):   # the trance chord (supersaws, stereo), short or held
    n = int((dur + r) * SR); L = np.zeros(n); R = np.zeros(n)
    for j, m in enumerate(midis): L += supersaw(mtof(m), n, 5, 0.22, 0.85, seed + 11 * j); R += supersaw(mtof(m), n, 5, 0.22, 0.85, seed + 11 * j + 500)
    t = np.arange(n) / SR; fc = cutoff * (0.6 + 0.6 * np.exp(-t / 0.12)); e = adsr(n, a, 0.25, 0.7, r, gate=dur)
    return lp(L, fc, 0.12) * e * 0.4, lp(R, fc, 0.12) * e * 0.4

def roll_bass(f, dur, vel=1.0, bright=1.0):
    """the rolling trance bass: a short plucky saw with a sine under it"""
    n = int((dur + 0.04) * SR); t = np.arange(n) / SR
    m = sat(lp(saw(f, n) * 0.65 + pulse(f, n, 0.3) * 0.2, 240 + 1800 * bright * np.exp(-t / 0.05), 0.3), 1.9)
    return (sine(f, n) * 0.7 + hp1(m, 110) * 0.8) * adsr(n, 0.002, 0.08, 0.6, 0.03, gate=dur) * vel

def canyon(dur, seed=0, river=0.0):
    """wind down the canyon (a low roar and a whistle in gusts); river: the Chulyshman's rush far below (broadband, steady)"""
    n = int(dur * SR); t = np.arange(n) / SR
    fc = 420 * 2 ** (1.1 * np.sin(TAU * 0.05 * t + seed) + 0.4 * np.sin(TAU * 0.13 * t + 2 * seed))
    w = bp(noise(n, seed), fc, 0.7) * (0.5 + 0.5 * np.sin(TAU * 0.07 * t + seed) ** 2) + bp(noise(n, seed + 5), fc * 3.5, 0.9) * 0.15
    return w + river * (lp(noise(n, seed + 7), 1800, 0.1) * 0.5 + bp(noise(n, seed + 8), 3500, 0.2) * 0.15) * (0.9 + 0.1 * np.sin(TAU * 0.3 * t))

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  pad / bayan voicing           the balalaikas' three strings, the trance chord (supersaws)
CH = {'Bm':      (35, [54, 59, 62, 66], [66, 71, 74], [59, 62, 66, 71, 74]),
      'G':       (31, [55, 59, 62, 67], [67, 71, 74], [59, 62, 67, 71, 74]),
      'Em':      (40, [55, 59, 64, 67], [64, 67, 71], [59, 64, 67, 71, 76]),
      'D':       (38, [54, 57, 62, 66], [66, 69, 74], [57, 62, 66, 69, 74]),
      'D/A':     (33, [54, 57, 62, 66], [66, 69, 74], [57, 62, 66, 69, 74]),
      'F#7sus4': (42, [54, 59, 61, 64], [64, 66, 71], [59, 61, 64, 66, 71]),
      'F#7':     (42, [54, 58, 61, 64], [64, 66, 70], [58, 61, 64, 66, 70]),
      'F#7b9':   (42, [55, 58, 61, 64], [64, 67, 70], [58, 61, 64, 67, 70]),
      'Gmaj7':   (31, [54, 59, 62, 66], [66, 71, 74], [59, 62, 66, 71, 74]),
      'Em9':     (40, [54, 59, 62, 67], [66, 67, 71], [59, 62, 66, 67, 71]),
      'Bm/F#':   (42, [54, 59, 62, 66], [66, 71, 74], [59, 62, 66, 71, 74]),
      'BmL':     (35, [54, 59, 62, 66, 71], [66, 71, 74], [59, 62, 66, 71, 74, 78])}   # the landing
A_ = {0: 'Bm', 1: 'G', 2: 'Em', 3: [(0, 'F#7sus4'), (2, 'F#7')]}
HARM = {-11: 'Bm', -10: 'Bm', -9: 'G', -8: 'G', -7: 'Em', -6: 'Em', -5: 'Bm', -4: 'G', -3: 'D', -2: 'Em', -1: [(0, 'F#7sus4'), (2, 'F#7')],
        4: 'Bm', 5: 'D/A', 6: 'G', 7: [(0, 'Em'), (2, 'F#7')], 8: 'Gmaj7', 9: 'Em9', 10: 'Bm/F#', 11: 'Em', 12: [(0, 'F#7sus4'), (2, 'F#7b9')],
        17: 'BmL'}
for k in range(4): HARM[k] = HARM[k + 13] = A_[k]
HARM[16] = [(0, 'Em'), (2, 'F#7')]
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
HOOK = {0: [(0, 2, 'B5'), (2, 2, 'D6'), (4, 6, 'F#6'), (10, 2, 'E6'), (12, 2, 'D6'), (14, 2, 'C#6')],
        1: [(0, 6, 'D6'), (6, 2, 'B5'), (8, 4, 'G5'), (12, 2, 'A5'), (14, 2, 'B5')],
        2: [(0, 2, 'G5'), (2, 2, 'B5'), (4, 6, 'E6'), (10, 2, 'D6'), (12, 2, 'B5'), (14, 2, 'G5')],
        3: [(0, 4, 'A5'), (4, 4, 'B5'), (8, 4, 'A#5'), (12, 4, 'C#6')]}
SECOND = {4: HOOK[0],
          5: [(0, 6, 'F#6'), (6, 2, 'E6'), (8, 4, 'D6'), (12, 2, 'C#6'), (14, 2, 'D6')],
          6: [(0, 2, 'B5'), (2, 2, 'D6'), (4, 6, 'G6'), (10, 2, 'F#6'), (12, 2, 'E6'), (14, 2, 'D6')],
          7: [(0, 4, 'E6'), (4, 2, 'D6'), (6, 2, 'B5'), (8, 4, 'A#5'), (12, 2, 'C#6'), (14, 2, 'E6')]}
CADENCE = [(0, 2, 'G5'), (2, 2, 'B5'), (4, 4, 'E6'), (8, 2, 'C#6'), (10, 2, 'A#5'), (12, 2, 'C#6'), (14, 1, 'E6'), (15, 1, 'F#6')]
FLOOR = {8: [(0, 8, 'F#5'), (8, 4, 'D5'), (12, 4, 'E5')],        # the bayan's slow tune on the canyon floor
         9: [(0, 6, 'G5'), (6, 2, 'F#5'), (8, 8, 'B4')],
         10: [(0, 4, 'C#5'), (4, 4, 'D5'), (8, 8, 'F#5')]}

drums, perc, bass_b, pad, chords, dom, bal, bay, ld, bells, choir, fx = (S.bus(x) for x in 'drums perc bass pad chords domra balalaika bayan lead bells choir fx'.split())
kicks = []

def play(bar, phrase, gain, lead_=0.0, octave=0, pan=0.1, seed0=0):
    """the domra plays a phrase (tremolo on the long notes); lead_: the trance lead doubles it (an octave up with octave=1)"""
    for i, (p, ln, name) in enumerate(phrase):
        m = nm(name); t = T(bar, p); d = ln * s16 * 0.97
        domra(dom, t, m, d, gain * hum(0.04), pan, seed=seed0 + (bar + 20) * 23 + i)
        if lead_: ld.add(lead(mtof(m + 12 * octave), d * 0.95, seed=seed0 + (bar + 20) * 23 + i), t, lead_)

def bal_bar(bar, gain, upto=16, trem=False, ring=0.22):
    """the balalaikas: short strums on the offbeat eighths (with a lighter up-stroke after); trem: the chord rolled in tremolo"""
    for b0, b1, c in chords_in(bar):
        tones = CH[c][2]
        if trem:
            k = int(round((min(4 * b1, upto) - 4 * b0) * 1.5))
            for i in range(k): balalaika_strum(bal, T(bar, 4 * b0) + i * s16 * 2 / 3, tones, gain * (0.55 + 0.45 * (i / max(1, k - 1))) * (1 if i % 2 == 0 else 0.8), up=i % 2 == 1, ring=0.2, pan=0.35, seed=(bar + 20) * 211 + i * 3)
            continue
        for k in range(b0, b1):
            for s, v, up in ((2, 1.0, False), (3, 0.55, True)):
                if 4 * k + s < upto: balalaika_strum(bal, T(bar, 4 * k + s), tones, gain * v * hum(0.05), up=up, ring=ring, pan=0.35, seed=(bar + 20) * 97 + 4 * k + s)

def pad_bar(bar, gain, cutoff=2400, a=0.1, r=0.6):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(CH[c][1][:4]):
            pad.add(voice_pad(mtof(m), (b1 - b0) * b, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), S.t(bar, b0), gain, pan=[-0.7, -0.25, 0.25, 0.7][j])

def bayan_bar(bar, gain, bright=1.0):
    for t0, ln, c in spans(bar, bar + 1):
        for j, m in enumerate(CH[c][1][:4]): bay.add(bayan(mtof(m), ln * 0.97, bright, a=0.12, seed=bar * 8 + j), t0, gain, pan=-0.4 + 0.27 * j)

def stab_bar(bar, gain, cutoff=4500, pattern=((0, 3), (3, 3), (6, 2), (8, 2), (10, 2), (12, 4)), upto=16):
    for p, ln in pattern:
        if p >= upto: continue
        c = chord_at(bar, p / 4); chords.add(chord_stab(CH[c][3], ln * s16 * 0.85, cutoff, seed=(bar + 20) * 7 + p), T(bar, p), gain)

def bass_bar(bar, gain, bright=1.0, upto=16):
    """the rolling offbeat bass: the three sixteenths after each kick (the kick owns the beat)"""
    for b0, b1, c in chords_in(bar):
        R = CH[c][0] + 12 if CH[c][0] < 36 else CH[c][0]
        for k in range(b0, b1):
            for s in (1, 2, 3):
                p = 4 * k + s
                if p < upto: bass_b.add(roll_bass(mtof(R + (12 if s == 3 and k % 2 else 0)), s16 * 0.8, (0.8, 0.9, 1.0)[s - 1] * hum(0.04), bright), T(bar, p), gain)

# drum sounds, made once
KICK = kick(dur=0.32, f0=180, f1=48, sweep=0.03, click=0.7, drive=2.0); KICK[-1500:] *= np.linspace(1, 0, 1500) ** 2
CLP = clap(seed=6); SNR = snare(0.22, tone=200, snappy=0.85, seed=7)
HC = [hat(0.045, seed=s, tone=8500) for s in range(4)]; HO = [hat(open_=True, seed=s + 10, tone=7000) * 0.8 for s in range(2)]
def K(t, g=0.56, lpf=None): drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
def groove(bar, g=1.0, upto=16, ride_=False, clap_=True):
    for k in range(4):
        if 4 * k < upto: K(S.t(bar, k), 0.56 * g)
        if clap_ and k in (1, 3) and 4 * k < upto: drums.add(CLP, S.t(bar, k), 0.3 * g * hum(), pan=0.04); drums.add(SNR, S.t(bar, k), 0.1 * g)
        if 4 * k + 2 < upto: perc.add(HO[k % 2], T(bar, 4 * k + 2), 0.24 * g * hum(), pan=0.25)
        if ride_ and 4 * k + 2 < upto: perc.add(ride(0.7, seed=k), T(bar, 4 * k + 2), 0.16 * g, pan=-0.35)
    for p in range(upto):
        if p % 4: perc.add(HC[p % 4], T(bar, p), g * (0.0, 0.12, 0.08, 0.14)[p % 4] * hum(0.15), pan=-0.4)

def roll(t0, t1, n0, n1, g0, g1, tone0=190, tone1=260):   # a snare roll, faster and louder towards t1
    t = t0; i = 0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.15, tone=tone0 + (tone1 - tone0) * x, seed=i % 97), t, g0 + (g1 - g0) * x ** 1.4, pan=0.05)
        t += b / (n0 + (n1 - n0) * x); i += 1

def gap(t1, buses):   # an eighth of air before the hit at t1: these buses fade out (15 ms) at t1 - b/2 and come back at t1
    x = np.arange(S.n) / SR; g = np.clip(1 - (x - (t1 - b / 2)) / 0.015, 0, 1) + np.clip((x - t1 + 0.004) / 0.004, 0, 1)
    for bus in buses: bus.curve(np.minimum(g, 1.0))

BIG = nm('B2')   # the big bell (its hum an octave lower: B1)
def big_bell(t, g, ring=1.0, dur=6.0, seed=0, pan=-0.2): bells.add(bell(mtof(BIG), dur, seed=seed, ring=ring), t, g, pan)
PEAL = {9: [(0, 'B4'), (2, 'F#5'), (3, 'D5'), (4, 'B4'), (6, 'E5'), (7, 'D5'), (8, 'B4'), (10, 'F#5'), (11, 'E5'), (12, 'D5'), (14, 'B4'), (15, 'F#5')],
        10: [(0, 'B4'), (2, 'F#5'), (3, 'D5'), (4, 'C#5'), (6, 'F#5'), (7, 'D5'), (8, 'B4'), (9, 'C#5'), (10, 'D5'), (12, 'F#5'), (13, 'E5'), (14, 'D5')]}
def peal(bar, gain):   # the small bells' quick peal (the ringer's hands and feet on many ropes), the big bell on the downbeat
    for p, name in PEAL[bar]:
        bells.add(bell(mtof(nm(name)), 2.0, seed=(bar + 20) * 16 + p, tierce=1.19, ring=0.35, clank=1.2, strike=3.0), T(bar, p), gain * hum(0.1), pan={'B4': -0.5, 'C#5': -0.2, 'D5': 0.1, 'E5': 0.35, 'F#5': 0.6}[name])

# ================================================================ INTRO: the globe (bars -11..-1) ================================
I0 = S.t(-11)                                                    # 1.75 s
d_ = S.t(0) - I0 + 1.5; wl, wr = canyon(d_, 1), canyon(d_, 2); x = np.linspace(0, 1, len(wl))
wg = np.clip(x / 0.08, 0, 1) * (0.7 + 0.3 * x) * np.clip((S.t(0) + 0.3 - I0 + 0.9 - np.arange(len(wl)) / SR) / 3.0, 0, 1)
fx.add((wl * wg, wr * wg), I0 - 0.9, 0.36)
for bar, g in ((-11, 0.2), (-9, 0.26), (-7, 0.3), (-5, 0.34)): big_bell(S.t(bar), g, seed=bar + 30)
# the throat-sung drone on B: its overtones trace the hook's outline (8 = B, 9 = C#, 6 = F#, 12 = F#, 10.7 ~ D... kept to the true ones)
t_k = S.t(-11); dur_k = S.t(-4) - t_k + 1.0
contour = [(0, 8), (2.5, 8), (3.0, 9), (3.8, 8), (4.6, 12), (6.2, 12), (6.7, 9), (7.4, 8), (8.2, 6), (9.5, 6), (10.0, 8), (10.8, 9), (11.4, 12), (dur_k, 12)]
choir.add(kai(mtof(nm('B2')), dur_k, contour, seed=1), t_k, 0.1, 0.0)
for t0, ln, c in spans(-11, -2):                                 # the pad: dark, opening slowly
    x = (t0 - I0) / (S.t(-2) - I0)
    for j, m in enumerate(CH[c][1][:4]):
        pad.add(voice_pad(mtof(m), ln, cutoff=600 + 1800 * x, a=1.6 if x < 0.1 else 0.5, r=1.0, voices=5, seed=m + j), t0, 0.14 + 0.24 * x, pan=[-0.7, -0.25, 0.25, 0.7][j])
for t0, ln, c in spans(-11, -5): bass_b.add(voice_sub(mtof(CH[c][0] + 12 if CH[c][0] < 36 else CH[c][0]), ln - 0.1, a=1.2, r=0.8), t0, 0.035)
for bar in range(-8, -2): bayan_bar(bar, 0.2 + 0.02 * (bar + 8), bright=0.7 + 0.05 * (bar + 8))
# the domra previews the hook at half speed, far away (filtered in the MIX)
for i, (p, ln, name) in enumerate([(0, 4, 'B5'), (4, 4, 'D6'), (8, 12, 'F#6'), (20, 4, 'E6'), (24, 4, 'D6'), (28, 4, 'C#6')]):
    domra(dom, T(-7, p), nm(name), ln * s16 * 0.97, 0.3, -0.1, seed=500 + i)
for i, (p, ln, name) in enumerate([(0, 12, 'D6'), (12, 4, 'B5'), (16, 8, 'G5'), (24, 4, 'A5'), (28, 4, 'B5')]):
    domra(dom, T(-5, p), nm(name), ln * s16 * 0.97, 0.34, -0.1, seed=520 + i)
for bar in (-5, -4, -3): bal_bar(bar, 0.2 + 0.05 * (bar + 5), trem=bar == -3, ring=0.3)
for bar in (-4, -3):
    for k in range(4): K(S.t(bar, k), 0.2 + 0.04 * (bar + 4), lpf=280)
    for b0, b1, c in chords_in(bar): bass_b.add(roll_bass(mtof(CH[c][0] + 12 if CH[c][0] < 36 else CH[c][0]), (b1 - b0) * b * 0.95, 0.6, 0.2), S.t(bar, b0), 0.16)
    for p in range(2, 16, 4): perc.add(HO[p % 2], T(bar, p), 0.08 + 0.03 * (bar + 4), pan=0.25)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
for bar in (-2, -1):
    for k in range(4 if bar == -2 else 3): K(S.t(bar, k), 0.3 + 0.03 * k)
    for p in range(1, 16 if bar == -2 else 14, 2): perc.add(HC[p % 4], T(bar, p), 0.06 + 0.004 * p, pan=-0.4)
    pad_bar(bar, 0.22, cutoff=1400 if bar == -2 else 2400, a=0.2)
bass_bar(-2, 0.2, bright=0.5); bass_bar(-1, 0.22, bright=0.7, upto=14)
bal_bar(-2, 0.32, trem=True); bal_bar(-1, 0.38, trem=True, upto=14)
stab_bar(-1, 0.1, cutoff=2500, upto=14)
roll(S.t(-2, 2), S.t(-1), 2, 4, 0.06, 0.12); roll(S.t(-1), T(-1, 14), 4, 8, 0.12, 0.22)
fx.add(riser_cut(2 * B - b / 2, f0=300, f1=9000, seed=3), S.t(-2), 0.22)
fx.add(rev_crash(1.1, seed=5), S.t(0) - 1.1, 0.2)
gap(S.t(0), (pad, bal, perc, bass_b, drums, chords, bay))
play(-1, [(14, 2, 'F#5')], 0.5)                                  # the domra's pickup into the hook

# ================================================================ MAIN: the descent (bars 0..16) =================================
fx.add(impact(2.5), S.t(0), 0.26); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
big_bell(S.t(0), 0.42, ring=0.6, dur=4.0, seed=1)
chords.add(chord_stab(CH['Bm'][3] + [78], b * 1.5, 6000, r=0.4, seed=900), S.t(0), 0.32)
for bar in range(17):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'floor' if bar < 11 else 'climb' if bar < 13 else 'final'
    upto = 14 if bar == 16 else 16
    if sec in ('A', 'A2'):
        groove(bar, ride_=sec == 'A2'); bass_bar(bar, 0.32); pad_bar(bar, 0.24, cutoff=3000); bal_bar(bar, 0.42)
        stab_bar(bar, 0.16 if sec == 'A' else 0.18)
        if sec == 'A2': bayan_bar(bar, 0.2)
    elif sec == 'floor':
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1][:4]): pad.add(voice_pad(mtof(m), ln, cutoff=1600, a=0.5, r=1.0, seed=m + 9), t0, 0.28, pan=[-0.7, -0.25, 0.25, 0.7][j])
            bass_b.add(roll_bass(mtof(CH[c][0] + 12 if CH[c][0] < 36 else CH[c][0]), ln * 0.95, 0.8, 0.25), t0, 0.22)
            for j, m in enumerate(CH[c][1][:3]): choir.add(voice_choir(mtof(m - 12), ln * 0.95, 'o', a=0.5, r=0.9, seed=bar * 3 + j), t0, 0.22, pan=-0.3 + 0.3 * j)
        for p in range(2, 16, 4): perc.add(HO[p % 2], T(bar, p), 0.07, pan=0.25)
        if bar == 10: bal_bar(bar, 0.26, trem=True)
    elif sec == 'climb':
        groove(bar, 0.9 if bar == 11 else 1.0, upto=14 if bar == 12 else 16, clap_=bar == 12)
        bass_bar(bar, 0.3, bright=0.7 + 0.15 * (bar - 11), upto=14 if bar == 12 else 16); pad_bar(bar, 0.22, cutoff=2200, a=0.2)
        bal_bar(bar, 0.36 + 0.06 * (bar - 11), trem=True, upto=14 if bar == 12 else 16)
        stab_bar(bar, 0.14, cutoff=2500 + 1500 * (bar - 11), pattern=[(p, 1) for p in range(0, 16, 2 if bar == 11 else 1)], upto=14 if bar == 12 else 16)
    else:
        groove(bar, upto=upto, ride_=True); bass_bar(bar, 0.32, upto=upto); pad_bar(bar, 0.24, cutoff=4000); bal_bar(bar, 0.42, upto=upto)
        stab_bar(bar, 0.18, upto=upto); bayan_bar(bar, 0.18, bright=1.2)
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1][:3]): choir.add(voice_choir(mtof(m - 12), ln * 0.95, 'a', a=0.2, r=0.6, seed=bar * 3 + j), t0, 0.14, pan=-0.3 + 0.3 * j)
# the tunes
for bar in range(4): play(bar, HOOK[bar], 0.5, lead_=0.3)
for bar in range(4, 8): play(bar, SECOND[bar], 0.5, lead_=0.36)
for bar in (8, 9, 10):
    for i, (p, ln, name) in enumerate(FLOOR[bar]): bay.add(bayan(mtof(nm(name)), ln * s16 * 0.95, 1.1, a=0.08, seed=700 + bar * 10 + i), T(bar, p), 0.36, pan=0.15)
for bar in (9, 10): peal(bar, 0.2)
play(11, [(0, 6, 'E6'), (6, 2, 'D6'), (8, 4, 'B5'), (12, 4, 'G5')], 0.46); play(12, [(0, 8, 'F#5'), (8, 6, 'A#5')], 0.48)
for bar in range(13, 16): play(bar, HOOK[bar - 13], 0.52, lead_=0.3, octave=1)
play(16, CADENCE, 0.52, lead_=0.3, octave=1)
# fills, crashes, the river on the canyon floor
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
roll(T(3, 12), T(3, 16), 4, 6, 0.06, 0.16); roll(T(7, 8), T(7, 16), 4, 8, 0.06, 0.2)
fx.add(crash(2.5, seed=3), S.t(8), 0.22, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.12); big_bell(S.t(8), 0.34, ring=0.9, seed=8)
rl, rr_ = canyon(3 * B + 1.0, 7, river=1.0), canyon(3 * B + 1.0, 8, river=1.0); ge = np.sin(np.pi * np.arange(len(rl)) / len(rl)) ** 1.5
fx.add((rl * ge, rr_ * ge), S.t(8) - 0.3, 0.26)
fx.add(riser_cut(2 * B - b / 2, f0=400, f1=10000, seed=7), S.t(11), 0.24); roll(S.t(12), T(12, 14), 4, 8, 0.1, 0.24)
fx.add(rev_crash(1.1, seed=9), S.t(13) - 1.1, 0.2)
gap(S.t(13), (pad, bal, perc, bass_b, drums, chords, bay))
fx.add(crash(2.6, seed=4), S.t(13), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(13), 0.15); big_bell(S.t(13), 0.4, ring=0.6, dur=4.0, seed=13)
chords.add(chord_stab(CH['Bm'][3] + [78], b * 1.5, 6000, r=0.4, seed=910), S.t(13), 0.28)
# the last bar into the landing: the roll, the balalaikas' tremolo, a riser, an eighth of air
roll(S.t(16, 2), T(16, 14), 4, 8, 0.1, 0.24); bal_bar(16, 0.3, trem=True, upto=14)
fx.add(riser_cut(B - b / 2, f0=600, f1=11000, seed=8), S.t(16), 0.22); fx.add(rev_crash(1.3, seed=10), LAND - 1.3, 0.24)
gap(LAND, (pad, bal, perc, bass_b, drums, chords, bay, choir))

# ================================================================ LANDING: bar 17 = 48.2 s, the race starts ======================
drums.add(KICK, LAND, 0.75); drums.add(CLP, LAND, 0.34); drums.add(SNR, LAND, 0.2)
big_bell(LAND, 0.6, ring=0.55, dur=2.6, seed=2)
fx.add(impact(2.5, seed=5), LAND, 0.32); fx.add(crash(3.0, seed=6), LAND, 0.34, pan=0.1)
L_, R_ = chord_stab(CH['BmL'][3], 2.0, 6500, r=0.4, seed=990); e_ = np.exp(-np.arange(len(L_)) / SR / 0.9); chords.add((L_ * e_, R_ * e_), LAND, 0.34)
for i in range(14): balalaika_strum(bal, LAND + i * s16 * 2 / 3, CH['BmL'][2], 0.5 * (1 - i / 16) * (1 if i % 2 == 0 else 0.8), up=i % 2 == 1, ring=0.25 if i < 13 else 1.4, pan=0.3, seed=1500 + i * 3)
for j, m in enumerate(CH['BmL'][1][:4]): bay.add(bayan(mtof(m), 1.3, 1.1, a=0.01, r=0.7, seed=880 + j), LAND, 0.24, pan=-0.4 + 0.27 * j)
for j, m in enumerate(CH['BmL'][1][:3]): choir.add(voice_choir(mtof(m - 12), 1.2, 'a', a=0.02, r=0.9, seed=890 + j), LAND, 0.2, pan=-0.3 + 0.3 * j)
domra(dom, LAND, nm('B5'), 1.2, 0.5, 0.1, seed=999)
lb = roll_bass(mtof(47), 2.3, 1.0, 0.5); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass_b.add(lb, LAND, 0.4)
bass_b.add(voice_sub(mtof(35), 1.6, a=0.004, r=0.7) * np.exp(-np.arange(int(2.3 * SR)) / SR / 0.8), LAND, 0.32)

# ================================================================ MIX =============================================================
def duck(times, depth, release): return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)   # (smoothed: no click)
bass_b.curve(duck(kicks, 0.5, 0.1)); pad.curve(duck(kicks, 0.5, 0.18)); chords.curve(duck(kicks, 0.55, 0.15)); bal.curve(duck(kicks, 0.2, 0.08))
bay.curve(duck(kicks, 0.2, 0.12)); choir.curve(duck(kicks, 0.25, 0.15))
fc = curve([(0, 2400), (S.t(-3), 3000), (S.t(-2), 1100), (S.t(-1, 2), 4500), (S.t(0) - 0.05, 12000), (S.t(0), 16000), (S.t(8), 16000),
            (S.t(8, 1), 2200), (S.t(11), 2400), (S.t(13) - 0.05, 14000), (S.len, 16000)], log=True)
for x in (pad, chords): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
fd = curve([(0, 2600), (S.t(-5), 2600), (S.t(-3), 5000), (S.t(0) - 0.05, 9000), (S.t(0), 18000), (S.len, 18000)], log=True)   # the preview: far, then near
dom.L = lp(dom.L, fd); dom.R = lp(dom.R, fd)
pad.filt(lambda x: hp1(x, 150)); chords.filt(lambda x: hp1(x, 220)); bal.filt(lambda x: hp1(x, 250)); dom.filt(lambda x: hp1(x, 240)); ld.filt(lambda x: hp1(x, 300))
bay.filt(lambda x: hp1(x, 140)); choir.filt(lambda x: hp1(x, 110)); bells.filt(lambda x: hp1(x, 60)); bass_b.filt(lambda x: hp1(x, 32)); perc.filt(lambda x: lp1(x, 13000))
pad.width(1.6); chords.width(1.4); dom.gain(1.5); drums.gain(0.85)
# sends: one huge, dark canyon reverb; a short room for the drums; a dotted-eighth echo on the domra and the lead
verb_in = S.bus()
for x, a in ((pad, 0.35), (chords, 0.15), (dom, 0.22), (ld, 0.25), (bal, 0.15), (bay, 0.3), (bells, 0.55), (choir, 0.5), (fx, 0.2), (perc, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.45, decay=4.2, damp=0.4, predelay=0.04); vl, vr = vl * 1.25, vr * 1.25
room_l, room_r = reverb(drums.L * 0.1, drums.R * 0.1, size=0.5, decay=0.7, damp=0.4)
dd = dom.send_delay(b * 0.75, 0.14, fb=0.32, damp=0.45); dl = ld.send_delay(b * 0.75, 0.16, fb=0.35, damp=0.45)
BUSES = [drums, perc, bass_b, pad, chords, dom, bal, bay, ld, bells, choir, fx, (vl, vr), (room_l, room_r), dd, dl]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in the intro and the main, before the master)
    for x in BUSES:
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x; nm_ = x.name if isinstance(x, Bus) else 'send'
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); print(f'{nm_:9s} {sec:5s} rms {20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/russia', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.5, lows_db=-1.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
