// The phone's vibration in the pits (Core.HAPTIC's patterns, Input.buzz; navigator.vibrate replaced before the game loads: each call
// logged with the race's time). Bathurst, the player's stop on the autopilot (damaged on the first lap: in at its end; a metre before the
// pit wall's line the car at 100 km/h, as a player who comes in fast: the autopilot itself takes the way in at 54 km/h), the renderer (the
// crew) stepped along with the race every 0.05 s: the autopilot's pattern at the line and the limiter's after it (the car came in faster
// than the lane's 80 km/h), braking into the box, the stop's thud, the front jack, the four guns undoing the nuts, the rear jack, the new
// wheels, the four guns doing them up with the last torque, the tail and the nose let down, the release, VOZIŠ TI! and back on the
// circuit: each once, in that order (the jacks up as their men get there: before the nuts are done up), each the table's own pattern,
// each at its moment (as the crew draws it), one at a time on the race's clock (none before the one before it has ended, unless it
// matters more); besides them only a rival passing the box and the places lost (from braking into the box till back on the circuit), the
// guns' rattle on a long stop and the old pulses (a knock on the way). Paused while the guns do the nuts up: navigator.vibrate(0) at
// once, nothing waiting, the stop's next moments felt after it. Nastavitve · Vibracija · Izklop: navigator.vibrate(0) at once (one was
// playing), then nothing at all; Vklop again: all of them.
//   node tests/browser/haptics.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop vibrations (Bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const init = () => { window.__vib = []; Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: (p) => { const g = window.__game; window.__vib.push([Array.isArray(p) ? p.slice() : p, g && g.race ? +g.race.time.toFixed(3) : -1]); return true; } }); };
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', vibrate: 1 }, { width: 640, height: 360 }, { init });
  await startTrack(page, 'bathurst');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  // one stop: coarse steps on the track; on the way in, in the lane and until back on the circuit 0.05 s steps, each with a frame drawn
  // (the crew's work); a sample after each: [race time, in the lane, pitState, the autopilot's part, the crew's guns on the nuts]
  const A = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, Tk = g.race.track, V = window.__vib, H0 = Input.haptics;
    const s = { rows: [], v0: V.length, h0: H0.log.length, rep0: P.repairN || 0, pause: null, vIn: null, level: H0.level };
    for (let k = 0; k < 9000; k++) {
      const pz = Tk.pitAt(P.q.s), rep = (P.repairN || 0) > s.rep0;
      if (!P.inPit && !rep && !pz && !P.pitG) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }   // (to the pits this lap, damaged)
      const near = !!(pz || P.inPit || P.pitG);
      if (!near && !rep) { g.sim(0.5, true); continue; }
      if (!near) break;
      const in0 = P.inPit, v0 = P.speed;
      if (!in0 && !rep && !s.fast && pz && pz.gap && P.q.d * pz.sd - pz.wall > -1.2) { const k = 27.8 / Math.max(1, P.speed); P.vx *= k; P.vz *= k; s.fast = true; }   // (100 km/h, a metre before the line)
      g.sim(0.05, true);
      if (!in0 && P.inPit && s.vIn == null) s.vIn = +v0.toFixed(2);   // (its speed just before the line)
      Render.scene.visible = false; Render.frame(0.05, 1, P, 'chase', {}); Render.scene.visible = true;
      const C = Render.crew, gw = C && C.P === P && C.mode === 'work' ? C.gunW | 0 : 0, H = Input.haptics, last = H.log[H.log.length - 1];
      s.rows.push([+g.race.time.toFixed(3), !!P.inPit, P.pitState || '', g.pitAuto.st || '', gw]);
      // paused while the guns do the nuts up (the pattern playing, nothing waiting): the motor off at once, nothing left to play
      if (!s.pause && last && last[0] === 'gunOn' && H.busy && P.pitState === 'repair') {
        const n0 = V.length; g.resume(); g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
        const H1 = Input.haptics; s.pause = { t: +g.race.time.toFixed(3), calls: V.slice(n0), busy: H1.busy, waiting: H1.waiting.slice() };
      }
    }
    P.pitWant = false;
    return { s, vib: V.slice(s.v0), log: Input.haptics.log.slice(s.h0), rep: (P.repairN || 0) - s.rep0, pitDur: P.pitDur, ev: !!P.m.ev, fuel: !!(g.race.fuelRate && P.fuel != null) };
  });
  const HAP = await page.evaluate(() => ({ H: Core.HAPTIC, V: Core.PIT_V }));
  const s = A.s, rows = s.rows, log = A.log, names = log.map(e => e[0]);
  const MAIN = ['pitAP', 'pitLimit', 'pitBox', 'pitStop', 'jackF', 'gunOff', 'jackR', 'wheelsOn', 'gunOn', 'dropR', 'dropF', 'go', 'handBack', 'rejoin'], CHAIN = MAIN.filter(k => !/^jack/.test(k));
  T.check('Bathurst: one stop on the autopilot, in faster than the lane\'s limit (no fuel: the plain release); Vibracija · Vklop: all the patterns', A.rep === 1 && s.vIn > HAP.V + 1 && !A.fuel && s.level === 2, JSON.stringify({ rep: A.rep, vIn: s.vIn, pitDur: A.pitDur, fuel: A.fuel, level: s.level }));
  const main = names.filter(k => MAIN.includes(k)), extra = names.filter(k => !MAIN.includes(k)), ix = (k) => main.indexOf(k);
  T.check('the stop\'s patterns, each once, in order: the autopilot, the limiter, the box, the stop, the guns off, the wheels, the guns on (both jacks up after the stop, before it), the tail and the nose down, the release, VOZIŠ TI!, back on the circuit (besides them only a rival passing, a place lost, the guns\' rattle on a long stop, a knock on the way)',
    MAIN.every(k => main.filter(m => m === k).length === 1) && main.filter(k => CHAIN.includes(k)).join() === CHAIN.join() && ['jackF', 'jackR'].every(k => ix(k) > ix('pitStop') && ix(k) < ix('gunOn')) &&
      extra.every(k => k === 'rivalPass' || k === 'lostPlace' || k === 'rattle' || k === 'pulse'), JSON.stringify({ main, extra }));
  const iN = (k) => names.indexOf(k), within = (k, a, b) => names.every((m, i) => m !== k || (i > iN(a) && i < iN(b)));
  T.check('a rival passing only while the car stands in the box, the places lost only from braking into it till back on the circuit, the rattle only while the guns work',
    within('rivalPass', 'pitStop', 'go') && within('lostPlace', 'pitBox', 'rejoin') && within('rattle', 'gunOff', 'dropR'), JSON.stringify(names.filter(k => !['pulse'].includes(k))));
  // each navigator.vibrate call (but the pause's 0): the table's pattern of the one started then, in the same order
  const calls = A.vib.filter(c => c[0] !== 0), pat = (k) => k === 'pulse' ? null : HAP.H[k].p;
  const same = calls.length === log.length && log.every((e, i) => pat(e[0]) ? JSON.stringify(calls[i][0]) === JSON.stringify(pat(e[0])) : calls[i][0].length === 1);
  T.check('each one navigator.vibrate with the table\'s own pattern', same, JSON.stringify({ calls: calls.length, log: log.length, first: calls.slice(0, 4).map(c => c[0]) }));
  // one at a time on the race's clock: each started once the one before had ended (its length and a short pause), or mattering more
  const len = (e) => e[0] === 'pulse' ? 0 : HAP.H[e[0]].p.reduce((a, b) => a + b, 0) / 1000, pri = (e) => e[0] === 'pulse' ? 3 : HAP.H[e[0]].pri;
  const over = log.filter((e, i) => i && log[i - 1][1] + len(log[i - 1]) + 0.04 > e[1] + 1e-6 && pri(e) <= pri(log[i - 1]));
  T.check('one at a time on the race\'s clock (or one that matters more cutting in)', !over.length, JSON.stringify(over.slice(0, 4)));
  // at its moment: the race's time of each call against the samples (the moment between the sample before and this one; one that waited
  // up to 0.35 s later)
  const tOf = (k) => { const i = names.indexOf(k); return i >= 0 && calls[i] ? calls[i][1] : null; }, at = (f) => { const i = rows.findIndex(f); return i > 0 ? [rows[i - 1][0], rows[i][0]] : null; };
  const W = { enter: at(r => r[1]), rep: at(r => r[2] === 'repair'), done: at(r => r[2] === 'done'), hand: at((r, i) => i && rows[i - 1][3] === 'lane' && !r[3] && r[1]), exit: at((r, i) => i && rows[i - 1][1] && !r[1]),
    off: at(r => r[4]), on: at((r, i) => r[4] && rows.slice(0, i).some((q, j) => q[4] && !rows[j + 1][4])) };
  const inW = (k, w, late = 0.36) => { const t = tOf(k); return w && t != null && t > w[0] - 1e-6 && t <= w[1] + late; };
  const crew = ['jackF', 'gunOff', 'jackR', 'wheelsOn', 'gunOn', 'dropR', 'dropF'].every(k => { const t = tOf(k); return W.rep && W.done && t != null && t > W.rep[0] && t <= W.done[1] + 0.36; });
  T.check('each at its moment: the autopilot and the limiter at the line, the stop\'s thud as the car stops, the guns off and on as the crew draws them on the nuts, the crew\'s work during the stop, the release at its end, VOZIŠ TI! at the hand-back, back on the circuit at the way out',
    inW('pitAP', W.enter, 0) && inW('pitLimit', W.enter) && inW('pitStop', W.rep, 0) && inW('gunOff', W.off) && inW('gunOn', W.on) && crew && inW('go', W.done) && inW('handBack', W.hand, 0) && inW('rejoin', W.exit),
    JSON.stringify({ W, t: Object.fromEntries(MAIN.map(k => [k, tOf(k)])) }));
  const pz = s.pause;
  T.check('paused while the guns do the nuts up: navigator.vibrate(0) at once, nothing playing or waiting; the stop\'s next moments felt after it',
    !!pz && pz.calls.length === 1 && pz.calls[0][0] === 0 && !pz.busy && !pz.waiting.length && names.indexOf('dropR') > names.indexOf('gunOn'), JSON.stringify(pz));
  // Nastavitve · Vibracija · Izklop with a pattern playing, then nothing; Vklop again: all of them
  const set = await page.evaluate(() => {
    const g = window.__game, V = window.__vib, sw = (v) => { g.onAction('to-settings'); document.querySelector(`[data-set="vibrate"] button[data-v="${v}"]`).click(); g.onAction('settings-done'); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; };
    const n0 = V.length; Input.buzz('pitStop'); const n1 = V.length; sw(0); const off = V.slice(n1), lv0 = Input.haptics.level;
    const n2 = V.length; Input.buzz('handBack'); Input.vibrate(90); g.sim(0.5, true); const none = V.length - n2;
    sw(1); const lv1 = Input.haptics.level; g.sim(0.5, true); const n3 = V.length; Input.buzz('handBack'); const on = V.slice(n3);
    return { played: n1 - n0, off, lv0, none, lv1, on, S: g.S.vibrate };
  });
  T.check('Vibracija · Izklop: navigator.vibrate(0) at once (one was playing), then no pattern and no pulse; Vklop: all of them again',
    set.played === 1 && set.off.length === 1 && set.off[0][0] === 0 && set.lv0 === 0 && set.none === 0 && set.lv1 === 2 && set.on.length === 1 && JSON.stringify(set.on[0][0]) === JSON.stringify(HAP.H.handBack.p) && set.S === 1, JSON.stringify(set));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
