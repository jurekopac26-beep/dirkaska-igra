// Meritev ljudi na progi: prizori (oglišča na osebo), instancirani gledalci in osebje (crowd: oglišča figure, število, kje stojijo).
//   node tools/ljudje/videz/meri.mjs <proga>
import { serve, launch, openGame, REPO } from '../../../tests/browser/lib.mjs';
const id = process.argv[2];
const srv = await serve(REPO), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' }, { width: 844, height: 390 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const g = window.__game; g.pause(); const T = g.race.track, st = Render.world.peopleStats, W = Render.world.peopleW;
    const out = { scenes: st ? st.scenes.length : 0, people: st ? st.people : 0, verts: st ? st.verts : 0 };
    if (W) { const per = {}; for (const Sc of W.scenes) for (const p of Sc.people) { const k = p.P.o && p.P.o.lite ? 'lite' : p.P.o && p.P.o.kid ? 'kid' : 'full'; (per[k] || (per[k] = [])).push(p.P.nv); }
      out.perPerson = Object.fromEntries(Object.entries(per).map(([k, a]) => [k, { n: a.length, avg: Math.round(a.reduce((x, y) => x + y, 0) / a.length), min: Math.min(...a), max: Math.max(...a) }])); }
    let crowdN = 0, geoV = 0, meshes = 0; const pts = [];
    Render.scene.traverse(m => { if (m.isInstancedMesh && m.name === 'crowd') { meshes++; crowdN += m.count; geoV = m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count;
      const e = new THREE.Matrix4(), v = new THREE.Vector3(); for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, e); v.setFromMatrixPosition(e).applyMatrix4(m.matrixWorld); pts.push([v.x, v.z]); } } });
    // where along the track: nearest sample (s, side, offset)
    const at = pts.map(([x, z]) => { let bi = 0, bd = 1e18; for (let i = 0; i < T.N; i++) { const d = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } }
      const side = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; return [Math.round(bi * T.ds), Math.sign(side), Math.round(Math.abs(side))]; });
    const cl = {}; for (const [s, sd, off] of at) { const k = Math.round(s / 50) * 50 + (sd > 0 ? 'R' : 'L'); cl[k] = (cl[k] || 0) + 1; }
    out.crowd = { instances: crowdN, meshes, vertsPerFigure: geoV, clusters: Object.entries(cl).sort((a, b) => b[1] - a[1]).slice(0, 25) };
    return out;
  });
  console.log(JSON.stringify(r));
  if (errors.length) console.log('napake:', errors.slice(0, 5));
} finally { await browser.close(); await srv.close(); }
