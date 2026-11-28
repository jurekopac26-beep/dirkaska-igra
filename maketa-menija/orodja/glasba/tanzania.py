"""Tanzania (the highlands of the north: the rim of a great volcanic crater, the grass plain far below, the acacias, the morning
mist, the wide sky): a bright East African dance over a dance beat. A wooden marimba plays the interlocking figures (two players, one
on the beat, one between), a thumb piano sparkles high, the drums call and answer (low drums on the left, high on the right), the
shakers keep the sixteenths, a choir sings the long chords ('aah', 'ooh'), and the birds call over the plain in the intro. F major,
the pentatonic tune, the chords I-IV-V-vi, the landing on F. 119.15 bpm: 14 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations; no words are sung).

    intro (the globe)  bars -10..-1  the wind over the grass, the birds, an F pad, the choir humming far away ('ooh'), the thumb piano
                                     alone; the build: C, the drums' call and answer, the marimba, the riser
    drop  (20.0 s)     bar 0         the beat, the bass, the marimbas, the thumb piano's hook (F Bb C F)
    A' bars 4-7 (Dm Bb C F), breath 8-9 (Bb C: the choir and the drums alone), chorus 10-12 (Bb F C: the choir's long chords,
    the hook up an octave), the run 13 (C: the marimba in sixteenths), LANDING at bar 14 = 48.2 s on F
"""
from folk import *

P = Piece(N=14, seed=91); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'F': (41, [57, 60, 65, 69]), 'Bb': (46, [58, 62, 65, 70]), 'C': (48, [55, 60, 64, 67]), 'Dm': (38, [57, 62, 65, 69]),
          'Fhi': (41, [60, 65, 69, 72, 77])},
         [(-40, -16, 'F'), (-16, -8, 'Bb'), (-8, 0, 'C'),
          (0, 4, 'F'), (4, 8, 'Bb'), (8, 12, 'C'), (12, 16, 'F'), (16, 20, 'Dm'), (20, 24, 'Bb'), (24, 28, 'C'), (28, 32, 'F'),
          (32, 36, 'Bb'), (36, 40, 'C'), (40, 44, 'Bb'), (44, 48, 'F'), (48, 52, 'C'), (52, 56, 'C'), (56, 72, 'Fhi')])

# ================================================================ the tunes (beat, beats, midi)
def row(b0, ns):
    out, t = [], b0
    for m, ln in ns: out.append((t, ln, m)); t += ln
    return out
HOOK = (row(0, [(77, .5), (79, .5), (81, .75), (79, .25), (77, .5), (74, .5), (72, 1)]) +
        row(4, [(74, .5), (77, .5), (79, .75), (77, .25), (74, .5), (72, .5), (70, 1)]) +
        row(8, [(72, .5), (76, .5), (79, .75), (76, .25), (72, .5), (74, .5), (76, 1)]) +
        row(12, [(77, .5), (76, .5), (74, .5), (72, .5), (77, 2)]))
HOOK2 = (row(16, [(74, .5), (77, .5), (81, .75), (77, .25), (74, .5), (72, .5), (69, 1)]) + row(20, [(70, .5), (74, .5), (77, .75), (74, .25), (70, .5), (72, .5), (74, 1)]) +
         row(24, [(76, .5), (79, .5), (84, .75), (79, .25), (76, .5), (74, .5), (72, 1)]) + row(28, [(77, 1), (81, 1), (77, 2)]))
CHOR = [(a + 40, l, {(7, 70): 81, (14, 77): 88}.get((a, m), m + 12)) for a, l, m in HOOK]
MAR_A = {0: 0, 1: 2, 2: 1, 3: 3}   # the first marimba's pattern: the chord's tones by index, eighths on the beat
HUM = [(-36, 4, 69, 't', 0.7), (-32, 2, 72, 's', 0.7), (-30, 2, 74, 's', 0.7), (-28, 4, 72, 's', 0.7), (-24, 4, 77, 't', 0.75), (-20, 4, 74, 's', 0.7)]
RUN = [(52 + k / 4, .25, m) for k, m in enumerate([72, 74, 76, 79, 81, 79, 76, 74, 72, 76, 79, 81, 84, 86, 88, 91])]
P.check(HOOK, HOOK2, CHOR, HUM)

# ================================================================ timbres
def marimba(f, dur, seed):   # a wooden bar over a tuned tube: the fundamental, the bar's 4th partial, a soft knock
    n = int(0.6 * SR); t = np.arange(n) / SR
    x = np.sin(TAU * f * t) * np.exp(-t / 0.35) + 0.25 * np.sin(TAU * f * 3.93 * t) * np.exp(-t / 0.05) + 0.08 * np.sin(TAU * f * 9.2 * t) * np.exp(-t / 0.015)
    return x * np.clip(t / 0.002, 0, 1) + bp(noise(n, abs(int(seed))), 1200, 0.4) * np.exp(-t / 0.004) * 0.2
def kalimba(f, dur, seed):   # a thumb piano: a metal tine on a box, a bright ping and a buzz
    n = int(1.0 * SR); t = np.arange(n) / SR
    x = np.sin(TAU * f * t) * np.exp(-t / 0.5) + 0.5 * np.sin(TAU * f * 5.4 * t) * np.exp(-t / 0.06) + 0.1 * np.sin(TAU * f * 2.0 * t) * np.exp(-t / 0.2)
    return x * np.clip(t / 0.001, 0, 1)
def choir(vowel):
    F = {'a': ((800, 1.0), (1150, 0.6), (2900, 0.2)), 'o': ((450, 1.0), (800, 0.5), (2830, 0.1))}[vowel]
    def tim(f, amp, n, seed):
        x = sum(saw(f * d, n) for d in (1.0, 1.004, 0.996, 1.007)) * 0.25
        return (sum(bp(x, fc, 0.35) * g for fc, g in F) + bp(noise(n, seed), 1500, 0.5) * 0.02) * amp
    return tim
def bird(f0, seed):   # a bird's call: two or three fast chirps of a sine sliding up and down
    r = np.random.default_rng(seed); out = []
    for k in range(int(r.integers(2, 4))):
        n = int(0.09 * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.25 * np.sin(np.pi * t / 0.09)) * r.uniform(0.95, 1.05)
        out += [np.sin(np.cumsum(TAU * f / SR)) * np.sin(np.pi * t / 0.09) ** 2, np.zeros(int(0.05 * SR))]
    return np.concatenate(out)
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=650, res=0.12, env_amt=1.2, sub=0.25, drive=1.2)

bs = P.buses('drums hand mar kal choir bass pad far fx air')
drums, hand, mar, kal, cho, bas, pad, far, fx, air = bs.values()
KICK = kick(0.28, f0=130, f1=52, sweep=0.03, click=0.32, drive=1.4)
LO = [frame_drum(85, 0.35, k, slap=0.2) for k in range(2)]; MID = [frame_drum(150, 0.22, 5 + k, slap=0.5) for k in range(2)]
HI = [frame_drum(240, 0.14, 10 + k, slap=0.9, damp=0.5) for k in range(2)]
SH = [shaker(0.07, seed=k) for k in range(4)]; OH = [hat(open_=True, seed=30 + k, tone=8500) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def drums_bar(bar, g=0.18, answer=True):   # the call (low drums, left) and the answer (high drums, right)
    for o, x, v, p in ((0, LO, 1.0, -0.45), (0.75, LO, 0.6, -0.45), (1.5, MID, 0.7, -0.3)):
        hand.add(x[int(o * 4) % 2], T(4 * bar + o) + P.jit(0.004), g * v * P.hum(0.1), pan=p)
    if answer:
        for o, x, v, p in ((2, HI, 0.8, 0.45), (2.5, HI, 0.6, 0.45), (2.75, MID, 0.6, 0.3), (3.25, HI, 0.7, 0.45), (3.5, HI, 0.5, 0.45)):
            hand.add(x[int(o * 4) % 2], T(4 * bar + o) + P.jit(0.004), g * v * P.hum(0.1), pan=p)
def shaker_bar(bar, g=0.06):
    g *= 1.5
    for k in range(16): drums.add(SH[k % 4], T(4 * bar + k / 4 + (0.03 if k % 2 else 0)), g * (1.0, 0.45, 0.7, 0.45)[k % 4] * P.hum(0.15), pan=0.55)
def marimba_bar(bar, g=0.1):   # two players interlocking: one on the eighths, one on the off-sixteenths
    for k in range(8):
        beat = 4 * bar + 0.5 * k; vs = sorted(P.CH[P.chord_at(beat)][1]); m = vs[MAR_A[k % 4]]
        mar.add(marimba(mtof(m), 0.3, bar * 20 + k), T(beat) + P.jit(0.003), g * (1.0 if k % 2 == 0 else 0.75) * P.hum(0.1), pan=-0.4)
    for k in range(8):
        beat = 4 * bar + 0.5 * k + 0.25; vs = sorted(P.CH[P.chord_at(beat)][1]); m = (vs[3], vs[2], vs[3], vs[1])[k % 4] + 12
        if k % 4 != 3: mar.add(marimba(mtof(m), 0.3, bar * 20 + 10 + k), T(beat) + P.jit(0.003), g * 0.6 * P.hum(0.1), pan=0.4)
def bass_bar(bar, g=0.26):
    for o, d, ln in ((0, 0, .8), (1, 7, .4), (1.5, 12, .4), (2.5, 0, .5), (3, 7, .4), (3.5, 9, .4)):
        r = P.CH[P.chord_at(4 * bar + o)][0]
        while r > 45: r -= 12
        bas.add(bass(mtof(r + d), ln * b, 0), T(4 * bar + o), g * P.hum(0.06) * (1.0 if d == 0 else 0.7))

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=91, base=420, depth=1.0); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.14)
for k, (tt, f0) in enumerate([(2.0, 3200), (3.4, 3600), (5.5, 2800), (7.1, 4100), (9.0, 3300), (11.8, 3900), (13.5, 3000)]):
    air.add(bird(f0, 300 + k), tt, 0.035, pan=(-0.6, 0.5, -0.2, 0.7, -0.5, 0.3, 0.0)[k])
P.pads(pad, -40, -8, 0.19, cutoff=1300, a=3.0, r=1.5); P.pads(pad, -8, 0, 0.13, cutoff=1800, a=0.5)
t0, x = P.breath(HUM, choir('o'), seed=3, vib=0.12, vib_rate=5.0); far.add(x, t0, 0.42, pan=0.1)
P.play(kal, [(a - 32, l * 2, m + 12) for a, l, m in HOOK[:14]], kalimba, g=0.07, pan=0.3, seed=50)
for bar in (-4, -3): drums_bar(bar, 0.08 + 0.04 * (bar + 4), answer=bar == -3)
for bar in (-2, -1): drums_bar(bar, 0.16); marimba_bar(bar, 0.05 + 0.03 * (bar + 2)); shaker_bar(bar, 0.03 + 0.02 * (bar + 2)); bass_bar(bar, 0.18) if bar == -1 else None
for k in range(8): P.kick(drums, KICK, -8 + k, 0.28 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.24); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..13)
fx.add(boom(87.3, seed=1), T(0), 0.42); hand.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); hand.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 13 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        drums_bar(bar, 0.18); shaker_bar(bar, 0.04)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.26 + 0.05 * k)
            marimba_bar(bar, 0.06); fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.34)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.12 if sec == 'A' else 0.15, pan=0.4)
    for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.09 if sec == 'A' else 0.12, pan=-0.1)
    drums_bar(bar, 0.16 if sec == 'A' else 0.2); shaker_bar(bar, 0.06 if sec == 'A' else 0.075); marimba_bar(bar, 0.1 if sec == 'A' else 0.11); bass_bar(bar)
    if bar in (4, 10): hand.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if bar == 13: fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.07); P.pads(pad, 40, LAND, 0.07, cutoff=3000)
for s0, e0 in ((32, 40), (40, 52)):   # the choir's long chords: in the breath, in the chorus
    for s, e, c in P.CHORDS:
        a0, a1 = max(s, s0), min(e, e0)
        if a0 >= a1: continue
        for j, m in enumerate(P.CH[c][1]):
            cho.add(voice_choir(mtof(m + 12), (a1 - a0) * b + 0.2, 'a' if s0 == 40 else 'o', a=0.3, r=0.6, seed=j + s), T(a0), 0.11, pan=PANS[4][j] * 0.7)
P.play(kal, [(a, l, m + 12) for a, l, m in HOOK + HOOK2], kalimba, g=0.12, pan=0.15, seed=100); P.play(kal, [(a, l, m + 12) for a, l, m in CHOR], kalimba, g=0.09, pan=0.15, seed=200)
P.play(mar, CHOR, marimba, g=0.16, pan=-0.1, seed=250)
P.play(mar, RUN, marimba, g=0.2, pan=0.1, seed=400)

# ================================================================ LANDING: bar 14 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.7); hand.add(LO[0], L0, 0.4); fx.add(boom(87.3, seed=4), L0, 0.44)
hand.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); hand.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.17, cutoff=5000, a=0.008, r=1.3)
for j, m in enumerate([69, 72, 77, 81]): cho.add(voice_choir(mtof(m), 1.8, 'a', a=0.02, r=0.8, seed=60 + j), L0, 0.08, pan=PANS[4][j] * 0.7)
for j, m in enumerate([65, 69, 72, 77, 81]): mar.add(marimba(mtof(m), 0.5, 600 + j), L0 + 0.03 * j, 0.14, pan=PANS[5][j] * 0.6)
kal.add(kalimba(mtof(89), 1.0, 0), L0, 0.12, pan=0.2)
bas.add(bass(mtof(41), 1.6, 0), L0, 0.42)

P.finish(bs, {'pad': 0.25, 'mar': 0.12, 'kal': 0.22, 'choir': 0.35, 'far': 0.6, 'fx': 0.2, 'hand': 0.1, 'drums': 0.03, 'air': 0.2}, 'tanzania',
         lufs=-13.5, highs_db=5.0, lows_db=-1.5,
         delays=[('kal', 0.75, 0.15, 0.35), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'mar': (0.12, 0.1)})
