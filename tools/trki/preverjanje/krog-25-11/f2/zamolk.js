'use strict';
// fizika-2, po popravku: kdaj pogoj »je že speljal« (_hzGo) dejansko zamolči člen »obtičan« (stuckT > HZ.st pri hitrosti pod HZ.vs)?
// Pričakovano samo med speljevanjem ob štartu; pozneje v dirki nikoli (resnično obtičan avto ostane ovira kot prej).
// Instrumentirana kopija jedra v pomnilniku (drevo nedotaknjeno): klic globalThis.__zm(c, o), kadar bi stara koda člen štela, nova pa ne.
const { SNAP, loadInst } = require('./lib.js');
const A = '(o.stuckT > HZ.st && _hzGo.has(o))', B = '(o.stuckT > HZ.st && (_hzGo.has(o) || (globalThis.__zm && globalThis.__zm(c, o), false)))';
const S = loadInst(SNAP, [[A, B]]); S.C.setTest({ cv: 6 });
const all = S.C.TRACKS.filter(t => !t.test && !t.pending).map(t => t.id), TRACKS = process.env.TRACKS ? process.env.TRACKS.split(',') : all, SECS = +(process.env.SECS || 40), SET = process.env.SET || 'race';
const DT = S.SIM.DT, rows = []; let nT = 0, nZ = 0, tot = 0, totPo = 0, tMax = 0, hzAll = 0;
for (const tid of TRACKS) { let r; try { Math.random = S.SIM.seeded(7); r = S.SIM.makeRace(S.C, tid, (C, tt, t) => S.SIM.SETUPS[SET].opts(C, false, 'cs', t)); } catch (e) { rows.push(tid + ' napaka ' + e.message.slice(0, 60)); continue; }
  if (r.cars.length < 2) continue; nT++;
  let K = 0, n = 0, k0 = -1, k1 = -1, kT = -1, nPo = 0, hz = 0; const cars = new Set(), vmax = new Map(), po = [];
  globalThis.__zm = (c, o) => { n++; if (k0 < 0) k0 = K; k1 = K; cars.add(r.cars.indexOf(o) + ':' + o.m.id); if (kT >= 0) { nPo++; if (po.length < 3) po.push(`k=${K} ${o.m.id}#${r.cars.indexOf(o)} v=${o.speed.toFixed(2)} stuckT=${o.stuckT.toFixed(2)} vmax=${(vmax.get(o) || 0).toFixed(2)} hitCar=${(o.hitCar || 0).toFixed(1)} hitWall=${(o.hitWall || 0).toFixed(1)}`); } };
  const N = Math.round(SECS / DT);
  for (K = 0; K < N; K++) { S.SIM.stepRace(S.C, r, K);
    for (const c of r.cars) { const v = c.speed; if (v > (vmax.get(c) || 0)) vmax.set(c, v); if (c.aiHz) hz++; }
    if (kT < 0 && r.cars.some(c => c.hitCar > 0 || c.hitWall > 0)) kT = K; }
  globalThis.__zm = null; hzAll += hz;
  const slow = r.cars.filter(c => !((vmax.get(c) || 0) >= 3)).length;
  if (n) { nZ++; tot += n; totPo += nPo; if (k1 * DT > tMax) tMax = k1 * DT;
    rows.push(`${tid}: zamolčano ${n} avto-korakov od ${(k0 * DT).toFixed(2)} do ${(k1 * DT).toFixed(2)} s, avti ${[...cars].join(' ')}, prvi dotik ${kT < 0 ? 'nikoli' : (kT * DT).toFixed(2) + ' s'}, po prvem dotiku ${nPo}${po.length ? ' [' + po.join('; ') + ']' : ''}; korakov z oviro v ${SECS} s ${hz}; avtov, ki niso nikoli dosegli 3 m/s: ${slow}`); }
  else if (slow) rows.push(`${tid}: nič zamolčano; avtov, ki niso nikoli dosegli 3 m/s: ${slow}`); }
console.log(`prog ${nT}, ${SECS} s, nabor ${SET}: proge z zamolčanim členom ${nZ}, avto-korakov ${tot}, od tega po prvem dotiku ${totPo}, zadnji pri ${tMax.toFixed(2)} s; korakov z vidno oviro skupaj ${hzAll}`);
console.log(rows.join('\n'));
