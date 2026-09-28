// World fingerprint: for every track the built 3D world (every mesh's vertices, indices, placement, instances and
// material, the knockable props and the prop floor) is hashed and compared with tests/golden/world.json.
// Proves that a code reorganisation left every track exactly as it was.
//   node tests/browser/world.test.mjs            check
//   node tests/browser/world.test.mjs --update   write new reference values (only after an intended change!)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const FILE = path.join(REPO, 'tests', 'golden', 'world.json');
const update = process.argv.includes('--update');
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const T = checker('world fingerprint');
const srv = await serve();
const browser = await launch();
const out = {};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  for (const id of await trackIds(page)) {
    await startTrack(page, id);
    const fp = await page.evaluate(() => {
      const W = Render.world, race = window.__game.race, Tr = race.track;
      World.update(W, 0, null);   // animated scenery (boats on the lake) to its pose at time 0, so the fingerprint does not depend on timing
      const fnv = (h, u32) => { for (let i = 0; i < u32.length; i++) { h ^= u32[i]; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const f32 = (a) => { const f = a instanceof Float32Array ? a : Float32Array.from(a); return new Uint32Array(f.buffer, f.byteOffset, f.length); };
      const f64 = (a) => { const f = Float64Array.from(a); return new Uint32Array(f.buffer); };
      const str = (s) => Uint32Array.from(String(s), ch => ch.charCodeAt(0));
      const groups = {}; let h = 2166136261, meshes = 0, verts = 0, inst = 0;
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => {
        if (!o.isMesh && !o.isLine && !o.isPoints) return;
        const g = o.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const key = (o.name || '-') + ':' + mats.map(m => m ? m.type : '-').join('+');
        let m = fnv(groups[key] || 2166136261, f32(pos.array)); if (g.index) m = fnv(m, Uint32Array.from(g.index.array));
        m = fnv(m, f64(o.matrixWorld.elements));
        for (const mt of mats) if (mt) m = fnv(m, str(mt.type + (mt.color ? mt.color.getHexString() : '') + (mt.map ? 'map' : '') + (mt.vertexColors ? 'vc' : '') + (mt.transparent ? 't' + mt.opacity : '')));
        if (o.isInstancedMesh) { m = fnv(m, f32(o.instanceMatrix.array.subarray(0, o.count * 16))); if (o.instanceColor) m = fnv(m, f32(o.instanceColor.array.subarray(0, o.count * 3))); inst += o.count; }
        groups[key] = m; h = fnv(h, Uint32Array.of(m)); meshes++; verts += pos.count;
      });
      const props = (W.props || []).map(q => [q.kind, q.x, q.z, q.yaw || 0, q.col || 0, q.i == null ? -1 : q.i].join(','));
      const ph = fnv(2166136261, str(props.join(';')));
      const F = race.propFloor; let fh = 2166136261, fn = 0;
      if (F) { const q = { i: 0, d: 0, s: 0 }; for (let i = 0; i < Tr.N; i += 7) for (const sd of [-1, 1]) for (let e = 0.1; e < 12; e += 0.9) { q.i = i; q.s = i * Tr.ds; q.d = sd * (Tr.w + e); fh = fnv(fh, f64([F(q)])); fn++; } }
      return { meshes, verts, instances: inst, props: props.length, crowd: W.crowdN || 0, world: h.toString(16), propsHash: ph.toString(16), floor: F ? fh.toString(16) + '/' + fn : null, groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.toString(16)])) };
    });
    out[id] = fp;
    const g = golden[id];
    if (update) { console.log(`${id.padEnd(10)} meshes ${fp.meshes} verts ${fp.verts} instances ${fp.instances} props ${fp.props} crowd ${fp.crowd} world ${fp.world}`); continue; }
    if (!g) { T.check(`${id}: world as in the reference`, false, 'no reference'); continue; }
    const diffGroups = Object.keys(Object.assign({}, g.groups, fp.groups)).filter(k => g.groups[k] !== fp.groups[k]);
    T.check(`${id}: world as in the reference`, g.world === fp.world && g.propsHash === fp.propsHash && g.floor === fp.floor,
      `${fp.meshes} meshes, ${fp.verts} verts, ${fp.instances} instances, ${fp.props} props, ${fp.crowd} spectators` +
      (g.world !== fp.world ? `; changed mesh groups: ${diffGroups.slice(0, 8).join(', ')}${diffGroups.length > 8 ? ' …' : ''}` : '') +
      (g.propsHash !== fp.propsHash ? '; props changed' : '') + (g.floor !== fp.floor ? '; prop floor changed' : ''));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log('written ' + FILE); }
else T.done();
