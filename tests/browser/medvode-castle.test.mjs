// Medvode, Slovenija: the castle ruin (Stari grad above Smlednik) at the end of the road. mvCastle builds it as one mesh of its own ('mvCastle') from the plan of the real ruin:
// the keep with walls over 3 m thick (the surviving tower stands 14.33 m, 18 m a century ago), the palace leaning on the western wall with its pointed portal, the curtain wall of an
// irregular shape round the hilltop (up to 1.5 m thick), the outer ring's three smaller towers, a gate, the chapel's foundations and the cistern.
// 1. The mesh: one object, every vertex inside the OSM footprint (a margin of 35 cm), within the vertex budget (the old castle was 1440 vertices; up to 60k is the room), the size of the footprint,
//    not a vertex buried under the ground.
// 2. The builder's counts of the parts: three towers, one keep, one palace, one gate, the chapel, the cistern, arched windows, doorways, enough columns and rubble.
// 3. Drawn from both cameras (iso above, chase behind) at the finish and from a shot above the castle: no page errors, the shaders compile, and the castle really is in the picture (the vertices
//    the pipeline gets, all passes, with the mesh and with it hidden).
//   node tests/browser/medvode-castle.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the castle ruin');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', mode: 'tt' }, { width: 450, height: 900 });
  await startTrack(page, 'medvode');
  const r = await page.evaluate(() => {
    const W = Render.world, def = window.__game.race.track.def, bd = def.bld.find(b => b[6] === 6), flat = bd[8], poly = []; for (let k = 0; k + 1 < flat.length; k += 2) poly.push([flat[k], flat[k + 1]]);
    const meshes = []; W.root.traverse(o => { if (o.isMesh && o.name === 'mvCastle') meshes.push(o); });
    const dSeg = (px, pz, a, c) => { const dx = c[0] - a[0], dz = c[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz); };
    const inPoly = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const out = { n: meshes.length, stats: W.castle || null, name: bd[7], poly: poly.length };
    if (meshes.length) {
      const m = meshes[0], P = m.geometry.attributes.position.array, n = P.length / 3; let far = 0, ymin = 1e9, ymax = -1e9, under = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < n; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
        if (!inPoly(x, z)) { let d = 1e9; for (let k = 0; k < poly.length; k++) d = Math.min(d, dSeg(x, z, poly[k], poly[(k + 1) % poly.length])); far = Math.max(far, d); }
        if (y < W.groundH(x, z) - 1.2) under++; }
      out.verts = n; out.far = far; out.under = under; out.height = ymax - W.groundH((x0 + x1) / 2, (z0 + z1) / 2); out.ymin = ymin; out.casts = m.castShadow; out.receives = m.receiveShadow; out.map = !!(m.material && m.material.map); out.vc = !!(m.material && m.material.vertexColors);
      out.size = [x1 - x0, z1 - z0];
    }
    return out;
  });
  console.log(JSON.stringify(r));
  T.check('the castle is one mesh of its own (mvCastle), built from the OSM footprint named Stari grad', r.n === 1 && r.name === 'Stari grad' && r.poly >= 12, `meshes ${r.n}, ${r.name}, ${r.poly} corners`);
  T.check('on the masonry picture with vertex colours, casting and receiving shadows', r.map && r.vc && r.casts && r.receives);
  T.check('every vertex inside the footprint (35 cm margin)', r.far <= 0.35, `the farthest ${r.far && r.far.toFixed(2)} m outside`);
  T.check('its size is that of the ruin (the footprint is about 52 x 39 m)', r.size && r.size[0] > 46 && r.size[0] < 56 && r.size[1] > 34 && r.size[1] < 44, r.size && r.size.map(v => v.toFixed(1)).join(' x '));
  T.check('vertex budget: more than the old 1440 vertices and within 60k', r.verts > 8000 && r.verts <= 60000, `${r.verts} vertices`);
  T.check('the stats the builder exposes agree with the mesh', r.stats && r.stats.verts === r.verts, JSON.stringify(r.stats));
  const s = r.stats || {};
  T.check('three smaller towers of the outer ring, one keep, one palace, one gate, the chapel and the cistern', s.towers === 3 && s.keeps === 1 && s.palaces === 1 && s.gates === 1 && s.chapels === 1 && s.cisterns === 1, JSON.stringify(s));
  T.check('arched windows and doorways in the walls (palace, keep, towers, gate)', s.windows >= 10 && s.doors >= 6 && s.openings >= 20, `windows ${s.windows}, doors ${s.doors}, openings ${s.openings}`);
  T.check('walls broken at different heights: many columns, the highest the keep\'s 12-15 m', s.columns >= 250 && s.maxTop >= 12 && s.maxTop <= 15.5, `columns ${s.columns}, highest ${s.maxTop && s.maxTop.toFixed(1)} m`);
  T.check('rubble, ivy and scrub on and between the walls', s.stones >= 100 && s.ivy >= 10 && s.bushes >= 8, `stones ${s.stones}, ivy ${s.ivy}, bushes ${s.bushes}`);
  T.check('nothing buried: no vertex deeper than 1.2 m under the ground', r.under === 0, `${r.under} vertices`);

  // 3. drawn from both cameras: from the finish (iso, chase) and a shot close over the castle; the castle really is in the picture (the vertices drawn, all passes, with and without it)
  await page.evaluate(() => {   // count every WebGL draw (all render passes), as the phone-budget test does
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  const draws = await page.evaluate(async () => {
    const g = window.__game, W = Render.world, res = {}; g.pause();
    const m = W.root.getObjectByName('mvCastle'); res.inTree = !!m;
    const count = (cam) => { Render.frame(1 / 60, 1, g.race.player, cam, {}); const c0 = __gl.verts; Render.frame(1 / 60, 1, g.race.player, cam, {}); return __gl.verts - c0; };
    const P = g.race.player; let n = 0; while (P.q.s - g.race.track.startS < 6230 && n < 700) { g.sim(1, true); n++; }
    res.s = Math.round(P.q.s - g.race.track.startS);
    for (const cam of ['iso', 'chase']) { g.S.camera = cam; Render.resetCam(); for (let i = 0; i < 8; i++) Render.frame(1 / 60, 1, P, cam, {}); res[cam] = count(cam); m.visible = false; res[cam + 'Without'] = count(cam); m.visible = true; }
    const y = W.groundH(2562, -2596); Render.setShot({ px: 2562, py: y + 60, pz: -2575, tx: 2562, ty: y, tz: -2596, fov: 40, noCut: true, near: 1 });
    for (let i = 0; i < 4; i++) Render.frame(1 / 60, 1, P, 'iso', {});
    res.shot = count('iso'); m.visible = false; res.shotWithout = count('iso'); m.visible = true;
    return res;
  });
  console.log(JSON.stringify(draws));
  T.check('drawn from the iso and the chase camera at the finish: the world draws, the castle\'s edge is in the iso picture', draws.inTree && draws.s >= 6150 && draws.iso > 20000 && draws.chase > 20000 && draws.iso > draws.isoWithout, JSON.stringify({ s: draws.s, iso: draws.iso, isoWithout: draws.isoWithout, chase: draws.chase, chaseWithout: draws.chaseWithout }));
  T.check('drawn from above: all of the castle\'s vertices go through the pipeline (the main pass at least)', draws.shot - draws.shotWithout >= r.verts * 0.9, `${draws.shot} with, ${draws.shotWithout} without: ${draws.shot - draws.shotWithout} for ${r.verts}`);
  T.check('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
