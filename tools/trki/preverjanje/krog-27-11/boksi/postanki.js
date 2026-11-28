'use strict';
// Boksi (krog 27. 11.): prizor »a long race with fuel (<proga>)« iz tests/pits.test.js po semenih. Ista zanka in isti preverjanji kot
// v testu (1.: vsak postanek v boksu, brez dotikov in škode v boksih, vsi na cilju; 2.: duhovi drug v drugem skupaj pod 5 s, naenkrat
// pod 2 s); izpiše izid vsakega semena, z VSE=1 tudi vsak postanek (kot v boksu, zmečkanost sprednjih vogalov cd[0]/cd[1], iz katere
// jedro računa vleko krmila, dmgSteer). Privzeta različica trkov (Simulacija), poškodbe Vklop, vleka krmila po nastavitvi jedra
// (privzeto vsi avti); VLEKA=0 je »Samo moj avto« (C.setTest({ pull: 0 })).
// Zagon (v tej mapi): SEMENA=1-40 node postanki.js; SEMENA=4,7 VSE=1 node postanki.js; drugo drevo: TRKI_SNAP=<drevo>;
// PROGA=toskana KROGI=6 (privzeto). Eno seme teče približno 18 s.
const path = require('path'), ROOT = path.resolve(process.env.TRKI_SNAP || path.join(__dirname, '..', '..', '..', '..', '..'));
const { loadCore } = require(ROOT + '/tests/lib/core.js'), { DT, seeded } = require(ROOT + '/tests/lib/sim.js');
const C = loadCore(); if (process.env.VLEKA != null) C.setTest({ pull: +process.env.VLEKA });
const deg = (a) => a * 180 / Math.PI, VSE = !!process.env.VSE;
const laneYaw = (T, c, p) => { let a = c.h - Math.atan2(c.q.tz, c.q.tx); a = Math.atan2(Math.sin(a), Math.cos(a)); const o0 = (T.pitAt(c.q.s - 1) || p).o, o1 = (T.pitAt(c.q.s + 1) || p).o; return deg(a * p.sd - Math.atan((o1 - o0) / 2)); };
const ov = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, ch = Math.cos(a.h), sh = Math.sin(a.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch; return Math.abs(lx) < (a.m.len + b.m.len) * 0.5 - 0.3 && Math.abs(lz) < (a.m.wid + b.m.wid) * 0.5 - 0.2; };
const tid = process.env.PROGA || 'toskana', laps = +(process.env.KROGI || 6), S = process.env.SEMENA || '7', seeds = [];
for (const part of S.split(',')) { const m = part.split('-').map(Number); for (let i = m[0]; i <= (m.length > 1 ? m[1] : m[0]); i++) seeds.push(i); }
const T = new C.Track(C.TRACKS.find(d => d.id === tid)), orig = Math.random;
for (const sd of seeds) {
  Math.random = seeded(7);
  const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: sd, difficulty: 1, damage: 2, tyres: true, fuel: true, launch: false }); r.start();
  const P = r.player; let t = 0, k = 0, hits = 0, dmg = 0, stops = 0, ghost = 0, wasHit = 0, inBay = 0, ovT = 0, ovMax = 0, yMax = 0;
  const was = new Map(), dm = new Map(), run = new Map(), nst = new Map();
  while (t < 1500 && !r.cars.every(c => c.finished)) {
    Math.random = seeded(5000 + (++k));
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      if (c.pitG) { ghost++; if (c.hitCar > 0) hits++; if (dm.has(c) && c.dmg > dm.get(c) + 1e-9) dmg += c.dmg - dm.get(c); }
      if (c.hitCar > 0 && c.inPit) wasHit++;
      dm.set(c, c.dmg);
      if (c.pitState === 'repair' && was.get(c) !== 'repair') { stops++; nst.set(c, (nst.get(c) || 0) + 1); const p = T.pitAt(c.q.s), y = p ? laneYaw(T, c, p) : 99; yMax = Math.max(yMax, Math.abs(y));
        const glob = p ? c.q.d * p.sd - p.lout : NaN, bx = T.boxX(c.q.s, r._boxD(c)), ok = !!(p && glob > T.bayDim().o * 0.5 && Math.abs(y) < 4 && Math.abs(bx) < 4); if (ok) inBay++;
        if (VSE) console.log(`  postanek ${stops}: t ${t.toFixed(1)} s, avto ${r.cars.indexOf(c)}${c === P ? ' (igralec)' : ''} ${c.m.id}, krog ${c.lap}, ${nst.get(c)}. postanek avta, kot ${y.toFixed(2)}°, na ploščadi ${glob.toFixed(2)} m (meja ${(T.bayDim().o * 0.5).toFixed(2)}), vzdolž boksa ${bx.toFixed(2)} m, škoda ${c.dmg.toFixed(3)}, sprednja vogala ${c.cd[0].toFixed(2)}/${c.cd[1].toFixed(2)}, gorivo ${(c.fuelKg || 0).toFixed(1)} kg${ok ? '' : '  <-- NI v boksu'}`); }
      was.set(c, c.pitState); c.hitCar = 0; c.hitWall = 0;
    }
    const cs = r.cars;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j], key = i * 100 + j;
      if ((a.pitG || b.pitG) && ov(a, b)) { ovT += DT; const v = (run.get(key) || 0) + DT; run.set(key, v); ovMax = Math.max(ovMax, v); } else run.delete(key); }
  }
  const fin = r.cars.every(c => c.finished), ok1 = stops >= 12 && inBay === stops && ghost > 0 && hits === 0 && wasHit === 0 && dmg === 0 && fin && r.cars.every(c => !c.pitG), ok2 = ovT < 5 && ovMax < 2;
  console.log(`seme ${sd}: ${ok1 && ok2 ? 'OK  ' : 'FAIL'} postanki ${stops} (v boksu ${inBay}, največ ${yMax.toFixed(1)}°), dotiki ${hits + wasHit}, škoda ${dmg.toFixed(3)}, na cilju ${r.cars.filter(c => c.finished).length}/${r.cars.length} v ${t.toFixed(0)} s; duhovi drug v drugem ${ovT.toFixed(1)} s, največ ${ovMax.toFixed(1)} s${ok1 ? '' : '  [1. preverjanje pade]'}${ok2 ? '' : '  [2. preverjanje pade]'}`);
}
Math.random = orig;
