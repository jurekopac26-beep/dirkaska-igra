// Life in the woods (js/world-zivali.js, World.life) and the parked car (parkedCar in js/world.js): on a few real tracks of different countries
// the glades are there, their animals are the ones of the track's country (World.lifeTable) with the company their kind keeps (World.lifeSoc:
// alone, a male and a female, a herd of 3-10 with its young), none stands on the road or by its barrier, the still ones are one merged mesh per
// 256 m chunk; the ones alone walk or graze (their own mesh, moving with time); each of these tracks has its scene (World.lifeScenes) near the
// road; a test track has none. The parked car: every kind built, within its vertex budget (the car parks' lite one far cheaper).
//   node tests/browser/zivali.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const TRACKS = ['nring', 'vrsic', 'bathurst', 'iroha', 'caracoles', 'ouninpohja'];
const T = checker('life in the woods, the parked car');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
  for (const id of TRACKS.concat(['jezero'])) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate((id) => {
      const w = Render.world, st = w.lifeStats, Z = World.lifeTable[id], SOC = World.lifeSoc, SC = World.lifeScenes[id], A = World.api, T = window.__game.race.track;
      const grp = w.root.getObjectByName('life'); let meshes = 0, liveMeshes = 0, verts = 0;
      if (grp) grp.traverse(m => { if (!m.isMesh) return; if (m.material.userData && m.material.userData.U) { liveMeshes++; return; } meshes++; verts += m.geometry.attributes.position.count; });
      if (!st) return { none: true, meshes: meshes + liveMeshes };
      // the kinds allowed on this track: its own, the company they keep (SOC: the females, the males, the leads, the others, the young), the scene's
      const ok = new Set(Z.a), add = (k) => { ok.add(k); const S = SOC[k]; if (!S) return; for (const f of ['M', 'F', 'lead', 'y']) if (S[f]) ok.add(S[f]); if (S.rest) [].concat(S.rest).forEach(x => ok.add(x)); };
      for (const k of Z.a) add(k); if (SC) { add(SC.kind); if (SC.with) add(SC.with[0]); }
      const strange = Object.keys(st.kinds).filter(k => !ok.has(k));
      // nothing on the road: each glade's centre at least 3 m beyond the barrier (A.clearance: the distance beyond the nearest barrier)
      let near = 0; for (const [m, side, b] of st.at) { const s = T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + b);
        if (A.clearance(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < 3) near++; }
      // the live ones move: one near the camera of a car on the road, its place at two times
      let moved = null; const L = w.dyn.life;
      if (L && L.live.length) { const a = L.live[0], cam = { position: { x: a.cx, y: 0, z: a.cz } }, car = { x: a.cx, z: a.cz };
        World.lifeStep(L, 3, car, cam); const p0 = a.m.position.clone(), r0 = a.m.rotation.y; World.lifeStep(L, 20, car, cam); const p1 = a.m.position.clone();
        moved = { d: +p0.distanceTo(p1).toFixed(2), turn: +(a.m.rotation.y - r0).toFixed(2), mode: a.mode }; World.lifeStep(L, 0, null, null); }
      const sc = st.scene && { kind: st.scene.kind, clear: +A.clearance(st.scene.x, st.scene.z).toFixed(1) };
      return { things: st.things, groups: st.groups, animals: st.animals, live: st.live, liveMeshes, sizes: st.sizes, strange, near, at: st.at.length, meshes, verts, km: T.len / 1000, moved, scene: sc, sceneWant: SC ? SC.kind : null };
    }, id);
    if (id === 'jezero') { T.check('a test track (Jezero Ring) has no life in its woods', !!r.none && !r.meshes, JSON.stringify(r)); continue; }
    T.check(`${id}: glades with things and animals of its country`, !r.none && r.at >= 8 && r.groups >= 3 && r.animals >= 6 && !r.strange.length, JSON.stringify(Object.assign({}, r, { strange: r.strange.join(',') })));
    T.check(`${id}: animals alone, in pairs and in herds`, r.sizes && r.sizes.one > 0 && r.sizes.herd > 0 && r.sizes.one + r.sizes.pair + r.sizes.herd === r.groups, JSON.stringify(r.sizes));
    T.check(`${id}: the ones alone walk or graze (own meshes, moving with time)`, r.live > 0 && r.liveMeshes === r.live && r.moved && (r.moved.d > 0.05 || Math.abs(r.moved.turn) > 0.05), `${r.live} live, ${JSON.stringify(r.moved)}`);
    T.check(`${id}: its scene (${r.sceneWant}) near the road, off it`, !r.sceneWant || (r.scene && r.scene.kind === r.sceneWant && r.scene.clear >= 6), JSON.stringify(r.scene));
    T.check(`${id}: no glade on the road or by its barrier`, r.near === 0, `${r.near} of ${r.at}`);
    T.check(`${id}: merged, one mesh per 256 m chunk (at most ~6 per km of road), under 25k vertices per km`, r.meshes > 0 && r.meshes <= 6 * r.km + 10 && r.verts < 25000 * r.km, `${r.meshes} meshes, ${Math.round(r.verts / 1000)}k vertices, ${r.km.toFixed(1)} km`);
  }
  const car = await page.evaluate(() => {   // every kind of the parked car, and the car parks' lite one
    const A = World.api, out = [];
    for (let k = 0; k < 6; k++) { const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [0.8, 0.2, 0.2], k); out.push(g.P.length / 3); }
    const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [1, 1, 1], 0, true); out.push(g.P.length / 3);
    return out;
  });
  T.check('the parked car: six kinds, each under 400 vertices', car.slice(0, 6).every(n => n > 100 && n < 400), car.slice(0, 6).join(', '));
  T.check('the car parks\' lite car: under 150 vertices', car[6] > 60 && car[6] < 150, String(car[6]));
  T.check('no page errors', !errors.length, errors.slice(0, 4).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
