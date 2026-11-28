'use strict';
// korak 3 (F3, voznja-5), krog 28. 11.: sled enega primera iz odstop.js: lega (s, d), smer glede na progo, hitrost, plin, zavora in škoda izločenega
// avta, avto, za katerim ga retireBlocked ustavlja (ZAPRT za ..., reza, hitrost zapiranja), in vsak dotik. Privzeto primer, ki je pokazal napako:
// Toskana, korak 1500, avto 7, Simulacija (CV=1 TRACK=toskana RK=1500 CAR=7 AFTER=7 EVERY=15); NO=1 izklopi retireBlocked.
// Zagon: node sled.js > sled-po.log;   TRKI_SNAP=<drevo 26d2b1d> node sled.js > sled-pred.log
const { SNAP, loadInst } = require('../../krog-25-11/fizika/lib.js');
const wrapCC = ['function carCollide(a, b) {', `function carCollide(a, b) { const g = globalThis.__ev; if (!g) return carCollide0(a, b); const s = [a.vx, a.vz, a.w, b.vx, b.vz, b.w]; const r = carCollide0(a, b); if (a.vx !== s[0] || a.vz !== s[1] || a.w !== s[2] || b.vx !== s[3] || b.vz !== s[4] || b.w !== s[5]) g(a, b, Math.hypot(s[0] - s[3], s[1] - s[4]), s); return r; }\n  function carCollide0(a, b) {`];
const rbTrue = ['if (cl > 0 && f - (c.m.len + o.m.len * kc + o.m.wid * ks) * 0.5 < 0.8 + cl * cl / 12) return true;', 'if (cl > 0 && f - (c.m.len + o.m.len * kc + o.m.wid * ks) * 0.5 < 0.8 + cl * cl / 12) { if (globalThis.__rb) globalThis.__rb(c, o, f - (c.m.len + o.m.len * kc + o.m.wid * ks) * 0.5, cl); return true; }'];
const noRB = ['function retireBlocked(c, race, v) {', 'function retireBlocked(c, race, v) { return false; }\n  function retireBlocked0(c, race, v) {'];
const E = process.env, cv = +(E.CV || 1), tid = E.TRACK || 'toskana', RK = +(E.RK || 1500), ci = +(E.CAR || 7), AFTER = +(E.AFTER || 7), NO = E.NO === '1', EVERY = +(E.EVERY || 15);
const L = loadInst(SNAP, NO ? [wrapCC, noRB] : [wrapCC, rbTrue]);
L.C.setTest({ cv });
Math.random = L.SIM.seeded(7);
const r = L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, tt, 'cs', t), { seed: 9 }));
const T = r.track, c = r.cars[ci], id = (o) => r.cars.indexOf(o) + ':' + (o.m.id || o.m.name) + (o.isPlayer ? '(igr)' : '');
const deg = (o) => { const q = o.q; if (!q) return '?'; let a = Math.atan2(Math.sin(o.h) * q.tx - Math.cos(o.h) * q.tz, Math.cos(o.h) * q.tx + Math.sin(o.h) * q.tz) * 180 / Math.PI; return a.toFixed(0); };
const st = (o) => id(o) + ' s=' + (o.q ? o.q.s.toFixed(1) : '?') + ' d=' + (o.q ? o.q.d.toFixed(1) : '?') + ' smer=' + deg(o) + '° vl=' + o.vl.toFixed(1) + ' v=' + Math.hypot(o.vx, o.vz).toFixed(1) + ' thr=' + (o.inThr || 0).toFixed(2) + ' brk=' + (o.inBrk || 0).toFixed(2) + ' dmg=' + o.dmg.toFixed(2) + (o.wreck && o.wreck.dnf ? ' DNF' : '');
console.log('proga w=' + T.w + ' dolzina=' + (T.len || T.L || '?'));
for (let K = 0; K < RK + AFTER * 120; K++) {
  if (K === RK) { r.retire(c); console.log('odstop k=' + K + ' ' + st(c) + ' stran=' + c.wreck.side); for (const o of r.cars) if (o !== c && o.q && Math.abs(o.q.s - c.q.s) < 60) console.log('     blizu: ' + st(o)); }
  const ev = []; let rb = null;
  globalThis.__ev = K >= RK ? (a, b, rv, s) => { if (a === c || b === c) { const o = a === c ? b : a; ev.push('DOTIK ' + id(o) + ' rel ' + rv.toFixed(1)); } } : null;
  globalThis.__rb = K >= RK ? (cc, o, gap, cl) => { if (cc === c) rb = [o, gap, cl]; } : null;
  L.SIM.stepRace(L.C, r, K);
  if (K >= RK && (ev.length || (K - RK) % EVERY === 0)) {
    console.log('t=' + ((K - RK) / 120).toFixed(2) + ' ' + st(c) + (c.wreck.stop ? ' STOJI' : '') + (rb ? ' | ZAPRT za ' + id(rb[0]) + ' reza ' + rb[1].toFixed(1) + ' m, zapiranje ' + rb[2].toFixed(1) + ' m/s' : '') + (ev.length ? ' | ' + ev.join('; ') : ''));
    const near = new Set(); if (rb) near.add(rb[0]); for (const o of r.cars) if (o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 7) near.add(o);
    for (const o of near) console.log('        ' + st(o) + ' razdalja ' + Math.hypot(o.x - c.x, o.z - c.z).toFixed(1));
  }
}
