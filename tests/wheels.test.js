// The wheel rule (Race opts.wheelRule; the game: the player's SOKOL, offline, a test with one car first): on the player's car of a listed
// vehicle, damage on, its wheels come off by the damage. At 80 % one, a random one of the four; then a second, another random one, and the
// car stops at once: it retires there and the game is over (wreck.rule.over: KONEC IGRE, PONOVI IGRO). A hit from 70 % takes a wheel
// at once, the second one 3 s later whatever the damage (a hit meanwhile no sooner). The fire (rule.fn, rule.burn: the renderer draws it):
// none with the first wheel, the hub's (burn 1) in the last 20 % of those 3 s, the whole car (burn 2) with the second; a repair puts it
// out. A hard hit at 80 % or over: two at once (the whole car on fire at once),
// sometimes three or all four (the harder, the likelier). The other cars, the other vehicles and damage off: as before (the corner rule).
// A rollover's roof contacts count for the rule (80 %), the car stops once it lands. And the lamps: the first knock on the front or the
// rear breaks at least one lamp of that end (the nearer one), on any car. A car's face and tail (bumpers, bonnet, front wings, boot) stay
// on till 70 % (an aero car's wing: as before).
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

// 2. 80 % by small knocks: one random wheel at 80 % (none before), the second one 3 s later, then the car stops and the game is over
{
  const out = [];
  for (const seed of [1, 2, 3, 4, 5]) withRnd(seed, () => {
    const { r, P, W } = setUp(0, seed); let before = 0, at = null, fire0 = 0;
    while (P.dmg < 0.8) { C.applyDamage(P, 0.015, P.m.len * 0.5, 0); if (P.dmg < 0.8 && W.nL) before++; if (!W.nL && W.rule.fn) fire0++; }   // (0.015: lighter than a hit, under 70 % or not)
    at = W.nL; const fire = { fn: W.rule.fn, burn: W.rule.burn };   // (none yet with the first wheel)
    const tHub = until(r, () => W.rule.burn >= 1, 4), hub = { n: W.nL, burn: W.rule.burn }, t2 = tHub + until(r, () => W.nL >= 2, 4), whole = { fn: W.rule.fn, burn: W.rule.burn }, tStop = until(r, () => W.rule.over, 6);
    out.push({ seed, before, at, t2, tStop, dnf: W.dnf, v: P.speed, n: W.nL, fire0, fire, tHub, hub, whole });
  });
  check('80 % by small knocks: no wheel before, one at 80 %, the second 3 s later (2.95-3.1 s)', out.every(o => !o.before && o.at === 1 && o.t2 > 2.95 && o.t2 < 3.1), out.map(o => `${o.seed}: ${o.at} at 80 %, 2nd ${o.t2.toFixed(2)} s`).join(', '));
  check('the fire: none before a wheel is off nor with the first one; the hub\'s (rule.burn 1) in the last 20 % of the 3 s (2.4 s on, the first wheel still the only one off); the whole car (burn 2) with the second; one fire (rule.fn 1)',
    out.every(o => !o.fire0 && !o.fire.fn && !o.fire.burn && o.tHub > 2.35 && o.tHub < 2.5 && o.hub.n === 1 && o.hub.burn === 1 && o.whole.burn === 2 && o.whole.fn === 1), out.map(o => `hub ${o.tHub.toFixed(2)} s, ${JSON.stringify(o.whole)}`).join(', '));
  check('two off: the car stops at once (within 3 s from 108 km/h at full throttle), retires there, the game is over (rule.over)', out.every(o => o.tStop < 3 && o.dnf && o.v < 0.6 && o.n === 2), out.map(o => `${o.tStop.toFixed(2)} s`).join(', '));
}

// 3. a hit from 70 %: one wheel at once, the second 3 s later whatever the damage (the time the player has); a hit meanwhile no sooner
{
  const t2 = {};
  for (const d of [0.7, 0.8, 0.9]) t2[d] = withRnd(11, () => {
    const { r, P, W } = setUp(d); C.applyDamage(P, 0.03, P.m.len * 0.5, 0);
    const now = W.nL; return { now, t: until(r, () => W.nL >= 2, 5) };
  });
  const ok = [0.7, 0.8, 0.9].every(d => t2[d].now === 1 && t2[d].t > 2.95 && t2[d].t < 3.1);
  check('a hit from 70 %: a wheel at once; the second 3 s later from 70, 80 and 90 % alike', ok, [0.7, 0.8, 0.9].map(d => `${d * 100} %: ${t2[d].now} now, 2nd ${t2[d].t.toFixed(2)} s`).join(', '));
  const mid = withRnd(13, () => { const { r, P, W } = setUp(0.75); C.applyDamage(P, 0.03, P.m.len * 0.5, 0); until(r, () => false, 1); C.applyDamage(P, 0.03, P.m.len * 0.5, 0); return { n: W.nL, t: 1 + until(r, () => W.nL >= 2, 4) }; });
  check('a hit (not a hard one) while the second is due: no sooner, still 3 s after the first', mid.n === 1 && mid.t > 2.95 && mid.t < 3.1, JSON.stringify(mid));
  const lt = withRnd(12, () => { const { P, W } = setUp(0.69); C.applyDamage(P, 0.008, P.m.len * 0.5, 0); return W.nL; });
  check('a scrape (under a hit) at 70 %: no wheel', lt === 0);
}

// 4. a hard hit at 80 % or over: two at once, sometimes three or four, the harder the likelier; the wheels random
{
  const N = 300, stat = {}, first = new Set(); let notWhole = 0;
  for (const amt of [0.1, 0.3, 0.6, 1]) {
    const h = [0, 0, 0, 0, 0];
    for (let s = 1; s <= N; s++) withRnd(1000 * amt + s, () => { const { P, W } = setUp(0.82); C.applyDamage(P, amt, P.m.len * 0.5, 0); h[W.nL]++; if (W.rule.burn !== 2) notWhole++; if (amt === 0.1) for (const k of bits(W.wl)) first.add(k); });
    stat[amt] = h;
  }
  const f = (h) => h.slice(2).join('/');
  check('a hard hit at 80 %+: always two or more at once, never fewer', Object.values(stat).every(h => !h[0] && !h[1]), Object.entries(stat).map(([a, h]) => `${a}: ${f(h)}`).join(', '));
  check('three or four: never in a mild hard hit (0.1), sometimes in a harsh one, all four only in the hardest, more often the harder', stat[0.1][3] + stat[0.1][4] === 0 && stat[0.3][3] > 0 && stat[0.3][4] === 0 && stat[0.6][4] > 0 && stat[1][4] > stat[0.6][4] && stat[1][3] + stat[1][4] === N, `3 / 4 wheels of ${N}: ${[0.3, 0.6, 1].map(a => `${a}: ${stat[a][3]} / ${stat[a][4]}`).join(', ')}`);
  check('the wheels that come off: any of the four (random)', first.size === 4, [...first].sort().join(','));
  check('a hard hit: the whole car on fire at once (rule.burn 2)', notWhole === 0, `${notWhole} not`);
}

// 5. the first wheel at 80 %: each of the four in turn (random), the second always another one
{
  const seen = [0, 0, 0, 0]; let same = 0;
  for (let s = 1; s <= 200; s++) withRnd(s, () => {
    const { r, P, W } = setUp(0.79); C.applyDamage(P, 0.015, P.m.len * 0.5, 0); const w1 = W.wl; seen[bits(w1)[0]]++;
    until(r, () => W.nL >= 2, 4); if (bits(W.wl).length !== 2 || !(W.wl & w1)) same++;
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
  const kept = W.wl === wl && W.nL === 1 && !(W.hold > 0), lit = until(r, () => W.rule.burn === 1, 3) < 3;   // (the hub's fire, its last 20 %)
  r.repairCar(P);
  check('no refit by the marshals (the wheel stays off); a full repair puts it back, puts the hub\'s fire out and nothing more is coming', kept && lit && W.nL === 0 && W.rule.due === -1 && !W.rule.over && W.rule.burn === 0 && W.rule.fn === 1, `kept ${kept}, lit ${lit}, fire ${W.rule.fn}/${W.rule.burn}`);
}

// 7b. on the pit road (c.pitG: no damage there) the second wheel waits; back on the circuit it comes off when its time is up
{
  const res = withRnd(9, () => {
    const { r, P, W } = setUp(0.7); C.applyDamage(P, 0.03, P.m.len * 0.5, 0); const n0 = W.nL;
    P.pitG = true; const held = until(r, () => W.nL >= 2, 4); P.pitG = false;
    return { n0, held, after: until(r, () => W.nL >= 2, 4) };
  });
  check('on the pit road the second wheel waits (4 s at 70 %, no damage there); back on the circuit it comes off', res.n0 === 1 && res.held === Infinity && res.after < 3.2, JSON.stringify(res));
}

// 7c. the spare on the roof (rule.spare): the first wheel off asks for the change (rule.ask) for the 3 s; Race.changeWheel puts it on at
//     once while the car drives on: four wheels again, nothing more coming, the hub's fire (lit in the last 20 %) put out (rule.xn), the
//     spare gone; put on sooner, no fire at all. The next wheel then: no asking, the hub's fire, the second 3 s on with the whole car on
//     fire, over. A scrape at 80 % after the change takes none (the 80 % mark only when crossed); a hit from 70 % one. A repair: a new
//     spare. Two at once (a hard hit): no asking
{
  const res = withRnd(41, () => {
    const { r, P, W } = setUp(0.79), Q = W.rule; const s0 = { spare: Q.spare, ask: Q.ask };
    const hold = (fn, sec) => { for (let t = 0; t < sec; t += DT) { if (fn()) return t; if (!r.isOut(P)) C.aiControl(P, r, DT); r.step(DT); } return fn() ? sec : Infinity; };   // (the autopilot: along the road, no wall to run into meanwhile)
    C.applyDamage(P, 0.03, P.m.len * 0.5, 0); const a1 = { n: W.nL, ask: Q.ask, due: +Q.due.toFixed(2), burn: Q.burn, fn: Q.fn };
    a1.hub = hold(() => Q.burn === 1, 3); a1.ask2 = Q.ask; const v0 = P.speed;   // (the hub's fire in the last 20 %, still asking)
    const ok = r.changeWheel(P), a2 = { ok, n: W.nL, wl: W.wl, lost: Object.keys(P.lost).filter(k => /^wheel/.test(k)).length, spare: Q.spare, ask: Q.ask, due: Q.due, burn: Q.burn, xn: Q.xn, v: +(P.speed - v0).toFixed(3) };
    const later = hold(() => W.nL > 0 || r.isOut(P), 4); const a3 = { n: W.nL, v: +P.speed.toFixed(1), again: r.changeWheel(P) };
    C.applyDamage(P, 0.008, P.m.len * 0.5, 0); const scrape = W.nL;
    C.applyDamage(P, 0.03, P.m.len * 0.5, 0); const a4 = { n: W.nL, ask: Q.ask, burn: Q.burn, fn: Q.fn, swap: r.changeWheel(P) };
    a4.hub = hold(() => Q.burn === 1, 3); const t2 = a4.hub + hold(() => W.nL >= 2, 4); a4.whole = Q.burn; a4.fn2 = Q.fn; const over = hold(() => Q.over, 4);
    r.repairCar(P); const a5 = { spare: Q.spare, ask: Q.ask, burn: Q.burn };
    return { s0, a1, a2, later, a3, scrape, a4, t2, over, a5 };
  });
  const R = res;
  check('the spare: on the roof from the start; the first wheel off asks for the change for the 3 s, no fire yet; the hub\'s in the last 20 % (2.4 s on), still asking', R.s0.spare === 1 && !R.s0.ask && R.a1.n === 1 && R.a1.ask === 1 && R.a1.due === 3 && R.a1.burn === 0 && R.a1.fn === 0 && R.a1.hub > 2.35 && R.a1.hub < 2.5 && R.a1.ask2 === 1, JSON.stringify([R.s0, R.a1]));
  check('ZAMENJAJ KOLO (Race.changeWheel): at once, the car not slowed (it drives on): four wheels, nothing coming, the hub\'s fire put out, no spare left', R.a2.ok && R.a2.n === 0 && R.a2.wl === 0 && R.a2.lost === 0 && R.a2.spare === 0 && !R.a2.ask && R.a2.due === -1 && R.a2.burn === 0 && R.a2.xn === 1 && R.a2.v === 0 && R.later === Infinity && R.a3.n === 0 && R.a3.v > 20 && !R.a3.again, JSON.stringify([R.a2, R.later, R.a3]));
  check('after the change: a scrape at 80 % takes no wheel; a hit from 70 % one, without asking (no spare), no fire yet; no change possible; the hub\'s fire 2.4 s on, the second 3 s on with the whole car on fire, over', R.scrape === 0 && R.a4.n === 1 && !R.a4.ask && R.a4.burn === 0 && R.a4.fn === 1 && !R.a4.swap && R.a4.hub > 2.35 && R.a4.hub < 2.5 && R.a4.whole === 2 && R.a4.fn2 === 2 && R.t2 > 2.95 && R.t2 < 3.1 && R.over < 3, JSON.stringify([R.scrape, R.a4, R.t2, R.over]));
  const quick = withRnd(43, () => { const { r, P, W } = setUp(0.79); C.applyDamage(P, 0.03, P.m.len * 0.5, 0); until(r, () => false, 1); const ok = r.changeWheel(P); until(r, () => false, 3); return { ok, n: W.nL, fn: W.rule.fn, burn: W.rule.burn, xn: W.rule.xn }; });
  check('the spare put on before the last 20 %: no fire at all', quick.ok && quick.n === 0 && quick.fn === 0 && quick.burn === 0 && quick.xn === 0, JSON.stringify(quick));
  check('a repair: a new spare on the roof, the fire out, nothing asked', R.a5.spare === 1 && !R.a5.ask && R.a5.burn === 0, JSON.stringify(R.a5));
  const hard = withRnd(42, () => { const { P, W } = setUp(0.82); C.applyDamage(P, 0.3, P.m.len * 0.5, 0); return { n: W.nL, ask: W.rule.ask }; });
  check('two or more at once (a hard hit at 80 %+): no asking (the game is over)', hard.n >= 2 && !hard.ask, JSON.stringify(hard));
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

// 9. a rollover (Razbijanje) that takes the damage past 80 % with its roof on the road: the wheel rule sees it (a wheel off), and the car
//    stops only once it lands
{
  const r = withRnd(31, () => { C.setCrash({ roll: 1 }); try {
    const { r, P, W } = setUp(0.78); P.rl = { t: 0, T: 1.58, turns: 2, dir: 1, H: 1.4, k: 0 };
    let t = 0, rolling2 = false; for (; t < 2 && P.rl; t += DT) { P.step(DT, T); if (P.rl && W.nL >= 2 && W.rule.over) rolling2 = true; }
    const n1 = W.nL, d = P.dmg, tOver = until(r, () => W.rule.over, 6);   // (the second wheel 3 s after the first, then the stop)
    return { n1, d, rolling2, tOver };
  } finally { C.setCrash({ roll: 0 }); } });
  check('a rollover past 80 % (its roof on the road): a wheel off, and over only once it has landed and stopped', r.n1 >= 1 && r.d >= 0.8 && !r.rolling2 && r.tOver < 6, `${Math.round(r.d * 100)} %, ${r.n1} off after the roll, over ${r.tOver.toFixed(2)} s after landing`);
}

// 10. the lamps: the first knock on the front breaks one front lamp (the nearer one), on the rear one rear lamp; any car, any knock
{
  const out = [];
  for (const [lx, lz, want] of [[1, -0.3, 0], [1, 0.3, 1], [-1, -0.2, 2], [-1, 0.4, 3]]) {
    const r = race({ wheelRule: undefined, playerModel: C.MODELS[0] }), P = r.player;
    C.applyDamage(P, 0.012, lx * P.m.len * 0.5, lz * P.m.wid * 0.5);
    out.push({ want, got: P.lightOut.map((v, k) => v ? k : -1).filter(k => k >= 0) });
  }
  const side = (() => { const r = race({ wheelRule: undefined }), P = r.player; C.applyDamage(P, 0.012, 0, P.m.wid * 0.5); return P.lightOut.some(v => v); })();
  check('a lamp at the first knock: front left / right, rear left / right, the nearer one of that end (a light 0.012 knock); a knock on the side breaks none', out.every(o => o.got.length === 1 && o.got[0] === o.want) && !side, out.map(o => `${o.want}: ${o.got.join(',')}`).join(' · ') + ` · side ${side}`);
  // a car with its own damage table (the Kolibri): the renderer breaks the first knock's nearer lamp, lamp1, whatever a side knock broke before
  const kb = (() => { const r = race({ wheelRule: undefined, playerModel: C.MODELS.find(m => m.id === 'kolibri') }), P = r.player, hl = P.m.len * 0.5, hw = P.m.wid * 0.5;
    C.applyDamage(P, 0.12, 0.55 * hl, -hw); C.applyDamage(P, 0.12, 0.55 * hl, -hw); const before = P.lightOut.slice(); C.applyDamage(P, 0.03, hl, 0.3 * hw); const first = P.lamp1;
    C.applyDamage(P, 0.03, -hl, -0.3 * hw); const rear = P.lamp1; r.repairCar(P); return { before, first, rear, after: P.lamp1 }; })();
  check('the first knock on an end: lamp1 its nearer lamp only (front right after the left front corner was hit from the side: not the front left), the rear left at the first rear knock; cleared by a repair',
    kb.before[0] === 1 && kb.first === 2 && kb.rear === (2 | 4) && kb.after === 0, JSON.stringify(kb));
}

// 11. the face and the tail (bumpers, bonnet, front wings, boot) stay on till the car is 70 % gone, however the knocks fall (front only
//     or all round); then they may go. An aero car's wing (the formula's front wing): as before, at its zone's mark
{
  const run = (id, front) => { const r = race({ wheelRule: undefined, playerModel: C.MODELS.find(m => m.id === id) }), P = r.player, hl = P.m.len / 2, hw = P.m.wid / 2;
    const seq = front ? [[1, 0], [1, -0.4], [1, 0.4]] : [[1, 0], [0.95, -0.9], [0.95, 0.9], [1, -0.3], [0.2, 1], [1, 0.3], [-1, 0], [-1, 0.5]]; let k = 0, at69 = null;
    for (const t of [0.69, 0.75]) { while (P.dmg < t - 1e-6) { const [a, b] = seq[k++ % seq.length]; C.applyDamage(P, Math.min(0.05, t - P.dmg), a * hl, b * hw); } if (t === 0.69) at69 = ['bumperF', 'hood', 'fenderL', 'fenderR', 'bumperR', 'trunk'].filter(n => P.lost[n]); }
    return { at69, at75: ['bumperF', 'hood'].filter(n => P.lost[n]), dz0: +P.dz[0].toFixed(2) }; };
  const a = run('sokol', true), b = run('sokol', false), k = run('kaze', true), f = run('formula', true);
  check('the face and the tail stay on till 70 % (front knocks only, or all round; SOKOL, KAZE), then the nose and the bonnet go; the formula\'s front wing (downforce) breaks before, as before',
    !a.at69.length && !b.at69.length && !k.at69.length && a.at75.length === 2 && k.at75.length === 2 && f.at69.includes('bumperF'),
    `at 69 %: sokol front ${a.at69.join('+') || '-'}, sokol round ${b.at69.join('+') || '-'}, kaze ${k.at69.join('+') || '-'}, formula ${f.at69.join('+') || '-'}; at 75 %: ${a.at75.join('+')}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
