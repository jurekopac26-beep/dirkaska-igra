'use strict';
const { SNAP, loadInst } = require('./lib.js');
const P1 = 'const ta = kTurnR(a, dax, daz, dwa, K, b), tb = kTurnR(b, dbx, dbz, dwb, K, a);';
const { C, handling } = loadInst(SNAP, [[P1, P1 + ' globalThis.__dbg && globalThis.__dbg({ nx, nz, px, pz, pen, vn, e, J, Jt, mu, dax, daz, dbx, dbz, dwa, dwb, ta, tb, rax, raz, rbx, rbz });']]);
C.setTest({ cv: 6 });
const H = handling(C, 'cs');
const S = JSON.parse(process.argv[2]);
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = S.csKc || 0; c.cSx = 0; c.cSz = 0; c.fuelKg = S.fuel || 0; c.air = S.air || 0; }
const a = H.mkCar(S.ia, { v: 0 }), b = H.mkCar(S.ib, { v: 0 }); a.isPlayer = !!S.pla; b.isPlayer = !!S.plb; setup(a, S.A); setup(b, S.B);
globalThis.__dbg = (o) => console.log(JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v));
const E = (c) => { const m = c.m.mass + (c.fuelKg || 0), I = c.I * m / c.m.mass; return [0.5 * m * (c.vx * c.vx + c.vz * c.vz), 0.5 * I * c.w * c.w]; };
const e0 = [E(a), E(b)]; const imp = C.carCollide(a, b); const e1 = [E(a), E(b)];
console.log('imp', imp.toFixed(3), 'E lin/rot a,b pred', JSON.stringify(e0.map(x => x.map(Math.round))), 'po', JSON.stringify(e1.map(x => x.map(Math.round))), 'w', a.w.toFixed(3), b.w.toFixed(3), 'csKc', a.csKc, b.csKc);
