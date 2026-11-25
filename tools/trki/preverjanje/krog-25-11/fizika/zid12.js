'use strict';
// Protiprimer v pomnilniku (drevo ostane nedotaknjeno): ali izbira tocke sunka v wallR povzroci epizode ob ograji?
//   B=1: globina drugih vogalov se meri proti dejanski crti ograje (prostor vsakega vogala iz njegovega Track.query), ne po normali vogala k
//   A=1: hit (skoda) se zapise samo, ko wallR da sunek (moznost (A) iz dokumenta)
//   BFROM=k: B velja sele od koraka k (isti zacetek epizode)
// Izpis: izid igralca (pravilo kolesa kot v igri) in statistika dotikov vseh avtov (kot zid4.js).
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(SNAP, [
  ['for (let j = 0; j < P.length; j++) { const d = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }',
    'const DD = globalThis.__B ? globalThis.__B(c, k) : null; for (let j = 0; j < P.length; j++) { const d = DD ? DD[j] : (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }'],
  ['t = clamp(1 - ((j === k ? 0 : (ox - wx) * nx + (oz - wz) * nz) - dm) / cr, 0, 1);', 't = clamp(1 - ((j === k ? 0 : DD ? DD[j] : (ox - wx) * nx + (oz - wz) * nz) - dm) / cr, 0, 1);'],
  ['const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (globalThis.__R) globalThis.__R(c, ax, az, vn, k, nx, nz); if (vn >= 0) { globalThis.__NI = 1; return; }'],
  ['if (krOn(c) && vn < -KC.wall.v0) { wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit) {', 'if (krOn(c) && vn < -KC.wall.v0) { globalThis.__NI = 0; if (globalThis.__T) globalThis.__T(c, wx, wz, pen, nx, nz, k, rnd, vn); wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit && !(globalThis.__A && globalThis.__NI)) {'],
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `globalThis.__TRK = trk; const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.dmg, c.wreck ? c.wreck.nL : 0]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit); return hit;`)]);
C.setTest({ cv: 6 });
const E = process.env, A = +(E.A || 0), B = +(E.B || 0), BFROM = +(E.BFROM || 0), RULE = E.RULE !== '0', K0 = E.K0 != null ? +E.K0 : -1, NN = +(E.NN || 0), SEED = +(E.SEED || 7);
globalThis.__A = A;
const TRACKS = (E.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (E.SETS || 'crash,formula').split(','), SECS = +(E.SECS || 60);
const r3 = (x) => +x.toFixed(3); let K = 0; const BS = { klicev: 0, uporabljen: 0, drugaTocka: 0 };
const loc = (c, x, z) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); return [r3(x * ch + z * sh), r3(-x * sh + z * ch)]; };
const clear = (c, T, j, q) => { const ch = Math.cos(c.h), sh = Math.sin(c.h), p = c.corners[j], X = p[0] * ch - p[1] * sh, Z = p[0] * sh + p[1] * ch; if (T.def.barrier) T.queryRoute(c.x + X, c.z + Z, c.q.i, q); else T.query(c.x + X, c.z + Z, c.q.i, q); return Math.min(q.br - q.d, q.bl + q.d); };
globalThis.__B = (c, k) => { if (!B || K < BFROM) return null; const T = globalThis.__TRK; BS.klicev++; if (!T || T.free || T.unf || !c.q) return null;
  const q = {}; if (Math.abs(clear(c, T, k, q)) > 0.03) return null;   // (dotik ni robna ograja: kot je)
  const D = c.corners.map((p, j) => j === k ? 0 : clear(c, T, j, q)); BS.uporabljen++; return D; };
const win = (c) => K0 >= 0 && K >= K0 && K <= K0 + NN && (E.ALLCARS ? true : c.isPlayer);
globalThis.__T = (c, wx, wz, pen, nx, nz, k, rnd, vn) => { if (win(c)) console.log(`  k ${K} ${c.m.id} dotik vogal ${k} lokalno [${loc(c, wx, wz)}] pen ${r3(pen)} vnVogal ${r3(vn)} vnSredisce ${r3(c.vx * nx + c.vz * nz)} w ${r3(c.w)}`); };
globalThis.__R = (c, ax, az, vn) => { if (win(c)) console.log(`      wallR tockaSunka lokalno [${loc(c, ax, az)}] vnTockaSunka ${r3(vn)} ${vn >= 0 ? 'BREZ SUNKA' : 'sunek'}`); };
const S = { races: 0, steps: 0, dmg: 0, noImp: 0, noImpDmg: 0, eps: [] }, out = [];
for (const tid of TRACKS) for (const set of SETS) {
  const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(SEED);
  try { race = SIM.makeRace(C, tid, (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), RULE ? { wheelRule: C2.MODELS.map((m) => m.id) } : {})); } catch (e) { continue; }
  S.races++; const p = race.cars.find((c) => c.isPlayer), last = new Map(); const R = { run: tid + '/' + set, koloK: -1, koloBrezSunka: false, brezSunka: 0, brezSunkaSkoda: 0 };
  globalThis.__W = (c, s, hit) => { const dd = c.dmg - s[3], same = c.vx === s[0] && c.vz === s[1] && c.w === s[2];
    if (win(c) && hit > 0) console.log(`k ${K} ${c.m.id} hit ${r3(hit)} skoda ${r3(s[3])} -> ${r3(c.dmg)} w ${r3(s[2])} -> ${r3(c.w)}${same ? ' BREZ SUNKA' : ''}`);
    if (c === p) { if (same && dd > 0) { R.brezSunka++; R.brezSunkaSkoda += dd; } const nL = c.wreck ? c.wreck.nL : 0; if (nL > s[4] && R.koloK < 0) { R.koloK = K; R.koloBrezSunka = same; R.hit = r3(hit); } }
    if (!(dd > 0) || !(hit > 2.5)) return; S.steps++; S.dmg += dd; if (same) { S.noImp++; S.noImpDmg += dd; }
    let L = last.get(c); if (L && K - L.k <= 2) { L.k = K; L.n++; L.dmg += dd; if (dd > L.max) L.max = dd; if (hit > L.hit) L.hit = hit; } else { L = { k: K, k0: K, n: 1, dmg: dd, max: dd, hit, run: tid + '/' + set, id: c.m.id, pl: !!c.isPlayer, car: c }; last.set(c, L); S.eps.push(L); } };
  const n = Math.round(SECS / SIM.DT); for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  globalThis.__W = null; const W = p.wreck || {};
  R.konecIgre = !!(W.rule && W.rule.over); R.odstop = !!W.dnf; R.koles = W.nL || 0; R.skoda = r3(p.dmg); R.s = r3(p.q ? p.q.s : 0); R.brezSunkaSkoda = r3(R.brezSunkaSkoda); out.push(R); }
const EP = S.eps, sum = (f) => EP.reduce((a, e) => a + f(e), 0), hist = {}, top = EP.slice().sort((a, b) => b.dmg - a.dmg)[0], lng = EP.slice().sort((a, b) => b.n - a.n)[0];
for (const e of EP) { const k = e.n >= 5 ? '5+' : String(e.n); hist[k] = (hist[k] || 0) + 1; }
console.log(JSON.stringify({ A, B, BFROM, pravilo: RULE, dirk: S.races, korakovSSkodo: S.steps, skodaOgraja: r3(S.dmg), epizod: EP.length, porazdelitevKorakov: hist, delezSkodeNadNajvecjimKorakom: EP.length ? r3(1 - sum((e) => e.max) / sum((e) => e.dmg)) : 0, brezSunkaKorakov: S.noImp, brezSunkaDelezSkode: S.dmg ? r3(S.noImpDmg / S.dmg) : 0,
  igralcuOdpadeKolo: out.filter((r) => r.koles > 0).length, odTegaVKorakuBrezSunka: out.filter((r) => r.koloBrezSunka).length, konecIgre: out.filter((r) => r.konecIgre).length, B_klicev: BS.klicev, B_uporabljen: BS.uporabljen }));
const f = (e) => e && JSON.stringify({ run: e.run, id: e.id, igralec: e.pl, k0: e.k0, korakov: e.n, skoda: r3(e.dmg), najvecjiKorak: r3(e.max), hitMax: r3(e.hit), konecSkoda: r3(e.car.dmg), odstop: !!(e.car.wreck && e.car.wreck.dnf), koles: e.car.wreck ? e.car.wreck.nL || 0 : 0, cilj: !!e.car.finished, s: r3(e.car.q ? e.car.q.s : 0), v: r3(Math.hypot(e.car.vx, e.car.vz)), mesto: e.car.pos || e.car.place || null });
if (top) console.log('najvec skode', f(top)); if (lng) console.log('najdaljsa', f(lng));
if (E.LINES) for (const r of out) console.log(JSON.stringify(r));
