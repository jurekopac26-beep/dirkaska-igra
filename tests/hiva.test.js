// Hiva, Uzbekistan (track 'hiva', docs/proge/hiva.md): a city course round the walls of Itchan Kala, the old town of Khiva, on today's streets
// (OpenStreetMap, Copernicus DEM; tools/proga-podatki.py, tools/hiva/build.py), no browser. The track: a closed lap of ~3.05 km named after the
// place, flat (the oasis, 93-99 m), the places on the HUD in the order of the lap with their English in js/lang.js (descriptive names only: the
// streets bear people's names), the race widths; its world (js/world-hiva.js) with the landmark (the walls and the minarets); then a race on
// the autopilot: 13 cars, one lap, every car to the flag, no NaN.
//   node tests/hiva.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'hiva'), T = new C.Track(def), N = T.N;
const root = path.join(__dirname, '..');
const lang = fs.readFileSync(path.join(root, 'js', 'lang.js'), 'utf8');

// 1. the track
check('track: »Hiva, Uzbekistan« (English »Khiva, Uzbekistan«), a closed lap, 3 laps, its own world (theme hiva), a real track (not test, not pending)',
  def && def.name === 'Hiva, Uzbekistan' && def.en && def.en.name === 'Khiva, Uzbekistan' && !def.open && def.laps === 3 && def.theme === 'hiva' && !def.test && !def.pending && !def.leftHand,
  def ? `${def.name} / ${def.en && def.en.name}, ${def.laps} laps` : 'no track');
check('track: the lap 2.95-3.1 km (realKm 3.05)', T.len > 2950 && T.len < 3100, `${T.len.toFixed(1)} m`);
{
  let lo = 1e9, hi = -1e9, g = 0, nan = 0;
  for (let i = 0; i < N; i++) { if (!isFinite(T.hy[i]) || !isFinite(T.px[i])) nan++; lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i] || 0)); }
  check('track: flat as the oasis (the heights within 90-102 m, grades under 6 %), no NaN', !nan && lo > 90 && hi < 102 && g < 0.06, `${lo.toFixed(1)}..${hi.toFixed(1)} m, max grade ${(g * 100).toFixed(1)} %, NaN ${nan}`);
  // the lap closes on itself: the last point of the centre line next to the first
  const gap = Math.hypot(T.px[N - 1] - T.px[0], T.pz[N - 1] - T.pz[0]);
  check('track: the lap closes (the last point of the centre line within 2 ds of the first)', gap < 2 * T.ds + 0.5, `${gap.toFixed(2)} m`);
}
{
  const ws = (def.widths || []).map(w => w[1]);
  // (5.8 m: the lane past the east gate, s 1896-1961, as OSM draws it: the gate stands beside it, not on it; 22. 11.)
  check('road: the race widths of the streets 8.8-10.4 m, the lane past the east gate 5.8 m', ws.length > 0 && ws.every(w => (w >= 4.4 && w <= 5.2) || w === 2.9), ws.join(' '));
  const ns = def.names.map(q => q.n || q[0]), ds = T.names.map(q => ((q.d - T.startS) % T.len + T.len) % T.len);
  check('road: the places on the HUD in the order of the lap, each with its English in js/lang.js, the four gates and the minaret among them',
    ns.length >= 6 && ds.every((d, k) => !k || d > ds[k - 1]) && ns.every(x => lang.includes(`'${x}':`)) &&
    ['Zahodna vrata', 'Severna vrata', 'Vzhodna vrata', 'Južna vrata', 'Pod minaretom'].every(x => ns.includes(x)),
    T.names.map((q, k) => `${q.n}@${Math.round(ds[k])}`).join(', '));
}

// 2. the world: its own builder, the data, the landmark (the walls of OSM, the minarets), the hooks in index.html
{
  const w = fs.readFileSync(path.join(root, 'js', 'world-hiva.js'), 'utf8'), idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const D = (() => { const s = fs.readFileSync(path.join(root, 'js', 'data', 'hiva.js'), 'utf8'); return new Function(s + '; return HV_DATA;')(); })();
  check('world: js/world-hiva.js (World.ext.hiva) with the landmark through World.znamenitost, and the scripts in index.html after js/znamenitost.js',
    /World\.ext\.hiva\s*=/.test(w) && /World\.znamenitost\.add\('hiva'/.test(w) &&
    idx.indexOf('js/tracks/hiva.js') > 0 && idx.indexOf('js/znamenitost.js') < idx.indexOf('js/data/hiva.js') && idx.indexOf('js/data/hiva.js') < idx.indexOf('js/world-hiva.js'));
  const nw = (D.cwall || []).reduce((a, [, fl]) => a + fl.length / 2, 0);
  check('world: the data: the corridor\'s terrain and land cover, the buildings within 60 m, the walls of the old town (OSM city_wall)',
    D.dem && D.lc && D.far && D.bld.length > 30 && (D.cwall || []).length >= 5 && nw > 100, `${D.bld.length} buildings, ${(D.cwall || []).length} wall lines (${nw} points)`);
  // the landmark only after OSM (tools/hiva/obzidje.py): its defensive towers and the four gates' footprints, no towers spaced by the builder
  check('world: the landmark after OSM: the towers at OSM\'s defensive towers, the four gates in their footprints, no invented towers or houses',
    (D.towers || []).length >= 30 && (D.gates || []).length === 4 && !/acc \+= 28|nFill/.test(w), `${(D.towers || []).length} towers, ${(D.gates || []).length} gates`);
}

// 3. a race on the autopilot: 13 cars, one lap, every car to the flag
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, nan = 0;
  while (t < 400 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (!isFinite(P.x) || !isFinite(P.z)) nan++;
  }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the flag after a lap, no NaN', fin.length === 13 && !nan,
    `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), rescues ${resc}`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
