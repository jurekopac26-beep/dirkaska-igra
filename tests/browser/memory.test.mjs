// Memory: switching tracks, restarting races, a crash with loose panels and a pit repair, wrecks repaired where they stand (a kit
// vehicle's and the Peugeot's: their pieces, fire, soot, cracked panes) and browsing cars in the car menu must not leave GPU geometry,
// textures, shader programs or JavaScript memory behind. Round 1 warms up (caches fill, first shaders compile); from round 2 to the
// last the counts must stay flat.
// Every measurement is taken in the same state, so it does not depend on what happened to be on screen before: a fresh
// race on jezero at the start lights (no contacts yet), the game paused, and one frame drawn with frustum culling off, so
// every visible object is on the GPU; then garbage collection.
//   node tests/browser/memory.test.mjs            (MEM_ROUNDS=4 for more rounds)
import { serve, launch, openGame, startTrack, trackIds, simulate, checker } from './lib.mjs';

const T = checker('memory');
const srv = await serve();
const browser = await launch(['--js-flags=--expose-gc', '--enable-precise-memory-info']);
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2 }, undefined, { seed: 777 });
  const ids = await trackIds(page);
  const measure = async () => {
    await startTrack(page, 'jezero'); await simulate(page, 2);
    return page.evaluate(async () => {
      const g = window.__game; g.pause();
      const culled = []; Render.scene.traverse(o => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
      Render.frame(0, 1, g.race.player, g.S.camera, { noFx: true });
      for (const o of culled) o.frustumCulled = true;
      for (let i = 0; i < 3; i++) { if (window.gc) window.gc(); await new Promise(r => setTimeout(r, 150)); }
      const inf = Render.info();
      return { geometries: inf.memory.geometries, textures: inf.memory.textures, programs: inf.programs ? inf.programs.length : 0, heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0 };
    });
  };
  // Bakreni gozd: at racing speed full throttle and full left lock for 2.5 s (damage, loose panels on the track), then on
  // autopilot into the pits (rescued when stuck, like a player pressing the button) until the car is repaired: the
  // renderer swaps in a fresh car while the panels still lie on the track; the next race start frees them.
  // How hard the car hits depends on the traffic around it (the random numbers drawn on the tracks before, the real-time
  // frames in between): when no panel came off, the car is put back on the road and sent into the barrier again (at most 3 more times)
  const crashAndRepair = async () => {
    await startTrack(page, 'gozd');
    return page.evaluate(async () => {
      const g = window.__game, P = g.race.player, raf = () => new Promise(r => requestAnimationFrame(r));
      for (let i = 0; i < 40 && g.race.time < 6; i++) g.sim(0.5, true);
      for (let k = 0; k < 4 && (k === 0 || !g.race.debris.length); k++) { if (k) { g.race.rescue(P); g.sim(4, true); } g.sim(2.5, false, -1); await raf(); await raf(); }
      let dmg = P.dmg, loose = g.race.debris.length;
      for (let i = 0; i < 180 && !P.repairN; i++) {
        if (P.stuckT > 3 || P.wrongT > 3) g.race.rescue(P);
        if (!P.inPit) P.pitWant = true; g.sim(1, true); if (i % 10 === 0) await raf();
        dmg = Math.max(dmg, P.repairN ? 0 : P.dmg); loose = Math.max(loose, g.race.debris.length);
      }
      P.pitWant = false; for (let i = 0; i < 3; i++) await raf();
      return { dmg: +dmg.toFixed(2), loose, repaired: P.repairN || 0, looseAtRepair: g.race.debris.length };
    });
  };
  // a registered vehicle (RAKETA: the render kit) and the Peugeot (its model) wrecked and repaired where they stand on Bakreni gozd, three
  // times over each: Core.wreckCar (the kit's parts' copies, its pieces thrown and drawn, the wheels off, the body sagged; the fire, the soot,
  // the cracked panes, the Peugeot's own copies of its model's materials), Race.repairCar (the car built afresh while its pieces lie on the
  // road); RAKETA's third wreck pushes the first one's pieces out (the cap of 40): freed with nothing a car still draws; the next race the rest
  const kitWreck = async (id) => {
    const S0 = await page.evaluate((id) => { const g = window.__game, s = g.S.car; g.S.car = Core.MODELS.findIndex(m => m.id === id); return s; }, id);
    await startTrack(page, 'gozd');
    const r = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
      g.sim(1, true); let pieces = 0, dead = 0, fire = 0, cracks = 0, sooted = 0;
      for (let k = 0; k < 3; k++) {
        Core.wreckCar(P); g.sim(0.5, true); for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
        const v = Render.viewOf(P); fire += v.fire ? 1 : 0; cracks += v.crack.filter(Boolean).length; sooted += v.charU && v.charU.value.w > 0 ? 1 : 0;
        pieces += g.race.debris.filter(d => d.car === P.id && d.mesh && d.mesh.isObject3D).length;
        g.race.repairCar(P); g.sim(0.25, true); for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      }
      dead = 3 * Object.keys(Core.partsOf(P.m)).length - g.race.debris.length; g.resume(); await raf();
      return { pieces, dead, fire, cracks, sooted, kit: !!Render.viewOf(P).kit };
    });
    await page.evaluate((s) => { window.__game.S.car = s; }, S0);
    return r;
  };
  // browse the car menu: through every car twice (each change builds a new showroom car); every car is drawn before the
  // next one, so each one really reaches the GPU (and the last one is always drawn when memory is measured)
  const carMenu = () => page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r));
    g.onAction('to-car'); await wait(300);
    for (let k = 0; k < 2 * Core.MODELS.length; k++) { g.onAction('car-next'); await raf(); await raf(); }   // (back at the same car: every round ends the same)
    g.onAction('to-title'); await wait(200);
  });
  const rounds = [];
  const ROUNDS = +(process.env.MEM_ROUNDS || 3);
  let crash = null, kit = null, glb = null;
  for (let r = 0; r < ROUNDS; r++) {
    for (const id of ids) { await startTrack(page, id); await simulate(page, 3); }
    crash = await crashAndRepair();
    kit = await kitWreck('raketa'); glb = await kitWreck('p206');
    await startTrack(page, 'gozd'); await simulate(page, 2);   // a restart on the same track
    await carMenu();
    await page.evaluate(async () => { window.__game.onAction('to-title'); await new Promise(r => setTimeout(r, 1500)); });   // the title demo race
    rounds.push(await measure());
    console.log(`round ${r + 1}: ${JSON.stringify(rounds[r], (k, v) => typeof v === 'number' ? +v.toFixed(1) : v)}  crash ${JSON.stringify(crash)}  kit wreck ${JSON.stringify(kit)}  Peugeot wreck ${JSON.stringify(glb)}`);
  }
  const w = rounds[Math.min(1, rounds.length - 1)], z = rounds[rounds.length - 1];
  T.check('the crash-and-repair part really ran (damage, loose panels still on the track at the pit repair)', crash && crash.dmg > 0 && crash.looseAtRepair > 0 && crash.repaired === 1, JSON.stringify(crash));
  T.check('the kit wreck-and-repair part really ran (RAKETA wrecked three times: its pieces drawn, the cap pushed the first ones out; burning, sooted, its panes cracked)', kit && kit.kit && kit.pieces >= 40 && kit.dead > 0 && kit.fire === 3 && kit.sooted === 3 && kit.cracks > 0, JSON.stringify(kit));
  T.check('the Peugeot\'s wreck-and-repair part really ran (wrecked three times: burning, sooted)', glb && !glb.kit && glb.fire === 3 && glb.sooted === 3, JSON.stringify(glb));
  T.check('GPU geometries do not grow after the warm-up round', z.geometries <= w.geometries + 2, `${w.geometries} -> ${z.geometries}`);
  T.check('textures do not grow', z.textures <= w.textures, `${w.textures} -> ${z.textures}`);
  T.check('shader programs do not grow', z.programs <= w.programs + 1, `${w.programs} -> ${z.programs}`);
  T.check('JavaScript memory does not grow (more than 15 MB)', z.heapMB <= w.heapMB + 15, `${w.heapMB.toFixed(1)} -> ${z.heapMB.toFixed(1)} MB`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
