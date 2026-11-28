"""Turkey (the shore of the Sea of Marmara on the Asian side: the docks, the hills behind them, the strait's wind): a hicaz dance over a
dance beat. The mode is hicaz on A (A B flat C sharp D E F G: the step and a half between B flat and C sharp is its colour, the half
step B flat to A its cadence). A long-necked lute plucks the hook and trembles its long notes; a zither on the knees runs the scales in
sixteenths; a shawm (a double reed, loud enough for the open air) cries the chorus and improvises over the drone in the breath; a big
two-headed drum (the beater's DUM, the switch's tek) puts its accents 3+3+2 across the eighths while the kick keeps four; an end-blown
reed flute breathes the hook far away over the globe. 127.66 bpm: 15 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind off the sea, an A drone, the reed flute's hook at half speed far away, the drum's 3+3+2
                                     coming nearer; the build: Gm, B flat, the zither's runs, the riser
    drop  (20.0 s)     bar 0         the beat, the bass, the drum, the lute's hook (A Bb Gm A)
    A' bars 4-7 (Dm Bb Gm A: the zither doubles the tune), breath 8-9 (the shawm improvises over the A drone, the drum alone), chorus
    10-13 (Dm Bb Gm A: the shawm up an octave, everything), the run 14 (Bb A: the zither's run), LANDING at bar 15 = 48.2 s on A
"""
from folk import *

P = Piece(N=15, seed=37); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'A': (45, [57, 61, 64, 69]), 'Bb': (46, [58, 62, 65, 70]), 'Gm': (43, [55, 58, 62, 67]), 'Dm': (50, [57, 62, 65, 69]),
          'A5': (45, [57, 64, 69]), 'Ahi': (45, [57, 61, 64, 69, 73])},
         [(-44, -24, 'A5'), (-24, -16, 'Bb'), (-16, -8, 'A5'), (-8, -4, 'Gm'), (-4, 0, 'Bb'),
          (0, 4, 'A'), (4, 8, 'Bb'), (8, 12, 'Gm'), (12, 16, 'A'), (16, 20, 'Dm'), (20, 24, 'Bb'), (24, 28, 'Gm'), (28, 32, 'A'), (32, 40, 'A5'),
          (40, 44, 'Dm'), (44, 48, 'Bb'), (48, 52, 'Gm'), (52, 56, 'A'), (56, 58, 'Bb'), (58, 60, 'A'), (60, 76, 'Ahi')])

# ================================================================ the tunes (beat, beats, midi, how)
def row(b0, ns):   # (midi, beats[, how]) one after another from beat b0
    out, t = [], b0
    for nt in ns: out.append((t, nt[1], nt[0], nt[2] if len(nt) > 2 else 't')); t += nt[1]
    return out
HOOK = (row(0, [(69, .5), (70, .5), (73, .5), (74, .5), (76, 1, 'o'), (73, .5), (70, .5)]) +
        row(4, [(77, .5), (76, .5), (74, .5), (76, .5), (77, 1), (74, .5), (70, .5)]) +
        row(8, [(74, .5), (70, .5), (67, .5), (70, .5), (74, 1), (79, .5), (77, .5)]) +
        row(12, [(76, .5), (77, .5), (76, .5), (74, .5), (73, .5), (70, .5), (69, 1)]))
ANS = (row(16, [(81, .5), (79, .5), (77, .5), (76, .5), (77, 1), (74, 1)]) +
       row(20, [(82, .5), (81, .5), (79, .5), (77, .5), (79, 1, 'o'), (77, 1)]) +
       row(24, [(79, .5), (77, .5), (76, .5), (74, .5), (70, 1), (74, 1)]) +
       row(28, [(73, .5), (74, .5), (76, .5), (77, .5), (76, .5), (74, .5), (73, 1)]))
TAKSIM = [(32, 1.5, 76, 'g'), (33.5, .5, 77, 's'), (34, 1, 76, 'o'), (35, .5, 74, 's'), (35.5, .5, 73, 's'), (36, .5, 70, 's'),
          (36.5, 1.5, 69, 's'), (38, 2, 73, 'g', 0.85)]
CHORUS = (row(40, [(86, .5), (85, .5), (86, .5), (88, .5), (89, 1, 'o'), (86, 1)]) +
          row(44, [(89, .5), (88, .5), (86, .5), (85, .5), (86, 1), (82, 1)]) +
          row(48, [(86, .5), (82, .5), (79, .5), (82, .5), (86, 1), (91, .5), (89, .5)]) +
          row(52, [(88, .5), (89, .5), (88, .5), (86, .5), (85, .5), (82, .5), (81, 1)]) +
          row(56, [(82, .5), (77, .5), (74, .5), (77, .5), (76, .5), (73, .5), (70, .5), (73, .5)]) + [(LAND, 3.5, 81, 'g')])
FAR = [(-40 + 2 * bt, 2 * ln, m, 's' if k else 't', 0.8) for k, (bt, ln, m, _) in enumerate(HOOK[:15])]
P.check(HOOK, ANS, TAKSIM, CHORUS)
HIC = [57, 58, 61, 62, 64, 65, 67]   # hicaz on A, one octave
def scale_run(b0, beats, lo, up=True):   # sixteenths through the mode, lo = an index into the mode
    k = np.arange(int(beats * 4)); i = lo + (k if up else -k)
    return [(b0 + j / 4, 0.25, HIC[ii % 7] + 12 * (ii // 7)) for j, ii in zip(k, i)]

# ================================================================ timbres
def shawm(f, amp, n, seed):   # a conical double reed: a thin pulse, nasal formants, loud, a rasp of breath
    x = pulse(f, n, 0.22) * 0.6 + saw(f * 1.002, n) * 0.4
    y = bp(x, 1700, 0.5) + bp(x, 3100, 0.45) * 0.7 + hp(x, 900) * 0.25 + lp(x, 500) * 0.2
    return sat(y * 1.4, 1.6) * amp * 0.6 + bp(noise(n, seed), 3500, 0.4) * 0.03 * amp
def reedflute(f, amp, n, seed):   # an end-blown reed flute: a soft fundamental, much breath, a hollow third partial
    x = sine(f, n) + 0.1 * sine(2 * f, n) + 0.12 * sine(3 * f, n, 0.4)
    return (x * 0.6 + bp(noise(n, seed), f * 1.5, 0.6) * 0.6 + hp(noise(n, seed + 1), 3000) * 0.06) * amp
def lute(f, dur, seed):   # a long-necked lute, steel strings in courses, a light pick: bright, short
    return pluck(f, max(0.3, dur) + 0.3, 0.992, 0.75, seed, 0.1) * 0.7 + pluck(f * 1.003, max(0.3, dur) + 0.3, 0.99, 0.7, seed + 5, 0.09) * 0.35
def zither(f, seed):   # a plucked zither (triple courses, the nails): very bright, quick
    return sum(pluck(f * d, 0.6, 0.993, 0.9, seed + k, 0.07) for k, d in enumerate((1.0, 1.002, 0.998))) * 0.35
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=360, res=0.2, env_amt=2.0, sub=0.25, drive=1.3)

bs = P.buses('drums davul lute zit shawm bass pad far fx air')
drums, dav, lut, zit, shw, bas, pad, far, fx, air = bs.values()
KICK = kick(0.34, f0=130, f1=46, sweep=0.034, click=0.35, drive=1.4)
DUM = [frame_drum(78, 0.45, k, slap=0.2, damp=1.3) for k in range(3)]; TEK = [rim(0.05, seed=k) * 0.8 + hat(0.05, seed=10 + k, tone=6000) * 0.5 for k in range(3)]
HH = [hat(0.04, seed=k, tone=9000) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8000) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def davul_bar(bar, g=0.3):   # DUM on the eighths 0, 3, 6 (3+3+2), tek on the others, a little louder before each DUM
    for k in range(8):
        beat = 4 * bar + 0.5 * k
        if k in (0, 3, 6): dav.add(DUM[k % 3], T(beat) + P.jit(0.003), g * (1.0 if k == 0 else 0.8) * P.hum(0.08), pan=-0.1)
        else: dav.add(TEK[k % 3], T(beat) + P.jit(0.003), g * (0.5 if k in (2, 5, 7) else 0.3) * P.hum(0.15), pan=0.3)
def lute_line(notes, g=0.18, pan=-0.3, seed=0, trem=True):   # long notes trembled in sixteenths
    for i, (bt, ln, m, *_) in enumerate(notes):
        if trem and ln >= 1:
            for j in range(int(ln * 4)): lut.add(lute(mtof(m), 0.25 * b, seed + 13 * i + j), T(bt + j / 4) + P.jit(0.002), g * (1.0 if j == 0 else 0.55) * P.hum(0.1), pan=pan)
        else: lut.add(lute(mtof(m), ln * b, seed + 13 * i), T(bt) + P.jit(0.003), g * P.hum(0.08), pan=pan)
def bass_bar(bar, g=0.17):   # the root on the DUMs
    for o, ln in ((0, 1.3), (1.5, 1.3), (3, 0.9)):
        beat = 4 * bar + o; r = P.CH[P.chord_at(beat)][0]
        while r > 45: r -= 12
        bas.add(bass(mtof(r), ln * b, 0), T(beat), g * P.hum(0.05))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=41, base=420); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.12)
P.pads(pad, -44, -8, 0.13, cutoff=1200, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.13, cutoff=1800, a=0.5)
t0, x = P.breath(FAR, reedflute, seed=3, vib=0.15, vib_rate=4.5); far.add(x, t0, 0.3, pan=0.15)
for bar in range(-7, -2): davul_bar(bar, 0.05 + 0.035 * (bar + 7))
for bar in (-2, -1): davul_bar(bar, 0.25); bass_bar(bar, 0.18) if bar == -1 else None
for line in (scale_run(-6, 2, 0), scale_run(-2, 2, 7)): P.play(zit, line, lambda f, s, sd: zither(f, sd), g=0.06, pan=0.35, up=12, seed=900)
for k in range(8): P.kick(drums, KICK, -8 + k, 0.3 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.25); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..14)
fx.add(boom(55.0, seed=1), T(0), 0.46); dav.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); dav.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        davul_bar(bar, 0.26 if bar == 9 else 0.2)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.28 + 0.05 * k)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.33)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.09 if sec == 'A' else 0.12, pan=0.4)
    if sec != 'A':
        for k in range(16): drums.add(HH[k % 4], T(t4 + k / 4), (0.07 if k % 2 else 0.05) * P.hum(0.15), pan=-0.45 if k % 4 == 2 else 0.45)
        for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.12, pan=-0.1)
    davul_bar(bar, 0.26 if sec == 'A' else 0.3); bass_bar(bar)
    if bar in (4, 10): dav.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if sec == 'CH' and bar % 2: P.play(zit, scale_run(t4 + 2, 2, 7 + (bar % 4)), lambda f, s, sd: zither(f, sd), g=0.06, pan=0.4, seed=1000 + bar)
    if bar == 14:
        P.play(zit, scale_run(t4, 4, 0), lambda f, s, sd: zither(f, sd), g=0.07, pan=0.35, up=12, seed=1200)
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.12); P.pads(pad, 32, 40, 0.11, cutoff=1400, a=0.8); P.pads(pad, 40, LAND, 0.13, cutoff=3000)
lute_line(HOOK, 0.34, seed=10); lute_line(ANS, 0.32, seed=20)
P.play(zit, [(a, l, m) for a, l, m, _ in ANS], lambda f, s, sd: zither(f, sd), g=0.08, pan=0.35, up=12, seed=600)
t0, x = P.breath(TAKSIM, shawm, seed=8, vib=0.25, vib_rate=5.0); shw.add(x, t0, 0.2, pan=0.05)
t0, x = P.breath(CHORUS, shawm, seed=9, vib=0.2, vib_rate=5.5); shw.add(x, t0, 0.22, pan=0.05)
lute_line([nt for nt in CHORUS if nt[0] < 56], 0.2, pan=-0.35, seed=40, trem=False)

# ================================================================ LANDING: bar 15 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.72); dav.add(DUM[0], L0, 0.5); fx.add(boom(55.0, seed=4), L0, 0.46)
dav.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); dav.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.18, cutoff=5000, a=0.008, r=1.3)
strum(lut, P, LAND, [57, 64, 69, 73, 76, 81], lambda f, s: pluck(f, 2.2, 0.997, 0.75, s, 0.1), 0.16, spread=0.02, pan=-0.2, seed=300)
bas.add(bass(mtof(45), 1.6, 0), L0, 0.45)

P.finish(bs, {'pad': 0.25, 'lute': 0.12, 'zit': 0.2, 'shawm': 0.22, 'far': 0.6, 'fx': 0.2, 'davul': 0.08, 'drums': 0.03}, 'turkey',
         lufs=-13.5, highs_db=2.5, lows_db=-3.0,
         delays=[('shawm', 0.75, 0.12, 0.3), ('far', 1.5, 0.3, 0.5), ('zit', 0.5, 0.1, 0.2)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'lute': (0.1, 0.1)})
