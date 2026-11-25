'use strict';
// cele dirke (cv 6) z merilnimi ovoji okoli carCollide, wallCollide, propCarHit, debrisHit (kopija jedra v pomnilniku; drevo nedotaknjeno)
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const P = [
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.x, c.z, c.dmg, c.hitWall]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit, krOn(c)); return hit;`),
  wrap('carCollide', 'a, b', `const g = globalThis.__C; if (!g) return carCollide0(a, b); const s = [a.vx, a.vz, a.w, b.vx, b.vz, b.w, a.x, a.z, b.x, b.z]; const r = carCollide0(a, b); g(a, b, s, r, krOn(a), krOn(b)); return r;`),
  wrap('propCarHit', 'race, c, b', `const g = globalThis.__P; if (!g) return propCarHit0(race, c, b); const s = [c.vx, c.vz, c.w, b.vx, b.vz, b.dead, b.parts ? 1 : 0]; const r = propCarHit0(race, c, b); g(c, b, s, krOn(c)); return r;`),
  wrap('debrisHit', 'c, d', `const g = globalThis.__D; if (!g) return debrisHit0(c, d); const s = [c.vx, c.vz, c.w, d.vx, d.vz]; const r = debrisHit0(c, d); g(c, d, s, krOn(c)); return r;`),
];
const { C, SIM } = loadInst(process.env.ROOT || SNAP, P);
const CV = process.env.CV != null ? +process.env.CV : 6; C.setTest({ cv: CV });
const TRACKS = (process.env.TRACKS || 'spa,hiva,koli,ujarras,cusco,sacalobra,seoul,bathurst,furka').split(','), SETS = (process.env.SETS || 'crash,formula,car').split(','), SECS = +(process.env.SECS || 75);
const S = { wall: { n: 0, hit: 0, big: 0, dEpos: 0, dEmax: 0, noImp: 0, noImpDmg: 0, noImpMax: 0, ex: null, exE: null }, car: { n: 0, hit: 0, dEpos: 0, dEmax: 0, dErel: 0, dPmax: 0, ex: null, exP: null, off: 0, offE: 0, offEmax: 0 }, prop: { n: 0, kr: 0, dEpos: 0, dEmax: 0, ex: null }, deb: { n: 0, dEpos: 0, dEmax: 0, ex: null }, nan: 0, deep: 0, deepMax: 0, deepRun: 0, steps: 0 };
let CUR = '';
const mf = (c) => c.m.mass + (c.fuelKg || 0), Ek = (m, I, vx, vz, w) => 0.5 * m * (vx * vx + vz * vz) + 0.5 * I * w * w;
globalThis.__W = (c, s, hit, kr) => { if (!kr || !(hit > 0)) return; const W = S.wall; W.n++; W.hit++; if (hit > 2.5) W.big++;
  const dE = Ek(c.m.mass, c.I, c.vx, c.vz, c.w) - Ek(c.m.mass, c.I, s[0], s[1], s[2]);
  if (dE > 1e-4) { W.dEpos++; if (dE > W.dEmax) { W.dEmax = dE; W.exE = { run: CUR, id: c.m.id, hit, dE, v0: s.slice(0, 3), v1: [c.vx, c.vz, c.w] }; } }
  if (hit > 2.5 && c.vx === s[0] && c.vz === s[1] && c.w === s[2]) { W.noImp++; if (c.dmg > s[5]) { W.noImpDmg++; if (hit > W.noImpMax) { W.noImpMax = hit; W.ex = { run: CUR, id: c.m.id, pl: !!c.isPlayer, hit, dmg0: s[5], dmg1: c.dmg, v: s.slice(0, 3), h: c.h }; } } } };
globalThis.__C = (a, b, s, r, ka, kb) => { const K = S.car; K.n++; if (!(r > 0)) return; if (a.net || b.net) return;
  const ma = mf(a), mb = mf(b), Ia = a.I * ma / a.m.mass, Ib = b.I * mb / b.m.mass;
  const dE = Ek(ma, Ia, a.vx, a.vz, a.w) + Ek(mb, Ib, b.vx, b.vz, b.w) - Ek(ma, Ia, s[0], s[1], s[2]) - Ek(mb, Ib, s[3], s[4], s[5]), E0 = Ek(ma, Ia, s[0], s[1], s[2]) + Ek(mb, Ib, s[3], s[4], s[5]);
  if (!ka || !kb) { K.off++; if (dE > 1e-3) { K.offE++; if (dE > K.offEmax) { K.offEmax = dE; K.exOff = { run: CUR, a: a.m.id, b: b.m.id, ka, kb, dE, E0, r }; } } return; }
  K.hit++;
  const dP = Math.hypot(ma * (a.vx - s[0]) + mb * (b.vx - s[3]), ma * (a.vz - s[1]) + mb * (b.vz - s[4]));
  if (dE > 1e-3) { K.dEpos++; if (dE > K.dEmax) { K.dEmax = dE; K.dErel = dE / E0; K.ex = { run: CUR, a: a.m.id, b: b.m.id, dE, E0, r, s, a1: [a.vx, a.vz, a.w], b1: [b.vx, b.vz, b.w] }; } }
  if (dP > K.dPmax) { K.dPmax = dP; K.exP = { run: CUR, a: a.m.id, b: b.m.id, dP, r }; } };
globalThis.__P = (c, b, s, kr) => { const Q = S.prop; if (c.vx === s[0] && c.vz === s[1] && c.w === s[2]) return; Q.n++; if (!kr) return; Q.kr++; const m = mf(c), I = c.I * m / c.m.mass;
  const dE = Ek(m, I, c.vx, c.vz, c.w) - Ek(m, I, s[0], s[1], s[2]); if (dE > 1e-3) { Q.dEpos++; if (dE > Q.dEmax) { Q.dEmax = dE; Q.ex = { run: CUR, id: c.m.id, kind: b.kind, pm: b.K && b.K.m, dE, v0: s.slice(0, 5), v1: [c.vx, c.vz, c.w, b.vx, b.vz] }; } } };
globalThis.__D = (c, d, s, kr) => { const Q = S.deb; if (c.vx === s[0] && c.vz === s[1] && c.w === s[2]) return; Q.n++; if (!kr) return; const m = mf(c), I = c.I * m / c.m.mass;
  const dE = Ek(m, I, c.vx, c.vz, c.w) - Ek(m, I, s[0], s[1], s[2]); if (dE > 1e-3) { Q.dEpos++; if (dE > Q.dEmax) { Q.dEmax = dE; Q.ex = { run: CUR, id: c.m.id, dm: d.m, dE, v0: s, v1: [c.vx, c.vz, c.w, d.vx, d.vz] }; } } };
// globina prekrivanja dveh pravokotnikov (SAT), m
function obb(a, b) { let best = 1e9; const ax = [[Math.cos(a.h), Math.sin(a.h)], [-Math.sin(a.h), Math.cos(a.h)], [Math.cos(b.h), Math.sin(b.h)], [-Math.sin(b.h), Math.cos(b.h)]], dx = b.x - a.x, dz = b.z - a.z;
  const ha = [a.m.len / 2, a.m.wid / 2], hb = [b.m.len / 2, b.m.wid / 2];
  for (const u of ax) { const ra = ha[0] * Math.abs(u[0] * ax[0][0] + u[1] * ax[0][1]) + ha[1] * Math.abs(u[0] * ax[1][0] + u[1] * ax[1][1]), rb = hb[0] * Math.abs(u[0] * ax[2][0] + u[1] * ax[2][1]) + hb[1] * Math.abs(u[0] * ax[3][0] + u[1] * ax[3][1]);
    const o = ra + rb - Math.abs(dx * u[0] + dz * u[1]); if (o <= 0) return 0; if (o < best) best = o; }
  return best; }
const t00 = Date.now(), rows = [];
for (const tid of TRACKS) for (const set of SETS) {
  CUR = tid + '/' + set; const SU = SIM.SETUPS[set];
  Math.random = SIM.seeded(7);
  const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); const n = Math.round(SECS / SIM.DT); const run = new Map(); let resc = 0, nan0 = S.nan, deepRun = 0;
  for (let k = 0; k < n; k++) { if (SIM.stepRace(C, race, k, SU.drive)) resc++; S.steps++;
    const cars = race.cars;
    for (const c of cars) if (![c.x, c.z, c.h, c.vx, c.vz, c.w, c.y || 0, c.dmg || 0].every(Number.isFinite)) { S.nan++; if (S.nan < 3) console.log('NAN', CUR, k, c.m.id); }
    if (k % 4 === 0) for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) { const a = cars[i], b = cars[j]; if (a.fall || b.fall || a.pitG || b.pitG || a.inPit || b.inPit || Math.abs((a.y || 0) - (b.y || 0)) > 1.5) continue; const dx = a.x - b.x, dz = a.z - b.z; if (dx * dx + dz * dz > 64) continue;
      const o = obb(a, b), key = i * 100 + j; if (o > 0.3) { S.deep++; if (o > S.deepMax) { S.deepMax = o; S.deepEx = { run: CUR, k, a: a.m.id, b: b.m.id, o }; } const r = (run.get(key) || 0) + 1; run.set(key, r); if (r > deepRun) deepRun = r; } else run.delete(key); } }
  if (deepRun > S.deepRun) { S.deepRun = deepRun; S.deepRunAt = CUR; }
  rows.push(CUR + ' resc ' + resc + ' out ' + race.cars.filter(c => c.retired || c.wrecked || c.out).length + ' dmgP ' + (race.player ? (race.player.dmg || 0).toFixed(2) : '-'));
}
const sh = (o) => JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toPrecision(5) : v);
console.log('cv', CV, 'tek s', ((Date.now() - t00) / 1000).toFixed(0), 'korakov', S.steps); console.log(rows.join(' | '));
console.log('ZID', sh(S.wall)); console.log('AVTO', sh(S.car)); console.log('PREDMET', sh(S.prop)); console.log('KOS', sh(S.deb));
console.log('NaN', S.nan, 'globoko prekrivanje > 0.3 m (vzorci)', S.deep, 'najvec m', S.deepMax.toFixed(3), sh(S.deepEx || null), 'najdaljse trajanje (vzorci po 1/30 s)', S.deepRun, S.deepRunAt || '');
