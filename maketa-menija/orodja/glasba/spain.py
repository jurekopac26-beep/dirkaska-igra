"""Spain (an island in the western Mediterranean: the limestone mountains falling into the sea, the hairpins down to a cove, the pines,
the dry stone walls, the heat): a Spanish guitar dance over a dance beat. A nylon-string guitar plays arpeggios and strums in rasgueado
(the fingers flicked out one after another), a small three-holed flute with its drum (the island's old pipe and tabor) carries the tune high,
castanets and hand claps (palmas) keep the bright figures, a box drum knocks the low beat, and the harmony walks the old Andalusian
cadence down (A minor, G, F, E) and lands on the open E major that ends it. 119.15 bpm: 14 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations; no words are sung).

    intro (the globe)  bars -10..-1  the sea under the cliffs, the cicadas, an Am pad, the flute far off (slow, free), the guitar
                                     arpeggiating the cadence muffled; the build: E, the palmas, the rasgueado, the riser
    drop  (20.0 s)     bar 0         the beat, the box drum, the bass, the flute's tune over the cadence (Am G F E)
    A' bars 4-7 (Dm Am E Am), breath 8-9 (F E: the guitar alone, a slow falling line), chorus 10-12 (Am G F E: the flute up an octave,
    the castanets), the run 13 (E: the guitar's scale in sixteenths), LANDING at bar 14 = 48.2 s on E
"""
from folk import *

P = Piece(N=14, seed=61); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'Am': (45, [57, 60, 64, 69]), 'G': (43, [55, 59, 62, 67]), 'F': (41, [57, 60, 65, 69]), 'E': (40, [56, 59, 64, 68]),
          'Dm': (38, [57, 62, 65, 69]), 'Ehi': (40, [56, 59, 64, 68, 71])},
         [(-40, -16, 'Am'), (-16, -12, 'G'), (-12, -8, 'F'), (-8, 0, 'E'),
          (0, 4, 'Am'), (4, 8, 'G'), (8, 12, 'F'), (12, 16, 'E'), (16, 20, 'Dm'), (20, 24, 'Am'), (24, 28, 'E'), (28, 32, 'Am'),
          (32, 36, 'F'), (36, 40, 'E'), (40, 42, 'Am'), (42, 44, 'G'), (44, 46, 'F'), (46, 52, 'E'), (52, 56, 'E'), (56, 72, 'Ehi')])

# ================================================================ the tunes (beat, beats, midi[, how])
def row(b0, ns, how=True):
    out, t = [], b0
    for k, (m, ln) in enumerate(ns): out.append((t, ln, m, 't' if k == 0 or ln >= 1 else 's') if how else (t, ln, m)); t += ln
    return out
TUNE = (row(0, [(76, 1), (77, .5), (76, .5), (74, .5), (72, .5), (71, .5), (72, .5)]) +
        row(4, [(74, 1.5), (72, .5), (71, .5), (69, .5), (71, 1)]) +
        row(8, [(72, .5), (74, .5), (76, .5), (77, .5), (76, .5), (74, .5), (72, 1)]) +
        row(12, [(71, .5), (72, .5), (71, .5), (69, .5), (68, 2)]) +
        row(16, [(69, .5), (74, .5), (77, 1), (76, .5), (74, .5), (72, 1)]) +
        row(20, [(76, .5), (72, .5), (69, 1), (71, .5), (72, .5), (74, 1)]) +
        row(24, [(76, 1), (77, .5), (76, .5), (74, .5), (71, .5), (68, 1)]) +
        row(28, [(69, 3), (64, 1)]))
CHOR = (row(40, [(88, .5), (89, .5), (88, .5), (86, .5)]) + row(42, [(86, .5), (84, .5), (83, .5), (86, .5)]) +
        row(44, [(84, .5), (86, .5), (84, .5), (81, .5)]) + row(46, [(83, .5), (81, .5), (80, 1), (83, .5), (81, .5), (80, .5), (76, 1.5)]) +
        row(52, [(76, .5), (77, .5), (80, .5), (81, .5), (83, 1), (80, 1)]))
FAR = [(-36, 3, 76, 't', 0.7), (-33, 1, 74, 's', 0.7), (-32, 2, 76, 'o', 0.75), (-30, 2, 72, 's', 0.7), (-28, 4, 71, 'g', 0.75),
       (-24, 2, 72, 't', 0.7), (-22, 2, 71, 's', 0.7), (-20, 4, 69, 'f', 0.7)]
SLOW = [(32, 1.5, 77, 't'), (33.5, .5, 76, 's'), (34, 1, 74, 's'), (35, 1, 72, 's'), (36, 1, 71, 's'), (37, 1, 74, 's'), (38, 2, 68, 'g')]
RUN = [(52 + k / 4, .25, m) for k, m in enumerate([64, 65, 68, 69, 71, 72, 74, 76, 77, 80, 81, 83, 84, 83, 81, 80])]
P.check(TUNE, CHOR, FAR, SLOW)

# ================================================================ timbres
def nylon(f, dur, seed, bright=0.45, damp=0.996):   # a nylon-string guitar: warm, round, the body's resonance
    x = pluck(f, max(0.3, dur) + 0.4, damp, bright, seed, 0.25)
    return lp(x, 5500) * 0.7 + bp(x, 220, 0.6) * 0.15 + bp(x, 2500, 0.5) * 0.3
def flute(f, amp, n, seed):   # the small three-holed flute: a bright breathy tone, a strong second partial
    ph = np.cumsum(TAU * f / SR)
    x = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph) + bp(noise(n, seed), 3500, 0.5) * 0.12
    return x * amp
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=600, res=0.1, env_amt=1.0, sub=0.25, drive=1.1)
def castanet(seed):   # two shells of hard wood clicked together: a short bright knock
    n = int(0.04 * SR); t = np.arange(n) / SR
    return (bp(noise(n, seed), 2600, 0.25) * 1.2 + sine(1900, n) * 0.4) * np.exp(-t / 0.006)

bs = P.buses('drums hand gtr flute bass pad far fx air')
drums, hand, gtr, flu, bas, pad, far, fx, air = bs.values()
KICK = kick(0.3, f0=125, f1=46, sweep=0.03, click=0.3, drive=1.3)
BOX = [frame_drum(85, 0.25, k, slap=0.1, damp=0.8) for k in range(2)]; SLAP = [frame_drum(260, 0.12, 10 + k, slap=1.0, damp=0.4) for k in range(2)]
CA = [castanet(k) for k in range(4)]; CL = [clap(seed=k) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8000) for k in range(2)]
TABOR = [frame_drum(180, 0.18, 20 + k, slap=0.6, damp=0.6) for k in range(2)]

def box_bar(bar, g=0.2):   # the box drum: low on 1, the slap on 2 and 4, the low again on the and-of-2
    for o, x, v in ((0, BOX, 1.0), (1, SLAP, 0.7), (1.5, BOX, 0.6), (2.5, BOX, 0.7), (3, SLAP, 0.8), (3.75, SLAP, 0.4)):
        hand.add(x[int(o * 2) % 2], T(4 * bar + o) + P.jit(0.003), g * v * P.hum(0.1), pan=-0.2)
def palmas_bar(bar, g=0.07):   # the claps: the off-beats, a cross figure in the second half
    for o in (0.5, 1.5, 2, 2.75, 3.5):
        hand.add(CL[int(o * 4) % 4], T(4 * bar + o) + P.jit(0.006), g * P.hum(0.15), pan=0.45)
def castanet_bar(bar, g=0.07):   # the roll on 1, single clicks
    for o, v in ((0, 1.0), (0.125, 0.6), (0.25, 0.8), (1, 0.7), (2, 0.9), (2.125, 0.5), (2.25, 0.7), (3, 0.7), (3.5, 0.6)):
        hand.add(CA[int(o * 8) % 4], T(4 * bar + o) + P.jit(0.002), g * v * P.hum(0.1), pan=0.6)
def tabor_bar(bar, g=0.08):
    for o, v in ((0, 1.0), (1.5, 0.6), (2, 0.8), (3, 0.6), (3.5, 0.5)): hand.add(TABOR[int(o) % 2], T(4 * bar + o), g * v * P.hum(0.1), pan=-0.5)
def arp_bar(bar, g=0.08, cut=None):   # the guitar's arpeggio: bass, then up and down the chord in eighths
    for k in range(8):
        beat = 4 * bar + 0.5 * k; c = P.chord_at(beat); vs = sorted(P.CH[c][1]); r = P.CH[c][0]
        while r < 40: r += 12
        m = (r, vs[0], vs[1], vs[2], vs[3], vs[2], vs[1], vs[0])[k]
        x = nylon(mtof(m), 0.6 * b, bar * 20 + k); x = lp(x, cut) if cut else x
        gtr.add(x, T(beat) + P.jit(0.003), g * (1.2 if k == 0 else 0.8) * P.hum(0.1), pan=-0.35)
def rasg(beat, g=0.1, pan=0.35, seed=0):   # rasgueado: four fingers flicked out, the chord struck fast four times
    c = P.chord_at(beat); r = P.CH[c][0]
    while r < 40: r += 12
    ms = [r] + sorted(P.CH[c][1])
    for f in range(4):
        strum(gtr, P, beat + f * 0.0625, ms, lambda fr, s: nylon(fr, 0.4, s, bright=0.6, damp=0.99), g * 0.5 * (0.6 + 0.15 * f), spread=0.006, down=f % 2 == 0, pan=pan, seed=seed + 10 * f)
def bass_bar(bar, g=0.3):
    for o, d, ln in ((0, 0, 1.2), (1.5, 7, .5), (2, 0, .9), (3, 12, .4), (3.5, 7, .4)):
        r = P.CH[P.chord_at(4 * bar + o)][0]
        while r > 45: r -= 12
        bas.add(bass(mtof(r + d), ln * b, 0), T(4 * bar + o), g * P.hum(0.06) * (1.0 if d == 0 else 0.7))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=61, base=300, depth=0.8); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.12)
n_c = int((T(-4) - 1.0) * SR); tc = np.arange(n_c) / SR   # the cicadas in the pines: a buzzing high band, pulsing
cic = bp(noise(n_c, 77), 6500, 0.15) * (0.5 + 0.5 * np.sign(np.sin(TAU * 38 * tc))) * np.clip(tc / 2.0, 0, 1) * np.clip((T(-4) - 1.0 - tc) / 3.0, 0, 1) * (0.6 + 0.4 * np.sin(TAU * tc / 4.3))
air.add((cic * 0.7, cic), 0.5, 0.025)
P.pads(pad, -40, -8, 0.12, cutoff=1200, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.12, cutoff=1800, a=0.5)
t0, x = P.breath([(n[0], n[1], n[2] + 12) + tuple(n[3:]) for n in FAR], flute, seed=3, vib=0.12, vib_rate=5.0); far.add(x, t0, 0.09, pan=0.2)
for bar in range(-6, -2): arp_bar(bar, 0.04 + 0.015 * (bar + 6), cut=1500)
for bar in (-2, -1): arp_bar(bar, 0.07); palmas_bar(bar, 0.05 + 0.02 * (bar + 2)); box_bar(bar, 0.12 + 0.05 * (bar + 2))
rasg(-4, 0.08, seed=900); rasg(-2, 0.09, seed=910); rasg(-1, 0.1, seed=920)
for k in range(8): P.kick(drums, KICK, -8 + k, 0.28 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.24); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..13)
fx.add(boom(82.4, seed=1), T(0), 0.42); hand.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); hand.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 13 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        arp_bar(bar, 0.09); palmas_bar(bar, 0.04)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.26 + 0.05 * k)
            box_bar(bar, 0.15); rasg(t4 + 3, 0.1, seed=950)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.4)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.1 if sec == 'A' else 0.14, pan=0.4)
    box_bar(bar, 0.2); palmas_bar(bar, 0.07 if sec == 'A' else 0.09); arp_bar(bar, 0.055); bass_bar(bar); tabor_bar(bar, 0.07)
    if sec != 'A': castanet_bar(bar, 0.09 if sec == 'A2' else 0.12)
    rasg(t4 + 2, 0.08 if sec == 'A' else 0.1, pan=0.4, seed=1000 + 40 * bar)
    if sec == 'CH': rasg(t4, 0.09, pan=0.4, seed=2000 + 40 * bar)
    if bar in (4, 10): hand.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if bar == 13: fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.08); P.pads(pad, 32, 40, 0.11, cutoff=1500, a=0.8); P.pads(pad, 40, LAND, 0.09, cutoff=3000)
t0, x = P.breath([(n[0], n[1], n[2] + 12) + tuple(n[3:]) for n in TUNE], flute, seed=10, vib=0.15, vib_rate=5.5); flu.add(x, t0, 0.11, pan=0.1)
t0, x = P.breath(CHOR, flute, seed=11, vib=0.15, vib_rate=5.5); flu.add(x, t0, 0.1, pan=0.1)
t0, x = P.breath([(n[0], n[1], n[2] - 12) + tuple(n[3:]) for n in CHOR], flute, seed=12, vib=0.12); flu.add(x, t0, 0.05, pan=-0.25)
P.play(gtr, [n[:3] for n in SLOW], lambda f, s, sd: nylon(f, s, sd, bright=0.55), g=0.3, pan=0.1, seed=300)
P.play(gtr, RUN, lambda f, s, sd: nylon(f, s, sd, bright=0.6), g=0.24, pan=0.1, seed=400)

# ================================================================ LANDING: bar 14 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.7); hand.add(BOX[0], L0, 0.4); fx.add(boom(82.4, seed=4), L0, 0.44)
hand.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); hand.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
for k in range(3): hand.add(CA[k], L0 + k * 0.03, 0.08, pan=0.6)
P.pads(pad, LAND, LAND + 6, 0.17, cutoff=5000, a=0.008, r=1.3)
strum(gtr, P, LAND, [40, 47, 52, 56, 59, 64], lambda f, s: nylon(f, 2.2, s, bright=0.6, damp=0.998), 0.22, spread=0.018, pan=0.0, seed=500)
t0, x = P.breath([(LAND, 2.5, 92, 't')], flute, seed=13, vib=0.2); flu.add(x, t0, 0.07, pan=0.1)
bas.add(bass(mtof(40), 1.6, 0), L0, 0.42)

P.finish(bs, {'pad': 0.25, 'gtr': 0.18, 'flute': 0.22, 'far': 0.6, 'fx': 0.2, 'hand': 0.1, 'drums': 0.03}, 'spain',
         lufs=-13.5, highs_db=4.0, lows_db=-0.5,
         delays=[('flute', 0.75, 0.12, 0.3), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'gtr': (0.12, 0.1)})
