"""Mockup only: a small synthesiser for the menu's intro music (every sound computed here: no samples, no presets, nothing recorded).
Oscillators, filters, plucked strings, drums, reverb, delay, sidechain, a limiter, and the intro's fixed structure:

    the music file:  [ intro: the globe (and the descent) ............ | DROP at 20.0 s: the helicopter's flight ......... | END 48.2 s | tail ]
    the menu starts it so the drop falls where the helicopter levels out (4.5 s into its video): the full intro starts it earlier (the globe
    lasts ~8-14 s), the short one 4.5 s before the drop. END is the race's start: the music lands there, its last chord rings out (2.5 s).

Use:  from synth import *;  S = Song(bpm=124)  ... buses ...  S.master(buses, 'out/name')  (writes out/name.wav)
"""
import numpy as np, numba as nb, os, math
from scipy.io import wavfile
from scipy.signal import fftconvolve

SR = 44100
DROP, END, TAIL = 20.0, 48.2, 2.5
LEN = END + TAIL
TAU = 2 * np.pi
rng0 = np.random.default_rng(1)

def mtof(m): return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def nm(s):   # 'A4' -> 69, 'C#3' -> 49
    s = s.strip(); o = int(s[-1]) if s[-1].isdigit() else 4; k = s[:-1] if s[-1].isdigit() else s
    k = k.replace('b', '#') if False else k
    if len(k) == 2 and k[1] == 'b': k = list(NOTE)[(NOTE[k[0]] - 1) % 12]
    return 12 * (o + 1) + NOTE[k]
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10], 'mixolydian': [0, 2, 4, 5, 7, 9, 10],
          'lydian': [0, 2, 4, 6, 7, 9, 11], 'phrygian': [0, 1, 3, 5, 7, 8, 10], 'harmonic_minor': [0, 2, 3, 5, 7, 8, 11], 'pent_major': [0, 2, 4, 7, 9],
          'pent_minor': [0, 3, 5, 7, 10], 'hirajoshi': [0, 2, 3, 7, 8], 'in': [0, 1, 5, 7, 8], 'yo': [0, 2, 5, 7, 9]}
def degree(root, scale, d):   # scale degree d (0-based, can be negative or past the octave) -> midi
    s = SCALES[scale] if isinstance(scale, str) else scale; o, i = divmod(d, len(s)); return root + 12 * o + s[i]

# ---------------------------------------------------------------- oscillators (band-limited: polyBLEP) ---------------------------------
@nb.njit(cache=True, fastmath=True)
def _blep(t, dt):
    if t < dt: t /= dt; return t + t - t * t - 1.0
    if t > 1.0 - dt: t = (t - 1.0) / dt; return t * t + t + t + 1.0
    return 0.0

@nb.njit(cache=True, fastmath=True)
def _osc(freq, kind, pw, ph0):
    n = freq.shape[0]; out = np.empty(n); ph = ph0
    for i in range(n):
        dt = freq[i] / 44100.0
        if dt > 0.49: dt = 0.49
        if kind == 0:   # saw
            v = 2.0 * ph - 1.0 - _blep(ph, dt)
        elif kind == 1:   # pulse (pw)
            v = (1.0 if ph < pw[i] else -1.0) + _blep(ph, dt) - _blep((ph - pw[i]) % 1.0, dt)
        elif kind == 2:   # sine
            v = math.sin(TAU * ph)
        else:   # triangle (from the sine's shape, soft enough not to alias much)
            v = 4.0 * abs(ph - 0.5) - 1.0
        out[i] = v; ph += dt
        if ph >= 1.0: ph -= 1.0
    return out
TAU = 2 * math.pi

def _arr(x, n):
    x = np.asarray(x, dtype=float)
    return np.full(n, float(x)) if x.ndim == 0 else x[:n] if x.shape[0] >= n else np.concatenate([x, np.full(n - x.shape[0], x[-1])])
def saw(f, n, ph=None): return _osc(_arr(f, n), 0, np.zeros(1), rng0.random() if ph is None else ph)
def pulse(f, n, pw=0.5, ph=None): return _osc(_arr(f, n), 1, _arr(pw, n), rng0.random() if ph is None else ph)
def sine(f, n, ph=0.0): return _osc(_arr(f, n), 2, np.zeros(1), ph)
def tri(f, n, ph=0.0): return _osc(_arr(f, n), 3, np.zeros(1), ph)
def noise(n, seed=None): return (np.random.default_rng(seed).random(n) * 2 - 1)

def supersaw(f, n, voices=7, detune=0.18, mix=0.75, seed=0):   # detuned saws round a centre (a classic trance chord voice)
    r = np.random.default_rng(seed); f = _arr(f, n); out = saw(f, n, r.random()) * (1 - mix)
    offs = np.linspace(-1, 1, voices) * detune * 0.06
    for o in offs: out += saw(f * (1 + o * 0.5), n, r.random()) * mix / voices * 1.6
    return out

# ---------------------------------------------------------------- filters ---------------------------------------------------------------
@nb.njit(cache=True, fastmath=True)
def _svf(x, fc, res, mode):   # Zavalishin's TPT state variable filter, cutoff per sample. mode 0 low, 1 band, 2 high, 3 notch
    n = x.shape[0]; y = np.empty(n); s1 = 0.0; s2 = 0.0; k = 2.0 - 2.0 * res
    for i in range(n):
        f = fc[i]
        if f < 10.0: f = 10.0
        if f > 20000.0: f = 20000.0
        g = math.tan(math.pi * f / 44100.0); a1 = 1.0 / (1.0 + g * (g + k))
        v3 = x[i] - s2; v1 = a1 * s1 + g * a1 * v3; v2 = s2 + g * v1
        s1 = 2.0 * v1 - s1; s2 = 2.0 * v2 - s2
        if mode == 0: y[i] = v2
        elif mode == 1: y[i] = v1
        elif mode == 2: y[i] = x[i] - k * v1 - v2
        else: y[i] = x[i] - k * v1
    return y
def lp(x, fc, res=0.1): return _svf(x, _arr(fc, len(x)), min(res, 0.98), 0)
def hp(x, fc, res=0.1): return _svf(x, _arr(fc, len(x)), min(res, 0.98), 2)
def bp(x, fc, res=0.5): return _svf(x, _arr(fc, len(x)), min(res, 0.98), 1)

@nb.njit(cache=True, fastmath=True)
def _onepole(x, a, hp_):
    n = x.shape[0]; y = np.empty(n); s = 0.0
    for i in range(n):
        s += a * (x[i] - s); y[i] = x[i] - s if hp_ else s
    return y
def lp1(x, fc): return _onepole(x, 1 - math.exp(-TAU * fc / SR), False)
def hp1(x, fc): return _onepole(x, 1 - math.exp(-TAU * fc / SR), True)

# ---------------------------------------------------------------- envelopes -------------------------------------------------------------
def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, gate=None, curve=3.0):
    """n samples; gate: seconds the key is held (default: all but the release). Exponential-ish segments."""
    g = int((gate if gate is not None else n / SR - r) * SR); g = max(1, min(g, n)); env = np.zeros(n)
    na, nd = max(1, int(a * SR)), max(1, int(d * SR)); t = np.arange(n)
    att = np.clip(t / na, 0, 1) ** 0.9
    dec = s + (1 - s) * np.exp(-curve * np.clip((t - na) / nd, 0, None))
    env = np.where(t < na, att, dec)
    if g < n:
        lvl = env[g - 1]; rr = max(1, int(r * SR)); rel = lvl * np.exp(-curve * 1.6 * (t - g) / rr)
        env = np.where(t >= g, rel, env)
    return env
def perc(n, a=0.002, decay=0.3, curve=1.0): t = np.arange(n) / SR; return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-t / max(decay, 1e-4) * curve)

# ---------------------------------------------------------------- plucked strings (Karplus-Strong) ---------------------------------------
@nb.njit(cache=True, fastmath=True)
def _ks(f, n, decay, bright, seed, pickpos):
    np.random.seed(seed); L = 44100.0 / f; N = int(L); frac = L - N
    buf = np.random.random(N + 2) * 2.0 - 1.0
    # the pick: a comb on the excitation (where along the string it was plucked), softened by the brightness
    p = int(N * pickpos)
    exc = buf.copy()
    for i in range(N + 2):
        j = i - p
        if j >= 0: exc[i] = buf[i] - buf[j]
    s = 0.0
    for i in range(N + 2):
        s += bright * (exc[i] - s); buf[i] = s
    y = np.zeros(n); ap = 0.0; last = 0.0; c = (1.0 - frac) / (1.0 + frac); idx = 0; g = decay
    for i in range(n):
        a = buf[idx % (N + 2)]; b = buf[(idx + 1) % (N + 2)]
        v = g * 0.5 * (a + b)
        o = c * v + last - c * ap; last = v; ap = o
        buf[idx % (N + 2)] = o; y[i] = o; idx += 1
        if idx >= N: idx = 0
    return y
def pluck(f, dur, decay=0.996, bright=0.5, seed=1, pick=0.13):
    n = int(dur * SR); y = _ks(float(f), n, decay, bright, seed, pick); y = hp1(y, 30.0)   # (no DC: the noise burst is not zero-mean)
    k = min(n, int(0.03 * SR)); y[n - k:] *= np.linspace(1, 0, k) ** 2; return y   # (no click where it is cut)

# ---------------------------------------------------------------- drums ---------------------------------------------------------------
def kick(dur=0.45, f0=150, f1=45, sweep=0.045, click=0.4, drive=1.4, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / sweep)
    body = sine(f, n) * np.exp(-t / (dur * 0.42))
    cl = hp(noise(n, seed), 2500) * np.exp(-t / 0.004) * click
    return np.tanh((body + cl) * drive) / np.tanh(drive)
def snare(dur=0.25, tone=190, snappy=0.7, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR
    body = (sine(tone * (1 + 0.5 * np.exp(-t / 0.01)), n) * 0.6 + sine(tone * 1.6, n) * 0.25) * np.exp(-t / 0.06)
    nz = bp(noise(n, seed), 4500, 0.2) * np.exp(-t / 0.11) * snappy + hp(noise(n, seed + 1), 7000) * np.exp(-t / 0.05) * 0.4
    return np.tanh((body + nz) * 1.3)
def clap(dur=0.3, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; nz = bp(noise(n, seed), 1500, 0.35)
    env = np.zeros(n)
    for k, o in enumerate([0, 0.011, 0.022]): env += np.exp(-np.clip(t - o, 0, None) / 0.007) * (t >= o) * (0.8 if k < 2 else 1)
    env += np.exp(-np.clip(t - 0.022, 0, None) / 0.09) * (t >= 0.022) * 0.6
    return nz * env * 1.6
def hat(dur=0.06, open_=False, seed=0, tone=8000):
    n = int((0.45 if open_ else dur) * SR); t = np.arange(n) / SR
    m = np.zeros(n)   # metallic: six square partials (the classic 808 ratios) plus noise
    for fr in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]: m += pulse(fr * 2.0, n)
    s = hp(m * 0.3 + noise(n, seed) * 0.7, tone, 0.2)
    return s * np.exp(-t / (0.16 if open_ else dur * 0.35))
def shaker(dur=0.09, seed=0): n = int(dur * SR); t = np.arange(n) / SR; return bp(noise(n, seed), 6500, 0.3) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
def tom(f=110, dur=0.4): n = int(dur * SR); t = np.arange(n) / SR; return sine(f * (1 + 0.6 * np.exp(-t / 0.03)), n) * np.exp(-t / 0.18)
def rim(dur=0.05, seed=0): n = int(dur * SR); t = np.arange(n) / SR; return (bp(noise(n, seed), 1800, 0.6) + sine(1700, n) * 0.6) * np.exp(-t / 0.012)
def crash(dur=2.5, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; m = np.zeros(n)
    for fr in [289, 401, 553, 677, 811, 1031]: m += pulse(fr * 1.7, n)
    return hp(m * 0.2 + noise(n, seed), 4500, 0.1) * np.exp(-t / (dur * 0.3)) * np.clip(t / 0.002, 0, 1)
def riser(dur, f0=200, f1=6000, seed=0):   # white noise swept up (the build before the drop)
    n = int(dur * SR); x = np.linspace(0, 1, n); fc = f0 * (f1 / f0) ** (x ** 1.5)
    return bp(noise(n, seed), fc, 0.55) * (x ** 2) * 0.9
def downlifter(dur, seed=0): n = int(dur * SR); x = np.linspace(0, 1, n); return bp(noise(n, seed), 7000 * (60 / 7000) ** x, 0.5) * (1 - x) ** 2
def impact(dur=3.0, seed=0):   # the boom on the drop
    n = int(dur * SR); t = np.arange(n) / SR
    return np.tanh(sine(55 * (1 + 2.5 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.7) * 1.6) * 0.8 + lp(noise(n, seed), 900) * np.exp(-t / 0.4) * 0.35

# ---------------------------------------------------------------- effects ------------------------------------------------------------
@nb.njit(cache=True, fastmath=True)
def _fdn(xL, xR, lens, g, damp, mod):
    n = xL.shape[0]; L = lens.shape[0]; M = 0
    for k in range(L): M = max(M, lens[k])
    bufs = np.zeros((L, M + 64)); idx = np.zeros(L, np.int64); lpst = np.zeros(L); yL = np.zeros(n); yR = np.zeros(n); o = np.zeros(L); w = np.zeros(L)
    for i in range(n):
        for k in range(L):
            j = idx[k] - lens[k] - int(mod * (1.0 + math.sin(i * (0.00011 + k * 0.000013) + k)))
            o[k] = bufs[k, j % (M + 64)]
        s = 0.0
        for k in range(L): s += o[k]
        s *= 2.0 / L
        for k in range(L):
            v = (o[k] - s) * g
            lpst[k] += damp * (v - lpst[k]); w[k] = lpst[k]
        inp = 0.5 * (xL[i] + xR[i])
        for k in range(L):
            bufs[k, idx[k] % (M + 64)] = w[k] + (xL[i] if k % 2 == 0 else xR[i]) * 0.35 + inp * 0.15
            idx[k] += 1
        yl = 0.0; yr = 0.0
        for k in range(L):
            if k % 2 == 0: yl += o[k]
            else: yr += o[k]
        yL[i] = yl / (L / 2); yR[i] = yr / (L / 2)
    return yL, yR
def reverb(L, R=None, size=1.0, decay=2.2, damp=0.35, predelay=0.012):
    """A feedback delay network (8 lines); decay: seconds to -60 dB; damp 0..1 (darker higher). Returns the wet signal only."""
    R = L if R is None else R; base = np.array([1123, 1291, 1447, 1597, 1747, 1913, 2083, 2251]) * size; lens = base.astype(np.int64)
    mean = lens.mean() / SR; g = 10 ** (-3 * mean / decay)
    pd = int(predelay * SR); xL = np.concatenate([np.zeros(pd), L])[:len(L)]; xR = np.concatenate([np.zeros(pd), R])[:len(R)]
    return _fdn(xL, xR, lens, g, 1 - damp * 0.85, 6.0)
@nb.njit(cache=True, fastmath=True)
def _delay(x, d, fb, damp, n_out):
    y = np.zeros(n_out); buf = np.zeros(d + 1); s = 0.0
    for i in range(n_out):
        xi = x[i] if i < x.shape[0] else 0.0
        o = buf[i % (d + 1)]; s += damp * (o - s)
        y[i] = o; buf[i % (d + 1)] = xi + s * fb
    return y
def delay(x, t, fb=0.35, damp=0.5): return _delay(x, max(1, int(t * SR)), fb, 1 - damp * 0.9, len(x))
def pingpong(x, t, fb=0.4, damp=0.5):   # left, then right, alternating (wet only)
    d = max(1, int(t * SR)); a = _delay(x, 2 * d, fb, 1 - damp * 0.9, len(x)); b = _delay(np.concatenate([np.zeros(d), x])[:len(x)], 2 * d, fb, 1 - damp * 0.9, len(x))
    return a, b
def chorus(x, depth=0.003, rate=0.6, mix=0.5):
    n = len(x); t = np.arange(n) / SR; out = []
    for ph in (0, np.pi / 2):
        dl = (0.012 + depth * (1 + np.sin(TAU * rate * t + ph))) * SR; idx = np.arange(n) - dl; i0 = np.floor(idx).astype(int); fr = idx - i0
        i0 = np.clip(i0, 0, n - 1); i1 = np.clip(i0 + 1, 0, n - 1); out.append(x * (1 - mix) + (x[i0] * (1 - fr) + x[i1] * fr) * mix)
    return out[0], out[1]
def sat(x, drive=1.5): return np.tanh(x * drive) / np.tanh(drive)
def bitcrush(x, bits=8, down=2): y = np.round(x * 2 ** (bits - 1)) / 2 ** (bits - 1); return np.repeat(y[::down], down)[:len(x)]

# ---------------------------------------------------------------- the song: time, buses, the master --------------------------------
class Bus:
    def __init__(self, n, name=''): self.L = np.zeros(n); self.R = np.zeros(n); self.name = name
    def add(self, sig, t, gain=1.0, pan=0.0):
        """sig: mono array (or (L, R) tuple), at t seconds, pan -1..1 (equal power)."""
        i = int(round(t * SR))
        if i >= len(self.L): return
        if isinstance(sig, tuple): a, b = sig
        else: a = b = sig
        m = min(len(a), len(self.L) - i)
        if m <= 0 or i < -len(a): return
        k = min(len(a), int(0.003 * SR))
        if k > 1:   # (every sound ends without a click)
            fo = np.linspace(1, 0, k); mono = b is a; a = a.copy(); a[-k:] *= fo
            if mono: b = a
            else: b = b.copy(); b[-k:] *= fo
        if i < 0: a, b, m, i = a[-i:], b[-i:], m + i, 0
        p = (pan + 1) * np.pi / 4; gl, gr = np.cos(p) * np.sqrt(2) * gain, np.sin(p) * np.sqrt(2) * gain
        if not isinstance(sig, tuple): gl, gr = gl, gr
        self.L[i:i + m] += a[:m] * gl; self.R[i:i + m] += b[:m] * gr
    def gain(self, g): self.L *= g; self.R *= g; return self
    def curve(self, c): self.L *= c; self.R *= c; return self   # c: per-sample gain (len n)
    def filt(self, fn): self.L = fn(self.L); self.R = fn(self.R); return self
    def send_reverb(self, amount=0.25, **kw): wl, wr = reverb(self.L, self.R, **kw); return wl * amount, wr * amount
    def send_delay(self, t, amount=0.25, fb=0.4, damp=0.5): a, b = pingpong(0.5 * (self.L + self.R), t, fb, damp); return a * amount, b * amount
    def width(self, w=1.0): m = 0.5 * (self.L + self.R); s = 0.5 * (self.L - self.R) * w; self.L, self.R = m + s, m - s; return self

class Song:
    def __init__(self, bpm, drop=DROP, end=END, tail=TAIL, sr=SR):
        self.bpm = bpm; self.beat = 60.0 / bpm; self.bar = 4 * self.beat; self.drop = drop; self.end = end; self.len = end + tail; self.n = int(self.len * SR)
        self.main_bars = (end - drop) / self.bar   # bars from the drop to the end (should be a whole number: pick the bpm for it)
    def t(self, bar, beat=0.0):   # the time of (bar, beat): bar 0 starts at the drop; negative bars are the intro
        return self.drop + bar * self.bar + beat * self.beat
    def bus(self, name=''): return Bus(self.n, name)
    def sidechain(self, kicks, depth=0.6, release=0.18, attack=0.004):
        """a gain curve that ducks after each kick time (the pumping of dance music)"""
        g = np.ones(self.n); r = int(release * 3 * SR); tt = np.arange(r) / SR; shape = 1 - depth * np.exp(-tt / release) * np.clip(tt / attack, 0, 1) ** 0.5
        for k in kicks:
            i = int(k * SR)
            if 0 <= i < self.n: m = min(r, self.n - i); g[i:i + m] = np.minimum(g[i:i + m], shape[:m])
        return g
    def master(self, buses, name, lufs=-14.0, ceiling=-1.0, fade_in=0.0, comp=True, highs_db=0.0, lows_db=0.0):
        L = np.zeros(self.n); R = np.zeros(self.n)
        for b in buses:
            if isinstance(b, tuple): L += b[0][:self.n]; R += b[1][:self.n]
            else: L += b.L; R += b.R
        L = hp1(L, 25); R = hp1(R, 25)   # (no rumble)
        if highs_db or lows_db: L, R = tilt(L, R, highs_db, lows_db)
        if comp: L, R = glue(L, R)
        # loudness (K-weighting approximated: a high shelf and a low cut) over the part that plays (from 4.5 s before the drop to the end)
        a, b = int((self.drop - 4.5) * SR), int(self.end * SR)
        kw = lambda x: hp1(x, 60) + 0.6 * hp1(x, 1500)
        ms = np.mean(kw(L[a:b]) ** 2 + kw(R[a:b]) ** 2) / 2 + 1e-12
        cur = -0.691 + 10 * np.log10(ms) + 3.0
        g = 10 ** ((lufs - cur) / 20); L *= g; R *= g
        L, R = limit(L, R, 10 ** (ceiling / 20))
        if fade_in > 0: f = np.clip(np.arange(self.n) / (fade_in * SR), 0, 1); L *= f; R *= f
        f = np.clip((self.len - np.arange(self.n) / SR) / 0.3, 0, 1); L *= f; R *= f   # (the very end silent)
        out = np.stack([L, R], 1)
        os.makedirs(os.path.dirname(name) or '.', exist_ok=True)
        wavfile.write(name + '.wav', SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
        pk = 20 * np.log10(np.max(np.abs(out)) + 1e-9)
        return {'file': name + '.wav', 'peak_db': round(float(pk), 2), 'gain_db': round(float(20 * np.log10(g)), 1), 'len': round(self.len, 2)}

@nb.njit(cache=True, fastmath=True)
def _limit(L, R, ceil, look, rel):
    n = L.shape[0]; gL = np.ones(n); env = 1.0; outL = np.zeros(n); outR = np.zeros(n)
    peak = np.zeros(n)
    for i in range(n): peak[i] = max(abs(L[i]), abs(R[i]))
    # the gain each sample needs, looking ahead (min over the next `look` samples), released slowly
    need = np.ones(n)
    for i in range(n): need[i] = ceil / peak[i] if peak[i] > ceil else 1.0
    # running minimum over the look-ahead window (simple O(n*look) on a decimated grid)
    for i in range(n - 1, -1, -1):
        m = need[i]; j = i + 1
        while j < n and j <= i + look:
            if need[j] < m: m = need[j]
            j += 8
        if m < env: env = m
        else: env += (m - env) * rel
        gL[i] = env
    # forward smoothing of the gain (no clicks)
    s = 1.0
    for i in range(n):
        if gL[i] < s: s = gL[i]
        else: s += (gL[i] - s) * rel
        outL[i] = L[i] * s; outR[i] = R[i] * s
    return outL, outR
def limit(L, R, ceil=0.89): return _limit(L, R, ceil, int(0.003 * SR), 1 - math.exp(-1 / (0.08 * SR)))
def glue(L, R, thresh=-14.0, ratio=2.0, att=0.01, rel=0.15):   # a gentle bus compressor (RMS-ish, linked)
    x = np.sqrt(lp1((L ** 2 + R ** 2) / 2, 8.0)) + 1e-9; db = 20 * np.log10(x); over = np.clip(db - thresh, 0, None); red = -over * (1 - 1 / ratio)
    g = 10 ** (lp1(red, 1 / (TAU * rel)) / 20); return L * g, R * g

# ---------------------------------------------------------------- instruments (one note -> a mono array) -------------------------------
def voice_saw_lead(f, dur, cutoff=3000, res=0.3, env_amt=2.0, glide_from=None, glide=0.06, vib=0.0, a=0.005, r=0.15):
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = np.full(n, float(f))
    if glide_from: fr = f + (glide_from - f) * np.exp(-t / glide)
    if vib: fr = fr * (1 + vib * np.sin(TAU * 5.5 * t) * np.clip((t - 0.15) / 0.3, 0, 1))
    x = saw(fr, n) * 0.6 + pulse(fr * 1.003, n, 0.45) * 0.4; e = adsr(n, a, 0.25, 0.65, r, gate=dur)
    fc = cutoff * (1 + env_amt * np.exp(-t / 0.12)); return lp(x, fc, res) * e
def voice_reed(f, dur, bright=1.0, a=0.03, r=0.12, vib=0.004):   # an accordion-like reed: two detuned pulses through a formant-ish band
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = f * (1 + vib * np.sin(TAU * 5.0 * t))
    x = pulse(fr, n, 0.32) + pulse(fr * 1.006, n, 0.3) * 0.8 + pulse(fr * 0.5, n, 0.4) * 0.35
    x = lp(x, 2600 * bright, 0.1) + bp(x, 1200, 0.5) * 0.4; return x * adsr(n, a, 0.1, 0.85, r, gate=dur) * 0.5
def voice_pad(f, dur, cutoff=1800, a=0.6, r=1.2, voices=5, seed=0):
    n = int((dur + r) * SR); x = supersaw(f, n, voices, 0.22, 0.85, seed); return lp(x, cutoff, 0.1) * adsr(n, a, 0.5, 0.85, r, gate=dur) * 0.4
def voice_bass(f, dur, cutoff=420, res=0.25, env_amt=2.5, sub=0.6, a=0.003, r=0.05, drive=1.6):
    n = int((dur + r) * SR); t = np.arange(n) / SR
    x = saw(f, n) * 0.7 + sine(f * 0.5 if sub < 0 else f, n) * abs(sub)
    fc = cutoff * (1 + env_amt * np.exp(-t / 0.07)); return sat(lp(x, fc, res), drive) * adsr(n, a, 0.15, 0.8, r, gate=dur)
def voice_sub(f, dur, a=0.004, r=0.06): n = int((dur + r) * SR); return sine(f, n) * adsr(n, a, 0.1, 0.95, r, gate=dur)
def voice_fm(f, dur, ratio=2.0, index=3.0, decay=0.8, a=0.002, r=0.3):   # FM bells, electric pianos, mallets
    n = int((dur + r) * SR); t = np.arange(n) / SR; ie = index * np.exp(-t / decay)
    mod = np.sin(TAU * f * ratio * t) * ie; return np.sin(TAU * f * t + mod) * adsr(n, a, decay, 0.3, r, gate=dur)
def voice_pluck(f, dur, decay=0.995, bright=0.5, seed=1, pick=0.13): return pluck(f, dur + 0.5, decay, bright, seed, pick)
def voice_flute(f, dur, breath=0.15, a=0.06, r=0.15, vib=0.006):   # a breathy flute (shakuhachi-ish with more breath, a pan flute)
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = f * (1 + vib * np.sin(TAU * 5.2 * t) * np.clip((t - 0.2) / 0.4, 0, 1))
    x = sine(fr, n) + 0.25 * sine(fr * 2, n) + 0.08 * sine(fr * 3, n) + bp(noise(n), fr * 1.5, 0.4) * breath * 3
    return x * adsr(n, a, 0.2, 0.8, r, gate=dur) * 0.6
def voice_strings(f, dur, a=0.25, r=0.6, bright=2400):   # a string section (ensemble saws, slow attack)
    n = int((dur + r) * SR); x = supersaw(f, n, 6, 0.12, 0.9); x = lp(x, bright, 0.05); l, rr = chorus(x, 0.002, 0.3, 0.4)
    e = adsr(n, a, 0.3, 0.9, r, gate=dur); return (l * e * 0.5, rr * e * 0.5)

def voice_hoover(f, dur, bend=-5.0, a=0.02, r=0.25, seed=0):   # the early-90s rave 'hoover': detuned pulse-width-modulated saws, a dip in pitch on the attack
    n = int((dur + r) * SR); t = np.arange(n) / SR; fr = f * 2 ** ((bend * np.exp(-t / 0.09)) / 12.0); out = np.zeros(n); rr = np.random.default_rng(seed)
    for k, dt in enumerate((-0.012, -0.005, 0.0, 0.006, 0.013)):
        out += pulse(fr * (1 + dt), n, 0.5 + 0.35 * np.sin(TAU * (0.7 + 0.13 * k) * t + rr.random() * 6), rr.random()) * 0.3 + saw(fr * 0.5 * (1 + dt), n, rr.random()) * 0.25
    l, rch = chorus(lp(out, 3200, 0.15), 0.004, 0.45, 0.5); e = adsr(n, a, 0.3, 0.85, r, gate=dur); return (l * e * 0.45, rch * e * 0.45)
def voice_brass(f, dur, a=0.03, r=0.12, bright=2600):   # a synth brass stab or swell
    n = int((dur + r) * SR); t = np.arange(n) / SR; x = saw(f, n) * 0.5 + saw(f * 1.004, n) * 0.5
    fc = 400 + bright * np.clip(t / max(a * 3, 0.02), 0, 1) * (0.7 + 0.3 * np.exp(-t / 0.3)); return lp(x, fc, 0.15) * adsr(n, a, 0.2, 0.8, r, gate=dur) * 0.55
def voice_organ(f, dur, bars=(1.0, 0.7, 0.5, 0.0, 0.35, 0.0, 0.2, 0.15), a=0.008, r=0.06, perc_=0.25):   # drawbars: 16', 8', 5 1/3', 4', 2 2/3', 2', 1 3/5', 1'
    n = int((dur + r) * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for w, h in zip(bars, (0.5, 1, 1.5, 2, 3, 4, 5, 6)):
        if w: x += w * sine(f * h, n)
    x += perc_ * sine(f * 3, n) * np.exp(-t / 0.18); return x / (sum(bars) + perc_) * adsr(n, a, 0.05, 1.0, r, gate=dur)
def voice_choir(f, dur, vowel='a', a=0.4, r=0.8, seed=0):   # 'aah'/'ooh': saws through two formant bands
    n = int((dur + r) * SR); x = supersaw(f, n, 5, 0.1, 0.8, seed); F = {'a': (800, 1150), 'o': (450, 800), 'u': (325, 700), 'e': (400, 1900), 'i': (280, 2250)}[vowel]
    y = bp(x, F[0], 0.75) + bp(x, F[1], 0.75) * 0.6 + lp(x, 300) * 0.2; l, rr = chorus(y, 0.003, 0.4, 0.5); e = adsr(n, a, 0.3, 0.9, r, gate=dur); return (l * e * 0.7, rr * e * 0.7)
def ride(dur=0.9, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; m = np.zeros(n)
    for fr in [340, 470, 620, 790, 1100]: m += pulse(fr * 2.3, n)
    return hp(m * 0.15 + noise(n, seed) * 0.4, 5500, 0.2) * np.exp(-t / 0.35) * 0.6
def cowbell(dur=0.25): n = int(dur * SR); t = np.arange(n) / SR; return bp(pulse(540, n) + pulse(800, n), 900, 0.6) * np.exp(-t / 0.07)
def tilt(L, R, highs_db=2.0, lows_db=0.0):   # a gentle master tilt: highs (from ~4 kHz) and lows (below ~120 Hz) up or down
    gh, gl = 10 ** (highs_db / 20) - 1, 10 ** (lows_db / 20) - 1
    return L + gh * hp1(L, 4000) + gl * lp1(L, 120), R + gh * hp1(R, 4000) + gl * lp1(R, 120)

def write_mp3(wav, mp3, kbps=160):
    ff = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
    os.system(f'"{ff}" -hide_banner -loglevel error -y -i "{wav}" -c:a libmp3lame -b:a {kbps}k "{mp3}"')

def analyse(path):
    """numbers to judge a mix by without ears: peak, loudness, the spectrum's balance by band, how much happens (onset density), stereo width"""
    sr, x = wavfile.read(path); x = x.astype(float) / 32768; L, R = x[:, 0], x[:, 1]; m = 0.5 * (L + R); s = 0.5 * (L - R)
    out = {'peak_db': round(20 * np.log10(np.abs(x).max() + 1e-9), 2), 'len': round(len(m) / sr, 2)}
    def band(lo, hi, a, b):
        X = np.abs(np.fft.rfft(m[a:b] * np.hanning(b - a))) ** 2; f = np.fft.rfftfreq(b - a, 1 / sr); return 10 * np.log10(X[(f >= lo) & (f < hi)].sum() + 1e-12)
    for nm_, (a, b) in {'intro': (0, int(DROP * sr)), 'main': (int(DROP * sr), int(END * sr))}.items():
        seg = m[a:b]; rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
        bands = {k: band(lo, hi, a, b) for k, (lo, hi) in {'sub<60': (20, 60), 'bass60-250': (60, 250), 'low_mid250-1k': (250, 1000), 'mid1-4k': (1000, 4000), 'high4-10k': (4000, 10000), 'air>10k': (10000, 20000)}.items()}
        top = max(bands.values()); out[nm_] = {'rms_db': round(rms, 1), 'bands_rel_db': {k: round(v - top, 1) for k, v in bands.items()},
                                               'side_to_mid_db': round(20 * np.log10(np.sqrt(np.mean(s[a:b] ** 2)) / (np.sqrt(np.mean(seg ** 2)) + 1e-9) + 1e-9), 1)}
    # loudness over time (1 s windows) to see the build, the drop, the landing
    w = sr; out['rms_per_s'] = [round(20 * np.log10(np.sqrt(np.mean(m[i:i + w] ** 2)) + 1e-9), 1) for i in range(0, len(m) - w + 1, w)]
    return out
