'use strict';
// Veja (cv po izbiri) proti main, korak za korakom, vsi avti. Okolje: CV (veja), MCV (main, privzeto nic = privzeta 'sim'), SECS, TRACKS, SETUP, SEEDS, NAI, OPTS (json v opts),
// MODS (model igralca), DRIVE=1 (voznik postavitve, npr. crashDrive), GLASS=1 (setCrash glass na obeh), STOP=0 (ne ustavi ob koncu dirke)
const { SNAP, MAIN, load, loadInst } = require('../fizika/lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const chg = (name, args, vars) => wrap(name, args, `const g = globalThis.__ev; if (!g) return ${name}0(${args}); const o = ${vars}, s = [o.x, o.z, o.vx, o.vz, o.w, o.dmg]; const r = ${name}0(${args}); if (o.x !== s[0] || o.z !== s[1] || o.vx !== s[2] || o.vz !== s[3] || o.w !== s[4] || o.dmg !== s[5]) g('${name}', o); return r;`);
const st = (c) => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.y || 0, c.dmg || 0, c.finished ? 1 : 0, c.finishPos || 0, c.finishTime || 0, c.inThr || 0, c.inBrk || 0, c.inSteer || 0];
const NM = ['x', 'z', 'h', 'vx', 'vz', 'w', 'y', 'dmg', 'finished', 'finishPos', 'finishTime', 'inThr', 'inBrk', 'inSteer'];
const PATCHES = {
  p3: ["if (hit > 0 && XR.net) { kx = c.corners[hitK][0]; kz = c.corners[hitK][1]; }", "if (hit > 0) { kx = c.corners[hitK][0]; kz = c.corners[hitK][1]; }"],
  deb: ['const free = !!d.by && d.by.indexOf(c) >= 0;', 'const free = false;'],
  pull: ['function dmgSteer(c, spd, dt) {', 'function dmgSteer(c, spd, dt) { _aiS.delete(c); return 0; }\n  function dmgSteer0(c, spd, dt) {'],
  eng: ['function engStep(c, dt) {', 'function engStep(c, dt) { return; }\n  function engStep0(c, dt) {'],
  ret: ['function retireBlocked(c, race, v) {', 'function retireBlocked(c, race, v) { return false; }\n  function retireBlocked0(c, race, v) {'],
};
const S = loadInst(SNAP, [
  chg('wallCollide', 'c, trk, canFall, rc, dt', 'c'),
  wrap('carCollide', 'a, b', `const g = globalThis.__ev; if (!g) return carCollide0(a, b); const s = [a.x, a.z, a.vx, a.vz, a.w, b.x, b.z, b.vx, b.vz, b.w]; const r = carCollide0(a, b); if (a.x !== s[0] || a.z !== s[1] || a.vx !== s[2] || a.vz !== s[3] || a.w !== s[4] || b.x !== s[5] || b.z !== s[6] || b.vx !== s[7] || b.vz !== s[8] || b.w !== s[9]) g('carCollide', a, b); return r;`),
  chg('debrisHit', 'c, d', 'c'), chg('propCarHit', 'race, c, b', 'c'),
  wrap('aiHazard', 'c, race, v, Lw', `const r = aiHazard0(c, race, v, Lw), g = globalThis.__ev; if (r && g) g('aiHazard', c, r.o, race); return r;`),
].concat((process.env.PATCH || '').includes('ret') ? [] : [wrap('retireBlocked', 'c, race, v', `const r = retireBlocked0(c, race, v), g = globalThis.__ev; if (r && g) g('retireBlocked', c); return r;`)]).concat((process.env.PATCH || '').split(',').filter(Boolean).map(k => PATCHES[k])));
const M = load(MAIN);
const E = process.env, CV = E.CV != null && E.CV !== '' ? +E.CV : 6, MCV = E.MCV ? +E.MCV : 0, SECS = +(E.SECS || 60), PHYS = 'cs';
const TRACKS = (E.TRACKS || 'spa').split(','), MODS = (E.MODS || '').split(',').filter(Boolean), SEEDS = (E.SEEDS || '9').split(',').map(Number), NAI = E.NAI != null && E.NAI !== '' ? +E.NAI : -1;
const OPTS = E.OPTS ? JSON.parse(E.OPTS) : {}, SETUP = E.SETUP || 'race', DRIVE = E.DRIVE === '1', STOP = E.STOP !== '0';
if (CV) S.C.setTest({ cv: CV }); if (MCV) M.C.setTest({ cv: MCV });
if (E.GLASS === '1') { S.C.setCrash({ glass: 1 }); M.C.setCrash({ glass: 1 }); }
if (E.NET === "1") { S.C.setCrash({ net: 1 }); S.C.setTest({}); }   // spletna dirka na veji (game.js xPhys(net), testOf(net)); main: privzeto
const mk = (L, tid, mid, seed) => { Math.random = L.SIM.seeded(7); const SU = L.SIM.SETUPS[SETUP];
  return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(SU.opts(C, NAI === 0 ? true : tt, PHYS, t), NAI > 0 ? { numAI: NAI, playerGrid: NAI + 1 } : {}, mid ? { playerModel: C.MODELS.find(m => m.id === mid) } : {}, { seed }, OPTS)); };
const RK = E.RETIRE ? +E.RETIRE.split(':')[0] : -1, RC = E.RETIRE && E.RETIRE.includes(':') ? +E.RETIRE.split(':')[1] : -1;   // RETIRE=korak[:avto]: odstop (Race.retire) v obeh svetovih
const out = []; const t0 = Date.now();
for (const tid of TRACKS) for (const mid of (MODS.length ? MODS : [''])) for (const seed of SEEDS) {
  const ra = mk(S, tid, mid, seed), rb = mk(M, tid, mid, seed), n = Math.round(SECS / S.SIM.DT); let kEv = -1, ev = '', kDiv = -1, dv = '', K = 0, nEv = 0; const evs = {};
  const first = {}; let hz = '';
  globalThis.__ev = (what, a, b, rc) => { nEv++; evs[what] = (evs[what] || 0) + 1; if (first[what] == null) first[what] = K;
    if (what === 'retireBlocked') return; if (what === 'aiHazard') { if (!hz) hz = ' | prva nevarnost k=' + K + ' ' + a.m.id + ' vidi ' + b.m.id + ' v=' + b.speed.toFixed(2) + ' stuckT=' + (b.stuckT || 0).toFixed(2) + ' dmg=' + (b.dmg || 0).toFixed(3) + ' dnf=' + !!(b.wreck && b.wreck.dnf) + ' t=' + rc.time.toFixed(2); return; }
    if (kEv < 0) { kEv = K; ev = what + ':' + a.m.id + (b ? '/' + b.m.id : ''); } };
  if (ra.cars.length !== rb.cars.length) { out.push(tid + ' razlicno stevilo avtov'); continue; }
  const da = DRIVE ? S.SIM.SETUPS[SETUP].drive : undefined, db = DRIVE ? M.SIM.SETUPS[SETUP].drive : undefined; let evAt = null;
  for (K = 0; K < n; K++) { if (K === RK) { const a = RC < 0 ? ra.player : ra.cars[RC], b = RC < 0 ? rb.player : rb.cars[RC]; ra.retire(a); rb.retire(b); } S.SIM.stepRace(S.C, ra, K, da); M.SIM.stepRace(M.C, rb, K, db);
    for (let i = 0; i < ra.cars.length && kDiv < 0; i++) { const x = st(ra.cars[i]), y = st(rb.cars[i]); for (let q = 0; q < x.length; q++) if (x[q] !== y[q] && !(Number.isNaN(x[q]) && Number.isNaN(y[q]))) { kDiv = K; dv = ra.cars[i].m.id + '#' + i + ' ' + NM[q] + ' ' + x[q] + ' / ' + y[q]; evAt = Object.assign({}, evs); break; } }
    if (kDiv < 0 && (ra.state !== rb.state)) { kDiv = K; dv = 'stanje dirke ' + ra.state + ' / ' + rb.state; }
    if (kDiv >= 0) break;
    if (STOP && ra.cars.every(c => c.finished || (c.wreck && c.wreck.dnf)) ) { K++; break; } }
  globalThis.__ev = null;
  const fo = (r) => (r.finishOrder || []).map(c => r.cars.indexOf(c)).join(',');
  const foEq = fo(ra) === fo(rb), dmgN = ra.cars.filter(c => c.dmg > 0).length, fin = ra.cars.filter(c => c.finished).length;
  out.push(tid + (mid ? '/' + mid : '') + ' seme ' + seed + ' avtov ' + ra.cars.length + (kDiv < 0 ? ' ENAKO ' + (K * S.SIM.DT).toFixed(1) + ' s' : ' RAZLIKA k=' + kDiv + ' (' + (kDiv * S.SIM.DT).toFixed(2) + ' s) ' + dv) + ' | prvi dotik veje k=' + kEv + ' ' + ev + ' | dotikov ' + JSON.stringify(kDiv < 0 ? evs : evAt) + ' prvi ' + JSON.stringify(first) + hz + ' | poskodovanih ' + dmgN + ', v cilju ' + fin + (kDiv < 0 ? ', vrstni red cilja ' + (foEq ? 'enak' : 'RAZLICEN ' + fo(ra) + ' / ' + fo(rb)) : '') + (kDiv >= 0 && (kEv < 0 || kDiv < kEv) ? (first.aiHazard != null && first.aiHazard <= kDiv ? '  << razlika pred dotikom, po nevarnosti' : '  <<< RAZLIKA PRED DOTIKOM BREZ NEVARNOSTI') : ''));
}
console.log('cv veja', CV, 'cv main', MCV || 'privzeta', 'postavitev', SETUP, 'NAI', NAI, 'opts', JSON.stringify(OPTS), 'drive', DRIVE, '| ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); console.log(out.join('\n'));
