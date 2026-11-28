"""Denmark (the lake district in the middle of the peninsula: a chain of lakes in beech woods, the low hills, the river, the light over
the water): a bright northern folk dance over a gentle dance beat. A clarinet sings the tune (the woody, hollow tone of the low notes,
the clear high ones), a fiddle answers it and doubles it in the chorus, a plucked string keeps the dance's lilt, bells sparkle like the
light on the lakes, strings hold the chords, a soft hand drum and the beat underneath. G major, the chorus on the subdominant, the
landing on G. 127.66 bpm: 15 bars from the drop to the race's start.
Original: the tunes, the chords' voicing and every sound are written and computed here (no samples, no quotations; no words are sung).

    intro (the globe)  bars -10..-1  the wind in the beeches, the water lapping, a G pad, the bells (slow, far), the clarinet far off;
                                     the build: D, the plucked string, the hand drum, the riser
    drop  (20.0 s)     bar 0         the beat, the bass, the clarinet's tune (G C D G)
    A' bars 4-7 (Em C D G), breath 8-9 (C D: the fiddle alone, slow, the bells), chorus 10-13 (C G Am D: the clarinet and fiddle
    together, the clarinet a third under), the run 14 (D: the fiddle in sixteenths), LANDING at bar 15 = 48.2 s on G
"""
from folk import *

P = Piece(N=15, seed=71); T, b, B, LAND = P.T, P.b, P.B, P.LAND
P.chords({'G': (43, [55, 59, 62, 67]), 'C': (48, [55, 60, 64, 67]), 'D': (50, [57, 62, 66, 69]), 'Em': (40, [55, 59, 64, 67]),
          'Am': (45, [57, 60, 64, 69]), 'D7': (50, [57, 60, 66, 69]), 'Ghi': (43, [59, 62, 67, 71, 74])},
         [(-40, -16, 'G'), (-16, -8, 'C'), (-8, 0, 'D'),
          (0, 4, 'G'), (4, 8, 'C'), (8, 12, 'D'), (12, 16, 'G'), (16, 20, 'Em'), (20, 24, 'C'), (24, 28, 'D'), (28, 32, 'G'),
          (32, 36, 'C'), (36, 40, 'D'), (40, 44, 'C'), (44, 48, 'G'), (48, 52, 'Am'), (52, 56, 'D'), (56, 60, 'D7'), (60, 76, 'Ghi')])

# ================================================================ the tunes (beat, beats, midi, how)
def row(b0, ns):
    out, t = [], b0
    for k, (m, ln) in enumerate(ns): out.append((t, ln, m, 't' if k == 0 or (k % 3 == 0) else 's')); t += ln
    return out
TUNE = (row(0, [(74, 1), (71, .5), (74, .5), (79, 1), (78, .5), (76, .5)]) + row(4, [(76, 1), (72, .5), (76, .5), (79, 1.5), (76, .5)]) +
        row(8, [(78, .5), (76, .5), (74, .5), (72, .5), (74, 1), (69, 1)]) + row(12, [(71, .5), (72, .5), (74, .5), (76, .5), (74, 2)]) +
        row(16, [(71, 1), (67, .5), (71, .5), (76, 1), (74, .5), (71, .5)]) + row(20, [(72, 1), (76, .5), (79, .5), (76, 1.5), (72, .5)]) +
        row(24, [(74, .5), (78, .5), (81, .5), (78, .5), (76, .5), (74, .5), (72, .5), (69, .5)]) + row(28, [(71, 1), (74, 1), (79, 2)]))
CHOR = (row(40, [(79, 1), (76, .5), (79, .5), (84, 1.5), (83, .5)]) + row(44, [(83, 1), (79, .5), (83, .5), (86, 1.5), (83, .5)]) +
        row(48, [(84, .5), (83, .5), (81, .5), (79, .5), (81, 1), (76, 1)]) + row(52, [(78, .5), (79, .5), (81, .5), (83, .5), (81, 2)]))
UNDER = {'C': 64, 'G': 59, 'Am': 60, 'D': 62}   # the clarinet's harmony: a diatonic third (or sixth) under, chosen from the chord
def third_under(n):
    m = n[2]; pcs = {P.CH[P.chord_at(n[0])][0] % 12} | {x % 12 for x in P.CH[P.chord_at(n[0])][1]}
    for d in (3, 4, 5, 8, 9):
        if (m - d) % 12 in pcs: return (n[0], n[1], m - d) + tuple(n[3:])
    return (n[0], n[1], m - 3) + tuple(n[3:])
FAR = [(-36, 4, 74, 't', 0.7), (-32, 2, 71, 's', 0.7), (-30, 2, 74, 's', 0.7), (-28, 4, 79, 'g', 0.75), (-24, 2, 76, 't', 0.7),
       (-22, 2, 74, 's', 0.7), (-20, 4, 71, 's', 0.7)]
SLOW = [(32, 1.5, 79, 't'), (33.5, .5, 76, 's'), (34, 2, 72, 's'), (36, 1, 74, 't'), (37, 1, 78, 's'), (38, 2, 81, 'g')]
RUN = [(56 + k / 4, .25, m) for k, m in enumerate([74, 78, 81, 86, 84, 81, 78, 74, 72, 74, 78, 81, 84, 86, 84, 81])]
SPARK = [62, 67, 71, 74, 79, 83, 86]
P.check(TUNE, CHOR, FAR, SLOW)

# ================================================================ timbres
def clarinet(f, amp, n, seed):   # a cylinder bore: the odd partials, a soft breath, a woody filter that opens with the breath
    ph = np.cumsum(TAU * f / SR)
    x = np.sin(ph) + 0.4 * np.sin(3 * ph) + 0.18 * np.sin(5 * ph) + 0.07 * np.sin(7 * ph) + 0.06 * np.sin(2 * ph)
    return (lp(x, 1500 + 3000 * amp) + bp(noise(n, seed), 2500, 0.5) * 0.03) * amp
def fiddle(f, amp, n, seed):   # a bowed string: a bright saw, the body's resonances
    x = sum(saw(f * d, n) for d in (1.0, 1.003)) * 0.5
    return (bp(x, 600, 0.4) * 0.5 + bp(x, 2800, 0.5) * 0.6 + lp(x, 5000) * 0.25) * amp
def bell(f, dur, seed):   # a small bell: FM, a long shimmering tail
    return voice_fm(f, max(dur, 1.2), ratio=3.5, index=2.0, decay=1.2, a=0.002, r=0.8)
def mando(f, dur, seed): x = pluck(f, max(0.3, dur) + 0.2, 0.99, 0.7, seed, 0.12); return lp(x, 6000)
def bass(f, dur, seed): return voice_bass(f, dur, cutoff=650, res=0.12, env_amt=1.2, sub=0.25, drive=1.1)

bs = P.buses('drums hand pluck lead fid bass pad bell far fx air')
drums, hand, plk, lead, fid, bas, pad, bel, far, fx, air = bs.values()
KICK = kick(0.3, f0=130, f1=47, sweep=0.03, click=0.3, drive=1.3)
HD = [frame_drum(120, 0.25, k, slap=0.4, damp=0.8) for k in range(2)]; SH = [shaker(0.07, seed=k) for k in range(4)]
OH = [hat(open_=True, seed=30 + k, tone=8500) for k in range(2)]; CL = [clap(seed=k) for k in range(3)]

def lilt_bar(bar, g=0.07, cut=None):   # the plucked string: bass note, chord, chord (a polska's lift in four)
    for k in range(8):
        beat = 4 * bar + 0.5 * k; c = P.chord_at(beat); vs = sorted(P.CH[c][1])
        m = (vs[0], vs[2], vs[3], vs[2], vs[1], vs[3], vs[2], vs[1])[k] + 12
        x = mando(mtof(m), 0.4 * b, bar * 20 + k); x = lp(x, cut) if cut else x
        plk.add(x, T(beat) + P.jit(0.003), g * (1.0 if k % 2 == 0 else 0.7) * P.hum(0.1), pan=-0.45)
def hand_bar(bar, g=0.12):
    for o, v in ((0, 1.0), (1.5, 0.6), (2, 0.8), (3, 0.5), (3.5, 0.6)): hand.add(HD[int(o) % 2], T(4 * bar + o) + P.jit(0.003), g * v * P.hum(0.1), pan=-0.2)
    for k in range(8): hand.add(SH[k % 4], T(4 * bar + 0.5 * k + (0.03 if k % 2 else 0)), g * 0.4 * (1.0 if k % 2 else 0.6) * P.hum(0.15), pan=0.5)
def bass_bar(bar, g=0.26):
    for o, d, ln in ((0, 0, 1.4), (1.5, 7, .4), (2, 0, 1.0), (3, 7, .5), (3.5, 12, .4)):
        r = P.CH[P.chord_at(4 * bar + o)][0]
        while r > 45: r -= 12
        bas.add(bass(mtof(r + d), ln * b, 0), T(4 * bar + o), g * P.hum(0.06) * (1.0 if d == 0 else 0.7))
def sparkle(b0, b1, g=0.05, every=1.5, seed=0):   # the light on the water: bells from the chord, high, now and then
    r = np.random.default_rng(seed); bt = b0
    while bt < b1:
        vs = [m for m in SPARK if m % 12 in {x % 12 for x in P.CH[P.chord_at(bt)][1]}] or SPARK
        m = int(r.choice(vs)) + 12; bel.add(bell(mtof(m), 1.5, 0), T(bt) + P.jit(0.01), g * r.uniform(0.6, 1.0), pan=float(r.uniform(-0.7, 0.7)))
        bt += every * r.choice([0.5, 1.0, 1.0, 1.5])

# ================================================================ INTRO: the globe
wl, wr = wind(T(-2) + 0.5, seed=71, base=450, depth=1.0); wg = np.interp(np.arange(len(wl)) / SR, [0, 0.3, 3.0, T(-12), T(-4), T(-1)], [0, 0, 1, 0.9, 0.4, 0])
air.add((wl * wg, wr * wg), 0.0, 0.12)
n_w = int((T(-4) - 1.0) * SR); tw = np.arange(n_w) / SR   # the water lapping on the shore: slow soft swells of low noise
lap = lp(noise(n_w, 79), 700) * (0.5 + 0.5 * np.sin(TAU * tw / 2.7)) ** 3 * np.clip(tw / 2, 0, 1) * np.clip((T(-4) - 1 - tw) / 3, 0, 1)
air.add((lap, lap * 0.8), 0.5, 0.1)
P.pads(pad, -40, -8, 0.18, cutoff=1300, a=3.0, r=1.5, voice=lambda f, d, j: voice_strings(f, d, a=2.0, r=1.5, bright=0.3))
P.pads(pad, -8, 0, 0.12, cutoff=1800, a=0.5)
sparkle(-36, -8, 0.05, every=3.0, seed=5)
t0, x = P.breath(FAR, clarinet, seed=3, vib=0.08, vib_rate=4.5); far.add(x, t0, 0.12, pan=0.15)
for bar in range(-6, -2): lilt_bar(bar, 0.03 + 0.012 * (bar + 6), cut=1500)
for bar in (-2, -1): lilt_bar(bar, 0.06); hand_bar(bar, 0.07 + 0.03 * (bar + 2)); bass_bar(bar, 0.18) if bar == -1 else None
for k in range(8): P.kick(drums, KICK, -8 + k, 0.28 + 0.015 * k)
fx.add(riser(2 * B, f0=300, f1=9000, seed=4), T(-8), 0.24); fx.add(rev_cymbal(b * 1.5, seed=6), T(-1.5), 0.25)

# ================================================================ MAIN (bars 0..14)
fx.add(boom(98.0, seed=1), T(0), 0.42); hand.add(crash(2.8, seed=41), T(0), 0.24, pan=-0.35); hand.add(crash(2.8, seed=42), T(0), 0.2, pan=0.35)
for bar in range(P.N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH' if bar < 14 else 'RUN'; t4 = 4 * bar
    if sec == 'BR':
        lilt_bar(bar, 0.05)
        if bar == 8: P.kick(drums, KICK, t4, 0.4); fx.add(downlifter(B, seed=2), T(t4), 0.14)
        else:
            for k in range(4): P.kick(drums, KICK, t4 + k, 0.26 + 0.05 * k)
            hand_bar(bar, 0.1); fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.22); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.24)
        continue
    for k in range(4): P.kick(drums, KICK, t4 + k, 0.36)
    for k in range(4): drums.add(OH[k % 2], T(t4 + k + 0.5), 0.09 if sec == 'A' else 0.12, pan=0.4)
    for q in (1, 3): drums.add(CL[q % 3], T(t4 + q), 0.09 if sec == 'A' else 0.12, pan=-0.1)
    hand_bar(bar, 0.12 if sec == 'A' else 0.15); lilt_bar(bar, 0.1 if sec == 'A' else 0.12); bass_bar(bar)
    if bar in (4, 10): hand.add(crash(2.6, seed=bar), T(t4), 0.22, pan=0.3)
    if bar == 14: fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.26)
P.pads(pad, 0, 32, 0.07); P.pads(pad, 32, 40, 0.12, voice=lambda f, d, j: voice_strings(f, d, a=0.8, r=1.0, bright=0.4)); P.pads(pad, 40, LAND, 0.08, cutoff=3000)
sparkle(0, 32, 0.03, every=2.0, seed=6); sparkle(32, 40, 0.05, every=1.0, seed=7); sparkle(40, LAND, 0.035, every=1.5, seed=8)
t0, x = P.breath(TUNE, clarinet, seed=10, vib=0.06, vib_rate=4.5); lead.add(x, t0, 0.11, pan=0.1)
t0, x = P.breath(SLOW, fiddle, seed=11, vib=0.2, vib_rate=5.5); fid.add(x, t0, 0.24, pan=-0.1)
t0, x = P.breath(CHOR, fiddle, seed=12, vib=0.2, vib_rate=5.5); fid.add(x, t0, 0.2, pan=-0.2)
t0, x = P.breath([third_under(n) for n in CHOR], clarinet, seed=13, vib=0.06); lead.add(x, t0, 0.07, pan=0.25)
P.play(fid, RUN, lambda f, s, sd: voice_strings(f, s + 0.05, a=0.01, r=0.08, bright=0.8), g=0.2, pan=-0.2, seed=400)

# ================================================================ LANDING: bar 15 = 48.2 s
L0 = T(LAND)
P.kick(drums, KICK, LAND, 0.7); hand.add(HD[0], L0, 0.3); fx.add(boom(98.0, seed=4), L0, 0.44)
hand.add(crash(3.2, seed=51), L0, 0.26, pan=-0.35); hand.add(crash(3.2, seed=52), L0, 0.22, pan=0.35)
P.pads(pad, LAND, LAND + 6, 0.17, cutoff=5000, a=0.008, r=1.3)
for j, m in enumerate([79, 83, 86, 91]): bel.add(bell(mtof(m), 2.0, 0), L0 + 0.04 * j, 0.06, pan=PANS[4][j])
strum(plk, P, LAND, [43, 50, 55, 59, 62, 67], lambda f, s: mando(f, 2.0, s), 0.14, spread=0.02, pan=0.0, seed=500)
t0, x = P.breath([(LAND, 2.5, 79, 't')], clarinet, seed=14, vib=0.08); lead.add(x, t0, 0.09, pan=0.1)
bas.add(bass(mtof(43), 1.6, 0), L0, 0.42)

P.finish(bs, {'pad': 0.25, 'pluck': 0.12, 'lead': 0.2, 'fid': 0.25, 'bell': 0.45, 'far': 0.6, 'fx': 0.2, 'hand': 0.08, 'drums': 0.03}, 'denmark',
         lufs=-13.5, highs_db=3.0, lows_db=-1.5,
         delays=[('lead', 0.75, 0.12, 0.3), ('bell', 1.5, 0.25, 0.45), ('far', 1.5, 0.3, 0.5)], duck={'bass': (0.35, 0.12), 'pad': (0.45, 0.2), 'pluck': (0.15, 0.1)})
