// The rivals' train against the reference video (docs/nova-fizika-meritve.md §4): races of 12 AI + the player on autopilot from the back
// of the grid at the field's middle pace (PSK: its skill), as the game (driver characters, slipstream, flags), on eight real tracks. node train.js [phys] ; env OV='{"K":{…},"A":[…]}'
// (NVK / NVASSIST as tune.js), TR=spa,…, LAPS (4), N (rivals, 12), GRID (the player's slot, last), DIFF (1), MODEL (a model id for every
// car; default the mixed field)
// prints: the gap to the car ahead in a train (rear to rear in car lengths, and in s), a rival alongside the player and alongside a
// rival (share of time), the AI-AI passes a minute (and the share passed back within 10 s), the field's spread (first to last AI over
// the line) after lap 1 and its growth a lap, in s and in % of the leader's lap
'use strict';
const ROOT = process.env.GAME_ROOT || require('path').resolve(__dirname, '../..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const { seeded } = require(ROOT + '/tests/lib/sim.js');
const C = loadCore();
const ov = JSON.parse(process.env.OV || '{}'); Object.assign(C.NVK, ov.K || {}); (ov.A || []).forEach((a, i) => a && Object.assign(C.NVASSIST[i], a));
const HOLD = +(process.env.HOLD || 1), DT = 1 / 120, phys = process.argv[2] || 'nova', LAPS = +(process.env.LAPS || 4), NAI = +(process.env.N || 12), DIF = +(process.env.DIFF || 1);
const q = (a, p) => { a = a.filter(Number.isFinite).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : NaN; };
const f = (x, d = 2) => Number.isFinite(x) ? (+x).toFixed(d) : '-';
const gapL = [], gapT = [], tot = { side: 0, n: 0, aiSide: 0, aiN: 0, pass: 0, back: 0, min: 0 }, spread1 = [], grow = [], growP = [], rows = [];
for (const tid of (process.env.TR || 'bathurst,spa,suzuka,monaco,rbring,detroit,montreal,townsville').split(',')) {
  Math.random = seeded(3);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid)), M = process.env.MODEL ? C.MODELS.find(m => m.id === process.env.MODEL) : null;
  const o = { numAI: NAI, playerGrid: +(process.env.GRID || NAI + 1), laps: LAPS, playerModel: M || C.MODELS[4], assist: 2, seed: 9, difficulty: DIF, damage: 2, phys, chars: true, slip: true, flags: true };
  if (M) o.fieldModel = M;
  const r = new C.Race(T, o); r.start();
  const AIs = r.cars.filter(c => !c.isPlayer).map(c => c.skill).sort((a, b) => a - b);
  r.player.skill = process.env.PSK ? +process.env.PSK : AIs[AIs.length >> 1];   // (the player's autopilot at the field's middle pace: in the pack as the video's player, not off alone ahead)
  const P = r.player, AI = r.cars.filter(c => c !== P), lapAt = new Map(AI.map(c => [c, []])), pairs = new Map(), last = new Map();
  let t = 0, passes = 0, back = 0, side = 0, n = 0, aiSide = 0, aiN = 0;
  for (let i = 1; i <= (LAPS + 1) * 200 / DT && !r.cars.every(c => c.finished); i++) {
    Math.random = seeded(9 + i); C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of AI) { const L = lapAt.get(c); if (c.lap > L.length && c.lap >= 1) L.push(t); }
    if (i % 12 || t < 8) continue;
    // the train: each AI with a car ahead within 1 s on its line (rear to rear: the dist apart)
    const S = r.cars.filter(c => !c.finished && c.speed > 8).sort((a, b) => b.dist - a.dist);
    for (let k = 1; k < S.length; k++) { const a = S[k], b = S[k - 1], d = b.dist - a.dist; if (a === P) continue;
      if (d / a.speed < 1 && Math.abs(b.q.d - a.q.d) < 1.5) { gapL.push(d / a.m.len); gapT.push(d / a.speed); } }
    // alongside: another car within a car's length along the road and 3.2 m across (the player; and each rival)
    const al = (c) => r.cars.some(o2 => o2 !== c && !o2.finished && Math.abs(o2.dist - c.dist) < c.m.len && Math.abs(o2.q.d - c.q.d) < 3.2);
    if (P.speed > 8 && !P.finished) { n++; if (al(P)) side++; }
    for (const c of AI) if (c.speed > 8 && !c.finished) { aiN++; if (al(c)) aiSide++; }
    // AI-AI passes: a pair's order flipped and held 1 s (not in the pits); passed back within 10 s
    for (let a = 0; a < AI.length; a++) for (let b = a + 1; b < AI.length; b++) {
      const A = AI[a], B = AI[b]; if (A.finished || B.finished || A.inPit || B.inPit) continue;
      const key = a * 64 + b, sg = Math.sign(A.dist - B.dist), p = pairs.get(key);
      if (!p) { pairs.set(key, { sg, cand: sg, since: t }); continue; }
      if (sg !== p.cand) { p.cand = sg; p.since = t; }
      else if (sg !== p.sg && t - p.since >= HOLD) { p.sg = sg; passes++; const l = last.get(key); if (l != null && t - l < 10) back++; last.set(key, t); }
    }
  }
  // the spread: first to last AI over the line at each lap's end
  const sp = []; for (let k = 0; k < LAPS; k++) { const ts = AI.map(c => lapAt.get(c)[k]).filter(Number.isFinite); if (ts.length >= AI.length - 1) sp.push(Math.max(...ts) - Math.min(...ts)); }
  const lead = AI.map(c => c.lapTimes.slice(1)).flat(), lapRef = q(lead, 0);
  if (sp.length >= 2) { spread1.push(sp[0]); const g = (sp[sp.length - 1] - sp[0]) / (sp.length - 1); grow.push(g); growP.push(g / lapRef * 100); }
  const min = t / 60; tot.pass += passes; tot.back += back; tot.min += min; tot.side += side; tot.n += n; tot.aiSide += aiSide; tot.aiN += aiN;
  rows.push(`${tid.padEnd(12)} lap ${f(lapRef, 1)} s | spread ${sp.map(x => f(x, 1)).join(' ')} s | passes ${f(passes / min, 1)}/min (back ${passes ? f(back / passes * 100, 0) : '-'} %) | player alongside ${f(side / Math.max(1, n) * 100, 0)} %`);
}
console.log(rows.join('\n'));
console.log(`${phys} ${JSON.stringify(ov)} | train gap p25/50/75 ${f(q(gapL, 0.25))}/${f(q(gapL, 0.5))}/${f(q(gapL, 0.75))} lengths, ${f(q(gapT, 0.25))}/${f(q(gapT, 0.5))}/${f(q(gapT, 0.75))} s (n ${gapL.length})` +
  ` | alongside: player ${f(tot.side / Math.max(1, tot.n) * 100, 0)} %, rivals ${f(tot.aiSide / Math.max(1, tot.aiN) * 100, 0)} % | AI-AI passes ${f(tot.pass / tot.min, 1)}/min (${f(tot.pass / tot.min / NAI, 2)} a rival), back in 10 s ${f(tot.back / Math.max(1, tot.pass) * 100, 0)} %` +
  ` | spread after lap 1 p50 ${f(q(spread1, 0.5), 1)} s, a lap +${f(q(grow, 0.5), 2)} s (${f(q(growP, 0.5), 2)} % of the lap)`);
