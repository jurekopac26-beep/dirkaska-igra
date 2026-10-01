// The render kit in Node (js/render.js in a sandbox with three.js; no browser, no WebGL): the KIT API's own rules, on test looks built
// through Render.kitTry on registered vehicles' models (nothing registered or cached changes):
//  - K.skin / K.sweep: every end cap faces away from its neighbour ring, along any axis (x, up, across, a slant, a bent sweep)
//  - an open top (a loft panel null): the roadster's cockpit and the pickup's bed closed from above, from behind, from the front and
//    from the side at 55 degrees (rays into kitInfo's openings meet a face of the outer shell turned to them: the lining, the floor,
//    the bulkheads, the rims, the wheel's housing; back faces are not drawn), its lining in the outer shell, a closed loft's (RAKETA's)
//    all in the inner block; the defaults an open top must override (eye, crush; the start number over the hole) fail the build, a
//    targa's default number lies on its roof, clear of the hole
//  - body.door in either order (the same doors); body.crush with its ends swapped or a negative z fails, { 0, 0, 0 } builds
//  - K.number: every digit's seven bars full length (the bars across the whole digit, the uprights to the middle bar's far edge)
//  - every registered vehicle (its look, or a place-holder's generic hatch): each part's range centroid within 0.35 m of where the core
//    throws its piece from (a lost part's copy lies where the part was: stage B2)
//   node tests/kit.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, ROOT } = require('./lib/core.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();

// js/world.js, the 206's data and js/render.js in one sandbox with three.js and the Core (the page's order); a window and a document
// only as far as loading them needs (no renderer: Render.init is never called)
function loadRender() {
  const THREE = require(path.join(ROOT, 'js/vendor/three.r128.min.js'));
  const ctx = { THREE, Core: loadCore(), console, Math, JSON, Date, Map, Set, WeakMap, Float32Array, Uint32Array, Uint8Array, Uint16Array, Int16Array, Int8Array, Int32Array, Array, Object, Number, String, Error, isFinite, parseFloat, parseInt,
    atob: (b) => Buffer.from(b, 'base64').toString('binary'), performance: { now: () => 0 }, requestAnimationFrame() {},
    window: { innerWidth: 800, innerHeight: 450, addEventListener() {} }, document: { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const [f, name] of [['js/world.js', 'World'], ['js/data/p206.js', 'P206_MODEL'], ['js/render.js', 'Render']]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + `\n;globalThis.${name} = ${name};`, ctx, { filename: f });
  return ctx;
}
const warn = console.warn; console.warn = () => { };   // (the place-holders' fallback warnings when their bodies register)
const X = loadRender(), R = X.Render, Core = X.Core;
console.warn = warn;
const tryLook = (id, look) => R.kitTry(id, look);
const KIT_LINE = [0.16, 0.15, 0.14];
const tris = (geo, a, b) => { const p = geo.attributes.position.array, out = []; for (let t = a / 3; t < b / 3; t++) { const o = t * 9; out.push([[p[o], p[o + 1], p[o + 2]], [p[o + 3], p[o + 4], p[o + 5]], [p[o + 6], p[o + 7], p[o + 8]]]); } return out; };
const nrm = ([A, B, C]) => { const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const isLine = (geo, t) => { const c = geo.attributes.color.array, o = t * 9; return Math.abs(c[o] - KIT_LINE[0]) < 1e-4 && Math.abs(c[o + 1] - KIT_LINE[1]) < 1e-4 && Math.abs(c[o + 2] - KIT_LINE[2]) < 1e-4; };

// ---- 1. K.skin / K.sweep end caps along any axis (one primitive alone in 'body' of a vehicle without a loft: MRAVLJA's model) ----
{
  const bare = (fn) => ({ body: { eye: { x: 0, y: 1, style: 'open' }, decalX: 0, decalY: 1 }, wheels: { style: 'kart' }, regions: 'none',
    build(K) { K.part('body', () => fn(K)); for (const p of K.parts) K.part(p, () => K.box(0, 0.3, 0, 0.1, 0.1, 0.1, 0, K.black)); } });
  const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3) * 0.06, Math.sin(i * Math.PI / 3) * 0.06]);
  const around = (c, u, v) => hex.map(([a, b]) => [c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b]);   // (a ring round c in the plane of u, v)
  const s3 = 1 / Math.sqrt(3), s2 = 1 / Math.sqrt(2);
  const cases = [
    ['a skin along x', (K) => K.skin([-0.3, 0, 0.3].map(x => around([x, 0.6, 0.2], [0, 1, 0], [0, 0, 1])), K.dark, K.dark, K.dark)],
    ['a skin up y (a stack, a pod)', (K) => K.skin([0.5, 0.7, 0.9].map(y => around([0.1, y, -0.3], [1, 0, 0], [0, 0, 1])), K.dark, K.dark, K.dark)],
    ['a skin down y', (K) => K.skin([0.9, 0.7, 0.5].map(y => around([0.1, y, -0.3], [1, 0, 0], [0, 0, 1])), K.dark, K.dark, K.dark)],
    ['a skin across z (a wing\'s profile)', (K) => K.skin([-0.5, 0, 0.5].map(z => around([-0.6, 0.8, z], [1, 0, 0], [0, 1, 0])), K.dark, K.dark, K.dark)],
    ['a skin on a slant', (K) => K.skin([0, 1, 2].map(k => around([0.2 * k * s3, 0.5 + 0.2 * k * s3, 0.2 * k * s3], [s2, -s2, 0], [s3 / s2 * 0.5, s3 / s2 * 0.5, -s3 / s2])), K.dark, K.dark, K.dark)],
    ['a sweep along x, up y, across z (a snorkel, an exhaust)', (K) => K.sweep(hex, [[-0.4, 0.4, 0.3], [0, 0.4, 0.3], [0.1, 0.5, 0.3], [0.1, 0.9, 0.3], [0.1, 1.0, 0.2], [0.1, 1.0, -0.2]], K.dark, { capA: K.dark, capB: K.dark })],
  ];
  const rows = [];
  for (const [name, fn] of cases) {
    // the rings as given (look units = metres here: the look's len / wid are the vehicle's)
    let rings = null; const spy = { skin: null };
    const look = bare((K) => { const sk = K.skin; K.skin = (r, ...a) => { spy.skin = r; return sk(r, ...a); }; fn(K); K.skin = sk; });
    const res = tryLook('mravlja', look); if (res.status !== 'ok') { rows.push(name + ': ' + res.status); continue; }
    rings = spy.skin; const U = res.geo.userData, T = tris(res.geo, U.ranges.body.o[0], U.ranges.body.o[1]);
    const mid = (r) => r.reduce((m, p) => [m[0] + p[0] / r.length, m[1] + p[1] / r.length, m[2] + p[2] / r.length], [0, 0, 0]);
    const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-5;
    let caps = 0, wrong = 0;
    for (const [ring, nb] of [[rings[0], rings[1]], [rings[rings.length - 1], rings[rings.length - 2]]]) {
      const m = mid(ring), away = [m[0] - mid(nb)[0], m[1] - mid(nb)[1], m[2] - mid(nb)[2]], pts = ring.concat([m]);
      for (const t of T) if (t.every(p => pts.some(q => near(p, q)))) { caps++; if (dot(nrm(t), away) <= 0) wrong++; }
    }
    if (caps !== 2 * hex.length || wrong) rows.push(`${name}: ${wrong} of ${caps} cap triangles facing in`);
    res.geo.dispose();
  }
  check('K.skin / K.sweep: each end cap faces away from its neighbour ring, along any axis (x, up, down, across, a slant, a bent sweep: 6 caps of 6 triangles each)', !rows.length, rows.join(' | '));
}

// ---- 2. an open top: a roadster (LISICA's model: the roof's segment open, a one-sided windscreen) and a pickup (GOZDAR's: the bed open
//         behind a closed cab, over the rear wheels, the tailgate the loft's rear cap) ----
const RS = [[-1.97, 0.78, 0.3, 0.66, 0.74, 0.74, 0.04, 'b', 0.12], [-1.55, 0.82, 0.26, 0.72, 0.78, 0.8, 0.05, 'b', 0.1], [-1.05, 0.83, 0.24, 0.74, 0.79, 0.82, 0.05, 'r', 0.1],
  [0.15, 0.83, 0.24, 0.74, 0.79, 0.82, 0.05, 'gf', 0.1], [0.25, 0.83, 0.24, 0.74, 0.79, 0.8, 0.05, 'b', 0.1], [1.4, 0.82, 0.26, 0.7, 0.78, 0.74, 0.04, 'b', 0.11], [1.97, 0.76, 0.3, 0.62, 0.72, 0.64, 0.02, 'b', 0.12]];
function roadster(o) {
  o = o || {};
  const body = Object.assign({ secs: RS, eye: { x: -0.45, y: 1.08, style: 'open' }, crush: { x0: -0.95, x1: 0.2, z: 0.62 }, decalX: 0.9, decalY: 0.79, decalRz: -0.05, decalS: 0.7 });
  for (const k of o.drop || []) delete body[k];
  return { body, wheels: { style: 'std', w: 0.2 },
    build(K) {
      const P = K.paint, B = K.black;
      K.loft(K.secs(K.body.secs), (k, e, kind, at) => e === 0 || e === 8 ? (at.arch ? B : K.shade(P, 0.6)) : kind === 'r' && e >= 3 && e <= 5 && (!o.targa || at.x > -0.45) ? null : P);
      K.face([[0.2, 0.84, 0.7], [0.2, 0.84, -0.7], [0.0, 1.12, -0.62], [0.0, 1.12, 0.62]], K.GLASS, { part: 'body' });   // (the windscreen: one-sided, facing forward)
      for (const sd of [-1, 1]) { K.headLamp(1.95, 0.5, sd * 0.6, 0.07); K.tailLamp(-1.96, 0.6, sd * 0.6, 0.25, 0.1); K.mirror(0.25, 0.9, sd * 0.86, { col: B }); K.seat(-0.45, 0.42, sd * 0.36); }
      K.part('bumperF', () => K.box(1.95, 0.28, 0, 0.06, 0.16, 1.5, 0, B)); K.part('bumperR', () => K.box(-1.95, 0.28, 0, 0.06, 0.16, 1.5, 0, B));
    } };
}
const PU = [[-2.45, 1.05, 0.55, 1.0, 1.04, 1.25, 0.0, 'b', 0.1], [-0.6, 1.05, 0.55, 1.0, 1.04, 1.25, 0.0, 'gr', 0.1], [-0.58, 1.05, 0.55, 1.0, 0.95, 1.72, 0.04, 'r', 0.1],
  [0.2, 1.05, 0.55, 1.0, 0.95, 1.75, 0.04, 'gf', 0.1], [0.75, 1.05, 0.55, 1.05, 1.0, 1.2, 0.03, 'b', 0.1], [2.45, 1.0, 0.6, 1.0, 0.95, 1.1, 0.02, 'b', 0.12]];
const pickup = { body: { secs: PU }, wheels: { style: 'knob', w: 0.32 },
  build(K) {
    const P = K.paint, G = K.GLASS;
    K.loft(K.secs(K.body.secs), (k, e, kind, at) => at.end ? P : e === 0 || e === 8 ? (at.arch ? K.black : K.dark) : kind === 'b' && at.x < -0.6 ? (e >= 3 && e <= 5 ? null : P)
      : kind === 'gr' ? (e >= 3 && e <= 5 ? G : P) : kind === 'r' ? (e === 2 || e === 6 ? G : P) : kind === 'gf' ? (e >= 2 && e <= 6 ? G : P) : P, { caps: { rear: { high: 'tailgate', low: 'bumperR' } } });
    for (const sd of [-1, 1]) { K.headLamp(2.46, 0.85, sd * 0.7, 0.08); K.tailLamp(-2.46, 1.0, sd * 0.85, 0.2, 0.25); K.mirror(0.7, 1.15, sd * 1.12, { col: K.black }); }
    K.part('wing', () => K.wingPlank(-2.3, 1.75, -1.9, 1.77, 0.03, -0.95, 0.95, K.black));
    K.part('bumperF', () => K.box(2.42, 0.45, 0, 0.12, 0.25, 1.9, 0, K.black)); K.part('bumperR', () => K.box(-2.42, 0.45, 0, 0.1, 0.2, 1.9, 0, K.black));
  } };
// rays into each opening (a 5 cm grid over it, 6 cm in from its edges, at its rim's height): each must meet a face of the outer shell
// turned to it (the outer block is what an intact car draws; a face turned away is culled)
function raysThrough(res) {
  const U = res.geo.userData, T = tris(res.geo, 0, U.outerN).map(t => [t, nrm(t)]), c = Math.cos(55 * Math.PI / 180), s = Math.sin(55 * Math.PI / 180), out = [];
  const meets = (O, D) => T.some(([[A, B, C], N]) => {
    if (dot(N, D) >= 0) return false;
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]], pv = [D[1] * e2[2] - D[2] * e2[1], D[2] * e2[0] - D[0] * e2[2], D[0] * e2[1] - D[1] * e2[0]], det = dot(e1, pv);
    if (Math.abs(det) < 1e-12) return false;
    const tv = [O[0] - A[0], O[1] - A[1], O[2] - A[2]], u = dot(tv, pv) / det; if (u < 0 || u > 1) return false;
    const qv = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]], v = dot(D, qv) / det; if (v < 0 || u + v > 1) return false;
    return dot(e2, qv) / det > 0; });
  for (const op of res.openings) for (const [name, D] of [['above', [0, -1, 0]], ['behind', [c, -s, 0]], ['the front', [-c, -s, 0]], ['the side', [0, -s, c]]]) {
    let all = 0, miss = 0;
    for (let x = op.x[0] + 0.06; x <= op.x[1] - 0.06 + 1e-9; x += 0.05) for (let z = -(op.z - 0.06); z <= op.z - 0.06 + 1e-9; z += 0.05) { all++; if (!meets([x - D[0] * 6, op.y - D[1] * 6, z - D[2] * 6], D)) miss++; }
    if (miss || !all) out.push(`${name} ${miss}/${all}`);
  }
  return out;
}
{
  const rows = [], info = [];
  for (const [name, id, look] of [['the roadster', 'lisica', roadster()], ['the targa', 'lisica', roadster({ targa: true })], ['the pickup', 'gozdar', pickup]]) {
    const res = tryLook(id, look); if (res.status !== 'ok') { rows.push(name + ': ' + res.status); continue; }
    const leak = raysThrough(res), U = res.geo.userData;
    let lineOut = 0; for (let t = 0; t < U.outerN / 3; t++) if (isLine(res.geo, t)) lineOut++;
    if (leak.length || !res.openings.length || !lineOut) rows.push(`${name}: ${res.openings.length} openings, rays through from ${leak.join(', ') || '-'}, ${lineOut} lining triangles in the outer shell`);
    info.push(`${name} ${res.openings.map(o => 'x ' + o.x.map(v => v.toFixed(2)).join('..')).join(' ')}: ${lineOut} lining triangles outer, ${U.tris.outer} / ${U.tris.inner}`);
    res.geo.dispose();
  }
  check('an open top is closed from above, behind, the front and the side (55 degrees): rays into its openings meet the lining, the floor, a bulkhead, a rim or the wheel\'s housing in the outer shell (a roadster\'s cockpit over the rear arch, a targa, a pickup\'s bed over the wheels)', !rows.length, rows.concat(info).join(' | '));
  const E = R.kitInfo('raketa'), G = R.kitTry('raketa', Core.MODELS.find(m => m.id === 'raketa').def.look), U = G.geo.userData;
  let lineOut = 0, lineIn = 0; for (let t = 0; t < U.N / 3; t++) if (isLine(G.geo, t)) { if (t < U.outerN / 3) lineOut++; else lineIn++; }
  check('a closed loft keeps its lining, floor and caps\' linings in the inner block (RAKETA: none of the lining\'s colour in its outer shell, no openings)', E.status === 'ok' && lineOut === 0 && lineIn > 100 && !E.openings.length && U.tris.outer === E.tris.outer,
    `${lineOut} outer / ${lineIn} inner lining triangles, openings ${E.openings.length}`);
  G.geo.dispose();
}
{
  const fail = (look, re) => { const r = tryLook('lisica', look); if (r.geo) r.geo.dispose(); return re.test(r.status) ? '' : r.status; };
  const rows = [fail(roadster({ drop: ['eye'] }), /^fallback:an open top.*body\.eye/), fail(roadster({ drop: ['crush'] }), /^fallback:an open top: give body\.crush/), fail(roadster({ drop: ['decalX', 'decalY', 'decalRz', 'decalS'] }), /^fallback:give body\.decalX \/ decalY/)];
  const tg = tryLook('lisica', roadster({ targa: true, drop: ['decalX', 'decalY', 'decalRz', 'decalS'] })), B = tg.body || {}, r = 0.41 * (B.decalS || 0), hole = (tg.openings || [])[0];
  const clear = tg.status === 'ok' && hole && B.decalX + r < hole.x[0] - 0.019 && B.decalX - r > -1.05 && B.decalY > 0.8;
  if (tg.geo) tg.geo.dispose();
  check('an open top must give what the defaults put under a roof: no eye, no crush, no start number (its roof all open) fail the build asking for them; a targa\'s default number lies on its roof, clear of the hole',
    rows.every(q => !q) && clear, rows.filter(Boolean).join(' | ') + ` targa: ${tg.status} decal x ${(+B.decalX).toFixed(2)} y ${(+B.decalY).toFixed(3)} S ${B.decalS}, the hole from x ${hole ? hole.x[0].toFixed(2) : '-'}`);
}

// ---- 3. body.door in either order, body.crush's ends ----
{
  const L0 = Core.MODELS.find(m => m.id === 'raketa').def.look, withBody = (b) => Object.assign({}, L0, { body: Object.assign({}, L0.body, b) });
  const a = tryLook('raketa', withBody({ door: [-0.67, 0.48] })), b = tryLook('raketa', withBody({ door: [0.48, -0.67] }));
  const same = a.status === 'ok' && b.status === 'ok' && JSON.stringify(a.geo.userData.ranges) === JSON.stringify(b.geo.userData.ranges) && a.geo.attributes.position.array.every((v, i) => v === b.geo.attributes.position.array[i]);
  const dl = a.geo ? (a.geo.userData.ranges.doorL.o[1] - a.geo.userData.ranges.doorL.o[0]) / 3 : 0;
  for (const r of [a, b]) if (r.geo) r.geo.dispose();
  check('body.door in either order: the same doors (RAKETA\'s [-0.67, 0.48] and [0.48, -0.67])', same && dl > 0, `${a.status} / ${b.status}, doorL ${dl} triangles`);
  const st = (crush) => { const r = tryLook('raketa', withBody({ crush })); if (r.geo) r.geo.dispose(); return r.status; };
  const s1 = st({ x0: 0.13, x1: -1.82, z: 0.77 }), s2 = st({ x0: -1.82, x1: 0.13, z: -0.77 }), s3 = st({ x0: 0, x1: 0, z: 0 }), s4 = st({ x0: -1.82, x1: 0.13, z: 0.77 });
  check('body.crush: its ends swapped or a negative z fail the build (naming body.crush); { x0: 0, x1: 0, z: 0 } (nothing crushes) and a footprint rear to front build',
    /^fallback:body\.crush/.test(s1) && /^fallback:body\.crush/.test(s2) && s3 === 'ok' && s4 === 'ok', [s1, s2, s3, s4].join(' | '));
}

// ---- 4. K.number: the seven bars of every digit full length (no half bars: no steps at the middle, a 4's strokes and a 5's top whole) ----
{
  const look = { body: { eye: { x: 0, y: 1, style: 'kart' }, decalX: 0, decalY: 1 }, wheels: { style: 'kart' }, regions: 'none',
    build(K) { K.part('body', () => K.number(0, 0.5, 0.3, 0.2, { dir: 'z', slant: 0 })); for (const p of K.parts) K.part(p, () => K.box(0, 0.3, 0, 0.1, 0.1, 0.1, 0, K.black)); } };
  const res = tryLook('mravlja', look), U = res.geo && res.geo.userData, rows = [];
  if (res.status !== 'ok' || !U.nums) rows.push(res.status);
  else {
    const p = res.geo.attributes.position.array, dh = 0.2 * 0.82, t = dh * 0.2, dw = dh * 0.6, h = dh / 2;
    const want = [[dw, h - t, h], [t, -t / 2, h], [t, -h, t / 2], [dw, -h, -h + t], [t, -h, t / 2], [t, -t / 2, h], [dw, -t / 2, t / 2]];   // a .. g: [width, v0, v1]
    U.nums[0].slots.forEach((sl, si) => sl.forEach((q, k) => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (let i = q[0]; i < q[1]; i++) { x0 = Math.min(x0, p[i * 3]); x1 = Math.max(x1, p[i * 3]); y0 = Math.min(y0, p[i * 3 + 1]); y1 = Math.max(y1, p[i * 3 + 1]); }
      const [w, v0, v1] = want[k]; if (Math.abs(x1 - x0 - w) > 1e-6 || Math.abs(y0 - 0.5 - v0) > 1e-6 || Math.abs(y1 - 0.5 - v1) > 1e-6) rows.push(`slot ${si} bar ${'abcdefg'[k]}: ${(x1 - x0).toFixed(4)} wide, ${(y0 - 0.5).toFixed(4)}..${(y1 - 0.5).toFixed(4)}`); }));
    res.geo.dispose();
  }
  check('K.number: every digit\'s bars full length (a, d, g the whole digit wide; b, c, e, f from their end to the middle bar\'s far edge), 3 places x 7 bars', !rows.length, rows.slice(0, 4).join(' | '));
}

// ---- 5. every registered vehicle (its look, or the generic hatch of a place-holder): each part's range has its centroid within 0.35 m of
//         where the core throws the part's piece from (the part table's lx, lz of the half length / width, y): a lost part's copy (stage B2)
//         lies where the part was. A look that puts a part elsewhere moves its table entry (parts.over / extra) ----
{
  const rows = [], w0 = console.warn; let worst = ['', 0], n0 = 0;
  console.warn = () => { };   // (the place-holders' fallback warnings as their bodies are built)
  for (const M of Core.MODELS.filter(m => m.kit && !m.retired)) {
    const I = R.kitInfo(M.id), PT = Core.partsOf(M);
    for (const k in PT) { const p = PT[k], c = I.ranges[k] && I.ranges[k].c; if (p.wh != null) continue; n0++;
      if (!c) { rows.push(`${M.id} ${k}: no range`); continue; }
      const d = Math.hypot(c[0] - p.lx * M.len / 2, c[1] - p.y, c[2] - p.lz * M.wid / 2); if (d > worst[1]) worst = [M.id + ' ' + k, d];
      if (d > 0.35) rows.push(`${M.id} ${k}: ${d.toFixed(2)} m (range at ${c.map(v => v.toFixed(2)).join(', ')})`); }
  }
  console.warn = w0;
  check(`every registered vehicle's parts lie where the core throws their pieces from (each range's centroid within 0.35 m of its spawn point; ${n0} parts)`, !rows.length && n0 > 0,
    rows.slice(0, 6).join(' | ') || `the farthest: ${worst[0]} ${worst[1].toFixed(3)} m`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} kit checks (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(bad ? 1 : 0);
