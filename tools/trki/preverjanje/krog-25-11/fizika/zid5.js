'use strict';
// ista dirka (krasnahorka/crash, seme 7) na veji s cv 6, na veji s cv 1 in na main: skoda igralca po casu in koncni izid
const { SNAP, MAIN, load } = require('./lib.js');
const tid = process.env.TID || 'krasnahorka', set = process.env.SET || 'crash', SECS = +(process.env.SECS || 60);
for (const [name, root, cv] of [['veja cv6', SNAP, 6], ['veja cv1', SNAP, 1], ['main', MAIN, null]]) {
  const { C, SIM } = load(root); if (cv != null) C.setTest({ cv }); const SU = SIM.SETUPS[set];
  Math.random = SIM.seeded(7); const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t));
  const p = race.cars.find((c) => c.isPlayer) || race.cars[0]; const n = Math.round(SECS / SIM.DT); const log = []; let prev = p.dmg || 0, nan = 0;
  for (let k = 0; k < n; k++) { SIM.stepRace(C, race, k, SU.drive); const d = p.dmg || 0; if (d - prev > 0.02) log.push(`k${k}:${prev.toFixed(3)}->${d.toFixed(3)}`); prev = d; if (!Number.isFinite(p.x + p.z + p.vx + p.vz + p.w)) nan++; }
  console.log(name, JSON.stringify({ skodaKonec: +(p.dmg || 0).toFixed(3), hitrostKonec: +p.speed.toFixed(2), krog: p.lap, pos: p.pos, dnf: !!(p.dnf || p.out || p.retired), deli: p.parts ? Object.keys(p.parts).filter((q) => p.parts[q]).length : undefined, nan }), 'skoki skode:', log.slice(0, 14).join(' '));
}
