// Seoul: a city track over Namsan, the wooded hill in the middle of Seoul (docs/proge/seoul.md): an open road with four ways to drive it on
// one card (def.modes: the race, the time trial, the duel in the traffic and the run from the police), 2.48 km of the park's one-way bus roads in
// their one-way direction: from the south slope (~184 m) up through the pine wood, past the viewpoint, through the gap in the old city wall, over
// the top of the hill (~240 m) below the tower, then down the west slope and along a city street to the line in Huam-dong (~107 m). Its name as
// the rules want it ("Kraj, Država"), the roads' widths and the barriers of a street race close to the asphalt (the rule for the city tracks of
// the big cities: no run-off zone needed). The world's data (js/data/seoul.js, OpenStreetMap, tools/seoul/build.py): the buildings, the city's
// far towers, the old city wall where the road goes through it, and the landmarks under plain descriptive labels only (no names of buildings,
// people, companies; the rules for Google Play: the road and the park are named after a poet, the tower after a company, so neither name).
// The grid on the run-up behind the line; a whole race on autopilot: every car finishes and pulls up past the line before the road's end; a
// whole duel in the traffic; the medal times of the time trial: the stock rally car on the autopilot.
//   node tests/seoul.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'seoul'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const at = (d) => T.idx(T.startS + d);

// 1. the track: an open road, four ways to drive it, its checkpoints; 2.48 km (the rule for the new tracks: 1-5 km; the big cities in the lower
// part of it); its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && def.name === 'Seul, Južna Koreja' && def.en.name === 'Seoul, South Korea',
  `race ${Math.round(T.raceLen)} m, checkpoints at ${T.cpDist.map(Math.round).join(' ')} m, ${def.alt.join(' -> ')} m, modes ${(def.modes || []).join(',')}`);
check('track: 2.4-2.55 km from the start line to the finish, within 2 % of the real road; the run-up before the line ~245 m, the road past the line ~235 m',
  T.raceLen > 2400 && T.raceLen < 2550 && Math.abs(def.realKm - T.raceLen / 1000) / def.realKm < 0.02 && T.startS > 230 && T.startS < 260 && T.len - T.finishS > 220 && T.len - T.finishS < 250,
  `${Math.round(T.raceLen)} m vs ${def.realKm} km, run-up ${Math.round(T.startS)} m, past the line ${Math.round(T.len - T.finishS)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('seoul'));

// 2. the lie of the land: up from the south slope (~184 m) to the top of the hill (~240 m at ~1 km), down the west slope to the city (~107 m)
{
  let hi = -1e9, hiD = 0, up = 0, down = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { const a = T.altAt(T.hy[i]); if (a > hi) { hi = a; hiD = i * T.ds - T.startS; } up = Math.max(up, T.grade[i]); down = Math.min(down, T.grade[i]); }
  const a0 = T.altAt(T.hStart), a1 = T.altAt(T.hFinish);
  check('heights: the start ~184 m, the top of Namsan ~240 m at 0.9-1.1 km, the line in Huam-dong ~107 m, nowhere steeper than 15 %',
    Math.abs(a0 - 184) < 3 && hi > 236 && hi < 245 && hiD > 900 && hiD < 1100 && Math.abs(a1 - 107) < 3 && up < 0.15 && down > -0.15,
    `start ${a0.toFixed(0)} m, top ${hi.toFixed(1)} m at ${Math.round(hiD)} m, finish ${a1.toFixed(0)} m, steepest +${(up * 100).toFixed(1)} / ${(down * 100).toFixed(1)} %`);
  // the bends: the park road winds (the tightest ~9 m radius), the turn into the side street at the end a right-hander
  let tight = 1e9; for (let i = T.startIdx + 5; i < T.finishIdx - 5; i++) { const k = Math.abs(wrap(T.hd[i + 1] - T.hd[i])) / T.ds; if (k > 1e-6) tight = Math.min(tight, 1 / k); }
  let turn = 0; for (let i = at(2370); i < at(2440); i++) turn += wrap(T.hd[i + 1] - T.hd[i]);
  check('bends: the park road winds (the tightest radius under 15 m); the turn off the city street into the side street to the line',
    tight < 15 && Math.abs(turn) > 0.4, `tightest ${tight.toFixed(1)} m, the turn into the side street ${Math.round(turn * 57.3)} degrees`);
}

// 3. the places on the HUD: eight, in order along the road, each with its English lines for the commentator; Namsan's altitude the road's top
{
  const N8 = ['Borov gozd', 'Razgledišče', 'Mestno obzidje', 'Namsan', 'Pod stolpom', 'Dvojni desni', 'V mesto', 'Huam-dong'];
  const own = T.names.every(q => { const m = /· (\d+) m$/.exec(q.n); return m && Math.abs(+m[1] - T.altAt(T.hy[at(q.d)])) < 3; });
  check('places: the HUD and the commentator know the eight, in order along the road before the line, each with two English lines, each altitude the road\'s own',
    T.names.map(q => q.n.split(' · ')[0]).join('|') === N8.join('|') && T.names.every((q, k) => q.say && q.say.length === 2 && (!k || q.d > T.names[k - 1].d)) && T.names[7].d < T.raceLen && own,
    T.names.map(q => `${q.n} ${Math.round(q.d)} m`).join(', '));
}

// 4. the roads and the barriers of a street race: the south circular road 9.2 m, the park road 8.8 m, the city street 12.4 m, the side street
// to the line 10 m; the barriers all along the race 1.5-8 m past the asphalt's edge (the pavements, the bus stops' bays the widest)
{
  const W = (d) => 2 * T.wa[at(d)];
  let near = 1e9, far = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { const w = T.wa[i]; near = Math.min(near, T.bl[i] - w, T.br[i] - w); far = Math.max(far, T.bl[i] - w, T.br[i] - w); }
  check('roads: the south circular road 9.2 m wide, the park road 8.8 m, the city street 12.4 m, the side street to the line 10 m',
    Math.abs(W(100) - 9.2) < 0.1 && Math.abs(W(800) - 9.2) < 0.1 && Math.abs(W(1500) - 8.8) < 0.1 && Math.abs(W(2100) - 8.8) < 0.1 && Math.abs(W(2300) - 12.4) < 0.1 && Math.abs(W(2460) - 10) < 0.1,
    [100, 800, 1500, 2100, 2300, 2460].map(d => `${d} m: ${W(d).toFixed(1)}`).join(', '));
  check('barriers: all along the race, 1.5-8 m past the edge of the asphalt (a street race: no run-off areas)', near >= 1.5 && far <= 8, `${near.toFixed(2)} .. ${far.toFixed(2)} m`);
}

// 5. the world's data (js/data/seoul.js: OpenStreetMap): the buildings by the road, the city's far towers, the old city wall where the road goes
// through it, the landmarks under descriptive labels, the crossings and the bus stops
{
  const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'seoul.js'), 'utf8'), ctx);
  const D = ctx.SE_DATA, dLine = (x, z) => { let b = 1e9; for (let i = 0; i < T.N; i += 2) b = Math.min(b, Math.hypot(T.px[i] - x, T.pz[i] - z)); return b; };
  check('data: the buildings (OSM outlines as boxes, 300 and more within 250 m of the road), the outlines of the big ones, the other roads, the terrain and the land cover',
    D.bld.length >= 300 && D.bld.every(b => b.length === 9 && b[2] > 0 && b[3] > 0) && D.out.length > 30 && D.roads.length > 50 && D.dem.nx > 100 && D.lc.rle.length > 100,
    `${D.bld.length} buildings, ${D.out.length} outlines, ${D.roads.length} roads, terrain ${D.dem.nx} x ${D.dem.nz}`);
  const tw = D.towers.map(([x, z, w, h]) => ({ d: dLine(x, z), w, h }));
  check('data: the city\'s far towers (200 and more) round the hill, 0.3-1.5 km from the road, 12-150 m tall', tw.length >= 200 && tw.every(t => t.d > 280 && t.d < 1550 && t.h >= 12 && t.h <= 150),
    `${tw.length} towers, ${Math.round(Math.min(...tw.map(t => t.d)))}-${Math.round(Math.max(...tw.map(t => t.d)))} m from the road`);
  // the old city wall: its line (the mark) crosses the road at ~575 m (the gap the road goes through), within 10 m of the road there
  const cw = D.marks.find(m => m[1] === 'citywall'), cwPts = []; for (let k = 0; cw && k + 1 < cw[4].length; k += 2) cwPts.push([cw[4][k], cw[4][k + 1]]);
  let gap = 1e9, gapD = 0;
  for (let i = at(450); i < at(700); i++) for (let k = 0; k + 1 < cwPts.length; k++) {
    const [ax, az] = cwPts[k], dx = cwPts[k + 1][0] - ax, dz = cwPts[k + 1][1] - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((T.px[i] - ax) * dx + (T.pz[i] - az) * dz) / L));
    const d = Math.hypot(ax + dx * t - T.px[i], az + dz * t - T.pz[i]); if (d < gap) { gap = d; gapD = i * T.ds - T.startS; }
  }
  check('data: the old city wall\'s line crosses the road at ~575 m (the gap the road goes through; the place on the HUD), 4 pieces more of it', !!cw && gap < 10 && Math.abs(gapD - 575) < 60 && D.walls.filter(w => w[0] === 5).length >= 3,
    `${cwPts.length} points, nearest the road ${gap.toFixed(1)} m at ${Math.round(gapD)} m`);
  // the landmarks: generic shapes under plain descriptive labels (the rules: only geographic names; no names of buildings, people, companies or
  // brands). The list is fixed here: a new one is added on purpose, its label checked by a person.
  const LAB = ['Stolp', 'Mestno obzidje', 'Osmerokotni paviljon', 'Parkirišče avtobusov', 'Šola', 'Knjižnica'];
  const names = /n ?seoul tower|namsan tower|seoul tower|ytn|cj\b|kim|so-?wol|ahn|jung-?geun|baek-?beom|hyatt|hilton|lotte|samsung|hyundai|\bkia\b|sejong|yi sun|dongguk|palgakjeong|hanyangdoseong|baekbeom/i;
  const labs = D.marks.map(m => m[0]);
  check('data: the landmarks under plain descriptive labels only, the six of the list (no names of buildings, people or companies)', labs.length === LAB.length && labs.every(l => LAB.includes(l)) && !labs.some(l => names.test(l)), labs.join(', '));
  const said = def.names.flatMap(a => a.say || []).concat([def.desc, def.en.desc], Object.values(def.comm || {}).flat());
  check('data: the commentator\'s lines and the descriptions with no names of people, buildings or companies', !said.some(l => names.test(l)), `${said.length} lines`);
  const cr = D.cross.filter(c => c[0] > T.startS && c[0] < T.finishS), st = D.stops.filter(s => s[0] > T.startS && s[0] < T.finishS);
  check('data: the pedestrian crossings on the race\'s road (some with traffic lights) and the bus stops by it', cr.length >= 4 && cr.some(c => c[1]) && st.length >= 3,
    `${cr.length} crossings (${cr.filter(c => c[1]).length} with lights), ${st.length} bus stops`);
}

// 6. the open road's traffic: the park's green buses, taxis and the tourists' cars, scooters; vehicles both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const buses = tf.veh.filter(v => v.kind === 2), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars, vans, buses and motorbikes on the road, both ways', tf.veh.length > 6 && cars.length > 0 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${buses.length} buses, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
}

// 7. the ways to drive it (and an online race: always the race); the grid on the run-up behind the line
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b), lat = race.cars.map(c => Math.abs(T.query(c.x, c.z, c.q.i, {}).d));
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid on the run-up behind the line, on the asphalt; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[0] > 0 && backs[12] < T.startS - 5 && lat.every(d => d < T.wa[T.startIdx] - 0.6) && !net.timeTrial && net.cars.length === 2,
    `grid ${backs.map(b => b.toFixed(0)).join(' ')} m, furthest out ${Math.max(...lat).toFixed(1)} m`);
  Math.random = orig;
}

// 8. a whole race over the hill on autopilot: every car finishes, then pulls up in its own slot past the line, before the end of the road
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
  check('race: all 13 cars reach the line in Huam-dong', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 10 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 9. a whole duel in the traffic on autopilot (both cars): both reach the line, nobody on foot knocked down, the traffic keeps moving
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
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the line through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 10. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
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
