// Razbijanje · nov način (Nastavitve: xBody, xGlass, xPaint; Detajli avtov carDet: Normalni the player's body dense, Visoki every car's; render only, off by default):
// 1. off (the default): no car is built dense, the dents go the old way (applyDent), nothing new on the road
// 2. on, Normalni: the player's car dense (its outer shell split, its ranges, paint list and drawn block consistent), the rivals as built;
//    blow after blow on the nose the crush goes deeper (each hit deepens the same cluster), no deeper than 0.3 m till the car is 70 % gone
//    (nothing torn: the face keeps its shape), then on, and stops short of the windscreen (its cap);
//    a deep front crush tears the bonnet open and the grey engine shows; nothing NaN
// 3. the glass: each blow breaks the unbroken pane nearest to it, never one on the other side of the car; glass on the road after
// 4. the mirrors: the first side blow knocks that side's mirror off, it lies on the road and stays there while the car drives on
// 5. repeated side blows: the roof sinks on that side (its edge lower than the other side's); the rear door swung open, its window broken
// 6. one of the 11 (the rally car) dense too; switched off during a race the cars are built again as before
// 7. the phone's load (NIZKA tier, as perf.test.mjs counts it, one track): Normalni within 6 % more vertices than off, Visoki within 30 %
// 8. xParts, xDust, xDrag: a rear bumper knocked loose (the car 70 % gone: the tail hangs loose only from then) drags on the road throwing sparks; a hard knock throws dust and bits; the bumper
//    knocked off lies on the road and, pushed out of the core's 40 pieces, stays drawn there; off: none of it (the piece freed as before);
//    rolling over: the car's black underside (floor, subframes, tunnel, exhaust, tank) drawn while it rolls, not before nor after
// 9. the Kolibri's damage table (12 directions x 3 strengths): its glass in stages, lamps, parts hanging and off; the bonnet's ridge, the
//    V from behind; from behind again and again the user's order; a mirror off, its door window 75 %; only the Kolibri, only switched on.
//    The user's rules over the table (1B, 2B, 3B): the first knock on an end breaks one of its lamps; the face and the tail (bumpers, bonnet,
//    spoiler) neither hang nor come off till the car is 70 % gone, then as the table has it; an end crushed no deeper than 0.3 m till then
// 10. the Medved, the Kozorog, the Lev R: the table theirs too, the user's rules over it as the Kolibri's; a crushed end caves the roof in,
//    the harder the knock the deeper
// 11. the roof field: every knock (any side, a rollover's roof contact, a landing) caves the roof in more, never past its limit, never
//    through the seats, the driver, a cage (Goljat's outer one too), the posts' tops never through it (a rival's coarse body too); a
//    wreck's start number and a patrol car's light bar gone; open cars and karts none, their drivers and hoops never lifted; the roof's
//    paint darker where it sank (by its drop: 60 % at the deepest it can go), on the paint's own colour, the rest of the body, the
//    lining and the posts as they were, never into or through a glass colour as the body's shader sees one (a black car's: a warm way
//    round them, to a brown-black, 40 % darker or more in the dent's deep half; a reddish black's too); a pit stop's repair brings its
//    colour back (black paint walked back along its way: at none of the 16 steps newly glass to the shader); an open car's paint never
//    darkened so
//   node tests/browser/crash.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Razbijanje · nov način: dense bodies, deeper crush, glass, mirrors, parts on the track, dust, the load');
const srv = await serve();
const browser = await launch();
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.1, damage: 2, weather: 'dry', carId: 'tornado', carV: 3 };
  const run = async (settings, fn, arg) => {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, settings), { width: 640, height: 296 }, { seed: 4242 });
    await startTrack(page, 'jezero');
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true); g.sim(6, true);
      const R = g.race, P = R.player; for (const c of R.cars) if (c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 25) { c.x -= Math.cos(P.h) * 40; c.z -= Math.sin(P.h) * 40; c.px = c.x; c.pz = c.z; }
      R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); Render.frame(0.016, 1, P, 'chase', {}); });
    const r = await page.evaluate(fn, arg);
    await ctx.close();
    return { r, errors };
  };
  const hitFn = `(P, h) => { Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); Render.frame(0.016, 1, P, 'chase', {}); }`;
  // the paint's own colour of a body point (v, its xc, XC.paint), as xPaint makes it without the roof's darkening: the intact colour, darker
  // in a fold (its facet turned from its normal as built), scraped to bare metal or rust with xPaint on; what a point's colour is held to
  const paintFn = `(v, xc, paint) => { const nm = v.body.geometry.attributes.normal.array, C0 = xc.col0, N0 = xc.nor0, cl = (x) => Math.min(1, Math.max(0, x));
    return (i) => { const o = i * 3, cr = cl((1 - (nm[o] * N0[o] + nm[o + 1] * N0[o + 1] + nm[o + 2] * N0[o + 2])) * 3.5), k = 1 - 0.42 * cr; let r = C0[o] * k, g = C0[o + 1] * k, b = C0[o + 2] * k;
      if (paint) { const w = cl(xc.am[i] / 0.18) * (0.25 + 0.75 * cr), s = cl((xc.pn[i] - (1 - w * 0.7)) * 3) * 0.9; if (s > 0) { const m = xc.rn[i] > 0.45 ? [0.4, 0.21, 0.1] : [0.38, 0.38, 0.4]; r += (m[0] - r) * s; g += (m[1] - g) * s; b += (m[2] - b) * s; } }
      return [r, g, b]; }; }`;
  // what of a kit body the paint checks leave out: the parts off, hanging loose or folded (turned whole, as their own pieces), the points
  // lost or torn, a gone pane's (nd), and a sliver with no facet as built (no normal: never drawn)
  const asideFn = `(v, xc) => { const K = v.kit, U = v.body.geometry.userData, n = xc.rest.length / 3, off = new Uint8Array(n), N0 = xc.nor0;
    if (K) for (const nm of Object.keys(K.ajar).concat(Object.keys(K.dead), Object.keys(K.fold || {}))) { const Rg = U.ranges[nm]; if (Rg) for (const q of [Rg.o, Rg.i]) if (q && q[1] > q[0]) off.fill(1, q[0], q[1]); }
    return (i) => !!(off[i] || (K && K.deadV && K.deadV[i]) || (xc.nd && xc.nd[i]) || Math.hypot(N0[i * 3], N0[i * 3 + 1], N0[i * 3 + 2]) < 0.5); }`;
  // the roof's paint after the knocks (v: the view; ref: paintFn's; aside: asideFn's): each painted point of its shell against the paint's
  // own colour there, t (its share of it, the hue kept): 1 - 0.6 q (q: its drop over the deepest any of them can go, dMax). The body's
  // shader takes a colour within 0.05 of a glass colour for glass (its sky, its glint): the darkening never takes one there (inGlass), nor
  // through it. A point of a facet with a corner the shader takes for glass already (its paint's colour, a black car's deep fold): the
  // paint's colour (asPaint). Black paint (luminance under 0.16, max - min under 0.06, not glassy, its -60 % one the guard below would
  // cut short: the user's "warmer black", xBlackU): on its warm way (a quadratic Bezier P -> P (1.644, 0.754, 0.363) -> P (0.56,
  // 0.474, 0.102); offWay), its luminance down by 55 % q (bkErr) or stopped short of the glass colours (bkStop: no nearer than 0.066, or
  // than it was, bkFar, bkNear; its next step would be) or held back with its facet's other warm corners where its colours across it
  // would come within 0.0505 of one (bkPull, xBkFacet), never lighter (bkUp; bkRise: a way lighter at first, a reddish black's); the
  // deep half (q > 0.5): its mean luminance drop bkDeep, warm there (red >= blue, bkCold none). Any other whose darkening would come within R of a glass colour on its way from the paint's
  // colour (R 0.066, 0.0505 for a paint 0.05..0.066 off it already): at that sphere's near edge, or the paint's colour where it is nearer
  // than R (guard: as dark as keeps it off and never through it, never lighter than the paint); the deepest other one's t (kmax). Over the
  // roof's facets the area (in plan) the shader newly takes for glass, their colours interpolated across them (glassA, of roofA). The
  // rest of the body as the paint gives it, the lining and the posts as built (the paint never touches them)
  const darkFn = `(v, ref, aside) => { const xc = v.xc, rf = xc.rf, G = rf.G, geo = v.body.geometry, ca = geo.attributes.color.array, pos = geo.attributes.position.array, n = ca.length / 3;
    const GL = [[0.1, 0.13, 0.19], [0.04, 0.05, 0.08]], dG = (c, Q) => Math.hypot(c[0] - Q[0], c[1] - Q[1], c[2] - Q[2]), glassy = (c) => GL.some(Q => dG(c, Q) < 0.05);   // (the glass colours: GLASS, KIT_GL2; the shader's test)
    const painted = (i) => !(xc.keep[i] || (v.xtCut && v.xtCut[i])), skip = (i) => !painted(i) || aside(i);   // (the glass, the lamps, a broken pane's cut: never painted)
    const asP = (i) => { const t = (i / 3) | 0; for (let q = 0; q < 3; q++) { const j = t * 3 + q; if (painted(j) && glassy(ref(j))) return true; } return false; };   // (its facet glass to the shader in part already)
    let dMax = 0, nE = 0; for (let e = 0; e < G.nS; e++) dMax = Math.max(dMax, G.L[e] * G.W[e]);
    const o = { n: 0, err: 0, hue: 0, lighter: 0, asPaint: 0, errA: 0, guard: 0, edge: 0, inGlass: 0, glassA: 0, roofA: 0, qmax: 0, kmax: 1, sunk: 0, tSunk: 0, n0: 0, err0: 0, nR: 0, errR: 0, nL: 0, errL: 0, nan: 0, dMax: +G.dMax.toFixed(4), dMaxOk: G.dMax === dMax, idx: true,
      bk: 0, offWay: 0, bkErr: 0, bkStop: 0, bkPull: 0, bkStopBad: 0, bkFar: Infinity, bkNear: Infinity, bkUp: 0, bkDeep: 0, bkDeepN: 0, bkMax: 0, bkCold: 0, bkRise: 0 };
    const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], BQ = [1.644, 0.754, 0.363], BT = [0.56, 0.474, 0.102], way = (P, u) => P.map((x, k) => x * ((1 - u) * (1 - u) + 2 * u * (1 - u) * BQ[k] + u * u * BT[k]));   // (black paint's warm way)
    // (a facet's colours, interpolated: how near they come to Q, sampled finely (64 steps a side); pulled: a facet whose warm corners its
    // colours across it held back, the nearest of them at 0.0505 off a glass colour (or the paint's own nearest))
    const triD = (X, Q) => { let m = Infinity; for (let a = 0; a <= 64; a++) for (let b = 0; a + b <= 64; b++) { const w = [1 - (a + b) / 64, a / 64, b / 64]; m = Math.min(m, dG([0, 1, 2].map(k => w[0] * X[0][k] + w[1] * X[1][k] + w[2] * X[2][k]), Q)); } return m; };
    const pulled = (i) => { const t = (i / 3) | 0, c = [t * 3, t * 3 + 1, t * 3 + 2]; if (c.some(skip)) return false; const Pc = c.map(ref), Fc = c.map(j => [ca[j * 3], ca[j * 3 + 1], ca[j * 3 + 2]]);
      return GL.some(Q => { const d = triD(Fc, Q); return d >= Math.min(0.0505, triD(Pc, Q)) - 2e-3 && d < Math.min(0.0505, triD(Pc, Q)) + 2e-3; }); };
    for (let i = 0; i < n; i++) if (G.vE[i] >= 0) { nE++; if (G.sI[G.vE[i]] !== i) o.idx = false; } if (nE !== G.nS) o.idx = false;   // (vE: each shell point's own entry, none for any other)
    for (let e = 0; e < G.nS; e++) { const i = G.sI[e]; if (skip(i)) continue; const P = ref(i), F = [ca[i * 3], ca[i * 3 + 1], ca[i * 3 + 2]], pp = P[0] * P[0] + P[1] * P[1] + P[2] * P[2], q = Math.min(1, rf.d[e] / dMax), kd = 1 - 0.6 * q;
      const t = pp > 1e-9 ? (F[0] * P[0] + F[1] * P[1] + F[2] * P[2]) / pp : kd, seg = (Q, s0) => { const s = Math.min(1, Math.max(s0, pp > 1e-9 ? (P[0] * Q[0] + P[1] * Q[1] + P[2] * Q[2]) / pp : 1)); return dG([P[0] * s, P[1] * s, P[2] * s], Q); };   // (seg: the nearest its way from s0 x its paint's colour to that colour comes to Q)
      o.n++; for (let c = 0; c < 3; c++) if (!Number.isFinite(F[c])) o.nan++;
      if (GL.some(Q => dG(F, Q) < 0.05 && dG(P, Q) >= 0.05)) o.inGlass++;   // (taken into a glass colour by the darkening, as the shader sees it)
      const R = GL.map(Q => dG(P, Q) >= 0.066 ? 0.066 : 0.0505), Gk = kd < 1 ? GL.map((Q, j) => seg(Q, kd) < R[j] ? j : -1).filter(j => j >= 0) : [];   // (Gk: the glass colours the darkening would come within R of)
      const black = !glassy(P) && lum(P) < 0.16 && Math.max(...P) - Math.min(...P) < 0.06 && GL.some((Q, j) => seg(Q, 0.4) < R[j]);   // (black paint: its full -60 % one the guard would cut short)
      if (kd < 1 && asP(i)) { o.asPaint++; o.errA = Math.max(o.errA, Math.abs(t - 1)); }
      else if (kd < 1 && black) {   // (black paint: its warm way)
        o.bk++; const L0 = lum(P), Lr = lum(F) / L0, Lt = 1 - 0.55 * q, dP = Math.min(...GL.map(Q => dG(P, Q))), dF = Math.min(...GL.map(Q => dG(F, Q))), lim = Math.min(0.066, dP);
        let ub = 0, db = Infinity; for (let s = 0; s <= 4096; s++) { const u = s / 4096, w = way(P, u), d = dG(w, F); if (d < db) { db = d; ub = u; } } o.offWay = Math.max(o.offWay, db);   // (F on the way: at ub)
        if (Lr > 1 + 1e-6) o.bkUp++; if (lum(way(P, 0.05)) > L0) o.bkRise++;   // (bkRise: a reddish black, its way lighter at first)
        if (Math.abs(Lr - Lt) < 1e-4 || (lum(way(P, 1)) / L0 > Lt && ub > 0.999)) o.bkErr = Math.max(o.bkErr, Math.abs(Lr - Math.max(Lt, lum(way(P, 1)) / L0)));   // (as dark as it should be, or the way's end)
        else { const nx = way(P, Math.min(1, ub + 1 / 64));
          if (Lr > Lt && dF < lim + 0.006 && Math.min(...GL.map(Q => dG(nx, Q))) < lim + 0.006) o.bkStop++;   // (stopped short, the glass colours near: its next step at their edge)
          else if (Lr > Lt - 1e-4 && pulled(i)) o.bkPull++; else o.bkStopBad++; }   // (held back with its facet's other warm corners: its colours across it at the glass's edge)
        if (dP >= 0.066) o.bkFar = Math.min(o.bkFar, dF); else o.bkNear = Math.min(o.bkNear, dF - dP);   // (no nearer them than 0.066, or than it was)
        if (q > 0.5) { o.bkDeep += 1 - Lr; o.bkDeepN++; if (F[0] < F[2] - 1e-6) o.bkCold++; } o.bkMax = Math.max(o.bkMax, 1 - Lr);
        if (q > 0.5) { o.sunk++; o.tSunk += Lr; } continue; }
      else if (Gk.length) { o.guard++; if (t > kd && t <= 1 + 1e-6 && Gk.every(j => seg(GL[j], t) >= Math.min(R[j], dG(P, GL[j])) - 1e-4) && (t >= 1 - 1e-6 ? Gk.some(j => dG(P, GL[j]) < R[j] + 1e-4) : Gk.some(j => Math.abs(dG(F, GL[j]) - R[j]) < 1e-4))) o.edge++; }   // (at a sphere's near edge, never nearer on its way; the paint's colour only where it is in one)
      else { o.err = Math.max(o.err, Math.abs(t - kd)); if (q > o.qmax && pp > 0.01) { o.qmax = q; o.kmax = t; } }
      for (let c = 0; c < 3; c++) { o.hue = Math.max(o.hue, Math.abs(F[c] - P[c] * t)); if (F[c] > P[c] + 1e-6) o.lighter++; }   // (any other: its own hue, never lighter)
      if (q > 0.5) { o.sunk++; o.tSunk += t; }
      if (rf.d[e] < 1e-6) { o.n0++; o.err0 = Math.max(o.err0, Math.abs(t - 1)); } }   // (not sunk: the paint's own colour)
    for (let tr = 0; tr < (xc.on / 3 | 0); tr++) { const c = [tr * 3, tr * 3 + 1, tr * 3 + 2]; if (!c.some(i => G.vE[i] >= 0) || c.some(skip)) continue;   // (the roof's facets: a corner the shell's, all three painted)
      const Pc = c.map(ref), Fc = c.map(i => [ca[i * 3], ca[i * 3 + 1], ca[i * 3 + 2]]), ax = pos[c[1] * 3] - pos[c[0] * 3], az = pos[c[1] * 3 + 2] - pos[c[0] * 3 + 2], bx = pos[c[2] * 3] - pos[c[0] * 3], bz = pos[c[2] * 3 + 2] - pos[c[0] * 3 + 2], ar = Math.abs(ax * bz - az * bx) / 2;
      let nw = 0, ns = 0; for (let a = 0; a <= 8; a++) for (let b = 0; a + b <= 8; b++) { const w = [1 - (a + b) / 8, a / 8, b / 8], mix = (X) => [0, 1, 2].map(k => w[0] * X[0][k] + w[1] * X[1][k] + w[2] * X[2][k]); ns++; if (glassy(mix(Fc)) && !glassy(mix(Pc))) nw++; }
      o.roofA += ar; o.glassA += ar * nw / ns; }
    for (let i = 0; i < xc.on; i++) { if (G.vE[i] >= 0 || skip(i)) continue; const P = ref(i); o.nR++; for (let c = 0; c < 3; c++) { const a = ca[i * 3 + c]; if (!Number.isFinite(a)) o.nan++; o.errR = Math.max(o.errR, Math.abs(a - P[c])); } }
    for (const L of [G.lI, G.fI]) for (const i of L) { if (aside(i)) continue; o.nL++; for (let c = 0; c < 3; c++) o.errL = Math.max(o.errL, Math.abs(ca[i * 3 + c] - xc.col0[i * 3 + c])); }
    o.tSunk = o.sunk ? +(o.tSunk / o.sunk).toFixed(4) : 1; o.bkDeep = o.bkDeepN ? +(o.bkDeep / o.bkDeepN).toFixed(4) : 0; o.bkMax = +o.bkMax.toFixed(4);
    for (const k of ['bkFar', 'bkNear']) o[k] = Number.isFinite(o[k]) ? +o[k].toFixed(5) : null; for (const k of ['err', 'hue', 'errA', 'err0', 'errR', 'errL', 'offWay', 'bkErr']) o[k] = +o[k].toExponential(2); o.qmax = +o.qmax.toFixed(4); o.kmax = +o.kmax.toFixed(4); o.glassA = +o.glassA.toFixed(5); o.roofA = +o.roofA.toFixed(3);
    return o; }`;

  // 1. off
  const off = await run({}, () => { const P = window.__game.race.player, I = Render.crashInfo(), me = I.cars.find(q => q.player);
    Core.applyDamage(P, 0.12, P.m.len / 2, 0); Render.frame(0.016, 1, P, 'chase', {});
    const I2 = Render.crashInfo(), me2 = I2.cars.find(q => q.player);
    return { XC: I.XC, XR: Object.assign({}, Core.XR), xOn: me.xOn, xd: me.xd, dense: I.cars.filter(q => q.xd).length, outerN: me.outerN, kit: Render.kitInfo('tornado').outerN, cl: me2.cl.length, shards: I2.shards, ground: I2.ground }; });
  T.check('off by default: no switch on (Core: roll, bump, ai, handle, glass; Render: body, glass, paint, parts, drag, dust), no car dense, the body as the kit built it', JSON.stringify(off.r.XR) === '{"roll":0,"bump":0,"ai":0,"handle":0,"glass":0}' && !off.r.XC.parts && !off.r.XC.drag && !off.r.XC.dust && !off.r.XC.body && !off.r.XC.glass && !off.r.XC.paint && !off.r.xOn && off.r.dense === 0 && off.r.outerN === off.r.kit, JSON.stringify(off.r));
  T.check('off: a dent the old way (no clusters), nothing on the road', off.r.cl === 0 && off.r.shards === 0 && off.r.ground === 0, JSON.stringify(off.r));
  T.check('off: no page errors', !off.errors.length, off.errors.slice(0, 3).join(' | '));

  // 2.-5. on (Normalni)
  const on = await run({ xBody: 1, xGlass: 1, xPaint: 1, carDet: 'normal' }, (hs) => {
    const hit = eval(hs), g = window.__game, P = g.race.player, info = () => Render.crashInfo().cars.find(q => q.player), out = {};
    const me = info(), v = Render.viewOf(P), geo = v.body.geometry, U = geo.userData;
    out.dense = { xd: me.xd, outerN: me.outerN, kit: Render.kitInfo('tornado').outerN, rivals: Render.crashInfo().cars.filter(q => !q.player && q.xd).length };
    let okR = true; for (const n in U.ranges) { const R = U.ranges[n]; if (R.o[0] > R.o[1] || R.o[1] > U.outerN || R.o[0] % 3 || R.o[1] % 3) okR = false; if (R.i && (R.i[0] < U.outerN || R.i[1] > U.N)) okR = false; }
    out.ranges = okR && U.paint.i.length > 0 && Math.max(...U.paint.i) < U.N && geo.drawRange.count === U.outerN;
    // the nose, blow after blow
    out.depth = []; out.dmgs = []; for (let k = 0; k < 6; k++) { hit(P, [0.12, 1, [-0.2, 0.1, -0.1, 0.2, 0, -0.15][k]]); const c = info().cl.find(q => q.u > 0.8); out.depth.push(c ? c.d : 0); out.dmgs.push(P.dmg); }
    const me2 = info(); out.cap = me2.caps.F; out.torn = me2.torn; out.engine = me2.engine;
    const a = geo.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad;
    return out; }, hitFn);
  const D = on.r;
  T.check('on: the player\'s car dense, its outer shell split, the rivals as built (Normalni)', D.dense.xd > 0 && D.dense.outerN > D.dense.kit * 1.5 && D.dense.rivals === 0, JSON.stringify(D.dense));
  T.check('on: the dense body\'s ranges, paint list and drawn block consistent', D.ranges, '');
  T.check('on: blow after blow on the nose the crush goes deeper: no deeper than 0.3 m till the car is 70 % gone (the face keeps its shape), then on', D.depth.every((d, k) => (k === 0 || d >= D.depth[k - 1] - 1e-9) && (D.dmgs[k] >= 0.7 || d <= 0.3 + 1e-9)) && D.depth[0] > 0.1 && D.depth[1] > D.depth[0] && D.depth[5] > 0.42 && D.dmgs[5] >= 0.7, D.depth.map((d, k) => d.toFixed(2) + ' (' + Math.round(D.dmgs[k] * 100) + ' %)').join(' '));
  T.check('on: the crush stops short of the windscreen (its cap)', D.depth[5] <= D.cap + 1e-6 && D.depth[5] > 0.6 * D.cap, 'depth ' + D.depth[5].toFixed(2) + ' cap ' + D.cap.toFixed(2));
  T.check('on: a deep front crush tears the bonnet open, the grey engine shows', D.torn && D.engine, JSON.stringify({ torn: D.torn, engine: D.engine }));
  T.check('on: no NaN in the body', D.nan === 0, 'NaN ' + D.nan);
  T.check('on: no page errors', !on.errors.length, on.errors.slice(0, 3).join(' | '));

  const gl = await run({ xBody: 1, xGlass: 1, xPaint: 1, carDet: 'normal' }, (hs) => {
    const hit = eval(hs), P = window.__game.race.player, me = () => Render.crashInfo().cars.find(q => q.player), out = { steps: [] };
    const v = Render.viewOf(P), g0 = Render.crashInfo().ground, s0 = Render.crashInfo().shards;   // (what the race's first seconds left on the road)
    const panes = () => me().panes || [0, 0, 0, 0, 0, 0];
    for (const h of [[0.1, 0.3, 1], [0.1, -0.4, 1], [0.1, 0.25, 1]]) { hit(P, h); out.steps.push(panes().slice()); }
    out.sides = (v.xP || []).map(q => q.side); out.shards = Render.crashInfo().shards - s0;
    out.mir = me().mirrors.slice(); out.ground = Render.crashInfo().ground - g0;
    // the car drives on: the mirror stays where it fell
    for (let k = 0; k < 30; k++) { P.x += Math.cos(P.h) * 0.5; P.z += Math.sin(P.h) * 0.5; P.px = P.x; P.pz = P.z; Render.frame(1 / 30, 1, P, 'chase', {}); }
    out.ground2 = Render.crashInfo().ground - g0;
    // driven over (the user's): the car back over the glass three times at 54 km/h (the race's clock on a second each time): each pass
    // scatters it, some pieces off, the others aside, smaller and faded; the car put back where it stood
    { const g = window.__game, g0 = Render.xShOn(P.x - Math.cos(P.h) * 15, P.z - Math.sin(P.h) * 15, 3), gx = g0.cx, gz = g0.cz, x1 = P.x, z1 = P.z; out.run = [Render.xShOn(gx, gz, 3)];   // (through the middle of the glass)
      for (let pass = 0; pass < 3; pass++) { g.race.time += 1; P.x = gx - Math.cos(P.h) * 6; P.z = gz - Math.sin(P.h) * 6; P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15; P.speed = 15;
        for (let k = 0; k < 24; k++) { P.x += Math.cos(P.h) * 0.5; P.z += Math.sin(P.h) * 0.5; P.px = P.x; P.pz = P.z; Render.frame(1 / 30, 1, P, 'chase', {}); }
        out.run.push(Render.xShOn(gx, gz, 3)); }
      P.vx = P.vz = 0; P.speed = 0; P.x = P.px = x1; P.z = P.pz = z1; Render.frame(1 / 30, 1, P, 'chase', {}); }
    // the left side again and again: the roof sinks on the left
    for (let k = 0; k < 5; k++) hit(P, [0.12, [0.1, -0.05, 0.15, 0, 0.05][k], -1]);
    const xc = v.xc, R = xc.rest, a = v.body.geometry.attributes.position.array, B = xc.B; let sL = 0, nL = 0, sR = 0, nR = 0;
    for (let i = 0; i < xc.on; i++) { const y = R[i * 3 + 1], z = R[i * 3 + 2], x = R[i * 3]; if (y < B.y0 + B.H * 0.85 || Math.abs(x) > 1 || (v.kit.deadV && v.kit.deadV[i])) continue; const d = a[i * 3 + 1] - y; if (z < -0.2) { sL += d; nL++; } else if (z > 0.2) { sR += d; nR++; } }
    out.roofL = nL ? sL / nL : 0; out.roofR = nR ? sR / nR : 0;
    out.rd = v.kit.xRD ? v.kit.xRD.slice() : [0, 0]; out.leftPanes = (v.xP || []).filter(q => q.side === -1).map(q => q.broken);
    return out; }, hitFn);
  const Gs = gl.r, side = (k) => Gs.sides[k];
  const newIdx = Gs.steps.map((s, j) => s.findIndex((b, k) => b && !(j ? Gs.steps[j - 1][k] : 0)));
  T.check('glass: each blow on the right breaks one more pane, on the right or the windscreen / rear window, never on the left',
    Gs.steps.every((s, j) => s.filter(Boolean).length === j + 1) && newIdx.every(k => k >= 0 && side(k) !== -1), JSON.stringify({ steps: Gs.steps, sides: Gs.sides }));
  T.check('glass: pieces lie on the road after', Gs.shards > 10, 'shards ' + Gs.shards);
  T.check('glass driven over three times through its middle: each pass less of it (some off, the rest aside and smaller), after three passes at most 85 % of the pieces and 80 % of their size left',
    Gs.run[0].n > 10 && Gs.run[1].n < Gs.run[0].n && Gs.run.every((q, k) => !k || (q.n <= Gs.run[k - 1].n && q.sc <= Gs.run[k - 1].sc + 1e-6)) && Gs.run[3].n <= 0.85 * Gs.run[0].n && Gs.run[3].sc <= 0.8 * Gs.run[0].sc, JSON.stringify(Gs.run.map(q => ({ n: q.n, sc: q.sc })))); 
  T.check('mirrors: the first right blow knocks the right one off, the left one stays', !Gs.mir[0] && Gs.mir[1] && Gs.ground === 1, JSON.stringify({ mir: Gs.mir, ground: Gs.ground }));
  T.check('mirrors: it stays on the road while the car drives on', Gs.ground2 === 1, 'ground ' + Gs.ground2);
  T.check('roof: after blows on the left again and again it sinks on the left (the shell; more than the right, hit three times first: the Tornado\'s cage holds both sides\' rails within some 4 cm)', Gs.roofL < -0.03 && Gs.roofL < Gs.roofR - 0.005, 'left ' + Gs.roofL.toFixed(3) + ' right ' + Gs.roofR.toFixed(3));
  T.check('glass: a rear door swung open has its window broken (both panes on that side)', Gs.rd[0] && Gs.leftPanes.length === 2 && Gs.leftPanes.every(Boolean), JSON.stringify({ rearDoors: Gs.rd, leftPanes: Gs.leftPanes }));
  T.check('glass / mirrors / roof: no page errors', !gl.errors.length, gl.errors.slice(0, 3).join(' | '));

  // 6. one of the 11, and switching off during a race
  const lg = await run({ xBody: 1, xGlass: 1, xPaint: 0, carDet: 'normal', carId: 'rally' }, (hs) => {
    const hit = eval(hs), P = window.__game.race.player, me = () => Render.crashInfo().cars.find(q => q.player), out = {};
    out.kit = !!P.m.kit; out.xd = me().xd; for (const h of [[0.12, 1, -0.9], [0.12, 1, -0.8], [0.1, 0.2, 1]]) hit(P, h);
    const a = Render.viewOf(P).body.geometry.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad; out.cl = me().cl.length;
    document.querySelector('[data-set="xBody"] button[data-v="0"]').click(); Render.frame(0.016, 1, P, 'chase', {});
    out.after = me(); return out; }, hitFn);
  T.check('one of the 11 (the rally car): dense, dented the new way, no NaN', !lg.r.kit && lg.r.xd > 0 && lg.r.cl > 0 && lg.r.nan === 0, JSON.stringify({ kit: lg.r.kit, xd: lg.r.xd, cl: lg.r.cl, nan: lg.r.nan }));
  T.check('switched off during a race: the cars built again as before', !lg.r.after.xOn && !lg.r.after.xd, JSON.stringify({ xOn: lg.r.after.xOn, xd: lg.r.after.xd }));
  T.check('one of the 11: no page errors', !lg.errors.length, lg.errors.slice(0, 3).join(' | '));

  // 8. parts on the track, dust and bits, a bumper dragging (on), and the same with the three off
  const pd = {};
  for (const [k, s] of [['on', { xBody: 1, xParts: 1, xDust: 1, xDrag: 1 }], ['off', { xBody: 1 }]]) pd[k] = await run(s, (hs) => {
    const hit = eval(hs), g = window.__game, R = g.race, P = R.player, v = Render.viewOf(P), out = {};
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; c.rpm = 0; c.shiftT = 0; const cv = Render.viewOf(c); if (cv && cv.cfx) { cv.cfx.pop = 0; cv.cfx.thr = 0; } }   // (the cars round it quiet too: no exhaust pops left from before, theirs among the sparks counted)
    { const T = R.track, i = T.idx(P.q.s); P.place(T.px[i], T.pz[i], T.hd[i]); P.q = T.query(P.x, P.z, i, P.q); if (T.hasElev) P.y = P.py = T.hy[i]; P.roadY = P.y; }   // (the middle of the road: where the start left it, it may rub the barrier, its own sparks)
    P.dmg = Math.max(P.dmg, 0.7);   // (the tail hangs loose only once the car is 70 % gone: Core.maskHeld)
    for (let k = 0; k < 14 && !v.kit.ajar.bumperR && !P.lost.bumperR; k++) hit(P, [0.06, -1, 0.1]);
    out.ajar = !!v.kit.ajar.bumperR && !P.lost.bumperR;
    // driving on at 15 m/s with it hanging: sparks off its low end
    P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15; P.rpm = 0; P.shiftT = 0; if (v.cfx) { v.cfx.pop = 0; v.cfx.thr = 0; } Render.frame(1 / 30, 1, P, 'chase', {}); P.fxWall = P.fxCar = 0;   // (low revs: no exhaust pops, its random sparks, nor a string of them left from a lift before the test (render carFx: v.cfx.pop); the knocks' sparks had)
    const s0 = Render.fxStats().sparksN;
    for (let k = 0; k < 20; k++) Render.frame(1 / 30, 1, P, 'chase', {});
    out.drag = Render.fxStats().sparksN - s0; out.hubs = v.wheelOff.filter(Boolean).length; P.vx = 0; P.vz = 0;   // (a wheel off: its hub scrapes too, on and off)
    // a hard knock from another car: dust and bits
    const f0 = Render.fxStats().total; P.fxCar = 9; P.contactX = P.x + Math.cos(P.h) * 2.2; P.contactZ = P.z + Math.sin(P.h) * 2.2; Render.frame(0.016, 1, P, 'chase', {});
    out.dust = Render.fxStats().total - f0;
    // knocked off: the piece onto the road, resting; then pushed out of the core's 40
    for (let k = 0; k < 20 && !P.lost.bumperR; k++) hit(P, [0.1, -1, 0]);
    out.lost = !!P.lost.bumperR;
    for (let k = 0; k < 240; k++) { R.step(1 / 120); if (k % 8 === 0) Render.frame(1 / 15, 1, P, 'chase', {}); }
    const d = R.debris.find(q => q.car === P.id && q.part === 'bumperR'); out.piece = !!(d && d.mesh && d.mesh.traverse); out.rest = !!(d && (d.rest || d.ground));
    if (d) { d.dead = true; R.debris.splice(R.debris.indexOf(d), 1); }
    for (let k = 0; k < 3; k++) Render.frame(1 / 30, 1, P, 'chase', {});
    out.kept = Render.crashInfo().kept; out.drawn = !!(d && d.mesh && d.mesh.parent);
    // rolling over (c.rl, as the core sets it): its black underside drawn while it rolls, gone after
    out.und0 = !!v.xUnd; P.rl = { t: 0.4, T: 1.2, turns: 1, dir: 1, H: 1, k: 0 }; Render.frame(0.016, 1, P, 'chase', {});
    out.und1 = !!(v.xUnd && v.xUnd.visible); out.undTris = v.xUnd ? v.xUnd.geometry.attributes.position.count / 3 : 0;
    delete P.rl; Render.frame(0.016, 1, P, 'chase', {}); out.und2 = !!(v.xUnd && v.xUnd.visible);
    return out; }, hitFn);
  const PO = pd.on.r, PF = pd.off.r;
  T.check('parts: a rear bumper knocked loose drags on the road throwing sparks (off: only a hub\'s, if a wheel is off)', PO.ajar && PF.ajar && PO.hubs === PF.hubs && PO.drag > PF.drag + 9 && (PF.hubs || PF.drag === 0), JSON.stringify({ on: [PO.ajar, PO.drag, PO.hubs], off: [PF.ajar, PF.drag, PF.hubs] }));
  T.check('dust: a hard knock throws dust and bits (more than off)', PO.dust > PF.dust + 6, JSON.stringify({ on: PO.dust, off: PF.dust }));
  T.check('parts: knocked off, the piece lies on the road and, pushed out of the core\'s 40, stays drawn (off: freed)', PO.lost && PO.piece && PO.rest && PO.kept === 1 && PO.drawn && PF.lost && PF.kept === 0 && !PF.drawn, JSON.stringify({ on: PO, off: PF }));
  T.check('rolling over: the black underside drawn only while the car rolls', !PO.und0 && PO.und1 && PO.undTris > 30 && !PO.und2, JSON.stringify({ before: PO.und0, rolling: PO.und1, tris: PO.undTris, after: PO.und2 }));
  T.check('parts / dust / drag: no page errors', !pd.on.errors.length && !pd.off.errors.length, pd.on.errors.concat(pd.off.errors).slice(0, 3).join(' | '));

  // 9. the Kolibri's damage table (the user's: 12 directions x 3 strengths; Render xTabHit), each scene on the car built afresh
  const kt = await run({ xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carDet: 'normal', carId: 'kolibri' }, (hs) => {
    const hit = eval(hs), g = window.__game, R = g.race, P = R.player, out = {}, me = () => Render.crashInfo().cars.find(q => q.player);
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
    const settle = (n) => { for (let k = 0; k < (n || 12); k++) Render.frame(0.05, 1, P, 'chase', {}); };
    const scene = (hits, d0) => { R.repairCar(P); if (d0) P.dmg = d0; Render.frame(0.016, 1, P, 'chase', {}); const g0 = Render.crashInfo().ground; for (const h of hits) { hit(P, h); settle(); } const x = me().xt; return Object.assign({}, x, { ground: Render.crashInfo().ground - g0, lost: Object.keys(P.lost) }); };
    // (from 70 %, d0: the table's parts hang and come off as it has them; under it the face and the tail stay, Core.maskHeld)
    out.fs = scene([[0.3, 1, 0]]); out.fm = scene([[0.15, 1, 0]]); out.fl = scene([[0.05, 1, 0]]);
    { const v = Render.viewOf(P), Q = v.xtP && v.xtP.W, D = Q && v.xtO ? v.xtO.cx.getImageData(Q.ox, Q.oy, Q.W, Q.H).data : null; let top = 0, bot = 0;   // (its hole: in the picture the top half's, not the bottom's)
      if (D) for (let y = 0; y < Q.H; y++) for (let x = 0; x < Q.W; x++) if (D[(y * Q.W + x) * 4 + 3] < 128) { if (y < Q.H / 2) top++; else bot++; }
      out.hole = { top, bot }; }
    out.fs7 = scene([[0.3, 1, 0]], 0.7); out.fm7 = scene([[0.15, 1, 0]], 0.7);
    // the nose knocked again and again to ~60 %: its end no deeper than 0.3 m (the roof field's own points apart), nothing of the face loose,
    // the bonnet whole; then at 70 % one more: deeper
    { R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); out.n6 = [];
      const endMax = () => { const v = Render.viewOf(P), xc = v.xc, a = v.body.geometry.attributes.position.array, Rr = xc.rest, n = Rr.length / 3, skip = new Uint8Array(n), G = xc.rf && xc.rf.G, dv = v.kit && v.kit.deadV;
        if (G) { for (let k = 0; k < G.nS; k++) skip[G.sI[k]] = 1; for (let k = 0; k < G.nL; k++) skip[G.lI[k]] = 1; for (let k = 0; k < G.nF; k++) skip[G.fI[k]] = 1; for (const Q of G.rid) for (const [s0, s1] of Q.ranges) skip.fill(1, s0, s1); }
        let mx = 0; for (let i = 0; i < n; i++) { if (skip[i] || (dv && dv[i])) continue; const d = Math.hypot(a[i * 3] - Rr[i * 3], a[i * 3 + 1] - Rr[i * 3 + 1], a[i * 3 + 2] - Rr[i * 3 + 2]); if (d > mx) mx = d; } return +mx.toFixed(4); };
      for (const w of [0, 0.3, -0.3, 0.15, -0.15, 0]) { hit(P, [0.1, 1, w]); settle(); const x = me(); out.n6.push({ dmg: +P.dmg.toFixed(3), end: endMax(), d: Math.max(0, ...x.cl.map(q => q.d)), ajar: x.xt.ajar, dead: x.xt.dead, torn: x.torn }); }
      P.dmg = Math.max(P.dmg, 0.7); hit(P, [0.1, 1, 0]); settle(); const x = me(); out.n7 = { dmg: +P.dmg.toFixed(3), end: endMax(), d: Math.max(0, ...x.cl.map(q => q.d)), ajar: x.xt.ajar, dead: x.xt.dead }; }
    out.bl = scene([[0.05, -1, 0]]); out.slm = scene([[0.3, 0, -1]]); out.srf = scene([[0.3, 0.4, 1]]); out.slf = scene([[0.15, 0.45, -1]]);
    // the mirror (the user's): its glass cracks on a light hit by it, breaks on a medium one (the mirror half folded back), a hard one presses
    // it flat in against the body; struck as hard there again it comes off
    out.ml = scene([[0.05, 0.45, -1]]); out.mf = scene([[0.3, 0.45, -1], [0.3, 0.45, -1]]);
    { R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); const v = Render.viewOf(P), U = v.body.geometry.userData, Rm = U.ranges.mirrorL, a = v.body.geometry.attributes.position.array, M = U.ranges.mirrorL.mir;
      const ext = () => { let zo = 1e9; for (let i = Rm.o[0]; i < Rm.o[1]; i++) zo = Math.min(zo, a[i * 3 + 2]); return zo; };   // (its outermost point: the left's most negative z)
      const z0 = ext(); hit(P, [0.3, 0.45, -1]); settle(); out.press = { before: +z0.toFixed(3), after: +ext().toFixed(3), mir: !!M, nan: Array.from(a.subarray(Rm.o[0] * 3, Rm.o[1] * 3)).some(q => !Number.isFinite(q)) }; }
    // again and again from behind (light, apart): the rear window a stage on each time; 2. the rear lamp, 3. the spoiler hangs, 4. off (the
    // spoiler from 70 %, d0; under it it stays: the user's 2B; the first knock breaks the nearer rear lamp: 1B)
    for (const [key, d0] of [['rear', 0], ['rear7', 0.7]]) {
      R.repairCar(P); if (d0) P.dmg = d0; Render.frame(0.016, 1, P, 'chase', {}); out[key] = []; const g0 = Render.crashInfo().ground;
      for (let k = 0; k < 4; k++) { hit(P, [0.05, -1, 0.1]); settle(); const x = me().xt; out[key].push({ R: x.panes.R, lamp2: x.lamps[2], lamp3: x.lamps[3], hang: x.ajar.includes('spoiler'), off: x.dead.includes('spoiler') }); }
      out[key + 'Ground'] = Render.crashInfo().ground - g0; }
    // the windscreen only ever more broken; again on the nose, a stage on
    R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); out.ws = [];
    for (const a of [0.05, 0.05, 0.05]) { hit(P, [a, 1, 0]); settle(); out.ws.push(me().xt.panes.W); }
    hit(P, [0.3, 1, 0]); settle(); out.ws.push(me().xt.panes.W); hit(P, [0.05, 1, 0]); settle(); out.ws.push(me().xt.panes.W);
    // a mirror the core knocks off: its door window 75 % at least
    R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); P.lost.mirrorL = 1; settle(); out.mir = me().xt;
    // its broken glass: one mesh of its own, the body's triangles of those panes left out of the body (their colour's red -1)
    R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); hit(P, [0.15, 1, 0]); settle(); const v = Render.viewOf(P), col = v.body.geometry.attributes.color.array, W = v.xtP && v.xtP.W;
    out.mesh = { idx: me().xt.idx, cut: me().xt.cut, out: W ? W.tris.every(t => col[t * 9] === -1) : false, meshes: v.xtO ? v.bodyG.children.filter(m => m === v.xtO.mesh).length : 0, full: v.body.geometry.drawRange.count === v.body.geometry.userData.N };
    let bad = 0; const a = v.body.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad;
    return out; }, hitFn);
  const KT = kt.r, eq = (o, w) => Object.keys(w).every(k => Math.abs((o[k] || 0) - w[k]) < 1e-6) && Object.keys(o).every(k => (w[k] || 0) === (o[k] || 0));
  T.check('Kolibri: front, strong: windscreen 100 %, door windows 75 %, rear side windows 50 %, rear window whole; both head lamps, off; from 70 % the bonnet hangs and the bumper is off, under it both stay on (the user\'s 2B)',
    eq(KT.fs.panes, { W: 1, DL: 0.75, DR: 0.75, QL: 0.5, QR: 0.5 }) && KT.fs.lamps[0] && KT.fs.lamps[1] && ['headL', 'headR'].every(n => KT.fs.dead.includes(n)) && !KT.fs.ajar.includes('hood') && !KT.fs.dead.includes('bumperF')
    && KT.fs7.ajar.includes('hood') && ['bumperF', 'headL', 'headR'].every(n => KT.fs7.dead.includes(n)), JSON.stringify({ fs: KT.fs, fs7: KT.fs7 }));
  T.check('Kolibri: front, medium: windscreen 70 %, door windows 50 %; both head lamps; from 70 % the bumper hangs, under it it stays on', eq(KT.fm.panes, { W: 0.7, DL: 0.5, DR: 0.5 }) && !KT.fm.ajar.length && KT.fm.lamps[0] && KT.fm.lamps[1] && !KT.fm.dead.length && KT.fm7.ajar.includes('bumperF') && !KT.fm7.dead.length, JSON.stringify({ fm: KT.fm, fm7: KT.fm7 }));
  T.check('Kolibri: front, light: only the windscreen, 50 %; nothing hangs; one head lamp broken, the nearer one (the first knock on the front: the user\'s 1B)', eq(KT.fl.panes, { W: 0.5 }) && !KT.fl.ajar.length && KT.fl.lamps.slice(0, 2).filter(Boolean).length === 1 && KT.fl.lamps[1] && !KT.fl.lamps[2] && !KT.fl.lamps[3], JSON.stringify(KT.fl));
  T.check('Kolibri: the nose knocked again and again to ~60 %: its end no deeper than 0.3 m, nothing of the face loose, the bonnet whole (the user\'s 3B); at 70 % the next knock deeper',
    KT.n6.every(q => q.dmg < 0.7 && q.end <= 0.3 + 1e-3 && q.d <= 0.3 + 1e-6 && !q.ajar.some(n => /^(bumperF|hood)$/.test(n)) && !q.dead.some(n => /^(bumperF|hood)$/.test(n)) && !q.torn) && KT.n6[5].dmg >= 0.5 && KT.n6[5].end > 0.2 && KT.n7.d > 0.3 + 1e-3 && KT.n7.end > KT.n6[5].end + 0.02,
    JSON.stringify({ n6: KT.n6, n7: KT.n7 }));
  T.check('Kolibri: a broken pane\'s glass gone from its top, its lower part still in the frame', KT.hole.top > 500 && KT.hole.top > KT.hole.bot * 3, JSON.stringify(KT.hole));
  T.check('Kolibri: the bonnet\'s ridge: a strong front hit higher than a medium one, none on a light one', KT.fs.rg === 1 && KT.fm.rg === 0.5 && KT.fl.rg === 0 && KT.fm.bent.hoodUp > 0.04 && KT.fs.bent.hoodUp > KT.fm.bent.hoodUp + 0.03 && KT.fl.bent.hoodUp < 0.02, JSON.stringify({ strong: KT.fs.bent.hoodUp, medium: KT.fm.bent.hoodUp, light: KT.fl.bent.hoodUp }));
  T.check('Kolibri: rear, light: only the rear window, 50 %; the bumper in a V (~10 cm in the middle), the spoiler bent down in the middle',
    eq(KT.bl.panes, { R: 0.5 }) && KT.bl.bent.bumper[0] > 0.07 && KT.bl.bent.bumper[0] > KT.bl.bent.bumper[1] + 0.05 && KT.bl.bent.spoiler[0] > 0.06 && KT.bl.bent.spoiler[0] > KT.bl.bent.spoiler[1] + 0.04, JSON.stringify(KT.bl));
  T.check('Kolibri: a side hit never breaks the rear window; the right side the left\'s mirrored (front side, strong: its door window 100 %, windscreen 75 %, its mirror off, its head lamp)',
    !KT.slm.panes.R && !KT.srf.panes.R && !KT.slf.panes.R && eq(KT.srf.panes, { W: 0.75, DR: 1, QR: 0.5 }) && KT.srf.mir.fold.mirrorR === 90 && KT.srf.mir.glass.R === 1 && KT.srf.lamps[1] && eq(KT.slm.panes, { W: 0.5, DL: 1, QL: 0.75 }) && ['doorL', 'mirrorL'].every(n => KT.slm.dead.includes(n)), JSON.stringify({ srf: KT.srf, slm: KT.slm }));
  T.check('Kolibri: left side by the mirror, medium: windscreen 50 %, door window 70 %, the mirror\'s glass broken, the mirror half folded back (the door stays shut)', eq(KT.slf.panes, { W: 0.5, DL: 0.7 }) && KT.slf.mir.glass.L === 1 && KT.slf.mir.fold.mirrorL === 45 && !KT.slf.ajar.includes('doorL'), JSON.stringify(KT.slf));
  T.check('Kolibri: the mirrors: a light hit by one cracks its glass (the mirror stays out); a hard one presses it flat in against the body (its outer end 6 cm or more nearer the car); struck as hard there again it comes off',
    KT.ml.mir.glass.L === 0.5 && !KT.ml.mir.fold.mirrorL && KT.press.mir && KT.press.after > KT.press.before + 0.06 && !KT.press.nan && KT.mf.dead.includes('mirrorL'), JSON.stringify({ light: KT.ml.mir, press: KT.press, twice: KT.mf.dead }));
  T.check('Kolibri: from behind again and again: the rear window a stage on each time; the right rear lamp at the first (the nearer one, the user\'s 1B), the left one whole; the spoiler stays on under 70 % (2B)',
    KT.rear.map(q => q.R).join() === '0.5,0.7,0.75,1' && KT.rear.every(q => q.lamp3 && !q.lamp2 && !q.hang && !q.off) && KT.rearGround === 0, JSON.stringify(KT.rear) + ' ground ' + KT.rearGround);
  T.check('Kolibri: from behind again and again from 70 %: 3. the spoiler hangs, 4. it is off and on the road',
    KT.rear7.map(q => q.R).join() === '0.5,0.7,0.75,1' && !KT.rear7[1].hang && KT.rear7[2].hang && !KT.rear7[2].off && KT.rear7[3].off && KT.rear7Ground >= 1, JSON.stringify(KT.rear7) + ' ground ' + KT.rear7Ground);
  T.check('Kolibri: the windscreen only ever more broken (again on the nose: a stage on)', KT.ws.join() === '0.5,0.7,0.75,1,1', KT.ws.join());
  T.check('Kolibri: a mirror the core knocks off: its door window 75 %', KT.mir.panes.DL === 0.75 && KT.mir.dead.includes('mirrorL'), JSON.stringify(KT.mir));
  T.check('Kolibri: its broken glass one mesh of its own (the panes out of the body, the inside drawn), no NaN', KT.mesh.idx > 0 && KT.mesh.cut && KT.mesh.out && KT.mesh.meshes === 1 && KT.mesh.full && KT.nan === 0, JSON.stringify(KT.mesh) + ' NaN ' + KT.nan);
  T.check('Kolibri: no page errors', !kt.errors.length, kt.errors.slice(0, 3).join(' | '));
  // the table only the Kolibri's, only with its switches on
  const ko = await run({ carId: 'kolibri' }, () => { const P = window.__game.race.player, v = Render.viewOf(P); Core.applyDamage(P, 0.3, P.m.len / 2, 0); for (let k = 0; k < 6; k++) Render.frame(0.05, 1, P, 'chase', {});
    return { xt: Render.crashInfo().cars.find(q => q.player).xt, key: v.body.material.customProgramCacheKey(), mesh: !!v.xtO }; });
  const tt = await run({ xBody: 1, xGlass: 1 }, () => { const P = window.__game.race.player; return { xt: Render.crashInfo().cars.find(q => q.player).xt, key: Render.viewOf(P).body.material.customProgramCacheKey() }; });
  T.check('Kolibri off (the default): no table, the body\'s material as ever; another car with the switches on: no table either', ko.r.xt === null && ko.r.key === 'dirtyCarCg' && !ko.r.mesh && tt.r.xt === null && tt.r.key === 'dirtyCarCg' && !ko.errors.length && !tt.errors.length, JSON.stringify({ off: ko.r, tornado: tt.r }));

  // 10. the cars being reworked (the Medved, the Kozorog, the Lev R): the table theirs too (the spoiler: a wing where the car has one);
  // a crushed end caves the roof in, the harder the knock the deeper (the roof's own top, what lies on it left out)
  for (const id of ['kozorog', 'lev', 'medved']) {
    const ct = await run({ xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carDet: 'normal', carId: id }, (hs) => {
      const hit = eval(hs), g = window.__game, R = g.race, P = R.player, out = {}, me = () => Render.crashInfo().cars.find(q => q.player);
      for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
      const settle = () => { for (let k = 0; k < 12; k++) Render.frame(0.05, 1, P, 'chase', {}); };
      const scene = (h, d0) => { R.repairCar(P); if (d0) P.dmg = d0; Render.frame(0.016, 1, P, 'chase', {}); hit(P, h); settle(); const x = me(); return { panes: x.xt && x.xt.panes, ajar: x.xt && x.xt.ajar, dead: x.xt && x.xt.dead, lamps: x.xt && x.xt.lamps, roof: x.roof, rf: x.rf && { lref: x.rf.lref, rlim: x.rf.rlim } }; };
      out.fs = scene([0.3, 1, 0]); out.bl = scene([0.05, -1, 0]); out.bm = scene([0.15, -1, 0]); out.bs = scene([0.3, -1, 0]); out.bm7 = scene([0.15, -1, 0], 0.7);
      out.fl = scene([0.05, 1, 0.3]); out.rl = scene([0.05, -1, -0.3]);   // (the first knock on an end: its nearer lamp, the user's 1B)
      out.wing = !!Render.viewOf(P).body.geometry.userData.ranges.wing;
      // the nose knocked again and again to ~60 %: its end no deeper than 0.3 m (the roof field's own points apart), nothing of the face loose (3B, 2B)
      { R.repairCar(P); Render.frame(0.016, 1, P, 'chase', {}); out.n6 = [];
        const endMax = () => { const v = Render.viewOf(P), xc = v.xc, a = v.body.geometry.attributes.position.array, Rr = xc.rest, n = Rr.length / 3, skip = new Uint8Array(n), G = xc.rf && xc.rf.G, dv = v.kit && v.kit.deadV;
          if (G) { for (let k = 0; k < G.nS; k++) skip[G.sI[k]] = 1; for (let k = 0; k < G.nL; k++) skip[G.lI[k]] = 1; for (let k = 0; k < G.nF; k++) skip[G.fI[k]] = 1; for (const Q of G.rid) for (const [s0, s1] of Q.ranges) skip.fill(1, s0, s1); }
          let mx = 0; for (let i = 0; i < n; i++) { if (skip[i] || (dv && dv[i])) continue; const d = Math.hypot(a[i * 3] - Rr[i * 3], a[i * 3 + 1] - Rr[i * 3 + 1], a[i * 3 + 2] - Rr[i * 3 + 2]); if (d > mx) mx = d; } return +mx.toFixed(4); };
        for (const w of [0, 0.3, -0.3, 0.15, -0.15, 0]) { hit(P, [0.1, 1, w]); settle(); const x = me(); out.n6.push({ dmg: +P.dmg.toFixed(3), end: endMax(), ajar: x.xt.ajar, dead: x.xt.dead, torn: x.torn }); } }
      const a = Render.viewOf(P).body.geometry.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++; out.nan = bad;
      return out; }, hitFn);
    const C = ct.r, rf = [C.bl, C.bm, C.bs].map(q => q.roof.mean);
    T.check(`${id}: the table (front strong: windscreen 100 %, door windows 75 %; rear light: only the rear window 50 %)` + (C.wing ? '; rear medium: its wing hangs from 70 %, under it it stays on (the user\'s 2B, a wing for downforce too)' : ''),
      eq(C.fs.panes, { W: 1, DL: 0.75, DR: 0.75, QL: 0.5, QR: 0.5 }) && eq(C.bl.panes, { R: 0.5 }) && (!C.wing || (C.bm7.ajar.includes('wing') && !C.bm.ajar.includes('wing') && !C.bm.dead.includes('wing'))), JSON.stringify({ fs: C.fs.panes, bl: C.bl.panes, bm: C.bm.ajar, bm7: C.bm7.ajar }));
    T.check(`${id}: the first knock on the front breaks its nearer head lamp, on the rear its nearer rear lamp (the user's 1B)`, C.fl.lamps[1] && !C.fl.lamps[0] && C.rl.lamps[2] && !C.rl.lamps[3], JSON.stringify({ front: C.fl.lamps, rear: C.rl.lamps }));
    T.check(`${id}: the nose knocked again and again to ~60 %: its end no deeper than 0.3 m, the bumper and the bonnet neither hang nor off, the bonnet not torn (the user's 2B, 3B)`,
      C.n6.every(q => q.dmg < 0.7 && q.end <= 0.3 + 1e-3 && !q.ajar.some(n => /^(bumperF|hood)$/.test(n)) && !q.dead.some(n => /^(bumperF|hood)$/.test(n)) && !q.torn) && C.n6[5].dmg >= 0.5, JSON.stringify(C.n6));
    T.check(`${id}: from behind the roof caves in, the harder the knock the deeper (mean drop light < medium < strong, the strong one 3 cm or more; a caged roof 15 % of the deepest it can go)`, rf[0] > 0 && rf[0] < rf[1] && rf[1] < rf[2] && rf[2] >= Math.min(0.03, 0.15 * C.bs.rf.rlim) && C.bs.roof.max < 0.3, JSON.stringify([C.bl.roof, C.bm.roof, C.bs.roof, C.bs.rf]));
    T.check(`${id}: no NaN, no page errors`, C.nan === 0 && !ct.errors.length, ct.errors.slice(0, 3).join(' | '));
  }

  // 11. the roof field (the user's: seen from above, the roof more caved in after every crash, on every closed car, never through the
  // seats or the driver): 10 knocks from all sides (the 8th a rollover's roof contact, as core.js does it), each a visible step down while
  // the roof is far from its limit and still a step as it nears it (the budget lasts: no wall after five or six), no point past its own
  // limit, no roof facet turned over, the clearance over what is in the way kept (Goljat's outer cage a few cm under its roof too), the
  // posts' tops never through it, nothing in the way lifted; the same field every time (hash); a hard landing too. Two of the 11 (the
  // player's dense body) as well; a rival's coarse body (the Kolibri's, Normalni) through the knocks twice over. After the knocks the
  // roof's paint (the user's: the cave-in reads from above and from behind): each point of its shell darker by its drop over the deepest
  // any of them can go (60 % at that), on the colour the paint gives it there (its folds, its scrapes), never lighter, never into or
  // through a glass colour as the shader sees one, a point not sunk as the paint gives it, the rest of the body too, the lining and the
  // posts as built (darkFn); then a pit stop's repair (the crew's work stepped as repair.test.mjs does it) brings the colours back to the
  // car's as built, and Race.repairCar builds it afresh in them
  const RSEQ = [[0.15, -1, 0], [0.15, 1, -0.6], [0.15, 0.1, -1], [0.15, -1, 0.6], [0.3, 1, 0], [0.3, 0, 1], [0.05, -1, -0.6], 'top', [0.15, 1, 0.6], [0.15, -0.1, 1]], NK = RSEQ.length;
  // the crew's repair stepped by hand (repair.test.mjs) on the car Q (frames(k): k frames drawn): the painted points' colours against the
  // car's as built (xc.col0), the roof's and all of them, before, through it and after (Race.repairCar: built afresh); and at every one of
  // its 16 steps (REPAIR_N; the middle of each, and 0, 0.3, 0.65, 0.95) the roof shell's points (nNew) and the area (in plan) of its facets,
  // their colours interpolated (newA, of roofA), the body's shader takes for glass that it took for glass neither in the dent nor as built
  // (black paint's way back from its brown-black: never straight through KIT_GL2; repShell)
  const pitFn = `(Q, frames) => { const R = window.__game.race, v0 = Render.viewOf(Q), xc = v0.xc, G = xc.rf.G, C0 = xc.col0, K = v0.kit, pos = v0.body.geometry.attributes.position.array;
    const diff = (a, shell) => { const N = shell ? G.nS : a.length / 3; let m = 0;
      for (let j = 0; j < N; j++) { const i = shell ? G.sI[j] : j; if ((K && K.deadV && K.deadV[i]) || (shell && xc.keep[i])) continue; for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(a[i * 3 + c] - C0[i * 3 + c])); }
      return +m.toFixed(6); };
    const ca0 = v0.body.geometry.attributes.color.array.slice(), cut = v0.xtCut ? v0.xtCut.slice() : null, dead = K && K.deadV ? K.deadV.slice() : null, skip = (i) => xc.keep[i] || (cut && cut[i]) || (dead && dead[i]);
    const GL = [[0.1, 0.13, 0.19], [0.04, 0.05, 0.08]], glassy = (r, g, b) => GL.some(Q => (r - Q[0]) ** 2 + (g - Q[1]) ** 2 + (b - Q[2]) ** 2 < 0.0025);   // (the shader's test: within 0.05)
    const tris = [], seen = new Set(); let roofA = 0;
    for (let e = 0; e < G.nS; e++) { const t = (G.sI[e] / 3) | 0, c = t * 3; if (seen.has(t)) continue; seen.add(t); if (skip(c) || skip(c + 1) || skip(c + 2)) continue;
      const ar = Math.abs((pos[c * 3 + 3] - pos[c * 3]) * (pos[c * 3 + 8] - pos[c * 3 + 2]) - (pos[c * 3 + 5] - pos[c * 3 + 2]) * (pos[c * 3 + 6] - pos[c * 3])) / 2; tris.push([t, ar]); roofA += ar; }
    const glassNew = (a) => { let nNew = 0, newA = 0;
      for (let e = 0; e < G.nS; e++) { const i = G.sI[e], o = i * 3; if (!skip(i) && glassy(a[o], a[o + 1], a[o + 2]) && !glassy(ca0[o], ca0[o + 1], ca0[o + 2]) && !glassy(C0[o], C0[o + 1], C0[o + 2])) nNew++; }
      for (const [t, ar] of tris) { const o = t * 9; let nw = 0, ns = 0;
        for (let p = 0; p <= 8; p++) for (let q = 0; p + q <= 8; q++) { const w0 = 1 - (p + q) / 8, w1 = p / 8, w2 = q / 8, mx = (X, k) => w0 * X[o + k] + w1 * X[o + 3 + k] + w2 * X[o + 6 + k]; ns++;
          if (glassy(mx(a, 0), mx(a, 1), mx(a, 2)) && !glassy(mx(ca0, 0), mx(ca0, 1), mx(ca0, 2)) && !glassy(mx(C0, 0), mx(C0, 1), mx(C0, 2))) nw++; }
        newA += ar * nw / ns; }
      return { nNew, newA: +newA.toFixed(5) }; };
    const out = { before: diff(ca0, 1), roofA: +roofA.toFixed(3), steps: [] };
    Q.pitState = 'repair'; Q.pitDur = 4;
    const U = [0, 0.3, 0.65, 0.95]; for (let q = 0; q < 16; q++) U.push((q + 0.5) / 16); U.sort((a, b) => a - b);
    for (const u of U) { Q.pitT = u * Q.pitDur; frames(1); const v = Render.viewOf(Q), ca = v.body.geometry.attributes.color.array; out.steps.push(Object.assign({ u, same: v === v0, shell: diff(ca, 1), all: diff(ca, 0) }, glassNew(ca))); }
    out.held = v0.rep && v0.rep.sh ? v0.rep.sh.held : 0;
    R.repairCar(Q); Q.pitState = 'done'; frames(1); Q.pitState = null; Q.pitT = 0; Q.pitDur = 0; frames(1);
    const v1 = Render.viewOf(Q), c1 = v1.body.geometry.attributes.color.array; let after = c1.length === C0.length ? 0 : 1; if (!after) for (let j = 0; j < c1.length; j++) after = Math.max(after, Math.abs(c1[j] - C0[j]));
    return Object.assign(out, { fresh: v1 !== v0, after }); }`;
  const pitOk = (PT) => { const at = (u) => PT.steps.find(q => q.u === u); return PT.before > 0.01 && at(0).shell === PT.before && at(0.3).shell < PT.before && at(0.95).shell === 0 && at(0.95).all === 0 && PT.steps.every(q => q.same) && PT.fresh && PT.after === 0; };
  const pitGlassOk = (PT) => PT.steps.length === 20 && PT.roofA > 0.5 && PT.steps.every(q => q.nNew === 0 && q.newA <= 0.001 * PT.roofA);
  const pitGlass = (PT) => JSON.stringify({ roofA: PT.roofA, held: PT.held, steps: PT.steps.map(q => [q.u, q.nNew, q.newA]) });
  // (black paint, a car's dark trim too, on its warm way as the black car's: on it, as dark as it should be or stopped at the glass's
  // edge or held back with its facet, never lighter, no nearer the glass colours than 0.066 or than it was)
  const bkOk = (DK) => DK.bk === 0 || (DK.offWay < 1e-4 && DK.bkErr < 1e-4 && DK.bkStopBad === 0 && DK.bkUp === 0 && (DK.bkFar === null || DK.bkFar >= 0.066 - 1e-4) && (DK.bkNear === null || DK.bkNear >= -1e-4));
  for (const [id, det, rival] of [['kolibri', 'normal'], ['kolibri', 'high'], ['kolibri', 'normal', 1], ['medved', 'normal'], ['kozorog', 'normal'], ['lev', 'normal'], ['goljat', 'normal'], ['rally', 'normal'], ['truck', 'normal']]) {
    const rr = await run({ xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carDet: det, carId: rival ? 'tornado' : id }, (A) => {
      const SEQ = A[0], g = window.__game, R = g.race, P = R.player;
      for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
      let Q = P;
      if (A[2]) {   // (a rival: the model put on the first of them, 8 m ahead of the player, the cars built again (as Nastavitve does))
        Q = R.cars.find(c => c !== P); Q.place(P.x + Math.cos(P.h) * 8, P.z + Math.sin(P.h) * 8, P.h); Q.y = Q.py = P.y; Q.roadY = P.roadY;
        Q.m = Core.MODELS.find(m => m.id === A[1]); R.repairCar(Q);
        const set = (k, v) => document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`).click(); set('xBody', 0); set('xBody', 1); Render.frame(0.016, 1, P, 'chase', {}); }
      const me = () => Render.crashInfo().cars.find(q => q.id === Q.id), frames = (k) => { for (let j = 0; j < k; j++) { Q.vx = Q.vz = 0; Render.frame(j ? 0.05 : 0.016, 1, P, 'chase', {}); } };
      const seq = (rep) => { if (!rep) { R.repairCar(Q); frames(1); } const out = [];
        for (const h of SEQ) {
          if (h === 'top') { Q.dents.push({ lx: 0.25 * Q.m.len / 2, lz: -0.4 * Q.m.wid / 2, amt: 0.1, top: 1 }); Q.roofDmg = Math.min(1, Q.roofDmg + 0.3); } else Core.applyDamage(Q, h[0], h[1] * Q.m.len / 2, h[2] * Q.m.wid / 2);
          const eff = Q.dents.length ? Q.dents[Q.dents.length - 1].amt : 0; frames(5);   // (the knock as the core made it: a truck's frame takes less, dmgK)
          const x = me(), a = Render.viewOf(Q).body.geometry.attributes.position.array; let bad = 0; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) bad++;
          out.push({ roof: x.roof, rf: x.rf, nan: bad, xd: x.xd, eff }); }
        return out; };
      const dark = () => { const v = Render.viewOf(Q); return eval(A[5])(v, eval(A[3])(v, v.xc, Render.crashInfo().XC.paint), eval(A[4])(v, v.xc)); };   // (darkFn)
      if (A[2]) { const s1 = seq(0).concat(seq(1)); return { s1, dark: dark() }; }   // (the rival: the knocks twice over, no repair between)
      const o = { s1: seq(0) }; o.dark = dark(); o.pit = eval(A[6])(Q, frames); o.s2 = seq(0);
      R.repairCar(P); frames(1); Core.applyDamage(P, 0.5 / (P.m.dmgK || 1)); frames(2);   // (a truck's frame, dmgK: as hard a landing for it)
      const x = me(); o.land = { roof: x.roof, over: x.rf ? x.rf.over : -1, roofDmg: +P.roofDmg.toFixed(3) };
      R.repairCar(P); frames(1); Core.wreckCar(P); frames(6);   // (a wreck: the start number on its crushed roof gone, as in the old way)
      const v = Render.viewOf(P); o.wreck = { roofDmg: P.roofDmg, dec: v.dec ? v.dec.visible : null, onRoof: !!(v.dec && v.xc && v.xc.rf && v.xc.rf.dec) };
      return o; }, [RSEQ, id, rival, paintFn, asideFn, darkFn, pitFn]);
    const S = rr.r.s1, F = S[0].rf, name = `${id}${det === 'high' ? ' (Visoki)' : ''}${rival ? ' (a rival, its coarse body)' : ''}`, mean = S.map(q => q.roof.mean), inc = mean.map((m, k) => +(m - (k ? mean[k - 1] : 0)).toFixed(3));
    const need = S.map((q, k) => { const h = RSEQ[k % NK]; return h === 'top' || q.eff >= 0.1 ? 0.003 : q.eff >= 0.03 ? 0.0015 : -0.001; }), side = !rival && (id === 'kolibri' || id === 'medved' || id === 'rally' || id === 'truck');
    T.check(`roof field, ${name}: a field with a limit (lref ${F && F.lref})` + (rival ? ', the coarse body' : ''), !!F && F.lref >= 0.02 && (!rival || S[0].xd === 0), JSON.stringify(F) + ' xd ' + S[0].xd);
    const fill = S.map(q => q.rf.rlim ? q.roof.mean / q.rf.rlim : 0);   // (how near the deepest the roof's top can go)
    T.check(`roof field, ${name}: after every knock the roof more caved in (its mean drop up 3 mm or more, 1.5 on the light one (a knock the field takes: 0.03 or more as the core makes it), while under 70 % of its limit; 1.5 mm while under 90 %; its deepest never less)`,
      inc.every((d, k) => { const f = k ? fill[k - 1] : 0; return d >= (f < 0.7 || need[k] < 0 ? need[k] : f < 0.9 ? 0.0015 : -0.001) - 1e-9; }) && S.every((q, k) => !k || q.roof.max >= S[k - 1].roof.max - 1e-4), 'mean ' + mean.join(' ') + ' | max ' + S.map(q => q.roof.max).join(' ') + ' | fill ' + fill.map(f => f.toFixed(2)).join(' '));
    T.check(`roof field, ${name}: the budget lasts (after 6 knocks under 88 % of its limit)`, fill[5] < 0.88, fill.map(f => f.toFixed(2)).join(' '));
    T.check(`roof field, ${name}: never past a limit, no facet over, the roof clear of what is in the way (5 mm, or as near as it was built), the headliner too, the posts' tops under it, nothing in the way lifted, no NaN`,
      S.every(q => q.rf && q.rf.over === 0 && q.rf.flip === 0 && (q.rf.clear === null || q.rf.clear >= Math.min(0.005, q.rf.clear0) - 1e-4) && (q.rf.clearL === null || q.rf.clearL >= 0) && (q.rf.clearF === null || q.rf.clearF >= -1e-4) && q.rf.obsUp <= 1e-5 && q.nan === 0),
      JSON.stringify(S.map(q => q.rf && [q.rf.over, q.rf.flip, q.rf.clear, q.rf.clear0, q.rf.clearL, q.rf.clearF, q.rf.obsUp, q.nan])));
    if (id === 'goljat') T.check(`roof field, ${name}: its outer cage (a few cm under the roof) in the way, never through the roof`, F.nO >= 100, JSON.stringify({ nO: F.nO, clear: S.map(q => q.rf.clear) }));
    if (side) T.check(`roof field, ${name}: a side knock lowers that side's rail and pulls it in (1 cm, 4 mm)`,
      [[2, 0], [5, 1]].every(([k, sd]) => S[k].rf.rail[sd] - S[k - 1].rf.rail[sd] >= 0.01 && S[k].rf.pull[sd] - S[k - 1].rf.pull[sd] >= 0.004), JSON.stringify(S.map(q => [q.rf.rail, q.rf.pull])));
    const DK = rr.r.dark;
    T.check(`roof field, ${name}: its paint darker where it sank (each shell point by its drop over the deepest any can go, ${DK.dMax} m: 60 % there), on the colour the paint gives it (its folds, its scrapes; the hue kept), never lighter, never into or through a glass colour as the body's shader sees one (a facet it takes for glass in part already as the paint gives it; no more than 0.1 % of the roof newly glass to it, its colours interpolated); black paint (dark trim, ${DK.bk} points) on its warm way as the black car's; a point not sunk and the rest of the body as the paint gives them, the lining and the posts as built; no NaN`,
      DK.idx && DK.dMaxOk && DK.n > 200 && DK.err < 1e-4 && DK.hue < 2e-5 && DK.lighter === 0 && DK.inGlass === 0 && DK.edge === DK.guard && DK.errA < 1e-4 && DK.roofA > 0.5 && DK.glassA <= 0.001 * DK.roofA && bkOk(DK) && DK.err0 < 1e-4 && DK.nR > 300 && DK.errR < 2e-5 && DK.errL === 0 && DK.nan === 0, JSON.stringify(DK));
    T.check(`roof field, ${name}: its deepest point 1 - 0.6 x its share of the deepest the roof can go of the paint's colour (about 0.4 once there; the Kolibri's, the Medved's after these knocks)`,
      Math.abs(DK.kmax - (1 - 0.6 * DK.qmax)) < 1e-3 && DK.kmax >= 0.4 - 1e-4 && (DK.qmax < 0.95 || DK.kmax <= 0.43) && ((id !== 'kolibri' && id !== 'medved') || DK.qmax >= 0.95), JSON.stringify({ qmax: DK.qmax, kmax: DK.kmax }));
    if (!rival) {
      const PT = rr.r.pit;
      T.check(`roof field, ${name}: a pit stop's repair brings the roof's colour back (with the bodywork, every point the car's as built by its end; built afresh in them after)`, pitOk(PT), JSON.stringify(Object.assign({}, PT, { steps: PT.steps.filter(q => [0, 0.3, 0.65, 0.95].includes(q.u)) })));
      T.check(`roof field, ${name}: through the repair's 16 steps no roof point newly glass to the body's shader (neither in the dent nor as built), no more than 0.1 % of the roof's facets (their colours interpolated)`, pitGlassOk(PT), pitGlass(PT));
      T.check(`roof field, ${name}: after the ${NK} knocks well in (a quarter of its limit or more on average), never past the deepest limit`,
        mean[NK - 1] >= 0.25 * F.lref && S[NK - 1].roof.max <= F.lmax + 0.005, JSON.stringify({ mean: mean[NK - 1], max: S[NK - 1].roof.max, lref: F.lref, lmax: F.lmax }));
      T.check(`roof field, ${name}: the same field every time (the knocks again on the repaired car)`, rr.r.s2.every((q, k) => q.rf && q.rf.hash === S[k].rf.hash), S.map(q => q.rf.hash).join(' ') + ' / ' + rr.r.s2.map(q => q.rf && q.rf.hash).join(' '));
      T.check(`roof field, ${name}: a hard landing caves it in too`, rr.r.land.roof.mean >= 0.005 && rr.r.land.over === 0, JSON.stringify(rr.r.land));
      if (id === 'kolibri') T.check(`roof field, ${name}: a wreck's start number on its crushed roof gone (as in the old way)`, rr.r.wreck.roofDmg >= 0.5 && rr.r.wreck.dec === false, JSON.stringify(rr.r.wreck));
    }
    T.check(`roof field, ${name}: no page errors`, !rr.errors.length, rr.errors.slice(0, 3).join(' | '));
  }
  // a black car (the player's colour 0x1a1a1f, a rival's too): its roof darker where it sank too, but never into the glass colours nor
  // through them (a colour within 0.05 of one the body's shader draws as glass, its sky and its glint over it: a dark cave-in turned to a
  // light, bluish patch), a facet glass to the shader in part already (a deep fold) as the paint gives it; at HEAD 1203d3f a fold's
  // colour 0.05..0.066 off KIT_GL2 was darkened into it unguarded (inGlass, glassA). Its black paint (the user's "warmer black": on main
  // d9f6919 the guard stopped it at the glass colours' edge, the dent's deep half only ~10 % darker) a warm way round them: on its way,
  // 55 % q darker in luminance or stopped at 0.066 off them (or no nearer than it was), never lighter, in the deep half 40 % darker or
  // more on average and warm (red >= blue); the rest as any colour (-60 % q, at the edge where the guard stops it). A pit stop's repair
  // walks it back along its way (no point nor facet newly glass at any of its steps: straight back it crossed KIT_GL2 midway). Then a
  // reddish black (0x2b1f1c: its way lighter at first) the same way, never lighter, and its repair (the way's lighter stretch: its paint)
  const bk = await run({ xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carId: 'kolibri', color: 4 }, (A) => {
    const g = window.__game, R = g.race, P = R.player, frames = (k) => { for (let j = 0; j < k; j++) { P.vx = P.vz = 0; Render.frame(j ? 0.05 : 0.016, 1, P, 'chase', {}); } };
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
    const knock = () => { R.repairCar(P); frames(1);
      for (const h of A[0]) { if (h === 'top') { P.dents.push({ lx: 0.25 * P.m.len / 2, lz: -0.4 * P.m.wid / 2, amt: 0.1, top: 1 }); P.roofDmg = Math.min(1, P.roofDmg + 0.3); } else Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); frames(5); }
      const v = Render.viewOf(P), dark = eval(A[3])(v, eval(A[1])(v, v.xc, Render.crashInfo().XC.paint), eval(A[2])(v, v.xc)); return { color: P.color, dark, pit: eval(A[4])(P, frames) }; };
    const o = knock(); P.color = 0x2b1f1c; o.red = knock(); return o; }, [RSEQ, paintFn, asideFn, darkFn, pitFn]);
  const BK = bk.r.dark, BR = bk.r.red.dark;
  T.check('roof field, a black car (the Kolibri, 0x1a1a1f): its black paint a warm way round the glass colours (on its way, 55 % q darker in luminance or stopped where it would come nearer them than 0.066, or than it was, a few with their facet where its colours across it would; never lighter), never into or through them as the shader sees them, a facet glass to the shader in part already as the paint gives it, no more than 0.1 % of the roof newly glass (its colours interpolated); any other colour as before; no NaN, no page errors',
    bk.r.color === 0x1a1a1f && BK.bk > 100 && BK.offWay < 1e-4 && BK.bkErr < 1e-4 && BK.bkStopBad === 0 && BK.bkPull <= 0.02 * BK.bk && BK.bkUp === 0 && BK.bkFar >= 0.066 - 1e-4 && (BK.bkNear === null || BK.bkNear >= -1e-4) && BK.edge === BK.guard && BK.asPaint > 0 && BK.errA < 1e-4 && BK.inGlass === 0 && BK.roofA > 0.5 && BK.glassA <= 0.001 * BK.roofA && BK.lighter === 0 && BK.err < 1e-4 && BK.hue < 2e-5 && BK.nan === 0 && !bk.errors.length, JSON.stringify(BK) + ' ' + bk.errors.slice(0, 2).join(' | '));
  T.check(`roof field, a black car: its dent's deep half (q > 0.5) 40 % darker or more in luminance on average (${(100 * BK.bkDeep).toFixed(1)} %; ~10 % on main), its deepest ${(100 * BK.bkMax).toFixed(1)} %, warm there (red >= blue)`,
    BK.bkDeepN > 50 && BK.bkDeep >= 0.4 && BK.bkMax >= 0.5 && BK.bkCold === 0 && BK.tSunk < 0.7, JSON.stringify({ deep: BK.bkDeep, n: BK.bkDeepN, max: BK.bkMax, cold: BK.bkCold, tSunk: BK.tSunk }));
  T.check('roof field, a black car: a pit stop\'s repair brings its warm black back to the paint (every point the car\'s as built by its end; built afresh in them after)', pitOk(bk.r.pit), JSON.stringify(Object.assign({}, bk.r.pit, { steps: bk.r.pit.steps.filter(q => [0, 0.3, 0.65, 0.95].includes(q.u)) })));
  T.check('roof field, a black car: through the repair\'s 16 steps its warm black walked back along its way, no roof point newly glass to the body\'s shader (neither in the dent nor as built; straight back from the brown-black it crossed KIT_GL2: ~800 points at one step), no more than 0.1 % of the roof\'s facets (their colours interpolated)', pitGlassOk(bk.r.pit), pitGlass(bk.r.pit));
  T.check('roof field, a reddish black car (0x2b1f1c, its way lighter at first): its black paint on the same warm way, never lighter, no nearer the glass colours than 0.066 or than it was, never into them; its repair as the black one\'s (no point newly glass at any step, every point as built by its end)',
    bk.r.red.color === 0x2b1f1c && BR.bk > 100 && BR.bkRise >= 0.9 * BR.bk && bkOk(BR) && BR.bkPull <= 0.02 * BR.bk && BR.inGlass === 0 && BR.glassA <= 0.001 * BR.roofA && BR.lighter === 0 && BR.nan === 0 && pitOk(bk.r.red.pit) && pitGlassOk(bk.r.red.pit),
    JSON.stringify(BR) + ' ' + pitGlass(bk.r.red.pit));
  // the run from the police in the new way: a patrol car wrecked, its light bar gone with its crushed roof (no blue flashes over a wreck;
  // fleet.test.mjs 4c's, the old way's)
  const po = await run({ xBody: 1, xGlass: 1, xPaint: 1, xParts: 1 }, async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), mode = async (md) => { g.resume(); g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
      document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="' + md + '"]').click(); await wait(200); };
    await mode('police');
    g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic' && g.race.pol); k++) await wait(100);
    g.pause(); const R = g.race, P = R.player;
    for (let i = 0; i < 40 && !R.pol.cars.length; i++) g.sim(0.25, true);
    Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const pc = R.pol.cars[0]; if (!pc) return { cars: 0 };
    const v0 = Render.viewOf(pc), out = { cars: R.pol.cars.length, xOn: !!(v0 && v0.xOn), bar0: v0 && v0.polBar ? v0.polBar.visible : null };
    Core.wreckCar(pc); g.sim(1 / 120, true); for (let k = 0; k < 4; k++) Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const v = Render.viewOf(pc); Object.assign(out, { roofDmg: +pc.roofDmg.toFixed(3), bar: v && v.polBar ? v.polBar.visible : null });
    await mode('race'); return out; });
  T.check('new way: a wrecked patrol car\'s light bar gone with its crushed roof (no blue flashes over a wreck)', po.r.cars > 0 && po.r.xOn && po.r.bar0 === true && po.r.roofDmg >= 0.5 && po.r.bar === false && !po.errors.length, JSON.stringify(po.r) + ' ' + po.errors.slice(0, 2).join(' | '));
  // open cars, a kart: no roof field; a rollover's roof contact moves nothing; blows on the ends never lift the driver, a hoop, a roll bar
  // (xStand: they stand, as a roofed car's seats and driver)
  for (const id of ['lisica', 'blisk', 'mravlja']) {
    const oc = await run({ xBody: 1, carId: id }, (A) => { const g = window.__game, R = g.race, P = R.player; for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
      R.repairCar(P); for (let k = 0; k < 3; k++) Render.frame(0.016, 1, P, 'chase', {});
      const a0 = Render.viewOf(P).body.geometry.attributes.position.array.slice();
      P.dents.push({ lx: 0.25 * P.m.len / 2, lz: -0.4 * P.m.wid / 2, amt: 0.1, top: 1 }); P.roofDmg = Math.min(1, P.roofDmg + 0.3); for (let k = 0; k < 3; k++) Render.frame(0.016, 1, P, 'chase', {});
      const v = Render.viewOf(P), a = v.body.geometry.attributes.position.array; let mx = a.length === a0.length ? 0 : 1; if (!mx) for (let i = 0; i < a.length; i++) mx = Math.max(mx, Math.abs(a[i] - a0[i]));
      const me = Render.crashInfo().cars.find(q => q.player), out = { rf: me.rf, roofed: me.roofed, xc: !!v.xc, mx };
      for (const h of [[0.15, -1, 0], [0.15, 1, -0.6], [0.15, -1, 0.6], [0.3, 1, 0], [0.3, -1, 0]]) { Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); for (let k = 0; k < 3; k++) Render.frame(0.016, 1, P, 'chase', {}); }
      const xc = v.xc, R0 = xc.rest, dv = v.kit ? v.kit.deadV : null; let n = 0, up = 0; if (xc.obs) for (let i = 0; i < xc.obs.length; i++) if (xc.obs[i] && !(dv && dv[i])) { n++; up = Math.max(up, a[i * 3 + 1] - R0[i * 3 + 1]); }
      const ref = eval(A[0])(v, xc, Render.crashInfo().XC.paint), aside = eval(A[1])(v, xc), ca = v.body.geometry.attributes.color.array, pt = { n: 0, err: 0 };   // (its paint: as the paint gives it everywhere, no roof's darkening)
      for (let i = 0; i < xc.on; i++) { if (xc.keep[i] || (v.xtCut && v.xtCut[i]) || aside(i)) continue; const P3 = ref(i); pt.n++; for (let c = 0; c < 3; c++) pt.err = Math.max(pt.err, Math.abs(ca[i * 3 + c] - P3[c])); }
      pt.err = +pt.err.toExponential(2);
      return Object.assign(out, { stand: n, up: +up.toFixed(6), cl: Render.crashInfo().cars.find(q => q.player).cl.length, paint: pt }); }, [paintFn, asideFn]);
    T.check(`roof field, ${id} (open): none; a rollover's roof contact moves nothing; the ends knocked in, the driver and the hoops never lifted`, oc.r.rf === null && !oc.r.roofed && oc.r.xc && oc.r.mx === 0 && oc.r.stand > 0 && oc.r.cl > 0 && oc.r.up <= 1e-5 && !oc.errors.length, JSON.stringify(oc.r) + ' ' + oc.errors.slice(0, 2).join(' | '));
    T.check(`roof field, ${id} (open): its paint never darkened as a roof's (every painted point as the paint gives it)`, oc.r.paint.n > 300 && oc.r.paint.err < 2e-5, JSON.stringify(oc.r.paint));
  }

  // 7. the load (as perf.test.mjs counts it, NIZKA, chase camera, six places round the lap): off, Normalni and Visoki drawn in turn at
  // each place, the same frame (switched as in Nastavitve: the cars built again), so only the cars' own geometry differs
  const { page: lp, ctx: lc } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, { camera: 'chase', zoom: 1.2 }), { width: 844, height: 390 }, { seed: 12345 });
  await lp.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
  await startTrack(lp, 'jezero');
  const load = await lp.evaluate(() => { const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.onAction('restart'); g.pause(); const P = g.race.player, out = { off: 0, lite: 0, full: 0 };
    const set = (k, v) => document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`).click();
    const meas = () => { Render.frame(1 / 60, 1, P, 'chase', {}); const v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); return __gl.verts - v0; };
    for (let k = 0; k < 6; k++) { for (let i = 0; i < 10; i++) g.sim(1, true);
      set('xBody', 0); set('xGlass', 0); out.off += meas(); set('xBody', 1); set('xGlass', 1); set('carDet', 'normal'); out.lite += meas(); set('carDet', 'high'); out.full += meas(); }
    set('xBody', 0); set('xGlass', 0); set('carDet', 'normal');
    for (const k in out) out[k] = Math.round(out[k] / 6); return out; });
  await lc.close();
  T.check('the load: Normalni within 6 % more vertices than off', load.lite <= load.off * 1.06, JSON.stringify(load));
  T.check('the load: Visoki within 30 % more vertices than off', load.full <= load.off * 1.3, JSON.stringify(load));
} finally {
  await browser.close(); await srv.close();
}
T.done();
