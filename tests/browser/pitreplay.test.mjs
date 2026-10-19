// The player's pit stop in the replay (Bathurst, Avstralija: the race on autopilot, one stop on lap 1, the car a little damaged). The race
// records the player's pit state as it changes (a few entries a stop: in the lane on the autopilot, stop, repair, done, the hand-back, out of
// the lane); "Posnetek" plays the stop back as a short film: the crew goes out, works (the car up on the jacks) and clears as long as in the
// race, the pit stop's film camera takes over from the camera behind the car (close to the car and low at the box) and gives the view back
// by the hand-back; the same over the TV cameras; at 4× the crew still does it all. A jump into the middle of the stop with the replay
// paused: the crew at work at once (every man in his place, the old wheels in their hands, the car on the jacks), nothing moves while it
// stands; Foto there: the crew at work round the car in the picture, the picture saved. ⏮: the crew at home at once (no tyre in anyone's
// hands). "Končaj": the race's own pit state untouched (the replay's overlay gone, the car's view not rebuilt), no page errors.
//   node tests/browser/pitreplay.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop in the replay (bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  // the replay's frames counted and logged (each: the replay's time, its camera, the crew's mode, the film camera's weight, the jacks' lift,
  // the camera's distance from the player's car on the ground and its height over it)
  await page.evaluate(() => { window.__rf = 0; window.__fr = []; const o = Render.frame; Render.frame = function (dt, a, target, mode, opt) { const r = o.apply(this, arguments); window.__rf++;
    const g = window.__game, P = g.replay, c = Render.crew, pc = g.race && g.race.player, cm = Render.camera;
    if (P && opt && opt.rdt != null && c && pc) window.__fr.push({ t: P.t, cam: P.cam, mode: c.mode, w: Render.pitCam, lift: c.lift, st: pc.rpPit ? pc.rpPit.pitState : 'none', d: Math.hypot(cm.position.x - pc.x, cm.position.z - pc.z), h: cm.position.y - (pc.y || 0) });
    return r; }; });
  await startTrack(page, 'bathurst');
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const frames = (n) => page.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res(window.__rf - f0) : setTimeout(chk, 20); chk(); }), n);

  // the race to the results, the stop's times as the race has them (way in on the autopilot, the repair and its length, done, the hand-back)
  const live = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, Tk = g.race.track; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
    const o = { ap: null, rep: null, dur: 0, done: null, back: null, out: null };
    for (let k = 0; k < 40000 && g.phase !== 'done'; k++) {
      const ap0 = P.pitAP, st0 = P.pitState, in0 = P.inPit; g.sim(P.pitWant || P.inPit || P.pitAP ? 0.05 : 0.5, true); const t = g.race.time;
      if (!ap0 && P.pitAP && o.ap == null) o.ap = t;
      if (st0 !== 'repair' && P.pitState === 'repair') { o.rep = t; o.dur = P.pitDur; }
      if (st0 === 'repair' && P.pitState === 'done') o.done = t;
      if (ap0 && !P.pitAP && o.done != null && o.back == null) o.back = t;
      if (in0 && !P.inPit && o.done != null && o.out == null) o.out = t;
      if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }
      if (P.repairN && !P.inPit) P.pitWant = false;
    }
    o.phase = g.phase; o.repairN = P.repairN || 0; return o;
  });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const ok0 = live.ap != null && live.rep != null && live.done != null && live.back != null && live.repairN === 1;
  T.check('the race: one stop on the autopilot (way in, repair, done, the hand-back in the lane)', ok0, JSON.stringify(live));
  if (!ok0) throw new Error('no stop in the race');
  const before = await page.evaluate(() => { const P = window.__game.race.player; window.__v0 = Render.viewOf(P); return { pitState: P.pitState, inPit: !!P.inPit, pitAP: !!P.pitAP, pitDone: !!P.pitDone, pitT: P.pitT, repairN: P.repairN }; });
  const rec = await page.evaluate(() => window.__game.rpPit);
  const seq = rec.log.map(e => (e.inPit ? 'L' : '-') + (e.ap ? 'A' : '-') + ':' + (e.st || '') + (e.done ? '!' : '')).join(' ');
  const rr = rec.log.find(e => e.st === 'repair');
  T.check('recorded: a few entries (not a frame each), the stop in order: on the autopilot in the lane, stop, repair (its start and length as in the race), done, the hand-back, out',
    rec.log.length <= 10 && /^--: (L-: )?LA: LA:stop LA:repair LA:done! L-:done! --:$/.test(seq) && !!rr && Math.abs(rr.t0 - live.rep) < 0.06 && Math.abs(rr.dur - live.dur) < 1e-6 && rr.n === 0 && rec.log[rec.log.length - 1].n === 1,
    seq + ' ' + JSON.stringify({ rep: rr && { t0: +rr.t0.toFixed(3), dur: +rr.dur.toFixed(3) }, live: { rep: +live.rep.toFixed(3), dur: +live.dur.toFixed(3) } }));

  // the replay: the camera behind the car (the player's own), 2×; from 4 s before the way in to 3 s past the hand-back
  await act('replay'); await frames(2);
  await page.evaluate(() => { Render.scene.visible = false; });   // (the pictures not drawn while it plays: a software-drawn frame is slow; everything else is)
  const run = async (from, to) => {
    await page.evaluate((t) => { window.__fr.length = 0; window.__game.rpSeek(t); }, from);
    await page.waitForFunction((t) => { const P = window.__game.replay; return !P || P.t >= t || !P.play; }, to, { timeout: 300000, polling: 100 });
    return page.evaluate(() => window.__fr.slice());
  };
  const modes = (F) => F.map(f => f.mode).filter((m, i, a) => !i || m !== a[i - 1]).join('>');
  const film = (F, lbl) => {
    const rep = F.filter(f => f.st === 'repair'), w = Math.max(0, ...rep.map(f => f.w)), at = rep.filter(f => f.w > 0.95), pre = F.filter(f => f.t < live.ap - 0.1), post = F.filter(f => f.t >= live.back + 0.05);
    const near = at.length && at.every(f => f.d < 16 && f.h < 6), wPre = Math.max(0, ...pre.map(f => f.w)), wPost = Math.max(0, ...post.map(f => f.w));
    return { ok: rep.length > 5 && w > 0.95 && near && wPre === 0 && post.length > 5 && wPost < 0.05 && F.every(f => f.cam === lbl),
      d: { repN: rep.length, w: +w.toFixed(3), dMax: +Math.max(0, ...at.map(f => f.d)).toFixed(1), hMax: +Math.max(-99, ...at.map(f => f.h)).toFixed(1), wPre: +wPre.toFixed(3), postN: post.length, wPost: +wPost.toFixed(3), cams: [...new Set(F.map(f => f.cam))] } };
  };
  await act('rp-speed');   // (2×)
  const F1 = await run(live.ap - 4, live.back + 3), m1 = modes(F1), work1 = F1.filter(f => f.mode === 'work'), lift1 = Math.max(0, ...F1.map(f => f.lift));
  T.check('played back behind the car: the crew goes out, works and clears (at home before and after)', /^home>out>work>clear>home$/.test(m1), m1);
  T.check('the car up on the jacks while they work', lift1 > 0.05, `max lift ${lift1.toFixed(3)} m`);
  const wl = work1.length ? work1[work1.length - 1].t - work1[0].t : 0;
  T.check('the crew works as long as in the race (the repair\'s length)', work1.length > 5 && Math.abs(wl - live.dur) < 0.3, `${wl.toFixed(2)} s in the replay, ${live.dur.toFixed(2)} s in the race`);
  const f1 = film(F1, 'chase');
  T.check('behind the car: none of the film camera before the lane; it has the view at the box (close to the car and low: within 16 m, under 6 m up); none of it from the hand-back', f1.ok, JSON.stringify(f1.d));

  // the TV cameras: the film camera at the box over them too, the TV camera again from the hand-back
  await act('rp-cam');
  const F2 = await run(live.ap - 4, live.back + 3), f2 = film(F2, 'tv'), m2 = modes(F2);
  T.check('over the TV cameras: the same film at the box (close and low), none of it before the lane and from the hand-back; the crew out, at work, clearing', f2.ok && /^home>out>work>clear>home$/.test(m2), m2 + ' ' + JSON.stringify(f2.d));

  // 4×, behind the car: the crew still goes through it all
  await act('rp-cam'); await act('rp-speed');
  const sp = await page.evaluate(() => window.__game.replay.speed);
  const F3 = await run(live.ap - 4, live.back + 3), m3 = modes(F3), lift3 = Math.max(0, ...F3.map(f => f.lift)), f3 = film(F3, 'chase');
  T.check('at 4×: out, work, clear, the jacks, the film camera at the box', sp === 4 && /^home>out>work>clear>home$/.test(m3) && lift3 > 0.05 && f3.ok, `${sp}× ${m3}, lift ${lift3.toFixed(3)} m ` + JSON.stringify(f3.d));

  // paused, a jump into the middle of the repair: the crew at work at once
  await act('rp-play');
  const crewNow = () => page.evaluate(() => { const c = Render.crew, R = c.roles, P = window.__game.race.player, r2 = (v) => +v.toFixed(3), team = c.men.filter(m => m.role !== 'idle' && m.role !== 'ENG');
    return { mode: c.mode, lift: r2(c.lift), off: r2(Math.max(...team.map(m => Math.hypot(m.x - m.gx, m.z - m.gz)))), home: r2(Math.max(...team.map(m => Math.hypot(m.x - m.hx, m.z - m.hz)))),
      gun: r2(Math.max(...R.G.map(m => Math.hypot(m.x - P.x, m.z - P.z)))), tyres: c.tyres.slice().sort((a, b) => a.i - b.i).map(t => t.mode).join(','), xs: team.map(m => r2(m.x) + ',' + r2(m.z) + ',' + r2(m.O[0])).join(';'), play: window.__game.replay.play }; });
  await page.evaluate((t) => window.__game.rpSeek(t), live.rep + live.dur * 0.5); await frames(3);
  const j1 = await crewNow(); await frames(4); const j2 = await crewNow();
  T.check('paused, a jump to the middle of the repair: the crew at work at once, every man in his place, the old wheels in hand and the new ones on, the car on the jacks',
    !j1.play && j1.mode === 'work' && j1.off < 0.01 && j1.lift > 0.05 && j1.tyres === 'hidden,hidden,hidden,hidden,hands,hands,hands,hands', JSON.stringify(Object.assign({}, j1, { xs: undefined })));
  T.check('nothing moves while it stands', j2.xs === j1.xs && j2.lift === j1.lift && j2.tyres === j1.tyres, j2.xs === j1.xs ? '' : 'moved');

  // Foto there: the crew round the car in the picture, the picture saved
  await page.evaluate(() => { Render.scene.visible = true; window.__game.lastPhoto = null; });
  await act('rp-photo'); await frames(2);
  const ph = await page.evaluate(() => { const g = window.__game, c = Render.crew, P = g.race.player, R = c.roles, cm = Render.camera, f = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cm.projectionMatrix, cm.matrixWorldInverse));
    const inPic = R.G.concat(R.O, R.N).filter(m => f.containsPoint(new THREE.Vector3(m.x, (m.y || 0) + 1, m.z))).length;
    return { screen: g.screen, shot: !!Render.cam.shot, mode: c.mode, lift: +c.lift.toFixed(3), gun: +Math.max(...R.G.map(m => Math.hypot(m.x - P.x, m.z - P.z))).toFixed(2), inPic }; });
  await act('ph-save');
  await page.waitForFunction(() => !!window.__game.lastPhoto, null, { timeout: 120000 }).catch(() => { });
  const pic = await page.evaluate(() => window.__game.lastPhoto);
  T.check('Foto at the stop: the crew at work round the car (the wheel guns by its wheels, the tyre men in the picture), the car on the jacks; the picture saved',
    ph.screen === 'photo' && ph.shot && ph.mode === 'work' && ph.lift > 0.05 && ph.gun < 3.5 && ph.inPic >= 8 && !!pic && pic.w >= 640 && pic.bytes > 1000, JSON.stringify({ ph, pic }));
  await act('ph-exit'); await frames(2);
  await page.evaluate(() => { Render.scene.visible = false; });

  // ⏮: the crew at home at once
  await act('rp-restart'); await frames(3);
  const h1 = await crewNow();
  T.check('⏮: the crew at home at once (everybody at his place in the garage, the new wheels on the floor, no old ones before the stop), the car off the jacks',
    h1.mode === 'home' && h1.home < 0.01 && h1.lift === 0 && h1.tyres === 'floor,floor,floor,floor,hidden,hidden,hidden,hidden', JSON.stringify(Object.assign({}, h1, { xs: undefined })));

  // Končaj: the race's own pit state as it was, the replay's overlay gone, the car's view the same
  await act('rp-exit'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => { const g = window.__game, P = g.race.player; return { screen: g.screen, pitState: P.pitState, inPit: !!P.inPit, pitAP: !!P.pitAP, pitDone: !!P.pitDone, pitT: P.pitT, repairN: P.repairN, rp: 'rpPit' in P, view: Render.viewOf(P) === window.__v0 }; });
  T.check('"Končaj": the results; the race\'s own pit state untouched, the replay\'s overlay gone, the car\'s view not rebuilt',
    after.screen === 'results' && ['pitState', 'inPit', 'pitAP', 'pitDone', 'pitT', 'repairN'].every(k => after[k] === before[k]) && !after.rp && after.view, JSON.stringify({ before, after }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
