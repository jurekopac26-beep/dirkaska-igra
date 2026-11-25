'use strict';
// prva razlika veja (cv) proti main: vsa številska polja vseh avtov, korak za korakom
const { SNAP, MAIN, load } = require('./lib.js');
const S = load(SNAP), M = load(MAIN);
const CV = process.env.CV != null ? +process.env.CV : 6, TID = process.env.TID || 'kotor', NAI = +(process.env.NAI || 12), KMAX = +(process.env.KMAX || 400), TXO = process.env.TX ? JSON.parse(process.env.TX) : {};
S.C.setTest(Object.assign({ cv: CV }, TXO));
const mk = (L) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, TID, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, false, 'cs', t), { numAI: NAI, playerGrid: NAI + 1 })); };
const ra = mk(S), rb = mk(M);
const flat = (c) => { const o = {}; for (const k of Object.keys(c)) { const v = c[k]; if (typeof v === 'number' || typeof v === 'boolean') o[k] = v; else if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'm' && k !== 'race' && k !== 'trk') { let n = 0; for (const k2 of Object.keys(v)) { const w = v[k2]; if (typeof w === 'number' || typeof w === 'boolean') { o[k + '.' + k2] = w; if (++n > 40) break; } } } } return o; };
let found = 0;
for (let K = 0; K < KMAX && found < 2; K++) { S.SIM.stepRace(S.C, ra, K); M.SIM.stepRace(M.C, rb, K);
  const diffs = [];
  for (let i = 0; i < ra.cars.length; i++) { const x = flat(ra.cars[i]), y = flat(rb.cars[i]); for (const k of Object.keys(y)) if (k in x && x[k] !== y[k] && !(Number.isNaN(x[k]) && Number.isNaN(y[k]))) diffs.push(ra.cars[i].m.id + '#' + i + '.' + k + ' ' + x[k] + ' / ' + y[k]); }
  if (diffs.length) { found++; console.log('k', K, (K / 120).toFixed(3), 's razlik', diffs.length); console.log(diffs.slice(0, 14).join('\n').slice(0, 1800));
    if (found === 1) { const i = +diffs[0].split('#')[1].split('.')[0], c = ra.cars[i]; console.log('avto', i, c.m.id, 'x z', c.x.toFixed(2), c.z.toFixed(2), 'v', Math.hypot(c.vx, c.vz).toFixed(2), 'hitWall', c.hitWall, 'hitCar', c.hitCar, 'hitProp', c.hitProp, 'hitDebris', c.hitDebris, 'q.d', c.q && c.q.d, 'tf', !!ra.tf, 'props', (ra.props || []).length, 'debris', (ra.debris || []).length);
      for (let j = 0; j < ra.cars.length; j++) { const b = ra.cars[j]; if (j !== i && Math.hypot(b.x - c.x, b.z - c.z) < 8) console.log('  blizu', j, b.m.id, 'razdalja', Math.hypot(b.x - c.x, b.z - c.z).toFixed(2), 'v', Math.hypot(b.vx, b.vz).toFixed(2)); } } } }
if (!found) console.log('brez razlik do k', KMAX);
