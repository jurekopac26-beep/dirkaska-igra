// The pits in the rain (Render: pitPuddles in the puddles' mesh, pitDrop, crewMaterial's rain parts, crewRain): on every circuit with pits
// the pits' wet parts of the world (Render.pitWet): a film of water over the apron where the lane runs full width (none on Bathurst, whose
// apron is the road's asphalt and darkens with it), puddles along the lane's edges and on the apron, all on the garages' side of the
// circuit, facing up, on the floor (just over it) and in the open (no roof right over them: none in a garage). Then Bathurst and Spa in a
// race in the rain, the camera behind the car in its box: the pits' parts in the puddles' one mesh (drawn once: no new draw call), the apron
// darker with the film, the rain splashing in the pits, the crews in their rain jackets (no new mesh), the new set waiting on the floor in
// its covers (the old set put down beside it bare). A dry race: none of it (no puddles, no drops in the pits, no jackets, no covers).
//   node tests/browser/pitrain.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the pits in the rain');
const srv = await serve();
const browser = await launch();
const PITS = ['spa', 'rbring', 'bathurst', 'cpalace', 'longford', 'rio', 'montreal', 'newcastle', 'toronto', 'detroit', 'bangsaen', 'townsville', 'troisrivieres'];
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', weather: 'rain' }, { width: 844, height: 390 });
  // 1. every track with pits: the pits' wet parts of its world
  const res = [];
  for (const id of PITS) {
    res.push(await page.evaluate((id) => {
      const def = Core.TRACKS.find(d => d.id === id), Tr = new Core.Track(def), W = Render.buildWorld(Tr, 1), R = Render.pitWet();
      if (!R) return { id, none: true };
      const P = R.pos, A = R.pw, n = P.length / 3, q = {}, o = { id, n, film: 0, pud: 0, lane: 0, apron: 0, side: 0, deep: 0, down: 0, tri: R.idx.length / 3, ap: R.ap, asph: R.asph };
      let h = -1;
      for (let k = 0; k < n; k++) {   // each vertex's place: w past the lane's outer edge (Track.pitAt, measured to the pits' side)
        const x = P[k * 3], z = P[k * 3 + 2], film = A[k * 2 + 1] === 1; Tr.query(x, z, h, q); h = q.a; const p = Tr.pitAt(q.s), w = p ? q.d * p.sd - p.lout : NaN;
        if (film) o.film++; else { o.pud++; if (w < -0.05) o.lane++; else o.apron++; }
        if (!(w > -7.05 && w < R.ap + 0.05)) o.side++;   // (from the lane's inner edge to the apron's back)
        if (film && !(w > -0.05 && w < R.ap - 0.2)) o.deep++; }
      for (let t = 0; t < R.idx.length; t += 3) {   // every triangle facing up
        const [a, b, c] = [R.idx[t], R.idx[t + 1], R.idx[t + 2]].map(i => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        if (u[2] * v[0] - u[0] * v[2] <= 0) o.down++; }
      // a sample of the vertices against the world: the floor just under each (a ray down from 0.3 m over it), nothing right over it (0.3 to 3 m up)
      const meshes = [], mid = [0, 0]; for (let k = 0; k < n; k++) { mid[0] += P[k * 3] / n; mid[1] += P[k * 3 + 2] / n; }
      W.root.traverseVisible(m => { if (m.isMesh && !m.isInstancedMesh && m.renderOrder >= 0 && m.geometry) {   // (not the instanced crowds, trees and props: each instance tested; not a far backdrop drawn first)
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld); if (Math.hypot(c.x - mid[0], c.z - mid[1]) < 400 + m.geometry.boundingSphere.radius) meshes.push(m); } });
      const rc = new THREE.Raycaster(), V = THREE.Vector3; let on = 0, open = 0, tested = 0; const off = [];
      for (let k = 0; k < n; k += Math.max(1, Math.floor(n / 36))) {
        const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2]; tested++;
        rc.set(new V(x, y + 0.3, z), new V(0, -1, 0)); rc.far = 1.5; const d = rc.intersectObjects(meshes, false)[0], dy = d ? y - d.point.y : null;
        if (dy != null && dy > -0.02 && dy < 0.14) on++; else if (off.length < 4) off.push(dy == null ? 'none' : +dy.toFixed(2));
        rc.set(new V(x, y + 0.3, z), new V(0, 1, 0)); rc.far = 2.7; if (!rc.intersectObjects(meshes, false).length) open++; }   // (from 0.3 m up: a world's ground just over the floor in places is no roof)
      Object.assign(o, { tested, on, open, off }); return o;
    }, id));
  }
  const none = res.filter(r => r.none);
  T.check('all 13 tracks with pits: their pits\' wet parts', !none.length, none.map(r => r.id).join(','));
  const ok = res.filter(r => !r.none);
  const film = ok.filter(r => (r.asph ? r.film !== 0 : r.film < 60) || r.pud < 16 || r.lane < 8 || (r.ap > 4.5 && r.apron < 4));
  T.check('a film of water over the apron (none over Bathurst\'s asphalt apron), puddles along the lane\'s edges and on the apron', !film.length,
    (film.length ? 'bad: ' + JSON.stringify(film) + ' ' : '') + ok.map(r => `${r.id} film ${r.film}v, puddles ${r.pud / 4} (${r.lane / 4} lane, ${r.apron / 4} apron)`).join(', '));
  const side = ok.filter(r => r.side || r.deep);
  T.check('all on the garages\' side of the circuit, from the lane\'s inner edge to the apron\'s back; the film on the apron only, short of the garages', !side.length,
    (side.length ? 'bad: ' + JSON.stringify(side) + ' ' : '') + ok.map(r => `${r.id} apron ${r.ap} m`).join(', '));
  const up = ok.filter(r => r.down);
  T.check('every triangle facing up (the lane on the left too: Bathurst, Montréal, Toronto)', !up.length, ok.map(r => `${r.id} ${r.tri}t ${r.down} down`).join(', '));
  const flo = ok.filter(r => r.on < r.tested * 0.9 || r.open < r.tested * 0.9);
  T.check('on the floor (just over it) and in the open (nothing 0.3 to 3 m over it: none in a garage), at least 90 % of a sample of each', !flo.length,
    ok.map(r => `${r.id} ${r.on}/${r.tested} on the floor, ${r.open} open${r.off.length ? ' (off: ' + r.off.join(' ') + ')' : ''}`).join(', '));

  // 2. a race in the rain, the camera behind the car in its box (Bathurst: the lane on the left, its apron asphalt; Spa)
  await page.evaluate(() => {   // count every WebGL draw
    window.__gl = { calls: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl'), P = Object.getPrototypeOf(gl);
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const f = P[name]; if (f) P[name] = function (...a) { window.__gl.calls++; return f.apply(this, a); }; }
  });
  const inBox = () => page.evaluate(() => {   // the race on, the car in its box, the camera behind it: the frames drawn
    const g = window.__game; g.pause(); for (let k = 0; k < 60 && g.phase !== 'racing'; k++) g.sim(0.25, true); Render.setShot(null);
    const P = g.race.player, Tr = g.race.track, pb = Render.world.pitBox, s = pb.s - 7, p = Tr.pitAt(s), o = p.sd * (p.lout + Tr.bayDim().o), i = Tr.idx(s);
    P.place(Tr.px[i] + Tr.nx[i] * o, Tr.pz[i] + Tr.nz[i] * o, Math.atan2(Tr.tz[i], Tr.tx[i])); const hy = Tr.hasElev && Tr.hy ? Tr.hy[i] : 0; P.y = P.py = hy; P.roadY = hy;
    Render.resetCam(); for (let k = 0; k < 40; k++) Render.frame(1 / 60, 1, P, 'chase', {});
  });
  let wetMeshes = 0;
  for (const id of ['bathurst', 'spa']) {
    await startTrack(page, id); await inBox();
    const r = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, Tr = g.race.track, pb = Render.world.pitBox, C = Render.crew; let pud = null;
      Render.scene.traverse(m => { if (m.material && m.material.uniforms && m.material.uniforms.uRain && m.geometry.attributes.pW) pud = m; });
      if (!pud) return { pud: false, fx: Render.wetFx() };
      const PW = pud.geometry.attributes.pW, own = { pud: 0 }; pud.onAfterRender = () => { own.pud++; };
      let film = 0; for (let k = 0; k < PW.count; k++) if (PW.getY(k) === 1) film++;
      // the apron ahead of the car (along the lane, 12 to 30 m on, mid-apron) on the screen: its brightness with the film and without it
      const cv = document.querySelector('canvas'), c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const x2 = c2.getContext('2d'), pts = [];
      for (const a of [12, 18, 24, 30]) { const s = pb.s - 7 + a, p = Tr.pitAt(s), i = Tr.idx(s), w = p.sd * (p.lout + 4.5), v = new THREE.Vector3(Tr.px[i] + Tr.nx[i] * w, Tr.hasElev && Tr.hy ? Tr.hy[i] : 0, Tr.pz[i] + Tr.nz[i] * w).project(Render.camera);
        if (Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95) pts.push([(v.x * 0.5 + 0.5) * cv.width, (0.5 - v.y * 0.5) * cv.height]); }
      const shot = () => { const c0 = __gl.calls, o0 = own.pud; Render.frame(1 / 60, 1, P, 'chase', {}); const n = __gl.calls - c0; x2.drawImage(cv, 0, 0); let l = 0, m = 0;
        for (const [px, py] of pts) { const d = x2.getImageData(Math.round(px) - 4, Math.round(py) - 4, 9, 9).data; for (let k = 0; k < d.length; k += 4) { l += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; m++; } }
        return { calls: n, pud: own.pud - o0, lum: m ? +(l / m).toFixed(1) : null }; };
      const on = shot(), keep = Float32Array.from(PW.array);
      for (let k = 0; k < PW.count; k++) if (PW.getY(k) === 1) PW.setX(k, 0); PW.needsUpdate = true;
      const off = shot(); PW.array.set(keep); PW.needsUpdate = true;
      // the rain in the pits: drops splashing there (the car in its box, the view round it)
      const d0 = Render.wetFx().pitDrops; for (let k = 0; k < 40; k++) Render.frame(1 / 30, 1, P, 'chase', {}); const drops = Render.wetFx().pitDrops - d0;
      // the crews: the rain parts on, the new set on the floor in its covers; the old set put down beside it: bare
      const mats = C.mats.filter(m => m.userData.rain), wetOn = mats.map(m => m.userData.rain.uWet.value), cv0 = Array.from(C.cover.array);
      for (const t of C.tyres) if (t.i >= 4) t.mode = 'floor'; Render.frame(1 / 60, 1, P, 'chase', {}); const cv1 = Array.from(C.cover.array);
      for (const t of C.tyres) if (t.i >= 4) t.mode = 'hidden';
      return { pud: true, film, verts: PW.count, pitV: Render.pitWet().pos.length / 3, on, off, drops, fx: Render.wetFx(), parts: mats.length, meshes: C.meshes.length, wetOn, cv0, cv1, jacket: C.M.trunk.material === C.M.uarm.material && !!C.M.trunk.material.userData.rain, tyreMat: !!C.M.tyre.material.userData.rain };
    });
    T.check(`${id} in the rain: the pits' parts in the puddles' one mesh (${id === 'bathurst' ? 'puddles only: its apron is the road\'s asphalt' : 'the film over the apron, puddles'}), drawn once`,
      r.pud && r.pitV > 50 && r.verts > r.pitV && (id === 'bathurst' ? r.film === 0 : r.film > 60) && r.on.pud === 1 && r.off.pud === 1 && r.fx.puddles > 0.3, JSON.stringify({ pud: r.pud, film: r.film, verts: r.verts, pitV: r.pitV, on: r.on, fx: r.fx }));
    if (id === 'spa') T.check('spa: the apron darker with the film of water (the same draw calls)', r.on.lum != null && r.on.lum < r.off.lum * 0.95 && r.on.calls === r.off.calls, JSON.stringify({ on: r.on, off: r.off }));
    T.check(`${id}: the rain splashing in the pits`, r.drops > 20, `${r.drops} drops in the pits in 40 frames`);
    T.check(`${id}: the crews in their rain jackets (the trunk and the arms, no new mesh), the new set waiting on the floor in its covers, the old set beside it bare (and the stack of used tyres)`,
      r.parts === 2 && r.wetOn.every(v => v === 1) && r.jacket && r.tyreMat && r.cv0.slice(0, 8).join() === '1,1,1,1,0,0,0,0' && r.cv1.slice(0, 8).join() === '1,1,1,1,0,0,0,0' && r.cv0.slice(8).every(v => v === 0) && r.cv1.slice(8).every(v => v === 0),   // (after the eight: the stack of used tyres by the garage, pitkit.test.mjs: bare)
      JSON.stringify({ parts: r.parts, wet: r.wetOn, meshes: r.meshes, covers: r.cv0, oldDown: r.cv1 }));
    wetMeshes = r.meshes;
  }
  // 3. a dry race (Spa): none of it
  await page.evaluate(() => { window.__game.wxNext = { rain: 0, wx: null }; });
  await startTrack(page, 'spa'); await inBox();
  const dry = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, C = Render.crew, d0 = Render.wetFx().pitDrops; let pud = 0;
    for (let k = 0; k < 20; k++) Render.frame(1 / 30, 1, P, 'chase', {});
    Render.scene.traverse(m => { if (m.visible && m.material && m.material.uniforms && m.material.uniforms.uRain) pud++; });
    return { rain: g.race.rain, water: g.race.water, pud, drops: Render.wetFx().pitDrops - d0, wet: C.mats.filter(m => m.userData.rain).map(m => m.userData.rain.uWet.value), covers: Array.from(C.cover.array), meshes: C.meshes.length };
  });
  T.check('a dry race: no puddles, no drops in the pits, no jackets, no covers (the same crew meshes)', !dry.rain && !dry.water && dry.pud === 0 && dry.drops === 0 && dry.wet.join() === '0,0' && dry.covers.every(v => v === 0) && dry.meshes === wetMeshes, JSON.stringify(Object.assign(dry, { wetMeshes })));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
