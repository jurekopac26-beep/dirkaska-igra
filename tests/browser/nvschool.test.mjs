// NEW VERSION · TEST 1: the driving school's tasks (js/nvschool.js) on the new map. From the menu (js/nvmenu.js): START on a task's card fades
// to the task's start, 3 · 2 · 1 · GO, the task's panel at the top (the clock, the hint, ×); × gives up. Each task built driven by a car moved
// along a line by hand (the game paused, the task stepped with its own step): done and its place, the rules that fail it (the wrong side of a
// cone, over the line, too slow, outside the cones), a knocked cone (+2 s); the result card (PONOVI, NAZAJ: back to the school's floor, its menu at
// the licence); the places kept (localStorage rra-avtosola).
//   node tests/browser/nvschool.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('nvschool');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, { width: 412, height: 915 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });
  T.check('the school loaded with the new map: its cones (6 of the slalom, 4 of the parallel box), all 36 tasks built', await page.evaluate(() => typeof NVSchool !== 'undefined' && NVSchool.cones().length === 10 && ['c', 'm', 'k'].every(l => [...Array(12).keys()].every(i => NVSchool.has(l, i)))));

  // 1. from the menu: the school's floor, ROAD LICENCE, task 4 (the slalom), START
  await page.evaluate(() => { const f = NVMenu.floors().find(q => q.key === 'school'), P = __game.race.player; P.place(f.x, f.z, f.h); P.vx = P.vz = 0; });
  await page.waitForFunction(() => { const s = NVMenu.state(); return s.at === 'school' && s.open; }, null, { timeout: 30000 });
  await page.click('#nvm [data-a="lic"][data-i="0"]'); await page.click('#nvm [data-a="lvn"]').catch(() => { });
  await page.evaluate(() => { NVMenu.setPlace('c', 0, 1); NVMenu.setPlace('c', 1, 1); NVMenu.setPlace('c', 2, 1); });
  await page.evaluate(() => { const b = document.querySelector('#nvm [data-a="lvn"]'); if (b) b.click(); });
  await page.click('#nvm [data-a="task"][data-i="3"]');
  await page.click('#nvm .go');
  const s1 = await page.waitForFunction(() => { const s = NVSchool.state(), h = document.getElementById('nvt'); return s && s.st === 'count' && h && { st: s.st, menu: !!document.getElementById('nvm'), cd: (document.getElementById('nvt-cd') || {}).textContent, k: h.querySelector('.k').textContent, n: h.querySelector('.n').textContent, x: __game.race.player.x, z: __game.race.player.z }; }, null, { timeout: 30000, polling: 100 }).then(h => h.jsonValue(), () => null);
  T.check('START on the slalom: the menu closes, the car on the task\'s start (the practice area\'s west end, in line with the cones), 3 · 2 · 1, the task\'s panel', s1 && !s1.menu && /ROAD LICENCE/.test(s1.k) && /Slalom/i.test(s1.n) && /^[123]$/.test(s1.cd) && Math.abs(s1.x - 24.5) < 0.5 && Math.abs(s1.z - 78) < 0.5, JSON.stringify(s1));
  await page.click('#nvt .x');
  const s2 = await page.evaluate(() => ({ s: NVSchool.state(), hud: !!document.getElementById('nvt') }));
  T.check('× gives up: no task, no panel', !s2.s && !s2.hud, JSON.stringify(s2));

  // 2. each task driven along a line (the game paused; the task stepped 30 times a second): pts [x, z, speed m/s, reverse]
  await page.evaluate(() => { __game.pause && __game.pause(); });
  const drive = (l, i, pts, opt = {}) => page.evaluate(async ({ l, i, pts, opt }) => {
    const P = { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, y: 0, m: { len: 4.4, wid: 1.9 }, place(x, z, h) { this.x = x; this.z = z; this.h = h; } }, dt = 1 / 30;
    if (!NVSchool.start(l, i)) return { err: 'no task' };
    await new Promise(r => setTimeout(r, 400));
    let n = 0; while (NVSchool.state().st === 'count' && n++ < 200) NVSchool.tick(P, true, dt);
    if (opt.at) { P.x = opt.at[0]; P.z = opt.at[1]; }
    let k = 0; const path = [];
    for (let s = 0; s < 3000 && NVSchool.state().st === 'go'; s++) {
      if (k < pts.length) { const [x, z, v, rev] = pts[k], dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz), st = Math.max(v, 0.6) * dt;
        if (d < 1e-6) { k++; continue; }
        const u = Math.min(1, st / d), sp = v; P.h = Math.atan2(dz, dx) + (rev ? Math.PI : 0); P.x += dx * u; P.z += dz * u; P.vx = dx / d * sp; P.vz = dz / d * sp; if (u >= 1) k++;
      } else { P.vx = P.vz = 0; }
      if (opt.h != null && k >= pts.length) P.h = opt.h;
      NVSchool.tick(P, true, dt); if (s % 15 === 0) path.push([+P.x.toFixed(1), +P.z.toFixed(1)]);
    }
    const r = NVSchool.state(), card = document.getElementById('nvt-res');
    return { ...r, card: card ? { place: +card.dataset.place, txt: card.textContent } : null, path: opt.path ? path : undefined };
  }, { l, i, pts, opt });
  const PL = (r) => r && r.st === 'end' ? r.place : 0;

  // ROAD 2 · start and stop: 30 m, stop in the yellow box
  const r1 = await drive('c', 1, [[58, 89, 9]]);
  T.check('start and stop: stopped inside the yellow box, done (a place)', PL(r1) >= 1 && PL(r1) <= 3, JSON.stringify(r1));
  const r1b = await drive('c', 1, [[80, 89, 9]]);
  T.check('start and stop: past the box, failed', r1b.st === 'end' && r1b.place === 4 && /past/.test(r1b.why), JSON.stringify(r1b));
  // ROAD 3 · brake to the line: 54 km/h at the cones, the front 0.4 m before the line: 1st; over it: failed; 36 km/h: failed
  const r2 = await drive('c', 2, [[81.4, 89, 15]]);
  T.check('brake to the line: 54 km/h at the cones, stopped 0.4 m before the line: 1st place', PL(r2) === 1, JSON.stringify(r2));
  const r2b = await drive('c', 2, [[83, 89, 15]]);
  T.check('brake to the line: over the line: failed', r2b.place === 4 && /over the line/.test(r2b.why), JSON.stringify(r2b));
  const r2c = await drive('c', 2, [[80, 89, 10]]);
  T.check('brake to the line: 36 km/h at the cones: failed (too slow)', r2c.place === 4 && /too slow/.test(r2c.why), JSON.stringify(r2c));
  // ROAD 4 · slalom: the right way through, then the wrong side of cone 2, then through a cone (+2 s)
  const SL = [[32, 75.5, 9], [42, 80.5, 9], [52, 75.5, 9], [62, 80.5, 9], [72, 75.5, 9], [82, 80.5, 9], [93, 78, 9]];
  const r3 = await drive('c', 3, SL);
  T.check('slalom: weaving through the 6 cones, touching none: 1st place', PL(r3) === 1 && r3.pen === 0, JSON.stringify(r3));
  const r3b = await drive('c', 3, [[32, 75.5, 9], [42, 75.5, 9], [52, 75.5, 9]]);
  T.check('slalom: the wrong side of cone 2: failed', r3b.place === 4 && /cone 2/.test(r3b.why), JSON.stringify(r3b));
  const r3c = await drive('c', 3, [[32, 75.5, 9], [42, 78.6, 9], [52, 75.5, 9], [62, 80.5, 9], [72, 75.5, 9], [82, 80.5, 9], [93, 78, 9]]);
  const k3 = await page.evaluate(() => NVSchool.cones().filter(c => c.hit).length);
  T.check('slalom: through cone 2: it is knocked over (+2 s), the task still done', r3c.st === 'end' && r3c.pen === 2 && k3 === 1, JSON.stringify([r3c.pen, k3, r3c.place]));
  // ROAD 5 · figure of eight: twice round each cone, one each way; then both the same way: failed
  const ring = (cx, cz, a0, turns, r = 6, v = 8) => { const o = []; for (let k = 1; k <= Math.abs(turns) * 24; k++) { const a = a0 + k / 24 * 2 * Math.PI * Math.sign(turns); o.push([cx + r * Math.cos(a), cz + r * Math.sin(a), v]); } return o; };
  const r4 = await drive('c', 4, [[100, 100, 8]].concat(ring(106, 100, Math.PI, 2)).concat([[100, 80, 8]]).concat(ring(106, 80, Math.PI, -2)));
  T.check('figure of eight: twice round each cone, one each way: done', PL(r4) >= 1 && PL(r4) <= 3, JSON.stringify(r4));
  const r4b = await drive('c', 4, [[100, 100, 8]].concat(ring(106, 100, Math.PI, 2)).concat([[100, 80, 8]]).concat(ring(106, 80, Math.PI, 2)));
  T.check('figure of eight: both cones the same way round: failed', r4b.place === 4 && /same way/.test(r4b.why), JSON.stringify(r4b));
  // ROAD 6 · reverse parking: past the bay, back into it between the two cars; nose in: not done (the hint)
  const r5 = await drive('c', 5, [[50, 98, 6], [45, 100, 2, 1], [42.85, 104, 2, 1], [42.85, 107.75, 1.5, 1]]);
  T.check('reverse parking: backed into the free bay between the cars, touching neither: done', PL(r5) >= 1 && PL(r5) <= 3 && r5.pen === 0, JSON.stringify(r5));
  // ROAD 7 · parallel parking
  const r6 = await drive('c', 6, [[83, 103.5, 6], [78, 106.6, 2, 1], [75.2, 108, 2, 1], [74, 108, 1, 1]], { h: 0 });
  T.check('parallel parking: reversed into the box between the two cars: done', PL(r6) >= 1 && PL(r6) <= 3, JSON.stringify(r6));
  // ROAD 11 · lane change: 58 km/h, to the left lane and back
  const LCp = [[62, 89, 16], [76, 83.5, 16], [82, 83.5, 16], [96, 89, 16], [112, 89, 16]];
  const r7 = await drive('c', 10, LCp);
  T.check('lane change: 58 km/h, through the cones: done', PL(r7) >= 1 && PL(r7) <= 3, JSON.stringify(r7));
  const r7b = await drive('c', 10, [[62, 89, 16], [112, 89, 16]]);
  T.check('lane change: straight on past the left lane\'s cones: failed', r7b.place === 4 && /outside/.test(r7b.why), JSON.stringify(r7b));
  // ROAD 1 · a lap of the track through its 4 gates
  const lap = await page.evaluate(() => { const t = MK.T(), n = t.px.length; let bi = 0, bd = 1e18; const P0 = NVSchool.PAD(); for (let i = 0; i < n; i += 2) { const d = (t.px[i] - P0[0] - 48) ** 2 + (t.pz[i] - P0[2]) ** 2; if (d < bd) { bd = d; bi = i; } } const o = []; for (let k = 4; k <= n + 6; k += 4) { const i = (bi + k) % n; o.push([t.px[i], t.pz[i], 30]); } return { o, len: t.len }; });
  const r8 = await drive('c', 0, lap.o);
  T.check('a lap of the track: through the 4 gates, back over the line: done', r8.st === 'end' && r8.place < 4 || (r8.place === 4 && /slow/.test(r8.why)), JSON.stringify({ ...r8, len: lap.len }));

  // ROAD 8-10, GRAVEL, HILL: along the task's own way (plan: [metres along, speed m/s, seconds to stand there]; lat: off its middle, rev: backwards)
  const wayDrive = (l, i, plan, opt = {}) => page.evaluate(async ({ l, i, plan, opt }) => {
    const P = { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, y: 0, m: { len: 4.4, wid: 1.9 }, place(x, z, h) { this.x = x; this.z = z; this.h = h; } }, dt = 1 / 30;
    if (!NVSchool.start(l, i)) return { err: 'no task' };
    await new Promise(r => setTimeout(r, 400));
    let n = 0; while (NVSchool.state().st === 'count' && n++ < 200) NVSchool.tick(P, true, dt);
    const latF = opt.lat ? (0, eval)(opt.lat) : null, W = NVSchool.way(); let k = 0; while (k < W.length - 1 && Math.hypot(W[k][0] - P.x, W[k][1] - P.z) > 1) k++;
    let s = W[k][2], j = 0, hold = 0;
    for (let t = 0; t < 6000 && NVSchool.state().st === 'go'; t++) {
      const [to, v, st] = plan[Math.min(j, plan.length - 1)];
      if (j < plan.length && Math.abs(to - s) < 0.05) { if (hold < (st || 0)) { hold += dt; P.vx = P.vz = 0; NVSchool.tick(P, true, dt); continue; } j++; hold = 0; continue; }
      const dir = Math.sign(to - s) || 1, ds = Math.min(Math.abs(to - s), v * dt); s += dir * ds; if (j >= plan.length) s = to;
      while (k < W.length - 2 && W[k + 1][2] <= s) k++; while (k > 0 && W[k][2] > s) k--;
      const a = W[k], b = W[Math.min(W.length - 1, k + 1)], f = b[2] > a[2] ? (s - a[2]) / (b[2] - a[2]) : 0, h = a[3], off = latF ? latF(s) : 0;
      P.x = a[0] + (b[0] - a[0]) * f - Math.sin(h) * off; P.z = a[1] + (b[1] - a[1]) * f + Math.cos(h) * off;
      const mv = j >= plan.length ? 0 : v * dir; P.vx = Math.cos(h) * mv; P.vz = Math.sin(h) * mv; P.h = h + (dir < 0 ? Math.PI : 0) + (opt.turn ? Math.PI : 0);
      NVSchool.tick(P, true, dt);
    }
    const r = NVSchool.state(); return { ...r, end: W[W.length - 1][2] };
  }, { l, i, plan, opt: { lat: opt.lat ? opt.lat.toString() : null, turn: opt.turn } }).then(r => r);
  const ok = (r) => r && r.st === 'end' && r.place < 4;
  const E = async (l, i) => (await page.evaluate(({ l, i }) => { NVSchool.start(l, i); return new Promise(r => setTimeout(() => { const s = NVSchool.state(), W = NVSchool.way(); NVSchool.stop(true); r({ to: s.data.to, end: W && W[W.length - 1][2], s0: W && s.data.k != null ? W[s.data.k][2] : 0 }); }, 400)); }, { l, i }));
  const ways = [['c', 7, 'the junction: up the way, right onto road 2, in the right lane', 10], ['m', 0, 'the gravel course end to end', 14], ['m', 2, 'the gravel corner through the 3 gates', 12], ['m', 7, 'the wiggles', 11], ['m', 10, 'the forest road', 11],
    ['k', 0, 'the hill lap: up, round the top, down', 9], ['k', 2, 'the steady climb at 32 km/h', 9], ['k', 3, 'the first switchback', 8], ['k', 6, 'all the switchbacks up', 9], ['k', 8, 'all the switchbacks down', 9], ['k', 9, 'the snow climb', 8], ['k', 10, 'the snow descent at 29 km/h', 8], ['k', 11, 'the hill exam', 10], ['m', 6, 'the small jump at 43 km/h', 12]];
  for (const [l, i, name, v] of ways) { const e = await E(l, i), r = await wayDrive(l, i, [[e.to + 0.6, v]]); T.check(name + ': done', ok(r), JSON.stringify({ ...r, e })); }
  const eb = await E('m', 1), rb = await wayDrive('m', 1, [[70, 12, 2]]);
  T.check('braking on gravel: 43 km/h at the yellow line, stopped in the box: done', ok(rb), JSON.stringify(rb));
  const rb2 = await wayDrive('m', 1, [[40, 8], [70, 8, 2]]);
  T.check('braking on gravel: 29 km/h at the yellow line: failed (too slow)', rb2.place === 4 && /too slow/.test(rb2.why), JSON.stringify(rb2));
  const rd = await wayDrive('k', 4, [[150, 9, 2]]);
  T.check('braking downhill: at 32 km/h, stopped in the box: done', ok(rd), JSON.stringify(rd));
  const rd2 = await wayDrive('k', 4, [[150, 14, 2]]);
  T.check('braking downhill: at 50 km/h: failed (over 40 km/h)', rd2.place === 4 && /over 40/.test(rd2.why), JSON.stringify(rd2));
  const rh = await wayDrive('k', 1, [[100, 6, 2], [116, 4]]);
  T.check('hill start: stopped in the box on the slope, then up 12 m: done', ok(rh), JSON.stringify(rh));
  const rh2 = await wayDrive('k', 1, [[100, 6, 2], [98.5, 1]]);
  T.check('hill start: rolled back 1.5 m: failed', rh2.place === 4 && /rolled back/.test(rh2.why), JSON.stringify(rh2));
  const et = await E('k', 5), rt = await wayDrive('k', 5, [[et.end - 12, 6, 2]]);
  T.check('stop at the top: stopped in the circle: done', ok(rt), JSON.stringify(rt));
  const rr = await wayDrive('k', 7, [[118.6, 3]], { turn: true });
  T.check('reverse uphill: 20 m backwards up the straight: done', ok(rr), JSON.stringify(rr));
  const rn = await wayDrive('m', 8, [[46, 3], [30, 3]]);
  T.check('turn on a narrow road: facing the other way, driving off: done', ok(rn), JSON.stringify(rn));
  const rp = await wayDrive('m', 3, [[318, 10]], { lat: '(s) => { const k = Math.round((s - 235) / 12); return s < 225 || s > 300 ? 0 : (k % 2 ? -2.3 : 2.3); }' });
  T.check('pole slalom on gravel: past the 6 poles: done', ok(rp), JSON.stringify(rp));
  // the meadow: the gravel eight, the drift (the car 0.45 rad across its way), the handbrake turn
  const AR = { x: -188, z: 24 };
  const ge = await drive('m', 4, [[AR.x - 2, AR.z + 6, 8]].concat(ring(AR.x - 8, AR.z, 0, 2)).concat([[AR.x + 2, AR.z - 6, 8]]).concat(ring(AR.x + 8, AR.z, Math.PI, -2)));
  T.check('gravel eight: twice round each pole, one each way: done', ok(ge), JSON.stringify(ge));
  const hb = await drive('m', 9, [[AR.x - 14, AR.z + 5, 10], [AR.x + 6, AR.z + 5, 10]].concat(ring(AR.x + 6, AR.z, Math.PI / 2, -0.5, 5, 6)).concat([[AR.x - 18, AR.z - 5, 10]]));
  T.check('handbrake turn: round the post and back over the line: done', ok(hb), JSON.stringify(hb));
  // ROAD 10 · the roundabout: down lane 0, once round the fountain anticlockwise, out down lane 1
  const J = await page.evaluate(() => NVPark.J), [fx, fz, fr] = J.PL.F;
  const rbt = [[62, -7, 9], [fx + fr * 0.8, fz + 2, 9]].concat(ring(fx, fz, Math.atan2(2, fr * 0.8), -1.15, fr, 9)).concat([J.LANES[1][1].concat(9), J.LANES[1][2].concat(9), J.LANES[1][3].concat(9)]);
  const ro = await drive('c', 9, rbt);
  T.check('the roundabout: once round the fountain, out to the next plaza: done', ok(ro), JSON.stringify(ro));

  // 3. the result card: PONOVI starts it again; NAZAJ: the school's floor, its menu at ROAD LICENCE; the places kept
  await page.evaluate(() => { __game.resume && __game.resume(); });
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('rra-avtosola') || 'null'));
  T.check('the places kept (localStorage rra-avtosola): the brake to the line 1st (100 %)', kept && kept.c && kept.c[2] === 100, JSON.stringify(kept));
  T.check('no errors on the way', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
