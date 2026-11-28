"""Mockup only: what the intro music of the eight newer countries shares (Ireland, Switzerland, Turkey, Kenya, Spain, Denmark, Mexico,
Tanzania): the song's clock (N bars from the drop to the race's start), chords on pads, a breath line (one blown, bowed or sung line with
slurs, ornaments and vibrato, in any timbre), note-by-note players, the wind, the boom on the drop and the landing, the mix and the files.
Every sound is computed (synth.py): no samples, no presets, nothing recorded, no quotations.
Use:  from folk import *;  P = Piece(N=16, seed=3)  ...  P.finish(buses, sends, 'ireland')  (writes out/ireland.wav, assets/music/ireland.mp3)"""
import sys, os, json, shutil, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth import *

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
PANS = {3: (-0.5, 0.0, 0.5), 4: (-0.7, -0.25, 0.25, 0.7), 5: (-0.8, -0.4, 0.0, 0.4, 0.8), 6: (-0.85, -0.5, -0.17, 0.17, 0.5, 0.85)}

class Piece:
    def __init__(self, N, seed=0):
        self.N = N; self.S = Song(bpm=240 * N / (END - DROP)); self.b = self.S.beat; self.B = self.S.bar; self.LAND = 4 * N
        assert abs(self.S.main_bars - N) < 1e-9 and abs(self.T(self.LAND) - END) < 1e-9
        self.rng = np.random.default_rng(seed); self.kicks = []
    def T(self, beat): return self.S.drop + beat * self.b              # beat 0 is the drop; negative beats are the globe
    def hum(self, x=0.08): return 1 + self.rng.uniform(-x, x)
    def jit(self, s=0.004): return float(self.rng.normal(0, s))
    def curve(self, pts): tp, vp = zip(*pts); return np.interp(np.arange(self.S.n) / SR, tp, vp)
    def buses(self, names): return {k: self.S.bus(k) for k in names.split()}
    def kick(self, bus, x, beat, g=0.5): bus.add(x, self.T(beat), g); self.kicks.append(self.T(beat))

    # ---------------------------------------------------------------- harmony
    def chords(self, CH, CHORDS): self.CH, self.CHORDS = CH, CHORDS
    def chord_at(self, beat): return next(c for s, e, c in self.CHORDS if s <= beat < e)
    def check(self, *lines):   # no held note (a beat or longer) a half step above a tone of the chord under it
        for notes in lines:
            for nt in notes:
                c = self.chord_at(nt[0]); pcs = {self.CH[c][0] % 12} | {m % 12 for m in self.CH[c][1]}
                assert nt[1] < 1.0 or all((nt[2] - p) % 12 != 1 for p in pcs), (nt, c)
    def pads(self, bus, b0, b1, gain, cutoff=2400, a=0.5, r=1.0, voice=None, seed=0):
        for s, e, c in self.CHORDS:
            s0, e0 = max(s, b0), min(e, b1)
            if s0 >= e0: continue
            vs = self.CH[c][1]
            for j, m in enumerate(vs):
                x = voice(mtof(m), (e0 - s0) * self.b + 0.03, j) if voice else voice_pad(mtof(m), (e0 - s0) * self.b + 0.03, cutoff=cutoff, a=a, r=r, voices=5, seed=seed + m + 5 * j)
                bus.add(x, self.T(s0), gain, pan=PANS[len(vs)][j])

    # ---------------------------------------------------------------- players
    def play(self, bus, notes, fn, g=0.2, pan=0.0, up=0, seed=0):
        """notes (beat, beats, midi[, velocity]); fn(freq, seconds, seed) -> a mono array or an (L, R) tuple"""
        for i, nt in enumerate(notes):
            bt, ln, m = nt[:3]; v = nt[3] if len(nt) > 3 else 1.0
            bus.add(fn(mtof(m + up), ln * self.b, seed + i), self.T(bt) + self.jit(), g * v * self.hum(0.06), pan=pan)
    def breath(self, notes, timbre, seed=0, vib=0.3, vib_rate=5.5, tail=0.5):
        """one breath (or bow) line: notes (beat, beats, midi, how[, velocity]); how: 't' tongued, 's' slurred from the note before,
        'o' a turn (the step above, the note, the step below), 'c' a cut (a flick from a third above: the whistle's and the fiddle's
        grace), 'g' glided up from a step below, 'f' a fall off the note's end. timbre(freq, amp, n, seed) -> mono. Returns (start, mono)."""
        T = self.T; b = self.b; t0 = T(notes[0][0]) - 0.1; t1 = T(notes[-1][0] + notes[-1][1]) + tail; n = int((t1 - t0) * SR)
        r = np.random.default_rng(seed); idx = lambda bt: int(round((T(bt) - t0) * SR))
        pitch = np.full(n, float(notes[0][2])); amp = np.zeros(n); vd = np.zeros(n)
        for i, nt in enumerate(notes):
            bt, ln, m, how = nt[:4]; vel = nt[4] if len(nt) > 4 else 1.0
            a = idx(bt); e = min(n, idx(bt + ln)); pitch[a:] = m
            if how == 's' and i:
                m0 = notes[i - 1][2]; k = int(0.04 * SR); seg = pitch[a:a + k]; pitch[a:a + k] = m0 + (m - m0) * (0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, len(seg))))
            if how == 'o': k = int(0.035 * SR); pitch[a:a + k] = m + 2; pitch[a + k:a + 2 * k] = m; pitch[a + 2 * k:a + 3 * k] = m - 1
            if how == 'c': k = int(0.028 * SR); pitch[a:a + k] = m + 3
            if how == 'g': k = int(0.07 * SR); seg = pitch[a:a + k]; pitch[a:a + k] = (m - 2) + 2 * np.linspace(0, 1, len(seg)) ** 1.5
            if how == 'f': k = min(e - a, int(0.18 * SR)); pitch[e - k:e] = m - 3 * np.linspace(0, 1, k) ** 2
            att = int((0.008 if how in 'toc' else 0.03) * SR)
            seg = np.ones(max(1, e - a)); seg[:att] = np.linspace(0.3 if how == 's' else 0.0, 1.0, len(seg[:att]))
            if how == 'f': seg[-int(0.18 * SR):] *= np.linspace(1, 0, len(seg[-int(0.18 * SR):]))
            elif i + 1 < len(notes) and notes[i + 1][3] != 's': g = int(0.025 * SR); seg[-g:] *= np.linspace(1, 0.3, len(seg[-g:]))
            amp[a:e] = np.maximum(amp[a:e], seg[:e - a] * vel)
            if ln * b > 0.3:
                v0 = a + int(0.14 * SR)
                if v0 < e: vd[v0:e] = vib * np.clip(np.arange(e - v0) / SR / 0.25, 0, 1)
        el = idx(notes[-1][0] + notes[-1][1]); amp[el:] = amp[el - 1] * np.exp(-np.arange(n - el) / SR / 0.08)
        amp = lp1(np.concatenate([np.zeros(64), amp]), 90.0)[64:]
        f = mtof(pitch + vd * np.sin(np.cumsum(TAU * vib_rate / SR * np.ones(n)) + r.random() * 6))
        return t0, timbre(f, amp, n, seed)

    # ---------------------------------------------------------------- the mix and the files
    def finish(self, buses, sends, name, delays=(), duck=None, lufs=-12.0, highs_db=1.0, lows_db=0.0, size=1.2, decay=2.4):
        """buses {name: Bus}; sends {name: reverb amount}; delays [(bus, beats, amount, feedback)]; duck {name: (depth, release)} (the kick's pump)"""
        for k, (d, rel) in (duck or {}).items(): buses[k].curve(self.S.sidechain(self.kicks, depth=d, release=rel))
        if '--buses' in sys.argv:   # each bus's level (dB) and its share in the bands, to balance the mix
            for k, bu in buses.items():
                m = bu.L + bu.R; r = lambda x: 10 * np.log10(np.mean(x ** 2) + 1e-12)
                print(k, round(r(m), 1), 'lo', round(r(lp(m, 250)), 1), 'lmid', round(r(bp(m, 500, 0.7)), 1), 'mid', round(r(bp(m, 2000, 0.7)), 1), 'hi', round(r(hp(m, 4000)), 1))
        vin = self.S.bus()
        for k, a in sends.items(): vin.L += buses[k].L * a; vin.R += buses[k].R * a
        vl, vr = reverb(vin.L, vin.R, size=size, decay=decay, damp=0.35, predelay=0.02)
        extra = [(vl, vr)] + [buses[k].send_delay(bt * self.b, a, fb=fb, damp=0.5) for k, bt, a, fb in delays]
        res = self.S.master(list(buses.values()) + extra, os.path.join(HERE, 'out', name), lufs=lufs, ceiling=-1.1, highs_db=highs_db, lows_db=lows_db)
        ff = shutil.which('ffmpeg') or '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
        mp3 = os.path.join(ROOT, 'assets', 'music', name + '.mp3')
        os.system(f'"{ff}" -hide_banner -loglevel error -y -i "{res["file"]}" -c:a libmp3lame -b:a 160k "{mp3}"')
        an = analyse(res['file'])
        print(json.dumps({'mp3': os.path.relpath(mp3, ROOT), 'bpm': round(self.S.bpm, 2), 'peak_db': res['peak_db'], 'gain_db': res['gain_db'],
                          'intro_rms': an['intro']['rms_db'], 'main_rms': an['main']['rms_db'], 'main_bands': an['main']['bands_rel_db'], 'width': an['main']['side_to_mid_db']}))
        if '--spectro' in sys.argv:
            from spectro import spectro; spectro(res['file'], os.path.join(HERE, 'out', name + '.png'))

# ---------------------------------------------------------------- shared sounds
def wind(dur, seed=0, base=600, depth=1.1):   # the air over the land under the globe: two bands of noise drifting
    n = int(dur * SR); t = np.arange(n) / SR; out = []
    for k in range(2):
        fc = base * 2 ** (depth * np.sin(TAU * t / (10.0 + 2.5 * k) + 1.1 * k) + 0.35 * np.sin(TAU * t / 3.3 + k))
        out.append(bp(noise(n, seed + k), fc, 0.7) * (0.65 + 0.35 * np.sin(TAU * t / 6.1 + 2 * k)))
    return tuple(out)
def boom(f0, dur=3.0, seed=0):   # the boom on the drop and on the landing, tuned to the key's root (f0 Hz, round 40-80)
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.tanh(sine(f0 * (1 + 1.7 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.6) * 1.8) * 0.6 + sine(f0 / 2, n) * np.exp(-t / 0.5) * np.clip(t / 0.008, 0, 1) * 0.3
    return x + lp(noise(n, seed), 1000) * np.exp(-t / 0.3) * 0.3
def rev_cymbal(dur, seed=0): x = crash(dur * 2, seed)[:int(dur * SR)][::-1].copy(); return x * np.linspace(0, 1, len(x)) ** 1.5
def frame_drum(f=70, dur=0.35, seed=0, slap=0.0, damp=1.0):   # a skin over a wooden frame (struck with a stick or the hand): a low thud, the skin's ring
    n = int(dur * SR); t = np.arange(n) / SR
    body = sine(f * (1 + 0.35 * np.exp(-t / 0.015)), n) * np.exp(-t / (0.12 * damp)) + sine(f * 2.3, n) * np.exp(-t / (0.05 * damp)) * 0.25
    skin = bp(noise(n, seed), 900 + 1600 * slap, 0.4) * np.exp(-t / (0.012 + 0.01 * slap)) * (0.5 + slap)
    return sat(body + skin, 1.3)
def strum(bus, P, beat, midis, fn, g=0.12, spread=0.012, down=True, pan=0.0, seed=0):   # a strum: the strings one after another
    ms = midis if down else midis[::-1]
    for j, m in enumerate(ms): bus.add(fn(mtof(m), seed + j), P.T(beat) + j * spread + P.jit(0.002), g * P.hum(0.08), pan=pan + 0.12 * (j - len(ms) / 2) / len(ms))
