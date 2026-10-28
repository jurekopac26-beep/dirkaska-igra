# paved ground round the smaller circuit, read off the current 140 m views (sh-in1-N0k, 8.6 px/m): asphalt-grey pixels, at 0.25 m;
# the edge overlay (edgeband4.py) leaves no strip or line where this lies beside the circuit (lanes merging, the lot, bays, the bowl)
import numpy as np
from PIL import Image
from mk18_helpers import gauss
CX, CZ, SPAN, S = [-135, 5, 145], [-185, -45, 95], 140.0, 0.25
_T = {}
def _tile(r, c):
    if (r, c) not in _T:
        k = r * 3 + c + 1; im = Image.open('sh-in1-N0%d.png' % k).convert('RGB'); n = int(SPAN / S)
        F = np.asarray(im, np.float32); mx = F.max(-1); sat = (mx - F.min(-1)) / np.maximum(mx, 1); lum = F @ np.array([0.3, 0.59, 0.11])
        a = ((sat < 0.17) & (lum > 55) & (lum < 150)).astype(np.float32)
        A = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((n, n), Image.BOX), np.float32) / 255
        import scipy.ndimage as nd      # (smears and lines on the paving - old sand, paint - closed over: up to ~1.5 m)
        A = nd.binary_closing(A > 0.5, structure=np.ones((3, 3)), iterations=3).astype(np.float32)
        _T[(r, c)] = gauss(A, 0.4 / S)
    return _T[(r, c)]
def pv(x, z):
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2)); A = _tile(r, c); n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1)); return float(A[j, i])
# the red-white kerbs standing round the circuit now (the game's junction corners, the user's wide kerb): red next to white, at 0.25 m
_K = {}
def _ktile(r, c):
    if (r, c) not in _K:
        from PIL import ImageFilter
        k = r * 3 + c + 1; im = Image.open('sh-in1-N0%d.png' % k).convert('RGB'); n = int(SPAN / S)
        F = np.asarray(im, np.float32); mx = F.max(-1); sat = (mx - F.min(-1)) / np.maximum(mx, 1); fr, fg, fb = F[..., 0], F[..., 1], F[..., 2]
        white = (F.min(-1) > 195) & (sat < 0.16); red = (fr > 160) & (fg < 95) & (fb < 95)
        mf = lambda m: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)), np.float32) > 0
        kb = (red & mf(white)) | (white & mf(red))
        A = np.asarray(Image.fromarray((kb * 255).astype(np.uint8)).resize((n, n), Image.BOX), np.float32) / 255
        _K[(r, c)] = gauss((A > 0.08).astype(np.float32), 0.3 / S)
    return _K[(r, c)]
def kerb(x, z):
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2)); A = _ktile(r, c); n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1)); return float(A[j, i])

# red/coral kerb pieces already lying at the circuit's edge (the old kerb-end wedges, the game's own kerbs): no new white line over them
_R = {}
def red(x, z):
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2))
    if (r, c) not in _R:
        k = r * 3 + c + 1; F = np.asarray(Image.open('sh-in1-N0%d.png' % k).convert('RGB'), np.float32); n = int(SPAN / S)
        m = (F[..., 0] > 170) & (F[..., 1] < 120) & (F[..., 2] < 110)
        A = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((n, n), Image.BOX), np.float32) / 255
        _R[(r, c)] = gauss((A > 0.1).astype(np.float32), 0.3 / S)
    A = _R[(r, c)]; n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1)); return float(A[j, i])
# white edge lines already painted at the circuit's edge (the game's own, a lane's): no second line beside them. Not inside the two
# stretches where the earlier picture edge (eb3) drew its own line - those views show that line, not an older one
OLDZ = [(-52, 34, 72, 78), (74, -76, 118, 26)]
_W = {}
def white(x, z):
    if any(a <= x <= c and b <= z <= d for a, b, c, d in OLDZ): return 0.0
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2))
    if (r, c) not in _W:
        k = r * 3 + c + 1; F = np.asarray(Image.open('sh-in1-N0%d.png' % k).convert('RGB'), np.float32); n = int(SPAN / S)
        mx = F.max(-1); sat = (mx - F.min(-1)) / np.maximum(mx, 1); m = (F.min(-1) > 200) & (sat < 0.12)
        A = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((n, n), Image.BOX), np.float32) / 255
        _W[(r, c)] = gauss((A > 0.12).astype(np.float32), 0.3 / S)
    A = _W[(r, c)]; n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1)); return float(A[j, i])

# glass roofs and blue things standing at the edge (a garage's glass roof shows its floor): no edge drawn under them
_B = {}
def blue(x, z):
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2))
    if (r, c) not in _B:
        k = r * 3 + c + 1; F = np.asarray(Image.open('sh-in1-N0%d.png' % k).convert('RGB'), np.float32); n = int(SPAN / S)
        m = (F[..., 2] > F[..., 0] + 18) & (F[..., 2] > 60)
        A = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((n, n), Image.BOX), np.float32) / 255
        import scipy.ndimage as nd
        _B[(r, c)] = gauss(nd.binary_dilation(A > 0.3, iterations=2).astype(np.float32), 0.25 / S)
    A = _B[(r, c)]; n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1)); return float(A[j, i])

# the beach's sand beside the circuit: its colour at a point (None where it is not beach sand)
_S = {}
def sand(x, z):
    c = int(np.clip(round((x - CX[0]) / SPAN), 0, 2)); r = int(np.clip(round((z - CZ[0]) / SPAN), 0, 2))
    if not (CX[c] - SPAN / 2 <= x <= CX[c] + SPAN / 2 and CZ[r] - SPAN / 2 <= z <= CZ[r] + SPAN / 2): return None
    if (r, c) not in _S:
        k = r * 3 + c + 1; F = np.asarray(Image.open('sh-in1-N0%d.png' % k).convert('RGB'), np.float32); n = int(SPAN / S)
        _S[(r, c)] = np.asarray(Image.fromarray(F.astype(np.uint8)).resize((n, n), Image.BOX), np.float32)
    A = _S[(r, c)]; n = A.shape[0]
    i = int(np.clip((x - (CX[c] - SPAN / 2)) / S, 0, n - 1)); j = int(np.clip((z - (CZ[r] - SPAN / 2)) / S, 0, n - 1))
    rr, gg, bb = A[j, i]
    if rr > 170 and 0.6 < gg / rr < 0.8 and 0.38 < bb / rr < 0.62: return A[j, i]
    return None
