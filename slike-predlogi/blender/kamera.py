# Vozilo misije skozi kamero igralca: kamera »za avtom« (telefon pokonci) pri nastavitvi Blizu.
# Uporaba: bl/bin/python gas/kamera.py <misija> <izhod> [hitro]  ->  <izhod>/kNN.png
# Kamera je ista kot v igri (js/render.js, način 'chase', pokonci): razdalja D = 46 · zoom · 1,1 (Blizu),
# nagib 0,98 · (1 − 0,1), cilj 13 m pred avtom na tleh, navpično zorno polje 58°.
import os, sys, math
_here = os.path.dirname(os.path.abspath(__file__))
M = int(sys.argv[1])
VEH = {1: 'gasilci', 2: 'resevalno', 4: 'vlecno', 6: 'igralec', 7: 'cisterna', 8: 'pickup', 9: 'krilo', 10: 'pickup',
       11: 'terenec', 13: 'lovec', 17: 'tovornjak', 19: 'zdravnik', 23: 'terenec', 26: 'ev', 29: 'dostava', 30: 'ratrak',
       33: 'kiper', 34: 'avtobus', 35: 'stirikolesnik', 37: 'amfibija', 39: 'vlecno_k', 40: 'sc', 43: 'tovornjak_z', 45: 'lokomotiva',
       46: 'gasilci_p', 47: 'cisterna_g', 48: 'resevalni_t', 49: 'lestev', 50: 'cebele', 51: 'dino_t', 52: 'hisa_t', 53: 'avtobus_v',
       54: 'dirkalni_t', 55: 'nadzornik'}
script = 'miss5.py' if M in (6, 45) or M >= 46 else 'miss.py' if M <= 10 else 'miss2.py' if M <= 25 else 'miss3.py' if M <= 35 else 'miss4.py'
src = open(os.path.join(_here, script), encoding='utf-8').read()
cut = src.index('\n# ---------------------------------------------------------------- izris') if script == 'miss5.py' else src.rindex('\nR = ')
G = {'__file__': os.path.join(_here, script), '__name__': 'kamera'}
exec(compile(src[:cut], os.path.join(_here, script), 'exec'), G)

CREATED = []
_group = G['group']
def _group_rec(before, name, *a, **k):
    e = _group(before, name, *a, **k); CREATED.append((name, e)); return e
G['group'] = _group_rec

R = G['m%02d' % M]()
bpy, Vector, SC = G['bpy'], G['Vector'], G['SC']
e = next(o for (n, o) in CREATED if n == VEH[M])
bpy.context.view_layer.update()
mw = e.matrix_world
f = mw.to_3x3() @ Vector((0, 1, 0)); L = math.hypot(f.x, f.y); fx, fy = f.x / L, f.y / L
x, y, z = mw.translation
zoom = 1.06                                   # pri ~50 km/h kamera malo odmakne (1 + 0,25 · v / 55)
D = 46 * zoom * 1.1; pitch = 0.98 * (1 - 0.1); ahead = 13.0
tx, ty = x + fx * ahead, y + fy * ahead
cam = (tx - fx * D * math.cos(pitch), ty - fy * D * math.cos(pitch), z + D * math.sin(pitch))

SC.render.engine = 'CYCLES'; SC.cycles.device = 'CPU'; SC.cycles.samples = 10 if G['FAST'] else 40
SC.cycles.use_denoising = True; SC.cycles.max_bounces = 4; SC.cycles.transparent_max_bounces = 24
SC.view_settings.view_transform = 'AgX'
try: SC.view_settings.look = 'AgX - Punchy'
except Exception: pass
cd = bpy.data.cameras.new('igralec_cam'); cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24.0
cd.lens = 12.0 / math.tan(math.radians(58) / 2); cd.clip_start = 0.5; cd.clip_end = 4000
co = bpy.data.objects.new('igralec_cam', cd); SC.collection.objects.link(co); co.location = cam
co.rotation_euler = (Vector((tx, ty, z)) - Vector(cam)).to_track_quat('-Z', 'Y').to_euler()
SC.camera = co
SC.render.resolution_x, SC.render.resolution_y = (300, 650) if G['FAST'] else (600, 1300)
SC.render.filepath = os.path.join(G['OUT'], 'k%02d%s.png' % (M, '_hitro' if G['FAST'] else ''))
bpy.ops.render.render(write_still=True)
print('KAMERA', M, VEH[M], 'D=%.1f' % D, 'ok')
