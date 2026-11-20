// Poškodbe · P4.1, the latch of a knock's source (docs/trki-realizem.md, »Popravki po preverjanju z več agenti«; js/render.js: v.xsW, v.xsC,
// v.xsK, xSrcCol, dLog): while a car's dents wait (a rival drawn as one mesh waits its turn to be taken apart, one a frame: xWait), what the
// knock was against (a wall or a car, that car's paint) and its speed stay; the stronger contact holds, whichever came first; the dent log
// takes it (xcol, xsp). Spa, the older bodies (their rivals are one mesh while whole; a kit car's are not and never wait), Podrobne.
// 1. a rival waits 3 frames behind 3 others; two rivals of different paint knock it meanwhile, in different frames:
//    weaker then stronger, stronger then weaker; a wall then a car, a car then a wall: the stronger one's paint (or the wall's grey) and speed
// 2. the player (never waits: its dents are taken the frame they are made): two rivals in one frame, the stronger first or last, either
//    rival the stronger: the stronger one's speed and paint (the core's fxKOf(c), Core.fxSrc: the car of the strongest knock since the last frame);
//    a touch without a dent a frame before a knock leaves nothing in the latch (the knock's own source and speed)
// 3. nothing NaN (the bodies' points and marks, the log), no page errors
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';
const T = checker('Poškodbe P4.1: the latch of a knock\'s source while its dents wait, two rivals');
const srv = await serve(); const browser = await launch();
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.1, damage: 1, weather: 'dry', carId: 'rally', carV: 3, dmgDet: 1 };
  const { page, errors } = await openGame(browser, srv.base + '/index.html', base, { width: 844, height: 390 }, { seed: 12345 });
  await startTrack(page, 'spa');
  const r = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const R = g.race, P = R.player, o = {};
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
    const fx = Math.cos(P.h), fz = Math.sin(P.h), sx = -fz, sz = fx, rv = R.cars.filter(c => c !== P).slice(0, 20);
    const L = R.cars.reduce((a, c) => (c.x - P.x) * fx + (c.z - P.z) * fz < (a.x - P.x) * fx + (a.z - P.z) * fz ? c : a, P);
    if (L !== P) { const t = { x: P.x, z: P.z, y: P.y, ry: P.roadY }; P.place(L.x, L.z, P.h); P.y = P.py = L.y; P.roadY = L.roadY; L.place(t.x, t.z, P.h); L.y = L.py = t.y; L.roadY = t.ry; }
    rv.forEach((c, i) => { const f = 12 + 8 * (i >> 2), l = ((i & 3) - 1.5) * 3.6; c.place(P.x + fx * f + sx * l, P.z + fz * f + sz * l, P.h); c.y = c.py = P.y; c.roadY = P.roadY; });
    for (let i = 0; i < 10; i++) { g.sim(0.5, true); for (const c of R.cars) { c.vx = 0; c.vz = 0; } }   // (settled on the road; before the lights: the field stands, nobody touched)
    const fr = (n) => { for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, P, 'chase', {}); }; fr(5);
    const V = (c) => Render.viewOf(c), hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
    o.n = rv.length; o.mrg = rv.filter(c => V(c).mrg && V(c).xOn).length; o.whole = rv.every(c => !(c.dmg > 0) && !(c.dents && c.dents.length)); o.knocked = rv.map((c, i) => c.dmg > 0 || !V(c).mrg ? i : -1).filter(i => i >= 0);
    // the two rivals whose paint the knocks carry: whole throughout (no dents of their own), their colours apart from each other's and the wall's grey
    const far = (a, b) => { const A = hex(a), B = hex(b); return Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2]) > 90; }, GREY = 0x9c9c98;
    const src = rv.slice(12, 16).filter(c => far(c.color, GREY)), O1 = src[0], O2 = src.find(c => c !== O1 && far(c.color, O1.color));
    o.cols = { O1: O1 && O1.color, O2: O2 && O2.color, grey: GREY }; if (!O1 || !O2) return o;
    // a contact as the core leaves it (carCollide, wallCollide: fxCar, fxWall the strongest since the last frame, fxK the paint of the car of
    // the strongest: Core.fxSrc, the core's own, called as carCollide calls it; the contact point the last one, both cars'), and its dent
    let np = 0;
    const car = (c, O, sp, amt, u, w) => { Core.fxSrc(c, O, sp); Core.fxSrc(O, c, sp); c.fxCar = Math.max(c.fxCar || 0, sp); O.fxCar = Math.max(O.fxCar || 0, sp); c.contactX = O.contactX = c.x + 0.31 + 0.01 * ++np; c.contactZ = O.contactZ = c.z + 0.17 + 0.01 * np; if (amt) Core.applyDamage(c, amt, u * c.m.len / 2, w * c.m.wid / 2); };
    const wall = (c, sp, amt, u, w) => { c.fxWall = Math.max(c.fxWall || 0, sp); c.contactX = c.x - 0.53 - 0.01 * ++np; c.contactZ = c.z - 0.29; if (amt) Core.applyDamage(c, amt, u * c.m.len / 2, w * c.m.wid / 2); };
    // what a car's view shows of its knocks since n0: the log's sources and speeds, the marks on its body (every marked point's colour), NaN
    const seen = (c, n0) => { const v = V(c), xc = v.xc, Lg = (v.dLog || []).slice(n0), a = v.body.geometry.attributes.position.array; let nan = 0, n = 0; const mk = {};
      for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) nan++;
      if (xc && xc.tw) for (let i = 0; i < xc.tw.length; i++) { if (!Number.isFinite(xc.tw[i]) || !Number.isFinite(xc.tc[i * 3]) || !Number.isFinite(xc.tc[i * 3 + 1]) || !Number.isFinite(xc.tc[i * 3 + 2])) nan++;
        if (xc.tw[i] > 0) { n++; const q = new THREE.Color(xc.tc[i * 3], xc.tc[i * 3 + 1], xc.tc[i * 3 + 2]).getHex(); mk[q] = (mk[q] || 0) + 1; } }
      for (const d of Lg) for (const k of ['lx', 'lz', 'amt', 'xsp']) if (!Number.isFinite(d[k])) nan++;
      return { log: Lg.map(d => [d.xcol == null ? null : d.xcol, +(+d.xsp).toFixed(2)]), marks: n, mk: Object.keys(mk).map(Number), nan, left: c.dents ? c.dents.length : 0, mrg: !!v.mrg }; };
    // 1. a rival's dents wait: three whole rivals before it in the frame's order are knocked with it, one is taken apart a frame; `steps` knock
    // it meanwhile, one a frame (the first with the decoys' knocks)
    const waits = (vi, d0, steps) => { const c = rv[vi], w = []; for (let k = 0; k < 3; k++) Core.applyDamage(rv[d0 + k], 0.1, 0.1 * rv[d0 + k].m.len / 2, rv[d0 + k].m.wid / 2);
      for (const s of steps) { s(c); fr(1); w.push(!!V(c).mrg && c.dents.length); }
      const dn = c.dents.length; for (let k = 0; k < 6 && c.dents.length; k++) fr(1); fr(2);
      return Object.assign(seen(c, 0), { w, dn }); };
    o.weakStrong = waits(19, 0, [(c) => car(c, O1, 5, 0.1, 0.1, 1), (c) => car(c, O2, 9, 0.12, -0.2, 1)]);
    o.strongWeak = waits(18, 3, [(c) => car(c, O1, 9, 0.12, 0.1, 1), (c) => car(c, O2, 5, 0.1, -0.2, 1)]);
    o.wallCar = waits(17, 6, [(c) => wall(c, 9, 0.12, 0.1, -1), (c) => car(c, O1, 5, 0.1, -0.2, -1)]);
    o.carWall = waits(16, 9, [(c) => car(c, O2, 9, 0.12, 0.1, 1), (c) => wall(c, 5, 0.1, -0.2, 1)]);
    o.srcWhole = [O1, O2].every(c => !(c.dmg > 0) && !!V(c).mrg && !(V(c).dLog && V(c).dLog.length));
    // 2. the player: both knocks before one frame (two steps of the core, two rivals)
    let n0 = (V(P).dLog || []).length; o.pre = n0;
    car(P, O1, 5, 0.08, 0.1, 1); car(P, O2, 9, 0.1, -0.2, 1); fr(1); o.pWeakStrong = seen(P, n0); n0 = V(P).dLog.length;
    car(P, O2, 9, 0.1, 0.1, -1); car(P, O1, 5, 0.08, -0.2, -1); fr(1); o.pStrongWeak = seen(P, n0); n0 = V(P).dLog.length;
    // the same with the other rival the stronger (not the order, not which rival: the strength), and two of the same strength: the first
    car(P, O2, 5, 0.08, 0.3, 1); car(P, O1, 9, 0.1, -0.4, 1); fr(1); o.pWeakStrong1 = seen(P, n0); n0 = V(P).dLog.length;
    car(P, O1, 9, 0.1, 0.3, -1); car(P, O2, 5, 0.08, -0.4, -1); fr(1); o.pStrongWeak1 = seen(P, n0); n0 = V(P).dLog.length;
    car(P, O1, 7, 0.08, 0.5, 1); car(P, O2, 7, 0.08, -0.5, 1); fr(1); o.pSame = seen(P, n0); n0 = V(P).dLog.length;
    o.fxK = [P, O1, O2].map(c => Core.fxKOf(c) == null);   // (taken with the sparks: nothing of it left for the next frame)
    // a hard touch without a dent (a scrape along a rival), then, a frame later, a light knock against a wall: the wall's, at its own speed
    car(P, O1, 15, 0, 0, 0); fr(1); wall(P, 3, 0.06, -0.6, -1); fr(1); o.pStale = seen(P, n0); n0 = V(P).dLog.length;
    car(P, O1, 15, 0, 0, 0); fr(1); fr(1); car(P, O2, 4, 0.06, -0.6, 1); fr(1); o.pStale2 = seen(P, n0);
    fr(3); o.latch = [P, rv[19], rv[18], rv[17], rv[16]].map(c => [V(c).xsW || 0, V(c).xsC || 0]);
    return o; });
  const J = (q) => JSON.stringify(q), C = r.cols, hx = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const eq = (a, b) => a != null && b != null && hx(a).every((q, k) => Math.abs(q - hx(b)[k]) <= 2);
  // every dent of the knocks in the log with this source and speed; every marked point of the body that colour
  const all = (S, col, sp, n) => !!S && S.log.length >= n && S.log.every(d => eq(d[0], col) && Math.abs(d[1] - sp) < 0.01) && S.marks > 0 && S.mk.every(q => eq(q, col)) && S.left === 0;
  T.check('the field: 20 rivals of the older bodies, one mesh each while whole (they wait), two of different paint, neither grey',
    r.n === 20 && r.mrg === 20 && r.whole && eq(C.O1, C.O1) && C.O2 != null && !eq(C.O1, C.O2) && !eq(C.O1, C.grey) && !eq(C.O2, C.grey), J({ n: r.n, mrg: r.mrg, whole: r.whole, knocked: r.knocked, C }));
  if (C.O1 != null && C.O2 != null) {
    for (const k of ['weakStrong', 'strongWeak', 'wallCar', 'carWall']) T.check(`1. ${k}: the rival's dents waited through both knocks (2 frames as one mesh, both dents then taken)`,
      r[k].w.length === 2 && r[k].w[0] >= 1 && r[k].w[1] >= 2 && r[k].dn >= 2 && !r[k].mrg && r[k].left === 0, J({ w: r[k].w, dn: r[k].dn, mrg: r[k].mrg, left: r[k].left }));
    T.check('1. weaker (5 m/s), then stronger (9 m/s) rival: the stronger one\'s paint and speed on both dents (the log\'s xcol, xsp; the marks)', all(r.weakStrong, C.O2, 9, 2), J(r.weakStrong));
    T.check('1. stronger (9 m/s), then weaker (5 m/s) rival: the stronger one\'s paint and speed, not the later one\'s', all(r.strongWeak, C.O1, 9, 2), J(r.strongWeak));
    T.check('1. a wall (9 m/s), then a rival (5 m/s): the wall\'s grey and speed', all(r.wallCar, C.grey, 9, 2), J(r.wallCar));
    T.check('1. a rival (9 m/s), then a wall (5 m/s): the rival\'s paint and speed (the wall\'s contact point does not lose it)', all(r.carWall, C.O2, 9, 2), J(r.carWall));
    T.check('1. the two rivals whose paint it is stay whole (one mesh, no dents of their own)', r.srcWhole, String(r.srcWhole));
    T.check('2. the player, two rivals in one frame, weaker then stronger: the stronger one\'s paint and speed', r.pWeakStrong.log.length >= 2 && r.pWeakStrong.log.every(d => eq(d[0], C.O2) && d[1] === 9), J(r.pWeakStrong.log));
    // (the core keeps the strongest speed of a frame and the paint of that knock's car, fxKOf(c), js/core.js fxSrc; the contact point is the last
    // knock's)
    const one = (S, col, sp) => !!S && S.log.length >= 2 && S.log.every(d => eq(d[0], col) && d[1] === sp);
    T.check('2. the player, two rivals in one frame, stronger then weaker: the stronger one\'s paint and speed, not the last one\'s', one(r.pStrongWeak, C.O2, 9), J(r.pStrongWeak.log));
    T.check('2. the same with the other rival the stronger, weaker then stronger: the stronger one\'s paint and speed', one(r.pWeakStrong1, C.O1, 9), J(r.pWeakStrong1 && r.pWeakStrong1.log));
    T.check('2. the other rival the stronger, stronger then weaker: the stronger one\'s paint and speed', one(r.pStrongWeak1, C.O1, 9), J(r.pStrongWeak1 && r.pStrongWeak1.log));
    T.check('2. two rivals of the same strength in one frame: the first one\'s paint; the core\'s fxK is taken with the sparks (none left after the frame)', one(r.pSame, C.O1, 7) && r.fxK.every(Boolean), J([r.pSame && r.pSame.log, r.fxK]));
    T.check('2. a hard touch without a dent, a wall a frame later: the wall\'s grey at the wall\'s speed (nothing left in the latch)', r.pStale.log.length >= 1 && r.pStale.log.every(d => eq(d[0], C.grey) && d[1] === 3), J(r.pStale.log));
    T.check('2. a hard touch of one rival without a dent, another rival two frames later: that one\'s paint and speed', r.pStale2.log.length >= 1 && r.pStale2.log.every(d => eq(d[0], C.O2) && d[1] === 4), J(r.pStale2.log));
    T.check('2. the player\'s body carries the marks (where knocks overlap, their colours blended)', r.pStale2.marks > 0 && r.pStale2.mk.some(q => eq(q, C.O2)), String(r.pStale2.marks));
    T.check('the latch is empty once the dents are taken', r.latch.every(q => q[0] === 0 && q[1] === 0), J(r.latch));
    T.check('3. nothing NaN (points, marks, the log)', ['weakStrong', 'strongWeak', 'wallCar', 'carWall', 'pWeakStrong', 'pStrongWeak', 'pWeakStrong1', 'pStrongWeak1', 'pSame', 'pStale', 'pStale2'].every(k => r[k].nan === 0), J(['weakStrong', 'strongWeak', 'wallCar', 'carWall', 'pWeakStrong', 'pStrongWeak', 'pWeakStrong1', 'pStrongWeak1', 'pSame', 'pStale', 'pStale2'].map(k => r[k].nan)));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); srv.close(); }
T.done();
