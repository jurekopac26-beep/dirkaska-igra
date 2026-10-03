// Tianmen: the upper half of the road of 99 bends up Tianmen Mountain, an open road with four ways to drive it on one card, as Vršič and
// Los Caracoles (def.modes: the race, the time trial, the duel in the traffic and the run from the police). The road: the real line up the
// numbered bends 54 to 99 (def.curves, numbered from the foot of the road as its name has them), each a bend the way its sign says, the
// climb on the legs between the hairpins (the hairpins flatter), the loop at bend 90 where the road crosses itself on a bridge (Track.cross:
// an open road may have one too), the race no longer than 5 km. The open road's traffic is its own mix (def.traffic): the scenic area's
// buses and vans outnumber the cars, no trucks. A whole race up to the cave (12 AI + the player on autopilot): every car finishes and pulls
// up in its own slot past the line, none snaps from one level of the loop to the other; a whole duel in the traffic on autopilot: both reach
// the cave and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/tianmen.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'tianmen'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const turn = (s, h) => { const a = T.idx(s - h), b = T.idx(s + h); let t = 0; for (let i = a; i < b; i++) t += wrap(T.hd[i + 1] - T.hd[i]); return t; };

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, at most 5 km; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from bend 54 (~729 m) up to the square below Tianmen Cave (~1218 m), 4.5-5 km', Math.abs(def.alt[0] - 729) < 20 && Math.abs(def.alt[1] - 1218) < 20 && T.raceLen > 4500 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('tianmen'));

// 2. the bends: 54 to 99 in order up the road (99 just past the finish), each a bend the way its sign says (12 degrees or more within 20 m
// of the sign's spot), the hairpins among them; their altitudes as the road's own; the HUD and the commentator know them
{
  const cv = def.curves || [], tn = cv.map(([d]) => turn(T.startS + d, 20)), wide = cv.map(([d]) => turn(T.startS + d, 60));
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || (c[0] > cv[k - 1][0] + 20 && c[3] === cv[k - 1][3] + 1)), bends = tn.every((a, k) => Math.sign(a) === cv[k][2] && Math.abs(a) > 0.2);
  const hair = wide.filter(a => Math.abs(a) > 2.6).length, own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('bends: 54 to 99, in order up the road, each a bend the way its sign says; 12 or more hairpins among them', cv.length === 46 && cv[0][3] === 54 && cv[45][3] === 99 && order && bends && hair >= 12,
    `${cv.length} bends, ${hair} hairpins, turns ${tn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('bends: 54 to 98 before the finish, 99 just past it; each sign\'s altitude the road\'s', cv[44][0] < T.raceLen && cv[45][0] > T.raceLen && own,
    `bend 54 ${Math.round(alt[0])} m, bend 98 ${Math.round(alt[44])} m, bend 99 ${Math.round(alt[45])} m`);
  check('bends: the HUD and the commentator know them (Ovinek 54 .. Ovinek 98, the loop, the cave at the finish)', T.names.filter(q => /^Ovinek \d+ · /.test(q.n)).length === 45 && T.names.some(q => q.n === 'Zanka' && q.say) && /^Tianmenska jama/.test(T.names[T.names.length - 1].n),
    T.names.length + ' places');
  // the climb is on the legs: the grade through the hairpins' apexes (+-10 m) lower than on the legs between them; nowhere steeper than ~12.5 %
  const hp = cv.filter((c, k) => Math.abs(wide[k]) > 2.6).map(c => c[0]);
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  for (let i = T.idx(T.startS); i < T.idx(T.finishS); i++) { const d = i * T.ds - T.startS, g = T.grade[i]; gmax = Math.max(gmax, g); if (hp.some(h => Math.abs(d - h) < 10)) { gin += g; nin++; } else if (hp.every(h => Math.abs(d - h) > 45)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, nowhere steeper than ~12.5 %', gin / nin < 0.9 * gout / nout && gmax < 0.125,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the loop at bend 90: the road crosses itself, the bridge 8 m or more over the road below, the barriers at the parapets and the walls
{
  const X = T.cross[0], dLo = X ? X.lo * T.ds - T.startS : 0, dUp = X ? X.up * T.ds - T.startS : 0, b90 = (def.curves || []).find(c => c[3] === 90);
  check('loop: one crossing on two levels, the lower road at bend 90, the bridge ~100 m on, 8 m or more over it', T.cross.length === 1 && b90 && Math.abs(dLo - b90[0]) < 60 && dUp - dLo > 80 && dUp - dLo < 130 && X.dy > 8,
    X ? `lower road ${dLo.toFixed(0)} m, bridge ${dUp.toFixed(0)} m after the start line, gap ${X.dy.toFixed(1)} m` : 'none');
  const iu = X ? Math.round(X.up) : 0, il = X ? Math.round(X.lo) : 0;
  check('loop: parapets on the bridge 3 m from the road, the walls under it 3.4 m', X && Math.abs(T.bl[iu] - T.w - 3) < 0.05 && Math.abs(T.br[iu] - T.w - 3) < 0.05 && Math.abs(T.bl[il] - T.w - 3.4) < 0.05 && Math.abs(T.br[il] - T.w - 3.4) < 0.05,
    X ? `bridge ${(T.bl[iu] - T.w).toFixed(2)} / ${(T.br[iu] - T.w).toFixed(2)} m, under it ${(T.bl[il] - T.w).toFixed(2)} / ${(T.br[il] - T.w).toFixed(2)} m` : '');
  // the legs of the ladder: the barriers of one leg never reach the next (the line pushed apart where the real legs lie closer)
  let worst = 1e9;
  for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d > 40) continue;
    if (X && Math.abs(i - X.lo) * T.ds < 110 && Math.abs(j - X.up) * T.ds < 110) continue;
    const ui = (T.px[j] - T.px[i]) * T.nx[i] + (T.pz[j] - T.pz[i]) * T.nz[i], bi = ui > 0 ? T.br[i] : T.bl[i], uj = (T.px[i] - T.px[j]) * T.nx[j] + (T.pz[i] - T.pz[j]) * T.nz[j], bj = uj > 0 ? T.br[j] : T.bl[j];
    worst = Math.min(worst, d - bi - bj); }
  check('legs: the barriers of two legs never overlap', worst > 0, `closest gap between two legs' barriers ${worst.toFixed(2)} m`);
}

// 4. the open road's traffic: the buses and vans of the scenic area outnumber the cars, no trucks, both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const buses = tf.veh.filter(v => v.kind === 2 && v.p !== 5), vans = tf.veh.filter(v => v.kind === 1), cars = tf.veh.filter(v => v.kind === 0), trucks = tf.veh.filter(v => v.p === 5);
  check('traffic: buses and vans outnumber the cars (the buses most of all), both ways, no trucks',
    buses.length > cars.length * 2 && buses.length > vans.length && vans.length > cars.length && !trucks.length && buses.some(v => v.dir > 0) && buses.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${buses.length} buses, ${vans.length} vans, ${cars.length} cars, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race up to the cave on autopilot: every car finishes, then pulls up in its own slot past the line and stays there; through the
// loop every car keeps to its own level (its height always the road's under it)
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, snap = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (k % 30 === 0) for (const c of r.cars) if (c.q.i >= 0 && !c.air && Math.abs((c.y || 0) - T.hy[c.q.i]) > 4) snap++;
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the cave, none off its own level through the loop', fin.length === 13 && !snap, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}, off level ${snap}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the cave, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the cave through the buses, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${ev.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const run = (rain) => { const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : null; };
  const dry = run(0), wet = run(1);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (dry and wet)', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && dry && wet && Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry ? dry.toFixed(1) : '-'} / ${wet ? wet.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
