'use strict';
// fizika-2, možnost B: ali je avto, ki mu pogoj _hzGo zamolči »obtičan«, v teh korakih na plinu (inThr > 0)? Če vedno, bi pogoj
// »še ni speljal IN je na plinu« ločil počasnega speljevalca od avta, ki sploh ne spelje (igralec brez plina).
const { SNAP, loadInst } = require('./lib.js');
const A = '(o.stuckT > HZ.st && _hzGo.has(o))', B = '(o.stuckT > HZ.st && (_hzGo.has(o) || (globalThis.__zm && globalThis.__zm(c, o), false)))';
const S = loadInst(SNAP, [[A, B]]); S.C.setTest({ cv: 6 });
const TRACKS = process.env.TRACKS ? process.env.TRACKS.split(',') : S.C.TRACKS.filter(t => !t.test && !t.pending).map(t => t.id), SECS = +(process.env.SECS || 4);
const DT = S.SIM.DT; let n = 0, n0 = 0, thrMin = 9, nT = 0; const rows = [];
for (const tid of TRACKS) { let r; try { Math.random = S.SIM.seeded(7); r = S.SIM.makeRace(S.C, tid, (C, tt, t) => S.SIM.SETUPS.race.opts(C, false, 'cs', t)); } catch (e) { continue; }
  if (r.cars.length < 2) continue; nT++; let K = 0, m = 0, m0 = 0, mn = 9;
  globalThis.__zm = (c, o) => { m++; if (!(o.inThr > 0)) m0++; if (o.inThr < mn) mn = o.inThr; };
  for (K = 0; K < Math.round(SECS / DT); K++) S.SIM.stepRace(S.C, r, K);
  globalThis.__zm = null; n += m; n0 += m0; if (mn < thrMin) thrMin = mn; if (m) rows.push(`${tid}: zamolčano ${m}, od tega brez plina ${m0}, najmanjši plin ${mn.toFixed(2)}`); }
console.log(`prog ${nT}, ${SECS} s: zamolčanih avto-korakov ${n}, od tega brez plina ${n0}, najmanjši plin ${thrMin === 9 ? '-' : thrMin.toFixed(2)}`); console.log(rows.join('\n'));
