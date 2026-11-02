// Predlogi »Ljudje ob progi« (docs/ljudje-predlogi.md): izris v pravi igri. Slike v test-results/ljudje/.
//   node predlogi.mjs explore <proga> <s1,s2,…> [--side ±1] [--crowd]   posnetki iz kamere za avtom na teh metrih (s od štarta) + seznam imen
//   node predlogi.mjs scene <ime,…>                                     prizori iz prizori.js: 4 sličice vsak (od blizu, pred, bliža, mimo)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame, REPO } from '../../tests/browser/lib.mjs';

const DIR = path.dirname(url.fileURLToPath(import.meta.url)), OUT = path.join(REPO, 'test-results', 'ljudje', 'izris');
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2), mode = args[0];
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const png = (file, src) => fs.writeFileSync(file, Buffer.from(src.split(',')[1], 'base64'));
const SIZE = { width: 960, height: 540 };

const srv = await serve(REPO);
const browser = await launch();
let page, errors;
async function openTrack(id) {
  if (!page) ({ page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' }, SIZE, { seed: 11 }));
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.addScriptTag({ path: DIR + '/ljudje3d.js' });
  await page.addScriptTag({ path: DIR + '/prizori.js' });
  await page.evaluate(() => {   // helpers: put the car at s (metres from the start, on the ideal line), the chase camera's picture, the screen position of world points
    const g = window.__game; g.pause(); Render.resize();
    window.SH = {
      carAt(s, lane) { const R = g.race, T = R.track, P = R.player, i = T.idx(((s % T.len) + T.len) % T.len), off = lane != null ? lane : (T.rl ? T.rl[i] : 0);
        P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
        P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
        for (let k = 0; k < 40; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); }
        for (const c of R.cars) if (c !== P) { const v = Render.viewOf(c); if (v) v.grp.visible = false; } },
      shot(o) {   // o: null -> the chase camera; or a TV shot { px, py, pz, tx, ty, tz, fov }
        const P = g.race.player; Render.setShot(o ? Object.assign({ fogD: 30 }, o) : null); if (!o) Render.resetCam();
        for (let k = 0; k < 8; k++) Render.frame(1 / 60, 1, P, 'chase', {});
        for (const c of g.race.cars) if (c !== P) { const v = Render.viewOf(c); if (v) v.grp.visible = false; }
        const pts = (window.SH.track || []).map(p => { const v = new THREE.Vector3(p[0], p[1], p[2]).project(Render.camera); return [(v.x + 1) / 2, (1 - v.y) / 2, v.z < 1 ? 1 : 0]; });
        const c = Render.snapshot(P, 'chase', 1280);
        return { src: c.toDataURL('image/png'), pts };
      },
    };
  });
}

try {
  if (mode === 'explore') {
    const id = args[1], list = (args[2] || '').split(',').filter(Boolean).map(Number), crowd = args.includes('--crowd');
    await openTrack(id);
    const info = await page.evaluate(() => { const T = window.__game.race.track; return { len: T.len, startS: T.startS, open: !!T.open, names: T.names.map(q => [q.n, Math.round(q.d)]), pit: T.def.pit ? JSON.stringify(T.def.pit).slice(0, 300) : null }; });
    console.log(JSON.stringify(info));
    for (const m of list) {
      const r = await page.evaluate(([m, crowd]) => { LJ.hideCrowd(!crowd); const T = window.__game.race.track; SH.carAt(T.startS + m); return SH.shot(null); }, [m, crowd]);
      png(`${OUT}/x-${id}-${m}.png`, r.src);
    }
    console.log('explore done');
  } else if (mode === 'probe') {   // probe <track> <s0> <s1> <step>: where a scene fits (straight before it, the barrier close, flat ground beyond it)
    const id = args[1], s0 = +args[2], s1 = +args[3], st = +(args[4] || 20);
    await openTrack(id);
    const rows = await page.evaluate(([s0, s1, st]) => {
      const T = window.__game.race.track, gH = Render.world.groundH, out = [];
      for (let m = s0; m <= s1; m += st) {
        const s = T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len);
        let kmax = 0; for (let d = -110; d <= 20; d += 4) { const j = T.idx((((s + d) % T.len) + T.len) % T.len); kmax = Math.max(kmax, Math.abs(T.k ? T.k[j] : 0)); }
        const sl = (side) => { const F = LJ.frame(s, side); let lo = 1e9, hi = -1e9; for (const [a, b] of [[-8, 2], [8, 2], [-8, 12], [8, 12], [0, 7]]) { const y = F.y(a, b); lo = Math.min(lo, y); hi = Math.max(hi, y); } return +(hi - lo).toFixed(1); };
        out.push([m, +T.bl[i].toFixed(1), +T.br[i].toFixed(1), Math.round(1 / Math.max(kmax, 1e-4)), PR.roomSide(s), sl(-1), sl(1)]);
      }
      return out;
    }, [s0, s1, st]);
    console.log('m bl br minR(m,-110..+20) room slopeL slopeR');
    for (const r of rows) console.log(r.join(' '));
  } else if (mode === 'scene') {
    const names = args[1].split(',');
    const defs = JSON.parse(fs.readFileSync(DIR + '/prizori-proge.json', 'utf8'));
    const t0 = Date.now();
    let cur = null;
    for (const name of names) {
      const id = defs[name]; if (!id) { console.log('unknown scene', name); continue; }
      if (cur !== id) { await openTrack(id); cur = id; }
      const n = await page.evaluate((name) => PR.build(name), name);
      console.log(name, 'built', JSON.stringify(n));
      for (const ph of ['blizu', 'zacetek', 'bliza', 'mimo']) {
        const r = await page.evaluate(([name, ph]) => PR.phase(name, ph), [name, ph]);
        png(`${OUT}/${name}-${ph}.png`, r.src);
        if (r.zoom) png(`${OUT}/${name}-${ph}-zoom.png`, r.zoom.src);
        fs.writeFileSync(`${OUT}/${name}-${ph}.json`, JSON.stringify({ pts: r.pts, info: r.info, zoom: r.zoom ? { fov: r.zoom.fov, fovMain: r.zoom.fovMain, pts: r.zoom.pts } : null }));
      }
      await page.evaluate((name) => PR.clear(name), name);
      console.log(name, 'done', Math.round((Date.now() - t0) / 1000) + ' s');
    }
  }
  if (errors && errors.length) console.log('errors:', errors.slice(0, 6));
} finally { await browser.close(); await srv.close(); }
