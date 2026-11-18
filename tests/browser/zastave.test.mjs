// The flags that wave (js/world-zastave.js; Grafika 02, the user's choice of 3. 11. 2026: »Zastave, ki plapolajo v vetru«). On the real
// tracks a world's cloths are one mesh, waved in the vertex shader by the world's wind (out.dyn.wind, World.update: t % 1000): Spa's flags by
// the grandstands and on the straight, a few thousand vertices in one draw call, casting no shadow; a flag's picture changes with the wind's
// time (the rest of the world hidden; the same time twice the same picture); Irohazaka's finish flags a mesh of their own in the finish's group
// (out.dyn.vrFin: hidden with it); (Newcastle, now a test track, stays as it was); the
// Red Bull Ring's builder's own mesh (rbFlags) with the marshals' flags in it; on NIZKA only the cloths within 70 m of the camera wave
// (uFar); no errors (the program compiles).
//   node tests/browser/zastave.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('flags that wave');
const srv = await serve();
const browser = await launch();
// the flags meshes of the world on screen: their group, how many cloths, vertices, the clock (the world's wind?), the reach (NIZKA), texture, shadow
const meshes = (page) => page.evaluate(() => {
  const W = Render.world, r = [];
  W.root.traverse(o => { if (o.isMesh && o.name === 'flags') { const f = o.material.userData.flag || {};
    r.push({ in: o.parent === W.root ? 'root' : o.parent.name, n: o.userData.flags, verts: o.geometry.attributes.position.count, wind: !!f.uTime && f.uTime === W.dyn.wind, far: f.uFar ? f.uFar.value : -1, map: !!o.material.map, cast: o.castShadow }); } });
  return { M: r, stats: W.stats ? W.stats.flags : null };
});
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(page, 'spa');
  let { M } = await meshes(page);
  T.check('Spa: the cloths one mesh in the world, waved by its wind, casting no shadow', M.length === 1 && M[0].in === 'root' && M[0].wind && M[0].far === 0 && !M[0].cast, JSON.stringify(M));
  T.check('Spa: its flags in it (the poles by the grandstands, the straight), a few thousand vertices', M.length === 1 && M[0].n >= 40 && M[0].verts < 4000, JSON.stringify(M));
  // one flag from 6 m, its picture at two times of the wind: with the cloth shown and without it (what else the wind's time moves: none of
  // it should be on screen, the rest of the world hidden), the same time twice
  const pic = await page.evaluate(() => {
    const W = Render.world; let m = null; W.root.traverse(o => { if (o.name === 'flags') m = o; });
    const P = m.geometry.attributes.position.array, N = m.geometry.attributes.normal.array, F = m.geometry.attributes.aFlag.array;
    const x = P[0], y = P[1], z = P[2], nx = N[0], nz = N[2], dx = nz, dz = -nx, L = F[3];   // (the first cloth: its top at the pole, the way it flies, its length)
    Render.setShot({ px: x + nx * 6 + dx * L * 0.5, py: y - 0.5, pz: z + nz * 6 + dz * L * 0.5, tx: x + dx * L * 0.5, ty: y - 0.5, tz: z + dz * L * 0.5, fov: 30, near: 0.3 });
    const hidden = []; W.root.children.forEach(c => { if (c !== m && c.visible) { c.visible = false; hidden.push(c); } });
    const up = World.update; let t0 = 0; World.update = (w, t, ...a) => up(w, t0, ...a);
    const shot = (t) => { t0 = t; const c = Render.snapshot(window.__game.race.cars[0], 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 24) n++; return n; };
    try {
      shot(100); shot(100);   // (first, the view settled: the shadows of the new place drawn)
      const a = shot(100), b = shot(100), c = shot(100.35);
      m.visible = false; const a0 = shot(100), c0 = shot(100.35); m.visible = true;
      return { px: a.length / 4, same: diff(a, b), moved: diff(a, c), without: diff(a0, c0), cloth: diff(a, a0) };
    } finally { World.update = up; hidden.forEach(c => { c.visible = true; }); Render.setShot(null); }
  });
  T.check('Spa: the cloth on screen, and it moves with the wind (its picture at two times differs; the same time twice the same picture)',
    pic.cloth > pic.px * 0.02 && pic.same <= pic.px * 0.001 && pic.moved - pic.without > pic.px * 0.003, JSON.stringify(pic));

  await startTrack(page, 'iroha');   // (Vršič, a test track, stays as it was: frozen)
  ({ M } = await meshes(page));
  const fin = M.find(q => q.in === 'vrFin'), st = M.find(q => q.in === 'root');
  T.check('Irohazaka: the nobori in the world\'s mesh, the finish\'s chequered ones a mesh of their own in the finish\'s group (hidden with it)',
    M.length === 2 && st && st.n >= 6 && fin && fin.n >= 10 && fin.wind, JSON.stringify(M));

  await startTrack(page, 'rbring');
  let stats; ({ M, stats } = await meshes(page));
  T.check('Štajerska: one mesh, the builder\'s own (its crowd\'s clock), the marshals\' flags in it too', M.length === 1 && stats > 0 && M[0].n > stats && !M[0].wind, JSON.stringify({ M, stats }));
  T.check('no errors (the flags\' program compiles)', errors.length === 0, errors.slice(0, 3).join(' | '));

  const low = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(low.page, 'spa');
  ({ M } = await meshes(low.page));
  T.check('NIZKA: only the cloths within 70 m of the camera wave (Spa)', M.length === 1 && M[0].far === 70 && M[0].wind, JSON.stringify(M));
  T.check('NIZKA: no errors', low.errors.length === 0, low.errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); srv.close();
}
T.done();
