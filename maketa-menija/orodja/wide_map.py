# Mockup only: the real land round a track's top map (assets/maps/top-<id>.webp). The game draws only a strip (an "island") of detailed
# world round the road and floats it on a made-up smooth land (routemap_page.js: skirt). Here the land round it is painted from the real
# heights (AWS Terrain Tiles) and the real land cover (ESA WorldCover) in the tile's own frame, lit by the same sun as the game's, and
# the island is put over it with a soft edge:
#   assets/maps/wide-<id>.webp, wide-<id>-rain.webp   the painted land over the tile and a margin all round it (WIDE_F of the tile's pixels)
#   assets/maps/isle-<id>.webp, isle-<id>-rain.webp   the tile's island (transparent where the made-up land was)
# The islands first: node routemap.mjs isle.json (GAME=<the game's folder>) -> raw/maps/isle-<id>[-rain].png, no made-up land, with the coverage as alpha.
# Usage: python3 wide_map.py vrsic[,pikes,...] [--write] [--paint-only]
#   without --write nothing is saved in assets/ (WIDE_DEBUG=<folder>: the sum of the layers as a picture, WIDE_REPAINT=1: paint the land again, WIDE_VERBOSE=1: the
#   colour ratios per land cover class). The land (colours, heights, classes) is kept in raw/wide/, the data it is made from in raw/geo/ (not in git).
# The margin of each track (EXT) must be the same as MENU.wideMaps in js/menu-data.js: the script says so if it is not.
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
from geo_lib import DEM, Geo, radii, haversine
from geo_paint import paint, DETAIL, SEASON

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MAPS = os.path.join(ROOT, 'assets', 'maps')
DEBUG = os.environ.get('WIDE_DEBUG')
VERBOSE = os.environ.get('WIDE_VERBOSE')

WIDE_F = 0.5        # the painted land's pixels per tile pixel (it is seen from afar: half the tile's detail is plenty)
EXT = {824: 300, 1100: 240}   # the margin round the tile, in tile pixels, by the tile's width (a tall or wide frame shows this much more)
SHADOW_K = 0.4   # how dark the sun's cast shadows are painted (the game's island has only its own; a mountain's long shadow would not fit it)
FEATHER = 18.0  # the island's soft edge: from opaque to clear over this many tile pixels
RING_M = 150.0  # the made-up rim of ground-only cells round the island's trees, in metres: cut off before the soft edge starts
RING_PX = {'monaco': 8, 'riviera': 18}   # (where the island is a whole town to the tile's edge: only a thin rim)
WATER_OUT = {'monaco', 'riviera'}   # (the game's sea is a plane far wider than the harbour: the painted land's own sea is used)
THEME = {'vrsic': 'vrsic', 'pikes': 'pikes', 'ouninpohja': 'ouni', 'nring': 'nring', 'spa': 'spa', 'rbring': 'rbring', 'suzuka': 'suzuka', 'monaco': 'monaco', 'riviera': 'city'}
# the sun of each theme (routemap_page.js: THEMES sunOff, default [-80, 96, 70]; x east, y up, z south), its strength and the sky light
SUN = {'ouni': ([-88, 72, 58], 1.18, 0.56), 'vrsic': ([-84, 70, 56], 1.16, 0.58), 'pikes': ([104, 48, -60], 1.58, 0.75), 'nring': ([-80, 76, 70], 1.1, 0.6),
       'rbring': ([-86, 78, 52], 1.12, 0.6), 'spa': ([-80, 96, 70], 0.98, 0.64), 'suzuka': ([-80, 96, 70], 1.06, 0.62), 'monaco': ([-80, 96, 70], 1.08, 0.6),
       'city': ([-80, 96, 70], 1.04, 0.6)}

def js_data(name, var):
    s = open(os.path.join(ROOT, 'js', name), encoding='utf-8').read()
    i = s.index('{', s.index(var)); j = s.rindex('}')
    return json.loads(s[i:j + 1])

def load(tid):
    R = js_data('routes.js', 'window.ROUTES')[tid]['top']; X = js_data('intro-data.js', 'window.INTRO')[tid]['top']; G = js_data('geo.js', 'window.GEO')['tracks'][tid]
    return R, X, G

class Frame:
    """The tile's pixels <-> the game's world (x east, z south, metres) <-> the Earth, for a margin of ext tile pixels all round the tile."""
    def __init__(self, tid):
        R, X, G = load(tid)
        self.tid, self.W, self.H, self.route = tid, R['W'], R['H'], np.array(R['route'], dtype=np.float64)
        self.A, self.B, self.tx, self.ty = X['fit']; self.q = self.A ** 2 + self.B ** 2; self.k = math.sqrt(self.q); self.mpp = 1 / self.k
        self.ext = EXT[self.W]; self.f = WIDE_F
        self.wo, self.ho = int(round((self.W + 2 * self.ext) * self.f)), int(round((self.H + 2 * self.ext) * self.f))
        # the world on the Earth; a shortened copy of a real road (kind 'scaled' with a real finish) is stretched to reach the real finish
        s = 1.0
        if G['kind'] == 'scaled':
            a, b = self.route[0], self.route[-1]; chord = math.hypot(*(b - a)) * self.mpp
            real = haversine(G['start'][0], G['start'][1], G['finish'][0], G['finish'][1])
            if tid == 'pikes': s = real / chord   # (Ouninpohja has no real finish: its world is at real scale)
        self.scale = s; self.geo = Geo(G['lat0'], G['lon0'], G['rot'], s)
    def px(self):   # the tile pixel (x, y) at the centre of each output pixel
        i = (np.arange(self.wo) + 0.5) / self.f - self.ext; j = (np.arange(self.ho) + 0.5) / self.f - self.ext
        return np.meshgrid(i, j)
    def world(self, px, py):
        dx, dy = px - self.tx, py - self.ty
        return (self.A * dx + self.B * dy) / self.q, (-self.B * dx + self.A * dy) / self.q

def sample(img, lat, lon, box, order=1):
    """img over box (lat0, lon0, lat1, lon1) with north at the top, sampled at lat, lon (arrays); img (H, W) or (H, W, C)."""
    H, W = img.shape[:2]
    ix = (lon - box[1]) / (box[3] - box[1]) * W - 0.5; iy = (box[2] - lat) / (box[2] - box[0]) * H - 0.5
    if img.ndim == 2: return ndimage.map_coordinates(img, [iy, ix], order=order, mode='nearest')
    return np.stack([ndimage.map_coordinates(img[..., c], [iy, ix], order=order, mode='nearest') for c in range(img.shape[2])], -1)

def shade(h, spacing, sun_dir, sunI, hemiI, shadows=True):
    """The game's light on a ground of heights h (grid spacing in metres; sun_dir: the sun's direction in the grid's axes, x right, y up, z down):
    a sky light (more on the flat) and the sun's, with its shadows. Returns the light on the ground relative to the flat ground's."""
    gz, gx = np.gradient(h, spacing)
    n = np.stack([-gx, np.ones_like(h), -gz], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    d = np.array(sun_dir, dtype=np.float64); d /= np.linalg.norm(d)
    lam = np.clip(n @ d, 0, None)
    if shadows:   # the sun's shadows: a point is in shade if the land between it and the sun rises above the sun's ray
        hd = math.hypot(d[0], d[2]); ux, uz = d[0] / hd, d[2] / hd; tan = d[1] / hd
        yy, xx = np.mgrid[0:h.shape[0], 0:h.shape[1]].astype(np.float64); sh = np.zeros(h.shape, bool); step = 1.5
        for kk in range(1, int(math.ceil((h.max() - h.min()) / (tan * spacing * step))) + 2):
            t = kk * step
            if t * spacing > 6000: break
            hh = ndimage.map_coordinates(h, [yy + uz * t, xx + ux * t], order=1, mode='nearest')
            sh |= hh > h + tan * spacing * t
        sm = ndimage.gaussian_filter(sh.astype(np.float32), 1.2); lam = lam * (1 - SHADOW_K * sm)
    ny = n[..., 1]
    flat = hemiI + sunI * d[1]
    return (hemiI * (0.55 + 0.45 * ny) + sunI * lam) / flat

def paint_land(F):
    """The painted land in the tile's frame (output grid): the colours by land cover (season and snow as the game shows them), the heights
    and the land cover classes (kept in raw/wide/), and the theme's sun on them. Returns albedo (ho, wo, 3 float 0..255), heights, shading,
    classes."""
    cache = os.path.join(HERE, 'raw', 'wide', '%s_%d_%g.npz' % (F.tid, F.ext, F.f))
    z = np.load(cache) if os.path.exists(cache) and not os.environ.get('WIDE_REPAINT') else None
    if z is not None and 'lc' in z.files: alb, h, lc = z['alb'], z['h'], z['lc']
    else:
        alb, h, lc = _paint_land(F); os.makedirs(os.path.dirname(cache), exist_ok=True); np.savez(cache, alb=alb, h=h, lc=lc)
    # the sun in the output grid's axes: x right, z down in the tile; the world's vector (sx east, sz south) turned by the tile's fit
    sv, sunI, hemiI = SUN[THEME[F.tid]]; sx, sy, sz = sv
    su = (F.A * sx - F.B * sz) / F.k; sv_ = (F.B * sx + F.A * sz) / F.k
    # (a shortened copy of a road has its world squeezed: the slopes are shaded as the real land's, not the squeezed ones)
    sh = shade(h, F.mpp / F.f * F.scale, [su, sy, sv_], sunI, hemiI)
    return alb, h, sh, lc

def _paint_land(F):
    """The painted land in the tile's frame (output grid): the colours by land cover (season and snow as the game shows them) and the heights."""
    px, py = F.px(); x, z = F.world(px, py); la, lo = F.geo.to_ll(x, z)
    m = 0.01; box = (float(la.min()) - m, float(lo.min()) - m, float(la.max()) + m, float(lo.max()) + m)
    M, N = radii((box[0] + box[2]) / 2); wkm = (box[3] - box[1]) * math.pi / 180 * N * math.cos(math.radians((box[0] + box[2]) / 2)); hkm = (box[2] - box[0]) * math.pi / 180 * M
    n = int(min(2560, max(512, round(max(wkm, hkm) / 11.0))))   # (about 11 m a pixel, the land cover's 10 m)
    print(F.tid, 'painted box %.1f x %.1f km, %d px' % (wkm / 1000, hkm / 1000, n), flush=True)
    rgb, hp, lc = paint((box[0], box[1], box[2], box[3]), n, DETAIL, 12, zfac=1.0, detail=1.0, lc_res=n, seed=5, season=SEASON.get(F.tid), relief=0.0)
    alb = sample(rgb.astype(np.float32), la, lo, box)
    dem = DEM(box[0] - 0.02, box[1] - 0.02, box[2] + 0.02, box[3] + 0.02, 12); h = dem.sample(la, lo).astype(np.float32)
    h = ndimage.gaussian_filter(h, 0.8)
    lc_o = sample(lc, la, lo, box, order=0).astype(np.uint8)
    return alb, h, lc_o

def lowpass(a, sigma):
    return ndimage.gaussian_filter(a, (sigma, sigma, 0) if a.ndim == 3 else sigma)

def push_out(rgb, alpha):
    """The island's colours carried outwards over the transparent pixels (nearest opaque pixel's colour), so a soft edge never blends to black."""
    inside = alpha > 0.5
    idx = ndimage.distance_transform_edt(~inside, return_distances=False, return_indices=True)
    return rgb[idx[0], idx[1]]

def island(tid, wet):
    """The island render (raw/maps/isle-<id>[-rain].png, no made-up land): colours and coverage at the tile's size."""
    im = Image.open(os.path.join(HERE, 'raw', 'maps', 'isle-%s%s.png' % (tid, '-rain' if wet else ''))).convert('RGBA'); a = np.asarray(im).astype(np.float32)
    return a[..., :3], a[..., 3] / 255.0

def island_mask(alpha, mpp, ring_px=None):
    """Where the island is, with a soft edge: its ragged rim of bare ground cells cut off (RING_M), the edge feathered. The tile's own edge
    counts as an edge (the land beyond it is the painted land). Small holes are filled, a big one (Nordschleife's infield) stays."""
    a = alpha > 0.5
    a = ndimage.binary_opening(a, iterations=2)
    holes = ndimage.binary_fill_holes(a) & ~a; hl, hn = ndimage.label(holes)
    if hn:
        hs = ndimage.sum(holes, hl, range(1, hn + 1)); small = np.zeros(hn + 1, bool); small[1:] = np.asarray(hs) < 3000; a = a | small[hl]
    lab, n = ndimage.label(a)
    if n > 1:
        sizes = ndimage.sum(a, lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = np.asarray(sizes) > 600; a = keep[lab]
    pad = np.pad(a, 2, constant_values=False)
    dist = ndimage.distance_transform_edt(pad)[2:-2, 2:-2]
    ring = ring_px if ring_px is not None else min(60.0, max(8.0, RING_M / mpp))
    t = np.clip((dist - ring) / FEATHER + 0.5, 0, 1); t = t * t * (3 - 2 * t)
    return ndimage.gaussian_filter(t, 2.0).astype(np.float32)

def to_tile(img, F, order=1):
    """An output-grid picture (WIDE_F of the tile's pixels, the margin included) at the tile's own pixels, the margin included."""
    h, w = img.shape[:2]; W, H = F.W + 2 * F.ext, F.H + 2 * F.ext
    zy, zx = H / h, W / w
    return ndimage.zoom(img, (zy, zx, 1) if img.ndim == 3 else (zy, zx), order=order)[:H, :W]

def match_to_island(bg_t, isle, m, F, lc_t, alb_t):
    """The painted land (at the tile's pixels, margin included) brought to the island's colours. First by kind of land: for each land cover class
    that the island has enough of, the ratio of the island's colours to the painted land's there (mostly the brightness, a part of the
    colour), applied to that class over the whole land (so the game's dull olive grass is the land's grass, its snow is its snow); then a
    local residual near the island, fading with the distance (no step at the edge). Returns the matched land and the overall brightness ratio."""
    e = F.ext; H, W = F.H, F.W
    mm = np.zeros(bg_t.shape[:2], np.float32); mm[e:e + H, e:e + W] = m
    ii = np.zeros_like(bg_t); ii[e:e + H, e:e + W] = isle
    wgt = np.clip((mm - 0.6) / 0.4, 0, 1)   # only well inside the island
    eps = 1e-3; lumw = np.array([0.299, 0.587, 0.114], np.float32)
    g_l = float(np.clip(((ii * wgt[..., None]).sum((0, 1)) @ lumw) / max(float(((bg_t * wgt[..., None]).sum((0, 1)) @ lumw)), eps), 0.5, 2.5))
    def chroma_led(r, keep):   # a ratio per channel: the brightness ratio in full, a part (keep) of the colour change
        l = float(r @ lumw); return l * (1 + keep * (r / max(l, eps) - 1))
    G = np.zeros(bg_t.shape, np.float32); wsum = np.zeros(bg_t.shape[:2], np.float32); used = []
    inside = wgt > 0.5
    for k in np.unique(lc_t):
        mk = (lc_t == k) & inside
        if mk.sum() < 4000: continue
        r = (ii[mk].sum(0) / np.maximum(bg_t[mk].sum(0), eps)).astype(np.float32); r = np.clip(chroma_led(r, 0.6), 0.45 * g_l, 2.2 * g_l)
        w = ndimage.gaussian_filter((lc_t == k).astype(np.float32), 2.0); G += w[..., None] * r; wsum += w; used.append((int(k), int(mk.sum()), np.round(r, 2).tolist()))
    g_free = float(np.clip(g_l, 0.7, 1.35))   # (a kind of land the island has none of: only a little of the brightness change)
    G = G + np.clip(1 - wsum, 0, 1)[..., None] * g_free
    G = G / np.maximum(wsum + np.clip(1 - wsum, 0, 1), eps)[..., None]
    # snow and other whites: the brightness change only, never a tint
    white = np.clip((alb_t.min(-1) - 170) / 50, 0, 1)[..., None]
    Gl = (G @ lumw)[..., None]; G = Gl + (1 - white) * (G - Gl)
    base = np.clip(bg_t * G, 0, 255)
    lw = lowpass(wgt, 28)
    num = lowpass(ii * wgt[..., None], 28); den = lowpass(base * wgt[..., None], 28)
    r_in = np.where(lw[..., None] > 0.02, num / np.maximum(den, eps), 1.0)   # the local ratio where the island is
    wspread = np.clip(lw * 4, 0, 1)
    rs = lowpass(r_in * wspread[..., None], 45) / np.maximum(lowpass(wspread, 45), 1e-3)[..., None]
    rs = np.clip(rs, 0.8, 1.3)
    lum = (rs * lumw).sum(-1, keepdims=True)   # the tone follows the island's brightness, only a little of its colour
    rs = lum * (1 + 0.25 * (rs / lum - 1))
    d = ndimage.distance_transform_edt(wgt < 0.5)
    fall = np.exp(-d / 90.0)
    fall = (fall * (1 - ndimage.gaussian_filter(((lc_t == 80) | (lc_t == 0)).astype(np.float32), 2.0)))[..., None]   # (not on water: no bright halo on the sea round the island)
    if VERBOSE: print('  classes matched:', used, flush=True)
    return np.clip(base * (1 + (rs - 1) * fall), 0, 255), g_l

def wet_grade(dry_i, wet_i, m, F):
    """The rain's grade from the dry island to the wet one, over the pixels well inside the island: how much darker (gain), how much less
    colourful (sat), and a slight tint per channel (k). Applied as gain * (lum + sat * (colour - lum)) * k, so the painted land keeps its own
    contrast (a fit with an offset blows up where the island has few colours)."""
    w = np.clip((m - 0.6) / 0.4, 0, 1) > 0.5; lumw = np.array([0.299, 0.587, 0.114], np.float32)
    a = lowpass(dry_i, 3)[w]; b = lowpass(wet_i, 3)[w]; la = a @ lumw; lb = b @ lumw
    gain = float(np.clip(lb.sum() / max(la.sum(), 1e-3), 0.45, 1.05))
    ca = a - la[:, None]; cb = b - lb[:, None]
    sat = float(np.clip((ca * cb).sum() / max((ca * ca).sum(), 1e-3), 0.3, 1.0))
    model = gain * (la[:, None] + sat * ca)
    k = np.clip(b.sum(0) / np.maximum(model.sum(0), 1e-3), 0.85, 1.15).astype(np.float32)
    return gain, sat, k

def apply_wet(bg, grade):
    gain, sat, k = grade; lumw = np.array([0.299, 0.587, 0.114], np.float32)
    L = (bg @ lumw)[..., None]
    return np.clip(gain * (L + sat * (bg - L)) * k, 0, 255)

def save_webp(arr, path, q=80, alpha=None):
    if alpha is None: Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(path, 'WEBP', quality=q, method=6)
    else:
        rgba = np.dstack([np.clip(arr, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(path, 'WEBP', quality=q, alpha_quality=92, method=6)
    return os.path.getsize(path)

def build(tid):
    F = Frame(tid)
    alb, h, sh, lc = paint_land(F)
    bg = np.clip(alb * sh[..., None], 0, 255).astype(np.float32)
    isle_d, a_d = island(tid, False); isle_w, a_w = island(tid, True)
    if tid in WATER_OUT:   # the sea plane: blue, smooth; the boats, piers and buildings on it stay
        wat = (isle_d[..., 2] > 110) & (isle_d[..., 2] > isle_d[..., 0] + 45) & (isle_d[..., 2] > isle_d[..., 1] + 20)
        wat = ndimage.binary_dilation(wat, iterations=1); a_d = a_d * (~wat)
    m = island_mask(a_d, F.mpp, RING_PX.get(tid))
    bg_t = to_tile(bg, F)
    lc_t = to_tile(lc, F, order=0)
    alb_t = to_tile(alb, F)
    bg_m, g = match_to_island(bg_t, isle_d, m, F, lc_t, alb_t)   # (the dry land at the tile's pixels)
    # the wet land: the same grade as the island's
    grade = wet_grade(isle_d, isle_w, m, F)
    bg_w = apply_wet(bg_m, grade)
    # back to the output grid's size for the files (the land is seen from afar)
    def small(a): return ndimage.zoom(a, (F.ho / a.shape[0], F.wo / a.shape[1], 1), order=1)
    out = {}
    out['wide'] = small(bg_m); out['wide-rain'] = small(bg_w)
    rgb_d = push_out(isle_d, a_d); rgb_w = push_out(isle_w, a_d)
    out['isle'] = (rgb_d, m); out['isle-rain'] = (rgb_w, m)
    if DEBUG:
        os.makedirs(DEBUG, exist_ok=True)
        e = F.ext
        for nm, base_t, ii in (('dry', bg_m, isle_d), ('wet', bg_w, isle_w)):
            comp = base_t.copy(); reg = comp[e:e + F.H, e:e + F.W]; reg[:] = reg * (1 - m[..., None]) + ii * m[..., None]
            Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save(os.path.join(DEBUG, '%s_comp_%s.png' % (tid, nm)))
        Image.fromarray((m * 255).astype(np.uint8)).save(os.path.join(DEBUG, tid + '_mask.png'))
    return F, out, g, grade

def write(tid, F, out):
    """The four files: the painted land (dry, rain) and the island with its soft edge (dry, rain); returns their size in bytes."""
    tot = 0
    for wet in (0, 1):
        sfx = '-rain' if wet else ''
        tot += save_webp(out['wide-rain' if wet else 'wide'], os.path.join(MAPS, 'wide-%s%s.webp' % (tid, sfx)), 80)
        rgb, m = out['isle-rain' if wet else 'isle']
        tot += save_webp(rgb, os.path.join(MAPS, 'isle-%s%s.webp' % (tid, sfx)), 82, alpha=m)
    return tot

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args: sys.exit(__doc__ or 'usage: python3 wide_map.py vrsic[,pikes,...] [--write] [--paint-only]')
    wide = js_data('menu-data.js', 'window.MENU').get('wideMaps', {})
    for tid in args[0].split(','):
        if '--paint-only' in sys.argv:
            F = Frame(tid); alb, h, sh, lc = paint_land(F); out = np.clip(alb * sh[..., None], 0, 255).astype(np.uint8)
            if DEBUG:
                os.makedirs(DEBUG, exist_ok=True); Image.fromarray(out).save(os.path.join(DEBUG, tid + '_land.png'))
            print(tid, 'output', F.wo, 'x', F.ho, flush=True); continue
        F, out, g, (gain, sat, tint) = build(tid)
        print(tid, 'brightness x%.2f; rain: gain %.2f, saturation %.2f, tint %s' % (g, gain, sat, np.round(tint, 3)), flush=True)
        if wide.get(tid) != F.ext: print(tid, 'WARNING: MENU.wideMaps[%r] is %r, the margin here is %d' % (tid, wide.get(tid), F.ext), flush=True)
        if '--write' in sys.argv: print(tid, 'written', write(tid, F, out) // 1024, 'KB', flush=True)
