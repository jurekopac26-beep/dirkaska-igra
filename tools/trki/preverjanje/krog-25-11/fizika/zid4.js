'use strict';
// cele dirke: skoda ob ograji po epizodah zaporednih korakov (isti avto, presledek <= 2 koraka); primerjava cv 6 in cv 1 (CV), isti nabor dirk
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(process.env.ROOT || SNAP, [wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.dmg]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit); return hit;`)]);
const CV = process.env.CV != null ? +process.env.CV : 6; C.setTest({ cv: CV });
const TRACKS = (process.env.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (process.env.SETS || 'crash,formula').split(','), SECS = +(process.env.SECS || 60);
const A = { races: 0, steps: 0, dmg: 0, noImp: 0, noImpDmg: 0, eps: [] };
for (const tid of TRACKS) for (const set of SETS) {
  const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(7);
  try { race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); } catch (e) { continue; }
  A.races++; let K = 0; const last = new Map();
  globalThis.__W = (c, s, hit) => { const dd = c.dmg - s[3]; if (!(dd > 0) || !(hit > 2.5)) return; A.steps++; A.dmg += dd;
    if (c.vx === s[0] && c.vz === s[1] && c.w === s[2]) { A.noImp++; A.noImpDmg += dd; }
    let L = last.get(c); if (L && K - L.k <= 2) { L.k = K; L.n++; L.dmg += dd; if (dd > L.max) L.max = dd; if (hit > L.hit) L.hit = hit; } else { L = { k: K, k0: K, n: 1, dmg: dd, max: dd, hit, run: tid + '/' + set, id: c.m.id, pl: !!c.isPlayer }; last.set(c, L); A.eps.push(L); } };
  const n = Math.round(SECS / SIM.DT); for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  globalThis.__W = null; }
const E = A.eps, r3 = (x) => +x.toFixed(3), sum = (f) => E.reduce((a, e) => a + f(e), 0), big = E.slice().sort((a, b) => b.dmg / b.max - a.dmg / a.max)[0], top = E.slice().sort((a, b) => b.dmg - a.dmg)[0];
const hist = {}; for (const e of E) { const k = e.n >= 5 ? '5+' : String(e.n); hist[k] = (hist[k] || 0) + 1; }
console.log(JSON.stringify({ cv: CV, dirk: A.races, korakovSSkodo: A.steps, skodaOgraja: r3(A.dmg), epizod: E.length, korakovNaEpizodo: r3(A.steps / E.length), porazdelitevKorakov: hist, skodaNaEpizodo: r3(A.dmg / E.length), razmerjeEpizodaProtiNajvecjemuKoraku: r3(sum(e => e.dmg) / sum(e => e.max)), delezSkodeNadNajvecjimKorakom: r3(1 - sum(e => e.max) / sum(e => e.dmg)), brezSunkaKorakov: A.noImp, brezSunkaDelezSkode: r3(A.noImpDmg / A.dmg) }));
if (big) console.log('najvecje razmerje', JSON.stringify({ run: big.run, id: big.id, igralec: big.pl, k0: big.k0, korakov: big.n, skoda: r3(big.dmg), najvecjiKorak: r3(big.max), hitMax: r3(big.hit) }));
if (top) console.log('najvec skode', JSON.stringify({ run: top.run, id: top.id, igralec: top.pl, k0: top.k0, korakov: top.n, skoda: r3(top.dmg), najvecjiKorak: r3(top.max), hitMax: r3(top.hit) }));
