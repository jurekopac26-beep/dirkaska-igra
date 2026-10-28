# coloured marks on a top-view map picture (the map 1200x1200 at the top) -> world strokes and filled regions
import json, sys
import numpy as np
from PIL import Image
from collections import deque
def comps(M, minpx=20):
    seen = np.zeros_like(M); out = []
    for y0, x0 in zip(*np.nonzero(M)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
        while q:
            y, x = q.popleft(); pts.append((x, y))
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < M.shape[0] and 0 <= xx < M.shape[1] and M[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
        if len(pts) >= minpx: out.append(pts)
    return out
def fill_inside(pts):
    bx0, by0 = min(p[0] for p in pts), min(p[1] for p in pts); bx1, by1 = max(p[0] for p in pts), max(p[1] for p in pts)
    sub = np.zeros((by1 - by0 + 9, bx1 - bx0 + 9), bool)   # a free ring of 2 px round the dilated stroke: the flood from the corner reaches the whole border
    for (x, y) in pts: sub[y - by0 + 4, x - bx0 + 4] = True
    for _ in range(2):
        t = sub.copy(); t[1:, :] |= sub[:-1, :]; t[:-1, :] |= sub[1:, :]; t[:, 1:] |= sub[:, :-1]; t[:, :-1] |= sub[:, 1:]; sub = t
    outside = np.zeros_like(sub); q = deque([(0, 0)]); outside[0, 0] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < sub.shape[0] and 0 <= xx < sub.shape[1] and not outside[yy, xx] and not sub[yy, xx]: outside[yy, xx] = True; q.append((yy, xx))
    ins = ~outside & ~sub; iy, ix = np.nonzero(ins)
    return [(int(x + bx0 - 4), int(y + by0 - 4)) for y, x in zip(iy, ix)], int((~outside).sum())
def run(img, cx, cz, span, size=1200, tests=None):
    im = Image.open(img).convert('RGB'); A = np.asarray(im).astype(int)[:size, :size]
    W = lambda u, v: [round(float(cx + (u - size / 2) * span / size), 2), round(float(cz + (v - size / 2) * span / size), 2)]
    res = {}
    for name, t in tests.items():
        M = t(A[:, :, 0], A[:, :, 1], A[:, :, 2]); L = []
        for pts in comps(M):
            ins, area = fill_inside(pts); closed = len(ins) > 0.25 * area and len(ins) > 30
            L.append({'n': len(pts), 'closed': closed, 'stroke': [W(x, y) for (x, y) in pts[::2]], 'inside': [W(x, y) for (x, y) in ins[::3]] if closed else [], 'bbox': [int(min(p[0] for p in pts)), int(min(p[1] for p in pts)), int(max(p[0] for p in pts)), int(max(p[1] for p in pts))]})
        res[name] = L
    return res
