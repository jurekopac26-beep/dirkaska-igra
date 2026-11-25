'use strict';
// zid7: nadzorovan prizor (cesta in korak kot tools/trki/zid.js, nacin 'sam'): en avto brez vnosov zdrsne v ograjo pod kotom th, karoserija
// zasukana za psi glede na smer gibanja (zdrs; dokumentiranih 567 prizorov ima psi = 0). Meri skodo ob ograji: po korakih, po dotikih, brez sunka.
// veje: snap cv 6, snap cv 1, main. Nic v repozitoriju.
const { SNAP, MAIN, loadInst } = require('./lib.js');
const DT = 1 / 120, D = 180 / Math.PI, SECS = +(process.env.SECS || 3);
function ovalPts(L, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
function mk(root, cv) {
  const { C, SIM } = loadInst(root, []); C.setTest(cv != null ? { cv } : null);
  const T = new C.Track({ id: 'zid-asfalt', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] });
  return { C, SIM, T };
}
function scene(W, o) {
  const { C, SIM, T } = W; Math.random = SIM.seeded(20261109);
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find(m => m.id === o.id), assist: 2, seed: 9, difficulty: 1, damage: 2 }); race.start();
  const c = race.player, side = 1, v = o.kmh / 3.6;
  let i = 0; for (let k = 0; k < T.px.length; k++) if (Math.abs(T.px[k] - 700) + Math.abs(T.pz[k]) < Math.abs(T.px[i] - 700) + Math.abs(T.pz[i])) i = k;
  const trav = T.hd[i] + side * o.th / D, h = trav + o.psi / D, ch = Math.cos(h), sh = Math.sin(h), B = side > 0 ? T.br[i] : T.bl[i];
  let reach = -1e9; for (const p of c.corners) reach = Math.max(reach, side * ((p[0] * ch - p[1] * sh) * T.nx[i] + (p[0] * sh + p[1] * ch) * T.nz[i]));
  const d0 = side * (B - 0.3 - reach);
  c.place(T.px[i] + T.nx[i] * d0, T.pz[i] + T.nz[i] * d0, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true;
  c.vx = Math.cos(trav) * v; c.vz = Math.sin(trav) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  T.query(c.x, c.z, -1, c.q);
  const n = Math.round(SECS / DT), steps = []; let nan = 0;
  for (let k = 0; k < n; k++) {
    c.inThr = 0; c.inBrk = 0; c.inHand = 0; c.inSteer = 0;
    const d0 = c.dmg; c.wallX = NaN;
    c.steer += C.clamp(0 - c.steer, -6 * DT, 6 * DT);
    if (!c.fall) c.step(DT, T);
    const a = { vx: c.vx, vz: c.vz, w: c.w };
    if (!c.fall) C.wallCollide(c, T, true);
    T.query(c.x, c.z, c.q.i, c.q);
    const hit = c.hitWall, dd = c.dmg - d0;
    if (![c.x, c.z, c.vx, c.vz, c.w, c.dmg].every(Number.isFinite)) nan++;
    if (dd > 0 || hit > 2.5) steps.push({ k, hit, dd, noImp: a.vx === c.vx && a.vz === c.vz && a.w === c.w });
    c.hitWall = 0; c.hitCar = 0; c.fxWall = 0;
  }
  // dotiki: zaporedni koraki s skodo (presledek do 2 koraka)
  const ep = []; for (const s of steps) { const e = ep[ep.length - 1]; if (e && s.k - e.k1 <= 3) { e.k1 = s.k; e.n++; e.dmg += s.dd; e.maxD = Math.max(e.maxD, s.dd); e.maxHit = Math.max(e.maxHit, s.hit); if (s.noImp) { e.noImp++; e.noImpD += s.dd; } }
    else ep.push({ k0: s.k, k1: s.k, n: 1, dmg: s.dd, maxD: s.dd, maxHit: s.hit, noImp: s.noImp ? 1 : 0, noImpD: s.noImp ? s.dd : 0 }); }
  const sum = (f) => ep.reduce((x, e) => x + f(e), 0);
  return { dmg: c.dmg, koraki: steps.length, dotiki: ep.length, najdaljsi: ep.reduce((x, e) => Math.max(x, e.n), 0), enkrat: sum(e => e.maxD), brezSunka: sum(e => e.noImp), brezSunkaD: sum(e => e.noImpD), hitMax: ep.reduce((x, e) => Math.max(x, e.maxHit), 0), nan, wr: c.wreck ? c.wreck.nL : 0 };
}
const W6 = mk(SNAP, 6), W1 = mk(SNAP, 1), WM = mk(MAIN, null);
const IDS = (process.env.IDS || 'rally,formula').split(','), THS = (process.env.THS || '5,10,15,30').split(',').map(Number), KMH = (process.env.KMH || '60,90,120,160').split(',').map(Number);
const PSI = (process.env.PSI || '0,-th,-th/2,th,10,-10,20,-20,30,-30,-45,45,90,-90,180').split(',');
const r3 = (x) => +x.toFixed(3);
const rows = []; let nan = 0;
for (const id of IDS) for (const th of THS) for (const kmh of KMH) for (const ps of PSI) {
  const psi = ps === '-th' ? -th : ps === '-th/2' ? -th / 2 : ps === 'th' ? th : +ps;
  const o = { id, th, kmh, psi }, a = scene(W6, o), b = scene(W1, o), m = scene(WM, o); nan += a.nan + b.nan + m.nan;
  rows.push({ id, th, kmh, psi, cv6: r3(a.dmg), cv1: r3(b.dmg), main: r3(m.dmg), kor6: a.koraki, kor1: b.koraki, niz6: a.najdaljsi, niz1: b.najdaljsi, dot6: a.dotiki, enkrat6: r3(a.enkrat), bs6: a.brezSunka, bsD6: r3(a.brezSunkaD), hit6: r3(a.hitMax), hit1: r3(b.hitMax) });
}
if (process.env.ALL) for (const r of rows) console.log(JSON.stringify(r));
const base = rows.filter(r => r.psi === 0), sl = rows.filter(r => r.psi !== 0);
const st = (R, name) => { const rat = R.filter(r => r.cv1 > 0.01).map(r => r.cv6 / r.cv1).sort((x, y) => x - y), q = (p) => rat.length ? r3(rat[Math.min(rat.length - 1, Math.floor(p * rat.length))]) : null;
  console.log(name, JSON.stringify({ prizorov: R.length, cv6Vsota: r3(R.reduce((x, r) => x + r.cv6, 0)), cv1Vsota: r3(R.reduce((x, r) => x + r.cv1, 0)), mainVsota: r3(R.reduce((x, r) => x + r.main, 0)), razmerjeMediana: q(0.5), razmerje90: q(0.9), razmerjeNajvec: q(0.9999),
    najdaljsiNiz6: Math.max(...R.map(r => r.niz6)), najdaljsiNiz1: Math.max(...R.map(r => r.niz1)), cv6Nad2xCv1: R.filter(r => r.cv6 > 2 * r.cv1 && r.cv6 - r.cv1 > 0.1).length, cv6Poln: R.filter(r => r.cv6 >= 0.95).length, cv1Poln: R.filter(r => r.cv1 >= 0.95).length,
    brezSunkaPrizorov: R.filter(r => r.bs6 > 0).length, brezSunkaSkoda: r3(R.reduce((x, r) => x + r.bsD6, 0)), cv6NadEnkrat2x: R.filter(r => r.enkrat6 > 0.01 && r.cv6 > 2 * r.enkrat6).length })); };
console.log('nan', nan); st(base, 'psi=0 (nos v smeri gibanja)'); st(sl, 'zdrs (psi!=0)');
const worst = rows.filter(r => r.cv1 > 0.01 || r.cv6 > 0.3).sort((x, y) => (y.cv6 - y.cv1) - (x.cv6 - x.cv1)).slice(0, 8);
console.log('najvecja razlika cv6 - cv1:'); for (const r of worst) console.log(' ', JSON.stringify(r));
console.log('tabela dokumenta (psi 0, rally):'); for (const r of rows.filter(r => r.id === 'rally' && r.psi === 0 && ((r.th === 15 && r.kmh === 120) || (r.th === 30 && r.kmh === 120)))) console.log(' ', JSON.stringify(r));
