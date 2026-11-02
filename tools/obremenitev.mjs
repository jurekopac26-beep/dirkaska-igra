// A track's load on the phone, object by object: the same six samples round the lap as tests/browser/perf.test.mjs (844 x 390, normal
// quality, NIZKA, shadows, the chase camera, Math.random seeded), and every draw call of each sample (the shadow pass's too) put down to
// the mesh that made it: which builder line added it to the scene (`[mulholland:512<world:4344]`: world-mulholland.js line 512 by way of
// World's IChunks.addTo), its material and geometry (g: vertices, i: indices, inst: instances), W the world (Render.world.root) or O the
// rest (cars, sky, effects), SH the shadow pass. For an instanced mesh also how much of it lies more than 60 / 100 / 150 m from the
// camera (what a lighter far version would save). In test-results/obremenitev/<id>.json (all of it) and on the screen (the samples, then the
// busiest by vertices and by draw calls, grouped).
//   node tools/obremenitev.mjs mulholland
//   node tools/obremenitev.mjs iroha --vzorec 5 --po klici --svet --n 40      (one sample, by draw calls, the world only, 40 lines)
//   node tools/obremenitev.mjs iroha --vzorec 5 --posamezno                   (each mesh by itself, with its place: @x,y,z)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const vz = flag('--vzorec'), po = flag('--po') || 'oglisca', nMax = +(flag('--n') || 25), svet = has('--svet'), drugo = has('--drugo'), posamezno = has('--posamezno');
const id = args[0];
if (!id || args.length > 1 || !['oglisca', 'klici'].includes(po)) {
  console.log('usage: node tools/obremenitev.mjs <id> [--vzorec 0-5] [--po oglisca|klici] [--svet|--drugo] [--posamezno] [--n 25]');
  process.exit(2);
}
const out = path.join(REPO, 'test-results', 'obremenitev');
const srv = await serve(), browser = await launch();
let r;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };   // (counted as perf.test.mjs counts them)
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    // where each object was added to the scene: the first line of a world builder (or render.js, game.js) on the stack, World's own after it
    const add = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function (...objs) {
      const st = new Error().stack.split('\n').slice(2), fr = [];
      for (const l of st) { const m = l.match(/(world[-a-z0-9]*|render|game)\.js[^:]*:(\d+)/); if (m) { fr.push(m[1].replace('world-', '') + ':' + m[2]); if (fr.length >= 2 || m[1] !== 'world') break; } }
      for (const o of objs) if (o && o.userData && !o.userData.src) o.userData.src = fr.reverse().join('<');
      return add.apply(this, objs);
    };
  });
  await startTrack(page, id);
  r = await page.evaluate(() => {
    const g = window.__game;
    Render.scene.onBeforeRender = (R) => { window.__R = R; }; Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); Render.scene.onBeforeRender = () => {};   // (the renderer: its renderBufferDirect is each draw)
    let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.onAction('restart'); g.pause();
    g.race.lch = null; for (const c of g.race.cars) c.lch = null;
    const R = window.__R, orig = R.renderBufferDirect, m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(); let rec = null;
    const label = (o) => { const n = []; for (let q = o; q && n.length < 3; q = q.parent) if (q.name) n.push(q.name); return (n.join('<') || o.type) + ' [' + (o.userData.src || (o.parent && o.parent.userData.src) || '') + ']'; };
    R.renderBufferDirect = function (cam, sc, geo, mat, obj) {
      const c0 = __gl.calls, v0 = __gl.verts, res = orig.apply(this, arguments);
      if (!rec) return res;
      const sh = !!(mat.isMeshDepthMaterial || mat.isMeshDistanceMaterial || (cam && cam.isOrthographicCamera));
      let w = 'O'; for (let q = obj; q; q = q.parent) if (q === Render.world.root) { w = 'W'; break; }
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      const c = geo.boundingSphere.center.clone().applyMatrix4(obj.matrixWorld);
      const kind = label(obj) + ' | ' + mat.type + (mat.color ? ' c' + mat.color.getHexString() : '') + (mat.map ? ' map' : '') + (mat.vertexColors ? ' vc' : '') + (obj.isInstancedMesh ? ' inst' : '') + ' g' + geo.attributes.position.count + (geo.index ? '/i' + geo.index.count : '');
      const e = rec[obj.id + (sh ? 's' : '')] || (rec[obj.id + (sh ? 's' : '')] = { sh, w, kind, at: [Math.round(c.x), Math.round(c.y), Math.round(c.z)], inst: obj.isInstancedMesh ? obj.count : 0, calls: 0, v: 0, far: [0, 0, 0] });
      e.calls += __gl.calls - c0; e.v += __gl.verts - v0;
      if (obj.isInstancedMesh && !sh && obj.count) {
        const per = (__gl.verts - v0) / obj.count, cp = cam.position;
        for (let t = 0; t < obj.count; t++) { obj.getMatrixAt(t, m4); v3.setFromMatrixPosition(m4).applyMatrix4(obj.matrixWorld); const d = Math.hypot(v3.x - cp.x, v3.z - cp.z); if (d > 60) e.far[0] += per; if (d > 100) e.far[1] += per; if (d > 150) e.far[2] += per; }
      }
      return res;
    };
    const P = g.race.player, s = [];
    try {
      for (let k = 0; k < 6; k++) {   // (as perf.test.mjs: the same steps, so the same places and the same counts)
        const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
        rec = {}; const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {});
        s.push({ k, calls: __gl.calls - c0, verts: __gl.verts - v0, x: Math.round(P.x), z: Math.round(P.z), meshes: Object.values(rec).sort((a, b) => b.v - a.v) });
        rec = null;
        for (let i = 0; i < 30; i++) g.sim(1 / 60, true);
        Render.scene.visible = false; for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); Render.scene.visible = true;
      }
    } finally { R.renderBufferDirect = orig; }
    return s;
  });
  if (errors.length) console.log('page errors: ' + errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(r));
const k = (v) => (v / 1000).toFixed(1) + 'k';
for (const x of r) {
  const w = x.meshes.filter(e => e.w === 'W'), wc = w.reduce((a, e) => a + e.calls, 0), wv = w.reduce((a, e) => a + e.v, 0);
  console.log(`vzorec ${x.k}  (${x.x}, ${x.z})  klici ${x.calls}  oglišča ${k(x.verts)}  · svet ${wc} / ${k(wv)}  · drugo ${x.calls - wc} / ${k(x.verts - wv)}`);
}
const show = (x, by) => {
  let L = x.meshes.filter(e => (!svet || e.w === 'W') && (!drugo || e.w === 'O'));
  if (!posamezno) { const G = new Map(); for (const e of L) { const key = (e.sh ? 'SH ' : '   ') + e.w + ' ' + e.kind; const q = G.get(key) || { key, n: 0, calls: 0, v: 0, far: [0, 0, 0] }; q.n++; q.calls += e.calls; q.v += e.v; for (let j = 0; j < 3; j++) q.far[j] += e.far[j]; G.set(key, q); } L = [...G.values()]; }
  else L = L.map(e => Object.assign({ key: (e.sh ? 'SH ' : '   ') + e.w + ' ' + e.kind + (e.inst ? ' ×' + e.inst : '') + ' @' + e.at.join(',') }, e));
  L.sort((a, b) => by === 'klici' ? b.calls - a.calls || b.v - a.v : b.v - a.v);
  console.log(`\nvzorec ${x.k}: klici ${x.calls}, oglišča ${k(x.verts)} — po ${by === 'klici' ? 'klicih' : 'ogliščih'}`);
  for (const q of L.slice(0, nMax)) console.log(`${String(q.calls).padStart(5)} ${k(q.v).padStart(8)}${q.far[0] ? `  (>60 m ${k(q.far[0])}, >100 m ${k(q.far[1])}, >150 m ${k(q.far[2])})` : ''}  ${q.key}`);
};
if (vz != null) show(r[+vz], po);
else { show(r.reduce((a, b) => b.verts > a.verts ? b : a), 'oglisca'); show(r.reduce((a, b) => b.calls > a.calls ? b : a), 'klici'); }
console.log(`\nwrote ${path.relative(REPO, path.join(out, id + '.json'))}`);
