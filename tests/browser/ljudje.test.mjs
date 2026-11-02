// People by the track (js/world-ljudje.js, World.people): on real tracks the scenes stand beyond the barrier, each a group of 2-10 (the friends
// in the grandstand more), their things merged into one lit and one unlit mesh, their people into one mesh; as the followed car comes, the
// runners leave what they do and are at the fence when it passes, the staff stay where they work, and all are back at what they did some seconds
// after it; with no car (the world test) every scene in one fixed pose; a test track has none. The roadside crowd in small groups, far fewer than
// before (Nürburg hardly any); a test track's crowd as it was.
//   node tests/browser/ljudje.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const TRACKS = ['nring', 'spa', 'bathurst', 'ouninpohja', 'vrsic', 'rbring'];
const CROWD_MAX = { nring: 600, spa: 1500, bathurst: 1500, ouninpohja: 1500, vrsic: 1500, rbring: 2500 };   // (before: 11.706, 5.617, 4.198, 6.902, …)
const T = checker('people by the track');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
  for (const id of TRACKS.concat(['jezero'])) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate(() => {
      const g = window.__game; g.pause();
      const W = Render.world, st = W.peopleStats, PW = W.peopleW, A = World.api, grp = W.root.getObjectByName('people');
      const out = { crowd: W.crowdN || 0, stats: st ? { scenes: st.scenes.length, people: st.people, verts: st.verts, propVerts: st.propVerts } : null, meshes: 0 };
      if (!st) { if (grp) grp.traverse(m => { if (m.isMesh) out.meshes++; }); return out; }
      // every scene: its meshes (the things, the lamps, the people: at most three) and its people's places in the first pose (beyond the barrier)
      World.update(W, 0, null);
      out.scenes = PW.scenes.map(Sc => { let n = 0; Sc.grp.traverse(m => { if (m.isMesh) n++; });
        let near = 0; for (const p of Sc.people) { const v = p.P.root.position; if (A.clearance(v.x, v.z) < 0.2) near++; }
        return { name: Sc.name, people: Sc.people.length, stand: Sc.stand, meshes: n, near, verts: Sc.pos.length / 3 }; });
      // the fixed pose: twice the same
      const hash = () => { let h = 2166136261; for (const Sc of PW.scenes) { const u = new Uint32Array(Sc.pos.buffer); for (let i = 0; i < u.length; i += 7) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0; } } return h; };
      const h1 = hash(); World.update(W, 0, null); out.fixed = h1 === hash();
      return out;
    });
    if (id === 'jezero') { T.check('a test track (Jezero Ring) has no people\'s scenes', !r.stats && !r.meshes, JSON.stringify(r)); continue; }
    T.check(`${id}: scenes with people`, !!r.stats && r.stats.scenes >= 1 && r.stats.people >= 4, JSON.stringify(r.stats));
    if (!r.stats) continue;
    const groups = r.scenes.filter(s => !s.stand), bad = groups.filter(s => s.people < 2 || s.people > 10);
    T.check(`${id}: each scene a group of 2-10 (the grandstand more), at most three meshes, nobody on the road`, !bad.length && r.scenes.every(s => s.meshes <= 3 && s.near === 0),
      r.scenes.map(s => `${s.name} ${s.people}p ${s.meshes}m near ${s.near}`).join(', '));
    T.check(`${id}: a scene's people under 7.5k vertices (the grandstand under 30k), its things under 16k`, r.scenes.every(s => s.verts < (s.stand ? 30000 : 7500)) && r.stats.propVerts < 16000 * r.stats.scenes,
      r.scenes.map(s => `${s.name} ${Math.round(s.verts / 100) / 10}k`).join(', ') + ` · things ${Math.round(r.stats.propVerts / 1000)}k`);
    T.check(`${id}: the world test's pose is fixed (no car: the same twice)`, r.fixed === true, String(r.fixed));
    T.check(`${id}: the roadside crowd in small groups, far fewer than before`, r.crowd > 0 && r.crowd <= CROWD_MAX[id] || (id === 'nring' && r.crowd <= CROWD_MAX[id]), `${r.crowd} spectators (at most ${CROWD_MAX[id]})`);
    if (id !== 'nring' && id !== 'bathurst') continue;
    // the car comes: a scene with runners (Nürburg: the barbecue; Bathurst: the grandstand's wave and the pit wall)
    const run = await page.evaluate(async (name) => {
      const g = window.__game, R = g.race, Tr = R.track, P = R.player, PW = Render.world.peopleW, Sc = PW.scenes.find(x => x.name === name);
      const place = (s) => { const i = Tr.idx(((s % Tr.len) + Tr.len) % Tr.len), off = Tr.rl ? Tr.rl[i] : 0; P.place(Tr.px[i] + Tr.nx[i] * off, Tr.pz[i] + Tr.nz[i] * off, Tr.hd[i]); if (Tr.hasElev) P.y = P.py = P.roadY = Tr.hy[i]; P.vx = P.vz = 0; P.q = Tr.query(P.x, P.z, i, P.q); };
      const F = Sc.F, bOf = (v) => (v.x - F.px) * F.nx + (v.z - F.pz) * F.nz - F.bar;
      const look = () => Sc.people.map(p => { const v = p.P.root.position; return { b: bOf(v), x: v.x, z: v.z, runs: !!(p.st && p.st.run && p.st.fence && !p.st.fence.on && p.st.run.a == null), stays: !!(p.st && p.st.run === false), up: p.up || 0 }; });
      Sc.arm = true; Sc.al = Sc.pass = Sc.back = -1; for (const p of Sc.people.concat(Sc.pets)) { p.segs = null; p.up = 0; p.sig = null; }
      let s = Sc.s0 - 260, dt = 1 / 30, v = 28; place(s); Render.resetCam(); for (let k = 0; k < 10; k++) Render.frame(dt, 1, P, 'chase', {});
      const at = {}; let t = 0;
      while (s < Sc.s0 + 160) { s += v * dt; t += dt; place(s); Render.frame(dt, 1, P, 'chase', {}); const da = Sc.s0 - s;
        if (!at.before && da < 130) at.before = look(); if (!at.pass && da < 0) at.pass = look(); }
      for (let k = 0; k < 330; k++) Render.frame(dt, 1, P, 'chase', {});   // (11 s more: back at what they did)
      place(Sc.s0 - 40); for (let k = 0; k < 3; k++) Render.frame(dt, 1, P, 'chase', {});   // (the camera back by the scene: its people are posed only while it is seen; the car's jump back is no coming)
      at.after = look(); at.al = Sc.al;
      return at;
    }, id === 'nring' ? 'zar' : 'tribuna');
    if (id === 'nring') {
      const runners = run.pass.map((p, k) => [run.before[k], p, run.after[k]]).filter(([a]) => a.runs);
      T.check('nring: before the car comes they are at what they do (away from the fence)', runners.length >= 3 && runners.every(([a]) => a.b > 2.0), runners.map(([a]) => a.b.toFixed(1)).join(' '));
      T.check('nring: as the car passes the runners are at the fence', runners.every(([, b]) => b.b < 1.8), runners.map(([, b]) => b.b.toFixed(1)).join(' '));
      T.check('nring: some seconds after it they are back at what they did', runners.every(([a, , c]) => Math.hypot(a.x - c.x, a.z - c.z) < 0.8) && run.al < 0, runners.map(([a, , c]) => Math.hypot(a.x - c.x, a.z - c.z).toFixed(2)).join(' '));
    } else {
      const upPass = run.pass.filter(p => p.up > 0.5).length, upBefore = run.before.filter(p => p.up > 0.5).length, upAfter = run.after.filter(p => p.up > 0.5).length;
      T.check('bathurst: the grandstand\'s wave: the ones by the car up as it passes, all sitting before and after', upPass >= 4 && upBefore === 0 && upAfter === 0, `before ${upBefore}, passing ${upPass}, after ${upAfter} of ${run.pass.length}`);
    }
  }
  T.check('no page errors', !errors.length, errors.slice(0, 4).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
