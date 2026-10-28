// node live.mjs : one game kept open; runs the lists dropped into live/q<N>.mjs (default export {tag, list}), writes live/q<N>.done
import { serve, launch, openGame } from '/home/user/dirkaska-igra/tests/browser/lib.mjs';
import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/', LD = SP + 'live/';
const W = +(process.env.W || 900), H = +(process.env.H || 600);
const srv = await serve(), browser = await launch();
const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'iso', intro: 2, quali: 0 }, { width: W, height: H }, { menu: true });
let LOG = [];
const say = (s) => { LOG.push(s); console.log(s); };
page.on('console', m => { if (m.type() === 'error' || /Error/.test(m.text())) say('CONSOLE ' + m.text().slice(0, 300)); });
page.on('pageerror', e => say('PAGEERROR ' + String(e).slice(0, 300)));
const ready = async () => {
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 300000 });
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 600000, polling: 500 });
  await page.addStyleTag({ content: '#hud, #s-pause, .screen, #nvm, #menu-host { display: none !important; }' });
};
let t0 = Date.now(); await ready(); say('READY ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
const run = async (tag, list) => {
  for (const s of list) {
    if (s.reload) { const t1 = Date.now(); await page.setViewportSize({ width: W, height: H }); await page.reload({ timeout: 240000, waitUntil: 'domcontentloaded' }); await ready(); say('RELOAD ' + ((Date.now() - t1) / 1000).toFixed(0) + 's'); continue; }
    if (s.probe) { const t1 = Date.now(); let r; try { r = await page.evaluate(s.probe); } catch (e) { r = 'THROW ' + String(e).slice(0, 400); } say('PROBE ' + String(r).slice(0, 4000) + '  (' + ((Date.now() - t1) / 1000).toFixed(1) + 's)'); continue; }
    if (s.viewport) { await page.setViewportSize({ width: s.viewport[0], height: s.viewport[1] }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); Render.resize && Render.resize(); }); await page.waitForTimeout(800); say('VIEWPORT ' + s.viewport.join('x')); continue; }
    const r = await page.evaluate((s) => { const g = __game, P = g.race.player; g.pause && g.pause();
      if (s.kind === 'cam') { Render.camera.far = Math.max(Render.camera.far, 2000); Render.setShot({ px: s.p[0], py: s.p[1], pz: s.p[2], tx: s.t[0], ty: s.t[1], tz: s.t[2], fov: s.fov || 50, fogD: 400, gy: 0, near: s.near }); if (Render.setDetailDist) Render.setDetailDist(1e5); for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); return 'cam'; }
      if (s.kind === 'top') { const fov = 60, h = s.span / 2 / Math.tan(fov / 2 * Math.PI / 180); Render.camera.far = Math.max(Render.camera.far, h * 2); Render.setShot({ px: s.cx, py: h + (s.y || 0), pz: s.cz + 0.01, tx: s.cx, ty: s.y || 0, tz: s.cz, fov, fogD: Math.max(h, 600), gy: 0 }); if (Render.setDetailDist) Render.setDetailDist(1e5); for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); if (Render.world.cullFog) for (const c of Render.world.cullFog) c.visible = true; Render.frame(1 / 60, 1, P, 'tv', {}); if (Render.world.cullFog) for (const c of Render.world.cullFog) c.visible = true; return 'top'; }
      return 'unknown'; }, s);
    await page.screenshot({ path: `${SP}sh-${tag}-${s.name}.png`, timeout: 180000 }); say(s.name + ' ' + JSON.stringify(r));
  }
};
for (;;) {
  const qs = fs.readdirSync(LD).filter(f => /^q\d+\.mjs$/.test(f) && !fs.existsSync(LD + f.replace('.mjs', '.done'))).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  if (!qs.length) { await new Promise(r => setTimeout(r, 400)); continue; }
  const f = qs[0]; LOG = []; const t1 = Date.now();
  try { const m = (await import(LD + f + '?t=' + Date.now())).default; if (m.quit) { fs.writeFileSync(LD + f.replace('.mjs', '.done'), 'QUIT\n'); break; } await run(m.tag || 'lv', m.list); } catch (e) { say('FAIL ' + String(e && e.stack || e).slice(0, 800)); }
  say('DONE ' + ((Date.now() - t1) / 1000).toFixed(0) + 's');
  fs.writeFileSync(LD + f.replace('.mjs', '.done'), LOG.join('\n') + '\n');
}
await ctx.close(); await browser.close(); await srv.close();
