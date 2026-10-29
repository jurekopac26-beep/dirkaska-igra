// NEW VERSION · TEST 1: the small circuit's edge as the user chose it in the pictures (version D, 19.–22. 10.): the tricolour kerb (green by the
// asphalt, cream, red) on both sides all round and the white edge line along it all round (beside a lot too); where another way runs onto the
// circuit (a road, a garage's lane) no kerb and the line dashed, 1.5 m on and 1.5 m off; a dirt road crossing it leaves it as it is; no centre line. Toskana's own kerb
// (js/world.js: the inside of the bends, the outside of the hairpins) and its edge line (where no kerb is) stay, in the pictures' colours; what is
// missing is added in their own materials, and at a junction they are cut. Built by js/newmap.js hub4G once every way is laid, before the still
// meshes are merged (js/nvbake.js). Loaded with the new map (js/game.js nvStart).
const NVEdge = (function () {
  'use strict';
  const KFD = 0.45, RB = 5.5, DASH = 3;   // (the kerb's soft outer edge, m; how far a junction's rounded corner reaches along the circuit; a dash and its gap)
  let KT = null;
  // the kerb's texture as in the pictures: u 0 at the asphalt .. 1 at 1.5 m (green 0.55 m, cream 0.4 m, red darkening to the outer edge), 3 m a repeat
  function kerbTex() { if (KT) return KT; const c = document.createElement('canvas'); c.width = 32; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#588a72'; x.fillRect(0, 0, 12, 64); x.fillStyle = '#9daf94'; x.fillRect(12, 0, 9, 64);
    const g = x.createLinearGradient(21, 0, 32, 0); g.addColorStop(0, '#97524a'); g.addColorStop(0.27, '#97524a'); g.addColorStop(1, '#703c37'); x.fillStyle = g; x.fillRect(21, 0, 11, 64);
    KT = new THREE.CanvasTexture(c); KT.wrapS = KT.wrapT = THREE.RepeatWrapping; KT.magFilter = THREE.NearestFilter; KT.anisotropy = 4; return KT; }
  // the kerb's worn outer edge, 0.02..0.45 m back from its full width, a gentle wave (three octaves of value noise, as Toskana's own, js/world.js)
  const noise2 = (seed, sc) => { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, P = 64, g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, z) => { x /= sc; z /= sc; const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, I = (a, b) => g[(((b % P) + P) % P) * P + (((a % P) + P) % P)], u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
      return (I(xi, zi) * (1 - u) + I(xi + 1, zi) * u) * (1 - v) + (I(xi, zi + 1) * (1 - u) + I(xi + 1, zi + 1) * u) * v; }; };
  const kN = [noise2(9797, 5), noise2(9767, 3), noise2(9737, 1.7)];
  const wear = (x, z) => Math.max(0.02, Math.min(0.45, 0.235 + (0.11 * (kN[0](x, z) - 0.5) + 0.07 * (kN[1](x, z) - 0.5) + 0.05 * (kN[2](x, z) - 0.5)) / 0.2));
  // a mesh of quads, each turned to face up; vertex colours with alpha, uv
  function MB() { const pos = [], col = [], uv = [], idx = [];
    return { v(x, y, z, c, a, u, w) { pos.push(x, y, z); col.push(c[0], c[1], c[2], a); uv.push(u, w); return pos.length / 3 - 1; },
      q(a, b, c, d) { const ux = pos[3 * b] - pos[3 * a], uz = pos[3 * b + 2] - pos[3 * a + 2], vx = pos[3 * c] - pos[3 * a], vz = pos[3 * c + 2] - pos[3 * a + 2]; if (uz * vx - ux * vz >= 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c); },
      mesh(m, MK) { if (!idx.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; return MK.add(me); } }; }

  function build(MK) {
    const H3 = MK.H3, T = MK.T(), root = Render.world && Render.world.root; if (!H3 || !T || !root) return null;
    let WK = null, WE = null; root.traverse(o => { if (!o.isMesh) return; if (o.name === 'kerb') WK = o; else if (o.name === 'edgeline') WE = o; }); if (!WK || !WE) return null;
    const N = T.N, w = T.w, cw = T.curbW, ds = T.ds, out = { kerb: 0, line: 0, dash: 0, mouth: 0, centre: 0 };
    WK.material.map = kerbTex(); WK.material.needsUpdate = true;   // (Toskana's own kerb in the pictures' three stripes)
    // no centre line on the circuit (the pictures): Toskana's dashes through the corners (a mesh whose quads lie on the centre line) hidden
    root.traverse(o => { if (!o.isMesh || o.name || !o.material || o.material.map || !o.material.vertexColors) return; const P = o.geometry.attributes.position; if (!P || P.count < 24) return;
      for (let k = 0; k < Math.min(P.count, 48); k += 3) if (Math.abs(T.query(P.getX(k), P.getZ(k), -1, {}).d) > 0.3) return; o.visible = false; out.centre += P.count; });
    // the other paved ways: the net's (roads, the park's lanes), every way laid as an asphalt road (the garages' lanes too: H3.rr)
    const ways = [], bbOf = (P, m) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0 - m, x1 + m, z0 - m, z1 + m]; };
    for (const e of H3.net || []) if (e.kind === 'asph') ways.push({ id: e.id, P: e.P, hw: e.hw, bb: bbOf(e.P, e.hw + 4) });
    for (const r of H3.rr || []) if (r.style !== 'forest') { const P = r.P2.map(p => [p.x, p.z]); ways.push({ id: r.id, P, hw: r.wd / 2, bb: bbOf(P, r.wd / 2 + 4) }); }
    const wayD = (x, z, skip) => { let best = 1e9; for (const e of ways) { const b = e.bb; if (e.id === skip || x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; const P = e.P;
      for (let k = 0; k < P.length - 1; k++) { const ax = P[k][0], az = P[k][1], vx = P[k + 1][0] - ax, vz = P[k + 1][1] - az, u = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))), d = Math.hypot(ax + vx * u - x, az + vz * u - z) - e.hw; if (d < best) best = d; } } return best; };
    // the junctions along each side: another way's asphalt at the circuit's edge, then widened by the rounded corners' reach; short gaps closed
    const at = (i, s, o) => [T.px[i] + T.nx[i] * s * o, T.pz[i] + T.nz[i] * s * o], K = Math.ceil(RB / ds), M = [0, 1].map(() => new Uint8Array(N));
    for (const [j, s] of [[0, -1], [1, 1]]) { const raw = new Uint8Array(N);
      for (let i = 0; i < N; i++) for (const o of [0.6, 1.4]) { const [x, z] = at(i, s, w + o); if (wayD(x, z) < 0.3) { raw[i] = 1; break; } }
      for (let i = 0; i < N; i++) if (raw[i]) for (let k = -K; k <= K; k++) M[j][(i + k + N) % N] = 1;
      for (let i = 0; i < N; i++) if (M[j][i] && !M[j][(i + 1) % N]) { let g = 1; while (g < 5 && !M[j][(i + 1 + g) % N]) g++; if (g < 5) for (let k = 1; k <= g; k++) M[j][(i + k) % N] = 1; }
      for (let i = 0; i < N; i++) out.mouth += M[j][i]; }
    const mouthAt = (x, z) => { const q = T.query(x, z, -1, {}), a = Math.abs(q.d); if (a < w - 0.7 || a > w + cw + KFD + 0.4) return false; return !!M[q.d < 0 ? 0 : 1][((q.a % N) + N) % N]; };
    // Toskana's own kerb, edge line and earth shoulder cut at the junctions (the other way's asphalt, its rounded corners)
    MK.clearWorld((x, z, m) => m > 0 || mouthAt(x, z), -99, ['kerb', 'edgeline', 'shoulder']);
    // Toskana's kerb where it is: the inside of the bends, the outside of the hairpins (its own rule, js/world.js kerbOn)
    const kerbW = (i, s) => { const j = (i + 1) % N; return !!(T.curb[i] && T.curb[j]) && !(s * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035); };
    const pAt = (i, t, s, o) => { const j = (i + 1) % N, x = T.px[i] + (T.px[j] - T.px[i]) * t, z = T.pz[i] + (T.pz[j] - T.pz[i]) * t; let nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; return [x + nx * s * o, z + nz * s * o, nx * s, nz * s]; };
    // the kerb added where the circuit had none: as Toskana's (its outer edge worn, faded softly into the ground; a run's first and last 2 m thinning out)
    { const B = MB(), W1 = [1, 1, 1];
      for (const [j, s] of [[0, -1], [1, 1]]) { const on = (i) => { i = ((i % N) + N) % N; return !kerbW(i, s) && !M[j][i]; };
        for (let i = 0; i < N; i++) { if (!on(i)) continue; let r0 = 0, r1 = 0; while (r0 < 3 && on(i - r0 - 1)) r0++; while (r1 < 3 && on(i + r1 + 1)) r1++; const first = !on(i - 1), last = !on(i + 1), rs = r0 + r1 + 1 > 4 ? 1 : 2;
          const sec = (t) => { const [x, z, nx, nz] = pAt(i, t, s, w), e = cw - wear(x + nx * cw, z + nz * cw), sh = 0.94 + 0.12 * kN[1](x * 1.7, z * 1.7), a = Math.min(first ? Math.min(1, t * rs) : 1, last ? Math.min(1, (1 - t) * rs) : 1), v = (i + t) * ds / 3;
            return [B.v(x, 0.045, z, W1, a, 0, v), B.v(x + nx * e, 0.085, z + nz * e, [sh, sh, sh], a, e / cw, v), B.v(x + nx * (e + KFD), 0.035, z + nz * (e + KFD), [sh, sh, sh], 0, e / cw, v)]; };
          const S = [sec(0), sec(0.5), sec(1)]; for (let h = 0; h < 2; h++) for (let c = 0; c < 2; c++) B.q(S[h][c], S[h][c + 1], S[h + 1][c + 1], S[h + 1][c]); out.kerb++; } }
      B.mesh(WK.material, MK); }
    // the edge line: added where Toskana's kerb is (it drew none there), dashed across the junctions (Toskana's own worn paint, its tile along the lap)
    { const lw = 0.22, MG = 0.09, PER = T.len / Math.max(1, Math.round(T.len / 32)), o0 = w - 0.12 - lw - MG, o1 = Math.min(w - 0.03, w - 0.12 + MG), u1 = (o1 - o0) / (lw + 2 * MG), wc = [0.93, 0.92, 0.94], B = MB();
      const piece = (i, t0, t1, s) => { const [xa, za, nxa, nza] = pAt(i, t0, s, 0), [xb, zb, nxb, nzb] = pAt(i, t1, s, 0), va = (i + t0) * ds / PER + (s > 0 ? 0 : 0.37), vb = (i + t1) * ds / PER + (s > 0 ? 0 : 0.37);
        B.q(B.v(xa + nxa * o0, 0.036, za + nza * o0, wc, 1, 0, va), B.v(xb + nxb * o0, 0.036, zb + nzb * o0, wc, 1, 0, vb), B.v(xb + nxb * o1, 0.036, zb + nzb * o1, wc, 1, u1, vb), B.v(xa + nxa * o1, 0.036, za + nza * o1, wc, 1, u1, va)); };
      for (const [j, s] of [[0, -1], [1, 1]]) for (let i = 0; i < N; i++) {
        if (!M[j][i]) { if (kerbW(i, s)) { piece(i, 0, 1, s); out.line++; } continue; }
        const s0 = i * ds; for (let t = 0; t < 1 - 1e-6; t += 0.25) { const sm = s0 + (t + 0.125) * ds; if (sm % DASH < DASH / 2) { piece(i, t, t + 0.25, s); out.dash++; } } }
      B.mesh(WE.material, MK); }
    // the inner roads (the one that had the jump, the bend road; js/newmap.js raceRoad without their own lines, kerbs and dust) edged as the circuit: the
    // line, the kerb, a rust-red strip from the asphalt out to 2.2 m, a dashed centre line. Their mouths flare out in a rounded corner (raceRoad's
    // bellmouth) and the edge runs round it up to the other way's asphalt; across another way's mouth the line runs on dashed, along its own edge
    { const TL = H3.TL, gr = H3.ground || (() => 0), onT = (x, z, m) => TL.dist(x, z, 20) - w < m, KB = MB(), LB = MB(), SB = MB(), CB = MB(), W1 = [1, 1, 1], WC = [0.93, 0.92, 0.94], TR = [0.52, 0.35, 0.245];
      const lw = 0.22, MG = 0.09, AS = 0.09;   // (the line's paint and margin, as the circuit's; the inner roads' asphalt 9 cm over the ground)
      for (const id of ['jump', 'bend']) { const r = H3.roads && H3.roads[id]; if (!r) continue; const P2 = r.P2, nrm = r.nrm, n = P2.length - 1, hw = r.wd / 2, dr = r.Lc / n; out[id] = 0;
        for (const s of [-1, 1]) { const j = s < 0 ? 0 : 1, off = (i) => s * (hw + r.ext[j][i]);
          const E = P2.map((p, i) => [p.x + nrm[i][0] * off(i), p.z + nrm[i][1] * off(i)]), En = P2.map((p, i) => [p.x + nrm[i][0] * s * hw, p.z + nrm[i][1] * s * hw]);
          // (the edge's own outward normal: round a flared corner it turns with the edge)
          const N2 = E.map((e, i) => { const a = E[Math.max(0, i - 1)], b = E[Math.min(n, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; let nx = -tz, nz = tx; if (nx * nrm[i][0] * s + nz * nrm[i][1] * s < 0) { nx = -nx; nz = -nz; } return [nx, nz]; });
          const free = (x, z) => !onT(x, z, 0.3) && wayD(x, z, id) > 0.1, ok = E.map(([x, z]) => free(x, z));
          // the strip and the kerb along the free edge (a run's first and last 2 m thinning out)
          let acc = 0; const S = E.map((e, i) => (i ? (acc += Math.hypot(e[0] - E[i - 1][0], e[1] - E[i - 1][1])) : 0));
          const r0 = new Int32Array(n + 1), r1 = new Int32Array(n + 1); for (let i = 0; i <= n; i++) r0[i] = i && ok[i - 1] && ok[i] ? r0[i - 1] : i; for (let i = n; i >= 0; i--) r1[i] = i < n && ok[i + 1] && ok[i] ? r1[i + 1] : i;
          const fa = (q) => Math.max(0, Math.min(1, (S[q] - S[r0[q]]) / 2, (S[r1[q]] - S[q]) / 2));
          for (let i = 0; i < n; i++) { if (!ok[i] || !ok[i + 1]) continue;
            const sec = (q) => { const [x, z] = E[q], [nx, nz] = N2[q], g = gr(x, z), e = cw - wear(x + nx * cw, z + nz * cw), sh = 0.94 + 0.12 * kN[1](x * 1.7, z * 1.7), a = fa(q), v = S[q] / 3, k = 0.96 + 0.06 * Math.sin(S[q] * 0.37 + s) * Math.sin(S[q] * 0.11 + 2);
              return { k: [KB.v(x, g + AS + 0.03, z, W1, a, 0, v), KB.v(x + nx * e, g + AS + 0.06, z + nz * e, [sh, sh, sh], a, e / cw, v), KB.v(x + nx * (e + KFD), g + 0.06, z + nz * (e + KFD), [sh, sh, sh], 0, e / cw, v)],
                s: [SB.v(x - nx * 0.05, g + AS - 0.01, z - nz * 0.05, TR.map(c => c * k), a, 0, 0), SB.v(x + nx * 1.9, g + 0.075, z + nz * 1.9, TR.map(c => c * k), a, 0, 0), SB.v(x + nx * 2.35, g + 0.07, z + nz * 2.35, TR.map(c => c * k), 0, 0, 0)] }; };   // (over the lot's edge beside it, js/nvbase.js)
            const A = sec(i), B = sec(i + 1); for (let c = 0; c < 2; c++) { KB.q(A.k[c], A.k[c + 1], B.k[c + 1], B.k[c]); SB.q(A.s[c], A.s[c + 1], B.s[c + 1], B.s[c]); } out[id]++; }
          // the line: solid along the free edge, dashed along the road's own edge across another way's mouth, none on the circuit
          const line = (e0, e1, n0, n1, v0, v1) => { const g0 = gr(e0[0], e0[1]) + AS + 0.012, g1 = gr(e1[0], e1[1]) + AS + 0.012, o0 = 0.12 + lw + MG, o1 = 0.03;
            LB.q(LB.v(e0[0] - n0[0] * o0, g0, e0[1] - n0[1] * o0, WC, 1, 0, v0), LB.v(e1[0] - n1[0] * o0, g1, e1[1] - n1[1] * o0, WC, 1, 0, v1), LB.v(e1[0] - n1[0] * o1, g1, e1[1] - n1[1] * o1, WC, 1, 1, v1), LB.v(e0[0] - n0[0] * o1, g0, e0[1] - n0[1] * o1, WC, 1, 1, v0)); };
          for (let i = 0; i < n; i++) { const sm = (i + 0.5) * dr, nn = [nrm[i][0] * s, nrm[i][1] * s], nn1 = [nrm[i + 1][0] * s, nrm[i + 1][1] * s];
            if (ok[i] && ok[i + 1]) line(E[i], E[i + 1], N2[i], N2[i + 1], S[i] / 32, S[i + 1] / 32);
            else if (!onT(En[i][0], En[i][1], 0.4) && !onT(En[i + 1][0], En[i + 1][1], 0.4) && sm % DASH < DASH / 2) line(En[i], En[i + 1], nn, nn1, i * dr / 32, (i + 1) * dr / 32); } }
        // the dashed centre line, 3 m on and 3 m off, not on the circuit
        for (let i = 0; i < n; i++) { const sm = (i + 0.5) * dr, p = P2[i], q = P2[i + 1]; if (sm % 6 >= 3 || onT(p.x, p.z, 0.5) || onT(q.x, q.z, 0.5)) continue; const g0 = gr(p.x, p.z) + AS + 0.012, g1 = gr(q.x, q.z) + AS + 0.012, a = nrm[i], b = nrm[i + 1];
          CB.q(CB.v(p.x - a[0] * 0.13, g0, p.z - a[1] * 0.13, [0.93, 0.93, 0.9], 1, 0, 0), CB.v(q.x - b[0] * 0.13, g1, q.z - b[1] * 0.13, [0.93, 0.93, 0.9], 1, 0, 0), CB.v(q.x + b[0] * 0.13, g1, q.z + b[1] * 0.13, [0.93, 0.93, 0.9], 1, 0, 0), CB.v(p.x + a[0] * 0.13, g0, p.z + a[1] * 0.13, [0.93, 0.93, 0.9], 1, 0, 0)); } }
      const sm = SB.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false }), MK); if (sm) sm.renderOrder = -1;
      KB.mesh(WK.material, MK); LB.mesh(WE.material, MK); CB.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }), MK);
      // on the strip between the circuit and the bend road (from their fork to where the bend road turns away) a row of red and white plastic
      // barriers down its middle, as by the garages (pushed aside by the car: js/newmap.js wallFlush, js/nvwalls.js)
      const r = H3.roads && H3.roads.bend; if (r) { const Q = H3.tyreQ || (H3.tyreQ = []), hw = r.wd / 2; let n = 0; Q.push(null);
        for (let u = 0; u <= 1; u += 0.7 / r.Lc) { const p = r.cv.getPointAt(u), t = r.cv.getTangentAt(u), nx = -t.z, nz = t.x, s = TL.dist(p.x + nx * hw, p.z + nz * hw, 30) < TL.dist(p.x - nx * hw, p.z - nz * hw, 30) ? 1 : -1;
          const ex = p.x + nx * s * hw, ez = p.z + nz * s * hw, g = TL.dist(ex, ez, 30) - w; if (g < 4.5 || g > 15) { if (n) Q.push(null); n = 0; continue; }
          Q.push([ex + nx * s * g / 2, ez + nz * s * g / 2, 0, 'plastic']); n++; out.fence = (out.fence || 0) + 1; }
        Q.push(null); } }
    return out;
  }
  return { build, kerbTex };
})();
