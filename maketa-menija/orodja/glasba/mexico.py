"""Mexico (the high plateau in the middle of the country: the old town of stone and tiled domes, the dry hills, the cactus and the
mesquite, the bright light): a festive string-and-brass dance over a dance beat. Two trumpets sing the tune in thirds (the bright,
proud call with a warm vibrato), the violins answer and double it, a small high five-string guitar strums bright chords on the
off-beats, a big deep bass guitar plucks the root and the fifth, the accents fall in threes, threes and twos across the bar, and the
beat drives underneath. No voices. G major, I-IV-V7, the landing on G. 136.17 bpm: 16 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations; no words are sung).

    intro (the globe)  bars -11..-1  the warm dry wind, the cicadas, a G pad, one trumpet far off (slow, free), the guitar strumming
                                     muffled; the build: D7, the strums, the riser
    drop  (20.0 s)     bar 0         the beat, the deep bass guitar, the trumpets' tune in thirds (G C D7 G)
    A' bars 4-7 (Em C D7 G), breath 8-9 (C D: the violins alone, slow), chorus 10-13 (C G D7 G: the trumpets up, the violins with
    them), the run 14-15 (D D7: the violins and trumpets in a run), LANDING at bar 16 = 48.2 s on G
"""
from folk import *

P = Piece(N=16, seed=81); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'G': (43, [55, 59, 62, 67]), 'C': (48, [55, 60, 64, 67]), 'D7': (50, [57, 60, 66, 69]), 'D': (50, [57, 62, 66, 69]),
          'Em': (40, [55, 59, 64, 67]), 'Ghi': (43, [59, 62, 67, 71, 74])},
         [(-44, -24, 'G'), (-24, -16, 'C'), (-16, -8, 'G'), (-8, 0, 'D7'),
          (0, 4, 'G'), (4, 8, 'C'), (8, 12, 'D7'), (12, 16, 'G'), (16, 20, 'Em'), (20, 24, 'C'), (24, 28, 'D7'), (28, 32, 'G'),
          (32, 36, 'C'), (36, 40, 'D'), (40, 44, 'C'), (44, 48, 'G'), (48, 52, 'D7'), (52, 56, 'G'), (56, 60, 'D'), (60, 64, 'D7'), (64, 80, 'Ghi')])

# ================================================================ the tunes (beat, beats, midi, how)
def row(b0, ns):
    out, t = [], b0
    for k, (m, ln) in enumerate(ns): out.append((t, ln, m, 't')); t += ln
    return out
TUNE = (row(0, [(74, .5), (74, .5), (79, 1), (78, .5), (79, .5), (81, 1)]) + row(4, [(79, 1.5), (76, .5), (72, 1), (76, 1)]) +
        row(8, [(78, .5), (78, .5), (81, 1), (79, .5), (78, .5), (76, .5), (74, .5)]) + row(12, [(71, 1), (74, 1), (79, 2)]) +
        row(16, [(71, .5), (71, .5), (76, 1), (74, .5), (76, .5), (79, 1)]) + row(20, [(76, 1.5), (72, .5), (67, 1), (72, 1)]) +
        row(24, [(74, .5), (78, .5), (81, 1), (84, .5), (81, .5), (78, .5), (74, .5)]) + row(28, [(79, 3), (74, 1)]))
CHOR = (row(40, [(79, .5), (79, .5), (84, 1), (83, .5), (84, .5), (88, 1)]) + row(44, [(86, 1.5), (83, .5), (79, 1), (83, 1)]) +
        row(48, [(81, .5), (81, .5), (84, 1), (86, .5), (84, .5), (81, .5), (78, .5)]) + row(52, [(79, 1), (83, 1), (86, 2)]))
def third_under(n):   # the second trumpet: a diatonic third (or a sixth) under, from the chord
    m = n[2]; c = P.chord_at(n[0]); pcs = {P.CH[c][0] % 12} | {x % 12 for x in P.CH[c][1]}
    for d in (3, 4, 8, 9, 5):
        if (m - d) % 12 in pcs: return (n[0], n[1], m - d) + tuple(n[3:])
    return (n[0], n[1], m - 3) + tuple(n[3:])
FAR = [(-40, 1, 74, 't', 0.7), (-39, 3, 79, 's', 0.75), (-36, 1, 78, 't', 0.7), (-35, 1, 76, 's', 0.7), (-34, 2, 74, 's', 0.7),
       (-32, 4, 71, 'g', 0.7), (-24, 1, 72, 't', 0.7), (-23, 3, 76, 's', 0.7), (-20, 4, 74, 'f', 0.65)]
SLOW = [(32, 1.5, 76, 't'), (33.5, .5, 79, 's'), (34, 2, 84, 's'), (36, 1.5, 81, 't'), (37.5, .5, 78, 's'), (38, 2, 74, 's')]
RUN = [(56 + k / 4, .25, m) for k, m in enumerate([74, 78, 81, 86, 81, 78, 74, 78] * 2 + [72, 74, 78, 81, 84, 81, 78, 74, 72, 74, 78, 81, 84, 86, 88, 90])]
P.check(TUNE, CHOR, FAR, SLOW)

# ================================================================ timbres
def trumpet(f, amp, n, seed):   # brass: the partials grow with the breath (brighter when louder), a little buzz
    x = saw(f, n) * 0.6 + pulse(f, n, 0.35) * 0.3
    return (lp(x, 900 + 3600 * amp ** 1.5, 0.25) + bp(noise(n, seed), 1800, 0.5) * 0.02) * amp
def violin(f, amp, n, seed):
    x = sum(saw(f * d, n) for d in (1.0, 1.004, 0.997)) / 3
    return (bp(x, 700, 0.4) * 0.5 + bp(x, 3000, 0.5) * 0.6 + lp(x, 6000) * 0.2) * amp
def vihuela(f, dur, seed): x = pluck(f, max(0.2, dur) + 0.15, 0.985, 0.85, seed, 0.15); return hp(lp(x, 7000), 250)
def guitarron(f, dur, seed):   # the deep bass guitar: a big round plucked string, the body's boom
    x = pluck(f, max(0.4, dur) + 0.3, 0.995, 0.35, seed, 0.3)
    return lp(x, 1400) * 0.9 + sine(f, len(x)) * np.exp(-np.arange(len(x)) / SR / 0.35) * 0.25

bs = P.buses('drums hand vih tpt vln bass pad far fx air')
drums, hand, vih, tpt, vln, bas, pad, far, fx, air = bs.values()
KICK = kick(0.26, f0=135, f1=56, sweep=0.028, click=0.35, drive=1.4)
SH = [shaker(0.07, seed=k) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8500) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]
RIM = [rim(0.05, seed=k) for k in range(2)]

def strum_bar(bar, g=0.06, cut=None):   # the high guitar: off-beat strums, accents in 3+3+2 (the and-of-1, 3, and-of-4)
    for k in range(8):
        beat = 4 * bar + 0.5 * k; c = P.chord_at(beat); ms = [m + 12 for m in sorted(P.CH[c][1])]
        acc = k in (0, 3, 6)
        fn = (lambda f, s: lp(vihuela(f, 0.25, s), cut)) if cut else (lambda f, s: vihuela(f, 0.25, s))
        strum(vih, P, beat, ms, fn, g * (1.0 if acc else 0.55), spread=0.006, down=k % 2 == 0, pan=0.4, seed=bar * 100 + 10 * k)
def bass_bar(bar, g=0.26):   # the deep bass guitar: the root on 1, the fifth on 3, the walk in the bar's end
    for o, d, ln in ((0, 0, 1.4), (1.5, 0, .4), (2, 7, 1.0), (3.5, -5, .4)):
        r = P.CH[P.chord_at(4 * bar + o)][0]
        while r > 47: r -= 12
        bas.add(guitarron(mtof(r + d), ln * b, bar * 10 + int(o * 2)), T(4 * bar + o), g * P.hum(0.06) * (1.0 if d == 0 else 0.75))
def acc_bar(bar, g=0.08):   # the 3+3+2 accents on the rim and the claps
    for o in (0, 1.5, 3): hand.add(RIM[int(o) % 2], T(4 * bar + o) + P.jit(0.002), g, pan=-0.3)
    for k in range(8): hand.add(SH[k % 4], T(4 * bar + 0.5 * k), g * 0.5 * (1.0 if k % 2 else 0.6) * P.hum(0.15), pan=0.5)

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=81, base=500, depth=0.9); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.12)
n_c = int((T(-4) - 1.0) * SR); tc = np.arange(n_c) / SR
cic = bp(noise(n_c, 87), 5800, 0.15) * (0.5 + 0.5 * np.sign(np.sin(TAU * 31 * tc))) * np.clip(tc / 2.0, 0, 1) * np.clip((T(-4) - 1.0 - tc) / 3.0, 0, 1) * (0.6 + 0.4 * np.sin(TAU * tc / 5.1))
air.add((cic, cic * 0.7), 0.5, 0.02)
P.pads(pad, -44, -8, 0.16, cutoff=1300, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.13, cutoff=1800, a=0.5)
t0, x = P.breath(FAR, trumpet, seed=3, vib=0.15, vib_rate=5.5); far.add(x, t0, 0.12, pan=0.2)
for bar in range(-6, -2): strum_bar(bar, 0.02 + 0.008 * (bar + 6), cut=1800)
for bar in (-2, -1): strum_bar(bar, 0.05); acc_bar(bar, 0.05 + 0.02 * (bar + 2)); bass_bar(bar, 0.18) if bar == -1 else None
for k in range(8): P.kick(drums, KICK, -8 + k, 0.28 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.24); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..15)
fx.add(boom(98.0, seed=1), T(0), 0.42); hand.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); hand.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        strum_bar(bar, 0.04)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.26 + 0.05 * k)
            acc_bar(bar, 0.07); fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.31)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.09 if sec == 'A' else 0.12, pan=0.4)
    for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.1 if sec == 'A' else 0.13, pan=-0.1)
    strum_bar(bar, 0.06 if sec == 'A' else 0.07); acc_bar(bar, 0.08 if sec == 'A' else 0.1); bass_bar(bar)
    if bar in (4, 10): hand.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if bar == 15: fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.07); P.pads(pad, 32, 40, 0.1, cutoff=1500, a=0.8); P.pads(pad, 40, LAND, 0.08, cutoff=3000)
t0, x = P.breath(TUNE, trumpet, seed=10, vib=0.12, vib_rate=5.8); tpt.add(x, t0, 0.13, pan=0.2)
t0, x = P.breath([third_under(n) for n in TUNE], trumpet, seed=11, vib=0.12, vib_rate=5.6); tpt.add(x, t0, 0.1, pan=-0.2)
t0, x = P.breath(SLOW, violin, seed=12, vib=0.22, vib_rate=6.0); vln.add(x, t0, 0.3, pan=0.0)
t0, x = P.breath([(n[0], n[1], n[2] - 12) + tuple(n[3:]) for n in SLOW], violin, seed=13, vib=0.2); vln.add(x, t0, 0.12, pan=-0.3)
t0, x = P.breath(CHOR, trumpet, seed=14, vib=0.12, vib_rate=5.8); tpt.add(x, t0, 0.12, pan=0.2)
t0, x = P.breath([third_under(n) for n in CHOR], trumpet, seed=15, vib=0.12, vib_rate=5.6); tpt.add(x, t0, 0.09, pan=-0.2)
t0, x = P.breath(CHOR, violin, seed=16, vib=0.2, vib_rate=6.0); vln.add(x, t0, 0.17, pan=-0.4)
P.play(vln, RUN, lambda f, s, sd: voice_strings(f, s + 0.05, a=0.01, r=0.08, bright=0.8), g=0.18, pan=-0.3, seed=400)
P.play(tpt, RUN[16:], lambda f, s, sd: voice_brass(f, s + 0.04, a=0.01, r=0.06, bright=0.7), g=0.1, pan=0.25, seed=450)

# ================================================================ LANDING: bar 16 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.7); fx.add(boom(98.0, seed=4), L0, 0.44)
hand.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); hand.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.17, cutoff=5000, a=0.008, r=1.3)
t0, x = P.breath([(LAND, 3, 83, 't')], trumpet, seed=17, vib=0.18); tpt.add(x, t0, 0.12, pan=0.2)
t0, x = P.breath([(LAND, 3, 79, 't')], trumpet, seed=18, vib=0.18); tpt.add(x, t0, 0.1, pan=-0.2)
strum(vih, P, LAND, [67, 71, 74, 79, 83], lambda f, s: vihuela(f, 1.5, s), 0.1, spread=0.015, pan=0.3, seed=500)
bas.add(guitarron(mtof(43), 1.6, 0), L0, 0.42)

P.finish(bs, {'pad': 0.25, 'vih': 0.1, 'tpt': 0.2, 'vln': 0.25, 'far': 0.6, 'fx': 0.2, 'hand': 0.08, 'drums': 0.03}, 'mexico',
         lufs=-13.5, highs_db=2.0, lows_db=-3.5,
         delays=[('tpt', 0.75, 0.1, 0.3), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.3, 0.12), 'pad': (0.45, 0.2), 'vih': (0.15, 0.1)})
