// Poškodbe · P1.13 (docs/realizem/paket-p.md): the load and the looks of Podrobne (dmgDet 1, the default for a new profile) on the phone
// (844 × 390, NIZKA as perf.test.mjs counts it), Spa, the player and 20 rivals in a cluster in front of it (the worst a camera behind a car sees)
// 1. no knocks yet: only the player is full (its dense body), the rivals as built; no more than 5 calls over Preproste
// 2. Preproste: a light knock on a lamp (a fresh car's front, one no rival touched while they settled, 0.08) cracks the lamp it leaves whole (lCr); a harder one (0.1) breaks it
// 3. six blows on 19 rivals: Math.random is not called (the races stay as they were); calls ≤ 360 (Preproste 309, as main), vertices < 900 thousand
// 4. the player's dents survive its view built again (Detajli avtov Visoki and back: Render.crashInfo().cl the same, dLog)
// 5. every car smashed (12 × 0.3): Podrobne ≤ 400 calls, switched to Preproste mid-race ≤ 460 (its cars Preproste's, the 48 pieces on the road kept),
//    back to Podrobne as before; vertices < 900 thousand
// 6. the older bodies (no kit): smashed, their doors, bonnet and boot stand open (rally; the prototype: doors and engine cover; the formula: none)
// 7. P4.4, the gouge a bare hub cuts into the asphalt (render.js v.hubG; quads of the tyre marks' own mesh 'skids', 0.1 m wide, pale grey
//    0.62 / 0.61 / 0.58): the car whole at 20 m/s lays none; a wheel off at 12 m/s (15 m/s or less) none; at 20 m/s a gouge under the bare
//    hub (within 0.2 m of its line, joined end to end, each piece 0.6 to 4 m), longer the further the car drives; the other three wheels
//    none; in the air none, and the gouge is not joined across the jump; no mesh more in the scene, no draw call but the one of the tyre
//    marks' mesh (hidden: one call fewer), the frame within section 3's 360; the race started again: the marks' mesh empty, the new car
//    whole, its view without v.hubG
// 8. P4.4, a bent wheel's sagged corner (P3; the Tornado, its body held 1 cm over the road): no sparks under it at any speed (as on main:
//    the stream of 20. 11. taken out, trki-iskre-vogal = 2), no spark alive, no mesh more, the same draw calls as with the wheel straight
// 9. P4, the grit of a concrete wall (cv 6): the knock's frame no draw call, vertex or mesh over the same at a steel rail; the pool of 2400 holds
// 10. a pile-up (cv 6, render.js xLtCut): 10 knocked rivals in a row ahead of the camera (more than 6): the 3 nearest keep their own panels,
//     the 7 behind them are drawn light (one mesh again, v.xLt), fewer calls than with the rule off (Render.setDebug({ xLtK })) and no more
//     vertices; a new knock on a light one: taken apart that very frame, the dent in its panels, none left waiting, and light again (that
//     frame, or after a part's hold) with the dent in its one mesh (a page of its own: the rally car's race, rivals with panels of their own)
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
    // (section 2's car must be fresh: placed at the player's height on Spa's slope the rivals slide a little during the 30 steps and some touch,
    // which ones from run to run, and a touch's cd on its front corner, 0.03 or more, cracks or breaks the lamp before the knocks: so the last
    // rival with no touch takes index 19, the one left out of section 3's knocks; none such and check 2.0 fails)
    { let fi = -1; for (let i = rv.length - 1; i >= 0 && fi < 0; i--) if (!(rv[i].dmg > 0) && !rv[i].cd.some(x => x > 0)) fi = i;
      o.lampPre = { i: fi, cd19: rv[19].cd.map(x => +x.toFixed(4)) }; if (fi >= 0 && fi !== 19) { const t = rv[19]; rv[19] = rv[fi]; rv[fi] = t; } }
    const set = (k, v) => { const b = document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`); if (b) b.click(); };
    const fr = (n) => { for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, P, 'chase', {}); };
    const meas = () => { fr(3); const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); return [__gl.calls - c0, __gl.verts - v0]; };
    const info = () => { const I = Render.crashInfo().cars; return { n: I.length, xOn: I.filter(q => q.xOn).length, xd: I.filter(q => q.xd).length, xdP: I.filter(q => q.xd && q.player).length, mrg: Render.viewOf ? R.cars.filter(c => Render.viewOf(c) && Render.viewOf(c).mrg).length : -1 }; };
    o.cars = R.cars.length;
    set('dmgDet', 0); o.pre0 = meas(); o.i0 = info(); set('dmgDet', 1); o.pre1 = meas(); o.i1 = info();
    { set('dmgDet', 0); fr(3); const q = rv[19]; const lc = []; for (const am of [0.06, 0.08, 0.1]) { Core.applyDamage(q, am, q.m.len / 2, 0); fr(3); const V = Render.viewOf(q); lc.push([am, q.cd.map(x => +x.toFixed(3)), V.lCr && V.lCr.slice(), V.lightBroken.slice()]); } o.lc = lc; set('dmgDet', 1); fr(3); }
    let rc = 0; const MR = Math.random, rcS = {}; Math.random = function () { rc++; if (rc <= 400) { const k = (new Error().stack || '').split('\n').slice(2, 4).map(l => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '')).join(' < '); rcS[k] = (rcS[k] || 0) + 1; } return MR(); };
    const H = [[0.15, 1, 0], [0.12, -1, 0.5], [0.12, 0.5, 1], [0.12, -0.5, -1], [0.15, 1, -0.6], [0.1, -1, -0.4]];
    const knocked = rv.slice(0, 19);
    for (const c of knocked) for (const h of H) Core.applyDamage(c, h[0], h[1] * c.m.len / 2, h[2] * c.m.wid / 2);
    fr(40); o.rcKnock = rc; o.rcS = rcS; Math.random = MR;
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
  T.check('2.0 the lamp car untouched before the knocks (cd 0, dmg 0)', r.lampPre.i >= 0, JSON.stringify(r.lampPre));
  T.check('2. Preproste: a light knock cracks the lamp it leaves whole', !L[0][2] && L[1][2] && L[1][2][0] > 0 && !L[1][3][0], JSON.stringify(L[1]));
  T.check('2. Preproste: a harder knock breaks it', L[2][3][0] === 1, JSON.stringify(L[2]));
  T.check('3. knocks: Math.random not called', r.rcKnock === 0, r.rcKnock ? r.rcKnock + ' ' + JSON.stringify(r.rcS) : '0');
  T.check('3. six blows on 19 rivals: calls ≤ 360, vertices < 900 thousand', r.post1[0] <= 360 && V(r.post1), `${r.post1} (Preproste ${r.post0}), dmg ${r.dmg}`);
  T.check('3. back to Podrobne after Preproste: the same', Math.abs(r.post1b[0] - r.post1[0]) <= 3, `${r.post1} / ${r.post1b}`);
  T.check('4. the dents survive the view built again', r.clN > 0 && r.clSame[0] && r.clSame[1], `${r.clN} clusters, ${r.clSame}`);
  T.check('5. every car smashed: Podrobne ≤ 400 calls', r.worst1[0] <= 400 && V(r.worst1), String(r.worst1));
  T.check('5. switched to Preproste mid-race ≤ 460 calls', r.worst0[0] <= 460 && V(r.worst0) && r.iw0.xOn === 0, `${r.worst0a} → ${r.worst0}`);
  T.check('5. back to Podrobne: as before', Math.abs(r.worst1b[0] - r.worst1[0]) <= 3 && V(r.worst1b), `${r.worst1} / ${r.worst1b}`);
  // 6. the older bodies (no kit): doors, bonnet and boot stand open once smashed (the prototype: doors and engine cover; the formula: none)
  const rcs = [];   // (Math.random calls of the 20 frames: the smoke's, the same with doors to open and without)
  for (const [id, want] of [['rally', 'doorL,doorR,hood,trunk'], ['lm', 'doorL,doorR,trunk'], ['formula', '']]) {
    const o = await openGame(browser, srv.base + '/index.html', { ...base, carId: id }, { width: 844, height: 390 }, { seed: 12345 });
    await startTrack(o.page, 'spa');
    const q = await o.page.evaluate(() => { const g = window.__game, R = g.race, P = R.player, C = R.cars.find(c => !c.isPlayer && !Render.viewOf(c).kit); g.pause();
      const fr = (n) => { for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, P, 'chase', {}); }, keys = (c) => Object.keys(Render.viewOf(c).oAjar || {}).sort().join(',');
      fr(5); const k0 = keys(P), MR = Math.random; let rc = 0; Math.random = () => { rc++; return MR(); };
      for (const c of [P, C]) if (c) { c.dmg = 0.75; c.dz[0] = 0.49; c.dz[1] = 0.49; c.dz[2] = 0.5; c.dz[3] = 0.5; }
      fr(20); Math.random = MR; const V = Render.viewOf(P), dr = V.oAjar && V.oAjar.doorL;
      return { id: P.m.id, k0, k: keys(P), rc, turned: !!dr && Math.abs(dr[0].rotation.y) > 0.4, rival: C ? keys(C) : null }; });
    T.check(`6. ${id}: whole, nothing open; smashed: ${want || 'nothing'} open`, q.id === id && q.k0 === '' && q.k === want && (!want || q.turned) && (q.rival == null || q.rival !== '' || !want), JSON.stringify(q));
    T.check(`6. ${id}: no page errors`, !o.errors.length, o.errors.slice(0, 2).join(' | ')); rcs.push(q.rc); await o.page.close();
  }
  T.check('6. opening them does not call Math.random (as many calls as the formula, which has nothing to open)', rcs[0] === rcs[2] && rcs[1] === rcs[2], String(rcs));
  // 7. P4.4: the gouge behind a bare hub (the same page: its draw calls counted). The car is carried along the start straight by hand
  // (the game paused, the core not stepped: the wheel rule's KONEC IGRE not in the way), the renderer drawing each place
  const hg = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const R = g.race, P = R.player, o = {};
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; c.rpm = 0; }
    for (let i = 0; i < 4; i++) { g.sim(0.5, true); for (const c of R.cars) { c.vx = 0; c.vz = 0; } }   // (settled on the road: its height)
    const fx = Math.cos(P.h), fz = Math.sin(P.h);
    for (const c of R.cars) if (c !== P) { const y = c.y, ry = c.roadY; c.place(c.x - fx * 300, c.z - fz * 300, c.h); c.y = c.py = y; c.roadY = ry; }   // (the rivals far behind: the road ahead the player's alone)
    const sk = Render.scene.getObjectByName('skids'), G = sk.geometry, y0 = P.y, ry0 = P.roadY, near = (a, b) => Math.abs(a - b) < 0.004;
    // the gouge's quads among the marks: its colour and its width (no tyre mark has either)
    const gouge = () => { const p = G.attributes.position.array, c = G.attributes.color.array, n = G.drawRange.count / 6, q = [];
      for (let i = 0; i < n; i++) { if (!(near(c[i * 16], 0.62) && near(c[i * 16 + 1], 0.61) && near(c[i * 16 + 2], 0.58))) continue; const b = i * 12;
        q.push({ a: [(p[b] + p[b + 3]) / 2, (p[b + 2] + p[b + 5]) / 2], b: [(p[b + 6] + p[b + 9]) / 2, (p[b + 8] + p[b + 11]) / 2], w: Math.hypot(p[b + 3] - p[b], p[b + 5] - p[b + 2]), al: c[i * 16 + 3], y: p[b + 1] }); }
      return q; };
    const len = (q) => q.reduce((s, e) => s + Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]), 0);
    const drive = (v, n, air) => { for (let i = 0; i < n; i++) { P.place(P.x + fx * v / 30, P.z + fz * v / 30, P.h); P.y = P.py = y0; P.roadY = ry0; P.air = air ? 1 : 0; P.vx = fx * v; P.vz = fz * v; P.speed = v; Render.frame(1 / 30, 1, P, 'chase', {}); }
      P.vx = 0; P.vz = 0; P.speed = 0; P.air = 0; };
    const meas = () => { for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P, 'chase', {}); const c0 = __gl.calls; Render.frame(1 / 60, 1, P, 'chase', {}); return __gl.calls - c0; };
    const meshes = () => { let n = 0; Render.scene.traverse(q => { if (q.isMesh || q.isPoints || q.isLine) n++; }); return n; };
    const v = Render.viewOf(P); o.kit = !!v.kit; o.surf = P.q ? P.q.surf : null;
    // whole: 30 m at 20 m/s, no gouge
    drive(20, 45); o.whole = { n: gouge().length, off: v.wheelOff.filter(Boolean).length, hubG: !!(v.hubG && v.hubG.some(Boolean)) };
    // the rear left wheel off
    P.dmg = Math.max(P.dmg, 0.7); Core.detachPart(P, 'wheelRL'); Render.frame(1 / 30, 1, P, 'chase', {}); o.off = v.wheelOff.slice(); const k = v.wheelOff.findIndex(Boolean);
    drive(12, 45); o.slow = { n: gouge().length, sparks: Render.fxStats().sparksN };   // (18 m at 12 m/s: sparks off the hub, no gouge yet)
    o.mesh0 = meshes(); o.call0 = meas(); o.marks0 = G.drawRange.count / 6;
    // 30 frames at 20 m/s (20 m): the gouge; the hub's line: the first piece's start, along the car's heading
    const hub0 = [P.x, P.z]; drive(20, 30); const q1 = gouge(); o.l1 = +len(q1).toFixed(2); o.n1 = q1.length;
    const s = q1[0], off = (e) => Math.max(...[e.a, e.b].map(t => Math.abs((t[0] - s.a[0]) * -fz + (t[1] - s.a[1]) * fx)));
    o.geo = { w: [Math.min(...q1.map(e => e.w)), Math.max(...q1.map(e => e.w))].map(x => +x.toFixed(3)), seg: [Math.min(...q1.map(e => len([e]))), Math.max(...q1.map(e => len([e])))].map(x => +x.toFixed(2)),
      line: +Math.max(...q1.map(off)).toFixed(3), joined: q1.every((e, i) => !i || Math.hypot(e.a[0] - q1[i - 1].b[0], e.a[1] - q1[i - 1].b[1]) < 1e-3), al: +s.al.toFixed(2), y: +(s.y - y0).toFixed(3),
      // where the hub is: the car's own corner (behind its middle for a rear wheel, to its left or right by the wheel's side)
      side: +((s.a[0] - hub0[0]) * -fz + (s.a[1] - hub0[1]) * fx).toFixed(2), along: +((s.a[0] - hub0[0]) * fx + (s.a[1] - hub0[1]) * fz).toFixed(2), k, hw: +v.kit.E.body.hw.toFixed(2), b: +P.m.b.toFixed(2) };
    // on: longer
    drive(20, 30); const q2 = gouge(); o.l2 = +len(q2).toFixed(2); o.n2 = q2.length; 
    // in the air: none, and not joined across it
    const nA = gouge().length; drive(20, 15, true); o.air = gouge().length - nA; drive(20, 12); const q3 = gouge();
    o.gap = +Math.max(...q3.map((e, i) => !i ? 0 : Math.hypot(e.a[0] - q3[i - 1].b[0], e.a[1] - q3[i - 1].b[1]))).toFixed(2); o.n3 = q3.length;
    o.mesh1 = meshes(); o.call1 = meas(); sk.visible = false; o.callH = meas(); sk.visible = true; o.marks1 = G.drawRange.count / 6; o.others = o.marks1 - o.marks0 - q3.length;   // (others: marks laid meanwhile that are not the gouge's)
    // the race again: the marks cleared, the new view without a gouge's end
    g.onAction('restart'); g.pause(); const P2 = g.race.player, v2 = Render.viewOf(P2); for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P2, 'chase', {});
    o.again = { fresh: v2 !== v, n: gouge().length, marks: G.drawRange.count / 6, hubG: !!(v2.hubG && v2.hubG.some(Boolean)), off: v2.wheelOff.filter(Boolean).length, lost: Object.keys(P2.lost || {}).filter(n => P2.lost[n]).length };
    return o; });
  const HG = hg.geo, HA = hg.again, near = (a, b, e) => Math.abs(a - b) <= e;
  T.check('7. the car whole, 30 m at 20 m/s: no gouge', hg.kit && hg.whole.n === 0 && hg.whole.off === 0 && !hg.whole.hubG, JSON.stringify(hg.whole));
  T.check('7. the rear left wheel off, 18 m at 12 m/s: sparks off the hub, no gouge (15 m/s or less)', hg.off.join('') === '0010' && hg.slow.n === 0 && hg.slow.sparks > 0, `${hg.off}, ${JSON.stringify(hg.slow)}`);
  T.check('7. 20 m at 20 m/s: a gouge of 18 to 20 m, joined end to end, its pieces 0.6 to 4 m', hg.n1 >= 20 && hg.l1 >= 18 && hg.l1 <= 20.01 && HG.joined && HG.seg[0] > 0.6 && HG.seg[1] < 4, `${hg.l1} m in ${hg.n1}, pieces ${HG.seg}`);
  T.check('7. the gouge 0.1 m wide, 3 cm over the road, under the bare hub (the rear left: the body\'s half width to the left, the rear axle behind the middle), straight along the car\'s way',
    near(HG.w[0], 0.1, 0.002) && near(HG.w[1], 0.1, 0.002) && near(HG.al, 0.8, 0.01) && near(HG.y, 0.03, 0.005) && near(HG.side, -HG.hw, 0.02) && near(HG.along, 20 / 30 - HG.b, 0.02) && HG.line < 0.02, JSON.stringify(HG));
  T.check('7. 20 m more: the gouge that much longer', hg.n2 > hg.n1 && near(hg.l2 - hg.l1, 20, 0.7), `${hg.l1} → ${hg.l2} m (${hg.n1} → ${hg.n2})`);
  T.check('7. in the air (10 m): none, and on the road again not joined across it', hg.air === 0 && hg.n3 > hg.n2 && hg.gap > 9, `${hg.air} in the air, the gap ${hg.gap} m, ${hg.n2} → ${hg.n3}`);
  T.check('7. only the bare hub marks the road (the other three wheels: no mark of any kind)', hg.marks0 === 0 && hg.others === 0 && hg.marks1 === hg.n3, `${hg.marks0} before, ${hg.marks1} after, ${hg.n3} the gouge's`);
  T.check('7. no mesh more in the scene, no draw call but the tyre marks\' one (hidden: one fewer), the frame ≤ 360', hg.mesh1 === hg.mesh0 && hg.call1 - hg.callH === 1 && hg.call1 <= 360, `meshes ${hg.mesh0} → ${hg.mesh1}, calls ${hg.call0} before, ${hg.call1} with, ${hg.callH} with the marks hidden`);
  T.check('7. the race again: the marks cleared, the car whole, its view without a gouge\'s end', HA.fresh && HA.n === 0 && HA.marks === 0 && !HA.hubG && HA.off === 0 && HA.lost === 0, JSON.stringify(HA));
  // 8. P4.4, a bent wheel's sagged corner (P3): no sparks under it, however low the body as drawn (as on main; the stream it had from
  // 20. 11. was taken out on 27. 11. 2026, the card trki-iskre-vogal answered 2). The Tornado: its low splitter's corner, the sag held at
  // 1 cm over the road (tools/trki/iskre-vogal.mjs). The car carried by hand as in 7
  const sc = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const R = g.race, P = R.player, o = {};
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; c.rpm = 0; }
    for (let i = 0; i < 4; i++) { g.sim(0.5, true); for (const c of R.cars) { c.vx = 0; c.vz = 0; } }
    const fx = Math.cos(P.h), fz = Math.sin(P.h), y0 = P.y, ry0 = P.roadY;
    for (const c of R.cars) if (c !== P) { const y = c.y, ry = c.roadY; c.place(c.x - fx * 300, c.z - fz * 300, c.h); c.y = c.py = y; c.roadY = ry; }
    const drive = (v, n, air) => { for (let i = 0; i < n; i++) { P.place(P.x + fx * v / 30, P.z + fz * v / 30, P.h); P.y = P.py = y0; P.roadY = ry0; P.air = air ? 1 : 0; P.vx = fx * v; P.vz = fz * v; P.speed = v; P.w = 0; P.axF = 0; Render.frame(1 / 30, 1, P, 'chase', {}); }
      P.vx = 0; P.vz = 0; P.speed = 0; P.air = 0; };
    const meas = () => { for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P, 'chase', {}); const c0 = __gl.calls; Render.frame(1 / 60, 1, P, 'chase', {}); return __gl.calls - c0; };
    const meshes = () => { let n = 0; Render.scene.traverse(q => { if (q.isMesh || q.isPoints || q.isLine) n++; }); return n; };
    const v = Render.viewOf(P), sp = () => Render.fxStats().sparksN, run = (vel, n, air) => { const s0 = sp(); drive(vel, n, air); return sp() - s0; };
    const gapOf = () => { let lo = Infinity; const a = v.body.geometry.attributes.position.array, p = new THREE.Vector3(); v.grp.updateMatrixWorld(true);   // (the lowest point of the outer shell as it stands drawn, over the road)
      for (let i = 0, n = v.body.geometry.userData.outerN; i < n; i++) { p.set(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]).applyMatrix4(v.body.matrixWorld); v.grp.worldToLocal(p); if (p.y < lo) lo = p.y; } return +lo.toFixed(4); };   // (in the car's own frame: it lies on the road's slope)
    o.kit = !!v.kit; o.whole = run(20, 30); o.gap0 = gapOf(); o.mesh0 = meshes();
    // the front left wheel bent a little: the corner sags, its body still over the road: none
    P.cd[0] = 0.47; o.some = run(20, 30); o.bendS = v.bend[0]; o.sagS = !!v.sagQ; o.gapS = gapOf();
    // bent all the way: down to 1 cm over the road, and still none: at 12 m/s, at 20 m/s, in the air
    P.cd[0] = 1; o.slow = run(12, 30); o.bend = v.bend[0]; o.gap = gapOf(); o.fast = run(20, 30); o.air = run(20, 30, true);
    const xs = P.x, zs = P.z, again = () => { for (let i = 0; i < 30; i++) Render.frame(1 / 30, 1, P, 'chase', {}); P.place(xs, zs, P.h); return run(20, 30); };   // (the same 20 m from the same place, the camera settled before each)
    o.fast2 = again();
    o.mesh1 = meshes(); o.callS = meas(); o.alive = Render.fxStats().sparks;   // (none in the air after the runs; then the same run with the wheel straight again: the same draw calls)
    P.cd[0] = 0; o.back = again(); o.bendB = v.bend[0]; o.callN = meas(); o.aliveN = Render.fxStats().sparks;
    return o; });
  T.check('8. the car whole, 20 m at 20 m/s: no sparks', sc.kit && sc.whole === 0 && sc.gap0 > 0.03, JSON.stringify({ sparks: sc.whole, gap: sc.gap0 }));
  T.check('8. the front left wheel bent a little: the corner sagged, the body still over the road: no sparks', sc.bendS > 0 && sc.bendS < 0.5 && sc.sagS && sc.gapS > 0.016 && sc.gapS < sc.gap0 && sc.some === 0, JSON.stringify({ bend: sc.bendS, gap: sc.gapS, sparks: sc.some }));
  T.check('8. bent all the way: the body 1 cm over the road (the sag as drawn stays); 20 m at 20 m/s, at 12 m/s and in the air: no sparks (as on main)', sc.bend === 1 && sc.gap > 0.005 && sc.gap < 0.015 && sc.fast === 0 && sc.fast2 === 0 && sc.slow === 0 && sc.air === 0, JSON.stringify({ bend: sc.bend, gap: sc.gap, sparks: [sc.fast, sc.fast2], slow: sc.slow, air: sc.air }));
  T.check('8. none in the air after the runs, no mesh more in the scene; the wheel straight again: none, and the same draw calls as with it bent', sc.alive === 0 && sc.aliveN === 0 && sc.mesh1 === sc.mesh0 && sc.bendB === 0 && sc.back === 0 && sc.callS === sc.callN, `meshes ${sc.mesh0} → ${sc.mesh1}, calls ${sc.callS} bent, ${sc.callN} straight; sparks alive ${sc.alive} / ${sc.aliveN}, back ${sc.back}`);
  // 9. P4, the grit of a concrete wall (cv 6, render.js: world.barKind 1): the knock's frame costs no draw call, vertex or mesh over the
  // same frame at a steel rail (the one pool of particles, 2400, drawn whole each frame), the grit 86 particles at its fullest
  // (28 clouds, 50 crumbs, 8 lumps), and four full knocks in four frames leave the pool far from full (tools/trki/prah-klici.mjs: the race)
  const gd = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const R = g.race, P = R.player, T = R.track, W = Render.world, cv0 = Core.TX.cv, o = {};
    Core.TX.cv = 6; o.dust = Render.crashInfo().XC.dust;   // (the renderer reads the version each frame; the core is not stepped here)
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; c.rpm = 0; }
    let i0 = -1, sd = 1; for (let i = Math.floor(T.N * 0.1); i < T.N && i0 < 0; i++) for (const s of [1, -1]) if (i0 < 0) { let ok = true; for (let k = -4; k <= 4; k++) ok = ok && W.barKind(i + k, s) === 1; if (ok) { i0 = i; sd = s; } }
    if (i0 < 0) { Core.TX.cv = cv0; return o; }
    const q0 = T.query(T.px[i0], T.pz[i0], i0, {}), far = sd > 0 ? q0.br : q0.bl, d = far - P.m.len / 2 - 0.3;   // (the player's nose at the wall, standing)
    P.place(T.px[i0] + sd * T.nx[i0] * d, T.pz[i0] + sd * T.nz[i0] * d, Math.atan2(sd * T.nz[i0], sd * T.nx[i0])); P.q = T.query(P.x, P.z, i0, P.q); if (T.hasElev) { P.y = P.py = T.hy[P.q.i]; P.roadY = T.hy[P.q.i]; }
    P.wallX = T.px[i0] + sd * T.nx[i0] * far; P.wallZ = T.pz[i0] + sd * T.nz[i0] * far; o.at = [P.q.i, P.q.k];
    Render.resetCam(); const F = Render.fxStats, fr = () => Render.frame(1 / 60, 1, P, 'chase', {}), meshes = () => { let n = 0; Render.scene.traverse(q => { if (q.isMesh || q.isPoints || q.isLine) n++; }); return n; };
    const knock = (grit, n) => { for (let i = 0; i < (n ? 0 : 240); i++) fr();   // (the particles of the knock before died out: the two frames alike)
      const bk = W.barKind; if (!grit) W.barKind = () => 0; const e0 = F().total, m0 = meshes(); let c0 = __gl.calls, v0 = __gl.verts;
      P.fxWall = 30; P.fxCar = 0; fr(); P.fxWall = 0; W.barKind = bk; const r = { c: __gl.calls - c0, v: __gl.verts - v0, em: F().total - e0, alive: F().alive, cMax: 0, mesh: meshes() - m0 };
      for (let i = 0; i < (n || 30); i++) { c0 = __gl.calls; fr(); r.cMax = Math.max(r.cMax, __gl.calls - c0); r.alive = Math.max(r.alive, F().alive); } return r; };
    o.steel = knock(false); o.grit = knock(true); o.steel2 = knock(false);
    for (let i = 0; i < 240; i++) fr(); const e0 = F().total; o.alive4 = 0; for (let k = 0; k < 4; k++) o.alive4 = Math.max(o.alive4, knock(true, 1).alive); o.em4 = F().total - e0;
    Core.TX.cv = cv0; return o; });
  const gG = gd.grit || {}, gS = gd.steel || {}, gS2 = gd.steel2 || {};
  T.check('9. a concrete wall found beside the road, cv 6 lays its grit: 86 particles over the knock at steel (which lays the same twice)', gd.dust === 1 && !!gd.grit && gS.em > 0 && gS.em === gS2.em && gG.em - gS.em === 86, JSON.stringify(gd));
  T.check('9. the grit costs no draw call, vertex or mesh: the knock\'s frame and the 30 after it as at steel', !!gd.grit && gG.c === gS.c && gG.c === gS2.c && gG.v === gS.v && gG.cMax === gS.cMax && gG.mesh === 0 && gS.mesh === 0 && gG.c <= 300, `calls ${gG.c} / ${gS.c} / ${gS2.c}, after ${gG.cMax} / ${gS.cMax}, vertices ${gG.v} / ${gS.v}, meshes +${gG.mesh}`);
  T.check('9. the pool of 2400 holds: one knock under 200 alive, four knocks in four frames under 600 (none written over)', gG.alive < 200 && gd.em4 === 4 * gG.em && gd.alive4 === gd.em4 && gd.alive4 < 600, `alive ${gG.alive}, four ${gd.alive4} of ${gd.em4} emitted`);
  // 10. a pile-up: more than 6 knocked rivals in the view: the nearest 3 with their own panels, the others one mesh again (xLtCut, xLight)
  // (a page of its own, the first one closed: the rally car's race, its rivals the older bodies, whose panels are meshes of their own; the
  // race built at cv 6 from its start)
  await page.close();
  const p10 = await openGame(browser, srv.base + '/index.html', { ...base, carId: 'rally' }, { width: 844, height: 390 }, { seed: 12345 });
  await p10.page.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
  await startTrack(p10.page, 'spa');
  const pu = await p10.page.evaluate(() => { const g = window.__game, cv0 = Core.TX.cv, o = {}; Core.TX.cv = 6; g.onAction('restart'); g.pause(); const R = g.race, P = R.player;
    for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; c.rpm = 0; }
    for (let i = 0; i < 16; i++) { g.sim(0.5, true); for (const c of R.cars) { c.vx = 0; c.vz = 0; } }   // (past the camera's way in at the start; the cars standing)
    const fx = Math.cos(P.h), fz = Math.sin(P.h), rv = R.cars.filter(c => c !== P && Render.viewOf(c) && Render.viewOf(c).xOn && Render.viewOf(c).det).slice(0, 10);
    rv.forEach((c, i) => { const f = 9 + 6 * (i >> 1), l = i & 1 ? 1.7 : -1.7; c.place(P.x + fx * f - fz * l, P.z + fz * f + fx * l, P.h); c.y = c.py = P.y; c.roadY = P.roadY; });
    for (const c of R.cars) if (c !== P && rv.indexOf(c) < 0) { c.place(P.x - fx * 400, P.z - fz * 400, P.h); }   // (the others out of the view)
    Render.resetCam(); const fr = (n) => { for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, P, 'chase', {}); };
    const meas = () => { const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); return [__gl.calls - c0, __gl.verts - v0]; };
    const st = () => rv.map(c => { const v = Render.viewOf(c); return v.xLt ? 'L' : v.mrg ? 'm' : 'A'; }).join('');   // (L light, A apart: its own panels, m one mesh as built)
    const sum = (v) => { if (!v.partsM) return null; const a = v.partsM.geometry.attributes.position.array; let q = 0; for (let i = 0; i < a.length; i++) q += a[i] * (1 + i % 7); return +q.toFixed(3); };
    fr(30); o.n = rv.length; o.ids = [...new Set(rv.map(c => c.m.id))].join(','); o.st0 = st(); o.c0 = meas();
    for (const c of rv) { Core.applyDamage(c, 0.15, c.m.len / 2, 0); Core.applyDamage(c, 0.12, -c.m.len / 2, 0.5 * c.m.wid / 2); }
    fr(12); o.st1 = st();   // (the first knocks: one rival taken apart a frame, all ten by now)
    fr(108); o.st2 = st(); o.cOn = meas(); o.dmg = +(rv.reduce((a, c) => a + c.dmg, 0) / rv.length).toFixed(2);
    Render.setDebug({ xLtK: 99 }); fr(30); o.st3 = st(); o.cOff = meas();   // (the rule off: every knocked rival its own panels)
    Render.setDebug({ xLtK: null }); fr(60); o.st4 = st(); o.cOn2 = meas();
    // a new knock on the farthest, a light one
    const q = rv[rv.length - 1], v = Render.viewOf(q); o.sum0 = sum(v); o.log0 = (v.dLog || []).length; o.d0 = +q.dmg.toFixed(3);
    Core.applyDamage(q, 0.2, 0, q.m.wid / 2); o.wait = (q.dents || []).length; fr(1);
    o.hit = { lt: !!v.xLt, mrg: !!v.mrg, det: !!(v.det && v.det.visible), left: (q.dents || []).length, log: (v.dLog || []).length, dmg: +q.dmg.toFixed(3), sum: sum(v) };
    fr(60); o.st5 = st(); o.sum1 = sum(v); o.cOn3 = meas();
    Core.TX.cv = cv0; return o; });
  T.check('10. ten rivals in two files ahead, whole: each one mesh as built', pu.n === 10 && pu.st0 === 'mmmmmmmmmm', `${pu.n} rivals (${pu.ids}), ${pu.st0}, calls ${pu.c0}`);
  T.check('10. all ten knocked: the 3 nearest keep their own panels, the 7 behind them light (one mesh again)', pu.st2 === 'AAALLLLLLL' && pu.st1.indexOf('m') < 0, `${pu.st1} → ${pu.st2}, dmg ${pu.dmg}`);
  T.check('10. the rule off (xLtK 99): all ten their own panels, at least 20 calls more and no fewer vertices; on again: as before', pu.st3 === 'AAAAAAAAAA' && pu.cOff[0] - pu.cOn[0] >= 20 && pu.cOn[1] <= pu.cOff[1] && pu.st4 === 'AAALLLLLLL' && Math.abs(pu.cOn2[0] - pu.cOn[0]) <= 2, `on ${pu.cOn}, off ${pu.cOff}, on again ${pu.cOn2}; ${pu.st3} → ${pu.st4}`);
  T.check('10. a new knock on a light rival: taken apart that frame, the dent in its panels, none left waiting (light again that frame: the dent in its mesh)', pu.wait > 0 && (pu.hit.lt ? pu.hit.mrg && pu.hit.sum !== pu.sum0 : !pu.hit.mrg && pu.hit.det) && pu.hit.left === 0 && pu.hit.log > pu.log0 && pu.hit.dmg > pu.d0, JSON.stringify({ waiting: pu.wait, hit: pu.hit, log0: pu.log0, dmg0: pu.d0 }));
  T.check('10. light again after it, the dent in its one mesh', pu.st5 === 'AAALLLLLLL' && pu.sum0 != null && pu.sum1 != null && pu.sum1 !== pu.sum0, `${pu.st5}, mesh ${pu.sum0} → ${pu.sum1}, calls ${pu.cOn3}`);
  T.check('10. no page errors', !p10.errors.length, p10.errors.slice(0, 2).join(' | '));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
