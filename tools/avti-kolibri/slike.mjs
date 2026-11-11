// Pictures of a car for the theme »avti na raven KOLIBRIJA« (docs/avti-kolibri.md, the pilot: TIGER GT, MEDVED 4x4, SUPERKOMBI): one
// version of the game per run, each scenario of tools/avti-kolibri/scenariji.json a PNG and a JSON with what was drawn. Two kinds:
//   salon  the showroom's car with a camera of its own (Render.carShot: det 'high' the computer's Visoki; cut: parts taken off)
//   spa    on Spa, Belgija (a real track, CLAUDE.md), the car on the ideal line at m metres after the start, the others hidden, the game
//          held still; trki: the knocks ([share of damage, u (+1 nose, -1 tail), w (-1 left, +1 right)], Core.applyDamage), the loose
//          parts left to fall; praske: another car's grazes along a flank ([u, w]); nov: 1 Razbijanje · nov način on, else the defaults; kamera: null the chase camera (the phone's view), or { yaw, pitch, dist, fov } round the car (the photo
//          mode's camera, Render.setShot; yaw 0 from behind, pi from the front, + towards the car's left); izrez: [w, h, dx, dy] cut round the
//          car, okno: [x0, y0, w, h] a window in shares of the picture. The phone upright (zaslon [360, 640]) shows the car some 25 px
//          wide, so each phone picture comes twice: as the phone shows it, and the same view through a long lens (tele: { fov, zaslon,
//          side }: from the chase camera's own place, the car alone)
//   node tools/avti-kolibri/slike.mjs <out-dir> [--root <a copy of the game>] [--samo <name,name>] [--scenariji <file>]
// Before / after: run it on a copy of main (git archive, as tools/shot.mjs --pred) and on the working tree, then
// tools/avti-kolibri/sestavi.py puts the pairs side by side (left ZDAJ, right POTEM).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..', '..');
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const root = path.resolve(flag('--root') || process.env.GAME_ROOT || REPO), only = (flag('--samo') || '').split(',').filter(Boolean), file = path.resolve(flag('--scenariji') || path.join(HERE, 'scenariji.json'));
const out = args[0] ? path.resolve(args[0]) : null;
if (!out) { console.log('usage: node tools/avti-kolibri/slike.mjs <out-dir> [--root <folder>] [--samo <name,…>] [--scenariji <file>]'); process.exit(2); }
const { serve, launch, openGame } = await import(url.pathToFileURL(path.join(root, 'tests', 'browser', 'lib.mjs')).href);   // (the version's own helpers: its settings' defaults)
const list = JSON.parse(fs.readFileSync(file, 'utf8')).filter(s => !only.length || only.includes(s.ime));
fs.mkdirSync(out, { recursive: true });
const save = (name, src, info) => { fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(src.split(',')[1], 'base64')); fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(info)); console.log('wrote', name, JSON.stringify(info).slice(0, 260)); };

const srv = await serve(root), browser = await launch();
let bad = 0;
try {
  for (const s of list) {
    const det = s.det || 'normal', X = s.nov ? { xBody: 1, xGlass: 1, xPaint: 1, xParts: 1 } : {};
    const set = Object.assign({ quality: 'high', shadows: 1, camera: 'chase', damage: 2, weather: 'dry', tod: 'day', season: 'summer', carDet: det }, X);
    const view = s.zaslon ? { width: s.zaslon[0], height: s.zaslon[1] } : { width: 960, height: 540 };
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', set, view, { seed: 11 });
    try {
      if (s.vrsta === 'salon') {
        await page.evaluate(async () => { window.__game.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });
        const src = await page.evaluate((o) => { const c = Render.carShot(o); return c ? c.toDataURL('image/png') : null; }, { id: s.avto, color: s.barva != null ? s.barva : 0xc0392b, cut: s.cut, cam: s.cam, w: s.w || 1280, h: s.h || 720, grid: false });
        if (!src) { console.log('no picture', s.ime); bad++; continue; }
        save(s.ime, src, { ime: s.ime, avto: s.avto, det });
      } else {
        await page.goto(srv.base + '/index.html?' + new URLSearchParams({ proga: 'spa', t: '0.5', avto: s.avto }));
        await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
        // 1. the car in its place, knocked, the loose parts down, the others hidden; the chase camera's place kept (window.__sl)
        const st = await page.evaluate(async (s) => {
          const g = window.__game, R = g.race, T = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
          if (!R || T.def.id !== 'spa' || P.m.id !== s.avto) return { err: 'no race on spa with ' + s.avto };
          g.pause(); Render.resize();
          const still = (sec) => { for (let k = 0; k < sec * 120; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); } };
          const i = T.idx((((T.startS + s.m) % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
          P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
          P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
          still(0.5); R.repairCar(P);
          Render.resetCam(); for (let k = 0; k < 6; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
          for (const h of s.trki || []) { Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); Render.frame(0.016, 1, P, 'chase', {}); still(0.25); Render.frame(0.05, 1, P, 'chase', {}); }
          // (praske: grazes of another car along a flank, [u (+1 nose, -1 tail), w (-1 left, +1 right)]: its contact point there, as the core
          // leaves it; tests/browser/kolibri.test.mjs)
          for (const q of s.praske || []) { for (let f = 0; f < 2; f++) { const ch = Math.cos(P.h), sh = Math.sin(P.h), lx = q[0] * P.m.len / 2, lz = q[1] * P.m.wid / 2;
            P.fxCar = 3; P.contactX = P.x + ch * lx - sh * lz; P.contactZ = P.z + sh * lx + ch * lz; Render.frame(0.05, 1, P, 'chase', {}); } still(0.5); }
          if ((s.trki || []).length) still(2);   // (the loose parts down on the road)
          for (let k = 0; k < 12; k++) Render.frame(0.05, 1, P, 'chase', {});
          for (const c of R.cars) if (c !== P) { const v = Render.viewOf(c); if (v) v.grp.visible = false; }
          const cp = Render.camera.position; window.__sl = { cam: [cp.x, cp.y, cp.z] };
          return {};
        }, s);
        if (st.err) { console.log('FAIL', s.ime, st.err); bad++; continue; }
        if (s.tele) await page.setViewportSize({ width: s.tele.zaslon[0], height: s.tele.zaslon[1] });
        // 2. the picture: the chase camera's own (the phone's view), the same view through a long lens (tele: from the chase camera's
        // place, the car alone), or a camera round the car (kamera: the photo mode's)
        const r = await page.evaluate(async (s) => {
          const g = window.__game, P = g.race.player, raf = () => new Promise(r => requestAnimationFrame(r)), cy = (P.y || 0) + (s.sredina != null ? s.sredina : 0.6);
          Render.resize();
          if (s.tele) { const [px, py, pz] = window.__sl.cam; Render.setShot({ px, py, pz, tx: P.x, ty: cy, tz: P.z, fov: s.tele.fov, fogD: Math.hypot(px - P.x, py - cy, pz - P.z), near: 4 }); }
          else if (s.kamera) { const K = s.kamera, a = P.h + Math.PI + (K.yaw || 0), cp = Math.cos(K.pitch || 0.2), ty = (P.y || 0) + (K.ty != null ? K.ty : 0.7), d = K.dist || 6;
            Render.setShot({ px: P.x + Math.cos(a) * cp * d, pz: P.z + Math.sin(a) * cp * d, py: ty + Math.sin(K.pitch || 0.2) * d, tx: P.x, ty, tz: P.z, fov: K.fov || 32, fogD: 90, floor: true, near: 0.3 }); }
          if (s.tele || s.kamera) for (let k = 0; k < 3; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
          Render.clearSparks();
          const c = Render.snapshot(P, 'chase', (s.tele && s.tele.side) || s.side || 1280), W = c.width, H = c.height;
          const p = new THREE.Vector3(P.x, cy, P.z).project(Render.camera), cx = (p.x + 1) / 2 * W, cyp = (1 - p.y) / 2 * H;
          if (s.tele || s.kamera) Render.setShot(null);
          let k = c; const z = s.izrez, o = s.okno;   // (izrez: [w, h, dx, dy] round the car; okno: [x0, y0, w, h] shares of the picture)
          if (z || o) { const w = Math.round(o ? o[2] * W : Math.min(z[0], W)), h = Math.round(o ? o[3] * H : Math.min(z[1], H)), x0 = Math.round(o ? o[0] * W : Math.max(0, Math.min(W - w, cx - w / 2 + (z[2] || 0)))), y0 = Math.round(o ? o[1] * H : Math.max(0, Math.min(H - h, cyp - h / 2 + (z[3] || 0))));
            k = document.createElement('canvas'); k.width = w; k.height = h; k.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h); }
          const me = Render.crashInfo().cars.find(q => q.player), v = Render.viewOf(P), lost = Object.keys(P.lost || {}).filter(n => P.lost[n]);
          return { src: k.toDataURL('image/png'), info: { ime: s.ime, avto: s.avto, size: [W, H], car: [Math.round(cx), Math.round(cyp)], dmg: +P.dmg.toFixed(3), lost, xt: me && me.xt ? { panes: me.xt.panes, lamps: me.xt.lamps, dead: me.xt.dead, ajar: me.xt.ajar } : null,
            key: v.body.material.customProgramCacheKey ? v.body.material.customProgramCacheKey() : null, ver: g.ver } };
        }, s);
        save(s.ime, r.src, Object.assign(r.info, { det, nov: !!s.nov }));
      }
      if (errors.length) { console.log('ERRORS', s.ime, errors.slice(0, 4).join(' | ')); bad++; }
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); await srv.close(); }
process.exit(bad ? 1 : 0);
