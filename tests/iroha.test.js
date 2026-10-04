// Irohazaka: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial, the duel in
// the traffic and the run from the police). The road: the real line of the second Irohazaka, the 5 km with the most numbered curves: 18 of
// its 20 (def.curves, numbered from the bottom as on the real road, each with its letter of the Iroha poem: は, curve 3, to ね, curve 20; 16
// hairpins and two wider bends) from ~920 m past the Kurokamidaira lookout to ~1240 m; the climb on the legs between the hairpins (the hairpins themselves flatter); the legs
// of the ladder far enough apart that no barrier crosses the other leg. The road is one-way (def.oneWay) and Japan drives on the left
// (def.leftHand): all the traffic goes up the road, most of it in the left lane, some in the right one; Vršič's traffic still goes both
// ways. A whole race up to the lookout (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a
// whole duel in the traffic on autopilot: both reach the top and the traffic keeps moving, nobody going down. The medal times of the time trial: the stock
// rally car on the autopilot.
//   node tests/iroha.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'iroha'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const IROHA = 'いろはにほへとちりぬるをわかよたれそつね';   // (the second Irohazaka's 20 curves; the stage has は (3) to ね (20))

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, at most 5 km; not a round of the big championship
check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, two lanes 11 m wide, one-way, driven on the left',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5.5 && def.oneWay && def.leftHand,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~920 m up to ~1240 m, 4.9-5 km (never more than 5 km)', Math.abs(def.alt[0] - 918) < 15 && Math.abs(def.alt[1] - 1240) < 15 && T.raceLen > 4900 && T.raceLen <= 5000 &&
  Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1, `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('iroha'));

// 2. the 18 curves: in order up the road, the 16 hairpins (は .. そ) over 150 degrees within 120 m, the two last (つ, ね) wider bends, each turning
// the way its sign says; the letters of the Iroha poem and the numbers of the real signs in order (3 .. 20), the altitudes the road's own; the
// HUD and the commentator know them; the climb on the legs, the hairpins flatter
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > (k < 16 ? 2.6 : 1.5) && Math.sign(a) === cv[k][2]);
  check('curves: 18 in order up the road (16 hairpins of 150 degrees and more, two wider bends), each turning the way its sign says, all after the start line', cv.length === 18 && order && bends && cv[0][0] > 0 && cv[17][0] < T.raceLen,
    `${cv.length} curves, turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('curves: the signs\' letters and numbers are the Iroha poem\'s in order (は 3 .. ね 20), each sign\'s altitude the road\'s', cv.map(c => c[3]).join('') === IROHA.slice(2) && cv.every((c, k) => c[4] === k + 3 && Math.abs(c[1] - alt[k]) < 3),
    cv.map((c, k) => c[3] + c[4] + ' ' + Math.round(alt[k])).join(', '));
  const hud = T.names.filter(q => /^Ovinek \S \(\d+\)$/.test(q.n));
  check('curves: the HUD and the commentator know them (Ovinek は (3) .. Ovinek ね (20), the Kurokamidaira lookout)', hud.length === 18 && hud.every((q, k) => q.n === `Ovinek ${IROHA[k + 2]} (${k + 3})`) &&
    T.names.some(q => q.n === 'Razgledišče Kurokamidaira' && q.say) && hud.filter(q => q.say).length >= 6, T.names.length + ' places');
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.slice(0, 16).some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.slice(0, 16).every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.idx(T.startS + Math.max(0, cv[0][0] - 60)); i < T.idx(T.startS + cv[15][0] + 60); i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs between them, nowhere steeper than ~10 %', gin / nin < 0.75 * gout / nout && gmax < 0.105,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the ladder: the legs of the hairpins at least 20 m apart (no barrier reaches the other leg), the barriers 3.4 m past the road's edges at least
{
  let dmin = 1e9, at = 0;
  for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d < dmin) { dmin = d; at = i * T.ds - T.startS; } }
  let bmin = 1e9; for (let i = 0; i < T.N; i++) bmin = Math.min(bmin, T.bl[i], T.br[i]);
  check('ladder: the legs 20 m apart or more, the barriers at least 3.4 m past the asphalt', dmin >= 20 && bmin >= T.w + 3.4 - 1e-3, `legs ${dmin.toFixed(1)} m apart at the closest (${Math.round(at)} m), barriers ${(bmin - T.w).toFixed(2)} m past the edge`);
}

// 4. the one-way road's traffic: everything goes up, the slow lane the left one (a quarter of the cars, vans and motorbikes in the right lane, the
// buses and the cyclists all in the left), no trucks; Vršič's still both ways, on the right
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const mv = tf.veh.filter(v => v.kind !== 4), left = mv.filter(v => v.d < -0.5), right = mv.filter(v => v.d > 0.5);
  const lanesOk = tf.veh.every(v => v.dir === 1 && Math.abs(v.d) < T.w - 0.3 && (v.kind === 4 || v.kind === 2 ? v.d < 0 : true));
  check('traffic: one-way, everything going up; most in the left lane, some in the right one (buses and cyclists on the left), no trucks; Vršič both ways on the right',
    tf.veh.length > 20 && lanesOk && left.length > right.length * 1.5 && right.length >= 2 && !tf.veh.some(v => v.p === 5) && new Set(mv.map(v => v.kind)).size >= 3 &&
    dv.tf.veh.some(v => v.dir < 0) && dv.tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0),
    `${tf.veh.length} vehicles: ${left.length} left, ${right.length} right, ${tf.veh.filter(v => v.kind === 2).length} buses, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race up to the top on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
  check('race: all 13 cars reach the top, the player never rescued', fin.length === 13 && !resc, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving, nobody
// going down the one-way road
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, down = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); if (v.dir < 0) down++; }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the top through the traffic, no one on foot knocked down, no vehicle standing for long, none going down', r.cars.every(c => c.finished) && !hits && standMax < 30 && !down,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
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
