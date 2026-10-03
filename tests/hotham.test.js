// Mount Hotham: an open road with four ways to drive it on one card, as Vršič and Beartooth (def.modes: the race, the time trial, the duel in the
// traffic and the run from the police), the traffic on the left (def.leftHand, as Chapman's Peak). The road: the real line of the Great Alpine
// Road over the Victorian Alps (Australia), its alpine top at full scale and no longer than 8 km: from below Mount Little Blowhard (~1495 m) along
// the ridge past the lookouts to its highest point under Mount Hotham (~1831 m) and down into the village of Hotham Heights (~1753 m); the
// main bends in order (def.curves) the way the real road turns. Its name (a place and a country) in both languages, only geographic names on the
// HUD. Its scenery data as the world builder reads it (the terrain's rows, the land cover's run-length code, the lookouts, the car parks, the
// lifts, the ski bridge, the side roads, the view beyond the corridor). The traffic: its own mix (cars, four-wheel drives, many motorbikes, a few
// trucks), on the left. A whole race (12 AI + the player on autopilot) in the dry and in the rain: every car finishes and pulls up in its own
// slot past the line; a whole duel in the traffic on autopilot; the medal times of the time trial (the stock rally car on the autopilot).
//   node tests/hotham.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'hotham'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking uphill)
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: its name, an open road with four ways to drive it, its checkpoints and climb; at full scale, at most 8 km; not a round of the big championship
check('track: "Mount Hotham, Avstralija" / "Mount Hotham, Australia", an open road with four ways to drive it, 4 checkpoints, the road 12 m wide, the traffic on the left',
  def.name === 'Mount Hotham, Avstralija' && def.en.name === 'Mount Hotham, Australia' && def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6 && def.leftHand === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: from ~1495 m below Mount Little Blowhard to Hotham Heights (~1753 m), 7.8-8 km at full scale', Math.abs(def.alt[0] - 1495) < 15 && Math.abs(def.alt[1] - 1753) < 15 && T.raceLen > 7800 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('hotham'));

// 2. the profile: up the ridge to the road's highest point under Mount Hotham (~1831 m, ~6.4 km), then down into the village; nowhere steeper than ~12 %
{
  let hi = -1e9, iHi = 0, gmax = 0, down = 0;
  for (let i = T.startIdx; i <= T.finishIdx; i++) { if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } gmax = Math.max(gmax, Math.abs(T.grade[i])); }
  for (let i = iHi; i < T.finishIdx; i++) down += Math.max(0, T.hy[i] - T.hy[i + 1]);
  const aHi = T.altAt(hi), dHi = iHi * T.ds - T.startS;
  check('profile: the highest point ~1831 m under Mount Hotham ~6.4 km from the start, then down ~80 m into Hotham Heights, nowhere steeper than ~12 %',
    Math.abs(aHi - 1831) < 8 && Math.abs(dHi - 6430) < 150 && down > 60 && down < 110 && gmax < 0.125,
    `top ${Math.round(aHi)} m at ${Math.round(dHi)} m, then ${Math.round(down)} m down, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the main bends: in order, each a real bend of the line the way its sign says (over 120 m round it at least 45 degrees), the sharp left at Little
// Mount Baldy one of the two sharpest (~100 degrees, as the right after the hollow); each altitude the road's own
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 0.78 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  const dirs = cv.map(c => (c[2] > 0 ? 'D' : 'L')).join('');
  const baldy = cv.find(c => Math.abs(c[0] - 4100) < 60), kb = cv.indexOf(baldy);
  check('bends: 12, in order up the road, each a bend the way its sign says (L L L L L D L D L D L D), each altitude the road\'s', cv.length === 12 && order && bends && own && dirs === 'LLLLLDLDLDLD',
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, ${dirs}`);
  check('bends: the sharp left round Little Mount Baldy (~1680 m) one of the two sharpest, ~100 degrees', baldy && baldy[2] < 0 && Math.abs(turn[kb]) > 1.5 && turn.every(a => Math.abs(a) <= Math.abs(turn[kb]) + 0.1) && Math.abs(alt[kb] - 1682) < 10,
    baldy ? `${Math.round(turn[kb] * 57.3)} deg at ${Math.round(alt[kb])} m` : 'missing');
}

// 4. the places on the HUD (only geographic names: the lookouts, the mountains, the ridge, the village), in order; the commentator knows them
{
  const N = T.names.map(q => q.n), want = ['Razgledišče Renes', 'Mount Little Blowhard', 'Mount Blowhard', "Razgledišče Danny's", 'Little Mount Baldy', 'Baldy Hollow', 'Razorback', 'Mount Hotham', 'Smučišče', 'Hotham Heights'];
  const ok = want.every((w, k) => N[k] && N[k].startsWith(w)) && T.names.every((q, k) => q.say && (!k || q.d > T.names[k - 1].d)) && Math.abs(T.names[T.names.length - 1].d - T.raceLen) < 5;
  check('places: from Renes Lookout to Hotham Heights at the finish, in order, the commentator knows them', ok, N.join(' | '));
  const sum = T.names.find(q => q.n.startsWith('Mount Hotham')), hi = Math.max(...Array.from(T.hy.slice(T.startIdx, T.finishIdx)));
  check('places: Mount Hotham at the road\'s highest point (its altitude the road\'s)', sum && Math.abs(T.hy[T.idx(T.startS + sum.d)] - hi) < 1.5 && sum.n.includes(Math.round(T.altAt(hi)).toLocaleString('de-DE')), sum ? sum.n : 'missing');
}

// 5. the scenery data (as vrPrep reads it): the terrain rows, the land cover (snow gum woodland, alpine grass, heath) cell for cell, the two lookouts
// beside the road, the car parks, the lifts of the resort near the village, the ski bridge over the road before the finish, the side roads,
// the view beyond the corridor (Mount Feathertop among the peaks)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('scenery: the terrain rows and residuals, the land cover (snow gum woodland, alpine grass, heath, the village) cell for cell', rows && res && cells === L.nx * L.nz && maxC <= 5 && cnt[1] > cnt[0] && cnt[0] > 0 && cnt[2] > 0 && cnt[3] > 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, woodland ${cnt[1]}, heath ${cnt[2]}, built ${cnt[3]}, rock ${cnt[4]}, water ${cnt[5]})`);
  const at = (x, z) => { const q = T.query(x, z, T.nearestIdx(x, z), {}); return { s: q.s - T.startS, d: q.d }; };
  const v = (def.vistas || []).filter(a => a[2]).map(a => Object.assign(at(a[0], a[1]), { n: a[2] }));
  const ren = v.find(a => a.n === 'Renes Lookout'), dan = v.find(a => a.n === "Danny's Lookout");
  check('scenery: Renes Lookout (~0.7 km) and Danny\'s Lookout (~3.5 km) beside the road on the left, where the HUD names them', ren && dan && Math.abs(ren.s - 720) < 60 && Math.abs(dan.s - 3541) < 60 && ren.d < 0 && dan.d < 0 && Math.abs(ren.d) < 40 && Math.abs(dan.d) < 50,
    v.map(a => `${a.n} ${Math.round(a.s)} m / ${a.d.toFixed(0)} m`).join(', '));
  const pulls = (def.pulls || []).filter(([x, z]) => Math.abs(at(x, z).d) < 40);
  const lifts = (def.lifts || []).filter(([x0, z0, x1, z1]) => at(x0, z0).s > 6000 || at(x1, z1).s > 6000);
  const sb = def.skiBridges || [];
  check('scenery: car parks beside the road, the resort\'s lifts past the summit, the ski bridge over the road before the village, the reservoir',
    pulls.length >= 6 && lifts.length >= 5 && sb.length === 1 && sb[0] > 7400 && sb[0] < T.raceLen - 100 && (def.lakes || []).length === 1,
    `${pulls.length} car parks, ${lifts.length} lifts, ski bridge at ${sb.map(Math.round).join(',')} m, ${(def.lakes || []).length} reservoir`);
  const F = def.farDem, fb = Buffer.from(F.b64, 'base64'), fe = def.far['Mount Feathertop'];
  check('scenery: the view beyond the corridor (250 m grid, ~13 km round the road), Mount Feathertop (1922 m) north of the road', fb.length === F.nx * F.nz * 2 && F.cell === 250 && fe && fe[2] === 1922 && fe[1] < -8000,
    `far ${F.nx}x${F.nz}, Feathertop at ${fe ? fe.join(', ') : '-'}`);
  const S = T.stubs || [];
  check('scenery: the side roads (service roads, the track to the summit with its gate, the village streets) on both sides', S.length === 9 && S.some(s => s.side < 0) && S.some(s => s.side > 0) && S.some(s => s.grav && s.end === 1) && S.some(s => s.name === 'Hot Plate Drive'),
    S.map(s => `${Math.round(s.s0 - T.startS)}${s.side > 0 ? 'D' : 'L'}`).join(' '));
}

// 6. the open road's traffic: its own mix (cars, four-wheel drives and vans, many motorbikes, a few trucks, cyclists), both ways, on the left
// (uphill on the left half of the road as the race sees it); Vršič keeps right
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: cars, vans and four-wheel drives, many motorbikes, a few trucks and cyclists, both ways', tf.veh.length > 14 && bikes.length >= 2 && cyc.length >= 1 && trucks.length >= 1 && cars.length > trucks.length * 3 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${bikes.length} motorbikes, ${trucks.length} trucks, ${cyc.length} cyclists`);
  const own = tf.veh.filter(left);
  const V = new C.Race(new C.Track(C.TRACKS.find(t => t.id === 'vrsic')), opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })).tf, vr = V.veh.filter(v => v.d * v.dir > 0.5);
  check('traffic: keeps left on Mount Hotham (uphill on the left half, downhill on the right as the race sees it); Vršič still keeps right', own.length >= tf.veh.length * 0.7 && vr.length >= V.veh.length * 0.7,
    `on the left ${own.length}/${tf.veh.length} (Vršič on the right ${vr.length}/${V.veh.length})`);
}

// 7. the ways to drive it (and an online race: always the race)
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

// 8. a whole race to Hotham Heights on autopilot, in the dry and in the rain: every car finishes, then pulls up in its own slot past the line; the rain slower
{
  const times = {};
  for (const rain of [false, true]) {
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
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), tag = rain ? 'rain' : 'dry';
    times[tag] = fin[0] ? fin[0].finishTime : 0;
    check(`race (${tag}): all 13 cars reach Hotham Heights`, fin.length === 13 && resc === 0, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
    const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
    check(`race (${tag}): past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
      slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
  }
  check('race: the rain slower than the dry (by 3-15 %)', times.rain > times.dry * 1.03 && times.rain < times.dry * 1.15, `dry ${times.dry.toFixed(1)} s, rain ${times.rain.toFixed(1)} s`);
}

// 9. a whole duel in the traffic on autopilot (both cars): both reach the village, nobody on foot knocked down, the traffic keeps moving and keeps left
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, nL = 0, all = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w);
      if (!v.off && v.st === 0 && !v.yl && !v.pass && v.v > 2) { all++; if (left(v)) nL++; } }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach Hotham Heights through the traffic, no one on foot knocked down, no vehicle standing for long, the traffic on the left',
    r.cars.every(c => c.finished) && !hits && standMax < 30 && all > 200 && nL / all >= 0.98,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles, ${nL}/${all} moving on their left`);
}

// 10. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2], got = {};
  for (const rain of [false, true]) {
    const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; got[rain ? 'wet' : 'dry'] = P.finished ? P.finishTime : 0;
  }
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(got.dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(got.wet * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${got.dry.toFixed(1)} / ${got.wet.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
