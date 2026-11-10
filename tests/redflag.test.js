// The red flag (Race opts.flags, Core RED; Core only, no browser): after a pile-up (RED.n cars stopped within RED.near m of each other,
// one of them badly damaged, or two badly damaged ones) with the leader more than RED.togo laps from the finish, once a race: every
// running car slowly (RED.v, RED.vz in the yellow zone) to a queue in the pit lane (a track whose lane holds the field) or on the start
// straight (else), behind the car ahead, no overtaking, no new damage; a car at its box finishes its stop and joins it. Once all are in:
// held RED.hold s (the track cleared), then the restart behind the safety car and green at the line; the order kept, a car a lap down
// still a lap down, the gaps down to the queue's. A heavy crash of one car, a pile-up near the finish or of lightly damaged cars: the
// safety car, no red flag; a race without flags (the golden races): nothing of it.
//   node tests/redflag.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), RED = C.RED;
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const lane = (c) => !!(c.inPit || c.pitG);
const racing = (c) => !c.isPlayer && !c.finished && !c.inPit && !c.pitWant && !c.pitState && !(c.wreck && c.wreck.dnf) && !(c.fl && c.fl.stopT > 0);

// a pile-up: k AI cars next to each other on the road (racing, within 40 m from the first to the last; the first such ones from the
// front, or from the back) out of the race where they are, the first `heavy` of them wrecked (a destroyed car: dmg 1, its parts on the
// road); null when no such cars are there now
function pileUp(r, k, heavy, back) {
  const o = r.order.filter(racing); if (back) o.reverse();
  for (let i = 0; i + k <= o.length; i++) {
    const g = o.slice(i, i + k);
    if (Math.abs(g[0].dist - g[k - 1].dist) < 40 && g.every(c => c.lap === g[0].lap)) { g.forEach((c, j) => { if (j < heavy) C.wreckCar(c); r.retire(c); }); return g; }
  }
  return null;
}

// a race on autopilot (the player too). o.hook(r, S) once from o.at s on (it returns true when done: e.g. a pile-up once two cars are
// next to each other); o.lapped: the last car a lap down from 20 s on; o.again: a second pile-up 30 s after the green; o.yel: a yellow
// zone this many m before the queue's head while the field goes in (a car stopped there, until the hold). The log of the flag events, and
// while the red flag is out what the checks need: the top speed on the way in (from 6 s on: the braking from racing speed) and in a
// yellow zone (150 m into it on: the braking to RED.vz), the passes among the cars racing on the road when it came out, their damage,
// the queue at the hold, the gaps at the restart
function run(tid, o) {
  Math.random = seeded(3);
  const T = track(tid), L = T.len, r = new C.Race(T, Object.assign({ numAI: 12, playerGrid: 12, laps: 8, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, flags: true, damage: 2 }, o.race));
  r.start();
  const P = r.player, S = { r, T, L, log: [], passes: 0, vMax: 0, vZone: 0, nZone: 0, out: [] };
  let t = 0, k = 0, ev = 0, prev = null, pre = [];
  while (t < (o.tMax || 2000) && r.cars.some(c => !c.finished && !(c.wreck && c.wreck.dnf))) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P);
    if (o.lapped && !S.lapped && t > 20) { const c = r.order[r.order.length - 1]; c.dist -= L; c.lap -= 1; S.lapped = c; }
    if (S.hooked == null && t >= o.at) { const g = o.hook(r, S); if (g) { S.hooked = t; S.out.push(...g); } }
    if (o.again && S.green && !S.again && t > S.green + 30) { const g = pileUp(r, 2, 2); if (g) { S.again = t; S.out.push(...g); } }
    if (r.fl && !r.fl.red && r.order) pre = r.order.filter(c => !c.finished && !(c.wreck && c.wreck.dnf) && !lane(c) && !c.pitWant && !c.pitState && c.fl && c.fl.stopT === 0);   // (racing on the road: before the step the red flag comes out in)
    r.step(DT); t += DT;
    const F = r.fl, R = F && F.red;
    if (F && F.ev !== ev) {
      ev = F.ev; S.log.push({ t, k: F.evK });
      if (F.evK === 'red') {
        S.red = { t, pit: R.pit, rq: r.cars.filter(c => c.fl && c.fl.rq).length, run: r.cars.filter(c => !c.finished && !(c.wreck && c.wreck.dnf)).length, scUsed: F.scUsed, sc: F.sc ? F.sc.state : '-' };
        S.Q = pre.filter(c => !(c.wreck && c.wreck.dnf));
        if (o.yel) F.yel.push(S.fake = { s: ((R.H - o.yel) % L + L) % L, t: 1e9, car: { fl: { stopT: 99 } } });
        S.dmg0 = new Map(S.Q.map(c => [c, c.dmg])); S.order0 = S.lapped ? r.order[0].dist - S.lapped.dist : null;
      }
      if (F.evK === 'redHold') {
        const run = r.cars.filter(c => c.fl && c.fl.rq), lead = R.lead;
        let hd = lead ? ((R.H - lead.q.s) % L + L) % L : NaN; if (hd > L / 2) hd -= L;   // (the leader's centre short of the queue's head, m)
        S.hold = { t, n: run.length, standing: run.filter(c => c.speed < 0.6).length, inLane: run.filter(lane).length, head: +hd.toFixed(2), debris: r.debris.length };
        if (S.fake) F.yel.splice(F.yel.indexOf(S.fake), 1);
      }
      if (F.evK === 'redGo') {
        const Q = r.order.filter(c => S.Q.includes(c) && c !== S.lapped && r.order[0].dist - c.dist < L / 2), g = [];   // (on the leader's lap)
        for (let i = 1; i < Q.length; i++) g.push(Q[i - 1].dist - Q[i].dist);
        S.go = { t, gaps: g, lapped: S.lapped ? r.order[0].dist - S.lapped.dist : null, dmg: Math.max(...S.Q.map(c => c.dmg - S.dmg0.get(c))) };
        S.box = S.boxed ? S.boxed.map(c => ({ c, state: c.pitState, lane: lane(c), behind: r.order[0].dist - c.dist })) : null;
      }
      if (F.evK === 'green' && S.red && !S.green) S.green = t;
    }
    if (S.boxed && S.red) for (const c of S.boxed) if (c.pitDone) S.boxDone.add(c);   // (its stop done: c.pitDone until it is out of the lane)
    if (R && R.st !== 'go') {
      const tr = t - S.red.t;
      for (const c of r.cars) {
        if (!c.fl || !c.fl.rq || lane(c) || c.finished) continue;
        if (tr > 6) S.vMax = Math.max(S.vMax, c.speed);
        const y = tr > 6 && F.yel.length ? r._yelAt(c.q.s) : null;
        if (y) { let d = y.s - c.q.s; d = ((d % L) + L) % L; if (d > L / 2) d -= L; if (d < 100) { S.vZone = Math.max(S.vZone, c.speed); S.nZone++; } }
      }
      const ord = r.order.filter(c => S.Q.includes(c)).map(c => c.name).join();
      if (prev && ord !== prev) S.passes++;
      prev = ord;
    } else prev = null;
    if (o.stopAfterGreen != null && S.green && t > S.green + o.stopAfterGreen) break;
  }
  S.t = t; S.ks = S.log.map(e => e.k).filter(k => k !== 'yellow');
  return S;
}
const seq = (ks, want) => { let j = 0; for (const k of ks) if (k === want[j]) j++; return j === want.length; };   // (want in this order in ks, others between)
const finished = (S) => S.r.cars.filter(c => !S.out.includes(c)).every(c => c.finished);

// 1. Bathurst, a pile-up (two cars wrecked together on the first lap): the queue in the pit lane; a car a lap down; once the race is green
// again a second pile-up (two more cars): no red flag again, the safety car
const RESTART = ['red', 'redHold', 'redGo', 'scIn', 'scGone', 'green'];
{
  // (at 75 s: the two wrecks stop within RED.near of each other and block the road, as at 80, 85 and 90 s. Since the parts a car sheds stop
  // as sheet metal does (docs/trki-realizem.md »Odpadli deli«) a wreck is no longer held back by its own parts: at 50, 60 and 70 s the two
  // roll on 100 to 200 m apart and only the safety car comes. The user's, 10. 11. 2026: »Redkejša zastava je ok«)
  const S = run('bathurst', { at: 75, hook: (r) => pileUp(r, 2, 2), lapped: true, again: true });
  const R0 = S.red || {}, H = S.hold || {}, G = S.go || {}, i = S.ks.indexOf('red');
  // (the safety car may come out a moment before it, for the first car stopped: it goes in at once, and the race's safety car is still to come)
  check('Bathurst: two cars wrecked together bring out the red flag within 15 s (a safety car out a moment before it goes in, the race\'s still to come)', !!S.red && S.red.t - S.hooked < 15 && S.ks.slice(0, i).every(k => k === 'sc') && R0.scUsed === false && R0.sc !== 'out',
    `${S.ks.join(', ')}; ${S.red ? (S.red.t - S.hooked).toFixed(1) + ' s' : '-'}, the safety car ${R0.sc}`);
  check('... every running car in the queue\'s charge, the queue in the pit lane (it holds the field)', R0.pit === true && R0.rq === R0.run && R0.run === 11, `pit ${R0.pit}, ${R0.rq} of ${R0.run}`);
  check(`... slowly in: at most RED.v (${RED.v} m/s) from 6 s on`, S.vMax > RED.v - 4 && S.vMax < RED.v + 2, `top ${S.vMax.toFixed(1)} m/s`);
  check('... no overtaking among the cars racing on the road when it came out', S.passes === 0 && !!S.Q && S.Q.length >= 10, `${S.passes} changes of their order (${S.Q && S.Q.length} cars)`);
  check('... the hold: every running car standing in the pit lane, the leader at the queue\'s head, the debris off the road', H.n === 11 && H.standing === H.n && H.inLane === H.n && Math.abs(H.head) < 6 && H.debris === 0,
    JSON.stringify(H));
  check(`... the restart: the gaps down to the queue's (${RED.gap} m between the cars: 4-12 m from car to car)`, !!G.gaps && G.gaps.length >= 8 && Math.max(...G.gaps) < 12 && Math.min(...G.gaps) > 4, G.gaps && G.gaps.map(g => g.toFixed(1)).join(', '));
  check('... the car a lap down still a lap down (behind the queue)', G.lapped > S.L && G.lapped < S.L + 150, `${S.order0 != null ? S.order0.toFixed(0) : '-'} m behind the leader when it came out, ${G.lapped != null ? G.lapped.toFixed(0) : '-'} m at the restart (a lap: ${S.L.toFixed(0)} m)`);
  check('... no new damage in the queue', G.dmg < 0.02, `the most: ${G.dmg != null ? G.dmg.toFixed(3) : '-'}`);
  check('... then the hold, the restart behind the safety car and green at the line', seq(S.ks, RESTART) && H.t - R0.t < RED.tIn + 1.3 * (S.L + 400) / RED.v + 1 && Math.abs(G.t - H.t - RED.hold) < 0.1,
    `${S.ks.join(', ')}; in ${H.t != null ? (H.t - R0.t).toFixed(0) : '-'} s, held ${G.t != null ? (G.t - H.t).toFixed(1) : '-'} s`);
  check('... once a race: a second pile-up after the green brings out the safety car, not the red flag', !!S.again && S.ks.filter(k => k === 'red').length === 1 && S.ks.lastIndexOf('sc') > S.ks.indexOf('green') && S.r.fl.redUsed,
    `${S.again ? 'at ' + S.again.toFixed(0) + ' s' : 'no second pile-up'}; ${S.ks.join(', ')}`);
  check('... and every car not wrecked finishes the race', finished(S) && S.out.length === 4, `${S.r.cars.filter(c => c.finished).length} finished, ${S.out.length} wrecked`);
}

// 2. Marrakesh (no pit lane), a pile-up of three (one of them wrecked): the queue on the start straight; a yellow zone on the way to it
{
  const S = run('marrakesh', { at: 50, hook: (r) => pileUp(r, 3, 1), yel: 500 });
  const R0 = S.red || {}, H = S.hold || {}, G = S.go || {};
  check('Marrakesh: three cars stopped together, one of them wrecked: the red flag, the queue on the start straight (no pit lane)', !!S.red && R0.pit === false && R0.rq === R0.run && R0.run === 10, `${S.ks.join(', ')}; pit ${R0.pit}, ${R0.rq} of ${R0.run}`);
  check('... the hold: every running car standing on the road, the leader at the line', H.n === 10 && H.standing === H.n && H.inLane === 0 && Math.abs(H.head) < 6, JSON.stringify(H));
  check(`... slowly in (RED.v), RED.vz (${RED.vz} m/s) 150 m into a yellow zone on; no overtaking, no new damage`, S.vMax < RED.v + 2 && S.nZone > 100 && S.vZone < RED.vz + 1.5 && S.passes === 0 && G.dmg < 0.02,
    `top ${S.vMax.toFixed(1)} m/s, in the zone ${S.vZone.toFixed(1)} (${S.nZone} samples); ${S.passes} passes, damage ${G.dmg != null ? G.dmg.toFixed(3) : '-'}`);
  check('... the restart from the grid in a queue (4-12 m from car to car), green at the line, every car not wrecked finishes', !!G.gaps && Math.max(...G.gaps) < 12 && Math.min(...G.gaps) > 4 && seq(S.ks, RESTART) && finished(S),
    `${G.gaps && G.gaps.map(g => g.toFixed(1)).join(', ')}; ${S.ks.join(', ')}`);
}

// 3. Bathurst, the red flag out (by hand) while a car is at its box (another one on its way in): it finishes its stop, the other one goes
// through the lane in the queue
{
  let sent = null;
  const S = run('bathurst', {
    at: 0, stopAfterGreen: 0,
    hook: (r, S) => {
      const T = r.track, L = T.len;
      if (!sent && r.order && r.order[0].lap >= 2) { const cs = r.order.filter(c => !c.isPlayer && !c.pitWant).slice(1, 3); let d = T.startS + T.def.pit[1] - cs[0].q.s; d = ((d % L) + L) % L; if (d < 900 && d > 400) { sent = cs; for (const c of cs) c.pitWant = true; } }
      if (sent && sent.some(c => c.pitState === 'repair' || c.pitState === 'stop')) { S.boxed = sent; S.boxDone = new Set(); S.boxSt = sent.map(c => c.pitState || (lane(c) ? 'in the lane' : 'on the road')); r._redOut([r.order[0]]); return []; }
      return null;
    },
  });
  const B = S.box || [], H = S.hold || {}, at = (S.boxSt || []).map(k => k === 'stop' || k === 'repair');
  check('Bathurst: the red flag out with a car at its box (another one on its way in): it finishes its stop, the other one goes through the lane in the queue; both in it at the restart',
    B.length === 2 && at.some(Boolean) && B.every((b, i) => S.boxDone.has(b.c) === at[i] && b.lane && b.behind > 0 && b.behind < 150) && H.standing === H.n,
    `${(S.boxSt || []).join(', ')} at the red flag; ${B.map(b => `${b.c.name}: ${S.boxDone.has(b.c) ? 'stopped' : 'no stop'}, at the restart ${b.behind.toFixed(0)} m behind the leader${b.lane ? ' in the lane' : ''}`).join('; ')}`);
  check('... no overtaking among the others, the restart and green', S.passes === 0 && seq(S.ks, RESTART), `${S.passes} passes; ${S.ks.join(', ')}`);
}

// 4. no red flag: one car wrecked (the last one: nobody runs into it; the safety car), two lightly damaged cars stopped together (the
// safety car), a pile-up with fewer than RED.togo laps to go (the safety car), a race without flags (nothing)
{
  const one = run('bathurst', { at: 60, hook: (r) => pileUp(r, 1, 1, true), tMax: 120 });
  check('one car wrecked: the safety car, no red flag', one.ks.includes('sc') && !one.ks.includes('red'), one.ks.join(', '));
  const light = run('bathurst', { at: 60, hook: (r) => pileUp(r, 2, 0), tMax: 120 });
  check('two cars stopped together, lightly damaged: the safety car, no red flag', light.ks.includes('sc') && !light.ks.includes('red'), light.ks.join(', '));
  const late = run('marrakesh', { at: 50, hook: (r) => pileUp(r, 2, 2), race: { laps: 3 }, tMax: 110 });
  check(`a pile-up with fewer than ${RED.togo} laps to go: the safety car, no red flag`, late.ks.includes('sc') && !late.ks.includes('red'), late.ks.join(', '));
  const off = run('marrakesh', { at: 50, hook: (r) => pileUp(r, 2, 2), race: { flags: false }, tMax: 110 });
  check('a race without flags: no flag state, nobody in a queue', off.r.fl === null && off.out.length === 2 && off.r.cars.every(c => !c.fl || !c.fl.rq), '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
