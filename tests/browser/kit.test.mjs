// The KIT's middle axle (look.wheels.mid, js/render.js: a 6x6's, drawn only): the TITAN given one at x -0.8 (its def changed as it is
// pushed), Bathurst's quick entry, the race then stepped here (paused):
//  - built: two wheels more (v.wm), the rear ones' twins (their geometry, material and shadow; the left one mirrored) at (mid, rw, +-hw);
//    Render.kitInfo's wheels.mid
//  - driving: they spin with the rear ones every frame, never steer (the front ones turned meanwhile)
//  - in a slide (the handbrake's, as drawn): they lay their marks as the rear ones; Render.skidCount about twice the rear wheels' alone (a
//    stretch with v.wm emptied between two with it)
//  - a rear wheel off (c.wreck.wl): that one hidden and its hub shown, the middle ones in place; the body sagging onto them by their arch's
//    clearance (wheels.gap) at most
//  - a bad mid (too near an axle, not a number): the build fails (Render.kitTry) with its message; no errors on the page
//   node tests/browser/kit.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('kit');
const MID = -0.8;   // (the TITAN: a 1.65, b 2.05, rw 0.55: 1.2 m clear of each axle: -0.85 .. 0.45)
// (js/cars/*.js push their defs onto VEHICLE_DEFS: made here first, the TITAN's look given wheels.mid as it comes)
const INIT = `(() => { const D = window.VEHICLE_DEFS = window.VEHICLE_DEFS || [], push = D.push;
  D.push = function (...a) { for (const d of a) if (d && d.id === 'titan' && d.look) d.look.wheels = Object.assign({}, d.look.wheels, { mid: ${MID} }); return push.apply(this, a); }; })();`;
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&avto=titan&tekmeci=0&t=6&vreme=suho', {}, { width: 480, height: 270 }, { init: INIT, seed: 5 });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  const A = await page.evaluate(() => {
    const P = window.__game.race.player, v = Render.viewOf(P), I = Render.kitInfo('titan'), r = v.wr[0];
    const at = (w) => [w.position.x, w.position.y, w.position.z, w.scale.z].map(n => +n.toFixed(3));
    return { id: P.m.id, status: I.status, mid: I.wheels.mid, hw: I.wheels.hw, rw: P.m.rw, wm: v.wm.map(at), wr: v.wr.map(at), n: [v.wf.length, v.wr.length],
      twins: v.wm.every(w => w.geometry === r.geometry && w.material === r.material && w.castShadow === r.castShadow && w.parent === r.parent && w.visible) };
  });
  const near = (a, b) => Math.abs(a - b) < 2e-3;
  T.check('the TITAN with wheels.mid built: Render.kitInfo\'s wheels.mid, the four wheels as they were', A.id === 'titan' && A.status === 'ok' && near(A.mid, MID) && A.n[0] === 2 && A.n[1] === 2, JSON.stringify({ id: A.id, status: A.status, mid: A.mid, n: A.n }));
  T.check('two wheels more (v.wm) at (mid, rw, +-hw), the left one mirrored: the rear ones\' twins (geometry, material, shadow)',
    A.wm.length === 2 && A.twins && A.wm.every((p, i) => near(p[0], MID) && near(p[1], A.rw) && near(p[2], (i ? 1 : -1) * A.hw) && p[3] === (i ? 1 : -1)) && A.wr.every(p => near(p[0], -2.05)),
    JSON.stringify({ wm: A.wm, wr: A.wr, hw: A.hw, twins: A.twins }));
  // driving: a little steering (the front wheels turned), then the autopilot; each frame drawn
  const B = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, v = Render.viewOf(P);
    let same = true, straight = true, moved = 0, turned = 0, z0 = v.wm[0].rotation.z;
    Render.scene.visible = false;
    for (let f = 0; f < 50; f++) {
      if (f < 12) g.sim(1 / 60, false, 0.3, 1, 0); else g.sim(1 / 60, true);
      Render.frame(1 / 60, 1, P, 'chase', {});
      const zr = v.wr[0].rotation.z;
      for (const w of v.wm) { if (Math.abs(w.rotation.z - zr) > 1e-9) same = false; if (w.rotation.x !== 0 || w.rotation.y !== 0) straight = false; }
      if (Math.abs(v.wf[0].rotation.y) > 0.005) turned++;
      if (Math.abs(v.wm[0].rotation.z - z0) > 1e-4) moved++; z0 = v.wm[0].rotation.z;
    }
    Render.scene.visible = true;
    return { same, straight, moved, turned, kmh: Math.round(P.speed * 3.6) };
  });
  T.check('driving: the middle wheels spin with the rear ones every frame, never steer (the front ones turned)', B.same && B.straight && B.moved >= 48 && B.turned >= 6, JSON.stringify(B));
  // the handbrake's slide (c.inHand, as the frame draws it: the physics drives on): three stretches, the middle one with v.wm emptied
  const S = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, v = Render.viewOf(P), keep = v.wm;
    const run = (on, n) => {
      if (!on) v.wm = [];
      const prev = v.sk.slice(), cnt = [0, 0, 0, 0, 0, 0]; let c0 = Render.skidCount, laid = 0;
      for (let f = 0; f < n; f++) {
        g.sim(1 / 60, true); P.inHand = 1; Render.frame(1 / 60, 1, P, 'chase', {});
        const c = Render.skidCount; laid += (c - c0 + 8000) % 8000; c0 = c;
        for (let k = 0; k < 6; k++) { if (v.sk[k] && v.sk[k] !== prev[k]) cnt[k]++; prev[k] = v.sk[k]; }
      }
      v.wm = keep; return { laid, cnt, kmh: Math.round(P.speed * 3.6) };
    };
    Render.scene.visible = false;
    const out = [run(true, 40), run(false, 40), run(true, 40)];
    Render.scene.visible = true;
    return out;
  });
  const c = S[0].cnt, per = S.map(s => +(s.laid / Math.max(1, s.cnt[0] + s.cnt[1])).toFixed(2));   // (the marks laid per rear wheels' segment: the speed aside)
  T.check('a slide: the middle wheels lay their marks as the rear ones', c[0] > 15 && c[1] > 15 && c[4] >= 0.85 * c[0] && c[5] >= 0.85 * c[1], JSON.stringify(S[0]));
  T.check('Render.skidCount: with the middle wheels about twice the marks of the rear ones alone', S[1].laid > 15 && per[0] >= 1.8 && per[2] >= 1.8 && per[1] <= 1.2,
    JSON.stringify(S.map((s, i) => ({ laid: s.laid, rear: s.cnt[0] + s.cnt[1], per: per[i], kmh: s.kmh }))));
  // a rear wheel off (the rear left: c.wreck.wl bit 2)
  const C = await page.evaluate(() => {
    const P = window.__game.race.player, v = Render.viewOf(P), E = v.kit.E, W = P.wreck; if (!W) return null;
    const pos0 = JSON.stringify(v.wm.map(w => w.position.toArray()));
    W.wl |= 4; Render.frame(1 / 60, 1, P, 'chase', {});
    const rl = v.wr.find(w => w.position.z < 0); let drop = null;
    if (v.sagQ) { const n = new THREE.Vector3(0, 1, 0).applyQuaternion(v.sagQ), s1 = -n.x / n.y, s2 = -n.z / n.y, s0 = v.sagP.y;   // (the sag's plane y = s0 + s1 x + s2 z)
      drop = [-1, 1].map(sd => +(s0 + s1 * E.W.xm + s2 * sd * E.body.hw).toFixed(4)); }
    return { off: v.wheelOff.slice(), rl: rl.visible, hub: !!(v.hubs[2] && v.hubs[2].visible), wm: v.wm.map(w => w.visible), kept: JSON.stringify(v.wm.map(w => w.position.toArray())) === pos0, drop, gap: E.W.gap };
  });
  T.check('a rear wheel off: hidden, its hub shown, the middle ones on and in place', C && C.off.join() === '0,0,1,0' && !C.rl && C.hub && C.wm.every(Boolean) && C.kept, JSON.stringify(C));
  T.check('the body sags onto the middle wheels by their arch\'s clearance (wheels.gap) at most', C && C.drop && Math.min(...C.drop) >= -C.gap - 1e-3 && Math.min(...C.drop) < 0, JSON.stringify(C && { drop: C.drop, gap: C.gap }));
  // a bad mid: the build fails with its message (the look as it is, wheels.mid changed)
  const D = await page.evaluate(() => {
    const L = Core.MODELS.find(m => m.id === 'titan').def.look;
    return [0.5, -0.9, '-0.8'].map(mid => { const r = Render.kitTry('titan', Object.assign({}, L, { wheels: Object.assign({}, L.wheels, { mid }) })); if (r.geo) r.geo.dispose(); return r.status; });
  });
  T.check('a bad wheels.mid (too near an axle, not a number) fails the build with its message', D.every(s => /^fallback:wheels\.mid .*rear axle \(-2\.05\).*front one \(1\.65\), 2 rw \+ 0\.1 m \(1\.20 m\)/.test(s)), JSON.stringify(D.map(s => s.slice(0, 160))));
  T.check('no errors on the page', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
