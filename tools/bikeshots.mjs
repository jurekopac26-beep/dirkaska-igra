// Pictures of a motorcycle (phys.bike) in a race, as the two cameras of the game see it: the chase camera (the phone upright) and the
// isometric one (the phone on its side), on the straight and leaning through corners (the autopilot drives); each also from close by
// (-close: 6 m behind it).
//   node tools/bikeshots.mjs [id] [track]      (default: kanja on jezero; the pictures in test-results/bikeshots/)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const id = process.argv[2] || 'kanja', trk = process.argv[3] || 'jezero', OUT = path.join(ROOT, 'test-results', 'bikeshots');
fs.mkdirSync(OUT, { recursive: true });
const srv = await serve(ROOT);
const browser = await launch();
try {
  for (const [cam, vp] of [['chase', { width: 390, height: 844 }], ['iso', { width: 844, height: 390 }]]) {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: cam, zoom: 1.4, damage: 2, weather: 'dry' }, vp, { seed: 7 });
    await page.evaluate((id) => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === id); }, id);
    await startTrack(page, trk);
    // the autopilot drives; a picture every 1.5 s of race time, the one with the most lean kept as the corner's
    const shots = await page.evaluate(async (cam) => {
      const g = window.__game, raf = () => new Promise(r => requestAnimationFrame(r)), P = g.race.player, out = [];
      g.pause(); for (let k = 0; k < 12 && (g.race.state !== 'racing' || g.race.time < 4); k++) { g.sim(1, true); await raf(); }
      for (let n = 0; n < 16; n++) {
        g.sim(1.5, true); for (let k = 0; k < 10; k++) { g.resume(); await raf(); g.pause(); }
        const v = Render.viewOf(P), sp = Math.hypot(P.vx, P.vz), ch = sp > 1 ? P.vx / sp : Math.cos(P.h), sh = sp > 1 ? P.vz / sp : Math.sin(P.h), y = P.y || 0;
        // (and a close look: from 6 m behind it along its travel and 2.6 m over it, the other bikes hidden)
        const hid = g.race.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(w => w && w.grp.visible); for (const w of hid) w.grp.visible = false;
        Render.setShot({ px: P.x - ch * 6, py: y + 2.6, pz: P.z - sh * 6, tx: P.x, ty: y + 0.5, tz: P.z, fov: 52, fogD: 90, near: 0.3 });
        const close = Render.snapshot(P, 'chase', 900).toDataURL('image/png'); Render.setShot(null); for (const w of hid) w.grp.visible = true;
        out.push({ lean: v.lean || 0, v: P.speed * 3.6, src: Render.snapshot(P, cam, 900).toDataURL('image/png'), close });
      }
      return out;
    }, cam);
    const straight = shots.reduce((a, b) => Math.abs(b.lean) < Math.abs(a.lean) ? b : a), bend = shots.reduce((a, b) => Math.abs(b.lean) > Math.abs(a.lean) ? b : a);
    for (const [name, s] of [['straight', straight], ['lean', bend]]) {
      const f = path.join(OUT, `${id}-${trk}-${cam}-${name}.png`); fs.writeFileSync(f, Buffer.from(s.src.split(',')[1], 'base64'));
      fs.writeFileSync(f.replace(/\.png$/, '-close.png'), Buffer.from(s.close.split(',')[1], 'base64'));
      console.log(`${path.relative(ROOT, f)}: lean ${(s.lean * 180 / Math.PI).toFixed(0)} deg at ${s.v.toFixed(0)} km/h`);
    }
    if (errors.length) console.log('errors: ' + errors.slice(0, 5).join(' | '));
    await page.context().close();
  }
} finally { await browser.close(); srv.close(); }
