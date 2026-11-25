'use strict';
// Kdaj in zakaj igralcu odpade kolo: [ROOT=po] node sled.js <proga> <nabor> [sekund]
const { ROOT, loadInst } = require('./lib.js'), path = require('path');
const { C, SIM } = loadInst(ROOT, []);
C.setTest({ cv: 6 });
const tid = process.argv[2], set = process.argv[3], secs = +(process.argv[4] || 60), SU = SIM.SETUPS[set], r3 = (x) => +x.toFixed(3);
Math.random = SIM.seeded(7);
const race = SIM.makeRace(C, tid, (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { wheelRule: C2.MODELS.map((m) => m.id) }));
const p = race.cars.find((c) => c.isPlayer), n = Math.round(secs / SIM.DT); let nL = 0, d0 = 0;
for (let K = 0; K < n; K++) { const v0 = Math.hypot(p.vx, p.vz), s0 = p.q ? p.q.s : 0; d0 = p.dmg; SIM.stepRace(C, race, K, SU.drive);
  const dd = p.dmg - d0, w = p.wreck || {}; if (dd > 0.02 || (w.nL || 0) > nL) console.log('k', K, 's', r3(s0), 'v', r3(v0), '->', r3(Math.hypot(p.vx, p.vz)), 'skoda', r3(d0), '->', r3(p.dmg), 'koles', w.nL || 0, 'hitWall', r3(p.hitWall || 0), 'hitCar', r3(p.hitCar || 0), 'hitObs', r3(p.hitObs || 0), 'd', p.q ? r3(p.q.d) : '-', 'konec', !!(w.rule && w.rule.over));
  nL = w.nL || 0; if (w.rule && w.rule.over) break; }
