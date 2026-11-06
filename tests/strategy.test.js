// The rivals' strategies (Core only, no browser; Race opts strat: the game's long and endurance races on a circuit with pits, Core.STRAT):
// the tyres wear by the race's length (a set of mediums lasts under half of it, the hard not all of it: a stop at least); every rival gets a
// plan from the race's seed and its grid slot (no random draw): 1 or 2 stops (a third of the field two), the compound of each stint, the lap
// of each stop with its window, every stint within the wear cap (and a tank's laps with fuel), the stops spread over the laps; the same
// plan in every run, another seed another one. In the race the rivals stop on the planned laps and fit the planned tyres; any stop counts as
// the next planned one and the rest is made again from there (by the car's own wear); the safety car brings a stop in its window forward,
// heavy damage one at once; every set a car ran is kept for the results. Off (a race of the usual length): no plans, the wear and the AI's
// tyres as before (the golden references).
//   node tests/strategy.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const lapsOf = (id, k) => (C.TRACKS.find(d => d.id === id).laps || 3) * k;   // (the game's: long twice the usual laps, endurance three times)
const base = { numAI: 12, playerGrid: 13, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true };
const mk = (id, o, rs) => { Math.random = seeded(rs || 7); return new C.Race(track(id), Object.assign({}, base, { laps: lapsOf(id, 2), strat: true }, o)); };
const AIof = (r) => r.cars.filter(c => !c.isPlayer).sort((a, b) => a.grid - b.grid);
const txt = (c) => c.st.p.seq + '@' + c.st.p.at.join(',');
// a plan's stints (laps) from the start: each between two stops (or the start, the line)
const stints = (p, N) => p.at.map((x, i) => x - (i ? p.at[i - 1] : 0)).concat([N - (p.at.length ? p.at[p.at.length - 1] : 0)]);

// 1. off: a race of the usual length (no opts.strat), one lap, a circuit without pits, no compounds, a time trial: no plans, the wear as ever
{
  const plain = mk('spa', { laps: 2, strat: undefined }), no = mk('spa', { laps: 2, strat: false }), one = mk('spa', { laps: 1 }), nopit = mk('suzuka', { laps: 4 }), nocmp = mk('spa', { compounds: false });
  const tt = new C.Race(track('pikes'), Object.assign({}, base, { numAI: 0, playerGrid: 1, laps: 1, strat: true, tt: true }));
  const none = (r) => !r.strat && r.wst.wk === 1 && r.cars.every(c => !c.st);
  check('off (a race of the usual length), one lap, no pits, no compounds, a time trial: no plans, the wear x1, every car\'s tyres as before',
    [plain, no, one, nopit, nocmp, tt].every(none) && plain.cars.every((c, k) => c.ty.c === no.cars[k].ty.c) && [5000, 12000, 20000].every(x => plain.autoCmp(x) === C.cmpFor(x)),
    `AI ${AIof(plain).map(c => c.ty.c).join('')}`);
}

// 2. the wear by the race's length: a set of mediums lasts STRAT.m of the race at the field's average wear, the soft 2.2 times shorter, the
// hard 0.55 times the wear; no set lasts the race; Samodejno by the share of the race left (the player starts on the hard)
{
  const r = mk('spa', {}), T = r.track, N = r.laps, G = r.strat, K = C.TYRE_CMP, S = C.STRAT;
  const auto = mk('spa', { playerCmp: 'auto' }), own = mk('spa', { playerCmp: 'M' });
  check('a long race (4 laps at Spa): the wear x' + f2(r.wst.wk) + ', a set of mediums to 100 % in ' + f2(G.life.M) + ' laps (' + S.m + ' of the race), the soft and the hard by their wear',
    r.wst.wk > 1 && Math.abs(r.wst.wk - 1 / (S.m * N * T.len * S.rate)) < 1e-9 && Math.abs(G.life.M - S.m * N) < 1e-9 && Math.abs(G.life.S - G.life.M / K.S.wr) < 1e-9 && Math.abs(G.life.H - G.life.M / K.H.wr) < 1e-9,
    `life S ${f2(G.life.S)} / M ${f2(G.life.M)} / H ${f2(G.life.H)} laps`);
  check('no set lasts the race (the hard past 100 % before the line): a stop at least', N / G.life.H > 1 && N / G.life.M > 2, `the whole race on one set: hard ${Math.round(N / G.life.H * 100)} %, medium ${Math.round(N / G.life.M * 100)} %`);
  const L = T.len, a = (laps) => r.autoCmp(laps * L);
  check('Samodejno by the share of the race left: the hard for the whole race, the medium for what it lasts within the cap, the soft for the last bit; the player starts on it (or on the chosen one)',
    a(N) === 'H' && a(G.life.M * S.w * 0.95) === 'M' && a(G.life.M * S.w * 1.05) === 'H' && a(G.life.S * S.w * 0.95) === 'S' && auto.player.ty.c === 'H' && own.player.ty.c === 'M' && auto.player.st.hist.join() === 'H' && own.player.st.hist.join() === 'M' && !auto.player.st.at,
    `${N} laps ${a(N)}, ${f2(G.life.M * S.w * 0.95)} laps ${a(G.life.M * S.w * 0.95)}, ${f2(G.life.S * S.w * 0.95)} laps ${a(G.life.S * S.w * 0.95)}; the player ${auto.player.ty.c} (chose M: ${own.player.ty.c})`);
}

// 3. the plans: a long race at Spa and at Bathurst (4 laps), an endurance race at Spa (6), a long race at Newcastle (10): every rival 1 or 2
// stops on laps 1 to N - 1, each stint within the wear cap, the window around each stop; both kinds of plans, several sequences and start
// tyres, the stops over several laps; each rival on its plan's first compound
{
  const races = [['spa', 2], ['bathurst', 2], ['spa', 3], ['newcastle', 2]].map(([id, k]) => ({ id, r: mk(id, { laps: lapsOf(id, k) }) }));
  const rows = [], okAll = [];
  for (const { id, r } of races) {
    const N = r.laps, G = r.strat, AI = AIof(r), P = AI.map(c => c.st.p);
    const valid = P.every((p, i) => { const c = AI[i], st = stints(p, N); return (p.at.length === 1 || p.at.length === 2) && p.seq.length === p.at.length + 1 && p.at.every((x, j) => x >= 1 && x <= N - 1 && (!j || x > p.at[j - 1]))
      && st.every((l, j) => l >= 1 && l / G.life[p.seq[j]] <= C.STRAT.w + 1e-9) && c.st.win.every((w, j) => w[0] <= p.at[j] && w[1] >= p.at[j] && w[0] > (j ? p.at[j - 1] : 0) && w[1] < (j + 1 < p.at.length ? p.at[j + 1] : N))
      && c.ty.c === p.seq[0] && c.st.hist.join() === p.seq[0] && c.st.laps.length === 0 && c.st.f === 1; });
    const two = P.filter(p => p.at.length === 2).length, seqs = new Set(P.map(p => p.seq)).size, starts = new Set(P.map(p => p.seq[0])).size, laps = new Set(P.flatMap(p => p.at)).size, most = Math.max(...G.load);
    const ok = valid && two >= 2 && two <= 8 && seqs >= (N > 4 ? 3 : 2) && starts >= 2 && laps >= Math.min(N - 1, N > 6 ? 4 : 2) && most <= AI.length * 0.75;
    okAll.push(ok); rows.push(`${id} ${N} laps${ok ? '' : ' NO'}: ${AI.map(txt).join(' ')} (two stops ${two}, ${seqs} sequences, stops on ${laps} laps, at most ${most} a lap)`);
  }
  check('every rival 1 or 2 stops within the wear cap, its window around each, on its first compound; both kinds of plans, several sequences, the stops spread', okAll.every(Boolean), rows.join('; '));
}

// 4. the same plan every time: no random number drawn for it (the race's field as without), the plan by the race's seed and the grid slot
// (another order of the drivers on the grid after qualifying: the same plans by slot), another seed another one
{
  let draws = 0; const counted = (s) => { const g = seeded(s); return () => { draws++; return g(); }; };
  const build = (o, s) => { Math.random = counted(s || 7); return new C.Race(track('spa'), Object.assign({}, base, { laps: 4 }, o)); };
  draws = 0; const a = build({ strat: true }); const dS = draws; draws = 0; const b0 = build({}); const d0 = draws;
  const b = build({ strat: true }, 99), q = build({ strat: true, aiOrder: [5, 3, 11, 0, 1, 2, 4, 6, 7, 8, 9, 10] }), o = build({ strat: true, seed: 12 });
  const plans = (r) => AIof(r).map(txt);
  const same = JSON.stringify(plans(a)) === JSON.stringify(plans(b)) && JSON.stringify(plans(a)) === JSON.stringify(plans(q)), diff = plans(o).filter((p, k) => p !== plans(a)[k]).length;
  const field = a.cars.every((c, k) => c.name === b0.cars[k].name && c.skill === b0.cars[k].skill && c.color === b0.cars[k].color && c.m.id === b0.cars[k].m.id);
  check('the same plans in every run, by the seed and the grid slot (another Math.random, other drivers in the slots after qualifying); no random number drawn for them (' + dS + ' as without: ' + d0 + ')',
    same && dS === d0 && field, plans(a).join(' '));
  check('another race\'s seed: other plans', diff >= 3, `seed 12: ${plans(o).join(' ')} (${diff} of 12 other)`);
}

// 5. fuel: the tank makes the stops, the tyres wear as ever (x1; the plans' laps on a set by STRAT.rate); every stint within a tank's laps
// (Spa: 2), an endurance race (6 laps) so on two stops each; a long one on stints of two laps; the sequences of every compound
{
  const e = mk('spa', { laps: 6, fuel: true }), l = mk('spa', { laps: 4, fuel: true }), L = e.track.len;
  const fit = (r) => AIof(r).every(c => stints(c.st.p, r.laps).every(x => x <= r.strat.fuelN));
  const cmps = new Set(AIof(e).concat(AIof(l)).flatMap(c => [...c.st.p.seq])).size;
  check('with fuel the tyres wear as ever (x1), every stint within a tank\'s laps (' + e.strat.fuelN + '): an endurance race on two stops each, a long one too within it; all three compounds in the plans',
    e.wst.wk === 1 && l.wst.wk === 1 && Math.abs(e.strat.life.M - 1 / (C.STRAT.rate * L)) < 1e-9 && e.strat.fuelN === 2 && fit(e) && fit(l) && AIof(e).every(c => c.st.p.at.length === 2) && cmps === 3,
    `mediums ${f2(e.strat.life.M)} laps; endurance ${AIof(e).map(txt).join(' ')}; long ${AIof(l).map(txt).join(' ')}`);
}

// 6. the stop (a long race at Newcastle, 10 laps): asked at the way in on the planned lap (not a lap before, however many others are on their
// way in); behind the safety car within the window; with heavy damage at once; never on the last lap
{
  const r = mk('newcastle', { flags: true }), T = r.track, L = T.len, P0 = T.def.pit, N = r.laps, AI = AIof(r);
  const at = (c, lap, m) => { c.dist = lap * L + P0[1] - m; c.vx = c.vz = 0; c.pitWant = false; r._stratStep(c); return c.pitWant; };   // (m metres before the way in on that lap)
  const A = AI.find(c => c.st.at[0] >= 2), B = AI.find(c => c.st.win[0][0] < c.st.at[0]);
  const early = at(A, A.st.at[0] - 1, 60), on = at(A, A.st.at[0], 60), far = at(A, A.st.at[0], 400);
  const others = AI.filter(c => c !== A); others.forEach(c => { c.pitWant = true; c.inPit = false; }); const pack = at(A, A.st.at[0], 60); others.forEach(c => { c.pitWant = false; });
  const lo = B.st.win[0][0], noSc = at(B, lo, 60); r.fl.sc = { state: 'out' }; const sc = at(B, lo, 60); r.fl.sc = null;
  A.dmg = 0.6; const dmg = at(A, 1, 60), last = at(A, N, 60); A.dmg = 0;
  check('in at the way in on the planned lap (60 m before it), not a lap before, not 400 m before; also with all the others on their way in',
    !early && on && !far && pack, `${txt(A)}: lap ${A.st.at[0] - 1} ${early}, lap ${A.st.at[0]} ${on} (400 m: ${far}, the others on their way: ${pack})`);
  check('the safety car out: a stop in its window comes early (a cheap one); heavy damage: in at once, but never on the last lap',
    !noSc && sc && dmg && !last, `${txt(B)} window ${B.st.win[0].join('-')}: lap ${lo} ${noSc}, under the safety car ${sc}; damaged on lap 1 ${dmg}, on the last ${last}`);
}

// 7. a stop made (Race.pitStep, the crew done): on the planned lap the planned tyres, the plan goes on; an early one counts as the planned
// stop and the rest is made again (one set cannot last: a stop more); in the rain the rain tyres ('W'); by the car's own wear (a car that
// wore its last set 30 % faster: shorter stints); every set and stop kept for the results, the player's too
{
  // (the car in its box at the end of `lap`, the crew's time up; its set worn k times as the plans' rate says, from the start)
  const stop = (r, c, lap, o) => {
    const T = r.track, L = T.len, b = r._boxD(c), i = T.idx(T.startS + b); o = o || {};
    c.place(T.px[i], T.pz[i], T.hd[i]); c.q = T.query(c.x, c.z, i, {}); c.dist = lap * L + b; c.ty.d0 = 0;
    if (o.k != null) c.ty.wear = o.k * c.dist / (r.strat.life[c.ty.c] * L);
    if (o.line != null) r.wst.line = o.line;
    c.inPit = true; c.pitState = 'repair'; c.pitT = 0; c.pitDur = 0; const n0 = c.ty.n; r.pitStep(c, DT, false); return c.ty.n === n0 + 1 && c.pitState === 'done' && c.ty.wear === 0;
  };
  const r = mk('newcastle', {}), N = r.laps, AI = AIof(r), G = r.strat;
  const A = AI.find(c => c.st.p.at.length === 2), pA = txt(A), s1 = stop(r, A, A.st.p.at[0], { k: 1 });
  const goesOn = s1 && A.ty.c === A.st.p.seq[1] && A.st.at.join() === A.st.p.at.slice(1).join() && A.st.seq === A.st.p.seq.slice(1) && A.st.hist.join('') === A.st.p.seq.slice(0, 2) && A.st.laps.join() === String(A.st.p.at[0]);
  const B = AI.find(c => c.st.p.at.length === 1 && c.st.p.at[0] >= 3), pB = txt(B), s2 = stop(r, B, 1, { k: 1 });
  const fits = (c, lap) => { const st = c.st.at.map((x, i) => x - (i ? c.st.at[i - 1] : lap)).concat([N - (c.st.at.length ? c.st.at[c.st.at.length - 1] : lap)]); return st.every((l, j) => l >= 1 && l / (G.life[c.st.seq[j]] / c.st.f) <= C.STRAT.w + 1e-9); };
  const again = s2 && B.st.at.length === 1 && B.st.at[0] > 1 && fits(B, 1) && B.st.hist.length === 2 && B.st.laps.join() === '1';
  const W = AI.find(c => c !== A && c !== B), s3 = stop(r, W, W.st.p.at[0], { k: 1, line: 1 }); r.wst.line = 0;
  const wet = s3 && W.ty.k === 'wet' && W.st.hist[1] === 'W';
  const F = AI.filter(c => c !== A && c !== B && c !== W && c.st.p.at.length === 1).sort((a, b) => a.st.p.at[0] - b.st.p.at[0])[0], pF = txt(F), lap0 = F.st.p.at[0];
  const rest = (N - lap0) / G.life[F.st.p.seq[1]], s4 = stop(r, F, lap0, { k: 1.3 });   // (the planned last stint as the plans' rate wears it: within the cap; 30 % faster: past it)
  const own = s4 && Math.abs(F.st.f - 1.3) < 1e-9 && rest <= C.STRAT.w && rest * 1.3 > C.STRAT.w && F.st.at.length === 1 && fits(F, lap0);
  const P = r.player; P.pitCmp = 'auto'; const sP = stop(r, P, 4, { k: 1 });
  check('a stop on the planned lap: the planned tyres, the rest of the plan as it was; the set and the lap kept (' + pA + ': ' + A.st.hist.join(' → ') + ' at ' + A.st.laps.join() + ')', goesOn, `next ${A.st.seq}@${A.st.at.join()}`);
  check('an early stop counts as the planned one, the rest made again from there (a set to the line would not last: one more, within the cap)', again, `${pB} → stopped on lap 1: ${B.st.hist.join(' → ')}, now ${B.st.seq}@${B.st.at.join()}`);
  check('in the rain the stop fits rain tyres (W in the results)', wet, W.st.hist.join(' → '));
  check('by the car\'s own wear: its last set worn 30 % faster than the plans\' rate, the rest made again on shorter sets (a stop more)', own, `${pF}: f ${f2(F.st.f)}, the last stint ${Math.round(rest * 100)} % → ${Math.round(rest * 130)} %; now ${F.st.seq}@${F.st.at.join()}`);
  check('the player\'s stop kept too (Samodejno: by the share of the race left)', sP && P.st.hist.length === 2 && P.st.hist[1] === r.autoCmp(N * r.track.len - P.dist) && P.st.laps.join() === '4', `${P.st.hist.join(' → ')} at ${P.st.laps.join()}`);
}

// 8. a long race at Crystal Palace (4 laps) to the line: the rivals stop as planned (or as made again), each its own sets; no tyre bursts;
// every car to the line; the stops in the results (every set, every stop's lap)
{
  const r = mk('cpalace', { flags: true, chars: true }), P = r.player, AI = AIof(r); r.start();
  let t = 0, k = 0; const burst = new Set(), maxW = new Map();
  while (t < 900 && !r.cars.every(c => c.finished)) {
    Math.random = seeded(3000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    for (const c of AI) { if (c.ty.bw >= 0) burst.add(c); if (!c.finished) maxW.set(c, Math.max(maxW.get(c) || 0, c.ty.wear)); }
  }
  const asPlan = AI.filter(c => c.st.hist.join('') === c.st.p.seq && c.st.laps.join() === c.st.p.at.join()).length, stopped = AI.every(c => c.st.hist.length >= 2 && c.st.hist.length === c.st.laps.length + 1);
  const rows = AI.map(c => `${txt(c)} → ${c.st.hist.join('')}@${c.st.laps.join(',')} (${Math.round(maxW.get(c) * 100)} %)`);
  check('a long race to the line: every rival stopped, most as planned (the others as their plan was made again), no tyre burst, nobody worn past 90 %',
    r.cars.every(c => c.finished) && stopped && asPlan >= 8 && !burst.size && AI.every(c => maxW.get(c) < 0.9), `${asPlan} of 12 as planned, ${Math.round(t)} s: ${rows.join('; ')}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
