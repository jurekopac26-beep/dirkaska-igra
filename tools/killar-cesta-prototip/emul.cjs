// proto: does the track file's own copy of the base profile (KILLAR_H -> grid, 3 passes of the +-10 sample mean) match what core builds today?
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const { seeded } = require(path.join(ROOT, 'tests/lib/sim.js'));
const C = loadCore(), def = C.TRACKS.find(d => d.id === 'killar');
const o = Math.random; Math.random = seeded(3); const T = new C.Track(def); Math.random = o;
const N = 2375, L = 4747.55, ds = L / (N - 1), kf = def.elev;   // (the baked numbers; T.N, T.len for the check)
console.log('T.N', T.N, 'T.len', T.len, 'T.ds', T.ds, 'baked ds', ds, 'elev pts', kf.length, 'hy type', T.hy.constructor.name);
function base(N, L) {
  const ds = L / (N - 1), K = kf.length; let a = new Float64Array(N);
  for (let i = 0, m = 0; i < N; i++) { const s = i * ds; while (m < K - 1 && kf[m + 1][0] * L <= s) m++; if (m >= K - 1) a[i] = kf[K - 1][1]; else { const p = kf[m], q = kf[m + 1]; a[i] = p[1] + (q[1] - p[1]) * Math.min(1, Math.max(0, (s - p[0] * L) / Math.max(1e-6, (q[0] - p[0]) * L))); } }
  for (let n = 0; n < 3; n++) { const b = new Float64Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -10; d <= 10; d++) s += a[Math.min(N - 1, Math.max(0, i + d))]; b[i] = s / 21; } a = b; }
  return a;
}
const B = base(N, L);
// today's hy = that + one pass of the 3-sample mean
const one = new Float64Array(N); for (let i = 0; i < N; i++) one[i] = (B[Math.max(0, i - 1)] + B[i] + B[Math.min(N - 1, i + 1)]) / 3;
let d1 = 0, d0 = 0; for (let i = 0; i < N; i++) { d1 = Math.max(d1, Math.abs(one[i] - T.hy[i])); d0 = Math.max(d0, Math.abs(B[i] - T.hy[i])); }
console.log('max |emulated(+1 pass) - T.hy| =', d1.toExponential(2), 'm; max |emulated(no pass) - T.hy| =', (d0 * 1000).toFixed(2), 'mm');
// the road built from the emulated base as def.elev on the grid with elevSmooth 2: how far from today's?
const C2 = loadCore(), def2 = C2.TRACKS.find(d => d.id === 'killar');
Object.assign(def2, { elev: Array.from(B, (h, i) => [i / (N - 1), h]), elevSmooth: 2 });
Math.random = seeded(3); const T2 = new C2.Track(def2); Math.random = o;
let d2 = 0, g2 = 0, c2 = 0; for (let i = 0; i < N; i++) { d2 = Math.max(d2, Math.abs(T2.hy[i] - T.hy[i])); g2 = Math.max(g2, Math.abs(T2.grade[i] - T.grade[i])); c2 = Math.max(c2, Math.abs(T2.curv[i] - T.curv[i])); }
console.log('grid elev + elevSmooth 2: max |hy - today| =', (d2 * 1000).toFixed(2), 'mm, grade', g2.toExponential(2), 'curv', c2.toExponential(2));
