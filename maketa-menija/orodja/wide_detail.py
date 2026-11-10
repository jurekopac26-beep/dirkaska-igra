# Menu only (the game is not changed): the painted land round a track's map (assets/maps/wide-<id>.webp, wide_map.py: half the map's
# pixels, smooth) gets the detail of the game's own island (isle-<id>.webp) at the island's scale: its trees, grass, fields and rock,
# each patch taken where the island's land looks like the painted land there (the colours and shapes of both blurred alike), so
# the map has no blurred, unfinished land round the island (the user 4. 11. 2026, on Styria's map: "tam, kjer ni narejena grafika na
# sliki, dopolni in popravi", only in the menu's picture). Only the tracks that already have a wide map (MENU.wideMaps in
# js/menu-data.js; the user: not the others, which are still to be chosen), not the test tracks.
#   assets/maps/wide-<id>.webp, wide-<id>-rain.webp   written again at 0.8 of the map's scale (SCALE: the map and its margin; wide_map.py's
#   half was blurred on a phone, the full scale twice the bytes for little more to see; the menu loads both, the rain's for its fade)
#   assets/maps/isle-<id>.webp, isle-<id>-rain.webp   the island's own bare rim (the game's smooth ground round the trees to the tile's
#   edge, bare_rim) given the same detail, from the island's land away from the rim; the rest of the island and its alpha as they were
# The detail of a patch is the island over its own blur (a ratio: the painted land keeps its colours, the trees their light and shade);
# the patches are blended with their neighbours keeping the texture's contrast (Heitz & Neyret's variance-preserving blend); the rain's
# painted land gets the same patches of the rain's island. The road and what is by it (kerbs, people, the pits) and what people built
# (roofs, car parks, walls, fences: their straight outlines would be black lines in the land) are kept out of the patches. The painted
# land is made sharper first: its fine detail, and the edges of its forests, meadows and fields steeper (with no rim; not in towns or rock).
# Usage: python3 wide_detail.py rbring[,vrsic,...]|all [--write] [--debug <folder>]
#   without --write nothing is saved in assets/ (--debug: the map as the menu lays it, before and after, as pictures).
#   It runs on wide_map.py's output (half the pixels): a wide map already done, and its island, are left as they are (wide_map.py --write
#   first, then this).
#   The detail is made at the map's scale, then the whole made smaller to SCALE.
import json, os, sys, zlib
import numpy as np
from PIL import Image
from scipy import ndimage, signal
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MAPS = os.path.join(ROOT, 'assets', 'maps')
LUM = np.array([0.2126, 0.7152, 0.0722])

B = 40          # a patch, in map pixels (an island too narrow for it: what it allows, down to 16), a step of half a patch (blended over the other half)
SIG_D = 3.0     # the detail: the island over its blur at this many pixels (a tree, a tuft, a roof; the land's shapes stay the painted land's)
SIG_M = 4.0     # the blur at which the painted land and the island are compared, on a 4 x 4 grid of a patch
K = 10          # a patch is one of the K most alike that lie apart in the island, at random (no stamp the eye sees repeat)
SHARP = (0.6, 2.5)   # the painted land made sharper (its shapes were drawn at half the pixels): this much of its own detail at this blur
EDGE = (2.0, 8.0, 11, 0.3, 0.42)   # and its shapes' edges (a forest's, a field's: soft from the land cover's 10 m): this much at this blur, kept
    # within the land's own colours in a square of this many pixels round each (a step made steeper, no lighter or darker rim); only where
    # the land has colour (its saturation round it from the 4th to the 5th: a town's or rock's grey speckle would be a camouflage pattern)
ROAD_M = 60.0   # the island's road, its kerbs, fences, stands and people kept out of the patches: this many metres either side of the route
PITS_M = 260.0  # and round the start and the finish (the pits, the paddock, the start's crowd)
FAR = (7.0, 15.0)   # the difference of the descriptors (per point of the grid) up to which a patch gives its full detail, and from which none
EPS = 0.03      # the ratio's floor (the darkest shadows)
STRAIGHT = (25, 0.22, 0.16)   # what people built: a line this many pixels long, the light's step across it and a thin line's (0..1)
SCALE = 0.8     # the file's pixels per map pixel
RIM = (300.0, 0.05, 0.09)   # the island's own bare ground by its edge (bare_rim): within this many metres of it; smooth (smoothness)
    # with its detail's strength (the root of its mean square round it) up to RIM[1], not smooth from RIM[2]
MIN_LAND = 0.2  # an island with less of its land fit for patches is a town (its parks' paths, gardens' fences): the painted land only made sharper
ROCK = ('maunakea', 'caracoles')   # but these are rock (grey as asphalt, so little of it fit): their land's patches as any other island's
MIN_RIM = (300, 0.02)   # the island's bare rim takes the detail from at least this many patches (fewer: the same few side by side) and
    # when it is at least this much of the island (less: a new file for nothing to see), else the island is left as it is


def js_obj(name, var):
    s = open(os.path.join(ROOT, 'js', name), encoding='utf-8').read()
    return json.JSONDecoder().raw_decode(s, s.index('{', s.index(var)))[0]   # (the object alone: js/menu-data.js goes on after it, window.MENU.lens = ... and others)


def wide_maps():
    s = open(os.path.join(ROOT, 'js', 'menu-data.js'), encoding='utf-8').read()
    i = s.index('"wideMaps"'); i = s.index('{', i); j = s.index('}', i)
    return json.loads(s[i:j + 1])


def is_test(tid):
    p = os.path.join(ROOT, 'js', 'tracks', tid + '.js')
    return os.path.exists(p) and 'test: true' in open(p, encoding='utf-8').read()


def blur(img, sig, mask=None):
    """Gaussian blur of an H x W x C image; with a mask, of the masked pixels only (normalised)."""
    if mask is None:
        return np.stack([ndimage.gaussian_filter(img[..., c], sig, mode='nearest') for c in range(img.shape[2])], axis=-1)
    m = ndimage.gaussian_filter(mask.astype(np.float64), sig, mode='nearest')
    out = np.stack([ndimage.gaussian_filter(img[..., c] * mask, sig, mode='nearest') for c in range(img.shape[2])], axis=-1)
    return out / np.maximum(m, 1e-6)[..., None]


def route_mask(route, W, H, r_px):
    """Pixels within r_px of the route's polyline."""
    m = np.zeros((H, W), bool)
    pts = np.array(route, np.float64)
    for a, b in zip(pts[:-1], pts[1:]):
        n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])) * 2) + 2
        xs = np.clip(np.round(np.linspace(a[0], b[0], n)).astype(int), 0, W - 1); ys = np.clip(np.round(np.linspace(a[1], b[1], n)).astype(int), 0, H - 1)
        m[ys, xs] = True
    return ndimage.distance_transform_edt(~m) <= r_px


def hsv(I):
    V = I.max(axis=2); Sat = (V - I.min(axis=2)) / np.maximum(V, 1e-6)
    r, g, b = I[..., 0], I[..., 1], I[..., 2]
    return np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360, Sat, V


def unnatural(I):
    """What is no land: white and light grey (marks, tents, people), dark grey (asphalt: a side road would be a black line in the land),
    strong blues and purples, bright strong reds (cars, flags, roofs)."""
    hue, Sat, V = hsv(I)
    return (((V > 0.78) & (Sat < 0.22)) | ((Sat < 0.16) & (V > 0.1) & (V < 0.5)) | ((hue > 185) & (hue < 345) & (Sat > 0.3) & (V > 0.3)) |
            (((hue < 14) | (hue >= 345)) & (Sat > 0.55) & (V > 0.45)))


def line_kernel(th, offs, n=STRAIGHT[0]):
    """A kernel: the mean along a line of n pixels at the angle th, at each of offs = ((offset across the line, weight), ...)."""
    R = n // 2 + 4; k = np.zeros((2 * R + 1, 2 * R + 1)); c, s = np.cos(th), np.sin(th)
    t = np.linspace(-n / 2, n / 2, 2 * n)
    for o, w in offs:
        x, y = R + t * c - o * s, R + t * s + o * c; x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int); fx, fy = x - x0, y - y0
        for dy, dx, ww in ((0, 0, (1 - fx) * (1 - fy)), (0, 1, fx * (1 - fy)), (1, 0, (1 - fx) * fy), (1, 1, fx * fy)):
            np.add.at(k, (y0 + dy, x0 + dx), w * ww / (2 * n))
    return k


def built(I, op):
    """What people built in the island, kept out of the patches with what is round it: flat grey (roofs, concrete, car parks; a roof's
    outline would be a dark line in the land, side by side a quilt) and straight edges and thin lines (walls, fences, the shadows of
    buildings): the light's mean along a line of STRAIGHT[0] pixels, an edge across it or a line in its middle, at 12 angles (the
    land's own shapes, trees and the forest's edge, are no straight lines that long)."""
    hue, Sat, V = hsv(I)
    l = I @ LUM
    l = np.where(op, l, blur(l[..., None], 4, op)[..., 0])
    m = ndimage.uniform_filter(l, 5); s = np.sqrt(np.maximum(ndimage.uniform_filter(l * l, 5) - m * m, 0))
    flat = ndimage.binary_opening((s < 0.03) & (Sat < 0.25) & op, np.ones((3, 3)))
    E = np.zeros_like(l); Ln = np.zeros_like(l)
    for th in np.arange(12) * np.pi / 12:
        E = np.maximum(E, np.abs(signal.fftconvolve(l, line_kernel(th, ((1.5, 1), (-1.5, -1))), mode='same')))
        Ln = np.maximum(Ln, np.abs(signal.fftconvolve(l, line_kernel(th, ((0, 1), (2.5, -0.5), (-2.5, -0.5))), mode='same')))
    return ndimage.binary_dilation(flat | (((E > STRAIGHT[1]) | (Ln > STRAIGHT[2])) & op), iterations=4)


def still(rgb):
    """0..1 per pixel: how little detail the painted land takes. Water (teal to blue: Finland's dark lakes are teal, its forests green
    below 140 degrees) and snow (light, no colour)
    none; land with little colour (towns, rock: their nearest patches are roofs and streets, which side by side show as a quilt) less."""
    hue, Sat, V = hsv(rgb)
    water = np.clip((hue - 140) / 12, 0, 1) * np.clip((270 - hue) / 10, 0, 1) * np.clip((Sat - 0.1) / 0.08, 0, 1)
    snow = np.clip((V - 0.72) / 0.1, 0, 1) * np.clip((0.2 - Sat) / 0.1, 0, 1)
    grey = 0.45 * np.clip((0.24 - Sat) / 0.08, 0, 1) * np.clip((V - 0.3) / 0.1, 0, 1)
    return ndimage.gaussian_filter(np.maximum(np.maximum(water, snow), grey), 2.0)


def feat(rgb):
    """Per pixel: the colour without its light (the sun on a slope, the shade) and the light apart: chromaticity, log luminance."""
    lum = rgb @ LUM + 0.01
    s = rgb.sum(axis=2) + 0.03
    return np.stack([rgb[..., 0] / s * 100, rgb[..., 1] / s * 100, np.log(lum) * 12], axis=-1)


def grid_desc(F, ys, xs, b):
    """The descriptors of the patches with their top left corners at (ys, xs): on a 4 x 4 grid in the patch, the colour (chromaticity) as it
    is, the light as its shape only (each point against the patch's mean) and its mean weakly (a slope's shade is the painted land's own)."""
    off = (np.arange(4) * b / 4 + b / 8).astype(int)
    P = np.stack([F[ys + oy, xs + ox] for oy in off for ox in off], axis=1)   # n x 16 x 3
    lm = P[:, :, 2].mean(axis=1, keepdims=True)
    return np.concatenate([P[:, :, 0], P[:, :, 1], P[:, :, 2] - lm, lm * 0.35], axis=1)


def lay(tid, L, det, show, ys, xs, b, tree, rim=False):
    """The island's detail laid over L (dry, rain) patch by patch where show (0..1) says it shows: the painted land (not under the island's
    opaque land) or the island's own bare rim (rim: the detail as much as show, the rest of the island as it is)."""
    st = b // 2; Hf, Wf = show.shape
    pad = b
    LmW = feat(blur(np.pad(L[''], ((pad, pad), (pad, pad), (0, 0)), mode='edge'), SIG_M))
    gy, gx = np.arange(-b // 2, Hf - b // 2 + st, st), np.arange(-b // 2, Wf - b // 2 + st, st)
    by, bx = np.meshgrid(gy, gx, indexing='ij'); by, bx = by.ravel(), bx.ravel(); nx = len(gx)
    q = grid_desc(LmW, by + pad, bx + pad, b)
    kq = min(80, len(ys))
    dist, idx = tree.query(q, k=kq)
    if kq == 1: dist, idx = dist[:, None], idx[:, None]
    rng = np.random.default_rng(zlib.crc32(tid.encode()))
    # each patch: one of the K most alike that lie apart in the island (no two within half a patch; the nearest K would be one place
    # shifted by a pixel or two, and the same stamp side by side a lattice), not where its left or upper neighbour's came from
    src = np.full((len(by), 2), -10 ** 6); d1 = np.zeros(len(by)); half = b // 2
    for n in range(len(by)):
        near = [src[n - 1]] if n % nx else []
        if n >= nx: near.append(src[n - nx])
        keep = []
        for m in range(kq):
            j = idx[n, m]; y, x = ys[j], xs[j]
            if any(abs(y - p[0]) < half and abs(x - p[1]) < half for p in near): continue
            if any(abs(y - ys[i]) < half and abs(x - xs[i]) < half for i, _ in keep): continue
            keep.append((j, dist[n, m]))
            if len(keep) == K: break
        if not keep: keep = [(idx[n, 0], dist[n, 0])]
        j, dd = keep[rng.integers(0, len(keep))]
        src[n] = (ys[j], xs[j]); d1[n] = dd / 4.0   # (per point of the grid: the root of the mean square over 16 points)
    amp = np.clip((FAR[1] - d1) / (FAR[1] - FAR[0]), 0, 1)
    win1 = np.hanning(b + 2)[1:-1]; win = np.outer(win1, win1)
    num = {k: np.zeros((Hf + 2 * pad, Wf + 2 * pad, 3)) for k in det}; den = np.zeros((Hf + 2 * pad, Wf + 2 * pad))
    showp = np.pad(show, pad)
    used = 0
    for n in range(len(by)):
        y0, x0 = by[n] + pad, bx[n] + pad
        if showp[y0:y0 + b, x0:x0 + b].max() < 0.02:
            continue
        sy, sx = src[n]; a = amp[n]
        for k in det:
            d = det[k][sy:sy + b, sx:sx + b]
            d = d - (d * win[..., None]).sum(axis=(0, 1)) / win.sum()   # (no mean: the blend's weights would show it as a grid)
            num[k][y0:y0 + b, x0:x0 + b] += (win * a)[..., None] * d
        den[y0:y0 + b, x0:x0 + b] += win ** 2
        used += 1
    den = np.sqrt(np.maximum(den, 1e-6))[pad:-pad, pad:-pad, None]
    # water and snow stay smooth, towns and rock take less (the island has no water or snow as land; a town's nearest patches are roofs)
    calm = still(L[''])
    out = {}
    for k in det:
        D = num[k][pad:-pad, pad:-pad] / den * ((1 - calm) * (show if rim else 1))[..., None]
        out[k] = np.clip((L[k] + EPS) * np.exp(D) - EPS, 0, 1)
    print(tid + (' (the island\'s bare rim)' if rim else '') + ': ' + str(len(ys)) + ' patches of ' + str(b) + ' px from the island, ' + str(used) + ' laid; their colours\' difference ' +
          '(10/50/90/99 %) ' + str(np.percentile(d1, [10, 50, 90, 99]).round(1).tolist()) + ', full detail ' + str(round(float((amp > 0.99).mean()) * 100)) + ' %, none ' +
          str(round(float((amp < 0.01).mean()) * 100)) + ' %')
    return out


def smoothness(I):
    """0..1 per pixel of the island: how smooth it is drawn, by the strength of its detail round it, from RIM[1] (1) to RIM[2] (0)."""
    l = I @ LUM; d = np.log(l + EPS) - np.log(ndimage.gaussian_filter(l, SIG_D) + EPS)
    return np.clip((RIM[2] - np.sqrt(ndimage.gaussian_filter(d * d, 6))) / (RIM[2] - RIM[1]), 0, 1)


def bare_rim(I, A, route, mpp):
    """0..1 per pixel of the island: its own bare ground by its edge (the game's ground cells round the trees, drawn smooth, within RIM[0]
    metres of the edge), which takes the detail as the painted land does, as much as it is smooth; not the road or what is no land."""
    H, W = A.shape
    dist = ndimage.distance_transform_edt(np.pad(A > 0.5, 1))[1:-1, 1:-1]   # (the tile's own edge an edge too)
    near = np.clip((RIM[0] / mpp - dist) / 20 + 1, 0, 1)
    keep = ~(route_mask(route, W, H, ROAD_M / 2 / mpp) | ndimage.binary_dilation(unnatural(I), iterations=3))
    return ndimage.gaussian_filter(near * smoothness(I) * keep * (A > 0.02), 2.0)


def detail(tid, write=False, debug=None):
    E = wide_maps()[tid]
    T = js_obj('routes.js', 'window.ROUTES')[tid]['top']; W, H, mpp = T['W'], T['H'], T['mpp']
    Wf, Hf = W + 2 * E, H + 2 * E
    wide = {k: Image.open(os.path.join(MAPS, 'wide-' + tid + k + '.webp')).convert('RGB') for k in ('', '-rain')}
    if abs(wide[''].width - Wf / 2) > 2:
        print(tid + ': not wide_map.py\'s output (half the map\'s pixels), done already: left as it is'); return None
    isle = {k: np.asarray(Image.open(os.path.join(MAPS, 'isle-' + tid + k + '.webp')).convert('RGBA'), np.float64) / 255 for k in ('', '-rain')}
    I, A = isle[''][..., :3], isle[''][..., 3]

    # the island's land the patches come from: opaque, off the road and the pits, not what is no land (people, cars, flags, asphalt) or built
    good = A > 0.98
    good &= ~route_mask(T['route'], W, H, ROAD_M / mpp)
    for p in (T['route'][0], T['route'][-1]):
        yy, xx = np.ogrid[:H, :W]; good &= (xx - p[0]) ** 2 + (yy - p[1]) ** 2 > (PITS_M / mpp) ** 2
    good &= ~ndimage.binary_dilation(unnatural(I), iterations=3) & ~built(I, A > 0.98)
    # the patch's size: what the island's land allows (a road's narrow strip: smaller patches), 16 to B pixels; a patch at least 90 %
    # good land (the rest gives no detail)
    goodf = good.astype(np.float64)
    Q = 2 * int(ndimage.distance_transform_cdt(good, metric='chessboard').max())
    b = int(np.clip(Q * 0.75 // 4 * 4, 16, B))
    frac = ndimage.uniform_filter(goodf, b, mode='constant')
    ys, xs = np.mgrid[0:H - b:2, 0:W - b:2]; ys, xs = ys.ravel(), xs.ravel()
    ok = frac[ys + b // 2, xs + b // 2] >= 0.9
    ys, xs = ys[ok], xs[ok]
    det = {}
    land = good.sum() / max(1, (A > 0.98).sum())
    if len(ys) >= 40 and (land >= MIN_LAND or tid in ROCK):
        desc = grid_desc(feat(blur(I, SIG_M, goodf)), ys, xs, b)
        tree = cKDTree(desc)
        for k in ('', '-rain'):
            Ik = isle[k][..., :3]
            det[k] = (np.log(Ik + EPS) - np.log(blur(Ik, SIG_D, goodf) + EPS)) * goodf[..., None]

    # the painted land at the map's scale; where it shows (not under the island's opaque land) patch by patch
    L = {k: np.asarray(wide[k].resize((Wf, Hf), Image.LANCZOS), np.float64) / 255 for k in wide}
    L0 = np.clip(L[''], 0, 1)   # (as the menu showed it: the debug's before)

    def sharp(v):   # (the fine detail, then the land's shapes steeper: towards each side of an edge only as far as the land there goes, no halo)
        v = ndimage.gaussian_filter(v, (0.8, 0.8, 0))
        v = v + SHARP[0] * (v - ndimage.gaussian_filter(v, (SHARP[1], SHARP[1], 0)))
        lo, hi = ndimage.minimum_filter(v, size=(EDGE[2], EDGE[2], 1)), ndimage.maximum_filter(v, size=(EDGE[2], EDGE[2], 1))
        e = np.clip(v + EDGE[0] * (v - ndimage.gaussian_filter(v, (EDGE[1], EDGE[1], 0))), lo, hi)
        w = np.clip((ndimage.gaussian_filter(hsv(np.clip(v, 0, 1))[1], 6) - EDGE[3]) / (EDGE[4] - EDGE[3]), 0, 1)[..., None]
        return np.clip(v + (e - v) * w, 0, 1)
    L = {k: sharp(v) for k, v in L.items()}
    if not det:   # (a town's island all streets and roofs, Detroit, Toronto, Newcastle, Harju: the painted land only sharper)
        print(tid + ': too little of the island\'s land for patches (' + str(len(ys)) + ', ' + str(round(land * 100)) + ' % of its land): the painted land only made sharper')
        out = L
        isle_out = None
    else:
        show = np.ones((Hf, Wf)); show[E:E + H, E:E + W] = 1 - A
        out = lay(tid, L, det, show, ys, xs, b, tree)
        # the island's bare rim: its patches from the island's land away from the rim (its own smooth ground, the nearest in colour, would
        # lay no detail on it); with too few of them (a town's lawns between its streets) or too little rim the island is left as it is
        rimw = bare_rim(I, A, T['route'], mpp)
        away = ndimage.uniform_filter((rimw > 0.5).astype(np.float64), b, mode='constant')[ys + b // 2, xs + b // 2] < 0.1
        share = (rimw > 0.5).sum() / max(1, (A > 0.5).sum())
        if away.sum() >= MIN_RIM[0] and share >= MIN_RIM[1]:
            isle_out = lay(tid, {k: isle[k][..., :3] for k in isle}, det, rimw, ys[away], xs[away], b, cKDTree(desc[away]), rim=True)
        else:
            isle_out = None
        print('  the island\'s bare rim: ' + str(round(float(share) * 100, 1)) + ' % of it, patches for it from ' + str(int(away.sum())) + ' of the ' +
              str(len(ys)) + ' (not the rim\'s)' + ('' if isle_out is not None else ': too few or too little, the island left as it is'))
    if debug:
        os.makedirs(debug, exist_ok=True)
        for name, land, il in (('before', L0, isle[''][..., :3]), ('after', out[''], isle[''][..., :3] if isle_out is None else isle_out[''])):
            c = Image.fromarray((land * 255).round().astype(np.uint8))
            isl = Image.fromarray((np.dstack([il, isle[''][..., 3]]) * 255).round().astype(np.uint8), 'RGBA')
            c.paste(isl, (E, E), isl); c.save(os.path.join(debug, tid + '-' + name + '.jpg'), quality=90)
    if write:
        for k in ('', '-rain'):
            p = os.path.join(MAPS, 'wide-' + tid + k + '.webp')
            Image.fromarray((out[k] * 255).round().astype(np.uint8)).resize((round(Wf * SCALE), round(Hf * SCALE)), Image.LANCZOS).save(p, 'WEBP', quality=72, method=6)
            print('  ' + os.path.relpath(p, ROOT) + ': ' + str(os.path.getsize(p) // 1024) + ' KB')
            if isle_out is not None:   # (the island as wide_map.py saves it: its alpha as it was)
                p = os.path.join(MAPS, 'isle-' + tid + k + '.webp')
                Image.fromarray((np.dstack([isle_out[k], isle[k][..., 3]]) * 255).round().astype(np.uint8), 'RGBA').save(p, 'WEBP', quality=82, alpha_quality=92, method=6)
                print('  ' + os.path.relpath(p, ROOT) + ': ' + str(os.path.getsize(p) // 1024) + ' KB')
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        print(__doc__ or 'python3 wide_detail.py <ids>|all [--write] [--debug <folder>]'); sys.exit(1)
    write = '--write' in args
    debug = args[args.index('--debug') + 1] if '--debug' in args else None
    ids = list(wide_maps()) if args[0] == 'all' else args[0].split(',')
    for tid in ids:
        if is_test(tid):
            print(tid + ': a test track: left as it is'); continue
        detail(tid, write, debug)
