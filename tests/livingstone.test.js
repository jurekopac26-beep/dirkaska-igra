// Livingstone: an open road south of the town (def.open, the four ways to drive it on one card as Chapman's Peak: the race, the time
// trial, the duel in the traffic and the run from the police), through the dry woodland, past the border post and over the old steel
// arch bridge across the gorge to the far bank: 4-5 km in the real scale (OSM, Copernicus DEM), left-hand traffic, the bridge in the
// race's second half (def.bridges, docs/proge/livingstone.md). A whole race on autopilot (12 AI + the player): every car reaches the
// line; a whole duel in the traffic: both reach the line, no one on foot knocked down. The medal times: the stock rally car on the autopilot.
//   node tests/livingstone.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'livingstone'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const lang = fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8');

// 1. the track
check('track: »Livingstone, Zambija« (English »Livingstone, Zambia«), its own world (theme livingstone), an open road with four ways to drive it, left-hand traffic, 4 checkpoints',
  def.name === 'Livingstone, Zambija' && def.en && def.en.name === 'Livingstone, Zambia' && def.theme === 'livingstone' && def.open && def.leftHand &&
  (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && !def.test && !def.pending,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: 4.0-4.8 km of race in the real scale, gently rolling (the heights within ~25 m)', T.raceLen > 4000 && T.raceLen < 4800 && Math.max(...T.hy) - Math.min(...T.hy) < 25,
  `race ${T.raceLen.toFixed(0)} m, heights ${Math.min(...T.hy).toFixed(1)}..${Math.max(...T.hy).toFixed(1)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('livingstone'));
{
  const ws = (def.widths || []).map(w => w[1]), br = def.bridges || [];
  check('road: the trunk road 8.8-10.4 m wide, the bridge the narrowest', ws.length > 0 && ws.every(w => w >= 4.4 && w <= 5.2) && Math.min(...ws) === 4.4, ws.join(' '));
  check('road: one bridge over the gorge, ~150-250 m long, in the race\'s second half', br.length === 1 && br[0][1] - br[0][0] > 150 && br[0][1] - br[0][0] < 250 &&
    br[0][0] / T.raceLen > 0.5 && br[0][1] / T.raceLen < 0.8, JSON.stringify(br));
  const ns = def.names.map(q => q.n || q[1]), ds = T.names.map(q => q.d);
  check('road: the places on the HUD in their order along the road, each with its English in js/lang.js, the old bridge among them',
    ns.length >= 4 && ds.every((d, k) => !k || d > ds[k - 1]) && ns.every(x => lang.includes(`'${x}':`)) && lang.includes(`'${def.escTo}':`) &&
    T.names.some(q => q.n === 'Stari most' && q.d / T.raceLen > 0.55 && q.d / T.raceLen < 0.75),
    T.names.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
}

// 2. the ways to drive it
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  check('mode: the time trial (the player alone on the line), the race (13 cars on the grid), the run from the police (the police and the traffic on the road)',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && !!pol.pol && !!pol.tf);
  Math.random = orig;
}

// 3. a whole race on autopilot: every car reaches the line
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the line', fin.length === 13,
    `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
}

// 4. a whole duel in the traffic on autopilot
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the line through the traffic, no one on foot knocked down', r.cars.every(c => c.finished) && !hits,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, ${r.tf.veh.length} vehicles`);
}

// 5. the medals: the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => a && a[0] > 0 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0;
  while (t < 600 && !P.finished) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01',
    asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `gold ${M.cs[0]} s, autopilot ${P.finishTime ? (P.finishTime * 1.01).toFixed(1) : '-'} s`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
