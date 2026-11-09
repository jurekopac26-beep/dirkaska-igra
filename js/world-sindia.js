/* =========================================================================
   WORLD — Sindia, Senegal (theme 'sindia'): the circuit in the savanna at Sindia south-east of Dakar, its own parts on the shared
   builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.sindia) goes on API.rbLook;
   World.ext.sindia builds it with World.ext.rbring. Plan: docs/dirkalisca-celine.md, the track: docs/proge/sindia.md.
   Its own parts (the builder's hooks LK.ground, LK.woods, LK.extra, LK.fl): the savanna's ground (dry straw-coloured grass over the
   reddish sandy soil: its own ground picture under the vertex colours), the fields and the paddock's trodden earth in the ground's
   colours; baobabs and umbrella acacias, shrubs on the scrub; a few old baobabs alone by the track (def.sk.bb) and termite mounds on the
   savanna; the Senegalese flag among the fans' flags. Only place names on its boards (no names of the circuit, its people, races or
   sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, TAU, clamp, cone, cyl, lerp, nrDist, nrGround, nrLCf, puff, rng, sstep } = API;
  // the text boards: place names (the village, the region, the country, the towns and the coast round the circuit), the grandstands' names
  // (def.stands: the village and the region) and the start line's (in French, the country's official language)
  const SN_BAN = [['SINDIA', '#00853f', '#fff', '#fdef42'], ['THIÈS', '#16181c', '#fff', '#e31b23'], ['DÉPART · ARRIVÉE', '#16181c', '#fff', '#00853f'], ['SÉNÉGAL', '#e31b23', '#fff', '#fdef42'],
    ['MBOUR', '#1d3f6e', '#fff', '#fdef42'], ['PETITE CÔTE', '#0e5a7a', '#fff', '#fff'], ['NGUÉKHOKH', '#6b3a1e', '#fff', '#fdef42'], ['POPENGUINE', '#1d3f6e', '#fff', '#00853f']];
  const SN_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const SN_SHIRTS = [[0.0, 0.52, 0.25], [0.99, 0.84, 0.0], [0.89, 0.11, 0.14], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.3, 0.55, 0.85], [0.86, 0.32, 0.12], [0.56, 0.24, 0.5],
    [0.14, 0.14, 0.16], [0.92, 0.6, 0.12], [0.2, 0.62, 0.62], [0.95, 0.95, 0.93]];   // the fans' shirts: green, yellow and red, white, navy, light blue, orange, purple, black, saffron, teal
  const SN = Object.assign([[0.0, 0.52, 0.25], [0.99, 0.84, 0.0], [0.89, 0.11, 0.14]], { vert: true });   // the Senegalese flag: green, yellow, red, vertical (World.rbFlags: cols.vert; its star left out)

  // the savanna's ground under the vertex colours (256 px = 14 m, tileable as World's grass picture it takes the place of): dry straw-coloured
  // grass in tufts over the reddish sandy soil, bare patches between them; the vertex colours make the fields, the scrub and the paddock
  function snPN(n, seed) { const q = rng(seed), g = new Float32Array(n * n); for (let k = 0; k < g.length; k++) g[k] = q();
    return (u, v) => { u *= n; v *= n; const i = Math.floor(u), j = Math.floor(v), f = u - i, e = v - j, I = (a, b) => g[((b % n + n) % n) * n + ((a % n + n) % n)], s = f * f * (3 - 2 * f), t = e * e * (3 - 2 * e);
      return lerp(lerp(I(i, j), I(i + 1, j), s), lerp(I(i, j + 1), I(i + 1, j + 1), s), t); }; }
  function snGroundTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(4700);
    const n1 = snPN(5, 4701), n2 = snPN(16, 4702), n3 = snPN(48, 4703);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, o = (j * S + i) * 4, g = sstep(0.3, 0.56, n1(u, v) * 0.55 + n2(u, v) * 0.45), k = 0.92 + n3(u, v) * 0.1 + (r() - 0.5) * 0.1;
      d[o] = clamp(lerp(172, 204, g) * k, 0, 255); d[o + 1] = clamp(lerp(124, 184, g) * k, 0, 255); d[o + 2] = clamp(lerp(90, 134, g) * k, 0, 255); d[o + 3] = 255;   // (the soil red-ochre, the grass pale straw)
    }
    x.putImageData(img, 0, 0);
    for (let q = 0; q < 2600; q++) {   // the grass blades in tufts: pale straw and darker, short strokes leaning together
      const cx = r() * S, cy = r() * S, n = 3 + Math.floor(r() * 5), pale = r() < 0.6;
      for (let b = 0; b < n; b++) { const a = -Math.PI / 2 + (r() - 0.5) * 1.1, L = 3 + r() * 6, ox = (r() - 0.5) * 3;
        x.strokeStyle = pale ? `rgba(230,212,164,${0.35 + r() * 0.3})` : `rgba(128,106,72,${0.25 + r() * 0.25})`; x.lineWidth = 0.6 + r() * 0.6;
        x.beginPath(); x.moveTo(cx + ox, cy); x.lineTo(cx + ox + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke(); }
    }
    for (let q = 0; q < 600; q++) { const px = r() * S, py = r() * S, s = 0.6 + r() * 1.3; x.fillStyle = r() < 0.6 ? `rgba(140,86,58,${0.2 + r() * 0.25})` : `rgba(236,220,184,${0.2 + r() * 0.3})`; x.fillRect(px, py, s, s); }   // (grit: red and pale)
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; return t;
  }

  // a tapered limb between two points (a prism of the given sides), its faces outwards
  function limb(g, A, B, r0, r1, sides, col) {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]), t = d.map(v => v / L);
    const up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / ul);
    const w = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]], inn = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const ring = (C, r, a) => [C[0] + (u[0] * Math.cos(a) + w[0] * Math.sin(a)) * r, C[1] + (u[1] * Math.cos(a) + w[1] * Math.sin(a)) * r, C[2] + (u[2] * Math.cos(a) + w[2] * Math.sin(a)) * r];
    for (let i = 0; i < sides; i++) { const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU; g.quadO(ring(A, r0, a0), ring(B, r1, a0), ring(B, r1, a1), ring(A, r0, a1), col, inn); }
  }
  // unit trees (height 1, the instances scale them): 0 a baobab, 1 an umbrella acacia (low: a shrub of the scrub); 2, 3 the cheaper ones
  // far from the road
  function snTreeGeo(kind) {
    const g = new GB(), R = rng(4660 + kind), k = kind % 2, cheap = kind >= 2;
    if (k === 0) {   // the baobab: a fat grey bottle of a trunk, thick limbs spreading from its top like roots, sparse leaves at their ends
      const bark = [0.62, 0.56, 0.5], barkD = [0.52, 0.47, 0.42], sd = cheap ? 6 : 9;
      cyl(g, 0, -0.03, 0, 0.12, 0.26, sd, barkD, null, 0.115); cyl(g, 0, 0.23, 0, 0.115, 0.27, sd, bark, null, 0.085);
      const nl = cheap ? 4 : 7, tips = [];
      for (let q = 0; q < nl; q++) {
        const a = q / nl * TAU + (R() - 0.5) * 0.5, reach = 0.26 + R() * 0.14, top = 0.7 + R() * 0.14, c = Math.cos(a), s = Math.sin(a);
        const A = [c * 0.05, 0.47, s * 0.05], M = [c * reach * 0.55, top - 0.08, s * reach * 0.55], B = [c * reach, top, s * reach];
        limb(g, A, M, 0.04, 0.026, cheap ? 4 : 5, bark); limb(g, M, B, 0.026, 0.012, cheap ? 3 : 4, bark); tips.push(B);
        if (!cheap) { const b = a + (R() < 0.5 ? 0.6 : -0.6), C = [M[0] + Math.cos(b) * 0.12, top + 0.06, M[2] + Math.sin(b) * 0.12]; limb(g, M, C, 0.018, 0.008, 3, bark); tips.push(C); }
      }
      const LF = [[0.36, 0.44, 0.22], [0.42, 0.48, 0.24], [0.33, 0.4, 0.2]];
      tips.forEach((p, q) => { if (cheap && q % 2) return; puff(g, p[0], p[1] + 0.02, p[2], cheap ? 0.12 : 0.085 + R() * 0.03, 0.6, LF[q % 3], R, 0.3, 0.5, 1.1, false); });
    } else {   // the acacia: a slim leaning trunk forking into a few limbs, a wide flat crown of fine leaves, dusty green
      const bark = [0.4, 0.33, 0.27], lean = (R() - 0.5) * 0.1;
      limb(g, [0, -0.02, 0], [lean, 0.5, 0], 0.03, 0.022, cheap ? 4 : 5, bark);
      const nb = cheap ? 2 : 3, LF = [[0.42, 0.48, 0.26], [0.46, 0.52, 0.28], [0.38, 0.45, 0.24]];
      for (let q = 0; q < nb; q++) { const a = q / nb * TAU + R() * 0.6, c = Math.cos(a), s = Math.sin(a); limb(g, [lean, 0.48, 0], [lean + c * 0.2, 0.74, s * 0.2], 0.018, 0.01, 3, bark); }
      const cl = cheap ? [[0, 0.8, 0, 0.38, 0.32]] : [[0.18, 0.79, 0.04, 0.24, 0.3], [-0.16, 0.8, 0.08, 0.23, 0.3], [0.02, 0.78, -0.2, 0.24, 0.3], [-0.02, 0.81, 0.21, 0.22, 0.3], [0.02, 0.86, 0.0, 0.25, 0.28]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x + lean, y, z, r, sy, LF[q % 3], R, 0.25, 0.55, 1.1, !cheap));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the trees (LK.woods, on the builder's land cover: 0 the savanna's grass, 1 shrubs and trees, 2 fields, 3 built-up): baobabs and umbrella
  // acacias alone on the savanna, shrubs and acacias thicker on the scrub, the baobabs left standing in the fields, a few trees round the paddock
  const SN_WOODS = {
    n: 2, geo: snTreeGeo, cr: [0.4, 0.34], p: [0.006, 0.16, 0.005, 0.01],
    pick(cl, R, far) {
      const r = R(), r2 = R(), sp = cl === 2 ? (r < 0.8 ? 0 : 1) : cl === 1 ? (r < 0.12 ? 0 : 1) : (r < 0.3 ? 0 : 1);
      let h = sp === 0 ? 10 + r2 * 6 : cl === 1 && r < 0.7 ? 2 + r2 * 2.5 : 5 + r2 * 4;   // (a baobab 10-16 m; on the scrub mostly shrubs 2-4.5 m; an acacia 5-9 m)
      if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.82 + r2 * 0.12 : h < 5 ? 1.2 + r2 * 0.3 : 1.25 + r2 * 0.25)];
    },
  };

  // LK.extra: the old baobabs alone by the track (def.sk.bb, a separate few instances: big and old, the crowds and the other trees keep
  // clear of them) and termite mounds on the savanna (red-brown spires of clay, 1-2.5 m, past the barriers): before the crowds and the trees
  function snExtra({ root, scen, exclPush, CR, excluded }) {
    const T = API.T, sk = T.def.sk || {}, R = rng(4701), st = { baobabs: 0, mounds: 0 };
    const bb = sk.bb || [], tc = new IChunks(snTreeGeo(0), new THREE.MeshLambertMaterial({ vertexColors: true }), 8);
    for (let k = 0; k + 2 < bb.length; k += 3) {
      const x = bb[k], z = bb[k + 1], h = bb[k + 2], cv = 0.92 + R() * 0.12;
      tc.add(x, nrGround(x, z) - 0.2, z, R() * TAU, h * 1.0, h, [cv, cv * 0.98, cv * 0.95]);
      exclPush(x, z, h * 0.5); CR.avoid(x, z, h * 0.45); st.baobabs++;
    }
    tc.addTo(root, true);
    const keep = (x, z) => { const i = T.nearestIdx(x, z), of = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(of) > (of > 0 ? T.br[i] : T.bl[i]) + 6 && !T.pitAt(i * T.ds) && !T.pitAt(i * T.ds + 30) && !T.pitAt(i * T.ds - 30); };
    const MC = [[0.62, 0.36, 0.24], [0.56, 0.32, 0.22], [0.68, 0.42, 0.28]];
    for (let tries = 0; tries < 400 && st.mounds < 46; tries++) {   // along the lap, 12-60 m out on either side, on the savanna and the scrub
      const i = Math.floor(R() * T.N), side = R() < 0.5 ? -1 : 1, o = (side > 0 ? T.br[i] : T.bl[i]) + 10 + R() * 45, x = T.px[i] + T.nx[i] * o * side, z = T.pz[i] + T.nz[i] * o * side;
      if (!keep(x, z) || (excluded && excluded(x, z)) || nrLCf(x, z, 2) > 0.5 || nrLCf(x, z, 3) > 0.3 || nrDist(x, z) < 10) continue;
      const y = nrGround(x, z) - 0.1, h = 1 + R() * 1.5, r0 = h * (0.32 + R() * 0.12), col = MC[Math.floor(R() * 3)], g = scen.get(x, z);
      cone(g, x, y, z, r0, h, 7, col, [col[0] * 1.08, col[1] * 1.06, col[2] * 1.04], R() * TAU);   // the main spire
      for (let q = 0, n = Math.floor(R() * 3); q < n; q++) { const a = R() * TAU, d = r0 * (0.5 + R() * 0.3), hh = h * (0.35 + R() * 0.3); cone(g, x + Math.cos(a) * d, y, z + Math.sin(a) * d, hh * 0.4, hh, 6, col, col, R() * TAU); }   // (smaller spires round it)
      exclPush(x, z, r0 + 1.5); CR.avoid(x, z, r0 + 1); st.mounds++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    sindia: { ban: SN_BAN, at: SN_AT, nums: 0, shirts: SN_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.08, 0.94, 0.8], gravel: true, noVid: true,
      pitBox: [-62, 72, -1], vg: [1.02, 0.97, 0.86], edge: [1.06, 1.0, 0.88], mow: 0.3,   // (the pit building on the left of the straight; the verges dry, faint stripes)
      ground: (m, ownTex) => { m.map = ownTex(snGroundTex(m.map && m.map.anisotropy)); },   // (the savanna's grass and soil in place of the meadow grass picture: the terrain and the verges)
      woods: SN_WOODS, extra: snExtra, lane: true, fl: { sn: SN }, ck: 2,   // (lane: the pit lane's asphalt past the pit building too; ck: chunks twice as big: fewer draws)
      flags: { stand: [{ sn: 0.75, tm: 0.25 }, { sn: 0.6, tm: 0.25, or: 0.15 }], ga: { sn: 0.65, tm: 0.25, or: 0.1 }, camp: { sn: 0.7, tm: 0.3 }, pole: 'sn', podium: 'sn' },
      vid: [], poles: [-90, 60, 1], runoff: ['SINDIA', 'SÉNÉGAL', 'THIÈS'], straight: [-230, 160, 1],
      farm: { wall: [0.86, 0.8, 0.7], roof: [0.62, 0.62, 0.6], end: [0.84, 0.78, 0.68], barn: [0.74, 0.6, 0.44], barnRoof: [0.6, 0.6, 0.58], barnEnd: [0.72, 0.58, 0.42] },
      tvSkip: [1, 3, 4, 8, 10, 11, 12], recov: [0, 5, 13], photo: [0, 6, 9, 14], jets: [[0.0, 0.52, 0.25], [0.99, 0.84, 0.0], [0.89, 0.11, 0.14]],   // (TV towers at the left at the end of the straight, the left into the valley, the sharp right, the long right, the baobab corner, the triple bend, the right at the bottom, the hairpin and the last corner)
      colMod: (P) => (x, z, c) => {   // the dry season: the savanna straw and red-ochre (the ground picture as it is, bare red patches), the scrub darker olive, the fields pale sandy soil, the paddock trodden red earth
        const sh = clamp((c[0] + c[1] + c[2]) / 3, 0.5, 1.15), n = P.n5(x * 0.5 + 470, z * 0.5), m = P.n3(x * 1.5 + 80, z * 1.5), k = (0.97 + (n - 0.5) * 0.14 + (m - 0.5) * 0.08) * lerp(1, sh, 0.6);
        c[0] = k; c[1] = k; c[2] = k;   // (the ground picture as it is; sh: the shade under the trees)
        const bare = sstep(0.55, 0.78, P.n3(x * 0.7 - 60, z * 0.7 + 30)) * 0.45 * nrLCf(x, z, 0);   // (the savanna: bare reddish patches)
        c[0] = lerp(c[0], k * 0.98, bare); c[1] = lerp(c[1], k * 0.88, bare); c[2] = lerp(c[2], k * 0.84, bare);
        const scr = nrLCf(x, z, 1), fld = nrLCf(x, z, 2), pad = nrLCf(x, z, 3);
        c[0] = lerp(c[0], k * 0.8, scr * 0.5); c[1] = lerp(c[1], k * 0.86, scr * 0.5); c[2] = lerp(c[2], k * 0.7, scr * 0.5);
        const row = 0.94 + 0.06 * Math.sin((x * 0.6 + z * 0.35) * 1.8);   // (the fields: pale sandy soil in faint rows)
        c[0] = lerp(c[0], k * 1.08 * row, fld * 0.8); c[1] = lerp(c[1], k * 1.0 * row, fld * 0.8); c[2] = lerp(c[2], k * 0.9 * row, fld * 0.8);
        c[0] = lerp(c[0], k * 0.98, pad * 0.7); c[1] = lerp(c[1], k * 0.84, pad * 0.7); c[2] = lerp(c[2], k * 0.76, pad * 0.7);
      } },
  });
  World.keep('NR', 'sindia');   // (its grids kept between its builds; World.build frees the others')
  World.ext.sindia = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
