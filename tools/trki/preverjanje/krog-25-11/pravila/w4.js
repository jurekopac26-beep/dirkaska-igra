'use strict';
// (w4) tekmec izgubi kolo po poti igre (applyDamage v sprednji levi vogal): model s paketom (c.wreck) proti starejšemu modelu brez c.wreck; ali vozi naprej in pride v cilj
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'jezero', seed = +(process.argv[4] || 9), tMax = +(process.argv[5] || 260), amt = +(process.argv[6] || 0.06);
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), T = new C.Track(C.TRACKS.find(d => d.id === tid));
C.setTest(root === MAIN ? {} : { cv: 6 });
const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: +(process.argv[8] || 2), tyres: process.argv[10] === 'tyres', compounds: process.argv[10] === 'tyres', playerModel: C.MODELS.find(m => m.id === (process.argv[7] || 'rally')), assist: 2, seed, difficulty: 1, damage: 2, wheelRule: ALL }); r.start();
const P = r.player, AI = r.cars.filter(c => !c.isPlayer), idx = (c) => r.cars.indexOf(c), WH = ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];
const lostW = (c) => WH.filter(w => c.lost && c.lost[w]);
const tg = new Map(); let done = false, bad = 0;
for (let k = 0; k < 120 * tMax; k++) {
  Math.random = seeded(1000 + k);
  if (r.state === 'racing' && !done && r.time >= +(process.argv[9] || 8)) { done = true;
    for (const c of AI.slice(0, +(process.argv[11] || 8))) { const hl = c.m.len * 0.5, hw = c.m.wid * 0.5; let n = 0; while (n < 60 && !lostW(c).length && c.dmg < 0.999) { C.applyDamage(c, amt, hl, -hw); n++; }
      tg.set(c, { lap0: c.lap, n, dmg: c.dmg, lost0: lostW(c).join('+') || '-', wreck: !!c.wreck, nL0: c.wreck ? c.wreck.nL : null, dm: c.dmgMode, v0: c.speed, s0: c.dist, t0: r.time, resc: 0, pit: 0 }); } }
  if (!r.isOut(P)) C.aiControl(P, r, DT);
  r.step(DT);
  for (const [c, s] of tg) { if (![c.x, c.z, c.vx, c.vz, c.h].every(Number.isFinite)) bad++; if (c.rescued > 0 && !s.rNow) { s.resc++; s.rNow = true; } else if (!(c.rescued > 0)) s.rNow = false; if (c.pitState === 'repair' && !s.pNow) { s.pit++; s.pNow = true; s.pitLap = c.lap; s.pitT0 = r.time; } if (s.pNow && c.pitState !== 'repair') { s.nLp = c.wreck ? c.wreck.nL : null; } else if (c.pitState !== 'repair') s.pNow = false;
    if (c.finished && s.tF == null) { s.tF = r.time; s.sF = c.dist; } if (c.wreck && c.wreck.dnf && s.tD == null) s.tD = r.time; }
  if (r.cars.every(c => r.isOut(c))) break;
}
console.log(root === MAIN ? 'MAIN' : 'SNAP', tid, 'seme', seed, 'udarec', amt, 'krogov', r.opts.laps, 'tyres', !!r.opts.tyres, 't udarca', process.argv[9] || 8, '| t konec', r.time.toFixed(1), '| v cilju', r.cars.filter(c => c.finished).length, 'dnf', r.cars.filter(c => c.wreck && c.wreck.dnf).length, 'od', r.cars.length, '| NaN', bad);
for (const [c, s] of tg) console.log('  avto', idx(c), c.m.id.padEnd(8), 'wreck', s.wreck, 'dmgMode', s.dm, 'udarcev', s.n, 'dmg', s.dmg.toFixed(2), 'odtrgano takoj', s.lost0, 'nL', s.nL0, '=> konec: odtrgano', lostW(c).join('+') || '-', 'nL', c.wreck ? c.wreck.nL : 'brez', 'dnf', !!(c.wreck && c.wreck.dnf), 'redarji', s.resc, 'boksi', s.pit, s.pit ? '(t ' + s.pitT0.toFixed(0) + ', nL po popravilu ' + s.nLp + ')' : '', 'krog ob udarcu', s.lap0, 'finished', !!c.finished, 'mesto', c.finishPos || '-', s.tF ? 'povp. v po izgubi ' + ((s.sF - s.s0) / (s.tF - s.t0)).toFixed(1) + ' m/s' : '');
const ok = r.cars.filter(c => !tg.has(c) && c.finished); console.log('  nepoškodovani v cilju', ok.length, 'povp. v', ok.length ? (ok.reduce((a, c) => a + c.dist / (c.finishTime || r.time), 0) / ok.length).toFixed(1) : '-');
