// The checks every short road of docs/gorske-proge.md has (tests/<id>.test.js: const G = goreTrack(id); its own checks with G.check; G.done()):
// 1. the name: "Kraj, Država" as in the plan's table, the English one too, the side of the road they drive on; an open road with four ways to drive
//    it (the race, the time trial, the duel in the traffic, the run from the police), four checkpoints, no round of the big championship
// 2. the stage: 2.5-3 km between the lines (the plan), its altitudes the road's own, room for the grid of 22 below the start line and a run-out past
//    the finish
// 3. the data of the import (tools/proga-uvoz.mjs): the terrain and the land cover decode to their grids, the bends in order and turning the way
//    they say, the legs of the hairpins apart and the barriers off the asphalt, the grades, the side roads in order within the road drawn, the lifts
// 4. a whole race on autopilot (12 AI and the player): every car finishes, the player never rescued; past the line each car pulls up in a slot of
//    its own and stays there
// 5. a duel in the traffic on autopilot: both reach the finish, nobody on foot hit, no vehicle stuck for long
// 6. the medal times of the time trial: gold < silver < bronze, the rain slower, gold the stock rally car on the autopilot x 1.01
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./core.js');
const { DT, seeded } = require('./sim.js');

function goreTrack(id) {
  const C = loadCore();
  let bad = 0, n = 0;
  const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
  const def = C.TRACKS.find(d => d.id === id);
  if (!def) { console.log('FAIL no track ' + id); process.exit(1); }
  const T = new C.Track(def), wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
  const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'gorske-proge.md'), 'utf8').split('\n').map(l => l.split('|').map(c => c.trim())).find(c => c[2] === '`' + id + '`') || [];
  const left = /^leva/.test(row[5] || '');

  // 1. the name, the ways to drive it
  check('name: "Kraj, Država" as in the plan, in English too; driven on the ' + (left ? 'left' : 'right') + ' as the plan says', def.name === row[3] && def.en && def.en.name === row[4] && /^[^,]+, [^,]+$/.test(def.name) && !!def.leftHand === left,
    `${def.name} / ${def.en && def.en.name}, ${def.leftHand ? 'left' : 'right'}`);
  check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, not a round of the big championship',
    def.open && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes(id), `${T.cpS.length} checkpoints`);
  // 2. the stage
  check('stage: 2.5-3 km between the lines, the altitudes the road\'s own, room for 22 on the grid and a run-out past the finish', T.raceLen > 2450 && T.raceLen < 3050 &&
    Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1.5 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1.5 && T.startS >= 13 + 21 * 7.5 && T.len - T.finishS >= 100,
    `race ${Math.round(T.raceLen)} m, ${def.alt.join(' -> ')} m, ${Math.round(T.startS)} m below the start, ${Math.round(T.len - T.finishS)} m past the finish`);
  // 3. the data
  {
    const D = def.dem, L = def.lc, res = Buffer.from(D.res, 'base64'), span = D.rows.reduce((a, r) => a + r[1], 0), tr = Buffer.from(D.tr.b64, 'base64');
    const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; let cells = 0, cls = new Set();
    for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let m = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); m += e; } while (e === 63 && p < L.rle.length); } cells += m; cls.add(s >> 3); }
    check('data: the terrain (trend and residuals) and the land cover decode to their grids, the land cover classes 0-7', D.rows.length === D.nz && res.length === span && tr.length === D.tr.nx * D.tr.nz * 2 && cells === L.nx * L.nz && [...cls].every(c => c >= 0 && c <= 7),
      `terrain ${D.nx}x${D.nz} (${span} residuals), land cover ${L.nx}x${L.nz}, classes ${[...cls].sort().join(',')}`);
  }
  {
    const B = def.bends || [], turn = B.map(([d]) => { const a = T.idx(T.startS + d - 45), b = T.idx(T.startS + d + 45); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
    const okB = B.every((b, k) => (!k || b[0] > B[k - 1][0]) && Math.sign(turn[k]) === b[2] && Math.abs(turn[k]) > 0.8);
    check('bends: in order along the road, each turning the way its side says (over ~45 degrees within 90 m)', B.length > 0 && okB, B.map((b, k) => `${Math.round(b[0])}:${b[2] > 0 ? 'R' : 'L'}${Math.round(turn[k] * 57.3)}`).join(' '));
    let dmin = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) dmin = Math.min(dmin, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
    let bmin = 1e9; for (let i = 0; i < T.N; i++) bmin = Math.min(bmin, T.bl[i], T.br[i]);
    let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
    check('the road: the legs of the hairpins 20 m apart or more, the barriers 3 m past the asphalt or more, nowhere steeper than 12 %', dmin >= 20 && bmin >= T.w + 2.9 && gmax < 0.12,
      `legs ${dmin.toFixed(1)} m apart at the closest, barriers ${(bmin - T.w).toFixed(2)} m past the edge, steepest ${(gmax * 100).toFixed(1)} %`);
  }
  {
    const SR = def.sideRoads || [], okS = SR.every((r, k) => (!k || r[0] >= SR[k - 1][0]) && r[0] > -T.startS && r[0] < T.len - T.startS && (r[1] === 1 || r[1] === -1) && r[10].length >= 6 && r[10].length % 3 === 0 && r[9] === '');
    const LF = def.lifts || [], okL = LF.every(l => ['gondola', 'chair', 'drag', 'platter', 'rope', 'carpet'].includes(l[0]) && l[2].length >= 6 && l[2].length % 3 === 0);
    check('the side roads in order within the road drawn, on a side each, no names (Pravna varnost); the lifts with their lines', okS && okL && (T.stubs || []).length === SR.length,
      `${SR.length} side roads, ${LF.length} lifts, ${(def.bld || []).length} buildings`);
  }
  // 4. a whole race on autopilot
  {
    const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({})), P = r.player; r.start();
    let t = 0, k = 0, resc = 0;
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }
    Math.random = orig;
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
    check('race: all 13 cars reach the finish, the player never rescued', fin.length === 13 && !resc, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), rescues ${resc}`);
    const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { s: q.s, d: q.d, v: c.speed, parked: !!c.parked }; });
    const apart = slots.every((a, i) => slots.every((b, j) => i === j || Math.hypot(a.s - b.s, a.d - b.d) > 2.5));
    check('race: past the line every car stands in a slot of its own', slots.every(p => p.parked && p.v < 0.3 && p.s > T.finishS) && apart, slots.map(p => `${(p.s - T.finishS).toFixed(0)}/${p.d.toFixed(1)}`).join(' '));
  }
  // 5. a duel in the traffic on autopilot
  {
    const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
    let t = 0, k = 0, standMax = 0; const stand = new Map();
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(7000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); } }
    Math.random = orig;
    const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
    check('duel: both reach the finish through the traffic, no one on foot hit, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
      `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
  }
  // 6. the medals
  {
    const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
    const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig;
    check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
      `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
  }
  return { C, def, T, check, done() { console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`); process.exitCode = bad ? 1 : 0; } };
}

module.exports = { goreTrack };
