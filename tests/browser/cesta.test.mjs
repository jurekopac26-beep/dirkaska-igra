// The road's look (js/world-cesta.js; Realizem E0, the first piece: docs/realizem.md »E0, prvi kos«). On the real tracks named in
// World.cesta.PROGE the road's meshes and the lines' meshes take a copy of the builder's material with the wear in its shader (streaks, dust
// by the edges, stretches of newer asphalt, an open road's oil strips and wheel tracks, drips where the cars brake; worn paint): Spa (a
// circuit) and Tianmen (an open road) take it, every road mesh and the lines; the same world built without it has as many meshes and
// vertices (no draw call and no vertex more), and the picture from the chase camera changes only with the wear's strengths (the same frame
// twice is the same picture); Livorno's centre line by the country's rules (World.cesta.crte: Italy, white, dashes and solid before the
// bends); every track of PROGE is in the game and its country in the table of markings; a track not in PROGE is built as before (Jezero);
// on NIZKA the programs compile too; no errors.
//   node tests/browser/cesta.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the road\'s look');
const srv = await serve();
const browser = await launch();
// the world on screen: what took the look (the world's own count, and counted here), the road's material against the builder's
const look = (page) => page.evaluate(() => {
  const W = Render.world, A = W.asphaltMat, R = W.cestaMat || null, r = { cesta: W.cesta || null, meshes: 0, verts: 0, road: 0, paint: 0, paintV: 0, plain: 0, roadMats: 0 }, rm = new Set();
  W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; r.meshes++; r.verts += o.geometry.attributes.position.count; const m = o.material; if (!m || Array.isArray(m)) return;
    if (m.userData.cesta === 'asfalt') { r.road++; rm.add(m); } else if (m.userData.cesta === 'barva') { r.paint++; r.paintV += o.geometry.attributes.position.count; } else if (m === A) r.plain++; });
  r.roadMats = rm.size;
  if (R) { const U = R.userData.ceU, P = U.uCeP.value.image, N = U.uCeN.value.image;
    r.mat = { lambert: !!R.isMeshLambertMaterial, map: R.map === A.map, vc: R.vertexColors === A.vertexColors, col: R.color.getHex() === (A.userData.dry || A.color).getHex() || R.color.getHex() === A.color.getHex(), own: R !== A, only: rm.size === 1 && rm.has(R),
      profil: [P.width, P.height], sum: [N.width, N.height], dirka: U.uCeA.value.y, prah: U.uCeA.value.z, olje: U.uCeA.value.w, len: Math.round(1 / U.uCeA.value.x) === Math.round(window.__game.race.track.len) }; }
  return r;
});
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  const tab = await page.evaluate(() => { const C = World.cesta, ids = Object.keys(C.PROGE), by = new Map(Core.TRACKS.map(d => [d.id, d]));
    return { ids, missing: ids.filter(id => !by.has(id)), noCountry: ids.filter(id => by.has(id) && !C.CRTE[by.get(id).name.slice(by.get(id).name.lastIndexOf(',') + 1).trim()]),
      kinds: ids.filter(id => !['dirka', 'cesta'].includes(C.PROGE[id].vrsta)) }; });
  T.check('the tracks that take the look are in the game, each a circuit or an open road, its country in the table of markings',
    tab.ids.length >= 11 && !tab.missing.length && !tab.noCountry.length && !tab.kinds.length, JSON.stringify(tab));

  await startTrack(page, 'spa');
  const spa = await look(page);
  T.check('Spa: the road\'s meshes and the lines\' take the look (the world\'s count is what is in the world)',
    spa.cesta && spa.cesta.id === 'spa' && spa.cesta.asfalt >= 10 && spa.cesta.barva >= 10 && spa.road === spa.cesta.asfalt && spa.paint === spa.cesta.barva, JSON.stringify(spa));
  T.check('Spa: one road material, a copy of the builder\'s (its texture, its colours), a circuit\'s; the lap\'s profile 2048 x 1 over its length, the noise 128 x 128',
    spa.mat && spa.mat.lambert && spa.mat.map && spa.mat.vc && spa.mat.own && spa.mat.only && spa.mat.dirka === 1 && spa.mat.olje === 0 && spa.mat.prah > 0 && spa.mat.len && spa.mat.profil.join() === '2048,1' && spa.mat.sum.join() === '128,128', JSON.stringify(spa.mat));
  // the chase camera's picture: the same frame twice, then with the wear's strengths at zero (the road as the builder's), then back
  const pic = await page.evaluate(async () => {
    const g = window.__game, P = g.race.cars[0], W = Render.world, U = W.cestaMat.userData.ceU; g.pause();
    const up = World.update; World.update = (w, t, ...a) => up(w, 100, ...a);   // (the world's clock stopped: its flags, its crowd)
    const shot = () => { const c = Render.snapshot(P, 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 9) n++; return n; };
    try {
      shot(); shot();   // (first, the view settled)
      const a = shot(), b = shot(), keep = ['uCeA', 'uCeB', 'uCeC'].map(k => U[k].value.clone());
      U.uCeA.value.z = 0; U.uCeA.value.w = 0; U.uCeB.value.set(0, 0, 0, 0); U.uCeC.value.w = 0;
      const c = shot();
      ['uCeA', 'uCeB', 'uCeC'].forEach((k, i) => U[k].value.copy(keep[i]));
      const d = shot();
      return { px: a.length / 4, same: diff(a, b), plain: diff(a, c), back: diff(a, d) };
    } finally { World.update = up; }
  });
  T.check('Spa: the wear shows from the chase camera (the picture changes with its strengths, and only with them: the same frame twice the same picture)',
    pic.plain > pic.px * 0.02 && pic.same <= pic.px * 0.002 && pic.back <= pic.px * 0.002, JSON.stringify(pic));

  // a track not in the table is built as before; and Spa without the look (taken out of the table for one build): as many meshes and
  // vertices (no draw call and no vertex more), the builder's material on the road
  const off = await page.evaluate(() => { const C = World.cesta, keep = C.PROGE.spa; delete C.PROGE.spa; return !!keep && (window.__cestaSpa = keep, true); });
  await startTrack(page, 'jezero');
  const jez = await look(page);
  T.check('a track not in the table (Jezero) is built as before: nothing takes the look', jez.cesta === null && jez.road === 0 && jez.paint === 0 && jez.plain > 0, JSON.stringify(jez));
  await startTrack(page, 'spa');
  const spa0 = await look(page);
  await page.evaluate(() => { World.cesta.PROGE.spa = window.__cestaSpa; });
  T.check('Spa built without the look: the same meshes and vertices, the builder\'s material on the road again (the look adds no draw call and no vertex)',
    off && spa0.cesta === null && spa0.road === 0 && spa0.paint === 0 && spa0.meshes === spa.meshes && spa0.verts === spa.verts && spa0.plain === spa.plain + spa.road, JSON.stringify({ spa0, meshes: spa.meshes, verts: spa.verts, plain: spa.plain, road: spa.road }));

  await startTrack(page, 'tianmen');
  const tia = await look(page);
  T.check('Tianmen: an open road\'s look (the lanes\' oil strip), every road mesh and the lines',
    tia.cesta && tia.cesta.asfalt >= 10 && tia.cesta.barva >= 10 && tia.road === tia.cesta.asfalt && tia.mat && tia.mat.dirka === 0 && tia.mat.olje > 0 && tia.mat.only && tia.mat.len, JSON.stringify(tia));

  await startTrack(page, 'livorno');
  const liv = await look(page);
  const cl = await page.evaluate(() => {
    const T = window.__game.race.track, C = World.cesta.crte(T, { r: 140, pred: 40 }), W = Render.world; let dash = 0, solid = 0, iS = -1, iN = -1;
    for (let i = 0; i < T.N; i++) { if (C.at[i] === 1) dash++; else if (C.at[i] === 2) { solid++; if (iS < 0 && i > 50) iS = i; } else if (iN < 0 && i > 50 && C.at[i - 1] === 0 && C.at[i + 1] === 0) iN = i; }
    // a vertex of the lines at the road's middle: on a sample of the solid line, none on a sample in a gap between two dashes
    const at = (i) => { const x = T.px[i] + T.nx[i] * 0.08, z = T.pz[i] + T.nz[i] * 0.08; let hit = 0;
      W.root.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.userData.cesta !== 'barva') return; const P = o.geometry.attributes.position;
        for (let k = 0; k < P.count; k++) if (Math.abs(P.getX(k) - x) < 0.02 && Math.abs(P.getZ(k) - z) < 0.02) hit++; });
      return hit; };
    return { drzava: C.drzava, rob: C.rob, sred: C.sred, dvojna: C.dvojna, crta: C.crta, N: T.N, dash, solid, onSolid: at(iS), inGap: at(iN) };
  });
  T.check('Livorno: the centre line by the country\'s rules (Italy: white, a broken line, one solid line before and through the bends), drawn in the lines\' meshes, worn with them',
    liv.cesta && liv.cesta.barva >= 10 && cl.drzava === 'Italija' && cl.rob === 'bela' && cl.sred === 'bela' && cl.dvojna === false && cl.dash > cl.N * 0.05 && cl.solid > cl.N * 0.2 && cl.onSolid >= 1 && cl.inGap === 0 && liv.paintV > cl.N * 4.5, JSON.stringify({ cl, paintV: liv.paintV, cesta: liv.cesta }));
  T.check('no errors (the road\'s and the paint\'s programs compile)', errors.length === 0, errors.slice(0, 3).join(' | '));

  const low = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(low.page, 'spa');
  const spaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  T.check('NIZKA: the same look (a phone\'s tier), no errors', spaL.cesta && spaL.road === spa.road && spaL.paint === spa.paint && low.errors.length === 0, JSON.stringify(spaL.cesta) + ' ' + low.errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); srv.close();
}
T.done();
