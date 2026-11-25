'use strict';
// Energija ob sunku wallR v dirkah, Realisticna cv 6 (v pomnilniku, drevo nedotaknjeno): [ROOT=po] [SEED=7] node energija.js [sekund]
const { ROOT, PO, loadInst } = require('./lib.js');
const secs = +(process.argv[2] || 30), E = process.env;
const DEF = PO ? 'function wallR(c, wx, wz, nx, nz, k, trk) {' : 'function wallR(c, wx, wz, nx, nz, k) {';
const WRAP = 'function wallR(c, wx, wz, nx, nz, k, trk) { const G = globalThis.__EN, en = () => 0.5 * (c.m.mass * (c.vx * c.vx + c.vz * c.vz) + c.I * c.w * c.w), e0 = en(), u0 = c.vx, u1 = c.vz, u2 = c.w; const r = wallR0(c, wx, wz, nx, nz, k, trk); const dE = en() - e0; G.klicev++; if (c.vx !== u0 || c.vz !== u1 || c.w !== u2) { G.sunkov++; if (dE > G.najvec) G.najvec = dE; if (dE > 1e-6) G.nad++; if (dE < G.najmanj) G.najmanj = dE; } return r; }\n  ' + DEF.replace('wallR(', 'wallR0(');
globalThis.__EN = { klicev: 0, sunkov: 0, najvec: -Infinity, najmanj: Infinity, nad: 0 };
const { C, SIM } = loadInst(ROOT, [[DEF, WRAP]]);
C.setTest({ cv: 6 });
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(',');
for (const tid of TRACKS) for (const set of SETS) {
  Math.random = SIM.seeded(+(E.SEED || 7)); const SU = SIM.SETUPS[set];
  const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t));
  for (let K = 0; K < Math.round(secs / SIM.DT); K++) SIM.stepRace(C, race, K, SU.drive);
}
console.log(JSON.stringify(Object.assign({ drevo: PO ? 'po' : 'pred', sekund: secs, dirk: TRACKS.length * SETS.length }, globalThis.__EN)));
