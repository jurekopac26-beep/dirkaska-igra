// The wheel rule (Race opts.wheelRule; the game: the player's SOKOL, offline, a test with one car first): on the player's car of a listed
// vehicle, damage on, its wheels come off by the damage. At 80 % one, a random one of the four, and the game is over (the user, 9. 11.
// 2026: »Ko ti enkrat odpade kolo, je igre konec«): the whole car on fire at once (rule.fn, rule.burn 2: the renderer draws it), the car
// stops at once, retires there (wreck.rule.over: KONEC IGRE, PONOVI IGRO). No spare on the roof, no ZAMENJAJ KOLO, no second wheel to
// wait for. A hit from 70 % takes a wheel at once; a repair puts the wheel back and the fire out. A hard hit at 80 % or over: two at once,
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

// 2. 80 % by small knocks: one random wheel at 80 % (none before), the whole car on fire with it, then the car stops and the game is over
{
  const out = [];
  for (const seed of [1, 2, 3, 4, 5]) withRnd(seed, () => {
    const { r, P, W } = setUp(0, seed); let before = 0, at = null, fire0 = 0;
    while (P.dmg < 0.8) { C.applyDamage(P, 0.015, P.m.len * 0.5, 0); if (P.dmg < 0.8 && W.nL) before++; if (!W.nL && W.rule.fn) fire0++; }   // (0.015: lighter than a hit, under 70 % or not)
    at = W.nL; const fire = { fn: W.rule.fn, burn: W.rule.burn };
    const tStop = until(r, () => W.rule.over, 6);
    out.push({ seed, before, at, tStop, dnf: W.dnf, v: P.speed, n: W.nL, fire0, fire });
  });
  check('80 % by small knocks: no wheel before, one at 80 %', out.every(o => !o.before && o.at === 1), out.map(o => `${o.seed}: ${o.at} at 80 %`).join(', '));
  check('the fire: none before a wheel is off; with it the whole car at once (rule.burn 2), one fire (rule.fn 1)', out.every(o => !o.fire0 && o.fire.fn === 1 && o.fire.burn === 2), out.map(o => JSON.stringify(o.fire)).join(', '));
  check('one off: the car stops at once (within 3 s from 108 km/h at full throttle), retires there, the game is over (rule.over); no second wheel', out.every(o => o.tStop < 3 && o.dnf && o.v < 0.6 && o.n === 1), out.map(o => `${o.tStop.toFixed(2)} s, ${o.n} off`).join(', '));
}

// 3. a hit from 70 %: one wheel at once, the whole car on fire, over; a scrape at 70 %: none
{
  const t2 = {};
  for (const d of [0.7, 0.8, 0.9]) t2[d] = withRnd(11, () => {
    const { r, P, W } = setUp(d); C.applyDamage(P, 0.03, P.m.len * 0.5, 0);
    const now = W.nL, burn = W.rule.burn; return { now, burn, over: until(r, () => W.rule.over, 5), n: W.nL };
  });
  const ok = [0.7, 0.8, 0.9].every(d => t2[d].now === 1 && t2[d].burn === 2 && t2[d].over < 3 && t2[d].n === 1);
  check('a hit from 70 %: a wheel at once, the whole car on fire, over within 3 s, no second wheel; from 70, 80 and 90 % alike', ok, [0.7, 0.8, 0.9].map(d => `${d * 100} %: ${t2[d].now} now, over ${t2[d].over.toFixed(2)} s, ${t2[d].n} off`).join(', '));
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

// 5. the wheel at 80 %: each of the four in turn (random); none after it while the car stops
{
  const seen = [0, 0, 0, 0]; let more = 0;
  for (let s = 1; s <= 200; s++) withRnd(s, () => {
    const { r, P, W } = setUp(0.79); C.applyDamage(P, 0.015, P.m.len * 0.5, 0); const w1 = W.wl; seen[bits(w1)[0]]++;
    until(r, () => W.nL >= 2, 3); if (W.wl !== w1) more++;
  });
  check('the wheel at 80 %: each of the four (random, 200 runs), no second one after it', seen.every(k => k > 25) && !more, `FL ${seen[0]}, FR ${seen[1]}, RL ${seen[2]}, RR ${seen[3]}, more ${more}`);
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

// 7. no refit for it: the marshals' Namesti kolo (rescue on a circuit without pits) leaves its lost wheel off and the car standing; a
//    repair (before the stop) puts it back and the fire out
{
  const { r, P, W } = withRnd(3, () => setUp(0.79)); withRnd(3, () => C.applyDamage(P, 0.015, P.m.len * 0.5, 0));
  const wl = W.wl, lit = W.rule.burn === 2; r.rescue(P);
  const kept = W.wl === wl && W.nL === 1 && !(W.hold > 0) && P.speed < 0.01;
  r.repairCar(P);
  check('no refit by the marshals (the wheel stays off, the car standing); a full repair puts it back and the fire out', kept && lit && W.nL === 0 && !W.rule.over && W.rule.burn === 0 && W.rule.fn === 1, `kept ${kept}, lit ${lit}, fire ${W.rule.fn}/${W.rule.burn}`);
  const R = race(); R.start(); const Q = R.player.wreck.rule;
  check('no spare on the roof, no ZAMENJAJ KOLO (no Race.changeWheel), no second wheel to wait for: the rule holds over, fn, burn and kt only', typeof R.changeWheel === 'undefined' && Object.keys(Q).sort().join(',') === 'burn,fn,kt,over', Object.keys(Q).join(','));
}

// 8. a whole race: the player crashes into everything from the start; the AI never under the rule; the player over (a wheel off, stopped)
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
  check('a race driven into the walls: a wheel from 70 %, then over at once (stopped, out of the race); the AI never under the rule', res.over != null && res.n1 && res.n1.d >= 0.7 && res.n >= 1 && res.over - res.n1.t < 3 && res.out && res.ai,
    res.over != null ? `wheel at ${res.n1.t.toFixed(1)} s (${Math.round(res.n1.d * 100)} %), over at ${res.over.toFixed(1)} s` : 'not over in 240 s');
}

// 9. a rollover (Razbijanje) that takes the damage past 80 % with its roof on the road: the wheel rule sees it (a wheel off), and the car
//    stops only once it lands
{
  const r = withRnd(31, () => { C.setCrash({ roll: 1 }); try {
    const { r, P, W } = setUp(0.78); P.rl = { t: 0, T: 1.58, turns: 2, dir: 1, H: 1.4, k: 0 };
    let t = 0, rolling2 = false; for (; t < 2 && P.rl; t += DT) { P.step(DT, T); if (P.rl && W.rule.over) rolling2 = true; }
    const n1 = W.nL, d = P.dmg, tOver = until(r, () => W.rule.over, 6);   // (the stop once it has landed)
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

// 12. an older model (no kit of parts: KAZE) under the rule (paket-p K): the race's end as on the newer ones. Vklop: 80 % by small knocks
//     takes a front wheel (only the front two: its parts are drawn so), the car stops, KONEC IGRE; Samo videz with its tyres (tyreRule):
//     a tyre burns, the next real knock takes that wheel, the end. Without the rule: no wheel off, as before
{
  const KAZE = C.MODELS.find(m => m.id === 'kaze'), FW = ['wheelFL', 'wheelFR'];
  const v = withRnd(4, () => { const r = race({ playerModel: KAZE, wheelRule: ['kaze'] }), P = r.player, W = P.wreck; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30;
    while (P.dmg < 0.8 && !W.nL) C.applyDamage(P, 0.015, P.m.len * 0.5, 0);
    const lost = Object.keys(P.lost).filter(k => k.startsWith('wheel')), t = until(r, () => W.rule.over, 6); return { n: W.nL, lost, t, burn: W.rule.burn, dnf: W.dnf }; });
  check('KAZE at Vklop under the rule: at 80 % a front wheel off, the whole car on fire, the car stops, the game over', v.n >= 1 && v.lost.every(k => FW.includes(k)) && v.burn === 2 && v.t < 3 && v.dnf, `${v.n} off (${v.lost.join(',')}), burn ${v.burn}, over in ${v.t.toFixed(2)} s`);
  const s = withRnd(6, () => { const r = race({ playerModel: KAZE, wheelRule: ['kaze'], tyreRule: ['kaze'], damage: 1 }), P = r.player, W = P.wreck, K = P.kt; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30;
    let i = 0; while (K.hot < 0 && i++ < 400) C.applyDamage(P, 0.02, P.m.len * 0.5, (i & 1 ? 1 : -1) * P.m.wid * 0.5);
    const hot = K.hot, n0 = W.nL, g = C.ktGrip(P).slice(); C.applyDamage(P, 0.01, P.m.len * 0.5, 0);
    const lost = Object.keys(P.lost).filter(k => k.startsWith('wheel')), t = until(r, () => W.rule.over, 6); return { hot, n0, g, n: W.nL, lost, t }; });
  check('KAZE at Samo videz with its tyres: a front tyre burns (no grip lost), the next knock takes that wheel, the car stops, the game over', (s.hot === 0 || s.hot === 1) && !s.n0 && s.g.every(x => x === 1) && s.n >= 1 && s.lost.every(k => FW.includes(k)) && s.t < 3,
    `hot ${s.hot}, ${s.n} off (${s.lost.join(',')}), over in ${s.t.toFixed(2)} s`);
  const o = withRnd(4, () => { const r = race({ playerModel: KAZE, wheelRule: undefined }), P = r.player; for (let i = 0; i < 80; i++) C.applyDamage(P, 0.015, P.m.len * 0.5, 0); return { w: Object.keys(P.lost).filter(k => k.startsWith('wheel')).length, rule: !!(P.wreck && P.wreck.rule) }; });
  check('KAZE without the rule (Vklop, the race on): no wheel off, as before', !o.w && !o.rule, `${o.w} off`);
}

// 13. P2.3 the engine (paket-p; the user, 13. 11. 2026, trki-p2-pregrevanje: KONEC IGRE): at Vklop a hard knock in front (f 0.6: the front
//     zone and corners) holes the radiator: the engine warms with the throttle (eng.h), at 0.5 'hot' for the game, then dies; the car rolls
//     out, stops and the game is over (rule.why 'engine'). A light knock (f under 0.3), Samo videz and the AI: no eng (power exactly as before)
{
  const front = (P, f) => { P.dz = [f, 0, 0, 0]; P.cd = [f, f, 0, 0]; P.dmg = f * 0.5; };
  const v = withRnd(7, () => { const r = race(); r.start(); const P = r.player, W = P.wreck; front(P, 0.6); P.vx = Math.cos(P.h) * 12; P.vz = Math.sin(P.h) * 12;
    for (let t = 0; t < 4; t += DT) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; P.vx = P.vz = 0; r.step(DT); }   // (full throttle on the spot: off the walls)
    const h4 = P.eng ? P.eng.h : 0;
    P.eng.h = 1; P.eng.t = 2.9; P.vx = Math.cos(P.h) * 12; P.vz = Math.sin(P.h) * 12; const tOver = until(r, () => W.rule.over, 12);
    return { h4, dead: P.eng.dead, tOver, why: W.rule.why, nL: W.nL, out: r.isOut(P), v: P.speed }; });
  check('Vklop, a hard knock in front: the engine warms with the throttle, dies, the car rolls out and stops: the game over (rule.why engine), no wheel off',
    v.h4 > 0.05 && v.h4 < 0.3 && v.dead && v.tOver < 12 && v.why === 'engine' && v.nL === 0 && v.out && v.v < 0.6, `h after 4 s ${v.h4.toFixed(2)}, over in ${v.tOver.toFixed(1)} s, ${v.why}, dead ${v.dead}, nL ${v.nL}, out ${v.out}, v ${v.v.toFixed(2)}`);
  const none = (o, f) => withRnd(7, () => { const r = race(o); r.start(); const P = r.player; front(P, f); until(r, () => false, 3);
    return !P.eng && r.cars.every(c => !c.eng); });
  check('no engine trouble: a light knock (f 0.25), Samo videz (damage 1), without the rule; never on the AI', none({}, 0.25) && none({ damage: 1 }, 0.8) && none({ wheelRule: undefined }, 0.8));
  const fix = withRnd(7, () => { const r = race(); r.start(); const P = r.player; front(P, 0.6); until(r, () => false, 1); const had = !!P.eng; r.repairCar(P); return had && !P.eng; });
  check('a full repair puts a new radiator in (no eng)', fix);
  // Nujno (_mend) leaves a new radiator with the front still bent: the baseline eng.f0 = the front damage, so the fresh radiator leaks only from a
  // fresh knock, not at once from what Nujno left. A new radiator whose f0 is the bent front must stay cool at the throttle; the same radiator with
  // f0 0 (no baseline) would warm straight away. (Guards engStep's fe = f - eng.f0 against a regression that drops the baseline.)
  const mend = withRnd(7, () => { const r = race(); r.start(); const P = r.player, W = P.wreck; front(P, 0.6); until(r, () => false, 1);
    const run = (f0) => { P.eng = { h: 0, t: 0, dead: false, hot: false, ev: '', f0 }; P.vx = P.vz = 0;
      for (let t = 0; t < 3; t += DT) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; P.vx = P.vz = 0; r.step(DT); } return P.eng ? P.eng.h : 0; };
    const kept = run(Math.max(P.dz[0], (P.cd[0] + P.cd[1]) / 2)), none = run(0); return { kept, none }; });
  check('Nujno radiator: with the baseline (eng.f0 = the bent front) it stays cool at the throttle; without it (f0 0) the same front warms it', mend.kept < 0.05 && mend.none > 0.05, `h with baseline ${mend.kept.toFixed(3)}, without ${mend.none.toFixed(3)}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
