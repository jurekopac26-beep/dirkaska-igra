// Prispevki skupin k risanju (kamera za avtom): T=<id> node tests/browser/prispevki.mjs — klici in tisoč oglišč v vidnem polju po datoteki, ki je mrežo dodala (povprečje 6 mest kot perf.test.mjs; brez senčnega prehoda)
import { serve, launch, openGame, startTrack } from './lib.mjs';
const id = process.env.T || 'pikesg';
const srv = await serve(); const browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4 }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {
    const O = THREE.Object3D.prototype, add = O.add;
    O.add = function (...a) { const st = new Error().stack.split('\n'); let src = '?';
      const fs_ = []; for (const l of st) { const m = l.match(/js\/([\w-]+)\.js/); if (m) fs_.push(m[1]); }
      src = fs_.find(f => /^world-(chase|realizem|dolina)/.test(f) && f !== 'world-chase-bt6') || fs_.find(f => /^world-/.test(f)) || fs_[0] || '?';
      for (const c of a) if (c && !c.userData.src) c.userData.src = src; return add.apply(this, a); };
  });
  await startTrack(page, id);
  const r = await page.evaluate(async () => {
    if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
    const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.onAction('restart'); g.pause(); g.race.lch = null; for (const c of g.race.cars) c.lch = null; g.race.player.kt = null;
    const P = g.race.player, tot = {};
    for (let k = 0; k < 6; k++) {
      const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
      Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const cam = Render.camera || Render.cam; const fr = new THREE.Frustum(); cam.updateMatrixWorld();
      fr.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
      Render.scene.traverseVisible(o => { if (!o.isMesh && !o.isPoints && !o.isLine) return; const gm = o.geometry; if (!gm) return;
        if (o.frustumCulled !== false) { if (!gm.boundingSphere) gm.computeBoundingSphere(); const s = gm.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(s)) return; }
        let src = '?', p = o; while (p) { if (p.userData && p.userData.src && p.userData.src !== '?') { src = p.userData.src; break; } p = p.parent; }
        const n = (gm.index ? gm.index.count : gm.attributes.position.count) * (o.isInstancedMesh ? o.count : 1);
        const t = tot[src] || (tot[src] = { c: 0, v: 0 }); t.c += 1; t.v += n; });
    }
    for (const k in tot) { tot[k].c = +(tot[k].c / 6).toFixed(1); tot[k].v = Math.round(tot[k].v / 6000); }
    return tot;
  });
  console.log(JSON.stringify(Object.entries(r).sort((a, b) => b[1].v - a[1].v)));
} finally { await browser.close(); await srv.close(); }
