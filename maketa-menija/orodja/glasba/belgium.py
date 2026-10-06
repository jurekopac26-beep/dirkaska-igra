"""Belgium (the Ardennes: seven kilometres through the forest, a steep climb after the first corner, long straights, fast sweepers):
early-90s Belgian rave, new beat and techno, made fresh.
Hoover stabs (the era's detuned, pulse-width-swirling chord) carry the hook; a 303-style acid bass squelches under them through a
four-pole resonant filter that sweeps like the fast bends; a hard, punchy kick drives straight through; the orchestra hit (new beat's
trademark) marks the turns; a hoover lead sings the B part in long gliding lines; the dark forest at night (wind in the trees, rain,
an owl, thunder far off) frames the globe flight. G minor, 136.17 bpm: 16 bars from the drop to the race's start.
The hook: a stab riff on a 3+3+4+2+4 sixteenth rhythm: a repeated note, a leap (a fifth, then a sixth), a step down; reharmonised
the third time; the fourth bar climbs (Bb C D Eb F#: the harmonic minor's augmented second) to the dominant, like the road up the
hill after the first corner. Original: the melodies, the chords' voicing and every sound are written and computed here (no samples,
no quotations).

    intro (the globe)  bars -11..-1  night in the forest: wind, rain, thunder far off, a dark pad, a hoover sighing far away, an owl;
                                     an orchestra hit wakes a slow new-beat groove and an EBM sequence on a G pedal (the phrygian
                                     Ab above it), the hook's shape heard first as distant bleeps; then the hook itself behind a
                                     closed filter over a muffled four-on-the-floor; the build (the climb): a hoover gliding up an
                                     octave, the roll, the riser, the acid filter opening; the kick holds its breath for the last bar
    drop  (20.0 s)     bar 0         the groove and the hook: Gm7 Fadd9 Ebmaj9 Cm9-D7b9
    A 0-3 (the hook), B 4-7 (the hoover lead's long gliding line over Ebmaj7 Cm7 Abadd9 D7sus4-D7: the sweepers), the breath 8-9
    (back in the dark forest: no kick, the acid alone, a hoover cry, the hook's call into the echo), the build 10-11 (the climb
    again), final A 12-15 (everything: the hook doubled an octave up, the lead's descant Bb A G F# falling home over it),
    LANDING at bar 16 = 48.2 s: G minor, the orchestra hit, the crash; it rings out through the tail
"""
import sys, json, numpy as np, numba as nb
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

HERE = __file__.rsplit('/', 1)[0]
N = 16                                        # bars from the drop to the race's start
S = Song(bpm=240 * N / (END - DROP))          # 136.17 bpm
B, b = S.bar, S.beat
s16 = b / 4
assert abs(S.main_bars - N) < 1e-9 and abs(S.t(N) - END) < 1e-9   # the landing falls exactly on the race's start
LAND = S.t(N)                                 # 48.2 s: the final hit
HSW = 0.05                                    # the hats' odd sixteenths a hair late (everything else straight, as Belgian techno is)
def T(bar, p=0.0, sw=0.0):                    # time of sixteenth p of a bar (bar 0 = the drop, negative bars = the intro)
    return S.t(bar, (p + (sw if int(round(p)) % 2 else 0.0)) / 4)
def curve(points, log=False):                 # automation: [(seconds, value), ...] -> one value per sample (log: for cutoffs)
    tp, vp = zip(*points); x = np.arange(S.n) / SR
    return np.exp(np.interp(x, tp, np.log(vp))) if log else np.interp(x, tp, vp)
rng = np.random.default_rng(1990)
def hum(x=0.08): return 1 + rng.uniform(-x, x)   # a little human variation in velocity

# ================================================================ instruments (defined here: synth.py is shared) ==================
@nb.njit(cache=True, fastmath=True)
def _ladder(x, fc, k, drive):
    """a four-pole resonant lowpass (the transistor-ladder family of the 303's filter), zero-delay-feedback form: k 0..4 per sample
    (towards 4 it sings on its own); the input is driven through tanh, so the resonance growls instead of clipping"""
    n = x.shape[0]; y = np.empty(n); s1 = 0.0; s2 = 0.0; s3 = 0.0; s4 = 0.0
    for i in range(n):
        f = fc[i]
        if f < 20.0: f = 20.0
        if f > 16000.0: f = 16000.0
        g = math.tan(math.pi * f / 44100.0); G = g / (1.0 + g); kk = k[i]; h = 1.0 - G
        sig = G * G * G * h * s1 + G * G * h * s2 + G * h * s3 + h * s4
        G4 = G * G * G * G
        y4 = (G4 * x[i] + sig) / (1.0 + kk * G4)
        u = math.tanh(drive * (x[i] - kk * y4)) / drive
        v = (u - s1) * G; a1 = v + s1; s1 = a1 + v
        v = (a1 - s2) * G; a2 = v + s2; s2 = a2 + v
        v = (a2 - s3) * G; a3 = v + s3; s3 = a3 + v
        v = (a3 - s4) * G; a4 = v + s4; s4 = a4 + v
        y[i] = a4
    return y

@nb.njit(cache=True, fastmath=True)
def _glide(target, reset, coef):   # portamento: follow the target pitch smoothly, except where a note is struck fresh (reset)
    n = target.shape[0]; y = np.empty(n); s = target[0]
    for i in range(n):
        if reset[i]: s = target[i]
        s += coef * (target[i] - s); y[i] = s
    return y

@nb.njit(cache=True, fastmath=True)
def _ar(gate, ca, cr):   # an attack/release follower: the loudness of a legato line from its gate
    n = gate.shape[0]; y = np.empty(n); s = 0.0
    for i in range(n):
        g = gate[i]; s += (ca if g > s else cr) * (g - s); y[i] = s
    return y

def acid_line(events, cut, res, gain, env_amt=2.6, decay=0.16, drive=1.7, glide=0.05, sq=0.2):
    """the 303-style bass as one continuous line: events [(t, dur, midi, accent, slide)]; cut, res, gain: per-sample automation.
    A slide holds the gate and glides the pitch into the next note without retriggering the filter (the squelch's legato); an
    accent opens the filter wider and quicker and plays louder; the amplifier comes after the filter, as on the original."""
    n = S.n; semis = np.full(n, np.nan); amp = np.zeros(n); fenv = np.zeros(n); acc = np.zeros(n); reset = np.zeros(n, np.bool_)
    ev = sorted(events); prev_sl = False; e_end = 0.0
    for j, (t, dur, m, ac, sl) in enumerate(ev):
        i0 = int(round(t * SR)); nxt = ev[j + 1][0] if j + 1 < len(ev) else t + dur
        i1 = min(n, int(round((nxt if sl else t + dur) * SR))); L = i1 - i0
        if L <= 8: continue
        tt = np.arange(L) / SR; semis[i0:i1] = m
        a = np.ones(L)
        if not prev_sl: reset[i0] = True; a *= np.clip(tt / 0.003, 0, 1)
        if not sl: k = min(L, int(0.012 * SR)); a[-k:] *= np.linspace(1, 0, k)
        amp[i0:i1] = a * (1.0 + 0.3 * ac)
        e0 = e_end if prev_sl else 1.0
        fenv[i0:i1] = e0 * np.exp(-tt / (decay * (0.6 if ac else 1.0))); e_end = fenv[i1 - 1]; acc[i0:i1] = ac
        prev_sl = sl
    ok = ~np.isnan(semis); idx = np.where(ok, np.arange(n), 0); np.maximum.accumulate(idx, out=idx); semis = semis[idx]
    semis[np.isnan(semis)] = ev[0][2]                                   # (between notes the oscillator keeps its last pitch)
    amp = lp1(amp, 160.0)                                               # (an accent changing across a slide: no step, no click)
    fr = mtof(_glide(semis, reset, 1 - np.exp(-1 / (glide * SR))))
    osc = saw(fr, n) * (1 - sq) + pulse(fr, n, 0.5) * sq
    fc = np.minimum(cut * (1 + env_amt * fenv * (1 + 0.6 * acc)), 6500.0)   # (capped: squelchy, never fizzy)
    return _ladder(osc, fc, res, drive) * (1 + 0.45 * res) * amp * gain

HOOVER_DT = (-0.012, -0.005, 0.0, 0.006, 0.013)
def _hoover_osc(fr, n, rr, subw=0.25):   # voice_hoover's recipe: five detuned pulses with swirling widths, five saws an octave down
    t = np.arange(n) / SR; out = np.zeros(n)
    for k, dt in enumerate(HOOVER_DT):
        out += pulse(fr * (1 + dt), n, 0.5 + 0.35 * np.sin(TAU * (0.7 + 0.13 * k) * t + rr.random() * 6), rr.random()) * 0.3 \
             + saw(fr * 0.5 * (1 + dt), n, rr.random()) * subw
    return out

def hoover_stab(notes, dur, cut=4200.0, bite=1.2, bend=-2.0, bend_t=0.035, a=0.004, r=0.14, seed=0, subw=0.14):
    """a short hoover chord (the stab): voice_hoover's sound with a quicker scoop up into the note (so a riff keeps its pitch), a
    brighter filter on the attack (its bite), the top voice (the tune) louder than the ones under it, a little presence. (L, R)"""
    n = int((dur + r) * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed); out = np.zeros(n)
    w = [0.45, 0.6, 1.0][-len(notes):] if len(notes) <= 3 else [0.4] * (len(notes) - 3) + [0.45, 0.6, 1.0]
    for m, wi in zip(sorted(notes), w): out += wi * _hoover_osc(mtof(m) * 2 ** (bend * np.exp(-t / bend_t) / 12), n, rr, subw)
    y = lp(out, cut * (1 + bite * np.exp(-t / 0.05)), 0.15); y = y + 0.5 * bp(y, 2300, 0.35)
    l, rc = chorus(y, 0.004, 0.45, 0.35)   # (a lighter chorus than voice_hoover's: the hook must survive a mono phone speaker)
    e = adsr(n, a, 0.18, 0.7, r, gate=dur) * 0.45 / np.sqrt(sum(x * x for x in w)); return (l * e, rc * e)

def hoover_voice(semis, gate, cut=3000.0, a=0.03, r=0.4, seed=0, subw=0.25):
    """a monophonic hoover from a pitch curve (semitones, per sample) and a gate: one continuous voice (glides, climbs). (L, R)"""
    n = len(semis); rr = np.random.default_rng(seed)
    env = _ar(gate, 1 - np.exp(-1 / (a * SR)), 1 - np.exp(-1 / (r / 3 * SR)))
    l, rc = chorus(lp(_hoover_osc(mtof(semis), n, rr, subw), cut, 0.15), 0.004, 0.45, 0.35)   # (a lighter chorus: mono-safe)
    return (l * env * 0.45, rc * env * 0.45)

def hoover_line(events, cut=3000.0, glide=0.07, scoop=-3.0, scoop_t=0.05, a=0.03, r=0.4, seed=0, subw=0.25):
    """the hoover lead: events [(t, dur, midi, legato)] from its start; legato notes glide from the last pitch (portamento), the
    others are struck fresh and scoop up from below (the hoover's dip). (L, R)"""
    n = int((max(t + d for t, d, m, l in events) + r + 0.1) * SR)
    target = np.full(n, float(events[0][2])); reset = np.zeros(n, np.bool_); gate = np.zeros(n); dip = np.zeros(n)
    for j, (t, d, m, leg) in enumerate(events):
        i0 = int(t * SR); nxt_fresh = j + 1 < len(events) and not events[j + 1][3]
        i1 = int((t + d - (0.05 if nxt_fresh else 0.0)) * SR)
        target[i0:] = m; gate[i0:i1] = 1.0
        if not leg: reset[i0] = True; k = min(n - i0, int(scoop_t * 6 * SR)); dip[i0:i0 + k] += scoop * np.exp(-np.arange(k) / SR / scoop_t)
    return hoover_voice(_glide(target, reset, 1 - np.exp(-1 / (glide * SR))) + dip, gate, cut, a, r, seed, subw)

def hoover_climb(m0, m1, dur, cut0=900.0, cut1=5500.0, power=2.2, seed=0, subw=0.08):
    """one hoover note climbing from m0 to m1 (semitones) over dur, slow at first and steeper at the top (the hill); a light
    sub-octave (subw), so the build's low mids stay clear for the acid and the kick. (L, R)"""
    n = int((dur + 0.05) * SR); x = np.clip(np.arange(n) / SR / dur, 0, 1); semis = m0 + (m1 - m0) * x ** power
    gate = (np.arange(n) < int(dur * SR)).astype(float)
    l, rc = hoover_voice(semis, gate, 20000.0, a=0.25, r=0.06, seed=seed, subw=subw); fc = cut0 * (cut1 / cut0) ** x
    return (lp(l, fc, 0.2), lp(rc, fc, 0.2))

def bleep(f, dur=0.16, seed=0):
    """a bleep (the bleep-and-bass techno of the time): a sine with a little square in it, struck and gone"""
    n = int(dur * SR); t = np.arange(n) / SR
    x = sine(f, n) + 0.18 * lp(pulse(f, n, 0.5, 0.0), 3500)
    return x * np.clip(t / 0.002, 0, 1) * np.exp(-t / (dur * 0.35)) * 0.5

def rave_lead(f, dur, a=0.003, r=0.1, cut=4200.0):
    """a bright lead for the hook's octave doubling: two detuned narrow pulses and a saw, a quick filter blip"""
    n = int((dur + r) * SR); t = np.arange(n) / SR
    x = pulse(f, n, 0.3) * 0.5 + pulse(f * 1.004, n, 0.22) * 0.4 + saw(f * 0.998, n) * 0.3
    return lp(x, cut * (1 + 1.2 * np.exp(-t / 0.04)), 0.2) * adsr(n, a, 0.12, 0.6, r, gate=dur) * 0.4

def orch_hit(notes, dur=0.8, seed=0, low=1.0):
    """new beat's orchestra hit: a brass section and the strings on one short chord, a timpani and a bass drum under it, the bows'
    scrape on top, all choked together"""
    n = int(dur * SR); t = np.arange(n) / SR; rr = np.random.default_rng(seed); x = np.zeros(n); s = np.zeros(n)
    for m in notes:
        f = mtof(m); x += saw(f, n, rr.random()) + 0.8 * saw(f * 1.006, n, rr.random()) + 0.5 * pulse(f * 0.996, n, 0.3, rr.random())
        s += supersaw(f * 2, n, 5, 0.14, 0.8, seed + int(m))
    brass = lp(x, 450 + 6500 * np.exp(-t / 0.05), 0.25) / len(notes); strings = hp(lp(s, 7500), 700) / len(notes)
    root = float(mtof(min(notes)))
    while root > 110: root /= 2
    tim = sine(root * (1 + 0.25 * np.exp(-t / 0.03)), n) * np.exp(-t / 0.3) + sine(root * 1.5, n) * np.exp(-t / 0.12) * 0.3
    bd = sine(48 + 110 * np.exp(-t / 0.02), n) * np.exp(-t / 0.14)
    scrape = bp(noise(n, seed), 3200, 0.3) * np.exp(-t / 0.025)
    env = np.clip(t / 0.0015, 0, 1) * (0.3 + 0.7 * np.exp(-t / 0.1)) * np.clip((dur - t) / (dur * 0.4), 0, 1) ** 2
    return (brass * 0.6 + strings * 0.4 + (tim * 0.5 + bd * 0.4) * low + scrape * 0.35) * env

def hard_kick():
    """the kick: a sine body diving from 260 Hz to 50 Hz, a knock near 170 Hz that small speakers still play, the beater's click;
    driven a little (hard, not harsh)"""
    n = int(0.36 * SR); t = np.arange(n) / SR
    body = kick(0.36, f0=260, f1=50, sweep=0.03, click=0.0, drive=1.8)
    knock = sine(170 * (1 + 0.5 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.035)
    clk = hp(noise(n, 5), 3000, 0.3) * np.exp(-t / 0.0025)
    return sat((body + 0.5 * knock + 0.4 * clk) * np.clip((0.36 - t) / 0.06, 0, 1), 1.3)

def forest(dur, seed=0):
    """the forest at night: wind in the trees (noise through a slowly wandering band, in gusts) and the leaves' rustle above it"""
    n = int(dur * SR); t = np.arange(n) / SR
    fc = 420 * 2 ** (1.0 * np.sin(TAU * 0.045 * t + seed) + 0.5 * np.sin(TAU * 0.13 * t + 2 * seed))
    gust = 0.45 + 0.55 * np.sin(TAU * 0.07 * t + seed) ** 2
    mod = lp1(noise(n, seed + 3), 6.0); mod = np.abs(mod) / (np.std(mod) + 1e-9)
    return bp(noise(n, seed), fc, 0.7) * gust + hp(noise(n, seed + 9), 2600, 0.1) * mod * 0.12 * gust

def rain(dur, seed=0, density=70):
    """light rain on the leaves (the Ardennes' weather): random droplets, tiny bright ticks, over a soft hiss"""
    n = int(dur * SR); r = np.random.default_rng(seed); imp = np.zeros(n); k = int(dur * density)
    imp[r.integers(0, n, k)] = r.uniform(0.2, 1.0, k) * r.choice([-1.0, 1.0], k)
    return bp(imp, 3500, 0.35) * 0.6 + bp(imp, 6800, 0.3) * 0.4 + bp(noise(n, seed + 1), 5200, 0.2) * 0.035

def thunder(dur=6.0, seed=0):
    """thunder far off: a low rumble that swells and rolls away, the crack muffled by the distance"""
    n = int(dur * SR); t = np.arange(n) / SR
    env = (1 - np.exp(-t / 0.35)) * np.exp(-t / 1.5) * (0.7 + 0.3 * np.sin(TAU * 1.3 * t + 1) * np.sin(TAU * 0.6 * t))
    return (lp(noise(n, seed), 150, 0.2) * 2.5 + lp(noise(n, seed + 1), 600, 0.1) * 0.5 * np.exp(-t / 0.4)) * env

def owl(seed=0):
    """a tawny owl far off in the trees: a long hoot, a pause, then the quavering answer"""
    def hoot(dur, f0, quaver=0.0):
        n = int(dur * SR); t = np.arange(n) / SR; x = t / dur
        f = f0 * (1 + 0.06 * np.sin(np.pi * np.clip(x * 1.3, 0, 1)) - 0.08 * x ** 2)
        q = 1 + quaver * np.sin(TAU * 10.5 * t) * np.clip(x * 3 - 0.6, 0, 1)
        y = sine(f, n) + 0.12 * sine(2 * f, n) + bp(noise(n, seed), f0, 0.8) * 0.2
        return y * q * np.sin(np.pi * x) ** 1.5
    a, c = hoot(0.55, 410), hoot(1.15, 395, 0.35); gap = int(0.85 * SR)
    out = np.zeros(len(a) + gap + len(c)); out[:len(a)] += a; out[len(a) + gap:] += c; return lp(out, 1800)

def zap(dur=0.25, f0=3200, f1=180):   # the rave laser: a resonant saw diving in pitch
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / (dur * 0.25))
    return bp(saw(f, n), f * 1.5, 0.6) * np.exp(-t / (dur * 0.5)) * np.clip(t / 0.002, 0, 1)

def softclip(x, db=-6.0, P=None):
    """a gentle clipper: linear up to db under the loudest peak (P), then a smooth tanh knee. It rounds off the top few dB of the
    hoover's and the acid's spiky waveforms (the distortion it adds stays 34-44 dB under the signal), so the master's limiter need
    not duck the drums for them"""
    P = (np.abs(x).max() if P is None else P) + 1e-12; t = P * 10 ** (db / 20); a = np.abs(x)
    return np.where(a > t, np.sign(x) * (t + 0.5 * t * np.tanh((a - t) / (0.5 * t))), x)
def shave(bus, db=-6.0):   # softclip on a bus (both sides with one threshold)
    P = max(np.abs(bus.L).max(), np.abs(bus.R).max()); return bus.filt(lambda x: softclip(x, db, P))

def rev_crash(dur=1.6, seed=0):   # a cymbal played backwards (swells into the next hit)
    x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5

# ================================================================ harmony ========================================================
#             bass   pad voicing (midi)      3rd 7th  (for the acid line) — every chord moves to the next by steps
CH = {'Gm(add9)': (43, [55, 57, 58, 62], 3, 10),   # G3 A3 Bb3 D4: a dark cluster, the forest's mist
      'Ab/G':     (43, [55, 56, 60, 63], 3, 10),   # G3 Ab3 C4 Eb4 over the G pedal: the phrygian shadow (new beat's darkness)
      'Gm7':      (43, [55, 58, 62, 65], 3, 10),   # G3 Bb3 D4 F4
      'Fadd9':    (41, [55, 57, 60, 65], 4, 10),   # G3 A3 C4 F4
      'Ebmaj9':   (39, [55, 58, 62, 65], 4, 11),   # G3 Bb3 D4 F4 over Eb
      'Cm9':      (36, [55, 58, 62, 63], 3, 10),   # G3 Bb3 D4 Eb4 over C
      'D7b9':     (38, [54, 57, 60, 63], 4, 10),   # F#3 A3 C4 Eb4: the diminished seventh over D, every voice a step from Gm7
      'Ebmaj7':   (39, [55, 58, 62, 63], 4, 11),
      'Cm7':      (36, [55, 58, 60, 63], 3, 10),
      'Abadd9':   (44, [56, 58, 60, 63], 4, 11),
      'D7sus4':   (38, [55, 57, 60, 62], 5, 10),
      'D7':       (38, [54, 57, 60, 62], 4, 10),
      'Gm':       (43, [55, 58, 62, 67], 3, 10)}
A_ = {0: 'Gm7', 1: 'Fadd9', 2: 'Ebmaj9', 3: [(0, 'Cm9'), (2, 'D7b9')]}
HARM = {-11: 'Gm(add9)', -10: 'Gm(add9)', -9: 'Ab/G', -8: 'Gm(add9)', -7: 'Ab/G', -6: 'Gm(add9)', -5: 'Ab/G',
        4: 'Ebmaj7', 5: 'Cm7', 6: 'Abadd9', 7: [(0, 'D7sus4'), (2, 'D7')],
        8: 'Gm(add9)', 9: 'Ab/G', 10: 'Ebmaj7', 11: [(0, 'D7sus4'), (2, 'D7b9')], 16: 'Gm'}
for k in range(4): HARM[k - 4] = HARM[k] = HARM[k + 12] = A_[k]
def chords_in(bar):   # [(from beat, to beat, chord)]
    h = HARM[bar]
    if isinstance(h, str): return [(0, 4, h)]
    return [(h[i][0], h[i + 1][0] if i + 1 < len(h) else 4, h[i][1]) for i in range(len(h))]
def chord_at(bar, beat): return next(c for b0, b1, c in chords_in(bar) if b0 <= beat < b1)

# ================================================================ the tunes =======================================================
STABS = [  # the hook: (sixteenth, length in sixteenths, the stab chord: its top voice is the tune)
    [(0, 2, 'Bb3 D4 G4'), (3, 2, 'Bb3 D4 G4'), (6, 3, 'G4 Bb4 D5'), (10, 2, 'Eb4 G4 C5'), (12, 4, 'D4 G4 Bb4')],      # Gm7
    [(0, 2, 'C4 F4 A4'), (3, 2, 'C4 F4 A4'), (6, 3, 'A4 C5 F5'), (10, 2, 'A4 C5 Eb5'), (12, 4, 'F4 A4 D5')],          # Fadd9
    [(0, 2, 'Bb3 Eb4 G4'), (3, 2, 'Bb3 Eb4 G4'), (6, 3, 'G4 Bb4 D5'), (10, 2, 'Eb4 G4 C5'), (12, 4, 'Eb4 G4 Bb4')],   # Ebmaj9
    [(0, 2, 'Eb4 G4 Bb4'), (3, 2, 'Eb4 G4 C5'), (6, 3, 'Eb4 G4 D5'), (10, 2, 'F#4 C5 Eb5'), (12, 4, 'A4 D5 F#5')]]    # Cm9 | D7b9
LEAD_B = [  # the B part's hoover line: (bar, sixteenth, length, note, legato = glide in from the last note)
    (4, 0, 6, 'Bb4', False), (4, 6, 6, 'D5', True), (4, 12, 4, 'G5', True),        # Ebmaj7: up the hill
    (5, 0, 6, 'F5', False), (5, 6, 6, 'Eb5', True), (5, 12, 4, 'D5', True),        # Cm7: sweeping down
    (6, 0, 6, 'C5', False), (6, 6, 6, 'Eb5', True), (6, 12, 4, 'G5', True),        # Abadd9: up again
    (7, 0, 6, 'A5', False), (7, 6, 2, 'G5', True), (7, 8, 8, 'F#5', True)]         # D7sus4 -> D7: the crest, the leading tone
DESCANT = [  # the final's high line on the same hoover, one long note a bar over the hook: the third of each chord falling home
    (12, 0, 16, 'Bb5', False), (13, 0, 16, 'A5', True), (14, 0, 16, 'G5', True), (15, 0, 8, 'G5', True), (15, 8, 7, 'F#5', True)]

# the acid patterns: sixteen steps a bar; R root, O octave, H two octaves, 3 / 7 the chord's third / seventh (h: an octave up),
# 5 fifth, 4 fourth, b2 the phrygian second; '!' accent, '~' slide into the next note, '.' rest
ACID = {'nb_g':  'R! R O R | R! R 3~ R | R! R O R | R! 5 R 7',          # the intro's EBM sequence (new beat), on Gm
        'nb_ab': 'R! R O R | R! R b2~ R | R! R b2h R | R! 4 b2 R',      # ... and on Ab/G
        'A':     'R . O! R | . R 7~ O! | R . O! 5 | . 3~ 5 O!',         # the A part
        'A2':    'R . O! R | . O~ 5 O! | R . O! R | 7~ O! . 5',
        'B':     'R O~ H! O | . R 5~ O! | . R O!~ 7h | O . 3h!~ 5h',    # the sweepers: more slides, higher
        'br':    'R . O~ . | 5 . R . | O . 7~ . | 5 . O . ',             # the breath: eighths
        'br_ab': 'R . O~ . | b2 . R . | O . b2h~ . | 4 . O . ',          # ... and on Ab/G (no fifth against the Ab)
        'up':    'R R O R | R O R O! | R O 5 O! | R O! H O!'}            # the build
SYM = {'R': 0, 'O': 12, 'H': 24, '5': 7, '5h': 19, '4': 5, 'b2': 1, 'b2h': 13}
def acid_note(chord, sym):
    root, _, third, sev = CH[chord]
    if sym[0] == '3': return root + third + (12 if sym.endswith('h') else 0)
    if sym[0] == '7': return root + sev + (12 if sym.endswith('h') else 0)
    return root + SYM[sym]

# ================================================================ buses, the players =============================================
# buses: drums (kick, clap, snares, toms), perc (hats, ride, shaker), bass (the acid), sub, stabs (the hoover chords), lead (the hoover
# lines, the climbs, the bright doubling), pad, orch (orchestra hits and new beat's big snare: a long hall on both), fx (crashes,
# risers, impacts), atmos (the forest, rain, thunder, the owl), echo (the bleeps and the breath's call: into a long delay)
drums, perc, bass, sub, stabs, lead, pad, orch, fx, atmos, echo = (S.bus(x) for x in 'drums perc bass sub stabs lead pad orch fx atmos echo'.split())
kicks = []; ACID_EV = []

def acid_bar(bar, name, gate=0.55, upto=16):
    toks = [x for x in ACID[name].split() if x != '|']; assert len(toks) == 16
    for p, tok in enumerate(toks[:upto]):
        if tok == '.': continue
        sym = tok.replace('!', '').replace('~', '')
        ACID_EV.append((T(bar, p), s16 * gate, acid_note(chord_at(bar, p / 4), sym), '!' in tok, '~' in tok and p < upto - 1))

def hook_bar(bar, phrase, gain, cut=4000.0, bite=1.2, bend=-2.0, last=None, dst=None):
    """the hoover stabs of one bar of the hook (last: cut the last stab to this many sixteenths)"""
    for i, (p, ln, notes) in enumerate(phrase):
        if last is not None and i == len(phrase) - 1: ln = last
        st = hoover_stab([nm(x) for x in notes.split()], ln * s16 * 0.85, cut=cut, bite=bite, bend=bend, seed=(bar + 20) * 10 + i)
        (dst or stabs).add(st, T(bar, p), gain * hum(0.05) * (1.08 if p in (0, 6) else 1.0))

def double_bar(bar, phrase, gain):   # the hook's tune an octave up on the bright lead (a shadow in A, full in the final)
    for p, ln, notes in phrase:
        top = nm(notes.split()[-1]) + 12
        lead.add(rave_lead(mtof(top), ln * s16 * 0.7), T(bar, p), gain * hum(0.05), pan=0.12)

def offbeat_stabs(bar, gain, cut=2200.0, steps=(2, 6, 10, 14)):   # short chords on the off-beats (the drive under the lead)
    for p in steps:
        c = chord_at(bar, p / 4)
        stabs.add(hoover_stab(CH[c][1][1:], s16 * 1.1, cut=cut, bite=0.6, bend=-1.0, seed=(bar + 30) * 16 + p), T(bar, p), gain * hum(0.06))

def pad_bar(bar, gain, a=0.08, r=0.5):
    for b0, b1, c in chords_in(bar):
        for j, m in enumerate(CH[c][1]):
            pad.add(voice_pad(mtof(m), (b1 - b0) * b, cutoff=4000, a=a, r=r, voices=5, seed=m * 3 + j), S.t(bar, b0), gain, pan=[-0.6, -0.2, 0.2, 0.6][j])

def sub_bar(bar, gain=0.3, steps=(2, 6, 10, 14), ln=1.7):   # the sub on the off-beats, between the kicks (it pumps with them)
    for p in steps:
        sub.add(voice_sub(mtof(CH[chord_at(bar, p / 4)][0]), ln * s16, a=0.004, r=0.04), T(bar, p), gain)

# drum sounds, made once
KICK = hard_kick()
CLAP = clap(seed=3); SNR = snare(0.22, tone=210, snappy=0.85, seed=4)
NB_SNR = snare(0.45, tone=180, snappy=1.0, seed=8)                                   # new beat's big snare (reverb does the rest)
HO = [hat(open_=True, seed=s, tone=6500) for s in range(3)]; HC = [hat(0.045, seed=s + 10, tone=7000) for s in range(4)]
RIDE = [ride(0.9, seed=s) for s in range(2)]; SHK = [shaker(0.07, seed=s) for s in range(4)]; RIM = rim(seed=2)
def K(t, g=0.95, muff=None, sc=True):
    drums.add(KICK if muff is None else lp(KICK, muff), t, g)
    if sc: kicks.append(t)

def groove(bar, kick_on=range(4), clap_on=True, ohat=0.2, chat=0.14, rims=True, ride_=0.0, shake=0.0, kg=0.95, upto=16):
    for k in kick_on:
        if 4 * k < upto: K(S.t(bar, k), kg)
    for k in range(4):
        if clap_on and k in (1, 3) and 4 * k < upto: drums.add(CLAP, S.t(bar, k), 0.36 * hum(), pan=0.03); drums.add(SNR, S.t(bar, k), 0.13)
        if ohat and 4 * k + 2 < upto: perc.add(HO[k % 3], T(bar, 4 * k + 2, HSW), ohat * hum(), pan=0.22)
        for s, v in ((0, 0.55), (1, 0.4), (3, 0.75)):
            if chat and 4 * k + s < upto: perc.add(HC[(k + s) % 4], T(bar, 4 * k + s, HSW), chat * v * hum(0.15), pan=-0.4)
        if ride_ and 4 * k < upto: perc.add(RIDE[k % 2], S.t(bar, k), ride_ * (1.0 if k % 2 == 0 else 0.8), pan=0.35)
        for s in range(4):
            if shake and 4 * k + s < upto: perc.add(SHK[s], T(bar, 4 * k + s, HSW), shake * (0.5, 0.3, 0.9, 0.4)[s] * hum(0.15), pan=0.6)
    if rims:   # ghost notes: quiet rimshots between the beats, a different pair each bar
        for p in ((7, 13) if bar % 2 else (5, 11, 14)):
            if p < upto: drums.add(RIM, T(bar, p, HSW), 0.07 * hum(0.25), pan=-0.25)

def snare_roll(t0, t1, rate0, rate1, g0, g1, tone0=200, tone1=290):   # a roll speeding up and swelling into the next bar
    t = t0
    while t < t1 - 1e-6:
        x = (t - t0) / (t1 - t0)
        drums.add(snare(0.14, tone=tone0 + (tone1 - tone0) * x, snappy=0.9, seed=int(t * 100) % 97), t, g0 + (g1 - g0) * x ** 1.5, pan=0.05)
        t += b / (rate0 + (rate1 - rate0) * x)

def toms(bar, steps, freqs, g=0.3):   # a tom run down the kit
    for j, (p, f) in enumerate(zip(steps, freqs)): drums.add(tom(f, 0.3), T(bar, p), g, pan=0.4 - 0.8 * j / max(1, len(steps) - 1))

# ================================================================ INTRO: the globe (bars -11..-1) ================================
I0 = S.t(-11)                                                     # 0.61 s: the forest starts softly here
fl, fr_ = forest(S.len, 1), forest(S.len, 2)                      # the forest bed, automated: the intro and the breath
fg = curve([(0, 0), (I0, 0), (I0 + 2.5, 1.0), (S.t(-4), 0.85), (S.t(-2), 0.5), (S.t(0), 0.15), (S.t(0, 2), 0.0), (S.t(7, 3), 0.0),
            (S.t(8), 0.7), (S.t(9, 3), 0.5), (S.t(10, 2), 0.0), (S.len, 0.0)])
atmos.add((fl * fg, fr_ * fg), 0.0, 0.3)
rl, rr_ = rain(S.len, 5), rain(S.len, 6)
rg = curve([(0, 0), (I0, 0), (I0 + 4.0, 1.0), (S.t(-3), 0.7), (S.t(-1), 0.25), (S.t(0), 0.0), (S.t(7, 3), 0.0), (S.t(8), 0.5),
            (S.t(10), 0.0), (S.len, 0.0)])
atmos.add((rl * rg, rr_ * rg), 0.0, 0.5)
atmos.add(thunder(6.0, seed=3), S.t(-10, 2.5), 0.22, pan=-0.3)   # thunder rolling far off over the hills
atmos.add(owl(seed=1), S.t(-9, 1.0), 0.05, pan=-0.6)               # an owl in the trees
for bar in range(-11, -4):                                        # the dark pad: G pedal, the phrygian Ab above it
    pad_bar(bar, 0.1 + 0.006 * (bar + 11), a=1.2 if bar == -11 else 0.5, r=1.2)
for bar in range(-10, -5):                                        # a hoover sighing far away: the fifth, then the phrygian sixth
    st = voice_hoover(mtof(nm('Eb4' if HARM[bar] == 'Ab/G' else 'D4')), 4 * b, bend=-5.0, a=0.5, r=1.0, seed=bar + 40)
    lead.add((lp(st[0], 900), lp(st[1], 900)), S.t(bar), 0.16, pan=0.3 * (1 if bar % 2 else -1))
for bar in range(-11, -8):                                        # a low drone under the first chords
    sub.add(voice_sub(mtof(43), B * 1.0, a=0.8, r=0.8), S.t(bar), 0.025)
# --- the new-beat section (bars -8..-5): an orchestra hit wakes a slow half-time groove and the EBM sequence
orch.add(orch_hit([55, 58, 62, 67], 1.0, seed=1), S.t(-8), 0.24)
orch.add(orch_hit([55, 58, 62, 67], 0.8, seed=2), S.t(-6), 0.19)
orch.add(orch_hit([56, 60, 63, 68], 0.8, seed=3), S.t(-5, 2), 0.18)
for bar in range(-8, -4):
    x = bar + 8
    K(S.t(bar, 0), 0.36 + 0.03 * x, muff=500); K(T(bar, 7), 0.16, muff=400, sc=False)   # the kick on one (a ghost before three)
    orch.add(NB_SNR, S.t(bar, 2), 0.045 + 0.004 * x, pan=0.05)                          # the big snare on three (half time), in the hall
    if bar >= -6:
        for k in range(4): perc.add(HC[k], T(bar, 4 * k + 2, HSW), 0.07 + 0.015 * x, pan=-0.35)
    acid_bar(bar, 'nb_ab' if HARM[bar] == 'Ab/G' else 'nb_g', gate=0.5)
    # the hook before the hook: its rhythm and shape as distant bleeps an octave up, answered on the phrygian Ab
    for i, (p, ln, notes) in enumerate(STABS[0]):
        m = nm(notes.split()[-1]) + 12 + (1 if HARM[bar] == 'Ab/G' and i < 3 else 0)   # (on Ab: Ab Ab Eb C Bb)
        echo.add(bleep(mtof(m), 0.18), T(bar, p), (0.11 + 0.015 * x) * (1.1 if p in (0, 6) else 0.9), pan=0.35 if i % 2 else -0.35)
# --- the hook behind a closed filter (bars -4, -3) over a muffled four-on-the-floor
for i, bar in enumerate((-4, -3)):
    hook_bar(bar, STABS[i], 0.14 + 0.02 * i, cut=700 + 500 * i, bite=0.6)   # (the stabs grow 0.14 0.16 | 0.18 0.2 into the drop)
    for k in range(4): K(S.t(bar, k), 0.45 + 0.08 * i, muff=320 + 300 * i)
    for k in range(4): perc.add(HO[k % 3], T(bar, 4 * k + 2, HSW), 0.07 + 0.04 * i, pan=0.22)
    if i: drums.add(CLAP, S.t(bar, 1), 0.16); drums.add(CLAP, S.t(bar, 3), 0.2)
    acid_bar(bar, 'A'); pad_bar(bar, 0.11)
# --- the build (bars -2, -1): the climb. Works on its own from 15.5 s (the short intro)
# (mixed a step under the drop: on a phone speaker the drop must still be the loudest moment, not the bar before it)
hook_bar(-2, STABS[2], 0.18, cut=1800, bite=0.8)
hook_bar(-1, STABS[3], 0.2, cut=3000, bite=1.0, last=2)          # (the last stab cut short: a breath before the drop)
for k in range(4): K(S.t(-2, k), 0.66)
K(S.t(-1, 0), 0.7)                                                # (then the kick holds its breath: the roll and the riser carry the last bar)
for k in range(4): perc.add(HO[k % 3], T(-2, 4 * k + 2, HSW), 0.16, pan=0.22)
for k in range(8): perc.add(HO[k % 3], T(-1, 2 * k + 1, HSW), 0.08 + 0.016 * k, pan=0.22 - 0.06 * k)   # open hats running into the drop
snare_roll(S.t(-2), S.t(-1), 2, 4, 0.08, 0.16)
snare_roll(S.t(-1), S.t(-1, 3.5), 4, 8, 0.16, 0.3)
lead.add(hoover_climb(nm('D3'), nm('D4'), 2 * B - b / 2, seed=7), S.t(-2), 0.16)   # (ends half a beat before the drop)
fx.add(riser(2 * B, f0=300, f1=9000, seed=3), S.t(-2), 0.28)
fx.add(rev_crash(1.4, seed=5), S.t(0) - 1.4, 0.24)
acid_bar(-2, 'up'); acid_bar(-1, 'up', upto=14)
pad_bar(-2, 0.1); pad_bar(-1, 0.1)

# ================================================================ MAIN: the lap (bars 0..15) ======================================
fx.add(impact(2.5), S.t(0), 0.45); fx.add(crash(2.6, seed=1), S.t(0), 0.32, pan=0.15); fx.add(downlifter(B, seed=4), S.t(0), 0.12)
orch.add(orch_hit([55, 58, 62, 67], 0.7, seed=4, low=0.5), S.t(0), 0.22)
# A (bars 0-3): the hook
for bar in range(4):
    groove(bar, upto=12 if bar == 3 else 16)
    hook_bar(bar, STABS[bar], 0.34); double_bar(bar, STABS[bar], 0.12)
    acid_bar(bar, 'A' if bar % 2 == 0 else 'A2'); sub_bar(bar); pad_bar(bar, 0.1)
K(S.t(3, 3), 0.9)                                                                       # the fill: the last beat in sixteenths
for k in (3, 3.25, 3.5, 3.75): drums.add(SNR, S.t(3, k), 0.12 + 0.16 * (k - 3))
fx.add(zap(0.3), T(3, 14), 0.1, pan=-0.3); fx.add(rev_crash(0.9, seed=7), S.t(4) - 0.9, 0.14)
# B (bars 4-7): the hoover lead's gliding line (the sweepers); the stabs step back to the off-beats
lead.add(hoover_line([((bar - 4) * B + p * s16, ln * s16, nm(note), leg) for bar, p, ln, note, leg in LEAD_B], cut=3200, seed=3), S.t(4), 0.31)
fx.add(crash(2.2, seed=2), S.t(4), 0.2, pan=-0.2)
for bar in range(4, 8):
    groove(bar, shake=0.1, upto=8 if bar == 7 else 16)
    acid_bar(bar, 'B'); sub_bar(bar); pad_bar(bar, 0.12)
    if bar >= 6: offbeat_stabs(bar, 0.16 + 0.03 * (bar - 6))
K(S.t(7, 2), 0.9); K(S.t(7, 3), 0.9)
toms(7, range(8, 16), (220, 196, 175, 156, 139, 123, 110, 98), 0.26)                    # the fill: toms down the kit
fx.add(zap(0.35, 4000, 150), T(7, 15), 0.1, pan=0.3)
# the breath (bars 8-9): back in the dark forest, no kick: the acid alone, a hoover cry, the hook's first notes echoing
fx.add(crash(2.8, seed=3), S.t(8), 0.26, pan=0.2); fx.add(downlifter(2 * B, seed=6), S.t(8), 0.12)
orch.add(orch_hit([55, 58, 62, 67], 0.9, seed=5), S.t(8), 0.22)
for bar, notes in ((8, ['G3', 'Bb3', 'D4', 'A4']), (9, ['Ab3', 'C4', 'Eb4', 'G4'])):
    cry = [voice_hoover(mtof(nm(x)), B * 0.95, bend=-5.0, a=0.12, r=0.9, seed=bar * 7 + j) for j, x in enumerate(notes)]
    stabs.add((sum(c[0] for c in cry) * 0.5, sum(c[1] for c in cry) * 0.5), S.t(bar), 0.15)
    acid_bar(bar, 'br_ab' if HARM[bar] == 'Ab/G' else 'br', gate=0.7); pad_bar(bar, 0.12, a=0.4, r=1.0)
    groove(bar, kick_on=[], clap_on=False, ohat=0.0, chat=0.0, rims=False, shake=0.07)
    sub.add(voice_sub(mtof(CH[HARM[bar]][0]), B * 0.95, a=0.2, r=0.3), S.t(bar), 0.06)
hook_bar(8, STABS[0][:3], 0.2, cut=2600, dst=echo)                                     # the call, alone, into the delay
atmos.add(owl(seed=4), S.t(8, 2.5), 0.035, pan=0.6)
# the build (bars 10-11): the climb again
groove(10, clap_on=True, ohat=0.12, chat=0.08, rims=False, kg=0.85)
for k in (0, 1, 2, 2.5, 3): K(S.t(11, k), 0.9)
snare_roll(S.t(10, 2), S.t(11), 2, 4, 0.06, 0.14)
snare_roll(S.t(11), S.t(11, 3.5), 4, 8, 0.14, 0.34)
fx.add(riser(2 * B, f0=400, f1=9500, seed=7), S.t(10), 0.36)
fx.add(rev_crash(1.2, seed=9), S.t(12) - 1.2, 0.22); fx.add(zap(0.3), T(11, 15), 0.08, pan=0.3)
orch.add(orch_hit([55, 58, 62, 63], 0.7, seed=6), S.t(10), 0.2)
orch.add(orch_hit([55, 57, 60, 62], 0.7, seed=7), S.t(11), 0.22)
lead.add(hoover_climb(nm('D3'), nm('D4'), B + 1.5 * b, seed=9), S.t(10, 2), 0.24)   # (from beat 3 of bar 10 to half a beat before bar 12)
offbeat_stabs(10, 0.16, cut=1800); offbeat_stabs(11, 0.18, cut=2600, steps=(2, 6, 8, 9, 10, 11, 12, 13))
acid_bar(10, 'up'); acid_bar(11, 'up', upto=14)
pad_bar(10, 0.13); pad_bar(11, 0.13)
# final A (bars 12-15): everything, the hook doubled an octave up
fx.add(crash(2.6, seed=4), S.t(12), 0.3, pan=-0.1); fx.add(impact(2.0, seed=2), S.t(12), 0.25)
orch.add(orch_hit([55, 58, 62, 67], 0.7, seed=8, low=0.5), S.t(12), 0.22)
lead.add(hoover_line([((bar - 12) * B + p * s16, ln * s16, nm(note), leg) for bar, p, ln, note, leg in DESCANT], cut=2600, glide=0.12,
                     a=0.25, r=0.3, seed=11, subw=0.08), S.t(12), 0.15, pan=-0.1)
for bar in range(12, 16):
    groove(bar, ride_=0.12, shake=0.08, upto=8 if bar == 15 else 16)
    hook_bar(bar, STABS[bar - 12], 0.34, last=3 if bar == 15 else None); double_bar(bar, STABS[bar - 12], 0.17)
    acid_bar(bar, 'A' if bar % 2 == 0 else 'A2', upto=15 if bar == 15 else 16); sub_bar(bar, steps=(2, 6, 10) if bar == 15 else (2, 6, 10, 14)); pad_bar(bar, 0.11)
# the last bar leads into the landing: kicks, a roll, toms tumbling down, a riser, the cymbal swelling backwards
K(S.t(15, 2), 0.9); K(S.t(15, 3), 0.9)
snare_roll(S.t(15, 2), S.t(15, 3.75), 4, 8, 0.12, 0.3)
toms(15, (8, 10, 12, 14), (196, 165, 139, 117), 0.28)
fx.add(riser(B, f0=600, f1=10000, seed=8), S.t(15), 0.28)
fx.add(rev_crash(1.4, seed=10), LAND - 1.4, 0.26)

# ================================================================ LANDING: bar 16 = 48.2 s, the race starts ======================
K(LAND, 1.0)
fx.add(impact(2.5, seed=5), LAND, 0.4); fx.add(crash(3.0, seed=6), LAND, 0.4, pan=0.1)
orch.add(orch_hit([55, 58, 62, 67], 2.0, seed=9, low=0.6), LAND, 0.34)
land = [voice_hoover(mtof(m), 1.1, bend=-5.0, a=0.005, r=1.3, seed=60 + j) for j, m in enumerate([55, 62, 67, 70, 74, 79])]
lL, lR = sum(c[0] for c in land) * 0.42, sum(c[1] for c in land) * 0.42
lm, ls_ = (lL + lR) / 2, (lL - lR) / 2 * 0.6; lL, lR = lm + ls_, lm - ls_   # (its chorus narrowed: the tonic must survive a mono speaker)
P = max(np.abs(lL).max(), np.abs(lR).max())                                   # (six voices, ten oscillators each: their chance peaks rounded off)
stabs.add((softclip(lL, -6.0, P), softclip(lR, -6.0, P)), LAND, 0.36)
lead.add(rave_lead(mtof(nm('G6')), 0.9, r=0.8), LAND, 0.1, pan=0.12)
ACID_EV.append((LAND, 0.6, 43, False, False))
ls = voice_sub(mtof(43), 2.2, a=0.004, r=0.3); ls *= np.exp(-np.arange(len(ls)) / SR / 0.7); sub.add(ls, LAND, 0.32)
pad_bar(16, 0.1, a=0.01, r=1.4)

# ================================================================ the acid line, rendered once ===================================
acut = curve([(0, 150), (S.t(-8), 160), (S.t(-6), 220), (S.t(-4), 300), (S.t(-3), 380), (S.t(-2), 450), (S.t(-1), 800), (S.t(-1, 3.5), 2200),
              (S.t(0), 1000), (S.t(1), 850), (S.t(2), 1200), (S.t(3), 900), (S.t(3, 3), 1400),
              (S.t(4), 500), (S.t(4, 3.5), 2000), (S.t(5), 1800), (S.t(5, 3.5), 600), (S.t(6), 650), (S.t(6, 3.5), 2400), (S.t(7), 900), (S.t(7, 3.5), 3000),
              (S.t(8), 900), (S.t(8, 2), 280), (S.t(9, 2), 300), (S.t(10), 450), (S.t(11), 900), (S.t(11, 3.5), 3500),
              (S.t(12), 1000), (S.t(13), 1300), (S.t(14), 1100), (S.t(15), 1500), (S.t(15, 3.5), 3200), (S.t(16), 900), (S.len, 250)], log=True)
ares = curve([(0, 2.6), (S.t(-4), 2.8), (S.t(-1), 3.3), (S.t(0), 3.0), (S.t(4), 3.4), (S.t(8), 3.2), (S.t(11, 3.5), 3.6), (S.t(12), 3.1), (S.t(15), 3.4), (S.len, 3.0)])
again = curve([(0, 0.0), (S.t(-8), 0.25), (S.t(-5), 0.45), (S.t(-4), 0.6), (S.t(-2), 0.8), (S.t(0), 1.0), (S.t(8), 1.0), (S.t(8, 1), 0.6),
               (S.t(9, 3), 0.65), (S.t(10), 0.85), (S.t(11), 1.0), (S.len, 1.0)])
bass.add(acid_line(ACID_EV, acut, ares, again), 0.0, 0.42)

# ================================================================ MIX =============================================================
GAIN = {'drums': 0.37, 'perc': 2.8, 'bass': 1.25, 'sub': 0.7, 'stabs': 5.0, 'lead': 3.0, 'pad': 3.0, 'orch': 2.5, 'fx': 0.8, 'atmos': 1.4, 'echo': 3.0}
trim = curve([(0, 1.0), (S.t(-8), 0.88), (S.t(-3), 0.88), (S.t(-2), 1.0), (S.len, 1.0)])   # (the fader: the new-beat part sits back a little)
for x in (drums, perc, bass, sub, stabs, lead, pad, orch, fx, atmos, echo): x.gain(GAIN[x.name]); x.curve(trim)
sc = S.sidechain(kicks, depth=0.7, release=0.13)
bass.curve(S.sidechain(kicks, depth=0.45, release=0.11)); sub.curve(sc)
pad.curve(S.sidechain(kicks, depth=0.5, release=0.18))
stabs.curve(S.sidechain(kicks, depth=0.18, release=0.1))   # (light: the hook's stabs on one and four land with the kick, and a phone hears the stab, not the kick)
lead.curve(S.sidechain(kicks, depth=0.2, release=0.12))
pcut = curve([(0, 600), (S.t(-8), 900), (S.t(-4), 1300), (S.t(-2), 1800), (S.t(0) - 0.05, 2800), (S.t(8), 2800), (S.t(8, 1), 1200),
              (S.t(10), 1500), (S.t(12) - 0.05, 3400), (S.len, 3400)], log=True)
pad.L = lp(pad.L, pcut); pad.R = lp(pad.R, pcut)
pad.filt(lambda x: hp1(x, 180)); stabs.filt(lambda x: hp1(hp1(x, 220), 220)); lead.filt(lambda x: hp1(x, 200)); echo.filt(lambda x: hp1(x, 250))
bass.filt(lambda x: hp1(x, 38)); sub.filt(lambda x: lp1(x, 220)); perc.filt(lambda x: lp(hp1(x, 300), 13000, 0.0)); atmos.filt(lambda x: hp1(x, 60))
fx.filt(lambda x: lp(x, 14000, 0.0))   # (the cymbals' and hats' sizzle above 13 kHz taken off: bright, not harsh)
orch.filt(lambda x: hp1(x, 45))
pad.width(1.8); stabs.width(1.0)   # (the stabs carry the hook: kept mono-safe for one-speaker phones; the width lives in the pad and the echoes)
shave(bass, -5.0); shave(stabs, -6.0)   # (the acid's and the hoovers' spiky peaks rounded off before the master)
# sends: one big dark hall (the forest), a short room for the drums, delays on the hook, the lead and the echo
verb_in = S.bus()
for x, a in ((pad, 0.3), (stabs, 0.22), (lead, 0.3), (echo, 0.35), (orch, 0.45), (fx, 0.25), (atmos, 0.5), (perc, 0.08), (drums, 0.04)):
    verb_in.L += x.L * a; verb_in.R += x.R * a
vl, vr = reverb(verb_in.L, verb_in.R, size=1.3, decay=3.2, damp=0.45, predelay=0.025); vl, vr = vl * 1.2, vr * 1.2
room_l, room_r = reverb(drums.L * 0.12, drums.R * 0.12, size=0.45, decay=0.7, damp=0.4)
ds = stabs.send_delay(b * 0.75, 0.15, fb=0.3, damp=0.5)
dl = lead.send_delay(b * 0.75, 0.21, fb=0.35, damp=0.45)
de = echo.send_delay(b * 0.75, 0.5, fb=0.45, damp=0.4)
BUSES = [drums, perc, bass, sub, stabs, lead, pad, orch, fx, atmos, echo]
if '--stems' in sys.argv:   # (a check while mixing: each bus's level (rms dB) in each section, and its width in the main)
    SEC = {'forest': (3.0, S.t(-8)), 'newbeat': (S.t(-8), S.t(-4)), 'tease': (S.t(-4), S.t(-2)), 'build': (S.t(-2), S.t(0)), 'A': (S.t(0), S.t(4)),
           'B': (S.t(4), S.t(8)), 'breath': (S.t(8), S.t(10)), 'build2': (S.t(10), S.t(12)), 'final': (S.t(12), S.t(16)), 'tail': (S.t(16), S.len)}
    print('        ' + ''.join(f'{k:>8s}' for k in SEC) + '   side/mid   main: 4-10k  >10k')
    for x in BUSES + [type('v', (), {'L': vl, 'R': vr, 'name': 'verb'})]:
        row = ''
        for a, z in SEC.values():
            a, z = int(a * SR), int(z * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); row += f'{20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9):8.1f}'
        a, z = int(DROP * SR), int(END * SR); m = 0.5 * (x.L[a:z] + x.R[a:z]); s = 0.5 * (x.L[a:z] - x.R[a:z])
        X = np.abs(np.fft.rfft(m)) ** 2; f = np.fft.rfftfreq(len(m), 1 / SR); bnd = lambda lo, hi: 10 * np.log10(X[(f >= lo) & (f < hi)].sum() / len(m) ** 2 * 2 + 1e-12)
        print(f'{x.name:8s}{row}   {20 * np.log10(np.sqrt(np.mean(s ** 2)) / (np.sqrt(np.mean(m ** 2)) + 1e-9) + 1e-9):6.1f}      {bnd(4000, 10000):6.1f} {bnd(10000, 20000):6.1f}')
if '--dump' in sys.argv:   # (a check while mixing: each bus on its own, normalised, to look at)
    import os; dd = sys.argv[sys.argv.index('--dump') + 1]; os.makedirs(dd, exist_ok=True)
    from scipy.io import wavfile
    for x in BUSES:
        y = np.stack([x.L, x.R], 1); y = y / (np.abs(y).max() + 1e-9) * 0.89; wavfile.write(f'{dd}/{x.name}.wav', SR, (y * 32767).astype(np.int16))
res = S.master(BUSES + [(vl, vr), (room_l, room_r), ds, dl, de], HERE + '/out/belgium', lufs=-12.2, ceiling=-1.1, comp=False, highs_db=1.0, lows_db=-1.0)   # (no glue: the drop and the landing keep their lift)
print(json.dumps(res)); print(json.dumps(analyse(res['file'])))
