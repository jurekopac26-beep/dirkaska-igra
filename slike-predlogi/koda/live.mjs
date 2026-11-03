// node live.mjs <game dir> <job dir> (PRE="$(cat pre-stack.js)" before it: each mesh keeps its creation stack in userData.__st, the merging off) : the new map loaded once in <game dir>'s game, then runs the job lists dropped into <job dir>/q<N>.json
// (an array of steps), writes <job dir>/q<N>.done (log) and the shots <job dir>/<name>.png; STILL=1: no frame loop of the game between the jobs (else the idle page burns ~2 cores). Steps:
//   {vp: [w, h]} window size · {reload: true} load the page and the new map again · {probe: 'js'} prints the value
//   {name, top: [cx, cz, span]} from above (the far cells on, as koda/posnetki.mjs)
//   {name, chase: [x, z, hd]} the chase camera placed by hand (as posnetki.mjs: far cells on)
//   {name, game: [x, z, hd]} the game's own chase camera (Render.frame 'chase', nothing forced: what a player sees)
//   {name, cam: {p: [x, y, z], t: [x, y, z], fov}} a free camera (far cells on)
import fs from 'fs';
import path from 'path';
const GAME = path.resolve(process.argv[2]), JD = path.resolve(process.argv[3]);
process.env.GAME_ROOT = GAME;
const { serve, launch, openGame } = await import(GAME + '/tests/browser/lib.mjs');
fs.mkdirSync(JD, { recursive: true });
const srv = await serve(GAME), browser = await launch();
const W = +(process.env.W || 1500), H = +(process.env.H || 900);
const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, intro: 2, quali: 0, camera: 'chase' }, { width: W, height: H }, { menu: true });
let LOG = [];
const say = (s) => { LOG.push(s); console.log(s); };
page.on('pageerror', e => say('PAGEERROR ' + String(e).slice(0, 300)));
const HELP = () => {
  // rays straight down at (x, z): every mesh hit (no filter by visible), top first
  window.__rays = (x, z, all) => {
    const rc = new THREE.Raycaster(new THREE.Vector3(x, 500, z), new THREE.Vector3(0, -1, 0), 0, 1000); rc.firstHitOnly = false;
    const out = []; const sc = Render.scene; sc.updateMatrixWorld(true);
    const vis = (o) => { let q = o; while (q) { if (!q.visible) return false; q = q.parent; } return true; };
    const hits = rc.intersectObject(sc, true);
    for (const h of hits) { const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material; if (!all && !vis(o)) continue;
      out.push({ y: +h.point.y.toFixed(3), name: o.name || '-', par: (o.parent && o.parent.name) || '-', type: o.type, mat: m && m.type, col: m && m.color ? m.color.getHexString() : '', vc: !!(m && m.vertexColors), tr: !!(m && m.transparent), op: m && m.opacity, po: m && m.polygonOffset ? [m.polygonOffsetFactor, m.polygonOffsetUnits] : 0, ro: o.renderOrder, vis: vis(o), dw: m && m.depthWrite, ud: Object.keys(o.userData || {}).join(','), mud: Object.keys((m && m.userData) || {}).join(','), face: h.faceIndex, st: (() => { let q = o; while (q && !q.userData.__st) q = q.parent; return q ? q.userData.__st : ''; })() }); }
    return out; };
};
const ready = async () => {
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 300000 });
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 900000, polling: 500 });
  await page.addStyleTag({ content: '#hud, #s-pause, .screen, #nvm, #menu-host { display: none !important; }' });
  await page.evaluate(HELP);
  // (idle: no frame loop of the game, the shots draw their own frames: the page does not burn the CPU between jobs)
  if (process.env.STILL) await page.evaluate(() => { const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (f) => window.__rafStop ? 0 : o(f); window.__rafStop = true; });
};
let t0 = Date.now(); await ready(); say('READY ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
const shot = (s) => page.evaluate((s) => {
  const g = __game, P = g.race.player; g.pause && g.pause();
  const allOn = () => { if (Render.setDetailDist) Render.setDetailDist(1e5); };
  const farOn = () => { if (Render.world.cullFog) for (const c of Render.world.cullFog) c.visible = true; };
  if (s.top) {
    const [cx, cz, span] = s.top, fov = 60, h = span / 2 / Math.tan(fov / 2 * Math.PI / 180);
    Render.camera.far = Math.max(Render.camera.far, h * 2);
    Render.setShot({ px: cx, py: h, pz: cz + 0.01, tx: cx, ty: 0, tz: cz, fov, fogD: Math.max(h, 600), gy: 0 }); allOn();
    for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); farOn(); Render.frame(1 / 60, 1, P, 'tv', {}); return 'top';
  }
  if (s.cam) {
    Render.camera.far = Math.max(Render.camera.far, 2000);
    Render.setShot({ px: s.cam.p[0], py: s.cam.p[1], pz: s.cam.p[2], tx: s.cam.t[0], ty: s.cam.t[1], tz: s.cam.t[2], fov: s.cam.fov || 50, fogD: 600, gy: 0, near: 0.5 }); allOn();
    for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); farOn(); Render.frame(1 / 60, 1, P, 'tv', {}); return 'cam';
  }
  if (s.chase) {
    const [x, z, hd] = s.chase, gy0 = __H3.ground(x, z); P.place(x, z, hd); P.vx = P.vz = 0; P.y = P.py = P.roadY = gy0;
    const portrait = innerHeight > innerWidth, D = (portrait ? 46 : 30) * 1.4, pitch = (portrait ? 0.98 : 0.9) * 0.7, a0 = portrait ? 13 : 8.5, fov = portrait ? 58 : 46;
    const fx = Math.cos(hd), fz = Math.sin(hd), tx = x + fx * a0, tz = z + fz * a0;
    Render.camera.far = Math.max(Render.camera.far, 2000);
    Render.setShot({ px: tx - fx * D * Math.cos(pitch), py: gy0 + D * Math.sin(pitch), pz: tz - fz * D * Math.cos(pitch), tx, ty: gy0, tz, fov, fogD: 600, gy: 0, near: 1 }); allOn();
    for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); farOn(); Render.frame(1 / 60, 1, P, 'tv', {}); return 'chase';
  }
  if (s.game) {
    const [x, z, hd] = s.game; Render.setShot(null); P.place(x, z, hd); P.vx = P.vz = 0; g.sim(0.2, true); Render.resetCam();
    for (let k = 0; k < 12; k++) Render.frame(1 / 60, 1, P, 'chase', {}); return 'game';
  }
  return 'unknown';
}, s);
const run = async (list) => {
  for (const s of list) {
    if (s.reload) { const t1 = Date.now(); await page.reload({ timeout: 240000, waitUntil: 'domcontentloaded' }); await ready(); say('RELOAD ' + ((Date.now() - t1) / 1000).toFixed(0) + 's'); continue; }
    if (s.probe) { const t1 = Date.now(); let r; try { r = await page.evaluate(s.probe); } catch (e) { r = 'THROW ' + String(e).slice(0, 400); } say('PROBE ' + (typeof r === 'string' ? r : JSON.stringify(r)).slice(0, 20000) + '  (' + ((Date.now() - t1) / 1000).toFixed(1) + 's)'); continue; }
    if (s.vp) { await page.setViewportSize({ width: s.vp[0], height: s.vp[1] }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(700); say('VP ' + s.vp.join('x')); continue; }
    const t2 = Date.now(); let r; try { r = await shot(s); } catch (e) { r = 'THROW ' + String(e).slice(0, 300); }
    await page.screenshot({ path: `${JD}/${s.name}.png`, timeout: 240000 }); say('SHOT ' + s.name + ' ' + r + ' ' + ((Date.now() - t2) / 1000).toFixed(1) + 's');
  }
};
for (;;) {
  const qs = fs.readdirSync(JD).filter(f => /^q\d+\.json$/.test(f) && !fs.existsSync(JD + '/' + f.replace('.json', '.done'))).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  if (!qs.length) { await new Promise(r => setTimeout(r, 400)); continue; }
  const f = qs[0]; LOG = []; const t1 = Date.now(); let quit = false;
  try { const L = JSON.parse(fs.readFileSync(JD + '/' + f, 'utf8')); if (L.quit) quit = true; else await run(L); } catch (e) { say('FAIL ' + String(e && e.stack || e).slice(0, 600)); }
  say('DONE ' + ((Date.now() - t1) / 1000).toFixed(0) + 's' + (errors.length ? ' errors: ' + errors.slice(-3).join(' | ').slice(0, 400) : ''));
  fs.writeFileSync(JD + '/' + f.replace('.json', '.done'), LOG.join('\n') + '\n');
  if (quit) break;
}
await ctx.close(); await browser.close(); await srv.close();
