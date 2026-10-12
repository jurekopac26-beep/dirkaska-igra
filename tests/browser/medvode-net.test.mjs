// Medvode as a race circuit (def.barrier): inside the barrier the cars drive on one surface, asphalt (gravel beside the castle road), with
// no grass, seam or step in it, and the surface drawn is the one the cars drive on. Looked at from above at points all over the free
// ground (the run-off on both sides of the road every 20 m, the rings' zones round their islands), the first surface a ray meets is the
// road's or the run-off's (not the terrain's grass), at the height the physics puts a car there (Track.yAt) within 10 cm.
//   node tests/browser/medvode-net.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: one surface inside the barrier');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 0, camera: 'iso', weather: 'dry', mode: 'tt' }, { width: 640, height: 360 });
  await startTrack(page, 'medvode');
  const r = await page.evaluate(() => {
    const g = window.__game, Tk = g.race.track, W = Render.world; g.pause();
    const gMat = W.ground && W.ground.children.length ? W.ground.children[0].material : null;
    const meshes = []; W.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.visible) meshes.push(o); });
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), Q = {};
    const skipS = (Tk.def.overpass || []).map(o => [Tk.startS + o.d[0] - 4, Tk.startS + o.d[1] + 4]).concat((Tk.def.bridges || []).map(([a, b]) => [Tk.startS + a - 6, Tk.startS + b + 6]));
    const res = { n: 0, grass: [], step: [], none: 0, other: 0, worst: 0 };
    const probe = (x, z, hint, where) => {
      const y = Tk.yAt(Tk.query(x, z, hint, Q)); from.set(x, y + 30, z); rc.set(from, down); rc.far = 60;
      const hits = rc.intersectObjects(meshes, false); let h = null;
      for (const c of hits) { const n = c.face && c.face.normal; if (n && Math.abs(n.y) < 0.7) { h = null; break; } h = c; break; }   // (a wall, a board, a post in the way: not the ground; skipped)
      if (!h) { res.other++; return; }
      res.n++;
      if (gMat && h.object.material === gMat) { if (res.grass.length < 12) res.grass.push(`${where} (${x.toFixed(1)}, ${z.toFixed(1)})`); return; }
      const dy = h.point.y - y, m0 = h.object.material; if (dy > 1.2 || (!m0.map && m0.vertexColors && h.object.material !== W.asphaltMat)) { res.n--; res.other++; return; }   // (a gantry's beam, a roof over it; a kerb, an island, a sidewalk's raised edge (vertex-coloured, no texture): not the driving surface)
      res.worst = Math.max(res.worst, Math.abs(dy));
      if (Math.abs(dy) > 0.1 && res.step.length < 12) { const o = h.object, m = o.material; res.step.push(`${where} (${x.toFixed(1)}, ${z.toFixed(1)}) ${dy > 0 ? '+' : ''}${dy.toFixed(2)} m [${o.name || m.type} v${o.geometry.attributes.position.count}${m.polygonOffset ? ' po' + m.polygonOffsetFactor : ''}${m.map && W.asphaltMat && m.map === W.asphaltMat.map ? ' asphalt' : ''}]`); }
    };
    for (let i = 4; i < Tk.N - 4; i += 10) { const s = i * Tk.ds; if (s < Tk.startS - 150 || skipS.some(([a, b]) => s > a && s < b)) continue;
      for (const sd of [-1, 1]) { const w = Tk.wAt(i) + (Tk.walk ? Tk.walk[sd > 0 ? 1 : 0][i] : 0), b = sd > 0 ? Tk.br[i] : Tk.bl[i];
        for (const o of [w + 0.4, (w + b) / 2, b - 0.6]) { if (o < w + 0.3) continue; const x = Tk.px[i] + Tk.nx[i] * sd * o, z = Tk.pz[i] + Tk.nz[i] * sd * o;
          if (Tk.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.ri + 2.2)) continue; probe(x, z, i, `d ${Math.round(s - Tk.startS)} ${sd > 0 ? 'right' : 'left'} ${o.toFixed(1)} m`); } } }
    for (const R of Tk.rings) { if (!(R.zr > 0)) continue; const hint = Tk.nearestIdx(R.x + R.r, R.z);
      for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; if ((R.shut || []).some(S => Math.abs(((a - Math.atan2(S.uz, S.ux) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.12)) continue;
        for (const rr of [R.r - R.hw + 0.4, R.r, R.r + R.hw + 0.5, R.zr - 0.6]) { if (rr < R.ri + 2.2) continue; probe(R.x + Math.cos(a) * rr, R.z + Math.sin(a) * rr, hint, `ring at ${Math.round(R.x)},${Math.round(R.z)} r ${rr.toFixed(1)}`); } } }
    return res;
  });
  T.check('the free ground probed from above: a surface under every point (a wall or a board in the way only now and then)', r.n > 1500 && r.other < r.n * 0.05, `${r.n} points, ${r.other} with something upright first`);
  T.check('no grass inside the barrier: the first surface is the road\'s, the run-off\'s or a ring\'s (asphalt, the castle road\'s gravel), never the terrain', r.grass.length === 0, r.grass.length ? r.grass.join('; ') : `${r.n} points`);
  T.check('no step: the surface drawn is the one the cars drive on (Track.yAt) within 10 cm', r.step.length === 0, r.step.length ? r.step.join('; ') : `worst ${r.worst.toFixed(3)} m`);
  T.check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
