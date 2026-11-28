// Giza: an open road (def.open, the four ways to drive it on one card: the race, the time trial, the duel in the traffic and the run from
// the police), from the plateau road by the Sphinx up past the three pyramids, round the third to the viewpoint, down the desert road and
// through the town to the main road: ~9.9 km in the real scale (OSM, Copernicus DEM, docs/proge/giza.md, v6). Decision O-28-33: sand by the
// road as it really is, the invisible barriers out in the sand (8 m past the road edge), only in the town 3.4 m (the houses); no fences the
// sources do not show. A whole race on autopilot (12 AI + the player): every car reaches the line; a whole duel in the traffic: both reach
// the line, no one on foot knocked down. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/giza.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'giza'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const ROOT = path.join(__dirname, '..'), lang = fs.readFileSync(path.join(ROOT, 'js', 'lang.js'), 'utf8');

// 1. the track
check('track: »Giza, Egipt« (English »Giza, Egypt«), its own world (theme giza), an open road with four ways to drive it, 4 checkpoints, right-hand traffic',
  def.name === 'Giza, Egipt' && def.en && def.en.name === 'Giza, Egypt' && def.theme === 'giza' && def.open && !def.leftHand &&
  (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && !def.test && !def.pending,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: 9.8-10 km of race in the real scale, from the valley (~19 m) up onto the plateau (~100 m)', T.raceLen > 9800 && T.raceLen < 10000 && Math.min(...T.hy) > 10 && Math.max(...T.hy) < 115,
  `race ${T.raceLen.toFixed(0)} m, heights ${Math.min(...T.hy).toFixed(1)}..${Math.max(...T.hy).toFixed(1)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('giza'));
{
  const ws = (def.widths || []).map(w => w[1]);
  check('road: the plateau, desert and town roads 9-11 m wide', ws.length > 0 && ws.every(w => w >= 4.5 && w <= 5.5), ws.join(' '));
  const ns = def.names.map(q => q.n || q[1]), ds = T.names.map(q => q.d);
  check('road: the places on the HUD in their order along the road, each with its English in js/lang.js, the pyramids in the first quarter',
    ns.length >= 6 && ds.every((d, k) => !k || d > ds[k - 1]) && ns.every(x => lang.includes(`'${x}':`)) &&
    T.names.some(q => q.n === 'Piramide' && q.d / T.raceLen < 0.25),
    T.names.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
}
{
  // O-28-33: the barriers out in the sand on the plateau and in the desert, close only in the town
  const out = [], town = [];
  for (let s = 50; s < T.raceLen - 50; s += 50) { const i = T.idx(T.startS + s), w = T.wAt(i), m = Math.min(T.bl[i], T.br[i]) - w; if (s < 7850 || s > 7950) (s > 7950 ? town : out).push(m); }
  // (wider at the hairpins and junctions, narrower only where the road comes back near itself: js/core.js)
  const far = out.filter(m => m > 6.5).length / out.length;
  check('road (O-28-33): the invisible barriers out in the sand on the plateau and in the desert (at least 7 m past the road edge on 95 % of it), 3-4 m in the town',
    far > 0.95 && town.length > 0 && town.every(m => m > 2.9 && m < 4.1),
    `plateau and desert ${Math.round(far * 100)} % over 6.5 m (${Math.min(...out).toFixed(1)}..${Math.max(...out).toFixed(1)} m), town ${Math.min(...town).toFixed(1)}..${Math.max(...town).toFixed(1)} m`);
}
{
  // the world's data: the three pyramids, the Sphinx and the mastabas from OSM, by the road where the sources put them
  const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'giza.js'), 'utf8') + ';this.D = GZ_DATA;', ctx);
  const M = (ctx.D.marks || []).map(m => m[0]), want = ['Velika piramida', 'Druga piramida', 'Tretja piramida', 'Sfinga', 'Mastabe'];
  const world = fs.readFileSync(path.join(ROOT, 'js', 'world-giza.js'), 'utf8');
  check('world: the three pyramids, the Sphinx and the mastabas in the data (OSM outlines), the pyramids with their heights from the sources (138.5, 136.4, 61 m)',
    want.every(x => M.includes(x)) && /'Velika piramida': \[51\.84, 138\.5/.test(world) && /'Druga piramida': \[53\.13, 136\.4/.test(world) && /'Tretja piramida': \[51\.2, 61/.test(world),
    M.join(', '));
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
  while (t < 900 && r.cars.some(c => !c.finished)) {
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
  while (t < 900 && r.cars.some(c => !c.finished)) {
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
  while (t < 900 && !P.finished) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01',
    asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `gold ${M.cs[0]} s, autopilot ${P.finishTime ? (P.finishTime * 1.01).toFixed(1) : '-'} s`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
