// Life in the woods (js/world-zivali.js, World.life) and the parked car (parkedCar in js/world.js): on a few real tracks of different countries
// the glades are there, their animals are the ones of the track's country (World.lifeTable) with the company their kind keeps (World.lifeSoc:
// alone, a male and a female, a herd of 3-10 with its young), none stands on the road or by its barrier, the herds are one merged mesh per
// 256 m chunk, every animal in them moved by the time in the chunk's shader (the user, 2. 11. 2026: »živali naj se premikajo pomalo«: the
// picture of the scene's herd changes with time); the ones alone walk or graze (their own mesh, moving with time); each of these tracks has
// its scene (World.lifeScenes) near the road; a test track has none. The parked car: every kind built, within its vertex budget (the lite one far cheaper); where the circuits'
// car parks were, a lot of each kind (the fans' camp, motorhomes and caravans, the fans' area) within its budget.
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
      const grp = w.root.getObjectByName('life'); let meshes = 0, liveMeshes = 0, verts = 0, herdMeshes = 0, herdAnimals = 0;
      let span = 0;   // (how far the scene's herd spreads from its middle)
      if (grp) grp.traverse(m => { if (!m.isMesh) return; if (m.material.userData && m.material.userData.U) { liveMeshes++; return; } meshes++; verts += m.geometry.attributes.position.count;
        if (!m.material.userData.herd) return; herdMeshes++; const M = m.geometry.attributes.aM, L = m.geometry.attributes.aL; let last = '';   // (the herds' chunks: each animal its vertices in a run, its place aL)
        for (let v = 0; v < M.count; v++) if (M.getX(v) >= 50) { const k = L.getX(v) + ',' + L.getZ(v); if (k !== last) { herdAnimals++; last = k;
          if (st.scene) { const d = Math.hypot(L.getX(v) - st.scene.x, L.getZ(v) - st.scene.z); if (d < 14) span = Math.max(span, d); } } } });
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
      // the scene's herd in a picture from the chase camera 30 m before it, narrowed onto the herd, at two times of the herds' shader (held: the
      // world's step sets it every frame): the share of the pixels that changed
      let herdPic = null;
      if (st.scene && L && L.U) {
        const g = window.__game, R = g.race, P = R.player, s0 = (T.startS || 0) + st.scene.m, i = T.idx(((s0 - 30) % T.len + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
        for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; }
        P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q);
        Render.setShot(null); Render.resetCam(); for (let f = 0; f < 6; f++) Render.frame(1 / 30, 1, P, 'chase', {});
        const cp = Render.camera.position.clone(), gy = w.groundH(st.scene.x, st.scene.z), ctr = new THREE.Vector3(st.scene.x, (Number.isFinite(gy) ? gy : cp.y - 20) + 1, st.scene.z), D = cp.distanceTo(ctr);
        let tt = 0; Object.defineProperty(L.U, 'value', { get: () => tt, set: () => {}, configurable: true });
        const pic = (t) => { tt = t; Render.setShot({ px: cp.x, py: cp.y, pz: cp.z, tx: ctr.x, ty: ctr.y, tz: ctr.z, fov: Math.max(3, Math.min(30, 2 * Math.atan((span + 1.5) / D) * 180 / Math.PI)), fogD: D });
          const c = Render.snapshot(P, 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
        const a = pic(0), b = pic(6); let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 40) n++;
        delete L.U.value; L.U.value = 0; Render.setShot(null); herdPic = +(n / (a.length / 4) * 100).toFixed(2);
      }
      return { things: st.things, groups: st.groups, animals: st.animals, live: st.live, liveMeshes, herdMeshes, herdAnimals, herdPic, sizes: st.sizes, strange, near, at: st.at.length, meshes, verts, km: T.len / 1000, moved, scene: sc, sceneWant: SC ? SC.kind : null };
    }, id);
    if (id === 'jezero') { T.check('a test track (Jezero Ring) has no life in its woods', !!r.none && !r.meshes, JSON.stringify(r)); continue; }
    T.check(`${id}: glades with things and animals of its country`, !r.none && r.at >= 8 && r.groups >= 3 && r.animals >= 6 && !r.strange.length, JSON.stringify(Object.assign({}, r, { strange: r.strange.join(',') })));
    T.check(`${id}: animals alone, in pairs and in herds`, r.sizes && r.sizes.one > 0 && r.sizes.herd > 0 && r.sizes.one + r.sizes.pair + r.sizes.herd === r.groups, JSON.stringify(r.sizes));
    T.check(`${id}: the ones alone walk or graze (own meshes, moving with time)`, r.live > 0 && r.liveMeshes === r.live && r.moved && (r.moved.d > 0.05 || Math.abs(r.moved.turn) > 0.05), `${r.live} live, ${JSON.stringify(r.moved)}`);
    T.check(`${id}: every other animal moves too (the herds in the chunks, posed by the time in their shader: the scene's picture changes)`, r.herdMeshes > 0 && r.herdAnimals + r.live === r.animals && r.herdPic > 0.3, `${r.herdAnimals} in ${r.herdMeshes} herd meshes + ${r.live} live of ${r.animals}, ${r.herdPic} % of the scene's picture changed in 6 s`);
    T.check(`${id}: its scene (${r.sceneWant}) near the road, off it`, !r.sceneWant || (r.scene && r.scene.kind === r.sceneWant && r.scene.clear >= 6), JSON.stringify(r.scene));
    T.check(`${id}: no glade on the road or by its barrier`, r.near === 0, `${r.near} of ${r.at}`);
    T.check(`${id}: merged, one mesh per 256 m chunk (at most ~6 per km of road), under 25k vertices per km`, r.meshes > 0 && r.meshes <= 6 * r.km + 10 && r.verts < 25000 * r.km, `${r.meshes} meshes, ${Math.round(r.verts / 1000)}k vertices, ${r.km.toFixed(1)} km`);
  }
  const car = await page.evaluate(() => {   // every kind of the parked car, and the car parks' lite one
    const A = World.api, out = [];
    for (let k = 0; k < 6; k++) { const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [0.8, 0.2, 0.2], k); out.push(g.P.length / 3); }
    const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [1, 1, 1], 0, true); out.push(g.P.length / 3);
    for (const k of ['kamp', 'avtodomi', 'navijaci']) { const gl = new World.GB(); A.campLot(gl, () => 0, 0, 0, 0.3, k, 1); out.push(gl.P.length / 3); }   // (where the circuits' car parks were: one 16 m lot of each kind)
    return out;
  });
  T.check('the parked car: six kinds, each under 400 vertices', car.slice(0, 6).every(n => n > 100 && n < 400), car.slice(0, 6).join(', '));
  T.check('the car parks\' lite car: under 200 vertices (the full one\'s outline and glasshouse, no rims, bumpers, lights or shadow)', car[6] > 60 && car[6] < 200 && car[6] < Math.min(...car.slice(0, 6)), String(car[6]));
  T.check('where the car parks were: a 16 m lot of the fans\' camp, of motorhomes and caravans, of the fans\' area, each under 800 vertices (fewer than the 7-10 cars it replaces)', car.slice(7).every(n => n > 150 && n < 800), car.slice(7).join(', '));
  T.check('no page errors', !errors.length, errors.slice(0, 4).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
