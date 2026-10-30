// The player's pit stop in the replay (Bathurst, Avstralija: the race on autopilot, one stop on lap 1, the car a little damaged). The race
// records the player's pit state as it changes (a few entries a stop: in the lane on the autopilot, stop, repair, done, the hand-back, out of
// the lane); "Posnetek" plays the stop back as a short film: the crew goes out, works (the car up on the jacks) and clears as long as in the
// race, the pit stop's film camera takes over from the camera behind the car (close to the car and low at the box, the whole car and the
// crew at their places in the picture) and gives the view back by the hand-back; the same over the TV cameras: from the way in to the hand-back
// it has the view in the whole lane (a TV post ahead of the car would look back at it: the camera never looks at the car against its way, in
// the replay too, on four circuits), gliding, a TV camera again from the hand-back; at 4× the crew still does it all; the phone upright (390 × 844): a wider lens,
// the whole car and the crew in the picture. A jump into the middle of the stop with the replay paused: the crew at work at once (every man
// in his place, the old wheels in their hands, the car on the jacks), nothing moves while it stands, the film camera there at once and kept
// over a tap on the camera button (the same picture), none of it on another car, there again at once back on the player's; Foto there: the crew at work round the car in the picture, the picture saved. ⏮: the crew at home at once (no tyre in anyone's
// hands). "Končaj": the race's own pit state untouched (the replay's overlay gone, the car's view not rebuilt), no page errors.
//   node tests/browser/pitreplay.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop in the replay (bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  // the replay's frames counted and logged (each: the replay's time, its camera, the crew's mode, the film camera's weight, the jacks' lift,
  // the camera's distance from the player's car on the ground and its height over it, the camera and the car, the lens; with the crew at
  // work under the film camera: how many of the car's corners and of the crew at their places (the wheel guns, the new wheels, the jacks)
  // are out of the picture)
  const INSTALL = () => { window.__rf = 0; window.__fr = []; const o = Render.frame; Render.frame = function (dt, a, target, mode, opt) { const r = o.apply(this, arguments); window.__rf++;
    const g = window.__game, P = g.replay, c = Render.crew, pc = g.race && g.race.player, cm = Render.camera;
    if (!(P && opt && opt.rdt != null && c && pc)) return r;
    let fit = null;
    if (c.mode === 'work' && Render.pitCam > 0.95) {
      cm.updateMatrixWorld(); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cm.projectionMatrix, cm.matrixWorldInverse)), v = new THREE.Vector3();
      const D = c.dim, R = c.roles, ch = Math.cos(pc.h), sh = Math.sin(pc.h), y = pc.y || 0, pts = [];
      for (const f of [D.nose, D.tail]) for (const s of [-1, 1]) pts.push([pc.x + ch * f - sh * s * D.wid / 2, y + 0.5, pc.z + sh * f + ch * s * D.wid / 2]);
      for (const m of R.G.concat(R.N, [R.JF, R.JR])) if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.2) pts.push([m.x, (m.y || 0) + 1, m.z]);
      fit = { n: pts.length, out: pts.filter(p => !fr.containsPoint(v.set(p[0], p[1], p[2]))).length };
    }
    window.__fr.push({ t: P.t, cam: P.cam, mode: c.mode, w: Render.pitCam, lift: c.lift, st: pc.rpPit ? pc.rpPit.pitState : 'none', d: Math.hypot(cm.position.x - pc.x, cm.position.z - pc.z), h: cm.position.y - (pc.y || 0),
      p: [cm.position.x, cm.position.y, cm.position.z], x: pc.x, z: pc.z, fov: cm.fov, asp: cm.aspect, fit,
      dir: (() => { const d = new THREE.Vector3(); cm.getWorldDirection(d); return [d.x, d.z]; })(), h: pc.h, ap: !!(pc.rpPit && pc.rpPit.pitAP && pc.rpPit.inPit) });   // (dir, h, ap: where the camera looks, the car's heading, the car in the lane on the autopilot: way in to the hand-back)
    return r; }; };
  await page.evaluate(INSTALL);
  await startTrack(page, 'bathurst');
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const frames = (n) => page.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res(window.__rf - f0) : setTimeout(chk, 20); chk(); }), n);

  // the race to the results, the stop's times as the race has them (way in on the autopilot, the repair and its length, done, the hand-back)
  const LIVE = () => {
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
  };
  const live = await page.evaluate(LIVE);
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
  // the user's rule: the camera never looks back at the car against its way, in the lane from the way in to the hand-back: the horizontal
  // direction it looks (dir) against the car's heading (h), their dot >= 0 in every frame (the TV cameras too: a post ahead of the car looks
  // back at it)
  const facing = (F) => { const L = F.filter(f => f.ap && f.dir), dot = L.map(f => (f.dir[0] * Math.cos(f.h) + f.dir[1] * Math.sin(f.h)) / (Math.hypot(f.dir[0], f.dir[1]) || 1)), bad = L.filter((f, i) => dot[i] < -1e-6);
    return { ok: L.length > 20 && !bad.length, d: { n: L.length, min: L.length ? +Math.min(...dot).toFixed(3) : null, bad: bad.length, first: bad[0] && { t: +bad[0].t.toFixed(2), cam: bad[0].cam, w: +bad[0].w.toFixed(2) } } }; };
  const film = (F, lbl) => {
    const rep = F.filter(f => f.st === 'repair'), w = Math.max(0, ...rep.map(f => f.w)), at = rep.filter(f => f.w > 0.95), pre = F.filter(f => f.t < live.ap - 0.1), post = F.filter(f => f.t >= live.back + 0.05);
    const near = at.length && at.every(f => f.d < 16 && f.h < 6), wPre = Math.max(0, ...pre.map(f => f.w)), wPost = Math.max(0, ...post.map(f => f.w));
    return { ok: rep.length > 5 && w > 0.95 && near && wPre === 0 && post.length > 5 && wPost < 0.05 && F.every(f => f.cam === lbl),
      d: { repN: rep.length, w: +w.toFixed(3), dMax: +Math.max(0, ...at.map(f => f.d)).toFixed(1), hMax: +Math.max(-99, ...at.map(f => f.h)).toFixed(1), wPre: +wPre.toFixed(3), postN: post.length, wPost: +wPost.toFixed(3), cams: [...new Set(F.map(f => f.cam))] } };
  };
  // the crew at work under the film camera: the car's four corners and every man at his place in the picture (with most of them there at times)
  const framed = (F) => {
    const W = F.filter(f => f.fit), bad = W.filter(f => f.fit.out > 0), nMax = Math.max(0, ...W.map(f => f.fit.n));
    return { ok: W.length > 5 && nMax >= 12 && !bad.length, d: { n: W.length, nMax, bad: bad.length, first: bad[0] && { t: +bad[0].t.toFixed(2), out: bad[0].fit.out, of: bad[0].fit.n }, fov: +Math.max(0, ...W.map(f => f.fov)).toFixed(1), asp: W.length ? +W[0].asp.toFixed(3) : 0 } };
  };
  await act('rp-speed');   // (2×)
  const F1 = await run(live.ap - 4, live.back + 3), m1 = modes(F1), work1 = F1.filter(f => f.mode === 'work'), lift1 = Math.max(0, ...F1.map(f => f.lift));
  T.check('played back behind the car: the crew takes up its kit, goes out, works and clears (at home before and after)', /^home>ready>out>work>clear>home$/.test(m1), m1);
  T.check('the car up on the jacks while they work', lift1 > 0.05, `max lift ${lift1.toFixed(3)} m`);
  const wl = work1.length ? work1[work1.length - 1].t - work1[0].t : 0;
  T.check('the crew works as long as in the race (the repair\'s length)', work1.length > 5 && Math.abs(wl - live.dur) < 0.3, `${wl.toFixed(2)} s in the replay, ${live.dur.toFixed(2)} s in the race`);
  const f1 = film(F1, 'chase');
  T.check('behind the car: none of the film camera before the lane; it has the view at the box (close to the car and low: within 16 m, under 6 m up); none of it from the hand-back', f1.ok, JSON.stringify(f1.d));
  const dc1 = facing(F1);
  T.check('behind the car: from the way in to the hand-back the camera never looks back at the car (its direction against the car\'s heading: dot >= 0 in every frame)', dc1.ok, JSON.stringify(dc1.d));
  const fr1 = framed(F1);
  T.check('on its side (640 × 360): the film camera at the box has the whole car and the crew at their places (the wheel guns, the new wheels, the jacks) in the picture', fr1.ok, JSON.stringify(fr1.d));

  // the TV cameras: the film camera at the box over them too, the TV camera again from the hand-back
  await act('rp-cam');
  const F2 = await run(live.ap - 4, live.back + 3), f2 = film(F2, 'tv'), m2 = modes(F2);
  T.check('over the TV cameras: the same film at the box (close and low), none of it before the lane and from the hand-back; the crew ready, out, at work, clearing', f2.ok && /^home>ready>out>work>clear>home$/.test(m2), m2 + ' ' + JSON.stringify(f2.d));
  if (process.env.PR_DUMP) (await import('node:fs')).writeFileSync(process.env.PR_DUMP, JSON.stringify(F2));   // (a tool's: the TV run's frames to a file)
  const dc2 = facing(F2);
  T.check('over the TV cameras: from the way in to the hand-back no camera looks back at the car (the pit stop\'s own camera has the view in the whole lane: dot >= 0 in every frame)', dc2.ok, JSON.stringify(dc2.d));
  // the pit stop's camera has the view in the whole lane over the TV cameras too (the post ahead of the car would look back at it): from the way in
  // to the hand-back it moves against the car (the camera's offset from the car, in m a replay second) as the camera behind the car does, its
  // swing round the car at the box the quickest (~50-65 m/s), never a cut to a TV post (tens of metres in a frame: far over 100 m/s); a TV camera
  // before the way in and from the hand-back (the film's weight 0 there)
  const sp2 = [];
  for (let i = 1; i < F2.length; i++) { const a = F2[i - 1], b = F2[i], dt = b.t - a.t; if (a.ap && b.ap && dt > 0.005) sp2.push(Math.hypot((b.p[0] - b.x) - (a.p[0] - a.x), (b.p[1] - a.p[1]) - 0, (b.p[2] - b.z) - (a.p[2] - a.z)) / dt); }
  T.check('over the TV cameras the film camera has the view in the whole lane, from the way in to the hand-back, moving against the car as the camera behind it does (no cut to a TV post)', sp2.length > 100 && Math.max(...sp2) < 100 && Math.max(0, ...F2.filter(f => !f.ap && f.t < live.ap - 0.1).map(f => f.w)) === 0,
    JSON.stringify({ frames: sp2.length, fastest: sp2.length ? +Math.max(...sp2).toFixed(1) : null }));

  // 4×, behind the car: the crew still goes through it all
  await act('rp-cam'); await act('rp-speed');
  const sp = await page.evaluate(() => window.__game.replay.speed);
  const F3 = await run(live.ap - 4, live.back + 3), m3 = modes(F3), lift3 = Math.max(0, ...F3.map(f => f.lift)), f3 = film(F3, 'chase');
  T.check('at 4×: ready, out, work, clear, the jacks, the film camera at the box', sp === 4 && /^home>ready>out>work>clear>home$/.test(m3) && lift3 > 0.05 && f3.ok, `${sp}× ${m3}, lift ${lift3.toFixed(3)} m ` + JSON.stringify(f3.d));

  // the phone upright (390 × 844), 4×: the film camera's lens wider (as wide across as on its side, at most 80° high), the whole car and the
  // crew at their places in the picture while they work
  await page.setViewportSize({ width: 390, height: 844 }); await frames(3);
  const F4 = await run(live.rep - 1, live.done + 0.3), fr4 = framed(F4);
  T.check('upright (390 × 844): the film camera at the box has a wider lens and the whole car and the crew at their places (the wheel guns, the new wheels, the jacks) in the picture',
    fr4.ok && fr4.d.asp < 0.5 && fr4.d.fov > 75, JSON.stringify(fr4.d));
  await page.setViewportSize({ width: 640, height: 360 }); await frames(3);

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
  // the crew goes by the recorded stop, not by the car's plan as it is now: the stop had new tyres; with the plan 'keep' set on the car after
  // the race (a later stop, no new tyres) the replay still shows the tyre men at work, jumped to the stop from before the way in (the crew
  // at home: the stop's tyres taken up afresh); every recorded entry carries whether the stop was one without new tyres (recPit: keep)
  const kept = await page.evaluate(() => window.__game.rpPit.log.map(e => e.keep));
  await page.evaluate((t) => { window.__game.race.player.pitPlan = { ty: 'keep' }; window.__game.rpSeek(t); }, live.ap - 4); await frames(3);
  await page.evaluate((t) => window.__game.rpSeek(t), live.rep + live.dur * 0.5); await frames(3);
  const j3 = await crewNow(); await page.evaluate(() => { window.__game.race.player.pitPlan = null; });
  T.check('the replay\'s crew goes by the recorded stop (new tyres: the tyre men at work, the old wheels in hand) whatever plan the car has now; every recorded entry says whether the stop kept its tyres',
    kept.length > 3 && kept.every(k => k === false) && j3.mode === 'work' && j3.tyres === j1.tyres && j3.off < 0.01, JSON.stringify({ kept, j3: Object.assign({}, j3, { xs: undefined }) }));
  // the film camera there at once too; while it stands a tap on the camera (TV, then behind the car again) keeps the same picture, another
  // car has none of it, back on the player's it is there again at once
  const camNow = () => page.evaluate(() => { const g = window.__game, cm = Render.camera, P = g.race.player; return { w: +Render.pitCam.toFixed(3), d: +Math.hypot(cm.position.x - P.x, cm.position.z - P.z).toFixed(2), p: [cm.position.x, cm.position.y, cm.position.z], cam: g.replay.cam, k: g.replay.k, play: g.replay.play }; });
  const c0 = await camNow(), sw = [];
  for (const a of ['rp-cam', 'rp-cam', 'rp-next', 'rp-prev']) { await act(a); await frames(3); sw.push(Object.assign({ a }, await camNow())); }
  const same = (o) => Math.hypot(o.p[0] - c0.p[0], o.p[1] - c0.p[1], o.p[2] - c0.p[2]) < 0.1;
  T.check('paused at the box: the film camera has the view at once; the camera button (TV, then behind the car) keeps it, the same picture; another car: none of it; back on the player: the film camera at once',
    c0.w > 0.95 && c0.d < 16 && sw.every(o => !o.play) && sw[0].cam === 'tv' && sw[0].w > 0.95 && same(sw[0]) && sw[1].cam === 'chase' && sw[1].w > 0.95 && same(sw[1]) && sw[2].k !== c0.k && sw[2].w === 0 && sw[3].k === c0.k && sw[3].w > 0.95 && sw[3].d < 16,
    JSON.stringify([c0].concat(sw).map(o => Object.assign({}, o, { p: undefined, moved: +Math.hypot(o.p[0] - c0.p[0], o.p[1] - c0.p[1], o.p[2] - c0.p[2]).toFixed(3) }))));

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

  // the same rule on other circuits with pits (a lane on the left, a shallow apron, a lane that bends): a stop in the race, the replay behind
  // the car and over the TV cameras, from the way in to the hand-back
  for (const id of ['spa', 'montreal', 'toronto']) {
    const { page: pg, errors: er } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
    await pg.evaluate(INSTALL); await startTrack(pg, id);
    const lv = await pg.evaluate(LIVE);
    await pg.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
    const act2 = (a) => pg.evaluate((a) => window.__game.onAction(a), a);
    const run2 = async (from, to) => {
      await pg.evaluate((t) => { window.__fr.length = 0; window.__game.rpSeek(t); }, from);
      await pg.waitForFunction((t) => { const P = window.__game.replay; return !P || P.t >= t || !P.play; }, to, { timeout: 300000, polling: 100 });
      return pg.evaluate(() => window.__fr.slice());
    };
    await act2('replay'); await pg.waitForTimeout(300);
    await pg.evaluate(() => { Render.scene.visible = false; });
    await act2('rp-speed');
    const G1 = await run2(lv.ap - 4, lv.back + 3), d1 = facing(G1);
    await act2('rp-cam');
    const G2 = await run2(lv.ap - 4, lv.back + 3), d2 = facing(G2);
    T.check(`${id}: from the way in to the hand-back the camera never looks back at the car, behind the car (${[...new Set(G1.map(f => f.cam))]}) and over the TV cameras (${[...new Set(G2.map(f => f.cam))]})`,
      lv.repairN === 1 && d1.ok && d2.ok && G1.every(f => f.cam === 'chase') && G2.every(f => f.cam === 'tv'), JSON.stringify({ live: { ap: lv.ap, back: lv.back, n: lv.repairN }, chase: d1.d, tv: d2.d }));
    T.check(`no page errors (${id})`, !er.length, er.slice(0, 5).join(' | ')); await pg.context().close();
  }
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
