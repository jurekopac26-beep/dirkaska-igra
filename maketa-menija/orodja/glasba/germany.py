"""Germany (the Eifel: a 21 km lap through the dark forest, crests, jumps, banked corners, 300 m of climbing):
Berlin techno meets motorik krautrock and the Berlin School's sequencers, under the gravity of a church organ.
A robotic sequence (one pattern of five tones, transposed with each chord as the old step sequencers were played; its cells are
6 + 6 + 4 sixteenths, so its accents fall three against the kick's four) rolls through everything; a rolling sixteenth bass climbs a
step each bar (F G Ab Bb C: the 300 m of climbing); a tight, straight four-on-the-floor with a dark rumble under it; a pipe organ
and a choir for the forest's drama; a mono-synth lead (a square, a saw a hair sharp, a square an octave under) sings the hook.
F minor, 136.17 bpm: 16 bars from the drop to the race's start.
The hook: a one-bar figure on a 2+1+3+4+2+4 sixteenth rhythm (a drop of a fourth, a step, a leap of a minor sixth to the flat
sixth, which sighs a semitone down, then a fourth down), spun a step lower, back again over a new chord (where the sigh becomes a
4-3 suspension), then a straight run down and the dominant's arpeggio (spun out as Bach spun a theme).
Original: the melodies, the chords' voicing and every sound are written and computed here (no samples, no quotations).

    intro (the globe)  bars -11..-1  wind over the forest, thunder far off, a choir and a soft organ: Fm(add9) Dbmaj7 Bbm7 C7;
                                     the sequence assembles itself step by step as its filter opens; a motorik beat and an
                                     eighth-note bass (krautrock's steady drive); the hook far away on the organ's flute stop; the
                                     build: four on the floor, offbeat hats, the roll, the riser, the lead's pickup over the last
                                     two beats
    drop  (20.0 s)     bar 0         the groove and the hook: Fm(add9) Eb/G Abmaj7 Bbm7-C7 (the bass climbs F G Ab Bb C)
    A 0-3 (the hook; the organ and the sequencer held back a little, to be spent in the final), B 4-7 (the summit: Dbmaj7 Eb6
    Fm(add9) C/E-C7; a long singing line on the hook's gesture, the choir, struck steel, an offbeat bass), the deep forest 8-9
    (no kick: the full organ with the hook in long notes over its pedal, the choir; the bass falls F Eb Db C, the lament's four
    steps, into the build), the build 10-11 (the kick comes back muffled, the hook behind a closed filter, the roll, the riser),
    final A 12-15 (everything: the hook with a shadow an octave up, a second sequencer glinting, the ride, the full organ, the
    choir stronger), LANDING at bar 16 = 48.2 s: F minor on the full organ and the choir, the seventh falling to the third in
    the lead, a boom tuned to F, the crash; it rings out through the tail
"""
import sys, json, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 16                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 136.17 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
def T(bar, p=0.0):                            # time of sixteenth p of a bar (bar 0 = the drop; straight: no swing, German precision)
    return S.t(bar, p / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample (log: for cutoffs)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return np.exp(np.interp(x, tp, np.log(vp))) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(1927)             # (the year the ring in the Eifel opened)
def hum(x=0.04): return 1 + rng.uniform(-x, x)   # a hair of variation in velocity (machines, but analogue ones)

# ================================================================ instruments (defined here: synth.py is shared) ==================
def techno_kick(dur=0.40, seed=0):
    """the kick: a sine swept down to F1 (in key with the bass), a punch an octave up and the beater's knock (the part a phone
    can play), a click; driven into a soft clip"""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 43.65 + 190 * np.exp(-t / 0.030) + 70 * np.exp(-t / 0.004)
    body = sine(f, n) * (0.75 * np.exp(-t / 0.16) + 0.25 * np.exp(-t / 0.05))
    punch = sine(2 * f, n, 0.25) * np.exp(-t / 0.028) * 0.32
    knock = bp(noise(n, seed), 1700, 0.45) * np.exp(-t / 0.006) * 0.55
    click = hp(noise(n, seed + 1), 4500, 0.1) * np.clip(t / 0.0003, 0, 1) * np.exp(-t / 0.0016) * 0.28
    x = np.tanh((body + punch + knock + click) * 1.6) / np.tanh(1.6)
    return x * np.clip((dur - t) / 0.05, 0, 1)

def peq(x, fc, db, res=0.3):   # a broad bell EQ: db at fc (the state variable filter's band added or taken away)
    k = 2.0 - 2.0 * res; return x + (10 ** (db / 20) - 1) * k * bp(x, fc, res)

def roll_bass(f, dur, bright=1.0, acc=1.0):
    """the rolling bass: a saw, a narrow pulse a hair sharp and a sine, through a resonant low-pass that snaps open on each note
    (the roll's pluck sits in the low mids, where phones still hear it), a little drive; the oscillators start in phase, so every
    note of the roll is equally strong"""
    n = int((dur + 0.04) * SR); t = np.arange(n) / SR
    x = saw(f, n, 0.0) * 0.55 + pulse(f * 1.003, n, 0.3, 0.4) * 0.3 + sine(f, n, 0.5) * 0.6   # (phases set so the fundamentals add)
    fc = 140 + 240 * bright + 1500 * bright * acc * np.exp(-t / 0.045)
    return sat(lp(x, fc, 0.42), 1.6) * adsr(n, 0.002, 0.09, 0.55, 0.03, gate=dur)

def seq_note(f, dur, cut=1500.0, acc=1.0, res=0.5, seed=0):
    """one step of the sequencer: a saw and a narrow pulse a hair apart through a resonant low-pass that blips open on the step"""
    n = int((dur + 0.06) * SR); t = np.arange(n) / SR
    x = saw(f, n, 0.0) * 0.55 + pulse(f * 1.005, n, 0.28, 0.39) * 0.45   # (in phase: every step equally strong, robotic)
    fc = np.minimum(cut * (1 + 3.2 * acc * np.exp(-t / 0.05)), 8500)     # (the blip capped: bright, but no spike for the limiter)
    return lp(x, fc, res) * adsr(n, 0.0015, 0.07, 0.4, 0.05, gate=dur)

def robo_lead(f, dur, glide_from=None, bright=1.0, vib=0.0, sub=0.2):
    """the lead: a square-ish pulse, a saw a hair sharp, a square an octave under (a mono synth of the Kraftwerk era), a
    low-pass that opens on the attack and settles (where it settles follows `bright`: the closed hook of the build is dark,
    the main hook keeps some bite), two soft presence bands (the part a phone speaker carries); portamento into the wide
    leaps; a late, slight vibrato on long notes. sub: the octave-under square (none for the shadow an octave up, whose
    sub would land on the lead's own fundamental and thin it)"""
    n = int((dur + 0.14) * SR); t = np.arange(n) / SR; fr = np.full(n, float(f))
    if glide_from: fr = f * (glide_from / f) ** np.exp(-t / 0.016)
    if vib: fr = fr * (1 + vib * np.sin(TAU * 5.4 * t) * np.clip((t - 0.22) / 0.3, 0, 1))
    x = pulse(fr, n, 0.36, 0.43) * 0.5 + saw(fr * 1.004, n, 0.0) * 0.4 + (pulse(fr * 0.5, n, 0.5, 0.0) * sub if sub else 0)   # (in phase)
    y = lp(x, 900 + 1200 * bright + 3200 * bright * np.exp(-t / 0.16), 0.3) + (bp(x, 2700, 0.35) * 0.25 + bp(x, 3800, 0.4) * 0.11) * bright
    return y * adsr(n, 0.004, 0.25, 0.72, 0.12, gate=dur)

def pipe_organ(f, dur, stops='principal', a=0.05, r=0.45, chiff=0.15, seed=0):
    """a church organ: ranks of pipes (16', 8', 4', 2 2/3', 2', the mixture), each pipe a fundamental and two soft harmonics, the
    ranks a hair out of tune with each other (pipes never quite agree), the chiff of wind at the pipe's mouth, unsteady wind"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed)
    ranks = {'flute':     ((1, 1.0, 0.06), (2, 0.3, 0.04)),                       # (pitch ratio, level, its harmonics' level)
             'principal': ((1, 1.0, 0.35), (2, 0.55, 0.3), (4, 0.22, 0.2)),        # the manuals: no 16' (it would muddy close chords)
             'plenum':    ((1, 1.0, 0.4), (2, 0.75, 0.35), (3, 0.3, 0.2), (4, 0.42, 0.25), (6, 0.22, 0.12), (8, 0.2, 0.1)),
             'pedal':     ((0.5, 0.8, 0.25), (1, 1.0, 0.35), (2, 0.45, 0.25))}[stops]   # the pedal: 16', 8', 4'
    x = np.zeros(n); tot = 0.0
    for h, w, hw in ranks:
        fr = f * h * (1 + rr.uniform(-0.0012, 0.0012))
        if fr > 9000: continue
        p = sine(fr, n, rr.random())
        if 2 * fr < 16000: p = p + hw * sine(2 * fr, n, rr.random())
        if 3 * fr < 16000: p = p + hw * 0.4 * sine(3 * fr, n, rr.random())
        x += w * p; tot += w * (1 + 1.4 * hw)
    x = x / tot + bp(noise(n, seed), min(f * 4, 9000), 0.35) * np.exp(-t / 0.035) * chiff
    return x * (1 + 0.006 * np.sin(TAU * 0.8 * t + rr.random() * 6)) * adsr(n, a, 0.15, 1.0, r, gate=dur)

def clang(f=420.0, dur=0.6, seed=0):
    """struck sheet steel (the industrial accent of Berlin techno): inharmonic partials and a hard metallic attack"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 0.22), (1.59, 0.7, 0.16), (2.14, 0.55, 0.12), (2.83, 0.4, 0.08), (3.61, 0.3, 0.06), (4.7, 0.2, 0.04)):
        x += amp * sine(f * ratio, n, (seed * 0.37 + ratio) % 1.0) * np.exp(-t / dec)
    x += hp(noise(n, seed), 3000, 0.2) * np.exp(-t / 0.008) * 0.8
    return np.tanh(x * 0.8) * np.clip(t / 0.0008, 0, 1) * 0.35

def wind(dur, seed=0):
    """wind over the forest: noise through a slowly wandering band, in gusts"""
    n = int(dur * SR); t = np.arange(n) / SR
    fc = 520 * 2 ** (1.0 * np.sin(TAU * 0.06 * t + seed) + 0.45 * np.sin(TAU * 0.17 * t + 2 * seed))
    return bp(noise(n, seed), fc, 0.7) * (0.5 + 0.5 * np.sin(TAU * 0.08 * t + seed) ** 2)

def thunder(dur=5.0, seed=0):
    """thunder far off over the hills: low noise, a few rolls, a long tail"""
    n = int(dur * SR); t = np.arange(n) / SR
    rolls = sum(np.exp(-np.clip(t - o, 0, None) / 0.15) * (t >= o) * a for o, a in ((0.0, 1.0), (0.4, 0.7), (0.9, 0.5), (1.6, 0.35)))
    x = lp(noise(n, seed), 120 + 450 * np.exp(-t / 0.3))
    return x * np.clip(t / 0.08, 0, 1) * (0.5 * rolls + np.exp(-t / 1.6)) * 1.4

def rev_crash(dur=1.5, seed=0):   # a cymbal played backwards (swells into the next hit)
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

def boom(dur=3.0, seed=0, f=float(mtof(29))):
    """the boom on the big hits, tuned to the tonic: a sine swept down onto F1 (43.65 Hz), driven, and a dull thud of noise
    (synth.impact() settles on A1, the major third of F, which would turn the F minor landing major and sour in the low end)"""
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.tanh(sine(f * (1 + 3.4 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.7) * 1.6) * 0.8
    return body + lp(noise(n, seed), 900) * np.exp(-t / 0.4) * 0.35

def tom_note(name, dur=0.35):   # a tom tuned to a note (synth.tom() sounds ~11 cents sharp of its f: its pitch sweeps down onto f)
    return tom(float(mtof(nm(name))) * 2 ** (-11 / 1200), dur)

# ================================================================ harmony ========================================================
#            voicing (organ, choir: midi): every chord moves to the next by steps against the bass (voice leading)
CH = {'Fm(add9)': [56, 60, 65, 67],    # Ab3 C4 F4 G4     (over the bass F: F minor with the ninth G, no seventh)
      'Eb/G':     [55, 58, 63, 67],    # G3 Bb3 Eb4 G4    (three voices step down while the bass steps up)
      'Abmaj7':   [56, 60, 63, 67],    # Ab3 C4 Eb4 G4
      'Bbm7':     [56, 61, 65, 68],    # Ab3 Db4 F4 Ab4
      'C7':       [55, 58, 64, 67],    # G3 Bb3 E4 G4     (the leading tone E, the seventh Bb: both resolve into Fm)
      'Csus4':    [55, 60, 65, 67],    # G3 C4 F4 G4
      'Dbmaj7':   [56, 60, 65, 68],    # Ab3 C4 F4 Ab4
      'Eb6':      [58, 60, 63, 67],    # Bb3 C4 Eb4 G4
      'C/E':      [55, 60, 64, 67]}    # G3 C4 E4 G4
#            the sequencer's five tones per chord: t0 the anchor, t1 the fifth, t2 the octave, t3 the third above, t4 the colour
ARP = {'Fm(add9)': [53, 60, 65, 68, 67],   # F3 C4 F4 Ab4 G4
       'Eb/G':     [55, 58, 63, 67, 65],   # G3 Bb3 Eb4 G4 F4
       'Abmaj7':   [56, 63, 68, 72, 67],   # Ab3 Eb4 Ab4 C5 G4
       'Bbm7':     [58, 65, 70, 73, 68],   # Bb3 F4 Bb4 Db5 Ab4
       'C7':       [60, 67, 72, 76, 70],   # C4 G4 C5 E5 Bb4
       'Csus4':    [60, 67, 72, 77, 70],   # C4 G4 C5 F5 Bb4
       'Dbmaj7':   [49, 56, 61, 65, 60],   # Db3 Ab3 Db4 F4 C4
       'Eb6':      [51, 58, 63, 67, 60],   # Eb3 Bb3 Eb4 G4 C4
       'C/E':      [52, 55, 60, 64, 67]}   # E3 G3 C4 E4 G4
A_ = {0: [(0, 'Fm(add9)', 41)], 1: [(0, 'Eb/G', 43)], 2: [(0, 'Abmaj7', 44)], 3: [(0, 'Bbm7', 46), (2, 'C7', 48)]}   # the bass climbs
HARM = {-11: [(0, 'Fm(add9)', 41)], -10: [(0, 'Fm(add9)', 41)], -9: [(0, 'Dbmaj7', 37)], -8: [(0, 'Dbmaj7', 37)],      # (beat, chord, bass)
        -7: [(0, 'Bbm7', 46)], -6: [(0, 'Bbm7', 46)], -5: [(0, 'Csus4', 48), (2, 'C7', 48)],
        -4: [(0, 'Fm(add9)', 41)], -3: [(0, 'Dbmaj7', 37)], -2: [(0, 'Bbm7', 46)], -1: [(0, 'Csus4', 48), (2, 'C7', 48)],
        4: [(0, 'Dbmaj7', 37)], 5: [(0, 'Eb6', 39)], 6: [(0, 'Fm(add9)', 41)], 7: [(0, 'C/E', 40), (2, 'C7', 36)],
        8: [(0, 'Fm(add9)', 41)], 9: [(0, 'Eb6', 39)], 10: [(0, 'Dbmaj7', 37)], 11: [(0, 'Csus4', 36), (2, 'C7', 36)],
        16: [(0, 'Fm(add9)', 41)]}
for k in range(4): HARM[k] = HARM[k + 12] = A_[k]
def chords_in(bar):   # [(from beat, to beat, chord, bass)]
    h = HARM[bar]; return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1], h[i][2]) for i in range(len(h))]

# ================================================================ the tunes (sixteenth, length in sixteenths, note) ==============
HOOK = [[(0, 2, 'Ab5'), (2, 1, 'Eb5'), (3, 3, 'F5'), (6, 4, 'Db6'), (10, 2, 'C6'), (12, 4, 'G5')],     # a: a leap of a minor sixth, its sigh
        [(0, 2, 'G5'), (2, 1, 'Db5'), (3, 3, 'Eb5'), (6, 4, 'C6'), (10, 2, 'Bb5'), (12, 4, 'F5')],      # a': the same a step lower
        [(0, 2, 'Ab5'), (2, 1, 'Eb5'), (3, 3, 'F5'), (6, 4, 'Db6'), (10, 2, 'C6'), (12, 4, 'G5')],     # a again (the sigh now a 4-3 over Ab)
        [(0, 2, 'Db6'), (2, 2, 'C6'), (4, 2, 'Bb5'), (6, 2, 'Ab5'), (8, 3, 'G5'), (11, 1, 'E5'), (12, 2, 'G5'), (14, 2, 'Bb5')]]  # the turn
TURN = HOOK[3][4:]                                                                                    # the dominant's arpeggio (a pickup)
BMEL = [[(0, 3, 'Ab5'), (3, 3, 'F5'), (6, 10, 'Db6')],                                               # B: the hook's gesture (down, then
        [(0, 3, 'Bb5'), (3, 3, 'G5'), (6, 6, 'Eb6'), (12, 4, 'Db6')],                                # a leap up), held; a step higher: the summit
        [(0, 6, 'C6'), (6, 2, 'Ab5'), (8, 4, 'G5'), (12, 4, 'F5')],                                  # the descent
        [(0, 4, 'E5'), (4, 2, 'F5'), (6, 2, 'G5'), (8, 4, 'Bb5'), (12, 2, 'Db6'), (14, 2, 'C6')]]   # C7(b9): into the forest
AUGM = [[(0, 4, 'Ab5'), (4, 2, 'Eb5'), (6, 6, 'F5'), (12, 8, 'Db6')], [(4, 4, 'C6'), (8, 8, 'G5')]]   # the hook in long notes

# ================================================================ buses, the players =============================================
drums, perc, bass, arp, arp2, lead, organ, choir, fx, atmos = (S.bus(x) for x in 'drums perc bass arp arp2 lead organ choir fx atmos'.split())
kicks = []                                    # every kick's time (the sidechain, the rumble)
ARPCUT = curve([(0, 450), (S.t(-10), 450), (S.t(-7), 800), (S.t(-4), 1300), (S.t(-2), 1700), (S.t(0) - 0.02, 4200), (S.t(0), 2300),
                (S.t(4), 2600), (S.t(8) - 0.02, 3400), (S.t(8), 1500), (S.t(10), 600), (S.t(12) - 0.02, 4500), (S.t(12), 3000),
                (S.t(15), 3800), (S.len, 4000)], log=True)
ARPCUT *= 1 + 0.22 * np.sin(TAU * np.arange(S.n) / SR / (4 * B) - np.pi / 2)   # the filter turning slowly, every four bars
PAT_A = [0, 2, 1, 3, 2, 4, 0, 2, 1, 3, 2, 4, 0, 3, 2, 1]   # 6 + 6 + 4: low, octave, fifth, third, octave, colour (twice), then down
PAT_B = [0, 3, 2, 4, 1, 2, 0, 3, 2, 4, 1, 2, 0, 4, 3, 2]   # B: the cell turned around (the third and the colour first)
ACC = (0, 6, 12)

def arp_bar(bar, gain, pat=PAT_A, steps=None, octave=0, pan=None, dst=None, res=0.5, upto=16):
    """the sequencer: every sixteenth a tone of the chord (the pattern transposed with the chord); the accents (cell starts) open
    the filter more; steps: only these steps sound (the sequence assembling itself in the intro)"""
    dst = dst or arp
    for b0, b1, c, _ in chords_in(bar):
        for p in range(b0 * 4, min(b1 * 4, upto)):
            if steps is not None and p not in steps: continue
            t = T(bar, p); m = ARP[c][pat[p]] + 12 * octave; a = p in ACC
            pn = pan if pan is not None else 0.6 * np.sin(TAU * (t - S.t(-10)) / (2 * B))   # it sweeps slowly across, every two bars
            dst.add(seq_note(mtof(m), s16 * 0.7, ARPCUT[int(t * SR)], 1.0 if a else 0.45, res, seed=(bar + 20) * 16 + p),
                    t, gain * (1.0 if a else 0.72) * hum(0.03), pan=pn)

def glint_bar(bar, gain, upto=16):
    """the second sequencer (the final): every third sixteenth, an octave up, the top three tones in turn (3 against 4 again)"""
    for k, p in enumerate(range(0, upto, 3)):
        c = next(cc for b0, b1, cc, _ in chords_in(bar) if b0 * 4 <= p < b1 * 4); m = ARP[c][2 + k % 3] + 12; t = T(bar, p)
        arp2.add(seq_note(mtof(m), s16 * 0.9, 2600, 1.0, 0.35, seed=900 + bar * 8 + k), t, gain * hum(0.04), pan=0.45 if k % 2 else 0.25)

def bass_bar(bar, gain, style='roll', bright=1.0, upto=16, gate=0.62):
    """roll: sixteenths between the kicks (the root, the root, the octave), the last beat climbing to the next chord;
    pump: an offbeat eighth and an octave sixteenth (B); eighths: krautrock's steady eighth notes (the intro)"""
    segs = chords_in(bar)
    for b0, b1, c, bs in segs:
        for p in range(b0 * 4, min(b1 * 4, upto)):
            q = p % 4; m = None; acc = 0.6; g = 0.8; dur = s16 * gate
            if style == 'roll':
                if q == 0: continue
                m = bs + (12 if q == 3 else 0); acc, g = (1.0, 1.0) if q == 2 else (0.6, 0.82)
                if p >= 13 and b1 == 4 and len(segs) == 1: m = bs + (0, 7, 12)[p - 13]   # the last beat: root, fifth, octave
            elif style == 'pump':
                if q == 2: m, acc, g, dur = bs, 1.0, 1.0, s16 * 1.5
                elif q == 3: m, acc, g, dur = bs + 12, 0.7, 0.7, s16 * 0.5
            elif style == 'eighths':
                if q in (0, 2): m, acc, g, dur = bs, (0.5 if q == 0 else 0.8), (0.85 if q == 0 else 1.0), s16 * 1.4
            if m is not None:
                bass.add(roll_bass(mtof(m), dur, bright, acc), T(bar, p), gain * g * hum(0.03))

def lead_bar(bar, phrase, gain, octave=0, bright=1.0, dst=None, pan=0.0, sub=0.2):
    """the lead: legato, a quick glide up into the wide leaps (a fourth or more), vibrato on the long notes"""
    dst = dst or lead; prev = None
    for p, ln, name in phrase:
        m = nm(name) + 12 * octave
        gf = mtof(prev) if prev is not None and m - prev >= 5 else None
        dst.add(robo_lead(mtof(m), ln * s16 * 0.94, gf, bright, 0.0045 if ln >= 4 else 0.0, sub), T(bar, p), gain * hum(0.03), pan=pan)
        prev = m

def organ_bar(bar, gain, stops='principal', a=0.05, r=0.45, chiff=0.15, ln=1.0):   # ln: the bar's last chord let go early (a breath)
    for b0, b1, c, _ in chords_in(bar):
        for j, m in enumerate(CH[c]):
            organ.add(pipe_organ(mtof(m), (b1 - b0) * b * (ln if b1 == 4 else 1.0), stops, a, r, chiff, seed=(bar + 20) * 10 + j + b0),
                      T(bar, 4 * b0), gain, pan=(-0.7, -0.25, 0.25, 0.7)[j])

def organ_line(bar, phrase, gain, stops='flute', octave=0, pan=0.1):   # a tune on the organ (one voice, legato)
    for p, ln, name in phrase:
        organ.add(pipe_organ(mtof(nm(name) + 12 * octave), ln * s16, stops, 0.035, 0.35, 0.22, seed=nm(name) + p), T(bar, p), gain, pan=pan)

def pedal(bar, gain, stops='pedal', r=0.6):   # the organ's pedal: the bass note held (the deep forest, the landing)
    for b0, b1, c, bs in chords_in(bar):
        bass.add(pipe_organ(mtof(bs), (b1 - b0) * b, stops, 0.08, r, 0.05, seed=bs + bar), T(bar, 4 * b0), gain)

def choir_bar(bar, gain, vowel='a', octave=0, a=0.4, r=0.8, ln=1.0):   # ln: as the organ's
    for b0, b1, c, _ in chords_in(bar):
        for j, m in enumerate(CH[c]):
            choir.add(voice_choir(mtof(m + 12 * octave), (b1 - b0) * b * (ln if b1 == 4 else 1.0), vowel, a, r, seed=m + j), T(bar, 4 * b0), gain,
                      pan=(-0.4, 0.4, -0.15, 0.15)[j])

# drum sounds, made once
KICK = peq(peq(techno_kick(), 150, -5, 0.5), 380, 2, 0.4)   # (its box taken out, its knock a little forward: the part a phone plays)
CLAP = clap(seed=3); SNR = snare(0.18, tone=210, snappy=0.85, seed=4); SNR_DRY = snare(0.12, tone=230, snappy=0.5, seed=8)
HC = [hat(0.045, seed=s, tone=7200) for s in range(4)]
HO = [hat(open_=True, seed=s + 10, tone=6800)[:int(0.21 * SR)] * np.linspace(1, 0, int(0.21 * SR)) ** 0.5 for s in range(3)]   # choked
RIDE = [ride(0.9, seed=s) for s in range(2)]; RIM = rim(seed=2); SHK = [shaker(0.07, seed=s) for s in range(4)]
CLANG = [clang(415, 0.6, seed=0), clang(311, 0.6, seed=1)]
def K(t, g=0.9, muff=None):
    drums.add(KICK if muff is None else lp(KICK, muff), t, g); kicks.append(t)

def groove(bar, kick_on=range(4), clap_on=True, hats=1.0, ohat=1.0, ride_=0.0, rims=True, clangs=0.0, shake=0.0, upto=16, muff=None):
    """tight four on the floor: the kick, the clap and a snare on 2 and 4, closed hats on the other sixteenths, open hats on the
    offbeats, quiet rimshots between (ghost notes), steel struck on the last sixteenth of beat two (its two pitches in turn)"""
    for k in kick_on:
        if 4 * k < upto: K(T(bar, 4 * k), 0.84, muff)
    for k in range(4):
        if 4 * k >= upto: break
        if clap_on and k in (1, 3): drums.add(CLAP, T(bar, 4 * k), 0.42 * hum(), pan=0.03); drums.add(SNR, T(bar, 4 * k), 0.14)
        if ohat: perc.add(HO[k % 3], T(bar, 4 * k + 2), 0.3 * ohat * hum(), pan=0.45)
        if ride_: perc.add(RIDE[k % 2], T(bar, 4 * k + 2), 0.2 * ride_, pan=0.55)
        for s, v in ((0, 0.27), (1, 0.14), (3, 0.2)):
            perc.add(HC[(3 * k + s) % 4], T(bar, 4 * k + s), hats * v * hum(0.08), pan=-0.45)
        if shake:
            for s in range(4): perc.add(SHK[s], T(bar, 4 * k + s), shake * (0.5, 0.3, 0.8, 0.4)[s] * hum(0.1), pan=-0.65)
    if rims:
        for p in ((3, 11) if bar % 2 == 0 else (6, 13)):
            if p < upto: drums.add(RIM, T(bar, p), 0.075 * hum(0.15), pan=-0.22)
    if clangs: perc.add(CLANG[bar % 2], T(bar, 7), 0.18 * clangs, pan=0.5 if bar % 2 else 0.3)

def motorik(bar, level=1.0, muff=500, snare_=True):
    """the motorik beat (krautrock): the kick on 1, 3 and the and of 3, a dry snare on 2 and 4, steady eighths on the hat"""
    for p, g in ((0, 0.7), (8, 0.7), (10, 0.5)): K(T(bar, p), g * level, muff)
    for p in (4, 12):
        if snare_: drums.add(SNR_DRY, T(bar, p), 0.13 * level, pan=0.05)
    for p in range(0, 16, 2): perc.add(HC[p // 2 % 4], T(bar, p), (0.26 if p % 4 else 0.17) * level * hum(0.06), pan=-0.3)

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=200, tone1=300):   # a roll speeding up and swelling into the next bar
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0); drums.add(snare(0.14, tone=tone0 + (tone1 - tone0) * x, seed=int(t * 100) % 97), t, g0 + (g1 - g0) * x ** 1.5, pan=0.06)
        t += b / (rate0 + (rate1 - rate0) * x)

def toms(bar, steps, notes, g=0.3):   # a tom run down the kit, tuned to the chord it falls through (left to right)
    for i, (p, nn) in enumerate(zip(steps, notes)): drums.add(tom_note(nn), T(bar, p), g, pan=0.4 - 0.8 * i / max(1, len(steps) - 1))

# ================================================================ INTRO: the globe (bars -11..-1) ================================
I0 = S.t(-11)                                                     # 0.61 s: the air starts softly here
dur_i = S.t(0) - I0
wl, wr = wind(dur_i, 1), wind(dur_i, 2); x_ = np.linspace(0, 1, len(wl))
wg = np.clip(x_ * dur_i / 2.0, 0, 1) * (0.6 + 0.4 * np.sin(np.pi * np.clip(x_ * 1.4, 0, 1))) * np.clip((1 - x_) * dur_i / 5.0, 0, 1)
atmos.add((wl * wg, wr * wg), I0, 0.32)
atmos.add(thunder(5.5, seed=3), I0 + 0.4, 0.34, pan=-0.35)          # far off over the hills
atmos.add(thunder(4.5, seed=7), S.t(-7, 2), 0.2, pan=0.45)
# the choir and the organ: a slow chord each two bars, swelling (Fm(add9) Dbmaj7 Bbm7, then the half cadence on C)
for bar, vow, g in ((-11, 'u', 0.2), (-9, 'u', 0.22), (-7, 'o', 0.24)):
    for j, m in enumerate(CH[HARM[bar][0][1]]):
        choir.add(voice_choir(mtof(m), 2 * B, vow, 1.6, 1.4, seed=m + j + bar), S.t(bar), g, pan=(-0.4, 0.4, -0.15, 0.15)[j])
for bar in range(-9, -4):
    organ_bar(bar, 0.07 + 0.012 * (bar + 9), 'flute', a=0.5, r=0.9, chiff=0.05)
choir_bar(-5, 0.24, 'o', a=0.5, r=0.6)
bass.add(pipe_organ(mtof(41), 2 * B, 'pedal', 1.5, 1.0, 0.0, seed=1), S.t(-10), 0.11)    # the pedal F, soft, under the first chord
# the sequence assembles itself: first the accents, then more steps, then all sixteen; its filter opens all through the intro
STEPS = {-10: {0, 6, 12}, -9: {0, 3, 6, 9, 12}, -8: {0, 2, 3, 6, 8, 9, 12, 14}}
for bar in range(-10, 0):
    arp_bar(bar, 0.3 + 0.02 * (bar + 10), steps=STEPS.get(bar))
# krautrock: the bass in steady eighths, then the motorik beat (muffled, the filter opening), the snare from bar -6
for bar in range(-8, -2):
    bass_bar(bar, 0.14 + 0.02 * (bar + 8), 'eighths', bright=0.25 + 0.05 * (bar + 8))
for bar in range(-7, -2):
    motorik(bar, 0.38 + 0.045 * (bar + 7), muff=380 + 120 * (bar + 7), snare_=bar >= -6)
drums.add(SNR_DRY, T(-5, 14), 0.1); drums.add(SNR_DRY, T(-5, 15), 0.14)   # a little fill into the second half of the flight
for bar in (-4, -3):                                               # the organ, a little stronger, and the hook far away on its flute stop
    organ_bar(bar, 0.11, 'principal', a=0.2, r=0.6, chiff=0.1)
    organ_line(bar, HOOK[0], 0.12, 'flute', pan=0.2)
    choir_bar(bar, 0.16, 'o', a=0.6, r=0.6)
# --- the build (bars -2, -1): four on the floor, the roll, the riser, the filter opening (works on its own from 15.5 s)
for k in range(4): K(T(-2, 4 * k), 0.42 + 0.04 * k, muff=900 + 500 * k)
for k in range(3): K(T(-1, 4 * k), 0.56, muff=4000)
for k in range(4):                                                 # offbeat hats on the 'and', a ghost on the 'a', growing
    perc.add(HC[k % 4], T(-2, 4 * k + 2), 0.12 + 0.02 * k, pan=-0.3); perc.add(HC[(k + 2) % 4], T(-2, 4 * k + 3), 0.05 + 0.01 * k, pan=-0.3)
for p in range(12): perc.add(HC[p % 4], T(-1, p), (0.14 if p % 2 else 0.1), pan=-0.3)
bass_bar(-2, 0.28, 'eighths', bright=0.5)
bass_bar(-1, 0.32, 'roll', bright=0.6, upto=12)
snare_roll(T(-2, 8), T(-1), 2, 4, 0.05, 0.11)
snare_roll(T(-1), T(-1, 14), 4, 8, 0.11, 0.3)
fx.add(riser(2 * B, f0=250, f1=9000, seed=3), S.t(-2), 0.4)
fx.add(rev_crash(1.4, seed=5), S.t(0) - 1.4, 0.24)
organ_bar(-2, 0.13, 'principal', a=0.3, r=0.3); organ_bar(-1, 0.15, 'principal', a=0.05, r=0.2, ln=0.85)
choir_bar(-2, 0.2, 'a', a=0.8, r=0.3); choir_bar(-1, 0.24, 'a', a=0.2, r=0.3, ln=0.85)
lead_bar(-1, TURN, 0.34, bright=0.8)                              # the pickup over the last two beats: the dominant's arpeggio

# ================================================================ MAIN: the lap (bars 0..15) ======================================
fx.add(boom(2.6), S.t(0), 0.42); fx.add(crash(2.8, seed=1), S.t(0), 0.3, pan=0.15)
for bar in range(16):
    sec = 'A' if bar < 4 else 'B' if bar < 8 else 'forest' if bar < 10 else 'build' if bar < 12 else 'final'
    # drums
    if sec == 'A':       groove(bar, upto=14 if bar == 3 else 16)
    elif sec == 'B':     groove(bar, hats=1.1, clangs=1.0, shake=0.12, upto=12 if bar == 7 else 16)
    elif sec == 'forest':
        for p in range(16): perc.add(HC[p % 4], T(bar, p), (0.07 if p % 2 else 0.045) * (1 + 0.5 * (bar - 8)), pan=-0.3)
    elif sec == 'build':
        if bar == 10:
            for k in range(4): K(T(10, 4 * k), 0.55 + 0.05 * k, muff=500 + 300 * k)
        else:
            for k in range(3): K(T(11, 4 * k), 0.8, muff=3000)
        for p in range(16 if bar == 10 else 12): perc.add(HC[p % 4], T(bar, p), (0.1 if p % 2 else 0.07) * (1 + 0.4 * (bar - 10)), pan=-0.3)
    else:                groove(bar, ride_=1.0, clangs=1.0, shake=0.1, upto=12 if bar == 15 else 16)
    # bass
    if sec == 'A':       bass_bar(bar, 0.5, 'roll', bright=1.0, upto=14 if bar == 3 else 16)
    elif sec == 'B':     bass_bar(bar, 0.5, 'pump', bright=1.1, upto=12 if bar == 7 else 16)
    elif sec == 'forest': pedal(bar, 0.22)
    elif sec == 'build': bass_bar(bar, 0.4 if bar == 10 else 0.46, 'eighths' if bar == 10 else 'roll', bright=0.5 + 0.3 * (bar - 10), upto=16 if bar == 10 else 12)
    else:                bass_bar(bar, 0.52, 'roll', bright=1.25, upto=12 if bar == 15 else 16)   # (the final: more bite)
    # the sequencer (a little held back in the first A; the second one joins in the final; both stop two sixteenths before the
    # landing, and the organ and the choir let go just before it: the engines cut, only the fill and the riser lead into the hit)
    arp_bar(bar, {'A': 0.5, 'forest': 0.46, 'final': 0.6}.get(sec, 0.56), PAT_B if sec == 'B' else PAT_A, upto=14 if bar == 15 else 16)
    if sec == 'final': glint_bar(bar, 0.3, upto=13 if bar == 15 else 16)
    # the organ and the choir (the organ a little held back in the first A: the final spends it, on the full plenum)
    if sec == 'A':         organ_bar(bar, 0.14, 'principal', a=0.04, r=0.35)
    elif sec == 'B':       organ_bar(bar, 0.18, 'principal', a=0.04, r=0.35)
    elif sec == 'forest':  organ_bar(bar, 0.2, 'plenum', a=0.08, r=0.8, chiff=0.2)
    elif sec == 'build':   organ_bar(bar, 0.15 + 0.03 * (bar - 10), 'principal', a=0.1, r=0.3, ln=0.85 if bar == 11 else 1.0)
    else:                  organ_bar(bar, 0.27, 'plenum', a=0.04, r=0.2 if bar == 15 else 0.35, ln=0.85 if bar == 15 else 1.0)
    if sec == 'B':         choir_bar(bar, 0.14, 'a', a=0.3, r=0.5)
    elif sec == 'forest':  choir_bar(bar, 0.26, 'o', a=0.6, r=0.8)
    elif sec == 'build':   choir_bar(bar, 0.18 + 0.06 * (bar - 10), 'a', a=0.5, r=0.3, ln=0.85 if bar == 11 else 1.0)
    elif sec == 'final':   choir_bar(bar, 0.35, 'a', a=0.15, r=0.25 if bar == 15 else 0.5, ln=0.85 if bar == 15 else 1.0)
# the tunes
for bar in range(4):      lead_bar(bar, HOOK[bar], 0.5)
for i in range(4):        lead_bar(4 + i, BMEL[i], 0.48, bright=1.1)
for i in range(2):        organ_line(8 + i, AUGM[i], 0.24, 'principal', pan=0.0)       # the hook in long notes, on the organ alone
lead_bar(10, HOOK[0], 0.36, bright=0.3)                            # the build: the hook behind a closed filter
lead_bar(11, TURN, 0.5)
for bar in range(12, 16):
    lead_bar(bar, HOOK[bar - 12], 0.52, bright=1.15)                                # (a little more bite at the climax)
    lead_bar(bar, HOOK[bar - 12], 0.22, octave=1, bright=0.7, pan=0.3, sub=0)       # a shadow an octave up
# fills every fourth bar, crashes on the phrases
drums.add(SNR, T(3, 14), 0.14); drums.add(SNR, T(3, 15), 0.2); fx.add(rev_crash(1.0, seed=2), S.t(4) - 1.0, 0.18)
fx.add(crash(2.2, seed=2), S.t(4), 0.2, pan=-0.2)
toms(7, (12, 13, 14, 15), ('G3', 'E3', 'Db3', 'Bb2'), 0.3)        # down through C7(b9): E G Bb Db
fx.add(crash(3.0, seed=3), S.t(8), 0.26, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.14)
fx.add(riser(2 * B, f0=300, f1=9000, seed=7), S.t(10), 0.36)
snare_roll(T(10, 8), T(11), 2, 4, 0.05, 0.11); snare_roll(T(11), T(11, 14), 4, 8, 0.11, 0.3)
fx.add(rev_crash(1.4, seed=9), S.t(12) - 1.4, 0.22)
fx.add(crash(2.8, seed=4), S.t(12), 0.3, pan=-0.1); fx.add(boom(2.2, seed=2), S.t(12), 0.3)
# the last bar leads into the landing: the turn, a roll, toms tumbling, a short riser, the cymbal swelling backwards
snare_roll(T(15, 12), T(15, 15), 6, 8, 0.12, 0.26)
toms(15, (12, 13, 14, 15), ('Db4', 'Bb3', 'G3', 'E3'), 0.3)       # the same chord a third higher: the last tom, E, leads into F
fx.add(riser(B, f0=600, f1=10000, seed=8), S.t(15), 0.3)
fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.26)

# ================================================================ LANDING: bar 16 = 48.2 s, the race starts ======================
K(LAND, 1.0)
fx.add(boom(2.5, seed=5), LAND, 0.5); fx.add(crash(3.0, seed=6), LAND, 0.36, pan=0.1)
for j, m in enumerate([53, 56, 60, 65, 68, 72]):                  # F minor on the full organ: F3 Ab3 C4 F4 Ab4 C5
    organ.add(pipe_organ(mtof(m), 1.2, 'plenum', 0.02, 1.2, 0.25, seed=700 + j), LAND, 0.16, pan=-0.5 + 0.2 * j)
for j, m in enumerate([60, 65, 68, 72]):
    choir.add(voice_choir(mtof(m), 1.0, 'a', 0.05, 1.3, seed=800 + j), LAND, 0.2, pan=(-0.4, 0.4, -0.15, 0.15)[j])
lead.add(robo_lead(mtof(nm('Ab5')), 1.1, mtof(nm('Bb5')), 1.0, 0.005), LAND, 0.5)   # the seventh falls to the third
lb = roll_bass(mtof(41), 2.2, 0.8, 1.0); lb *= np.exp(-np.arange(len(lb)) / SR / 0.7); bass.add(lb, LAND, 0.6)
bass.add(pipe_organ(mtof(41), 1.6, 'pedal', 0.02, 1.0, 0.0, seed=5), LAND, 0.2)  # the pedal: F2 (and its 16' an octave down)

# ================================================================ MIX =============================================================
# the rumble (Berlin): the kicks into a long dark room, only the lows kept, ducked hard by the kick so it breathes between them
rum_in = np.zeros(S.n)
for t in kicks:
    if S.t(0) - 0.01 <= t < LAND - 0.01: i = int(t * SR); m = min(len(KICK), S.n - i); rum_in[i:i + m] += KICK[:m]
rl, rr_ = reverb(rum_in, rum_in, size=1.6, decay=2.0, damp=0.85, predelay=0.0)
rum = hp1(sat(lp(lp(0.5 * (rl + rr_), 120), 120) * 4.0, 1.4), 32) * S.sidechain(kicks, depth=0.95, release=0.13)
rumble = S.bus('rumble'); rumble.L += rum * 0.15; rumble.R += rum * 0.15
# the intro sits under the main: a fader on everything before the drop, opening through the build
fader = curve([(0, 0.78), (S.t(-2), 0.78), (S.t(0) - 0.02, 0.92), (S.t(0), 1.0), (S.len, 1.0)])
for x in (drums, perc, bass, arp, arp2, lead, organ, choir, fx, atmos): x.curve(fader)
# ducking from the kick (the pads only from the build on: the soft motorik kicks of the flight do not pump the held chords)
kd = [k for k in kicks if k >= S.t(-2) - 0.01]
bass.curve(S.sidechain(kicks, depth=0.7, release=0.12)); organ.curve(S.sidechain(kd, depth=0.4, release=0.16))
choir.curve(S.sidechain(kd, depth=0.3, release=0.16)); arp.curve(S.sidechain(kicks, depth=0.25, release=0.1))
arp2.curve(S.sidechain(kicks, depth=0.2, release=0.1))
# tone: the organ and the choir leave the lows to the bass; the lead and the sequencer stay out of the mud
organ.filt(lambda x: hp1(x, 170)); choir.filt(lambda x: hp1(x, 200)); lead.filt(lambda x: hp1(x, 250))
arp.filt(lambda x: hp1(x, 150)); arp2.filt(lambda x: hp1(x, 400)); bass.filt(lambda x: hp1(x, 35)); perc.filt(lambda x: hp1(x, 300))
organ.width(1.7); choir.width(1.5)
lead.L, lead.R = chorus(0.5 * (lead.L + lead.R), depth=0.0022, rate=0.4, mix=0.28)   # a light chorus: the lead a little wider
# sends: a big dark hall (the forest, the church), a short room for the drums, echoes on the sequencer and the lead
verb_in = S.bus()
for x, a in ((organ, 0.35), (choir, 0.4), (lead, 0.22), (arp, 0.16), (arp2, 0.3), (fx, 0.25), (atmos, 0.4), (perc, 0.06)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.4, decay=3.6, damp=0.45, predelay=0.03)
vl, vr = hp1(vl, 150) * 1.5, hp1(vr, 150) * 1.5                   # (the hall's lows cut: the bass and the boom stay dry and tight)
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.5, decay=0.8, damp=0.4)
d_arp = arp.send_delay(3 * s16, 0.26, fb=0.42, damp=0.5)          # three sixteenths: the Berlin School cascade
d_lead = lead.send_delay(b * 0.75, 0.2, fb=0.33, damp=0.45)
BUSES = [drums, perc, rumble, bass, arp, arp2, lead, organ, choir, fx, atmos]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level (rms dB) in each section, and its width in the main)
    SEC = {'air': (2.0, S.t(-7)), 'kraut': (S.t(-7), S.t(-2)), 'build': (S.t(-2), S.t(0)), 'A': (S.t(0), S.t(4)), 'B': (S.t(4), S.t(8)),
           'forest': (S.t(8), S.t(10)), 'build2': (S.t(10), S.t(12)), 'final': (S.t(12), S.t(16)), 'tail': (S.t(16), S.len)}
    print('        ' + ''.join(f'{k:>8s}' for k in SEC) + '   side/mid')
    for x in BUSES + [type('v', (), {'L': vl, 'R': vr, 'name': 'verb'})]:
        row = ''
        for a, z in SEC.values():
            a, z = int(a * SR), int(z * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); row += f'{20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):8.1f}'
        a, z = int(DROP * SR), int(END * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z])
        print(f'{x.name:8s}{row}   {20 * np.log10(np.sqrt(np.mean(s ** 2)) / (np.sqrt(np.mean(m ** 2)) + 1e-9) + 1e-9):6.1f}')
if '--dump' in sys.argv:   # (a check while mixing: each bus on its own, normalised, to look at)
    import os; dd = sys.argv[sys.argv.index('--dump') + 1]; os.makedirs(dd, exist_ok=True)
    from scipy.io import wavfile
    for x in BUSES:
        y = np.stack([x.L, x.R], 1); y = y / (np.abs(y).max() + 1e-9) * 0.89; wavfile.write(f'{dd}/{x.name}.wav', SR, (y * 32767).astype(np.int16))
res = S.master(BUSES + [(vl, vr), (room_l, room_r), d_arp, d_lead], HERE + '/out/germany', lufs=-12.2, ceiling=-1.1, highs_db=1.0, lows_db=-2.0)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
