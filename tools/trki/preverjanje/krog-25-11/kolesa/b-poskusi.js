// NALOGA B: poskusi iz zagozdenega stanja (Sa Calobra, seme 81). node b-poskusi.js <cv> <poskus> [t0]
const path = require('path');
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const cv = +(process.argv[2] || 6), what = process.argv[3] || 'stanje', t0 = +(process.argv[4] || 45), seed = 81, tid = 'sacalobra';
const DT = SIM.DT, f = (v, n = 2) => v == null ? '-' : (+v).toFixed(n);
function mk() {
  const C = loadCore(); C.setTest({ cv });
  Math.random = SIM.seeded(seed);
  const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
  return { C, race, P: race.player, T: race.track, k: 0 };
}
function step(R, drive) { R.k++; for (const c of R.race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } return SIM.stepRace(R.C, R.race, R.k, drive); }
function line(R) {
  const P = R.P, q = P.q, fwd = Math.cos(P.h) * q.tx + Math.sin(P.h) * q.tz, lat = Math.cos(P.h) * q.nx + Math.sin(P.h) * q.nz, vl = P.vx * Math.cos(P.h) + P.vz * Math.sin(P.h);
  return `t ${f(R.k * DT, 2)} s ${f(q.s, 2)} d ${f(q.d)} bl ${f(q.bl)} br ${f(q.br)} v ${f(P.speed)} vl ${f(vl)} fwd ${f(fwd)} nrm ${f(lat)} gear ${P.gear} thr ${f(P.inThr)} brk ${f(P.inBrk)} st ${f(P.inSteer)} dmg ${f(P.dmg)} stuckT ${f(P.stuckT, 1)} hitW ${f(P.hitWall)} lap ${P.lap}${P.finished ? ' CILJ' : ''}`;
}
// vogali avta glede na ograjo: d vogala, meja, globina
function corners(R) {
  const P = R.P, T = R.T, ch = Math.cos(P.h), sh = Math.sin(P.h), out = [];
  for (let k = 0; k < P.corners.length; k++) { const rx = P.corners[k][0], rz = P.corners[k][1], wx = rx * ch - rz * sh, wz = rx * sh + rz * ch; const q = T.query(P.x + wx, P.z + wz, P.q.i, {});
    out.push(`k${k} d ${f(q.d)} bl ${f(q.bl)} br ${f(q.br)} glob ${f(Math.max(q.d - q.br, -q.bl - q.d), 3)}`); }
  return out.join(' | ');
}
const R = mk();
if (what === 'trk') {   // potek trka: 34–41 s, vsak korak z udarcem in vsakih 0,25 s
  const N = Math.round(41 / DT); let d0 = 0;
  for (; R.k < N;) { step(R); const t = R.k * DT; if (t < 34) continue; const P = R.P;
    if (P.hitWall > 0.3 || P.hitCar > 0.3 || P.dmg !== d0 || R.k % 30 === 0) console.log((P.dmg !== d0 ? '* ' : '  ') + line(R) + ` hitC ${f(P.hitCar)} cd [${P.cd.map(x => f(x)).join(' ')}]`); d0 = P.dmg; }
  process.exit(0);
}
const N0 = Math.round(t0 / DT); for (; R.k < N0;) step(R);
console.log('STANJE', line(R)); console.log('vogali', corners(R));
const P = R.P, T = R.T;
if (what === 'stanje') {
  const q = P.q; console.log('hill', !!T.hill, T.hill ? `on L ${T.hill.on[0][q.a]} R ${T.hill.on[1][q.a]}` : '', 'q.a', q.a, 'q.i', q.i, 'q.k', q.k, 'gradeForce', !!T.def.gradeForce, 'y', f(P.y), 'pitch/grade', f(q.g != null ? q.g : NaN, 3));
  console.log('polja', Object.keys(P).filter(k2 => typeof P[k2] === 'number' && /^(vx|vz|w|h|x|z|y|gear|rpm|speed|dmg|fuel|heat|eng|pw|csS|inThr|inBrk|inSteer|inHand|stuckT|wrongT)$/.test(k2)).map(k2 => `${k2} ${f(P[k2], 3)}`).join(' '));
  console.log('lost', JSON.stringify(P.lost), 'dz', P.dz && P.dz.map(x => f(x)).join(' '), 'wreck', JSON.stringify(P.wreck), 'flt', JSON.stringify(P.flt), 'kt', JSON.stringify(P.kt));
  process.exit(0);
}
const log = (every, until) => { if (R.k % every === 0 && R.k * DT <= until) console.log('  ' + line(R)); };
const run = (secs, drive, every = 30) => { const N = R.k + Math.round(secs / DT); for (; R.k < N;) { step(R, drive); log(every, 1e9); } };
const man = (thr, brk, st) => (C, race) => { const p = race.player; p.inThr = thr; p.inBrk = brk; p.inSteer = st; p.inHand = 0; };
if (what === 'vzvratno') { console.log('vzvratno naravnost 3 s (zavora drži, plin 0, krmilo 0)'); run(3, man(0, 1, 0)); console.log('vogali', corners(R)); }
else if (what === 'naprejL') { console.log('naprej, polni plin, krmilo -1, 6 s'); run(6, man(1, 0, -1), 60); }
else if (what === 'naprejD') { console.log('naprej, polni plin, krmilo +1, 6 s'); run(6, man(1, 0, 1), 60); }
else if (what === 'vzvratnoZavoj' || what === 'vzvratnoZavoj2') {
  const sg = what === 'vzvratnoZavoj' ? 1 : -1;
  console.log(`vzvratno 2,5 s s krmilom ${sg}, nato avtopilot do cilja`); run(2.5, man(0, 1, sg));
  console.log('nato avtopilot'); let n = 0; const tEnd = 900;
  let own = 0; while (!P.finished && R.k * DT < tEnd && !(P.wreck && P.wreck.dnf)) { step(R); if (R.k % 2400 === 0) console.log('  ' + line(R)); own = P.speed < 1.2 ? own + DT : 0; if (own > 20) { console.log('  spet obtiči', line(R)); break; } }   // (lastna ura mirovanja: P.stuckT po dolgem stanju pada počasi)
  console.log('KONEC', line(R), 'čas dirke', f(R.race.time, 1));
}
else if (what === 'resi') {   // kot igra: avtopilot igralca reši po stuckT > 3,5 (game.js:4744) — tu od začetka dirke
  const R2 = mk(); let n = 0; const ev = [];
  const drive = (C, race) => { const p = race.player; if (p.stuckT > 3.5 || p.wrongT > 3) { race.rescue(p); n++; ev.push(`${f(R2.k * DT, 1)} s pri ${f(p.q.s, 0)} m`); } C.aiControl(p, race, DT); };
  while (!R2.P.finished && R2.k * DT < 900 && !(R2.P.wreck && R2.P.wreck.dnf)) { step(R2, drive); if (R2.k % 2400 === 0) console.log('  ' + line(R2)); }
  console.log('KONEC', line(R2), 'reševanj', n, ev.join('; '), 'čas dirke', f(R2.race.time, 1), 'mesto', R2.P.pos || R2.P.place || '-');
}
