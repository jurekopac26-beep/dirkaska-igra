// Los Caracoles: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic
// and the run from the police). The road: the real line up the 29 numbered curves (def.curves, numbered from the bottom as on the real road:
// the first twenty on the ladder from ~2275 m to ~2550 m, the last at the Llano La Calavera at ~2800 m), the climb on the legs between the
// hairpins (the hairpins themselves flatter), the barriers closing in to the walls of the two avalanche galleries (def.galleries). The
// open road's traffic is its own mix (def.traffic): trucks and coaches outnumber the cars; Vršič's traffic has no trucks. A whole race up to
// Portillo (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic
// on autopilot: both reach Portillo and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/caracoles.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'caracoles'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 16.9 m wide (1.3 x the drawn 13 m)',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === def.halfWidth * 1.3,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the Juncalillo river (~2200 m) up to Portillo (~2870 m), ~10.8 km', Math.abs(def.alt[0] - 2200) < 20 && Math.abs(def.alt[1] - 2868) < 20 && T.raceLen > 10500 && T.raceLen < 11000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('caracoles'));

// 2. the 29 curves: in order up the road, each a real bend of the line (over 120 m round it: the 19 hairpins of the ladder 150 degrees and more,
// the bends at its top and at the north-east corner of the long traverse less), the first twenty
// between ~2275 m and ~2550 m, the last (29, the Llano La Calavera) at ~2800 m; their altitudes as the road's own
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 0.75 && Math.sign(a) === cv[k][2]);
  const hair = turn.slice(0, 19).filter(a => Math.abs(a) > 2.6).length, own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('curves: 29, in order up the road, each a bend the way its sign says (19 hairpins on the ladder)', cv.length === 29 && order && bends && hair === 19,
    `${cv.length} curves, turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('curves: the first twenty from ~2275 m to ~2560 m, the 29th at ~2800 m, each sign\'s altitude the road\'s', Math.abs(alt[0] - 2276) < 15 && Math.abs(alt[19] - 2560) < 15 && Math.abs(alt[28] - 2795) < 15 && own,
    `curve 1 ${Math.round(alt[0])} m, curve 20 ${Math.round(alt[19])} m, curve 29 ${Math.round(alt[28])} m`);
  check('curves: the HUD and the commentator know them (Curva 1 .. Curva 29, the viewpoint at 17, Portillo at the finish)', T.names.filter(q => /^Curva \d+/.test(q.n)).length === 29 && T.names.some(q => q.n === 'Curva 17 · Mirador' && q.say) && /^Portillo/.test(T.names[T.names.length - 1].n),
    T.names.length + ' places');
  // the climb is on the legs: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~13 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.slice(0, 19).some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.slice(0, 19).every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.idx(T.startS + cv[0][0] - 60); i < T.idx(T.startS + cv[18][0] + 60); i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins of the ladder flatter than its legs, nowhere steeper than ~13 %', gin / nin < 0.75 * gout / nout && gmax < 0.135,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the galleries: the barriers close in to the gallery's wall and pillars (1.6 m past the road's edges), wider again before and after
{
  const G = def.galleries || [], ins = [], outs = [];
  for (const [a, b] of G) { for (let s = a + 5; s < b - 5; s += 10) { const i = T.idx(T.startS + s); ins.push(Math.max(T.bl[i], T.br[i])); }
    for (const s of [a - 60, b + 60]) { const i = T.idx(T.startS + s); outs.push(Math.min(T.bl[i], T.br[i])); } }
  check('galleries: two over the road, the barriers at their walls inside (w + 1.6 m), farther out before and after', G.length === 2 && ins.every(v => Math.abs(v - (T.w + 1.6)) < 0.01) && outs.every(v => v > T.w + 3),
    `${G.length} galleries, ${G.map(([a, b]) => Math.round(b - a) + ' m').join(' + ')}; inside ${Math.max(...ins).toFixed(2)} m, outside ${Math.min(...outs).toFixed(2)} m`);
}

// 4. the open road's traffic: trucks and coaches outnumber the cars, on their own halves of the road; Vršič's traffic has none
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), cars = tf.veh.filter(v => v.kind === 0), big = tf.veh.filter(v => v.kind === 2);
  const sides = trucks.every(v => v.d * v.dir > 1.5 && Math.abs(v.d) < T.w - 0.8 && v.len > 16 && v.mass > 20000);
  check('traffic: the trucks (16.5 m, on their own half of the road both ways) and the coaches outnumber the cars; Vršič has no trucks',
    trucks.length >= 15 && big.length > cars.length * 0.8 && trucks.some(v => v.dir > 0) && trucks.some(v => v.dir < 0) && sides && !dv.tf.veh.some(v => v.p === 5),
    `${tf.veh.length} vehicles: ${trucks.length} trucks, ${big.length - trucks.length} coaches, ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race up to Portillo on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach Portillo', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach Portillo, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const ev = r.tf, hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach Portillo through the trucks, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${ev.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
