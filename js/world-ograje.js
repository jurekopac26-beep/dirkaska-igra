/* =========================================================================
   WORLD — the fences, guard rails and avenues of OSM by the road (Grafika AAA, V4, paket E0: docs/grafika-aaa.md; the user's go of
   26. 11. 2026). Only the look: no collider (the barriers stay Core's T.bl / T.br, the physics and the crashes as they were: N7), no draw
   call more (all of it goes into the meshes a builder makes anyway: the barrier's ribbons, the trees' instanced chunks), the data only
   OSM's (barrier=fence / wall / hedge / guard_rail, natural=tree_row; tools/proga-podatki.py, a track's tools; ODbL, README »Zasluge«).
   Only the tracks in PROGE take it (the real tracks with room to spare under the limits: tests/golden/perf.json; never test: true or
   pending: true, CLAUDE.md); a builder asks za(id) and draws as before when it says no. Three things:
   1. VARNOSTNE (the guard rails on the barrier): where an OSM guard rail runs along the barrier (inside it or up to 1.5 m beyond) the
      builder draws that stretch of the barrier as a guard rail instead of its wall: one W-beam unbroken along the stretch, its smooth
      face to the road, on posts every 2 m (one per sample), in the same ribbon as the wall (vrsta, stebri). The barrier itself is where it
      was: a car hits it as before.
   2. PROSTE (the fences and guard rails beyond the barrier): OSM's fences, railings and guard rails further out (by type: a wooden
      fence's boards, a chain-link fence's posts and wires, a metal railing's two rails; a guard rail's beam and posts) as thin boxes in the
      barrier ribbon of the samples they stand by (dodaj); a fence right on the barrier or inside it is left out (the wall is there).
   3. DREVOREDI (the avenues): OSM's tree rows planted along their lines (a cypress every 5 m, a pine every 10 m, else every 8 m) through
      the builder's plant(), only into instanced chunks that already exist (no chunk and so no draw call more).
   The hedges stay the builders' solid boxes (no cut-outs, so no customDepthMaterial and no warm-up needed).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined') return;
  const PROGE = { livorno: 1 };
  const NA = 1.5, NF = 0.8;   // (m beyond the barrier: an OSM guard rail closer than NA is the barrier's own; a fence closer than NF is on the wall)
  const GALV = [0.82, 0.84, 0.85], GALVD = [0.64, 0.66, 0.67], GALVT = [0.9, 0.9, 0.91], POST = [0.58, 0.6, 0.62];   // (galvanised steel)
  const LOOK = {   // a fence by its make: posts [width, height, colour], rails [height, thickness, depth], their colour, the step between posts (m)
    w: { pw: 0.12, ph: 1.15, pc: [0.42, 0.32, 0.21], rails: [[0.45, 0.12, 0.03], [0.95, 0.12, 0.03]], rc: [0.55, 0.43, 0.29], step: 2.4 },
    c: { pw: 0.06, ph: 1.8, pc: [0.5, 0.54, 0.5], rails: [[1.76, 0.04, 0.04], [0.12, 0.02, 0.02], [0.95, 0.015, 0.015]], rc: [0.56, 0.6, 0.56], step: 2.5 },
    '': { pw: 0.06, ph: 1.1, pc: [0.44, 0.46, 0.47], rails: [[1.04, 0.05, 0.04], [0.16, 0.04, 0.04]], rc: [0.5, 0.52, 0.53], step: 2 },
  };
  const ST = { varn: 0, proste: 0, prosteM: 0, drev: 0, drevBrez: 0 };   // (what the last build drew: tests, the PR's numbers)

  const za = (id) => !!PROGE[id] && !World.ograje.izkl;   // (izkl: the »before« pictures and the tests turn it off)

  /* ---- a box along a: from (ax, ay, az) to (bx, by, bz), w wide and h tall above the line, as two rings of 5 points (a ribbon's rows) ---- */
  function bar(gr, ax, ay, az, bx, by, bz, w, h, col, colT) {
    let dx = bx - ax, dz = bz - az; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz * w / 2, nz = dx * w / 2, ring = (x, y, z) => gr.row([[x - nx, y, z - nz], [x + nx, y, z + nz], [x + nx, y + h, z + nz], [x - nx, y + h, z - nz], [x - nx, y, z - nz]], [col, col, colT || col, colT || col, col]);
    gr.link(ring(ax, ay, az), ring(bx, by, bz), 0, 4);
  }
  /* ---- a post: x, z, from y0 up to y1, w square (its faces turned to the road's direction tx, tz) ---- */
  function post(gr, x, z, y0, y1, w, tx, tz, col) {
    const a = w / 2, nx = -tz, nz = tx, P = (u, v, y) => [x + tx * u + nx * v, y, z + tz * u + nz * v];
    const r0 = gr.row([P(-a, -a, y0), P(a, -a, y0), P(a, a, y0), P(-a, a, y0), P(-a, -a, y0)], [col, col, col, col, col]);
    const r1 = gr.row([P(-a, -a, y1), P(a, -a, y1), P(a, a, y1), P(-a, a, y1), P(-a, -a, y1)], [col, col, col, col, col]);
    gr.link(r0, r1, 0, 4);
  }

  /* ---- 1. which samples' barrier is a guard rail: {l, r} (1 = the left / right barrier at that sample), from OSM's guard rails along it ---- */
  function varnostne(T, walls, near) {
    for (const k in ST) ST[k] = 0;
    const N = T.N, M = [new Uint8Array(N), new Uint8Array(N)];
    for (const w of walls) {
      if (w[0] !== 4 || w[2] === 'j') continue;   // (a jersey barrier is concrete: the wall stays)
      const fl = w[1];
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t <= len; t += 1) {
          const x = ax + (bx - ax) * t / (len || 1), z = az + (bz - az) * t / (len || 1), n = near(x, z);
          if (n.i < 0 || n.dd > NA || Math.abs(n.lat) < 3) continue;
          const sd = n.lat > 0 ? 1 : 0; for (let k = -1; k <= 1; k++) M[sd][((n.i + k) % N + N) % N] = 1;
        }
      }
    }
    for (const m of M) {   // no gap shorter than 8 m, no stretch shorter than 10 m
      const gap = Math.round(8 / T.ds), min = Math.round(10 / T.ds);
      let s0 = m.indexOf(1); if (s0 < 0) continue;
      for (let i = 0; i < N; i++) { const a = (s0 + i) % N; if (!m[a]) { let e = 0; while (e < N && !m[(a + e) % N]) e++; if (e <= gap && e < N) for (let k = 0; k < e; k++) m[(a + k) % N] = 1; i += e - 1; } }
      for (let i = 0; i < N; i++) { const a = (s0 + i) % N; if (m[a]) { let e = 0; while (e < N && m[(a + e) % N]) e++; if (e < min) for (let k = 0; k < e; k++) m[(a + k) % N] = 0; i += e - 1; } }
    }
    let n = 0; for (const m of M) for (let i = 0; i < N; i++) n += m[i];
    ST.varn = Math.round(n * T.ds);
    return { l: M[0], r: M[1], at: (i, side) => M[side > 0 ? 1 : 0][i] };
  }
  /* ---- the guard rail's row at sample i (4 points, as the builders' wall rows): the beam's face at the barrier, the road's side smooth,
     a lip on top and the flange behind ---- */
  function vrsta(gr, Pt, i, side, barO) {
    const o = side * (barO + 0.06), ob = side * (barO + 0.12);
    let p = [Pt(i, o, 0.42), Pt(i, o, 0.76), Pt(i, ob, 0.78), Pt(i, ob, 0.64)], c = [GALVD, GALV, GALVT, GALVD];
    if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
    return gr.row(p, c);
  }
  /* ---- the post behind the beam at sample i ---- */
  function stebri(gr, T, i, side, barO) {
    const o = side * (barO + 0.19), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = T.hy[i];
    post(gr, x, z, y - 0.45, y + 0.74, 0.1, T.tx[i], T.tz[i], POST);
  }

  /* ---- 2. the fences and guard rails beyond the barrier, by the samples they stand by: dodaj(gr, i0, i1) adds those of samples i0..i1 ---- */
  function proste(T, walls, near, gH) {
    const by = new Map(), add = (i, f) => { let L = by.get(i); if (!L) by.set(i, L = []); L.push(f); };
    for (const w of walls) {
      const k = w[0], mk = w[2] || ''; if (k < 3 || (k === 4 && mk === 'j')) continue;
      const fl = w[1], gd = k === 4, lk = LOOK[mk] || LOOK[''], step = gd ? 2 : lk.step;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const n = Math.max(1, Math.round(len / step));
        for (let j = 0; j < n; j++) {
          const x0 = ax + (bx - ax) * j / n, z0 = az + (bz - az) * j / n, x1 = ax + (bx - ax) * (j + 1) / n, z1 = az + (bz - az) * (j + 1) / n;
          const nn = near((x0 + x1) / 2, (z0 + z1) / 2); if (nn.i < 0 || nn.dd < (gd ? NA : NF)) continue;
          const i = nn.i; let fx = 0, fz = 0;
          if (gd) { const dx = T.px[i] - (x0 + x1) / 2, dz = T.pz[i] - (z0 + z1) / 2, l = Math.hypot(dx, dz) || 1; fx = dx / l; fz = dz / l; }   // (the beam's face toward the road)
          add(i, [gd, lk, x0, z0, gH(x0, z0), x1, z1, gH(x1, z1), fx, fz, j === n - 1]);
          ST.prosteM += len / n;
        }
      }
    }
    ST.prosteM = Math.round(ST.prosteM);
    const dodaj = (gr, i0, i1) => {
      for (let i = i0; i < i1; i++) {
        const L = by.get(i); if (!L) continue;
        for (const [gd, lk, x0, z0, y0, x1, z1, y1, fx, fz, last] of L) {
          let tx = x1 - x0, tz = z1 - z0; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
          if (gd) {   // a guard rail: the beam (a flat face toward the road, 0.42-0.76 m) and its posts behind it
            const ox = -fx * 0.06, oz = -fz * 0.06;
            bar(gr, x0, y0 + 0.42, z0, x1, y1 + 0.42, z1, 0.05, 0.34, GALVD, GALV);
            post(gr, x0 + ox * 2, z0 + oz * 2, y0 - 0.3, y0 + 0.74, 0.1, tx, tz, POST); if (last) post(gr, x1 + ox * 2, z1 + oz * 2, y1 - 0.3, y1 + 0.74, 0.1, tx, tz, POST);
          } else {   // a fence: its post at the start (and at the end of the line) and its rails
            post(gr, x0, z0, y0 - 0.3, y0 + lk.ph, lk.pw, tx, tz, lk.pc); if (last) post(gr, x1, z1, y1 - 0.3, y1 + lk.ph, lk.pw, tx, tz, lk.pc);
            for (const [rh, th, dp] of lk.rails) bar(gr, x0, y0 + rh - th / 2, z0, x1, y1 + rh - th / 2, z1, dp, th, lk.rc);
          }
          ST.proste++;
        }
      }
    };
    return { dodaj };
  }

  /* ---- 3. the avenues: plant(sp, x, z, height, width, colour) as the builder's; has(sp, x, z): is there an instanced chunk already ---- */
  function drevoredi(rows, near, excluded, plant, has, crH) {
    for (const [kind, fl] of rows) {
      const sp = kind === 'c' ? 2 : kind === 'p' ? 0 : 1, step = sp === 2 ? 5 : sp === 0 ? 10 : 8;
      let carry = step / 2;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az);
        let t = carry;
        for (; t <= len; t += step) {
          const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len, nn = near(x, z);
          if ((nn.i >= 0 && nn.dd < 2.5) || excluded(x, z)) continue;
          if (!has(sp, x, z)) { ST.drevBrez++; continue; }
          const hq = crH(x, z, 28), hgt = sp === 2 ? 10 + hq * 5 : sp === 0 ? 12 + hq * 5 : 7 + hq * 3, wid = sp === 2 ? hgt * 0.17 : sp === 0 ? hgt * 0.85 : hgt * 0.75;
          plant(sp, x, z, hgt, wid, [0.95, 1, 0.95]); ST.drev++;
        }
        carry = t - len;
      }
    }
  }

  World.ograje = { za, varnostne, vrsta, stebri, proste, drevoredi, PROGE, ST, izkl: false };
})();
