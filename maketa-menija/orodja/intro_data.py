# Mockup only: what the menu's intro before a race needs besides its videos -> site/intro-data.js (window.INTRO) and
# site/assets/maps/heli-<track>.json:
#  - each track's top map placed on the Earth (its route's pixels against the world's metres along it: a fitted turn, scale and shift), so
#    the globe can start exactly on the last race's map as the menu shows it;
#  - the places marked in 3D over the helicopter's flight (landmarks.json), in the world's metres, and where each is along the run (the
#    height profile's ticks); a town, a lake or a peak moved onto the built-up area, the water or the top the far land shows there;
#  - the helicopter's camera every frame and the point it looks at along the run (raw/maps/heli-<track>.json from heli.mjs), compact;
#  - the country (its flag, its music) and the name of the race's summit (the label in the corner).
# Usage: python3 intro_data.py [site]
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
from geo_lib import RAW, HERE, Geo, track

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')
MAPS = os.path.join(HERE, 'raw', 'maps')
P = json.load(open(os.path.join(RAW, 'places.json')))['tracks']
LM = json.load(open(os.path.join(HERE, 'landmarks.json')))
SUMMIT = {'vrsic': 'Vršič'}   # (a mountain's name in the corner only where no trademark is near: the Colorado hill climb's mountain shows its height only)   # (a road over a mountain: its top's name; the circuits show the height only)
NO_FLIGHT = {'ljubljana'}   # (tracks to be taken out of the game before its release: no helicopter flight, the intro goes straight to the start lights)
MUSIC = {'Slovenia': 'slovenia', 'USA': 'usa', 'Finland': 'finland', 'Japan': 'japan', 'Monaco': 'monaco', 'Austria': 'austria', 'Belgium': 'belgium', 'Germany': 'germany'}

def at_s(T, pts, s):   # the road at s metres from the track's own start: x, z, y
    n = len(pts); L = T['len']; st = T['step']
    s = min(max(s, 0), (n - 1) * st) if T['open'] else s % L
    f = s / st; i = int(math.floor(f)); t = f - i
    a = pts[i % n]; b = pts[(i + 1) % n] if not T['open'] else pts[min(n - 1, i + 1)]
    return a + (b - a) * t

def fit_similarity(src, dst):   # dst ~ k R src + t (a proper turn: no mirror); returns A, B, tx, ty with dst = [[A, -B], [B, A]] src + t
    ms, md = src.mean(0), dst.mean(0); S, D = src - ms, dst - md
    a = (S[:, 0] * D[:, 0] + S[:, 1] * D[:, 1]).sum(); b = (S[:, 0] * D[:, 1] - S[:, 1] * D[:, 0]).sum(); n2 = (S ** 2).sum()
    A, B = a / n2, b / n2; t = md - np.array([A * ms[0] - B * ms[1], B * ms[0] + A * ms[1]])
    res = dst - (np.stack([A * src[:, 0] - B * src[:, 1], B * src[:, 0] + A * src[:, 1]], 1) + t)
    return float(A), float(B), float(t[0]), float(t[1]), float(np.sqrt((res ** 2).sum(1)).max())

out = {}
for tid, pl in P.items():
    T = track(tid); pts = np.array(T['pts'], dtype=np.float64); G = Geo(pl['lat0'], pl['lon0'], pl['rot']); off = pl['offset']
    rd = lambda d: at_s(T, pts, T['startS'] + d)
    run = T['raceLen'] if T['open'] else T['len']
    D = np.arange(0, run, 5.0); R = np.array([rd(d) for d in D])   # (the run every 5 m: x, z, y)
    e = {'country': pl['names']['country'], 'music': MUSIC.get(pl['names']['country']), 'summit': SUMMIT.get(tid)}
    if tid in NO_FLIGHT: e['flight'] = False
    # the top map on the Earth: its route's pixels against the run's points at the same distance along it
    tj = os.path.join(MAPS, 'top-%s.json' % tid)
    if os.path.exists(tj):
        J = json.load(open(tj)); px = np.array(J['route'], dtype=np.float64); w = np.array([rd(d)[:2] for d in J['d']])
        A, B, tx, ty, err = fit_similarity(w, px)
        e['top'] = {'fit': [round(A, 7), round(B, 7), round(tx, 2), round(ty, 2)], 'W': J['W'], 'H': J['H']}
        print(tid, 'top map fit: %.3f m a pixel, worst %.1f px' % (1 / math.hypot(A, B), err))
    # the far land (a real track: its heights; any: its land cover) for the places off the road
    fj = os.path.join(RAW, tid + '-far.json'); F = json.load(open(fj)) if os.path.exists(fj) else None
    Hg = np.array(F['h'], dtype=np.float32).reshape(F['nz'] + 1, F['nx'] + 1) if F and 'h' in F else None
    def h_at(x, z):
        if Hg is None: return None
        fi = (x - F['x0']) / F['cell']; fj2 = (z - F['z0']) / F['cell']; i = int(np.clip(math.floor(fi), 0, F['nx'] - 1)); j = int(np.clip(math.floor(fj2), 0, F['nz'] - 1)); u = fi - i; v = fj2 - j
        return float((Hg[j, i] * (1 - u) + Hg[j, i + 1] * u) * (1 - v) + (Hg[j + 1, i] * (1 - u) + Hg[j + 1, i + 1] * u) * v)
    lcp = os.path.join(RAW, tid + '-far-lc.png'); LC = np.asarray(Image.open(lcp)) if os.path.exists(lcp) else None
    def snap(kind, x, z, r):   # onto the built-up area / the water nearest (the biggest within r), or the highest point within r
        if kind == 'peak' and Hg is not None:
            best = None
            for dz in np.arange(-r, r + 1, 30.0):
                for dx in np.arange(-r, r + 1, 30.0):
                    if dx * dx + dz * dz > r * r: continue
                    h = h_at(x + dx, z + dz)
                    if h is not None and (best is None or h > best[0]): best = (h, x + dx, z + dz)
            return (best[1], best[2]) if best else (x, z)
        if kind in ('town', 'water') and LC is not None:
            la0, lo0, la1, lo1 = F['ll']; n = LC.shape[0]
            la, lo = G.to_ll(np.array(x), np.array(z)); ci = (float(lo) - lo0) / (lo1 - lo0) * n; ri = (la1 - float(la)) / (la1 - la0) * n
            mpp = (la1 - la0) * 111320 / n; rp = int(r / mpp) + 2; r0, r1 = max(0, int(ri) - rp), min(n, int(ri) + rp); c0, c1 = max(0, int(ci) - rp), min(n, int(ci) + rp)
            win = LC[r0:r1, c0:c1] == (50 if kind == 'town' else 80)
            lab, k = ndimage.label(win, structure=np.ones((3, 3)))
            if not k: return (x, z)
            sizes = ndimage.sum(win, lab, range(1, k + 1)); cents = ndimage.center_of_mass(win, lab, range(1, k + 1))
            best = None
            for s_, (cy, cx) in zip(sizes, cents):
                dd = math.hypot(cy + r0 - ri, cx + c0 - ci) * mpp
                if dd > r or s_ < (25 if kind == 'town' else 12): continue
                if best is None or s_ > best[0]: best = (s_, cy + r0, cx + c0)
            if not best: return (x, z)
            lat = la1 - best[1] / n * (la1 - la0); lon = lo0 + best[2] / n * (lo1 - lo0); xx, zz = G.to_xz(np.array(lat), np.array(lon)); return (float(xx), float(zz))
        return (x, z)
    def nearest_d(x, z): k = int(np.argmin((R[:, 0] - x) ** 2 + (R[:, 1] - z) ** 2)); return float(D[k]), math.hypot(R[k, 0] - x, R[k, 1] - z)
    marks = []
    for m in LM.get(tid, []):
        nm, sub = m['n'], m.get('sub')
        if 'd' in m: x, z, y = rd(m['d']); d = m['d']; y += 3
        elif 'auto' in m:
            if m['auto'] == 'hairpin':   # the tightest corner: the most turn within 30 m either side
                hd = np.unwrap(np.arctan2(np.gradient(R[:, 1]), np.gradient(R[:, 0]))); k = 6
                turn = np.abs(np.roll(hd, -k) - np.roll(hd, k)) if not T['open'] else np.abs(np.r_[hd[k:], [hd[-1]] * k] - np.r_[[hd[0]] * k, hd[:-k]])
                if not T['open']: turn[:k] = turn[-k:] = turn[k:-k].min() if len(turn) > 2 * k else 0
                i = int(np.argmax(turn)); x, z, y = R[i]; d = float(D[i]); y += 3
            else:   # the middle of the loop
                x, z = float(R[:, 0].mean()), float(R[:, 1].mean()); y = float(R[:, 2].mean()) + 3; d, _ = nearest_d(x, z)
        elif 'xz' in m:
            x, z = m['xz']; d, _ = nearest_d(x, z); k = int(np.argmin((R[:, 0] - x) ** 2 + (R[:, 1] - z) ** 2)); y = float(R[k, 2]) + 2
        elif 'face' in m:   # on a mountain face: from the peak towards the road where it is seen from, down to the face's height
            f = m['face']; px_, pz_ = G.to_xz(np.array(f['ll'][0]), np.array(f['ll'][1])); sx, sz = snap('peak', float(px_), float(pz_), f['r']); rx, rz, ry = rd(f['d'])
            want = f['h'] - off; x, z = sx, sz
            for q in np.linspace(0, 1, 400):
                xx, zz = sx + (rx - sx) * q, sz + (rz - sz) * q; h = h_at(xx, zz)
                if h is not None and h <= want: x, z = xx, zz; break
            y = (h_at(x, z) or want) + 5; d = f['d']
        else:
            x, z = G.to_xz(np.array(m['ll'][0]), np.array(m['ll'][1])); x, z = float(x), float(z)
            if m.get('snap'): x, z = snap(m['snap'], x, z, m.get('r', 600))
            hy = h_at(x, z); d, dist = nearest_d(x, z)
            if hy is None: k = int(np.argmin((R[:, 0] - x) ** 2 + (R[:, 1] - z) ** 2)); hy = float(R[k, 2])
            y = hy + 4
        marks.append([nm, sub, round(float(x), 1), round(float(y), 1), round(float(z), 1), int(round(d))])
        print('  ', tid, nm, 'at', int(x), int(y), int(z), 'along', int(d))
    e['marks'] = [[m[0], m[1], m[5]] for m in marks]
    out[tid] = e
    # the helicopter's flight for the menu: its camera every frame (m, the bank in radians), the point along the run, the marks in 3D
    hj = os.path.join(MAPS, 'heli-%s.json' % tid)
    if os.path.exists(hj) and tid not in NO_FLIGHT:
        H = json.load(open(hj))
        C = [[round(v, 1) for v in c[:6]] + [round(c[6], 4)] for c in H['cam']]
        o = {k: H[k] for k in ('fps', 'W', 'H', 'dur', 'n', 'go', 'fly', 'hold', 'fov')}
        # a place the flight never has in its picture (a mountain face beside the road): marked 1, the menu shows it at the picture's edge
        # as the helicopter passes it, pointing to it
        Cm = np.array([c[:7] for c in H['cam']], dtype=np.float64); Pp, Tt, ph = Cm[:, 0:3], Cm[:, 3:6], Cm[:, 6]
        fw = Tt - Pp; fw /= np.linalg.norm(fw, axis=1, keepdims=True); rt = np.cross(fw, [0.0, 1.0, 0.0]); rt /= np.linalg.norm(rt, axis=1, keepdims=True); up = np.cross(rt, fw)
        upr = up * np.cos(ph)[:, None] + rt * np.sin(ph)[:, None]; Z = -fw; X = np.cross(upr, Z); X /= np.linalg.norm(X, axis=1, keepdims=True); Y = np.cross(Z, X)
        ty = math.tan(math.radians(H['fov']) / 2); tx = ty * H['W'] / H['H']
        def seen(m):
            v = np.array(m[2:5]) - Pp; zc = -(v * Z).sum(1); xn = (v * X).sum(1) / np.maximum(zc, 1e-6) / tx; yn = (v * Y).sum(1) / np.maximum(zc, 1e-6) / ty
            return bool(((zc > 1) & (np.abs(xn) < 0.95) & (np.abs(yn) < 0.95)).any())
        side = [0 if seen(m) else 1 for m in marks]
        for m, sd in zip(marks, side):
            if sd: print('   ', tid, m[0], 'never in the picture: shown at its edge')
        o.update(len=round(H['len'], 1), cam=C, d=H['d'], marks=[[m[0], m[1], m[2], m[3], m[4], m[5]] + ([1] if sd else []) for m, sd in zip(marks, side)])
        os.makedirs(os.path.join(SITE, 'assets', 'maps'), exist_ok=True)
        json.dump(o, open(os.path.join(SITE, 'assets', 'maps', 'heli-%s.json' % tid), 'w'), separators=(',', ':'), ensure_ascii=False)
        print(tid, 'heli path', len(C), 'frames,', os.path.getsize(os.path.join(SITE, 'assets', 'maps', 'heli-%s.json' % tid)) // 1024, 'KB')

with open(os.path.join(SITE, 'intro-data.js'), 'w') as f:
    f.write('/* The intro before a race: each track\'s map placed on the Earth, its country (flag, music), its summit\'s name and the places marked over\n   the helicopter\'s flight (made by intro_data.py from landmarks.json, do not edit). */\n')
    f.write('window.INTRO = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('intro-data.js', os.path.getsize(os.path.join(SITE, 'intro-data.js')) // 1024, 'KB')
