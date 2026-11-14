/* =========================================================================
   WORLD — Sosnová, Češka (theme 'sosnova'): the circuit on the meadows by the village of Sosnová south of Česká Lípa (Liberec region), its
   own parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.sosnova) goes
   on API.rbLook; World.ext.sosnova builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A3), the track: docs/proge/sosnova.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.fl): the pine woods of the sandy country round Česká Lípa (Scots pine,
   birch at their edges: js/world-harju.js's hjTreeGeo), the meadows in late summer; the two streams (def.sk.brooks:
   OpenStreetMap) in their beds, the one across the infield under the circuit in a culvert, piped under the meadows elsewhere (concrete
   headwalls at the pipes' mouths); the power lines over and round the circuit (def.sk.power: OpenStreetMap; steel lattice towers, the
   400 kV ones with a wide head, the 220 and 110 kV ones with two crossarms, the 35 kV ones small, the conductors sagging between them); the
   paddock's garages, office and hall by the finish straight (def.sk.bld: OpenStreetMap); the Czech flag among the fans' flags; no air show
   (LK.air false: a club circuit). Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { Chunks, IChunks, TAU, box, brookMat, clamp, lerp, nrDist, nrGround, nrLC, nrLCf, nrNear, rng, sstep } = API;
  // the text boards: place names (the village, the town, its river, its part by the circuit, the region, the country), the grandstand's
  // name (def.stands) and the start line's
  const SO_BAN = [['SOSNOVÁ', '#11457e', '#fff', '#d7141a'], ['ČESKÁ LÍPA', '#d7141a', '#fff', '#fff'], ['START · CÍL', '#16181c', '#fff', '#d7141a'], ['ČESKO', '#11457e', '#fff', '#d7141a'],
    ['PLOUČNICE', '#245a3a', '#fff', '#fff'], ['DUBICE', '#1d3f6e', '#fff', '#d7141a'], ['SEVERNÍ ČECHY', '#1d3f6e', '#fff', '#fecb00'], ['LIBERECKÝ KRAJ', '#245a3a', '#fff', '#fecb00']];
  const SO_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const SO_SHIRTS = [[0.84, 0.1, 0.12], [0.95, 0.95, 0.93], [0.08, 0.27, 0.5], [0.12, 0.14, 0.2], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [0.86, 0.14, 0.14], [0.22, 0.42, 0.24],
    [0.3, 0.52, 0.82], [0.9, 0.9, 0.88], [0.52, 0.42, 0.3], [0.96, 0.62, 0.12]];   // the fans' shirts: the national red, white and blue, navy, grey and black, a few green and bright ones
  const CZ = { wedge: [[0.95, 0.95, 0.94], [0.84, 0.08, 0.1], [0.07, 0.27, 0.49], 0.5] };   // the Czech flag: white over red, the blue wedge at the pole to the middle (World.flagMesh's wedge)

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods, 2 the fields, 3 built-up): 0 Scots pine, 1 silver birch
  // (js/world-harju.js's); 2-3 the plainer ones far from the road. The woods of the sandy country mostly pine, birch at their edges and here
  // and there; lone birches and pines on the open land, birches by the buildings. (Two kinds, not three: a draw call less each in every
  // cell of trees, where the short circuit's field is in view at once)
  const SO_WOODS = {
    n: 2, geo: (k) => API.hjTreeGeo([1, 2][k % 2], k >= 2),
    cr: [0.28, 0.3], p: [0.012, 0.9, 0.004, 0.02],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(); let sp, h;
      if (cl === 1) { sp = r < 0.16 ? 1 : 0; h = sp === 0 ? 17 + r2 * 8 : 12 + r2 * 6; }
      else if (cl === 3) { sp = r < 0.7 ? 1 : 0; h = 8 + r2 * 7; }
      else { sp = r < 0.6 ? 1 : 0; h = 9 + r2 * 8; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.62 + r2 * 0.2 : 0.56 + r2 * 0.2)];
    },
  };

  // the streams' beds (LK.pad: the builder's ground round the circuit, before it is built): the terrain lowered along their open courses
  // (def.sk.brooks: not the piped ones), 0.9 m under it, easing out 4 m from it; not inside the barriers (the run-offs, the culvert under the
  // road), fully only 4 m past them. soRiv: the open courses' segments in a 16 m hash, the distance to the nearest
  let soRiv = null;
  function soRivDist(x, z) {
    const H = soRiv; let best = 1e9;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = H.get((Math.floor(x / 16) + a) + ',' + (Math.floor(z / 16) + b)); if (!L) continue;
      for (let q = 0; q < L.length; q += 4) { const ax = L[q], az = L[q + 1], dx = L[q + 2] - ax, dz = L[q + 3] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
        best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } }
    return best;
  }
  function soPad(pad0) {
    soRiv = new Map();
    for (const [piped, rv] of (API.T.def.sk || {}).brooks || []) if (!piped) for (let k = 0; k + 3 < rv.length; k += 2) {   // (each segment in every 16 m cell its box touches)
      const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3];
      for (let i = Math.floor(Math.min(ax, bx) / 16); i <= Math.floor(Math.max(ax, bx) / 16); i++) for (let j = Math.floor(Math.min(az, bz) / 16); j <= Math.floor(Math.max(az, bz) / 16); j++) {
        const key = i + ',' + j; let L = soRiv.get(key); if (!L) soRiv.set(key, L = []); L.push(ax, az, bx, bz); } }
    const NRN = API.NRN;   // (the nearest road sample of the point being built, its distance past the barriers: js/world.js nrH)
    return (x, z, h) => {
      h = pad0(x, z, h);
      if (!soRiv.size) return h;
      const d = soRivDist(x, z); if (d >= 4) return h;
      return h - 0.9 * sstep(1, 4, NRN.dd) * sstep(4, 0.8, d);   // (the bed: not inside the barriers)
    };
  }

  // the streams' water: js/world.js's brookMat, the sky in it a little darker, hardly any foam or glints (a slow meadow brook between rank
  // grass)
  function soWaterMat(U) {
    const m = brookMat(U), ob = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.fragmentShader = sh.fragmentShader.replace('sky * fr * 0.6', 'mix(sky, vec3(0.16, 0.2, 0.12), 0.45) * fr * 0.44')
      .replace('foam * 0.85', 'foam * 0.18').replace('rip * 0.12', 'rip * 0.05'); };
    m.customProgramCacheKey = () => 'brook1so';
    return m;
  }

  // a concrete headwall where a stream goes into a pipe or comes out of one (x, z: the mouth; hd: the stream's way, from the pipe out; y the
  // water's level): the wall across, its wing walls, the pipe's dark round mouth in it
  function soHead(g, x, y, z, hd, conc) {
    const c = Math.cos(hd), s = Math.sin(hd);
    box(g, x, y - 0.6, z, 0.35, 1.7, 3.6, hd, conc, [0.66, 0.66, 0.63]);
    for (const sd of [-1, 1]) box(g, x - s * sd * 1.95 + c * 0.8, y - 0.6, z + c * sd * 1.95 + s * 0.8, 1.6, 1.4, 0.3, hd, conc, [0.66, 0.66, 0.63]);
    box(g, x + c * 0.19, y - 0.2, z + s * 0.19, 0.02, 0.85, 0.85, hd, [0.07, 0.07, 0.07]);   // (the pipe: dark)
  }

  // the streams (def.sk.brooks, each piece from upstream to downstream): the open ones in their beds, the water brown-green and clear, level
  // across (a little over the bed's lowest point, eased along the course; the bed's sides cut it into its banks), flowing downstream
  // (js/world.js's brookMat: out.dyn.brook), their banks mud and rank grass; under the circuit in a culvert (where the course is under the
  // road: within 3 m past its barriers) and where a piece meets a piped one, a concrete headwall; within 260 m of the road
  function soBrooks({ root, scen, exclPush, excluded, CR, out }, st) {
    const B = (API.T.def.sk || {}).brooks || []; if (!B.length) return;
    const wg = new Chunks(512, true), HW = 0.95, BW = 2.4, mud = [0.3, 0.27, 0.19], rank = [0.36, 0.42, 0.21], tea = [0.2, 0.21, 0.11], deep = [0.06, 0.08, 0.04], conc = [0.6, 0.6, 0.57];
    const under = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < 3; }, far = (x, z) => nrDist(x, z) > 260;
    const pipeEnds = []; for (const [piped, rv] of B) if (piped) pipeEnds.push([rv[0], rv[1]], [rv[rv.length - 2], rv[rv.length - 1]]);
    const atPipe = (x, z) => pipeEnds.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < 1);
    let any = false;
    for (const [piped, rv] of B) {
      if (piped || rv.length < 4) continue;
      const pts = [];   // the course resampled every 2.5 m
      for (let k = 0; k + 3 < rv.length; k += 2) { const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 2.5));
        for (let m = 0; m < n; m++) pts.push([ax + (bx - ax) * m / n, az + (bz - az) * m / n]); }
      pts.push([rv[rv.length - 2], rv[rv.length - 1]]);
      const n = pts.length, nrm = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
      const bed = pts.map(([x, z], k) => { let m = 1e9; for (const o of [-1, -0.5, 0, 0.5, 1]) m = Math.min(m, nrGround(x + nrm[k][0] * o, z + nrm[k][1] * o)); return m; });
      const lvS = bed.map((v, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 5); q <= Math.min(n - 1, k + 5); q++) { s += bed[q]; c++; } return s / c; });   // (the bed eased along the course)
      const lv = bed.map((v, k) => Math.max(lvS[k], v + 0.06) + 0.14);   // (the water's level: over the bed everywhere)
      // its ends at a pipe: the headwall, the stream's way out of it
      for (const [k, k2] of [[0, 1], [n - 1, n - 2]]) { const [x, z] = pts[k]; if (!atPipe(x, z) || far(x, z) || under(x, z)) continue;
        soHead(scen.get(x, z), x, Math.min(nrGround(x, z), lv[k]), z, Math.atan2(pts[k2][1] - z, pts[k2][0] - x), conc); exclPush(x, z, 3.5); CR.avoid(x, z, 3); st.pipes++; }
      let dist = 0;
      for (let k = 0; k < n - 1; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], ua = under(ax, az), ub = under(bx, bz), d0 = dist; dist += Math.hypot(bx - ax, bz - az);
        if (far(ax, az) || far(bx, bz)) continue;
        if (ua !== ub) {   // the culvert's mouth: a headwall across the water where the stream goes under the road
          const [cx, cz] = ua ? [bx, bz] : [ax, az], y = Math.min(nrGround(cx, cz), lv[ua ? k + 1 : k]);
          soHead(scen.get(cx, cz), cx, y, cz, ua ? Math.atan2(bz - az, bx - ax) : Math.atan2(az - bz, ax - bx), conc); exclPush(cx, cz, 3.5); CR.avoid(cx, cz, 3); st.culverts++; }
        if (ua || ub) continue;
        const l = Math.hypot(bx - ax, bz - az) || 1, [nax, naz] = nrm[k], [nbx, nbz] = nrm[k + 1];
        const W = (x, z, nx, nz, o, y) => [x + nx * o, y, z + nz * o], Gb = (x, z, nx, nz, o, dy) => { const X = x + nx * o, Z = z + nz * o; return [X, nrGround(X, Z) + dy, Z]; };
        const g = wg.get(ax, az), w0 = W(ax, az, nax, naz, -HW, lv[k]), m0 = W(ax, az, nax, naz, 0, lv[k]), w1 = W(ax, az, nax, naz, HW, lv[k]), w2 = W(bx, bz, nbx, nbz, HW, lv[k + 1]), m1 = W(bx, bz, nbx, nbz, 0, lv[k + 1]), w3 = W(bx, bz, nbx, nbz, -HW, lv[k + 1]);
        const sp = clamp((lvS[k] - lvS[k + 1]) / l / 0.05, 0, 1) * 0.6, S2 = 2 * Math.round(sp * 10), d1 = d0 + l;   // (steeper: livelier water)
        g.quadUp(w0, m0, m1, w3, [tea, deep, deep, tea], [[S2, d0], [S2 + 0.5, d0], [S2 + 0.5, d1], [S2, d1]]); g.quadUp(m0, w1, w2, m1, [deep, tea, tea, deep], [[S2 + 0.5, d0], [S2 + 1, d0], [S2 + 1, d1], [S2 + 0.5, d1]]);
        const b = scen.get(ax, az);
        for (const sd of [-1, 1]) b.quadUp(Gb(ax, az, nax, naz, sd * (HW - 0.3), 0.04), Gb(ax, az, nax, naz, sd * BW, 0.04), Gb(bx, bz, nbx, nbz, sd * BW, 0.04), Gb(bx, bz, nbx, nbz, sd * (HW - 0.3), 0.04), [mud, rank, rank, mud]);
        if (k % 2 === 0) exclPush(ax, az, BW + 0.6);   // (no tree in the water)
        CR.block((ax + bx) / 2, (az + bz) / 2, l + 0.4, BW * 2 + 0.4, Math.atan2(bz - az, bx - ax));   // (nobody standing in it)
        st.brook += l; any = true;
      }
    }
    if (any) { out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, soWaterMat(out.dyn.brook), false, true); }   // (World.update makes it flow)
    st.brook = Math.round(st.brook);
    // alders and willows along the open banks where the land is open, in clumps with gaps; within 80 m of the road, not inside its barriers
    // (js/world.js's beech, darker)
    const al = new IChunks(API.nrTreeGeo(1), new THREE.MeshLambertMaterial({ vertexColors: true }), 512), RA = rng(5729);
    for (const [piped, rv] of B) {
      if (piped) continue;
      for (let k = 0; k + 3 < rv.length; k += 2) { const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / (l || 1), nz = (bx - ax) / (l || 1);
        for (let t = 4; t < l - 4; t += 7) {
          if (RA() < 0.45) continue;
          const sd = RA() < 0.5 ? -1 : 1, o = sd * (BW + 1 + RA() * 1.8), x = ax + (bx - ax) * t / l + nx * o, z = az + (bz - az) * t / l + nz * o, q = nrNear(x, z);
          if (nrDist(x, z) > 80 || nrLC(x, z) === 1 || (q.i >= 0 && q.dd < 4) || excluded(x, z)) continue;
          const h = 7 + RA() * 6, cv = 0.76 + RA() * 0.12;
          al.add(x, nrGround(x, z) - 0.1, z, RA() * TAU, h * (0.75 + RA() * 0.2), h, [cv * 0.9, cv, cv * 0.88]);
          exclPush(x, z, 2.5); CR.avoid(x, z, 2); st.alders++;
        } }
    }
    al.addTo(root, true);
  }

  // the power lines' pylons (def.sk.power: [kV, [x, z, kind (1 a tower, 2 a pole), ...]]) by voltage: the shaft's height and its half
  // width at the ground and at its top, the panels of its bracing, its head ('y': a Y-shaped head, two legs up to a beam with the three
  // phases under it, two earth-wire peaks; 'donau': two crossarms, the lower one wider, an earth-wire peak; 'small': one crossarm and a
  // phase on top), the arms ([height, half span]), the conductors' points ([across, height]: the phases, then the earth wires), the
  // members' radius
  const SO_PY = {
    400: { h: 21, b0: 4.2, b1: 1.5, pn: 5, head: 'y', top: 31, A: 12.5, ph: [[-11.5, 26.5], [0, 26.5], [11.5, 26.5]], ew: [[-7, 35], [7, 35]], r: 0.12, wr: 0.045 },
    220: { h: 33, b0: 3.3, b1: 0.85, pn: 6, head: 'donau', arms: [[23, 8.5], [28.5, 5.5]], ph: [[-8, 20], [8, 20], [5.5, 25.5]], ew: [[0, 35.5]], r: 0.1, wr: 0.04 },
    110: { h: 28, b0: 2.8, b1: 0.75, pn: 5, head: 'donau', arms: [[19.5, 6.8], [24, 4.2]], ph: [[-6.5, 17.2], [-3.4, 17.2], [3.4, 17.2], [6.5, 17.2], [-4.2, 21.7], [4.2, 21.7]], ew: [[0, 30.5]], r: 0.09, wr: 0.035 },
    35: { h: 12.5, b0: 1.15, b1: 0.4, pn: 4, head: 'small', arms: [[11.4, 2.3]], ph: [[-2.2, 11.8], [2.2, 11.8], [0, 13.7]], ew: [], r: 0.06, wr: 0.03 },
  };
  const STEEL = [0.55, 0.57, 0.57], STEEL2 = [0.48, 0.5, 0.5], GLASSI = [0.6, 0.66, 0.62], WIRE = [0.34, 0.35, 0.36];
  // a pylon at (x, y, z), its arms across rot (the line's way + 90°): legs, bracing (none far from the road: lite), arms, insulators; ->
  // its conductors' points in the world (the phases, then the earth wires)
  function soPylon(g, x, y, z, rot, Q, pole, lite, pc) {
    const rod = API.ouRod, c = Math.cos(rot), s = Math.sin(rot), W = (u, h, v) => [x + c * u - s * v, y + h, z + s * u + c * v];   // (u across, along the arms; v along the line)
    if (pole) {   // a concrete pole: a slim tapering shaft, a steel crossarm, the insulators on top of it (pc: another pole's colour, Kildare's wooden ones)
      const PC = pc || [0.68, 0.67, 0.63];
      box(g, x, y - 0.3, z, 0.42, Q.h + 1.5, 0.3, rot, PC); box(g, x, y + Q.h + 1.2, z, 0.26, 0.3, 0.2, rot, PC);
      for (const [hh, A] of Q.arms) rod(g, W(-A - 0.1, hh, 0), W(A + 0.1, hh, 0), 0.07, STEEL2, 3);
    } else {
      const H = Q.h, legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], at = (f, h) => { const b = lerp(Q.b0, Q.b1, h / H); return W(f[0] * b, h, f[1] * b); };
      for (const f of legs) rod(g, at(f, -0.3), at(f, H), Q.r, STEEL, 3);   // the four legs
      const ys = []; for (let k = 0; k <= Q.pn; k++) ys.push(H * Math.pow(k / Q.pn, 0.82));   // (the panels: taller at the foot)
      for (let k = 0; k <= Q.pn; k++) for (let f = 0; f < 4; f++) { const a = legs[f], b = legs[(f + 1) % 4];
        if (k > 0) rod(g, at(a, ys[k]), at(b, ys[k]), Q.r * 0.55, STEEL2, 3);   // the struts at each panel's top
        if (lite || k === Q.pn) continue;
        rod(g, at(a, ys[k]), at(b, ys[k + 1]), Q.r * 0.4, STEEL2, 3); rod(g, at(b, ys[k]), at(a, ys[k + 1]), Q.r * 0.4, STEEL2, 3); }   // the X bracing on the four faces
      const b1 = Q.b1;
      if (Q.head === 'y') {   // two legs from the waist out and up to the beam, the beam across, the earth-wire peaks
        const T = Q.top, A = Q.A;
        for (const sd of [-1, 1]) for (const v of [-1, 1]) { rod(g, W(sd * b1, H, v * b1), W(sd * 6.2, T, v * 0.9), Q.r, STEEL, 3); if (!lite) rod(g, W(-sd * b1, H, v * b1), W(sd * 6.2, T - 2.2, v * 0.9), Q.r * 0.45, STEEL2, 3); }
        for (const v of [-1, 1]) { rod(g, W(-A, T, v * 0.9), W(A, T, v * 0.9), Q.r * 0.8, STEEL, 3); rod(g, W(-A + 1.5, T - 1.6, v * 0.5), W(A - 1.5, T - 1.6, v * 0.5), Q.r * 0.6, STEEL2, 3);
          for (const sd of [-1, 1]) rod(g, W(sd * A, T, v * 0.9), W(sd * (A - 1.5), T - 1.6, v * 0.5), Q.r * 0.6, STEEL2, 3); }
        if (!lite) for (let u = -A + 2.5; u < A - 1; u += 2.5) rod(g, W(u, T, 0.9), W(u + 1.25, T - 1.6, 0.5), Q.r * 0.35, STEEL2, 3);
        for (const [u, hh] of Q.ew) rod(g, W(u, T, 0), W(u, hh, 0), Q.r * 0.7, STEEL, 3);
        for (const [u, hh] of Q.ph) rod(g, W(u, T - 0.1, 0), W(u, hh, 0), 0.13, GLASSI, 3);   // the insulator strings
      } else {   // the crossarms: two lower chords and an upper one from the shaft to the tip; the insulators
        for (const [hh, A] of Q.arms) {
          const bb = lerp(Q.b0, Q.b1, hh / H), up = Math.min(2.2, A * 0.3);
          for (const sd of [-1, 1]) { const tip = W(sd * A, hh, 0);
            for (const v of [-1, 1]) rod(g, W(sd * bb, hh, v * bb), tip, Q.r * 0.7, STEEL, 3);
            rod(g, W(sd * bb, hh + up, 0), tip, Q.r * 0.55, STEEL2, 3); }
        }
        if (Q.ew.length) rod(g, W(0, H, 0), W(0, Q.ew[0][1], 0), Q.r * 0.8, STEEL, 3);   // the earth-wire peak
        for (const [u, hh] of Q.ph) { const arm = Q.arms.find(a => Math.abs(hh - a[0]) < 3.5) || Q.arms[0];
          if (hh > arm[0]) rod(g, W(u, arm[0], 0), W(u, hh, 0), 0.08, GLASSI, 3);   // (pins on the arm, or one on the top)
          else rod(g, W(u, arm[0], 0), W(u, hh, 0), Q.r > 0.08 ? 0.12 : 0.08, GLASSI, 3); }   // (strings hanging under it)
        if (Q.head === 'small' && !pole) rod(g, W(0, H, 0), W(0, Q.ph[2][1] - 0.4, 0), Q.r * 0.8, STEEL, 3);   // (the top phase's post)
      }
    }
    if (pole) box(g, x, y + Q.h + 1.05, z, 0.12, 0.6, 0.12, rot, GLASSI);   // (the top phase's insulator)
    return Q.ph.concat(Q.ew).map(([u, hh]) => W(u, pole && Q.head === 'small' && u === 0 ? Q.h + 1.6 : hh, 0));
  }

  // the power lines: their pylons within 700 m of the road (the bracing up to 280 m out), the conductors and the earth wires sagging
  // between them (8 segments a span, a thin ribbon each way); no pylon on the road or in its run-offs (OSM's poles in the wide one before
  // the east hairpin, a 35 kV line's: left out, the wires carried across from the pole before to the one after them). The near
  // pylons in the scenery's chunks (their shadows), the far ones and the wires in chunks of their own, 1 km, without shadows (in the
  // scenery's they made a draw call of each far one)
  function soPower({ root, scen, matV, exclPush, CR }, st, pc) {   // (pc: the poles' colour, if not concrete)
    const farW = new Chunks(1024);
    for (const [kv, p] of (API.T.def.sk || {}).power || []) {
      const Q = SO_PY[kv] || SO_PY[35], pts = []; for (let k = 0; k + 2 < p.length; k += 3) pts.push([p[k], p[k + 1], p[k + 2]]);
      const tops = pts.map(([x, z, kind], k) => {
        const rd = nrDist(x, z), q = nrNear(x, z); if (rd > 700) return null; if (q.i >= 0 && q.dd < 1) return 0;   // (0: a pole in a run-off, left out: the wires go across to the next one)
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], rot = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
        let y = 1e9; for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + dx * Q.b0, z + dz * Q.b0));
        const T = soPylon(rd > 280 ? farW.get(x, z) : scen.get(x, z), x, y, z, rot, Q, kind === 2 && kv <= 35, rd > 280, pc);
        exclPush(x, z, Q.b0 * 1.5 + 2); CR.avoid(x, z, Q.b0 + 1); st.pylons++;
        return T;
      });
      for (let k = 0, j = -1; k < pts.length; k++) { if (tops[k] === 0) continue;   // (the span from the last pole drawn, across those left out)
        const A = j >= 0 && tops[j], B = tops[k]; j = k; if (!A || !B) continue;
        for (let m = 0; m < Math.min(A.length, B.length); m++) { const a = A[m], b = B[m], L = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = L * L / 8 / (m < Q.ph.length ? 1500 : 1900), wr = m < Q.ph.length ? Q.wr : 0.025;
          for (let q = 0; q < 8; q++) { const t0 = q / 8, t1 = (q + 1) / 8, p0 = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0) - 4 * sag * t0 * (1 - t0), lerp(a[2], b[2], t0)], p1 = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1) - 4 * sag * t1 * (1 - t1), lerp(a[2], b[2], t1)];
            const g = farW.get(p0[0], p0[2]), dx = p1[0] - p0[0], dz = p1[2] - p0[2], dl = Math.hypot(dx, dz) || 1, ox = -dz / dl * wr, oz = dx / dl * wr;
            g.quadO(p0, p1, [p1[0], p1[1] + wr * 2, p1[2]], [p0[0], p0[1] + wr * 2, p0[2]], WIRE, [(p0[0] + p1[0]) / 2 + ox * 10, p0[1], (p0[2] + p1[2]) / 2 + oz * 10]);
            g.quadO(p0, p1, [p1[0], p1[1] + wr * 2, p1[2]], [p0[0], p0[1] + wr * 2, p0[2]], WIRE, [(p0[0] + p1[0]) / 2 - ox * 10, p0[1], (p0[2] + p1[2]) / 2 - oz * 10]);
            g.quadO([p0[0] - ox, p0[1] + wr, p0[2] - oz], [p1[0] - ox, p1[1] + wr, p1[2] - oz], [p1[0] + ox, p1[1] + wr, p1[2] + oz], [p0[0] + ox, p0[1] + wr, p0[2] + oz], WIRE, [(p0[0] + p1[0]) / 2, p0[1] + 10, (p0[2] + p1[2]) / 2]); }
          st.spans++; } }
    }
    farW.addTo(root, matV, false, true);
  }
  API.soPower = soPower;   // (Kildare's power lines too: js/world-kildare.js)

  // LK.extra: the streams, the power lines, the buildings round the paddock and by the circuit (OSM outlines as boxes: plaster
  // in cream, ochre or light grey, red-tiled or dark grey roofs; the paddock's garages in rows, their doors to the straight, flat roofs; its
  // office and its hall); before the crowds and the trees, which keep clear of them
  function soExtra(o) {
    const { scen, exclPush, CR } = o, T = API.T, sk = T.def.sk || {}, R = rng(5723), st = { brook: 0, culverts: 0, pipes: 0, alders: 0, pylons: 0, spans: 0, buildings: 0 };
    soBrooks(o, st); soPower(o, st);
    const b7 = sk.bld || [], WALL = [[0.9, 0.86, 0.76], [0.85, 0.74, 0.5], [0.8, 0.8, 0.78], [0.92, 0.91, 0.88]], ROOF = [[0.56, 0.25, 0.17], [0.3, 0.3, 0.32], [0.62, 0.32, 0.2]];
    for (let k = 0; k < b7.length; k += 7) {
      const [x, z, L, W, deg, h, kind] = b7.slice(k, k + 7), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), g = scen.get(x, z);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      if (kind === 4) {   // a row of garages: grey render, a flat roof with a lip, a door every 3.6 m on the side to the circuit
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, [0.78, 0.78, 0.75], [0.42, 0.42, 0.43], true);
        box(g, x, y + h, z, L + 0.3, 0.22, W + 0.5, rot, [0.6, 0.6, 0.6], [0.36, 0.36, 0.37]);
        const q = nrNear(x, z), sd = q.i >= 0 && ((T.px[q.i] - x) * -s + (T.pz[q.i] - z) * c) > 0 ? 1 : -1, nd = Math.max(1, Math.floor(L / 3.6));   // (the side towards the road)
        for (let d = 0; d < nd; d++) { const u = (d + 0.5 - nd / 2) * (L / nd), fx = x + c * u - s * sd * (W / 2 + 0.03), fz = z + s * u + c * sd * (W / 2 + 0.03);
          box(g, fx, y, fz, 2.8, Math.min(2.7, h - 0.5), 0.04, rot, d % 4 === 1 ? [0.2, 0.36, 0.6] : [0.48, 0.5, 0.52]); }   // (the roller doors: grey, one in four blue)
      } else if (kind === 6) {   // the paddock's office: white render, a band of windows, a flat roof
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, [0.93, 0.93, 0.9], [0.4, 0.4, 0.42], true);
        box(g, x, y + h * 0.45, z, L + 0.04, 1.1, W + 0.04, rot, [0.26, 0.34, 0.42]);
      } else {
        const wc = kind === 5 || h > 6 ? WALL[2] : WALL[Math.floor(R() * 4)], rc = ROOF[kind === 5 || h > 6 ? 1 : Math.floor(R() * 3)];
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      }
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    sosnova: { ban: SO_BAN, at: SO_AT, nums: 0, shirts: SO_SHIRTS, smoke: false, camps: 0, seC: [1.08, 1.04, 0.88], gravel: true, noVid: true, mow: 0.6,
      woods: SO_WOODS, extra: soExtra, pad: soPad, fl: { cz: CZ }, ck: 2, air: false,   // (ck: chunks twice as big: from most places much of the short circuit is in view)
      flags: { stand: [{ cz: 0.7, tm: 0.2, rb: 0.1 }, { cz: 0.6, tm: 0.25, rb: 0.15 }], ga: { cz: 0.65, tm: 0.25, rb: 0.1 }, camp: { cz: 0.8, tm: 0.2 }, pole: 'cz', podium: 'cz' },
      vid: [], poles: [-100, 60, -1], runoff: ['SOSNOVÁ', 'ČESKÁ LÍPA', 'ČESKO'], straight: [-90, 50, 1],
      farm: { wall: [0.91, 0.87, 0.77], roof: [0.57, 0.26, 0.17], end: [0.91, 0.87, 0.77], barn: [0.6, 0.58, 0.54], barnRoof: [0.36, 0.35, 0.34], barnEnd: [0.6, 0.58, 0.54] },   // a cream farmhouse under red tiles, a grey barn under a dark roof
      tvSkip: [0, 2, 3, 4, 7, 8, 9, 11, 12], recov: [1, 6], photo: [0, 2, 10, 13], jets: [[0.84, 0.08, 0.1], [0.95, 0.95, 0.95], [0.07, 0.27, 0.49]],   // (TV towers at the lower hairpin, the long left, the west and the east hairpins and the last one)
      colMod: (P) => (x, z, c) => {   // the meadows in late summer: green, in lighter and darker patches, dry and straw-coloured here and there, yarrow and knapweed; the farmland's stubble and maize
        const n = P.n5(x * 0.55 + 520, z * 0.55 - 90), m = P.n3(x * 1.6 - 140, z * 1.6), k = 0.93 + (n - 0.5) * 0.2 + (m - 0.5) * 0.1;
        c[0] *= k * 1.0; c[1] *= k * 1.0; c[2] *= k * 0.94;
        { const fm = nrLCf(x, z, 0), dry = sstep(0.55, 0.8, P.n3(x * 0.7 - 60, z * 0.7 + 210)) * 0.55 * fm, wf = sstep(0.64, 0.84, P.n1(x * 1.3 + 170, z * 1.3 - 95)) * 0.35 * fm;
          c[0] = lerp(c[0], c[0] * 1.32 + 0.1, dry); c[1] = lerp(c[1], c[1] * 1.12 + 0.06, dry); c[2] = lerp(c[2], c[2] * 0.85 + 0.02, dry);
          c[0] = lerp(c[0], c[0] * 1.12 + 0.12, wf); c[1] = lerp(c[1], c[1] * 1.0 + 0.08, wf); c[2] = lerp(c[2], c[2] * 1.18 + 0.12, wf); }
        const f = nrLCf(x, z, 2);   // the fields: wheat stubble pale gold, maize dark green, a field ploughed, one of rape gone green again
        if (f > 0) { const crop = P.n1(x * 0.3 - 900, z * 0.3), col = crop < 0.35 ? [1.48, 1.18, 0.62] : crop < 0.6 ? [0.62, 0.9, 0.42] : crop < 0.8 ? [1.0, 0.8, 0.6] : [0.8, 1.0, 0.56];
          c[0] = lerp(c[0], col[0], f * 0.85); c[1] = lerp(c[1], col[1], f * 0.85); c[2] = lerp(c[2], col[2], f * 0.85); }
      } },
  });
  World.keep('NR', 'sosnova');   // (its grids kept between its builds; World.build frees the others')
  World.ext.sosnova = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
