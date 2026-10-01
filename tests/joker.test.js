// Rallycross (Höljes), Core only: the lap in two surfaces (asphalt and gravel, the dirt carried out onto the asphalt after the gravel), the
// joker lap (a second road that leaves the lap and joins it again: the two roads' heights and barriers where they run together, its cost),
// the side roads that meet or cross the lap (the barrier opened to each gate), the grid two abreast (three with a bigger field), and the rules: every car drives the
// joker once a race (whole races with both physics), a car that has not is classified behind every car that has, the joker rule is not
// applied to qualifying, a car rescued on the joker (or on its way into it, stuck where the roads part) goes on on the joker.
//   node tests/joker.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
Math.random = seeded(41);

// 1. only Höljes has a joker, side roads and mixed surfaces; the other tracks' Track has none of it
const others = C.TRACKS.filter(d => d.id !== 'holjes').map(d => new C.Track(d)).filter(t => t.jk || t.jc.length || t.srf || t.gripK);
check('no other track has a joker, side roads or mixed surfaces', !others.length, others.map(t => t.def.id).join(', '));
const def = C.TRACKS.find(d => d.id === 'holjes'), T = new C.Track(def), J = T.jk, N = T.N, ds = T.ds, L = T.len;
const dA = (i) => ((i * ds - T.startS) % L + L) % L;   // (m after the start line)
check('Höljes: a rallycross circuit of 1.2 km, 6 laps, 5 rivals, the grid two abreast', !!def.rx && L > 1150 && L < 1300 && def.laps === 6 && def.rivals === 5 && def.gridAbreast === 2, `lap ${L.toFixed(0)} m`);

// 2. the surfaces: gravel from before the Velodrome to Turn 9 (~40 % of the lap), dirt on the asphalt for 45 m after it
let gv = 0, first = -1, last = -1;
for (let i = 0; i < N; i++) if (T.srf[i] === 5) { gv++; const d = dA(i); if (first < 0 || d < first) first = d; if (d > last) last = d; }
check('gravel on 35-45 % of the lap, one stretch from ~470 m to ~985 m', gv / N > 0.35 && gv / N < 0.45 && Math.abs(first - 470) < 6 && Math.abs(last - 985) < 6,
  `${(gv / N * 100).toFixed(1)} %, ${first.toFixed(0)}-${last.toFixed(0)} m`);
{ const q = {}, at = (d) => { const i = T.idx(T.startS + d); T.query(T.px[i], T.pz[i], i, q); return q; };
  check('the gravel is gravel, the asphalt asphalt (Track.surface)', T.surface(at(700)) === 5 && T.surface(at(300)) === 0 && T.surface(at(1100)) === 0);
  const k1 = T.gripK[T.idx(T.startS + 990)], k2 = T.gripK[T.idx(T.startS + 1015)], k3 = T.gripK[T.idx(T.startS + 1060)];
  check('the asphalt after the gravel is dirty (less grip), clean again 45 m on', k1 < 0.93 && k2 > k1 && k2 < 1 && k3 === 1, `grip x${k1.toFixed(3)} at 990 m, x${k2.toFixed(3)} at 1015 m, x${k3} at 1060 m`); }

// 2b. the puddles of a race in the rain (def.rain): on the gravel only, the whole puddle and round it; a surface (6) only while it rains
{ const P = T.puddles, onG = (s) => T.srf[T.idx(s)] === 5, bad = P.filter(([s, d, hl, hw]) => !onG(s - hl - 5) || !onG(s) || !onG(s + hl + 5) || Math.abs(d) + hw > T.w);
  check('puddles in the rain: 9, all on the gravel (none on the asphalt), on the road', P.length === 9 && !bad.length, `${P.length} puddles, ${bad.length} off the gravel: ` + P.map(p => dA(p[0]).toFixed(0)).join(' '));
  const [s, d] = P[0], i = T.idx(s), q = {}; T.query(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, i, q);
  T.inRain = false; const dry = T.surface(q); T.inRain = true; const wet = T.surface(q); T.inRain = false;
  check('a puddle is gravel in the dry, water (6) in the rain', dry === 5 && wet === 6, `dry ${dry}, wet ${wet}`); }

// 3. the joker: where it leaves and joins, its length and cost, the two roads' heights where they run together, the barriers in the gore
check('the joker leaves after Turn 1 on the left and joins before Turn 3', !!J && T.jkSide === -1 && dA(T.jkA) > 100 && dA(T.jkA) < 150 && dA(T.jkB) > 380 && dA(T.jkB) < 440 && J.len > 250 && J.len < 350,
  J ? `split ${dA(T.jkA).toFixed(0)} m, join ${dA(T.jkB).toFixed(0)} m, ${J.len.toFixed(0)} m long` : 'none');
{ const q = {}; let dh = 0, sh = 0;
  for (let j = 0; j < J.N; j++) { T.query(J.px[j], J.pz[j], j < J.N / 2 ? T.jkA : T.jkB, q); if (Math.abs(q.d) < T.w + 2) { dh = Math.max(dh, Math.abs(J.hy[j] - T.elevAt(q.s).y)); sh++; } }
  check('where the joker runs on the lap its road is the lap\'s height (no step switching roads)', sh > 10 && dh < 0.05, `${sh} samples on the lap, largest difference ${(dh * 100).toFixed(1)} cm`); }
{ let open = 0, div = 0;
  for (let i = 0; i < N; i++) { if (T.jshare[i] && T.bl[i] <= T.w + 2.51) open++; if (!T.jshare[i] && T.bl[i] < T.w + 3 && dA(i) > 140 && dA(i) < 420) div++; }
  check('the gore is open where the roads run together, a divider where they part', open > 10 && div > 3, `${open} open samples, ${div} with the divider`); }
{ const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 6, phys: 'cs', playerModel: C.MODELS.find(m => m.id === 'rally'), seed: 3 });
  let tM = 0; for (let i = T.jkA; i !== T.jkB; i = (i + 1) % N) tM += ds / Math.max(1, r.vprof[i]);
  let tJ = 0; for (let j = 0; j < J.N - 1; j++) tJ += J.ds / Math.max(1, r.vprofJ[j]);
  check('the joker costs time (its tight bends): 2-5 s at the limit', tJ - tM > 2 && tJ - tM < 5, `${(tJ - tM).toFixed(2)} s (${tJ.toFixed(2)} s against ${tM.toFixed(2)} s)`); }

// 4. the side roads: six, the service road crossing the gravel run (a junction each side at the same place), the barrier opened to each gate
check('six side roads, one crossing the lap (both sides at 915 m)', T.jc.length === 6 && T.jc.filter(c => Math.abs(dA(c.i) - 915) < 3).map(c => c.side).sort().join() === '-1,1', T.jc.map(c => dA(c.i).toFixed(0) + (c.side > 0 ? 'R' : 'L')).join(' '));
{ const reach = (c) => { let m = 0; for (let k = -8; k <= 8; k++) m = Math.max(m, (c.side > 0 ? T.br : T.bl)[(c.i + k + N) % N]); return m; };   // (an angled stub reaches farthest a few metres along)
  const bad2 = T.jc.filter(c => reach(c) < T.w + Math.min(c.depth, 10) * Math.sin(c.ang * Math.PI / 180) - 0.5);
  check('the barrier opened out to each gate', !bad2.length, bad2.map(c => dA(c.i).toFixed(0)).join(', ')); }

// 5. the grid: three rows of two, side by side
{ const r = new C.Race(T, { numAI: 5, playerGrid: 6, laps: 6, phys: 'cs', playerModel: C.MODELS[0], seed: 3 });
  const rows = [...new Set(r.cars.map(c => Math.round(c.dist)))].sort((a, b) => b - a);
  check('the grid: three rows of two abreast', r.cars.length === 6 && rows.length === 3 && rows.every(d => r.cars.filter(c => Math.round(c.dist) === d).length === 2), rows.join(', ') + ' m'); }
{ const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 6, phys: 'cs', playerModel: C.MODELS[0], seed: 3, champ: true });   // (a championship round: its own 12 rivals)
  const rows = [...new Set(r.cars.map(c => Math.round(c.dist)))].sort((a, b) => b - a);
  check('a bigger field (a championship round, 13 cars): three abreast, the last row out of the last corner', r.cars.length === 13 && rows.length === 5 && rows[4] >= -42 && r.cars.every(c => Math.abs(c.q.d) < T.w - 1.5), rows.join(', ') + ' m'); }

// 6. whole races: every car drives the joker exactly once and finishes (both physics, dry and wet)
for (const [phys, rain] of [['cs', 0], ['arcade', 0], ['cs', 1], ['arcade', 1]]) {
  Math.random = seeded(101 + (phys === 'cs' ? 0 : 7) + rain * 3);
  const r = new C.Race(T, { numAI: 5, laps: 6, phys, seed: 21 + rain, difficulty: 1, playerModel: C.MODELS.find(m => m.id === 'rally'), flags: true, rain });
  r.start(); let t = 0;
  while (t < 500 && !r.cars.every(c => c.finished || c.out)) { C.aiControl(r.player, r, DT); r.step(DT); if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); t += DT; }   // (the player's car on autopilot: rescued as the button would)
  const jk = r.cars.map(c => c.out ? 'x' : c.jkN), out = r.cars.filter(c => c.out).length;   // (x: retired after a heavy crash, see Race._retire)
  check(`${phys}${rain ? ' in the rain' : ''}: every car finishes having driven the joker once (or retires after a heavy crash)`, r.cars.every(c => c.finished || c.out) && r.cars.every(c => c.out || c.jkN === 1) && out <= 1, `${t.toFixed(0)} s, jokers ${jk.join('')}`);
}

// 7. the rule: without the joker, behind everyone who drove it (the finishing order and the results); not in qualifying
{ const r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 6, phys: 'cs', playerModel: C.MODELS[0], seed: 3 });
  const [a, b, c, d] = r.cars; a.jkN = 0; b.jkN = 1; c.jkN = 1; d.jkN = 0;
  r.time = 200; for (const car of [a, b, c, d]) { car.finished = true; car.finishTime = r.time; r.finishOrder.push(car); car.finishPos = r.finishOrder.length; r._jkFinish(car); r.time += 1; }
  check('the finishing order: the cars without the joker behind the others (among themselves in the order they finished)', r.finishOrder.map(x => x === a ? 'a' : x === b ? 'b' : x === c ? 'c' : 'd').join('') === 'bcad' && a.finishPos === 3 && d.finishPos === 4 && !!a.jkMiss && !b.jkMiss,
    r.finishOrder.map(x => x.name + ' ' + x.finishPos).join(', '));
  const res = r.estimateResults().map(x => x.car);
  check('the results in the same order', res[0] === b && res[1] === c && res[2] === a && res[3] === d); }
{ const q = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', playerModel: C.MODELS[0], seed: 3, qualiBack: 200 });
  const r = new C.Race(T, { numAI: 5, laps: 6, phys: 'cs', playerModel: C.MODELS[0], seed: 3 });
  check('the joker rule applies in the race, not in qualifying', r.jkRule === true && q.jkRule === false); }

// 8. rescued on the joker: back on the joker; stuck on its way into it (in the gore where the roads part): onto the joker
{ const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 6, phys: 'arcade', playerModel: C.MODELS[1], seed: 5 });
  const P = r.player, j = Math.round(J.N * 0.5); r.start();
  P.place(J.px[j], J.pz[j], J.hd[j]); P.y = P.py = J.hy[j]; P.rd = 1; P.jq = J.query(P.x, P.z, j, {}); P.jPrev = P.jq.s; P.q = T.query(P.x, P.z, -1, P.q); P.sPrev = P.q.s;
  r.rescue(P); r.step(DT);
  check('rescued on the joker: it stays on the joker', P.rd === 1 && Math.abs(P.jq.s - j * J.ds) < 12 && Math.abs(P.jq.d) < J.w, `joker ${P.jq.s.toFixed(0)} m, ${P.jq.d.toFixed(2)} m off its centre line`);
  const A = r.cars.find(c => c !== P), jg = 20, lat = J.w + 1.8;   // (just off the joker's edge towards the lap, where the two part)
  const x = J.px[jg] + J.nx[jg] * lat * (T.jkSide < 0 ? 1 : -1), z = J.pz[jg] + J.nz[jg] * lat * (T.jkSide < 0 ? 1 : -1);
  A.place(x, z, J.hd[jg]); A.rd = 0; A.jkN = 0; A.jkGo = true; A.q = T.query(x, z, -1, A.q); A.sPrev = A.q.s; A.jq = J.query(x, z, jg, {});
  r.rescue(A);
  check('stuck on its way into the joker: rescued onto the joker', A.rd === 1 && A.jq.s < J.len * 0.45 && Math.abs(A.jq.d) < J.w, `joker ${A.jq.s.toFixed(0)} m, ${A.jq.d.toFixed(2)} m off its centre line`); }

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
