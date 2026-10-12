// Toskana's kerb: its outer edge (the red, towards the lawn) is worn, not a ruler-straight line: a gentle wave of 2-28 cm with a wavelength of some
// metres, fading softly (vertex alpha, 18 cm) into the lawn. All inside the one kerb mesh (no extra draw call, a few thousand vertices at most),
// the inner edge flush with the asphalt (no gap), the edge the same on every build (seeded noise, not Math.random), and the other tracks'
// kerbs untouched (still a single opaque 3-colour mesh without alpha; their fingerprints are in browser/world.test.mjs).
//   node tests/browser/kerb.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Toskana kerb: worn outer edge');
const srv = await serve();
const browser = await launch();
// measured in the page: the kerb mesh's vertices as (lateral offset from the centre line, alpha), the mesh count, a hash of the positions
const MEASURE = () => {
  const Tr = window.__game.race.track, w = Tr.w, cw = Tr.curbW, N = Tr.N, W = Render.world;
  let kerb = [], meshes = 0, verts = 0;
  W.root.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; meshes++; verts += o.geometry.attributes.position.count;
    const m = o.material, img = m && m.map && m.map.image; if (img && img.width === 32 && img.height === 64 && m.vertexColors) kerb.push(o); });
  const out = { meshes, verts, kerbMeshes: kerb.length };
  if (kerb.length !== 1) return out;
  const o = kerb[0], g = o.geometry, pos = g.attributes.position.array, col = g.attributes.color, n = col.count;
  out.itemSize = col.itemSize; out.transparent = o.material.transparent; out.verts1 = n;
  let h = 2166136261; for (let i = 0; i < pos.length; i++) { h ^= Math.round(pos[i] * 1e4) | 0; h = Math.imul(h, 16777619) >>> 0; } out.hash = h;
  if (col.itemSize !== 4) return out;
  const edge = [], fade = [], inner = []; let maxOff = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], z = pos[i * 3 + 2], a = col.array[i * 4 + 3];
    let b = 0, bd = 1e18; for (let k = 0; k < N; k++) { const d = (x - Tr.px[k]) ** 2 + (z - Tr.pz[k]) ** 2; if (d < bd) { bd = d; b = k; } }
    const off = Math.abs((x - Tr.px[b]) * Tr.nx[b] + (z - Tr.pz[b]) * Tr.nz[b]);
    if (!(a >= 0 && a <= 1)) bad++;
    maxOff = Math.max(maxOff, off);
    if (Math.abs(Tr.k[b]) > 1 / 60) continue;   // (only where the road is gentle: the nearest-sample measure is exact to a centimetre there)
    if (off < w + 0.03) inner.push(off); else if (a > 0.99 && off > w + 0.8) edge.push(w + cw - off); else if (a < 0.01) fade.push(off);
  }
  const mm = (a) => [Math.min(...a), Math.max(...a)];
  Object.assign(out, { w, cw, edgeN: edge.length, wear: mm(edge), fadeN: fade.length, fade: mm(fade), inner: mm(inner), maxOff, bad });
  // a wave and not a saw: neighbours along the road (the edge vertices sorted by the nearest sample, then by position) differ by a few cm at most
  const byS = []; for (let i = 0; i < n; i++) { const x = pos[i * 3], z = pos[i * 3 + 2], a = col.array[i * 4 + 3]; if (a < 0.99) continue;
    let b = 0, bd = 1e18; for (let k = 0; k < N; k++) { const d = (x - Tr.px[k]) ** 2 + (z - Tr.pz[k]) ** 2; if (d < bd) { bd = d; b = k; } }
    const off = Math.abs((x - Tr.px[b]) * Tr.nx[b] + (z - Tr.pz[b]) * Tr.nz[b]); if (off > w + 0.8 && Math.abs(Tr.k[b]) <= 1 / 60) byS.push([b + ((x - Tr.px[b]) * Tr.tx[b] + (z - Tr.pz[b]) * Tr.tz[b]) / Tr.ds, Math.sign((x - Tr.px[b]) * Tr.nx[b] + (z - Tr.pz[b]) * Tr.nz[b]), w + cw - off]); }
  let jump = 0, runs = 0;
  for (const side of [-1, 1]) { const a = byS.filter(e => e[1] === side).sort((p, q) => p[0] - q[0]);
    for (let i = 1; i < a.length; i++) if (a[i][0] - a[i - 1][0] < 0.8) { runs++; jump = Math.max(jump, Math.abs(a[i][2] - a[i - 1][2])); } }
  out.jump = jump; out.runs = runs;
  return out;
};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  await startTrack(page, 'toskana');
  const a = await page.evaluate(MEASURE);
  T.check('one kerb mesh (one draw call)', a.kerbMeshes === 1, `${a.kerbMeshes}`);
  T.check('the kerb has vertex alpha (the soft fade) and a transparent material', a.itemSize === 4 && a.transparent === true, `itemSize ${a.itemSize}, transparent ${a.transparent}`);
  T.check('the kerb itself stays small', a.verts1 > 0 && a.verts1 < 40000, `${a.verts1} vertices`);
  T.check('alpha always between 0 and 1', a.bad === 0, `${a.bad} out of range`);
  T.check('the outer edge is worn back by 2-28 cm, measured to 3 cm (not a ruler-straight line, never wider than the kerb)', a.edgeN > 100 && a.wear[0] >= -0.01 && a.wear[1] <= 0.31 && a.wear[1] - a.wear[0] >= 0.12,
    `${a.edgeN} edge vertices, worn ${a.wear.map(v => v.toFixed(3)).join(' - ')} m`);
  T.check('the edge is a gentle wave: neighbours 1 m apart differ by under 20 cm', a.runs > 100 && a.jump < 0.2, `${a.runs} pairs, largest step ${(a.jump * 100).toFixed(1)} cm`);
  T.check('the fade is the last 18 cm: the transparent vertices lie at most 0.19 m past the old edge', a.fadeN > 100 && a.fade[1] <= a.w + a.cw + 0.19 && a.fade[0] >= a.w + a.cw - 0.31, `${a.fadeN} vertices at ${a.fade.map(v => v.toFixed(3)).join(' - ')} m (road half width ${a.w}, kerb ${a.cw})`);
  T.check('the inner edge is flush with the asphalt (no gap)', a.inner[0] >= a.w - 0.04 && a.inner[1] <= a.w + 0.04, `${a.inner.map(v => v.toFixed(3)).join(' - ')} m`);
  T.check('nothing beyond the old kerb plus the fade', a.maxOff <= a.w + a.cw + 0.2, `${a.maxOff.toFixed(3)} m`);
  // the same on every build: the track again, Math.random changed
  await page.evaluate(() => { Math.random = () => 0.987654; });
  await startTrack(page, 'toskana');
  const b = await page.evaluate(MEASURE);
  T.check('the same edge on a second build (positions identical, Math.random not used)', b.hash === a.hash && b.verts1 === a.verts1, `${a.hash} / ${b.hash}`);
  // another track with kerbs keeps its plain opaque kerb (no alpha, not transparent)
  await startTrack(page, 'grom');
  const c = await page.evaluate(() => { const W = Render.world; let k = null; W.root.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.map.image && o.material.vertexColors && o.geometry.attributes.uv && !k) { const t = o.material.map.image; if (t.width === 32 && t.height === 64) k = o; } });
    return k ? { itemSize: k.geometry.attributes.color.itemSize, transparent: k.material.transparent } : null; });
  T.check('another circuit: its kerb is unchanged (opaque, no alpha)', c === null || (c.itemSize === 3 && c.transparent === false), JSON.stringify(c));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
