// Razbijanje · nov način (Nastavitve: xBody, xGlass, xPaint, xDetail; render only, off by default):
// 1. off (the default): no car is built dense, the dents go the old way (applyDent), nothing new on the road
// 2. on, Izravnana: the player's car dense (its outer shell split, its ranges, paint list and drawn block consistent), the rivals as built;
//    blow after blow on the nose the crush goes deeper (each hit deepens the same cluster) and stops short of the windscreen (its cap);
//    a deep front crush tears the bonnet open and the grey engine shows; nothing NaN
// 3. the glass: each blow breaks the unbroken pane nearest to it, never one on the other side of the car; glass on the road after
// 4. the mirrors: the first side blow knocks that side's mirror off, it lies on the road and stays there while the car drives on
// 5. repeated side blows: the roof sinks on that side (its edge lower than the other side's)
// 6. one of the 11 (the rally car) dense too; switched off during a race the cars are built again as before
// 7. the phone's load (NIZKA tier, as perf.test.mjs counts it, one track): Izravnana within 6 % more vertices than off, Polna within 30 %
//   node tests/browser/crash.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Razbijanje · nov način: dense bodies, deeper crush, glass, mirrors, the load');
const srv = await serve();
const browser = await launch();
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'iso', zoom: 1.1, damage: 2, weather: 'dry', carId: 'tornado', carV: 3 };
  const run = async (settings, fn, arg) => {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, settings), { width: 640, height: 296 }, { seed: 4242 });
    await startTrack(page, 'jezero');
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true); g.sim(6, true);
      const R = g.race, P = R.player; for (const c of R.cars) if (c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 25) { c.x -= Math.cos(P.h) * 40; c.z -= Math.sin(P.h) * 40; c.px = c.x; c.pz = c.z; }
      R.repairCar(P); Render.frame(0.016, 1, P, 'iso', {}); Render.frame(0.016, 1, P, 'iso', {}); });
    const r = await page.evaluate(fn, arg);
    await ctx.close();
    return { r, errors };
  };
  const hitFn = `(P, h) => { Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); Render.frame(0.016, 1, P, 'iso', {}); }`;

  // 1. off
  const off = await run({}, () => { const P = window.__game.race.player, I = Render.crashInfo(), me = I.cars.find(q => q.player);
    Core.applyDamage(P, 0.12, P.m.len / 2, 0); Render.frame(0.016, 1, P, 'iso', {});
    const I2 = Render.crashInfo(), me2 = I2.cars.find(q => q.player);
    return { XC: I.XC, xOn: me.xOn, xd: me.xd, dense: I.cars.filter(q => q.xd).length, outerN: me.outerN, kit: Render.kitInfo('tornado').outerN, cl: me2.cl.length, shards: I2.shards, ground: I2.ground }; });
  T.check('off by default: no switch on, no car dense, the body as the kit built it', !off.r.XC.body && !off.r.XC.glass && !off.r.XC.paint && !off.r.xOn && off.r.dense === 0 && off.r.outerN === off.r.kit, JSON.stringify(off.r));
  T.check('off: a dent the old way (no clusters), nothing on the road', off.r.cl === 0 && off.r.shards === 0 && off.r.ground === 0, JSON.stringify(off.r));
  T.check('off: no page errors', !off.errors.length, off.errors.slice(0, 3).join(' | '));

  // 2.-5. on (Izravnana)
  const on = await run({ xBody: 1, xGlass: 1, xPaint: 1, xDetail: 'lite' }, (hs) => {
    const hit = eval(hs), g = window.__game, P = g.race.player, info = () => Render.crashInfo().cars.find(q => q.player), out = {};
    const me = info(), v = Render.viewOf(P), geo = v.body.geometry, U = geo.userData;
    out.dense = { xd: me.xd, outerN: me.outerN, kit: Render.kitInfo('tornado').outerN, rivals: Render.crashInfo().cars.filter(q => !q.player && q.xd).length };
    let okR = true; for (const n in U.ranges) { const R = U.ranges[n]; if (R.o[0] > R.o[1] || R.o[1] > U.outerN || R.o[0] % 3 || R.o[1] % 3) okR = false; if (R.i && (R.i[0] < U.outerN || R.i[1] > U.N)) okR = false; }
    out.ranges = okR && U.paint.i.length > 0 && Math.max(...U.paint.i) < U.N && geo.drawRange.count === U.outerN;
    // the nose, blow after blow
    out.depth = []; for (let k = 0; k < 6; k++) { hit(P, [0.12, 1, [-0.2, 0.1, -0.1, 0.2, 0, -0.15][k]]); const c = info().cl.find(q => q.u > 0.8); out.depth.push(c ? c.d : 0); }
    const me2 = info(); out.cap = me2.caps.F; out.torn = me2.torn; out.engine = me2.engine;
    const a = geo.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad;
    return out; }, hitFn);
  const D = on.r;
  T.check('on: the player\'s car dense, its outer shell split, the rivals as built (Izravnana)', D.dense.xd > 0 && D.dense.outerN > D.dense.kit * 1.5 && D.dense.rivals === 0, JSON.stringify(D.dense));
  T.check('on: the dense body\'s ranges, paint list and drawn block consistent', D.ranges, '');
  T.check('on: blow after blow on the nose the crush goes deeper', D.depth.every((d, k) => k === 0 || d > D.depth[k - 1]) && D.depth[0] > 0.1, D.depth.map(d => d.toFixed(2)).join(' '));
  T.check('on: the crush stops short of the windscreen (its cap)', D.depth[5] <= D.cap + 1e-6 && D.depth[5] > 0.6 * D.cap, 'depth ' + D.depth[5].toFixed(2) + ' cap ' + D.cap.toFixed(2));
  T.check('on: a deep front crush tears the bonnet open, the grey engine shows', D.torn && D.engine, JSON.stringify({ torn: D.torn, engine: D.engine }));
  T.check('on: no NaN in the body', D.nan === 0, 'NaN ' + D.nan);
  T.check('on: no page errors', !on.errors.length, on.errors.slice(0, 3).join(' | '));

  const gl = await run({ xBody: 1, xGlass: 1, xPaint: 1, xDetail: 'lite' }, (hs) => {
    const hit = eval(hs), P = window.__game.race.player, me = () => Render.crashInfo().cars.find(q => q.player), out = { steps: [] };
    const v = Render.viewOf(P), g0 = Render.crashInfo().ground, s0 = Render.crashInfo().shards;   // (what the race's first seconds left on the road)
    const panes = () => me().panes || [0, 0, 0, 0, 0, 0];
    for (const h of [[0.1, 0.3, 1], [0.1, -0.4, 1], [0.1, 0.25, 1]]) { hit(P, h); out.steps.push(panes().slice()); }
    out.sides = (v.xP || []).map(q => q.side); out.shards = Render.crashInfo().shards - s0;
    out.mir = me().mirrors.slice(); out.ground = Render.crashInfo().ground - g0;
    // the car drives on: the mirror stays where it fell
    for (let k = 0; k < 30; k++) { P.x += Math.cos(P.h) * 0.5; P.z += Math.sin(P.h) * 0.5; P.px = P.x; P.pz = P.z; Render.frame(1 / 30, 1, P, 'iso', {}); }
    out.ground2 = Render.crashInfo().ground - g0;
    // the left side again and again: the roof sinks on the left
    for (let k = 0; k < 5; k++) hit(P, [0.12, [0.1, -0.05, 0.15, 0, 0.05][k], -1]);
    const xc = v.xc, R = xc.rest, a = v.body.geometry.attributes.position.array, B = xc.B; let sL = 0, nL = 0, sR = 0, nR = 0;
    for (let i = 0; i < R.length / 3; i++) { const y = R[i * 3 + 1], z = R[i * 3 + 2], x = R[i * 3]; if (y < B.y0 + B.H * 0.85 || Math.abs(x) > 1 || (v.kit.deadV && v.kit.deadV[i])) continue; const d = a[i * 3 + 1] - y; if (z < -0.2) { sL += d; nL++; } else if (z > 0.2) { sR += d; nR++; } }
    out.roofL = nL ? sL / nL : 0; out.roofR = nR ? sR / nR : 0;
    return out; }, hitFn);
  const Gs = gl.r, side = (k) => Gs.sides[k];
  const newIdx = Gs.steps.map((s, j) => s.findIndex((b, k) => b && !(j ? Gs.steps[j - 1][k] : 0)));
  T.check('glass: each blow on the right breaks one more pane, on the right or the windscreen / rear window, never on the left',
    Gs.steps.every((s, j) => s.filter(Boolean).length === j + 1) && newIdx.every(k => k >= 0 && side(k) !== -1), JSON.stringify({ steps: Gs.steps, sides: Gs.sides }));
  T.check('glass: pieces lie on the road after', Gs.shards > 10, 'shards ' + Gs.shards);
  T.check('mirrors: the first right blow knocks the right one off, the left one stays', !Gs.mir[0] && Gs.mir[1] && Gs.ground === 1, JSON.stringify({ mir: Gs.mir, ground: Gs.ground }));
  T.check('mirrors: it stays on the road while the car drives on', Gs.ground2 === 1, 'ground ' + Gs.ground2);
  T.check('roof: after blows on the left again and again it sinks on the left', Gs.roofL < -0.03 && Gs.roofL < Gs.roofR - 0.02, 'left ' + Gs.roofL.toFixed(3) + ' right ' + Gs.roofR.toFixed(3));
  T.check('glass / mirrors / roof: no page errors', !gl.errors.length, gl.errors.slice(0, 3).join(' | '));

  // 6. one of the 11, and switching off during a race
  const lg = await run({ xBody: 1, xGlass: 1, xPaint: 0, xDetail: 'lite', carId: 'rally' }, (hs) => {
    const hit = eval(hs), P = window.__game.race.player, me = () => Render.crashInfo().cars.find(q => q.player), out = {};
    out.kit = !!P.m.kit; out.xd = me().xd; for (const h of [[0.12, 1, -0.9], [0.12, 1, -0.8], [0.1, 0.2, 1]]) hit(P, h);
    const a = Render.viewOf(P).body.geometry.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad; out.cl = me().cl.length;
    document.querySelector('[data-set="xBody"] button[data-v="0"]').click(); Render.frame(0.016, 1, P, 'iso', {});
    out.after = me(); return out; }, hitFn);
  T.check('one of the 11 (the rally car): dense, dented the new way, no NaN', !lg.r.kit && lg.r.xd > 0 && lg.r.cl > 0 && lg.r.nan === 0, JSON.stringify({ kit: lg.r.kit, xd: lg.r.xd, cl: lg.r.cl, nan: lg.r.nan }));
  T.check('switched off during a race: the cars built again as before', !lg.r.after.xOn && !lg.r.after.xd, JSON.stringify({ xOn: lg.r.after.xOn, xd: lg.r.after.xd }));
  T.check('one of the 11: no page errors', !lg.errors.length, lg.errors.slice(0, 3).join(' | '));

  // 7. the load (as perf.test.mjs counts it, NIZKA, chase camera, six places round the lap)
  const load = {};
  for (const [k, s] of [['off', {}], ['lite', { xBody: 1, xGlass: 1, xDetail: 'lite' }], ['full', { xBody: 1, xGlass: 1, xDetail: 'full' }]]) {
    const { page, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, { camera: 'chase', zoom: 1.2 }, s), { width: 844, height: 390 }, { seed: 12345 });
    await page.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
      const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
    await startTrack(page, 'jezero');
    load[k] = await page.evaluate(() => { const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause(); const P = g.race.player; let v = 0;
      for (let k = 0; k < 6; k++) { for (let i = 0; i < 10; i++) g.sim(1, true); Render.frame(1 / 60, 1, P, 'chase', {}); const v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); v += __gl.verts - v0; }
      return Math.round(v / 6); });
    await ctx.close();
  }
  T.check('the load: Izravnana within 6 % more vertices than off', load.lite <= load.off * 1.06, JSON.stringify(load));
  T.check('the load: Polna within 30 % more vertices than off', load.full <= load.off * 1.3, JSON.stringify(load));
} finally {
  await browser.close(); await srv.close();
}
T.done();
