'use strict';
// (a) kolo odtrgano tik pred ciljem: ali igralec pod pravilom »Odpadlo kolo: Konec dirke« vseeno prečka cilj in dobi uvrstitev?
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'jezero', cv = process.argv[4] == null ? 6 : +process.argv[4];
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const SOKOL = C.MODELS.find(m => m.id === (process.argv[5] || 'sokol')), ALL = C.MODELS.map(m => m.id);
const def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def);
const mk = () => { C.setTest(cv ? { cv } : {}); const r = new C.Race(T, { numAI: 3, playerGrid: 1, laps: 1, playerModel: SOKOL, assist: 2, seed: 3, difficulty: 1, damage: 2, wheelRule: ALL }); r.start(); return r; };
function run(kHit, how) {
  const r = mk(), P = r.player, W = P.wreck; let kFin = -1, kOver = -1, sHit = null, vHit = null, nHit = 0;
  for (let k = 0; k < 120 * 400; k++) {
    Math.random = seeded(1000 + k);
    if (k === kHit) { sHit = P.q.s; vHit = P.speed; if (how === 'det') C.detachPart(P, 'wheelFL'); else { P.dmg = 0.79; C.applyDamage(P, 0.03, P.m.len * 0.5, 0); } nHit = W.nL; }
    if (!r.isOut(P)) { if (kHit >= 0 && k >= kHit) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; } else C.aiControl(P, r, DT); }
    r.step(DT);
    if (kFin < 0 && P.finished) kFin = k;
    if (kOver < 0 && W.rule && W.rule.over) kOver = k;
    if (kHit >= 0 && k > kHit + 120 * 12) break;
    if (kHit < 0 && kFin >= 0) break;
  }
  return { kFin, kOver, sHit, vHit, nHit, fin: !!P.finished, pos: P.finishPos, dnf: !!W.dnf, over: !!(W.rule && W.rule.over), rule: !!W.rule, nL: W.nL, s: P.q.s, len: T.len, open: !!T.open, raceLen: T.raceLen, state: r.state, lap: P.lap };
}
const base = run(-1);
console.log(root === MAIN ? 'MAIN' : 'SNAP', tid, 'cv', cv, 'osnova: kFin', base.kFin, 'rule', base.rule, 'len', Math.round(base.len), 'open', base.open, 'pos', base.pos);
for (const how of ['dmg', 'det']) for (const n of [2, 10, 30, 60, 120, 240, 480]) {
  const o = run(base.kFin - n, how);
  console.log(how, 'korakov pred ciljem', n, 'v', o.vHit.toFixed(1), 'm/s, nL ob udarcu', o.nHit, '=> finished', o.fin, 'pos', o.pos, 'dnf', o.dnf, 'rule.over', o.over, 'kFin-kHit', o.kFin < 0 ? '-' : o.kFin - (base.kFin - n), 'state', o.state);
}
