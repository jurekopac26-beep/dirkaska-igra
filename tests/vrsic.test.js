// Vršič: an open road with four ways to drive it on one card (def.modes: the race, the time trial, the duel in the traffic and the run from
// the police; the last two: tests/traffic.test.js, tests/police.test.js). The road 13 m wide, the sidewalks of Kranjska Gora and Jasna part
// of it (asphalt, drivable). In Core: opts.tt makes the time trial (the player alone on the start line), without it the race (12 AI behind
// the line on the circuits' grid), and an online race (opts.remote) is always the race; the cobbled hairpins (def.setts) are a surface of
// their own (7, 8 in the rain) with less grip, and the AI takes them slower; a whole race up the pass (12 AI + the player on autopilot):
// every car finishes and then pulls up in a slot of its own past the line, on both sides in turn, and stays there (never rescued, never
// pushed about by the ones still arriving).
//   node tests/vrsic.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'vrsic'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);

// 1. the track: an open road, both ways to drive it, its hairpins and cobbles; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), not a time trial only', def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
{ // the road 13 m wide; in Kranjska Gora and at Jasna the sidewalks are part of it (asphalt to the kerb's far side), elsewhere past the edge the verge
  const at = (s, d) => { const i = T.idx(T.startS + s); return T.surface(T.query(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, i, {})); };
  const town = [300, 700, 1100, 1700, 2000].every(s => at(s, T.w + 1.6) === 0 && at(s, -T.w - 1.6) === 0), out = [4000, 6200, 9000].every(s => at(s, T.w + 1.6) !== 0 && at(s, 0) === 0);
  check('track: the road 13 m wide, the sidewalks in the villages part of it (drivable asphalt), the verge elsewhere; zebra crossings and bus stops', T.w === 6.5 && T.walk && town && out && def.zebras.length === 5 && def.stops.length >= 10,
    `half width ${T.w} m, sidewalks ${def.walks.map(w => w[0] + '-' + w[1] + ' m').join(', ')}, ${def.zebras.length} zebras, ${def.stops.length} bus stops`);
}
check('track: 24 numbered hairpins, the cobbled stretches marked on the samples', def.hairpins.length === 24 && T.settAt && T.settAt.reduce((a, b) => a + b, 0) > 300,
  `${def.hairpins.length} hairpins, ${def.setts.length} cobbled stretches, ${T.settAt ? T.settAt.reduce((a, b) => a + b, 0) : 0} samples`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('vrsic'));

// 2. the surface: cobbles (7) on the setts, cobbles in the rain (8), asphalt (0) on the road between; less grip on them, the rain less still
{
  const [a, b] = def.setts[5], mid = T.startS + (a + b) / 2, i = T.idx(mid), q = T.query(T.px[i], T.pz[i], i, {}), j = T.idx(T.startS + (b + def.setts[6][0]) / 2), q2 = T.query(T.px[j], T.pz[j], j, {});
  const dry = T.surface(q); T.inRain = true; const wet = T.surface(q), wet0 = T.surface(q2); T.inRain = false; const dry0 = T.surface(q2);
  check('surface: cobbles on the setts (7, in the rain 8), asphalt between them', dry === 7 && wet === 8 && dry0 === 0 && wet0 === 0, `setts ${dry}/${wet}, between ${dry0}/${wet0}`);
  check('surface: the cobbles grip less than asphalt, in the rain less still', C.CSSURF[7].lat < C.CSSURF[0].lat && C.CSSURF[8].lat < C.CSSURF[7].lat && C.CSSURF[7].tr < C.CSSURF[0].tr && C.CSSURF[8].tr < C.CSSURF[7].tr,
    `side grip ${C.CSSURF[0].lat} / ${C.CSSURF[7].lat} / ${C.CSSURF[8].lat}, traction ${C.CSSURF[0].tr} / ${C.CSSURF[7].tr} / ${C.CSSURF[8].tr}`);
  // (the tightest hairpins are held by the AI's turn-rate cap, the same in the rain; the rain makes the wider ones slower)
  const r = new C.Race(T, opts({})), rw = new C.Race(T, opts({ rain: 1 })), ks = def.setts.map(([s0, s1]) => T.idx(T.startS + (s0 + s1) / 2));
  const cap = (k, latA) => Math.sqrt(latA * 0.9 / Math.max(Math.abs(T.rk[k]), 1e-5)) + 1e-3, onCob = ks.filter(k => r.vprof[k] <= cap(k, C.CSK.aiLatA)).length;
  const slower = ks.filter(k => rw.vprof[k] < r.vprof[k] - 0.01).length, faster = ks.filter(k => rw.vprof[k] > r.vprof[k] + 1e-6).length;
  check('AI: its speed profile takes the cobbled hairpins at the cobbles\' grip; in the rain none faster, the wider ones slower', onCob === ks.length && !faster && slower > 0,
    `${onCob}/${ks.length} hairpins at the cobbles' grip, in the rain ${slower} slower, ${faster} faster`);
}

// 3. the two ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  check('mode: opts.tt is the time trial, the player alone on the start line', tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5, `${tt.cars.length} car, ${tt.player.dist.toFixed(1)} m from the line`);
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: without it the race, 13 cars on the circuits\' grid behind the line (7.5 m apart, in two columns)', !race.timeTrial && race.cars.length === 13 && backs[0] >= 8.9 && backs[12] < T.startS - 5 && backs.every((b, k) => !k || b - backs[k - 1] > 7),
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  let minGap = 1e9; for (const a of race.cars) for (const b of race.cars) if (a !== b) minGap = Math.min(minGap, Math.hypot(a.x - b.x, a.z - b.z));
  check('mode: the grid slots fit on the narrow road (no car on another, all on the asphalt)', minGap > 4 && race.cars.every(c => Math.abs(T.query(c.x, c.z, -1, {}).d) < T.w - 0.9), `closest two ${minGap.toFixed(1)} m apart`);
  check('mode: an online race (opts.remote) is always the race', !net.timeTrial && net.cars.length === 2);
  Math.random = orig;
}

// 4. a whole race up the pass on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, afterFin = 0, pushed = 0;
  const parkedAt = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; }
      if (c.parked) { const p = parkedAt.get(c); if (!p) parkedAt.set(c, [c.x, c.z]); else if (Math.hypot(c.x - p[0], c.z - p[1]) > 0.6) pushed++; }
    }
  }
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT);   // (30 s more: the last ones pull up)
    for (const c of r.cars) { if (c.parked) { const p = parkedAt.get(c); if (!p) parkedAt.set(c, [c.x, c.z]); else if (Math.hypot(c.x - p[0], c.z - p[1]) > 0.6) pushed++; } if (c.stuckT > 3.5) afterFin++; } }
  Math.random = orig;
  check('race: all 13 cars reach the pass', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn), and stays', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1) && Math.abs(p.d) > T.w - 2.6) && !pushed && !afterFin,
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' ') + (pushed ? `, pushed ${pushed}` : '') + (afterFin ? `, stuck ${afterFin}` : ''));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
