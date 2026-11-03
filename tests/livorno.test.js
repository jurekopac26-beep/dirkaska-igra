// Livorno, Italija (track 'livorno', docs/proga-livorno.md): the old road course of 1922-1930 by Livorno on today's roads (OpenStreetMap,
// tools/proga-podatki.py, tools/livorno/build.py), no browser. The track: a closed circuit named after the place, one lap of 19.09 km, the
// heights from the sea at Ardenza up to the ridge at Castellaccio, the places in the order of the lap, the descriptive names with their English,
// the widths; then the game's Circuit race here: 100 cars from a flying start along the seafront (def.raceRivals 99, def.flyStart, as at Nürburg),
// the whole lap on the autopilot: no NaN, every car to the flag.
//   node tests/livorno.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const d = C.TRACKS.find(t => t.id === 'livorno'), T = new C.Track(d), N = T.N;
const dOf = (label) => { const p = T.names.find(q => q.n === label); return p ? p.d : -1; };

// ---- 1. the track ----
check('track: a closed circuit named after the place (Livorno, Italija / Livorno, Italy), one lap, its own world, 100 cars from a flying start',
  d && d.name === 'Livorno, Italija' && d.en && d.en.name === 'Livorno, Italy' && !d.open && d.laps === 1 && d.theme === 'livorno' && d.raceRivals === 99 && d.flyStart === true && d.rivals === 20,
  d ? `${d.name} / ${d.en && d.en.name}, ${d.laps} lap, theme ${d.theme}, raceRivals ${d.raceRivals}` : 'no track');
check('track: the lap on today\'s roads 19.09 km within 0.5 % (the reports of the time said 22.5 km: docs/proga-livorno.md)', Math.abs(T.len / 19092 - 1) < 0.005,
  `${T.len.toFixed(1)} m (realKm ${d.realKm})`);
let crossings = 0; for (const c of T.cross || []) crossings++;
check('track: the centre line does not cross itself (no level crossing anywhere on the lap)', crossings === 0, `${crossings}`);
{
  let lo = 1e9, hi = -1e9, iHi = 0, g = 0;
  for (let i = 0; i < N; i++) { if (T.hy[i] < lo) lo = T.hy[i]; if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const sHi = ((iHi * T.ds - T.startS) % T.len + T.len) % T.len;
  check('heights: from the sea at Ardenza (the start 2-6 m above it) up to the ridge at Castellaccio (280-295 m, 6.5-7.2 km into the lap) and back down, the grades at most 13 %',
    T.hy[T.startIdx] > 2 && T.hy[T.startIdx] < 6 && lo > 1 && lo < 4 && hi > 280 && hi < 295 && sHi > 6500 && sHi < 7200 && g < 0.13,
    `start ${T.hy[T.startIdx].toFixed(1)} m, lowest ${lo.toFixed(1)} m, ridge ${hi.toFixed(1)} m at ${sHi.toFixed(0)} m, steepest ${(g * 100).toFixed(1)} %`);
}
{
  const order = ['Terasa ob morju', 'Ardenza Terra', 'Montenero', 'Savolano', 'Castellaccio', 'Romito', 'Calafuria', 'Boccale', 'Antignano', 'Ardenza'], D = order.map(dOf);
  check('places in the order of the lap: the seafront terrace, Ardenza Terra, Montenero, Savolano, Castellaccio, Romito, Calafuria, Boccale, Antignano, Ardenza',
    D.every((v, k) => v >= 0 && (!k || v > D[k - 1])), order.map((p, k) => p + ' ' + Math.round(D[k])).join(', '));
  check('Romito on the coast after the descent: 11-12 km, Calafuria by its tower 13.5-14.5 km, Antignano after 16.5 km',
    dOf('Romito') > 11000 && dOf('Romito') < 12000 && dOf('Calafuria') > 13500 && dOf('Calafuria') < 14500 && dOf('Antignano') > 16500, `${Math.round(dOf('Romito'))}, ${Math.round(dOf('Calafuria'))}, ${Math.round(dOf('Antignano'))}`);
}
{
  // the HUD's names: the places as they are, the descriptive ones (Slovenian words) with their English in js/lang.js
  const PLACES = new Set(['Ardenza', 'Ardenza Terra', 'Montenero', 'Savolano', 'Castellaccio', 'Le Piagge', 'Pian della Pineta', 'Romito', 'Calafuria', 'Boccale', 'Miramare', 'Antignano']);
  const lang = fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), miss = [];
  for (const p of T.names) if (!PLACES.has(p.n) && !lang.includes(`'${p.n}':`)) miss.push(p.n);
  check('names on the HUD: places, and plain descriptions with their English (js/lang.js); every one with the commentator\'s lines', !miss.length && T.names.every(p => p.say && p.say.length >= 2),
    miss.length ? 'no English: ' + miss.join(', ') : T.names.length + ' names');
}
{
  let wmin = 1e9, wmax = 0; for (let i = 0; i < N; i++) { wmin = Math.min(wmin, T.wAt(i)); wmax = Math.max(wmax, T.wAt(i)); }
  const at = (d0) => T.wAt(T.idx(T.startS + d0));
  check('widths: the real roads in proportion: the seafront 12 m, the coast road 10.8 m, Via di Montenero 10 m, the provincial road and the streets 9.2 m',
    Math.abs(wmin - 4.6) < 0.01 && Math.abs(wmax - 6) < 0.01 && Math.abs(at(18500) - 6) < 0.01 && Math.abs(at(14000) - 5.4) < 0.01 && Math.abs(at(2000) - 5) < 0.01 && Math.abs(at(9000) - 4.6) < 0.01,
    `${(2 * wmin).toFixed(1)}-${(2 * wmax).toFixed(1)} m`);
}
{
  // the flying column needs a long run to the line: the seafront straight from Antignano (no bend under 300 m radius from 1.3 km to 350 m before
  // the line; then the road bends round the cove by the terrace, 28 m at its tightest, and crosses the bridge over the Rio Ardenza to the line)
  let ok = true, kc = 0;
  for (let dd = -1300; dd < -350; dd += T.ds) if (Math.abs(T.k[T.idx(T.startS + dd)]) > 1 / 300) ok = false;
  for (let dd = -350; dd < 0; dd += T.ds) kc = Math.max(kc, Math.abs(T.k[T.idx(T.startS + dd)]));
  check('the start: on the seafront road at Ardenza Mare, the run to the line straight from 1.3 km to 350 m before it (the flying column lines up along the sea), then the bend round the cove (20-40 m radius)',
    ok && T.startIdx === 0 && 1 / kc > 20 && 1 / kc < 40, `the bend round the cove ${(1 / kc).toFixed(0)} m`);
}

// ---- 2. the Circuit race: 100 cars from a flying start, the whole lap ----
{
  const orig = Math.random, M = C.MODELS[4];
  try {
    Math.random = seeded(7);
    const r = new C.Race(T, { numAI: d.raceRivals, playerGrid: 99, laps: 1, tt: false, playerModel: M, playerNum: M.num || 1, assist: 2,
      phys: 'cs', seed: 11, difficulty: 1, flying: 3, chars: true, slip: true, flags: true, damage: 2 });
    r.start();
    const n0 = r.cars.length, fly = !!r.flyOn;
    let k = 0, t = 0, nan = false, resc = 0;
    const t0 = Date.now();
    for (; t < 1500 && !r.cars.every(c => c.finished); t += DT) {
      Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of r.cars) if (!c.finished && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; }
      if (k % 600 === 0 && !r.cars.every(c => [c.x, c.z, c.y || 0, c.speed, c.dist].every(Number.isFinite))) { nan = true; break; }
    }
    const fin = r.cars.filter(c => c.finished).length, best = Math.min(...r.cars.map(c => c.finishTime || 1e9));
    check('the race: 100 cars from a flying start (no lights), the whole lap on the autopilot, no NaN, every car to the flag',
      n0 === 100 && fly && !nan && fin === 100,
      `${fin}/${n0} at the flag in ${t.toFixed(0)} s of race, the winner ${best.toFixed(1)} s (${(T.len / best * 3.6).toFixed(0)} km/h), ${resc} rescues, ${((Date.now() - t0) / 1000).toFixed(0)} s to run`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
