// Flat-plane handling per model, cs vs nova. node rig.js [models,...]
'use strict';
const ROOT = process.env.GAME_ROOT || require('path').resolve(__dirname, '../..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const C = loadCore();
const HC = require(ROOT + '/tests/lib/handling.js')(C, 'cs'), HN = require(ROOT + '/tests/lib/handling.js')(C, 'nova');
const D = 180 / Math.PI, DT = HN.DT;
const ids = process.argv[2] ? process.argv[2].split(',') : ['kaze', 'pico', 'rally', 'strega', 'muscle', 'formula', 'lm', 'truck', 'miska', 'titan', 'kamen', 'mravlja', 'skorpijon', 'bizon', 'medved'];
const f = (v, d = 2) => Number.isFinite(v) ? (+v).toFixed(d) : String(v);
// turn-in: from straight at v, full lock (analogue) held; time to 90 % of steady yaw rate, yaw overshoot, beta at steady
function turnIn(H, id, kmh, assist = 2) {
  const c = H.mkCar(id, { v: kmh, assist }); for (let i = 0; i < 0.5 / DT; i++) H.step(c, { st: 0, thr: 'hold' });
  const w = []; for (let i = 0; i < 3 / DT; i++) { H.step(c, { st: 1, thr: 'hold' }); w.push(Math.abs(c.w)); }
  const ss = w.slice(-60).reduce((a, b) => a + b, 0) / 60; const t90 = w.findIndex(x => x > 0.9 * ss) * DT; const pk = Math.max(...w);
  return { t90, over: pk / ss - 1, beta: Math.abs(c.beta) * D, ay: ss * Math.hypot(c.vx, c.vz) / 9.81 };
}
// lift-off / brake / throttle in a corner at 0.8 steer: peak extra beta in 1.2 s
function pedal(H, id, kmh, what, assist = 2) {
  const c = H.mkCar(id, { v: kmh, assist }); for (let i = 0; i < 3 / DT; i++) H.step(c, { st: 0.8, thr: 'hold' });
  const b0 = Math.abs(c.beta); let mx = 0, spun = false;
  for (let i = 0; i < 1.5 / DT; i++) { H.step(c, { st: 0.8, thr: what === 'thr' ? 1 : 0, brk: what === 'brk' ? 1 : 0 }); mx = Math.max(mx, Math.abs(c.beta) - b0); if (Math.abs(c.beta) > 1.2) spun = true; }
  return { db: mx * D, spun };
}
console.log('model      phys  | ti60 t90 over beta ay | ti120 t90 over beta ay | lift db | brk db | thr(hi) db | thr(lo) db | brk(lo) db');
for (const id of ids) for (const [nm, H] of [['cs', HC], ['nova', HN]]) {
  try {
    const a = turnIn(H, id, 60), b = turnIn(H, id, 120), l = pedal(H, id, 100, 'lift'), br = pedal(H, id, 100, 'brk'), th = pedal(H, id, 80, 'thr'), tl = pedal(H, id, 80, 'thr', 0), bl = pedal(H, id, 100, 'brk', 0);
    console.log(`${id.padEnd(10)} ${nm.padEnd(5)} | ${f(a.t90)} ${f(a.over)} ${f(a.beta, 1)} ${f(a.ay)} | ${f(b.t90)} ${f(b.over)} ${f(b.beta, 1)} ${f(b.ay)} | ${f(l.db, 1)} | ${f(br.db, 1)}${br.spun ? 'S' : ''} | ${f(th.db, 1)}${th.spun ? 'S' : ''} | ${f(tl.db, 1)}${tl.spun ? 'S' : ''} | ${f(bl.db, 1)}${bl.spun ? 'S' : ''}`);
  } catch (e) { console.log(id, nm, 'ERR', String(e).slice(0, 120)); }
}
