// Sani Pass: an open gravel road with two ways to drive it on one card (def.modes: the time trial and the duel in the traffic; no race of 13
// up a road this narrow). The road: its last ~5 km to the top in the real scale, gravel all the way (the asphalt only past the finish, at
// the border post: def.paved), the 13 hairpins numbered from the bottom in their order up the road (def.curves), steep (up to ~24 %) with the
// hairpins flatter than their legs. The traffic of the open road keeps LEFT (def.leftHand: South Africa and Lesotho); Vršič's keeps right.
// The time trial on autopilot reaches the top in every car (the truck, SAMUM 4x4, the quickest of them), the medal times are the stock rally
// car's; a whole duel in the traffic on autopilot: both reach the top, nobody knocked down, the traffic keeps moving.
//   node tests/sani.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sani'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const model = (name) => C.MODELS.find(m => m.name === name);

// 1. the track: an open road, the time trial and the duel, at most 5 km, from ~2230 m to the top at ~2870 m; the traffic on the left
check('track: an open road, two ways to drive it (def.modes: time trial, traffic), 4 checkpoints, 9 m wide, traffic on the left',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'tt,traffic' && T.cpS.length === 4 && T.w === 4.5 && def.leftHand === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: at most 5 km, from ~2230 m to the top of the escarpment at ~2870 m', T.raceLen > 4900 && T.raceLen <= 5000 && Math.abs(def.alt[0] - 2230) < 20 && Math.abs(def.alt[1] - 2872) < 15 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('sani'));

// 2. the surface: gravel (5) across the road from the start to the finish, asphalt (0) past it at the border post
{
  const q = { i: 0, a: 0, d: 0, s: 0, k: -1 }; let grav = 0, all = 0, pav = 0, pall = 0;
  for (let i = T.startIdx; i < T.N; i++) for (const d of [-T.w + 0.3, 0, T.w - 0.3]) { q.i = q.a = i; q.s = i * T.ds; q.d = d; const s = T.surface(q);
    if (i <= T.finishIdx) { all++; if (s === 5) grav++; } else if (i > T.finishIdx + 3) { pall++; if (s === 0) pav++; } }
  check('surface: gravel all the way to the finish, the asphalt only past it (the border post)', grav === all && pav === pall && pall > 100, `${grav}/${all} gravel, ${pav}/${pall} paved past the finish`);
}

// 3. the 13 hairpins: in order up the road, each a real hairpin (over 110 degrees within 40 m) the way it says, their altitudes the road's
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 20), b = T.idx(T.startS + d + 20); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 25), bends = turn.every((a, k) => Math.abs(a) > 1.9 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 13, in order up the road, each turning the way it says, their altitudes the road\'s', cv.length === 13 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 13, the Twelve Apostles at 8, Lesotho at the top)', T.names.filter(q => /^Serpentina \d+/.test(q.n)).length === 13 && T.names.some(q => q.n === 'Serpentina 8 · Twelve Apostles' && q.say) && /^Lesoto/.test(T.names[T.names.length - 1].n),
    T.names.map(q => q.n).join(', '));
  // steep: up to ~24 %, ~13 % on average; through the hairpins' apexes (+-10 m) flatter than on their legs
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 10), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 30);
  for (let i = T.idx(T.startS + cv[1][0] - 40); i < T.idx(T.startS + cv[12][0] + 40); i++) { const s = i * T.ds, g = T.grade[i]; if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, T.grade[i]);
  const avg = (T.hFinish - T.hStart) / T.raceLen;
  check('grades: steep (~13 % on average, the steepest 20-25 %), the hairpins flatter than their legs', gmax > 0.2 && gmax < 0.25 && avg > 0.12 && gin / nin < 0.85 * gout / nout,
    `average ${(avg * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, hairpins ${(gin / nin * 100).toFixed(1)} %, legs ${(gout / nout * 100).toFixed(1)} %`);
}

// 4. the traffic keeps left: every vehicle (and cyclist) on the left half going up and on the right coming down; Vršič's on the right
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const left = tf.veh.every(v => v.d * v.dir < -0.5 && Math.abs(v.d) < T.w), right = dv.tf.veh.every(v => v.d * v.dir > 0.5);
  check('traffic: on the left half of the road both ways (Vršič\'s on the right); four-wheel drives, vans and motorbikes, no buses or trucks', left && right && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && !tf.veh.some(v => v.kind === 2),
    `${tf.veh.length} vehicles: ${tf.veh.filter(v => v.kind === 0).length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
  // driving on: after 40 s the vehicles still keep left (the ones not pulled over, alongside nothing)
  const orig2 = Math.random; Math.random = seeded(4); d.start();
  for (let k = 0; k < 40 * 120; k++) { Math.random = seeded(9000 + k); C.aiControl(d.player, d, DT); d.step(DT); }
  Math.random = orig2;
  const mov = tf.veh.filter(v => !v.off && v.st === 0 && v.v > 3 && !v.pass && !(v.sdT > 0));
  check('traffic: still on the left after 40 s', mov.length > 10 && mov.filter(v => v.d * v.dir < 0).length >= mov.length - 1, `${mov.filter(v => v.d * v.dir < 0).length}/${mov.length} moving vehicles on the left`);
}

// 5. the ways to drive it: the time trial (alone), the duel (one rival)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), duel = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true }));
  Math.random = orig;
  check('mode: opts.tt is the time trial (the player alone on the line), the duel two cars in the traffic', tt.timeTrial && tt.cars.length === 1 && !duel.timeTrial && duel.cars.length === 2 && !!duel.tf);
}

// 6. the time trial on autopilot to the top: every kind of car gets up without a rescue, the truck the quickest; the medal times the stock rally car's
const ttRun = (m, rain) => {
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, playerModel: m, rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
  Math.random = orig; return { t: P.finished ? P.finishTime : null, resc };
};
{
  const names = ['BURJA R7', 'SAMUM 4x4', 'PICO TURBO', 'PEUGEOT 206', 'FORMULA ORKAN', 'VIHAR V8'], R = names.map(nm => ttRun(model(nm)));
  check('time trial: every car reaches the top on autopilot without a rescue, SAMUM 4x4 the quickest', R.every(r => r.t && !r.resc) && R[1].t < Math.min(...R.filter((_, k) => k !== 1).map(r => r.t)),
    names.map((nm, k) => `${nm} ${R[k].t ? R[k].t.toFixed(1) : '-'} s`).join(', '));
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2], wet = ttRun(model('BURJA R7'), 1);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(R[0].t * 1.01 - M.cs[0]) < 1.5 && wet.t && Math.abs(wet.t * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${R[0].t.toFixed(1)} / ${wet.t ? wet.t.toFixed(1) : '-'} s`);
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot or on a bicycle knocked down, the traffic keeps moving
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
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the top through the traffic keeping left, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
