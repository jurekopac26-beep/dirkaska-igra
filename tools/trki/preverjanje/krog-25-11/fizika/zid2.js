'use strict';
// cele dirke (cv 6): udarec v ograjo, ki zaracuna skodo (hit > 2,5 m/s), a hitrosti in zasuka ne spremeni (wallR se vrne brez sunka); epizode zaporednih korakov
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(SNAP, [wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.x, c.z, c.dmg, c.h]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit, krOn(c)); return hit;`)]);
C.setTest({ cv: process.env.CV != null ? +process.env.CV : 6 });
const all = C.TRACKS.filter(t => !t.test && !t.pending).map(t => t.id), TRACKS = process.env.TRACKS ? process.env.TRACKS.split(',') : all, SETS = (process.env.SETS || 'crash,formula').split(','), SECS = +(process.env.SECS || 60);
const A = { races: 0, big: 0, ev: 0, ep: 0, epMaxSteps: 0, dmgEvMax: 0, dmgEpMax: 0, dmgSum: 0, hitMax: 0, pl: 0, ex: null, exEp: null, tracks: {} };
for (const tid of TRACKS) for (const set of SETS) {
  const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(7);
  try { race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); } catch (e) { continue; }
  A.races++; let K = 0; const last = new Map();   // avto -> { k, n, dmg }
  globalThis.__W = (c, s, hit, kr) => { if (!kr || !(hit > 2.5)) return; A.big++;
    if (c.vx !== s[0] || c.vz !== s[1] || c.w !== s[2]) return; const dd = c.dmg - s[5]; if (!(dd > 0)) return;
    A.ev++; A.dmgSum += dd; if (c.isPlayer) A.pl++; A.tracks[tid] = (A.tracks[tid] || 0) + 1; if (hit > A.hitMax) A.hitMax = hit;
    const r3 = (x) => +x.toFixed(3);
    if (dd > A.dmgEvMax) { A.dmgEvMax = dd; A.ex = { run: tid + '/' + set, k: K, id: c.m.id, pl: !!c.isPlayer, hit: r3(hit), dmg0: r3(s[5]), dmg1: r3(c.dmg), v: [r3(s[0]), r3(s[1])], w: r3(s[2]), h: r3(s[6]), premik: r3(Math.hypot(c.x - s[3], c.z - s[4])) }; }
    const L = last.get(c); if (L && K - L.k <= 2) { L.k = K; L.n++; L.dmg += dd; } else { A.ep++; last.set(c, { k: K, n: 1, dmg: dd, run: tid + '/' + set, id: c.m.id, k0: K }); }
    const L2 = last.get(c); if (L2.n > A.epMaxSteps) A.epMaxSteps = L2.n; if (L2.dmg > A.dmgEpMax) { A.dmgEpMax = L2.dmg; A.exEp = { run: L2.run, id: L2.id, k0: L2.k0, korakov: L2.n, skoda: r3(L2.dmg) }; } };
  const n = Math.round(SECS / SIM.DT); for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  globalThis.__W = null; }
const r4 = (x) => +x.toFixed(4);
console.log(JSON.stringify({ dirk: A.races, udarcevNad2_5: A.big, brezSunkaSSkodo: A.ev, epizod: A.ep, najdaljsaEpizodaKorakov: A.epMaxSteps, skodaDogodekMax: r4(A.dmgEvMax), skodaEpizodaMax: r4(A.dmgEpMax), skodaSkupaj: r4(A.dmgSum), hitMax: r4(A.hitMax), igralec: A.pl }));
console.log('primer', JSON.stringify(A.ex)); console.log('epizoda', JSON.stringify(A.exEp)); console.log('proge', JSON.stringify(A.tracks));
