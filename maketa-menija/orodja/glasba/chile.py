"""Chile (Los Caracoles: Ruta 60 climbing the high Andes in 29 hairpins to Portillo and the Laguna del Inca at ~2,870 m; dry, bright,
thin air, snow peaks all round): Andean organic house.
A quena (the notched cane flute of the Andes: a breathy, reedy tone that leans into its long notes with a wide vibrato) sings the hook;
a charango (the small ten-string guitar of the highlands: five double courses, high and bright, strummed in quick rasgueos) drives the
huayno lilt (a long stroke and two short ones on every beat); zampoñas (pan pipes, played in hocket: two players, left and right,
share the tune note by note) answer and float over the lake; a bombo legueero (the deep leather drum, struck on its skin and on its
wooden hoop) and chajchas (a rattle of goat hooves) under a warm, deep house groove, a rolling bass and wide pads.
D minor with the highlands' turns to the relative major (Dm C F, the dominant A7 with its C#), 127.66 bpm: 15 bars from the drop to
the race's start.
The hook zig-zags like the road (up a fourth, down a step, up again: the switchbacks) on the huayno's long-short-short cell, then
lands on a long note the quena leans into; the answer climbs higher (Bbmaj7, Gm7) and falls through the A7's C# back home.
Original: the melodies, the chords' voicing, the rhythms and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  thin, bright wind; a pad opening slowly; one far quena call echoing off the valley walls
                                     (3 s); the charango tunes its courses (one note at a time, then slow strums); the zampoñas
                                     preview the hook at half speed; the bombo's heartbeat; the chajchas shiver; the build
                                     (Gm7, A7sus4 -> A7): the charango's strums double into tremolo, the bombo rolls, a riser,
                                     an eighth of air, the quena's pickup
    drop  (20.0 s)     bar 0         a full strum and the bombo on the downbeat, the groove and the hook
    A 0-3 (Dm C F C-A7), A' 4-7 (the bombo's pattern, the zampoñas' hocket, a higher answer over Bbmaj7 Gm7-A7), the lake 8-9 (no
    kick: Bbmaj7#11 and Gm9, the zampoñas in long notes, the charango's harmonics glinting like snow), the climb 10 (A7sus4 -> A7:
    the strum's tremolo, the bombo rolling), final 11-14 (everything: the hook doubled by the zampoñas an octave down, the charango
    an octave up), LANDING at bar 15 = 48.2 s: D minor (add 9): the bombo, a full strum, the quena's long D; it rings out
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 15                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 127.66 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SW = 0.12                                     # the percussion's odd sixteenths late (organic house's loose shuffle)
def T(bar, p=0.0, swing=0.0):                 # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (swing if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(23)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def quena(notes, breath=0.3, vib=0.32, rel=0.3, seed=0, slide=-0.7, fall=-0.6):
    """one breath of the quena: notes [(start s, dur s, midi, level)] played legato, each note tongued (a dip and a chiff of air on
    its attack), the pitch gliding a little between them; long notes swell and their vibrato (from the throat, wide) grows; the first
    note slides up into pitch and the phrase ends falling away. The tone: a strong fundamental, a reedy second and third harmonic
    (the notch's edge), breath in the bore"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for s0, d, m, v in notes:
        i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 18.0) + p0 + slide * np.exp(-t / 0.08)
    vb = vib * np.clip((age - 0.22) / (0.5 * ln + 0.05), 0, 1) ** 1.3 * (ln > 0.35)
    p = p + vb * np.sin(TAU * 5.6 * t + 0.6 * np.sin(TAU * 0.4 * t)) + fall * np.clip((t - t_end + 0.06) / (rel + 0.06), 0, 1) ** 2
    fr = mtof(p)
    tone = sine(fr, n) + 0.42 * sine(fr * 2, n, 0.2) + 0.2 * sine(fr * 3, n, 0.45) + 0.07 * sine(fr * 4, n, 0.7) + 0.03 * sine(fr * 5, n, 0.1)
    nz = noise(n, seed)
    air = hp(bp(nz, fr, 0.95) * 1.3 + bp(nz, fr * 2, 0.92) * 0.45, 400) + hp(nz, 5500) * 0.035
    tongue = 0.55 + 0.45 * np.clip(age / 0.03, 0, 1) ** 0.7
    chiff = bp(nz, 2600, 0.3) * np.exp(-age / 0.018) * lv
    swell = 0.82 + 0.25 * np.clip(age / np.maximum(ln, 0.1), 0, 1) ** 1.5
    env = np.clip(t / 0.04, 0, 1) * lp1(lv, 30.0) * tongue * swell * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    wn = lp1(noise(n, seed + 1), 6.0); wn /= np.std(wn) + 1e-9
    return ((tone * (1 - 0.25 * breath) + air * breath) * env * (1 + 0.05 * wn) + chiff * 0.5) * 0.33

def siku(f, dur, vel=1.0, seed=0, breath=0.55, r=0.14):
    """a zampoña (siku) pipe: a stopped cane tube, so odd harmonics (1, 3, 5), a lot of breath, a puff on the attack (the player's
    'tu'), the pitch rising a hair into the note, the breath never quite steady"""
    seed = abs(int(seed))
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = f * (1 - 0.012 * np.exp(-t / 0.04))
    nz = noise(n, seed)
    tone = sine(fr, n) + 0.3 * sine(fr * 3, n, 0.3) + 0.09 * sine(fr * 5, n, 0.6)
    air = bp(nz, f, 0.9) * 1.6 + bp(nz, f * 3, 0.85) * 0.35 + hp(nz, 4500) * 0.05
    puff = bp(nz, 1800, 0.25) * np.exp(-t / 0.025) * 0.7
    wob = 1 + 0.06 * np.sin(TAU * 4.3 * t + seed) * np.clip((t - 0.2) / 0.3, 0, 1)
    return ((tone * (1 - 0.3 * breath) + air * breath) * adsr(n, 0.035, 0.12, 0.85, r, gate=dur) * wob + puff * vel) * vel * 0.32

def ch_string(f, dur, vel=1.0, seed=0, t60=1.1, bright=0.78):
    """one charango course: two nylon/steel strings a hair apart (Karplus-Strong), the small bright body (a boxy middle, a sparkle)"""
    seed = abs(int(seed))
    d = lambda ff, tt: 10 ** (-3 / (ff * tt))
    x = pluck(f, dur, d(f, t60), bright * (0.75 + 0.25 * vel), seed, 0.1) + 0.7 * pluck(f * 1.0021, dur, d(f, t60 * 0.85), bright * 0.85, seed + 400, 0.16)
    x = hp1(x, 180) + bp(x, 520, 0.4) * 0.25 + bp(x, 2900, 0.45) * 0.45
    return x * 0.3 * vel

def strum(bus, t, tones, vel=1.0, up=False, ring=0.55, gap=0.009, pan=0.0, seed=0, bright=0.78):
    """a rasgueo stroke across the five courses: down (low to high) or up (high to low, lighter, the top courses first)"""
    order = tones[::-1] if up else tones; k = len(order)
    for i, m in enumerate(order):
        v = vel * (0.75 if up and i > 2 else 1.0) * hum(0.06)
        bus.add(ch_string(mtof(m), ring, v, seed=seed + i, bright=bright), t + i * gap * (0.7 if up else 1.0), 1.0, pan + 0.35 * (i / (k - 1) - 0.5))

def bombo(vel=1.0, dur=0.9, seed=0, f=68):
    """the bombo legueero's skin struck with a soft beater: the head's modes falling after the hit, the boom of the wooden shell,
    the leather's slap (what a phone hears)"""
    seed = abs(int(seed))
    n = int(dur * SR); t = np.arange(n) / SR; pf = f * (1 + 0.35 * np.exp(-t / 0.025))
    x = 0.7 * sine(pf, n) * np.exp(-t / 0.32) + 0.35 * sine(pf * 1.52, n, 0.3) * np.exp(-t / 0.15) + 0.2 * sine(pf * 2.3, n, 0.6) * np.exp(-t / 0.07)
    x = x + lp(noise(n, seed), 450, 0.2) * np.exp(-t / 0.05) * 0.6 + bp(noise(n, seed + 1), 850, 0.45) * np.exp(-t / 0.03) * 0.8
    return np.tanh(x * (1.1 + 0.7 * vel)) * vel * np.clip(t / 0.0012, 0, 1)
def aro(vel=1.0, seed=0):
    """the stick on the bombo's wooden hoop: a dry click with a hollow knock"""
    seed = abs(int(seed))
    n = int(0.09 * SR); t = np.arange(n) / SR
    return (bp(noise(n, seed), 2300, 0.55) * 1.2 + 0.5 * sine(1250, n) + 0.3 * sine(740, n)) * np.exp(-t / 0.011) * np.clip(t / 0.0004, 0, 1) * vel

def chajchas(dur, density=900, seed=0, shape=None):
    """the chajchas: a bundle of dried goat hooves shaken: many tiny hard clicks (a sparse random impulse train through the hooves'
    resonances), dense while it is shaken, thinning out"""
    seed = abs(int(seed))
    n = int(dur * SR); r = np.random.default_rng(seed); t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7 if shape is None else shape
    imp = (r.random(n) < density / SR * env) * r.uniform(0.2, 1.0, n)
    y = bp(imp, 3400, 0.6) * 1.2 + bp(imp, 5600, 0.55) * 0.9 + bp(imp, 1500, 0.5) * 0.4
    return y * 0.9

def deep_bass(f, dur, bright=1.0, vel=1.0):
    """the house bass: a round sine for weight, a soft saw through a plucky filter for the harmonics a phone plays"""
    n = int((dur + 0.06) * SR); t = np.arange(n) / SR
    m = sat(lp(saw(f, n) * 0.6 + pulse(f * 2, n, 0.4) * 0.15, 220 + 1300 * bright * np.exp(-t / 0.08), 0.22), 1.8)
    return (sine(f, n) * 0.8 + hp1(m, 120) * 0.7) * adsr(n, 0.004, 0.16, 0.78, 0.05, gate=dur) * vel

def wind(dur, seed=0, fc0=1400):
    """thin, dry air high up: bright noise through a slowly wandering band, in gusts"""
    n = int(dur * SR); t = np.arange(n) / SR
    fc = fc0 * 2 ** (1.0 * np.sin(TAU * 0.06 * t + seed) + 0.45 * np.sin(TAU * 0.17 * t + 2 * seed))
    return (bp(noise(n, seed), fc, 0.8) + hp(noise(n, seed + 9), 6000) * 0.05) * (0.5 + 0.5 * np.sin(TAU * 0.075 * t + seed) ** 2)

def harmonic(f, dur=2.2, seed=0):   # a charango harmonic: the string touched at its middle, a pure glassy tone (snow in the sun)
    seed = abs(int(seed))
    n = int(dur * SR); t = np.arange(n) / SR
    x = sine(f, n) + 0.12 * sine(f * 2, n, 0.3) + 0.04 * sine(f * 3.01, n, 0.6)
    return (x * np.exp(-t / 0.9) + hp(noise(n, seed), 4000) * np.exp(-t / 0.002) * 0.15) * np.clip(t / 0.001, 0, 1) * 0.3

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  pad voicing (midi)              the charango's five courses (a stroke across them)
CH = {'Dm':       (38, [57, 62, 65, 69], [62, 65, 69, 74, 77]),
      'Dm9':      (38, [57, 60, 64, 65], [62, 65, 69, 72, 76]),
      'C':        (36, [55, 60, 64, 67], [60, 64, 67, 72, 76]),
      'F':        (41, [57, 60, 65, 69], [60, 65, 69, 72, 77]),
      'A7sus4':   (45, [55, 62, 64, 69], [62, 64, 67, 69, 74]),
      'A7':       (45, [55, 61, 64, 69], [61, 64, 67, 69, 73]),
      'Bbmaj7':   (46, [57, 62, 65, 69], [62, 65, 69, 70, 74]),
      'Bbmaj7#11':(46, [57, 62, 64, 69], [62, 64, 69, 70, 76]),
      'Gm7':      (43, [58, 62, 65, 70], [62, 65, 67, 70, 74]),
      'Gm9':      (43, [57, 58, 62, 65], [62, 65, 67, 69, 74]),
      'Dadd9':    (38, [57, 62, 64, 65, 69], [62, 65, 69, 74, 76])}   # the landing: D minor with the 9th
A_ = {0: 'Dm', 1: 'C', 2: 'F', 3: [(0, 'C'), (2, 'A7')]}
HARM = {-10: 'Dm9', -9: 'Dm9', -8: 'Bbmaj7#11', -7: 'Bbmaj7#11', -6: 'Dm', -5: 'C', -4: 'F', -3: [(0, 'C'), (2, 'A7')],
        -2: 'Gm7', -1: [(0, 'A7sus4'), (2, 'A7')],
        4: 'Dm', 5: 'C', 6: 'Bbmaj7', 7: [(0, 'Gm7'), (2, 'A7')],
        8: 'Bbmaj7#11', 9: 'Gm9', 10: [(0, 'A7sus4'), (2, 'A7')], 15: 'Dadd9'}
for k in range(4): HARM[k] = HARM[k + 11] = A_[k]
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
HOOK = {0: [(0, 2, 'A5'), (2, 1, 'D6'), (3, 1, 'C6'), (4, 2, 'A5'), (6, 2, 'D6'), (8, 3, 'F6'), (11, 1, 'E6'), (12, 4, 'D6')],    # the zig-zag
        1: [(0, 2, 'C6'), (2, 1, 'E6'), (3, 1, 'D6'), (4, 2, 'C6'), (6, 2, 'G5'), (8, 2, 'A5'), (10, 2, 'C6'), (12, 4, 'G5')],
        2: [(0, 2, 'A5'), (2, 1, 'C6'), (3, 1, 'F6'), (4, 2, 'E6'), (6, 2, 'D6'), (8, 3, 'C6'), (11, 1, 'A5'), (12, 4, 'C6')],
        3: [(0, 2, 'D6'), (2, 1, 'C6'), (3, 1, 'A5'), (4, 2, 'G5'), (6, 2, 'A5'), (8, 2, 'C#6'), (10, 2, 'E6'), (12, 4, 'A5')]}  # through the C#
ANSWER = {6: [(0, 2, 'D6'), (2, 1, 'F6'), (3, 1, 'E6'), (4, 2, 'D6'), (6, 2, 'A5'), (8, 3, 'F6'), (11, 1, 'G6'), (12, 4, 'A6')],  # higher
          7: [(0, 2, 'G6'), (2, 1, 'F6'), (3, 1, 'D6'), (4, 4, 'Bb5'), (8, 2, 'C#6'), (10, 1, 'E6'), (11, 1, 'C#6'), (12, 4, 'A5')]}
CADENCE = [(0, 2, 'D6'), (2, 1, 'C6'), (3, 1, 'A5'), (4, 2, 'G5'), (6, 2, 'A5'), (8, 2, 'C#6'), (10, 2, 'E6'), (12, 2, 'G6'), (14, 2, 'E6')]
LAKE = {8: [(0, 4, 'F5'), (4, 4, 'A5'), (8, 6, 'E6'), (14, 2, 'D6')],                                                          # the zampoñas
        9: [(0, 4, 'D6'), (4, 2, 'Bb5'), (6, 2, 'A5'), (8, 8, 'G5')]}

drums, perc, bomb, bass_b, pad, char, quen, zamp, glint, fx = (S.bus(x) for x in 'drums perc bombo bass pad charango quena zampona glint fx'.split())
kicks = []

def blow(bar, notes, gain, pan=0.08, **kw):   # a quena phrase: [(sixteenth from the bar, length, note, level)]
    t0 = T(bar, notes[0][0]); quen.add(quena([(T(bar, p) - t0, ln * s16, nm(nmn), lv) for p, ln, nmn, lv in notes], **kw), t0, gain, pan)
def line(phrases, cut_last=1):   # bars of a tune as one breath: (sixteenth from the first bar, length, note, level)
    out = [(16 * k + p, ln, name, 0.85 + 0.15 * (ln >= 3)) for k, ph in enumerate(phrases) for p, ln, name in ph]
    if cut_last: out[-1] = out[-1][:1] + (out[-1][1] - cut_last,) + out[-1][2:]
    return out

def hocket(bar, phrase, gain, octave=0, dur_k=0.9, spread=0.55, seed0=0):
    """the zampoñas share the tune: one player (ira, left) takes a note, the other (arca, right) the next"""
    for i, (p, ln, name) in enumerate(phrase):
        zamp.add(siku(mtof(nm(name) + 12 * octave), ln * s16 * dur_k, hum(0.06), seed=seed0 + (bar + 20) * 31 + i), T(bar, p), gain, pan=-spread if i % 2 == 0 else spread)

HUAYNO = [(0, 'D', 1.0), (2, 'D', 0.55), (3, 'U', 0.5)]   # each beat: a long down-stroke, then two short ones (down, up)
def charango_bar(bar, gain, upto=16, frm=0, octave=0, ring=0.5, trem=False):
    """the charango: the huayno lilt on every beat (trem: a tremolo of sixteenths, all strokes, accents on the beats)"""
    for b0, b1, c in chords_in(bar):
        tones = [m + 12 * octave for m in CH[c][2]]
        for k in range(b0, b1):
            pat = [(s, 'D' if s % 2 == 0 else 'U', 1.0 if s == 0 else 0.6) for s in range(4)] if trem else HUAYNO
            for s, d, v in pat:
                p = 4 * k + s
                if frm <= p < upto:
                    strum(char, T(bar, p, SW * 0.5), tones, vel=gain * v, up=d == 'U', ring=ring if s == 0 else ring * 0.6, pan=0.2 if octave == 0 else -0.2,
                          seed=(bar + 20) * 97 + p * 7 + 3 * octave)

def pad_bar(bar, gain, cutoff=2600, a=0.08, r=0.6):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(CH[c][1]):
            pad.add(voice_pad(mtof(m), (b1 - b0) * b, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), S.t(bar, b0), gain, pan=[-0.7, -0.25, 0.25, 0.7, 0.0][j])

ROLLB = [(0, 2, 0), (3, 1, 0), (6, 2, 12), (8, 2, 0), (11, 1, 0), (14, 2, 7)]      # the rolling bass: root, octave, fifth
def bass_bar(bar, gain, pat=ROLLB, bright=1.0, upto=16):
    for b0, b1, c in chords_in(bar):
        R = CH[c][0]
        for p, ln, iv in pat:
            if b0 * 4 <= p < min(b1 * 4, upto): bass_b.add(deep_bass(mtof(R + iv), ln * s16 * 0.92, bright, hum(0.04)), T(bar, p), gain)

BOMBO = [(0, 's', 1.0), (3, 'a', 0.6), (6, 's', 0.7), (8, 'a', 0.75), (10, 's', 0.8), (11, 'a', 0.45), (14, 'a', 0.65)]   # skin (s), hoop (a)
def bombo_bar(bar, gain, upto=16):
    for p, k, v in BOMBO:
        if p < upto:
            if k == 's': bomb.add(bombo(v * hum(0.05), seed=(bar + 20) * 16 + p), T(bar, p), gain, pan=-0.15)
            else: bomb.add(aro(v * hum(0.08), seed=(bar + 20) * 16 + p), T(bar, p, SW), gain * 0.55, pan=-0.3)

# drum sounds, made once
KICK = kick(dur=0.32, f0=165, f1=50, sweep=0.04, click=0.5, drive=1.6); KICK[-1500:] *= np.linspace(1, 0, 1500) ** 2
CLP = clap(seed=3); RIM = rim(seed=5)
HC = [hat(0.045, seed=s, tone=8000) for s in range(4)]; HO = [hat(open_=True, seed=s + 10, tone=7500) * 0.7 for s in range(2)]
SHK = [shaker(0.08, seed=s) for s in range(4)]
def K(t, g=0.56, lpf=None): drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
def groove(bar, g=1.0, kick_=True, clap_=True, ohat=True, upto=16):
    for k in range(4):
        if kick_ and 4 * k < upto: K(S.t(bar, k), 0.56 * g)
        if clap_ and k in (1, 3) and 4 * k < upto: drums.add(CLP, S.t(bar, k), 0.3 * g * hum(), pan=0.05)
        if ohat and 4 * k + 2 < upto: perc.add(HO[k % 2], T(bar, 4 * k + 2, SW), 0.22 * g * hum(), pan=0.3)
    for p in range(upto):
        perc.add(SHK[p % 4], T(bar, p, SW), g * 0.12 * (0.6, 0.35, 0.9, 0.45)[p % 4] * hum(0.15), pan=-0.45)
        if p % 4 in (1, 3): perc.add(HC[p % 4], T(bar, p, SW), g * 0.09 * hum(0.15), pan=0.45)
    for p in ((7,) if bar % 2 == 0 else (10, 15)):
        if p < upto: drums.add(RIM, T(bar, p, SW), 0.07 * g, pan=-0.2)

def roll(t0, t1, n0, n1, g0, g1, kind='bombo'):   # a roll from t0 to t1, n0 -> n1 hits per beat, swelling
    t = t0; i = 0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); g = g0 + (g1 - g0) * x ** 1.4
        if kind == 'bombo': bomb.add(bombo(0.5 + 0.5 * x, 0.5, seed=i) if i % 2 == 0 else aro(0.8, seed=i), t, g * (1 if i % 2 == 0 else 0.5), pan=-0.15)
        else: drums.add(snare(0.15, tone=210 + 60 * x, seed=i % 97), t, g, pan=0.05)
        t += b / (n0 + (n1 - n0) * x); i += 1

def gap(t1, buses):   # an eighth of air before the hit at t1: these buses fade out (15 ms) at t1 - b/2 and come back at t1
    x = np.arange(S.n) / SR; g = np.clip(1 - (x - (t1 - b / 2)) / 0.015, 0, 1) + np.clip((x - t1 + 0.004) / 0.004, 0, 1)
    for bus in buses: bus.curve(np.minimum(g, 1.0))

# ================================================================ INTRO: the globe (bars -10..-1) ================================
I0 = S.t(-10)                                                    # 1.2 s
d_ = S.t(0) - I0 + 1.0; wl, wr = wind(d_, 1), wind(d_, 2); x = np.linspace(0, 1, len(wl))
wg = np.clip(x / 0.1, 0, 1) * (0.6 + 0.4 * x) * np.clip((S.t(0) + 0.3 - I0 - np.arange(len(wl)) / SR) / 3.0, 0, 1)
fx.add((wl * wg, wr * wg), I0 - 0.4, 0.34)
for t0, ln, c in spans(-10, -2):                                 # the pad: slow swells, opening as the globe turns
    x = (t0 - I0) / (S.t(-2) - I0)
    for j, m in enumerate(CH[c][1]):
        pad.add(voice_pad(mtof(m), ln, cutoff=700 + 2000 * x, a=1.8 if x < 0.1 else 0.6, r=1.0, voices=5, seed=m + j), t0, 0.16 + 0.24 * x, pan=[-0.7, -0.25, 0.25, 0.7][j])
for t0, ln, c in spans(-10, -6): bass_b.add(voice_sub(mtof(CH[c][0]), ln - 0.1, a=1.2, r=0.8), t0, 0.035)
# one far quena call, echoing off the valley walls (its own long echo, in the MIX)
far = S.bus('far')
t0 = T(-10, 8); far.add(quena([(0, 0.3, nm('A5'), 0.8), (0.3, 1.1, nm('D6'), 1.0), (1.4, 0.3, nm('C6'), 0.85), (1.7, 1.4, nm('A5'), 0.9)], seed=3, fall=-1.0, rel=0.4), t0, 0.32, 0.2)
t0 = T(-8, 6); far.add(quena([(0, 0.25, nm('C6'), 0.8), (0.25, 0.25, nm('D6'), 0.85), (0.5, 1.3, nm('F6'), 1.0), (1.8, 1.4, nm('E6'), 0.9)], seed=4, fall=-1.2, rel=0.45), t0, 0.26, -0.25)
# the charango tunes its courses, then slow strums (down only), then the lilt, softly
for i, m in enumerate([62, 65, 69, 74, 77]): char.add(ch_string(mtof(m), 2.2, 0.6, seed=200 + i, t60=2.0), T(-9, 4 + 2 * i), 0.5, pan=-0.3 + 0.15 * i)
for bar in (-8, -7):
    for k in (0, 2): strum(char, S.t(bar, k), CH[HARM[bar]][2], 0.5 + 0.1 * k, ring=1.6, gap=0.022, seed=bar * 13 + k)
for bar in (-6, -5, -4, -3): charango_bar(bar, 0.38 + 0.04 * (bar + 6), ring=0.45)
# the zampoñas preview the hook at half speed (the first cell, then the answer's fall)
for i, (p, ln, name) in enumerate([(0, 4, 'A5'), (4, 2, 'D6'), (6, 2, 'C6'), (8, 4, 'A5'), (12, 4, 'D6'), (16, 6, 'F6'), (22, 2, 'E6'), (24, 8, 'D6')]):
    zamp.add(siku(mtof(nm(name)), ln * s16 * 0.92, 0.9, seed=300 + i), T(-6, p), 0.32, pan=-0.5 if i % 2 == 0 else 0.5)
for i, (p, ln, name) in enumerate([(0, 4, 'C6'), (4, 2, 'E6'), (6, 2, 'D6'), (8, 4, 'C6'), (12, 4, 'G5'), (16, 4, 'A5'), (20, 4, 'C#6'), (24, 8, 'A5')]):
    zamp.add(siku(mtof(nm(name)), ln * s16 * 0.92, 0.95, seed=320 + i), T(-4, p), 0.36, pan=-0.5 if i % 2 == 0 else 0.5)
# the bombo's heartbeat, the bass, the chajchas
for bar in (-6, -5, -4, -3):
    for p, v in ((0, 0.8), (6, 0.5), (10, 0.6)): bomb.add(bombo(v, seed=bar * 7 + p), T(bar, p), 0.22 + 0.03 * (bar + 6), pan=-0.15)
    if bar >= -4:
        for b0, b1, c in chords_in(bar): bass_b.add(deep_bass(mtof(CH[c][0]), (b1 - b0) * b * 0.95, 0.25, 0.7), S.t(bar, b0), 0.16)
        for p in range(0, 16, 2): perc.add(SHK[p % 4], T(bar, p, SW), 0.07, pan=-0.45)
for k in range(4): K(S.t(-3, k), 0.22, lpf=300)
perc.add(chajchas(1.4, 700, seed=2), T(-5, 8), 0.3, pan=0.4)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
for bar in (-2, -1):
    for k in range(4 if bar == -2 else 3): K(S.t(bar, k), 0.3 + 0.03 * k)
    for p in range(1, 16, 2): perc.add(HC[p % 4], T(bar, p, SW), 0.05 + 0.004 * p + (0.03 if bar == -1 else 0), pan=0.45)
    pad_bar(bar, 0.26, cutoff=1500 if bar == -2 else 2600, a=0.2)
charango_bar(-2, 0.4, ring=0.45); charango_bar(-1, 0.42, ring=0.3, trem=True, upto=14)
bass_bar(-2, 0.2, bright=0.5)
for p in range(0, 14, 2): bass_b.add(deep_bass(mtof(45), s16 * 1.7, 0.3 + 0.05 * p, 0.8), T(-1, p), 0.15 + 0.005 * p)   # an A pedal in eighths
roll(S.t(-2, 2), S.t(-1), 2, 3, 0.12, 0.2); roll(S.t(-1), T(-1, 14), 3, 8, 0.2, 0.36)
perc.add(chajchas(2 * B - b / 2, 1600, seed=5, shape=np.linspace(0.1, 1, int((2 * B - b / 2) * SR)) ** 1.5), S.t(-2), 0.32, pan=0.4)
fx.add(riser_cut(2 * B - b / 2, f0=400, f1=10000, seed=3), S.t(-2), 0.22)
fx.add(rev_crash(1.2, seed=5), S.t(0) - 1.2, 0.22)
blow(-1, [(12, 2, 'E5', 0.8), (14, 2, 'G5', 0.9)], 0.42, rel=0.04, fall=0.0)    # the quena's pickup into the hook (in the air)
gap(S.t(0), (pad, char, perc, bass_b, drums, bomb))

# ================================================================ MAIN: the climb (bars 0..14) ===================================
fx.add(impact(2.5), S.t(0), 0.26); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
bomb.add(bombo(1.0, 1.2, seed=1, f=62), S.t(0), 0.55, pan=-0.1)
strum(char, S.t(0), CH['Dm'][2], 0.9, ring=1.2, gap=0.012, seed=900)
for bar in range(15):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'lake' if bar < 10 else 'climb' if bar < 11 else 'final'
    upto = 14 if bar == 14 else 16
    if sec in ('A', 'A2'):
        groove(bar); bass_bar(bar, 0.34); pad_bar(bar, 0.3, cutoff=3400)
        charango_bar(bar, 0.5 if sec == 'A' else 0.52)
        if sec == 'A2': bombo_bar(bar, 0.36)
    elif sec == 'lake':
        for p in range(0, 16, 2): perc.add(SHK[p % 4], T(bar, p, SW), 0.06, pan=-0.45)
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1]): pad.add(voice_pad(mtof(m), ln, cutoff=1800, a=0.5, r=1.0, seed=m + 9), t0, 0.32, pan=[-0.7, -0.25, 0.25, 0.7][j])
            bass_b.add(deep_bass(mtof(CH[c][0]), ln * 0.95, 0.3, 0.8), t0, 0.2)
        for k in (0, 2): strum(char, S.t(bar, k), CH[HARM[bar]][2], 0.36, ring=1.8, gap=0.03, seed=bar * 17 + k)
        for p, m in ((3, 81), (7, 76), (11, 86), (14, 81)) if bar == 8 else ((3, 79), (7, 74), (10, 86), (13, 81)):   # harmonics, glinting
            glint.add(harmonic(mtof(m), 2.0, seed=bar * 16 + p), T(bar, p), 0.3, pan=0.6 if p % 2 else -0.6)
        bomb.add(bombo(0.5, seed=bar), S.t(bar), 0.2, pan=-0.15)
    elif sec == 'climb':
        for k in range(4): K(S.t(bar, k), 0.5)
        drums.add(CLP, S.t(bar, 1), 0.26); drums.add(CLP, S.t(bar, 3), 0.3)
        for p in range(1, 14, 2): perc.add(HC[p % 4], T(bar, p, SW), 0.09, pan=0.45)
        pad_bar(bar, 0.28, cutoff=2200, a=0.2)
        charango_bar(bar, 0.55, ring=0.35, trem=True, upto=14)
        for p in range(0, 14, 2): bass_b.add(deep_bass(mtof(45), s16 * 1.7, 0.4 + 0.05 * p, 0.85), T(bar, p), 0.26 + 0.006 * p)
        roll(S.t(bar), T(bar, 14), 2, 8, 0.25, 0.5)
        perc.add(chajchas(B - b / 2, 1600, seed=8, shape=np.linspace(0.2, 1, int((B - b / 2) * SR)) ** 1.5), S.t(bar), 0.4, pan=0.4)
    else:
        groove(bar, upto=upto); bass_bar(bar, 0.34, upto=upto); pad_bar(bar, 0.3, cutoff=4200)
        charango_bar(bar, 0.5, upto=upto); charango_bar(bar, 0.3, octave=1, upto=upto, ring=0.4)
        bombo_bar(bar, 0.38, upto=upto)
        perc.add(ride(0.7, seed=bar), S.t(bar), 0.14, pan=0.35)
# the tunes: the quena in one breath per two bars; the zampoñas join in the second half and in the final
blow(0, line([HOOK[0], HOOK[1]]), 0.5, seed=10)
blow(2, line([HOOK[2], HOOK[3]]), 0.5, seed=11)
blow(4, line([HOOK[0], HOOK[1]]), 0.5, seed=12)
blow(6, line([ANSWER[6], ANSWER[7]]), 0.52, seed=13)
for bar in (4, 5): hocket(bar, HOOK[bar - 4], 0.14, octave=-1, seed0=50)
for bar in (6, 7): hocket(bar, ANSWER[bar], 0.2, octave=-1, seed0=60)
for bar in (8, 9): hocket(bar, LAKE[bar], 0.4, dur_k=0.97, spread=0.6, seed0=70)
blow(9, [(12, 2, 'E6', 0.8), (14, 2, 'G6', 0.85), (16, 4, 'A6', 1.0), (20, 2, 'G6', 0.8), (22, 2, 'E6', 0.8), (24, 6, 'C#6', 0.9)], 0.34, seed=14, fall=-0.3)
blow(11, line([HOOK[0], HOOK[1]]), 0.52, seed=15)
blow(13, line([HOOK[2], CADENCE], cut_last=0) + [(32, 14, 'D6', 1.0)], 0.52, seed=16, rel=0.6, fall=-0.4)
for bar in range(11, 15): hocket(bar, HOOK[bar - 11] if bar < 14 else CADENCE, 0.22, octave=-1, seed0=80)
# fills, crashes
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
for p, f, g in ((12, 74, 0.5), (13, 70, 0.45), (14, 66, 0.6), (15, 62, 0.7)): bomb.add(bombo(0.9, 0.6, seed=p, f=f), T(3, p), g * 0.6, pan=0.2 - 0.1 * (p - 12))
for p, f, g in ((8, 74, 0.5), (10, 70, 0.5), (12, 66, 0.6), (13, 66, 0.5), (14, 62, 0.7), (15, 62, 0.6)): bomb.add(bombo(0.9, 0.6, seed=p + 20, f=f), T(7, p), g * 0.6, pan=0.2 - 0.06 * (p - 8))
fx.add(crash(2.5, seed=3), S.t(8), 0.2, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.1)
gl_, gr_ = wind(2 * B + 1.0, 7, 1800), wind(2 * B + 1.0, 8, 1800); ge = np.sin(np.pi * np.arange(len(gl_)) / len(gl_)) ** 2
fx.add((gl_ * ge, gr_ * ge), S.t(8) - 0.3, 0.2)
fx.add(riser_cut(B - b / 2, f0=500, f1=10000, seed=7), S.t(10), 0.26); fx.add(rev_crash(1.0, seed=9), S.t(11) - 1.0, 0.2)
gap(S.t(11), (pad, char, perc, bass_b, drums, bomb))
fx.add(crash(2.6, seed=4), S.t(11), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(11), 0.16)
bomb.add(bombo(1.0, 1.2, seed=2, f=62), S.t(11), 0.5, pan=-0.1); strum(char, S.t(11), CH['Dm'][2], 0.85, ring=1.0, gap=0.012, seed=910)
# the last bar leads into the landing: the bombo tumbling, the strums' tremolo, a riser, an eighth of air
for p, f, g in ((8, 76, 0.5), (10, 72, 0.55), (11, 70, 0.5), (12, 66, 0.65), (13, 64, 0.6)): bomb.add(bombo(0.9, 0.6, seed=p + 40, f=f), T(14, p), g * 0.6, pan=0.25 - 0.08 * (p - 8))
fx.add(riser_cut(B - b / 2, f0=600, f1=11000, seed=8), S.t(14), 0.22); fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.24)
perc.add(chajchas(B - b / 2, 1400, seed=9, shape=np.linspace(0.2, 1, int((B - b / 2) * SR)) ** 1.5), S.t(14), 0.36, pan=0.4)
gap(LAND, (pad, char, perc, bass_b, drums, bomb, zamp))

# ================================================================ LANDING: bar 15 = 48.2 s, the race starts ======================
drums.add(KICK, LAND, 0.7); drums.add(CLP, LAND, 0.35)
bomb.add(bombo(1.0, 1.6, seed=3, f=58), LAND, 0.6, pan=-0.1)
fx.add(impact(2.5, seed=5), LAND, 0.32); fx.add(crash(3.0, seed=6), LAND, 0.34, pan=0.1)
strum(char, LAND, CH['Dadd9'][2], 1.0, ring=2.4, gap=0.014, seed=920); strum(char, LAND + 0.004, [m + 12 for m in CH['Dadd9'][2][:3]], 0.6, ring=2.2, gap=0.012, seed=930)
for j, m in enumerate(CH['Dadd9'][1]):
    pad.add(voice_pad(mtof(m), 1.0, cutoff=4200, a=0.01, r=1.3, seed=m), LAND, 0.24, pan=[-0.7, -0.35, 0, 0.35, 0.7][j])
for i, (m, pn) in enumerate(((nm('A5'), -0.55), (nm('D5'), 0.55))): zamp.add(siku(mtof(m), 1.4, 1.0, seed=990 + i, r=0.6), LAND, 0.3, pan=pn)
lb = deep_bass(mtof(38), 2.3, 0.7); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass_b.add(lb, LAND, 0.45)

# ================================================================ MIX =============================================================
def duck(times, depth, release): return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)   # (smoothed: no click)
bass_b.curve(duck(kicks, 0.6, 0.14)); pad.curve(duck(kicks, 0.45, 0.18)); char.curve(duck(kicks, 0.2, 0.1)); zamp.curve(duck(kicks, 0.15, 0.1))
fc = curve([(0, 2600), (S.t(-3), 3200), (S.t(-2), 1100), (S.t(-1, 2), 4500), (S.t(0) - 0.05, 12000), (S.t(0), 16000), (S.t(8), 16000),
            (S.t(8, 1), 2400), (S.t(10), 3000), (S.t(11) - 0.05, 14000), (S.len, 16000)], log=True)
for x in (pad, char): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 150)); char.filt(lambda x: hp1(x, 220)); quen.filt(lambda x: hp1(x, 250)); zamp.filt(lambda x: hp1(x, 200))
glint.filt(lambda x: hp1(x, 500)); bass_b.filt(lambda x: hp1(x, 32)); perc.filt(lambda x: lp1(x, 13000)); bomb.filt(lambda x: hp1(x, 40))
pad.width(1.6); char.width(1.2)
quen.gain(1.3); char.gain(1.3); zamp.gain(1.2); perc.gain(1.5); glint.gain(1.2)   # (the highland colours forward; the low end stays)
# sends: one long, bright mountain reverb; a short room for the drums and the bombo; a dotted-eighth echo on the quena; the far
# calls through a long echo (the valley walls answering)
verb_in = S.bus()
for x, a in ((pad, 0.35), (char, 0.2), (quen, 0.28), (zamp, 0.4), (glint, 0.6), (bomb, 0.18), (fx, 0.2), (perc, 0.05), (far, 0.7)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=3.4, damp=0.18, predelay=0.03); vl, vr = vl * 1.3, vr * 1.3
room_l, room_r = reverb(drums.L * 0.1 + bomb.L * 0.2, drums.R * 0.1 + bomb.R * 0.2, size=0.5, decay=0.8, damp=0.4)
dq = quen.send_delay(b * 0.75, 0.14, fb=0.3, damp=0.4)
ef = far.send_delay(0.43, 0.6, fb=0.55, damp=0.55)
BUSES = [drums, perc, bomb, bass_b, pad, char, quen, zamp, glint, fx, far, (vl, vr), (room_l, room_r), dq, ef]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in the intro and the main, before the master)
    for x in BUSES:
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x; nm_ = x.name if isinstance(x, Bus) else 'send'
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); print(f'{nm_:9s} {sec:5s} rms {20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/chile', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=2.0, lows_db=-1.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
