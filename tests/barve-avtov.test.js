// The cars' colours (CLAUDE.md »Barve avtov: nobenih črnih ali zelo temnih«): every colour a car gets from the code, the AI drivers'
// (Core.aiDriver), the traffic's (render.js RD_CAR, RD_VAN, RD_TRUCK, RD_MOTO), the police's, the safety car's and the player's
// (game.js PLAYER_COLORS, garage.js COLORS, garage3d.js CIRC_COLS), is light: at least L* 38 (CIE lightness of its sRGB) AND its
// strongest channel at least 160 of 255. The second rule is the one a grey, a brown or a bottle green fails: the graphite 0x5c6168
// (L* 40.9, strongest channel 104) passed L* alone and still drew as a dark car, its faces away from the sun near black (the user's
// »ne«, 23. 11.). The AI drivers' colours stay apart (CIE76 ΔE: no two alike, none like the one before it on the grid). And it holds on
// EVERY track (circuits too): a race is built on each one with its own field, and every car in it has one of the checked colours.
//   node tests/barve-avtov.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');

const MIN_L = 38, MIN_V = 160;
const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lab = (h) => {
  const r = lin(h >> 16 & 255), g = lin(h >> 8 & 255), b = lin(h & 255), f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const L = (h) => lab(h)[0], dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const hex = (h) => '0x' + h.toString(16).padStart(6, '0');
const V = (h) => Math.max(h >> 16 & 255, h >> 8 & 255, h & 255), light = (c) => L(c) >= MIN_L && V(c) >= MIN_V;
const dark = (cols) => cols.map((c, i) => [i, c]).filter(([, c]) => !light(c)).map(([i, c]) => `${i}: ${hex(c)} L* ${L(c).toFixed(1)} max ${V(c)}`);
const src = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const grab = (s, re) => { const m = re.exec(s); return m ? m[1].match(/0x[0-9a-f]{6}/gi).map(Number) : []; };

// 1. the AI drivers: all of them (the longest field takes them all), none dark
const ai = []; for (let k = 0; ; k++) { const c = C.aiDriver(k).color; if (k && c === ai[0]) break; ai.push(c); if (k > 500) break; }
check(`AI drivers: ${ai.length} colours, none dark`, ai.length > 20 && !dark(ai).length, dark(ai).join(', '));

// 2. the AI drivers apart: no two alike (ΔE ≥ 5), none like the one before it on the grid (ΔE ≥ 30)
let mA = 1e9, mC = 1e9, pA = '', pC = '';
for (let i = 0; i < ai.length; i++) {
  if (i) { const d = dE(ai[i], ai[i - 1]); if (d < mC) { mC = d; pC = `${i - 1}↔${i}`; } }
  for (let j = 0; j < i; j++) { const d = dE(ai[i], ai[j]); if (d < mA) { mA = d; pA = `${j}↔${i}`; } }
}
check('AI drivers: no two alike (ΔE ≥ 5)', mA >= 5, `min ΔE ${mA.toFixed(1)} (${pA})`);
check('AI drivers: none like the one before it on the grid (ΔE ≥ 30)', mC >= 30, `min ΔE ${mC.toFixed(1)} (${pC})`);

// 3. the traffic's cars, vans, trucks' cabs and motorbikes (render.js)
const R = src('js/render.js');
for (const k of ['RD_CAR', 'RD_VAN', 'RD_TRUCK', 'RD_MOTO']) {
  const cols = grab(R, new RegExp(k + ' = \\[([^\\]]*)\\]'));
  check(`traffic ${k}: ${cols.length} colours, none dark`, cols.length > 3 && !dark(cols).length, dark(cols).join(', '));
}

// 4. the police (the marked car and the unmarked one) and the safety car (core.js)
const S = src('js/core.js');
const pol = grab(S, /name: 'POLICIJA', color: ([^,]*),/), sc = grab(S, /name: 'Varnostni avto', color: ([^,]*),/);
check(`police: ${pol.length} colours, none dark`, pol.length === 2 && !dark(pol).length, dark(pol).join(', ') || pol.map(hex).join(', '));
check(`safety car: none dark`, sc.length === 1 && !dark(sc).length, dark(sc).join(', ') || sc.map(hex).join(', '));

// 5. the player's colours: the game's 16, the garage's same 16 (with names), the garage floor's first eight
const G = src('js/game.js'), pl = grab(G, /PLAYER_COLORS = \[([^\]]*)\]/), gar = grab(src('js/garage.js'), /const COLORS = \[([\s\S]*?)\]\];/), circ = grab(src('js/garage3d.js'), /CIRC_COLS = \[([^\]]*)\]/);
check(`player: ${pl.length} colours, none dark`, pl.length === 16 && !dark(pl).length, dark(pl).join(', '));
check('player: the garage has the same colours', gar.join() === pl.join() && circ.join() === pl.slice(0, 8).join(), `garage ${gar.length}, floor ${circ.length}`);
{ const m = /colFix = \(c\) => ([^;]*);/.exec(G), fix = m && new Function('PLAYER_COLORS', 'OLD_BLACK', 'OLD_GRAPHITE', 'OLD_GREY', 'return (c) => ' + m[1])(pl, 0x1a1a1f, 0x5c6168, 0x7d8288);
  const old = [0x1a1a1f, 0x5c6168, 0x7d8288, undefined].map(c => fix ? fix(c) : 0);
  check("player: an old file's dark colour (a ghost, a friend's challenge) is drawn light", !dark(old).length, dark(old).join(', ')); }

// 6. every track, the circuits too: a race with the track's own field, every car in it (the AI, a track's own cars) light. No track file
// names a colour of its own for a car: all of them come from the lists above
{ const t0 = Date.now(), badT = [], seen = new Set(); let cars = 0;
  for (const d of C.TRACKS) {
    const r = new C.Race(new C.Track(d), { numAI: d.raceRivals || d.rivals || 12, playerGrid: 99, laps: 1, playerModel: C.MODELS[0], playerColor: pl[0], seed: 3 });
    for (const c of r.cars) { cars++; seen.add(c.color); if (typeof c.color !== 'number' || !light(c.color)) badT.push(`${d.id}: ${c.name} ${typeof c.color === 'number' ? hex(c.color) : c.color}`); }
  }
  const known = new Set([...ai, ...pl, ...pol, ...sc]), odd = [...seen].filter(c => !known.has(c));
  check(`every track: ${C.TRACKS.length} tracks, ${cars} cars on their grids, none dark`, C.TRACKS.length > 60 && !badT.length, badT.slice(0, 8).join(', ') || `${Date.now() - t0} ms`);
  check('every track: no colour from outside the checked lists', !odd.length, odd.map(hex).join(', '));
  const dir = path.join(__dirname, '..', 'js', 'tracks'), own = fs.readdirSync(dir).filter(f => /\.js$/.test(f) && /\b(aiColors?|carColors?|AI_COLORS|playerColor)\b/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  check('every track: no track file sets a car colour of its own', !own.length, own.join(', ')); }

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
