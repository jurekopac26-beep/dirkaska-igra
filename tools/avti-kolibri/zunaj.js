// The outer shell's fingerprint per part (avti na raven KOLIBRIJA, docs/avti-kolibri.md, »Slike in orodje«): as tools/deli-odtis.js, but only
// the outer triangles, one hash per part, so a car whose inside is new (its inner block) still checks its outer shell triangle for triangle;
// a part that is meant to change (e.g. a mirror that now cracks: mirrorL/mirrorR) shows by name. Before the work --save, after it --check.
//   node tools/avti-kolibri/zunaj.js sokol tornado --save /tmp/zunaj.json   (ROOT=<another copy of the game>: that copy's code)
//   node tools/avti-kolibri/zunaj.js sokol tornado --check /tmp/zunaj.json  (SAME or DIFF per car with the parts that differ, then OK or FAIL n)
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, '../..'));
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js')), L = require(path.join(ROOT, 'tests/lib/deli-geo.js'));
const args = process.argv.slice(2), si = args.indexOf('--save'), ci = args.indexOf('--check'), file = si >= 0 ? args[si + 1] : ci >= 0 ? args[ci + 1] : null;
const ids = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const C = loadCore(), R = L.loadRender(C).Render, out = {};
for (const id of ids) for (const hi of [false, true]) {
  const M = C.MODELS.find(m => m.id === id), key = id + (hi ? '/hi' : '');
  if (!M) { out[key] = { err: 'no such car' }; break; }
  if (hi && !(M.def && M.def.look && M.def.look.hi)) continue;
  const T = R.kitTry(id, null, null, hi); if (!T || T.status !== 'ok') { out[key] = { err: 'status ' + (T && T.status) }; continue; }
  const g = T.geo, U = g.userData, P = g.attributes.position.array, Co = g.attributes.color.array, N = P.length / 9, oN = U.outerN / 3;
  const partOf = new Array(N).fill('?');
  for (const k in U.ranges) { const r = U.ranges[k]; for (const [a, b] of [r.o, r.i]) if (a != null) for (let v = a; v < b; v += 3) partOf[v / 3] = k; }
  const by = {};
  for (let t = 0; t < oN; t++) { const s = []; for (let v = 0; v < 9; v++) s.push(Math.round(P[t * 9 + v] * 1e4)); for (let v = 0; v < 9; v++) s.push(Math.round(Co[t * 9 + v] * 1e3));
    (by[partOf[t]] || (by[partOf[t]] = [])).push(s.join(',')); }
  const o = { _n: oN + '/' + (N - oN) };
  for (const k of Object.keys(by).sort()) o[k] = crypto.createHash('sha1').update(by[k].sort().join('|')).digest('hex').slice(0, 10) + ' ' + by[k].length;
  out[key] = o; g.dispose();
}
if (si >= 0) { fs.writeFileSync(file, JSON.stringify(out, null, 1)); console.log('saved', Object.keys(out).length); }
else if (ci >= 0) {
  const ref = JSON.parse(fs.readFileSync(file, 'utf8')); let bad = 0;
  for (const k in out) { const a = ref[k], b = out[k]; if (!a) { console.log('NEW', k, b._n); continue; }
    const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(p => p !== '_n' && a[p] !== b[p]);
    if (diff.length) bad++; console.log(diff.length ? 'DIFF' : 'SAME', k, a._n, '->', b._n, diff.map(p => p + ' ' + (a[p] || '-') + ' -> ' + (b[p] || '-')).join('; ')); }
  console.log(bad ? 'FAIL ' + bad : 'OK outer same'); process.exitCode = bad ? 1 : 0;
} else console.log(JSON.stringify(out, null, 1));
