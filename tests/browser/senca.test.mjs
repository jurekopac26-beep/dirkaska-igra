// The sun's shadow box (Grafika AAA H6, js/render-senca.js): three.js's shadow part of the shaders changed before any is compiled (getShadow
// a wrapper fading by the uniform uShEdge, one object for every material); on a track of ROB (Killar, Indija) the shadows fade out over the
// last 12 m inside the box's edges (the uniform set every frame from the box: its width over the box's), the picture changed only by that
// (the same draw calls, no shader built again); on a frozen track (Jezero) and on the title screen the uniform 0 (the picture as before).
//   node tests/browser/senca.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('shadow box: its soft edge (H6)');
const srv = await serve();
const browser = await launch();
const SET = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' };
const race = async (page, id, m) => {
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.evaluate(async (m) => {
    const g = window.__game, R = g.race, Tr = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    const i = Tr.idx((Tr.startS + m) % Tr.len); const off = Tr.rl ? Tr.rl[i] : 0; P.place(Tr.px[i] + Tr.nx[i] * off, Tr.pz[i] + Tr.nz[i] * off, Tr.hd[i]); if (Tr.hasElev) P.y = P.py = Tr.hy[i];
    P.q = Tr.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
    for (let k = 0; k < 60; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); }   // (settled on its wheels, as tools/shot.mjs)
    Render.resetCam(); for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
  }, m);
};
// a frame with H6 as asked (rob: null as the track says, 0 off): the uniform, the box, the draw calls, the programs and the picture's pixels
const frame = (page, rob) => page.evaluate((rob) => {
  const S = Render.ext.senca, P = window.__game.race.player, I = Render.info();
  S.debug.rob = rob; Render.frame(0, 1, P, 'chase', {});
  I.autoReset = false; I.reset(); Render.frame(0, 1, P, 'chase', {}); const calls = I.render.calls; I.autoReset = true;
  const src = document.querySelector('canvas'), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0); const px = Array.from(x.getImageData(0, 0, c.width, c.height).data);
  S.debug.rob = null;
  return { u: [S.uniform.value.x, S.uniform.value.y], calls, progs: I.programs.length, px };
}, rob);
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) n++; return +(n / (a.length / 4) * 100).toFixed(3); };
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', SET, { width: 844, height: 390 }, { seed: 11 });
  // 1. the shader part changed once, before any program; the title screen's uniform 0
  const t0 = await page.evaluate(() => ({ ext: !!(Render.ext && Render.ext.senca), chunk: THREE.ShaderChunk.shadowmap_pars_fragment.includes('getShadowH6') && THREE.ShaderChunk.shadowmap_pars_fragment.includes('uniform vec2 uShEdge'), u: Render.ext.senca ? Render.ext.senca.uniform.value.toArray() : null }));
  T.check('js/render-senca.js loaded: getShadow wrapped (uShEdge), the uniform 0 on the title screen', t0.ext && t0.chunk && t0.u && t0.u[0] === 0 && t0.u[1] === 0, JSON.stringify(t0));

  // 2. Killar (Indija) at 1780 m, NIZKA: the fade's width 12 m over the box's; the picture changed by it, the same draw calls and programs
  await race(page, 'killar', 1780);
  const on = await frame(page, null), off = await frame(page, 0), on2 = await frame(page, null);
  const w = await page.evaluate(() => { const sc = Render.ext.senca; return sc.ROB_M; });
  T.check('Killar: the fade on (uShEdge = 12 m over the box\'s width and height, at most 0.5)', on.u[0] > 0 && on.u[1] > 0 && on.u[0] <= 0.5 && on.u[1] <= 0.5 && w === 12, JSON.stringify(on.u));
  const d = diff(on.px, off.px), same = diff(on.px, on2.px);
  T.check('Killar: the picture with the fade differs from the one without it (a little: the shadows at the box\'s edge), the same again with it', d > 0.01 && d < 25 && same === 0, JSON.stringify({ d, same }));
  T.check('Killar: no draw call and no shader program more for it', on.calls === off.calls && on.progs === off.progs && on2.progs === on.progs, JSON.stringify([on.calls, off.calls, on.progs, off.progs, on2.progs]));

  // 3. Jezero (frozen): the uniform 0, the picture the same as with H6 off
  await race(page, 'jezero', 600);
  const j = await frame(page, null), j0 = await frame(page, 0);
  T.check('Jezero (frozen): the uniform 0, the picture as with H6 off', j.u[0] === 0 && j.u[1] === 0 && diff(j.px, j0.px) === 0, JSON.stringify(j.u));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
