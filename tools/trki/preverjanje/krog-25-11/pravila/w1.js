'use strict';
// (w) pravilo koles pri vseh modelih: eno kolo, vsa štiri hkrati, wreckCar; damage 2 in 1; ali avto obstane in je konec dirke (rule.over), NaN
const { SNAP, load } = require('../fizika/lib.js');
const tid = process.argv[2] || 'jezero', cv = +(process.argv[3] || 6);
const { C, SIM } = load(SNAP), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def);
const WH = ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];
let bad = 0, n = 0; const rows = [];
for (const M of C.MODELS) for (const dmg of [2, 1]) for (const how of ['eno', 'stiri', 'wreck', 'udarec']) {
  C.setTest({ cv }); Math.random = seeded(3);
  let r; try { r = new C.Race(T, { numAI: 2, playerGrid: 1, laps: 2, playerModel: M, assist: 2, seed: 3, difficulty: 1, damage: dmg, wheelRule: ALL }); r.start(); } catch (e) { rows.push(M.id + ' dmg ' + dmg + ' ' + how + ' IZJEMA ob zagonu ' + e.message); bad++; continue; }
  const P = r.player, W = P.wreck; let nan = 0, tOver = null, tStop = null, nL0 = null, err = null, hit = false, v0 = 0;
  try {
    for (let k = 0; k < 120 * 26; k++) {
      Math.random = seeded(1000 + k);
      if (!hit && r.state === 'racing' && r.time >= 6) { hit = true; v0 = P.speed;
        if (how === 'eno') C.detachPart(P, 'wheelFL'); else if (how === 'stiri') for (const w of WH) C.detachPart(P, w); else if (how === 'wreck') C.wreckCar(P);
        else { P.dmg = 0.79; P.dz = [0.79, 0.79, 0.79, 0.79]; C.applyDamage(P, 0.09, P.m.len * 0.5, 0); }
        nL0 = W ? W.nL : null; }
      if (!r.isOut(P)) { if (hit) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; } else C.aiControl(P, r, DT); }
      r.step(DT);
      if (!Number.isFinite(P.x + P.z + P.h + P.vx + P.vz + P.w + P.speed)) nan++;
      if (hit && tOver == null && P.wreck && P.wreck.rule && P.wreck.rule.over) tOver = r.time;
      if (hit && tStop == null && P.speed < 0.5) tStop = r.time;
    }
  } catch (e) { err = e.message; }
  const Wn = P.wreck, rule = !!(Wn && Wn.rule), nL = Wn ? Wn.nL : 0, over = !!(Wn && Wn.rule && Wn.rule.over), dnf = !!(Wn && Wn.dnf);
  n++;
  // pričakovano: če ima avto pravilo in mu manjka kolo -> rule.over in dnf; brez NaN in izjem
  const ok = !err && !nan && (!rule || !nL || (over && dnf)) && !(nL && !rule && dmg === 2);
  if (!ok) bad++;
  rows.push(`${ok ? 'ok ' : 'NAPAKA'} ${M.id} dmg ${dmg} ${how}: rule ${rule} nL takoj ${nL0} konec ${nL} over ${over} dnf ${dnf} v0 ${v0.toFixed(0)} tStop ${tStop && (tStop - 6).toFixed(1)} tOver ${tOver && (tOver - 6).toFixed(1)} finished ${!!P.finished} speed ${P.speed.toFixed(1)}${nan ? ' NaN ' + nan : ''}${err ? ' IZJEMA ' + err : ''}`);
}
console.log('modelov', C.MODELS.length, 'voženj', n, 'napak', bad);
const cnt = {}; for (const x of rows) { const m = x.match(/dmg (\d) (\S+): rule (\S+) nL takoj (\S+) konec (\S+) over (\S+) dnf (\S+)/); if (m) { const key = `dmg ${m[1]} ${m[2]} rule ${m[3]} nL0 ${m[4]} nL ${m[5]} over ${m[6]} dnf ${m[7]}`; cnt[key] = (cnt[key] || 0) + 1; } }
for (const k of Object.keys(cnt).sort()) console.log(String(cnt[k]).padStart(3), k);
for (const x of rows) if (!x.startsWith('ok ')) console.log(x);
require('fs').writeFileSync(__dirname + '/w1-rows.log', rows.join('\n') + '\n');
