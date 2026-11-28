"""Ireland (the plain of Kildare: wide green grass, hedges, stud farms, a low sky): a reel over a dance beat. A tin whistle sings the
hook with its cuts (a flick from above on the attack); a fiddle bows under it and then with it; a bouzouki (paired strings, an octave
apart) strums the chords on the off-beats; a bodhran (the frame drum, struck with a two-headed stick) rolls the reel's sixteenths and
gallops like hooves over the globe; a warm bass, soft pads, the wind over the grass. D major with the mixolydian C, the chorus up to
the high B, the landing on D. 136.17 bpm: 16 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind over the plain, a Dsus pad, the fiddle's slow air, the hook on the whistle far away at half
                                     speed, the bodhran galloping in, the bouzouki muffled; the build: the bodhran's roll, the riser
    drop  (20.0 s)     bar 0         the beat, the bass, the bouzouki, the whistle's hook (D D C D)
    A' bars 4-7 (Bm G D A: the fiddle joins an octave under), breath 8-9 (Dsus: the whistle's slow air, the bodhran alone), chorus
    10-13 (G A Bm A: everything, up to the high B), the run 14-15 (G A), LANDING at bar 16 = 48.2 s on D
"""
from folk import *

P = Piece(N=16, seed=11); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'D': (38, [57, 62, 66, 69]), 'C': (36, [55, 60, 64, 67]), 'G': (43, [55, 59, 62, 67]), 'A': (45, [57, 61, 64, 69]),
          'Bm': (47, [54, 59, 62, 66]), 'Dsus': (38, [57, 62, 64, 69]), 'Dhi': (38, [57, 62, 66, 69, 74])},
         [(-48, -32, 'Dsus'), (-32, -24, 'G'), (-24, -16, 'Bm'), (-16, -8, 'G'), (-8, 0, 'A'),
          (0, 8, 'D'), (8, 12, 'C'), (12, 16, 'D'), (16, 20, 'Bm'), (20, 24, 'G'), (24, 28, 'D'), (28, 32, 'A'), (32, 40, 'Dsus'),
          (40, 44, 'G'), (44, 48, 'A'), (48, 52, 'Bm'), (52, 56, 'A'), (56, 60, 'G'), (60, 64, 'A'), (64, 80, 'Dhi')])

# ================================================================ the tunes (beat, beats, midi, how)
def bars(b0, rows): return [(b0 + bt, ln, m, how) for bt, ln, m, how in rows]
E8 = lambda ms, how0='t': [(0.5 * k, 0.5, m, how0 if k == 0 else 't') for k, m in enumerate(ms)]
HOOK = (bars(0, [(0, .5, 74, 't'), (.5, .5, 78, 't'), (1, .5, 81, 't'), (1.5, .5, 78, 't'), (2, 1, 83, 'c'), (3, .5, 81, 't'), (3.5, .5, 78, 't')]) +
        bars(4, [(0, .5, 76, 't'), (.5, .5, 78, 't'), (1, .5, 81, 't'), (1.5, .5, 86, 't'), (2, .5, 85, 't'), (2.5, .5, 83, 't'), (3, 1, 81, 'c')]) +
        bars(8, [(0, 1, 79, 'c'), (1, .5, 76, 't'), (1.5, .5, 79, 't'), (2, .5, 84, 't'), (2.5, .5, 83, 't'), (3, .5, 81, 't'), (3.5, .5, 79, 't')]) +
        bars(12, [(0, .5, 78, 't'), (.5, .5, 76, 't'), (1, .5, 74, 't'), (1.5, .5, 76, 't'), (2, 1, 78, 'c'), (3, 1, 74, 's')]))
ANS = (bars(16, [(0, .5, 83, 't'), (.5, .5, 78, 't'), (1, .5, 74, 't'), (1.5, .5, 78, 't'), (2, 1, 83, 'c'), (3, .5, 86, 't'), (3.5, .5, 83, 't')]) +
       bars(20, [(0, .5, 86, 't'), (.5, .5, 83, 't'), (1, .5, 79, 't'), (1.5, .5, 83, 't'), (2, 1, 86, 'c'), (3, .5, 83, 't'), (3.5, .5, 81, 't')]) +
       bars(24, [(0, .5, 78, 't'), (.5, .5, 81, 't'), (1, .5, 86, 't'), (1.5, .5, 81, 't'), (2, .5, 78, 't'), (2.5, .5, 76, 't'), (3, 1, 74, 'c')]) +
       bars(28, [(0, .5, 76, 't'), (.5, .5, 79, 't'), (1, .5, 81, 't'), (1.5, .5, 79, 't'), (2, 1, 76, 'c'), (3, .5, 73, 't'), (3.5, .5, 76, 't')]))
AIR = [(32.5, 1.5, 81, 'g', 0.8), (34, .5, 83, 's', 0.8), (34.5, .5, 81, 's', 0.8), (35, 1, 78, 's', 0.8), (36, 1.5, 76, 'c', 0.85),
       (37.5, .5, 78, 's', 0.8), (38, 2, 74, 's', 0.75)]
CHORUS = (bars(40, [(0, .5, 83, 't'), (.5, .5, 86, 't'), (1, 1, 91, 'c'), (2, .5, 90, 't'), (2.5, .5, 88, 't'), (3, 1, 86, 't')]) +
          bars(44, [(0, .5, 85, 't'), (.5, .5, 88, 't'), (1, 1, 93, 'c'), (2, .5, 91, 't'), (2.5, .5, 88, 't'), (3, 1, 85, 't')]) +
          bars(48, [(0, .5, 86, 't'), (.5, .5, 90, 't'), (1, 1, 95, 'c'), (2, .5, 93, 't'), (2.5, .5, 90, 't'), (3, 1, 86, 't')]) +
          bars(52, [(0, .5, 88, 't'), (.5, .5, 85, 't'), (1, .5, 81, 't'), (1.5, .5, 85, 't'), (2, 1, 88, 'c'), (3, .5, 85, 't'), (3.5, .5, 81, 't')]) +
          [(56 + 0.5 * k, 0.5, m, 't') for k, m in enumerate([79, 83, 86, 91, 90, 86, 83, 86, 85, 88, 93, 88, 85, 88, 90, 93])] +
          [(LAND, 3.5, 86, 'g')])
FAR = [(-40 + 2 * bt, 2 * ln, m, 's' if k else 't', 0.8) for k, (bt, ln, m, _) in enumerate(HOOK[:14])]
SLOW = [(-44, 6, 62, 't', 0.7), (-38, 2, 64, 's', 0.7), (-36, 4, 66, 's', 0.7), (-32, 4, 67, 's', 0.7), (-28, 4, 66, 's', 0.7), (-24, 6, 62, 's', 0.7),
        (-18, 2, 61, 's', 0.7), (-16, 4, 62, 's', 0.7), (-12, 4, 59, 's', 0.7), (-8, 8, 61, 's', 0.7)]
P.check(HOOK, ANS, AIR, CHORUS[:-1], SLOW)

# ================================================================ timbres
def whistle(f, amp, n, seed):   # a tin whistle: nearly a sine, a little second and third, much breath at the edge of the tone
    x = sine(f, n) + 0.22 * sine(2 * f, n, 0.3) + 0.06 * sine(3 * f, n, 0.7)
    br = bp(noise(n, seed), f * 2.0, 0.5) * 0.5 + hp(noise(n, seed + 1), 5000) * 0.12
    return (x * 0.75 + br * (0.4 + 0.6 * (1 - np.clip(amp, 0, 1)))) * amp
def fiddle(f, amp, n, seed):   # a bowed string: two saws a hair apart through the body's resonances, the bow's rosin noise
    x = saw(f, n) * 0.6 + saw(f * 1.0025, n) * 0.4
    y = bp(x, 480, 0.55) * 0.9 + bp(x, 1550, 0.45) * 0.7 + bp(x, 3100, 0.45) * 0.45 + lp(x, 900) * 0.3
    return (lp(y, 6000) + bp(noise(n, seed), 2500, 0.3) * 0.04 * amp) * amp
def bouzouki(f, seed):   # paired steel strings, the high pair an octave up: a bright pluck and its octave a hair apart
    return pluck(f, 0.7, 0.994, 0.62, seed, 0.12) * 0.8 + pluck(f * 2.003, 0.7, 0.99, 0.55, seed + 7, 0.1) * 0.35
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=320, res=0.2, env_amt=2.0, sub=0.35, drive=1.3)

bs = P.buses('drums perc bou bass wh fi pad far fx air')
drums, perc, bou, bas, wh, fi, pad, far, fx, air = bs.values()
KICK = kick(0.34, f0=135, f1=44, sweep=0.034, click=0.35, drive=1.4)
BOD = [frame_drum(68, 0.35, k, slap=0.0) for k in range(3)]; TIP = [frame_drum(150, 0.12, 10 + k, slap=0.9, damp=0.4) for k in range(4)]
HH = [hat(0.04, seed=k, tone=9000) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8000) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def bodhran_bar(bar, g=0.25, gallop=False):
    if gallop:   # hooves: da-da-DUM in triplets
        for q in range(4):
            for o, v in ((0, 1.0), (1 / 3, 0.45), (2 / 3, 0.6)): perc.add((BOD if o == 0 else TIP)[int(P.rng.integers(3))], T(4 * bar + q + o) + P.jit(), g * v * P.hum(0.1), pan=0.15)
        return
    for k in range(16):
        v = (1.0, 0.35, 0.6, 0.4)[k % 4]; x = BOD[k % 3] if k % 4 == 0 else TIP[k % 4]
        perc.add(x, T(4 * bar + k / 4) + P.jit(0.003), g * v * P.hum(0.1), pan=0.15 if k % 4 == 0 else 0.3)
def bou_bar(bar, g=0.14, dark=False):   # down on the beat (soft), up on the off-beat (the accent)
    for k in range(8):
        beat = 4 * bar + 0.5 * k; c = P.chord_at(beat); vs = sorted(P.CH[c][1])[:4]
        fn = (lambda f, s: lp(bouzouki(f, s), 900)) if dark else bouzouki
        strum(bou, P, beat, vs, fn, g * (1.0 if k % 2 else 0.55), spread=0.009, down=k % 2 == 0, pan=-0.45 if k % 2 else 0.45, seed=bar * 40 + k * 4)
def bass_bar(bar, g=0.3):
    for o, ln in ((0, 1.4), (1.5, 0.4), (2, 1.4), (3.5, 0.4)):
        beat = 4 * bar + o; r = P.CH[P.chord_at(beat)][0]
        while r > 40: r -= 12
        bas.add(bass(mtof(r + (7 if o == 3.5 else 0)), ln * b, 0), T(beat), g * P.hum(0.05))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=21, base=500); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.12)
P.pads(pad, -48, -16, 0.15, cutoff=1300, a=2.5, r=1.8); P.pads(pad, -16, 0, 0.15, cutoff=1800, a=0.6)
t0, x = P.breath(SLOW, fiddle, seed=2, vib=0.25); fi.add(x, t0, 0.14, pan=-0.2)
t0, x = P.breath(FAR, whistle, seed=3, vib=0.2); far.add(x, t0, 0.2, pan=0.15)
for bar in range(-7, -2): bodhran_bar(bar, 0.05 + 0.03 * (bar + 7), gallop=True)
for bar in range(-5, -2): bou_bar(bar, 0.05 + 0.02 * (bar + 5), dark=True)
for k in range(8): P.kick(drums, KICK, -8 + k, 0.32 + 0.015 * k)
for bar in (-2, -1): bou_bar(bar, 0.09); bass_bar(bar, 0.3) if bar == -1 else None
for k in range(32): perc.add(TIP[k % 4] if k % 4 else BOD[0], T(-8 + k / 4), 0.08 + 0.008 * k, pan=0.3)
for k in range(8): perc.add(TIP[k % 4], T(-1 + k / 8), 0.3 + 0.02 * k, pan=0.25)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.26); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.26)

# ================================================================ MAIN (bars 0..15)
fx.add(boom(73.4, seed=1), T(0), 0.46); perc.add(crash(2.8, seed=41), T(0), 0.26, pan=-0.35); perc.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        bodhran_bar(bar, 0.2 if bar == 8 else 0.26); bou_bar(bar, 0.05, dark=True)
        if bar == 8: P.kick(drums, KICK, t4, 0.42); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.3 + 0.05 * k)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.42)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.1 if sec == 'A' else 0.14, pan=0.4)
    if sec != 'A':
        for k in range(16): drums.add(HH[k % 4], T(t4 + k / 4), (0.08 if k % 2 else 0.055) * P.hum(0.15), pan=-0.5 if k % 4 == 2 else 0.5)
        for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.12, pan=-0.1)
    bodhran_bar(bar, 0.22 if sec == 'A' else 0.27); bou_bar(bar, 0.14 if sec == 'A' else 0.17); bass_bar(bar)
    if bar in (4, 10): perc.add(crash(2.6, seed=bar), T(t4), 0.24, pan=0.3)
    if bar == 15:
        for k in range(16): perc.add(TIP[k % 4], T(t4 + k / 4), 0.14 + 0.016 * k, pan=0.3 - 0.04 * k)
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.1); P.pads(pad, 32, 40, 0.12, cutoff=1500, a=0.8); P.pads(pad, 40, LAND, 0.13, cutoff=3200)
t0, x = P.breath(HOOK, whistle, seed=5, vib=0.15); wh.add(x, t0, 0.36, pan=0.1)
t0, x = P.breath(ANS, whistle, seed=6, vib=0.15); wh.add(x, t0, 0.36, pan=0.1)
t0, x = P.breath([(a, l, m - 12, h) for a, l, m, h in ANS], fiddle, seed=7, vib=0.2); fi.add(x, t0, 0.28, pan=-0.35)
t0, x = P.breath(AIR, whistle, seed=8, vib=0.3); wh.add(x, t0, 0.32, pan=0.05)
t0, x = P.breath(CHORUS, whistle, seed=9, vib=0.15); wh.add(x, t0, 0.34, pan=0.1)
t0, x = P.breath([(a, l, m - 12, h) for a, l, m, h in CHORUS], fiddle, seed=10, vib=0.2); fi.add(x, t0, 0.3, pan=-0.35)

# ================================================================ LANDING: bar 16 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.75); perc.add(BOD[0], L0, 0.5); fx.add(boom(73.4, seed=4), L0, 0.46)
perc.add(crash(3.2, seed=51), L0, 0.28, pan=-0.35); perc.add(crash(3.2, seed=52), L0, 0.24, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.2, cutoff=5000, a=0.008, r=1.3)
strum(bou, P, LAND, [50, 57, 62, 66, 69, 74], lambda f, s: pluck(f, 2.2, 0.997, 0.62, s, 0.12), 0.18, spread=0.02, pan=-0.2, seed=300)
bas.add(bass(mtof(38), 1.6, 0), L0, 0.5)

P.finish(bs, {'pad': 0.25, 'wh': 0.22, 'fi': 0.25, 'far': 0.6, 'bou': 0.15, 'fx': 0.2, 'perc': 0.06, 'drums': 0.03}, 'ireland', lufs=-13.5, highs_db=3.0, lows_db=-1.5,
         delays=[('wh', 0.75, 0.14, 0.3), ('fi', 0.5, 0.1, 0.25), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'bou': (0.15, 0.1)})
