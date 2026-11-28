'use strict';
// (d) izločitve v pravi dirki, Realistična: vodilni, nato vsi tekmeci hkrati; NaN, vrnitev na asfalt, čas do mirovanja, izid dirke
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'jezero', seed = +(process.argv[4] || 9), mode = process.argv[5] || 'wreck', tMax = +(process.argv[6] || 400);
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), T = new C.Track(C.TRACKS.find(d => d.id === tid));
C.setTest(root === MAIN ? {} : { cv: 6 });
const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, seed, difficulty: 1, damage: 2, wheelRule: ALL }); r.start();
const P = r.player, wq = (c) => (T.wa ? T.wa[c.q.i] : T.w), hw = (c) => c.m.wid * 0.5;
const st = new Map(); let bad = [], ev = [];
const fin = (c) => [c.x, c.z, c.vx, c.vz, c.h, c.dist, c.q.s, c.q.d, c.w].every(Number.isFinite);
let t1 = 15, t2 = 25, done1 = false, done2 = false;
for (let k = 0; k < 120 * tMax; k++) {
  Math.random = seeded(1000 + k);
  const t = r.time;
  if (r.state === 'racing' && !done1 && t >= t1) { done1 = true; const L = r.cars.filter(c => !c.isPlayer).sort((a, b) => b.dist - a.dist)[0]; if (mode === 'wreck') C.wreckCar(L); else r.retire(L); ev.push('t ' + t.toFixed(1) + ' vodilni ' + r.cars.indexOf(L) + ' v ' + L.speed.toFixed(0) + ' m/s'); }
  if (r.state === 'racing' && !done2 && t >= t2) { done2 = true; for (const c of r.cars) if (!c.isPlayer && !(c.wreck && c.wreck.dnf)) { if (mode === 'wreck') C.wreckCar(c); else r.retire(c); } ev.push('t ' + t.toFixed(1) + ' vsi tekmeci'); }
  if (!r.isOut(P)) C.aiControl(P, r, DT);
  r.step(DT);
  for (const c of r.cars) {
    if (!fin(c)) { bad.push('NaN avto ' + r.cars.indexOf(c) + ' t ' + r.time.toFixed(2)); }
    const W = c.wreck; if (!W || !W.dnf) continue;
    let s = st.get(c); if (!s) st.set(c, s = { t0: r.time, tStop: null, off: false, back: 0, moved: 0, x: 0, z: 0, fin: false, laps0: c.lap, parkJump: 0 });
    const offNow = Math.abs(c.q.d) - hw(c) >= wq(c) + 0.3, onAll = Math.abs(c.q.d) + hw(c) < wq(c);
    if (offNow) s.off = true; else if (s.off && onAll && !s.backNow) { s.back++; s.backNow = true; s.backT = r.time - s.t0; s.backStop = !!W.stop; } if (offNow) s.backNow = false;
    if (W.stop && s.tStop == null) { s.tStop = r.time - s.t0; s.x = c.x; s.z = c.z; s.onAtStop = !offNow; s.dStop = c.q.d; s.wStop = wq(c); }
    if (s.tStop != null) { const m = Math.hypot(c.x - s.x, c.z - s.z); if (m > s.moved) s.moved = m; }
    if (c.finished) s.fin = true; if (c.lap > s.laps0) { s.lapUp = (s.lapUp || 0) + 1; s.laps0 = c.lap; }
  }
  if (P.finished && r.time > t2 + 60) break;
  if (r.isOut(P) && !P.finished && r.time > t2 + 60) break;
}
const A = [...st.entries()].map(([c, s]) => Object.assign({ i: r.cars.indexOf(c), id: c.m.id, onEnd: Math.abs(c.q.d) - hw(c) < wq(c), finW: !!c.wreck.fin, stop: !!c.wreck.stop, v: +c.speed.toFixed(2) }, s));
console.log(root === MAIN ? 'MAIN' : 'SNAP', tid, 'seme', seed, mode, '|', ev.join('; '), '| t konec', r.time.toFixed(1), 'igralec finished', !!P.finished, 'pos', P.finishPos, 'dnf', !!(P.wreck && P.wreck.dnf), 'state', r.state);
console.log(' izločenih', A.length, '| brez mirovanja', A.filter(a => a.tStop == null).length, '| max čas do mirovanja', Math.max(...A.map(a => a.tStop || 0)).toFixed(1), 's | nazaj na asfalt (po tem, ko je bil že zunaj)', A.filter(a => a.back).map(a => a.i + ':' + a.back + '@' + a.backT.toFixed(1) + (a.backStop ? 'S' : '')).join(',') || '0', '| premik po mirovanju > 1 m', A.filter(a => a.moved > 1).map(a => a.i + ':' + a.moved.toFixed(1)).join(',') || '0', '| ob koncu del na asfaltu', A.filter(a => a.onEnd).map(a => a.i + (a.finW ? 'F' : '')).join(',') || '0', '| finished med izločenimi', A.filter(a => a.fin).length, '| krog po izločitvi', A.filter(a => a.lapUp).map(a => a.i + ':' + a.lapUp).join(',') || '0');
if (bad.length) console.log(' NAPAKE', bad.slice(0, 5).join(' | '), bad.length);
const E = r.estimateResults(); console.log(' estimateResults', E.length, 'vnosov; igralec', E.findIndex(e => e.car === P) + 1, '.; dnf v seznamu', E.filter(e => e.car.wreck && e.car.wreck.dnf).length, '; podvojeni', E.length - new Set(E.map(e => e.car)).size, '; ključi', Object.keys(E[E.length - 1]).join(','));
