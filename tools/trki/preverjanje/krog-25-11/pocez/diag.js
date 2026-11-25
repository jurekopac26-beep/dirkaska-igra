// Diagnoza: avto počez (kot tools/trki/pocez.js skoda), dnevnik dotikov med tekmeci.
//   node diag.js ROOT track seed [--secs 50] [--cut] [--trace i,j] [--every 0.25]
'use strict';
const path = require('path');
const argv = process.argv.slice(2); if (process.env.HZX) Object.assign(globalThis, JSON.parse(process.env.HZX));
const ROOT = path.resolve(argv[0]), TID = argv[1], SEED = +argv[2];
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SECS = +arg('--secs', 50), CUT = argv.includes('--cut'), TRACE = arg('--trace', null), EVERY = +arg('--every', 0.25), T0 = +arg('--from', 10), T1 = +arg('--to', 1e9);
const { coreSource } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const CALL = '? aiHazard(c, race, v, Lw) : null;';
function core(cut, cv) {
  let s = coreSource(ROOT);
  if (cut) { const n = s.split(CALL).length - 1; if (n !== 1) throw new Error('klic ' + n); s = s.replace(CALL, '? null : null;'); }
  const m = { exports: {} }, C = new Function('module', 'exports', 'require', s + '\n;return Core;')(m, m.exports, require);
  C.setTest({ cv }); return C;
}
const f = (v, d = 1) => v == null || !Number.isFinite(v) ? '-' : v.toFixed(d);
const C = core(CUT, 6);
Math.random = SIM.seeded(SEED);
const race = SIM.makeRace(C, TID, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: SEED - 68 }));
const T = race.track, P = race.player, n = Math.round(Math.min(SECS, 90) / SIM.DT);
const nm = (c) => c === P ? 'P' : '#' + race.cars.indexOf(c) + (c.m ? ':' + c.m.id : '');
let on = false, X = 0, Z = 0, Hd = 0, pd = 0, d0 = null, hi = 0;
const ev = [], first = new Map(), pastT = new Map(), minV = new Map(), stopT = new Map(); let byP = 0, byC = 0, byW = 0, hits = 0, hitMax = 0; let nP = 0, nC = 0, nW = 0; const SUM = argv.includes('--sum');
const tr = TRACE ? TRACE.split(',').map(Number) : null;
for (let k = 1; k <= n; k++) {
  if (!on && race.time > 10) { on = true; const lead = race.cars.filter(c => c !== P).reduce((a, c) => c.dist > a.dist ? c : a), i = T.idx(lead.q.s + 400), d = T.rl[i];
    X = T.px[i] + T.nx[i] * d; Z = T.pz[i] + T.nz[i] * d; Hd = T.hd[i] + Math.PI / 2; pd = lead.dist + 400; P.place(X, Z, Hd); T.query(X, Z, -1, P.q); hi = i;
    d0 = race.cars.map(c => c.dmg || 0);
    const wq = T.wa ? T.wa[i] : T.w;
    console.log(`ovira: s ${f(P.q.s)} d ${f(P.q.d, 2)} širina ±${f(wq, 2)} m, avto P ${P.m.id} dolž ${P.m.len} šir ${P.m.wid}; vodilni ${nm(lead)} dist ${f(lead.dist)}; pd ${f(pd)}; dolžina proge ${f(T.len)}; open ${!!T.open}`);
    let s = ''; for (let j = -40; j <= 6; j += 2) { const ii = T.idx(P.q.s + j * 5); s += `${j * 5}:${f(T.k[ii] ? 1 / T.k[ii] : Infinity, 0)}/${f((race.vprof)[ii], 0)} `; }
    console.log('polmer/vprof pred oviro (m: R/v): ' + s);
    console.log('polje ob postavitvi: ' + race.cars.filter(c => c !== P).sort((a, b) => b.dist - a.dist).map(c => `${nm(c)} g${f(pd - c.dist, 0)} v${f(c.vl, 0)} d${f(c.q.d, 1)}`).join(' | ')); }
  for (const c of race.cars) { c.hitCar = 0; c.hitWall = 0; }
  const dm = race.cars.map(c => c.dmg || 0), pre = race.cars.map(c => ({ vl: c.vl, vx: c.vx, vz: c.vz, x: c.x, z: c.z, dist: c.dist, d: c.q.d, thr: c.inThr, brk: c.inBrk, hz: c.aiHz, thrt: c.aiThreat, gap: c.aiGap, pass: c.passing, off: c.aiOff, offT: c.aiOffT }));
  if (on) { if (!(P.dmg > 0.3)) { P.x = X; P.z = Z; P.h = Hd; P.vx = P.vz = P.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.dist = pd; Math.random = SIM.seeded(1000 + k); race.step(SIM.DT); P.dist = pd; }
  else SIM.stepRace(C, race, k);
  if (!on) continue;
  const t = k * SIM.DT;
  race.cars.forEach((c, j) => { if (c === P) return;
    if (c.aiHz && !first.has(c)) first.set(c, { t, gap: c.aiHz.o.dist - c.dist, v: c.vl, far: c.aiHz.far, o: nm(c.aiHz.o), vp: c.aiHz.vp });
    if (c.dist > pd + 10 && !pastT.has(c)) pastT.set(c, t);
    if (!pastT.has(c) && pd - c.dist < 150) { if (!(minV.get(c) <= c.vl)) minV.set(c, c.vl); if (c.vl < 1) stopT.set(c, (stopT.get(c) || 0) + SIM.DT); } });
  if (P.hitCar > 0.5) hits++; if (P.hitCar > hitMax) hitMax = P.hitCar;
  race.cars.forEach((c, j) => { if (c === P) return; const dd = ((c.dmg || 0) - dm[j]) * 100; if (!(dd > 0)) return;
    if (c.hitCar > 0 && Math.hypot(c.x - P.x, c.z - P.z) < (c.m.len + P.m.len) * 0.5 + 1) byP += dd; else if (c.hitCar > 0) byC += dd; else byW += dd; if (pd - pre[j].dist < 150 && pd - pre[j].dist > -10) { if (c.hitCar > 0 && Math.hypot(c.x - P.x, c.z - P.z) < (c.m.len + P.m.len) * 0.5 + 1) nP += dd; else if (c.hitCar > 0) nC += dd; else nW += dd; } });
  const hit = race.cars.map((c, j) => ({ c, j, h: c.hitCar, dd: ((c.dmg || 0) - dm[j]) * 100 })).filter(x => x.h > 0 || x.dd > 0);
  if (hit.length) {
    const used = new Set();
    for (const a of hit) { if (used.has(a)) continue; used.add(a);
      // partner: enak hitCar in najbližji
      let b = null, bd = 1e9; for (const o of hit) { if (o === a || used.has(o)) continue; const dd = Math.hypot(o.c.x - a.c.x, o.c.z - a.c.z); if (dd < bd && dd < 8) { b = o; bd = dd; } }
      if (b) used.add(b);
      const A = a.c, B = b ? b.c : null, pa = pre[a.j], pb = b ? pre[b.j] : null;
      const rel = pb ? Math.hypot(pa.vx - pb.vx, pa.vz - pb.vz) : null;
      const back = B ? (pa.dist < pb.dist ? a : b) : a, front = B ? (back === a ? b : a) : null, pk = pre[back.j], pf = front ? pre[front.j] : null;
      ev.push({ t, a: nm(back.c), b: front ? nm(front.c) : (a.c.hitWall > 0 ? 'ograja' : '?'), h: a.h, rel, dvl: pf ? pk.vl - pf.vl : null, dda: back.dd, ddb: front ? front.dd : 0,
        gH: pd - pk.dist, va: pk.vl, vb: pf ? pf.vl : null, da: pk.d, db: pf ? pf.d : null, lon: pf ? pf.dist - pk.dist : null,
        hzA: pk.hz ? `hz(${nm(pk.hz.o)} far${pk.hz.far ? 1 : 0} vp${f(pk.hz.vp)} fq${pk.hz.fq ? nm(pk.hz.fq) : '-'} off${f(pk.hz.off)})` : 'brez', hzB: pf && pf.hz ? `hz(${nm(pf.hz.o)} far${pf.hz.far ? 1 : 0} vp${f(pf.hz.vp)} fq${pf.hz.fq ? nm(pf.hz.fq) : '-'})` : 'brez',
        thA: pk.thrt ? nm(pk.thrt) + '@' + f(pk.gap) : '-', brkA: pk.brk, thrA: pk.thr, brkB: pf ? pf.brk : null, thrB: pf ? pf.thr : null, passA: pk.pass, wall: back.c.hitWall > 0 || (front && front.c.hitWall > 0) });
    }
  }
  if (tr && t >= T0 && t <= T1 && Math.round(t / SIM.DT) % Math.round(EVERY / SIM.DT) === 0) {
    console.log(`t ${f(t, 2)} ` + tr.map(j => { const c = race.cars[j], H = c.aiHz; return `${nm(c)} g${f(pd - c.dist, 1)} v${f(c.vl, 1)} d${f(c.q.d, 2)} off${f(c.aiOff, 2)}>${f(c.aiOffT, 2)} thr${f(c.inThr, 2)} brk${f(c.inBrk, 2)} st${f(c.inSteer, 2)} ${H ? 'HZ' + (H.far ? 'f' : '') + ' vp' + f(H.vp) + (H.fq ? ' fq' + nm(H.fq) : '') : ''} th:${c.aiThreat ? nm(c.aiThreat) + '@' + f(c.aiGap) : '-'}${c.passing ? ' PASS' : ''}${c.alU ? ' U' + nm(c.alU) : ''}${c.alD ? ' D' + nm(c.alD) : ''}${c.alSq ? ' SQ' + nm(c.alSq) : ''} dmg${f((c.dmg || 0) * 100, 0)}`; }).join(' || '));
  }
}
// združi dotike v dogodke (isti par, premor < 0.3 s)
const groups = [];
for (const e of ev) { const key = e.a + '>' + e.b; const g = groups.find(x => x.key === key && e.t - x.t1 < 0.3); if (g) { g.t1 = e.t; g.n++; g.dda += e.dda; g.ddb += e.ddb; if (e.h > g.h) g.h = e.h; } else groups.push(Object.assign({ key, t1: e.t, n: 1 }, e)); }
if (SUM) { const cs = race.cars, riv = cs.filter(c => c !== P); const pts = riv.map(c => pastT.get(c)), sts = riv.map(c => stopT.get(c) || 0);
  const out = { tid: TID, seed: SEED, nP, nC, nW, riv: riv.reduce((s, c) => s + ((c.dmg || 0) - d0[cs.indexOf(c)]) * 100, 0), byP, byC, byW, pDmg: ((P.dmg || 0) - d0[cs.indexOf(P)]) * 100, hits, hitMax, out: riv.filter(c => c.wreck && c.wreck.dnf).length, past: riv.filter(c => c.dist > pd + 10).length,
    firstPast: Math.min(...pts.filter(x => x != null)), lastPast: pts.some(x => x == null) ? null : Math.max(...pts), sumPast: pts.reduce((a, x) => a + (x == null ? 90 : x), 0), maxStop: Math.max(...sts), sumStop: sts.reduce((a, x) => a + x, 0), nStop: sts.filter(x => x > 0.5).length, pts: pts.map(x => x == null ? null : +x.toFixed(1)) };
  console.log(JSON.stringify(out)); process.exit(0); }
console.log('\nDotiki (zadnji > sprednji), združeni:');
for (const g of groups) if (g.dda + g.ddb > 0.05 || g.h > 1)
  console.log(`  t ${f(g.t, 2)}-${f(g.t1, 2)} ${g.key.padEnd(24)} udarec ${f(g.h)} m/s rel ${f(g.rel)} Δvl ${f(g.dvl)} | škoda ${f(g.dda)} + ${f(g.ddb)} % | do ovire ${f(g.gH, 0)} m, vzdolž ${f(g.lon)} m, d ${f(g.da, 1)}/${f(g.db, 1)} | v ${f(g.va)}/${f(g.vb)} | zadnji: ${g.hzA} th ${g.thA} brk ${f(g.brkA, 2)} thr ${f(g.thrA, 2)}${g.passA ? ' PASS' : ''} | sprednji: ${g.hzB} brk ${f(g.brkB, 2)} thr ${f(g.thrB, 2)}${g.wall ? ' +ograja' : ''}`);
const cs = race.cars, riv = cs.filter(c => c !== P);
const byPair = {}; for (const g of groups) { const inv = g.key.includes('P'); const k2 = inv ? 'v avto počez' : g.b === 'ograja' || g.b === '?' ? 'sam/ograja' : 'v druge'; byPair[k2] = (byPair[k2] || 0) + g.dda + g.ddb; }
console.log('\nŠkoda po vrsti (vsi avti, tudi P): ' + Object.entries(byPair).map(([k, v]) => `${k} ${f(v)} %`).join(', '));
console.log('Tekmeci: ' + riv.map(c => `${nm(c)} +${f(((c.dmg || 0) - d0[cs.indexOf(c)]) * 100, 0)}%`).join(' '));
console.log(`Σ tekmecev ${f(riv.reduce((s, c) => s + ((c.dmg || 0) - d0[cs.indexOf(c)]) * 100, 0))} %, avto počez ${f(((P.dmg || 0) - d0[cs.indexOf(P)]) * 100)} %, mimo ${riv.filter(c => c.dist > pd + 10).length}/12`);
console.log('Prva zaznava (aiHz): ' + riv.map(c => { const x = first.get(c); return x ? `${nm(c)} t${f(x.t, 2)} g${f(x.gap, 0)} v${f(x.v, 0)}${x.far ? ' far' : ''} vp${f(x.vp)}` : `${nm(c)} nikoli`; }).join(' | '));
console.log('Mimo ob (s), najmanjša hitrost v zadnjih 150 m, čas stanja (<1 m/s): ' + riv.map(c => `${nm(c)} ${f(pastT.get(c), 1)} vmin ${f(minV.get(c), 1)} stoji ${f(stopT.get(c) || 0, 1)}`).join(' | '));
