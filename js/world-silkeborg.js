/* =========================================================================
   WORLD — Silkeborg, Danska (theme 'silkeborg'): the circuit on the heath at Skellerup east of Silkeborg (Jutland), its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.silkeborg) goes on API.rbLook;
   World.ext.silkeborg builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A1), the track: docs/proge/silkeborg.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl): the trees of the Danish plantations (Norway spruce, Scots pine, silver
   birch: js/world-harju.js's hjTreeGeo), blocks of one kind as they were planted, low pines and birches on the heath; the heather in bloom
   and the sand round the circuit in the ground's colours (def.sk.sand: OSM natural=sand); the three burial mounds of the Bronze Age by
   the circuit (def.sk.mounds), the buildings round it and its fences (def.sk.bld, def.sk.fence: OpenStreetMap); the Danish flag among
   the fans' flags. Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, TAU, box, clamp, lerp, nrGround, nrLCf, rng, sstep } = API;
  // the text boards: place names (the town, the villages round the circuit, the river, the region, the country), the grandstands' names
  // (def.stands: the villages they look towards) and the start line's
  const SK_BAN = [['SILKEBORG', '#b8102c', '#fff', '#fff'], ['JYLLAND', '#1d3f6e', '#fff', '#f2c21a'], ['START · MÅL', '#16181c', '#fff', '#c8102e'], ['DANMARK', '#c8102e', '#fff', '#fff'],
    ['SKELLERUP', '#1d3f6e', '#fff', '#c8102e'], ['HÅRUP', '#1d3f6e', '#fff', '#c8102e'], ['GUDENÅ', '#245a3a', '#fff', '#fff'], ['RESENBRO', '#1d3f6e', '#fff', '#f2c21a']];
  const SK_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const SK_SHIRTS = [[0.78, 0.1, 0.16], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.4, 0.42, 0.46], [0.8, 0.12, 0.18], [0.14, 0.14, 0.16], [0.95, 0.78, 0.12], [0.2, 0.48, 0.3],
    [0.3, 0.55, 0.85], [0.92, 0.92, 0.9], [0.56, 0.44, 0.32], [0.86, 0.32, 0.12]];   // the fans' shirts at the end of the summer: red and white, navy, grey and black, a few bright ones
  let SAND = () => 0;   // (the sand's mask of the build under way: colMod makes it, the verges use it)
  const SK_SANDC = [2.1, 1.46, 2.3];   // (the sand's colour over the grass picture: pale, not green, so the grass shader leaves it)
  const nordic = (f, c, u0, u1, v0, v1) => ({ grid: [[0, u0, u1, 1], [0, v0, v1, 1], [[f, c, f], [c, c, c], [f, c, f]]] });   // (a Nordic cross: World.flagMesh's grid, the cross c from u0 to u1 along the flag (0 at the pole) and from v0 to v1 down it, the field f)
  const DK = nordic([0.78, 0.06, 0.16], [0.95, 0.95, 0.94], 12 / 37, 16 / 37, 12 / 28, 16 / 28);   // the Danish flag: a white Nordic cross on red

  // the sand round the circuit (def.sk.sand: OSM outlines) as a soft mask, 4 m cells: 0 outside .. 1 inside, a cell's blur at the edges
  function skSand(def) {
    const polys = (def.sk && def.sk.sand) || []; if (!polys.length) return () => 0;
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (const p of polys) for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); }
    const C = 4; x0 -= 2 * C; z0 -= 2 * C; const nx = Math.ceil((x1 - x0) / C) + 3, nz = Math.ceil((z1 - z0) / C) + 3, M = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) {   // (scanlines: each outline even-odd across the row through the cells' centres)
      const z = z0 + (j + 0.5) * C;
      for (const p of polys) {
        const xs = []; for (let k = 0, n = p.length; k < n; k += 2) { const ax = p[k], az = p[k + 1], bx = p[(k + 2) % n], bz = p[(k + 3) % n]; if ((az > z) !== (bz > z)) xs.push(ax + (z - az) * (bx - ax) / (bz - az)); }
        xs.sort((a, b) => a - b);
        for (let q = 0; q + 1 < xs.length; q += 2) for (let i = Math.max(0, Math.ceil((xs[q] - x0) / C - 0.5)); i < nx && x0 + (i + 0.5) * C < xs[q + 1]; i++) M[j * nx + i] = 1;
      }
    }
    const B = new Float32Array(nx * nz);   // (a 3 x 3 blur: soft edges between the sand and the grass)
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { let s = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) s += M[(j + b) * nx + i + a]; B[j * nx + i] = s / 9; }
    return (x, z) => { const fx = (x - x0) / C - 0.5, fz = (z - z0) / C - 0.5, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return 0;
      const u = fx - i, v = fz - j, k = j * nx + i; return (B[k] * (1 - u) + B[k + 1] * u) * (1 - v) + (B[k + nx] * (1 - u) + B[k + nx + 1] * u) * v; };
  }

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the plantations, 2 the heath, 3 built-up): unit trees of js/world-harju.js
  // (0 Norway spruce, 1 Scots pine, 2 silver birch; 3-5 the plainer ones far from the road); the plantations in blocks of one kind (the
  // noise), a birch here and there; on the heath low pines and birches seeded in it, lone ones on the open land and round the buildings
  const SK_WOODS = {
    n: 3, geo: (k) => API.hjTreeGeo(k % 3, k >= 3), cr: [0.26, 0.33, 0.3], p: [0.014, 0.9, 0.1, 0.03],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.7 + 410, z * 0.7 - 230); sp = r < 0.1 ? 2 : blk < 0.44 ? 0 : 1; h = sp === 0 ? 15 + r2 * 7 : sp === 1 ? 13 + r2 * 6 : 11 + r2 * 4; }
      else if (cl === 2) { sp = r < 0.62 ? 1 : 2; h = 3.5 + r2 * 4.5; }
      else { sp = r < 0.45 ? 1 : 2; h = 7 + r2 * 6; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.46 + r2 * 0.12 : sp === 1 ? 0.6 + r2 * 0.22 : 0.58 + r2 * 0.2)];
    },
  };

  // LK.extra: the burial mounds (domes of turf and heather), the buildings by the circuit (OSM outlines as boxes), its fences (chain link
  // on posts; not where they would stand in the circuit's barriers or run-offs); before the crowds and the trees, which keep clear of them
  function skExtra({ root, tex, scen, exclPush, CR }) {
    const T = API.T, sk = T.def.sk || {}, R = rng(5611), st = { mounds: 0, buildings: 0, fence: 0 };
    for (const [x, z, r, h] of sk.mounds || []) {   // a mound: a low dome, 16 sides, turf and heather in rings, sunk a little into the ground
      const g = scen.get(x, z), y = nrGround(x, z) - 0.25, S = 16, RG = 5, col = (q) => [lerp(0.33, 0.4, q), lerp(0.4, 0.33, q), lerp(0.2, 0.3, q)];   // (grass round its foot, heather on its top)
      const ring = (q) => { const rr = r * Math.cos(q * Math.PI / 2), yy = y + (h + 0.25) * Math.sin(q * Math.PI / 2); return [...Array(S)].map((_, k) => { const a = k / S * TAU; return [x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr]; }); };
      for (let b = 0; b < RG; b++) { const A = ring(b / RG), Bq = ring((b + 1) / RG), c0 = col(b / RG), c1 = col((b + 1) / RG);
        for (let k = 0; k < S; k++) { const k1 = (k + 1) % S; g.quadO(A[k], A[k1], Bq[k1], Bq[k], c0, [x, y - 4 * r, z], null, [c0, c0, c1, c1]); } }
      exclPush(x, z, r + 2); CR.avoid(x, z, r + 1); st.mounds++;
    }
    const b6 = sk.bld || [], WALL = [[0.9, 0.88, 0.84], [0.84, 0.8, 0.72], [0.62, 0.32, 0.24], [0.76, 0.77, 0.78]], ROOF = [[0.24, 0.25, 0.27], [0.36, 0.37, 0.4], [0.5, 0.22, 0.16]];
    for (let k = 0; k < b6.length; k += 6) {   // a building: walls of white render, yellow or red brick or grey cladding, a flat or low roof
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 0 : Math.floor(R() * 3)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    const fg = new GB(true), keep = (x, z) => { const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(o) > (o > 0 ? T.br[i] : T.bl[i]) + 2.5 && !T.pitAt(i * T.ds); };
    for (const f of sk.fence || []) {   // a fence: chain link 2 m high (the debris fences' picture), a post every 3 m
      let acc = 0;
      for (let k = 2; k < f.length; k += 2) {
        const ax = f[k - 2], az = f[k - 1], bx = f[k], bz = f[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
        for (let q = 0; q < n; q++) {
          const x0 = ax + (bx - ax) * q / n, z0 = az + (bz - az) * q / n, x1 = ax + (bx - ax) * (q + 1) / n, z1 = az + (bz - az) * (q + 1) / n, d = L / n;
          if (!keep(x0, z0) || !keep(x1, z1)) { acc += d; continue; }
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + d) / 2.5, ins = [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)];
          fg.quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.05, z1], [x0, y0 + 2.05, z0], [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
          box(scen.get(x0, z0), x0, y0 - 0.2, z0, 0.08, 2.35, 0.08, Math.atan2(bz - az, bx - ax), [0.58, 0.6, 0.62]);
          acc += d; st.fence += d;
        }
      }
    }
    if (!fg.empty) { const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'fences'; root.add(m); }
    st.fence = Math.round(st.fence);
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    silkeborg: { ban: SK_BAN, at: SK_AT, nums: 0, shirts: SK_SHIRTS, smoke: false, camps: 0, seC: [1.12, 1.02, 0.86], gravel: true, noVid: true,
      pitBox: [-40, 90, 1], vg: [0.95, 0.98, 0.8], edge: [1.12, 1.0, 0.88], mow: 0.5,   // (the pit building on the right of the straight; the verge drier at the end of the summer, worn sandy by the asphalt; fainter mowing stripes)
      woods: SK_WOODS, extra: skExtra, fl: { dk: DK }, ck: 2,   // (ck: chunks twice as big: from most places much of the short circuit is in view)
      flags: { stand: [{ dk: 0.7, tm: 0.3 }, { dk: 0.55, tm: 0.25, rb: 0.2 }], ga: { dk: 0.6, tm: 0.25, rb: 0.15 }, camp: { dk: 0.7, tm: 0.3 }, pole: 'dk', podium: 'dk' },
      vid: [], poles: [-150, 150, -1], runoff: ['SILKEBORG', 'JYLLAND', 'DANMARK'], straight: [-150, 120, -1],
      farm: { wall: [0.93, 0.84, 0.58], roof: [0.6, 0.24, 0.16], end: [0.91, 0.82, 0.56], barn: [0.56, 0.2, 0.15], barnRoof: [0.22, 0.22, 0.24], barnEnd: [0.54, 0.19, 0.14] },   // a yellow farmhouse under red tiles, a red barn under a dark roof
      tvSkip: [1, 5, 7, 12], recov: [0, 3, 10], photo: [0, 3, 8, 13], jets: [[0.97, 0.97, 0.97], [0.97, 0.97, 0.97], [0.97, 0.97, 0.97]],
      colMod: (P) => {   // late summer on the sandy heath: the grass drier and paler, the heather in bloom in purple patches, brown where it is old, the sand
        const sand = SAND = skSand(API.T.def);
        return (x, z, c) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.93 + (n - 0.5) * 0.18 + (m - 0.5) * 0.1;
          c[0] *= k * 1.02; c[1] *= k * 0.97; c[2] *= k * 0.9;
          { const fm = nrLCf(x, z, 0), dry = sstep(0.5, 0.74, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.55 * fm;   // (the open land: patches burnt straw-yellow by the summer)
            c[0] = lerp(c[0], c[0] * 1.22 + 0.04, dry); c[1] = lerp(c[1], c[1] * 1.06 + 0.02, dry); c[2] = lerp(c[2], c[2] * 1.02, dry); }
          const hf = nrLCf(x, z, 2);
          if (hf > 0) { const bl = sstep(0.38, 0.66, P.n1(x * 0.9 + 40, z * 0.9 - 60)), dk = 0.92 + 0.16 * m;   // the heather: purple in bloom, brown where it is old
            c[0] = lerp(c[0], lerp(1.34, 1.52, bl) * dk, hf * 0.8); c[1] = lerp(c[1], lerp(0.84, 0.74, bl) * dk, hf * 0.8); c[2] = lerp(c[2], lerp(1.26, 1.96, bl) * dk, hf * 0.8); }
          const sa = sand(x, z);
          if (sa > 0) { const v = 0.95 + 0.1 * n; c[0] = lerp(c[0], SK_SANDC[0] * v, sa); c[1] = lerp(c[1], SK_SANDC[1] * v, sa); c[2] = lerp(c[2], SK_SANDC[2] * v, sa); }   // the sand
        };
      },
      verge: (cols, pr, nb, i, side) => {   // the verges inside the barriers sandy where OSM has sand there (the run-offs without a sand trap of the game's)
        const T = API.T;
        for (let k = 0; k < pr.length; k++) { const o = side * pr[k][0], sa = SAND(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o); if (!(sa > 0)) continue;
          const c = cols[k]; cols[k] = [lerp(c[0], SK_SANDC[0], sa), lerp(c[1], SK_SANDC[1], sa), lerp(c[2], SK_SANDC[2], sa)]; }
      } },
  });
  World.keep('NR', 'silkeborg');   // (its grids kept between its builds; World.build frees the others')
  World.ext.silkeborg = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
