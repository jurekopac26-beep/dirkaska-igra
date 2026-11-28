'use strict';
// zid9: ponovitev epizode po korakih z merilnikom v touch in wallR (kopija jedra v pomnilniku): kje je tocka dotika, kje tocka sunka, hitrosti v obeh
const { ROOT, PO, loadInst } = require('./lib.js');
const wrap = (name, args, body) => [`function ${name}(${args}) {`, `function ${name}(${args}) { ${body} }\n  function ${name}0(${args}) {`];
const { C, SIM } = loadInst(ROOT, [
  wrap('wallCollide', 'c, trk, canFall, rc, dt', `const g = globalThis.__W; if (!g) return wallCollide0(c, trk, canFall, rc, dt); const s = [c.vx, c.vz, c.w, c.x, c.z, c.dmg, c.h]; globalThis.__cur = c; const hit = wallCollide0(c, trk, canFall, rc, dt); globalThis.__cur = null; g(c, s, hit, krOn(c)); return hit;`),
  PO ? ['const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return 0;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (globalThis.__R) globalThis.__R(c, ax, az, vn, k, nx, nz); if (vn >= 0) return 0;'] : ['const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (globalThis.__R) globalThis.__R(c, ax, az, vn, k, nx, nz); if (vn >= 0) return;'],
  PO ? ['if (krOn(c) && vn < -KC.wall.v0) { if (wallR(c, wx, wz, nx, nz, rnd ? -1 : k, trk) && -vn > hit) {', 'if (krOn(c) && vn < -KC.wall.v0) { if (globalThis.__T) globalThis.__T(c, wx, wz, pen, nx, nz, k, rnd, vn); if (wallR(c, wx, wz, nx, nz, rnd ? -1 : k, trk) && -vn > hit) {'] : ['if (krOn(c) && vn < -KC.wall.v0) { wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit) {', 'if (krOn(c) && vn < -KC.wall.v0) { if (globalThis.__T) globalThis.__T(c, wx, wz, pen, nx, nz, k, rnd, vn); wallR(c, wx, wz, nx, nz, rnd ? -1 : k); if (-vn > hit) {'],
]);
C.setTest({ cv: 6 });
const tid = process.env.TID || 'krasnahorka', set = process.env.SET || 'crash', K0 = +(process.env.K0 || 1055), NN = +(process.env.NN || 4), SU = SIM.SETUPS[set];
Math.random = SIM.seeded(7); const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); let K = 0; const r3 = (x) => +x.toFixed(3);
const on = (c) => K >= K0 - 1 && K <= K0 + NN && (process.env.ALLCARS ? true : c.isPlayer);
const loc = (c, x, z) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); return [r3(x * ch + z * sh), r3(-x * sh + z * ch)]; };
globalThis.__T = (c, wx, wz, pen, nx, nz, k, rnd, vn) => { if (!on(c)) return; console.log(`  k ${K} touch vogal ${k}${rnd ? ' (okroglo)' : ''} lokalno [${loc(c, wx, wz)}] pen ${r3(pen)} n [${r3(nx)}, ${r3(nz)}] kotKaroserijeDoOgraje ${r3(Math.asin(Math.max(-1, Math.min(1, Math.cos(c.h) * nx + Math.sin(c.h) * nz))) * 57.2958)} deg vnVogal ${r3(vn)} vnSredisce ${r3(c.vx * nx + c.vz * nz)} w ${r3(c.w)}`); };
globalThis.__R = (c, ax, az, vn, k, nx, nz) => { if (!on(c)) return; console.log(`      wallR tockaSunka lokalno [${loc(c, ax, az)}] vnTockaSunka ${r3(vn)} ${vn >= 0 ? 'BREZ SUNKA' : 'sunek'}`); };
globalThis.__W = (c, s, hit) => { if (!on(c) || !(hit > 0)) return; console.log(`k ${K} ${c.m.id} hit ${r3(hit)} skoda ${r3(s[5])} -> ${r3(c.dmg)} dolzina ${c.m.len} sirina ${c.m.wid} plin ${r3(c.inThr)} volan ${r3(c.steer)} v ${r3(Math.hypot(c.vx, c.vz))}`); };
const n = K0 + NN + 2; for (K = 0; K < n; K++) SIM.stepRace(C, race, K, SU.drive);
