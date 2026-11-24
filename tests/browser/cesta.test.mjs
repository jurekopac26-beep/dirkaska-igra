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
// Package E1 (docs/realizem/paket-e.md): the same roads for the look on a circuit (Nürburg: the edge line runs on across the mouths) and on
// an open public road (Rio do Rastro: the edge line open at the mouths, the street lamps' poles at the finish on the plateau).
// Package E2: Spa's access roads (every road of the track's data drawn; where one crosses a gravel trap the trap lies over its strip up to the
// opening in the barrier; no grass clump of the verge stands on a strip).
// The passes of group 569c (docs/realizem/paket-e.md »E, stranske ceste: skupina 569c«; js/world-prelaz.js): Llogara's side
// roads (def.stranske) the same way, a row of posts across each opening, the white edge line broken across each mouth (an open road)
// and whole just beside it, the track's model untouched.
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
  // (sideQ, the roads for the look as the world holds them: the mouths and their widths, the strips' meshes and vertices, the mouths with no
  // strip within 4.5 m of the opening (far), the posts, their rows and their least distance from the asphalt; open, the mouths at which the
  // paint at the road's edge is broken off: none of it from 1 m into the mouth to 1 m before its end, some within 3 m before and after)
  const sideQ = (id) => page.evaluate((id) => {
    const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === id));
    const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
    const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], L = [], P = W.stebricki || [], rows = new Set(); let strips = 0, far = 0, open = 0, road = 1e9;
    W.root.traverse(o => { if (!o.isMesh) return; const A = o.geometry.attributes.position;
      if (o.userData.stranska) { strips++; for (let k = 0; k < A.count; k++) V.push(A.getX(k), A.getZ(k)); }
      else if (o.material && !Array.isArray(o.material) && o.material.userData.cesta === 'barva') for (let k = 0; k < A.count; k++) L.push(A.getX(k), A.getZ(k)); });
    for (const [a, b, sd] of M) { let m = 1e9;
      for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
      if (Math.sqrt(m) > 4.5) far++;
      const i0 = Math.floor(a / T.ds) - 8, i1 = Math.ceil(b / T.ds) + 8, ic = T.idx((a + b) / 2); let pre = 0, mid = 0, post = 0;
      for (let k = 0; k < L.length; k += 2) { const x = L[k], z = L[k + 1]; if ((x - T.px[ic]) ** 2 + (z - T.pz[ic]) ** 2 > 1600) continue;
        let bm = 1e18, bi = i0; for (let i = i0; i <= i1; i++) { const q = T.idx(i * T.ds), d = (x - T.px[q]) ** 2 + (z - T.pz[q]) ** 2; if (d < bm) { bm = d; bi = i; } }
        const q = T.idx(bi * T.ds), lat = sd * ((x - T.px[q]) * T.nx[q] + (z - T.pz[q]) * T.nz[q]), w = T.wAt(q); if (lat < w - 0.6 || lat > w - 0.15) continue;
        const al = bi * T.ds + (x - T.px[q]) * T.tx[q] + (z - T.pz[q]) * T.tz[q] - a; if (al > 1 && al < b - a - 1) mid++; else if (al >= -3 && al <= 1) pre++; else if (al >= b - a - 1 && al <= b - a + 3) post++; }
      if (!mid && pre && post) open++; }
    for (let k = 0; k < P.length; k += 4) { rows.add(P[k + 3]); let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const d = (P[k] - T.px[i]) ** 2 + (P[k + 2] - T.pz[i]) ** 2; if (d < m) { m = d; mi = i; } } road = Math.min(road, Math.sqrt(m) - T.wAt(mi)); }
    return { n: W.stranske, osm: T.def.stranske.length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, far, open, posts: P.length / 4, rows: rows.size, road: +road.toFixed(1),
      stat: [W.stats.stranske, W.stats.stebricki], lamps: [W.stats.svetilke || 0, (T.def.svetilke || []).length], model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
  }, id);
  await startTrack(page, 'nring');
  const nq = await sideQ('nring');
  T.check('Nürburg: OpenStreetMap\'s access roads for the look (a strip through an opening in the rail at each mouth, the mouths 3 to 40 m wide, a row of orange posts across each, none within 2 m of the asphalt; the circuit\'s edge line runs on across every mouth); the track\'s model as a track built alone has it',
    nq.n >= nq.osm * 0.8 && nq.n <= nq.osm && nq.mouths === nq.n && nq.wMin >= 3 && nq.wMax <= 40 && nq.strips >= 1 && nq.stripV > nq.n * 20 && nq.stripV <= 4000 && nq.far === 0 && nq.open === 0 &&
    nq.posts >= nq.n * 2 && nq.posts <= nq.n * 27 && nq.rows === nq.n && nq.road >= 2 && nq.stat[0] === nq.n && nq.stat[1] === nq.posts && nq.model, JSON.stringify(nq));

  // a circuit with run-offs (package E2, Spa): every road of the track's data is drawn (the export leaves out what the builder cannot draw);
  // the run-offs lie flat at the road's height, so where an access road crosses a gravel trap the trap is lifted a little and lies over
  // the strip (the gravel stays gravel, as the cars feel it; the road shows from the opening in the barrier on); the verge's grass clumps
  // keep off the strips (the shared verge() reads the builder's cestaKrogi)
  // (spaQ: grav, the strips' triangles whose middle lies on the model's gravel, 3.5 m and more from the asphalt and 1.5 m and more inside the
  // barrier; bare, those of them with nothing but the strip under a ray from above; tufts, the verge's clumps standing on a strip's triangle)
  const spaQ = () => page.evaluate(() => {
    const W = Render.world, T = window.__game.race.track, q = {}, tri = [], oth = [], tf = []; W.root.updateMatrixWorld(true);
    W.root.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const e = o.matrixWorld.elements;
      if (o.isInstancedMesh) { if (o.parent && o.parent.name === 'verge') { const a = o.instanceMatrix.array; for (let k = 0; k < o.count; k++) { const x = a[k * 16 + 12], y = a[k * 16 + 13], z = a[k * 16 + 14]; tf.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[2] * x + e[6] * y + e[10] * z + e[14]); } } return; }
      if (!o.userData.stranska) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); oth.push([o, o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)]); return; }
      const p = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count : p.count;
      for (let k = 0; k < n; k += 3) { const t = []; for (let j = 0; j < 3; j++) { const v = ix ? ix.getX(k + j) : k + j; t.push(p.getX(v), p.getY(v), p.getZ(v)); } tri.push(t); } });
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3(); let grav = 0, bare = 0, tufts = 0;
    for (const t of tri) { const x = (t[0] + t[3] + t[6]) / 3, y = (t[1] + t[4] + t[7]) / 3, z = (t[2] + t[5] + t[8]) / 3; let m = 1e18, i = 0;
      for (let k = 0; k < T.N; k++) { const d = (x - T.px[k]) ** 2 + (z - T.pz[k]) ** 2; if (d < m) { m = d; i = k; } }
      const lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], d = Math.abs(lat), bar = lat > 0 ? T.br[i] : T.bl[i];
      if (d < T.wAt(i) + 3.5 || d > bar - 1.5 || T.surface(T.query(x, z, i, q)) !== 3) continue;
      grav++; org.set(x, y + 2, z); rc.set(org, down); rc.far = 4;
      const c = oth.filter(u => u[1].min.x <= x && x <= u[1].max.x && u[1].min.z <= z && z <= u[1].max.z && u[1].max.y >= y).map(u => u[0]);
      if (!rc.intersectObjects(c, false).some(h => h.point.y > y + 0.01)) bare++; }
    for (let k = 0; k < tf.length; k += 2) { const x = tf[k], z = tf[k + 1];
      for (const t of tri) { const d = (t[5] - t[8]) * (t[0] - t[6]) + (t[6] - t[3]) * (t[2] - t[8]); if (Math.abs(d) < 1e-9) continue;
        const u = ((t[5] - t[8]) * (x - t[6]) + (t[6] - t[3]) * (z - t[8])) / d, v = ((t[8] - t[2]) * (x - t[6]) + (t[0] - t[6]) * (z - t[8])) / d;
        if (u >= 0 && v >= 0 && u + v <= 1) { tufts++; break; } } }
    return { tris: tri.length, grav, bare, clumps: tf.length / 2, tufts, krogi: (W.cestaKrogi || []).length };
  });
  await startTrack(page, 'spa');
  const sq = await sideQ('spa'), sx = await spaQ();
  T.check('Spa: OpenStreetMap\'s access roads for the look (every road of the track\'s data drawn: a strip through an opening in the barrier at each mouth, the mouths 3 to 40 m wide, a row of orange posts across each, none within 2 m of the asphalt; the circuit\'s edge line runs on across every mouth); the track\'s model as a track built alone has it',
    sq.n >= 1 && sq.n === sq.osm && sq.mouths === sq.n && sq.wMin >= 3 && sq.wMax <= 40 && sq.strips >= 1 && sq.stripV > sq.n * 20 && sq.stripV <= 4000 && sq.far === 0 && sq.open === 0 &&
    sq.posts >= sq.n * 2 && sq.posts <= sq.n * 27 && sq.rows === sq.n && sq.road >= 2 && sq.stat[0] === sq.n && sq.stat[1] === sq.posts && sq.model, JSON.stringify(sq));
  T.check('Spa: where an access road crosses a gravel trap the trap lies over its strip; no grass clump of the verge stands on a strip',
    sx.grav >= 10 && sx.bare === 0 && sx.clumps > 200 && sx.tufts === 0 && sx.krogi >= sq.n, JSON.stringify(sx));

  // an open public road's junctions (package E1, Rio do Rastro): every road of the track's data is drawn (the export leaves out what the
  // builder cannot draw), the guardrail open at each mouth with a row of posts, the white edge line broken off there (a public road's
  // junction, unlike a circuit's), the street lamps' poles beside the road at the finish on the plateau
  await startTrack(page, 'rastro');
  const rq = await sideQ('rastro');
  T.check('Rio do Rastro: OpenStreetMap\'s junctions for the look on an open road (every road of the data: a strip through an opening in the guardrail, the mouths 3 to 40 m wide, a row of orange posts across each, none within 2 m of the asphalt; the white edge line open at every mouth; street lamps, no more than the data\'s); the track\'s model as a track built alone has it',
    rq.n >= 1 && rq.n === rq.osm && rq.mouths === rq.n && rq.wMin >= 3 && rq.wMax <= 40 && rq.strips >= 1 && rq.stripV > rq.n * 20 && rq.stripV <= 4000 && rq.far === 0 && rq.open === rq.n &&
    rq.posts >= rq.n * 2 && rq.posts <= rq.n * 27 && rq.rows === rq.n && rq.road >= 2 && rq.stat[0] === rq.n && rq.stat[1] === rq.posts && rq.lamps[0] >= 1 && rq.lamps[0] <= rq.lamps[1] && rq.model, JSON.stringify(rq));

  // the passes' side roads (group 569c, js/world-prelaz.js; an open road): as on Livorno a strip through an opening in the rail at each
  // mouth and a row of posts across it; the white edge line broken across each mouth (a ray down at the line's place in the mouth's
  // middle meets no paint) and whole beside it (12 m before or after the mouth it meets the paint's material); the model untouched
  for (const [id, name] of [['llogara', 'Llogara']]) {
    await startTrack(page, id);
    const ps = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === id));
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], meshes = []; let strips = 0, verts = 0;
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => { if (!o.isMesh) return; verts += o.geometry.attributes.position.count; if (!o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o);
        if (!o.userData.stranska) return; strips++; const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
      let far = 0, worst = 0;
      for (const [a, b, sd] of M) {
        let m = 1e9;
        // (the opening in the rail: where the road's edges cross the fence line, which a road leaving at a slant meets some metres on from the mouth on the asphalt)
        const nj = Math.ceil(b - a + 40); for (let j = 0; j <= nj; j++) { const i = T.idx(a - 20 + (b - a + 40) * j / nj), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
        m = Math.sqrt(m); if (m > worst) worst = m; if (m > 4.5) far++;
      }
      // (the edge line's middle is 0.375 m inside the asphalt's edge: the material of the highest surface there, under the rail's height)
      const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      const top = (s, sd) => { const i = T.idx(s), o = sd * (T.w - 0.375), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; rc.set(from.set(x, T.hy[i] + 1.5, z), dn); rc.far = 4;
        const h = rc.intersectObjects(meshes, false)[0]; return h ? h.object.material : null; };
      const side = [], mid = []; for (const [a, b, sd] of M) { side.push(top(a - 12, sd), top(b + 12, sd)); mid.push(top((a + b) / 2, sd)); }
      const tally = new Map(); for (const m of side) if (m) tally.set(m, (tally.get(m) || 0) + 1);
      const line = ([...tally.entries()].sort((p, q) => q[1] - p[1])[0] || [null])[0];   // (the paint's material: the commonest highest surface beside the mouths)
      let whole = 0, broken = 0; M.forEach((u, k) => { if (side[2 * k] === line || side[2 * k + 1] === line) whole++; if (mid[k] && mid[k] !== line) broken++; });
      return { n: W.stranske, osm: (T.def.stranske || []).length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2,
        worldV: verts, far, worst: +worst.toFixed(2), posts: W.stats.stebricki, stats: W.stats.stranske, whole, broken, paint: !!(line && line.isMeshLambertMaterial && !line.map && line !== W.asphaltMat),
        model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
    }, id);
    T.check(`${name}: OpenStreetMap's side roads for the look (each drawn: a strip of asphalt through an opening in the rail at each mouth, 3 to 40 m wide, a row of orange posts across it); the white edge line broken across each mouth and whole beside it; the track's model as a track built alone has it`,
      ps.osm >= 3 && ps.n === ps.osm && ps.stats === ps.n && ps.mouths === ps.n && ps.wMin >= 3 && ps.wMax <= 40 && ps.strips >= 1 && ps.stripV > ps.n * 20 && ps.stripV <= ps.worldV * 0.05 && ps.far === 0 &&
      ps.posts >= ps.n * 2 && ps.posts <= ps.n * 27 && ps.whole === ps.n && ps.broken === ps.n && ps.paint && ps.model, JSON.stringify(ps));
  }

  await startTrack(page, 'pikes');
  const pk = await look(page);
  const pkx = await page.evaluate(() => { const W = Render.world; let own = 0; W.root.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.userData.cesta === 'asfalt' && o.geometry.attributes.paint) own++; }); return { own, rob: !!W.cestaRobData }; });
  T.check('Pikes Peak takes the look: every road mesh (its own paint, crack seals and patches in it: only the asphalt wears; no separate lines\' meshes), an open road\'s, its edge broken',
    pk.cesta && pk.cesta.asfalt >= 30 && pk.road === pk.cesta.asfalt && pk.cesta.barva === 0 && pk.paint === 0 && pkx.own >= 1 && pkx.rob && pk.cesta.rob >= 80 && pk.mat && pk.mat.dirka === 0 && pk.mat.only && pk.mat.profil.join() === '4096,2',
    JSON.stringify({ cesta: pk.cesta, road: pk.road, paint: pk.paint, plain: pk.plain, mat: pk.mat, pkx }));

  // the side roads of OpenStreetMap on the tracks of group 569a (package E, docs/realizem/paket-e.md): Buriram (a circuit) and
  // Furka (an open road), each built by its own builder; a strip through each mouth, a row of posts across it, the track's
  // model untouched; their countries have no lines of their own in World.cesta.CRTE (no public rules found): no paint at the mouths
  for (const id of ['buriram', 'furka']) {
    await startTrack(page, id);
    const q = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, d = Core.TRACKS.find(t => t.id === id), F = new Core.Track(d), dr = d.name.slice(d.name.lastIndexOf(',') + 1).trim();
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], meshes = []; let strips = 0, verts = 0;
      W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; verts += o.geometry.attributes.position.count; if (!o.userData.stranska) return; strips++;
        const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
      let far = 0;
      for (const [a, b, sd] of M) { let m = 1e9;   // (the strip's rows of vertices pass through the fence line across the mouth)
        for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const e = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (e < m) m = e; } }
        if (Math.sqrt(m) > 4.5) far++; }
      // the posts: evenly along the fence line, two or more a row, each on the surface drawn under it (or set into it), behind the barriers of every leg
      // of the road near it as the walls see it (Track.queryRoute from that leg's nearest sample, a car's hint there), or reaching them by at most a post's
      // radius (10 cm: on the outside of a tight hairpin the fence line's chords, World.cesta.stranske's 0.3 m past the barrier, dip by their sagitta), off the asphalt
      const P = W.stebricki || [], n = P.length / 4, rows = new Map(), qo = {}; let gMin = 1e9, gMax = 0, lone = 0, road = 1e9, bar = 1e9, none = 0, fl = -1e9, sk = 0;
      for (let k = 0; k < n; k++) { const r = P[k * 4 + 3]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(k); }
      for (const ks of rows.values()) { if (ks.length < 2) lone++;
        for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); } }
      for (let k = 0; k < n; k++) { const x = P[k * 4], z = P[k * 4 + 2], D = i => (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2;
        for (let h = 0; h < T.N; h++) { const e = D(h), hp = h > 0 ? h - 1 : T.open ? -1 : T.N - 1, hn = h < T.N - 1 ? h + 1 : T.open ? -1 : 0;
          if (e > 900 || (hp >= 0 && D(hp) < e) || (hn >= 0 && D(hn) < e)) continue;   // (a leg's nearest sample: the distance's local minimum)
          T.queryRoute(x, z, h, qo); const a = qo.a, b = (a + 1) % T.N, t = qo.t, B = qo.d > 0 ? T.br[a] * (1 - t) + T.br[b] * t : T.bl[a] * (1 - t) + T.bl[b] * t;
          bar = Math.min(bar, Math.abs(qo.d) - B); road = Math.min(road, Math.abs(qo.d) - T.wAt(a)); } }
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o); });
      const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      for (let k = 0; k < n; k++) { const y0 = P[k * 4 + 1]; let top = -1e9; rc.set(from.set(P[k * 4], y0 + 3, P[k * 4 + 2]), dn); rc.far = 6;
        for (const h of rc.intersectObjects(meshes, false)) { const y = h.point.y; if (Math.abs(y - (y0 + 1)) > 2e-3 && Math.abs(y - (y0 + 0.04)) > 2e-3 && y < y0 + 0.6 && y > top) top = y; }
        if (top < -1e8) none++; else { fl = Math.max(fl, y0 - top); sk = Math.max(sk, top - y0); } }
      return { n: W.stranske, osm: (d.stranske || []).length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, verts, far,
        posts: n, stats: W.stats.stebricki, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), bar: +bar.toFixed(2), road: +road.toFixed(2), none, fl: +fl.toFixed(3), sk: +sk.toFixed(3),
        open: !!T.open, model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])), drzava: dr, crte: !!World.cesta.CRTE[dr] };
    }, id);
    T.check(`${id}: OpenStreetMap's side roads for the look (a strip through each mouth 3 to 40 m wide, a row of posts across each, 1 to 2.2 m apart, standing on the surface drawn under them or set into it by at most 25 cm, every post behind the barriers of each leg of the road near it or reaching them by at most its radius, at least ${q.open ? '1.5' : '2'} m from the asphalt; no lines of ${q.drzava}'s own: no paint), the track's model as a track built alone has it`,
      q.n >= 1 && q.n >= q.osm * 0.8 && q.n <= q.osm && q.mouths === q.n && q.wMin >= 3 && q.wMax <= 40 && q.strips >= 1 && q.stripV > q.n * 20 && q.stripV <= q.verts * 0.1 && q.far === 0 &&
      q.posts === q.stats && q.rows === q.n && q.lone === 0 && q.gMin >= 1 && q.gMax <= 2.2 && q.none === 0 && q.fl <= 0.03 && q.sk <= 0.25 && q.bar > -0.1 && q.road >= (q.open ? 1.5 : 2) && q.model && !q.crte, JSON.stringify(q));
  }
  // (the side roads of the real tracks of PR #766: OpenStreetMap's roads within ~60 m, a strip through each mouth; an open road's edge line
  // breaks off at the mouth, a circuit's goes on; a side road's own paint only by the country's rules: Japan's stop line, no paint where the
  // country has no row in CRTE (Sweden, Ireland: every row there is a class 0); the posts off the road; the track's model untouched)
  const stranskeQ = (id) => page.evaluate((id) => {
    const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === id));
    const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
    const lat = (x, z, i) => (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i];
    const nearest = (x, z, i0, i1) => { let m = 1e18, mi = 0; for (let i = i0; i <= i1; i++) { const q = T.idx(i * T.ds), d = (x - T.px[q]) ** 2 + (z - T.pz[q]) ** 2; if (d < m) { m = d; mi = i; } } return mi; };
    W.root.updateMatrixWorld(true);
    const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], L = [], WH = [], tri = [], P = W.stebricki || [], rows = new Set(), v = new THREE.Vector3();
    let strips = 0;
    W.root.traverse(o => { if (!o.isMesh) return; const A = o.geometry.attributes.position, pt = (k) => (v.fromBufferAttribute(A, k).applyMatrix4(o.matrixWorld), [v.x, v.z, v.y]);
      if (o.userData.stranska) { strips++; const I = o.geometry.index, n = I ? I.count : A.count; for (let k = 0; k < A.count; k++) { const q = pt(k); V.push(q[0], q[1]); }
        for (let t = 0; t < n; t += 3) tri.push([pt(I ? I.getX(t) : t), pt(I ? I.getX(t + 1) : t + 1), pt(I ? I.getX(t + 2) : t + 2)]); }
      else if (o.material && !Array.isArray(o.material) && o.material.userData.crte) for (let k = 0; k < A.count; k++) { const q = pt(k); L.push(q[0], q[1]); }
      else if (o.geometry.attributes.color && o.material && !o.material.map) { const c = o.geometry.attributes.color; for (let k = 0; k < A.count; k++) if (c.getX(k) > 0.85 && c.getY(k) > 0.85 && c.getZ(k) > 0.8) WH.push(...pt(k)); } });
    const G = new Map(), C = 4, key = (a, b) => a * 100003 + b;   // (the strips' triangles in a grid of 4 m: the strip's surface under a point)
    tri.forEach((t, id) => { for (let gx = Math.floor(Math.min(t[0][0], t[1][0], t[2][0]) / C); gx <= Math.floor(Math.max(t[0][0], t[1][0], t[2][0]) / C); gx++)
      for (let gz = Math.floor(Math.min(t[0][1], t[1][1], t[2][1]) / C); gz <= Math.floor(Math.max(t[0][1], t[1][1], t[2][1]) / C); gz++) { const k = key(gx, gz); if (!G.has(k)) G.set(k, []); G.get(k).push(id); } });
    const onStrip = (x, z) => { for (const id of G.get(key(Math.floor(x / C), Math.floor(z / C))) || []) { const [a, b, c] = tri[id], d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d) < 1e-9) continue;
      const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (z - c[1])) / d, l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (z - c[1])) / d; if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) return a[2] * l1 + b[2] * l2 + c[2] * (1 - l1 - l2); } return null; };
    const gravel = M.filter(([a, b]) => (T.def.surf || []).some(([a0, b0, k]) => k === 'makadam' && a >= a0 && b <= b0)).length;
    let far = 0, broken = 0, through = 0, sidePaint = 0;
    for (const [a, b, sd] of M) {
      let m = 1e9;   // (the strip reaches the asphalt's edge across the mouth)
      for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * T.wAt(i), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
      if (Math.sqrt(m) > 4.5) far++;
      // (the edge line on the mouth's side, 0.15 to 0.6 m inside the asphalt's edge: before, along and after the mouth)
      const i0 = Math.floor(a / T.ds) - 8, i1 = Math.ceil(b / T.ds) + 8, ic = T.idx((a + b) / 2); let pre = 0, mid = 0, post = 0;
      for (let k = 0; k < L.length; k += 2) { const x = L[k], z = L[k + 1]; if ((x - T.px[ic]) ** 2 + (z - T.pz[ic]) ** 2 > 1600) continue;
        const bi = nearest(x, z, i0, i1), q = T.idx(bi * T.ds), l = sd * lat(x, z, q), e = T.wAt(q); if (l < e - 0.6 || l > e - 0.15) continue;
        const al = bi * T.ds + (x - T.px[q]) * T.tx[q] + (z - T.pz[q]) * T.tz[q] - a; if (al > 1 && al < b - a - 1) mid++; else if (al >= -4 && al <= 1) pre++; else if (al >= b - a - 1 && al <= b - a + 4) post++; }
      if (!mid && pre && post) broken++; if (mid && pre && post) through++; }
    // (a side road's own paint: white vertex colour, untextured, flat on its strip (within 8 cm above it), off the main road's asphalt, not a post)
    for (let k = 0; k < WH.length; k += 3) { const x = WH[k], z = WH[k + 1], y = WH[k + 2], ys = onStrip(x, z); if (ys === null || y < ys - 0.005 || y > ys + 0.08) continue;
      let post = false; for (let j = 0; j < P.length; j += 4) if ((P[j] - x) ** 2 + (P[j + 2] - z) ** 2 < 0.16) { post = true; break; } if (post) continue;
      let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const d = (x - T.px[i]) ** 2 + (z - T.pz[i]) ** 2; if (d < m) { m = d; mi = i; } }
      if (Math.abs(lat(x, z, mi)) > T.wAt(mi) + 0.2) sidePaint++; }
    let road = 1e9;
    for (let k = 0; k < P.length; k += 4) { rows.add(P[k + 3]); let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const d = (P[k] - T.px[i]) ** 2 + (P[k + 2] - T.pz[i]) ** 2; if (d < m) { m = d; mi = i; } } road = Math.min(road, Math.sqrt(m) - T.wAt(mi)); }
    return { n: W.stranske, osm: T.def.stranske.length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, far, gravel, broken, through, sidePaint,
      posts: P.length / 4, rows: rows.size, road: +road.toFixed(1), stat: [W.stats.stranske, W.stats.stebricki], model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
  }, id);
  for (const [id, name, open, min, paint] of [['hakone', 'Hakone', true, 85, true], ['kildare', 'Kildare', false, 4, false]]) {
    await startTrack(page, id);
    const q = await stranskeQ(id);
    T.check(name + ': OpenStreetMap\'s side roads for the look (' + min + ' or more, at most the track\'s rows: those under a braking board or off the edges left out), a strip from each mouth (3 to 40 m wide) to the asphalt\'s edge, the posts across every mouth 2 m or more off the asphalt, the stats, the track\'s model untouched',
      q.n >= min && q.n <= q.osm && q.mouths === q.n && q.wMin >= 3 && q.wMax <= 40 && q.strips >= 1 && q.stripV >= 20 * q.n && q.far === 0 && q.rows === q.n && q.posts >= 2 * q.n && q.road >= 2 && q.stat[0] === q.n && q.stat[1] === q.posts && q.model, JSON.stringify(q));
    T.check(name + (open ? ': an open road: the edge line breaks off at every mouth' : ': a circuit: the edge line goes on across every mouth on the asphalt (none on the gravel)') + (paint ? ', the side roads\' stop lines (Japan: 0.3 m, white)' : ', no paint on the side roads (no rule of the country in CRTE, or class 0)'),
      (open ? q.broken === q.mouths - q.gravel && q.through === 0 : q.broken === 0 && q.through === q.mouths - q.gravel) && (paint ? q.sidePaint >= 60 : q.sidePaint === 0), JSON.stringify(q));
  }
  // the side roads of OpenStreetMap for the look on the tracks of the group 569d (docs/realizem/paket-e.md »569d«): Sa Calobra (an open road;
  // Pembrey and Porto Moniz take main's obcestje): every row of the track's data built, a strip through each opening, a row of posts across it on the
  // fence line (evenly, on the surface under it, off the road's asphalt); the track's model as a track built alone has it
  for (const id of ['sacalobra']) {
    await startTrack(page, id);
    const sv = await look(page);
    const s5 = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, def = Core.TRACKS.find(d => d.id === id), F = new Core.Track(def);
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = []; let strips = 0;
      W.root.traverse(o => { if (!o.isMesh || !o.userData.stranska) return; strips++; const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
      let far = 0, worst = 0;
      for (const [a, b, sd] of M) {   // (the fence line across the mouth: the strip's rows of vertices pass through it)
        let m = 1e9;
        for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
        m = Math.sqrt(m); if (m > worst) worst = m; if (m > 4.5) far++;
      }
      // the posts: rows by road, the gaps along a row, the distance from the road's asphalt, the surface under each (a ray down)
      const P = W.stebricki || [], n = P.length / 4, rows = new Map(), meshes = [];
      for (let k = 0; k < n; k++) { const ri = P[k * 4 + 3]; if (!rows.has(ri)) rows.set(ri, []); rows.get(ri).push(k); }
      let gMin = 1e9, gMax = 0, lone = 0, road = 1e9, none = 0, off = 0;
      for (const ks of rows.values()) {
        if (ks.length < 2) lone++;
        for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); }
      }
      for (let k = 0; k < n; k++) {
        const x = P[k * 4], z = P[k * 4 + 2]; let m = 1e18, mi = 0;
        for (let i = 0, e = T.open ? T.N - 1 : T.N; i < e; i++) {
          const j = (i + 1) % T.N, dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], t = Math.max(0, Math.min(1, ((x - T.px[i]) * dx + (z - T.pz[i]) * dz) / (dx * dx + dz * dz))), d = (x - T.px[i] - dx * t) ** 2 + (z - T.pz[i] - dz * t) ** 2;
          if (d < m) { m = d; mi = i; }
        }
        road = Math.min(road, Math.sqrt(m) - T.wAt(mi));
      }
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o); });
      const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      for (let k = 0; k < n; k++) {
        const y0 = P[k * 4 + 1]; let top = -1e9;
        rc.set(from.set(P[k * 4], y0 + 3, P[k * 4 + 2]), dn); rc.far = 6;
        for (const h of rc.intersectObjects(meshes, false)) { const y = h.point.y; if (Math.abs(y - (y0 + 1)) > 2e-3 && Math.abs(y - (y0 + 0.04)) > 2e-3 && y < y0 + 0.6 && y > top) top = y; }
        if (top < -1e8) none++; else off = Math.max(off, Math.abs(y0 - top));
      }
      return { n: W.stranske, rows0: (def.stranske || []).length, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2, far, worst: +worst.toFixed(2),
        posts: W.stats.stebricki, pn: n, prow: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), road: +road.toFixed(2), none, off: +off.toFixed(3),
        stops: W.stats.stops || 0, stops0: (def.postaje || []).length, model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
    }, id);
    T.check(id + ': OpenStreetMap\'s side roads for the look (every row of the track\'s data, a strip of asphalt through an opening at each mouth, the mouths 3 to 40 m wide), its bus stops behind the barrier\'s line; the track\'s model as a track built alone has it',
      s5.n === s5.rows0 && s5.n >= 1 && s5.mouths === s5.n && s5.wMin >= 3 && s5.wMax <= 40 && s5.strips >= 1 && s5.stripV > s5.n * 20 && s5.stripV <= sv.verts * 0.05 && s5.far === 0 &&
      s5.stops === s5.stops0 && s5.model, JSON.stringify(s5));
    T.check(id + ': a row of posts across each opening on the fence line (1 to 2.2 m apart, two or more a row), each on the surface drawn under it (within 3 cm: a ray down against the world\'s meshes), none on the road\'s asphalt',
      s5.pn === s5.posts && s5.prow === s5.n && s5.lone === 0 && s5.gMin >= 1 && s5.gMax <= 2.2 && s5.none === 0 && s5.off <= 0.03 && s5.road >= 0.5, JSON.stringify(s5));
  }

  // the side roads of OpenStreetMap on the tracks of group 569f (package E, docs/realizem/paket-e.md): the circuit of Silkeborg (Zandvoort takes main's obcestje)
  // on the shared builder (js/world-rbring.js), a strip through each mouth, a row of posts across it, the track's model untouched; nothing of
  // the world's on the road past the fence line (Silkeborg's farm fences open where a road goes through)
  //, no paint (Denmark's and the Netherlands' rows are not in World.cesta.CRTE, and a farm track or a service road has no lines);
  // Sosnová and Tuzla: no side roads in its data, none built
  for (const id of ['silkeborg', 'sosnova', 'tuzla']) {
    await startTrack(page, id);
    const q = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, d = Core.TRACKS.find(t => t.id === id), F = new Core.Track(d), dr = d.name.slice(d.name.lastIndexOf(',') + 1).trim(), S = d.stranske || [];
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], strip = new Set(); let strips = 0, verts = 0, fenceOn = 0;
      let yLo = 1e9, yHi = -1e9;
      W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; verts += o.geometry.attributes.position.count; if (!o.userData.stranska) return; strips++; strip.add(o);
        const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) { V.push(P.getX(k), P.getZ(k)); yLo = Math.min(yLo, P.getY(k)); yHi = Math.max(yHi, P.getY(k)); } });
      const segD = (x, z, L) => { let b = 1e9; for (let k = 2; k < L.length; k += 2) { const ax = L[k - 2], az = L[k - 1], dx = L[k] - ax, dz = L[k + 1] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
      const past = (x, z) => { let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const e = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (e < m) { m = e; mi = i; } }   // (how far past the barrier of its side)
        const o = (x - T.px[mi]) * T.nx[mi] + (z - T.pz[mi]) * T.nz[mi]; return Math.abs(o) - (o > 0 ? T.br[mi] : T.bl[mi]); };
      let far = 0;
      for (const [a, b, sd] of M) { let m = 1e9;   // (the strip's rows of vertices pass through the fence line across the mouth)
        for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const e = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (e < m) m = e; } }
        if (Math.sqrt(m) > 4.5) far++; }
      const P = W.stebricki || [], n = P.length / 4, rows = new Map(); let gMin = 1e9, gMax = 0, lone = 0;
      for (let k = 0; k < n; k++) { const r = P[k * 4 + 3]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(k); }
      for (const ks of rows.values()) { if (ks.length < 2) lone++;
        for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); } }
      const box = [1e9, -1e9, 1e9, -1e9]; for (const r of S) for (let k = 0; k < r[6].length; k += 2) { const L = r[6], m = r[3] / 2 + 1;
        box[0] = Math.min(box[0], L[k] - m); box[1] = Math.max(box[1], L[k] + m); box[2] = Math.min(box[2], L[k + 1] - m); box[3] = Math.max(box[3], L[k + 1] + m); }
      const onRoad = (x, z, m) => x > box[0] && x < box[1] && z > box[2] && z < box[3] && S.some(r => segD(x, z, r[6]) < r[3] / 2 - m) && past(x, z) >= 1;   // (on its asphalt, 1 m past the fence line: the posts stand on it)
      const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), SM = [...strip];
      const yAt = (x, z) => { rc.set(from.set(x, yHi + 6, z), dn); rc.far = yHi - yLo + 9; const R = rc.intersectObjects(SM, false); return R.length ? R[0].point.y : null; };
      const mat = new THREE.Matrix4(), v = new THREE.Vector3(); let inst = 0, hit = 0, rays = 0; const which = [], what = [];
      W.root.updateMatrixWorld(true);
      // (nothing of the world's stands on a road past the fence line: no bush, tuft, reed or tree where an instance stands, no vertex of the merged geometry,
      // a fence, a wall, a hut, the ground, from 15 cm to 3 m above the strip; the farm fences of Silkeborg open where a road goes through)
      W.root.traverse(o => { if (!o.isMesh || !o.visible || o.isSkinnedMesh || strip.has(o) || !o.geometry.attributes.position) return; const A = o.geometry.attributes.position;
        if (o.name === 'fences') for (let k = 0; k < A.count; k++) if (S.some(r => segD(A.getX(k), A.getZ(k), r[6]) < r[3] / 2 + 0.3)) fenceOn++;
        if (o.isInstancedMesh) { for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, mat); v.setFromMatrixPosition(mat.premultiply(o.matrixWorld));
          if (onRoad(v.x, v.z, 0.2)) { inst++; if (which.length < 4) which.push([+v.x.toFixed(1), +v.z.toFixed(1), o.name || o.geometry.type]); } } return; }
        for (let k = 0; k < A.count; k++) { v.fromBufferAttribute(A, k).applyMatrix4(o.matrixWorld); if (!onRoad(v.x, v.z, 0.2)) continue; const y = yAt(v.x, v.z);
          if (y !== null && v.y > y + 0.15 && v.y < y + 3) { hit++; if (what.length < 4) what.push([+v.x.toFixed(1), +v.z.toFixed(1), +(v.y - y).toFixed(2), o.name || o.geometry.type]); } } });
      for (const r of S) { const L = r[6], hw = r[3] / 2;   // (the strip covers each road past the fence line: a ray down at every metre, its middle and either side)
        for (let k = 2; k < L.length; k += 2) { const ax = L[k - 2], az = L[k - 1], dx = L[k] - ax, dz = L[k + 1] - az, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
          for (let u = 0; u < l; u += 1) for (const e of [-0.66, 0, 0.66]) { const x = ax + dx * u / l + nx * e * hw, z = az + dz * u / l + nz * e * hw; if (past(x, z) >= 3 && yAt(x, z) !== null) rays++; } } }
      return { n: W.stranske || 0, osm: S.length, mouths: M.length, wMin: M.length ? +Math.min(...wid).toFixed(1) : 0, wMax: M.length ? +Math.max(...wid).toFixed(1) : 0, strips, stripV: V.length / 2, verts, far,
        posts: n, stats: (W.stats && W.stats.stebricki) || 0, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), fenceOn, inst, which, rays, hit, what,
        model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])), drzava: dr, crte: !!World.cesta.CRTE[dr] };
    }, id);
    if (q.osm) T.check(`${id}: OpenStreetMap's side roads for the look (a strip through each mouth 3 to 40 m wide, a row of posts across each, 1 to 2.2 m apart), nothing of the world's on them past the fence line (its own fences open where a road goes through; from 1 m past the fence line on, no vertex or instance of anything else 15 cm to 3 m over the strip, which a ray down finds under every metre of it), the track's model untouched, no paint (${q.drzava}: no row in World.cesta.CRTE)`,
      q.n === q.osm && q.mouths === q.n && q.wMin >= 3 && q.wMax <= 40 && q.strips >= 1 && q.stripV > q.n * 20 && q.stripV <= q.verts * 0.1 && q.far === 0 &&
      q.posts === q.stats && q.rows === q.n && q.lone === 0 && q.gMin >= 1 && q.gMax <= 2.2 && q.fenceOn === 0 && q.inst === 0 && q.rays >= q.n * 40 && q.hit === 0 && q.model && !q.crte, JSON.stringify(q));
    else T.check(`${id}: no side roads in its data, none built (no strip, no mouth, no post), the track's model untouched`,
      q.n === 0 && q.mouths === 0 && q.strips === 0 && q.posts === 0 && q.model, JSON.stringify(q));
  }
  T.check('no errors (the road\'s and the paint\'s programs compile)', errors.length === 0, errors.slice(0, 3).join(' | '));
  // the side roads of OpenStreetMap for the look on the tracks of group 569e (docs/realizem/paket-e.md »569e«): Sakhir and Sepang
  // (circuits, js/world-rbring.js) and Seoul (a street circuit: its blocks, its fence and its edge lines open at each mouth; Santo Antão
  // has none within 60 m): every row of the track's data built, a strip through an opening at each mouth, a row of orange posts across
  // it on the fence line (evenly, two or more, on the surface drawn under it, off the road's asphalt); Seoul's white edge line broken
  // across each mouth (a ray down at the line's place in the mouth's middle meets no paint) and whole beside it (12 m before or after the
  // mouth it meets the paint's material); no paint at a mouth (Bahrain's and Malaysia's rows are service roads, Korea has no row of
  // markings in CRTE); the track's model as a track built alone has it; no errors
  for (const [id, name] of [['sakhir', 'Sakhir'], ['sepang', 'Sepang'], ['seoul', 'Seoul']]) {
    await startTrack(page, id);
    const sx = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === id));
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], meshes = []; let strips = 0, verts = 0;
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; verts += o.geometry.attributes.position.count; if (!o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o);
        if (!o.userData.stranska) return; strips++; const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
      let far = 0, worst = 0;
      for (const [a, b, sd] of M) {   // (the fence line about the mouth: the strip's vertices pass through it, a road leaving at a slant some metres on)
        let m = 1e9; const nj = Math.ceil(b - a + 40);
        for (let j = 0; j <= nj; j++) { const i = T.idx(a - 20 + (b - a + 40) * j / nj), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
        m = Math.sqrt(m); if (m > worst) worst = m; if (m > 4.5) far++;
      }
      // (the posts by rows: the gaps, each one's distance from the road's asphalt, and the highest surface under it but its own top and foot)
      const P = W.stebricki || [], np = P.length / 4, rows = new Map(), rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      for (let k = 0; k < np; k++) { const r = P[k * 4 + 3]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(k); }
      let gMin = 1e9, gMax = 0, lone = 0, road = 1e9, none = 0, off = 0;
      for (const ks of rows.values()) { if (ks.length < 2) lone++; for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); } }
      for (let k = 0; k < np; k++) {
        const x = P[k * 4], y0 = P[k * 4 + 1], z = P[k * 4 + 2]; let m = 1e18, mi = 0, top = -1e9;
        for (let i = 0, e = T.open ? T.N - 1 : T.N; i < e; i++) { const j = (i + 1) % T.N, dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], t = Math.max(0, Math.min(1, ((x - T.px[i]) * dx + (z - T.pz[i]) * dz) / (dx * dx + dz * dz))), d = (x - T.px[i] - dx * t) ** 2 + (z - T.pz[i] - dz * t) ** 2; if (d < m) { m = d; mi = i; } }
        road = Math.min(road, Math.sqrt(m) - T.wAt(mi));
        rc.set(from.set(x, y0 + 3, z), dn); rc.far = 6;
        for (const h of rc.intersectObjects(meshes, false)) { const y = h.point.y; if (Math.abs(y - (y0 + 1)) > 2e-3 && Math.abs(y - (y0 + 0.04)) > 2e-3 && y < y0 + 0.6 && y > top) top = y; }
        if (top < -1e8) none++; else off = Math.max(off, Math.abs(y0 - top));
      }
      // (the edge line's middle 0.3 m inside the asphalt's edge: the material of the highest surface there)
      const tp = (s, sd) => { const i = T.idx(s), o = sd * (T.wAt(i) - 0.3), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; rc.set(from.set(x, T.hy[i] + 1.5, z), dn); rc.far = 4;
        const h = rc.intersectObjects(meshes, false)[0]; return h ? h.object.material : null; };
      const side = [], mid = []; for (const [a, b, sd] of M) { side.push(tp(a - 12, sd), tp(b + 12, sd)); mid.push(tp((a + b) / 2, sd)); }
      const tally = new Map(); for (const m of side) if (m) tally.set(m, (tally.get(m) || 0) + 1);
      const line = ([...tally.entries()].sort((p, q) => q[1] - p[1])[0] || [null])[0];
      let whole = 0, broken = 0; M.forEach((u, k) => { if (side[2 * k] === line || side[2 * k + 1] === line) whole++; if (mid[k] && mid[k] !== line) broken++; });
      return { n: W.stranske, osm: (T.def.stranske || []).length, stats: W.stats.stranske, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2,
        worldV: verts, far, worst: +worst.toFixed(2), posts: W.stats.stebricki, np, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), road: +road.toFixed(1), none, off: +off.toFixed(3),
        whole, broken, paint: !!(line && line.isMeshLambertMaterial && !line.map && line !== W.asphaltMat), model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
    }, id);
    T.check(`${name}: OpenStreetMap's side roads for the look (every row of the track's data: a strip of asphalt through an opening at each mouth, 3 to 40 m wide, a row of orange posts across it, evenly on the fence line, each on the surface drawn under it, none within 1 m of the road's asphalt)${id === 'seoul' ? '; the white edge line broken across each mouth and whole beside it' : ''}; the track's model as a track built alone has it`,
      sx.osm >= 3 && sx.n === sx.osm && sx.stats === sx.n && sx.mouths === sx.n && sx.wMin >= 3 && sx.wMax <= 40 && sx.strips >= 1 && sx.stripV > sx.n * 20 && sx.stripV <= sx.worldV * 0.05 && sx.far === 0 &&
      sx.posts === sx.np && sx.posts >= sx.n * 2 && sx.posts <= sx.n * 27 && sx.rows === sx.n && sx.lone === 0 && sx.gMin >= 1 && sx.gMax <= 2.2 && sx.none === 0 && sx.off <= 0.03 && sx.road >= 1 &&
      (id !== 'seoul' || (sx.whole === sx.n && sx.broken === sx.n && sx.paint)) && sx.model, JSON.stringify(sx));
  }
  T.check('no errors on the tracks of group 569e', errors.length === 0, errors.slice(0, 3).join(' | '));

  const low = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(low.page, 'spa');
  const spaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await startTrack(low.page, 'tianmen');
  const tiaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  T.check('NIZKA: the same look (a phone\'s tier; an open road\'s broken edge too), no errors', spaL.cesta && spaL.road === spa.road && spaL.paint === spa.paint && tiaL.cesta && tiaL.cesta.rob === tia.cesta.rob && tiaL.road === tia.road && low.errors.length === 0,
    JSON.stringify([spaL.cesta, tiaL.cesta]) + ' ' + low.errors.slice(0, 3).join(' | '));

  // group 762a (package E, docs/realizem/paket-e.md): the side roads of OpenStreetMap on Canaries and Kanaba (the pass builder,
  // js/world-prelaz.js) and Koli (the mountain builder, js/world-gore.js; its winter: each strip packed snow on the ground's material, the
  // snowbank open across each mouth); a strip through each mouth, a row of posts across it, the track's model untouched, nothing of the
  // world's on a road past the fence line (no tree, rock, parked car, rail or bank); no paint (Saint Lucia's and Uganda's rows in
  // World.cesta.CRTE are the main road's look, not a published rule for a mouth's lines; Kanaba's roads unpaved in OpenStreetMap, drawn
  // as gravel, class 0 in tools/cesta/izvoz.py; Finland's Koli: its roads under snow, as its own road); Aguascalientes: no side roads in
  // OpenStreetMap by the circuit, none built
  for (const id of ['canaries', 'kanaba', 'koli', 'aguascalientes']) {
    await startTrack(page, id);
    const q = await page.evaluate((id) => {
      const W = Render.world, T = window.__game.race.track, d = Core.TRACKS.find(t => t.id === id), F = new Core.Track(d), dr = d.name.slice(d.name.lastIndexOf(',') + 1).trim(), S = d.stranske || [];
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], strip = new Set(); let strips = 0, verts = 0, painted = 0, onAsph = 0, lum = 0, nc = 0;
      let yLo = 1e9, yHi = -1e9;
      W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; verts += o.geometry.attributes.position.count; if (!o.userData.stranska) return; strips++; strip.add(o);
        if (o.geometry.attributes.paint) painted++; if (o.material === W.asphaltMat || (o.material.map && o.material.map === W.asphaltMat.map)) onAsph++;
        const C = o.geometry.attributes.color; if (C) for (let k = 0; k < C.count; k++, nc++) lum += Math.min(C.getX(k), C.getY(k), C.getZ(k));
        const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) { V.push(P.getX(k), P.getZ(k)); yLo = Math.min(yLo, P.getY(k)); yHi = Math.max(yHi, P.getY(k)); } });
      const segD = (x, z, L) => { let b = 1e9; for (let k = 2; k < L.length; k += 2) { const ax = L[k - 2], az = L[k - 1], dx = L[k] - ax, dz = L[k + 1] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
      const past = (x, z) => { let m = 1e18, mi = 0; for (let i = 0; i < T.N; i++) { const e = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (e < m) { m = e; mi = i; } }   // (how far past the barrier of its side)
        const o = (x - T.px[mi]) * T.nx[mi] + (z - T.pz[mi]) * T.nz[mi]; return Math.abs(o) - (o > 0 ? T.br[mi] : T.bl[mi]); };
      let far = 0;
      for (const [a, b, sd] of M) { let m = 1e9;   // (the strip's rows of vertices pass through the fence line across the mouth)
        for (let j = 0; j <= 8; j++) { const i = T.idx(a + (b - a) * j / 8), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const e = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (e < m) m = e; } }
        if (Math.sqrt(m) > 4.5) far++; }
      const P = W.stebricki || [], n = P.length / 4, rows = new Map(); let gMin = 1e9, gMax = 0, lone = 0;
      for (let k = 0; k < n; k++) { const r = P[k * 4 + 3]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(k); }
      for (const ks of rows.values()) { if (ks.length < 2) lone++;
        for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); } }
      const box = [1e9, -1e9, 1e9, -1e9]; for (const r of S) for (let k = 0; k < r[6].length; k += 2) { const L = r[6], m = r[3] / 2 + 1;
        box[0] = Math.min(box[0], L[k] - m); box[1] = Math.max(box[1], L[k] + m); box[2] = Math.min(box[2], L[k + 1] - m); box[3] = Math.max(box[3], L[k + 1] + m); }
      const onRoad = (x, z, m) => x > box[0] && x < box[1] && z > box[2] && z < box[3] && S.some(r => segD(x, z, r[6]) < r[3] / 2 - m) && past(x, z) >= 1;   // (on its asphalt, 1 m past the fence line: the posts stand on it)
      const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), SM = [...strip];
      const yAt = (x, z) => { rc.set(from.set(x, yHi + 6, z), dn); rc.far = yHi - yLo + 9; const R = rc.intersectObjects(SM, false); return R.length ? R[0].point.y : null; };
      const mat = new THREE.Matrix4(), v = new THREE.Vector3(); let inst = 0, hit = 0, rays = 0; const which = [], what = [];
      W.root.updateMatrixWorld(true);
      // (nothing of the world's stands on a road past the fence line: no tree, rock, car or snow gun where an instance stands, no vertex of the
      // merged geometry, a rail, a bank of snow, the ground, from 15 cm to 3 m above the strip)
      W.root.traverse(o => { if (!o.isMesh || !o.visible || o.isSkinnedMesh || strip.has(o) || !o.geometry.attributes.position) return; const A = o.geometry.attributes.position;
        if (o.isInstancedMesh) { for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, mat); v.setFromMatrixPosition(mat.premultiply(o.matrixWorld));
          if (onRoad(v.x, v.z, 0.2) && yAt(v.x, v.z) !== null) { inst++; if (which.length < 4) which.push([+v.x.toFixed(1), +v.z.toFixed(1), o.name || o.geometry.type]); } } return; }
        for (let k = 0; k < A.count; k++) { v.fromBufferAttribute(A, k).applyMatrix4(o.matrixWorld); if (!onRoad(v.x, v.z, 0.2)) continue; const y = yAt(v.x, v.z);
          if (y !== null && v.y > y + 0.15 && v.y < y + 3) { hit++; if (what.length < 4) what.push([+v.x.toFixed(1), +v.z.toFixed(1), +(v.y - y).toFixed(2), o.name || o.geometry.type]); } } });
      for (const r of S) { const L = r[6], hw = r[3] / 2;   // (the strip covers each road past the fence line: a ray down at every metre, its middle and either side)
        for (let k = 2; k < L.length; k += 2) { const ax = L[k - 2], az = L[k - 1], dx = L[k] - ax, dz = L[k + 1] - az, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
          for (let u = 0; u < l; u += 1) for (const e of [-0.66, 0, 0.66]) { const x = ax + dx * u / l + nx * e * hw, z = az + dz * u / l + nz * e * hw; if (past(x, z) >= 3 && yAt(x, z) !== null) rays++; } } }
      return { n: W.stranske || 0, osm: S.length, mouths: M.length, wMin: M.length ? +Math.min(...wid).toFixed(1) : 0, wMax: M.length ? +Math.max(...wid).toFixed(1) : 0, strips, stripV: V.length / 2, verts, far,
        posts: n, stats: (W.stats && W.stats.stebricki) || 0, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), inst, which, rays, hit, what, painted, onAsph, lum: nc ? +(lum / nc).toFixed(3) : 0,
        model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])), drzava: dr, crte: !!World.cesta.CRTE[dr] };
    }, id);
    const want = { canaries: [10, 'Saint Lucia: no published rule for a mouth\'s lines'], kanaba: [3, 'Uganda: its side roads unpaved in OpenStreetMap, gravel'],
      koli: [3, 'Finland\'s winter: its roads under snow, as its own road'], aguascalientes: [0, ''] }[id];
    if (q.osm) T.check(`${id}: OpenStreetMap's side roads by the road (${q.n} of ${q.osm}; the builder drops a road it finds no mouth for), each a strip through its mouth, a row of posts across it, nothing of the world's on it past the fence line, the track's model untouched, no paint (${want[1]})` +
      ({ koli: ', packed snow on the ground\'s material, not the asphalt', kanaba: ', pale gravel, not grey asphalt' }[id] || ''),
      q.n === want[0] && q.n <= q.osm && q.mouths === q.n && q.wMin >= 3 && q.wMax <= 40 && q.strips >= 1 && q.stripV > q.n * 20 && q.stripV <= q.verts * 0.1 && q.far === 0 &&
      q.posts === q.stats && q.rows === q.n && q.lone === 0 && q.gMin >= 1 && q.gMax <= 2.2 && q.inst === 0 && q.rays >= q.n * 40 && q.hit === 0 && q.model && q.painted === 0 &&
      (id !== 'koli' || q.onAsph === 0 && q.lum > 0.7) && (id !== 'kanaba' || q.lum > 1), JSON.stringify(q));
    else T.check(`${id}: no side roads in its data, none built (no strip, no mouth, no post), the track's model untouched`,
      q.n === 0 && q.mouths === 0 && q.strips === 0 && q.posts === 0 && q.model, JSON.stringify(q));
  }
  T.check('group 762a: no errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  // the side roads of OpenStreetMap for the look on the tracks of group 762b (docs/realizem/paket-e.md »762b«): Quezaltepeque (Koror and
  // Savusavu take main's obcestje) (a circuit, js/world-rbring.js; its rows are tracks of the venue): every row of the track's
  // data built (as many as js/tracks/ holds today, 2), a strip through an opening at each mouth, a row of orange posts across it
  // on the fence line (evenly, two or more, on the surface drawn under it, off the road's asphalt); on the passes the white edge line broken
  // across each mouth (a ray down at the line's place in the mouth's middle meets no paint) and whole beside it (12 m before or after the
  // mouth it meets the paint's material); no paint at a mouth (Palau's and Fiji's rows in CRTE hold the main road's lines only, El Salvador
  // has none); the track's model as a track built alone has it; no errors. The same on the circuits of group N11 (docs/realizem/paket-e.md
  // »N11«): Mogyoród (js/world-rbring.js) and Tocancipá (its own builder, js/world-tocancipa.js), 4 and 2 rows (service roads and tracks
  // of the venue), the edge lines whole as on Quezaltepeque (a circuit's). And on the roads of PR #788 (docs/realizem/paket-e.md »#788«):
  // Musandam and Darvaz (js/world-prelaz.js), Viñales (js/world-gore.js), Livingstone and Atimpoku (their own builders, js/world-livingstone.js
  // and js/world-atimpoku.js), 3, 1, 1, 12 and 24 rows, the edge line broken at each mouth as on the passes (no country's colours: Oman,
  // Tajikistan, Cuba, Zambia and Ghana are not in CRTE)
  for (const [id, name, rob, least] of [['quezaltepeque', 'Quezaltepeque', 0, 2],
    ['mogyorod', 'Mogyoród', 0, 4], ['tocancipa', 'Tocancipá', 0, 2], ['musandam', 'Musandam', 0.375, 3], ['darvaz', 'Darvaz', 0.375, 1],
    ['vinales', 'Viñales', 0.375, 1], ['livingstone', 'Livingstone', 0.3, 12], ['atimpoku', 'Atimpoku', 0.3, 24]]) {
    await startTrack(page, id);
    const sx = await page.evaluate(([id, rob]) => {
      const W = Render.world, T = window.__game.race.track, F = new Core.Track(Core.TRACKS.find(d => d.id === id));
      const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
      const M = (W.cestaRob || []).filter(u => u[2] !== 0), wid = M.map(u => u[1] - u[0]), V = [], meshes = []; let strips = 0, verts = 0;
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; verts += o.geometry.attributes.position.count; if (!o.isInstancedMesh && !o.isSkinnedMesh && o.visible) meshes.push(o);
        if (!o.userData.stranska) return; strips++; const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k++) V.push(P.getX(k), P.getZ(k)); });
      let far = 0, worst = 0;
      for (const [a, b, sd] of M) {   // (the fence line about the mouth: the strip's vertices pass through it, a road leaving at a slant some metres on)
        let m = 1e9; const nj = Math.ceil(b - a + 40);
        for (let j = 0; j <= nj; j++) { const i = T.idx(a - 20 + (b - a + 40) * j / nj), o = sd * (sd > 0 ? T.br[i] : T.bl[i]), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          for (let k = 0; k < V.length; k += 2) { const d = (V[k] - x) ** 2 + (V[k + 1] - z) ** 2; if (d < m) m = d; } }
        m = Math.sqrt(m); if (m > worst) worst = m; if (m > 4.5) far++;
      }
      // (the posts by rows: the gaps, each one's distance from the road's asphalt, and the highest surface under it but its own top and foot)
      const P = W.stebricki || [], np = P.length / 4, rows = new Map(), rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      for (let k = 0; k < np; k++) { const r = P[k * 4 + 3]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(k); }
      let gMin = 1e9, gMax = 0, lone = 0, road = 1e9, none = 0, off = 0;
      for (const ks of rows.values()) { if (ks.length < 2) lone++; for (let j = 1; j < ks.length; j++) { const a = ks[j - 1] * 4, b = ks[j] * 4, g = Math.hypot(P[b] - P[a], P[b + 2] - P[a + 2]); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); } }
      for (let k = 0; k < np; k++) {
        const x = P[k * 4], y0 = P[k * 4 + 1], z = P[k * 4 + 2]; let m = 1e18, mi = 0, top = -1e9;
        for (let i = 0, e = T.open ? T.N - 1 : T.N; i < e; i++) { const j = (i + 1) % T.N, dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], t = Math.max(0, Math.min(1, ((x - T.px[i]) * dx + (z - T.pz[i]) * dz) / (dx * dx + dz * dz))), d = (x - T.px[i] - dx * t) ** 2 + (z - T.pz[i] - dz * t) ** 2; if (d < m) { m = d; mi = i; } }
        road = Math.min(road, Math.sqrt(m) - T.wAt(mi));
        rc.set(from.set(x, y0 + 3, z), dn); rc.far = 6;
        for (const h of rc.intersectObjects(meshes, false)) { const y = h.point.y; if (Math.abs(y - (y0 + 1)) > 2e-3 && Math.abs(y - (y0 + 0.04)) > 2e-3 && y < y0 + 0.6 && y > top) top = y; }
        if (top < -1e8) none++; else off = Math.max(off, Math.abs(y0 - top));
      }
      // (the edge line's middle rob m inside the asphalt's edge: the material of the highest surface there, under the rail's height)
      let whole = 0, broken = 0, paint = false;
      if (rob) {
        const tp = (s, sd) => { const i = T.idx(s), o = sd * (T.wAt(i) - rob), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; rc.set(from.set(x, T.hy[i] + 1.5, z), dn); rc.far = 4;
          const h = rc.intersectObjects(meshes, false)[0]; return h ? h.object.material : null; };
        const side = [], mid = []; for (const [a, b, sd] of M) { side.push(tp(a - 12, sd), tp(b + 12, sd)); mid.push(tp((a + b) / 2, sd)); }
        const tally = new Map(); for (const m of side) if (m) tally.set(m, (tally.get(m) || 0) + 1);
        const line = ([...tally.entries()].sort((p, q) => q[1] - p[1])[0] || [null])[0];   // (the paint's material: the commonest highest surface beside the mouths)
        M.forEach((u, k) => { if (side[2 * k] === line || side[2 * k + 1] === line) whole++; if (mid[k] && mid[k] !== line) broken++; });
        paint = !!(line && line.isMeshLambertMaterial && !line.map && line !== W.asphaltMat);
      }
      return { n: W.stranske, osm: (T.def.stranske || []).length, stats: W.stats.stranske, mouths: M.length, wMin: +Math.min(...wid).toFixed(1), wMax: +Math.max(...wid).toFixed(1), strips, stripV: V.length / 2,
        worldV: verts, far, worst: +worst.toFixed(2), posts: W.stats.stebricki, np, rows: rows.size, lone, gMin: +gMin.toFixed(2), gMax: +gMax.toFixed(2), road: +road.toFixed(1), none, off: +off.toFixed(3),
        whole, broken, paint, model: ['px', 'pz', 'hy', 'nx', 'nz', 'bl', 'br'].every(k => same(T[k], F[k])) };
    }, [id, rob]);
    T.check(`${name}: OpenStreetMap's side roads for the look (every row of the track's data: a strip of asphalt through an opening at each mouth, 3 to 40 m wide, a row of orange posts across it, evenly on the fence line, each on the surface drawn under it, none within 1 m of the road's asphalt)${rob ? '; the white edge line broken across each mouth and whole beside it' : ''}; the track's model as a track built alone has it`,
      sx.osm >= least && sx.n === sx.osm && sx.stats === sx.n && sx.mouths === sx.n && sx.wMin >= 3 && sx.wMax <= 40 && sx.strips >= 1 && sx.stripV > sx.n * 20 && sx.stripV <= sx.worldV * 0.05 && sx.far === 0 &&
      sx.posts === sx.np && sx.posts >= sx.n * 2 && sx.posts <= sx.n * 27 && sx.rows === sx.n && sx.lone === 0 && sx.gMin >= 1 && sx.gMax <= 2.2 && sx.none === 0 && sx.off <= 0.03 && sx.road >= 1 &&
      (!rob || (sx.whole === sx.n && sx.broken === sx.n && sx.paint)) && sx.model, JSON.stringify(sx));
  }
  // (group N11's other four: on Sindia, Yahuarcocha and Houli OpenStreetMap holds no road that meets their line; Pärnu's three cross
  // run-offs to a barrier 20-27 m out and are left out (izpusti in tools/cesta/izvoz.py): none is built. The same on Cromwell, Hinboun and
  // Lima Limo of PR #788: OpenStreetMap holds no road that meets their line)
  for (const id of ['sindia', 'yahuarcocha', 'houli', 'parnu', 'cromwell', 'hinboun', 'limalimo']) {
    await startTrack(page, id);
    const q = await page.evaluate(() => { const W = Render.world, T = window.__game.race.track; let strips = 0; W.root.traverse(o => { if (o.isMesh && o.userData.stranska) strips++; });
      return { osm: (T.def.stranske || []).length, n: W.stranske || 0, mouths: (W.cestaRob || []).length, strips, posts: (W.stebricki || []).length }; });
    T.check(`${id}: no side roads in its data, none built (no strip, no mouth, no post)`, q.osm === 0 && q.n === 0 && q.mouths === 0 && q.strips === 0 && q.posts === 0, JSON.stringify(q));
  }
  T.check('no errors on the tracks of groups 762b, N11 and #788', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); srv.close();
}
T.done();
