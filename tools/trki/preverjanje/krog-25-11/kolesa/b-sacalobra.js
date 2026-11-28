// NALOGA B: Sa Calobra, seme 81, cv 6: igralčev avto na avtopilotu obtiči ob ograji.
// node b-sacalobra.js <cv> <secs>   (iz korena repozitorija)
const path = require('path');
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const cv = +(process.argv[2] || 6), secs = +(process.argv[3] || 110), seed = 81, tid = 'sacalobra';
const C = loadCore(); C.setTest({ cv });
Math.random = SIM.seeded(seed);
const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
const P = race.player, T = race.track;
const f = (v, n = 2) => v == null ? '-' : (+v).toFixed(n);
function line(k) {
  const q = P.q, fwd = Math.cos(P.h) * q.tx + Math.sin(P.h) * q.tz, W = P.wreck;
  return `t ${f(k * SIM.DT, 1)} s ${f(q.s, 1)} d ${f(q.d)} bl ${f(q.bl)} br ${f(q.br)} v ${f(P.speed)} fwd ${f(fwd)} gear ${P.gear} thr ${f(P.inThr)} brk ${f(P.inBrk)} st ${f(P.inSteer)} dmg ${f(P.dmg)} cd [${P.cd.map(x => f(x)).join(' ')}] lost ${Object.keys(P.lost || {}).join(',') || '-'} wl ${W ? W.wl : '-'} dnf ${W ? !!W.dnf : '-'} stuckT ${f(P.stuckT, 1)} wrongT ${f(P.wrongT, 1)} lap ${P.lap} hitW ${f(P.hitWall)} hitC ${f(P.hitCar)} locked ${!!P.locked} fin ${!!P.finished}`;
}
let k = 0, lastHit = null;
const N = Math.round(secs / SIM.DT);
for (; k < N;) {
  k++; for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  SIM.stepRace(C, race, k);
  if (P.hitWall > 0.5 || P.hitCar > 0.5) { if (k * SIM.DT > 60) console.log('  udarec', line(k)); }
  if (k % 600 === 0) console.log(line(k));
}
console.log('KONEC', line(k));
console.log('proga: w', f(T.w), 'len', f(T.len), 'hill', !!T.hill, 'unf', !!T.unf, 'pit', !!T.def.pit, 'gradeForce', !!T.def.gradeForce, 'open', !!T.open, 'barrier', !!T.def.barrier);
console.log('avto: model', P.m.id, 'x', f(P.x), 'z', f(P.z), 'h', f(P.h, 3), 'vx', f(P.vx, 3), 'vz', f(P.vz, 3), 'w', f(P.w, 3), 'noReverse', P.noReverse, 'revNo', P.revNo, 'revHold', f(P.revHold), 'dmgMode', P.dmgMode, 'len', f(P.m.len), 'wid', f(P.m.wid));
console.log('wreck', JSON.stringify(P.wreck, (kk, v) => typeof v === 'number' ? +v.toFixed(3) : v));
console.log('tekmeci:', race.cars.filter(c => c !== P).map(c => `${c.id || c.name}:${f(c.q.s, 0)}/${c.lap}${c.finished ? 'F' : ''}${c.wreck && c.wreck.dnf ? 'X' : ''}`).join(' '));
