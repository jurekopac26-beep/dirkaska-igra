'use strict';
// Prijemalisce sunka wallR po starem in novem pravilu V ISTEM STANJU (drevo po, v pomnilniku): ROOT=po node tocka.js [sekund]
const { ROOT, PO, loadInst } = require('./lib.js'), fs = require('fs'), path = require('path');
if (!PO) { console.log('samo ROOT=po'); process.exit(1); }
const secs = +(process.argv[2] || 60), E = process.env, cl = (x, a, b) => Math.max(a, Math.min(b, x));
const A = 'ax /= sw; az /= sw; }', B = 'ax /= sw; az /= sw; if (globalThis.__PP) globalThis.__PP(c, wx, wz, nx, nz, k, ax, az, D, cr, W.arm); }';
const G = { klicev: 0, zD: 0, samopreverjanjeNapak: 0, premik1mm: 0, premik10cm: 0, premik50cm: 0, najvecjiPremik: 0, staroSunekNovoNe: 0, staroNeNovoSunek: 0, obaSunek: 0, rocicaObrnjena: 0, vsotaPremika: 0, proti: 0, od: 0 };
globalThis.__PP = (c, wx, wz, nx, nz, k, ax, az, D, cr, arm) => {
  const ch = Math.cos(c.h), sh = Math.sin(c.h), P = c.corners; let sw = 0, dm = 0, ox0 = 0, oz0 = 0;
  for (let j = 0; j < P.length; j++) { const l = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && l < dm) dm = l; }
  for (let j = 0; j < P.length; j++) { const ox = j === k ? wx : P[j][0] * ch - P[j][1] * sh, oz = j === k ? wz : P[j][0] * sh + P[j][1] * ch, l = (ox - wx) * nx + (oz - wz) * nz, t = cl(1 - (l - dm) / cr, 0, 1); if (t > 0) { ox0 += ox * t; oz0 += oz * t; sw += t; } }
  ox0 /= sw; oz0 /= sw; const d = Math.hypot(ax - ox0, az - oz0); G.klicev++;
  if (!D) { if (d > 1e-12) G.samopreverjanjeNapak++; return; }
  G.zD++; if (d > 1e-3) G.premik1mm++; if (d > 0.1) G.premik10cm++; if (d > 0.5) G.premik50cm++; if (d > G.najvecjiPremik) G.najvecjiPremik = d; G.vsotaPremika += d;
  const vn = (px, pz) => (c.vx - c.w * pz * arm) * nx + (c.vz + c.w * px * arm) * nz, v1 = vn(ax, az), v0 = vn(ox0, oz0), r1 = ax * nz - az * nx, r0 = ox0 * nz - oz0 * nx;
  if (v0 < 0 && !(v1 < 0)) G.staroSunekNovoNe++; if (!(v0 < 0) && v1 < 0) G.staroNeNovoSunek++;
  if (v0 < 0 && v1 < 0) { G.obaSunek++; if (r0 * r1 < 0 && Math.abs(r0) > 0.05 && Math.abs(r1) > 0.05) G.rocicaObrnjena++; }
};
const src = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8'); if (src.split(A).length !== 2) { console.log('sidro ni enolicno: ' + (src.split(A).length - 1)); process.exit(1); }
const { C, SIM } = loadInst(ROOT, [[A, B]]);
C.setTest({ cv: 6 });
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(',');
let konec = 0, skoda = 0;
for (const tid of TRACKS) for (const set of SETS) {
  Math.random = SIM.seeded(7); const SU = SIM.SETUPS[set];
  const race = SIM.makeRace(C, tid, (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { wheelRule: C2.MODELS.map((m) => m.id) }));
  for (let K = 0; K < Math.round(secs / SIM.DT); K++) SIM.stepRace(C, race, K, SU.drive);
  const p = race.cars.find((c) => c.isPlayer), W = p.wreck || {}; if (W.rule && W.rule.over) konec++; skoda += p.dmg;
}
G.najvecjiPremik = +G.najvecjiPremik.toFixed(3); G.povprecniPremik = +(G.vsotaPremika / Math.max(1, G.zD)).toFixed(3); delete G.vsotaPremika; delete G.proti; delete G.od;
console.log(JSON.stringify(Object.assign({ drevo: 'po', sekund: secs, dirk: TRACKS.length * SETS.length, konecIgre: konec, skodaIgralcev: +skoda.toFixed(3) }, G)));
