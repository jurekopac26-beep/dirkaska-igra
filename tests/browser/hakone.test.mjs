// Hakone's world (js/world-hakone.js, docs/proga-hakone.md sklop 3): the scenery within 60 m of the road (the rule of 60 m: the camera behind
// the car sees no farther), the terrain's corridor narrowed, the view beyond it. Built as the game builds it (VISOKA): the old spa towns' buildings
// (OpenStreetMap's, js/data/hakone.js), every one off the road; the trees and the sasa within 60 m of the road and none on it (past the barrier
// line), the forest thinned for the phone (2. 11. 2026) and none on the railway's bed; the mountain railway drawn as far as its data goes (~170 m
// from the road), every free end of a line finished (a buffer stop by the road, a tunnel's portal in a hill farther out), with the level
// crossing at Kowakidani and the bridge at Deyama high over the road (a car passes under it); the
// torii at Hatajuku; the old road's stones; the utility poles of the villages; the hydrangeas along the line; the terrain's tiles no farther
// than ~410 m from the road; Lake Shōjin's water by the road; the far view (the caldera, Lake Ashi, Mount Fuji): the track's def.fuji 'real'
// (the user's choice, 3. 11. 2026) Fuji in the far land's meshes, hidden by every ridge in front of it; without it Fuji in a mesh of its own
// over the far ridges; the far land in blocks (each its own mesh, culled out of the view).
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
    // the railway's lines out of the tunnels (HK_DATA.rail, in the game's frame): a plant's distance to the nearest
    const D = window.HK_DATA, base = W.stats.base, rs = [];
    for (const r of D.rail) { const p = r.p, n = p.length / 3; for (let k = 0; k + 1 < n; k++) if (r.g[k] !== 2) rs.push([p[k * 3] / 10, p[k * 3 + 1] / 10, p[k * 3 + 3] / 10, p[k * 3 + 4] / 10]); }
    const railD = (x, z) => { let b = 1e9; for (const s of rs) { if (x < Math.min(s[0], s[2]) - 5 || x > Math.max(s[0], s[2]) + 5 || z < Math.min(s[1], s[3]) - 5 || z > Math.max(s[1], s[3]) + 5) continue; const ex = s[2] - s[0], ez = s[3] - s[1], t = Math.max(0, Math.min(1, ((x - s[0]) * ex + (z - s[1]) * ez) / (ex * ex + ez * ez || 1))); b = Math.min(b, Math.hypot(s[0] + ex * t - x, s[1] + ez * t - z)); } return b; };
    // the lines' ends: each either at another line, in a tunnel, or finished by a stop or a portal (W.marks.railEnds)
    let open = 0; const ends = W.marks.railEnds || [];
    for (const [li, r] of D.rail.entries()) { const p = r.p, n = p.length / 3;
      for (const k of [0, n - 1]) { const x = p[k * 3] / 10, z = p[k * 3 + 1] / 10, g = r.g[k ? n - 2 : 0]; if (g === 2) continue;
        const joined = D.rail.some((r2, lj) => lj !== li && (() => { const q = r2.p; for (let j = 0; j + 1 < q.length / 3; j++) { const ax = q[j * 3] / 10, az = q[j * 3 + 1] / 10, bx = q[j * 3 + 3] / 10, bz = q[j * 3 + 4] / 10, ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1))); if (Math.hypot(ax + ex * t - x, az + ez * t - z) < 4) return true; } return false; })());
        if (!joined && !ends.some(e => Math.hypot(e[0] - x, e[1] - z) < 3)) open++; } }
    // the plants (the trees of the forest and the sasa): within 64 m of the road's centre line, past the barrier line (those taken out for the
    // life in the woods' glades, World.life: scaled to nothing, counted apart)
    let plants = 0, far = 0, onRoad = 0, cut = 0, onRail = 0; const badF = [], badR = [], badB = [];
    W.root.traverse(o => {
      if (!o.isInstancedMesh || o.material !== W.treeMat) return;
      for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); const e = m4.elements; if (e[0] === 0 && e[5] === 0 && e[10] === 0) { cut++; continue; }
        v.setFromMatrixPosition(m4); const x = v.x + o.position.x, z = v.z + o.position.z, n = A.vrNear(x, z); plants++;
        if (n.i < 0 || n.d > 64) { far++; if (badF.length < 4) badF.push([+x.toFixed(0), +z.toFixed(0)]); }
        else if (n.dd < 0.6) { onRoad++; if (badR.length < 4) badR.push([+x.toFixed(1), +z.toFixed(1), +n.dd.toFixed(2)]); }
        if (railD(x, z) < 3) { onRail++; if (badB.length < 4) badB.push([+x.toFixed(1), +z.toFixed(1)]); } }
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
    return { S, plants, cut, thin: W.thinned || 0, far, onRoad, badF, badR, onRail, badB, open, ends: ends.length, nBld: W.bldBoxes.length, bOn, bFar, bBad, tiles, tileFar, dK, dH, water, bridge,
      fuji: fuji ? { depthTest: fuji.material.depthTest, ro: fuji.renderOrder, tris: fuji.geometry.index.count / 3, culled: fuji.frustumCulled } : null, farTris, farN };
  });
  const S = r.S;
  T.check('the old spa towns: 1200+ of OpenStreetMap\'s buildings within 60 m, none on the road (every box past the barrier line), none beyond 75 m (its nearest corner)', r.nBld > 1200 && r.bOn === 0 && r.bFar === 0,
    `${r.nBld} buildings, ${r.bOn} on the road ${JSON.stringify(r.bBad)}, ${r.bFar} far`);
  T.check('the forest, thinned for the phone: the canopy model\'s trees (12 000-20 000 of its 34 000) and more where the woods are (3 500-8 000), the cedars fewer than the others, sasa on the verges; every plant within 64 m of the road (the rule of 60 m), past the barrier line, no tree on the railway; every one planted drawn but those the road\'s thinning leaves out (W.thinned)',
    S.trees > 12000 && S.trees < 20000 && S.fill > 3500 && S.fill < 8000 && S.cedars < 0.4 * (S.trees + S.fill) && S.sasa > 2500 && r.plants + r.cut + r.thin >= S.trees + S.fill + S.sasa && r.cut < 0.15 * (r.plants + r.cut) && r.far === 0 && r.onRoad === 0 && r.onRail === 0,
    `${S.trees} + ${S.fill} trees (${S.cedars} cedars), ${S.sasa} sasa, ${r.plants} drawn (${r.cut} taken out for the glades, ${r.thin} left out by the road's thinning, W.thinned); ${r.far} beyond 64 m ${JSON.stringify(r.badF)}, ${r.onRoad} on the road ${JSON.stringify(r.badR)}, ${r.onRail} on the railway ${JSON.stringify(r.badB)}`);
  T.check('the mountain railway: ~5.8 km of it (all its data, out to ~170 m from the road), the one level crossing, within 300 m of Kowakidani, hydrangeas along it, the stations\' platforms',
    S.railM > 5000 && S.crossings === 1 && r.dK < 300 && S.hydrangeas > 500, `${S.railM} m, ${S.crossings} crossings (${Math.round(r.dK)} m from Kowakidani), ${S.hydrangeas} hydrangeas`);
  T.check('the railway finished: every free end of a line has a buffer stop (by the road) or a tunnel\'s portal in a hill (farther out), none ends in the open',
    r.open === 0 && S.stops >= 2 && S.portals >= 6 && r.ends === S.stops + S.portals, `${S.stops} stops, ${S.portals} portals, ${r.open} open ends`);
  T.check('the railway\'s bridge at Deyama over the road, 5.5 m above it at least (a car passes under it)', !!r.bridge && r.bridge.clear >= 5.5 && r.bridge.clear < 20, JSON.stringify(r.bridge));
  T.check('the villages\' utility poles, the old road\'s stones, the torii at Hatajuku (within 400 m of the place on the HUD)', S.poles > 50 && S.paving > 500 && r.dH < 400,
    `${S.poles} poles, ${S.paving} pieces of paving, the torii ${Math.round(r.dH)} m from Hatajuku`);
  T.check('the corridor narrowed (the rule of 60 m): 700-1600 tiles, no tile\'s middle farther than 345 m from the road', r.tiles > 700 && r.tiles < 1600 && r.tileFar === 0, `${r.tiles} tiles (${S.tiles} full), ${r.tileFar} farther`);
  T.check('Lake Shōjin by the road: its water there', r.water >= 4, `${r.water} of the points beside it on water`);
  T.check('the far view (the caldera, Lake Ashi, the sea, Mount Fuji): the track\'s def.fuji \'real\', Fuji in the far land\'s meshes, hidden by every ridge in front of it (no mesh of its own)',
    S.far > 15000 && r.farTris > 10000 && r.farN >= 8 && !r.fuji && S.fujiOver === false, `${S.far} nodes, ${r.farTris} triangles in ${r.farN} blocks; Fuji ${JSON.stringify(r.fuji)}`);
  // without def.fuji 'real': Fuji's massif in a mesh of its own over the far ridges (the other choice on the page of decisions)
  const q = await page.evaluate(() => { const g = window.__game, d = Core.TRACKS.find(t => t.id === 'hakone'), f0 = d.fuji; delete d.fuji; Render.buildWorld(g.race.track, 1, 2);
    let fuji = null, farTris = 0; Render.world.root.traverse(o => { if (o.name === 'hkFuji') fuji = o; if (o.name === 'hkFar') farTris += o.geometry.index.count / 3; });
    const res = { fuji: fuji ? { depthTest: fuji.material.depthTest, ro: fuji.renderOrder, tris: fuji.geometry.index.count / 3 } : null, over: Render.world.stats.fujiOver, farTris };
    if (f0 === undefined) delete d.fuji; else d.fuji = f0; Render.buildWorld(g.race.track, 1, 2); return res; });
  T.check('without def.fuji \'real\': Fuji\'s massif in a mesh of its own over the far ridges (no depth test, drawn before the near world), its triangles out of the far land\'s',
    !!q.fuji && q.fuji.depthTest === false && q.fuji.ro < 0 && q.fuji.tris > 300 && q.over === true && q.farTris < r.farTris, JSON.stringify(q));
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
