'use strict';
// Kako pogosto wallR (kot je, cv 6) da sunek drugje, kot bi ga dala dejanska crta ograje? Stetje v celih dirkah, nic se ne spremeni (hook vrne null).
// Za vsak klic wallR z vogalom k ob robni ograji: utezi vogalov po normali vogala k (kot je) in po dejanskem prostoru vsakega vogala (Track.query).
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(SNAP, [
  ['for (let j = 0; j < P.length; j++) { const d = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }',
    'if (globalThis.__B) globalThis.__B(c, k, wx, wz, nx, nz); for (let j = 0; j < P.length; j++) { const d = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }'],
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `globalThis.__TRK = trk; return wallCollide0(c, trk, canFall, rc, dt);`)]);
C.setTest({ cv: 6 });
const E = process.env, SEED = +(E.SEED || 7), W = { face: 0.06, cr0: 0.03, cr1: 0.5 };   // (KV.real.wall, js/core.js:2565)
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(','), SECS = +(E.SECS || 60);
const r3 = (x) => +x.toFixed(3), clamp = (x, a, b) => Math.max(a, Math.min(b, x)); let cur = null;
const tot = { klicev: 0, robnaOgraja: 0, tockaDrugje05: 0, tockaDrugje1: 0, vVogaluKiSeNeDotika: 0, zasukNasprotnegaPredznaka: 0, najOdmik: 0 }, per = {};
globalThis.__B = (c, k, wx, wz, nx, nz) => { const T = globalThis.__TRK; tot.klicev++; if (!T || T.free || T.unf || !c.q) return;
  const ch = Math.cos(c.h), sh = Math.sin(c.h), P = c.corners, q = {}, X = [], Z = [], cl = [];
  for (let j = 0; j < P.length; j++) { X[j] = P[j][0] * ch - P[j][1] * sh; Z[j] = P[j][0] * sh + P[j][1] * ch; if (T.def.barrier) T.queryRoute(c.x + X[j], c.z + Z[j], c.q.i, q); else T.query(c.x + X[j], c.z + Z[j], c.q.i, q); cl[j] = Math.min(q.br - q.d, q.bl + q.d); }
  if (Math.abs(cl[k]) > 0.03) return; tot.robnaOgraja++; cur.n++;
  const vn0 = (c.vx - c.w * wz) * nx + (c.vz + c.w * wx) * nz, cr = clamp(-W.face * vn0, W.cr0, W.cr1);
  const pt = (D) => { let dm = 0, ax = 0, az = 0, sw = 0, tk = 0, far = -1; for (let j = 0; j < P.length; j++) if (j !== k && D[j] < dm) dm = D[j];
    for (let j = 0; j < P.length; j++) { const t = clamp(1 - ((j === k ? 0 : D[j]) - dm) / cr, 0, 1); if (t > 0) { ax += (j === k ? wx : X[j]) * t; az += (j === k ? wz : Z[j]) * t; sw += t; if (j === k) tk = t; else if (far < 0 || cl[j] > cl[far]) far = j; } }
    return { ax: ax / sw, az: az / sw, tk, far }; };
  const a = pt(P.map((p, j) => (X[j] - wx) * nx + (Z[j] - wz) * nz)), b = pt(cl), dist = Math.hypot(a.ax - b.ax, a.az - b.az);
  const rnA = a.ax * nz - a.az * nx, rnB = b.ax * nz - b.az * nx;
  if (dist > 0.5) { tot.tockaDrugje05++; cur.d05++; } if (dist > 1) tot.tockaDrugje1++; if (dist > tot.najOdmik) tot.najOdmik = dist;
  if (a.far >= 0 && cl[a.far] > 0.05 && a.tk === 0) { tot.vVogaluKiSeNeDotika++; cur.ne++; }
  if (rnA * rnB < 0 && Math.abs(rnA) > 0.2 && Math.abs(rnB) > 0.2) { tot.zasukNasprotnegaPredznaka++; cur.zn++; } };
for (const tid of TRACKS) { cur = per[tid] = { n: 0, d05: 0, ne: 0, zn: 0 };
  for (const set of SETS) { const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(SEED);
    try { race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); } catch (e) { continue; }
    const n = Math.round(SECS / SIM.DT); for (let K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive); } }
tot.najOdmik = r3(tot.najOdmik); console.log(JSON.stringify(tot));
console.log('po progah (klicev ob robni ograji / tocka > 0,5 m drugje / v vogalu, ki se ne dotika / zasuk nasprotnega predznaka):');
console.log(Object.keys(per).map((t) => `${t} ${per[t].n}/${per[t].d05}/${per[t].ne}/${per[t].zn}`).join(', '));
