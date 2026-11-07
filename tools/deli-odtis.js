// The stock car's fingerprint (avti na raven KOLIBRIJA, docs/avti-kolibri.md): every triangle of the render kit's stock car (its corners
// and colours rounded, its part, outer or inner) sorted and hashed, so drawing the same triangles in another order is no change. Before the
// work on a car --save its fingerprint, after it --check: the stock car stays the same triangle for triangle (SAME), its High (look.hi) too.
//   node tools/deli-odtis.js miska raketa --save /tmp/pred.json     (ROOT=<another copy of the game>: that copy's code, e.g. a worktree of main)
//   node tools/deli-odtis.js miska raketa --check /tmp/pred.json    (SAME or DIFF per car, then OK all same or FAIL n)
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, '..'));
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js')), L = require(path.join(ROOT, 'tests/lib/deli-geo.js'));
const args = process.argv.slice(2), si = args.indexOf('--save'), ci = args.indexOf('--check'), file = si >= 0 ? args[si + 1] : ci >= 0 ? args[ci + 1] : null;
const ids = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
if (!ids.length) { console.log('usage: node tools/deli-odtis.js <id ...> [--save file | --check file]'); process.exit(2); }
const C = loadCore(), R = L.loadRender(C).Render, out = {};
for (const id of ids) for (const hi of [false, true]) {
  const M = C.MODELS.find(m => m.id === id), key = id + (hi ? '/hi' : '');
  if (!M) { out[key] = 'no such car'; break; }
  if (hi && !(M.def && M.def.look && M.def.look.hi)) continue;
  const T = R.kitTry(id, null, null, hi); if (!T || T.status !== 'ok') { out[key] = 'status ' + (T && T.status); continue; }
  const g = T.geo, U = g.userData, P = g.attributes.position.array, Co = g.attributes.color.array, N = P.length / 9, oN = U.outerN / 3;
  const partOf = new Array(N).fill('?');
  for (const k in U.ranges) { const r = U.ranges[k]; for (const [a, b] of [r.o, r.i]) if (a != null) for (let v = a; v < b; v += 3) partOf[v / 3] = k; }
  const tris = [];
  for (let t = 0; t < N; t++) { const s = []; for (let v = 0; v < 9; v++) s.push(Math.round(P[t * 9 + v] * 1e4)); for (let v = 0; v < 9; v++) s.push(Math.round(Co[t * 9 + v] * 1e3));
    tris.push((t < oN ? 'o' : 'i') + partOf[t] + ':' + s.join(',')); }
  tris.sort();
  out[key] = crypto.createHash('sha1').update(tris.join('|')).digest('hex').slice(0, 16) + ' ' + oN + '/' + (N - oN) + ' lamps ' + JSON.stringify(U.lamps).length;
  g.dispose();
}
if (si >= 0) { fs.writeFileSync(file, JSON.stringify(out, null, 1)); console.log('saved', Object.keys(out).length, 'to', file); }
else if (ci >= 0) {
  const ref = JSON.parse(fs.readFileSync(file, 'utf8')); let bad = 0;
  for (const k in out) { const ok = ref[k] === out[k]; if (!ok) bad++; console.log(ok ? 'SAME' : 'DIFF', k, out[k], ok ? '' : 'was ' + ref[k]); }
  console.log(bad ? 'FAIL ' + bad : 'OK all same'); process.exitCode = bad ? 1 : 0;
} else console.log(JSON.stringify(out, null, 1));
