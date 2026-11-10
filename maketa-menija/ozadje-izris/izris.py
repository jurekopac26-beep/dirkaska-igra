# Maketa ozadja menija (samo maketa, ni del igre): izris naslovne slike v slogu, ki ga je izbral uporabnik 10. 11. 2026 (svetel poletni
# dan, gorska cesta skozi gozd, naš avto, rumena tabla z državo, daljne gore iz javnih višinskih podatkov). Blender (bpy 5.x, Cycles),
# izris brez povezave; vse, kar je v sliki, nastane tu: drevesa, trava, cvetlice, skale, cesta, tabla in oblaki postopkovno, teren iz
# Copernicus DEM (dem.py), avto iz igre (avto.mjs). Navodila in viri: README.md v tej mapi.
#
# Zagon (python z bpy):  python izris.py <prizor> --dem <dem.npz> --car <avto.json> --tmp <mapa> --out <izhod brez končnice>
#                         [--orient pokonci,lezece] [--scale 0.25] [--samples 96] [--dry]
# Izhod: <out>-pokonci.webp (1080 × 1350) in <out>-lezece.webp (1600 × 900), vsaka do ~300 KB.
import argparse, base64, io, json, math, os, sys, time
import numpy as np
import bpy
from mathutils import Vector
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from scipy import ndimage
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('scene'); ap.add_argument('--dem', required=True); ap.add_argument('--car', required=True)
ap.add_argument('--tmp', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--orient', default='pokonci,lezece'); ap.add_argument('--scale', type=float, default=1.0)
ap.add_argument('--samples', type=int, default=96); ap.add_argument('--seed', type=int, default=11)
ap.add_argument('--dry', action='store_true')  # build the scene only (no render)
A = ap.parse_args()
SCN = json.load(open(os.path.join(HERE, 'prizori.json'))); CFG = SCN[A.scene]
while 'base' in CFG: CFG = {**SCN[CFG['base']], **{k: v for k, v in CFG.items() if k != 'base'}}  # a variant: its base scene (maybe a variant too) with these changes
os.makedirs(A.tmp, exist_ok=True)
RNG = np.random.default_rng(A.seed)
T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)

# ---------------------------------------------------------------- the composition (metres in the view's frame: a to the right, b ahead)
COMP = dict(
    eye=1.35, width=6.2,
    road=[(-6.6, -14), (-5.0, 0), (-3.4, 10), (-2.0, 17), (-1.2, 23), (0.0, 29), (2.6, 35), (7.6, 41.5), (15, 47), (26, 51.5),
          (42, 55), (65, 57.5), (100, 59), (150, 60), (220, 61)],
    car=(-1.75, 16.5), car_head=146.0, sign=(3.9, 27.0), sign_turn=10.0,
    window=(-9.0, 7.0),  # no trees between these bearings (degrees right of the view's axis): the view to the mountains
)
COMP.update(CFG.get('comp', {}))
ORIENT = {'pokonci': dict(res=(1080, 1350), hfov=26.0, horizon=0.5), 'lezece': dict(res=(1600, 900), hfov=46.0, horizon=0.5)}
for k_, v_ in CFG.get('orient', {}).items(): ORIENT[k_].update(v_)
BET = math.radians(CFG['bearing'])
FWD = np.array([math.sin(BET), math.cos(BET)]); RGT = np.array([math.cos(BET), -math.sin(BET)])
def W(a, b):  # view frame -> world x (east), y (north)
    return a * RGT[0] + b * FWD[0], a * RGT[1] + b * FWD[1]
def V(x, y):  # world -> view frame
    return x * RGT[0] + y * RGT[1], x * FWD[0] + y * FWD[1]
def sstep(e0, e1, x):
    t = np.clip((np.asarray(x, float) - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def lin(c):
    c = np.asarray(c, float); return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def hexlin(h): return tuple(lin([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]))

# ---------------------------------------------------------------- the scene
bpy.ops.wm.read_factory_settings(use_empty=True)
SC = bpy.context.scene
SRC = bpy.data.collections.new('viri'); SC.collection.children.link(SRC)
bpy.context.view_layer.layer_collection.children['viri'].exclude = True

def link(ob, coll=None): (coll or SC.collection).objects.link(ob); return ob

def make_mesh(name, Vt, F, uv=None, cols=None, smooth=False, mats=None, matidx=None, validate=True):
    """F: an (n, k) array or a list of faces of any size; uv and CORNER colours follow the corners in that order"""
    Vt = np.ascontiguousarray(Vt, np.float32).reshape(-1, 3)
    if isinstance(F, np.ndarray) and F.ndim == 2: lens = np.full(len(F), F.shape[1]); flat = F.ravel()
    else: lens = np.array([len(f) for f in F]); flat = np.concatenate([np.asarray(f) for f in F])
    me = bpy.data.meshes.new(name); nF = len(lens)
    me.vertices.add(len(Vt)); me.vertices.foreach_set('co', Vt.ravel())
    me.loops.add(len(flat)); me.loops.foreach_set('vertex_index', np.ascontiguousarray(flat, np.int32))
    me.polygons.add(nF); me.polygons.foreach_set('loop_start', np.concatenate([[0], np.cumsum(lens)[:-1]]).astype(np.int32))
    me.update(calc_edges=True)
    if uv is not None:
        ul = me.uv_layers.new(name='UVMap'); ul.data.foreach_set('uv', np.ascontiguousarray(uv, np.float32).ravel())
    if cols is not None:
        for nm, (dom, arr) in cols.items():
            arr = np.ascontiguousarray(arr, np.float32)
            if arr.ndim == 2 and arr.shape[1] in (3, 4):
                if arr.shape[1] == 3: arr = np.hstack([arr, np.ones((len(arr), 1), np.float32)])
                ca = me.color_attributes.new(nm, 'FLOAT_COLOR', dom); ca.data.foreach_set('color', arr.ravel())
            else:
                at = me.attributes.new(nm, 'FLOAT', dom); at.data.foreach_set('value', arr.ravel())
    if smooth:
        me.polygons.foreach_set('use_smooth', np.ones(nF, bool))
    if mats:
        for m in mats: me.materials.append(m)
        if matidx is not None: me.polygons.foreach_set('material_index', np.asarray(matidx, np.int32))
    if validate: me.validate()
    me.update()
    return me

def obj(name, me, coll=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, me); ob.location = loc; ob.rotation_euler = rot; return link(ob, coll)

# ---------------------------------------------------------------- materials (node helpers)
def new_mat(name):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')
def nd(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        if k.startswith('_'): setattr(n, k[1:], v)
        else: n.inputs[k].default_value = v
    return n
def L(nt, a, b): nt.links.new(a, b)
def mrange(nt, src, a, b, c=0.0, d=1.0, smooth=True):
    n = nd(nt, 'ShaderNodeMapRange', **{'From Min': a, 'From Max': b, 'To Min': c, 'To Max': d})
    n.interpolation_type = 'SMOOTHSTEP' if smooth else 'LINEAR'; n.clamp = True; L(nt, src, n.inputs['Value']); return n.outputs[0]
def math_(nt, op, a, b=None, c=None, clamp=False):
    n = nd(nt, 'ShaderNodeMath', _operation=op); n.use_clamp = clamp
    for i, s in enumerate((a, b, c)):
        if s is None: continue
        if isinstance(s, (int, float)): n.inputs[i].default_value = s
        else: L(nt, s, n.inputs[i])
    return n.outputs[0]
def mixc(nt, fac, a, b, blend='MIX'):
    n = nd(nt, 'ShaderNodeMix', _data_type='RGBA', _blend_type=blend)
    for s, v in ((0, fac), (6, a), (7, b)):
        if isinstance(v, (int, float)): n.inputs[s].default_value = v
        elif isinstance(v, tuple): n.inputs[s].default_value = v if len(v) == 4 else v + (1,)
        else: L(nt, v, n.inputs[s])
    return n.outputs[2]
def noise(nt, scale, detail=4.0, rough=0.55, vec=None, dims='3D'):
    n = nd(nt, 'ShaderNodeTexNoise', Scale=scale, Detail=detail, Roughness=rough); n.noise_dimensions = dims
    if vec is not None: L(nt, vec, n.inputs['Vector'])
    return n
def attr(nt, name, kind='GEOMETRY'):
    n = nd(nt, 'ShaderNodeAttribute', _attribute_name=name); n.attribute_type = kind; return n
def principled(nt, base=None, rough=0.5, **kw):
    p = nd(nt, 'ShaderNodeBsdfPrincipled', Roughness=rough)
    if base is not None:
        if isinstance(base, tuple): p.inputs['Base Color'].default_value = base + (1,) if len(base) == 3 else base
        else: L(nt, base, p.inputs['Base Color'])
    for k, v in kw.items():
        if isinstance(v, (int, float)): p.inputs[k].default_value = v
        elif isinstance(v, tuple): p.inputs[k].default_value = v + (1,) if len(v) == 3 else v
        else: L(nt, v, p.inputs[k])
    return p
CAM = Vector((0, 0, COMP['eye']))
HZ = CFG['haze']
def haze(nt, shader_out):
    """aerial perspective: mix toward the haze colour by the distance from the camera (thinner higher up)"""
    g = nd(nt, 'ShaderNodeNewGeometry')
    d = nd(nt, 'ShaderNodeVectorMath', _operation='DISTANCE'); L(nt, g.outputs['Position'], d.inputs[0]); d.inputs[1].default_value = CAM
    sep = nd(nt, 'ShaderNodeSeparateXYZ'); L(nt, g.outputs['Position'], sep.inputs[0])
    hk = math_(nt, 'MULTIPLY_ADD', math_(nt, 'MAXIMUM', sep.outputs[2], 0.0), 1.0 / 3500.0, 1.0)
    dd = math_(nt, 'DIVIDE', d.outputs['Value'], math_(nt, 'MULTIPLY', hk, HZ['dist']))
    f = math_(nt, 'SUBTRACT', 1.0, math_(nt, 'EXPONENT', math_(nt, 'MULTIPLY', dd, -1.0)))
    f = math_(nt, 'MULTIPLY', f, HZ.get('amount', 0.92))
    em = nd(nt, 'ShaderNodeEmission', Color=tuple(HZ['color']) + (1,), Strength=HZ.get('strength', 1.0))
    mx = nd(nt, 'ShaderNodeMixShader'); L(nt, f, mx.inputs[0]); L(nt, shader_out, mx.inputs[1]); L(nt, em.outputs[0], mx.inputs[2])
    return mx.outputs[0]

def mat_simple(name, base, rough=0.5, metal=0.0, coat=0.0, emit=None, hz=False, **kw):
    m, nt, out = new_mat(name)
    p = principled(nt, base, rough, Metallic=metal, **({'Coat Weight': coat, 'Coat Roughness': 0.03} if coat else {}), **kw)
    if emit: p.inputs['Emission Color'].default_value = emit[0] + (1,); p.inputs['Emission Strength'].default_value = emit[1]
    L(nt, haze(nt, p.outputs[0]) if hz else p.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- textures drawn here (own work)
def save_rgba(img, name):
    """keep the colour under the transparent parts (the mean of the opaque ones) so the edges filter clean"""
    a = np.asarray(img).astype(np.float32); al = a[..., 3:4] / 255
    mean = (a[..., :3] * al).sum((0, 1)) / max(al.sum(), 1)
    rgb = a[..., :3] * al + mean * (1 - al); out = np.concatenate([rgb, a[..., 3:4]], -1).clip(0, 255).astype(np.uint8)
    p = os.path.join(A.tmp, name); Image.fromarray(out, 'RGBA').save(p); return p

def tex_needles(name, base, tip, rng):
    S = 2; Wd, Hd = 512 * S, 1024 * S
    im = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    def needles(x0, y0, x1, y1, ln, col, colt, dens=1.0):
        dx, dy = x1 - x0, y1 - y0; L_ = math.hypot(dx, dy) or 1; ux, uy = dx / L_, dy / L_
        n = int(L_ / (2.9 * S / dens))
        for i in range(n):
            t = i / max(n - 1, 1); px, py = x0 + dx * t, y0 + dy * t
            for sgn in (-1, 1):
                ang = math.radians(rng.uniform(48, 72)) * sgn; ca, sa = math.cos(ang), math.sin(ang)
                vx, vy = ux * ca - uy * sa, ux * sa + uy * ca
                l = ln * rng.uniform(0.75, 1.15) * (0.75 + 0.35 * (1 - t))
                c = colt if (t > 0.8 and rng.random() < 0.6) else col
                j = rng.uniform(0.75, 1.2); cc = tuple(int(min(255, v * j)) for v in c) + (255,)
                dr.line([(px, py), (px + vx * l, py + vy * l)], fill=cc, width=int(3.4 * S))
    ax = Wd / 2
    dr.line([(ax, Hd), (ax + 8 * S, 0)], fill=(70, 50, 35, 255), width=int(5 * S))
    y = Hd * 0.97; side = 1
    while y > Hd * 0.04:
        t = 1 - y / Hd; ln = Wd * 0.47 * (0.55 + 0.45 * (1 - t)) * rng.uniform(0.8, 1.05)
        ang = math.radians(rng.uniform(38, 58)); ex = ax + side * ln * math.sin(ang); ey = y - ln * math.cos(ang)
        dr.line([(ax, y), (ex, ey)], fill=(80, 60, 40, 255), width=int(3 * S))
        needles(ax, y, ex, ey, 22 * S, base, tip)
        for k in range(rng.integers(2, 4)):  # small side twigs on the twig
            tt = rng.uniform(0.3, 0.7); bx, by = ax + (ex - ax) * tt, y + (ey - y) * tt; l2 = ln * 0.35
            a2 = math.atan2(ey - y, ex - ax) + side * rng.uniform(0.5, 0.8) * (1 if k % 2 else -1)
            needles(bx, by, bx + l2 * math.cos(a2), by + l2 * math.sin(a2), 18 * S, base, tip, 0.9)
        y -= rng.uniform(17, 27) * S; side = -side
    needles(ax, Hd, ax + 8 * S, 0, 18 * S, base, tip)
    im = im.resize((512, 1024), Image.LANCZOS); return save_rgba(im, name)

def tex_leaves(name, cols, rng, shape='oval'):
    S = 2; N = 512 * S
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    cx, cy = N / 2, N * 0.98
    for tw in range(7):
        ang = math.radians(-90 + rng.uniform(-60, 60)); ln = N * rng.uniform(0.55, 0.85)
        ex, ey = cx + ln * math.cos(ang), cy + ln * math.sin(ang)
        dr.line([(cx, cy), (ex, ey)], fill=(85, 70, 50, 255), width=3 * S)
        for i in range(int(ln / (22 * S))):
            t = (i + 1) / (ln / (22 * S)); px, py = cx + (ex - cx) * t, cy + (ey - cy) * t
            for sgn in (-1, 1):
                a = ang + sgn * math.radians(rng.uniform(30, 75)); sz = rng.uniform(30, 50) * S * (1.1 if shape == 'round' else 1.0)
                lx, ly = px + math.cos(a) * sz * 0.55, py + math.sin(a) * sz * 0.55
                c = cols[rng.integers(len(cols))]; j = rng.uniform(0.82, 1.18); cc = tuple(int(min(255, v * j)) for v in c) + (255,)
                w = sz * (0.62 if shape == 'oval' else 0.85)
                pts = []
                for k in range(16):
                    th = 2 * math.pi * k / 16; r1 = (sz / 2) * (1.0 if shape == 'round' else (1 + 0.25 * math.cos(th)))
                    x_, y_ = r1 * math.cos(th), (w / 2) * math.sin(th)
                    pts.append((lx + x_ * math.cos(a) - y_ * math.sin(a), ly + x_ * math.sin(a) + y_ * math.cos(a)))
                dr.polygon(pts, fill=cc)
                dr.line([(px, py), (lx + math.cos(a) * sz * 0.45, ly + math.sin(a) * sz * 0.45)], fill=tuple(int(v * 0.8) for v in c) + (255,), width=S)
    im = im.resize((512, 512), Image.LANCZOS); return save_rgba(im, name)

def tex_sign(name, text, sub=None):
    Wd, Hd = 2240, 1040
    im = Image.new('RGB', (Wd, Hd), (240, 202, 0)); dr = ImageDraw.Draw(im)
    ins, lw = int(Hd * 0.055), int(Hd * 0.03)
    dr.rounded_rectangle([ins, ins, Wd - ins, Hd - ins], radius=int(Hd * 0.07), outline=(30, 30, 30), width=lw)
    fp = next((f for f in ('/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf', '/usr/share/fonts/opentype/inter/Inter-Bold.otf',
                           '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') if os.path.exists(f)), None)
    size = int(Hd * 0.5)
    while True:
        font = ImageFont.truetype(fp, size); bb = dr.textbbox((0, 0), text, font=font)
        if bb[2] - bb[0] < Wd * (0.66 if sub else 0.8) or size < 40: break
        size -= 8
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    x0 = (Wd - tw) / 2 - bb[0] - (Wd * 0.07 if sub else 0); y0 = (Hd - th) / 2 - bb[1]
    dr.text((x0, y0), text, font=font, fill=(30, 30, 30))
    if sub:
        f2 = ImageFont.truetype(fp, int(size * 0.42)); lay = Image.new('L', (Wd, Hd), 0); d2 = ImageDraw.Draw(lay)
        d2.text((x0 + tw + Hd * 0.08, Hd * 0.5), sub, font=f2, fill=255)
        lay = lay.transform(lay.size, Image.AFFINE, (1, 0.22, -Hd * 0.11, 0, 1, 0), Image.BICUBIC)
        im.paste((30, 30, 30), mask=lay)
    a = np.asarray(im).astype(np.float32) / 255
    yy = np.linspace(0, 1, Hd)[:, None, None]; xx = np.linspace(0, 1, Wd)[None, :, None]
    grime = 1 - 0.10 * sstep(0.7, 1.0, yy) - 0.04 * sstep(0.85, 1.0, np.abs(xx - 0.5) * 2)
    n = ndimage.gaussian_filter(RNG.normal(0, 1, (Hd // 8, Wd // 8)), 2.0); n = np.kron(n, np.ones((8, 8)))[:Hd, :Wd, None]
    a = a * grime * (1 + 0.035 * n / (n.std() + 1e-6))
    p = os.path.join(A.tmp, name); Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8)).save(p); return p

def img(path, alpha=False, non_color=False):
    im = bpy.data.images.load(path); im.alpha_mode = 'STRAIGHT' if alpha else 'NONE'
    if non_color: im.colorspace_settings.name = 'Non-Color'
    return im

# ---------------------------------------------------------------- world: deep blue sky, a dimmer one for the light; the sun
def world():
    w = bpy.data.worlds.new('nebo'); SC.world = w
    if not w.node_tree:
        try: w.use_nodes = True
        except Exception: pass
    nt = w.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputWorld')
    tc = nd(nt, 'ShaderNodeTexCoord'); sep = nd(nt, 'ShaderNodeSeparateXYZ'); L(nt, tc.outputs['Generated'], sep.inputs[0])
    z = math_(nt, 'MAXIMUM', sep.outputs[2], 0.0)
    t = math_(nt, 'POWER', z, 0.3)
    sky = CFG.get('sky', {})
    hor = tuple(sky.get('horizon', (0.40, 0.56, 0.86))); zen = tuple(sky.get('zenith', (0.012, 0.05, 0.31)))
    c = mixc(nt, t, hor, zen)
    gnd = mixc(nt, mrange(nt, sep.outputs[2], -0.08, 0.0), (0.05, 0.06, 0.04), hor)
    c = mixc(nt, mrange(nt, sep.outputs[2], -0.002, 0.004), gnd, c)
    lp = nd(nt, 'ShaderNodeLightPath')
    k = math_(nt, 'MULTIPLY_ADD', lp.outputs['Is Camera Ray'], 1.0 - sky.get('light', 0.9), sky.get('light', 0.9))
    bg = nd(nt, 'ShaderNodeBackground'); L(nt, c, bg.inputs['Color']); L(nt, math_(nt, 'MULTIPLY', k, sky.get('strength', 1.0)), bg.inputs['Strength'])
    L(nt, bg.outputs[0], out.inputs[0])
    az, el = math.radians(CFG['sun']['az']), math.radians(CFG['sun']['el'])
    d = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))
    ld = bpy.data.lights.new('sonce', 'SUN'); ld.energy = CFG['sun'].get('strength', 4.4); ld.angle = math.radians(0.6)
    ld.color = tuple(CFG['sun'].get('color', (1.0, 0.965, 0.91)))
    so = bpy.data.objects.new('sonce', ld); so.rotation_mode = 'QUATERNION'; so.rotation_quaternion = d.to_track_quat('Z', 'Y'); link(so)
    return d

# ---------------------------------------------------------------- terrain from the DEM (far mountains), flattened round the view
def terrain():
    D = np.load(A.dem); xs, ys, Zabs, h0 = D['xs'], D['ys'], D['Zabs'].astype(np.float64), float(D['h0'])
    st = float(xs[1] - xs[0]); X, Y = np.meshgrid(xs, ys); dist = np.hypot(X, Y)
    G = ndimage.gaussian_filter(ndimage.grey_opening(Zabs, size=(7, 7)), 1.0)
    CH = np.clip(Zabs - G, 0, 45); fo0 = sstep(5, 10, ndimage.gaussian_filter(CH, 0.7))
    gy, gx = np.gradient(G, st); slope = np.degrees(np.arctan(np.hypot(gx, gy))); north = -gy / (np.hypot(gx, gy) + 1e-6)
    drop = dist ** 2 / (2 * 6371000) * (1 - 0.13)
    relb = (np.degrees(np.arctan2(X, Y)) - CFG['bearing'] + 180) % 360 - 180
    cl = CFG.get('clear', [13, 2600])
    clear = (1 - sstep(cl[0] - 3, cl[0] + 2, np.abs(relb))) * (1 - sstep(cl[1] - 600, cl[1], dist))
    cn = CFG.get('canopy', [1250, 1800])  # the DSM's canopy on the terrain from here out (nearer: instanced trees)
    wcan = sstep(cn[0], cn[1], dist) * (1 - clear)
    r0, r1 = CFG['flat']
    Zg = ((G - h0 - drop) + CH * wcan) * sstep(r0, r1, dist)
    # colours (linear) by height, slope and cover, with patches
    def field(sig, sh=None):
        n = ndimage.gaussian_filter(RNG.normal(0, 1, sh or Zabs.shape), sig); return n / (n.std() + 1e-9)
    n1, n2, n3 = field(1.5), field(6), field(0.8)
    fc = CFG.get('forest_cover', 0.0)  # where the DSM misses the canopy: forest in patches below the tree line ([amount, from, to] of the noise)
    fa, f0, f1 = (fc, -0.5, 0.4) if isinstance(fc, (int, float)) else fc
    if fa: fo0 = np.maximum(fo0, fa * sstep(f0, f1, n2) * (1 - sstep(CFG['treeline'] - 150, CFG['treeline'] + 50, G)))
    e = G
    tl = CFG['treeline']
    green1, green2 = (np.array(lin(c)) for c in CFG.get('meadow', ([0.36, 0.47, 0.18], [0.52, 0.55, 0.26])))
    meadow = green1 + (green2 - green1) * sstep(-1, 1.2, n2)[..., None]
    if CFG.get('fields'):
        fm = sstep(0.4, 0.9, n1) * (1 - sstep(tl - 600, tl - 300, e))
        meadow = meadow * (1 - fm[..., None]) + np.array(lin([0.62, 0.58, 0.33]))[None, None] * fm[..., None]
    conif, broad = np.array(lin(CFG.get('forest', [0.12, 0.19, 0.10]))), np.array(lin(CFG.get('forest2', [0.22, 0.32, 0.13])))
    forest = conif + (broad - conif) * (sstep(0, 1.5, n2) * CFG.get('broadleaf', 0.4))[..., None]
    fmask = fo0 * (1 - sstep(tl - 80, tl + 120, e + 60 * n3)) * (1 - sstep(42, 52, slope))
    col = meadow * (1 - fmask[..., None]) + forest * fmask[..., None]
    alp = sstep(tl - 60, tl + 200, e + 70 * n3)
    col = col * (1 - alp[..., None]) + np.array(lin(CFG.get('alpine', [0.45, 0.44, 0.27])))[None, None] * alp[..., None]
    rk = CFG['rock']
    rockm = np.maximum(sstep(rk['h'] - rk['spread'], rk['h'] + rk['spread'], e + rk['spread'] * 0.6 * n1), sstep(36, 48, slope) * sstep(tl - 300, tl, e))
    rc = np.array(lin(rk['color'])) * (1 + 0.18 * np.clip(n3, -2, 2))[..., None]
    col = col * (1 - rockm[..., None]) + rc * rockm[..., None]
    sn = CFG['snow']
    snow = sstep(sn['h'] - sn['spread'], sn['h'] + sn['spread'], e + sn['spread'] * 0.9 * n3 + 140 * north) * (1 - sstep(sn['slope'] - 6, sn['slope'] + 6, slope))
    col = col * (1 - snow[..., None]) + np.array([0.86, 0.88, 0.92])[None, None] * snow[..., None]
    fo_sh = fmask * (1 - snow) * sstep(900, 1600, dist)
    keep = ((np.abs(relb) < 78) & (dist < 47000)) | (dist < 900)
    ny, nx = Zg.shape
    vid = -np.ones(Zg.shape, np.int64); vid[keep] = np.arange(keep.sum())
    q = keep[:-1, :-1] & keep[1:, :-1] & keep[1:, 1:] & keep[:-1, 1:]
    ii, jj = np.nonzero(q)
    F = np.stack([vid[ii, jj], vid[ii, jj + 1], vid[ii + 1, jj + 1], vid[ii + 1, jj]], 1)
    Vt = np.stack([X[keep], Y[keep], Zg[keep]], 1)
    m = make_mesh('teren', Vt, F, cols={'col': ('POINT', col[keep]), 'fo': ('POINT', fo_sh[keep])}, smooth=True, mats=[mat_terrain()])
    obj('teren', m)
    log('terrain', len(Vt), 'verts')
    return dict(X=X, Y=Y, Z=Zg, xs=xs, ys=ys, st=st, fo=fo0 * (1 - sstep(tl - 80, tl + 60, e)) * (1 - sstep(42, 52, slope)), CH=CH, clear=clear, dist=dist, relb=relb)

def mat_terrain():
    m, nt, out = new_mat('teren')
    col = attr(nt, 'col').outputs['Color']; fo = attr(nt, 'fo').outputs['Fac']
    g = nd(nt, 'ShaderNodeNewGeometry'); pos = g.outputs['Position']
    d = nd(nt, 'ShaderNodeVectorMath', _operation='DISTANCE'); L(nt, pos, d.inputs[0]); d.inputs[1].default_value = (0, 0, 0)
    # near: the meadow's ground under the grass
    nn = noise(nt, 0.35, 6, 0.6, pos)
    g0, g1, g2 = CFG.get('ground', ([0.20, 0.26, 0.09], [0.30, 0.33, 0.13], [0.24, 0.20, 0.12]))
    near = mixc(nt, mrange(nt, nn.outputs['Fac'], 0.35, 0.65), tuple(lin(g0)), tuple(lin(g1)))
    near = mixc(nt, mrange(nt, noise(nt, 2.5, 3, 0.5, pos).outputs['Fac'], 0.55, 0.75), near, tuple(lin(g2)))
    base = mixc(nt, mrange(nt, d.outputs['Value'], 160, 420, 1.0, 0.0), col, near)
    # crowns in the forest from afar; large patches
    vo = nd(nt, 'ShaderNodeTexVoronoi', Scale=0.14); L(nt, pos, vo.inputs['Vector'])
    crown = mrange(nt, vo.outputs['Distance'], 0.0, 0.9, 1.25, 0.45)
    cm = mixc(nt, fo, (1, 1, 1), crown, 'MIX')
    base = mixc(nt, 1.0, base, cm, 'MULTIPLY')
    big = mrange(nt, noise(nt, 0.004, 3, 0.5, pos).outputs['Fac'], 0.3, 0.7, 0.86, 1.12, False)
    base = mixc(nt, 1.0, base, mixc(nt, big, (0, 0, 0), (1, 1, 1)), 'MULTIPLY')
    b = nd(nt, 'ShaderNodeBump', Strength=0.35, Distance=1.0); L(nt, vo.outputs['Distance'], b.inputs['Height'])
    p = principled(nt, base, 0.93, **{'Specular IOR Level': 0.25}); L(nt, b.outputs[0], p.inputs['Normal'])
    L(nt, haze(nt, p.outputs[0]), out.inputs[0]); return m

def zat(T, x, y):
    """the terrain's height at world x, y (bilinear on the grid)"""
    fx = (np.asarray(x) - T['xs'][0]) / T['st']; fy = (np.asarray(y) - T['ys'][0]) / T['st']
    i0 = np.clip(np.floor(fy).astype(int), 0, T['Z'].shape[0] - 2); j0 = np.clip(np.floor(fx).astype(int), 0, T['Z'].shape[1] - 2)
    ty, tx = np.clip(fy - i0, 0, 1), np.clip(fx - j0, 0, 1); Z = T['Z']
    return Z[i0, j0] * (1 - tx) * (1 - ty) + Z[i0, j0 + 1] * tx * (1 - ty) + Z[i0 + 1, j0] * (1 - tx) * ty + Z[i0 + 1, j0 + 1] * tx * ty
def gridval(T, G, x, y):
    j = np.clip(np.round((np.asarray(x) - T['xs'][0]) / T['st']).astype(int), 0, G.shape[1] - 1)
    i = np.clip(np.round((np.asarray(y) - T['ys'][0]) / T['st']).astype(int), 0, G.shape[0] - 1); return G[i, j]

# ---------------------------------------------------------------- the road
def catmull(P, n=24):
    P = np.asarray(P, float); P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]]); out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2]); out = np.array(out)
    s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(out, axis=0).T))]); ss = np.arange(0, s[-1], 0.5)
    return np.stack([np.interp(ss, s, out[:, 0]), np.interp(ss, s, out[:, 1])], 1), ss

def road():
    if not COMP['road']:  # no road (the car parked on the meadow): a far point keeps the distance tests simple
        C = np.array([[1e6, 1e6], [1e6 + 1, 1e6]]); return C, cKDTree(C)
    C, s = catmull(COMP['road']); w = COMP['width']
    t = np.gradient(C, axis=0); t /= np.linalg.norm(t, axis=1)[:, None]; nr = np.stack([t[:, 1], -t[:, 0]], 1)  # to the right
    us = np.array([-w / 2 - 0.9, -w / 2 - 0.02, -w / 2, -w / 4, 0, w / 4, w / 2, w / 2 + 0.02, w / 2 + 0.9])
    zc = lambda u: np.where(np.abs(u) <= w / 2, 0.045 + 0.05 * (1 - (2 * u / w) ** 2), 0.045 - 0.04 * np.clip((np.abs(u) - w / 2) / 0.9, 0, 1))
    n, k = len(C), len(us)
    P = C[:, None, :] + nr[:, None, :] * us[None, :, None]
    x, y = W(P[..., 0], P[..., 1]); z = np.broadcast_to(zc(us)[None, :], (n, k))
    Vt = np.stack([x, y, z], -1).reshape(-1, 3)
    idx = np.arange(n * k).reshape(n, k)
    F, MI, UV = [], [], []
    for j in range(k - 1):
        f = np.stack([idx[:-1, j], idx[:-1, j + 1], idx[1:, j + 1], idx[1:, j]], 1); F.append(f)
        mi = 0 if (us[j] >= -w / 2 - 1e-6 and us[j + 1] <= w / 2 + 1e-6) else 1
        MI.append(np.full(len(f), mi))
        uv = np.stack([np.stack([us[j] + 0 * s[:-1], s[:-1]], 1), np.stack([us[j + 1] + 0 * s[:-1], s[:-1]], 1), np.stack([us[j + 1] + 0 * s[1:], s[1:]], 1), np.stack([us[j] + 0 * s[1:], s[1:]], 1)], 1)
        UV.append(uv)
    F = np.concatenate(F); MI = np.concatenate(MI); UV = np.concatenate(UV).reshape(-1, 2)
    m = make_mesh('cesta', Vt, F, uv=UV, smooth=True, mats=[mat_road(w), mat_shoulder()], matidx=MI)
    obj('cesta', m)
    return C, cKDTree(C)

def mat_road(w):
    m, nt, out = new_mat('asfalt')
    uv = nd(nt, 'ShaderNodeUVMap'); sep = nd(nt, 'ShaderNodeSeparateXYZ'); L(nt, uv.outputs[0], sep.inputs[0])
    u, v = sep.outputs[0], sep.outputs[1]; au = math_(nt, 'ABSOLUTE', u)
    g = nd(nt, 'ShaderNodeNewGeometry'); pos = g.outputs['Position']
    n1 = noise(nt, 1.6, 8, 0.6, pos); n2 = noise(nt, 0.12, 4, 0.5, pos)
    base = mixc(nt, mrange(nt, n1.outputs['Fac'], 0.3, 0.7), tuple(lin([0.20, 0.20, 0.21])), tuple(lin([0.29, 0.29, 0.29])))
    base = mixc(nt, mrange(nt, n2.outputs['Fac'], 0.58, 0.68, 0, 0.6), base, tuple(lin([0.15, 0.15, 0.16])))  # repair patches
    agg = nd(nt, 'ShaderNodeTexVoronoi', Scale=95.0); L(nt, pos, agg.inputs['Vector'])
    base = mixc(nt, mrange(nt, agg.outputs['Distance'], 0.0, 0.22, 0.35, 0.0), base, tuple(lin([0.52, 0.51, 0.50])))
    # the wheel tracks: a little lighter and smoother
    trk = math_(nt, 'MULTIPLY', mrange(nt, math_(nt, 'ABSOLUTE', math_(nt, 'SUBTRACT', au, w * 0.22)), 0.55, 0.15), 0.55)
    base = mixc(nt, math_(nt, 'MULTIPLY', trk, 0.35), base, tuple(lin([0.33, 0.33, 0.33])))
    # the edge lines: solid white, 0.15 m, 0.25 m in from the asphalt's edge; worn by noise
    e0, e1 = w / 2 - 0.40, w / 2 - 0.25
    line = math_(nt, 'MULTIPLY', mrange(nt, au, e0 - 0.008, e0 + 0.008), mrange(nt, au, e1 + 0.008, e1 - 0.008))
    wear = mrange(nt, noise(nt, 9.0, 6, 0.6, pos).outputs['Fac'], 0.30, 0.50, 0.55, 1.0)
    line = math_(nt, 'MULTIPLY', line, wear)
    base = mixc(nt, line, base, tuple(lin([0.86, 0.86, 0.84])))
    rough = math_(nt, 'MULTIPLY_ADD', line, -0.25, math_(nt, 'MULTIPLY_ADD', trk, -0.12, 0.9))
    b = nd(nt, 'ShaderNodeBump', Strength=0.25, Distance=0.004); L(nt, agg.outputs['Distance'], b.inputs['Height'])
    p = principled(nt, base, 0.85, **{'Specular IOR Level': 0.4}); L(nt, rough, p.inputs['Roughness']); L(nt, b.outputs[0], p.inputs['Normal'])
    L(nt, p.outputs[0], out.inputs[0]); return m

def mat_shoulder():
    m, nt, out = new_mat('bankina'); g = nd(nt, 'ShaderNodeNewGeometry')
    n1 = noise(nt, 6.0, 6, 0.65, g.outputs['Position'])
    base = mixc(nt, mrange(nt, n1.outputs['Fac'], 0.35, 0.65), tuple(lin([0.30, 0.28, 0.24])), tuple(lin([0.20, 0.22, 0.12])))
    b = nd(nt, 'ShaderNodeBump', Strength=0.5, Distance=0.02); L(nt, n1.outputs['Fac'], b.inputs['Height'])
    p = principled(nt, base, 0.95); L(nt, b.outputs[0], p.inputs['Normal']); L(nt, p.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- trees (own procedural models)
def ring(z, r, n, ox=0, oy=0): th = np.linspace(0, 2 * np.pi, n, endpoint=False); return np.stack([ox + r * np.cos(th), oy + r * np.sin(th), np.full(n, z)], 1)

class MB:
    """a small mesh builder (quads/tris with per-corner uvs and a material index)"""
    def __init__(s): s.V, s.F, s.UV, s.M, s.C = [], [], [], [], []
    def add(s, verts, faces, uvs=None, mi=0, col=None):
        o = sum(len(v) for v in s.V); s.V.append(np.asarray(verts, float))
        for k, f in enumerate(faces):
            f = list(f)
            s.F.append([o + i for i in f]); s.M.append(mi)
            s.UV.extend(list(uvs[k])[:len(f)] if uvs is not None else [(0, 0)] * len(f))
        if col is not None: s.C.append(np.broadcast_to(np.asarray(col, float), (len(verts), 4)))
    def mesh(s, name, mats, cols=False):
        Vt = np.concatenate(s.V); F = s.F; UV = np.array(s.UV, float).reshape(-1, 2)
        c = {'col': ('POINT', np.concatenate(s.C))} if cols else None
        return make_mesh(name, Vt, F, uv=UV, mats=mats, matidx=s.M, smooth=True, cols=c)

def cylinder(mb, z0, z1, r0, r1, n=8, mi=0, ox=0, oy=0, axis=None):
    a = ring(z0, r0, n, ox, oy); b = ring(z1, r1, n, ox, oy)
    if axis is not None:  # a tilted limb: from p0 along the unit vector
        p0, d, ln = axis; d = np.asarray(d, float); up = np.array([0, 0, 1.0]) if abs(d[2]) < 0.95 else np.array([1.0, 0, 0])
        e1 = np.cross(d, up); e1 /= np.linalg.norm(e1); e2 = np.cross(d, e1); th = np.linspace(0, 2 * np.pi, n, endpoint=False)
        a = np.array([p0 + r0 * (math.cos(t) * e1 + math.sin(t) * e2) for t in th]); b = np.array([p0 + d * ln + r1 * (math.cos(t) * e1 + math.sin(t) * e2) for t in th])
    faces = [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    uvs = [[(i / n, 0), ((i + 1) / n, 0), ((i + 1) / n, (z1 - z0) / 2), (i / n, (z1 - z0) / 2)] for i in range(n)]
    mb.add(np.vstack([a, b]), faces, uvs, mi)

def conifer(rng, H, kind):
    """a spruce or fir: trunk, a dark core, whorls of needle sprays (and the hanging curtains of the spruce)"""
    P = dict(spruce=dict(R=0.155, p=0.95, droop=0.30, hb=0.04, up=0.25, curt=1.0, n=6),
             fir=dict(R=0.16, p=0.75, droop=0.10, hb=0.06, up=0.05, curt=0.3, n=6),
             engel=dict(R=0.12, p=0.95, droop=0.38, hb=0.03, up=0.2, curt=0.8, n=7),
             douglas=dict(R=0.15, p=0.85, droop=0.22, hb=0.08, up=0.15, curt=0.5, n=6))[kind]
    mb = MB(); hb = H * P['hb'] * rng.uniform(0.6, 1.6); Rm = H * P['R'] * rng.uniform(0.85, 1.12)
    cylinder(mb, -0.4, H * 0.97, 0.012 * H + 0.12, 0.03, 8, 0)
    # the core (stops the light through the crown)
    zs = np.linspace(hb + 0.6, H * 0.93, 9); rr = [0.36 * Rm * ((H - z) / (H - hb)) ** P['p'] for z in zs]
    rings = [ring(z, max(r, 0.05), 10) for z, r in zip(zs, rr)]
    for a_, b_ in zip(rings[:-1], rings[1:]):
        mb.add(np.vstack([a_, b_]), [[i, (i + 1) % 10, 10 + (i + 1) % 10, 10 + i] for i in range(10)], None, 2)
    z = hb; rot = rng.uniform(0, 6.28)
    while z < H - 0.25:
        fr = (H - z) / (H - hb); R = Rm * fr ** P['p'] * (1.0 if z > hb + 1.5 else 0.9)
        n = P['n'] + (1 if rng.random() < 0.3 else 0)
        for k in range(n):
            if rng.random() < 0.12 and z < H * 0.6: continue  # gaps
            th = rot + 2 * np.pi * k / n + rng.uniform(-0.25, 0.25); ux, uy = math.cos(th), math.sin(th)
            Lb = max(0.25, R * rng.uniform(0.82, 1.1)); el = math.radians(rng.uniform(-8, 6) + 25 * (1 - fr) ** 2)
            ts = np.linspace(0, 1, 6)
            rad = 0.08 + Lb * ts; dz = Lb * (math.tan(el) * ts - P['droop'] * (1 - (1 - fr) * 0.8) * ts ** 2 + P['up'] * ts ** 4)
            px, py, pz = ux * rad, uy * rad, z + dz
            wd = np.clip(0.55 * Lb, 0.28, 1.25) * (np.sin(np.pi * (0.12 + 0.88 * ts)) ** 0.6 + 0.05)
            r0 = rng.uniform(-0.3, 0.3)
            for roll in (r0 + 0.75, r0 - 0.75):
                sx, sy = -uy * math.cos(roll), ux * math.cos(roll); sz = math.sin(roll)
                Lv = np.stack([px - sx * wd / 2, py - sy * wd / 2, pz - sz * wd / 2], 1); Rv = np.stack([px + sx * wd / 2, py + sy * wd / 2, pz + sz * wd / 2], 1)
                verts = np.empty((12, 3)); verts[0::2] = Lv; verts[1::2] = Rv
                faces = [[2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2] for i in range(5)]
                uvs = [[(0, ts[i]), (1, ts[i]), (1, ts[i + 1]), (0, ts[i + 1])] for i in range(5)]
                mb.add(verts, faces, uvs, 1)
            if P['curt'] > 0 and Lb > 0.6 and rng.random() < P['curt'] * 0.8:  # hanging curtain under the branch
                t2 = ts[2:]; hang = rng.uniform(0.25, 0.5) * min(1.0, Lb / 2)
                top = np.stack([px[2:], py[2:], pz[2:] - 0.02], 1); bot = top + np.array([0, 0, -hang]) + np.stack([ux * 0.05 * np.ones(4), uy * 0.05 * np.ones(4), np.zeros(4)], 1)
                verts = np.empty((8, 3)); verts[0::2] = bot; verts[1::2] = top
                faces = [[2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2] for i in range(3)]
                uvs = [[(0.15, t2[i]), (0.85, t2[i]), (0.85, t2[i + 1]), (0.15, t2[i + 1])] for i in range(3)]
                mb.add(verts, faces, uvs, 1)
        z += rng.uniform(0.32, 0.5) * (0.85 + 0.3 * fr); rot += 2.39996
    return mb

def conifer_lod(rng, H, kind):
    """the same tree from afar: stacked jagged skirts, no transparency"""
    R0 = dict(spruce=0.155, fir=0.16, engel=0.12, douglas=0.15)[kind]; p = dict(spruce=0.95, fir=0.75, engel=0.95, douglas=0.85)[kind]
    mb = MB(); hb = H * 0.05; Rm = H * R0
    cylinder(mb, -0.4, hb + 1, 0.012 * H + 0.12, 0.1, 6, 0)
    z = hb; n = 14
    while z < H - 0.3:
        fr = (H - z) / (H - hb); R = Rm * fr ** p; th = np.linspace(0, 2 * np.pi, 2 * n, endpoint=False) + rng.uniform(0, 1)
        rr = R * np.where(np.arange(2 * n) % 2 == 0, 1.0, 0.62) * rng.uniform(0.85, 1.1, 2 * n)
        outer = np.stack([rr * np.cos(th), rr * np.sin(th), z - 0.35 * R * np.ones(2 * n)], 1)
        top = np.array([[0, 0, z + 0.9 + 0.2 * R]])
        mb.add(np.vstack([top, outer]), [[0, 1 + i, 1 + (i + 1) % (2 * n)] for i in range(2 * n)], None, 1)
        z += 0.85 + 0.25 * fr
    return mb

def broadleaf(rng, H, kind):
    """a beech or an aspen: trunk, a few limbs, leaf clusters in an egg-shaped crown"""
    mb = MB(); slim = 0.55 if kind == 'aspen' else 1.0
    cylinder(mb, -0.4, H * 0.75, 0.011 * H + 0.08, 0.05, 8, 0)
    cz, rx, rz = H * (0.62 if kind == 'aspen' else 0.6), H * 0.27 * slim, H * (0.36 if kind == 'aspen' else 0.33)
    for k in range(5):
        th = rng.uniform(0, 6.28); d = np.array([math.cos(th) * 0.6, math.sin(th) * 0.6, 0.8]); d /= np.linalg.norm(d)
        cylinder(mb, 0, 0, 0.09, 0.02, 6, 0, axis=(np.array([0, 0, H * rng.uniform(0.35, 0.55)]), d, rx * 1.1))
    ncard = int(420 * (0.7 if kind == 'aspen' else 1.0))
    for i in range(ncard):
        u = rng.normal(size=3); u /= np.linalg.norm(u); r = rng.uniform(0.55, 1.0) ** 0.5
        c = np.array([u[0] * rx * r, u[1] * rx * r, cz + u[2] * rz * r])
        s = rng.uniform(0.75, 1.1) * (0.8 if kind == 'aspen' else 1.0) * H / 16
        nrm = u + rng.normal(scale=0.6, size=3); nrm /= np.linalg.norm(nrm)
        e1 = np.cross(nrm, [0, 0, 1.0]); e1 = e1 / (np.linalg.norm(e1) + 1e-9) if np.linalg.norm(e1) > 1e-3 else np.array([1.0, 0, 0]); e2 = np.cross(nrm, e1)
        q = [c - e1 * s / 2 - e2 * s / 2, c + e1 * s / 2 - e2 * s / 2, c + e1 * s / 2 + e2 * s / 2, c - e1 * s / 2 + e2 * s / 2]
        mb.add(q, [[0, 1, 2, 3]], [[(0, 0), (1, 0), (1, 1), (0, 1)]], 1)
    return mb

def broadleaf_lod(rng, H, kind):
    mb = MB(); slim = 0.55 if kind == 'aspen' else 1.0
    cylinder(mb, -0.4, H * 0.5, 0.011 * H + 0.08, 0.05, 6, 0)
    cz, rx, rz = H * 0.6, H * 0.26 * slim, H * 0.33
    n = 10; th = np.linspace(0, 2 * np.pi, n, endpoint=False); ph = np.linspace(-1.3, 1.3, 7)
    pts = []
    for p_ in ph:
        for t_ in th:
            k = 1 + 0.12 * rng.normal(); pts.append([rx * math.cos(p_) * math.cos(t_) * k, rx * math.cos(p_) * math.sin(t_) * k, cz + rz * math.sin(p_) * k])
    pts = np.array(pts + [[0, 0, cz + rz], [0, 0, cz - rz]]); faces = []
    for a in range(len(ph) - 1):
        for b in range(n): faces.append([a * n + b, a * n + (b + 1) % n, (a + 1) * n + (b + 1) % n, (a + 1) * n + b])
    top, bot = len(pts) - 2, len(pts) - 1
    for b in range(n): faces.append([(len(ph) - 1) * n + b, (len(ph) - 1) * n + (b + 1) % n, top]); faces.append([(b + 1) % n, b, bot])
    mb.add(pts, faces, None, 1); return mb

def mat_bark(kind):
    m, nt, out = new_mat('lubje-' + kind); g = nd(nt, 'ShaderNodeNewGeometry'); pos = g.outputs['Position']
    if kind == 'aspen':
        n1 = noise(nt, 3.0, 5, 0.6, pos)
        base = mixc(nt, mrange(nt, n1.outputs['Fac'], 0.62, 0.70), tuple(lin([0.78, 0.78, 0.72])), tuple(lin([0.12, 0.11, 0.10])))
    else:
        wv = nd(nt, 'ShaderNodeTexWave', Scale=6.0, Distortion=6.0); wv.wave_type = 'BANDS'; wv.bands_direction = 'Z'; L(nt, pos, wv.inputs['Vector'])
        base = mixc(nt, mrange(nt, wv.outputs['Fac'], 0.2, 0.8), tuple(lin([0.20, 0.15, 0.12])), tuple(lin([0.36, 0.30, 0.25])))
    b = nd(nt, 'ShaderNodeBump', Strength=0.6, Distance=0.02); L(nt, noise(nt, 8.0, 6, 0.6, pos).outputs['Fac'], b.inputs['Height'])
    p = principled(nt, base, 0.9); L(nt, b.outputs[0], p.inputs['Normal']); L(nt, p.outputs[0], out.inputs[0]); return m

def mat_foliage(name, tex, tint=(1, 1, 1), trans=0.3, hz=False):
    m, nt, out = new_mat(name)
    t = nd(nt, 'ShaderNodeTexImage'); t.image = tex; t.interpolation = 'Linear'
    oi = nd(nt, 'ShaderNodeObjectInfo')
    var = mrange(nt, oi.outputs['Random'], 0, 1, 0.78, 1.2, False)
    c = mixc(nt, 1.0, t.outputs['Color'], tint + (1,), 'MULTIPLY')
    c = mixc(nt, 1.0, c, mixc(nt, var, (0, 0, 0), (1, 1, 1)), 'MULTIPLY')
    p = principled(nt, c, 0.72, **{'Specular IOR Level': 0.12})
    tr = nd(nt, 'ShaderNodeBsdfTranslucent'); L(nt, mixc(nt, 1.0, c, (1.6, 1.8, 0.9), 'MULTIPLY'), tr.inputs['Color'])
    mx = nd(nt, 'ShaderNodeMixShader', Fac=trans); L(nt, p.outputs[0], mx.inputs[1]); L(nt, tr.outputs[0], mx.inputs[2])
    tp = nd(nt, 'ShaderNodeBsdfTransparent')
    ma = nd(nt, 'ShaderNodeMixShader'); L(nt, t.outputs['Alpha'], ma.inputs[0]); L(nt, tp.outputs[0], ma.inputs[1]); L(nt, mx.outputs[0], ma.inputs[2])
    L(nt, haze(nt, ma.outputs[0]) if hz else ma.outputs[0], out.inputs[0]); return m

def mat_solid_foliage(name, col, hz=True):
    m, nt, out = new_mat(name); g = nd(nt, 'ShaderNodeNewGeometry'); oi = nd(nt, 'ShaderNodeObjectInfo')
    vo = nd(nt, 'ShaderNodeTexVoronoi', Scale=1.4); L(nt, g.outputs['Position'], vo.inputs['Vector'])
    k = mrange(nt, vo.outputs['Distance'], 0.0, 0.8, 1.25, 0.55)
    var = mrange(nt, oi.outputs['Random'], 0, 1, 0.8, 1.2, False)
    c = mixc(nt, 1.0, col, mixc(nt, math_(nt, 'MULTIPLY', k, var), (0, 0, 0), (1, 1, 1)), 'MULTIPLY')
    b = nd(nt, 'ShaderNodeBump', Strength=0.8, Distance=0.3); L(nt, vo.outputs['Distance'], b.inputs['Height'])
    p = principled(nt, c, 0.75, **{'Specular IOR Level': 0.3}); L(nt, b.outputs[0], p.inputs['Normal'])
    L(nt, haze(nt, p.outputs[0]) if hz else p.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- grass, flowers, rocks
def grass_clump(rng, hmin, hmax, nbl, dry=0.12):
    V_, F_, C_ = [], [], []
    g1, g2, g3 = np.array(lin([0.25, 0.42, 0.10])), np.array(lin([0.48, 0.55, 0.20])), np.array(lin([0.16, 0.30, 0.07]))
    straw = np.array(lin([0.62, 0.55, 0.34]))
    for b in range(nbl):
        r = rng.uniform(0, 0.09) ** 0.8; th = rng.uniform(0, 6.28); bx, by = r * math.cos(th), r * math.sin(th)
        h = rng.uniform(hmin, hmax); lean = rng.uniform(0.05, 0.5) * h; la = th + rng.uniform(-0.6, 0.6); w0 = rng.uniform(0.004, 0.009)
        ts = np.linspace(0, 1, 6); off = lean * ts ** 2
        cx, cy, cz = bx + math.cos(la) * off, by + math.sin(la) * off, h * ts * (1 - 0.25 * (lean / h) * ts)
        wd = w0 * (1 - ts ** 1.5) + 0.0006
        px, py = -math.sin(la + rng.uniform(-0.8, 0.8)), math.cos(la + rng.uniform(-0.8, 0.8))
        o = len(V_)
        for i in range(6): V_ += [[cx[i] - px * wd[i], cy[i] - py * wd[i], cz[i]], [cx[i] + px * wd[i], cy[i] + py * wd[i], cz[i]]]
        F_ += [[o + 2 * i, o + 2 * i + 1, o + 2 * i + 3, o + 2 * i + 2] for i in range(5)]
        c = straw * rng.uniform(0.8, 1.1) if rng.random() < dry else (g1 + (g2 - g1) * rng.random() ** 1.5) * rng.uniform(0.75, 1.15)
        for i in range(6):
            cc = g3 * (1 - ts[i]) * 0.6 + c * (0.4 + 0.6 * ts[i]) if c is not straw else c
            C_ += [list(cc) + [1], list(cc) + [1]]
    return np.array(V_), np.array(F_), np.array(C_)

def flower(rng, kind):
    """kind 0 daisy (white), 1 buttercup (yellow), 2 cranesbill (purple): stem + head; material 0 stem, 1 petals, 2 centre"""
    mb = MB(); h = rng.uniform(0.22, 0.48) if kind == 0 else rng.uniform(0.3, 0.62); lean = rng.uniform(0, 0.08); la = rng.uniform(0, 6.28)
    ts = np.linspace(0, 1, 5); cx, cy, cz = math.cos(la) * lean * ts ** 2, math.sin(la) * lean * ts ** 2, h * ts
    v = []; [v.extend([[cx[i] - 0.0015, cy[i], cz[i]], [cx[i] + 0.0015, cy[i], cz[i]]]) for i in range(5)]
    mb.add(v, [[2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2] for i in range(4)], None, 0)
    heads = [(cx[-1], cy[-1], cz[-1])] + ([(cx[-1] + 0.03, cy[-1] - 0.02, cz[-1] - 0.05)] if kind == 2 and rng.random() < 0.6 else [])
    for hx, hy, hz_ in heads:
        tilt = rng.uniform(0, 0.5); ta = rng.uniform(0, 6.28); nrm = np.array([math.sin(tilt) * math.cos(ta), math.sin(tilt) * math.sin(ta), math.cos(tilt)])
        e1 = np.cross(nrm, [0, 1.0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(nrm, e1); c0 = np.array([hx, hy, hz_])
        npet, pl, pw, cup = (18, 0.014, 0.0032, 0.15) if kind == 0 else (5, 0.010, 0.008, 0.6) if kind == 1 else (5, 0.013, 0.009, 0.25)
        for k in range(npet):
            a = 2 * np.pi * k / npet; d = math.cos(a) * e1 + math.sin(a) * e2; s = -math.sin(a) * e1 + math.cos(a) * e2
            tip = c0 + d * pl + nrm * pl * cup; mid = c0 + d * pl * 0.5 + nrm * pl * cup * 0.4
            q = [c0 + d * 0.002 - s * pw * 0.3, mid - s * pw / 2, tip - s * pw * 0.25, tip + s * pw * 0.25, mid + s * pw / 2, c0 + d * 0.002 + s * pw * 0.3]
            mb.add(q, [[0, 1, 4, 5], [1, 2, 3, 4]], None, 1)
        cr = 0.0045 if kind == 0 else 0.003; ring_ = [c0 + cr * (math.cos(a) * e1 + math.sin(a) * e2) + nrm * 0.001 for a in np.linspace(0, 2 * np.pi, 8, endpoint=False)]
        mb.add([c0 + nrm * 0.003] + ring_, [[0, 1 + i, 1 + (i + 1) % 8] for i in range(8)], None, 2)
    return mb

def rock(rng, size, name, mat, loc, flat=0.6):
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0); bm.to_mesh(me); bm.free()
    P = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', P); P = P.reshape(-1, 3)
    dirs = rng.normal(size=(14, 3)); dirs /= np.linalg.norm(dirs, axis=1)[:, None]; fr = rng.uniform(1.0, 4.5, 14); ph = rng.uniform(0, 6.28, 14); am = 0.12 / fr ** 0.7
    disp = (am[None] * np.sin(P @ (dirs * fr[:, None]).T + ph[None])).sum(1)
    P = P * (1 + disp)[:, None]; P[:, 2] = np.maximum(P[:, 2] * flat, -0.25)
    P *= np.array([size * rng.uniform(0.9, 1.3), size * rng.uniform(0.8, 1.1), size])
    me.vertices.foreach_set('co', P.ravel()); me.update(); me.polygons.foreach_set('use_smooth', np.ones(len(me.polygons), bool)); me.materials.append(mat)
    ob = obj(name, me, loc=loc, rot=(0, 0, rng.uniform(0, 6.28))); return ob

def mat_rock(col):
    m, nt, out = new_mat('skala'); g = nd(nt, 'ShaderNodeNewGeometry'); pos = g.outputs['Position']
    n1 = noise(nt, 2.2, 8, 0.62, pos); n2 = noise(nt, 0.7, 3, 0.5, pos)
    base = mixc(nt, mrange(nt, n1.outputs['Fac'], 0.3, 0.7), tuple(lin(col) * 0.75), tuple(lin(col) * 1.15))
    base = mixc(nt, mrange(nt, n2.outputs['Fac'], 0.6, 0.66, 0, 0.7), base, tuple(lin([0.55, 0.56, 0.42])))  # lichen
    sp = nd(nt, 'ShaderNodeTexVoronoi', Scale=40.0); L(nt, pos, sp.inputs['Vector'])
    base = mixc(nt, mrange(nt, sp.outputs['Distance'], 0.0, 0.18, 0.5, 0.0), base, tuple(lin([0.15, 0.14, 0.13])))
    b = nd(nt, 'ShaderNodeBump', Strength=0.7, Distance=0.03); L(nt, n1.outputs['Fac'], b.inputs['Height'])
    p = principled(nt, base, 0.82); L(nt, b.outputs[0], p.inputs['Normal']); L(nt, p.outputs[0], out.inputs[0]); return m

def mat_vcol(name, rough=0.45, trans=0.35):
    m, nt, out = new_mat(name); c = attr(nt, 'col').outputs['Color']
    p = principled(nt, c, rough, **{'Specular IOR Level': 0.4})
    tr = nd(nt, 'ShaderNodeBsdfTranslucent'); L(nt, mixc(nt, 1.0, c, (1.3, 1.4, 0.8), 'MULTIPLY'), tr.inputs['Color'])
    mx = nd(nt, 'ShaderNodeMixShader', Fac=trans); L(nt, p.outputs[0], mx.inputs[1]); L(nt, tr.outputs[0], mx.inputs[2])
    L(nt, mx.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- instancing with geometry nodes
def instancer(name, coll):
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi = ng.nodes.new('NodeGroupInput'); go = ng.nodes.new('NodeGroupOutput')
    ci = ng.nodes.new('GeometryNodeCollectionInfo'); ci.transform_space = 'ORIGINAL'
    ci.inputs['Collection'].default_value = coll; ci.inputs['Separate Children'].default_value = True; ci.inputs['Reset Children'].default_value = True
    io_ = ng.nodes.new('GeometryNodeInstanceOnPoints'); io_.inputs['Pick Instance'].default_value = True
    def na(nm, dt):
        n = ng.nodes.new('GeometryNodeInputNamedAttribute'); n.data_type = dt; n.inputs['Name'].default_value = nm; return n.outputs[0]
    e2r = ng.nodes.new('FunctionNodeEulerToRotation')
    ng.links.new(gi.outputs[0], io_.inputs['Points']); ng.links.new(ci.outputs[0], io_.inputs['Instance'])
    ng.links.new(na('idx', 'INT'), io_.inputs['Instance Index']); ng.links.new(na('rot', 'FLOAT_VECTOR'), e2r.inputs[0])
    ng.links.new(e2r.outputs[0], io_.inputs['Rotation']); ng.links.new(na('scl', 'FLOAT_VECTOR'), io_.inputs['Scale'])
    ng.links.new(io_.outputs[0], go.inputs[0]); return ng

def scatter(name, coll, P, rot, scl, idx):
    me = bpy.data.meshes.new(name); me.vertices.add(len(P)); me.vertices.foreach_set('co', np.ascontiguousarray(P, np.float32).ravel())
    for nm, arr in (('rot', rot), ('scl', scl)):
        a = me.attributes.new(nm, 'FLOAT_VECTOR', 'POINT'); a.data.foreach_set('vector', np.ascontiguousarray(arr, np.float32).ravel())
    a = me.attributes.new('idx', 'INT', 'POINT'); a.data.foreach_set('value', np.ascontiguousarray(idx, np.int32))
    ob = obj(name, me); md = ob.modifiers.new('razporedi', 'NODES'); md.node_group = instancer(name, coll); return ob

def src_coll(name):
    c = bpy.data.collections.new(name); SRC.children.link(c); return c

# ---------------------------------------------------------------- the sign
def sign_obj():
    a, b = COMP['sign']; x, y = W(a, b)
    yaw = math.atan2(-y, -x) + math.pi / 2 + math.radians(COMP.get('sign_turn', 0))  # the face (local -Y) toward the camera
    sw, sh, th, z0 = 2.8, 1.3, 0.03, 1.15
    m_face, nt, out = new_mat('tabla-lice'); t = nd(nt, 'ShaderNodeTexImage'); t.image = img(tex_sign('tabla.png', CFG['sign'], CFG.get('sign2')))
    p = principled(nt, None, 0.38, **{'Coat Weight': 0.35, 'Coat Roughness': 0.15}); L(nt, t.outputs['Color'], p.inputs['Base Color']); L(nt, p.outputs[0], out.inputs[0])
    m_back = mat_simple('tabla-hrbet', (0.55, 0.56, 0.57), 0.45, 0.8)
    m_post = galvanized()
    # the panel: a rounded rectangle, extruded (local x across, z up, -y toward the viewer)
    rr = 0.07; pts = []
    for cx, cy, a0 in ((sw / 2 - rr, sh - rr, 0), (-sw / 2 + rr, sh - rr, 90), (-sw / 2 + rr, rr, 180), (sw / 2 - rr, rr, 270)):
        for k in range(6): an = math.radians(a0 + 90 * k / 5); pts.append((cx + rr * math.cos(an), cy + rr * math.sin(an)))
    n = len(pts); P2 = np.array(pts)
    front = np.stack([P2[:, 0], np.full(n, -th / 2), P2[:, 1] + z0], 1); back = np.stack([P2[:, 0], np.full(n, th / 2), P2[:, 1] + z0], 1)
    c_f = np.array([[0, -th / 2, z0 + sh / 2]]); c_b = np.array([[0, th / 2, z0 + sh / 2]])
    Vt = np.vstack([front, back, c_f, c_b]); F, M, UV = [], [], []
    for i in range(n):
        j = (i + 1) % n
        F.append([2 * n, i, j]); M.append(0); UV += [(0.5, 0.5), ((P2[i, 0] + sw / 2) / sw, P2[i, 1] / sh), ((P2[j, 0] + sw / 2) / sw, P2[j, 1] / sh)]
        F.append([2 * n + 1, n + j, n + i]); M.append(1); UV += [(0, 0)] * 3
        F.append([i, n + i, n + j, j]); M.append(1); UV += [(0, 0)] * 4
    me = make_mesh('tabla', Vt, F, uv=np.array(UV, float), mats=[m_face, m_back], matidx=M)
    ob = obj('tabla', me, loc=(x, y, 0.0), rot=(0, 0, yaw))
    # posts, rails and rivets
    mb = MB()
    for px in (-0.95, 0.95):
        cylinder(mb, -0.5, z0 + sh - 0.12, 0.038, 0.038, 16, 0, ox=px, oy=th / 2 + 0.045)
        mb.add(ring(z0 + sh - 0.12, 0.038, 16, px, th / 2 + 0.045)[[0, 4, 8, 12]], [[0, 1, 2, 3]], None, 0)
    for zz in (z0 + 0.25, z0 + sh - 0.25):
        v = np.array([[-1.25, th / 2, zz - 0.03], [1.25, th / 2, zz - 0.03], [1.25, th / 2, zz + 0.03], [-1.25, th / 2, zz + 0.03]])
        v2 = v + np.array([0, 0.03, 0]); mb.add(np.vstack([v, v2]), [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [1, 5, 6, 2], [0, 3, 7, 4]], None, 1)
    for rx_ in (-1.18, 0, 1.18):
        for rz_ in (z0 + 0.09, z0 + sh - 0.09):
            c = np.array([rx_, -th / 2 - 0.001, rz_]); r8 = [c + np.array([0.013 * math.cos(t_), 0, 0.013 * math.sin(t_)]) for t_ in np.linspace(0, 6.28, 10, endpoint=False)]
            mb.add([c + np.array([0, -0.006, 0])] + r8, [[0, 1 + (i + 1) % 10, 1 + i] for i in range(10)], None, 0)
    me2 = mb.mesh('stebri', [m_post, m_back]); obj('stebri', me2, loc=(x, y, 0.0), rot=(0, 0, yaw))
    return (a, b)

def galvanized():
    m, nt, out = new_mat('pocinkano'); g = nd(nt, 'ShaderNodeNewGeometry')
    vo = nd(nt, 'ShaderNodeTexVoronoi', Scale=60.0); L(nt, g.outputs['Position'], vo.inputs['Vector'])
    p = principled(nt, (0.62, 0.64, 0.66), 0.35, Metallic=1.0)
    rr = nd(nt, 'ShaderNodeRGBToBW'); L(nt, vo.outputs['Color'], rr.inputs[0]); L(nt, mrange(nt, rr.outputs[0], 0, 1, 0.22, 0.48, False), p.inputs['Roughness'])
    L(nt, p.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- the car (from the game: avto.mjs)
def car():
    d = json.load(open(A.car)); paint_hex = os.path.basename(A.car).split('-')[-1].split('.')[0]
    pr = np.array([int(paint_hex[i:i + 2], 16) for i in (0, 2, 4)], float)
    mats = [mat_paint(), mat_simple('krom', (0.92, 0.92, 0.94), 0.07, 1.0), mat_simple('steklo', (0.012, 0.014, 0.018), 0.02, coat=1.0),
            mat_vrough('guma', 0.8), mat_vrough('obloge', 0.42), mat_simple('luc', (0.95, 0.93, 0.85), 0.05, coat=1.0, emit=((1.0, 0.95, 0.85), 0.4)),
            mat_vrough('notranjost', 0.6)]
    def cls(c):
        r, g, b = c; mx, mn = max(c), min(c); Lh = (mx + mn) / 510; S = (mx - mn) / (mx + 1e-6)
        if abs(r - 0x1a) + abs(g - 0x21) + abs(b - 0x30) < 12: return 2
        if r >= 0xf0 and g >= 0xe8 and b <= 0xe0 and b < r - 10: return 5
        if S < 0.12 and Lh > 0.5: return 1 if b >= r else 0
        if np.abs(np.array(c, float) - pr).sum() < 90: return 0
        if Lh < 0.07: return 3
        if Lh < 0.32 and S < 0.35: return 4
        return 6
    root = bpy.data.objects.new('avto', None); link(root)
    for mi, m in enumerate(d['meshes']):
        mt = m['mats'][0]
        if mt.get('type') == 'MeshBasicMaterial': continue  # the blob shadow
        P = np.array(m['pos'], float).reshape(-1, 3); P = np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
        F = np.array(m['idx']).reshape(-1, 3) if m.get('idx') else np.arange(len(P)).reshape(-1, 3)
        N = np.array(m['nrm'], float).reshape(-1, 3) / 127 if m.get('nrm') else None
        if N is not None: N = np.stack([N[:, 0], -N[:, 2], N[:, 1]], 1)
        if m.get('col') and mt.get('vc'): C = np.array(m['col'], float).reshape(-1, 3)
        else: ch = mt.get('color', 0xffffff); C = np.tile([(ch >> 16) & 255, (ch >> 8) & 255, ch & 255], (len(P), 1)).astype(float)
        key = np.round(P * 1e4).astype(np.int64); _, uq, inv = np.unique(key, axis=0, return_index=True, return_inverse=True); inv = inv.ravel()
        Fu = inv[F]; ok = (Fu[:, 0] != Fu[:, 1]) & (Fu[:, 1] != Fu[:, 2]) & (Fu[:, 0] != Fu[:, 2]); F, Fu = F[ok], Fu[ok]; loops = F.ravel()
        if mt.get('map'):
            tex = d['textures'][mt['map']]; pth = os.path.join(A.tmp, 'car-%d.png' % mi)
            open(pth, 'wb').write(base64.b64decode(tex['url'].split(',')[1]))
            mm, nt, out = new_mat('nalepka-%d' % mi); t = nd(nt, 'ShaderNodeTexImage'); t.image = img(pth, alpha=True)
            p = principled(nt, None, 0.3, **{'Coat Weight': 1.0}); L(nt, t.outputs['Color'], p.inputs['Base Color']); L(nt, t.outputs['Alpha'], p.inputs['Alpha'])
            L(nt, p.outputs[0], out.inputs[0])
            UVs = np.array(m['uv'], float).reshape(-1, 2)[loops]
            me = make_mesh('avto-%d' % mi, P[uq], Fu, uv=UVs, mats=[mm], smooth=True, validate=False)
            ob = obj('avto-%d' % mi, me); ob.parent = root; ob.location.z += 0.002; continue
        lc = C[loops] / 255; fm = np.array([cls(tuple(C[f[0]])) for f in F])
        me = make_mesh('avto-%d' % mi, P[uq], Fu, cols={'col': ('CORNER', np.hstack([lin(lc), np.ones((len(lc), 1))]))}, mats=mats, matidx=fm, smooth=True, validate=False)
        if N is not None:
            try: me.normals_split_custom_set([tuple(v) for v in N[loops]])
            except Exception as e: log('normals', e)
        ob = obj('avto-%d' % mi, me); ob.parent = root
    a, b = COMP['car']; x, y = W(a, b); th = math.radians(COMP['car_head'])
    hx, hy = W(math.sin(th), math.cos(th)); root.location = (x, y, COMP.get('car_z', 0.045 + 0.05 * 0.6)); root.rotation_euler = (0, 0, math.atan2(hy, hx))
    return root

def mat_paint():
    m, nt, out = new_mat('lak'); c = attr(nt, 'col').outputs['Color']
    p = principled(nt, c, 0.22, **{'Coat Weight': 1.0, 'Coat Roughness': 0.025, 'Specular IOR Level': 0.5}); L(nt, p.outputs[0], out.inputs[0]); return m
def mat_vrough(name, rough):
    m, nt, out = new_mat(name); c = attr(nt, 'col').outputs['Color']; p = principled(nt, c, rough); L(nt, p.outputs[0], out.inputs[0]); return m

# ---------------------------------------------------------------- clouds: cumulus heaps (homogeneous volume), flat bases
def clouds():
    import bmesh
    mv, nt, out = new_mat('oblak'); pv = nd(nt, 'ShaderNodeVolumePrincipled', Density=CFG.get('cloud_density', 0.03), Anisotropy=0.4)
    pv.inputs['Color'].default_value = (1, 1, 1, 1); L(nt, pv.outputs[0], out.inputs['Volume'])
    if CFG.get('cloud_mottle'):  # an uneven density: softer edges, but a much slower render
        tco = nd(nt, 'ShaderNodeTexCoord'); nz = noise(nt, 0.004, 5, 0.6, tco.outputs['Object'])
        L(nt, math_(nt, 'MULTIPLY', mrange(nt, nz.outputs['Fac'], 0.22, 0.55), CFG.get('cloud_density', 0.03)), pv.inputs['Density'])
    dg = bpy.context.evaluated_depsgraph_get()
    cl = [tuple(c) for c in CFG.get('clouds', [])]
    cf = CFG.get('cloud_field')
    if cf:  # a field of cumulus with one base height: perspective makes the far ones small and low over the horizon
        fr = np.random.default_rng(cf.get('seed', 7))
        for k in range(cf['n']):
            d = cf['dmin'] * (cf['dmax'] / cf['dmin']) ** fr.random(); rel = fr.uniform(-cf.get('wedge', 32), cf.get('wedge', 32))
            base = cf['base'] * fr.uniform(0.94, 1.06) - d * d / (2 * 6371000) * 0.87
            cl.append((rel, math.degrees(math.atan2(base, d)), d, fr.uniform(*cf['size']) * (0.75 + 0.5 * d / cf['dmax'])))
    for i, (rel, el, dist, size) in enumerate(cl):
        a, b = dist * math.sin(math.radians(rel)), dist * math.cos(math.radians(rel)); x, y = W(a, b); zc = dist * math.tan(math.radians(el))
        bm = bmesh.new(); rng = np.random.default_rng(100 + i); nb = 6 + int(size / 250)
        def puff(c, r):
            res = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r); bmesh.ops.translate(bm, verts=res['verts'], vec=Vector(c))
        for k in range(nb):  # the base: a wide, low row of puffs
            r = size * rng.uniform(0.15, 0.23); puff((rng.uniform(-0.42, 0.42) * size, rng.uniform(-0.22, 0.22) * size, r * 0.45), r)
        for k in range(nb // 2 + 2):  # the body
            r = size * rng.uniform(0.14, 0.21); puff((rng.normal(0, 0.2) * size, rng.uniform(-0.14, 0.14) * size, size * 0.2 + r * 0.5), r)
        for k in range(3 + nb // 3):  # the towers (cauliflower tops)
            r = size * rng.uniform(0.09, 0.15); puff((rng.normal(0, 0.14) * size, rng.uniform(-0.1, 0.1) * size, size * rng.uniform(0.34, 0.5) + r * 0.4), r)
        det = CFG.get('cloud_detail', False)
        if det:  # cauliflower: small puffs over the top and the sides
            for k in range(6 * nb):
                u, v_ = rng.uniform(-0.45, 0.45), rng.uniform(-0.2, 0.2); hgt = size * (0.5 - 1.6 * (u * u + v_ * v_)) * rng.uniform(0.6, 1.05)
                r = size * rng.uniform(0.045, 0.085); puff((u * size, v_ * size, max(hgt, r * 0.6)), r)
        me = bpy.data.meshes.new('oblak-tmp-%d' % i); bm.to_mesh(me); bm.free()
        tmp = obj('oblak-tmp-%d' % i, me)
        rm = tmp.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = size / (150 if det else 90)
        tx = bpy.data.textures.new('oblaki-%d' % i, 'CLOUDS'); tx.noise_scale = size * 0.07; tx.noise_depth = 3
        ds = tmp.modifiers.new('ds', 'DISPLACE'); ds.texture = tx; ds.strength = size * 0.08; ds.texture_coords = 'LOCAL'; ds.mid_level = 0.5
        if det:
            tx2 = bpy.data.textures.new('oblaki2-%d' % i, 'CLOUDS'); tx2.noise_scale = size * 0.018; tx2.noise_depth = 2
            ds2 = tmp.modifiers.new('ds2', 'DISPLACE'); ds2.texture = tx2; ds2.strength = size * 0.025; ds2.texture_coords = 'LOCAL'; ds2.mid_level = 0.5
        sm = tmp.modifiers.new('sm', 'SMOOTH'); sm.iterations = 1 if det else 3
        dg.update(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
        bpy.data.objects.remove(tmp)
        P = np.empty(len(me2.vertices) * 3, np.float32); me2.vertices.foreach_get('co', P); P = P.reshape(-1, 3)
        P[:, 2] = np.maximum(P[:, 2], 0.0) * 0.85  # a flat base
        me2.vertices.foreach_set('co', P.ravel()); me2.update(); me2.materials.clear(); me2.materials.append(mv)
        ob = obj('oblak-%d' % i, me2, loc=(x, y, zc), rot=(0, 0, rng.uniform(0, 6.28))); ob.visible_shadow = False

# ---------------------------------------------------------------- vegetation placement (the composition's forest and the DEM's)
def vegetation(T, roadC, rtree):
    kinds = CFG.get('trees', ['spruce', 'fir']); bl = CFG.get('broad', 'beech')
    tn = tex_needles('iglice.png', tuple(CFG.get('needle', (46, 74, 36))), tuple(CFG.get('needle_tip', (106, 136, 56))), np.random.default_rng(3))
    tl_ = tex_leaves('listi.png', [tuple(c) for c in CFG.get('leaves', [(96, 140, 44), (120, 160, 56), (80, 120, 40)])], np.random.default_rng(4), 'round' if bl == 'aspen' else 'oval')
    m_bark = mat_bark('spruce'); m_bark2 = mat_bark(bl)
    m_need = mat_foliage('iglice', img(tn, alpha=True), (1.0, 1.0, 1.0), 0.22)
    m_leaf = mat_foliage('listje', img(tl_, alpha=True), (1.0, 1.0, 1.0), 0.35)
    m_core = mat_simple('jedro', tuple(lin([0.09, 0.14, 0.07])), 0.9, **{'Specular IOR Level': 0.1})
    nc = np.array(CFG.get('needle', (46, 74, 36))) / 255 * 0.9; m_need_lod = mat_solid_foliage('iglice-od-dalec', tuple(lin(nc)) + (1,))
    lc = np.array(CFG.get('leaves', [(96, 140, 44)])[0]) / 255 * 0.85; m_leaf_lod = mat_solid_foliage('listje-od-dalec', tuple(lin(lc)) + (1,))
    c0 = src_coll('drevesa0'); c1 = src_coll('drevesa1')
    NV = 0; rng = np.random.default_rng(21); Hs = []
    for i in range(10):  # 8 conifers, 2 broadleaf; the same index in both detail levels
        if i < 8:
            k = kinds[i % len(kinds)]; H = rng.uniform(19, 30)
            me = conifer(rng, H, k).mesh('d0-%02d' % i, [m_bark, m_need, m_core]); obj('d0-%02d' % i, me, c0)
            me = conifer_lod(np.random.default_rng(i), H, k).mesh('d1-%02d' % i, [m_bark, m_need_lod]); obj('d1-%02d' % i, me, c1)
        else:
            H = rng.uniform(15, 22) if bl != 'aspen' else rng.uniform(13, 18)
            me = broadleaf(rng, H, bl).mesh('d0-%02d' % i, [m_bark2, m_leaf]); obj('d0-%02d' % i, me, c0)
            me = broadleaf_lod(rng, H, bl).mesh('d1-%02d' % i, [m_bark2, m_leaf_lod]); obj('d1-%02d' % i, me, c1)
        Hs.append(H)
    Hs = np.array(Hs)
    # the composition's forest round the view (in the view frame); none when the car is parked on an open meadow
    pts = []
    if COMP.get('forest', True):
        sp = 4.4; ga, gb = np.meshgrid(np.arange(-200, 260, sp), np.arange(-40, 340, sp))
        ga = ga + rng.uniform(-1.6, 1.6, ga.shape); gb = gb + rng.uniform(-1.6, 1.6, gb.shape); ga, gb = ga.ravel(), gb.ravel()
        dd, ii = rtree.query(np.stack([ga, gb], 1)); tg = np.gradient(roadC, axis=0)[ii]
        far = tg[:, 0] * (gb - roadC[ii, 1]) - tg[:, 1] * (ga - roadC[ii, 0]) > 0  # left of the road seen along it: the far side of its bend
        ang = np.degrees(np.arctan2(ga, gb)); dist = np.hypot(ga, gb)
        nz = 4 * np.sin(gb * 0.05) + 3 * np.sin(ga * 0.07 + 1)
        W0, W1 = COMP['window']
        left = far & (ang < W0) & (dist > 13)
        right = far & (ang > W1) & (dist > 70 - 1.5 * np.clip(ang - W1, 0, 16) + nz)
        side = ~far & (ang > 17) & (dist > 24)  # the camera's side of the road: only at the edge of the wide view
        behind = (gb < 0) & (np.abs(ga) > 9)
        sel = (left | right | side | behind) & (dd > COMP['width'] / 2 + 2.4)
        sa, sb = COMP['sign']; sel &= np.hypot(ga - sa, gb - sb) > 6.5
        # keep the car and the sign in the sun: no tree in the corridor toward the sun
        sun = SUND; sa_, sb_ = V(sun[0], sun[1]); sv = np.array([sa_, sb_]) / math.hypot(sa_, sb_); tanel = sun[2] / math.hypot(sun[0], sun[1])
        for (pa, pb) in (COMP['car'], COMP['sign']):
            rel = np.stack([ga - pa, gb - pb], 1); t = rel @ sv; perp = np.abs(rel @ np.array([-sv[1], sv[0]]))
            sel &= ~((t > 0) & (t < 34 / tanel) & (perp < 5.5))
        za = np.where(sel)[0]; A_, B_ = ga[za], gb[za]; hf_ = np.where(right, 0.72, 1.0)[za]  # a younger, lower forest on the right
        d2 = np.hypot(A_, B_); fov = np.degrees(np.abs(np.arctan2(A_, B_)))
        keep = (fov < 40) | (d2 < 60)
        A_, B_, hf_ = A_[keep], B_[keep], hf_[keep]
        x, y = W(A_, B_); pts.append((x, y, None, hf_))
    # the DEM's forest farther out (beyond the composition, not in the clearing)
    fr = CFG.get('forest_range', [300, 1700]); xs_, ys_ = [], []
    for d0, d1, wdg, spc in ((fr[0], min(fr[1], 1700), 70, 6.0), (1700, fr[1], 30, 7.5)):  # farther: only in the view, sparser
        if d1 <= d0: continue
        fm = (T['fo'] > 0.5) & (T['dist'] > d0) & (T['dist'] < d1) & (T['clear'] < 0.3) & (np.abs(T['relb']) < wdg)
        ii, jj = np.nonzero(fm)
        k = max(1, int(round(T['st'] / spc)))
        for di in range(k):
            for dj in range(k):
                xs_.append(T['X'][ii, jj] + (dj / k - 0.5) * T['st'] + rng.uniform(-2.5, 2.5, len(ii))); ys_.append(T['Y'][ii, jj] + (di / k - 0.5) * T['st'] + rng.uniform(-2.5, 2.5, len(ii)))
    if xs_:
        x2, y2 = np.concatenate(xs_), np.concatenate(ys_)
        a2, b2 = V(x2, y2); ok = ~((np.abs(np.degrees(np.arctan2(a2, b2))) < 40) & (b2 < 330) & (b2 > -40) & (a2 > -160) & (a2 < 260))
        pts.append((x2[ok], y2[ok], gridval(T, T['CH'], x2[ok], y2[ok]), np.ones(int(ok.sum()))))
    X_ = np.concatenate([p[0] for p in pts]); Y_ = np.concatenate([p[1] for p in pts])
    CHs = np.concatenate([np.full(len(p[0]), np.nan) if p[2] is None else p[2] for p in pts])
    Z_ = zat(T, X_, Y_) - 0.2
    n = len(X_); var = np.where(rng.random(n) < CFG.get('broad_frac', 0.12), rng.integers(8, 10, n), rng.integers(0, 8, n))
    Ht = np.where(np.isnan(CHs), rng.uniform(19, 31, n), np.clip(CHs, 12, 34) * rng.uniform(0.9, 1.1, n)) * np.concatenate([p[3] for p in pts])
    s = Ht / Hs[var]
    dcam = np.hypot(X_, Y_)
    rot = np.stack([rng.normal(0, 0.02, n), rng.normal(0, 0.02, n), rng.uniform(0, 6.28, n)], 1)
    scl = np.stack([s * rng.uniform(0.9, 1.1, n), s * rng.uniform(0.9, 1.1, n), s], 1)
    near = dcam < 150
    scatter('gozd0', c0, np.stack([X_, Y_, Z_], 1)[near], rot[near], scl[near], var[near])
    scatter('gozd1', c1, np.stack([X_, Y_, Z_], 1)[~near], rot[~near], scl[~near], var[~near])
    log('trees: near', int(near.sum()), 'far', int((~near).sum()))

def parked_cap(ga, gb, hgt):
    """the car parked on the meadow: nothing in its footprint, mown grass round it, and in front of it nothing above the line from the eye
    to 0.1 m over its wheels' contact, so the whole car shows; returns (keep, the largest scale for an item hgt metres tall)"""
    ca, cb = COMP['car']; th = math.radians(COMP['car_head']); f = np.array([math.sin(th), math.cos(th)]); r = np.array([f[1], -f[0]])
    hl, hw = COMP.get('car_len', 2.8), COMP.get('car_wid', 1.22)
    rel = np.stack([ga - ca, gb - cb], 1); al, ac = rel @ f, rel @ r
    ex = np.hypot(np.clip(np.abs(al) - hl, 0, None), np.clip(np.abs(ac) - hw, 0, None))
    keep = ex > 0.06
    cap = np.where(ex < 2.5, (0.12 + 0.6 * sstep(0.2, 2.5, ex)) / hgt, np.inf)
    cn = np.array([[ca, cb] + sl * hl * f + sw * hw * r for sl in (-1, 1) for sw in (-1, 1)])
    angc = np.degrees(np.arctan2(cn[:, 0], cn[:, 1])); dn = np.hypot(cn[:, 0], cn[:, 1]).min()
    ang = np.degrees(np.arctan2(ga, gb)); d = np.hypot(ga, gb)
    fr = (ang > angc.min() - 1.5) & (ang < angc.max() + 1.5) & (d < dn)
    zl = COMP['eye'] - (COMP['eye'] - 0.10) * d / dn
    cap = np.where(fr, np.minimum(cap, 0.92 * zl / hgt), cap)
    return keep, cap

def meadow(roadC, rtree):
    cg = src_coll('trava'); m_gr = mat_vcol('trava'); rng = np.random.default_rng(31)
    for i in range(7):
        tall = i >= 4; Vt, F, Cc = grass_clump(rng, 0.35 if tall else 0.18, 0.95 if tall else 0.55, 34 if tall else 40, 0.18 if tall else 0.1)
        me = make_mesh('tr-%02d' % i, Vt, F, cols={'col': ('POINT', Cc)}, mats=[m_gr], smooth=True); obj('tr-%02d' % i, me, cg)
    cf = src_coll('cvetlice')
    m_stem = mat_simple('steblo', tuple(lin([0.22, 0.36, 0.10])), 0.5)
    pet = [mat_simple('cvet-bel', (0.85, 0.86, 0.82), 0.5, **{'Subsurface Weight': 0.3}), mat_simple('cvet-rumen', tuple(lin([0.98, 0.80, 0.05])), 0.2, coat=0.6),
           mat_simple('cvet-vijol', tuple(lin([0.52, 0.30, 0.78])), 0.45, **{'Subsurface Weight': 0.3})]
    m_ctr = mat_simple('sredica', tuple(lin([0.95, 0.70, 0.08])), 0.6)
    for i in range(9):
        k = i % 3; me = flower(rng, k).mesh('cv-%02d' % i, [m_stem, pet[k], m_ctr]); obj('cv-%02d' % i, me, cf)
    # points: in the view's wedge (at least ±27°, wider for a frame moved sideways: shift_x), denser close by
    lo, hi = -27.0, 27.0
    for k_ in A.orient.split(','):
        o_ = ORIENT[k_]; t_ = math.tan(math.radians(o_['hfov'] / 2)); s_ = 2 * t_ * o_.get('shift_x', 0.0)
        lo, hi = min(lo, math.degrees(math.atan(s_ - t_))), max(hi, math.degrees(math.atan(s_ + t_)))
    tlo, thi = math.tan(math.radians(lo - 4)), math.tan(math.radians(hi + 4))
    def wedge(b0, b1, dens):
        area = 0.5 * (b1 ** 2 - b0 ** 2) * (thi - tlo); n = int(area * dens)
        b = np.sqrt(rng.uniform(b0 ** 2, b1 ** 2, n)); a = rng.uniform(tlo, thi, n) * b; return a, b
    parts = [wedge(2.0, 7, 34), wedge(7, 20, 16), wedge(20, 55, 5.5), wedge(55, 130, 1.8)]
    ga = np.concatenate([p[0] for p in parts]); gb = np.concatenate([p[1] for p in parts])
    dd, _ = rtree.query(np.stack([ga, gb], 1)); ok = dd > COMP['width'] / 2 + 0.55
    sa, sb = COMP['sign']; ok &= np.hypot(ga - sa, gb - sb) > 0.0
    ga, gb, dd = ga[ok], gb[ok], dd[ok]
    n = len(ga); dist = np.hypot(ga, gb)
    var = np.where(rng.random(n) < CFG.get('grass_tall', 0.45), rng.integers(4, 7, n), rng.integers(0, 4, n))
    # shorter by the road and in front of the car
    edge = sstep(COMP['width'] / 2 + 0.5, COMP['width'] / 2 + 2.5, dd)
    ca, cb = COMP['car']; front = (np.abs(np.degrees(np.arctan2(ga, gb)) - np.degrees(math.atan2(ca, cb))) < 9) & (gb < cb - 3)
    s = CFG.get('grass_scale', 1.0) * (0.75 + 0.55 * rng.random(n)) * (0.55 + 0.45 * edge) * np.where(front, 0.65, 1.0) * (1 + sstep(20, 120, dist) * 0.8)
    if COMP.get('parked'):
        kp, cap = parked_cap(ga, gb, np.where(var >= 4, 0.95, 0.55)); s = np.minimum(s, cap)
        ga, gb, s, var = ga[kp], gb[kp], s[kp], var[kp]; n = len(ga)
    x, y = W(ga, gb)
    rot = np.stack([rng.normal(0, 0.06, n), rng.normal(0, 0.06, n), rng.uniform(0, 6.28, n)], 1)
    scatter('travnik', cg, np.stack([x, y, np.zeros(n)], 1), rot, np.stack([s, s, s], 1), var)
    # flowers in patches
    fm_ = CFG.get('flowers', 1.0); fa, fb = wedge(2.0, 9, 9.0 * fm_); fa2, fb2 = wedge(9, 45, 1.4 * fm_); fa = np.concatenate([fa, fa2]); fb = np.concatenate([fb, fb2])
    dd, _ = rtree.query(np.stack([fa, fb], 1)); ok = dd > COMP['width'] / 2 + 0.8
    patch = (np.sin(fa * 0.9) + np.sin(fb * 0.7 + 2) + np.sin((fa + fb) * 0.5)) > -0.2
    fa, fb = fa[ok & patch], fb[ok & patch]; n = len(fa)
    kind = rng.choice(3, n, p=[0.45, 0.33, 0.22]); var = kind + 3 * rng.integers(0, 3, n)
    x, y = W(fa, fb); s = rng.uniform(1.15, 1.7, n) * (1 + sstep(8, 40, np.hypot(fa, fb)) * 0.6)
    if COMP.get('parked'):
        kp, cap = parked_cap(fa, fb, np.full(n, 0.6)); s = np.minimum(s, cap)
        fa, fb, s, var = fa[kp], fb[kp], s[kp], var[kp]; n = len(fa); x, y = W(fa, fb)
    rot = np.stack([rng.normal(0, 0.05, n), rng.normal(0, 0.05, n), rng.uniform(0, 6.28, n)], 1)
    scatter('cvetje', cf, np.stack([x, y, np.zeros(n)], 1), rot, np.stack([s, s, s], 1), var)
    # rocks: bottom left and right, past the road
    mr = mat_rock(CFG.get('rockcol', CFG['rock']['color']))
    for i, (a, b, sz) in enumerate(CFG.get('rocks', [(-0.25, 5.6, 0.42), (0.9, 6.3, 0.3), (1.6, 7.6, 0.6), (2.9, 9.0, 0.45), (6.6, 24.5, 0.55), (8.4, 30, 0.8), (-11, 30, 0.9)])):
        x, y = W(a, b); rock(np.random.default_rng(50 + i), sz, 'skala-%d' % i, mr, (x, y, -sz * 0.18))
    log('meadow: grass', len(ga), 'flowers', n)

# ---------------------------------------------------------------- render
def render(orient, path):
    o = ORIENT[orient]; rx, ry = o['res']
    SC.render.resolution_x, SC.render.resolution_y = int(rx * A.scale), int(ry * A.scale); SC.render.resolution_percentage = 100
    cd = bpy.data.cameras.new('kamera'); cd.sensor_fit = 'HORIZONTAL'; cd.sensor_width = 36.0
    cd.lens = 18.0 / math.tan(math.radians(o['hfov'] / 2)); cd.clip_start = 0.1; cd.clip_end = 120000
    cd.shift_y = (o['horizon'] - 0.5) * ry / rx  # the horizon at this fraction from the top
    cd.shift_x = o.get('shift_x', 0.0)  # the frame moved right by this part of its width (the menu's panel covers the right: a scene's -meni)
    co = bpy.data.objects.new('kamera-' + orient, cd); link(co)
    f = Vector((FWD[0], FWD[1], 0.0)); co.rotation_mode = 'QUATERNION'; co.rotation_quaternion = (-f).to_track_quat('Z', 'Y')
    co.location = CAM; SC.camera = co
    if CFG.get('fstop'):  # a photo's depth of field, focused on the car
        cd.dof.use_dof = True; cd.dof.focus_distance = math.hypot(*COMP['car']); cd.dof.aperture_fstop = CFG['fstop']
    SC.render.engine = 'CYCLES'; c = SC.cycles; c.device = 'CPU'; c.samples = A.samples; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.02
    c.use_denoising = True; c.denoiser = 'OPENIMAGEDENOISE'
    c.max_bounces = 8; c.diffuse_bounces = 3; c.glossy_bounces = 3; c.transmission_bounces = 4; c.volume_bounces = 2; c.transparent_max_bounces = 40
    c.caustics_reflective = False; c.caustics_refractive = False; c.sample_clamp_indirect = 6.0
    SC.view_settings.view_transform = 'AgX'
    for look in CFG.get('looks', ['AgX - Punchy', 'AgX - Medium High Contrast', 'Punchy']):
        try: SC.view_settings.look = look; break
        except Exception: pass
    SC.view_settings.exposure = CFG.get('exposure', 0.25)
    SC.render.image_settings.file_format = 'PNG'; SC.render.image_settings.color_depth = '8'
    png = path + '.png'; SC.render.filepath = png
    t = time.time(); bpy.ops.render.render(write_still=True); log('render', orient, '%.0f s' % (time.time() - t))
    post(png, path + '.webp')

def post(png, out):
    im = Image.open(png).convert('RGB')
    im = ImageEnhance.Color(im).enhance(CFG.get('sat', 1.18))
    im = im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=45, threshold=2))
    a = np.asarray(im).astype(np.float32) / 255; h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]; r2 = ((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2
    a = a * (1 - 0.10 * np.clip(r2 - 0.25, 0, None))[..., None]
    im = Image.fromarray((a.clip(0, 1) * 255 + 0.5).astype(np.uint8))
    for q in (90, 86, 82, 78, 74, 70, 66, 62, 58):
        im.save(out, 'WEBP', quality=q, method=6)
        if os.path.getsize(out) <= 300 * 1024: break
    log('saved', out, os.path.getsize(out) // 1024, 'KB, quality', q)

# ---------------------------------------------------------------- go
SUND = world()
T = terrain()
roadC, rtree = road()
sign_obj()
car()
vegetation(T, roadC, rtree)
meadow(roadC, rtree)
clouds()
log('scene built')
for o in ([] if A.dry else A.orient.split(',')):
    render(o, '%s-%s' % (A.out, o))
