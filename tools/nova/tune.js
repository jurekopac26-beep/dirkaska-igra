// Handling rig for tuning nova: node tune.js '<json overrides>' [models]
// overrides: { K: {NVK keys}, A: [ {NVASSIST[0] keys}, {..[1]}, {..[2]} ] }
'use strict';
const ROOT = process.env.GAME_ROOT || require('path').resolve(__dirname, '../..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const C = loadCore();
const ov = JSON.parse(process.argv[2] || '{}');
Object.assign(C.NVK, ov.K || {}); (ov.A || []).forEach((a, i) => a && Object.assign(C.NVASSIST[i], a));
const H = require(ROOT + '/tests/lib/handling.js')(C, 'nova');
const D = 180 / Math.PI, DT = H.DT;
const ids = process.argv[3] ? process.argv[3].split(',') : ['kaze', 'pico', 'rally', 'strega', 'muscle', 'formula', 'lm', 'truck', 'miska', 'titan', 'mravlja', 'bizon', 'medved', 'tornado'];
const f = (v, d = 1) => Number.isFinite(v) ? (+v).toFixed(d) : String(v);
// full lock from straight, digital (buttons) or analogue, throttle holding the speed: peak and end slide, end lateral g along the path
function lock(id, kmh, assist, digital) {
  const c = H.mkCar(id, { v: kmh, assist, digital }); for (let i = 0; i < 0.3 / DT; i++) H.step(c, { st: 0, thr: 'hold' });
  let mx = 0, ay = 0, n = 0; const T = 3;
  for (let i = 0; i < T / DT; i++) { H.step(c, { st: 1, thr: 'hold' }); const b = Math.abs(c.beta); mx = Math.max(mx, b); if (i > (T - 1) / DT) { ay += Math.abs(c.wPath) * Math.hypot(c.vx, c.vz) / 9.81; n++; } }
  return { pk: mx * D, end: Math.abs(c.beta) * D, ay: ay / n, spun: mx > 1.2 };
}
// pedal change in a 0.7-steer corner: peak added slide in 1.5 s
function pedal(id, kmh, what, assist) {
  const c = H.mkCar(id, { v: kmh, assist }); for (let i = 0; i < 3 / DT; i++) H.step(c, { st: 0.7, thr: 'hold' });
  const b0 = Math.abs(c.beta); let mx = 0, spun = false;
  for (let i = 0; i < 1.5 / DT; i++) { H.step(c, { st: 0.7, thr: what === 'thr' ? 1 : 0, brk: what === 'brk' ? 1 : 0 }); mx = Math.max(mx, Math.abs(c.beta) - b0); if (Math.abs(c.beta) > 1.2) spun = true; }
  return { db: mx * D, b0: b0 * D, spun };
}
// a lane change at speed (flick left 0.4 s, right 0.4 s, centre): peak slide and settling
function flick(id, kmh, assist) {
  const c = H.mkCar(id, { v: kmh, assist, digital: true }); let mx = 0;
  for (let i = 0; i < 2.5 / DT; i++) { const t = i * DT; H.step(c, { st: t < 0.4 ? 1 : t < 0.8 ? -1 : 0, thr: 'hold' }); mx = Math.max(mx, Math.abs(c.beta)); }
  return { pk: mx * D, end: Math.abs(c.beta) * D };
}
const rows = [];
let score = 0;
for (const id of ids) {
  const r = { id };
  const L = [lock(id, 60, 2, true), lock(id, 110, 2, true), lock(id, 160, 2, true)];
  const Ll = [lock(id, 60, 0, true), lock(id, 110, 0, true)];
  const AL = +(process.env.LO || 0); const B = pedal(id, 100, "brk", 2), Bl = pedal(id, 100, "brk", AL), Th = pedal(id, 70, "thr", 2), Tl = pedal(id, 70, "thr", AL), Li = pedal(id, 110, 'lift', 2);
  const Fk = flick(id, 120, 2), Fl = flick(id, 120, 0);
  const s = (x) => x.spun ? 'S' : '';
  console.log(`${id.padEnd(8)} lock hi 60:${f(L[0].pk)}/${f(L[0].end)} ${f(L[0].ay, 2)}g 110:${f(L[1].pk)}/${f(L[1].end)} ${f(L[1].ay, 2)}g 160:${f(L[2].pk)}/${f(L[2].end)} ${f(L[2].ay, 2)}g | lo 60:${f(Ll[0].pk)}${s(Ll[0])} 110:${f(Ll[1].pk)}${s(Ll[1])} | brk hi ${f(B.db)}${s(B)} lo ${f(Bl.db)}${s(Bl)} | thr hi ${f(Th.db)}${s(Th)} lo ${f(Tl.db)}${s(Tl)} | lift ${f(Li.db)} | flick hi ${f(Fk.pk)}/${f(Fk.end)} lo ${f(Fl.pk)}/${f(Fl.end)}`);
}
