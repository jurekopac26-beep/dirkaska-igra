// The fleet in the browser (the render kit's geometry, stage B1): every registered vehicle as the game draws it, on a phone-size screen
// (844x390, normal quality, shadows on), the game paused and stepped (g.sim), so every number is the same each run.
//  - the kit: Render.kitStatus 'ok' for every vehicle with a look (a look that throws or breaks a rule falls back: a FAIL here), the
//    place-holders (look null) drawn as the generic kit hatch; the body's outer shell and inner block within their triangle budgets (a car
//    1400 / 800, a truck, the limousine, the monster truck 2400 / 1200), every part of the vehicle's table with geometry of its own (a
//    non-empty range), the wheels' detail (the player's / the showroom's <= 400 triangles, a rival's <= 160)
//  - the showroom: the vehicle over a whole turn stays on the screen and off the car panel, in landscape (844x390) and portrait (390x844)
//  - the caches: after the car menu has been through every car, one colour-neutral body per model and at most two showroom copies
//  - no seeing through the car (each vehicle with a look, on a flat background): each wheel arch from low at its side shows its tub over the
//    tyre, the front right rim from three quarters its barrel (never the background); the car's own colours: every vehicle in every player's
//    and rival's colour, stripe on and off, no vertex but the glass within 0.06 of a glass colour (Render.kitGlassNear)
//  - in a race (Bakreni gozd: a pit track, the pit crew knows the car), each vehicle as the player and as a rival: the draw calls of its
//    meshes alone (the rest of the scene hidden, frustum culling off, one frame, every pass counted as perf.test.mjs does): the player
//    <= 14, a rival <= 9; the four wheels exactly on the physics' hubs (the front ones at M.a, the rear at -M.b, at rw, at +-hw; the left
//    ones mirrored), the player's casting shadows, a rival's not; the pit crew's hubs (crDims) on the wheel meshes (1 cm); the intact car
//    drawn with its outer shell only; the cockpit's style (open / kart / formula: Render.cockpit.open); the materials the graphics test
//    expects ('dirtyCarCg' bodies, 'carCg' paint); no colour that is not glass within 0.06 of a glass colour (the glass glints and breaks by
//    its colour); the start number lit on every K.number panel; a part lost: the whole buffer in the chase view, the outer shell only from
//    the cockpit; a crushed roof (roofDmg 1) only inside body.crush, its noCrush ranges moved whole, the lining with its shell (the twins),
//    the cabin unmoved; dents never move a noDent range
//  - the field's cost: each one-make field (fieldN may cap it) on Jezero and the Nordschleife, within tests/golden/perf.json's phone budget
//    (+10 % +5 calls, +10 % +20k vertices): perf.test.mjs's six samples of the default race, each frame without its rivals (the world and
//    the player, the player then swapped for the vehicle) plus the vehicle's rival cost times as many rivals as the default field had
//    drawn there (its rivals' calls / vertices in that frame over one default rival's whole cost; at most the field's size). Also printed:
//    every rival of the field drawn in full (the worst case)
//   node tests/browser/fleet.test.mjs            (FLEET_ONLY=titan,mravlja: the per-vehicle checks of those only)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the fleet in the browser: the kit\'s geometry, budgets, showroom, field cost');
const only = (process.env.FLEET_ONLY || '').split(',').filter(Boolean);
const PERF = JSON.parse(fs.readFileSync(path.join(REPO, 'tests', 'golden', 'perf.json'), 'utf8'));
const t0 = Date.now();
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2, weather: 'dry' }, { width: 844, height: 390 }, { seed: 4242 });
  const warns = []; page.on('console', m => { if (m.type() === 'warning' && !/generic kit hatch: fallback:look null/.test(m.text())) warns.push(m.text()); });
  // the counting wrap (as perf.test.mjs) and the page's helpers
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    // one frame's draws with only `keep` (some of the scene's children) and the lights shown, frustum culling off on them
    const frameWith = (keep, target, mode) => {
      const S = Render.scene, saved = S.children.map(o => [o, o.visible]), culled = [];
      for (const o of S.children) o.visible = !!o.isLight || keep.includes(o);
      for (const k of keep) k.traverse(o => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
      const c0 = __gl.calls, v0 = __gl.verts; Render.frame(0, 1, target, mode || 'chase', { noFx: true });
      const r = [__gl.calls - c0, __gl.verts - v0];
      for (const [o, v] of saved) o.visible = v; for (const o of culled) o.frustumCulled = true;
      return r;
    };
    // a view's own cost: its group alone minus the empty scene (what every frame draws anyway: the post pass, ...)
    const costOf = (v, target) => { const e = frameWith([], target), c = frameWith([v.grp], target); return { calls: c[0] - e[0], verts: c[1] - e[1] }; };
    const GL = [[0.1, 0.13, 0.19], [0.04, 0.05, 0.08]];
    window.__fl = { frameWith, costOf, GL };
  });

  // ---- 1. the kit: every registered vehicle's build (no race) ----
  const models = await page.evaluate((only) => Core.MODELS.filter(m => !m.retired && (!only.length || only.includes(m.id))).map(m => ({ id: m.id, kit: !!m.kit, look: !!(m.def && m.def.look) })), only);
  const kits = models.filter(m => m.kit);
  const K1 = await page.evaluate((ids) => ids.map(id => {
    const M = Core.MODELS.find(m => m.id === id), I = Render.kitInfo(id), PT = Core.partsOf(M), noRange = [];
    for (const n in PT) if (PT[n].wh == null && !(I.ranges[n] && I.ranges[n].o[1] > I.ranges[n].o[0])) noRange.push(n);
    return { id, status: I.status, look: !!M.def.look, tris: I.tris, budget: I.budget, noRange, hi: I.wheels.hi, lo: I.wheels.lo };
  }), kits.map(m => m.id));
  const badStatus = K1.filter(k => k.look ? k.status !== 'ok' : !/^fallback:look null/.test(k.status)), held = K1.filter(k => !k.look).length;
  T.check(`Render.kitStatus: 'ok' for every vehicle with a look (${K1.length - held}), the place-holders (${held}, look null) drawn as the generic kit hatch`, !badStatus.length && K1.length === kits.length,
    badStatus.map(k => k.id + ': ' + k.status).slice(0, 4).join(' | '));
  const overB = K1.filter(k => k.tris.outer > k.budget.outer || k.tris.inner > k.budget.inner);
  T.check('the body within its triangle budget (outer shell / inner block: a car 1400 / 800, the big ones 2400 / 1200)', !overB.length,
    (overB.length ? overB : K1.filter(k => k.look)).slice(0, 6).map(k => `${k.id} ${k.tris.outer}/${k.budget.outer} ${k.tris.inner}/${k.budget.inner}`).join(', '));
  const noR = K1.filter(k => k.noRange.length);
  T.check('every part of the vehicle\'s table has geometry of its own (a non-empty range; the wheels are their own meshes)', !noR.length, noR.map(k => k.id + ': ' + k.noRange.join(' ')).slice(0, 4).join(' | '));
  const wBad = K1.filter(k => k.hi.some(t => t > 400) || k.lo.some(t => t > 160));
  T.check('the wheels\' detail: the player\'s and the showroom\'s <= 400 triangles, a rival\'s <= 160', !wBad.length, (wBad.length ? wBad : K1.filter(k => k.look)).slice(0, 6).map(k => `${k.id} ${k.hi.join('/')} | ${k.lo.join('/')}`).join(', '));

  // ---- 2. the showroom: over a whole turn on the screen and off the car panel (landscape and portrait) ----
  for (const [w, h] of [[844, 390], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    const S = await page.evaluate(async (ids) => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
      g.onAction('to-car'); await wait(400);
      const pr = document.querySelector('#s-car .car-panel').getBoundingClientRect(), out = [];
      for (const id of ids) {
        const M = Core.MODELS.find(m => m.id === id); Render.setShowCar(M, 0xd81f2a, 7);
        const b = Render.showBox(), land = b.w > b.h;
        const ok = b.x0 >= -2 && b.y0 >= -2 && (land ? b.x1 <= pr.left + 2 && b.y1 <= b.h + 2 : b.x1 <= b.w + 2 && b.y1 <= pr.top + 2);
        out.push({ id, ok, b: [b.x0, b.x1, b.y0, b.y1].map(Math.round) });
      }
      g.onAction('to-title'); await wait(250);
      return { panel: [pr.left, pr.top].map(Math.round), out };
    }, models.map(m => m.id));
    const bad = S.out.filter(q => !q.ok), big = S.out.filter(q => ['titan', 'kamen', 'predsednik', 'goljat', 'mravlja'].includes(q.id));
    T.check(`the showroom at ${w}x${h}: every vehicle over a whole turn on the screen and off the car panel (panel at ${w > h ? 'x ' + S.panel[0] : 'y ' + S.panel[1]})`, !bad.length && S.out.length === models.length,
      (bad.length ? bad : big).slice(0, 8).map(q => `${q.id} x ${q.b[0]}..${q.b[1]} y ${q.b[2]}..${q.b[3]}`).join(', '));
  }
  await page.setViewportSize({ width: 844, height: 390 });

  // ---- 3. the caches after the car menu has shown every car: one colour-neutral body per model, at most two showroom copies ----
  const C3 = await page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r));
    g.onAction('to-car'); await wait(300);
    for (let k = 0; k < Core.MODELS.length; k++) { g.onAction('car-next'); await raf(); }
    g.onAction('to-title'); await wait(200);
    return { info: Render.kitInfo(), kits: Core.MODELS.filter(m => m.kit).length };
  });
  T.check('the caches after the car menu: one colour-neutral body per model (no copies per colour), its wheels, at most two showroom copies', C3.info.models <= C3.kits && C3.info.wheels <= 2 * C3.kits && C3.info.show <= 2,
    `${C3.info.models} bodies for ${C3.kits} models, ${C3.info.wheels} wheel sets, ${C3.info.show} showroom copies (the 11's per-colour bodies: ${C3.info.legacy})`);

  // ---- 3b. no seeing through the car: the showroom car alone on a flat magenta background (no shadow blob, no turntable). Each wheel arch
  //          of a vehicle with a look from low at its side, looking up into it: points in the arch over the tyre (between the tread and the
  //          arch's rim) show the tub, never the background; the front right wheel (the player's detail) from three quarters in front: points
  //          just inside the rim's lip show the rim's barrel or its dish, never the background through the hollow tyre ----
  const looks = kits.filter(m => m.look).map(m => m.id);
  const SEE = await page.evaluate((ids) => ids.map(id => {
    const M = Core.MODELS.find(m => m.id === id), I = Render.kitInfo(id), W = 480, H = 270, bad = [];
    const shot = (what, cam, mark) => { const c = Render.carShot({ id, color: 0x2f6fd6, cam, bg: 0xff00ff, blob: false, floor: false, grid: false, w: W, h: H, mark }), x = c.getContext('2d');
      const d = x.getImageData(0, 0, W, H).data; let n = 0;   // (one read of the picture: the marks' pixels from it)
      for (const [px, py] of c.marks) { if (!(px >= 0 && py >= 0 && px < W && py < H)) continue; const o = ((py | 0) * W + (px | 0)) * 4; if (d[o] > 190 && d[o + 1] < 80 && d[o + 2] > 190) n++; }
      if (n) bad.push(what + ' ' + n + '/' + c.marks.length); };
    for (const T of I.tubs || []) for (const sd of [-1, 1]) {
      const mark = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.25 + 0.5 * i / 8); for (const k of [0.3, 0.6, 0.85]) { const rr = M.rw + (T.r - M.rw) * k; mark.push([T.x + Math.cos(a) * rr, T.y + Math.sin(a) * rr, sd * T.zo]); } }
      shot('arch ' + (T.x > 0 ? 'F' : 'R') + (sd < 0 ? 'L' : 'R'), { p: [T.x + 0.7, 0.25, sd * (T.zo + 2.4)], t: [T.x, T.y + T.r * 0.5, sd * T.zo], fov: 28 }, mark);
    }
    const LW = M.def.look.wheels || {}, rr = M.rw * (LW.rimK || { std: 0.64, deep: 0.68, wire: 0.72, retro: 0.6, knob: 0.5, truck: 0.62, monster: 0.46, slick: 0.68, kart: 0.56 }[I.wheels.style]);
    const zf = I.wheels.hw + (LW.w || Math.max(0.12, Math.min(0.42, M.rw * 0.68))) / 2, k = M.rw / 0.3, mark = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; for (const q of [0.86, 0.9]) mark.push([M.a + Math.cos(a) * rr * q, M.rw + Math.sin(a) * rr * q, zf]); }
    shot('rim FR', { p: [M.a + 1.3 * k, M.rw + 0.45 * k, zf + 1.3 * k], t: [M.a, M.rw, zf], fov: 30 }, mark);
    return { id, arches: (I.tubs || []).length * 2, bad };
  }), looks);
  T.check(`no seeing through the car: each wheel arch from low at its side (the tub over the tyre), the front right rim from three quarters (its barrel), on a flat background`,
    SEE.length === looks.length && SEE.every(r => !r.bad.length), (SEE.some(r => r.bad.length) ? SEE.filter(r => r.bad.length) : SEE).slice(0, 4).map(r => r.id + ': ' + (r.bad.length ? r.bad.join(', ') : r.arches + ' arches, the rim: clear')).join(' | '));
  // ---- 3c. the car's own colours off the glass: every vehicle in every player's and rival's colour, stripe on and off (a shade of a dark paint
  //          near a glass colour would glint and break as glass): no vertex but the glass within 0.06 of a glass colour ----
  const COL = await page.evaluate(() => {
    const hex = (s) => { const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(s); return m ? (+m[1] << 16) | (+m[2] << 8) | +m[3] : null; };
    const player = [...document.querySelectorAll('#car-colors button')].map(b => hex(b.style.background)).filter(c => c != null);
    const ai = [...new Set(Array.from({ length: 64 }, (_, k) => Core.aiDriver(k).color))], cols = [...new Set(player.concat(ai))], bad = [];
    for (const m of Core.MODELS) if (m.kit && !m.retired) for (const c of cols) for (const st of [true, false]) { const r = Render.kitGlassNear(m.id, c, st); if (r.n) bad.push(`${m.id} 0x${c.toString(16)}${st ? '' : ' (no stripe)'}: ${r.n} vertices, e.g. ${r.e.map(v => v.toFixed(3))}`); }
    return { player: player.length, ai: ai.length, n: cols.length, bad };
  });
  T.check(`the car's own colours off the glass: every vehicle in the ${COL.n} colours (${COL.player} the player's, ${COL.ai} the rivals'), stripe on and off`, COL.player >= 8 && COL.ai >= 20 && !COL.bad.length, COL.bad.slice(0, 4).join(' | '));

  // ---- 4. in a race on Bakreni gozd: each vehicle as the player and as a rival ----
  await page.evaluate((id) => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === id); }, kits.length ? kits[0].id : 'rally');
  await startTrack(page, 'gozd');
  const R4 = [];
  for (const m of kits) {
    const r = await page.evaluate((id) => {
      const g = window.__game, M = Core.MODELS.find(q => q.id === id), FL = window.__fl;
      let seed = 777; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.S.car = Core.MODELS.indexOf(M); g.onAction('restart'); g.pause();
      const R = g.race, P = R.player; Render.frame(0, 1, P, 'chase', { noFx: true });
      const v = Render.viewOf(P), E = Render.kitInfo(id), why = [];
      // the player's cost, its wheels on the hubs, the crew's dims, the outer shell only, the materials, the glass colours, the number
      const pc = FL.costOf(v, P);
      const hw = E.body.hw, W = [...v.wf, ...v.wr];
      if (v.wf.length !== 2 || v.wr.length !== 2) why.push('wheels ' + v.wf.length + '+' + v.wr.length);
      for (const w of W) { const front = v.wf.includes(w), p = w.position;
        if (Math.abs(p.x - (front ? M.a : -M.b)) > 1e-6 || Math.abs(p.y - M.rw) > 1e-6 || Math.abs(Math.abs(p.z) - hw) > 1e-6 || (p.z < 0) !== (w.scale.z < 0)) why.push('wheel at ' + [p.x, p.y, p.z, w.scale.z].map(q => q.toFixed(3)).join(','));
        if (!w.castShadow || w.geometry.attributes.position.count / 3 > 400) why.push('player wheel shadow / detail'); }
      const ids = Object.keys(Core.partsOf(M)).filter(k => Core.partsOf(M)[k].wh != null), want = { wheelFL: [1, -1], wheelFR: [1, 1], wheelRL: [-1, -1], wheelRR: [-1, 1] };
      for (const k of ids) if (!W.some(w => Math.sign(w.position.x) === want[k][0] && Math.sign(w.position.z) === want[k][1])) why.push('no mesh for ' + k);
      const D = Render.crew && Render.crew.dim, crew = D ? [D.fx - v.wf[0].position.x, D.rx - v.wr[0].position.x, D.hw - Math.abs(v.wf[0].position.z)] : null;
      const geo = v.body.geometry, U = geo.userData, outer = geo.drawRange.count === U.outerN && U.outerN < U.N + 1;
      const keys = [], key = (o) => (o && o.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? o.customProgramCacheKey() : '');
      // glass colours: every vertex that is not the paint / the stripe (the car's own colours) either exactly a glass colour or 0.06 from both
      const skip = new Uint8Array(geo.attributes.position.count); for (const L of [U.paint.i, U.strp.i]) for (const i of L) skip[i] = 1;
      const col = geo.attributes.color.array; let near = 0, nearC = null;
      for (let i = 0; i < skip.length; i++) { if (skip[i]) continue; const c = [col[i * 3], col[i * 3 + 1], col[i * 3 + 2]];
        const d = Math.min(...FL.GL.map(G => Math.hypot(c[0] - G[0], c[1] - G[1], c[2] - G[2]))); if (d > 1e-4 && d < 0.06) { near++; nearC = c; } }
      // the start number: on each K.number panel as many lit bars as the number has
      let num = null; if (U.nums) { const n = P.num, seg = [6, 2, 5, 5, 4, 5, 6, 3, 7, 6], want2 = n >= 10 ? seg[Math.floor(n / 10)] + seg[n % 10] : seg[n];
        num = U.nums.map(Q => { let lit = 0; for (const sl of Q.slots) for (const q of sl) if (q && Math.abs(col[q[0] * 3] - Q.on[0]) < 1e-4 && Math.abs(col[q[0] * 3 + 1] - Q.on[1]) < 1e-4 && Math.abs(col[q[0] * 3 + 2] - Q.on[2]) < 1e-4) lit++; return lit === want2; }).every(Boolean); }
      // a rival of this vehicle (its own field), else one of the field put into it for the count
      let A = R.cars.find(c => !c.isPlayer && c.m === M), swapped = null;
      if (!A) { A = R.cars.find(c => !c.isPlayer); swapped = A.m; A.m = M; Render.attachRace(R); Render.frame(0, 1, P, 'chase', { noFx: true }); }
      const va = Render.viewOf(A), ac = FL.costOf(va, P), aw = [...va.wf, ...va.wr], aiW = aw.length === 4 && aw.every(w => !w.castShadow && w.geometry.attributes.position.count / 3 <= 160);
      for (const vv of [Render.viewOf(P), va]) vv.grp.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material)) return; const mt = o.material;
        if (mt.userData && mt.userData.dirt) keys.push('body:' + key(mt)); else if (mt.isMeshPhongMaterial && mt.envMap && !mt.vertexColors && mt.reflectivity === 0.2) keys.push('paint:' + key(mt)); });
      if (swapped) { A.m = swapped; Render.attachRace(R); }
      // the cockpit's style
      const st = E.body.eye.style; Render.frame(0, 1, P, 'cockpit', { noFx: true }); const ck = Render.cockpit; Render.frame(0, 1, P, 'chase', { noFx: true });
      const ckOk = !!ck && !!ck.open === (st !== 'closed') && !!ck.formula === (st === 'formula' || st === 'kart');
      // a part lost (not a wheel): the chase camera draws the whole buffer (the lining, the cabin behind the hole), the cockpit the outer shell
      // only (from the seat no lining, cabin or engine bay under the bonnet's edge); the part back (a test's shortcut): the outer shell again
      // (the player's view as it is now: a rival swapped in and out above rebuilt the views)
      const gP = Render.viewOf(P).body.geometry, UP = gP.userData, PT = Core.partsOf(M), lose = Object.keys(PT).find(k => PT[k].wh == null), dr = () => gP.drawRange.count;
      P.lost[lose] = true; Render.frame(0, 1, P, 'chase', { noFx: true }); const drC = dr(); Render.frame(0, 1, P, 'cockpit', { noFx: true }); const drK = dr();
      Render.frame(0, 1, P, 'chase', { noFx: true }); const drC2 = dr(); delete P.lost[lose]; Render.frame(0, 1, P, 'chase', { noFx: true });
      const lod = { lose, ok: drC === UP.N && drK === UP.outerN && drC2 === UP.N && dr() === UP.outerN, got: [drC, drK, drC2, dr()], want: [UP.N, UP.outerN] };
      // a crushed roof (roofDmg 1: four steps): nothing moves outside the roof's footprint (body.crush, fading over 15 cm in x, 10 cm in z);
      // a noCrush range moves whole (if at all); every lining point keeps its offset from the shell's point it is inset from; the rest of the
      // inner block (the cabin, the floor, the engine) stays. Then three hard dents: no noDent vertex moves
      const pa = gP.attributes.position.array, P0 = Float32Array.from(pa), C = E.body.crush, n = UP.outerN, mv = (i, Q) => Math.hypot(pa[i * 3] - Q[i * 3], pa[i * 3 + 1] - Q[i * 3 + 1], pa[i * 3 + 2] - Q[i * 3 + 2]);
      P.roofDmg = 1; Render.frame(0, 1, P, 'chase', { noFx: true });
      const cr = { moved: 0, outside: 0, spread: 0, lining: 0, stray: 0, nc: (UP.noCrush || []).length };
      for (let i = 0; i < n; i++) if (mv(i, P0) > 1e-6) { cr.moved++; const x = P0[i * 3], z = P0[i * 3 + 2]; if (x < C.x0 - 0.1501 || x > C.x1 + 0.1501 || Math.abs(z) > C.z + 0.1001) cr.outside++; }
      for (const [s0, s1] of UP.noCrush || []) for (let j = 0; j < 3; j++) { let lo = 9, hi = -9; for (let i = s0; i < s1; i++) { const d = pa[i * 3 + j] - P0[i * 3 + j]; lo = Math.min(lo, d); hi = Math.max(hi, d); } cr.spread = Math.max(cr.spread, hi - lo); }
      for (let i = n; i < UP.N; i++) { const t = UP.twin ? UP.twin[i - n] : -1;
        if (t < 0) { if (mv(i, P0) > 1e-6) cr.stray++; continue; }
        if (Math.hypot(pa[i * 3] - pa[t * 3] - (P0[i * 3] - P0[t * 3]), pa[i * 3 + 1] - pa[t * 3 + 1] - (P0[i * 3 + 1] - P0[t * 3 + 1]), pa[i * 3 + 2] - pa[t * 3 + 2] - (P0[i * 3 + 2] - P0[t * 3 + 2])) > 1e-4) cr.lining++; }
      const P1 = Float32Array.from(pa); P.dents.push({ lx: 0.2, lz: -0.9, amt: 1 }, { lx: -0.3, lz: 0, amt: 1 }, { lx: 0.8, lz: 0.9, amt: 1 }); Render.frame(0, 1, P, 'chase', { noFx: true });
      let ndMoved = 0, dMoved = 0; for (const [s0, s1] of UP.noDent || []) for (let i = s0; i < s1; i++) if (mv(i, P1) > 1e-6) ndMoved++;
      for (let i = 0; i < UP.N; i++) if (mv(i, P1) > 1e-6) dMoved++;
      const crushOk = cr.outside === 0 && cr.spread < 1e-4 && cr.lining === 0 && cr.stray === 0 && ndMoved === 0 && dMoved > 0;
      return { id, pc, ac, why, crew, outer, keys: [...new Set(keys)], near, nearC, num, aiW, st, ck: ck && { open: ck.open, formula: ck.formula }, ckOk, lod, cr, ndMoved, crushOk, swapped: !!swapped, fieldN: R.cars.length - 1 };
    }, m.id);
    R4.push(r);
  }
  const lim = (f, n) => R4.filter(f).map(r => r.id).slice(0, n || 6).join(', ');
  const fmtC = (r) => `${r.id} ${r.pc.calls}/${r.ac.calls}`;
  T.check('draw calls of each vehicle\'s meshes alone (every pass): the player <= 14, a rival <= 9', R4.length === kits.length && R4.every(r => r.pc.calls <= 14 && r.ac.calls <= 9),
    R4.filter(r => r.pc.calls > 14 || r.ac.calls > 9).concat(R4).slice(0, 8).map(fmtC).join(', '));
  T.check('the four wheels exactly on the physics\' hubs (M.a / -M.b, rw, +-hw; the left ones mirrored), one mesh for each wheel part; the player\'s cast shadows, a rival\'s none and <= 160 triangles',
    R4.every(r => !r.why.length && r.aiW), R4.filter(r => r.why.length || !r.aiW).slice(0, 3).map(r => r.id + ': ' + r.why.slice(0, 2).join('; ') + (r.aiW ? '' : ' rival wheels')).join(' | '));
  T.check('the pit crew\'s hubs (crDims) on the wheel meshes (within 1 cm)', R4.every(r => r.crew && r.crew.every(d => Math.abs(d) <= 0.01)),
    R4.filter(r => !r.crew || r.crew.some(d => Math.abs(d) > 0.01)).slice(0, 4).map(r => r.id + ' ' + (r.crew ? r.crew.map(d => d.toFixed(3)).join(',') : 'no crew')).join(' | '));
  T.check('an intact car draws its outer shell only (the inner block waits for a lost part)', R4.every(r => r.outer), lim(r => !r.outer));
  T.check('a part lost: the chase camera draws the whole buffer (the lining, the cabin behind the hole), the cockpit the outer shell only (no engine bay under the bonnet\'s edge)',
    R4.every(r => r.lod.ok), R4.filter(r => !r.lod.ok).concat(R4).slice(0, 4).map(r => `${r.id} (${r.lod.lose} off): chase / cockpit / chase / back ${r.lod.got.join(' / ')} of ${r.lod.want.join(' / ')}`).join(' | '));
  T.check('a crushed roof: nothing moves outside the roof\'s footprint (body.crush), a noCrush range only whole, the lining with its shell (each point by its twin), the cabin and floor stay; dents never move a noDent range',
    R4.every(r => r.crushOk), R4.filter(r => !r.crushOk).concat(R4.filter(r => r.cr.nc || r.cr.moved)).slice(0, 4).map(r => `${r.id}: ${r.cr.moved} moved, ${r.cr.outside} outside, noCrush ${r.cr.nc} (spread ${r.cr.spread.toFixed(4)}), lining off ${r.cr.lining}, stray ${r.cr.stray}, noDent moved ${r.ndMoved}`).join(' | '));
  T.check('the cockpit by the look\'s eye style (closed: the roof and pillars; open / kart / formula: Render.cockpit.open; kart / formula: the formula\'s wheel)', R4.every(r => r.ckOk),
    R4.filter(r => !r.ckOk).concat(R4.filter(r => r.st !== 'closed')).slice(0, 5).map(r => `${r.id} ${r.st} ${JSON.stringify(r.ck)}`).join(', '));
  T.check('the materials the graphics test expects: the bodies \'dirtyCarCg\', any paint \'carCg\' (player and rival)', R4.every(r => r.keys.length && r.keys.every(k => k === 'body:dirtyCarCg' || k === 'paint:carCg')),
    R4.filter(r => !r.keys.length || r.keys.some(k => k !== 'body:dirtyCarCg' && k !== 'paint:carCg')).slice(0, 3).map(r => r.id + ' ' + r.keys.join(',')).join(' | '));
  T.check('no colour that is not glass within 0.06 of a glass colour (the paint and the stripe aside)', R4.every(r => !r.near), R4.filter(r => r.near).slice(0, 3).map(r => `${r.id}: ${r.near} vertices, e.g. ${r.nearC.map(c => c.toFixed(3))}`).join(' | '));
  T.check('the start number lit on every K.number panel (as many bars as the car\'s number has)', R4.every(r => r.num !== false), lim(r => r.num === false) || R4.filter(r => r.num).map(r => r.id).join(', '));

  // ---- 5. the field's cost on Jezero and the Nordschleife: the frame without the default field's rivals (perf.test.mjs's samples) plus
  //         the vehicle as the player and its field of rivals (all of them, as if all were in view), within the phone budget ----
  const fields = R4.filter(r => !r.swapped);
  for (const tid of ['jezero', 'nring']) {
    await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'rally'); });
    await startTrack(page, tid);
    const B = await page.evaluate(() => {
      const g = window.__game, FL = window.__fl; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause();
      const R = g.race, P = R.player, s = [], seen = new Map();
      Render.frame(0, 1, P, g.S.camera, {});
      for (const c of R.cars) if (!c.isPlayer && !seen.has(c.m.id)) seen.set(c.m.id, FL.costOf(Render.viewOf(c), P));   // (one default rival's whole cost, the four averaged)
      const unit = [0, 0]; for (const q of seen.values()) { unit[0] += q.calls / seen.size; unit[1] += q.verts / seen.size; }
      const pl = FL.costOf(Render.viewOf(P), P);
      for (let k = 0; k < 6; k++) {
        const dt = Math.min(30, R.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
        const ai = R.cars.filter(c => !c.isPlayer).map(c => Render.viewOf(c)).filter(Boolean), was = ai.map(v => v.grp.visible);
        const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); const all = [__gl.calls - c0, __gl.verts - v0];
        for (const v of ai) v.grp.visible = false;
        const c1 = __gl.calls, v1 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push({ all, base: [__gl.calls - c1, __gl.verts - v1] });
        ai.forEach((v, i) => { v.grp.visible = was[i]; });
      }
      return { s, pl, unit, nAI: R.cars.length - 1 };
    });
    const G = PERF[tid], maxC = G.maxCalls * 1.1 + 5, maxV = (G.maxKverts * 1.1 + 20) * 1000;
    const est = await page.evaluate(({ rows, n }) => rows.map(r => Object.assign({ n: Core.fieldSize(Core.MODELS.find(m => m.id === r.id), n) }, r)), { rows: fields.map(r => ({ id: r.id, pc: r.pc, ac: r.ac })), n: B.nAI });
    const rows = est.map(r => {
      let calls = 0, verts = 0, allC = 0, allV = 0;
      for (const q of B.s) {
        const nC = Math.min(r.n, (q.all[0] - q.base[0]) / B.unit[0]), nV = Math.min(r.n, (q.all[1] - q.base[1]) / B.unit[1]), bc = q.base[0] - B.pl.calls + r.pc.calls, bv = q.base[1] - B.pl.verts + r.pc.verts;
        calls = Math.max(calls, bc + nC * r.ac.calls); verts = Math.max(verts, bv + nV * r.ac.verts); allC = Math.max(allC, bc + r.n * r.ac.calls); allV = Math.max(allV, bv + r.n * r.ac.verts);
      }
      return { id: r.id, n: r.n, calls: Math.round(calls), verts: Math.round(verts), allC, allV };
    });
    const bad = rows.filter(r => r.calls > maxC || r.verts > maxV), worst = rows.slice().sort((a, b) => b.verts / maxV - a.verts / maxV).slice(0, 3);
    const drawn = B.s.map(q => ((q.all[0] - q.base[0]) / B.unit[0]).toFixed(1)).join(' ');
    T.check(`${tid}: each vehicle's own field (fieldN capped) within the phone budget (calls <= ${Math.round(maxC)}, vertices <= ${Math.round(maxV / 1000)}k; the default race: ${Math.max(...B.s.map(q => q.all[0]))} calls, rivals drawn per sample ${drawn} of ${B.nAI})`,
      rows.length === fields.length && !bad.length, (bad.length ? bad : worst).slice(0, 4).map(r => `${r.id} x${r.n}: ${r.calls} calls, ${Math.round(r.verts / 1000)}k`).join(', '));
    console.log(`info ${tid}: every rival of the field drawn in full (the worst case): ` + rows.map(r => `${r.id} x${r.n} ${r.allC} / ${Math.round(r.allV / 1000)}k`).join(', '));
  }

  T.check('no page errors, no warnings (but the place-holders\' fallback)', !errors.length && !warns.length, errors.concat(warns).slice(0, 5).join(' | '));
  console.log(`info ${kits.length} vehicles in ${((Date.now() - t0) / 1000).toFixed(0)} s; per vehicle (player / rival calls, kverts): ` + R4.map(r => `${r.id} ${r.pc.calls}/${r.ac.calls} ${(r.pc.verts / 1000).toFixed(1)}/${(r.ac.verts / 1000).toFixed(1)}`).join(', '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
