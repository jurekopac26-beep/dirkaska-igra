'use strict';
// Kako pogosto wallR da sunek drugje, kot bi ga dala dejanska crta ograje (referenca preverjalca: prostor vsakega vogala po Track.query, manjsi od obeh strani)?
// Meri DEJANSKO tocko sunka in utezi vogalov iz igre (kljuke v wallR), v obeh drevesih: ROOT=po je drevo s popravkom. Nic se ne spremeni (kljuke samo berejo).
const { ROOT, PO, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(ROOT, [
  PO ? ['D = wallRoom(c, trk, k, W.cr0); let sw = 0, dm = 0;', 'D = wallRoom(c, trk, k, W.cr0); let sw = 0, dm = 0; if (globalThis.__B) globalThis.__B(c, k, wx, wz, nx, nz, D);']
    : ['P = c.corners; let sw = 0, dm = 0;', 'P = c.corners; let sw = 0, dm = 0; if (globalThis.__B) globalThis.__B(c, k, wx, wz, nx, nz, null);'],
  ['if (t > 0) { ax += ox * t; az += oz * t; sw += t; } }', 'if (t > 0) { ax += ox * t; az += oz * t; sw += t; if (globalThis.__W) globalThis.__W(j, t); } }'],
  ['ax /= sw; az /= sw; }', 'ax /= sw; az /= sw; if (globalThis.__P) globalThis.__P(ax, az); }'],
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `globalThis.__TRK = trk; return wallCollide0(c, trk, canFall, rc, dt);`)]);
C.setTest({ cv: 6 });
const E = process.env, SEED = +(E.SEED || 7), W = { face: 0.06, cr0: 0.03, cr1: 0.5 };   // (KV.real.wall, js/core.js)
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(','), SECS = +(E.SECS || 60);
const r3 = (x) => +x.toFixed(3), clamp = (x, a, b) => Math.max(a, Math.min(b, x)); let cur = null, st = null;
const tot = { drevo: PO ? 'po' : 'pred', klicev: 0, robnaOgraja: 0, poCrtiOgraje: 0, tockaDrugje05: 0, tockaDrugje1: 0, vVogaluKiSeNeDotika: 0, zasukNasprotnegaPredznaka: 0, najOdmik: 0, najOdmikOdRavneCrte: 0 }, per = {};
globalThis.__B = (c, k, wx, wz, nx, nz, D) => { st = null; const T = globalThis.__TRK; tot.klicev++; if (!T || T.free || T.unf || !c.q) return;
  const ch = Math.cos(c.h), sh = Math.sin(c.h), P = c.corners, q = {}, X = [], Z = [], cl = [];
  for (let j = 0; j < P.length; j++) { X[j] = P[j][0] * ch - P[j][1] * sh; Z[j] = P[j][0] * sh + P[j][1] * ch; if (T.def.barrier) T.queryRoute(c.x + X[j], c.z + Z[j], c.q.i, q); else T.query(c.x + X[j], c.z + Z[j], c.q.i, q); cl[j] = Math.min(q.br - q.d, q.bl + q.d); }
  if (Math.abs(cl[k]) > 0.03) return; tot.robnaOgraja++; cur.n++; if (D) tot.poCrtiOgraje++;
  const vn0 = (c.vx - c.w * wz) * nx + (c.vz + c.w * wx) * nz, cr = clamp(-W.face * vn0, W.cr0, W.cr1);
  const pt = (D) => { let dm = 0, ax = 0, az = 0, sw = 0; for (let j = 0; j < P.length; j++) if (j !== k && D[j] < dm) dm = D[j];
    for (let j = 0; j < P.length; j++) { const t = clamp(1 - ((j === k ? 0 : D[j]) - dm) / cr, 0, 1); if (t > 0) { ax += (j === k ? wx : X[j]) * t; az += (j === k ? wz : Z[j]) * t; sw += t; } }
    return { ax: ax / sw, az: az / sw }; };
  st = { k, nx, nz, cl, a: pt(P.map((p, j) => (X[j] - wx) * nx + (Z[j] - wz) * nz)), b: pt(cl), t: P.map(() => 0) }; };
globalThis.__W = (j, t) => { if (st) st.t[j] = t; };
globalThis.__P = (ax, az) => { if (!st) return; const { k, nx, nz, cl, a, b, t } = st; st = null;   // (ax, az): tocka, ki jo je igra res vzela (pred mnozenjem z arm)
  const dist = Math.hypot(ax - b.ax, az - b.az), rnG = ax * nz - az * nx, rnB = b.ax * nz - b.az * nx; let far = -1;
  for (let j = 0; j < t.length; j++) if (j !== k && t[j] > 0 && (far < 0 || cl[j] > cl[far])) far = j;
  if (dist > 0.5) { tot.tockaDrugje05++; cur.d05++; } if (dist > 1) tot.tockaDrugje1++; if (dist > tot.najOdmik) tot.najOdmik = dist;
  if (far >= 0 && cl[far] > 0.05 && t[k] === 0) { tot.vVogaluKiSeNeDotika++; cur.ne++; }
  if (rnG * rnB < 0 && Math.abs(rnG) > 0.2 && Math.abs(rnB) > 0.2) { tot.zasukNasprotnegaPredznaka++; cur.zn++; }
  const da = Math.hypot(ax - a.ax, az - a.az); if (da > tot.najOdmikOdRavneCrte) tot.najOdmikOdRavneCrte = da; };
for (const tid of TRACKS) { cur = per[tid] = { n: 0, d05: 0, ne: 0, zn: 0 };
  for (const set of SETS) { const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(SEED);
    try { race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); } catch (e) { continue; }
    const n = Math.round(SECS / SIM.DT); for (let K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive); } }
tot.najOdmik = r3(tot.najOdmik); tot.najOdmikOdRavneCrte = r3(tot.najOdmikOdRavneCrte); console.log(JSON.stringify(tot));
console.log('po progah (klicev ob robni ograji / tocka > 0,5 m drugje / v vogalu, ki se ne dotika / zasuk nasprotnega predznaka):');
console.log(Object.keys(per).map((t) => `${t} ${per[t].n}/${per[t].d05}/${per[t].ne}/${per[t].zn}`).join(', '));
