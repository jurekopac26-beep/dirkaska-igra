"""The helicopter under the intro's flight (34 s, longer than the flight: no loop): the main rotor's two blades slapping the air ~13 times a
second (each a short low thump of noise), the rotor's body tone, the turbine's faint whine, the air rushing past; a slow drift in the rate
and gusts in the level so it lives. Every sound computed here."""
import sys, json, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from synth import *

dur = 34.0; n = int(dur * SR); t = np.arange(n) / SR
rate = 12.8 * (1 + 0.015 * np.sin(TAU * 0.07 * t + 1.0) + 0.006 * np.sin(TAU * 0.31 * t))   # blade passes a second
ph = np.cumsum(rate) / SR; k = np.floor(ph); fr = ph - k
slap = np.exp(-fr / 0.055) * (1 - np.exp(-fr / 0.004))   # each blade's thump: a fast rise, a short fall
alt = 0.82 + 0.18 * (k % 2)                                # (the two blades not quite alike)
body = lp(noise(n, 5), 260, 0.25) * slap * alt * 2.6 + lp(noise(n, 6), 900, 0.1) * slap * alt * 0.35
hum = sine(rate * 0.5, n) * 0.18 + sine(rate, n) * 0.12 + sine(rate * 2, n) * 0.05   # the rotor's own tone
whine = (sine(1180 * (1 + 0.002 * np.sin(TAU * 0.9 * t)), n) * 0.012 + sine(2360, n) * 0.005) * (0.8 + 0.2 * np.sin(TAU * 0.13 * t))
air = bp(noise(n, 7), 520, 0.15) * 0.05 + hp(noise(n, 8), 3000) * 0.012
gust = 0.86 + 0.14 * np.sin(TAU * 0.05 * t + 0.5) + 0.06 * np.sin(TAU * 0.23 * t + 2.0)
mono = (sat(body * 0.9, 1.4) + hum + whine + air) * gust
fade = np.clip(t / 1.5, 0, 1) * np.clip((dur - t) / 1.5, 0, 1)
L = mono * fade; R = np.concatenate([np.zeros(int(0.0007 * SR)), mono])[:n] * fade   # (a hair of width)
peak = max(np.abs(L).max(), np.abs(R).max()); L, R = L / peak * 0.5, R / peak * 0.5
import os; os.makedirs(__file__.rsplit('/', 1)[0] + '/out', exist_ok=True)
wavfile.write(__file__.rsplit('/', 1)[0] + '/out/rotor.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16))
print(json.dumps({'len': dur, 'rms_db': round(float(20 * np.log10(np.sqrt(np.mean(L ** 2)) + 1e-9)), 1)}))
