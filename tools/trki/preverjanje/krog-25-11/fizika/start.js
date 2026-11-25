'use strict';
// štart dirke v cv 6: ali aiHazard prime počasne speljevalce (stuckT) kot oviro, preden se kdorkoli česa dotakne; odmik od main do prvega dotika
const { SNAP, MAIN, load, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const S = loadInst(SNAP, [
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__ev; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.x, c.z, c.vx, c.vz, c.w]; const r = wallCollide0(c, trk, canFall, rc, dt); if (c.x !== s[0] || c.z !== s[1] || c.vx !== s[2] || c.vz !== s[3] || c.w !== s[4]) g('zid', c); return r;`),
  wrap('carCollide', 'a, b', `const g = globalThis.__ev; if (!g) return carCollide0(a, b); const s = [a.x, a.z, a.vx, a.vz, a.w, b.x, b.z, b.vx, b.vz, b.w]; const r = carCollide0(a, b); if (a.x !== s[0] || a.z !== s[1] || a.vx !== s[2] || a.vz !== s[3] || a.w !== s[4] || b.x !== s[5] || b.z !== s[6] || b.vx !== s[7] || b.vz !== s[8] || b.w !== s[9]) g('avto', a, b); return r;`),
]);
const M = load(MAIN); S.C.setTest({ cv: 6 });
const all = S.C.TRACKS.filter(t => !t.test && !t.pending).map(t => t.id), TRACKS = process.env.TRACKS ? process.env.TRACKS.split(',') : all, SECS = +(process.env.SECS || 6), SET = process.env.SET || 'race';
const mk = (L, tid) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, tid, (C, tt, t) => L.SIM.SETUPS[SET].opts(C, false, 'cs', t)); };
const rows = []; let nT = 0, nHz = 0;
for (const tid of TRACKS) { let ra, rb; try { ra = mk(S, tid); rb = mk(M, tid); } catch (e) { rows.push(tid + ' napaka ' + e.message.slice(0, 60)); continue; }
  if (ra.cars.length < 2) continue; nT++;
  let K = 0, kEv = -1; globalThis.__ev = () => { if (kEv < 0) kEv = K; };
  const n = Math.round(SECS / S.SIM.DT); let hzSteps = 0, hzCars = new Set(), k0 = -1, dev = 0, ex = '', brk = 0, kDiv = -1;
  for (K = 0; K < n; K++) { S.SIM.stepRace(S.C, ra, K); M.SIM.stepRace(M.C, rb, K);
    if (kEv >= 0) break;
    for (let i = 0; i < ra.cars.length; i++) { const c = ra.cars[i], d = rb.cars[i]; if (c.aiHz) { hzSteps++; hzCars.add(i); if (!c.aiHz.far && c.inBrk > 0 && !(d.inBrk > 0)) brk++; if (k0 < 0) { k0 = K; const o = c.aiHz.o; ex = c.m.id + '#' + i + ' za ' + o.m.id + ' v=' + o.speed.toFixed(2) + ' stuckT=' + o.stuckT.toFixed(2) + ' dmg=' + (o.dmg || 0).toFixed(2) + ' far=' + !!c.aiHz.far; } }
      const e = Math.hypot(c.x - d.x, c.z - d.z); if (e > dev) dev = e; if (kDiv < 0 && e > 0) kDiv = K; } }
  globalThis.__ev = null;
  if (hzSteps) { nHz++; rows.push(tid + ': ovira od k=' + k0 + ' (' + (k0 / 120).toFixed(2) + ' s), avto-korakov ' + hzSteps + ', avtov ' + hzCars.size + ', zavira namesto main ' + brk + ', prva razlika k=' + kDiv + ', prvi dotik k=' + kEv + ', najvecji odmik od main do dotika ' + dev.toExponential(2) + ' m; ' + ex); }
  else if (kDiv >= 0) rows.push(tid + ': RAZLIKA brez ovire k=' + kDiv + ' prvi dotik k=' + kEv + ' odmik ' + dev.toExponential(2)); }
console.log('prog', nT, 'z oviro pred prvim dotikom', nHz, 'nabor', SET); console.log(rows.join('\n'));
