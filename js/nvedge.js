// NEW VERSION · TEST 1: the small circuit's edge as the user chose it in the pictures (version D, 19.–22. 10.): the tricolour kerb (green by the
// asphalt, cream, red) on both sides all round and the white edge line along it all round (beside a lot too); where another way runs onto the
// circuit (a road, a garage's lane) no kerb and the line dashed, 1.5 m on and 1.5 m off; where an inner road forks off, the kerb and the line run on
// round the fork's outer corner into the road's own (4a, 29. 10.); a dirt road crossing it leaves it as it is; no centre line. Toskana's own kerb
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
    for (const e of H3.net || []) if (e.kind === 'asph') ways.push({ id: e.id, P: e.P, hw: e.hw, bb: bbOf(e.P, e.hw + 4), fork: e.id === 'jump' || e.id === 'bend' });
    for (const r of H3.rr || []) if (r.style !== 'forest') { const P = r.P2.map(p => [p.x, p.z]); ways.push({ id: r.id, P, hw: r.wd / 2, bb: bbOf(P, r.wd / 2 + 4), fork: r.id === 'jump' || r.id === 'bend' }); }
    // (an inner road forking off the circuit starts on it: past its first point no asphalt of it, the circuit's kerb runs on there into the road's own)
    const wayD = (x, z, skip, noFork) => { let best = 1e9; for (const e of ways) { const b = e.bb; if (e.id === skip || (noFork && e.fork) || x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; const P = e.P;
      for (let k = 0; k < P.length - 1; k++) { const ax = P[k][0], az = P[k][1], vx = P[k + 1][0] - ax, vz = P[k + 1][1] - az, u0 = ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1);
        if (e.fork && ((k === 0 && u0 < 0) || (k === P.length - 2 && u0 > 1))) continue; const u = Math.max(0, Math.min(1, u0)), d = Math.hypot(ax + vx * u - x, az + vz * u - z) - e.hw; if (d < best) best = d; } } return best; };
    // the junctions along each side: another way's asphalt at the circuit's edge, then widened by the rounded corners' reach; short gaps closed
    // (MO: the same without the inner roads, for their forks' outer corners below)
    const at = (i, s, o) => [T.px[i] + T.nx[i] * s * o, T.pz[i] + T.nz[i] * s * o], K = Math.ceil(RB / ds), M = [0, 1].map(() => new Uint8Array(N)), MO = [0, 1].map(() => new Uint8Array(N));
    const spread = (raw, Mj) => { for (let i = 0; i < N; i++) if (raw[i]) for (let k = -K; k <= K; k++) Mj[(i + k + N) % N] = 1;
      for (let i = 0; i < N; i++) if (Mj[i] && !Mj[(i + 1) % N]) { let g = 1; while (g < 5 && !Mj[(i + 1 + g) % N]) g++; if (g < 5) for (let k = 1; k <= g; k++) Mj[(i + k) % N] = 1; } };
    for (const [j, s] of [[0, -1], [1, 1]]) { const raw = new Uint8Array(N), rawO = new Uint8Array(N);
      for (let i = 0; i < N; i++) for (const o of [0.6, 1.4]) { const [x, z] = at(i, s, w + o); if (wayD(x, z) < 0.3) { raw[i] = 1; if (wayD(x, z, null, true) < 0.3) rawO[i] = 1; } }
      spread(raw, M[j]); spread(rawO, MO[j]); }
    // where an inner road forks off the circuit (js/newmap.js raceRoad lead) its outer edge runs out of the circuit's edge in a plain corner: the circuit's
    // kerb runs up to that corner and round it into the road's own kerb, the solid line too (as in the pictures); the junction's mark starts there
    const TL = H3.TL, onT = (x, z, m) => TL.dist(x, z, 20) - w < m, JN = [];
    for (const id of ['jump', 'bend']) { const r = H3.roads && H3.roads[id]; if (!r || !TL || !r.ext) continue; const P2 = r.P2, nrm = r.nrm, n = P2.length - 1, hw = r.wd / 2, dr = r.Lc / n;
      for (const [k0, dk] of [[0, 1], [n, -1]]) for (const [jr, s] of [[0, -1], [1, 1]]) {
        const E = (i) => [P2[i].x + nrm[i][0] * s * (hw + r.ext[jr][i]), P2[i].z + nrm[i][1] * s * (hw + r.ext[jr][i])], D = (i) => { const [x, z] = E(i); return TL.dist(x, z, 20) - w; };
        if (D(k0) > -0.2) continue; let i = k0; while (i + dk >= 0 && i + dk <= n && Math.abs(i - k0) * dr < 14 && D(i + dk) <= 0) i += dk;
        const i1 = i + dk; if (i1 < 0 || i1 > n || D(i1) <= 0 || r.ext[jr][i1] > 0.05) continue;   // (on the circuit all along, or flared where it leaves it: the gore's side)
        const A = E(i), Bp = E(i1), da = D(i), db = D(i1), f = -da / (db - da), BX = A[0] + (Bp[0] - A[0]) * f, BZ = A[1] + (Bp[1] - A[1]) * f;
        const q = T.query(BX, BZ, -1, {}), a = ((q.a % N) + N) % N, a1 = (a + 1) % N, jc = q.d < 0 ? 0 : 1, tx = T.px[a1] - T.px[a], tz = T.pz[a1] - T.pz[a];
        const tB = Math.max(0, Math.min(1, ((BX - T.px[a]) * tx + (BZ - T.pz[a]) * tz) / (tx * tx + tz * tz || 1))), C = E(Math.max(0, Math.min(n, i1 + 3 * dk)));
        const cdir = (C[0] - BX) * tx + (C[1] - BZ) * tz > 0 ? -1 : 1;   // (the way along the circuit away from the road's asphalt: the circuit's own kerb there)
        JN.push({ id, jr, k0, dk, i, i1, B: [BX, BZ], jc, sc: jc ? 1 : -1, a, tB, tb: cdir > 0 ? 1 : 0, cdir }); } }
    for (const J of JN) { M[J.jc][J.a] = 1; for (let k = 1; k <= K + 3; k++) { const g = ((J.a + J.cdir * k) % N + N) % N; M[J.jc][g] = MO[J.jc][g]; } }
    for (const j of [0, 1]) for (let i = 0; i < N; i++) out.mouth += M[j][i]; out.joints = JN.length;
    const mouthAt = (x, z) => { const q = T.query(x, z, -1, {}), a = Math.abs(q.d); if (a < w - 0.7 || a > w + cw + KFD + 0.4) return false; return !!M[q.d < 0 ? 0 : 1][((q.a % N) + N) % N]; };
    // the inner roads' asphalt as laid (their flared edges too): Toskana's earth shoulder not over it (it lies under the circuit's level there)
    const FR = ['jump', 'bend'].map(id => H3.roads && H3.roads[id]).filter(r => r && r.ext).map(r => ({ r, n: r.P2.length - 1, hw: r.wd / 2, dr: r.Lc / (r.P2.length - 1), bb: bbOf(r.P2.map(p => [p.x, p.z]), r.wd / 2 + 9) }));
    const onFork = (x, z) => { for (const f of FR) { const b = f.bb; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; const P2 = f.r.P2; let bk = 0, bd = 1e18;
        for (let k = 0; k <= f.n; k++) { const d2 = (P2[k].x - x) ** 2 + (P2[k].z - z) ** 2; if (d2 < bd) { bd = d2; bk = k; } }
        const [nx, nz] = f.r.nrm[bk], dx = x - P2[bk].x, dz = z - P2[bk].z, lat = dx * nx + dz * nz, al = dx * nz - dz * nx;
        if ((bk === 0 && al < -f.dr / 2) || (bk === f.n && al > f.dr / 2)) continue; if (Math.abs(lat) < f.hw + f.r.ext[lat < 0 ? 0 : 1][bk] - 0.05) return true; } return false; };
    // Toskana's own kerb, edge line and earth shoulder cut at the junctions (the other way's asphalt, its rounded corners)
    MK.clearWorld((x, z, m) => m > 0 || mouthAt(x, z), -99, ['kerb', 'edgeline']); MK.clearWorld((x, z, m) => m > 0 || mouthAt(x, z), -99, ['shoulder']);
    // (the shoulder's triangles that reach onto a fork's asphalt at all, whatever their middle: the road's kerb and strip cover the notch beside it)
    root.traverse(o => { if (!o.isMesh || o.name !== 'shoulder' || !FR.length) return; const g = o.geometry, pa = g.attributes.position, ix = g.index, e = o.matrixWorld.elements; let ch = false;
      const wx = (i) => e[0] * pa.getX(i) + e[4] * pa.getY(i) + e[8] * pa.getZ(i) + e[12], wz = (i) => e[2] * pa.getX(i) + e[6] * pa.getY(i) + e[10] * pa.getZ(i) + e[14];
      for (let t = 0, nt = (ix ? ix.count : pa.count) / 3; t < nt; t++) { const v = [0, 1, 2].map(k => ix ? ix.getX(t * 3 + k) : t * 3 + k); if (v[1] === v[0] && v[2] === v[0]) continue; if (!v.some(i => onFork(wx(i), wz(i)))) continue; ch = true;
        if (ix) { ix.setX(t * 3 + 1, v[0]); ix.setX(t * 3 + 2, v[0]); } else for (const k of [1, 2]) pa.setXYZ(v[k], pa.getX(v[0]), pa.getY(v[0]), pa.getZ(v[0])); }
      if (ch) { if (ix) ix.needsUpdate = true; pa.needsUpdate = true; } });
    // Toskana's kerb where it is: the inside of the bends, the outside of the hairpins (its own rule, js/world.js kerbOn)
    const kerbW = (i, s) => { const j = (i + 1) % N; return !!(T.curb[i] && T.curb[j]) && !(s * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035); };
    const pAt = (i, t, s, o) => { const j = (i + 1) % N, x = T.px[i] + (T.px[j] - T.px[i]) * t, z = T.pz[i] + (T.pz[j] - T.pz[i]) * t; let nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; return [x + nx * s * o, z + nz * s * o, nx * s, nz * s]; };
    // the kerb added where the circuit had none: as Toskana's (its outer edge worn, faded softly into the ground; a run's first and last 2 m thinning out)
    // (not where it runs on round a fork's corner, below)
    { const B = MB(), W1 = [1, 1, 1], JF = new Set(JN.filter(J => J.cdir > 0).map(J => J.jc * N + (J.a + 1) % N)), JL = new Set(JN.filter(J => J.cdir < 0).map(J => J.jc * N + (J.a - 1 + N) % N));
      for (const [j, s] of [[0, -1], [1, 1]]) { const on = (i) => { i = ((i % N) + N) % N; return !kerbW(i, s) && !M[j][i]; };
        for (let i = 0; i < N; i++) { if (!on(i)) continue; let r0 = 0, r1 = 0; while (r0 < 3 && on(i - r0 - 1)) r0++; while (r1 < 3 && on(i + r1 + 1)) r1++; const first = !on(i - 1) && !JF.has(j * N + i), last = !on(i + 1) && !JL.has(j * N + i), rs = r0 + r1 + 1 > 4 ? 1 : 2;
          const sec = (t) => { const [x, z, nx, nz] = pAt(i, t, s, w), e = cw - wear(x + nx * cw, z + nz * cw), sh = 0.94 + 0.12 * kN[1](x * 1.7, z * 1.7), a = Math.min(first ? Math.min(1, t * rs) : 1, last ? Math.min(1, (1 - t) * rs) : 1), v = (i + t) * ds / 3;
            return [B.v(x, 0.045, z, W1, a, 0, v), B.v(x + nx * e, 0.085, z + nz * e, [sh, sh, sh], a, e / cw, v), B.v(x + nx * (e + KFD), 0.035, z + nz * (e + KFD), [sh, sh, sh], 0, e / cw, v)]; };
          const S = [sec(0), sec(0.5), sec(1)]; for (let h = 0; h < 2; h++) for (let c = 0; c < 2; c++) B.q(S[h][c], S[h][c + 1], S[h + 1][c + 1], S[h + 1][c]); out.kerb++; } }
      B.mesh(WK.material, MK); }
    // the edge line: added where Toskana's kerb is (it drew none there), dashed across the junctions (Toskana's own worn paint, its tile along the lap)
    { const lw = 0.22, MG = 0.09, PER = T.len / Math.max(1, Math.round(T.len / 32)), o0 = w - 0.12 - lw - MG, o1 = Math.min(w - 0.03, w - 0.12 + MG), u1 = (o1 - o0) / (lw + 2 * MG), wc = [0.93, 0.92, 0.94], B = MB();
      const piece = (i, t0, t1, s) => { const [xa, za, nxa, nza] = pAt(i, t0, s, 0), [xb, zb, nxb, nzb] = pAt(i, t1, s, 0), va = (i + t0) * ds / PER + (s > 0 ? 0 : 0.37), vb = (i + t1) * ds / PER + (s > 0 ? 0 : 0.37);
        B.q(B.v(xa + nxa * o0, 0.036, za + nza * o0, wc, 1, 0, va), B.v(xb + nxb * o0, 0.036, zb + nzb * o0, wc, 1, 0, vb), B.v(xb + nxb * o1, 0.036, zb + nzb * o1, wc, 1, u1, vb), B.v(xa + nxa * o1, 0.036, za + nza * o1, wc, 1, u1, va)); };
      const JS = new Map(JN.map(J => [J.jc * N + J.a, J]));
      for (const [j, s] of [[0, -1], [1, 1]]) for (let i = 0; i < N; i++) {
        if (!M[j][i]) { if (kerbW(i, s)) { piece(i, 0, 1, s); out.line++; } continue; }
        const J = JS.get(j * N + i); if (J) { piece(i, Math.min(J.tb, J.tB), Math.max(J.tb, J.tB), s); out.line++; }   // (solid up to a fork's corner, dashed on from it)
        const s0 = i * ds; for (let t = 0; t < 1 - 1e-6; t += 0.25) { if (J && (J.cdir > 0 ? t + 0.25 > J.tB : t < J.tB)) continue; const sm = s0 + (t + 0.125) * ds; if (sm % DASH < DASH / 2) { piece(i, t, t + 0.25, s); out.dash++; } } }
      B.mesh(WE.material, MK); }
    // the inner roads (the one that had the jump, the bend road; js/newmap.js raceRoad without their own lines, kerbs and dust) edged as the circuit: the
    // line, the kerb, a rust-red strip from the asphalt out to 2.2 m, a dashed centre line. Their mouths flare out in a rounded corner (raceRoad's
    // bellmouth) and the edge runs round it up to the other way's asphalt; across another way's mouth the line runs on dashed, along its own edge
    { const gr = H3.ground || (() => 0), KB = MB(), LB = MB(), SB = MB(), CB = MB(), W1 = [1, 1, 1], WC = [0.93, 0.92, 0.94], TR = [0.52, 0.35, 0.245];
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
          // (where it runs on from the circuit's kerb round a fork's corner, below: the kerb there at full strength, the strip still fading in)
          const JJ = JN.filter(J => J.id === id && J.jr === j); for (const J of JJ) { let q = J.i1; while (q >= 0 && q <= n && !ok[q] && Math.abs(q - J.i1) * dr < 8) q += J.dk; if (q >= 0 && q <= n && ok[q]) J.q0 = q; }
          const jq = new Set(JJ.filter(J => J.q0 != null).map(J => J.q0)), faK = (q) => Math.max(0, Math.min(1, jq.has(r0[q]) ? 1 : (S[q] - S[r0[q]]) / 2, jq.has(r1[q]) ? 1 : (S[r1[q]] - S[q]) / 2));
          for (let i = 0; i < n; i++) { if (!ok[i] || !ok[i + 1]) continue;
            const sec = (q) => { const [x, z] = E[q], [nx, nz] = N2[q], g = gr(x, z), e = cw - wear(x + nx * cw, z + nz * cw), sh = 0.94 + 0.12 * kN[1](x * 1.7, z * 1.7), a = fa(q), ak = faK(q), v = S[q] / 3, k = 0.96 + 0.06 * Math.sin(S[q] * 0.37 + s) * Math.sin(S[q] * 0.11 + 2);
              return { k: [KB.v(x, g + AS + 0.03, z, W1, ak, 0, v), KB.v(x + nx * e, g + AS + 0.06, z + nz * e, [sh, sh, sh], ak, e / cw, v), KB.v(x + nx * (e + KFD), g + 0.06, z + nz * (e + KFD), [sh, sh, sh], 0, e / cw, v)],
                s: [SB.v(x - nx * 0.05, g + AS - 0.01, z - nz * 0.05, TR.map(c => c * k), a, 0, 0), SB.v(x + nx * 1.9, g + 0.075, z + nz * 1.9, TR.map(c => c * k), a, 0, 0), SB.v(x + nx * 2.35, g + 0.07, z + nz * 2.35, TR.map(c => c * k), 0, 0, 0)] }; };   // (over the lot's edge beside it, js/nvbase.js)
            const A = sec(i), B = sec(i + 1); for (let c = 0; c < 2; c++) { KB.q(A.k[c], A.k[c + 1], B.k[c + 1], B.k[c]); SB.q(A.s[c], A.s[c + 1], B.s[c + 1], B.s[c]); } out[id]++; }
          // the line: solid along the free edge, dashed along the road's own edge across another way's mouth, none on the circuit
          const line = (e0, e1, n0, n1, v0, v1) => { const g0 = gr(e0[0], e0[1]) + AS + 0.012, g1 = gr(e1[0], e1[1]) + AS + 0.012, o0 = 0.12 + lw + MG, o1 = 0.03;
            LB.q(LB.v(e0[0] - n0[0] * o0, g0, e0[1] - n0[1] * o0, WC, 1, 0, v0), LB.v(e1[0] - n1[0] * o0, g1, e1[1] - n1[1] * o0, WC, 1, 0, v1), LB.v(e1[0] - n1[0] * o1, g1, e1[1] - n1[1] * o1, WC, 1, 1, v1), LB.v(e0[0] - n0[0] * o1, g0, e0[1] - n0[1] * o1, WC, 1, 1, v0)); };
          for (let i = 0; i < n; i++) { const sm = (i + 0.5) * dr, nn = [nrm[i][0] * s, nrm[i][1] * s], nn1 = [nrm[i + 1][0] * s, nrm[i + 1][1] * s];
            if (ok[i] && ok[i + 1]) line(E[i], E[i + 1], N2[i], N2[i + 1], S[i] / 32, S[i + 1] / 32);
            else if (!onT(En[i][0], En[i][1], 0.4) && !onT(En[i + 1][0], En[i + 1][1], 0.4) && sm % DASH < DASH / 2) line(En[i], En[i + 1], nn, nn1, i * dr / 32, (i + 1) * dr / 32); }
          // round a fork's outer corner: the kerb from the end of the circuit's (its step a, from tb to the corner B) along the road's edge to where the road's
          // own starts (q0), mitred at B; the heights going over from the circuit's to the road's; the line from B to q0 on the road's side
          for (const J of JJ) { if (J.q0 == null) continue; const P = [], mk = Math.max(1, Math.ceil(Math.abs(J.tB - J.tb) * ds / 0.5));
            for (let k = 0; k <= mk; k++) { const [x, z, nx, nz] = pAt(J.a, J.tb + (J.tB - J.tb) * k / mk, J.sc, w); P.push({ x, z, nx, nz, k: 1 }); }
            const L0 = P[P.length - 1], nr = N2[J.i1]; let mx = L0.nx + nr[0], mz = L0.nz + nr[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
            Object.assign(L0, { x: J.B[0], z: J.B[1], nx: mx, nz: mz, k: 1 / Math.max(0.6, mx * nr[0] + mz * nr[1]) });
            for (let q = J.i1; ; q += J.dk) { P.push({ x: E[q][0], z: E[q][1], nx: N2[q][0], nz: N2[q][1], k: 1, q }); if (q === J.q0) break; }
            const nB = P.indexOf(L0), dQ = Math.hypot(E[J.q0][0] - J.B[0], E[J.q0][1] - J.B[1]) || 1; let v = 0;
            const Ks = P.map((p, h) => { if (h) v += Math.hypot(p.x - P[h - 1].x, p.z - P[h - 1].z) / 3; const f = h <= nB ? 0 : Math.min(1, Math.hypot(p.x - J.B[0], p.z - J.B[1]) / dQ), g = gr(p.x, p.z), y = (c, r) => c + (r - c) * f;
              const e = cw - wear(p.x + p.nx * cw, p.z + p.nz * cw), sh = 0.94 + 0.12 * kN[1](p.x * 1.7, p.z * 1.7), m1 = e * p.k, m2 = (e + KFD) * p.k;
              return [KB.v(p.x, y(0.045, g + AS + 0.03), p.z, W1, 1, 0, v), KB.v(p.x + p.nx * m1, y(0.085, g + AS + 0.06), p.z + p.nz * m1, [sh, sh, sh], 1, e / cw, v), KB.v(p.x + p.nx * m2, y(0.035, g + 0.06), p.z + p.nz * m2, [sh, sh, sh], 0, e / cw, v)]; });
            for (let h = 0; h + 1 < Ks.length; h++) for (let c = 0; c < 2; c++) KB.q(Ks[h][c], Ks[h][c + 1], Ks[h + 1][c + 1], Ks[h + 1][c]);
            const Lp = P.slice(nB).map((p, h) => { const n2 = h ? [p.nx, p.nz] : nr, f = h ? Math.min(1, Math.hypot(p.x - J.B[0], p.z - J.B[1]) / dQ) : 0, g = gr(p.x, p.z) + AS + 0.012, y = 0.036 + (g - 0.036) * f, o0 = 0.12 + lw + MG, o1 = 0.03;
              return [LB.v(p.x - n2[0] * o0, y, p.z - n2[1] * o0, WC, 1, 0, 0), LB.v(p.x - n2[0] * o1, y, p.z - n2[1] * o1, WC, 1, 1, 0)]; });
            for (let h = 0; h + 1 < Lp.length; h++) LB.q(Lp[h][0], Lp[h + 1][0], Lp[h + 1][1], Lp[h][1]); out.forkCorner = (out.forkCorner || 0) + 1; } }
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
