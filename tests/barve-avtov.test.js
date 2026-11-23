// The cars' colours (CLAUDE.md »Barve avtov: nobenih črnih ali zelo temnih«): every colour a car gets from the code, the AI drivers'
// (Core.aiDriver), the traffic's (render.js RD_CAR, RD_VAN, RD_TRUCK, RD_MOTO), the police's and the safety car's, is at least
// L* 38 (CIE lightness of its sRGB, i.e. relative luminance Y ≥ ~0.10; the graphite 0x5c6168 is L* 40.9); and the AI drivers' colours stay
// apart (CIE76 ΔE: no two alike, none like the one before it on the grid). The player's colours (game.js, garage.js) are #1022's.
//   node tests/barve-avtov.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');

const MIN_L = 38;
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
const dark = (cols) => cols.map((c, i) => [i, c]).filter(([, c]) => L(c) < MIN_L).map(([i, c]) => `${i}: ${hex(c)} L* ${L(c).toFixed(1)}`);
const src = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const grab = (s, re) => { const m = re.exec(s); return m ? m[1].match(/0x[0-9a-f]{6}/gi).map(Number) : []; };

// 1. the AI drivers: all of them (the longest field takes them all), none dark
const ai = []; for (let k = 0; ; k++) { const c = C.aiDriver(k).color; if (k && c === ai[0]) break; ai.push(c); if (k > 500) break; }
check(`AI drivers: ${ai.length} colours, none below L* ${MIN_L}`, ai.length > 20 && !dark(ai).length, dark(ai).join(', '));

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
  check(`traffic ${k}: ${cols.length} colours, none below L* ${MIN_L}`, cols.length > 3 && !dark(cols).length, dark(cols).join(', '));
}

// 4. the police (the marked car and the unmarked one) and the safety car (core.js)
const S = src('js/core.js');
const pol = grab(S, /name: 'POLICIJA', color: ([^,]*),/), sc = grab(S, /name: 'Varnostni avto', color: ([^,]*),/);
check(`police: ${pol.length} colours, none below L* ${MIN_L}`, pol.length === 2 && !dark(pol).length, dark(pol).join(', ') || pol.map(hex).join(', '));
check(`safety car: none below L* ${MIN_L}`, sc.length === 1 && !dark(sc).length, dark(sc).join(', ') || sc.map(hex).join(', '));

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
