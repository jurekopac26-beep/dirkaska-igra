// Bakreni gozd (gozd): a full race on autopilot with one pit stop on lap 2. The car must stop in its box, the crew
// must go out, work (car up on the jacks) and clear, the repair must finish, and all 13 cars must finish the race.
// In the pit lane the player cannot steer (held at full left lock, the gas held: the autopilot keeps to the lane and turns in to the box);
// the box is on the apron in front of the garage (the car stops there nose in), the crew works there and never stands on the lane.
// Then Toronto, its lane on the left: one stop, the car turns in to the left, the crew on the garages' side, nobody on the lane.
// Then Bathurst (the lane on the left, the pit building on the iso camera's side): one stop in the iso camera, which looks down steeper
// during it, so the building's roof does not hide the car.
//   node tests/browser/pits.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pits (gozd, toronto, bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 640, height: 360 });
  await startTrack(page, 'gozd');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  const crews = await page.evaluate(() => { const g = window.__game, r = g.race, Tk = r.track, L = Tk.len, B = Render.world.pitBoxes || [];   // every AI car's box: a crew's box the world built (its crew idles there in the car's colour)
    const at = (d) => B.find(b => !b.mine && Math.abs(((b.s - Tk.startS - d) % L + L * 1.5) % L - L / 2) < 1);
    const ai = r.cars.filter(c => !c.isPlayer), bx = ai.map(c => at(r._boxD(c)));
    return { n: ai.length, found: bx.filter(Boolean).length, uniq: new Set(bx.filter(Boolean)).size, mine: B.filter(b => b.mine).length, all: B.length }; });
  T.check('every AI car\'s box is one of the crews\' boxes in the world (each its own), the player\'s too', crews.found === crews.n && crews.uniq === crews.n && crews.mine === 1, JSON.stringify(crews));
  const states = [], modes = new Set(); let lastSt, maxLift = 0, r, pose = null, minLatWork = 99, maxLat = -99, onLane = 0, maxDev = 0, lockN = 0, ghostN = 0, dmgIn = 0;
  for (let k = 0; k < 900; k++) {
    // 1 s of game time in 20 steps, the renderer (and the pit crew) stepped along without drawing
    r = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, st = []; Render.scene.visible = false;
      const o = { work: 99, max: -99, lane: 0, dev: 0, lock: 0, ghost: 0, dmg: 0, pose: null };
      for (let i = 0; i < 20; i++) {
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair', d0 = P.dmg;   // (in the lane on the way to the box: the wheel held at full left lock, the gas held)
        if (lock) g.sim(0.05, false, -1); else g.sim(0.05, true);
        Render.frame(0.05, 1, P, g.S.camera, {}); const c = Render.crew; st.push([P.pitState, c && c.mode, c ? c.lift : 0]);
        if (lock) { o.lock++; const p = Tk.pitAt(P.q.s); if (p && !p.gap && Tk.boxX(P.q.s, Tk.def.pit[3]) < -25) o.dev = Math.max(o.dev, Math.abs(P.q.d * p.sd - p.o)); }   // (before the turn in: in the middle of the lane)
        if (P.inPit) { if (P.pitG) o.ghost++; if (P.pitState !== 'repair') o.dmg += Math.max(0, P.dmg - d0); }
        if (c && c.mode !== 'home' && c.roles) for (const m of c.men) { if (m.role === 'idle' || m.role === 'ENG') continue; const q = Tk.query(m.x, m.z, P.q.i, {}), p = Tk.pitAt(q.s); if (!p) continue; const d = q.d * p.sd - p.lout;
          if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.05) { if (c.mode === 'work') o.work = Math.min(o.work, d); o.max = Math.max(o.max, d); if (d < 0) o.lane++; } }   // (each man where he was sent: beyond the lane's outer edge)
        if (P.pitState === 'repair') { const p = Tk.pitAt(P.q.s), hd = Math.atan2(P.q.tz, P.q.tx); let a = P.h - hd; a = Math.atan2(Math.sin(a), Math.cos(a)); o.pose = { dLout: +(P.q.d * p.sd - p.lout).toFixed(2), yaw: +(a * p.sd * 57.3).toFixed(1) }; }
      }
      if (P.lap === 2 && !P.repairN && !P.inPit) P.pitWant = true;
      if (P.repairN && !P.inPit) P.pitWant = false;
      Render.scene.visible = true;
      return { phase: g.phase, fin: !!P.finished, t: g.race.time, repairN: P.repairN || 0, st, o, finished: g.race.cars.filter(c => c.finished).length, n: g.race.cars.length };
    });
    for (const [s, m, l] of r.st) { if (s !== lastSt) { states.push(`${r.t.toFixed(1)} s ${s}`); lastSt = s; } if (m) modes.add(m); maxLift = Math.max(maxLift, l); }
    const o = r.o; if (o.pose) pose = o.pose; minLatWork = Math.min(minLatWork, o.work); maxLat = Math.max(maxLat, o.max); onLane += o.lane; maxDev = Math.max(maxDev, o.dev); lockN += o.lock; ghostN += o.ghost; dmgIn += o.dmg;
    if (r.fin && r.finished === r.n) break;
    if (r.phase === 'done' && k > 5) break;
  }
  const seq = states.map(s => s.split(' ').pop()).join('>');
  T.check('pit stop: stop > repair > done', /stop>repair>done/.test(seq), states.join(' > '));
  T.check('the crew goes out, works and clears', ['out', 'work', 'clear'].every(m => modes.has(m)), [...modes].join(','));
  T.check('the car goes up on the jacks', maxLift > 0.05, `max lift ${maxLift.toFixed(3)} m`);
  T.check('no steering in the pit lane: at full left lock the car keeps to the middle of the lane', lockN > 40 && maxDev < 0.8, `${lockN} steps at full lock, at most ${maxDev.toFixed(2)} m off the lane's centre`);
  T.check('the car stops in its box on the apron, nose in towards the garage', pose && pose.dLout > 2.5 && pose.yaw > 12, JSON.stringify(pose));
  T.check('the crew stands off the lane (on the apron, in front of the garage)', onLane === 0 && minLatWork > 0 && maxLat < 9.2, `at least ${minLatWork.toFixed(2)} m beyond the lane's edge at work, at most ${maxLat.toFixed(2)} m, ${onLane} samples on the lane`);
  T.check('in the pit lane a ghost, no damage', ghostN > 40 && dmgIn === 0, `${ghostN} steps a ghost, damage taken ${dmgIn.toFixed(3)}`);
  T.check('repaired once', r.repairN === 1, `repairs ${r.repairN}`);
  T.check('player finishes, all cars finish', r.fin && r.finished === r.n, `${r.finished}/${r.n} after ${r.t.toFixed(1)} s`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // Toronto: the pit lane on the LEFT of the straight (def.pit's offset negative, every offset measured to that side, sd -1). One stop on
  // the autopilot (the wheel held at full right lock, towards the track): the car turns in to the left, into its box on the apron, the crew
  // round it on the garages' side of the lane, nobody on the lane
  await startTrack(page, 'toronto');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  let t2 = { work: 99, max: -99, lane: 0, lock: 0, dev: 0, pose: null, ghost: 0, dmg: 0, modes: [] }, r2;
  for (let k = 0; k < 400; k++) {
    r2 = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, o = { work: 99, max: -99, lane: 0, lock: 0, dev: 0, pose: null, ghost: 0, dmg: 0, modes: [] }; Render.scene.visible = false;
      for (let i = 0; i < 20; i++) {
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair', d0 = P.dmg;
        if (lock) g.sim(0.05, false, 1); else g.sim(0.05, true);
        Render.frame(0.05, 1, P, g.S.camera, {}); const c = Render.crew; if (c && c.mode && !o.modes.includes(c.mode)) o.modes.push(c.mode);
        if (lock) { o.lock++; const p = Tk.pitAt(P.q.s); if (p && !p.gap && Tk.boxX(P.q.s, Tk.def.pit[3]) < -25) o.dev = Math.max(o.dev, Math.abs(P.q.d * p.sd - p.o)); }
        if (P.inPit) { if (P.pitG) o.ghost++; if (P.pitState !== 'repair') o.dmg += Math.max(0, P.dmg - d0); }
        if (c && c.mode !== 'home' && c.roles) for (const m of c.men) { if (m.role === 'idle' || m.role === 'ENG') continue; const q = Tk.query(m.x, m.z, P.q.i, {}), p = Tk.pitAt(q.s); if (!p) continue; const d = q.d * p.sd - p.lout;
          if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.05) { if (c.mode === 'work') o.work = Math.min(o.work, d); o.max = Math.max(o.max, d); if (d < 0) o.lane++; } }
        if (P.pitState === 'repair') { const p = Tk.pitAt(P.q.s), hd = Math.atan2(P.q.tz, P.q.tx); let a = P.h - hd; a = Math.atan2(Math.sin(a), Math.cos(a)); o.pose = { dLout: +(P.q.d * p.sd - p.lout).toFixed(2), yaw: +(a * p.sd * 57.3).toFixed(1), sd: p.sd }; }
      }
      if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }
      if (P.repairN && !P.inPit) P.pitWant = false;
      Render.scene.visible = true;
      return { o, rep: P.repairN || 0, inPit: P.inPit };
    });
    const o = r2.o; t2.work = Math.min(t2.work, o.work); t2.max = Math.max(t2.max, o.max); t2.lane += o.lane; t2.lock += o.lock; t2.dev = Math.max(t2.dev, o.dev); if (o.pose) t2.pose = o.pose; t2.ghost += o.ghost; t2.dmg += o.dmg;
    for (const m of o.modes) if (!t2.modes.includes(m)) t2.modes.push(m);
    if (r2.rep && !r2.inPit) break;
  }
  T.check('Toronto (the lane on the left): repaired once, the crew went out, worked and cleared', r2.rep === 1 && ['out', 'work', 'clear'].every(m => t2.modes.includes(m)), `repairs ${r2.rep}, crew ${t2.modes.join(',')}`);
  T.check('Toronto: at full right lock the car keeps to the middle of the lane, a ghost, no damage', t2.lock > 40 && t2.dev < 0.8 && t2.ghost > 40 && t2.dmg === 0, `${t2.lock} steps at full lock, at most ${t2.dev.toFixed(2)} m off the lane's centre, ${t2.ghost} steps a ghost, damage ${t2.dmg.toFixed(3)}`);
  T.check('Toronto: the car stops in its box on the apron to the left, nose in towards the garage', t2.pose && t2.pose.sd === -1 && t2.pose.dLout > 2.5 && t2.pose.yaw > 12, JSON.stringify(t2.pose));
  T.check('Toronto: the crew stands off the lane, on the garages\' side', t2.lane === 0 && t2.work > 0 && t2.max < 9.2, `at least ${t2.work.toFixed(2)} m beyond the lane's edge at work, at most ${t2.max.toFixed(2)} m, ${t2.lane} samples on the lane`);
  T.check('no page errors (Toronto)', !errors.length, errors.slice(0, 5).join(' | '));

  // Bathurst in the iso camera (the phone on its side): the pit building (two floors, the roof over the apron) is on the camera's side of
  // the lane (south), so in the usual view (47°) its roof would hide the car in its box; during the stop the camera looks down steeper and
  // nothing of the world stands between it and the car
  await startTrack(page, 'bathurst');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  let r3 = null;
  for (let k = 0; k < 500 && !(r3 && r3.rep && !r3.inPit); k++) {
    r3 = await page.evaluate((prev) => {
      const g = window.__game, P = g.race.player, Tk = g.race.track; let v = prev; Render.scene.visible = false;
      for (let i = 0; i < 20; i++) {
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair';
        if (lock) g.sim(0.05, false, 1); else g.sim(0.05, true);
        Render.frame(0.05, 1, P, 'iso', {});
        if (P.pitState === 'repair') {   // rays from the camera to the car (its middle and both ends, at the roof's height), against the world's meshes
          const C = Render.camera, rc = new THREE.Raycaster(), y = (P.y || 0) + 1, f = [Math.cos(P.h), Math.sin(P.h)], meshes = [];
          Render.world.root.traverseVisible(o => { if (o.isMesh) meshes.push(o); });
          const seen = (from) => [0, 1.9, -1.9].filter(a => { const pt = new THREE.Vector3(P.x + f[0] * a, y, P.z + f[1] * a), d = pt.clone().sub(from), L = d.length();
            rc.set(from, d.normalize()); rc.far = L - 0.3; return !rc.intersectObjects(meshes, false).length; }).length;
          const p = Tk.pitAt(P.q.s), D = C.position.distanceTo(new THREE.Vector3(P.x, y, P.z)), flat = new THREE.Vector3(P.x, y + D * Math.sin(0.82), P.z + D * Math.cos(0.82));
          v = { pt: +Render.cam.pt.toFixed(3), pitch: +(Math.atan2(C.position.y - y, Math.hypot(C.position.x - P.x, C.position.z - P.z)) * 57.3).toFixed(1), seen: seen(C.position.clone()), flat: seen(flat), out: +(P.q.d * p.sd - p.lout).toFixed(2), sd: p.sd };
        }
      }
      if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }
      if (P.repairN && !P.inPit) P.pitWant = false;
      Render.scene.visible = true;
      return { v, rep: P.repairN || 0, inPit: P.inPit };
    }, r3 && r3.v);
  }
  const v3 = r3 && r3.v;
  T.check('Bathurst (the lane on the left): repaired, the car stopped in its box on the apron to the left', r3 && r3.rep === 1 && v3 && v3.sd === -1 && v3.out > 2.5, JSON.stringify(v3));
  T.check('Bathurst in the iso camera: during the stop it looks down steeper (the garages on its side) and sees the whole car past the pit building\'s roof, which the usual 47° view would hide it behind', v3 && v3.pitch > 70 && v3.seen === 3 && v3.flat < 3, v3 ? `${v3.pitch}° (the usual 47°), ${v3.seen}/3 points of the car seen; at 47° ${v3.flat}/3` : 'no stop');
  T.check('no page errors (Bathurst)', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
