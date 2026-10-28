# Gasilski avto v Blenderju (samo slike): 6 generičnih verzij, brez znamk in napisov.
# Uporaba: bl/bin/python gas/gas.py <verzija 0-5> <izhodna mapa> [pogledi z vejico]
import bpy, bmesh, math, sys, json, os
from mathutils import Vector, Matrix

K = int(sys.argv[1]); OUT = sys.argv[2]
VIEWS = (sys.argv[3] if len(sys.argv) > 3 else 'front,rear,iso,chase').split(',')
bpy.ops.wm.read_factory_settings(use_empty=True)
SC = bpy.context.scene

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import *
kit.VERSIONS[K](); kit.cut_all()
INFO = kit.INFO; PARTS = kit.PARTS; CUTTERS = kit.CUTTERS
COL = SC.collection

# ---------------------------------------------------------------- prizor
def ground():
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=80)
    o = mk('tla', bm, mat('trava', '#5e7d3b', 0.95)); PARTS.remove(o)
    bm = bmesh.new(); hexa_bm(bm, bb(-5.0, 5.0, -80, 80, 0.0, 0.005))
    o = mk('cesta', bm, mat('asfalt', '#55585c', 0.9)); PARTS.remove(o)
    bm = bmesh.new()
    for x in (-4.7, 4.55): hexa_bm(bm, bb(x, x + 0.15, -80, 80, 0.005, 0.008))
    y = -80
    while y < 80: hexa_bm(bm, bb(-0.07, 0.07, y, y + 3, 0.005, 0.008)); y += 9
    o = mk('crte', bm, mat('crta', '#e9e7df', 0.6)); PARTS.remove(o)
ground()
for o in PARTS: o.location.x += 2.2     # desni pas
for c in CUTTERS: c.location.x += 2.2

w = bpy.data.worlds.new('w'); SC.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*lin('#b9cde3'), 1); bg.inputs['Strength'].default_value = 0.9
sd = bpy.data.lights.new('sonce', 'SUN'); sd.energy = 3.6; sd.angle = math.radians(2.5)
so = bpy.data.objects.new('sonce', sd); COL.objects.link(so)
so.rotation_euler = (math.radians(42), 0, math.radians(-35))

SC.render.engine = 'CYCLES'; SC.cycles.device = 'CPU'; SC.cycles.samples = 48
SC.cycles.use_denoising = True
try: SC.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
SC.cycles.max_bounces = 4
SC.view_settings.view_transform = 'AgX'
try: SC.view_settings.look = 'AgX - Punchy'
except Exception: pass

def look(cam, target):
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def shoot(tag, loc, target, res, lens=50, ortho=None):
    cd = bpy.data.cameras.new(tag)
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    else: cd.lens = lens
    cd.clip_end = 400
    co = bpy.data.objects.new(tag, cd); COL.objects.link(co); co.location = loc; look(co, target)
    SC.camera = co; SC.render.resolution_x, SC.render.resolution_y = res
    SC.render.filepath = os.path.join(OUT, 'v%d_%s.png' % (K, tag))
    bpy.ops.render.render(write_still=True)

L, H = INFO['L'], INFO['H']; cy = (INFO['ymin'] + INFO['ymax']) / 2; cx = 2.2
tgt = (cx, cy, H * 0.42)
dist = L * 1.55 + 4
for v in VIEWS:
    if v == 'front':
        a, e = math.radians(35), math.radians(14)
        shoot('front', (cx + dist * math.sin(a) * math.cos(e) * -1, cy + dist * math.cos(a) * math.cos(e), H * 0.42 + dist * math.sin(e)), tgt, (960, 720))
    if v == 'rear':
        a, e = math.radians(35), math.radians(16)
        shoot('rear', (cx + dist * math.sin(a) * math.cos(e), cy - dist * math.cos(a) * math.cos(e), H * 0.42 + dist * math.sin(e)), tgt, (960, 720))
    if v == 'iso':   # izometrična kamera igre (telefon ležeče): od zgoraj pod kotom, ortografsko
        a, e = math.radians(45), math.radians(48); d = 60
        shoot('iso', (cx - d * math.sin(a) * math.cos(e), cy + d * math.cos(a) * math.cos(e), d * math.sin(e)), (cx, cy, 1.0), (960, 540), ortho=max(L * 2.3, 16))
    if v == 'chase':   # kamera za avtom (telefon pokonci)
        back = INFO['ymin'] - 6.5 - L * 0.25
        shoot('chase', (cx, back, H + 1.6), (cx, INFO['ymax'] + 10, H * 0.55), (540, 960), lens=20)

# ---------------------------------------------------------------- števci in izvoz
dg = bpy.context.evaluated_depsgraph_get()
tris = verts = 0
for o in PARTS:
    me = o.evaluated_get(dg).to_mesh()
    me.calc_loop_triangles(); tris += len(me.loop_triangles); verts += len(me.vertices)
    o.evaluated_get(dg).to_mesh_clear()
INFO.update(tris=tris, verts=verts, parts=len(PARTS), mats=len({o.data.materials[0].name for o in PARTS}))
bpy.ops.object.select_all(action='DESELECT')
for o in PARTS: o.select_set(True)
try:
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'v%d.glb' % K), export_format='GLB', use_selection=True, export_apply=True)
    INFO['glb'] = os.path.getsize(os.path.join(OUT, 'v%d.glb' % K))
except Exception as ex:
    INFO['glb_err'] = str(ex)[:200]
json.dump(INFO, open(os.path.join(OUT, 'v%d.json' % K), 'w'), ensure_ascii=False)
print('GAS', K, json.dumps(INFO, ensure_ascii=False))
