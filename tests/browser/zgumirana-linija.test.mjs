// The rubbered-in line by the player's driving, in the page (docs/zgumirana-linija.md; Core's part: tests/zgumirana-linija.test.js). On a
// real track the game gives the track the player's line (js/game.js getTrack: Track.voznjaLinija) and the renderer draws the rubber's
// look along it (js/render.js rubberLine, marbles):
//  - a circuit (Spa, the line of the player's style): the rubber a race lays is the wide layer (7 columns, 6.2 m) along the player's
//    line, one mesh and one draw call, never off the asphalt, as dark as the race has laid it; the marbles beside that line;
//  - an open road (Tianmen, the player's measured line): the layer is there in the dry without a race laying it, in pieces (the far ones
//    not drawn), a few draw calls, and gone in the rain;
//  - a frozen track (a test track, one being decided on) keeps the computed line: no player's line, the old layer.
// The player's car is set down before the place where the two lines are furthest apart; the same frame with the layer and without it
// is compared (draw calls, the picture's pixels on the player's line).
//   node tests/browser/zgumirana-linija.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('rubbered-in line by the player\'s driving (Spa, Tianmen)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.4, weather: 'dry' }, { width: 844, height: 390 }, { seed: 4242 });
  // the page's helpers (window.__zl): every WebGL draw counted (all render passes, as tests/browser/perf.test.mjs does), a frame of the
  // camera behind the car, the car set down on the track, the layer's rows against the track's samples, the picture's pixels
  await page.evaluate(() => {
    const cv = document.getElementById('gl'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), GP = Object.getPrototypeOf(gl), Z = window.__zl = { calls: 0 };
    for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const o = GP[f]; if (o) GP[f] = function (...a) { Z.calls++; return o.apply(this, a); }; }
    const race = () => window.__game.race;
    Z.frame = () => { const c0 = Z.calls; Render.frame(1 / 60, 1, race().player, 'chase', {}); return Z.calls - c0; };
    Z.meshes = (o) => !o ? [] : o.isMesh ? [o] : o.children;
    // the car standing on the computed line at sample i (as tools/shot.mjs sets it down), the rivals out of the picture
    Z.place = (i) => {
      const R = race(), Tk = R.track, P = R.player, off = Tk.rl[i];
      P.place(Tk.px[i] + Tk.nx[i] * off, Tk.pz[i] + Tk.nz[i] * off, Tk.hd[i]); if (Tk.hasElev) P.y = P.py = Tk.hy[i];
      P.q = Tk.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
      for (let k = 0; k < 60; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); }
      for (const c of R.cars) if (c !== P) { const v = Render.viewOf(c); if (v) v.grp.visible = false; }
    };
    // a layer's rows (nc vertices each) against the track's samples: each row's middle (the mean of its vertices' x, z for the marbles'
    // band, vertex mid for the rubber) to the nearest point of the line L (an offset for every sample); with it the row's width, its
    // vertices' offsets from the road's middle against the asphalt's edge, and how far the player's line is from the computed one there
    Z.rows = (ln, nc, mid, L) => {
      const Tk = race().track, N = Tk.N, ex = new Float32Array(N), ez = new Float32Array(N);
      for (let i = 0; i < N; i++) { ex[i] = Tk.px[i] + Tk.nx[i] * L[i]; ez[i] = Tk.pz[i] + Tk.nz[i] * L[i]; }
      let rows = 0, far = 0, worst = 0, wide = 0, wsum = 0, out = 0, apart = 0, tri = 0;
      for (const m of Z.meshes(ln)) {
        const p = m.geometry.attributes.position, a = p.array; tri += m.geometry.index.count / (m.userData.pcs ? 6 : 3);   // (a lap: its triangles twice over in the index, render.js rubberLap)
        for (let r = 0; r < p.count / nc; r++) {
          let x = 0, z = 0;
          if (mid >= 0) { x = a[(r * nc + mid) * 3]; z = a[(r * nc + mid) * 3 + 2]; } else { for (let v = 0; v < nc; v++) { x += a[(r * nc + v) * 3] / nc; z += a[(r * nc + v) * 3 + 2] / nc; } }
          let bi = 0, bd = Infinity; for (let i = 0; i < N; i++) { const dx = ex[i] - x, dz = ez[i] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
          bd = Math.sqrt(bd); rows++; if (bd > 0.02) far++; worst = Math.max(worst, bd); apart = Math.max(apart, Math.abs(Tk.gl[bi] - Tk.rl[bi]));
          const w = Math.hypot(a[(r * nc + nc - 1) * 3] - a[r * nc * 3], a[(r * nc + nc - 1) * 3 + 2] - a[r * nc * 3 + 2]); wide = Math.max(wide, w); wsum += w;
          const lim = (Tk.wa ? Tk.wa[bi] : Tk.w) - 0.1;
          for (let v = 0; v < nc; v++) { const o = (a[(r * nc + v) * 3] - Tk.px[bi]) * Tk.nx[bi] + (a[(r * nc + v) * 3 + 2] - Tk.pz[bi]) * Tk.nz[bi]; if (Math.abs(o) > lim + 0.02) { out++; break; } }
        }
      }
      const f = (x) => Math.round(x * 1000) / 1000;
      return { rows, far, worst: f(worst), wide: f(wide), mean: f(wsum / Math.max(1, rows)), out, apart: f(apart), tri };
    };
    // the picture on the player's line ahead of the car (samples i0 + from .. i0 + to, every third): the mean luminance of a 12 x 6 block
    // of the drawing buffer round each point the camera sees, read back at once after the frame
    Z.lum = (i0, from, to) => {
      const Tk = race().track, N = Tk.N, C = Render.camera, W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, px = new Uint8Array(12 * 6 * 4); let lum = 0, n = 0;
      for (let o = from; o <= to; o += 3) {
        const i = Tk.open ? Math.min(N - 1, i0 + o) : (i0 + o) % N, y = (Tk.hasElev && Tk.hy ? Tk.hy[i] : 0) + 0.05;
        const v = new THREE.Vector3(Tk.px[i] + Tk.nx[i] * Tk.gl[i], y, Tk.pz[i] + Tk.nz[i] * Tk.gl[i]).project(C);
        if (!(v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9)) continue;
        gl.readPixels(Math.round((v.x + 1) / 2 * W) - 6, Math.round((v.y + 1) / 2 * H) - 3, 12, 6, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let t = 0; for (let k = 0; k < px.length; k += 4) t += 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]; lum += t / 72; n++;
      }
      return { n, lum: n ? lum / n : -1 };
    };
    // the same frame with the rubber's layer and without it (its material switched off for the frame): draw calls, the picture
    Z.shot = (i0, from, to, on) => {
      const ln = Render.scene.getObjectByName('rubberline'), m = ln.userData.m;
      m.visible = on; Render.resetCam(); for (let k = 0; k < 12; k++) Z.frame();
      const calls = Z.frame(), s = Z.lum(i0, from, to); m.visible = true;
      return { calls, n: s.n, lum: s.lum, vis: ln.visible, pieces: Z.meshes(ln).filter(c => c.visible).length };
    };
    // the sample where the player's line is furthest from the computed one
    Z.apart = () => { const Tk = race().track; let at = 0, mx = 0; for (let i = 0; i < Tk.N; i++) { const d = Math.abs(Tk.gl[i] - Tk.rl[i]); if (d > mx) { mx = d; at = i; } } return { at, mx }; };
  });
  const still = () => page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  const f2 = (x) => x.toFixed(2);

  // 1. Spa, a circuit the player has not driven: the line of their style; the rubber of a race along it
  await startTrack(page, 'spa');
  await still();
  const s0 = await page.evaluate(() => {
    const R = window.__game.race, Tk = R.track; for (let i = 0; i < 3; i++) window.__zl.frame();
    const ln = Render.scene.getObjectByName('rubberline'), A = window.__zl.apart();
    return { own: Tk.gl !== Tk.rl && Tk.gl instanceof Float32Array && Tk.gld instanceof Float32Array, mb: !!R.mb, rb: R.mb ? R.mb.rb : -1, ln: !!ln && ln.visible, at: A.at, mx: A.mx, N: Tk.N, m: Math.round(A.at * Tk.ds) };
  });
  T.check('Spa: the track has the player\'s line (their style), metres from the computed one in a bend', s0.own && s0.mx > 1 && s0.mx < 5, `the most ${f2(s0.mx)} m at ${s0.m} m`);
  T.check('at the start: no rubber laid yet, no layer drawn', s0.mb && s0.rb === 0 && !s0.ln, JSON.stringify({ mb: s0.mb, rb: s0.rb, drawn: s0.ln }));
  // (the rubber of a long race, set as tools/shot.mjs --guma 0.8 sets it: the race's own step works the layer's and the marbles' share out)
  const s1 = await page.evaluate(() => {
    const Z = window.__zl, R = window.__game.race, Tk = R.track, N = Tk.N;
    R.mb.d = -Math.log(1 - 0.8) * Core.RUB.n * Tk.len; R.step(1 / 120); for (let i = 0; i < 3; i++) Z.frame();
    const ln = Render.scene.getObjectByName('rubberline'), mb = Render.scene.getObjectByName('marbles');
    if (!ln || !mb) return { ln: !!ln, mb: !!mb };
    const MG = Tk.marblesAlong(Tk.gl), M0 = Tk.marbles(), g = Z.rows(mb, 4, -1, MG.c);
    let dc = 0; for (let i = 0; i < N; i++) if (MG.k[i] > 0.5 && M0.k[i] > 0.5) dc = Math.max(dc, Math.abs(MG.c[i] - M0.c[i]));
    return { ln: true, mb: true, rb: R.mb.rb, lv: R.mb.lv, mesh: !!ln.isMesh, vis: ln.visible, own: ln.userData.gl === Tk.gl, road: !!ln.userData.road, op: ln.userData.m.opacity, cnt: ln.geometry.attributes.position.count, N,
      r: Z.rows(ln, 7, 3, Tk.gl), mvis: mb.visible, mown: mb.userData.gl === Tk.gl, mop: mb.material.opacity, g, dc };
  });
  if (T.check('with the rubber of a long race: the layer and the marbles are drawn', s1.ln && s1.mb, JSON.stringify(s1))) {
    const r = s1.r, g = s1.g;
    T.check('the rubber is one mesh along the player\'s line, as dark as the race has laid it', s1.mesh && s1.vis && s1.own && !s1.road && Math.abs(s1.rb - 0.8) < 0.01 && Math.abs(s1.op - (0.22 + 0.5 * Math.round(s1.rb * 100) / 100)) < 0.006,
      `rubber laid ${f2(s1.rb)}, opacity ${f2(s1.op)}`);
    T.check('it is the wide layer: 7 columns a row, a row every 2 m in the bends and every 4 m on the straights', s1.cnt % 7 === 0 && r.rows === s1.cnt / 7 && r.rows > s1.N / 4 && r.rows <= Math.ceil(s1.N / 2) + 1 && r.tri === (r.rows - 1) * 12,
      `${r.rows} rows of ${s1.N} samples, ${r.tri} triangles`);
    T.check('every row\'s middle is on the player\'s line, also where that is furthest from the computed one', r.far === 0 && r.apart > s0.mx - 0.3, `${r.far} rows off it (the worst ${r.worst} m), a row ${f2(r.apart)} m from the computed line`);
    T.check('a row is 6.2 m wide, narrower only at the asphalt\'s edge, never off the asphalt', Math.abs(r.wide - 6.2) < 0.01 && r.mean > 4.5 && r.out === 0, `the widest ${r.wide} m, mean ${r.mean} m, ${r.out} rows off the asphalt`);
    T.check('the marbles lie beside the player\'s line: the band of the look, not the grip\'s', s1.mvis && s1.mown && s1.lv > 0.9 && Math.abs(s1.mop - s1.lv) < 0.01 && g.rows > 50 && g.far === 0 && s1.dc > 0.5,
      `${g.rows} rows, ${g.far} off the look's band (the worst ${g.worst} m), that up to ${f2(s1.dc)} m from the grip's`);
    // the car before the place where the two lines are furthest apart: the same frame with the layer and without it
    const sh = await page.evaluate((at) => { const Z = window.__zl, N = window.__game.race.track.N, i0 = (at - 22 + N) % N; Z.place(i0); const on = Z.shot(i0, 14, 32, true), off = Z.shot(i0, 14, 32, false); return { on, off }; }, s0.at);
    T.check('from the camera behind the car: the layer in sight, one draw call more than without it', sh.on.vis && sh.on.n >= 2 && sh.on.calls === sh.off.calls + 1, JSON.stringify({ calls: [sh.on.calls, sh.off.calls], pts: sh.on.n }));
    T.check('... and the road on the player\'s line darker with it', sh.on.lum > 0 && sh.on.lum < sh.off.lum - 3, `luminance ${sh.on.lum.toFixed(1)} with the layer, ${sh.off.lum.toFixed(1)} without`);
  }

  // 2. Tianmen, an open road the player has driven: their measured line; the layer in the dry without a race laying it, gone in the rain
  await startTrack(page, 'tianmen');
  await still();
  const t1 = await page.evaluate(() => {
    const Z = window.__zl, R = window.__game.race, Tk = R.track, N = Tk.N; for (let i = 0; i < 3; i++) Z.frame();
    const ln = Render.scene.getObjectByName('rubberline'), A = Z.apart();
    const o = { open: !!Tk.open, own: Tk.gl !== Tk.rl && Tk.gld instanceof Float32Array, mb: !!R.mb, at: A.at, mx: A.mx, m: Math.round(A.at * Tk.ds), N, ln: !!ln, water: R.water, fog: Render.scene.fog ? Math.round(Render.scene.fog.far) : 0 };
    if (!ln) return o;
    const ms = Z.meshes(ln); let cnt = 0, big = 0; for (const c of ms) { cnt += c.geometry.attributes.position.count; big = Math.max(big, c.geometry.attributes.position.count / 7); }
    return Object.assign(o, { mesh: !!ln.isMesh, vis: ln.visible, lown: ln.userData.gl === Tk.gl, road: !!ln.userData.road, op: ln.userData.m.opacity, pieces: ms.length, cnt, big, r: Z.rows(ln, 7, 3, Tk.gl) });
  });
  T.check('Tianmen: an open road with the player\'s measured line, metres from the computed one', t1.open && t1.own && !t1.mb && t1.mx > 2 && t1.mx < 9, `the most ${f2(t1.mx)} m at ${t1.m} m, no rubber laid by a race`);
  if (T.check('in the dry the layer is drawn along the road without a race laying it', t1.ln && t1.vis && t1.water === 0, JSON.stringify({ drawn: t1.ln, water: t1.water }))) {
    const r = t1.r;
    T.check('it is in pieces of at most 128 samples under one object, along the player\'s line, lighter than a circuit\'s', !t1.mesh && t1.road && t1.lown && t1.pieces >= 2 && t1.pieces <= Math.ceil((t1.N - 1) / 128) && t1.big <= 129 && Math.abs(t1.op - 0.66) < 0.006,
      `${t1.pieces} pieces, the longest ${t1.big} rows, opacity ${f2(t1.op)}`);
    T.check('7 columns a row, a row at every sample but the road\'s two ends', t1.cnt % 7 === 0 && r.rows === t1.cnt / 7 && r.rows > t1.N * 0.9 && r.rows <= t1.N + t1.pieces, `${r.rows} rows of ${t1.N} samples, ${r.tri} triangles`);
    T.check('every row\'s middle is on the player\'s line, also where that is furthest from the computed one', r.far === 0 && r.apart > t1.mx - 0.3, `${r.far} rows off it (the worst ${r.worst} m), a row ${f2(r.apart)} m from the computed line`);
    T.check('a row is 6.2 m wide, narrower only at the asphalt\'s edge, never off the asphalt', Math.abs(r.wide - 6.2) < 0.01 && r.mean > 3.5 && r.out === 0, `the widest ${r.wide} m, mean ${r.mean} m, ${r.out} rows off the asphalt`);
    const sh = await page.evaluate((at) => { const Z = window.__zl, i0 = Math.max(20, at - 22); Z.place(i0); const on = Z.shot(i0, 8, 26, true), off = Z.shot(i0, 8, 26, false); return { on, off }; }, t1.at);
    T.check('from the camera behind the car: the near pieces drawn, the far ones not; a few draw calls more than without the layer',
      sh.on.vis && sh.on.n >= 2 && sh.on.calls > sh.off.calls && sh.on.calls - sh.off.calls <= Math.min(4, sh.on.pieces) && (!t1.fog || sh.on.pieces < t1.pieces),
      JSON.stringify({ calls: [sh.on.calls, sh.off.calls], pts: sh.on.n, pieces: [sh.on.pieces, t1.pieces], fog: t1.fog }));
    T.check('... and the road on the player\'s line darker with it', sh.on.lum > 0 && sh.on.lum < sh.off.lum - 3, `luminance ${sh.on.lum.toFixed(1)} with the layer, ${sh.off.lum.toFixed(1)} without`);
    // the rain: the water is on the road at once, the rubber is not seen on a wet road
    const wet = await page.evaluate(() => { const Z = window.__zl, R = window.__game.race; R.setRain(1); for (let i = 0; i < 3; i++) Z.frame(); const ln = Render.scene.getObjectByName('rubberline'); return { water: R.water, vis: !!ln && ln.visible }; });
    T.check('in the rain the layer is gone', wet.water > 0.6 && !wet.vis, JSON.stringify(wet));
  }

  // 3. the frozen tracks keep the computed line: a test track or one being decided on (the first of each the game still has), and those
  // frozen before they carry the mark (js/game.js GUMA_BREZ)
  const ids = await page.evaluate(() => {
    const D = Core.TRACKS, out = [], add = (d) => { if (d && !out.includes(d.id)) out.push(d.id); };
    add(D.find(d => d.pending && !d.open)); add(D.find(d => d.test && !d.open)); for (const id of ['suzuka', 'medvode']) add(D.find(d => d.id === id && !d.test && !d.pending));
    return out;
  });
  const frozen = [];
  for (const id of ids) {
    await startTrack(page, id);
    await still();
    frozen.push(await page.evaluate((id) => {
      const Z = window.__zl, R = window.__game.race, Tk = R.track; for (let i = 0; i < 3; i++) Z.frame();
      if (R.mb) { R.mb.d = -Math.log(1 - 0.8) * Core.RUB.n * Tk.len; R.step(1 / 120); for (let i = 0; i < 3; i++) Z.frame(); }
      const ln = Render.scene.getObjectByName('rubberline');
      return { id, same: Tk.gl === Tk.rl && Tk.gld === null, mb: !!R.mb, ln: !!ln && ln.visible, old: !ln || (ln.userData.gl === null && (!ln.isMesh || ln.geometry.attributes.position.count % 5 === 0)), mesh: !!ln && !!ln.isMesh };
    }, id));
  }
  T.check('a frozen track keeps the computed line: no player\'s line; where a race lays rubber, the old layer (5 columns) along the computed line',
    frozen.length > 0 && frozen.every(f => f.same && f.old && (!f.mb || (f.ln && f.mesh))), frozen.map(f => `${f.id}: ${f.same ? 'the computed line' : 'A LINE OF ITS OWN'}${f.mb ? (f.ln && f.mesh && f.old ? ', the old layer' : ', THE LAYER ' + JSON.stringify(f)) : f.ln ? ', A LAYER' : ', no layer'}`).join('; '));

  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
