// node test-a.js <drevo>: pogoj preverjanja »the barrier, sliding and spinning, conservation« iz tests/trki.test.js po delih (v pomnilniku, nič se ne zapiše)
const Module = require('module'), fs = require('fs'), path = require('path');
const tree = path.resolve(process.argv[2]), file = path.join(tree, 'tests/trki.test.js');
let src = fs.readFileSync(file, 'utf8');
if (process.env.NOA === '1') {   // NOA=1: jedro brez dela A (v pomnilniku)
  const rf = fs.readFileSync, X = 'if (wallR(c, wx, wz, nx, nz, rnd ? -1 : k, trk) && -vn > hit)', Y = 'wallR(c, wx, wz, nx, nz, rnd ? -1 : k, trk); if (-vn > hit)'; let n = 0;
  fs.readFileSync = function (f, ...a) { let t = rf.call(fs, f, ...a); if (typeof t === 'string' && String(f).endsWith(path.join('js', 'core.js'))) { if (t.split(X).length !== 2) throw new Error('sidro A'); t = t.replace(X, Y); n++; } return t; };
  process.on('exit', () => console.log('NOA: jedro zamenjano ' + n + ' krat'));
}
const A = 'const k = worst(x => two(x, y => y.dEK)), e = worst(';
if (src.split(A).length !== 2) throw new Error('sidro');
src = src.replace(A, "console.log('POGOJ ' + JSON.stringify({ knockDesno: sum(x => x.r.nK), knockLevo: sum(x => x.l.nK), naslonDesno: sum(x => x.r.nL), naslonLevo: sum(x => x.l.nL), brezDotika: SK.filter(x => !(x.r.n > 0 && x.l.n > 0)).length, nan: SK.filter(x => x.r.nan || x.l.nan).length, vogalNotri: SK.filter(x => !(x.r.deep >= -1e-6 && x.l.deep >= -1e-6)).length, dEK: SK.filter(x => !(x.r.dEK <= 1e-6 && x.l.dEK <= 1e-6)).length, dEL: SK.filter(x => !(x.r.dEL <= 1e-4 && x.l.dEL <= 1e-4)).length, brezSunka: sum(x => x.r.ni + x.l.ni), brezSunkaDesno: sum(x => x.r.ni), dotikov: sum(x => x.r.n + x.l.n), skoda: sum(x => x.r.dmg + x.l.dmg), skodaBrezSunka: sum(x => x.r.dmgNi + x.l.dmgNi) })); process.exit(0); " + A);
const m = new Module(file, null); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(src, file);
