// Tyre compounds (Core only, no browser): with Race opts compounds the slicks come soft, medium or hard (Core.TYRE_CMP): the soft grips
// more and wears out fastest (and loses more grip worn), the hard the other way, the medium is the slick without compounds; the player's
// choice for the start (opts.playerCmp) and for a pit stop (car.pitCmp), else by what is left of the race (Core.cmpFor); the AI's by the
// race's length and the grid slot, drawing no random numbers (the rest of the race is the same with or without compounds); an AI car goes
// in for a fresh set when its slicks are worn out and fits new ones; a race without compounds has none.
//   node tests/compounds.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));
const T = track('rbring');
const mk = (o) => new C.Race(T, Object.assign({ numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true }, o));

// 1. the compounds: grip and wear
{
  const K = C.TYRE_CMP;
  check('compounds: the soft grips most and wears fastest, the hard the other way; the medium is the plain slick',
    K.S.g > K.M.g && K.M.g > K.H.g && K.M.g === 1 && K.S.wr > K.M.wr && K.M.wr > K.H.wr && K.M.wr === 1 && K.S.loss > K.M.loss && K.M.loss === 0.1 && K.H.loss < K.M.loss,
    `grip ${K.S.g} / ${K.M.g} / ${K.H.g}, wear x${K.S.wr} / ${K.M.wr} / ${K.H.wr}, worn -${K.S.loss} / ${K.M.loss} / ${K.H.loss}`);
  check('compounds: for what is left of the race the soft (short), the medium, the hard (long)', C.cmpFor(5000) === 'S' && C.cmpFor(12000) === 'M' && C.cmpFor(20000) === 'H', [5000, 12000, 20000].map(C.cmpFor).join(','));
}

// 2. the player on each compound for 90 s on autopilot, alone (the same drive): grip on a dry road and the wear
{
  const run = (cmp) => { Math.random = seeded(5); const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, tyres: true, compounds: !!cmp, playerCmp: cmp });
    r.start(); const P = r.player; const g0 = []; for (let k = 0; k < 90 / DT; k++) { C.aiControl(P, r, DT); r.step(DT); if (k === 10) g0.push(P.wet); } return { c: P.ty.c, g0: g0[0], g: P.wet, wear: P.ty.wear, d: P.dist }; };
  const S = run('S'), M = run('M'), H = run('H'), none = run(null);
  check('the player starts on the chosen compound; without compounds none', S.c === 'S' && M.c === 'M' && H.c === 'H' && none.c === undefined, [S.c, M.c, H.c, none.c].join(','));
  check('fresh: the soft grips 3.5 % more than the medium, the hard 3 % less; the medium exactly as a slick without compounds',
    Math.abs(S.g0 / M.g0 - 1.035) < 1e-3 && Math.abs(H.g0 / M.g0 - 0.97) < 1e-3 && M.g0 === none.g0, `${f3(S.g0)} / ${f3(M.g0)} / ${f3(H.g0)} (without ${f3(none.g0)})`);
  check('the soft wears about twice as fast as the medium, the hard about half; the soft loses the most grip', S.wear > M.wear * 1.6 && H.wear < M.wear * 0.75 && H.wear > 0 && (1 - S.g / (1.035 * M.g0 / 1)) > (1 - M.g / M.g0),
    `wear ${f3(S.wear)} / ${f3(M.wear)} / ${f3(H.wear)} after ~${Math.round(M.d)} m; grip now ${f3(S.g)} / ${f3(M.g)} / ${f3(H.g)}`);
}

// 3. the AI's compounds: by the race's length and the grid slot; no random numbers drawn (the field and the race as without compounds)
{
  Math.random = seeded(7); const a = mk({ compounds: true, laps: 1 }); Math.random = seeded(7); const b = mk({ laps: 1 });
  const same = a.cars.every((c, k) => c.name === b.cars[k].name && c.skill === b.cars[k].skill && c.color === b.cars[k].color && c.m.id === b.cars[k].m.id);
  const ai = (r) => r.cars.filter(c => !c.isPlayer).map(c => c.ty.c).join('');
  Math.random = seeded(7); const long = mk({ compounds: true, laps: 5 });
  check('AI: a short race mostly on softs, a long one on mediums and hards; the field the same as without compounds', same && (ai(a).match(/S/g) || []).length >= 8 && !/S/.test(ai(long)) && /H/.test(ai(long)) && /M/.test(ai(long)),
    `1 lap ${ai(a)}, 5 laps ${ai(long)}`);
  a.start(); b.start();
  for (let k = 0; k < 20 / DT; k++) { Math.random = seeded(900 + k); C.aiControl(a.player, a, DT); a.step(DT); Math.random = seeded(900 + k); C.aiControl(b.player, b, DT); b.step(DT); }
  check('a race with compounds runs its own way (the grip differs), but draws the same random numbers: both still run', a.cars.every(c => Number.isFinite(c.dist)) && a.cars.some((c, k) => Math.abs(c.dist - b.cars[k].dist) > 0.01), `lead ${f3(Math.max(...a.cars.map(c => c.dist)))} vs ${f3(Math.max(...b.cars.map(c => c.dist)))} m`);
}

// 4. pit stops: the player's chosen compound; an AI car with worn-out slicks goes in and comes out on a fresh set for what is left
{
  Math.random = seeded(21); const r = mk({ compounds: true, laps: 3, playerCmp: 'S' }); r.start();
  const P = r.player, A = r.cars.find(c => !c.isPlayer && c.grid === 3);
  P.pitCmp = 'H'; let t = 0, pWant = false, aIn = false, aOut = null, pOut = null;
  for (let k = 0; k < 400 / DT && !(pOut && aOut); k++) {
    Math.random = seeded(2000 + k);
    if (!pOut) P.pitWant = !P.repairN || P.inPit;
    if (t > 20 && !aIn && A.ty.wear < 0.9) A.ty.wear = 0.95;   // (worn out, early in the race)
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (A.pitWant) pWant = true; if (A.inPit) aIn = true;
    if (aIn && !A.inPit && !aOut) aOut = { c: A.ty.c, wear: A.ty.wear, t, left: Math.round(r.laps * T.len - A.dist) };
    if (P.repairN && !P.inPit && !pOut) pOut = { c: P.ty.c, wear: P.ty.wear, t };
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
  }
  check('the player\'s stop: the compound asked for (hard) on a fresh set', !!pOut && pOut.c === 'H' && pOut.wear < 0.02, JSON.stringify(pOut));
  check('an AI car with worn-out slicks goes in and comes out on a fresh set, the compound for what is left', pWant && aIn && !!aOut && aOut.wear < 0.02 && aOut.c === C.cmpFor(aOut.left), JSON.stringify(aOut));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
