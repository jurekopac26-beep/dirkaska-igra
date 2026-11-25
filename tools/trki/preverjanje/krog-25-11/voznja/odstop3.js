// odstop3.js: odstop zdravega avta v polju (cv 1), podrobnosti ob prvi razliki: ukazi avta v obeh svetovih in avto pred njim
const { load, SNAP, MAIN } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), E = process.env, CV = +(E.CV || 1), RK = +(E.RETIRE || 240), tid = E.TRACK || 'kotor', SECS = +(E.SECS || 12);
S.C.setTest({ cv: CV });
const mk = (L) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, tt, 'cs', t), { seed: 9 })); };
const ra = mk(S), rb = mk(M), n = Math.round(SECS * 120); let touch = -1; const core = ['x', 'z', 'h', 'vx', 'vz', 'w'];
for (let K = 0; K < n; K++) { if (K === RK) { ra.retire(ra.player); rb.retire(rb.player); }
  S.SIM.stepRace(S.C, ra, K); M.SIM.stepRace(M.C, rb, K);
  for (let i = 0; i < ra.cars.length; i++) { const a = ra.cars[i], b = rb.cars[i];
    if (core.some(q => a[q] !== b[q])) { const P = ra.player, T = ra.track; let best = null;
      for (const o of ra.cars) { if (o === P) continue; const d = Math.hypot(o.x - P.x, o.z - P.z), ahead = (o.x - P.x) * Math.sin(P.h) + (o.z - P.z) * Math.cos(P.h); if (!best || d < best.d) best = { d, o, ahead }; }
      console.log(tid + ' cv ' + CV + ' odstop k=' + RK + ' | prva razlika k=' + K + ' (' + (K / 120).toFixed(2) + ' s) ' + a.m.id + '#' + i + (a === P ? ' (avto, ki odstopa)' : '') + ' | hitrost ' + a.speed.toFixed(2) + ' / ' + b.speed.toFixed(2) + ' m/s | plin ' + a.inThr + ' / ' + b.inThr + ' zavora ' + a.inBrk + ' / ' + b.inBrk + ' | dmg ' + a.dmg + ' | najblizji avto ' + best.o.m.id + ' razdalja ' + best.d.toFixed(2) + ' m hitrost ' + best.o.speed.toFixed(2) + ' m/s dmg ' + best.o.dmg + ' dnf ' + !!(best.o.wreck && best.o.wreck.dnf) + ' stuckT ' + (best.o.stuckT || 0).toFixed(2));
      // koliko se avto, ki odstopa, razlikuje po 3 s in ali se na main dotakne
      process.exit(0); } } }
console.log(tid + ' ENAKO');
