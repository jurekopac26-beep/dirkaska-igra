'use strict';
// pravilo: avto, ki se ničesar ne dotakne, vozi do števke enako kot na main. Veja (cv po izbiri) proti main, korak za korakom.
const { SNAP, MAIN, load, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const st = (c) => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.y || 0, c.dmg || 0];
const S = loadInst(SNAP, [
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__ev; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.x, c.z, c.vx, c.vz, c.w]; const r = wallCollide0(c, trk, canFall, rc, dt); if (c.x !== s[0] || c.z !== s[1] || c.vx !== s[2] || c.vz !== s[3] || c.w !== s[4]) g('zid', c); return r;`),
  wrap('carCollide', 'a, b', `const g = globalThis.__ev; if (!g) return carCollide0(a, b); const s = [a.x, a.z, a.vx, a.vz, a.w, b.x, b.z, b.vx, b.vz, b.w]; const r = carCollide0(a, b); if (a.x !== s[0] || a.z !== s[1] || a.vx !== s[2] || a.vz !== s[3] || a.w !== s[4] || b.x !== s[5] || b.z !== s[6] || b.vx !== s[7] || b.vz !== s[8] || b.w !== s[9]) g('avto', a, b); return r;`),
]);
const M = load(MAIN);
const CV = process.env.CV != null ? +process.env.CV : 6, SECS = +(process.env.SECS || 60), PHYS = process.env.PHYS || 'cs';
const TRACKS = (process.env.TRACKS || 'spa,hiva,koli,cusco,seoul,bathurst,furka,montreal,killar,pikes,kotor,sakhir').split(','), MODS = (process.env.MODS || '').split(',').filter(Boolean), NAI = process.env.NAI != null ? +process.env.NAI : 0;
S.C.setTest({ cv: CV });
const mk = (L, tid, mid) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, NAI === 0, PHYS, t), NAI > 0 ? { numAI: NAI, playerGrid: NAI + 1 } : {}, mid ? { playerModel: C.MODELS.find(m => m.id === mid) } : {})); };
const out = [];
for (const tid of TRACKS) for (const mid of (MODS.length ? MODS : [''])) {
  const ra = mk(S, tid, mid), rb = mk(M, tid, mid), n = Math.round(SECS / S.SIM.DT); let kEv = -1, ev = '', kDiv = -1, dv = '', K = 0, nEv = 0;
  globalThis.__ev = (what, a, b) => { nEv++; if (kEv < 0) { kEv = K; ev = what + ':' + a.m.id + (b ? '/' + b.m.id : ''); } };
  if (ra.cars.length !== rb.cars.length) { out.push(tid + ' razlicno stevilo avtov'); continue; }
  for (K = 0; K < n; K++) { S.SIM.stepRace(S.C, ra, K); M.SIM.stepRace(M.C, rb, K);
    if (kDiv < 0) for (let i = 0; i < ra.cars.length; i++) { const x = st(ra.cars[i]), y = st(rb.cars[i]); for (let q = 0; q < x.length; q++) if (x[q] !== y[q] && !(Number.isNaN(x[q]) && Number.isNaN(y[q]))) { kDiv = K; dv = ra.cars[i].m.id + '#' + i + ' polje ' + q + ' ' + x[q] + ' / ' + y[q]; break; } if (kDiv >= 0) break; }
    if (kDiv >= 0) break; }
  globalThis.__ev = null;
  out.push(tid + (mid ? '/' + mid : '') + ' avtov ' + ra.cars.length + (kDiv < 0 ? ' ENAKO ' + SECS + ' s' : ' RAZLIKA k=' + kDiv + ' (' + (kDiv * S.SIM.DT).toFixed(2) + ' s) ' + dv) + ' | prvi dotik veje k=' + kEv + ' ' + ev + (kDiv >= 0 && (kEv < 0 || kDiv < kEv) ? '  <<< RAZLIKA PRED DOTIKOM' : ''));
}
console.log('cv', CV, 'phys', PHYS, 'NAI', NAI); console.log(out.join('\n'));
