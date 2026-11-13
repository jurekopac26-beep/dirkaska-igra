// The road's look (js/world-cesta.js; Realizem E0, the first piece: docs/realizem.md »E0, prvi kos«). On the real tracks named in
// World.cesta.PROGE the road's meshes and the lines' meshes take a copy of the builder's material with the wear in its shader (streaks, dust
// by the edges, stretches of newer asphalt, an open road's oil strips and wheel tracks, drips where the cars brake; worn paint): Spa (a
// circuit) and Tianmen (an open road) take it, every road mesh and the lines; the same world built without it has as many meshes and
// vertices (no draw call and no vertex more), and the picture from the chase camera changes only with the wear's strengths (the same frame
// twice is the same picture); Livorno's centre line by the country's rules (World.cesta.crte: Italy, white, dashes and solid before the
// bends); every track of PROGE is in the game and its country in the table of markings; a track not in PROGE is built as before (Jezero);
// on NIZKA the programs compile too; no errors.
// The second piece (docs/realizem.md »E0, drugi kos«): an open road's asphalt ends in a broken edge in the road's shader, the shoulder's
// gravel in the bites (Tianmen: the profile 4096 x 2, most of the two edges broken, every line mesh with its place on the road, ceSO, and
// the paint's shader sharing the road's uniforms: the edge lines break off with the asphalt; the picture changes with the edge and only
// with it); Pikes Peak takes the look (its road mesh holds its own paint: only the asphalt wears, its edge broken too); Livorno's markings
// across the road (World.cesta.precne: Italy's sizes for crossings, stop and give-way lines; at OpenStreetMap's places, LV_DATA.onRoad, in
// the lines' meshes, no centre line through a crossing, the vertices well under 1 % of the world's); Livorno's side roads for the look
// (World.cesta.stranske: a strip through an opening in the wall at each mouth), OpenStreetMap's lamps and stops, the track's model untouched.
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the road\'s look');
const srv = await serve();
const browser = await launch();
// the world on screen: what took the look (the world's own count, and counted here), the road's material against the builder's
const look = (page) => page.evaluate(() => {
  const W = Render.world, A = W.asphaltMat, R = W.cestaMat || null, r = { cesta: W.cesta || null, meshes: 0, verts: 0, road: 0, paint: 0, paintV: 0, plain: 0, roadMats: 0 }, rm = new Set();
  W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; r.meshes++; r.verts += o.geometry.attributes.position.count; const m = o.material; if (!m || Array.isArray(m)) return;
    if (m.userData.cesta === 'asfalt') { r.road++; rm.add(m); } else if (m.userData.cesta === 'barva') { r.paint++; r.paintV += o.geometry.attributes.position.count; } else if (m === A) r.plain++; });
  r.roadMats = rm.size;
  if (R) { const U = R.userData.ceU, P = U.uCeP.value.image, N = U.uCeN.value.image;
    r.mat = { lambert: !!R.isMeshLambertMaterial, map: R.map === A.map, vc: R.vertexColors === A.vertexColors, col: R.color.getHex() === (A.userData.dry || A.color).getHex() || R.color.getHex() === A.color.getHex(), own: R !== A, only: rm.size === 1 && rm.has(R),
      profil: [P.width, P.height], sum: [N.width, N.height], dirka: U.uCeA.value.y, prah: U.uCeA.value.z, olje: U.uCeA.value.w, len: Math.round(1 / U.uCeA.value.x) === Math.round(window.__game.race.track.len) }; }
  return r;
});
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  const tab = await page.evaluate(() => { const C = World.cesta, ids = Object.keys(C.PROGE), by = new Map(Core.TRACKS.map(d => [d.id, d]));
    return { ids, missing: ids.filter(id => !by.has(id)), noCountry: ids.filter(id => by.has(id) && !C.CRTE[by.get(id).name.slice(by.get(id).name.lastIndexOf(',') + 1).trim()]),
      kinds: ids.filter(id => !['dirka', 'cesta'].includes(C.PROGE[id].vrsta)) }; });
  T.check('the tracks that take the look are in the game, each a circuit or an open road, its country in the table of markings',
    tab.ids.length >= 12 && !tab.missing.length && !tab.noCountry.length && !tab.kinds.length, JSON.stringify(tab));

  await startTrack(page, 'spa');
  const spa = await look(page);
  T.check('Spa: the road\'s meshes and the lines\' take the look (the world\'s count is what is in the world)',
    spa.cesta && spa.cesta.id === 'spa' && spa.cesta.asfalt >= 10 && spa.cesta.barva >= 10 && spa.road === spa.cesta.asfalt && spa.paint === spa.cesta.barva, JSON.stringify(spa));
  T.check('Spa: one road material, a copy of the builder\'s (its texture, its colours), a circuit\'s; the lap\'s profile 2048 x 1 over its length, the noise 128 x 128',
    spa.mat && spa.mat.lambert && spa.mat.map && spa.mat.vc && spa.mat.own && spa.mat.only && spa.mat.dirka === 1 && spa.mat.olje === 0 && spa.mat.prah > 0 && spa.mat.len && spa.mat.profil.join() === '2048,1' && spa.mat.sum.join() === '128,128', JSON.stringify(spa.mat));
  // the chase camera's picture: the same frame twice, then with the wear's strengths at zero (the road as the builder's), then back
  const pic = await page.evaluate(async () => {
    const g = window.__game, P = g.race.cars[0], W = Render.world, U = W.cestaMat.userData.ceU; g.pause();
    const up = World.update; World.update = (w, t, ...a) => up(w, 100, ...a);   // (the world's clock stopped: its flags, its crowd)
    const shot = () => { const c = Render.snapshot(P, 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 9) n++; return n; };
    try {
      shot(); shot();   // (first, the view settled)
      const a = shot(), b = shot(), keep = ['uCeA', 'uCeB', 'uCeC'].map(k => U[k].value.clone());
      U.uCeA.value.z = 0; U.uCeA.value.w = 0; U.uCeB.value.set(0, 0, 0, 0); U.uCeC.value.w = 0;
      const c = shot();
      ['uCeA', 'uCeB', 'uCeC'].forEach((k, i) => U[k].value.copy(keep[i]));
      const d = shot();
      return { px: a.length / 4, same: diff(a, b), plain: diff(a, c), back: diff(a, d) };
    } finally { World.update = up; }
  });
  T.check('Spa: the wear shows from the chase camera (the picture changes with its strengths, and only with them: the same frame twice the same picture)',
    pic.plain > pic.px * 0.02 && pic.same <= pic.px * 0.002 && pic.back <= pic.px * 0.002, JSON.stringify(pic));

  // a track not in the table is built as before; and Spa without the look (taken out of the table for one build): as many meshes and
  // vertices (no draw call and no vertex more), the builder's material on the road
  const off = await page.evaluate(() => { const C = World.cesta, keep = C.PROGE.spa; delete C.PROGE.spa; return !!keep && (window.__cestaSpa = keep, true); });
  await startTrack(page, 'jezero');
  const jez = await look(page);
  T.check('a track not in the table (Jezero) is built as before: nothing takes the look', jez.cesta === null && jez.road === 0 && jez.paint === 0 && jez.plain > 0, JSON.stringify(jez));
  await startTrack(page, 'spa');
  const spa0 = await look(page);
  await page.evaluate(() => { World.cesta.PROGE.spa = window.__cestaSpa; });
  T.check('Spa built without the look: the same meshes and vertices, the builder\'s material on the road again (the look adds no draw call and no vertex)',
    off && spa0.cesta === null && spa0.road === 0 && spa0.paint === 0 && spa0.meshes === spa.meshes && spa0.verts === spa.verts && spa0.plain === spa.plain + spa.road, JSON.stringify({ spa0, meshes: spa.meshes, verts: spa.verts, plain: spa.plain, road: spa.road }));

  await startTrack(page, 'tianmen');
  const tia = await look(page);
  T.check('Tianmen: an open road\'s look (the lanes\' oil strip), every road mesh and the lines',
    tia.cesta && tia.cesta.asfalt >= 10 && tia.cesta.barva >= 10 && tia.road === tia.cesta.asfalt && tia.mat && tia.mat.dirka === 0 && tia.mat.olje > 0 && tia.mat.only && tia.mat.len, JSON.stringify(tia));
  // the broken edge: the road's material reads it from the profile's second row; every line mesh knows its place on the road (ceSO, as
  // the road's UVs) and its material shares the road's uniforms (the lines break off where the asphalt does)
  const tE = await page.evaluate(() => {
    const W = Render.world, U = W.cestaMat.userData.ceU, D = W.cestaRobData; let n = 0, so = 0, shared = 0;
    W.root.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.userData.cesta !== 'barva') return; n++;
      const A = o.geometry.attributes.ceSO, P = o.geometry.attributes.position; if (A && A.itemSize === 2 && A.count === P.count) so++;
      const pu = o.material.userData.ceU; if (pu && pu.uCeE === U.uCeE && pu.uCeF === U.uCeF && pu.uCeP === U.uCeP) shared++; });
    return { rob: U.uCeE ? +U.uCeE.value.x.toFixed(3) : null, deep: U.uCeF ? +U.uCeF.value.x.toFixed(3) : null, gravel: !!(U.uCeM && U.uCeM.value && U.uCeM.value.image),
      shoulders: D ? D.shoulders : null, share: W.cesta.rob, paint: n, so, shared };
  });
  T.check('Tianmen: the asphalt\'s edge broken (the profile 4096 x 2) on most of the road\'s two edges, the shoulder\'s gravel in the bites; every line mesh knows its place on the road and breaks off with the asphalt',
    tia.mat.profil.join() === '4096,2' && tE.rob > 0.1 && tE.rob < 0.4 && tE.deep > 0.1 && tE.gravel && tE.shoulders >= 1 && tE.share >= 80 && tE.paint >= 10 && tE.so === tE.paint && tE.shared === tE.paint, JSON.stringify(tE));
  const tPic = await page.evaluate(async () => {
    const g = window.__game, R = g.race, T = R.track, P = R.cars[0], W = Render.world, U = W.cestaMat.userData.ceU; g.pause();
    const up = World.update; World.update = (w, t, ...a) => up(w, 100, ...a);
    // (the car on a stretch of the open road, 600 m in, on the racing line; the others out of the picture)
    const i = T.idx(T.startS + 600), o = T.rl ? T.rl[i] : 0; P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
    P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
    const hid = R.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(v => v && v.grp.visible); for (const v of hid) v.grp.visible = false;
    Render.resetCam(); for (let k = 0; k < 6; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await new Promise(r => requestAnimationFrame(r)); }
    const shot = () => { const c = Render.snapshot(P, 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 9) n++; return n; };
    try {
      shot(); shot();
      const a = shot(), b = shot(), e = [U.uCeE.value.x, U.uCeF.value.x];
      U.uCeE.value.x = 0; U.uCeF.value.x = 0;   // (no bite anywhere: the edge as the builder's)
      const c = shot();
      U.uCeE.value.x = e[0]; U.uCeF.value.x = e[1];
      const d = shot();
      return { px: a.length / 4, same: diff(a, b), plain: diff(a, c), back: diff(a, d) };
    } finally { World.update = up; for (const v of hid) v.grp.visible = true; }
  });
  T.check('Tianmen: the broken edge shows from the chase camera (the picture changes without it, and only with it: the same frame twice the same picture)',
    tPic.plain > tPic.px * 0.002 && tPic.same <= tPic.px * 0.002 && tPic.back <= tPic.px * 0.002, JSON.stringify(tPic));

  // OpenStreetMap's bus stop (package E1): the map has no road beside this one that a car could take and no street lamps, only the stop
  const tS = await page.evaluate(() => { const W = Render.world, T = window.__game.race.track, d = T.def.postaje || [], p = W.postaja; let m = 1e9, mi = 0;
    if (p) for (let i = 0; i < T.N; i++) { const q = (p[0] - T.px[i]) ** 2 + (p[2] - T.pz[i]) ** 2; if (q < m) { m = q; mi = i; } }
    return { osm: d.length, side: (T.def.stranske || []).length, stops: W.stats.stops, d: +Math.sqrt(m).toFixed(1), bar: p ? +Math.min(T.bl[mi], T.br[mi]).toFixed(1) : 0, dy: p ? +(p[1] - T.hy[mi]).toFixed(2) : 9, mouths: (W.cestaRob || []).filter(u => u[2] !== 0).length }; });
  T.check('Tianmen: OpenStreetMap\'s bus stop for the look (a pole behind the barrier, on ground about level with the road); no side roads (the map has none)',
    tS.osm === 1 && tS.stops === 1 && tS.side === 0 && tS.mouths === 0 && tS.d >= tS.bar + 0.5 && Math.abs(tS.dy) <= 1.5, JSON.stringify(tS));

  await startTrack(page, 'livorno');
  const liv = await look(page);
  const cl = await page.evaluate(() => {
    const T = window.__game.race.track, C = World.cesta.crte(T, { r: 140, pred: 40 }), W = Render.world, L = T.len, sAt = (d) => ((T.startS + d) % L + L) % L; let dash = 0, solid = 0, iS = -1, iN = -1;
    // (the crossings' spans, where the builder leaves the centre line out: not where it is looked for)
    const gap = new Uint8Array(T.N), X = World.cesta.precne(T, C, (LV_DATA.onRoad || []).map(([d, k, x]) => [sAt(d), k, x]), { rob: 0.38, sred: 0.08 });
    for (const [a, b] of X.brez) for (let i = Math.ceil(a / T.ds) - 1; i <= Math.floor(b / T.ds) + 1; i++) gap[((i % T.N) + T.N) % T.N] = 1;
    for (let i = 0; i < T.N; i++) { if (C.at[i] === 1) dash++; else if (C.at[i] === 2) { solid++; if (iS < 0 && i > 50 && !gap[i]) iS = i; } else if (iN < 0 && i > 50 && C.at[i - 1] === 0 && C.at[i + 1] === 0) iN = i; }
    // a vertex of the lines at the road's middle: on a sample of the solid line, none on a sample in a gap between two dashes
    const at = (i) => { const x = T.px[i] + T.nx[i] * 0.08, z = T.pz[i] + T.nz[i] * 0.08; let hit = 0;
      W.root.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.userData.cesta !== 'barva') return; const P = o.geometry.attributes.position;
        for (let k = 0; k < P.count; k++) if (Math.abs(P.getX(k) - x) < 0.02 && Math.abs(P.getZ(k) - z) < 0.02) hit++; });
      return hit; };
    return { drzava: C.drzava, rob: C.rob, sred: C.sred, dvojna: C.dvojna, crta: C.crta, N: T.N, dash, solid, onSolid: at(iS), inGap: at(iN) };
  });
  T.check('Livorno: the centre line by the country\'s rules (Italy: white, a broken line, one solid line before and through the bends), drawn in the lines\' meshes, worn with them',
    liv.cesta && liv.cesta.barva >= 10 && cl.drzava === 'Italija' && cl.rob === 'bela' && cl.sred === 'bela' && cl.dvojna === false && cl.dash > cl.N * 0.05 && cl.solid > cl.N * 0.2 && cl.onSolid >= 1 && cl.inGap === 0 && liv.paintV > cl.N * 4.5, JSON.stringify({ cl, paintV: liv.paintV, cesta: liv.cesta }));
  // the markings across the road: the country's sizes (World.cesta.precne on a stretch of Livorno's road: a crossing in town and one on a
  // main road, a stop line and a give-way line in each lane), then OpenStreetMap's (LV_DATA.onRoad) in the world's lines' meshes
  const mk = await page.evaluate(() => {
    const T = window.__game.race.track, Wc = World.cesta, C = Wc.crte(T, { r: 140, pred: 40 }), W = Render.world, L = T.len, N = T.N, ds = T.ds, e = 1e-6;
    const wA = (s) => T.wAt(T.idx(((s % L) + L) % L)) - 0.38, sAt = (d) => ((T.startS + d) % L + L) % L;
    const one = (it) => Wc.precne(T, C, [it], { rob: 0.38, sred: 0.08 });
    const zebra = (s, x) => { const u = one([s, 0, x]), Lx = x ? 4 : 2.5, P = u.kosi; if (!P.length) return false; let ok = P.length >= 4, sum = 0;
      P.forEach((q, k) => { ok = ok && q[4] === 0 && Math.abs(q[0] - (s - Lx / 2)) < e && Math.abs(q[1] - (s + Lx / 2)) < e && Math.abs(q[3] - q[2] - 0.5) < e && Math.abs(q[3]) <= wA(s) - 0.15 && Math.abs(q[2]) <= wA(s) - 0.15
        && (k === 0 || Math.abs(q[2] - P[k - 1][2] - 1) < e); sum += q[2] + q[3]; });
      return ok && Math.abs(sum) < 1e-3 && u.brez.length === 1 && u.brez[0][0] <= s - Lx / 2 && u.brez[0][1] >= s + Lx / 2; };
    const stop = (s, x) => { const P = one([s, 1, x]).kosi, q = P[0]; return P.length === 1 && q[4] === 0 && Math.abs(q[1] - q[0] - 0.5) < e && (x > 0 ? Math.abs(q[1] - s) < e && q[2] > 0.08 && Math.abs(q[3] - wA(s)) < e : Math.abs(q[0] - s) < e && q[3] < -0.08 && Math.abs(q[2] + wA(s)) < e); };
    const give = (s, x) => { const P = one([s, 2, x]).kosi; return P.length >= 3 && P.every(q => q[4] === 1 && q[0] === s && Math.abs(q[1] - (s - x * 0.6)) < e && Math.abs(q[3] - q[2] - 0.5) < e && (x > 0 ? q[2] > 0.08 && q[3] <= wA(s) + e : q[3] < -0.08 && q[2] >= -wA(s) - e)); };
    const rules = { zebra: zebra(1000, 0), zebraMain: zebra(1050, 1), stop: stop(1100, 1), stopOn: stop(1150, -1), give: give(1200, 1), giveOn: give(1250, -1) };
    // OpenStreetMap's places: each piece's first corner is a vertex of the lines' meshes (as the builder lays it: on the road at y + 0.034)
    const items = (LV_DATA.onRoad || []).map(([d, k, x]) => [sAt(d), k, x]), X = Wc.precne(T, C, items, { rob: 0.38, sred: 0.08 }), cell = new Map(), key = (x, z) => Math.floor(x / 0.5) + ',' + Math.floor(z / 0.5);
    W.root.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.userData.cesta !== 'barva') return; const P = o.geometry.attributes.position;
      for (let k = 0; k < P.count; k++) { const x = P.getX(k), z = P.getZ(k), c = key(x, z); if (!cell.has(c)) cell.set(c, []); cell.get(c).push(x, z); } });
    const at = (s, o) => { const f = (((s % L) + L) % L) / ds, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f);
      return [T.px[i0] + T.nx[i0] * o + (T.px[i1] + T.nx[i1] * o - T.px[i0] - T.nx[i0] * o) * t, T.pz[i0] + T.nz[i0] * o + (T.pz[i1] + T.nz[i1] * o - T.pz[i0] - T.nz[i0] * o) * t]; };
    const hit = ([x, z]) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = cell.get((Math.floor(x / 0.5) + a) + ',' + (Math.floor(z / 0.5) + b)); if (v) for (let k = 0; k < v.length; k += 2) if (Math.abs(v[k] - x) < 0.03 && Math.abs(v[k + 1] - z) < 0.03) return true; } return false; };
    let laid = 0, verts = 0, cLine = 0;
    for (const q of X.kosi) { if (hit(at(q[0], q[2]))) laid++; if (q[4]) verts += 3; else { let n = 2; for (let i = Math.floor(q[0] / ds) + 1; i * ds < q[1] - 0.05; i++) if (i * ds > q[0] + 0.05) n++; verts += 2 * n; } }
    // no centre line through a crossing: no vertex of the lines at the centre line's edges (+-0.08) on the samples inside its stripes
    for (const [s, k, x] of items) if (k === 0) { const Lx = x ? 4 : 2.5; for (let i = Math.ceil((s - Lx / 2) / ds); i * ds <= s + Lx / 2; i++) for (const o of [-0.08, 0.08]) if (hit(at(i * ds, o))) cLine++; }
    const n = [0, 1, 2].map(k => items.filter(it => it[1] === k).length);
    return { rules, crossings: n[0], stops: n[1], giveWays: n[2], pieces: X.kosi.length, laid, verts, cLine };
  });
  T.check('Livorno: the markings across the road by the country\'s rules (Italy: a crossing\'s stripes 0.5 m with gaps of 0.5 m, 2.5 m long in town and 4 m on a main road, about the road\'s middle; a stop line 0.5 m across its lane; a give-way line of triangles 0.5 x 0.6 m pointing at the driver who gives way)',
    Object.values(mk.rules).every(Boolean), JSON.stringify(mk.rules));
  T.check('Livorno: OpenStreetMap\'s crossings, stop and give-way lines laid in the lines\' meshes (each piece where the rules put it), no centre line through a crossing, their vertices under 1 % of the world\'s',
    mk.crossings >= 20 && mk.stops >= 1 && mk.giveWays >= 1 && mk.pieces >= mk.crossings * 4 + mk.stops + mk.giveWays * 3 && mk.laid === mk.pieces && mk.cLine === 0 && mk.verts > 0 && mk.verts <= liv.verts * 0.01 && mk.verts <= liv.paintV * 0.05,
    JSON.stringify({ mk: Object.assign({}, mk, { rules: undefined }), worldV: liv.verts, paintV: liv.paintV }));

  // the side roads, the lamps and the stops of OpenStreetMap, for the look (package E): a strip through each opening, the furniture off
  // the road, and the track's model as a track built alone has it
  const sr = await page.evaluate(() => {
    const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === 'livorno'));
    const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
    const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = []; let strips = 0;
    W.root.traverse(o => { if (!o.isMesh || !o.userData.stranska) return; strips++; const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
    let far = 0, worst = 0;
    for (const [a, b, sd] of M) {   // (the fence line across the mouth: the strip's rows of vertices pass through it, a row every few metres)
      let m = 1e9;
      for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
      m = Math.sqrt(m); if (m > worst) worst = m; if (m > 4.5) far++;
    }
    return { n: W.stranske, osm: LV_DATA.side.length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, far, worst: +worst.toFixed(2),
      lamps: W.stats.lamps, osmLamps: LV_DATA.lamps.length, stops: W.stats.stops, osmStops: LV_DATA.stops.length, posts: W.stats.mouthPosts, model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
  });
  T.check('Livorno: OpenStreetMap\'s side roads for the look (a strip of asphalt through an opening in the wall at each mouth, the mouths 3 to 40 m wide, a row of orange posts across each opening), its street lamps and bus stops behind the fence; the track\'s model as a track built alone has it',
    sr.n >= sr.osm * 0.8 && sr.n <= sr.osm && sr.mouths === sr.n && sr.wMin >= 3 && sr.wMax <= 40 && sr.strips >= 1 && sr.stripV > sr.n * 20 && sr.stripV <= liv.verts * 0.1 && sr.far === 0 &&
    sr.lamps >= sr.osmLamps * 0.75 && sr.lamps <= sr.osmLamps && sr.stops >= sr.osmStops * 0.85 && sr.stops <= sr.osmStops && sr.posts >= sr.n * 2 && sr.posts <= sr.n * 27 && sr.model, JSON.stringify(sr));

  // the posts across the openings: evenly along the fence line, each on the surface drawn under it, none near the road's asphalt
  const sp = await page.evaluate(() => {
    const W = Render.world, T = window.__game.race.track, P = W.stebricki || [], n = P.length / 4, meshes = [], rows = new Map();
    for (let k = 0; k < n; k++) { const id = P[k * 4 + 3]; if (!rows.has(id)) rows.set(id, []); rows.get(id).push(k); }
    let gMin = 1e9, gMax = 0, lone = 0, road = 1e9, none = 0, off = 0;
    for (const ks of rows.values()) {
      if (ks.length < 2) lone++;
      for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); }
    }
    for (let k = 0; k < n; k++) {   // (the nearest point of the road's middle line: the post's distance from the asphalt's edge there)
      const x = P[k * 4], z = P[k * 4 + 2]; let m = 1e18, mi = 0;
      for (let i = 0, e = T.open ? T.N - 1 : T.N; i < e; i++) {
        const j = (i + 1) % T.N, dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], t = Math.max(0, Math.min(1, ((x - T.px[i]) * dx + (z - T.pz[i]) * dz) / (dx * dx + dz * dz))), d = (x - T.px[i] - dx * t) ** 2 + (z - T.pz[i] - dz * t) ** 2;
        if (d < m) { m = d; mi = i; }
      }
      road = Math.min(road, Math.sqrt(m) - T.wAt(mi));
    }
    // (a ray down each post against every drawn mesh: the highest surface under it, the post's own top and its foot's aside)
    W.root.updateMatrixWorld(true);
    W.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o); });
    const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      const y0 = P[k * 4 + 1]; let top = -1e9;
      rc.set(from.set(P[k * 4], y0 + 3, P[k * 4 + 2]), dn); rc.far = 6;
      for (const h of rc.intersectObjects(meshes, false)) { const y = h.point.y; if (Math.abs(y - (y0 + 1)) > 2e-3 && Math.abs(y - (y0 + 0.04)) > 2e-3 && y < y0 + 0.6 && y > top) top = y; }
      if (top < -1e8) none++; else off = Math.max(off, Math.abs(y0 - top));
    }
    return { n, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), road: +road.toFixed(1), none, off: +off.toFixed(3) };
  });
  T.check('Livorno: the posts across the openings stand evenly along the fence line (1 to 2.2 m apart, two or more a row), each on the surface drawn under it (within 3 cm: a ray down against the world\'s meshes), none within 2 m of the road\'s asphalt',
    sp.n === sr.posts && sp.rows === sr.n && sp.lone === 0 && sp.gMin >= 1 && sp.gMax <= 2.2 && sp.none === 0 && sp.off <= 0.03 && sp.road >= 2, JSON.stringify(sp));

  // a circuit's access roads (package E1, Nürburg): the same builder, the rail open at each mouth with a row of posts; the circuit's own
  // edge line and kerbs run on across a mouth, and the track's model stays as a track built alone has it
  await startTrack(page, 'nring');
  const nq = await page.evaluate(() => {
    const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === 'nring'));
    const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
    const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], P = W.stebricki || [], rows = new Set(); let strips = 0, far = 0, road = 1e9;
    W.root.traverse(o => { if (!o.isMesh || !o.userData.stranska) return; strips++; const A = o.geometry.attributes.position; for (let k = 0; k < A.count; k++) V.push(A.getX(k), A.getZ(k)); });
    for (const [a, b, sd] of M) { let m = 1e9;
      for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
      if (Math.sqrt(m) > 4.5) far++; }
    for (let k = 0; k < P.length; k += 4) { rows.add(P[k + 3]); let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const d = (P[k] - T.px[i]) ** 2 + (P[k + 2] - T.pz[i]) ** 2; if (d < m) { m = d; mi = i; } } road = Math.min(road, Math.sqrt(m) - T.wAt(mi)); }
    return { n: W.stranske, osm: T.def.stranske.length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, far, posts: P.length / 4, rows: rows.size, road: +road.toFixed(1),
      stat: [W.stats.stranske, W.stats.stebricki], model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
  });
  T.check('Nürburg: OpenStreetMap\'s access roads for the look (a strip through an opening in the rail at each mouth, the mouths 3 to 40 m wide, a row of orange posts across each, none within 2 m of the asphalt); the track\'s model as a track built alone has it',
    nq.n >= nq.osm * 0.8 && nq.n <= nq.osm && nq.mouths === nq.n && nq.wMin >= 3 && nq.wMax <= 40 && nq.strips >= 1 && nq.stripV > nq.n * 20 && nq.stripV <= 4000 && nq.far === 0 &&
    nq.posts >= nq.n * 2 && nq.posts <= nq.n * 27 && nq.rows === nq.n && nq.road >= 2 && nq.stat[0] === nq.n && nq.stat[1] === nq.posts && nq.model, JSON.stringify(nq));

  await startTrack(page, 'pikes');
  const pk = await look(page);
  const pkx = await page.evaluate(() => { const W = Render.world; let own = 0; W.root.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.userData.cesta === 'asfalt' && o.geometry.attributes.paint) own++; }); return { own, rob: !!W.cestaRobData }; });
  T.check('Pikes Peak takes the look: every road mesh (its own paint, crack seals and patches in it: only the asphalt wears; no separate lines\' meshes), an open road\'s, its edge broken',
    pk.cesta && pk.cesta.asfalt >= 30 && pk.road === pk.cesta.asfalt && pk.cesta.barva === 0 && pk.paint === 0 && pkx.own >= 1 && pkx.rob && pk.cesta.rob >= 80 && pk.mat && pk.mat.dirka === 0 && pk.mat.only && pk.mat.profil.join() === '4096,2',
    JSON.stringify({ cesta: pk.cesta, road: pk.road, paint: pk.paint, plain: pk.plain, mat: pk.mat, pkx }));
  T.check('no errors (the road\'s and the paint\'s programs compile)', errors.length === 0, errors.slice(0, 3).join(' | '));

  const low = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(low.page, 'spa');
  const spaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await startTrack(low.page, 'tianmen');
  const tiaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  T.check('NIZKA: the same look (a phone\'s tier; an open road\'s broken edge too), no errors', spaL.cesta && spaL.road === spa.road && spaL.paint === spa.paint && tiaL.cesta && tiaL.cesta.rob === tia.cesta.rob && tiaL.road === tia.road && low.errors.length === 0,
    JSON.stringify([spaL.cesta, tiaL.cesta]) + ' ' + low.errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); srv.close();
}
T.done();
