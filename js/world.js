/* =========================================================================
   WORLD — builds static scene geometry for the track and its surroundings
   ========================================================================= */
const World = (function () {
  'use strict';
  const { clamp, lerp, sstep, rng } = Core;
  const TAU = Math.PI * 2;

  /* ---------------- adaptive graphics detail (LOD) ----------------
     One shared mechanism every track builder consults, so a track never copies LOD logic. The tier (opts.tier) comes from the game's
     "Podrobnosti" setting / the device: 0 = NIZKA (the phone budget from CLAUDE.md, up to ~300 draw calls and ~900k vertices), 1 = SREDNJA,
     2 = VISOKA (the full detail; VISOKA is a no-op — identical to before this system). A builder keeps the base (road, edges, terrain,
     start/finish, the essentials) at every tier and asks LOD before emitting the extra decoration:
       LOD.draw(category)  — is this decorative category drawn at the current tier? (base categories are not listed, so always drawn)
       LOD.radius(metres)  — a decorative draw distance, shortened on the lower tiers
       LOD.count(n)        — a decorative instance/scatter count, thinned on the lower tiers (on top of opts.density)
       LOD.dens            — the same thinning factor, to fold into a builder's own `dens`
     DETAIL maps a category to the lowest tier at which it is still drawn (absent = always). Tuned per builder in later steps. */
  const DETAIL = { boulders: 1, marineFog: 2, animals: 1, boats: 1, extraTrees: 1, farProps: 1 };
  function makeLOD(tier) {
    const T = tier == null ? 2 : (tier | 0);
    const densMul = T >= 2 ? 1 : T === 1 ? 0.72 : 0.45;   // SREDNJA / NIZKA thin the decoration
    const radMul = T >= 2 ? 1 : T === 1 ? 0.72 : 0.42;   // NIZKA: a notably shorter draw distance (fewer in-view chunks → fewer draw calls)
    return {
      tier: T, dens: densMul,
      draw(cat) { const m = DETAIL[cat]; return m == null ? true : T >= m; },
      radius(m) { return T >= 2 ? m : m * radMul; },          // VISOKA: the exact distance (identical), lower tiers: shorter
      count(n) { return T >= 2 ? n : Math.max(0, Math.round(n * densMul)); },   // VISOKA: the exact count (identical)
      cap(m) { return T >= 2 ? Infinity : m * radMul; },      // add a far cut-off only below VISOKA (loops that had none stay unbounded at VISOKA)
    };
  }
  let LOD = makeLOD(2);   // set per build() from opts.tier; VISOKA by default
  // three.js names every object it makes (a mesh, a geometry, a material) with Math.random (MathUtils.generateUUID: four draws), which the
  // browser tests seed and share with the race: what a world adds for one tier alone (NIZKA's lighter far plants) is made with Math.random
  // swapped for World's own generator (never reset: the names stay unique), so a seeded race runs as it did before (as Render's ownRnd)
  const uuW = { s: 7919 };
  function ownRnd(fn) { const r = Math.random; Math.random = () => { uuW.s = (uuW.s * 48271) % 2147483647; return uuW.s / 2147483647; }; try { return fn(); } finally { Math.random = r; } }
  // a parked vehicle (fn(g, x, y, z, rot, ...)) only where the ground under it is level enough: its four corners (length L, 2 m wide) within
  // 0.35 m of the ground under its middle on gH, else left out (half up a bank beside a car park); its arguments (and so the draws of the
  // builder's random numbers for its colour) are taken as ever
  function parkOn(fn, gH, L, g, x, y, z, rot, ...rest) {
    const c = Math.cos(rot), s = Math.sin(rot), y0 = gH(x, z);
    for (const [a, b] of [[L / 2, 1], [L / 2, -1], [-L / 2, 1], [-L / 2, -1]]) if (Math.abs(gH(x + c * a - s * b, z + s * a + c * b) - y0) > 0.35) return false;
    fn(g, x, y, z, rot, ...rest); return true;
  }
  // no spectators beside the road on the real tracks (the user's decision, 30. 10. 2026): the crowds are placed as ever (the same exclusions,
  // the trees and the props where they were) but not drawn, nor the visitors at the viewpoints; the marshals and the cameramen stay (31. 10.:
  // CrowdChunks.put tells them apart); the grandstands keep their people, drawn finer (Tex.crowdHi), and their sound;
  // the tracks kept for testing (def.test) as they were, and a real track with def.fans (Harju: its crowds but those by the blocks, 31. 10.)
  const fansOn = () => !!(T && T.def && (T.def.test || T.def.fans));   // (def.fans: a real track whose crowds stay, Harju's)
  // decorative meshes eligible for the runtime draw-distance cull (vegetation and trees only: Render hides the far ones on the lower tiers to
  // keep the draw-call count down; the base — road, terrain, barriers, buildings, signs — is never in this list). Each entry: {m, x, z, r}
  // (the mesh and its chunk centre and radius in world space). Filled during build(), handed out as out.cull in finish().
  let CULLM = [];
  const cullAdd = (m, x, z, r) => CULLM.push({ m, x, z, r });
  // NIZKA: the shadows of the instanced plants and rocks (IChunks) from a coarser copy of each (shadowLo), drawn only into the shadow map;
  // each entry [the copy, the mesh it stands for] (handed out as out.shadowLo in finish(): Render shows a copy for the shadow pass alone,
  // when its mesh is shown)
  let SHLO = [];
  // a coarser copy of a unit plant or rock for its shadow: its vertices merged on a 3 x 4 x 3 grid over its box (each cell's vertices at
  // their average), the triangles that are left (no repeats); null where it would not save a third of them (small ones)
  const SHLO_GEO = new Map();
  let SHLO_MAT = null;
  const shloMat = () => SHLO_MAT || (SHLO_MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));   // (a copy's shadow from both its sides: a merged shape may have lost its back)
  function shadowLo(base) {
    if (SHLO_GEO.has(base)) return SHLO_GEO.get(base);
    const P = base.attributes.position, I = base.index, n = I ? I.count : P.count;
    let out = null;
    if (n >= 120) {
      if (!base.boundingBox) base.computeBoundingBox();
      const b = base.boundingBox, NX = 3, NY = 4, NZ = 3, wx = (b.max.x - b.min.x) / NX || 1, wy = (b.max.y - b.min.y) / NY || 1, wz = (b.max.z - b.min.z) / NZ || 1;
      const cell = new Map(), acc = [], vid = new Int32Array(P.count);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = (Math.min(NY - 1, Math.floor((y - b.min.y) / wy)) * NZ + Math.min(NZ - 1, Math.floor((z - b.min.z) / wz))) * NX + Math.min(NX - 1, Math.floor((x - b.min.x) / wx));
        let v = cell.get(k); if (v === undefined) { v = acc.length / 4; cell.set(k, v); acc.push(0, 0, 0, 0); }
        acc[v * 4] += x; acc[v * 4 + 1] += y; acc[v * 4 + 2] += z; acc[v * 4 + 3]++; vid[i] = v;
      }
      const idx = [], seen = new Set();
      for (let t = 0; t + 2 < n; t += 3) {
        const a = vid[I ? I.getX(t) : t], c = vid[I ? I.getX(t + 1) : t + 1], d = vid[I ? I.getX(t + 2) : t + 2];
        if (a === c || c === d || a === d) continue;
        const key = [a, c, d].sort((p, q) => p - q).join(','); if (seen.has(key)) continue; seen.add(key); idx.push(a, c, d);
      }
      if (idx.length <= n * 0.66) {
        const pos = new Float32Array(acc.length / 4 * 3); for (let v = 0; v < acc.length / 4; v++) for (let q = 0; q < 3; q++) pos[v * 3 + q] = acc[v * 4 + q] / acc[v * 4 + 3];
        out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setIndex(idx);
      }
    }
    SHLO_GEO.set(base, out); return out;
  }

  /* ---------------- geometry builder (non-indexed, flat normals) -------- */
  const GB_UV0 = [0, 0];
  class GB {
    constructor(uv, alpha) { this.P = []; this.N = []; this.C = []; this.U = uv ? [] : null; this.A = !!alpha; }
    tri(a, b, c, ca, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      cb = cb || ca; cc = cc || ca;
      if (this.A) this.C.push(ca[0], ca[1], ca[2], ca[3], cb[0], cb[1], cb[2], cb[3], cc[0], cc[1], cc[2], cc[3]);
      else this.C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
      if (this.U) { const d = this.dUV || GB_UV0; ua = ua || d; ub = ub || d; uc = uc || d; this.U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]); }   // (dUV: where a part without UVs lands in the texture)
    }
    // outward-oriented triangle: flips winding if its normal points toward 'inside'
    triO(a, b, c, col, inside, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (a[0] + b[0] + c[0]) / 3 - inside[0], cy = (a[1] + b[1] + c[1]) / 3 - inside[1], cz = (a[2] + b[2] + c[2]) / 3 - inside[2];
      if (nx * cx + ny * cy + nz * cz < 0) this.tri(a, c, b, col, cc, cb, ua, uc, ub);
      else this.tri(a, b, c, col, cb, cc, ua, ub, uc);
    }
    quadO(a, b, c, d, col, inside, uvs, cols) {
      if (cols) { this.triO(a, b, c, cols[0], inside, cols[1], cols[2], uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]); this.triO(a, c, d, cols[0], inside, cols[2], cols[3], uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]); }
      else { this.triO(a, b, c, col, inside, col, col, uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]); this.triO(a, c, d, col, inside, col, col, uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]); }
    }
    // triangle with its own vertex normals (smooth, rounded shading for boulders, firs, bales); triON orients it outward like triO
    triN(a, b, c, na, nb, nc, ca, cb, cc, ua, ub, uc) {
      this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.N.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
      cb = cb || ca; cc = cc || ca;
      if (this.A) this.C.push(ca[0], ca[1], ca[2], ca[3], cb[0], cb[1], cb[2], cb[3], cc[0], cc[1], cc[2], cc[3]);
      else this.C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
      if (this.U) { const d = this.dUV || GB_UV0; ua = ua || d; ub = ub || d; uc = uc || d; this.U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]); }
    }
    triON(a, b, c, na, nb, nc, inside, ca, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (a[0] + b[0] + c[0]) / 3 - inside[0], cy = (a[1] + b[1] + c[1]) / 3 - inside[1], cz = (a[2] + b[2] + c[2]) / 3 - inside[2];
      if (nx * cx + ny * cy + nz * cz < 0) this.triN(a, c, b, na, nc, nb, ca, cc, cb, ua, uc, ub); else this.triN(a, b, c, na, nb, nc, ca, cb, cc, ua, ub, uc);
    }
    quadON(a, b, c, d, na, nb, nc, nd, inside, ca, cb, cc, cd, uvs) {
      this.triON(a, b, c, na, nb, nc, inside, ca, cb, cc, uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]);
      this.triON(a, c, d, na, nc, nd, inside, ca, cc, cd, uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]);
    }
    // up-facing triangle (a fan)
    triUp(a, b, c, cols, uvs) {
      const inside = [(a[0] + b[0] + c[0]) / 3, Math.min(a[1], b[1], c[1]) - 5, (a[2] + b[2] + c[2]) / 3];
      this.triO(a, b, c, cols[0], inside, cols[1], cols[2], uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]);
    }
    // up-facing quad (ribbons)
    quadUp(a, b, c, d, cols, uvs) {
      const inside = [(a[0] + c[0]) / 2, Math.min(a[1], b[1], c[1], d[1]) - 5, (a[2] + c[2]) / 2];
      this.quadO(a, b, c, d, cols[0], inside, uvs, cols);
    }
    get empty() { return this.P.length === 0; }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, this.A ? 4 : 3));
      if (this.U) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
      g.computeBoundingSphere();
      return g;
    }
  }
  class Chunks {
    constructor(size, uv) { this.size = size; this.map = new Map(); this.uv = !!uv; }
    get(x, z) { const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let g = this.map.get(k); if (!g) { g = new GB(this.uv); this.map.set(k, g); } return g; }
    addTo(group, mat, cast, recv) { for (const g of this.map.values()) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); } }
  }

  /* ---------------- swaying trees (the default builder's woods): their own chunks, each vertex with its share of the sway (aSway: 0 at the
     foot of its tree, 1 at the top, squared), bent by the wind in the vertex shader (World.update drives the uniform: out.dyn.wind) ---------------- */
  function swayMat(W) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = W;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind; attribute float aSway;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        'float wPh = position.x * 0.045 + position.z * 0.061;\ntransformed.x += aSway * 0.34 * sin(uWind * 1.15 + wPh);\ntransformed.z += aSway * 0.22 * sin(uWind * 0.87 + wPh * 1.6);');
    };
    m.customProgramCacheKey = () => 'treeSway';
    return m;
  }
  function treeMark(g, n0, y0, h) { (g.sw || (g.sw = [])).push(n0, g.P.length / 3, y0, h); }   // (after a tree is added to g: its vertices from n0 sway by their height)
  function treesTo(ch, group, mat) {
    for (const g of ch.map.values()) {
      if (g.empty) continue;
      const geo = g.geometry(), n = g.P.length / 3, A = new Float32Array(n), L = g.sw || [];
      for (let k = 0; k < L.length; k += 4) { const y0 = L[k + 2], h = L[k + 3]; for (let v = L[k]; v < L[k + 1]; v++) { const f = Math.max(0, Math.min(1, (g.P[v * 3 + 1] - y0) / h - 0.15)); A[v] = f * f; } }
      geo.setAttribute('aSway', new THREE.BufferAttribute(A, 1));
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m);
      const lo = LOD.tier === 0 ? treesLo(g) : null;
      if (lo) {   // NIZKA: the chunk's shadow from its coarser copy, in the shadow pass alone
        lo.boundingSphere = geo.boundingSphere; const sm = new THREE.Mesh(lo, shloMat()); sm.castShadow = true; sm.receiveShadow = false; sm.visible = false;
        sm.matrixAutoUpdate = false; sm.updateMatrix(); m.castShadow = false; group.add(sm); SHLO.push([sm, m]);
      }
      if (!geo.boundingSphere) geo.computeBoundingSphere(); const bs = geo.boundingSphere; cullAdd(m, bs.center.x, bs.center.z, bs.radius);   // swaying woods: distance-cullable on the lower tiers
    }
  }

  // a chunk of swaying trees, coarser, for its shadow (NIZKA): each tree's vertices merged on a 3 x 4 x 3 grid over its own box (as shadowLo),
  // the rest of the chunk as it is; null where it would not save a third of the triangles
  function treesLo(g) {
    const P = g.P, n = P.length / 3, L = g.sw || [], key = new Int32Array(n).fill(-1), ids = new Map(), acc = [];
    const id = (k) => { let v = ids.get(k); if (v === undefined) { v = acc.length / 4; ids.set(k, v); acc.push(0, 0, 0, 0); } return v; };
    for (let k = 0; k < L.length; k += 4) {
      const a = L[k], b = L[k + 1]; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let v = a; v < b; v++) { const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const wx = (x1 - x0) / 3 || 1, wy = (y1 - y0) / 4 || 1, wz = (z1 - z0) / 3 || 1;
      for (let v = a; v < b; v++) key[v] = id(k / 4 * 64 + (Math.min(3, Math.floor((P[v * 3 + 1] - y0) / wy)) * 3 + Math.min(2, Math.floor((P[v * 3 + 2] - z0) / wz))) * 3 + Math.min(2, Math.floor((P[v * 3] - x0) / wx)));
    }
    for (let v = 0; v < n; v++) if (key[v] < 0) key[v] = id(-1 - v);   // (not a tree's: its own vertex)
    for (let v = 0; v < n; v++) { const q = key[v] * 4; acc[q] += P[v * 3]; acc[q + 1] += P[v * 3 + 1]; acc[q + 2] += P[v * 3 + 2]; acc[q + 3]++; }
    const idx = [], seen = new Set();
    for (let t = 0; t + 2 < n; t += 3) {
      const a = key[t], b = key[t + 1], c = key[t + 2]; if (a === b || b === c || a === c) continue;
      const k = a < b ? (a < c ? (b < c ? a + ',' + b + ',' + c : a + ',' + c + ',' + b) : c + ',' + a + ',' + b) : (b < c ? (a < c ? b + ',' + a + ',' + c : b + ',' + c + ',' + a) : c + ',' + b + ',' + a);
      if (seen.has(k)) continue; seen.add(k); idx.push(a, b, c);
    }
    if (idx.length > n * 0.66) return null;
    const pos = new Float32Array(acc.length / 4 * 3); for (let v = 0; v < acc.length / 4; v++) for (let q = 0; q < 3; q++) pos[v * 3 + q] = acc[v * 4 + q] / acc[v * 4 + 3];
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setIndex(idx); return out;
  }

  /* ---------------- primitives ---------------- */
  const vary = (c, r, amt) => { const k = 1 + (r() - 0.5) * amt; return [c[0] * k, c[1] * k, c[2] * k]; };
  const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  function box(g, cx, cy, cz, sx, sy, sz, rot, col, colTop, noBottom) {
    const c = Math.cos(rot), s = Math.sin(rot), hx = sx / 2, hz = sz / 2;
    const P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c];
    const v = [P(-hx, 0, -hz), P(hx, 0, -hz), P(hx, sy, -hz), P(-hx, sy, -hz), P(-hx, 0, hz), P(hx, 0, hz), P(hx, sy, hz), P(-hx, sy, hz)];
    const inn = [cx, cy + sy / 2, cz];
    const ct = colTop || col;
    g.quadO(v[1], v[2], v[6], v[5], col, inn); g.quadO(v[0], v[4], v[7], v[3], col, inn);
    g.quadO(v[3], v[7], v[6], v[2], ct, inn);
    if (!noBottom) g.quadO(v[0], v[1], v[5], v[4], col, inn);
    g.quadO(v[4], v[5], v[6], v[7], col, inn); g.quadO(v[1], v[0], v[3], v[2], col, inn);
  }
  function cone(g, cx, cy, cz, r, h, sides, col, colTip, rot) {
    const apex = [cx, cy + h, cz], inn = [cx, cy + h * 0.3, cz], L = Math.hypot(r, h) || 1, ny = r / L, nh = h / L;
    for (let i = 0; i < sides; i++) {
      const a0 = rot + i / sides * TAU, a1 = rot + (i + 1) / sides * TAU;
      const p0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r];
      if (ROCK_SMOOTH) { const am = (a0 + a1) / 2; g.triON(p0, apex, p1, [Math.cos(a0) * nh, ny, Math.sin(a0) * nh], [Math.cos(am) * nh, ny, Math.sin(am) * nh], [Math.cos(a1) * nh, ny, Math.sin(a1) * nh], inn, col, colTip, col); }   // smooth (forest)
      else g.triO(p0, apex, p1, col, inn, colTip, col);
    }
  }
  function starCone(g, cx, cy, cz, r, h, n, col, colTip, rot, droop) {   // jagged fir tier: n drooping branch tips around an inner ring (2n faces, flat shaded)
    const apex = [cx, cy + h, cz], inn = [cx, cy + h * 0.3, cz], m = 2 * n, pts = [];
    for (let k = 0; k < m; k++) { const a = rot + k / m * TAU, tip = k % 2 === 0, rr = tip ? r : r * 0.58; pts.push([cx + Math.cos(a) * rr, cy + (tip ? -droop : h * 0.12), cz + Math.sin(a) * rr]); }
    if (ROCK_SMOOTH) {   // soft shading: normals lean out from the trunk (no hard facets on the branches)
      const nn = (p) => { const dx = p[0] - cx, dz = p[2] - cz, l = Math.hypot(dx, dz) || 1, x = dx / l * 0.8, z = dz / l * 0.8, y = 0.6, L = Math.hypot(x, y, z); return [x / L, y / L, z / L]; }, up = [0, 1, 0];
      for (let k = 0; k < m; k++) { const a = pts[k], b = pts[(k + 1) % m]; g.triON(a, b, apex, nn(a), nn(b), up, inn, col, col, colTip); }
      return; }
    for (let k = 0; k < m; k++) g.triO(pts[k], pts[(k + 1) % m], apex, col, inn, col, colTip);
  }
  function cyl(g, cx, cy, cz, r, h, sides, col, colTop, r2) {
    const rt = r2 == null ? r : r2, inn = [cx, cy + h / 2, cz];
    for (let i = 0; i < sides; i++) {
      const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU;
      const b0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], b1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r];
      const t0 = [cx + Math.cos(a0) * rt, cy + h, cz + Math.sin(a0) * rt], t1 = [cx + Math.cos(a1) * rt, cy + h, cz + Math.sin(a1) * rt];
      g.quadO(b0, t0, t1, b1, col, inn);
      if (colTop) g.triO([cx, cy + h, cz], t1, t0, colTop, inn);
    }
  }
  function tyreStack(g, cx, cy, cz, h, col, r) {   // one column of painted tyres (18 faces): 6 sides, the dark hole shaded into the top with vertex colours
    r = r || 0.33; const inn = [cx, cy + h / 2, cz], top = [cx, cy + h, cz], dark = [0.07, 0.07, 0.08], rim = [col[0] * 0.92, col[1] * 0.92, col[2] * 0.92], low = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.66], below = [cx, cy - 1, cz];
    for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU, b0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], b1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r], t0 = [b0[0], cy + h, b0[2]], t1 = [b1[0], cy + h, b1[2]];
      g.quadO(b0, t0, t1, b1, col, inn, null, [low, col, col, low]); g.triO(top, t1, t0, dark, below, rim, rim); }
  }
  function tyreCol(g, cx, cy, cz, h, r, col, rot, vb) {   // a column of three fat painted tyres (24 faces): 8 sides with the tyre texture, a ring with a dark hole on top (vb: the texture's bottom edge, 0.5 = three tyres; 0.832 = one)
    const n = 8, a0r = rot || 0, top = [cx, cy + h, cz], below = [cx, cy - 1, cz], inn = [cx, cy + h / 2, cz];
    for (let k = 0; k < n; k++) { const a0 = a0r + k / n * TAU, a1 = a0r + (k + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const b0 = [cx + c0 * r, cy, cz + s0 * r], b1 = [cx + c1 * r, cy, cz + s1 * r], t0 = [b0[0], cy + h, b0[2]], t1 = [b1[0], cy + h, b1[2]], u0 = k / n * 2, u1 = (k + 1) / n * 2;
      g.quadO(b0, t0, t1, b1, col, inn, [[u0, vb || 0.5], [u0, 0.998], [u1, 0.998], [u1, vb || 0.5]]);
      g.triO(top, t1, t0, col, below, col, col, [0.5, 0.25], [0.5 + 0.49 * c1, 0.25 + 0.245 * s1], [0.5 + 0.49 * c0, 0.25 + 0.245 * s0]); }
  }
  const ICO_T = (1 + Math.sqrt(5)) / 2;
  const ICO_V = [[-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0], [0, -1, ICO_T], [0, 1, ICO_T], [0, -1, -ICO_T], [0, 1, -ICO_T], [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
  const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  function ico(g, cx, cy, cz, r, sy, col, r_, jit) {
    const vs = ICO_V.map(v => { const k = 1 + (r_() - 0.5) * jit; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; });
    const inn = [cx, cy, cz];
    if (ROCK_SMOOTH) {   // soft, rounded shading (bushes and small stones on the forest circuit)
      const sc = (p) => { const k = 0.82 + 0.3 * ((p[1] - cy) / (r * sy) * 0.5 + 0.5); return [col[0] * k, col[1] * k, col[2] * k]; };
      const nn = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / (r * sy * sy), z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      for (const f of ICO_F) { const a = vs[f[0]], b = vs[f[1]], c = vs[f[2]]; g.triON(a, b, c, nn(a), nn(b), nn(c), inn, sc(a), sc(b), sc(c)); }
      return; }
    for (const f of ICO_F) {
      const a = vs[f[0]], b = vs[f[1]], c = vs[f[2]];
      const shade = 0.82 + 0.3 * (((a[1] + b[1] + c[1]) / 3 - cy) / (r * sy) * 0.5 + 0.5);
      g.triO(a, b, c, [col[0] * shade, col[1] * shade, col[2] * shade], inn);
    }
  }
  const ICO1 = (() => {   // icosphere subdivided once (42 vertices, 80 faces)
    const V = ICO_V.map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }), F = [], mid = new Map();
    const m = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (mid.has(k)) return mid.get(k); const p = V[a], q = V[b], x = p[0] + q[0], y = p[1] + q[1], z = p[2] + q[2], l = Math.hypot(x, y, z); V.push([x / l, y / l, z / l]); mid.set(k, V.length - 1); return V.length - 1; };
    for (const [a, b, c] of ICO_F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    return { V, F };
  })();
  const ICO0 = { V: ICO_V, F: ICO_F };
  function puff(g, cx, cy, cz, r, sy, col, r_, jit, lo, hi, fine) {   // soft round clump of foliage (icosphere, smooth normals; fine: subdivided once): dark underneath, warm and sunlit on top
    const M = fine ? ICO1 : ICO0, V = M.V.map(v => { const k = 1 + (r_() - 0.5) * jit; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; }), inn = [cx, cy, cz];
    const sc = (p, v) => { const t = v[1] * 0.5 + 0.5, k = lo + (hi - lo) * t * t; return [col[0] * k * (1 + 0.1 * t), col[1] * k, col[2] * k * (1 - 0.18 * t)]; };
    const nn = (v) => { const x = v[0], y = v[1] / sy + 0.25, z = v[2], l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };   // (normals tipped up a little: the sun reaches over the top)
    const C = M.V.map((v, k) => sc(V[k], v)), Nn = M.V.map(nn);
    for (const [a, b, c] of M.F) g.triON(V[a], V[b], V[c], Nn[a], Nn[b], Nn[c], inn, C[a], C[b], C[c]);
  }
  function rock(g, cx, cy, cz, rx, ry, rz, rot, col, r_, jit, flat) {   // chunky boulder (33 faces): 7-sided, bulging middle, chamfered flat top (cy = centre height)
    const c = Math.cos(rot), s = Math.sin(rot), yb = cy - 0.4 * ry, yt = cy + (flat == null ? 0.6 : flat) * ry, ym = yb + (yt - yb) * 0.52, n = 7;
    const ring = (y, f) => { const out = []; for (let k = 0; k < n; k++) { const a = (k + (r_() - 0.5) * 0.5) / n * Math.PI * 2, kk = f * (1 + (r_() - 0.5) * jit), lx = Math.cos(a) * rx * kk, lz = Math.sin(a) * rz * kk; out.push([cx + lx * c - lz * s, y + (r_() - 0.5) * jit * ry * 0.3, cz + lx * s + lz * c]); } return out; };
    const B = ring(yb, 0.86), M = ring(ym, 1.0), U = ring(yt, 0.6), inn = [cx, (yb + yt) / 2, cz], sh = (k) => [col[0] * k, col[1] * k, col[2] * k];
    if (ROCK_SMOOTH) {   // rounded, smooth-shaded boulders (as in the reference): normals of the enclosing ellipsoid, darker at the foot
      const yc = (yb + yt) / 2, rh = (rx + rz) / 2, ryh = Math.max(0.3, (yt - yb) / 2), top = [cx, yt + ry * 0.12, cz];
      const N = (p) => { const x = (p[0] - cx) / (rh * rh), y = (p[1] - yc) / (ryh * ryh), z = (p[2] - cz) / (rh * rh), l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      const cB = sh(0.8), cM = sh(1.0), cU = sh(1.08), cT = sh(1.12);
      for (let k = 0; k < n; k++) { const j = (k + 1) % n;
        g.quadON(B[k], B[j], M[j], M[k], N(B[k]), N(B[j]), N(M[j]), N(M[k]), inn, cB, cB, cM, cM);
        g.quadON(M[k], M[j], U[j], U[k], N(M[k]), N(M[j]), N(U[j]), N(U[k]), inn, cM, cM, cU, cU);
        g.triON(U[k], U[j], top, N(U[k]), N(U[j]), [0, 1, 0], [cx, yb - 5, cz], cU, cU, cT); }   // a gently domed top instead of a flat cap
      return; }
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(B[k], B[j], M[j], M[k], sh(0.84), inn); g.quadO(M[k], M[j], U[j], U[k], sh(0.98), inn); }
    for (let k = 1; k < n - 1; k++) g.triO(U[0], U[k], U[k + 1], sh(1.1), [cx, yb - 5, cz]);
  }
  let ROCK_SMOOTH = false;
  function gable(g, cx, cy, cz, L, D, h, rot, col, colEnd) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c];
    const b0 = P(-L / 2, 0, -D / 2), b1 = P(L / 2, 0, -D / 2), b2 = P(L / 2, 0, D / 2), b3 = P(-L / 2, 0, D / 2), r0 = P(-L / 2, h, 0), r1 = P(L / 2, h, 0);
    const inn = [cx, cy + h * 0.3, cz];
    // the far slope a shade lighter or darker: the same every time the track is built (hashed from where the roof stands)
    const hr = rng((Math.round(cx * 10) * 73856093) ^ (Math.round(cz * 10) * 19349663) ^ (Math.round(cy * 10) * 83492791)), col2 = vary(col, hr, 0.08);
    // each slope in courses of tiles from the eave to the ridge, a shade lighter and darker in turn (seen from above: the rows), the eave's
    // course darker (the gutter's shadow), the ridge's too
    const n = Math.max(2, Math.min(5, Math.round(Math.hypot(D / 2, h) / 1.1)));
    for (const [sd, cc] of [[-1, col], [1, col2]]) for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, f = k === 0 ? 0.84 : k === n - 1 ? 0.9 : k % 2 ? 0.94 : 1.03, cb = [cc[0] * f, cc[1] * f, cc[2] * f];
      g.quadO(P(-L / 2, h * t0, sd * D / 2 * (1 - t0)), P(-L / 2, h * t1, sd * D / 2 * (1 - t1)), P(L / 2, h * t1, sd * D / 2 * (1 - t1)), P(L / 2, h * t0, sd * D / 2 * (1 - t0)), cb, inn);
    }
    g.triO(b0, b3, r0, colEnd || col, inn); g.triO(b1, r1, b2, colEnd || col, inn);
    // a house's chimney, on one slope near the ridge (sunk into the roof), its top black with soot
    if (L * D > 70 && L > 5 && hr() < 0.6) {
      const lx = (hr() - 0.5) * L * 0.6, sd = hr() < 0.5 ? -1 : 1, t = 0.72, lz = sd * D / 2 * (1 - t), w = 0.55 + hr() * 0.3, br = hr() < 0.5 ? [0.56, 0.31, 0.24] : (colEnd || col).map(v => v * 0.86), q = P(lx, 0, lz);
      box(g, q[0], cy + h * t - 0.5, q[2], w, 1.5 + h * (1 - t), w, rot, br, [0.17, 0.16, 0.16]);
    }
    // underside (overhang visible from low angles is rare) skipped
  }
  // what stands on a flat roof (seen from above, the chase camera's view): a low parapet round its edge, air conditioners, now and then
  // a water tank, a field of solar panels or a terrace with a deck, planters and a parasol. Hashed from where the roof stands (the same
  // every build; the world's random stream untouched). y: the roof's top
  function roofKit(g, cx, y, cz, W, D, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, lz, ly) => [cx + lx * c - lz * s, y + (ly || 0), cz + lx * s + lz * c], below = [cx, y - 2, cz];
    const flat = (lx, lz, w, d, ly, cl) => g.quadO(P(lx - w / 2, lz - d / 2, ly), P(lx + w / 2, lz - d / 2, ly), P(lx + w / 2, lz + d / 2, ly), P(lx - w / 2, lz + d / 2, ly), cl, below);   // (a flat face up: seen from above only)
    const hr = rng((Math.round(cx * 10) * 92837111) ^ (Math.round(cz * 10) * 689287499) ^ 7331), pc = col.map(v => v * 0.8), pt = col.map(v => v * 0.95), h = 0.42, inn = [cx, y, cz];
    // the parapet: its top and its outer face (the inner one hardly shows from above)
    const C4 = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], C4i = C4.map(([u, v]) => [u - Math.sign(u) * 0.24, v - Math.sign(v) * 0.24]);
    for (let e = 0; e < 4; e++) { const [u0, v0] = C4[e], [u1, v1] = C4[(e + 1) % 4], [i0, j0] = C4i[e], [i1, j1] = C4i[(e + 1) % 4];
      g.quadO(P(u0, v0, 0), P(u1, v1, 0), P(u1, v1, h), P(u0, v0, h), pc, inn); g.quadO(P(u0, v0, h), P(u1, v1, h), P(i1, j1, h), P(i0, j0, h), pt, below); }
    const kind = hr(), ac = 1 + Math.floor(hr() * 2);
    for (let k = 0; k < ac; k++) { const p = P((hr() - 0.5) * (W - 3), (hr() - 0.5) * (D - 3)); box(g, p[0], y, p[2], 0.9, 0.62, 0.7, rot + (hr() < 0.5 ? 0 : Math.PI / 2), [0.74, 0.75, 0.76], [0.6, 0.62, 0.64], true); }
    if (kind < 0.3) {   // solar panels in rows, dark blue in a light frame (flat on their frames)
      const rows = Math.max(1, Math.floor((D - 3) / 2.2)), cols = Math.max(1, Math.floor((W - 3) / 1.25));
      for (let a = 0; a < rows; a++) { const lz = -((rows - 1) * 2.2) / 2 + a * 2.2; flat(0, lz, cols * 1.25 + 0.1, 1.85, 0.22, [0.72, 0.73, 0.75]);
        for (let b = 0; b < cols; b++) flat(-((cols - 1) * 1.25) / 2 + b * 1.25, lz, 1.1, 1.7, 0.25, vary([0.1, 0.15, 0.3], hr, 0.12)); }
    } else if (kind < 0.55) {   // a roof terrace: a wooden deck, planters along it, a parasol
      const dw = W * 0.55, dd = D * 0.5; flat(W * 0.18, -D * 0.18, dw, dd, 0.06, [0.66, 0.47, 0.3]);
      for (let k = 0; k < 3; k++) { const q = P(W * 0.18 - dw / 2 + 0.6 + k * (dw - 1.2) / 2, -D * 0.18 - dd / 2 + 0.4); box(g, q[0], y + 0.06, q[2], 0.7, 0.5, 0.6, rot, [0.6, 0.4, 0.3], vary([0.3, 0.5, 0.2], hr, 0.3), true); }
      const u = P(W * 0.18, -D * 0.12); cone(g, u[0], y + 2.1, u[2], 1.4, 0.5, 6, hr() < 0.5 ? [0.92, 0.9, 0.86] : [0.75, 0.2, 0.18], null, 0);
    } else if (kind < 0.7) { const p = P((hr() - 0.5) * (W - 4), (hr() - 0.5) * (D - 4)); cyl(g, p[0], y, p[2], 0.8, 1.5, 7, [0.62, 0.64, 0.66]); }   // a water tank
  }


  /* ---------------- helpers on track ---------------- */
  let T = null;
  let CROWDS = [];   // the spectator crowds (crowdCtx) of the world being built
  let hash = null, HC = 32;
  function buildHash() {
    hash = new Map();
    for (let i = 0; i < T.N; i++) {
      const k = Math.floor(T.px[i] / HC) + ',' + Math.floor(T.pz[i] / HC);
      let a = hash.get(k); if (!a) { a = []; hash.set(k, a); } a.push(i);
    }
  }
  const _nr = { i: -1, dist: 999, lat: 0, bar: 0 };
  function nearest(x, z) {
    const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
    let bi = -1, bd = 1e18;
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const arr = hash.get((cx + a) + ',' + (cz + b)); if (!arr) continue;
      for (const i of arr) { const dx = x - T.px[i], dz = z - T.pz[i]; const d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
    }
    _nr.i = bi;
    if (bi < 0) { _nr.dist = 999; _nr.lat = 999; _nr.bar = 0; return _nr; }
    _nr.dist = Math.sqrt(bd);
    _nr.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi];
    _nr.bar = _nr.lat > 0 ? T.br[bi] : T.bl[bi];
    return _nr;
  }
  // clearance beyond the barrier (negative = inside corridor)
  function clearance(x, z) { const n = nearest(x, z); if (n.i < 0) return 999; return Math.abs(n.lat) - n.bar; }
  function atS(s, lat) { const i = T.idx(s); return [T.px[i] + T.nx[i] * lat, T.pz[i] + T.nz[i] * lat, T.hd[i], i]; }
  function atSf(s, lat) {   // like atS, but interpolated between samples (for markings narrower than the 2 m sample spacing)
    const L = T.len, f = (((s % L) + L) % L) / T.ds, i = Math.floor(f) % T.N, j = (i + 1) % T.N, t = f - Math.floor(f);
    const x = T.px[i] + (T.px[j] - T.px[i]) * t, z = T.pz[i] + (T.pz[j] - T.pz[i]) * t, nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t;
    return [x + nx * lat, z + nz * lat, T.hd[i], t < 0.5 ? i : j];
  }
  function wrapS(s) { const L = T.len; return ((s % L) + L) % L; }

  /* ---------------- knockable safety-tyre walls and roadside posts (stebrički): the same rules on every track ----------------
     Short red/white 'tstack' walls (5-9 stacks, 1-2 staggered rows) on the outside of the corner exits and at the apexes of the
     tightest bends, and a 'post' every o.post[0..1] m along both verges. Everything stands on the verge:
     w + kerb + rh + 0.3 <= |d| <= bar - rh - 0.15 (skipped where that leaves less than 0.4 m), clear of the other props, the start
     grid, gravel traps (posts) and the asphalt of any other leg. The jitter comes from a hash of the sample index, never from the
     builders' R() (an extra R() call would re-roll all the later scenery). Options: post [min, max] spacing (m) or spots [[i, side]],
     postEdge [a, b] m past the asphalt edge, postCol(i), exits / apexes: how many corner walls (sharpest corners first), wallEdge [a, b],
     stacks [min, max], rows2: share of walls with a second row, maxLat: cap on |d|, floor(q): the verge's height (propFloorTable; then
     only level ground), skip(i, side, x, z, rh): true = not here.
     Returns { posts, stacks, spots } (spots: the o.spots entries that got a post). */
  function rpHash(a, b) { let h = Math.imul(a ^ 0x5bd1e995, 0x9e3779b1) ^ Math.imul((b + 0x7f4a7c15) | 0, 0x85ebca77); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
  function roadsideProps(list, o) {
    const N = T.N, w = T.w, L = T.len, ds = T.ds, CELL = 8, grid = new Map(), res = { posts: 0, stacks: 0, spots: new Set(), nSpots: o.spots ? o.spots.length : 0 };   // (world.propStats, for the tests)
    const RHK = { cone: 0.28, pylon: 0.36, tyre: 0.43, bale: 0.62, crate: 0.5, tstack: 0.43, bstack: 0.9, rbale: 0.62, rbstack: 0.9, post: 0.14 };
    const put = (x, z, r) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(x, z, r); };
    const free = (x, z, r) => { const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);   // clear of every prop already placed (r + its keep-out radius)
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const A = grid.get(a + ',' + b); if (A) for (let k = 0; k < A.length; k += 3) if ((A[k] - x) ** 2 + (A[k + 1] - z) ** 2 < (A[k + 2] + r) ** 2) return false; }
      return true; };
    for (const it of list) put(it.x, it.z, (RHK[it.kind] || 0.6) + 0.4);
    const onGrid = (s) => { if (T.open) return false; let d = s - T.startS; d = ((d % L) + L) % L; return d > L - 112 || d < 12; };   // the start grid
    const band = (i, side, rh) => { const bar = side > 0 ? T.br[i] : T.bl[i]; return [w + (T.curb[i] ? T.curbW : 0) + rh + 0.3, Math.min(bar - rh - 0.15, o.maxLat || 1e9)]; };
    const fits = (i, side, x, z, rh) => {   // also on the verge of the nearest road sample (not on another leg's asphalt, not behind its barrier), and the track's own tests
      const n = nearest(x, z), a = Math.abs(n.lat);
      if (n.i < 0 || a < w + rh + 0.25 || a > n.bar - rh - 0.1) return false;
      if (o.floor) { const d = Math.abs((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]), f0 = o.floor({ i, d: side * (d - rh) }, true), f1 = o.floor({ i, d: side * (d + rh) }, true);
        if (Math.abs(f0 - f1) > 0.15 || f0 + f1 < -1.4) return false; }   // level ground under it (where the verge isn't at road height), not down in a dip
      return !(o.skip && o.skip(i, side, x, z, rh));
    };
    const add = (kind, x, z, yaw, col, i, r) => { list.push({ kind, x, z, yaw, col, i }); put(x, z, r); };
    // tyre walls: the sharpest corners first
    const cs = T.corners.filter(c => c.sev >= 2).sort((a, b) => b.sev - a.sev || b.angle - a.angle || a.i0 - b.i0);
    const wall = (c, apex) => {
      const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, side = apex ? c.dir : -c.dir, sm = ((c.i0 + i1c) / 2) * ds;
      const n = Math.round(lerp(o.stacks[0], o.stacks[1], rpHash(c.i0, apex ? 21 : 22))), gap = 0.95, e = lerp(o.wallEdge[0], o.wallEdge[1], rpHash(c.i0, 23));
      for (const shift of apex ? [0, -4, 4] : [0, 8, 16, 24]) {   // (slide it along if it doesn't fit)
        const s0 = apex ? sm - (n - 1) * gap / 2 + shift : (i1c + 3) * ds + rpHash(c.i0, 24) * 6 + shift, P = [];
        const step = (s, lat, g) => { let st = g; for (let it = 0; it < 3; it++) { const a = atSf(s, side * lat), b = atSf(s + st, side * lat), dd = Math.hypot(b[0] - a[0], b[1] - a[1]); if (dd > 1e-3) st *= g / dd; } return st; };   // (the step along s that puts the next one g metres on: shorter on the outside of a bend, longer on the inside)
        for (let k = 0, s = s0; k < n; k++) {
          if ((T.open && (s < 2 || s > L - 2)) || onGrid(s)) break;
          const i = T.idx(s), [lo, hi] = band(i, side, 0.43); if (hi - lo < 0.4) break;
          const lat = clamp(w + e, lo, hi), [x, z, hd, ii] = atSf(s, side * lat);
          if (!fits(ii, side, x, z, 0.43) || !free(x, z, 0.35)) break;
          P.push({ x, z, hd, ii, k, lat, s }); s += step(s, lat, gap);
        }
        if (P.length < n) continue;
        const P2 = [];   // a second, staggered row behind the first where there is room
        if (rpHash(c.i0, 25) < o.rows2) for (const p of P) { if (p.k === n - 1) break; const lat = p.lat + 0.86, s = p.s + step(p.s, lat, gap / 2), i = T.idx(s), [, hi] = band(i, side, 0.43); if (lat > hi) continue;
          const [x, z, hd, ii] = atSf(s, side * lat); if (fits(ii, side, x, z, 0.43) && free(x, z, 0.35)) P2.push({ x, z, hd, ii, k: p.k }); }
        for (const p of P) add('tstack', p.x, p.z, p.hd + p.k * 0.7, (p.k >> 1) % 2, p.ii, 0.8);
        for (const p of P2) add('tstack', p.x, p.z, p.hd + p.k * 0.7 + 0.35, ((p.k + 1) >> 1) % 2, p.ii, 0.8);
        res.stacks += P.length + P2.length; return true;
      }
      return false;
    };
    let nEx = 0, nAp = 0;
    for (const c of cs) { if (nEx < (o.exits || 0) && wall(c, false)) nEx++; if (c.sev >= 3 && nAp < (o.apexes || 0) && wall(c, true)) nAp++; }
    // roadside posts
    const post = (s, side, k) => {
      const i = T.idx(s), gv = side > 0 ? T.gravR : T.gravL; if ((gv && gv[i]) || onGrid(s)) return false;
      const [lo, hi] = band(i, side, 0.14); if (hi - lo < 0.4) return false;
      const lat = clamp(w + lerp(o.postEdge[0], o.postEdge[1], rpHash(k, side + 31)), lo, hi), [x, z, hd, ii] = atSf(s, side * lat);
      if (!fits(ii, side, x, z, 0.14) || !free(x, z, 0.6)) return false;
      add('post', x, z, hd, o.postCol ? o.postCol(ii) : 0, ii, 0.5); res.posts++; return true;
    };
    if (o.spots) o.spots.forEach((sp, k) => { if (post(sp[0] * ds, sp[1], sp[0] * 2 + (sp[1] > 0 ? 1 : 0))) res.spots.add(sp); });
    else if (o.post) for (const side of [-1, 1]) {
      const s0 = T.open ? 2 : T.startS + 14, s1 = T.open ? L - 2 : T.startS + L - 114;
      for (let s = s0 + (side > 0 ? o.post[0] * 0.5 : 0), k = 0; s < s1; k++) { post(s, side, k * 2 + (side > 0 ? 1 : 0)); s += lerp(o.post[0], o.post[1], rpHash(k, side + 41)); }
    }
    return res;
  }
  // the circuits of the generic builder (Bakreni gozd already has plenty: a light top-up there). Skipped: excluded spots, uneven ground,
  // the Monaco tunnel and the inside of the Fairmont hairpin (a planted island), the pit lane
  const RP_THEME = {
    lake:      { post: [64, 80], postEdge: [1.0, 1.6], exits: 3, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 7], rows2: 0.4 },
    city:      { post: [80, 100], postEdge: [0.9, 1.4], exits: 2, apexes: 0, wallEdge: [2.3, 2.8], stacks: [5, 7], rows2: 0.3 },
    mountain:  { post: [52, 66], postEdge: [0.9, 1.4], exits: 4, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 7], rows2: 0.4 },
    monaco:    { post: [46, 60], postEdge: [0.8, 1.2], exits: 6, apexes: 1, wallEdge: [2.2, 2.7], stacks: [5, 8], rows2: 0.3 },
    forest:    { post: [190, 240], postEdge: [0.9, 1.3], exits: 0, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 6], rows2: 0 },
    italia:    { post: [150, 190], postEdge: [0.9, 1.3], exits: 0, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 6], rows2: 0 },
    kamp:      { post: [150, 190], postEdge: [0.9, 1.3], exits: 0, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 6], rows2: 0 },
  };
  // the verge's real height beyond the asphalt edge, relative to the road (per sample and side, every 0.5 m out to 12 m): the knockable
  // props stand and land on it (Core: Race.setProps(list, floor)). vis(x, z, i, side, o): the visible ground height there, or
  // prof(i, side): the verge's cross-section [[offset, height above the road], ...] (the corridor builders' own verge ribbons).
  // opt.cap(i, side, o): the table's ceiling there (default 0.3 above the road); opt.ex = { f(x, z, ry), on }: where the table can't follow
  // the visible surface (steps at an angle to the track: a deck's edge, the water's edge, a planter), on[a * 2 + side (0 left, 1 right)]
  // marks the segment a..a+1 and the knocked props use f (the surface's absolute height at their own spot, q.x/q.z from Track.query;
  // ry: the road's). floor(q, near): between two samples the rows are blended by q.t; near (or a q without a/t): the nearest sample's row
  // only, which is what the placement test sees (roadsideProps.fits) and where the standing props start (Race.setProps). On the asphalt:
  // 0, or the banking's tilt (Track.bankAt: the Karussell)
  const _pfb = { dy: 0, sl: 0 };
  function propFloorTable(vis, prof, opt) {
    const N = T.N, w = T.w, NE = 25, tab = new Float32Array(N * 2 * NE), cap = opt && opt.cap, EX = opt && opt.ex, TT = T, open = T.open, bank = !!T.bank;
    for (let i = 0; i < N; i++) for (let sd = 0; sd < 2; sd++) { const side = sd ? 1 : -1, ry = T.hasElev ? T.hy[i] : 0, P = prof ? prof(i, side) : null;
      for (let k = 0, m = 0; k < NE; k++) { const o = w + k * 0.5; let y;
        if (P) { while (m < P.length - 2 && P[m + 1][0] < o) m++; const a = P[m], b = P[m + 1]; y = a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); }
        else y = vis(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o, i, side, o) - ry;
        tab[(i * 2 + sd) * NE + k] = Math.min(cap ? cap(i, side, o) : 0.3, y); } }
    return (q, near) => { const e = Math.abs(q.d) - w; if (!(e > 0)) return bank && q.s >= 0 ? TT.bankAt(q.s, q.d, _pfb).dy : 0;
      const f = Math.min(e * 2, NE - 1.001), k = Math.floor(f), u = f - k, sd = q.d > 0 ? 1 : 0;
      if (near || !(q.t >= 0) || !(q.a >= 0 && q.a < N)) { const b = ((q.i >= 0 && q.i < N ? q.i : 0) * 2 + sd) * NE + k; return tab[b] + (tab[b + 1] - tab[b]) * u; }
      const a = q.a; if (EX && EX.on[a * 2 + sd] && q.x !== undefined) { const ry = TT.hasElev ? TT.elevAt(q.s).y : 0; return EX.f(q.x, q.z, ry) - ry; }
      const a1 = a + 1 < N ? a + 1 : open ? a : 0, b = (a * 2 + sd) * NE + k, c = (a1 * 2 + sd) * NE + k, y0 = tab[b] + (tab[b + 1] - tab[b]) * u;
      return y0 + (tab[c] + (tab[c + 1] - tab[c]) * u - y0) * q.t; };
  }
  function trackPropsGeneric(out, excluded, island) {
    const o = RP_THEME[THEME]; if (!o) return null;
    const tu = T.def.tunnel, L = T.len, roadY = (i) => (T.hasElev ? T.hy[i] : 0);
    // the visible ground: the GROUND mesh (its vertices exactly as built above, triangles a,c,b and b,c,d), on the mountain the dirt shoulder
    // above it. Monaco's and the mountain's ground mesh dips under the road edge, so their verge lies up to ~0.9 m below the road: the props
    // get a floor there (they stand and land on the verge). Elsewhere the verge is at road height; spots where it isn't are skipped.
    const B = out.bounds, cell = THEME === 'mountain' ? 6 : 8, drop = THEME === 'monaco' ? 1.0 : THEME === 'mountain' ? 0.8 : 0, mk = T.def.roadSurface === 'makadam';
    const vc = new Map(), vh = (a, b) => { const key = a * 65536 + b; let h = vc.get(key); if (h !== undefined) return h;
      const x = B.minX + a * cell, z = B.minZ + b * cell; h = groundH(x, z); if (drop) { const nn = nearest(x, z); if (nn.i >= 0) h -= drop * (1 - sstep(T.w + 0.3, T.w + 3.5, Math.abs(nn.lat))); } vc.set(key, h); return h; };
    const meshY = (x, z) => { const fx = (x - B.minX) / cell, fz = (z - B.minZ) / cell, a = Math.floor(fx), b = Math.floor(fz), u = fx - a, v = fz - b;
      const hb = vh(a + 1, b), hc = vh(a, b + 1); if (u + v <= 1) { const ha = vh(a, b); return ha + (hb - ha) * u + (hc - ha) * v; } const hd = vh(a + 1, b + 1); return hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v); };
    const vis = (x, z, i, side, off) => { let y = meshY(x, z); if (THEME === 'mountain' && off <= T.w + 2.2) {   // (the shoulder starts at the gravel road's wavy edge)
      const ew = T.w + (mk ? 0.26 * Math.sin(i * 0.37 + side * 1.7) * Math.sin(i * 0.113 + side) + 0.13 * Math.sin(i * 1.31 + side * 2.3) : 0);
      y = Math.max(y, roadY(i) + 0.02 - 1.02 * clamp((off - ew) / (T.w + 2.2 - ew), 0, 1)); } return y; };
    // (+ the red/white kerbs: drawn 0.045..0.085 m above the road from w to w + curbW; a sharp band over the table, not in it, so the
    // 0.5 m interpolation doesn't ramp the verge up to them and the placement test (it stays clear of the kerbs) sees the same floor)
    const kerbs = (f) => (q, near) => { const v = f(q, near), e = Math.abs(q.d) - T.w, a = q.a >= 0 && q.a < T.N ? q.a : q.i >= 0 && q.i < T.N ? q.i : 0;   // (a: the segment a..a+1 its kerb quad is drawn on)
      return e > 0 && e <= T.curbW && T.curb[a] && T.curb[(a + 1) % T.N] ? Math.max(v, 0.045 + 0.04 * e / T.curbW) : v; };   // (drop: never the forest, whose outside kerbs differ)
    // ex(f, near, far): the exact floor f(x, z, ry) on the segments where some lateral point of either end row satisfies near(x, z) (all of
    // them without near; far(i): no point of row i can) (propFloorTable opt.ex)
    const ex = (f, near, far) => { const N = T.N, on = new Uint8Array(N * 2), hit = new Uint8Array(N * 2);
      for (let i = 0; i < N; i++) if (!(far && far(i))) for (let sd = 0; sd < 2; sd++) { const side = sd ? 1 : -1;
        for (let k = 0; k < 25; k++) { const o = side * (T.w + k * 0.5); if (!near || near(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o)) { hit[i * 2 + sd] = 1; break; } } }
      for (let i = 0; i < N; i++) for (let sd = 0; sd < 2; sd++) { const j = i + 1 < N ? i + 1 : T.open ? i : 0; on[i * 2 + sd] = hit[i * 2 + sd] | hit[j * 2 + sd]; }
      return { f, on }; };
    let exM = null;
    if (THEME === 'monaco') {   // Monaco: the ground mesh itself (steep where it drops to the harbour and into the terrace cut into the verge of the
      // Fairmont's high road in, MC_TER), and the planter on the hairpin's island (24-sided, top yr + 0.6, in a kerb ring 0.9 m wide)
      const I = island, yr = I && T.hy ? T.hy[I.i] : 0, sg = TAU / 24, c24 = Math.cos(sg / 2);
      const planter = (x, z) => { if (!I) return -1e9; const dx = x - I.cx, dz = z - I.cz, r = Math.hypot(dx, dz); if (r > I.rI + 1) return -1e9;
        let a = Math.atan2(dz, dx); a -= (Math.floor(a / sg) + 0.5) * sg; const re = r * Math.cos(a) / c24;
        return re <= I.rI ? yr + 0.6 : re <= I.rI + 0.9 ? yr + 0.16 - 0.11 * (re - I.rI) / 0.9 : -1e9; };
      exM = ex((x, z, ry) => Math.max(Math.min(meshY(x, z), ry + 0.3), planter(x, z)));
    }
    const fl = drop ? (out.propFloor = kerbs(propFloorTable(vis, null, { ex: exM }))) : null;
    return out.propStats = roadsideProps(out.props, Object.assign({}, o, { floor: fl, skip: (i, side, x, z, rh) => {
      const s = i * T.ds, d = Math.abs((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]);
      if (excluded(x, z)) return true;
      if (!fl) for (const e of [-rh, 0, rh]) { const o2 = d + e; if (Math.abs(vis(T.px[i] + T.nx[i] * side * o2, T.pz[i] + T.nz[i] * side * o2, i, side, o2) - roadY(i)) > 0.1) return true; }
      if (tu && s > tu[0] * L - 25 && s < tu[1] * L + 20) return true;
      if (island && side === island.sg) { const d = Math.abs(s - island.s); if (Math.min(d, L - d) < 45) return true; }
      return !!(T.def.pit && (T.pitAt(s) || T.pitAt(s + 25) || T.pitAt(s - 25)));
    } }));
  }
  // Pikes Peak: its marker posts become knockable where they fit (spots: [[i, side]] where buildPikes wanted one; the orange snow poles up
  // high too), tyre walls at the hairpin exits. Only within w + 2 (farther out the verge falls away from the road), on level verge; the
  // start and summit areas keep their fixed posts. The props stand on the verge's own height. Drawn out to 150 m (a long open view).
  function pikesProps(out, spots) {
    out.propR = 150;
    const sA = T.startS + 60, sB = T.finishS - 40, w = T.w;
    out.propFloor = propFloorTable(null, (i, side) => {   // (buildPikes' verge: the gravel strip, then the dusty verge lifted onto the ground where it rises)
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, API.pkGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - y)]; };
      return [[w, 0.012], [w + 0.9, -0.02], lift(Math.max(w + 1.5, bar - 2.5), -0.02 - 0.2 * (1 - 2.5 / Math.max(2.6, bar - w - 0.9))), lift(bar, -0.22), lift(bar + 1.4, -0.62)]; });
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.3, 1.7], postCol: (i) => (T.hy[i] > 330 ? 1 : 0), exits: 6, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  // the Nordschleife: posts every 55-75 m, tyre walls at the corner exits, 1.8-2.4 m past the edge (the verge is narrow). Not on the
  // T13 start/finish straight (walls and fences), the bridges, the Karussell bowl and its banked approach, nor on a sloping verge.
  // The props stand on the verge's own height (a little below the road; lifted where the ground rises). Drawn out to 150 m.
  function nringProps(out, t13, onBridge, inKar) {
    out.propR = 150;
    const w = T.w;
    out.propFloor = propFloorTable(null, (i, side) => {   // (buildNring's verge rows: grass a little below the road, lifted onto the ground where it rises; the banking)
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i] + nrBankY(i, side * w), lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      return [[w, 0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)].map(([o, h]) => [o, h + nrBankY(i, side * o)]); },
      { cap: (i, side, o) => 0.3 + Math.max(0, nrBankY(i, side * o)) });   // (the ceiling rides up with the banked outer verge of the Karussell)
    const N = T.N, banked = (i) => { if (!T.bank) return false; for (let d = -14; d <= 14; d += 2) if (T.bank[(i + d + N) % N] > 0) return true; return false; };
    return out.propStats = roadsideProps(out.props, { post: [55, 75], postEdge: [1.8, 2.4], exits: 24, apexes: 3, wallEdge: [1.8, 2.4], stacks: [5, 7], rows2: 0.25,
      floor: out.propFloor, skip: (i) => t13(i) || onBridge(i) || inKar(i) || banked(i) });
  }

  let THEME = 'lake', SEA = null, RIVER = null, RW = 26, CASTLE = null;
  // the circuits in the look of the stylised top-down racer (Bakreni gozd, Toskana, Gromski rt): open stands, tyre walls round the corners,
  // armco with a light catch fence, no gantry, dirt shoulders, a pit lane with crews; each theme adds its own scenery (see the CS builder)
  let CSX = false;
  function distRiver(x, z) {   // distance to the river centre line (polyline)
    let best = 1e9;
    for (let k = 0; k < RIVER.length - 1; k++) {
      const [ax, az] = RIVER[k], [bx, bz] = RIVER[k + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), ex = ax + dx * t - x, ez = az + dz * t - z;
      best = Math.min(best, ex * ex + ez * ez);
    }
    return Math.sqrt(best);
  }
  /* ---------------- lake ---------------- */
  const LAKE = { cx: -96, cz: 96, rx: 80, rz: 50 };
  const ISL = { x: -104, z: 92, r: 10 };
  function lakeEdge(th) { return 1 + 0.11 * Math.sin(3 * th + 1.1) + 0.07 * Math.sin(5 * th + 2.3) + 0.04 * Math.sin(8 * th); }
  function lakeSD(x, z) { // approx signed distance in meters (negative inside)
    if (THEME !== 'lake') return 1e4;
    const dx = (x - LAKE.cx) / LAKE.rx, dz = (z - LAKE.cz) / LAKE.rz;
    const r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
    return (r - lakeEdge(th)) * Math.min(LAKE.rx, LAKE.rz);
  }
  let hillN = null, mtnN = null, mtnN2 = null, mtnPeak = null, MF = null;
  function mfSample(arr, x, z) {   // bilinear lookup in the precomputed mountain field
    const f = MF; let gx = (x - f.x0) / f.cell, gz = (z - f.z0) / f.cell;
    gx = clamp(gx, 0, f.nx - 1.001); gz = clamp(gz, 0, f.nz - 1.001);
    const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = f.nx;
    const a = arr[j * W + i], b = arr[j * W + i + 1], c = arr[(j + 1) * W + i], d = arr[(j + 1) * W + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  // Mountain terrain: the road is cut into rolling forested hills. Near the road the ground sits at
  // road height (a flat shelf a car can run onto); farther out it climbs into hills and tall peaks.
  function mountainH(x, z) {
    if (!T.hy) return 0;
    const n = nearest(x, z);
    const fb = MF ? mfSample(MF.hb, x, z) : 0;               // smooth average of nearby road heights
    let base, dist;
    if (n.i >= 0) {                                           // near the road: exact road height, easing into the smooth field
      dist = Math.max(0, Math.abs(n.lat) - n.bar);
      base = lerp(T.hy[n.i], fb, sstep(6, 45, dist));
    } else {                                                  // beyond the hash search radius: field only (no drop to 0)
      dist = MF ? Math.max(0, mfSample(MF.hd, x, z) - (T.w + 6)) : 200;
      base = fb;
    }
    const roll = mtnN(x, z) * 0.62 + mtnN2(x, z) * 0.38;    // 0..1 rolling relief
    const peak = Math.max(0, mtnPeak(x, z) - 0.5) / 0.5;    // sparse peak mask 0..1
    const hills = (6 + 42 * roll) * sstep(3, 58, dist) + peak * peak * 150 * sstep(70, 190, dist);
    return base + hills;
  }
  // ---- Monaco terrain: follows the circuit (Beau Rivage climbs to the Casino at ~40 m), keeps rising inland,
  // drops into Port Hercule and the sea (water plane at y = 0), and the Rock of Monaco-Ville stands ~55 m high south of the port.
  // (metres, origin Sainte-Dévote, x east, z south)
  const MC_WATER = [[145.4,79.8],[300.6,78.2],[447.7,79.8],[496.7,76.5],[545.7,68.4],[619.2,63.5],[692.8,53.7],[766.3,35.7],[833.3,7.9],[892.1,-28.0],[950.9,-68.9],[999.9,-108.1],[1042.4,-145.7],[1071.8,-178.4],[1084.9,-214.3],[1117.6,-263.3],[1182.9,-328.7],[1967.2,-328.7],[1967.2,1109.2],[-810.4,1109.2],[-810.4,733.4],[-124.2,725.2],[366.0,700.7],[464.0,619.0],[398.7,540.6],[218.9,504.6],[88.2,488.3],[58.8,471.9],[53.9,431.1],[42.5,400.0],[31.0,360.8],[22.9,324.9],[18.0,292.2],[26.1,256.3],[34.3,207.2],[47.4,161.5],[57.2,132.1],[70.3,109.2],[91.5,92.9]];   // harbour + sea, traced from the circuit map (the quay runs right behind the barriers)
  const MC_ROCK = { x0: -124.2, x1: 447.7, z0: 501.3, z1: 703.9, h: 55 };
  let MC_TER = null;   // terrace under the Fairmont hairpin's retaining wall (set per build)
  function inPoly(poly, x, z) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
  function polyDist(poly, x, z) { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0], az = poly[j][1], vx = poly[i][0] - ax, vz = poly[i][1] - az, l2 = vx * vx + vz * vz || 1; const t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; }

  /* ---------------- water (every lake, sea, river and pond; Pikes Peak's mountain lake and creek have shaders of their own): the sky mirrored in it
     (more of it where the view grazes the water: a Fresnel term; the race's sky, WSKY, which the renderer sets every frame), trains of wavelets
     across it (longer on the sea: they ruffle the normal, so the sun glints off them where no shadow falls; calm far off, so nothing shimmers),
     and along the shore a band of its own (shoreBand: drawn over the water, with the same waves) with paler shallows, the foam lapping at the
     waterline and on a beach the surf rolling in. The texture's scrolling offset (out.dyn.water) is the clock: every wave turns a whole number
     of times per wrap, so nothing jumps ---------------- */
  const WSKY = { top: { value: new THREE.Color(0.45, 0.62, 0.86) }, hor: { value: new THREE.Color(0.8, 0.86, 0.9) } };
  // the Eau Rouge brook's water (Spa): iron-red, flowing downstream (faster where the stream is steep), ripples, the sky mirrored in it (a
  // Fresnel term), white water on the steep runs and by the culverts, a line of ripples along the banks. The uv of its quads: x the place
  // across (0 .. 1) plus twice ten times the stream's steepness there (whole), y the metres along it
  function brookMat(U) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = U.uT; sh.uniforms.uWTop = WSKY.top; sh.uniforms.uWHor = WSKY.hor;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBr; varying vec3 vBw;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvBr = uv; vBw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT; uniform vec3 uWTop; uniform vec3 uWHor; varying vec2 vBr; varying vec3 vBw;\n' +
          'float bh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float bn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bh(i), bh(i + vec2(1.0, 0.0)), f.x), mix(bh(i + vec2(0.0, 1.0)), bh(i + vec2(1.0, 1.0)), f.x), f.y); }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float st = floor(vBr.x * 0.5) / 10.0, u = fract(vBr.x * 0.5) * 2.0, fl = vBr.y - uT * (0.7 + 2.4 * st);' +
          ' float n1 = bn(vec2(u * 2.2, fl * 0.75)), n2 = bn(vec2(u * 5.0 + 4.0, fl * 2.1 - uT * 0.4)), n = 0.6 * n1 + 0.4 * n2;' +
          ' vec3 V = normalize(cameraPosition - vBw); float ct = clamp(V.y, 0.0, 1.0), fr = 0.03 + 0.97 * pow(1.0 - ct, 5.0); vec3 sky = mix(uWHor, uWTop, 0.35 + 0.65 * ct);' +
          ' float edge = smoothstep(0.6, 0.97, abs(u * 2.0 - 1.0)), rip = smoothstep(0.56, 0.86, n) * (0.35 + 0.65 * st + 0.4 * edge);' +
          ' float foam = clamp(smoothstep(0.3, 0.8, st) * smoothstep(0.42, 0.7, n2) + edge * smoothstep(0.7, 0.92, n1) * 0.5, 0.0, 1.0);' +
          ' diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - 0.45 * fr), vec3(0.92, 0.9, 0.84), foam * 0.85);' +
          ' totalEmissiveRadiance += sky * fr * 0.6 * (1.0 - foam) + vec3(0.9, 0.85, 0.75) * rip * 0.12; }');
    };
    m.customProgramCacheKey = () => 'brook1';
    return m;
  }
  const W_WAV = [[0.8, 0.6, 3.1, 14, 0.028], [-0.5, 0.87, 1.9, 19, 0.018], [0.97, -0.26, 1.2, 29, 0.01], [-0.9, -0.44, 0.75, 41, 0.006]];   // [direction x, z, length (m), turns per wrap, height (m)]
  // o: color, vc (vertex colours), len (the waves' length: 1 a lake, 2.4 the sea), amp (their steepness), refl (the most of the sky mirrored), land (how much of
  // the view low over the water mirrors the land round it, dark, instead of the sky's horizon: a lake among trees, 0..1), shal (the shallows' paler tint, 0..1),
  // lap (the foam lapping at the waterline, 0..1), surf (the surf rolling in, 0..1), band (the shore band's copy: its 'shore' attribute, metres from the waterline)
  function waterMat(tex, o) {
    o = o || {};
    const f3 = (v) => (+v).toFixed(3), L = o.len || 1, A = o.amp == null ? 1 : o.amp, band = !!o.band, refl = o.refl || 0.55, shal = o.shal == null ? 0.5 : o.shal, surf = o.surf || 0, land = o.land || 0, lap = o.lap == null ? 1 : o.lap, sky = o.sky || null;   // (sky: { tex: rioSkyTex's skyline, col: the haze's colour }: the mountains mirrored)
    const wav = W_WAV.map(([dx, dz, l, n, a]) => { const f = TAU / (l * L);
      return 'wG += ' + f3(a * L * f * A) + ' * vec2( ' + f3(dx) + ', ' + f3(dz) + ' ) * cos( dot( wP, vec2( ' + f3(dx * f) + ', ' + f3(dz * f) + ' ) ) + wPh * ' + Math.max(1, Math.round(n / Math.sqrt(L))) + '.0 );'; }).join('\n');
    const m = new THREE.MeshPhongMaterial({ map: o.plain ? null : tex.water, color: o.color == null ? 0xffffff : o.color, vertexColors: !!o.vc, shininess: 30, specular: 0 });   // (o.plain: no picture, the colour alone: a muddy river)
    if (band) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -4 });   // (over the water under it, never over the shore)
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWTop = WSKY.top; sh.uniforms.uWHor = WSKY.hor;
      if (o.plain) sh.uniforms.uWT = { get value() { return tex.water.offset.x; } };   // (no picture, no uvTransform: the waves' clock straight from the picture's drift)
      if (sky) { sh.uniforms.uWSkT = { value: sky.tex }; sh.uniforms.uWSkC = { value: sky.col }; }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWw;\nvarying float vWt;' + (o.plain ? '\nuniform float uWT;' : '') + (band ? '\nattribute float shore;\nvarying float vWs;' : ''))
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWw = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;\nvWt = ' + (o.plain ? 'uWT' : 'uvTransform[ 2 ].x') + ';' + (band ? '\nvWs = shore;' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', ['#include <common>', 'varying vec3 vWw;', 'varying float vWt;', band ? 'varying float vWs;' : '', 'uniform vec3 uWTop;', 'uniform vec3 uWHor;', sky ? 'uniform sampler2D uWSkT;\nuniform vec3 uWSkC;' : '',
        'float wHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }',
        'float wNoise( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f ); return mix( mix( wHash( i ), wHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( wHash( i + vec2( 0.0, 1.0 ) ), wHash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y ); }'].join('\n'))
        .replace('#include <color_fragment>', ['#include <color_fragment>', 'float wS = ' + (band ? 'vWs' : '40.0') + ';',   // (metres from the waterline)
          'diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * vec3( 1.22, 1.32, 1.15 ) + vec3( 0.02, 0.035, 0.03 ), ' + f3(shal) + ' * ( 1.0 - smoothstep( 0.5, 7.0, wS ) ) );'].join('\n'))
        .replace('#include <normal_fragment_maps>', ['#include <normal_fragment_maps>', 'float wPh = 6.2831853 * vWt;', 'vec2 wG = vec2( 0.0 );',
          'vec2 wP = vWw.xz + vec2( sin( vWw.z * ' + f3(0.21 / L) + ' + wPh * 2.0 ), sin( vWw.x * ' + f3(0.17 / L) + ' - wPh * 3.0 ) ) * ' + f3(1.6 * L) + ';',   // (the wave fronts bent: no regular lattice)
          wav,
          'wG *= ( 1.0 - smoothstep( 50.0, 220.0, length( vWw - cameraPosition ) ) ) * ( 0.35 + 0.65 * smoothstep( 0.0, 4.0, wS ) );',   // (calm far off, and in the foam)
          'normal = normalize( ( viewMatrix * vec4( -wG.x, 1.0, -wG.y, 0.0 ) ).xyz );'].join('\n'))
        .replace('#include <envmap_fragment>', ['#include <envmap_fragment>',
          '{ vec3 wV = normalize( vViewPosition ), wR = reflect( -wV, normal ), wRw = ( vec4( wR, 0.0 ) * viewMatrix ).xyz;',
          '  float wF = pow( 1.0 - clamp( dot( normal, wV ), 0.0, 1.0 ), 4.0 );',
          '  vec3 wL = ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse ) / max( diffuseColor.rgb, vec3( 0.03 ) );',   // (the light falling here: the foam's)
          '  vec3 wSk = mix( mix( uWHor, uWTop, smoothstep( 0.0, 0.4, wRw.y ) ), uWHor * vec3( 0.22, 0.27, 0.22 ), ' + f3(land) + ' * ( 1.0 - smoothstep( 0.04, 0.3, wRw.y ) ) );',   // (the sky, the land low round it)
          sky ? '  { vec4 wK = texture2D( uWSkT, vec2( fract( atan( wRw.x, -wRw.z ) / 6.2831853 ), 0.5 ) ); float wE = asin( clamp( wRw.y, 0.0, 1.0 ) ), wA = wK.r * 0.17453;' +   // (the skyline over this azimuth, mirrored: the mountains, then the sky)
            ' wSk = mix( wSk, uWSkC * mix( vec3( 0.42, 0.52, 0.45 ), vec3( 0.8, 0.85, 0.9 ), wK.g ), 0.92 * ( 1.0 - smoothstep( wA - 0.004, wA + 0.004, wE ) ) ); }' : '',
          '  outgoingLight = mix( outgoingLight, wSk, clamp( 0.02 + 0.9 * wF, 0.0, ' + f3(refl) + ' ) );',
          '#if NUM_DIR_LIGHTS > 0',   // the sun's glints (none in a shadow: how much of its light reaches the water here)
          '  vec3 wU = max( dot( normal, directionalLights[ 0 ].direction ), 0.0 ) * directionalLights[ 0 ].color * diffuseColor.rgb;',
          '  float wSh = clamp( dot( reflectedLight.directDiffuse, vec3( 1.0 ) ) / max( dot( wU, vec3( 1.0 ) ), 1e-4 ), 0.0, 1.0 ), wSd = max( dot( wR, directionalLights[ 0 ].direction ), 0.0 );',
          '  outgoingLight += directionalLights[ 0 ].color * wSh * ( 0.07 * pow( wSd, 8.0 ) + 1.1 * pow( wSd, 160.0 ) );',
          '#endif',
          band ? ['  float wN = wNoise( vWw.xz * 0.55 ) * 0.6 + wNoise( vWw.xz * 1.7 + 7.3 ) * 0.4;',
            '  float wFl = ' + f3(lap) + ' * ( 1.0 - smoothstep( 0.05, ' + f3(0.4 + 0.8 * lap) + ', wS + 0.3 * sin( wPh * 7.0 + ( vWw.x - vWw.z ) * 0.33 ) ) );',   // the foam lapping at the waterline
            '  float wFb = ' + f3(surf) + ' * smoothstep( 0.3, 0.85, sin( wS * 1.15 + wPh * 23.0 + wN * 1.8 ) ) * ( 1.0 - smoothstep( 2.0, 9.0, wS ) ) * smoothstep( 0.3, 1.2, wS );',   // the surf rolling in
            '  outgoingLight = mix( outgoingLight, vec3( 0.88, 0.9, 0.92 ) * wL, 0.85 * smoothstep( 0.3, 0.75, max( wFl, wFb ) * ( 0.2 + 1.0 * wN ) ) );'].join('\n') : '',
          '}'].join('\n'));
    };
    m.customProgramCacheKey = () => 'water|' + [L, A, refl, land, shal, lap, surf, band, !!sky].join('|') + (o.plain ? '|plain' : '');
    return m;
  }
  // the waterline on a terrain grid at the water level y (the ground's height h(i, j) at (x0 + i c, z0 + j c), every cell split as the terrain meshes
  // are: (i, j) (i, j+1) (i+1, j) and (i+1, j) (i, j+1) (i+1, j+1)) over the cells [i0, i1) x [j0, j1): its segments, and sd(x, z), the distance to the
  // nearest (up to 24 m), + where the ground lies below the water (outside the cells: open water)
  function waterline(h, x0, z0, c, i0, i1, j0, j1, y) {
    const H = 16, R = 24, hash = new Map(), key = (a, b) => a * 65536 + b, P = [];
    const cut = (xa, za, da, xb, zb, db) => { if ((da > 0) !== (db > 0)) { const t = da / (da - db); P.push(xa + (xb - xa) * t, za + (zb - za) * t); } };
    const tri = (xa, za, da, xb, zb, db, xc, zc, dc) => { P.length = 0; cut(xa, za, da, xb, zb, db); cut(xb, zb, db, xc, zc, dc); cut(xc, zc, dc, xa, za, da);
      if (P.length !== 4) return; const k = key(Math.floor((P[0] + P[2]) / 2 / H), Math.floor((P[1] + P[3]) / 2 / H)); let Lc = hash.get(k); if (!Lc) hash.set(k, Lc = []); Lc.push(P[0], P[1], P[2], P[3]); };
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const a = h(i, j) - y, b = h(i + 1, j) - y, e = h(i, j + 1) - y, d = h(i + 1, j + 1) - y, xa = x0 + i * c, za = z0 + j * c;
      if ((a > 0 && b > 0 && e > 0 && d > 0) || (a <= 0 && b <= 0 && e <= 0 && d <= 0)) continue;
      tri(xa, za, a, xa, za + c, e, xa + c, za, b); tri(xa + c, za, b, xa, za + c, e, xa + c, za + c, d);
    }
    const depth = (x, z) => { const gx = (x - x0) / c, gz = (z - z0) / c; if (gx < i0 || gz < j0 || gx >= i1 || gz >= j1) return 1;
      const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, a = h(i, j), d = h(i + 1, j + 1);
      return y - (u + v <= 1 ? a + u * (h(i + 1, j) - a) + v * (h(i, j + 1) - a) : d + (1 - u) * (h(i, j + 1) - d) + (1 - v) * (h(i + 1, j) - d)); };
    return (x, z) => {
      let best = R * R; const a0 = Math.floor(x / H), b0 = Math.floor(z / H);
      for (let b = b0 - 2; b <= b0 + 2; b++) for (let a = a0 - 2; a <= a0 + 2; a++) { const Lc = hash.get(key(a, b)); if (!Lc) continue;
        for (let q = 0; q < Lc.length; q += 4) { const ax = Lc[q], az = Lc[q + 1], vx = Lc[q + 2] - ax, vz = Lc[q + 3] - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, dd = dx * dx + dz * dz; if (dd < best) best = dd; } }
      return Math.sqrt(best) * (depth(x, z) > 0 ? 1 : -1);
    };
  }
  // the band of water along a shore (waterMat's band copy draws it over the water): cells of F m (a quadtree over the box) wherever the waterline is near,
  // from 3 m in under the land to 10 m out on the water (sd(x, z): metres from it, + on the water; lip: how much faster than a true distance it may change),
  // nothing elsewhere; every vertex has its distance ('shore', -2..10) and uv in metres / uvS as the water under it (col(x, z): its vertex colour too)
  function shoreBand(x0, z0, x1, z1, y, sd, uvS, o) {
    o = o || {};
    const F = o.F || 4, SM = 10, lip = o.lip || 1.1, col = o.col || null, pos = [], sh = [], uv = [], cl = [], idx = [], vm = new Map();
    const vert = (x, z) => { const k = Math.round(x * 4) * 100003 + Math.round(z * 4); let v = vm.get(k);
      if (v === undefined) { v = sh.length; vm.set(k, v); pos.push(x, y, z); sh.push(clamp(sd(x, z), -2, SM)); uv.push(x / uvS, -z / uvS); if (col) cl.push(...col(x, z)); }
      return v; };
    const cell = (x, z, s) => {
      const c = sd(x + s / 2, z + s / 2), hd = s * 0.71 * lip;
      if (c - hd > SM || c + hd < -3) return;   // (open water: the water under it; or deep under the land)
      if (s > F) { const q = s / 2; cell(x, z, q); cell(x + q, z, q); cell(x, z + q, q); cell(x + q, z + q, q); return; }
      const a = vert(x, z), b = vert(x + s, z), cc = vert(x + s, z + s), d = vert(x, z + s);
      idx.push(a, d, cc, a, cc, b);   // (facing up)
    };
    const S = F * 16;
    for (let z = z0; z < z1; z += S) for (let x = x0; x < x1; x += S) cell(x, z, S);
    if (!idx.length) return null;
    const g = new THREE.BufferGeometry(), n = sh.length, nrm = new Float32Array(n * 3); for (let k = 0; k < n; k++) nrm[k * 3 + 1] = 1;
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('shore', new THREE.Float32BufferAttribute(sh, 1));
    if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere();
    return g;
  }
  // several shore bands in one geometry (one draw for all the ponds of a world)
  function mergeBands(list) {
    list = list.filter(Boolean); if (list.length < 2) return list[0] || null;
    const names = Object.keys(list[0].attributes), out = new THREE.BufferGeometry(), idx = []; let base = 0;
    for (const nm of names) { const it = list[0].attributes[nm].itemSize, arr = new Float32Array(list.reduce((n, g) => n + g.attributes[nm].count * it, 0)); let o = 0;
      for (const g of list) { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; } out.setAttribute(nm, new THREE.BufferAttribute(arr, it)); }
    for (const g of list) { const I = g.index.array; for (let k = 0; k < I.length; k++) idx.push(I[k] + base); base += g.attributes.position.count; g.dispose(); }
    out.setIndex(base > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); out.computeBoundingSphere();
    return out;
  }
  // the shore band as a mesh of the world (a copy of the water's material with the band's attributes; lit, no shadow of its own)
  function addShore(root, g, wm, o) {
    if (!g) return null;
    const m = new THREE.Mesh(g, waterMat({ water: wm.map }, Object.assign({}, o, { band: true, color: wm.color.getHex(), vc: !!g.attributes.color })));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m;
  }
  function monacoH(x, z) {
    const r = MC_ROCK, inRock = x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
    if (!inRock && inPoly(MC_WATER, x, z)) return -0.6 - 5 * sstep(0, 14, polyDist(MC_WATER, x, z));   // harbour / sea floor
    const n = nearest(x, z), fb = MF ? mfSample(MF.hb, x, z) : 0;
    let base, dist;
    if (n.i >= 0) { dist = Math.max(0, Math.abs(n.lat) - n.bar); base = lerp(T.hy[n.i], fb, sstep(4, 40, dist)); }
    else { dist = MF ? Math.max(0, mfSample(MF.hd, x, z) - (T.w + 6)) : 200; base = fb; }
    let h = Math.max(1.4, base);                                                   // quays stand above the water
    const coastD = polyDist(MC_WATER, x, z);
    h += sstep(25, 260, dist) * sstep(20, 200, coastD) * (16 + 34 * sstep(-80, -650, z));   // the hillside behind keeps climbing inland
    if (x > r.x0 - 30 && x < r.x1 + 30 && z > r.z0 - 30 && z < r.z1 + 30) {       // the Rock: flat top, steep cliffs
      const e = Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
      h = Math.max(h, r.h * sstep(-4, 20, e));
    }
    // below the Fairmont hairpin's retaining wall: a terrace at the level of the road out, so the high road in stands on a real stone wall
    if (MC_TER && Math.hypot(x - MC_TER.x, z - MC_TER.z) < MC_TER.r) h = Math.min(h, MC_TER.h);
    return h;
  }
  // forest circuit: flat around the road, low rocky mounds under the boulder formations, a grassy hill in the bottom of the V,
  // and the lake to the north (its bed drops away below the water plane right behind the rocky shore)
  function forestRockH(x, z, c) {
    const fd = T && T.def; if (!fd || !fd.rocks) return 0;
    let h = 0; for (const [rx, rz, rr] of fd.rocks) { const d = Math.hypot(x - rx, z - rz); if (d < rr * 1.7) h = Math.max(h, (1.8 + rr * 0.2) * sstep(rr * 1.7, rr * 0.35, d)); }
    return h * sstep(5, 16, c);
  }
  function forestH(x, z) {
    const fd = T && T.def; if (!fd || !(fd.rocks || fd.lake || fd.hill)) return 0;
    const c = clearance(x, z);
    let h = forestRockH(x, z, c);
    if (fd.hill) for (const [hx, hz, hr, hh] of fd.hill) { const d = Math.hypot(x - hx, z - hz); if (d < hr) h = Math.max(h, hh * sstep(hr, hr * 0.2, d) * sstep(3, 13, c)); }
    if (fd.lake && inPoly(fd.lake, x, z)) h = Math.min(h, -0.4 - 4.5 * sstep(0, 10, polyDist(fd.lake, x, z)));
    return h;
  }
  const lakeFO = (x, z) => { const fd = T && T.def; return !!(fd && fd.lake && inPoly(fd.lake, x, z)); };
  const shoreFO = (x, z) => { const fd = T && T.def; return fd && fd.lake ? polyDist(fd.lake, x, z) * (inPoly(fd.lake, x, z) ? -1 : 1) : 1e4; };   // signed distance to the lake shore (negative in the water)
  function groundH(x, z) {
    if (THEME === 'city') return SEA && z > SEA.z + 8 ? -2.4 * sstep(SEA.z + 8, SEA.z + 26, z) : 0;
    if (THEME === 'mountain') return mountainH(x, z);
    if (THEME === 'monaco') return monacoH(x, z);
    if (CSX) return forestH(x, z);
    let h = 0;
    const sd = lakeSD(x, z);
    if (sd < 2) h = -1.7 * sstep(-1, 7, -sd);
    const di = Math.hypot(x - ISL.x, z - ISL.z);
    if (di < ISL.r + 8) h = Math.max(h, lerp(-1.7, 0.9, sstep(ISL.r + 7, ISL.r - 3, di)));
    if (sd > 8) {
      const c = clearance(x, z);
      if (c > 40) h += hillN(x, z) * 10 * sstep(40, 110, c);
    }
    return h;
  }
  function valueNoise2(seed, scale) {
    const r = rng(seed), P = 64, g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, z) => {
      x /= scale; z /= scale; const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
      const I = (a, b) => g[(((b % P) + P) % P) * P + (((a % P) + P) % P)];
      const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
      return lerp(lerp(I(xi, zi), I(xi + 1, zi), u), lerp(I(xi, zi + 1), I(xi + 1, zi + 1), u), v);
    };
  }

  /* ---- the seam where a road's asphalt gives way to gravel along it (Medvode: the castle road): not a straight line across the road but a worn
     transition, one overlay over each seam (gravelSeams). Its masks, back m on the asphalt and fwd m on the gravel, 2w across (one tile for every
     seam, mirrored on every other one; all the noise seeded, the same on every build):
       mask   R the sand film (the gravel's own, fine) spilt over the asphalt, G the asphalt's cover (carried on over the gravel), B gravel over it
       prints R the tyres' lanes in the sand, G where across a lane, B the sand's colour (patches), A the sand heaped at the lanes' edges
     The asphalt: opaque over the last metre before the seam (the joint of the road's meshes never shows), past it worn into tongues along the four
     wheel tracks (cleanest in them), soft-edged patches between, fewer and smaller on to fwd m; the gravel reaching back over the seam between
     the tracks and dragged out onto the asphalt in long streaks between and beside them (the tracks themselves kept clear). The sand: a thin
     film ~5 m onto the asphalt, its front in broad lobes, cloudy and patchy, a little thinner in the wheel tracks, more by the edges; in it two
     pairs of tyre lanes wandering slowly, 3.5-5.5 m long, where the sand is pressed darker (damp), dry and paler beside them ---- */
  function gravelSeamMasks(w, wr, back, fwd) {
    const MW = 256, MH = 512, len = back + fwd, W2 = 2 * w, W2r = 2 * wr, M1 = new Uint8Array(MW * MH * 4), M2 = new Uint8Array(MW * MH * 4);   // (wr: the road's real half width at the seam)
    const n1 = valueNoise2(9811, 1.7), n2 = valueNoise2(9812, 0.55), n3 = valueNoise2(9813, 0.3), n4 = valueNoise2(9814, 1.25), n5 = valueNoise2(9815, 0.45);
    const TRK = [0.2, 0.36, 0.64, 0.8];   // (the four wheel tracks, shares of the width)
    const tracks = (pp, wb, s) => { let m = 0; for (const c of TRK) m = Math.max(m, Math.exp(-(((pp - c - wb) / s) ** 2))); return m; };
    const wb0 = 0.025 * (2 * n2(0, 3.1) - 1);
    for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) {
      const X = (px + 0.5) / MW * W2, d = (py + 0.5) / MH * len - back, pp = X / W2, Xr = pp * W2r;   // across (m), how far onto the gravel (m; < 0 on the asphalt)
      const endF = 1 - sstep(0.7 * fwd, fwd, d), wb = 0.025 * (2 * n2(d * 0.6, 3.1) - 1);   // (nothing left at the overlay's end; the tracks wander a little)
      let a, b = 0;
      if (d < 0) a = sstep(-1.2, -0.05, d);   // the asphalt: the overlay's own fading in over the road's, opaque by the seam
      else {   // past the seam: tongues along the wheel tracks, patches between, a little more at the edges and on the crown
        const q = 0.65 * n4(X + 11, d) + 0.35 * n5(X, d + 3), g = Math.pow(Math.min(1, d / fwd), 0.8), tk = tracks(pp, wb, 0.04), ed = sstep(0.75, 1, Math.abs(2 * pp - 1)), md = Math.exp(-(((pp - 0.5) / 0.09) ** 2));
        const t = 0.55 + 0.45 * g - 0.75 * (1 - 0.35 * g) * tk + 0.3 * ed * sstep(0, 0.3, g) + 0.14 * md * sstep(0, 0.2, g);
        a = sstep(t - 0.2, t + 0.2, q) * endF;
      }
      let S = 0;   // the gravel between the tracks reaching back over the seam, its front ragged
      if (d < 0.6) { const fa = -1.0 - 0.45 * (2 * n2(X * 1.3, 8.8) - 1) - 0.25 * (2 * n3(X * 2.3, 1.7) - 1); S = (1 - sstep(0.25, 0.75, tracks(pp, wb, 0.06))) * sstep(fa - 0.3, fa + 0.3, d) * (1 - sstep(0.2, 0.6, d)); }
      S *= endF; { const A = a + S * (1 - a); b = A > 0 ? S / A : 0; a = A; }
      {   // the gravel dragged out onto the asphalt by the tyres: thin streaks along the road (warped across, unevenly spaced), fewer further from the seam, none in the tracks
        const Lx = 4 * (0.55 + 0.9 * n1(X * 1.2, 21.7)), F = Math.pow(Math.min(1, Math.max(0, 1 + (d - 0.2) / Lx)), 0.7) * (1 - sstep(0.1, 1.6 + 0.8 * n2(X * 1.5, 31.3), d));
        const Xw = X + 0.45 * (2 * n2(X * 0.7 + 3, 17.1) - 1) + 0.2 * (2 * n4(X * 1.9, 5.5) - 1);
        const q = 0.55 * n3(Xw * 1.1, d * 0.12 + 5) + 0.25 * n5(Xw * 0.88 + 4, d * 0.2) + 0.2 * n1(Xw * 0.9, d * 0.3 + 2), th = 0.53 + 0.3 * (1 - F) + 0.3 * (n2(Xw * 0.5 + 8, 2.2) - 0.5);
        const St = 0.8 * sstep(th - 0.05, th + 0.05, q) * F * (1 - 0.9 * tracks(pp, wb, 0.06)) * endF;
        if (St > 0) { const A = a + St * (1 - a); b = (St + b * a * (1 - St)) / A; a = A; }
      }
      // the sand film: its reach in broad lobes across (longer by the edges), the front ragged in the small too, cloudy and patchy
      const ed = sstep(0.5, 1, Math.abs(2 * pp - 1)), lob = 0.45 * n4(Xr * 0.7 + 23, 4.4) + 0.3 * n2(Xr * 0.42 + 9, 8.1) + 0.25 * n3(Xr * 0.5 + 4, 1.7), Lr = Math.min(back - 0.4, 5 * 2 * lob * (1 + 0.35 * ed));
      const dj = d + 0.45 * (2 * n5(Xr * 1.1 + 2, d * 0.6 + 3) - 1), u = dj < 0 ? Math.max(0, 1 + dj / Lr) : 1, fr = sstep(0, 0.4, u) * (0.66 + 0.34 * u);
      const cl = 0.55 * n3(Xr * 0.75 + 7, d * 0.75 + 3) + 0.45 * n5(Xr * 0.9 + 1, d * 0.8 + 13), pt = n1(Xr * 0.9 + 3, d * 0.7 + 9);
      const fm = 0.8 * fr * (1 - 0.3 * (1 - sstep(0.28, 0.72, cl))) * (1 - 0.28 * (1 - sstep(0.3, 0.7, pt))) * (1 - 0.1 * tracks(pp, wb0, 0.06)) * lerp(0.85, 1.25, ed);
      let ln = 0, lp = 0.5, best = 1e9, rg = 0;
      for (let k = 0; k < 4; k++) {   // the tyres' lanes in it: two pairs, each pair wandering together and each lane a little on its own, wider by the seam
        const pr = k >> 1, xc = (TRK[k] + wb0) * W2r + 0.09 * (2 * n1(d * 0.5 + 11 + pr * 7.7, 3.3 + pr) - 1) + 0.0315 * (2 * n5(d * 0.35 + k * 4.1, 9.9) - 1);
        const hw = 0.25 * (0.85 + 0.3 * n4(d * 0.6 + k * 5.3, 2.2 + k)) * (1 + 0.6 * sstep(-1.8, 0, d)), dx = Xr - xc, adx = Math.abs(dx);
        const Lt = 5.6 * (0.65 + 0.7 * n2(k * 3.7 + 1, 6.6)), on = sstep(-Lt, -Lt + 2.8, d) * (1 - sstep(0.1, 1.0, d)) * (0.7 + 0.3 * sstep(0.2, 0.55, n3(d * 0.45 + k * 9.1, k * 2.3)));
        ln = Math.max(ln, (1 - sstep(hw - 0.045, hw + 0.045, adx)) * on);
        if (adx < best) { best = adx; lp = clamp(0.5 + 0.5 * dx / hw, 0, 1); }
        rg = Math.max(rg, Math.exp(-(((adx - hw - 0.07) / 0.06) ** 2)) * on * (0.55 + 0.45 * n5(d * 1.1 + k * 3, k * 7)));
      }
      const cv = 0.6 * (2 * n4(Xr * 0.6 + 19, d * 0.55 + 5) - 1) + 0.4 * (2 * n3(Xr * 0.4 + 3, d * 0.38 + 1) - 1);   // (the colour: patches 0.7-2.5 m)
      const gEnd = d > 0 ? (1 - sstep(0.2, 1.6 + 1.0 * n5(X, 17.3), d)) * (0.2 + 0.8 * a) : 1;   // (on the gravel side only briefly, over the asphalt's tongues)
      const o = (py * MW + px) * 4, B8 = (v) => Math.round(clamp(v, 0, 1) * 255);
      M1[o] = B8(fm * gEnd * endF); M1[o + 1] = B8(a); M1[o + 2] = B8(b); M1[o + 3] = 255;
      M2[o] = B8(ln * gEnd); M2[o + 1] = B8(lp); M2[o + 2] = B8(0.5 + 0.5 * clamp(1.6 * cv, -1, 1)); M2[o + 3] = B8(Math.min(1, rg * Math.min(1, fm * 1.8)) * gEnd * endF);
    }
    const tx = (D) => { const t = new THREE.DataTexture(D, MW, MH, THREE.RGBAFormat, THREE.UnsignedByteType); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; t.needsUpdate = true; return t; };
    return { mask: tx(M1), prints: tx(M2) };
  }
  const gravTone = new WeakMap();
  function gravelTone(t) {   // the gravel picture's mean brightness and 1 / its spread (0..1; cached): the sand's grain is that picture's, finer, its contrast set from these
    if (gravTone.has(t)) return gravTone.get(t);
    let m = 0.47, sd = 0.08;
    try { const c = t && t.image && t.image.getContext ? t.image : null; if (c) { const D = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s1 = 0, s2 = 0, n = 0;
      for (let k = 0; k < D.length; k += 4) { const l = (D[k] + D[k + 1] + D[k + 2]) / 765; s1 += l; s2 += l * l; n++; } m = s1 / n; sd = Math.sqrt(Math.max(1e-6, s2 / n - m * m)); } } catch (e) { /* (no canvas: the defaults) */ }
    const v = new THREE.Vector2(m, 1 / sd); if (t) gravTone.set(t, v); return v;
  }
  // the overlay's fragment shader, after the material's map and vertex colours: the gravel over the asphalt (mask B), the asphalt's cover (G), then the
  // sand film (R: grains from the gravel picture at 2.8 x its scale, two of them crossed, settling in the asphalt's pores first) and in it the tyres'
  // lanes: more sand pressed into them, darker and more saturated (damp), with the tread's ribs across them (fading to their mean where they get finer
  // than ~3 px: no shimmer), the sand heaped at their edges, dry and paler beside them, its colour warmer or greyer in patches. diffuse: the wet road's darkening
  const GSEAM_FRAG = '\nvec4 sM = texture2D(uSeam, vSeam);\n' +
    'diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(uGrav, vUv * uGS).rgb * uGT * diffuse, sM.b);\n' +
    'diffuseColor.a *= sM.g;\n' +
    '{ vec3 g1 = texture2D(uGrav, vUv * uGS * 2.8).rgb, g2 = texture2D(uGrav, vec2(vUv.y, -vUv.x) * uGS * 3.836 + 0.31).rgb, gm = 0.5 * (g1 + g2);\n' +
    '  float gL = dot(gm, vec3(0.3333)), gl = (gL - uGM.x) * uGM.y * 1.4;\n' +
    '  float cv = clamp(sM.r * (1.0 + 0.8 * gl), 0.0, 1.0);\n' +
    '  cv = clamp(cv * (1.0 + 0.5 * clamp(dot(texture2D(map, vUv, 2.5).rgb - texture2D(map, vUv).rgb, vec3(3.0)), -0.85, 0.85)), 0.0, 1.0);\n' +
    '  vec3 sc = mix(vec3(gL), gm, 0.75) * uGT * vec3(1.07, 1.03, 0.97) * diffuse;\n' +
    '  vec4 s2 = texture2D(uSeam2, vSeam); float ln = s2.r, rg = s2.a, cvv = s2.b * 2.0 - 1.0;\n' +
    '  float ph = (vSeam.y * uSL.x - uSL.y) / 0.32 + abs(s2.g - 0.5), rb = 0.5 + 0.5 * cos(6.2831853 * ph);\n' +
    '  rb = mix(rb, 0.5, smoothstep(0.22, 0.42, fwidth(ph)));\n' +
    '  cv *= 1.0 + 0.3 * ln * (1.0 - 0.45 * rb); cv += 0.4 * rg * (1.0 - cv);\n' +
    '  float gy = dot(sc, vec3(0.3333)); sc = mix(vec3(gy), sc, 1.0 + 0.5 * ln) * mix(1.0, 0.6, ln) * (1.0 + 0.18 * rg) * (1.0 + 0.07 * (1.0 - ln));\n' +
    '  gy = dot(sc, vec3(0.3333)); sc = mix(sc, vec3(gy), 0.042 * (1.0 - ln));\n' +
    '  if (cvv < 0.0) sc = mix(sc, vec3(gy), -0.15 * cvv); sc *= 1.0 + 0.12 * cvv;\n' +
    '  float a0 = diffuseColor.a, A = a0 + cv * (1.0 - a0);\n' +
    '  diffuseColor = vec4(A > 1e-4 ? (diffuseColor.rgb * a0 * (1.0 - cv) + sc * cv) / A : sc, A); }\n';
  /* ---- the seams along a road where its surface changes from asphalt to gravel (see gravelSeamMasks): an overlay over each, back m on the asphalt,
     fwd m on the gravel, across the road's width: the asphalt (its own picture, UVs and shading, so it continues the road's) carried on over the
     gravel through the masks, the sand film over it in the gravel's picture and tint. o: { gravel(i): the segment i..i+1 is gravel, map (the
     asphalt), grav, gs (its scale on the road's UVs), gt (its tint), tileL, FR (the shares of the width across), wa(i) (the half width),
     shade(i, f), y, own }. One mesh, one draw call (null: no seam) ---- */
  function gravelSeams(root, T, o) {
    const N = T.N, ds = T.ds, back = 10, fwd = 12, len = back + fwd, rows = 22, Y = o.y, tileL = o.tileL, FR = o.FR;
    const cuts = []; for (let i = 1; i < N - 1; i++) { const a = !o.gravel(i - 1), b = !o.gravel(i); if (a !== b) cuts.push([i, a ? 1 : -1]); }   // (1: the asphalt behind)
    if (!cuts.length) return null;
    const M = gravelSeamMasks(T.w, o.wa(cuts[0][0]), back, fwd); o.own.push(M.mask, M.prints);
    const at = (s, f) => { const q = clamp(s / ds, 0, N - 1.001), i = Math.floor(q), t = q - i, j = i + 1, oi = f * o.wa(i), oj = f * o.wa(j), si = o.shade(i, f), sj = o.shade(j, f);
      return { p: [lerp(T.px[i] + T.nx[i] * oi, T.px[j] + T.nx[j] * oj, t), lerp(T.hy[i], T.hy[j], t) + Y, lerp(T.pz[i] + T.nz[i] * oi, T.pz[j] + T.nz[j] * oj, t)],
        c: [lerp(si[0], sj[0], t), lerp(si[1], sj[1], t), lerp(si[2], sj[2], t)], uv: [(f + 1) * T.w / tileL, s / tileL] }; };   // (u over the road's nominal width T.w: on a narrower road the grain a little finer across)
    const P = [], Nn = [], C = [], U = [], S = [];
    cuts.forEach(([b0, dir], ci) => {
      const flip = ci % 2 === 1, G = [];   // (every other seam mirrored across: not the same pattern twice)
      for (let r = 0; r <= rows; r++) { const d = -back + len * r / rows, s = b0 * ds + dir * d; G.push(FR.map(f => { const v = at(s, f), x = (f + 1) / 2; v.sm = [flip ? 1 - x : x, (d + back) / len]; return v; })); }
      for (let r = 0; r < rows; r++) for (let c = 0; c < FR.length - 1; c++) {
        let q = [G[r][c], G[r][c + 1], G[r + 1][c + 1], G[r + 1][c]];
        const ux = q[1].p[0] - q[0].p[0], uz = q[1].p[2] - q[0].p[2], vx = q[2].p[0] - q[0].p[0], vz = q[2].p[2] - q[0].p[2];
        if (uz * vx - ux * vz < 0) q = [q[0], q[3], q[2], q[1]];   // (wound to face up)
        for (const [A, B, Cc] of [[q[0], q[1], q[2]], [q[0], q[2], q[3]]]) {
          const e1 = [B.p[0] - A.p[0], B.p[1] - A.p[1], B.p[2] - A.p[2]], e2 = [Cc.p[0] - A.p[0], Cc.p[1] - A.p[1], Cc.p[2] - A.p[2]];
          let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
          for (const v of [A, B, Cc]) { P.push(...v.p); Nn.push(nx, ny, nz); C.push(...v.c); U.push(...v.uv); S.push(...v.sm); }
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aSeam', new THREE.Float32BufferAttribute(S, 2));
    g.computeBoundingSphere();
    const mat = new THREE.MeshLambertMaterial({ map: o.map, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }), gt = new THREE.Vector3(...o.gt), gm = gravelTone(o.grav);
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uSeam: { value: M.mask }, uSeam2: { value: M.prints }, uGrav: { value: o.grav }, uGS: { value: o.gs }, uGT: { value: gt }, uGM: { value: gm }, uSL: { value: new THREE.Vector2(len, back) } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aSeam; varying vec2 vSeam;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeam = aSeam;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uSeam, uSeam2, uGrav; uniform float uGS; uniform vec3 uGT; uniform vec2 uGM, uSL; varying vec2 vSeam;')
        .replace('#include <alphamap_fragment>', '#include <alphamap_fragment>' + GSEAM_FRAG);
    };
    mat.customProgramCacheKey = () => 'gravelSeam'; mat.extensions = { derivatives: true };   // (fwidth)
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.renderOrder = 0.55; m.matrixAutoUpdate = false; m.name = 'roadSeams';
    m.userData.seams = { back, fwd, at: cuts.map(([i, dir]) => [i * ds, dir]), mask: M.mask };   // (for the tests)
    root.add(m); return m;
  }

  /* ---- Toskana's white edge line: its paint in one 64 x 1024 RGBA tile (u across the line's quad: the line's width lw and a margin M either
     side, 0 by the road's centre; v along it: one tile = PER m, a whole number of tiles round the lap, so it closes on itself). Alpha is the
     paint's cover: soft edges (a smoothstep over 3 cm, centred on the edge), the edges wandering a little (a shared meander of +-1.5 cm and the
     width breathing +-9 %, waves of 2, 1.2 and 0.7 m), and worn: thinner paint in patches 0.6-1.6 m long (down to ~15 % where it is most
     worn) with a fine speckle in them; RGB white with a faint grey speckle. All the noise is periodic along v and seeded (the same on every
     build): Catmull-Rom curves through seeded values a whole number per tile, each sum scaled so its largest swing is exactly 1 ---- */
  let edgeLineTile = null;
  function edgeLinePaint(lw, M, PER) {
    const NX = 64, NY = 1024, Wq = lw + 2 * M, D = new Uint8Array(NX * NY * 4), WA = 0.3, WX = 0.85, SP = 0.55;
    const pn = (seed, lam) => { const n = Math.max(2, Math.round(PER / lam)), r = rng(seed), g = new Float32Array(n); for (let k = 0; k < n; k++) g[k] = r() * 2 - 1;
      return (t) => { const f = (((t % 1) + 1) % 1) * n, k = Math.floor(f), x = f - k, p0 = g[(k + n - 1) % n], p1 = g[k % n], p2 = g[(k + 1) % n], p3 = g[(k + 2) % n];
        return 0.5 * (2 * p1 + (p2 - p0) * x + (2 * p0 - 5 * p1 + 4 * p2 - p3) * x * x + (3 * p1 - p0 - 3 * p2 + p3) * x * x * x); }; };
    const sum = (parts) => { const a = new Float32Array(NY); let m = 1e-6; for (let r = 0; r < NY; r++) { const t = (r + 0.5) / NY; a[r] = parts.reduce((acc, [wt, f]) => acc + wt * f(t), 0); m = Math.max(m, Math.abs(a[r])); }
      for (let r = 0; r < NY; r++) a[r] /= m; return a; };
    const vn2 = (seed, lx, ly) => { const nx = Math.ceil(Wq / lx) + 2, ny = Math.max(2, Math.round(PER / ly)), r = rng(seed), g = new Float32Array(nx * ny); for (let k = 0; k < g.length; k++) g[k] = r();   // (2-D value noise: cells lx m across, ly m along, periodic along)
      return (a, t) => { const fx = (a + M) / lx, fy = (((t % 1) + 1) % 1) * ny, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, uu = u * u * (3 - 2 * u), vv = v * v * (3 - 2 * v);
        const G = (X, Y) => g[(Y % ny) * nx + clamp(X, 0, nx - 1)];
        return lerp(lerp(G(x0, y0), G(x0 + 1, y0), uu), lerp(G(x0, y0 + 1), G(x0 + 1, y0 + 1), uu), vv); }; };
    const mea = sum([[0.4, pn(9811, 2)], [0.35, pn(9812, 1.2)], [0.25, pn(9813, 0.7)]]), br = sum([[0.5, pn(9821, 1.6)], [0.5, pn(9822, 0.9)]]), ji = sum([[1, pn(9831, 0.5)]]), jo = sum([[1, pn(9832, 0.5)]]);
    const wpat = sum([[0.55, pn(9951, 1.6)], [0.45, pn(9952, 0.6)]]), speck = vn2(9881, 0.012, 0.05), speck2 = vn2(9882, 0.02, 0.09), f = 0.03, lo = -M + 0.004 + f / 2, hi = lw + M - 0.004 - f / 2;
    for (let r = 0; r < NY; r++) {
      const t = (r + 0.5) / NY, c = 0.05 * WA * mea[r], hw = lw / 2 * (1 + 0.3 * WA * br[r]), ei = clamp(lw / 2 + c - hw + 0.008 * ji[r], lo, hi), eo = clamp(lw / 2 + c + hw + 0.008 * jo[r], lo, hi), wm = sstep(0.25, 0.8, 0.5 - 0.5 * wpat[r]);
      for (let x = 0; x < NX; x++) {
        const a = (x + 0.5) / NX * Wq - M, o = (r * NX + x) * 4, s2 = speck2(a, t);
        let A = sstep(ei - f / 2, ei + f / 2, a) * (1 - sstep(eo - f / 2, eo + f / 2, a));
        A = Math.max(0, A * (1 - WX * wm * (0.55 + 0.45 * speck(a, t))) - SP * sstep(0.62, 0.92, s2) * (0.4 + 0.6 * wm));
        const R = Math.round((0.96 + 0.04 * s2) * 255); D[o] = R; D[o + 1] = R; D[o + 2] = R; D[o + 3] = Math.round(clamp(A, 0, 1) * 255);
      }
    }
    return D;
  }

  /* ---- the pit lane (Bakreni gozd, Toskana, Gromski rt, as in the reference; Spa): an asphalt lane on the outside of the straight behind a bare rail
     on a grass strip, a pale concrete apron with painted boxes where the crews stand in rows, a row of garages behind. opt: the builder's R, scen,
     prop(kind, x, z, yaw), excl(x, z, r), root, out, ownTex; Y(s): the road's height at s (the flat circuits: none, everything at the heights
     given); spa: the Spa pit building ---- */
  function pitLaneScenery(opt) {
    const { R, scen, prop, excl, root, out, ownTex } = opt, fd = T.def, foPit = (i) => T.pitAt(i * T.ds), Y = opt.Y || null;
    const yS = (y, s) => (Y ? y + Y(s) : y), yK = (y, k) => (Y ? y + T.hy[k] : y);   // a height above the road at s / at sample k
    const fdp = fd.pit || [15.5, -238, 80], gl = new GB(true), gp = new GB(), [pq0, pq1] = fd.pitRow || [-152, 44];   // (pitRow: the first and the last box, metres from the start line)
    const at = (k, o, y) => [T.px[k] + T.nx[k] * o, yK(y, k), T.pz[k] + T.nz[k] * o], conc = [0.74, 0.78, 0.7], wl = [0.95, 0.95, 0.94], one = [1, 1, 1];
    for (let q = fdp[1]; q < fdp[2]; q += 2) {
      const i = T.idx(T.startS + q), j = T.idx(T.startS + q + 2), pi = foPit(i), pj = foPit(j); if (!pi || !pj) continue;
      const a0 = pi.o - 3.5, a1 = pi.o + 3.5, b0 = pj.o - 3.5, b1 = pj.o + 3.5, A = at(i, a0, 0.024), Bq = at(i, a1, 0.024), C = at(j, b1, 0.024), D = at(j, b0, 0.024);
      gl.quadUp(A, Bq, C, D, [one, one, one, one], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [D[0] / 8, -D[2] / 8]]);
      gp.quadUp(at(i, a1 - 0.32, 0.033), at(i, a1 - 0.14, 0.033), at(j, b1 - 0.14, 0.033), at(j, b1 - 0.32, 0.033), [wl, wl, wl, wl]);                        // solid line on the outer edge
      if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(i, a0 + 0.14, 0.033), at(i, a0 + 0.32, 0.033), at(j, b0 + 0.32, 0.033), at(j, b0 + 0.14, 0.033), [wl, wl, wl, wl]);   // dashed inner line
      if (pi.t > 0.999 && pj.t > 0.999) gp.quadUp(at(i, a1, 0.022), at(i, a1 + 9, 0.022), at(j, b1 + 9, 0.022), at(j, b1, 0.022), [conc, conc, conc, conc]); }  // concrete apron
    const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
    // ---- garage and box dressing (no random draws here: the scenery after it stays the same). a = metres along from the box start, w = lateral ----
    const kbox = (g, s0, a, w, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, w); box(g, x, yS(y, s0 + a), z, sx, sy, sz, hd, col, top, nb); };
    const kcyl = (g, s0, a, w, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, w); cyl(g, x, yS(y, s0 + a), z, r, h, n, col, top); };
    const kface = (g, s0, a0, a1, w, y0, y1, col, dir) => { const [x0, z0] = atSf(s0 + a0, w), [x1, z1] = atSf(s0 + a1, w), [xb, zb] = atSf(s0 + (a0 + a1) / 2, w - (dir || -1) * 0.2);   // a flat panel facing the lane (dir -1) or away from it (+1): drawer lines, screens
      if (Y) { const dy = Y(s0 + (a0 + a1) / 2); y0 += dy; y1 += dy; }
      g.quadO([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], col, [xb, (y0 + y1) / 2, zb]); };
    const CAB = [[0.78, 0.14, 0.12], [0.2, 0.21, 0.24], [0.15, 0.3, 0.62], [0.12, 0.12, 0.13]], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38];
    const blankets = (g, s0, a, w, y, n, h, cmp) => {   // a stack of n tyres in warming blankets, each banded in the compound colour
      kcyl(g, s0, a, w, y, 0.36, n * h, 8, BLK, [0.17, 0.17, 0.19]); for (let l = 0; l < n; l++) kcyl(g, s0, a, w, y + (l + 0.42) * h, 0.366, h * 0.16, 8, cmp); };
    const cabinet = (g, s0, a, w, sx, sy, sz, col) => {   // a roll cab on a dark plinth (the casters), silver drawer lines on the face toward the lane
      kbox(g, s0, a, w, 0, sx * 0.94, 0.1, sz * 0.9, [0.08, 0.08, 0.09], null, true); kbox(g, s0, a, w, 0.1, sx, sy, sz, col, [0.1, 0.1, 0.11]);
      for (let d = 0; d < 4; d++) { const y = 0.1 + sy * (0.22 + d * 0.2); kface(g, s0, a - sx * 0.43, a + sx * 0.43, w - sz / 2 - 0.004, y, y + 0.025, SIL); } };
    const forestPitKit = (g, s0, k, base, wv, mine) => {   // per crew box (g: its scenery chunk): a roll cab, tyre sets on a trolley, a monitor cart and an air-line reel on the apron, the team's stand on the pit wall
      const h = (k * 7 + 3) % 4, cmp = CMP[k % 3], mc = mine ? 9.35 : 3.4;   // (the player's apron is kept clear: his crew runs across it)
      if (!mine) { cabinet(g, s0, 1.6, base + 7.6, 1.15, 0.95, 0.62, CAB[h]);
        kbox(g, s0, 7.6, base + 7.5, 0.06, 1.75, 0.12, 0.9, [0.2, 0.2, 0.22]);                                                   // tyre trolley ...
        for (const ta of [7.18, 8.02]) blankets(g, s0, ta, base + 7.5, 0.18, 2, 0.5, cmp); }                                  // ... with a set of four in blankets
      kbox(g, s0, mc, base + 8.25, 0, 0.62, 0.95, 0.5, [0.22, 0.23, 0.26], [0.12, 0.12, 0.13]); kbox(g, s0, mc, base + 8.3, 0.95, 0.06, 0.38, 0.06, [0.15, 0.15, 0.16], null, true);   // monitor cart ...
      kbox(g, s0, mc, base + 8.28, 1.33, 1.2, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.3, 0.3]) kface(g, s0, mc + ma - 0.26, mc + ma + 0.26, base + 8.25, 1.37, 1.7, SCR);   // ... two screens toward the lane
      kbox(g, s0, 0.75, base + 8.75, 0, 0.3, 1.1, 0.3, [0.3, 0.31, 0.34], null, true); kcyl(g, s0, 0.75, base + 8.75, 1.1, 0.3, 0.22, 10, [0.8, 0.15, 0.12], [0.85, 0.2, 0.16]);   // air-line reel on a post
      for (const [a0, w0, a1, w1] of [[0.75, base + 8.5, 1.4, base + 6.2], [1.4, base + 6.2, 2.6, base + 5.4]]) {   // and its hose on the concrete
        const [x0, z0] = atSf(s0 + a0, w0), [x1, z1] = atSf(s0 + a1, w1); box(g, (x0 + x1) / 2, yS(0.022, s0 + (a0 + a1) / 2), (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), 0.035, 0.035, Math.atan2(z1 - z0, x1 - x0), [0.1, 0.1, 0.11], null, true); }
      // the stand in the grass strip behind the rail: a desk with screens toward the stools, a roof
      kbox(g, s0, 5, wv + 0.72, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);
      for (const la of [-1.18, 1.18]) for (const lw of [0.28, 1.16]) kbox(g, s0, 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24], null, true);
      kbox(g, s0, 5, wv + 0.34, 1.02, 2.1, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.7, 0, 0.7]) kface(g, s0, 5 + ma - 0.3, 5 + ma + 0.3, wv + 0.368, 1.05, 1.39, SCR, 1);
      for (const pa of [-1.2, 1.2]) kbox(g, s0, 5 + pa, wv + 0.2, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28], null, true);
      kbox(g, s0, 5, wv + 0.8, 2.5, 2.7, 0.07, 1.55, [0.22, 0.23, 0.26], [0.3, 0.31, 0.35]);
      for (const sa of [-0.62, 0.62]) kcyl(g, s0, 5 + sa, wv + 1.5, 0, 0.17, 0.48, 7, [0.14, 0.14, 0.16], [0.2, 0.2, 0.22]); };   // stools (the engineers are the renderer's)
    const forestGarages = () => {   // one garage per box, open at the front: floor, cabinets, tyre sets and a screen inside, strip lights, a coloured band over the door
      const WH = [0.9, 0.89, 0.87], WT = [0.74, 0.74, 0.76];
      for (let q = pq0; q < pq1 + 6; q += 10) { const s0 = T.startS + q, pc = T.pitAt(s0 + 5); if (!pc || pc.t < 0.999) continue;
        const k = ((q - pq0) / 10) | 0, o = pc.o + 3.5 + 9 + 3.6, ik = T.idx(s0 + 1), g = scen.get(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o), f0 = o - 3.6, b0 = o + 3.6;   // (the chunks the old garages were in)
        kbox(g, s0, 5, o, 4.0, 10.02, 0.4, 7.2, WH, WT);                                                   // roof
        kbox(g, s0, 5, b0 - 0.15, 0, 10.02, 4.0, 0.3, WH, null, true);                                     // back wall
        for (const sd of [-1, 1]) { kbox(g, s0, 5 + sd * 4.885, o, 0, 0.25, 4.0, 7.2, WH, null, true); kbox(g, s0, 5 + sd * 4.56, f0 + 0.15, 0, 0.9, 3.3, 0.3, WH, null, true); }   // side walls, front pillars
        kbox(g, s0, 5, f0 + 0.15, 3.3, 10.02, 0.7, 0.3, WH);                                               // header over the door
        kbox(g, s0, 5, f0 - 0.02, 3.45, 9.4, 0.5, 0.05, TEAM[k % TEAM.length]);                           // coloured band
        kbox(g, s0, 5, o, 0, 9.52, 0.03, 6.9, [0.44, 0.46, 0.49], [0.52, 0.54, 0.57], true);              // epoxy floor
        kface(g, s0, 0.25, 9.75, b0 - 0.302, 0.03, 1.28, [0.3, 0.31, 0.35]);                               // darker panel on the back wall
        kbox(g, s0, 5, b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kface(g, s0, 4.31, 5.69, b0 - 0.352, 1.75, 2.5, SCR);   // timing screen
        for (const ca of [1.3, 2.5, 7.5, 8.7]) cabinet(g, s0, ca, b0 - 0.64, 1.15, 1.0, 0.6, [0.2, 0.21, 0.24]);
        for (const ta of [0.85, 9.15]) blankets(g, s0, ta, o - 0.6, 0.03, 3, 0.46, CMP[(k + (ta > 5 ? 1 : 0)) % 3]);
        for (const la of [-1.9, 1.9]) kbox(g, s0, 5 + la, o, 3.92, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]);
        if (opt.spa) {   // Spa: the pit building's upper floor (the paddock club) set back over the garages, a glass front, the roof slab overhanging the apron
          kbox(g, s0, 5, o + 0.6, 4.4, 10.02, 4.2, 6.0, [0.88, 0.89, 0.9], [0.6, 0.61, 0.64]);
          kbox(g, s0, 5, f0 + 1.14, 5.0, 9.9, 2.8, 0.12, [0.2, 0.28, 0.38], [0.28, 0.35, 0.44], true);
          kbox(g, s0, 5, o - 0.4, 8.6, 10.04, 0.3, 8.2, [0.7, 0.71, 0.73], [0.62, 0.63, 0.66]); } } };
    let box0 = 0;
    for (let q = pq0, k = 0; q <= pq1; q += 10, k++) { const i = T.idx(T.startS + q), p = foPit(i); if (!p || p.t < 0.999) continue;
      const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
      { const L0 = atSf(T.startS + q - 0.09, base), L1 = atSf(T.startS + q + 0.09, base), L2 = atSf(T.startS + q + 0.09, base + 9), L3 = atSf(T.startS + q - 0.09, base + 9);   // box divider line
        gp.quadUp([L0[0], yS(0.034, T.startS + q - 0.09), L0[1]], [L1[0], yS(0.034, T.startS + q + 0.09), L1[1]], [L2[0], yS(0.034, T.startS + q + 0.09), L2[1]], [L3[0], yS(0.034, T.startS + q - 0.09), L3[1]], [wl, wl, wl, wl]); }
      if (box0++ >= 13) continue;                                                                   // a crew for each of the 13 cars
      const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5;
      const mine = fdp[3] != null && Math.abs(q + 5 - fdp[3]) < 1;                                 // the player's box: its crew is animated by the renderer
      if (mine) { const sb = T.startS + q + 5, bp = T.bayPose(fdp[3]);
        out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, bp.o), stopO: bp.o, stopA: bp.a }; if (Y) out.pitBox.y = Y(sb); }
      for (let r = 0; r < 2; r++) for (let m = 0; m < 4; m++) { if (R() < 0.12 || mine) continue; R(); R(); }   // (the draws of the old static crews stay, so the scenery after them is unchanged; the crews are the renderer's now)
      forestPitKit(scen.get(cx, cz), T.startS + q, k, base, p.wall, mine);
      const oc = atSf(T.startS + q + 5, 0);   // for the renderer's crews: the box centre on the centre line, the box frame
      (out.pitBoxes = out.pitBoxes || []).push({ k, s: T.startS + q + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine });
      if (Y) out.pitBoxes[out.pitBoxes.length - 1].y = Y(T.startS + q + 5); }   // (the crews stand at the road's height of their box)
    forestGarages();
    { const pbs = out.pitBoxes; T.pitStands = null;   // the stands on the grass strip (2.7 m roofs over the box centres, forestPitKit): Core keeps the player's car off it
      if (pbs && pbs.length) { const L = T.len, dS = (s) => { let d = s - T.startS; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
        T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35];
        const kt = [0.86, 0.86, 0.83], kf = [0.66, 0.67, 0.64];   // and a low concrete kerb along that limit (pitAt().inner: the lane's edge, eased in from the rail)
        for (let q = T.pitStands[0] - 28; q < T.pitStands[1] + 28; q += 2) {
          const i = T.idx(T.startS + q), j = T.idx(T.startS + q + 2), pi = foPit(i), pj = foPit(j); if (!pi || !pj || pi.gap || pj.gap) continue;
          const ai = pi.inner, aj = pj.inner; if (ai - pi.wall < 0.15 && aj - pj.wall < 0.15) continue;
          gp.quadUp(at(i, ai - 0.15, 0.1), at(i, ai, 0.1), at(j, aj, 0.1), at(j, aj - 0.15, 0.1), [kt, kt, kt, kt]);
          gp.quadO(at(i, ai, 0.02), at(j, aj, 0.02), at(j, aj, 0.1), at(i, ai, 0.1), kf, at(i, ai - 1, 0.05));
          gp.quadO(at(j, aj - 0.15, 0), at(i, ai - 0.15, 0), at(i, ai - 0.15, 0.1), at(j, aj - 0.15, 0.1), kf, at(i, ai + 1, 0.05)); } } }
    for (const [q0, dq] of [[fdp[1] + 30, 4], [fdp[2] - 26, -4]]) for (let k = 0; k < 3; k++) {   // knockable cones on the noses where the pit lane leaves and rejoins
      const i = T.idx(T.startS + q0 + k * dq), p = foPit(i); if (!p) continue; const o = (T.br[i] + 0.9 + p.o - 3.5) / 2; if (o < T.br[i] + 0.5 || o > p.o - 4) continue;
      const [x, z] = atS(T.startS + q0 + k * dq, o); prop('cone', x, z, R() * TAU); }
    { const sE = T.startS + fdp[1] + 20, pE = T.pitAt(sE);   // the sign at the pit entry: BOKSI with an arrow, and the 80 km/h limit
      if (pE) { const [x, z] = atSf(sE, pE.lout + 3.4), i = T.idx(sE), g = scen.get(x, z);
        const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 160; const x2 = c2.getContext('2d');
        x2.fillStyle = '#1f3f8c'; x2.fillRect(0, 0, 256, 160); x2.strokeStyle = '#f4f1ec'; x2.lineWidth = 7; x2.strokeRect(5, 5, 246, 150);
        x2.fillStyle = '#f4f1ec'; x2.font = '900 50px "Russo One", "Arial Black", Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('BOKSI', 96, 52);
        x2.beginPath(); x2.moveTo(186, 30); x2.lineTo(232, 52); x2.lineTo(186, 74); x2.lineTo(186, 62); x2.lineTo(166, 62); x2.lineTo(166, 42); x2.lineTo(186, 42); x2.closePath(); x2.fill();
        x2.fillStyle = '#f4f1ec'; x2.beginPath(); x2.arc(128, 116, 34, 0, Math.PI * 2); x2.fill(); x2.strokeStyle = '#c8261f'; x2.lineWidth = 9; x2.beginPath(); x2.arc(128, 116, 29, 0, Math.PI * 2); x2.stroke();
        x2.fillStyle = '#16171a'; x2.font = '900 32px "Russo One", "Arial Black", Arial, sans-serif'; x2.fillText('80', 128, 118);
        let fx = -T.tx[i] - T.nx[i] * 0.45, fz = -T.tz[i] - T.nz[i] * 0.45; const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;
        const bm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshLambertMaterial({ map: ownTex(new THREE.CanvasTexture(c2)) }));
        bm.position.set(x + fx * 0.14, yS(3.1, sE), z + fz * 0.14); bm.rotation.set(-0.12, Math.atan2(fx, fz), 0, 'YXZ'); bm.castShadow = true; root.add(bm);
        box(g, x, yS(1.8, sE), z, 4.4, 2.8, 0.2, Math.atan2(-fx, fz), [0.86, 0.85, 0.82], [0.86, 0.85, 0.82]);
        for (const q2 of [-1.6, 1.6]) box(g, x + fz * q2, yS(0, sE), z - fx * q2, 0.22, 2.0, 0.22, 0, [0.62, 0.63, 0.66]);
        excl(x, z, 3.5); } }
    const ml = new THREE.Mesh(gl.geometry(), out.asphaltMat); ml.receiveShadow = true; ml.matrixAutoUpdate = false; root.add(ml);
    const mpit = new THREE.Mesh(gp.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mpit.receiveShadow = true; mpit.matrixAutoUpdate = false; root.add(mpit);
  }

  /* ---- worlds built in files of their own (js/world-<theme>.js, loaded after this file): World.ext[theme](scene, tex, opts, api) returns the
     world as the builders here do (out: root, groundH, props, ...); api: the shared helpers and the track being built. The worlds moved out
     of this file as they were (every world but the default builder's) take what they use of it from World.api instead (API, below) ---- */
  const EXT = {};
  function extAPI() {
    return { T, THEME, GB, RB, Chunks, IChunks, box, cyl, cone, ico, puff, gable, roofKit, hex, vary, rng, clamp, lerp, sstep, TAU, atS, atSf, wrapS, crAt, inPoly, polyDist,
      valueNoise2, waterMat, shoreBand, waterline, mergeBands, addShore, crowdCtx, crowdRun, crowdPut, crowdFinish, crowdUV, swayMat, treeMark, treesTo, nrLump };
  }

  /* ---------------- BUILD ---------------- */
  function build(scene, track, tex, opts) {
    LOD = makeLOD(opts.tier);   // the graphics detail tier for this build (every builder below consults the shared LOD)
    CULLM = [];                 // fresh list of distance-cullable vegetation for this build
    SHLO = [];                  // (and of the plants' shadow copies, NIZKA)
    CROWDS = [];   // (the crowds of this build: their sound, see crowdPoints)
    T = track; THEME = (track.def && track.def.theme) || 'lake'; CSX = THEME === 'forest' || THEME === 'italia' || THEME === 'kamp'; ROCK_SMOOTH = CSX; SEA = (track.def && track.def.sea) || null; RIVER = track.def.river || null; RW = track.def.riverW || 26; CASTLE = track.def.castle || null; buildHash();
    for (const f of SYNC) f();   // (the worlds in files of their own: the track being built, its theme, the detail tier)
    if (THEME !== 'nring' && THEME !== 'spa' && THEME !== 'rbring' && THEME !== 'bathurst' && THEME !== 'cpalace' && THEME !== 'longford' && THEME !== 'rio' && THEME !== 'bangsaen') NR = null;   // free the last corridor build's grids (the Nordschleife's, Spa's, the Red Bull Ring's, Bathurst's, Crystal Palace's, Longford's)
    if (THEME !== 'longford') API.LFQ = null;                          // (and Longford's rivers and railway)
    if (THEME !== 'suzuka') API.SZ = null;                             // (and Suzuka's)
    if (THEME !== 'newcastle') API.NC = null;                          // (and Newcastle's)
    if (THEME !== 'troisrivieres') API.TRW = null;                     // (and Trois-Rivières')
    if (THEME !== 'ouni') API.OU = null;                               // (and the last Ouninpohja build's)
    if (THEME !== 'harju') API.HJ = null;                              // (and Harju's)
    if (THEME !== 'vrsic' && THEME !== 'caracoles' && THEME !== 'uncompahgre' && THEME !== 'sani' && THEME !== 'iroha' && THEME !== 'beartooth' && THEME !== 'rastro' && THEME !== 'moki' && THEME !== 'medvode' && THEME !== 'palomar') API.VR = null;     // (and the last Vršič, Los Caracoles or Uncompahgre build's: the same corridor helpers)
    if (THEME !== 'katu') API.KT = null;                               // (and the last Katu-Jaryk build's)
    if (THEME !== 'detroit') API.DT = null;                            // (and Detroit's)
    if (THEME !== 'marrakesh') API.MR = null;                          // (and Marrakesh's)
    if (THEME !== 'pikes') API.PK = null;                              // free the last Pikes build's grids (only that world's groundH used them)
    if (EXT[THEME]) return finish(EXT[THEME](scene, tex, opts, extAPI()), tex);   // a world built in a file of its own (js/world-<theme>.js: World.ext[theme], with the helpers of extAPI)
    const R = rng(4242);
    hillN = valueNoise2(77, 60);
    mtnN = valueNoise2(83, 130); mtnN2 = valueNoise2(91, 55); mtnPeak = valueNoise2(97, 220);
    const macro = valueNoise2(5, 45), forestN = valueNoise2(9, 70), typeN = valueNoise2(13, 55);
    const dens = opts.density || 1;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH, props: [], ownTex: [] };   // props: loose trackside objects the cars can knock over (simulated by Core, drawn by Render)
    const ownTex = (t) => { out.ownTex.push(t); return t; };   // textures made for this build only: Render frees them with the scenery

    // bounds
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < T.N; i++) { minX = Math.min(minX, T.px[i]); maxX = Math.max(maxX, T.px[i]); minZ = Math.min(minZ, T.pz[i]); maxZ = Math.max(maxZ, T.pz[i]); }
    const B = { minX: minX - 170, maxX: maxX + 170, minZ: minZ - 170, maxZ: maxZ + 170 };
    out.bounds = B;
    MF = null; MC_TER = null;
    if (THEME === 'monaco') {   // the Fairmont hairpin: sharpest bend around lap fraction 0.39 (from the start line)
      const s0h = (T.startS + 0.389 * T.len) % T.len; let ia = T.idx(s0h), bk = 0;
      for (let d = -20; d <= 20; d += 2) { const i = T.idx(s0h + d); if (Math.abs(T.k[i]) > bk) { bk = Math.abs(T.k[i]); ia = i; } }
      const iIn = T.idx(ia * T.ds - 34), iOut = T.idx(ia * T.ds + 34), mx = (T.px[iIn] + T.px[iOut]) / 2, mz = (T.pz[iIn] + T.pz[iOut]) / 2;
      MC_TER = { x: mx, z: mz, r: Math.hypot(T.px[iIn] - T.px[iOut], T.pz[iIn] - T.pz[iOut]) * 0.3, h: (T.hy ? T.hy[iOut] : 0) - 0.5, apex: ia };
    }
    if (THEME === 'mountain' || THEME === 'monaco') {
      const cell = 6, x0 = B.minX - 30, z0 = B.minZ - 30;
      const nx = Math.ceil((B.maxX - B.minX + 60) / cell) + 1, nz = Math.ceil((B.maxZ - B.minZ + 60) / cell) + 1;
      const hb = new Float32Array(nx * nz), hd = new Float32Array(nx * nz);
      const sx = [], sz = [], sy = [];
      for (let i = 0; i < T.N; i += 3) { sx.push(T.px[i]); sz.push(T.pz[i]); sy.push(T.hy[i]); }
      const M = sx.length;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x = x0 + i * cell, z = z0 + j * cell;
        let ws = 0, hs = 0, dmin = 1e18;
        for (let k = 0; k < M; k++) { const dx = x - sx[k], dz = z - sz[k], d2 = dx * dx + dz * dz; if (d2 < dmin) dmin = d2; const wq = 1 / (d2 + 900), w2 = wq * wq; ws += w2; hs += w2 * sy[k]; }
        hb[j * nx + i] = hs / ws; hd[j * nx + i] = Math.sqrt(dmin);
      }
      MF = { x0, z0, cell, nx, nz, hb, hd };
    }

    const matV = new THREE.MeshLambertMaterial({ vertexColors: true });
    out.matV = matV;

    /* ---- key positions ---- */
    const sStart = T.startS;
    // exclusion zones for trees: list of {x,z,r} circles and rect checks
    const excl = [];
    const exclRect = []; // oriented rects {x,z,hx,hz,rot}
    const inRect = (x, z, r) => { const dx = x - r.x, dz = z - r.z; const c = Math.cos(-r.rot), s = Math.sin(-r.rot); const lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < r.hx && Math.abs(lz) < r.hz; };
    const exclF = [];   // extra exclusion tests (functions of x, z)
    const excluded = (x, z) => { for (const e of excl) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; for (const r of exclRect) if (inRect(x, z, r)) return true; for (const f of exclF) if (f(x, z)) return true; return false; };

    /* ================= GROUND ================= */
    let GM = null;   // (the ground mesh's heights: where its surface meets a water level is the waterline, gmLine)
    {
      const cell = THEME === 'mountain' ? 6 : 8;
      const nx = Math.ceil((B.maxX - B.minX) / cell), nz = Math.ceil((B.maxZ - B.minZ) / cell);
      const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3), uv = new Float32Array((nx + 1) * (nz + 1) * 2);
      let k = 0;
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const x = B.minX + i * cell, z = B.minZ + j * cell;
        let h = groundH(x, z);
        if (THEME === 'mountain' || THEME === 'monaco') { const nn = nearest(x, z); if (nn.i >= 0) h -= (THEME === 'monaco' ? 1.0 : 0.8) * (1 - sstep(T.w + 0.3, T.w + 3.5, Math.abs(nn.lat))); }
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
        const us = THEME === 'city' || THEME === 'monaco' ? 7 : 14; uv[k * 2] = x / us; uv[k * 2 + 1] = -z / us;
        let m = 0.86 + macro(x, z) * 0.28;
        let r = m, g = m, b = m;
        const c = clearance(x, z);
        if (c > 6) { const f = forestN(x, z); if (f > 0.5) { const d = sstep(0.5, 0.7, f) * 0.18; r -= d; g -= d * 0.8; b -= d; } }
        if (c < 3 && c > -40) { r *= 1.03; g *= 1.05; b *= 1.0; } // well kept verge
        const sd = lakeSD(x, z);
        if (sd < 5 && sd > -8) { const t = sstep(5, 0, sd) * sstep(-8, -2, sd); r = lerp(r, 2.3, t); g = lerp(g, 1.36, t); b = lerp(b, 2.2, t); }
        if (h < -0.5) { r *= 0.55; g *= 0.62; b *= 0.8; }
        if (THEME === 'city') { r *= 0.8; g *= 0.76; b *= 0.7; }
        if (THEME === 'forest') { const fd = T.def; r *= 0.8; g *= 0.84; b *= 1.46;   // sea-green lawns: teal in the shade, pale green in the sun (measured from the reference)
          if (fd.river) { let dm = 1e9; for (let k = 0; k < fd.river.length - 1; k++) { const [ax, az] = fd.river[k], [bx, bz] = fd.river[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1); dm = Math.min(dm, Math.hypot(x - ax - vx * t, z - az - vz * t)); }
            const t = sstep(8, 4.5, dm); r = lerp(r, 1.5, t); g = lerp(g, 1.26, t); b = lerp(b, 1.36, t); }
          const hr = forestRockH(x, z, c);
          if (hr > 0.3) { const t = sstep(0.3, 3, hr) * 0.6; r = lerp(r, 1.4, t); g = lerp(g, 1.15, t); b = lerp(b, 1.35, t); }
          const sh = shoreFO(x, z);
          if (sh < 9) { const t = sstep(9, 2, sh); r = lerp(r, 1.3, t); g = lerp(g, 1.12, t); b = lerp(b, 1.2, t); }   // pale rock along the shore
          if (sh < 0) { const t = sstep(0, -6, sh); r = lerp(r, 0.3, t); g = lerp(g, 0.36, t); b = lerp(b, 0.62, t); } }   // lake bed
        if (THEME === 'italia' || THEME === 'kamp') { const it = THEME === 'italia'; r *= it ? 0.8 : 0.83; g *= it ? 0.86 : 0.84; b *= it ? 1.3 : 1.0;   // Toskana: a touch greener than the forest's sea-green; Gromski rt: fresh yellow-green (measured from the reference)
          const sh = shoreFO(x, z);
          if (sh < 7) { const t = sstep(7, 1.5, sh); r = lerp(r, 1.45, t); g = lerp(g, 1.2, t); b = lerp(b, 1.25, t); }   // pale stony bank along the lake
          if (sh < 0) { const t = sstep(0, -6, sh); r = lerp(r, 0.28, t); g = lerp(g, 0.45, t); b = lerp(b, 0.7, t); } }   // lake bed
        if (THEME === 'monaco') { r *= 0.86; g *= 0.8; b *= 0.72; if (h < -0.3) { r *= 0.6; g *= 0.7; b *= 0.8; } }
        if (THEME === 'mountain') {
          const nb = macro(x, z);
          r = 0.34 + nb * 0.12; g = 0.44 + nb * 0.12; b = 0.24 + nb * 0.08;   // alpine green
          const rock = sstep(30, 62, h), snow = sstep(74, 115, h);
          r = lerp(r, 0.5, rock); g = lerp(g, 0.48, rock); b = lerp(b, 0.44, rock);   // rocky grey-green
          r = lerp(r, 1.25, snow); g = lerp(g, 1.3, snow); b = lerp(b, 1.35, snow);    // pale/snow caps
          if (c < 4 && c > -80) { r = lerp(r, 0.52, 0.55); g = lerp(g, 0.43, 0.55); b = lerp(b, 0.3, 0.55); } // dirt verge by the road
        }
        col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
        k++;
      }
      const idx = [];
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ map: THEME === 'city' || THEME === 'monaco' ? tex.paving : tex.grass, vertexColors: true });
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
      out.ground = m; GM = { pos, nx, nz, cell, x0: B.minX, z0: B.minZ, col }; out.gGrid = GM;   // (col: the edge strips match the lawn's colour, gmAt)
    }

    const gmAt = (x, z) => {   // the ground mesh's own height and vertex colour at (x, z): interpolated on its triangles, as drawn
      const W = GM.nx + 1, fx = clamp((x - GM.x0) / GM.cell, 0, GM.nx - 1e-4), fz = clamp((z - GM.z0) / GM.cell, 0, GM.nz - 1e-4), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const A = j * W + i, Bv = A + 1, C = A + W, D = C + 1, [wa, wb, wc, wd] = u + v <= 1 ? [1 - u - v, u, v, 0] : [0, 1 - v, 1 - u, u + v - 1];
      const f = (arr, k) => arr[A * 3 + k] * wa + arr[Bv * 3 + k] * wb + arr[C * 3 + k] * wc + arr[D * 3 + k] * wd;
      return { y: f(GM.pos, 1), c: [f(GM.col, 0), f(GM.col, 1), f(GM.col, 2)] }; };
    const gmLine = (y) => waterline((i, j) => GM.pos[(clamp(j, 0, GM.nz) * (GM.nx + 1) + clamp(i, 0, GM.nx)) * 3 + 1], GM.x0, GM.z0, GM.cell, 0, GM.nx, 0, GM.nz, y);
    const gmBox = (x0, z0, x1, z1) => [Math.max(x0, GM.x0), Math.max(z0, GM.z0), Math.min(x1, GM.x0 + GM.nx * GM.cell), Math.min(z1, GM.z0 + GM.nz * GM.cell)];   // (a box within the ground mesh)

    /* ================= TRACK SURFACE ================= */
    const N = T.N, w = T.w;
    const HYi = (i) => (T.hy ? T.hy[i] : 0);            // road surface height at sample i
    const P = (i, o, y) => [T.px[i] + T.nx[i] * o, HYi(i) + y, T.pz[i] + T.nz[i] * o];
    const HY = (p) => (T.hy ? T.hy[p[3]] : 0);          // height at an atS() result (uses its sample index)
    const makadam = T.def.roadSurface === 'makadam';
    const tileL = makadam ? 6 : 8;                                   // texture tile size (m)
    const rep = T.len / Math.round(T.len / tileL); // texture repeat length (seamless)
    // gravel roads get an irregular, wavy edge instead of a ruler-straight line (visual only, ±0.4 m)
    const edgeW = (i, side) => w + (makadam ? 0.26 * Math.sin(i * 0.37 + side * 1.7) * Math.sin(i * 0.113 + side) + 0.13 * Math.sin(i * 1.31 + side * 2.3) : 0);
    {
      const g = new GB(true);
      const offs = makadam ? Array.from({ length: 15 }, (_, k) => -w + 2 * w * k / 14) : THEME === 'italia' ? [-w, -(w - 0.28), -w * 0.75, -w * 0.5, -w * 0.25, 0, w * 0.25, w * 0.5, w * 0.75, w - 0.28, w] : [-w, -w * 0.75, -w * 0.5, -w * 0.25, 0, w * 0.25, w * 0.5, w * 0.75, w];
      const ashE = (i, o, c) => { const side = o > 0 ? 1 : -1; if (THEME !== 'italia' || Math.abs(o) < w - 1e-6 || (T.curb[i] && !(side * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035))) return c; return [c[0] * 1.07, c[1] * 1.04, c[2] * 0.96]; };   // (V2: grey dust off the gravel)
      const shade = (i, o) => {
        const rl = T.rl[i];
        let k = 1 - 0.2 * Math.exp(-((o - rl) * (o - rl)) / 5.5);
        k -= Math.abs(o) > w * 0.9 ? 0.04 : 0;
        return [k, k, k * 1.01];
      };
      // makadam: compacted, darker driven line; loose lighter gravel elsewhere; patches and damp spots along the road
      const shadeM = (i, o) => {
        const rl = T.rl[i], rut = Math.exp(-((o - rl) * (o - rl)) / 7.5);
        const pat = 0.94 + 0.08 * Math.sin(i * 0.071 + o * 0.35) * Math.sin(i * 0.023 + 1.3) + 0.05 * Math.sin(i * 0.53 + o * 1.1);
        const damp = Math.max(0, Math.sin(i * 0.047 + 0.6) * Math.sin(i * 0.019 + o * 0.21) - 0.72) * 1.6;   // occasional darker wet patches
        let k = pat * (1.05 - 0.3 * rut) * (1 - damp * 0.35);
        const e = sstep(w - 1.6, w, Math.abs(o));
        k *= 1 + 0.07 * e;                                            // loose berm of gravel at the edges
        const r = k * (1 + 0.05 * rut), gg = k * (1 - 0.015 * rut), b = k * (1 - 0.08 * rut);   // driven line: darker, browner
        return Math.abs(o) >= w - 1e-6 ? [r * 0.9, gg * 0.97, b * 0.78] : [r, gg, b];   // grassy tint right at the edge
      };
      const off = (i, o) => (makadam && Math.abs(o) >= w - 1e-6 ? Math.sign(o) * edgeW(i, Math.sign(o)) : o);
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        const v0 = i * T.ds / rep, v1 = (i + 1) * T.ds / rep;
        for (let c = 0; c < offs.length - 1; c++) {
          const o0 = offs[c], o1 = offs[c + 1];
          const a = P(i, off(i, o0), 0.02), b = P(i, off(i, o1), 0.02), cc = P(j, off(j, o1), 0.02), d = P(j, off(j, o0), 0.02);
          const sh = makadam ? shadeM : (k, o) => ashE(k, o, shade(k, o));
          g.quadUp(a, b, cc, d, [sh(i, o0), sh(i, o1), sh(j, o1), sh(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]);
        }
      }
      const mat = makadam
        ? new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.045, shininess: 7, specular: 0x1c1813, vertexColors: true })
        : new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true });
      if (THEME === 'forest') mat.color.setRGB(0.87, 0.89, 1.0);   // a touch more mauve, like the reference
      if (THEME === 'italia') mat.color.setRGB(0.88, 0.87, 0.9);    // purple-grey (Toskana)
      if (THEME === 'kamp') mat.color.setRGB(0.98, 0.95, 0.88);      // lighter, pinkish grey (Gromski rt)
      const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
      out.asphaltMat = mat;
    }
    if (THEME === 'mountain') {   // road shoulders: dirt embankment from the road edge down into the terrain
      const g = new GB(true);
      for (const side of [-1, 1]) for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, v0 = i * T.ds / rep, v1 = (i + 1) * T.ds / rep;
        const ei = edgeW(i, side), ej = edgeW(j, side);
        const a = P(i, side * ei, 0.02), b = P(i, side * (w + 2.2), -1.0), c = P(j, side * (w + 2.2), -1.0), d = P(j, side * ej, 0.02);
        g.quadO(a, b, c, d, [0.72, 0.72, 0.62], P(i, side * (w + 1.1), -4), [[0, v0], [0.37, v0], [0.37, v1], [0, v1]]);
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    if (THEME === 'monaco') {   // city street: dashed centre line
      const g = new GB(), wc = [0.93, 0.93, 0.9];
      for (let s0 = 0; s0 < T.len - 3.2; s0 += 9) {
        let dS = Math.abs(s0 - T.startS); dS = Math.min(dS, T.len - dS); if (dS < 8) continue;
        if (THEME === 'forest') { let km = 0; for (let d = -8; d <= 8; d += 4) km = Math.max(km, Math.abs(T.k[T.idx(s0 + d)])); if (km < 0.014) continue; }   // forest: dashes only through the corners, as in the reference
        const a = atS(s0, -0.13), b = atS(s0, 0.13), c = atS(s0 + 3, 0.13), d = atS(s0 + 3, -0.13);
        g.quadUp([a[0], HY(a) + 0.036, a[1]], [b[0], HY(b) + 0.036, b[1]], [c[0], HY(c) + 0.036, c[1]], [d[0], HY(d) + 0.036, d[1]], [wc, wc, wc, wc]);
      }
      if (THEME === 'monaco') {   // everyday street markings: zebra crossings where the public roads cross (it is a normal town road outside race week)
        for (const f of [0.035, 0.07, 0.17, 0.25, 0.34, 0.47, 0.76, 0.84, 0.9]) {
          const sc = (T.startS + f * T.len) % T.len;
          for (let o = -w + 0.9; o < w - 0.7; o += 1.15) { const a = atS(sc - 1.6, o), b = atS(sc - 1.6, o + 0.55), c = atS(sc + 1.6, o + 0.55), d = atS(sc + 1.6, o);
            g.quadUp([a[0], HY(a) + 0.037, a[1]], [b[0], HY(b) + 0.037, b[1]], [c[0], HY(c) + 0.037, c[1]], [d[0], HY(d) + 0.037, d[1]], [wc, wc, wc, wc]); }
          for (const off of [-3.2, 3.2]) { const a = atS(sc + off - 0.15, -w + 0.4), b = atS(sc + off - 0.15, w - 0.4), c = atS(sc + off + 0.15, w - 0.4), d = atS(sc + off + 0.15, -w + 0.4);   // stop lines either side
            g.quadUp([a[0], HY(a) + 0.037, a[1]], [b[0], HY(b) + 0.037, b[1]], [c[0], HY(c) + 0.037, c[1]], [d[0], HY(d) + 0.037, d[1]], [wc, wc, wc, wc]); }
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // edge lines (painted lines only on sealed roads, not on makadam; the CS-style circuits draw their own, right at the edge, as in the reference)
    if (!makadam && !CSX) {
      const g = new GB();
      const white = [0.95, 0.95, 0.93];
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        for (const [o0, o1] of [[w - 0.55, w - 0.25], [-(w - 0.25), -(w - 0.55)]]) {
          g.quadUp(P(i, o0, 0.035), P(i, o1, 0.035), P(j, o1, 0.035), P(j, o0, 0.035), [white, white, white, white]);
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // curbs
    // (kerbOn: is there a kerb on this side of the 2 m step i -> i + 1; CS style: kerbs on the inside, outside only in hairpins)
    const kerbOn = (i, side) => { const j = (i + 1) % N; return !!(T.curb[i] && T.curb[j]) && !(CSX && side * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035); };
    const kerbRun = (i, side) => { let n = 1; for (let k = 1; k <= 5 && kerbOn((i + N - k) % N, side); k++) n++; for (let k = 1; k <= 5 && kerbOn((i + k) % N, side); k++) n++; return n; };   // (how many 2 m steps long the run of kerb is that step i belongs to: up to 11)
    // Toskana: the kerb's outer edge is worn, never a ruler-straight line: it has crumbled back by KW[0]..KW[1] m, in a gentle wave (three octaves of seeded value
    // noise at the world position, 5, 3 and 1.7 m, summed and not squeezed through a step: no stretch of the edge runs parallel to the road, the seeds are
    // picked so that no 6 m of it stays within 4 cm; the same on every build) and fades softly (vertex alpha over KFD m) into the lawn or the gravel; all in
    // the one kerb mesh, no extra draw call. The gravel shoulder (the dirt shoulders, further down) knows that the kerb is opaque at least out to w + curbW - KW[1].
    const KW = [0.02, 0.45], KFD = 0.45, kN = THEME === 'italia' ? [valueNoise2(9797, 5), valueNoise2(9767, 3), valueNoise2(9737, 1.7)] : null;
    const kWear = (x, z) => clamp(0.235 + (0.11 * (kN[0](x, z) - 0.5) + 0.07 * (kN[1](x, z) - 0.5) + 0.05 * (kN[2](x, z) - 0.5)) / 0.2, KW[0], KW[1]);
    {
      const KI = THEME === 'italia', g = new GB(true, KI);
      const cw = T.curbW;
      const wc = [1, 1, 1];
      for (const side of [-1, 1]) {
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          if (!kerbOn(i, side)) continue;
          const o0 = side * w, o1 = side * (w + cw);
          if (KI) {
            const v0 = i * T.ds / 3, v1 = (i + 1) * T.ds / 3, first = !kerbOn((i + N - 1) % N, side), last = !kerbOn(j, side), rs = kerbRun(i, side) > 4 ? 1 : 2;   // (the first and the last 2 m of a run thin out into the lawn instead of ending in a straight cut; a short piece (up to 8 m) only 1 m: no mere smudge)
            const sec = (h) => { const t = h / 2, s = (i + t) * T.ds, hy = lerp(HYi(i), HYi(j), t), q = atSf(s, side * (w + cw)), e = w + cw - kWear(q[0], q[1]), sh = 0.94 + 0.12 * kN[1](q[0] * 1.7, q[1] * 1.7), u1 = (e - w) / cw,
                a = Math.min(first ? Math.min(1, t * rs) : 1, last ? Math.min(1, (1 - t) * rs) : 1);
              const pt = (o, y) => { const r = atSf(s, side * o); return [r[0], hy + y, r[1]]; };
              return { v: v0 + (v1 - v0) * t, k: [[pt(w, 0.045), [1, 1, 1, a], 0], [pt(e, 0.085), [sh, sh, sh, a], u1], [pt(e + KFD, 0.035), [sh, sh, sh, 0], u1]] }; };   // (cream by the asphalt, red out to the edge, then the same red fading to nothing)
            const S = [sec(0), sec(1), sec(2)];
            for (let h = 0; h < 2; h++) for (let c = 0; c < 2; c++) { const A = S[h], B = S[h + 1];
              g.quadUp(A.k[c][0], A.k[c + 1][0], B.k[c + 1][0], B.k[c][0], [A.k[c][1], A.k[c + 1][1], B.k[c + 1][1], B.k[c][1]], [[A.k[c][2], A.v], [A.k[c + 1][2], A.v], [B.k[c + 1][2], B.v], [B.k[c][2], B.v]]); }
            continue; }
          const v0 = i * T.ds / 3, v1 = (i + 1) * T.ds / 3;
          const a = P(i, o0, 0.045), b = P(i, o1, 0.085), c = P(j, o1, 0.085), d = P(j, o0, 0.045);
          g.quadUp(a, b, c, d, [wc, wc, wc, wc], [[0, v0], [1, v0], [1, v1], [0, v1]]);
          // outer lip
          const e = P(i, o1, 0.0), f = P(j, o1, 0.0);
          g.quadO(b, e, f, c, [0.6, 0.6, 0.6], P(i, side * (w + cw * 0.3), -1), [[1, v0], [1, v0], [1, v1], [1, v1]]);
        }
      }
      const mat = new THREE.MeshLambertMaterial({ map: THEME === 'italia' ? tex.curbIT : THEME === 'kamp' ? tex.curbRY : tex.curb, vertexColors: true, transparent: KI });
      const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; if (KI) m.name = 'kerb'; root.add(m);   // (Toskana: drawn after its gravel shoulder, renderOrder 0 over -1: the soft edge blends over the gravel, never under it)
    }
    // gravel traps
    {
      const g = new GB(true);
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0;
          const inI = w + (T.curb[i] ? T.curbW : 0.35), inJ = w + (T.curb[j] ? T.curbW : 0.35);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          const a = P(i, side * inI, 0.016), b = P(i, side * outI, 0.016), c = P(j, side * outJ, 0.016), d = P(j, side * inJ, 0.016);
          const uvp = (p) => [p[0] / 10, -p[2] / 10];
          const col = [1, 1, 1];
          g.quadUp(a, b, c, d, [col, col, col, col], [uvp(a), uvp(b), uvp(c), uvp(d)]);
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: tex.gravel, vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // start line + grid slots
    {
      const g = new GB(true);
      const i0 = T.startIdx;
      const s0 = T.startS;
      const a = atS(s0 - 0.8, -w), b = atS(s0 - 0.8, w), c = atS(s0 + 0.8, w), d = atS(s0 + 0.8, -w);
      const col = [1, 1, 1];
      const uM = Math.round(w * 2 / 0.8) / 16;   // two rows of 0.8 m squares right across the road (the texture holds 16 x 4 squares)
      g.quadUp([a[0], HY(a) + 0.04, a[1]], [b[0], HY(b) + 0.04, b[1]], [c[0], HY(c) + 0.04, c[1]], [d[0], HY(d) + 0.04, d[1]], [col, col, col, col], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      const mat = new THREE.MeshLambertMaterial({ map: tex.checker });
      tex.checker.repeat.set(1, 1);
      root.add(new THREE.Mesh(g.geometry(), mat));
      const gw = new GB();
      const wh = [0.93, 0.93, 0.9];
      for (let k = 1; k <= 14; k++) {
        const sb = s0 - 9 - (k - 1) * 7.5 + 2.6;
        const lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HY(p0) + 0.037, p0[1]], [p1[0], HY(p1) + 0.037, p1[1]], [p2[0], HY(p2) + 0.037, p2[1]], [p3[0], HY(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HY(q0) + 0.037, q0[1]], [q1[0], HY(q1) + 0.037, q1[1]], [q2[0], HY(q2) + 0.037, q2[1]], [q3[0], HY(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      root.add(new THREE.Mesh(gw.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
      void i0;
    }

    let SKIPBAR = null, MC_ISLAND = null, FO_NOFENCE = null, foPit = null, FO_TYRES = null;
    if (CSX) {
      const fd = T.def;
      const dS = (i) => { let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; return d; };
      // pit lane beside the straight (on its outside): centre offset, tapering in to the circuit edge at both ends
      foPit = (i) => T.pitAt(i * T.ds);   // (the same lane the cars drive in: Core.Track.pitAt)
      SKIPBAR = (side, i) => { if (side < 0) return false; const p = foPit(i); return !!p && p.gap; };   // no barrier where the lane leaves / rejoins the circuit (you drive in and out there)
      const iNear = (px, pz) => { let bi = 0, bd = 1e9; for (let k = 0; k < N; k++) { const dd = (T.px[k] - px) ** 2 + (T.pz[k] - pz) ** 2; if (dd < bd) { bd = dd; bi = k; } } return bi; };
      const st2 = fd.stand2 ? [dS(iNear(...fd.stand2[0])), dS(iNear(...fd.stand2[1]))].sort((a, b) => a - b) : null;
      FO_TYRES = [new Uint8Array(N), new Uint8Array(N)];   // [left, right]: outside of every corner of severity >= 2 (Bakreni gozd: and the inside of the lakeside top-left corner)
      const iTL = THEME === 'forest' ? iNear(4, 6) : -1;
      for (const c of T.corners) { if (c.sev < (THEME === 'forest' ? 2 : 1)) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, out = -c.dir, inTL = iTL >= 0 && ((iTL - c.i0 + N) % N) <= (i1c - c.i0);
        for (let k = c.i0 - 8; k <= i1c + (THEME === 'forest' ? 8 : 16); k++) { const ii = ((k % N) + N) % N; if (Math.abs(T.k[ii]) < 0.006 && (k < c.i0 || k > i1c)) continue; FO_TYRES[out > 0 ? 1 : 0][ii] = 1; if (inTL && c.sev >= 3) FO_TYRES[out > 0 ? 0 : 1][ii] = 1; } }   // (the newer circuits: every corner, and on well past the exit, where the cars run wide, as in the reference)
      const ST = THEME === 'forest' ? null : fd.stands || [];   // the newer circuits: [from, to, side, rows] in metres from the start line
      FO_NOFENCE = ST ? (side, i) => { if (side > 0 && foPit(i)) return true; const d = dS(i); return ST.some(([a, b, sd]) => sd === side && [d, d - T.len, d + T.len].some(x => x > a - 4 && x < b + 4)) || (fd.flags || []).some(([a, b, sd]) => sd === side && d > a - 30 && d < b + 8); }   // (stands past half a lap too; the flag bank stands on open grass behind the bare rail)
        : (side, i) => { const d = dS(i);
          if (side > 0) return !!foPit(i);                                                  // the pit wall is a bare rail
          return (d > -110 && d < -19) || (st2 && d > st2[0] - 4 && d < st2[1] + 4); };      // the stands carry their own catch fence
    }
    if (THEME === 'monaco') {   // Fairmont hairpin: the inside is a planted island ringed by kerbs, not a barrier
      const bi = MC_TER ? MC_TER.apex : 0;
      const k = T.k[bi], Rr = 1 / Math.max(1e-3, Math.abs(k)), sg = k > 0 ? 1 : -1, cx = T.px[bi] + T.nx[bi] * sg * Rr, cz = T.pz[bi] + T.nz[bi] * sg * Rr;
      const rI = clamp(Rr - w - 0.9, 2.5, 9);
      MC_ISLAND = { i: bi, s: bi * T.ds, sg, Rr, cx, cz, rI };
      const near = (i) => { let d = Math.abs(i * T.ds - MC_ISLAND.s); d = Math.min(d, T.len - d); return d < 28; };
      SKIPBAR = (side, i) => side === sg && near(i);
      const inner = sg > 0 ? T.br : T.bl;   // walls on the island's planter edge (so nobody drives across it)
      for (let i = 0; i < N; i++) if (near(i)) { const d = Math.hypot(T.px[i] - cx, T.pz[i] - cz) - rI; if (d > w + 0.3 && d < inner[i]) inner[i] = d; }
    }
    /* ================= BARRIERS ================= */
    const scen = new Chunks(110);        // vertex-colored static scenery
    const treeCh = new Chunks(110);      // the woods that sway in the wind (lake, mountain: see swayMat)
    const texTires = new GB(true), texSpons = new GB(true), texFence = new GB(true), texCrowd = new GB(true);
    const tyreCh = new Chunks(110, true), FO_TR = THEME === 'italia' ? [0.27, 0.6, 0.35] : THEME === 'kamp' ? [0.2, 0.2, 0.22] : [0.88, 0.33, 0.24], FO_TW = THEME === 'kamp' ? [0.13, 0.13, 0.15] : THEME === 'italia' ? [0.92, 0.89, 0.74] : [0.95, 0.95, 0.94];   // painted tyres (textured, in chunks so the unseen ones are culled): red / white, Toskana green / white, Gromski rt plain black
    if (THEME !== 'mountain') {
      const dStart = (i) => { let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; return d; };
      for (const side of [-1, 1]) {
        const bar = side > 0 ? T.br : T.bl, grav = side > 0 ? T.gravR : T.gravL;
        const type = new Uint8Array(N); // 0 armco, 1 concrete, 2 tires
        for (let i = 0; i < N; i++) {
          const ds = dStart(i);
          if (ds > -200 && ds < 215) type[i] = 1;
          else { let gv = 0; for (let d = -4; d <= 4; d++) gv |= grav[(i + d + N) % N]; type[i] = gv ? 2 : 0; }
          if (THEME === 'monaco') type[i] = 0;
          if (CSX) type[i] = FO_TYRES && FO_TYRES[side > 0 ? 1 : 0][i] ? 2 : 0;   // armco + catch fence, tyre walls only round the outside of the real corners (as in the reference)
        }
        const Q = (i, extra, y) => { const o = side * (bar[i] + 0.25 + extra); return [T.px[i] + T.nx[i] * o, y + HYi(i), T.pz[i] + T.nz[i] * o]; };
        const inward = (i) => Q(i, 3, 0.5);  // point behind the barrier (away from track)
        const outward = (i) => Q(i, -3, 0.5); // point on track side
        let lenAcc = 0, sponsorAcc = 0, fenceAcc = 0;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N, t = type[i];
          const segL = Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]);
          if (SKIPBAR && SKIPBAR(side, i)) { lenAcc += segL; continue; }
          const g = scen.get(T.px[i] + T.nx[i] * side * bar[i], T.pz[i] + T.nz[i] * side * bar[i]);
          if (t === 0 && CSX && THEME !== 'forest') { // armco as in the reference: a grey W-beam (two bulges, a dark groove between, a pale top edge) on short dark red posts every 3 m, a chain-link fence behind
            const rl = [0.78, 0.8, 0.83], rd = [0.5, 0.52, 0.56], rb = [0.46, 0.47, 0.5];
            g.quadO(Q(i, 0, 0.36), Q(j, 0, 0.36), Q(j, 0, 0.55), Q(i, 0, 0.55), rl, inward(i));
            g.quadO(Q(i, 0.05, 0.55), Q(j, 0.05, 0.55), Q(j, 0.05, 0.63), Q(i, 0.05, 0.63), rd, inward(i));
            g.quadO(Q(i, 0, 0.63), Q(j, 0, 0.63), Q(j, 0, 0.82), Q(i, 0, 0.82), rl, inward(i));
            g.quadO(Q(i, 0, 0.82), Q(j, 0, 0.82), Q(j, 0.1, 0.84), Q(i, 0.1, 0.84), [0.93, 0.94, 0.95], [Q(i, 0.05, -3)[0], -3, Q(i, 0.05, -3)[2]]);
            g.quadO(Q(i, 0.1, 0.36), Q(j, 0.1, 0.36), Q(j, 0.1, 0.84), Q(i, 0.1, 0.84), rb, outward(i));
            const pc = THEME === 'kamp' ? [0.52, 0.2, 0.17] : [0.5, 0.22, 0.18];
            for (let q = Math.ceil(lenAcc / 3); q * 3 < lenAcc + segL; q++) { const f = (q * 3 - lenAcc) / segL, a = Q(i, 0.2, 0), b = Q(j, 0.2, 0), x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f, y = a[1] + (b[1] - a[1]) * f;
              box(g, x, y, z, 0.16, 0.92, 0.16, T.hd[i], pc, pc.map(v => v * 1.35)); }
            if (!(FO_NOFENCE && FO_NOFENCE(side, i))) {
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.55, 0.3), Q(j, 0.55, 0.3), Q(j, 0.55, 3.0), Q(i, 0.55, 3.0), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.1], [fu0, 1.1]]);
              if (i % 3 === 0) { const pp = Q(i, 0.6, 0); box(g, pp[0], pp[1], pp[2], 0.1, 3.1, 0.1, T.hd[i], [0.62, 0.63, 0.66]); } }
          } else if (t === 0) { // armco
            const rail = [0.8, 0.82, 0.85], railD = [0.55, 0.57, 0.6];
            g.quadO(Q(i, 0, 0.45), Q(j, 0, 0.45), Q(j, 0, 0.78), Q(i, 0, 0.78), rail, inward(i));
            g.quadO(Q(i, 0.02, 0.45), Q(j, 0.02, 0.45), Q(j, 0.02, 0.78), Q(i, 0.02, 0.78), railD, outward(i));
            g.quadO(Q(i, 0, 0.78), Q(j, 0, 0.78), Q(j, 0.12, 0.8), Q(i, 0.12, 0.8), [0.9, 0.9, 0.92], [Q(i, 0.06, -3)[0], -3, Q(i, 0.06, -3)[2]]);
            if (i % 2 === 0) { const p = Q(i, 0.12, 0); box(g, p[0], p[1], p[2], 0.14, 0.8, 0.14, T.hd[i], THEME === 'kamp' ? [0.5, 0.24, 0.26] : CSX ? [0.3, 0.26, 0.28] : [0.42, 0.43, 0.46]); }
            if (CSX && !(FO_NOFENCE && FO_NOFENCE(side, i))) {   // light chain-link catch fence right behind the rail, as everywhere in the reference
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.45, 0.8), Q(j, 0.45, 0.8), Q(j, 0.45, 3.0), Q(i, 0.45, 3.0), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 0.9], [fu0, 0.9]]);
              if (i % 3 === 0) { const pp = Q(i, 0.5, 0); box(g, pp[0], pp[1], pp[2], 0.1, 3.1, 0.1, T.hd[i], [0.62, 0.63, 0.66]); }
            }
            if (THEME === 'monaco') {   // Monaco: double armco under a tall catch fence the whole way round
              g.quadO(Q(i, 0, 0.1), Q(j, 0, 0.1), Q(j, 0, 0.42), Q(i, 0, 0.42), [0.7, 0.72, 0.75], inward(i));
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.2, 0.8), Q(j, 0.2, 0.8), Q(j, 0.2, 3.6), Q(i, 0.2, 3.6), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.15], [fu0, 1.15]]);
              if (i % 3 === 0) { const p = Q(i, 0.25, 0); box(g, p[0], p[1], p[2], 0.1, 3.8, 0.1, T.hd[i], [0.35, 0.36, 0.38]); }
            }
          } else if (t === 1) { // concrete wall with painted top band
            const hgt = 1.05, top = ((i >> 1) % 2) ? [0.85, 0.16, 0.14] : [0.95, 0.95, 0.93];
            const wall = [0.78, 0.78, 0.76];
            g.quadO(Q(i, 0, 0), Q(j, 0, 0), Q(j, 0, hgt * 0.72), Q(i, 0, hgt * 0.72), wall, inward(i));
            g.quadO(Q(i, 0, hgt * 0.72), Q(j, 0, hgt * 0.72), Q(j, 0, hgt), Q(i, 0, hgt), top, inward(i));
            g.quadO(Q(i, 0, hgt), Q(j, 0, hgt), Q(j, 0.4, hgt), Q(i, 0.4, hgt), [0.86, 0.86, 0.84], [Q(i, 0.2, -3)[0], -3, Q(i, 0.2, -3)[2]]);
            g.quadO(Q(i, 0.4, 0), Q(j, 0.4, 0), Q(j, 0.4, hgt), Q(i, 0.4, hgt), [0.6, 0.6, 0.58], outward(i));
          } else if (CSX) { // tyre wall as in the reference: columns of three painted tyres (red and white in pairs), armco and mesh fence behind
            const TYR = THEME === 'italia' ? [0.68, 1.23, 1.39, 0.45, 1.65, 2.55] : THEME === 'kamp' ? [0.56, 1.02, 1.14, 0.3, 1.3, 2.05] : [0.43, 0.78, 0.88, 0.2, 0.95, 1.5];   // radius, height (three tyres), spacing, the two rows' offsets, the rail behind (Toskana: the fat stacks of the reference, four high; Gromski rt: big black tyres)
            const SP = TYR[2], gt = tyreCh.get(T.px[i] + T.nx[i] * side * bar[i], T.pz[i] + T.nz[i] * side * bar[i]);
            for (const [row, off] of [[0, TYR[3]], [1, TYR[4]]]) {   // two staggered rows of fat painted tyres, three high, red and white in pairs (as in the reference)
              const a = Q(i, off, 0), b = Q(j, off, 0);
              for (let m = Math.ceil(lenAcc / SP - 0.5 * row); (m + 0.5 * row) * SP < lenAcc + segL; m++) { const t2 = ((m + 0.5 * row) * SP - lenAcc) / segL, x = a[0] + (b[0] - a[0]) * t2, z = a[2] + (b[2] - a[2]) * t2, y = a[1] + (b[1] - a[1]) * t2;
                tyreCol(gt, x, y, z, TYR[1], TYR[0], ((m + row) >> 1) % 2 ? FO_TW : FO_TR, m * 0.7);
                if (THEME === 'italia') tyreCol(gt, x, y + TYR[1], z, TYR[1] / 3, TYR[0], ((m + row) >> 1) % 2 ? FO_TW : FO_TR, m * 0.7 + 0.3, 0.832); } }
            g.quadO(Q(i, TYR[5], 0.32), Q(j, TYR[5], 0.32), Q(j, TYR[5], 0.72), Q(i, TYR[5], 0.72), [0.72, 0.73, 0.76], inward(i));
            const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
            texFence.quadO(Q(i, TYR[5] + 0.3, 0.72), Q(j, TYR[5] + 0.3, 0.72), Q(j, TYR[5] + 0.3, 3.2), Q(i, TYR[5] + 0.3, 3.2), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.0], [fu0, 1.0]]);
            if (i % 3 === 0) { const pp = Q(i, TYR[5] + 0.35, 0); box(g, pp[0], pp[1], pp[2], 0.12, 3.3, 0.12, T.hd[i], [0.35, 0.36, 0.38]); }
          } else { // tire wall
            const u0 = lenAcc / 3, u1 = (lenAcc + segL) / 3;
            const fv0 = THEME === 'forest' ? 0.52 : 0.02;
            texTires.quadO(Q(i, 0, 0), Q(j, 0, 0), Q(j, 0, 0.95), Q(i, 0, 0.95), [1, 1, 1], inward(i), [[u0, fv0], [u1, fv0], [u1, 0.98], [u0, 0.98]]);
            if (THEME === 'forest') texTires.quadO(Q(i, 0, 0.95), Q(j, 0, 0.95), Q(j, 0.95, 0.95), Q(i, 0.95, 0.95), [1, 1, 1], [T.px[i], -5, T.pz[i]], [[u0, 0.02], [u1, 0.02], [u1, 0.48], [u0, 0.48]]);   // tyre tops, seen from above
            g.quadO(Q(i, 0, 0.95), Q(j, 0, 0.95), Q(j, 0.75, 0.95), Q(i, 0.75, 0.95), [0.1, 0.1, 0.11], [Q(i, 0.3, -3)[0], -3, Q(i, 0.3, -3)[2]]);
            // catch fence
            fenceAcc += segL;
            const fu0 = (lenAcc) / 2.5, fu1 = (lenAcc + segL) / 2.5;
            texFence.quadO(Q(i, 1.4, 0.95), Q(j, 1.4, 0.95), Q(j, 1.4, 4.0), Q(i, 1.4, 4.0), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.25], [fu0, 1.25]]);
            if (i % 3 === 0) { const p = Q(i, 1.45, 0); box(g, p[0], p[1], p[2], 0.12, 4.1, 0.12, T.hd[i], [0.3, 0.31, 0.33]); }
          }
          // sponsor boards
          sponsorAcc += segL;
          if ((t === 1 || (t === 2 && !CSX) || THEME === 'monaco') && sponsorAcc > 9 && type[j] === t) {
            sponsorAcc = 0;
            const k = Math.floor(R() * 8);
            const u0 = (k % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(k / 2) * 0.25, vBot = vTop - 0.25;
            const i2 = (i + 2) % N;
            const extra = t === 2 ? -0.35 : -0.03;
            const y0 = t === 2 ? 0.1 : 0.12, y1 = t === 2 ? 0.95 : 0.74;
            const A = Q(i, extra, y0), Bp = Q(i2, extra, y0), Cp = Q(i2, extra, y1), D = Q(i, extra, y1);
            // reading direction: right side barrier reads against track direction
            const uv = side > 0 ? [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]] : [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]];
            texSpons.quadO(A, Bp, Cp, D, [1, 1, 1], inward(i), uv);
            if (t === 2) { // board also facing up-ish back
              texSpons.quadO(D, Cp, Q(i2, extra + 0.08, y1), Q(i, extra + 0.08, y1), [0.3, 0.3, 0.3], [A[0], -5, A[2]], [[u0, vTop], [u1, vTop], [u1, vTop], [u0, vTop]]);
            }
          }
          lenAcc += segL;
        }
      }
    }

    /* ================= START GANTRY ================= */
    if (!CSX) {   // (the CS-style circuits have only the painted chequered line, as in the reference)
      const [x, z, h, i] = atS(sStart, 0);
      const gy = (T.hy ? T.hy[i] : 0);
      const g = scen.get(x, z);
      const span = Math.max(T.bl[i], T.br[i]) + 1.2;
      const nx = T.nx[i], nz = T.nz[i];
      const gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy, z + nz * span * sd, 0.8, 7.6, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      // light panel
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [];
      const lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * 1.0;
        const m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 }));
        m.position.set(x + nx * o, gy + 7.95, z + nz * o);
        root.add(m); lights.push(m);
      }
      out.dyn.lights = lights;
      // banner on gantry
      const u0 = 0, u1 = 0.5, vTop = 1 - 3 * 0.25, vBot = vTop - 0.25;
      const tx = T.tx[i], tz = T.tz[i];
      const half = span - 1.5;
      for (const f of [-1, 1]) {
        const cx = x + tx * 0.56 * f, cz = z + tz * 0.56 * f;
        const A = [cx - nx * half, gy + 6.45, cz - nz * half], Bp = [cx + nx * half, gy + 6.45, cz + nz * half], C = [cx + nx * half, gy + 7.65, cz + nz * half], D = [cx - nx * half, gy + 7.65, cz - nz * half];
        texSpons.quadO(A, Bp, C, D, [1, 1, 1], [x, 7, z], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]);
      }
    }

    /* ================= GRANDSTANDS (outside of main straight = left side) ================= */
    const sNear = (px, pz) => { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - px, T.pz[i] - pz); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
    const standSpecs = CSX ? [] : THEME === 'mountain' || THEME === 'monaco' ? [] : [[sStart - 150, sStart - 40], [sStart - 25, sStart + 95]];
    for (const [sa, sb] of standSpecs) {
      const sm = (sa + sb) / 2, L = sb - sa;
      const im = T.idx(sm);
      const b0 = T.bl[im] + 3.2;
      const hd = T.hd[im];
      const tiers = 7;
      for (let k = 0; k < tiers; k++) {
        const lat = -(b0 + k * 1.55 + 0.8);
        const [x, z] = atS(sm, lat);
        const g = scen.get(x, z);
        const hgt = 0.6 + k * 0.72;
        box(g, x, 0, z, L, hgt, 1.55, hd, [0.62, 0.63, 0.66], [0.5, 0.52, 0.56]);
        // crowd strip on top of tier (textured)
        const a = atS(sa, lat - 0.7), bq = atS(sb, lat - 0.7), c = atS(sb, lat + 0.55), d = atS(sa, lat + 0.55);
        const y = hgt + 0.02;
        texCrowd.quadUp([a[0], y, a[1]], [bq[0], y, bq[1]], [c[0], y, c[1]], [d[0], y, d[1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, k * 0.14], [L / 12, k * 0.14], [L / 12, k * 0.14 + 0.13], [0, k * 0.14 + 0.13]]);
      }
      // back wall + roof + pillars
      const backLat = -(b0 + tiers * 1.55 + 1.2);
      const [bx, bz] = atS(sm, backLat);
      const g = scen.get(bx, bz);
      box(g, bx, 0, bz, L, 6.2, 0.6, hd, [0.55, 0.56, 0.6]);
      for (let s = sa; s <= sb + 0.1; s += 15) { const [px, pz] = atS(s, backLat + 0.2); box(g, px, 0, pz, 0.4, 8.6, 0.4, hd, [0.85, 0.86, 0.88]); }
      if (THEME === 'forest') for (let s0 = sa; s0 < sb - 4; s0 += 8) {   // yellow sponsor boards along the front of the open stand
        const a = atS(s0, -(b0 - 0.4)), b = atS(s0 + 7.6, -(b0 - 0.4)), g = scen.get(a[0], a[1]), yc = [0.98, 0.78, 0.18];
        g.quadO([a[0], 0.2, a[1]], [b[0], 0.2, b[1]], [b[0], 1.3, b[1]], [a[0], 1.3, a[1]], yc, [T.px[im], 0.7, T.pz[im]]);
        g.quadO([a[0], 0.62, a[1]], [b[0], 0.62, b[1]], [b[0], 0.88, b[1]], [a[0], 0.88, a[1]], [0.85, 0.2, 0.15], [T.px[im], 0.7, T.pz[im]]); }
      // cantilever roof over the upper tiers only, striped panels: crowd stays visible from above
      const roofD = tiers * 1.55 * 0.45 + 1.4;
      const roofLat = backLat + roofD / 2 - 0.2;
      let stripe = 0;
      for (let s0 = sa - 1; s0 < sb + 1 && THEME !== 'forest'; s0 += 6, stripe++) {   // (forest: open stands, as in the reference)
        const segL = Math.min(6, sb + 1 - s0);
        const [sx0, sz0] = atS(s0 + segL / 2, roofLat);
        const top = stripe % 2 ? [0.94, 0.95, 0.96] : [0.2, 0.45, 0.8];
        box(scen.get(sx0, sz0), sx0, 8.6, sz0, segL + 0.02, 0.35, roofD, hd, [0.8, 0.82, 0.86], top);
      }
      const [rx, rz] = atS(sm, -(b0 + tiers * 1.55 * 0.5 + 0.4));
      exclRect.push({ x: rx, z: rz, hx: L / 2 + 6, hz: tiers * 1.55 / 2 + 8, rot: hd });
    }

    /* ================= PIT BUILDING (inside of main straight = right side) ================= */
    if (THEME === 'lake') {
      const sa = sStart - 95, sb = sStart + 60, sm = (sa + sb) / 2, L = sb - sa;
      const im = T.idx(sm), hd = T.hd[im];
      const b0 = T.br[im];
      // pit lane asphalt
      const g0 = new GB(true);
      for (let s = sa - 30; s < sb + 30; s += 2) {
        const a = atS(s, b0 + 0.6), bq = atS(s, b0 + 12.5), c = atS(s + 2, b0 + 12.5), d = atS(s + 2, b0 + 0.6);
        const cc = [0.92, 0.92, 0.94];
        g0.quadUp([a[0], 0.02, a[1]], [bq[0], 0.02, bq[1]], [c[0], 0.02, c[1]], [d[0], 0.02, d[1]], [cc, cc, cc, cc], [[a[0] / 8, a[1] / 8], [bq[0] / 8, bq[1] / 8], [c[0] / 8, c[1] / 8], [d[0] / 8, d[1] / 8]]);
      }
      const pm = new THREE.Mesh(g0.geometry(), out.asphaltMat); pm.receiveShadow = true; root.add(pm);
      // pit lane line
      const gl = scen.get(...atS(sm, b0 + 6).slice(0, 2));
      for (let s = sa - 30; s < sb + 30; s += 2) { const a = atS(s, b0 + 6.3), bq = atS(s, b0 + 6.6), c = atS(s + 2, b0 + 6.6), d = atS(s + 2, b0 + 6.3); const cc = [0.95, 0.85, 0.2]; gl.quadUp([a[0], 0.03, a[1]], [bq[0], 0.03, bq[1]], [c[0], 0.03, c[1]], [d[0], 0.03, d[1]], [cc, cc, cc, cc]); }
      const lat = b0 + 13 + 7;
      const [x, z] = atS(sm, lat);
      const g = scen.get(x, z);
      box(g, x, 0, z, L, 3.6, 14, hd, [0.93, 0.93, 0.92]);
      box(g, x, 3.6, z, L, 2.6, 13, hd, [0.16, 0.24, 0.34], [0.2, 0.28, 0.38]); // glass upper floor
      box(g, x, 6.2, z, L + 1, 0.5, 15, hd, [0.95, 0.95, 0.96], [0.88, 0.89, 0.9]);
      const [sx2, sz2] = atS(sm, lat - 7.6);
      box(g, sx2, 6.25, sz2, L + 1, 0.55, 0.3, hd, [0.85, 0.12, 0.12]);
      // garages
      const nG = 12;
      for (let k = 0; k < nG; k++) {
        const s = sa + (k + 0.5) * L / nG;
        const [gx, gz] = atS(s, lat - 7.05);
        box(g, gx, 0, gz, L / nG * 0.72, 3.0, 0.2, hd, [0.18, 0.19, 0.22]);
        const [fx, fz] = atS(s, lat - 7.25);
        const teamCol = hex([0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x2fa84f, 0xd81f45, 0xf07a1a][k % 6]);
        box(g, fx, 3.05, fz, L / nG * 0.72, 0.45, 0.2, hd, teamCol);
      }
      // control tower
      const [tx, tz] = atS(sb + 12, lat - 2);
      box(g, tx, 0, tz, 9, 14, 9, hd, [0.9, 0.9, 0.9]);
      box(g, tx, 14, tz, 10, 3, 10, hd, [0.14, 0.22, 0.32]);
      box(g, tx, 17, tz, 11, 0.5, 11, hd, [0.85, 0.12, 0.12], [0.93, 0.93, 0.95]);
      exclRect.push({ x, z, hx: L / 2 + 30, hz: 16, rot: hd });
      // paddock trucks & parking behind
      for (let k = 0; k < 9; k++) {
        const s = sa + 8 + k * 16;
        const [px, pz] = atS(s, lat + 14);
        if (lakeSD(px, pz) < 10) continue;
        const colr = hex(Core.DRIVER_NAMES && [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x2fa84f, 0xd81f45, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0x3b3fa8][k]);
        box(g, px, 0.4, pz, 12, 3.4, 2.5, hd, colr, [0.92, 0.92, 0.94]);
        const [cx2, cz2] = atS(s + 7.5, lat + 14);
        box(g, cx2, 0.4, cz2, 2.6, 2.8, 2.5, hd, [0.25, 0.26, 0.3]);
      }
      const carCols = [[0.8, 0.1, 0.1], [0.1, 0.3, 0.8], [0.9, 0.9, 0.9], [0.15, 0.15, 0.17], [0.9, 0.75, 0.1], [0.2, 0.6, 0.3], [0.6, 0.6, 0.65]];
      for (let row = 0; row < 3; row++) for (let k = 0; k < 22; k++) {
        if (R() < 0.25) continue;
        const s = sa + 4 + k * 5.2;
        const [px, pz] = atS(s, lat + 24 + row * 7);
        if (lakeSD(px, pz) < 6 || clearance(px, pz) < 5) continue;
        const cc = carCols[Math.floor(R() * carCols.length)];
        box(g, px, 0, pz, 4.1, 0.75, 1.75, hd + Math.PI / 2, cc);
        box(g, px, 0.75, pz, 2.1, 0.55, 1.5, hd + Math.PI / 2, [0.12, 0.16, 0.22], cc);
        excl.push({ x: px, z: pz, r: 4 });
      }
    }

    /* ================= LAKE ================= */
    if (THEME === 'lake') {
      const wg = new THREE.BufferGeometry();
      const pts = [LAKE.cx, -0.4, LAKE.cz], uvs = [LAKE.cx / 22, -LAKE.cz / 22], idx = [];
      const M = 96;
      for (let k = 0; k <= M; k++) {
        const th = k / M * TAU; const r = lakeEdge(th) * 1.08;
        const x = LAKE.cx + Math.cos(th) * LAKE.rx * r, z = LAKE.cz + Math.sin(th) * LAKE.rz * r;
        pts.push(x, -0.4, z); uvs.push(x / 22, -z / 22);
        if (k > 0) idx.push(0, k + 1, k);
      }
      wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      wg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      wg.setIndex(idx); wg.computeVertexNormals();
      // ensure normals up
      const nrm = wg.getAttribute('normal'); for (let k = 0; k < nrm.count; k++) nrm.setXYZ(k, 0, 1, 0);
      const WO = { len: 1, amp: 1, refl: 0.45, land: 0.6, shal: 0.6, lap: 0.7, surf: 0.2 }, wmat = waterMat(tex, WO);
      const wm = new THREE.Mesh(wg, wmat); wm.receiveShadow = true; root.add(wm);
      addShore(root, shoreBand(...gmBox(LAKE.cx - LAKE.rx * 1.35, LAKE.cz - LAKE.rz * 1.35, LAKE.cx + LAKE.rx * 1.35, LAKE.cz + LAKE.rz * 1.35), -0.385, gmLine(-0.4), 22), wmat, WO);   // (the shore, the island's too)
      out.dyn.water = tex.water;
      excl.push({ x: LAKE.cx, z: LAKE.cz, r: 0 });
      // island church
      const g = scen.get(ISL.x, ISL.z);
      const hy = 0.85;
      const rot = 0.35;
      box(g, ISL.x, hy, ISL.z, 9, 4.6, 5.2, rot, [0.96, 0.95, 0.9]);
      gable(g, ISL.x, hy + 4.6, ISL.z, 9.6, 6.0, 2.8, rot, [0.72, 0.24, 0.16], [0.96, 0.95, 0.9]);
      const c = Math.cos(rot), s = Math.sin(rot);
      const tx = ISL.x - c * 5.6, tz = ISL.z - s * 5.6;
      box(g, tx, hy, tz, 2.8, 12, 2.8, rot, [0.97, 0.96, 0.92]);
      box(g, tx, hy + 9.2, tz, 2.9, 0.4, 2.9, rot, [0.6, 0.55, 0.5]);
      cone(g, tx, hy + 12, tz, 2.1, 5.2, 4, [0.25, 0.27, 0.3], [0.3, 0.32, 0.35], rot + Math.PI / 4);
      box(g, ISL.x + c * 5.2, hy, ISL.z + s * 5.2, 2.2, 3.2, 3.4, rot, [0.94, 0.93, 0.88]);
      for (let k = 0; k < 7; k++) {
        const a = R() * TAU, r = 5.5 + R() * 3;
        const px = ISL.x + Math.cos(a) * r, pz = ISL.z + Math.sin(a) * r;
        if (Math.hypot(px - tx, pz - tz) < 3) continue;
        const hgt = 5 + R() * 4;
        box(g, px, hy - 0.3, pz, 0.35, hgt * 0.45, 0.35, 0, [0.4, 0.28, 0.18]);
        ico(g, px, hy + hgt * 0.62, pz, 1.8 + R() * 0.8, 1.15, vary([0.3, 0.55, 0.22], R, 0.2), R, 0.25);
      }
      // pier on south shore
      const [px0, pz0] = [LAKE.cx + 10, LAKE.cz + LAKE.rz * lakeEdge(Math.PI / 2 + 0.2) * 0.98];
      const gp = scen.get(px0, pz0);
      box(gp, px0, -0.1, pz0 - 6, 2.4, 0.35, 16, 0, [0.55, 0.4, 0.26], [0.62, 0.46, 0.3]);
      // swans (static)
      for (let k = 0; k < 7; k++) {
        const a = R() * TAU, r = 0.35 + R() * 0.5;
        const px = LAKE.cx + Math.cos(a) * LAKE.rx * r, pz = LAKE.cz + Math.sin(a) * LAKE.rz * r;
        if (Math.hypot(px - ISL.x, pz - ISL.z) < ISL.r + 4) continue;
        const gs = scen.get(px, pz); const ro = R() * TAU;
        box(gs, px, -0.45, pz, 1.0, 0.45, 0.55, ro, [0.97, 0.97, 0.97]);
        const hx = px + Math.cos(ro) * 0.45, hz = pz + Math.sin(ro) * 0.45;
        box(gs, hx, -0.1, hz, 0.12, 0.65, 0.12, ro, [0.97, 0.97, 0.97]);
        box(gs, hx + Math.cos(ro) * 0.12, 0.5, hz + Math.sin(ro) * 0.12, 0.28, 0.12, 0.12, ro, [0.95, 0.5, 0.1]);
      }
      // pletna boats (dynamic)
      const boats = [];
      for (let k = 0; k < 3; k++) {
        const bg = new GB();
        box(bg, 0, -0.5, 0, 7.5, 0.7, 1.9, 0, [0.5, 0.33, 0.2], [0.6, 0.42, 0.26]);
        box(bg, 3.9, -0.5, 0, 0.9, 0.85, 1.2, 0, [0.5, 0.33, 0.2]);
        for (const px of [-2, 2]) for (const pz of [-0.8, 0.8]) box(bg, px, 0.1, pz, 0.08, 1.4, 0.08, 0, [0.9, 0.9, 0.9]);
        const canopy = k % 2 ? [0.85, 0.15, 0.15] : [0.95, 0.95, 0.92];
        box(bg, 0, 1.45, 0, 4.8, 0.12, 2.1, 0, canopy, k % 2 ? [0.95, 0.95, 0.92] : [0.85, 0.15, 0.15]);
        const m = new THREE.Mesh(bg.geometry(), matV); m.castShadow = true; root.add(m);
        boats.push({ m, a: k * 2.1, sp: 0.018 + k * 0.004, r: 0.62 + k * 0.1 });
      }
      out.dyn.boats = boats; out.dyn.lake = LAKE;
      excl.push({ x: ISL.x, z: ISL.z, r: ISL.r + 30 });
    }

    /* ================= SPONSOR BRIDGE ================= */
    if (THEME !== 'mountain' && THEME !== 'monaco' && !CSX) {   // (none over the CS-style circuits, as in the reference)
      // find straight section far from start
      let bestI = -1, bestScore = -1;
      for (let i = 0; i < N; i++) {
        let d = Math.abs(i * T.ds - sStart); d = Math.min(d, T.len - d);
        if (d < 420) continue;
        let mk = 0; for (let o = -14; o <= 14; o++) mk = Math.max(mk, Math.abs(T.k[(i + o + N) % N]));
        if (mk > 1 / 400) continue;
        const sc = d + 2000 * (1 / 400 - mk);
        if (sc > bestScore) { bestScore = sc; bestI = i; }
      }
      if (bestI >= 0) {
        const i = bestI, x = T.px[i], z = T.pz[i], h = T.hd[i];
        const nx = T.nx[i], nz = T.nz[i];
        const g = scen.get(x, z);
        const L1 = T.bl[i] + 1.8, L2 = T.br[i] + 1.8;
        box(g, x - nx * L1, 0, z - nz * L1, 2.4, 9.4, 2.4, h, [0.9, 0.9, 0.92]);
        box(g, x + nx * L2, 0, z + nz * L2, 2.4, 9.4, 2.4, h, [0.9, 0.9, 0.92]);
        const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2;
        box(g, cx, 6.6, cz, 2.6, 2.0, L1 + L2 + 2.4, h, [0.12, 0.13, 0.16], [0.95, 0.8, 0.12]);
        const half = (L1 + L2) / 2 - 1.2;
        const tx = T.tx[i], tz = T.tz[i];
        const k = 2, u0 = (k % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(k / 2) * 0.25, vBot = vTop - 0.25;
        for (const f of [-1, 1]) {
          const bx = cx + tx * 1.32 * f, bz = cz + tz * 1.32 * f;
          const A = [bx - nx * half, 6.75, bz - nz * half], Bp = [bx + nx * half, 6.75, bz + nz * half], C = [bx + nx * half, 8.45, bz + nz * half], D = [bx - nx * half, 8.45, bz - nz * half];
          texSpons.quadO(A, Bp, C, D, [1, 1, 1], [cx, 7.5, cz], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]);
        }
        out.bridgeIdx = i;
      }
    }

    /* ================= SPECTATORS: the instanced crowd layer (crowdCtx / crowdRun), fed by the corner crowds below and by runs per theme ================= */
    const CR = (() => { const cell = THEME === 'mountain' ? 6 : 8;
      return crowdCtx({ grid: { arr: out.ground.geometry.attributes.position.array, x0: B.minX, z0: B.minZ, cell, nx: Math.ceil((B.maxX - B.minX) / cell) + 1, nz: Math.ceil((B.maxZ - B.minZ) / cell) + 1 },
        near: clearance, excluded,
        water: (x, z) => lakeSD(x, z) < 3 || (RIVER && distRiver(x, z) < RW / 2 + 2) || (CSX && shoreFO(x, z) < 2.5) || groundH(x, z) < (THEME === 'monaco' ? 1.0 : -0.3) || (THEME !== 'monaco' && CR.gH(x, z) < -0.3) }); })();   // (the mesh sags between its 8 m vertices towards a river bed)
    exclF.push(CR.exclTest);   // trees and rocks placed later keep clear of the crowds
    const crFirst = (i, side) => {   // front row offset beyond the barrier: clear of the rail, the wall, or the catch fence behind a tyre wall
      if (THEME === 'mountain') return 3.0;
      if (THEME === 'monaco') return 1.0;
      if (CSX) return FO_TYRES && FO_TYRES[side > 0 ? 1 : 0][i] ? (THEME === 'italia' ? 3.6 : THEME === 'kamp' ? 3.0 : 2.6) : 1.4;
      let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; if (d > -200 && d < 215) return 1.2;   // concrete wall
      const grav = side > 0 ? T.gravR : T.gravL; for (let k = -4; k <= 4; k++) if (grav[(i + k + N) % N]) return 2.4;   // tyre wall, fence at bar + 1.65
      return 1.2;   // armco
    };
    const crRun = (d0, d1, side, o) => crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({ first: crFirst }, o));   // (distances from the start line)
    if (!CSX) { const [, , , gi] = atS(sStart, 0), span = Math.max(T.bl[gi], T.br[gi]) + 1.2; for (const sd of [-1, 1]) CR.avoid(T.px[gi] + T.nx[gi] * span * sd, T.pz[gi] + T.nz[gi] * span * sd, 1.1); }   // start gantry posts
    if (out.bridgeIdx != null) { const i = out.bridgeIdx; CR.avoid(T.px[i] - T.nx[i] * (T.bl[i] + 1.8), T.pz[i] - T.nz[i] * (T.bl[i] + 1.8), 1.9); CR.avoid(T.px[i] + T.nx[i] * (T.br[i] + 1.8), T.pz[i] + T.nz[i] * (T.br[i] + 1.8), 1.9); }   // sponsor bridge pillars

    /* ================= CROWDS at corners ================= */
    if (THEME !== 'mountain' && THEME !== 'monaco' && !CSX) {
      const shirt = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.9, 0.35, 0.65], [0.5, 0.3, 0.85], [0.12, 0.12, 0.14]];
      const spots = T.corners.filter(c => c.sev >= 2);
      for (const c of spots) {
        const side = -c.dir; // outside
        const bar = side > 0 ? T.br : T.bl;
        const len = Math.min(70, Math.max(30, c.angle / Math.max(1e-3, c.maxk) * 0.8));
        for (let s = c.s0 - 10; s < c.s0 + len; s += 0.9) {
          const i = T.idx(s);
          for (let row = 0; row < 4; row++) {
            if (R() < 0.3 + row * 0.12) continue;
            const lat = side * (bar[i] + (T.gravL[i] || T.gravR[i] ? 3.4 : 2.4) + row * 0.95 + (R() - 0.5) * 0.4);
            const sj = s + (R() - 0.5) * 0.6, [x, z] = atS(sj, lat);
            if (clearance(x, z) < 1.5 || excluded(x, z) || lakeSD(x, z) < 3 || (RIVER && distRiver(x, z) < RW / 2 + 2)) continue;
            const sc = shirt[Math.floor(R() * shirt.length)]; R();   // (the old figure's skin draw: keeps the random sequence of the later scenery)
            const ii = T.idx(sj), lk = 0.3 * (0.2 + crH(x, z, 12));   // (the exclusion circles below keep these spots 1.2 m apart)
            if (CR.gH(x, z) > -0.3) crowdPut(CR, x, CR.gH(x, z), z, -side * T.nx[ii] - T.tx[ii] * lk, -side * T.nz[ii] - T.tz[ii] * lk, { col: sc }, row);   // (not down the river bank)
            excl.push({ x, z, r: 1.2 });
          }
          if (R() < 0.05) { // flag
            const [x, z] = atS(s, side * (bar[i] + 7.2));
            if (clearance(x, z) > 1 && !excluded(x, z)) {
              const g = scen.get(x, z);
              box(g, x, 0, z, 0.08, 4.2, 0.08, 0, [0.8, 0.8, 0.8]);
              const fc = shirt[Math.floor(R() * 6)];
              box(g, x + 0.7, 3.2, z, 1.4, 0.9, 0.04, T.hd[i], fc);
            }
          }
        }
        // marshal post
        const [mx, mz] = atS(c.s0 + 6, side * (bar[T.idx(c.s0 + 6)] + 1.6));
        if (clearance(mx, mz) > 0.5) { const g = scen.get(mx, mz); box(g, mx, 0, mz, 1.6, 2.2, 1.6, T.hd[T.idx(c.s0)], [0.95, 0.5, 0.1], [0.9, 0.9, 0.9]); CR.avoid(mx, mz, 1.4); }
      }
    }

    /* ================= VILLAGE HOUSES & KOZOLEC ================= */
    const houses = [];
    if (THEME === 'lake') {
      const cands = [];
      for (let k = 0; k < 900; k++) {
        const x = lerp(B.minX + 30, B.maxX - 30, R()), z = lerp(B.minZ + 30, B.maxZ - 30, R());
        const c = clearance(x, z);
        if (c < 26 || c > 95) continue;
        if (lakeSD(x, z) < 14 || excluded(x, z)) continue;
        const v = forestN(x + 300, z - 200);
        if (v < 0.5) continue;
        cands.push([x, z]);
      }
      const roofs = [[0.62, 0.2, 0.14], [0.36, 0.22, 0.16], [0.3, 0.3, 0.34], [0.7, 0.3, 0.16]];
      for (const [x, z] of cands) {
        if (houses.length >= 16) break;
        if (houses.some(h => Math.hypot(h[0] - x, h[1] - z) < 20)) continue;
        const n = nearest(x, z); const rot = (n.i >= 0 ? T.hd[n.i] : 0) + (R() < 0.5 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.3;
        const g = scen.get(x, z);
        const L = 9 + R() * 4, D = 7 + R() * 2.5;
        const y0 = groundH(x, z) - 0.3;
        box(g, x, y0, z, L, 3.4, D, rot, [0.95, 0.94, 0.9]);
        box(g, x, y0 + 3.4, z, L, 2.4, D, rot, [0.5, 0.33, 0.2]);
        gable(g, x, y0 + 5.8, z, L + 1.6, D + 1.8, 3.2 + R() * 0.8, rot, roofs[Math.floor(R() * roofs.length)], [0.5, 0.33, 0.2]);
        // balcony with flowers
        const c = Math.cos(rot), s = Math.sin(rot);
        const bx = x - s * (D / 2 + 0.6), bz = z + c * (D / 2 + 0.6);
        box(g, bx, y0 + 3.3, bz, L * 0.8, 0.9, 1.1, rot, [0.45, 0.3, 0.18]);
        for (let f = 0; f < 6; f++) { const o = (f / 5 - 0.5) * L * 0.7; box(g, bx + c * o, y0 + 4.2, bz + s * o, 0.5, 0.3, 0.4, rot, [0.9, 0.12, 0.15], [0.95, 0.2, 0.25]); }
        box(g, x + c * L * 0.25, y0 + 7.5, z + s * L * 0.25, 0.7, 2.2, 0.7, rot, [0.6, 0.58, 0.55]);
        houses.push([x, z]);
        excl.push({ x, z, r: Math.max(L, D) * 0.8 + 3 });
      }
      // kozolec (Slovenian hayrack) + hay bales in the right infield field
      let kx = 150, kz = 112;
      for (let t = 0; t < 40 && (clearance(kx, kz) < 28 || lakeSD(kx, kz) < 10); t++) { kx = 110 + R() * 110; kz = 60 + R() * 110; }
      for (let n = 0; n < 2; n++) {
        const x = kx + n * 16, z = kz + n * 9, rot = 0.2;
        if (clearance(x, z) < 22) continue;
        const g = scen.get(x, z);
        const c = Math.cos(rot), s = Math.sin(rot);
        const L = 14;
        for (let p = 0; p < 5; p++) { const o = (p / 4 - 0.5) * L; box(g, x + c * o, 0, z + s * o, 0.4, 6.2, 0.4, rot, [0.42, 0.29, 0.18]); }
        for (let r = 0; r < 7; r++) box(g, x, 0.9 + r * 0.72, z, L, 0.12, 0.16, rot, [0.52, 0.38, 0.22]);
        for (let r = 0; r < 4; r++) box(g, x - s * 0.02, 1.0 + r * 0.72, z + c * 0.02, L * 0.9, 0.45, 0.3, rot, [0.78, 0.7, 0.35]);
        gable(g, x, 6.2, z, L + 1.8, 3.2, 1.6, rot, [0.36, 0.26, 0.18]);
        excl.push({ x, z, r: 10 });
        for (let b = 0; b < 5; b++) {
          const bx = x + (R() - 0.5) * 26, bz = z + 10 + R() * 10;
          if (clearance(bx, bz) < 6) continue;
          cyl(g, bx, 0, bz, 0.8, 1.2, 8, [0.95, 0.95, 0.93], [0.9, 0.9, 0.88]);
          excl.push({ x: bx, z: bz, r: 2 });
        }
      }
      excl.push({ x: kx + 10, z: kz + 10, r: 34 });
    }
    if (THEME === 'lake') {   // spectators: the insides of both hairpins and of the long right-hander, the straights, around the stands and the pits
      crRun(968, 1098, -1, { rows: 5, dens: 0.8, sit: 0.3, label: 'hairpin 968 in' }); crRun(1262, 1352, 1, { rows: 5, dens: 0.8, sit: 0.3, label: 'hairpin 1262 in' });
      crRun(810, 952, 1, { rows: 4, dens: 0.72, sit: 0.2, label: '810 in' });
      for (const sd of [-1, 1]) { crRun(580, 760, sd, { rows: 3, dens: 0.5, label: 'straight 580' }); crRun(1100, 1260, sd, { rows: 3, dens: 0.5, label: 'straight 1100' }); }
      crRun(1520, 1640, 1, { rows: 3, dens: 0.62, label: '1520 R' });
      crRun(95, 235, -1, { rows: 4, dens: 0.62, label: 'after stands L' }); crRun(-270, -155, -1, { rows: 3, dens: 0.55, label: 'before stands L' }); crRun(70, 235, 1, { rows: 3, dens: 0.5, label: 'past pits R' });
      crRun(236, 320, 1, { rows: 3, dens: 0.6, label: '240 in' }); crRun(360, 470, -1, { rows: 3, dens: 0.55, label: '366 in' });
    }

    /* ================= TREES ================= */
    if (THEME === 'lake') {
      const step = 6.2 / Math.sqrt(dens), rs = ROCK_SMOOTH; ROCK_SMOOTH = true;   // (the crowns and tiers softly shaded, as in the forest)
      const pineC = [0.17, 0.34, 0.18], decC = [0.3, 0.52, 0.2], birchC = [0.46, 0.64, 0.28];
      const autumn = [[0.86, 0.52, 0.12], [0.93, 0.72, 0.16], [0.72, 0.3, 0.12]];
      for (let z = B.minZ; z < B.maxZ; z += step) {
        for (let x = B.minX; x < B.maxX; x += step) {
          const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9;
          const c = clearance(px, pz);
          if (c < 2.5 || c > LOD.radius(150)) continue;   // (LOD: a shorter tree draw distance on the lower tiers)
          if (lakeSD(px, pz) < 4) continue;
          if (excluded(px, pz)) continue;
          const f = forestN(px, pz);
          let p = sstep(0.36, 0.62, f);
          if (c < 10) p *= 0.35;
          if (c > 110) p = Math.max(p, 0.5);
          if (R() > p * LOD.dens) continue;   // (LOD: thin the trees on the lower tiers)
          const g = treeCh.get(px, pz), n0 = g.P.length / 3;
          const y0 = groundH(px, pz) - 0.2;
          const tn = typeN(px, pz);
          const hgt = 8 + R() * 7;
          if (tn < 0.55) { // pine
            box(g, px, y0, pz, 0.4, hgt * 0.3, 0.4, R(), [0.36, 0.25, 0.16]);
            const col = vary(pineC, R, 0.22);
            const rr = hgt * (0.26 + R() * 0.06);
            const rot = R() * TAU;
            const lt = (k) => [col[0] * k, col[1] * k, col[2] * k];   // (jagged, drooping tiers as the forest's firs, the top one to the tip; sunlit tips)
            starCone(g, px, y0 + hgt * 0.16, pz, rr, hgt * 0.4, 5, col, lt(1.28), rot, hgt * 0.05);
            starCone(g, px, y0 + hgt * 0.38, pz, rr * 0.76, hgt * 0.34, 4, vary(col, R, 0.08), lt(1.34), rot + 0.4, hgt * 0.04);
            starCone(g, px, y0 + hgt * 0.58, pz, rr * 0.5, hgt * 0.42, 4, vary(col, R, 0.08), lt(1.44), rot + 1.2, hgt * 0.03);
          } else if (tn < 0.8 || R() < 0.5) { // deciduous
            const au = R() < 0.07;
            const col = au ? autumn[Math.floor(R() * 3)] : vary(decC, R, 0.25);
            box(g, px, y0, pz, 0.45, hgt * 0.45, 0.45, R(), [0.38, 0.27, 0.17]);
            const r0 = hgt * (0.22 + R() * 0.06);
            ico(g, px, y0 + hgt * 0.62, pz, r0, 0.85, col, R, 0.3);
            ico(g, px + (R() - 0.5) * r0, y0 + hgt * 0.78, pz + (R() - 0.5) * r0, r0 * 0.72, 0.9, vary(col, R, 0.1), R, 0.3);
            { const a = crH(px, pz, 21) * TAU, k = 0.55 + 0.2 * crH(px, pz, 22), c3 = [col[0] * 1.08, col[1] * 1.08, col[2] * 1.02];   // a third, sunlit lobe to the side (a hash, no RNG draw)
              let q = 0; ico(g, px + Math.cos(a) * r0 * 0.75, y0 + hgt * 0.7, pz + Math.sin(a) * r0 * 0.75, r0 * k, 0.85, c3, () => crH(px, pz, 30 + q++), 0.3); }
          } else { // birch
            box(g, px, y0, pz, 0.28, hgt * 0.6, 0.28, R(), [0.9, 0.9, 0.86]);
            ico(g, px, y0 + hgt * 0.7, pz, hgt * 0.16, 1.2, vary(birchC, R, 0.2), R, 0.3);
          }
          treeMark(g, n0, y0, hgt);
        }
      }
      ROCK_SMOOTH = rs;
    }

    /* ================= COASTAL CITY (Riviera) ================= */
    if (THEME === 'city') {
      const seaZ = SEA ? SEA.z : 1e9;
      // sea + beach
      {
        const x0 = B.minX - 260, x1 = B.maxX + 260, z0 = seaZ + 12, z1 = B.maxZ + 340;
        const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, -0.3, (z0 + z1) / 2);
        const uv = g.attributes.uv, gp = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, gp.getX(i) / 22, -gp.getZ(i) / 22);   // (uv in metres, as the shore band's)
        const WO = { len: 2.4, amp: 1.3, refl: 0.32, shal: 0.7, lap: 1, surf: 1 }, sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x7fc2e8 }, WO)));
        sea.receiveShadow = true; root.add(sea); out.dyn.water = tex.water;
        const wl = gmLine(-0.3), bz = seaZ + 14;   // (the waterline: the beach's edge, and wherever else the ground meets the sea)
        addShore(root, shoreBand(x0, seaZ + 4, x1, Math.min(z1, seaZ + 60), -0.285, (x, z) => Math.min(wl(x, z), z - bz), 22), sea.material, WO);
        const bg = new THREE.PlaneGeometry(x1 - x0, 18); bg.rotateX(-Math.PI / 2); bg.translate((x0 + x1) / 2, 0.04, seaZ + 5);
        const buv = bg.attributes.uv; for (let i = 0; i < buv.count; i++) buv.setXY(i, buv.getX(i) * (x1 - x0) / 9, buv.getY(i) * 2);
        const beach = new THREE.Mesh(bg, new THREE.MeshLambertMaterial({ map: tex.sand })); beach.receiveShadow = true; root.add(beach);
      }
      const palm = (x, z, h) => {
        const g = scen.get(x, z), lean = (R() - 0.5) * 0.9, la = R() * TAU;
        const tx = x + Math.cos(la) * lean, tz = z + Math.sin(la) * lean;
        cyl(g, x, 0, z, 0.32, h * 0.55, 6, [0.5, 0.38, 0.24], null, 0.27);
        cyl(g, (x + tx) / 2, h * 0.55, (z + tz) / 2, 0.27, h * 0.45, 6, [0.56, 0.43, 0.28], null, 0.22);
        const top = [tx, h, tz], below = [tx, h - 4, tz];
        const n = 8 + Math.floor(R() * 3), a0 = R() * TAU;
        for (let k = 0; k < n; k++) {
          const a = a0 + k / n * TAU, L = 3.2 + R() * 1.2, droop = 1.1 + R() * 0.9, w = 0.5;
          const mid = [tx + Math.cos(a) * L * 0.55, h + 0.35, tz + Math.sin(a) * L * 0.55];
          const tip = [tx + Math.cos(a) * L, h - droop, tz + Math.sin(a) * L];
          const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w];
          const col = k % 2 ? [0.26, 0.52, 0.2] : [0.34, 0.62, 0.24];
          g.triO(top, pl, mid, col, below); g.triO(top, mid, pr, col, below);
          g.triO(pl, tip, mid, col, below); g.triO(mid, tip, pr, col, below);
        }
      };
      // promenade along the sea: low sea wall, palms and street lamps
      for (let x = B.minX - 60; x < B.maxX + 60; x += 13) {
        const z = seaZ - 4;
        if (clearance(x, z) < 3 || excluded(x, z)) continue;
        palm(x + (R() - 0.5) * 2, z + (R() - 0.5) * 1.5, 7 + R() * 3);
        const g = scen.get(x + 6.5, z);
        cyl(g, x + 6.5, 0, z + 1.5, 0.09, 4.6, 5, [0.2, 0.22, 0.24]);
        box(g, x + 6.5, 4.6, z + 1.2, 0.25, 0.2, 0.9, 0, [0.95, 0.92, 0.75]);
        excl.push({ x, z, r: 3 });
      }
      box(scen.get(0, seaZ - 1), (B.minX + B.maxX) / 2, 0, seaZ - 1.2, B.maxX - B.minX + 520, 0.7, 0.6, 0, [0.9, 0.87, 0.8]);
      // Mediterranean buildings with window facades
      const fac = new GB(true);
      const pal = [[0.97, 0.9, 0.75], [0.95, 0.8, 0.55], [0.9, 0.62, 0.45], [0.98, 0.97, 0.94], [0.96, 0.87, 0.64], [0.84, 0.9, 0.96], [0.95, 0.74, 0.68], [0.93, 0.93, 0.8]];
      const placed = [];
      for (let k = 0; k < 7000 && placed.length < 260; k++) {
        const x = lerp(B.minX - 40, B.maxX + 40, R()), z = lerp(B.minZ - 40, seaZ - 30, R());
        const W = 11 + R() * 13, D = 10 + R() * 10, rad = Math.hypot(W, D) / 2;
        const c = clearance(x, z);
        if (c < rad * 0.55 + 2.5 || c > LOD.cap(230) || excluded(x, z)) continue;   // (LOD: cut the far seafront buildings on the lower tiers)
        if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.86)) continue;
        const ni = nearest(x, z).i, rot = ni >= 0 ? T.hd[ni] + (R() < 0.5 ? 0 : Math.PI / 2) : R() * TAU;
        const floors = 2 + Math.floor(R() * (c > 40 ? 6 : 4)), H = floors * 3.1 + 0.9;
        const col = pal[Math.floor(R() * pal.length)];
        const cr = Math.cos(rot), sr = Math.sin(rot);
        const P = (u, v, y) => [x + u * cr - v * sr, y, z + u * sr + v * cr];
        const cs = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
        const inside = [x, H / 2, z];
        for (let e = 0; e < 4; e++) {
          const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4];
          const len = Math.hypot(u1 - u0, v1 - v0), bays = Math.max(2, Math.round(len / 3.4));
          fac.quadO(P(u0, v0, 0), P(u1, v1, 0), P(u1, v1, H), P(u0, v0, H), col, inside, [[0, 0], [bays, 0], [bays, floors], [0, floors]]);
        }
        const g = scen.get(x, z);
        if (R() < 0.35) gable(g, x, H, z, W + 0.8, D + 0.8, 2.2 + R() * 1.2, rot, [0.78, 0.36, 0.22], col);
        else {
          box(g, x, H, z, W, 0.5, D, rot, col.map(v => v * 0.86), col.map(v => v * 0.9));
          box(g, x + (R() - 0.5) * W * 0.5, H + 0.5, z + (R() - 0.5) * D * 0.5, 2.4, 1.6, 2.4, rot, [0.86, 0.84, 0.8]);
          if (R() < 0.5) box(g, x + (R() - 0.5) * W * 0.6, H + 0.5, z + (R() - 0.5) * D * 0.6, 1.2, 0.9, 1.8, rot, [0.7, 0.72, 0.74]);
          roofKit(g, x, H + 0.5, z, W, D, rot, col);
        }
        placed.push([x, z, rad]); CR.block(x, z, W, D, rot);
        excl.push({ x, z, r: rad + 2 });
      }
      { const fm = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); fm.castShadow = true; fm.receiveShadow = true; root.add(fm); }
      // palms in the town (squares, verges)
      for (let k = 0; k < 900; k++) {
        const x = lerp(B.minX - 30, B.maxX + 30, R()), z = lerp(B.minZ - 30, seaZ - 12, R());
        const c = clearance(x, z);
        if (c < 3 || c > 45 || excluded(x, z)) continue;
        if (R() < 0.25) continue;
        palm(x, z, 6 + R() * 4); excl.push({ x, z, r: 4 });
      }
      // yachts in the bay
      for (let k = 0; k < 22; k++) {
        const x = lerp(B.minX - 120, B.maxX + 120, R()), z = seaZ + 30 + R() * 130, rot = (R() - 0.5) * 0.6;
        const g = scen.get(x, z), L = 7 + R() * 7;
        box(g, x, -0.25, z, L, 1.1, L * 0.33, rot, [0.96, 0.96, 0.97], [0.88, 0.8, 0.66]);
        box(g, x - Math.cos(rot) * L * 0.1, 0.85, z - Math.sin(rot) * L * 0.1, L * 0.4, 0.9, L * 0.22, rot, [0.98, 0.98, 0.98], [0.9, 0.9, 0.92]);
        if (R() < 0.6) cyl(g, x, 0.85, z, 0.07, L * 0.95, 4, [0.85, 0.85, 0.88]);
      }
      // spectators: the seafront promenade along the start straight (between the barrier and the sea wall), the insides of the hairpins and corners
      crRun(-156, 172, 1, { first: 1.5, rows: 5, gap: 1.05, dens: 0.8, clump: 0.4, label: 'promenade' }); crRun(96, 180, -1, { rows: 3, dens: 0.6, label: 'start L' });
      crRun(1010, 1092, -1, { rows: 4, dens: 0.8, label: 'hairpin 1014 in' }); crRun(682, 730, -1, { rows: 4, dens: 0.8, label: 'hairpin 688 in' });
      crRun(410, 528, -1, { rows: 4, dens: 0.7, label: '414 in' }); crRun(870, 984, -1, { rows: 4, dens: 0.7, label: '874 in' });
      crRun(200, 272, -1, { rows: 3, dens: 0.6, label: '224 in' }); crRun(560, 664, 1, { rows: 3, dens: 0.55, label: '574 in' }); crRun(730, 790, 1, { rows: 3, dens: 0.6, label: '742 in' });
      crRun(1092, 1150, -1, { rows: 3, dens: 0.55, label: '1092 L' }); crRun(300, 400, -1, { rows: 2, dens: 0.45, label: '300 L' });
    }

    /* ================= MOUNTAIN RALLY (Gorski reli) ================= */
    if (THEME === 'mountain') {
      const pineC = [0.14, 0.3, 0.16], firC = [0.17, 0.36, 0.2], larchC = [0.4, 0.55, 0.24];
      const rockC = [0.5, 0.49, 0.47], rockD = [0.4, 0.39, 0.38];
      // ===== landmarks first, so the forest and rocks keep clear of them =====
      const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5]];
      const person = (s, side, extra, x, z, row) => { const sc = fans[Math.floor(R() * fans.length)]; R(); crowdAt(CR, s, side, extra, x, z, { col: sc, flag: 0.08 }, row, (a, b) => !excluded(a, b)); };   // (two draws, as the old merged figure)
      const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
      // hilltop church (cerkvica) on the highest open spot away from the road
      {
        let best = null;
        for (let k = 0; k < 900; k++) {
          const x = lerp(B.minX + 60, B.maxX - 60, R()), z = lerp(B.minZ + 60, B.maxZ - 60, R());
          const c = clearance(x, z); if (c < 40 || c > 150) continue;
          const y = groundH(x, z); if (!best || y > best[2]) best = [x, z, y];
        }
        if (best) {
          const [x, z, y] = best, g = scen.get(x, z), rot = R() * TAU, white = [0.96, 0.95, 0.9], roof = [0.72, 0.24, 0.16];
          const c = Math.cos(rot), sn = Math.sin(rot), tx = x - c * 6.8, tz = z - sn * 6.8;
          box(g, x, y - 1, z, 11, 6.5, 6.5, rot, white);                              // nave (base sunk into the slope)
          gable(g, x, y + 5.5, z, 11.6, 7.2, 3.4, rot, roof, white);
          box(g, x + c * 5.9, y - 1, z + sn * 5.9, 2.4, 4.2, 3.8, rot, white);        // apse
          box(g, tx, y - 1, tz, 3.6, 15, 3.6, rot, white);                              // bell tower
          cone(g, tx, y + 14, tz, 2.9, 6, 4, roof, [0.5, 0.16, 0.1], rot + Math.PI / 4);
          excl.push({ x, z, r: 16 });
        }
      }
      // alpine chalets: white stone ground floor, wooden upper floor with balcony, dark roof, chimney
      for (let k = 0, n = 0; k < 1600 && n < 9; k++) {
        const x = lerp(B.minX + 40, B.maxX - 40, R()), z = lerp(B.minZ + 40, B.maxZ - 40, R());
        const c = clearance(x, z); if (c < 16 || c > 70 || excluded(x, z)) continue;
        const y = groundH(x, z);
        const ni = nearest(x, z).i, rot = (ni >= 0 ? T.hd[ni] : 0) + (R() < 0.5 ? 0 : Math.PI / 2);
        const g = scen.get(x, z), L = 9 + R() * 3, D = 7 + R() * 2, cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, y - 1.2, z, L, 3.8, D, rot, [0.93, 0.91, 0.85]);
        box(g, x, y + 2.6, z, L, 2.6, D, rot, [0.52, 0.34, 0.2]);
        gable(g, x, y + 5.2, z, L + 1.6, D + 1.8, 2.6 + R() * 0.8, rot, [0.3, 0.2, 0.16], [0.52, 0.34, 0.2]);
        box(g, x - sr * (D / 2 + 0.6), y + 2.7, z + cr * (D / 2 + 0.6), L * 0.8, 0.9, 1.1, rot, [0.45, 0.3, 0.18]);   // balcony
        box(g, x + cr * L * 0.25, y + 5.6, z + sr * L * 0.25, 0.7, 2.2, 0.7, rot, [0.6, 0.58, 0.55]);                // chimney
        excl.push({ x, z, r: Math.max(L, D) * 0.8 + 4 }); n++;
      }
      // kozolec (Slovenian hayrack) with drying hay
      for (let k = 0, n = 0; k < 900 && n < 2; k++) {
        const x = lerp(B.minX + 40, B.maxX - 40, R()), z = lerp(B.minZ + 40, B.maxZ - 40, R());
        const c = clearance(x, z); if (c < 14 || c > 50 || excluded(x, z)) continue;
        const y = groundH(x, z), rot = R() * TAU, cr = Math.cos(rot), sr = Math.sin(rot), g = scen.get(x, z), wood = [0.5, 0.35, 0.2];
        for (let q = 0; q < 5; q++) { const o = (q - 2) * 3; box(g, x + cr * o, y - 0.5, z + sr * o, 0.35, 5.5, 0.35, rot, wood); }
        for (let r2 = 0; r2 < 4; r2++) box(g, x, y + 0.9 + r2 * 1.05, z, 12.6, 0.14, 0.16, rot, [0.58, 0.42, 0.24]);
        box(g, x, y + 1.3, z, 11.6, 2.6, 0.1, rot, [0.84, 0.74, 0.4]);    // hay hung on the rack
        gable(g, x, y + 5, z, 13.8, 2.6, 1.4, rot, [0.38, 0.26, 0.16], wood);
        excl.push({ x, z, r: 9 }); n++;
      }
      // every jump: spectators on both banks + a yellow warning board 40 m before it
      for (const b of (T.def.bumps || [])) {
        const s0 = (((b.at % 1) + 1) % 1) * T.len;
        for (const side of [-1, 1]) {
          for (let s = s0 - 16; s < s0 + 16; s += 1.0) {
            for (let row = 0; row < 3; row++) {
              if (R() < 0.35 + row * 0.15) continue;
              const ex = 2.6 + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex);
              if (excluded(x, z)) continue;
              person(s, side, ex, x, z, row);
            }
          }
          for (const d of [-10, 0, 10]) { const [x, z] = onSide(s0 + d, side, 4); excl.push({ x, z, r: 7 }); }
        }
        const [x, z, i] = onSide(s0 - 40, 1, 0.6), y = groundH(x, z), g = scen.get(x, z);
        box(g, x, y, z, 0.12, 1.6, 0.12, T.hd[i], [0.4, 0.4, 0.42]);
        box(g, x, y + 1.3, z, 0.1, 1.1, 1.6, T.hd[i], [0.98, 0.8, 0.1]);
        box(g, x - T.tx[i] * 0.07, y + 1.55, z - T.tz[i] * 0.07, 0.04, 0.6, 0.2, T.hd[i], [0.1, 0.1, 0.1]);   // "!"
        box(g, x - T.tx[i] * 0.07, y + 1.38, z - T.tz[i] * 0.07, 0.04, 0.12, 0.2, T.hd[i], [0.1, 0.1, 0.1]);
      }
      // start/finish: crowd behind both edges + flag poles
      for (let s = sStart - 50; s < sStart + 30; s += 1.1) {
        for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
          if (R() < 0.4 + row * 0.12) continue;
          const ex = 3.2 + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex);
          if (excluded(x, z)) continue;
          person(s, side, ex, x, z, row);
        }
      }
      for (let s = sStart - 70; s < sStart + 70; s += 9) {
        for (const side of [-1, 1]) {
          const [x, z, i] = onSide(s, side, 1.8); if (excluded(x, z)) continue;
          const y = groundH(x, z), g = scen.get(x, z);
          cyl(g, x, y, z, 0.06, 5.2, 5, [0.85, 0.85, 0.88]);
          box(g, x + T.tx[i] * 0.55, y + 4.1, z + T.tz[i] * 0.55, 1.1, 0.8, 0.04, T.hd[i], fans[Math.floor(R() * fans.length)]);
        }
      }
      for (const side of [-1, 1]) for (let s = sStart - 50; s < sStart + 30; s += 12) { const [x, z] = onSide(s, side, 4.5); excl.push({ x, z, r: 6 }); }
      // spectators on the banks above the road: under both banner arches and over the crest, round the bends before the first arch, the insides of 788 and 1389
      { const M = { gap: 1.1, maxSlope: 0.5, below: 1.0, sit: 0.25, flag: 0.08 }, L = T.len;
        for (const sd of [-1, 1]) { crRun(L * 0.3 - 34, L * 0.3 + 30, sd, Object.assign({ rows: 3, dens: 0.66, label: 'arch 1' }, M)); crRun(L * 0.62 - 60, L * 0.62 + 44, sd, Object.assign({ rows: 3, dens: 0.6, label: 'arch 2 crest' }, M)); }
        crRun(496, 542, 1, Object.assign({ rows: 3, dens: 0.6, label: '500 out' }, M)); crRun(574, 640, 1, Object.assign({ rows: 3, dens: 0.62, label: '578 out' }, M));
        crRun(780, 834, 1, Object.assign({ rows: 2, dens: 0.55, label: '788 in' }, M)); crRun(1382, 1436, -1, Object.assign({ rows: 2, dens: 0.55, label: '1389 in' }, M)); }
      // --- dense alpine forest on the slopes ---
      const step = 5.0 / Math.sqrt(dens), rs = ROCK_SMOOTH; ROCK_SMOOTH = true;
      for (let z = B.minZ; z < B.maxZ; z += step) {
        for (let x = B.minX; x < B.maxX; x += step) {
          const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9;
          const c = clearance(px, pz);
          if (c < 3 || c > LOD.cap(190) || excluded(px, pz)) continue;   // (LOD: cut the far forest on the lower tiers; VISOKA keeps it all)
          const f = forestN(px, pz);
          let p = sstep(0.2, 0.52, f);
          if (c < 10) p *= 0.7;                 // slightly thinner right by the road
          if (c > 120) p = Math.max(p, 0.7);    // thick forest up the slopes
          const y0 = groundH(px, pz);
          if (y0 > 96) p *= sstep(120, 96, y0); // treeline: fewer trees near the peaks
          if (R() > p * LOD.dens) continue;   // (LOD: thin the forest on the lower tiers)
          const g = treeCh.get(px, pz), n0 = g.P.length / 3;
          const tn = typeN(px, pz);
          const hgt = 9 + R() * 9;
          if (tn < 0.72) { // spruce/fir (tall narrow conifer)
            box(g, px, y0 - 0.2, pz, 0.4, hgt * 0.28, 0.4, R(), [0.34, 0.24, 0.15], null, true);
            const col = vary(tn < 0.4 ? pineC : firC, R, 0.2);
            const rr = hgt * (0.2 + R() * 0.05), rot = R() * TAU;
            const lt = (k) => [col[0] * k, col[1] * k, col[2] * k];   // (jagged, drooping tiers, the top one to the tip; sunlit tips)
            starCone(g, px, y0 + hgt * 0.12, pz, rr, hgt * 0.36, 5, col, lt(1.28), rot, hgt * 0.05);
            starCone(g, px, y0 + hgt * 0.33, pz, rr * 0.78, hgt * 0.33, 4, vary(col, R, 0.08), lt(1.34), rot + 0.5, hgt * 0.04);
            starCone(g, px, y0 + hgt * 0.53, pz, rr * 0.54, hgt * 0.47, 4, vary(col, R, 0.08), lt(1.44), rot + 1.4, hgt * 0.035);
          } else { // larch (rounder, lighter)
            box(g, px, y0 - 0.2, pz, 0.4, hgt * 0.4, 0.4, R(), [0.4, 0.3, 0.18], null, true);
            const col = vary(larchC, R, 0.22), r0 = hgt * (0.22 + R() * 0.06);
            ico(g, px, y0 + hgt * 0.6, pz, r0, 0.95, col, R, 0.32);
            ico(g, px + (R() - 0.5) * r0, y0 + hgt * 0.8, pz + (R() - 0.5) * r0, r0 * 0.7, 1.0, vary(col, R, 0.1), R, 0.3);
          }
          treeMark(g, n0, y0, hgt);
          if (R() < 0.4) excl.push({ x: px, z: pz, r: 2 });
        }
      }
      ROCK_SMOOTH = rs;
      // --- roadside understory: bushes, ferns, small rocks right behind the fence (always in camera view) ---
      {
        const bushC = [[0.2, 0.36, 0.14], [0.26, 0.42, 0.16], [0.3, 0.4, 0.12]], fernC = [0.34, 0.52, 0.18], rockC = [0.52, 0.5, 0.47];
        for (const side of [-1, 1]) {
          for (let s0 = 0; s0 < T.len; s0 += 2.6) {
            if (R() > 0.55) continue;
            const i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i];
            const o = side * (bar + 1.2 + R() * 8.5);
            const px = T.px[i] + T.nx[i] * o + (R() - 0.5) * 1.5, pz = T.pz[i] + T.nz[i] * o + (R() - 0.5) * 1.5;
            if (clearance(px, pz) < 0.8 || excluded(px, pz)) continue;
            const y0 = groundH(px, pz), g = scen.get(px, pz), t = R();
            if (t < 0.55) { const r0 = 0.7 + R() * 0.9; ico(g, px, y0 + r0 * 0.55, pz, r0, 0.8, vary(bushC[Math.floor(R() * 3)], R, 0.15), R, 0.3); if (R() < 0.5) ico(g, px + (R() - 0.5) * r0 * 1.6, y0 + r0 * 0.4, pz + (R() - 0.5) * r0 * 1.6, r0 * 0.65, 0.8, vary(bushC[0], R, 0.15), R, 0.3); }
            else if (t < 0.82) { for (let f = 0; f < 4; f++) cone(g, px + (R() - 0.5) * 1.1, y0, pz + (R() - 0.5) * 1.1, 0.35 + R() * 0.25, 0.7 + R() * 0.5, 5, vary(fernC, R, 0.15), [0.42, 0.6, 0.22], R() * TAU); }
            else { const r0 = 0.35 + R() * 0.55; ico(g, px, y0 + r0 * 0.3, pz, r0, 0.7, vary(rockC, R, 0.12), R, 0.35); }
          }
        }
      }
      // --- grass tufts and loose stones right along the gravel road edges ---
      {
        const tuftC = [[0.36, 0.55, 0.2], [0.46, 0.6, 0.22], [0.58, 0.62, 0.28]], stoneC = [0.62, 0.58, 0.52];
        for (const side of [-1, 1]) {
          for (let s0 = 0; s0 < T.len; s0 += 1.3) {
            if (R() > 0.6) continue;
            const i = T.idx(s0), e = edgeW(i, side), o = e + 0.05 + R() * 1.7, t = (o - e) / Math.max(0.5, w + 2.2 - e);
            const px = T.px[i] + T.nx[i] * side * o + (R() - 0.5) * 0.8, pz = T.pz[i] + T.nz[i] * side * o + (R() - 0.5) * 0.8;
            const y0 = HYi(i) + 0.02 - Math.min(1, t) * 1.02, g = scen.get(px, pz);
            if (R() < 0.8) { const col = tuftC[Math.floor(R() * 3)], nb = 3 + Math.floor(R() * 3); for (let q = 0; q < nb; q++) cone(g, px + (R() - 0.5) * 0.5, y0, pz + (R() - 0.5) * 0.5, 0.07 + R() * 0.07, 0.3 + R() * 0.45, 4, vary(col, R, 0.12), [col[0] * 1.25, col[1] * 1.2, col[2] * 1.1], R() * TAU); }
            else ico(g, px, y0 + 0.06, pz, 0.12 + R() * 0.2, 0.6, vary(stoneC, R, 0.12), R, 0.35);
          }
        }
      }
      // --- boulders & rock outcrops (scattered + clusters near the road) ---
      for (let k = 0; k < 520 / 1; k++) {
        const px = lerp(B.minX, B.maxX, R()), pz = lerp(B.minZ, B.maxZ, R());
        const c = clearance(px, pz);
        if (c < 3.5 || c > LOD.cap(190) || excluded(px, pz)) continue;   // (LOD: cut the far boulders on the lower tiers; VISOKA keeps them all)
        if (R() > 0.5) continue;
        const g = scen.get(px, pz), y0 = groundH(px, pz);
        const s = 0.8 + R() * (c < 20 ? 2.2 : 4.5);
        const col = vary(R() < 0.5 ? rockC : rockD, R, 0.12);
        ico(g, px, y0 + s * 0.2, pz, s, 0.7 + R() * 0.3, col, R, 0.5);
        if (R() < 0.4) ico(g, px + (R() - 0.5) * s * 2, y0 + s * 0.1, pz + (R() - 0.5) * s * 2, s * 0.6, 0.7, vary(col, R, 0.1), R, 0.5);
      }
      // --- rally edge marker poles (red/white) along both sides ---
      const HYs = (i) => (T.hy ? T.hy[i] : 0);
      for (let s = 0; s < T.len; s += 13) {
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.4);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o;
          if (excluded(px, pz)) continue;
          const g = scen.get(px, pz), y = HYs(i);
          box(g, px, y, pz, 0.12, 1.05, 0.12, T.hd[i], [0.9, 0.9, 0.9]);
          box(g, px, y + 0.62, pz, 0.13, 0.22, 0.13, T.hd[i], [0.85, 0.15, 0.12]); // red band
        }
      }
      // --- wooden guardrail on the outside of the faster corners ---
      for (const cor of T.corners.filter(c => c.sev >= 2)) {
        const side = -cor.dir;
        const bar = side > 0 ? T.br : T.bl;
        const len = Math.min(90, Math.max(40, cor.angle / Math.max(1e-3, cor.maxk) * 0.9));
        let prev = null;
        for (let s = cor.s0 - 12; s < cor.s0 + len; s += 4.5) {
          const i = T.idx(s), o = side * (bar[i] + 0.7);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = HYs(i);
          if (excluded(px, pz)) { prev = null; continue; }
          const g = scen.get(px, pz);
          box(g, px, y, pz, 0.16, 1.0, 0.16, T.hd[i], [0.45, 0.32, 0.2]); // post
          if (prev) { // rail plank between posts
            const mx = (px + prev[0]) / 2, mz = (pz + prev[1]) / 2, dx = px - prev[0], dz = pz - prev[1];
            const L = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
            box(scen.get(mx, mz), mx, (y + prev[2]) / 2 + 0.72, mz, L, 0.18, 0.08, ang, [0.55, 0.4, 0.26]);
          }
          prev = [px, pz, y];
        }
      }
      // --- hay bales stacked at the inside of the two tightest corners ---
      const tight = T.corners.slice().sort((a, b) => b.maxk - a.maxk).slice(0, 2);
      for (const cor of tight) {
        const side = cor.dir; // inside
        const bar = side > 0 ? T.br : T.bl;
        for (let s = cor.s0; s < cor.s0 + 16; s += 2.2) {
          const i = T.idx(s), o = side * (bar[i] + 1.2);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = HYs(i);
          if (excluded(px, pz)) continue;
          const g = scen.get(px, pz), col = vary([0.86, 0.74, 0.36], R, 0.1);
          box(g, px, y, pz, 1.6, 0.9, 0.9, T.hd[i], col, [0.7, 0.6, 0.3]);
          if (R() < 0.5) box(g, px, y + 0.9, pz, 1.6, 0.85, 0.9, T.hd[i], vary(col, R, 0.08), [0.7, 0.6, 0.3]);
          excl.push({ x: px, z: pz, r: 1.6 });
        }
      }
      // --- spectator clusters at a few corners (on the terrain, above the road) ---
      const shirt = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5]];
      CR.busy = true;   // (these clusters ignore the new crowds' tree exclusions, so the random sequence of the later scenery stays as it was)
      for (const cor of T.corners.filter(c => c.sev >= 2).slice(0, 4)) {
        const side = -cor.dir, bar = side > 0 ? T.br : T.bl;
        for (let s = cor.s0 - 6; s < cor.s0 + 28; s += 1.1) {
          const i = T.idx(s);
          for (let row = 0; row < 3; row++) {
            if (R() < 0.45 + row * 0.12) continue;
            const ex = 3.2 + row * 1.2 + (R() - 0.5) * 0.5, o = side * (bar[i] + ex);
            const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o;
            if (clearance(px, pz) < 1.5 || excluded(px, pz)) continue;
            const sc = shirt[Math.floor(R() * shirt.length)]; R();   // (two draws, as the old merged figure)
            crowdAt(CR, s, side, ex, px, pz, { col: sc }, row, (a, b) => clearance(a, b) >= 1.5 && !excluded(a, b));
          }
        }
      }
      CR.busy = false;
      // --- banner arches over the road (start + one on the ridge) ---
      const arch = (s, col) => {
        const i = T.idx(s), span = Math.max(T.bl[i], T.br[i]) + 1.6, nx = T.nx[i], nz = T.nz[i], h = T.hd[i], y = HYs(i);
        const g = scen.get(T.px[i], T.pz[i]);
        for (const sd of [-1, 1]) { const bx = T.px[i] + nx * span * sd, bz = T.pz[i] + nz * span * sd; box(g, bx, y, bz, 0.7, 6.2, 0.7, h, [0.4, 0.28, 0.18], [0.3, 0.2, 0.12]); }
        box(g, T.px[i], y + 5.9, T.pz[i], 0.5, 0.6, span * 2 + 0.7, h, [0.35, 0.24, 0.15]);       // top beam
        box(g, T.px[i], y + 4.7, T.pz[i], 0.3, 1.2, span * 2 - 0.4, h, col, vary(col, R, 0.1));    // banner
      };
      arch(T.startS + T.len * 0.3, [0.8, 0.16, 0.14]);
      arch(T.startS + T.len * 0.62, [0.15, 0.4, 0.7]);
      // --- timing hut + tents near the start ---
      {
        const i = T.idx(sStart - 22), o = -( (T.bl[i]) + 5), px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = groundH(px, pz), h = T.hd[i];
        const g = scen.get(px, pz);
        box(g, px, y, pz, 5, 2.6, 3.2, h, [0.9, 0.88, 0.82], [0.6, 0.3, 0.2]);
        gable(g, px, y + 2.6, pz, 5.4, 3.6, 1.3, h, [0.55, 0.28, 0.18], [0.9, 0.88, 0.82]);
        for (let t = 0; t < 3; t++) {
          const oo = -((T.bl[i]) + 10 + t * 5), tx = T.px[i] + T.nx[i] * oo + (R() - 0.5) * 3, tz = T.pz[i] + T.nz[i] * oo + (R() - 0.5) * 3, ty = groundH(tx, tz);
          const tc = shirt[t % shirt.length], gg = scen.get(tx, tz);
          box(gg, tx, ty, tz, 3, 1.8, 2.4, h, [0.92, 0.92, 0.9]);
          gable(gg, tx, ty + 1.8, tz, 3.4, 2.8, 0.9, h, tc, tc);
        }
      }
    }

    /* ================= CS STYLE: the circuits from the stylised top-down racer =================
       Bakreni gozd ('forest': a V with a tongue, rocks, firs), Toskana ('italia': cypresses, farmhouses, a lake) and Gromski rt ('kamp': a pine wood,
       a campsite full of vans and tents). The stands, the pit lane with its crews, the dirt shoulders, cones, bales, tyre stacks and edge lines are
       shared; each circuit adds its own scenery. The newer circuits place theirs from their track file (stands, boards, houses, camp, crowd). */
    if (CSX) {
      const fd = T.def, FOR = THEME === 'forest', ITA = THEME === 'italia', KMP = THEME === 'kamp';
      // ---- the raised lawn in the bottom of the V (as in the reference): a flat grass terrace behind a curved concrete retaining wall
      //      with a rope fence along its edge; objects placed on it stand on its top ----
      const PL = fd.plateau ? (() => { const pts = [], S0 = T.startS, P0 = fd.plateau;
        for (let q = P0.s0; q <= P0.s1 + 0.1; q += 5) { const [x, z] = atSf(S0 + q, -(T.bl[T.idx(S0 + q)] + P0.off)); pts.push([x, z]); }
        return { pts, h: P0.h }; })() : null;
      const platH = (x, z) => PL && inPoly(PL.pts, x, z) ? PL.h : 0;
      const gH = (x, z) => groundH(x, z) + platH(x, z);
      if (PL) { const gt = new GB(true), gw = new GB(), n = PL.pts.length, h = PL.h, cx = PL.pts.reduce((a, p) => a + p[0], 0) / n, cz = PL.pts.reduce((a, p) => a + p[1], 0) / n;
        const tris = THREE.ShapeUtils.triangulateShape(PL.pts.map(p => new THREE.Vector2(p[0], p[1])), []), gc = [0.8 * 0.95, 0.84 * 0.95, 1.46 * 0.95];
        for (const [a, b, c] of tris) { const A = PL.pts[a], Bq = PL.pts[b], C = PL.pts[c]; gt.triO([A[0], h, A[1]], [Bq[0], h, Bq[1]], [C[0], h, C[1]], gc, [cx, h - 5, cz], gc, gc, [A[0] / 14, -A[1] / 14], [Bq[0] / 14, -Bq[1] / 14], [C[0] / 14, -C[1] / 14]); }
        const wallC = [0.5, 0.52, 0.56], wallT = [0.72, 0.73, 0.75], wallB = [0.36, 0.38, 0.43];
        for (let k = 0; k < n; k++) { const A = PL.pts[k], Bq = PL.pts[(k + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz) || 1, ox = -dz / L, oz = dx / L;
          const mx = (A[0] + Bq[0]) / 2, mz = (A[1] + Bq[1]) / 2, s1 = inPoly(PL.pts, mx + ox * 0.5, mz + oz * 0.5) ? 1 : -1, ix = ox * s1, iz = oz * s1;   // (ix, iz) points into the terrace
          gw.quadO([A[0], -0.3, A[1]], [Bq[0], -0.3, Bq[1]], [Bq[0], h, Bq[1]], [A[0], h, A[1]], wallC, [mx + ix * 3, h * 0.5, mz + iz * 3], null, [wallB, wallB, wallC, wallC]);   // the retaining wall
          gw.quadUp([A[0], h + 0.03, A[1]], [Bq[0], h + 0.03, Bq[1]], [Bq[0] + ix * 0.45, h + 0.03, Bq[1] + iz * 0.45], [A[0] + ix * 0.45, h + 0.03, A[1] + iz * 0.45], [wallT, wallT, wallT, wallT]); }   // pale coping on top
        const mt = new THREE.Mesh(gt.geometry(), new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true })); mt.receiveShadow = true; mt.matrixAutoUpdate = false; root.add(mt);
        const mw = new THREE.Mesh(gw.geometry(), matV); mw.receiveShadow = true; mw.castShadow = true; mw.matrixAutoUpdate = false; root.add(mw);
        { let prev = null, acc = 0; const wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];   // rope fence along the top edge on the road side (every edge but the closing one)
          for (let k = 0; k < n - 1; k++) { const A = PL.pts[k], Bq = PL.pts[k + 1], L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), ox = -(Bq[1] - A[1]) / L, oz = (Bq[0] - A[0]) / L, s1 = inPoly(PL.pts, (A[0] + Bq[0]) / 2 + ox * 0.5, (A[1] + Bq[1]) / 2 + oz * 0.5) ? 1 : -1;
            for (let t = acc; t < L; t += 3.2) { const f = t / L, x = A[0] + (Bq[0] - A[0]) * f + ox * s1 * 1.1, z = A[1] + (Bq[1] - A[1]) * f + oz * s1 * 1.1, g = scen.get(x, z);
              box(g, x, h, z, 0.18, 1.05, 0.18, 0, wc, [0.52, 0.35, 0.22]);
              if (prev) { const Y = (tt) => h + 0.92 - 0.26 * 4 * tt * (1 - tt), p3 = [0, 1 / 3, 2 / 3, 1].map(tt => [prev[0] + (x - prev[0]) * tt, Y(tt), prev[1] + (z - prev[1]) * tt]);
                for (let q = 0; q < 3; q++) { const a1 = p3[q], b1 = p3[q + 1]; g.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [x + ox * s1, h, z + oz * s1]); g.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [x - ox * s1, h, z - oz * s1]); } }
              prev = [x, z]; acc = t + 3.2 - L; } } }
        exclF.push((x, z) => inPoly(PL.pts, x, z) && polyDist(PL.pts, x, z) < 3.2);   // keep the edge of the terrace clear
      }
      const pineCs = KMP ? [[0.2, 0.44, 0.27], [0.17, 0.4, 0.25], [0.23, 0.48, 0.28], [0.26, 0.51, 0.26], [0.19, 0.42, 0.28]]   // Gromski rt: fresh green pines
        : [[0.17, 0.43, 0.42], [0.15, 0.4, 0.4], [0.2, 0.47, 0.44], [0.22, 0.5, 0.43], [0.16, 0.42, 0.44]];   // teal-green firs: dark teal in shade, fresh green where the low sun catches them (measured from the reference)
      // firs as in the reference: tall and slim, four drooping jagged tiers, sunlit tips green, shaded sides teal (soft shading).
      // Far from the circuit (more than 80 m beyond the barriers, small and hazy on screen) a cheaper two-tier fir with the same silhouette.
      let firCount = 0, firFar = 0; const fir = (x, z, hgt, yb) => { firCount++;
        const far = clearance(x, z) > 80, g = scen.get(x, z), y0 = yb != null ? yb : gH(x, z), col = vary(pineCs[Math.floor(R() * pineCs.length)], R, 0.08), rr = hgt * (0.17 + R() * 0.03), rot = R() * TAU, lit = (k) => [col[0] * k * 1.2, col[1] * k * 1.1, col[2] * k * 0.82];
        if (far) { firFar++; R(); R(); R();   // (same number of random draws as a near fir)
          starCone(g, x, y0 + hgt * 0.1, z, rr * 1.05, hgt * 0.4, 5, col, lit(1.32), rot, hgt * 0.05);
          starCone(g, x, y0 + hgt * 0.4, z, rr * 0.7, hgt * 0.34, 4, col, lit(1.42), rot + 0.6, hgt * 0.04);
          cone(g, x, y0 + hgt * 0.62, z, rr * 0.36, hgt * 0.38, 4, col, lit(1.5), rot + 1.2); return; }
        box(g, x, y0 - 0.2, z, 0.36, hgt * 0.2, 0.36, rot, [0.33, 0.22, 0.16], null, true);
        const c2 = vary(col, R, 0.05), c3 = vary(col, R, 0.05), c4 = vary(col, R, 0.05);
        starCone(g, x, y0 + hgt * 0.1, z, rr, hgt * 0.26, 6, col, lit(1.28), rot, hgt * 0.045);
        starCone(g, x, y0 + hgt * 0.26, z, rr * 0.84, hgt * 0.25, 6, c2, lit(1.34), rot + 0.5, hgt * 0.04);
        starCone(g, x, y0 + hgt * 0.42, z, rr * 0.66, hgt * 0.24, 5, c3, lit(1.4), rot + 1.0, hgt * 0.035);
        starCone(g, x, y0 + hgt * 0.57, z, rr * 0.48, hgt * 0.22, 4, c4, lit(1.46), rot + 1.5, hgt * 0.03);
        cone(g, x, y0 + hgt * 0.7, z, rr * 0.3, hgt * 0.32, 5, c4, lit(1.52), rot + 2.0); };
      // Toskana and Gromski rt: round, bushy broadleaf trees (soft blobs on a short trunk, sunlit tops; near the circuit smooth round clumps), in Toskana tall slim cypresses and rounded pines
      const LEAFC = ITA ? [[0.3, 0.55, 0.2], [0.26, 0.5, 0.19], [0.34, 0.58, 0.22], [0.24, 0.46, 0.2]] : [[0.28, 0.52, 0.2], [0.24, 0.47, 0.19], [0.32, 0.56, 0.22], [0.22, 0.44, 0.2]];
      let leafCount = 0, leafNear = 0; const leafy = (x, z, hgt, yb) => { leafCount++;
        const g = scen.get(x, z), y0 = yb != null ? yb : gH(x, z), col = vary(LEAFC[Math.floor(R() * LEAFC.length)], R, 0.1), r0 = hgt * (0.3 + R() * 0.06), rot = R() * TAU;
        box(g, x, y0 - 0.2, z, 0.42, hgt * 0.45, 0.42, rot, [0.36, 0.25, 0.17], null, true);
        if (clearance(x, z) < 30) { leafNear++;   // near the circuit, where it is big on screen: a cloud of soft round clumps as in the reference (one big crown, two round its lower edge)
          puff(g, x, y0 + hgt * 0.64, z, r0 * 1.04, 0.9, col, R, 0.12, 0.46, 1.3, true);
          for (let q = 0; q < 2; q++) { const a = rot + q * 2.4 + (R() - 0.5) * 0.6, d = r0 * (0.7 + R() * 0.12);
            puff(g, x + Math.cos(a) * d, y0 + hgt * (0.46 + R() * 0.08), z + Math.sin(a) * d, r0 * (0.62 + R() * 0.1), 0.86, col.map(v => v * (0.92 + R() * 0.12)), R, 0.12, 0.44, 1.24, true); }
          return; }
        ico(g, x, y0 + hgt * 0.58, z, r0, 0.82, col, R, 0.25);
        ico(g, x + Math.cos(rot) * r0 * 0.45, y0 + hgt * 0.74, z + Math.sin(rot) * r0 * 0.45, r0 * 0.72, 0.86, col.map(v => v * 1.1), R, 0.25);
        if (R() < 0.6) ico(g, x - Math.cos(rot) * r0 * 0.5, y0 + hgt * 0.66, z - Math.sin(rot) * r0 * 0.5, r0 * 0.62, 0.84, col.map(v => v * 0.95), R, 0.25); };
      const puffPine = (x, z, hgt) => { leafCount++;   // Toskana (as in the reference): a rounded conifer, three soft tiers narrowing to the top, dark green with sunlit crowns
        const g = scen.get(x, z), y0 = gH(x, z), col = vary([0.2, 0.42, 0.2], R, 0.08), rr = hgt * (0.2 + R() * 0.03);
        box(g, x, y0 - 0.2, z, 0.36, hgt * 0.2, 0.36, 0, [0.34, 0.24, 0.16], null, true);
        if (clearance(x, z) > 30) { ico(g, x, y0 + hgt * 0.36, z, rr, 1.1, col, R, 0.2); ico(g, x, y0 + hgt * 0.66, z, rr * 0.62, 1.2, col.map(v => v * 1.12), R, 0.2); return; }
        leafNear++; for (let q = 0; q < 3; q++) puff(g, x, y0 + hgt * (0.3 + q * 0.23), z, rr * (1 - q * 0.26), 0.62, col.map(v => v * (1 + q * 0.06)), R, 0.12, 0.44, 1.26, q === 0); };
      const cypress = (x, z, hgt, yb) => { leafCount++;   // Italian cypress: a tall, narrow dark column, a little lighter at the top
        const g = scen.get(x, z), y0 = yb != null ? yb : gH(x, z), col = vary([0.15, 0.34, 0.19], R, 0.08), rr = hgt * (0.1 + R() * 0.02);
        box(g, x, y0 - 0.2, z, 0.3, hgt * 0.16, 0.3, 0, [0.34, 0.24, 0.16], null, true);
        ico(g, x, y0 + hgt * 0.48, z, rr * 1.15, 3.3, col, R, 0.12);
        ico(g, x, y0 + hgt * 0.74, z, rr * 0.72, 3.1, col.map(v => v * 1.12), R, 0.12); };
      const boulder = (x, z, r, sy) => { const g = scen.get(x, z), y0 = gH(x, z), col = vary([0.58, 0.64, 0.54], R, 0.05);
        if (r > 1.6) rock(g, x, y0 + r * sy * 0.36, z, r * (0.9 + R() * 0.4), r * sy, r * (0.8 + R() * 0.3), R() * TAU, col, R, 0.22); else ico(g, x, y0 + r * sy * 0.4, z, r, sy, col, R, 0.38); };
      const slab = (x, z, r) => { const g = scen.get(x, z), y0 = gH(x, z) - 0.4, rot = R() * TAU, h = r * (0.8 + R() * 0.9), c1 = vary([0.6, 0.65, 0.54], R, 0.05);   // blocky sandstone with a chamfered top
        box(g, x, y0, z, r * 1.7, h, r * 1.3, rot, c1, c1.map(v => v * 1.08)); box(g, x + (R() - 0.5) * r * 0.3, y0 + h, z + (R() - 0.5) * r * 0.3, r * 1.25, r * 0.35, r * 0.9, rot + 0.15, c1.map(v => v * 1.03), c1.map(v => v * 1.12)); };
      const sNearF = (px, pz) => { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - px, T.pz[i] - pz); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
      const fAt = (px, pz) => ((sNearF(px, pz) - T.startS) % T.len + T.len) % T.len / T.len;   // lap fraction from the start line
      const sAt = (px, pz) => sNearF(px, pz);                                                     // track distance of the nearest sample
      if (fd.lake) exclF.push((x, z) => shoreFO(x, z) < 2.5);                                     // nothing generic in (or right at the edge of) the lake
      // ---- the farm east of the right leg (field, garden, barn, round tower): its footprint is kept free of trees and rocks ----
      // (the field follows the road: a strip from 4.5 m to 58 m beyond the barrier along the upper right leg; the yard and buildings sit north-east of it)
      const FARM = fd.farm ? (() => { const [fx, fz] = fd.farm, sa = sNearF(328, 150), sb = sNearF(335, 40);
        return { sa, sb, o0: 4.5, o1: 58, garden: { x0: fx - 6, x1: fx + 24, z0: fz - 88, z1: fz - 52 },
          barn: [fx + 34, fz - 30], tower: [fx + 12, fz - 44], shed: [fx + 2, fz - 38], yard: { x0: fx - 12, x1: fx + 46, z0: fz - 94, z1: fz - 14 } }; })() : null;
      const inField = (x, z, m) => { const n = nearest(x, z); if (n.i < 0 || n.lat <= 0) return false; const sq = n.i * T.ds; return sq >= FARM.sa - m && sq <= FARM.sb + m && n.lat > T.br[n.i] + FARM.o0 - m && n.lat < T.br[n.i] + FARM.o1 + m; };
      if (FARM) exclF.push((x, z) => inField(x, z, 3) || (x > FARM.yard.x0 && x < FARM.yard.x1 && z > FARM.yard.z0 && z < FARM.yard.z1));
      if (foPit) exclF.push((x, z) => { const n = nearest(x, z); if (n.i < 0) return false; const p = foPit(n.i); return !!p && n.lat > 0 && n.lat < p.o + 3.5 + 9 + 9; });   // pit lane, apron and garages
      // ---- grandstands as in the reference: short open blocks, raked rows packed with spectators (lots of straw hats), white frame,
      //      yellow sponsor boards front and back, loudspeaker poles, a see-through catch fence in front ----
      const SHIRTS = [[0.78, 0.24, 0.2], [0.26, 0.36, 0.6], [0.92, 0.9, 0.86], [0.2, 0.2, 0.23], [0.56, 0.44, 0.34], [0.36, 0.5, 0.36], [0.72, 0.56, 0.4], [0.86, 0.62, 0.32], [0.46, 0.32, 0.5], [0.62, 0.66, 0.72], [0.92, 0.9, 0.86], [0.3, 0.26, 0.24]];   // muted, like the reference crowd
      const SKIN = [[0.95, 0.76, 0.6], [0.86, 0.62, 0.45], [0.62, 0.42, 0.28], [0.98, 0.84, 0.7]], HAIR = [[0.18, 0.12, 0.08], [0.1, 0.08, 0.07], [0.62, 0.45, 0.22], [0.36, 0.22, 0.12], [0.8, 0.78, 0.74]];
      const spectator = (g, x, y, z, rot) => { if (R() < 0.07) return;
        const sh = SHIRTS[Math.floor(R() * SHIRTS.length)], sk = SKIN[Math.floor(R() * SKIN.length)], X = x + (R() - 0.5) * 0.14, Z = z + (R() - 0.5) * 0.14;
        box(g, X, y, Z, 0.54, 0.62, 0.46, rot, sh, sh, true);
        if (R() < 0.4) { const hc = R() < 0.85 ? vary([0.93, 0.84, 0.63], R, 0.05) : (R() < 0.5 ? [0.84, 0.18, 0.15] : [0.2, 0.34, 0.75]); box(g, X, y + 0.62, Z, 0.34, 0.3, 0.34, rot, sk, hc, true); box(g, X, y + 0.9, Z, 0.68, 0.08, 0.68, rot, hc, hc, true); }
        else box(g, X, y + 0.62, Z, 0.36, 0.36, 0.36, rot, sk, HAIR[Math.floor(R() * HAIR.length)], true); };
      let crowdG = null; const crowdMeshes = [];
      const flushCrowd = () => { if (crowdG && !crowdG.empty) { const m = new THREE.Mesh(crowdG.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); crowdMeshes.push(m); } crowdG = new GB(); };
      const standBlock = (sa, sb, side, rows) => {
        const sm = (sa + sb) / 2, im = T.idx(sm), hd = T.hd[im], L = sb - sa, bar = side > 0 ? T.br[im] : T.bl[im];
        const b0 = bar + 2.8, rowD = 0.8, rowH = 0.46, baseH = 1.1, P = (s1, d) => (FOR ? atS : atSf)(s1, side * d);   // (the newer circuits: interpolated, so the frames and figures sit where they belong)
        const [gx, gz] = P(sm, b0 + 3), g = scen.get(gx, gz), white = [0.92, 0.92, 0.94], frame = FOR ? white : [0.44, 0.24, 0.2], seat = FOR ? [0.72, 0.17, 0.15] : [0.38, 0.46, 0.64], step = FOR ? [0.56, 0.57, 0.62] : [0.36, 0.4, 0.5];   // red seats (they show between the fans, as in the reference; Toskana and Gromski rt: slate-blue terraces in a dark red-brown frame, as at Faenza and Thunder Point)
        { const [x, z] = P(sm, b0 - 0.15); box(g, x, 0, z, L, baseH + 0.25, 0.3, hd, frame, frame); }
        for (let k = 0; k < rows; k++) { const [x, z] = P(sm, b0 + (k + 0.5) * rowD); box(g, x, 0, z, L, baseH + k * rowH, rowD, hd, step, seat);
          const y = baseH + k * rowH + 0.015, A = P(sa, b0 + k * rowD + 0.05), Bq = P(sb, b0 + k * rowD + 0.05), C = P(sb, b0 + (k + 1) * rowD - 0.05), D = P(sa, b0 + (k + 1) * rowD - 0.05);   // packed crowd underneath the figures
          texCrowd.quadUp([A[0], y, A[1]], [Bq[0], y, Bq[1]], [C[0], y, C[1]], [D[0], y, D[1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, k * 0.14], [L / 10, k * 0.14], [L / 10, k * 0.14 + 0.13], [0, k * 0.14 + 0.13]]); }
        const topH = baseH + rows * rowH, backD = b0 + rows * rowD + 0.15;
        { const [x, z] = P(sm, backD); box(g, x, 0, z, L + 0.3, topH + 2.4, 0.3, hd, frame, frame); }
        for (const s1 of [sa - 0.15, sb + 0.15]) for (let q = 0; q < 3; q++) { const d0 = b0 - 0.3 + q * rows * rowD / 3, dd = backD - d0 + 0.15, [x, z] = P(s1, d0 + dd / 2); box(g, x, 0, z, 0.3, baseH + (q + 1) * rows * rowH / 3 + 0.7, dd, hd, frame, frame); }
        for (let k = 0; k < rows; k++) for (let s1 = sa + 0.55 + (k % 2) * 0.6, q = 0; s1 < sb - 0.35; s1 += 0.6, q++) { if (Math.abs(s1 - sm) < (FOR ? 0.75 : 1.35) || (q % 2 === 1 && R() < (FOR ? 0.85 : 0.1))) continue; /* figures in a loose checkerboard over the packed-crowd texture */ const [x, z] = P(s1, b0 + (k + 0.55) * rowD); spectator(crowdG, x, baseH + k * rowH, z, hd); }
        if (!FOR) { const dk = [0.1, 0.1, 0.13], nT = Math.min(4, rows - 2);   // the dark entrance tunnel in the middle of the block, low walls either side (as in the reference)
          for (let k = 0; k < nT; k++) { const [x, z] = P(sm, b0 + (k + 0.5) * rowD); box(g, x, 0, z, 2.1, baseH + k * rowH + 0.03, rowD + 0.02, hd, dk, dk); }
          for (const o of [-1.15, 1.15]) { const [x, z] = P(sm + o, b0 + nT * rowD / 2); box(g, x, 0, z, 0.22, baseH + (nT - 1) * rowH + 0.55, nT * rowD, hd, frame, frame); } }
        const flip = side > 0, behind = (s1, d, y) => { const [x, z] = P(s1, d); return [x, y, z]; };
        for (let s0 = sa + 0.3, q = 0; s0 < sb - 3.5; s0 += 4.1, q++) {   // yellow boards along the front wall
          const slot = (FOR ? [0, 2, 3, 6] : [0, 4, 2, 4])[q % 4], u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25, d = b0 - 0.32;
          const [ax, az] = P(s0, d), [bx, bz] = P(s0 + 3.9, d);
          texSpons.quadO([ax, 0.2, az], [bx, 0.2, bz], [bx, 1.15, bz], [ax, 1.15, az], [1, 1, 1], behind(s0 + 2, d + 2, 0.7), flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); }
        for (let s0 = sa + 0.5, q = 0; s0 < sb - 4.5; s0 += 5.4, q++) {   // and along the top of the back wall
          const slot = (FOR ? [3, 1, 0, 2] : [4, 0, 4, 2])[q % 4], u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25, d = backD - 0.17;
          const [ax, az] = P(s0, d), [bx, bz] = P(s0 + 5.1, d);
          texSpons.quadO([ax, topH + 0.95, az], [bx, topH + 0.95, bz], [bx, topH + 2.25, bz], [ax, topH + 2.25, az], [1, 1, 1], behind(s0 + 2.5, d + 2, topH + 1.5), flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); }
        for (let s1 = sa + 2; s1 < sb; s1 += 11) { const [x, z] = P(s1, b0 - 1.2);   // loudspeaker and lamp poles in front of the stand
          if (!FOR) {   // (Toskana, Gromski rt: taller poles with two big white horn loudspeakers turned along the track and a pair of lamps, as in the reference)
            const pole = [0.3, 0.3, 0.33]; cyl(g, x, 0, z, 0.1, 7.6, 6, pole); box(g, x, 7.4, z, 1.3, 0.12, 0.12, hd, pole);
            for (const o of [-0.55, 0.55]) { const [hx, hz] = P(s1 + o, b0 - 1.2); cyl(g, hx, 7.55, hz, 0.24, 0.42, 8, [0.97, 0.97, 0.95]); box(g, hx, 7.97, hz, 0.36, 0.1, 0.36, hd, [1, 0.97, 0.82], [1, 0.97, 0.82]); }
            for (const o of [-0.4, 0.4]) { const [hx, hz] = P(s1 + o * 0.6, b0 - 1.2 - o); box(g, hx, 6.2, hz, 0.46, 0.46, 0.7, hd + Math.PI / 2 + o * 2.2, [0.96, 0.96, 0.95], [0.99, 0.99, 0.98]); }
            continue; }
          cyl(g, x, 0, z, 0.08, 6.4, 6, white); box(g, x, 6.2, z, 0.55, 0.28, 0.35, hd, white, [0.98, 0.95, 0.8]);
          for (const o of [-0.3, 0.3]) { const [hx, hz] = P(s1 + o, b0 - 1.0); box(g, hx, 5.5, hz, 0.28, 0.28, 0.42, hd + o * 1.4, [0.95, 0.95, 0.95]); } }
        for (let s1 = sa - 4; s1 < sb + 4; s1 += 2) { const i = T.idx(s1), j = T.idx(s1 + 2), bi = side > 0 ? T.br : T.bl, Q = (k, y) => [T.px[k] + T.nx[k] * side * (bi[k] + 0.35), y, T.pz[k] + T.nz[k] * side * (bi[k] + 0.35)];   // see-through catch fence
          const fu0 = s1 / 2.5, fu1 = (s1 + 2) / 2.5; texFence.quadO(Q(i, 0.95), Q(j, 0.95), Q(j, 3.5), Q(i, 3.5), [1, 1, 1], [T.px[i], 2, T.pz[i]], [[fu0, 0], [fu1, 0], [fu1, 1.0], [fu0, 1.0]]);
          if (((s1 - sa + 4) / 2 | 0) % 2 === 0) { const q = Q(i, 0); box(g, q[0], 0, q[2], 0.1, 3.6, 0.1, 0, [0.62, 0.63, 0.66]); } }
        const [cx, cz] = P(sm, b0 + rows * rowD / 2); exclRect.push({ x: cx, z: cz, hx: L / 2 + 3, hz: rows * rowD / 2 + 4, rot: hd });
      };
      if (FOR) { const S0 = T.startS; flushCrowd(); standBlock(S0 - 106, S0 - 81, -1, 7); standBlock(S0 - 77, S0 - 52, -1, 7); standBlock(S0 - 48, S0 - 23, -1, 7); flushCrowd();
        if (fd.stand2) { const a = sNearF(...fd.stand2[0]), b = sNearF(...fd.stand2[1]), s0 = Math.min(a, b), s1 = Math.max(a, b), mid = (s0 + s1) / 2;
          standBlock(s0, mid - 2, -1, 5); standBlock(mid + 2, s1, -1, 5); flushCrowd(); } }
      else { flushCrowd(); for (const [a, b, sd, rows] of fd.stands || []) standBlock(T.startS + a, T.startS + b, sd, rows); flushCrowd(); }   // (from the track file)
      // ---- the big heap of boulders right after the finish line, between the straight and the tongue (as in the reference) ----
      if (FOR) { const S0 = T.startS;
        for (let s1 = S0 + 6; s1 < S0 + 62; s1 += 3.8) for (let layer = 0; layer < 2; layer++) {   // a low heap of big rounded boulders (not a cliff)
          const i = T.idx(s1 + (R() - 0.5) * 3), d = T.bl[i] + 6.6 + layer * 4.6 + R() * 2, x = T.px[i] - T.nx[i] * d, z = T.pz[i] - T.nz[i] * d, r = 2.4 + R() * 1.9 + layer * 0.4;
          if (clearance(x, z) < r * 0.8 + 1.2 || excluded(x, z)) continue; const g = scen.get(x, z), y0 = gH(x, z);
          rock(g, x, y0 + r * 0.32 + layer * 0.5, z, r * (1.05 + R() * 0.3), r * (0.62 + R() * 0.25), r * (0.85 + R() * 0.2), R() * TAU, vary([0.6, 0.66, 0.56], R, 0.05), R, 0.2, 0.8);
          if (R() < 0.35) rock(g, x + (R() - 0.5) * 2, y0 + r * 1.1 + layer * 0.9, z + (R() - 0.5) * 2, r * 0.65, r * 0.5, r * 0.6, R() * TAU, vary([0.64, 0.71, 0.6], R, 0.05), R, 0.2); }
        { let prev = null; const g0 = scen.get(T.px[T.idx(S0 + 36)], T.pz[T.idx(S0 + 36)]);   // wooden posts with a sagging rope between the catch fence and the boulders
          for (let s1 = S0 + 10; s1 < S0 + 64; s1 += 3.2) { const i = T.idx(s1), o = T.bl[i] + 2.3, x = T.px[i] - T.nx[i] * o, z = T.pz[i] - T.nz[i] * o, wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];
            box(g0, x, 0, z, 0.2, 1.1, 0.2, T.hd[i], wc, [0.52, 0.35, 0.22]);
            if (prev) { const Y = (t) => 0.95 - 0.28 * 4 * t * (1 - t), p3 = [0, 1 / 3, 2 / 3, 1].map(t => [prev[0] + (x - prev[0]) * t, Y(t), prev[1] + (z - prev[1]) * t]);
              for (let k = 0; k < 3; k++) { const a1 = p3[k], b1 = p3[k + 1]; g0.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [T.px[i], 0.5, T.pz[i]]); g0.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [2 * x - T.px[i], 0.5, 2 * z - T.pz[i]]); } }
            prev = [x, z]; }
          for (const [ds, dl] of [[62, 1.6], [63.6, 1.9], [62.8, 2.9]]) { const i = T.idx(S0 + ds), o = T.bl[i] + dl, x = T.px[i] - T.nx[i] * o, z = T.pz[i] - T.nz[i] * o;   // straw bales at the end
            box(g0, x, 0, z, 1.3, 0.85, 0.9, T.hd[i] + 0.2, [0.8, 0.62, 0.3], [0.88, 0.72, 0.38]); } }
        const i0 = T.idx(S0 + 34), d0 = T.bl[i0] + 10; exclRect.push({ x: T.px[i0] - T.nx[i0] * d0, z: T.pz[i0] - T.nz[i0] * d0, hx: 32, hz: 9, rot: T.hd[i0] }); }
      // ---- the lake north of the circuit: dark blue water (the low sun glitters on it) behind a ridge of big pale boulders with firs ----
      if (fd.lake) {
        let wx0 = B.minX - 260, wx1 = B.maxX + 260, wz0 = B.minZ - 260, wz1 = -1e9; for (const [, pz] of fd.lake) wz1 = Math.max(wz1, pz); wz1 += 10;
        if (!FOR) { const lx = fd.lake.map(p => p[0]), lz = fd.lake.map(p => p[1]);   // (the newer circuits: the lake polygon's own box, within reach of the camera)
          wx0 = Math.max(wx0, Math.min(...lx) - 10); wx1 = Math.min(wx1, Math.max(...lx) + 10); wz0 = Math.max(wz0, Math.min(...lz) - 10); wz1 = Math.min(B.maxZ + 260, Math.max(...lz) + 10); }
        const wg = new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0, 1, 1); wg.rotateX(-Math.PI / 2); wg.translate((wx0 + wx1) / 2, -1.25, (wz0 + wz1) / 2);
        const uvA = wg.getAttribute('uv'), pA = wg.getAttribute('position'); for (let k = 0; k < uvA.count; k++) uvA.setXY(k, pA.getX(k) / 26, -pA.getZ(k) / 26);
        const WO = { len: 1.3, amp: 1, refl: 0.5, land: 0.4, shal: 0.5, lap: 0.8, surf: 0.25 }, wm = new THREE.Mesh(wg, waterMat(tex, Object.assign({ color: FOR ? 0x86677a : 0x7c6672 }, WO)));   // (Toskana: dark navy-teal water, as in the reference)
        wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm); out.dyn.water = tex.water;
        addShore(root, shoreBand(...gmBox(wx0, wz0, wx1, wz1), -1.235, gmLine(-1.25), 26), wm.material, WO);
        const L = fd.lake, stoneC = [0.62, 0.67, 0.58];
        for (let e = 0; e < L.length; e++) { const [ax, az] = L[e], [bx, bz] = L[(e + 1) % L.length], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
          for (let q = 0; q < len; q += FOR ? 5.5 + R() * 3 : 30 + R() * 20) { const px0 = ax + ux * q, pz0 = az + uz * q;   // (Toskana: only a boulder here and there)
            if (px0 < B.minX - 40 || px0 > B.maxX + 40 || pz0 < B.minZ - 40 || pz0 > B.maxZ + 40) continue;
            const c0 = clearance(px0, pz0); if (c0 > 95) continue;                                  // only the shore the camera can see
            for (let layer = 0; layer < (FOR ? 2 : 1); layer++) {                                     // a band of boulders: one row half in the water, one on the bank
              const inl = layer === 0 ? -2 + R() * 3 : 3 + R() * 6, x = px0 + uz * inl + (R() - 0.5) * 2, z = pz0 - ux * inl + (R() - 0.5) * 2;   // (the polygon runs clockwise on the map: (uz, -ux) points inland)
              const c = clearance(x, z), r = 3 + R() * 3.4 + (layer ? 0.8 : 0); if (c < r + 5) continue;
              const g = scen.get(x, z), y0 = layer === 0 ? -1.4 : gH(x, z);
              rock(g, x, y0 + r * 0.32, z, r * (1 + R() * 0.4), r * (0.55 + R() * 0.35), r * (0.8 + R() * 0.3), R() * TAU, vary(stoneC, R, 0.05), R, 0.18, 0.75);
              if (layer === 1 && R() < 0.3) rock(g, x + (R() - 0.5) * r, y0 + r * 0.8, z + (R() - 0.5) * r, r * 0.6, r * 0.45, r * 0.55, R() * TAU, vary(stoneC, R, 0.05), R, 0.2); }
            if (R() < 0.55) { const inl = 6 + R() * 8, x = px0 + uz * inl, z = pz0 - ux * inl; if (clearance(x, z) > 7 && !excluded(x, z)) (FOR ? fir : R() < 0.3 ? cypress : leafy)(x, z, 9 + R() * 7); } } }
        if (!FOR) { const gb = new GB(), bankC = [0.52, 0.35, 0.245];   // Toskana: a band of orange earth along the shore, as in the reference
          for (let e = 0; e < L.length; e++) { const [ax, az] = L[e], [bx, bz] = L[(e + 1) % L.length], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
            for (let q = 0; q < len; q += 4) { const q1 = Math.min(len, q + 4), a0 = [ax + ux * q, 0.015, az + uz * q], b0 = [ax + ux * q1, 0.015, az + uz * q1], c0 = clearance(a0[0], a0[2]);
              if (c0 > 95 || c0 < 8) continue;
              const a1 = [a0[0] + uz * 6, 0.015, a0[2] - ux * 6], b1 = [b0[0] + uz * 6, 0.015, b0[2] - ux * 6], col = vary(bankC, R, 0.03);
              gb.quadUp(a0, b0, b1, a1, [col, col, col, col]); } }
          const mb = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mb.receiveShadow = true; mb.matrixAutoUpdate = false; root.add(mb); }
      }
      // ---- tall rock walls (cliffs) with firs on top: round the top-left corner, the ridge on the right leg, behind the top road ----
      const cliff = (x, z, r, h) => { const g = scen.get(x, z), y0 = gH(x, z) - 0.5, n = 4 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) { const a = R() * TAU, d = R() * r * 0.45, rr = r * (0.38 + R() * 0.22), sy = (h * (0.6 + R() * 0.5)) / (rr * 1.6);
          rock(g, x + Math.cos(a) * d, y0 + rr * sy * 0.7, z + Math.sin(a) * d, rr * (1 + R() * 0.3), rr * sy, rr * (0.85 + R() * 0.3), R() * TAU, vary([0.6, 0.65, 0.55], R, 0.05), R, 0.18, 0.7); }
        if (R() < 0.75) fir(x + (R() - 0.5) * r * 0.5, z + (R() - 0.5) * r * 0.5, 7 + R() * 5, y0 + h * 0.8); };
      const cliffRow = (fa, fb, side, d0, d1, h) => { if (fb < fa) fb += 1;
        for (let q = fa * T.len; q < fb * T.len; q += 9 + R() * 4) { const i = T.idx((T.startS + q) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], d = bar + d0 + R() * (d1 - d0), x = T.px[i] + T.nx[i] * side * d, z = T.pz[i] + T.nz[i] * side * d, r = 7 + R() * 5;
          if (clearance(x, z) < r * 0.6 + 4 || excluded(x, z)) continue; cliff(x, z, r, h * (0.7 + R() * 0.5)); excl.push({ x, z, r: r * 0.8 }); } };
      // a big grey rock mass filling the infield of the rock bulb, right behind the inner kerb (as in the reference)
      if (FOR) { let cxs = 0, czs = 0, nb = 0; for (const [px2, pz2] of [[378, -6], [379, -32], [359, -53], [331, -50], [315, -32], [313, -6]]) { cxs += px2; czs += pz2; nb++; }
        const bx0 = cxs / nb, bz0 = czs / nb;
        for (let k = 0; k < 16; k++) { const a = R() * TAU, d = Math.sqrt(R()) * 11, x = bx0 + Math.cos(a) * d, z = bz0 + Math.sin(a) * d, r = 2.8 + R() * 2.6, c = clearance(x, z);
          if (c < r * 0.7 + 0.8) continue; const g = scen.get(x, z), y0 = gH(x, z), hh = Math.min(2.2, c * 0.25);
          rock(g, x, y0 + r * 0.45 + (k > 9 ? hh : 0), z, r * (1 + R() * 0.3), r * (0.8 + R() * 0.4), r * (0.85 + R() * 0.25), R() * TAU, vary([0.55, 0.64, 0.6], R, 0.05), R, 0.2); }
        fir(bx0 + 3, bz0 - 2, 10); excl.push({ x: bx0, z: bz0, r: 12 }); }
      if (FOR) { cliffRow(fAt(49, -48), fAt(20, 18), 1, 7, 13, 18);     // outside of the top-left corner: a tall rock wall dropping into the lake
        cliffRow(fAt(277, 263), fAt(328, 146), 1, 19, 26, 9); }  // beyond the dry creek on the right leg
      // ---- rock formations: big flat-shaded boulders heaped on low mounds, a few firs growing between them ----
      for (const [rx, rz, rr] of fd.rocks || []) {
        const n = 4 + Math.round(rr / 2.2);
        for (let k = 0; k < n; k++) { const a = R() * TAU, d = Math.sqrt(R()) * rr * 0.85, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 2.4 + R() * rr * 0.34;
          if (clearance(x, z) < r + 2) continue; if (R() < 0.55) slab(x, z, r * 0.8); else boulder(x, z, r, 0.55 + R() * 0.45); }
        for (let k = 0; k < 2 + rr / 6; k++) { const a = R() * TAU, d = rr * (0.4 + R() * 0.7), x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d; if (clearance(x, z) > 6) fir(x, z, 9 + R() * 6); }
        excl.push({ x: rx, z: rz, r: rr });
      }
      // scattered single boulders along the verges (as in the video, right behind the tyres)
      if (FOR) for (let k = 0; k < 90; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 3 + R() * 10), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (clearance(x, z) > 3 && !excluded(x, z)) { const r = 1.2 + R() * 2.6; boulder(x, z, r, 0.6 + R() * 0.4); excl.push({ x, z, r: r + 1 }); } }
      // ---- the farm (as in the reference): a ploughed field of long orange ridges behind a red wooden fence and a plank walkway,
      //      a vegetable garden, a round wooden tower with a blue top and a white balcony, a brown barn with white trim, an open shed ----
      if (FARM) { const F = FARM, soil = [0.46, 0.3, 0.23], ridgeS = [0.52, 0.33, 0.24], ridgeT = [0.68, 0.44, 0.31], wood = [0.5, 0.31, 0.19], dkWood = [0.36, 0.22, 0.15], white = [0.93, 0.92, 0.9];
        const gf = new GB(), quadFlat = (x0, z0, x1, z1, y, col) => gf.quadUp([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [col, col, col, col]);
        const FP = (sq, o) => { const i = T.idx(sq), oo = T.br[i] + o; return [T.px[i] + T.nx[i] * oo, T.pz[i] + T.nz[i] * oo]; };
        const hutS = F.sa + (F.sb - F.sa) * 0.42, hutO = 34, [hutX, hutZ] = FP(hutS, hutO);
        for (let q = F.sa; q < F.sb; q += 2) { const A = FP(q, F.o0), Bq = FP(q, F.o1), C = FP(q + 2, F.o1), D = FP(q + 2, F.o0);   // the field
          gf.quadUp([A[0], 0.03, A[1]], [Bq[0], 0.03, Bq[1]], [C[0], 0.03, C[1]], [D[0], 0.03, D[1]], [soil, soil, soil, soil]);
          for (let o = F.o0 + 2.2; o < F.o1 - 1; o += 3.3) {                                                     // ridges running along the circuit
            if (Math.abs(o - hutO) < 6 && Math.abs(q - hutS) < 8) continue;
            const a0 = FP(q, o - 0.85), a1 = FP(q, o + 0.85), b0 = FP(q + 2, o - 0.85), b1 = FP(q + 2, o + 0.85), m0 = FP(q, o), m1 = FP(q + 2, o);
            gf.quadO([a0[0], 0.03, a0[1]], [b0[0], 0.03, b0[1]], [m1[0], 0.44, m1[1]], [m0[0], 0.44, m0[1]], ridgeS, [m0[0], -2, m0[1]], null, [ridgeS, ridgeS, ridgeT, ridgeT]);
            gf.quadO([m0[0], 0.44, m0[1]], [m1[0], 0.44, m1[1]], [b1[0], 0.03, b1[1]], [a1[0], 0.03, a1[1]], ridgeS, [m0[0], -2, m0[1]], null, [ridgeT, ridgeT, ridgeS, ridgeS]); } }
        quadFlat(F.yard.x0, F.yard.z0, F.yard.x1, F.yard.z1, 0.028, [0.6, 0.37, 0.24]);                         // farmyard: bare orange soil
        const mf = new THREE.Mesh(gf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mf.receiveShadow = true; mf.matrixAutoUpdate = false; root.add(mf);
        { const g = scen.get(hutX, hutZ);                                                                       // small wooden hut in the corner of the field
          box(g, hutX, 0, hutZ, 5, 3, 4.2, 0.05, dkWood, dkWood); gable(g, hutX, 3, hutZ, 5.6, 4.8, 1.5, 0.05, [0.3, 0.22, 0.2], dkWood);
          box(g, hutX - 2.52, 1.2, hutZ, 0.05, 0.9, 1.2, 0.05, [0.95, 0.85, 0.55]);
          for (const [bx, bz] of [[4, 5], [5.3, 5.4], [4.6, 6.6], [-4.5, 7]]) box(g, hutX + bx, 0, hutZ + bz, 1.3, 0.85, 0.9, R() * 0.6, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); }
        { const [bx, bz] = F.barn, g = scen.get(bx, bz), rot = 0.08;                                          // barn
          box(g, bx, 0, bz, 7.5, 5.6, 11, rot, wood, wood); gable(g, bx, 5.6, bz, 11.8, 8.4, 3.4, rot + Math.PI / 2, [0.33, 0.22, 0.2], wood);
          const c = Math.cos(rot), sn = Math.sin(rot), Pb = (lx, lz) => [bx + lx * c - lz * sn, bz + lx * sn + lz * c];
          for (const [lx, lz] of [[-3.75, -5.5], [3.75, -5.5], [3.75, 5.5], [-3.75, 5.5]]) { const [x, z] = Pb(lx, lz); box(g, x, 0, z, 0.35, 5.7, 0.35, rot, white); }
          { const [x, z] = Pb(-3.8, 0); box(g, x, 0, z, 0.12, 3.6, 3.6, rot, white); box(g, x - 0.04, 0.15, z, 0.1, 3.3, 3.2, rot, [0.4, 0.24, 0.16]); }   // white-framed doors
          box(g, bx, 5.45, bz, 7.8, 0.3, 11.3, rot, white);
          const [ax, az] = Pb(0, 7.6); box(g, ax, 0, az, 5, 3.4, 4.2, rot, wood, wood); gable(g, ax, 3.4, az, 5.6, 4.8, 1.6, rot, [0.33, 0.22, 0.2], wood); }
        { const [tx, tz] = F.tower, g = scen.get(tx, tz);                                                     // round tower: wooden base, blue top, white balcony
          cyl(g, tx, 0, tz, 2.7, 7, 10, wood, [0.45, 0.28, 0.18]); cyl(g, tx, 7, tz, 3.4, 0.22, 12, white); cyl(g, tx, 7.2, tz, 2.4, 3, 10, [0.27, 0.42, 0.74], [0.3, 0.45, 0.76]);
          for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, a2 = (k + 1) / 12 * TAU, px = tx + Math.cos(a) * 3.25, pz = tz + Math.sin(a) * 3.25, qx = tx + Math.cos(a2) * 3.25, qz = tz + Math.sin(a2) * 3.25;
            box(g, px, 7.2, pz, 0.1, 0.9, 0.1, 0, white); box(g, (px + qx) / 2, 8.05, (pz + qz) / 2, 1.72, 0.1, 0.1, Math.atan2(qz - pz, qx - px), white); }
          cone(g, tx, 10.2, tz, 3.1, 3.4, 10, [0.46, 0.22, 0.16], [0.52, 0.26, 0.18], 0); box(g, tx - 3, 0, tz, 2.4, 1.2, 1.4, 0, dkWood); }
        { const [sx, sz] = F.shed, g = scen.get(sx, sz);                                                      // open shed with a grey corrugated roof
          for (const lx of [-7, 0, 7]) for (const lz of [-2.6, 2.6]) box(g, sx + lx, 0, sz + lz, 0.22, 2.9, 0.22, 0, dkWood);
          gable(g, sx, 2.9, sz, 16, 6.4, 0.9, 0, [0.6, 0.61, 0.64], [0.5, 0.5, 0.53]);
          box(g, sx - 3, 0, sz, 3, 1.1, 2, 0.2, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); cyl(g, sx + 4, 0, sz + 1, 0.45, 1.1, 8, [0.2, 0.45, 0.75]); }
        { const G = F.garden, g = scen.get((G.x0 + G.x1) / 2, (G.z0 + G.z1) / 2);                              // vegetable garden: rows of round bushes
          for (let z = G.z0 + 3; z < G.z1 - 1; z += 4.2) for (let x = G.x0 + 2; x < G.x1 - 1; x += 3.2) ico(g, x + (R() - 0.5) * 0.5, 0.75, z + (R() - 0.5) * 0.5, 1.05 + R() * 0.25, 0.85, vary([0.27, 0.5, 0.22], R, 0.12), R, 0.2); }
        // plank walkway and red wooden fence between the circuit and the farm
        { const s0 = F.sa, s1 = sAt(380, -34), gw = new GB(); let n = 0, prev = null;
          for (let q = s0; q < s1; q += 1.0, n++) { const i = T.idx(q), j = T.idx(q + 1), o1 = T.br[i] + 1.5, o2 = T.br[i] + 4.2, oj1 = T.br[j] + 1.5, oj2 = T.br[j] + 4.2;
            const A = [T.px[i] + T.nx[i] * o1, 0.06, T.pz[i] + T.nz[i] * o1], Bq = [T.px[i] + T.nx[i] * o2, 0.06, T.pz[i] + T.nz[i] * o2], C = [T.px[j] + T.nx[j] * oj2, 0.06, T.pz[j] + T.nz[j] * oj2], D = [T.px[j] + T.nx[j] * oj1, 0.06, T.pz[j] + T.nz[j] * oj1];
            const pc = n % 2 ? [0.55, 0.36, 0.22] : [0.5, 0.32, 0.2]; gw.quadUp(A, Bq, C, D, [pc, pc, pc, pc]);
            if (n % 3 === 0) { const x = T.px[i] + T.nx[i] * (o2 + 0.3), z = T.pz[i] + T.nz[i] * (o2 + 0.3), g = scen.get(x, z), rc = [0.55, 0.19, 0.14];
              box(g, x, 0, z, 0.17, 1.25, 0.17, T.hd[i], rc);
              if (prev) for (const hy of [0.5, 1.0]) { g.quadO([prev[0], hy, prev[1]], [x, hy, z], [x, hy + 0.14, z], [prev[0], hy + 0.14, prev[1]], rc, [T.px[i], hy, T.pz[i]]); g.quadO([x, hy, z], [prev[0], hy, prev[1]], [prev[0], hy + 0.14, prev[1]], [x, hy + 0.14, z], [0.42, 0.15, 0.12], [2 * x - T.px[i], hy, 2 * z - T.pz[i]]); }
              prev = [x, z]; } }
          const m = new THREE.Mesh(gw.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      }
      // ---- dry creek (as in the reference): a pale winding sandy bed with a darker rim, east of the right leg beyond the mown lawn ----
      let creekD = null;
      if (fd.river) { const rv = fd.river, pts = [];
        for (let k = 0; k < rv.length - 1; k++) { const [ax, az] = rv[k], [bx, bz] = rv[k + 1], L2 = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L2 / 2));
          for (let q = 0; q < n; q++) { const t = q / n; pts.push([ax + (bx - ax) * t, az + (bz - az) * t]); } }
        pts.push(rv[rv.length - 1]);
        const P2 = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, wv = 1.6 * Math.sin(k * 0.21) + 0.7 * Math.sin(k * 0.57 + 1);
          return [p[0] - dz / l * wv, p[1] + dx / l * wv, -dz / l, dx / l, 2.3 + 0.5 * Math.sin(k * 0.33 + 2)]; });
        const gc = new GB(), bed = [0.66, 0.57, 0.53], rim = [0.5, 0.43, 0.4];
        for (let k = 0; k < P2.length - 1; k++) { const a = P2[k], b = P2[k + 1];
          const E = (p, o, y) => [p[0] + p[2] * o, y, p[1] + p[3] * o];
          gc.quadUp(E(a, -a[4], 0.035), E(a, a[4], 0.035), E(b, b[4], 0.035), E(b, -b[4], 0.035), [bed, bed, bed, bed]);
          for (const sd of [-1, 1]) { const o0 = sd * a[4], o1 = sd * (a[4] + 0.9), p0 = sd * b[4], p1 = sd * (b[4] + 0.9);
            if (sd < 0) gc.quadUp(E(a, o1, 0.03), E(a, o0, 0.03), E(b, p0, 0.03), E(b, p1, 0.03), [rim, rim, rim, rim]); else gc.quadUp(E(a, o0, 0.03), E(a, o1, 0.03), E(b, p1, 0.03), E(b, p0, 0.03), [rim, rim, rim, rim]);
            if (R() < 0.35) { const o = sd * (a[4] + 0.4 + R() * 0.6), x = a[0] + a[2] * o, z = a[1] + a[3] * o; ico(scen.get(x, z), x, 0.12, z, 0.3 + R() * 0.35, 0.6, vary([0.72, 0.68, 0.62], R, 0.06), R, 0.3); } } }
        const mc = new THREE.Mesh(gc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mc.receiveShadow = true; mc.matrixAutoUpdate = false; root.add(mc);
        const xs = P2.map(p => p[0]), zs = P2.map(p => p[1]), bb = [Math.min(...xs) - 8, Math.max(...xs) + 8, Math.min(...zs) - 8, Math.max(...zs) + 8];
        creekD = (x, z) => { if (x < bb[0] || x > bb[1] || z < bb[2] || z > bb[3]) return 1e9; let d = 1e9; for (let k = 0; k < P2.length; k += 2) d = Math.min(d, (x - P2[k][0]) ** 2 + (z - P2[k][1]) ** 2); return Math.sqrt(d); };
        exclF.push((x, z) => creekD(x, z) < 4.5); }
      // ---- knockable traffic cones (Bakreni gozd: a short row on the asphalt through the apex of every hairpin, well outside the racing line,
      //      as in the reference, the cars swing past on the inside, one more on the kerb at each end; the newer circuits: on the grass behind
      //      the apex kerb); marshals at the big corners ----
      const prop = (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 });
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir;
        if (!FOR) { const sm = ((c.i0 + i1c) / 2) * T.ds;   // (the newer circuits: never on the asphalt, where they only got in the way; a pair on the grass just behind the apex kerb, as in the reference)
          for (const ds of c.sev >= 3 ? [-7, 7] : [0]) { const i = T.idx(sm + ds), bar = inner > 0 ? T.br[i] : T.bl[i], o = w + T.curbW + 1.3; if (bar < o + 0.8) continue;
            const [x, z, hd] = atSf(sm + ds, inner * o); prop('cone', x, z, hd + R() * 0.6); } }
        else { let za = null, zb = null;   // (hairpins: up to four on the road and two on the kerb; the quicker corners: three on the road, as at the S in the reference)
          for (let k = c.i0 - 4; k <= i1c + 4; k++) { const ii = ((k % N) + N) % N; if (T.rl[ii] * inner >= 3.9) { if (za == null) za = k; zb = k; } }
          if (za != null) { const s0 = za * T.ds, s1 = zb * T.ds, n = c.sev >= 3 ? clamp(Math.floor((s1 - s0) / 3.6) + 1, 2, 4) : 3, st = (s1 - s0) / (n - 1);
            for (let q = 0; q < n; q++) { const [x, z, hd] = atSf(s0 + q * st, inner * 0.7), yaw = hd + R() * 0.6; prop('cone', x, z, yaw); }
            if (c.sev >= 3) for (const se of [s0 - 3, s1 + 3]) { const [x, z, hd] = atSf(se, inner * (w + 0.45)); prop('cone', x, z, hd); } } }
        for (let k = 0; k < 2; k++) { const i = T.idx(c.s0 + k * 7), side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z);
          box(g, x, 0, z, 0.5, 1.25, 0.35, T.hd[i], [0.98, 0.5, 0.1]); box(g, x, 1.25, z, 0.32, 0.32, 0.32, T.hd[i], [0.96, 0.96, 0.96]); } }
      // ---- big billboards on two wooden posts, tilted back and turned to the oncoming cars (placed as in the reference) ----
      { const gb = new GB(true), gpost = new GB();
        const board = (px, pz, side, out, along, slot, hw, hh) => { const i0 = T.idx(sAt(px, pz) + along), bar = side > 0 ? T.br[i0] : T.bl[i0], o = side * (bar + out), x = T.px[i0] + T.nx[i0] * o, z = T.pz[i0] + T.nz[i0] * o;
          let fx = -side * T.nx[i0] - T.tx[i0] * 0.7, fz = -side * T.nz[i0] - T.tz[i0] * 0.7; const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;   // faces the circuit and the cars coming towards it
          const ux = fz, uz = -fx, y0 = 2.0, tilt = 0.38, top = [-fx * hh * Math.sin(tilt), hh * Math.cos(tilt), -fz * hh * Math.sin(tilt)];
          const A = [x - ux * hw, y0, z - uz * hw], Bq = [x + ux * hw, y0, z + uz * hw], C = [Bq[0] + top[0], y0 + top[1], Bq[2] + top[2]], D = [A[0] + top[0], y0 + top[1], A[2] + top[2]];
          const u0 = (slot % 2) * 0.5, vT = 1 - Math.floor(slot / 2) * 0.5, inside = [x - fx * 2, y0 + hh / 2, z - fz * 2];
          gb.quadO(A, Bq, C, D, [1, 1, 1], inside, [[u0, vT - 0.5], [u0 + 0.5, vT - 0.5], [u0 + 0.5, vT], [u0, vT]]);
          const bk = (p) => [p[0] - fx * 0.12, p[1], p[2] - fz * 0.12];   // plain backing
          gpost.quadO(bk(Bq), bk(A), bk(D), bk(C), [0.86, 0.85, 0.82], [x + fx * 2, y0 + hh / 2, z + fz * 2]);
          for (const q of [-hw * 0.62, hw * 0.62]) box(gpost, x + ux * q - fx * 0.3, 0, z + uz * q - fz * 0.3, 0.3, y0 + hh * 0.7, 0.3, Math.atan2(uz, ux), [0.48, 0.33, 0.22]);
          excl.push({ x, z, r: hw + 1.5 }); };
        if (FOR) { board(193, 101, 1, 3.4, 0, 0, 4.2, 3.9);      // DOBRI DNEVI and NA ZDRAVJE beside the tongue, opposite its grandstand
          board(193, 101, 1, 3.9, 14, 1, 4.2, 3.9);
          board(301, 221, 1, 22, -4, 2, 4.2, 3.6);        // two GROM boards beyond the dry creek on the right leg
          board(301, 221, 1, 23.5, 10, 2, 4.2, 3.6);
          board(327, 116, -1, 4.5, 0, 3, 2.4, 2.4);     // OPRIJEM sign inside the S of the right leg
          board(165, -18, 1, 3.6, 0, 0, 4.2, 3.9); }      // DOBRI DNEVI again at the top of the tongue
        else for (const b of fd.boards || []) board(...b);   // (from the track file: [x, z, side, out, along, slot, half width, height])
        const mb = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ map: FOR ? tex.boardsFO : ITA ? tex.boardsIT : tex.boardsKP, vertexColors: true })); mb.castShadow = true; mb.receiveShadow = true; root.add(mb);
        const mp = new THREE.Mesh(gpost.geometry(), matV); mp.castShadow = true; mp.receiveShadow = true; root.add(mp); }
      // ---- orange-brown dirt shoulders along both edges of the whole circuit (the look of the reference track; Toskana: wide run-offs round the outside of the corners) ----
      { const gs = new GB(), sAtStart = T.startS, [wOut, wIn, back] = ITA ? [9, 2.2, 0.9] : KMP ? [3.6, 0.9, 0.6] : [3.4, 1.7, 0.5], dirtC = ITA ? [0.52, 0.35, 0.245] : KMP ? [0.44, 0.32, 0.21] : [0.58, 0.39, 0.31];
        const WD = FOR ? null : [-1, 1].map(side => {   // the newer circuits: the run-off widens and narrows smoothly round the outside of a corner (no steps)
          let a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = (T.k[i] * side < 0 && Math.abs(T.k[i]) > 0.015) ? wOut : wIn;
          for (let it = 0; it < 3; it++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 0; for (let d = -4; d <= 4; d++) m += a[(i + d + N) % N]; o[i] = Math.max(a[i] * (it ? 0 : 1), m / 9); } a = o; }
          return a; });
        if (ITA) {   // (V2 makadamski rob: a gravel shoulder of irregular width (0.3-1.2 m, plus the run-off round the outside of the corners: there the old orange-brown),
          //  light grey-brown gravel on the gravel map, its outer edge ragged every metre and fading out into the lawn (vertex alpha))
          const gT = new GB(true, true), eN1 = valueNoise2(9711, 7), eN2 = valueNoise2(9712, 2.3), eN3 = valueNoise2(9713, 0.9), MA = [0.6, 0.5, 0.39], uvq = (p) => [p[0] / 4, -p[2] / 4];
          const GR = [0.525, 0.55, 0.5], DI = [0.6, 0.38, 0.25];   // (the rendered colours: gravel, the run-off's dirt)
          const kOp = w + T.curbW - KW[1] - 0.05;   // (every kerb is opaque at least out to here, whatever its wear: where it covers the shoulder the strip starts here, and is not built at all where it ends under the kerb)
          for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 2) {
            const i = T.idx(q), j = T.idx(q + 2), bar = side > 0 ? T.br : T.bl, o1 = w + 0.02, wd = WD[side > 0 ? 1 : 0][i], o2i = Math.min(w + wd, bar[i] - back);
            if (o2i <= o1 + 0.3) continue;
            vary(dirtC, R, 0.04);   // (the random stream as before)
            // the rows across a station s: from oS (the road's edge, or under the kerb) to the gravel's solid edge, and to where it has faded out (alpha 1, 1, 0: 2 quads)
            const pts = (s, oS) => { const f = s / T.ds, k0 = Math.floor(f) % N, k1 = (k0 + 1) % N, t = f - Math.floor(f), WDs = WD[side > 0 ? 1 : 0], wdS = lerp(WDs[k0], WDs[k1], t), barS = lerp(bar[k0], bar[k1], t);
              const ex = atSf(s, side * w), sw = 0.3 + 0.9 * sstep(0.28, 0.72, 0.6 * eN1(ex[0], ex[1]) + 0.4 * eN2(ex[0], ex[1]) + 0.25 * (eN3(ex[0], ex[1]) - 0.5));
              const ro = sstep(wIn + 0.2, wIn + 3, wdS), o2 = Math.max(o1 + 0.12, Math.min(w + (wdS - wIn) + sw, barS - back)), rc = [0, 1, 2].map(n => lerp(GR[n], DI[n], ro)), mid = Math.max(oS + 0.06, o2 - 0.3);
              if (oS === o1) {   // (where no kerb covers it: the dirt reaches onto the asphalt softly and unevenly, from 6-36 cm inside the road's edge (alpha 0) to the edge itself (alpha 1:
                //  solid over the lawn from there, no green showing through); the rows on and at the asphalt 4 mm above it (0.02): over it at any depth precision, under the white line (0.036))
                const in0 = w - 0.06 - 0.3 * eN3(ex[0] * 2.1, ex[1] * 2.1), m2 = Math.max(w + 0.04, mid);
                const r = [in0, w, m2, Math.max(m2 + 0.04, o2 + 0.4)].map((o, n) => { const p = atSf(s, side * o), g = gmAt(p[0], p[1]), v = 0.92 + 0.16 * eN2(p[0] * 1.6, p[1] * 1.6);
                  return [[p[0], Math.max(n <= 1 ? 0.024 : 0.012, g.y + 0.01), p[1]], [rc[0] / MA[0] * v, rc[1] / MA[1] * v, rc[2] / MA[2] * v, [0, 1, 1, 0][n]]]; });
                r.reach = o2 + 0.4; return r; }
              const r = [oS, mid, Math.max(mid + 0.04, o2 + 0.4)].map((o, n) => { const p = atSf(s, side * o), g = gmAt(p[0], p[1]), v = (0.92 + 0.16 * eN2(p[0] * 1.6, p[1] * 1.6)) * (n === 0 ? 0.9 : 1);
                return [[p[0], Math.max(0.012, g.y + 0.01), p[1]], [rc[0] / MA[0] * v, rc[1] / MA[1] * v, rc[2] / MA[2] * v, [1, 1, 0][n]]]; });
              r.reach = o2 + 0.4; return r; };
            const under = (s0, s1) => { for (let k = Math.floor(s0 / T.ds) - 1; k <= Math.floor(s1 / T.ds) + 1; k++) if (!kerbOn(((k % N) + N) % N, side)) return false; return true; };   // (a kerb of full opacity (not its first or last 2 m) all along this metre)
            for (let h = 0; h < 2; h++) {
              const oS = under(q + h, q + h + 1) ? kOp : o1, A = pts(q + h, oS), Bc = pts(q + h + 1, oS);
              if (oS > o1 && Math.max(A.reach, Bc.reach) <= oS + 0.06) continue;   // (it all lies under the kerb: never seen)
              for (let n = 0; n < Math.min(A.length, Bc.length) - 1; n++) gT.quadUp(A[n][0], Bc[n][0], Bc[n + 1][0], A[n + 1][0], [A[n][1], Bc[n][1], Bc[n + 1][1], A[n + 1][1]], [uvq(A[n][0]), uvq(Bc[n][0]), uvq(Bc[n + 1][0]), uvq(A[n + 1][0])]); }
          }
          // (not written to the depth buffer and drawn before the kerb, which blends over it: at any depth precision (the post target's 16-bit depth) the kerb's cream and red are never overpainted, and its soft edge fades into the gravel, not the lawn;
          //  the polygon offset only has to win against the lawn under it)
          const m = new THREE.Mesh(gT.geometry(), new THREE.MeshLambertMaterial({ map: tex.makadam, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -4 })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.renderOrder = -1; m.name = 'shoulder'; root.add(m);
        } else {
          for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 2) {
            const i = T.idx(q), j = T.idx(q + 2), bar = side > 0 ? T.br : T.bl, o1 = w + 0.02, wd = WD ? WD[side > 0 ? 1 : 0][i] : (T.k[i] * side < 0 && Math.abs(T.k[i]) > 0.015) ? wOut : wIn, wdj = WD ? WD[side > 0 ? 1 : 0][j] : wd, o2i = Math.min(w + wd, bar[i] - back), o2j = Math.min(w + wdj, bar[j] - back);
            if (o2i <= o1 + 0.3) continue;
            const P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.012, T.pz[k] + T.nz[k] * o * side], col = vary(dirtC, R, 0.04);
            gs.quadUp(P(i, o1), P(j, o1), P(j, o2j), P(i, o2i), [col, col, col, col]);
          }
          const m = new THREE.Mesh(gs.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        }
      // ---- knockable straw-bale stacks (two bales with one on top) at the entry and exit of every corner, on the outside just in front of the barrier ----
      for (const c of T.corners) { const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1;
        for (const at of [c.i0 - 6, i1c + 6]) { const i = ((at % N) + N) % N, side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], [x, z] = atS(i * T.ds, side * (bar - 1.15));
          prop(ITA ? 'rbstack' : 'bstack', x, z, T.hd[i] + (R() - 0.5) * 0.12); R(); R(); } }   // (Toskana: round bales, as in the reference)
      // ---- pit lane (as in the reference): lane, apron, crews' boxes, garages (pitLaneScenery) ----
      if (foPit) pitLaneScenery({ R, scen, prop, excl: (x, z, r) => excl.push({ x, z, r }), root, out, ownTex });
      // ---- taller rock masses: a second layer of boulders on the bigger formations ----
      for (const [rx, rz, rr] of fd.rocks || []) { if (rr < 14) continue; for (let k = 0; k < 3; k++) { const a = R() * TAU, d = R() * rr * 0.4, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 3.5 + R() * rr * 0.25;
        if (clearance(x, z) > r + 4) { const g = scen.get(x, z), y0 = gH(x, z); rock(g, x, y0 + r * 1.1, z, r * 1.1, r * 0.8, r, R() * TAU, vary([0.58, 0.64, 0.54], R, 0.05), R, 0.2); } } }
      // ---- stone drainage channels curving through the grass inside the bigger corners ----
      if (FOR) { const gd = new GB();
        for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, span = (i1c - c.i0) * T.ds;
          for (let q = -span * 0.1; q < span * 1.1; q += 1.5) { const i = T.idx(c.i0 * T.ds + q), j = T.idx(c.i0 * T.ds + q + 1.5), bar = inner > 0 ? T.br : T.bl, o = inner * (bar[i] + 4.5), oj = inner * (bar[j] + 4.5);
            const a = [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o], b = [T.px[j] + T.nx[j] * oj, T.pz[j] + T.nz[j] * oj];
            if (clearance(a[0], a[1]) < 2 || excluded(a[0], a[1])) continue;
            const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, px2 = -dz / l * 0.55, pz2 = dx / l * 0.55, gc = vary([0.5, 0.54, 0.56], R, 0.05), dc = [0.27, 0.3, 0.36];   // grey stone channel, dark water line
            gd.quadUp([a[0] - px2 * 1.6, 0.02, a[1] - pz2 * 1.6], [b[0] - px2 * 1.6, 0.02, b[1] - pz2 * 1.6], [b[0] + px2 * 1.6, 0.02, b[1] + pz2 * 1.6], [a[0] + px2 * 1.6, 0.02, a[1] + pz2 * 1.6], [gc, gc, gc, gc]);
            gd.quadUp([a[0] - px2 * 0.6, 0.025, a[1] - pz2 * 0.6], [b[0] - px2 * 0.6, 0.025, b[1] - pz2 * 0.6], [b[0] + px2 * 0.6, 0.025, b[1] + pz2 * 0.6], [a[0] + px2 * 0.6, 0.025, a[1] + pz2 * 0.6], [dc, dc, dc, dc]); } }
        const m = new THREE.Mesh(gd.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- mowing stripes on the lawns beside the circuit ----
      if (!ITA) { const gm = new GB(), dk = [0.86, 0.86, 0.86];   // (Toskana: even lawns, as in the reference)
        for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 2) { const i = T.idx(q), j = T.idx(q + 2), bar = side > 0 ? T.br : T.bl;
          for (let band = 0; band < 4; band++) { const o1 = bar[i] + 2 + band * 6, o2 = o1 + 3, P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.008, T.pz[k] + T.nz[k] * o * side];
            const a = P(i, o1), b = P(j, o1), c = P(j, o2), d = P(i, o2); if (clearance(a[0], a[2]) < 1 || clearance(c[0], c[2]) < 1 || excluded(a[0], a[2]) || excluded(c[0], c[2]) || gH(a[0], a[2]) > 0.2) continue;
            gm.quadUp(a, b, c, d, [dk, dk, dk, dk], [[a[0] / 14, -a[2] / 14], [b[0] / 14, -b[2] / 14], [c[0] / 14, -c[2] / 14], [d[0] / 14, -d[2] / 14]]); } }
        const m = new THREE.Mesh(gm.geometry(), new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true, color: FOR ? new THREE.Color(0.77, 0.81, 1.41) : new THREE.Color(0.87, 0.93, 0.97) })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }   // darker bands of the same green as the lawn
      // ---- wooden posts with a sagging rope curving through the infield of the big corners (as in the reference) ----
      if (FOR) for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, s0c = c.i0 * T.ds, span = (i1c - c.i0) * T.ds; let prev = null;
        for (let q = -4; q <= span + 4; q += 3.2) { const i = T.idx(s0c + q), bar = inner > 0 ? T.br[i] : T.bl[i], o = inner * (bar + 2.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (clearance(x, z) < 1 || excluded(x, z)) { prev = null; continue; } const g = scen.get(x, z), wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];
          box(g, x, 0, z, 0.18, 1.1, 0.18, T.hd[i], wc, [0.52, 0.35, 0.22]);
          if (prev) { const Y = (t) => 0.95 - 0.28 * 4 * t * (1 - t), pts3 = [0, 1 / 3, 2 / 3, 1].map(t => [prev[0] + (x - prev[0]) * t, Y(t), prev[1] + (z - prev[1]) * t]);
            for (let k = 0; k < 3; k++) { const a1 = pts3[k], b1 = pts3[k + 1]; g.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [T.px[i], 0.5, T.pz[i]]); g.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [2 * x - T.px[i], 0.5, 2 * z - T.pz[i]]); } }
          prev = [x, z]; } }
      // ---- right leg (as in the reference): a long red/white kerb along the outside edge from the V hairpin up to the S ----
      if (FOR) { const gk = new GB(true), cw = T.curbW, wc = [1, 1, 1], P = (k, o, y) => [T.px[k] + T.nx[k] * o, y, T.pz[k] + T.nz[k] * o], sa = sAt(270, 274), sb = sAt(328, 150);
        for (let q = sa; q < sb; q += 2) { const i = T.idx(q), j = T.idx(q + 2); if (T.curb[i]) continue;
          const v0 = (q - sa) / 9, v1 = (q - sa + 2) / 9; gk.quadUp(P(i, w, 0.045), P(i, w + cw, 0.085), P(j, w + cw, 0.085), P(j, w, 0.045), [wc, wc, wc, wc], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
        const km = new THREE.Mesh(gk.geometry(), new THREE.MeshLambertMaterial({ map: tex.curbRWB, vertexColors: true })); km.receiveShadow = true; km.matrixAutoUpdate = false; root.add(km); }   // red / white / blue
      // ---- white edge lines along the asphalt wherever there is no kerb ----
      if (ITA) {   // Toskana: the same quads (one per 2 m step and side) widened by 9 cm either side, the line's worn, slightly wavy paint in a tile (edgeLinePaint): no new draw call, no new vertex
        const lw = 0.22, M = 0.09, PER = T.len / Math.max(1, Math.round(T.len / 32));
        const key = lw + ':' + M + ':' + PER; if (!edgeLineTile || edgeLineTile.key !== key) edgeLineTile = { key, data: edgeLinePaint(lw, M, PER) };   // (~80 ms on a desktop: made once, kept for the next build of the track)
        const tx = ownTex(new THREE.DataTexture(edgeLineTile.data, 64, 1024, THREE.RGBAFormat));   // (a DataTexture: a canvas premultiplies alpha and leaves dark fringes at the soft edges)
        tx.wrapS = THREE.ClampToEdgeWrapping; tx.wrapT = THREE.RepeatWrapping; tx.magFilter = THREE.LinearFilter; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.generateMipmaps = true; tx.anisotropy = 4; tx.needsUpdate = true;
        const o0 = w - 0.12 - lw - M, o1 = Math.min(w - 0.03, w - 0.12 + M), u1 = (o1 - o0) / (lw + 2 * M), gl = new GB(true), wc = [0.93, 0.92, 0.94];
        for (const side of [-1, 1]) for (let q = 0; q < T.len - 1; q += 2) { const i = T.idx(q), j = T.idx(q + 2); if (T.curb[i] && T.curb[j] && !(side * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035)) continue;
          const P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.036, T.pz[k] + T.nz[k] * o * side];
          const vi = i * T.ds / PER + (side > 0 ? 0 : 0.37), vj = vi + ((j - i + N) % N) * T.ds / PER;   // (v: the arc length, continuous round the lap; the left line 0.37 of a tile on, so the two sides differ)
          gl.quadUp(P(i, o0), P(j, o0), P(j, o1), P(i, o1), [wc, wc, wc, wc], [[0, vi], [0, vj], [u1, vj], [u1, vi]]); }
        const m = new THREE.Mesh(gl.geometry(), new THREE.MeshLambertMaterial({ map: tx, vertexColors: true, transparent: true, depthWrite: false })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.renderOrder = 0; m.name = 'edgeline'; root.add(m);   // (renderOrder 0: under the tyre marks (1), the rubber lies over the paint)
      } else
      { const gl = new GB(), wc = [0.93, 0.92, 0.94];
        for (const side of [-1, 1]) for (let q = 0; q < T.len - 1; q += 2) { const i = T.idx(q), j = T.idx(q + 2); if (T.curb[i] && T.curb[j] && (FOR || !(side * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035))) continue;   // (the newer circuits: also round the outside of a corner, where the kerb is left out) a solid line right at the edge of the asphalt, as in the reference
          const P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.036, T.pz[k] + T.nz[k] * o * side];
          gl.quadUp(P(i, w - 0.34), P(j, w - 0.34), P(j, w - 0.12), P(i, w - 0.12), [wc, wc, wc, wc]); }
        const m = new THREE.Mesh(gl.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- short walls of red/white tyres on the inside of the apex of the big corners ----
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, sm = ((c.i0 + i1c) / 2) * T.ds;
        const latAt = (s) => { const i = T.idx(s), bar = inner > 0 ? T.br[i] : T.bl[i]; return inner * Math.min(bar - 0.55, w + 3.5); }, sk = [sm];
        if (!FOR) for (const dir of [-1, 1]) { let s = sm; for (let n = 0; n < 4; n++) { let st = 0.92; for (let it = 0; it < 3; it++) { const p = atSf(s, latAt(s)), q = atSf(s + dir * st, latAt(s + dir * st)), dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd > 1e-3) st *= 0.92 / dd; } s += dir * st; if (dir < 0) sk.unshift(s); else sk.push(s); } }   // (the newer circuits: 9 separate stacks 0.92 m apart at the wall itself)
        for (let k = -4; k <= 4; k++) { const sq = FOR ? sm + k * 0.99 : sk[k + 4], i = T.idx(sq), bar = inner > 0 ? T.br[i] : T.bl[i], o = inner * Math.min(bar - 0.55, w + 3.5), [x, z] = FOR ? [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o] : atSf(sq, o);
          if (clearance(x, z) < -bar + w + 2) continue;
          prop('tstack', x, z, T.hd[i] + k * 0.7, KMP ? 3 : ((k + 6) >> 1) % 2 ? (ITA ? 4 : 1) : ITA ? 2 : 0); }   // knockable spare-tyre stacks, red and white in pairs (Toskana green and cream, Gromski rt black)
        if (c.sev === 2) { const i = T.idx(sm + 6), [x, z] = atS(i * T.ds, inner * (w + T.curbW + 1.4)); if (clearance(x, z) < -1.2) prop('crate', x, z, R() * TAU); } }   // a wooden crate by the apex
      // ---- cliffs: big stacked boulders with firs on top at the formations right beside the circuit ----
      for (const [rx, rz, rr] of fd.rocks || []) { if (rr > 12) continue;
        for (let k = 0; k < 5; k++) { const a = R() * TAU, d = R() * rr * 0.5, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 3 + R() * 3.5;
          if (clearance(x, z) < r + 3) continue; const g = scen.get(x, z), y0 = gH(x, z); rock(g, x, y0 + r * 0.8 + (k > 2 ? r * 0.9 : 0), z, r * 1.1, r * (1.0 + R() * 0.3), r, R() * TAU, vary([0.58, 0.64, 0.54], R, 0.05), R, 0.2); }
        for (let k = 0; k < 2; k++) { const a = R() * TAU, x = rx + Math.cos(a) * rr * 0.3, z = rz + Math.sin(a) * rr * 0.3; if (clearance(x, z) > 7) fir(x, z, 7 + R() * 5); } }
      // ---- red/white striped marker pylons on the apex of the hairpins ----
      for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, i = T.idx(((c.i0 + i1c) / 2) * T.ds), o = c.dir * (w + T.curbW + 0.55), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        prop('pylon', x, z, 0); }   // knockable
      // ---- the newer circuits: tyre stacks and cones across the short cut of every chicane (a run of corners turning alternately left and right
      //      close together): wherever a straight line from the road before the chicane to the road after it leaves the asphalt, so a car
      //      that drives straight on instead of round the chicane smashes into them ----
      if (!FOR) { const cs = T.corners, nC = cs.length, done = new Set(), put = [];
        const gap = (a, b) => ((((b.i0 - a.i1) % N) + N) % N) * T.ds;
        for (let a = 0; a < nC; a++) { if (done.has(a)) continue; let b = a;
          while (b - a < nC - 1 && cs[(b + 1) % nC].dir === -cs[b % nC].dir && gap(cs[b % nC], cs[(b + 1) % nC]) < 26) b++;
          if (b === a) continue; for (let k = a; k <= b; k++) done.add(k % nC);
          const c0 = cs[a], c1 = cs[b % nC], i0 = c0.i1 - Math.min((((c0.i1 - c0.i0) % N) + N) % N, 18), sA = i0 * T.ds - 6, span = (((c1.i1 - i0) % N) + N) % N * T.ds + 12, sB = sA + span;   // (from at most 36 m before the end of the first corner)
          const inSpan = (i) => { const d = (((i * T.ds - sA) % T.len) + T.len) % T.len; return d > 2 && d < span - 2; };
          for (const oa of [-0.6, 0, 0.6]) for (const ob of [-0.6, 0, 0.6]) { const A = atSf(sA, oa * w), B = atSf(sB, ob * w), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
            for (let t = 0; t <= L; t += 1.1) { const x = A[0] + (B[0] - A[0]) * t / L, z = A[1] + (B[1] - A[1]) * t / L, n = nearest(x, z), d = Math.abs(n.lat);
              if (n.i < 0 || !inSpan(n.i) || d < w + T.curbW + 0.5 || d > n.bar - 0.7) continue;
              if (put.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < 2.1 * 2.1) || out.props.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < 1.6 * 1.6)) continue;   // (clear of the apex walls, pylons and cones)
              put.push([x, z, d, n.i, Math.sign(n.lat), a]); } } }
        const far = {}; for (const p of put) { const key = p[5] + ':' + p[4]; if (!far[key] || p[2] > far[key][2]) far[key] = p; }   // the deepest spot of the cut on either side: a stack of straw bales, as in the reference
        const bales = Object.values(far).filter(p => p[2] > w + T.curbW + 3 && !out.props.some(q => (q.x - p[0]) ** 2 + (q.z - p[1]) ** 2 < 2.4 * 2.4));
        for (const p of put) { const [x, z, d, i] = p, k = rpHash(i, Math.round(x * 7 + z * 13)), yaw = T.hd[i] + k * 1.2;
          if (bales.includes(p)) prop(ITA ? 'rbstack' : 'bstack', x, z, T.hd[i]);
          else if (bales.some(b => (b[0] - x) ** 2 + (b[1] - z) ** 2 < 2.6 * 2.6)) continue;   // (room for the bales)
          else if (d < w + T.curbW + 2.2) prop('cone', x, z, yaw); else prop('tstack', x, z, yaw, KMP ? 3 : k < 0.5 ? (ITA ? 4 : 1) : ITA ? 2 : 0); } }
      // ---- little ferns and star-shaped plants dotted over the grass near the circuit ----
      { const fern = (g, x, z, sz) => { const y = gH(x, z) + 0.02, n = 5, a0 = R() * TAU, col = vary([0.27, 0.47, 0.25], R, 0.1);
          for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, ex = x + Math.cos(a) * sz, ez = z + Math.sin(a) * sz, px2 = -Math.sin(a) * sz * 0.28, pz2 = Math.cos(a) * sz * 0.28;
            g.triO([x + px2, y, z + pz2], [ex, y + sz * 0.45, ez], [x - px2, y, z - pz2], col, [x, y - 1, z]); } };
        for (let k = 0; k < 420; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.5 + R() * 16), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (clearance(x, z) < 1 || excluded(x, z)) continue; fern(scen.get(x, z), x, z, 0.5 + R() * 0.5); } }
      // ---- the newer circuits: a dashed white centre line through the corners (as in both reference races) ----
      if (!FOR) { const gd = new GB(), wc = [0.93, 0.93, 0.9];
        for (let s0 = 0; s0 < T.len - 3; s0 += 6) { let km = 0; for (let d = -6; d <= 9; d += 3) km = Math.max(km, Math.abs(T.k[T.idx(s0 + d)])); if (km < 0.012) continue;
          let dS = Math.abs(s0 - T.startS); dS = Math.min(dS, T.len - dS); if (dS < 8) continue;
          const a = atSf(s0, -0.13), b = atSf(s0, 0.13), c = atSf(s0 + 3, 0.13), d = atSf(s0 + 3, -0.13);
          gd.quadUp([a[0], HY(a) + 0.036, a[1]], [b[0], HY(b) + 0.036, b[1]], [c[0], HY(c) + 0.036, c[1]], [d[0], HY(d) + 0.036, d[1]], [wc, wc, wc, wc]); }
        const m = new THREE.Mesh(gd.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- Toskana: farmhouses (ochre walls, terracotta tile roofs, white-framed windows, a chimney) and rows of cypresses along the lanes ----
      if (ITA) {
        for (const [hx, hz, rot, L, D, H] of fd.houses || []) { const g = scen.get(hx, hz), y0 = gH(hx, hz) - 0.2, wall = vary([0.88, 0.68, 0.47], R, 0.06), roof = vary([0.74, 0.5, 0.33], R, 0.05);
          const c = Math.cos(rot), sn = Math.sin(rot), Pl = (lx, lz) => [hx + lx * c - lz * sn, hz + lx * sn + lz * c];
          box(g, hx, y0, hz, L, H, D, rot, wall, wall);
          gable(g, hx, y0 + H, hz, L + 0.9, D + 1.1, D * 0.34, rot, roof, wall);
          { const RL = L + 0.9, RD = D + 1.1, rh = D * 0.34, yb = y0 + H, dk = roof.map(v => v * 0.68), n = 6, P3 = (lx, ly, lz) => [hx + lx * c - lz * sn, ly, hz + lx * sn + lz * c];   // rows of tiles: darker courses along each slope
            for (const sd of [-1, 1]) for (let k = 1; k <= n; k++) { const f = k / (n + 1), f2 = f + 0.035, z1 = sd * RD / 2 * (1 - f), z2 = sd * RD / 2 * (1 - f2), y1 = yb + rh * f + 0.02, y2 = yb + rh * f2 + 0.02;
              g.quadO(P3(-RL / 2, y1, z1), P3(RL / 2, y1, z1), P3(RL / 2, y2, z2), P3(-RL / 2, y2, z2), dk, [hx, yb, hz]); } }
          for (const lz of [-D / 2 - 0.03, D / 2 + 0.03]) for (let wx = -L / 2 + 1.6; wx <= L / 2 - 1.5; wx += 2.6) for (const wy of H > 5 ? [1.2, 4.0] : [1.3]) {   // windows: a white frame round a dark pane
            const [x, z] = Pl(wx, lz); box(g, x, y0 + wy, z, 0.95, 1.2, 0.08, rot, [0.93, 0.91, 0.86]); const [x2, z2] = Pl(wx, lz + Math.sign(lz) * 0.03); box(g, x2, y0 + wy + 0.12, z2, 0.7, 0.95, 0.06, rot, [0.26, 0.24, 0.26]); }
          { const [x, z] = Pl(-L / 2 - 0.03, 0); box(g, x, y0, z, 0.08, 2.1, 1.1, rot, [0.42, 0.27, 0.17]); }   // a wooden door on the gable end
          { const [x, z] = Pl(L * 0.28, D * 0.12); box(g, x, y0 + H, z, 0.7, D * 0.34 + 1.2, 0.7, rot, wall, [0.6, 0.3, 0.18]); }   // chimney
          excl.push({ x: hx, z: hz, r: Math.hypot(L, D) / 2 + 3 }); CR.block(hx, hz, L + 2, D + 2, rot); }
        for (const [x0, z0, x1, z1, sp] of fd.cypress || []) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / (sp || 7)));
          for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n + (R() - 0.5) * 0.8, z = z0 + (z1 - z0) * k / n + (R() - 0.5) * 0.8;
            if (clearance(x, z) < 3.5 || excluded(x, z)) continue; cypress(x, z, 12 + R() * 5); excl.push({ x, z, r: 2.2 }); } }
        // the start gantry of the reference: two slim steel lattice towers and a lattice truss across the straight, the start lights under it
        { const [x, z, , i] = atS(sStart + 3, 0), nx = T.nx[i], nz = T.nz[i], tx = T.tx[i], tz = T.tz[i], g = scen.get(x, z), steel = [0.6, 0.62, 0.66], H = 8.4, y0 = HYi(i);
          const beam = (p0, p1, bw) => { const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, t = d.map(v => v / L), q = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            let u = [t[1] * q[2] - t[2] * q[1], t[2] * q[0] - t[0] * q[2], t[0] * q[1] - t[1] * q[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / ul);
            const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]], h = bw / 2, mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2];
            const C = (p, s1, s2) => [p[0] + (u[0] * s1 + v[0] * s2) * h, p[1] + (u[1] * s1 + v[1] * s2) * h, p[2] + (u[2] * s1 + v[2] * s2) * h];
            for (const [a0, b0, a1, b1] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) g.quadO(C(p0, a0, b0), C(p0, a1, b1), C(p1, a1, b1), C(p1, a0, b0), steel, mid); };
          const Pt = (lat, along, y) => [x + nx * lat + tx * along, y0 + y, z + nz * lat + tz * along];
          const span = Math.max(T.bl[i], T.br[i]) + 1.4;
          for (const sd of [-1, 1]) { const c = sd * span;   // a tower: four posts round a 0.9 m square, zig-zag braces on every face
            for (const [a, b] of [[-0.45, -0.45], [-0.45, 0.45], [0.45, -0.45], [0.45, 0.45]]) beam(Pt(c + a, b, 0), Pt(c + a, b, H), 0.13);
            for (let k = 0, y = 0; y < H - 0.1; k++, y += 1.4) { const y1 = Math.min(H, y + 1.4);
              for (const b of [-0.45, 0.45]) beam(Pt(c + (k % 2 ? -0.45 : 0.45), b, y), Pt(c + (k % 2 ? 0.45 : -0.45), b, y1), 0.07);
              for (const a of [-0.45, 0.45]) beam(Pt(c + a, k % 2 ? -0.45 : 0.45, y), Pt(c + a, k % 2 ? 0.45 : -0.45, y1), 0.07); }
            CR.avoid(x + nx * c, z + nz * c, 1.3); }
          for (const [dy, b] of [[0, -0.45], [0, 0.45], [-1.1, -0.45], [-1.1, 0.45]]) beam(Pt(-span, b, H + dy), Pt(span, b, H + dy), 0.12);   // the truss: four chords
          for (let k = 0, l = -span; l < span - 0.1; k++, l += 1.4) { const l1 = Math.min(span, l + 1.4);   // ... braced on every face
            for (const b of [-0.45, 0.45]) beam(Pt(k % 2 ? l : l1, b, H - 1.1), Pt(k % 2 ? l1 : l, b, H), 0.07);
            for (const dy of [0, -1.1]) beam(Pt(l, k % 2 ? -0.45 : 0.45, H + dy), Pt(l1, k % 2 ? 0.45 : -0.45, H + dy), 0.07); }
          box(g, x - tx * 0.62, y0 + H - 2.2, z - tz * 0.62, 0.3, 1.0, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // the light panel across the road, facing the grid
          const lights = [], lg = new THREE.BoxGeometry(0.3, 0.6, 0.6);   // (thin along the road: the lamps' faces look at the grid)
          for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 }));
            m.position.set(x + nx * o - tx * 0.82, y0 + H - 1.7, z + nz * o - tz * 0.82); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
          out.dyn.lights = lights; }
      }
      // ---- Gromski rt: the campsite (vans, caravans, tents, gazebos, cars) and the GORIVO feather flags along the start straight ----
      if (KMP) {
        const VAN = [[0.84, 0.2, 0.17], [0.23, 0.58, 0.6], [0.93, 0.62, 0.2], [0.3, 0.46, 0.72], [0.47, 0.62, 0.36], [0.2, 0.2, 0.23]], TENT = [[0.93, 0.55, 0.16], [0.28, 0.55, 0.3], [0.24, 0.45, 0.76], [0.9, 0.8, 0.24], [0.82, 0.26, 0.2]];
        const CARC = [[0.8, 0.1, 0.1], [0.1, 0.3, 0.8], [0.9, 0.9, 0.9], [0.15, 0.15, 0.17], [0.9, 0.75, 0.1], [0.2, 0.6, 0.3]], wht = [0.95, 0.94, 0.9], dark = [0.18, 0.2, 0.24];
        const van = (g, x, y, z, rot) => { const c1 = VAN[Math.floor(R() * VAN.length)], c = Math.cos(rot), sn = Math.sin(rot);   // a split-screen camper: coloured lower half, white top, a window band, sometimes a pop-top or a roof rack
          box(g, x, y + 0.3, z, 4.4, 0.95, 1.9, rot, c1, c1); box(g, x, y + 1.25, z, 4.4, 0.85, 1.9, rot, wht, wht);
          for (const lz of [-0.97, 0.97]) box(g, x - sn * lz, y + 1.38, z + c * lz, 3.6, 0.5, 0.04, rot, dark);
          box(g, x + c * 2.21, y + 1.38, z + sn * 2.21, 0.04, 0.5, 1.6, rot, dark);
          for (const lx of [-1.45, 1.45]) for (const lz of [-0.9, 0.9]) box(g, x + c * lx - sn * lz, y, z + sn * lx + c * lz, 0.62, 0.62, 0.22, rot, [0.1, 0.1, 0.11]);
          const q = R(); if (q < 0.3) box(g, x - c * 0.4, y + 2.1, z - sn * 0.4, 2.6, 0.45, 1.7, rot, wht, c1); else if (q < 0.6) box(g, x, y + 2.12, z, 2.8, 0.14, 1.5, rot, [0.25, 0.25, 0.27], [0.5, 0.36, 0.22]); };
        const caravan = (g, x, y, z, rot) => { const c1 = R() < 0.5 ? [0.55, 0.36, 0.22] : [0.3, 0.46, 0.72], c = Math.cos(rot), sn = Math.sin(rot), body = [0.93, 0.91, 0.84];
          box(g, x, y + 0.35, z, 5.2, 2.1, 2.2, rot, body, [0.88, 0.86, 0.8]); box(g, x, y + 0.9, z, 5.22, 0.22, 2.22, rot, c1);
          for (const lz of [-1.12, 1.12]) box(g, x - sn * lz, y + 1.5, z + c * lz, 3.4, 0.55, 0.04, rot, dark);
          for (const lz of [-1.0, 1.0]) box(g, x - sn * lz, y, z + c * lz, 0.62, 0.62, 0.22, rot, [0.1, 0.1, 0.11]);
          box(g, x + c * 3.2, y + 0.2, z + sn * 3.2, 1.3, 0.12, 0.2, rot, [0.3, 0.3, 0.32]); };
        const tent = (g, x, y, z, rot) => { const col = TENT[Math.floor(R() * TENT.length)], L = 2.2 + R() * 0.8; gable(g, x, y, z, L, 1.9, 1.25, rot, col, col.map(v => v * 0.85)); };
        const gazebo = (g, x, y, z, rot) => { const col = TENT[Math.floor(R() * TENT.length)], c = Math.cos(rot), sn = Math.sin(rot);
          for (const lx of [-1.4, 1.4]) for (const lz of [-1.4, 1.4]) box(g, x + c * lx - sn * lz, y, z + sn * lx + c * lz, 0.08, 2.3, 0.08, rot, [0.85, 0.85, 0.87]);
          box(g, x, y + 2.25, z, 3.0, 0.28, 3.0, rot, col); cone(g, x, y + 2.53, z, 2.1, 0.75, 4, col, col.map(v => Math.min(1, v * 1.12)), rot + Math.PI / 4);
          box(g, x + c * 0.3, y, z + sn * 0.3, 1.6, 0.75, 0.8, rot, [0.9, 0.9, 0.9]); };
        const car = (g, x, y, z, rot) => { const cc = CARC[Math.floor(R() * CARC.length)]; box(g, x, y + 0.2, z, 4.1, 0.75, 1.75, rot, cc); box(g, x, y + 0.95, z, 2.1, 0.55, 1.5, rot, dark, cc); };
        const SH = [[0.84, 0.2, 0.18], [0.24, 0.4, 0.72], [0.95, 0.94, 0.9], [0.22, 0.22, 0.25], [0.92, 0.72, 0.2], [0.3, 0.56, 0.34], [0.95, 0.5, 0.16], [0.6, 0.3, 0.6]];
        for (const [cx, cz, W, D, rot] of fd.camp || []) { const c = Math.cos(rot), sn = Math.sin(rot);
          for (let u = -W / 2 + 6; u <= W / 2 - 5; u += 11) for (let v = -D / 2 + 5; v <= D / 2 - 4; v += 10) {   // a pitch every 11 x 10 m: a van, a caravan or a car, often a tent or a gazebo beside it
            const x = cx + (u + (R() - 0.5) * 3.5) * c - (v + (R() - 0.5) * 3) * sn, z = cz + (u + (R() - 0.5) * 3.5) * sn + (v + (R() - 0.5) * 3) * c, q = R(), r2 = rot + (R() - 0.5) * 1.4 + (R() < 0.5 ? 0 : Math.PI);
            if (q > 0.93 || clearance(x, z) < 6 || excluded(x, z)) continue;   // (a few pitches stay empty)
            const g = scen.get(x, z), y = gH(x, z);
            if (q < 0.42) van(g, x, y, z, r2); else if (q < 0.66) caravan(g, x, y, z, r2); else if (q < 0.8) car(g, x, y, z, r2); else tent(g, x, y, z, r2);
            CR.block(x, z, 5.6, 3.2, r2);
            const e = R(), ex = x - Math.sin(r2) * 3.6, ez = z + Math.cos(r2) * 3.6;   // the pitch's awning side
            if (e < 0.55 && clearance(ex, ez) > 6) { const g2 = scen.get(ex, ez); if (e < 0.3) tent(g2, ex, gH(ex, ez), ez, r2 + (R() - 0.5) * 0.8); else gazebo(g2, ex, gH(ex, ez), ez, r2); CR.block(ex, ez, 3.2, 3.2, r2); } }
          exclRect.push({ x: cx, z: cz, hx: W / 2, hz: D / 2, rot });   // no trees on the campsite
          for (let k = 0; k < W * D / 45; k++) {   // campers milling about between the pitches
            const u = (R() - 0.5) * (W - 4), v = (R() - 0.5) * (D - 4), x = cx + u * c - v * sn, z = cz + u * sn + v * c, a = R() * TAU;
            if (clearance(x, z) < 3) continue; crowdPut(CR, x, gH(x, z), z, Math.cos(a), Math.sin(a), { col: SH[Math.floor(R() * SH.length)] }, 0); } }
        if (fd.flags) { const gf = new GB(true), gp = new GB();
          for (const [a, b, side, sp] of fd.flags) for (let q = a; q <= b; q += sp || 9) {   // tall feather flags on bent poles, just behind the barrier
            const i = T.idx(T.startS + q), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, tx = T.tx[i], tz = T.tz[i];
            cyl(gp, x, 0, z, 0.05, 4.9, 5, [0.85, 0.86, 0.88]);
            const P = (u, y) => { const bend = 0.18 * (u / 1.2) * (y - 0.7) / 4; return [x + tx * u - side * T.nx[i] * bend, y, z + tz * u - side * T.nz[i] * bend]; };
            for (let k = 0; k < 4; k++) { const y0 = 0.7 + k, y1 = y0 + 1, w1 = k === 3 ? 0.7 : 1.2;   // (the top of the banner rounds off towards the pole)
              gf.quadO(P(0, y0), P(1.2, y0), P(w1, y1), P(0, y1), [1, 1, 1], [x - side * T.nx[i] * 3, y0 + 0.5, z - side * T.nz[i] * 3], [[0, k / 4], [1, k / 4], [w1 / 1.2, (k + 1) / 4], [0, (k + 1) / 4]]); }
            excl.push({ x, z, r: 1.2 }); }
          const mf = new THREE.Mesh(gf.geometry(), new THREE.MeshLambertMaterial({ map: tex.flagKP, color: 0xffe8b0, emissive: 0x6a5c3a, emissiveMap: tex.flagKP, side: THREE.DoubleSide })); mf.castShadow = true; mf.receiveShadow = true; root.add(mf);   // (thin fabric: the sun shines through it)
          const mp = new THREE.Mesh(gp.geometry(), matV); mp.castShadow = true; root.add(mp); }
      }
      // ---- spectators (muted clothes, as in the reference): on the raised lawn above the V hairpin (inside its rope fence), round the hairpins,
      //      through the S bends; behind tyre walls the front row stands behind the catch fence ----
      { const M = { shirts: SHIRTS, sit: 0.2 };
        if (PL) { const plEx = (x, z) => { if (!inPoly(PL.pts, x, z)) return true; const d = polyDist(PL.pts, x, z); return d < 2.2 || (d >= 3.2 && excluded(x, z)); };   // (the edge rule in exclF keeps generic scenery 3.2 m off the edge)
          const po = fd.plateau.off; crRun(fd.plateau.s0 + 4, fd.plateau.s1 - 4, -1, Object.assign({}, M, { first: po + 2.3, rows: 3, gap: 1.0, dens: 0.62, gH: (x, z) => PL.h, excluded: plEx, above: 4, maxSlope: 9, label: 'plateau' }));
          crRun(100, 168, -1, Object.assign({}, M, { first: po + 5.3, rows: 2, gap: 1.0, dens: 0.6, gH: (x, z) => PL.h, excluded: plEx, above: 4, maxSlope: 9, label: 'plateau V' })); }
        for (const [a, b2, sd, rw, dn] of FOR ? [[460, 610, 1, 3, 0.7], [470, 600, -1, 2, 0.55], [756, 850, -1, 3, 0.75], [764, 846, 1, 2, 0.6], [1026, 1114, 1, 3, 0.7], [1030, 1110, -1, 2, 0.6],
          [1224, 1296, 1, 3, 0.72], [1228, 1292, -1, 2, 0.6], [612, 750, -1, 2, 0.5], [612, 750, 1, 2, 0.5], [362, 420, 1, 2, 0.5], [362, 420, -1, 2, 0.5], [1300, 1352, -1, 2, 0.55], [1300, 1352, 1, 2, 0.5], [900, 1000, -1, 2, 0.4]] : fd.crowd || [])
          crRun(a, b2, sd, Object.assign({ rows: rw, dens: dn, label: 'FO ' + a + (sd > 0 ? 'R' : 'L') }, M)); }
      // ---- the fir forest: dense everywhere except a mown verge along the circuit ----
      const step = 5.2 / Math.sqrt(dens);
      if (FOR) for (let z = B.minZ - 60; z < B.maxZ + 60; z += step) for (let x = B.minX - 60; x < B.maxX + 60; x += step) {
        const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9, c = clearance(px, pz);
        const fN = forestN(px, pz), lawn = 5 + 11 * (1 - sstep(0.35, 0.6, fN));   // the firs come close to the fences in places, as in the reference
        if (c < lawn || c > LOD.cap(190) || excluded(px, pz)) continue;   // (LOD: cut the far forest on the lower tiers; VISOKA keeps it all)
        let p = 0.45 + 0.5 * sstep(0.35, 0.6, fN); if (c > 30) p = Math.max(p, 0.85); if (c < lawn + 6) p *= 0.6;
        if (R() > p * LOD.dens) continue;   // (LOD: thin the fir forest on the lower tiers)
        if (R() < 0.08 && c < 30) { const g = scen.get(px, pz); ico(g, px, gH(px, pz) + 2.2, pz, 2.2 + R(), 0.9, vary([0.24, 0.46, 0.2], R, 0.15), R, 0.3); }   // occasional round bush/tree
        else fir(px, pz, 10 + R() * 9);
      }
      // Toskana: open lawns round the circuit, groves of round trees and cypresses farther out; Gromski rt: a pine wood with broadleaf trees mixed in
      if (!FOR) { const st = (ITA ? 6.4 : 5.4) / Math.sqrt(dens);
        for (let z = B.minZ - 60; z < B.maxZ + 60; z += st) for (let x = B.minX - 60; x < B.maxX + 60; x += st) {
          const px = x + (R() - 0.5) * st * 0.9, pz = z + (R() - 0.5) * st * 0.9, c = clearance(px, pz), fN = forestN(px, pz), lawn = (ITA ? 8 : 6) + 10 * (1 - sstep(0.35, 0.6, fN));
          if (c < lawn || c > LOD.cap(190) || excluded(px, pz)) continue;   // (LOD: cut the far forest on the lower tiers; VISOKA keeps it all)
          let p = ITA ? 0.03 + 0.8 * sstep(0.46, 0.66, fN) : 0.42 + 0.5 * sstep(0.35, 0.6, fN); if (c > 45) p = Math.max(p, ITA ? 0.16 : 0.82); if (c < lawn + 6) p *= 0.6;   // (Toskana: groves on open lawns)
          if (R() > p * LOD.dens) continue;   // (LOD: thin the groves on the lower tiers)
          if (ITA) { const u = R(); if (u < 0.13) cypress(px, pz, 11 + R() * 6); else if (u < 0.3) puffPine(px, pz, 10 + R() * 6); else leafy(px, pz, 8 + R() * 5); }
          else if (c > 70 || R() < 0.5) fir(px, pz, 10 + R() * 8 + 7 * sstep(0.5, 0.72, fN)); else leafy(px, pz, 8.5 + R() * 5);   // (far off, where they are small on screen: the cheap far firs; the pines tallest in the thick of the wood)
        } }
      out.firCount = firCount + ' far ' + firFar + ' leafy ' + leafCount + (FOR ? '' : ' near ' + leafNear);
      // low bushes on the verges
      for (let k = 0; k < 160; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2 + R() * 4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (clearance(x, z) > 1.5 && !excluded(x, z)) ico(scen.get(x, z), x, gH(x, z) + 0.5, z, 0.7 + R() * 0.6, 0.75, vary([0.2, 0.42, 0.2], R, 0.15), R, 0.3); }
    }

    /* ================= KNOCKABLE PROPS on the other circuits: marker pylons, cones, spare tyres, straw bales ================= */
    if (THEME === 'lake' || THEME === 'city' || THEME === 'mountain') {
      const prop = (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 });
      const cw = T.curbW || 1.5;
      for (const c of T.corners) { if (c.sev < 2) continue;
        const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, sm = ((c.i0 + i1c) / 2) * T.ds, im = T.idx(sm), barIn = inner > 0 ? T.br[im] : T.bl[im], barOut = inner > 0 ? T.bl[im] : T.br[im];
        if (THEME === 'mountain') {   // rally stage: two straw-bale stacks on the inside of the apex, a cone at either end
          for (const ds of [-2.4, 2.4]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 1.2, w + 1.9)); prop('bstack', x, z, hd); }
          for (const ds of [-9, 9]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 0.6, w + 0.8)); prop('cone', x, z, hd); }
          continue; }
        if (barIn > w + cw + 1.7) { const [x, z] = atSf(sm, inner * (w + cw + 1.05)); prop('pylon', x, z, 0); }   // striped marker post just behind the kerb at the apex
        if (c.sev >= 3) { let za = null, zb = null;                                                              // cones on the asphalt through the hairpin apex, off the racing line
          for (let k = c.i0 - 4; k <= i1c + 4; k++) { const ii = ((k % N) + N) % N; if (T.rl[ii] * inner >= w - 2.8) { if (za == null) za = k; zb = k; } }
          if (za != null && zb > za) { const s0 = za * T.ds, s1 = zb * T.ds, n = clamp(Math.floor((s1 - s0) / 4) + 1, 2, 4), st = (s1 - s0) / (n - 1);
            for (let q = 0; q < n; q++) { const [x, z, hd] = atSf(s0 + q * st, inner * (w - 1.4)); prop('cone', x, z, hd); } } }
        if (barOut > w + cw + 3) for (let k = 0; k < 4; k++) { const [x, z, hd] = atSf(sm + 10 + k * 1.0, -inner * (barOut - 0.6)); prop('tstack', x, z, hd + k * 0.6, (k >> 1) % 2); }   // spare tyres in front of the outer barrier
      }
    }
    trackPropsGeneric(out, excluded, MC_ISLAND);   // + safety-tyre walls and roadside posts on every circuit (see roadsideProps)
    // solid scenery built inside a barrier line (box footprint lx by lz at x, z, rot): the knocked props stop at its face, not in it
    // (out.propFloor.inset[i * 2 + side (0 left, 1 right)]: how far in from the barrier, per sample; Core propStep)
    const propSolid = (x, z, lx, lz, rot) => { const F = out.propFloor; if (!F) return;
      const I = F.inset || (F.inset = new Float32Array(T.N * 2)), c = Math.cos(rot), sn = Math.sin(rot), nu = Math.ceil(lx / 0.25), nv = Math.ceil(lz / 0.25), q = {};
      T.query(x, z, -1, q); const h = q.i; if (Math.abs(q.d) - Math.hypot(lx, lz) / 2 > Math.max(q.bl, q.br)) return;   // (nowhere near the barrier)
      for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) { const u = (a / nu - 0.5) * lx, v = (b / nv - 0.5) * lz;
        T.query(x + u * c - v * sn, z + u * sn + v * c, h, q); const d = Math.abs(q.d), bar = q.d > 0 ? q.br : q.bl, k = q.i * 2 + (q.d > 0 ? 1 : 0);
        if (d > T.w && d < bar) I[k] = Math.max(I[k], bar - d); } };

    /* ================= MONACO (real circuit layout; origin Sainte-Dévote, x east, z south) ================= */
    if (THEME === 'monaco') {
      const gH = groundH, fac = new GB(true), facB = new GB(true), tun = new GB();
      const sF = (f) => ((T.startS + f * T.len) % T.len + T.len) % T.len;   // track distance at a lap fraction measured from the start line
      const cream = [0.95, 0.9, 0.78], white = [0.96, 0.95, 0.92], copper = [0.42, 0.66, 0.56], tile = [0.72, 0.36, 0.22], red = [0.81, 0.07, 0.15];
      const facadeBox = (x, z, W, D, H, rot, col, y0in, bal) => {   // walls with the window/shutter (or balcony) texture; returns base height
        const cr = Math.cos(rot), sr = Math.sin(rot), P = (u, v, y) => [x + u * cr - v * sr, y, z + u * sr + v * cr];
        const cs = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], floors = Math.max(1, Math.round(H / 3.1)), y0 = y0in != null ? y0in : gH(x, z) - 0.3;
        for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(2, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.3)); (bal ? facB : fac).quadO(P(u0, v0, y0), P(u1, v1, y0), P(u1, v1, y0 + H), P(u0, v0, y0 + H), col, [x, y0 + H / 2, z], [[0, 0], [bays, 0], [bays, floors], [0, floors]]); }
        return y0;
      };
      const tri2 = (g, a, b, c, col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]; g.triO(a, b, c, col, [m[0] - nx / l, m[1] - ny / l, m[2] - nz / l]); g.triO(a, c, b, col, [m[0] + nx / l, m[1] + ny / l, m[2] + nz / l]); };
      const palm = (x, z, h) => { if (nearStand(x, z, 3)) return; const g = scen.get(x, z), y = gH(x, z), la = R() * TAU, tx = x + Math.cos(la) * 0.6, tz = z + Math.sin(la) * 0.6;
        cyl(g, x, y, z, 0.3, h * 0.6, 6, [0.52, 0.4, 0.26], null, 0.26); cyl(g, (x + tx) / 2, y + h * 0.6, (z + tz) / 2, 0.26, h * 0.4, 6, [0.56, 0.44, 0.28], null, 0.2);
        const top = [tx, y + h, tz], below = [tx, y + h - 4, tz], n = 9, a0 = R() * TAU;
        for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, L = 3.4 + R(), dr = 1.2 + R() * 0.8, w = 0.5, mid = [tx + Math.cos(a) * L * 0.55, y + h + 0.3, tz + Math.sin(a) * L * 0.55], tip = [tx + Math.cos(a) * L, y + h - dr, tz + Math.sin(a) * L];
          const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w], col = k % 2 ? [0.25, 0.5, 0.2] : [0.33, 0.6, 0.24];
          g.triO(top, pl, mid, col, below); g.triO(top, mid, pr, col, below); g.triO(pl, tip, mid, col, below); g.triO(mid, tip, pr, col, below); }
        excl.push({ x, z, r: 3 }); };
      const flag = (x, z, h) => { const g = scen.get(x, z), y = gH(x, z); cyl(g, x, y, z, 0.07, h, 5, [0.85, 0.85, 0.88]);
        tri2(g, [x, y + h - 0.2, z], [x + 2.2, y + h - 0.2, z + 0.3], [x + 2.2, y + h - 0.9, z + 0.3], red); tri2(g, [x, y + h - 0.2, z], [x + 2.2, y + h - 0.9, z + 0.3], [x, y + h - 0.9, z], red);
        tri2(g, [x, y + h - 0.9, z], [x + 2.2, y + h - 0.9, z + 0.3], [x + 2.2, y + h - 1.6, z + 0.3], white); tri2(g, [x, y + h - 0.9, z], [x + 2.2, y + h - 1.6, z + 0.3], [x, y + h - 1.6, z], white); };
      const standFrame = (ax, az, bx, bz) => {   // a grandstand's front line: its length, along it (u), its middle (m), away from the track (n)
        const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, mx = (ax + bx) / 2, mz = (az + bz) / 2;
        let nx = -uz, nz = ux; const q = nearest(mx, mz); if (q.i >= 0 && (T.px[q.i] - mx) * nx + (T.pz[q.i] - mz) * nz > 0) { nx = -nx; nz = -nz; }   // n points away from the track
        return { L, ux, uz, mx, mz, nx, nz }; };
      const stand = (ax, az, bx, bz, rows, roofCol, open) => {   // temporary grandstand facing the circuit, tiers climb away from it (open = no roof, as along the harbour)
        const { L, ux, uz, mx, mz, nx, nz } = standFrame(ax, az, bx, bz);
        const g = scen.get(mx, mz), y0 = gH(mx, mz) - 0.2, rot = Math.atan2(uz, ux);
        for (let r2 = 0; r2 < rows; r2++) { const o = 1.2 + r2 * 1.1, cx = mx + nx * o, cz = mz + nz * o, yy = y0 + r2 * 0.55;
          box(g, cx, y0, cz, L, (r2 + 1) * 0.55, 1.1, rot, [0.62, 0.63, 0.66], [0.72, 0.73, 0.75]);
          const A = [ax + nx * (o - 0.5), yy + 0.56, az + nz * (o - 0.5)], Bp = [bx + nx * (o - 0.5), yy + 0.56, bz + nz * (o - 0.5)], C = [bx + nx * (o + 0.45), yy + 1.2, bz + nz * (o + 0.45)], D = [ax + nx * (o + 0.45), yy + 1.2, az + nz * (o + 0.45)];
          texCrowd.quadO(A, Bp, C, D, [1, 1, 1], [mx + nx * (o + 3), yy - 2, mz + nz * (o + 3)], [[0, r2 * 0.25], [L / 6, r2 * 0.25], [L / 6, r2 * 0.25 + 0.25], [0, r2 * 0.25 + 0.25]]); }
        const back = 1.2 + rows * 1.1, cx = mx + nx * back, cz = mz + nz * back;
        box(g, cx, y0, cz, L, rows * 0.55 + (open ? 1.3 : 3.2), 0.4, rot, [0.5, 0.52, 0.56]);
        if (!open) box(g, mx + nx * (back - rows * 0.55), y0 + rows * 0.55 + 3.0, mz + nz * (back - rows * 0.55), L + 1, 0.25, rows * 1.1 + 1.6, rot, roofCol || white, roofCol || white);
        { const nb = Math.max(1, Math.round(L / 9)), flip = ((bx - ax) * -nz + (bz - az) * nx) < 0;   // sponsor boards on the stand's front, readable from the track
          for (let q = 0; q < nb; q++) { const t0 = q / nb, t1 = (q + 1) / nb, slot = (q + Math.floor(Math.abs(mx) + Math.abs(mz))) % 8, u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25;
            const A = [ax + (bx - ax) * t0 + nx * 0.9, y0 + 0.2, az + (bz - az) * t0 + nz * 0.9], Bq = [ax + (bx - ax) * t1 + nx * 0.9, y0 + 0.2, az + (bz - az) * t1 + nz * 0.9];
            texSpons.quadO(A, Bq, [Bq[0], y0 + 1.2, Bq[2]], [A[0], y0 + 1.2, A[2]], [1, 1, 1], [mx + nx * 4, y0 + 0.6, mz + nz * 4], flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); } }
      };
      // the grandstands (built further down, after the city): Boulevard Albert Ier, over the Rainier III pool, Casino square, Sainte Dévote, the
      // hairpin on scaffolding; their ground kept free at once of the houses, palms and trees placed before them
      const STANDS = [[-117.6, 104, -117.6, 243, 11, 'blue'], [-117.6, 276, -117.6, 406, 10, 'red'], [-16, 212, -16, 282, 7, 'blue', true], [-46, 292, -16, 292, 5, 'blue', true],
        [741.8, -250.3, 807.2, -260.1, 6, 'white'], [14.7, -29.7, 80.1, -29.7, 6, 'white'], [880.7, -233.9, 885.6, -178.4, 7, 'red']];   // [front line from, to, rows, roof, open]
      const standRects = STANDS.map(([ax, az, bx, bz, rows]) => { const { L, ux, uz, mx, mz, nx, nz } = standFrame(ax, az, bx, bz), back = 1.2 + rows * 1.1;
        return { x: mx + nx * back / 2, z: mz + nz * back / 2, hx: L / 2 + 2, hz: back / 2 + 2, rot: Math.atan2(uz, ux) }; });
      exclRect.push(...standRects);
      const nearStand = (x, z, m) => standRects.some(r => inRect(x, z, { x: r.x, z: r.z, hx: r.hx + m, hz: r.hz + m, rot: r.rot }));   // (m: a tree crown's reach)
      const onStand = (x, z, W, D, rot) => { const cr = Math.cos(rot), sr = Math.sin(rot);   // a house's footprint (every 1/4 of it) over a stand
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const u = W * a / 4, v = D * b / 4; if (nearStand(x + u * cr - v * sr, z + u * sr + v * cr, 0)) return true; } return false; };
      // ---- the harbour: jetties with lighthouses, pontoons, yachts from day-boats to superyachts ----
      const yacht = (x, z, L, rot) => { const cr = Math.cos(rot), sr = Math.sin(rot), W0 = L * (L > 40 ? 0.17 : 0.3), rk = MC_ROCK;
        for (const [tu, tv] of [[-0.5, 0], [0.5, 0], [0, 0.5], [0, -0.5], [0, 0], [-0.5, 0.5], [0.5, -0.5]]) { const px = x + cr * L * tu - sr * W0 * tv, pz = z + sr * L * tu + cr * W0 * tv;
          if (!inPoly(MC_WATER, px, pz) || (px > rk.x0 && px < rk.x1 && pz > rk.z0 && pz < rk.z1) || clearance(px, pz) < 3) return; }
        yacht0(x, z, L, rot); };
      const yacht0 = (x, z, L, rot) => { const g = scen.get(x, z), cr = Math.cos(rot), sr = Math.sin(rot), W = L * (L > 40 ? 0.17 : 0.3), big = L > 40;
        const hull = R() < 0.16 ? [0.09, 0.15, 0.3] : R() < 0.1 ? [0.15, 0.15, 0.17] : [0.97, 0.97, 0.98];
        box(g, x, -0.6, z, L, 1.5 + L * 0.03, W, rot, hull, [0.86, 0.76, 0.6]);
        const bowx = x + cr * L * 0.5, bowz = z + sr * L * 0.5; tri2(g, [bowx, 0.9 + L * 0.03, bowz - cr * 0 + (-sr) * (W / 2)], [bowx + cr * L * 0.12, 0.9 + L * 0.03, bowz + sr * L * 0.12], [bowx + sr * (W / 2), 0.9 + L * 0.03, bowz - cr * (W / 2)], [0.86, 0.76, 0.6]);
        const dy = 0.9 + L * 0.03; box(g, x - cr * L * 0.06, dy, z - sr * L * 0.06, L * 0.52, 1.3 + L * 0.02, W * 0.78, rot, [0.98, 0.98, 0.98], [0.93, 0.93, 0.95]);
        box(g, x - cr * L * 0.02, dy + 0.5, z - sr * L * 0.02, L * 0.46, 0.5, W * 0.8, rot, [0.12, 0.16, 0.22]);
        if (big) { const uy = dy + 1.3 + L * 0.02; box(g, x - cr * L * 0.1, uy, z - sr * L * 0.1, L * 0.32, 1.4, W * 0.62, rot, [0.98, 0.98, 0.98], [0.9, 0.9, 0.92]); box(g, x - cr * L * 0.08, uy + 0.45, z - sr * L * 0.08, L * 0.3, 0.55, W * 0.64, rot, [0.12, 0.16, 0.22]);
          box(g, x - cr * L * 0.14, uy + 1.4, z - sr * L * 0.14, L * 0.16, 1.1, W * 0.5, rot, [0.98, 0.98, 0.98], [0.3, 0.32, 0.36]); cyl(g, x - cr * L * 0.08, uy + 2.5, z - sr * L * 0.08, 0.2, 4.5, 5, [0.9, 0.9, 0.9]); ico(g, x - cr * L * 0.08 + sr * 1.2, uy + 5.2, z - sr * L * 0.08 - cr * 1.2, 0.9, 1, [0.97, 0.97, 0.97], R, 0); }
        else if (R() < 0.35) cyl(g, x, dy, z, 0.08, L * 0.9, 4, [0.88, 0.88, 0.9]);
      };
      { const g = scen.get(600, 200);   // north jetty (towards the harbour mouth) and the south jetty off the Rock, each with a lighthouse
        const jetty = (ax, az, bx, bz, lh) => { const L = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bz - az, bx - ax); box(g, (ax + bx) / 2, -1, (az + bz) / 2, L, 3.2, 11, rot, [0.78, 0.76, 0.7], [0.82, 0.8, 0.74]);
          cyl(g, bx, 2.2, bz, 1.6, 9, 8, lh, [0.95, 0.95, 0.95]); cyl(g, bx, 11.2, bz, 1.1, 1.4, 8, [0.2, 0.22, 0.26]); };
        jetty(833.3, 17.7, 823.5, 213.8, [0.2, 0.55, 0.3]); jetty(594.7, 246.5, 1117.6, 181.1, red); jetty(460.8, 619.0, 570.2, 455.6, white);
        }
      for (const [x0, z0, x1, z1] of [[36, 207, 206, 207], [20, 292, 200, 292], [37, 380, 200, 380], [230, 81, 230, 200], [350, 81, 350, 200], [470, 80, 470, 190], [600, 67, 600, 170]]) {
        const L = Math.hypot(x1 - x0, z1 - z0), rot = Math.atan2(z1 - z0, x1 - x0), g = scen.get((x0 + x1) / 2, (z0 + z1) / 2);
        box(g, (x0 + x1) / 2, -0.2, (z0 + z1) / 2, L, 0.55, 3.4, rot, [0.55, 0.52, 0.47], [0.6, 0.56, 0.5]);
        const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
        for (let t = 8; t < L - 4; t += 8 + R() * 6) for (const sd of [-1, 1]) { if (R() < 0.18) continue; const Ly = 11 + R() * R() * 26, o = sd * (1.7 + Ly * 0.5 + 0.4);
          yacht(x0 + ux * t - uz * o, z0 + uz * t + ux * o, Ly, Math.atan2(ux * sd, -uz * sd) + Math.PI / 2 * 0); }
      }
      for (let k = 0; k < 9; k++) yacht(660 + k * 51, 208 - k * 6.1, 45 + R() * 40, -0.12);        // superyachts along the north jetty
      for (let k = 0; k < 7; k++) yacht(104 + k * 44, 455 + k * 7, 38 + R() * 30, 0.16);                    // and along the quay under the Rock
      for (let k = 0; k < 16; k++) { const a = R() * TAU, d = 120 + R() * 380; yacht(1300 + Math.cos(a) * d * 0.7, 330 + Math.sin(a) * d * 0.5, 20 + R() * 45, R() * TAU); }   // anchored in the bay
      // ---- Sainte-Dévote church in the ravine at turn 1 ----
      { const [x, z] = [-45.7, -26.4], g = scen.get(x, z), y0 = gH(x, z) - 0.3, rot = 0.6;
        box(g, x, y0, z, 22, 9, 12, rot, cream, cream); gable(g, x, y0 + 9, z, 22.4, 12.4, 4, rot, tile, cream);
        const tx = x + Math.cos(rot) * 12, tz = z + Math.sin(rot) * 12; box(g, tx, y0, tz, 5, 17, 5, rot, cream, cream); cone(g, tx, y0 + 17, tz, 3.4, 4, 4, tile, [0.8, 0.45, 0.3], rot + Math.PI / 4);
        excl.push({ x, z, r: 18 }); }
      // ---- Place du Casino: the Casino, Hôtel de Paris, Café de Paris, Hôtel Hermitage, the round lawn, gardens ----
      { const [x, z] = [741.8, -139.1], g = scen.get(x, z), y0 = facadeBox(x, z, 80, 46, 18, 0, [0.93, 0.86, 0.7]);
        box(g, x, y0 + 18, z, 80.4, 1.2, 46.4, 0, [0.85, 0.78, 0.62], [0.36, 0.5, 0.46]); gable(g, x, y0 + 19.2, z, 78, 40, 5, 0, copper, [0.85, 0.78, 0.62]);
        for (const sx of [-1, 1]) { const tx = x + sx * 30, tz = z - 20; box(g, tx, y0, tz, 9, 28, 9, 0, [0.95, 0.88, 0.72], [0.95, 0.88, 0.72]); ico(g, tx, y0 + 30.5, tz, 5, 1.1, copper, R, 0); cone(g, tx, y0 + 34.5, tz, 1, 4, 6, [0.8, 0.7, 0.4], [0.9, 0.8, 0.45], 0); }
        box(g, x, y0 + 18, z - 23.5, 22, 7, 2, 0, [0.97, 0.9, 0.74]); ico(g, x, y0 + 26, z - 21, 3, 1, [0.85, 0.72, 0.35], R, 0);   // sculpted attic + gilded group
        box(g, x, y0, z + 30, 90, 1.4, 16, 0, [0.9, 0.88, 0.82], [0.88, 0.86, 0.8]);                                                   // sea terraces
        excl.push({ x, z, r: 52 }); }
      { const [x, z] = [745.1, -178.4], g = scen.get(x, z), y = gH(x, z);                                                                   // the round lawn with its fountain
        cyl(g, x, y - 0.1, z, 13, 0.35, 20, [0.36, 0.58, 0.26], [0.4, 0.64, 0.28]); cyl(g, x, y + 0.25, z, 3.2, 0.6, 14, [0.9, 0.88, 0.84]); cyl(g, x, y + 0.85, z, 2.6, 0.05, 14, [0.45, 0.68, 0.82]); cone(g, x, y + 0.9, z, 0.5, 3, 6, [0.85, 0.9, 0.95], [0.9, 0.95, 1], 0);
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; palm(x + Math.cos(a) * 9.5, z + Math.sin(a) * 9.5, 7 + R() * 2); } excl.push({ x, z, r: 16 }); }
      { const [x, z] = [705.8, -96.7], g = scen.get(x, z), y0 = facadeBox(x, z, 44, 38, 22, 0, white);                                    // Hôtel de Paris, corner rotunda with a copper dome
        box(g, x, y0 + 22, z, 44.4, 0.8, 38.4, 0, [0.85, 0.84, 0.8], [0.4, 0.42, 0.46]); cyl(g, x - 20, y0, z - 17, 6, 25, 12, white); ico(g, x - 20, y0 + 26.5, z - 17, 6.2, 0.9, copper, R, 0); excl.push({ x, z, r: 32 }); }
      { const [x, z] = [833.3, -186.5], g = scen.get(x, z), y0 = facadeBox(x, z, 34, 24, 11, 0, [0.95, 0.9, 0.8]);                         // Café de Paris with red awnings
        box(g, x, y0 + 11, z, 34.4, 0.8, 24.4, 0, [0.8, 0.78, 0.72], [0.6, 0.62, 0.66]); for (let k = -2; k <= 2; k++) box(g, x + k * 6.5, y0 + 3.2, z - 13.2, 5, 0.3, 2.4, 0, red, red); excl.push({ x, z, r: 22 }); }
      { const [x, z] = [656.8, -34.6], g = scen.get(x, z), y0 = facadeBox(x, z, 58, 32, 24, 0.15, [0.95, 0.84, 0.76]);                     // Hôtel Hermitage, glass cupola
        box(g, x, y0 + 24, z, 58.4, 0.8, 32.4, 0.15, [0.85, 0.76, 0.7], [0.45, 0.45, 0.5]); ico(g, x + 10, y0 + 25, z, 6, 0.55, [0.62, 0.76, 0.82], R, 0); excl.push({ x, z, r: 36 }); }
      for (let k = 0; k < 44; k++) { const x = 660 + R() * 163, z = -296 + R() * 62; if (clearance(x, z) > 4 && !excluded(x, z) && !nearStand(x, z, 3.5)) (R() < 0.6 ? palm(x, z, 7 + R() * 4) : ico(scen.get(x, z), x, gH(x, z) + 3, z, 2.6 + R(), 1, vary([0.24, 0.45, 0.2], R, 0.15), R, 0.2)); }   // Boulingrins gardens
      for (const [fx, fz] of [[709.1, -227.4], [758.1, -237.2], [807.1, -247.0], [679.7, -204.5]]) if (clearance(fx, fz) > 3) flag(fx, fz, 9);
      // ---- the Fairmont hotel above the hairpin, built over the tunnel; fades with the tunnel roof when you are inside ----
      { const [x, z] = [973.8, -103.2], rot = Math.atan2(114, -142), L = 150, D = 72, y0 = 16, H = 24, cr = Math.cos(rot), sr = Math.sin(rot);
        box(tun, x, y0, z, L, H, D, rot, [0.94, 0.93, 0.9], [0.8, 0.8, 0.8]);
        for (let f = 1; f < 7; f++) box(tun, x, y0 + f * 3.4 - 1.2, z, L + 0.3, 1.1, D + 0.3, rot, [0.25, 0.3, 0.38]);          // window bands
        box(tun, x - cr * 30, y0 + H, z - sr * 30, 26, 0.4, 14, rot, [0.4, 0.75, 0.9], [0.4, 0.75, 0.9]);                      // rooftop pool
        box(tun, x, 0, z, L * 0.9, y0, D * 0.4, rot, [0.7, 0.7, 0.68], [0.75, 0.75, 0.72]);                                     // piers down to the sea road
        exclRect.push({ x, z, hx: L / 2 + 4, hz: D / 2 + 4, rot }); }
      // ---- the tunnel: walls, roof and lights over the sea road (roof fades out while you drive through) ----
      { const tu = T.def.tunnel || [0.54, 0.69], s0 = tu[0] * T.len, s1 = tu[1] * T.len;
        for (let s = s0; s < s1; s += 2) { const i = T.idx(s), j = T.idx(s + 2), y = HYi(i), yj = HYi(j);
          const Lw = (k, o, yy) => [T.px[k] + T.nx[k] * o, yy, T.pz[k] + T.nz[k] * o];
          const oL = -(T.bl[i] + 0.6), oR = T.br[i] + 0.6, oLj = -(T.bl[j] + 0.6), oRj = T.br[j] + 0.6;
          tun.quadO(Lw(i, oL, y), Lw(j, oLj, yj), Lw(j, oLj, yj + 6.4), Lw(i, oL, y + 6.4), [0.72, 0.72, 0.7], Lw(i, oL - 3, y + 3));
          tun.quadO(Lw(i, oR, y), Lw(j, oRj, yj), Lw(j, oRj, yj + 6.4), Lw(i, oR, y + 6.4), [0.72, 0.72, 0.7], Lw(i, oR + 3, y + 3));
          tun.quadO(Lw(i, oL - 1, y + 6.4), Lw(j, oLj - 1, yj + 6.4), Lw(j, oRj + 1, yj + 6.4), Lw(i, oR + 1, y + 6.4), [0.55, 0.55, 0.53], Lw(i, 0, y + 3));
          tun.quadO(Lw(i, oL - 1, y + 7.2), Lw(j, oLj - 1, yj + 7.2), Lw(j, oRj + 1, yj + 7.2), Lw(i, oR + 1, y + 7.2), [0.5, 0.5, 0.48], Lw(i, 0, y + 3));
          if (((s - s0) / 2 | 0) % 6 === 0) box(tun, T.px[i], y + 6.1, T.pz[i], 1.4, 0.25, 3.2, T.hd[i], [1, 0.9, 0.6], [1, 0.9, 0.6]); } }
      // ---- the swimming pool, the pits ----
      { const [x, z] = [-31.0, 246.5], g = scen.get(x, z), y = gH(x, z);
        box(g, x, y - 0.2, z, 30, 0.3, 64, 0, [0.9, 0.9, 0.88], [0.92, 0.92, 0.9]); box(g, x, y, z, 21, 0.14, 50, 0, [0.3, 0.7, 0.86], [0.34, 0.74, 0.9]);
        box(g, x + 12, y, z - 20, 3, 5, 3, 0, white, white); box(g, x + 12, y + 5, z - 22, 2, 0.3, 5, 0, white, white); excl.push({ x, z, r: 34 }); }
      { for (let zz = 96; zz < 390; zz += 9) { const x = -66, g = scen.get(x, zz), y = gH(x, zz); box(g, x, y, zz, 8, 4.2, 8.2, 0, [0.9, 0.9, 0.9], [0.8, 0.8, 0.82]); box(g, x - 4.05, y, zz, 0.2, 3.2, 6.2, 0, [0.15, 0.17, 0.2]); } exclRect.push({ x: -66, z: 243, hx: 6, hz: 150, rot: 0 }); }
      // ---- the Rock: Prince's Palace, the Cathedral, the Oceanographic Museum on the cliff, the old town, gardens ----
      { const [x, z] = [-42.5, 578.1], g = scen.get(x, z), y0 = gH(x, z) - 0.4, c = [0.94, 0.86, 0.68], rot = 0.08;
        box(g, x, y0, z, 86, 14, 58, rot, c, c); gable(g, x + 10, y0 + 14, z + 8, 60, 34, 6, rot, tile, c);
        for (const [u, v] of [[-43, -29], [43, -29], [-43, 29], [43, 29]]) { const px = x + u, pz = z + v; cyl(g, px, y0, pz, 5, 19, 10, c); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; box(g, px + Math.cos(a) * 4.4, y0 + 19, pz + Math.sin(a) * 4.4, 1.2, 1.2, 1.2, a, c); } }
        for (let k = -8; k <= 8; k++) box(g, x + k * 5, y0 + 14, z - 29.3, 2, 1.4, 1, rot, c);   // crenellations towards the Place du Palais
        flag(x, z - 5, 24); excl.push({ x, z, r: 60 }); }
      { const [x, z] = [169.9, 610.8], g = scen.get(x, z), y0 = gH(x, z) - 0.4, c = [0.96, 0.95, 0.9];                                       // Cathedral (white stone)
        box(g, x, y0, z, 44, 18, 20, 0, c, c); gable(g, x, y0 + 18, z, 44.4, 20.4, 6, 0, [0.6, 0.6, 0.62], c); cyl(g, x + 24, y0, z, 10, 16, 14, c); ico(g, x + 24, y0 + 16, z, 10.2, 0.6, [0.62, 0.62, 0.64], R, 0);
        box(g, x - 25, y0, z - 6, 7, 30, 7, 0, c, c); cone(g, x - 25, y0 + 30, z - 6, 4.8, 5, 4, [0.6, 0.6, 0.62], c, Math.PI / 4); excl.push({ x, z, r: 36 }); }
      { const [x, z] = [382.3, 684.3], g = scen.get(x, z), y0 = gH(x, z) - 30, c = [0.97, 0.96, 0.92];                                     // Oceanographic Museum, rising from the cliff face
        box(g, x, y0, z, 110, 38, 26, -0.05, c, c); box(g, x, y0 + 38, z - 2, 70, 6, 18, -0.05, c, [0.7, 0.7, 0.72]); ico(g, x, y0 + 44, z - 2, 8, 0.7, [0.72, 0.7, 0.66], R, 0);
        for (let k = -5; k <= 5; k++) cyl(g, x + k * 9, y0 + 20, z - 13.4, 0.7, 16, 8, c); excl.push({ x, z, r: 60 }); }
      // ---- the city: La Condamine, Monte-Carlo towers, the inner hillside, the old town on the Rock, Larvotto ----
      const zones = [
        { x0: -420, x1: -104, z0: -130, z1: 520, pal: 'condamine', n: 200 },   // La Condamine behind Boulevard Albert Ier
        { x0: -80, x1: 600, z0: -340, z1: -34, pal: 'mc', n: 240 },            // Monte-Carlo above Beau Rivage
        { x0: 90, x1: 600, z0: 8, z1: 50, pal: 'mc', n: 60 },                  // between Beau Rivage and the harbour road
        { x0: 595, x1: 920, z0: -214, z1: 14, pal: 'mc', n: 70 },              // around the Casino, inside the loop
        { x0: 530, x1: 1150, z0: -480, z1: -255, pal: 'mc', n: 160 },          // Monte-Carlo above the Casino and Mirabeau
        { x0: 1080, x1: 1480, z0: -460, z1: -200, pal: 'mc', n: 80 },          // Larvotto beyond Portier
        { x0: -110, x1: 430, z0: 520, z1: 690, pal: 'rock', n: 130 },          // Monaco-Ville on the Rock
        { x0: -480, x1: -130, z0: 520, z1: 780, pal: 'condamine', n: 60 },     // Fontvieille
      ];
      const PAL = { condamine: [[0.96, 0.86, 0.66], [0.93, 0.74, 0.58], [0.97, 0.92, 0.8], [0.9, 0.66, 0.54], [0.95, 0.9, 0.72]],
                    mc: [[0.97, 0.96, 0.93], [0.95, 0.92, 0.85], [0.9, 0.86, 0.78], [0.96, 0.9, 0.8], [0.85, 0.83, 0.8]],
                    rock: [[0.96, 0.84, 0.64], [0.94, 0.72, 0.6], [0.97, 0.92, 0.78], [0.92, 0.8, 0.7]] };
      const placed = [];
      { const tu = T.def.tunnel || [0.54, 0.69], awn = [[0.8, 0.12, 0.15], [0.1, 0.35, 0.6], [0.2, 0.45, 0.25], [0.9, 0.7, 0.2], [0.95, 0.95, 0.93]];
        for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 19 + R() * 7) {
          if (q > tu[0] * T.len - 25 && q < tu[1] * T.len + 25) continue;
          const i = T.idx(q), bar = side > 0 ? T.br[i] : T.bl[i], W = 15 + R() * 9, D = 11 + R() * 7, o = side * (bar + 3.8 + D / 2), rot = T.hd[i];
          const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, rad = Math.hypot(W, D) / 2;
          if (excluded(x, z) || gH(x, z) < 0.8) continue;
          const cr0 = Math.cos(rot), sr0 = Math.sin(rot); let bad = false;
          for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) { const px = x + u * cr0 - v * sr0, pz = z + u * sr0 + v * cr0; if (clearance(px, pz) < 2.5 || gH(px, pz) < 0.8 || excluded(px, pz)) { bad = true; break; } }
          if (bad || placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.8) || onStand(x, z, W, D, rot)) continue;
          const monte = z < -60 || x > 400, pal = monte ? PAL.mc : PAL.condamine, col = pal[Math.floor(R() * pal.length)], H = 10 + R() * 12, y0 = facadeBox(x, z, W, D, H, rot, col, null, monte && R() < 0.7), g = scen.get(x, z);
          if (!monte || R() < 0.4) gable(g, x, y0 + H, z, W + 0.6, D + 0.6, 2.4 + R(), rot, tile, col); else { box(g, x, y0 + H, z, W, 0.6, D, rot, col.map(v => v * 0.86), [0.72, 0.72, 0.7]); roofKit(g, x, y0 + H + 0.6, z, W, D, rot, col); }
          const fx = x - side * T.nx[i] * (D / 2 + 0.6), fz = z - side * T.nz[i] * (D / 2 + 0.6);
          if (R() < 0.7) { const ac = awn[Math.floor(R() * awn.length)]; for (let b2 = -W / 2 + 2.5; b2 < W / 2 - 1.5; b2 += 4.2) box(g, fx + cr0 * b2, y0 + 3.1, fz + sr0 * b2, 3.4, 0.25, 1.4, rot, ac, ac); }
          placed.push([x, z, rad]); excl.push({ x, z, r: rad + 1 }); CR.block(x, z, W, D, rot);
        } }
      for (const Z of zones) {
        let made = 0;
        for (let k = 0; k < Z.n * 30 && made < Z.n; k++) {
          const x = Z.x0 + R() * (Z.x1 - Z.x0), z = Z.z0 + R() * (Z.z1 - Z.z0), W = 14 + R() * 18, D = 12 + R() * 14, rad = Math.hypot(W, D) / 2;
          const c = clearance(x, z);
          if (c < rad * 0.5 + 2 || excluded(x, z)) continue;
          const y = gH(x, z); if (y < 0.8) continue;                                            // not in the water
          if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.84)) continue;
          const ni = nearest(x, z).i, rot = ni >= 0 ? T.hd[ni] + (R() < 0.5 ? 0 : Math.PI / 2) : (R() - 0.5) * 0.6;
          { const cr0 = Math.cos(rot), sr0 = Math.sin(rot); let bad = false; for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) { const px = x + u * cr0 - v * sr0, pz = z + u * sr0 + v * cr0; if (clearance(px, pz) < 2.5 || gH(px, pz) < 0.8) { bad = true; break; } } if (bad || onStand(x, z, W, D, rot)) continue; }
          const maxH = Math.min(Z.pal === 'mc' ? 72 : Z.pal === 'rock' ? 14 : 30, 9 + Math.max(0, c) * (Z.pal === 'mc' ? 0.55 : 0.3));   // low next to the circuit, towers further back
          const H = Math.max(8, Math.min(maxH, (Z.pal === 'mc' ? 14 + R() * R() * 60 : 10 + R() * 16)));
          const col = PAL[Z.pal][Math.floor(R() * PAL[Z.pal].length)], y0 = facadeBox(x, z, W, D, H, rot, col, null, Z.pal === 'mc' && R() < 0.75), g = scen.get(x, z);
          if (Z.pal !== 'mc' || H < 22) gable(g, x, y0 + H, z, W + 0.6, D + 0.6, 2.4 + R(), rot, tile, col);
          else { box(g, x, y0 + H, z, W, 0.6, D, rot, col.map(v => v * 0.86), [0.72, 0.72, 0.7]); if (R() < 0.5) box(g, x + (R() - 0.5) * W * 0.4, y0 + H + 0.6, z + (R() - 0.5) * D * 0.4, W * 0.35, 2.6, D * 0.35, rot, [0.9, 0.9, 0.88], [0.4, 0.62, 0.78]); roofKit(g, x, y0 + H + 0.6, z, W, D, rot, col); }
          placed.push([x, z, rad]); excl.push({ x, z, r: rad + 1.5 }); CR.block(x, z, W, D, rot); made++;
        }
      }
      { const fm = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); fm.castShadow = true; fm.receiveShadow = true; root.add(fm); }
      if (!facB.empty) { const fb = new THREE.Mesh(facB.geometry(), new THREE.MeshLambertMaterial({ map: tex.facadeBal, vertexColors: true })); fb.castShadow = true; fb.receiveShadow = true; root.add(fb); }
      // ---- greenery: palms along the port and the boulevards, trees on the hillsides and the Rock's gardens ----
      for (let k = 0; k < 2600; k++) {
        const x = -500 + R() * 2000, z = -560 + R() * 1400, c = clearance(x, z); if (c < 2.5 || excluded(x, z)) continue;
        const y = gH(x, z); if (y < 0.8) continue;
        const nearTrack = c < 16, onRockEdge = x > MC_ROCK.x0 - 20 && x < MC_ROCK.x1 + 20 && z > MC_ROCK.z0 - 20 && z < MC_ROCK.z1 + 20 && y > 8 && y < 50;
        if (nearTrack && R() < 0.5) palm(x, z, 7 + R() * 4);
        else if ((onRockEdge || c > 60) && R() < 0.45) { const g = scen.get(x, z); cyl(g, x, y, z, 0.3, 2.5, 5, [0.4, 0.3, 0.2]); ico(g, x, y + 3.6, z, 2.4 + R() * 1.6, 0.9, vary([0.22, 0.42, 0.18], R, 0.18), R, 0.25); excl.push({ x, z, r: 2 }); }
      }
      // ---- street furniture just behind the barriers: palms and cast-iron lamp posts, both sides of the whole lap ----
      { const tu = T.def.tunnel || [0.54, 0.69];
        for (const side of [-1, 1]) for (let s0 = 0, k = 0; s0 < T.len; s0 += 17 + R() * 6, k++) {
          if (s0 > tu[0] * T.len - 20 && s0 < tu[1] * T.len + 20) continue;
          const i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2.2 + R() * 1.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (excluded(x, z) || clearance(x, z) < 1.5 || gH(x, z) < 0.8) continue;
          if (k % 2 === 0) palm(x, z, 7.5 + R() * 3);
          else { const g = scen.get(x, z), y = gH(x, z); cyl(g, x, y, z, 0.12, 5.2, 6, [0.16, 0.2, 0.18]); box(g, x, y + 5.2, z, 0.5, 0.7, 0.5, 0, [0.95, 0.92, 0.75], [0.2, 0.22, 0.2]); excl.push({ x, z, r: 1.5 }); }
        } }
      // ================= details from the reference photos =================
      const orange = [0.98, 0.45, 0.1], blueRoof = [0.18, 0.4, 0.78];
      const seg = (g, p0, p1, w, col) => {   // square beam between two points (crane booms, scaffold braces)
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2]; let ux = -dz, uz = dx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
        let vx = dy * uz, vy = dz * ux - dx * uz, vz = -dy * ux; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
        const h = w / 2, C = (p, a, b) => [p[0] + ux * a * h + vx * b * h, p[1] + vy * b * h, p[2] + uz * a * h + vz * b * h], mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2];
        for (const [a0, b0, a1, b1] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) g.quadO(C(p0, a0, b0), C(p0, a1, b1), C(p1, a1, b1), C(p1, a0, b0), col, mid); };
      const stonePine = (x, z, h) => { if (clearance(x, z) < 8.5 || gH(x, z) < 0.8 || nearStand(x, z, 6)) return; const g = scen.get(x, z), y = gH(x, z), cx = x + (R() - 0.5) * 1.6, cz = z + (R() - 0.5) * 1.6;   // umbrella pine: tall bare trunk, wide flat crown
        seg(g, [x, y, z], [cx, y + h * 0.8, cz], 0.6, [0.45, 0.33, 0.24]);
        ico(g, cx, y + h * 0.84, cz, 5.4 + R() * 1.6, 0.4, vary([0.2, 0.36, 0.16], R, 0.12), R, 0.25);
        ico(g, cx + (R() - 0.5) * 3, y + h * 0.93, cz + (R() - 0.5) * 3, 3.6, 0.45, vary([0.25, 0.43, 0.19], R, 0.12), R, 0.25); excl.push({ x, z, r: 4 }); };
      const crane = (x, z, rot, boom, ang) => {   // mobile TV crane: white truck on outriggers, red telescopic boom, camera hanging from the tip
        const g = scen.get(x, z), y = gH(x, z), cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, y, z, 12, 2.2, 3, rot, [0.93, 0.93, 0.93], [0.85, 0.85, 0.87]); propSolid(x, z, 12, 3, rot); box(g, x + cr * 5.2, y + 2.2, z + sr * 5.2, 2.4, 2.2, 2.8, rot, [0.95, 0.95, 0.95], [0.3, 0.35, 0.42]);
        for (const a of [-1, 1]) for (const b of [-1, 1]) { const px = x + cr * a * 4.5 - sr * b * 3.4, pz = z + sr * a * 4.5 + cr * b * 3.4; seg(g, [x + cr * a * 4.5, y + 1, z + sr * a * 4.5], [px, y + 0.3, pz], 0.35, [0.85, 0.85, 0.85]); box(g, px, y, pz, 0.9, 0.35, 0.9, rot, [0.2, 0.2, 0.22]); }
        box(g, x - cr * 2, y + 2.2, z - sr * 2, 3.2, 1.4, 3.2, rot, red, red);
        const b0 = [x - cr * 2, y + 3.6, z - sr * 2], ca = Math.cos(ang), sa = Math.sin(ang), at = (t) => [b0[0] + cr * ca * boom * t, b0[1] + sa * boom * t, b0[2] + sr * ca * boom * t];
        for (let k = 0; k < 4; k++) seg(g, at(k / 4), at((k + 1) / 4 + 0.02), 1.15 - k * 0.2, red);
        const tip = at(1); seg(g, tip, [tip[0], tip[1] - 9, tip[2]], 0.08, [0.15, 0.15, 0.15]); box(g, tip[0], tip[1] - 10.3, tip[2], 1.1, 1.2, 1.6, rot, [0.12, 0.12, 0.14]);
        excl.push({ x, z, r: 9 }); };
      const sAt = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < T.N; i++) { const d = Math.hypot(T.px[i] - x, T.pz[i] - z); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
      // Fairmont hairpin island (from the photo): low stone planter, green shrubs and small palms, red/white kerb ring flush with the road
      if (MC_ISLAND) { const { cx, cz, rI } = MC_ISLAND, g = scen.get(cx, cz), y = gH(cx, cz), yr = HYi(MC_ISLAND.i);
        for (let q = 0; q < 24; q++) { const a0 = q / 24 * TAU, a1 = (q + 1) / 24 * TAU, P = (a, r, yy) => [cx + Math.cos(a) * r, yy, cz + Math.sin(a) * r], c2 = q % 2 ? [0.96, 0.96, 0.96] : [0.86, 0.12, 0.14];
          g.quadO(P(a0, rI + 0.9, yr + 0.05), P(a1, rI + 0.9, yr + 0.05), P(a1, rI, yr + 0.16), P(a0, rI, yr + 0.16), c2, [cx, yr - 3, cz]); }
        cyl(g, cx, Math.min(y, yr) - 0.5, cz, rI, yr - Math.min(y, yr) + 1.1, 24, [0.8, 0.76, 0.68], [0.32, 0.5, 0.24]);
        for (let q = 0; q < 14; q++) { const a = R() * TAU, r = Math.sqrt(R()) * rI * 0.82; ico(g, cx + Math.cos(a) * r, yr + 1.1, cz + Math.sin(a) * r, 0.7 + R() * 0.7, 0.85, vary([0.2, 0.44, 0.18], R, 0.15), R, 0.3); }
        palm(cx + rI * 0.3, cz - rI * 0.2, 5.5); palm(cx - rI * 0.35, cz + rI * 0.3, 4.8); }
      // high road in, low road out: stone retaining wall along the inside of the road into the hairpin
      { const sA = MC_ISLAND ? MC_ISLAND.s : sAt(707, -304), sg = MC_ISLAND ? MC_ISLAND.sg : -1, g = scen.get(700, -340);
        for (let s1 = sA - 74; s1 < sA - 26; s1 += 2) { const i = T.idx(s1), j = T.idx(s1 + 2), yi = HYi(i), yj = HYi(j), P = (kk, oo, yy) => [T.px[kk] + T.nx[kk] * oo, yy, T.pz[kk] + T.nz[kk] * oo], col = vary([0.8, 0.74, 0.64], R, 0.05);
          const ob = sg < 0 ? -(T.bl[i] + 0.55) : (T.br[i] + 0.55), obj = sg < 0 ? -(T.bl[j] + 0.55) : (T.br[j] + 0.55), sgn = Math.sign(ob);
          g.quadO(P(i, ob, yi + 1.0), P(j, obj, yj + 1.0), P(j, obj, yi - 9), P(i, ob, yi - 9), col, P(i, ob - sgn * 3, yi));
          g.quadO(P(i, ob, yi + 1.0), P(j, obj, yj + 1.0), P(j, obj + sgn * 0.6, yj + 1.0), P(i, ob + sgn * 0.6, yi + 1.0), [0.86, 0.82, 0.74], P(i, ob, yi - 3)); } }
      // the tall residential tower and the pink building with blue balconies next to the hairpin
      { const [x, z] = [1011.4, -282.9], g = scen.get(x, z), y0 = facadeBox(x, z, 24, 22, 66, 0.3, [0.9, 0.82, 0.72]); box(g, x, y0 + 66, z, 24.4, 1.2, 22.4, 0.3, [0.8, 0.74, 0.66], [0.55, 0.55, 0.56]);
        for (let f = 1; f < 21; f++) box(g, x, y0 + f * 3.15, z, 24.8, 0.25, 22.8, 0.3, [0.95, 0.93, 0.9]); excl.push({ x, z, r: 18 }); }
      { const [x, z] = [892.1, -152.2], g = scen.get(x, z), y0 = facadeBox(x, z, 34, 20, 24, 0.1, [0.93, 0.74, 0.7]); box(g, x, y0 + 24, z, 34.4, 0.8, 20.4, 0.1, [0.8, 0.66, 0.62], [0.5, 0.52, 0.55]);
        for (let f = 1; f < 8; f++) box(g, x, y0 + f * 3.1 - 0.4, z - 10.4, 32, 0.35, 1.4, 0.1, [0.28, 0.5, 0.78], [0.3, 0.52, 0.8]); excl.push({ x, z, r: 20 }); }
      // spectators on the balconies of the pink building at the hairpin
      { const [x, z] = [892.1, -152.2], rot = 0.1, cr = Math.cos(rot), sr = Math.sin(rot), g = scen.get(x, z), y0 = gH(x, z) - 0.3, shirts = [[0.9, 0.2, 0.15], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.96, 0.8, 0.2], [0.2, 0.6, 0.3], [0.1, 0.1, 0.12]];
        for (let f = 1; f < 8; f++) for (let k = -14; k <= 14; k += 1.6) { if (R() < 0.45) continue; const px = x + cr * k + sr * 11, pz = z + sr * k - cr * 11.0, yy = y0 + f * 3.1 - 0.05;
          box(g, px, yy, pz, 0.45, 1.05, 0.3, rot, shirts[Math.floor(R() * shirts.length)]); box(g, px, yy + 1.05, pz, 0.28, 0.28, 0.28, rot, [0.93, 0.76, 0.6]); } }
      // orange/black energy-absorbing blocks around the outside of the hairpin exit
      if (MC_ISLAND) { const sA = MC_ISLAND.s, side = -MC_ISLAND.sg;
        for (let s1 = sA - 18, q = 0; s1 < sA + 34; s1 += 2.1, q++) { const i = T.idx(s1), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar - 0.45), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z);
          box(g, x, HYi(i), z, 2.0, 1.2, 0.9, T.hd[i], q % 2 ? [0.12, 0.12, 0.13] : [0.98, 0.45, 0.08], q % 2 ? [0.2, 0.2, 0.22] : [1, 0.55, 0.15]); propSolid(x, z, 2.0, 0.9, T.hd[i]); } }
      // a second big billboard above the hairpin
      { const [x, z] = [1009.8, -135.9], g = scen.get(x, z), y = gH(x, z), rot = 1.5, cr = Math.cos(rot), sr = Math.sin(rot), hw = 8;
        for (const o of [-hw + 1, hw - 1]) box(g, x + cr * o, y, z + sr * o, 0.5, 5, 0.5, rot, [0.2, 0.2, 0.22]);
        texSpons.quadO([x - cr * hw, y + 5, z - sr * hw], [x + cr * hw, y + 5, z + sr * hw], [x + cr * hw, y + 8.4, z + sr * hw], [x - cr * hw, y + 8.4, z - sr * hw], [1, 1, 1], [x + sr * 3, y + 6, z - cr * 3], [[0.5, 0.25], [1, 0.25], [1, 0.5], [0.5, 0.5]]); }
      // the harbour corner: a restaurant on the corner, red awnings and a terrace
      { const [x, z] = [14.7, 507.9], rot = 0.05; if (clearance(x, z) > 9 && gH(x, z) > 0.8) { const g = scen.get(x, z), y0 = facadeBox(x, z, 22, 12, 7, rot, [0.96, 0.9, 0.8]);
          box(g, x, y0 + 7, z, 22.4, 0.5, 12.4, rot, [0.8, 0.76, 0.7], [0.75, 0.72, 0.68]); for (let k = -9; k <= 9; k += 4.5) box(g, x + k, y0 + 3, z - 6.8, 3.8, 0.25, 1.8, rot, red, red);
          for (let k = -8; k <= 8; k += 4) { cyl(g, x + k, y0, z - 10, 0.06, 2.4, 4, [0.85, 0.85, 0.85]); cone(g, x + k, y0 + 2.3, z - 10, 1.6, 0.6, 8, white, white, 0); }
          excl.push({ x, z, r: 14 }); } }
      // TV cranes like the ones over the hairpin, the pool and the Casino
      crane(990.1, -145.7, -2.2, 34, 1.0); crane(-29.4, 161.5, 0.4, 30, 0.95); crane(725.5, -255.2, 2.6, 28, 1.05); crane(88.2, -50.9, 2.9, 26, 1.0);
      // umbrella pines along the harbour boulevards (pool section, Tabac quay, Boulevard Albert Ier)
      const pinesAlong = (fa, fb, side, off) => { for (let q = fa * T.len; q < fb * T.len; q += 15 + R() * 5) { const i = T.idx((T.startS + q) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (!excluded(x, z)) stonePine(x, z, 11 + R() * 3); } };
      pinesAlong(0.78, 0.88, 1, 9); pinesAlong(0.66, 0.75, 1, 9); pinesAlong(0.925, 1.06, -1, 9);   // pool side of the swimming-pool section, Tabac, Boulevard Albert Ier
      // yachts moored stern-to right along the quays, as in the photos (bows pointing into the harbour)
      const lerpTab = (tab, v) => { if (v <= tab[0][0]) return tab[0][1]; for (let k = 0; k < tab.length - 1; k++) if (v <= tab[k + 1][0]) { const t = (v - tab[k][0]) / (tab[k + 1][0] - tab[k][0]); return tab[k][1] + (tab[k + 1][1] - tab[k][1]) * t; } return tab[tab.length - 1][1]; };
      const quayW = [[109.2, 70.3], [132.1, 57.2], [161.5, 47.4], [207.2, 34.3], [256.3, 26.1], [292.2, 18], [324.9, 22.9], [360.8, 31], [400, 42.5], [431, 53.9], [471.9, 58.8]], quayN = [[91.5, 92.9], [145.4, 79.8], [300.6, 78.2], [447.7, 79.8], [496.7, 76.5], [545.7, 68.4], [619.2, 63.5], [692.8, 53.7], [766.3, 35.7]];
      for (let z = 112; z < 470; z += 9.5 + R() * 3) { if ([207, 292, 380].some(p => Math.abs(p - z) < 11)) continue; const L = 20 + R() * 32; yacht(lerpTab(quayW, z) + 1.5 + L / 2, z, L, 0); }        // stern-to all along the pool section
      for (let x = 100; x < 762; x += 9.5 + R() * 3) { if ([230, 350, 470, 600].some(p => Math.abs(p - x) < 11)) continue; const L = 18 + R() * 30; yacht(x, lerpTab(quayN, x) + 1.5 + L / 2, L, Math.PI / 2); }   // and along Tabac to the chicane
      // cruise ships anchored in the bay
      const cruise = (x, z, L, rot) => { const g = scen.get(x, z), W = L * 0.13, cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, -3, z, L, 11, W, rot, [0.96, 0.96, 0.97], [0.66, 0.58, 0.48]);
        for (let d = 0; d < 5; d++) { const Ld = L * (0.78 - d * 0.08); box(g, x - cr * L * 0.05, 8 + d * 2.8, z - sr * L * 0.05, Ld, 2.8, W * 0.9, rot, [0.97, 0.97, 0.98], [0.95, 0.95, 0.96]); box(g, x - cr * L * 0.05, 8.9 + d * 2.8, z - sr * L * 0.05, Ld + 0.2, 0.9, W * 0.92, rot, [0.2, 0.26, 0.34]); }
        box(g, x - cr * L * 0.22, 22, z - sr * L * 0.22, W * 0.55, 8, W * 0.42, rot, [0.93, 0.93, 0.95], [0.12, 0.12, 0.15]); };
      cruise(1281.0, 390.2, 250, -0.3); cruise(1509.7, 128.8, 210, 0.15); cruise(1411.7, 651.7, 280, -0.1);
      // Yacht Club de Monaco: stacked decks like a liner, twin masts, at the east end of the harbour
      { const [x, z] = [679.7, 92.9], g = scen.get(x, z), y = 1.2;
        for (let d = 0; d < 6; d++) { const r = 17 - d * 1.7; cyl(g, x, y + d * 3.6, z, r, 3, 20, [0.97, 0.97, 0.98], [0.92, 0.92, 0.93]); cyl(g, x, y + d * 3.6 + 3, z, r + 0.7, 0.6, 20, [0.22, 0.28, 0.36]); }
        for (const o of [-4, 4]) cyl(g, x + o, y + 21.6, z, 0.28, 24, 5, [0.96, 0.96, 0.96]); excl.push({ x, z, r: 20 }); }
      // overhead sponsor gantries across the circuit (pool section, Tabac, the start)
      const gantry = (sq, slot) => { const i = T.idx(sq), x = T.px[i], z = T.pz[i], y = HYi(i), nx = T.nx[i], nz = T.nz[i], tx = T.tx[i], tz = T.tz[i], L1 = T.bl[i] + 1.3, L2 = T.br[i] + 1.3, g = scen.get(x, z);
        box(g, x - nx * L1, y, z - nz * L1, 0.9, 8.4, 0.9, T.hd[i], [0.2, 0.22, 0.26]); box(g, x + nx * L2, y, z + nz * L2, 0.9, 8.4, 0.9, T.hd[i], [0.2, 0.22, 0.26]); CR.avoid(x - nx * L1, z - nz * L1, 1.1); CR.avoid(x + nx * L2, z + nz * L2, 1.1);
        const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2, span = L1 + L2; box(g, cx, y + 6.6, cz, 1.4, 2.0, span + 0.9, T.hd[i], [0.12, 0.13, 0.16], [0.2, 0.22, 0.26]);
        const u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(slot / 2) * 0.25, vBot = vTop - 0.25, half = span / 2 - 0.4;
        for (const f of [-1, 1]) { const bx = cx + tx * 0.72 * f, bz = cz + tz * 0.72 * f;
          texSpons.quadO([bx - nx * half, y + 6.7, bz - nz * half], [bx + nx * half, y + 6.7, bz + nz * half], [bx + nx * half, y + 8.5, bz + nz * half], [bx - nx * half, y + 8.5, bz - nz * half], [1, 1, 1], [cx, y + 7.5, cz], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]); } };
      gantry(sF(0.81), 4); gantry(sF(0.70), 1); gantry(sF(0.03), 6);
      // big MONACO billboard above the hairpin, like in the photo
      { const [x, z] = [921.5, -266.6], g = scen.get(x, z), y = gH(x, z), rot = 0.2, cr = Math.cos(rot), sr = Math.sin(rot), hw = 9;
        for (const o of [-hw + 1, hw - 1]) box(g, x + cr * o, y, z + sr * o, 0.5, 4.2, 0.5, rot, [0.2, 0.2, 0.22]);
        texSpons.quadO([x - cr * hw, y + 4, z - sr * hw], [x + cr * hw, y + 4, z + sr * hw], [x + cr * hw, y + 7, z + sr * hw], [x - cr * hw, y + 7, z - sr * hw], [1, 1, 1], [x + sr * 3, y + 5, z - cr * 3], [[0, 0.75], [0.5, 0.75], [0.5, 1], [0, 1]]); }
      // (the distance boards before the braking zones, 150 / 100 / 50 m: the track's own, def.brakeBoards, drawn with every circuit's: brakeBoards)
      // marshals in orange behind the barriers at the big corners
      for (const c of T.corners) { if (c.sev < 2) continue; for (let k = 0; k < 3; k++) { const i = T.idx(c.s0 + k * 6 - 4), side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.4 + k * 0.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z), y = gH(x, z);
        box(g, x, y, z, 0.5, 1.25, 0.35, T.hd[i], orange); box(g, x, y + 1.25, z, 0.32, 0.32, 0.32, T.hd[i], [0.96, 0.96, 0.96]); } }
      // ---- grandstands: Boulevard Albert Ier, the harbour quay at Tabac, along the pool, Casino square, the harbour corner, Sainte Dévote, the hairpin ----
      for (const [ax, az, bx, bz, rows, roof, open] of STANDS) stand(ax, az, bx, bz, rows, { blue: blueRoof, red, white }[roof], open);   // (STANDS: further up)
      { const g = scen.get(870, -206); for (let z = -234; z <= -178; z += 3.2) for (const x of [872, 866, 860]) { const y = gH(x, z); seg(g, [x, y, z], [x, y + 9, z], 0.18, [0.62, 0.64, 0.68]); }
        for (let z = -234; z < -178; z += 6.4) seg(g, [872, gH(872, z), z], [872, gH(872, z) + 8, z + 3.2], 0.12, [0.62, 0.64, 0.68]); }
      // spectators on the pavements behind the catch fences (up to three rows before the house fronts): Sainte Dévote, Beau Rivage, Casino square,
      // Mirabeau, outside the hairpin, Portier, the chicane, Tabac, the pool, the harbour corner, the last corner, Boulevard Albert Ier (not in the tunnel,
      // not on the pit side, not over the water; the stands and the street furniture keep their room)
      { const M = { rows: 3, gap: 0.95, clump: 0.55, flag: 0.07, shirts: [[0.95, 0.95, 0.93], [0.12, 0.16, 0.3], [0.84, 0.1, 0.14], [0.9, 0.84, 0.7], [0.55, 0.7, 0.86], [0.2, 0.2, 0.22], [0.96, 0.8, 0.2], [0.88, 0.5, 0.52], [0.3, 0.46, 0.34], [0.7, 0.72, 0.76]] };
        for (const [a, b2, sd, dn] of [[220, 282, -1, 0.8], [220, 282, 1, 0.6], [300, 700, -1, 0.5], [300, 700, 1, 0.5], [996, 1162, -1, 0.8], [996, 1090, 1, 0.75], [1160, 1226, -1, 0.8], [1160, 1226, 1, 0.8],
          [1264, 1330, 1, 0.8], [1340, 1500, -1, 0.65], [1340, 1500, 1, 0.65], [2100, 2176, -1, 0.75], [2100, 2176, 1, 0.75], [2250, 2420, -1, 0.7], [2250, 2420, 1, 0.7],
          [2490, 2810, -1, 0.62], [2490, 2810, 1, 0.62], [2910, 3000, -1, 0.8], [2910, 3000, 1, 0.8], [3012, 3100, -1, 0.75], [3012, 3100, 1, 0.75], [3100, 3556, -1, 0.55], [3100, 3556, 1, 0.5], [700, 996, -1, 0.3], [700, 996, 1, 0.3]])
          crRun(a, b2, sd, Object.assign({ dens: dn, label: 'MC ' + a + (sd > 0 ? 'R' : 'L') }, M)); }
      { const tm = new THREE.Mesh(tun.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); tm.castShadow = true; tm.receiveShadow = true; root.add(tm);
        const tu = T.def.tunnel || [0.54, 0.69]; out.dyn.tunnel = { mat: tm.material, s0: tu[0] * T.len, s1: tu[1] * T.len }; }
      // the Mediterranean and Port Hercule
      { const x0 = B.minX - 500, x1 = B.maxX + 700, z0 = B.minZ - 300, z1 = B.maxZ + 700, gw = new THREE.PlaneGeometry(x1 - x0, z1 - z0); gw.rotateX(-Math.PI / 2); gw.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
        const uv = gw.attributes.uv, gp = gw.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, gp.getX(i) / 24, -gp.getZ(i) / 24);   // (uv in metres, as the shore band's)
        const WO = { len: 2.2, amp: 1.2, refl: 0.45, land: 0.2, shal: 0.3, lap: 0.9, surf: 0.35 }, sea = new THREE.Mesh(gw, waterMat(tex, Object.assign({ color: 0x3f8fc4 }, WO))); sea.receiveShadow = true; root.add(sea); out.dyn.water = tex.water;
        addShore(root, shoreBand(...gmBox(x0, z0, x1, z1), 0.015, gmLine(0), 24), sea.material, WO); }   // (the quays, the harbour walls, the Rock)
    }

    /* ---- finalize meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    if (treeCh.map.size) treesTo(treeCh, sceneryGroup, swayMat(out.dyn.wind || (out.dyn.wind = { value: 0 })));
    const addTex = (g, mat, cast) => { if (g.empty) return; const m = new THREE.Mesh(g.geometry(), mat); m.castShadow = !!cast; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); return m; };
    addTex(texTires, new THREE.MeshLambertMaterial({ map: THEME === 'forest' ? tex.tiresRW : tex.tires, vertexColors: true }), true);
    tyreCh.addTo(root, new THREE.MeshLambertMaterial({ map: tex.tyreTex, vertexColors: true }), true, true);
    addTex(texSpons, new THREE.MeshLambertMaterial({ map: THEME === 'monaco' ? tex.sponsorsMC : THEME === 'forest' ? tex.sponsorsFO : THEME === 'italia' ? tex.sponsorsIT : THEME === 'kamp' ? tex.sponsorsKP : tex.sponsors, vertexColors: true }), false);
    addTex(texFence, THEME === 'italia' ? new THREE.MeshBasicMaterial({ map: tex.fenceFO, color: 0xb4ab96, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide })   // (Toskana: the light warm-grey chain-link of the reference)
      : CSX ? new THREE.MeshLambertMaterial({ map: tex.fenceFO, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide })
      : new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, transparent: false }), false);
    addTex(texCrowd, THEME === 'monaco' ? crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 0.5, 0.25, 0.25) : crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), CSX ? 10 / 12 : 1, 0.14, 0.13), false);   // (Monaco's stands: a tile a 6 m, a tier a quarter; the CS circuits' a 10 m)
    crowdFinish(CR, root, out);   // the instanced spectators and their ground strips
    return finish(out, tex);
  }

  // the TV helicopter: a light single-engine type in white with a blue livery (+x forward, y up, 11.4 m nose to tail); the main and the tail rotor
  // spin on their own (Pikes Peak's, Ouninpohja's, the Red Bull Ring's)
  function tvHeli(root) {
    const wht = [0.93, 0.93, 0.95], blu = [0.13, 0.3, 0.68], gls = [0.07, 0.09, 0.13], gry = [0.36, 0.37, 0.4], drk = [0.16, 0.16, 0.18];
    const hull = (g, x0, ya0, yb0, hw0, x1, ya1, yb1, hw1, col, colTop, colEnd) => {   // a tapered box between two cross-sections (at x0: y ya0..yb0, half-width hw0; at x1 likewise)
      const a = [[x0, ya0, -hw0], [x0, ya0, hw0], [x0, yb0, hw0], [x0, yb0, -hw0]], b = [[x1, ya1, -hw1], [x1, ya1, hw1], [x1, yb1, hw1], [x1, yb1, -hw1]], inn = [(x0 + x1) / 2, (ya0 + yb0 + ya1 + yb1) / 4, 0];
      g.quadO(a[0], a[1], b[1], b[0], col, inn); g.quadO(a[3], a[2], b[2], b[3], colTop || col, inn);
      g.quadO(a[0], a[3], b[3], b[0], colEnd || col, inn); g.quadO(a[1], a[2], b[2], b[1], colEnd || col, inn);
      g.quadO(b[0], b[1], b[2], b[3], colEnd || col, inn); g.quadO(a[0], a[1], a[2], a[3], col, inn);
    };
    const gb = new GB();
    box(gb, 0.2, 0.55, 0, 3.2, 1.75, 1.7, 0, wht);                               // cabin
    box(gb, 0.2, 0.86, 0, 3.24, 0.3, 1.74, 0, blu);                              // livery stripe
    hull(gb, 1.8, 0.55, 2.3, 0.85, 3.15, 0.8, 1.45, 0.42, wht, gls, gls);        // nose with the wrap-around windscreen
    hull(gb, -1.4, 0.55, 2.3, 0.85, -2.7, 1.4, 2.05, 0.3, wht);                  // rear fairing
    hull(gb, -2.7, 1.4, 2.05, 0.3, -7.9, 1.7, 1.98, 0.13, wht, blu, wht);        // tail boom (blue spine)
    for (const sd of [-1, 1]) {
      box(gb, 1.0, 1.35, sd * 0.84, 1.1, 0.72, 0.06, 0, gls);                    // door windows
      box(gb, -0.4, 1.35, sd * 0.84, 0.9, 0.62, 0.06, 0, gls);
      box(gb, 0.2, 0.02, sd * 1.0, 3.8, 0.1, 0.12, 0, drk);                      // skid
      for (const x of [-0.7, 1.1]) box(gb, x, 0.08, sd * 0.93, 0.1, 0.5, 0.1, 0, gry);   // struts
    }
    box(gb, -0.35, 2.3, 0, 2.1, 0.5, 1.1, 0, blu, wht);                          // engine cowling
    cyl(gb, -0.1, 2.75, 0, 0.13, 0.55, 5, gry);                                  // rotor mast
    hull(gb, -7.3, 1.85, 2.0, 0.06, -8.3, 2.3, 3.3, 0.05, blu);                  // swept tail fin
    box(gb, -7.0, 1.78, 0, 0.55, 0.06, 1.9, 0, wht);                             // horizontal stabiliser
    const g2 = new GB(); box(g2, 0, 0, 0, 10.6, 0.06, 0.34, 0.1, drk); cyl(g2, 0, -0.05, 0, 0.26, 0.2, 6, gry, gry);   // main rotor: two blades through the hub
    const gt = new GB(); box(gt, 0, -0.85, 0, 0.14, 1.7, 0.04, 0, drk); box(gt, 0, -0.05, 0, 0.2, 0.1, 0.1, 0, gry);   // tail rotor (spins about z)
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); mat.userData.noCloud = true;   // (the helicopter stays out of the cloud shadows)
    const heli = new THREE.Group(); heli.rotation.order = 'YZX'; root.add(heli);
    const body = new THREE.Mesh(gb.geometry(), mat), rotor = new THREE.Mesh(g2.geometry(), mat), tail = new THREE.Mesh(gt.geometry(), mat);
    rotor.position.set(-0.1, 3.3, 0); tail.position.set(-8.0, 2.55, 0.14);
    body.castShadow = rotor.castShadow = true; heli.add(body, rotor, tail);
    return { heli, rotor, tail };
  }
  /* ---- cloud shadows (every world): slowly drifting blobs of 2-octave value noise darken every plain material of the world (not the
     crowds' own shader, not the water, not what stays out: userData.noCloud); computed per vertex (highp: phones' mediump fragments
     cannot hold world coordinates; the blobs are 100-300 m, the vertices at most ~10 m apart), applied to the lit colour before the
     fog. World.update drifts them with the wind (~4 m/s towards the north-east); Render sets their strength for the weather (none
     under the rain's overcast). The uniforms are shared by every build (one world at a time) ---- */
  const CLOUD_S = 110, CLOUD_NP = 64;   // noise cell (m) and its period in cells (the drift offset wraps without a seam)
  const CLOUD_O = { value: new THREE.Vector2() }, CLOUD_K = { value: 0.16 };
  const CLOUD_TH = { pikes: 0.18, ouni: 0.18, vrsic: 0.16, caracoles: 0.15, katu: 0.18, nring: 0.22, spa: 0.22, forest: 0.14, italia: 0.14, kamp: 0.14, maunakea: 0 };   // how much a cloud darkens, per theme (else 0.2; Mauna Kea: above the clouds, none overhead)
  const CLOUD_VH = '#include <common>\nuniform vec2 clO;\nuniform float clK;\nvarying float vCloud;\n' +
    'float clHash(vec2 i, float n) { i = mod(i, n); return fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'float clVN(vec2 p, float n) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(clHash(i, n), clHash(i + vec2(1.0, 0.0), n), f.x), mix(clHash(i + vec2(0.0, 1.0), n), clHash(i + 1.0, n), f.x), f.y); }';
  const CLOUD_VB = '#include <project_vertex>\nvec4 clW = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nclW = instanceMatrix * clW;\n#endif\n' +
    'vec2 clQ = ( modelMatrix * clW ).xz / ' + CLOUD_S.toFixed(1) + ' - clO;\n' +
    'float clN = 0.65 * clVN( clQ, ' + CLOUD_NP.toFixed(1) + ' ) + 0.35 * clVN( clQ * 2.0 + vec2( 17.0, 5.0 ), ' + (CLOUD_NP * 2).toFixed(1) + ' );\n' +
    'vCloud = 1.0 - clK * smoothstep( 0.53, 0.66, clN );';
  function clouds(root, out, tex) {
    CLOUD_K.value = CLOUD_TH[THEME] != null ? CLOUD_TH[THEME] : 0.2;
    const patch = (m) => {
      if (m.userData.cloud || m.userData.noCloud || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial) || m.map === tex.water) return;   // (lakes and seas: a few huge triangles)
      const prev = m.onBeforeCompile, key = 'cloud|' + m.customProgramCacheKey(); m.userData.cloud = true;   // (its own programs, the same on every rebuild)
      m.onBeforeCompile = (sh, r) => {
        prev.call(m, sh, r);
        sh.uniforms.clO = CLOUD_O; sh.uniforms.clK = CLOUD_K;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', CLOUD_VH).replace('#include <project_vertex>', CLOUD_VB);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vCloud;').replace('#include <fog_fragment>', 'gl_FragColor.rgb *= vCloud;\n#include <fog_fragment>');
      };
      m.customProgramCacheKey = () => key; m.needsUpdate = true;
    };
    const walk = (o) => { if (o.name === 'crowds') return; if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch); o.children.forEach(walk); };
    walk(root);
    out.dyn.clouds = { O: CLOUD_O, K: CLOUD_K, k0: CLOUD_K.value };
    return out;
  }

  /* ---- tyre marks (every tarmac track): dark streaks of rubber where the cars brake hard for the corners and where they power out of
     them, along the racing line (left and right wheels, a few cars' worth, each a little off the others), faded at their ends. Found from
     a speed profile of the lap: a braking zone is where the pace falls by 8 m/s or more; the marks darken towards its end, the exit marks
     start at the slowest point. Decal meshes (one per 256 m cell: only the marks near the view are drawn) just above the road (under
     the kerbs), drawn like the skid marks of the race ---- */
  function tyreMarks(root) {
    if (T.def.roadSurface === 'makadam' || !T.rl) return;
    const N = T.N, ds = T.ds, open = T.open, v = T.speedProfile(16.5, 13, 85), R = rng(515), bk = { dy: 0, sl: 0 }, cells = new Map();
    const cell = (p) => { const k = Math.floor(p[0] / 256) + ',' + Math.floor(p[2] / 256); let g = cells.get(k); if (!g) cells.set(k, g = new GB(false, true)); return g; };
    const at = (k) => (open ? Math.max(0, Math.min(N - 1, k)) : ((k % N) + N) % N);
    const HYi = (i) => (T.hasElev ? T.hy[i] : 0);
    const deck = (i) => { for (const c of T.cross || []) { const d = Math.abs(i - c.up); if (Math.min(d, N - d) * ds < c.upZ + 30) return true; } return false; };   // (a figure of eight: the bridge fades out while the car drives under it, no marks on it)
    const streak = (i0, n, off, wd, a0, grow) => {   // n samples from i0, 'off' m from the racing line, alpha a0 (grow: darker towards the end)
      let prev = null;
      for (let k = 0; k <= n; k++) {
        const i = at(i0 + k), f = k / n, a = a0 * Math.min(1, f / 0.2, (1 - f) / 0.12) * (grow ? 0.45 + 0.55 * f : 1);
        if (deck(i) || (T.sf && T.sf[i] !== 0)) { prev = null; continue; }   // (a stage of mixed surfaces: rubber on its tarmac only)
        const o = T.rl[i] + off + Math.sin(i * 0.37 + off * 3) * 0.08, lim = (T.wa ? T.wa[i] : T.w) - 0.25; if (Math.abs(o) > lim) { prev = null; continue; }
        const y = (q) => { let h = HYi(i) + 0.03; if (T.bank) h += T.bankAt(i * ds, q, bk).dy; return h; };
        const l = [T.px[i] + T.nx[i] * (o - wd), y(o - wd), T.pz[i] + T.nz[i] * (o - wd)], r = [T.px[i] + T.nx[i] * (o + wd), y(o + wd), T.pz[i] + T.nz[i] * (o + wd)];
        if (prev && prev.a + a > 0.01) cell(l).quadUp(prev.l, prev.r, r, l, [[0.05, 0.05, 0.06, prev.a], [0.05, 0.05, 0.06, prev.a], [0.05, 0.05, 0.06, a], [0.05, 0.05, 0.06, a]]);
        prev = { l, r, a };
        if (open && i0 + k >= N - 1) break;
      }
    };
    const cars = (i0, n, a0, grow, spread) => {   // two to four cars' worth of marks: each a pair of wheels, a little off the others, shorter or longer
      const m = 2 + Math.floor(R() * 3);
      for (let c = 0; c < m; c++) {
        const lat = (R() - 0.5) * spread, s0 = Math.floor(R() * n * 0.35), len = Math.max(6, Math.floor(n * (0.5 + R() * 0.5)) - s0), a = a0 * (0.6 + R() * 0.5);
        for (const w of [-0.78, 0.78]) streak(i0 + s0, len, lat + w, 0.13, a, grow);
      }
    };
    // braking zones: runs of falling pace from a fast approach to a corner's slowest point (lap samples; an open road from its start)
    const falls = (k) => v[at(k + 1)] < v[at(k)] - 0.005;
    for (let i = 0; i < (open ? N - 1 : N); i++) {
      if (!falls(i) || ((i > 0 || !open) && falls(i - 1))) continue;   // (only the first sample of a run of falling pace)
      let j = i; while (j - i < N / 2 && (!open || j < N - 1) && falls(j)) j++;
      const drop = v[i] - v[at(j)], n = j - i;
      if (drop < 8 || n < 6) continue;
      const nb = Math.min(n, Math.round(60 / ds));   // (the last 60 m of the braking)
      cars(j - nb, nb, Math.min(0.42, 0.18 + drop * 0.012), true, 0.9);
      const ne = Math.round((14 + Math.min(20, drop)) / ds);   // exit marks: from the slowest point, lighter, a bit wider spread (the cars slide out)
      if (R() < 0.8) cars(j, ne, 0.2, false, 1.4);
    }
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    for (const g of cells.values()) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), mat); m.name = 'tyremarks'; m.renderOrder = 1; m.matrixAutoUpdate = false; root.add(m); }
  }
  /* ---- the wear of a tarmac road (every world but the gravel ones and Pikes Peak, at the end of the build as the tyre marks): patches of newer (darker) or older
     (greyer) asphalt with their sealed seams, sealed cracks (dark tar bands: a long one with branches, or a network; many on the Nordschleife and
     the mountain road, fewer in the streets, a few on a modern circuit), and on a circuit the rubber
     laid down along the racing line in the two tyre tracks, darkest where the cars brake and turn. Decals just over the road in the road's own
     colour (lit, its shadows on them; the rain darkens them with it: userData.wear), indexed, in 256 m chunks (culled) ---- */
  // ROAD DECAL ORDER (renderOrder; each transparent and not written to the depth buffer, so this order alone decides what lies on what, at the
  // post target's 16-bit depth and the canvas' 24-bit alike; each still depth-tested: a car or a kerb in front hides it):
  //   0.25 the drying line (Render) < 0.4 a builder's own patches (Longford) < 0.45 the decal atlas (Nordschleife, Red Bull Ring & co.)
  //   < 0.5 the road's wear < 0.75 a builder's covers, grates and paint (Harju, Detroit) < 1 the baked tyre marks (the blob shadows, the
  //   lights; the rain's puddles, faded where the drying line has dried: Render's buildPuddles) < 1.5 the crowds' shade strips (crowdLayer:
  //   multiplied over whatever lies under them) < 2 the live tyre marks (Render's Skids; a road surface over the track's height lifts them:
  //   world.markLift, Detroit) < 4 and up: smoke, dust, particles (Longford's puffs, Spa's smoke, Render's particles), over the road and the
  //   marks behind them. Anything transparent that does not write depth and can stand in front of the road belongs above 2, never at 0.
  const ROAD_WEAR = { nring: 1, vrsic: 1, caracoles: 0.8, monaco: 0.75, city: 0.75, harju: 1 };   // per theme (else a modern circuit's: 0.3, an open road's: 0.8, as Los Caracoles; Harju's old town streets as worn as the Nordschleife, and twice as often again: roadWear's sp)
  function roadWear(o, tex) {
    if ((T.def.roadSurface === 'makadam' && !(T.def.wearPaved && T.pavedAt)) || THEME === 'pikes' || !T.rl || !tex.wear) return;   // (Pikes Peak's road has its own cracks and patches; a gravel road with def.wearPaved: only its asphalt worn)
    const N = T.N, ds = T.ds, w = T.w, len = T.len, open = T.open, R = rng(4242), bk = { dy: 0, sl: 0 }, cells = new Map(), lim = w - 0.6;
    const kw = ROAD_WEAR[THEME] != null ? ROAD_WEAR[THEME] : open ? 0.8 : 0.3;   // (how worn: the gaps between the patches and cracks grow as it falls)
    const at = (k) => (open ? clamp(k, 0, N - 1) : ((k % N) + N) % N), HYi = (i) => (T.hasElev ? T.hy[i] : 0);
    // (a stage of several widths and surfaces, Track.wa / sf (Harju): its own width at each sample, and only its tarmac worn, not the gravel or the cobbles)
    const wAt = (i) => (T.wa ? T.wa[i] : w), limAt = (i) => (T.wa ? T.wa[i] - 0.6 : lim), bare = (s) => (!!T.sf && T.sf[at(Math.round(s / ds))] !== 0) || (!!T.def.wearPaved && !T.pavedAt[at(Math.round(s / ds))]);
    const sp = T.sf ? 0.5 : 1;   // (and a stage through a town, its streets patched and cracked twice as often)
    const deck = (i) => { for (const c of T.cross || []) { const d = Math.abs(i - c.up); if (Math.min(d, N - d) * ds < c.upZ + 30) return true; } return false; };   // (Suzuka's bridge fades out while the car drives under it)
    const chunk = (p) => { const k = Math.floor(p[0] / 256) + ',' + Math.floor(p[2] / 256); let c = cells.get(k); if (!c) cells.set(k, c = { P: [], C: [], U: [], I: [] }); return c; };
    const vtx = (c, p, col, uv) => { c.P.push(p[0], p[1], p[2]); c.C.push(col[0], col[1], col[2], col[3]); c.U.push(uv[0], uv[1]); return c.P.length / 3 - 1; };
    const face = (c, a, b, d) => {   // a triangle facing up
      const P = c.P, ux = P[b * 3] - P[a * 3], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[d * 3] - P[a * 3], vz = P[d * 3 + 2] - P[a * 3 + 2];
      if (uz * vx - ux * vz > 0) c.I.push(a, b, d); else c.I.push(a, d, b); };
    const pt = (s, lo) => {   // on the road at s (m along the lap), lo (m across), just over the surface
      const f = s / ds, i0 = Math.floor(f), t = f - i0, i = at(i0), j = at(i0 + 1), L = (A) => A[i] + (A[j] - A[i]) * t;
      let y = HYi(i) + (HYi(j) - HYi(i)) * t + 0.035; if (T.bank) y += T.bankAt(s, lo, bk).dy;
      return [L(T.px) + L(T.nx) * lo, y, L(T.pz) + L(T.nz) * lo]; };
    const decal = (s, lo, hl, hw, rot, u0, v0, u1, v1, col) => {   // centre (s, lo), half length and width along and across the road, turned by rot; an atlas cell
      const cs = Math.cos(rot), sn = Math.sin(rot), Q = [[-hl, -hw, u0, v0], [hl, -hw, u1, v0], [hl, hw, u1, v1], [-hl, hw, u0, v1]].map(([a, b, u, v]) => [pt(s + a * cs - b * sn, lo + a * sn + b * cs), [u, v]]);
      const c = chunk(Q[0][0]), k = Q.map(q => vtx(c, q[0], col, q[1])); face(c, k[0], k[1], k[2]); face(c, k[0], k[2], k[3]); };
    // patches, every 40-100 m, more often in a wheel track than not
    for (let s = R() * 50; s < len - 6; s += (40 + R() * 60) * sp / Math.sqrt(kw)) {
      const i = at(Math.round(s / ds)); if (deck(i) || bare(s)) continue;
      const li = limAt(i), hl = 0.8 + R() * 1.8, hw = 0.5 + R() * 1.1, lo = clamp((R() < 0.6 ? T.rl[i] + (R() < 0.5 ? -0.78 : 0.78) : (R() * 2 - 1) * wAt(i)) + (R() - 0.5) * 0.6, -li + hw, li - hw), k = R() < 0.55 ? 0.84 + R() * 0.08 : 1.04 + R() * 0.06;
      const rot = (R() - 0.5) * 0.08; if (bare(s - hl) || bare(s + hl)) continue;
      decal(s, lo, hl, hw, rot, 0.02, 0.02, 0.48, 0.48, [k, k, k * 1.01, 1]);
    }
    // sealed cracks (the texture's long strips are 8:1): across the road every 25-60 m, along it every 50-110 m, a network of them or one
    // with its branches every 120-260 m
    const strip = (s, lo, L, rot) => { const b = R() < 0.5; decal(s, lo, L / 2, L / 16, rot, 0.004, b ? 0.752 : 0.877, 0.996, b ? 0.873 : 0.998, [1, 1, 1, 0.8 + R() * 0.2]); };
    for (let s = R() * 40; s < len - 4; s += (25 + R() * 35) * sp / kw) {
      const i = at(Math.round(s / ds)); if (deck(i) || bare(s)) continue;
      const li = limAt(i), L = Math.min(2 * li, 3 + R() * (2 * li - 2)), lo = (R() * 2 - 1) * Math.max(0, li - L / 2);
      strip(s, lo, L, Math.PI / 2 + (R() - 0.5) * 0.3);
    }
    for (let s = R() * 60; s < len - 8; s += (50 + R() * 60) * sp / kw) {
      const i = at(Math.round(s / ds)); if (deck(i) || bare(s - 4.5) || bare(s) || bare(s + 4.5)) continue;
      strip(s, (R() * 2 - 1) * (limAt(i) - 0.5), 4 + R() * 5, (R() - 0.5) * 0.08);
    }
    for (let s = R() * 100; s < len - 4; s += (120 + R() * 140) * sp / kw) {
      const i = at(Math.round(s / ds)); if (deck(i) || bare(s - 2.2) || bare(s) || bare(s + 2.2)) continue;
      const h = 1.4 + R() * 0.8, lo = (R() * 2 - 1) * Math.max(0, limAt(i) - h * 1.12), net = R() < 0.5;
      decal(s, lo, h, h / 2, R() * TAU, net ? 0.002 : 0.502, 0.502, net ? 0.498 : 0.998, 0.748, [1, 1, 1, 0.8 + R() * 0.2]);
    }
    // the rubber on a circuit's racing line: two tyre tracks, a little everywhere, dark where the pace falls (braking) and where it is slow (the corners)
    if (!open) {
      const v = T.speedProfile(16.5, 13, 85), st = Math.max(1, Math.round(3 / ds)), a8 = Math.max(1, Math.round(8 / ds)), m15 = Math.max(1, Math.round(15 / ds));
      let vmax = 0; for (let i = 0; i < N; i++) vmax = Math.max(vmax, v[i]);
      const raw = new Float32Array(N), use = new Float32Array(N);
      for (let i = 0; i < N; i++) raw[i] = clamp((v[i] - v[at(i + a8)]) * 0.035 + (1 - v[i] / vmax) * 0.6, 0, 1);
      { let acc = 0; for (let k = -m15; k <= m15; k++) acc += raw[at(k)]; for (let i = 0; i < N; i++) { use[i] = acc / (2 * m15 + 1); acc += raw[at(i + m15 + 1)] - raw[at(i - m15)]; } }   // (smoothed over 30 m)
      for (const sd of [-1, 1]) {
        let prev = null;
        for (let k = 0; k <= N; k += st) {
          const i = at(k), cc = T.rl[i] + sd * 0.78;
          if (deck(i) || Math.abs(cc) > w - 0.5) { prev = null; continue; }
          const a = (0.1 + 0.46 * use[i]) * (0.8 + 0.4 * R()), row = [cc - 0.36, cc - 0.13, cc + 0.13, cc + 0.36].map(lo => pt(i * ds, lo)), c = chunk(row[1]);
          const put = (R4, al) => R4.map((p, q) => vtx(c, p, [0.07, 0.07, 0.08, q === 1 || q === 2 ? al : 0], [[0.53, 0.66, 0.84, 0.97][q], 0.25])), ids = put(row, a);
          if (prev && prev.c !== c) prev = { ids: put(prev.row, prev.a) };   // (into the next chunk: the last row again, so the strip goes on)
          if (prev) for (let q = 0; q < 3; q++) { face(c, prev.ids[q], prev.ids[q + 1], ids[q + 1]); face(c, prev.ids[q], ids[q + 1], ids[q]); }
          prev = { ids, c, row, a };
        }
      }
    }
    // the arrows into the pits (a circuit with pits): three painted on the road before the way in, on its side, each turned 20° towards the
    // lane and nearer the edge than the one before; old paint, faded and worn in streaks (the atlas' tyre streaks, along the arrow), so they
    // read as part of the road and not as a sign. (In the wear's own mesh: no draw call more)
    const AC = o.asphaltMat && o.asphaltMat.color, PIT = T.def.pit;
    if (PIT && !open) {
      const RA = rng(911), sd = PIT[0] < 0 ? -1 : 1, paint = [0.9, 0.9, 0.86].map((v, k) => Math.min(2, v / Math.max(0.3, AC ? [AC.r, AC.g, AC.b][k] : 1)));   // (the road's tint undone: the same paint on every road)
      const SH = [[-2.6, -0.17], [0.9, -0.17], [0.9, 0.17], [-2.6, 0.17]], HD = [[0.9, -0.68], [2.5, 0], [0.9, 0.68]];   // (the arrow along +u: its shaft, its head; m)
      for (let k = 0; k < 3; k++) {
        const s0 = T.startS + PIT[1] - 42 + 16 * k, i = at(Math.round(s0 / ds)); if (deck(i) || bare(s0)) continue;
        const lo = sd * (wAt(i) * 0.2 + (wAt(i) - 1.8 - wAt(i) * 0.2) * k / 2), rot = sd * 0.35, cs = Math.cos(rot), sn = Math.sin(rot);
        const P3 = (u, v) => pt(s0 + u * cs - v * sn, lo + u * sn + v * cs), UV = (u, v) => [0.55 + (v + 0.7) / 1.4 * 0.4, 0.04 + (u + 2.6) / 5.1 * 0.42];
        const col = () => paint.concat(0.34 + RA() * 0.14), c = chunk(P3(0, 0));
        const put = (L) => L.map(([u, v]) => vtx(c, P3(u, v), col(), UV(u, v)));
        const a = put(SH), b = put(HD); face(c, a[0], a[1], a[2]); face(c, a[0], a[2], a[3]); face(c, b[0], b[1], b[2]);
      }
    }
    const mat = new THREE.MeshLambertMaterial({ map: tex.wear, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    if (AC) mat.color.copy(AC);   // (the road's own tint)
    mat.userData.wear = true;
    for (const c of cells.values()) {
      if (!c.I.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c.C, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(c.U, 2));
      g.setIndex(c.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(c.I, 1) : new THREE.Uint16BufferAttribute(c.I, 1)); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.name = 'roadwear'; m.receiveShadow = true; m.renderOrder = 0.5; m.matrixAutoUpdate = false; o.root.add(m);   // (ROAD DECAL ORDER: after the drying line, before the covers and every tyre mark)
    }
  }
  /* ---- the grass of every world (at the end of its build): the meadow's own colour varies over tens of metres (lighter, darker, drier
     patches: world-space noise in the grass materials' shader, no extra draw calls), on the circuits' lawns the mower's stripes along the
     start straight (fading out far away, where they would shimmer), and along the verges of the circuits tufts of longer grass and
     flowers that sway in the wind (instanced chunks: only the ones in sight are drawn) ---- */
  const GRASS_GLSL = [
    'varying vec2 vGw; varying float vGd; uniform float uStr; uniform vec2 uSd; uniform float uNat;',
    'float gHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }',   // (no sine: steady on phones' GPUs)
    'float gNoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y); }'].join('\n');
  function grassLook(m, sd, nat) {
    if (!m || m.userData.grassLook) return; m.userData.grassLook = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uStr = { value: sd ? 1 : 0 }; sh.uniforms.uSd = { value: new THREE.Vector2(sd ? sd[0] : 1, sd ? sd[1] : 0) }; sh.uniforms.uNat = { value: nat || 0 }; sh.uniforms.uPat = m.userData.uPat || (m.userData.uPat = { value: 1 });   // (uPat: the patches' strength, 0 for one even meadow)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGw; varying float vGd;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvGw = (modelMatrix * vec4(transformed, 1.0)).xz; vGd = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GRASS_GLSL + '\nuniform float uPat;').replace('#include <color_fragment>', '#include <color_fragment>\n' + [
        '{ vec3 gc = diffuseColor.rgb; float gg = clamp((gc.g - max(gc.r, gc.b)) * 8.0, 0.0, 1.0);',   // (only where it is green: not the soil, the sand, the snow)
        '  if (gg > 0.0) {',
        '    float n1 = gNoise(vGw * 0.025) * 0.65 + gNoise(vGw * 0.07 + 13.1) * 0.35, n2 = gNoise(vGw * 0.045 + 57.3);',
        '    gc *= mix(1.0, 0.84 + 0.3 * n1, gg * uPat);',   // lighter and darker patches
        '    gc = mix(gc, gc * vec3(1.12, 1.04, 0.7), gg * smoothstep(0.62, 0.95, n2) * 0.6 * uPat);',   // drier, yellower ones
        // clumps a metre or two across, lighter and darker (near the camera: far away they would shimmer)
        '    float cl = gNoise(vGw * 0.55 + 3.7) * 0.6 + gNoise(vGw * 1.7 + 9.1) * 0.4;',
        '    gc *= 1.0 + gg * (cl - 0.5) * 0.22 * (1.0 - smoothstep(70.0, 160.0, vGd));',
        '    if (uStr > 0.0) { float f = fract(dot(vGw, uSd) * 0.0909), b = smoothstep(0.03, 0.1, f) - smoothstep(0.53, 0.6, f);',   // the mower's stripes, 5.5 m wide
        '      gc *= 1.0 + gg * uStr * (b - 0.5) * 0.25 * (1.0 - smoothstep(140.0, 300.0, vGd)); }',
        // a natural green where the lawn's is loud (Spa, Suzuka, Jezero, the Nordschleife): less saturated, a touch of olive
        '    if (uNat > 0.0) { float L = dot(gc, vec3(0.3, 0.59, 0.11)); gc = mix(gc, mix(vec3(L), gc, 0.72) * vec3(1.04, 0.96, 0.86), gg * uNat); }',
        '    diffuseColor.rgb = gc; } }'].join('\n'));
    };
    m.customProgramCacheKey = () => 'grassLook' + (sd ? 'S' : '') + (nat ? 'N' : '');
    m.needsUpdate = true;
  }
  const GRASS_NAT = { spa: 0.85, suzuka: 0.9, lake: 0.75, nring: 0.6, rbring: 0.45, bathurst: 0.7, cpalace: 0.6, riverside: 1, rio: 0.75, monterey: 1 };   // how much of the loud green to tone down, per theme
  function grassWorld(o, tex) {
    const lawn = !T.open && ['lake', 'forest', 'kamp', 'italia', 'rbring', 'cpalace'].includes(THEME);   // (the circuits whose lawns are mown in stripes; Spa and Suzuka lay their own)
    let sd = null; if (lawn) { const i = T.idx(T.startS); sd = [-T.tz[i], T.tx[i]]; }   // (the stripes run along the start straight)
    const nat = GRASS_NAT[THEME] || 0;
    o.root.traverse(m => { if (!m.isMesh || !m.material || Array.isArray(m.material)) return; const t = m.material.map; if (t && (t === tex.grass || t.grassPic)) grassLook(m.material, sd, nat); });
  }
  /* ---- worn grass where the cars run wide (the circuits): on the outside of a corner's exit, past the kerb, the lawn driven down to the
     soil in a long patch with the tracks of the tyres in it, and now and then on the inside of a slow corner's apex where they cut it;
     on the grass only (not the gravel, the run-off or the paths), clear of the barriers. One decal mesh, lit (its own atlas: 4 patches) ---- */
  let wornTexC = null;
  function wornTex() {   // 2 x 2 cells of 128 px (across the patch x along it): soil and flattened grass in a ragged blot, two with tyre tracks
    if (wornTexC) return wornTexC;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(7713);
    const n1 = valueNoise2(7714, 9), n2 = valueNoise2(7715, 3), n3 = valueNoise2(7716, 1.4);
    for (let cell = 0; cell < 4; cell++) {
      const ox = (cell % 2) * 128, oy = Math.floor(cell / 2) * 128, tracks = cell >= 2, ph = r() * 50;
      for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
        const u = (i - 64) / 56, v = (j - 64) / 60, R = Math.sqrt(u * u * (1 + 0.6 * v * v) + v * v * v * v * 0.9), e = 0.78 + 0.32 * n1(i + ph, j * 0.4 + ph) + 0.14 * n2(i + ph, j + ph);   // (a long blot, ragged)
        let a = sstep(e + 0.06, e - 0.22, R) * (0.55 + 0.45 * n2(i * 0.7 + ph, j * 0.7));
        const soil = sstep(0.42, 0.7, n2(i + 17 + ph, j * 0.6) * 0.6 + n3(i + ph, j + ph) * 0.4 + (1 - R) * 0.25);
        let cr = lerp(0.38, 0.45, soil), cg = lerp(0.47, 0.35, soil), cb = lerp(0.2, 0.23, soil);   // flattened yellowed grass .. soil
        if (tracks) { const t = Math.min(Math.abs(i - 44 - 6 * Math.sin(j / 30 + ph)), Math.abs(i - 84 - 6 * Math.sin(j / 30 + ph))); const k = sstep(7, 2, t); cr = lerp(cr, 0.3, k); cg = lerp(cg, 0.26, k); cb = lerp(cb, 0.18, k); a = Math.max(a, k * sstep(e + 0.3, e - 0.1, R) * 0.9); }
        const sp = r(), q = sp < 0.04 ? 1.25 : sp < 0.08 ? 0.75 : 1;   // (clods and green blades)
        const o = ((oy + j) * S + ox + i) * 4; d[o] = Math.round(cr * q * 255); d[o + 1] = Math.round(cg * q * 255); d[o + 2] = Math.round(cb * q * 255); d[o + 3] = Math.round(clamp(a, 0, 1) * 235);
      }
    }
    x.putImageData(img, 0, 0); wornTexC = new THREE.CanvasTexture(c); wornTexC.anisotropy = 4; return wornTexC;
  }
  function wornGrass(o) {
    if (T.open || !T.corners || !T.rl || ['city', 'monaco', 'forest', 'kamp', 'italia'].includes(THEME) || T.def.offSurface) return;   // (the stylised circuits: their orange strips past the kerbs are not grass)
    const N = T.N, ds = T.ds, R = rng(7720), q = {}, gh = o.groundH, P = [], C = [], U = [], I = [];
    const at = (k) => ((k % N) + N) % N;
    const patch = (i0, len, side, d, hw, cell) => {   // from sample i0 along the road for len m, centred d m out on that side, hw m half wide
      const n = Math.max(2, Math.round(len / 2)), ic = at(i0 + Math.round(len / 2 / ds)), xc = T.px[ic] + T.nx[ic] * d * side, zc = T.pz[ic] + T.nz[ic] * d * side;
      if (T.surface(T.query(xc, zc, ic, q)) !== 2) return;   // (on the grass only)
      for (const f of [0, 0.5, 1]) { const i = at(i0 + Math.round(f * len / ds)), bar = side > 0 ? T.br[i] : T.bl[i]; if (bar < d + hw + 0.6) return; }   // (clear of the barrier)
      const u0 = (cell % 2) * 0.5 + 0.01, v0 = 1 - Math.floor(cell / 2) * 0.5 - 0.01, a = 0.75 + 0.25 * R();
      for (let k = 0; k <= n; k++) {
        const i = at(i0 + Math.round(k / n * len / ds)), v = v0 - 0.48 * k / n;
        for (const e of [-1, 1]) {
          const dd = (d + e * hw) * side, x = T.px[i] + T.nx[i] * dd, z = T.pz[i] + T.nz[i] * dd, y = (gh ? gh(x, z) : (T.hasElev ? T.hy[i] : 0)) + 0.04;
          P.push(x, y, z); C.push(1, 1, 1, a); U.push(u0 + (e > 0 ? 0.48 : 0), v);
        }
        if (k) { const b = P.length / 3 - 4; I.push(b, b + 1, b + 3, b, b + 3, b + 2); }
      }
    };
    for (const c of T.corners) {
      const ia = at(Math.round((c.i0 + (c.i1 >= c.i0 ? c.i1 : c.i1 + N)) / 2)), m = Math.max(2, Math.round(12 / ds)), A = at(ia - m), B = at(ia + m);
      const inS = Math.sign(((T.px[A] + T.px[B]) / 2 - T.px[ia]) * T.nx[ia] + ((T.pz[A] + T.pz[B]) / 2 - T.pz[ia]) * T.nz[ia]) || 1, out = -inS;   // (the inside: towards the chord's middle)
      const kerb = (i) => (T.curb[i] ? T.curbW : 0.4);
      for (let n = c.sev >= 2 ? 2 : 1; n > 0; n--) {   // the exit, past the kerb on the outside, where they run wide
        if (R() > 0.85) continue;
        const i0 = at(c.i1 + Math.round((-4 + R() * 22) / ds)), hw = 0.7 + R() * 0.9;
        patch(i0, 6 + R() * 12, out, T.w + kerb(i0) + 0.2 + hw + R() * 1.2, hw, Math.floor(R() * 4));
      }
      if (c.sev >= 2 && R() < 0.4) { const i0 = at(ia - Math.round(4 / ds)), hw = 0.5 + R() * 0.5; patch(i0, 5 + R() * 5, inS, T.w + kerb(ia) + 0.1 + hw, hw, Math.floor(R() * 2)); }   // the apex cut
    }
    if (!I.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    // (facing up, whichever way the road runs: each quad's winding checked)
    for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, e = I[t + 2] * 3; if ((P[b] - P[a]) * (P[e + 2] - P[a + 2]) - (P[b + 2] - P[a + 2]) * (P[e] - P[a]) > 0) { const k = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = k; } }
    g.setIndex(I); g.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ map: wornTex(), vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });
    const m = new THREE.Mesh(g, mat); m.name = 'worn'; m.receiveShadow = true; m.renderOrder = 1; m.matrixAutoUpdate = false; o.root.add(m);
  }
  let tuftGeoC = null;
  function tuftGeo(flower) {   // (1 m wide, 1 m tall, scaled per instance) a clump of longer grass: a low mound with broad blades leaning out round it
    // (from above a rosette, not a few lines), its colours shades of the lawn under it (the instance colour: the lawn's own); or a few
    // wild flowers: green stems with white, yellow and violet heads (their own colours)
    if (!tuftGeoC) tuftGeoC = [];
    if (tuftGeoC[+flower]) return tuftGeoC[+flower];
    const P = [], C = [], N = [], put = (c, n) => { for (let q = 0; q < n; q++) C.push(c[0], c[1], c[2]); };
    if (!flower) {
      const D = [0.64, 0.66, 0.6], M = [0.8, 0.82, 0.76], TIP = [1.16, 1.12, 0.9];
      for (let k = 0; k < 7; k++) {   // the mound
        const a0 = k / 7 * TAU, a1 = (k + 1) / 7 * TAU;
        P.push(0, 0.3, 0, Math.cos(a0) * 0.36, 0.02, Math.sin(a0) * 0.36, Math.cos(a1) * 0.36, 0.02, Math.sin(a1) * 0.36); put(M, 1); put(D, 2);
      }
      for (let k = 0; k < 8; k++) {   // the blades
        const a = k / 8 * TAU + (k % 2) * 0.35, lean = 0.36 + 0.07 * (k % 3), h = 0.72 + 0.14 * ((k * 5) % 3), w = 0.09;
        const bx = Math.cos(a) * 0.12, bz = Math.sin(a) * 0.12, px = -Math.sin(a) * w, pz = Math.cos(a) * w, tx = Math.cos(a) * (0.12 + lean), tz = Math.sin(a) * (0.12 + lean);
        P.push(bx - px, 0.05, bz - pz, bx + px, 0.05, bz + pz, tx, h, tz); put(D, 2); put(TIP, 1);
      }
    } else {
      const FL = [[0.97, 0.96, 0.92], [0.99, 0.85, 0.16], [0.66, 0.44, 0.9]], ST = [0.26, 0.42, 0.13];
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * TAU + 0.4, r = 0.18 + 0.1 * k, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.62 + 0.18 * k, c = FL[k], sz = 0.17;
        P.push(x - 0.03, 0, z, x + 0.03, 0, z, x, h, z); put(ST, 3);   // the stem
        P.push(x - sz, h, z, x + sz, h, z, x, h + sz * 1.3, z, x, h, z - sz, x, h, z + sz, x, h + sz * 1.3, z); put(c, 6);   // the head: two crossed petals
      }
    }
    for (let q = 0; q < P.length / 3; q++) N.push(0, 1, 0);   // (lit like the ground under them; the seasons paint them as ground, not leaves)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.computeBoundingSphere();
    return (tuftGeoC[+flower] = g);
  }
  function texAvg(t) {   // the average colour of a grass picture, 0..1: as its maker measured it (t.avgCol; reading a canvas back would stall the build)
    return (t && t.avgCol) || [0.35, 0.53, 0.23];
  }
  function pixAvg(d) { const s = [0, 0, 0]; for (let o = 0; o < d.length; o += 4) { s[0] += d[o]; s[1] += d[o + 1]; s[2] += d[o + 2]; } const n = d.length / 4 * 255; return [s[0] / n, s[1] / n, s[2] / n]; }   // (of an ImageData's pixels)
  const LAWN = { nring: [0.92, 0.95, 0.82], spa: [0.95, 1.0, 0.95], rbring: [0.96, 1.0, 0.9], suzuka: [0.95, 1.0, 0.92], bathurst: [1.0, 1.0, 0.86], cpalace: [0.96, 1.0, 0.88], rio: [0.93, 1.0, 0.86], monterey: [1.04, 0.96, 0.78] };   // (the corridor builders' lawns: their vertex colours, roughly)
  function tuftWindMat(W) {   // the clumps' material (the verges' tufts, Los Caracoles' bunch grass): vertex colours, the blades bent by the wind (W: World's dyn.wind)
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = W;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.16;\ntransformed.x += wK * sin(uWind * 2.1 + wPh);\ntransformed.z += wK * 0.7 * sin(uWind * 1.63 + wPh * 1.3);');
      // (both faces lit as the front one: the normals point up, the blades are thin, seen from above half of them are back faces)
      sh.fragmentShader = sh.fragmentShader.replace('( gl_FrontFacing ) ? vIndirectFront : vIndirectBack', 'vIndirectFront').replace('( gl_FrontFacing ) ? vLightFront : vLightBack', 'vLightFront');
    };
    mat.customProgramCacheKey = () => 'tuftWind';
    return mat;
  }
  function verge(o) {
    if (T.open || ['city', 'monaco', 'newcastle'].includes(THEME)) return;
    const mat = tuftWindMat(o.dyn.wind || (o.dyn.wind = { value: 0 }));
    const tu = new IChunks(tuftGeo(false), mat, 160), fl = new IChunks(tuftGeo(true), mat, 160), q = {}, gH = o.groundH;
    // the lawn's colour under a clump: the ground mesh's vertex colour there (the default builder's grid) or the corridor builder's, times the grass picture's
    let gm = null; o.root.traverse(m => { if (!gm && m.isMesh && m.material && !Array.isArray(m.material) && m.material.userData.grassLook) gm = m.material; });
    const avg = texAvg(gm && gm.map), mc = gm ? gm.color : { r: 1, g: 1, b: 1 }, G = o.gGrid, gc = o.ground && o.ground.geometry && o.ground.geometry.attributes.color, TL = LAWN[THEME] || [1, 1, 1];   // (a corridor builder's ground is a group: its lawn TL)
    const lawn = (x, z) => {
      let r = TL[0], g = TL[1], b = TL[2];
      if (G && gc) { const i = clamp(Math.round((x - G.x0) / G.cell), 0, G.nx), j = clamp(Math.round((z - G.z0) / G.cell), 0, G.nz), k = (j * (G.nx + 1) + i) * 3; r = gc.array[k]; g = gc.array[k + 1]; b = gc.array[k + 2]; }
      const c = [r * avg[0] * mc.r, g * avg[1] * mc.g, b * avg[2] * mc.b], nat = GRASS_NAT[THEME] || 0;
      if (nat) { const gg = clamp((c[1] - Math.max(c[0], c[2])) * 8, 0, 1) * nat, Lm = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11, f = [1.04, 0.96, 0.86];   // (as the lawn's shader tones it down: grassLook)
        for (let k = 0; k < 3; k++) c[k] = lerp(c[k], (Lm + (c[k] - Lm) * 0.72) * f[k], gg); }
      return c;
    };
    const L = T.len;
    for (let s = 0; s < L; s += 2.2) for (const side of [-1, 1]) {
      const i = T.idx(s), h0 = crH(s, side, 5);
      if (h0 < 0.14) continue;   // (gaps)
      const bar = T.br ? (side > 0 ? T.br[i] : (T.bl ? T.bl[i] : T.w + 8)) : T.w + 8, d0 = T.w + 2.0, d1 = Math.min(bar - 0.7, T.w + 13);
      if (d1 < d0 + 0.3) continue;
      const d = d0 + (d1 - d0) * Math.pow(crH(s, side, 6), 1.6), x = T.px[i] + T.nx[i] * d * side, z = T.pz[i] + T.nz[i] * d * side;
      if (T.surface(T.query(x, z, i, q)) !== 2) continue;   // (on the grass only: not on the gravel, the run-off, the paths)
      const y = (gH ? gH(x, z) : (T.hasElev && T.hy ? T.hy[i] : 0)) - 0.02, u = crH(x, z, 7), g = 0.9 + 0.2 * crH(x, z, 8), lc = lawn(x, z);
      tu.add(x, y, z, u * 26, 0.9 + 0.8 * crH(x, z, 9), 0.34 + 0.3 * crH(x, z, 10), [lc[0] * g, lc[1] * g, lc[2] * g]);
      if (u < 0.2) { const f = 0.85 + 0.15 * crH(x, z, 11); fl.add(x + 0.2, y, z - 0.1, u * 41, 0.8 + 0.3 * crH(x, z, 12), 0.5 + 0.2 * crH(x, z, 13), [f, f, f]); }
    }
    const grp = new THREE.Group(); grp.name = 'verge'; o.root.add(grp);
    const n1 = tu.addTo(grp, false); grp.traverse(m => { if (m.isInstancedMesh && m.instanceColor) m.instanceColor.ground = true; });   // (the seasons paint the clumps as grass: straw in the autumn, not red leaves)
    o.nTufts = n1 + fl.addTo(grp, false);
  }
  /* the grandstands' seated crowd (the crowd picture, Tex.crowdPic: 8 rows of 32 people): every tier of a stand shows one row of people, 32
     of them to 12 m (uCV: how the stand's uvs lie, crowdUV), each bobbing a little in their seat; near the followed car, and all round it
     after an overtake and at the finish (uHype, set by Render), they jump and flags go up, waving. The stands' own material, patched: the
     picture sampled per tier, a little up or down for each person (a hash of the person) */
  const STAND_FS = ['#ifdef USE_MAP',
    'float crT = floor(vUv.y / uCV.y + 1e-4), crL = clamp((vUv.y - crT * uCV.y) / uCV.z, 0.0, 1.0), crX = vUv.x * uCV.x * 32.0;',   // the tier, where across it (1: the back), the seat along it
    'vec2 crI = vec2(floor(crX), crT), crF = vec2(fract(crX), crL);',
    'float crH = fract(sin(dot(crI, vec2(12.9898, 78.233))) * 43758.5453), crH2 = fract(crH * 41.37 + 0.13), crD = length(vCrW.xz - uCar.xz);',
    'float crEx = max((1.0 - smoothstep(16.0, 60.0, crD)) * 0.7, uHype * (1.0 - smoothstep(60.0, 200.0, crD)));',
    'float crJ = max(0.0, sin(uTime * (6.0 + 3.0 * crH) + crH * 6.283)) * (0.5 + 2.6 * crEx * step(0.3, crH));',   // (a jump, in pixels of the picture)
    'float crR = mod(crT, 8.0) / 8.0;',
    'vec4 texelColor = texture2D( map, vec2(vUv.x * uCV.x, max(crR + crL / 8.0 - crJ / 256.0, crR + 0.002)) );',
    'if (crH2 < 0.015 + 0.3 * crEx) {',   // a flag held up in front of the face, waving (red, blue, yellow or green, a white stripe)
    '  float crW = 0.07 * sin(crF.x * 6.0 - uTime * 9.0 + crH * 20.0);',
    '  if (crF.y > 0.46 + crW && crF.y < 0.98 && crF.x > 0.04 && crF.x < 0.98) { float fk = floor(fract(crH * 7.3) * 4.0);',
    '    vec3 fa = fk < 0.5 ? vec3(0.9, 0.12, 0.12) : fk < 1.5 ? vec3(0.1, 0.3, 0.8) : fk < 2.5 ? vec3(0.98, 0.8, 0.1) : vec3(0.1, 0.55, 0.25);',
    '    texelColor = vec4(abs(crF.y - 0.72 - crW * 0.5) < 0.08 ? vec3(0.95) : fa * (0.85 + 0.3 * crW / 0.07 * 0.5), 1.0); }',
    '}',
    'texelColor = mapTexelToLinear( texelColor );', 'diffuseColor *= texelColor;', '#endif'].join('\n');
  function crowdUV(m, u, pitch, slice) { m.userData.crowdUV = [u, pitch, slice]; return m; }   // (a stand material: how its uvs lay the crowd picture on the tiers)
  function crowdStands(o) {
    let U = o.dyn.crowd;
    o.root.traverse(m => {
      const M = m.isMesh && !m.isInstancedMesh && m.material; if (!M || Array.isArray(M) || !M.map || !M.map.crowdPic || !M.isMeshLambertMaterial || M.userData.stand) return;
      if (!U) U = o.dyn.crowd = { uTime: { value: 0 }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uHype: { value: 0 } };
      if (!U.uHype) U.uHype = { value: 0 };
      if (!fansOn() && M.map.crowdArgs) M.map = ownRnd(() => Tex.crowdHi(...M.map.crowdArgs));   // (the real tracks: the stands' people the only ones left, drawn finer)
      M.userData.stand = true; const cv = M.userData.crowdUV || [1, 1 / 16, 1 / 16], uCV = { value: new THREE.Vector3(cv[0], cv[1], cv[2]) };   // (how the stand maps the picture: see crowdUV)
      M.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = U.uTime; sh.uniforms.uCar = U.uCar; sh.uniforms.uHype = U.uHype; sh.uniforms.uCV = uCV;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCrW;').replace('#include <project_vertex>', '#include <project_vertex>\nvCrW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec3 uCar;\nuniform float uHype;\nuniform vec3 uCV;\nvarying vec3 vCrW;').replace('#include <map_fragment>', STAND_FS);
      };
      M.customProgramCacheKey = () => 'standCrowd';
    });
  }
  /* ---- soft contact shading (ambient occlusion), every world at the end of its build: at the foot of a wall, a barrier, a building, a
     stand, a tyre stack or a trunk, the ground darker, fading out over a metre or so (less by a low one): a decal strip along the foot of
     every upright face of the world's meshes that stands on the ground (found from their triangles, once), on the ground's own height,
     in 256 m chunks (culled). Drawn black over the ground, fading into the fog with it ---- */
  let aoTexC = null;
  function aoTex() {   // across the strip: dark at the foot, fading out (the strip's far side clear)
    if (aoTexC) return aoTexC;
    const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'), img = x.createImageData(4, 64);
    for (let j = 0; j < 64; j++) { const t = j / 63, a = Math.round(255 * Math.pow(1 - t, 1.5)); for (let i = 0; i < 4; i++) { const o = (j * 4 + i) * 4; img.data[o + 3] = a; } }
    x.putImageData(img, 0, 0); aoTexC = new THREE.CanvasTexture(c); aoTexC.wrapS = aoTexC.wrapT = THREE.ClampToEdgeWrapping; return aoTexC;
  }
  function aoWorld(o, tex) {
    const gh0 = o.groundH; if (!gh0) return;
    const ghC = new Map(), gh = (x, z) => { const k = Math.round(x * 8) * 1048576 + Math.round(z * 8); let h = ghC.get(k); if (h === undefined) ghC.set(k, h = gh0(x, z)); return h; };   // (neighbouring strips share their corners)
    o.root.updateMatrixWorld(true);
    const cells = new Map(), chunk = (x, z) => { const k = Math.floor(x / 256) + ',' + Math.floor(z / 256); let c = cells.get(k); if (!c) cells.set(k, c = { P: [], C: [], U: [], I: [] }); return c; };
    const V = new Float64Array(9);
    const strip = (x0, y0, z0, x1, y1, z1, ox, oz, h) => {   // the foot (x0..x1), the face's outward level normal, its height
      const g0 = gh(x0, z0); if (y0 - g0 > 0.25 || y0 - g0 < -0.45) return;   // (not standing on the ground: a bridge, a roof, a balcony)
      const g1 = gh(x1, z1); if (y1 - g1 > 0.25 || y1 - g1 < -0.45) return;
      const d = clamp(h * 0.8, 0.35, 1.8), a = 0.46 * clamp(h / 1.2, 0.4, 1), x2 = x1 + ox * d, z2 = z1 + oz * d, x3 = x0 + ox * d, z3 = z0 + oz * d;
      const dg = gh((x0 + x1) / 2 + ox * d, (z0 + z1) / 2 + oz * d) - (g0 + g1) / 2;   // (the ground's fall across the strip, at its middle)
      const b0 = Math.max(y0, g0) + 0.03, b1 = Math.max(y1, g1) + 0.03, b2 = b1 + dg, b3 = b0 + dg;
      const c = chunk(x0, z0), n = c.P.length / 3, L = Math.hypot(x1 - x0, z1 - z0);
      c.P.push(x0, b0, z0, x1, b1, z1, x2, b2, z2, x3, b3, z3); c.C.push(0, 0, 0, a, 0, 0, 0, a, 0, 0, 0, a, 0, 0, 0, a); c.U.push(0, 0, L, 0, L, 1, 0, 1);
      if ((x1 - x0) * (z3 - z0) - (z1 - z0) * (x3 - x0) < 0) c.I.push(n, n + 1, n + 2, n, n + 2, n + 3); else c.I.push(n, n + 2, n + 1, n, n + 3, n + 2);   // (facing up)
    };
    o.root.traverse(m => {
      if (!m.isMesh || m.isInstancedMesh || !m.visible || m.name === 'roadwear' || m.name === 'crowds' || (m.geometry && m.geometry.attributes.aSway)) return;   // (not the woods: under the crowns it hardly shows)
      const mat = m.material, P = m.geometry && m.geometry.attributes.position;
      if (!mat || Array.isArray(mat) || mat.transparent || mat.alphaTest > 0 || !mat.depthWrite || mat.isShaderMaterial || mat.map === tex.water || !P || P.itemSize !== 3) return;
      const A = P.array, I = m.geometry.index ? m.geometry.index.array : null, nt = I ? I.length / 3 : P.count / 3, M = m.matrixWorld.elements;
      const id = M[0] === 1 && M[5] === 1 && M[10] === 1 && M[1] === 0 && M[2] === 0 && M[4] === 0 && M[6] === 0 && M[8] === 0 && M[9] === 0 && M[12] === 0 && M[13] === 0 && M[14] === 0;
      for (let t = 0; t < nt; t++) {
        for (let k = 0; k < 3; k++) { const j = (I ? I[t * 3 + k] : t * 3 + k) * 3, x = A[j], y = A[j + 1], z = A[j + 2];
          if (id) { V[k * 3] = x; V[k * 3 + 1] = y; V[k * 3 + 2] = z; }
          else { V[k * 3] = M[0] * x + M[4] * y + M[8] * z + M[12]; V[k * 3 + 1] = M[1] * x + M[5] * y + M[9] * z + M[13]; V[k * 3 + 2] = M[2] * x + M[6] * y + M[10] * z + M[14]; } }
        const ux = V[3] - V[0], uy = V[4] - V[1], uz = V[5] - V[2], vx = V[6] - V[0], vy = V[7] - V[1], vz = V[8] - V[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, h2 = nx * nx + nz * nz;
        if (h2 < 1e-18 || ny * ny > 0.0625 * h2) continue;   // (upright faces only)
        // the foot: the two lowest corners, the third well above them
        let lo = 0, mid = 1, hi = 2; if (V[mid * 3 + 1] < V[lo * 3 + 1]) { lo = 1; mid = 0; } if (V[hi * 3 + 1] < V[mid * 3 + 1]) { const q = hi; hi = mid; mid = q; if (V[mid * 3 + 1] < V[lo * 3 + 1]) { const r = mid; mid = lo; lo = r; } }
        const ya = V[lo * 3 + 1], yb = V[mid * 3 + 1], h = V[hi * 3 + 1] - Math.max(ya, yb);
        if (h < 0.3) continue;
        const ax = V[lo * 3], az = V[lo * 3 + 2], bx = V[mid * 3], bz = V[mid * 3 + 2], L = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az)), hl = Math.sqrt(h2);
        if (L < 0.25 || Math.abs(yb - ya) > 0.35 * L) continue;   // (not the thin ones: posts, poles, trunks)
        strip(ax, ya, az, bx, yb, bz, nx / hl, nz / hl, h);
      }
    });
    if (!cells.size) return;
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, map: aoTex(), vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', '#include <fog_fragment>\n#ifdef USE_FOG\ngl_FragColor = vec4( vec3( 0.0 ), gl_FragColor.a * ( 1.0 - fogFactor ) );\n#endif'); };
    mat.customProgramCacheKey = () => 'aoFoot';
    for (const c of cells.values()) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c.C, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(c.U, 2));
      g.setIndex(c.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(c.I, 1) : new THREE.Uint16BufferAttribute(c.I, 1)); g.computeBoundingSphere();
      const mm = new THREE.Mesh(g, mat); mm.name = 'ao'; mm.renderOrder = 1; mm.matrixAutoUpdate = false; o.root.add(mm);
    }
  }
  /* ---- the braking boards of a circuit (Track.brakeBoards: 300, 200 and 100 m before its heavy braking zones; Monaco's own 150, 100, 50):
     all of them in one mesh (one draw call, no shadow) on one small atlas drawn once (BB_ATL: kept from build to build, uploaded again after
     a track change frees it). An A-frame of two plates, each 30 deg off the upright (as Pikes Peak's turn boards lean back), the number
     large on both: the chase camera sees the face to the cars coming nearly square on, the iso camera one face or the other beside the
     roads that run up or down the screen, both at an angle beside those across it. Two legs from under the ground (the world's groundH,
     never above the road there) up to its ridge, over a barrier (kind 1) longer ones in the barrier's line. The period circuits' (and
     Monaco's) boards white with black numbers, the others' blue with white; nothing but the number on them. A knockable post or tyre
     stack in a board's way goes. A board on the verge is itself knockable (Core 'bboard'): hit, it tips over and lies in the grass, still
     drawn in this mesh (Render moves its vertices). ---- */
  let BB_ATL = null;
  const BB_NUM = [300, 200, 100, 150, 50], BB_CLASSIC = { cpalace: 1, longford: 1, riverside: 1, monaco: 1 }, BB_BACK = [0.6, 0.62, 0.64];
  function bbAtlas() {   // 512 x 256: the plates 96 x 72 (row 0 blue with white numbers, row 1 white with black: 300, 200, 100, 150, 50); a white patch
    if (BB_ATL) return BB_ATL;
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#9a9ca0'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#ffffff'; g.fillRect(480, 224, 32, 32);
    for (let r = 0; r < 2; r++) BB_NUM.forEach((n, k) => {
      const x = k * 96, y = r * 72, bg = r ? '#f4f4f0' : '#1b3f8e', fg = r ? '#111111' : '#ffffff';
      g.fillStyle = bg; g.fillRect(x, y, 96, 72); g.strokeStyle = fg; g.lineWidth = r ? 5 : 3; g.strokeRect(x + 4.5, y + 4.5, 87, 63);
      const t = String(n); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 54px Arial, Helvetica, sans-serif';
      const m = g.measureText(t).width, sx = Math.min(1, 76 / Math.max(1, m)); g.save(); g.translate(x + 48, y + 38); g.scale(sx, 1); g.fillText(t, 0, 0); g.restore(); });
    const t = BB_ATL = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function brakeBoards(o) {
    const Z = T.brakeBoards ? T.brakeBoards() : []; if (!Z.length) return;
    const row = BB_CLASSIC[THEME] ? 1 : 0, g = new GB(true), tilt = 30 * Math.PI / 180, ct = Math.cos(tilt), st = Math.sin(tilt);
    g.dUV = [488 / 512, 1 - 240 / 256];   // (the legs and the plate's rim: the white patch, in their vertex colours)
    const leg = [0.42, 0.43, 0.46], rim = row ? [0.86, 0.86, 0.84] : [0.16, 0.24, 0.42], W1 = [1, 1, 1], gh = o.groundH, foot = [], loose = [];
    for (const z of Z) for (const b of z.boards) {
      const k = BB_NUM.indexOf(b.d); if (k < 0) continue;
      const vf = g.P.length / 3;   // (its vertices from here: a board on the verge is a knockable prop, loose)
      const hw = b.pw / 2, H = b.ph, tx = Math.cos(b.hd), tz = Math.sin(b.hd), nx = -tz, nz = tx, la = b.kind ? 0.2 : hw - 0.18;   // (la: the legs' distance from the middle; over a barrier in its line)
      const G = (a) => { const y = gh ? gh(b.x + nx * a, b.z + nz * a) : b.y; return Number.isFinite(y) ? y : b.y; }, gl = [G(-la), G(la)];   // (the ground under each leg)
      const y0 = Math.max(b.y, gl[0], gl[1]) + b.py, yF = gl.map(y => Math.max(Math.min(y, b.y) - 0.3, y0 - 5));   // (the plate's lower edge, over the road or the ground if that is higher; the legs' feet, in the ground)
      const Q = (a, f, y) => [b.x + nx * a + tx * f, y, b.z + nz * a + tz * f], e = H * st, yR = y0 + H * ct, inn = Q(0, 0, y0 + 0.1);   // a across (+: right of the cars coming), f along the road; the ridge yR
      const u0 = k * 96 / 512, u1 = (k + 1) * 96 / 512, v1 = 1 - row * 72 / 256, v0 = 1 - (row + 1) * 72 / 256, uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
      g.quadO(Q(-hw, -e, y0), Q(hw, -e, y0), Q(hw, 0, yR), Q(-hw, 0, yR), W1, inn, uv);   // the face to the cars coming
      g.quadO(Q(hw, e, y0), Q(-hw, e, y0), Q(-hw, 0, yR), Q(hw, 0, yR), W1, inn, uv);   // the other face (seen from above beside the roads that run down the screen)
      for (const s of [-1, 1]) g.triO(Q(s * hw, -e, y0), Q(s * hw, e, y0), Q(s * hw, 0, yR), rim, inn);   // its ends
      if (!b.kind) for (const s of [-1, 1]) g.quadO(Q(-hw, s * e, y0), Q(hw, s * e, y0), Q(hw, 0, yR), Q(-hw, 0, yR), BB_BACK, Q(0, s * 3, y0));   // (one on the verge can be knocked over: its plates' backs, the A-frame's inside, grey metal, so a board lying on one plate shows the other whichever way it faces)
      [-1, 1].forEach((s, q) => { const [lx, , lz] = Q(s * la, 0, 0); box(g, lx, yF[q], lz, 0.05, yR - 0.02 - yF[q], 0.05, b.hd, leg, leg, true); });   // the legs
      foot.push([b.x, b.z, tx, tz, hw, { d: b.d, kind: b.kind, x: +b.x.toFixed(2), z: +b.z.toFixed(2), y0: +y0.toFixed(2), feet: yF.map(y => +y.toFixed(2)), ground: gl.map(y => +y.toFixed(2)), road: +b.y.toFixed(2) }]);
      if (!b.kind) loose.push({ b, y: y0 - b.py, v: [vf, g.P.length / 3] });   // (y: the frame's foot as drawn, its plates' lower edge less BB.y0)
    }
    if (g.empty) return;
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: bbAtlas(), vertexColors: true }));
    m.name = 'brakeBoards'; m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; o.root.add(m);
    o.brakeBoards = foot.map(f => f[5]);   // (for the tests: each board's number, kind, place, its plate's lower edge, its legs' feet, the ground under them, the road there)
    const P = o.props; if (P) for (let j = P.length - 1; j >= 0; j--) { const p = P[j];   // (a knockable post or tyre stack where a board stands goes)
      for (const [x, z, tx, tz, hw] of foot) { const dx = p.x - x, dz = p.z - z, a = dx * tx + dz * tz; if (Math.abs(a) < 1.2 && Math.abs(-dx * tz + dz * tx) < hw + 0.45) { P.splice(j, 1); break; } } }
    // the boards on the verge (kind 0; not those over a barrier, which no car reaches) fall over when a car hits them: each is a knockable
    // prop ('bboard', Core PROPK: Race.setProps makes them in this order, slot k = loose[k]) still drawn here in this one mesh: Render moves
    // its vertices (o.bbLoose.v: from, to) by the prop's pose (from b.home, where it stood; P0, N0: the mesh's positions and normals as built)
    if (!loose.length) return;
    const PL = o.props || (o.props = []), ga = m.geometry.attributes;
    for (const { b, y } of loose) PL.push({ kind: 'bboard', x: b.x, z: b.z, yaw: b.hd, col: 0, i: b.i, y });
    o.bbLoose = { mesh: m, v: loose.map(l => l.v), P0: ga.position.array.slice(), N0: ga.normal.array.slice() };
  }
  /* ---- the roadside equipment of the real open roads (obcestna oprema): only what is needed (roadside, called by finish).
     - a place-name board where the road comes into a settlement, the same board struck through where it leaves it; only REAL names (the track's
       OSM data, the real stage's places), a hamlet only its name; no board where the name is not known
     - the speed limit after it: 50 in the settlement, the country's usual limit on the road out of it
     - chevron boards on the outside of the sharpest bends (a radius of 17 m or under, or more than 150 degrees round), in the country's colours
     The signs are 1.8 times their real size and lean back 12 degrees (at their real size the camera behind the car hardly sees them). All on one
     atlas (obAtlas: 128 x 128 cells for the signs and their grey backs, 512 x 128 for the boards). What a car can reach is a knockable prop
     (Core's rssign, rschev, rsboard: a little speed lost, a small dent; Render draws each kind in one instanced mesh, its atlas cell per instance:
     o.rsCells); what stands behind a fence, a guard rail or a parapet stays in one static mesh (alpha-tested faces, no shadow: one draw call). The
     white delineators turn into the heavier plastic ones (Core's dpost). At night (Render.floodlights) the street lamps light the road only in the
     settlements (o.lampZones; every real open road has them, empty where it has no settlement), the sign faces and the delineators' reflectors
     shine in the headlights. d: metres after the start line.
     OB (by the theme): reg the signs' country, in its colours (SI: yellow boards, black lettering and edge, the
     limits on white, red chevrons on white; FI: blue boards, white lettering and edge, the limits on yellow, black chevrons on yellow), town / out the limits, towns [{ n the name, d0 the board in (null: the start is in it), d1 the board out, hamlet (the name
     only), lamps [[d0, d1], ...] its built-up stretches }]. The other real open roads have no settlement on them (Mount Baldy's village, Hout Bay and
     Hotham Heights lie at the start or the finish): their roads dark at night, no lamp zones ---- */
  const OB = {
    // Kranjska Gora: from the start (in the town) past the hotels at Jasna (Jasna is a part of the settlement: one board, struck through after its
    // hotels), the lamps in its two built-up stretches
    vrsic: { reg: 'SI', town: 50, out: 90, towns: [{ n: 'KRANJSKA GORA', d0: null, d1: 2404, lamps: [[-60, 1196], [1596, 2090]] }] },
    // Medvode (the start in it), Zbilje, Valburga, Smlednik (def.names, OSM); their built-up stretches. The castle hill after Smlednik: out of them
    medvode: { reg: 'SI', town: 50, out: 70, towns: [{ n: 'MEDVODE', d0: null, d1: 1786, lamps: [[-60, 1770]] }, { n: 'ZBILJE', d0: 2052, d1: 3502, lamps: [[2058, 2880]] },
      { n: 'VALBURGA', d0: 4036, d1: 4688, lamps: [[4040, 4680]] }, { n: 'SMLEDNIK', d0: 4704, d1: 5242, lamps: [[4708, 5236]] }] },
    // Ouni and Kakaristo: the real stage's places (a farm, the junction in the fields: the name only). The village of the added section has no
    // name that could be checked: no board, no limits, no lamps
    ouni: { reg: 'FI', town: 50, out: 80, towns: [{ n: 'OUNI', d0: 1576, hamlet: true }, { n: 'KAKARISTO', d0: 8634, hamlet: true }] },
  };
  function obAtlas(reg, small, names) {   // the atlas: the left half the signs' faces, the right half their grey backs (the same silhouette), cell 15 white (the poles); rows 4-7 the boards
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d'); x.clearRect(0, 0, 1024, 1024);
    const FI = reg === 'FI', red = '#d0201a', blk = '#141416', wht = '#f6f6f2', yel = '#f5cf1a', grey = '#9a9da2';
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, "DejaVu Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w); };
    const shape = (k, x0, y0, back) => {   // one sign into the cell at (x0, y0): lim:<n> a speed limit (a red ring), chev:L / chev:R a chevron board, white
      const cx = x0 + 64, cy = y0 + 64, [kind, arg] = k.split(':');
      if (kind === 'lim') {
        x.beginPath(); x.arc(cx, cy, 62, 0, Math.PI * 2); x.fillStyle = back ? grey : red; x.fill(); if (back) return;
        x.beginPath(); x.arc(cx, cy, 49, 0, Math.PI * 2); x.fillStyle = FI ? yel : wht; x.fill(); txt(arg, cx, cy + 3, arg.length > 2 ? 44 : 58, blk, 86);
      } else if (kind === 'chev') {   // an upright board (92 px of the cell's 128: 1.0 x 1.4 m) with a chevron the way the bend turns (SI: red on white; FI: black on
        // yellow, a black edge)
        const w = 92, X0 = cx - w / 2; x.fillStyle = back ? grey : FI ? yel : wht; x.fillRect(X0, y0 + 2, w, 124); if (back) return;
        if (FI) { x.strokeStyle = blk; x.lineWidth = 6; x.strokeRect(X0 + 3, y0 + 5, w - 6, 118); }
        const s = arg === 'L' ? -1 : 1; x.strokeStyle = FI ? blk : red; x.lineWidth = 19; x.lineJoin = 'miter'; x.lineCap = 'butt';
        x.beginPath(); x.moveTo(cx - s * 19, y0 + 26); x.lineTo(cx + s * 17, y0 + 64); x.lineTo(cx - s * 19, y0 + 102); x.stroke();
      } else if (kind === 'white') { x.fillStyle = '#ffffff'; x.fillRect(x0, y0, 128, 128); }
    };
    small.forEach((k, j) => { const x0 = (j % 4) * 128, y0 = Math.floor(j / 4) * 128; shape(k, x0, y0, false); shape(k, x0 + 512, y0, true); });
    shape('white', 3 * 128, 3 * 128, false);
    names.forEach(([nm, crossed], j) => { const x0 = (j % 2) * 512, y0 = 512 + Math.floor(j / 2) * 128;
      if (FI) { x.fillStyle = '#1f5aa6'; x.fillRect(x0, y0, 512, 128); x.strokeStyle = wht; x.lineWidth = 6; x.strokeRect(x0 + 9, y0 + 9, 494, 110); txt(nm, x0 + 256, y0 + 66, 66, wht, 450); }
      else { x.fillStyle = yel; x.fillRect(x0, y0, 512, 128); x.strokeStyle = blk; x.lineWidth = 7; x.strokeRect(x0 + 9, y0 + 9, 494, 110); txt(nm, x0 + 256, y0 + 67, nm.length > 10 ? 62 : 70, blk, 450); }
      if (crossed) { x.strokeStyle = red; x.lineWidth = 15; x.beginPath(); x.moveTo(x0 + 30, y0 + 112); x.lineTo(x0 + 482, y0 + 16); x.stroke(); } });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const OB_POLE_UV = [(3 * 128 + 64) / 1024, 1 - (3 * 128 + 64) / 1024];   // (the white cell: the poles, and a board's grey back, in their vertex colours; Render's knockable signs too)
  function roadside(o) {
    if (!T.open || T.def.test || T.def.cityStage) return;   // (the real open roads; a city stage (Harju) lies all in the town: its lamps as ever)
    const cfg = OB[THEME];
    o.lampZones = cfg ? cfg.towns.flatMap(t => t.lamps || []) : [];   // (Render.floodlights: the street lamps at night only there)
    if (!cfg) return;
    const sS = T.startS, N = T.N, gH = o.groundH || ((x, z) => (T.hy ? T.hy[T.nearestIdx(x, z)] : 0)), st = { name: 0, lim: 0, chev: 0, fixed: 0, dpost: 0, removed: 0 };
    const Q = {}, stub = (x, z, m, i) => {   // on a side road (or within m of it)
      if (API.STG && API.VR) return API.vrStubAt(x, z, m);
      if (!T.stubs || !T.stubs.length) return null;
      const q = T.query(x, z, i, Q); if (!(q.k >= 0)) return null; const S = T.stubs[q.k];
      return q.st <= S.Lend + 2 && Math.abs(q.u) <= T.stubHw(S, q.st) + S.lim + m ? S : null; };
    const edge = (i, side) => T.wAt(i) + (T.walk ? T.walk[side > 0 ? 1 : 0][i] : 0);   // (the asphalt's edge, with the sidewalk)
    const dOf = (i) => i * T.ds - sS;
    const yAt = (i, x, z) => { const h = T.hy ? T.hy[i] : 0, y = gH(x, z); return Math.max(h - 0.7, Math.min(h + 0.35, y)); };
    const small = [], cell = (k) => { let j = small.indexOf(k); if (j < 0) { j = small.length; small.push(k); } return j; };   // (the atlas cells this road needs)
    const names = [], board = (nm, crossed) => { names.push([nm, crossed]); return names.length - 1; };
    { const n0 = o.props.length; o.props = o.props.filter(p => p.kind !== 'vboard'); st.removed = n0 - o.props.length; }   // (Medvode's boards without lettering: the lettered ones instead)
    const placed = [];   // the new things (x, z, r): kept apart
    const busy = (x, z, r) => { for (let k = 0; k < placed.length; k += 3) if ((placed[k] - x) ** 2 + (placed[k + 1] - z) ** 2 < (placed[k + 2] + r) ** 2) return true;
      for (const p of o.props) if ((p.x - x) ** 2 + (p.z - z) ** 2 < (r + 0.9) ** 2) return true; return false; };
    const ZEB = T.def.zebras || [], STOPS = (T.def.stops || []).map(s => s[0]);
    const nearMark = (d, m) => ZEB.some(z => Math.abs(z - d) < m) || STOPS.some(z => Math.abs(z - d) < m + 4) || T.cpS.some(s => Math.abs(s - sS - d) < 14) || Math.abs(d) < 26 || Math.abs(T.finishS - sS - d) < 30;
    const visBar = (i, side) => {   // something drawn on the barrier line here: Medvode's fence (all along), a guard rail, a parapet (o.rsRail, o.rsBr: the builders')
      if (T.def.edgeBar != null) return true; const R = o.rsRail, B = o.rsBr, si = side > 0 ? 1 : 0;
      for (let k = Math.max(0, i - 3); k <= Math.min(N - 1, i + 3); k++) if ((R && R[si][k]) || (B && B[k])) return true; return false; };
    // across the road: hw the sign's half width, rc how far from its middle it collides (a board's legs; a sign's pole: 0.12). Where a fence, rail
    // or parapet stands on the barrier line: wholly on one side of it, 0.3 m clear, inside where it fits (its near end 0.3 m off the asphalt at
    // least), else behind it (out of the car's reach: fixed). Where nothing is drawn: where it was wanted, fixed when it stands wholly past the
    // line; a knockable one where what collides is within the car's reach and its middle at most 0.3 m past the line (knocked over, Core keeps
    // it inside), or else moved out wholly past it
    const fitLat = (i, side, want, hw, rc) => {
      const e = edge(i, side), bar = side > 0 ? T.br[i] : T.bl[i];
      if (!visBar(i, side)) { if (want - hw > bar + 0.1) return [want, true];
        const l = Math.min(want, bar + 0.3, bar - 0.2 + rc); return l - hw >= e + 0.3 ? [l, false] : [Math.max(want, bar + 0.15 + hw), true]; }
      const hi = bar - 0.3 - hw, lo = Math.min(want, e + hw + 0.3);
      if (want <= hi) return [want, false]; if (hi >= lo) return [hi, false]; return [Math.max(want, bar + 0.3 + hw), true];
    };
    const spot = (d, side0, off, r, hw, rc) => {   // a free place beside the road near d (on 3 m at a time, the wanted side first): out of the side roads' mouths, clear of the
      for (const side of [side0, -side0]) for (let k = 0; k < 12; k++) {   // props; past a rock face, a drop, a house or a side road further on, or on the other side
        const dd = d + k * 3, i = T.idx(sS + dd); if (i <= 2 || i >= N - 3) break;
        if (nearMark(dd, 5)) continue;
        const si = side > 0 ? 1 : 0, gp = T.gap && T.gap[si]; if (gp && (gp[i] || gp[Math.max(0, i - 2)] || gp[Math.min(N - 1, i + 2)])) continue;
        const at = (l) => [T.px[i] + T.nx[i] * side * l, T.pz[i] + T.nz[i] * side * l];
        const [lat, behind] = fitLat(i, side, edge(i, side) + off, hw, rc); let ok = true;
        for (const l of [lat - hw, lat, lat + hw]) { const [x, z] = at(l);   // (the whole sign: not into a rock face or over a drop (its poles reach the ground), a house, a side road, another leg of the road)
          if ((T.hy && (gH(x, z) > T.hy[i] + 0.8 || gH(x, z) < T.hy[i] - 0.95)) || (T.onBuilding && T.onBuilding(x, z, 0.4)) || stub(x, z, 0.4, i) || Math.abs(T.nearestIdx(x, z) - i) * T.ds > 40) { ok = false; break; } }
        if (!ok) continue;
        const [x, z] = at(lat);
        if (stub(x, z, 0.8, i) || busy(x, z, r)) continue;
        placed.push(x, z, r); return { i, x, z, y: yAt(i, x, z), d: dd, lat, side, behind };
      }
      return null;
    };
    // what goes where: { kind: 'sign' | 'board' | 'chev', p, nx, nz (the face's way, to the cars coming), cell, y (the face's middle above the ground), w, h }
    const items = [];
    const faceTo = (p, toe) => { const i = p.i; let nx = -T.tx[i] - p.side * T.nx[i] * toe, nz = -T.tz[i] - p.side * T.nz[i] * toe; const l = Math.hypot(nx, nz); return [nx / l, nz / l]; };   // (turned a little towards the road)
    const sign = (d, k) => { const p = spot(d, 1, 1.2, 0.9, 0.775, 0.12); if (!p) return false; const [nx, nz] = faceTo(p, 0.14); items.push({ kind: 'sign', p, nx, nz, cell: cell(k), y: 2.9, w: 1.45, h: 1.45 }); return true; };
    const nameBoard = (d, n, crossed) => { const p = spot(d, 1, 2.2, 2.0, 1.85, 1.55); if (!p) return false; const [nx, nz] = faceTo(p, 0.1); items.push({ kind: 'board', p, nx, nz, cell: board(n, crossed), y: 3.0, w: 3.6, h: 0.9 }); return true; };
    // the place names: in (the name), out (struck through)
    for (const t of cfg.towns) {
      if (t.d0 != null && nameBoard(t.d0, t.n, false)) st.name++;
      if (t.d1 != null && !t.hamlet && nameBoard(t.d1, t.n, true)) st.name++;
    }
    // the speed limits: the settlement's after its board (or after the start), the open road's after the way out (unless the next settlement begins at once)
    for (const t of cfg.towns) {
      if (t.hamlet) continue;
      if (sign(t.d0 == null ? 60 : t.d0 + 22, 'lim:' + cfg.town)) st.lim++;
      const next = cfg.towns.find(u => u.d0 != null && u.d0 > t.d1 - 1 && u.d0 < t.d1 + 60); if (!next && sign(t.d1 + 26, 'lim:' + cfg.out)) st.lim++;
    }
    // the chevrons on the outside of the sharpest bends: two, three round a hairpin (more than 150 degrees), not in a roundabout; in front of the rail or
    // the wall round the bend where there is one (a paved hairpin's wall may stand well out), else 1.2 m off the asphalt
    for (const c of T.corners.slice().sort((p, q) => p.i0 - q.i0)) {
      if (!(c.minR <= 17 || c.angle > 2.6)) continue;
      const d0 = dOf(c.i0); if (d0 < 40 || d0 > T.finishS - sS - 10) continue;
      const side = -c.dir, n = c.angle > 2.6 ? 3 : 2, k = 'chev:' + (c.dir > 0 ? 'R' : 'L');
      for (let q = 0; q < n; q++) { const i = Math.round(c.i0 + (c.i1 - c.i0) * (0.12 + 0.76 * q / (n - 1))), si = side > 0 ? 1 : 0;
        if ((T.gap && T.gap[si][i]) || dOf(i) > T.finishS - sS - 10 || T.rings.some(R => Math.hypot(T.px[i] - R.x, T.pz[i] - R.z) < R.wz + 5)) continue;   // (not past the finish, nor round a roundabout)
        const bar = side > 0 ? T.br[i] : T.bl[i], [lat, behind] = fitLat(i, side, visBar(i, side) ? Math.max(edge(i, side) + 1.2, bar - 1.05) : edge(i, side) + 1.2, 0.75, 0.12);   // (at the rail or the wall round the bend where there is one)
        const x = T.px[i] + T.nx[i] * side * lat, z = T.pz[i] + T.nz[i] * side * lat;
        if (stub(x, z, 0.5, i) || busy(x, z, 0.6) || (T.onBuilding && T.onBuilding(x, z, 1.2))) continue;
        if (T.hy && (gH(x, z) > T.hy[i] + 0.8 || gH(x, z) < T.hy[i] - 0.95)) continue;
        placed.push(x, z, 0.6);
        const j = Math.max(0, i - 16), ax = T.px[j] - x, az = T.pz[j] - z, al = Math.hypot(ax, az) || 1;   // (facing the cars coming into the bend)
        items.push({ kind: 'chev', p: { i, x, z, y: yAt(i, x, z), d: dOf(i), lat, side, behind }, nx: ax / al, nz: az / al, cell: cell(k), y: 1.7, w: 1.4, h: 1.4 }); st.chev++; }
    }
    // the white delineators: plastic ones, a little heavier (Core's dpost)
    for (const p of o.props) if (p.kind === 'post') { p.kind = 'dpost'; st.dpost++; }
    const tex = obAtlas(cfg.reg, small, names); o.ownTex.push(tex);
    const sm = (j) => [(j % 4) * 0.125, Math.floor(j / 4) * 0.125], nm = (j) => [(j % 2) * 0.5, 0.5 + Math.floor(j / 2) * 0.125];   // (a cell's corner in the canvas: u right, v down)
    o.rsAtlas = tex; o.rsPoleUV = OB_POLE_UV;
    o.rsCells = { rssign: small.map((k, j) => { const a = sm(j); return [a[0], -a[1]]; }), rsboard: names.map((n, j) => { const a = nm(j); return [a[0], -(a[1] - 0.5)]; }) };   // (Render: each instance's offset from cell 0 / board 0, in uv (v up the canvas))
    o.rsItems = items.map(it => ({ kind: it.kind, name: it.kind === 'board' ? names[it.cell][0] + (names[it.cell][1] ? ' (konec)' : '') : small[it.cell], d: Math.round(it.p.d), side: it.p.side, x: +it.p.x.toFixed(2), z: +it.p.z.toFixed(2), y: +it.p.y.toFixed(2),
      lat: +it.p.lat.toFixed(2), nx: +it.nx.toFixed(3), nz: +it.nz.toFixed(3), fixed: !!it.p.behind, i: it.p.i }));   // (for the tests)
    // the reachable ones: knockable props (their atlas cell in col); those behind a barrier: the static mesh
    for (const it of items) { if (it.p.behind) { st.fixed++; continue; }
      o.props.push({ kind: it.kind === 'board' ? 'rsboard' : it.kind === 'chev' ? 'rschev' : 'rssign', x: it.p.x, z: it.p.z, yaw: Math.atan2(-it.nz, -it.nx), col: it.cell, i: it.p.i }); }
    o.rsStats = st; if (o.knock) { o.knock = {}; for (const p of o.props) o.knock[p.kind] = (o.knock[p.kind] || 0) + 1; }   // (Medvode's count by kind, for the tests)
    const g = new GB(true); g.dUV = OB_POLE_UV; const poleC = [0.6, 0.61, 0.64], W1 = [1, 1, 1], backC = [0.55, 0.56, 0.58], LN = Math.sin(0.21);
    const quad = (cx, cy, cz, nx, nz, w, h, uv, col, back) => { const rx = nz, rz = -nx, hw = w / 2, hh = h / 2, lx = (back ? 1 : -1) * nx * h * LN, lz = (back ? 1 : -1) * nz * h * LN;   // (the top leans back)
      g.quadO([cx - rx * hw, cy - hh, cz - rz * hw], [cx + rx * hw, cy - hh, cz + rz * hw], [cx + rx * hw + lx, cy + hh, cz + rz * hw + lz], [cx - rx * hw + lx, cy + hh, cz - rz * hw + lz], col, [cx - nx, cy, cz - nz], uv); };
    for (const it of items) {
      if (!it.p.behind) continue;
      const { p, nx, nz } = it, y0 = p.y, yc = y0 + it.y, rot = Math.atan2(nz, nx), bx = p.x - nx * 0.025, bz = p.z - nz * 0.025;
      if (it.kind === 'board') { const [a, b] = nm(it.cell); quad(p.x, yc, p.z, nx, nz, it.w, it.h, [[a, 1 - b - 0.125], [a + 0.5, 1 - b - 0.125], [a + 0.5, 1 - b], [a, 1 - b]], W1);
        quad(bx, yc, bz, -nx, -nz, it.w, it.h, null, backC, true);
        for (const q of [-1.45, 1.45]) box(g, p.x - nx * 0.12 + nz * q, y0 - 0.3, p.z - nz * 0.12 - nx * q, 0.1, it.y + 0.5, 0.1, rot, poleC, poleC); }
      else { const [a, b] = sm(it.cell); quad(p.x, yc, p.z, nx, nz, it.w, it.h, [[a, 1 - b - 0.125], [a + 0.125, 1 - b - 0.125], [a + 0.125, 1 - b], [a, 1 - b]], W1);
        quad(bx, yc, bz, -nx, -nz, it.w, it.h, [[a + 0.625, 1 - b - 0.125], [a + 0.5, 1 - b - 0.125], [a + 0.5, 1 - b], [a + 0.625, 1 - b]], W1, true);
        box(g, p.x - nx * 0.12, y0 - 0.3, p.z - nz * 0.12, 0.1, it.y + 0.3, 0.1, rot, poleC, poleC); }
    }
    if (!g.empty) {
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, vertexColors: true, alphaTest: 0.5 }));   // (emissive: the faces in the headlights at night, Render)
      m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'rsSigns'; o.root.add(m); o.rsMesh = m;
    }
  }
  function finish(o, tex) { o.cull = CULLM; o.shadowLo = SHLO; roadside(o); aoWorld(o, tex); if (!o.ownMarks) tyreMarks(o.root); roadWear(o, tex); grassWorld(o, tex); verge(o); wornGrass(o); crowdStands(o); if (!fansOn()) o.crowdPts = crowdPoints(o, tex, true); else if (!o.crowdPts && !T.open) o.crowdPts = crowdPoints(o, tex); brakeBoards(o); return clouds(o.root, o, tex); }
  // where the crowds are, for their sound (Sfx: x, z, how many 0..1), on a circuit whose builder has not given them (the Red Bull Ring's
  // does): the spectators of every crowd of this build in 24 m cells, and the packed grandstands (the crowd picture) as full ones
  function crowdPoints(o, tex, stands) {   // (stands: the grandstands' people only, every stand's picture: the real tracks, see fansOn)
    const cells = new Map(), put = (x, z, n) => { const k = Math.floor(x / 24) + ',' + Math.floor(z / 24); const e = cells.get(k); if (e) { e[0] += x * n; e[1] += z * n; e[2] += n; } else cells.set(k, [x * n, z * n, n]); };
    if (!stands) for (const C of CROWDS) for (const L of C.sp.values()) for (let i = 0; i < L.length; i += 2) put(L[i], L[i + 1], 1);
    if (tex.crowd) o.root.traverse(m => { if (!m.isMesh || !m.material || !(m.material.map === tex.crowd || (stands && m.material.map && m.material.map.crowdPic)) || !m.geometry.attributes.position) return;
      const P = m.geometry.attributes.position.array; for (let i = 0; i < P.length; i += 3 * 24) put(P[i], P[i + 2], 6); });   // (the grandstands' vertices: in world coordinates)
    const out = []; for (const e of cells.values()) if (e[2] >= 6) out.push(e[0] / e[2], e[1] / e[2], Math.min(1, 0.3 + e[2] / 60));
    return Float32Array.from(out);
  }   // (every world, at the end of its build; the Nordschleife's and the Red Bull Ring's builders paint their own tyre marks)

  /* ---- moving things: the TV helicopter with the car the whole run (Ouninpohja, Harju; Pikes Peak has none) (built at the end of the builder;
     pkUpdate runs every frame from World.update; the cloud shadows are every world's, see clouds above) ---- */
  function pkSky(K) {
    const { heli, rotor, tail } = tvHeli(K.root), i0 = T.idx(K.sStart);   // (it stays with the car the whole run, standing off far from the camera: pkFollow)
    K.out.dyn.pk = { heli, rotor, tail, follow: true, init: false, t: 0, hx: T.px[i0], hz: T.pz[i0], hy: T.hy[i0], hh: T.hd[i0], gH: K.gH || API.pkGround,
      Ls: [20, 27, 34, 46, 60], maxR: 0.3 };   // (gH: the world's ground; it may stand off farther and higher, and never looks big on the screen)
  }
  function pkUpdate(pk, t, car) { const raw = t - pk.t; pk.t = t; pkFollow(pk, t, car, raw); }
  // Ouninpohja's TV helicopter: with the car the whole run (the start line without one), off to one side and up high, where no camera sees it big
  function pkFollow(pk, t, car, dt) {
    const wrap = (a) => a - TAU * Math.round(a / TAU);
    // anchored on the followed car, 20-60 m off to one side, 22-36 m up
    const ax = car ? car.x : pk.hx, az = car ? car.z : pk.hz, ay = car ? car.roadY || 0 : pk.hy, ah = car ? car.h : pk.hh, spd = car ? car.speed || 0 : 0;
    const cvx = car ? car.vx || 0 : 0, cvz = car ? car.vz || 0 : 0;
    const snap = !pk.init || dt < 0 || dt > 1.5 || Math.hypot(ax - pk.ax, az - pk.az) > 80;
    if (snap) { pk.init = true; pk.ax = ax; pk.az = az; pk.ay = ay; pk.fx = Math.cos(ah); pk.fz = Math.sin(ah); pk.th = ah + Math.PI * 0.3; pk.L = 28; pk.vx = pk.vz = pk.ac = pk.al = 0; }
    const e = (k) => 1 - Math.exp(-Math.max(0, dt) * k);
    // the anchor trails the car smoothly but leads by its velocity (no lag at a steady speed: it stays level with the car)
    pk.ax += (ax + cvx / 2.5 - pk.ax) * e(2.5); pk.az += (az + cvz / 2.5 - pk.az) * e(2.5); pk.ay += (ay - pk.ay) * e(1.5);
    { const k = e(2.5); pk.fx += (Math.cos(ah) - pk.fx) * k; pk.fz += (Math.sin(ah) - pk.fz) * k; const l = Math.hypot(pk.fx, pk.fz) || 1; pk.fx /= l; pk.fz /= l; }
    const H = 26 + 3 * Math.sin(t * 0.21), fx = pk.fx, fz = pk.fz;
    // where it may fly: a rough model of the three cameras (chase in portrait and landscape, iso, kino: see Render's updateCamera) projects a candidate spot;
    // off screen, or clear of the car and the road just ahead on screen, in every view; a bit ahead of the car is nicer, and it does not jump around
    const sp1 = Math.max(spd, 1e-3), la = sstep(1.5, 16, spd), lvx = cvx / sp1 * la, lvz = cvz / sp1 * la, zc = 1.2 * (1 + 0.25 * clamp(spd / 55, 0, 1)), zi = 1.2 * (1 + 0.1 * clamp(spd / 60, 0, 1));
    const views = [[fx * 13, fz * 13, -fx, -fz, 46 * zc, 0.98, 58, 0.46], [fx * 8.5, fz * 8.5, -fx, -fz, 30 * zc, 0.9, 46, 2.2], [clamp(lvx * 19, -24, 24), clamp(lvz * 19, -12.6, 18.6), 0, 1, 57 * zi, 0.82, 30, 2.2], [lvx * 11, lvz * 11, 0, 1, 38 * zi, 0.74, 30, 2.2]];
    const cams = views.map(([ox, oz, bx, bz, D, pt, fov, as]) => { const tx = ax + ox, tz = az + oz, c = [tx + bx * D * Math.cos(pt), ay + D * Math.sin(pt), tz + bz * D * Math.cos(pt)];
      const f = [tx - c[0], ay - c[1], tz - c[2]], fl = Math.hypot(f[0], f[1], f[2]); f[0] /= fl; f[1] /= fl; f[2] /= fl; const rl = Math.hypot(f[0], f[2]), r = [-f[2] / rl, 0, f[0] / rl];
      return { c, f, r, u: [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]], k: 1 / Math.tan(fov / 2 * Math.PI / 180), as }; });
    const prot = [[ax, ay + 0.7, az], [ax + fx * 7, ay, az + fz * 7], [ax + fx * 14, ay, az + fz * 14], [ax + fx * 21, ay, az + fz * 21]];
    const scr = (C, q) => { const d0 = q[0] - C.c[0], d1 = q[1] - C.c[1], d2 = q[2] - C.c[2], z = d0 * C.f[0] + d1 * C.f[1] + d2 * C.f[2]; return z < 1 ? null : [(d0 * C.r[0] + d1 * C.r[1] + d2 * C.r[2]) / z * C.k, (d0 * C.u[0] + d1 * C.u[1] + d2 * C.u[2]) / z * C.k, z]; };
    const clear = (x, y, z) => { let m = 1, n = 0, big = 0;   // in half screen heights: the smallest gap between the helicopter (~7 m wide disc) and the protected points, + 0.05 per view that shows it well clear
      for (const C of cams) { const h = scr(C, [x, y + 1.5, z]); if (!h) continue; const rr = 7 * C.k / h[2]; if (Math.abs(h[0]) > C.as + rr || Math.abs(h[1]) > 1 + rr) continue;
        if (pk.maxR && rr > pk.maxR) big = Math.max(big, rr - pk.maxR);   // (a size cap: bigger than that on a screen costs a lot)
        let mv = 1; for (const q of prot) { const s = scr(C, q); if (s) mv = Math.min(mv, Math.hypot(s[0] - h[0], s[1] - h[1]) - rr); } m = Math.min(m, mv); if (mv > 0.35) n++; }
      return Math.min(0.35, m) + 0.05 * n - 3 * big; };
    const lift = (L) => (pk.maxR ? 6 * sstep(34, 46, L) : 0);   // (standing off farther, it flies a little higher too)
    let best = pk.th, bL = pk.L, bs = -1e9;
    for (let j = -12; j < 12; j++) for (const L of pk.Ls) {
      const th = pk.th + j * TAU / 24, x = ax + Math.cos(th) * L, z = az + Math.sin(th) * L, y = Math.max(ay + H + lift(L), pk.gH(x, z) + 20);
      const sc = clear(x, y, z) + 0.12 * (Math.cos(th) * fx + Math.sin(th) * fz) - 0.1 * Math.abs(j * TAU / 24) - 0.004 * Math.abs(L - pk.L);
      if (sc > bs) { bs = sc; best = th; bL = L; }
    }
    pk.th += wrap(best - pk.th) * (snap ? 1 : e(1.2)); pk.L += (bL - pk.L) * (snap ? 1 : e(0.8));
    const tx = pk.ax + Math.cos(pk.th) * pk.L, tz = pk.az + Math.sin(pk.th) * pk.L, ty = Math.max(pk.ay + H + lift(pk.L), pk.gH(tx, tz) + 20) + 0.4 * Math.sin(t * 0.9);
    const m = pk.heli, p = m.position;
    if (snap) p.y = ty;
    const px = p.x, pz = p.z;
    p.x = tx; p.z = tz; p.y += (ty - p.y) * e(ty > p.y ? 1.6 : 0.8);
    p.y = Math.max(p.y, pk.gH(p.x, p.z) + 18);
    // attitude: nose along its flight (towards the car while it hovers); banks into the turns, dips the nose with speed and when it speeds up
    if (snap) pk.yaw = Math.atan2(az - p.z, ax - p.x);
    else if (dt > 1e-4) { const vx = (p.x - px) / dt, vz = (p.z - pz) / dt, c = Math.cos(pk.yaw), s = Math.sin(pk.yaw), dvx = (vx - pk.vx) / dt, dvz = (vz - pk.vz) / dt, k = e(3);
      pk.ac += (dvx * c + dvz * s - pk.ac) * e(2); pk.al += (dvz * c - dvx * s - pk.al) * e(2); pk.vx += (vx - pk.vx) * k; pk.vz += (vz - pk.vz) * k; }
    const sp = Math.hypot(pk.vx, pk.vz), wv = sstep(2, 9, sp), lx = pk.ax - p.x, lz = pk.az - p.z, ll = Math.hypot(lx, lz) || 1;
    const yt = Math.atan2(lerp(lz / ll, pk.vz / (sp || 1), wv), lerp(lx / ll, pk.vx / (sp || 1), wv));
    pk.yaw += wrap(yt - pk.yaw) * e(1.3);
    m.rotation.set(clamp(pk.al * 0.035, -0.35, 0.35), -pk.yaw, -clamp(0.004 * sp + 0.02 * pk.ac, -0.12, 0.25));
    pk.rotor.rotation.y = (t * 41) % TAU; pk.tail.rotation.z = (t * 73) % TAU;
  }


  /* ================= NÜRBURGRING NORDSCHLEIFE (theme 'nring') =================
     The real 20.7 km loop through the Eifel forests (10k road samples). As for Pikes Peak only a corridor around the track is built.
     Terrain: an 8 m height grid in 256 m tiles; near the track it is the road's own height (blended from the nearby road samples),
     farther out the real terrain (def.dem, forest canopy removed) with a little noise. The OpenStreetMap land cover (def.lc) colours
     the ground and decides where the forest stands; the trees are instanced per 128 m chunk. Road, verges, kerbs, lines and guardrails
     are indexed ribbons. Hot loops live in these small functions (the big builder is not optimised by V8). The Red Bull Ring and Spa build
     on the same terrain helpers, each with its own scenery (buildRbring, buildSpa). */
  const NRC = 8, NRT = 32, NRHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let NR = null;                               // per-build data: sample hash, land cover, terrain grids
  const NRN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // nrNear: nearest sample, distance, distance beyond the barrier, blended and exact road height
  const NRCOL = [0, 0, 0], NR_SE = [1.08, 0.96, 0.98];   // (the settlements' ground colour; a world may set its own, NR.seC)
  const NR_A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function nrPrep() {
    const def = T.def, N = T.N, M = 480;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    x0 -= M; x1 += M; z0 -= M; z1 += M;
    const P = NR = { x0, z0, x1, z1 };
    // every 2nd road sample in a hash grid
    P.cx0 = Math.floor(x0 / NRHC); P.cz0 = Math.floor(z0 / NRHC); P.ncx = Math.floor(x1 / NRHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / NRHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    for (let i = 0; i < N; i += 2) { const k = (Math.floor(T.pz[i] / NRHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / NRHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); }
    // land cover (0 open, 1 forest, 2 scrub, 3 settlement / car parks): 16 m cells, rows run-length coded
    const L = def.lc, lc = new Uint8Array(L.nx * L.nz);
    for (let p = 0, k = 0; k < lc.length;) { const v = NR_A64.indexOf(L.rle[p++]); let n = (v & 15) + 1; if ((v & 15) === 15) { let e; do { e = NR_A64.indexOf(L.rle[p++]); n += e; } while (e === 63); } lc.fill(v >> 4, k, Math.min(lc.length, k + n)); k += n; }
    P.lc = lc; P.L = L; P.edge = new Float32Array(lc.length).fill(NaN);
    // real terrain: def.dem's grid (the Nordschleife 64 m, Spa and the Red Bull Ring 16 m), heights above the road's zero (D.base: the grid's
    // height of the road's zero, if not 300 m a.s.l. as on the Nordschleife)
    const D = def.dem, bin = atob(D.b64), dem = new Float32Array(D.nx * D.nz), base = D.base != null ? D.base : 300;
    for (let k = 0; k < dem.length; k++) dem[k] = D.lo + bin.charCodeAt(k) * D.step - base;
    P.dem = dem; P.D = D;
    // distance to the road centre line on a 16 m grid (chamfer transform seeded with the road samples)
    const dc = 16, dnx = Math.ceil((x1 - x0) / dc) + 1, dnz = Math.ceil((z1 - z0) / dc) + 1, dist = new Float32Array(dnx * dnz).fill(1e9);
    for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / dc), b = Math.round((T.pz[i] - z0) / dc); dist[b * dnx + a] = 0; }
    nrChamfer(dist, dnx, dnz, dc);
    Object.assign(P, { dc, dnx, dnz, dist });
    P.n1 = valueNoise2(401, 90); P.n2 = valueNoise2(402, 30); P.n3 = valueNoise2(403, 55); P.n4 = valueNoise2(404, 14); P.n5 = valueNoise2(405, 160); P.n6 = valueNoise2(406, 110); P.n7 = valueNoise2(407, 7);
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (NRC * NRT)); G.ntz = Math.ceil((z1 - z0) / (NRC * NRT)); G.nx = G.ntx * NRT + 1; G.nz = G.ntz * NRT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);
    G.cov = new Float32Array(G.nx * G.nz); G.col = new Float32Array(G.nx * G.nz * 3).fill(NaN);   // (build only: the trees' canopy over each vertex, the vertex colours)
    // farmland: ~100 m fields (a jittered grid of cell centres, each with a crop tone) for nrField
    const F = P.F = { S: 104, i0: Math.floor(x0 / 104) - 1, j0: Math.floor(z0 / 104) - 1 }; F.ni = Math.floor((x0 + G.nx * NRC) / 104) + 2 - F.i0; F.nj = Math.floor((z0 + G.nz * NRC) / 104) + 2 - F.j0; F.c = new Float32Array(F.ni * F.nj * 3);
    for (let j = 0; j < F.nj; j++) for (let i = 0; i < F.ni; i++) { const a = i + F.i0, b = j + F.j0, k = (j * F.ni + i) * 3; F.c[k] = (a + 0.2 + 0.6 * crH(a, b, 21)) * 104; F.c[k + 1] = (b + 0.2 + 0.6 * crH(a, b, 22)) * 104; F.c[k + 2] = crH(a, b, 23); }
    // the roads under the track's bridges (def.brO, not the two by T13): nrH digs a cutting for each, 6 m below the road, straight across the track
    P.br = (def.brO || []).map(([x, z]) => T.nearestIdx(x, z)).filter(i => { const d = ((i * T.ds - T.startS) % T.len + T.len) % T.len; return d > 250 && d < T.len - 250; })
      .map(i => ({ i, x: T.px[i], z: T.pz[i], tx: T.tx[i], tz: T.tz[i], nx: T.nx[i], nz: T.nz[i], y: T.hy[i] - 6 }));
  }
  function nrChamfer(d, nx, nz, c) {   // two-pass 3x3 chamfer distance transform (in place)
    const c2 = c * Math.SQRT2;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; let v = d[k];
      if (i > 0) v = Math.min(v, d[k - 1] + c); if (j > 0) { v = Math.min(v, d[k - nx] + c); if (i > 0) v = Math.min(v, d[k - nx - 1] + c2); if (i < nx - 1) v = Math.min(v, d[k - nx + 1] + c2); } d[k] = v; }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; let v = d[k];
      if (i < nx - 1) v = Math.min(v, d[k + 1] + c); if (j < nz - 1) { v = Math.min(v, d[k + nx] + c); if (i < nx - 1) v = Math.min(v, d[k + nx + 1] + c2); if (i > 0) v = Math.min(v, d[k + nx - 1] + c2); } d[k] = v; }
  }
  function nrDist(x, z) {   // distance to the road centre line (bilinear on the chamfer grid)
    const P = NR, gx = clamp((x - P.x0) / P.dc, 0, P.dnx - 1.001), gz = clamp((z - P.z0) / P.dc, 0, P.dnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.dnx, a = P.dist;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function nrLC(x, z) {   // land cover class at (x, z)
    const L = NR.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell);
    return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : NR.lc[j * L.nx + i];
  }
  function nrEdge(x, z) {   // how much the edge of the woods reaches onto this open 16 m land-cover cell (0-1, cached): forest in the cells around it, or forest just behind it as seen from the road
    const P = NR, L = P.L, lc = P.lc, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell);
    if (i < 1 || j < 1 || i >= L.nx - 1 || j >= L.nz - 1) return 0;
    const k = j * L.nx + i; let e = P.edge[k]; if (e === e) return e;
    e = 0;
    if (lc[k] === 0 || lc[k] === 2) {
      let a = 0; for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) if ((b || c) && lc[k + b * L.nx + c] === 1) a += b && c ? 0.7 : 1;
      e = Math.min(1, a / 3) * 0.5;   // a fringe of scrub and young trees along the woods
      const cx = L.x0 + (i + 0.5) * L.cell, cz = L.z0 + (j + 0.5) * L.cell;
      if (nrDist(cx, cz) < 56) {   // the strip between the track and the forest behind it (outward: up the distance field)
        const gx = nrDist(cx + 4, cz) - nrDist(cx - 4, cz), gz = nrDist(cx, cz + 4) - nrDist(cx, cz - 4), gl = Math.hypot(gx, gz) || 1;
        if (nrLC(cx + gx / gl * 16, cz + gz / gl * 16) === 1) e = Math.max(e, 0.85); else if (nrLC(cx + gx / gl * 32, cz + gz / gl * 32) === 1) e = Math.max(e, 0.6);
      }
    }
    return (P.edge[k] = e);
  }
  function nrLCf(x, z, c) {   // share of land cover class c around (x, z), bilinear over the cell centres (soft edges for the ground colours)
    const L = NR.L, lc = NR.lc, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function nrDem(x, z) {   // real terrain height (bilinear on the 64 m grid)
    const P = NR, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function nrNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier
    const P = NR, cx = Math.floor(x / NRHC) - P.cx0, cz = Math.floor(z / NRHC) - P.cz0, ds = T.ds, N = T.N;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const Lc = P.cells[b * P.ncx + a]; if (!Lc) continue;
      for (let q = 0; q < Lc.length; q++) {
        const i = Lc[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * (T.hy[i] + nrBankY(i, lat));
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    NRN.i = bi; NRN.d = bd; NRN.dd = bdd; NRN.lat = bl;
    if (bi < 0) return NRN;
    NRN.h = hs / ws;
    const f = bi + ba / ds, fi = Math.floor(f), i0 = ((fi % N) + N) % N, i1 = (i0 + 1) % N; NRN.hn = T.hy[i0] + (T.hy[i1] - T.hy[i0]) * (f - fi) + nrBankY(i0, bl);   // road height across from the point (the loop wraps; the banked edge)
    return NRN;
  }
  function nrBankY(i, o) { const b = T.bank ? T.bank[i] : 0; return b > 0 ? -b * clamp(o * T.bankSide[i], -T.w, T.w + 6) : 0; }   // banked corner: height offset at lateral offset o (as Track.bankAt)
  function nrFar(x, z) { const P = NR, k = P.D.noise != null ? P.D.noise : 1; return nrDem(x, z) + (P.n1(x, z) - 0.5) * 6 * k + (P.n2(x, z) - 0.5) * 2.2 * k; }   // the landscape away from the road (D.noise: less made-up relief on a finer grid)
  function nrH(x, z) {   // terrain height
    const n = nrNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = nrFar(x, z);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, nrFar(x, z), sstep(2, 60, dd)); }
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, only a gentle rise right behind them
    for (const b of NR.br || []) {   // a cutting for the road under a bridge of the track: flat 12 m wide at the bottom, steep sides, rising to the land 45-95 m out
      const dx = x - b.x, dz = z - b.z, al = Math.abs(dx * b.tx + dz * b.tz), lat = Math.abs(dx * b.nx + dz * b.nz);
      if (al < 18 && lat < 95) h = Math.min(h, lerp(h, b.y, sstep(95, 45, lat)) + Math.max(0, al - 6) * 1.1);
    }
    NRN.dd = i >= 0 ? dd : 999;
    return NR.pad ? NR.pad(x, z, h) : h;   // (pad: level ground the world builder asks for, e.g. under the Red Bull Ring's pit building)
  }
  function nrGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = NR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { G.h[k] = nrH(G.x0 + i * NRC, G.z0 + j * NRC); G.dd[k] = NRN.dd; h = G.h[k]; }   // (the stored float32 value: the same whichever part of the build asks first)
    return h;
  }
  function nrGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = NR.G, gx = clamp((x - G.x0) / NRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / NRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = nrGH(i, j); return a + u * (nrGH(i + 1, j) - a) + v * (nrGH(i, j + 1) - a); }
    const d = nrGH(i + 1, j + 1); return d + (1 - u) * (nrGH(i, j + 1) - d) + (1 - v) * (nrGH(i + 1, j) - d);
  }
  function nrSlope(x, z) { const a = nrGround(x - 3, z), b = nrGround(x + 3, z), c = nrGround(x, z - 3), d = nrGround(x, z + 3); return Math.hypot(b - a, d - c) / 6; }
  const NRFT = [[0, 0, 0], [0.07, 0.08, 0.01], [0.26, 0.08, -0.08], [-0.14, -0.05, -0.02], [0.2, -0.07, -0.06]];   // field tones: pasture, fresh-mown, hay, dark lush grass, stubble
  const nrFT = (t) => NRFT[t < 0.42 ? 0 : t < 0.64 ? 1 : t < 0.82 ? 2 : t < 0.94 ? 3 : 4];
  function nrField(x, z, o) {   // the colour offset of the field at (x, z) into o (soft 12 m borders between the fields)
    const F = NR.F, ci = clamp(Math.floor(x / F.S) - F.i0, 1, F.ni - 2), cj = clamp(Math.floor(z / F.S) - F.j0, 1, F.nj - 2), C = F.c; let d1 = 1e18, d2 = 1e18, k1 = 0, k2 = 0;
    for (let b = cj - 1; b <= cj + 1; b++) for (let a = ci - 1; a <= ci + 1; a++) { const k = (b * F.ni + a) * 3, dx = x - C[k], dz = z - C[k + 1], d = dx * dx + dz * dz; if (d < d1) { d2 = d1; k2 = k1; d1 = d; k1 = k; } else if (d < d2) { d2 = d; k2 = k; } }
    const e = (d2 - d1) / (2 * Math.hypot(C[k1] - C[k2], C[k1 + 1] - C[k2 + 1]) + 1e-6), w = 0.5 + 0.5 * sstep(0, 6, e), A = nrFT(C[k1 + 2]), B = nrFT(C[k2 + 2]);   // (e: the distance to the border)
    o[0] = lerp(B[0], A[0], w); o[1] = lerp(B[1], A[1], w); o[2] = lerp(B[2], A[2], w); return o;
  }
  const NRFO = [0, 0, 0];
  function nrCol(x, z, ny, dd, cov) {   // ground colour (multiplies the olive grass map): meadows in patches (lush, clover, hay), the forest floor under the trees (cov: their canopy), scrub, lawns and car parks by the villages, bare earth on steep banks, a mown verge
    if (NR.colFn) return NR.colFn(x, z, ny, dd, cov, NRCOL);   // (a world with its own palette: Spa)
    const P = NR, m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
    let r = 1.0 + (m - 0.5) * 0.2 + (q - 0.5) * 0.18, g = 1.0 + (m - 0.5) * 0.16 + (q - 0.5) * 0.09, b = 0.98 + (m - 0.5) * 0.14 + (q - 0.5) * 0.06;
    const hay = sstep(0.52, 0.78, P.n5(x, z)) * 0.7; r += hay * 0.3; g += hay * 0.1; b -= hay * 0.02;   // hay meadows (yellowish)
    const lu = sstep(0.56, 0.8, P.n2(x, z)) * (1 - hay) * 0.8; r -= lu * 0.2; g -= lu * 0.05; b -= lu * 0.02;   // lush patches: clover and weeds (darker, bluer)
    const fw = (1 - fo) * (1 - sc) * (1 - se) * sstep(5, 18, dd); if (fw > 0) { const f = nrField(x, z, NRFO); r += f[0] * fw; g += f[1] * fw; b += f[2] * fw; }   // farmland away from the track
    const fl = Math.max(clamp(cov, 0, 1), fo * lerp(0.3, 1, sstep(225, 250, nrDist(x, z))));   // (no trees are placed beyond 250 m: the land cover alone there)
    r = lerp(r, 0.5 + m * 0.16, fl); g = lerp(g, 0.46 + m * 0.1, fl); b = lerp(b, 0.5 + m * 0.06, fl);   // needles, leaf litter and moss under the trees
    r = lerp(r, 0.88, sc * 0.6); g = lerp(g, 0.84, sc * 0.6); b = lerp(b, 0.74, sc * 0.6);
    const S = P.seC || NR_SE; r = lerp(r, S[0], se * 0.7); g = lerp(g, S[1], se * 0.7); b = lerp(b, S[2], se * 0.7);   // (lawns and car parks)
    const st = sstep(0.86, 0.66, ny) * 0.8; r = lerp(r, 1.2, st); g = lerp(g, 0.76, st); b = lerp(b, 0.92, st);   // bare earth on steep banks
    if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 0.98, t); g = lerp(g, 1.04, t); b = lerp(b, 0.96, t); }   // mown verge right behind the rails
    NRCOL[0] = r; NRCOL[1] = g; NRCOL[2] = b; if (P.colMod) P.colMod(x, z, NRCOL, dd); return NRCOL;   // (colMod: a world's own touches)
  }
  function nrVCol(i, j) {   // grid vertex (i, j): its colour's index in G.col, coloured once per build (as a full tile's vertex: the normal from the neighbours)
    const G = NR.G, k = j * G.nx + i, C = G.col; if (C[k * 3] === C[k * 3]) return k * 3;
    nrGH(i, j); const nx = (nrGH(i + 1, j) - nrGH(i - 1, j)) / (2 * NRC), nz = (nrGH(i, j + 1) - nrGH(i, j - 1)) / (2 * NRC), c = nrCol(G.x0 + i * NRC, G.z0 + j * NRC, 1 / Math.hypot(nx, 1, nz), G.dd[k], G.cov[k]);
    C[k * 3] = c[0]; C[k * 3 + 1] = c[1]; C[k * 3 + 2] = c[2]; return k * 3;
  }
  function nrGCol(x, z) {   // the terrain mesh's vertex colour at (x, z) (bilinear over the grid vertices)
    const G = NR.G, C = G.col, gx = clamp((x - G.x0) / NRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / NRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const q = nrVCol(i + a, j + b); o[0] += C[q] * w; o[1] += C[q + 1] * w; o[2] += C[q + 2] * w; }
    return o;
  }
  function nrShade(x, z, r, s) {   // a tree's crown over the ground (G.cov at the grid vertices): s in the middle, fading out 3 m past the crown's edge r
    const G = NR.G, R2 = r + 3, i0 = Math.max(0, Math.ceil((x - R2 - G.x0) / NRC)), i1 = Math.min(G.nx - 1, Math.floor((x + R2 - G.x0) / NRC)), j0 = Math.max(0, Math.ceil((z - R2 - G.z0) / NRC)), j1 = Math.min(G.nz - 1, Math.floor((z + R2 - G.z0) / NRC));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(G.x0 + i * NRC - x, G.z0 + j * NRC - z); if (d < R2) G.cov[j * G.nx + i] += s * sstep(R2, r * 0.3, d); }
  }
  function nrTileOn(ti, tj) {   // 0: none, 1: full tile (8 m cells), 2: coarse outer ring (32 m cells, in the haze)
    const G = NR.G, L = NRC * NRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = nrDist(x, z);
    return d < 190 + L * 0.71 ? 1 : d < 330 + L * 0.71 ? 2 : 0;
  }
  function nrTileGeo(ti, tj, st) {   // one 256 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles)
    const G = NR.G, m = NRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), i0 = ti * NRT, j0 = tj * NRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * NRC, z = G.z0 + j * NRC, h = nrGH(i, j);
      let nx = -(nrGH(i + st, j) - nrGH(i - st, j)) / (2 * NRC * st), nz = -(nrGH(i, j + st) - nrGH(i, j - st)) / (2 * NRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      if (st === 1) { const q = nrVCol(i, j), C = G.col; col[k * 3] = C[q]; col[k * 3 + 1] = C[q + 1]; col[k * 3 + 2] = C[q + 2]; }   // (cached: the verges take their outer colours from it)
      else { const kk = clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1), c = nrCol(x, z, ny, G.dd[kk], G.cov[kk]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; }
      uv[k * 2] = x / 14; uv[k * 2 + 1] = -z / 14;
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  // indexed ribbon: rows of cross-section points, quads between two rows (shared vertices, smooth normals); alpha: rgba vertex colours
  class RB {
    constructor(uv, alpha) { this.P = []; this.C = []; this.U = uv ? [] : null; this.I = []; this.n = 0; this.A = alpha ? 4 : 3; }
    row(pts, cols, uvs) { const b = this.n; for (let k = 0; k < pts.length; k++) { const p = pts[k], c = cols[k]; this.P.push(p[0], p[1], p[2]); this.C.push(c[0], c[1], c[2]); if (this.A > 3) this.C.push(c[3]); if (this.U) this.U.push(uvs[k][0], uvs[k][1]); } this.n += pts.length; return b; }
    link(r0, r1, k0, k1) { for (let k = k0; k < k1; k++) { const a = r0 + k, b = a + 1, c = r1 + k + 1, d = r1 + k; this.I.push(a, b, d, b, c, d); } }   // (up-facing when the rows run left -> right and follow the road)
    get empty() { return this.I.length === 0; }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, this.A));
      if (this.U) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
      g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    }
  }
  // a chunk's instances in up to 4 x 4 boxes (in the chunk mesh's own space: x and z from its centre), m.userData.vb: on the lower tiers
  // Render draws a chunk only while one of its boxes is in view, and its shadow copy only while one is in the sun's shadow box (three.js
  // tests the chunk's one bounding sphere, up to ~100 m round: a chunk beside, behind or below the camera was drawn whole). An instance's
  // box: the unit plant's reach round its axis and its height at the instance's scale, the wind's sway on top (the plants' shaders: up to
  // 0.16 y² of the unit plant), a metre all round (the crowd's poses: sitting, hopping; a raised flag's tip can reach up to ~0.9 m above the
  // box, but inside its footprint, so the chase camera never sees the tip with the whole box out of view)
  const _vbV = new THREE.Vector3();
  function chunkBoxes(L, cx, cz, ext) {
    const G = 4; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let k = 0; k < L.length; k += 9) { x0 = Math.min(x0, L[k]); x1 = Math.max(x1, L[k]); z0 = Math.min(z0, L[k + 2]); z1 = Math.max(z1, L[k + 2]); }
    const B = [], gx = (x1 - x0) / G || 1, gz = (z1 - z0) / G || 1;
    for (let k = 0; k < L.length; k += 9) {
      const i = Math.min(G - 1, Math.floor((L[k] - x0) / gx)), j = Math.min(G - 1, Math.floor((L[k + 2] - z0) / gz)), b = B[j * G + i] || (B[j * G + i] = new THREE.Box3());
      const h = ext[0] * L[k + 4] + 1, x = L[k] - cx, z = L[k + 2] - cz;
      b.expandByPoint(_vbV.set(x - h, L[k + 1] + ext[1] * L[k + 5] - 1, z - h)); b.expandByPoint(_vbV.set(x + h, L[k + 1] + ext[2] * L[k + 5] + 1, z + h));
    }
    return B.filter(Boolean);
  }
  // instanced meshes per square chunk (three.js culls an InstancedMesh by its geometry's bounding sphere only: each chunk gets its own
  // geometry object sharing the base attributes, placed at the chunk centre with a sphere around all its instances)
  class IChunks {
    constructor(base, mat, size) { this.base = base; this.mat = mat; this.size = size || 256; this.map = new Map(); }
    add(x, y, z, rot, sxz, sy, col) { const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let L = this.map.get(k); if (!L) this.map.set(k, L = []); L.push(x, y, z, rot, sxz, sy, col ? col[0] : 1, col ? col[1] : 1, col ? col[2] : 1); }
    addTo(group, cast) {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(), bs = this.base.boundingSphere || (this.base.computeBoundingSphere(), this.base.boundingSphere);
      let n = 0;
      const pa = this.base.attributes.position.array; let rh = 0, by0 = Infinity, by1 = -Infinity;   // (the unit plant's reach round its axis, its foot and top: chunkBoxes)
      for (let k = 0; k < pa.length; k += 3) { rh = Math.max(rh, Math.hypot(pa[k], pa[k + 2])); by0 = Math.min(by0, pa[k + 1]); by1 = Math.max(by1, pa[k + 1]); }
      const ext = [rh + 0.16 * Math.max(by0 * by0, by1 * by1), by0, by1];
      const lo = cast && LOD.tier === 0 && !this.mat.alphaTest && !this.mat.transparent ? shadowLo(this.base) : null;
      for (const L of this.map.values()) {
        const cnt = L.length / 9; let cx = 0, cz = 0, y0 = 1e9, y1 = -1e9, smax = 0;
        for (let k = 0; k < L.length; k += 9) { cx += L[k]; cz += L[k + 2]; y0 = Math.min(y0, L[k + 1]); y1 = Math.max(y1, L[k + 1]); smax = Math.max(smax, L[k + 4], L[k + 5]); }
        cx /= cnt; cz /= cnt;
        const g = new THREE.BufferGeometry(); for (const a in this.base.attributes) g.setAttribute(a, this.base.attributes[a]); if (this.base.index) g.setIndex(this.base.index);
        let r = 0; for (let k = 0; k < L.length; k += 9) r = Math.max(r, Math.hypot(L[k] - cx, L[k + 2] - cz));
        const ym = (y0 + y1) / 2; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, ym + bs.center.y * smax, 0), Math.hypot(r + bs.radius * smax, (y1 - y0) / 2 + bs.radius * smax));
        const im = new THREE.InstancedMesh(g, this.mat, cnt); im.frustumCulled = true; im.position.set(cx, 0, cz); im.updateMatrix(); im.matrixAutoUpdate = false; im.castShadow = !!cast; im.receiveShadow = true;   // (r128 turns culling off for instanced meshes)
        for (let k = 0, t = 0; k < L.length; k += 9, t++) {
          e.set(0, L[k + 3], 0); q.setFromEuler(e); v.set(L[k] - cx, L[k + 1], L[k + 2] - cz); s.set(L[k + 4], L[k + 5], L[k + 4]); m4.compose(v, q, s); im.setMatrixAt(t, m4);
          c.setRGB(L[k + 6], L[k + 7], L[k + 8]); im.setColorAt(t, c);
        }
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.userData.vb = chunkBoxes(L, cx, cz, ext);
        group.add(im); cullAdd(im, cx, cz, g.boundingSphere.radius); n += cnt;   // vegetation/rocks: distance-cullable on the lower tiers
        if (lo) {   // NIZKA: its shadow from the coarser copy (the same instances), in the shadow pass alone
          const sg = new THREE.BufferGeometry(); sg.setAttribute('position', lo.attributes.position); sg.setIndex(lo.index); sg.boundingSphere = g.boundingSphere;
          const sm = new THREE.InstancedMesh(sg, shloMat(), cnt); sm.instanceMatrix = im.instanceMatrix; sm.position.copy(im.position); sm.updateMatrix(); sm.matrixAutoUpdate = false;
          sm.frustumCulled = true; sm.castShadow = true; sm.receiveShadow = false; sm.visible = false; im.castShadow = false; group.add(sm); SHLO.push([sm, im]);
        }
      }
      return n;
    }
  }

  /* ================= SPECTATORS: an instanced crowd layer on IChunks, used by every world builder =================
     One figure is 168 index verts (112 vertices): legs, torso, head, two arms and a flag that stays folded away unless the figure waves one.
     Vertex attribute aPart = bone * 10 + colour group; per instance aCrowd = (pose + phase, variant). The shader tints only the shirt, caps and
     long sleeves with the instance colour; skin, trousers, hair and flags come from small palettes picked by the variant (a hash of the position).
     Poses: 0 standing, 1 cheering, 2 waving, 3 filming, 4 clapping, 5 flag, 6 sitting on the grass. The arms move with uTime; people within
     ~50 m of the followed car (uCar) throw their arms up and jump. No shadow casting (a vertex-animated caster would need its own depth
     material); a multiply-blended dark strip on the ground under the rows grounds them instead. */
  function crH(a, b, c) {   // position hash -> [0, 1) (no RNG draws, so the seeded scenery is not re-rolled)
    let h = Math.imul(Math.round(a * 16) | 0, 0x27d4eb2d) ^ Math.imul(Math.round(b * 16) | 0, 0x165667b1) ^ Math.imul(((Math.round(c * 16) | 0) + 0x3c6ef372) | 0, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function crNoise(u) { const i = Math.floor(u), f = u - i, a = crH(i, 0, 99), b = crH(i + 1, 0, 99); return a + (b - a) * f * f * (3 - 2 * f); }   // smooth 1D value noise (clumps along a run)
  const CR_SHIRTS = [[0.88, 0.16, 0.13], [0.95, 0.8, 0.18], [0.16, 0.4, 0.86], [0.94, 0.94, 0.92], [0.18, 0.62, 0.28], [0.98, 0.52, 0.1], [0.12, 0.13, 0.16], [0.6, 0.18, 0.5], [0.14, 0.5, 0.58], [0.82, 0.82, 0.84], [0.5, 0.32, 0.22], [0.2, 0.24, 0.42]];
  let crGeoC = null;
  function crowdGeo() {   // the figure (1.72 m, facing local +z), built once and shared by every world
    if (crGeoC) return crGeoC;
    const P = [], Nm = [], Cl = [], Pa = [], Ix = [], W1 = [1, 1, 1];
    const quad = (a, b, c, d, ins, part, col) => {   // flat quad facing away from 'ins'
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const flip = nx * ((a[0] + c[0]) / 2 - ins[0]) + ny * ((a[1] + c[1]) / 2 - ins[1]) + nz * ((a[2] + c[2]) / 2 - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
      for (const p of flip ? [a, d, c, b] : [a, b, c, d]) { P.push(p[0], p[1], p[2]); Nm.push(nx * s, ny * s, nz * s); Cl.push(col[0], col[1], col[2]); Pa.push(part); }
      Ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
    };
    const cub = (x0, x1, y0, y1, z0, z1, f) => {   // box faces px/nx/py/ny/pz/nz -> [part, colour]; missing faces are left out
      const ins = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], F = {
        px: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], nx: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
        py: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], ny: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        pz: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], nz: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]] };
      for (const k in f) { const q = F[k]; quad(q[0], q[1], q[2], q[3], ins, f[k][0], f[k][1]); }
    };
    // bones: 0 body, 1 left arm, 2 right arm, 3 legs, 4 flag pole (in the right hand), 5 flag cloth; colour groups: 0 as modelled, 1 shirt,
    // 2 skin, 3 trousers, 4 hair / cap, 5 sleeve (shirt or bare arm), 6 / 7 the flag's two stripes
    cub(-0.17, 0.17, 0, 0.84, -0.11, 0.11, { px: [33, W1], nx: [33, W1], pz: [33, W1], nz: [33, W1], ny: [30, [0.12, 0.1, 0.09]] });   // legs, dark soles (seen when sitting)
    cub(-0.22, 0.22, 0.84, 1.42, -0.13, 0.13, { px: [1, W1], nx: [1, W1], pz: [1, W1], nz: [1, W1], py: [1, W1] });   // torso
    cub(-0.11, 0.11, 1.44, 1.7, -0.12, 0.12, { px: [2, W1], nx: [2, W1], pz: [2, W1], nz: [4, W1], py: [4, W1] });   // head: face and ears, hair (or a cap) on top and at the back
    for (const sd of [-1, 1]) { const b = sd < 0 ? 10 : 20, x0 = sd < 0 ? -0.32 : 0.22; cub(x0, x0 + 0.1, 0.8, 1.4, -0.06, 0.06, { px: [b + 5, W1], nx: [b + 5, W1], pz: [b + 5, W1], nz: [b + 5, W1], ny: [b + 2, W1] }); }   // arms, the hand at the end
    quad([0.26, 0.82, 0.09], [0.3, 0.82, 0.09], [0.3, -0.68, 0.09], [0.26, -0.68, 0.09], [0.28, 0, 0], 40, [0.84, 0.84, 0.86]);   // flag pole, one quad (mirrored to face the camera)
    for (const [y0, y1, cg] of [[-0.955, -0.68, 56], [-1.23, -0.955, 57]]) quad([0.3, y1, 0.09], [1.2, y1, 0.09], [1.2, y0, 0.09], [0.3, y0, 0.09], [0.75, y0, 0], cg, W1);   // the cloth: two stripes
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1)); g.setIndex(Ix);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.4);   // covers raised arms, the flag and a jump
    return (crGeoC = g);
  }
  const CR_VS_HEAD = [
    'attribute float aPart;', 'attribute vec2 aCrowd;', 'uniform float uTime;', 'uniform vec3 uCar;', 'uniform float uHype;',
    'mat3 crRx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }',
    'mat3 crRz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }',
    'vec3 crP4(float i, vec3 a, vec3 b, vec3 c, vec3 d) { return i < 0.5 ? a : i < 1.5 ? b : i < 2.5 ? c : d; }'].join('\n');
  const CR_VS_COLOR = [   // replaces <color_vertex>: only the shirt, caps and long sleeves take the instance colour
    'float crBone = floor(aPart * 0.1 + 0.01), crCg = aPart - crBone * 10.0;',
    'float crPose = floor(aCrowd.x), crPh = fract(aCrowd.x) * 6.2832, crV = aCrowd.y;',
    '#ifdef USE_INSTANCING_COLOR', 'vec3 crShirt = instanceColor;', '#else', 'vec3 crShirt = vec3(1.0);', '#endif',
    'vec3 crSkin = crP4(mod(crV, 4.0), vec3(0.96, 0.78, 0.63), vec3(0.86, 0.63, 0.47), vec3(0.66, 0.45, 0.31), vec3(0.42, 0.29, 0.2));',
    'float crHa = mod(floor(crV / 16.0), 8.0), crFl = mod(floor(crV / 256.0), 4.0);',
    'vec3 crTint = vec3(1.0);',
    'if (crCg > 0.5 && crCg < 1.5) crTint = crShirt;',
    'else if (crCg > 1.5 && crCg < 2.5) crTint = crSkin;',
    'else if (crCg > 2.5 && crCg < 3.5) crTint = crP4(mod(floor(crV / 4.0), 4.0), vec3(0.19, 0.27, 0.44), vec3(0.1, 0.1, 0.12), vec3(0.5, 0.44, 0.33), vec3(0.33, 0.34, 0.37));',
    'else if (crCg > 3.5 && crCg < 4.5) crTint = crHa < 3.5 ? crP4(crHa, vec3(0.1, 0.08, 0.06), vec3(0.3, 0.19, 0.11), vec3(0.68, 0.52, 0.28), vec3(0.56, 0.55, 0.53)) : crHa < 4.5 ? vec3(0.05) : crHa < 5.5 ? crShirt : crHa < 6.5 ? vec3(0.94) : vec3(0.08, 0.1, 0.18);',
    'else if (crCg > 4.5 && crCg < 5.5) crTint = mod(floor(crV / 128.0), 2.0) > 0.5 ? crShirt : crSkin;',
    'else if (crCg > 5.5) crTint = crCg < 6.5 ? crP4(crFl, vec3(0.95), vec3(0.84, 0.1, 0.12), vec3(0.1, 0.33, 0.78), vec3(0.1, 0.5, 0.22)) : crP4(crFl, vec3(0.84, 0.1, 0.12), vec3(0.95), vec3(0.98, 0.8, 0.1), vec3(0.95));',
    'vColor = color * crTint;'].join('\n');
  const CR_VS_NORMAL = [   // after <beginnormal_vertex>: pose -> arm (or leg) rotation about its joint; the same matrix moves the vertex below
    '#include <beginnormal_vertex>',
    'vec3 crW = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;',
    'vec3 crFw = (modelMatrix * (instanceMatrix * vec4(0.0, 0.0, 1.0, 0.0))).xyz;',
    'float crMir = dot(cameraPosition - crW, crFw) < 0.0 ? 1.0 : 0.0;',   // seen from behind: mirror the flag so its one-sided quads face the camera
    'float crSit = abs(crPose - 6.0) < 0.5 ? 1.0 : 0.0;',
    'float crDc = length(crW.xz - uCar.xz), crHy = uHype * (1.0 - smoothstep(50.0, 170.0, crDc));',   // (uHype: an overtake, the finish)
    'float crEx = max(1.0 - smoothstep(14.0, 52.0, crDc), crHy) * step(0.28, fract(crPh * 2.713 + crV * 0.0171));',
    'float crFlag = (abs(crPose - 5.0) < 0.5 || crHy * 0.45 > fract(crPh * 5.13 + crV * 0.0093)) ? 1.0 : 0.0;',   // (a flag: the flag pose, and then many more)
    'float crT = uTime * (0.85 + 0.3 * fract(crPh * 3.7)) + crPh;',
    'float rL = 0.07, rR = 0.07, fL = 0.05, fR = 0.05;',   // r: raised sideways (0 down, pi up), f: raised forwards
    'if (crPose < 0.5) { rL = 0.07 + 0.05 * sin(crT * 0.9); rR = 0.07 + 0.05 * sin(crT * 0.8 + 1.3); }',
    'else if (crPose < 1.5) { rL = 2.5 + 0.3 * sin(crT * 7.0); rR = 2.5 + 0.3 * sin(crT * 7.0 + 0.7); fL = -0.3; fR = -0.3; }',
    'else if (crPose < 2.5) { rR = 2.3 + 0.45 * sin(crT * 6.0); fR = -0.2; }',
    'else if (crPose < 3.5) { rL = -0.32; rR = -0.32; fL = 1.35; fR = 1.35; }',
    'else if (crPose < 4.5) { rL = -0.2 + 0.18 * sin(crT * 10.0); rR = rL; fL = 0.95; fR = 0.95; }',
    'else if (crPose < 5.5) { rR = 2.8 + 0.14 * sin(crT * 2.4); fR = -0.12; rL = 0.1; }',
    'else { rL = 0.15; rR = 0.15; fL = 0.6; fR = 0.6; }',
    'if (crPose < 4.5 || crSit > 0.5) { float up = 2.55 + 0.35 * sin(uTime * 9.0 + crPh); rL = mix(rL, up, crEx); rR = mix(rR, up + 0.1, crEx); fL = mix(fL, -0.25, crEx); fR = mix(fR, -0.25, crEx); }',
    'if (crFlag > 0.5 && abs(crPose - 5.0) > 0.5) { rR = 2.7 + 0.35 * sin(crT * 6.5); fR = -0.12; }',   // (waving the flag)
    'mat3 crM = mat3(1.0); vec3 crPv = vec3(0.0);',
    'if (crBone > 0.5 && crBone < 1.5) { crM = crRx(-fL) * crRz(-rL); crPv = vec3(-0.27, 1.37, 0.0); }',
    'else if ((crBone > 1.5 && crBone < 2.5) || crBone > 3.5) { crM = crRx(-fR) * crRz(rR); crPv = vec3(0.27, 1.37, 0.0); }',
    'else if (crBone > 2.5 && crSit > 0.5) { crM = crRx(-1.5); crPv = vec3(0.0, 0.84, 0.0); }',
    'if (crBone > 3.5 && crMir > 0.5) objectNormal.z = -objectNormal.z;',
    'if (crBone < 4.5) objectNormal = crM * objectNormal;'].join('\n');
  const CR_VS_POS = [   // replaces <begin_vertex>
    'vec3 transformed = vec3(position);',
    'if (crBone > 4.5) {',   // the cloth hangs from the pole tip (which follows the hand) and flutters
    '  vec3 at = vec3(0.28, -0.68, 0.09), off = transformed - at;',
    '  off.z += sin(uTime * 7.0 - off.x * 6.0 + crPh) * 0.13 * off.x;',
    '  off.y -= 0.1 * off.x * (0.6 + 0.4 * sin(uTime * 3.1 + crPh));',
    '  if (crMir > 0.5) off.x = -off.x;',
    '  transformed = crPv + crM * (at - crPv) + off;',
    '} else {',
    '  if (crBone > 3.5 && crMir > 0.5) transformed.x = 0.56 - transformed.x;',
    '  transformed = crPv + crM * (transformed - crPv);',
    '}',
    'if (crBone > 3.5 && crFlag < 0.5) transformed = crPv;',   // no flag: fold it into the hand (degenerate, draws nothing)
    'if (crSit > 0.5) transformed += vec3(0.0, -0.71, -0.55);',   // sitting: down on the grass, moved back so the feet stay behind the fence
    'else transformed.y += crEx * max(0.0, sin(uTime * 8.0 + crPh)) * 0.16;'].join('\n');
  function crowdMat(U) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uCar = U.uCar; sh.uniforms.uHype = U.uHype;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CR_VS_HEAD).replace('#include <color_vertex>', CR_VS_COLOR)
        .replace('#include <beginnormal_vertex>', CR_VS_NORMAL).replace('#include <begin_vertex>', CR_VS_POS);
    };
    m.customProgramCacheKey = () => 'crowd2';
    return m;
  }
  // who a figure is (no spectators beside the road on the real tracks, fansOn): CRD inside crowdRun / crowdAt (a crowd's rows: spectators);
  // CRP inside crowdPut, CRS its figure staff (a marshal, a cameraman: the world's o.staff); a world's own put (Spa's marshals and cameramen)
  // staff by its colour (hi-vis orange or yellow) or the filming pose
  let CRD = 0, CRP = 0, CRS = false;
  const hiVis = (c) => !!c && ((c[0] > 0.75 && c[1] > 0.3 * c[0] && c[1] < 0.75 * c[0] && c[2] < 0.25 * c[0]) || (c[1] > 0.75 && c[0] > 0.55 && c[2] < 0.3 * c[1]));
  class CrowdChunks extends IChunks {   // IChunks plus a per-instance (pose + phase, variant) attribute
    constructor(U, size) { super(crowdGeo(), crowdMat(U), size || 128); this.aux = new Map(); }   // (size: the chunk, 128 m unless a world asks for finer culling)
    put(x, y, z, rot, sxz, sy, col, pose, variant) {
      if (CRD || !(CRP ? CRS : Math.floor(pose) === 3 || hiVis(col))) (this.fans || (this.fans = new Set())).add(x + ',' + z);   // (a spectator: not drawn on the real tracks, crowdLayer)
      this.add(x, y, z, rot, sxz, sy, col);
      const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let A = this.aux.get(k); if (!A) this.aux.set(k, A = []); A.push(pose, variant);
    }
    cull(bad) {   // drop the instances where bad(x, z) (e.g. inside a building placed after them)
      let n = 0;
      for (const [k, L] of [...this.map]) { const A = this.aux.get(k), L2 = [], A2 = [];
        for (let q = 0, t = 0; q < L.length; q += 9, t += 2) { if (bad(L[q], L[q + 2])) { n++; continue; } for (let e = 0; e < 9; e++) L2.push(L[q + e]); A2.push(A[t], A[t + 1]); }
        if (L2.length) { this.map.set(k, L2); this.aux.set(k, A2); } else { this.map.delete(k); this.aux.delete(k); } }
      return n;
    }
    addTo(group) {   // no shadow casting; every chunk mesh gets its aCrowd buffer (IChunks.addTo walks the chunks in map order)
      const c0 = group.children.length, n = super.addTo(group, false); let c = c0;
      for (const k of this.map.keys()) { const im = group.children[c++]; im.name = 'crowd'; im.geometry.setAttribute('aCrowd', new THREE.InstancedBufferAttribute(new Float32Array(this.aux.get(k)), 2)); }
      return n;
    }
  }
  // A placement context per world build. o: gH(x, z) ground height (or grid: the generic ground mesh), near(x, z) distance beyond the nearest
  // barrier (negative on the road), excluded(x, z), water(x, z), maxSlope, shirts, chunk (the instancing chunk, default 128 m). Runs keep their own
  // tree-exclusion circles (exclTest).
  function crowdCtx(o) {
    const U = { uTime: { value: 0 }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uHype: { value: 0 } };
    const C = Object.assign({ U, ppl: new CrowdChunks(U, o && o.chunk), strip: new Chunks(384), runs: 0, n: 0, busy: false, sp: new Map(), eh: new Map(), circ: [], blocks: [], avoidL: [], shirts: CR_SHIRTS, maxSlope: 0.6, log: [] }, o);
    CROWDS.push(C);
    if (C.grid && !C.gH) { const G = C.grid; C.gH = (x, z) => {   // height of the ground mesh surface (the same two triangles per cell)
      const gx = clamp((x - G.x0) / G.cell, 0, G.nx - 1.001), gz = clamp((z - G.z0) / G.cell, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, A = G.arr, Y = (a, b) => A[((j + b) * G.nx + i + a) * 3 + 1];
      return u + v <= 1 ? Y(0, 0) + u * (Y(1, 0) - Y(0, 0)) + v * (Y(0, 1) - Y(0, 0)) : Y(1, 1) + (1 - u) * (Y(0, 1) - Y(1, 1)) + (1 - v) * (Y(1, 0) - Y(1, 1)); }; }
    C.exclAdd = (x, z, r) => { const e = { x, z, r }; C.circ.push(e); for (let a = Math.floor((x - r) / 16); a <= Math.floor((x + r) / 16); a++) for (let b = Math.floor((z - r) / 16); b <= Math.floor((z + r) / 16); b++) { const k = a + ',' + b; let L = C.eh.get(k); if (!L) C.eh.set(k, L = []); L.push(e); } };
    C.exclTest = (x, z) => { if (C.busy) return false; const L = C.eh.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); if (!L) return false; for (const e of L) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    C.avoid = (x, z, r) => C.avoidL.push([x, z, r]);   // small obstacles that push no exclusion (lamp posts, marshal huts)
    C.block = (x, z, W, D, rot) => C.blocks.push({ x, z, c: Math.cos(rot), s: Math.sin(rot), hw: W / 2 + 0.3, hd: D / 2 + 0.3 });   // building footprints placed after the crowds
    return C;
  }
  function crFree(C, x, z) {   // nobody closer than 0.55 m, no small obstacle
    const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = C.sp.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((x - L[q]) ** 2 + (z - L[q + 1]) ** 2 < 0.3) return false; }
    for (const [ax, az, r] of C.avoidL) if ((x - ax) ** 2 + (z - az) ** 2 < r * r) return false;
    return true;
  }
  // one spectator at (x, y, z) facing (fx, fz); o: sit (share sitting in the front row), flag (share with a flag), shirts; row 0 = front
  function crowdPut(C, x, y, z, fx, fz, o, row) {
    if (!crFree(C, x, z)) return false;
    const h = (k) => crH(x, z, k), fl = o && o.flag != null ? o.flag : 0.05, p = h(2);
    const pose = o && o.pose != null ? o.pose : o && o.sit && row === 0 && h(1) < o.sit ? 6 : p < fl ? 5 : p < fl + 0.1 ? 1 : p < fl + 0.2 ? 2 : p < fl + 0.3 ? 3 : p < fl + 0.43 ? 4 : 0;
    const kid = h(3) < 0.04, sxz = kid ? 0.8 : 0.92 + 0.16 * h(4), sy = kid ? 0.7 : 0.9 + 0.2 * h(5);
    const pal = (o && o.shirts) || C.shirts, sc = (o && o.col) || pal[Math.floor(h(6) * pal.length)], k = 0.88 + 0.22 * h(7), sk = h(11);
    const variant = (sk < 0.42 ? 0 : sk < 0.72 ? 1 : sk < 0.9 ? 2 : 3) + 4 * Math.floor(h(10) * 256);
    CRP = 1; CRS = !!(o && o.staff);
    C.ppl.put(x, y, z, Math.atan2(fx, fz) + (h(8) - 0.5) * 0.5, sxz, sy, [sc[0] * k, sc[1] * k, sc[2] * k], pose + h(9) * 0.998, variant);
    CRP = 0;
    const key = Math.floor(x / 0.8) + ',' + Math.floor(z / 0.8); let L = C.sp.get(key); if (!L) C.sp.set(key, L = []); L.push(x, z);
    C.n++; return true;
  }
  // one spectator of an existing crowd loop at track distance s, 'extra' beyond the barrier on 'side': interpolated between the samples (the old
  // loops snap to the 2 m samples, so neighbours would stand inside each other); falls back to the loop's own spot (x0, z0) when ok(x, z) fails there
  function crowdAt(C, s, side, extra, x0, z0, o, row, ok) {
    CRD++; try { return crowdAt0(C, s, side, extra, x0, z0, o, row, ok); } finally { CRD--; }
  }
  function crowdAt0(C, s, side, extra, x0, z0, o, row, ok) {
    const q = crAt(s); if (!q) return false;
    const off = (side > 0 ? q.br : q.bl) + extra, nx = q.nx, nz = q.nz, tx = q.tx, tz = q.tz; let x = q.px + nx * side * off, z = q.pz + nz * side * off;
    if (ok && !ok(x, z)) { x = x0; z = z0; }
    const lk = 0.3 * (0.2 + crH(x, z, 12));
    return crowdPut(C, x, C.gH(x, z), z, -side * nx - tx * lk, -side * nz - tz * lk, o, row);
  }
  const CRQ = { px: 0, pz: 0, nx: 0, nz: 0, tx: 0, tz: 0, bl: 0, br: 0, hy: 0, i: 0, i0: 0, i1: 0 };
  function crAt(s) {   // track frame at s, interpolated between the samples (the samples are 2 m apart); null past the ends of an open road
    const N = T.N, f = s / T.ds; let i0 = Math.floor(f); const t = f - i0;
    if (T.open) { if (i0 < 0 || i0 >= N - 1) return null; } else i0 = ((i0 % N) + N) % N;
    const i1 = T.open ? i0 + 1 : (i0 + 1) % N, L = (a) => a[i0] + (a[i1] - a[i0]) * t, q = CRQ;
    q.px = L(T.px); q.pz = L(T.pz); q.nx = L(T.nx); q.nz = L(T.nz); q.tx = L(T.tx); q.tz = L(T.tz); q.bl = L(T.bl); q.br = L(T.br); q.hy = T.hy ? L(T.hy) : 0; q.i = t < 0.5 ? i0 : i1; q.i0 = i0; q.i1 = i1;
    return q;
  }
  // the front row's offset at a crAt() frame: the barrier segment i0 -> i1 is drawn with i0's type (a tyre wall ending there) and the next one with i1's
  const crFirstQ = (first, q, side) => Math.max(first(q.i0, side), first(q.i1, side));
  // is (x, z) inside the band [centre line, barrier + first - 0.6] of a same-side barrier segment j -> j + 1 within 12 samples of i, or closer than
  // that across a sample's own strip (|along| < 0.55 ds, as clearance() measures it for the nearest sample)? On the inside of a tight bend the
  // neighbouring samples' bands fan in over the spot, and their barriers can stand farther out than the nearest sample's
  function crInBand(i, side, x, z, first) {
    const N = T.N, bar = side > 0 ? T.br : T.bl;
    for (let d = -12; d <= 12; d++) {
      let j = i + d; if (T.open) { if (j < 0 || j > N - 1) continue; } else j = ((j % N) + N) % N;
      const dx = x - T.px[j], dz = z - T.pz[j];
      if (Math.abs(dx * T.tx[j] + dz * T.tz[j]) < T.ds * 0.55 && side * (dx * T.nx[j] + dz * T.nz[j]) < bar[j] + Math.max(first(j, side), first(T.open ? Math.max(0, j - 1) : (j + N - 1) % N, side)) - 0.6) return true;
      if (T.open && j > N - 2) continue;
      const j1 = T.open ? j + 1 : (j + 1) % N, f = first(j, side) - 0.6, oa = side * (bar[j] + f), ob = side * (bar[j1] + f);
      const P = [T.px[j], T.pz[j], T.px[j1], T.pz[j1], T.px[j1] + T.nx[j1] * ob, T.pz[j1] + T.nz[j1] * ob, T.px[j] + T.nx[j] * oa, T.pz[j] + T.nz[j] * oa];
      let ins = false; for (let a = 0, b = 3; a < 4; b = a++) { const xa = P[a * 2], za = P[a * 2 + 1], xb = P[b * 2], zb = P[b * 2 + 1]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) ins = !ins; }
      if (ins) return true;
    }
    return false;
  }
  // A crowd along s in [sa, sb) behind the barrier on one side (+1 right, -1 left), facing the road and turned a little towards the oncoming cars.
  // o: rows, dens (share of slots filled, less in the back rows), first (offset of the front row beyond the barrier: number or f(i, side)), gap (row
  // spacing), step, clump (0 even .. 1 in groups), sit, flag, below / above (allowed ground height relative to the road), maxSlope, minClear,
  // strip (dark ground strip; default on where dens >= 0.3), excl (tree exclusion, default on), keepBar (the exclusion stays this far off the barrier line), label.
  function crowdRun(C, sa, sb, side, o) {
    o = o || {};
    const rows = o.rows || 3, dens = o.dens == null ? 0.7 : o.dens, gap = o.gap || 0.95, step = o.step || 1.0, clump = o.clump == null ? 0.5 : o.clump;
    const fv = o.first == null ? 1.2 : o.first, first = typeof fv === 'function' ? fv : () => fv;
    const below = o.below == null ? 1.5 : o.below, above = o.above == null ? 6 : o.above, maxS = o.maxSlope == null ? C.maxSlope : o.maxSlope, look = o.look == null ? 0.3 : o.look;
    const gH = o.gH || C.gH, near = o.near || C.near, exc = o.excluded || C.excluded, seed = ++C.runs * 13.37, segs = new Map();
    let n = 0; C.busy = true; CRD++;
    for (let s = sa; s < sb; s += step) for (let row = 0; row < rows; row++) {
      const keep = dens * (1 - clump + 2 * clump * crNoise(s / 7 + seed + side * 5.3)) - row * (o.rowFall == null ? 0.06 : o.rowFall);
      if (crH(s, row * 7 + side, seed) >= keep) continue;
      const sj = s + (crH(s, row, seed + 1) - 0.5) * step * 0.7, q = crAt(sj); if (!q) continue;
      const f0 = crFirstQ(first, q, side), off = (side > 0 ? q.br : q.bl) + f0 + row * gap + (crH(sj, row, seed + 2) - 0.5) * 0.36;
      const x = q.px + q.nx * side * off, z = q.pz + q.nz * side * off, ry = q.hy, tx = q.tx, tz = q.tz, nx = q.nx, nz = q.nz;
      if (near(x, z) < (o.minClear == null ? f0 - 0.6 : o.minClear) || !crFree(C, x, z)) continue;   // another part of the road (or its verge) too close; taken
      if (o.minClear == null && crInBand(q.i0, side, x, z, first)) continue;   // in front of a neighbouring segment's barrier / catch fence (bend insides)
      if ((C.water && C.water(x, z)) || (exc && exc(x, z))) continue;
      const y = gH(x, z); if (y < ry - below || y > ry + above) continue;
      if (maxS < 9) { const sl = Math.hypot(gH(x + 1, z) - gH(x - 1, z), gH(x, z + 1) - gH(x, z - 1)) / 2; if (sl > maxS) continue; }
      const lk = look * (0.2 + crH(x, z, 12));
      if (!crowdPut(C, x, y, z, -side * nx - tx * lk, -side * nz - tz * lk, o, row)) continue;
      n++; const k = Math.floor(sj / 2); segs.set(k, Math.max(segs.get(k) || 0, row + 1));
    }
    C.busy = false; CRD--;
    if (n && (o.strip != null ? o.strip : dens >= 0.3)) crStrip(C, segs, side, first, gap, gH, near, o.dark == null ? 0.58 : o.dark);   // (none under thin, scattered crowds)
    if (n && o.excl !== false) {   // tree exclusion circles along the run, overlapping (keepBar: how far they stay off the barrier line)
      const depth = (rows - 1) * gap;
      for (const k of segs.keys()) { const q = crAt(k * 2 + 1); if (!q) continue; const f0 = crFirstQ(first, q, side), oc = f0 + depth / 2, r = Math.max(1.2, Math.min(depth / 2 + 2, oc - (o.keepBar == null ? 0.3 : o.keepBar)));
        if (k % Math.max(1, Math.floor(r / 2)) && segs.has(k - 1)) continue;
        const off = (side > 0 ? q.br : q.bl) + oc; C.exclAdd(q.px + q.nx * side * off, q.pz + q.nz * side * off, r); }
    }
    C.log.push((o.label || 'run') + ':' + n);
    return n;
  }
  function crStrip(C, segs, side, first, gap, gH, near, dark) {   // multiply-blended ground strip under the rows: dark under the people, fading out at the edges and ends
    const W1 = [1, 1, 1];
    for (const [k, rw] of segs) {
      const ends = (segs.has(k - 1) ? 0 : 1) + (segs.has(k + 1) ? 0 : 1), dk = 1 - (1 - dark) * (ends === 2 ? 0.45 : ends ? 0.75 : 1) * Math.min(1, 0.6 + 0.2 * rw), D = [dk, dk, dk];
      const pts = [];
      for (const s of [k * 2, k * 2 + 2]) { const q = crAt(s); if (!q) break; const f0 = crFirstQ(first, q, side), bar = side > 0 ? q.br : q.bl, lo = [bar + f0 - 0.7, bar + f0 - 0.15, bar + f0 + (rw - 1) * gap + 0.15, bar + f0 + (rw - 1) * gap + 0.9];
        pts.push(lo.map(o => { const x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o; return [x, gH(x, z) + 0.05, z]; })); }
      if (pts.length < 2) continue;
      const [a, b] = pts; if (near(a[0][0], a[0][2]) < 0.2 || near(b[0][0], b[0][2]) < 0.2 || (C.water && (C.water(a[3][0], a[3][2]) || C.water(b[3][0], b[3][2])))) continue;
      const g = C.strip.get(a[1][0], a[1][2]);
      g.quadUp(a[0], b[0], b[1], a[1], [W1, W1, D, D]); g.quadUp(a[1], b[1], b[2], a[2], [D, D, D, D]); g.quadUp(a[2], b[2], b[3], a[3], [D, D, W1, W1]);
    }
  }
  // a crowd of C's in a layer of its own (shown and hidden apart from the rest: Vršič's finish crowd, not there in the run from the police): placed
  // by C's rules, with its spacing, its exclusions and its runs' numbers (the same people as in C itself), drawn apart (crowdLayer)
  function crowdSub(C) {
    const F = Object.create(C); F.ppl = new CrowdChunks(C.U); F.strip = new Chunks(384);
    Object.defineProperty(F, 'runs', { get: () => C.runs, set: (v) => { C.runs = v; } });
    return F;
  }
  // C's spectators (the building footprints placed after them hide nobody) and the ground strips under them into a group of their own in
  // root (named 'crowds': the clouds' shader leaves their own alone); returns how many
  function crowdLayer(C, root) {
    if (C.blocks.length) {
      const bh = new Map(); for (const b of C.blocks) { const r = Math.hypot(b.hw, b.hd); for (let a = Math.floor((b.x - r) / 32); a <= Math.floor((b.x + r) / 32); a++) for (let c = Math.floor((b.z - r) / 32); c <= Math.floor((b.z + r) / 32); c++) { const k = a + ',' + c; let L = bh.get(k); if (!L) bh.set(k, L = []); L.push(b); } }
      C.culled = C.ppl.cull((x, z) => { const L = bh.get(Math.floor(x / 32) + ',' + Math.floor(z / 32)); if (L) for (const b of L) { const dx = x - b.x, dz = z - b.z; if (Math.abs(dx * b.c + dz * b.s) < b.hw && Math.abs(-dx * b.s + dz * b.c) < b.hd) return true; } return false; });
    }
    const grp = new THREE.Group(); grp.name = 'crowds'; root.add(grp);
    if (!fansOn()) { const F = C.ppl.fans; if (F) C.ppl.cull((x, z) => F.has(x + ',' + z)); return C.ppl.addTo(grp); }   // (no spectators: see fansOn; the marshals and the cameramen stay; the group stays for the worlds that look into it)
    const n = C.ppl.addTo(grp);
    const sm = new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    C.strip.addTo(grp, sm, false, false);
    for (const m of grp.children) if (m.material === sm) m.renderOrder = 1.5;   // (ROAD DECAL ORDER: the strips' shade over every road decal under them, Harju's evening shadows over its covers and paint)
    return n;
  }
  function crowdFinish(C, root, out) {   // building footprints placed after the crowds hide nobody; the layer and the strips go into the world
    const n = crowdLayer(C, root);
    out.dyn.crowd = C.U; out.crowdN = n; out.crowdLog = C.log;
    const cells = out.crowdCells = new Map(); if (!fansOn()) return n;   // the fans per 24 m square (Sfx: how many stand near the car, the cheering on a rally stage)
    for (const L of C.sp.values()) for (let q = 0; q < L.length; q += 2) { const k = Math.floor(L[q] / 24) + ',' + Math.floor(L[q + 1] / 24); cells.set(k, (cells.get(k) || 0) + 1); }
    return n;
  }

  function nrLump(g, cx, cy, cz, r, sy, col, R, jit) {   // the upper part of a soft crown lump (an icosahedron without its 6 lowest faces, which the main crown hides), smooth shaded as ico()
    const vs = ICO_V.map(v => { const k = 1 + (R() - 0.5) * jit; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; }), inn = [cx, cy, cz];
    const sc = (p) => { const k = 0.82 + 0.3 * ((p[1] - cy) / (r * sy) * 0.5 + 0.5); return [col[0] * k, col[1] * k, col[2] * k]; };
    const nn = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / (r * sy * sy), z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    for (const f of ICO_F) { if (ICO_V[f[0]][1] + ICO_V[f[1]][1] + ICO_V[f[2]][1] < -1.2) continue; const a = vs[f[0]], b = vs[f[1]], c = vs[f[2]]; g.triON(a, b, c, nn(a), nn(b), nn(c), inn, sc(a), sc(b), sc(c)); }
  }
  function nrFir(g, cx, cy, cz, r, h, n, col, colTip, rot, droop) {   // a spruce tier: a soft cone with n shallow branch tips round its foot, darker in the notches (2n faces)
    const apex = [cx, cy + h, cz], inn = [cx, cy + h * 0.3, cz], L = Math.hypot(r, h), ny = r / L, nh = h / L, up = [0, 1, 0], dk = [col[0] * 0.78, col[1] * 0.78, col[2] * 0.8], P = [], Nm = [];
    for (let k = 0; k < 2 * n; k++) { const a = rot + k / (2 * n) * TAU, tip = k % 2 === 0, rr = tip ? r : r * 0.78; P.push([cx + Math.cos(a) * rr, cy + (tip ? -droop : h * 0.07), cz + Math.sin(a) * rr]); Nm.push([Math.cos(a) * nh, ny, Math.sin(a) * nh]); }
    for (let k = 0; k < 2 * n; k++) { const j = (k + 1) % (2 * n); g.triON(P[k], P[j], apex, Nm[k], Nm[j], up, inn, k % 2 ? dk : col, j % 2 ? dk : col, colTip); }
  }
  function nrTreeGeo(kind) {   // unit trees (height 1, instances scale them), soft shaded: 0 spruce, 1 beech (also the bushes: sunk into the ground); 2, 3 the cheaper spruce and beech far from the road
    const g = new GB(), R = rng(610 + kind), rs = ROCK_SMOOTH; ROCK_SMOOTH = true;   // (smooth normals from cone / starCone / ico; the flag is the theme's, restored below)
    const sp = [0.1, 0.22, 0.14], spT = [0.17, 0.33, 0.2], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], be = [0.2, 0.35, 0.13];
    if (kind === 0) {   // spruce: thin trunk, three tiers of branches, dark blue-green
      cone(g, 0, -0.02, 0, 0.035, 0.3, 4, [0.3, 0.22, 0.15], null, 0);
      nrFir(g, 0, 0.1, 0, 0.3, 0.46, 7, sh(sp, 0.9), spT, 0.2, 0.04); nrFir(g, 0, 0.36, 0, 0.22, 0.4, 6, sp, spT, 0.75, 0.03);
      nrFir(g, 0, 0.6, 0, 0.13, 0.4, 5, sh(sp, 1.08), spT, 1.3, 0.02);
    } else if (kind === 1) {   // beech: grey trunk, a broad crown of two soft lumps
      cyl(g, 0, -0.02, 0, 0.04, 0.42, 4, [0.42, 0.4, 0.36], null, 0.03);
      ico(g, -0.04, 0.63, -0.02, 0.3, 0.9, be, R, 0.22); nrLump(g, 0.13, 0.57, 0.07, 0.21, 0.9, sh(be, 1.06), R, 0.2);
    } else if (kind === 2) {   // far spruce: two tiers, no trunk
      nrFir(g, 0, 0.12, 0, 0.29, 0.54, 6, sh(sp, 0.92), spT, 0.2, 0.04); nrFir(g, 0, 0.5, 0, 0.17, 0.5, 5, sp, spT, 0.9, 0.03);
    } else {   // far beech: one lump
      ico(g, 0, 0.6, 0, 0.33, 0.95, be, R, 0.25);
    }
    ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let nrATex = null;
  function nrAtlas(names) {   // text boards (4 x 16 cells of 256 x 64): km 1-20, the corner names, banners
    if (nrATex) nrATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    for (let k = 1; k <= 20; k++) cell(k - 1, '#f4f4f0', '#111', k + ' km', 44, '#111');
    names.forEach((n, k) => cell(20 + k, '#1d5f2c', '#fff', n.toUpperCase(), n.length > 14 ? 26 : 32, '#e8e8e0'));
    const B = 20 + names.length;
    cell(B, '#16181c', '#fff', 'START · ZIEL', 36); cell(B + 1, '#123f86', '#fff', 'NÜRBURGRING', 38); cell(B + 2, '#1a1a1a', '#6fdc3c', 'GRÜNE HÖLLE', 38); cell(B + 3, '#f2c21a', '#111', 'NORDSCHLEIFE', 36);
    ['300', '200', '100'].forEach((n, k) => cell(B + 4 + k, '#f4f4f0', '#111', n, 46, '#c8201c'));   // braking boards
    for (const [k, dir] of [[B + 7, 1], [B + 8, -1]]) {   // chevrons, pointing into the bend: right, left
      const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = '#16171a'; x.fillRect(cx, cy, 256, 64); x.fillStyle = '#f2d21c';
      for (let n = 0; n < 3; n++) { const ax = cx + 64 + n * 64 + dir * 16; x.beginPath(); x.moveTo(ax - dir * 26, cy + 8); x.lineTo(ax + dir * 10, cy + 32); x.lineTo(ax - dir * 26, cy + 56); x.lineTo(ax - dir * 8, cy + 56); x.lineTo(ax + dir * 28, cy + 32); x.lineTo(ax - dir * 8, cy + 8); x.closePath(); x.fill(); }
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (nrATex = t);
  }
  // Spa's big screens: a still of the race coverage (a car on the track, the timing column, LIVE, the circuit's name)
  function spaScreenTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 288; const x = c.getContext('2d');
    const sky = x.createLinearGradient(0, 0, 0, 288); sky.addColorStop(0, '#6f9fcf'); sky.addColorStop(0.45, '#b9d2e6'); sky.addColorStop(0.46, '#3e6b2f'); sky.addColorStop(1, '#2d5424'); x.fillStyle = sky; x.fillRect(0, 0, 512, 288);
    x.fillStyle = '#51575f'; x.beginPath(); x.moveTo(0, 288); x.lineTo(250, 140); x.lineTo(330, 140); x.lineTo(512, 288); x.fill();   // the road into the distance
    x.fillStyle = '#f2f2ee'; for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#d8262a' : '#f2f2ee'; x.beginPath(); x.moveTo(250 - k * 31, 140 + k * 18.5); x.lineTo(250 - (k + 1) * 31, 140 + (k + 1) * 18.5); x.lineTo(240 - (k + 1) * 31, 140 + (k + 1) * 18.5); x.lineTo(240 - k * 31, 140 + k * 18.5); x.fill(); }
    x.fillStyle = '#1c5fd6'; x.fillRect(262, 196, 84, 34); x.fillStyle = '#f2f2ee'; x.fillRect(262, 206, 84, 8); x.fillStyle = '#111'; x.fillRect(266, 226, 16, 10); x.fillRect(326, 226, 16, 10);   // the leader
    x.fillStyle = 'rgba(10,12,18,.82)'; x.fillRect(12, 12, 150, 132);
    const rows = [['1', 'KOVAČ', '#e8e8ee'], ['2', 'HAYASHI', '#1c5fd6'], ['3', 'ROSSI', '#f2c230'], ['4', 'NOVAK', '#2fa84f']];
    x.font = 'bold 22px Arial, sans-serif'; x.textBaseline = 'middle';
    rows.forEach(([p, nm, col], k) => { const yy = 32 + k * 30; x.fillStyle = '#fff'; x.fillText(p, 22, yy); x.fillStyle = col; x.fillRect(42, yy - 10, 5, 20); x.fillStyle = '#fff'; x.fillText(nm, 54, yy); });
    x.fillStyle = '#d8262a'; x.fillRect(420, 14, 80, 32); x.fillStyle = '#fff'; x.font = 'bold 22px Arial, sans-serif'; x.fillText('LIVE', 432, 31);
    x.fillStyle = 'rgba(10,12,18,.82)'; x.fillRect(0, 250, 512, 38); x.fillStyle = '#fff'; x.font = 'bold 22px Arial, sans-serif'; x.fillText('SPA-FRANCORCHAMPS', 16, 270);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const nrAUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
  function nrNumTex() {   // the marshal posts' numbers 1-128 (16 x 8 cells of 64 px): white on orange
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
    x.font = '900 34px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = 0; k < 128; k++) { const cx = (k % 16) * 64, cy = Math.floor(k / 16) * 64; x.fillStyle = '#e45f1a'; x.fillRect(cx, cy, 64, 64); x.fillStyle = '#fff'; x.fillRect(cx + 4, cy + 4, 56, 3); x.fillRect(cx + 4, cy + 57, 56, 3); x.fillText(String(k + 1), cx + 32, cy + 33, 54); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const nrNUV = (k) => { const u0 = (k % 16) / 16, v1 = 1 - Math.floor(k / 16) / 8; return [u0, v1 - 1 / 8, u0 + 1 / 16, v1]; };
  function nrPN(P, seed) { const q = rng(seed), g = new Float32Array(P * P); for (let k = 0; k < g.length; k++) g[k] = q();   // value noise on [0, 1)^2 with the tile as its period (P cells)
    return (u, v) => { u *= P; v *= P; const i = Math.floor(u), j = Math.floor(v), f = u - i, e = v - j, I = (a, b) => g[(b % P) * P + (a % P)], s = f * f * (3 - 2 * f), t = e * e * (3 - 2 * e); return lerp(lerp(I(i, j), I(i + 1, j), s), lerp(I(i, j + 1), I(i + 1, j + 1), s), t); }; }
  function nrGrassTex(aniso) {   // the Eifel meadow under the vertex colours (256 px = 14 m, tileable, no mowing stripes): olive grass in clumps, darker clover, dark and dry blades, a few flowers and specks of soil
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(4401);
    const n1 = nrPN(8, 4402), n2 = nrPN(24, 4403), n3 = nrPN(64, 4404);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {   // (fine detail only: the vertex colours make the patches, so the 14 m tile does not show)
      const u = i / S, v = j / S, n = n1(u, v) * 0.3 + n2(u, v) * 0.4 + n3(u, v) * 0.3, k = 0.84 + n * 0.3 + (r() - 0.5) * 0.14, y = n2(u + 0.37, v + 0.61) - 0.5, o = (j * S + i) * 4;
      d[o] = clamp((88 + y * 14) * k, 0, 255); d[o + 1] = clamp((124 + y * 4) * k, 0, 255); d[o + 2] = clamp(56 * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    x.lineWidth = 1;
    for (const [st, n] of [['rgba(44,66,28,0.5)', 900], ['rgba(150,158,96,0.4)', 560], ['rgba(172,160,100,0.35)', 260]]) {   // blades (drawn across the edges too: tileable)
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 2.4, dy = -(1.5 + r() * 3);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -6 && qx < S + 6 && qy > -6 && qy < S + 6) { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); } } }
      x.stroke(); }
    for (const [st, n, sz] of [['#e6cd46', 110, 1], ['#ebebdc', 150, 1], ['#9a70a8', 40, 1], ['rgba(98,80,56,0.7)', 70, 2]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - 1)), Math.floor(r() * (S - 1)), sz, sz); }   // flowers, soil
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  function nrDecalTex() {   // paint and marks on the asphalt: a 1024 px atlas of 4 x 8 cells, 256 px across the road by 128 px along it (a cell's top points up the road):
    // 0-15 the fans' graffiti, 16-19 painted signs, 20-23 painted flags, 24-25 tar snakes, 26-27 tyre marks, 28-31 repair patches; transparent around them
    const S = 1024, W = 256, H = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(5501);
    const cell = (k, fn, wear) => { x.save(); x.translate((k % 4) * W, Math.floor(k / 4) * H); x.beginPath(); x.rect(4, 4, W - 8, H - 8); x.clip(); x.save(); fn(); x.restore();   // (a clear 4 px border: no bleeding in the mipmaps)
      if (wear) { x.globalCompositeOperation = 'destination-out';   // worn paint: specks, and the lines the tyres scrub along
        for (let q = 0; q < 260 * wear; q++) { x.fillStyle = `rgba(0,0,0,${(0.3 + r() * 0.7).toFixed(2)})`; const s = 1 + r() * 3.5; x.fillRect(r() * W, r() * H, s, s * (0.6 + r())); }
        for (let q = 0; q < 3; q++) { x.fillStyle = `rgba(0,0,0,${(0.2 * wear).toFixed(2)})`; x.fillRect(20 + r() * (W - 60), 0, 14 + r() * 26, H); } }
      x.restore(); };
    const paint = (s, col, it) => { const L = s.split('\n'); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.translate(W / 2, H / 2); x.rotate((r() - 0.5) * 0.12);
      L.forEach((t, n) => { x.font = (it ? 'italic ' : '') + '900 ' + (L.length > 1 ? 52 : 80) + 'px "Arial Black", Impact, Arial, sans-serif'; const k = Math.min(1.7, (W - 30) / x.measureText(t).width);
        x.save(); x.translate(0, (n - (L.length - 1) / 2) * 54 + 3); x.scale(k, L.length > 1 ? Math.min(1.1, k) : Math.min(1.35, k * 1.2)); x.fillText(t, 0, 0); x.restore(); }); };
    const WH = '#f3f0e4', YE = '#f5d23a';
    [['GRÜNE\nHÖLLE', WH], ['VOLLGAS', WH], ['24H', YE], ['NORD\nSCHLEIFE', WH], ['RING\nFREI!', YE], ['EIFEL', WH], ['GO GO GO', WH], ['HOPP\nHOPP', YE], ['FLAT OUT', WH], ['SEPP', WH], ['JANA ♥', '#f08aa4'], ['LUKA', '#8ccfff'], ['TIM #7', WH], ['KEEP IT\nPINNED', YE], ['ALLEZ!', WH], ['HUP HUP', '#ff9f3c']]
      .forEach(([s, col], k) => cell(k, () => paint(s, col, k % 3 === 2), 0.8 + r() * 0.6));
    cell(16, () => { x.fillStyle = '#e0304a'; x.translate(W / 2, H / 2 + 6); x.beginPath(); x.moveTo(0, 44); x.bezierCurveTo(-70, -6, -44, -58, 0, -26); x.bezierCurveTo(44, -58, 70, -6, 0, 44); x.fill(); }, 1);   // heart
    cell(17, () => { x.fillStyle = WH; x.beginPath(); [[128, 10], [186, 64], [150, 64], [150, 118], [106, 118], [106, 64], [70, 64]].forEach(([a, b], n) => n ? x.lineTo(a, b) : x.moveTo(a, b)); x.fill(); }, 1);   // arrow up the road
    cell(18, () => { x.fillStyle = YE; x.beginPath(); x.arc(W / 2, H / 2, 52, 0, 7); x.fill(); x.globalCompositeOperation = 'destination-out'; for (const e of [-18, 18]) { x.beginPath(); x.arc(W / 2 + e, H / 2 - 14, 8, 0, 7); x.fill(); }
      x.lineWidth = 9; x.beginPath(); x.arc(W / 2, H / 2 + 2, 30, 0.4, Math.PI - 0.4); x.stroke(); }, 1);   // smiley (the asphalt shows through its eyes and mouth)
    cell(19, () => paint('#44', WH, true), 1);
    const flag = (k, bands, vert) => cell(k, () => { x.translate(W / 2, H / 2); x.rotate((r() - 0.5) * 0.08); bands.forEach((b, n) => { x.fillStyle = b; if (vert) x.fillRect(-96 + n * 64, -48, 64, 96); else x.fillRect(-96, -48 + n * 32, 192, 32); }); }, 1.2);
    cell(20, () => { x.translate(W / 2, H / 2); x.rotate((r() - 0.5) * 0.08); for (let a = 0; a < 8; a++) for (let b = 0; b < 4; b++) { x.fillStyle = (a + b) % 2 ? '#151515' : WH; x.fillRect(-96 + a * 24, -48 + b * 24, 24, 24); } }, 1.2);   // chequered flag
    flag(21, ['#141414', '#d2232a', '#f2c200']); flag(22, ['#c7222a', WH, '#1f4c99']); flag(23, ['#141414', '#f5d000', '#df2530'], true);
    for (const k of [24, 25]) cell(k, () => {   // tar snakes (crack sealant): wiggly black lines, mostly along the road (the cell is stretched about 4 x along it)
      x.lineJoin = x.lineCap = 'round';
      for (let n = 0; n < 5 + k - 24; n++) { const lw = 4 + r() * 4; x.beginPath(); let px = 20 + r() * (W - 40), dx = (r() - 0.5) * 3; x.moveTo(px, -8);
        for (let py = -8; py < H + 8; py += 5) { dx = clamp(dx + (r() - 0.5) * 3, -4, 4); px = clamp(px + dx + (r() - 0.5) * 9, 10, W - 10); x.lineTo(px, py); }
        x.strokeStyle = 'rgba(38,38,41,0.2)'; x.lineWidth = lw * 1.9; x.stroke(); x.strokeStyle = 'rgba(28,28,31,0.66)'; x.lineWidth = lw; x.stroke(); } });   // (a glossy dark grey band, a faint overband)
    for (const k of [26, 27]) cell(k, () => {   // tyre marks: a pair of dark bands (a car's track) that fade in and out; the second one slides
      for (let py = 0; py < H; py += 2) { const t = py / H, a = Math.min(sstep(0, 0.25, t), sstep(1, 0.6, t)) * 0.8, sw = k === 27 ? Math.sin(t * 5.2) * 16 : t * 10;
        x.fillStyle = `rgba(12,12,14,${a.toFixed(3)})`; for (const s of [-1, 1]) x.fillRect(W / 2 + s * (74 + (k === 27 ? t * 10 : 0)) + sw - 11, py, 22, 2); } });
    for (const k of [28, 29, 30, 31]) cell(k, () => {   // repair patches: fresh dark asphalt with sealed edges, an older pale one, a patched trench, sealed cracks
      if (k === 31) { x.strokeStyle = 'rgba(30,30,33,0.62)'; x.lineWidth = 4; x.lineJoin = 'round'; for (let n = 0; n < 9; n++) { x.beginPath(); let px = r() * W, py = r() * H; x.moveTo(px, py); for (let q = 0; q < 9; q++) { px += (r() - 0.5) * 70; py += (r() - 0.5) * 34; x.lineTo(px, py); } x.stroke(); } return; }
      const m = k === 30 ? [70, 8, W - 70, H - 8] : [12 + r() * 20, 10 + r() * 10, W - 12 - r() * 20, H - 10 - r() * 10];
      x.beginPath(); for (let q = 0; q < 16; q++) { const t = q / 16 * 4, e = Math.floor(t), f = t - e, px = [m[0], m[2], m[2], m[0]][e] + ([m[2], m[2], m[0], m[0]][e] - [m[0], m[2], m[2], m[0]][e]) * f, py = [m[1], m[1], m[3], m[3]][e] + ([m[1], m[3], m[3], m[1]][e] - [m[1], m[1], m[3], m[3]][e]) * f;
        const qx = px + (r() - 0.5) * 7, qy = py + (r() - 0.5) * 5; q ? x.lineTo(qx, qy) : x.moveTo(qx, qy); } x.closePath();
      x.fillStyle = k === 29 ? 'rgba(150,150,144,0.3)' : 'rgba(30,31,34,0.5)'; x.fill(); x.strokeStyle = 'rgba(30,30,33,0.36)'; x.lineWidth = 3; x.stroke();
      for (let q = 0; q < 240; q++) { x.fillStyle = k === 29 ? 'rgba(60,60,58,0.25)' : 'rgba(170,170,165,0.16)'; x.fillRect(m[0] + r() * (m[2] - m[0]), m[1] + r() * (m[3] - m[1]), 2, 2); } });
    const t = new THREE.CanvasTexture(c); return t;
  }
  function nrConcTex() {   // the banked bowls' concrete (tileable, 256 px = 6 m): pale slabs with a joint every 1.5 m along the road and one down the middle, stains, hairline cracks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(5601);
    for (let k = 0; k < S * S; k++) { const v = 0.93 + (r() - 0.5) * 0.12; d[k * 4] = 178 * v; d[k * 4 + 1] = 175 * v; d[k * 4 + 2] = 167 * v; d[k * 4 + 3] = 255; }
    x.putImageData(img, 0, 0);
    const wrap = (fn) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { x.save(); x.translate(a * S, b * S); fn(); x.restore(); } };   // (drawn across the edges too: tileable)
    for (let k = 0; k < 36; k++) { const px = r() * S, py = r() * S, rx = 8 + r() * 36, ry = 6 + r() * 26, ro = r() * 3, a = 0.04 + r() * 0.09; wrap(() => { x.fillStyle = `rgba(58,56,52,${a.toFixed(3)})`; x.beginPath(); x.ellipse(px, py, rx, ry, ro, 0, 7); x.fill(); }); }
    for (let k = 0; k < 7; k++) { const P = [[r() * S, r() * S]]; for (let q = 0; q < 6; q++) P.push([P[q][0] + (r() - 0.5) * 40, P[q][1] + (r() - 0.5) * 40]);
      wrap(() => { x.strokeStyle = 'rgba(52,52,50,0.45)'; x.lineWidth = 1; x.beginPath(); P.forEach(([a, b], n) => n ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }); }
    for (let y = 0; y < S; y += 64) { x.fillStyle = 'rgba(42,42,40,0.8)'; x.fillRect(0, y, S, 2); x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(0, y + 2, S, 1); }   // joints across the lane
    x.fillStyle = 'rgba(42,42,40,0.7)'; x.fillRect(S / 2 - 1, 0, 2, S);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }

  /* ---- World.api: what the worlds in files of their own (js/world-<theme>.js) use of this file: its helpers (bound once, when such a file
     loads), the state that changes (getters, and setters where a world sets it: API.<name>), the per-build state copied into each file's own
     bindings at each build (SYNC, before the builders run); each such file adds what this file uses of it (API.<name>) ---- */
  const SYNC = [];
  const API = {
    Chunks, GB, GRASS_GLSL, HC, ICO1, ICO_F, ICO_V, IChunks, NRC, NRN, NRT, NR_A64, RB, TAU, WSKY, addShore, atS, atSf, box, brookMat, clamp,
    clearance, cone, crAt, crH, crowdAt, crowdCtx, crowdFinish, crowdLayer, crowdMat, crowdPut, crowdRun, crowdSub, crowdUV, cyl, gable,
    gravelSeams, hex, ico, inPoly, lerp, mergeBands, nearest, nrAUV, nrAtlas, nrBankY, nrChamfer, nrConcTex, nrDecalTex, nrDem, nrDist, nrEdge,
    nrFar, nrFir, nrGCol, nrGH, nrGrassTex, nrGround, nrLC, nrLCf, nrLump, nrNUV, nrNear, nrNumTex, nrPN, nrPrep, nrShade, nrSlope, nrTileGeo,
    nrTileOn, nrTreeGeo, nringProps, ownRnd, parkOn, pikesProps, pitLaneScenery, pixAvg, pkSky, polyDist, propFloorTable, puff, rng, roadsideProps, rock, rpHash,
    shoreBand, spaScreenTex, sstep, starCone, texAvg, tuftGeo, tuftWindMat, tvHeli, valueNoise2, vary, waterMat, waterline, wrapS
  };
  Object.defineProperties(API, {
    LOD: { get: () => LOD },
    NR: { get: () => NR },
    ROCK_SMOOTH: { get: () => ROCK_SMOOTH, set: (v) => { ROCK_SMOOTH = v; } },
    T: { get: () => T },
    THEME: { get: () => THEME },
    hash: { get: () => hash },
    sync: { value: SYNC }
  });

  function update(out, t, car, cam) {
    if (!out) return;
    const d = out.dyn;
    if (d.fade && cam) {   // Red Bull Ring: the wing fades out while the camera is inside it (the high kino / iso views over Start-Ziel)
      const f = d.fade, p = cam.position, P = f.poly; let inside = p.y < f.yTop, sg = 0;
      for (let k = 0; k < 4 && inside; k++) {   // (inside the footprint: on the same side of all four edges)
        const a = P[k], b = P[(k + 1) % 4], c = Math.sign((b[0] - a[0]) * (p.z - a[1]) - (b[1] - a[1]) * (p.x - a[0]));
        if (!sg) sg = c; else if (c !== sg) inside = false; }
      const dt = f.t == null ? 1 : clamp(t - f.t, 0, 0.1); f.t = t;
      f.op += ((inside ? 0 : 1) - f.op) * Math.min(1, dt * 6); if (Math.abs(f.op - (inside ? 0 : 1)) < 0.02) f.op = inside ? 0 : 1;
      for (const e of f.list) { e.mat.opacity = f.op; e.mesh.visible = f.op > 0.02; e.mat.depthWrite = f.op > 0.98; }
    }
    if (d.crowd) { d.crowd.uTime.value = t % 1000; if (car) d.crowd.uCar.value.set(car.x, car.roadY || 0, car.z); }   // spectators: arm waving, cheering near the followed car
    if (d.air) API.rbAirStep(d.air, t, car);   // Red Bull Ring: the TV helicopter's pass, the jets and their smoke
    if (d.podium) d.podium.step(t);   // Red Bull Ring: the podium after the race
    if (d.cpMast && (cam || !car)) API.cpMastStep(d.cpMast, car ? cam : null, out.root.parent && out.root.parent.fog);   // Crystal Palace: the mast on the hill, seen from afar (no car: on its own place, the world test's pose)
    if (d.far && !car) { d.far.position.set(0, 0, 0); d.far.scale.setScalar(1); d.far.updateMatrix(); }   // Riverside: the far ring follows the camera as it is drawn (rsFar); no car: as built, the world test's pose
    if (d.mrFar && !car) { d.mrFar.position.set(0, 0, 0); d.mrFar.scale.setScalar(1); d.mrFar.updateMatrix(); }   // Marrakesh: the minaret on the horizon follows the camera as it is drawn (mrFarTower); no car: as built, the world test's pose
    if (d.screens) { const f = Math.floor(t / 6) % 4; if (f !== d.screens.f) { d.screens.f = f; d.screens.tex.offset.x = f * 0.25; } }   // Red Bull Ring: the video walls' next picture every 6 s
    if (d.water) { d.water.offset.x = (t * 0.012) % 1; d.water.offset.y = (t * 0.007) % 1; }
    if (d.wind) d.wind.value = t % 1000;   // the trees sway (Nordschleife, Spa)
    if (d.brook) d.brook.uT.value = t % 1000;   // Spa: the Eau Rouge brook flows
    if (d.clouds) { const n = CLOUD_NP; d.clouds.O.value.set(((t * 3.2 / CLOUD_S) % n + n) % n, ((-t * 2.5 / CLOUD_S) % n + n) % n); }   // the cloud shadows drift with the wind
    if (d.pk) pkUpdate(d.pk, t, car);   // Ouninpohja, Harju: the TV helicopter
    if (d.pkWx) API.pkWeatherUpdate(d.pkWx, t, car);   // Pikes Peak: cloud banks, snowfall
    if (d.pkOps) API.pkOpsUpdate(d.pkOps, t, car);
    if (d.pkSum) API.pkSummitUpdate(d.pkSum, t, car);
    if (d.pkMov) API.pkMovingUpdate(d.pkMov, t, car);   // Pikes Peak: drones, LED boards, the water truck
    if (d.pkVeg && !car) d.pkVeg();   // Pikes Peak: the plants' buffers in a fixed state (the world test)   // Pikes Peak: the summit's smoke and flags, the sea of clouds   // Pikes Peak: the marshals' flags
    if (d.wheel) API.szWheel(d.wheel, t);   // Suzuka: the Ferris wheel turns
    if (d.skyline) API.rioSkyline(d.skyline, cam);   // Rio: the mountains on the skyline go with the camera
    if (d.rio) API.rioStep(d.rio, t, car, cam);   // Rio: the karts, the boats, the cormorants, the mist, the heat
    if (d.condors) API.caCondors(d.condors, t, car);   // Los Caracoles: the condors circle over the road
    if (d.roos) API.auRoos(d.roos, t, car);   // Bathurst: kangaroos bound away from the car
    if (d.bsPel) API.bsPelicanStep(d.bsPel, t);   // Big Sur: the pelicans fly along the coast
    if (d.bsWhale) for (const w of d.bsWhale) { const u = (t * 0.16 + w.ph) % 1, f = u < 0.25 ? Math.sin(u / 0.25 * Math.PI) : 0; w.m.visible = f > 0.02; w.m.scale.set(0.6 + f * 0.6, Math.max(0.01, f), 0.6 + f * 0.6); }   // Big Sur: the whales blow every ~6 s
    if (d.lfFx) API.lfFxUpdate(d.lfFx, t, car);   // Longford: the chimneys' smoke, the dust off the shoulder, the galahs taking off
    if (d.irFar) API.irFarUpdate(d.irFar, car ? cam : null);   // Irohazaka: the view beyond the corridor follows the camera
    if (d.dt) API.dtUpdate(d.dt, t, car, cam);   // Detroit: the lit windows, the far view
    if (d.mkFar) API.maFarUpdate(d.mkFar, car ? cam : null);   // Mauna Kea: the flanks, the sea of clouds and the volcanoes on the horizon follow the camera
    if (d.gaFar) API.gaFarUpdate(d.gaFar, car ? cam : null);   // the Great Alpine Road: the same, a little less often
    if (d.ext) d.ext(t, car, cam);   // a world of its own file (World.ext): its moving things
    if (d.rrMist) API.rrMist(d.rrMist, t);   // Serra do Rio do Rastro: the mist rises out of the valley
    if (d.pkLife) API.pkWildlifeUpdate(d.pkLife, t, car);   // Pikes Peak: marmots and bighorn sheep
    if (d.pkAmb) API.pkAmbientUpdate(d.pkAmb, t, car);   // Pikes Peak: flags, dust, grill smoke
    if (d.boats) {
      const L = d.lake;
      for (const b of d.boats) {
        const a = b.a + t * b.sp;
        const x = L.cx + Math.cos(a) * L.rx * b.r, z = L.cz + Math.sin(a) * L.rz * b.r;
        b.m.position.set(x, Math.sin(t * 1.3 + b.a) * 0.05, z);
        const dx = -Math.sin(a) * L.rx, dz = Math.cos(a) * L.rz;
        b.m.rotation.y = -Math.atan2(dz, dx);
      }
    }
  }

  // after the camera has moved (Render.frame): what depends on where it looks from. Ouninpohja: the trees and buildings between the camera and
  // the followed car fade out (the car where it is drawn this frame: interpolated by alpha)
  function view(out, cam, car, alpha) {
    const U = out && out.dyn.ouCut; if (!U) return;
    if (!car || !cam) { U.uCar.value.set(1e6, 0, 1e6); U.uCam.value.set(1e6, 0, 1e6); if (U.uA) { U.uA.value.z = U.uB.value.z = -1e6; } return; }   // (nothing cut)
    const a = alpha == null ? 1 : alpha;
    U.uCam.value.copy(cam.position); U.uCar.value.set(lerp(car.px, car.x, a), lerp(car.py == null ? car.y || 0 : car.py, car.y || 0, a) + 1, lerp(car.pz, car.z, a));
    if (U.uA) {   // (the car and the road 20 m ahead of it on the screen: their NDC and their depth)
      cam.updateMatrixWorld(); const C = U.uCar.value, q = car.q, i = q && q.i >= 0 ? T.idx(clamp(q.s + 20, 0, T.len - 0.01)) : -1;
      const put = (V, x, y, z) => { _hjV.set(x, y, z).applyMatrix4(cam.matrixWorldInverse); const w = -_hjV.z; _hjV.applyMatrix4(cam.projectionMatrix); V.set(_hjV.x, _hjV.y, w > 0.5 ? w : -1e6, cam.aspect || 1); };
      put(U.uA.value, C.x, C.y, C.z); if (i >= 0) put(U.uB.value, T.px[i], (T.hy ? T.hy[i] : C.y - 1) + 1, T.pz[i]); else U.uB.value.copy(U.uA.value);
      if (cam.position.distanceTo(C) < 8) U.uA.value.z = U.uB.value.z = -1e6;   // (from the cockpit or the bonnet: nothing to cut)
    }
  }
  const _hjV = new THREE.Vector3();

  return { build, update, view, api: API, GB, box, cyl, cone, ico, gable, hex, vary, waterSky: WSKY, heli: tvHeli, ext: EXT, nrDecalTex };   // (nrDecalTex: the Nordschleife's paint on the asphalt, also the new map's ring road's, js/newmap.js nordRoad)   // (heli: the TV helicopter's model, also the police's on Vršič)
})();

