/* =========================================================================
   WORLD — Kildare, Irska (theme 'kildare'): the rallycross lap of the circuit in County Kildare north-west of Naas, among the pastures and
   the hedgerows of the plain, its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html).
   Its look (RB_LOOK.kildare) goes on API.rbLook; World.ext.kildare builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A5), the
   track: docs/proge/kildare.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl): the hedgerows' ash and sycamore (js/world.js's beech), Sitka spruce planted
   in blocks (js/world-harju.js's spruce); the road's gravel (def.surf: the builder draws it); the circuit's other raceways round the lap,
   the layouts this lap leaves out (def.sk.race: OpenStreetMap), out past the barriers: the pit lane behind the pit wall along the finish
   straight, the old tarmac corners beside the gravel, the gravel crossing the south straight; the footbridge over the lap after the start
   (def.sk.foot), the pit garages along the finish straight, the race-control tower by the line, the paddock's buildings and halls
   (def.sk.bld), the power lines on wooden poles and steel towers (def.sk.power: Sosnová's soPower, js/world-sosnova.js), the plain on the
   horizon (def.far: Riverside's rsFar); the Irish tricolour among the fans' flags (World.flagMesh's upright bands); no air show (LK.air false: a club
   circuit). Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { Chunks, box, lerp, nrGround, nrLCf, nrNear, nrDist, rng, sstep } = API;
  // the text boards: place names (the county in English and in Irish, the country in both, the town and the village by the circuit, the
  // province), the grandstand's name (def.stands) and the start line's
  const KD_BAN = [['KILDARE', '#169b62', '#fff', '#ff883e'], ['CILL DARA', '#ff883e', '#fff', '#fff'], ['START · FINISH', '#16181c', '#fff', '#169b62'], ['ÉIRE', '#169b62', '#fff', '#fff'],
    ['IRELAND', '#1d3f6e', '#fff', '#169b62'], ['NAAS', '#245a3a', '#fff', '#ff883e'], ['CARAGH', '#1d3f6e', '#fff', '#fff'], ['LEINSTER', '#245a3a', '#fff', '#169b62']];
  const KD_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const KD_SHIRTS = [[0.09, 0.61, 0.38], [0.95, 0.95, 0.93], [1.0, 0.53, 0.24], [0.12, 0.14, 0.2], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [0.09, 0.5, 0.32], [0.2, 0.3, 0.5],
    [0.86, 0.14, 0.16], [0.9, 0.9, 0.88], [0.5, 0.42, 0.32], [0.3, 0.5, 0.75]];   // the fans' shirts: the national green, white and orange, navy, grey and black, a few others
  const IE = { up: [[0.09, 0.61, 0.38], [0.96, 0.96, 0.95], [1.0, 0.53, 0.24]] };   // the Irish flag: green, white and orange, the green at the pole (World.flagMesh's upright bands)
  const KD_POLE = [0.34, 0.26, 0.19];   // the wooden poles of the country's lines (soPower: a pole's colour)

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods and the hedgerows' trees, 2 the fields, 3 built-up): 0 a broadleaf
  // (the ash, sycamore and oak of the hedgerows: js/world.js's beech), 1 Sitka spruce (js/world-harju.js's spruce); 2-3 the plainer ones far
  // from the road. The woods broadleaf, the spruce planted in blocks of their own (the noise); lone broadleaves in the hedgerows on the open
  // land and by the buildings. (Two kinds, not three: a draw call less each in every chunk)
  const KD_WOODS = {
    n: 2, geo: (k) => (k % 2 === 0 ? API.nrTreeGeo(k >= 2 ? 3 : 1) : API.hjTreeGeo(0, k >= 2)),
    cr: [0.33, 0.26], p: [0.012, 0.9, 0.006, 0.02],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.6 + 260, z * 0.6 - 410); sp = blk < 0.3 && r > 0.1 ? 1 : 0; h = sp === 0 ? 13 + r2 * 8 : 15 + r2 * 7; }
      else if (cl === 3) { sp = 0; h = 8 + r2 * 6; }
      else { sp = r < 0.92 ? 0 : 1; h = sp === 0 ? 9 + r2 * 7 : 11 + r2 * 6; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.9 + r2 * 0.25 : 0.46 + r2 * 0.12)];
    },
  };

  // the buildings (def.sk.bld: OpenStreetMap outlines as boxes [x, z, length, width, angle, height, kind]): the pit garages in a long row,
  // their roller doors and a concrete apron to the pit lane, a green fascia under the roof's lip; the race-control tower by the line, white,
  // glazed all round its top floor; the halls in grey-green cladding; the paddock's other buildings white or cream render under dark slate
  function kdBuildings({ scen, exclPush, CR }, st) {
    const T = API.T, b7 = (T.def.sk || {}).bld || [], R = rng(6217), GREEN = [0.1, 0.36, 0.24];
    const WALL = [[0.94, 0.93, 0.9], [0.9, 0.87, 0.78], [0.82, 0.82, 0.8]], ROOF = [[0.26, 0.27, 0.3], [0.34, 0.35, 0.37]];
    for (let k = 0; k < b7.length; k += 7) {
      const [x, z, L, W, deg, h, kind] = b7.slice(k, k + 7), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), g = scen.get(x, z);
      const gr = (a, b, l, w) => nrGround(x + (a * l * c - b * w * s) / 2, z + (a * l * s + b * w * c) / 2);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, gr(a, b, L, W));
      if (kind === 4) {   // the pit garages: a roller door every 4 m on the side to the road (blue-grey, one in five lighter), the apron in front
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, [0.86, 0.87, 0.86], [0.4, 0.41, 0.42], true);
        box(g, x, y + h, z, L + 0.3, 0.32, W + 0.6, rot, GREEN, [0.36, 0.37, 0.38]);
        const q = nrNear(x, z), sd = q.i >= 0 && ((T.px[q.i] - x) * -s + (T.pz[q.i] - z) * c) > 0 ? 1 : -1, nd = Math.max(1, Math.floor(L / 4));
        for (let d = 0; d < nd; d++) { const u = (d + 0.5 - nd / 2) * (L / nd), fx = x + c * u - s * sd * (W / 2 + 0.03), fz = z + s * u + c * sd * (W / 2 + 0.03);
          box(g, fx, y, fz, 3.2, Math.min(3.0, h - 0.6), 0.04, rot, d % 5 === 2 ? [0.62, 0.66, 0.7] : [0.42, 0.46, 0.52]); }
        { const D = 3.6, ax = x - s * sd * (W / 2 + D / 2), az = z + c * sd * (W / 2 + D / 2); let y0 = 1e9, y1 = -1e9;   // (the apron: its top 5 cm over the highest ground under it)
          for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const yy = nrGround(ax + (a * L * c - b * D * s) / 2, az + (a * L * s + b * D * c) / 2); y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); }
          box(g, ax, y0 - 0.25, az, L, y1 - y0 + 0.3, D, rot, [0.66, 0.66, 0.64], [0.7, 0.7, 0.68], true); }
        st.garages++;
      } else if (kind === 6) {   // the tower: white render, the race control's glazing round its top floor, a band of windows lower down, a flat roof with a lip
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, [0.93, 0.93, 0.91], [0.36, 0.37, 0.39], true);
        box(g, x, y + h - 3.2, z, L + 0.06, 2.3, W + 0.06, rot, [0.17, 0.24, 0.3]);
        box(g, x, y + h * 0.4, z, L + 0.04, 1.3, W + 0.04, rot, [0.22, 0.29, 0.35]);
        box(g, x, y + h, z, L + 0.6, 0.32, W + 0.6, rot, GREEN, [0.34, 0.35, 0.37]);
        st.tower++;
      } else {
        const wc = kind === 5 ? [0.55, 0.6, 0.57] : WALL[Math.floor(R() * 3)], rc = kind === 5 ? [0.4, 0.43, 0.42] : ROOF[Math.floor(R() * 2)];
        box(g, x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      }
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
  }

  // a sloping plate from a to b (the middle of its top), w wide, th thick under it: the flights of steps
  function kdSlab(g, a, b, w, th, col, top) {
    const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, ox = -dz / l * w / 2, oz = dx / l * w / 2;
    const A = [a[0] - ox, a[1], a[2] - oz], B = [b[0] - ox, b[1], b[2] - oz], C = [b[0] + ox, b[1], b[2] + oz], D = [a[0] + ox, a[1], a[2] + oz];
    const dn = (p) => [p[0], p[1] - th, p[2]], A2 = dn(A), B2 = dn(B), C2 = dn(C), D2 = dn(D), inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - th / 2, (a[2] + b[2]) / 2];
    g.quadO(A, B, C, D, top || col, inn); g.quadO(A2, B2, C2, D2, col, inn);
    g.quadO(A, B, B2, A2, col, inn); g.quadO(D, C, C2, D2, col, inn); g.quadO(A, D, D2, A2, col, inn); g.quadO(B, C, C2, B2, col, inn);
  }

  // the footbridge over the lap after the start (def.sk.foot: OpenStreetMap, its steps down at each end along it): a steel deck 5.4 m over the
  // road between two pairs of columns just past the barriers (at least as long as OpenStreetMap's), its sides plated in the circuit's green, a
  // handrail along their top; a straight flight of steps down at each end, away from the road (36°), its stringers and handrails
  function kdBridge({ scen, exclPush, CR }, st) {
    const T = API.T, rod = API.ouRod, PLATE = [0.12, 0.34, 0.24], STL = [0.36, 0.38, 0.4], DECK = [0.52, 0.52, 0.5];
    for (const f of (T.def.sk || {}).foot || []) {
      const ax = f[0], az = f[1], bx = f[f.length - 2], bz = f[f.length - 1], L = Math.hypot(bx - ax, bz - az); if (L < 6) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, px = -uz, pz = ux, rot = Math.atan2(uz, ux), at = (t, o, y) => [ax + ux * t + px * o, y, az + uz * t + pz * o], gAt = (t) => nrGround(ax + ux * t, az + uz * t);
      let tc = -1, bd = 1e9; for (let t = 0; t <= L; t += 0.25) { const q = nrNear(ax + ux * t, az + uz * t); if (q.i >= 0 && q.d < bd) { bd = q.d; tc = t; } }
      if (tc < 0 || bd > 3) continue;
      const yd = T.hy[nrNear(ax + ux * tc, az + uz * tc).i] + 5.4, yt = yd + 0.45;   // (the deck's underside over the road, its walkway)
      const out = (sg) => { let t = tc; while (Math.abs(t - tc) < 40) { t += sg * 0.25; const q = nrNear(ax + ux * t, az + uz * t); if (q.i < 0 || q.dd > 1.4) break; } return t; };
      const t0 = Math.min(0, out(-1) - 0.6), t1 = Math.max(L, out(1) + 0.6), [cx, , cz] = at((t0 + t1) / 2, 0, 0), g = scen.get(cx, cz);
      box(g, cx, yd, cz, t1 - t0, 0.45, 2.6, rot, STL, DECK);   // the deck
      for (const sd of [-1, 1]) {   // its sides: plated, a handrail on top
        const [sx, , sz] = at((t0 + t1) / 2, sd * 1.36, 0);
        box(g, sx, yd + 0.05, sz, t1 - t0, 1.5, 0.12, rot, PLATE, PLATE);
        rod(g, at(t0, sd * 1.36, yt + 1.18), at(t1, sd * 1.36, yt + 1.18), 0.045, STL, 4);
      }
      for (const [te, sg] of [[t0, -1], [t1, 1]]) {
        for (const sd of [-1, 1]) {   // the columns under the deck's end
          const [x, , z] = at(te - sg * 0.7, sd * 1.0, 0), y = nrGround(x, z);
          box(scen.get(x, z), x, y - 0.3, z, 0.36, yd - y + 0.3, 0.36, rot, STL);
          exclPush(x, z, 1.5); CR.avoid(x, z, 1);
        }
        const run = Math.max(3, (yt - gAt(te + sg * 7.5)) / 0.72);   // the steps: 36°, 1.6 m wide
        const a = at(te, 0, yt), b = at(te + sg * run, 0, gAt(te + sg * run) + 0.02), gs = scen.get(a[0], a[2]);
        kdSlab(gs, a, b, 1.6, 0.35, STL, DECK);
        for (const sd of [-1, 1]) {   // the stringers and the handrails
          const sa = at(te, sd * 0.86, yt + 0.12), sb = at(te + sg * run, sd * 0.86, b[1] + 0.12);
          kdSlab(gs, sa, sb, 0.1, 0.5, PLATE);
          rod(gs, [sa[0], sa[1] + 0.95, sa[2]], [sb[0], sb[1] + 0.95, sb[2]], 0.04, STL, 4);
        }
        for (let t = 0; t <= run; t += 2) { const [x, , z] = at(te + sg * t, 0, 0); exclPush(x, z, 1.8); CR.avoid(x, z, 1.2); }
      }
      st.bridge++;
    }
  }

  // the circuit's other raceways (def.sk.race: [surface (0 asphalt, 5 gravel), [x, z, ...]]: OpenStreetMap; the layouts this lap leaves out,
  // the pit lane), within 200 m of the road: ribbons on the ground (asphalt 8.2 m wide, white lines at its edges; gravel 9 m), every 1.5 m near
  // the road and 3 m farther out, five points across; only past the barriers (the points inside them moved out to the barrier's back, the
  // parts with none outside left out: the junctions closed by the lap's barriers); the trees and the crowds keep off them. In 512 m chunks
  // (a few draws: the asphalt, the gravel)
  function kdRace({ root, tex, exclPush, CR }, st) {
    const R0 = (API.T.def.sk || {}).race || []; if (!R0.length) return;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const gMat = new THREE.MeshLambertMaterial({ map: tex.makadam || tex.sand, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const CA = new Chunks(512, true), CG = new Chunks(512, true), ASP = [0.95, 0.95, 0.97], GRV = [0.92, 0.88, 0.8], LINE = [2.6, 2.6, 2.6], NA = 5;
    const inside = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < 0.25; };
    const uv = (p, k) => [p[0] / k, -p[2] / k];
    for (const [sf, pts] of R0) {
      const gv = sf === 5, hw = gv ? 4.5 : 4.1, C = gv ? CG : CA, col = gv ? GRV : ASP, UVK = gv ? 6 : 8;
      const P = []; for (let k = 0; k + 1 < pts.length; k += 2) P.push([pts[k], pts[k + 1]]);
      const cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
      const Lr = cum[cum.length - 1]; if (Lr < 3) continue;
      const pos = (t) => { let k = 1; while (k < cum.length - 1 && cum[k] < t) k++; const f = (t - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
        return [lerp(P[k - 1][0], P[k][0], f), lerp(P[k - 1][1], P[k][1], f)]; };
      const secs = [];   // the cross-sections: NA points (x, y, z, ok), the edge lines' points
      for (let t = 0; t <= Lr + 1e-6;) {
        const [cx, cz] = pos(t), [ex, ez] = pos(Math.min(Lr, t + 0.5)), [bx2, bz2] = pos(Math.max(0, t - 0.5)), dl = Math.hypot(ex - bx2, ez - bz2) || 1, nx = -(ez - bz2) / dl, nz = (ex - bx2) / dl;
        const rd = nrDist(cx, cz);
        if (rd < 200) {
          const row = [];
          for (let a = 0; a < NA; a++) { const o = -hw + 2 * hw * a / (NA - 1), x = cx + nx * o, z = cz + nz * o; row.push({ o, x, z, ok: !inside(x, z) }); }
          for (let a = 0; a < NA; a++) { const p = row[a]; if (p.ok) continue;   // (a point inside the barriers next to one outside: moved out to the barrier's back)
            const okL = a > 0 && row[a - 1].ok && !row[a - 1].moved, okR = a < NA - 1 && row[a + 1].ok && !row[a + 1].moved, nb = okL && okR ? null : okL ? row[a - 1] : okR ? row[a + 1] : null; if (!nb) continue;   // (not one alone between two outside)
            let lo = p.o, hi = nb.o; for (let it = 0; it < 6; it++) { const m = (lo + hi) / 2; if (inside(cx + nx * m, cz + nz * m)) lo = m; else hi = m; }
            p.x = cx + nx * hi; p.z = cz + nz * hi; p.o = hi; p.ok = true; p.moved = true; }
          for (const p of row) p.y = nrGround(p.x, p.z) + 0.06;
          const ln = gv ? null : [-1, 1].map(sd => { const o0 = sd * (hw - 0.45), o1 = sd * (hw - 0.3), x0 = cx + nx * o0, z0 = cz + nz * o0, x1 = cx + nx * o1, z1 = cz + nz * o1;
            return inside(x0, z0) || inside(x1, z1) ? null : [[x0, nrGround(x0, z0) + 0.09, z0], [x1, nrGround(x1, z1) + 0.09, z1]]; });
          secs.push({ row, ln });
          if (row.some(p => p.ok)) { exclPush(cx, cz, hw + 1.5); if (rd < 60) CR.avoid(cx, cz, hw + 1); }
        } else secs.push(null);
        if (t >= Lr) break;
        t = Math.min(Lr, t + (rd < 40 ? 1.5 : 3));
      }
      for (let j = 0; j + 1 < secs.length; j++) {
        const A = secs[j], B = secs[j + 1]; if (!A || !B) continue;
        for (let a = 0; a + 1 < NA; a++) {
          const p = [A.row[a], B.row[a], B.row[a + 1], A.row[a + 1]]; if (!p.every(q => q.ok)) continue;
          const v = p.map(q => [q.x, q.y, q.z]); C.get(v[0][0], v[0][2]).quadUp(v[0], v[1], v[2], v[3], [col, col, col, col], v.map(q => uv(q, UVK)));
          st.race++;
        }
        if (A.ln) for (let m = 0; m < 2; m++) { const la = A.ln[m], lb = B.ln && B.ln[m]; if (!la || !lb) continue;
          CA.get(la[0][0], la[0][2]).quadUp(la[0], lb[0], lb[1], la[1], [LINE, LINE, LINE, LINE], [uv(la[0], 8), uv(lb[0], 8), uv(lb[1], 8), uv(la[1], 8)]); }
      }
    }
    CA.addTo(root, aMat, false, true); CG.addTo(root, gMat, false, true);
  }

  // the horizon (def.far, Riverside's rsFar): the plain's pasture, the darker woods and the hills' moorland, in the haze
  const kdFarCol = (h, d) => {
    const c = h < 110 ? [0.3, 0.43, 0.24] : h < 170 ? [0.29, 0.39, 0.23] : [0.37, 0.37, 0.27], f = (1 - Math.exp(-d / 22000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.72, 0.77, 0.83][k], f));
  };

  // LK.extra: the buildings, the footbridge, the other raceways, the power lines, the horizon; before the crowds and the trees, which keep
  // clear of them
  function kdExtra(o) {
    const T = API.T, st = { buildings: 0, garages: 0, tower: 0, bridge: 0, race: 0, pylons: 0, spans: 0, far: 0 };
    kdBuildings(o, st); kdBridge(o, st); kdRace(o, st);
    if (API.soPower) API.soPower(o, st, KD_POLE);
    if (T.def.far && API.rsFar) { o.out.dyn.far = API.rsFar(o.root, T.def.far, 'summer', 6, kdFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    kildare: { ban: KD_BAN, at: KD_AT, nums: 0, shirts: KD_SHIRTS, smoke: false, camps: 0, seC: [1.02, 1.01, 0.92], gravel: true, noVid: true, mow: 0.6,
      woods: KD_WOODS, extra: kdExtra, fl: { ie: IE }, ck: 2, air: false,   // (ck: chunks twice as big: from most places much of the short circuit is in view)
      flags: { stand: [{ ie: 0.7, tm: 0.2, rb: 0.1 }, { ie: 0.6, tm: 0.25, rb: 0.15 }], ga: { ie: 0.65, tm: 0.25, rb: 0.1 }, camp: { ie: 0.8, tm: 0.2 }, pole: 'ie', podium: 'ie' },
      vid: [], poles: [-100, 30, -1], runoff: ['KILDARE', 'CILL DARA', 'ÉIRE'], straight: [-120, 25, -1],   // (the pit lane on the right of the finish straight)
      farm: { wall: [0.93, 0.92, 0.88], roof: [0.26, 0.27, 0.3], end: [0.92, 0.91, 0.87], barn: [0.5, 0.52, 0.5], barnRoof: [0.3, 0.33, 0.31], barnEnd: [0.5, 0.52, 0.5] },   // a white farmhouse under slate, a grey barn under dark sheeting
      tvSkip: [1, 2, 4, 5, 6], recov: [3], photo: [0, 3, 7], jets: [[0.09, 0.61, 0.38], [0.95, 0.95, 0.95], [1.0, 0.53, 0.24]],   // (TV towers at the gravel right after the start and at the two hairpins)
      colMod: (P) => (x, z, c) => {   // the plain in summer: the pasture lush and deep green, in lighter and darker patches, rushes in the wet hollows; the fields grazed, cut for silage, barley; the paddock grey through the grass
        const n = P.n5(x * 0.55 + 310, z * 0.55 - 170), m = P.n3(x * 1.6 - 60, z * 1.6 + 40), k = 0.93 + (n - 0.5) * 0.2 + (m - 0.5) * 0.1;
        c[0] *= k * 0.93; c[1] *= k * 1.05; c[2] *= k * 0.93;
        { const fm = nrLCf(x, z, 0), wet = sstep(0.62, 0.84, P.n1(x * 1.1 + 140, z * 1.1 - 260)) * 0.4 * fm;
          c[0] = lerp(c[0], c[0] * 0.8, wet); c[1] = lerp(c[1], c[1] * 0.92, wet); c[2] = lerp(c[2], c[2] * 0.78, wet); }
        const f = nrLCf(x, z, 2);
        if (f > 0) { const t = P.n1(x * 0.3 - 700, z * 0.3 + 120), col = t < 0.5 ? [0.9, 1.06, 0.8] : t < 0.75 ? [1.12, 1.1, 0.72] : [1.3, 1.12, 0.6];
          c[0] = lerp(c[0], c[0] * col[0], f * 0.8); c[1] = lerp(c[1], c[1] * col[1], f * 0.8); c[2] = lerp(c[2], c[2] * col[2], f * 0.8); }
        const a = nrLCf(x, z, 3);
        if (a > 0) { const g = 0.52 + (m - 0.5) * 0.1; c[0] = lerp(c[0], g, a * 0.55); c[1] = lerp(c[1], g, a * 0.55); c[2] = lerp(c[2], g * 0.98, a * 0.55); }
      } },
  });
  World.keep('NR', 'kildare');   // (its grids kept between its builds; World.build frees the others')
  World.ext.kildare = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
