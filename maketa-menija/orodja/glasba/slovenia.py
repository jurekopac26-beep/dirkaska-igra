"""Slovenia (Vrsic, the lake with the island church, the gravel rally, the coast): alpine house.
A bright accordion hook sung by two voices in parallel thirds (as two singers do in the country's folk songs), a zither-like plucked
arpeggio, warm pads, the accordion's left hand on the offbeats, a bouncy offbeat bass over a four-on-the-floor kick (house's 'oom-pah'),
the church bell across the lake, and in the breath the belfry's bells struck by hand in an interlocking rhythm (pritrkavanje: the
Slovenian art of playing a church's bells with their clappers). G major, 136.17 bpm: 16 bars from the drop to the race's start.
Original: the melodies, the chords' voicing, the bells' rhythm and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -10..-1  wind, the bell across the lake (nearer each time), an open pad; the zither enters; one far accordion
                                     voice hints at the hook; a muffled pulse; the build (-2, -1): the filter dips and sweeps open, a roll
                                     and a riser, the kick drops out for the last bar, an eighth of air, the pickup in thirds
    drop  (20.0 s)     bar 0         the groove, an accordion chord and the hook in thirds
    A 0-3, A' 4-7 (the left hand louder, the bass rolls, a new answer), breath 8-9 (Em7, Cmaj9: no kick, the belfry's bells), bridge
    10-11 (a new, slower tune in thirds over a bass climbing A B C D, the bellows shake into the return), final A 12-15 (the bell and
    the drop's chord mark the return; everything: the tune doubled an octave down, a flute above it), an eighth of air,
    LANDING at bar 16 = 48.2 s: the tonic chord, the bell, the crash; it rings out through the tail
"""
import sys, json, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 16                                       # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))         # 136.17 bpm
B, b = S.bar, S.beat
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
L0 = S.t(N)                                  # 48.2 s: the final hit (not S.t(N - 1))
SWING = 0.09                                 # the odd sixteenths a touch late (a light house shuffle)
def T(bar, s16):                             # time of sixteenth s16 of a bar (swung)
    return S.t(bar, (s16 + (SWING if int(round(s16)) % 2 else 0.0)) / 4)
def curve(points, log=False):                # automation: [(seconds, value), ...] -> one value per sample (log: even steps in octaves)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return 2.0 ** np.interp(x, tp, np.log2(vp)) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(11)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
def accordion(f, dur, bright=1.0, a=0.018, r=0.09, seed=0):
    """a bright accordion reed (musette register): three reeds, one in tune, one sharp, one flat, so the note beats gently,
    a quiet reed an octave below, nasal formants for the reed's buzz, the bellows' slight shake on long notes"""
    n = int((dur + r) * SR); rr = np.random.default_rng(seed); t = np.arange(n) / SR
    x = (pulse(f, n, 0.27, rr.random()) + 0.6 * pulse(f * 1.003, n, 0.30, rr.random()) + 0.45 * pulse(f * 0.9974, n, 0.33, rr.random())
         + 0.25 * pulse(f * 0.5, n, 0.4, rr.random()))
    y = lp(x, min(6500 * bright, 16000), 0.05) * 0.55 + bp(x, 1350, 0.6) * 0.4 + bp(x, 3200, 0.6) * 0.32 * bright
    env = adsr(n, a, 0.15, 0.8, r, gate=dur) * (1 + 0.04 * np.sin(TAU * 5.2 * t) * np.clip((t - 0.25) / 0.3, 0, 1))
    return hp1(y, 200) * env * 0.3

def zither(f, dur, bright=0.62, seed=0):
    """a concert zither's steel string: two plucked strings a hair apart (Karplus-Strong) and the soundboard's twang"""
    x = pluck(f, dur, 0.9978, bright, seed, 0.11) + 0.55 * pluck(f * 1.0025, dur, 0.9972, bright * 0.85, seed + 500, 0.19)
    x = x + bp(x, 2300, 0.45) * 0.5 + bp(x, 4800, 0.35) * 0.35
    return hp1(x, 160) * 0.45

def church_bell(f, dur=5.0, seed=0, tierce=1.25, ring=1.0, clank=0.5, strike=0.8):
    """a church bell: the hum an octave down, the strike tone, the tierce (a major or a minor third: tuned to the key), the fifth, the
    nominal, the upper third and two higher partials, each a doublet that beats slowly, and the clang of the clapper; strike: how much
    brighter the first instant is (the upper partials flare and settle). ring < 1 damps it sooner (the clapper beaten against the rim
    by hand, as in pritrkavanje)"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); flare = 1 + strike * np.exp(-t / 0.05); ph = np.random.default_rng(seed + 77)
    for ratio, amp, dec in ((0.5, 0.55, 3.2), (1.0, 0.45, 2.2), (tierce, 0.2, 1.6), (1.5, 0.22, 1.3), (2.0, 0.4, 1.5),
                            (2 * tierce, 0.1, 0.8), (3.0, 0.12, 0.7), (4.07, 0.08, 0.45), (5.31, 0.05, 0.3)):
        p0 = ph.random()   # (each partial in its own phase, so the strike's peak stays moderate; a doublet's two halves start together)
        x += amp * (sine(f * ratio, n, p0) + 0.6 * sine(f * ratio * 1.0011, n, p0)) * np.exp(-t / (dec * ring)) * (flare if ratio >= 2 else 1)
    x += bp(noise(n, seed), f * 3.5, 0.3) * np.exp(-t / 0.012) * clank
    return x * np.clip(t / 0.0015, 0, 1) * 0.3

def bounce_bass(f, dur, bright=1.0, a=0.003):
    """the bouncy offbeat bass: a saw and a sine with a short filter blip on each note, a little drive; the filter rests at 440 Hz
    so the 2nd and 3rd harmonics carry the bounce on a phone's small speaker"""
    n = int((dur + 0.05) * SR); t = np.arange(n) / SR
    x = saw(f, n) * 0.55 + sine(f, n) * 0.6 + pulse(f * 2, n, 0.5) * 0.2
    y = sat(lp(x, 440 + 1500 * bright * np.exp(-t / 0.05), 0.35), 1.7)
    return y * adsr(n, a, 0.1, 0.7, 0.04, gate=dur)

def flute(f, dur, seed=0, breath=0.08, a=0.02, r=0.1, vib=0.003):
    """a soft flute (as synth.voice_flute, with its breath noise seeded: the render comes out the same every time)"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = f * (1 + vib * np.sin(TAU * 5.2 * t) * np.clip((t - 0.2) / 0.4, 0, 1))
    x = sine(fr, n) + 0.25 * sine(fr * 2, n) + 0.08 * sine(fr * 3, n) + bp(noise(n, seed), fr * 1.5, 0.4) * breath * 3
    return x * adsr(n, a, 0.2, 0.8, r, gate=dur) * 0.6

def wind(dur, seed=0):
    """mountain air: noise through a slowly wandering band, in gusts"""
    n = int(dur * SR); t = np.arange(n) / SR
    fc = 650 * 2 ** (1.1 * np.sin(TAU * 0.07 * t + seed) + 0.5 * np.sin(TAU * 0.19 * t + 2 * seed))
    return bp(noise(n, seed), fc, 0.75) * (0.55 + 0.45 * np.sin(TAU * 0.09 * t + seed) ** 2)

def rev_crash(dur=1.6, seed=0):   # a cymbal played backwards (swells into the next hit)
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def riser_cut(dur, f0, f1, seed=0, fade=0.04):   # the noise riser, ending in a short fade (it stops just before a hit, leaving air)
    x = riser(dur, f0, f1, seed); k = int(fade * SR); x[-k:] *= np.linspace(1, 0, k) ** 2; return x

# ================================================================ harmony ========================================================
#            bass  voicing (pad, midi): every chord moves to the next by steps (voice leading), no root-position block triads
CH = {'G':        (43, [59, 62, 67, 71]),   # B3 D4 G4 B4 over G2
      'Gadd9':    (43, [55, 62, 69, 71]),   # open: G3 D4 A4 B4
      'D/F#':     (42, [57, 62, 66, 69]),
      'Em7':      (40, [59, 62, 64, 67]),
      'Cadd9':    (48, [60, 62, 64, 67]),
      'Cmaj7':    (48, [55, 59, 64, 67]),
      'Cmaj7#11': (48, [55, 64, 66, 71]),   # the lydian colour: open mountain air
      'D':        (50, [57, 62, 66, 69]),
      'Dsus4':    (50, [57, 62, 67, 69]),
      'Bm7':      (47, [57, 62, 66, 71]),
      'Am7':      (45, [57, 60, 64, 67])}
A_ = {0: 'G', 1: 'D/F#', 2: 'Em7', 3: [(0, 'Cadd9'), (2, 'D')]}
HARM = {-10: 'Gadd9', -9: 'Gadd9', -8: 'Cmaj7#11', -7: 'Cmaj7#11', -6: 'G', -5: 'D/F#', -4: 'Em7', -3: 'Cadd9', -2: 'Am7',
        -1: [(0, 'Dsus4'), (2, 'D')],
        8: 'Em7', 9: 'Cmaj7',                                      # the breath: V -> vi (a deceptive turn), then IV (the bells add the 9th)
        10: [(0, 'Am7'), (2, 'Bm7')], 11: [(0, 'Cadd9'), (2, 'D')],  # the bridge: the bass climbs A B C D into the return of the hook
        16: 'G'}
for k in range(4): HARM[k] = HARM[k + 4] = HARM[k + 12] = A_[k]
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]
    if isinstance(h, str): return [(0, 4, h)]
    return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]
def chord_at(bar, beat): return next(c for b0, b1, c in chords_in(bar) if b0 <= beat < b1)
def pcs(c): bs, v = CH[c]; return {bs % 12} | {m % 12 for m in v}
SC = [m for m in range(20, 110) if m % 12 in {7, 9, 11, 0, 2, 4, 6}]   # G major
def lower(m, chord, long):
    """the second voice: a diatonic third under the tune; on a held note where that third clashes with the chord, a sixth under it"""
    third = SC[SC.index(m) - 2]
    if not long or third % 12 in pcs(chord): return third
    for c in (m - 8, m - 9, m - 5):
        if c in SC and c % 12 in pcs(chord): return c
    return third

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
CALL = [[(0, 3, 'B5'), (3, 3, 'D6'), (6, 2, 'B5'), (8, 3, 'A5'), (11, 3, 'B5'), (14, 2, 'G5')],      # the hook: 3+3+2 lilt, then
        [(0, 4, 'A5'), (4, 2, 'F#5'), (6, 4, 'A5'), (10, 2, 'D6'), (12, 4, 'C6')]]                   # a longer answering bar
ANS1 = [[(0, 3, 'B5'), (3, 3, 'E6'), (6, 2, 'D6'), (8, 3, 'B5'), (11, 3, 'D6'), (14, 2, 'E6')],      # the answer climbs to the peak
        [(0, 4, 'G6'), (4, 2, 'E6'), (6, 2, 'C6'), (8, 4, 'D6'), (12, 2, 'C6'), (14, 2, 'A5')]]      # and turns home (its last A leads on)
ANS2 = [ANS1[0], [(0, 3, 'G6'), (3, 3, 'E6'), (6, 2, 'C6'), (8, 8, 'D6')]]                          # second answer: held, open
BRIDGE = [[(0, 6, 'E6'), (6, 2, 'C6'), (8, 6, 'D6'), (14, 2, 'B5')],                                 # the bridge: long-short steps
          [(0, 6, 'E6'), (6, 2, 'D6'), (8, 4, 'F#6'), (12, 2, 'D6'), (14, 2, 'A5')]]                 # in thirds, up to the leading
TEASE = [CALL[0], CALL[1], ANS1[0], [(0, 6, 'G6'), (6, 10, 'E6')]]                                   # tone, down into the hook
# the belfry (pritrkavanje): four bells tuned to the key, each with its own tierce; the big bell and the middle one take the lilt's
# accents (3+3+2, as in the hook), the small ones answer between them
BELL = {'G4': (1.25, -0.45, 1.0), 'B4': (1.2, -0.1, 0.85), 'D5': (1.25, 0.3, 0.75), 'E5': (1.2, 0.6, 0.65)}   # tierce, pan, weight
CHIME = {8: [(0, 'G4'), (2, 'D5'), (3, 'B4'), (5, 'D5'), (6, 'G4'), (8, 'B4'), (10, 'D5'), (11, 'B4'), (13, 'D5'), (14, 'G4')],
         9: [(0, 'G4'), (2, 'E5'), (3, 'D5'), (5, 'E5'), (6, 'B4'), (8, 'G4'), (10, 'E5'), (11, 'D5'), (13, 'E5'), (14, 'B4'), (15, 'D5')]}

drums, perc, bass, pad, zith, lead, stabs, fx, bells = (S.bus(x) for x in 'drums perc bass pad zither lead stabs fx bells'.split())
kicks = []

def sing(bar, phrase, gain=0.5, octave=0, voices=2, pan=0.38, lo_gain=0.72, bright=1.0, double=0.0, flute_=0.0):
    """the accordion tune; voices=2 adds the second voice a third under it; double adds the tune an octave down, flute_ a flute an octave up"""
    for i, (p, ln, name) in enumerate(phrase):
        m = nm(name) + 12 * octave; t = T(bar, p); dur = ln / 4 * b * 0.9; g = gain * hum(0.05) * (1.06 if p % 4 == 0 else 1.0)
        sd = (bar + 20) * 40 + i
        lead.add(accordion(mtof(m), dur, bright, seed=sd), t, g, pan=pan if voices == 2 else 0.05)
        if voices == 2:
            lo = lower(m, chord_at(bar, p / 4), ln >= 3)
            lead.add(accordion(mtof(lo), dur, bright * 0.92, seed=sd + 20), t, g * lo_gain, pan=-pan)
        if double: lead.add(accordion(mtof(m - 12), dur, bright * 0.8, seed=sd + 7), t, g * double, pan=0.0)
        if flute_: lead.add(flute(mtof(m + 12), ln / 4 * b * 0.85, seed=sd + 11), t, flute_, pan=0.1)

ZPAT = [0, 2, 3, 1, 3, 2, 0, 3, 1, 2, 3, 0, 3, 2, 1, 3]       # which chord tone each sixteenth (the low ones on the 3+3+2 accents)
ACC = {0, 3, 6, 8, 11, 14}
def zither_bar(bar, gain, step=1, up=12, bright=0.62, ring=0.55, stop=16):   # stop: no new note from that sixteenth on
    for b0, b1, c in chords_in(bar):
        tones = [m + up for m in CH[c][1]]
        for p in range(b0 * 4, min(b1 * 4, stop), step):
            m = tones[ZPAT[p]]; v = (1.0 if p in ACC else 0.6) * hum(0.12)
            zith.add(zither(mtof(m), ring, bright, seed=(bar + 20) * 16 + p), T(bar, p), gain * v, pan=(-0.75 if p % 2 == 0 else 0.75) * (0.6 if p in ACC else 1))

def pad_bar(bar, gain, cutoff=3200, a=0.08, r=0.5):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(CH[c][1]):
            pad.add(voice_pad(mtof(m), (b1 - b0) * b * 1.0, cutoff=cutoff, a=a, r=r, voices=5, seed=m + j), S.t(bar, b0), gain, pan=[-0.7, -0.25, 0.25, 0.7][j])

def bass_bar(bar, gain, style='bounce', bright=1.0, upto=4):
    """offbeat roots (the 'pah' against the kick's 'oom'); 'bounce' jumps an octave on the third offbeat, 'roll' adds ghost sixteenths"""
    for b0, b1, c in chords_in(bar):
        root = CH[c][0]
        for k in range(b0, min(b1, upto)):
            m = root + (12 if style != 'plain' and k == 2 and b1 - b0 == 4 else 0)
            bass.add(bounce_bass(mtof(m), b * 0.38, bright), T(bar, 4 * k + 2), gain * hum(0.04))
            if style == 'roll' and k in (1, 3):
                bass.add(bounce_bass(mtof(root + 12), b * 0.16, bright * 0.7), T(bar, 4 * k + 3), gain * 0.45)

def stab_bar(bar, gain, stop=16):
    """the accordion's left hand: short chords on the offbeats"""
    for b0, b1, c in chords_in(bar):
        for k in range(b0, b1):
            if 4 * k + 2 >= stop: continue
            for j, m in enumerate(CH[c][1][1:]):
                stabs.add(accordion(mtof(m), b * 0.16, 0.7, a=0.006, r=0.05, seed=(bar + 20) * 9 + k * 3 + j), T(bar, 4 * k + 2), gain * hum(0.06), pan=(-0.4 if k % 2 else 0.4) + 0.1 * (j - 1))

def bellows(bar, g0, g1):
    """the bellows shake: the accordion's chord pulsed in sixteenths by rocking the bellows, swelling into the next bar"""
    for b0, b1, c in chords_in(bar):
        for p in range(b0 * 4, b1 * 4):
            g = (g0 + (g1 - g0) * (p / 15) ** 1.3) * (1.0 if p % 2 == 0 else 0.7) * hum(0.05)
            for j, m in enumerate(CH[c][1][1:]):
                stabs.add(accordion(mtof(m + 12), b / 4 * 0.75, 0.85, a=0.004, r=0.03, seed=(bar + 20) * 70 + p * 3 + j), T(bar, p), g, pan=0.4 * (j - 1))

def chime(bar, gain):
    """pritrkavanje: the belfry's bells struck by hand, one after another, in an interlocking rhythm"""
    for p, name in CHIME[bar]:
        tierce, pan, w = BELL[name]
        bells.add(church_bell(mtof(nm(name)), 2.4, seed=(bar + 20) * 16 + p, tierce=tierce, ring=0.3, clank=1.5, strike=4.0), T(bar, p), gain * w * hum(0.1), pan=pan)

# drum sounds, made once
KICK = kick(dur=0.34, f0=170, f1=52, sweep=0.038, click=0.6, drive=1.7)
CLAP = clap(seed=3); SNR = snare(0.2, tone=205, snappy=0.8, seed=4)
HO = [hat(open_=True, seed=s, tone=7500) * 0.8 for s in range(3)]; HC = [hat(0.05, seed=s + 10, tone=9000) for s in range(4)]
SHK = [shaker(0.08, seed=s) for s in range(4)]; RIM = rim(seed=2)
def K(t, g=0.58): drums.add(KICK, t, g); kicks.append(t)   # a kick that the sidechain follows

def groove(bar, kick_beats=range(4), clap_on=True, ohat=True, chat=True, shake=0.14, ride_=False, ghosts=True, stop=16):
    for k in kick_beats: K(S.t(bar, k))
    for k in range(4):
        if clap_on and k in (1, 3): drums.add(CLAP, S.t(bar, k), 0.34 * hum(), pan=0.04); drums.add(SNR, S.t(bar, k), 0.12)
        if ohat and 4 * k + 2 < stop: perc.add(HO[k % 3], T(bar, 4 * k + 2), 0.3 * hum(), pan=0.25)
        for s in (0, 1, 3):
            if chat and 4 * k + s < stop: perc.add(HC[(k + s) % 4], T(bar, 4 * k + s), (0.22, 0.12, 0.17)[(0, 1, 3).index(s)] * hum(0.15), pan=-0.45)
        for s in range(4):
            if shake and 4 * k + s < stop: perc.add(SHK[s], T(bar, 4 * k + s), shake * (0.6, 0.35, 0.9, 0.45)[s] * hum(0.15), pan=0.6)
        if ride_ and 4 * k + 2 < stop: perc.add(ride(0.8, seed=k), T(bar, 4 * k + 2), 0.24, pan=0.35)
    if ghosts:   # quiet rimshots between the beats
        for p in ((7, 13) if bar % 2 else (10,)):
            if p < stop: drums.add(RIM, T(bar, p), 0.07 * hum(0.2), pan=-0.25)

def air(t1, buses=None):
    """an eighth of air before the hit at t1: everything on these buses so far fades out (15 ms) at t1 - b/2 and stays silent (call it
    before the hit's sounds are added, so no cut tail comes back with the hit); the tune's pickup, the risers and the reverb's tail go on"""
    g = np.clip(1 - (np.arange(S.n) / SR - (t1 - b / 2)) / 0.015, 0, 1)
    for x in buses or (pad, zith, stabs, perc, bass, drums): x.curve(g)

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=190, tone1=260):   # a roll speeding up and swelling towards t1
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.16, tone=tone0 + (tone1 - tone0) * x, seed=int(t * 100) % 97), t, g0 + (g1 - g0) * x ** 1.5, pan=0.06)
        t += b / (rate0 + (rate1 - rate0) * x)

# ================================================================ INTRO: the globe (bars -10..-1) ================================
I0 = S.t(-10)                                                     # 2.38 s: everything starts softly here
IG = 1.15                                                         # the intro's level before the build (bars -10..-3)
wl, wr = wind(S.t(0) - I0 + 1, 1), wind(S.t(0) - I0 + 1, 2)       # the air, swelling, then thinning as the build takes over
wg = np.clip(np.linspace(0, 1, len(wl)) / 0.12, 0, 1) * (0.5 + 0.5 * np.linspace(0, 1, len(wl))) * np.clip((S.t(0) + 0.5 - I0 - np.arange(len(wl)) / SR) / 4, 0, 1)
fx.add((wl * wg, wr * wg), I0, 0.3 * IG)
for bar, g in ((-10, 0.16), (-8, 0.24), (-6, 0.34), (-4, 0.4)):   # the bell across the lake, nearer each time (always on a chord with G)
    bells.add(church_bell(mtof(nm('G4')), 6.0, seed=bar + 20), S.t(bar), g * IG, pan=-0.2)
for bar in range(-10, 0):                                         # the pad: slow swells, getting brighter; softer in the build (the drop is bigger)
    x = bar + 10
    pad_bar(bar, (0.42 - 0.006 * x) * (0.55 if bar >= -2 else IG), cutoff=900 + 260 * x if bar < -2 else 6000,
            a=0.9 if bar < -6 else 0.25, r=1.1 if bar < -6 else 0.6)
for bar in (-10, -8):                                             # a soft low drone under the first chords
    bass.add(voice_sub(mtof(CH[HARM[bar]][0]), 2 * B - 0.1, a=1.2, r=0.8), S.t(bar), 0.02)
for bar in range(-10, 0):                                         # the zither: a few strings, then eighths, then sixteenths
    x = bar + 8
    zither_bar(bar, min(0.36 + 0.03 * x, 0.4) * (IG if bar < -2 else 1.0), step=4 if bar < -8 else 2 if bar < -4 else 1, bright=0.5 + 0.025 * x,
               ring=1.4 if bar < -8 else 0.9 if bar < -4 else 0.6, stop=14 if bar == -1 else 16)
for i, ph in enumerate(TEASE):                                    # one voice, an octave down, far away: the hook before the hook
    sing(-6 + i, ph, gain=(0.3 + 0.03 * i) * IG, octave=-1, voices=1, bright=0.7)
for bar in range(-6, -2):                                         # the bass enters softly (whole notes, then the bounce, filtered)
    for b0, b1, c in chords_in(bar):
        if bar < -4: bass.add(voice_bass(mtof(CH[c][0]), (b1 - b0) * b * 0.95, cutoff=220, env_amt=0.3, a=0.3, r=0.3), S.t(bar, b0), 0.05)
    if bar >= -4: bass_bar(bar, 0.16 + 0.04 * (bar + 4), style='plain', bright=0.25)
for bar in (-4, -3):                                              # a muffled pulse (the heart of the flight)
    for k in range(4):
        drums.add(lp(KICK, 320), S.t(bar, k), 0.32 + 0.08 * (bar + 4)); kicks.append(S.t(bar, k))
    for k in range(4): perc.add(SHK[k % 4], T(bar, 4 * k + 2), 0.1 + 0.04 * (bar + 4), pan=0.5)
# --- the build (bars -2, -1; it also works on its own from 15.5 s, the short intro): the kick, then a last bar without it; a roll and a
#     riser that stop an eighth early; the filter dips and sweeps open (in MIX); the pickup in thirds sounds alone in the air
for k in range(4): K(S.t(-2, k), 0.5)
bass_bar(-2, 0.28, style='plain', bright=0.5)
snare_roll(S.t(-2), S.t(-1), 2, 4, 0.07, 0.14)
snare_roll(S.t(-1), S.t(0) - b / 2, 4, 8, 0.14, 0.22)
for k in range(8): perc.add(HC[k % 4], T(-2, 2 * k + 1), 0.04 + 0.006 * k, pan=-0.35)   # ticking hats, growing
fx.add(riser_cut(2 * B - b / 2, f0=300, f1=9000, seed=3), S.t(-2), 0.26)
fx.add(rev_crash(1.2, seed=5), S.t(0) - 1.2, 0.2)
sing(-1, [(10, 2, 'D5'), (12, 2, 'G5'), (14, 2, 'A5')], gain=0.42)
air(S.t(0))                                                       # the air before the drop

# ================================================================ MAIN: the flight (bars 0..15) ==================================
fx.add(impact(2.5), S.t(0), 0.32); fx.add(crash(2.6, seed=1), S.t(0), 0.3, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.12)
for j, m in enumerate([67, 71, 74, 79]):   # the drop's accordion chord, a sforzando (on the lead bus: the kick does not duck it)
    lead.add(accordion(mtof(m), b * 0.9, 0.9, a=0.004, r=0.3, seed=700 + j), S.t(0), 0.3, pan=[-0.5, -0.2, 0.2, 0.5][j])
def section(bar): return 'A' if bar < 4 else 'A2' if bar < 8 else 'breath' if bar < 10 else 'bridge' if bar < 12 else 'final'
for bar in range(16):
    sec = section(bar); stop = 14 if bar == 15 else 16            # (bar 15 stops an eighth early: the air before the landing)
    # drums
    if sec in ('A', 'A2'): groove(bar)
    elif sec == 'breath':  groove(bar, kick_beats=[], clap_on=False, ohat=False, chat=bar == 9, shake=0.1, ghosts=False)
    elif sec == 'bridge':  groove(bar, kick_beats=range(4) if bar == 10 else range(2), clap_on=bar == 10, ohat=bar == 10)
    else:                  groove(bar, ride_=True, stop=stop)
    # harmony and bass
    pad_bar(bar, {'A': 0.42, 'A2': 0.4, 'breath': 0.36, 'bridge': 0.34, 'final': 0.38}[sec], cutoff=3400 if sec != 'breath' else 1800,
            a=0.06 if sec != 'breath' else 0.5, r=0.5 if sec != 'breath' else 1.0)
    if sec == 'breath':                                           # long notes under the bells: E, then C
        for b0, b1, c in chords_in(bar): bass.add(voice_bass(mtof(CH[c][0]), (b1 - b0) * b * 0.95, cutoff=260, env_amt=0.6, a=0.08, r=0.4), S.t(bar, b0), 0.11)
    else:
        bass_bar(bar, 0.34, style='roll' if sec == 'final' or bar in (6, 7) else 'bounce', bright=0.8 if sec == 'bridge' else 1.0,
                 upto=2 if bar == 11 else 3 if bar == 15 else 4)
    # the zither: sixteenths; in the breath it waits for the bells, then eighths; in the final an octave up on each phrase's second half
    if sec == 'breath':
        if bar == 9: zither_bar(bar, 0.45, step=2, ring=1.0)
    else: zither_bar(bar, {'A': 0.48, 'A2': 0.48, 'bridge': 0.44, 'final': 0.44}[sec], up=24 if sec == 'final' and bar % 4 >= 2 else 12, bright=0.66, stop=stop)
    # the accordion's left hand: light in A, full from A' on
    if sec == 'A': stab_bar(bar, 0.31)
    elif sec in ('A2', 'final') or bar == 10: stab_bar(bar, 0.4, stop=stop)
bellows(11, 0.04, 0.16)                                           # the bellows shake into the final A
# the tunes
for bar, ph in [(0, CALL[0]), (1, CALL[1]), (2, ANS1[0]), (3, ANS1[1]), (4, CALL[0]), (5, CALL[1]), (6, ANS2[0]), (7, ANS2[1])]:
    sing(bar, ph, gain=0.48)
for bar in (8, 9): chime(bar, 0.24)                              # the breath: the belfry rings (pritrkavanje)
for i, ph in enumerate(BRIDGE): sing(10 + i, ph, gain=0.42)       # the bridge: the singers' slower tune
for bar, ph in [(12, CALL[0]), (13, CALL[1]), (14, ANS1[0]), (15, ANS1[1])]:
    sing(bar, ph, gain=0.52, double=0.36, flute_=0.09)             # the final A: doubled an octave down, a flute an octave above
# fills: every fourth bar
for bar in (3, 7):
    drums.add(SNR, T(bar, 14), 0.12); drums.add(SNR, T(bar, 15), 0.18)
    fx.add(rev_crash(1.0, seed=bar), S.t(bar + 1) - 1.0, 0.16)
fx.add(crash(2.0, seed=2), S.t(4), 0.18, pan=-0.2)
for p, f in zip(range(12, 16), (196, 165, 147, 123)): drums.add(tom(f, 0.3), T(7, p), 0.3, pan=0.4 - 0.25 * (p - 12))
# the breath: a crash and a downlifter as the kick stops, a gust of wind under the bells
fx.add(crash(2.5, seed=3), S.t(8), 0.24, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.12)
gl_, gr_ = wind(2 * B + 1.0, 7), wind(2 * B + 1.0, 8); ge = np.sin(np.pi * np.arange(len(gl_)) / len(gl_)) ** 2
fx.add((gl_ * ge, gr_ * ge), S.t(8) - 0.3, 0.16)
# the bridge builds into the final A: a riser, the roll, the cymbal swelling backwards; the bell marks the return
fx.add(riser_cut(2 * B, f0=400, f1=8000, seed=7), S.t(10), 0.22)
snare_roll(S.t(11, 2), S.t(12), 4, 8, 0.1, 0.2)
fx.add(rev_crash(1.0, seed=9), S.t(12) - 1.0, 0.2)
fx.add(crash(2.5, seed=4), S.t(12), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(12), 0.15)
for j, m in enumerate([67, 71, 74, 79]):   # the hook's return gets the drop's accordion chord too
    lead.add(accordion(mtof(m), b * 0.9, 0.9, a=0.004, r=0.3, seed=720 + j), S.t(12), 0.24, pan=[-0.5, -0.2, 0.2, 0.5][j])
bells.add(church_bell(mtof(nm('G4')), 3.0, seed=12, ring=0.5), S.t(12), 0.34, pan=-0.2)
# the last bar leads into the landing: a roll, toms tumbling down, a short riser, the cymbal swelling backwards, then an eighth of air
snare_roll(S.t(15, 2), L0 - b / 2, 4, 8, 0.12, 0.22)
for p, f in zip(range(6, 14, 2), (220, 185, 156, 131)): drums.add(tom(f, 0.3), T(15, p), 0.32, pan=0.45 - 0.3 * (p - 6) / 2)
fx.add(riser_cut(B - b / 2, f0=600, f1=10000, seed=8), S.t(15), 0.2)
fx.add(rev_crash(1.4, seed=10), L0 - 1.4, 0.26)
air(L0)                                                           # the air before the landing

# ================================================================ LANDING: bar 16 = 48.2 s, the race starts ======================
drums.add(KICK, L0, 0.65); drums.add(CLAP, L0, 0.4); drums.add(SNR, L0, 0.2)   # (not in the sidechain: nothing ducks the last chord)
fx.add(impact(2.5, seed=5), L0, 0.3); fx.add(crash(3.0, seed=6), L0, 0.36, pan=0.1)
bells.add(church_bell(mtof(nm('G4')), 2.5, seed=1, strike=0.3), L0, 0.75, pan=-0.15)                                    # the bell, near now
for j, m in enumerate([55, 62, 67, 71, 74]): pad.add(voice_pad(mtof(m), 1.0, cutoff=4200, a=0.01, r=1.3, seed=m), L0, 0.22, pan=[-0.7, -0.35, 0, 0.35, 0.7][j])
for j, m in enumerate([55, 59, 62, 67, 71, 74, 79, 83]): zith.add(zither(mtof(m), 2.4, 0.7, seed=900 + j), L0 + 0.016 * j, 0.28, pan=-0.6 + 0.17 * j)   # a strum up
for m, g, p in ((nm('B5'), 0.62, 0.2), (nm('G5'), 0.5, -0.2), (nm('D5'), 0.4, 0.0), (nm('G4'), 0.35, 0.0)):   # the voices end in thirds over the fifth
    lead.add(accordion(mtof(m), 1.3, 1.0, r=0.6, seed=m), L0, g, pan=p)
lb = bounce_bass(mtof(43), 2.3, 0.8); lb *= np.exp(-np.arange(len(lb)) / SR / 0.6)   # the last bass note dies away with the chord
bass.add(lb, L0, 0.45)

# ================================================================ MIX =============================================================
bass.curve(S.sidechain(kicks, depth=0.6, release=0.14)); pad.curve(S.sidechain(kicks, depth=0.45, release=0.18))
zith.curve(S.sidechain(kicks, depth=0.25, release=0.12)); stabs.curve(S.sidechain(kicks, depth=0.3, release=0.1))
# the filter on the pad and the zither (moving evenly in octaves): the intro opens slowly; the build dips it and sweeps it open;
# the breath closes it a little and the bridge reopens it
fc = curve([(0, 2000), (S.t(-6), 2800), (S.t(-3, 3), 3200), (S.t(-2), 900), (S.t(-1), 2200), (S.t(-1, 2), 5000), (S.t(0) - b / 2, 14000),
            (S.t(0), 16000), (S.t(8), 16000), (S.t(8, 1), 2600), (S.t(10), 3500), (S.t(12) - 0.1, 16000), (S.len, 16000)], log=True)
for x in (pad, zith): x.L = lp(x.L, fc); x.R = lp(x.R, fc)
pad.filt(lambda x: hp1(x, 140)); stabs.filt(lambda x: hp1(x, 250)); lead.filt(lambda x: hp1(x, 260))
bass.filt(lambda x: hp1(x, 35))
pad.width(1.8); zith.width(1.3)
# sends: one long, bright 'valley' reverb (mountain air) and a short room for the drums; a dotted-eighth delay on the tune
verb_in = S.bus()
for x, a in ((pad, 0.35), (zith, 0.42), (lead, 0.24), (stabs, 0.15), (bells, 0.6), (fx, 0.25), (perc, 0.08)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.25, decay=3.2, damp=0.22, predelay=0.03); vl, vr = vl * 1.3, vr * 1.3
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.45, decay=0.7, damp=0.4)
dl = lead.send_delay(b * 0.75, 0.16, fb=0.32, damp=0.45)
BUSES = [drums, perc, bass, pad, zith, lead, stabs, fx, bells, (vl, vr), (room_l, room_r), dl]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level and width in the intro and the main, before the master)
    for nm_, x in zip('drums perc bass pad zither lead stabs fx bells verb room delay'.split(), BUSES):
        xl, xr = (x.L, x.R) if isinstance(x, Bus) else x
        for sec, (a, z) in (('intro', (0, int(DROP * SR))), ('main', (int(DROP * SR), int(END * SR)))):
            m = 0.5 * (xl[a:z] + xr[a:z]); s = 0.5 * (xl[a:z] - xr[a:z]); r = np.sqrt(np.mean(m ** 2)) + 1e-9
            print(f'{nm_:7s} {sec:5s} rms {20 * np.log10(r):6.1f}  side/mid {20 * np.log10(np.sqrt(np.mean(s ** 2)) / r + 1e-9):6.1f}', end='   ' if sec == 'intro' else '\n')
res = S.master(BUSES, HERE + '/out/slovenia', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.5, lows_db=-1.5)   # (no glue: the hits keep their lift)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
