// The garage's parts as geometry (docs/deli.md, sklop 4): every option of every element on a vehicle built with Render.kitTry (the body
// with that option fitted, its own triangles tagged by K.deli: geo.userData.deli), then looked at as a solid would be:
//   - islands: the option's triangles welded where they share corners; touching islands (within EPS, or crossing) one group
//   - floating: a group of the option's that touches nothing of the car (the rest of its body, its wheels) by more than EPS
//   - through: how deep the option's corners go into the body (inside: the shell all round them, six rays; depth: to the nearest of it)
//   - the glass: an option's corners behind a pane (the windows), the wheels: its corners in a tyre's room (steered, sprung)
// Used by tests/deli-pregled.test.js (every option of a vehicle's: node tests/deli-pregled.test.js [vehicle id]).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const GROUPS = () => fs.readdirSync(path.join(ROOT, 'js/deli')).filter(f => f.endsWith('.js')).sort().map(f => 'js/deli/' + f);

// the render kit in a sandbox (as tests/deli.test.js) with the parts' scripts
function loadRender(C) {
  const THREE = require(path.join(ROOT, 'js/vendor/three.r128.min.js'));
  const ctx = { THREE, Core: C, console, Math, JSON, Date, Map, Set, WeakMap, Float32Array, Uint32Array, Uint8Array, Uint16Array, Int16Array, Int8Array, Int32Array, Array, Object, Number, String, Error, isFinite, parseFloat, parseInt,
    atob: (b) => Buffer.from(b, 'base64').toString('binary'), performance: { now: () => 0 }, requestAnimationFrame() {},
    window: { innerWidth: 800, innerHeight: 450, addEventListener() {} }, document: { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['js/data/deli.js', 'js/deli.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + (f === 'js/deli.js' ? '\n;globalThis.DELI = DELI;' : '\n;globalThis.DELI_DATA = DELI_DATA;'), ctx, { filename: f });
  for (const f of GROUPS()) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  for (const [f, name] of [['js/world.js', 'World'], ['js/render.js', 'Render']]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + `\n;globalThis.${name} = ${name};`, ctx, { filename: f });
  return ctx;
}

// ---- small vector maths on flat arrays ----
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// the closest point of triangle abc to p (Ericson, Real-Time Collision Detection 5.1.5): its squared distance
function ptTri2(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap);
  let q;
  if (d1 <= 0 && d2 <= 0) q = a;
  else { const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) q = b;
    else { const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); q = [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]; }
      else { const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
        if (d6 >= 0 && d5 <= d6) q = c;
        else { const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); q = [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]; }
          else { const va = d3 * d6 - d5 * d4;
            if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); q = [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w]; }
            else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; q = [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]; } } } } } }
  const d = sub(p, q); return [dot(d, d), q];
}
// segment pq through triangle abc (Möller-Trumbore, both faces): the parameter t on pq, or -1
function segTri(p, q, a, b, c) {
  const d = sub(q, p), e1 = sub(b, a), e2 = sub(c, a), h = cross(d, e2), det = dot(e1, h);
  if (Math.abs(det) < 1e-12) return -1;
  const f = 1 / det, s = sub(p, a), u = f * dot(s, h); if (u < 0 || u > 1) return -1;
  const qq = cross(s, e1), v = f * dot(d, qq); if (v < 0 || u + v > 1) return -1;
  const t = f * dot(e2, qq); return t >= 0 && t <= 1 ? t : -1;
}

// a uniform grid over a triangle soup (positions: a flat array, tris: the triangles' first vertex / 3 indices)
function Grid(P, tris, cell) {
  const G = new Map(), cs = cell || 0.04, key = (i, j, k) => (i + 512) * 1048576 + (j + 512) * 1024 + (k + 512);
  for (const t of tris) { const o = t * 9; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let v = 0; v < 3; v++) { const x = P[o + v * 3], y = P[o + v * 3 + 1], z = P[o + v * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    for (let i = Math.floor(x0 / cs); i <= Math.floor(x1 / cs); i++) for (let j = Math.floor(y0 / cs); j <= Math.floor(y1 / cs); j++) for (let k = Math.floor(z0 / cs); k <= Math.floor(z1 / cs); k++) {
      const K = key(i, j, k); let L = G.get(K); if (!L) G.set(K, L = []); L.push(t); } }
  const tri = (t) => { const o = t * 9; return [[P[o], P[o + 1], P[o + 2]], [P[o + 3], P[o + 4], P[o + 5]], [P[o + 6], P[o + 7], P[o + 8]]]; };
  // the triangles in the cells round a box (lo, hi), each once
  const near = (lo, hi) => { const out = new Set();
    for (let i = Math.floor(lo[0] / cs); i <= Math.floor(hi[0] / cs); i++) for (let j = Math.floor(lo[1] / cs); j <= Math.floor(hi[1] / cs); j++) for (let k = Math.floor(lo[2] / cs); k <= Math.floor(hi[2] / cs); k++) {
      const L = G.get(key(i, j, k)); if (L) for (const t of L) out.add(t); }
    return out; };
  // the distance from p to the nearest triangle within r (Infinity: none that near) and that triangle's normal side (+1 in front, -1 behind)
  const dist = (p, r) => { let best = r * r, bt = -1, bq = null;
    for (const t of near([p[0] - r, p[1] - r, p[2] - r], [p[0] + r, p[1] + r, p[2] + r])) { const T = tri(t), [d2, q] = ptTri2(p, T[0], T[1], T[2]); if (d2 < best) { best = d2; bt = t; bq = q; } }
    if (bt < 0) return { d: Infinity };
    const T = tri(bt), n = cross(sub(T[1], T[0]), sub(T[2], T[0])); return { d: Math.sqrt(best), t: bt, side: Math.sign(dot(sub(p, bq), n)) || 1 }; };
  // a ray from p along unit dir d up to len: the nearest hit's distance (Infinity: none); the cells it crosses in order (Amanatides-Woo)
  const ray = (p, d, len) => { const seen = new Set(), q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], c = [0, 1, 2].map(j => Math.floor(p[j] / cs));
    const st = d.map(v => v > 0 ? 1 : v < 0 ? -1 : 0), tD = d.map(v => v ? Math.abs(cs / v) : Infinity), tM = [0, 1, 2].map(j => d[j] > 0 ? ((c[j] + 1) * cs - p[j]) / d[j] : d[j] < 0 ? (c[j] * cs - p[j]) / d[j] : Infinity);
    let best = Infinity, t = 0;
    while (t <= len) {
      const L = G.get(key(c[0], c[1], c[2]));
      if (L) for (const u of L) { if (seen.has(u)) continue; seen.add(u); const T = tri(u), s = segTri(p, q, T[0], T[1], T[2]); if (s >= 0 && s * len < best) best = s * len; }
      const j = tM[0] < tM[1] ? (tM[0] < tM[2] ? 0 : 2) : (tM[1] < tM[2] ? 1 : 2);   // (the next cell: across the nearest wall)
      if (best <= tM[j]) break;
      t = tM[j]; c[j] += st[j]; tM[j] += tD[j]; }
    return best; };
  return { near, dist, ray, tri, cell: cs };
}

// an option's geometry on vehicle id: { P (all the body's corners, metres), part: [triangle indices], rest: [the others in the outer
// shell], inner: [the inner block's], glass: [the rest's panes], geo info }; deli: { [id]: n } (several elements at once: part is id's)
function optionGeo(R, vid, deli, id, hi) {
  const T = R.kitTry(vid, null, deli, hi); if (!T || T.status !== 'ok') return { status: T ? T.status : 'none' };
  const g = T.geo, U = g.userData, P = g.attributes.position.array, C = g.attributes.color.array, N = P.length / 9, outerN = U.outerN / 3;
  const mine = new Uint8Array(N); for (const k of [id, id + '+']) for (const [a, b] of (U.deli || {})[k] || []) for (let v = a; v < b; v += 3) mine[v / 3] = k === id ? 1 : 2;
  const part = [], rest = [], inner = [], glass = [], around = [];
  const isGlass = (o) => (Math.abs(C[o] - 0.1) < 1e-4 && Math.abs(C[o + 1] - 0.13) < 1e-4 && Math.abs(C[o + 2] - 0.19) < 1e-4) || (Math.abs(C[o] - 0.04) < 1e-4 && Math.abs(C[o + 1] - 0.05) < 1e-4 && Math.abs(C[o + 2] - 0.08) < 1e-4);
  for (let t = 0; t < N; t++) { if (mine[t] === 1) part.push(t); else { if (mine[t] === 2) around.push(t); if (t < outerN) { rest.push(t); if (isGlass(t * 9)) glass.push(t); } else inner.push(t); } }
  const out = { status: 'ok', P: P.slice(), C: C.slice(), part, rest, inner, glass, around, outerN, U, body: T.body, tubs: T.tubs, wheels: T.wheels, tris: T.tris };
  g.dispose(); return out;
}

// the option's islands: its triangles welded by shared corners (0.05 mm)
function islands(P, tris) {
  const id = new Map(), par = [], find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
  const vk = (o) => Math.round(P[o] * 2e4) + ',' + Math.round(P[o + 1] * 2e4) + ',' + Math.round(P[o + 2] * 2e4);
  tris.forEach((t, i) => { par[i] = i; });
  tris.forEach((t, i) => { for (let v = 0; v < 3; v++) { const k = vk(t * 9 + v * 3); if (id.has(k)) uni(i, id.get(k)); else id.set(k, i); } });
  const M = new Map(); tris.forEach((t, i) => { const r = find(i); let L = M.get(r); if (!L) M.set(r, L = []); L.push(t); });
  return [...M.values()];
}
const corners = (P, tris) => { const out = []; for (const t of tris) for (let v = 0; v < 3; v++) { const o = t * 9 + v * 3; out.push([P[o], P[o + 1], P[o + 2]]); } return out; };
const boxOf = (pts) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const p of pts) for (let j = 0; j < 3; j++) { if (p[j] < lo[j]) lo[j] = p[j]; if (p[j] > hi[j]) hi[j] = p[j]; } return [lo, hi]; };
// does island A touch the triangles of grid G (within eps: a corner that near, or an edge through one of them)?
function touches(P, A, G, eps) {
  for (const t of A) { const o = t * 9, V = [[P[o], P[o + 1], P[o + 2]], [P[o + 3], P[o + 4], P[o + 5]], [P[o + 6], P[o + 7], P[o + 8]]];
    for (const p of V) if (G.dist(p, eps).d <= eps) return true;
    for (let e = 0; e < 3; e++) { const p = V[e], q = V[(e + 1) % 3], [lo, hi] = boxOf([p, q]);
      for (const u of G.near(lo, hi)) { const T = G.tri(u); if (segTri(p, q, T[0], T[1], T[2]) >= 0) return true; } } }
  return false;
}
// the nearest the island comes to grid G's triangles (its corners; capped at r)
function gap(P, A, G, r) { let best = Infinity; for (const p of corners(P, A)) { const d = G.dist(p, r).d; if (d < best) best = d; } return best; }

module.exports = { ROOT, GROUPS, loadRender, ptTri2, segTri, Grid, optionGeo, islands, corners, boxOf, touches, gap };
