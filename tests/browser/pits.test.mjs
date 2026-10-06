// Bakreni gozd (gozd): a full race on autopilot with one pit stop on lap 2. The car must stop in its box, the crew
// must go out, work (car up on the jacks) and clear, the repair must finish, and all 13 cars must finish the race.
// In the pit lane the player cannot steer (held at full left lock, the gas held: the autopilot keeps to the lane and turns in to the box);
// the box is on the apron in front of the garage (the car stops there nose in), the crew works there and never stands on the lane.
//   node tests/browser/pits.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pits (gozd)');
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
        if (lock) { o.lock++; const p = Tk.pitAt(P.q.s); if (p && !p.gap && Tk.boxX(P.q.s, Tk.def.pit[3]) < -25) o.dev = Math.max(o.dev, Math.abs(P.q.d - p.o)); }   // (before the turn in: in the middle of the lane)
        if (P.inPit) { if (P.pitG) o.ghost++; if (P.pitState !== 'repair') o.dmg += Math.max(0, P.dmg - d0); }
        if (c && c.mode !== 'home' && c.roles) for (const m of c.men) { if (m.role === 'idle' || m.role === 'ENG') continue; const q = Tk.query(m.x, m.z, P.q.i, {}), p = Tk.pitAt(q.s); if (!p) continue; const d = q.d - p.lout;
          if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.05) { if (c.mode === 'work') o.work = Math.min(o.work, d); o.max = Math.max(o.max, d); if (d < 0) o.lane++; } }   // (each man where he was sent: beyond the lane's outer edge)
        if (P.pitState === 'repair') { const p = Tk.pitAt(P.q.s), hd = Math.atan2(P.q.tz, P.q.tx); let a = P.h - hd; a = Math.atan2(Math.sin(a), Math.cos(a)); o.pose = { dLout: +(P.q.d - p.lout).toFixed(2), yaw: +(a * 57.3).toFixed(1) }; }
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
} finally {
  await browser.close(); await srv.close();
}
T.done();
