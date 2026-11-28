'use strict';
// Stevci okoli wallR za orodja iz drevesa (drevo ostane nedotaknjeno; jedro se instrumentira v pomnilniku).
// node inst.js <drevo> <skripta v drevesu> [argumenti]; PRE=1: najprej lib.js preverjalca in setTest({cv: 6}) (p6, p7, p13)
const path = require('path');
const root = path.resolve(process.argv[2]), script = path.join(root, process.argv[3]);
const core = require(path.join(root, 'tests', 'lib', 'core.js'));
const CNT = globalThis.__CNT = { wallR: 0, zVogalom: 0, crtaOgraje: 0, brezSunka: 0, najRazlikaGlobine: 0 };
core.loadCore = (where) => {
  let code = core.coreSource(where || root);
  const rep = (a, b) => { const n = code.split(a).length - 1; if (n !== 1) throw new Error('sidro ' + n + 'x: ' + a.slice(0, 70)); code = code.replace(a, b); };
  const po = code.includes('function wallRoom(');
  rep('const W = KC.wall; let ax = wx, az = wz;', 'const W = KC.wall; let ax = wx, az = wz; globalThis.__CNT.wallR++;');
  if (po) {
    rep('D = wallRoom(c, trk, k, W.cr0); let sw = 0, dm = 0;', 'D = wallRoom(c, trk, k, W.cr0); let sw = 0, dm = 0; globalThis.__CNT.zVogalom++; if (D) { globalThis.__CNT.crtaOgraje++; for (let j = 0; j < P.length; j++) if (j !== k && isFinite(D[j])) { const d0 = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz, e = Math.abs(D[j] - d0); if (e > globalThis.__CNT.najRazlikaGlobine) globalThis.__CNT.najRazlikaGlobine = e; } }');
    rep('const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return 0;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) { globalThis.__CNT.brezSunka++; return 0; }');
  } else {
    rep('P = c.corners; let sw = 0, dm = 0;', 'P = c.corners; let sw = 0, dm = 0; globalThis.__CNT.zVogalom++;');
    rep('const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return;', 'const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) { globalThis.__CNT.brezSunka++; return; }');
  }
  const fm = { exports: {} };
  return new Function('module', 'exports', 'require', code + '\n;return Core;')(fm, fm.exports, require);
};
process.on('exit', () => { CNT.najRazlikaGlobine = +CNT.najRazlikaGlobine.toExponential(2); console.error('STEVCI ' + JSON.stringify(CNT)); });
process.argv = [process.argv[0], script, ...process.argv.slice(4)];
if (process.env.PRE) { const L = require(path.join(root, 'tools', 'trki', 'preverjanje', 'zid', 'lib.js')); L.C.setTest({ cv: 6 }); }
require(script);
