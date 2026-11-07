// Worn-out tyres (Core only, no browser; Core.TYRE_CLIFF): past 80 % of wear the grip falls off a cliff (20 % more lost at 100 %, on top of
// the compound's own linear loss; below 80 % exactly as before), driven on a tyre bursts at the set's burst point (Car.ty.bp: 100-110 %,
// from a hash of the car and the set's number: the same in every run, no random draw) on one wheel (Car.flat: the flat tyre's grip and drag)
// until the next stop fits a fresh set; the engineer's plan says box ('worn': worn out and over the cliff before the line; 'tyre': a burst
// one); an AI car comes in before its tyres would burst (the last chance: Race._tyresDue), and with a burst one at once; a race of the usual
// length never gets near the cliff.
//   node tests/wear.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));
const T = track('rbring');

// 1. the cliff: the curve, and the grip of every compound (and of plain slicks, of rain tyres) by the wear, as before below 80 %
{
  const cl = C.tyreCliff, ws = []; for (let w = 0; w <= 1.2001; w += 0.01) ws.push(cl(w));
  check('the cliff: none up to 80 % of wear (exactly 1), then down to 20 % less at 100 %, no further after (the curve never rises)',
    cl(0) === 1 && cl(0.5) === 1 && cl(0.8) === 1 && Math.abs(cl(0.9) - 0.9) < 1e-12 && Math.abs(cl(1) - 0.8) < 1e-12 && cl(1.2) === cl(1) && ws.every((v, k) => k === 0 || v <= ws[k - 1]) && C.TYRE_CLIFF[2] >= 0.15 && C.TYRE_CLIFF[2] <= 0.25,
    `x${f3(cl(0.85))} at 85 %, x${f3(cl(0.9))} at 90 %, x${f3(cl(0.95))} at 95 %, x${f3(cl(1))} at 100 %`);
  const grip = (o, w) => { const r = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, tyres: true }, o));
    r.player.ty.wear = w; r._weather(0); return r.player.wet; };
  const rows = [], same = [], cliff = [];
  for (const cmp of ['S', 'M', 'H', null]) {
    const K = cmp ? C.TYRE_CMP[cmp] : { g: 1, loss: 0.1 }, lin = (w) => C.TYRE_GRIP.dry(0) * (K.g * (1 - K.loss * Math.min(1, w)));   // (the grip as it was: linear)
    for (const w of [0, 0.3, 0.6, 0.79, 0.8]) same.push(grip({ compounds: !!cmp, playerCmp: cmp }, w) === lin(w));
    const g9 = grip({ compounds: !!cmp, playerCmp: cmp }, 0.9), g1 = grip({ compounds: !!cmp, playerCmp: cmp }, 1), g12 = grip({ compounds: !!cmp, playerCmp: cmp }, 1.15);
    cliff.push(Math.abs(g9 / lin(0.9) - 0.9) < 1e-9 && Math.abs(g1 / lin(1) - 0.8) < 1e-9 && g12 === g1);
    rows.push(`${cmp || 'slick'} ${f3(lin(0))} → ${f3(lin(0.8))} at 80 % → ${f3(g9)} at 90 % → ${f3(g1)} at 100 %`);
  }
  const wet = (w) => { const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, rain: 1, tyres: true, compounds: true });
    r.player.ty.wear = w; r._weather(0); return r.player.wet; };
  check('below 80 % of wear every compound grips exactly as before (the linear loss), the plain slick too', same.every(Boolean), rows.join('; '));
  check('over the cliff: 10 % less than the linear grip at 90 %, 20 % less at 100 %, no less at 115 % (soft, medium, hard, the plain slick)', cliff.every(Boolean), rows.join('; '));
  check('rain tyres: the same cliff', wet(0.7) === C.TYRE_GRIP.wet(1) * (1 - 0.1 * 0.7) && Math.abs(wet(1) / (C.TYRE_GRIP.wet(1) * 0.9) - 0.8) < 1e-9, `${f3(wet(0.7))} at 70 %, ${f3(wet(1))} at 100 %`);
}

// 2. the burst point: by the car and the set, the same whatever the race's seed (no random draw), 100-110 %, each car's its own
{
  let draws = 0; const counted = (s) => { const g = seeded(s); return () => { draws++; return g(); }; };
  const mk = (s, o) => { Math.random = counted(s); return new C.Race(T, Object.assign({ numAI: 12, playerGrid: 7, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: s, difficulty: 1 }, o)); };
  draws = 0; mk(5, { tyres: true, compounds: true }); const dT = draws;
  draws = 0; mk(5, {}); const d0 = draws;
  const a = mk(5, { tyres: true, compounds: true }), b = mk(77, { tyres: true, compounds: true, rain: 0.8 });
  const bp = (r) => r.cars.slice().sort((x, y) => x.grid - y.grid).map(c => c.ty.bp);
  const A = bp(a), B = bp(b), distinct = new Set(A.map(f3)).size;
  check('every car\'s burst point between 100 and 110 % of wear, the same in a race with another seed and weather, each car\'s its own (no random number drawn for it)',
    A.every(x => x >= 1 && x <= 1 + C.TYRE_BURST) && A.every((x, k) => x === B[k]) && distinct >= 10 && dT === d0 && a.cars.every(c => c.ty.n === 0 && c.ty.bw === -1),
    `${A.map(x => f3(x)).join(' ')}; ${distinct} different; random numbers drawn ${dT} (without tyres ${d0})`);
}

// 3. a burst: the player (on autopilot, alone with one rival) driven past the burst point: one wheel goes flat (Car.flat), the plan says box
// for a new tyre; the car drives on; the stop fits a fresh set (the next set's own burst point, the flat gone). The rival's tyre bursts
// too: it comes in at once and goes out on new tyres. The wear stops at TYRE_WMAX
{
  Math.random = seeded(41);
  const r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 41, difficulty: 1, tyres: true, compounds: true, playerCmp: 'M', radio: true });
  r.start();
  const P = r.player, A = r.cars.find(c => !c.isPlayer), bp0 = P.ty.bp;
  let t = 0, early = false, at = null, plan = null, d1 = 0, aBurst = null, aOut = null, pOut = null;
  const step = () => { Math.random = seeded(3000 + Math.round(t / DT)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); };
  while (t < 12) step();
  P.ty.wear = bp0 - 0.004; A.ty.wear = A.ty.bp - 0.002;
  while (t < 80 && !at) { const w = P.ty.wear; step(); if (P.ty.bw < 0 && (P.flat || 0)) early = true;
    if (P.ty.bw >= 0) { at = { w0: w, w: P.ty.wear, bw: P.ty.bw, flat: P.flat, ev: P.ty.ev, wet: P.wet, w4: P.ty.w4.map(f3) }; P.ty.ev = ''; plan = r.plan(P); } }
  const ok0 = !!at && !early && at.w0 < bp0 && at.w >= bp0 && at.w < bp0 + 0.003 && at.bw >= 0 && at.bw <= 3 && at.flat === (1 << at.bw) && at.ev === 'burst';
  check('worn past its burst point: one tyre bursts (that wheel\'s Car.flat bit, the event for the HUD), not before', ok0, JSON.stringify({ bp: f3(bp0), at }));
  check('... the one that bursts: the most worn of the four (Car.ty.w4)', !!at && at.w4.every(w => w <= at.w4[at.bw]) && at.w4[at.bw] > Math.min(...at.w4), JSON.stringify(at && { bw: at.bw, w4: at.w4 }));
  check('... the engineer: box for a new tyre (the plan\'s \'tyre\')', !!plan && plan.need.indexOf('tyre') >= 0 && plan.from != null, JSON.stringify(plan && { need: plan.need, box: plan.box, from: plan.from }));
  d1 = P.dist; const t1 = t; while (t < t1 + 15) step();
  check('... the car drives on on the flat (slower, steadily on)', P.dist - d1 > 250 && Number.isFinite(P.x) && P.flat === at.flat, `${Math.round(P.dist - d1)} m in 15 s`);
  while (t < 400 && !(pOut && aOut)) {
    if (!pOut) P.pitWant = !P.repairN || P.inPit;
    step();
    if (A.ty.bw >= 0 && !aBurst) aBurst = { want: A.pitWant, flat: A.flat };
    if (aBurst && A.repairN && !A.inPit && !aOut) aOut = { n: A.ty.n, bw: A.ty.bw, flat: A.flat || 0, wear: +A.ty.wear.toFixed(3) };
    if (P.repairN && !P.inPit && !pOut) pOut = { n: P.ty.n, bw: P.ty.bw, flat: P.flat || 0, wear: +P.ty.wear.toFixed(3), bp: P.ty.bp };
  }
  check('the stop: a fresh set (the second, its own burst point between 100 and 110 %), the burst tyre gone', !!pOut && pOut.n === 1 && pOut.bw === -1 && pOut.flat === 0 && pOut.wear < 0.02 && pOut.bp !== bp0 && pOut.bp >= 1 && pOut.bp <= 1 + C.TYRE_BURST, JSON.stringify(pOut));
  check('an AI car with a burst tyre comes in at once and goes out on a fresh set', !!aBurst && aBurst.want && !!aOut && aOut.n === 1 && aOut.bw === -1 && aOut.flat === 0, JSON.stringify({ aBurst, aOut }));
  P.ty.wear = C.TYRE_WMAX - 0.001; const t2 = t; while (t < t2 + 5) step();
  check('the wear stops at ' + C.TYRE_WMAX, P.ty.wear === C.TYRE_WMAX, f3(P.ty.wear));
}

// 4. the plan: worn out (75 %) and over the cliff (80 %) before the line: box this lap ('worn'); worn out with the line before the cliff,
// or not yet worn out: no such call
{
  Math.random = seeded(8);
  const r = new C.Race(T, { numAI: 3, playerGrid: 2, laps: 6, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 8, difficulty: 1, tyres: true, compounds: true, radio: true });
  r.start();
  for (let t = 0; t < 20; t += DT) { C.aiControl(r.player, r, DT); r.step(DT); }
  const P = r.player, need = () => { const p = r.plan(P); return { need: p.need.join(), box: p.box }; };
  P.ty.wear = 0.6; const fresh = need();
  P.ty.wear = 0.76; const worn = need();
  const d0 = P.ty.d0; P.ty.d0 = P.dist - 1e6; const slow = need(); P.ty.d0 = d0;   // (the wear so slow the line comes first)
  check('worn out and over the cliff before the line: box this lap (\'worn\'); not yet worn out, or the line before the cliff: no such call',
    worn.need.split(',').indexOf('worn') >= 0 && worn.box && fresh.need.split(',').indexOf('worn') < 0 && slow.need.split(',').indexOf('worn') < 0, JSON.stringify({ fresh, worn, slow }));
}

// 5. the AI comes in before a burst: a field of eight on tyres that wear six times as fast (Crystal Palace, 3 laps): the stops for worn
// slicks are not always enough (a full lane, the last lap), the last chance (Race._tyresDue) sends cars in; nobody's tyre bursts, all finish
{
  const wr = {}; for (const k in C.TYRE_CMP) { wr[k] = C.TYRE_CMP[k].wr; C.TYRE_CMP[k].wr *= 6; }
  try {
    const CP = track('cpalace');
    Math.random = seeded(31);
    const r = new C.Race(CP, { numAI: 8, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: 31, difficulty: 1, tyres: true, compounds: true });
    const due = r._tyresDue.bind(r), sent = new Set();
    r._tyresDue = (c, q) => { const v = due(c, q); if (v) sent.add(c.grid); return v; };
    r.start();
    let t = 0, maxW = 0; const bursts = [];
    while (t < 900 && !r.cars.every(c => c.finished)) { Math.random = seeded(7000 + Math.round(t / DT)); r.step(DT); t += DT;
      for (const c of r.cars) { if (c.ty.bw >= 0 && bursts.indexOf(c.grid) < 0) bursts.push(c.grid); if (!c.inPit && !c.pitG && !c.finished) maxW = Math.max(maxW, c.ty.wear); } }
    const stops = r.cars.reduce((s, c) => s + c.ty.n, 0);
    check('tyres worn six times as fast: every AI car comes in before its tyres burst (some sent by the last chance), all finish',
      !bursts.length && sent.size >= 1 && stops >= 8 && r.cars.every(c => c.finished), `${stops} stops, sent by the last chance: cars ${[...sent].join(', ')}; the most worn ${f3(maxW)}; bursts: ${bursts.join(', ') || 'none'}; ${Math.round(t)} s`);
  } finally { for (const k in wr) C.TYRE_CMP[k].wr = wr[k]; }
}

// 6. a race of the usual length (the Red Bull Ring, 2 laps, 13 cars on their compounds): nobody's tyres near the cliff, no burst
{
  Math.random = seeded(12);
  const r = new C.Race(T, { numAI: 12, noPlayer: true, laps: 2, assist: 2, phys: 'cs', seed: 12, difficulty: 1, tyres: true, compounds: true });
  r.start();
  let t = 0, maxW = 0, burst = false;
  while (t < 400 && !r.cars.every(c => c.finished)) { Math.random = seeded(9000 + Math.round(t / DT)); r.step(DT); t += DT;
    for (const c of r.cars) { if (!c.finished) maxW = Math.max(maxW, c.ty.wear); if (c.ty.bw >= 0) burst = true; } }
  check('a race of the usual length: the most worn set far from the warning (75 %) and the cliff, no burst, all finish', maxW < 0.5 && C.tyreCliff(maxW) === 1 && !burst && r.cars.every(c => c.finished),
    `the most worn ${f3(maxW)} (${r.cars.map(c => c.ty.c).join('')})`);
}

// 5. each tyre's own wear (Core.TW4, tyreW4: Car.ty.w4, front left, front right, rear left, rear right): a step's wear shared out by what each
// tyre works, the four always averaging it: cornering the outer ones more (the side the car turns away from), braking the fronts, pulling
// away the driven wheels (the rear-wheel drive's rears, the front-wheel drive's fronts, all four alike with four-wheel drive). In a race
// the four apart (more than a tenth of the set's wear between the most and the least worn), averaging ty.wear exactly; a new set: none on
// any. The grip cliff each tyre's own (Core.tyreCliff4): an even set as ever (tyreCliff of its wear), an uneven one losing grip as soon as a
// tyre is past 80 %, each a quarter of its cliff
{
  const M = (id) => C.MODELS.find(m => m.id === id) || C.MODELS[0], share = (o) => { const c = Object.assign({ m: M('kaze'), speed: 30, csAn: 0, wPath: 0, inBrk: 0, inThr: 0, ty: { wear: 0.01, w4: [0, 0, 0, 0] } }, o);
    C.tyreW4(c, 0.01); return c.ty.w4.map(w => w / 0.01); };
  const avg = (w) => (w[0] + w[1] + w[2] + w[3]) / 4, rwd = C.MODELS.find(m => m.drive === 'FR' || m.drive === 'MR'), ff = C.MODELS.find(m => m.drive === 'FF'), awd = C.MODELS.find(m => m.drive === 'AWD');
  const L = share({ csAn: 12, wPath: 0.3 }), R = share({ csAn: -12, wPath: -0.3 }), B = share({ inBrk: 1 }), Dr = share({ m: rwd, speed: 4, inThr: 1 }), Df = share({ m: ff, speed: 4, inThr: 1 }), Da = share({ m: awd, speed: 4, inThr: 1 }), S = share({});
  const f2 = (w) => w.map(x => x.toFixed(2)).join(' ');
  check('each tyre\'s share of a step\'s wear: cornering the outer ones more (the left ones turning one way, the right ones the other), braking the fronts, pulling away the driven wheels (rear-wheel drive the rears, front-wheel drive the fronts, four-wheel drive all alike), straight on all alike; always averaging the step\'s wear',
    [L, R, B, Dr, Df, Da, S].every(w => Math.abs(avg(w) - 1) < 1e-9) && L[0] > L[1] && L[2] > L[3] && R[1] > R[0] && R[3] > R[2] && B[0] > B[2] && B[1] > B[3] && Dr[2] > Dr[0] && Df[0] > Df[2] && Math.abs(Da[0] - Da[2]) < 1e-9 && S.every(x => Math.abs(x - 1) < 1e-9),
    `left ${f2(L)}, right ${f2(R)}, braking ${f2(B)}, RWD off ${f2(Dr)}, FF ${f2(Df)}, AWD ${f2(Da)}, straight ${f2(S)}`);
  Math.random = seeded(5);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, tyres: true, compounds: true, playerCmp: 'S' });
  r.start(); const P = r.player, n0 = P.ty.w4.slice(); let t = 0;
  while (t < 400 && P.lap < 3) { Math.random = seeded(4000 + Math.round(t / DT)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  const W = P.ty.w4.slice(), sp = Math.max(...W) - Math.min(...W);
  check('two laps of the Red Bull Ring on softs: the four tyres apart (more than a tenth of the set\'s wear between the most and the least worn), averaging the set\'s wear exactly; the set at the start none on any',
    n0.every(w => w === 0) && Math.abs(avg(W) - P.ty.wear) < 1e-9 && sp > 0.1 * P.ty.wear && P.ty.wear > 0.05, `wear ${f3(P.ty.wear)}, the four ${W.map(f3).join(' ')}`);
  const even = { wear: 0.85, w4: [1, 1, 1, 1] }, odd = { wear: 0.8, w4: [0.7, 0.9, 0.7, 0.9] }, fresh = { wear: 0.9, w4: [0, 0, 0, 0] }, c1 = C.tyreCliff;
  check('the grip cliff each tyre\'s own: a set worn evenly exactly as before (tyreCliff of its wear, also where only the set\'s wear is known); at 80 % with two tyres at 90 % already 5 % less (each tyre a quarter of its cliff)',
    C.tyreCliff4(even) === c1(0.85) && C.tyreCliff4(fresh) === c1(0.9) && c1(0.8) === 1 && Math.abs(C.tyreCliff4(odd) - (c1(0.7) + c1(0.9)) / 2) < 1e-12 && Math.abs(C.tyreCliff4(odd) - 0.95) < 1e-9,
    `even ${f3(C.tyreCliff4(even))} (${f3(c1(0.85))}), uneven ${f3(C.tyreCliff4(odd))}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
