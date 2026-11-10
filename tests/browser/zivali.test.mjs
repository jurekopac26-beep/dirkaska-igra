// Life in the woods (js/world-zivali.js, World.life) and the parked car (parkedCar in js/world.js): on a few real tracks of different countries
// the glades are there, their animals are the ones of the track's country (World.lifeTable) with the company their kind keeps (World.lifeSoc:
// alone, a male and a female, a herd of 3-10 with its young), none stands on the road or by its barrier, the herds are one merged mesh per
// 256 m chunk, every animal in them moved by the time in the chunk's shader (the user, 2. 11. 2026: »živali naj se premikajo pomalo«: the
// picture of the scene's herd changes with time; their shadows soft spots under them, none in the shadow map: »naj imajo povsem mehke sence«);
// the ones alone walk or graze (their own mesh, moving with time); each of these tracks has
// its scene (World.lifeScenes) near the road, the ones with a place of their own (m, side: where they really are, OSM) there; Medvode's
// stork flies off its nest as the car comes (L.fly: not a live one, one of its own); Crystal Palace's ducks float on the lake (float: at its
// level); a test track has none (Great Alpine Road's koala in its gum tree too: a test track since 9. 11. 2026). The parked car: every kind built, within its vertex budget (the lite one far cheaper); where the circuits'
// car parks were, a lot of each kind (the fans' camp, motorhomes and caravans, the fans' area) within its budget.
//   node tests/browser/zivali.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const TRACKS = ['nring', 'katu', 'bathurst', 'iroha', 'caracoles', 'medvode'];   // (Medvode: scenes at their real places with things of their own, its stork that flies off; Katu-Jaryk in Vršič's place, a test track since 6. 11. 2026; Ouninpohja, a test track since 8. 11. 2026, has no animals' scenes)
// (how many glades a track must have: Katu-Jaryk's ladder of hairpins keeps each leg's run-off short of the middle between the legs since the
// serpentines' barriers of Track._buildEdges (limitNear, 6. 11. 2026), so fewer spots fit between them: 5 glades, before 11)
const MIN = { katu: 4 };
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
      let soft = 0, hard = 0;   // (the animals' soft shadows: their own see-through meshes; no animal in the shadow map)
      if (grp) grp.traverse(m => { if (!m.isMesh) return; if (m.material.userData && m.material.userData.soft) { soft++; if (!m.material.transparent || m.material.depthWrite) hard++; return; }
        if (m.material.userData && m.material.userData.U) { liveMeshes++; if (m.castShadow) hard++; return; } meshes++; verts += m.geometry.attributes.position.count;
        if (!m.material.userData.herd) return; herdMeshes++; const M = m.geometry.attributes.aM, L = m.geometry.attributes.aL; let last = '';   // (the herds' chunks: each animal its vertices in a run, its place aL)
        for (let v = 0; v < M.count; v++) if (M.getX(v) >= 50) { const k = L.getX(v) + ',' + L.getZ(v); if (k !== last) { herdAnimals++; last = k;
          if (st.scene) { const d = Math.hypot(L.getX(v) - st.scene.x, L.getZ(v) - st.scene.z); if (d < 14) span = Math.max(span, d); } } } });
      if (!st) return { none: true, meshes: meshes + liveMeshes };
      // the kinds allowed on this track: its own, the company they keep (SOC: the females, the males, the leads, the others, the young), the scene's
      const ok = new Set(Z.a), add = (k) => { ok.add(k); const S = SOC[k]; if (!S) return; for (const f of ['M', 'F', 'lead', 'y']) if (S[f]) ok.add(S[f]); if (S.rest) [].concat(S.rest).forEach(x => ok.add(x)); };
      for (const k of Z.a) add(k); for (const S1 of [].concat(SC || [])) { add(S1.kind); if (S1.with) add(S1.with[0]); }   // (a track's scenes: one, or a list of them)
      const strange = Object.keys(st.kinds).filter(k => !ok.has(k));
      // nothing on the road: each glade's centre at least 3 m beyond the barrier (A.clearance: the distance beyond the nearest barrier)
      let near = 0; for (const [m, side, b] of st.at) { const s = T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + b);
        if (A.clearance(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < 3) near++; }
      // the live ones move: one near the camera of a car on the road, its place at two times
      let moved = null; const L = w.dyn.life;
      if (L && L.live.length) { const a = L.live[0], cam = { position: { x: a.cx, y: 0, z: a.cz } }, car = { x: a.cx, z: a.cz };
        World.lifeStep(L, 3, car, cam); const p0 = a.m.position.clone(), r0 = a.m.rotation.y; World.lifeStep(L, 20, car, cam); const p1 = a.m.position.clone();
        moved = { d: +p0.distanceTo(p1).toFixed(2), turn: +(a.m.rotation.y - r0).toFixed(2), mode: a.mode }; World.lifeStep(L, 0, null, null); }
      // the bird that flies off (L.fly): on its nest while the car is 100 m away; 3 s after the car came within 33 m in the air, away from the
      // car; without a car (as built) back on its nest
      let flight = null;
      if (L && L.fly && L.fly.length) { const F = L.fly[0], cam = { position: { x: F.x, y: F.y, z: F.z } }, at = (d) => ({ x: F.x - F.ax * 15 - F.az * d, z: F.z - F.az * 15 + F.ax * d }), far = at(100), near = at(30);
        World.lifeStep(L, 10, far, cam); const perched = F.sit.visible && !F.fly.visible;
        World.lifeStep(L, 20, near, cam); World.lifeStep(L, 23, near, cam); const p = F.fly.position;
        flight = { perched, flying: F.fly.visible && !F.sit.visible, up: +(p.y - F.y).toFixed(2), off: +(Math.hypot(p.x - near.x, p.z - near.z) - Math.hypot(F.x - near.x, F.z - near.z)).toFixed(1) };
        World.lifeStep(L, 0, null, null); flight.back = F.sit.visible && !F.fly.visible; }
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
      return { things: st.things, groups: st.groups, animals: st.animals, live: st.live, fly: st.fly || 0, flight, wantFly: [].concat(SC || []).some(S1 => (S1.things || []).some(th => th.fly)),
        fixed: [].concat(SC || []).filter(S1 => S1.m != null).map(S1 => ({ kind: S1.kind, m: S1.m, side: S1.side })), scenes: (st.scenes || []).map(x => ({ kind: x.kind, m: x.m, side: x.side })), liveMeshes, herdMeshes, herdAnimals, herdPic, soft, hard, sizes: st.sizes, strange, near, at: st.at.length, meshes, verts, km: T.len / 1000, moved, scene: sc, sceneWant: SC ? [].concat(SC)[0].kind : null };
    }, id);
    if (id === 'jezero') { T.check('a test track (Jezero Ring) has no life in its woods', !!r.none && !r.meshes, JSON.stringify(r)); continue; }
    T.check(`${id}: glades with things and animals of its country`, !r.none && r.at >= (MIN[id] || 8) && r.groups >= 3 && r.animals >= 6 && !r.strange.length, JSON.stringify(Object.assign({}, r, { strange: r.strange.join(',') })));
    T.check(`${id}: animals alone, in pairs and in herds`, r.sizes && r.sizes.one > 0 && r.sizes.herd > 0 && r.sizes.one + r.sizes.pair + r.sizes.herd === r.groups, JSON.stringify(r.sizes));
    T.check(`${id}: the ones alone walk or graze (own meshes, moving with time)`, r.live > 0 && r.liveMeshes === r.live && r.moved && (r.moved.d > 0.05 || Math.abs(r.moved.turn) > 0.05), `${r.live} live, ${JSON.stringify(r.moved)}`);
    T.check(`${id}: soft shadows (one see-through mesh under each live one and for each herd chunk's animals, none of them in the shadow map)`, r.soft === r.live + r.herdMeshes && !r.hard, `${r.soft} soft for ${r.live} live + ${r.herdMeshes} herd meshes, ${r.hard} hard`);
    T.check(`${id}: every other animal moves too (the herds in the chunks, posed by the time in their shader: the scene's picture changes)`, r.herdMeshes > 0 && r.herdAnimals + r.live + r.fly === r.animals && r.herdPic > 0.3, `${r.herdAnimals} in ${r.herdMeshes} herd meshes + ${r.live} live of ${r.animals}, ${r.herdPic} % of the scene's picture changed in 6 s`);
    T.check(`${id}: its scene (${r.sceneWant}) near the road, off it`, !r.sceneWant || (r.scene && r.scene.kind === r.sceneWant && r.scene.clear >= 6), JSON.stringify(r.scene));
    if (r.fixed.length) T.check(`${id}: its scenes where they really are (SCENE's m and side, from OSM: not searched)`, r.fixed.every(f => r.scenes.some(x => x.kind === f.kind && Math.abs(x.m - f.m) <= 2 && x.side === f.side)), JSON.stringify({ fixed: r.fixed, scenes: r.scenes }));
    if (r.wantFly) T.check(`${id}: the bird that flies off (one, apart from the live ones): on its nest while the car is far, in the air and away from the car 3 s after it came near, back on its nest without a car`, r.fly === 1 && !!r.flight && r.flight.perched && r.flight.flying && r.flight.up > 1.5 && r.flight.off > 5 && r.flight.back, JSON.stringify({ fly: r.fly, flight: r.flight }));
    T.check(`${id}: no glade on the road or by its barrier`, r.near === 0, `${r.near} of ${r.at}`);
    T.check(`${id}: merged, one mesh per 256 m chunk (at most ~6 per km of road), under 25k vertices per km`, r.meshes > 0 && r.meshes <= 6 * r.km + 10 && r.verts < 25000 * r.km, `${r.meshes} meshes, ${Math.round(r.verts / 1000)}k vertices, ${r.km.toFixed(1)} km`);
  }
  // a scene where the glades' rules do not hold (a city park), only its scene: Crystal Palace's ducks float on its lake (float: at its level,
  // over the lake's bed) where they really are (want 'on': an animal perched up on its thing; Great Alpine Road's koala in its gum tree was
  // one, its track a test track since 9. 11. 2026: the user's choice, Australia keeps Bathurst)
  for (const [id, want] of [['cpalace', 'float']]) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate((id) => { const st = Render.world.lifeStats, S0 = [].concat(World.lifeScenes[id] || [])[0];
      return { S0: S0 && { kind: S0.kind, m: S0.m, side: S0.side, float: S0.float }, sc: st && S0 && (st.scenes || []).find(x => x.kind === S0.kind) }; }, id);
    const { S0, sc } = r;
    if (want === 'float') T.check(`${id}: its scene's ${S0 && S0.kind} on the water (at the lake's level, over its bed), where they really are`, !!sc && Math.abs(sc.y - S0.float) < 0.01 && sc.g < sc.y - 0.2 && Math.abs(sc.m - S0.m) <= 2 && sc.side === S0.side, JSON.stringify(r));
    else T.check(`${id}: its scene's ${S0 && S0.kind} up on its thing (perched: it stays there)`, !!sc && sc.up >= 2, JSON.stringify(r));
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
