// Prizor živali na pravi progi v igri (js/world-zivali.js, tabela SCENE, World.life): kamera za avtom D metrov pred prizorom in ista kamera,
// zožena na prizor (lupa); slike v test-results/ljudje/zivali/.
//   node tools/ljudje/zivali.mjs <proga>[,<proga>…] [--d 40,24] [--pol 9] [--pokonci] [--let 1.5,3]   (--pol: pol širine lupe v metrih na mestu
//   prizora; vsak prizor proge; --let: štorklja, ki odleti: avto pripelje z 12 m/s, slika toliko sekund po vzletu)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, REPO } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!args[0] || args[0].startsWith('--')) { console.log('node tools/ljudje/zivali.mjs <proga>[,<proga>…] [--d 40,24] [--pol 9] [--pokonci] [--let 1.5,3]'); process.exit(2); }
const ids = args[0].split(','), Ds = flag('--d', '40,24').split(',').map(Number), half = +flag('--pol', 9), portrait = args.includes('--pokonci'), lets = (flag('--let', '') || '').split(',').filter(Boolean).map(Number);
const OUT = path.join(REPO, 'test-results', 'ljudje', 'zivali'); fs.mkdirSync(OUT, { recursive: true });
const png = (f, src) => fs.writeFileSync(f, Buffer.from(src.split(',')[1], 'base64'));
const srv = await serve(REPO), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' },
    portrait ? { width: 390, height: 844 } : { width: 844, height: 390 }, { seed: 11 });
  for (const id of ids) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const res = await page.evaluate(([Ds, half, lets]) => {
      const g = window.__game; g.pause(); Render.resize();
      const R = g.race, T = R.track, P = R.player, st = Render.world.lifeStats; if (!st || !st.scene) return { err: 'ni prizora' };
      const hide = () => { for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; } };
      const place = (s) => { const i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0; P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q); };
      const out = [];
      for (const sc of st.scenes && st.scenes.length ? st.scenes : [st.scene]) for (const D of Ds) {   // (every scene of the track: one, or a list of them)   // (the car drives up to D metres before the scene: the camera settles behind it)
        const s = (T.startS || 0) + sc.m - D; Render.setShot(null); Render.resetCam();
        for (let k = 0; k <= 30; k++) { place(s - 30 + k); hide(); Render.frame(1 / 30, 1, P, 'chase', {}); }
        const r = { D, kind: sc.kind, m: sc.m, src: Render.snapshot(P, 'chase', 1280).toDataURL('image/png') };
        const cp = Render.camera.position.clone(), h = Render.world.groundH ? Render.world.groundH(sc.x, sc.z) : null, ctr = new THREE.Vector3(sc.x, (Number.isFinite(h) ? h : P.y) + 1.5, sc.z), Dd = cp.distanceTo(ctr);
        Render.setShot({ px: cp.x, py: cp.y, pz: cp.z, tx: ctr.x, ty: ctr.y, tz: ctr.z, fov: Math.max(4, Math.min(30, 2 * Math.atan(half / Dd) * 180 / Math.PI)), fogD: Dd });
        r.zoom = Render.snapshot(P, 'chase', 1280).toDataURL('image/png'); Render.setShot(null); Render.frame(0, 1, P, 'chase', {});
        out.push(r);
      }
      // --let: the bird that flies off (World.lifeStep's flyers): the car drives up at 12 m/s from 70 m before it, a picture u seconds after it took off
      const F = lets.length && Render.world.dyn.life && (Render.world.dyn.life.fly || [])[0];
      if (F) { let s = (T.startS || 0) + st.scenes.find(q => q.kind === 'stork').m - 70; Render.setShot(null); Render.resetCam(); const want = lets.slice(); F.st = 0; F.k0 = null;   // (back on its nest: the shots before put the car near it)
        for (let k = 0; k < 900 && want.length; k++) { place(s); hide(); Render.frame(1 / 30, 1, P, 'chase', {}); s += 0.4;
          if (F.st) { const u = k / 30 - F.k0; if (F.k0 == null) F.k0 = k / 30; else if (u >= want[0]) { out.push({ D: 'let' + want.shift(), kind: 'stork', src: Render.snapshot(P, 'chase', 1280).toDataURL('image/png'), zoom: null }); } } } }
      return { scene: st.scenes || st.scene, out };
    }, [Ds, half, lets]);
    if (res.err) { console.log(id, res.err); continue; }
    for (const r of res.out) { const f = `${id}-${r.kind}-${r.D}${portrait ? '-p' : ''}`; png(path.join(OUT, f + '.png'), r.src); if (r.zoom) png(path.join(OUT, f + '_lupa.png'), r.zoom); }
    console.log(id, JSON.stringify(res.scene));
  }
  if (errors.length) console.log('napake:', errors.slice(0, 6));
} finally { await browser.close(); await srv.close(); }
