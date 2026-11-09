// The TITAN CISTERNA in the browser (docs/titan-cisterna.md, sklopa 4 and 5): the chase camera keeps the whole rig on the screen (the
// tractor and its trailer's box, on its side 640x360 and upright 360x640, Srednje and Blizu with the car 20 m lower, slow after the start
// and at speed); the race's replay holds the trailer's angle (the recording 8 numbers a car, its file too, the replay's trailer at the
// race's angle, Nazaj na dirko puts it back as it was); the ghost of a time trial keeps it (ch 8) and drives its trailer; the menu's yard
// draws the rig inside the car's button. On a real track (Bathurst).
//   node tests/browser/cisterna.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('TITAN CISTERNA: the chase camera, the replay, the ghost, the menu');
const srv = await serve(), browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
const deg = (a) => (a * 180 / Math.PI).toFixed(1), t0 = Date.now(), took = (what) => console.log(`  (${what}: ${((Date.now() - t0) / 1000).toFixed(0)} s from the test's start)`);
try {
  // 1. the chase camera: every corner of the trailer's body and of the tractor's box inside the screen (NDC within +-1, before the far plane)
  {
    const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=dirka&avto=cisterna&t=2', { quality: 'high' }, { width: 640, height: 360 });
    await ready(page);
    const frame = (zoom, back) => page.evaluate(([zoom, back]) => {
      const g = window.__game, P = g.race.player, v = Render.viewOf(P), C = Render.cam, cam = Render.camera, z0 = C.userZoom, b0 = C.userBack;
      C.userZoom = zoom; C.userBack = back;
      for (let i = 0; i < 12; i++) Render.frame(0.25, 1, P, 'chase', { noFx: true });   // (3 s: the camera settled behind the rig standing where it is)
      const V = new THREE.Vector3(), pts = [], M = P.m, b = v.tlB.geometry.boundingBox || (v.tlB.geometry.computeBoundingBox(), v.tlB.geometry.boundingBox);
      const corners = (o, b) => { for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { V.set(x, y, z); o.localToWorld(V); V.project(cam); pts.push([V.x, V.y, V.z]); } };
      v.grp.updateMatrixWorld(true); v.tlG.updateMatrixWorld(true);
      corners(v.tlB, b); corners(v.grp, { min: { x: -M.len / 2, y: 0, z: -M.wid / 2 }, max: { x: M.len / 2, y: 3, z: M.wid / 2 } });
      C.userZoom = z0; C.userBack = b0;
      const r3 = (x) => +x.toFixed(3);
      return { aspect: r3(cam.aspect), x: r3(Math.max(...pts.map(p => Math.abs(p[0])))), y0: r3(Math.min(...pts.map(p => p[1]))), y1: r3(Math.max(...pts.map(p => p[1]))), z: r3(Math.max(...pts.map(p => p[2]))),
        tail: r3(Math.min(...pts.slice(0, 8).map(p => p[1]))), v: Math.round(P.speed * 3.6), rel: P.tl.rel, back: r3(P.tl.back), vis: v.tlG.visible && v.tlB.visible };
    }, [zoom, back]);
    const look = async (when) => {
      for (const [w, h] of [[640, 360], [360, 640]]) {
        await page.setViewportSize({ width: w, height: h }); for (let i = 0; i < 4; i++) await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
        for (const [zoom, back, name] of [[1.4, 0, 'Srednje'], [1.1, 20, 'Blizu, the car 20 m lower']]) {
          const r = await frame(zoom, back);
          T.check(`${when}, ${w}x${h}, ${name}: the whole rig on the screen (${r.v} km/h, fold ${deg(r.rel)} deg; the trailer's tail at ${r.tail} of the screen's height)`,
            r.vis && (w > h) === (r.aspect > 1) && r.x <= 1 && r.y0 >= -1 && r.y1 <= 1 && r.z < 1, JSON.stringify(r));
        }
      }
      await page.setViewportSize({ width: 640, height: 360 });
    };
    took('Bathurst loaded'); await look('2 s after the start');
    await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('pause'); g.sim(18, true); });
    await look('20 s after the start');

    // 2. the replay: 8 numbers a car (the 8th the trailer's angle), in the file too; the replay poses the trailer at the race's angle;
    // Nazaj na dirko: the trailer as it was
    const r = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, log = [];
      g.resume(); g.onAction('pause');
      for (let i = 0; i < 8 * 120; i++) { g.sim(1 / 120, true); log.push([g.race.time, P.tl.rel]); }
      const w = await Napake.rrp.pisi(), { H, frames } = await Napake.rrp.beri(w.blob), pl = H.cars.findIndex(c => c.pl);
      const at = new Map(log.map(([t, a]) => [Math.fround(t), a])); let same = 0, off = 0, rigs = 0;
      for (const f of frames) { const a = at.get(f[0]); if (a == null) continue; if (Math.abs(f[1 + pl * H.w + 7] - a) < 1e-6) same++; else off++; }
      const last = frames[frames.length - 1]; for (let i = 0; i < H.n; i++) if (Number.isFinite(last[1 + i * H.w + 7])) rigs++;
      const KEYS = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w', 'rel', 'yA', 'fall', 'torn'], keepOf = () => [g.race.time, ...KEYS.map(k => P.tl[k])], keep = keepOf();
      g.onAction('rp-here'); await new Promise(r => setTimeout(r, 300));
      const cmp = [];
      for (const [t, a] of log.slice(-720).filter((_, i) => i % 120 === 60)) { Napake.rrp.pojdi(t, g.replay.k, 'chase'); await new Promise(r => requestAnimationFrame(r)); cmp.push([+t.toFixed(2), +a.toFixed(4), +g.race.player.tl.rel.toFixed(4)]); }
      g.onAction('rp-race'); await new Promise(r => setTimeout(r, 300));
      const now = keepOf(), back = ['time', ...KEYS].filter((k, i) => !Object.is(now[i], keep[i]));
      return { w: H.w, n: H.n, same, off, rigs, cmp, back, max: Math.max(...log.map(e => Math.abs(e[1]))) };
    });
    T.check(`the recording: 8 numbers a car, in its file too (${r.n} cars, the trailers' angles finite); the player's trailer angle in the file as in the race at every sample (${r.same})`,
      r.w === 8 && r.rigs === r.n && r.same > 100 && !r.off, JSON.stringify({ w: r.w, n: r.n, rigs: r.rigs, same: r.same, off: r.off }));
    const worst = Math.max(...r.cmp.map(e => Math.abs(e[1] - e[2])));
    T.check(`the replay: the trailer at the race's angle (6 times, up to ${deg(r.max)} deg in the race; off by ${deg(worst)} deg at most); Nazaj na dirko: the race's time and its trailer as they were (where, its speeds, its angle, its axles' height)`,
      r.cmp.length === 6 && worst < 0.02 && !r.back.length, JSON.stringify({ cmp: r.cmp, changed: r.back }));
    T.check('no errors in the race and its replay', errors.length === 0, errors.slice(0, 3).join(' | '));
    await page.close(); took('the race and its replay');
  }

  // 3. the ghost: a time trial of Bathurst (its laps driven by the autopilot), its best lap stored with the trailer's angle (ch 8); again:
  // the ghost's trailer drawn on its kingpin at its angle
  {
    const init = () => { window.addEventListener('load', () => { const o = Render.setGhost; Render.setGhost = (g, d) => { if (g) window.__lastG = { tl: g.tl, h: g.h, x: g.x, z: g.z }; return o(g, d); }; }); };
    const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=kronometer&avto=cisterna&t=3', { quality: 'high', ghost: 1 }, { width: 640, height: 360 }, { init });
    await ready(page); took('the time trial loaded');
    const a = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player; g.resume(); g.onAction('pause');
      for (let i = 0; i < 600 && !P.finished; i++) { g.sim(1, true); if (P.stuckT > 3) g.race.rescue(P); }
      await new Promise(r => setTimeout(r, 1500));
      const k = Object.keys(localStorage).find(k => k.startsWith('tdgp-ghost-')), o = k ? JSON.parse(localStorage.getItem(k)) : null;
      return { fin: !!P.finished, ch: o && o.ch, n: o && o.n };
    });
    took('the run'); T.check('the ghost: the run of the time trial stored with the trailer\'s angle (8 numbers a sample)', a.fin && a.ch === 8 && a.n > 100, JSON.stringify(a));
    const b = await page.evaluate(async () => {
      const g = window.__game; g.onAction('restart'); await new Promise(r => setTimeout(r, 1500));
      for (let k = 0; k < 600 && !(g.race && g.race.state === 'racing'); k++) g.sim(0.1, false, 0, 0, 1);
      const P = g.race.player; for (let k = 0; k < 400 && P.lap < 2; k++) { g.sim(1, true); if (P.stuckT > 3) g.race.rescue(P); }   // (the flying lap: the ghost drives its best one)
      g.sim(8, true); for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); g.onAction('pause');
      const v = Render.viewOf(g.race.player), geo = v.tlB.geometry, G = window.__lastG, D = g.race.player.m.trailer, hits = [];
      const own = new Set(g.race.cars.map(c => { const w = Render.viewOf(c); return w && w.tlB; }));   // (the session's own rigs: the player's and the field's)
      Render.scene.traverse(o => { if (o.isMesh && o.geometry === geo && !own.has(o)) { const p = o.getWorldPosition(new THREE.Vector3()); hits.push({ vis: o.parent.visible, x: p.x, z: p.z, ry: o.parent.rotation.y }); } });
      const kx = G.x + Math.cos(G.h) * D.kp[0], kz = G.z + Math.sin(G.h) * D.kp[0], h = hits[0], ry = -(G.h + G.tl);
      return { hits: hits.length, vis: h && h.vis, d: h ? +Math.hypot(h.x - kx, h.z - kz).toFixed(3) : null, da: h ? +Math.abs(Math.atan2(Math.sin(h.ry - ry), Math.cos(h.ry - ry))).toFixed(4) : null, tl: +G.tl.toFixed(3) };
    });
    T.check(`the ghost again: its trailer drawn (one, besides the session's own rigs), on its kingpin (${b.d} m from it on the ground; the tractor's pitch on the slope moves the kingpin by up to its height's share) at its angle (${b.tl} rad, off by ${b.da})`, b.hits === 1 && b.vis && b.d < 0.15 && b.da < 0.01, JSON.stringify(b));
    T.check('no errors in the time trial and its ghost', errors.length === 0, errors.slice(0, 3).join(' | '));
    await page.close(); took('the ghost');
  }

  // 4. the menu's yard (js/menu-car.js): the rig drawn inside the car's button, on its side and upright, a few draws, light
  for (const [w, h] of [[844, 390], [390, 844]]) {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0, track: 'bathurst', lastTrack: 'bathurst' }, { width: w, height: h }, { menu: true });
    await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
    await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'cisterna'); });
    await page.click('[data-act="single"]'); await page.click('[data-act="mode:race"]');
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().drawn && MenuCar.info().car === 'cisterna', null, { timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => { const root = document.getElementById('menu-host').shadowRoot, y = root.querySelector('.yard'), b = y.querySelector('.car'), i = MenuCar.info();
      const yr = y.getBoundingClientRect(), br = b.getBoundingClientRect();
      return { i, nb: [(br.left - yr.left) / yr.width * 2 - 1, 1 - (br.bottom - yr.top) / yr.height * 2, (br.right - yr.left) / yr.width * 2 - 1, 1 - (br.top - yr.top) / yr.height * 2] }; });
    const i = r.i, inBtn = i.box && i.box[0] >= r.nb[0] - 0.02 && i.box[1] >= r.nb[1] - 0.02 && i.box[2] <= r.nb[2] + 0.02 && i.box[3] <= r.nb[3] + 0.02;
    T.check(`the menu's yard ${w}x${h}: the rig (${i.rig} m) drawn inside the car's button, ${i.calls} draws, ${i.tris} triangles`,
      i.drawn && i.car === 'cisterna' && i.rig > 15 && inBtn && i.calls <= 40 && i.tris <= 60000 && errors.length === 0, JSON.stringify({ box: i.box, nb: r.nb.map(v => +v.toFixed(3)), errors: errors.slice(0, 2) }));
    await page.close();
  }
} catch (e) {
  T.check('the test ran to its end', false, e && e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
