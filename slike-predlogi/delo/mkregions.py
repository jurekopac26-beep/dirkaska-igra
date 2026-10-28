# all the user's region marks as 0.5 m masks (run-length rows) for fix16-page.js
import json, math
import numpy as np
SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/'
FM = json.load(open(SP + 'frame-marks.json')); GW = json.load(open(SP + 'green-world.json')); M2 = json.load(open(SP + 'map2-marks.json')); M3 = json.load(open(SP + 'map3-marks.json'))
S = 0.5
def poly_mask(P, pad=1.0):
    xs = [p[0] for p in P]; zs = [p[1] for p in P]; x0, z0 = min(xs) - pad, min(zs) - pad; x1, z1 = max(xs) + pad, max(zs) + pad
    w, h = int(math.ceil((x1 - x0) / S)) + 1, int(math.ceil((z1 - z0) / S)) + 1; M = np.zeros((h, w), np.uint8)
    for j in range(h):
        z = z0 + j * S
        for i in range(w):
            x = x0 + i * S; c = False
            for k in range(len(P)):
                (xi, zi), (xj, zj) = P[k], P[k - 1]
                if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi: c = not c
            M[j, i] = c
    return x0, z0, M
def pts_mask(pts, dil=0.75, pad=2.0):
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]; x0, z0 = min(xs) - pad, min(zs) - pad; x1, z1 = max(xs) + pad, max(zs) + pad
    w, h = int(math.ceil((x1 - x0) / S)) + 1, int(math.ceil((z1 - z0) / S)) + 1; M = np.zeros((h, w), np.uint8); r = int(math.ceil(dil / S))
    for x, z in pts:
        i, j = int(round((x - x0) / S)), int(round((z - z0) / S)); M[max(0, j - r):j + r + 1, max(0, i - r):i + r + 1] = 1
    # fill holes (cells not reachable from the border)
    from collections import deque
    out = np.zeros_like(M); q = deque([(0, 0)]); out[0, 0] = 1
    while q:
        j, i = q.popleft()
        for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            jj, ii = j + dj, i + di
            if 0 <= jj < M.shape[0] and 0 <= ii < M.shape[1] and not out[jj, ii] and not M[jj, ii]: out[jj, ii] = 1; q.append((jj, ii))
    return x0, z0, (1 - out).astype(np.uint8)
def close_mask(pts, dil=0.6, C=2.0, pad=4.0):
    # the stroke (and any inside points) as cells, closed by C (dilate, fill holes, erode): an outline with small gaps still gives its inside
    from collections import deque
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]; x0, z0 = min(xs) - pad - C, min(zs) - pad - C; x1, z1 = max(xs) + pad + C, max(zs) + pad + C
    w, h = int(math.ceil((x1 - x0) / S)) + 1, int(math.ceil((z1 - z0) / S)) + 1; M = np.zeros((h, w), bool); r = int(math.ceil(dil / S))
    for x, z in pts:
        i, j = int(round((x - x0) / S)), int(round((z - z0) / S)); M[max(0, j - r):j + r + 1, max(0, i - r):i + r + 1] = True
    def disk(R):
        k = int(math.ceil(R / S)); yy, xx = np.mgrid[-k:k + 1, -k:k + 1]; return [(dy, dx) for dy, dx in zip(yy.ravel(), xx.ravel()) if dy * dy + dx * dx <= k * k]
    def dil_(A, R):
        B = A.copy()
        for dy, dx in disk(R):
            B[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] |= A[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
        return B
    def ero_(A, R): return ~dil_(~A, R)
    D = dil_(M, C)
    out = np.zeros_like(D); q = deque([(0, 0)]); out[0, 0] = True
    while q:
        j, i = q.popleft()
        for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            jj, ii = j + dj, i + di
            if 0 <= jj < h and 0 <= ii < w and not out[jj, ii] and not D[jj, ii]: out[jj, ii] = True; q.append((jj, ii))
    F = ero_(~out, C) | M
    return x0, z0, F.astype(np.uint8)
def line_mask(pts, buf):
    return pts_mask(pts, dil=buf, pad=buf + 1.5)
def enc(x0, z0, M):
    rows = []
    for r in M:
        s, cur, n = [], int(r[0]), 0
        for v in r:
            if int(v) == cur: n += 1
            else: s.append(n); cur = int(v); n = 1
        s.append(n); rows.append([int(r[0])] + s)
    return {'x0': round(float(x0), 2), 'z0': round(float(z0), 2), 'S': S, 'w': int(M.shape[1]), 'h': int(M.shape[0]), 'rows': rows}
R = {'sand': [], 'beach': [], 'erase': []}
c = FM['P04']['green']; R['sand'].append(dict(enc(*close_mask(sum([k['pts'] + k['inside'] for k in c], []))), tag='P04 ustje'))
for i, k in enumerate(FM['P07']['green']): R['sand'].append(dict(enc(*close_mask(k['pts'] + k['inside'])), tag='P07 g%d' % i))
for k, (pan, P) in GW['red'].items(): R['sand'].append(dict(enc(*poly_mask(P)), tag='list21 ' + k))
for i, k in enumerate(M2['red']):
    if i == 0: continue
    R['sand'].append(dict(enc(*close_mask(k['stroke'] + k['inside'])), tag='mapa2 r%d' % i))
for i, k in enumerate(FM['P08']['blue']):
    if k['n'] < 200: continue
    R['sand'].append(dict(enc(*close_mask(k['pts'] + k['inside'])), tag='P08 b%d' % i))
R['beach'].append(dict(enc(*close_mask(M3['green'][0]['stroke'] + M3['green'][0]['inside'])), tag='mapa3 plaza'))
for i, k in enumerate(M3['blue']): R['erase'].append(dict(enc(*line_mask(k['stroke'], 2.5)), tag='mapa3 b%d' % i))
R['lines'] = {k: P for k, (pan, P) in GW['green'].items()}
R['tracks'] = [k['pts'] for k in FM['P04']['blue']]
R['del'] = [dict(enc(*pts_mask(k['stroke'] + k['inside'], dil=1.5)), tag='mapa2 g%d' % i) for i, k in enumerate(M2['green'])]
R['box'] = M2['blue'][0]['stroke']; R['fence'] = sum([k['pts'] for k in FM['P07']['red'][9:12]], [])
json.dump(R, open(SP + 'regions16.json', 'w'))
print({k: len(v) for k, v in R.items()}, len(json.dumps(R)))
