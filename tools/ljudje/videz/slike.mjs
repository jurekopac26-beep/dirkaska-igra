// Videz ljudi (docs/ljudje-grafika.md): ista mesta na progi s kamero za avtom, za slike prej/potem. Orodje riše kodo iz delovne mape: za »prej«
// ga poženi na main (npr. v git worktree), za »potem« na veji, obakrat z istimi možnostmi (isti vrstni red posnetkov: pot avta spremeni klice
// risanja gneče za 1-3). Za vsak posnetek: sličica s kamere za avtom (1280 px), lupa (povečava iz iste kamere), klici risanja in oglišča v tej
// sličici (vse podaje, kot perf.test.mjs), oglišča ljudi. Izid: test-results/ljudje/videz/<oznaka>/ (sestavi.py iz dveh oznak naredi sliko).
//   node tools/ljudje/videz/slike.mjs <proga> <oznaka> [--prizori zar,boksi@70] [--pri 45,15] [--gneca 950:1,6450:-1] [--film 0.25]
//   --film k: pri vsaki razdalji še dve lupi k in 2k sekund pozneje (gibanje v treh sličicah)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, REPO } from '../../../tests/browser/lib.mjs';

const args = process.argv.slice(2), id = args[0], videz = args[1];
if (!id || !videz) { console.log('node tools/ljudje/videz/slike.mjs <proga> <oznaka> [--prizori a,b@m] [--pri 45,15] [--gneca s:stran,…] [--film 0.25]'); process.exit(2); }
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const prizori = (flag('--prizori') || '').split(',').filter(Boolean), marks = (flag('--pri') || '45,15').split(',').map(Number);
const gneca = (flag('--gneca') || '').split(',').filter(Boolean).map(x => x.split(':').map(Number)), film = +(flag('--film') || 0);
const OUT = path.join(REPO, 'test-results', 'ljudje', 'videz', videz); fs.mkdirSync(OUT, { recursive: true });
const png = (file, src) => fs.writeFileSync(file, Buffer.from(src.split(',')[1], 'base64'));

const srv = await serve(REPO);
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' }, { width: 844, height: 390 }, { seed: 11 });
  await page.addInitScript(() => {   // the draw calls and vertices of every pass (as tests/browser/perf.test.mjs)
    window.__gl = { calls: 0, verts: 0 };
    const hook = () => { const c = document.querySelector('canvas'); if (!c) return false; const gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return false;
      const P = Object.getPrototypeOf(gl); if (P.__lj) return true; P.__lj = true;
      const wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); return true; };
    window.__glHook = hook;
  });
  const t0 = Date.now();
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  try { await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 }); }
  catch (e) { console.log('igra se ni naložila:', errors.slice(0, 8)); throw e; }
  const info = await page.evaluate(() => {
    const g = window.__game; g.pause(); Render.resize(); window.__glHook();
    const st = Render.world.peopleStats, W = Render.world.peopleW, per = {};
    if (W) for (const Sc of W.scenes) for (const p of Sc.people) { const o = p.P.o || {}, k = o.lite ? 'tribuna' : o.kid ? 'otrok' : 'oseba'; (per[k] || (per[k] = [])).push(p.P.nv); }
    let crowdN = 0, geoV = 0; Render.scene.traverse(m => { if (m.isInstancedMesh && m.name === 'crowd') { crowdN += m.count; geoV = m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; } });
    return { scenes: st ? st.scenes.map(s => ({ name: s.name, at: s.at, side: s.side, s: s.s, people: s.people, verts: s.verts })) : [], people: st ? st.people : 0, verts: st ? st.verts : 0,
      perPerson: Object.fromEntries(Object.entries(per).map(([k, a]) => [k, { n: a.length, avg: Math.round(a.reduce((x, y) => x + y, 0) / a.length) }])), crowd: { n: crowdN, vertsPerFigure: geoV } };
  });
  console.log(id, videz, 'naloženo v', Math.round((Date.now() - t0) / 1000), 's', JSON.stringify({ people: info.people, verts: info.verts, perPerson: info.perPerson, crowd: info.crowd }));
  const shots = [];
  // one way past a place: the car from 230 m before it at v m/s, a picture at each mark (metres before the place), a loupe on the group
  const drive = async (key, spec) => page.evaluate(async ([spec, marks, film]) => {
    const g = window.__game, R = g.race, T = R.track, P = R.player, W = Render.world.peopleW;
    let Sc = null, ctrOf;
    if (spec.scene) {
      Sc = W.scenes.find(x => x.name === spec.scene && (spec.at == null || Math.round(x.s0) === spec.s0));
      if (!Sc) return { err: 'ni prizora ' + spec.scene };
      ctrOf = () => { const c = new THREE.Vector3(); let n = 0, rad = 0; for (const p of Sc.people) { c.add(p.P.root.position); n++; } c.multiplyScalar(1 / Math.max(1, n)); c.y += 1;
        for (const p of Sc.people) rad = Math.max(rad, Math.hypot(p.P.root.position.x - c.x, p.P.root.position.z - c.z)); return { c, rad }; };
    } else {   // a crowd's figures near (s, side): their instances' places
      const pts = []; const e = new THREE.Matrix4(), v = new THREE.Vector3();
      Render.scene.traverse(m => { if (m.isInstancedMesh && m.name === 'crowd') for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, e); v.setFromMatrixPosition(e).applyMatrix4(m.matrixWorld); pts.push([v.x, v.y, v.z]); } });
      const near = pts.filter(([x, , z]) => { const q = T.query(x, z, -1); if (!q) return false; let ds = q.s - spec.s; if (!T.open) ds -= T.len * Math.round(ds / T.len);
        const i = T.idx(((q.s % T.len) + T.len) % T.len), sd = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(ds) < 30 && Math.sign(sd) === spec.side && Math.abs(sd) < 40; });
      if (!near.length) return { err: 'ni gledalcev pri ' + spec.s };
      const c = new THREE.Vector3(); for (const p of near) c.add(new THREE.Vector3(p[0], p[1], p[2])); c.multiplyScalar(1 / near.length); c.y += 1;
      let rad = 0; for (const p of near) rad = Math.max(rad, Math.hypot(p[0] - c.x, p[2] - c.z));
      ctrOf = () => ({ c, rad: Math.min(rad, 6) });
    }
    const s0 = Sc ? Sc.s0 : spec.s;
    const hide = () => { for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; } };
    const place = (s) => { const i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0; P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q); };
    let s = s0 - 230; const dt = 1 / 30, v = 30; place(s); Render.setShot(null); Render.resetCam();
    if (Sc) { Sc.arm = true; Sc.al = Sc.pass = Sc.back = -1; for (const p of Sc.people.concat(Sc.pets)) { p.segs = null; p.up = 0; p.sig = null; } }
    for (let k = 0; k < 20; k++) { hide(); Render.frame(dt, 1, P, 'chase', {}); }
    const out = [], want = marks.slice().sort((a, b) => b - a);
    const loupe = (r, ctr, tag) => {
      const cp = Render.camera.position.clone(), D = cp.distanceTo(ctr.c), half = Math.max(1.7, (ctr.rad + 1.0) / 1.9), fov = Math.max(3, Math.min(28, 2 * Math.atan(half / D) * 180 / Math.PI));
      Render.setShot({ px: cp.x, py: cp.y, pz: cp.z, tx: ctr.c.x, ty: ctr.c.y, tz: ctr.c.z, fov, fogD: D });
      const z = Render.snapshot(P, 'chase', 900); r[tag] = z.toDataURL('image/png'); Render.setShot(null); Render.frame(0, 1, P, 'chase', {}); return fov;
    };
    while (want.length) {
      s += v * dt; place(s); hide(); Render.frame(dt, 1, P, 'chase', {});
      const da = s0 - s; if (da > want[0]) continue; want.shift();
      window.__gl.calls = 0; window.__gl.verts = 0; Render.frame(0, 1, P, 'chase', {}); const gl = { calls: window.__gl.calls, verts: window.__gl.verts };
      const c = Render.snapshot(P, 'chase', 1280), ctr = ctrOf(), ndc = ctr.c.clone().project(Render.camera);
      const r = { da: Math.round(da), src: c.toDataURL('image/png'), gl, fovMain: Render.camera.fov, at: [(ndc.x + 1) / 2, (1 - ndc.y) / 2], al: Sc ? Sc.al >= 0 : null };
      r.fov = loupe(r, ctr, 'zoom');
      if (film) for (const k of [1, 2]) { const n = Math.round(film / dt); for (let j = 0; j < n; j++) { hide(); Render.frame(dt, 1, P, 'chase', {}); } loupe(r, ctrOf(), 'film' + k); }
      out.push(r);
    }
    return { out };
  }, [spec, marks, film]);
  for (const p of prizori) {
    const [name, at] = p.split('@'), sc = info.scenes.find(x => x.name === name && (at == null || x.at === +at));
    if (!sc) { console.log('ni prizora', p); continue; }
    const r = await drive(p, { scene: name, at: at == null ? null : +at, s0: sc.s });
    if (r.err) { console.log(r.err); continue; }
    for (const x of r.out) { const f = `${id}-${name}${at ? '@' + at : ''}-${x.da}`; png(path.join(OUT, f + '.png'), x.src); png(path.join(OUT, f + '_zoom.png'), x.zoom);
      for (const k of ['film1', 'film2']) if (x[k]) png(path.join(OUT, f + '_' + k + '.png'), x[k]);
      shots.push({ f, kind: 'prizor', name, da: x.da, gl: x.gl, at: x.at, fov: x.fov, fovMain: x.fovMain, al: x.al }); }
    console.log(p, r.out.map(x => `${x.da} m: ${x.gl.calls} klicev, ${Math.round(x.gl.verts / 1000)}k oglišč`).join('; '), Math.round((Date.now() - t0) / 1000) + ' s');
  }
  for (const [s, side] of gneca) {
    const r = await drive('g' + s, { s, side });
    if (r.err) { console.log(r.err); continue; }
    for (const x of r.out) { const f = `${id}-gneca${s}${side > 0 ? 'D' : 'L'}-${x.da}`; png(path.join(OUT, f + '.png'), x.src); png(path.join(OUT, f + '_zoom.png'), x.zoom);
      for (const k of ['film1', 'film2']) if (x[k]) png(path.join(OUT, f + '_' + k + '.png'), x[k]);
      shots.push({ f, kind: 'gneca', s, side, da: x.da, gl: x.gl, at: x.at, fov: x.fov, fovMain: x.fovMain }); }
    console.log('gneča', s, side, r.out.map(x => `${x.da} m: ${x.gl.calls} klicev, ${Math.round(x.gl.verts / 1000)}k oglišč`).join('; '), Math.round((Date.now() - t0) / 1000) + ' s');
  }
  const SF = path.join(OUT, 'stats.json'), all = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {};
  const old = all[id] && all[id].shots || []; const keep = old.filter(o => !shots.some(n => n.f === o.f));
  all[id] = { people: info.people, verts: info.verts, perPerson: info.perPerson, crowd: info.crowd, shots: keep.concat(shots) };
  fs.writeFileSync(SF, JSON.stringify(all, null, 1));
  if (errors.length) console.log('napake:', errors.slice(0, 8));
} finally { await browser.close(); await srv.close(); }
