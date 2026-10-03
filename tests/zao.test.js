// Zao: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic and the run
// from the police). The road: the real line of the top of the road over the volcanic Zao range (Japan), the Zao Echo Line's Miyagi side and the
// road to the summit, from the leg above the hairpins over Sumikawa (~1176 m) past Sai-no-kawara, Komakusadaira, Shimanosawa and Katta Pass to
// the car parks under Kattadake on the crater's rim (~1709 m): at most 8 km, the bends of over 80 degrees in their real order and sense, the
// hairpins flatter than the legs, the legs of the ladders far enough apart. Japan drives on the left (def.leftHand): the traffic keeps to the
// left half both ways; Vršič's still keeps right. The side roads at Katta Pass and the forest road are real junctions (def.sideRoads). No police
// helicopter (def.noHeli). A whole race up to the top (12 AI + the player on autopilot), dry and in the rain: every car finishes and pulls up in
// its own slot; a whole duel in the traffic; the medal times of the time trial: the stock rally car on the autopilot.
//   node tests/zao.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'zao'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking uphill)

// 1. the track: an open road, four ways to drive it, driven on the left; its name (the place, the country), at most 8 km, its climb; not a round of
// the big championship
check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, two lanes 11 m wide, driven on the left, no helicopter, no birds',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5.5 && def.leftHand === true && !def.oneWay && def.noHeli === true && def.noBirds === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: named for the place and the country (Zao, Japonska / Zao, Japan)', def.name === 'Zao, Japonska' && def.en && def.en.name === 'Zao, Japan' && /Okama/.test(def.desc) && /Okama/.test(def.en.desc), `${def.name} / ${def.en.name}`);
check('track: from ~1176 m up to ~1709 m, 7.5-8 km (never more than 8 km), the real road 7.57 km', Math.abs(def.alt[0] - 1176) < 15 && Math.abs(def.alt[1] - 1709) < 15 && T.raceLen > 7500 && T.raceLen <= 8000 &&
  Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1 && def.realKm <= 8 && Math.abs(def.realKm * 1000 - T.raceLen) < 60, `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m, real ${def.realKm} km`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('zao'));

// 2. the bends: the 20 of over 80 degrees in order up the road, each turning the way the real road does (def.curves: from the OpenStreetMap line), five
// hairpins of over 150 degrees; the altitudes the road's own; the climb on the legs, the hairpins flatter; the places on the HUD in order
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 45), b = T.idx(T.startS + d + 45); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 40), sense = turn.every((a, k) => Math.sign(a) === cv[k][2] && Math.abs(a) > Math.min(1.2, cv[k][3] * Math.PI / 180 * 0.75));
  check('bends: 20 of over 80 degrees in order up the road, each turning the way the real road does, all between the start and the finish', cv.length === 20 && order && sense && cv[0][0] > 0 && cv[19][0] < T.raceLen,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('bends: five hairpins of over 150 degrees (2 right, 3 left in the real order), the altitudes the road\'s own', cv.filter(c => c[3] > 150).map(c => c[2]).join(',') === '1,1,-1,-1,-1' && cv.every(c => Math.abs(c[1] - T.altAt(T.hy[T.idx(T.startS + c[0])])) < 3),
    cv.filter(c => c[3] > 150).map(c => `${c[3]}° ${c[2] > 0 ? 'R' : 'L'} @${c[0]} m`).join(', '));
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d, , , a]) => a > 120 && Math.abs(s - T.startS - d) < 10), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 40);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs between them, nowhere steeper than ~10.5 %, never down', gin / nin < 0.95 * gout / nout && gmax < 0.11 && T.altAt(T.hy[T.finishIdx]) > T.altAt(T.hy[T.startIdx]) + 500,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, elsewhere ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
  const want = ['Sai-no-kawara', 'Komakusadaira', 'Shimanosawa', 'Prelaz Katta', 'Kattadake · Okama'];
  check('places: on the HUD in order up the road (the commentator knows them), the finish at Kattadake on the crater', T.names.map(q => q.n).join('|') === want.join('|') && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) &&
    T.names.every(q => q.say && q.say.length) && Math.abs(T.names[4].d - T.raceLen) < 1, T.names.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
}

// 3. the ladders: the legs of the hairpins at least 20 m apart (no barrier reaches the other leg), the barriers 3.4 m past the road's edges at least
{
  let dmin = 1e9, at = 0;
  for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d < dmin) { dmin = d; at = i * T.ds - T.startS; } }
  let bmin = 1e9; for (let i = 0; i < T.N; i++) bmin = Math.min(bmin, T.bl[i], T.br[i]);
  check('ladders: the legs 20 m apart or more, the barriers at least 3.4 m past the asphalt', dmin >= 20 && bmin >= T.w + 3.4 - 1e-3, `legs ${dmin.toFixed(1)} m apart at the closest (${Math.round(at)} m), barriers ${(bmin - T.w).toFixed(2)} m past the edge`);
}

// 4. the junctions: the Echo Line on to Yamagata at Katta Pass, the summit road's other branch and a forest road, all on the left; the road there open
// past the barrier line (the mouth), closed off further in; a car can drive into the side road's mouth
{
  const S = T.stubs || [], sp = S.map(s => Math.round(s.s));
  check('junctions: three side roads (def.sideRoads): the forest road below Shimanosawa, the Echo Line on at Katta Pass and the summit road\'s other branch, all on the left',
    S.length === 3 && S.every(s => s.side === -1) && Math.abs(sp[0] - 5806) < 5 && Math.abs(sp[1] - 6121) < 5 && Math.abs(sp[2] - 3578) < 5 && S.every(s => s.L >= 40 && s.te > 0 && s.tb > s.te),
    S.map(s => `${Math.round(s.s)} m, open ${s.L} m`).join('; '));
  const s0 = S[0], p = T.stubPt(s0.k, s0.tb + 6, {}), q = T.query(p.x, p.z, s0.i0, {});
  check('junctions: the side road\'s surface is drivable past the barrier line (the query finds it)', q.k === s0.k && Math.abs(q.y - p.y) < 0.6, `query k ${q.k}, y ${q.y.toFixed(2)} vs ${p.y.toFixed(2)}`);
}

// 5. the traffic keeps left (Zao) and right (Vršič): every vehicle on its own half, both ways; cars, vans, tour buses, motorbikes, cyclists, no trucks
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const own = tf.veh.filter(left), bikes = tf.veh.filter(v => v.kind === 4), kinds = new Set(tf.veh.map(v => v.kind));
  check('traffic: keeps left on Zao (uphill on the left half, downhill on the right as the race sees it), cyclists at the left edge; buses and motorbikes, no trucks',
    tf.sd === -1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && bikes.every(v => v.d * v.dir < -(T.w - 1)) && kinds.has(2) && kinds.has(3) && !tf.veh.some(v => v.p === 5),
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} up, ${tf.veh.filter(v => v.dir < 0).length} down), on the left ${own.length}, buses ${tf.veh.filter(v => v.kind === 2).length}, motorbikes ${tf.veh.filter(v => v.kind === 3).length}, cyclists ${bikes.length}`);
  check('traffic: Vršič keeps right as before', dv.tf.sd === 1 && dv.tf.veh.every(v => v.d * v.dir > 0.5), `${dv.tf.veh.length} vehicles`);
  const a = tf.veh.find(v => v.dir > 0 && v.kind === 0), e = tf._edge(a), b = tf.veh.find(v => v.dir < 0 && v.kind === 0), eb = tf._edge(b);
  check('traffic: its edge (pulling over) is the left one both ways', e < -T.w + 1.5 && eb > T.w - 1.5, `uphill car ${e.toFixed(2)} m, downhill car ${eb.toFixed(2)} m`);
}

// 6. the ways to drive it; the run from the police starts on the left half, and no helicopter comes however hot it gets
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5, 'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  const P = pol.player; let heli = 0, k = 0;
  for (let t = 0; t < 40; t += DT) { Math.random = seeded(4000 + (++k)); if (pol.pol) { pol.pol.heat = 5; pol.pol.heliCool = 0; } C.aiControl(P, pol, DT); pol.step(DT); if (pol.pol && pol.pol.heli) heli++; }
  Math.random = orig;
  check('mode: the run from the police: the player starts on the left half of the road; no police helicopter, even at the highest heat (def.noHeli)', !!pol.pol && !!pol.tf && pol.player.q.d < 0 && !heli,
    `the player started on the left half, helicopter seen ${heli} steps`);
}

// 7. a whole race up to the top on autopilot, in the dry and in the rain: every car finishes, then pulls up in its own slot past the line; the rain slower
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  return { fin, resc, slots, P, win: fin[0] ? fin[0].finishTime : 0 };
};
{
  const dry = race(false), wet = race(true);
  for (const [nm, r] of [['dry', dry], ['in the rain', wet]]) {
    check(`race ${nm}: all 13 cars reach the top, the player never rescued`, r.fin.length === 13 && !r.resc, `${r.fin.length}/13, winner ${r.win.toFixed(1)} s, player ${r.P.finishPos}. (${r.P.finishTime ? r.P.finishTime.toFixed(1) : '-'} s), player rescues ${r.resc}`);
    check(`race ${nm}: past the line every car stops in its own slot (70 m on, 9 m apart)`, r.slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4),
      r.slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
  }
  check('race: slower in the rain (by 2-20 %)', wet.win > dry.win * 1.02 && wet.win < dry.win * 1.2, `dry ${dry.win.toFixed(1)} s, wet ${wet.win.toFixed(1)} s`);
}

// 8. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving and keeps left
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, nAll = 0, nL = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); if (!v.off && v.st === 0 && !v.yl && !v.pass && v.v > 2) { nAll++; if (left(v)) nL++; } }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the top through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
  check('duel: the moving traffic keeps left all the way (98 % and more of the samples)', nAll > 200 && nL / nAll >= 0.98, `${nL}/${nAll} on the left`);
}

// 9. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const tt = (rain) => { const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : 0; };
  const dry = tt(false), wet = tt(true);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (dry and wet)', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] &&
    Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 1.5, `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry.toFixed(1)} / ${wet.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
