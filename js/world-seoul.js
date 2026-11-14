/* =========================================================================
   WORLD — Seoul (theme 'seoul'): a city race over Namsan, the wooded hill in the middle of Seoul (docs/proge/seoul.md). Its own builder
   (World.ext.seoul) in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land
   cover; London's city builders, made for an open road: nothing wraps) and the scenery data of js/data/seoul.js (OpenStreetMap, Copernicus
   DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detail only within ~60 m of the road, as the chase camera sees it: the park's woods of red pine and oak and the cherry
   trees along the road, the old city wall of granite with its parapet, the street race's concrete blocks and catch fences, the lamps, the
   zebra crossings and the traffic lights in the town; the houses at the foot of the hill in their OSM footprints. Only generic shapes, with
   no names, words or signs: the tower on the summit (a concrete shaft, a cabin, a red and white mast), the octagonal pavilion, the
   viewpoints' decks, the bus park with its buses, the bus stops, the poem stone (no inscription) and a figure on a plinth (no name).
   Farther out the city's blocks (the surface model) and the river.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { AB, aPuff, aTrunk } = API;   // (Drevesa A: the soft trees' kit, docs/drevesa-a.md)
  const {
    Chunks, GB, IChunks, NRC, NRT, RB, TAU, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl, gable, hjCutMat, ico,
    inPoly, lerp, nrDist, nrFar, nrGround, nrLC, nrLCf, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng, rock, sstep, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const RIVER = 2.5;   // the Han in the game (m above the sea, as the track's heights): far out, beyond the haze

  // ---- the trees (unit height 1, instanced, the soft look A): 0 a red pine (a tall bare reddish trunk, its crown of dark clumps high up),
  //      1 an oak (a broad round crown), 2 a cherry (lower, spreading: the rows along the road), 3 and 4 the pine and the oak far from the road
  //      (cheaper, no shadows) ----
  function seTreeGeo(kind) {
    const b = new AB(), R = rng(7110 + kind), sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const pn = [0.15, 0.26, 0.12], oak = [0.23, 0.36, 0.14], chy = [0.27, 0.4, 0.16];
    if (kind === 0) {   // (34 faces)
      aTrunk(b, 0, -0.02, 0, 0.024, 0.8, 4, [0.52, 0.33, 0.23]);
      aPuff(b, -0.04, 0.8, 0.02, 0.2, 0.42, pn, R, 0.35, 0.5, 1.3); aPuff(b, 0.09, 0.67, -0.05, 0.15, 0.45, sh(pn, 1.08), R, 0.35, 0.5, 1.3, -0.4);
    } else if (kind === 1) {   // (34 faces)
      aTrunk(b, 0, -0.02, 0, 0.035, 0.6, 4, [0.36, 0.32, 0.27]);
      aPuff(b, -0.03, 0.62, -0.02, 0.32, 0.85, oak, R, 0.24, 0.55, 1.35); aPuff(b, 0.12, 0.55, 0.08, 0.22, 0.85, sh(oak, 1.06), R, 0.22, 0.55, 1.35, -0.4);
    } else if (kind === 2) {   // (24 faces)
      aTrunk(b, 0, -0.02, 0, 0.045, 0.45, 4, [0.3, 0.24, 0.22]);
      aPuff(b, 0, 0.6, 0, 0.42, 0.6, chy, R, 0.25, 0.55, 1.35);
    } else if (kind === 3) {   // (23 faces)
      aTrunk(b, 0, -0.02, 0, 0.03, 0.7, 3, [0.45, 0.3, 0.22]); aPuff(b, 0, 0.76, 0, 0.22, 0.5, pn, R, 0.3, 0.5, 1.3);
    } else {   // (20 faces)
      aPuff(b, 0, 0.58, 0, 0.36, 0.9, oak, R, 0.25, 0.55, 1.35);
    }
    return b.geometry();
  }
  function seGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a soft grey mottle and fine grit, no hue of its own
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(7101), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(7102, 40), n2 = valueNoise2(7103, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.84 + wr(n1, i, j) * 0.12 + wr(n2, i, j) * 0.08 + (r() - 0.5) * 0.08;
      d[o] = Math.min(255, 214 * k); d[o + 1] = Math.min(255, 212 * k); d[o + 2] = Math.min(255, 206 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  const flat2 = (fl) => { const p = []; for (let k = 0; k + 1 < fl.length; k += 2) p.push([fl[k], fl[k + 1]]); return p; };
  function obb(pts) {   // the oriented box of a footprint along its longest wall
    let bl = 0, ba = 0, cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length;
    for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; ba = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; const c = Math.cos(ba), s = Math.sin(ba);
    for (const p of pts) { const u = (p[0] - cx) * c + (p[1] - cz) * s, v = -(p[0] - cx) * s + (p[1] - cz) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    return { x: cx + c * (u0 + u1) / 2 - s * (v0 + v1) / 2, z: cz + s * (u0 + u1) / 2 + c * (v0 + v1) / 2, L: u1 - u0, W: v1 - v0, ang: ba, c, s };
  }
  function flatRoof(g, pts, y, col) {   // a flat roof over any footprint (triangulated)
    let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) { return; }
    for (const [a, b, c] of tris) g.triUp([pts[a][0], y, pts[a][1]], [pts[b][0], y, pts[b][1]], [pts[c][0], y, pts[c][1]], [col, col, col]);
  }
  function lineDist(pts, x, z) {   // the distance from (x, z) to an open polyline
    let d = 1e9; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); }
    return d;
  }

  function buildSeoul(scene, tex, opts) {
    const R = rng(7100), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, def = T.def, L = T.len, SD = SE_DATA;
    if (!def.dem) { def.dem = SD.dem; def.lc = SD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    nrPrep();
    const P = API.NR, G = P.G, NRN = API.NRN;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };   // (hjCutMat: what of a building hides the car or the road just ahead of it on the screen fades)
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1], bar = (i, side) => side > 0 ? T.br[i] : T.bl[i];
    const eh = new Map(), EHC = 32;   // what keeps the trees and the lamps off (the buildings, the start, the landmarks, the wall), hashed circles
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    // the road's two ends: nrNear's road height right past them reads across a loop's seam (the open road's other end, 60 m lower or higher),
    // so there the ground is made as nrH makes it beside the road, from that end's own height
    P.pad = (x, z, h) => {
      for (const i of [0, N - 1]) {
        const dx = x - T.px[i], dz = z - T.pz[i]; if (dx * dx + dz * dz > 6400) continue;
        const al = dx * T.tx[i] + dz * T.tz[i]; if (i === 0 ? al >= 0 : al < 0) continue;
        const keep = NRN.dd, n = nrNear(x, z), ni = n.i, dd = n.dd, hs = n.h; NRN.dd = keep; if (ni !== i) continue;
        const hn = T.hy[i]; let v = lerp(hn, hs, sstep(0, 6, dd)) - 0.3;
        if (dd > 1) v = lerp(v, nrFar(x, z), sstep(2, 60, dd));
        return dd < 6 ? Math.min(v, hn - 0.3 + 0.12 * dd * dd) : v;
      }
      return h;
    };
    // the ground's colours: the woods' floor of needles and leaves, the park's lawns, the town's paving, the grass of the open slopes; bare earth
    // on the steep banks
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), pk = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.52 + (m - 0.5) * 0.1, g = 0.56 + (m - 0.5) * 0.08, b = 0.33 + (q - 0.5) * 0.06;
      const wd = clamp(fo + cov * 0.6, 0, 1); r = lerp(r, lerp(0.42, 0.3, q) + m * 0.06, wd); g = lerp(g, lerp(0.37, 0.41, q) + m * 0.05, wd); b = lerp(b, lerp(0.25, 0.2, q), wd);   // (the woods' floor: needles and leaves in patches of green undergrowth)
      r = lerp(r, 0.44 + m * 0.06, pk); g = lerp(g, 0.6 + m * 0.05, pk); b = lerp(b, 0.3, pk);
      const pv = se * (1 - clamp(cov, 0, 1) * 0.5); r = lerp(r, 0.78 + (m - 0.5) * 0.06, pv); g = lerp(g, 0.77 + (m - 0.5) * 0.06, pv); b = lerp(b, 0.74 + (q - 0.5) * 0.04, pv);
      const st = sstep(0.85, 0.66, ny) * (1 - pv) * 0.7; r = lerp(r, 0.6, st); g = lerp(g, 0.52, st); b = lerp(b, 0.42, st);
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gTex = ownTex(seGroundTex()), gMat = new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt in sections, the white edge lines and the lanes' dashes, the zebra crossings, the start's line and the finish's
       chequered line ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), WL = [0.9, 0.9, 0.86];
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 30 + Math.floor(crH(k, 3, 71) * 50), t = 0.9 + crH(k, 5, 71) * 0.14; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.78 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1;
      for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
        const w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = i * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const l = gl.row([Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.38, 0.034), Pt(i, w - 0.38, 0.034), Pt(i, w - 0.22, 0.034)], [WL, WL, WL, WL]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
      }
      addM(gr, aMat); addM(gl, lMat);
    }
    const CROSS = SD.cross.map(([s, sig]) => ({ s, sig }));
    const nearCross = (s, m) => CROSS.some(c => Math.abs(c.s - s) < m);
    {
      const gm = new Chunks(256), y = 0.036;
      // the lanes' dashes (4 m in every 10, 15 cm wide): two lanes on the park's roads, as many as fit on Sowol-ro; none over the crossings
      // and the lines of the start and the finish
      for (let i = 0; i + 2 < N; i += 5) {
        const s = i * ds; if (nearCross(s + 2, 9) || Math.abs(s - sStart) < 12 || Math.abs(s - sFin) < 12) continue;
        const w = T.wAt(i), n = Math.max(2, Math.round(2 * w / 3.3)), g = gm.get(T.px[i], T.pz[i]);
        for (let k = 1; k < n; k++) { const o = -w + k * 2 * w / n; g.quadUp(Pt(i, o - 0.075, y), Pt(i, o + 0.075, y), Pt(i + 2, o + 0.075, y), Pt(i + 2, o - 0.075, y), [WL, WL, WL, WL]); }
      }
      // the zebra crossings: bars 45 cm wide along the road, 4 m long, across the whole width; a stop line before those with traffic lights
      const HY = (p) => T.hy[p[3]] + y;
      const bar2 = (g, s0, s1, o0, o1) => { const a = atSf(s0, o0), b = atSf(s0, o1), c = atSf(s1, o1), d = atSf(s1, o0); g.quadUp([a[0], HY(a), a[1]], [b[0], HY(b), b[1]], [c[0], HY(c), c[1]], [d[0], HY(d), d[1]], [WL, WL, WL, WL]); };
      for (const c of CROSS) {
        if (c.s < 6 || c.s > L - 6) continue;
        const i = T.idx(c.s), w = T.wAt(i), g = gm.get(T.px[i], T.pz[i]);
        for (let o = -w + 0.45; o + 0.45 <= w - 0.3; o += 0.9) bar2(g, c.s - 2, c.s + 2, o, o + 0.45);
        if (c.sig) bar2(g, c.s - 6.5, c.s - 6.0, -w + 0.3, w - 0.3);
      }
      bar2(gm.get(T.px[T.startIdx], T.pz[T.startIdx]), sStart - 0.25, sStart + 0.25, -T.wAt(T.startIdx), T.wAt(T.startIdx));   // (the start's line)
      gm.addTo(root, lMat, false, true);
      const iF = T.idx(sFin), wF = T.wAt(iF), gq = new GB(true), uM = Math.round(wF * 2 / 0.8) / 16, HYp = (p) => T.hy[p[3]];   // the finish's chequered line
      const a = atSf(sFin - 0.8, -wF), b = atSf(sFin - 0.8, wF), c = atSf(sFin + 0.8, wF), d = atSf(sFin + 0.8, -wF);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- the barriers (Core's T.bl / T.br): the concrete blocks of a street race, 2 m each in two greys, red and white on the bends; the catch
       fence over them all the way; blocks across both ends of the road ---- */
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const CON = [0.74, 0.74, 0.72], COND = [0.58, 0.58, 0.57], RED = [0.78, 0.18, 0.16], WHT = [0.92, 0.92, 0.9];
    const bend = new Uint8Array(N); for (let i = 0; i + 4 < N; i++) { const a = T.hd[i], b = T.hd[i + 4]; let d = Math.abs(b - a); if (d > Math.PI) d = TAU - d; if (d > 0.22) for (let k = -6; k <= 10; k++) bend[clamp(i + k, 0, N - 1)] = 1; }
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) for (let i = c0; i < Math.min(c0 + RC, N - 1); i++) {
        const j = i + 1, s0 = i * ds, blk = Math.floor(s0 / 2) % 2, bi = bar(i, side), bj = bar(j, side);
        const top = bend[i] ? (blk ? RED : WHT) : (blk ? CON : CON.map(v => v * 0.93)), face = bend[i] ? top : (blk ? COND : COND.map(v => v * 0.95));
        let p = [Pt(i, side * (bi + 0.1), -0.4), Pt(i, side * (bi + 0.1), 0.82), Pt(i, side * (bi + 0.6), 0.82)], q = [Pt(j, side * (bj + 0.1), -0.4), Pt(j, side * (bj + 0.1), 0.82), Pt(j, side * (bj + 0.6), 0.82)];
        if (side < 0) { p = p.reverse(); q = q.reverse(); }
        const c = side < 0 ? [top, face, face] : [face, face, top];
        const ra = gr.row(p, c), rb = gr.row(q, c); gr.link(ra, rb, 0, 2);
      }
      addM(gr, rMat, true);
    }
    {
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
      for (let c0 = 0; c0 < N - 1; c0 += RC) { const gf = new RB(true);
        for (const side of [-1, 1]) { let pr = -1;
          for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) { const o = side * (bar(i, side) + 0.35), acc = i * ds;
            let p = [Pt(i, o, 0.8), Pt(i, o, 3.4)]; if (side < 0) p = p.reverse();
            const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; } }
        addM(gf, fMat); }
    }
    const scen = new Chunks(192);
    for (const [i, sg] of [[0, -1], [N - 1, 1]]) { const ex = T.px[i] + T.tx[i] * sg * 1.0, ez = T.pz[i] + T.tz[i] * sg * 1.0;
      for (let o = -T.bl[i]; o <= T.br[i]; o += 2.05) { const bx = ex + T.nx[i] * o, bz = ez + T.nz[i] * o; box(scen.get(bx, bz), bx, T.hy[i] - 0.1, bz, 0.7, 0.92, 1.95, T.hd[i], [0.8, 0.8, 0.78], CON); } }

    /* ---- the verges between the asphalt and the blocks and a little beyond: a concrete kerb, then the ground's own colours (the woods' floor,
       the lawns, the town's paving), lifted onto the ground where it rises ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), b = bar(i, side), y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.5, 0.05], lift(Math.max(w + 0.9, b - 0.2), 0.0), lift(b + 0.8, 0.0), lift(b + 3.0, -0.12)];
    };

    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.5 });
    let nBld = 0, nMark = 0, nLamp = 0, nStop = 0, nWall = 0;
    const markRaw = SD.marks.map(([lab, kind, s, d, fl]) => ({ lab, kind, s, d, pts: flat2(fl) }));
    const solid = markRaw.filter(m => m.pts.length > 2 && (m.kind === 'tower' || m.kind === 'pavilion' || m.kind === 'buspark'));
    const inMark = (x, z) => solid.some(m => inPoly(m.pts, x, z));
    const groundMin = (pts) => { let y = 1e9; for (const [x, z] of pts) y = Math.min(y, nrGround(x, z)); return y; };
    const behind = (x, z, extra) => {   // a point of OSM by the road: where it falls inside the race's barriers, moved out behind them
      const nn = nrNear(x, z); if (nn.i < 0 || nn.dd >= extra) return [x, z, nn.i, nn.lat];
      const i = nn.i, sd = nn.lat >= 0 ? 1 : -1, al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], o = sd * (bar(i, sd) + extra);
      return [T.px[i] + T.tx[i] * al + T.nx[i] * o, T.pz[i] + T.tz[i] * al + T.nz[i] * o, i, o];
    };
    const STONE = [0.74, 0.72, 0.66], STONED = [0.62, 0.6, 0.55], TILE = [0.27, 0.28, 0.3], WOOD = [0.5, 0.36, 0.24], WOODT = [0.6, 0.45, 0.3], POST = [0.62, 0.16, 0.12];
    const DARK = [0.14, 0.14, 0.15], BRONZE = [0.36, 0.3, 0.22], GLASS = [0.32, 0.4, 0.44];

    const facC = new Chunks(256, true), gplain = new Chunks(256), roofs = new Chunks(256);   // (the walls with windows, the plain ground floors, the roofs)
    /* ---- the buildings' walls: rows of windows (tex.facade), a plainer ground floor on the shops' fronts ---- */
    function wallsOf(g, pts, y0, H, col, bay, shop) {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length, inside = [cx, y0 + H / 2, cz], G0 = shop ? 4.2 : 0;
      const base = col.map(v => v * 0.8), fl = (H - G0) / 3.2;
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.4) continue;
        const bays = Math.max(1, Math.round(len / bay));
        if (shop) gplain.get(cx, cz).quadO([a[0], y0 - 0.5, a[1]], [b[0], y0 - 0.5, b[1]], [b[0], y0 + G0, b[1]], [a[0], y0 + G0, a[1]], base, inside);
        g.quadO([a[0], y0 + G0, a[1]], [b[0], y0 + G0, b[1]], [b[0], y0 + H, b[1]], [a[0], y0 + H, a[1]], col, inside, [[0, 0], [bays, 0], [bays, Math.max(1, Math.round(fl))], [0, Math.max(1, Math.round(fl))]]);
      }
    }

    /* ---- the start: a gantry over the road with its five lights; the finish: a gantry with a chequered band (no words); few people by
       both, behind the fences ---- */
    const gantry = (s, chq) => {
      const i = T.idx(s), x = T.px[i], z = T.pz[i], h = T.hd[i], gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.0, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.4, 0.5, h, [0.3, 0.3, 0.32]);
      box(g, x, gy + 6.0, z, 0.6, 1.2, span * 2, h, [0.22, 0.22, 0.24]);
      if (!chq) for (let k = -2; k <= 2; k++) box(g, x + nx * k * 1.1 - T.tx[i] * 0.32, gy + 6.25, z + nz * k * 1.1 - T.tz[i] * 0.32, 0.1, 0.7, 0.7, h, [0.7, 0.08, 0.06]);
      else {   // the chequered band on the gantry's face toward the cars
        const gq = new GB(true), n = Math.round(span * 2 / 0.6), y0 = gy + 6.05, y1 = gy + 7.15, fx = -T.tx[i] * 0.31, fz = -T.tz[i] * 0.31;
        gq.quadO([x - nx * span + fx, y0, z - nz * span + fz], [x + nx * span + fx, y0, z + nz * span + fz], [x + nx * span + fx, y1, z + nz * span + fz], [x - nx * span + fx, y1, z - nz * span + fz], W1, [x - T.tx[i] * -2, gy + 6.6, z - T.tz[i] * -2], [[0, 0], [n / 16, 0], [n / 16, 2 / 16], [0, 2 / 16]]);
        addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
      }
      exclPush(x, z, span + 4);
    };
    gantry(sStart, false); gantry(sFin, true);
    let nFans = 0;
    {
      const runs = [[sStart - 50, sStart + 30, 1, 0.3], [sFin - 60, sFin + 15, 1, 0.3]];
      const okSide = (s, side) => { const i = T.idx(s), o = side * (bar(i, side) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return Math.abs(nrGround(x, z) - T.hy[i]) < 2.5; };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) for (let s0 = Math.max(4, a); s0 < Math.min(L - 4, b); s0 += 25) { const s1 = Math.min(b, s0 + 25); if (!okSide((s0 + s1) / 2, side)) continue;
        nFans += crowdRun(CR, s0, s1, side, { rows, dens, first: 1.0, excluded }); }
    }

    /* ---- the landmarks: plain shapes from their OSM outlines, no words, signs or names ---- */
    // the tower on the summit: its foot's building of two floors in the OSM outline; the tower itself generic: a tapering concrete shaft to
    // ~120 m, a cabin of glass between white bands, a mast in red and white to ~236 m
    for (const m of solid.filter(m => m.kind === 'tower')) {
      const o = obb(m.pts), y0 = groundMin(m.pts) - 0.3, CONC = [0.86, 0.85, 0.82], WIN = [0.2, 0.26, 0.32], g = scen.get(o.x, o.z);
      wallsOf(facC.get(o.x, o.z), m.pts, y0, 9, [0.88, 0.87, 0.84], 4, false); flatRoof(roofs.get(o.x, o.z), m.pts, y0 + 9, [0.6, 0.6, 0.6]);
      const x = o.x, z = o.z, y = y0 + 9;
      cyl(g, x, y - 1, z, 6.4, 119, 12, CONC, CONC, 4.4);
      cyl(g, x, y + 111, z, 5.0, 4, 16, CONC, CONC, 11.4);
      cyl(g, x, y + 115, z, 11.4, 5.2, 16, WIN, CONC);
      cyl(g, x, y + 120.2, z, 12.2, 1.6, 16, [0.95, 0.95, 0.93], [0.9, 0.9, 0.88]);
      cyl(g, x, y + 121.8, z, 11.2, 4.6, 16, WIN, CONC);
      cyl(g, x, y + 126.4, z, 10.2, 2.4, 16, CONC, CONC, 6.5);
      cyl(g, x, y + 128.8, z, 2.5, 40, 8, [0.94, 0.94, 0.94], null, 1.7);
      for (let k = 0; k < 7; k++) cyl(g, x, y + 168.8 + k * 9.6, z, 1.55 - k * 0.16, 9.6, 6, k % 2 ? [0.94, 0.94, 0.94] : [0.82, 0.16, 0.12], null, 1.39 - k * 0.16);
      CR.block(o.x, o.z, o.L, o.W, o.ang); exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 2); nMark++;
    }
    // the octagonal pavilion: red posts on a granite base, painted beams, a roof of dark tiles
    for (const m of solid.filter(m => m.kind === 'pavilion')) {
      const o = obb(m.pts), y = groundMin(m.pts), g = scen.get(o.x, o.z), r0 = Math.max(3, Math.max(o.L, o.W) / 2);
      cyl(g, o.x, y - 0.5, o.z, r0 + 0.6, 1.1, 8, STONED, STONE);
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; cyl(g, o.x + Math.cos(a) * r0 * 0.82, y + 0.6, o.z + Math.sin(a) * r0 * 0.82, 0.16, 2.9, 5, POST); }
      cyl(g, o.x, y + 3.4, o.z, r0 * 0.92, 0.5, 8, [0.24, 0.48, 0.42], [0.3, 0.3, 0.3]);
      cone(g, o.x, y + 3.85, o.z, r0 * 1.32, 2.6, 8, TILE, [0.36, 0.37, 0.39], TAU / 16);
      CR.block(o.x, o.z, o.L + 2, o.W + 2, o.ang); exclPush(o.x, o.z, r0 + 3); nMark++;
    }
    // the bus park by the road at the top: its buses (green, a white roof, a band of windows; no words)
    const bus = (g, x, y, z, ang, len) => { box(g, x, y + 0.3, z, len, 2.9, 2.5, ang, [0.86, 0.88, 0.86], [0.2, 0.52, 0.32]); box(g, x, y + 1.5, z, len + 0.04, 1.05, 2.54, ang, GLASS, GLASS); };
    for (const m of solid.filter(m => m.kind === 'buspark')) {
      const o = obb(m.pts), nb = Math.max(1, Math.min(4, Math.floor(o.W / 3.6)));
      for (let k = 0; k < nb; k++) { const v = (k - (nb - 1) / 2) * 3.6, x = o.x - o.s * v, z = o.z + o.c * v; bus(scen.get(x, z), x, nrGround(x, z), z, o.ang, Math.min(10.5, o.L - 2)); }
      CR.block(o.x, o.z, o.L, o.W, o.ang); exclPush(o.x, o.z, Math.max(o.L, o.W) / 2); nMark++;
    }

    /* ---- the old city wall: granite blocks ~4 m over the ground, a parapet with its gaps capped with dark tiles; where OSM has it inside the
       race's barriers, right behind them; open where the road goes through it ---- */
    {
      const cw = markRaw.find(m => m.kind === 'citywall'), lines = [];
      if (cw) lines.push(cw.pts);
      for (const [k, fl] of SD.walls) if (k === 5) { const pts = flat2(fl); if (!cw || pts.some(([x, z]) => lineDist(cw.pts, x, z) > 3)) lines.push(pts); }   // (the pieces of the wall the mark's line has not)
      for (const pts of lines) {
        const P2 = [];   // its points every ~2.5 m, moved behind the barriers or dropped where the road goes through
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.5)), ux = (bx - ax) / (len || 1), uz = (bz - az) / (len || 1);
          for (let q = 0; q < n || (k === pts.length - 2 && q === n); q++) {
            const x = ax + (bx - ax) * q / n, z = az + (bz - az) * q / n; if (nrDist(x, z) > 220) { P2.push(null); continue; }
            const nn = nrNear(x, z); if (nn.i < 0 || nn.dd >= 1.4) { P2.push([x, z]); continue; }
            if (Math.abs(ux * T.tx[nn.i] + uz * T.tz[nn.i]) < 0.8) { P2.push(null); continue; }   // (the road through it)
            const p = behind(x, z, 1.4); P2.push([p[0], p[1]]);
          }
        }
        for (let k = 0; k + 1 < P2.length; k++) {
          const a = P2[k], b = P2[k + 1]; if (!a || !b) continue;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.3 || len > 6) continue;
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), y = Math.min(nrGround(a[0], a[1]), nrGround(b[0], b[1])), g = scen.get(mx, mz);
          const col = vary(STONE, R, 0.05), H = 3.4 + crH(mx, mz, 61) * 0.5;
          box(g, mx, y - 1.4, mz, len + 0.12, H + 1.4, 2.2, ang, col.map(v => v * 0.96), col, true);
          if (k % 2 === 0) { box(g, mx, y + H, mz, len * 2 - 0.5, 0.95, 0.75, ang, col, col, true); box(g, mx, y + H + 0.95, mz, len * 2 - 0.3, 0.16, 0.95, ang, TILE, TILE, true); }
          exclPush(mx, mz, 3); nWall += len;
        }
      }
    }

    /* ---- the points of OSM by the road: the viewpoints' decks, the poem stone (no words), a figure on a plinth (no name), the shelters ---- */
    for (const [k, x0, z0] of SD.pts) {
      const [x, z, i, lat] = behind(x0, z0, k === 'viewpoint' ? 3.5 : 2.5); if (i < 0 || nrDist(x, z) > 80) continue;
      const sd = lat >= 0 ? 1 : -1, ang = T.hd[i], y = nrGround(x, z), g = scen.get(x, z), ox = T.nx[i] * sd, oz = T.nz[i] * sd;   // (ox, oz: away from the road)
      if (k === 'viewpoint') {   // a wooden deck on posts over the slope, its railing on the three sides away from the road
        const dy = Math.max(y, T.hy[i] - 0.4) + 0.5;
        box(g, x, dy - 0.25, z, 6.0, 0.25, 3.6, ang, WOODT, WOOD);
        for (const [u, v] of [[-2.7, -1.6], [2.7, -1.6], [-2.7, 1.6], [2.7, 1.6]]) { const px = x + T.tx[i] * u + ox * v, pz = z + T.tz[i] * u + oz * v; box(g, px, nrGround(px, pz) - 0.3, pz, 0.18, dy - nrGround(px, pz) + 1.3, 0.18, ang, WOOD); }
        box(g, x + ox * 1.75, dy + 0.95, z + oz * 1.75, 6.0, 0.08, 0.08, ang, WOOD);
        for (const u of [-2.95, 2.95]) box(g, x + T.tx[i] * u, dy + 0.95, z + T.tz[i] * u, 0.08, 0.08, 3.6, ang, WOOD);
        exclPush(x, z, 4.5); CR.block(x, z, 6.4, 4, ang);
      } else if (k === 'stone') {   // the poem stone: a rough slab of granite on its feet (no inscription)
        box(g, x, y - 0.2, z, 2.6, 0.45, 1.2, ang, STONED);
        rock(g, x, y + 1.0, z, 1.25, 1.05, 0.42, ang, [0.6, 0.58, 0.54], R, 0.14, 0.85);
        exclPush(x, z, 2.5);
      } else if (k === 'statue') {   // a granite plinth and a bronze figure on it, plain (no name)
        box(g, x, y - 0.2, z, 1.6, 2.1, 1.6, ang, STONE, STONED);
        cyl(g, x, y + 1.9, z, 0.34, 1.35, 7, BRONZE, BRONZE, 0.26); ico(g, x, y + 3.45, z, 0.17, 1.15, BRONZE, R, 0.05);
        exclPush(x, z, 2.5); CR.block(x, z, 2, 2, ang);
      } else {   // a shelter: four posts, a gabled roof of dark tiles, a bench
        for (const [u, v] of [[-1.6, -1.0], [1.6, -1.0], [-1.6, 1.0], [1.6, 1.0]]) box(g, x + T.tx[i] * u + ox * v, y - 0.2, z + T.tz[i] * u + oz * v, 0.16, 2.6, 0.16, ang, POST);
        gable(g, x, y + 2.4, z, 4.0, 2.9, 1.0, ang, TILE, [0.5, 0.36, 0.26]);
        box(g, x + ox * 0.7, y + 0.42, z + oz * 0.7, 2.6, 0.08, 0.45, ang, WOODT);
        exclPush(x, z, 3); CR.block(x, z, 4, 3, ang);
      }
      nMark++;
    }
    // the bus stops: a glass shelter with its bench behind the barrier, or a post
    for (const [s, side, dist, sh] of SD.stops) {
      const i = T.idx(s), o = side * Math.max(dist, bar(i, side) + 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = nrGround(x, z), g = scen.get(x, z), ang = T.hd[i];
      if (excluded(x, z)) continue;
      const ox = T.nx[i] * side, oz = T.nz[i] * side;
      if (sh) { box(g, x + ox * 0.8, y - 0.2, z + oz * 0.8, 4.2, 2.6, 0.08, ang, GLASS); for (const u of [-2.1, 2.1]) box(g, x + T.tx[i] * u, y - 0.2, z + T.tz[i] * u, 0.1, 2.6, 1.6, ang, [0.3, 0.32, 0.34]);
        box(g, x, y + 2.4, z, 4.5, 0.14, 1.9, ang, [0.86, 0.86, 0.84], [0.3, 0.32, 0.34]); box(g, x + ox * 0.45, y + 0.42, z + oz * 0.45, 3.0, 0.08, 0.42, ang, [0.6, 0.6, 0.62]); }
      else { box(g, x, y - 0.2, z, 0.1, 2.8, 0.1, ang, [0.3, 0.32, 0.34]); box(g, x, y + 2.2, z, 0.06, 0.55, 0.55, ang, [0.2, 0.42, 0.7]); }
      exclPush(x, z, 3); CR.block(x, z, 4.6, 2.2, ang); nStop++;
    }
    // the traffic lights at the crossings in the town: a pole behind the barrier, an arm over the road, the lights (no words)
    for (const c of CROSS) {
      if (!c.sig || c.s < 10 || c.s > L - 10) continue;
      const s = c.s - 5, i = T.idx(s), o = bar(i, 1) + 0.8, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = nrGround(x, z), g = scen.get(x, z), ang = T.hd[i];
      cyl(g, x, y - 0.2, z, 0.12, 6.2, 6, [0.5, 0.52, 0.54]);
      const reach = Math.min(o - 0.5, 7), ax = x - T.nx[i] * reach / 2, az = z - T.nz[i] * reach / 2;
      box(g, ax, y + 5.6, az, 0.14, 0.14, reach, ang, [0.5, 0.52, 0.54]);
      const lx = x - T.nx[i] * (reach - 1.2), lz = z - T.nz[i] * (reach - 1.2);
      box(g, lx, y + 5.1, lz, 0.32, 0.42, 1.5, ang, DARK);
      for (let k = 0; k < 3; k++) { const v = (k - 1) * 0.45, px = lx - T.tx[i] * 0.17 + T.nx[i] * v, pz = lz - T.tz[i] * 0.17 + T.nz[i] * v; box(g, px, y + 5.17, pz, 0.04, 0.28, 0.28, ang, [[0.85, 0.12, 0.1], [0.92, 0.66, 0.12], [0.18, 0.75, 0.42]][k]); }
      exclPush(x, z, 2); CR.avoid(x, z, 0.5);
    }

    /* ---- the buildings (OSM within 250 m): flats and houses of white and pale concrete, beige tile and red-brown brick with rows of windows
       (tex.facade), a plainer ground floor on the shops' fronts by Sowol-ro; flat roofs, gables of dark tiles on the small ones ---- */
    const PAL = [[0.9, 0.89, 0.86], [0.88, 0.84, 0.75], [0.8, 0.8, 0.78], [0.83, 0.77, 0.66], [0.62, 0.38, 0.3], [0.54, 0.4, 0.32], [0.76, 0.79, 0.8], [0.72, 0.68, 0.62], [0.92, 0.91, 0.88]];
    const outOf = new Map(SD.out.map(([k, fl]) => [k, flat2(fl)]));
    const BH = new Map(), BHC = 24;   // the footprints built, hashed (where the trees and the lamps may not stand)
    const bhPush = (pts) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let a = Math.floor(x0 / BHC); a <= Math.floor(x1 / BHC); a++) for (let b = Math.floor(z0 / BHC); b <= Math.floor(z1 / BHC); b++) { const k = a + ',' + b; let Lc = BH.get(k); if (!Lc) BH.set(k, Lc = []); Lc.push(pts); } };
    const inBld = (x, z) => { const Lc = BH.get(Math.floor(x / BHC) + ',' + Math.floor(z / BHC)); if (!Lc) return false; for (const p of Lc) if (inPoly(p, x, z)) return true; return false; };
    SD.bld.forEach(([bx, bz, Lb, Wb, ang, Hb, kind], n) => {
      if (inMark(bx, bz)) return;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      let pts = outOf.get(n) || [[Lb / 2, Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      // a house that reaches over the race's barriers: cut back along the road, 1.2 m behind the barrier
      let cutB = false;
      for (let it = 0; it < 4 && pts.length > 2; it++) {
        let worst = null;
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(len / 3));
          for (let q = 0; q < m; q++) { const x = a[0] + (b[0] - a[0]) * q / m, z = a[1] + (b[1] - a[1]) * q / m, nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1 && (!worst || nn.dd < worst.dd)) worst = { i: nn.i, dd: nn.dd, lat: nn.lat }; } }
        if (!worst) break;
        const i = worst.i, sd = worst.lat >= 0 ? 1 : -1, keep = bar(i, sd) + 1.2, f = (p) => ((p[0] - T.px[i]) * T.nx[i] + (p[1] - T.pz[i]) * T.nz[i]) * sd - keep, o2 = [];
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], fa = f(a), fb = f(b);
          if (fa >= 0) o2.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); o2.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
        pts = o2; cutB = true;
      }
      let ar = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
      if (pts.length < 3 || Math.abs(ar) / 2 < 16 || Lb < 2.5 || Wb < 2.5) return;
      let y0 = 1e9; for (const [cx, cz] of pts) y0 = Math.min(y0, nrGround(cx, cz));
      const hk = crH(bx, bz, 11), area = Lb * Wb, small = kind === 4 || area < 45;
      const H = Hb > 3 ? Hb : small ? 4 + hk * 3 : kind === 9 ? 18 + hk * 24 : kind === 5 ? 12 + hk * 14 : kind === 6 ? 12 + hk * 8 : kind === 1 ? 14 : 9 + hk * 6;
      const pi = crH(bx, bz, 12), col = vary(PAL[Math.floor(pi * PAL.length)], R, 0.04), shop = !small && (kind === 5 || nrDist(bx, bz) < 30);
      y0 -= 0.2; wallsOf(facC.get(bx, bz), pts, y0, H, col, 3.4, shop);
      const o = outOf.has(n) || cutB ? obb(pts) : { x: bx, z: bz, L: Lb, W: Wb, ang }, rg = roofs.get(bx, bz);
      if (!small || crH(bx, bz, 15) < 0.4) { flatRoof(rg, pts, y0 + H, crH(bx, bz, 16) < 0.35 ? [0.36, 0.5, 0.4] : [0.56, 0.56, 0.55]); }   // (the flat roofs: grey, some painted green)
      else gable(rg, o.x, y0 + H, o.z, o.L + 0.5, o.W + 0.5, Math.min(3.4, o.W * 0.3), o.ang, vary(TILE, R, 0.05), col);
      bhPush(pts); CR.block(o.x, o.z, o.L, o.W, o.ang); exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 1.5); nBld++;
    });
    const facMat = hjCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), matB = hjCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    facC.addTo(root, facMat, true, true); gplain.addTo(root, matB, true, true); roofs.addTo(root, matB, true, true);

    /* ---- the other streets within 70 m: asphalt ribbons on the ground (not the tunnels under the hill, nor its paths and steps; cut away
       inside the race's barriers) ---- */
    {
      const gs = new Chunks(256), asp = [0.42, 0.42, 0.43];
      for (const [hw, lanes, wd, brg, fl] of SD.roads) {
        if (brg || /foot|path|cycle|steps|pedestrian|track|corridor/.test(hw)) continue;
        const pts = flat2(fl), W = (parseFloat(wd) || (hw === 'service' ? 4 : hw === 'residential' ? 5.5 : hw === 'unclassified' ? 6 : 9)) / 2, lift = 0.05 + crH(pts[0][0], pts[0][1], 4) * 0.02;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.2) continue;
          const tx = (bx - ax) / len, tz = (bz - az) / len, nx = -tz * W, nz = tx * W;
          for (let t = 0; t < len; t += 3) { const t1 = Math.min(len, t + 3.2), x0 = ax + tx * t, z0 = az + tz * t, x1 = ax + tx * t1, z1 = az + tz * t1, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
            if (nrDist(mx, mz) > 70) continue; const nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < W + 0.5) continue;
            const y = (x, z) => nrGround(x, z) + lift, A = [x0 + nx, 0, z0 + nz], B2 = [x0 - nx, 0, z0 - nz], C = [x1 - nx, 0, z1 - nz], D = [x1 + nx, 0, z1 + nz];
            for (const p of [A, B2, C, D]) p[1] = y(p[0], p[2]);
            gs.get(mx, mz).quadUp(A, B2, C, D, [asp, asp, asp, asp]); }
        }
      }
      gs.addTo(root, matV, false, true);
    }

    /* ---- the lamps along the road: slim grey posts with an arm over the verge (OSM has none here); on the left in the park, both sides in
       the town ---- */
    {
      const lamp = (g, x, y, z, ax, az) => { cyl(g, x, y - 0.2, z, 0.09, 6.6, 5, [0.4, 0.42, 0.44]); box(g, x + ax * 0.7, y + 6.3, z + az * 0.7, 1.5, 0.1, 0.12, Math.atan2(az, ax), [0.4, 0.42, 0.44]);
        box(g, x + ax * 1.35, y + 6.12, z + az * 1.35, 0.62, 0.16, 0.3, Math.atan2(az, ax), [0.92, 0.9, 0.82], [0.4, 0.42, 0.44]); nLamp++; };
      for (let s = 20, k = 0; s < L - 20; s += 34, k++) {
        const i = T.idx(s), town = nrLCf(T.px[i], T.pz[i], 3) > 0.6;
        for (const side of town ? [-1, 1] : [-1]) {
          if (town && side > 0 && k % 2) continue;
          const o = side * (bar(i, side) + 1.0), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (excluded(x, z) || inBld(x, z) || nearCross(s, 6) || Math.abs(nrGround(x, z) - T.hy[i]) > 3) continue;
          lamp(scen.get(x, z), x, nrGround(x, z), z, -T.nx[i] * side, -T.nz[i] * side); CR.avoid(x, z, 0.4); exclPush(x, z, 1.2);
        }
      }
    }

    /* ---- the trees: the cherry rows along the road, the park's woods of red pine and oak (the woods' land cover), the lawns' and the town's
       few; within 250 m, farther than 70 m every other one and cheaper ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;   // the crowns sway a little, each tree in its own rhythm (the higher up, the more)
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.016;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'seTreeWind';
    const TK = [new IChunks(seTreeGeo(0), tMat, 192), new IChunks(seTreeGeo(1), tMat, 192), new IChunks(seTreeGeo(2), tMat, 192)];
    const TF = [new IChunks(seTreeGeo(3), tMat, 256), new IChunks(seTreeGeo(4), tMat, 256)];
    let nTrees = 0;
    const TG = new Set(), tgK = (x, z) => Math.floor(x / 3) + ',' + Math.floor(z / 3);
    const CRW = [0.2, 0.32, 0.42, 0.22, 0.36];   // (each kind's crown radius in its width)
    const plant = (sp, x, z, hgt, wid, c) => { TG.add(tgK(x, z)); const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp >= 3) TF[sp - 3].add(x, y, z, rot, wid, hgt, c); else TK[sp].add(x, y, z, rot, wid, hgt, c); nrShade(x, z, wid * CRW[sp], sp === 0 || sp === 3 ? 0.8 : 1); nTrees++; };
    const noTree = (x, z) => excluded(x, z) || inBld(x, z) || inMark(x, z);
    {   // the cherries along the road, behind the barriers, both sides: every ~9 m, a gap now and then
      for (let s = 6; s < L - 6; s += 9) for (const side of [-1, 1]) {
        if (crH(s, side, 31) < 0.3 || nearCross(s, 7)) continue;
        const i = T.idx(s), o = side * (bar(i, side) + 2.0 + crH(s, side, 32) * 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (noTree(x, z) || nrLC(x, z) === 3 && crH(s, side, 33) < 0.5 || Math.abs(nrGround(x, z) - T.hy[i]) > 4) continue;
        const hgt = 7 + crH(s, side, 34) * 3.5, cv = 0.9 + crH(s, side, 35) * 0.2; plant(2, x, z, hgt, hgt * 1.0, [cv, cv, cv * 0.95]);
      }
    }
    {
      const Lt = NRC * NRT, seen = new Set();
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 2; zz < za + Lt; zz += 4) for (let xx = xa + 2; xx < xa + Lt; xx += 4) {
          const rd = nrDist(xx, zz); if (rd > 250) continue;
          const far = rd > 70, h1 = crH(xx, zz, 81), cl = nrLC(xx, zz);
          const p = cl === 1 ? (far ? 0.36 : 0.62) : cl === 2 ? (far ? 0 : 0.1) : cl === 0 ? (far ? 0.04 : 0.1 + API.nrEdge(xx, zz) * 0.4) : (far ? 0 : 0.025);
          if (h1 >= p) continue;
          const x = xx + (crH(xx, zz, 82) - 0.5) * 3.2, z = zz + (crH(xx, zz, 83) - 0.5) * 3.2;
          if (!far) { const nn = nrNear(x, z); if (nn.i >= 0 && (nn.dd < 2.6 || (nn.dd < 6 && h1 > p * 0.5))) continue; }
          const k = tgK(x, z); if (seen.has(k) || TG.has(k) || noTree(x, z)) continue; seen.add(k);
          const pine = cl === 1 ? crH(xx, zz, 84) < 0.55 : crH(xx, zz, 84) < 0.25, hq = crH(xx, zz, 85), cv = 0.88 + crH(xx, zz, 86) * 0.24, c = [cv * 0.98, cv, cv * 0.94];
          if (pine) { const hgt = 13 + hq * 8; plant(far ? 3 : 0, x, z, hgt, hgt * (far ? 1.0 : 0.9), c); }
          else { const hgt = (11 + hq * 7) * (far ? 1.08 : 1); plant(far ? 4 : 1, x, z, hgt, hgt * (0.86 + crH(xx, zz, 87) * 0.2), c); }
        }
      }
    }
    for (const t of TK) t.addTo(root, true);
    for (const t of TF) t.addTo(root, false);

    /* ---- OSM's other walls by the road (within 60 m): low stone walls, retaining walls, hedges, railings ---- */
    for (const [k, fl] of SD.walls) {
      if (k === 4 || k === 5) continue;
      const pts = flat2(fl);
      for (let q = 0; q + 1 < pts.length; q++) {
        const [ax, az] = pts[q], [bx, bz] = pts[q + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 1.2 || nrDist(mx, mz) > 60) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.4, 1.0, ang, vary([0.26, 0.36, 0.2], R, 0.08), [0.3, 0.42, 0.22], true);
        else if (k === 3) box(g, mx, y, mz, len + 0.1, 1.2, 0.08, ang, [0.3, 0.32, 0.33], null, true);
        else box(g, mx, y - 0.4, mz, len + 0.2, 1.6, 0.6, ang, vary(STONED, R, 0.05), STONE, true);
      }
    }

    /* ---- the city beyond the corridor: its blocks (the surface model, 300 m to 1.5 km out) in whites and greys; the ground beyond the
       terrain tiles (200 m cells, +-4 km: the opened surface model, the river down at its water) ---- */
    let nTower = 0;
    {
      const F = SD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step;
      const farH = (x, z) => { const fx = (x - F.x0) / F.cell - 0.5, fz = (z - F.z0) / F.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j; return (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - v) + (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * v; };
      const inG = (x, z) => x > G.x0 + 8 && z > G.z0 + 8 && x < G.x0 + (G.nx - 2) * NRC && z < G.z0 + (G.nz - 2) * NRC;
      const tc = new Chunks(512), TCOL = [[0.84, 0.84, 0.82], [0.74, 0.76, 0.78], [0.8, 0.77, 0.7], [0.9, 0.89, 0.87], [0.66, 0.68, 0.7]];
      for (const [x, z, h, w] of SD.towers) {
        const y = inG(x, z) ? nrGround(x, z) : farH(x, z), col = vary(TCOL[Math.floor(crH(x, z, 51) * TCOL.length)], R, 0.04), ang = crH(x, z, 52) * 0.5 - 0.25;
        box(tc.get(x, z), x, y - 3, z, w, h + 3, w * (0.6 + crH(x, z, 53) * 0.4), ang, col.map(v => v * 0.62), col, true); nTower++;
      }
      tc.addTo(root, matV, false, false);
      const gf = new GB(), colF = (hh, x, z) => { const k = 0.88 + crH(Math.floor(x / 400), Math.floor(z / 400), 3) * 0.14, t = clamp((hh - 10) / 120, 0, 1); return [lerp(0.6, 0.36, t) * k, lerp(0.6, 0.44, t) * k, lerp(0.57, 0.3, t) * k]; };
      const inner = (x, z) => inG(x, z) && nrDist(x, z) < 520;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell, hv = H(a, b); return [xx, hv <= F.lo + 1.01 ? RIVER - 3 : hv - (inner(xx, zz) ? 14 : 0.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1);
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2]), colF(Dd[1], Dd[0], Dd[2]), colF(C[1], C[0], C[2]), colF(B2[1], B2[0], B2[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
      const wg = new THREE.PlaneGeometry(F.n * F.cell, F.n * F.cell, 1, 1).rotateX(-Math.PI / 2), wm = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: 0x5f7a80 }));   // (the Han, far out)
      wm.position.set(F.x0 + F.n * F.cell / 2, RIVER, F.z0 + F.n * F.cell / 2); wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm);
    }

    /* ---- the terrain tiles and the verges ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const KERB = [0.74, 0.74, 0.72];
      for (let c0 = 0; c0 < N - 1; c0 += RC) {
        const gv = new RB(true), pv = [-1, -1];
        for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, vr = vergeRow(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), cols = vr.map(([o], k) => k <= 1 ? KERB : API.nrGCol(pts[k][0], pts[k][2]).slice());
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, landmarks: nMark, wall: Math.round(nWall), lamps: nLamp, stops: nStop, towers: nTower, fans: nFans };   // (read by the tests)
    return out;
  }

  World.ext.seoul = (scene, tex, opts) => buildSeoul(scene, tex, opts);
})();
