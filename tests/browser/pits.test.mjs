// Bakreni gozd (gozd): a full race on autopilot with one pit stop on lap 2. The car must stop in its box, the crew
// must go out, work (car up on the jacks) and clear, the repair must finish, and all 13 cars must finish the race.
// In the pit lane the player cannot steer (held at full left lock, no gas: the autopilot drives, gas and all, keeps to the lane and takes an S onto the apron to the box);
// the box is on the apron in front of the garage (the car stops there parked straight, parallel to the lane), the crew works there and never stands on the lane.
// While the autopilot drives, the progress bar under the map (its width): Vstop, Boks, Popravilo n %, Izvoz, Prevzameš čez 3, 2, 1, one bar
// from ~0 % at the way in to 100 % at the hand-back, never back; then gone.
// Then Bathurst, its lane on the left: one stop seen from behind the car, the car pulls over to the left onto the apron, the crew on the
// garages' side, nobody on the lane; the camera sees the whole car during the stop (the pit building's roof does not hide it).
//   node tests/browser/pits.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pits (gozd, bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 640, height: 360 });
  await startTrack(page, 'gozd');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  // the big messages (#h-msg) and the toasts, each in its own log (two observers deliver their records in observer order, not in time order)
  await page.evaluate(() => { window.__hm = []; window.__ts = []; const log = (id, a) => new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) { const t = n.textContent; if (t) a.push(t); } }).observe(document.getElementById(id), { childList: true, subtree: true }); log('h-msg', window.__hm); log('toast', window.__ts); });
  const crews = await page.evaluate(() => { const g = window.__game, r = g.race, Tk = r.track, L = Tk.len, B = Render.world.pitBoxes || [];   // every AI car's box: a crew's box the world built (its crew idles there in the car's colour)
    const at = (d) => B.find(b => !b.mine && Math.abs(((b.s - Tk.startS - d) % L + L * 1.5) % L - L / 2) < 1);
    const ai = r.cars.filter(c => !c.isPlayer), bx = ai.map(c => at(r._boxD(c)));
    return { n: ai.length, found: bx.filter(Boolean).length, uniq: new Set(bx.filter(Boolean)).size, mine: B.filter(b => b.mine).length, all: B.length }; });
  T.check('every AI car\'s box is one of the crews\' boxes in the world (each its own), the player\'s too', crews.found === crews.n && crews.uniq === crews.n && crews.mine === 1, JSON.stringify(crews));
  const states = [], modes = new Set(); let lastSt, maxLift = 0, r, pose = null, minLatWork = 99, maxLat = -99, onLane = 0, maxDev = 0, lockN = 0, ghostN = 0, dmgIn = 0;
  let lnN = 0, lthrN = 0, vmax = 0, mN = 0, mSteer = 0, mThr = 0, mBad = 0, mDmg = 0, back = null;
  for (let k = 0; k < 900; k++) {
    // 1 s of game time in 20 steps, the renderer (and the pit crew) stepped along without drawing
    r = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, st = []; Render.scene.visible = false;
      const o = { work: 99, max: -99, lane: 0, dev: 0, lock: 0, ghost: 0, dmg: 0, pose: null, ln: 0, lthr: 0, vmax: 0, mN: 0, mSteer: 0, mThr: 0, mBad: 0, mDmg: 0, back: null };
      // one call of the game's steps with no gas (the wheel at s, the brake b): in the lane the autopilot's own throttle and the limiter; the
      // countdown after the exit (the steps that start and end in 'merge'): the autopilot drives, the wheel ignored; the step that hands back
      // the progress bar (#h-pit) after each call: on, its fill, its label (the labels in order, a fill smaller than the one before, the hand-back)
      const pb = document.getElementById('h-pit'), B = window.__pb || (window.__pb = { n: 0, back: 0, first: null, prev: -1, seq: [], hand: null, after: 0, rect: null, pct: [] });
      const bar = (s0, s1) => { const on = pb.classList.contains('on'), f = parseFloat(pb.querySelector('em').style.width) || 0, l = pb.children[1].textContent;
        if (on) { B.n++; if (B.first == null) B.first = f; if (f < B.prev - 1e-9) B.back++; B.prev = f; const k = l.replace(/^Popravilo \d+ %$/, 'Popravilo %'); if (B.seq[B.seq.length - 1] !== k) B.seq.push(k);
          const m = /^Popravilo (\d+) %$/.exec(l); if (m && +m[1] !== B.pct[B.pct.length - 1]) B.pct.push(+m[1]);
          if (!B.rect && P.pitState === 'repair') { const r = pb.getBoundingClientRect(), M = document.getElementById('h-map').getBoundingClientRect(); B.rect = { l: r.left - M.left, r: r.right - M.right, gap: r.top - M.bottom, title: pb.firstElementChild.textContent }; } }
        if (s0 === 'merge' && !s1) B.hand = { on, f }; else if (B.hand && on) B.after++; };
      const one = (dt, s, b) => { const s0 = g.pitAuto.st, d1 = P.dmg; g.sim(dt, false, s, 0, b || 0); const s1 = g.pitAuto.st; bar(s0, s1);
        if (P.inPit && P.speed > 1 && P.pitState !== 'repair') { o.ln++; if (P.inThr > 0.05) o.lthr++; o.vmax = Math.max(o.vmax, P.speed * 3.6); }
        if (s0 === 'merge' && s1 === 'merge') { o.mN++; if (P.inSteer !== -1) o.mSteer++; if (P.inThr > 0.05) o.mThr++; if (P.pitWant || !P.noReverse || !P.pitAP) o.mBad++; o.mDmg += Math.max(0, P.dmg - d1); }
        if (s0 === 'merge' && !s1) o.back = { steer: P.inSteer, thr: P.inThr, nr: P.noReverse, pw: P.pitWant, ap: P.pitAP, d: Math.abs(P.q.d), w: Tk.wa ? Tk.wa[P.q.i] : Tk.w }; };
      for (let i = 0; i < 20; i++) {
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair', d0 = P.dmg;   // (in the lane on the way to the box: the wheel held at full left lock, no gas: the autopilot drives, gas and all)
        // the brake once in the lane, >70 m before the box: 1.2 s of full brake (the autopilot's throttle off, never into reverse)
        if (!window.__brk && g.pitAuto.st === 'lane' && !P.pitState && Tk.boxX(P.q.s, Tk.def.pit[3]) < -70) { const B = window.__brk = { min: 99, vl: 9, rev: false, thr: false }; for (let j = 0; j < 144; j++) { g.sim(1 / 120, false, -1, 0, 1); B.min = Math.min(B.min, P.speed); B.vl = Math.min(B.vl, P.vl); if (P.gear === -1) B.rev = true; if (P.inThr > 0) B.thr = true; } }
        if (lock) one(0.05, -1); else if (P.inPit || g.pitAuto.st) for (let j = 0; j < 6; j++) one(1 / 120, -1); else { g.sim(0.05, true); bar(null, null); }
        Render.frame(0.05, 1, P, g.S.camera, {}); const c = Render.crew; st.push([P.pitState, c && c.mode, c ? c.lift : 0]);
        if (lock) { o.lock++; const p = Tk.pitAt(P.q.s); if (p && !p.gap && Tk.boxX(P.q.s, Tk.def.pit[3]) < -Core.BAY.inL - 10) o.dev = Math.max(o.dev, Math.abs(P.q.d * p.sd - p.o)); }   // (before the S onto the apron: in the middle of the lane)
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
    lnN += o.ln; lthrN += o.lthr; vmax = Math.max(vmax, o.vmax); mN += o.mN; mSteer += o.mSteer; mThr += o.mThr; mBad += o.mBad; mDmg += o.mDmg; if (o.back) back = o.back;
    if (r.fin && r.finished === r.n) break;
    if (r.phase === 'done' && k > 5) break;
  }
  const seq = states.map(s => s.split(' ').pop()).join('>');
  T.check('pit stop: stop > repair > done', /stop>repair>done/.test(seq), states.join(' > '));
  T.check('the crew goes out, works and clears', ['out', 'work', 'clear'].every(m => modes.has(m)), [...modes].join(','));
  T.check('the car goes up on the jacks', maxLift > 0.05, `max lift ${maxLift.toFixed(3)} m`);
  T.check('no steering in the pit lane: at full left lock the car keeps to the middle of the lane', lockN > 40 && maxDev < 0.8, `${lockN} steps at full lock, at most ${maxDev.toFixed(2)} m off the lane's centre`);
  T.check('the car stops in its box on the apron, parked straight in front of the garage (within 4° of the lane)', pose && pose.dLout > 2.5 && Math.abs(pose.yaw) < 4, JSON.stringify(pose));
  T.check('the crew stands off the lane (on the apron, in front of the garage)', onLane === 0 && minLatWork > 0 && maxLat < 9.2, `at least ${minLatWork.toFixed(2)} m beyond the lane's edge at work, at most ${maxLat.toFixed(2)} m, ${onLane} samples on the lane`);
  T.check('in the pit lane a ghost, no damage', ghostN > 40 && dmgIn === 0, `${ghostN} steps a ghost, damage taken ${dmgIn.toFixed(3)}`);
  T.check('repaired once', r.repairN === 1, `repairs ${r.repairN}`);
  T.check('player finishes, all cars finish', r.fin && r.finished === r.n, `${r.finished}/${r.n} after ${r.t.toFixed(1)} s`);
  T.check('no gas held in the pit lane: the autopilot gives the throttle itself, at most the limiter\'s 80 km/h', lnN > 40 && lthrN > 0.5 * lnN && vmax <= 80.5, `${lthrN}/${lnN} samples on the autopilot's throttle, at most ${vmax.toFixed(1)} km/h`);
  const brk = await page.evaluate(() => window.__brk || null);
  T.check('the brake in the lane stops the car (the autopilot\'s throttle off), never into reverse; let go, it drives on to the box', !!brk && brk.min < 1.5 && brk.vl > -0.1 && !brk.rev && !brk.thr, JSON.stringify(brk));
  T.check('after the exit: the autopilot drives exactly 3 s more (360 steps)', Math.abs(mN - 360) <= 1, `${mN} steps`);
  T.check('during the countdown: the autopilot steers and gives the gas (the wheel held at full left lock ignored), pitWant off, never into reverse, no damage', mBad === 0 && mSteer > mN / 2 && mThr > 0 && mDmg === 0, JSON.stringify({ mN, mSteer, mThr, mBad, mDmg }));
  T.check('then the player\'s wheel and gas, on the asphalt', !!back && back.steer === -1 && back.thr === 0 && !back.nr && !back.pw && !back.ap && back.d < back.w, JSON.stringify(back));
  const ml = await page.evaluate(() => ({ hm: window.__hm.slice(), ts: window.__ts.slice() }));
  { const seq = ['BOKSI · AVTOPILOT', 'VOZIŠ TI!']; let at = -1; const inOrder = seq.every(m => (at = ml.hm.indexOf(m, at + 1)) >= 0);
    T.check('the messages: BOKSI · AVTOPILOT, then VOZIŠ TI! at the hand-back (the countdown in the progress bar, no big PREVZAMEŠ ČEZ, no POPRAVILO); the toast "Sedaj lahko spustiš plin, vse bo naredil sam."; never DRŽI PLIN',
      inOrder && !ml.hm.some(m => /PREVZAMEŠ|POPRAVILO/.test(m)) && ml.ts.includes('Sedaj lahko spustiš plin, vse bo naredil sam.') && !ml.hm.concat(ml.ts).some(m => /DRŽI PLIN/.test(m)), JSON.stringify({ hm: ml.hm.filter(m => /BOKSI|PREVZAMEŠ|POPRAVILO|VOZIŠ|PLIN/.test(m)), ts: ml.ts })); }
  const pbr = await page.evaluate(() => window.__pb);
  T.check('the progress bar under the map (its width), "AVTOPILOT · spusti plin": Vstop, Boks, Popravilo n % (up to 99), Izvoz, Prevzameš čez 3, 2, 1, in that order',
    pbr.seq.join('>') === 'Vstop>Boks>Popravilo %>Izvoz>Prevzameš čez 3>Prevzameš čez 2>Prevzameš čez 1' && pbr.pct.every((v, i) => !i || v > pbr.pct[i - 1]) && pbr.pct[pbr.pct.length - 1] >= 90 &&
      !!pbr.rect && Math.abs(pbr.rect.l) <= 1 && Math.abs(pbr.rect.r) <= 1 && pbr.rect.gap >= 0 && pbr.rect.gap <= 6 && pbr.rect.title === 'AVTOPILOT · spusti plin', JSON.stringify({ seq: pbr.seq, pct: pbr.pct.slice(0, 3).concat(['…'], pbr.pct.slice(-2)), rect: pbr.rect }));
  T.check('the bar fills from ~0 % at the way in, never back, to 100 % at the hand-back; then gone', pbr.n > 200 && pbr.first < 3 && pbr.back === 0 && !!pbr.hand && pbr.hand.f === 100 && !pbr.hand.on && pbr.after === 0,
    JSON.stringify({ n: pbr.n, first: pbr.first, back: pbr.back, hand: pbr.hand, after: pbr.after }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // Bathurst: the pit lane on the LEFT of the straight (def.pit's offset negative, every offset measured to that side, sd -1), the pit
  // building (two floors, the roof over the apron) south of the lane. One stop on the autopilot (the wheel held at full right lock, towards
  // the track), drawn from the camera behind the car: the car turns in to the left, into its box on the apron, the crew round it on the
  // garages' side, nobody on the lane, and nothing of the world stands between the camera and the car. (Toronto's and Montréal's lanes
  // are on the left too: tests/pits.test.js stops on every track with pits; one left-lane world here, each takes long to load)
  await startTrack(page, 'bathurst');
  // in English (as tests/browser/radio.test.mjs switches it), both logs emptied
  await page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.resume(); }, 'en');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; window.__hm.length = 0; window.__ts.length = 0; });
  let t2 = { work: 99, max: -99, lane: 0, lock: 0, dev: 0, pose: null, ghost: 0, dmg: 0, modes: [], v: null }, r2 = null;
  for (let k = 0; k < 500 && !(r2 && r2.rep && !r2.inPit && !r2.st); k++) {
    r2 = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, o = { work: 99, max: -99, lane: 0, lock: 0, dev: 0, pose: null, ghost: 0, dmg: 0, modes: [], v: null }; Render.scene.visible = false;
      for (let i = 0; i < 20; i++) {
        // the button Na progo during the countdown, once: it cancels it, the player's wheel and gas from the next step
        if (!window.__resc && g.pitAuto.st === 'merge' && g.pitAuto.t < 1.5) { document.getElementById('btn-rescue').click(); const R = window.__resc = { st: g.pitAuto.st, ap: P.pitAP, nr: P.noReverse, bar: document.getElementById('h-pit').classList.contains('on') }; g.sim(1 / 120, false, 1, 0); R.steer = P.inSteer; R.thr = P.inThr; }
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair', d0 = P.dmg;   // (no gas)
        if (lock) g.sim(0.05, false, 1, 0); else g.sim(0.05, true);
        { const pb = document.getElementById('h-pit'), L = window.__pbEn || (window.__pbEn = []), l = pb.classList.contains('on') ? pb.children[1].textContent.replace(/^Repair \d+ %$/, 'Repair %') : ''; if (L[L.length - 1] !== l) L.push(l); }   // (the bar's labels in English, '' when gone)
        Render.frame(0.05, 1, P, 'chase', {}); const c = Render.crew; if (c && c.mode && !o.modes.includes(c.mode)) o.modes.push(c.mode);
        if (lock) { o.lock++; const p = Tk.pitAt(P.q.s); if (p && !p.gap && Tk.boxX(P.q.s, Tk.def.pit[3]) < -Core.BAY.inL - 10) o.dev = Math.max(o.dev, Math.abs(P.q.d * p.sd - p.o)); }
        if (P.inPit) { if (P.pitG) o.ghost++; if (P.pitState !== 'repair') o.dmg += Math.max(0, P.dmg - d0); }
        if (c && c.mode !== 'home' && c.roles) for (const m of c.men) { if (m.role === 'idle' || m.role === 'ENG') continue; const q = Tk.query(m.x, m.z, P.q.i, {}), p = Tk.pitAt(q.s); if (!p) continue; const d = q.d * p.sd - p.lout;
          if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.05) { if (c.mode === 'work') o.work = Math.min(o.work, d); o.max = Math.max(o.max, d); if (d < 0) o.lane++; } }
        if (P.pitState === 'repair') {
          const p = Tk.pitAt(P.q.s), hd = Math.atan2(P.q.tz, P.q.tx); let a = P.h - hd; a = Math.atan2(Math.sin(a), Math.cos(a)); o.pose = { dLout: +(P.q.d * p.sd - p.lout).toFixed(2), yaw: +(a * p.sd * 57.3).toFixed(1), sd: p.sd };
          // rays from the camera to the car (its middle and both ends, at the roof's height), against the world's meshes
          const C = Render.camera, rc = new THREE.Raycaster(), y = (P.y || 0) + 1, f = [Math.cos(P.h), Math.sin(P.h)], meshes = [];
          Render.world.root.traverseVisible(m => { if (m.isMesh) meshes.push(m); });
          const seen = (from) => [0, 1.9, -1.9].filter(u => { const pt = new THREE.Vector3(P.x + f[0] * u, y, P.z + f[1] * u), d = pt.clone().sub(from), L = d.length();
            rc.set(from, d.normalize()); rc.far = L - 0.3; return !rc.intersectObjects(meshes, false).length; }).length;
          o.v = { pitch: +(Math.atan2(C.position.y - y, Math.hypot(C.position.x - P.x, C.position.z - P.z)) * 57.3).toFixed(1), seen: seen(C.position.clone()) };
        }
      }
      if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }
      if (P.repairN && !P.inPit) P.pitWant = false;
      Render.scene.visible = true;
      return { o, rep: P.repairN || 0, inPit: P.inPit, st: g.pitAuto.st };
    });
    const o = r2.o; t2.work = Math.min(t2.work, o.work); t2.max = Math.max(t2.max, o.max); t2.lane += o.lane; t2.lock += o.lock; t2.dev = Math.max(t2.dev, o.dev); if (o.pose) t2.pose = o.pose; if (o.v) t2.v = o.v; t2.ghost += o.ghost; t2.dmg += o.dmg;
    for (const m of o.modes) if (!t2.modes.includes(m)) t2.modes.push(m);
  }
  const v2 = t2.v;
  T.check('Bathurst (the lane on the left): repaired once, the crew went out, worked and cleared', r2 && r2.rep === 1 && ['out', 'work', 'clear'].every(m => t2.modes.includes(m)), `repairs ${r2 && r2.rep}, crew ${t2.modes.join(',')}`);
  T.check('Bathurst: at full right lock the car keeps to the middle of the lane, a ghost, no damage', t2.lock > 40 && t2.dev < 0.8 && t2.ghost > 40 && t2.dmg === 0, `${t2.lock} steps at full lock, at most ${t2.dev.toFixed(2)} m off the lane's centre, ${t2.ghost} steps a ghost, damage ${t2.dmg.toFixed(3)}`);
  T.check('Bathurst: the car stops in its box on the apron to the left, parked straight in front of the garage (within 4° of the lane)', t2.pose && t2.pose.sd === -1 && t2.pose.dLout > 2.5 && Math.abs(t2.pose.yaw) < 4, JSON.stringify(t2.pose));
  T.check('Bathurst: the crew stands off the lane, on the garages\' side', t2.lane === 0 && t2.work > 0 && t2.max < 9.2, `at least ${t2.work.toFixed(2)} m beyond the lane's edge at work, at most ${t2.max.toFixed(2)} m, ${t2.lane} samples on the lane`);
  T.check('Bathurst, the camera behind the car: during the stop it sees the whole car (nothing of the pit building between them)', v2 && v2.seen === 3, v2 ? `${v2.pitch}°, ${v2.seen} of 3 points of the car in sight` : 'never in the box');
  const en = await page.evaluate(() => ({ hm: window.__hm.slice(), ts: window.__ts.slice(), resc: window.__resc || null, bar: (window.__pbEn || []).filter(Boolean), last: (window.__pbEn || []).slice(-1)[0] }));
  T.check('Bathurst: the button Na progo during the countdown cancels it, the player\'s wheel and gas at once, the progress bar gone', !!en.resc && en.resc.st === null && !en.resc.ap && !en.resc.nr && !en.resc.bar && en.resc.steer === 1 && en.resc.thr === 0, JSON.stringify(en.resc));
  T.check('Bathurst in English: PITS · AUTOPILOT (no YOU DRIVE!: rescued); the bar: Pit entry, Box, Repair n %, Pit exit, Take over in 3, 2, then gone; the toast in English',
    en.hm.includes('PITS · AUTOPILOT') && !en.hm.includes('YOU DRIVE!') && !en.hm.some(m => /TAKE OVER/.test(m)) && en.bar.join('>') === 'Pit entry>Box>Repair %>Pit exit>Take over in 3>Take over in 2' && en.last === '' && en.ts.includes('You can let go of the gas now, the car does everything by itself.'),
    JSON.stringify({ hm: en.hm.filter(m => /PIT|TAKE OVER|DRIVE/.test(m)), bar: en.bar, last: en.last, ts: en.ts }));
  T.check('no page errors (Bathurst)', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
