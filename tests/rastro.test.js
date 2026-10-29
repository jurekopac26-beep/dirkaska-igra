// Serra do Rio do Rastro: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time
// trial, the duel in the traffic and the run from the police). The road: the real line up the 17 numbered bends (def.curves, from the bottom:
// 11 of them hairpins of 150 degrees and more, stacked on the wall of the Serra Geral), from ~1010 m to the viewpoint at ~1420 m in under 5 km,
// the climb on the legs between the hairpins (the hairpins themselves flatter), the legs of the ladder far enough apart for the barriers. The
// open road's traffic is its own mix (def.traffic): no lorries, many motorbikes. A whole race up to the viewpoint (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the top and
// the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/rastro.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'rastro'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, at most 5 km; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 11 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5.5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: up the Serra (~1010 m) to the viewpoint (~1420 m), at most 5 km', Math.abs(def.alt[0] - 1010) < 15 && Math.abs(def.alt[1] - 1421) < 15 && T.raceLen > 4900 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('rastro'));

// 2. the 17 bends: in order up the road, each a real bend of the line the way its sign says (over the 70 m round it: the 11 hairpins 150 degrees
// and more, the others 100 and more), the hairpins as tight as the game allows them (a radius of 8.5 m or more); their altitudes as the road's own
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 35), b = T.idx(T.startS + d + 35); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 1.5 && Math.sign(a) === cv[k][2]);
  const hair = turn.filter(a => Math.abs(a) > 2.6).length, own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  let mk = 0; for (let i = T.startIdx; i < T.finishIdx; i++) mk = Math.max(mk, Math.abs(T.k[i]));
  check('bends: 17, in order up the road, each a bend the way its sign says (11 hairpins), none tighter than 8.5 m', cv.length === 17 && order && bends && hair === 11 && 1 / mk > 8.5,
    `${cv.length} bends, turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, tightest radius ${(1 / mk).toFixed(1)} m`);
  check('bends: the first at ~1020 m, the 17th at ~1345 m, each one\'s altitude the road\'s', Math.abs(alt[0] - 1023) < 10 && Math.abs(alt[16] - 1344) < 10 && own,
    `bend 1 ${Math.round(alt[0])} m, bend 17 ${Math.round(alt[16])} m`);
  check('bends: the HUD and the commentator know them (Serpentina 1 .. 17, the waterfall, the viewpoint at the finish)', T.names.filter(q => /^Serpentina \d+/.test(q.n)).length === 17 && T.names.some(q => q.n === 'Cascata Rio do Rastro' && q.say) && /^Mirante/.test(T.names[T.names.length - 1].n),
    T.names.length + ' places');
  // the climb is on the legs: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~13.5 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const hp = cv.filter((c, k) => Math.abs(turn[k]) > 2.6), near = (s) => hp.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => hp.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s) && s - T.startS < cv[16][0]) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, nowhere steeper than ~13.5 %', gin / nin < 0.75 * gout / nout && gmax < 0.135,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the ladder: the legs stacked on the cliff are far enough apart that each keeps its own barriers (never nearer than 1.5 m past the asphalt,
// never past halfway to the next leg)
{
  let worst = 1e9, close = 1e9;
  for (let i = T.startIdx; i < T.finishIdx; i += 2) {
    worst = Math.min(worst, T.bl[i], T.br[i]);
    for (let j = T.startIdx; j < T.finishIdx; j += 2) { if (Math.abs(i - j) * T.ds < 70) continue; close = Math.min(close, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  }
  check('ladder: the legs at least ~17.5 m apart, the barriers at least 1.5 m past the asphalt', close > 17.5 && worst >= T.w + 1.5, `legs ${close.toFixed(1)} m apart at the closest, barriers ${(worst - T.w).toFixed(2)} m past the edge`);
}

// 4. the open road's traffic: cars, vans, coaches and many motorbikes both ways, no lorries
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const moto = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: no lorries, motorbikes a good share, both ways', !tf.veh.some(v => v.p === 5) && moto.length >= 4 && moto.some(v => v.dir > 0) && moto.some(v => v.dir < 0) && cars.length > moto.length,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${tf.veh.filter(v => v.kind === 2).length} coaches, ${moto.length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 6. a whole race up to the viewpoint on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the viewpoint', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the viewpoint, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const ev = r.tf, hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the viewpoint through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${ev.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
