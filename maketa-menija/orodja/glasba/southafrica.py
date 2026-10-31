"""South Africa (the Cape Peninsula: the road cut into the cliffs above the Atlantic; the Drakensberg: the gravel pass climbing the
escarpment in hairpins): kwela-house. A tin whistle (the pennywhistle of the townships' street music: a breathy, bright tube, played
with cuts, slides and a quick vibrato) carries the hook; a log drum (the tuned, woody, falling 'bwom' of the country's house music)
plays the bass in syncopated sixteenths; a marimba band (two players interlocking, as the school bands do) rolls the chords; a close
choir ('ooh', 'aah') answers in call and response; jazzy electric piano chords on the offbeats; a light kick, rim and swung shakers.
G major (the whistle's own key), 110.64 bpm: 13 bars from the drop to the race's start.
The hook: a bouncy 'up-and-back' cell (the third, a quick step down, the third held across the beat, up a step), sequenced over the
I - IV - I/V - V cycle of the street music; the answer climbs higher each time; the chorus sings it slower, a tenth above the choir,
and climbs from the sixth to the high G that lands the race's start.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  the Atlantic under the cliffs (waves, wind), the choir's chords swelling; marimba notes like
                                     stars; the hook in slow motion on the whistle, far away; the log drum muffled; the build: shakers,
                                     a log drum roll, the riser
    drop  (20.0 s)     bar 0         the groove and the hook
    A bars 0-3, A' 4-7 (the marimbas interlock, the choir answers, a new answer climbs), breath 8 (no kick: the log drum alone, the
    choir, a long whistle note), chorus 9-12 (everything, the choir under the whistle), LANDING at bar 13 = 48.2 s
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 13                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 110.64 bpm
B, b = S.bar, S.beat
LAND = 4 * N
def T(beat): return S.drop + beat * b        # beats from the drop (negative: the intro) -> seconds
assert abs(S.main_bars - N) < 1e-9 and abs(T(LAND) - END) < 1e-9
SWING = 0.045                                # the sixteenths' swing (beats): the second and fourth of each beat a little late
def sw(beat): k = round(beat * 4); return beat + (SWING if k % 2 and abs(beat * 4 - k) < 1e-6 else 0.0)
rng = np.random.default_rng(11)
def hum(x=0.08): return 1 + rng.uniform(-x, x)
def curve(points): tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
def ramp(n, points): tp, vp = zip(*points); return np.interp(np.arange(n) / SR, tp, vp)

# ================================================================ instruments ======================================================
def logdrum(f, dur=0.55, drive=2.2, bright=1.0, bend=0.6):
    """the log drum: a sine with a little self-modulation (the wood's hollow knock), its pitch falling into the note, a resonant low-pass
    that closes after the hit, driven a little (it carries on small speakers)"""
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + bend * np.exp(-t / 0.018))
    ph = np.cumsum(TAU * fr / SR)
    idx = 1.4 * np.exp(-t / 0.05) + 0.25
    x = np.sin(ph + idx * np.sin(ph)) + 0.3 * np.sin(2 * ph) * np.exp(-t / 0.08)
    x = lp(x, 260 + 2600 * bright * np.exp(-t / 0.035), 0.35)
    x += bp(noise(n, int(f)), 900, 0.5) * np.exp(-t / 0.006) * 0.4
    env = np.clip(t / 0.002, 0, 1) * np.exp(-t / (dur * 0.42))
    return np.tanh(x * env * drive) / np.tanh(drive)

def marimba(f, dur=1.4, seed=0, hard=0.5):
    """a marimba bar: its fundamental and the tuned partials (4 and ~10 times), the resonator tube under it, the mallet's soft knock"""
    seed = abs(int(seed)); n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); r = np.random.default_rng(seed)
    dec = 0.55 * (440.0 / f) ** 0.5
    for ratio, amp, d in ((1.0, 1.0, dec), (3.99, 0.22 * (0.5 + hard), dec * 0.22), (10.1, 0.07 * hard, dec * 0.07)):
        if f * ratio < 16000: x += amp * np.sin(TAU * f * ratio * t + r.random() * 6) * np.exp(-t / d)
    x += lp(noise(n, seed), 1200 + 2000 * hard) * np.exp(-t / 0.003) * 0.25
    return x * np.clip(t / 0.001, 0, 1) * 0.5

def whistle(notes, seed=0, vib=0.25, breath=0.16, tail=0.6):
    """the tin whistle, one breath line: notes (beat, beats, midi, how[, velocity]); how: 't' tongued, 's' slurred from the note
    before, 'c' cut (a flick to the next scale step above, just before the note), 'l' slid up from a third below.
    The tube: the fundamental, a little octave and twelfth, the breath through a band at the pitch. Returns (start s, mono)."""
    t0 = T(notes[0][0]) - 0.1; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed); idx = lambda bt: int(round((T(sw(bt)) - t0) * SR))
    pitch = np.full(n, float(notes[0][2])); amp = np.zeros(n); vd = np.zeros(n)
    for i, nt in enumerate(notes):
        bt, ln, m, how = nt[:4]; vel = nt[4] if len(nt) > 4 else 1.0
        a = idx(bt); e = min(n, idx(bt + ln)); pitch[a:] = m
        if how == 's' and i:   # a slur: a quick glide from the note before
            m0 = notes[i - 1][2]; k = int(0.035 * SR); pitch[a:a + k] = m0 + (m - m0) * (0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, len(pitch[a:a + k]))))
        if how == 'c':         # the cut: a flick up a step for ~25 ms
            k = int(0.028 * SR); up = m + (1 if (m - 67) % 12 in (4, 11) else 2); pitch[max(0, a - k):a] = up
        if how == 'l':         # a slide up from a third below
            k = int(0.09 * SR); pitch[a:a + k] = (m - 3) + 3 * np.linspace(0, 1, len(pitch[a:a + k])) ** 1.6
        att = int((0.006 if how in 'tc' else 0.02) * SR); a0 = max(0, a - (int(0.028 * SR) if how == 'c' else 0))
        seg = np.ones(e - a0); seg[:att] = np.linspace(0.25 if how == 's' else 0.0, 1.0, len(seg[:att]))
        if i + 1 < len(notes) and notes[i + 1][3] != 's':   # a small gap before the next tongued note
            g = int(0.02 * SR); seg[-g:] *= np.linspace(1, 0.35, len(seg[-g:]))
        amp[a0:e] = np.maximum(amp[a0:e], seg * vel)
        if ln * b > 0.35:      # vibrato on the longer notes, once they have settled
            v0 = a + int(0.16 * SR)
            if v0 < e: vd[v0:e] = vib * np.clip(np.arange(e - v0) / SR / 0.25, 0, 1)
    e_last = idx(notes[-1][0] + notes[-1][1]); amp[e_last:] = amp[e_last - 1] * np.exp(-np.arange(n - e_last) / SR / 0.05)
    amp = lp1(np.concatenate([np.zeros(64), amp]), 120.0)[64:]
    f = mtof(pitch + vd * np.sin(np.cumsum(TAU * 5.8 / SR * np.ones(n)) + r.random() * 6))
    x = sine(f, n) + 0.18 * sine(2 * f, n, 0.3) + 0.07 * sine(3 * f, n, 0.1)
    br = bp(noise(n, seed + 3), f * 1.02, 0.85) * 1.2 + hp(noise(n, seed + 4), 5000) * 0.25
    y = (x + breath * br) * amp
    return t0, hp1(y, 300)

def wave(dur, period=7.0, seed=0):   # the Atlantic: a swell of low-passed noise breaking every few seconds, its foam fizzing after (stereo)
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        ph = ((t + k * 1.3) / (period + 0.6 * k)) % 1.0
        sw_ = np.clip(ph / 0.35, 0, 1) ** 2 * np.exp(-np.clip(ph - 0.35, 0, None) / 0.2)
        rumble = lp(noise(n, seed + k), 400 + 900 * sw_) * sw_
        foam = bp(noise(n, seed + 7 + k), 3500, 0.2) * np.exp(-np.clip(ph - 0.38, 0, None) / 0.3) * (ph > 0.36)
        out.append(rumble * 0.9 + foam * 0.25)
    return tuple(out)

def wind(dur, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = 700 * 2 ** (0.9 * np.sin(TAU * t / (8.0 + 2 * k) + 1.3 * k) + 0.3 * np.sin(TAU * t / 3.1 + k))
        out.append(bp(noise(n, seed + k), fc, 0.65) * (0.7 + 0.3 * np.sin(TAU * t / 5.1 + 2 * k)))
    return tuple(out)

def impact_g(dur=3.0, seed=0):   # the boom on the drop and the landing, tuned to G
    n = int(dur * SR); t = np.arange(n) / SR
    boom = np.tanh(sine(98.0 * (1 + 1.6 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.55) * 1.8) * 0.55 + sine(49.0, n) * np.exp(-t / 0.5) * np.clip(t / 0.008, 0, 1) * 0.3
    return boom + lp(noise(n, seed), 1100) * np.exp(-t / 0.3) * 0.3

def woodblock(f=1250, dur=0.12): n = int(dur * SR); t = np.arange(n) / SR; return (sine(f, n) + 0.4 * sine(f * 2.7, n)) * np.exp(-t / 0.025) * 0.6

def rev_cymbal(dur, seed=0): x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

# ================================================================ harmony ========================================================
#            bass  the voices (midi)
CH = {'G69':    (43, [59, 62, 64, 69]),          # B3 D4 E4 A4 over G: G6/9 (no F#: the whistle sits on G)
      'Cmaj9':  (48, [59, 62, 64, 67]),          # B3 D4 E4 G4 over C
      'G/D':    (38, [59, 62, 67, 71]),          # B3 D4 G4 B4 over D
      'D7':     (38, [60, 62, 66, 69]),          # C4 D4 F#4 A4
      'D9sus':  (38, [60, 64, 67, 69]),          # C4 E4 G4 A4 over D
      'Em9':    (40, [59, 62, 66, 67]),          # B3 D4 F#4 G4 over E
      'Am9':    (45, [59, 60, 64, 67]),          # B3 C4 E4 G4 over A
      'Bm7':    (47, [57, 62, 66, 69]),          # A3 D4 F#4 A4 over B
      'Gsky':   (43, [50, 57, 62, 64, 71]),      # the globe: D3 A3 D4 E4 B4 over G (open fifths and a ninth)
      'Csky':   (48, [52, 59, 62, 64, 67]),      # the globe: E3 B3 D4 E4 G4 over C
      'Emsky':  (40, [52, 59, 62, 64, 71])}      # the globe: E3 B3 D4 E4 B4 (Em7, open)
CHORDS = [(-40, -32, 'Gsky'), (-32, -24, 'Emsky'), (-24, -16, 'Csky'), (-16, -12, 'G69'), (-12, -8, 'Em9'), (-8, -4, 'Am9'),
          (-4, -2, 'D9sus'), (-2, 0, 'D7'),                                                   # intro: I vi IV | I vi ii V
          (0, 4, 'G69'), (4, 8, 'Cmaj9'), (8, 12, 'G/D'), (12, 16, 'D7'),                     # A: the street cycle I IV I/V V
          (16, 20, 'G69'), (20, 24, 'Cmaj9'), (24, 26, 'Bm7'), (26, 28, 'Em9'), (28, 30, 'Am9'), (30, 32, 'D7'),   # A': ... iii vi ii V
          (32, 34, 'Em9'), (34, 36, 'D9sus'),                                                 # breath: vi, V sus
          (36, 40, 'Cmaj9'), (40, 42, 'D9sus'), (42, 44, 'D7'), (44, 46, 'Bm7'), (46, 48, 'Em9'), (48, 50, 'Am9'), (50, 52, 'D7'),   # chorus
          (52, 70, 'G69')]                                                                    # the landing
def chord_at(beat): return next(c for s, e, c in CHORDS if s <= beat < e)
PANS = {4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8), 6: (-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)}

# ================================================================ the tunes: (beat, beats, midi, how[, velocity]) ================
#   the hook: the third, a quick step down, the third held across the beat, up a step; the run down; sequenced over I IV I/V V
A1 = [(0.0, 0.5, 86, 't'), (0.5, 0.25, 83, 't'), (0.75, 0.75, 86, 's'), (1.5, 0.5, 88, 'c'), (2.0, 0.25, 86, 't'), (2.25, 0.25, 83, 's'),
      (2.5, 1.0, 79, 't'), (3.5, 0.5, 81, 't'),                                                      # D B D~ E D B G~ A
      (4.0, 0.5, 88, 't'), (4.5, 0.25, 86, 't'), (4.75, 0.75, 88, 's'), (5.5, 0.5, 91, 'c'), (6.0, 0.25, 88, 't'), (6.25, 0.25, 86, 's'),
      (6.5, 0.5, 84, 't'), (7.0, 0.5, 83, 't'), (7.5, 0.5, 79, 't'),                                 # E D E~ G E D C B G
      (8.0, 0.75, 83, 'l'), (8.75, 0.75, 86, 't'), (9.5, 0.5, 91, 'c'), (10.0, 0.25, 90, 't'), (10.25, 0.25, 88, 's'), (10.5, 1.0, 86, 't'),
      (11.5, 0.5, 83, 't'),                                                                           # B~ D G F# E D~ B
      (12.0, 0.5, 81, 't'), (12.5, 0.25, 84, 't'), (12.75, 0.75, 86, 's'), (13.5, 0.5, 90, 'c'), (14.0, 0.25, 88, 't'), (14.25, 0.25, 86, 's'),
      (14.5, 0.5, 84, 't'), (15.0, 0.5, 81, 't'), (15.5, 0.5, 78, 't')]                              # A C D~ F# E D C A F#
A2 = [(nt[0] + 16,) + nt[1:] for nt in A1[:17]] + [
      (24.0, 0.5, 90, 't'), (24.5, 0.25, 86, 't'), (24.75, 0.75, 90, 's'), (25.5, 0.5, 93, 'c'), (26.0, 0.25, 91, 't'), (26.25, 0.25, 90, 's'),
      (26.5, 1.0, 88, 't'), (27.5, 0.5, 86, 't'),                                                     # F# D F#~ A G F# E~ D (higher)
      (28.0, 0.5, 84, 't'), (28.5, 0.25, 83, 't'), (28.75, 0.75, 84, 's'), (29.5, 0.5, 88, 'c'), (30.0, 0.25, 86, 't'), (30.25, 0.25, 84, 's'),
      (30.5, 0.5, 81, 't'), (31.0, 0.5, 78, 't'), (31.5, 0.5, 81, 't')]                              # C B C~ E D C A F# A
BREATH = [(32.5, 1.5, 83, 'l', 0.85), (34.0, 1.75, 81, 's', 0.85)]                                # B~ A~ (the long notes over the sea)
CHORUS = [(36.0, 0.75, 91, 't'), (36.75, 0.75, 88, 's'), (37.5, 0.5, 91, 't'), (38.0, 0.5, 93, 'c'), (38.5, 0.5, 91, 't'), (39.0, 1.0, 88, 't'),
          (40.0, 0.75, 93, 't'), (40.75, 0.75, 90, 's'), (41.5, 0.5, 93, 't'), (42.0, 0.5, 95, 'c'), (42.5, 0.5, 93, 't'), (43.0, 1.0, 90, 't'),
          (44.0, 0.75, 95, 't'), (44.75, 0.75, 93, 's'), (45.5, 0.5, 90, 't'), (46.0, 1.0, 88, 'c'), (47.0, 0.5, 86, 't'), (47.5, 0.5, 88, 't'),
          (48.0, 0.5, 88, 't'), (48.5, 0.5, 91, 't'), (49.0, 0.5, 93, 't'), (49.5, 0.5, 95, 't'),
          (50.0, 0.5, 96, 'c'), (50.5, 0.5, 95, 't'), (51.0, 0.5, 93, 't'), (51.5, 0.5, 90, 's'),
          (LAND, 3.5, 91, 'l')]                                                                      # ... the climb to the high G
LEAD = A1 + A2 + BREATH + CHORUS
#   the hook at half speed over the globe, far away
FAR = [(-32.0, 1.0, 86, 't', 0.7), (-31.0, 0.5, 83, 't', 0.6), (-30.5, 1.5, 86, 's', 0.7), (-29.0, 1.0, 88, 'c', 0.75), (-28.0, 0.5, 86, 't', 0.6),
       (-27.5, 0.5, 83, 's', 0.6), (-27.0, 3.0, 79, 't', 0.7),
       (-22.0, 1.0, 88, 't', 0.75), (-21.0, 0.5, 86, 't', 0.6), (-20.5, 1.5, 88, 's', 0.75), (-19.0, 1.0, 91, 'c', 0.8), (-18.0, 0.5, 88, 't', 0.6),
       (-17.5, 0.5, 86, 's', 0.6), (-17.0, 3.0, 83, 't', 0.7)]
#   the choir under the chorus: the tune's long notes a tenth below (in the chord)
CHOIR_CH = [(36.0, 4.0, [76, 79]), (40.0, 2.0, [78, 81]), (42.0, 2.0, [78, 81]), (44.0, 2.0, [78, 81]), (46.0, 2.0, [76, 79]), (48.0, 2.0, [76, 79]), (50.0, 2.0, [78, 81])]
for nt in LEAD + FAR:   # (a check: no held note a half step above a chord tone)
    c = chord_at(nt[0]); pcs = {CH[c][0] % 12} | {m % 12 for m in CH[c][1]}
    assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)

drums, perc, ld, mar, keys, choir, pad, lead, far, fx, sea = (S.bus(x) for x in 'drums perc logdrum marimba keys choir pad lead far fx sea'.split())
kicks = []

# ================================================================ players ========================================================
KICK = kick(0.3, f0=130, f1=48, sweep=0.03, click=0.25, drive=1.3)
RIM = [rim(0.05, seed=k) for k in range(3)]; CLAP = [clap(seed=k) for k in range(3)]
SHK = [shaker(0.08, seed=k) for k in range(4)]; HH = [hat(0.04, seed=k, tone=9000) for k in range(4)]; OH = [hat(open_=True, seed=20 + k, tone=8000) for k in range(2)]
WB = [woodblock(1250), woodblock(980)]
def K(beat, g=0.42): drums.add(KICK, T(beat), g); kicks.append(T(beat))

#   the log drum: per bar, sixteenth slots (0-15) and the note: 'r' the chord's root, 'o' its octave, '5' its fifth, 'a' the root
#   with a slide up from below (the log drum's swoop)
LD_A = [(0, 'r'), (3, 'r'), (6, 'o'), (10, 'r'), (11, '5'), (14, 'a')]
LD_B = [(0, 'r'), (3, 'o'), (5, 'r'), (8, '5'), (10, 'r'), (12, 'o'), (14, 'r'), (15, '5')]
def logdrum_bar(bar, pat, g=0.42, bright=1.0, upto=16):
    for k, how in pat:
        if k >= upto: continue
        beat = 4 * bar + k / 4; root = CH[chord_at(beat)][0]
        while root > 40: root -= 12
        m = root + {'r': 0, 'o': 12, '5': 7, 'a': 0}[how]
        x = logdrum(mtof(m), 0.6 if how != 'o' else 0.35, bright=bright, bend=1.2 if how == 'a' else 0.6)
        ld.add(x, T(sw(beat)), g * (1.0 if k in (0, 10) else 0.85) * hum(0.05))

#   the marimbas: two players, the first on the beat (chord tones up and down), the second between (the interlock)
def marimba_bar(bar, g=0.2, second=True, step=1, up=0):
    vs = CH[chord_at(4 * bar)][1]; pat1 = (0, 2, 1, 3, 2, 0, 3, 1); pat2 = (3, 1, 2, 0, 1, 3, 0, 2)
    for k in range(0, 16, step):
        beat = 4 * bar + k / 4; vs = CH[chord_at(beat)][1]
        if k % 2 == 0:
            m = vs[pat1[(k // 2) % 8] % len(vs)] + 12 + up; mar.add(marimba(mtof(m), 1.0, seed=k + 16 * bar, hard=0.55), T(sw(beat)), g * (1.0 if k % 4 == 0 else 0.8) * hum(0.08), pan=-0.65)
        elif second:
            m = vs[pat2[(k // 2) % 8] % len(vs)] + 24 + up; mar.add(marimba(mtof(m), 0.8, seed=k + 16 * bar + 7, hard=0.45), T(sw(beat)), g * 0.75 * hum(0.1), pan=0.7)

def pad_chords(b0, b1, gain, cutoff=3500, a=0.3, r=0.8):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        vs = CH[c][1]
        for j, m in enumerate(vs): pad.add(voice_pad(mtof(m), (e0 - s0) * b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=m + 3 * j), T(s0), gain, pan=PANS[len(vs)][j])

def choir_chords(b0, b1, gain, vowel='u', a=0.6, r=1.2, top=False):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        vs = CH[c][1] + ([CH[c][1][-2] + 12] if top else [])
        for j, m in enumerate(vs): choir.add(voice_choir(mtof(m), (e0 - s0) * b, vowel, a=a, r=r, seed=m + j), T(s0), gain, pan=PANS.get(len(vs), PANS[5])[j] * 0.8)

def keys_bar(bar, g=0.16, pattern=(0.5, 1.75, 2.5, 3.75), dur=0.4):   # the electric piano: the chord on the offbeats, short
    for k in pattern:
        beat = 4 * bar + k; vs = CH[chord_at(beat)][1]
        for j, m in enumerate(vs): keys.add(voice_fm(mtof(m + 12), dur * b, ratio=1.0, index=1.6, decay=0.35, a=0.002, r=0.18), T(sw(beat)), g * hum(0.06), pan=(-0.6, -0.2, 0.2, 0.6)[j % 4])

def choir_stab(beat, g=0.18, vowel='a', dur=0.45):   # the choir's answer: a short 'aah' on the chord
    vs = CH[chord_at(beat)][1]
    for j, m in enumerate(vs): choir.add(voice_choir(mtof(m + 12), dur * b, vowel, a=0.02, r=0.25, seed=abs(int(beat * 7)) + j), T(sw(beat)), g, pan=PANS[len(vs)][j] * 0.6)

def groove_bar(bar, sec):
    t4 = 4 * bar
    if sec != 'BR':
        for k in range(4): K(t4 + k, 0.36 if k % 2 else 0.42)
        for k in (1, 3): drums.add(CLAP[(bar + k) % 3], T(t4 + k), 0.16, pan=0.05); drums.add(RIM[k % 3], T(t4 + k), 0.12, pan=-0.1)
        drums.add(RIM[2], T(sw(t4 + 3.75)), 0.08, pan=0.2)
    for k in range(16):   # the shakers: swung sixteenths, accented on the offbeat eighths
        perc.add(SHK[k % 4], T(sw(t4 + k / 4)), (0.24 if k % 4 == 2 else 0.14) * hum(0.12), pan=-0.5 if k % 2 else -0.3)
    if sec != 'BR':
        for k in range(8):
            if k % 2: perc.add(OH[k // 2 % 2], T(t4 + k / 2), 0.11 if sec != 'A' else 0.08, pan=0.45)
            elif sec != 'A': perc.add(HH[k % 4], T(t4 + k / 2), 0.09, pan=0.45)
    if sec in ('A2', 'CH'):
        for k in (0, 3, 6, 10, 12): perc.add(WB[k % 2], T(sw(t4 + k / 4)), 0.08 * hum(0.1), pan=0.55)   # the woodblock: 3+3+4+2+4

# ================================================================ INTRO: the globe (bars -10..-1) ================================
sl, sr_ = wave(T(-2) + 1.0, seed=5); sg = ramp(len(sl), [(0, 0), (0.4, 0), (3.0, 1.0), (T(-12), 1.0), (T(-6), 0.55), (T(-1), 0.0), (99, 0)])
sea.add((sl * sg, sr_ * sg), 0.0, 0.2)
wl, wr = wind(T(-2) + 0.5, seed=13); wg = ramp(len(wl), [(0, 0), (0.3, 0), (3.0, 1.0), (T(-8), 0.8), (T(-2), 0.0), (99, 0)])
fx.add((wl * wg, wr * wg), 0.0, 0.06)
choir_chords(-40, -16, 0.11, 'u', a=2.2, r=1.8)                   # the choir: 'ooh', swelling over the globe
choir_chords(-16, 0, 0.1, 'o', a=0.5, r=1.0)
pad_chords(-24, 0, 0.12, cutoff=1500, a=1.0, r=1.2)
bass_sub = voice_sub(mtof(43), 9.0, a=3.0, r=2.0); ld.add(bass_sub, T(-36), 0.03)
for bt, m, p in ((-35.5, 86, -0.5), (-33.0, 91, 0.4), (-30.5, 95, -0.2), (-27.0, 93, 0.5), (-24.5, 88, -0.4), (-22.0, 98, 0.3), (-19.5, 91, -0.3), (-17.0, 95, 0.45)):
    far.add(marimba(mtof(m), 1.6, seed=int(-bt * 10), hard=0.3), T(bt), 0.12, pan=p)        # stars: single marimba notes far off
t0, x = whistle(FAR, seed=4, vib=0.3, breath=0.22); far.add(x, t0, 0.2, pan=-0.1)            # the hook in slow motion, far away
for bar in range(-6, -2): marimba_bar(bar, 0.08 + 0.02 * (bar + 6), second=bar >= -4, step=2 if bar < -4 else 1)
for bar in (-6, -5, -4, -3):                                                                # the log drum, muffled, waking up
    for k, how in LD_A[:3 if bar < -4 else 6]:
        beat = 4 * bar + k / 4; root = CH[chord_at(beat)][0]
        while root > 40: root -= 12
        ld.add(lp(logdrum(mtof(root + (12 if how == 'o' else 0)), 0.5, bright=0.3), 500), T(sw(beat)), 0.16 + 0.04 * (bar + 6))
for k in range(16): perc.add(SHK[k % 4], T(sw(-12 + k / 4)), 0.04 + 0.003 * k, pan=-0.35)
# --- the build (bars -2, -1): the kick, the shakers, a log drum roll climbing, the marimbas, the riser
for k in range(8): K(-8 + k, 0.28 + 0.012 * k)
for bar in (-2, -1): marimba_bar(bar, 0.14 + 0.03 * (bar + 2))
for k in range(32): perc.add(SHK[k % 4], T(sw(-8 + k / 4)), 0.06 + 0.003 * k, pan=-0.35)
for k in range(12):                                                                         # the log drum's roll: D up to the octave
    m = 38 + (0, 2, 4, 5, 7, 9, 10, 12, 12, 14, 12, 14)[k]
    ld.add(logdrum(mtof(m), 0.3, bright=0.6 + 0.04 * k), T(-3 + k / 4), 0.16 + 0.02 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=3), T(-8), 0.28); fx.add(rev_cymbal(b * 1.5, seed=5), T(-1.5), 0.28)
for k in (-1.0, -0.5): choir_stab(k, 0.12)

# ================================================================ MAIN (bars 0..12) =================================================
fx.add(impact_g(3.0, seed=1), T(0), 0.45); perc.add(crash(2.8, seed=31), T(0), 0.28, pan=-0.35); perc.add(crash(2.8, seed=32), T(0), 0.22, pan=0.35)
for bar in range(N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 9 else 'CH'; t4 = 4 * bar
    groove_bar(bar, sec)
    if sec == 'A': logdrum_bar(bar, LD_A, 0.42); keys_bar(bar, 0.12); marimba_bar(bar, 0.1, second=False, step=2)
    elif sec == 'A2':
        logdrum_bar(bar, LD_A if bar % 2 == 0 else LD_B, 0.42, bright=1.1); keys_bar(bar, 0.12); marimba_bar(bar, 0.16)
        for k in (1.5, 3.5): choir_stab(t4 + k, 0.13)                                       # the choir answers the whistle
    elif sec == 'BR':
        logdrum_bar(bar, [(0, 'r'), (3, 'r'), (6, 'o'), (8, 'a'), (11, 'r'), (12, 'o'), (13, '5'), (14, 'o'), (15, 'a')], 0.4, bright=1.2)
        perc.add(crash(2.6, seed=8), T(t4), 0.18, pan=-0.3); fx.add(downlifter(B, seed=2), T(t4), 0.15)
        fx.add(riser(B * 0.75, f0=500, f1=9000, seed=7), T(t4 + 1), 0.2); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.25)
        for k in range(4): K(t4 + 2 + k / 2, 0.18 + 0.05 * k)
    else:
        logdrum_bar(bar, LD_B, 0.44, bright=1.2); keys_bar(bar, 0.13, pattern=(0.5, 1.5, 2.5, 3.5)); marimba_bar(bar, 0.17); marimba_bar(bar, 0.07, second=False, step=4, up=12)
    if bar in (4, 9): perc.add(crash(2.6, seed=bar), T(t4), 0.24, pan=0.3)
    if bar == 3: drums.add(tom(160), T(t4 + 3.5), 0.25, pan=0.3); drums.add(tom(120), T(t4 + 3.75), 0.28, pan=-0.2)
    if bar == 12:
        for k in range(8): drums.add(tom((180, 165, 150, 135, 120, 110, 100, 90)[k]), T(t4 + 2 + k / 4), 0.16 + 0.02 * k, pan=(0.4, 0.3, 0.2, 0.0, -0.1, -0.2, -0.3, -0.4)[k])
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.18); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.28)
pad_chords(0, 16, 0.1); pad_chords(16, 32, 0.13); pad_chords(32, 36, 0.16, cutoff=2400, a=0.6, r=0.9); pad_chords(36, LAND, 0.15, cutoff=4500)
choir_chords(32, 36, 0.12, 'u', a=0.5, r=0.8)                                                # the breath: the choir alone with the log drum
for s, ln, ms in CHOIR_CH:
    for j, m in enumerate(ms): choir.add(voice_choir(mtof(m), ln * b - 0.05, 'a', a=0.08, r=0.4, seed=int(s) + j), T(s), 0.16, pan=(-0.35, 0.35)[j])
choir_chords(36, LAND, 0.08, 'a', a=0.3, r=0.6, top=True)
t0, x = whistle(LEAD, seed=1); lead.add(x, t0, 0.25, pan=0.05)
t0, x = whistle(CHORUS, seed=2, vib=0.22, breath=0.12); lead.add(lp(x, 5000), t0 - 0.012, 0.09, pan=-0.4)   # a second whistle doubles the chorus

# ================================================================ LANDING: bar 13 = 48.2 s, the race starts ======================
L0 = T(LAND)
K(LAND, 0.7); drums.add(CLAP[0], L0, 0.25); fx.add(impact_g(3.0, seed=4), L0, 0.45)
perc.add(crash(3.2, seed=21), L0, 0.3, pan=-0.35); perc.add(crash(3.2, seed=22), L0, 0.25, pan=0.35)
for j, m in enumerate([43, 50, 59, 62, 64, 69]):
    pad.add(voice_pad(mtof(m + 12), 1.3, cutoff=5000, a=0.008, r=1.3, voices=5, seed=m), L0, 0.18, pan=PANS[6][j])
    choir.add(voice_choir(mtof(m + 12), 1.4, 'a', a=0.02, r=1.2, seed=m), L0, 0.12, pan=PANS[6][j] * 0.7)
for j, m in enumerate([67, 71, 74, 79, 83, 86]): mar.add(marimba(mtof(m), 2.0, seed=200 + j, hard=0.6), L0 + 0.03 * j, 0.15, pan=-0.5 + 0.2 * j)   # a marimba run up the chord
lb = logdrum(mtof(31), 1.6, bright=1.0); ld.add(lb, L0, 0.5)

# ================================================================ MIX =============================================================
perc.gain(2.6); ld.gain(0.8); mar.gain(1.5); keys.gain(1.3); choir.gain(1.25)   # (the balance)
ld.curve(S.sidechain(kicks, depth=0.25, release=0.1)); pad.curve(S.sidechain(kicks, depth=0.4, release=0.2)); keys.curve(S.sidechain(kicks, depth=0.2, release=0.12))
fc = curve([(0, 600), (T(-24), 900), (T(-12), 1600), (T(-0.1), 4200), (T(0), 3500), (T(32) + 0.1, 1800), (T(36) - 0.05, 4500), (S.len, 6000)])
pad.L = lp(pad.L, fc, 0.1); pad.R = lp(pad.R, fc, 0.1)
pad.filt(lambda x: hp1(x, 160)); choir.filt(lambda x: hp1(x, 140)); keys.filt(lambda x: hp1(x, 180)); mar.filt(lambda x: hp1(x, 150)); sea.filt(lambda x: hp1(x, 60))
pad.width(1.4); choir.width(1.3); mar.width(1.2)
lead.curve(curve([(0, 1.0), (T(31.9), 1.0), (T(32.3), 0.8), (T(35.9), 0.8), (T(36), 1.15), (T(LAND) + 0.5, 1.15), (S.len - 0.25, 0.1), (S.len, 0.1)]))
verb_in = S.bus()
for x, a in ((pad, 0.25), (choir, 0.35), (lead, 0.2), (mar, 0.18), (far, 0.6), (keys, 0.15), (fx, 0.2), (drums, 0.04), (perc, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.2, decay=2.8, damp=0.3, predelay=0.02)
dl = lead.send_delay(b * 0.75, 0.16, fb=0.33, damp=0.5); df = far.send_delay(b * 1.0, 0.35, fb=0.5, damp=0.4)
BUSES = [drums, perc, ld, mar, keys, choir, pad, lead, far, fx, sea]
if '--stems' in sys.argv:
    for nm_, x in zip('drums perc logdrum marimba keys choir pad lead far fx sea'.split(), BUSES):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:8s} {sec:5s} rms {20 * np.log10(r):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES + [(vl, vr), dl, df], HERE + '/out/southafrica', lufs=-12.0, ceiling=-1.1, highs_db=2.0, lows_db=0.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
