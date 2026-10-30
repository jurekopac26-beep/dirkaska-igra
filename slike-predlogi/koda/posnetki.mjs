// node posnetki.mjs <repo> <seznam.json> <predpona> : posnetki nove mape iz kopije igre <repo> (veja seje ali čist origin/main)
// seznam: {vp: [w, h]} velikost okna, {probe: 'koda'} izpiše rezultat, {name, top: [cx, cz, span]} od zgoraj, {name, chase: [x, z, smer]} za avtom
// PRE='koda' se izvede pred vstopom v novo mapo (npr. izklop združevanja za primerjavo)
import fs from 'fs';
import path from 'path';
const REPO = path.resolve(process.argv[2]), list = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), OUT = process.argv[4];
const { serve, launch, openGame } = await import(REPO + '/tests/browser/lib.mjs');
const srv = await serve(), browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, intro: 2, quali: 0 }, { width: 915, height: 412 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 120000 });
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 600000, polling: 500 });
  await page.addStyleTag({ content: '#hud, #s-pause, .screen, #nvm, #menu-host { display: none !important; }' });
  for (const s of list) {
    if (s.probe) { const r = await page.evaluate(s.probe); console.log('PROBE', typeof r === 'string' ? r : JSON.stringify(r)); continue; }
    if (s.vp) { await page.setViewportSize({ width: s.vp[0], height: s.vp[1] }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(600); continue; }
    await page.evaluate((s) => {
      const g = __game, P = g.race.player; g.pause && g.pause();
      if (s.top) {
        const [cx, cz, span] = s.top, fov = 60, h = span / 2 / Math.tan(fov / 2 * Math.PI / 180);
        Render.camera.far = Math.max(Render.camera.far, h * 2);
        Render.setShot({ px: cx, py: h, pz: cz + 0.01, tx: cx, ty: 0, tz: cz, fov, fogD: Math.max(h, 600), gy: 0 });
      } else {
        // (the chase camera's framing of the game, placed by hand so the shot does not depend on the car's last frames)
        const [x, z, hd] = s.chase, gy0 = __H3.ground(x, z); P.place(x, z, hd); P.vx = P.vz = 0; P.y = P.py = P.roadY = gy0;
        const portrait = innerHeight > innerWidth, D = (portrait ? 46 : 30) * 1.4, pitch = (portrait ? 0.98 : 0.9) * 0.7, a0 = portrait ? 13 : 8.5, fov = portrait ? 58 : 46;
        const fx = Math.cos(hd), fz = Math.sin(hd), tx = x + fx * a0, tz = z + fz * a0;
        Render.camera.far = Math.max(Render.camera.far, 2000);
        Render.setShot({ px: tx - fx * D * Math.cos(pitch), py: gy0 + D * Math.sin(pitch), pz: tz - fz * D * Math.cos(pitch), tx, ty: gy0, tz, fov, fogD: 600, gy: 0, near: 1 });
      }
      if (Render.setDetailDist) Render.setDetailDist(1e5);
      for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {});
      // (the baked far cells are hidden past the fog; from high above everything should show)
      if (Render.world.cullFog) for (const c of Render.world.cullFog) c.visible = true;
      Render.frame(1 / 60, 1, P, 'tv', {});
    }, s);
    await page.screenshot({ path: `${OUT}${s.name}.png`, timeout: 240000 }); console.log('shot', s.name);
  }
  console.log('errors', errors.slice(0, 4).join(' | '));
  await ctx.close();
} finally { await browser.close(); srv.close(); }
