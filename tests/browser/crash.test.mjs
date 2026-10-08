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
// 8. xParts, xDust, xDrag: a rear bumper knocked loose drags on the road throwing sparks; a hard knock throws dust and bits; the bumper
//    knocked off lies on the road and, pushed out of the core's 40 pieces, stays drawn there; off: none of it (the piece freed as before);
//    rolling over: the car's black underside (floor, subframes, tunnel, exhaust, tank) drawn while it rolls, not before nor after
//   node tests/browser/crash.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Razbijanje · nov način: dense bodies, deeper crush, glass, mirrors, parts on the track, dust, the load');
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

  // 8. parts on the track, dust and bits, a bumper dragging (on), and the same with the three off
  const pd = {};
  for (const [k, s] of [['on', { xBody: 1, xParts: 1, xDust: 1, xDrag: 1 }], ['off', { xBody: 1 }]]) pd[k] = await run(s, (hs) => {
    const hit = eval(hs), g = window.__game, R = g.race, P = R.player, v = Render.viewOf(P), out = {};
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
    for (let k = 0; k < 14 && !v.kit.ajar.bumperR && !P.lost.bumperR; k++) hit(P, [0.06, -1, 0.1]);
    out.ajar = !!v.kit.ajar.bumperR && !P.lost.bumperR;
    // driving on at 15 m/s with it hanging: sparks off its low end
    P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15; P.rpm = 0; P.shiftT = 0; Render.frame(1 / 30, 1, P, 'iso', {}); P.fxWall = P.fxCar = 0;   // (low revs: no exhaust pops, its random sparks; the knocks' sparks had)
    const s0 = Render.fxStats().sparksN;
    for (let k = 0; k < 20; k++) Render.frame(1 / 30, 1, P, 'iso', {});
    out.drag = Render.fxStats().sparksN - s0; out.hubs = v.wheelOff.filter(Boolean).length; P.vx = 0; P.vz = 0;   // (a wheel off: its hub scrapes too, on and off)
    // a hard knock from another car: dust and bits
    const f0 = Render.fxStats().total; P.fxCar = 9; P.contactX = P.x + Math.cos(P.h) * 2.2; P.contactZ = P.z + Math.sin(P.h) * 2.2; Render.frame(0.016, 1, P, 'iso', {});
    out.dust = Render.fxStats().total - f0;
    // knocked off: the piece onto the road, resting; then pushed out of the core's 40
    for (let k = 0; k < 20 && !P.lost.bumperR; k++) hit(P, [0.1, -1, 0]);
    out.lost = !!P.lost.bumperR;
    for (let k = 0; k < 240; k++) { R.step(1 / 120); if (k % 8 === 0) Render.frame(1 / 15, 1, P, 'iso', {}); }
    const d = R.debris.find(q => q.car === P.id && q.part === 'bumperR'); out.piece = !!(d && d.mesh && d.mesh.traverse); out.rest = !!(d && (d.rest || d.ground));
    if (d) { d.dead = true; R.debris.splice(R.debris.indexOf(d), 1); }
    for (let k = 0; k < 3; k++) Render.frame(1 / 30, 1, P, 'iso', {});
    out.kept = Render.crashInfo().kept; out.drawn = !!(d && d.mesh && d.mesh.parent);
    // rolling over (c.rl, as the core sets it): its black underside drawn while it rolls, gone after
    out.und0 = !!v.xUnd; P.rl = { t: 0.4, T: 1.2, turns: 1, dir: 1, H: 1, k: 0 }; Render.frame(0.016, 1, P, 'iso', {});
    out.und1 = !!(v.xUnd && v.xUnd.visible); out.undTris = v.xUnd ? v.xUnd.geometry.attributes.position.count / 3 : 0;
    delete P.rl; Render.frame(0.016, 1, P, 'iso', {}); out.und2 = !!(v.xUnd && v.xUnd.visible);
    return out; }, hitFn);
  const PO = pd.on.r, PF = pd.off.r;
  T.check('parts: a rear bumper knocked loose drags on the road throwing sparks (off: only a hub\'s, if a wheel is off)', PO.ajar && PF.ajar && PO.hubs === PF.hubs && PO.drag > PF.drag + 9 && (PF.hubs || PF.drag === 0), JSON.stringify({ on: [PO.ajar, PO.drag, PO.hubs], off: [PF.ajar, PF.drag, PF.hubs] }));
  T.check('dust: a hard knock throws dust and bits (more than off)', PO.dust > PF.dust + 6, JSON.stringify({ on: PO.dust, off: PF.dust }));
  T.check('parts: knocked off, the piece lies on the road and, pushed out of the core\'s 40, stays drawn (off: freed)', PO.lost && PO.piece && PO.rest && PO.kept === 1 && PO.drawn && PF.lost && PF.kept === 0 && !PF.drawn, JSON.stringify({ on: PO, off: PF }));
  T.check('rolling over: the black underside drawn only while the car rolls', !PO.und0 && PO.und1 && PO.undTris > 30 && !PO.und2, JSON.stringify({ before: PO.und0, rolling: PO.und1, tris: PO.undTris, after: PO.und2 }));
  T.check('parts / dust / drag: no page errors', !pd.on.errors.length && !pd.off.errors.length, pd.on.errors.concat(pd.off.errors).slice(0, 3).join(' | '));

  // 7. the load (as perf.test.mjs counts it, NIZKA, chase camera, six places round the lap): off, Izravnana and Polna drawn in turn at
  // each place, the same frame (switched as in Nastavitve: the cars built again), so only the cars' own geometry differs
  const { page: lp, ctx: lc } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, { camera: 'chase', zoom: 1.2 }), { width: 844, height: 390 }, { seed: 12345 });
  await lp.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
  await startTrack(lp, 'jezero');
  const load = await lp.evaluate(() => { const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.onAction('restart'); g.pause(); const P = g.race.player, out = { off: 0, lite: 0, full: 0 };
    const set = (k, v) => document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`).click();
    const meas = () => { Render.frame(1 / 60, 1, P, 'chase', {}); const v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); return __gl.verts - v0; };
    for (let k = 0; k < 6; k++) { for (let i = 0; i < 10; i++) g.sim(1, true);
      set('xBody', 0); set('xGlass', 0); out.off += meas(); set('xBody', 1); set('xGlass', 1); set('xDetail', 'lite'); out.lite += meas(); set('xDetail', 'full'); out.full += meas(); }
    set('xBody', 0); set('xGlass', 0); set('xDetail', 'lite');
    for (const k in out) out[k] = Math.round(out[k] / 6); return out; });
  await lc.close();
  T.check('the load: Izravnana within 6 % more vertices than off', load.lite <= load.off * 1.06, JSON.stringify(load));
  T.check('the load: Polna within 30 % more vertices than off', load.full <= load.off * 1.3, JSON.stringify(load));
} finally {
  await browser.close(); await srv.close();
}
T.done();
