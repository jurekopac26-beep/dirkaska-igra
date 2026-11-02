"""Brazil (Serra do Rio do Rastro, Santa Catarina: hairpins up a cliff of Atlantic forest in the mist; the same music serves Rio de
Janeiro): samba house. The bateria of a samba school (surdos answering each other on the beats, the tamborim's crisp syncopations, the
caixa's rolls, the ganzá's sixteenths, the agogô's two bells, the cuíca's squeaky sweeps, the apito whistle calling the band in) over a
four-on-the-floor house kick and a bouncing bass; a cavaquinho (the small four-string steel guitar of samba) strumming syncopated
chords with muted chucks and picking the hook in quick, anticipated notes; a nylon-string violão and an electric piano for the bossa
colours; a horn section doubling the hook in the final; a soft flute in the breath.
C major with samba's circle and bossa's colours (C6/9 A7(b13) Dm9 G13-G7(b9), the borrowed Fm6), 119.15 bpm: 14 bars from the drop
to the race's start.
The hook: short phrases that land a sixteenth ahead of the beat (samba's anticipation), climbing through each chord's colour (the
A7's flat thirteenth, the Dm9's ninth) and slipping chromatically down the G7(b9) into the tonic.
Original: the melodies, the chords' voicing, the rhythms and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -9..-1  warm air, birds in the forest, a far surf; a pad and the violão's slow bossa; the flute sings
                                    the hook at half speed; the electric piano; the bateria assembles (the ganzá, the surdo's
                                    heartbeat, the tamborim far off, a cuíca call); the build (Dm9, G13 -> G7b9): the apito calls,
                                    the caixa rolls, the surdos double, a riser, an eighth of air, the cavaquinho's pickup
    drop  (20.0 s)     bar 0        the horns' chord, the surdo, the groove and the hook
    A 0-3 (the hook), A' 4-7 (Fmaj7 Fm6 Em7-A7 Dm7-G7: the agogô, the electric piano, the horns' stabs, the cuíca between the
    phrases, a new answer), breath 8 (bossa: no kick, the violão, the flute), the call 9 (D9 -> G7b9: the apito, the repique's
    roll, the surdos), final 10-13 (everything: the horns double the hook), LANDING at bar 14 = 48.2 s: C6/9, the surdo, the
    horns, a full strum, the crash; it rings out through the tail
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 14                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 119.15 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
SW = 0.07                                     # samba's sixteenths: the second and fourth of each beat a little late
def T(bar, p=0.0, swing=SW):                  # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (swing if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(31)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def cav_string(f, dur, vel=1.0, seed=0, t60=0.9, bright=0.85, mute=False):
    """a cavaquinho string: steel, short, bright (Karplus-Strong), the small body's nasal middle; mute: the strumming hand's chuck
    (the strings damped at once: a short scratch with a ghost of pitch)"""
    seed = abs(int(seed))
    if mute:
        n = int(0.06 * SR); t = np.arange(n) / SR
        return (bp(noise(n, seed), 2400, 0.4) * 0.6 + pluck(f, 0.06, 0.95, 0.6, seed, 0.12)[:n] * 0.5) * np.exp(-t / 0.012) * vel * 0.3
    x = pluck(f, dur, 10 ** (-3 / (f * t60)), bright * (0.7 + 0.3 * vel), seed, 0.12)
    x = hp1(x, 220) + bp(x, 800, 0.4) * 0.3 + bp(x, 3300, 0.45) * 0.4
    return x * 0.36 * vel

def strum(bus, t, tones, vel=1.0, up=False, ring=0.4, gap=0.007, pan=0.0, seed=0, mute=False):
    order = tones[::-1] if up else tones; k = len(order)
    for i, m in enumerate(order):
        bus.add(cav_string(mtof(m), ring, vel * (0.8 if up else 1.0) * hum(0.06), seed=seed + i, mute=mute), t + i * gap, 1.0, pan + 0.3 * (i / (k - 1) - 0.5))

def violao(f, dur, vel=1.0, seed=0, t60=2.2):
    """the violão (nylon strings): a warm, round pluck (Karplus-Strong, darker), the spruce top's low body"""
    seed = abs(int(seed)); x = pluck(f, dur, 10 ** (-3 / (f * t60)), 0.38 + 0.12 * vel, seed, 0.2)
    x = lp(x, 3600, 0.1)   # (nylon: little above 4 kHz, no sharp corner in the wave)
    return (hp1(x, 90) + bp(x, 210, 0.4) * 0.35 + bp(x, 2400, 0.3) * 0.12) * 0.42 * vel

def flute(notes, breath=0.16, vib=0.18, rel=0.25, seed=0):
    """a soft concert flute played legato: notes [(start s, dur s, midi, level)]; a light chiff on each note, gentle vibrato on the
    long ones, a little breath"""
    t_end = notes[-1][0] + notes[-1][1]; n = int((t_end + rel) * SR); t = np.arange(n) / SR
    p = np.full(n, float(notes[0][2])); lv = np.zeros(n); age = np.zeros(n); ln = np.ones(n)
    for s0, d, m, v in notes:
        i0 = int(s0 * SR); p[i0:] = m; lv[i0:] = v; age[i0:] = t[i0:] - s0; ln[i0:] = d
    p0 = p[0]; p = lp1(p - p0, 22.0) + p0
    p = p + vib * np.clip((age - 0.25) / (0.5 * ln + 0.05), 0, 1) * (ln > 0.4) * np.sin(TAU * 5.0 * t)
    fr = mtof(p); nz = noise(n, seed)
    tone = sine(fr, n) + 0.22 * sine(fr * 2, n, 0.25) + 0.07 * sine(fr * 3, n, 0.5)
    air = hp(bp(nz, fr, 0.95), 400) * 1.2 + hp(nz, 6000) * 0.02
    art = 0.6 + 0.4 * np.clip(age / 0.03, 0, 1)
    env = np.clip(t / 0.05, 0, 1) * lp1(lv, 30.0) * art * np.clip((t_end + rel - t) / rel, 0, 1) ** 1.5
    return ((tone * (1 - breath) + air * breath) * env + bp(nz, 2200, 0.3) * np.exp(-age / 0.015) * lv * 0.3) * 0.32

def epiano(f, dur, vel=0.6, r=0.3):
    """an FM electric piano: a warm 1:1 body and a bell-like 1:14 tine that dies fast"""
    n = int((dur + r) * SR); t = np.arange(n) / SR
    body = np.sin(TAU * f * t + ((0.5 + 1.2 * vel) * np.exp(-t / 0.45) + 0.2) * np.sin(TAU * f * t))
    tine = np.sin(TAU * f * t + (0.8 + 1.6 * vel) * np.exp(-t / 0.02) * np.sin(TAU * 14.0 * f * t)) * np.exp(-t / 0.06)
    amp = np.exp(-t / (1.3 if f < 400 else 0.9)) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (r / 3))) * np.clip(t / 0.002, 0, 1)
    return (body * 0.75 + tine * 0.3 * vel) * amp * 0.38

def horn(f, dur, vel=1.0, a=0.02, r=0.12, seed=0):
    """a horn section voice (trumpet, sax and trombone in unison and octaves): bright saws and a reedy pulse whose filter opens with
    the breath, a fall-off at the end of short notes, a little vibrato on long ones"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(abs(int(seed)))
    fr = f * (1 + 0.004 * np.sin(TAU * 5.5 * t) * np.clip((t - 0.2) / 0.3, 0, 1)) * (1 - 0.01 * np.exp(-t / 0.03))
    x = saw(fr, n, rr.random()) * 0.45 + saw(fr * 1.005, n, rr.random()) * 0.35 + pulse(fr * 0.5, n, 0.35, rr.random()) * 0.25
    fc = 500 + 3200 * vel * np.clip(t / max(a * 2.5, 0.015), 0, 1) * (0.7 + 0.3 * np.exp(-t / 0.2))
    y = lp(x, fc, 0.18) + bp(x, 1400, 0.45) * 0.25
    return y * adsr(n, a, 0.15, 0.82, r, gate=dur) * 0.4 * vel

def surdo(f=55, open_=True, vel=1.0, seed=0):
    """a surdo: the big bass drum of the bateria, struck with a soft mallet; open (it booms) or muted by the other hand (short)"""
    seed = abs(int(seed)); dur = 1.0 if open_ else 0.3; n = int(dur * SR); t = np.arange(n) / SR; dec = 0.42 if open_ else 0.07
    pf = f * (1 + 0.3 * np.exp(-t / 0.02))
    x = 0.8 * sine(pf, n) * np.exp(-t / dec) + 0.3 * sine(pf * 1.58, n, 0.3) * np.exp(-t / (dec * 0.5)) + 0.18 * sine(pf * 2.2, n, 0.6) * np.exp(-t / (dec * 0.3))
    x = x + bp(noise(n, seed), 700, 0.4) * np.exp(-t / 0.025) * 0.6 + lp(noise(n, seed + 1), 300) * np.exp(-t / 0.04) * 0.5
    return np.tanh(x * 1.6) * vel * np.clip(t / 0.001, 0, 1)

def tamborim(vel=1.0, seed=0):   # the tamborim: a small, tight frame drum struck with a stick: a dry, high crack
    seed = abs(int(seed)); n = int(0.1 * SR); t = np.arange(n) / SR
    x = bp(noise(n, seed), 1900, 0.5) * 1.1 + sine(780 * (1 + 0.2 * np.exp(-t / 0.004)), n) * 0.5 + hp(noise(n, seed + 3), 5000) * np.exp(-t / 0.004) * 0.6
    return x * np.exp(-t / 0.018) * np.clip(t / 0.0003, 0, 1) * vel

def agogo(high=True, vel=1.0, seed=0):   # the agogô: two cone bells on one handle, struck with a stick (the bells' inharmonic partials)
    n = int(0.45 * SR); t = np.arange(n) / SR; f = 1180 if high else 830; x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 0.22), (2.43, 0.4, 0.1), (3.97, 0.18, 0.05), (5.6, 0.08, 0.03)):
        x += amp * sine(f * ratio, n, (seed * 0.31 + ratio) % 1.0) * np.exp(-t / dec)
    return (x + hp(noise(n, abs(int(seed))), 4000) * np.exp(-t / 0.002) * 0.3) * np.clip(t / 0.0005, 0, 1) * vel * 0.4

def cuica(strokes, f0=560, seed=0):
    """the cuíca: a friction drum (a stick inside rubbed with a wet cloth): each stroke a squeaky, vocal tone gliding up or down.
    strokes: [(start s, dur s, semitones from, semitones to)]"""
    t_end = max(s + d for s, d, _, _ in strokes); n = int((t_end + 0.05) * SR); t = np.arange(n) / SR
    semis = np.zeros(n); amp = np.zeros(n)
    for s0, d, a_, z in strokes:
        i0, i1 = int(s0 * SR), int((s0 + d) * SR); x = np.linspace(0, 1, i1 - i0)
        semis[i0:i1] = a_ + (z - a_) * (1 - (1 - x) ** 2); amp[i0:i1] = np.sin(np.pi * x) ** 0.6
    fr = f0 * 2 ** (semis / 12)
    src = pulse(fr, n, 0.22) * 0.5 + sine(fr, n) * 0.8 + bp(noise(n, abs(int(seed))), fr * 2, 0.7) * 0.4
    y = bp(src, fr * 1.05, 0.55) * 1.2 + bp(src, 1500, 0.5) * 0.4
    return y * lp1(amp, 60.0) * 0.5

def apito(pattern, f=2750, seed=0):
    """the apito: the director's pea whistle (the pea rattling makes the trill); pattern: [(start s, dur s), ...]"""
    t_end = max(s + d for s, d in pattern); n = int((t_end + 0.05) * SR); t = np.arange(n) / SR; amp = np.zeros(n)
    for s0, d in pattern:
        i0, i1 = int(s0 * SR), int((s0 + d) * SR); amp[i0:i1] = 1.0
    amp = lp1(lp1(amp, 90.0), 90.0)
    tr = np.sin(TAU * 27.0 * t)
    fr = f * (1 + 0.035 * tr + 0.004 * np.sin(TAU * 3 * t))
    x = (sine(fr, n) + 0.15 * sine(fr * 2, n) + bp(noise(n, seed), f, 0.8) * 0.4) * (0.7 + 0.3 * tr)
    return x * amp * 0.22

def bass(f, dur, vel=1.0, bright=1.0):
    """the bass: a sine for the weight, a saw through a plucky filter for the bounce a phone plays"""
    n = int((dur + 0.06) * SR); t = np.arange(n) / SR
    m = sat(lp(saw(f, n) * 0.6 + pulse(f * 2, n, 0.35) * 0.2, 260 + 1500 * bright * vel * np.exp(-t / 0.07), 0.25), 1.9)
    return (sine(f, n) * 0.75 + hp1(m, 130) * 0.8) * adsr(n, 0.003, 0.14, 0.75, 0.05, gate=dur) * vel

def forest(dur, seed=0):
    """the air on the forest's edge: a soft surf far below (slow swells of low noise) and birds now and then (quick chirps: sines
    sweeping up and trilling)"""
    n = int(dur * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed)
    surf = lp(noise(n, seed), 500, 0.1) * (0.35 + 0.65 * np.sin(TAU * 0.09 * t + seed) ** 4) * 0.5
    birds = np.zeros(n)
    for _ in range(int(dur * 1.4)):
        s0 = r.uniform(0, dur - 1.0); k = r.integers(2, 6); f0 = r.uniform(2600, 4200)
        for j in range(k):
            a = int((s0 + j * r.uniform(0.07, 0.12)) * SR); m = int(r.uniform(0.04, 0.08) * SR)
            if a + m >= n: break
            x = np.linspace(0, 1, m); fr = f0 * (1 + r.uniform(0.15, 0.5) * x) * (1 + 0.04 * np.sin(TAU * 60 * x * m / SR))
            birds[a:a + m] += np.sin(np.cumsum(TAU * fr / SR)) * np.sin(np.pi * x) ** 2 * r.uniform(0.2, 0.6)
    return surf + birds * 0.25

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards: it swells into the next downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  pad / e-piano voicing           the cavaquinho's four strings
CH = {'Cmaj9':  (36, [55, 59, 62, 64], [64, 67, 71, 74]),
      'C69':    (36, [57, 62, 64, 67], [64, 69, 74, 79]),
      'A7b13':  (45, [55, 61, 65, 69], [67, 73, 77, 81]),
      'Dm9':    (38, [53, 57, 60, 64], [65, 69, 72, 76]),
      'G13':    (43, [53, 57, 59, 64], [65, 69, 71, 76]),
      'G7b9':   (43, [53, 56, 59, 62], [65, 68, 71, 74]),
      'Fmaj7':  (41, [53, 57, 60, 64], [64, 69, 72, 77]),
      'Fm6':    (41, [53, 56, 60, 62], [62, 65, 68, 72]),
      'Em7':    (40, [55, 59, 62, 64], [64, 67, 71, 74]),
      'A7':     (45, [55, 61, 64, 69], [64, 67, 69, 73]),
      'Dm7':    (38, [53, 57, 60, 65], [65, 69, 72, 74]),
      'G7':     (43, [53, 59, 62, 65], [65, 71, 74, 77]),
      'Am9':    (45, [55, 59, 60, 64], [64, 67, 71, 72]),
      'D9':     (38, [54, 57, 60, 64], [64, 66, 69, 72]),
      'C69L':   (36, [52, 57, 62, 64, 67], [67, 69, 74, 76])}   # the landing
A_ = {0: 'C69', 1: 'A7b13', 2: 'Dm9', 3: [(0, 'G13'), (2, 'G7b9')]}
HARM = {-9: 'Cmaj9', -8: 'Cmaj9', -7: 'Am9', -6: 'Dm9', -5: 'G13', -4: 'C69', -3: 'A7b13', -2: 'Dm9', -1: [(0, 'G13'), (2, 'G7b9')],
        4: 'Fmaj7', 5: 'Fm6', 6: [(0, 'Em7'), (2, 'A7')], 7: [(0, 'Dm7'), (2, 'G7')], 8: 'Am9', 9: [(0, 'D9'), (2, 'G7b9')], 14: 'C69L'}
for k in range(4): HARM[k] = HARM[k + 10] = A_[k]
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
HOOK = {0: [(0, 2, 'G5'), (2, 1, 'A5'), (3, 3, 'C6'), (6, 1, 'A5'), (7, 3, 'G5'), (10, 2, 'E5'), (12, 1, 'D5'), (13, 3, 'E5')],
        1: [(0, 2, 'C#6'), (2, 1, 'E6'), (3, 3, 'F6'), (6, 1, 'E6'), (7, 3, 'C#6'), (10, 2, 'A5'), (12, 1, 'G5'), (13, 3, 'F5')],
        2: [(0, 2, 'F5'), (2, 1, 'A5'), (3, 3, 'C6'), (6, 1, 'D6'), (7, 3, 'E6'), (10, 2, 'F6'), (12, 1, 'E6'), (13, 3, 'D6')],
        3: [(0, 2, 'B5'), (2, 1, 'A5'), (3, 3, 'E6'), (6, 1, 'D6'), (7, 1, 'B5'), (8, 2, 'F6'), (10, 1, 'D6'), (11, 1, 'B5'), (12, 1, 'Ab5'), (13, 3, 'G5')]}
SECOND = {4: [(0, 2, 'A5'), (2, 1, 'C6'), (3, 3, 'E6'), (6, 1, 'C6'), (7, 3, 'A5'), (10, 2, 'F5'), (12, 1, 'E5'), (13, 3, 'F5')],
          5: [(0, 2, 'Ab5'), (2, 1, 'C6'), (3, 3, 'D6'), (6, 1, 'C6'), (7, 3, 'Ab5'), (10, 2, 'F5'), (12, 1, 'D5'), (13, 3, 'C5')],
          6: [(0, 2, 'G5'), (2, 1, 'B5'), (3, 3, 'D6'), (6, 1, 'B5'), (7, 1, 'G5'), (8, 2, 'G5'), (10, 1, 'A5'), (11, 3, 'C#6'), (14, 2, 'E6')],
          7: [(0, 2, 'F6'), (2, 1, 'E6'), (3, 3, 'D6'), (6, 1, 'C6'), (7, 1, 'A5'), (8, 2, 'B5'), (10, 1, 'D6'), (11, 3, 'F6'), (14, 2, 'E6')]}
CADENCE = [(0, 2, 'B5'), (2, 1, 'A5'), (3, 3, 'E6'), (6, 1, 'D6'), (7, 1, 'B5'), (8, 1, 'Ab5'), (9, 1, 'B5'), (10, 1, 'D6'), (11, 1, 'F6'),
           (12, 2, 'Ab6'), (14, 1, 'G6'), (15, 1, 'F6')]   # up the diminished chord into the landing's E
BREATH = [(0, 6, 'E6', 0.9), (6, 2, 'D6', 0.8), (8, 4, 'C6', 0.85), (12, 4, 'B5', 0.85), (16, 4, 'A5', 0.9), (20, 2, 'F#5', 0.8), (22, 3, 'A5', 0.85)]

drums, perc, bat, bass_b, pad, keys, cav, lead, hrn, gtr, flt, fx, atmos = (S.bus(x) for x in 'drums perc bateria bass pad keys cav lead horns violao flute fx atmos'.split())
kicks = []

def pick(bar, phrase, gain, pan=0.12, horns=0.0, octave=0, bright=0.9, seed0=0):
    """the cavaquinho picks the tune (a hard steel note, doubled by a soft synth pluck for body); horns: the section doubles it"""
    for i, (p, ln, name) in enumerate(phrase):
        m = nm(name) + 12 * octave; t = T(bar, p); d = ln * s16; v = hum(0.05) * (1.05 if p % 4 == 3 else 1.0)
        sd = seed0 + (bar + 20) * 41 + i
        lead.add(cav_string(mtof(m), d + 0.35, v, seed=sd, t60=0.8, bright=bright), t, gain, pan); lead.add(cav_string(mtof(m) * 1.003, d + 0.3, v * 0.8, seed=sd + 7, t60=0.7), t + 0.006, gain * 0.5, pan + 0.15)
        n_ = int((d + 0.2) * SR); tt = np.arange(n_) / SR
        lead.add(lp(pulse(mtof(m), n_, 0.3), 700 + 3500 * np.exp(-tt / 0.06), 0.2) * adsr(n_, 0.002, 0.2, 0.3, 0.1, gate=d) * 0.12 * v, t, gain, pan - 0.2)
        if horns:
            for k_, (o, g_) in enumerate(((0, 1.0), (-12, 0.7))):
                hrn.add(horn(mtof(m + o), d * 0.85, v, seed=sd + 100 * k_), t, horns * g_, pan=(-0.3, 0.3)[k_])

PART = [(0, 'A'), (2, 'g'), (3, 'o'), (5, 'o'), (6, 'g'), (7, 'A'), (9, 'o'), (10, 'g'), (11, 'o'), (12, 'g'), (14, 'A'), (15, 'o')]
def cav_bar(bar, gain, upto=16, ring=0.32):
    """the cavaquinho's syncopated strum (accents on the anticipations), muted chucks between"""
    for p, k in PART:
        if p >= upto: continue
        c = chord_at(bar, p / 4)
        strum(cav, T(bar, p), CH[c][2], vel=gain * {'A': 1.0, 'o': 0.6, 'g': 0.55}[k], up=p % 2 == 1, ring=ring, pan=-0.3, seed=(bar + 20) * 61 + p, mute=k == 'g')

def pad_bar(bar, gain, cutoff=2600, a=0.08, r=0.6):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(CH[c][1][:4]):
            pad.add(voice_pad(mtof(m), (b1 - b0) * b, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), S.t(bar, b0), gain, pan=[-0.7, -0.25, 0.25, 0.7][j])

def keys_bar(bar, gain, rhythm=((0, 2), (3, 2), (6, 2), (10, 2), (13, 3)), vel=0.55):
    for p, ln in rhythm:
        c = chord_at(bar, p / 4)
        for j, m in enumerate(CH[c][1][:4]): keys.add(epiano(mtof(m + 12), ln * s16, vel * hum(0.08)), T(bar, p) + 0.004 * j, gain, pan=-0.35 + 0.23 * j)

def bossa(bar, gain, upto=16):
    """the violão's bossa: the thumb on the root and the fifth below, the fingers' chords syncopated against it"""
    for b0, b1, c in chords_in(bar):
        R = CH[c][0] + 12
        for p, iv in ((0, 0), (4, -5), (8, 0), (12, -5)):
            if 4 * b0 <= p < min(4 * b1, upto): gtr.add(violao(mtof(R + iv), 1.0, 0.9, seed=(bar + 20) * 50 + p), T(bar, p), gain, pan=-0.15)
        for p in (3, 6, 10, 13):
            if 4 * b0 <= p < min(4 * b1, upto):
                for j, m in enumerate(CH[c][1][1:4]): gtr.add(violao(mtof(m + 12), 0.8, 0.7, seed=(bar + 20) * 50 + p * 3 + j), T(bar, p) + 0.006 * j, gain * 0.7, pan=0.25)

SAMBA_B = [(0, 2, 0), (3, 1, 0), (4, 3, -5), (7, 1, 0), (8, 2, 0), (11, 1, 12), (12, 3, -5), (15, 1, 0)]   # tum-TUM, like the surdos
def bass_bar(bar, gain, bright=1.0, upto=16):
    for b0, b1, c in chords_in(bar):
        R = CH[c][0]
        for p, ln, iv in SAMBA_B:
            if 4 * b0 <= p < min(4 * b1, upto): bass_b.add(bass(mtof(R + iv), ln * s16 * 0.9, hum(0.04) * (1.0 if p % 4 == 0 else 0.85), bright), T(bar, p), gain)

TAMB = [(0, 1.0), (3, 0.7), (6, 0.9), (8, 0.6), (10, 1.0), (11, 0.6), (14, 0.9)]
AGO = [(0, True), (2, True), (3, False), (6, True), (8, False), (10, True), (11, True), (14, False)]
def bateria(bar, g=1.0, upto=16, surdo_=True, tamb=True, ago=False, ganza=True, caixa=True):
    """the samba school's drums over the house groove"""
    for k in range(4):
        if surdo_ and 4 * k < upto:
            bat.add(surdo(66, open_=False, vel=0.7, seed=bar * 4 + k) if k % 2 == 0 else surdo(52, True, 1.0, seed=bar * 4 + k), S.t(bar, k), 0.3 * g, pan=-0.1 if k % 2 == 0 else 0.1)
    if surdo_ and bar % 2 and upto > 15: bat.add(surdo(60, False, 0.55, seed=bar), T(bar, 15), 0.22 * g, pan=0.2)   # the third surdo's flourish
    for p, v in TAMB if tamb else ():
        if p < upto: bat.add(tamborim(v * hum(0.08), seed=bar * 16 + p), T(bar, p), 0.3 * g, pan=0.45)
    for p, hi in AGO if ago else ():
        if p < upto: perc.add(agogo(hi, hum(0.08), seed=bar * 16 + p), T(bar, p), 0.25 * g, pan=-0.5)
    for p in range(upto if ganza else 0):
        perc.add(SHK[p % 4], T(bar, p), g * 0.16 * (0.7, 0.35, 0.5, 1.0)[p % 4] * hum(0.12), pan=0.3)
    if caixa:
        for p in range(upto):
            v = (0.5, 0.15, 0.22, 0.35)[p % 4]
            drums.add(CXA[p % 3], T(bar, p), 0.09 * v * g * hum(0.15), pan=-0.2)

# drum sounds, made once
KICK = kick(dur=0.3, f0=170, f1=50, sweep=0.036, click=0.55, drive=1.7); KICK[-1500:] *= np.linspace(1, 0, 1500) ** 2
CLP = clap(seed=4); SNR = snare(0.2, tone=230, snappy=0.9, seed=5)
CXA = [snare(0.12, tone=260, snappy=1.0, seed=20 + s) for s in range(3)]   # the caixa (a tight snare: its sixteenths are the samba's engine)
HO = [hat(open_=True, seed=s + 10, tone=8000) * 0.7 for s in range(2)]; SHK = [shaker(0.07, seed=s) for s in range(4)]
def K(t, g=0.55, lpf=None): drums.add(KICK if lpf is None else lp(KICK, lpf), t, g); kicks.append(t)
def house(bar, g=1.0, upto=16, clap_=True):
    for k in range(4):
        if 4 * k < upto: K(S.t(bar, k), 0.55 * g)
        if clap_ and k in (1, 3) and 4 * k < upto: drums.add(CLP, S.t(bar, k), 0.28 * g * hum(), pan=0.05)
        if 4 * k + 2 < upto: perc.add(HO[k % 2], T(bar, 4 * k + 2), 0.2 * g * hum(), pan=0.25)

def roll(t0, t1, n0, n1, g0, g1, tone0=240, tone1=300, pan=0.0):   # the caixa / repique rolling, faster and louder towards t1
    t = t0; i = 0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.14, tone=tone0 + (tone1 - tone0) * x, snappy=1.0, seed=i % 97), t, g0 + (g1 - g0) * x ** 1.4, pan=pan)
        t += b / (n0 + (n1 - n0) * x); i += 1

def gap(t1, buses):   # an eighth of air before the hit at t1: these buses fade out (15 ms) at t1 - b/2 and come back at t1
    x = np.arange(S.n) / SR; g = np.clip(1 - (x - (t1 - b / 2)) / 0.015, 0, 1) + np.clip((x - t1 + 0.004) / 0.004, 0, 1)
    for bus in buses: bus.curve(np.minimum(g, 1.0))

def blow(bar, notes, gain, pan=0.15, **kw):   # a flute phrase: [(sixteenth from the bar, length, note, level)]
    t0 = T(bar, notes[0][0], 0); flt.add(flute([(T(bar, p, 0) - t0, ln * s16, nm(x), lv) for p, ln, x, lv in notes], **kw), t0, gain, pan)

# ================================================================ INTRO: the globe (bars -9..-1) =================================
I0 = S.t(-9)                                                     # 1.87 s
fl_, fr_ = forest(S.t(0) - I0 + 2.0, 1), forest(S.t(0) - I0 + 2.0, 2); x = np.linspace(0, 1, len(fl_))
fg = np.clip(x / 0.08, 0, 1) * np.clip((S.t(0) + 0.5 - I0 + 0.8 - np.arange(len(fl_)) / SR) / 3.0, 0, 1)
atmos.add((fl_ * fg, fr_ * fg), I0 - 0.8, 0.55)
for t0, ln, c in spans(-9, -2):                                  # the pad, opening
    x = (t0 - I0) / (S.t(-2) - I0)
    for j, m in enumerate(CH[c][1][:4]):
        pad.add(voice_pad(mtof(m), ln, cutoff=800 + 1800 * x, a=1.5 if x < 0.1 else 0.5, r=1.0, voices=5, seed=m + j), t0, 0.2 + 0.18 * x, pan=[-0.7, -0.25, 0.25, 0.7][j])
for t0, ln, c in spans(-9, -6): bass_b.add(voice_sub(mtof(CH[c][0]), ln - 0.1, a=1.0, r=0.8), t0, 0.035)
for bar in (-9, -8):                                             # the violão: a few slow notes, then its bossa (softly)
    for p, m in ((0, 48), (6, 64), (8, 67), (12, 71)) if bar == -9 else ((0, 48), (4, 62), (6, 64), (10, 67), (12, 74)):
        gtr.add(violao(mtof(m), 2.0, 0.7, seed=bar * 20 + p), T(bar, p), 0.75, pan=0.1 if m > 60 else -0.1)
for bar in range(-7, -2): bossa(bar, 0.38 + 0.03 * (bar + 7))
# the flute sings the hook at half speed
blow(-7, [(0, 4, 'G5', 0.8), (4, 2, 'A5', 0.85), (6, 6, 'C6', 1.0), (12, 2, 'A5', 0.8), (14, 6, 'G5', 0.9), (20, 4, 'E5', 0.8), (24, 2, 'D5', 0.75), (26, 6, 'E5', 0.9)], 0.3, seed=1)
blow(-5, [(0, 4, 'C#6', 0.85), (4, 2, 'E6', 0.9), (6, 6, 'F6', 1.0), (12, 2, 'E6', 0.85), (14, 6, 'C#6', 0.9), (20, 4, 'A5', 0.8), (24, 2, 'G5', 0.75), (26, 5, 'F5', 0.85)], 0.33, seed=2)
for bar in (-5, -4, -3): keys_bar(bar, 0.16 + 0.02 * (bar + 5), rhythm=((0, 6), (6, 4), (10, 6)), vel=0.45)
# the bateria assembles: the ganzá, the surdo's heartbeat, the tamborim far off, a cuíca call
for bar in (-5, -4, -3):
    for p in range(16): perc.add(SHK[p % 4], T(bar, p), 0.1 * (0.7, 0.35, 0.5, 1.0)[p % 4] * (0.6 + 0.2 * (bar + 5)), pan=0.3)
    for k in (0, 1, 2, 3): bat.add(surdo(66, False, 0.6, seed=k) if k % 2 == 0 else surdo(52, True, 0.9, seed=k), S.t(bar, k), 0.16 + 0.04 * (bar + 5), pan=0.0)
    for b0, b1, c in chords_in(bar): bass_b.add(bass(mtof(CH[c][0]), (b1 - b0) * b * 0.95, 0.6, 0.25), S.t(bar, b0), 0.14)
for bar in (-4, -3):
    for p, v in TAMB: bat.add(lp(tamborim(v, seed=bar * 16 + p), 2500), T(bar, p), 0.14 + 0.04 * (bar + 4), pan=0.45)
fx.add(cuica([(0, 0.18, 0, 7), (0.25, 0.14, 5, 0), (0.45, 0.3, 0, 9)], seed=1), T(-6, 10), 0.22, pan=0.5)
fx.add(cuica([(0, 0.16, 2, 9), (0.22, 0.16, 7, 2), (0.42, 0.16, 2, 9), (0.64, 0.35, 9, -2)], seed=2), T(-4, 12), 0.24, pan=-0.45)
for k in range(4): K(S.t(-3, k), 0.22, lpf=300)
# --- the build (bars -2, -1): works on its own from 15.5 s (the short intro) --------------------------------------------------------
fx.add(apito([(0, 0.32), (0.45, 0.12), (0.62, 0.12), (0.79, 0.4)], seed=3), S.t(-2), 0.3, pan=0.1)        # the director calls the band
fx.add(apito([(0, 0.12), (0.17, 0.12), (0.34, 0.12), (0.51, 0.12), (0.68, 0.5)], seed=4), S.t(-1, 2), 0.24, pan=0.1)
for bar in (-2, -1):
    for k in range(4 if bar == -2 else 3): K(S.t(bar, k), 0.32 + 0.03 * k)
    bateria(bar, 0.75 if bar == -2 else 0.85, upto=16 if bar == -2 else 14, tamb=True, caixa=False)
    pad_bar(bar, 0.24, cutoff=1500 if bar == -2 else 2500, a=0.2)
cav_bar(-2, 0.45); cav_bar(-1, 0.5, upto=14)
bass_bar(-2, 0.2, bright=0.5); bass_bar(-1, 0.22, bright=0.7, upto=14)
roll(S.t(-2, 2), S.t(-1), 2, 4, 0.06, 0.12); roll(S.t(-1), T(-1, 14, 0), 4, 8, 0.09, 0.18)
for p, v in ((8, 0.7), (10, 0.8), (12, 0.9), (13, 0.9)): bat.add(surdo(52, True, v, seed=p), T(-1, p), 0.2, pan=0.1)   # the surdos double
fx.add(riser_cut(2 * B - b / 2, f0=350, f1=9000, seed=3), S.t(-2), 0.2)
fx.add(rev_crash(1.2, seed=5), S.t(0) - 1.2, 0.17)
gap(S.t(0), (pad, cav, perc, bat, bass_b, drums, keys, gtr))
pick(-1, [(14, 1, 'E5'), (15, 1, 'F5')], 0.5)                   # the cavaquinho's pickup, alone in the air

# ================================================================ MAIN: the climb (bars 0..13) ===================================
fx.add(impact(2.5), S.t(0), 0.24); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.1)
bat.add(surdo(48, True, 1.0, seed=99), S.t(0), 0.5)
for j, m in enumerate(CH['C69'][1] + [72, 76]): hrn.add(horn(mtof(m), b * 1.2, 1.0, a=0.01, r=0.25, seed=600 + j), S.t(0), 0.2, pan=-0.5 + 0.2 * j)
for bar in range(14):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'breath' if bar < 9 else 'call' if bar < 10 else 'final'
    upto = 14 if bar == 13 else 16
    if sec in ('A', 'A2'):
        house(bar); bateria(bar, ago=sec == 'A2'); bass_bar(bar, 0.34); pad_bar(bar, 0.24, cutoff=3200); cav_bar(bar, 0.5)
        if sec == 'A2': keys_bar(bar, 0.2)
    elif sec == 'breath':
        bossa(bar, 0.5); keys_bar(bar, 0.16, rhythm=((0, 6), (6, 4), (10, 6)), vel=0.5)
        for p in range(16): perc.add(SHK[p % 4], T(bar, p), 0.08 * (0.7, 0.35, 0.5, 1.0)[p % 4], pan=0.3)
        for t0, ln, c in spans(bar, bar + 1):
            for j, m in enumerate(CH[c][1][:4]): pad.add(voice_pad(mtof(m), ln, cutoff=1700, a=0.4, r=1.0, seed=m + 5), t0, 0.26, pan=[-0.7, -0.25, 0.25, 0.7][j])
            bass_b.add(bass(mtof(CH[c][0]), ln * 0.95, 0.8, 0.3), t0, 0.2)
    elif sec == 'call':
        bossa(bar, 0.45, upto=8); keys_bar(bar, 0.16, rhythm=((0, 6),), vel=0.5)
        bass_b.add(bass(mtof(38), 2 * b * 0.95, 0.8, 0.3), S.t(bar), 0.2)
        for k in (2, 3): K(S.t(bar, k), 0.4)
        bateria(bar, 0.9, upto=14, tamb=True, caixa=False, ganza=True, surdo_=False)
        for p, v in ((8, 0.8), (10, 0.85), (11, 0.7), (12, 0.95), (13, 0.9)): bat.add(surdo(52 if p % 2 == 0 else 60, True, v, seed=p + 30), T(bar, p), 0.32, pan=0.1 if p % 2 == 0 else -0.1)
        for p in range(8, 14): bass_b.add(bass(mtof(43), s16 * 0.9, 0.7 + 0.04 * p, 0.6), T(bar, p), 0.28)
        pad_bar(bar, 0.22, cutoff=2400, a=0.15)
    else:
        house(bar, upto=upto); bateria(bar, ago=True, upto=upto); bass_bar(bar, 0.34, upto=upto); pad_bar(bar, 0.24, cutoff=4200)
        cav_bar(bar, 0.5, upto=upto); keys_bar(bar, 0.2)
        perc.add(ride(0.7, seed=bar), S.t(bar), 0.14, pan=0.35)
# the tunes
for bar in range(4): pick(bar, HOOK[bar], 0.55)
for bar in range(4, 8): pick(bar, SECOND[bar], 0.55, horns=0.12 if bar >= 6 else 0.0)
blow(8, BREATH, 0.42, seed=5)
for bar in range(10, 13): pick(bar, HOOK[bar - 10], 0.58, horns=0.26)
pick(13, CADENCE, 0.58, horns=0.26)
# the horns' stabs in A' (on the anticipations) and the cuíca between the phrases
for bar in (4, 5):
    for p in (7, 14):
        c = chord_at(bar, p / 4)
        for j, m in enumerate(CH[c][1][1:4]): hrn.add(horn(mtof(m + 12), s16 * 1.5, 0.9, a=0.008, r=0.08, seed=bar * 30 + p + j), T(bar, p), 0.14, pan=-0.4 + 0.4 * j)
fx.add(cuica([(0, 0.16, 0, 7), (0.2, 0.16, 7, 0), (0.4, 0.16, 0, 7), (0.6, 0.3, 7, -3)], seed=3), T(3, 8), 0.2, pan=0.55)
fx.add(cuica([(0, 0.14, 4, 11), (0.18, 0.14, 9, 4), (0.36, 0.28, 4, 12)], seed=4), T(5, 12), 0.2, pan=-0.55)
fx.add(cuica([(0, 0.16, 0, 9), (0.22, 0.16, 7, 0), (0.44, 0.4, 0, 12)], seed=5), T(11, 12), 0.2, pan=0.55)
# fills, crashes
fx.add(rev_crash(1.0, seed=7), S.t(4) - 1.0, 0.18); fx.add(crash(2.0, seed=2), S.t(4), 0.2, pan=-0.2)
roll(T(3, 12), T(3, 16), 4, 6, 0.06, 0.16)
roll(T(7, 8), T(7, 16), 4, 8, 0.06, 0.2)
fx.add(crash(2.5, seed=3), S.t(8), 0.2, pan=0.2); fx.add(downlifter(B, seed=6), S.t(8), 0.1)
fx.add(apito([(0, 0.3), (0.42, 0.12), (0.58, 0.12), (0.74, 0.12), (0.9, 0.45)], seed=5), S.t(9), 0.3, pan=0.1)
roll(S.t(9, 1), T(9, 14, 0), 3, 8, 0.08, 0.28)
fx.add(riser_cut(B - b / 2, f0=500, f1=10000, seed=7), S.t(9), 0.24); fx.add(rev_crash(1.0, seed=9), S.t(10) - 1.0, 0.2)
gap(S.t(10), (pad, cav, perc, bat, bass_b, drums, keys, gtr))
fx.add(crash(2.6, seed=4), S.t(10), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(10), 0.14); bat.add(surdo(48, True, 1.0, seed=98), S.t(10), 0.45)
for j, m in enumerate(CH['C69'][1] + [72, 76]): hrn.add(horn(mtof(m), b * 1.0, 1.0, a=0.01, r=0.2, seed=640 + j), S.t(10), 0.16, pan=-0.5 + 0.2 * j)
# the last bar into the landing: the caixa rolls, the surdos, a riser, the apito, an eighth of air
roll(S.t(13, 2), T(13, 14, 0), 4, 8, 0.1, 0.28)
for p, v in ((8, 0.8), (10, 0.85), (12, 0.95), (13, 0.9)): bat.add(surdo(52, True, v, seed=p + 50), T(13, p), 0.32, pan=0.1)
fx.add(riser_cut(B - b / 2, f0=600, f1=11000, seed=8), S.t(13), 0.22); fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.24)
gap(LAND, (pad, cav, perc, bat, bass_b, drums, keys, gtr, hrn))

# ================================================================ LANDING: bar 14 = 48.2 s, the race starts ======================
drums.add(KICK, LAND, 0.7); drums.add(CLP, LAND, 0.32); drums.add(SNR, LAND, 0.2)
bat.add(surdo(48, True, 1.0, seed=97), LAND, 0.55); bat.add(tamborim(1.0, seed=3), LAND, 0.4, pan=0.45)
fx.add(impact(2.5, seed=5), LAND, 0.3); fx.add(crash(3.0, seed=6), LAND, 0.34, pan=0.1)
fx.add(apito([(0.05, 0.1), (0.2, 0.55)], seed=6), LAND, 0.22, pan=0.1)
strum(cav, LAND, CH['C69L'][2], 1.0, ring=2.0, gap=0.012, pan=-0.2, seed=920)
for j, m in enumerate(CH['C69L'][1] + [72, 76]):
    e_ = horn(mtof(m), 1.2, 1.0, a=0.01, r=0.8, seed=700 + j); hrn.add(e_, LAND, 0.2, pan=-0.6 + 0.17 * j)
for j, m in enumerate(CH['C69L'][1]): keys.add(epiano(mtof(m + 12), 1.6, 0.6, r=0.8), LAND + 0.004 * j, 0.24, pan=-0.35 + 0.18 * j)
pick(N, [(0, 8, 'E6')], 0.55)
lb = bass(mtof(36), 2.3, 1.0, 0.6); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass_b.add(lb, LAND, 0.42)

# ================================================================ MIX =============================================================
def duck(times, depth, release): return 1 - lp1(1 - S.sidechain(times, depth=depth, release=release), 150)   # (smoothed: no click)
bass_b.curve(duck(kicks, 0.6, 0.14)); pad.curve(duck(kicks, 0.45, 0.18)); cav.curve(duck(kicks, 0.2, 0.1)); keys.curve(duck(kicks, 0.3, 0.12))
bat.curve(duck(kicks, 0.25, 0.08))
fc = curve([(0, 2600), (S.t(-3), 3000), (S.t(-2), 1200), (S.t(-1, 2), 4500), (S.t(0) - 0.05, 12000), (S.t(0), 16000), (S.t(8), 16000),
            (S.t(8, 1), 2600), (S.t(9, 2), 3000), (S.t(10) - 0.05, 14000), (S.len, 16000)], log=True)
for x in (pad, cav): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 150)); cav.filt(lambda x: hp1(x, 250)); lead.filt(lambda x: hp1(x, 250)); keys.filt(lambda x: hp1(x, 160)); hrn.filt(lambda x: hp1(x, 180))
gtr.filt(lambda x: hp1(x, 80)); flt.filt(lambda x: hp1(x, 250)); bass_b.filt(lambda x: hp1(x, 32)); perc.filt(lambda x: lp1(x, 13000)); bat.filt(lambda x: hp1(x, 35))
pad.width(1.6); keys.width(1.2)
tt = np.arange(S.n) / SR; trem = 0.2 * np.sin(TAU * 3.0 * tt); keys.L *= 1 + trem; keys.R *= 1 - trem   # the electric piano's stereo tremolo
lead.gain(1.3); cav.gain(1.15); drums.gain(0.85); pad.width(1.2); perc.width(1.3)
# sends: a warm hall, a short room for the drums and the bateria, a dotted-eighth echo on the tune and the flute
verb_in = S.bus()
for x, a in ((pad, 0.35), (cav, 0.12), (lead, 0.16), (hrn, 0.2), (keys, 0.2), (gtr, 0.25), (flt, 0.4), (fx, 0.2), (bat, 0.1), (perc, 0.05), (atmos, 0.3)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.15, decay=2.6, damp=0.3, predelay=0.025); vl, vr = vl * 1.3, vr * 1.3
room_l, room_r = reverb(drums.L * 0.1 + bat.L * 0.18, drums.R * 0.1 + bat.R * 0.18, size=0.5, decay=0.7, damp=0.4)
dl = lead.send_delay(b * 0.75, 0.12, fb=0.28, damp=0.45); df = flt.send_delay(b * 0.75, 0.22, fb=0.35, damp=0.4)
BUSES = [drums, perc, bat, bass_b, pad, keys, cav, lead, hrn, gtr, flt, fx, atmos, (vl, vr), (room_l, room_r), dl, df]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level in the intro and the main, before the master)
    for x in BUSES:
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x; nm_ = x.name if isinstance(x, Bus) else 'send'
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); print(f'{nm_:9s} {sec:5s} rms {20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/brazil', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.5, lows_db=-1.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
