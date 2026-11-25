'use strict';
// (p) boksi: izločitev v vsaki fazi postanka (lane/stop/repair/done), odtrgano kolo tekmeca na progi z boksi (popravilo?), trk v boksih; NaN, vrnitev izločenega na progo, zastoj drugih
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'montreal', seed = +(process.argv[4] || 9), mode = process.argv[5] || 'retire', tMax = +(process.argv[6] || 200);
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), T = new C.Track(C.TRACKS.find(d => d.id === tid));
C.setTest(root === MAIN ? {} : { cv: 6 });
const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 3, playerModel: C.MODELS[4], assist: 2, seed, difficulty: 1, damage: 2, wheelRule: ALL }); r.start();
const P = r.player, AI = r.cars.filter(c => !c.isPlayer), idx = (c) => r.cars.indexOf(c);
const fin = (c) => [c.x, c.z, c.vx, c.vz, c.h, c.dist, c.q.s, c.q.d, c.w].every(Number.isFinite);
const ph = (c) => c.inPit ? (c.pitState || (c.pitDone ? 'doneflag' : 'lane')) : 'track';
const hist = new Map(), used = {}, st = new Map(), ev = [], bad = []; let asked = false, w1 = false; const slow = new Map(), rep = new Map();
for (let k = 0; k < 120 * tMax; k++) {
  Math.random = seeded(1000 + k);
  const t = r.time;
  if (r.state === 'racing' && t >= 8 && mode !== 'wheel1') { asked = true; for (const c of AI) if (!rep.has(c) && !(c.wreck && c.wreck.dnf) && !c.finished) c.pitWant = true; }
  if (r.state === 'racing' && mode === 'wheel1' && !w1 && t >= 8) { w1 = true; for (const c of AI.slice(0, 4)) { C.detachPart(c, 'wheelFL'); ev.push('kolo ' + idx(c) + ' ' + c.m.id + ' nL ' + (c.wreck ? c.wreck.nL : 'BREZ wreck')); } for (const c of AI.slice(4, 6)) { C.detachPart(c, 'wheelFL'); C.detachPart(c, 'wheelFR'); ev.push('dve kolesi ' + idx(c) + ' ' + c.m.id + ' nL ' + (c.wreck ? c.wreck.nL : 'BREZ wreck')); } }
  if (asked && mode !== 'wheel1') for (const c of AI) { const W = c.wreck; if (W && W.dnf) continue; const p = ph(c); if (p !== 'track' && !used[p]) { used[p] = 1;
    if (mode === 'retire') r.retire(c); else if (mode === 'wreck') C.wreckCar(c); else if (mode === 'two') { C.detachPart(c, 'wheelFL'); C.detachPart(c, 'wheelFR'); }
    ev.push(mode + ' v fazi ' + p + ': avto ' + idx(c) + ' t ' + t.toFixed(1) + ' d ' + c.q.d.toFixed(1) + ' dnf ' + !!(c.wreck && c.wreck.dnf) + ' nL ' + (c.wreck && c.wreck.nL)); st.set(c, { p, t0: t, x0: c.x, z0: c.z, lap0: c.lap, s0: c.dist }); } }
  if (!r.isOut(P)) C.aiControl(P, r, DT);
  try { r.step(DT); } catch (e) { bad.push('IZJEMA t ' + r.time.toFixed(2) + ' ' + e.message + ' @ ' + (e.stack.split('\n')[1] || '').trim().slice(0, 90)); break; }
  for (const c of r.cars) {
    if (mode === 'wheel1' && w1 && AI.indexOf(c) >= 0 && AI.indexOf(c) < 6) { let H = hist.get(c); if (!H) hist.set(c, H = []); const key = ph(c) + (c.pitWant ? '+want' : '') + ' nL' + (c.wreck ? c.wreck.nL : '-') + (c.wreck && c.wreck.dnf ? ' dnf' : '') + (c.rescued > 0 ? ' redarji' : ''); if (H.last !== key) { H.last = key; H.push('[' + r.time.toFixed(1) + ' ' + key + ' v' + c.speed.toFixed(0) + ']'); } }
    if (!fin(c)) bad.push('NaN avto ' + idx(c) + ' t ' + r.time.toFixed(2));
    const W = c.wreck, s = st.get(c);
    if (c.pitEv === 'repair' || c.pitState === 'repair') { let R = rep.get(c); if (!R) rep.set(c, R = { n: 0, nL0: W ? W.nL : 0, dmg0: c.dmg, dnf0: !!(W && W.dnf) }); R.last = r.time; }
    if (rep.has(c) && c.pitState !== 'repair') { const R = rep.get(c); if (R.nL1 == null) { R.nL1 = W ? W.nL : 0; R.dmg1 = c.dmg; R.lost1 = Object.keys(c.lost || {}).filter(n => c.lost[n]).length; } }
    if (s) { s.moved = Math.hypot(c.x - s.x0, c.z - s.z0); s.dS = c.dist - s.s0; if (!c.inPit && Math.abs(c.q.d) + c.m.wid * 0.5 < (T.wa ? T.wa[c.q.i] : T.w)) s.onTrack = (s.onTrack || 0) + 1; if (c.lap > s.lap0) { s.lapUp = (s.lapUp || 0) + 1; s.lap0 = c.lap; } if (c.finished) s.fin = true; s.inPit = !!c.inPit; s.ps = c.pitState; s.v = c.speed; s.dnf = !!(W && W.dnf); s.stop = !!(W && W.stop); s.nL = W ? W.nL : 0; s.d = c.q.d; }
    if (!c.isPlayer && c.inPit && c.pitState !== 'repair' && c.speed < 0.3 && !(W && W.dnf)) slow.set(c, (slow.get(c) || 0) + DT);
  }
  if (r.state === 'done' || (P.finished && r.cars.every(c => r.isOut(c)))) break;
}
console.log(root === MAIN ? 'MAIN' : 'SNAP', tid, 'len', T.len.toFixed(0), 'seme', seed, mode, '| t konec', r.time.toFixed(1), 'state', r.state, '| v cilju', r.cars.filter(c => c.finished).length, 'dnf', r.cars.filter(c => c.wreck && c.wreck.dnf).length, 'od', r.cars.length);
for (const e of ev) console.log('  ' + e);
console.log('  dnf ob koncu:', r.cars.filter(c => c.wreck && c.wreck.dnf).map(c => idx(c) + (c.isPlayer ? 'P' : '') + ' nL ' + c.wreck.nL + ' dmg ' + c.dmg.toFixed(2) + ' inPit ' + !!c.inPit + ' d ' + c.q.d.toFixed(1) + (c.wreck.rule ? ' over ' + !!c.wreck.rule.over + ' why ' + c.wreck.rule.why : '')).join(' | '));
for (const [c, s] of st) console.log('  avto', idx(c), 'faza', s.p, '=> dnf', s.dnf, 'stop', s.stop, 'inPit', s.inPit, 'pitState', s.ps, 'v', s.v.toFixed(2), 'premik', s.moved.toFixed(1), 'm pot', s.dS.toFixed(0), 'm d', s.d.toFixed(1), 'korakov na asfaltu zunaj boksov', s.onTrack || 0, 'krogi po', s.lapUp || 0, 'finished', !!s.fin, 'nL', s.nL);
console.log('  popravila:', [...rep].map(([c, R]) => idx(c) + ':nL ' + R.nL0 + '>' + R.nL1 + ' dmg ' + R.dmg0.toFixed(2) + '>' + (R.dmg1 == null ? '?' : R.dmg1.toFixed(2)) + (R.dnf0 ? ' DNF' : '') + (c.finished ? ' F' + c.finishPos : '') + (c.wreck && c.wreck.dnf ? ' dnf' : '')).join(' | ') || 'nič');
console.log('  stanje v boksih (ne popravilo) > 15 s:', [...slow].filter(([c, s]) => s > 15).map(([c, s]) => idx(c) + ':' + s.toFixed(0) + 's ' + ph(c)).join(', ') || 'nič', '| NaN/izjeme', bad.length ? bad.slice(0, 3).join(' | ') + ' (' + bad.length + ')' : 0);
if (mode === 'wheel1') for (const c of AI.slice(0, 6)) console.log(' ', (hist.get(c) || []).join(' '), '\n','  avto', idx(c), c.m.id, 'nL', c.wreck.nL, 'dnf', !!c.wreck.dnf, 'finished', !!c.finished, 'pos', c.finishPos, 'lap', c.lap, 'repairN', c.repairN, 'inPit', !!c.inPit, 'v', c.speed.toFixed(1), 'lost', Object.keys(c.lost).filter(n => c.lost[n]).join(','));
