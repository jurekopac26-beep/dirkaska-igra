// Dež in sneg (docs/dez-sneg.md): the grip and the brakes on a wet and on a winter road against the same road in the dry. The car is the
// one a race of a real track gives its player (Spa: a circuit with tyres; Pikes Peak: a time trial on tarmac; Katu-Jaryk: a gravel stage;
// Harju: tarmac and gravel), measured on the flat plane of tests/lib/handling.js on that track's surface: the side grip (steady full lock
// at 80 km/h, g), the brakes' own slowing at 100 km/h (full brakes less the same car coasting, g), the braking distance 100-0 km/h and
// 0-100 km/h. The shares against the dry road must be within 3 % of the user's choice (5. 11. 2026, choice 3):
//   rain: side grip 0.65, brakes 0.70; winter tarmac: 0.70, 0.70; gravel under snow: 0.45, 0.45 (against the same gravel in the dry).
// The dry road itself must not change at all: its numbers are in tests/golden/sim.json and cs-handling.test.js, here only that no weather
// leaves the car's grip and its brakes' share at exactly 1. At the end a lap of Spa on the autopilot in the dry, in the rain and in
// winter: no wall, no rescue, slower by a sensible share.
//   node tests/oprijem.test.js [--meritve]   (--meritve: the table only, no checks: to measure another version of the game, GAME_ROOT)
'use strict';
const { loadCore } = require('./lib/core.js');
const { seeded } = require('./lib/sim.js');

const C = loadCore();
const H = require('./lib/handling.js')(C);
const { DT, G } = H;
const only = process.argv.includes('--meritve');
let bad = 0, n = 0;
const check = (name, ok, detail) => { if (only) return; n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : String(x));
const CAR = 'rally';   // (BURJA R7: the car of cs-handling.test.js and of the medal times)

// the player's car of a race on this track, as the race dresses it (its grip in this weather: Race._wet, _weather)
function raceCar(tid, opts) {
  const orig = Math.random;
  try {
    Math.random = seeded(21);
    const T = new C.Track(C.TRACKS.find(d => d.id === tid)), tt = !!T.def.timeTrial;
    const r = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS.find(m => m.id === CAR), assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 0,
      tyres: !tt && !!T.def.pit, compounds: true, playerCmp: 'M', tt }, opts));   // (tyres on a circuit with pits, as the game: js/game.js)
    r.start(); for (let k = 0; k < 30; k++) r.step(DT);   // (on the grid: the weather's first steps)
    return { race: r, P: r.player, T };
  } finally { Math.random = orig; }
}
// the measurements on the plane, on surface sf (Core CSSURF: 0 tarmac, 5 gravel), the car's grip as the race's car has it
function measure(tid, opts, sf) {
  const { race, P, T } = raceCar(tid, opts);
  H.surf(sf); H.plane.snowK = T.snowK || 0; H.wear((c) => { c.wet = P.wet; if (P.wx) c.wx = P.wx; if (P.ty) c.ty = P.ty; });
  try {
    const lat = H.steady(CAR, 80, 1.0).ay, lo = H.longi(CAR);
    const slow = (brk) => { const c = H.mkCar(CAR, { v: 100 }); c.csB = brk; const v0 = c._v; H.step(c, { thr: 0, brk }); return (v0 - c._v) / DT / G; };
    return { lat, brk: slow(1) - slow(0), d100: lo.d100, t100: lo.t100, wet: P.wet, wx: P.wx || null, tyre: P.ty ? P.ty.k : '-', race };
  } finally { H.surf(0); H.plane.snowK = 0; H.wear(); }
}

const ROWS = [
  // key, track, race options, surface, [side grip, brakes] wanted against `base` (null: the dry road itself, or only shown)
  ['spa suho', 'spa', {}, 0, null, null],
  ['spa dež', 'spa', { rain: 1 }, 0, [0.65, 0.70], 'spa suho'],
  ['spa zima', 'spa', { winter: true }, 0, [0.70, 0.70], 'spa suho'],
  ['spa zima + dež', 'spa', { winter: true, rain: 1 }, 0, [0.65 * 0.70, 0.70 * 0.70], 'spa suho'],
  ['spa dež, suhe gume', 'spa', { rain: 1, playerTyre: 'dry' }, 0, null, 'spa suho'],
  ['spa suho, dežne gume', 'spa', { playerTyre: 'wet' }, 0, null, 'spa suho'],
  ['pikes suho', 'pikes', {}, 0, null, null],
  ['pikes dež', 'pikes', { rain: 1 }, 0, [0.65, 0.70], 'pikes suho'],
  ['pikes zima', 'pikes', { winter: true }, 0, [0.70, 0.70], 'pikes suho'],
  ['katu suho (makadam)', 'katu', {}, 5, null, null],
  ['katu dež (makadam)', 'katu', { rain: 1 }, 5, [0.65, 0.70], 'katu suho (makadam)'],
  ['katu zima (makadam s snegom)', 'katu', { winter: true }, 5, [0.45, 0.45], 'katu suho (makadam)'],
  ['katu zima + dež (sneg na snegu)', 'katu', { winter: true, rain: 1 }, 5, [0.45, 0.45], 'katu suho (makadam)'],   // (snow on snow: a road packed with snow stays as it is)
  ['harju suho (asfalt)', 'harju', {}, 0, null, null],
  ['harju zima (asfalt)', 'harju', { winter: true }, 0, [0.70, 0.70], 'harju suho (asfalt)'],
  ['harju suho (makadam)', 'harju', {}, 5, null, null],
  ['harju zima (makadam s snegom)', 'harju', { winter: true }, 5, [0.45, 0.45], 'harju suho (makadam)'],
  ['harju zima + dež (asfalt)', 'harju', { winter: true, rain: 1 }, 0, [0.65 * 0.70, 0.70 * 0.70], 'harju suho (asfalt)'],
  ['harju zima + dež (sneg na snegu)', 'harju', { winter: true, rain: 1 }, 5, [0.45, 0.45], 'harju suho (makadam)'],
];
const M = {};
console.log('meritev'.padEnd(32) + 'bočno g   delež  zavore g  delež  100-0 m  0-100 s  gume');
for (const [key, tid, opts, sf, want, base] of ROWS) {
  const m = M[key] = measure(tid, opts, sf), b = base && M[base];
  const rl = b ? m.lat / b.lat : NaN, rb = b ? m.brk / b.brk : NaN;
  console.log(key.padEnd(32) + f(m.lat).padStart(7) + (b ? f(rl).padStart(8) : '        ') + f(m.brk).padStart(10) + (b ? f(rb).padStart(7) : '       ') + f(m.d100, 1).padStart(9) + f(m.t100).padStart(9) + '  ' + m.tyre);
  if (want) check(`${key}: the side grip ${want[0].toFixed(3)} and the brakes ${want[1].toFixed(3)} of the dry road's (within 3 %)`,
    Math.abs(rl / want[0] - 1) < 0.03 && Math.abs(rb / want[1] - 1) < 0.03, `side grip ${f(rl, 3)}, brakes ${f(rb, 3)}`);
}

if (!only) {
  // no weather: the car's grip and its brakes' share are exactly 1 (the dry road is not touched: its numbers in the golden references)
  for (const tid of ['spa', 'pikes', 'katu', 'harju']) { const m = M[tid === 'katu' ? 'katu suho (makadam)' : tid === 'harju' ? 'harju suho (asfalt)' : tid + ' suho'];
    check(`${tid} in the dry: the grip exactly 1, the weather's share of it and of the brakes exactly 1`, m.wet === 1 && !!m.wx && m.wx.k === 1 && m.wx.b === 1 && m.wx.w === 0, `grip ${m.wet}, weather ${JSON.stringify(m.wx)}`); }
  // the tyres of a circuit: the right ones give the plain rain's grip; slicks on a soaked road much less, rain tyres on a dry road as ever
  { const d = M['spa suho'], sl = M['spa dež, suhe gume'], wd = M['spa suho, dežne gume'], w = M['spa dež'];
    check('tyres: slicks on a soaked road grip and brake clearly worse than rain tyres there', sl.lat < w.lat * 0.85 && sl.brk < w.brk * 0.88, `side grip ${f(sl.lat / d.lat, 3)} vs ${f(w.lat / d.lat, 3)}, brakes ${f(sl.brk / d.brk, 3)} vs ${f(w.brk / d.brk, 3)}`);
    check('tyres: rain tyres on a dry road as ever (side grip 0.90, brakes 0.955 of the slicks\')', Math.abs(wd.lat / d.lat - 0.9) < 0.01 && Math.abs(wd.brk / d.brk - 0.955) < 0.005 && wd.wx.k === 1 && wd.wx.b === 1,
      `side grip ${f(wd.lat / d.lat, 3)}, brakes ${f(wd.brk / d.brk, 3)}`); }
  // the order of the slippery roads (docs/dez-sneg.md): the wet cobbles and a puddle below the dry road and above the snow
  { const S = C.CSSURF || null;
    if (S) { const wet = 0.65, snow = S[5].lat * 0.45;
      check('surfaces: the wet cobbles and a puddle grip less than their dry road and more than gravel under snow', S[8].lat * wet < S[7].lat && S[8].lat * wet > snow && S[6].lat * wet < S[5].lat && S[6].lat * wet > snow,
        `wet cobbles ${f(S[8].lat * wet, 3)}, puddle ${f(S[6].lat * wet, 3)}, snow ${f(snow, 3)}`); } }
  // the rivals' speed profile follows the same shares: the corners by the grip (speed x its root), the brakes by the brakes' share
  { const dry = raceCar('spa', {}).race, wet = raceCar('spa', { rain: 1 }).race, win = raceCar('spa', { winter: true }).race, N = dry.vprof.length;
    const ap = []; for (let i = 0; i < N; i++) { const b = dry.vprof[i]; if (b < dry.vprof[(i + N - 1) % N] && b <= dry.vprof[(i + 1) % N] && b < 60) ap.push(i); }   // (the corners' slowest points)
    const med = (r) => { const a = ap.map(i => r.vprof[i] / dry.vprof[i]).sort((x, y) => x - y); return a[a.length >> 1]; }, rw = med(wet), rs = med(win);
    check('rivals: the corners of Spa by the root of the grip (rain 0.806, winter 0.837 of the dry speed; the median of ' + ap.length + ' corners)', Math.abs(rw - Math.sqrt(0.65)) < 0.01 && Math.abs(rs - Math.sqrt(0.70)) < 0.01, `rain ${f(rw, 3)}, winter ${f(rs, 3)}`);
    check('rivals: the profile brakes by the brakes\' share of the grip (rain and winter 0.70 of the dry profile\'s)', Math.abs(wet.wxB / dry.wxB - 0.70) < 1e-9 && Math.abs(win.wxB / dry.wxB - 0.70) < 1e-9 && dry.wxB === 1,
      `rain ${f(wet.wxB, 3)}, winter ${f(win.wxB, 3)}, dry ${dry.wxB}`); }
}

// a lap of Spa on the autopilot: dry, rain, winter (the race as the game makes it: tyres), and a run of Katu-Jaryk's gravel: dry, rain, snow
function lap(tid, opts) {
  const orig = Math.random;
  try {
    const { race: r, P, T } = raceCar(tid, opts);
    let t = 0, walls = 0, resc = 0, k = 0; const tmax = T.len / 8 + 120;
    while (!P.finished && t < tmax) { Math.random = seeded(7000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.hitWall > 3) walls++; P.hitWall = 0; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    return { t: P.finished ? P.finishTime : NaN, walls, resc };
  } finally { Math.random = orig; }
}
console.log('\nkrog na avtopilotu'.padEnd(33) + 'čas s   proti suhemu  stene  reševanja');
for (const [tid, rows] of [['spa', [['suho', {}], ['dež', { rain: 1 }], ['zima', { winter: true }]]], ['katu', [['suho', {}], ['dež', { rain: 1 }], ['zima (sneg)', { winter: true }]]]]) {
  let dry = null;
  for (const [name, opts] of rows) {
    const L = lap(tid, opts); if (!dry) dry = L;
    const k = L.t / dry.t;
    console.log((tid + ' ' + name).padEnd(32) + f(L.t).padStart(7) + (L === dry ? '              ' : ('+' + f((k - 1) * 100, 1) + ' %').padStart(14)) + String(L.walls).padStart(7) + String(L.resc).padStart(11));
    check(`${tid} ${name}: the autopilot's lap to the finish, no wall, no rescue` + (L === dry ? '' : ', 8-60 % slower than in the dry'), L.t > 0 && !L.walls && !L.resc && (L === dry || (k > 1.08 && k < 1.6)), `${f(L.t)} s`);
  }
}
if (only) process.exit(0);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks passed`);
process.exit(bad ? 1 : 0);
