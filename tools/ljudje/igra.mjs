// Ljudje ob progi v igri (js/world-ljudje.js): avto pelje mimo prizorov s kamero za avtom (telefon ležeče ali pokonci) in posname sličice
// na izbranih razdaljah pred prizorom (pred prihodom, ko ga zaslišijo, ko tečejo, ob ograji, mimo); rumena lupa (_zoom) je povečava ljudi iz
// iste kamere. Slike in povzetek v test-results/ljudje/igra/.
//   node tools/ljudje/igra.mjs <proga> [prizor,…] [--v 30] [--pri 90,55,32,14,-6] [--pokonci] [--nizka] [--brez-lupe]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, REPO } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), id = args[0];
if (!id) { console.log('node tools/ljudje/igra.mjs <proga> [prizor,…] [--v 30] [--pri 90,55,32,14,-6] [--pokonci] [--nizka] [--brez-lupe]'); process.exit(2); }
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = args[1] && !args[1].startsWith('--') ? args[1].split(',') : null;
const v = +(flag('--v') || 30), marks = (flag('--pri') || '90,55,32,14,-6').split(',').map(Number), portrait = args.includes('--pokonci'), low = args.includes('--nizka'), zoom = !args.includes('--brez-lupe');
const OUT = path.join(REPO, 'test-results', 'ljudje', 'igra'); fs.mkdirSync(OUT, { recursive: true });
const png = (file, src) => fs.writeFileSync(file, Buffer.from(src.split(',')[1], 'base64'));
const SIZE = portrait ? { width: 390, height: 844 } : { width: 844, height: 390 };

const srv = await serve(REPO);
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: low ? 'low' : 'high' }, SIZE, { seed: 11 });
  const t0 = Date.now();
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  try { await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 }); }
  catch (e) { console.log('igra se ni naložila:', errors.slice(0, 8)); throw e; }
  const info = await page.evaluate(() => { const g = window.__game; g.pause(); Render.resize(); const st = Render.world.peopleStats; return st ? { scenes: st.scenes, people: st.people, verts: st.verts, propVerts: st.propVerts, cleared: st.cleared } : null; });
  console.log(id, 'naloženo v', Math.round((Date.now() - t0) / 1000), 's', JSON.stringify(info));
  if (!info) process.exit(0);
  for (const sc of info.scenes) {
    if (only && !only.includes(sc.name)) continue;
    const shots = await page.evaluate(async ([name, v, marks, zoom]) => {
      const g = window.__game, R = g.race, T = R.track, P = R.player, W = Render.world.peopleW, Sc = W.scenes.find(x => x.name === name);
      const hide = () => { for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; } };
      const place = (s) => { const i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0; P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q); };
      let s = Sc.s0 - 230, dt = 1 / 30; place(s); Render.setShot(null); Render.resetCam();
      Sc.arm = true; Sc.al = Sc.pass = Sc.back = -1; for (const p of Sc.people.concat(Sc.pets)) { p.segs = null; p.up = 0; p.sig = null; }   // (the scene as before any car came)
      for (let k = 0; k < 20; k++) { hide(); Render.frame(dt, 1, P, 'chase', {}); }
      const out = [], want = marks.slice().sort((a, b) => b - a);
      while (want.length) {
        s += v * dt; place(s); hide(); Render.frame(dt, 1, P, 'chase', {});
        const da = Sc.s0 - s; if (da > want[0]) continue; want.shift();
        const c = Render.snapshot(P, 'chase', 1280), r = { da: Math.round(da), src: c.toDataURL('image/png'), on: Sc.on, al: Sc.al >= 0 };
        if (zoom) {   // the people's centre seen from the same camera, narrowed down
          const cp = Render.camera.position.clone(), ctr = new THREE.Vector3(); let n = 0, rad = 0;
          for (const p of Sc.people) { ctr.add(p.P.root.position); n++; } ctr.multiplyScalar(1 / Math.max(1, n)); ctr.y += 1;
          for (const p of Sc.people) rad = Math.max(rad, Math.hypot(p.P.root.position.x - ctr.x, p.P.root.position.z - ctr.z));
          const D = cp.distanceTo(ctr), half = Math.max(3.2, (rad + 1.6) / 1.55), fov = Math.max(4, Math.min(28, 2 * Math.atan(half / D) * 180 / Math.PI));
          Render.setShot({ px: cp.x, py: cp.y, pz: cp.z, tx: ctr.x, ty: ctr.y, tz: ctr.z, fov, fogD: D });
          const z = Render.snapshot(P, 'chase', 900); r.zoom = z.toDataURL('image/png'); Render.setShot(null);
          Render.frame(0, 1, P, 'chase', {});
        }
        out.push(r);
      }
      return out;
    }, [sc.name, v, marks, zoom]);
    for (const r of shots) { const f = `${id}-${sc.name}-${r.da}${portrait ? '-p' : ''}`; png(path.join(OUT, f + '.png'), r.src); if (r.zoom) png(path.join(OUT, f + '_zoom.png'), r.zoom); }
    console.log(sc.name, shots.map(r => `${r.da} m (${r.al ? 'opozorjeni' : 'delajo'})`).join(', '), Math.round((Date.now() - t0) / 1000) + ' s');
  }
  if (errors.length) console.log('napake:', errors.slice(0, 8));
} finally { await browser.close(); await srv.close(); }
