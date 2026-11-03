// Repeatable races (sklop 16 of docs/orodje-za-napake.md): a race with opts.repro (the test mode: the quick entry, tests/browser/repro.test.mjs)
// draws every random event that changes it (a wheel off, the debris and the props, a puncture, the AI's reactions and mistakes: Core rand)
// from its seed, never from Math.random. Bathurst, 12 rivals, damage on, the player crashing into the barrier (from 6 s full left lock,
// as tests/lib/sim.js crashDrive), 40 s: the same seed twice with Math.random seeded otherwise gives the same race to the last bit, another
// seed another race; without opts.repro the race takes Math.random as ever (the tests that seed it and the golden references unchanged).
//   node tests/repro.test.js
'use strict';
const { loadCore } = require('./lib/core');
const { DT, seeded, raceState } = require('./lib/sim.js');
const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const crypto = require('crypto');
const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst'));

function run(seed, repro, mseed) {
  const orig = Math.random, R = seeded(mseed); let calls = 0;
  Math.random = () => { calls++; return R(); };
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, seed, difficulty: 1, damage: 2, phys: 'cs', repro });
    r.start(); calls = 0;
    const P = r.player, h = crypto.createHash('sha256'); let dmg = 0;
    for (let k = 1; k <= 40 / DT; k++) {
      const t = k * DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (t >= 6 && t < 8.5) { P.inSteer = -1; P.inThr = 1; P.inBrk = 0; P.inHand = 0; P.digitalSteer = true; } else { P.digitalSteer = false; C.aiControl(P, r, DT); }
      r.step(DT); dmg = Math.max(dmg, P.dmg || 0);
      if (k % 600 === 0) h.update(raceState(r));
    }
    return { digest: h.digest('hex').slice(0, 16), calls, dmg: +dmg.toFixed(2), loose: r.debrisId || 0, lead: +Math.max(...r.cars.map(c => c.dist || 0)).toFixed(2) };
  } finally { Math.random = orig; }
}

const a = run(6, true, 11), b = run(6, true, 977), c = run(5, true, 11);   // (seed 6: with the knocks of the versions (Trki med avti) seed 5's crash, as hard, throws no panel off)
check('opts.repro: the race never calls Math.random (its steps and the autopilot)', a.calls === 0 && b.calls === 0 && c.calls === 0, JSON.stringify([a.calls, b.calls, c.calls]));
check('the crash really happens (damage, loose panels on the road: the random events are drawn)', a.dmg > 0.1 && a.loose > 0, JSON.stringify(a));
check('the same seed twice, Math.random otherwise: the same race, to the last bit (every 5 s, every car, the debris)', a.digest === b.digest, JSON.stringify([a, b]));
check('another seed: another race', c.digest !== a.digest, JSON.stringify([a, c]));
const d = run(5, false, 11), e = run(5, false, 977), f = run(5, false, 11);
check('without opts.repro: Math.random as ever (drawn; seeded the same: the same race, otherwise another)', d.calls > 100 && d.digest === f.digest && d.digest !== e.digest, JSON.stringify([d, e]));

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
