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
// playing), then nothing at all; Osnovno: the basic patterns and the old pulses, nothing above them; Vse again: all of them. A second stop
// with Osnovno: only the stop's thud, the release and VOZIŠ TI!, each at its moment (the crew's work, the way in and out not felt). The
// setting as an older build saved it (Izklop / Vklop, 0 / 1): Vklop is Vse now (2, stored so), Izklop stays; Osnovno saved by this build
// stays Osnovno.
//   node tests/browser/haptics.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop vibrations (Bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const init = () => { window.__vib = []; Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: (p) => { const g = window.__game; window.__vib.push([Array.isArray(p) ? p.slice() : p, g && g.race ? +g.race.time.toFixed(3) : -1]); return true; } }); };
  // (vibrate 1 with no vibV: Vklop as an older build saved it; length long: four laps, a stop at the end of the first and of the second)
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', vibrate: 1, length: 'long' }, { width: 640, height: 360 }, { init });
  const mig = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('tdgp-settings')); return { S: window.__game.S.vibrate, lv: Input.haptics.level, stored: [o.vibrate, o.vibV], sel: (document.querySelector('[data-set="vibrate"] .sel') || {}).textContent }; });
  T.check('Vibracija as an older build saved it, Vklop (1): Vse now (2, stored so, the button selected), all the patterns', mig.S === 2 && mig.lv === 2 && mig.stored.join() === '2,2' && mig.sel === 'Vse', JSON.stringify(mig));
  await startTrack(page, 'bathurst');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  // one stop: coarse steps on the track; on the way in, in the lane and until back on the circuit 0.05 s steps, each with a frame drawn
  // (the crew's work); a sample after each: [race time, in the lane, pitState, the autopilot's part, the crew's guns on the nuts]. pauseIt:
  // paused once while the guns do the nuts up. log: what started meanwhile (Input's log keeps the last 80: counted by the queue's plays)
  await page.evaluate(() => { window.__stop = (pauseIt) => {
    const g = window.__game, P = g.race.player, Tk = g.race.track, V = window.__vib, H0 = Input.haptics;
    const s = { rows: [], v0: V.length, p0: H0.n.play, rep0: P.repairN || 0, pause: null, vIn: null, level: H0.level, S: g.S.vibrate };
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
      if (pauseIt && !s.pause && last && last[0] === 'gunOn' && H.busy && P.pitState === 'repair') {
        const n0 = V.length; g.resume(); g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
        const H1 = Input.haptics; s.pause = { t: +g.race.time.toFixed(3), calls: V.slice(n0), busy: H1.busy, waiting: H1.waiting.slice() };
      }
    }
    P.pitWant = false;
    const H = Input.haptics, log = H.log.slice(H.log.length - (H.n.play - s.p0));
    return { s, vib: V.slice(s.v0), log, rep: (P.repairN || 0) - s.rep0, pitDur: P.pitDur, ev: !!P.m.ev, fuel: !!(g.race.fuelRate && P.fuel != null), lap: P.lap, finished: !!P.finished };
  }; });
  const A = await page.evaluate(() => window.__stop(true));
  const HAP = await page.evaluate(() => ({ H: Core.HAPTIC, V: Core.PIT_V }));
  const s = A.s, log = A.log, names = log.map(e => e[0]);
  const MAIN = ['pitAP', 'pitLimit', 'pitBox', 'pitStop', 'jackF', 'gunOff', 'jackR', 'wheelsOn', 'gunOn', 'dropR', 'dropF', 'go', 'handBack', 'rejoin'], CHAIN = MAIN.filter(k => !/^jack/.test(k));
  T.check('Bathurst: one stop on the autopilot, in faster than the lane\'s limit (no fuel: the plain release); Vibracija · Vse: all the patterns', A.rep === 1 && s.vIn > HAP.V + 1 && !A.fuel && s.level === 2 && s.S === 2, JSON.stringify({ rep: A.rep, vIn: s.vIn, pitDur: A.pitDur, fuel: A.fuel, level: s.level }));
  const main = names.filter(k => MAIN.includes(k)), extra = names.filter(k => !MAIN.includes(k)), ix = (k) => main.indexOf(k);
  T.check('the stop\'s patterns, each once, in order: the autopilot, the limiter, the box, the stop, the guns off, the wheels, the guns on (both jacks up after the stop, before it), the tail and the nose down, the release, VOZIŠ TI!, back on the circuit (besides them only a rival passing, a place lost, the guns\' rattle on a long stop, a knock on the way)',
    MAIN.every(k => main.filter(m => m === k).length === 1) && main.filter(k => CHAIN.includes(k)).join() === CHAIN.join() && ['jackF', 'jackR'].every(k => ix(k) > ix('pitStop') && ix(k) < ix('gunOn')) &&
      extra.every(k => k === 'rivalPass' || k === 'lostPlace' || k === 'rattle' || k === 'pulse'), JSON.stringify({ main, extra }));
  const iN = (k) => names.indexOf(k), within = (k, a, b) => names.every((m, i) => m !== k || (i > iN(a) && i < iN(b)));
  T.check('a rival passing only while the car stands in the box, the places lost only from braking into it till back on the circuit, the rattle only while the guns work',
    within('rivalPass', 'pitStop', 'go') && within('lostPlace', 'pitBox', 'rejoin') && within('rattle', 'gunOff', 'dropR'), JSON.stringify(names.filter(k => !['pulse'].includes(k))));
  // each navigator.vibrate call (but the pause's 0): the table's pattern of the one started then, in the same order; at its moment: the
  // race's time of each call against the samples (the moment between the sample before and this one; one that waited up to 0.35 s later)
  const look = (A) => {
    const rows = A.s.rows, log = A.log, names = log.map(e => e[0]), calls = A.vib.filter(c => c[0] !== 0), pat = (k) => k === 'pulse' ? null : HAP.H[k].p;
    const same = calls.length === log.length && log.every((e, i) => pat(e[0]) ? JSON.stringify(calls[i][0]) === JSON.stringify(pat(e[0])) : calls[i][0].length === 1);
    const tOf = (k) => { const i = names.indexOf(k); return i >= 0 && calls[i] ? calls[i][1] : null; }, at = (f) => { const i = rows.findIndex(f); return i > 0 ? [rows[i - 1][0], rows[i][0]] : null; };
    const W = { enter: at(r => r[1]), rep: at(r => r[2] === 'repair'), done: at(r => r[2] === 'done'), hand: at((r, i) => i && rows[i - 1][3] === 'lane' && !r[3] && r[1]), exit: at((r, i) => i && rows[i - 1][1] && !r[1]),
      off: at(r => r[4]), on: at((r, i) => r[4] && rows.slice(0, i).some((q, j) => q[4] && !rows[j + 1][4])) };
    const inW = (k, w, late = 0.36) => { const t = tOf(k); return w && t != null && t > w[0] - 1e-6 && t <= w[1] + late; };
    return { calls, same, tOf, W, inW };
  };
  const L = look(A), { tOf, W, inW } = L;
  T.check('each one navigator.vibrate with the table\'s own pattern', L.same, JSON.stringify({ calls: L.calls.length, log: log.length, first: L.calls.slice(0, 4).map(c => c[0]) }));
  // one at a time on the race's clock: each started once the one before had ended (its length and a short pause), or mattering more
  const len = (e) => e[0] === 'pulse' ? 0 : HAP.H[e[0]].p.reduce((a, b) => a + b, 0) / 1000, pri = (e) => e[0] === 'pulse' ? 3 : HAP.H[e[0]].pri;
  const over = log.filter((e, i) => i && log[i - 1][1] + len(log[i - 1]) + 0.04 > e[1] + 1e-6 && pri(e) <= pri(log[i - 1]));
  T.check('one at a time on the race\'s clock (or one that matters more cutting in)', !over.length, JSON.stringify(over.slice(0, 4)));
  const crew = ['jackF', 'gunOff', 'jackR', 'wheelsOn', 'gunOn', 'dropR', 'dropF'].every(k => { const t = tOf(k); return W.rep && W.done && t != null && t > W.rep[0] && t <= W.done[1] + 0.36; });
  T.check('each at its moment: the autopilot and the limiter at the line, the stop\'s thud as the car stops, the guns off and on as the crew draws them on the nuts, the crew\'s work during the stop, the release at its end, VOZIŠ TI! at the hand-back, back on the circuit at the way out',
    inW('pitAP', W.enter, 0) && inW('pitLimit', W.enter) && inW('pitStop', W.rep, 0) && inW('gunOff', W.off) && inW('gunOn', W.on) && crew && inW('go', W.done) && inW('handBack', W.hand, 0) && inW('rejoin', W.exit),
    JSON.stringify({ W, t: Object.fromEntries(MAIN.map(k => [k, tOf(k)])) }));
  const pz = s.pause;
  T.check('paused while the guns do the nuts up: navigator.vibrate(0) at once, nothing playing or waiting; the stop\'s next moments felt after it',
    !!pz && pz.calls.length === 1 && pz.calls[0][0] === 0 && !pz.busy && !pz.waiting.length && names.indexOf('dropR') > names.indexOf('gunOn'), JSON.stringify(pz));
  // Nastavitve · Vibracija · Izklop with a pattern playing, then nothing; Osnovno: the basic patterns and the old pulses, none above them;
  // Vse again: all of them. Each asked for half a second of the race after the one before (ended); what navigator.vibrate got meanwhile
  const set = await page.evaluate(() => {
    const g = window.__game, V = window.__vib, sw = (v) => { g.onAction('to-settings'); document.querySelector(`[data-set="vibrate"] button[data-v="${v}"]`).click(); g.onAction('settings-done'); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; };
    const got = (f) => { const n = V.length; f(); g.sim(0.5, true); return V.slice(n).map(c => c[0]); }, lv = () => [Input.haptics.level, g.S.vibrate, JSON.parse(localStorage.getItem('tdgp-settings')).vibrate];
    const n0 = V.length; Input.buzz('pitStop'); const n1 = V.length; sw(0); const off = V.slice(n1), lv0 = lv();
    const none = got(() => { Input.buzz('handBack'); Input.vibrate(90); });
    sw(1); const lv1 = lv(); g.sim(0.5, true);
    const basic = { handBack: got(() => Input.buzz('handBack')), go: got(() => Input.buzz('go')), pulse: got(() => Input.vibrate(90)), jackF: got(() => Input.buzz('jackF')), gunOn: got(() => Input.buzz('gunOn')), pitAP: got(() => Input.buzz('pitAP')), rattle: got(() => Input.buzz('rattle')) };
    sw(2); const lv2 = lv(); g.sim(0.5, true);
    const all = { jackF: got(() => Input.buzz('jackF')), pitAP: got(() => Input.buzz('pitAP')), handBack: got(() => Input.buzz('handBack')), list: got(() => Input.vibrate([150.4, 100, 150, 100.6, 150])) };   // (list: the wheel swap's warning, game.js SWAP_BUZZ: a list of pulses, not one)
    sw(1);   // (the second stop: with Osnovno)
    return { played: n1 - n0, off, lv0, none, lv1, basic, lv2, all };
  });
  const has = (L, k) => L.some(p => JSON.stringify(p) === JSON.stringify(k === 'pulse' ? [90] : HAP.H[k].p));
  T.check('Vibracija · Izklop: navigator.vibrate(0) at once (one was playing), then no pattern and no pulse',
    set.played === 1 && set.off.length === 1 && set.off[0][0] === 0 && set.lv0.join() === '0,0,0' && !set.none.length, JSON.stringify({ played: set.played, off: set.off, lv0: set.lv0, none: set.none }));
  T.check('Vibracija · Osnovno (1, stored so): VOZIŠ TI!, the release and the old pulses felt; the crew\'s work, the way in, the rattle not',
    set.lv1.join() === '1,1,1' && ['handBack', 'go', 'pulse'].every(k => has(set.basic[k], k)) && ['jackF', 'gunOn', 'pitAP', 'rattle'].every(k => !has(set.basic[k], k)), JSON.stringify({ lv1: set.lv1, basic: set.basic }));
  T.check('a list of pulses (the wheel swap\'s warning: on, off, on …) goes to navigator.vibrate whole, rounded, not as [NaN]',
    set.all.list.length === 1 && JSON.stringify(set.all.list[0]) === '[150,100,150,101,150]', JSON.stringify(set.all.list));
  T.check('Vibracija · Vse (2): all of them again', set.lv2.join() === '2,2,2' && ['jackF', 'pitAP', 'handBack'].every(k => has(set.all[k], k)), JSON.stringify({ lv2: set.lv2, all: set.all }));
  // a second stop (the end of the second lap) with Osnovno: only the basic ones, each at its moment
  const B = await page.evaluate(() => window.__stop(false)), bn = B.log.map(e => e[0]).filter(k => k !== 'pulse'), LB = look(B);
  T.check('a second stop with Vibracija · Osnovno: only the stop\'s thud, the release and VOZIŠ TI!, in order (nothing of the crew\'s work, the way in or out, a rival passing, a place lost)',
    B.rep === 1 && B.s.level === 1 && B.s.S === 1 && !B.finished && !B.fuel && bn.join() === 'pitStop,go,handBack' && B.log.every(e => e[0] === 'pulse' || HAP.H[e[0]].lv === 1), JSON.stringify({ rep: B.rep, level: B.s.level, lap: B.lap, pitDur: B.pitDur, log: B.log }));
  T.check('Osnovno: each one navigator.vibrate with the table\'s own pattern, at its moment (the thud as the car stops, the release at the stop\'s end, VOZIŠ TI! at the hand-back)',
    LB.same && LB.inW('pitStop', LB.W.rep, 0) && LB.inW('go', LB.W.done) && LB.inW('handBack', LB.W.hand, 0), JSON.stringify({ W: LB.W, t: ['pitStop', 'go', 'handBack'].map(LB.tOf) }));
  await ctx.close();
  // the setting as saved before: an older build's Izklop (0, no vibV) stays Izklop; Osnovno saved by this build (1, vibV 2) stays Osnovno
  const boot = async (o) => {
    const G = await openGame(browser, srv.base + '/index.html', Object.assign({ quality: 'normal', shadows: 0, camera: 'chase' }, o), { width: 640, height: 360 });
    const r = await G.page.evaluate(() => { const o = JSON.parse(localStorage.getItem('tdgp-settings')); return { S: window.__game.S.vibrate, lv: Input.haptics.level, stored: [o.vibrate, o.vibV], sel: (document.querySelector('[data-set="vibrate"] .sel') || {}).textContent }; });
    await G.ctx.close(); errors.push(...G.errors); return r;
  };
  const m0 = await boot({ vibrate: 0 }), m1 = await boot({ vibrate: 1, vibV: 2 });
  T.check('Vibracija as an older build saved it, Izklop (0): Izklop still (stored so); Osnovno as this build saved it: Osnovno still',
    m0.S === 0 && m0.lv === 0 && m0.stored.join() === '0,2' && m0.sel === 'Izklop' && m1.S === 1 && m1.lv === 1 && m1.stored.join() === '1,2' && m1.sel === 'Osnovno', JSON.stringify({ m0, m1 }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
