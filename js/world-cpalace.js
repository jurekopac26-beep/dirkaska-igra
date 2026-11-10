/* =========================================================================
   WORLD — Crystal Palace, Anglija (theme 'cpalace'): its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), split out of it by
   tools/razdeli-proge.mjs (docs/razdelitev-prog.md) and loaded before it (index.html). What the builder, World and the other worlds use of them
   goes on World.api (API), its look (RB_LOOK.cpalace) on API.rbLook; World.ext.cpalace builds it with World.ext.rbring.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { Chunks, GB, ICO1, IChunks, NRC, NRT, TAU, addShore, box, clamp, cone, crH, cyl, gable, inPoly, lerp, mergeBands, nrDem, nrDist, nrGCol, nrGH, nrGround, nrLC, nrLCf, nrNear, nrShade, polyDist, puff, rng, rock, shoreBand, sstep, vary, waterMat, waterline } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  // Crystal Palace (theme 'cpalace', below): the banners (places only), the cells after them, the crowd of the 1930s
  const CP_BAN = [['LONDON', '#1d3a2c', '#efe4c4', '#b8913c'], ['START', '#1d3a2c', '#efe4c4', '#b8913c'], ['GRANDSTAND', '#3a2a1c', '#efe4c4', '#b8913c'],
    ['SYDENHAM', '#1d3a2c', '#efe4c4', '#b8913c'], ['NORWOOD', '#3a2a1c', '#efe4c4', '#b8913c'],
    ['MOTOR OIL', '#1d3a2c', '#efe4c4', '#efe4c4'], ['FINE TEA', '#7a1f1a', '#f3e6c2', '#f3e6c2'], ['TYRES', '#1b2440', '#f0e2b8', '#f0e2b8'], ['MOTOR SPIRIT', '#c79a2e', '#1b1a17', '#1b1a17'],
    ['GINGER BEER', '#245a3a', '#f3e9cc', '#f3e9cc'], ['SPARKING PLUGS', '#efe4c4', '#7a1f1a', '#7a1f1a'], ['BISCUITS', '#3a2a1c', '#f0d48a', '#f0d48a'], ['LEMONADE', '#f0d48a', '#1d3a2c', '#1d3a2c']];   // (the place names; then the period hoardings, made up: what they sell, no brands)
  const CP_AT = { num: 0, brake: 0, ban: 3, rbr: 4, spielberg: 3, ads: 8 };
  const CP_SHIRTS = [[0.22, 0.22, 0.24], [0.3, 0.26, 0.2], [0.45, 0.4, 0.32], [0.16, 0.18, 0.26], [0.55, 0.5, 0.42], [0.36, 0.36, 0.38], [0.86, 0.84, 0.78], [0.4, 0.3, 0.24],
    [0.25, 0.3, 0.24], [0.6, 0.55, 0.45], [0.2, 0.2, 0.2], [0.5, 0.2, 0.18]];   // the crowd of the 1930s: dark coats and suits, tweed, grey flannel, a few light summer dresses
  /* ================= CRYSTAL PALACE (theme 'cpalace'): the park circuit of 1937 on the Red Bull Ring's builder, in its period look =================
     buildRbring with RB_LOOK.cpalace: straw bales round the outside of the corners and timber post-and-rail fences elsewhere (no armco,
     concrete or tyres), period hoardings, a row of timber pits on the Stadium Straight instead of the pit building and the paddock, a flag
     start (no gantry, no lights), the park's own trees; no TV towers, video walls, number or braking boards, jets, farms, camps or car parks.
     cpPrep reads def.cp before the terrain is built: the lakes are dug into the ground and the two terrace walls of the old palace cut into it
     (NR.pad: the lawn below a wall at its foot, above it level with its top); a lake by the road is lowered under the road and the ground
     the road pulls down beside it, and its bed is not dug under the verge (the water never over the road or the grass by it). cpPark builds
     the park: the lakes' water, the sculptures of 1854 on the islands and the shore of the lake (simplified figures), the terrace walls with
     their balustrades, the central steps, the sphinxes, a lattice mast on the hill (generic), the houses round the park; cpTrees the old
     trees (planes, oaks, horse chestnuts). */
  let CPK = null;   // per build: the lakes and the terrace walls (cpPrep)
  function cpPrep(P) {
    const C = T.def.cp, pr = (a) => { const o = []; for (let k = 0; k < a.length; k += 2) o.push([a[k], a[k + 1]]); return o; };
    const bb = (poly, m) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0 - m, x1 + m, z0 - m, z1 + m]; };
    const lakes = C.lakes.map(([lvl, outer, ...holes]) => { const poly = pr(outer); return { lvl, poly, holes: holes.map(pr), b: bb(poly, 2) }; });
    const lakeAt = (x, z) => { for (const L of lakes) { const b = L.b; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; if (inPoly(L.poly, x, z) && !L.holes.some(h => inPoly(h, x, z))) return L; } return null; };
    const shore = (L, x, z) => { let d = polyDist(L.poly, x, z); for (const h of L.holes) d = Math.min(d, polyDist(h, x, z)); return d; };
    // the terrace walls, every 4 m: the unit normal towards the upper side, the raw ground's two levels 7 m either side (smoothed along the wall)
    const walls = C.terr.map(([hgt, ...a]) => {
      const raw = pr(a), pts = [];
      for (let k = 0; k + 1 < raw.length; k++) { const [x0, z0] = raw[k], [x1, z1] = raw[k + 1], l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 4));
        for (let j = 0; j < n || (k === raw.length - 2 && j === n); j++) pts.push([x0 + (x1 - x0) * j / n, z0 + (z1 - z0) * j / n]); }
      const W = pts.map(([x, z], k) => { const a0 = pts[Math.max(0, k - 1)], a1 = pts[Math.min(pts.length - 1, k + 1)], tx = a1[0] - a0[0], tz = a1[1] - a0[1], tl = Math.hypot(tx, tz) || 1;
        return { x, z, tx: tx / tl, tz: tz / tl, nx: -tz / tl, nz: tx / tl }; });
      const up = W.reduce((s, p) => s + nrDem(p.x + p.nx * 8, p.z + p.nz * 8) - nrDem(p.x - p.nx * 8, p.z - p.nz * 8), 0) > 0 ? 1 : -1;
      for (const p of W) { p.nx *= up; p.nz *= up; p.lo0 = nrDem(p.x - p.nx * 7, p.z - p.nz * 7); p.hi0 = nrDem(p.x + p.nx * 7, p.z + p.nz * 7); }
      W.forEach((p, k) => { let lo = 0, hi = 0, n = 0; for (let e = -3; e <= 3; e++) { const q = W[clamp(k + e, 0, W.length - 1)]; lo += q.lo0; hi += q.hi0; n++; } p.lo = lo / n; p.hi = Math.max(hi / n, p.lo + hgt * 0.8); });
      return { W, b: bb(pts, 28) };
    });
    const wallAt = (x, z) => {   // the nearest wall point within 26 m: [point, signed distance (+ upper side), how far past its ends]
      let best = null, bd = 26;
      for (const L of walls) { const b = L.b; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
        for (let k = 0; k < L.W.length; k++) { const p = L.W[k], dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); if (d < bd) { bd = d; best = [p, dx * p.nx + dz * p.nz, k === 0 || k === L.W.length - 1 ? Math.abs(dx * p.tx + dz * p.tz) : 0]; } } }
      return best;
    };
    // the road beside each lake (L.rd: its samples) and how far past the road's barrier a point is (bey: 1e9 with none)
    for (const L of lakes) { const b = L.b; L.rd = []; for (let i = 0; i < T.N; i++) if (T.px[i] > b[0] - 70 && T.px[i] < b[1] + 70 && T.pz[i] > b[2] - 70 && T.pz[i] < b[3] + 70) L.rd.push(i); }
    const bey = (L, x, z) => { let e = 1e9; for (const i of L.rd) { const dx = x - T.px[i], dz = z - T.pz[i]; e = Math.min(e, Math.hypot(dx, dz) - (dx * T.nx[i] + dz * T.nz[i] > 0 ? T.br[i] : T.bl[i])); } return Math.max(0, e); };
    const p0 = P.pad;
    P.pad = (x, z, h) => {
      h = p0(x, z, h);
      const L = lakeAt(x, z); if (L) { const e = bey(L, x, z);   // the lake's bed: shallow at the shore; by the road the land kept under the verge (rbVerge: to 3.2 m past the barrier), all of the bed from 6.5 m
        return Math.min(h, lerp(h, L.lvl - 0.25 - Math.min(1.8, Math.min(shore(L, x, z), Math.max(0, e - 3.2)) * 0.3), sstep(3.2, 6.5, e))); }
      const w = wallAt(x, z); if (w) { const [p, d, past] = w, lo = d < 9, f = (lo ? sstep(-20, -10, d) : sstep(26, 18, d)) * sstep(8, 0, past); if (f > 0) h = lerp(h, lo ? p.lo : p.hi, f); }   // the lower lawn up to the wall, the upper one from 9 m behind it (the terrain's 8 m cells slope across there, under the upper lawn's edge cpPark lays)
      return h;
    };
    // the water never above the road or the ground the road pulls down beside it (nrH: the terrain follows the road out to ~40 m): a lake by the
    // road lowered 0.55 m under the edges of the road near it (the verge's outer end is 0.4 m under them: rbVerge) and 0.15 m under that ground
    // within reach of its shore band (~9 m onto the land: shoreBand; cpPark's band follows the true waterline) or left undug in it
    const G = P.G, NB = 14;
    for (const L of lakes) {
      let lv = L.lvl;
      for (const i of L.rd) { const x = T.px[i], z = T.pz[i];
        if (lakeAt(x, z) !== L && shore(L, x, z) > Math.max(T.br[i], T.bl[i]) + 3.2 + NB) continue;
        for (const o of [T.br[i], -T.bl[i]]) lv = Math.min(lv, nrNear(x + T.nx[i] * o, z + T.nz[i] * o).hn - 0.55); }
      const [x0, x1, z0, z1] = L.b;
      for (let j = Math.max(0, Math.floor((z0 - NB - G.z0) / NRC)); j <= Math.min(G.nz - 1, Math.ceil((z1 + NB - G.z0) / NRC)); j++)
        for (let i = Math.max(0, Math.floor((x0 - NB - G.x0) / NRC)); i <= Math.min(G.nx - 1, Math.ceil((x1 + NB - G.x0) / NRC)); i++) {
          const x = G.x0 + i * NRC, z = G.z0 + j * NRC, M = lakeAt(x, z);
          if ((M && bey(M, x, z) > 3.2) || (M !== L && shore(L, x, z) > NB)) continue;   // (a dug bed: its height follows the level; the land out of reach)
          const h = nrGH(i, j); if (G.dd[j * G.nx + i] < 40) lv = Math.min(lv, h - 0.15);
        }
      L.lvl = lv;
    }
    return (CPK = { lakes, lakeAt, walls });
  }
  // a soft blob (an icosahedron with radii rx along its yaw, ry up, rz across; smooth normals), the sculptures' and the sphinxes' bodies
  function cpBlob(g, cx, cy, cz, rx, ry, rz, yaw, col, k0) {
    const c = Math.cos(yaw), s = Math.sin(yaw), V = ICO1.V, P = V.map(v => [cx + v[0] * rx * c - v[2] * rz * s, cy + v[1] * ry, cz + v[0] * rx * s + v[2] * rz * c]);
    const Nn = V.map(v => { const x = v[0] / rx, y = v[1] / ry, z = v[2] / rz, wx = x * c - z * s, wz = x * s + z * c, l = Math.hypot(wx, y, wz) || 1; return [wx / l, y / l, wz / l]; });
    const C = V.map(v => { const k = (k0 || 0.8) + 0.3 * (v[1] * 0.5 + 0.5); return [col[0] * k, col[1] * k, col[2] * k]; });
    for (const [a, b, d] of ICO1.F) g.triON(P[a], P[b], P[d], Nn[a], Nn[b], Nn[d], [cx, cy, cz], C[a], C[b], C[d]);
  }
  // one of the sculptures by the lake (local frame: +x the way it faces), simplified: 0 a great land saurian on four legs, 1 a sea reptile
  // lying at the water's edge, 2 a squat amphibian, 3 a mammal (a great deer with its antlers), 4 a pterosaur with its wings spread on a rock
  function cpSculpture(g, x, y, z, kind, yaw, col) {
    const c = Math.cos(yaw), s = Math.sin(yaw), at = (a, b) => [x + a * c - b * s, z + a * s + b * c];
    const B = (a, h, b, rx, ry, rz, cl, yw) => { const [px, pz] = at(a, b); cpBlob(g, px, y + h, pz, rx, ry, rz, yaw + (yw || 0), cl || col); };
    const leg = (a, b, h, r) => { const [px, pz] = at(a, b); cyl(g, px, y - 0.2, pz, r, h + 0.2, 6, col, null, r * 0.8); };
    if (kind === 0) {
      B(0, 2.2, 0, 3.1, 1.35, 1.25); B(3.0, 2.9, 0, 1.0, 0.7, 0.6, null, -0.2); B(4.0, 3.2, 0, 0.8, 0.45, 0.42);   // body, neck, head
      B(-3.4, 1.9, 0, 1.6, 0.55, 0.5, null, 0.15); B(-5.6, 1.1, 0.3, 1.2, 0.3, 0.3, null, 0.4);   // the tail, down to the ground
      for (const [a, b] of [[1.6, 0.85], [1.6, -0.85], [-1.6, 0.9], [-1.6, -0.9]]) leg(a, b, 1.4, 0.38);
      const [hx, hz] = at(4.7, 0); cone(g, hx, y + 3.4, hz, 0.12, 0.45, 4, col, null, 0);   // the horn on the nose (as it was thought in 1854)
    } else if (kind === 1) {
      B(0, 0.55, 0, 2.6, 0.6, 0.8); B(2.9, 0.75, 0, 1.0, 0.4, 0.4, null, 0.1); B(3.9, 0.85, 0, 0.7, 0.32, 0.28);   // body, neck, the long jaws
      B(-2.6, 0.45, 0, 1.6, 0.3, 0.32, null, -0.2);
      for (const [a, b] of [[1.1, 1.0], [1.1, -1.0], [-1.0, 0.9], [-1.0, -0.9]]) { const [px, pz] = at(a, b); cpBlob(g, px, y + 0.25, pz, 0.7, 0.08, 0.3, yaw + (b > 0 ? 0.6 : -0.6), col); }   // flippers
    } else if (kind === 2) {
      B(0, 0.75, 0, 1.3, 0.7, 1.0); B(1.3, 0.85, 0, 0.6, 0.38, 0.62);   // a toad-like body, the broad head
      for (const [a, b] of [[0.7, 0.9], [0.7, -0.9], [-0.6, 0.9], [-0.6, -0.9]]) leg(a, b, 0.45, 0.2);
    } else if (kind === 3) {
      B(0, 1.75, 0, 1.25, 0.55, 0.45); B(1.3, 2.4, 0, 0.45, 0.28, 0.24, null, -0.9); B(1.75, 2.85, 0, 0.42, 0.2, 0.18);   // body, neck, head
      for (const [a, b] of [[0.8, 0.3], [0.8, -0.3], [-0.85, 0.3], [-0.85, -0.3]]) leg(a, b, 1.35, 0.11);
      for (const sd of [-1, 1]) { const [px, pz] = at(1.6, sd * 0.85); box(g, px, y + 3.0, pz, 0.6, 0.12, 1.5, yaw + sd * 0.35, col); }   // the great antlers
    } else {
      rock(g, x, y + 0.4, z, 1.4, 1.0, 1.2, yaw, [0.48, 0.47, 0.44], rng(Math.round(x * 7 + z)), 0.2);
      B(0, 1.5, 0, 0.6, 0.3, 0.3); B(0.65, 1.75, 0, 0.45, 0.15, 0.14);
      for (const sd of [-1, 1]) { const [ax, az] = at(0, sd * 0.2), [bx, bz] = at(-0.3, sd * 2.4), [cx2, cz2] = at(0.5, sd * 1.6), P0 = [ax, y + 1.55, az], P1 = [bx, y + 2.0, bz], P2 = [cx2, y + 1.7, cz2];
        g.triO(P0, P1, P2, col, [ax, y + 0.5, az]); g.triO(P0, P2, P1, col, [ax, y + 3, az]); }   // the wings, spread
    }
  }
  function cpSphinx(g, x, y, z, yaw) {   // a sphinx couchant on its plinth (the terraces': lions' bodies, headdresses), facing +x
    const st = [0.8, 0.77, 0.7], c = Math.cos(yaw), s = Math.sin(yaw), at = (a) => [x + a * c, z + a * s];
    box(g, x, y - 0.3, z, 3.4, 1.5, 1.5, yaw, [0.74, 0.71, 0.64], [0.82, 0.79, 0.72]);
    const y1 = y + 1.2; cpBlob(g, x - 0.2 * c, y1 + 0.5, z - 0.2 * s, 1.25, 0.45, 0.5, yaw, st);
    { const [px, pz] = at(1.05); box(g, px, y1, pz, 1.3, 0.25, 0.75, yaw, st); }   // the forepaws
    { const [px, pz] = at(0.95); cpBlob(g, px, y1 + 1.1, pz, 0.32, 0.42, 0.34, yaw, st); box(g, px - 0.1 * c, y1 + 0.85, pz - 0.1 * s, 0.4, 0.7, 0.8, yaw, st); }   // the head, the headdress's lappets
  }
  // the park: water, sculptures, terraces, sphinxes, the mast, the houses (K: buildRbring's helpers)
  function cpPark(K) {
    const { root, tex, scen, exclPush, CR, out } = K, C = T.def.cp, P = CPK, pr = (a) => { const o = []; for (let k = 0; k < a.length; k += 2) o.push([a[k], a[k + 1]]); return o; };
    const st = { lakes: 0, sculptures: 0, sphinxes: 0, walls: 0, houses: 0 };
    // the lakes: flat water at their levels (the islands left out)
    { const gw = new GB(true), wc = [1, 1, 1];
      for (const L of P.lakes) {
        const V = (p) => new THREE.Vector2(p[0], p[1]), con = L.poly.map(V), hs = L.holes.map(h => h.map(V)), all = [...L.poly, ...[].concat(...L.holes)];
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(con, hs)) { const A = all[a], B = all[b], Cc = all[c], Q = (p) => [p[0], L.lvl, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
          gw.triO(Q(A), Q(B), Q(Cc), wc, [A[0], L.lvl - 5, A[1]], wc, wc, uv(A), uv(B), uv(Cc)); }
        for (const [x, z] of L.poly) exclPush(x, z, 2); st.lakes++;
      }
      const WO = { len: 0.9, amp: 0.6, refl: 0.5, land: 0.75, shal: 0.5, lap: 0.5, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x4f6b58 }, WO)));
      wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm); out.dyn.water = tex.water;
      const G = API.NR.G, bands = P.lakes.map(L => { const b = L.b, gi = (v, o, n) => clamp(Math.floor((v - o) / NRC), 0, n - 1);
        const wl = waterline(nrGH, G.x0, G.z0, NRC, gi(b[0] - 14, G.x0, G.nx), gi(b[1] + 22, G.x0, G.nx), gi(b[2] - 14, G.z0, G.nz), gi(b[3] + 22, G.z0, G.nz), L.lvl);   // (where the terrain meets the water)
        const sd = (x, z) => { let d = polyDist(L.poly, x, z); for (const h of L.holes) d = Math.min(d, polyDist(h, x, z)); return Math.min(inPoly(L.poly, x, z) && !L.holes.some(h => inPoly(h, x, z)) ? d : -d, wl(x, z)); };
        return shoreBand(b[0] - 6, b[2] - 6, b[1] + 6, b[3] + 6, L.lvl + 0.015, sd, 16); });
      addShore(root, mergeBands(bands), wm.material, WO); }   // (the shore band round every lake and the islands: the shallows, the foam at the waterline)
    // the sculptures (1854): painted stone, each facing the open water (the lake's middle)
    { const SC = [[0.44, 0.47, 0.38], [0.47, 0.44, 0.38], [0.52, 0.47, 0.37], [0.56, 0.45, 0.32], [0.42, 0.4, 0.37]];
      for (const [x, z, kind] of C.dinos) {
        let L = null, bd = 1e9; for (const Lk of P.lakes) { const d = polyDist(Lk.poly, x, z); if (d < bd) { bd = d; L = Lk; } }
        let mx = 0, mz = 0; for (const [a, b] of L.poly) { mx += a; mz += b; } mx /= L.poly.length; mz /= L.poly.length;
        const yaw = Math.atan2(mz - z, mx - x) + (crH(x, z, 3) - 0.5) * 1.2, y = Math.max(nrGround(x, z), L.lvl + 0.05);
        cpSculpture(scen.get(x, z), x, y, z, kind, yaw, vary(SC[kind], () => crH(x, z, 4), 0.12)); exclPush(x, z, kind === 0 ? 6 : 3); st.sculptures++; } }
    // the terrace walls: a dressed stone face from the lower lawn to the upper one, a coping, a balustrade (balusters every 0.9 m, piers every
    // 9 m), the upper lawn's edge laid over the cut (its vertex colours the ground's)
    { const sto = [0.8, 0.76, 0.67], stoD = [0.66, 0.62, 0.55], cop = [0.86, 0.83, 0.76], gTop = new GB(true);
      for (const L of P.walls) {
        const W = L.W;
        for (let k = 0; k + 1 < W.length; k++) {
          const a = W[k], b = W[k + 1], g = scen.get(a.x, a.z), lo = Math.min(a.lo, b.lo) - 0.6, ha = a.hi + 0.12, hb = b.hi + 0.12, inn = [(a.x + b.x) / 2 + a.nx * 3, (ha + hb) / 2 - 1, (a.z + b.z) / 2 + a.nz * 3];
          g.quadO([a.x, lo, a.z], [b.x, lo, b.z], [b.x, hb, b.z], [a.x, ha, a.z], k % 2 ? sto : stoD, inn);   // the face
          g.quadO([a.x - a.nx * 0.25, ha + 0.25, a.z - a.nz * 0.25], [b.x - b.nx * 0.25, hb + 0.25, b.z - b.nz * 0.25], [b.x + b.nx * 0.5, hb + 0.25, b.z + b.nz * 0.5], [a.x + a.nx * 0.5, ha + 0.25, a.z + a.nz * 0.5], cop, [a.x, ha - 2, a.z]);   // the coping
          g.quadO([a.x - a.nx * 0.25, ha, a.z - a.nz * 0.25], [b.x - b.nx * 0.25, hb, b.z - b.nz * 0.25], [b.x - b.nx * 0.25, hb + 0.25, b.z - b.nz * 0.25], [a.x - a.nx * 0.25, ha + 0.25, a.z - a.nz * 0.25], cop, inn);
          const ra = ha + 0.25, rb = hb + 0.25, ox = 0.12;   // the balustrade: its rail, the balusters under it
          g.quadO([a.x + a.nx * ox, ra + 0.85, a.z + a.nz * ox], [b.x + b.nx * ox, rb + 0.85, b.z + b.nz * ox], [b.x + b.nx * ox, rb + 1.0, b.z + b.nz * ox], [a.x + a.nx * ox, ra + 1.0, a.z + a.nz * ox], cop, inn);
          g.quadO([a.x - a.nx * 0.12, ra + 1.0, a.z - a.nz * 0.12], [b.x - b.nx * 0.12, rb + 1.0, b.z - b.nz * 0.12], [b.x + b.nx * 0.36, rb + 1.0, b.z + b.nz * 0.36], [a.x + a.nx * 0.36, ra + 1.0, a.z + a.nz * 0.36], cop, [a.x, ra - 3, a.z]);
          const sl = Math.hypot(b.x - a.x, b.z - a.z), yw = Math.atan2(b.z - a.z, b.x - a.x);
          for (let d = 0.45; d < sl; d += 0.9) { const f = d / sl, px = lerp(a.x, b.x, f) + a.nx * ox, pz = lerp(a.z, b.z, f) + a.nz * ox; cyl(g, px, lerp(ra, rb, f), pz, 0.09, 0.86, 4, sto, null, 0.06); }
          if (k % 2 === 0) box(g, a.x + a.nx * ox, ra - 0.1, a.z + a.nz * ox, 0.5, 1.3, 0.5, yw, stoD, cop);   // a pier every 8 m
          const T0 = (p, o) => { const x = p.x + p.nx * o, z = p.z + p.nz * o; return [x, p.hi + 0.06, z]; }, gc = (q) => nrGCol(q[0], q[2]);   // the upper lawn over the cut, out to 21 m
          const q = [T0(a, 0.3), T0(b, 0.3), T0(b, 21), T0(a, 21)]; gTop.quadUp(q[0], q[1], q[2], q[3], q.map(gc), q.map(p => [p[0] / 14, -p[2] / 14]));
          exclPush((a.x + b.x) / 2, (a.z + b.z) / 2, 6); CR.exclAdd((a.x + b.x) / 2 - a.nx * 1.5, (a.z + b.z) / 2 - a.nz * 1.5, 2.5);
        }
        st.walls++;
      }
      K.gTop = gTop;   // (buildRbring adds it with the terrain's material)
      // the central steps: flights from the upper lawn down to the lower one, in front of the wall
      for (const [x0, z0, x1, z1] of C.steps) {
        let wp = null, bd = 1e9; for (const L of P.walls) for (const p of L.W) { const d = Math.hypot(p.x - (x0 + x1) / 2, p.z - (z0 + z1) / 2); if (d < bd) { bd = d; wp = p; } }
        if (!wp || bd > 30) continue;
        const n = Math.max(4, Math.round((wp.hi - wp.lo) / 0.17)), yaw = Math.atan2(wp.tz, wp.tx), g = scen.get(wp.x, wp.z);
        for (let k = 0; k < n; k++) { const o = 0.3 + k * 0.36, h = wp.hi + 0.12 - (k + 1) * (wp.hi + 0.12 - wp.lo) / n; box(g, wp.x - wp.nx * o, wp.lo - 0.4, wp.z - wp.nz * o, 9, h - wp.lo + 0.4, 0.38, yaw, k % 2 ? [0.82, 0.79, 0.72] : [0.78, 0.75, 0.68], [0.86, 0.83, 0.76]); }
        exclPush(wp.x - wp.nx * 3, wp.z - wp.nz * 3, 7); CR.exclAdd(wp.x - wp.nx * 3, wp.z - wp.nz * 3, 6);
      }
    }
    // the sphinxes (six on the terraces), looking out over the park
    for (const [x, z] of C.sphinx) { let wp = null, bd = 1e9; for (const L of P.walls) for (const p of L.W) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; wp = p; } }
      const yaw = wp ? Math.atan2(-wp.nz, -wp.nx) : 0; cpSphinx(scen.get(x, z), x, nrGround(x, z), z, yaw); exclPush(x, z, 4); CR.exclAdd(x, z, 3); st.sphinxes++; }
    // the lattice mast on the top of the hill (a generic one: four legs tapering to the top, braced in diamonds, a red light on top)
    { const [MX, MZ] = C.tower, Y0 = nrGround(MX, MZ), H = 220, g = new GB(), stl = [0.6, 0.61, 0.63], stlD = [0.48, 0.49, 0.52], mx = 0, mz = 0, y0 = 0;   // (built round its foot: cpMastStep moves it)
      const half = (h) => lerp(17, 1.8, Math.pow(h / H, 0.7)), lev = []; for (let h = 0; h <= H + 0.1; h += 14) lev.push(h);
      const cn = (h, k) => { const r = half(h), a = [[-1, -1], [1, -1], [1, 1], [-1, 1]][k]; return [mx + a[0] * r, y0 + h, mz + a[1] * r]; };
      const bar = (p, q, r, col) => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz), ux = -dz, uz = dx, ul = Math.hypot(ux, uz) || 1, ox = ux / ul * r, oz = uz / ul * r;
        g.quadO([p[0] - ox, p[1], p[2] - oz], [q[0] - ox, q[1], q[2] - oz], [q[0] + ox, q[1], q[2] + oz], [p[0] + ox, p[1], p[2] + oz], col, [mx, (p[1] + q[1]) / 2, mz]); };   // (one face: the material is double sided)
      for (let j = 0; j + 1 < lev.length; j++) for (let k = 0; k < 4; k++) { const a = cn(lev[j], k), b = cn(lev[j + 1], k), c2 = cn(lev[j], (k + 1) % 4), d2 = cn(lev[j + 1], (k + 1) % 4);
        bar(a, b, 1.5, stlD); bar(a, d2, 0.6, stl); bar(c2, b, 0.6, stl); bar(b, d2, 0.5, stl); }
      cyl(g, mx, y0 + H, mz, 0.6, 18, 6, stl, [0.9, 0.12, 0.1], 0.25);
      const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }), m = new THREE.Mesh(g.geometry(), mat); m.castShadow = false; m.receiveShadow = false; m.position.set(MX, Y0, MZ); root.add(m);
      out.dyn.cpMast = { m, mat, x: MX, y: Y0, z: MZ, base: new THREE.Color(1, 1, 1) };
      exclPush(MX, MZ, 22); }
    // the houses round the park (their outlines as boxes): London stock brick or red brick under slate, flat roofs on the big blocks
    { const hc = new Chunks(384), BR = [[0.72, 0.64, 0.5], [0.66, 0.58, 0.46], [0.6, 0.38, 0.29], [0.76, 0.72, 0.64]], SL = [0.3, 0.31, 0.34], H = C.houses;
      for (let k = 0; k < H.length; k += 6) {
        const x = H[k], z = H[k + 1], Lh = H[k + 2], Wh = H[k + 3], a = H[k + 4] * Math.PI / 180, hh = H[k + 5], g = hc.get(x, z), c = Math.cos(a), s = Math.sin(a);
        let y = 1e9; for (const [p, q] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) y = Math.min(y, nrGround(x + c * Lh / 2 * p - s * Wh / 2 * q, z + s * Lh / 2 * p + c * Wh / 2 * q));
        const col = BR[Math.floor(crH(x, z, 1) * BR.length)], flat = Lh * Wh > 420 || Wh > 16, wallH = flat ? hh : Math.max(5.5, hh - 2.6);
        box(g, x, y - 0.5, z, Lh, wallH + 0.5, Wh, a, col, flat ? [0.42, 0.42, 0.42] : null, true);
        if (!flat) gable(g, x, y + wallH, z, Lh + 0.4, Wh + 0.6, Math.min(4, Wh * 0.4), a, SL, col);
        exclPush(x, z, Math.hypot(Lh, Wh) / 2 + 2); st.houses++;
      }
      hc.addTo(root, K.matV, false, true); }
    return st;
  }
  // the park's trees: the old trees of OpenStreetMap (planes, oaks and horse chestnuts), the woods of the land cover filled in, lone trees on
  // the lawns; not on the road, the lakes, the terraces, nor the pit straight's level ground (P.pad)
  // the mast is far from most of the circuit, beyond what the camera draws (out.farClip: the fog's far edge): then it is drawn just inside that
  // edge, shrunk towards the camera by the same factor (the same size and place in the picture: nearer things still hide it), without the
  // fog but faded into its colour with the distance (a tall landmark in the haze)
  function cpMastStep(M, cam, fog) {
    if (!cam) { M.m.position.set(M.x, M.y, M.z); M.m.scale.setScalar(1); M.mat.color.copy(M.base); return; }   // (no camera: on its own place, as built: the world test's pose)
    const p = cam.position, vx = M.x - p.x, vy = M.y - p.y, vz = M.z - p.z, D = Math.hypot(vx, vy, vz), L = cam.far * 0.95, k = D > L ? L / D : 1;
    M.m.position.set(p.x + vx * k, p.y + vy * k, p.z + vz * k); M.m.scale.setScalar(k);
    M.mat.color.copy(M.base); if (fog) M.mat.color.lerp(fog.color, clamp((D - 150) / 900, 0, 0.62));
  }
  function cpTreeGeo(kind) {   // unit trees (height 1): 0 a plane or an oak (a tall trunk, a broad crown of soft clumps), 1 a horse chestnut (a dense dark dome); 2, 3 the cheaper far ones
    const g = new GB(), R = rng(820 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const pl = [0.34, 0.5, 0.21], ch = [0.26, 0.42, 0.17], bk = [0.4, 0.36, 0.3];   // (the fresh greens of spring; the bark a dark grey-brown, not a pale post from above)
    if (kind === 0) { cyl(g, 0, -0.02, 0, 0.03, 0.36, 5, bk, null, 0.02);   // a broad old crown from a third of the height up, in clumps of their own greens (lighter and yellower to the sun, darker and bluer on the shaded side)
      for (const [x, y, z, r, t] of [[0, 0.58, 0, 0.34, 0], [0.22, 0.5, 0.12, 0.2, 0.05], [-0.2, 0.52, -0.12, 0.21, -0.05], [0.04, 0.8, -0.06, 0.19, 0.06]])
        puff(g, x, y, z, r, 0.82, [pl[0] * (1 + t * 1.2), pl[1] * (1 + t * 0.4), pl[2] * (1 - t)], R, t === 0 ? 0.12 : 0.22, 0.56, 1.06, t === 0); }   // (the middle clump subdivided: a rounder crown)
    else if (kind === 1) { cyl(g, 0, -0.02, 0, 0.04, 0.32, 5, [0.36, 0.3, 0.24], null, 0.03); puff(g, 0, 0.58, 0, 0.36, 0.95, ch, R, 0.2, 0.55, 1.05, true); }
    else { cyl(g, 0, -0.02, 0, 0.03, 0.36, 4, bk, null, 0.02); puff(g, 0, 0.6, 0, 0.36, 0.86, [0.3, 0.46, 0.2], R, 0.2, 0.58, 1.08); }   // (far: one lump)
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function cpTrees(K) {
    const { root, R, excluded, dens } = K, P = API.NR, G = P.G, C = T.def.cp, tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const nk = new IChunks(cpTreeGeo(0), tMat, 200), fg = new IChunks(cpTreeGeo(2), tMat, 320), tk = [nk, nk], tf = [fg, fg];   // (one shape near the road, one cheaper far out: the planes and the chestnuts by their colours and proportions)
    const terr = (x, z) => { for (const L of CPK.walls) { const b = L.b; if (x < b[0] - 140 || x > b[1] + 20 || z < b[2] || z > b[3]) continue; for (const p of L.W) if (Math.hypot(x - p.x, z - p.z) < 26) return true; } return false; };   // (the open lawns of the terraces)
    let n = 0;
    const put = (x, z, sp, hgt, wid) => {
      const rd = nrDist(x, z); if (rd > 300) return;
      if (rd < 48) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3.0) return; if (nn.i >= 0 && nn.dd < 7 && crH(x, z, 9) < 0.35) return; }
      if (excluded(x, z) || CPK.lakeAt(x, z) || P.pad(x, z, 0) !== 0 || terr(x, z)) return;
      const far = rd > 80, cv = 0.86 + crH(x, z, 2) * 0.28; (far ? tf : tk)[sp].add(x, nrGround(x, z) - 0.1, z, crH(x, z, 3) * TAU, wid, hgt, [cv * (0.95 + crH(x, z, 4) * 0.1), cv, cv * (0.94 + crH(x, z, 5) * 0.1)]);
      nrShade(x, z, wid * 0.33, 1); n++;
    };
    for (let k = 0; k < C.trees.length; k += 2) { const x = C.trees[k], z = C.trees[k + 1], sp = crH(x, z, 1) < 0.62 ? 0 : 1, h = (sp ? 15 : 19) + crH(x, z, 6) * 9; put(x, z, sp, h, h * (sp ? 0.85 : 0.78)); }
    const Lt = NRC * NRT, maxT = Math.round(9000 * dens);
    for (let tj = 0; tj < G.ntz && n < maxT; tj++) for (let ti = 0; ti < G.ntx && n < maxT; ti++) {
      if (!G.on[tj * G.ntx + ti]) continue;
      const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
      for (let zz = za; zz < za + Lt; zz += 8.5) for (let xx = xa; xx < xa + Lt; xx += 8.5) {
        const x = xx + (R() - 0.5) * 7, z = zz + (R() - 0.5) * 7, r1 = R(), cl = nrLC(x, z), p = cl === 1 ? 0.75 : cl === 2 ? 0.3 : cl === 3 ? 0.03 : 0.035;
        if (r1 > p) continue;
        const sp = R() < 0.55 ? 0 : 1, h = (sp ? 13 : 16) + R() * 9; put(x, z, sp, h, h * (sp ? 0.85 : 0.78));
      }
    }
    for (const t of new Set(tk)) t.addTo(root, true);
    fg.addTo(root, false);
    return n;
  }
  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it: tools/razdeli-proge.mjs)
    cpalace: { ban: CP_BAN, at: CP_AT, nums: 0, shirts: CP_SHIRTS, smoke: false, camps: 0, trees: 'park', seC: [1.0, 0.96, 0.92], period: true, park: true,
      flags: { stand: [{ cpA: 0.4, cpB: 0.3, cpC: 0.3 }, { cpA: 0.4, cpB: 0.3, cpC: 0.3 }], ga: { cpA: 0.4, cpB: 0.3, cpC: 0.3 }, camp: { cpA: 1 }, pole: 'cpB', podium: 'cpA' },   // (plain bunting: cream, dark green, maroon)
      vid: [], poles: [-56, 66, -1], runoff: ['LONDON', 'LONDON', 'LONDON'], straight: [-110, 160, -1],
      farm: { wall: [0.95, 0.94, 0.9], roof: [0.26, 0.24, 0.26], end: [0.92, 0.9, 0.86], barn: [0.52, 0.34, 0.2], barnRoof: [0.3, 0.28, 0.3], barnEnd: [0.5, 0.33, 0.2] },
      tvSkip: [], recov: [], photo: [], jets: null, screen: null,
      mow: 0.45, tier: [[0.56, 0.44, 0.31], [0.44, 0.34, 0.24], [0.48, 0.37, 0.26]], roof: [[0.36, 0.38, 0.36], [0.3, 0.3, 0.3], [0.5, 0.48, 0.44]],   // (a timber stand under a dark felt roof)
      colMod: (P) => (x, z, c, dd) => {   // a London park in spring: lawns mown short by the road, lush and even, a little darker under the old trees; further out drifts of longer grass
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.92 + (n - 0.5) * 0.14 + (m - 0.5) * 0.08;
        c[0] *= k * 0.94; c[1] *= k * 1.03; c[2] *= k * 0.92;
        const lw = nrLCf(x, z, 0), rough = sstep(0.46, 0.68, P.n3(x * 0.8 + 410, z * 0.8 - 160)) * sstep(6, 22, dd) * lw * 0.8, seed = rough * sstep(0.45, 0.7, P.n4(x * 0.9 + 33, z * 0.9 - 51));   // the uncut grass: paler and yellower, its seed heads in streaks
        c[0] = lerp(c[0], c[0] * 1.16 + 0.06, rough) + seed * 0.07; c[1] = lerp(c[1], c[1] * 1.04 + 0.03, rough) + seed * 0.04; c[2] = lerp(c[2], c[2] * 0.76, rough) + seed * 0.02;
        const daisy = sstep(0.66, 0.84, P.n1(x * 1.3 - 210, z * 1.3 + 75)) * 0.25 * nrLCf(x, z, 0);   // a few daisies in the lawns
        c[0] = lerp(c[0], c[0] * 1.12 + 0.08, daisy); c[1] = lerp(c[1], c[1] * 1.05 + 0.08, daisy); c[2] = lerp(c[2], c[2] * 1.2 + 0.1, daisy);
      } },
  });
  Object.assign(API, { cpPrep, cpPark, cpMastStep, cpTrees });   // (what js/world-rbring.js, World and the other worlds use: tools/razdeli-proge.mjs)
  World.keep('NR', 'cpalace');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.cpalace = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
