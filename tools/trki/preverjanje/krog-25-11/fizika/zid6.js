'use strict';
// Ali dotik ograje brez sunka spremeni izid dirke? Ista dirka (cv 6, skoda Vklop, pravilo »Odpadlo kolo« kot v igri: vsi modeli)
// kot je (A=0) in z moznostjo (A) iz dokumenta v pomnilniku (A=1: hit se zapise samo ob sunku). Drevo ostane nedotaknjeno.
const { SNAP, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(SNAP, [
  ['const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) { globalThis.__NI = 1; return; }'],
  ['if (krOn(c) && vn < -KC.wall.v0) { wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit) {', 'if (krOn(c) && vn < -KC.wall.v0) { globalThis.__NI = 0; wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit && !(globalThis.__A && globalThis.__NI)) {'],
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.dmg, c.wreck ? c.wreck.nL : 0]; const hit = wallCollide0(c, trk, canFall, rc, dt); g(c, s, hit); return hit;`)]);
C.setTest({ cv: 6 });
const A = +(process.env.A || 0); globalThis.__A = A;
const TRACKS = (process.env.TRACKS || 'tianmen,ghoufi,mombasa,hiva,aguascalientes,kanaba,savusavu,krasnahorka,spa,cusco,kotor,koli,seoul,bathurst,furka,montreal').split(','), SETS = (process.env.SETS || 'crash,formula').split(','), SECS = +(process.env.SECS || 60), RULE = process.env.RULE !== '0';
const r3 = (x) => +x.toFixed(3), out = [];
for (const tid of TRACKS) for (const set of SETS) {
  const SU = SIM.SETUPS[set]; let race; Math.random = SIM.seeded(7);
  try { race = SIM.makeRace(C, tid, (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), RULE ? { wheelRule: C2.MODELS.map((m) => m.id) } : {})); } catch (e) { continue; }
  const p = race.cars.find((c) => c.isPlayer); let K = 0; const R = { run: tid + '/' + set, koloK: -1, koloBrezSunka: false, skodaPredKolesom: null, brezSunka: 0, brezSunkaSkoda: 0 };
  globalThis.__W = (c, s, hit) => { if (c !== p) return; const dd = c.dmg - s[3], same = c.vx === s[0] && c.vz === s[1] && c.w === s[2]; if (same && dd > 0) { R.brezSunka++; R.brezSunkaSkoda += dd; }
    const nL = c.wreck ? c.wreck.nL : 0; if (nL > s[4] && R.koloK < 0) { R.koloK = K; R.koloBrezSunka = same; R.skodaPredKolesom = r3(s[3]); R.hit = r3(hit); } };
  const n = Math.round(SECS / SIM.DT); for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
  globalThis.__W = null; const W = p.wreck || {};
  R.konecIgre = !!(W.rule && W.rule.over); R.odstop = !!W.dnf; R.koles = W.nL || 0; R.skoda = r3(p.dmg); R.s = r3(p.q ? p.q.s : 0); R.krog = p.lap; R.brezSunkaSkoda = r3(R.brezSunkaSkoda); out.push(R); }
const n = out.length, wheel = out.filter((r) => r.koles > 0), byNoImp = out.filter((r) => r.koloBrezSunka);
console.log(JSON.stringify({ A, pravilo: RULE, dirk: n, igralcuOdpadeKolo: wheel.length, odTegaVKorakuBrezSunka: byNoImp.length, konecIgre: out.filter((r) => r.konecIgre).length, odstop: out.filter((r) => r.odstop).length, dirkZDotikomBrezSunka: out.filter((r) => r.brezSunka).length, skodaBrezSunkaSkupaj: r3(out.reduce((a, r) => a + r.brezSunkaSkoda, 0)) }));
for (const r of out) console.log(JSON.stringify(r));
