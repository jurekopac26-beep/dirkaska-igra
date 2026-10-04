// Vršič: an open road with four ways to drive it on one card (def.modes: the race, the time trial, the duel in the traffic and the run from
// the police; the last two: tests/traffic.test.js, tests/police.test.js). The road 16.9 m wide, the sidewalks of Kranjska Gora and Jasna part
// of it (asphalt, drivable). In Core: opts.tt makes the time trial (the player alone on the start line), without it the race (12 AI behind
// the line on the circuits' grid), and an online race (opts.remote) is always the race; the cobbled hairpins (def.setts) are a surface of
// their own (7, 8 in the rain) with less grip, and the AI takes them slower; a whole race up the pass (12 AI + the player on autopilot):
// every car finishes and then pulls up in a slot of its own past the line, on both sides in turn, and stays there (never rescued, never
// pushed about by the ones still arriving; no AI car ever in a side road). The side roads (def.sideRoads, Track.stubs): there, the barrier
// open across their mouths and the same everywhere else; a car driven into one (Core.stubDrive) meets no wall until the rail at its end, its
// height runs on smoothly, its progress stays at the junction, no wrong way; it turns round and drives out; the cones across it go flying, also
// when a patrol car comes out.
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
{ // the road 16.9 m wide (between the barriers of a 13 m road, def.barW); in Kranjska Gora and at Jasna the sidewalks are part of it (asphalt to the kerb's far side), elsewhere past the edge the verge
  const at = (s, d) => { const i = T.idx(T.startS + s); return T.surface(T.query(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, i, {})); };
  const town = [300, 700, 1100, 1700, 2000].every(s => at(s, T.w + 1.6) === 0 && at(s, -T.w - 1.6) === 0), out = [4000, 6200, 9000].every(s => at(s, T.w + 1.6) !== 0 && at(s, 0) === 0);
  check('track: the road 16.9 m wide (the barriers of a 13 m road), the sidewalks in the villages part of it (drivable asphalt), the verge elsewhere; zebra crossings and bus stops', T.w === 8.45 && def.barW === 6.5 && T.walk && town && out && def.zebras.length === 5 && def.stops.length >= 10,
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
  let t = 0, k = 0, resc = 0, afterFin = 0, pushed = 0, inSide = 0;
  const parkedAt = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      if (c.q.deep) inSide++;   // (deep in a side road: never)
      if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; }
      if (c.parked) { const p = parkedAt.get(c); if (!p) parkedAt.set(c, [c.x, c.z]); else if (Math.hypot(c.x - p[0], c.z - p[1]) > 0.6) pushed++; }
    }
  }
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT);   // (30 s more: the last ones pull up)
    for (const c of r.cars) { if (c.parked) { const p = parkedAt.get(c); if (!p) parkedAt.set(c, [c.x, c.z]); else if (Math.hypot(c.x - p[0], c.z - p[1]) > 0.6) pushed++; } if (c.stuckT > 3.5) afterFin++; } }
  Math.random = orig;
  check('race: all 13 cars reach the pass (none of them ever into a side road)', fin.length === 13 && !inSide, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}, car-steps in a side road ${inSide}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn), and stays', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1) && Math.abs(p.d) > T.w - 2.6) && !pushed && !afterFin,
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' ') + (pushed ? `, pushed ${pushed}` : '') + (afterFin ? `, stuck ${afterFin}` : ''));
}

// 5. the side roads (def.sideRoads, Track.stubs): the streets, service roads and forest roads that meet the road
{
  const SR = def.sideRoads, S = T.stubs, T0 = new C.Track(Object.assign({}, def, { sideRoads: null }));
  const named = new Set(S.map(s => s.name).filter(Boolean)), inDem = S.every(s => { const D = def.dem; for (let j = 0; j < s.n; j++) if (s.x[j] < D.x0 || s.z[j] < D.z0 || s.x[j] > D.x0 + D.nx * D.cell || s.z[j] > D.z0 + D.nz * D.cell) return false; return true; });
  check('side roads: some 35 of them, in order along the road, both sides, streets, service roads and forest roads (the named streets of Kranjska Gora), on the terrain\'s map',
    S.length >= 30 && SR.every((r, k) => !k || r[0] >= SR[k - 1][0]) && S.every(s => Math.abs(s.side) === 1 && s.L > s.tb + 8 && s.Lend >= s.L && s.end >= 0 && s.end <= 2) && S.some(s => s.side < 0) && S.some(s => s.side > 0) &&
    [0, 1, 2].every(k => S.some(s => s.kind === k)) && ['Borovška cesta', 'Koroška ulica', 'Naselje Ivana Krivca'].every(n => named.has(n)) && inDem,
    `${S.length} side roads (${S.filter(s => s.side < 0).length} left, ${S.filter(s => s.side > 0).length} right; ${['streets', 'service roads', 'forest roads'].map((w, k) => S.filter(s => s.kind === k).length + ' ' + w).join(', ')}), ${S.filter(s => s.grav).length} gravel, open ${Math.min(...S.map(s => s.L)).toFixed(0)}-${Math.max(...S.map(s => s.L)).toFixed(0)} m; ends: ${['rails', 'gates', 'buildings'].map((w, e) => S.filter(s => s.end === e).length + ' ' + w).join(', ')}`);
  // the barriers as they were; open only across the mouths (nowhere else), and away from the junctions every query and every limit as on the road without them
  let same = true; for (let i = 0; i < T.N; i++) if (T.bl[i] !== T0.bl[i] || T.br[i] !== T0.br[i]) same = false;
  const near = (s) => S.some(x => Math.abs(x.s0 - s) < 90 || Math.abs(x.sF - s) < 90);
  let gaps = 0, stray = 0; for (const G of T.gap) for (let i = 0; i < T.N; i++) if (G[i]) { gaps++; if (!near(i * T.ds)) stray++; }
  let diff = 0, pts = 0; const q = {}, q0 = {}, n1 = [0, 0], n0 = [0, 0];
  for (let i = 3; i < T.N - 3; i += 7) { if (S.some(x => Math.abs(x.s0 - i * T.ds) < 260)) continue;
    for (const d of [-14, -11, -9.5, -8, 0, 8, 9.5, 11, 14]) { const x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d; T.query(x, z, i, q); T0.query(x, z, i, q0); pts++;
      if (q.k >= 0 || q.s !== q0.s || q.d !== q0.d || T.wall(q, 0.5, n1) !== T0.wall(q0, 0.5, n0) || T.surface(q) !== T0.surface(q0) || T.yAt(q) !== T0.yAt(q0)) diff++; } }
  check('side roads: the barriers the same, open only across their mouths; away from the junctions the road, its limits, surface and height exactly as without them',
    same && gaps > S.length * 4 && !stray && pts > 2000 && !diff, `${gaps} samples of open barrier (${stray} away from a junction), ${pts} points compared away from the junctions, ${diff} different`);
  // driven into one (Core.stubDrive, as the police would: in to the end, turned round, out): no wall until the rail, the height smooth, the progress
  // pinned at the junction while deep in it, no wrong way; the rail a wall; the cones across it knocked over by the car going in
  const pick = [S.find(s => s.name === 'Borovška cesta' && s.side > 0), S.filter(s => s.ang < 35).sort((a, b) => b.L - a.L)[0], S.find(s => s.ang > 140), S.find(s => s.kind === 2 && s.ang > 60 && s.ang < 100), S.find(s => s.end === 1)];
  const res = pick.map(St => {
    const o2 = Math.random; Math.random = seeded(77);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true })), P = r.player; r.start(); P.locked = false;
    r.setProps(T.stubCones(St.k), null); const cones = r.props.map(b => [b.x, b.z]);
    const back = St.ang > 100, i = T.idx(St.s0 + (back ? 16 : -45)), d = St.side * 2.5;
    P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + (back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; const v0 = back ? 5 : 12; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
    let ph = back ? 'in' : 'road', tP = 0, wall = 0, wallAt = '', maxDy = 0, py = null, dS = 0, dDist = 0, sDeep = null, distDeep = null, wrong = 0, railHit = 0, railT = 0, outOk = false;
    for (let k = 0; k < 120 * 150 && ph !== 'done'; k++) {
      if (ph === 'road') { C.aiControl(P, r, DT); if (P.speed > 9) { P.inThr = 0; P.inBrk = 0.4; } if (Math.abs(P.q.s - St.s0) < 14) ph = 'in'; }
      else if (ph === 'in') { if (C.stubDrive(P, r, St.k, 1)) { ph = 'rail'; tP = 0; } }
      else if (ph === 'rail') { P.inSteer = 0; P.inThr = 1; P.inBrk = 0; P.inHand = 0; tP += DT; if (tP > 2.5) { ph = 'stop'; tP = 0; } }   // (straight on into the rail)
      else if (ph === 'stop') { P.inThr = 0; P.inBrk = 0; P.inHand = 1; P.inSteer = 0; tP += DT; if (tP > 1) ph = 'out'; }   // (the handbrake: the brake pedal would reverse)
      else if (ph === 'out') { if (C.stubDrive(P, r, St.k, -1)) { ph = 'back'; tP = 0; } }
      else if (ph === 'back') { if (C.stubDrive(P, r, St.k, -1)) C.aiControl(P, r, DT); tP += DT; if (P.q.k < 0 && Math.abs(P.q.d) < T.w) { outOk = true; ph = 'done'; } if (tP > 10) ph = 'done'; }   // (past the barrier line the road's autopilot)
      P.hitWall = 0; const wt0 = P.wrongT; r.step(DT); const Q = P.q;
      if (Q.k === St.k) { if (py !== null && !P.air) maxDy = Math.max(maxDy, Math.abs(P.y - py)); if (P.wrongT > wt0) wrong++; }
      py = Q.k === St.k ? P.y : null;
      if (Q.deep) { if (sDeep === null) { sDeep = Q.s; distDeep = P.dist; } dS = Math.max(dS, Math.abs(Q.s - sDeep)); dDist = Math.max(dDist, Math.abs(P.dist - distDeep)); } else sDeep = null;
      if (P.hitWall > 0.3) { if (ph === 'rail' && Q.k === St.k && Q.st > St.L - 6) { railHit = Math.max(railHit, P.hitWall); railT = Math.max(railT, Q.st); } else if (ph !== 'rail') { wall++; wallAt = wallAt || `${ph} t ${Q.k >= 0 ? Q.st.toFixed(0) : '-'}`; } }
    }
    const knocked = r.props.filter((b, k) => Math.hypot(b.x - cones[k][0], b.z - cones[k][1]) > 0.3).length;
    Math.random = o2;
    return { St, ok: outOk && !wall && maxDy < 0.1 && dS < 1e-6 && dDist < 1e-6 && !wrong && railHit > 1 && railT < St.L && knocked > 0, txt: `${St.name || ['street', 'service', 'forest'][St.kind]} ${Math.round(St.s)} m ${St.side > 0 ? 'R' : 'L'} ${St.ang}°: ${outOk ? 'out' : 'NOT out'}, walls ${wall}${wallAt ? ' (' + wallAt + ')' : ''}, max step ${maxDy.toFixed(3)} m, progress ±${dS.toFixed(3)} m, wrong way ${wrong}, rail ${railHit.toFixed(1)} m/s at ${railT.toFixed(1)}/${St.L} m, cones ${knocked}/${cones.length}` };
  });
  check('side roads: driven into one: no wall until the rail at its end (a wall), the height smooth (< 0.1 m a step), the progress pinned at the junction deep in it, no wrong way, the cones knocked over; turned round, out onto the road again',
    res.every(x => x.ok) && pick.every(Boolean), res.map(x => x.txt).join(' | '));
  // the patrol cars knock them over too (Race.stepProps: the police's cars as well): one comes out of a side road onto the road
  {
    const o2 = Math.random; Math.random = seeded(78);
    const St = pick[0], r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 })), pc = r.pol.cars[0]; r.start();
    r.setProps(T.stubCones(St.k), null); const cones = r.props.map(b => [b.x, b.z]);
    C.stubPlace(pc, T, St.k, Math.min(St.L - 10, 60), -1); pc.locked = false;
    let out = false; for (let k = 0; k < 120 * 30 && !out; k++) { out = C.stubDrive(pc, r, St.k, -1); pc.step(DT, T); C.wallCollide(pc, T); r.stepProps(DT); }
    const knocked = r.props.filter((b, k) => Math.hypot(b.x - cones[k][0], b.z - cones[k][1]) > 0.3).length;
    Math.random = o2;
    check('side roads: a patrol car coming out of one knocks the cones over', out && knocked > 0, `${out ? 'out at the junction' : 'not out'}, ${knocked}/${cones.length} cones knocked`);
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
