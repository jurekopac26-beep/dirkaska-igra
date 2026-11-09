// Zürich, Švica (track 'zurich', docs/proge/zurich.md): a city race from the lake up the hill (OpenStreetMap, tools/proga-podatki.py,
// tools/zurich/build.py), no browser. The track: a closed circuit named after the place, one lap of 4.55 km (within the 1-5 km of a new track),
// the quay by the lake and the climb of ~78 m up the hill, the places in the order of the lap, no names of people, the widths, no bridges, the
// bends rounded to at least 13 m; then the game's race here: the field of 12 over 3 laps on the autopilot, no NaN, every car to the flag.
//   node tests/zurich.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const d = C.TRACKS.find(t => t.id === 'zurich'), T = new C.Track(d), N = T.N;
const dOf = (label) => { const p = T.names.find(q => q.n === label); return p ? p.d : -1; };

// ---- 1. the track ----
check('track: a closed circuit named after the place (Zürich, Švica / Zürich, Switzerland), 3 laps, its own world, a test track (the user\'s decision 7. 11. 2026)',
  d && d.name === 'Zürich, Švica' && d.en && d.en.name === 'Zürich, Switzerland' && !d.open && d.laps === 3 && d.theme === 'zurich' && d.test === true && !d.pending,
  d ? `${d.name} / ${d.en && d.en.name}, ${d.laps} laps, theme ${d.theme}` : 'no track');
check('track: the lap 4.55 km within 1 % (within the 1-5 km of a new track)', Math.abs(T.len / 4549 - 1) < 0.01, `${T.len.toFixed(1)} m`);
let crossings = 0; for (const c of T.cross || []) crossings++;
check('track: the centre line does not cross itself', crossings === 0, `${crossings}`);
{
  let lo = 1e9, hi = -1e9, g = 0;
  for (let i = 0; i < N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  const hq = T.hy[0], hTop = T.hy[T.idx(T.startS + dOf('Dolderstrasse'))];
  check('heights: the quay by the lake 2-3.5 m above it, the top of the hill 65-85 m above the lake (by Römerhof and Dolderstrasse), the grades at most 13 %',
    lo > 1.8 && lo < 3.5 && hq < 3.5 && hi > 65 && hi < 85 && hTop > 60 && g < 0.13, `lowest ${lo.toFixed(1)} m, highest ${hi.toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
{
  const order = ['Utoquai', 'Feldeggstrasse', 'Kreuzplatz', 'Klosbachstrasse', 'Römerhof', 'Dolderstrasse', 'Hottingerstrasse', 'Heimplatz', 'Bellevue'], D = order.map(dOf);
  check('places in the order of the lap: Utoquai, Feldeggstrasse, Kreuzplatz, Klosbachstrasse, Römerhof, Dolderstrasse, Hottingerstrasse, Heimplatz, Bellevue',
    D.every((v, k) => v >= 0 && (!k || v > D[k - 1])), order.map((p, k) => p + ' ' + Math.round(D[k])).join(', '));
}
{
  // the HUD's names: the places as they are, any descriptive ones (Slovenian words) with their English in js/lang.js; no names of people
  const PLACES = new Set(['Utoquai', 'Feldeggstrasse', 'Kreuzplatz', 'Klosbachstrasse', 'Römerhof', 'Dolderstrasse', 'Hottingerstrasse', 'Heimplatz', 'Bellevue']);
  const lang = fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), miss = [];
  for (const p of T.names) if (!PLACES.has(p.n) && !lang.includes(`'${p.n}':`)) miss.push(p.n);
  const people = /Brun|Guisan|Bürkli|Escher|Zwingli|Pestalozzi/;
  check('names on the HUD: places, and plain descriptions with their English (js/lang.js); every one with the commentator\'s lines; no people\'s names',
    !miss.length && T.names.every(p => p.say && p.say.length >= 2) && !T.names.some(p => people.test(p.n) || (p.say || []).some(l => people.test(l))),
    miss.length ? 'no English: ' + miss.join(', ') : T.names.length + ' names');
}
{
  let wmin = 1e9, wmax = 0; for (let i = 0; i < N; i++) { wmin = Math.min(wmin, T.wAt(i)); wmax = Math.max(wmax, T.wAt(i)); }
  check('widths: the streets 10.8-12 m (Bergstrasse and Dolderstrasse up on the hill the narrowest, the quay and Rämistrasse the widest)',
    wmin > 5.3 && wmin < 5.5 && wmax > 5.9 && wmax < 6.1, `${(2 * wmin).toFixed(1)}-${(2 * wmax).toFixed(1)} m`);
}
{
  const br = d.bridgesS || [];
  check('bridges: none on the lap (the culvert on Bergstrasse is no bridge)', br.length === 0, br.map(([a, b]) => `${a.toFixed(0)}-${b.toFixed(0)} m`).join(', ') || 'none');
  let kmax = 0; for (let i = 0; i < N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  check('bends: the tightest radius at least ~12 m (the street corners rounded for the race)', 1 / kmax > 11.5, `${(1 / kmax).toFixed(1)} m`);
}

// ---- 2. the race: the field over 3 laps ----
{
  const orig = Math.random, M = C.MODELS[4];
  try {
    Math.random = seeded(7);
    const r = new C.Race(T, { numAI: d.rivals, playerGrid: d.rivals, laps: 3, tt: false, playerModel: M, playerNum: M.num || 1, assist: 2,
      phys: 'cs', seed: 11, difficulty: 1, chars: true, slip: true, flags: true, damage: 2 });
    r.start();
    const n0 = r.cars.length;
    let k = 0, t = 0, nan = false, resc = 0;
    for (; t < 900 && !r.cars.every(c => c.finished); t += DT) {
      Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of r.cars) if (!c.finished && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; }
      if (k % 600 === 0 && !r.cars.every(c => [c.x, c.z, c.y || 0, c.speed, c.dist].every(Number.isFinite))) { nan = true; break; }
    }
    const fin = r.cars.filter(c => c.finished).length, best = Math.min(...r.cars.map(c => c.finishTime || 1e9));
    check('the race: the field of 12 over 3 laps on the autopilot, no NaN, every car to the flag, few rescues',
      n0 === 12 && !nan && fin === n0 && resc <= 6,
      `${fin}/${n0} at the flag in ${t.toFixed(0)} s, the winner ${best.toFixed(1)} s (${(3 * T.len / best * 3.6).toFixed(0)} km/h), ${resc} rescues`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
