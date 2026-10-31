"""Australia (Victoria: the Great Alpine Road over the Alps, from the Tambo's gum forest up to the snow gums of Mount Hotham): sunlit
open-road pub rock. A harmonica through a small microphone (one reed per phrase: tongued attacks, slurs, the blues bends up into the
note, the cupped hand's tremolo on the long ones), a jangling twelve-string guitar picking eighths, a driving bass, a big rock kit, a
bush-band jingle stick (a pole of jingles stamped on the floor) and wide warm pads. A major (with the mixolydian G), 127.66 bpm:
15 bars from the drop to the race's start.
The hook 'climbs and coasts': a leap up a fourth, a bent note at the top, then down the pentatonic like a road coming off a crest;
the chorus climbs the same shape a step at a time to the high F#, and the last bend (up into the A) lands on the race's start.
Over the globe the heat of a summer afternoon: cicadas swelling and fading, a few far bell-like bird calls, the harmonica far away.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations, no anthem).

    intro (the globe)  bars -10..-1  the cicadas, the pad, the bird calls, the far harmonica, the twelve-string, the build
    drop  (20.0 s)     bar 0         the groove and the hook
    A bars 0-3, A' 4-7 (the jingle stick and the mixolydian G), breath 8-10 (the drums out; the build back in bar 10),
    chorus 11-14 (four on the floor, the climb to the high F#, a second harmonica an octave down), LANDING at bar 15 = 48.2 s
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 15                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 127.66 bpm
B, b = S.bar, S.beat
LAND = 4 * N
def T(beat): return S.drop + beat * b
assert abs(S.main_bars - N) < 1e-9 and abs(T(LAND) - END) < 1e-9
rng = np.random.default_rng(23)
def hum(x=0.08): return 1 + rng.uniform(-x, x)
def curve(points): tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
def ramp(n, points): tp, vp = zip(*points); return np.interp(np.arange(n) / SR, tp, vp)

# ================================================================ instruments ===================================================
def harmonica(notes, tone=1.0, trem=0.35, seed=0, tail=0.3):
    """one reed per phrase. notes: (beat, beats, midi[, how[, velocity]]); how: 'p' tongued (a new breath: the tone dips and a puff
    of air), 'l' slurred, 'b' bent up into the note from a half step below, 'w' a long note with the cupped hand's tremolo. A narrow
    pulse and a saw (the reed), the cover plates' and the hands' resonances, the breath, a small microphone pushed into overdrive (the
    louder, the brighter). Returns (start s, mono)."""
    t0 = T(notes[0][0]) - 0.04; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed); idx = lambda beat: int(round((T(beat) - t0) * SR))
    pitch = np.zeros(n); amp = np.zeros(n); tr = np.zeros(n); puff = np.zeros(n)
    for i, nt in enumerate(notes):
        bt, ln, m = nt[:3]; how = nt[3] if len(nt) > 3 else 'p'; vel = nt[4] if len(nt) > 4 else 1.0
        a = idx(bt); e = idx(bt + ln); nx = idx(notes[i + 1][0]) if i + 1 < len(notes) else n
        pitch[a:] = m
        if how == 'b': k = int(min(0.16, 0.45 * ln * b) * SR); pitch[a:a + k] = m - 1 + (0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, k)))
        joined = nx - e < int(0.01 * SR)
        end = nx if joined else min(n, e + int(0.04 * SR))
        lvl = np.full(end - a, vel)
        if how in 'pw' or not joined: k = min(end - a, int(0.025 * SR)); lvl[:k] *= 0.35 + 0.65 * np.linspace(0, 1, k); puff[a:a + int(0.03 * SR)] += vel
        if not joined: k = min(end - a, int(0.05 * SR)); lvl[-k:] *= np.linspace(1, 0, k) ** 1.4
        amp[a:end] = np.maximum(amp[a:end], lvl)
        if how == 'w' or (e - a) / SR > 0.7:
            v0 = a + int(0.25 * SR); tr[v0:e] = trem * np.clip((np.arange(e - v0) / SR) / 0.4, 0, 1)
    k = int(0.005 * SR); pitch = np.convolve(np.r_[np.full(k, pitch[0]), pitch], np.ones(k) / k, 'same')[k:]
    amp = lp1(np.r_[np.zeros(64), amp], 60.0)[64:] * (1 - tr * (0.5 + 0.5 * np.sin(TAU * 5.4 * t)))
    f = mtof(pitch + 0.03 * np.sin(TAU * 0.7 * t))
    x = pulse(f, n, 0.22, r.random()) * 0.6 + saw(f, n, r.random()) * 0.4
    y = bp(x, 900, 0.5) * 0.8 + bp(x, 1750, 0.5) * 0.7 + bp(x, 3100 * tone, 0.45) * 0.35 + lp(x, 2400 * tone, 0.1) * 0.35
    y += bp(noise(n, seed + 5), 2200, 0.3) * (0.05 + 0.3 * lp1(puff, 25.0))
    y = y * amp; y = lp(y, 1800 + 3800 * tone * lp1(np.r_[np.zeros(64), amp], 20.0)[64:], 0.1)
    return t0, sat(y * 1.2, 2.0) * 0.6

def jangle(f, dur, seed=0, bright=0.7):   # one course of a twelve-string: the string and its octave (a hair sharp), bright, a little body
    y = pluck(f, dur, 10 ** (-3 / (f * 1.8)), bright, seed, 0.12) + 0.6 * pluck(f * 2.003, dur, 10 ** (-3 / (f * 2 * 1.2)), min(0.95, bright + 0.1), seed + 1, 0.1)
    return hp(y, 160) * 0.6 + bp(y, 2600, 0.4) * 0.3

def pub_bass(f, dur, bright=1.0, drive=2.0):   # the driving eighths: a saw and a sine, a plucky filter, driven
    n = int((dur + 0.04) * SR); t = np.arange(n) / SR; x = saw(f, n) * 0.6 + sine(f, n) * 0.6
    return sat(lp(x, 170 + (550 + 1500 * np.exp(-t / 0.04)) * bright, 0.25), drive) * adsr(n, 0.003, 0.13, 0.75, 0.04, gate=dur)

def jingle_stick(seed=0, g_thump=1.0):   # a pole of jingles stamped on the floor: the thump and the jingles' shiver
    n = int(0.3 * SR); t = np.arange(n) / SR; j = np.zeros(n)
    for k, fr in enumerate((3900, 5200, 6900, 8800)): j += bp(noise(n, seed * 7 + k), fr, 0.8)
    th = (sine(115 * (1 + 0.6 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.05) + bp(noise(n, seed), 650, 0.5) * np.exp(-t / 0.02) * 0.5) * g_thump
    return th * 0.8 + hp(j, 3500) * (np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.07) + 0.3 * np.exp(-t / 0.16)) * 0.55

def cicadas(dur, seed=0):   # a summer afternoon: two choruses of a buzzing band (pulsing ~50 times a second), swelling and fading (stereo)
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        rate = 47 + 6 * k; pulses = (0.5 + 0.5 * np.sin(TAU * rate * t + 1.3 * k)) ** 3
        swell = np.clip(np.sin(TAU * t / (7.5 + 2.2 * k) + 1.1 + 2.1 * k), 0, None) ** 1.5
        fc = 5200 + 600 * k + 200 * np.sin(TAU * t / 3.1 + k)
        out.append(bp(noise(n, seed + k), fc, 0.75) * pulses * swell)
    return tuple(out)

def bellbird(seed=0):   # a far bell-like call: a high clear 'tink' falling a little, and its echo off the gully
    n = int(0.6 * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); f0 = r.uniform(2700, 3300)
    x = sine(f0 * (1 - 0.04 * np.clip(t / 0.05, 0, 1)), n) * np.exp(-t / 0.07) * np.clip(t / 0.002, 0, 1)
    return x + np.r_[np.zeros(int(0.18 * SR)), x[:n - int(0.18 * SR)]] * 0.3

def impact_a(dur=3.0, seed=0):   # the boom on the drop and the landing, tuned to A
    n = int(dur * SR); t = np.arange(n) / SR
    return np.tanh(sine(55.0 * (1 + 2.0 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.65) * 1.8) * 0.65 + lp(noise(n, seed), 1100) * np.exp(-t / 0.3) * 0.35

def rev_cymbal(dur, seed=0): x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def tom_(f, seed=0, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    body = sine(f * (1 + 0.5 * np.exp(-t / 0.035)), n) * np.exp(-t / 0.18) + 0.3 * sine(f * 1.6 * (1 + 0.4 * np.exp(-t / 0.03)), n) * np.exp(-t / 0.09)
    return sat(body + bp(noise(n, seed), 1500, 0.3) * np.exp(-t / 0.012) * 0.45, 1.4)

# ================================================================ harmony ========================================================
CH = {'Aadd9':   (45, [57, 64, 69, 71, 73]),     # A3 E4 A4 B4 C#5 (the globe: the B-C# rub shimmers like heat)
      'Dadd9/A': (45, [57, 62, 66, 69, 76]),     # A3 D4 F#4 A4 E5
      'F#m7':    (42, [57, 61, 64, 69]),         # A3 C#4 E4 A4 over F#
      'Dmaj7':   (38, [57, 61, 66, 69]),         # A3 C#4 F#4 A4 over D
      'A/C#':    (37, [57, 64, 69, 73]),         # A3 E4 A4 C#5 over C#
      'Bm':      (47, [59, 62, 66, 71]),
      'Esus4':   (40, [59, 64, 69, 71]),         # B3 E4 A4 B4
      'E':       (40, [59, 64, 68, 71]),         # B3 E4 G#4 B4
      'A':       (45, [61, 64, 69, 73]),         # C#4 E4 A4 C#5
      'D':       (38, [62, 66, 69, 74]),         # D4 F#4 A4 D5
      'F#m':     (42, [61, 66, 69, 73]),         # C#4 F#4 A4 C#5
      'G':       (43, [59, 62, 67, 71])}         # B3 D4 G4 B4 (the mixolydian flat seventh)
CHORDS = [(-40, -32, 'Aadd9'), (-32, -24, 'Dadd9/A'), (-24, -20, 'F#m7'), (-20, -16, 'Dmaj7'), (-16, -12, 'A/C#'), (-12, -8, 'Dmaj7'),
          (-8, -4, 'Bm'), (-4, -2, 'Esus4'), (-2, 0, 'E'),                                       # the globe: I, IV/I, vi, IV, I6, IV, ii, V
          (0, 4, 'A'), (4, 8, 'D'), (8, 12, 'F#m'), (12, 16, 'E'),                               # A:  I IV vi V
          (16, 20, 'A'), (20, 24, 'D'), (24, 28, 'G'), (28, 32, 'E'),                            # A': I IV bVII V
          (32, 36, 'F#m'), (36, 40, 'D'), (40, 42, 'Esus4'), (42, 44, 'E'),                      # breath: vi IV V
          (44, 48, 'D'), (48, 52, 'A/C#'), (52, 56, 'Bm'), (56, 60, 'E'),                        # chorus: IV I6 ii V
          (60, 74, 'A')]                                                                         # -> I: the landing
def chord_at(beat): return next(c for s, e, c in CHORDS if s <= beat < e)
PANS = {4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8)}

# ================================================================ the tunes: (beat, beats, midi[, how[, velocity]]) =================
def bar_(start, cells):   # cells: (beats, midi[, how]) one after the other from `start`
    out, p = [], start
    for c in cells: out.append((p, c[0], c[1], c[2] if len(c) > 2 else 'p')); p += c[0]
    return out
H0 = [(.5, 76), (.5, 81), (.75, 83, 'b'), (.25, 81, 'l'), (1, 78), (.5, 76), (.5, 73)]           # A:   up a fourth, the bend, down
H1 = [(1.5, 74, 'b'), (.5, 76), (.5, 78, 'l'), (.5, 81), (1, 78)]                                # D
H2 = [(.5, 81), (.5, 85), (.75, 83, 'b'), (.25, 81, 'l'), (1, 78), (.5, 76), (.5, 78)]           # F#m
H3 = [(1.5, 80, 'b'), (.5, 78), (1, 76), (.5, 71), (.5, 73)]                                     # E
H6 = [(.5, 79), (.5, 83), (.75, 86, 'b'), (.25, 83, 'l'), (1, 79), (.5, 74), (.5, 76)]           # G
H7 = [(2, 80, 'b'), (.5, 83), (.5, 80, 'l'), (.5, 78), (.5, 76)]                                 # E
LEAD = bar_(0, H0 + H1 + H2 + H3) + bar_(16, H0 + H1 + H6 + H7)
BREATH = [(32.5, 2.5, 81, 'w', 0.8), (35.0, 1.0, 78, 'l', 0.75), (36.0, 1.5, 81, 'b', 0.8), (37.5, 0.5, 78, 'l', 0.75), (38.0, 2.0, 76, 'w', 0.75),
          (41.0, 3.0, 76, 'w', 0.85)]
CHORUS = bar_(44, [(1, 81), (.5, 78), (.5, 81), (1.5, 86, 'b'), (.5, 85),                        # D:    the climb, step by step
                   (1, 85), (.5, 81), (.5, 85), (1.5, 88, 'b'), (.5, 86),                        # A/C#
                   (1, 86), (.5, 83), (.5, 86), (1.5, 90, 'b'), (.5, 88),                        # Bm:   to the high F#
                   (1, 88), (.5, 86), (.5, 85), (1, 83), (.5, 80), (.5, 83, 'l'),                # E:    coasting down
                   (4, 81, 'b')])                                                                # the A on the race's start
FAR = [(-36.0, 2.0, 76, 'w', 0.7), (-34.0, 2.0, 81, 'b', 0.75), (-32.0, 4.0, 78, 'w', 0.8), (-28.0, 2.0, 76, 'p', 0.7), (-26.0, 2.0, 74, 'l', 0.7),
       (-24.0, 3.0, 73, 'b', 0.75), (-21.0, 1.0, 76, 'l', 0.7), (-20.0, 4.0, 78, 'w', 0.8)]
for nt in LEAD + BREATH + CHORUS + FAR:   # (a check: no held note sits a half step above a chord tone)
    c = chord_at(nt[0]); pcs = {CH[c][0] % 12} | {m % 12 for m in CH[c][1]}
    assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)
assert abs(sum(c[0] for c in H0 + H1 + H2 + H3) - 16) < 1e-9 and abs(sum(c[0] for c in H6 + H7) - 8) < 1e-9

drums, snr, perc, bass, pad, gtr, lead, far, fx = (S.bus(x) for x in 'drums snare perc bass pad gtr lead far fx'.split())
kicks = []

# ================================================================ players ========================================================
KICK = kick(0.36, f0=145, f1=47, sweep=0.038, click=0.55, drive=1.7)
SNARE = [snare(0.3, tone=184, snappy=0.9, seed=k) for k in (4, 9)]; GHOST = snare(0.12, tone=205, snappy=0.55, seed=12)
HH = [hat(0.045, seed=k, tone=8800) for k in range(4)]; OH = [hat(open_=True, seed=k + 20, tone=7600) for k in range(2)]
JS = [jingle_stick(k) for k in range(3)]; SHK = [shaker(0.08, seed=k) for k in range(4)]
TOM = {k: tom_(f, i) for i, (k, f) in enumerate((('hi', 196), ('mid', 156), ('lo', 131), ('fl', 98)))}
def K(beat, g=0.5): drums.add(KICK, T(beat), g); kicks.append(T(beat))
def SN(beat, g=0.5, pan=0.0): snr.add(SNARE[int(beat * 2) % 2], T(beat), g * hum(0.04), pan)
def roll(b0, b1, div, g0, g1, tone0=180, tone1=230):
    k_ = int(round((b1 - b0) * div))
    for k in range(k_):
        x = k / max(1, k_ - 1); snr.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, snappy=0.75, seed=k % 13), T(b0 + k / div), (g0 + (g1 - g0) * x ** 1.5) * hum(0.06), 0.05)

ARP = (0, 2, 1, 3, 2, 4, 3, 2)   # the picking order through the chord (low to high: the root an octave up, then the voices)
def arp_bar(bar, g=0.2, step=1, bright=0.7, pan=0.35, until=None, g_end=None):
    for k in range(0, 8, step):
        beat = 4 * bar + k / 2
        if until is not None and beat >= until: break
        c = chord_at(beat); vs = [CH[c][0] + 12] + CH[c][1]; m = vs[min(len(vs) - 1, ARP[k])]
        gk = g if g_end is None else g + (g_end - g) * k / 7
        gtr.add(jangle(mtof(m), 0.9, seed=int(rng.integers(1 << 30)), bright=bright), T(beat) + rng.normal(0, 0.003), gk * (1.0 if k % 2 == 0 else 0.75) * hum(0.07),
                pan=float(np.clip(pan + 0.12 * (ARP[k] - 2), -0.9, 0.9)))

def bass_bar(bar, gain, style='drive', bright=1.0, upto=4.0):
    for k in range(8):
        beat = 4 * bar + k / 2
        if k / 2 >= upto: break
        root = CH[chord_at(beat)][0]; nxt = CH[chord_at(beat + 0.5)][0]
        m = root + (12 if style == 'octave' and k % 2 else 0)
        if style != 'drive' and k == 7 and nxt != root: m = nxt + (2 if nxt < root else -2) if (nxt + (2 if nxt < root else -2) - 45) % 12 in (0, 2, 4, 5, 7, 9, 10, 11) else nxt + (1 if nxt < root else -1)
        bass.add(pub_bass(mtof(m), b * 0.42, bright), T(beat), gain * (1.0, 0.7, 0.85, 0.7, 0.95, 0.7, 0.85, 0.78)[k] * hum(0.04))

def pad_chords(b0, b1, gain, cutoff=6000, a=0.08, r=0.5, strings=0.0):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        vs = CH[c][1]
        for j, m in enumerate(vs):
            pad.add(voice_pad(mtof(m), (e0 - s0) * b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=m + 3 * j), T(s0), gain, pan=PANS[len(vs)][j])
            if strings and j >= len(vs) - 2: pad.add(voice_strings(mtof(m + 12), (e0 - s0) * b, a=0.2, r=0.6, bright=3400), T(s0), strings, pan=PANS[len(vs)][j] * 0.8)

# ================================================================ INTRO: the globe (bars -10..-1) ================================
cl, cr = cicadas(T(-2) + 0.5, seed=17); cg = ramp(len(cl), [(0, 0), (0.4, 0), (3.0, 1.0), (T(-12), 1.0), (T(-6), 0.5), (T(-2), 0.0), (99, 0)])
fx.add((cl * cg, cr * cg), 0.0, 0.07)
for bt, p in ((-38.5, -0.6), (-37.8, -0.6), (-31.0, 0.55), (-25.5, -0.35), (-24.9, -0.35), (-18.0, 0.6)): far.add(bellbird(int(-bt * 10)), T(bt), 0.045, pan=p)
pad_chords(-40, -32, 0.3, a=2.6, r=1.6); pad_chords(-32, -16, 0.3, a=0.7, r=1.6); pad_chords(-16, 0, 0.3, a=0.5, r=0.8)
bass.add(voice_sub(mtof(45), 7.5, a=2.5, r=2.0), T(-40), 0.015)
t0, x = harmonica(FAR, tone=0.7, trem=0.4, seed=4); far.add(x, t0, 0.12, pan=-0.1)   # the harmonica far away
for bar in range(-6, 0): arp_bar(bar, 0.09 + 0.02 * (bar + 6), step=2 if bar < -3 else 1, bright=0.5 + 0.04 * (bar + 6), pan=0.0, until=-0.5)
for bar in (-5, -4):
    for k in (0, 2): drums.add(lp(KICK, 280), T(4 * bar + k), 0.2 + 0.04 * (bar + 5))
for bar in range(-4, 0): bass_bar(bar, 0.11 + 0.04 * (bar + 4), bright=0.3 + 0.17 * (bar + 4), upto=3.5 if bar == -1 else 4)
for k in range(8): perc.add(SHK[k % 4], T(-12 + k / 2 + 0.5), 0.07, pan=-0.4)
for k in range(16): perc.add(HH[k % 4], T(-8 + k / 2), (0.03 + 0.005 * k) * (1.3 if k % 2 else 0.8), pan=-0.3)
for k in range(8): K(-8 + k, 0.34 + 0.012 * k)
roll(-8, -4, 2, 0.05, 0.14); roll(-4, -1, 4, 0.14, 0.3); roll(-1, -0.25, 8, 0.3, 0.38)
fx.add(riser(2 * B, f0=250, f1=9000, seed=3), T(-8), 0.3); fx.add(rev_cymbal(b * 1.5, seed=5), T(-1.5), 0.3)

# ================================================================ MAIN (bars 0..14) ==============================================
fx.add(impact_a(3.0, seed=1), T(0), 0.5); perc.add(crash(2.8, seed=31), T(0), 0.32, pan=-0.35); perc.add(crash(2.8, seed=32), T(0), 0.26, pan=0.35)
for bar in range(N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 11 else 'CH'; t4 = 4 * bar
    if sec in ('A', 'A2'):   # pub rock: kick 1, 3 and the push before 3, snare 2 and 4, eighth hats
        for k in ((0, 1.5, 2) if bar % 2 == 0 else (0, 2, 2.5)): K(t4 + k, 0.5 if k in (0, 2) else 0.34)
        SN(t4 + 1); SN(t4 + 3)
        for k in range(8):
            if bar in (3, 7) and k >= (6 if bar == 3 else 4): continue
            o = k == 7 and bar % 2 == 1
            perc.add(OH[bar % 2] if o else HH[k % 4], T(t4 + k / 2) + rng.normal(0, 0.002), (0.1 if o else (0.13 if k % 2 == 0 else 0.09)) * hum(0.1), pan=-0.3)
        snr.add(GHOST, T(t4 + 2.75), 0.07 * hum(0.2), 0.08)
        if sec == 'A2':
            for k in (1, 3): perc.add(JS[k % 3], T(t4 + k), 0.3 * hum(0.08), pan=0.45)
            for k in (0.5, 1.5, 2.5, 3.5): perc.add(JS[2], T(t4 + k), 0.12 * hum(0.1), pan=0.45)
    elif sec == 'BR':
        if bar == 8:
            K(t4, 0.45); perc.add(crash(2.6, seed=8), T(t4), 0.22, pan=-0.3); fx.add(downlifter(B, seed=2), T(t4), 0.2)
            for k in range(8): perc.add(SHK[k % 4], T(t4 + k / 2 + 0.5), 0.08 * hum(0.1), pan=-0.4)
        elif bar == 9:
            for k in (0, 2): K(t4 + k, 0.3)
            for k in range(8): perc.add(SHK[k % 4], T(t4 + k / 2 + 0.5), 0.09 * hum(0.1), pan=-0.4)
        else:
            for k in range(4): K(t4 + k, 0.32 + 0.05 * k)
            for k in range(8): perc.add(HH[k % 4], T(t4 + k / 2), (0.05 + 0.008 * k) * (1.2 if k % 2 else 0.8), pan=-0.3)
            roll(t4 + 1, t4 + 2, 4, 0.08, 0.14); roll(t4 + 2, t4 + 3.75, 8, 0.14, 0.34)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.24); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.28)
    else:                    # the chorus: four on the floor, snare and clap, open hats on the offbeats, the jingle stick on every beat
        for k in range(4): K(t4 + k, 0.52)
        if bar % 2: K(t4 + 3.5, 0.28)
        for k in (1, 3): SN(t4 + k, 0.56); drums.add(clap(seed=bar + k), T(t4 + k), 0.2, pan=0.1 * (k - 2))
        for k in range(8):
            if bar == 14 and k >= 4: continue
            perc.add(OH[k % 2] if k % 2 else HH[k % 4], T(t4 + k / 2), 0.1 if k % 2 else 0.11, pan=0.35)
        for k in range(4): perc.add(JS[k % 3], T(t4 + k), (0.32 if k % 2 else 0.22) * hum(0.08), pan=0.45)
    if bar in (4, 11, 13): perc.add(crash(2.6, seed=bar), T(t4), 0.3 if bar != 13 else 0.24, pan={4: -0.3, 11: 0.0, 13: 0.35}[bar])
    if bar == 3: SN(t4 + 3.5, 0.32); drums.add(TOM['hi'], T(t4 + 3.5), 0.32, pan=0.3); drums.add(TOM['mid'], T(t4 + 3.75), 0.36, pan=0.0)
    if bar == 7:
        for k, s in enumerate(('hi', 'hi', 'mid', 'mid', 'lo', 'lo', 'fl', 'fl')): drums.add(TOM[s], T(t4 + 2 + k / 4), 0.13 + 0.017 * k, pan=(0.45, 0.4, 0.15, 0.1, -0.2, -0.25, -0.45, -0.5)[k])
    if bar == 12: SN(t4 + 3.5, 0.3); SN(t4 + 3.75, 0.36)
    if bar == 14:
        for k, s in enumerate(('sn', 'hi', 'sn', 'mid', 'sn', 'lo', 'fl', 'fl')):
            if s == 'sn': SN(t4 + 2 + k / 4, 0.24 + 0.03 * k)
            else: drums.add(TOM[s], T(t4 + 2 + k / 4), 0.2 + 0.022 * k, pan=(0.4, 0.4, 0.1, 0.1, -0.2, -0.2, -0.4, -0.45)[k])
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.3)
    # --- bass, the twelve-string
    if sec == 'A': bass_bar(bar, 0.34, 'drive', bright=0.9); arp_bar(bar, 0.2)
    elif sec == 'A2': bass_bar(bar, 0.34, 'walk', bright=1.0); arp_bar(bar, 0.22, pan=0.4)
    elif sec == 'CH': bass_bar(bar, 0.34, 'octave', bright=1.1); arp_bar(bar, 0.24, bright=0.8, pan=0.4, until=LAND); arp_bar(bar, 0.12, bright=0.85, pan=-0.5, until=LAND, step=2)
    elif bar == 8: bass.add(pub_bass(mtof(42), 4 * b - 0.1, bright=0.3, drive=1.3), T(t4), 0.14); arp_bar(bar, 0.12, step=2, pan=0.0)
    elif bar == 9: bass.add(pub_bass(mtof(38), 4 * b - 0.1, bright=0.3, drive=1.3), T(t4), 0.15); arp_bar(bar, 0.13, pan=0.0)
    else: bass_bar(bar, 0.26, 'drive', bright=0.7); arp_bar(bar, 0.13, pan=0.0, g_end=0.24)
pad_chords(0, 16, 0.22); pad_chords(16, 32, 0.26); pad_chords(32, 44, 0.28, a=0.6, r=0.9); pad_chords(44, LAND, 0.34, strings=0.2)
t0, x = harmonica(LEAD, seed=1); lead.add(chorus(x, 0.0012, 0.3, 0.18), t0, 0.3, pan=0.05)
t0, x = harmonica(BREATH, tone=0.85, seed=2); lead.add(x, t0, 0.26, pan=0.0)
t0, x = harmonica(CHORUS, seed=3); lead.add(chorus(x, 0.0015, 0.3, 0.22), t0, 0.32, pan=0.05)
t0, x = harmonica([(nt[0], nt[1], nt[2] - 12) + nt[3:] for nt in CHORUS], tone=0.85, seed=5); lead.add(x, t0, 0.15, pan=-0.42)   # the second harmonica, an octave down

# ================================================================ LANDING: bar 15 = 48.2 s, the race starts ======================
L0 = T(LAND)
K(LAND, 0.8); snr.add(SNARE[0], L0, 0.45); drums.add(TOM['fl'], L0, 0.4, pan=-0.2); fx.add(impact_a(3.0, seed=4), L0, 0.5)
perc.add(crash(3.2, seed=21), L0, 0.36, pan=-0.35); perc.add(crash(3.2, seed=22), L0, 0.3, pan=0.35); perc.add(JS[0], L0, 0.35, pan=0.45)
for j, m in enumerate([45, 52, 57, 61, 64, 69]):   # the A chord, wide, and the twelve-string's strum down across it
    pad.add(voice_pad(mtof(m + 12 if j < 2 else m), 1.3, cutoff=6000, a=0.008, r=1.3, voices=5, seed=m), L0, 0.28, pan=(-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)[j])
    gtr.add(jangle(mtof(m), 2.6, seed=300 + j, bright=0.75), L0 + 0.016 * j, 0.24, pan=0.35 - 0.14 * j)
lb = pub_bass(mtof(45), 2.2, bright=0.8); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass.add(lb, L0, 0.5)

# ================================================================ MIX =============================================================
bass.curve(S.sidechain(kicks, depth=0.5, release=0.15)); pad.curve(S.sidechain(kicks, depth=0.35, release=0.2)); gtr.curve(S.sidechain(kicks, depth=0.15, release=0.1))
fc = curve([(0, 450), (T(-28), 700), (T(-16), 1100), (T(-8), 1700), (T(-0.1), 4200), (T(0), 3400), (T(16), 3800), (T(30), 3800), (T(32) + 0.1, 1300),
            (T(40), 2000), (T(44) - 0.05, 5200), (T(44), 4600), (S.len, 6000)])
pad.L = lp(pad.L, fc, 0.12); pad.R = lp(pad.R, fc, 0.12)
fg = curve([(0, 1800), (T(-12), 2600), (T(-4), 5500), (T(0), 14000), (S.len, 14000)]); gtr.L = lp(gtr.L, fg, 0.05); gtr.R = lp(gtr.R, fg, 0.05)
pad.filt(lambda x: hp1(x, 150)); gtr.filt(lambda x: hp1(x, 150)); bass.filt(lambda x: hp1(x, 35))
pad.width(1.55); gtr.width(1.6)
lead.curve(curve([(0, 1.0), (T(31.9), 1.0), (T(32.4), 0.75), (T(43.8), 0.75), (T(44), 1.15), (T(LAND) + 0.5, 1.15), (S.len - 0.25, 0.1), (S.len, 0.1)]))
verb_in = S.bus()
for x, a in ((pad, 0.3), (lead, 0.2), (gtr, 0.16), (far, 0.6), (snr, 0.1), (fx, 0.15), (perc, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=3.0, damp=0.3, predelay=0.025)
dl = lead.send_delay(b * 0.75, 0.16, fb=0.33, damp=0.45); dg = gtr.send_delay(b * 0.75, 0.1, fb=0.3, damp=0.5); df = far.send_delay(b * 1.0, 0.4, fb=0.55, damp=0.4)
if '--stems' in sys.argv:
    for nm_, x in (('drums', drums), ('snare', snr), ('perc', perc), ('bass', bass), ('pad', pad), ('gtr', gtr), ('lead', lead), ('far', far), ('fx', fx),
                   ('verb', type('v', (), {'L': vl, 'R': vr}))):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:7s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
TRIM = 0.63
ALL = (drums, snr, perc, bass, pad, gtr, lead, far, fx, (vl, vr), dl, dg, df)
mL = sum(x[0] if isinstance(x, tuple) else x.L for x in ALL) * TRIM
mR = sum(x[1] if isinstance(x, tuple) else x.R for x in ALL) * TRIM
mL, mR = mL + 0.28 * bp(mL, 2600, 0.25), mR + 0.28 * bp(mR, 2600, 0.25)
res = S.master([(mL, mR)], HERE + '/out/australia', lufs=-11.3, ceiling=-1.1, highs_db=1.0, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
