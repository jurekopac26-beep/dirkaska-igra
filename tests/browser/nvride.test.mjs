// NEW VERSION · TEST 1, sklop 10 (js/nvride.js, js/nvpark.js, js/nvsite.js): what the car rides and what moves on the new map.
// The gondola for cars: the bottom station on the meadow (a deck, a ramp up to each dock), the top one on the summit inside the hill's top loop
// (no deck, the cabins stand on the summit, their doors fold down to the ground), its tower off every way; the car driven up a ramp into the
// waiting cabin and stopped: the door shuts, the cabin takes it up, the door in front opens, the car drives out on the summit. The volcano train:
// the car stopped in the yellow box on the platform goes onto the wagon, once round the volcano and back onto the platform, then down the ramp
// at the other end. The fire engine at the rescue base: the car in the red bay, the card, DRIVE THE FIRE ENGINE (the truck's model, the car left
// in the bay), back in its place BACK TO YOUR CAR; a restart at HOME gives the car back. The site's machines and the park's rides move (near the
// car), the dump truck going round its loop is a wall for the car.
//   node tests/browser/nvride.test.mjs
import { serve, launch, openGame, checker, tapNewVersion } from './lib.mjs';

const T = checker('nvride');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, { width: 412, height: 915 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  await tapNewVersion(page);
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });

  // 1. the gondola as built: the stations, the tower off every way, the cabins at their docks with the doors to the stations down, not merged
  const g0 = await page.evaluate(() => { const s = NVRide.state(), ng = (x, z) => { const r = MK.netGap(x, z, null, 1); return r ? +r.d.toFixed(2) : 99; };
    return { A: s.A, B: s.B, hull: s.hull, towers: s.towers.map(([x, z]) => ng(x, z)), up: s.up, dn: s.dn, open: s.open, mode: s.mode, dB: ng(s.B.x, s.B.z) }; });
  T.check('the gondola: the bottom station on the meadow (its deck under 1.5 m), the top one on the summit (over 29 m), a tower or more, each off every way (2 m and more)',
    g0.A.top < 1.5 && g0.B.top > 29 && g0.towers.length >= 1 && g0.towers.every(d => d > 1.5), JSON.stringify({ A: g0.A, B: g0.B, towers: g0.towers }));
  T.check('the cabins wait at their docks (the up one at the bottom, the down one at the top), their floors level with the deck and the summit', g0.mode === 'dock' && Math.abs(g0.up.fl - g0.A.top) < 0.05 && Math.abs(g0.dn.fl - g0.B.top) < 0.05, JSON.stringify({ up: g0.up.fl, dn: g0.dn.fl }));
  await page.evaluate(() => __game.sim(1.5, false, 0, 0, 0));
  const op = await page.evaluate(() => NVRide.state().open);
  T.check('at the docks the doors to the stations are down (the up cabin\'s back one, the down cabin\'s back one), the others shut', op.up.b > 0.97 && op.up.f < 0.03 && op.dn.b > 0.97 && op.dn.f < 0.03, JSON.stringify(op));

  // 2. the ride: up the ramp into the up cabin, stopped; the door shuts, up the line, the door in front opens, out onto the summit
  const ride = await page.evaluate(() => { const g = __game, P = g.race.player, R = NVRide, out = {}, A = R.state().A, sp = R.spot('A', -22, -2.4), c = Math.cos(sp.h), s = Math.sin(sp.h), loc = () => [(P.x - A.x) * c + (P.z - A.z) * s, -(P.x - A.x) * s + (P.z - A.z) * c];
    P.place(sp.x, sp.z, sp.h); P.vx = P.vz = 0; g.sim(0.3, false, 0, 0, 0);
    for (let i = 0; i < 900; i++) { const [a, b] = loc(), he = Math.atan2(Math.sin(sp.h - P.h), Math.cos(sp.h - P.h)), st = Math.max(-1, Math.min(1, he * 2 - (b + 2.4) * 0.3)), v = Math.hypot(P.vx, P.vz);
      if (a < -2) g.sim(1 / 60, false, st, v < 6 ? 0.6 : 0, 0); else g.sim(1 / 60, false, st, 0, v > 0.3 ? 1 : 0); if (a > -2 && v < 0.2) break; }
    out.in = R.state().cin; out.yIn = P.y; g.sim(1.6, false, 0, 0, 0); out.mode = R.state().mode; out.carry = R.state().carry;
    let yMax = 0, stuck = 0; for (let k = 0; k < 30; k++) { g.sim(1, false, 0, 1, 0); yMax = Math.max(yMax, P.y); stuck = Math.max(stuck, P.stuckT); if (R.state().mode === 'dock' && !R.state().carry) break; }
    out.top = { mode: R.state().mode, f: R.state().f, y: P.y, x: P.x, z: P.z, rides: R.state().rides }; out.yMax = yMax; out.stuck = stuck;
    g.sim(4, false, 0, 0.5, 0); out.out = { cin: R.state().cin, y: P.y, dB: Math.hypot(P.x - R.state().B.x, P.z - R.state().B.z) }; return out; });
  T.check('driven up the ramp into the cabin waiting at the bottom and stopped: the door shuts and the cabin sets off with the car in it', ride.in === 'up' && ride.carry === 'up' && (ride.mode === 'shut' || ride.mode === 'ride'), JSON.stringify(ride));
  T.check('the cabin takes the car up the line (high over the hill) to the top station; standing in it is not stuck (no Na progo: js/game.js shows it over 2.5 s)', ride.top.f === 1 && ride.top.rides === 1 && ride.yMax > g0.B.top + 2 && Math.abs(ride.top.y - g0.B.top) < 0.1 && ride.stuck < 0.5, JSON.stringify({ top: ride.top, yMax: ride.yMax, stuck: ride.stuck }));
  T.check('at the top the door in front opens and the car drives out down it onto the summit', !ride.out.cin && ride.out.dB > 8 && ride.out.y < g0.B.top + 0.2, JSON.stringify(ride.out));

  // 3. the volcano train: the car in the yellow box on the platform goes onto the wagon, once round the volcano, back onto the platform; then down the other ramp
  const tr = await page.evaluate(() => { const g = __game, P = g.race.player, R = NVRide, T0 = R.train(), sp = R.trainSpot(-24, 0), c = Math.cos(sp.h), s = Math.sin(sp.h), loc = () => [(P.x - T0.st.x) * c + (P.z - T0.st.z) * s, -(P.x - T0.st.x) * s + (P.z - T0.st.z) * c], out = { L: T0.L };
    P.place(sp.x, sp.z, sp.h); P.vx = P.vz = 0; g.sim(0.3, false, 0, 0, 0);
    for (let i = 0; i < 1200; i++) { const [a, b] = loc(), he = Math.atan2(Math.sin(sp.h - P.h), Math.cos(sp.h - P.h)), st = Math.max(-1, Math.min(1, he * 2 - b * 0.3)), v = Math.hypot(P.vx, P.vz);
      if (a < -1.5) g.sim(1 / 60, false, st, v < 5 ? 0.5 : 0, 0); else g.sim(1 / 60, false, st, 0, v > 0.3 ? 1 : 0); if (a > -1.5 && v < 0.2) break; }
    out.box = { y: +P.y.toFixed(2), top: T0.st.top, a: loc().map(v => +v.toFixed(2)) }; g.sim(2.2, false, 0, 0, 0); out.go = R.train().mode + (R.train().carry ? ' carry' : '');
    let low = 1e9, far = 0; for (let k = 0; k < 60; k++) { g.sim(1, false, 0, 0, 0); low = Math.min(low, P.y); far = Math.max(far, Math.hypot(P.x - T0.st.x, P.z - T0.st.z)); if (R.train().mode === 'dock') break; }
    out.back = { mode: R.train().mode, rides: R.train().rides, carry: R.train().carry, a: loc().map(v => +v.toFixed(2)), y: +P.y.toFixed(2) }; out.low = +low.toFixed(2); out.far = Math.round(far);
    g.sim(4, false, 0, 0.4, 0); out.off = { a: loc().map(v => +v.toFixed(1)), y: +P.y.toFixed(2) }; return out; });
  T.check('the volcano train: the car up the ramp, stopped in the yellow box on the platform (as high as the wagon\'s deck), goes onto the wagon and away', Math.abs(tr.box.y - tr.box.top) < 0.1 && Math.abs(tr.box.a[1]) < 1.5 && tr.go === 'go carry', JSON.stringify(tr.box) + ' ' + tr.go);
  T.check('once round the volcano on the wagon (its deck the car\'s ground all the way) and back onto the platform\'s box', tr.back.mode === 'dock' && tr.back.rides === 1 && !tr.back.carry && Math.abs(tr.back.a[0]) < 0.3 && Math.abs(tr.back.a[1]) < 0.3 && tr.low > tr.box.top - 1 && tr.far > 30, JSON.stringify(tr));
  T.check('then down the ramp at the platform\'s other end', tr.off.a[0] > 14 && tr.off.y < 0.5, JSON.stringify(tr.off));

  // 4. the fire engine: parked; the car in the red bay: the card; DRIVE: the truck; back in its place: BACK TO YOUR CAR
  const card = () => page.evaluate(() => { const e = document.getElementById('nvf'); return e && getComputedStyle(e).display !== 'none' ? [...e.querySelectorAll('.row')].map(b => b.firstChild.textContent) : null; });
  const f0 = await page.evaluate(() => { const g = __game, P = g.race.player, F = NVRide.fire(), b = F.bay; P.place(b.x, b.z - 12, Math.PI / 2); P.vx = P.vz = 0; g.sim(0.2, false, 0, 0, 0);
    for (let i = 0; i < 600; i++) { const v = Math.hypot(P.vx, P.vz); if (P.z < b.z - 1) g.sim(1 / 60, false, 0, v < 4 ? 0.5 : 0, 0); else g.sim(1 / 60, false, 0, 0, v > 0.2 ? 1 : 0); if (P.z >= b.z - 1 && v < 0.15) break; }
    return { F, car: P.m.id }; });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const c0 = await card();
  T.check('the fire engine parked in its place at the rescue base; the car stopped in the red bay beside it: the card DRIVE THE FIRE ENGINE (FIREFIGHTING locked)', f0.F.mode === 'park' && Array.isArray(c0) && c0[0] === 'DRIVE THE FIRE ENGINE' && c0[1] === 'FIREFIGHTING', JSON.stringify(c0));
  await page.evaluate(() => document.querySelector('#nvf .row[data-a="drive"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  const f1 = await page.evaluate(() => { const g = __game, P = g.race.player; g.sim(0.1, false, 0, 0, 0); const a = { mode: NVRide.fire().mode, m: P.m.id, len: P.m.len, x: P.x, z: P.z }; g.sim(3, false, 0, 0.6, 0); a.v = Math.round(Math.hypot(P.vx, P.vz) * 3.6); a.dz = +(P.z - a.z).toFixed(1); g.sim(2, false, 0, 0, 1); return a; });
  T.check('DRIVE THE FIRE ENGINE: the player drives the fire engine (the racing truck\'s physics, 8.4 m), from its place; the car left in the bay', f1.mode === 'drive' && f1.m === 'titan' && f1.len === 8.4 && Math.abs(f1.x + 42.5) < 0.1 && f1.dz > 5, JSON.stringify(f1));
  const f2 = await page.evaluate(() => { const g = __game, P = g.race.player, h = NVRide.fire().home; P.place(h.x, h.z, h.h); P.vx = P.vz = 0; g.sim(0.3, false, 0, 0, 0); return NVRide.fire().zone; });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const c1 = await card();
  T.check('back in its place: the card BACK TO YOUR CAR', f2 && Array.isArray(c1) && c1[0] === 'BACK TO YOUR CAR', JSON.stringify(c1));
  await page.evaluate(() => document.querySelector('#nvf .row[data-a="car"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  const f3 = await page.evaluate(() => { const g = __game, P = g.race.player; g.sim(0.1, false, 0, 0, 0); return { mode: NVRide.fire().mode, m: P.m.id, x: +P.x.toFixed(1), z: +P.z.toFixed(1) }; });
  T.check('BACK TO YOUR CAR: the car again, where it was left in the bay; the fire engine in its place', f3.mode === 'park' && f3.m === f0.car && Math.abs(f3.x + 49.5) < 0.5 && Math.abs(f3.z - 79.3) < 1, JSON.stringify(f3));
  // a restart at HOME while driving the fire engine: the car again
  const f4 = await page.evaluate(() => { NVRide.firePick('drive'); __game.sim(0.1, false, 0, 0, 0); const before = __game.race.player.m.id; NVRide.reset(__game.race.player); return { before, after: __game.race.player.m.id, mode: NVRide.fire().mode }; });
  T.check('a restart at HOME in the fire engine: the car again', f4.before === 'titan' && f4.after === f0.car && f4.mode === 'park', JSON.stringify(f4));

  // 5. what moves: the site's machines (the dump truck round its loop, a wall for the car), the park's rides near the car
  const mv = await page.evaluate(() => { const g = __game, P = g.race.player; P.place(-235, 230, 1.9); P.vx = P.vz = 0; const s0 = NVSite.state(); g.sim(4, false, 0, 0, 0); const s1 = NVSite.state();
    const moved = s0.movers.map((m, i) => +Math.hypot(m[0] - s1.movers[i][0], m[1] - s1.movers[i][1]).toFixed(2));
    // the dump truck in the car's way: the car driven at it stops at it
    const d = window.__H3.movers.find(m => m.hl > 3.4); let was = false; for (let k = 0; k < 400; k++) { const px = d.x, pz = d.z; g.sim(0.25, false, 0, 0, 0); if (Math.hypot(d.x - px, d.z - pz) > 0.05) was = true; else if (was) break; }
    const x0 = d.x - Math.cos(d.h + Math.PI / 2) * 9, z0 = d.z - Math.sin(d.h + Math.PI / 2) * 9; P.place(x0, z0, d.h + Math.PI / 2); P.vx = P.vz = 0; g.sim(2.5, false, 0, 0.5, 0);
    const gap = Math.hypot(P.x - d.x, P.z - d.z);
    // the big wheel near the car, in view: it turns
    P.place(10, 0, -1.6); P.vx = P.vz = 0; g.sim(0.1, false, 0, 0, 0); Render.resetCam(); for (let i = 0; i < 3; i++) { Render.frame(1 / 60, 1, P, 'chase', {}); NVRide.frame(1 / 60, 1, P, false); }
    let rot = null; Render.scene.traverse(o => { if (!rot && o.isGroup && o.children.length === 1 && o.children[0].isMesh && o.children[0].userData.dyn && o.parent && Math.abs(o.parent.position.x - 5.5) < 0.1 && Math.abs(o.parent.position.z + 28) < 0.1) rot = o; });
    const r0 = rot ? rot.rotation.z : null; g.sim(1, false, 0, 0, 0); const r1 = rot ? rot.rotation.z : null;
    return { n: s1.n, moved, gap: +gap.toFixed(2), wheel: rot ? +(r1 - r0).toFixed(3) : null }; });
  T.check('the site\'s machines move: the loader, the dozer, the roller and the dump truck drive about', mv.n >= 8 && mv.moved.filter(v => v > 0.3).length >= 3, JSON.stringify(mv));
  T.check('the dump truck is a wall for the car: driven at it as it stands (loading or tipping), the car stops at it', mv.gap > 1.6 && mv.gap < 4.5, JSON.stringify(mv));
  T.check('the park\'s big wheel turns (near the car, in view)', mv.wheel !== null && Math.abs(mv.wheel) > 0.1, JSON.stringify(mv));
  T.check('no errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  await srv.close();
}
T.done();
