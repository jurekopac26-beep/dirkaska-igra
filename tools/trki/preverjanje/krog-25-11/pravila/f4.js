'use strict';
// F4 nasprotno: kos ob boku, plačilo na prehod; Realistična (cv 6) in stara, več modelov, hitrosti, zdrs
const { load } = require('../fizika/lib.js');
const which = process.argv[2] || 'snap', cv = +(process.argv[3] || 6);
const L = load(which === 'main' ? require('../fizika/lib.js').MAIN : require('../fizika/lib.js').SNAP), C = L.C, DT = L.SIM.DT;
if (cv) C.setTest({ cv });
const T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));
let runs = 0, many = [], nan = 0, paid = 0, maxDv = 0, maxDvRow = '';
for (const mid of ['sokol', 'truck', 'lisica']) { const M = C.MODELS.find(m => m.id === mid);
  for (const part of ['hood', 'mirrorL', 'wheelFL']) { const Pt = C.PARTS[part]; if (!Pt) { console.log('ni dela', part); continue; }
    for (const v of [8, 20, 60]) for (const yaw of [0, 0.12]) for (let i = 0; i <= 36; i++) { const l = i * 0.05;
      const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 3, playerModel: M, assist: 2, seed: 3, difficulty: 1, damage: 2 }); r.start();
      const P = r.player, A = r.cars.find(c => !c.isPlayer); A.place(P.x - Math.cos(P.h) * 200, P.z - Math.sin(P.h) * 200, P.h); A.locked = true; A.vx = A.vz = 0;
      const hh = P.h + yaw; P.vx = Math.cos(hh) * v; P.vz = Math.sin(hh) * v; const nx = -Math.sin(hh), nz = Math.cos(hh);
      r.debris.push({ id: 1, car: A.id, part, x: P.x + Math.cos(hh) * 10 + nx * l, z: P.z + Math.sin(hh) * 10 + nz * l, y: (P.y || 0) + Pt.h * 0.5 + 0.02, vx: 0, vz: 0, vy: 0,
        yaw: 0, rx: 0, rz: 0, wx: 0, wy: 0, wz: 0, r: Pt.r, m: Pt.m, h: Pt.h, rest: true, ground: true, q: null, dead: false });
      let n = 0, dv = 0; const tEnd = 20 / v + 0.4;
      for (let t = 0; t < tEnd; t += DT) { P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.hitDebris = 0; const s0 = Math.hypot(P.vx, P.vz); r.step(DT); const s1 = Math.hypot(P.vx, P.vz);
        if (P.hitDebris > 0) { n++; dv = Math.max(dv, (s0 - s1) / s0); } if (!isFinite(P.x + P.z + P.vx + P.vz + P.w)) nan++; }
      runs++; if (n === 1) paid++; if (n > 1) many.push(`${mid} ${part} v${v} zdrs${yaw} l${l.toFixed(2)} x${n}`);
      if (dv > maxDv) { maxDv = dv; maxDvRow = `${mid} ${part} v${v} zdrs${yaw} l${l.toFixed(2)}`; } } } }
console.log(which.toUpperCase(), 'cv', cv, '| prehodov', runs, 'plačanih enkrat', paid, 'več kot enkrat', many.length, '| NaN', nan, '| največja izguba hitrosti v koraku plačila', (maxDv * 100).toFixed(2) + ' %', maxDvRow);
if (many.length) console.log('  več kot enkrat:', many.slice(0, 12).join('; '));
