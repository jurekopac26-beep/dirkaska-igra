// Poškodbe · P1.13 (docs/realizem/paket-p.md): the load and the looks of Podrobne (dmgDet 1, the default for a new profile) on the phone
// (844 × 390, NIZKA as perf.test.mjs counts it), Spa, the player and 20 rivals in a cluster in front of it (the worst a camera behind a car sees)
// 1. no knocks yet: only the player is full (its dense body), the rivals as built; no more than 5 calls over Preproste
// 2. Preproste: a light knock on a lamp (a fresh car's front, 0.08) cracks the lamp it leaves whole (lCr); a harder one (0.1) breaks it
// 3. six blows on 19 rivals: Math.random is not called (the races stay as they were); calls ≤ 360 (Preproste 309, as main), vertices < 900 thousand
// 4. the player's dents survive its view built again (Detajli avtov Visoki and back: Render.crashInfo().cl the same, dLog)
// 5. every car smashed (12 × 0.3): Podrobne ≤ 400 calls, switched to Preproste mid-race ≤ 460 (its cars Preproste's, the 48 pieces on the road kept),
//    back to Podrobne as before; vertices < 900 thousand
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';
const T = checker('Poškodbe: Podrobne on the phone (P1.13)');
const srv = await serve(); const browser = await launch();
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.1, damage: 1, weather: 'dry', carId: 'tornado', carV: 3, dmgDet: 1 };
  const { page, errors } = await openGame(browser, srv.base + '/index.html', base, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
  await startTrack(page, 'spa');
  const r = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const R = g.race, P = R.player;
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
    const fx = Math.cos(P.h), fz = Math.sin(P.h), L = R.cars.reduce((a, c) => (c.x - P.x) * fx + (c.z - P.z) * fz < (a.x - P.x) * fx + (a.z - P.z) * fz ? c : a, P);
    const sw = (A, B) => { const t = { x: A.x, z: A.z, h: A.h, y: A.y, ry: A.roadY }; A.place(B.x, B.z, B.h); A.y = A.py = B.y; A.roadY = B.roadY; B.place(t.x, t.z, t.h); B.y = B.py = t.y; B.roadY = t.ry; };
    const o = {}; o.back = +((L.x - P.x) * fx + (L.z - P.z) * fz).toFixed(1); if (L !== P) sw(P, L);
    const rv = R.cars.filter(c => c !== P).slice(0, 20), sx = -fz, sz = fx;
    rv.forEach((c, i) => { const f = 10 + 6 * (i >> 2), l = ((i & 3) - 1.5) * 3; c.place(P.x + fx * f + sx * l, P.z + fz * f + sz * l, P.h); c.y = c.py = P.y; c.roadY = P.roadY; });
    for (let i = 0; i < 30; i++) { g.sim(1, true); for (const c of R.cars) { c.vx = 0; c.vz = 0; } }
    o.ys = rv.slice(0, 20).map(c => +(c.y - P.y).toFixed(2)).join(',');
    const set = (k, v) => { const b = document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`); if (b) b.click(); };
    const fr = (n) => { for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, P, 'chase', {}); };
    const meas = () => { fr(3); const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); return [__gl.calls - c0, __gl.verts - v0]; };
    const info = () => { const I = Render.crashInfo().cars; return { n: I.length, xOn: I.filter(q => q.xOn).length, xd: I.filter(q => q.xd).length, xdP: I.filter(q => q.xd && q.player).length, mrg: Render.viewOf ? R.cars.filter(c => Render.viewOf(c) && Render.viewOf(c).mrg).length : -1 }; };
    o.cars = R.cars.length;
    set('dmgDet', 0); o.pre0 = meas(); o.i0 = info(); set('dmgDet', 1); o.pre1 = meas(); o.i1 = info();
    { set('dmgDet', 0); fr(3); const q = rv[19]; const lc = []; for (const am of [0.06, 0.08, 0.1]) { Core.applyDamage(q, am, q.m.len / 2, 0); fr(3); const V = Render.viewOf(q); lc.push([am, q.cd.map(x => +x.toFixed(3)), V.lCr && V.lCr.slice(), V.lightBroken.slice()]); } o.lc = lc; set('dmgDet', 1); fr(3); }
    let rc = 0; const MR = Math.random; Math.random = function () { rc++; return MR(); };
    const H = [[0.15, 1, 0], [0.12, -1, 0.5], [0.12, 0.5, 1], [0.12, -0.5, -1], [0.15, 1, -0.6], [0.1, -1, -0.4]];
    const knocked = rv.slice(0, 19);
    for (const c of knocked) for (const h of H) Core.applyDamage(c, h[0], h[1] * c.m.len / 2, h[2] * c.m.wid / 2);
    fr(40); o.rcKnock = rc; Math.random = MR;
    o.post1 = meas(); o.ip1 = info(); o.dmg = +(knocked.reduce((s, c) => s + c.dmg, 0) / knocked.length).toFixed(2);
    set('dmgDet', 0); o.post0 = meas(); set('dmgDet', 1); fr(40); o.post1b = meas();
    // player's dents across a rebuild
    for (const h of H) Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); fr(5);
    const cl = () => JSON.stringify(Render.crashInfo().cars.find(q => q.player).cl);
    const a = cl(); set('carDet', 'high'); fr(5); const b = cl(); set('carDet', 'normal'); fr(5); const c2 = cl();
    o.clN = JSON.parse(a).length; o.clSame = [a === b, a === c2]; 
    // worst: every car smashed
    for (const c of R.cars) for (let k = 0; k < 12; k++) Core.applyDamage(c, 0.3, (k & 1 ? 1 : -1) * c.m.len / 2, (k & 2 ? 1 : -1) * c.m.wid / 2);
    fr(60); o.worst1 = meas(); o.iw1 = info(); set('dmgDet', 0); o.worst0a = meas(); fr(60); o.worst0 = meas(); o.iw0 = info(); set('dmgDet', 1); fr(60); o.worst1b = meas();
    return o; });
  const V = (m) => m[1] < 900000;
  T.check('1. no knocks: only the player full', r.i1.xd === 1 && r.i1.xdP === 1 && r.i1.xOn === r.cars, JSON.stringify(r.i1));
  T.check('1. no knocks: calls ≤ Preproste + 5', r.pre1[0] <= r.pre0[0] + 5 && V(r.pre1), `${r.pre0} → ${r.pre1}`);
  const L = r.lc;
  T.check('2. Preproste: a light knock cracks the lamp it leaves whole', !L[0][2] && L[1][2] && L[1][2][0] > 0 && !L[1][3][0], JSON.stringify(L[1]));
  T.check('2. Preproste: a harder knock breaks it', L[2][3][0] === 1, JSON.stringify(L[2]));
  T.check('3. knocks: Math.random not called', r.rcKnock === 0, String(r.rcKnock));
  T.check('3. six blows on 19 rivals: calls ≤ 360, vertices < 900 thousand', r.post1[0] <= 360 && V(r.post1), `${r.post1} (Preproste ${r.post0}), dmg ${r.dmg}`);
  T.check('3. back to Podrobne after Preproste: the same', Math.abs(r.post1b[0] - r.post1[0]) <= 3, `${r.post1} / ${r.post1b}`);
  T.check('4. the dents survive the view built again', r.clN > 0 && r.clSame[0] && r.clSame[1], `${r.clN} clusters, ${r.clSame}`);
  T.check('5. every car smashed: Podrobne ≤ 400 calls', r.worst1[0] <= 400 && V(r.worst1), String(r.worst1));
  T.check('5. switched to Preproste mid-race ≤ 460 calls', r.worst0[0] <= 460 && V(r.worst0) && r.iw0.xOn === 0, `${r.worst0a} → ${r.worst0}`);
  T.check('5. back to Podrobne: as before', Math.abs(r.worst1b[0] - r.worst1[0]) <= 3 && V(r.worst1b), `${r.worst1} / ${r.worst1b}`);
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
