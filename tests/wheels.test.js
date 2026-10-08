// The wheel rule (Race opts.wheelRule; the game: the player's SOKOL, offline, a test with one car first): on the player's car of a listed
// vehicle, damage on, its wheels come off by the damage. At 80 % one, a random one of the four; then a second, another random one, and the
// car stops at once: it retires there and the game is over (wreck.rule.over: KONEC IGRE, PONOVI IGRO). A hit from 70 % takes a wheel
// at once, the second one later the less damaged the car was (70 %: 3 s, 90 %: 0.4 s). A hard hit at 80 % or over: two at once,
// sometimes three or all four (the harder, the likelier). The other cars, the other vehicles and damage off: as before (the corner rule).
//   node tests/wheels.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const SOKOL = C.MODELS.find(m => m.id === 'sokol'), T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));   // (a circuit without pits)
const bits = (w) => [0, 1, 2, 3].filter(k => w & (1 << k));
const race = (o) => new C.Race(T, Object.assign({ numAI: 3, playerGrid: 1, laps: 3, playerModel: SOKOL, assist: 2, seed: 3, difficulty: 1, damage: 2, wheelRule: ['sokol'] }, o));
const withRnd = (seed, fn) => { const orig = Math.random; Math.random = seeded(1 + Math.floor(seed * 2654435761) % 2147483646); try { return fn(); } finally { Math.random = orig; } };   // (a small seed's first number is tiny: spread)
// a player's car under the rule, at speed along the track, damage d; the race running
function setUp(d, seed) {
  const r = race({ seed: seed || 3 }); r.start(); const P = r.player;
  P.dmg = d; P.dz = [d, d, d, d]; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30;
  return { r, P, W: P.wreck };
}
// steps until fn() or s seconds: the time it took (Infinity: not in time); the player drives straight on, full throttle
function until(r, fn, s) {
  for (let t = 0; t < s; t += DT) { if (fn()) return t; const P = r.player; if (!r.isOut(P)) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; } r.step(DT); }
  return fn() ? s : Infinity;
}

// 1. only on the player's car of a listed vehicle, damage on
{
  const a = race(), b = race({ playerModel: C.MODELS[0] }), c = race({ damage: 1 }), d = race({ wheelRule: undefined });
  const ok = !!a.player.wreck.rule && a.cars.every(x => x.isPlayer || !(x.wreck && x.wreck.rule)) && !(b.player.wreck && b.player.wreck.rule) && !c.player.wreck.rule && !d.player.wreck.rule;
  check('the rule only on the player\'s car of a listed vehicle (SOKOL), with damage on; not on the AI, another car, damage only for show, or without the option', ok);
}

// 2. 80 % by small knocks: one random wheel at 80 % (none before), the second one 0.8 s later, then the car stops and the game is over
{
  const out = [];
  for (const seed of [1, 2, 3, 4, 5]) withRnd(seed, () => {
    const { r, P, W } = setUp(0, seed); let before = 0, at = null;
    while (P.dmg < 0.8) { C.applyDamage(P, 0.015, P.m.len * 0.5, 0); if (P.dmg < 0.8 && W.nL) before++; }   // (0.015: lighter than a hit, under 70 % or not)
    at = W.nL;
    const t2 = until(r, () => W.nL >= 2, 3), tStop = until(r, () => W.rule.over, 6);
    out.push({ seed, before, at, t2, tStop, dnf: W.dnf, v: P.speed, n: W.nL });
  });
  check('80 % by small knocks: no wheel before, one at 80 %, the second ~0.8 s later (0.7-0.95 s)', out.every(o => !o.before && o.at === 1 && o.t2 > 0.7 && o.t2 < 0.95), out.map(o => `${o.seed}: ${o.at} at 80 %, 2nd ${o.t2.toFixed(2)} s`).join(', '));
  check('two off: the car stops at once (within 3 s from 108 km/h at full throttle), retires there, the game is over (rule.over)', out.every(o => o.tStop < 3 && o.dnf && o.v < 0.6 && o.n === 2), out.map(o => `${o.tStop.toFixed(2)} s`).join(', '));
}

// 3. a hit from 70 %: one wheel at once, the second later the less damaged the car was (70 % later than 90 %)
{
  const t2 = {};
  for (const d of [0.7, 0.8, 0.9]) t2[d] = withRnd(11, () => {
    const { r, P, W } = setUp(d); C.applyDamage(P, 0.03, P.m.len * 0.5, 0);
    const now = W.nL; return { now, t: until(r, () => W.nL >= 2, 5) };
  });
  const ok = [0.7, 0.8, 0.9].every(d => t2[d].now === 1) && t2[0.7].t > 2.6 && t2[0.7].t < 3.2 && t2[0.9].t < 0.5 && t2[0.7].t > t2[0.8].t && t2[0.8].t > t2[0.9].t;
  check('a hit from 70 %: a wheel at once; the second after ~3 s from 70 %, sooner from 80 %, 0.4 s from 90 %', ok, [0.7, 0.8, 0.9].map(d => `${d * 100} %: ${t2[d].now} now, 2nd ${t2[d].t.toFixed(2)} s`).join(', '));
  const lt = withRnd(12, () => { const { P, W } = setUp(0.69); C.applyDamage(P, 0.008, P.m.len * 0.5, 0); return W.nL; });
  check('a scrape (under a hit) at 70 %: no wheel', lt === 0);
}

// 4. a hard hit at 80 % or over: two at once, sometimes three or four, the harder the likelier; the wheels random
{
  const N = 300, stat = {}, first = new Set();
  for (const amt of [0.1, 0.3, 0.6, 1]) {
    const h = [0, 0, 0, 0, 0];
    for (let s = 1; s <= N; s++) withRnd(1000 * amt + s, () => { const { P, W } = setUp(0.82); C.applyDamage(P, amt, P.m.len * 0.5, 0); h[W.nL]++; if (amt === 0.1) for (const k of bits(W.wl)) first.add(k); });
    stat[amt] = h;
  }
  const f = (h) => h.slice(2).join('/');
  check('a hard hit at 80 %+: always two or more at once, never fewer', Object.values(stat).every(h => !h[0] && !h[1]), Object.entries(stat).map(([a, h]) => `${a}: ${f(h)}`).join(', '));
  check('three or four: never in a mild hard hit (0.1), sometimes in a harsh one, all four only in the hardest, more often the harder', stat[0.1][3] + stat[0.1][4] === 0 && stat[0.3][3] > 0 && stat[0.3][4] === 0 && stat[0.6][4] > 0 && stat[1][4] > stat[0.6][4] && stat[1][3] + stat[1][4] === N, `3 / 4 wheels of ${N}: ${[0.3, 0.6, 1].map(a => `${a}: ${stat[a][3]} / ${stat[a][4]}`).join(', ')}`);
  check('the wheels that come off: any of the four (random)', first.size === 4, [...first].sort().join(','));
}

// 5. the first wheel at 80 %: each of the four in turn (random), the second always another one
{
  const seen = [0, 0, 0, 0]; let same = 0;
  for (let s = 1; s <= 200; s++) withRnd(s, () => {
    const { r, P, W } = setUp(0.79); C.applyDamage(P, 0.015, P.m.len * 0.5, 0); const w1 = W.wl; seen[bits(w1)[0]]++;
    until(r, () => W.nL >= 2, 2); if (bits(W.wl).length !== 2 || !(W.wl & w1)) same++;
  });
  check('the first wheel at 80 %: each of the four (random, 200 runs), the second always another', seen.every(k => k > 25) && !same, `FL ${seen[0]}, FR ${seen[1]}, RL ${seen[2]}, RR ${seen[3]}`);
}

// 6. the corner rule is off for the rule's car (only the damage counts), on for the others; wreckCar as without the rule
{
  const corner = (rule) => withRnd(5, () => { const r = race({ wheelRule: rule ? ['sokol'] : undefined }), P = r.player; P.dmg = 0.66; P.cd = [0.9, 0, 0, 0]; C.applyDamage(P, 0.1, P.m.len * 0.5, -P.m.wid * 0.5); return { n: P.wreck.nL, d: P.dmg }; });
  const a = corner(true), b = corner(false);
  check('a crushed corner at 76 %: the rule\'s car keeps its wheels (under 80 %, from under 70 %), another loses that wheel', a.n === 0 && b.n === 1, `rule ${a.n}, without ${b.n} at ${Math.round(a.d * 100)} %`);
  const wk = (rule) => { const r = race({ wheelRule: rule ? ['sokol'] : undefined }), P = r.player; C.wreckCar(P); return [P.wreck.wl, Object.keys(P.lost).sort().join(','), !!P.wreck.rule]; };
  const x = wk(true), y = wk(false);
  check('wreckCar on the rule\'s car: the same total wreck as without it (no random wheels), the rule kept', x[0] === y[0] && x[1] === y[1] && x[2], `wheels ${bits(x[0]).join(',')}`);
}

// 7. no refit for it: the marshals' Namesti kolo (rescue on a circuit without pits) leaves its lost wheel off; a repair clears what is coming
{
  const { r, P, W } = withRnd(3, () => setUp(0.79)); withRnd(3, () => C.applyDamage(P, 0.015, P.m.len * 0.5, 0));
  const wl = W.wl; r.rescue(P);
  const kept = W.wl === wl && W.nL === 1 && !(W.hold > 0);
  r.repairCar(P);
  check('no refit by the marshals (the wheel stays off); a full repair puts it back and nothing more is coming', kept && W.nL === 0 && W.rule.due === -1 && !W.rule.over, `kept ${kept}`);
}

// 8. a whole race: the player crashes into everything from the start; the AI never under the rule; the player over (two wheels, stopped)
{
  const res = withRnd(21, () => {
    const r = race({ numAI: 6, playerGrid: 4, seed: 21 }); r.start(); const P = r.player, W = P.wreck;
    let t = 0, over = null, n1 = null, k = 0;
    for (; t < 240 && over == null; t += DT) {
      Math.random = seeded(5000 + (++k));
      if (!r.isOut(P)) {   // (the autopilot, but every 5 s hard over into the wall for 1.2 s; stuck: back onto the road)
        if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
        if (t % 5 > 3.8) { P.inThr = 1; P.inBrk = 0; P.inHand = 0; P.inSteer = Math.floor(t / 5) % 2 ? 1 : -1; } else C.aiControl(P, r, DT);
      }
      r.step(DT);
      if (n1 == null && W.nL) n1 = { t, d: P.dmg };
      if (W.rule.over) over = t;
    }
    return { over, n1, n: W.nL, ai: r.cars.filter(c => !c.isPlayer).every(c => !(c.wreck && c.wreck.rule)), out: r.isOut(P) };
  });
  check('a race driven into the walls: the first wheel from 70 %, then over (two off, stopped, out of the race); the AI never under the rule', res.over != null && res.n1 && res.n1.d >= 0.7 && res.n >= 2 && res.out && res.ai,
    res.over != null ? `first wheel at ${res.n1.t.toFixed(1)} s (${Math.round(res.n1.d * 100)} %), over at ${res.over.toFixed(1)} s` : 'not over in 240 s');
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
