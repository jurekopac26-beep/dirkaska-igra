'use strict';
// vzorčno: pari avtov s prekrivanjem > prag in njihove zastavice (zakaj jih carCollide ne razmakne)
const { SNAP, load } = require('./lib.js'); const { C, SIM } = load(process.env.ROOT || SNAP);
C.setTest({ cv: process.env.CV != null ? +process.env.CV : 6 });
const TRACKS = (process.env.TRACKS || 'cusco').split(','), SETS = (process.env.SETS || 'formula').split(','), SECS = +(process.env.SECS || 75), LIM = +(process.env.LIM || 0.3);
function obb(a, b) { let best = 1e9; const ax = [[Math.cos(a.h), Math.sin(a.h)], [-Math.sin(a.h), Math.cos(a.h)], [Math.cos(b.h), Math.sin(b.h)], [-Math.sin(b.h), Math.cos(b.h)]], dx = b.x - a.x, dz = b.z - a.z;
  const ha = [a.m.len / 2, a.m.wid / 2], hb = [b.m.len / 2, b.m.wid / 2];
  for (const u of ax) { const ra = ha[0] * Math.abs(u[0] * ax[0][0] + u[1] * ax[0][1]) + ha[1] * Math.abs(u[0] * ax[1][0] + u[1] * ax[1][1]), rb = hb[0] * Math.abs(u[0] * ax[2][0] + u[1] * ax[2][1]) + hb[1] * Math.abs(u[0] * ax[3][0] + u[1] * ax[3][1]);
    const o = ra + rb - Math.abs(dx * u[0] + dz * u[1]); if (o <= 0) return 0; if (o < best) best = o; }
  return best; }
const keys = ['finished', 'retired', 'wrecked', 'fall', 'pitG', 'inPit', 'air', 'net', 'out', 'ghost', 'dnf', 'park', 'parked', 'stop', 'rl', 'xr', 'tl', 'ck', 'gone', 'fin', 'done'];
const fl = (c) => keys.filter(k => c[k]).map(k => k + (typeof c[k] === 'number' ? '=' + (+c[k]).toFixed(2) : '')).join(',');
const cls = {};
for (const tid of TRACKS) for (const set of SETS) { const SU = SIM.SETUPS[set]; Math.random = SIM.seeded(7);
  const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); const n = Math.round(SECS / SIM.DT); let shown = 0;
  console.log(tid, set, 'open', !!race.track.open, 'cross', race.track.cross.length, 'cars', race.cars.length, 'tt', !!race.timeTrial);
  for (let k = 0; k < n; k++) { SIM.stepRace(C, race, k, SU.drive); const cars = race.cars;
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) { const a = cars[i], b = cars[j]; const dx = a.x - b.x, dz = a.z - b.z; if (dx * dx + dz * dz > 64) continue; const o = obb(a, b); if (o <= LIM) continue;
      const key = [fl(a), fl(b)].sort().join(' | ') + ' dy<3:' + (Math.abs((a.y || 0) - (b.y || 0)) < 3); cls[key] = (cls[key] || 0) + 1;
      if (shown < 2 && !(a.finished && b.finished) && !a.fall && !b.fall && !a.pitG && !b.pitG) { shown++; console.log('  k', k, a.m.id, b.m.id, 'o', o.toFixed(2), 'A', fl(a), 'ya', (a.y || 0).toFixed(2), 'B', fl(b), 'yb', (b.y || 0).toFixed(2), 'own keys', Object.keys(a).filter(q => /^(fin|ret|wr|gh|pk|park|out|dn)/.test(q)).join(',')); } } } }
console.log(JSON.stringify(cls, null, 0).slice(0, 1500));
