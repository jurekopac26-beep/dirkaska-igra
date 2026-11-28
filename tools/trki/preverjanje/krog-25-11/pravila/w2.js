'use strict';
// (w2) sled izjeme: vsa štiri kolesa v istem koraku pri modelu brez paketa; kje pade in ali pade tudi po poti igre (applyDamage / wreckCar) in na main
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const which = process.argv[2] || 'snap', mid = process.argv[3] || 'kaze', how = process.argv[4] || 'stiri', cv = +(process.argv[5] || 6), dmg = +(process.argv[6] || 2);
const { C, SIM } = load(which === 'main' ? MAIN : SNAP), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));
const M = C.MODELS.find(m => m.id === mid);
C.setTest(which === 'main' ? {} : { cv }); Math.random = seeded(3);
const r = new C.Race(T, { numAI: 2, playerGrid: 1, laps: 2, playerModel: M, assist: 2, seed: 3, difficulty: 1, damage: dmg, wheelRule: ALL }); r.start();
const P = r.player; let hit = false, where = 'pred';
const WH = ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];
console.log(which.toUpperCase(), mid, how, 'cv', cv, 'dmg', dmg, '| wreck ob zagonu', !!P.wreck, 'kt', P.kt, 'dmgMode', P.dmgMode, 'detachPart', typeof C.detachPart, 'deli modela', M.parts ? Object.keys(M.parts).join(',') : (M.kit ? 'kit' : 'brez'));
try {
  for (let k = 0; k < 120 * 20; k++) {
    Math.random = seeded(1000 + k);
    if (!hit && r.state === 'racing' && r.time >= 6) { hit = true; where = 'detach';
      if (how === 'stiri') for (const w of WH) { where = 'detach ' + w; C.detachPart(P, w); }
      else if (how === 'dva') for (const w of WH.slice(0, 2)) { where = 'detach ' + w; C.detachPart(P, w); }
      else if (how === 'zadaj') { where = 'detach wheelRL'; C.detachPart(P, 'wheelRL'); }
      else if (how === 'zap') { for (const w of WH) { where = 'detach ' + w; C.detachPart(P, w); for (let j = 0; j < 30; j++) { where = 'step po ' + w + ' +' + j; r.step(DT); } } }
      console.log('po odtrganju: nL', P.wreck && P.wreck.nL, 'lost', JSON.stringify(P.lost), 'detach', P.detach && P.detach.length);
      where = 'step'; }
    if (!r.isOut(P)) { if (hit) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; } else C.aiControl(P, r, DT); }
    where = hit ? 'step po odtrganju k=' + k : 'step';
    r.step(DT);
  }
  console.log('brez izjeme; nL', P.wreck && P.wreck.nL, 'over', P.wreck && P.wreck.rule && P.wreck.rule.over, 'dnf', P.wreck && P.wreck.dnf, 'speed', P.speed.toFixed(1));
} catch (e) { console.log('IZJEMA pri:', where, '| t', r.time.toFixed(2)); console.log(e.stack.split('\n').slice(0, 7).join('\n')); }
