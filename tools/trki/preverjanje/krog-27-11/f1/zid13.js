'use strict';
// Merilo po virih (docs/trki-realizem.md, »Resnični trki (odprti viri)«, vrstica »Tog betonski zid po kotih«): oplazenje ograje ima dva sunka,
// sprednji vogal in nato »udarec repa« 0,15–0,3 s pozneje. Meri DEJANSKE sunke ob ograji iz igre (kljuka v wallR tik pred spremembo hitrosti),
// v obeh drevesih: ROOT=po je drevo s popravkom. Nic se ne spremeni (kljuka samo bere).
// Epizoda: prvi sunek v sprednji vogal avta ob isti ograji (premor do prejsnjega sunka v sprednji vogal vsaj GAP s). Udarec repa: prvi sunek v zadnji
// vogal istega avta ob isti ograji (normala v isto smer) najvec WIN s po zacetku epizode.
const { ROOT, PO, loadInst } = require('../../krog-25-11/f1/lib.js');
const { C, SIM } = loadInst(ROOT, [
  ['c.vx += dvx; c.vz += dvz; c.w = clamp(c.w + dw, -KC.wMax, KC.wMax);', 'if (globalThis.__S) globalThis.__S(c, k, wx, wz, nx, nz, dw); c.vx += dvx; c.vz += dvz; c.w = clamp(c.w + dw, -KC.wMax, KC.wMax);']]);
C.setTest({ cv: 6 });
const E = process.env, SEED = +(E.SEED || 7), GAP = +(E.GAP || 0.1), WIN = +(E.WIN || 1), MINDEG = +(E.MINDEG || 0);
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(','), SECS = +(E.SECS || 60);
const r3 = (x) => +x.toFixed(3); let K = 0, run = '', ev = [];
const ids = new Map(); const idOf = (c) => { if (!ids.has(c)) ids.set(c, ids.size); return ids.get(c); };
globalThis.__S = (c, k, wx, wz, nx, nz, dw) => { if (!(k >= 0)) return;   // (okrogla ovira: ni vogala)
  const vnK = (c.vx - c.w * wz) * nx + (c.vz + c.w * wx) * nz, ch = Math.cos(c.h), sh = Math.sin(c.h);
  ev.push({ run, K, car: idOf(c), pl: !!c.isPlayer, front: c.corners[k][0] > 0, nx, nz, vnK: -vnK, v: Math.hypot(c.vx, c.vz), w0: c.w, dw,
    deg: Math.abs(Math.asin(Math.max(-1, Math.min(1, ch * nx + sh * nz)))) * 180 / Math.PI }); };   // (deg: kot karoserije do ograje)
const out = { drevo: PO ? 'po' : 'pred', sunkov: 0, sprednji: 0, zadnji: 0, epizod: 0, zUdarcemRepa: 0, razmik: [], razmerje: [], pari: [] };
for (const tid of TRACKS) for (const set of SETS) { const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(SEED); run = tid + '/' + set; ev = []; ids.clear();
  try { race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); } catch (e) { continue; }
  const n = Math.round(SECS / SIM.DT); for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  out.sunkov += ev.length; const last = {};   // (zadnji sunek v sprednji vogal po avtu)
  for (let i = 0; i < ev.length; i++) { const a = ev[i]; if (a.front) out.sprednji++; else out.zadnji++; if (!a.front) continue;
    const p = last[a.car]; last[a.car] = a; if (p && (a.K - p.K) * SIM.DT < GAP && p.nx * a.nx + p.nz * a.nz > 0.5) continue;   // (isti dotik se nadaljuje)
    if (a.deg < MINDEG) continue; out.epizod++;
    for (let j = i + 1; j < ev.length; j++) { const b = ev[j]; if ((b.K - a.K) * SIM.DT > WIN) break; if (b.car !== a.car || b.front || b.nx * a.nx + b.nz * a.nz <= 0.5) continue;
      out.zUdarcemRepa++; const dt = (b.K - a.K) * SIM.DT; out.razmik.push(dt); out.razmerje.push(b.vnK / a.vnK);
      out.pari.push({ run, igralec: a.pl, k0: a.K, k1: b.K, razmik: r3(dt), kot: r3(a.deg), v: r3(a.v), spredaj: r3(a.vnK), zadaj: r3(b.vnK), w0: r3(a.w0), w1: r3(a.w0 + a.dw) }); break; } } }
const q = (A, p) => { if (!A.length) return null; const S = A.slice().sort((x, y) => x - y); return r3(S[Math.min(S.length - 1, Math.floor(p * S.length))]); };
const R = out.razmik, Q = out.razmerje;
console.log(JSON.stringify({ drevo: out.drevo, sunkov: out.sunkov, vSprednjiVogal: out.sprednji, vZadnjiVogal: out.zadnji, epizodSprednjiVogal: out.epizod, zUdarcemRepa: out.zUdarcemRepa,
  razmik: { najmanj: q(R, 0), cetrtina: q(R, 0.25), mediana: q(R, 0.5), triCetrtine: q(R, 0.75), najvec: q(R, 0.9999) },
  razmik015do030: R.filter((x) => x >= 0.15 && x <= 0.3).length, razmikPod015: R.filter((x) => x < 0.15).length, razmikNad030: R.filter((x) => x > 0.3).length,
  hitrostRepaProtiSprednjemu: { cetrtina: q(Q, 0.25), mediana: q(Q, 0.5), triCetrtine: q(Q, 0.75), najvec: q(Q, 0.9999) }, repHitrejsiOdSprednjega: Q.filter((x) => x > 1).length }));
if (E.LINES) for (const p of out.pari) console.log(JSON.stringify(p));
