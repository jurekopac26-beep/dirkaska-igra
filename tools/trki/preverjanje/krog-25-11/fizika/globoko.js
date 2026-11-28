'use strict';
// globoko prekrivanje dveh avtov v celi dirki: meri v ovoju carCollide (par je torej v igri), po klicu
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(process.env.ROOT || SNAP, [wrap('carCollide', 'a, b', `const g = globalThis.__C; if (!g) return carCollide0(a, b); const s = [a.x, a.z, b.x, b.z, a.vx, a.vz, a.w, b.vx, b.vz, b.w]; const r = carCollide0(a, b); g(a, b, s, r, krOn(a), krOn(b)); return r;`)]);
const CV = process.env.CV != null ? +process.env.CV : 6; C.setTest({ cv: CV });
const TRACKS = (process.env.TRACKS || 'cusco').split(','), SETS = (process.env.SETS || 'formula').split(','), SECS = +(process.env.SECS || 75), LIM = +(process.env.LIM || 0.3), SHOW = +(process.env.SHOW || 3);
function obb(a, b) { let best = 1e9; const ax = [[Math.cos(a.h), Math.sin(a.h)], [-Math.sin(a.h), Math.cos(a.h)], [Math.cos(b.h), Math.sin(b.h)], [-Math.sin(b.h), Math.cos(b.h)]], dx = b.x - a.x, dz = b.z - a.z;
  const ha = [a.m.len / 2, a.m.wid / 2], hb = [b.m.len / 2, b.m.wid / 2];
  for (const u of ax) { const ra = ha[0] * Math.abs(u[0] * ax[0][0] + u[1] * ax[0][1]) + ha[1] * Math.abs(u[0] * ax[1][0] + u[1] * ax[1][1]), rb = hb[0] * Math.abs(u[0] * ax[2][0] + u[1] * ax[2][1]) + hb[1] * Math.abs(u[0] * ax[3][0] + u[1] * ax[3][1]);
    const o = ra + rb - Math.abs(dx * u[0] + dz * u[1]); if (o <= 0) return 0; if (o < best) best = o; }
  return best; }
let K = 0, CUR = '', race = null; const ep = new Map(), done = []; let nDeep = 0, maxO = 0;
const fl = (c) => (c.isPlayer ? 'P' : '') + (c.retired ? 'R' : '') + (c.wrecked ? 'W' : '') + (c.finished ? 'F' : '') + (c.air ? 'A' : '') + (c.rl ? 'L' : '') + (c.net ? 'N' : '') + (c.inPit ? 'p' : '') + (c.tl ? 't' : '') + (c.xr ? 'x' : '') + (c.out ? 'o' : '');
globalThis.__C = (a, b, s, r, ka, kb) => { const dx = a.x - b.x, dz = a.z - b.z; if (dx * dx + dz * dz > 64) return; const o = obb(a, b), key = race.cars.indexOf(a) * 100 + race.cars.indexOf(b);
  if (o > LIM) { nDeep++; if (o > maxO) maxO = o; let e = ep.get(key); if (!e) { e = { run: CUR, k0: K, n: 0, max: 0, a: a.m.id, b: b.m.id, rs: 0, r0: 0 }; ep.set(key, e); e.at0 = { fa: fl(a), fb: fl(b), ya: +(a.y || 0).toFixed(2), yb: +(b.y || 0).toFixed(2), va: +Math.hypot(a.vx, a.vz).toFixed(1), vb: +Math.hypot(b.vx, b.vz).toFixed(1), wa: +a.w.toFixed(2), wb: +b.w.toFixed(2), o: +o.toFixed(2), r: +(+r).toFixed(2), ka, kb, moved: +Math.hypot(a.x - s[0], a.z - s[1], b.x - s[2], b.z - s[3]).toFixed(3) }; }
    e.n++; e.kl = K; if (o > e.max) { e.max = o; e.kmax = K; } if (r > 0) e.rs++; else e.r0++; }
  else if (ep.has(key)) { done.push(ep.get(key)); ep.delete(key); } };
for (const tid of TRACKS) for (const set of SETS) { CUR = tid + '/' + set; const SU = SIM.SETUPS[set]; Math.random = SIM.seeded(7);
  race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); const n = Math.round(SECS / SIM.DT);
  for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  for (const e of ep.values()) done.push(e); ep.clear(); }
done.sort((x, y) => y.n - x.n);
console.log('cv', CV, 'prag m', LIM, 'korakov s prekrivanjem nad pragom po klicu carCollide', nDeep, 'najvec m', maxO.toFixed(3), 'epizod', done.length, 'najdaljsa korakov', done.length ? done[0].n : 0, 'epizod nad 0.5 s', done.filter(e => e.n > 60).length);
for (const e of done.slice(0, SHOW)) console.log(JSON.stringify(e, (k, v) => typeof v === 'number' ? +v.toPrecision(4) : v));
