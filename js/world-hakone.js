/* =========================================================================
   WORLD — Hakone (theme 'hakone'): its own builder (World.ext.hakone). What it uses of World comes from World.api: the helpers bound here
   once, the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, VRC, VRT, atSf, box, crowdCtx, crowdFinish, crowdRun, cyl, ouCutMat, pkGroundMat, rng, rpHash, vrCol, vrDist, vrGCol,
    vrGritTex, vrGround, vrLC, vrNear, vrPrep, vrSlope, vrTileGeo, vrTileOn, vrTreeGeo
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= HAKONE (theme 'hakone') =================
     One lap of the public roads round Hakone (Japan, docs/proga-hakone.md): national road 1 up from Yumoto past Miyanoshita and Kowakidani to
     its top (874 m) and down to Moto-Hakone, the old Tōkaidō (road 732) through the Seven Bends and Hatajuku back to Yumoto. A closed lap on
     Vršič's corridor helpers (vrPrep and the rest: the real terrain round the road from def.dem, the land cover def.lc), as the Irohazaka's.
     This is the first world (sklop 2 of the plan): the terrain, the road with Japan's markings, its bridges and guardrails, the forest within
     60 m of the road and the start; the towns, the railway, the old road's stones, the lake and Mount Fuji come with sklop 3. Only the places'
     names anywhere, no firms or brands. */
  function buildHakone(scene, tex, opts) {
    const N = T.N, w = T.w, dens = opts.density || 1, def = T.def, ds = T.ds, W = (i) => (i % N + N) % N;
    const root = new THREE.Group(); scene.add(root);
    API.VRS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (as Vršič: the autumn colours; winter snows them over)
    const out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], season: API.VRS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep();
    const P = API.VR, sStart = T.startS, base = P.D.base;
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat: the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    out.marks = {};

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = vrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(vrTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road, round the whole lap: asphalt, the white dashed line between the two lanes and the solid white edge lines (Japan's markings),
       a gravel shoulder, then the verge out to a ditch past the barrier line; on a bridge the deck out to its parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast, grp) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += ds / 2) onBr[T.idx(s)] = 1;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = [0.8, 0.78, 0.74], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          if (k === 4) return vrGCol(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0; return vrCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N); i++) {
          const j = W(i + 1), v0 = i * ds / tileL, v1 = (i + 1) * ds / tileL, s0 = i * ds / 6, s1 = (i + 1) * ds / 6;   // (the lap closes: the last sample joins the first)
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          const ln = [[w - 0.45, w - 0.3], [-(w - 0.3), -(w - 0.45)]];   // (the edge lines)
          if (Math.floor(i / 2) % 4 < 2) ln.push([-0.07, 0.07]);   // (between the lanes: 4 m dashes, 4 m gaps)
          for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // the chequered start and finish line
      const gq = new GB(true), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      { const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.14, 0.12], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.55, 0.3, 0.6]];
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false });

    /* ---- the start in Yumoto: pennants on poles along the road either side of the line ---- */
    for (let s = sStart - 60; s < sStart + 50; s += 10) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3);
      const gp = scen.get(px, pz), py = vrGround(px, pz), col = fans[Math.floor(rpHash(Math.round(s), side + 3) * fans.length)]; cyl(gp, px, py - 0.2, pz, 0.05, 5.2, 4, [0.9, 0.9, 0.92]);
      box(gp, px + T.tx[ii] * 0.45, py + 4.2, pz + T.tz[ii] * 0.45, 0.9, 1.6, 0.04, T.hd[ii], col); exclPush(px, pz, 1.2); }

    /* ---- concrete parapets on the bridges, white guardrails where the ground falls away beside the road and round the outside of the tighter
       bends; a delineator post every ~50 m where there is neither ---- */
    let nRail = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let n = -8; n <= (c.i1 - c.i0 + N) % N + 8; n++) need[sd][W(c.i0 + n)] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], si = side > 0 ? 1 : 0, gA = (d) => { const o = side * (bar + d); return vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        for (const d of [4, 8, 13, 19, 26]) if (gA(d) < -(d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[si][i] = 1; need[si][W(i + 1)] = 1; break; } }
      const white = [0.92, 0.92, 0.9], whiteB = [0.72, 0.72, 0.7], postC = [0.86, 0.86, 0.84];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (onBr[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N; i++) {
          const j = W(i + 1), g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[j]) {   // a bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(j, -0.1, -0.05), c = Q(j, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(j, -0.1, 0.4), c2 = Q(j, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.7, 0.69, 0.66], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.78, 0.77, 0.74], inn);
          } else if (nd[i] && nd[j]) {   // the white W-beam guardrail: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(j, 0.45), c = Q(j, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, white, ins); g.quadO(a, b, c, d, whiteB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!onBr[i] && i % 25 === 0) {   // a delineator post
            const o = side * (bar[i] + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], gp = scen.get(p[0], p[2]);
            box(gp, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(gp, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.9, 0.5, 0.1], null, true);
          }
        }
      }
    }

    /* ---- spectators at the start ---- */
    {
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded, sit: 0.25, flag: 0.1, keepBar: 1.6 };
      for (const sd of [-1, 1]) crowdRun(CR, sStart - 70, sStart + 70, sd, Object.assign({}, M, { rows: 3, dens: 0.6, label: 'HK start' }));
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds

    /* ---- the forest within 60 m of the road (instanced per 96 m chunk): Japanese cedars and cypresses (as tall, narrow conifers), broadleaves
       (beeches, oaks, maples) and a few birches, right up to the ditch; beyond 60 m only the terrain (the corridor's own colours) ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 2, 4].map(k => new IChunks(vrTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(4423), SP = 5.6 / Math.sqrt(dens), su = API.VRS === 'summer';
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > Math.min(60, LOD.radius(250))) continue;   // (the rule of 60 m: only what the camera behind the car sees)
          const c = vrLC(x, z), p = c === 1 ? 0.95 : c === 2 ? 0.55 : c === 0 ? 0.1 : c === 3 ? 0.08 : 0.03;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.15) continue;
          if (excluded(x, z)) continue;
          const y = vrGround(x, z); if (vrSlope(x, z) > 1.3) continue;   // (none on the cliffs)
          const sp = r3 < 0.5 ? 0 : r3 < 0.9 ? 1 : 2;   // (cedars, broadleaves, birches)
          let hgt, wid, col;
          if (sp === 0) { hgt = 20 + r4 * 14; wid = hgt * (0.28 + r2 * 0.08); col = [0.78 + r2 * 0.14, 0.86 + r4 * 0.12, 0.82]; }
          else if (sp === 1) { hgt = 12 + r4 * 9; wid = hgt * (0.75 + r2 * 0.25); col = su ? [0.95 + r2 * 0.1, 1, 0.95] : (r2 < 0.4 ? [1.1, 1.0, 0.9] : [1, 1, 1]); }
          else { hgt = 10 + r4 * 6; wid = hgt * (0.6 + r2 * 0.2); col = [1, 1, 1]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3), base };   // (read by the tests)
    return out;
  }

  World.ext.hakone = (scene, tex, opts) => buildHakone(scene, tex, opts);
})();
