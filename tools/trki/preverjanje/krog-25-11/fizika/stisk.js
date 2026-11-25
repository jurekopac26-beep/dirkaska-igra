'use strict';
// stisk: avto B stoji ob ograji (pasiven, locked), avto A ga zadene in stisne ob ograjo; v nacinu 'trije' je vmes se avto C (veriga treh in ograja v istem koraku).
// Cel Race.step igre (kot tools/trki/avto-avto.js, trackRun). Meri: NaN, vogal cez crto ograje, prekrivanje avtov, tresenje (vsota |dv| v zadnji sekundi), prirast energije na korak.
// veje: snap cv 6, snap cv 1, main. Nic v repozitoriju.
const { SNAP, MAIN, loadInst } = require('./lib.js');
const DT = 1 / 120, E = process.env, SECS = +(E.SECS || 3);
const TRACKS = (E.TRACKS || 'spa,bathurst').split(','), KMH = (E.KMH || '40,80,120,200').split(',').map(Number), KINDS = (E.KINDS || 'T,posevno,trije').split(','), THR = (E.THR || '0,1').split(',').map(Number);
const r3 = (x) => +x.toFixed(3);
function world(c) { const ch = Math.cos(c.h), sh = Math.sin(c.h); return c.corners.slice().sort((p, q) => Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0])).map((p) => [c.x + p[0] * ch - p[1] * sh, c.z + p[0] * sh + p[1] * ch]); }   // (vogali v krogu: za SAT)
function sat(A, B) {   // (globina prekrivanja dveh konveksnih likov; 0 = se ne prekrivata)
  let best = Infinity;
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; let nx = -(b[1] - a[1]), nz = b[0] - a[0]; const l = Math.hypot(nx, nz); if (!(l > 1e-9)) continue; nx /= l; nz /= l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity; for (const p of A) { const t = p[0] * nx + p[1] * nz; if (t < a0) a0 = t; if (t > a1) a1 = t; } for (const p of B) { const t = p[0] * nx + p[1] * nz; if (t < b0) b0 = t; if (t > b1) b1 = t; }
    const o = Math.min(a1, b1) - Math.max(a0, b0); if (o <= 0) return 0; if (o < best) best = o; }
  return best;
}
function mk(root, cv) { const { C, SIM } = loadInst(root, []); return { C, SIM, cv }; }
function run(W, tid, kind, kmh, thr) {
  const { C, SIM, cv } = W; C.setTest(cv != null ? { cv } : null); Math.random = SIM.seeded(64);
  const T = new C.Track(C.TRACKS.find((d) => d.id === tid)), n = T.px.length, ds = T.len / n;
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS.find((m) => m.id === 'rally'), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
  for (let k = 1; k <= 3 / DT; k++) { Math.random = SIM.seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT); }
  let best = null; const w = Math.round(120 / ds);
  for (let i = Math.round(n * 0.2); i < Math.round(n * 0.8); i++) { let m = 0; for (let k = -w; k <= w; k += 4) { const j = (i + k + n) % n; m = Math.max(m, Math.abs(T.tx[i] * T.tz[j] - T.tz[i] * T.tx[j])); }
    const sc = m + 2 * Math.abs(T.grade[i] || 0); if (!best || sc < best.sc) best = { i, sc, m }; }
  const i = best.i, h = Math.atan2(T.tz[i], T.tx[i]), q = {}; T.query(T.px[i], T.pz[i], -1, q);
  const nx = q.nx, nz = q.nz, tx = Math.cos(h), tz = Math.sin(h), br = q.br, hn = Math.atan2(nz, nx);   // (hn: smer proti desni ograji)
  const A = r.player, O = r.cars.filter((c) => !c.isPlayer), B = O.find((c) => c.m.id === 'kaze') || O[0], Cc = O.find((c) => c !== B);
  const at = (c, s, d, hh, v) => { c.place(T.px[i] + tx * s + nx * d, T.pz[i] + tz * s + nz * d, hh); c.vx = v * Math.cos(hh); c.vz = v * Math.sin(hh); c.w = 0;
    for (let g = 1; g <= c.m.gears.length; g++) { c.gear = g; if (v / c.m.rw * c.m.gears[g - 1] * c.m.final * 9.5493 < c.m.redline * 0.9) break; } T.query(c.x, c.z, -1, c.q); };
  const V = kmh / 3.6, LA = A.m.len, WB = B.m.wid, dB = br - WB / 2 - 0.05, cars = [A, B];
  at(B, 0, dB, h, 0);
  if (kind === 'T') at(A, 0, dB - WB / 2 - LA / 2 - 0.3, hn, V);
  else if (kind === 'posevno') { const a = h + (hn - h) * (30 / 90); at(A, -(B.m.len / 2 + LA / 2) * 0.6, dB - WB / 2 - LA / 2 * Math.sin(Math.PI / 6) - A.m.wid / 2 - 0.4, a, V); }
  else { const WC = Cc.m.wid, dC = dB - WB / 2 - WC / 2 - 0.05; at(Cc, 0, dC, h, 0); at(A, 0, dC - WC / 2 - LA / 2 - 0.3, hn, V); cars.push(Cc); Cc.locked = true; Cc.relT = 0; }
  B.locked = true; B.relT = 0; A.locked = false;
  const clr = (c) => { let m = Infinity; const qq = {}; for (const p of world(c)) { if (T.def.barrier) T.queryRoute(p[0], p[1], c.q.i, qq); else T.query(p[0], p[1], c.q.i, qq); m = Math.min(m, qq.br - qq.d, qq.bl + qq.d); } return m; };
  const ke = (c) => { const m = c.m.mass + (c.fuelKg || 0), I = c.I * m / c.m.mass; return 0.5 * m * (c.vx * c.vx + c.vz * c.vz) + 0.5 * I * c.w * c.w; };
  const R = { clr0: r3(clr(B)), nan: 0, cezCrtoMax: 0, cezCrtoKonec: 0, prekrMaxPo05: 0, prekrKonec: 0, eGorMaxJ: 0, eGorVsotaJ: 0, tv: 0, tvW: 0, vKonec: [], dmg: [], koles: [] };
  const N = Math.round(SECS / DT), prev = cars.map((c) => [c.vx, c.vz, c.w]);
  for (let k = 1; k <= N; k++) {
    Math.random = SIM.seeded(5000 + k); A.inThr = thr; A.inBrk = 0; A.inSteer = 0; B.locked = true; if (cars[2]) cars[2].locked = true;
    const e0 = cars.reduce((s, c) => s + ke(c), 0);
    r.step(DT);
    const e1 = cars.reduce((s, c) => s + ke(c), 0);
    for (const c of cars) if (![c.x, c.z, c.vx, c.vz, c.w, c.h, c.dmg].every(Number.isFinite)) R.nan++;
    if (!thr && e1 > e0) { R.eGorMaxJ = Math.max(R.eGorMaxJ, e1 - e0); R.eGorVsotaJ += e1 - e0; }
    let pen = 0; for (const c of cars) pen = Math.max(pen, -clr(c)); if (pen > R.cezCrtoMax) R.cezCrtoMax = pen; if (k === N) R.cezCrtoKonec = pen;
    let ov = 0; for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) ov = Math.max(ov, sat(world(cars[a]), world(cars[b])));
    if (k > 0.5 / DT && ov > R.prekrMaxPo05) R.prekrMaxPo05 = ov; if (k === N) R.prekrKonec = ov;
    if (E.DBG && (k <= 3 || [10, 30, 60, 120, 240, N].includes(k))) { const o = []; for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) o.push('AB C'.split('')[a === 2 ? 3 : a] + 'ABC'[b] + ' ' + r3(sat(world(cars[a]), world(cars[b]))));
      console.log(`     k ${k} prekrivanje ${o.join(', ')} | v ${cars.map((c) => r3(Math.hypot(c.vx, c.vz))).join(' ')} | ck ${cars.map((c) => +!!c.ck + '' + +!!c.tl + (c.wreck && c.wreck.dnf ? 'D' : '-')).join(' ')} | hitCar ${cars.map((c) => r3(c.hitCar || 0)).join(' ')} dmg ${cars.map((c) => r3(c.dmg)).join(' ')}`); }
    cars.forEach((c, j) => { if (k > N - 120) { const dv = Math.hypot(c.vx - prev[j][0], c.vz - prev[j][1]); R.tv += dv; R.tvW += Math.abs(c.w - prev[j][2]); R.dvMax = Math.max(R.dvMax || 0, dv);
        const g = (R.rng = R.rng || [])[j] = R.rng[j] || [c.x, c.x, c.z, c.z, c.h, c.h]; g[0] = Math.min(g[0], c.x); g[1] = Math.max(g[1], c.x); g[2] = Math.min(g[2], c.z); g[3] = Math.max(g[3], c.z); g[4] = Math.min(g[4], c.h); g[5] = Math.max(g[5], c.h); }
      prev[j] = [c.vx, c.vz, c.w]; });
  }
  for (const c of cars) { R.vKonec.push(r3(Math.hypot(c.vx, c.vz))); R.dmg.push(r3(c.dmg)); R.koles.push(c.wreck ? c.wreck.nL || 0 : 0); }
  for (const k of ['cezCrtoMax', 'cezCrtoKonec', 'prekrMaxPo05', 'prekrKonec', 'eGorMaxJ', 'eGorVsotaJ', 'tv', 'tvW']) R[k] = r3(R[k]);
  C.setTest(null); return R;
}
const WS = { 'snap cv6': mk(SNAP, 6), 'snap cv1': mk(SNAP, 1), main: mk(MAIN, null) }, R0 = Math.random;
for (const tid of TRACKS) for (const kind of KINDS) for (const kmh of KMH) for (const thr of THR) {
  console.log(`== ${tid} ${kind} ${kmh} km/h plin ${thr}`);
  for (const name of (E.WS || 'snap cv6,snap cv1,main').split(',')) { let R; try { R = run(WS[name], tid, kind, kmh, thr); } catch (e) { R = { napaka: String(e && e.message).slice(0, 160) }; } console.log('   ' + name.padEnd(9) + JSON.stringify(R)); }
}
Math.random = R0;
