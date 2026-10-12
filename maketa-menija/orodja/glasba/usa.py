"""USA (Colorado: the hill climb from 2,862 m to the 4,301 m summit; hairpins, forest, snow at the top, big sky): big-sky Americana
synthwave. A slide guitar (a modelled string whose length glides under the slide, so every slide really travels), a twangy banjo
picking forward rolls, wide warm pads, a heartland organ, a driving eighth-note bass and a big gated snare over a heartland rock beat
that turns four-on-the-floor for the summit chorus. E major, 119.15 bpm: 14 bars from the drop to the race's start.
The hook is a 'switchback': up a fourth by slide, back down a step, up a fourth again (the hairpins of the climb), in the 3+3+2 lilt
that the banjo's forward roll shares. The summit chorus climbs the same switchbacks at half speed all the way to the high E, and the
last slide (up a fourth into the high E) lands the race's start.
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  wind, a wide pad, the hook in slow motion far away (volume swells), the banjo, the build
    drop  (20.0 s)     bar 0         the groove and the hook
    A bars 0-3, A' 4-7 (tambourine, organ, the blue seventh), breath 8-9 (the drums drop out, the air thins; the build back),
    summit chorus 10-13 (four on the floor, the twin slide, the climb to the high E), LANDING at bar 14 = 48.2 s
"""
import sys, json, math, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 14                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 119.15 bpm
B, b = S.bar, S.beat
LAND = 4 * N                                 # the landing, in beats from the drop
def T(beat): return S.drop + beat * b        # beats from the drop (negative: the intro) -> seconds
assert abs(S.main_bars - N) < 1e-9 and abs(T(LAND) - END) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing is the race's start
rng = np.random.default_rng(5)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity
def curve(points):                               # automation: [(seconds, value), ...] -> one value per sample
    tp, vp = zip(*points); return np.interp(np.arange(S.n) / SR, tp, vp)
def ramp(n, points):                             # an envelope for one sound n samples long: [(seconds, level), ...]
    tp, vp = zip(*points); return np.interp(np.arange(n) / SR, tp, vp)

# ================================================================ instruments (defined here: synth.py is shared) ==================
@nb.njit(cache=True, fastmath=True)
def _string(D, exc, g, lossb):
    """one string: a delay line D samples long (fractional, per sample: the slide moves along it), a gentle loss filter (a symmetric
    three-tap FIR with one sample of delay whatever its strength lossb, per sample, so the tuning holds), the loop gain g per sample
    (lowered to damp it), the excitation exc added where it is picked"""
    n = D.shape[0]; M = 8192; buf = np.zeros(M); y = np.zeros(n); w = 0; z1 = 0.0; z2 = 0.0
    for i in range(n):
        r = w - D[i]; ri = int(math.floor(r)); fr = r - ri   # read D samples back, cubic (Hermite) interpolation
        p0 = buf[(ri - 1) % M]; p1 = buf[ri % M]; p2 = buf[(ri + 1) % M]; p3 = buf[(ri + 2) % M]
        v = p1 + fr * (0.5 * (p2 - p0) + fr * ((p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3) + fr * (0.5 * (p3 - p0) + 1.5 * (p1 - p2))))
        f = lossb[i] * (v + z2) + (1.0 - 2.0 * lossb[i]) * z1
        z2 = z1; z1 = v
        buf[w] = g[i] * f + exc[i]; y[i] = v
        w += 1
        if w >= M: w = 0
    return y

@nb.njit(cache=True, fastmath=True)
def _follow(x, up, down):   # an envelope follower: quick to rise, slow to fall
    y = np.empty(x.shape[0]); s = 0.0
    for i in range(x.shape[0]):
        v = abs(x[i]); a = up if v > s else down; s += a * (v - s); y[i] = s
    return y

def slide_guitar(notes, drive=2.2, tone=4600, t60=12.0, lossb=0.05, vib=0.22, seed=0, tail=1.5, swell=0.45, bright=0.6, sustain=0.65):
    """the slide guitar: ONE string, so every slide travels from the note before. notes: (beat, beats, midi, how[, velocity[, glide s]]);
    how: 'p' picked, 's' slid into from the note before, 'h' hammered (a quick slur), 'w' a volume swell (the pick hidden under the
    volume pedal), 'q' picked with a quick scoop from a step below. A compressor (the slide player's sustain: the pick snaps through,
    the held note stays up), a little overdrive and a speaker cabinet. Returns (start s, mono)."""
    t0 = T(notes[0][0]) - 0.08; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed); idx = lambda beat: int(round((T(beat) - t0) * SR)); ons = [idx(nt[0]) for nt in notes]
    pitch = np.zeros(n); vd = np.zeros(n); exc = np.zeros(n); mute = np.ones(n); vol = np.ones(n); glide_end = {}
    for i, nt in enumerate(notes): pitch[ons[i]:] = nt[2]
    for i, nt in enumerate(notes):   # the slides: S-curves centred a little before the beat (a scoop starts on it)
        m, how = nt[2], nt[3]
        if how in 'shq':
            m0 = m - 2 if how == 'q' else notes[i - 1][2]
            gs = nt[5] if len(nt) > 5 else {'h': 0.03, 'q': 0.07}.get(how, 0.05 + 0.02 * abs(m - m0))
            a = ons[i] - (0 if how == 'q' else int(0.4 * gs * SR)); k = max(2, int(gs * SR)); x = np.linspace(0, 1, k)
            pitch[a:a + k] = m0 + (m - m0) * (0.5 - 0.5 * np.cos(np.pi * x)); glide_end[i] = a + k
    for i, nt in enumerate(notes):   # vibrato on the held notes, once the slide has settled
        a = glide_end.get(i, ons[i]); e = ons[i + 1] if i + 1 < len(notes) else n
        if (e - ons[i]) / SR > 0.4:
            v0 = a + int(0.16 * SR)
            if v0 < e: vd[v0:e] = vib * np.clip((np.arange(e - v0) / SR) / 0.35, 0, 1)
    ph = np.cumsum(TAU * (5.2 + 0.5 * np.sin(TAU * 0.23 * t + r.random() * 6)) / SR)
    f = mtof(pitch + vd * np.sin(ph)); D = SR / f - 1.0
    for i, nt in enumerate(notes):   # the right hand: picks, the damping just before a re-pick, the mutes in the rests
        bt, ln, m, how = nt[:4]; vel = nt[4] if len(nt) > 4 else 1.0; a = ons[i]
        if how in 'pqwh':
            P = int(SR / f[min(n - 1, a + 5)]); amp = vel * {'p': 1.0, 'q': 1.0, 'w': 0.7, 'h': 0.22}[how]
            u = np.arange(P) / P; tri = np.where(u < 0.16, u / 0.16, (1 - u) / 0.84); tri -= tri.mean()   # the string's shape when picked
            z = r.uniform(-1, 1, P + 64); z = lp1(z, 1500 + 7000 * bright * (0.5 if how == 'w' else 1.0))[64:]; z -= z.mean()   # the pick's bite
            z = tri / np.abs(tri).max() + (0.15 if how == 'w' else 0.35) * z / (np.abs(z).max() + 1e-9); z /= np.abs(z).max()
            exc[a:a + P] += amp * z[:max(0, min(P, n - a))]
            if how != 'h' and a > P: k = int(0.005 * SR); mute[max(0, a - P - k):a - k] *= 0.3   # (ends before the pick: eased below)
        if i + 1 < len(notes) and notes[i + 1][3] in 'pqw':
            e = idx(bt + ln); nx = ons[i + 1] - int(0.005 * SR)
            if e < nx - int(0.004 * SR): mute[max(a, e - int(0.01 * SR)):nx] *= 0.72
        if how == 'w': k = int(swell * SR); vol[a:a + k] = np.linspace(0, 1, k) ** 2
    mute = lp1(np.concatenate([np.ones(256), mute]), 90.0)[256:]        # (the damping eases in and out over a few ms: no zipper)
    # the loop: the loss filter may take at most 60 % of each trip's allowed decay (high notes would die early), the gain the rest
    om = TAU * f / SR; G = 10 ** (-3 / (f * t60)); lb = np.minimum(lossb, 0.6 * (1 - G) / (2 * (1 - np.cos(om)) + 1e-12))
    H = 1 - 2 * lb * (1 - np.cos(om)); g = np.minimum(G / H, 0.99995) * mute
    y = _string(D, exc, g, lb)
    env = _follow(y, 1 - np.exp(-1 / (0.003 * SR)), 1 - np.exp(-1 / (0.15 * SR)))
    y = y * np.clip((0.45 / (env + 1e-4)) ** sustain, 0.25, 6.0)          # the compressor
    x = np.tanh(drive * y) / np.tanh(drive)                              # the amp, driven a little
    x = hp1(x, 110); x = lp(x, tone, 0.12) * 0.8 + bp(x, 2500, 0.4) * 0.45   # the cabinet and the pickup's presence
    e_last = idx(notes[-1][0] + notes[-1][1]); vol[e_last:] *= np.exp(-np.arange(n - e_last) / SR / 0.3)   # (the last note let go, not cut)
    return t0, x * vol

def banjo(f, dur=0.6, seed=0, bright=0.82, t60=1.0, pick=0.09, choke=0.45):
    """a banjo-like pluck: a bright string picked near the bridge (Karplus-Strong), the drum head's twang (resonant upper mids),
    the fingerpick's click, a quick natural choke"""
    y = pluck(f, dur, 10 ** (-3 / (f * t60)), bright, seed, pick); n = len(y); t = np.arange(n) / SR
    y = hp(y, 200) * 0.6 + bp(y, 1900, 0.55) * 0.65 + bp(y, 3700, 0.5) * 0.45
    y += hp(noise(n, seed + 7), 4000) * np.exp(-t / 0.002) * 0.25
    return y * np.exp(-t / choke)

def pick_bass(f, dur, bright=1.0, drive=1.9):
    """the driving bass: saw, a narrow pulse and a sine, a plucky filter, a little drive (its overtones carry it on small speakers)"""
    n = int((dur + 0.05) * SR); t = np.arange(n) / SR
    x = saw(f, n) * 0.55 + pulse(f, n, 0.33) * 0.22 + sine(f, n) * 0.55
    y = sat(lp(x, 180 + (600 + 1600 * np.exp(-t / 0.045)) * bright, 0.25), drive)
    return y * adsr(n, 0.003, 0.14, 0.72, 0.045, gate=dur)

def glock(f, dur=1.8, seed=0):
    """a glockenspiel bar: the bar's inharmonic partials (1, 2.76, 5.40, 8.93), a hard mallet"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 0.8), (2.76, 0.32, 0.3), (5.40, 0.16, 0.12), (8.93, 0.07, 0.06)):
        if f * ratio < 17000: x += amp * sine(f * ratio, n, (seed * 0.37 + ratio) % 1.0) * np.exp(-t / dec)
    x += hp(noise(n, seed), 6000) * np.exp(-t / 0.0015) * 0.12
    return x * np.clip(t / 0.0007, 0, 1) * 0.35

def gated_snare(seed=3, tone=188):
    """the big 80s snare: the hit and its room, the room cut short by a gate (stereo)"""
    dry = snare(0.3, tone=tone, snappy=0.9, seed=seed); n = int(0.5 * SR); x = np.zeros(n); x[:len(dry)] = dry
    rl, rr = reverb(x, x, size=0.8, decay=1.8, damp=0.2, predelay=0.006); t = np.arange(n) / SR
    gate = np.clip((0.25 - t) / 0.04, 0, 1); k = np.sqrt(np.mean(dry[:int(0.15 * SR)] ** 2)) / (np.sqrt(np.mean(rl[:int(0.2 * SR)] ** 2)) + 1e-9) * 0.9
    return (x + rl * gate * k, x + rr * gate * k)

def tamb(seed=0, dur=0.18):   # a tambourine: four jingle resonances, the hit and a little shake
    n = int(dur * SR); t = np.arange(n) / SR; j = np.zeros(n)
    for k, fr in enumerate((5300, 6600, 8100, 9800)): j += bp(noise(n, seed * 5 + k), fr, 0.85)
    return hp(j, 4500) * (np.clip(t / 0.0015, 0, 1) * np.exp(-t / 0.05) + 0.25 * np.exp(-t / 0.12)) * 0.6

def tom_(f, seed=0, dur=0.5):   # a rock tom: a falling sine, its overtone, the stick on the head
    n = int(dur * SR); t = np.arange(n) / SR
    body = sine(f * (1 + 0.5 * np.exp(-t / 0.035)), n) * np.exp(-t / 0.18) + 0.3 * sine(f * 1.6 * (1 + 0.4 * np.exp(-t / 0.03)), n) * np.exp(-t / 0.09)
    return sat(body + bp(noise(n, seed), 1500, 0.3) * np.exp(-t / 0.012) * 0.45, 1.4)

def impact_e(dur=3.0, seed=0):   # the boom on the drop and the landing, tuned to E (E2 falling in, E1 under it)
    n = int(dur * SR); t = np.arange(n) / SR
    boom = np.tanh(sine(82.4 * (1 + 1.8 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.6) * 1.8) * 0.6 + sine(41.2, n) * np.exp(-t / 0.55) * np.clip(t / 0.008, 0, 1) * 0.3
    return boom + lp(noise(n, seed), 1200) * np.exp(-t / 0.3) * 0.35

def rev_cymbal(dur, seed=0):   # a cymbal swelling backwards into a downbeat
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def wind(dur, seed=0):   # the thin air up high: two slowly wandering bands of noise (stereo)
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = 800 * 2 ** (1.0 * np.sin(TAU * t / (9.0 + 2.5 * k) + 1.7 * k) + 0.4 * np.sin(TAU * t / 3.7 + k))
        out.append(bp(noise(n, seed + k), fc, 0.7) * (0.75 + 0.25 * np.sin(TAU * t / 4.3 + 2 * k)))
    return tuple(out)

def rotary(bus, rate=5.6, depth=0.0006, am=0.16):   # the organ's spinning speaker: a moving delay and a tremolo, opposite in each ear
    m = 0.5 * (bus.L + bus.R); t = np.arange(len(m)) / SR; l, r = chorus(m, depth, rate, 0.6); s = np.sin(TAU * rate * t)
    bus.L, bus.R = l * (1 + am * s), r * (1 - am * s)

# ================================================================ harmony ========================================================
#            bass  the pad's voices (midi): each chord moves to the next by steps; no root-position block triads
CH = {'E':       (40, [59, 64, 68, 71]),         # B3 E4 G#4 B4
      'C#m7':    (37, [61, 64, 68, 71]),         # C#4 E4 G#4 B4
      'Aadd9':   (45, [61, 64, 69, 71]),         # C#4 E4 A4 B4
      'Bsus4':   (47, [59, 64, 66, 71]),         # B3 E4 F#4 B4
      'B':       (47, [59, 63, 66, 71]),         # B3 D#4 F#4 B4
      'D':       (38, [62, 64, 66, 69]),         # D4 E4 F#4 A4: Dadd9, the key's flat seventh (the heartland's mixolydian turn)
      'F#m11':   (42, [61, 64, 69, 71]),         # C#4 E4 A4 B4 over F#
      'E/G#':    (44, [59, 64, 68, 71]),
      'B9sus':   (47, [59, 64, 66, 73]),         # B3 E4 F#4 C#5: open, no third (the summit in sight)
      'Eadd9':   (40, [52, 59, 66, 68, 71]),     # the globe: E3 B3 F#4 G#4 B4 (the F#-G# rub shimmers)
      'Amaj9/E': (40, [57, 61, 64, 68, 71])}     # the globe: A3 C#4 E4 G#4 B4 over the E (wide open)
CHORDS = [(-36, -28, 'Eadd9'), (-28, -20, 'Amaj9/E'), (-20, -16, 'C#m7'), (-16, -12, 'Aadd9'), (-12, -8, 'E/G#'), (-8, -4, 'Aadd9'),
          (-4, -2, 'Bsus4'), (-2, 0, 'B'),                                                   # intro: I, IV/I, vi, IV, I6, IV, V
          (0, 4, 'E'), (4, 8, 'C#m7'), (8, 12, 'Aadd9'), (12, 14, 'Bsus4'), (14, 16, 'B'),  # A:  I vi IV V
          (16, 20, 'E'), (20, 24, 'C#m7'), (24, 28, 'Aadd9'), (28, 32, 'D'),                # A': I vi IV bVII
          (32, 36, 'F#m11'), (36, 40, 'E/G#'),                                              # breath: ii I6 (the bass starts climbing)
          (40, 44, 'Aadd9'), (44, 48, 'B9sus'), (48, 52, 'C#m7'), (52, 54, 'D'), (54, 56, 'Aadd9'),   # chorus: IV V vi | bVII IV
          (56, 70, 'E')]                                                                    # -> I: the landing
def chord_at(beat): return next(c for s, e, c in CHORDS if s <= beat < e)
PANS = {4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8), 6: (-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)}

# ================================================================ the tunes: (beat, beats, midi, how[, velocity[, glide s]]) =======
#   the hook: switchbacks (up a fourth by slide, down a step) in a 3+3+2 lilt, then a fall; sequenced a step higher
CALL = [(0.0, 0.5, 71, 'p'), (0.5, 1.0, 76, 's'), (1.5, 0.5, 75, 'p'), (2.0, 1.0, 80, 's'), (3.0, 0.5, 78, 'p'), (3.5, 2.0, 83, 's'),
        (5.5, 0.5, 81, 'p'), (6.0, 0.5, 80, 'h'), (6.5, 0.5, 76, 'p'), (7.0, 0.85, 78, 's')]          # B E D# G# F# B~ A G# E F#
ANS = [(8.0, 0.5, 73, 'p'), (8.5, 1.0, 78, 's'), (9.5, 0.5, 76, 'p'), (10.0, 1.0, 81, 's'), (11.0, 0.5, 80, 'p'), (11.5, 2.0, 85, 's'),
       (13.5, 0.5, 83, 'p'), (14.0, 0.5, 81, 's'), (14.5, 1.25, 78, 'p')]                          # C# F# E A G# C#~ B A F#
ANS2 = [(24.0, 0.5, 73, 'p'), (24.5, 1.0, 78, 's'), (25.5, 0.5, 76, 'p'), (26.0, 1.0, 81, 's'), (27.0, 0.5, 80, 'p'), (27.5, 0.5, 85, 's'),
        (28.0, 1.5, 86, 's'), (29.5, 0.5, 83, 'p'), (30.0, 0.5, 81, 's'), (30.5, 1.25, 78, 'p')]   # ... C# slides on up to the blue D
BREATH = [(32.5, 2.5, 85, 'w', 0.9), (35.0, 1.0, 83, 's', 1, 0.16), (36.0, 2.5, 80, 's', 1, 0.2)]  # the thin air: C#~ B~ G#~
CHORUS = [(39.5, 0.5, 71, 'p'), (40.0, 1.0, 76, 's'), (41.0, 2.0, 81, 's'), (43.0, 1.0, 80, 'p'),  # the switchbacks at half speed:
          (44.0, 2.0, 85, 's'), (46.0, 1.0, 83, 'p'), (47.0, 3.0, 88, 's'),                        # E A G# C# B E (the summit)
          (50.0, 0.5, 87, 'p'), (50.5, 0.5, 85, 'h'), (51.0, 0.5, 83, 'p'), (51.5, 0.5, 85, 'p'),
          (52.0, 2.0, 86, 's'), (54.0, 1.5, 85, 's'), (55.5, 0.5, 83, 'p'),                        # D~ C#~ B, then up a fourth:
          (LAND, 4.5, 88, 'q')]                                                                    # the high E on the race's start
LEAD = CALL + ANS + [(nt[0] + 16,) + nt[1:] for nt in CALL] + ANS2 + BREATH + CHORUS
HARM = [(39.5, 0.5, 68, 'p'), (40.0, 1.0, 73, 's'), (41.0, 2.0, 76, 's'), (43.0, 1.0, 76, 'p'), (44.0, 2.0, 81, 's'), (46.0, 1.0, 78, 'p'),
        (47.0, 3.0, 85, 's'), (50.0, 0.5, 83, 'p'), (50.5, 1.5, 80, 'h'), (52.0, 3.5, 81, 's'), (55.5, 0.5, 78, 'p'), (LAND, 4.5, 80, 's')]
#   the hook in slow motion over the globe, far away: volume swells sliding up (B~E, D#~G#, F#~B, then the fall)
FAR = [(-31.0, 2.0, 71, 'w', 0.8), (-29.0, 3.5, 76, 's', 1, 0.4), (-25.0, 1.5, 75, 'w', 0.8), (-23.5, 3.0, 80, 's', 1, 0.4),
       (-20.0, 1.0, 78, 'w', 0.8), (-19.0, 4.0, 83, 's', 1, 0.35), (-15.0, 1.0, 81, 'p', 0.45), (-14.0, 1.0, 80, 'h'),
       (-13.0, 1.0, 76, 'p', 0.45), (-12.0, 3.5, 78, 's', 1, 0.3)]
for nt in LEAD + HARM + FAR:   # (a check: no held note of the tunes sits a half step above a chord tone, the clash a long note can't have)
    c = chord_at(nt[0]); pcs = {CH[c][0] % 12} | {m % 12 for m in CH[c][1]}
    assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)

drums, snr, perc, bass, pad, organ, bj, lead, far, glk, fx = (S.bus(x) for x in 'drums snare perc bass pad organ banjo lead far glock fx'.split())
kicks = []

# ================================================================ players ========================================================
KICK = kick(0.34, f0=150, f1=50, sweep=0.036, click=0.6, drive=1.6)
SNARE = [gated_snare(3, 188), gated_snare(8, 192)]; GHOST = snare(0.12, tone=205, snappy=0.55, seed=9)
HH = [hat(0.045, seed=k, tone=8800) for k in range(4)]; OH = [hat(open_=True, seed=k + 20, tone=7600) for k in range(2)]
TAMB = [tamb(k) for k in range(4)]; SHK = [shaker(0.08, seed=k) for k in range(4)]
TOM = {k: tom_(f, i) for i, (k, f) in enumerate((('hi', 208), ('mid', 165), ('lo', 139), ('fl', 104)))}
def K(beat, g=0.5): drums.add(KICK, T(beat), g); kicks.append(T(beat))
def SN(beat, g=0.5, pan=0.0): snr.add(SNARE[int(beat * 2) % 2], T(beat), g * hum(0.04), pan)
def roll(b0, b1, div, g0, g1, tone0=185, tone1=232):   # a snare roll on the grid (div hits a beat), swelling and rising in pitch
    k_ = int(round((b1 - b0) * div))
    for k in range(k_):
        x = k / max(1, k_ - 1); snr.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, snappy=0.75, seed=k % 13), T(b0 + k / div), (g0 + (g1 - g0) * x ** 1.5) * hum(0.06), 0.05)

BJ = {'Eadd9': (59, 64, 66), 'Amaj9/E': (57, 61, 64), 'C#m7': (61, 64, 68), 'Aadd9': (61, 64, 69), 'E/G#': (59, 64, 68), 'Bsus4': (59, 64, 66),
      'B': (59, 63, 66), 'E': (59, 64, 68), 'D': (57, 62, 66), 'F#m11': (57, 61, 64), 'B9sus': (59, 64, 66)}   # the three fretted strings
DRONE = 71                                                                  # the fifth string's high drone: B, the key's fifth
ROLLS = {'fwd': (0, 1, 2, 3, 1, 2, 0, 2), 'back': (2, 1, 0, 2, 1, 3, 2, 1), 'fwdback': (0, 1, 2, 3, 2, 1, 0, 2)}   # thumb, index, middle
def banjo_bar(bar, roll_='fwd', g=0.3, step=1, bright=0.82, up=0, pan=0.1, ring=0.65, until=None, g_end=None):
    """sixteenth-note rolls (T I M T I M T M: the 3+3+2 of the hook); every string has its own place in the stereo picture;
    g_end: a crescendo across the bar, from g to g_end"""
    for k in range(0, 16, step):
        beat = 4 * bar + k / 4
        if until is not None and beat >= until: break
        s = ROLLS[roll_][k % 8]; m = (BJ[chord_at(beat)] + (DRONE,))[s] + up; acc = 1.0 if k % 8 in (0, 3, 6) else 0.68
        gk = g if g_end is None else g + (g_end - g) * k / 15
        bj.add(banjo(mtof(m), ring, seed=int(rng.integers(1 << 30)), bright=bright), T(beat) + rng.normal(0, 0.003), gk * acc * hum(0.08),
               pan=float(np.clip(pan + (-0.35, 0.0, 0.3, 0.55)[s], -0.9, 0.9)))

def pad_chords(b0, b1, gain, cutoff=6000, a=0.08, r=0.5, strings=0.0, organ_=0.0):
    for s, e, c in CHORDS:
        s0, e0 = max(s, b0), min(e, b1)
        if s0 >= e0: continue
        bs, vs = CH[c]; vs = list(vs)
        if s0 < -16 and len(vs) == 4: vs = [bs + 12] + vs        # (the globe's chords carry a low voice of their own: no bass yet)
        for j, m in enumerate(vs if gain else []):
            pad.add(voice_pad(mtof(m), (e0 - s0) * b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=m + 3 * j), T(s0), gain * (0.85 if j == 0 and len(vs) == 5 else 1), pan=PANS[len(vs)][j])
            if strings and j >= len(vs) - 3: pad.add(voice_strings(mtof(m + 12), (e0 - s0) * b, a=0.2, r=0.6, bright=3400), T(s0), strings, pan=PANS[len(vs)][j] * 0.8)
        if organ_:
            for j, m in enumerate(vs[-3:]): organ.add(voice_organ(mtof(m), (e0 - s0) * b - 0.02, bars=(0.6, 1.0, 0.5, 0.45, 0.2, 0.15, 0.0, 0.0), a=0.02, r=0.12, perc_=0.0), T(s0), organ_, pan=-0.3)

def bass_bar(bar, gain, style='drive', bright=1.0, upto=4.0):
    """eighths on the root (the heartland pulse). 'pop': octave pops on the and-of-2 and -4; 'octave': root, octave (the synthwave
    drive); the last eighth of a bar walks into the next chord when it moves"""
    for k in range(8):
        beat = 4 * bar + k / 2
        if k / 2 >= upto: break
        root = CH[chord_at(beat)][0]; nxt = CH[chord_at(beat + 0.5)][0]
        m = root + (12 if (style == 'pop' and k in (3, 7)) or (style == 'octave' and k % 2) else 0)
        if style != 'drive' and k == 7 and nxt != root:   # walk in from a scale step on the side it comes from (else a half step)
            app = nxt + 2 if nxt < root else nxt - 2; m = app if (app - 40) % 12 in (0, 2, 4, 5, 7, 9, 11) else (nxt + 1 if nxt < root else nxt - 1)
        vel = (1.0, 0.72, 0.86, 0.72, 0.95, 0.72, 0.86, 0.78)[k]
        bass.add(pick_bass(mtof(m), b * 0.43, bright), T(beat), gain * vel * hum(0.04))

# ================================================================ INTRO: the globe (bars -10..-1) ================================
wl, wr = wind(T(-2) + 0.5, seed=11); wg = ramp(len(wl), [(0, 0), (0.3, 0), (3.5, 1.0), (T(-12), 1.0), (T(-6), 0.6), (T(-2), 0.0), (99, 0)])
fx.add((wl * wg, wr * wg), 0.0, 0.11)                                   # the air up high, from the very start
pad_chords(-36, -28, 0.3, a=2.6, r=1.6)                                 # the pad: a slow swell over the globe (its filter opens below),
pad_chords(-28, -16, 0.3, a=0.7, r=1.6); pad_chords(-16, 0, 0.3, a=0.5, r=0.8)   # each chord crossfading into the next
bass.add(voice_sub(mtof(40), 7.5, a=2.5, r=2.0), T(-36), 0.015)        # a soft low E under the first chords
for bt, m, p in ((-34.5, 88, -0.5), (-32.0, 83, 0.4), (-30.5, 90, -0.2), (-27.0, 92, 0.55), (-25.5, 87, -0.45), (-22.0, 88, 0.3),
                 (-20.5, 95, -0.3), (-18.0, 90, 0.5)):                 # stars: a few glockenspiel notes far away
    far.add(glock(mtof(m), 2.0, seed=int(-bt * 10)), T(bt), 0.08, pan=p)
t0, x = slide_guitar(FAR, drive=1.4, tone=2700, vib=0.18, swell=0.6, bright=0.4, seed=4)   # the hook in slow motion, far away
far.add(x, t0, 0.15, pan=-0.1)
for bar in range(-6, 0):                                                # the banjo: eighths, then sixteenths
    banjo_bar(bar, 'fwd', g=0.14 + 0.025 * (bar + 6), step=2 if bar < -3 else 1, bright=0.62 + 0.03 * (bar + 6), pan=0.0, until=-0.5)
for bar in (-5, -4):                                                    # a heartbeat, muffled
    for k in (0, 2): drums.add(lp(KICK, 280), T(4 * bar + k), 0.2 + 0.04 * (bar + 5))
for k in range(4): drums.add(lp(KICK, 600), T(-12 + k), 0.26)
for bar in range(-4, 0): bass_bar(bar, 0.11 + 0.04 * (bar + 4), bright=0.3 + 0.17 * (bar + 4), upto=3.5 if bar == -1 else 4)
for k in range(8): perc.add(SHK[k % 4], T(-12 + k / 2 + 0.5), 0.07, pan=-0.4)
for k in range(16): perc.add(HH[k % 4], T(-8 + k / 2), (0.03 + 0.005 * k) * (1.3 if k % 2 else 0.8), pan=-0.3)   # ticking hats, growing
# --- the build (bars -2, -1): kick, roll, riser, the filters opening (it works on its own from 15.5 s, the short intro)
for k in range(8): K(-8 + k, 0.34 + 0.012 * k)
roll(-8, -4, 2, 0.05, 0.14); roll(-4, -1, 4, 0.14, 0.3); roll(-1, -0.25, 8, 0.3, 0.38)
fx.add(riser(2 * B, f0=250, f1=9000, seed=3), T(-8), 0.3); fx.add(rev_cymbal(b * 1.5, seed=5), T(-1.5), 0.3)

# ================================================================ MAIN: the climb (bars 0..13) ===================================
fx.add(impact_e(3.0, seed=1), T(0), 0.5); perc.add(crash(2.8, seed=31), T(0), 0.32, pan=-0.35); perc.add(crash(2.8, seed=32), T(0), 0.26, pan=0.35)
for bar in range(N):
    sec = 'A' if bar < 4 else 'A2' if bar < 8 else 'BR' if bar < 10 else 'CH'; t4 = 4 * bar
    # --- drums: a heartland rock beat (kick 1, 3 and a push; the gated snare on 2 and 4), four on the floor in the chorus
    if sec in ('A', 'A2'):
        for k in ((0, 2, 2.5) if bar % 2 == 0 else (0, 2, 3.5)): K(t4 + k, 0.5 if k in (0, 2) else 0.36)
        SN(t4 + 1); SN(t4 + 3)
        for k in range(8):
            if bar in (3, 7) and k >= (6 if bar == 3 else 4): continue
            o = k == 7 and bar % 2 == 1
            perc.add(OH[bar % 2] if o else HH[k % 4], T(t4 + k / 2) + rng.normal(0, 0.002), (0.1 if o else (0.13 if k % 2 == 0 else 0.1)) * hum(0.1), pan=-0.3)
            if sec == 'A2': perc.add(HH[(k + 2) % 4], T(t4 + k / 2 + 0.25), 0.035 * hum(0.2), pan=0.4)
        for gb in ((2.75,) if sec == 'A' else (1.75, 3.25)): snr.add(GHOST, T(t4 + gb), 0.07 * hum(0.2), 0.08)
        if sec == 'A2':
            for k in range(16): perc.add(TAMB[k % 4], T(t4 + k / 4), (0.3 if k in (4, 12) else 0.15 if k % 2 == 0 else 0.08) * hum(0.12), pan=-0.5)
    elif sec == 'BR':
        if bar == 8:   # the breath: one kick, the cymbal, the air; the shaker keeps time
            K(t4, 0.45); perc.add(crash(2.6, seed=8), T(t4), 0.22, pan=-0.3); fx.add(downlifter(B, seed=2), T(t4), 0.2)
            for k in range(8): perc.add(SHK[k % 4], T(t4 + k / 2 + 0.5), 0.08 * hum(0.1), pan=-0.4)
        else:          # ... and the way back up: the kick, the hats, the roll, a riser, the cymbal backwards
            for k in range(4): K(t4 + k, 0.32 + 0.05 * k)
            for k in range(8): perc.add(HH[k % 4], T(t4 + k / 2), (0.05 + 0.008 * k) * (1.2 if k % 2 else 0.8), pan=-0.3)
            roll(t4 + 1, t4 + 2, 4, 0.08, 0.14); roll(t4 + 2, t4 + 3.75, 8, 0.14, 0.34)
            fx.add(riser(B, f0=400, f1=9000, seed=7), T(t4), 0.24); fx.add(rev_cymbal(b * 1.5, seed=9), T(t4 + 2.5), 0.28)
    else:              # the summit chorus: four on the floor, snare and clap, open hats on the offbeats, the tambourine
        for k in range(4): K(t4 + k, 0.52)
        if bar % 2: K(t4 + 3.5, 0.28)
        for k in (1, 3): SN(t4 + k, 0.56); drums.add(clap(seed=bar + k), T(t4 + k), 0.2, pan=0.1 * (k - 2))
        for k in range(8):
            if bar == 13 and k >= 4: continue
            perc.add(OH[k % 2] if k % 2 else HH[k % 4], T(t4 + k / 2), 0.1 if k % 2 else 0.11, pan=0.35)
            perc.add(HH[(k + 1) % 4], T(t4 + k / 2 + 0.25), 0.035 * hum(0.2), pan=0.4)
        for k in range(16): perc.add(TAMB[k % 4], T(t4 + k / 4), (0.34 if k in (4, 12) else 0.18 if k % 2 == 0 else 0.1) * hum(0.12), pan=-0.5)
        snr.add(GHOST, T(t4 + 2.75), 0.07, 0.08)
    if bar in (4, 10, 12): perc.add(crash(2.6, seed=bar), T(t4), 0.3 if bar != 12 else 0.24, pan={4: -0.3, 10: 0.0, 12: 0.35}[bar])
    # --- fills every four bars (and the way into the breath, the chorus and the landing)
    if bar == 3: SN(t4 + 3.5, 0.32); drums.add(TOM['hi'], T(t4 + 3.5), 0.32, pan=0.3); drums.add(TOM['mid'], T(t4 + 3.75), 0.36, pan=0.0)
    if bar == 7:
        for k, s in enumerate(('hi', 'hi', 'mid', 'mid', 'lo', 'lo', 'fl', 'fl')): drums.add(TOM[s], T(t4 + 2 + k / 4), 0.13 + 0.017 * k, pan=(0.45, 0.4, 0.15, 0.1, -0.2, -0.25, -0.45, -0.5)[k])
    if bar == 11: SN(t4 + 3.5, 0.3); SN(t4 + 3.75, 0.36)
    if bar == 13:      # the last bar leads into the landing: snare and toms rolling down, a riser, the cymbal backwards
        for k, s in enumerate(('sn', 'hi', 'sn', 'mid', 'sn', 'lo', 'fl', 'fl')):
            if s == 'sn': SN(t4 + 2 + k / 4, 0.24 + 0.03 * k)
            else: drums.add(TOM[s], T(t4 + 2 + k / 4), 0.2 + 0.022 * k, pan=(0.4, 0.4, 0.1, 0.1, -0.2, -0.2, -0.4, -0.45)[k])
        fx.add(riser(B, f0=500, f1=10000, seed=6), T(t4), 0.2); fx.add(rev_cymbal(b * 1.5, seed=10), T(t4 + 2.5), 0.3)
    # --- bass, banjo, pad, organ
    if sec == 'A': bass_bar(bar, 0.34, 'drive', bright=0.9)
    elif sec == 'A2': bass_bar(bar, 0.34, 'pop', bright=1.0)
    elif sec == 'CH': bass_bar(bar, 0.34, 'octave', bright=1.1)
    elif bar == 8: bass.add(pick_bass(mtof(42), 4 * b - 0.1, bright=0.3, drive=1.3), T(t4), 0.14)   # (the breath: one soft held note)
    else: bass_bar(bar, 0.26, 'drive', bright=0.7)
    if sec == 'A': banjo_bar(bar, 'fwd', 0.24)
    elif sec == 'A2': banjo_bar(bar, 'fwd' if bar % 2 == 0 else 'fwdback', 0.33, pan=0.3 if bar % 2 == 0 else 0.4)
    elif sec == 'BR': banjo_bar(bar, 'back', 0.14 if bar == 8 else 0.12, step=2 if bar == 8 else 1, bright=0.86, pan=0.0,
                                g_end=None if bar == 8 else 0.32)   # (bar 8: eighths, thin air; bar 9: growing with the climb back)
    else: banjo_bar(bar, 'fwd', 0.3, bright=0.88, pan=0.35, until=LAND); banjo_bar(bar, 'fwdback', 0.15, bright=0.9, up=12, pan=-0.55, until=LAND)
pad_chords(0, 16, 0.22); pad_chords(16, 32, 0.28, organ_=0.16)           # the pad; the organ joins in A'
pad_chords(32, 40, 0.28, a=0.6, r=0.9, organ_=0.12); pad_chords(40, LAND, 0.36, strings=0.24, organ_=0.17)   # the breath; the summit (+ strings)
t0, x = slide_guitar(LEAD, seed=1); lead.add(chorus(x, 0.0015, 0.3, 0.2), t0, 0.26, pan=0.05)   # the slide guitar (a light doubling)
t0, x = slide_guitar(HARM, drive=1.9, tone=3800, vib=0.18, seed=2); lead.add(x, t0, 0.15, pan=-0.42)   # the twin slide in the chorus
for bt, ln, m, *_ in CHORUS:                                               # the glockenspiel rings with the chorus' long notes
    if ln >= 1.0: glk.add(glock(mtof(m + 12), 1.6, seed=int(bt * 4)), T(bt), 0.09, pan=0.25)

# ================================================================ LANDING: bar 14 = 48.2 s, the race starts ======================
L0 = T(LAND)
K(LAND, 0.8); snr.add(SNARE[0], L0, 0.45); drums.add(TOM['fl'], L0, 0.4, pan=-0.2); fx.add(impact_e(3.0, seed=4), L0, 0.5)
perc.add(crash(3.2, seed=21), L0, 0.36, pan=-0.35); perc.add(crash(3.2, seed=22), L0, 0.3, pan=0.35)
for j, m in enumerate([52, 59, 64, 68, 71, 76]):                          # the E chord, wide, and the strings an octave up
    pad.add(voice_pad(mtof(m), 1.3, cutoff=6000, a=0.008, r=1.3, voices=5, seed=m), L0, 0.3, pan=PANS[6][j])
    if j >= 3: pad.add(voice_strings(mtof(m + 12), 1.3, a=0.02, r=1.2, bright=3800), L0, 0.13, pan=PANS[6][j])
for j, m in enumerate([52, 59, 64, 68, 71, 76]):                          # the banjo's strum down across the strings
    bj.add(banjo(mtof(m), 2.4, seed=300 + j, t60=2.5, choke=1.0), L0 + 0.014 * j, 0.3, pan=0.3 - 0.12 * j)
for j, m in enumerate([64, 68, 71]): organ.add(voice_organ(mtof(m), 1.6, a=0.01, r=0.9), L0, 0.12, pan=-0.3)
lb = pick_bass(mtof(40), 2.2, bright=0.8); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass.add(lb, L0, 0.5)
glk.add(glock(mtof(88), 2.4, seed=5), L0, 0.09, pan=0.25); glk.add(glock(mtof(95), 2.4, seed=6), L0, 0.05, pan=-0.25)

# ================================================================ MIX =============================================================
bass.curve(S.sidechain(kicks, depth=0.5, release=0.15)); pad.curve(S.sidechain(kicks, depth=0.35, release=0.2))
organ.curve(S.sidechain(kicks, depth=0.2, release=0.15)); bj.curve(S.sidechain(kicks, depth=0.15, release=0.1))
# the filters: the globe opens from muffled to bright; the breath closes the pad a little and the climb back reopens it
fc = curve([(0, 450), (T(-28), 700), (T(-16), 1100), (T(-8), 1700), (T(-0.1), 4200), (T(0), 3400), (T(16), 3800), (T(30), 3800), (T(32) + 0.1, 1300),
            (T(36), 2000), (T(40) - 0.05, 5200), (T(40), 4600), (S.len, 6000)])
pad.L = lp(pad.L, fc, 0.12); pad.R = lp(pad.R, fc, 0.12)
fb = curve([(0, 1500), (T(-12), 2200), (T(-4), 5000), (T(0), 14000), (S.len, 14000)]); bj.L = lp(bj.L, fb, 0.05); bj.R = lp(bj.R, fb, 0.05)
pad.filt(lambda x: hp1(x, 150)); organ.filt(lambda x: hp1(x, 160)); bj.filt(lambda x: hp1(x, 150)); bass.filt(lambda x: hp1(x, 35))
rotary(organ); pad.width(1.4); bj.width(1.3)
lead.curve(curve([(0, 1.0), (T(31.9), 1.0), (T(32.4), 0.62), (T(39.3), 0.62), (T(39.45), 1.0), (T(39.9), 1.0), (T(40), 1.2), (T(LAND) + 0.5, 1.2), (S.len - 0.25, 0.1), (S.len, 0.1)]))
#   (the slide: softer in the breath, a touch louder for the summit, its last note let go after the landing)
# sends: one big hall (the sky), the dotted-eighth delay on the slide (the canyon), a long echo for the far swells
verb_in = S.bus()
for x, a in ((pad, 0.3), (lead, 0.22), (bj, 0.14), (far, 0.6), (glk, 0.45), (snr, 0.1), (fx, 0.2), (organ, 0.15), (perc, 0.05)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=3.2, damp=0.3, predelay=0.025)
dl = lead.send_delay(b * 0.75, 0.2, fb=0.36, damp=0.45); df = far.send_delay(b * 1.0, 0.4, fb=0.55, damp=0.4)
if '--stems' in sys.argv:   # (a check while mixing: each bus's level and width in the intro and the main, before the master)
    for nm_, x in (('drums', drums), ('snare', snr), ('perc', perc), ('bass', bass), ('pad', pad), ('organ', organ), ('banjo', bj),
                   ('lead', lead), ('far', far), ('glock', glk), ('fx', fx), ('verb', type('v', (), {'L': vl, 'R': vr}))):
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:7s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
TRIM = 0.63   # (the mix sits ~4 dB under the master's glue threshold, so the glue only catches the peaks and the sections keep their dynamics)
mL = sum(x[0] if isinstance(x, tuple) else x.L for x in (drums, snr, perc, bass, pad, organ, bj, lead, far, glk, fx, (vl, vr), dl, df)) * TRIM
mR = sum(x[1] if isinstance(x, tuple) else x.R for x in (drums, snr, perc, bass, pad, organ, bj, lead, far, glk, fx, (vl, vr), dl, df)) * TRIM
mL, mR = mL + 0.28 * bp(mL, 2600, 0.25), mR + 0.28 * bp(mR, 2600, 0.25)   # a little presence (+1.5 dB, broad): it carries on phone speakers
res = S.master([(mL, mR)], HERE + '/out/usa', lufs=-11.3, ceiling=-1.1, highs_db=1.0, lows_db=-0.5)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
