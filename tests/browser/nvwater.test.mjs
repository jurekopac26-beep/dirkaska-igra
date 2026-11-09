// NEW VERSION · TEST 1: driving on the water (js/nvwater.js; docs/nova-mapa-voda.md). The jet skis at HOME's pier (two: ours in the places of
// js/nvboat.js's, not merged) and a free one at the course's start; the car stopped on the shore by one: the card, TAKE THE JET SKI; riding it
// (MisKit.boat): the car held where it waits, the camera behind the jet ski; it slides in a turn (its motion after its nose), leans into it,
// rides the waves; never onto the land; along the canal under the ring road to the sea; slow by the land: BACK TO YOUR CAR, the car on the
// shore there, facing the land. The car driven into the water: its ground the bed (the bridges' decks stay), the shallow slows it, the deep
// puts it back on the shore (NAZAJ NA OBALO) with no damage. A restart at HOME: off the jet ski, the jet skis back in their places.
//   node tests/browser/nvwater.test.mjs
import { serve, launch, openGame, checker, tapNewVersion } from './lib.mjs';

const T = checker('nvwater');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, { width: 412, height: 915 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  await tapNewVersion(page);
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });

  // 1. the jet skis as built: two at the pier, one at the start, on the water, ours all in one mesh (not merged with the map), js/nvboat.js's own at the pier out of the scene
  const s0 = await page.evaluate(() => { const s = NVWater.state(), C = __H3.waterCourse;
    return { skis: s.skis.map(k => ({ at: k.at, x: k.x, z: k.z, d: +NVWater.depth(k.x, k.z).toFixed(2) })), idle: s.idle, theirs: (C.skis || []).map(k => !!(k.g && k.g.parent)) }; });
  T.check('three jet skis: two at HOME\'s pier and a free one at the course\'s start, on the water, all three in one mesh (one draw call, not merged with the map); js/nvboat.js\'s two at the pier out of the scene',
    s0.skis.length === 3 && s0.skis.filter(k => k.at === 'pier').length === 2 && s0.skis.filter(k => k.at === 'start').length === 1 && s0.skis.every(k => k.d >= 0.12) && s0.idle.n === 3 && s0.idle.dyn && s0.idle.inScene && s0.theirs.length === 2 && s0.theirs.every(v => !v), JSON.stringify(s0));

  // 2. the car stopped on the shore by the pier's jet ski: the card; TAKE THE JET SKI: on it, the car held where it waits, the camera behind it
  const card = () => page.evaluate(() => { const e = document.getElementById('nvw'); return e && getComputedStyle(e).display !== 'none' ? [...e.querySelectorAll('.row')].map(b => b.firstChild.textContent) : null; });
  const t0 = await page.evaluate(() => { const g = __game, P = g.race.player, k = NVWater.state().skis[0]; let b = null;
    for (let r = 3; r < 12 && !b; r += 0.5) for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, x = k.x + Math.cos(a) * r, z = k.z + Math.sin(a) * r; if (NVWater.depth(x, z) === 0 && __H3.waterCourse.dW(x, z) > 1.5) { b = { x, z, h: Math.atan2(k.z - z, k.x - x) }; break; } }
    if (!b) return null; P.place(b.x, b.z, b.h); P.vx = P.vz = 0; g.sim(0.5, false, 0, 0, 0); NVWater.frame(1 / 60, 1, P, true); return { car: b, st: NVWater.state().zone }; });
  const c1 = await card();
  T.check('the car stopped on the shore by the pier\'s jet ski: the card at the top, TAKE THE JET SKI', t0 && t0.st === 'take' && c1 && c1[0] === 'TAKE THE JET SKI', JSON.stringify({ t0, c1 }));
  await page.evaluate(() => { const b = document.querySelector('#nvw [data-a="ski"]'); if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  const on = await page.evaluate(() => { const g = __game, P = g.race.player, x0 = P.x, z0 = P.z; g.sim(0.2, false, 0, 0, 0); const s = NVWater.state();
    return { on: NVWater.on(), boat: document.body.classList.contains('mis-boat'), locked: !!P.locked, car: s.car, idle: s.idle.n, moved: +Math.hypot(P.x - x0, P.z - z0).toFixed(3), shot: !!(Render.shot || Render.getShot && Render.getShot()) }; });
  T.check('TAKE THE JET SKI: riding it (the HUD\'s speed off: mis-boat), the car held where it waits', on.on && on.boat && on.locked && on.moved < 0.05 && !!on.car && on.idle === 2, JSON.stringify(on));

  // 3. the ride on the start's long straight: fast; in a hard turn it slides (its motion after its nose) and leans into it; the waves lift it
  const rd = await page.evaluate(() => { const g = __game, P = g.race.player, C = __H3.waterCourse, Kl = C.K, s0 = __H3.boatC.dress.s0, at = (s) => { let i = Kl.A.findIndex(a => a >= s); if (i < 1) i = 1; const [ax, az] = Kl.P[i - 1], [bx, bz] = Kl.P[i]; return { x: ax, z: az, h: Math.atan2(bz - az, bx - ax) }; };
    const p = at(s0 - 45), cx = P.x, cz = P.z; NVWater.put(p.x, p.z, p.h); let y0 = 1e9, y1 = -1e9, v = 0, slip = 0, roll = 0, dry = 0, dist = 0, lx = p.x, lz = p.z;
    for (let k = 0; k < 120; k++) { g.sim(1 / 60, false, 0, 1, 0); const s = NVWater.state().ski; v = Math.max(v, s.v); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); dist += Math.hypot(s.x - lx, s.z - lz); lx = s.x; lz = s.z; if (NVWater.depth(s.x, s.z) < 0.12) dry++; }
    for (let k = 0; k < 50; k++) { g.sim(1 / 60, false, 1, 1, 0); const s = NVWater.state().ski; slip = Math.max(slip, Math.abs(Math.atan2(Math.sin(s.h - s.mh), Math.cos(s.h - s.mh)))); roll = Math.max(roll, s.roll); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); if (NVWater.depth(s.x, s.z) < 0.12) dry++; }
    return { v: +v.toFixed(1), dist: +dist.toFixed(1), slip: +slip.toFixed(3), roll: +roll.toFixed(3), waves: +(y1 - y0).toFixed(3), dry, car: +Math.hypot(P.x - cx, P.z - cz).toFixed(3) }; });
  T.check('riding: on the straight it gets going (over 12 m/s, 15 m in 2 s), the car stays where it waits', rd.v > 12 && rd.dist > 15 && rd.car < 0.05, JSON.stringify(rd));
  T.check('in a hard turn it slides (its motion turns after its nose), leans into the turn and rides the waves (up and down); always on the water', rd.slip > 0.05 && rd.roll > 0.1 && rd.waves > 0.03 && rd.dry === 0, JSON.stringify(rd));

  // 4. never onto the land: full throttle at the beach, it stops in the water
  const ld = await page.evaluate(() => { const g = __game, C = __H3.waterCourse, s0 = __H3.boatC.dress.s0, Kl = C.K, i = Math.max(1, Kl.A.findIndex(a => a >= s0 + 30)), [cx, cz] = Kl.P[i], [ax, az] = Kl.P[i - 1], [bx, bz] = Kl.P[i + 1], tl = Math.hypot(bx - ax, bz - az);
    let nx = -(bz - az) / tl, nz = (bx - ax) / tl; if (C.dW(cx + nx * 15, cz + nz * 15) < C.dW(cx - nx * 15, cz - nz * 15)) { nx = -nx; nz = -nz; }
    const x = cx + nx * 3, z = cz + nz * 3; NVWater.put(x, z, Math.atan2(nz, nx)); let low = 9; for (let k = 0; k < 180; k++) { g.sim(1 / 60, false, 0, 1, 0); const s = NVWater.state().ski; low = Math.min(low, NVWater.depth(s.x, s.z)); }
    const s = NVWater.state().ski; return { low: +low.toFixed(3), edge: +C.dW(s.x, s.z).toFixed(2), v: +s.v.toFixed(2), zone: NVWater.state().zone }; });
  T.check('never onto the land: driven at the beach it stops in the water (the shallow shelf at most), by the shore: BACK TO YOUR CAR offered', ld.low >= 0.12 && ld.edge < 0 && ld.zone === 'land', JSON.stringify(ld));

  // 5. along the canal under the ring road's bridge to the sea, then out on the sea
  const cn = await page.evaluate(() => { const g = __game, C = __H3.waterCourse, Q = C.C.P, R = C.ring, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)); let under = 1e9, i = 0, sea = 0, dry = 0;
    const rb = R ? (() => { let b = null; R.L2.P.forEach((p, k) => { const d = Math.abs(R.L2.A[k] - R.sc); if (!b || d < b.d) b = { d, p }; }); return b.p; })() : null;
    NVWater.put(Q[0][0], Q[0][1], Math.atan2(Q[3][1] - Q[0][1], Q[3][0] - Q[0][0]));
    for (let k = 0; k < 60 * 30; k++) { const s = NVWater.state().ski; while (i < Q.length - 1 && Math.hypot(Q[i][0] - s.x, Q[i][1] - s.z) < 9) i++; const t = Q[Math.min(Q.length - 1, i)], st = Math.max(-1, Math.min(1, wrap(Math.atan2(t[1] - s.z, t[0] - s.x) - s.h) * 2.5));
      g.sim(1 / 60, false, st, 0.8, 0); if (rb) under = Math.min(under, Math.hypot(s.x - rb[0], s.z - rb[1])); if (NVWater.depth(s.x, s.z) < 0.12) dry++; if (i >= Q.length - 1 && Math.hypot(Q[Q.length - 1][0] - s.x, Q[Q.length - 1][1] - s.z) < 6) break; }
    const end = NVWater.state().ski, h = Math.atan2(Q[Q.length - 1][1] - Q[Q.length - 6][1], Q[Q.length - 1][0] - Q[Q.length - 6][0]);
    for (let k = 0; k < 60 * 4; k++) { const s = NVWater.state().ski; g.sim(1 / 60, false, Math.max(-1, Math.min(1, wrap(h - s.h) * 2)), 0.8, 0); }
    const s = NVWater.state().ski; sea = s.sea;
    return { end: [+end.x.toFixed(1), +end.z.toFixed(1)], under: +under.toFixed(1), sea: +sea.toFixed(2), dry, at: [+s.x.toFixed(1), +s.z.toFixed(1)], d: +NVWater.depth(s.x, s.z).toFixed(2), region: !!(__H3.water.region && __H3.water.region(s.x, s.z)) }; });
  T.check('along the canal under the ring road\'s bridge (past it within 6 m) to its mouth and out on the sea (its swell under it, the water deeper)', cn.under < 6 && cn.region && cn.sea > 0.5 && cn.d > 0.5 && cn.dry === 0, JSON.stringify(cn));

  // 6. slow by the land: BACK TO YOUR CAR: the car on the shore there (on the land, facing it), the jet ski left in the water
  const bk = await page.evaluate(() => { const g = __game, P = g.race.player, C = __H3.waterCourse, s0 = __H3.boatC.dress.s0, Kl = C.K, i = Kl.A.findIndex(a => a >= s0 + 60), [x0, z0] = Kl.P[i], e = 0.5;
    const gr = (x, z) => [C.dW(x + e, z) - C.dW(x - e, z), C.dW(x, z + e) - C.dW(x, z - e)]; let x = x0, z = z0; for (let k = 0; k < 40 && C.dW(x, z) < -2.5; k++) { const [a, b] = gr(x, z), l = Math.hypot(a, b) || 1; x += a / l * 0.5; z += b / l * 0.5; }
    NVWater.put(x, z, 0); g.sim(0.3, false, 0, 0, 0); NVWater.frame(1 / 60, 1, P, true); const zone = NVWater.state().zone, ski = NVWater.state().ski;
    const b = document.querySelector('#nvw [data-a="car"]'); if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); g.sim(0.1, false, 0, 0, 0);
    const s = NVWater.state(), k = s.skis.find(q => Math.hypot(q.x - ski.x, q.z - ski.z) < 0.5), toCar = Math.atan2(P.z - ski.z, P.x - ski.x);
    return { zone, on: NVWater.on(), boat: document.body.classList.contains('mis-boat'), d: NVWater.depth(P.x, P.z), gap: +Math.hypot(P.x - ski.x, P.z - ski.z).toFixed(1), face: +Math.cos(P.h - toCar).toFixed(2), left: !!k, idle: s.idle.n, locked: !!P.locked, lands: s.lands }; });
  T.check('slow by the shore: BACK TO YOUR CAR; the car on the land there (within 15 m, facing away from the water, free), the jet ski left in the water, the HUD back', bk.zone === 'land' && !bk.on && !bk.boat && bk.d === 0 && bk.gap < 15 && bk.face > 0.5 && bk.left && bk.idle === 3 && !bk.locked && bk.lands === 1, JSON.stringify(bk));

  // 7. the car driven into the water: its ground the bed (the bridges' decks stay), the shallow slows it, the deep puts it back on the shore
  const gd = await page.evaluate(() => { const T2 = __game.race.track, C = __H3.waterCourse, H = C.home, S = H.S, m = S.P[Math.max(0, Math.min(S.P.length - 1, Math.round((H.sa + H.sb) / 2 / S.L * (S.P.length - 1))))], R = C.ring; let rt = null;
    if (R) { let b = null; R.L2.P.forEach((p, k) => { const d = Math.abs(R.L2.A[k] - R.sc); if (!b || d < b.d) b = { d, p }; }); rt = +T2.ground2(b.p[0], b.p[1], 5).toFixed(2); }
    const Kl = C.K, p = Kl.P.find(([x, z]) => NVWater.depth(x, z) > 2 && __H3.ground(x, z) < 0.5) || Kl.P[0]; return { home: +T2.ground2(m[0], m[1], 5).toFixed(2), ring: rt, mid: +T2.ground2(p[0], p[1], 5).toFixed(2), d: +NVWater.depth(p[0], p[1]).toFixed(2) }; });
  T.check('the car\'s ground under the water is the bed (mid-course 1.5 m and more under the surface); HOME\'s wooden bridge and the ring road\'s bridge stay its ground', gd.mid < -1.5 && gd.home > 1.5 && (gd.ring == null || gd.ring > 2.2), JSON.stringify(gd));
  const sh = await page.evaluate(() => { const g = __game, P = g.race.player, C = __H3.waterCourse, s0 = __H3.boatC.dress.s0, Kl = C.K, i = Kl.A.findIndex(a => a >= s0 + 120), [x0, z0] = Kl.P[i], e = 0.5;
    const gr = (x, z) => [C.dW(x + e, z) - C.dW(x - e, z), C.dW(x, z + e) - C.dW(x, z - e)]; let x = x0, z = z0; for (let k = 0; k < 60 && C.dW(x, z) < -1.4; k++) { const [a, b] = gr(x, z), l = Math.hypot(a, b) || 1; x += a / l * 0.25; z += b / l * 0.25; }
    const [a, b] = gr(x, z), along = Math.atan2(a, -b), run = (px, pz) => { P.place(px, pz, along); P.y = P.py = P.roadY = __game.race.track.ground2(px, pz, 5); P.vx = P.vz = 0; g.sim(0.3, false, 0, 0, 0); const y = P.y; g.sim(1, false, 0, 1, 0); return { v: Math.hypot(P.vx, P.vz), y }; };
    const w = run(x, z), l = Math.hypot(a, b) || 1, dry = run(x + a / l * 9, z + b / l * 9); return { wet: +w.v.toFixed(2), yWet: +w.y.toFixed(2), dry: +dry.v.toFixed(2), depth: +NVWater.depth(x, z).toFixed(2) }; });
  T.check('in the shallow by the beach the car stands in the water (on the bed) and is slowed: slower than on the beach with the same throttle', sh.depth > 0.1 && sh.yWet < -0.15 && sh.wet < sh.dry * 0.85, JSON.stringify(sh));
  const dp = await page.evaluate(() => { const g = __game, P = g.race.player, C = __H3.waterCourse, s0 = __H3.boatC.dress.s0, Kl = C.K, i = Kl.A.findIndex(a => a >= s0 + 200), [x0, z0] = Kl.P[i], e = 0.5;
    const gr = (x, z) => [C.dW(x + e, z) - C.dW(x - e, z), C.dW(x, z + e) - C.dW(x, z - e)]; let x = x0, z = z0; for (let k = 0; k < 80 && C.dW(x, z) < 9; k++) { const [a, b] = gr(x, z), l = Math.hypot(a, b) || 1; x += a / l * 0.5; z += b / l * 0.5; }
    const [a, b] = gr(x, z); P.place(x, z, Math.atan2(-b, -a)); P.vx = P.vz = 0; g.sim(0.5, false, 0, 0, 0); const dmg0 = P.dmg || 0, b0 = NVWater.state().backs; let wet = 0, maxD = 0;
    for (let k = 0; k < 60 * 6 && NVWater.state().backs === b0; k++) { g.sim(1 / 60, false, 0, 0.6, 0); wet = Math.max(wet, -0.12 - P.y); maxD = Math.max(maxD, NVWater.depth(P.x, P.z)); }
    g.sim(0.05, false, 0, 0, 0); const from = Math.atan2(C.dW(P.x, P.z + 1) - C.dW(P.x, P.z - 1), C.dW(P.x + 1, P.z) - C.dW(P.x - 1, P.z));
    return { backs: NVWater.state().backs - b0, wet: +wet.toFixed(2), maxD: +maxD.toFixed(2), d: NVWater.depth(P.x, P.z), v: +Math.hypot(P.vx, P.vz).toFixed(2), dmg: +((P.dmg || 0) - dmg0).toFixed(3), face: +Math.cos(P.h - from).toFixed(2), shore: +C.dW(P.x, P.z).toFixed(1) }; });
  T.check('into the deep water: the car sinks in, then is put back on the shore (on the land, still, facing away from the water), with no damage', dp.backs === 1 && dp.wet > 0.5 && dp.d === 0 && dp.v < 0.5 && dp.dmg <= 0 && dp.face > 0.5 && dp.shore > 0, JSON.stringify(dp));

  const se = await page.evaluate(() => { const g = __game, P = g.race.player, C = __H3.waterCourse, W = __H3.water, Q = C.C.P, n = Q.length, h = Math.atan2(Q[n - 1][1] - Q[n - 6][1], Q[n - 1][0] - Q[n - 6][0]);
    const sx = Q[n - 1][0] + Math.cos(h) * 30, sz = Q[n - 1][1] + Math.sin(h) * 30; let best = null;   // (out on the sea off the canal's mouth: the nearest dry beach)
    for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; for (let r = 2; r < 160; r += 1) { const x = sx + Math.cos(a) * r, z = sz + Math.sin(a) * r; if (NVWater.depth(x, z) === 0) { if (!best || r < best.r) best = { a, r }; break; } } }
    if (!best) return null; const x = sx + Math.cos(best.a) * (best.r + 8), z = sz + Math.sin(best.a) * (best.r + 8); P.place(x, z, best.a + Math.PI); P.y = P.py = P.roadY = __game.race.track.ground2(x, z, 5); P.vx = P.vz = 0; g.sim(0.5, false, 0, 0, 0);
    const b0 = NVWater.state().backs, dmg0 = P.dmg || 0; let sea = 0;
    for (let k = 0; k < 60 * 10 && NVWater.state().backs === b0; k++) { g.sim(1 / 60, false, 0, 0.6, 0); if (W.region(P.x, P.z)) sea = Math.max(sea, NVWater.depth(P.x, P.z)); }
    g.sim(0.05, false, 0, 0, 0); return { backs: NVWater.state().backs - b0, sea: +sea.toFixed(2), d: NVWater.depth(P.x, P.z), v: +Math.hypot(P.vx, P.vz).toFixed(2), dmg: +((P.dmg || 0) - dmg0).toFixed(3), from: best.r }; });
  T.check('into the sea from its beach: deep, then put back on the shore (on the land, still), with no damage', !!se && se.backs === 1 && se.sea > 0.7 && se.d === 0 && se.v < 0.5 && se.dmg <= 0, JSON.stringify(se));

  // 8. the start's free jet ski taken, then a restart at HOME: in the car, the jet skis back in their places
  const rs = await page.evaluate(() => { const g = __game, P = g.race.player, k = NVWater.state().skis.find(q => q.at === 'start'); let b = null;
    for (let r = 3; r < 13 && !b; r += 0.5) for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, x = k.x + Math.cos(a) * r, z = k.z + Math.sin(a) * r; if (NVWater.depth(x, z) === 0) { b = { x, z }; break; } }
    if (!b) return null; P.place(b.x, b.z, 0); P.vx = P.vz = 0; g.sim(0.3, false, 0, 0, 0); const zone = NVWater.state().zone; NVWater.pick('ski'); g.sim(0.1, false, 0, 0, 0); const on1 = NVWater.on(); g.sim(1, false, 0, 1, 0);
    NVWater.reset(P); g.sim(0.1, false, 0, 0, 0); const s = NVWater.state(); return { zone, on1, on2: NVWater.on(), home: s.skis.every(q => Math.hypot(q.x - q.home.x, q.z - q.home.z) < 0.01), boat: document.body.classList.contains('mis-boat') }; });
  T.check('the start\'s free jet ski taken too; a restart at HOME: off it, in the car, the jet skis back in their places', rs && rs.zone === 'take' && rs.on1 && !rs.on2 && rs.home && !rs.boat, JSON.stringify(rs));
  T.check('no errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  await srv.close();
}
T.done();
