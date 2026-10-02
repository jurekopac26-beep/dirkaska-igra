// Katu-Jaryk: the descent of the Katu-Yaryk pass (Altai), a gravel time trial DOWNHILL (def.descent): from the edge of the Ulagan plateau down
// seven hairpins and the steep traverse to the Chulyshman valley. The track (open, gravel, the altitudes falling 1242 -> 683 m, the hairpins on the
// centre line and their legs apart), the AI's braking with the slope (only on a descent: the climbs and the rally stage keep their speed
// profiles), a whole run on the autopilot (dry and in the rain), the co-driver's notes and the medal times.
//   node tests/katu.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'katu'), T = new C.Track(def);

// 1. the track: an open gravel road, a time trial down the hill; ~4.7 km from the start line to the flying finish, ~559 m lower
check('track: an open gravel road, a time trial downhill (def.descent), 4 checkpoints in order, not in the big championship',
  def.open && def.timeTrial && def.descent && def.roadSurface === 'makadam' && T.cpS.length === 4 && T.raceLen > 4500 && T.raceLen < 4800 && T.cpS.every((s, k) => k === 0 || s > T.cpS[k - 1]) && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('katu'),
  `${Math.round(T.raceLen)} m, checkpoints ${T.cpS.map(s => Math.round(s - T.startS)).join(', ')} m`);
{
  const drop = T.hStart - T.hFinish, a0 = T.altAt(T.hStart), a1 = T.altAt(T.hFinish);
  let up = 0, gmax = 0; for (let i = T.startIdx + 1; i <= T.finishIdx; i++) { up = Math.max(up, T.hy[i] - Math.min(...T.hy.subarray(T.startIdx, i))); gmax = Math.max(gmax, -T.grade[i]); }
  check('track: the finish ~559 m below the start (1242 -> 683 m on the HUD), falling all the way, the steepest grade 20-23 %, ~12 % on average',
    drop > 550 && drop < 568 && Math.round(a0) === 1242 && Math.round(a1) === 683 && up < 0.3 && gmax > 0.2 && gmax < 0.23 && drop / T.raceLen > 0.11 && drop / T.raceLen < 0.13,
    `${drop.toFixed(1)} m down, ${Math.round(a0)} -> ${Math.round(a1)} m, never up more than ${up.toFixed(2)} m, steepest ${(gmax * 100).toFixed(1)} %, average ${(drop / T.raceLen * 100).toFixed(1)} %`);
}
{ // the seven hairpins: each turns 130-200 deg within 60 m round its place, no tighter than 10 m on the centre line; the legs of the ladder apart
  const turn = (d) => { let a = 0; for (let s = d - 30; s <= d + 30; s += T.ds) a += T.k[T.idx(T.startS + s)] * T.ds; return a * 180 / Math.PI; };
  const hp = def.hairpins.map(([d, alt, dir]) => ({ d, dir, deg: turn(d), alt, real: Math.round(T.altAt(T.hy[T.idx(T.startS + d)])) }));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  check('track: seven hairpins at def.hairpins, each turning 130-200 deg its way, the altitude on its sign the road\'s, no bend under a 10 m radius',
    hp.length === 7 && hp.every(h => Math.abs(h.deg) > 130 && Math.abs(h.deg) < 200 && Math.sign(h.deg) === h.dir && Math.abs(h.alt - h.real) <= 2) && 1 / kmax >= 10,
    hp.map(h => `${h.d} m ${Math.round(h.deg)}° ${h.alt}/${h.real} m`).join(', ') + `; tightest radius ${(1 / kmax).toFixed(1)} m`);
  let near = 1e9, at = null; for (let i = 0; i < T.N; i += 2) for (let j = i + 30; j < T.N; j += 2) { const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d < near) { near = d; at = [i, j]; } }
  let barMin = 1e9; for (let i = 0; i < T.N; i++) barMin = Math.min(barMin, T.bl[i] - T.w, T.br[i] - T.w);
  check('track: the legs of the hairpin ladder at least 20 m apart (60 m or more along the road), a barrier on every side past the road\'s edge',
    near >= 20 && barMin >= 3, `nearest legs ${near.toFixed(1)} m apart (at ${at.map(i => Math.round(i * T.ds - T.startS)).join(' / ')} m), barriers at least ${barMin.toFixed(2)} m past the edge`);
}

// 2. the AI's braking on the descent: the slope's pull in its speed profile (the same as the closed circuits' def.gradeForce), only on a descent
{
  const flat = new C.Track(Object.assign({}, def, { descent: false })), a = T.speedProfile(C.CSK.aiLatA, C.CSK.aiBrakeA, 85, C.CSK.aiWmax), b = flat.speedProfile(C.CSK.aiLatA, C.CSK.aiBrakeA, 85, C.CSK.aiWmax);
  let lower = 0, higher = 0, most = 0; for (let i = 0; i < T.N; i++) { if (a[i] < b[i] - 0.01) lower++; if (a[i] > b[i] + 1e-6) higher++; most = Math.max(most, b[i] - a[i]); }
  check('AI: on the descent it brakes earlier for the bends (the slope pulls), never later; no other track is a descent',
    lower > 200 && !higher && most > 1 && C.TRACKS.filter(d => d.descent).map(d => d.id).join() === 'katu', `${lower} samples slower, ${higher} faster, up to ${(most * 3.6).toFixed(1)} km/h; descents: ${C.TRACKS.filter(d => d.descent).map(d => d.id).join()}`);
}

// 3. a whole run on the autopilot (the stock rally car, as the medal times were set): to the flying finish without a rescue or a wall; in the rain
// slower; the splits in order
const run = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain, tt: true });
    r.start(); const P = r.player; let t = 0, k = 0, walls = 0, resc = 0, vmax = 0;
    while (t < 400 && !P.finished) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.hitWall > 3) walls++; P.hitWall = 0; vmax = Math.max(vmax, P.speed); if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    return { r, P, walls, resc, vmax, alone: r.cars.length === 1 && r.timeTrial };
  } finally { Math.random = orig; }
};
{
  const d = run(0), w = run(1), g = def.medals.cs[0] / 1.01, gw = def.medals.wet.cs[0] / 1.01;
  check('run: the player alone, to the flying finish on the autopilot, no rescue, no wall; within 1.5 % of the gold medal\'s base',
    d.alone && d.P.finished && !d.resc && !d.walls && Math.abs(d.P.finishTime / g - 1) < 0.015 && d.P.splits.length === 4 && d.P.splits.every((s, k) => k === 0 || s > d.P.splits[k - 1]),
    `${d.P.finishTime && d.P.finishTime.toFixed(2)} s (gold ${def.medals.cs[0]} s), splits ${d.P.splits.map(s => s.toFixed(1)).join(' / ')}, ${d.resc} rescues, ${d.walls} walls, top ${(d.vmax * 3.6).toFixed(0)} km/h`);
  check('run in the rain: to the finish, no rescue, 5-12 % slower than in the dry, within 1.5 % of the wet gold\'s base',
    w.P.finished && !w.resc && w.P.finishTime / d.P.finishTime > 1.05 && w.P.finishTime / d.P.finishTime < 1.12 && Math.abs(w.P.finishTime / gw - 1) < 0.015,
    `${w.P.finishTime && w.P.finishTime.toFixed(2)} s (${((w.P.finishTime / d.P.finishTime - 1) * 100).toFixed(1)} % slower, gold ${def.medals.wet.cs[0]} s), ${w.resc} rescues`);
}

// 4. the co-driver (a gravel descent reads its notes as a rally stage does): every hairpin called, in order, the last call to the finish
{
  const N = T.paceNotes(), txt = N.map(c => c.text), hairs = txt.reduce((a, t) => a + (t.match(/hairpin (left|right)/g) || []).length, 0);
  check('co-driver: calls in order within the run, the seven hairpins called, the last call to the finish',
    N.length > 10 && N.every((c, k) => c.s >= T.startS && c.s < T.finishS && (k === 0 || c.s > N[k - 1].s)) && hairs === 7 && /to finish$/.test(txt[txt.length - 1]),
    `${N.length} calls, ${hairs} hairpins: ${txt.filter(t => /hairpin/.test(t)).join(' | ')}`);
}

// 5. the medal times and the places
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('medals: gold < silver < bronze, dry and wet; the rain slower', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0], `dry ${M.cs}, wet ${M.wet.cs}`);
  const L = T.names;
  check('places: the pass, the seven hairpins, the traverse and the valley, in order along the run, the commentator\'s lines for the pass and the valley',
    L.length === 10 && /^Prelaz Katu-Jaryk/.test(L[0].n) && L.filter(p => /^Serpentina \d/.test(p.n)).length === 7 && /^Dolina Čulišmana/.test(L[9].n) && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && !!L[0].say && !!L[9].say,
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
