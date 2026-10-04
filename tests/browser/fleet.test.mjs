// The fleet in the browser (the render kit's geometry, stage B1): every registered vehicle as the game draws it, on a phone-size screen
// (844x390, normal quality, shadows on), the game paused and stepped (g.sim), so every number is the same each run.
//  - the kit: Render.kitStatus 'ok' for every vehicle with a look (a look that throws or breaks a rule falls back: a FAIL here), the
//    place-holders (look null) drawn as the generic kit hatch; the body's outer shell and inner block within their triangle budgets (a car
//    1400 / 800, a truck, the limousine, the monster truck 2400 / 1200), every part of the vehicle's table with geometry of its own (a
//    non-empty range), the wheels' detail (the player's / the showroom's <= 400 triangles, a rival's <= 160)
//  - the showroom: the vehicle over a whole turn stays on the screen and off the car panel, in landscape (844x390) and portrait (390x844)
//  - the caches: after the car menu has been through every car, one colour-neutral body per model and at most two showroom copies
//  - no seeing through the car (each vehicle with a look, on a flat background): each wheel arch from low at its side shows its tub over the
//    tyre, the front right rim from three quarters its barrel (never the background); an open top (Render.kitInfo(id).openings: a
//    cockpit, a bed) from above and from behind, the front and the side at 55 degrees shows its lining, floor, bulkheads, never the
//    background; the car's own colours: every vehicle in every player's and rival's colour, stripe on and off, no vertex but the glass
//    within 0.06 of a glass colour (Render.kitGlassNear)
//  - in a race (Bakreni gozd: a pit track, the pit crew knows the car), each vehicle as the player and as a rival: the draw calls of its
//    meshes alone (the rest of the scene hidden, frustum culling off, one frame, every pass counted as perf.test.mjs does): the player
//    <= 14, a rival <= 9; the four wheels exactly on the physics' hubs (the front ones at M.a, the rear at -M.b, at rw, at +-hw; the left
//    ones mirrored), the player's casting shadows, a rival's not; the pit crew's hubs (crDims) on the wheel meshes (1 cm); the intact car
//    drawn with its outer shell only; the cockpit's style (open / kart / formula: Render.cockpit.open); the materials the graphics test
//    expects ('dirtyCarCg' bodies, 'carCg' paint); no colour that is not glass within 0.06 of a glass colour (the glass glints and breaks by
//    its colour); the start number lit on every K.number panel; the driver sees out (no pane of glass ahead of the eyes turned to them); a part lost: the whole buffer in the chase view, the outer shell and the engine bay
//    ahead of the windscreen (U.engN) from the cockpit; a crushed roof (roofDmg 1) only inside body.crush, its noCrush ranges moved whole, the lining with its shell (the twins),
//    the cabin unmoved; dents never move a noDent range
//  - the wreck (stage B2; sections 4b-4e): Core.wreckCar's parts off as pieces of their own (their ranges' copies, their own frozen copies
//    of the body's material), loose parts hinged (the inside drawn behind them), the rear bumper alone (the tail lamps on the body lit),
//    one wheel and then all off with the body sagged (never into the road), the lamps and panes, the pit crew and the marshals' refit
//    (after limping through a corner: no offset left), a repair; as the player sees it (every
//    vehicle, the 11 too: at least 35 % of its screen box changed, its fire and smoke in sight, the cockpit not blacked out under a
//    crushed roof, its draw calls); a field on fire (at most 6 emit, each within 40 flames and 12 smoke particles a second); a patrol car
//    wrecked (its pieces drawn and freed, burning, its light bar gone); the field under a wreck (40 pieces on Jezero, section 5)
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
  // ---- 3c. no seeing through an open top (a loft panel null: a roadster's cockpit, a pickup's bed; Render.kitInfo(id).openings): the
  //          showroom car alone on a flat magenta background, each opening from above and from behind, the front and the side at 55
  //          degrees: inside it (6 cm in from its edges, at its rim's height) no pixel of the background: its lining, floor, bulkheads,
  //          rims and the wheels' housings (the outer shell, drawn while the car is whole) close it ----
  const OPEN = await page.evaluate((ids) => ids.map(id => {
    const I = Render.kitInfo(id), W = 480, H = 270, bad = [], c = Math.cos(55 * Math.PI / 180), s = Math.sin(55 * Math.PI / 180);
    for (const [k, op] of (I.openings || []).entries()) for (const [what, D] of [['above', [0, -1, 0]], ['behind', [c, -s, 0]], ['the front', [-c, -s, 0]], ['the side', [0, -s, c]]]) {
      const x0 = op.x[0] + 0.06, x1 = op.x[1] - 0.06, z = op.z - 0.06, T = [(op.x[0] + op.x[1]) / 2, op.y, 0], d = Math.max(op.x[1] - op.x[0], 2 * op.z) * 1.25 / Math.tan(17 * Math.PI / 180);
      if (!(x1 > x0 && z > 0)) continue;
      const cv = Render.carShot({ id, color: 0x2f6fd6, bg: 0xff00ff, blob: false, floor: false, grid: false, w: W, h: H, cam: { p: [T[0] - D[0] * d + (D[1] === -1 ? 0.001 : 0), T[1] - D[1] * d, T[2] - D[2] * d], t: T, fov: 34 },
        mark: [[x0, op.y, -z], [x1, op.y, -z], [x1, op.y, z], [x0, op.y, z]] });
      const px = cv.getContext('2d').getImageData(0, 0, W, H).data, Q = cv.marks, sgn = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      let inside = 0, mag = 0;
      for (let py = Math.max(0, Math.floor(Math.min(...Q.map(q => q[1])))); py <= Math.min(H - 1, Math.ceil(Math.max(...Q.map(q => q[1])))); py++)
        for (let pxx = Math.max(0, Math.floor(Math.min(...Q.map(q => q[0])))); pxx <= Math.min(W - 1, Math.ceil(Math.max(...Q.map(q => q[0])))); pxx++) {
          const p = [pxx + 0.5, py + 0.5], sd = [0, 1, 2, 3].map(i => sgn(Q[i], Q[(i + 1) % 4], p)); if (!(sd.every(v => v >= 0) || sd.every(v => v <= 0))) continue;
          inside++; const o = (py * W + pxx) * 4; if (px[o] > 190 && px[o + 1] < 80 && px[o + 2] > 190) mag++; }
      if (mag || inside < 50) bad.push(`opening ${k} from ${what}: ${mag} of ${inside} pixels the background`);
    }
    return { id, n: (I.openings || []).length, bad };
  }), looks);
  const opened = OPEN.filter(r => r.n);
  T.check(`no seeing through an open top: each opening of a look (Render.kitInfo(id).openings) from above, behind, the front and the side (55 degrees) on a flat background, nothing of it inside (${opened.length} of ${OPEN.length} looks open)`,
    OPEN.length === looks.length && OPEN.every(r => !r.bad.length), (OPEN.some(r => r.bad.length) ? OPEN.filter(r => r.bad.length).map(r => r.id + ': ' + r.bad.slice(0, 3).join(', ')) : opened.map(r => r.id + ' ' + r.n)).slice(0, 4).join(' | ') || 'no open top among the looks yet');
  // ---- 3d. the car's own colours off the glass: every vehicle in every player's and rival's colour, stripe on and off (a shade of a dark paint
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
      // the driver sees out: no pane of glass of the outer shell ahead of the eyes (within 70 degrees of straight ahead) faces them (the
      // glass is an opaque colour: a pane turned to the driver, a K.plate or K.box of glass, is a dark wall from the seat)
      const eye = [E.body.eye.x * M.len / E.body.len, E.body.eye.y, 0], pa0 = geo.attributes.position.array; let wall = 0;
      for (let t = 0; t < U.outerN / 3; t++) { const o = t * 9; if (!FL.GL.some(G => Math.abs(col[o] - G[0]) < 1e-6 && Math.abs(col[o + 1] - G[1]) < 1e-6 && Math.abs(col[o + 2] - G[2]) < 1e-6)) continue;
        const A = [pa0[o], pa0[o + 1], pa0[o + 2]], B = [pa0[o + 3], pa0[o + 4], pa0[o + 5]], Cc = [pa0[o + 6], pa0[o + 7], pa0[o + 8]], c = [0, 1, 2].map(i => (A[i] + B[i] + Cc[i]) / 3), d = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]], dl = Math.hypot(...d);
        if (!(d[0] > 0.05 && d[0] / dl > Math.cos(70 * Math.PI / 180))) continue;
        const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]], nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        if (nn[0] * d[0] + nn[1] * d[1] + nn[2] * d[2] < 0) wall++; }   // (its face turned to the eyes: drawn from the seat)
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
      // and the inner block's front only (U.engN: the engine bay a lost bonnet bares; no lining or cabin round the seat); the part back (a
      // test's shortcut): the outer shell again (the player's view as it is now: a rival swapped in and out above rebuilt the views)
      const gP = Render.viewOf(P).body.geometry, UP = gP.userData, PT = Core.partsOf(M), lose = Object.keys(PT).find(k => PT[k].wh == null), dr = () => gP.drawRange.count;
      P.lost[lose] = true; Render.frame(0, 1, P, 'chase', { noFx: true }); const drC = dr(); Render.frame(0, 1, P, 'cockpit', { noFx: true }); const drK = dr();
      Render.frame(0, 1, P, 'chase', { noFx: true }); const drC2 = dr(); delete P.lost[lose]; Render.frame(0, 1, P, 'chase', { noFx: true });
      const ckN = UP.outerN + (UP.engN || 0), lod = { lose, ok: drC === UP.N && drK === ckN && drC2 === UP.N && dr() === UP.outerN, got: [drC, drK, drC2, dr()], want: [UP.N, ckN] };
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
      return { id, pc, ac, why, crew, outer, keys: [...new Set(keys)], near, nearC, num, wall, aiW, st, ck: ck && { open: ck.open, formula: ck.formula }, ckOk, lod, cr, ndMoved, crushOk, swapped: !!swapped, fieldN: R.cars.length - 1 };
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
  T.check('a part lost: the chase camera draws the whole buffer (the lining, the cabin behind the hole), the cockpit the outer shell and the engine bay ahead of the windscreen (U.engN) only',
    R4.every(r => r.lod.ok), R4.filter(r => !r.lod.ok).concat(R4).slice(0, 4).map(r => `${r.id} (${r.lod.lose} off): chase / cockpit / chase / back ${r.lod.got.join(' / ')} of ${r.lod.want.join(' / ')}`).join(' | '));
  T.check('a crushed roof: nothing moves outside the roof\'s footprint (body.crush), a noCrush range only whole, the lining with its shell (each point by its twin), the cabin and floor stay; dents never move a noDent range',
    R4.every(r => r.crushOk), R4.filter(r => !r.crushOk).concat(R4.filter(r => r.cr.nc || r.cr.moved)).slice(0, 4).map(r => `${r.id}: ${r.cr.moved} moved, ${r.cr.outside} outside, noCrush ${r.cr.nc} (spread ${r.cr.spread.toFixed(4)}), lining off ${r.cr.lining}, stray ${r.cr.stray}, noDent moved ${r.ndMoved}`).join(' | '));
  T.check('the driver sees out: no pane of glass ahead of the eyes faces them (an opaque two-sided pane would be a wall from the seat)', R4.every(r => r.wall === 0), R4.filter(r => r.wall).slice(0, 4).map(r => `${r.id}: ${r.wall} glass triangles facing the eyes`).join(' | '));
  T.check('the cockpit by the look\'s eye style (closed: the roof and pillars; open / kart / formula: Render.cockpit.open; kart / formula: the formula\'s wheel)', R4.every(r => r.ckOk),
    R4.filter(r => !r.ckOk).concat(R4.filter(r => r.st !== 'closed')).slice(0, 5).map(r => `${r.id} ${r.st} ${JSON.stringify(r.ck)}`).join(', '));
  T.check('the materials the graphics test expects: the bodies \'dirtyCarCg\', any paint \'carCg\' (player and rival)', R4.every(r => r.keys.length && r.keys.every(k => k === 'body:dirtyCarCg' || k === 'paint:carCg')),
    R4.filter(r => !r.keys.length || r.keys.some(k => k !== 'body:dirtyCarCg' && k !== 'paint:carCg')).slice(0, 3).map(r => r.id + ' ' + r.keys.join(',')).join(' | '));
  T.check('no colour that is not glass within 0.06 of a glass colour (the paint and the stripe aside)', R4.every(r => !r.near), R4.filter(r => r.near).slice(0, 3).map(r => `${r.id}: ${r.near} vertices, e.g. ${r.nearC.map(c => c.toFixed(3))}`).join(' | '));
  T.check('the start number lit on every K.number panel (as many bars as the car\'s number has)', R4.every(r => r.num !== false), lim(r => r.num === false) || R4.filter(r => r.num).map(r => r.id).join(', '));

  // ---- 4b. the wreck (stage B2), each vehicle as the player on Bakreni gozd (the pit crew knows the car), paused and stepped: a part hanging
  //          loose first (its zone at 65 % of its threshold: its ranges turned rigidly, the inner block drawn), the rear bumper and the
  //          front left wheel off alone (a tail lamp on the body stays lit; that corner down, nothing of the shell in the road), then
  //          Core.wreckCar, one step (the core throws the pieces), a frame: every lost part's ranges collapsed to one point, the whole buffer
  //          drawn; each piece a mesh of its own (a body part: its own geometry, as many vertices as its ranges, a real volume, its own copy
  //          of the car's body material, its char kept as it came off while the car's goes on; a wheel: the model's wheel);
  //          each part's range centroid within 0.35 m of where the core throws its piece from; the panes without the lost parts' glass; the
  //          lamps out (the head lenses dark, the tail mesh's sides collapsed); the wheels hidden, the body down on its corners; 60 frames on
  //          (the pit crew at work round the car each frame): the wheels stay hidden, no new burst of bits; the car limping through a corner
  //          on its hubs, then the marshals' refit (wreck.fix): the wheels back, the body up, no offset left; a repair: the car built afresh,
  //          its pieces on the road still drawn; the materials' program keys ----
  const R5 = [], t5 = Date.now();
  await page.setViewportSize({ width: 320, height: 180 });   // (a small picture: the 60 frames a vehicle draws cost little; what is checked does not depend on it)
  for (const m of kits) {
    const r = await page.evaluate((id) => {
      const g = window.__game, M = Core.MODELS.find(q => q.id === id), PT = Core.partsOf(M), LO = [0.22, 0.23, 0.25];
      let seed = 991; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.S.car = Core.MODELS.indexOf(M); g.onAction('restart'); g.pause();
      // (the frames draw only the lights, the cars and what is added meanwhile (the pieces): the world hidden, every frame cheap; what is
      // checked here is the car's own state, the same either way)
      const S = Render.scene, saved = S.children.map(o => [o, o.visible]); for (const o of S.children) o.visible = !!o.isLight;
      const R = g.race, P = R.player, F = (n) => { for (let i = 0; i < n; i++) { g.sim(1 / 60, true); Render.frame(1 / 60, 1, P, 'chase', { noFx: true }); } };
      F(2); let v = Render.viewOf(P); v.grp.visible = true;
      const geo = v.body.geometry, U = geo.userData, pa = geo.attributes.position.array, E = Render.kitInfo(id);
      // the static rule: each part's range centroid near the core's spawn point (lx, lz of the half length / width, y)
      const far = []; for (const n in PT) { const p = PT[n], rc = E.ranges[n] && E.ranges[n].c; if (p.wh != null || !rc) continue; const d = Math.hypot(rc[0] - p.lx * M.len / 2, rc[1] - p.y, rc[2] - p.lz * M.wid / 2); if (d > 0.35) far.push(n + ' ' + d.toFixed(2) + ' m'); }
      // loose: the part with the biggest outer range, its zone at 65 % of its threshold
      const parts = Object.keys(U.ranges).filter(n => n !== 'body' && PT[n]), lp = parts.sort((a, b) => (U.ranges[b].o[1] - U.ranges[b].o[0]) - (U.ranges[a].o[1] - U.ranges[a].o[0]))[0], LR = U.ranges[lp];
      const P0 = Float32Array.from(pa); P.dz[PT[lp].z] = Math.max(P.dz[PT[lp].z], 0.65 * PT[lp].th); F(1);
      let lmx = 0, lrig = 0; const idx = []; for (const [s, e] of [LR.o, LR.i]) for (let i = s; i < e; i++) idx.push(i);
      for (const i of idx) lmx = Math.max(lmx, Math.hypot(pa[i * 3] - P0[i * 3], pa[i * 3 + 1] - P0[i * 3 + 1], pa[i * 3 + 2] - P0[i * 3 + 2]));
      for (let q = 0; q < 300; q++) { const i = idx[(q * 7919) % idx.length], j = idx[(q * 104729 + 17) % idx.length];
        lrig = Math.max(lrig, Math.abs(Math.hypot(P0[i * 3] - P0[j * 3], P0[i * 3 + 1] - P0[j * 3 + 1], P0[i * 3 + 2] - P0[j * 3 + 2]) - Math.hypot(pa[i * 3] - pa[j * 3], pa[i * 3 + 1] - pa[j * 3 + 1], pa[i * 3 + 2] - pa[j * 3 + 2]))); }
      const loose = { part: lp, ajar: !!(v.kit.ajar[lp] && !P.lost[lp]), moved: +lmx.toFixed(3), rigid: lrig < 1e-4, full: geo.drawRange.count === U.N };   // (full: the inner block shows through the gap)
      // the body's lowest point over the road (the car's frame, its sag applied: the live outer shell, not what it has lost) and its corners
      const hw = E.body.hw, X = [M.a, M.a, -M.b, -M.b], Z = [-hw, hw, -hw, hw], corner = () => X.map((x, k) => v.sagQ ? new THREE.Vector3(x, 0, Z[k]).applyQuaternion(v.sagQ).add(v.sagP).y : 0);
      const live = (f) => { const dv = v.kit.deadV, w = new THREE.Vector3(); let mn = 1e9; for (let i = 0; i < U.outerN; i++) { if (dv && dv[i]) continue; w.set(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]); if (f) w.applyQuaternion(v.sagQ).add(v.sagP); mn = Math.min(mn, w.y); } return mn; };
      // the rear bumper off alone (a tail lamp sits on the part of the shell's surface nearest it: kitInfo(id).tailHost; one on the body stays
      // lit) and the front left wheel off (one wheel: the body down on that corner, no point of its shell in the road), a step, a frame
      const tg1 = v.tail.geometry, tr1 = tg1.userData.tail || {}, tp1 = tg1.attributes.position.array, TH = E.tailHost || {};
      const lit = () => ['L', 'R'].filter(s => { const q = tr1[s]; if (q && q[1] > q[0]) for (let i = q[0]; i < q[1]; i++) if (tp1[i * 3] !== tp1[q[0] * 3] || tp1[i * 3 + 1] !== tp1[q[0] * 3 + 1] || tp1[i * 3 + 2] !== tp1[q[0] * 3 + 2]) return true; return false; });
      for (const n of ['bumperR', 'wheelFL']) if (PT[n] && !P.lost[n]) Core.detachPart(P, n, PT[n]);
      g.sim(1 / 120, true); Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      const keepLit = ['L', 'R'].filter(s => tr1[s] && tr1[s][1] > tr1[s][0] && TH[s] !== 'bumperR'), lit1 = lit();
      const one = { bumperR: !!PT.bumperR, host: TH, lit: lit1, keep: keepLit, tailOk: keepLit.every(s => lit1.includes(s)), wheel: !!(PT.wheelFL && v.wheelOff[0]), fl: corner()[0], low: v.sagQ ? live(true) : null };
      // the wreck: every part off (the wheels too: damage on), the pieces thrown at the next step, then drawn
      const f0 = Render.fxStats(); Core.wreckCar(P); g.sim(1 / 120, true); Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      const f1 = Render.fxStats(); v = Render.viewOf(P); const full = geo.drawRange.count === U.N;
      const lost = Object.keys(P.lost), dead = [], notOne = [], pieces = [], pkey = (o) => (o && o.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? o.customProgramCacheKey() : ''); let frozen = null;
      for (const n of lost) { const p = PT[n]; if (p.wh != null) continue; const Rr = U.ranges[n]; if (!v.kit.dead[n]) dead.push(n);
        const at = Rr.o[1] > Rr.o[0] ? Rr.o[0] : Rr.i[0]; for (const [s, e] of [Rr.o, Rr.i]) for (let i = s; i < e; i++) if (pa[i * 3] !== pa[at * 3] || pa[i * 3 + 1] !== pa[at * 3 + 1] || pa[i * 3 + 2] !== pa[at * 3 + 2]) { notOne.push(n); break; } }
      for (const d of R.debris.filter(q => q.car === P.id)) {
        const p = PT[d.part], ms = []; if (d.mesh && d.mesh.traverse) d.mesh.traverse(o => { if (o.isMesh) ms.push(o); });
        if (ms.length !== 1) { pieces.push(d.part + ': ' + ms.length + ' meshes'); continue; }
        const mm = ms[0], gg = mm.geometry; if (!gg.boundingBox) gg.computeBoundingBox();
        const bb = gg.boundingBox, vol = (bb.max.x - bb.min.x) * (bb.max.y - bb.min.y) * (bb.max.z - bb.min.z);
        if (p.wh != null) { const w = (p.wh < 2 ? v.wf : v.wr).find(q => Math.sign(q.position.z) === (p.wh % 2 ? 1 : -1)); if (!w || gg !== w.geometry) pieces.push(d.part + ': not the model\'s wheel'); continue; }
        const Rr = U.ranges[d.part], want = (Rr.o[1] - Rr.o[0]) + (Rr.i[1] - Rr.i[0]), mt = mm.material, own = mt !== v.body.material && !!(mt.userData && mt.userData.char) && pkey(mt) === pkey(v.body.material);
        if (gg.attributes.position.count !== want || !(vol > 1e-4) || !own || gg === geo) pieces.push(`${d.part}: ${gg.attributes.position.count}/${want} vertices, ${vol.toExponential(1)} m3, ${mt === v.body.material ? 'the car\'s own' : own ? 'its own' : 'another'} material`);
        if (own && !frozen) frozen = { m: mt, w0: mt.userData.char.value.w, c0: v.charU.value.w };   // (its char as it came off: the car's goes on)
      }
      const nPieces = R.debris.filter(q => q.car === P.id).length;
      // the glass of the lost parts out of the panes; the lamps out
      const deadT = (t) => lost.some(n => { const Rr = U.ranges[n]; return Rr && ((t * 3 >= Rr.o[0] && t * 3 < Rr.o[1]) || (t * 3 >= Rr.i[0] && t * 3 < Rr.i[1])); });
      const glassLeft = v.glassTris.reduce((s, G) => s + G.filter(deadT).length, 0), ca = geo.attributes.color.array;
      let lens = 0, lensBad = 0; for (const s of ['FL', 'FR']) for (const [a, b, host] of (U.lamps && U.lamps[s]) || []) if (!P.lost[host]) for (let i = a; i < b; i++) { lens++; if (Math.abs(ca[i * 3] - LO[0]) > 1e-4 || Math.abs(ca[i * 3 + 1] - LO[1]) > 1e-4 || Math.abs(ca[i * 3 + 2] - LO[2]) > 1e-4) lensBad++; }
      const tg = v.tail.geometry, tr = tg.userData.tail || {}, tp = tg.attributes.position.array; let tailLit = 0;
      for (const s of ['L', 'R']) { const q = tr[s]; if (q && q[1] > q[0]) for (let i = q[0]; i < q[1]; i++) if (tp[i * 3] !== tp[q[0] * 3] || tp[i * 3 + 1] !== tp[q[0] * 3 + 1] || tp[i * 3 + 2] !== tp[q[0] * 3 + 2]) { tailLit++; break; } }
      // the wheels hidden, the body down on its corners (the sag's turn and lift, v.sagQ / v.sagP, composed after the body's pose each frame:
      // the hubs' feet moved by it)
      const wl = P.wreck ? P.wreck.wl : 0, lowLive = live(false), hid0 = [...v.wf, ...v.wr].filter(w => !w.visible).length, cy0 = corner();
      const sag = { wl, hidden: hid0, corners: cy0.map(q => +q.toFixed(3)), want: -Math.min(0.6 * M.rw, Math.max(0, lowLive - 0.01)), low: v.sagQ ? live(true) : null, hubs: v.hubs.filter(hb => hb && hb.visible).length };   // (every wheel off: the body down by 0.6 rw, no lower than its lowest point 1 cm over the road)
      // 60 frames on (the pit crew round the car: crewWheel every frame): still hidden, no new burst
      const crew = !!(Render.crew && Render.crew.P === P);
      let shown = 0; for (let i = 0; i < 60; i++) { g.sim(1 / 60, true); Render.frame(1 / 60, 1, P, 'chase', { noFx: true }); shown = Math.max(shown, [...v.wf, ...v.wr].filter(w => w.visible).length - (4 - hid0)); }
      const f2 = Render.fxStats(); if (frozen) { frozen.w1 = frozen.m.userData.char.value.w; frozen.c1 = v.charU.value.w; }
      // the car limping through a corner on its hubs (the body's roll from c.w * c.speed, frames only), then the marshals' refit (what
      // Race.rescue does on a track without pits): the wheels back, the body up, back on its wheels (nothing of the sag's offset left)
      for (let i = 0; i < 30; i++) { P.w = 0.45; P.speed = 22; Render.frame(1 / 60, 1, P, 'chase', { noFx: true }); }
      const drift = Math.hypot(v.bodyG.position.x, v.bodyG.position.z); P.w = 0; P.speed = 0;
      if (P.wreck) { for (const n of ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR']) delete P.lost[n]; P.wreck.wl = 0; P.wreck.nL = 0; P.wreck.fix++; }
      Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      const refit = { shown: [...v.wf, ...v.wr].filter(w => w.visible).length, sagGone: !v.sagQ, hubs: v.hubs.filter(hb => hb && hb.visible).length, xz: Math.hypot(v.bodyG.position.x, v.bodyG.position.z), drift: +drift.toFixed(3) };
      // the materials (the player's view and its pieces)
      const keys = [], key = (o) => (o && o.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? o.customProgramCacheKey() : '');
      const mats = (root) => root.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material)) return; const mt = o.material;
        if (mt.userData && mt.userData.dirt) keys.push('body:' + key(mt)); else if (mt.isMeshPhongMaterial && mt.envMap && !mt.vertexColors && mt.reflectivity === 0.2) keys.push('paint:' + key(mt)); });
      mats(v.grp); for (const d of R.debris) if (d.car === P.id && d.mesh && d.mesh.traverse) mats(d.mesh);
      // a repair: the car built afresh (whole, every wheel on), its pieces on the road still drawn with their own geometry
      R.repairCar(P); Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      const nv = Render.viewOf(P), ng = nv.body.geometry, onRoad = R.debris.filter(q => q.car === P.id && q.mesh && q.mesh.parent).length;
      const rebuilt = nv !== v && ng.drawRange.count === ng.userData.outerN && !Object.keys(nv.kit.dead).length && [...nv.wf, ...nv.wr].every(w => w.visible) && !nv.sagQ;
      for (const [o, vis] of saved) o.visible = vis;
      return { id, far, loose, one, lost: lost.length, dead, notOne, pieces, nPieces, frozen: frozen && { w0: frozen.w0, w1: frozen.w1, c0: frozen.c0, c1: frozen.c1 }, full, glassLeft, lens, lensBad, tailLit, sag, crew, shown, burst: f1.total - f0.total, after: f2.total - f1.total,
        refit, keys: [...new Set(keys)], rebuilt, onRoad, rw: M.rw };
    }, m.id);
    R5.push(r);
  }
  await page.setViewportSize({ width: 844, height: 390 });
  console.log(`info the wrecks: ${((Date.now() - t5) / 1000).toFixed(0)} s for ${R5.length} vehicles`);
  T.check('each part\'s range centroid within 0.35 m of where the core throws its piece from (the part table\'s lx, lz, y)', R5.every(r => !r.far.length), R5.filter(r => r.far.length).slice(0, 4).map(r => r.id + ': ' + r.far.slice(0, 4).join(', ')).join(' | '));
  T.check('a part hanging loose (its zone at 65 % of its threshold): its ranges turned once, rigidly (the shell and its lining together), the inner block drawn (no gap into nothing)', R5.every(r => r.loose.ajar && r.loose.moved > 0.005 && r.loose.rigid && r.loose.full),
    R5.map(r => `${r.id} ${r.loose.part} ${r.loose.ajar ? 'loose' : 'not loose'} ${r.loose.moved} m${r.loose.rigid ? '' : ' NOT RIGID'}${r.loose.full ? '' : ' (inner block not drawn)'}`).slice(0, 6).join(', '));
  T.check('the rear bumper off alone: a tail lamp on the body (kitInfo tailHost: the part of the shell\'s surface nearest it) stays lit; the front left wheel off alone: that corner down, no point of the shell left on the car in the road (>= 7 mm over it)',
    R5.every(r => (!r.one.bumperR || r.one.tailOk) && (!r.one.wheel || (r.one.fl < -0.01 && r.one.low >= 0.007))),
    R5.map(r => `${r.id} tail ${r.one.host.L}/${r.one.host.R} lit ${r.one.lit.join('') || '-'} of ${r.one.keep.join('') || '-'}${r.one.wheel ? `, FL ${r.one.fl.toFixed(3)} lowest ${r.one.low.toFixed(3)}` : ''}`).slice(0, 6).join(' | '));
  T.check('Core.wreckCar: every lost part off the view (dead), its ranges collapsed to one point, the whole buffer drawn', R5.every(r => r.lost > 0 && !r.dead.length && !r.notOne.length && r.full),
    R5.map(r => `${r.id} ${r.lost} lost${r.dead.length ? ', not dead ' + r.dead.join(' ') : ''}${r.notOne.length ? ', not collapsed ' + r.notOne.join(' ') : ''}${r.full ? '' : ', not the whole buffer'}`).slice(0, 6).join(' | '));
  T.check('each piece on the road a mesh of its own: a body part\'s copy (its ranges\' vertex count, a real volume > 1e-4 m3, its own copy of the body\'s material: the same program, the char it came off with, kept while the car\'s goes on), a wheel the model\'s wheel',
    R5.every(r => r.nPieces === r.lost && !r.pieces.length && r.frozen && r.frozen.w1 === r.frozen.w0 && r.frozen.c1 > r.frozen.c0),
    R5.map(r => `${r.id} ${r.nPieces}/${r.lost} pieces${r.pieces.length ? ': ' + r.pieces.slice(0, 3).join('; ') : ''}${r.frozen ? `, char ${r.frozen.w0.toFixed(3)} -> ${r.frozen.w1.toFixed(3)} (the car's ${r.frozen.c0.toFixed(3)} -> ${r.frozen.c1.toFixed(3)})` : ', no piece of its own'}`).slice(0, 6).join(' | '));
  T.check('the lost parts\' glass out of the panes; the head lamps\' lenses dark, the tail lamps out', R5.every(r => !r.glassLeft && !r.lensBad && !r.tailLit),
    R5.map(r => `${r.id}: glass of lost parts ${r.glassLeft}, lens vertices ${r.lensBad} of ${r.lens} lit, tail sides lit ${r.tailLit}`).slice(0, 6).join(' | '));
  T.check('the wheels off: hidden, a bare hub at each, the body down on its corners (by 0.6 rw, no point of its shell lower than 1 cm over the road; give or take 2 cm)', R5.every(r => !r.sag.wl || (r.sag.hidden === 4 && r.sag.hubs === 4 &&
    r.sag.corners.every(q => Math.abs(q - r.sag.want) <= 0.02) && r.sag.low >= 0.007)),
    R5.map(r => `${r.id} wl ${r.sag.wl} hidden ${r.sag.hidden} hubs ${r.sag.hubs} corners ${r.sag.corners.join(' ')} (want ${r.sag.want.toFixed(3)}, lowest ${r.sag.low == null ? '-' : r.sag.low.toFixed(3)})`).slice(0, 6).join(' | '));
  T.check('60 frames on with the pit crew round the car (Bakreni gozd): the lost wheels stay hidden, the bits came once (no new burst)', R5.every(r => r.crew && !r.shown && r.after <= 40 && r.burst > 0),
    R5.map(r => `${r.id} crew ${r.crew}, shown ${r.shown}, bits ${r.burst} then ${r.after}`).slice(0, 6).join(', '));
  T.check('the marshals\' refit (wreck.fix): the wheels back on, the body up, no bare hubs, nothing of the sag\'s offset left (it limped through a corner on its hubs first)', R5.every(r => !r.sag.wl || (r.refit.shown === 4 && r.refit.sagGone && !r.refit.hubs && r.refit.xz < 1e-9)), R5.map(r => r.id + ' ' + JSON.stringify(r.refit)).slice(0, 4).join(', '));
  T.check('a repair: the car built afresh (whole, its outer shell, every wheel on), its pieces on the road still drawn', R5.every(r => r.rebuilt && r.onRoad === r.nPieces), R5.map(r => `${r.id} rebuilt ${r.rebuilt}, ${r.onRoad}/${r.nPieces} pieces drawn`).slice(0, 6).join(', '));
  T.check('the wreck\'s materials keep their program keys (the body and its pieces \'dirtyCarCg\', any paint \'carCg\')', R5.every(r => r.keys.length && r.keys.every(k => k === 'body:dirtyCarCg' || k === 'paint:carCg')), R5.filter(r => !r.keys.length || r.keys.some(k => k !== 'body:dirtyCarCg' && k !== 'paint:carCg')).slice(0, 3).map(r => r.id + ' ' + r.keys.join(',')).join(' | ') || R5.map(r => r.id + ' ' + r.keys.join(',')).slice(0, 3).join(' | '));

  // ---- 4d. the wreck as a player sees it (stage B2: pictures at 844x390, the chase camera at zoom 1.2), each vehicle (the 11 too: the wreck
  //          look is every vehicle's) as the player on Bakreni gozd, paused and stepped: the car whole, then Core.wreckCar and its fire
  //          burning (frames of 0.1 s drawn with their effects at a lower resolution: cheap). Only the cars, their pieces and the effects are
  //          drawn (the world hidden: the background the fog's flat colour, so what differs or darkens is the car's own). From the same
  //          camera (the chase camera's pose pinned) at least 35 % of the car's screen box (its body's box projected) looks different; its
  //          fire in sight (flame-coloured pixels the particles add round the car, against the same frame without them: its flames out of
  //          the body, not inside it) and its smoke (pixels there they darken); from the cockpit of a vehicle with a roof (crushed: roofDmg
  //          1, four steps) the upper middle of the view not dark (>= 60 %);
  //          the car and its pieces drawn with at most the whole car's draw calls + 2 a piece + 1 a crack decal; what its pieces cost (the
  //          field under a wreck, section 5) ----
  const R6 = [], t7 = Date.now(), seen = kits.concat(models.filter(m => !m.kit));
  await page.evaluate((on) => { window.__pics = on; Render.setDynScale(0.55); }, !!process.env.FLEET_PICS);   // (the frames between the pictures: a third of the pixels; Render.snapshot draws at full size)
  for (const m of seen) {
    const r = await page.evaluate((id) => {
      const g = window.__game, M = Core.MODELS.find(q => q.id === id), FL = window.__fl;
      let seed = 5150; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.S.car = Core.MODELS.indexOf(M); g.onAction('restart'); g.pause();
      const R = g.race, P = R.player, S = Render.scene, world = S.children.filter(o => !o.isLight && !o.isPoints && !R.cars.some(c => Render.viewOf(c) && Render.viewOf(c).grp === o));
      const vis0 = world.map(o => o.visible); for (const o of world) o.visible = false;   // (the world hidden throughout; the cars, their pieces, the effects (points) drawn)
      const run = (n, mode, fx) => { for (let i = 0; i < n; i++) { g.sim(0.1, true); Render.frame(0.1, 1, P, mode, fx ? {} : { noFx: true }); } };
      const keep = window.__pics ? {} : null, pic = (mode, name) => { const c = Render.snapshot(P, mode, 844); if (keep) keep[name] = c.toDataURL('image/png'); return { w: c.width, h: c.height, d: c.getContext('2d').getImageData(0, 0, c.width, c.height).data }; };
      // the chase camera settles behind the car, then its pose is pinned (a shot of the same place, view and fog) for both pictures
      Render.resetCam(); run(4, 'chase', false);
      const C = Render.camera, cd = new THREE.Vector3(); C.getWorldDirection(cd); const vd = Render.cam.vd || 10;
      const shot = { px: C.position.x, py: C.position.y, pz: C.position.z, tx: C.position.x + cd.x * vd, ty: C.position.y + cd.y * vd, tz: C.position.z + cd.z * vd, fov: C.fov, fogD: vd, near: C.near };
      Render.setShot(shot); let v = Render.viewOf(P); const A = pic('chase', 'whole');
      // the car's screen box: its body's box (the car's frame) projected; round it (as high again over it, half under it, a quarter to each
      // side: where its flames and its smoke rise, towards the camera too)
      const g0 = v.body.geometry; if (!g0.boundingBox) g0.computeBoundingBox(); const bb = { min: g0.boundingBox.min.toArray(), max: g0.boundingBox.max.toArray() };
      v.grp.updateMatrixWorld(true); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const X of [bb.min[0], bb.max[0]]) for (const Y of [bb.min[1], bb.max[1]]) for (const Z of [bb.min[2], bb.max[2]]) {
        const p = new THREE.Vector3(X, Y, Z).applyMatrix4(v.grp.matrixWorld).project(Render.camera), px = (p.x * 0.5 + 0.5) * A.w, py = (0.5 - p.y * 0.5) * A.h;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      const box = [Math.max(0, Math.floor(x0)), Math.min(A.w - 1, Math.ceil(x1)), Math.max(0, Math.floor(y0)), Math.min(A.h - 1, Math.ceil(y1))];
      const hb = box[3] - box[2], wb = box[1] - box[0], over = [Math.max(0, box[0] - Math.round(wb * 0.25)), Math.min(A.w - 1, box[1] + Math.round(wb * 0.25)), Math.max(0, box[2] - hb), Math.min(A.h - 1, box[3] + Math.round(hb * 0.5))];
      const intact = FL.costOf(v, P), f0 = Render.fxStats();
      // the cockpit's view: the upper middle's share not dark (the car whole; then wrecked, burning: the driver's own smoke faint), then the
      // wreck from the chase camera, pinned as before
      const upOf = (K) => { let up = 0, upN = 0; for (let y = Math.round(K.h * 0.16); y < Math.round(K.h * 0.45); y += 2) for (let x = Math.round(K.w * 0.3); x < Math.round(K.w * 0.7); x += 2) {
        const o = (y * K.w + x) * 4; upN++; if (0.299 * K.d[o] + 0.587 * K.d[o + 1] + 0.114 * K.d[o + 2] > 50) up++; } return upN ? up / upN : 0; };
      Render.setShot(null); run(2, 'cockpit', false); const up0 = upOf(pic('cockpit', 'cockpit0'));
      Core.wreckCar(P); run(6, 'cockpit', true); const up = upOf(pic('cockpit', 'cockpit'));
      // the wreck from the chase camera, then the same frame without the particles (the flames, the smoke, the bits: what they add is what
      // shows of them, not what burns inside the body)
      Render.setShot(shot); run(6, 'chase', true); v = Render.viewOf(P); const B = pic('chase', 'wreck'), f1 = Render.fxStats();
      const pts = S.children.filter(o => o.isPoints && o.visible); for (const o of pts) o.visible = false; const B0 = pic('chase', 'nofx'); for (const o of pts) o.visible = true;
      let diff = 0, n = 0; for (let y = box[2]; y <= box[3]; y++) for (let x = box[0]; x <= box[1]; x++) { const o = (y * A.w + x) * 4; n++; if (Math.abs(A.d[o] - B.d[o]) + Math.abs(A.d[o + 1] - B.d[o + 1]) + Math.abs(A.d[o + 2] - B.d[o + 2]) > 60) diff++; }
      // the fire in sight: flame-coloured pixels (bright, orange to yellow) that the particles add round the car (its box and the box over
      // it); the smoke: pixels there they darken (black smoke against the fog, the car)
      const flame = (D, o) => D[o] >= 200 && D[o] - D[o + 2] >= 100 && D[o + 1] >= 60, lum = (D, o) => 0.299 * D[o] + 0.587 * D[o + 1] + 0.114 * D[o + 2];
      let fireV = 0, smokeV = 0; for (let y = over[2]; y <= over[3]; y++) for (let x = over[0]; x <= over[1]; x++) { const o = (y * A.w + x) * 4;
        if (flame(B.d, o) && !flame(B0.d, o)) fireV++; if (lum(B0.d, o) - lum(B.d, o) > 25) smokeV++; }
      // the draw calls: the car and its pieces against the car whole; its pieces alone
      const mine = R.debris.filter(d => d.car === P.id && d.mesh && d.mesh.isObject3D).map(d => d.mesh), cracks = v.crack.filter(q => q && q.visible).length;
      const cost = (keep) => { const e = FL.frameWith([], P), c2 = FL.frameWith(keep, P); return { calls: c2[0] - e[0], verts: c2[1] - e[1] }; };
      const wk = cost([v.grp, ...mine]), pcs = cost(mine);
      Render.setShot(null); world.forEach((o, i) => { o.visible = vis0[i]; });
      return { id, kit: !!M.kit, box, diff: n ? diff / n : 0, px: n, fire: !!v.fire, flames: f1.sparks - f0.sparks, smoke: f1.total - f0.total, fireV, smokeV, up, up0, roof: v.roofStep, crush: !!v.crushF, intact, wk, pcs, n: mine.length, cracks, pics: keep };
    }, m.id);
    if (r.pics) { const dir = path.join(REPO, 'test-results', 'fleet-wreck'); fs.mkdirSync(dir, { recursive: true });   // (FLEET_PICS=1: the pictures, to look at)
      for (const k in r.pics) fs.writeFileSync(path.join(dir, `${r.id}-${k}.png`), Buffer.from(r.pics[k].split(',')[1], 'base64')); delete r.pics; }
    R6.push(r);
  }
  // ---- 4e. a field on fire (stage B2's caps): every car of a race wrecked where it stands (the field held still: no contact sparks, no
  //          dust), burning: at most 6 emit (the nearest to the camera), each at most 40 flames (sparks) and 12 smoke particles a second ----
  const FI = await page.evaluate((id) => {
    const g = window.__game; let seed = 2024; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.S.car = Core.MODELS.findIndex(m => m.id === id); g.onAction('restart'); g.pause();
    const R = g.race, P = R.player, step = (n) => { for (let i = 0; i < n; i++) { for (let j = 0; j < 12; j++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } R.step(1 / 120); } Render.frame(0.1, 1, P, 'chase', {}); } };
    step(2); for (const c of R.cars) Core.wreckCar(c);
    step(20);   // (2 s: the bits of the wrecks over, every fire up)
    const f0 = Render.fxStats(); step(10); const f1 = Render.fxStats();
    const V = R.cars.map(c => Render.viewOf(c)).filter(Boolean), burning = V.filter(v => v.fire), emit = V.filter(v => v.fireEmit), cp = Render.camera.position, d = (v) => Math.hypot(v.car.x - cp.x, v.car.z - cp.z);
    const far = Math.max(0, ...emit.map(d)), next = Math.min(1e9, ...burning.filter(v => !v.fireEmit).map(d));   // (the farthest that emits no farther than the nearest that does not)
    return { cars: R.cars.length, burning: burning.length, emit: emit.length, nearest: far <= next + 0.5, far: +far.toFixed(1), next: +Math.min(next, 999).toFixed(1), sparks: f1.sparks - f0.sparks, smoke: f1.total - f0.total };
  }, kits.length ? kits[0].id : 'kaze');
  await page.evaluate(() => Render.setDynScale(1));
  console.log(`info the wrecks as seen: ${((Date.now() - t7) / 1000).toFixed(0)} s for ${R6.length} vehicles (${R6.filter(r => !r.kit).length} of the 11); fire / smoke pixels in sight: ` + R6.map(r => `${r.id} ${r.fireV}/${r.smokeV}`).join(', '));
  T.check('a field on fire (every car wrecked where it stands): at most 6 emit, the nearest to the camera, each at most 40 flames and 12 smoke particles a second',
    FI.burning === FI.cars && FI.emit === Math.min(6, FI.burning) && FI.nearest && FI.sparks > 0 && FI.sparks <= 40 * FI.emit && FI.smoke > 0 && FI.smoke <= 12 * FI.emit, JSON.stringify(FI));
  const seenOk = (r) => r.diff >= 0.35 && r.fire && r.flames > 0 && r.smoke > 0 && r.fireV >= 12 && r.smokeV >= 12;
  T.check('the wreck as a player sees it (844x390, the chase camera at zoom 1.2): at least 35 % of the car\'s screen box different from the car whole, its fire (flames out of the body) and smoke in sight',
    R6.length === seen.length && R6.every(seenOk),
    R6.filter(r => !seenOk(r)).concat(R6.slice().sort((a, b) => a.diff - b.diff)).slice(0, 6).map(r => `${r.id} ${(r.diff * 100).toFixed(0)} % of ${r.px} px, fire / smoke ${r.fireV} / ${r.smokeV} px${r.fire ? '' : ' NO FIRE'}${r.flames > 0 ? '' : ' no flames'}${r.smoke > 0 ? '' : ' no smoke'}`).join(', '));
  // (a vehicle without a roof to crush (Render's crushOf: none, v.crushF null: a kart, the formula) is not blacked out by one: its own soot
  // on what the driver sees of it (the formula's halo) is the wreck's)
  const ckOk = (r) => r.roof === 4 && (r.up >= 0.6 || !r.crush);
  T.check('the cockpit of the wreck (its roof crushed, four steps) not blacked out: >= 60 % of the view\'s upper middle not dark (a vehicle with a roof to crush)', R6.every(ckOk),
    R6.filter(r => !ckOk(r)).concat(R6.slice().sort((a, b) => a.up - b.up)).slice(0, 6).map(r => `${r.id} ${(r.up * 100).toFixed(0)} % (whole ${(r.up0 * 100).toFixed(0)} %, roof ${r.roof}${r.crush ? '' : ', none to crush'})`).join(', '));
  T.check('the wreck\'s draw calls: the car and its pieces <= the car whole + 2 a piece + 1 a crack decal', R6.every(r => r.wk.calls <= r.intact.calls + 2 * r.n + r.cracks),
    R6.filter(r => r.wk.calls > r.intact.calls + 2 * r.n + r.cracks).concat(R6).slice(0, 5).map(r => `${r.id} ${r.wk.calls} <= ${r.intact.calls} + 2 x ${r.n} + ${r.cracks}`).join(', '));

  // ---- 4c. the run from the police (Vršič, Policija): a patrol car wrecked: its pieces on the road drawn (syncDebris finds the patrol cars'
  //          views), the car on fire, its light bar gone with its crushed roof (no blue flashes over a wreck); the patrol car gone: its view
  //          freed but for what its pieces still use; its pieces gone too: freed then ----
  const t6 = Date.now(), PO = await page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), mode = async (md) => { g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
      document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="' + md + '"]').click(); await wait(200); };
    await mode('police');
    g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic' && g.race.pol); k++) await wait(100);
    g.pause(); const R = g.race, P = R.player;
    for (let i = 0; i < 40 && !R.pol.cars.length; i++) g.sim(0.25, true);
    Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const pc = R.pol.cars[0], out = { cars: R.pol.cars.length };
    if (pc) {
      Core.wreckCar(pc); g.sim(1 / 120, true); Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      const mine = R.debris.filter(d => d.car === pc.id), drawn = mine.filter(d => d.mesh && d.mesh.isObject3D), freed = [], pv = Render.viewOf(pc);
      Object.assign(out, { fire: !!(pv && pv.fire), bar: pv && pv.polBar ? pv.polBar.visible : null, roof: pv ? pv.roofStep : null });
      for (const d of drawn) d.mesh.traverse(o => { if (o.geometry) o.geometry.addEventListener('dispose', () => freed.push('g')); if (o.material) o.material.addEventListener('dispose', () => freed.push('m')); });
      R.pol.cars.splice(R.pol.cars.indexOf(pc), 1); Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      Object.assign(out, { lost: Object.keys(pc.lost).length, pieces: mine.length, drawn: drawn.length, gone: !Render.viewOf(pc), freedAtGone: freed.length });
      for (const d of drawn) d.dead = true; Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
      out.freedAtDeath = freed.length - out.freedAtGone;
    }
    g.resume(); await mode('race');
    return out;
  });
  console.log(`info the run from the police: ${((Date.now() - t6) / 1000).toFixed(0)} s`);
  T.check('the run from the police: a wrecked patrol car\'s pieces drawn, the car on fire, its light bar gone; its view gone, what its pieces use kept; its pieces gone, freed',
    PO.cars > 0 && PO.lost > 0 && PO.pieces === PO.lost && PO.drawn === PO.pieces && PO.fire && PO.bar === false && PO.gone && PO.freedAtGone === 0 && PO.freedAtDeath > 0, JSON.stringify(PO));

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
    const W6 = new Map(R6.map(q => [q.id, q]));   // (a piece's cost, from the wreck of 4d: its pieces drawn alone over their count)
    const rows = est.map(r => {
      let calls = 0, verts = 0, allC = 0, allV = 0, wC = 0, wV = 0; const w6 = W6.get(r.id), pc = w6 && w6.n ? [w6.pcs.calls / w6.n, w6.pcs.verts / w6.n] : null;
      for (const q of B.s) {
        const nC = Math.min(r.n, (q.all[0] - q.base[0]) / B.unit[0]), nV = Math.min(r.n, (q.all[1] - q.base[1]) / B.unit[1]), bc = q.base[0] - B.pl.calls + r.pc.calls, bv = q.base[1] - B.pl.verts + r.pc.verts;
        calls = Math.max(calls, bc + nC * r.ac.calls); verts = Math.max(verts, bv + nV * r.ac.verts); allC = Math.max(allC, bc + r.n * r.ac.calls); allV = Math.max(allV, bv + r.n * r.ac.verts);
        if (pc) { wC = Math.max(wC, bc + nC * r.ac.calls + 40 * pc[0]); wV = Math.max(wV, bv + nV * r.ac.verts + 40 * pc[1]); }
      }
      return { id: r.id, n: r.n, calls: Math.round(calls), verts: Math.round(verts), allC, allV, pc, wC: Math.round(wC), wV: Math.round(wV) };
    });
    const bad = rows.filter(r => r.calls > maxC || r.verts > maxV), worst = rows.slice().sort((a, b) => b.verts / maxV - a.verts / maxV).slice(0, 3);
    const drawn = B.s.map(q => ((q.all[0] - q.base[0]) / B.unit[0]).toFixed(1)).join(' ');
    T.check(`${tid}: each vehicle's own field (fieldN capped) within the phone budget (calls <= ${Math.round(maxC)}, vertices <= ${Math.round(maxV / 1000)}k; the default race: ${Math.max(...B.s.map(q => q.all[0]))} calls, rivals drawn per sample ${drawn} of ${B.nAI})`,
      rows.length === fields.length && !bad.length, (bad.length ? bad : worst).slice(0, 4).map(r => `${r.id} x${r.n}: ${r.calls} calls, ${Math.round(r.verts / 1000)}k`).join(', '));
    console.log(`info ${tid}: every rival of the field drawn in full (the worst case): ` + rows.map(r => `${r.id} x${r.n} ${r.allC} / ${Math.round(r.allV / 1000)}k`).join(', '));
    if (tid === 'jezero') {   // the field under a wreck: the cap's 40 pieces on the road (all in view, each at its vehicle's own piece's cost: 4d)
      const wb = rows.filter(r => !r.pc || r.wC > maxC || r.wV > maxV), ww = rows.filter(r => r.pc).sort((a, b) => b.wV / maxV - a.wV / maxV).slice(0, 4);
      T.check(`jezero under a wreck: each vehicle's own field and 40 of its pieces on the road (all in view) within the phone budget (calls <= ${Math.round(maxC)}, vertices <= ${Math.round(maxV / 1000)}k)`,
        rows.length === fields.length && !wb.length, (wb.length ? wb : ww).slice(0, 4).map(r => `${r.id} x${r.n} + 40 pieces (${r.pc ? r.pc[0].toFixed(2) + ' calls, ' + (r.pc[1] / 1000).toFixed(2) + 'k a piece' : 'not measured'}): ${r.wC} calls, ${Math.round(r.wV / 1000)}k`).join(', '));
    }
  }

  T.check('no page errors, no warnings (but the place-holders\' fallback)', !errors.length && !warns.length, errors.concat(warns).slice(0, 5).join(' | '));
  console.log(`info ${kits.length} vehicles in ${((Date.now() - t0) / 1000).toFixed(0)} s; per vehicle (player / rival calls, kverts): ` + R4.map(r => `${r.id} ${r.pc.calls}/${r.ac.calls} ${(r.pc.verts / 1000).toFixed(1)}/${(r.ac.verts / 1000).toFixed(1)}`).join(', '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
