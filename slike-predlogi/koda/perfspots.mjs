// per-spot draw work of the new map, by mesh: node perfspots.mjs <repo dir> <out.json>
import fs from 'fs';
const REPO = process.argv[2], OUT = process.argv[3];
const { serve, launch, openGame } = await import(REPO + '/tests/browser/lib.mjs');
const srv = await serve(), browser = await launch();
try {
  const { ctx, page } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345, menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 120000 });
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 600000, polling: 500 });
  const r = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, H3 = window.__H3; g.pause();
    const st = (k) => { const f = NVMenu.floors().find(q => q.key === k); return { x: f.x, z: f.z, h: f.h }; }, a0 = MK.at(0);
    const places = [{ x: H3.home.x, z: H3.home.z, h: H3.home.h }, { x: a0.x, z: a0.z, h: 0 }, st('school'), st('circuit'), st('home'), st('police'), st('multi'),
      { x: 40, z: 20, h: 0 }, { x: 20, z: 120, h: -1.6 }, { x: -205, z: -105, h: 0 }, { x: -272, z: -216, h: 0 }, { x: 300, z: -250, h: 1.6 }];
    let acc = null; const sig = new Map(); Render.scene.updateMatrixWorld(true);
    Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const gg = o.geometry; if (!gg.boundingBox) gg.computeBoundingBox(); const b = gg.boundingBox.clone().applyMatrix4(o.matrixWorld); const m = Array.isArray(o.material) ? o.material[0] : o.material;
      const key = (o.name || '-') + '|' + m.type.replace('Material', '') + (m.transparent ? 'T' : '') + '|' + [b.min.x, b.max.x, b.min.z, b.max.z].map(q => Math.round(q / 4) * 4).join(',');
      const n = o.isInstancedMesh ? (gg.index ? gg.index.count : gg.attributes.position.count) * o.count : (gg.index ? gg.index.count : gg.attributes.position.count);
      const prev = o.onAfterRender; o.onAfterRender = function (...a) { if (acc) acc[key] = (acc[key] || 0) + n; if (prev) prev.apply(this, a); }; });
    const out = [];
    for (const p of places) { P.place(p.x, p.z, p.h); P.vx = P.vz = 0; g.sim(0.2, true); Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, 'chase', {}); acc = {}; Render.frame(1 / 60, 1, P, 'chase', {}); out.push(acc); acc = null; }
    return out; });
  fs.writeFileSync(OUT, JSON.stringify(r)); console.log('ok', r.length);
  await ctx.close();
} finally { await browser.close(); srv.close(); }
