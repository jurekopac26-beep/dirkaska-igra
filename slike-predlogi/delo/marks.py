# the user's coloured marks on a captioned game frame (23-Pxx as they sent it back) -> world points / filled regions
import sys, json, math
import numpy as np
from PIL import Image
from collections import deque
def cam(mode, port, x, z, h, gy0):
    fx, fz = math.cos(h), math.sin(h)
    if mode == 'chase':
        D, pitch, ahead, fov = (46, 0.98, 13, 58) if port else (30, 0.9, 8.5, 46)
        tx, tz = x + fx * ahead, z + fz * ahead; C = np.array([tx - fx * D * math.cos(pitch), gy0 + D * math.sin(pitch), tz - fz * D * math.cos(pitch)]); T = np.array([tx, gy0, tz])
    else:
        D, pitch, fov = 57, 0.82, 30
        tx, tz = x + max(-20, min(20, fx * 19)), z + max(-10.5, min(15.5, fz * 19)); C = np.array([tx, gy0 + D * math.sin(pitch), tz + D * math.cos(pitch)]); T = np.array([tx, gy0, tz])
    return C, T, fov
def ray_ground(C, T, fov, W, H, u, v, gy):
    f = T - C; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); up = np.cross(r, f)
    t = math.tan(math.radians(fov) / 2); a = W / H; nx = (u / W) * 2 - 1; ny = 1 - (v / H) * 2
    d = f + r * nx * t * a + up * ny * t; d /= np.linalg.norm(d)
    if abs(d[1]) < 1e-6: return None
    s = (gy - C[1]) / d[1]; p = C + d * s; return [round(float(p[0]), 2), round(float(p[2]), 2)]
def run(img, mode, port, pose, gy0, colours):
    im = Image.open(img).convert('RGB'); A = np.asarray(im).astype(int)
    W2 = 960 if port else 2080; s = im.width / W2; hdr = 150 * s          # (the captioned 2x frame, scaled as the user sent it)
    FW, FH = (480, 1040) if port else (1040, 480)
    C, T, fov = cam(mode, port, *pose, gy0)
    out = {}
    for name, test in colours.items():
        M = test(A[:, :, 0], A[:, :, 1], A[:, :, 2]); M[:int(hdr) + 2, :] = False
        ys, xs = np.nonzero(M); seen = np.zeros_like(M); comps = []
        for y0, x0 in zip(ys, xs):
            if seen[y0, x0]: continue
            q = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
            while q:
                y, x = q.popleft(); pts.append((x, y))
                for dy in (-2, -1, 0, 1, 2):
                    for dx in (-2, -1, 0, 1, 2):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < M.shape[0] and 0 <= xx < M.shape[1] and M[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
            if len(pts) < 25: continue
            # this stroke's pixels in frame px, then on the ground
            wp = []
            for (x, y) in pts[::3]:
                fu, fv = x / s / 2, (y - hdr) / s / 2
                g = ray_ground(C, T, fov, FW, FH, fu, fv, gy0)
                if g: wp.append(g)
            # a closed outline? its filled inside (image flood fill from the bbox border)
            bx0, by0 = min(p[0] for p in pts), min(p[1] for p in pts); bx1, by1 = max(p[0] for p in pts), max(p[1] for p in pts)
            sub = np.zeros((by1 - by0 + 9, bx1 - bx0 + 9), bool)   # a free ring round the dilated stroke (the flood reaches the whole border)
            for (x, y) in pts: sub[y - by0 + 4, x - bx0 + 4] = True
            sub2 = sub.copy()
            for _ in range(2):
                t = sub2.copy(); t[1:, :] |= sub2[:-1, :]; t[:-1, :] |= sub2[1:, :]; t[:, 1:] |= sub2[:, :-1]; t[:, :-1] |= sub2[:, 1:]; sub2 = t
            outside = np.zeros_like(sub2); q2 = deque([(0, 0)]); outside[0, 0] = True
            while q2:
                y, x = q2.popleft()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < sub2.shape[0] and 0 <= xx < sub2.shape[1] and not outside[yy, xx] and not sub2[yy, xx]: outside[yy, xx] = True; q2.append((yy, xx))
            fill = ~outside; inside = fill & ~sub2
            ins = []
            if inside.sum() > 0.15 * fill.sum():
                iy, ix = np.nonzero(inside)
                for (yy, xx) in list(zip(iy, ix))[::5]:
                    fu, fv = (xx + bx0 - 4) / s / 2, (yy + by0 - 4 - hdr) / s / 2; g = ray_ground(C, T, fov, FW, FH, fu, fv, gy0)
                    if g: ins.append(g)
            comps.append({'n': len(pts), 'pts': wp, 'inside': ins, 'bbox_img': [int(bx0), int(by0), int(bx1), int(by1)]})
        out[name] = comps
    return out
if __name__ == '__main__':
    pass
