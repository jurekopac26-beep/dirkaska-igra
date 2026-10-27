// The Kolibri's tyres (Race opts.tyreRule; the game: the player's KOLIBRI, every track): each tyre its own wear and damage (Car.kt). The
// wear: a clean run up a road ~0.24 whatever its length, a race on a circuit about 4 times the usual tyres' (worn: less grip), a slide and
// a wheel off the road (grass, gravel: that wheel only) more. The damage only from knocks (damage Samo videz or Vklop): the corner's tyre
// the most, the one beside it a little, the far one none; ~6 average knocks or 3 hard ones in one corner set it on fire (only one burns:
// less side grip, the drive the same); the wear alone never does. A burning tyre's wheel comes off at the next real knock, the second
// 1-4 s later (at once at a real knock, sooner sliding), a big knock takes two at once; two gone: the car stops, the game is over.
// ZAMENJAJ KOLO (Race.changeWheel) puts a new one on. A pit stop: four new tyres, cold for a lap. Damage off: the wear only.
//   node tests/kolibri-tyres.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const KOL = C.MODELS.find(m => m.id === 'kolibri'), track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const J = track('jezero'), f2 = (a) => a.map(v => v.toFixed(2)).join(' ');
const race = (o, T) => new C.Race(T || J, Object.assign({ numAI: 3, playerGrid: 1, laps: 3, playerModel: KOL, assist: 2, seed: 3, difficulty: 1, damage: 1, tyreRule: ['kolibri'], wheelRule: ['kolibri'] }, o));
function setUp(o) { const r = race(o); r.start(); const P = r.player; P.vx = Math.cos(P.h) * 25; P.vz = Math.sin(P.h) * 25; return { r, P, K: P.kt, W: P.wreck, Q: P.wreck && P.wreck.rule }; }
const L = KOL.len / 2, Wd = KOL.wid / 2, FL = [L, -Wd];   // (the front left corner: lx, lz)
function until(r, fn, s, slide) {   // steps until fn() or s seconds; the player straight on (slide: the car kept sideways)
  for (let t = 0; t < s; t += DT) { if (fn()) return t; const P = r.player; if (!r.isOut(P)) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; if (slide) P.beta = 0.4; } r.step(DT); }
  return fn() ? s : Infinity;
}

// 1. only on the player's KOLIBRI with the option; its wheel rule from Samo videz on
{
  const a = race(), b = race({ playerModel: C.MODELS[0] }), c = race({ tyreRule: undefined }), d = race({ damage: 0 }), e = race({ damage: 2 });
  check('the tyres only on the player\'s KOLIBRI with the option (not the AI, another car, or without it)', !!a.player.kt && a.cars.every(x => x.isPlayer || !x.kt) && !b.player.kt && !c.player.kt);
  check('its wheel rule with damage Samo videz and Vklop, none with damage off', a.player.wreck.rule && a.player.wreck.rule.kt && e.player.wreck.rule.kt && !d.player.wreck.rule && !!d.player.kt);
}
// 2. the wear: a clean run ~0.24 (two roads of different lengths), a lap of a circuit ~4 times the usual tyres
{
  const run = (id, o) => { const T = track(id), r = race(Object.assign({ numAI: 0, laps: 1, tt: !!T.open }, o), T); r.start(); const P = r.player; let t = 0; while (!P.finished && t < 900) { C.aiControl(P, r, DT); r.step(DT); t += DT; } return P; };
  const A = run('baldy'), B = run('vrsic');
  const ok = (P) => P.kt.w.every(w => w > 0.19 && w < 0.29);
  check('a clean run up a road: each tyre ~0.24 worn at the finish, whatever the road\'s length', ok(A) && ok(B), `Mount Baldy ${f2(A.kt.w)}; Vršič ${f2(B.kt.w)}`);
  const S = run('spa', { tyres: true }), O = run('spa', { tyres: true, tyreRule: undefined, wheelRule: undefined }), k = S.kt.w[0] / O.ty.wear;
  check('a lap of a circuit: about 4 times the usual tyres\' wear (the Kolibri\'s without its own); the set\'s wear (the radio, the pits) the four\'s mean', k > 3 && k < 5.5 && Math.abs(S.ty.wear - S.kt.w.reduce((a, b) => a + b) / 4) < 1e-9, `Spa: ${f2(S.kt.w)} against ${O.ty.wear.toFixed(3)} (x${k.toFixed(1)})`);
  const { P } = setUp(); const g0 = C.ktGrip(P).slice(); P.kt.w = [1, 1, 1, 1]; const g1 = C.ktGrip(P).slice();
  check('worn tyres grip less (10 %)', g1[0] < g0[0] - 0.09 && g1[0] > g0[0] - 0.11, `${g0[0]} -> ${g1[0].toFixed(2)}`);
  const Q = setUp().P, r1 = Q.kt; Q.ws = [0, 0, 0, 0]; C.ktWear(Q, { track: J }, 100); const w0 = r1.w[0]; Q.beta = 0.4; C.ktWear(Q, { track: J }, 100); const w1 = r1.w[0] - w0;
  Q.beta = 0; Q.ws = [2, 0, 3, 0]; const v0 = r1.w.slice(); C.ktWear(Q, { track: J }, 100); const dw = r1.w.map((w, i) => w - v0[i]);
  check('a slide wears them faster, a wheel on the grass or the gravel only that one', w1 > 3 * w0 && dw[0] > 2.5 * dw[1] && dw[2] > 2.5 * dw[3] && Math.abs(dw[1] - dw[3]) < 1e-12, `slide x${(w1 / w0).toFixed(1)}; off ${f2(dw.map(x => x * 1e4))} (1e-4)`);
  Q.kt.w = [1, 1, 1, 1]; Q.kt.d = [0, 0, 0, 0]; C.ktWear(Q, { track: J }, 5000);
  check('the wear alone never sets one on fire', Q.kt.hot === -1);
}
// 3. knocks: the corner's tyre, a little the one beside it, not the far one; 6 average or 3 hard ones set it on fire, a touch next to nothing
{
  const { P, K } = setUp(); C.applyDamage(P, 0.01, FL[0], FL[1]);
  check('an average knock on the front left corner: that tyre ~1/6, the ones beside it a little, the far one nothing', K.d[0] > 0.14 && K.d[0] < 0.2 && K.d[1] > 0 && K.d[1] < 0.06 && K.d[2] > 0 && K.d[2] < 0.06 && K.d[3] === 0, f2(K.d));
  for (let i = 0; i < 4; i++) C.applyDamage(P, 0.01, FL[0], FL[1]);
  const at5 = K.hot; C.applyDamage(P, 0.01, FL[0], FL[1]);
  check('about 6 average knocks in one corner: that tyre burns (only it)', at5 === -1 && K.hot === 0 && K.d[0] === 1, `${f2(K.d)} hot ${K.hot}`);
  const h = setUp(); for (let i = 0; i < 3; i++) C.applyDamage(h.P, 0.032, -L, Wd);
  const t = setUp(); for (let i = 0; i < 10; i++) C.applyDamage(t.P, 0.002, FL[0], FL[1]);
  check('3 hard knocks burn it; ten touches next to nothing', h.K.hot === 3 && t.K.d[0] < 0.12, `hard ${f2(h.K.d)}; touches ${f2(t.K.d)}`);
  const g = C.ktGrip(P);
  check('a burning tyre: much less side grip, the drive, the speed and the brakes as before', g[4] < 0.75 && g[0] === 1, `side ${g[4]}, wheel ${g[0]}`);
  const z = setUp({ damage: 0 }); for (let i = 0; i < 8; i++) C.applyDamage(z.P, 0.03, FL[0], FL[1]);
  check('damage off: no tyre damage, no fire (the wear only)', z.K.d.every(v => v === 0) && z.K.hot === -1);
}
// 4. a burning tyre's wheel: a touch leaves it, a real knock takes it; the second 1-4 s later, sooner sliding, at once at a real knock
{
  const burn = (o) => { const s = setUp(o); s.K.d[1] = 1; s.K.hot = 1; return s; };
  const a = burn(); C.applyDamage(a.P, 0.003, FL[0], FL[1]); const kept = !a.W.wl; C.applyDamage(a.P, 0.009, -L, -Wd);
  check('a burning tyre: a touch does not take the wheel, a real knock anywhere takes that one; ZAMENJAJ KOLO asked', kept && a.W.wl === 2 && a.Q.ask === 1 && a.Q.due > 3.9, `wheels off ${a.W.wl}, due ${a.Q.due}`);
  const t1 = until(a.r, () => a.W.nL >= 2, 8);
  const b = burn(); C.applyDamage(b.P, 0.009, 0, Wd); const t2 = until(b.r, () => b.W.nL >= 2, 8, true);
  const c = burn(); C.applyDamage(c.P, 0.009, 0, Wd); until(c.r, () => false, 0.5); C.applyDamage(c.P, 0.008, FL[0], FL[1]);
  check('the second wheel: straight on ~4 s, sliding sooner (not under 1 s), at once at a real knock; then the car on fire', t1 > 3.5 && t1 < 4.3 && t2 >= 1 && t2 < 2.2 && c.W.nL === 2 && a.Q.burn === 2, `straight ${t1.toFixed(2)} s, sliding ${t2.toFixed(2)} s, knock: ${c.W.nL} off`);
  until(a.r, () => a.Q.over, 6);
  check('two wheels off: the car stops, the game is over (KONEC IGRE)', a.Q.over && a.P.speed < 0.5);
  const d = burn(); C.applyDamage(d.P, 0.03, FL[0], FL[1]);
  check('a big knock on a burning tyre: two wheels at once, the car on fire', d.W.nL === 2 && d.Q.burn === 2 && d.Q.due === -1);
  const e = burn(); C.applyDamage(e.P, 0.009, 0, Wd); const ok = e.r.changeWheel(e.P);
  check('ZAMENJAJ KOLO: the new wheel at once, a new tyre on it, no second wheel coming', ok && !e.W.wl && e.K.d[1] === 0 && e.K.w[1] === 0 && e.Q.due === -1 && until(e.r, () => e.W.nL > 0, 5) === Infinity);
}
// 5. a pit stop: four new tyres, cold (less grip) for a lap after it
{
  const T = track('bathurst'), r = race({ numAI: 0, laps: 2, tyres: true, wheelRule: undefined }, T); r.start(); const P = r.player;
  P.kt.w = [0.5, 0.5, 0.5, 0.5]; P.kt.d = [1, 0.3, 0, 0]; P.kt.hot = 0; P.pitWant = true; let t = 0, stop = false, gc = 1, out = 0;
  while (t < 400 && !P.finished) { C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.pitState === 'done') stop = true; if (stop && !P.inPit && gc === 1) gc = C.ktGrip(P)[0]; if (stop && !P.inPit && (out += DT) > 20) break; }
  check('a pit stop: four new tyres, none burning; cold for a lap after it (less grip, warming up)', stop && P.kt.d.every(v => v === 0) && P.kt.hot === -1 && P.kt.cold > 0.2 && P.kt.cold < 0.95 && gc < 0.92 && P.kt.w[0] < 0.1, `grip cold ${gc.toFixed(2)}, 20 s on ${C.ktGrip(P)[0].toFixed(3)} (cold ${P.kt.cold.toFixed(2)}), wear ${f2(P.kt.w)}`);
}
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
