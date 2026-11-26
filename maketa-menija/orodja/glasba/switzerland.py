"""Switzerland (the road over the high pass under the glacier: hairpins, granite, snow in July): a mountain dance over a dance beat. An
alphorn opens the globe on its own natural harmonics (no valves: only the overtones of one long tube, with its out-of-tune seventh and
its famous eleventh between B flat and B), the far slope echoes it; cowbells of a herd on the alp, each its own inharmonic metal; then
an accordion leaps like a yodel (the jump from the chest to the head, sixths and octaves), a hammered dulcimer shimmers its strings in
repeated arpeggios, the oom-pah of the bass on one and three, the accordion's chords on the off-beats. F major, the chorus on B flat,
the landing on F. 119.15 bpm: 14 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind on the pass, an F pad, the alphorn's call (harmonics 6-12 of F) and its echo, cowbells near
                                     and far, the dulcimer's tremolo; the build: C7, the accordion's off-beats, the riser
    drop  (20.0 s)     bar 0         the beat, the oom-pah, the accordion's yodel (F C7 F Bb-C7)
    A' bars 4-7 (F Dm Bb C7: the dulcimer doubles the tune), breath 8-9 (the alphorn again, nearer, with the bells), chorus 10-12
    (Bb F C7: everything, the dulcimer in sixteenths), the run 13 (Gm C7), LANDING at bar 14 = 48.2 s on F
"""
from folk import *

P = Piece(N=14, seed=23); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'F': (41, [57, 60, 65, 69]), 'Bb': (46, [58, 62, 65, 70]), 'C7': (48, [55, 58, 64, 67]), 'Dm': (50, [57, 62, 65, 69]),
          'Gm': (43, [55, 58, 62, 67]), 'Fhi': (41, [57, 60, 65, 69, 72])},
         [(-44, -8, 'F'), (-8, 0, 'C7'), (0, 4, 'F'), (4, 8, 'C7'), (8, 12, 'F'), (12, 14, 'Bb'), (14, 16, 'C7'),
          (16, 20, 'F'), (20, 24, 'Dm'), (24, 28, 'Bb'), (28, 32, 'C7'), (32, 40, 'F'),
          (40, 44, 'Bb'), (44, 48, 'F'), (48, 52, 'C7'), (52, 54, 'Gm'), (54, 56, 'C7'), (56, 72, 'Fhi')])

# ================================================================ the tunes (beat, beats, midi[, how])
def row(b0, ns):   # (midi, beats) one after another from beat b0
    out, t = [], b0
    for m, ln in ns: out.append((t, ln, m, 't')); t += ln
    return out
YODEL = (row(0, [(72, .5), (81, .5), (77, .5), (72, .5), (69, 1), (77, .5), (72, .5)]) +
         row(4, [(70, .5), (79, .5), (76, .5), (72, .5), (67, 1), (76, 1)]) +
         row(8, [(72, .5), (84, .5), (81, .5), (77, .5), (72, .5), (81, .5), (77, 1)]) +
         row(12, [(74, .5), (82, .5), (77, .5), (74, .5), (72, .5), (76, .5), (79, 1)]))
YODEL2 = (row(16, [(81, .5), (77, .5), (72, .5), (77, .5), (81, 1), (84, 1)]) +
          row(20, [(81, .5), (77, .5), (74, .5), (77, .5), (81, 1), (77, 1)]) +
          row(24, [(77, .5), (74, .5), (70, .5), (74, .5), (77, 1), (82, 1)]) +
          row(28, [(79, .5), (76, .5), (72, .5), (76, .5), (79, .5), (82, .5), (76, 1)]))
CHORUS = (row(40, [(86, .5), (82, .5), (77, .5), (82, .5), (86, 1), (84, .5), (82, .5)]) +
          row(44, [(81, .5), (77, .5), (72, .5), (77, .5), (81, 1), (84, 1)]) +
          row(48, [(82, .5), (79, .5), (76, .5), (79, .5), (82, .5), (84, .5), (88, 1)]) +
          row(52, [(79, .5), (82, .5), (86, .5), (82, .5), (84, .5), (82, .5), (79, .5), (76, .5)]))
P.check(YODEL, YODEL2, CHORUS)
H = lambda h: 41 + 12 * np.log2(h)   # the alphorn's harmonics of F (a tube about 3.5 m long): no other notes exist on it
CALL = [(-40, 3, H(8), 't'), (-37, 1, H(9), 's'), (-36, 2, H(10), 's'), (-34, 2, H(8), 's'), (-32, 4, H(6), 's'),
        (-27, 1.5, H(8), 't'), (-25.5, .5, H(10), 's'), (-25, 2, H(12), 's'), (-23, 1.5, H(11), 's'), (-21.5, .5, H(10), 's'), (-21, 4, H(8), 's'),
        (-16, 2, H(6), 't'), (-14, 2, H(8), 's'), (-12, 3.5, H(9), 'g', 0.8)]
NEAR = [(32, 1, H(6), 't'), (33, 1, H(8), 's'), (34, 2, H(10), 's'), (36, 1, H(9), 's'), (37, 1, H(8), 's'), (38, 1.6, H(6), 's', 0.85)]

# ================================================================ timbres
def alphorn(f, amp, n, seed):   # a long conical wooden tube: a round fundamental, brighter as it is blown harder, a little breath
    x = saw(f, n); a = np.clip(amp, 0, 1)
    y = lp(x, 450) * (1.1 - 0.5 * a) + bp(x, 1100, 0.5) * 0.7 * a ** 2 + sine(f, n) * 0.5
    return (y + bp(noise(n, seed), 1400, 0.4) * 0.03) * amp
def accordion(f, amp, n, seed):   # free reeds in pairs a little apart (the musette's beating), through the box
    x = pulse(f, n, 0.42) * 0.5 + pulse(f * 1.004, n, 0.38) * 0.4 + pulse(f * 2.0, n, 0.3) * 0.12
    return lp(bp(x, 1300, 0.25) * 0.8 + lp(x, 700) * 0.5, 5500) * amp
def dulcimer(f, seed):   # struck strings in courses of three, a hair apart, very bright, ringing
    return sum(pluck(f * d, 0.9, 0.994, 0.85, seed + k, 0.08) for k, d in enumerate((1.0, 1.0015, 0.9988))) * 0.4
def bell(f, dur, seed):   # a cowbell on the alp (a sheet-metal bell): inharmonic partials, the clapper striking a few times as it swings
    r = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for hit in np.cumsum(r.uniform(0.18, 0.45, 3)) - 0.18:
        k = int(hit * SR); tt = t[:n - k]; v = r.uniform(0.5, 1.0)
        for p, d in ((1.0, 0.5), (1.51, 0.3), (2.37, 0.18), (3.13, 0.12), (4.47, 0.07)):
            x[k:] += v * sine(f * p * (1 + r.uniform(-0.004, 0.004)), n - k) * np.exp(-tt / (0.35 * d / 0.5 + 0.03)) * (0.6 if p > 1 else 1.0)
    return x * 0.3
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=380, res=0.2, env_amt=2.0, sub=0.25, drive=1.3)

bs = P.buses('drums perc acc dul bass horn pad bells fx air')
drums, perc, acc, dul, bas, horn, pad, bells, fx, air = bs.values()
KICK = kick(0.34, f0=130, f1=46, sweep=0.034, click=0.35, drive=1.4)
HH = [hat(0.04, seed=k, tone=9500) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8500) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def oompah(bar, g=0.22):   # the bass: the root on one, the fifth on three
    for o, d in ((0, 0), (2, 7)):
        beat = 4 * bar + o; r = P.CH[P.chord_at(beat)][0]
        while r > 45: r -= 12
        bas.add(bass(mtof(r + d), 1.2 * b, 0), T(beat), g * P.hum(0.05))
def pah(bar, g=0.07, cut=None):   # the accordion's chord on two and four (and its off-beat lift)
    for o in (1, 3):
        beat = 4 * bar + o; vs = P.CH[P.chord_at(beat)][1]
        for j, m in enumerate(vs):
            n = int(0.42 * b * SR); amp = adsr(n, 0.006, 0.08, 0.7, 0.04, gate=0.36 * b)[:n]
            x = accordion(mtof(m) * np.ones(n), amp, n, j); x = lp(x, cut) if cut else x
            acc.add(x, T(beat) + P.jit(0.002), g * P.hum(0.05), pan=PANS[len(vs)][j] * 0.5)
def dul_bar(bar, g=0.07, step=0.5, pan=0.35):   # arpeggios up and down the chord
    for k in range(int(4 / step)):
        beat = 4 * bar + k * step; vs = sorted(P.CH[P.chord_at(beat)][1]); m = (vs + vs[::-1][1:-1])[k % (2 * len(vs) - 2)] + 12
        dul.add(dulcimer(mtof(m), bar * 50 + k), T(beat) + P.jit(0.003), g * (1.0 if k % 2 == 0 else 0.7) * P.hum(0.1), pan=pan - 0.1 * (k % 3))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=31, base=900, depth=1.3); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.8, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.11)
P.pads(pad, -44, -8, 0.12, cutoff=1100, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.13, cutoff=1800, a=0.5)
t0, x = P.breath(CALL, alphorn, seed=2, vib=0.04, vib_rate=4.0, tail=1.0); horn.add(x, t0, 0.26, pan=-0.15)
for k, (beat, f, pn) in enumerate([(-43, 620, -0.7), (-39.5, 880, 0.6), (-35, 540, 0.8), (-30.5, 730, -0.5), (-27, 980, 0.3), (-22, 660, -0.8),
                                   (-18.5, 810, 0.7), (-15, 590, -0.3), (-11.5, 700, 0.55), (-9, 920, -0.6)]):
    bells.add(bell(f, 2.2, 40 + k), T(beat), 0.1 if k % 3 else 0.06, pan=pn)
for bar in range(-4, -2):
    for k in range(16): dul.add(dulcimer(mtof(72 if k % 2 else 77), 400 + 16 * bar + k), T(4 * bar + k / 4), (0.02 + 0.006 * (bar + 4) * 4 + 0.001 * k) * P.hum(0.2), pan=0.3)
for bar in (-2, -1): pah(bar, 0.04 + 0.02 * (bar + 2), cut=1800); oompah(bar, 0.2) if bar == -1 else None; dul_bar(bar, 0.05)
for k in range(8): P.kick(drums, KICK, -8 + k, 0.3 + 0.015 * k)
for k in range(8): drums.add(HH[k % 4], T(-2 + k / 4), 0.04 + 0.01 * k, pan=0.4)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.25); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..13)
fx.add(boom(87.3, seed=1), T(0), 0.44); perc.add(crash(2.8, seed=41), T(0), 0.26, pan=-0.35); perc.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 13 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        for k in range(16): dul.add(dulcimer(mtof((65, 69, 72, 77)[k % 4] + 12), 600 + 16 * bar + k), T(t4 + k / 4), 0.035 * P.hum(0.2), pan=0.35)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14); bells.add(bell(760, 2.2, 90), T(t4 + 1), 0.08, pan=0.6); bells.add(bell(560, 2.2, 91), T(t4 + 3), 0.07, pan=-0.6)
        else:
            oompah(bar, 0.2); pah(bar, 0.05, cut=2200)
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.28 + 0.05 * k)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.36)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.1 if sec == 'A' else 0.13, pan=0.4)
    if sec != 'A':
        for k in range(16): drums.add(HH[k % 4], T(t4 + k / 4), (0.07 if k % 2 else 0.05) * P.hum(0.15), pan=-0.45 if k % 4 == 2 else 0.45)
        for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.12, pan=-0.1)
    oompah(bar); pah(bar, 0.07 if sec == 'A' else 0.085)
    dul_bar(bar, 0.09 if sec == 'A' else 0.11, step=0.25 if sec in ('CH', 'RUN') else 0.5)
    if bar in (4, 10): perc.add(crash(2.6, seed=bar), T(t4), 0.24, pan=0.3)
    if bar in (2, 6, 11): bells.add(bell((700, 820, 640)[bar % 3], 2.0, 100 + bar), T(t4 + 2.5), 0.05, pan=(-0.6, 0.6)[bar % 2])
    if bar == 13:
        for k in range(8): perc.add(tom(140 + 12 * k, 0.3), T(t4 + 2 + k / 4), 0.1 + 0.02 * k, pan=-0.4 + 0.1 * k)
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.08); P.pads(pad, 32, 40, 0.11, cutoff=1400, a=0.8); P.pads(pad, 40, LAND, 0.1, cutoff=3000)
for line, sd in ((YODEL, 5), (YODEL2, 6), (CHORUS, 9)):
    t0, x = P.breath(line, accordion, seed=sd, vib=0.0); acc.add(x, t0, 0.42, pan=0.1)
for line, sd in ((YODEL2, 6), (CHORUS, 9)): P.play(dul, [(a, l, m) for a, l, m, _ in line], lambda f, s, sd: dulcimer(f, sd), g=0.1, pan=-0.3, up=12, seed=700 + sd)
t0, x = P.breath(NEAR, alphorn, seed=8, vib=0.04, vib_rate=4.0, tail=1.0); horn.add(x, t0, 0.45, pan=0.1)

# ================================================================ LANDING: bar 14 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.72); fx.add(boom(87.3, seed=4), L0, 0.46)
perc.add(crash(3.2, seed=51), L0, 0.28, pan=-0.35); perc.add(crash(3.2, seed=52), L0, 0.24, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.18, cutoff=5000, a=0.008, r=1.3)
n = int(1.8 * SR); amp = adsr(n, 0.01, 0.2, 0.8, 0.5, gate=1.3)[:n]
for j, m in enumerate([65, 69, 72, 77, 81]): acc.add(accordion(mtof(m) * np.ones(n), amp, n, j), L0, 0.09, pan=PANS[5][j] * 0.6)
strum(dul, P, LAND, [77, 81, 84, 89], lambda f, s: dulcimer(f, s), 0.12, spread=0.03, pan=-0.2, seed=300)
bas.add(bass(mtof(41), 1.6, 0), L0, 0.45); bells.add(bell(700, 2.5, 120), L0 + 0.3, 0.07, pan=0.6)

P.finish(bs, {'pad': 0.25, 'acc': 0.18, 'dul': 0.22, 'horn': 0.5, 'bells': 0.5, 'fx': 0.2, 'perc': 0.06, 'drums': 0.03}, 'switzerland',
         lufs=-13.5, highs_db=3.0, lows_db=-2.0, size=1.6, decay=3.0,
         delays=[('horn', 3.0, 0.32, 0.35), ('acc', 0.75, 0.08, 0.25)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'acc': (0.12, 0.1)})
