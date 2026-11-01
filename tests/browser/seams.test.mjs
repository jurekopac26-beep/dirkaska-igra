// The worn seam where the asphalt gives way to gravel (js/world.js gravelSeams, gravelSeamMasks): on Medvode (def.surf: the castle road) one overlay
// mesh over every seam, drawn in one draw call; it covers each def.surf boundary across the whole road; just before the seam its asphalt is opaque
// (the joint of the road's meshes never shows) and it fades in over the road's own asphalt (no hard edge where it starts); the same on a second
// build; no overlay on other real tracks (Vršič, Spa).
//   node tests/browser/seams.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the asphalt to gravel seam');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', mode: 'tt' }, { width: 360, height: 640 });
  await startTrack(page, 'medvode');
  const fp = () => page.evaluate(() => {   // the overlay as built: its meshes, a hash of its vertex data and masks, the masks' rows by the seam, its reach round each def.surf boundary
    const Tr = window.__game.race.track, def = Tr.def, ms = []; Render.world.root.traverse(o => { if (o.name === 'roadSeams') ms.push(o); });
    const out = { n: ms.length }; if (ms.length !== 1) return out;
    const m = ms[0], g = m.geometry, sd = m.userData.seams || {};
    let h = 2166136261; const fnv = (a) => { const u = new Uint32Array(a.buffer, a.byteOffset, a.byteLength >> 2); for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0; } };
    for (const k of Object.keys(g.attributes).sort()) fnv(g.attributes[k].array);
    const M = sd.mask && sd.mask.image, D = M && M.data; if (D) fnv(D);
    Object.assign(out, { hash: h, mesh: m.isMesh && !m.isInstancedMesh, oneMat: !Array.isArray(m.material), groups: g.groups.length, verts: g.attributes.position.count, cuts: (sd.at || []).length, cast: m.castShadow });
    if (D) {   // the asphalt's cover (G) per row: the least across the row
      const W = M.width, H = M.height, len = sd.back + sd.fwd, rowMin = (d) => { const py = Math.min(H - 1, Math.max(0, Math.floor((d + sd.back) / len * H))); let mn = 255; for (let x = 0; x < W; x++) mn = Math.min(mn, D[(py * W + x) * 4 + 1]); return mn; };
      out.atSeam = Math.min(rowMin(-0.04), rowMin(-0.02), rowMin(-0.005)); let st = 0; for (let x = 0; x < W; x++) st = Math.max(st, D[x * 4 + 1]); out.atStart = st;
    }
    const P = g.attributes.position.array, near = (x, z) => { let b = 1e9; for (let k = 0; k < P.length; k += 3) b = Math.min(b, Math.hypot(P[k] - x, P[k + 2] - z)); return b; };
    out.bounds = []; for (const [a, b] of def.surf || []) for (const d of [a, b]) {
      const s = Tr.startS + d, i = Tr.idx(s), w = Tr.wa ? Tr.wa[i] : Tr.w;
      out.bounds.push({ d, cut: Math.min(...(sd.at || []).map(([c]) => Math.abs(c - s))), c: near(Tr.px[i], Tr.pz[i]), l: near(Tr.px[i] - Tr.nx[i] * w, Tr.pz[i] - Tr.nz[i] * w), r: near(Tr.px[i] + Tr.nx[i] * w, Tr.pz[i] + Tr.nz[i] * w) });
    }
    return out;
  });
  const a = await fp();
  console.log(JSON.stringify(a));
  T.check('Medvode: one overlay mesh (roadSeams), one material, no groups, no shadow cast', a.n === 1 && a.mesh && a.oneMat && a.groups === 0 && !a.cast, JSON.stringify({ n: a.n, groups: a.groups }));
  T.check('a seam at each def.surf boundary (2), the overlay 2 x 22 rows x 8 quads', a.cuts === 2 && a.verts === 2 * 22 * 8 * 6, `${a.cuts} seams, ${a.verts} vertices`);
  for (const b of a.bounds || []) T.check(`def.surf boundary ${b.d} m: a seam there and the overlay across the whole road (centre and both edges within 1 m)`, b.cut <= 2 && b.c < 1 && b.l < 1 && b.r < 1,
    `seam ${b.cut.toFixed(2)} m away; nearest vertex: centre ${b.c.toFixed(2)}, left ${b.l.toFixed(2)}, right ${b.r.toFixed(2)} m`);
  T.check('just before the seam the overlay\'s asphalt is opaque across the whole road (no gap at the joint)', a.atSeam >= 250, `least cover ${a.atSeam}`);
  T.check('it fades in over the road\'s own asphalt: no cover where it starts', a.atStart <= 2, `most cover ${a.atStart}`);

  // one draw call: drawn behind the car at the seam, with and without the overlay
  const dc = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl'), Pr = Object.getPrototypeOf(gl); let calls = 0;
    for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const o = Pr[f]; if (o) Pr[f] = function (...x) { calls++; return o.apply(this, x); }; }
    const g = window.__game, Tr = g.race.track, P = g.race.player, m = Render.world.root.getObjectByName('roadSeams'); g.pause();
    const i = Tr.idx(m.userData.seams.at[0][0] - 8), hd = Tr.hd[i]; P.place(Tr.px[i], Tr.pz[i], hd); if (Tr.hasElev) P.y = P.py = Tr.hy[i]; P.q = Tr.query(P.x, P.z, i, P.q); P.roadY = P.y;
    Render.resetCam(); for (let k = 0; k < 6; k++) Render.frame(1 / 60, 1, P, 'chase', {});
    const count = () => { Render.frame(1 / 60, 1, P, 'chase', {}); const c0 = calls; Render.frame(1 / 60, 1, P, 'chase', {}); return calls - c0; };
    const w = count(); m.visible = false; const wo = count(); m.visible = true; return { w, wo };
  });
  T.check('drawn in one draw call', dc.w - dc.wo === 1, JSON.stringify(dc));

  const b = await page.evaluate(() => { Render.buildWorld(window.__game.race.track, 1, 2); return true; }).then(fp);
  T.check('the same on a second build (vertices and mask)', b.n === 1 && b.hash === a.hash, `${a.hash} / ${b.hash}`);

  for (const id of ['vrsic', 'spa']) {
    await startTrack(page, id);
    const n = await page.evaluate(() => { let n = 0; Render.world.root.traverse(o => { if (o.name === 'roadSeams') n++; }); return n; });
    T.check(`no seam overlay on ${id}`, n === 0, `${n}`);
  }
  T.check('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
