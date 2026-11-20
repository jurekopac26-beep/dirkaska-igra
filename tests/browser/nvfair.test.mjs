// NEW VERSION · TEST 1 (js/nvfair.js, js/nvpark.js, js/nvride.js): the lunapark's rides the car rides (the user's choice 5. 11. 2026).
// The big wheel: the car stopped on the plate west of it (its yellow frame) goes up on the plate to the basket at the bottom, glides in along
// the axle, the wheel turns once (the car up near its top and down again, the camera behind it), the car glides back onto the plate and the
// plate takes it down; then it drives off. The big carousel: the car stopped in the frame east of it glides onto the deck (nose to the middle),
// goes round once (the roof see-through over it), glides back into the frame. Nobody near, both turn on their own; a car near and slow, they
// stop with the car's place at the frame. The wheel's legs and the carousel's deck are walls for the car; a restart at HOME ends a ride.
//   node tests/browser/nvfair.test.mjs
import { serve, launch, openGame, checker, tapNewVersion } from './lib.mjs';

const T = checker('nvfair');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, { width: 412, height: 915 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  await tapNewVersion(page);
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });

  // 1. as built: the wheel's basket at the bottom over the ground under it, the plate in the ground, the carousel's deck; nobody near: both turn
  const b0 = await page.evaluate(() => { const g = __game, P = g.race.player; P.place(-60, 60, 0); P.vx = P.vz = 0; const s0 = NVFair.state(); g.sim(2, false, 0, 0, 0); const s1 = NVFair.state(), gy = (x, z) => MK.H3.ground(x, z);
    return { s0, dW: s1.wheel.phi - s0.wheel.phi, dC: s1.carousel.phi - s0.carousel.phi, gP: gy(s0.wheel.plate.x, s0.wheel.plate.z), gB: Math.max(gy(5.5 + 2.8, -28), gy(5.5, -28)) }; });
  T.check('built: the wheel\'s basket at the bottom just over the ground under it, the plate\'s top in the ground, the carousel\'s deck 0.5 m up',
    b0.s0.wheel.yF > b0.gB && b0.s0.wheel.yF < b0.gB + 0.6 && Math.abs(b0.s0.wheel.y0 - b0.gP) < 0.3 && Math.abs(b0.s0.carousel.yD - b0.s0.carousel.yG - 0.5) < 0.01, JSON.stringify(b0.s0));
  T.check('nobody near: the wheel and the carousel turn on their own', b0.dW > 0.2 && b0.dC > 0.5, JSON.stringify({ dW: b0.dW, dC: b0.dC }));

  // 2. the big wheel: the car stopped on the plate; the wheel stops with the basket at the bottom, the plate takes the car up, it glides in,
  // once round (up near the top), out, down; the camera behind the car all the way (the car on the screen); NVRide.on (no Na progo) meanwhile;
  // after it, driven into the wall of the legs in front of the plate and stopped there, it does not go up again (only once out of the frame)
  const w = await page.evaluate(() => { const g = __game, P = g.race.player, sp = NVFair.spot('wheel'); P.place(sp.x, sp.z, sp.h); P.vx = P.vz = 0; const R = { modes: [], yMax: -1e9, onAll: true, inView: true, behind: true };
    const v = new THREE.Vector3(); let t = 0; Render.setShot(null); Render.resetCam();
    for (; t < 70; t += 0.25) { g.sim(0.25, false, 0, 0, 0); Render.frame(1 / 60, 1, P, 'chase', {}); const s = NVFair.state().wheel; if (R.modes[R.modes.length - 1] !== s.mode) R.modes.push(s.mode);
      if (s.carry) { R.yMax = Math.max(R.yMax, P.y); if (!NVRide.on()) R.onAll = false;
        if (s.mode === 'ride') { const c = Render.camera; v.set(P.x, P.y + 0.7, P.z).project(c); if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1) R.inView = false;
          const bx = c.position.x - P.x, bz = c.position.z - P.z; if (bx * Math.cos(P.h) + bz * Math.sin(P.h) > -5 || c.position.y < P.y + 5) R.behind = false; } }
      if (s.rides > 0 && s.mode === 'free') break; }
    const s = NVFair.state().wheel; R.t = t; R.end = { x: +P.x.toFixed(2), z: +P.z.toFixed(2), y: +P.y.toFixed(2), mode: s.mode, rides: s.rides, carry: s.carry }; R.s = s;
    g.sim(1, false, 0, 1, 0); g.sim(1, false, 0, 0, 0); R.again = NVFair.state().wheel.mode;   // (into the legs' wall in front of the plate: still in the frame, not up again)
    g.sim(2, false, 0, 0, 1); R.off = +Math.hypot(P.x - sp.x, P.z - sp.z).toFixed(1); return R; });
  T.check('the big wheel: the car stopped on the plate goes up, into the basket, once round, out and down (in 70 s)', w.modes.join(',').includes('lift,in,ride,out,down,free') && w.end.rides === 1, JSON.stringify(w.modes) + ' ' + JSON.stringify(w.end));
  T.check('in the basket the car goes up near the wheel\'s top (its floor there 2 R over the bottom\'s)', w.yMax > w.s.yF + 2 * 8 - 0.5, JSON.stringify({ yMax: w.yMax, yF: w.s.yF }));
  T.check('back on the plate, down in the ground, the car free (NVRide.on all the ride); not up again while in the frame; it backs off', !w.end.carry && Math.abs(w.end.x - w.s.plate.x) < 0.1 && Math.abs(w.end.z - w.s.plate.z) < 0.1 && Math.abs(w.end.y - w.s.y0) < 0.1 && w.onAll && w.off > 2 && w.again === 'free', JSON.stringify(w.end) + ' off ' + w.off);
  T.check('the camera behind the car and over it all the ride, the car on the screen', w.inView && w.behind, JSON.stringify({ inView: w.inView, behind: w.behind }));

  // 3. the big carousel: the car stopped in its frame (nose to the deck); onto the deck, once round (the roof see-through), back into the frame
  const c = await page.evaluate(() => { const g = __game, P = g.race.player, sp = NVFair.spot('carousel'); P.place(sp.x, sp.z, sp.h); P.vx = P.vz = 0; const R = { modes: [], ang: 0, op: 1, yMax: -1e9 };
    let t = 0, a0 = null; const C = NVFair.CA;
    for (; t < 50; t += 0.1) { g.sim(0.1, false, 0, 0, 0); Render.frame(0.1, 1, P, 'chase', {}); NVRide.frame(0.1, 1, P, false); const s = NVFair.state().carousel; if (R.modes[R.modes.length - 1] !== s.mode) R.modes.push(s.mode);
      if (s.mode === 'ride') { const a = Math.atan2(P.z - C.z, P.x - C.x); if (a0 != null) { let d = a - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; R.ang += d; } a0 = a; R.op = Math.min(R.op, s.op); R.yMax = Math.max(R.yMax, P.y);
        R.r = Math.max(R.r || 0, Math.abs(Math.hypot(P.x - C.x, P.z - C.z) - C.rc)); R.face = Math.max(R.face || 0, Math.abs(Math.cos(P.h - Math.atan2(C.z - P.z, C.x - P.x)) - 1)); }
      if (s.rides > 0 && s.mode === 'free') break; }
    for (let i = 0; i < 30; i++) NVRide.frame(0.05, 1, P, false);
    const s = NVFair.state().carousel; R.t = t; R.end = { x: +P.x.toFixed(2), z: +P.z.toFixed(2), y: +P.y.toFixed(2), rides: s.rides, carry: s.carry, op: s.op }; R.box = s.box; R.yD = s.yD; return R; });
  T.check('the big carousel: the car stopped in its frame glides onto the deck, goes round once, back into the frame (in 50 s)', c.modes.join(',').includes('in,ride,out,free') && c.end.rides === 1 && Math.abs(c.ang - 2 * Math.PI) < 0.15, JSON.stringify(c.modes) + ' ' + JSON.stringify({ ang: c.ang, end: c.end }));
  T.check('on the deck: the car on it (0.5 m up), its middle on its circle, its nose to the middle', Math.abs(c.yMax - c.yD) < 0.05 && c.r < 0.05 && c.face < 0.01, JSON.stringify({ yMax: c.yMax, yD: c.yD, r: c.r, face: c.face }));
  T.check('the roof see-through over the car, whole again after', c.op < 0.4 && c.end.op > 0.99, JSON.stringify({ op: c.op, end: c.end.op }));
  T.check('back in the frame on the grass, free', !c.end.carry && Math.abs(c.end.x - c.box.x) < 0.1 && Math.abs(c.end.z - c.box.z) < 0.1 && Math.abs(c.end.y) < 0.2, JSON.stringify(c.end));

  // 4. walls: the carousel's deck (the car driven at it stops at its edge), the wheel's legs (no way under the wheel)
  const wl = await page.evaluate(() => { const g = __game, P = g.race.player, C = NVFair.CA, W = NVFair.WH;
    P.place(C.x, C.z + 20, -Math.PI / 2); P.vx = P.vz = 0; g.sim(4, false, 0, 0.6, 0); const dC = Math.hypot(P.x - C.x, P.z - C.z);
    P.place(W.x, W.z + 22, -Math.PI / 2); P.vx = P.vz = 0; g.sim(4, false, 0, 0.6, 0); const dW = Math.abs(P.z - W.z);
    return { dC: +dC.toFixed(2), dW: +dW.toFixed(2) }; });
  T.check('the carousel\'s deck and the wheel\'s legs are walls: the car driven at them stops at them', wl.dC > 7.2 && wl.dC < 11 && wl.dW > 6.4 && wl.dW < 10, JSON.stringify(wl));

  // 5. a restart at HOME in the middle of a ride: the car free, the ride free
  const r = await page.evaluate(() => { const g = __game, P = g.race.player, sp = NVFair.spot('carousel'); P.place(sp.x, sp.z, sp.h); P.vx = P.vz = 0;
    for (let t = 0; t < 30 && NVFair.state().carousel.mode !== 'ride'; t += 0.25) g.sim(0.25, false, 0, 0, 0); g.sim(2, false, 0, 0, 0); const was = NVFair.state().carousel.mode;
    NVRide.reset(P); return { was, mode: NVFair.state().carousel.mode, carry: NVFair.state().carousel.carry, on: NVRide.on() }; });
  T.check('a restart at HOME in the middle of a ride: the ride and the car free', r.was === 'ride' && r.mode === 'free' && !r.carry && !r.on, JSON.stringify(r));
  T.check('no errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  await srv.close();
}
T.done();
