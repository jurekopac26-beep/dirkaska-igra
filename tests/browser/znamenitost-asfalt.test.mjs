// A landmark made in Blender (js/znamenitost.js) never stands on the asphalt: on every real track with one, each vertex of its near
// model above the road's height (more than 0.3 m under it: in the ground) is farther from the centre line than half the road's width
// there plus 0.3 m (Matej 22. 11.: »Grad (vrata) sredi ceste tako zagotovo ni v resnici« — Hiva's east gate at s ≈ 1944: the gates sit in
// the walls, the road beside them, as OSM draws them). The same for the simple one drawn until the model has loaded (out.landmarkFallback),
// here with the models' files held back. Test tracks (test: true) are frozen and not checked.
//   node tests/browser/znamenitost-asfalt.test.mjs        every real track with a landmark
//   ZN_ONLY=hiva node tests/browser/znamenitost-asfalt.test.mjs   only these
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const IDS = (process.env.ZN_ONLY || 'eljem,hiva,isalo,isuna,luanda,mombasa,portobelo').split(',');
const MARGIN = 0.3;
// every vertex of the landmark's near model (fb: of its fallback) against the centre line of the race's track
function measure(page, id, fb) {
  return page.evaluate(async ([id, M, fb]) => {
    const W = Render.world; if (W.landmarkLoad) await W.landmarkLoad;
    let near = null;
    if (fb) { near = W.landmarkFallback; if (!near || !near.parent) return { err: 'no fallback drawn' }; }
    else { let lod = null; W.root.traverse(o => { if (o.name === 'znamenitost:' + id) lod = o; }); if (!lod) return { err: 'no landmark model' }; near = lod.levels[0].object; }
    near.updateMatrixWorld(true);
    const t = window.__game.race.track, N = t.N, H = 10, G = new Map();
    for (let i = 0; i < N; i++) { const k = Math.floor(t.px[i] / H) + ',' + Math.floor(t.pz[i] / H); (G.get(k) || G.set(k, []).get(k)).push(i); }
    const P = near.geometry.attributes.position, e = near.matrixWorld.elements, worst = new Map();
    let n = 0, min = Infinity;
    for (let v = 0; v < P.count; v++) {
      const lx = P.getX(v), ly = P.getY(v), lz = P.getZ(v);
      const x = e[0] * lx + e[4] * ly + e[8] * lz + e[12], y = e[1] * lx + e[5] * ly + e[9] * lz + e[13], z = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
      const a = Math.floor(x / H), c = Math.floor(z / H);
      for (let p = a - 2; p <= a + 2; p++) for (let q = c - 2; q <= c + 2; q++) for (const i of G.get(p + ',' + q) || []) {
        const j = (i + 1) % N, vx = t.px[j] - t.px[i], vz = t.pz[j] - t.pz[i];
        const u = Math.max(0, Math.min(1, ((x - t.px[i]) * vx + (z - t.pz[i]) * vz) / (vx * vx + vz * vz || 1)));
        const d = Math.hypot(x - t.px[i] - vx * u, z - t.pz[i] - vz * u), gap = d - t.wAt(i);
        if (y < t.hy[i] - 0.3 || gap > 5) continue;
        min = Math.min(min, gap);
        if (gap <= M) { n++; const s = Math.round(i * t.ds / 10) * 10, w = worst.get(s); if (!w || gap < w.gap) worst.set(s, { gap: +gap.toFixed(2), d: +d.toFixed(2), w: +t.wAt(i).toFixed(2), h: +(y - t.hy[i]).toFixed(1) }); }
      }
    }
    return { verts: P.count, n, min: Number.isFinite(min) ? +min.toFixed(2) : null, at: [...worst].slice(0, 8).map(([s, w]) => 's=' + s + ' ' + JSON.stringify(w)) };
  }, [id, MARGIN, fb]);
}

const T = checker('landmark off the asphalt');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', camera: 'chase' });
  for (const id of IDS) {
    const test = await page.evaluate((id) => { const d = Core.TRACKS.find(d => d.id === id); return !d ? 'missing' : d.test || d.pending ? 'frozen' : ''; }, id);
    if (test) { console.log(`--  ${id}: ${test}, not checked`); continue; }
    await startTrack(page, id);
    const r = await measure(page, id, false);
    if (r.err) { T.check(id, false, r.err); continue; }
    T.check(`${id}: no vertex of the landmark within half width + ${MARGIN} m of the centre line`, r.n === 0,
      `${r.verts} vertices, closest ${r.min === null ? 'over 5 m' : r.min + ' m'} beyond the road's edge` + (r.n ? `; ${r.n} on the asphalt: ${r.at.join('; ')}` : ''));
  }
  T.check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  // the fallback: the models' files never come (as on a slow or broken connection)
  const { page: p2 } = await openGame(browser, srv.base + '/index.html', { quality: 'high', camera: 'chase' });
  await p2.evaluate(() => { const f = window.fetch; window.fetch = (u, ...a) => /assets\/landmarks\//.test(String(u)) ? Promise.reject(new Error('held back')) : f(u, ...a); });
  for (const id of IDS) {
    if (await page.evaluate((id) => { const d = Core.TRACKS.find(d => d.id === id); return !d || d.test || d.pending; }, id)) continue;
    await startTrack(p2, id);
    const r = await measure(p2, id, true);
    if (r.err) { console.log(`--  ${id} fallback: ${r.err}, not checked`); continue; }
    T.check(`${id} fallback: off the asphalt`, r.n === 0, `${r.verts} vertices, closest ${r.min === null ? 'over 5 m' : r.min + ' m'} beyond the road's edge` + (r.n ? `; ${r.n} on the asphalt: ${r.at.join('; ')}` : ''));
  }
} finally {
  await browser.close(); srv.close();
}
T.done();
