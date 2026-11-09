// izris: Killar at m metres after the start: the chase camera's picture (as tools/shot.mjs takes it), a side view and a low view along
// the road through the free camera (Render.setShot, the photo mode's), and the road meshes' vertex counts. Nothing is written to the repo.
//   node --import file://<scratch>/izris-pw.mjs <scratch>/izris-foto.mjs <out folder> <tag> [m=900] [stats]
// IZRIS_BUMPS='[{at,h,w},…]' adds bumps to js/tracks/killar.js in memory (izris-pw-hooks.mjs)
import fs from 'node:fs';
import path from 'node:path';
const REPO = new URL('../..', import.meta.url).pathname;
const { serve, launch, openGame } = await import(REPO + '/tests/browser/lib.mjs');
const out = process.argv[2], tag = process.argv[3] || 'a', m = +(process.argv[4] || 900), wantStats = process.argv[5] === 'stats';
fs.mkdirSync(out, { recursive: true });
const t0 = Date.now();
const browser = await launch();
const srv = await serve(REPO);
try {
  const SIZE = { width: 640, height: 360 };
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, SIZE, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=killar&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  const r = await page.evaluate(async ([m, side, wantStats]) => {
    const g = window.__game, R = g.race, T = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
    g.pause(); Render.resize();
    const s = Math.min(T.startS + m, T.finishS - 1), i = T.idx(s), off = T.rl ? T.rl[i] : 0;
    const still = (sec) => { for (let k = 0; k < sec * 120; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); } };
    P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
    P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
    still(0.5);
    const hid = R.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(v => v && v.grp.visible);
    const png = (c) => { const k = document.createElement('canvas'); k.width = side.width; k.height = side.height; k.getContext('2d').drawImage(c, 0, 0, k.width, k.height); return k.toDataURL('image/png'); };
    const shoot = async (shot) => {
      Render.setShot(shot || null); Render.resetCam();
      for (let k = 0; k < 6; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
      for (const v of hid) v.grp.visible = false;
      const c = Render.snapshot(P, 'chase', Math.max(side.width, side.height));
      for (const v of hid) v.grp.visible = true;
      return png(c);
    };
    const res = { s: P.q.s - T.startS, y: P.y, hy: T.hy[i], grade: T.grade[i] };
    res.chase = await shoot(null);
    // the side view: the camera 26 m out on the valley side (side -1), 0.9 m over the road, looking across the road 31 m ahead of the car
    const j = T.idx(s + 31), at = (k, o, y) => ({ x: T.px[k] + T.nx[k] * o, y: T.hy[k] + y, z: T.pz[k] + T.nz[k] * o });
    const cs = at(j, -26, 0.9), ts = at(j, 0, 0.2);
    res.side = await shoot({ px: cs.x, py: cs.y, pz: cs.z, tx: ts.x, ty: ts.y, tz: ts.z, fov: 50, fogD: 200, near: 0.3, sky: true, noCut: true });
    // the low view along the road: 1.3 m over the road 4 m behind the car, looking 40 m ahead
    const cl = at(T.idx(s - 6), 2.2, 1.3), tl = at(T.idx(s + 40), 0, 0.2);
    res.low = await shoot({ px: cl.x, py: cl.y, pz: cl.z, tx: tl.x, ty: tl.y, tz: tl.z, fov: 46, fogD: 200, near: 0.3, sky: true, noCut: true });
    Render.setShot(null); Render.resetCam();
    // the heights the bumps gave: T.hy against the mean of its neighbours 12 m away (the bumps stand out of the smooth road)
    res.prof = []; for (let k = T.idx(s - 10); k <= T.idx(s + 60); k++) res.prof.push([+(k * T.ds - T.startS).toFixed(1), +T.hy[k].toFixed(3), +T.grade[k].toFixed(4)]);
    if (wantStats) {
      const by = new Map(); let all = 0, meshes = 0;
      Render.scene.traverse(o => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
        const n = o.geometry.attributes.position.count * (o.isInstancedMesh ? o.count : 1); all += n; meshes++;
        const mt = Array.isArray(o.material) ? o.material[0] : o.material;
        const key = mt.uuid; let e = by.get(key);
        if (!e) by.set(key, e = { type: mt.type, bump: mt.bumpScale != null && mt.bumpMap ? mt.bumpScale : null, vc: !!mt.vertexColors, map: mt.map ? (mt.map.image ? (mt.map.image.width + 'x' + mt.map.image.height) : 'map') : null, n: 0, verts: 0, cast: 0, recv: 0, counts: {} });
        e.n++; e.verts += n; if (o.castShadow) e.cast++; if (o.receiveShadow) e.recv++; e.counts[n] = (e.counts[n] || 0) + 1;
      });
      res.stats = { all, meshes, top: [...by.values()].sort((a, b) => b.verts - a.verts).slice(0, 14).map(e => Object.assign(e, { counts: Object.entries(e.counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => n + '×' + c).join(' ') })) };
    }
    return res;
  }, [m, SIZE, wantStats]);
  for (const k of ['chase', 'side', 'low']) fs.writeFileSync(path.join(out, `izris-${tag}-${k}.png`), Buffer.from(r[k].split(',')[1], 'base64'));
  delete r.chase; delete r.side; delete r.low;
  fs.writeFileSync(path.join(out, `izris-${tag}.json`), JSON.stringify(r, null, 1));
  console.log(`${tag}: s=${r.s.toFixed(1)} y=${r.y.toFixed(3)} hy=${r.hy.toFixed(3)} errors=${errors.length} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (errors.length) console.log(errors.slice(0, 5).join('\n'));
  if (r.stats) { console.log('scene verts', r.stats.all, 'meshes', r.stats.meshes); for (const e of r.stats.top) console.log(JSON.stringify(e)); }
  await ctx.close();
} finally { await srv.close(); await browser.close(); }
