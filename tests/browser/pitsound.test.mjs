// The pit stop's sounds (Sfx pitStep, the sound on). Offline (Sfx.probe renders each one in an OfflineAudioContext): finite, not
// clipping (the four wheel guns together too), heard; a wheel gun's hammer rattling ~24 times a second while it works and not while
// the nut spins free, the release whistle near 3 kHz, the car's thud low, the jacks' hiss high, the limiter chopped ~12 times a second.
// Then a race with fuel at Newcastle, the player's stop on the autopilot, the renderer (the crew) and the sound stepped along with the
// race: the limiter while the autopilot drives in the lane at the limit (not on the track, not in the
// box, not once the player drives again, not with the race's sounds off), the fuel hose from the stop's start till the tank is full,
// each wheel's gun on its nut twice (off, then on: eight bursts), each jack up and down with the car's thud as that end lands (as the
// crew draws it: crew.liftF / liftR), one whistle at the release, in that order and only during the stop. A second stop with the sound off (Nastavitve · Zvok): none of it.
//   node tests/browser/pitsound.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop sounds (offline, Newcastle)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', sound: 1, fuel: 1, length: 'normal' }, { width: 640, height: 360 });

  // 1. offline: each sound at its level by the car
  const O = await page.evaluate(async () => {
    const SR = 44100, out = {};
    const gz = (d, f, sr) => { let s1 = 0, s2 = 0; const w = 2 * Math.cos(2 * Math.PI * f / sr); for (let i = 0; i < d.length; i++) { const s0 = d[i] + w * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - w * s1 * s2)) / d.length; };   // (Goertzel: the amplitude at f)
    const rate = (d, a, b) => {   // the loudness's beat between a and b (s): the strongest rate in 8-40 Hz and its depth (its swing over the mean)
      const B = 44, env = []; for (let i = Math.round(a * SR); i + B < Math.round(b * SR); i += B) { let m = 0; for (let j = i; j < i + B; j++) m += d[j] * d[j]; env.push(Math.sqrt(m / B)); }
      const mean = env.reduce((x, y) => x + y, 0) / env.length, e2 = env.map(v => v - mean); let bf = 0, bv = 0;
      for (let f = 8; f <= 40; f += 0.5) { const v = gz(e2, f, 1000); if (v > bv) { bv = v; bf = f; } }
      return { hz: bf, depth: +(2 * bv / mean).toFixed(2) };
    };
    const low = (d) => { const lo = [60, 90, 120].reduce((s, f) => s + gz(d, f, SR), 0), hi = [1000, 2000, 3000, 5000].reduce((s, f) => s + gz(d, f, SR), 0); return +(lo / (lo + hi)).toFixed(2); };   // (the share of a few low lines over a few high ones)
    for (const k of ['gunOff', 'gunOn', 'guns', 'jackUp', 'jackDown', 'drop', 'release', 'hose', 'limiter']) {
      const d = await Sfx.probe({ pit: k, dur: 0.8, sr: SR }); if (!d) { out[k] = null; continue; }
      let pk = 0, ss = 0, fin = true, loud = 0; for (let i = 0; i < d.length; i++) { if (!Number.isFinite(d[i])) fin = false; pk = Math.max(pk, Math.abs(d[i])); ss += d[i] * d[i]; }
      for (let i = 0; i + 2205 < d.length; i += 441) { let s = 0; for (let j = i; j < i + 2205; j++) s += d[j] * d[j]; loud = Math.max(loud, Math.sqrt(s / 2205)); }   // (the loudest 50 ms)
      const o = { fin, pk: +pk.toFixed(3), loud: +loud.toFixed(4), low: low(d) };
      if (k === 'gunOff') { o.hammer = rate(d, 0.03, 0.21); o.free = rate(d, 0.24, 0.36); }   // (off: the hammer first, then the nut spins free)
      if (k === 'gunOn') { o.free = rate(d, 0.03, 0.15); o.hammer = rate(d, 0.17, 0.42); }   // (on: it spins down the thread first, the hammer tightens it)
      if (k === 'release') { let bf = 0, bv = 0; for (let f = 1000; f <= 6000; f += 25) { const v = gz(d.subarray(Math.round(0.05 * SR), Math.round(0.4 * SR)), f, SR); if (v > bv) { bv = v; bf = f; } } o.f = bf; o.trill = rate(d, 0.06, 0.44); }
      if (k === 'limiter') o.chop = rate(d, 0.1, 0.8);
      out[k] = o;
    }
    return out;
  });
  const bad = Object.entries(O).filter(([k, o]) => !o || !o.fin || o.pk >= 1 || o.loud < 0.02);
  T.check('every pit sound offline: finite, not clipping (the four guns together too), heard', !bad.length, JSON.stringify(Object.fromEntries(Object.entries(O).map(([k, o]) => [k, o && [o.pk, o.loud]]))));
  const G0 = O.gunOff, G1 = O.gunOn;
  T.check('a wheel gun: the hammer rattles ~24 times a second while it works (off: first, on: last), not while the nut spins free; high, not low',
    G0 && G1 && Math.abs(G0.hammer.hz - 24) <= 2 && G0.hammer.depth > 0.5 && G0.free.depth < 0.3 && Math.abs(G1.hammer.hz - 24) <= 2 && G1.hammer.depth > 0.5 && G1.free.depth < 0.3 && G0.low < 0.2 && G1.low < 0.2,
    JSON.stringify({ off: G0, on: G1 }));
  T.check('the car\'s thud and the jacks: the thud low (the drop), the hiss and the clunk higher (a jack going up)', O.drop && O.drop.low > 0.8 && O.jackDown.low > 0.6 && O.jackUp.low < 0.8, JSON.stringify({ drop: O.drop, jackUp: O.jackUp, jackDown: O.jackDown }));
  T.check('the release: a whistle near 3 kHz, trilled ~31 times a second', O.release && O.release.f > 2600 && O.release.f < 3300 && Math.abs(O.release.trill.hz - 31) <= 2, JSON.stringify(O.release));
  T.check('the limiter: a low buzz chopped ~12 times a second; the fuel hose: a low rush', O.limiter && Math.abs(O.limiter.chop.hz - 12.5) <= 1.5 && O.limiter.chop.depth > 0.5 && O.hose && O.hose.low > 0.3, JSON.stringify({ limiter: O.limiter, hose: O.hose }));

  // 2. the race (fuel on): to the pits at the end of the first lap, on the autopilot
  await startTrack(page, 'newcastle');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; Sfx.resume(); });
  const ready = await page.evaluate(() => Sfx.ready);
  if (!ready) T.check('sound running in this browser (skipped: no audio here)', true, 'AudioContext not running');
  else {
    // one stop: coarse steps on the track, then (on the way to the pits, in the lane, until back on the circuit) 0.05 s steps, each with a
    // frame drawn (the crew's work, the film camera) and a frame of the sound (as the game's loop does: Sfx.update after the steps)
    const stop = (sound) => page.evaluate(async (sound) => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, L0 = Sfx.levels().pit, n0 = { log: L0.log.length };
      for (const k of ['gun', 'jackUp', 'jackDown', 'drop', 'release', 'hoseOn', 'hoseOff']) n0[k] = L0[k];
      g.S.sound = sound ? 1 : 0; Sfx.setEnabled(sound); Sfx.setRunning(true);
      const s = { lane: [], laneSlow: 0, repair: [], track: [], after: [], hose: [], hoseAfter: [], fuel0: null, pitDur: 0, rep0: P.repairN || 0, paused: null, cam: [], lift: [0, 0], vh: false, vl: false, off: null };
      let near = false, done = false, t = 0;
      for (let k = 0; k < 6000 && !done; k++) {
        const pz = Tk.pitAt(P.q.s);
        if (!P.inPit && !P.pitAP && (P.repairN || 0) === s.rep0) { if (!pz && !P.pitG) { P.pitWant = true; } }   // (to the pits this lap)
        near = !!(pz || P.inPit || P.pitG);
        if (!near && (P.repairN || 0) === s.rep0) { g.sim(0.5, true); Render.scene.visible = false; Render.frame(0.1, 1, P, 'chase', {}); Sfx.update(g.race, P, null, 0); const L = Sfx.levels().pit; s.track.push(L.lim); continue; }
        if (!near) { done = true; break; }
        if (P.pitState === 'repair' && s.fuel0 == null) { s.fuel0 = P.fuel; s.pitDur = P.pitDur; }
        g.sim(0.05, true); t += 0.05; Render.scene.visible = false; Render.frame(0.05, 1, P, 'chase', {}); Sfx.update(g.race, P, null, 0);
        const L = Sfx.levels().pit, row = [+L.lim.toFixed(4), +(P.speed * 3.6).toFixed(1), P.pitState || '-'];
        if (P.pitAP && P.inPit && P.pitState !== 'repair' && P.speed > 0.95 * 22.2) s.lane.push(row);
        else if (P.pitAP && P.inPit && P.pitState !== 'repair' && P.speed < 8) s.laneSlow = Math.max(s.laneSlow, L.lim);
        if (P.pitState === 'repair') { s.repair.push(L.lim); s.hose.push([+(P.pitT).toFixed(2), +L.hose.toFixed(3)]); if (L.voices[0]) s.vh = true; }
        if (P.pitAP && P.inPit && P.pitState !== 'repair' && P.speed > 0.95 * 22.2 && L.voices[1]) s.vl = true;
        if (P.pitState === 'done') s.hoseAfter.push(L.hose);
        if (!P.pitAP && (P.repairN || 0) > s.rep0) s.after.push(L.lim);
        if (P.pitState === 'repair' && sound) { const c = Render.camera.position; s.cam.push(+Math.hypot(c.x - P.x, c.z - P.z).toFixed(1)); }
        { const C = Render.crew; if (C && C.mode === 'work') { s.lift[0] = Math.max(s.lift[0], C.liftF); s.lift[1] = Math.max(s.lift[1], C.liftR); } }   // (how far the crew lifted each end: what the jacks' sounds follow)
        if (P.pitAP && P.inPit && P.pitDone && s.paused == null && P.speed > 0.95 * 22.2) {   // (paused, as the game does when the page is hidden: the race's sounds off)
          Sfx.setRunning(false); Sfx.update(g.race, P, null, 0); s.paused = Sfx.levels().pit.lim; Sfx.setRunning(true);
          const vb = Sfx.levels().pit.voices; Sfx.setEnabled(false); const va = Sfx.levels().pit.voices; Sfx.setEnabled(sound); s.off = { before: vb, after: va }; }   // (the sound switched off: the loops' oscillators stopped, not left running muted)
      }
      P.pitWant = false; Render.scene.visible = true;
      const L1 = Sfx.levels().pit, d = {}; for (const k of Object.keys(n0)) if (k !== 'log') d[k] = L1[k] - n0[k];
      return { s, d, log: L1.log.slice(n0.log), rep: (P.repairN || 0) - s.rep0, fuelRate: g.race.fuelRate, ev: !!P.m.ev, t: +t.toFixed(1) };
    }, sound);
    const A = await stop(true);
    const s = A.s, log = A.log, idx = (f) => log.map((e, i) => f(e) ? i : -1).filter(i => i >= 0);
    T.check('a race with fuel: the player stopped once in the pits (the stop\'s fill time from its fuel)', A.rep === 1 && A.fuelRate > 0 && !A.ev && s.fuel0 != null && s.fuel0 < 1, JSON.stringify({ rep: A.rep, fuelRate: A.fuelRate, fuel0: s.fuel0, pitDur: s.pitDur, t: A.t }));
    T.check('the limiter hums while the autopilot drives in the lane at the limit; not on the track, not slow into the box, not in the box, not once the player drives, not paused',
      s.lane.length > 10 && s.lane.every(r => r[0] > 0.03) && s.track.every(v => v === 0) && s.laneSlow < 0.01 && s.repair.every(v => v === 0) && s.after.length > 0 && s.after.every(v => v === 0) && s.paused === 0,
      JSON.stringify({ lane: s.lane.slice(0, 4), laneN: s.lane.length, slow: s.laneSlow, track: Math.max(0, ...s.track), box: Math.max(0, ...s.repair), after: Math.max(0, ...s.after), paused: s.paused }));
    const fT = Math.min(s.pitDur, 1.6 + (1 - s.fuel0) * 9) - 0.35, hoseIn = s.hose.filter(([t]) => t > 0.15 && t < fT - 0.1), hoseOut = s.hose.filter(([t]) => t > fT + 0.1);
    T.check('the fuel hose: on at the stop\'s start (its clunk), the fuel heard till the tank is full, off (its clunk); quiet after the stop',
      A.d.hoseOn === 1 && A.d.hoseOff === 1 && hoseIn.length > 5 && hoseIn.every(([, v]) => v > 0.05) && hoseOut.every(([, v]) => v === 0) && s.hoseAfter.every(v => v === 0),
      JSON.stringify({ on: A.d.hoseOn, off: A.d.hoseOff, fill: +fT.toFixed(2), pitDur: s.pitDur, hose: s.hose.filter((h, i) => i % 6 === 0) }));
    // the loops' oscillators: made at their first use, stopped when the sound is switched off and after 1.5 s of silence (not left running muted
    // for the rest of the session); the next stop makes them again (the stop with the sound off below: nothing, as it has no use for them)
    await page.evaluate(() => { const g = window.__game; Sfx.update(g.race, g.race.player, null, 0); });
    await page.waitForTimeout(1900);
    const VZ = await page.evaluate(() => { const g = window.__game; Sfx.update(g.race, g.race.player, null, 0); return Sfx.levels().pit.voices; });
    T.check('the hose\'s and the limiter\'s loops run while in use, are stopped with the sound switched off and after 1.5 s of silence',
      s.vh && s.vl && s.off && s.off.before[1] === true && s.off.after.every(v => v === false) && VZ.every(v => v === false), JSON.stringify({ hose: s.vh, lim: s.vl, off: s.off, later: VZ }));
    const offs = log.filter(e => e[0] === 'gunOff'), ons = log.filter(e => e[0] === 'gunOn'), wheels = (L) => L.map(e => e[1]).sort().join('');
    T.check('the wheel guns: each wheel\'s nut off, then on (eight bursts), all in the stop (off in its first quarter, on round its middle)',
      A.d.gun === 8 && offs.length === 4 && ons.length === 4 && wheels(offs) === '0123' && wheels(ons) === '0123' && Math.max(...idx(e => e[0] === 'gunOff')) < Math.min(...idx(e => e[0] === 'gunOn')) &&
      offs.every(e => e[2] === 'repair' && e[3] < 0.3) && ons.every(e => e[2] === 'repair' && e[3] > 0.4 && e[3] < 0.7), JSON.stringify(log.filter(e => /^gun/.test(e[0]))));
    const ups = log.filter(e => e[0] === 'jackUp'), downs = log.filter(e => e[0] === 'jackDown'), drops = log.filter(e => e[0] === 'drop');
    T.check('the jacks: each end of the car up (before the new nuts go on) and down at the end of the stop, with the car\'s thud as it lands (both ends lifted by the crew)',
      s.lift.every(l => l > 0.05) && A.d.jackUp === 2 && A.d.jackDown === 2 && A.d.drop === 2 && wheels(ups) === '01' && wheels(downs) === '01' && wheels(drops) === '01' && ups.every(e => e[3] < 0.45) && downs.every(e => e[3] > 0.8 || e[2] === 'done') &&
      Math.max(...idx(e => e[0] === 'jackUp')) < Math.min(...idx(e => e[0] === 'gunOn')) && Math.min(...idx(e => e[0] === 'jackDown')) > Math.max(...idx(e => e[0] === 'gunOn')), JSON.stringify({ lift: s.lift.map(l => +l.toFixed(3)), log: log.filter(e => /^(jack|drop)/.test(e[0])) }));
    const rel = log.filter(e => e[0] === 'release');
    T.check('the release: one whistle as the stop is done, after everything else', A.d.release === 1 && rel.length === 1 && rel[0][2] === 'done' && log.findIndex(e => e[0] === 'release') > Math.max(...idx(e => e[0] !== 'release' && e[0] !== 'hoseOff')),
      JSON.stringify(log.map(e => e[0] + e[1])));
    T.check('the film camera near the car during the stop (the sounds by where they are to it: nearer, louder)', s.cam.length > 5 && Math.max(...s.cam) < 20, JSON.stringify({ cam: [Math.min(...s.cam), Math.max(...s.cam)] }));
    // 3. a second stop with the sound off: nothing of it played, the loops silent
    const B = await stop(false);
    T.check('a second stop with the sound off: no gun, jack, thud, whistle or hose played, the limiter and the hose silent', B.rep === 1 && Object.values(B.d).every(v => v === 0) && B.s.lane.length > 10 && B.s.lane.every(r => r[0] === 0) && B.s.hose.every(([, v]) => v === 0),
      JSON.stringify({ rep: B.rep, d: B.d, lane: B.s.lane.length }));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
