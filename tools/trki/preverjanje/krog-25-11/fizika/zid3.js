'use strict';
// ponovitev ene epizode »skoda brez sunka« po korakih: TID/SET, koraki K0-6 .. K0+N
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(SNAP, [wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.x, c.z, c.dmg, c.h]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit, krOn(c)); return hit;`)]);
C.setTest({ cv: 6 });
const tid = process.env.TID || 'mombasa', set = process.env.SET || 'formula', K0 = +(process.env.K0 || 1331), NN = +(process.env.NN || 16), SU = SIM.SETUPS[set];
Math.random = SIM.seeded(7); const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); let K = 0; const r3 = (x) => +x.toFixed(3);
let who = null, sum = 0, cnt = 0;
globalThis.__W = (c, s, hit, kr) => { if (K < K0 - 6 || K > K0 + NN) return; if (!(hit > 0) && c !== who) return; if (!who && K >= K0 && hit > 2.5 && kr) who = c; if (who && c !== who) return;
  const same = c.vx === s[0] && c.vz === s[1] && c.w === s[2], dd = c.dmg - s[5]; if (same && dd > 0) { sum += dd; cnt++; }
  console.log(`k ${K} ${c.m.id}${c.isPlayer ? ' (igralec)' : ''} hit ${r3(hit)} skoda ${r3(s[5])} -> ${r3(c.dmg)} v [${r3(s[0])}, ${r3(s[1])}] -> [${r3(c.vx)}, ${r3(c.vz)}] w ${r3(s[2])} -> ${r3(c.w)} premik ${r3(Math.hypot(c.x - s[3], c.z - s[4]))} m${same ? '  BREZ SUNKA' : ''}${c.dnf ? ' dnf' : ''}`); };
const n = K0 + NN + 2; for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
console.log(JSON.stringify({ epizoda: tid + '/' + set, korakovBrezSunkaSSkodo: cnt, skodaBrezSunka: r3(sum), enUdarecBiBil: 'glej prvi hit: (hit - 2.5) * 0.028', skodaNaKoncu: who ? r3(who.dmg) : null, odstopil: who ? !!(who.dnf || who.wreck || who.out) : null }));
