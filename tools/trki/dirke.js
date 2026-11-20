// Trki: dirke po različicah (docs/trki-realizem.md, »Realistična v repozitoriju: jedro in dokazi«). The same seeded race of 13 cars
// (tests/lib/sim.js, set-up »race«: 12 opponents, the player on the autopilot) is run once with each of two versions of the knock
// (Core.setTest({ cv }), a fresh Core for every run) and compared car by car: the knocks between cars and against the barrier over
// 3 and over 8 m/s, the largest knock, the spins, the damage and the distance covered. Nothing of the physics is written here: every
// step is the race loop's own (tests/lib/sim.js: stepRace).
//   node tools/trki/dirke.js                              Spa and Bathurst, 150 s, Simulacija (cv 1) against Realistična (cv 6)
//   node tools/trki/dirke.js --a 1 --b 4 --secs 60 spa    other versions (1 Simulacija ... 6 Realistična), another length, other tracks
//   node tools/trki/dirke.js --phys nova --rows           the new driving physics; a row for every car
//   node tools/trki/dirke.js --json                       the results as JSON on stdout
//   GAME_ROOT=<folder> node tools/trki/dirke.js           another copy of the game (tests/lib/core.js)
// A knock counts once per touch: a step with Car.hitCar (Car.hitWall) over 3 m/s, after 12 steps without one. A spin: the nose more
// than 90° off the road's direction, counted again only once it has come back under 30°. Units: m/s, m, %, degrees.
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const argv = process.argv.slice(2), VALUED = ['--a', '--b', '--secs', '--phys'];
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CVA = +arg('--a', 1), CVB = +arg('--b', 6), SECS = +arg('--secs', 150), PHYS = arg('--phys', 'cs'), ROWS = argv.includes('--rows'), JSON_OUT = argv.includes('--json');
const TRACKS = argv.filter((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1]));
if (!TRACKS.length) TRACKS.push('spa', 'bathurst');
const NAMES = [null, 'Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara', 'Realistična'];
const D = 180 / Math.PI, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// one race with one version: a row of numbers for every car
function run(tid, cv) {
  const C = loadCore(); C.setTest({ cv });
  Math.random = SIM.seeded(77);
  const race = SIM.makeRace(C, tid, (C2, tt) => SIM.SETUPS.race.opts(C2, tt, PHYS)), T = race.track, n = Math.round(SECS / SIM.DT);
  const st = race.cars.map(() => ({ c3: 0, c8: 0, cMax: 0, w3: 0, w8: 0, wMax: 0, d3: 0, hMax: 0, spin: 0, inC: 0, inW: 0, sp: 0 }));
  for (let k = 1; k <= n; k++) {
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }   // (as the game does before every step)
    SIM.stepRace(C, race, k);
    race.cars.forEach((c, i) => { const s = st[i];
      if (c.hitCar > 3) { if (!s.inC) { s.c3++; if (c.hitCar > 8) s.c8++; } s.inC = 12; s.cMax = Math.max(s.cMax, c.hitCar); } else if (s.inC) s.inC--;
      if (c.hitWall > 3) { if (!s.inW) { s.w3++; if (c.hitWall > 8) s.w8++; } s.inW = 12; s.wMax = Math.max(s.wMax, c.hitWall); } else if (s.inW) s.inW--;
      if (c.hitDebris > 3) s.d3++;
      const q = c.q, dh = q ? Math.abs(wrap(c.h - T.hd[q.i])) * D : 0; if (dh > s.hMax) s.hMax = dh;
      if (dh > 90 && !s.sp) { s.spin++; s.sp = 1; } else if (dh < 30) s.sp = 0; });
  }
  return race.cars.map((c, i) => ({ name: c.name || String(i), player: c === race.player ? 1 : 0, dist: c.dist, dmg: (c.dmg || 0) * 100, out: c.out || c.retired || c.dnf ? 1 : 0,
    c3: st[i].c3, c8: st[i].c8, cMax: st[i].cMax, w3: st[i].w3, w8: st[i].w8, wMax: st[i].wMax, d3: st[i].d3, hMax: st[i].hMax, spin: st[i].spin }));
}

const sum = (r, k) => r.reduce((s, x) => s + x[k], 0), max = (r, k) => Math.max(...r.map(x => x[k])), f = (v, d = 1) => v.toFixed(d), sg = (v, d = 2) => (v >= 0 ? '+' : '') + v.toFixed(d);
const med = (v) => { const s = v.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const line = (cv, R) => '  cv ' + cv + ' ' + NAMES[cv] + ': car knocks over 3 m/s ' + sum(R, 'c3') + ', over 8 m/s ' + sum(R, 'c8') + ', largest ' + f(max(R, 'cMax')) + ' m/s; barrier knocks over 3 m/s ' + sum(R, 'w3') +
  ', over 8 m/s ' + sum(R, 'w8') + ', largest ' + f(max(R, 'wMax')) + ' m/s; steps with a piece hit over 3 m/s ' + sum(R, 'd3') + '; spins ' + sum(R, 'spin') + ', nose at most ' + f(max(R, 'hMax'), 0) +
  '° off the road; damage at most ' + f(max(R, 'dmg')) + ' %; out ' + sum(R, 'out') + '; distance of all ' + f(sum(R, 'dist'), 0) + ' m';
const out = {};
for (const tid of TRACKS) {
  const RA = run(tid, CVA), RB = run(tid, CVB), dd = RA.map((x, i) => RB[i].dist - x.dist), rel = RA.map((x, i) => (RB[i].dist - x.dist) / x.dist * 100);
  out[tid] = { ['cv' + CVA]: RA, ['cv' + CVB]: RB };
  if (JSON_OUT) continue;
  console.log(tid + ': ' + RA.length + ' cars, ' + SECS + ' s, ' + PHYS);
  console.log(line(CVA, RA)); console.log(line(CVB, RB));
  console.log('  cv ' + CVB + ' against cv ' + CVA + ', distance per car: largest difference ' + f(Math.max(...dd.map(Math.abs))) + ' m, mean ' + sg(rel.reduce((s, x) => s + x, 0) / rel.length) + ' %, median ' + sg(med(rel)) +
    ' %, worst ' + sg(Math.min(...rel)) + ' %; all together ' + sg((sum(RB, 'dist') - sum(RA, 'dist')) / sum(RA, 'dist') * 100) + ' %');
  if (ROWS) RA.forEach((x, i) => { const y = RB[i]; console.log('    ' + String(i).padStart(2) + (x.player ? ' P ' : '   ') + 'distance ' + f(x.dist) + ' / ' + f(y.dist) + ' m, damage ' + f(x.dmg) + ' / ' + f(y.dmg) +
    ' %, car knocks ' + x.c3 + ' / ' + y.c3 + ', barrier knocks ' + x.w3 + ' / ' + y.w3 + ', nose off the road ' + f(x.hMax, 0) + ' / ' + f(y.hMax, 0) + '°'); });
}
if (JSON_OUT) console.log(JSON.stringify(out));
