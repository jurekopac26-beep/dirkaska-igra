"""Kenya (the coast of the Indian Ocean: the old town of coral stone, the harbour, the palms, a warm wet wind): a bright East African
guitar dance over a dance beat. Picked guitars interlock (the lead sings the hook high on the neck in quick sixteenths; a second guitar
picks the chord in running sixteenths; a third answers it on the off-beats), the bass bounces between root, fifth and octave as busy as
a third guitar, a shaker and two hand drums keep the coast's lilting pulse, and a choir answers the lead (call and response: the guitar
calls, the voices answer 'aah'). E major, I-IV-V, the chorus up on the high E, the landing on E. 136.17 bpm: 16 bars from the drop to
the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations; no words are sung).

    intro (the globe)  bars -11..-1  the sea breeze, an E pad, the choir humming the hook far away at half speed ('ooh'), the hand
                                     drums coming nearer, the picked guitar muffled; the build: B7, the shaker, the riser
    drop  (20.0 s)     bar 0         the beat, the bass, the guitars, the lead's hook (E A B E)
    A' bars 4-7 (C#m A B E), breath 8-9 (A: the choir sings a slow line, the guitars and hand drums alone), chorus 10-13 (E A B A: the
    lead calls, the choir answers), the run 14-15 (B B7: the lead in sixteenths), LANDING at bar 16 = 48.2 s on E
"""
from folk import *

P = Piece(N=16, seed=53); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'E': (40, [56, 59, 64, 68]), 'A': (45, [57, 61, 64, 69]), 'B': (47, [54, 59, 63, 66]), 'C#m': (49, [56, 61, 64, 68]),
          'B7': (47, [54, 57, 63, 66]), 'Ehi': (40, [56, 59, 64, 68, 71])},
         [(-44, -24, 'E'), (-24, -16, 'A'), (-16, -8, 'E'), (-8, 0, 'B7'),
          (0, 4, 'E'), (4, 8, 'A'), (8, 12, 'B'), (12, 16, 'E'), (16, 20, 'C#m'), (20, 24, 'A'), (24, 28, 'B'), (28, 32, 'E'), (32, 40, 'A'),
          (40, 44, 'E'), (44, 48, 'A'), (48, 52, 'B'), (52, 56, 'A'), (56, 60, 'B'), (60, 64, 'B7'), (64, 80, 'Ehi')])

# ================================================================ the tunes (beat, beats, midi)
def row(b0, ns):   # (midi, beats) one after another from beat b0
    out, t = [], b0
    for m, ln in ns: out.append((t, ln, m)); t += ln
    return out
FIG = lambda a, b_, c, d, e, f: [(a, .5), (b_, .5), (c, .5), (b_, .25), (a, .25), (d, .5), (e, .5), (f, 1)]
HOOK = (row(0, [(83, .5), (80, .5), (76, .5), (80, .25), (83, .25), (85, .5), (83, .5), (80, 1)]) +
        row(4, [(81, .5), (85, .5), (88, .5), (85, .25), (81, .25), (80, .5), (78, .5), (76, 1)]) +
        row(8, [(78, .5), (81, .5), (83, .5), (81, .25), (78, .25), (75, .5), (78, .5), (83, 1)]) +
        row(12, [(80, .5), (78, .5), (76, .5), (78, .25), (80, .25), (83, 1), (76, 1)]))
ANS = (row(16, FIG(80, 76, 73, 83, 80, 76)) + row(20, FIG(81, 76, 73, 85, 83, 81)) + row(24, FIG(83, 78, 75, 87, 85, 83)) +
       row(28, [(88, .5), (87, .5), (85, .5), (83, .25), (80, .25), (83, 1), (76, 1)]))
CALLS = (row(40, [(83, .25), (85, .25), (88, .5), (85, .5), (83, .5)]) + row(44, [(85, .25), (88, .25), (90, .5), (88, .5), (85, .5)]) +
         row(48, [(87, .25), (90, .25), (92, .5), (90, .5), (87, .5)]) + row(52, [(85, .5), (88, .5), (85, .5), (81, .5)]))
RUN = [(56 + k / 4, .25, m) for k, m in enumerate([78, 83, 87, 90, 87, 83, 78, 83] * 2 + [78, 81, 83, 87, 90, 87, 83, 81] + [83, 87, 90, 93, 95, 93, 90, 87])]
HUM = [(-40 + 2 * bt, 2 * ln, m, 's' if k else 't', 0.8) for k, (bt, ln, m) in enumerate(HOOK[:16])]
SLOW = [(32, 1, 76, 't'), (33, 1, 78, 's'), (34, 2, 81, 's'), (36, 1, 80, 's'), (37, 1, 78, 's'), (38, 2, 76, 's', 0.85)]
P.check([(a, l, m) for a, l, m in HOOK], ANS, CALLS, SLOW)

# ================================================================ timbres
def guitar(f, dur, seed, bright=0.7, damp=0.993):   # a clean electric guitar picked near the bridge: bright, a short sustain
    x = pluck(f, max(0.25, dur) + 0.25, damp, bright, seed, 0.1)
    return lp(x, 5000) * 0.8 + bp(x, 2200, 0.5) * 0.4
def choir(vowel):   # many voices: detuned saws through the vowel's formants
    F = {'a': ((800, 1.0), (1150, 0.6), (2900, 0.2)), 'o': ((450, 1.0), (800, 0.5), (2830, 0.1))}[vowel]
    def tim(f, amp, n, seed):
        x = sum(saw(f * d, n) for d in (1.0, 1.004, 0.996, 1.007)) * 0.25
        return (sum(bp(x, fc, 0.35) * g for fc, g in F) + bp(noise(n, seed), 1500, 0.5) * 0.02) * amp
    return tim
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=700, res=0.15, env_amt=1.5, sub=0.25, drive=1.2)

bs = P.buses('drums hand gtr lead bass choir pad far fx air')
drums, hand, gtr, lead, bas, cho, pad, far, fx, air = bs.values()
KICK = kick(0.32, f0=135, f1=48, sweep=0.032, click=0.35, drive=1.4)
LO = [frame_drum(95, 0.3, k, slap=0.3) for k in range(2)]; HI = [frame_drum(210, 0.15, 10 + k, slap=0.9, damp=0.5) for k in range(2)]
SH = [shaker(0.08, seed=k) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8500) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def hand_bar(bar, g=0.2):   # the coast's lilt: low on 1 and the and-of-2, high answering in between
    for o, x, v in ((0, LO, 1.0), (0.75, HI, 0.6), (1.5, LO, 0.8), (2.5, HI, 0.8), (3, HI, 0.5), (3.5, LO, 0.7), (3.75, HI, 0.5)):
        hand.add(x[int(o * 4) % 2], T(4 * bar + o) + P.jit(0.004), g * v * P.hum(0.1), pan=-0.3 if x is LO else 0.35)
def shaker_bar(bar, g=0.06):
    for k in range(16): drums.add(SH[k % 4], T(4 * bar + k / 4 + (0.04 if k % 2 else 0)), g * (1.0, 0.45, 0.7, 0.45)[k % 4] * P.hum(0.15), pan=0.55)
def pick_bar(bar, g=0.07, cut=None):   # guitar 2: the chord's tones in running sixteenths (low, high, middle, high); guitar 3 on the off-beats
    for k in range(16):
        beat = 4 * bar + k / 4; vs = sorted(P.CH[P.chord_at(beat)][1]); m = (vs[0], vs[3], vs[1], vs[2])[k % 4] + 12
        x = guitar(mtof(m), 0.2 * b, bar * 30 + k, bright=0.6, damp=0.985); x = lp(x, cut) if cut else x
        gtr.add(x, T(beat) + P.jit(0.002), g * (1.0 if k % 4 == 0 else 0.7) * P.hum(0.1), pan=-0.5)
    for k in (1, 3, 5, 7):
        beat = 4 * bar + 0.5 * k; vs = sorted(P.CH[P.chord_at(beat)][1])
        for j, m in enumerate(vs[1:]):
            x = guitar(mtof(m + 12), 0.3 * b, bar * 30 + 50 + 3 * k + j, bright=0.55, damp=0.98); x = lp(x, cut) if cut else x
            gtr.add(x, T(beat) + j * 0.006, g * 0.5 * P.hum(0.1), pan=0.5)
def bass_bar(bar, g=0.24):   # root, fifth, octave, bouncing
    r = P.CH[P.chord_at(4 * bar)][0]
    while r > 45: r -= 12
    for o, d, ln in ((0, 0, .6), (.75, 7, .4), (1.5, 12, .4), (2, 0, .6), (2.75, 7, .4), (3.25, 4, .3), (3.5, 12, .4)):
        bas.add(bass(mtof(r + d), ln * b, 0), T(4 * bar + o), g * P.hum(0.06) * (1.0 if d == 0 else 0.75))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=51, base=380, depth=0.9); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.13)
P.pads(pad, -44, -8, 0.13, cutoff=1300, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.13, cutoff=1800, a=0.5)
t0, x = P.breath(HUM, choir('o'), seed=3, vib=0.12, vib_rate=5.0); far.add(x, t0, 0.3, pan=0.1)
for bar in range(-7, -2): hand_bar(bar, 0.04 + 0.03 * (bar + 7))
for bar in range(-5, -2): pick_bar(bar, 0.03 + 0.015 * (bar + 5), cut=1200)
for bar in (-2, -1): hand_bar(bar, 0.2); pick_bar(bar, 0.06); shaker_bar(bar, 0.03 + 0.02 * (bar + 2)); bass_bar(bar, 0.18) if bar == -1 else None
for k in range(8): P.kick(drums, KICK, -8 + k, 0.3 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.25); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..15)
fx.add(boom(82.4, seed=1), T(0), 0.44); hand.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); hand.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        hand_bar(bar, 0.2); pick_bar(bar, 0.05); shaker_bar(bar, 0.04)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.28 + 0.05 * k)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.36)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.08 if sec == 'A' else 0.11, pan=0.4)
    for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.1 if sec == 'A' else 0.13, pan=-0.1)
    hand_bar(bar, 0.18 if sec == 'A' else 0.22); shaker_bar(bar, 0.06 if sec == 'A' else 0.075); pick_bar(bar, 0.08 if sec == 'A' else 0.09); bass_bar(bar)
    if bar in (4, 10): hand.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if sec == 'CH':   # the choir's answer on beats 2-4
        for j, m in enumerate(P.CH[P.chord_at(t4 + 2)][1]):
            cho.add(voice_choir(mtof(m + 12), 1.9 * b, 'a', a=0.04, r=0.3, seed=j + bar), T(t4 + 2), 0.07, pan=PANS[4][j] * 0.7)
    if bar == 15: fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.09); P.pads(pad, 32, 40, 0.12, cutoff=1500, a=0.8); P.pads(pad, 40, LAND, 0.1, cutoff=3000)
GL = lambda f, s, sd: guitar(f, s, sd, bright=0.75, damp=0.994)
P.play(lead, HOOK, GL, g=0.36, pan=0.15, seed=100); P.play(lead, ANS, GL, g=0.36, pan=0.15, seed=200)
P.play(lead, [(a, l, m - 12) for a, l, m in ANS], GL, g=0.14, pan=-0.2, seed=250)
P.play(lead, CALLS, GL, g=0.38, pan=0.15, seed=300); P.play(lead, RUN, GL, g=0.24, pan=0.15, seed=400)
t0, x = P.breath(SLOW, choir('a'), seed=8, vib=0.15, vib_rate=5.0); cho.add(x, t0, 0.3, pan=0.0)
t0, x = P.breath([(n[0], n[1], n[2] - 5) + tuple(n[3:]) for n in SLOW], choir('a'), seed=9, vib=0.15); cho.add(x, t0, 0.15, pan=-0.3)

# ================================================================ LANDING: bar 16 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.72); hand.add(LO[0], L0, 0.4); fx.add(boom(82.4, seed=4), L0, 0.46)
hand.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); hand.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.18, cutoff=5000, a=0.008, r=1.3)
for j, m in enumerate([68, 71, 76, 80]): cho.add(voice_choir(mtof(m), 1.6, 'a', a=0.02, r=0.8, seed=60 + j), L0, 0.09, pan=PANS[4][j] * 0.7)
strum(lead, P, LAND, [52, 59, 64, 68, 71, 76], lambda f, s: guitar(f, 2.0, s, bright=0.75, damp=0.997), 0.2, spread=0.02, pan=0.0, seed=500)
bas.add(bass(mtof(40), 1.6, 0), L0, 0.45)

P.finish(bs, {'pad': 0.25, 'gtr': 0.12, 'lead': 0.18, 'choir': 0.3, 'far': 0.6, 'fx': 0.2, 'hand': 0.08, 'drums': 0.03}, 'kenya',
         lufs=-13.5, highs_db=3.0, lows_db=-2.0,
         delays=[('lead', 0.75, 0.12, 0.3), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'gtr': (0.15, 0.1)})
