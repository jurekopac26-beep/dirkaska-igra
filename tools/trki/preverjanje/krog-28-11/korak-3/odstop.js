'use strict';
// korak 3 (F3, voznja-5), krog 28. 11.: zdrav tekmec sredi polja odstopi (Race.retire) in zapelje k robu; primerjava različic retireBlocked.
// Primeri: proge TRACKS x trenutek odstopa RKS (korak 1/120 s) x avto CARS (mesto v polju) x različica trkov CVS = 7 x 3 x 2 x 2 = 84; po odstopu AFTER s.
// Za vsak primer in različico: koraki dotika izločenega (največja relativna hitrost), koraki dotika drugih, škoda izločenega in drugih, čas do
// ustavitve (wreck.stop), pot, razdalja od roba asfalta ob ustavitvi, koraki z zavoro 0,8 (retireBlocked). Izpiše samo primere, kjer se različice razlikujejo.
// Različice (kandidati.js): veja = drevo, kot je; brez = retireBlocked izklopljen; ctr, gap, pas = kandidati popravka (ctr je uveljavljen).
// Jedro je instrumentirano v pomnilniku, drevo ostane nedotaknjeno.
// Zagon: node odstop.js > odstop-po.log   (VARS=veja,brez);   TRKI_SNAP=<drevo 26d2b1d> VARS=veja,brez,ctr,gap,pas node odstop.js > odstop-pred.log
const { SNAP, loadInst } = require('../../krog-25-11/fizika/lib.js');
const { VARS, wrapCC } = require('./kandidati.js');
const E = process.env, NAMES = (E.VARS || 'veja,brez').split(','), CVS = (E.CVS || '1,6').split(',').map(Number), TRACKS = (E.TRACKS || 'kotor,koli,bathurst,spa,kagerod,toskana,jezero').split(','), RKS = (E.RKS || '240,600,1500').split(',').map(Number), CARS = (E.CARS || '3,7').split(',').map(Number), AFTER = +(E.AFTER || 20), SEED = +(E.SEED || 9);
const LS = NAMES.map(n => loadInst(SNAP, [wrapCC, ...VARS[n]]));
const mk = (L, tid) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, tt, 'cs', t), { seed: SEED })); };
const tot = {};
for (const cv of CVS) { LS.forEach(L => L.C.setTest({ cv }));
  for (const tid of TRACKS) for (const RK of RKS) for (const ci of CARS) {
    const res = [];
    for (const L of LS) {
      const r = mk(L, tid); if (r.cars.length < 8) { res.push(null); continue; }
      const c = r.cars[ci]; let own = 0, ownV = 0, oth = 0, stopT = -1, d0 = 0, dmg0 = 0, blk = 0, path = 0, px = 0, pz = 0, dEnd = 0;
      for (let K = 0; K < RK + AFTER * 120; K++) {
        if (K === RK) { r.retire(c); dmg0 = r.cars.reduce((s, o) => s + (o === c ? 0 : o.dmg), 0); d0 = c.dmg; px = c.x; pz = c.z; }
        globalThis.__ev = K >= RK ? (a, b, rv) => { if (a === c || b === c) { own++; if (rv > ownV) ownV = rv; } else oth++; } : null;
        L.SIM.stepRace(L.C, r, K);
        if (K >= RK) { const j = Math.hypot(c.x - px, c.z - pz); if (j < 1.5) path += j; px = c.x; pz = c.z; if (stopT < 0 && c.wreck.stop) { stopT = (K - RK) / 120; dEnd = Math.abs(c.q.d) - r.track.w; } if (c.inBrk >= 0.79 && c.speed > 1) blk++; }
      }
      globalThis.__ev = null;
      res.push({ own, ownV, oth, stopT, path, dOwn: c.dmg - d0, dOth: r.cars.reduce((s, o) => s + (o === c ? 0 : o.dmg), 0) - dmg0, blk, dEnd });
    }
    if (res.some(x => !x)) continue;
    const f = (x) => 'dotiki izl. ' + x.own + ' (najv. ' + x.ownV.toFixed(1) + ' m/s) drugi ' + x.oth + ' | skoda izl. ' + x.dOwn.toFixed(3) + ' drugi ' + x.dOth.toFixed(3) + ' | ustavi ' + (x.stopT < 0 ? '>' + AFTER : x.stopT.toFixed(1)) + ' s pot ' + x.path.toFixed(0) + ' m, ' + x.dEnd.toFixed(1) + ' m od roba | zavora 0,8: ' + x.blk;
    const js = res.map(x => JSON.stringify(x)), same = js.every(s => s === js[0]);
    if (!same) { console.log('cv ' + cv + ' ' + tid + ' k=' + RK + ' avto ' + ci); res.forEach((x, i) => console.log('   ' + NAMES[i].padEnd(5) + (i && js[i] === js[0] ? '= ' + NAMES[0] : f(x)))); }
    const T = tot[cv] || (tot[cv] = { n: 0, same: 0, v: NAMES.map(() => ({ own: 0, oth: 0, dOwn: 0, dOth: 0, stop: 0, nostop: 0, path: 0, hit: 0, eq: 0, dMax: 0 })) });
    T.n++; if (same) T.same++;
    res.forEach((x, i) => { const t = T.v[i]; t.own += x.own; t.oth += x.oth; t.dOwn += x.dOwn; t.dOth += x.dOth; if (x.stopT < 0) t.nostop++; else t.stop += x.stopT; t.path += x.path; if (x.own) t.hit++; if (js[i] === js[0]) t.eq++; if (x.dOwn > t.dMax) t.dMax = x.dOwn; });
  } }
for (const cv of Object.keys(tot)) { const T = tot[cv];
  console.log('SKUPAJ cv ' + cv + ': primerov ' + T.n + ', vsi enaki ' + T.same);
  T.v.forEach((t, i) => console.log('   ' + NAMES[i].padEnd(5) + 'enakih veji ' + t.eq + ', primerov z dotikom izl. ' + t.hit + ', korakov dotika izl. ' + t.own + ', drugih ' + t.oth + ', skoda izl. ' + t.dOwn.toFixed(2) + ' (najv. ' + t.dMax.toFixed(3) + '), skoda drugih ' + t.dOth.toFixed(2) + ', ustavljen: ' + (T.n - t.nostop) + ' (povp. ' + (t.stop / Math.max(1, T.n - t.nostop)).toFixed(1) + ' s), pot povp. ' + (t.path / T.n).toFixed(0) + ' m')); }
