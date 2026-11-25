// Realizem, kamera za avtom, skupina 4 (js/world-realizem4.js; docs/realizem.md): Bâlea, Katu-Jaryk and Los Caracoles keep their own builders
// and pass through the wrapper (World.stats.kamera4). The contact shade at the foot of walls (aoWorld, js/world.js) is not laid at the foot of
// the terrain's own steep faces (World.ground: the tiles, Katu's cuts), which the chase camera saw as rows of dark steps on a smooth slope
// (docs/proge/katu.md: »brez stopnic«); the walls, rocks and posts keep theirs. In the rain Los Caracoles' ground and verges darken by a fifth
// with the wet road (world.dyn.wet, render.js applyRoad), as Katu's and Bâlea's do, and are as light as before when it dries.
//   node tests/browser/realizem4.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Realizem, kamera za avtom, skupina 4: Bâlea, Katu-Jaryk, Los Caracoles');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase' });
  // (at least this many strips taken off: Katu 864, Bâlea 94 when this was written)
  for (const [id, least] of [['katu', 500], ['balea', 50], ['caracoles', 0]]) {
    await startTrack(page, id);
    const r = await page.evaluate(() => {
      const W = Render.world, k4 = W.stats && W.stats.kamera4, key = (x, z) => Math.round(Math.fround(x) * 100) + ',' + Math.round(Math.fround(z) * 100);
      const feet = new Set(), V = new Float64Array(9);
      if (W.ground) { W.ground.updateMatrixWorld(true); W.ground.traverse(m => {
        const P = m.isMesh && !m.isInstancedMesh && m.geometry && m.geometry.attributes.position; if (!P) return;
        const A = P.array, I = m.geometry.index ? m.geometry.index.array : null, nt = I ? I.length / 3 : P.count / 3, M = m.matrixWorld.elements;
        for (let t = 0; t < nt; t++) {
          for (let q = 0; q < 3; q++) { const j = (I ? I[t * 3 + q] : t * 3 + q) * 3, x = A[j], y = A[j + 1], z = A[j + 2];
            V[q * 3] = M[0] * x + M[4] * y + M[8] * z + M[12]; V[q * 3 + 1] = M[1] * x + M[5] * y + M[9] * z + M[13]; V[q * 3 + 2] = M[2] * x + M[6] * y + M[10] * z + M[14]; }
          const ux = V[3] - V[0], uy = V[4] - V[1], uz = V[5] - V[2], vx = V[6] - V[0], vy = V[7] - V[1], vz = V[8] - V[2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, h2 = nx * nx + nz * nz;
          if (h2 < 1e-18 || ny * ny > 0.0625 * h2) continue;
          let lo = 0, mid = 1, hi = 2; if (V[4] < V[1]) { lo = 1; mid = 0; } if (V[hi * 3 + 1] < V[mid * 3 + 1]) { const r = hi; hi = mid; mid = r; if (V[mid * 3 + 1] < V[lo * 3 + 1]) { const r2 = mid; mid = lo; lo = r2; } }
          feet.add(key(V[lo * 3], V[lo * 3 + 2]) + '|' + key(V[mid * 3], V[mid * 3 + 2]));
        } }); }
      let quads = 0, onGround = 0, meshes = 0;
      W.root.traverse(m => { if (m.name !== 'ao' || !m.geometry || !m.geometry.index) return; meshes++;
        const P = m.geometry.attributes.position.array, I = m.geometry.index.array;
        for (let i = 0; i + 5 < I.length; i += 6) { const n = I[i]; quads++; if (feet.has(key(P[n * 3], P[n * 3 + 2]) + '|' + key(P[n * 3 + 3], P[n * 3 + 5]))) onGround++; } });
      return { k4: k4 || null, ground: !!W.ground, quads, onGround, meshes };
    });
    T.check(`${id}: through the wrapper (World.stats.kamera4) and its ground found`, !!r.k4 && r.ground, JSON.stringify(r.k4));
    T.check(`${id}: no contact shade at the foot of the terrain's own steep faces`, r.onGround === 0, `${r.onGround} of ${r.quads} strips`);
    T.check(`${id}: the shade taken off there (at least ${least}), the walls and rocks keep theirs`, !!r.k4 && r.k4.aoGround >= least && r.k4.aoQuads - r.k4.aoGround === r.quads && r.quads > 300,
      r.k4 ? `${r.k4.aoGround} taken off, ${r.quads} kept in ${r.meshes} cells` : 'no kamera4');
    if (id !== 'caracoles') continue;
    const w = await page.evaluate(async () => {
      const g = window.__game, W = Render.world, D = W.dyn.wet, frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), mats = new Set();
      W.ground.traverse(o => { if (o.isMesh) mats.add(o.material); });
      const grit = World.api.vrGritTex(); W.root.traverse(o => { if (o.isMesh && o.material.map === grit) mats.add(o.material); });
      const L = [...mats], k = () => L.map(m => m.userData.dry ? +(m.color.r / m.userData.dry.r).toFixed(3) : -1);
      let roadShown = false; W.root.traverse(o => { if (o.material === (D && D.road)) roadShown = true; });
      g.race.setRain(0); await frame(); await frame(); const dry0 = k();
      g.race.setRain(1); await frame(); await frame(); const wet = k();
      g.race.setRain(0); await frame(); await frame();
      return { has: !!D, n: L.length, roadShown, dry0, wet, dry1: k() };
    });
    T.check('caracoles: in the rain its ground and verges darken by a fifth (as on Katu and Bâlea), and are as light as before when dry',
      w.has && !w.roadShown && w.n >= 2 && [...w.dry0, ...w.dry1].every(v => v === 1) && w.wet.every(v => v === 0.8), JSON.stringify(w));
  }
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
