/* =========================================================================
   WORLD — Ujarrás, Kostarika (theme 'ujarras'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra: the lookout over the Orosi valley on the inside of the big left-hander, ~40 % of the race (OpenStreetMap's viewpoint, a
   park round it): a terrace of terracotta tiles on a stone retaining wall, a white balustrade along its valley side and its ends, an open
   shelter of timber posts under a hipped roof of clay tiles with picnic tables in its shade, benches facing the valley, a small kiosk (no sign),
   a coin telescope, bougainvillea in planters by the entrance, two flowering trees and a palm. Generic: no names, signs, plaques or art.
   And the far view (farView, World.irFar): the Orosi valley beyond the corridor out to 7.5 km (Copernicus GLO-30 on a 150 m grid, coloured by
   ESA WorldCover; OSM's orchards, the coffee by the reservoir, darker), the reservoir at its level and the ruins of the old church of Ujarrás by
   it (OSM's footprint; the walls' 7 m and their openings a likeness, OSM has no height).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;
  const { TAU, box, cyl, puff, rng, rock, vrGround, vrNear } = API;

  const MIRADOR = [-256.4, -32.1];   // (track frame: OpenStreetMap's viewpoint, 17 m off the road's left edge on the inside of the bend at s 471)
  const W = 15, D = 9;   // (the terrace: along the road, out towards the valley, m)

  // the lookout, in its own frame: u along the road, v out towards the valley (from the nearest point of the road to the viewpoint)
  function lookout(scen) {
    const R = rng(2020), T = API.T, n = vrNear(MIRADOR[0], MIRADOR[1]); if (n.i < 0) return null;
    let ox = MIRADOR[0] - T.px[n.i], oz = MIRADOR[1] - T.pz[n.i]; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
    const tx = -oz, tz = ox;   // (along the road)
    // the terrace's middle: clear of the barrier on the inside of the bend (the near edge 1.5 m past it)
    const bar = Math.abs(n.lat) - n.dd, dC = Math.max(ol, bar + 1.5 + D / 2), cx = T.px[n.i] + ox * dC, cz = T.pz[n.i] + oz * dC;
    const X = (u, v) => cx + tx * u + ox * v, Z = (u, v) => cz + tz * u + oz * v, P = (u, y, v) => [X(u, v), y, Z(u, v)];
    const yaw = Math.atan2(tz, tx);   // (box's rot: its x along u)
    const g = scen.get(cx, cz);
    // the floor's height: above the highest ground under it, so the slope never shows through
    let top = -1e9, lo = 1e9;
    for (let a = -W / 2; a <= W / 2 + 0.01; a += W / 6) for (let b = -D / 2; b <= D / 2 + 0.01; b += D / 4) { const h = vrGround(X(a, b), Z(a, b)); top = Math.max(top, h); lo = Math.min(lo, h); }
    top += 0.25;
    const at = (u, v) => vrGround(X(u, v), Z(u, v));
    const BOX = (u, y, v, w, h, d, col, ct, rot) => box(g, X(u, v), y, Z(u, v), w, h, d, yaw + (rot || 0), col, ct, true);
    // the floor: terracotta tiles in 1.5 m squares, each its own shade, a pale border round the edge
    const NU = 10, NV = 6, du = W / NU, dv = D / NV;
    for (let a = 0; a < NU; a++) for (let b = 0; b < NV; b++) {
      const u0 = -W / 2 + a * du, v0 = -D / 2 + b * dv, k = 0.92 + R() * 0.12, c = [0.68 * k, 0.42 * k, 0.31 * k];
      g.quadUp(P(u0, top, v0), P(u0 + du, top, v0), P(u0 + du, top, v0 + dv), P(u0, top, v0 + dv), [c, c, c, c]);
    }
    // the retaining wall round it, in 1.5 m panels down into the ground (rough grey stone, the valley side the tallest)
    const wall = (u0, v0, u1, v1) => {
      const L = Math.hypot(u1 - u0, v1 - v0), N = Math.max(1, Math.round(L / 1.5)), inn = [cx, top - 1, cz];
      for (let k = 0; k < N; k++) {
        const ua = u0 + (u1 - u0) * k / N, va = v0 + (v1 - v0) * k / N, ub = u0 + (u1 - u0) * (k + 1) / N, vb = v0 + (v1 - v0) * (k + 1) / N, t = 0.5 + R() * 0.1;
        g.quadO(P(ua, at(ua, va) - 0.8, va), P(ub, at(ub, vb) - 0.8, vb), P(ub, top - 0.12, vb), P(ua, top - 0.12, va), [t, t - 0.02, t - 0.05], inn);
        g.quadO(P(ua, top - 0.12, va), P(ub, top - 0.12, vb), P(ub, top + 0.02, vb), P(ua, top + 0.02, va), [0.8, 0.78, 0.72], inn);   // (the coping)
      }
    };
    wall(-W / 2, -D / 2, W / 2, -D / 2); wall(W / 2, -D / 2, W / 2, D / 2); wall(W / 2, D / 2, -W / 2, D / 2); wall(-W / 2, D / 2, -W / 2, -D / 2);
    // the balustrade: along the valley side and both ends (open towards the road), a plinth, white balusters, a rail, pillars every 3 m
    const BAL = [0.9, 0.89, 0.84], BALT = [0.95, 0.94, 0.9];
    const rail = (u0, v0, u1, v1) => {
      const L = Math.hypot(u1 - u0, v1 - v0), rot = Math.atan2(v1 - v0, u1 - u0), um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
      BOX(um, top, vm, L, 0.16, 0.3, BAL, BALT, rot); BOX(um, top + 0.82, vm, L + 0.1, 0.12, 0.28, BAL, BALT, rot);
      const nb = Math.round(L / 0.36);
      for (let k = 1; k < nb; k++) { const f = k / nb, u = u0 + (u1 - u0) * f, v = v0 + (v1 - v0) * f; if (k % 8 === 0) continue; BOX(u, top + 0.16, v, 0.11, 0.66, 0.11, BAL, BAL, rot); }
      for (let k = 0; k <= nb; k += 8) { const f = k / nb, u = u0 + (u1 - u0) * f, v = v0 + (v1 - v0) * f; BOX(u, top, v, 0.34, 1.02, 0.34, BAL, BALT, rot); }
    };
    const e = 0.2;
    rail(-W / 2 + e, D / 2 - e, W / 2 - e, D / 2 - e); rail(W / 2 - e, D / 2 - e, W / 2 - e, -D / 2 + 1.2); rail(-W / 2 + e, -D / 2 + 1.2, -W / 2 + e, D / 2 - e);
    // the shelter (a »rancho«) at the west end: six timber posts, beams, a hipped roof of clay tiles in rows, a timber ceiling under it
    { const u0 = -W / 2 + 1.0, u1 = -1.2, v0 = -2.4, v1 = 3.0, um = (u0 + u1) / 2, vm = (v0 + v1) / 2, hP = 2.5, y1 = top + hP, wood = [0.42, 0.29, 0.18];
      for (const u of [u0, um, u1]) for (const v of [v0, v1]) { const q = P(u, 0, v); cyl(g, q[0], top, q[2], 0.12, hP, 6, wood, wood); }
      BOX(um, y1 - 0.02, v0, u1 - u0 + 0.3, 0.2, 0.18, wood); BOX(um, y1 - 0.02, v1, u1 - u0 + 0.3, 0.2, 0.18, wood);
      BOX(u0, y1 - 0.02, vm, 0.18, 0.2, v1 - v0 + 0.3, wood); BOX(u1, y1 - 0.02, vm, 0.18, 0.2, v1 - v0 + 0.3, wood);
      const o = 0.7, a0 = u0 - o, a1 = u1 + o, b0 = v0 - o, b1 = v1 + o, yE = y1 + 0.15, rise = 1.7, half = Math.min(a1 - a0, b1 - b0) / 2;
      const r0 = [a0 + half, yE + rise, (b0 + b1) / 2], r1 = [a1 - half, yE + rise, (b0 + b1) / 2];   // (the ridge: along u)
      const E = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]], ins = P(um, yE, vm);
      const tile = (k) => { const t = k & 1 ? 0.92 : 1.0, w = 0.95 + R() * 0.08; return [0.66 * t * w, 0.3 * t * w, 0.2 * t * w]; };
      const lerp3 = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];
      const PL = ([u, y, v]) => P(u, y, v);
      // each face from the eave up to the ridge in rows of tiles (the long sides quads, the hip ends triangles), a timber ceiling under it all
      const faces = [[E[0], E[1], r0, r1], [E[1], E[2], r1, r1], [E[2], E[3], r1, r0], [E[3], E[0], r0, r0]], NR = 6;
      for (const [ea, eb, ra, rb] of faces) {
        const A = [ea[0], yE, ea[1]], B = [eb[0], yE, eb[1]];
        for (let k = 0; k < NR; k++) { const f0 = k / NR, f1 = (k + 1) / NR;
          g.quadO(PL(lerp3(A, ra, f0)), PL(lerp3(B, rb, f0)), PL(lerp3(B, rb, f1)), PL(lerp3(A, ra, f1)), tile(k), ins); }
      }
      g.quadO(P(a0, yE - 0.02, b0), P(a1, yE - 0.02, b0), P(a1, yE - 0.02, b1), P(a0, yE - 0.02, b1), [0.52, 0.38, 0.25], P(um, yE + 5, vm));
      // a ridge tile along the top
      { const q0 = PL(r0), q1 = PL(r1), L = Math.hypot(q1[0] - q0[0], q1[2] - q0[2]) + 0.3; BOX((r0[0] + r1[0]) / 2, yE + rise - 0.05, r0[2], L, 0.14, 0.22, [0.56, 0.24, 0.16]); }
      // the picnic tables in its shade (a top on two legs, a bench each side)
      for (const u of [u0 + 1.3, u1 - 1.3]) for (const v of [vm]) {
        const tw = [0.5, 0.35, 0.22]; BOX(u, top + 0.72, v, 0.85, 0.06, 2.0, tw); BOX(u, top, v - 0.7, 0.7, 0.72, 0.08, tw); BOX(u, top, v + 0.7, 0.7, 0.72, 0.08, tw);
        for (const s of [-1, 1]) { BOX(u + s * 0.75, top + 0.42, v, 0.3, 0.05, 2.0, tw); BOX(u + s * 0.75, top, v - 0.7, 0.26, 0.42, 0.06, tw); BOX(u + s * 0.75, top, v + 0.7, 0.26, 0.42, 0.06, tw); }
      }
    }
    // benches along the balustrade, facing the valley (concrete legs, timber slats)
    for (const u of [1.0, 4.4]) { const v = D / 2 - 1.3; BOX(u - 0.65, top, v, 0.14, 0.42, 0.42, [0.7, 0.69, 0.66]); BOX(u + 0.65, top, v, 0.14, 0.42, 0.42, [0.7, 0.69, 0.66]); BOX(u, top + 0.42, v, 1.7, 0.06, 0.44, [0.48, 0.33, 0.2]); BOX(u, top + 0.5, v - 0.22, 1.7, 0.4, 0.05, [0.46, 0.31, 0.19]); }
    // the coin telescope by the rail
    { const u = 2.7, v = D / 2 - 0.8; BOX(u, top, v, 0.22, 1.05, 0.22, [0.3, 0.42, 0.36]); BOX(u, top + 1.05, v, 0.3, 0.26, 0.56, [0.28, 0.4, 0.34], null, 0.15); }
    // the kiosk at the east end (pastel plaster, a dark serving hatch towards the terrace, a lean-to tin roof): no sign
    { const u = W / 2 - 1.9, v = -D / 2 + 2.4, w = 2.6, d = 2.2, h = 2.4, pl = [0.94, 0.84, 0.52];
      BOX(u, top, v, w, h, d, pl, pl); BOX(u - w / 2 - 0.01, top + 1.0, v, 0.02, 0.8, 1.4, [0.16, 0.14, 0.12]); BOX(u - w / 2 - 0.25, top + 0.95, v, 0.5, 0.06, 1.6, [0.62, 0.6, 0.56]);
      for (let k = 0; k < 6; k++) BOX(u - w / 2 - 0.3 + (k + 0.5) * (w + 0.6) / 6, top + h + 0.04 + 0.1 * (1 - (k + 0.5) / 6), v, (w + 0.6) / 6 + 0.02, 0.06, d + 0.6, k & 1 ? [0.62, 0.64, 0.66] : [0.7, 0.72, 0.74]); }
    // the bougainvillea in planters either side of the entrance (towards the road) and a hedge of it along the road side
    const BOUG = [[0.78, 0.18, 0.48], [0.86, 0.3, 0.56], [0.7, 0.16, 0.42]];
    for (const u of [-W / 2 + 0.8, -3.0, 3.0, W / 2 - 4.0]) {
      BOX(u, top, -D / 2 + 0.55, 1.4, 0.45, 0.7, [0.7, 0.66, 0.6]);
      const q = P(u, 0, -D / 2 + 0.55); for (let k = 0; k < 3; k++) puff(g, q[0] + (R() - 0.5) * 0.9, top + 0.75 + R() * 0.3, q[2] + (R() - 0.5) * 0.4, 0.45 + R() * 0.15, 0.8, BOUG[k], R, 0.35, 0.7, 1.15);
    }
    // two flowering trees (the orange crowns of the dry season) and a palm on the lawn round the terrace
    const flower = (x, z, h, col) => { const y = vrGround(x, z); cyl(g, x, y - 0.3, z, 0.22, h * 0.55 + 0.3, 6, [0.4, 0.33, 0.26], null, 0.16);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R(), r = k ? h * 0.22 : 0; puff(g, x + Math.cos(a) * r, y + h * (k ? 0.68 : 0.82), z + Math.sin(a) * r, h * (k ? 0.22 : 0.27), 0.7, k === 2 ? [0.32, 0.42, 0.2] : col, R, 0.3, 0.7, 1.15); } };
    const palm = (x, z, h) => { const y = vrGround(x, z), tr = [0.56, 0.5, 0.42];
      for (let k = 0; k < 4; k++) cyl(g, x + k * 0.12, y - 0.3 + k * h / 4, z, 0.2 - k * 0.02, h / 4 + 0.05, 6, tr, null, 0.18 - k * 0.02);
      const tx0 = x + 0.48, ty = y + h - 0.2;
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a), L = 2.6, c = [0.24 + R() * 0.06, 0.4 + R() * 0.06, 0.16];
        const mid = [tx0 + ca * L * 0.55, ty + 0.5, z + sa * L * 0.55], tip = [tx0 + ca * L, ty - 0.5, z + sa * L], w = [-sa * 0.45, 0, ca * 0.45];
        g.quadO([tx0, ty, z], [mid[0] + w[0], mid[1], mid[2] + w[2]], tip, [mid[0] - w[0], mid[1], mid[2] - w[2]], c, [tx0, ty - 3, z]); } };
    { const q = P(-W / 2 - 3.5, 0, 2.0); flower(q[0], q[2], 8.5, [0.95, 0.5, 0.14]); }
    { const q = P(W / 2 + 3.0, 0, 1.0); flower(q[0], q[2], 7.5, [0.92, 0.42, 0.12]); }
    { const q = P(W / 2 + 1.6, 0, -D / 2 - 1.2); palm(q[0], q[2], 7.0); }
    // a few rocks where the wall meets the slope below
    for (let k = 0; k < 6; k++) { const u = -W / 2 + R() * W, v = D / 2 + 0.6 + R() * 1.2, q = P(u, 0, v); rock(g, q[0], vrGround(q[0], q[2]) - 0.2, q[2], 0.5 + R() * 0.6, 0.3 + R() * 0.3, 0.5 + R() * 0.5, R() * TAU, [0.5, 0.48, 0.44], R, 0.25); }
    return { x: cx, z: cz, top, lo, d: dC };
  }

  // the lookout's view: the land beyond the corridor (def.farDem, irFar as Irohazaka's: the valley, the Cachí reservoir at its level, the ridges
  // round), each node coloured by its land cover (def.far.lc: ESA WorldCover, OpenStreetMap's orchards; the coffee by the reservoir), and the
  // ruins of the old church of Ujarrás on the valley's floor (def.far.ruins: OpenStreetMap's footprint; roofless stone walls ~7 m high with
  // openings, the height a guess: the map has none), part of the same mesh (moved with the camera as its ground, so never in front of the near world)
  const FARC = { t: [0.17, 0.29, 0.13], s: [0.3, 0.37, 0.17], g: [0.4, 0.53, 0.24], c: [0.47, 0.52, 0.27], b: [0.64, 0.57, 0.5], r: [0.56, 0.5, 0.43], k: [0.14, 0.27, 0.12] };
  const farCol = Object.assign(() => FARC.t, { wet: [0.25, 0.33, 0.31] });   // (the reservoir's water: a turbid green)
  function farView(ctx) {
    const T = API.T, def = T.def, F = def.farDem, FD = def.far; if (!API.irFar || !F || !FD) return null;
    const FAR = API.irFar(farCol); if (!FAR) return null;
    const nx = F.nx, nz = F.nz, n = nx * nz, g = FAR.mesh.geometry, col = g.attributes.color.array, wet = new Uint8Array(n);
    for (let k = 0, p = 0, v = 0; k < F.lake.length; k++) { if (v) wet.fill(1, p, p + F.lake[k]); p += F.lake[k]; v ^= 1; }
    // the land cover (runs of a letter and a count), each node a little lighter or darker (a hash of its place: the patchwork of the valley)
    let k = 0; for (const m of FD.lc.matchAll(/([a-z])(\d*)/g)) { const c = FARC[m[1]] || FARC.t;
      for (let e = k + (m[2] ? +m[2] : 1); k < e && k < n; k++) { if (wet[k]) continue; const h = Math.sin(k * 12.9898) * 43758.5453, f = 0.9 + 0.2 * (h - Math.floor(h));
        col[3 * k] = c[0] * f; col[3 * k + 1] = c[1] * f; col[3 * k + 2] = c[2] * f; } }
    // the haze round the corridor's hole: a narrower band than irFar's (the valley floor a kilometre off is the lookout's view, not haze)
    const dr = (x, z) => { let m = 1e18; for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) FAR.rim[j * nx + i] = API.sstep(640, 470, dr(F.x0 + i * F.cell, F.z0 + j * F.cell));
    // the ground's height under a point of the grid (bilinear between its nodes: the mesh's own, so the walls stand on it)
    const gh = (x, z) => { const u = Math.max(0, Math.min(nx - 1.001, (x - F.x0) / F.cell)), v = Math.max(0, Math.min(nz - 1.001, (z - F.z0) / F.cell)), i = u | 0, j = v | 0, a = u - i, b = v - j;
      const H = (ii, jj) => FAR.P0[3 * (jj * nx + ii) + 1]; return (H(i, j) * (1 - a) + H(i + 1, j) * a) * (1 - b) + (H(i, j + 1) * (1 - a) + H(i + 1, j + 1) * a) * b; };
    let walls = 0;
    if (FD.ruins) {
      const Rp = FD.ruins, nc = Rp.length / 2, V = [], C = [], I = [], st = [0.66, 0.6, 0.5], dk = [0.2, 0.18, 0.16];
      let y0 = Infinity; for (let c = 0; c < nc; c++) y0 = Math.min(y0, gh(Rp[2 * c], Rp[2 * c + 1]));
      const HW = 7, quad = (a, b, ya, yb, cc, out) => { for (const w of [0, 1]) { const v0 = V.length / 3;   // (both faces, each its own vertices: a wall seen from either side)
        V.push(a[0], ya, a[1], b[0], ya, b[1], b[0], yb, b[1], a[0], yb, a[1]); for (let q = 0; q < 4; q++) C.push(cc[0], cc[1], cc[2]);
        if (w === 0) I.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); else I.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2); } };
      for (let c = 0; c < nc; c++) { const a = [Rp[2 * c], Rp[2 * c + 1]], b = [Rp[2 * ((c + 1) % nc)], Rp[2 * ((c + 1) % nc) + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        // each wall in bays of ~4 m: a solid plinth, the openings (dark: the inside of the roofless shell seen through them) every other bay, the top
        const nb = Math.max(1, Math.round(L / 4)), P = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        for (let q = 0; q < nb; q++) { const p0 = P(q / nb), p1 = P((q + 1) / nb), open = L > 20 ? q % 2 === 1 : q === (nb >> 1);
          quad(p0, p1, y0 - 1.5, y0 + 1.2, st); quad(p0, p1, y0 + 1.2, y0 + 4.6, open ? dk : st); quad(p0, p1, y0 + 4.6, y0 + HW, st); walls++; } }
      const nv0 = FAR.P0.length / 3, nv = nv0 + V.length / 3, P0 = new Float32Array(3 * nv), cl = new Float32Array(3 * nv), rim = new Float32Array(nv);
      P0.set(FAR.P0); P0.set(V, 3 * nv0); cl.set(col); cl.set(C, 3 * nv0); rim.set(FAR.rim);
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(P0.slice(), 3)); ng.setAttribute('color', new THREE.BufferAttribute(cl, 3));
      ng.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); ng.setIndex(Array.from(g.index.array).concat(I.map((v) => v + nv0))); ng.computeVertexNormals();
      g.dispose(); FAR.mesh.geometry = ng; FAR.P0 = P0; FAR.rim = rim;
    } else g.attributes.color.needsUpdate = true;
    FAR.th = 4; FAR.mesh.visible = false; ctx.root.add(FAR.mesh); ctx.out.dyn.irFar = FAR;   // (hidden until the first World.update; moved on once the camera is 4 m on)
    return { nodes: n, wet: wet.reduce((a, b) => a + b, 0), walls };
  }

  const near = (p, x, z, r) => Math.hypot(x - p[0], z - p[1]) < r;
  World.ext.ujarras = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 2020, snow: 'none',
    ground: { grass: [0.38, 0.52, 0.24], forest: [0.24, 0.32, 0.16], shrub: [0.34, 0.42, 0.2], built: [0.54, 0.52, 0.48], rock: [0.52, 0.48, 0.42], dry: [0.56, 0.52, 0.34] },
    road: { line: 'yellow' },
    trees: { kinds: ['broad'], forest: 0.42, open: 0.05, h: [10, 18] },   // (the coffee country's shade trees and the forest on the valley's slopes)
    skiers: 0, nets: false, snowbanks: false, lifts: false, poles: null,
    boards: { start: 'START', finish: 'FINISH', banner: 'HILL CLIMB', cp: '#1d5c3a', closed: 'ROAD CLOSED', gate: 'CLOSED' },
    animals: [{ kind: 'parrot', n: 6 }],
    clear: [[MIRADOR[0], MIRADOR[1], 16]],   // (no trees or rocks of the land cover on the lookout)
    ownBld: (x, z) => near(MIRADOR, x, z, 22),
    extra: (ctx) => {
      const { scen, out } = ctx;
      out.ujarras = { lookout: lookout(scen), far: farView(ctx) };
      if (World.ext.goreRob) World.ext.goreRob(ctx, 'ujarras');   // (the roadside ground from the chase camera: js/world-chase-bt11.js)
    },
  });
})();
