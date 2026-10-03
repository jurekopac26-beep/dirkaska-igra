// Rio de Janeiro's world round the circuit: the kart track by Turn 3 (its karts lapping it), the convention centre in the west (its
// halls from OpenStreetMap, drawn where they really stand on the screen though past the view's reach), boats on the lagoon and egrets at its
// edge, cormorants over it, the mountains on the skyline in four bands with the town at their foot and mirrored in the lagoon, people on
// the pit building's roof and on the banks, the samba group on its stage by the main stand (heard near it, not far off); the helicopter
// only over the finish once the player is over the line (no pass over the track during the race); the mist over the water in the morning,
// the heat shimmering over the straights on a dry day only.
//   node tests/browser/rio.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Rio de Janeiro: the world round the circuit');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', track: 'rio', weather: 'dry', tod: 'day', sound: 1 }, { width: 844, height: 390 });
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'rio');
  await page.evaluate(() => window.__game.sim(14, true));   // (past the jets over the grid)

  // 1. what stands round the circuit
  const w = await page.evaluate(() => {
    const W = Render.world, st = W.stats.rio, D = W.dyn.rio, Tr = window.__game.race.track, def = Tr.def, L = def.lagoon.poly;
    const inP = (P, x, z) => { let c = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [xa, za] = P[a], [xb, zb] = P[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
    const near = (x, z) => { let d = 1e9; for (let i = 0; i < Tr.N; i++) d = Math.min(d, Math.hypot(Tr.px[i] - x, Tr.pz[i] - z)); return d; };
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), at = (im, k) => { im.getMatrixAt(k, m4); return v.setFromMatrixPosition(m4).toArray(); };
    World.update(W, 0, null); const k0 = at(D.karts.im, 0).slice(); World.update(W, 2, null); const k1 = at(D.karts.im, 0);
    const onLine = (p) => Math.min(...D.karts.U.map(([x, z]) => Math.hypot(x - p[0], z - p[2])));
    const boats = D.boats.B.map((b, k) => at(D.boats.im, k)), wet = boats.filter(p => inP(L, p[0], p[2])).length;
    const birds = [...Array(D.birds.n)].map((q, k) => at(D.birds.im, k)), over = birds.filter(p => inP(L, p[0], p[2])).length;
    let water = null; W.root.traverse(o => { if (o.isMesh && o.material && o.material.customProgramCacheKey && /^water\|/.test(o.material.customProgramCacheKey()) && !water) water = o.material.customProgramCacheKey(); });
    const C = def.conv, west = C.halls.every(([hh, poly]) => poly.every(([x]) => x < -1000));
    return { st, kart: { len: st.kart, d: Math.hypot(k1[0] - k0[0], k1[2] - k0[2]), on: onLine(k1), clear: near(D.karts.U[0][0], D.karts.U[0][1]) }, boats: boats.length, wet, birds: birds.length, over,
      water, sky: W.dyn.skyline.meshes.length, conv: { halls: C.halls.length, lot: C.lot.length, west, mesh: !!D.conv }, samba: W.samba, sambaD: W.samba ? near(W.samba[0], W.samba[1]) : null,
      start: [Tr.px[Tr.idx(Tr.startS)], Tr.pz[Tr.idx(Tr.startS)]] };
  });
  const s = w.st;
  T.check('the kart track by Turn 3: a loop of 0.5-0.7 km clear of the circuit, its tyre walls, five karts lapping it (on its line, ~27 m in 2 s)',
    s.kart > 500 && s.kart < 700 && w.kart.clear > 9 && s.tyres > 20 && w.kart.d > 20 && w.kart.d < 32 && w.kart.on < 0.6, `${s.kart} m, ${s.tyres} tyre stacks, a kart ${w.kart.d.toFixed(1)} m in 2 s, ${w.kart.on.toFixed(2)} m off its line, ${w.kart.clear.toFixed(0)} m from the circuit`);
  T.check('the convention centre in the west (1-2 km out): its five halls and car park from OpenStreetMap, drawn',
    w.conv.halls === 5 && w.conv.lot > 8 && w.conv.west && w.conv.mesh && s.conv === 5, JSON.stringify(w.conv));
  T.check('the lagoon: boats on the water, egrets at its edge, cormorants flying over it', w.boats >= 5 && w.wet === w.boats && s.egrets >= 10 && w.birds === 7 && w.over >= 4,
    `${w.boats} boats (${w.wet} on the water), ${s.egrets} egrets, ${w.birds} cormorants (${w.over} over the water)`);
  T.check('the skyline: four bands of mountains and the town at their foot; the lagoon mirrors the mountains', w.sky === 5 && s.band > 300 && /\|true$/.test(w.water || ''), `${w.sky} rings, the water's material ${w.water}`);
  T.check('seen from above: trees in bloom near the track, a marshals\' post past every turn', s.bloom >= 20 && s.posts >= 9, `${s.bloom} trees in bloom, ${s.posts} marshals' posts`);
  T.check('people on the pit building\'s roof and on the banks; the samba group on its stage by the main stand (before the start line, beyond the barrier)',
    s.roof > 100 && s.bank > 100 && s.samba >= 15 && w.samba && w.sambaD > 8 && w.sambaD < 25 && Math.hypot(w.samba[0] - w.start[0], w.samba[1] - w.start[1]) < 330,
    `roof ${s.roof}, banks ${s.bank}, samba ${s.samba} at ${w.sambaD && w.sambaD.toFixed(1)} m from the track`);

  // 2. the helicopter: none over the track during the race (half way into the second lap, by the start line); once the player is over the line it
  // comes and hangs over the finish
  const h = await page.evaluate(() => {
    const g = window.__game, Tr = g.race.track, P = g.race.player, A = Render.world.air, out = {};
    const put = (d) => { const s = ((Tr.startS + d) % Tr.len + Tr.len) % Tr.len, i = Tr.idx(s); P.place(Tr.px[i], Tr.pz[i], Tr.hd[i]); P.y = P.py = Tr.hy[i]; P.q = Tr.query(P.x, P.z, i, P.q); P.speed = 0; P.vx = P.vz = 0; };
    const fr = (n) => { let on = false; for (let k = 0; k < n; k++) { Render.frame(0.1, 1, P, 'chase', {}); on = on || A.on; } return on; };
    g.pause(); P.dist = Tr.len * 1.5; let pass = false; for (const d of [-240, -180, -120, -60, 0, 60, 120]) { put(d); pass = fr(8) || pass; }
    out.pass = pass; put(30); P.finished = true; out.fin = fr(120); const p = A.heli.position, i0 = Tr.idx(Tr.startS);
    out.d = Math.hypot(p.x - Tr.px[i0], p.z - Tr.pz[i0]); out.h = p.y - Tr.hy[i0]; P.finished = false; return out; });
  T.check('the helicopter: no pass over the track during the race; over the finish (within 90 m of the line, 15-60 m up) once the player is over the line',
    !h.pass && h.fin && h.d < 90 && h.h > 15 && h.h < 60, JSON.stringify(h));

  // 3. the weather: the mist over the lagoon in the morning (none on a dry day), the heat over the straights on a dry day (none in the morning)
  const wx = await page.evaluate(() => {
    const W = Render.world, D = W.dyn.rio, out = {};
    Render.setAtmos({ season: 'summer', tod: 'day' }); World.update(W, 1000, null); World.update(W, 1002, null); out.day = { mist: D.mist.me.visible, heat: D.heat.me.visible };
    Render.setAtmos({ season: 'summer', tod: 'dawn' }); World.update(W, 1004, null); World.update(W, 1006, null); out.dawn = { mist: D.mist.me.visible, heat: D.heat.me.visible };
    Render.setAtmos({ season: 'summer', tod: 'day' }); World.update(W, 1008, null); World.update(W, 1010, null); return out; });
  T.check('the mist over the lagoon in the morning, the heat over the straights on a dry day, not the other way round',
    !wx.day.mist && wx.day.heat && wx.dawn.mist && !wx.dawn.heat, JSON.stringify(wx));

  // 4. the samba heard near its stage, not on the far side of the circuit
  const ready = await page.evaluate(() => Sfx.ready);
  if (!ready) T.check('sound running in this browser (skipped: no audio here)', true, 'AudioContext not running');
  else {
    const lv = await page.evaluate(async () => {
      const g = window.__game, Tr = g.race.track, P = g.race.player, out = [];
      for (const d of [-285, 2000]) { const s = ((Tr.startS + d) % Tr.len + Tr.len) % Tr.len, i = Tr.idx(s); P.place(Tr.px[i], Tr.pz[i], Tr.hd[i]); P.q = Tr.query(P.x, P.z, i, P.q); P.speed = 0;
        g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.pause(); await new Promise(r => setTimeout(r, 300)); out.push(Sfx.levels().samba); }
      return out; });
    T.check('the samba heard by its stage, not 2 km round the lap', lv[0] > 0.3 && lv[1] === 0, JSON.stringify(lv));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
