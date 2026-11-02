// Hakone's world (js/world-hakone.js, docs/proga-hakone.md sklop 3): the scenery within 60 m of the road (the rule of 60 m: the camera behind
// the car sees no farther), the terrain's corridor narrowed, the view beyond it. Built as the game builds it (VISOKA): the old spa towns' buildings
// (OpenStreetMap's, js/data/hakone.js), every one off the road; the trees and the sasa within 60 m of the road and none on it (past the barrier
// line); the mountain railway with the level crossing at Kowakidani and the bridge at Deyama high over the road (a car passes under it); the
// torii at Hatajuku; the old road's stones; the utility poles of the villages; the hydrangeas along the line; the terrain's tiles no farther
// than ~410 m from the road; Lake Shōjin's water by the road; the far view (the caldera, Lake Ashi, Mount Fuji): by default Fuji in a mesh of
// its own over the far ridges (def.fuji not 'real'), with def.fuji 'real' in the far land's meshes, hidden by every ridge in front of it; the far
// land in blocks (each its own mesh, culled out of the view).
//   node tests/browser/hakone.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Hakone: the world within 60 m of the road, the railway, the view');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase' });
  await startTrack(page, 'hakone');
  const r = await page.evaluate(() => {
    const W = Render.world, A = World.api, Tr = window.__game.race.track, S = W.stats, m4 = new THREE.Matrix4(), v = new THREE.Vector3();
    const at = (d) => ((Tr.startS + d) % Tr.len + Tr.len) % Tr.len, roadPt = (d) => { const i = Tr.idx(at(d)); return [Tr.px[i], Tr.pz[i], Tr.hy[i]]; };
    const name = (n) => Tr.names.find(q => q.n === n);
    // the plants (the trees of the forest and the sasa): within 64 m of the road's centre line, past the barrier line
    let plants = 0, far = 0, onRoad = 0; const badF = [], badR = [];
    W.root.traverse(o => {
      if (!o.isInstancedMesh || o.material !== W.treeMat) return;
      for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); v.setFromMatrixPosition(m4); const x = v.x + o.position.x, z = v.z + o.position.z, n = A.vrNear(x, z); plants++;
        if (n.i < 0 || n.d > 64) { far++; if (badF.length < 4) badF.push([+x.toFixed(0), +z.toFixed(0)]); }
        else if (n.dd < 0.6) { onRoad++; if (badR.length < 4) badR.push([+x.toFixed(1), +z.toFixed(1), +n.dd.toFixed(2)]); } }
    });
    // the buildings: each box off the road (its corners and middle past the barrier line), within ~75 m of it
    let bOn = 0, bFar = 0; const bBad = [];
    for (const [x, z, L, Wd, a] of W.bldBoxes) { const c = Math.cos(a), s = Math.sin(a);
      for (const [u, w] of [[0, 0], [L / 2, Wd / 2], [L / 2, -Wd / 2], [-L / 2, Wd / 2], [-L / 2, -Wd / 2]]) { const px = x + c * u - s * w, pz = z + s * u + c * w, n = A.vrNear(px, pz);
        if (n.i >= 0 && n.dd < 0.85) { bOn++; if (bBad.length < 4) bBad.push([+px.toFixed(1), +pz.toFixed(1), +n.dd.toFixed(2)]); break; } }
      if (Math.min(...[[L / 2, Wd / 2], [L / 2, -Wd / 2], [-L / 2, Wd / 2], [-L / 2, -Wd / 2], [0, 0]].map(([u, w]) => A.vrDist(x + c * u - s * w, z + s * u + c * w))) > 75) bFar++; }
    // the terrain's tiles: none farther than ~410 m from the road (the corridor narrowed: 190 m full, 340 m coarse, the tiles' centres)
    let tiles = 0, tileFar = 0; for (const m of W.ground.children) { const b = m.geometry.boundingSphere; tiles++; if (A.vrDist(b.center.x, b.center.z) > 345) tileFar++; }
    // the level crossing near Kowakidani, the torii at Hatajuku, Lake Shōjin's water by the road
    const kw = name('Kowakidani'), ht = name('Hatajuku'), cr = W.marks.crossing, to = W.marks.torii;
    const dK = cr && kw ? Math.min(...[-300, -150, 0, 150, 300].map(o => { const p = roadPt(kw.d + o); return Math.hypot(p[0] - cr[0], p[1] - cr[1]); })) : 1e9;
    const dH = to && ht ? Math.min(...[0, 100, 200, 300, 400].map(o => { const p = roadPt(ht.d + o); return Math.hypot(p[0] - to[0], p[1] - to[1]); })) : 1e9;
    const sj = name('Jezero Shōjin'); let water = 0; const ray = new THREE.Raycaster();
    if (sj) for (let o = -150; o <= 150; o += 25) for (const sd of [-1, 1]) for (const off of [30, 50, 70]) { const i = Tr.idx(at(sj.d + o)), x = Tr.px[i] + Tr.nx[i] * sd * off, z = Tr.pz[i] + Tr.nz[i] * sd * off;
      ray.set(new THREE.Vector3(x, 3000, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObject(W.root, true).find(q => q.object.isMesh && !q.object.isInstancedMesh); if (h && h.object.material && h.object.material.map && h.object.material.map === W.dyn.water) water++; }
    // the railway's bridge over the road at Deyama: something drawn 5.5 m and more above the road where it crosses (not lower: a car passes under)
    const dy = name('Deyama'); let bridge = null;
    if (dy) for (let o = -50; o <= 250 && !bridge; o += 2) { const i = Tr.idx(at(dy.d + o)); ray.set(new THREE.Vector3(Tr.px[i], Tr.hy[i] + 40, Tr.pz[i]), new THREE.Vector3(0, -1, 0));
      const h = ray.intersectObject(W.root, true).find(q => q.object.isMesh && q.point.y > Tr.hy[i] + 1.5 && q.object.name !== 'hkFar' && q.object.name !== 'hkFuji'); if (h) bridge = { d: Math.round(o + dy.d), clear: +(h.point.y - Tr.hy[i]).toFixed(1) }; }
    let fuji = null, farTris = 0, farN = 0; W.root.traverse(o => { if (o.name === 'hkFuji') fuji = o; if (o.name === 'hkFar') { farTris += o.geometry.index.count / 3; farN++; } });
    return { S, plants, far, onRoad, badF, badR, nBld: W.bldBoxes.length, bOn, bFar, bBad, tiles, tileFar, dK, dH, water, bridge,
      fuji: fuji ? { depthTest: fuji.material.depthTest, ro: fuji.renderOrder, tris: fuji.geometry.index.count / 3, culled: fuji.frustumCulled } : null, farTris, farN };
  });
  const S = r.S;
  T.check('the old spa towns: 1200+ of OpenStreetMap\'s buildings within 60 m, none on the road (every box past the barrier line), none beyond 75 m (its nearest corner)', r.nBld > 1200 && r.bOn === 0 && r.bFar === 0,
    `${r.nBld} buildings, ${r.bOn} on the road ${JSON.stringify(r.bBad)}, ${r.bFar} far`);
  T.check('the forest: the canopy model\'s trees (25 000+) and as many more where the woods are, sasa on the verges; every plant within 64 m of the road (the rule of 60 m) and past the barrier line',
    S.trees > 25000 && S.fill > 8000 && S.sasa > 3000 && r.plants >= S.trees + S.fill + S.sasa && r.far === 0 && r.onRoad === 0,
    `${S.trees} + ${S.fill} trees, ${S.sasa} sasa, ${r.plants} drawn; ${r.far} beyond 64 m ${JSON.stringify(r.badF)}, ${r.onRoad} on the road ${JSON.stringify(r.badR)}`);
  T.check('the mountain railway: ~4 km of it within 64 m of the road, the one level crossing, within 300 m of Kowakidani, hydrangeas along it, the stations\' platforms',
    S.railM > 3000 && S.crossings === 1 && r.dK < 300 && S.hydrangeas > 500, `${S.railM} m, ${S.crossings} crossings (${Math.round(r.dK)} m from Kowakidani), ${S.hydrangeas} hydrangeas`);
  T.check('the railway\'s bridge at Deyama over the road, 5.5 m above it at least (a car passes under it)', !!r.bridge && r.bridge.clear >= 5.5 && r.bridge.clear < 20, JSON.stringify(r.bridge));
  T.check('the villages\' utility poles, the old road\'s stones, the torii at Hatajuku (within 400 m of the place on the HUD)', S.poles > 50 && S.paving > 500 && r.dH < 400,
    `${S.poles} poles, ${S.paving} pieces of paving, the torii ${Math.round(r.dH)} m from Hatajuku`);
  T.check('the corridor narrowed (the rule of 60 m): 700-1600 tiles, no tile\'s middle farther than 345 m from the road', r.tiles > 700 && r.tiles < 1600 && r.tileFar === 0, `${r.tiles} tiles (${S.tiles} full), ${r.tileFar} farther`);
  T.check('Lake Shōjin by the road: its water there', r.water >= 4, `${r.water} of the points beside it on water`);
  T.check('the far view (the caldera, Lake Ashi, the sea, Mount Fuji) and, by default, Fuji\'s massif in a mesh of its own over the far ridges (no depth test, drawn before the near world)',
    S.far > 15000 && r.farTris > 10000 && r.farN >= 8 && !!r.fuji && r.fuji.depthTest === false && r.fuji.ro < 0 && r.fuji.tris > 300 && S.fujiOver === true, `${S.far} nodes, ${r.farTris} triangles in ${r.farN} blocks; Fuji ${JSON.stringify(r.fuji)}`);
  // def.fuji 'real': Fuji in the one mesh, hidden by every ridge in front of it (the user's choice on the page of decisions)
  const q = await page.evaluate(() => { const g = window.__game, d = Core.TRACKS.find(t => t.id === 'hakone'), f0 = d.fuji; d.fuji = 'real'; Render.buildWorld(g.race.track, 1, 2);
    let fuji = null, farTris = 0; Render.world.root.traverse(o => { if (o.name === 'hkFuji') fuji = o; if (o.name === 'hkFar') farTris += o.geometry.index.count / 3; }); const res = { fuji: !!fuji, over: Render.world.stats.fujiOver, farTris };
    if (f0 === undefined) delete d.fuji; else d.fuji = f0; Render.buildWorld(g.race.track, 1, 2); return res; });
  T.check('def.fuji \'real\': no mesh of its own, Fuji in the far land\'s meshes (its triangles there too)', !q.fuji && q.over === false && q.farTris > r.farTris, JSON.stringify(q));
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
