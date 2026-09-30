// Yellow flags, the safety car and penalties (Race opts flags; Core only, no browser): a car stopped on the track brings out a yellow
// flag (the section from 250 m before it to 30 m past it; gone 5 s after the car moves on); a heavy crash (a car stopped for long) the
// safety car: it comes out ahead of the leader, the field queues up behind it without overtaking, it goes in (into the pit lane or away
// up the road) and the race is green again at the line; no DRS under the flags; the player overtaking under a flag has to give the place
// back within 10 s, else +5 s on the race time (in the results); a race without flags as before.
//   node tests/flags.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));

// a race where the player stops on the track at t0 for `hold` seconds (braking, then the handbrake), else on autopilot
function run(tid, t0, hold, extra) {
  Math.random = seeded(3);
  const T = track(tid), r = new C.Race(T, Object.assign({ numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, flags: true }, extra));
  r.start(); const P = r.player, log = []; let t = 0, k = 0, ev = 0;
  const S = { log, r, P, T, scOrder: null, passes: 0, queue: null, drsFlag: 0 };
  let prevOrder = null;
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    const stop = t > t0 && t < t0 + hold;
    if (stop) { P.inThr = 0; P.inBrk = P.speed > 2 ? 1 : 0; P.inHand = P.speed > 2 ? 0 : 1; P.inSteer = 0; P.digitalSteer = true; } else { P.digitalSteer = false; C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P); }
    r.step(DT); t += DT;
    const F = r.fl;
    if (F.ev !== ev) { ev = F.ev; log.push({ t, k: F.evK }); if (F.evK === 'sc') S.scAt = t; }
    // under the safety car: the running AI cars (not stopped, not pitting) keep their order (from 5 s after it came out: a move already
    // under way side by side is finished)
    if (F.sc && F.sc.car && F.sc.t > 5) {
      const ord = r.order.filter(c => !c.isPlayer && !c.finished && !c.inPit && !c.pitWant && c.fl.stopT === 0).map(c => c.name);
      if (prevOrder) { const a = prevOrder.filter(x => ord.includes(x)), b = ord.filter(x => prevOrder.includes(x)); if (a.join() !== b.join()) S.passes++; }
      prevOrder = ord;
      if (F.sc.state === 'in' && !S.queue) { const X = F.sc.car; S.queue = r.order.filter(c => !c.finished && !c.isPlayer).slice(0, 5).map(c => Math.round(X.dist - c.dist)); }
      for (const c of r.cars) if (c.drs) S.drsFlag++;
    } else prevOrder = null;
  }
  S.t = t; return S;
}

// 1. a short stop at the back of a small field (nobody runs into it): a yellow flag, no safety car
{
  const S = run('rbring', 60, 6, { numAI: 3, playerGrid: 4 }), ks = S.log.map(e => e.k);
  const y = S.log.find(e => e.k === 'yellow');
  check('a car stopped on the track: a yellow flag (no safety car for a short stop), gone once it moves on', !!y && y.t > 60 && y.t < 67 && !ks.includes('sc') && S.r.fl.yel.length === 0, ks.join(', '));
  // the zone: from 250 m before the stopped car to 30 m past it
  const r = S.r, T = S.T, s0 = 1000; r.fl.yel.push({ s: s0, t: 5, car: S.P });
  check('the yellow zone: 250 m before the car to 30 m past it', !!r._yelAt(s0 - 240) && !!r._yelAt(s0 + 20) && !r._yelAt(s0 - 270) && !r._yelAt(s0 + 45), '');
  r.fl.yel.length = 0;
}

// 2. a long stop: the safety car on the Red Bull Ring (with pits) and Jezero (none)
for (const tid of ['rbring', 'jezero']) {
  const S = run(tid, 50, 14), ks = S.log.map(e => e.k), seq = ['yellow', 'sc', 'scIn', 'scGone'];
  const order = seq.every((k, i) => ks.indexOf(k) >= 0 && (i === 0 || ks.indexOf(k) > ks.indexOf(seq[i - 1])));
  check(`${tid}: a long stop brings out the safety car; it goes in (${tid === 'rbring' ? 'the pit lane' : 'away up the road'}), then green at the line`,
    order && (ks.includes('green') || S.r.finishOrder.length) && S.r.fl.sc === null && S.r.fl.scUsed, ks.join(', '));
  check(`${tid}: the field queued behind the safety car (15-40 m apart) and nobody overtook under it, no DRS`, !!S.queue && S.queue[0] > 8 && S.queue[0] < 30 && S.queue.every((g, i) => i === 0 || g - S.queue[i - 1] < 45) && S.passes === 0 && S.drsFlag === 0,
    `gaps to the safety car ${S.queue && S.queue.join(', ')}; ${S.passes} overtakes`);
  check(`${tid}: every car finishes`, S.r.cars.every(c => c.finished), `${S.r.cars.filter(c => c.finished).length}/13`);
}

// 3. the player overtaking under a yellow flag: give the place back, else +5 s
{
  Math.random = seeded(8);
  const T = track('grom'), mk = () => new C.Race(T, { numAI: 1, playerGrid: 2, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 4, difficulty: 0, flags: true });
  const pass = (r, back) => {
    r.start(); const P = r.player, A = r.cars.find(c => !c.isPlayer); let t = 0; const ev = [];
    while (t < 40) { C.aiControl(P, r, DT); r.step(DT); t += DT; }
    // a yellow flag over the next stretch (a car stopped far ahead that stays stopped), the player put behind the rival, then 8 m past it inside the zone
    const stp = { fl: { stopT: 99 } }; r.fl.yel.push({ s: A.q.s + 150, t: 99, car: stp });
    let pe = r.fl.pev;
    const put = (d) => { const i = T.idx(A.q.s + d), off = T.rl[i]; P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
      P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.dist = A.dist + d; P.vx = A.vx; P.vz = A.vz; P.locked = false; };
    put(-12); for (let k = 0; k < 6; k++) { C.aiControl(P, r, DT); r.step(DT); }   // (behind the rival first, then past it)
    put(8);
    for (let k = 0; k < 120 * 14; k++) {
      if (back && P.fl.owe) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.digitalSteer = true; } else { P.digitalSteer = false; C.aiControl(P, r, DT); }
      r.step(DT);
      if (r.fl.pev !== pe) { pe = r.fl.pev; ev.push(r.fl.pevK); }
    }
    return ev;
  };
  const r1 = mk(), e1 = pass(r1, false), r2 = mk(), e2 = pass(r2, true);
  check('overtaking under a yellow flag and staying ahead: a warning, then +5 s', e1.join() === 'passWarn,pen' && r1.player.fl.pen === 5, e1.join());
  check('... given back in time: no penalty', e2[0] === 'passWarn' && e2.includes('passOk') && !e2.includes('pen') && r2.player.fl.pen === 0, e2.join());
  const res = r1.estimateResults(), me = res.find(e => e.car === r1.player);
  check('the penalty in the results: 5 s on the race time', me.pen === 5, JSON.stringify({ pen: me.pen, time: me.time.toFixed(2) }));
}

// 4. without flags: nothing of it
{
  const r = new C.Race(track('rbring'), { numAI: 3, playerGrid: 4, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3 });
  check('a race without flags: no flag state, no penalties', r.fl === null && r.estimateResults().every(e => !e.pen), '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
