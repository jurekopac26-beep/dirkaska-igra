// Trk avtov: vogali (nos v bok ali rep avta ob strani), ki jih tri krogi na avto izpustijo (carCollide). Dve škatli avtov (dolžina × širina,
// kot ju vidi igralec) se po stiku ne smeta več prekrivati: prej je nos zrasel v sosednji avto in del avta se ni videl.
//   node tests/corner.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
const H = require('./lib/handling.js')(C);
const { mkCar } = H;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });

// the overlap of the two cars' boxes (separating axis; 0 when apart)
function overlap(a, b) {
  let ov = 1e9;
  for (const h of [a.h, b.h]) for (const t of [0, Math.PI / 2]) {
    const lx = Math.cos(h + t), lz = Math.sin(h + t), ext = (c) => (c.m.len / 2) * Math.abs(Math.cos(c.h) * lx + Math.sin(c.h) * lz) + (c.m.wid / 2) * Math.abs(-Math.sin(c.h) * lx + Math.cos(c.h) * lz);
    ov = Math.min(ov, ext(a) + ext(b) - Math.abs((b.x - a.x) * lx + (b.z - a.z) * lz));
  }
  return Math.max(0, ov);
}

// whether any of the three circles of a touches one of b's (what carCollide has always pushed apart)
function circlesHit(a, b) {
  for (const ca of a.circles) for (const cb of b.circles) {
    const dx = a.x + Math.cos(a.h) * ca - b.x - Math.cos(b.h) * cb, dz = a.z + Math.sin(a.h) * ca - b.z - Math.sin(b.h) * cb;
    if (dx * dx + dz * dz < (a.rad + b.rad) ** 2) return true;
  }
  return false;
}

// A's nose beside B's tail: the circles do not touch (the corners lie between them), the boxes overlap by a hand's width
const pair = (dx, dz, hb) => { const A = mkCar('tornado', { v: 20 }), B = mkCar('tornado', { v: 18 }); A.place(0, 0, 0); B.place(dx, dz, hb || 0); return { A, B }; };
{
  const L = mkCar('tornado', {}).m.len, W = mkCar('tornado', {}).m.wid, dx = L - 0.6, dz = W - 0.2;
  const { A, B } = pair(dx, dz), before = overlap(A, B);
  ok('the set-up: the boxes overlap before (a corner into a corner), whatever the circles say', before > 0.05, 'overlap ' + before.toFixed(2) + ' m (car ' + L + ' x ' + W + ')');
  C.carCollide(A, B);
  ok('after the contact the boxes no longer overlap (to a centimetre)', overlap(A, B) < 0.01, 'overlap ' + overlap(A, B).toFixed(3) + ' m');
  ok('nothing NaN', [A.x, A.z, A.vx, A.vz, B.x, B.z, B.vx, B.vz].every(Number.isFinite), '');
}
{
  // many contacts the circles miss (corners), in different places and angles: never an overlap above a centimetre after the push
  let worst = 0, n = 0;
  for (let k = 0; k < 400; k++) {
    const r = ((k * 7919) % 1000) / 1000, s = ((k * 104729) % 1000) / 1000, t = ((k * 15485863) % 1000) / 1000;
    const { A, B } = pair((r - 0.5) * 9, (s - 0.5) * 4.2, (t - 0.5) * 1.2); if (overlap(A, B) <= 0 || circlesHit(A, B)) continue;
    C.carCollide(A, B); n++; worst = Math.max(worst, overlap(A, B));
  }
  ok('poses the circles miss (corners, angles): after the push the boxes overlap by 1 cm at most', n > 20 && worst < 0.01, n + ' contacts, worst ' + worst.toFixed(3) + ' m');
}
{
  const { A, B } = pair(7, 0);   // apart: nothing happens
  const x0 = A.x, z0 = A.z, imp = C.carCollide(A, B);
  ok('cars apart: no contact, nothing moved', imp === 0 && A.x === x0 && A.z === z0, 'impact ' + imp);
}

let bad = 0;
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exit(bad ? 1 : 0);
