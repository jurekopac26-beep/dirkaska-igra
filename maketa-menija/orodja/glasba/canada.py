"""Canada (Montréal, Toronto, Trois-Rivières: the island circuit in the St. Lawrence, the lakeshore streets, the old fairground): a
kitchen-party jig turned into a stadium anthem. A fiddle (one bowed string per phrase: its pitch glides from note to note, the bow
changes dip the tone, the cuts flick a step up, the long notes get vibrato late), a musette accordion vamping the off-beats, a strummed
steel-string guitar, the feet keeping time on a wooden floor (heel on the beat, toe on the last triplet), a bouncy bass, wide pads and,
from the drop, a modern drum kit on the jig's triplet grid. D major, 119.15 bpm with every beat in three (a 12/8 jig): 14 bars from
the drop to the race's start.
The hook is a 'lap': a rising arpeggio, a turn at the top, back down to where it started (round the island and back), first quick,
then in the chorus at half speed an octave higher; its last note lands on the high D at the race's start.
Over the globe a loon-like call far over the water (two gliding sines, nothing recorded), the fiddle's slow air, then the feet start.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations, no anthem).

    intro (the globe)  bars -10..-1  the lake (wind, the call), the pad, the fiddle's slow air far away, the feet, the guitar, the build
    drop  (20.0 s)     bar 0         the jig and the hook
    A bars 0-3, A' 4-7 (the accordion and the tambourine join), breath 8-9 (the drums out, the slow air again; the build back),
    chorus 10-13 (four on the floor, the hook at half speed, an octave up, the accordion doubling it), LANDING at bar 14 = 48.2 s
"""
import sys, json, math, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 14                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 119.15 bpm
B, b = S.bar, S.beat
LAND = 4 * N                                 # the landing, in beats from the drop
def T(beat): return S.drop + beat * b        # beats from the drop (negative: the intro) -> seconds
assert abs(S.main_bars - N) < 1e-9 and abs(T(LAND) - END) < 1e-9
rng = np.random.default_rng(11)
def hum(x=0.08): return 1 + rng.uniform(-x, x)
def curve(points): tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
def ramp(n, points): tp, vp = zip(*points); return np.interp(np.arange(n) / SR, tp, vp)
D_MAJ = [2, 4, 6, 7, 9, 11, 1]               # the key's pitch classes (for the cuts: the next scale step up)
def step_up(m): return next(m + k for k in (1, 2) if (m + k) % 12 in D_MAJ)

# ================================================================ instruments ===================================================
def fiddle(notes, tone=1.0, vib=0.16, seed=0, tail=0.35):
    """one bowed string per phrase. notes: (beat, beats, midi[, how[, velocity]]); how: 'b' a new bow (the tone dips and bites
    again), 'l' slurred (the same bow: only the pitch moves), 'c' a cut (a flick to the next step up on the attack), 's' slid into
    from the note before (slowly). A sawtooth and a narrow pulse (the stick-slip of the bow on the string), the bow's hiss, a
    wooden body (four resonances), a little drive. Returns (start s, mono)."""
    t0 = T(notes[0][0]) - 0.04; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed); idx = lambda beat: int(round((T(beat) - t0) * SR))
    pitch = np.zeros(n); amp = np.zeros(n); vd = np.zeros(n); bite = np.zeros(n)
    for i, nt in enumerate(notes):
        bt, ln, m = nt[:3]; how = nt[3] if len(nt) > 3 else 'b'; vel = nt[4] if len(nt) > 4 else 1.0
        a = idx(bt); e = idx(bt + ln); nx = idx(notes[i + 1][0]) if i + 1 < len(notes) else n
        pitch[a:] = m
        if how == 'c': k = int(0.045 * SR); pitch[a:a + k] = step_up(m)
        if how == 's' and i > 0: k = int(0.11 * SR); m0 = notes[i - 1][2]; pitch[a:a + k] = m0 + (m - m0) * (0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, k)))
        joined = nx - e < int(0.01 * SR)                         # (the next note follows straight on: the bow keeps going)
        end = nx if joined else min(n, e + int(0.05 * SR))
        lvl = np.full(end - a, vel)
        if how in 'bc': k = min(end - a, int(0.03 * SR)); lvl[:k] *= 0.45 + 0.55 * np.linspace(0, 1, k) ** 0.7; bite[a:a + int(0.04 * SR)] += vel
        if not joined: k = min(end - a, int(0.06 * SR)); lvl[-k:] *= np.linspace(1, 0, k) ** 1.5
        amp[a:end] = np.maximum(amp[a:end], lvl)
        if (e - a) / SR > 0.45:                                    # the vibrato, late in the long notes
            v0 = a + int(0.2 * SR); vd[v0:e] = vib * np.clip((np.arange(e - v0) / SR) / 0.3, 0, 1)
    k = int(0.006 * SR); g = np.ones(k) / k; pitch = np.convolve(np.r_[np.full(k, pitch[0]), pitch], g, 'same')[k:]   # (12 ms glides between notes)
    amp = lp1(np.r_[np.zeros(64), amp], 70.0)[64:]
    f = mtof(pitch + vd * np.sin(np.cumsum(TAU * (5.9 + 0.4 * np.sin(TAU * 0.3 * t)) / SR)))
    x = saw(f, n, r.random()) * 0.62 + pulse(f, n, 0.14, r.random()) * 0.38
    x += bp(noise(n, seed + 3), 3200, 0.3) * (0.07 + 0.25 * lp1(bite, 30.0))      # the bow's hiss and its bite on the attack
    body = bp(x, 290, 0.6) * 0.8 + bp(x, 520, 0.55) * 0.6 + bp(x, 1100, 0.5) * 0.45 + bp(x, 2900 * tone, 0.55) * 0.75 + lp(x, 5200 * tone, 0.1) * 0.25
    return t0, sat(body * amp, 1.6) * 0.7

def accordion(f, dur, a=0.012, r=0.07, bright=1.0):
    """a musette accordion: three reeds per note (one in tune, one a little sharp, one a little flat: the wet tremolo), a reed's narrow
    pulse through the box's resonance"""
    n = int((dur + r) * SR); x = np.zeros(n)
    for dt, g in ((0.0, 1.0), (0.0042, 0.8), (-0.0036, 0.7)): x += pulse(f * (1 + dt), n, 0.27) * g
    x = lp(x, 3000 * bright, 0.1) * 0.6 + bp(x, 1250, 0.45) * 0.5 + bp(x, 2400, 0.5) * 0.25
    return x * adsr(n, a, 0.08, 0.9, r, gate=dur) * 0.4

def guitar(f, dur, seed=0, bright=0.6):   # one steel string: a bright pluck, the body's warmth
    y = pluck(f, dur, 10 ** (-3 / (f * 2.2)), bright, seed, 0.18); return hp(y, 90) * 0.7 + bp(y, 220, 0.4) * 0.4

def strum(m_list, t, bus, gain, down=True, spread=0.011, dur=0.6, pan=0.3, bright=0.6):
    order = m_list if down else m_list[::-1]
    for j, m in enumerate(order):
        bus.add(guitar(mtof(m), dur, seed=int(rng.integers(1 << 30)), bright=bright), t + j * spread + rng.normal(0, 0.002), gain * (1 - 0.06 * j) * hum(0.06), pan=pan + 0.08 * (j - 2))

def heel(seed=0):   # the heel on a wooden floor: a dull thump and the boards' ring
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (sine(78 * (1 + 0.8 * np.exp(-t / 0.012)), n) * np.exp(-t / 0.07) + bp(noise(n, seed), 240, 0.6) * np.exp(-t / 0.03) * 0.6) * 0.9
def toe(seed=0):    # the toe's tap
    n = int(0.08 * SR); t = np.arange(n) / SR; return (bp(noise(n, seed), 1300, 0.5) + bp(noise(n, seed + 1), 420, 0.6) * 0.6) * np.exp(-t / 0.012)

def bass_note(f, dur, bright=1.0):   # a round, bouncy bass (a sine and a soft saw, a plucky filter)
    n = int((dur + 0.04) * SR); t = np.arange(n) / SR; x = saw(f, n) * 0.45 + sine(f, n) * 0.75 + pulse(f, n, 0.3) * 0.12
    return sat(lp(x, 160 + (500 + 1400 * np.exp(-t / 0.05)) * bright, 0.2), 1.7) * adsr(n, 0.003, 0.12, 0.7, 0.04, gate=dur)

def loon(dur, f0, seed=0):   # a call far over the water: a sine gliding up a fifth and back, wavering (stereo: two slightly different)
    n = int(dur * SR); x = np.linspace(0, 1, n); out = []
    for k in range(2):
        shape = np.interp(x, [0, 0.12, 0.45, 0.62, 0.85, 1], [0, 0.0, 7.0, 7.0, 5.0, 4.6])
        fr = f0 * 2 ** ((shape + 0.12 * np.sin(TAU * 6.2 * x * dur + k)) / 12)
        env = np.interp(x, [0, 0.08, 0.5, 0.85, 1], [0, 1, 0.85, 0.6, 0]) ** 1.3
        out.append((sine(fr, n) + 0.12 * sine(fr * 2, n) + 0.05 * sine(fr * 3, n)) * env)
    return tuple(out)

def lake(dur, seed=0):   # the wind over the water: two slowly wandering bands of noise, low (stereo)
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = 420 * 2 ** (0.9 * np.sin(TAU * t / (11.0 + 3 * k) + k) + 0.3 * np.sin(TAU * t / 4.1 + 2 * k))
        out.append(bp(noise(n, seed + k), fc, 0.6) * (0.7 + 0.3 * np.sin(TAU * t / 5.3 + k)))
    return tuple(out)

def impact_d(dur=3.0, seed=0):   # the boom on the drop and the landing, tuned to D
    n = int(dur * SR); t = np.arange(n) / SR
    return np.tanh(sine(73.4 * (1 + 1.8 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.6) * 1.8) * 0.6 + sine(36.7, n) * np.exp(-t / 0.55) * np.clip(t / 0.008, 0, 1) * 0.3 \
        + lp(noise(n, seed), 1200) * np.exp(-t / 0.3) * 0.35

def rev_cymbal(dur, seed=0): x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def tamb(seed=0, dur=0.16):
    n = int(dur * SR); t = np.arange(n) / SR; j = np.zeros(n)
    for k, fr in enumerate((5100, 6400, 7900, 9600)): j += bp(noise(n, seed * 5 + k), fr, 0.85)
    return hp(j, 4500) * (np.clip(t / 0.0015, 0, 1) * np.exp(-t / 0.045) + 0.2 * np.exp(-t / 0.1)) * 0.6

# ================================================================ harmony ========================================================
CH = {'Dadd9':  (38, [50, 57, 64, 66, 69]),      # D3 A3 E4 F#4 A4 (the globe: open, the E-F# rub)
      'Gmaj7/D': (38, [50, 59, 62, 66, 67]),     # D3 B3 D4 F#4 G4
      'Bm7':    (47, [57, 62, 66, 69]),          # A3 D4 F#4 A4 over B
      'G':      (43, [59, 62, 67, 71]),          # B3 D4 G4 B4
      'D/F#':   (42, [57, 62, 66, 69]),          # A3 D4 F#4 A4 over F#
      'Em7':    (40, [59, 62, 67, 71]),          # B3 D4 G4 B4 over E
      'Asus4':  (45, [57, 62, 64, 69]),          # A3 D4 E4 A4
      'A':      (45, [57, 61, 64, 69]),          # A3 C#4 E4 A4
      'D':      (38, [57, 62, 66, 69]),          # A3 D4 F#4 A4
      'Bm':     (47, [59, 62, 66, 71]),          # B3 D4 F#4 B4
      'Em':     (40, [59, 64, 67, 71])}          # B3 E4 G4 B4
CHORDS = [(-36, -28, 'Dadd9'), (-28, -20, 'Gmaj7/D'), (-20, -16, 'Bm7'), (-16, -12, 'G'), (-12, -8, 'D/F#'), (-8, -4, 'Em7'),
          (-4, -2, 'Asus4'), (-2, 0, 'A'),                                                    # the globe: I, IV/I, vi, IV, I6, ii, V
          (0, 4, 'D'), (4, 8, 'Bm'), (8, 12, 'G'), (12, 16, 'A'),                              # A:  I vi IV V
          (16, 20, 'D'), (20, 24, 'Bm'), (24, 28, 'G'), (28, 30, 'Em7'), (30, 32, 'A'),        # A': I vi IV ii V
          (32, 36, 'Bm7'), (36, 40, 'G'),                                                      # breath: vi IV
          (40, 44, 'G'), (44, 48, 'D/F#'), (48, 52, 'Em'), (52, 56, 'A'),                      # chorus: IV I6 ii V
          (56, 70, 'D')]                                                                       # -> I: the landing
def chord_at(beat): return next(c for s, e, c in CHORDS if s <= beat < e)
PANS = {4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8)}
GTR = {'D': (50, 57, 62, 66, 69), 'Bm': (47, 54, 59, 62, 66), 'G': (43, 50, 55, 59, 67), 'A': (45, 52, 57, 61, 64), 'Em7': (40, 47, 50, 55, 59),
       'Bm7': (47, 54, 57, 62, 66), 'D/F#': (42, 50, 57, 62, 66), 'Em': (40, 47, 52, 55, 59), 'Asus4': (45, 52, 57, 62, 64),
       'Dadd9': (50, 57, 64, 66, 69), 'Gmaj7/D': (50, 55, 59, 66, 67)}

# ================================================================ the tunes: (beat, beats, midi[, how[, velocity]]) =================
def jig(start, cells):   # cells: (triplets, midi[, how]) one after the other from `start` (a triplet: a third of a beat)
    out, p = [], start
    for c in cells:
        k, m = c[0], c[1]; how = c[2] if len(c) > 2 else 'b'; out.append((p, k / 3, m, how)); p += k / 3
    return out
#   the hook: up the arpeggio, the turn at the top, back down (a lap); then its answer, a step higher, home again
HOOK = [(1, 69), (1, 74, 'l'), (1, 78, 'l'), (2, 81, 'c'), (1, 79), (1, 78), (1, 76, 'l'), (1, 74, 'l'), (2, 78), (1, 81),        # D
        (1, 83, 'c'), (1, 81), (1, 78, 'l'), (2, 74), (1, 78), (1, 76), (1, 74, 'l'), (1, 71, 'l'), (2, 74), (1, 76)]              # Bm
TURN = [(1, 79), (1, 83, 'l'), (1, 86, 'l'), (2, 83, 'c'), (1, 79), (1, 81), (1, 79, 'l'), (1, 78, 'l'), (2, 76), (1, 79),        # G
        (1, 81), (1, 85, 'l'), (1, 88, 'l'), (2, 86, 'c'), (1, 85), (1, 83), (1, 81, 'l'), (1, 79, 'l'), (3, 81)]                  # A
TURN2 = TURN[:10] + [(1, 79), (1, 78, 'l'), (1, 76, 'l'), (2, 79), (1, 83), (1, 81), (1, 79, 'l'), (1, 76, 'l'), (1, 73), (1, 76, 'l'), (1, 81, 'l')]   # G | Em7 A
LEAD = jig(0, HOOK + TURN) + jig(16, HOOK[:10] + [(1, 83, 'c'), (1, 81), (1, 78, 'l'), (2, 74), (1, 78), (1, 79), (1, 78, 'l'), (1, 76, 'l'), (2, 78), (1, 81)] + TURN2)
BREATH = [(32.0, 2.0, 78, 'b', 0.75), (34.0, 2.0, 81, 's', 0.8), (36.0, 2.67, 83, 'b', 0.85), (38.67, 0.33, 81, 'l', 0.8), (39.0, 0.67, 79, 'l', 0.8), (39.67, 0.33, 81, 'l', 0.85)]
CHORUS = [(40.0, 1.0, 86, 'b'), (41.0, 0.67, 83, 'l'), (41.67, 0.33, 81, 'l'), (42.0, 1.33, 79, 'b'), (43.33, 0.33, 81, 'l'), (43.67, 0.33, 83, 'l'),   # G
          (44.0, 1.0, 86, 'c'), (45.0, 0.67, 85, 'l'), (45.67, 0.33, 86, 'l'), (46.0, 1.33, 88, 'b'), (47.33, 0.33, 86, 'l'), (47.67, 0.33, 85, 'l'),   # D/F#
          (48.0, 1.0, 83, 'b'), (49.0, 0.67, 79, 'l'), (49.67, 0.33, 83, 'l'), (50.0, 1.33, 88, 'c'), (51.33, 0.67, 86, 'l'),                              # Em
          (52.0, 1.0, 85, 'b'), (53.0, 0.67, 88, 'l'), (53.67, 0.33, 86, 'l'), (54.0, 1.0, 85, 'b'), (55.0, 0.33, 81, 'l'), (55.33, 0.33, 85, 'l'),
          (55.67, 0.33, 88, 'l'), (LAND, 3.0, 86, 'b')]                                                                                                  # A -> the high D
FAR = [(-31.0, 2.0, 74, 'b', 0.7), (-29.0, 1.0, 76, 'l', 0.7), (-28.0, 3.0, 78, 'b', 0.8), (-25.0, 1.0, 74, 'l', 0.75), (-24.0, 4.0, 81, 's', 0.85),
       (-20.0, 2.0, 78, 'b', 0.75), (-18.0, 2.0, 74, 'l', 0.7), (-16.0, 3.0, 79, 'b', 0.8), (-13.0, 1.0, 78, 'l', 0.75), (-12.0, 4.0, 76, 'b', 0.75)]
for nt in LEAD + BREATH + CHORUS + FAR:   # (a check: no held note sits a half step above a chord tone)
    c = chord_at(nt[0]); pcs = {CH[c][0] % 12} | {m % 12 for m in CH[c][1]}
    assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)

drums, snr, perc, feet, bass, pad, acc, gtr, lead, far, fx = (S.bus(x) for x in 'drums snare perc feet bass pad acc gtr lead far fx'.split())
kicks = []

# ================================================================ players ========================================================
KICK = kick(0.34, f0=140, f1=48, sweep=0.04, click=0.5, drive=1.5)
SNARE = [snare(0.26, tone=196, snappy=0.85, seed=k) for k in (3, 8)]; CLAP = [clap(seed=k) for k in range(3)]
HH = [hat(0.045, seed=k, tone=8600) for k in range(4)]; OH = [hat(open_=True, seed=k + 20, tone=7400) for k in range(2)]
TAMB = [tamb(k) for k in range(4)]; HEEL = [heel(k) for k in range(3)]; TOE = [toe(k) for k in range(4)]
def K(beat, g=0.5): drums.add(KICK, T(beat), g); kicks.append(T(beat))
def SN(beat, g=0.45, pan=0.0): snr.add(SNARE[int(beat) % 2], T(beat), g * hum(0.04), pan)
def roll(b0, b1, div, g0, g1, tone0=185, tone1=235):
    k_ = int(round((b1 - b0) * div))
    for k in range(k_):
        x = k / max(1, k_ - 1); snr.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, snappy=0.75, seed=k % 13), T(b0 + k / div), (g0 + (g1 - g0) * x ** 1.5) * hum(0.06), 0.05)

def feet_bar(bar, g=0.4, toes=True, until=None):   # heel on each beat, the toe on the last triplet before the next (ta - - ka)
    for k in range(4):
        beat = 4 * bar + k
        if until is not None and beat >= until: break
        feet.add(HEEL[k % 3], T(beat) + rng.normal(0, 0.003), g * (1.0 if k % 2 == 0 else 0.85) * hum(0.06), pan=-0.15)
        if toes: feet.add(TOE[k % 4], T(beat + 2 / 3) + rng.normal(0, 0.003), g * 0.5 * hum(0.1), pan=0.15)

def vamp_bar(bar, g=0.2, until=None, bright=1.0):   # the accordion's off-beat chords (oom-CHUCK: on beats 2 and 4, the jig's 'chuck')
    for k in (1, 3):
        beat = 4 * bar + k
        if until is not None and beat >= until: break
        vs = CH[chord_at(beat)][1][-3:]
        for j, m in enumerate(vs): acc.add(accordion(mtof(m + 12), b * 0.55, bright=bright), T(beat), g * hum(0.05), pan=0.35 + 0.1 * (j - 1))

def strum_bar(bar, g=0.15, pattern='jig', until=None, bright=0.6):   # down on the beat, up on the last triplet
    for k in range(4):
        beat = 4 * bar + k
        if until is not None and beat >= until: break
        v = GTR[chord_at(beat)]
        strum(v, T(beat), gtr, g, True, dur=0.55, pan=-0.35, bright=bright)
        if pattern == 'jig': strum(v[2:], T(beat + 2 / 3), gtr, g * 0.55, False, spread=0.008, dur=0.3, pan=-0.35, bright=bright)

def bass_bar(bar, gain, style='jig', bright=1.0, upto=4.0):
    """'jig': the root on the beat, the fifth on the last triplet (bouncing); 'pulse': the root on every triplet's first and third"""
    for k in range(4):
        beat = 4 * bar + k
        if k >= upto: break
        root = CH[chord_at(beat)][0]; fifth = root + 7 if root + 7 <= 50 else root - 5
        bass.add(bass_note(mtof(root), b * 0.55, bright), T(beat), gain * (1.0 if k % 2 == 0 else 0.88) * hum(0.04))
        if style == 'jig': bass.add(bass_note(mtof(fifth), b * 0.25, bright), T(beat + 2 / 3), gain * 0.62 * hum(0.05))
        elif style == 'octave': bass.add(bass_note(mtof(root + 12), b * 0.25, bright), T(beat + 2 / 3), gain * 0.6 * hum(0.05))

def pad_chords(b0, b1, gain, cutoff=6000, a=0.08, r=0.5):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        vs = CH[c][1]
        for j, m in enumerate(vs):
            pad.add(voice_pad(mtof(m), (e0 - s0) * b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=m + 3 * j), T(s0), gain, pan=PANS[len(vs)][j])

# ================================================================ INTRO: the globe (bars -10..-1) ================================
wl, wr = lake(T(-2) + 0.5, seed=13); wg = ramp(len(wl), [(0, 0), (0.3, 0), (3.5, 1.0), (T(-12), 1.0), (T(-6), 0.5), (T(-2), 0.0), (99, 0)])
fx.add((wl * wg, wr * wg), 0.0, 0.12)
far.add(loon(2.6, mtof(69), seed=1), T(-35), 0.05, pan=-0.6); far.add(loon(2.2, mtof(66), seed=2), T(-27.5), 0.035, pan=0.65)   # the call, far away
pad_chords(-36, -28, 0.28, a=2.6, r=1.6); pad_chords(-28, -16, 0.28, a=0.7, r=1.6); pad_chords(-16, 0, 0.28, a=0.5, r=0.8)
bass.add(voice_sub(mtof(38), 7.5, a=2.5, r=2.0), T(-36), 0.015)
t0, x = fiddle(FAR, tone=0.75, vib=0.2, seed=4); far.add(x, t0, 0.13, pan=0.1)   # the slow air, far away
for bar in range(-6, 0): feet_bar(bar, 0.12 + 0.035 * (bar + 6), toes=bar >= -4, until=-0.5)   # the feet start, then the toes
for bar in range(-4, 0): strum_bar(bar, 0.06 + 0.02 * (bar + 4), 'jig' if bar >= -2 else 'down', until=-0.5, bright=0.45 + 0.05 * (bar + 4))
for bar in range(-4, 0): bass_bar(bar, 0.1 + 0.04 * (bar + 4), bright=0.3 + 0.17 * (bar + 4), upto=3 if bar == -1 else 4)
for k in range(12): perc.add(HH[k % 4], T(-8 + k * 2 / 3), (0.03 + 0.004 * k), pan=-0.3)   # ticking hats on the triplets
for k in range(8): K(-8 + k, 0.32 + 0.014 * k)
roll(-8, -4, 1.5, 0.05, 0.14); roll(-4, -1, 3, 0.14, 0.3); roll(-1, -0.33, 6, 0.3, 0.38)
fx.add(riser(2 * B, f0=250, f1=9000, seed=3), T(-8), 0.3); fx.add(rev_cymbal(b * 1.5, seed=5), T(-1.5), 0.3)

# ================================================================ MAIN (bars 0..13) ==============================================
fx.add(impact_d(3.0, seed=1), T(0), 0.5); perc.add(crash(2.8, seed=31), T(0), 0.32, pan=-0.35); perc.add(crash(2.8, seed=32), T(0), 0.26, pan=0.35)
for bar in range(N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH'; t4 = 4 * bar
    if sec in ('A', 'A2'):   # a driving beat on the jig's grid: kick 1 and 3 (and the last triplet before 3), snare 2 and 4, hats on the triplets
        for k in (0, 2): K(t4 + k, 0.5)
        K(t4 + 1 + 2 / 3, 0.3)
        SN(t4 + 1); SN(t4 + 3)
        for k in range(12):
            if bar in (3, 7) and k >= 9: continue
            perc.add(HH[k % 4], T(t4 + k / 3) + rng.normal(0, 0.002), (0.12 if k % 3 == 0 else 0.07 if k % 3 == 2 else 0.04) * hum(0.1), pan=-0.3)
        if sec == 'A2':
            for k in range(12): perc.add(TAMB[k % 4], T(t4 + k / 3), (0.28 if k in (3, 9) else 0.13 if k % 3 == 0 else 0.07) * hum(0.12), pan=-0.5)
    elif sec == 'BR':
        if bar == 8:
            K(t4, 0.45); perc.add(crash(2.6, seed=8), T(t4), 0.22, pan=-0.3); fx.add(downlifter(B, seed=2), T(t4), 0.2)
        else:
            for k in range(4): K(t4 + k, 0.32 + 0.05 * k)
            for k in range(12): perc.add(HH[k % 4], T(t4 + k / 3), (0.04 + 0.006 * k), pan=-0.3)
            roll(t4 + 1, t4 + 2, 3, 0.08, 0.14); roll(t4 + 2, t4 + 3.67, 6, 0.14, 0.34)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.24); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.28)
    else:                    # the chorus: four on the floor, snare and clap, the open hat on the last triplet, the tambourine
        for k in range(4): K(t4 + k, 0.52)
        for k in (1, 3): SN(t4 + k, 0.5); drums.add(CLAP[k % 3], T(t4 + k), 0.22, pan=0.1 * (k - 2))
        for k in range(12):
            if bar == 13 and k >= 6: continue
            perc.add(OH[k % 2] if k % 3 == 2 else HH[k % 4], T(t4 + k / 3), 0.09 if k % 3 == 2 else 0.1, pan=0.35)
            perc.add(TAMB[k % 4], T(t4 + k / 3), (0.3 if k in (3, 9) else 0.15 if k % 3 == 0 else 0.08) * hum(0.12), pan=-0.5)
    if bar in (4, 10, 12): perc.add(crash(2.6, seed=bar), T(t4), 0.28, pan={4: -0.3, 10: 0.0, 12: 0.35}[bar])
    if bar == 3: SN(t4 + 3 + 1 / 3, 0.3); SN(t4 + 3 + 2 / 3, 0.36)
    if bar == 7:
        for k in range(6): drums.add(tom(150 - 14 * k, 0.4), T(t4 + 2 + k / 3), 0.25 + 0.03 * k, pan=0.4 - 0.16 * k)
    if bar == 13:
        for k in range(6): SN(t4 + 2 + k / 3, 0.22 + 0.04 * k)
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.3)
    # --- the band: the feet always, the bass, the guitar, the accordion's vamp (from A'), the pad
    if sec == 'BR' and bar == 8: feet_bar(bar, 0.22, toes=False)
    else: feet_bar(bar, 0.34 if sec != 'CH' else 0.3, until=LAND)
    if sec == 'A': bass_bar(bar, 0.34, 'jig', bright=0.9); strum_bar(bar, 0.13)
    elif sec == 'A2': bass_bar(bar, 0.34, 'jig', bright=1.0); strum_bar(bar, 0.14); vamp_bar(bar, 0.17)
    elif sec == 'CH': bass_bar(bar, 0.34, 'octave', bright=1.1); strum_bar(bar, 0.15, until=LAND, bright=0.7); vamp_bar(bar, 0.15, until=LAND, bright=1.15)
    elif bar == 8: bass.add(bass_note(mtof(47), 4 * b - 0.1, bright=0.3), T(t4), 0.14); strum_bar(bar, 0.08, 'down', bright=0.45)
    else: bass_bar(bar, 0.26, 'jig', bright=0.7); strum_bar(bar, 0.1)
pad_chords(0, 16, 0.2); pad_chords(16, 32, 0.24); pad_chords(32, 40, 0.28, a=0.6, r=0.9); pad_chords(40, LAND, 0.32)
t0, x = fiddle(LEAD, seed=1); lead.add(chorus(x, 0.0012, 0.35, 0.18), t0, 0.3, pan=0.05)
t0, x = fiddle(BREATH, tone=0.85, vib=0.2, seed=2); lead.add(x, t0, 0.26, pan=0.0)
t0, x = fiddle(CHORUS, seed=3); lead.add(chorus(x, 0.0015, 0.3, 0.22), t0, 0.32, pan=0.05)
t0, x = fiddle([(nt[0], nt[1], nt[2] - 12) + nt[3:] for nt in CHORUS], tone=0.9, seed=5); lead.add(x, t0, 0.17, pan=-0.4)   # a second fiddle an octave down
for bt, ln, m, *_ in CHORUS:   # the accordion doubles the chorus' long notes, an octave down
    if ln >= 1.0 and bt < LAND: acc.add(accordion(mtof(m - 12), ln * b, a=0.03, r=0.15, bright=1.1), T(bt), 0.12, pan=0.45)

# ================================================================ LANDING: bar 14 = 48.2 s, the race starts ======================
L0 = T(LAND)
K(LAND, 0.8); snr.add(SNARE[0], L0, 0.45); fx.add(impact_d(3.0, seed=4), L0, 0.5)
perc.add(crash(3.2, seed=21), L0, 0.36, pan=-0.35); perc.add(crash(3.2, seed=22), L0, 0.3, pan=0.35)
feet.add(HEEL[0], L0, 0.45); feet.add(HEEL[1], L0 + 0.01, 0.3, pan=0.3)                 # the whole room stamps
for j, m in enumerate([50, 57, 62, 66, 69, 74]): pad.add(voice_pad(mtof(m), 1.3, cutoff=6000, a=0.008, r=1.3, voices=5, seed=m), L0, 0.28, pan=(-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)[j])
strum([50, 57, 62, 66, 69, 74], L0, gtr, 0.24, True, spread=0.016, dur=2.4, pan=-0.3, bright=0.7)
for j, m in enumerate([62, 66, 69, 74]): acc.add(accordion(mtof(m + 12), 1.4, a=0.01, r=0.9), L0, 0.11, pan=0.4)
lb = bass_note(mtof(38), 2.2, bright=0.8); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass.add(lb, L0, 0.5)

# ================================================================ MIX =============================================================
bass.curve(S.sidechain(kicks, depth=0.5, release=0.15)); pad.curve(S.sidechain(kicks, depth=0.35, release=0.2))
acc.curve(S.sidechain(kicks, depth=0.15, release=0.12)); gtr.curve(S.sidechain(kicks, depth=0.15, release=0.1))
fc = curve([(0, 450), (T(-28), 700), (T(-16), 1100), (T(-8), 1700), (T(-0.1), 4200), (T(0), 3400), (T(16), 3800), (T(30), 3800), (T(32) + 0.1, 1300),
            (T(36), 2000), (T(40) - 0.05, 5200), (T(40), 4600), (S.len, 6000)])
pad.L = lp(pad.L, fc, 0.12); pad.R = lp(pad.R, fc, 0.12)
fg = curve([(0, 1500), (T(-12), 2200), (T(-4), 5000), (T(0), 14000), (S.len, 14000)]); gtr.L = lp(gtr.L, fg, 0.05); gtr.R = lp(gtr.R, fg, 0.05)
pad.filt(lambda x: hp1(x, 150)); acc.filt(lambda x: hp1(x, 180)); gtr.filt(lambda x: hp1(x, 120)); bass.filt(lambda x: hp1(x, 35)); feet.filt(lambda x: hp1(x, 45))
pad.width(1.55); gtr.width(1.6); acc.width(1.5)
lead.curve(curve([(0, 1.0), (T(31.9), 1.0), (T(32.2), 0.8), (T(39.8), 0.8), (T(40), 1.15), (T(LAND) + 0.5, 1.15), (S.len - 0.25, 0.1), (S.len, 0.1)]))
verb_in = S.bus()
for x, a in ((pad, 0.3), (lead, 0.2), (gtr, 0.12), (far, 0.65), (acc, 0.15), (snr, 0.1), (fx, 0.2), (feet, 0.12), (perc, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.25, decay=2.8, damp=0.3, predelay=0.022)
dl = lead.send_delay(b * 2 / 3, 0.12, fb=0.3, damp=0.5); df = far.send_delay(b * 1.0, 0.4, fb=0.55, damp=0.4)
if '--stems' in sys.argv:
    for nm_, x in (('drums', drums), ('snare', snr), ('perc', perc), ('feet', feet), ('bass', bass), ('pad', pad), ('acc', acc), ('gtr', gtr),
                   ('lead', lead), ('far', far), ('fx', fx), ('verb', type('v', (), {'L': vl, 'R': vr}))):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:7s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
TRIM = 0.63
ALL = (drums, snr, perc, feet, bass, pad, acc, gtr, lead, far, fx, (vl, vr), dl, df)
mL = sum(x[0] if isinstance(x, tuple) else x.L for x in ALL) * TRIM
mR = sum(x[1] if isinstance(x, tuple) else x.R for x in ALL) * TRIM
mL, mR = mL + 0.3 * bp(mL, 2600, 0.25), mR + 0.3 * bp(mR, 2600, 0.25)   # a little presence for phone speakers
res = S.master([(mL, mR)], HERE + '/out/canada', lufs=-11.3, ceiling=-1.1, highs_db=1.0, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
