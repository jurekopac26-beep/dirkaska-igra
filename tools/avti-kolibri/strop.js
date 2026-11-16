// The cabin's top under the roof (avti na raven KOLIBRIJA, docs/avti-kolibri.md, »Slike in orodje«): the inner triangles with no twin (the
// roof field's candidates, tests/browser/crash.test.mjs) inside the roof's crush footprint (look.body.crush: x0..x1, |z| < z), their highest
// point and the highest per 10 cm along x. A new inside under the footprint stays at or under the old one's top (the roof field stays the
// same); the High driver (--hi) may reach higher, the tests run Normal.
//   node tools/avti-kolibri/strop.js sokol tiger [--hi]
const path = require('path'), ROOT = path.resolve(process.env.ROOT || path.join(__dirname, '../..'));
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js')), L = require(path.join(ROOT, 'tests/lib/deli-geo.js'));
const C = loadCore(), R = L.loadRender(C).Render, hi = process.argv.includes('--hi');
for (const id of process.argv.slice(2).filter(a => !a.startsWith('--'))) { const M = C.MODELS.find(m => m.id === id), T = R.kitTry(id, null, null, hi), cr = M.def.look.body.crush || (T.body && T.body.crush) || {};   // (no body.crush: the default one, between the rear glass and the windscreen)
  const g = T.geo, U = g.userData, P = g.attributes.position.array, oN = U.outerN, TW = U.twin, n = P.length / 3, bins = {}; let top = null;
  for (let i = oN; i < n; i++) { if (TW && TW[i - oN] >= 0) continue; const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (x >= cr.x0 && x <= cr.x1 && Math.abs(z) < cr.z) { const b = Math.floor(x * 10) / 10; bins[b] = Math.max(bins[b] ?? -9, y); if (!top || y > top[1]) top = [+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)]; } }
  console.log(id + (hi ? ' hi' : ''), 'top', JSON.stringify(top), 'tris', n / 3, 'inner tris', (n - oN) / 3, 'twin', !!TW);
  console.log('  per x:', Object.keys(bins).map(Number).sort((a, b) => a - b).map(b => b.toFixed(1) + ':' + bins[b].toFixed(3)).join(' ')); g.dispose(); }
