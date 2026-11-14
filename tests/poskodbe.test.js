// Poškodbe, paket P1.12 (docs/realizem/paket-p.md): damage only for show (Samo videz, Race opts damage 1) and off (Izklop, 0) never
// change how a car drives. A car with every corner crushed to 90 %, a formula with both wings off, an older model with no parts of its
// own and the wheel rule on drives on Spa for 30 s, every step to the last digit, as the same car whole; with damage on (Vklop, 2) it
// does not. Then the table K (docs/realizem/paket-p.md, »K · Odpadlo kolo«) on two vehicles with parts and two older ones, the count of
// Math.random draws in a crash scene (as on 205f89b2, before the package), the settings (js/game.js, index.html: Podrobnosti poškodb),
// and the points the package's review left untested: the engine's power at Vklop (decision 41), the wing's downforce (K.5), a cut tyre
// (the corner it is on, mirrored, and the time it takes to go down).
//   node tests/poskodbe.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const SPA = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
const ALL = C.MODELS.map(m => m.id), MOD = (id) => C.MODELS.find(m => m.id === id);
const withRnd = (seed, fn) => { const orig = Math.random; Math.random = seeded(seed); try { return fn(); } finally { Math.random = orig; } };
const race = (mid, mode, o) => new C.Race(SPA, Object.assign({ numAI: 0, playerGrid: 1, laps: 2, playerModel: MOD(mid), assist: 2, seed: 9, difficulty: 1, damage: mode, wheelRule: ALL }, o));
// every corner crushed to 90 % and over (small knocks all round, as a long race of them)
function smash(P) { const hl = P.m.len / 2, hw = P.m.wid / 2; for (let i = 0; i < 60 && P.dmg < 0.9; i++) for (const [x, z] of [[hl, -hw], [hl, hw], [-hl, -hw], [-hl, hw]]) C.applyDamage(P, 0.03, x, z); }
// the player's car driven by the AI's hands for sec seconds (each step its own random numbers): its motion, step by step
function drive(r, sec, each) {
  const P = r.player, out = [];
  for (let k = 1; k <= Math.round(sec / DT); k++) { Math.random = seeded(1000 + k); C.aiControl(P, r, DT); if (each) each(P, k); r.step(DT); out.push([P.x, P.y, P.z, P.h, P.vx, P.vz, P.w, P.steer].join(',')); }
  return out;
}
const firstDiff = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return i; return -1; };
const run = (mid, mode, hurt, sec) => withRnd(7, () => { const r = race(mid, mode); r.start(); const P = r.player; if (hurt) hurt(P); const info = { dmg: P.dmg, aeroK: P.aeroK, lost: Object.keys(P.lost || {}).length }; return Object.assign(info, { out: drive(r, sec), P }); });

// ---- 1. Samo videz and Izklop: a crushed car drives as a whole one (Spa, 30 s, every step) ----
{
  const wings = (P) => { smash(P); for (const nm of ['bumperF', 'bumperR']) if (!P.lost[nm] && C.partOf(P.m, nm)) C.detachPart(P, nm); };
  const CASES = [['rally', smash, 'older, no parts'], ['kaze', smash, 'older, no parts'], ['formula', wings, 'both wings off'], ['miska', smash, 'with parts'], ['sokol', smash, 'with parts'], ['skorpijon', smash, 'with parts and aero']];
  const rows = [];
  let all = true, v2 = true, older = true;
  for (const [mid, hurt, what] of CASES) {
    const whole = run(mid, 1, null, 30), show = run(mid, 1, hurt, 30), off = run(mid, 0, hurt, 30), on = run(mid, 2, hurt, 6);
    const d1 = firstDiff(whole.out, show.out), d0 = firstDiff(whole.out, off.out), wh2 = run(mid, 2, null, 6), d2 = firstDiff(wh2.out, on.out);
    if (d1 >= 0 || d0 >= 0 || show.dmg < 0.9) all = false;
    if (d2 < 0) v2 = false;
    if ((mid === 'rally' || mid === 'kaze') && MOD(mid).parts) older = false;
    rows.push(`${mid} (${what}): dmg ${show.dmg.toFixed(2)}, ${show.lost} parts off, Samo videz ${d1 < 0 ? 'same' : 'differs at step ' + d1}, Izklop ${d0 < 0 ? 'same' : 'differs at step ' + d0}, Vklop ${d2 < 0 ? 'same' : 'differs at step ' + d2}`);
  }
  check('Samo videz and Izklop: a car crushed to 90 % on every corner (older models with no parts, the formula with both wings off, the wheel rule on) drives on Spa for 30 s, every step to the last digit, as the same car whole', all && older, rows.join('; '));
  check('Vklop: the same crushed car does drive differently (the check above can tell)', v2);
}

// ---- 2. the formula's wings (K.5): their downforce goes only with damage on ----
{
  const wingsOff = (mode) => withRnd(7, () => { const r = race('formula', mode); r.start(); const P = r.player, a0 = P.aeroK; for (const nm of ['bumperF', 'bumperR']) C.detachPart(P, nm); return { a0, a1: P.aeroK, off: !!(P.lost.bumperF && P.lost.bumperR) }; });
  const s = wingsOff(1), o = wingsOff(2);
  check('the formula\'s wings off: at Samo videz its downforce stays (aeroK as before), at Vklop it goes (front 0.5 + rear 0.4 of it)', s.off && o.off && s.a1 === s.a0 && o.a1 < o.a0 * 0.2 && o.a1 >= 0,
    `Samo videz ${s.a0.toExponential(3)} → ${s.a1.toExponential(3)}, Vklop ${o.a0.toExponential(3)} → ${o.a1.toExponential(3)}`);
}

// ---- 3. the engine at Vklop (decision 41): a battered car pulls 22 % x damage less; at Samo videz as a whole one ----
{
  // on Spa's start straight at 108 km/h, full throttle, straight on, 0.5 s: the speed it gains (from a standstill the tyres hold it back, not the engine)
  const pull = (mode, d) => withRnd(7, () => { const r = race('sokol', mode, { wheelRule: undefined }); r.start(); const P = r.player; P.dmg = d;
    P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30;
    for (let k = 1; k <= 60; k++) { Math.random = seeded(1000 + k); P.inThr = 1; P.inBrk = 0; P.inSteer = 0; r.step(DT); P.dmg = d; }
    return Math.hypot(P.vx, P.vz) - 30; });
  const v0 = pull(2, 0), v5 = pull(2, 0.5), v9 = pull(2, 0.9), s5 = pull(1, 0.5), s0 = pull(1, 0);
  check('the engine at Vklop: half wrecked it gains less speed (at 108 km/h, 0.5 s of full throttle: 7 to 18 % less), 90 % wrecked less still; at Samo videz as a whole car', v5 < v0 * 0.93 && v5 > v0 * 0.82 && v9 < v5 * 0.95 && s5 === s0 && s0 === v0,
    `gain whole ${v0.toFixed(3)} m/s, 50 % ${v5.toFixed(3)} (${((1 - v5 / v0) * 100).toFixed(0)} % less), 90 % ${v9.toFixed(3)}, Samo videz 50 % ${s5.toFixed(3)}`);
}

// ---- 4. the table K (the wheel that comes off) on two vehicles with parts and two older ones ----
{
  const K = (mid, mode, rule) => withRnd(11, () => { const r = race(mid, mode, { wheelRule: rule ? [mid] : undefined }); r.start(); const P = r.player; C.wreckCar(P);
    for (let k = 1; k <= Math.round(3 / DT); k++) { Math.random = seeded(1000 + k); P.inThr = 0; P.inBrk = 1; r.step(DT); }
    const W = P.wreck; return { wl: W ? W.wl : 0, over: !!(W && W.rule && W.rule.over), rule: !!(W && W.rule), out: r.isOut(P) }; });
  const rows = [];
  let ok = true;
  for (const mid of ['miska', 'sokol', 'rally', 'kaze']) {
    const a = K(mid, 2, false), b = K(mid, 1, false), c = K(mid, 1, true), d = K(mid, 0, true);
    // Vklop without the rule: a wheel off (a vehicle with wheel parts; an older one has none to lose, as before), the race goes on;
    // Samo videz without the tyre rule (with or without the wheel rule): no wheel off, no rule; Izklop: nothing
    const kit = !!(MOD(mid).parts && MOD(mid).parts.wheelFL);
    const good = (kit ? a.wl > 0 : a.wl === 0) && !a.rule && !a.out && b.wl === 0 && !b.rule && c.wl === 0 && !c.rule && !c.over && d.wl === 0 && !d.rule;
    if (!good) ok = false;
    rows.push(`${mid}: Vklop ${a.wl.toString(2)}${a.out ? ' out' : ''}, Samo videz ${b.wl}/${c.wl}${c.rule ? ' rule' : ''}, Izklop ${d.wl}`);
  }
  check('table K: wrecked at Vklop without the rule a wheel comes off a vehicle with wheel parts (SOKOL, MIŠKA; the older RALLY and KAZE keep theirs, as before) and the race goes on; at Samo videz without the tyre rule no wheel comes off, with the wheel rule listed too (no rule on the car); at Izklop nothing', ok, rows.join('; '));
}

// ---- 5. a cut tyre (failures: Race opts faults): on the corner that hit the barrier, mirrored on the other side; down in 10 s ----
{
  // a lone car into Spa's barrier on the left or the right from 3 m off it at 30 m/s, 0.7 rad off the road's line (19 m/s across); a cut is certain (rand 0)
  const cut = (side) => withRnd(5, () => {
    const c = new C.Car(MOD('sokol'), { phys: 'cs' }), i = 900, T = SPA, b = side > 0 ? T.br[i] : T.bl[i], s = side > 0 ? -1 : 1;
    c.flt = { pw: -1, pk: 0, brT: 20, enT: 85, brH: false, enH: false, ev: '' };
    c.place(T.px[i] + s * T.nx[i] * (b - 3), T.pz[i] + s * T.nz[i] * (b - 3), Math.atan2(T.tz[i], T.tx[i]) - side * 0.7); c.q.i = i; T.query(c.x, c.z, i, c.q);
    const v = 30; c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v; c.wq.forEach(q => q.i = -1);
    Math.random = () => 0;
    let hit = 0; for (let k = 0; k < 30 && c.flt.pw < 0; k++) { c.x += c.vx / 120; c.z += c.vz / 120; T.query(c.x, c.z, c.q.i, c.q); hit = Math.max(hit, C.wallCollide(c, T) || 0); }
    return { pw: c.flt.pw, hit, ev: c.flt.ev };
  });
  const R = cut(1), L = cut(-1);
  const front = (w) => w === 0 || w === 1;
  check('a cut tyre: a hard hit on the barrier cuts the tyre of the front corner that took it, the left side\'s on one barrier, the right side\'s on the other (mirrored)', front(R.pw) && front(L.pw) && R.pw !== L.pw && R.ev === 'puncture' && L.ev === 'puncture',
    `right barrier: wheel ${R.pw} (hit ${R.hit.toFixed(1)} m/s), left barrier: wheel ${L.pw} (hit ${L.hit.toFixed(1)} m/s)`);
  // the time: a cut tyre lets its air out over 10 s (PUNC_T); half way at 5 s, flat at 10 s, and its grip goes with it
  const down = withRnd(7, () => { const r = race('sokol', 1, { faults: true, wheelRule: undefined }); r.start(); const P = r.player; P.flt.pw = 1; P.flt.pk = 0; const pk = [];
    for (let k = 1; k <= Math.round(11 / DT); k++) { Math.random = seeded(1000 + k); C.aiControl(P, r, DT); r.step(DT); if (k === Math.round(5 / DT) || k === Math.round(10 / DT) - 2 || k === Math.round(10 / DT) + 2) pk.push(P.flt.pk); }
    return pk; });
  check('a cut tyre goes down over 10 s: half at 5 s, not yet flat just before 10 s, flat just after', Math.abs(down[0] - 0.5) < 0.01 && down[1] < 1 && down[2] === 1, down.map(x => x.toFixed(3)).join(', '));
}

// ---- 6. Math.random in a crash scene: as many draws as before the package (205f89b2) at Izklop and Samo videz ----
{
  // the player at the back of ten on Spa, full throttle into the field for 12 s; the draws of Math.random counted (the race's own numbers:
  // Race.rnd, not counted). On 205f89b2: SOKOL 940 / 991, KAZE 940 / 945 (Izklop / Samo videz)
  const draws = (mid, mode) => { const orig = Math.random; let cnt = 0; try { Math.random = seeded(7);
    const r = new C.Race(SPA, { numAI: 9, playerGrid: 10, laps: 2, playerModel: MOD(mid), assist: 2, seed: 9, difficulty: 1, damage: mode }); r.start(); const P = r.player;
    for (let k = 1; k <= Math.round(12 / DT); k++) { const s = seeded(1000 + k); Math.random = () => { cnt++; return s(); }; C.aiControl(P, r, DT); P.inThr = 1; P.inBrk = 0; r.step(DT); }
    return { cnt, hurt: r.cars.filter(c => c.dmg > 0.1).length }; } finally { Math.random = orig; } };
  const got = [draws('sokol', 0), draws('sokol', 1), draws('kaze', 0), draws('kaze', 1)], want = [940, 991, 940, 945];
  check('Math.random in a crash scene (ten cars on Spa, the player into the field): as many draws as before the package at Izklop and Samo videz', got.every((g, i) => g.cnt === want[i]) && got[1].hurt >= 3,
    got.map((g, i) => `${g.cnt}/${want[i]}`).join(', ') + `; cars hurt at Samo videz: ${got[1].hurt}`);
}

// ---- 7. the settings: Podrobnosti poškodb (js/game.js, index.html) ----
{
  const G = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8'), H = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const X = ['xBody', 'xGlass', 'xPaint', 'xRoll', 'xBump', 'xAi', 'xParts', 'xDrag', 'xDust', 'xShake'];
  const mig = (G.match(/tdgp-defaults-v7'\)\) \{([^}]*)\}/) || [])[1] || '';
  check('the defaults: Podrobnosti poškodb Podrobne (dmgDet 1, set once by tdgp-defaults-v7), the Preizkus rows of Razbijanje back to 0 there', /S\.dmgDet = 1/.test(mig) && X.every(k => mig.includes(`'${k}'`)) && /S\[k\] = 0/.test(mig), mig.slice(0, 80));
  const xd = /const xd = \+S\.dmgDet && \+S\.damage > 0 \? 1 : 0/.test(G) && ['body', 'glass', 'paint', 'parts', 'drag', 'dust'].every(k => new RegExp(k + ': \\+S\\.x' + k[0].toUpperCase() + k.slice(1) + ' \\|\\| xd').test(G));
  check('applySettings: Podrobne turns on the six looks of Razbijanje (body, glass, paint, parts, drag, dust) only with damage on; the physics stay the rows\' own', xd);
  const xp = (G.match(/const xPhys = \(net\) => ([^;]*);/) || [])[1] || '';
  check('xPhys: online only { net: 1 } (both phones drive the same); the broken glass laid in a local race (glass 1), its grip only at Vklop (Core)', /^net \? \{ net: 1 \} :/.test(xp) && /glass: 1/.test(xp), xp);
  const row = (k) => (H.match(new RegExp('<div class="row"([^>]*)>(?:(?!<div class="row").)*data-set="' + k + '"', 's')) || [])[1];
  const det = row('dmgDet');
  check('index.html: the row Podrobnosti poškodb (Preproste / Podrobne) shown; the ten rows of Razbijanje hidden', det != null && !/\bhidden\b/.test(det) && /data-set="dmgDet"><button data-v="0">Preproste<\/button><button data-v="1">Podrobne/.test(H) && X.every(k => /\bhidden\b/.test(row(k) || 'none') || !H.includes(`data-set="${k}"`)),
    X.filter(k => H.includes(`data-set="${k}"`) && !/\bhidden\b/.test(row(k) || '')).join(','));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
