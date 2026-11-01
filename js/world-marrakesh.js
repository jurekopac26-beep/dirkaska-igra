/* =========================================================================
   WORLD — Marrakesh (theme 'marrakesh'): its own builder (World.ext.marrakesh), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NR_A64, RB, TAU, atSf, box, parkedCar, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, hjCutMat, ico, lerp,
    nrDist, nrGround, nrLC, nrLCf, nrNear, nrPrep, nrShade, nrSlope, nrTileGeo, nrTileOn, ouCutMat, propFloorTable, rbCrowdTex, rng, rsFar,
    sstep, valueNoise2, wrapS
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MARRAKESH (theme 'marrakesh'): the street circuit in the Agdal district =================
     The semi-permanent circuit of the electric races (2016-2022) on its real ground (def.dem: Copernicus DEM, the roofs and trees taken off)
     on the Nordschleife's corridor helpers (nrPrep and the nr* terrain; def.lc: ESA WorldCover), and the town round it from OpenStreetMap
     (def.scen, mrPrep): the streets with their kerbs and pavements, the junctions the lap runs through (def.jn: their mouths open to the
     corners' pavements, the side street closed a few metres in by blocks under a catch fence; on the corners the traffic lights, signs,
     bollards, lamps, bins, hydrants, cabinets and bus shelters, all knockable: Race.setProps), the zebras and the stop lines on the
     tarmac; the concrete blocks with their catch fences along the whole lap, the pit wall, the asphalt run-offs with their tyre barriers;
     the buildings in their real footprints (pink plaster of the town's own colour, flat roofs behind parapets, crenellated tops; heights
     estimated), the long rammed-earth wall of the Agdal gardens along the back straight with its olive groves behind, the palms of the
     boulevards and the hotel gardens, their lawns and pools; the paddock with the pit garages, the teams' tents, the grandstands and the
     crowds; the snowy High Atlas on the horizon (def.far, rsFar). Built for the two cameras of the game. No names of hotels, firms, events,
     sponsors or people: the boards carry the place's names and made-up words only. No birds (def.noBirds). */
  let MR = null;   // per build: the town's data decoded (mrPrep)
  function mrI16(b) { const s = atob(b), n = s.length >> 1, a = new Int16Array(n); for (let k = 0; k < n; k++) { const v = s.charCodeAt(2 * k) | (s.charCodeAt(2 * k + 1) << 8); a[k] = v > 32767 ? v - 65536 : v; } return a; }
  function mrPolys(b, extra) {   // [n, extra values..., n x (x, z) in half metres] -> [{ v: [...], p: [[x, z], ...] }]
    const a = mrI16(b), out = [];
    for (let k = 0; k < a.length;) { const n = a[k], v = []; for (let e = 0; e < extra; e++) v.push(a[k + 1 + e]); const p = []; for (let q = 0; q < n; q++) p.push([a[k + 1 + extra + 2 * q] / 2, a[k + 2 + extra + 2 * q] / 2]); out.push({ v, p }); k += 1 + extra + 2 * n; }
    return out;
  }
  function mrPrep() {
    const S = T.def.scen, P = MR = {};
    P.bld = mrPolys(S.bld, 2).map(({ v, p }) => ({ h: v[0] / 10, kind: v[1], p }));
    P.st = mrPolys(S.st, 2).map(({ v, p }) => ({ cls: v[0], hw: v[1] / 4, p }));
    P.pool = mrPolys(S.pool, 1).map(({ v, p }) => ({ pool: v[0], p }));
    P.wall = mrPolys(S.wall, 0).map(({ p }) => p);
    P.park = mrPolys(S.park, 0).map(({ p }) => p);
    const pts = (b) => { const a = mrI16(b), o = []; for (let k = 0; k < a.length; k += 2) o.push([a[k] / 2, a[k + 1] / 2]); return o; };
    P.pad = pts(S.pad); P.pit = pts(S.pit);
    { const a = mrI16(S.poi); P.poi = []; for (let k = 0; k < a.length; k += 3) P.poi.push({ k: a[k], x: a[k + 1] / 2, z: a[k + 2] / 2 }); }
    { const L = S.lu, g = P.lu = new Uint8Array(L.nx * L.nz); P.L = L;   // the ground classes, 8 m cells (run-length coded: value << 3 | run - 1, a run of 8 or more extended)
      for (let p = 0, k = 0; k < g.length;) { const v = NR_A64.indexOf(L.rle[p++]); let n = (v & 7) + 1; if ((v & 7) === 7) { let e; do { e = NR_A64.indexOf(L.rle[p++]); n += e; } while (e === 63); } g.fill(v >> 3, k, Math.min(g.length, k + n)); k += n; } }
    // the streets' segments in a 16 m hash (which street a point lies on)
    const SH = P.sh = new Map();
    for (const r of P.st) for (let k = 0; k + 1 < r.p.length; k++) { const [ax, az] = r.p[k], [bx, bz] = r.p[k + 1], R2 = r.hw + 3;
      for (let a = Math.floor((Math.min(ax, bx) - R2) / 16); a <= Math.floor((Math.max(ax, bx) + R2) / 16); a++) for (let b = Math.floor((Math.min(az, bz) - R2) / 16); b <= Math.floor((Math.max(az, bz) + R2) / 16); b++) {
        const key = a * 4096 + b; let L = SH.get(key); if (!L) SH.set(key, L = []); L.push(r, k); } }
  }
  function mrLU(x, z) { const L = MR.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : MR.lu[j * L.nx + i]; }
  function mrLUf(x, z, c) {   // share of ground class c around (x, z), bilinear over the 8 m cells (soft edges)
    const L = MR.L, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : MR.lu[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function mrStreetAt(x, z, pad) {   // the street under (x, z) within its half width + pad: { r, d (from its centre line), tx, tz } or null
    const L = MR.sh.get(Math.floor(x / 16) * 4096 + Math.floor(z / 16)); if (!L) return null;
    let best = null, bd = 1e9;
    for (let q = 0; q < L.length; q += 2) { const r = L[q], k = L[q + 1], [ax, az] = r.p[k], [bx, bz] = r.p[k + 1], vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1);
      const d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < r.hw + (pad || 0) && d - r.hw < bd) { bd = d - r.hw; const l = Math.sqrt(l2); best = { r, d, tx: vx / l, tz: vz / l }; } }
    return best;
  }
  function mrInPoly(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
  // the ground picture under the vertex colours (256 px = 12 m, tileable): the red earth of the Haouz plain, grit and pebbles, sparse dry tufts
  function mrGroundTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(2971), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(611, 40), n2 = valueNoise2(612, 9);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {   // (tileable noise: the four corners of the torus blended)
      const f = (a, b) => { const u = i / S, v = j / S; return (a(i, j) * (1 - u) + a(i - S, j) * u) * (1 - v) + (a(i, j - S) * (1 - u) + a(i - S, j - S) * u) * v; };
      const k = 0.86 + f(n1) * 0.18 + f(n2) * 0.12 + (r() - 0.5) * 0.1, o = (j * S + i) * 4;
      d[o] = clamp(196 * k, 0, 255); d[o + 1] = clamp(150 * k, 0, 255); d[o + 2] = clamp(118 * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    for (let q = 0; q < 900; q++) { const px = r() * S, py = r() * S, s = 0.6 + r() * 1.8, l = r(); x.fillStyle = l < 0.5 ? `rgba(80,48,34,${0.25 + r() * 0.3})` : `rgba(236,210,180,${0.25 + r() * 0.3})`; x.fillRect(px, py, s, s * (0.6 + r() * 0.6)); }   // grit, pale and dark
    for (let q = 0; q < 70; q++) { const px = r() * S, py = r() * S; x.strokeStyle = `rgba(${120 + r() * 40},${120 + r() * 30},${60 + r() * 20},0.6)`; x.lineWidth = 0.8;   // dry tufts
      for (let b = 0; b < 6; b++) { const a = -Math.PI / 2 + (r() - 0.5) * 1.6, l = 2 + r() * 4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; return t;
  }
  // the facades (16 rows of 128 x 128, a bay wide, two storeys a row (the ground floor rows: one storey); the glass darker): 0 pink plaster with small arched windows, 1 the same, ochre, wooden shutters, 2 a hotel's arcaded
  // loggias, 3 a ground floor of arches and shop shutters, 4 plain plaster (parapets, garden walls), 5 the rammed earth of the old walls,
  // 6 a cream hotel with green-tiled window hoods, 7 the pit garages' roller doors, 8 a plain ground floor with a door, 9 grilles (mashrabiya)
  let mrFTex = null;
  function mrFacadeTex() {
    if (mrFTex) return mrFTex;
    const W = 128, c = document.createElement('canvas'); c.width = W; c.height = W * 16; const x = c.getContext('2d'), r = rng(4167);
    const Y = (k) => k * W, fill = (col, a, b, w, h, k) => { x.fillStyle = col; x.fillRect(a, Y(k) + b, w, h); };
    const glass = (a, b, w, h, k, c0, c1) => { x.clearRect(a, Y(k) + b, w, h); const gr = x.createLinearGradient(a, Y(k) + b, a + w * 0.7, Y(k) + b + h); gr.addColorStop(0, c0 || 'rgba(96,104,112,0.6)'); gr.addColorStop(1, c1 || 'rgba(30,32,38,0.6)'); x.fillStyle = gr; x.fillRect(a, Y(k) + b, w, h); };
    const arch = (a, b, w, h, k, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(a, Y(k) + b + h); x.lineTo(a, Y(k) + b + w / 2); x.arc(a + w / 2, Y(k) + b + w / 2, w / 2, Math.PI, 0); x.lineTo(a + w, Y(k) + b + h); x.closePath(); x.fill(); };
    const archGlass = (a, b, w, h, k) => { x.save(); x.beginPath(); x.moveTo(a, Y(k) + b + h); x.lineTo(a, Y(k) + b + w / 2); x.arc(a + w / 2, Y(k) + b + w / 2, w / 2, Math.PI, 0); x.lineTo(a + w, Y(k) + b + h); x.closePath(); x.clip(); glass(a, b, w, h, k); x.restore(); };
    const plaster = (k, base, a) => { fill(base, 0, 0, W, W, k); for (let q = 0; q < 500; q++) { x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; x.fillRect(r() * W, Y(k) + r() * W, 1 + r() * 5, 1 + r() * 3); }
      x.fillStyle = 'rgba(60,30,20,0.08)'; for (let q = 0; q < 6; q++) x.fillRect(r() * W, Y(k) + r() * W * 0.6, 1.5, 10 + r() * 30); };   // (streaks under the sills)
    // 0, 1: plaster, an arched window per bay and storey (two: 64 px each), a pale surround; 1 with wooden shutters
    for (const [k, base, sh] of [[0, '#c98a76', false], [1, '#cf9d6c', true]]) { plaster(k, base, 0.05);
      for (const f of [0, 64]) { arch(38, f + 12, 52, 42, k, 'rgba(240,222,200,0.9)'); archGlass(42, f + 16, 44, 38, k); fill('rgba(240,222,200,0.9)', 36, f + 54, 56, 4, k);
        if (sh) { fill('#5d3b24', 24, f + 18, 14, 36, k); fill('#5d3b24', 90, f + 18, 14, 36, k); for (let q = 0; q < 6; q++) { fill('rgba(0,0,0,0.25)', 24, f + 20 + q * 6, 14, 1, k); fill('rgba(0,0,0,0.25)', 90, f + 20 + q * 6, 14, 1, k); } } } }
    // 2: a hotel's loggias: deep arches with a dark shade inside, a balustrade, a planter
    plaster(2, '#d39a84', 0.04); for (const f of [0, 64]) { arch(16, f + 6, 96, 54, 2, 'rgba(232,212,190,1)'); arch(22, f + 12, 84, 48, 2, '#5a3a32'); archGlass(46, f + 22, 36, 38, 2); fill('#e8d4be', 16, f + 46, 96, 4, 2); for (let q = 0; q < 9; q++) fill('#e8d4be', 22 + q * 10, f + 50, 3, 10, 2); fill('#4f7a3a', 22, f + 58, 84, 4, 2); }
    // 3: a ground floor (one storey): three arches, roller shutters and a shop window, a band of zellige tiles at the foot
    plaster(3, '#c4806c', 0.05); for (const [a, kk] of [[6, 0], [46, 1], [86, 2]]) { arch(a, 26, 36, 102, 3, '#e6cdb4'); if (kk === 1) archGlass(a + 4, 30, 28, 98, 3); else { fill('#7d7468', a + 4, 52, 28, 76, 3); for (let q = 0; q < 12; q++) fill('rgba(0,0,0,0.2)', a + 4, 54 + q * 6, 28, 1, 3); } }
    for (let q = 0; q < 16; q++) fill(q % 2 ? '#2f6b5a' : '#e9e2d0', q * 8, 118, 8, 10, 3);
    // 4: plain plaster (pink); 5: rammed earth: layers of the formwork, the putlog holes in rows
    plaster(4, '#c98d78', 0.06);
    plaster(5, '#b9774f', 0.08); for (let yy = 0; yy < W; yy += 21) { fill('rgba(70,36,20,0.18)', 0, yy, W, 2, 5); for (let xx = (yy / 21 % 2) * 32 + 10; xx < W; xx += 64) fill('rgba(40,20,12,0.55)', xx, yy + 6, 6, 5, 5); }
    // 6: a cream hotel: square windows with green-tiled hoods, a frieze
    plaster(6, '#e3cdb2', 0.04); for (const f of [0, 64]) { fill('#2e6b4f', 34, f + 8, 60, 8, 6); fill('rgba(255,255,255,0.3)', 34, f + 8, 60, 2, 6); glass(40, f + 18, 48, 36, 6); fill('#efe2cc', 36, f + 54, 56, 4, 6); }
    fill('#b98d63', 0, 0, W, 3, 6);
    // 7: the pit garages: white, a roller door per bay, a lit sign band left blank
    fill('#ecebe6', 0, 0, W, W, 7); fill('#9aa0a6', 10, 30, 108, 98, 7); for (let q = 0; q < 16; q++) fill('rgba(0,0,0,0.12)', 10, 32 + q * 6, 108, 2, 7); fill('#2b3036', 0, 8, W, 16, 7); fill('#ecebe6', 0, 124, W, 4, 7);
    // 8: a plain ground floor with a carved wooden door; 9: grilles over the windows (two storeys)
    plaster(8, '#c4806c', 0.05); arch(44, 30, 40, 98, 8, '#e6cdb4'); fill('#6b4127', 48, 52, 32, 76, 8); for (let q = 0; q < 5; q++) fill('rgba(0,0,0,0.25)', 50, 58 + q * 14, 28, 2, 8); fill('#2f6b5a', 0, 120, W, 8, 8);
    plaster(9, '#cd9078', 0.05); for (const f of [0, 64]) { fill('#e8d0b8', 34, f + 10, 60, 46, 9); glass(38, f + 14, 52, 38, 9); for (let q = 0; q < 6; q++) fill('#3b2a1e', 38 + q * 10, f + 14, 2, 38, 9); for (let q = 0; q < 4; q++) fill('#3b2a1e', 38, f + 14 + q * 10, 52, 2, 9); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; t.premultiplyAlpha = false; return (mrFTex = t);
  }
  const mrFV = (k, f) => { const v1 = 1 - k / 16, v0 = v1 - 1 / 16, pad = 2 / 2048; return v0 + pad + (v1 - v0 - 2 * pad) * f; };   // (facade row k, height fraction f -> v)
  // the buildings' material: the facade picture (its glass darker in the alpha: shown opaque), the cut between the camera and the car (hjCutMat's)
  function mrBldMat(map, U) {
    const m = new THREE.MeshLambertMaterial({ map, vertexColors: true });
    const cutF = hjCutMat(new THREE.MeshLambertMaterial(), U).onBeforeCompile;
    m.onBeforeCompile = (sh, rd) => { cutF(sh, rd); sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.a = 1.0;'); };
    m.customProgramCacheKey = () => 'mrBld';
    return m;
  }
  // text boards (4 x 16 cells of 256 x 64): the turn numbers 1-12 (white on blue, as the circuit's boards), then the banners: the place's
  // names and made-up words only
  const MR_BAN = [['MARRAKECH', '#b23a2c', '#fbf3e6', '#1f6b4a'], ['AGDAL', '#1f6b4a', '#fbf3e6', '#e2b33c'], ['ATLAS', '#24477a', '#fbf3e6', '#e2b33c'], ['HAOUZ', '#e2b33c', '#3a1d14', '#b23a2c'],
    ['START', '#16181c', '#fbf3e6', '#b23a2c'], ['PIT', '#fbf3e6', '#16181c', '#1f6b4a'], ['MAROC', '#b23a2c', '#fbf3e6', '#1f6b4a'], ['TENSIFT', '#2b6f8c', '#fbf3e6', '#fbf3e6'],
    ['OURIKA', '#7a3b2a', '#fbf3e6', '#e2b33c'], ['ELECTRIC', '#16181c', '#7fe0ff', '#7fe0ff'], ['2.97 KM', '#fbf3e6', '#16181c', '#b23a2c'], ['MENARA', '#1f6b4a', '#fbf3e6', '#fbf3e6'],
    ['STOP', '#b8221a', '#ffffff', '#ffffff'], ['GRANDSTAND', '#24477a', '#fbf3e6', '#e2b33c'], ['SAFETY', '#e2b33c', '#16181c', '#16181c'], ['MEDIA', '#fbf3e6', '#24477a', '#24477a']];
  const MR_AT = { num: 0, ban: 16 };
  function mrAtlas() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 57, 256, 7); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '700 ' + px + 'px "Trebuchet MS", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 34, 236); };
    for (let k = 1; k <= 12; k++) cell(MR_AT.num + k - 1, '#1d4f9a', '#ffffff', String(k), 50, '#ffffff');
    MR_BAN.forEach(([t, bg, fg, st], k) => cell(MR_AT.ban + k, bg, fg, t, t.length > 8 ? 34 : 42, st));
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  // unit trees (height 1, instances scale them): 0 a date palm (a ringed, slightly leaning trunk, a crown of arching fronds, the dead ones
  // hanging under it), 1 an olive (a gnarled grey trunk, a rounded silver-green crown), 2 an orange tree (dense, dark, round), 3 a flowering
  // shrub (bougainvillea or oleander: magenta and pink in the green), 4 a cheaper palm for the far ones, 5 a cheaper olive
  function mrTreeGeo(kind) {
    const g = new GB(), R = rng(880 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0 || kind === 4) {   // (4: the far one: a plain trunk, six fronds)
      const tr = [0.5, 0.4, 0.3], trD = [0.42, 0.33, 0.24], lean = 0.04;
      if (kind) cyl(g, 0, 0, 0, 0.045, 0.86, 3, tr, null, 0.036);
      else for (let k = 0; k < 3; k++) { const y0 = k * 0.287; cyl(g, lean * y0, y0, 0, 0.045 - k * 0.003, 0.287, 5, k % 2 ? trD : tr, null, 0.042 - k * 0.003); }
      const top = [kind ? 0 : lean * 0.86, 0.86, 0], fr = [0.33, 0.45, 0.22], frD = [0.24, 0.34, 0.16], dead = [0.6, 0.5, 0.32];
      const NF = kind ? 6 : 9;
      for (let k = 0; k < NF; k++) {   // a frond: a long arching strip (two segments near, one far), a little twisted
        const a = k / NF * TAU + R() * 0.3, up = k % 3 === 0 ? 0.55 : k % 3 === 1 ? 0.2 : -0.1, L = 0.36 + R() * 0.08, ca = Math.cos(a), sa = Math.sin(a), wd = 0.075;
        const p0 = top, p1 = [top[0] + ca * L * 0.55, top[1] + up * L * 0.6 + 0.05, top[2] + sa * L * 0.55], p2 = [top[0] + ca * L, top[1] + up * L * 0.4 - 0.12, top[2] + sa * L];
        const sx = -sa * wd, sz = ca * wd, col = k % 2 ? fr : frD, inn = [top[0], top[1] - 1, top[2]];
        if (kind) { g.triO([p0[0], p0[1], p0[2]], [p1[0] + sx, p1[1], p1[2] + sz], [p2[0], p2[1], p2[2]], col, inn); g.triO([p0[0], p0[1], p0[2]], [p2[0], p2[1], p2[2]], [p1[0] - sx, p1[1], p1[2] - sz], col, inn); continue; }
        g.quadO([p0[0] - sx * 0.3, p0[1], p0[2] - sz * 0.3], [p0[0] + sx * 0.3, p0[1], p0[2] + sz * 0.3], [p1[0] + sx, p1[1] - 0.02, p1[2] + sz], [p1[0] - sx, p1[1] + 0.02, p1[2] - sz], col, inn);
        g.triO([p1[0] - sx, p1[1] + 0.02, p1[2] - sz], [p1[0] + sx, p1[1] - 0.02, p1[2] + sz], [p2[0], p2[1], p2[2]], col, inn);
      }
      if (!kind) for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.4, ca = Math.cos(a) * 0.06, sa = Math.sin(a) * 0.06; g.triO([top[0] + ca * 0.3, top[1] - 0.02, top[2] + sa * 0.3], [top[0] + ca * 1.4, top[1] - 0.02, top[2] + sa * 1.4], [top[0] + ca, top[1] - 0.2, top[2] + sa], dead, [top[0], top[1] - 0.1, top[2] + 1]); }   // (dead fronds under the crown)
    } else if (kind === 1 || kind === 5) {   // an olive (5: the far one, a single crown)
      const bk = [0.46, 0.43, 0.38]; cyl(g, 0, -0.05, 0, 0.07, 0.45, kind === 5 ? 3 : 4, bk, null, 0.05);
      const lf = [0.45, 0.5, 0.38], lfD = [0.36, 0.41, 0.31];
      (kind === 5 ? [[0, 0.62, 0, 0.42]] : [[0, 0.62, 0, 0.36], [0.2, 0.56, 0.1, 0.24], [-0.16, 0.6, -0.1, 0.25]]).forEach(([x, y, z, r], k) => ico(g, x, y, z, r, 0.7, k % 2 ? lfD : lf, R, 0.35));
    } else if (kind === 2) {
      cyl(g, 0, -0.05, 0, 0.05, 0.35, 4, [0.4, 0.33, 0.24], null, 0.04);
      const lf = [0.2, 0.36, 0.18], fr = [0.95, 0.6, 0.12];
      [[0, 0.6, 0, 0.4], [0.15, 0.5, 0.12, 0.26]].forEach(([x, y, z, r]) => ico(g, x, y, z, r, 0.85, lf, R, 0.25));
      for (let k = 0; k < 5; k++) { const a = R() * TAU, b = 0.3 + R() * 0.3; box(g, Math.cos(a) * 0.36, 0.45 + b * 0.4, Math.sin(a) * 0.36, 0.06, 0.06, 0.06, 0, fr, fr); }   // (oranges)
    } else {
      const lf = [0.26, 0.42, 0.22], fl = [0.82, 0.18, 0.48], fl2 = [0.95, 0.55, 0.7];
      [[0, 0.4, 0, 0.42], [0.25, 0.32, 0.1, 0.3]].forEach(([x, y, z, r], k) => ico(g, x, y, z, r, 0.8, k ? fl : fl2, R, 0.35));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // chunks whose grid is shifted off the origin (the circuit's start line, in the middle of the scenery: a grid through it would split
  // everything into four)
  class MrChunks extends Chunks { get(x, z) { return super.get(x + 4000, z + 4000); } }
  class MrIChunks extends IChunks { add(x, y, z, rot, sxz, sy, col) { const k = Math.floor((x + 4000) / this.size) + ',' + Math.floor((z + 4000) / this.size); let L = this.map.get(k); if (!L) this.map.set(k, L = []); L.push(x, y, z, rot, sxz, sy, col ? col[0] : 1, col ? col[1] : 1, col ? col[2] : 1); } }
  // the old town's great minaret on the northern horizon (a generic square tower: no likeness of any building in particular), drawn as rsFar's
  // ring is: inside the far clip, in its real direction and angular size from the camera (x, z, height: where it stands and how tall)
  function mrFarTower(root, x, z, h) {
    const g = new GB(), c = [0.78, 0.52, 0.4], cT = [0.86, 0.6, 0.46];
    box(g, 0, -40, 0, 12.5, h * 0.78 + 40, 12.5, 0, c, cT); box(g, 0, h * 0.78, 0, 13.6, 1.4, 13.6, 0, cT, cT);   // (the shaft, its crown)
    box(g, 0, h * 0.8, 0, 6.5, h * 0.14, 6.5, 0, c, cT); cone(g, 0, h * 0.94, 0, 2.2, h * 0.06, 8, [0.3, 0.5, 0.4], [0.85, 0.75, 0.4], 0);   // (the lantern, its dome)
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = -1; m.name = 'mrFar';
    const dist = Math.hypot(x, z), dx = x / dist, dz = z / dist, ref = new THREE.Color(0xd9dfe3), tc = new THREE.Color();
    m.onBeforeRender = (rd, sc, cam) => {
      if (!cam.isPerspectiveCamera || cam.far < 50) return;
      const D = cam.far * 0.72, k = D / Math.hypot(x - cam.position.x, z - cam.position.z);
      m.position.set(cam.position.x + (x - cam.position.x) * k, cam.position.y + (0 - cam.position.y) * k, cam.position.z + (z - cam.position.z) * k); m.scale.setScalar(k); m.updateMatrix(); m.updateMatrixWorld(true);
      if (sc.fog) { tc.setRGB(sc.fog.color.r / ref.r, sc.fog.color.g / ref.g, sc.fog.color.b / ref.b); m.material.color.setRGB(Math.min(1.05, tc.r * 0.92), Math.min(1.05, tc.g * 0.92), Math.min(1.05, tc.b * 0.95)); }   // (hazy with the distance, the time of day's tint)
    };
    root.add(m); return m;
  }
  function mrArea(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a) / 2; }
  const MR_SHIRTS = [[0.95, 0.94, 0.9], [0.9, 0.88, 0.82], [0.72, 0.18, 0.14], [0.16, 0.42, 0.26], [0.62, 0.45, 0.3], [0.3, 0.36, 0.55], [0.85, 0.7, 0.42], [0.2, 0.22, 0.26], [0.55, 0.3, 0.42], [0.92, 0.8, 0.6]];   // (the crowd: white and pale, earth tones, the red and green of the flag)
  function buildMarrakesh(scene, tex, opts) {
    const R = rng(2971), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len;
    const WA = T.wa || new Float64Array(N).fill(w);
    const root = new THREE.Group(); scene.add(root);
    const sea = opts.season === 'winter' || opts.season === 'autumn' ? opts.season : 'summer';   // (the snow on the Atlas: built again when the season changes; the town at 470 m has none: ownSeason, painted as built all year)
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownSeason: true, season: 'mr-' + sea, paintFor: (s) => 'mr-' + (s === 'winter' || s === 'autumn' ? s : 'summer'), dust: [0.78, 0.55, 0.42] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const dP = (s) => { let d = s - sStart; return ((d % L) + L) % L; };   // (0 .. L)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    nrPrep(); mrPrep();
    const P = API.NR, G = P.G, M = MR;
    P.seC = [1.02, 1.0, 0.98];   // (the built-up land: dusty yards)
    P.colMod = (x, z, c) => {   // the red earth of the Haouz plain (the ground picture), lawns and the hotels' gardens, the Agdal's orchards, paved squares and car parks
      const n = P.n5(x * 0.6 + 300, z * 0.6), m = P.n3(x * 1.3, z * 1.3 + 90), k = 0.95 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
      c[0] = c[0] * 0.55 + 0.45 * k; c[1] = c[1] * 0.55 + 0.45 * k; c[2] = c[2] * 0.55 + 0.45 * k;   // (the meadow tones of the shared palette damped: bare earth)
      const lawn = Math.max(mrLUf(x, z, 1), mrLUf(x, z, 2)), orch = mrLUf(x, z, 3), pav = mrLUf(x, z, 4), fo = nrLCf(x, z, 1) * (1 - orch);
      c[0] = lerp(c[0], 0.86, orch * 0.7); c[1] = lerp(c[1], 0.82, orch * 0.7); c[2] = lerp(c[2], 0.78, orch * 0.7);   // (the orchards: darker, watered earth)
      c[0] = lerp(c[0], 0.62, fo * 0.6); c[1] = lerp(c[1], 0.78, fo * 0.6); c[2] = lerp(c[2], 0.6, fo * 0.6);   // (under the gardens' trees: greener)
      const lg = 0.45 + m * 0.12; c[0] = lerp(c[0], lg * 0.82, lawn); c[1] = lerp(c[1], lg * 1.62, lawn); c[2] = lerp(c[2], lg * 0.92, lawn);   // (watered lawns)
      c[0] = lerp(c[0], 0.86, pav); c[1] = lerp(c[1], 1.0, pav); c[2] = lerp(c[2], 1.12, pav);   // (paving: grey-beige)
    };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };   // (ouCutMat: the trees and small things between the camera and the car fade; hjCutMat: the buildings)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const addM = (g, mat, cast, grp) => { if (!g || g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    let MK = 0; const mark = (nm) => { for (let k = MK; k < root.children.length; k++) root.children[k].traverse(o => { if (!o.name) o.name = 'mr ' + nm; }); MK = root.children.length; };   // (the meshes named by their part: the draw-call counts per part)
    const W1 = [1, 1, 1], CH = 256;   // (the road, its verges and barriers in 512 m pieces)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const bar = (i, side) => (side > 0 ? T.br[i] : T.bl[i]);
    const inBand = (d, a, b) => d >= a && d <= b;

    /* ---- terrain tiles: which ones (built at the end, when the trees have shaded the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(mrGroundTex(tex.grass.anisotropy)), vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the stretches of the lap: on the town's streets (kerbs and pavements, the town's markings on the tarmac) or the permanent part
       round the paddock (asphalt run-offs, the circuit's red and white kerbs); the junctions' mouths (def.jn) ---- */
    const PERM = [[200, 1300]];   // (the permanent part: Turn 1 to the junction of Turn 6, metres after the start line)
    const isPerm = (d) => PERM.some(([a, b]) => d >= a && d <= b);
    const JN = (def.jn || []).map(([d, side, hw, dep, ang, kind]) => ({ d, side, hw, dep, ang: ang * Math.PI / 180, kind, s: sAt(d) }));
    const mouth = [new Int8Array(N).fill(-1), new Int8Array(N).fill(-1)];   // per side, the junction whose mouth is at the sample (-1 none)
    const kerbPaint = [new Uint8Array(N), new Uint8Array(N)];   // the kerbs painted black and white towards a junction (as the town does)
    JN.forEach((J, k) => { if (J.kind === 2) return; const si = J.side > 0 ? 1 : 0;
      for (let d = J.d - J.hw; d <= J.d + J.hw; d += ds / 2) mouth[si][T.idx(sAt(d))] = k;
      for (let d = J.d - J.hw - 22; d <= J.d + J.hw + 22; d += ds / 2) kerbPaint[si][T.idx(sAt(d))] = 1; });
    const vType = (i, side) => { const si = side > 0 ? 1 : 0, d = dP(i * ds); if (mouth[si][i] >= 0) return 0; return isPerm(d) ? 0 : 4; };   // 0 asphalt (run-off, a mouth), 4 pavement
    // the verge's cross-section per sample and side: six points [offset, height above the road] from the road's edge to 2.6 m past the barrier
    const vProf = (i, side) => {
      const t = vType(i, side), wi = WA[i], b = bar(i, side), y = T.hy[i], hk = t === 4 ? 0.13 : 0;
      const gAt = (o) => { const q = side * o; return nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.04)];
      const e = Math.max(b + 2.6, wi + 1.6);
      return [[wi, 0], [wi + 0.03, hk], lift(b + 0.6, hk), [e, Math.max(gAt(e) + 0.03, hk - 0.1)]];
    };
    const VP = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });

    /* ---- the road: asphalt, the rubber of the racing line darker, patches of newer tarmac on the streets ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tileL = 8, secT = new Float32Array(N), brk = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 40 + Math.floor(crH(k, 3, 71) * 70), t = 0.94 + crH(k, 5, 71) * 0.1; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.92 - (0.12 + 0.1 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 4.5)) * secT[i]; if (Math.abs(o) > WA[i] * 0.9) k *= 1.05; return [k * 1.02, k, k * 0.97]; };
    const offs = (i) => { const wi = WA[i], rl = clamp(T.rl[i], -wi + 1.6, wi - 1.6); return [-wi, rl - 1.3, rl, rl + 1.3, wi]; };   // (the edges and the racing line's band)
    const roadRB = new Map();   // (per piece: the road's asphalt; the asphalt verges are added to it, one draw call)
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true); let pr = -1; roadRB.set(c0, gr);
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL, os = offs(i);
        const r = gr.row(os.map(o => Pt(i, o, 0.02)), os.map(o => shade(i, o)), os.map(o => [(o + WA[i]) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, os.length - 1); pr = r;
      }
    }
    mark('road');
    /* ---- the verges: pavements of pale stone with granite kerbs (painted black and white towards the junctions) along the streets, asphalt
       round the permanent part and in the junctions' mouths; out to 2.6 m behind the barrier (under the blocks) ---- */
    const pvMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    const PAV = [0.92, 0.86, 0.8], KRB = [0.7, 0.7, 0.68], KTOP = [0.8, 0.8, 0.78], KB = [0.16, 0.16, 0.17], KW = [0.95, 0.95, 0.93];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gA = roadRB.get(c0), gP = new RB(true);
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, prev = { 0: -1, 4: -1 }; let pt = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, t = vType(i, side), pr = VP[si][i], pts = pr.map(([o, h]) => Pt(i, side * o, h + 0.02)), paint = kerbPaint[si][i] && t === 4 ? (Math.floor(ii * ds / 1.0) % 2 ? KB : KW) : null;
          const colsOf = (k) => k === 4 ? [paint || KRB, paint || KTOP, PAV, PAV] : pr.map(() => shade(i, side * WA[i]));
          const row = (k) => { const c = colsOf(k), p = side > 0 ? pts : pts.slice().reverse(), cc = side > 0 ? c : c.slice().reverse();
            return (k === 4 ? gP : gA).row(p, cc, k === 4 ? p.map(q => [q[0] / 2, -q[2] / 2]) : p.map(q => [q[0] / tileL, -q[2] / tileL])); };
          if (t !== pt) { if (pt >= 0 && prev[pt] >= 0) { const r2 = row(pt); (pt === 4 ? gP : gA).link(prev[pt], r2, 0, 3); } prev[pt] = -1; prev[t] = -1; }   // (the change of kind: the old strip runs on to this row)
          const r = row(t); if (prev[t] >= 0) (t === 4 ? gP : gA).link(prev[t], r, 0, 3); prev[t] = r; pt = t;
        }
      }
      addM(gA, aMat); addM(gP, pvMat);   // (the road with its asphalt verges, the pavements)
    }
    mark('verge');
    /* ---- the circuit's kerbs round the permanent part (red and white, on the inside and the outside of its corners) ---- */
    {
      const gk = new RB(true), cW = [0.95, 0.95, 0.93], cR = [0.82, 0.14, 0.12];
      for (const side of [-1, 1]) { let pr = -1;
        for (let ii = 0; ii <= N; ii++) { const i = ii % N, d = dP(i * ds), on = T.curb[i] && isPerm(d) && vType(i, side) === 0;
          if (!on) { pr = -1; continue; }
          const wi = WA[i], q = Math.floor(ii * ds / 1.6) % 2 ? cW : cR, pts = [Pt(i, side * (wi - 0.02), 0.03), Pt(i, side * (wi + 0.4), 0.075), Pt(i, side * (wi + 1.1), 0.03)];
          const r = side > 0 ? gk.row(pts, [q, q, q], pts.map(() => [0, 0])) : gk.row(pts.slice().reverse(), [q, q, q], pts.map(() => [0, 0]));
          if (pr >= 0) gk.link(pr, r, 0, 2); pr = r; } }
      addM(gk, lMat);
    }
    mark('kerbs');
    /* ---- on the tarmac: the town's markings on the streets (the dashed lane lines, the zebras at the crossings, arrows before the junctions),
       the start line and the grid ---- */
    let nZebra = 0, nMark = 0;
    {
      const gm = new GB(), WHT = [0.93, 0.93, 0.9], YEL = [0.95, 0.78, 0.2];
      const HYp = (p) => T.hy[p[3]];
      const strip = (s0, s1, o0, o1, col, y) => { const a = atSf(s0, o0), b = atSf(s0, o1), c = atSf(s1, o1), d = atSf(s1, o0), ya = HYp(a) + (y || 0.045), yc = HYp(c) + (y || 0.045);
        gm.quadUp([a[0], ya, a[1]], [b[0], ya, b[1]], [c[0], yc, c[1]], [d[0], yc, d[1]], [col, col, col, col]); };
      // the lane lines: the boulevard has three lanes, the other streets two; none round the permanent part
      for (let d = 0; d < L; d += 10) { if (isPerm(d) || isPerm(d + 4)) continue; const s = sAt(d), i = T.idx(s), wi = WA[i];
        const lanes = d > 2120 && d < 2570 ? [-wi / 3, wi / 3] : [0];
        for (const o of lanes) { strip(s, s + 4, o - 0.07, o + 0.07, WHT); nMark++; } }
      // the zebras across the lap where the town has its crossings (OpenStreetMap), and across the side streets' mouths
      const zebraAcross = (s, wi, wide) => { for (let o = -wi + 0.5; o < wi - 0.4; o += 1.0) strip(s - wide / 2, s + wide / 2, o, o + 0.5, WHT, 0.046); nZebra++; };
      const zs = [];
      for (const q of M.poi) { if (q.k !== 0) continue; const n = nrNear(q.x, q.z); if (n.i < 0 || n.dd > 0.5 || Math.abs(n.lat) > WA[n.i] + 2) continue; const d = dP(n.i * ds); if (isPerm(d)) continue;
        if (zs.some(z => Math.abs(z - d) < 20)) continue; zs.push(d); zebraAcross(n.i * ds, WA[n.i], 3.2); }
      for (const J of JN) { if (J.kind !== 0) continue; const wi = WA[T.idx(J.s)];   // (the zebra over the side street, a step in from the lap's edge; its stop line farther in)
        for (let a = -J.hw + 0.8; a < J.hw - 0.6; a += 1.0) strip(J.s + a, J.s + a + 0.5, J.side * (wi + 0.6), J.side * (wi + 3.6), WHT, 0.046);
        strip(J.s - J.hw + 0.5, J.s + J.hw - 0.5, J.side * (wi + 4.4), J.side * (wi + 4.8), WHT, 0.046); nZebra++;
        if (J.d > 200) for (const dd of [-34, -22]) { const s = J.s + dd, o = J.side * WA[T.idx(s)] * 0.5;   // (the arrows on the tarmac before the junction: a shaft and a head)
          strip(s, s + 3.2, o - 0.12, o + 0.12, WHT); const a = atSf(s + 3.2, o - 0.45), b = atSf(s + 3.2, o + 0.45), c = atSf(s + 4.6, o), y = T.hy[a[3]] + 0.045; gm.triO([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], WHT, [a[0], y - 5, a[1]]); } }
      // the start line (chequered across the road), the grid's boxes (two by two, 8 m apart), the pit lane's exit and entry lines
      const gq = new GB(true), wi0 = WA[T.idx(sStart)], uM = Math.round(wi0 * 2 / 0.8) / 16;
      { const a = atSf(sStart - 0.8, -wi0), b = atSf(sStart - 0.8, wi0), c = atSf(sStart + 0.8, wi0), d = atSf(sStart + 0.8, -wi0);
        gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (let k = 1; k <= 14; k++) { const sb = sStart - 9 - (k - 1) * 8 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 2.6;
        strip(sb, sb + 0.25, lat - 1.4, lat + 1.4, WHT, 0.037); strip(sb - 4.5, sb, lat - 1.4, lat - 1.25, WHT, 0.037); strip(sb - 4.5, sb, lat + 1.25, lat + 1.4, WHT, 0.037); }
      addM(gm, lMat); tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    mark('marks');
    /* ---- the barriers: concrete blocks (0.95 m) with a catch fence over them (3.4 m) on posts the whole way round, the pit wall, tyre
       barriers in front of the blocks at the run-offs (Turn 1, Turn 3, the hairpin) ---- */
    const scen = new MrChunks(8192), fenceG = new MrChunks(1024, true), ban = new GB(true);
    const atlas = ownTex(mrAtlas()), AUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // a printed board (bottom centre cx, cy, cz) facing -t (read by the cars driving along +t)
      const [u0, v0, u1, v1] = AUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const CON = [0.8, 0.8, 0.77], COND = [0.62, 0.62, 0.6], CONT = [0.88, 0.88, 0.85];
    const tyreZ = [new Uint8Array(N), new Uint8Array(N)];   // tyre barriers: in front of the blocks where the run-off is wide
    for (let i = 0; i < N; i++) for (const side of [-1, 1]) { const d = dP(i * ds), si = side > 0 ? 1 : 0; if (mouth[si][i] < 0 && bar(i, side) > WA[i] + 6 && (inBand(d, 200, 330) || inBand(d, 780, 900) || inBand(d, 2060, 2110))) tyreZ[si][i] = 1; }
    let nPost = 0, nBan = 0;
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0; let prev = -1, pt = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, b = bar(i, side), o = side * (b + 0.02), o2 = side * (b + 0.62);
          if (ii % 2 === 0 || ii === Math.min(c0 + CH, N)) { let p = [Pt(i, o, -0.3), Pt(i, o, 0.85), Pt(i, side * (b + 0.12), 0.95), Pt(i, o2, 0.95)], c = [COND, CON, CONT, CONT];   // (a block's face, its chamfer, its top: every 4 m)
            if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
            const r = gr.row(p, c); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; }
          if (tyreZ[si][i]) {   // tyre barrier: three high, a belt over them, in front of the blocks
            const t0 = side * (b - 0.95), pts = [Pt(i, t0, 0.0), Pt(i, t0, 0.95), Pt(i, side * (b - 0.02), 0.95)], uv = [[ii * ds / 3, 0.02], [ii * ds / 3, 0.98], [ii * ds / 3, 0.98]], cc = [W1, W1, [0.3, 0.3, 0.32]];
            const rt = side > 0 ? gt.row(pts, cc, uv) : gt.row(pts.slice().reverse(), cc.slice().reverse(), uv.slice().reverse()); if (pt >= 0) gt.link(pt, rt, 0, 2); pt = rt;
          } else pt = -1;
          if (ii < c0 + CH) {   // the catch fence on the blocks: posts every 4 m, the mesh from the blocks' top to 4.3 m
            const j = (i + 1) % N, Q = (k, y) => Pt(k, side * (bar(k, side) + 0.35), y);
            fenceG.get(T.px[i], T.pz[i]).quadO(Q(i, 0.95), Q(j, 0.95), Q(j, 4.3), Q(i, 4.3), W1, Pt(i, side * (b + 3.5), 2.5), [[ii * ds / 2.5, 0], [(ii * ds + ds) / 2.5, 0], [(ii * ds + ds) / 2.5, 1.35], [ii * ds / 2.5, 1.35]]);
            if (ii % 2 === 0) { const q = Q(i, 0.9), tx = T.tx[i] * 0.05, tz = T.tz[i] * 0.05, pc = [0.42, 0.43, 0.45]; scen.get(q[0], q[2]).quadO([q[0] - tx, q[1], q[2] - tz], [q[0] + tx, q[1], q[2] + tz], [q[0] + tx, q[1] + 3.45, q[2] + tz], [q[0] - tx, q[1] + 3.45, q[2] - tz], pc, Pt(i, side * (b + 2), 2)); nPost++; }   // (a post: one face, seen from the road)
          }
        }
      }
      addM(gr, rMat, true); addM(gt, new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true }), true);
    }
    mark('barriers');
    // banners along the blocks of the straights (the place's names, a made-up word or two), turned to the cars
    for (const [d0, d1, side, step] of [[-200, 160, 1, 26], [1340, 1700, -1, 34], [1340, 1700, 1, 48], [2150, 2540, -1, 30], [2150, 2540, 1, 44], [960, 1120, -1, 40], [420, 740, 1, 40]]) {
      for (let d = d0, k = 0; d < d1; d += step, k++) { const s = sAt(d), i = T.idx(s); if (mouth[side > 0 ? 1 : 0][i] >= 0 || tyreZ[side > 0 ? 1 : 0][i]) continue;
        const [x, z] = atSf(s, side * (bar(i, side) - 0.01)), y = T.hy[i], cell = MR_AT.ban + [0, 1, 2, 3, 6, 7, 8, 9, 10, 11][((k * 3 + (side > 0 ? 0 : 5) + Math.floor(d / 97)) % 10 + 10) % 10];
        board(x, y + 0.08, z, -side * T.nx[i], -side * T.nz[i], 5.6, 0.8, cell); nBan++; } }

    /* ---- the junctions (def.jn): the corners of their pavements inside the blocks, the island at the boulevard's median gap, and the street
       furniture on them, all knockable (out.props: the traffic lights, signs, bollards, lamps, bins, hydrants, cabinets, a bus shelter) ---- */
    let nProps = 0;
    const prop = (kind, s, lat, yawOff, col) => {   // a prop at s, lat (m to the right of the centre line), its +x turned to the road (+ yawOff)
      const [x, z, , i] = atSf(s, lat), side = lat > 0 ? 1 : -1, b = bar(i, side);
      if (Math.abs(lat) > b - 0.5) return false;   // (only inside the barrier: the cars can reach it)
      out.props.push({ kind, x, z, yaw: Math.atan2(-side * T.nz[i], -side * T.nx[i]) + (yawOff || 0), col: col || 0, i }); nProps++; exclPush(x, z, 1.2); return true;
    };
    const roadY = (s) => T.hy[T.idx(s)];
    let nIsl = 0;
    for (const J of JN) {
      if (J.kind === 2) continue;
      const i = T.idx(J.s), wi = WA[i], sd = J.side, ca = J.hw + 1.2;   // (the corners: just past the mouth either way, on the pavement)
      if (J.kind === 1) {   // the boulevard's median gap: the islands' noses either side of it (kerbed, paved), a keep-right sign and bollards on each
        for (const e of [-1, 1]) { const s = J.s + e * (J.hw + 1.5), o0 = sd * (wi + 0.8), o1 = sd * Math.min(bar(T.idx(s), sd) - 0.6, wi + 9);
          const g = scen.get(...atSf(s, o0).slice(0, 2)), sa = J.s + e * J.hw, sb = J.s + e * (J.hw + 8);
          for (let k = 0; k < 4; k++) { const ta = lerp(sa, sb, k / 4), tb = lerp(sa, sb, (k + 1) / 4), A = atSf(ta, o0), B = atSf(ta, o1), C = atSf(tb, o1), D = atSf(tb, o0), y = roadY(ta) + 0.15;
            g.quadUp([A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [D[0], y, D[1]], [PAV, PAV, PAV, PAV]); }
          prop('sign', J.s + e * (J.hw + 1.4), sd * (wi + 2.6)); prop('bollard', J.s + e * (J.hw + 0.9), sd * (wi + 1.3)); prop('bollard', J.s + e * (J.hw + 0.9), sd * (wi + 3.8)); nIsl++; }
        prop('signalm', J.s - J.hw - 2.2, sd * (wi + 5.2)); prop('lamp', J.s + J.hw + 3.2, sd * (wi + 5.5));
        continue;
      }
      const big = J.hw >= 7;
      // the first corner (before the mouth along the lap): the traffic light, a sign, bollards along the kerb, a bin
      prop('signalm', J.s - ca, sd * (wi + 1.1)); prop('sign', J.s - ca - 3, sd * (wi + 1.0));
      for (let k = 0; k < 3; k++) prop('bollard', J.s - J.hw - 0.4 - k * 1.4, sd * (wi + 0.55));
      prop('bin', J.s - ca - 6, sd * (wi + 1.6));
      // the second corner: the second light (for the other way), the street lamp, the hydrant, the lights' cabinet
      prop('signalm', J.s + ca, sd * (wi + 1.1)); prop('lamp', J.s + ca + 2.5, sd * (wi + 1.3));
      if (big) { prop('hydrant', J.s + ca + 6, sd * (wi + 1.0)); prop('cabinet', J.s + ca + 1.5, sd * (wi + 2.6), Math.PI / 2); }
      for (let k = 0; k < 2; k++) prop('bollard', J.s + J.hw + 0.4 + k * 1.4, sd * (wi + 0.55));
      if (J.d > 2500 || J.d < 300) prop('shelter', J.s + ca + 11, sd * (wi + 2.4), 0);   // (a bus stop on the boulevard and by the roundabout)
    }

    mark('junctions');
    /* ---- the town's streets round the circuit (def.scen.st): asphalt between kerbs and pavements, the lane lines of the bigger ones, draped
       on the ground; not inside the circuit's barriers ---- */
    const roadMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const gA1 = new GB(true), gP1 = new GB(true), stA = { get: () => gA1 }, stP = { get: () => gP1 };   // (the streets in one piece each: two draw calls)
    const inside = (x, z, pad) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < (pad || 0); };   // (inside the circuit's barriers, or within pad of them)
    let nSt = 0;
    const gy = (x, z) => nrGround(x, z), WHT2 = [2.4, 2.4, 2.3];   // (the lines: white over the asphalt picture)
    for (const r of M.st) {
      if (r.cls === 4) continue;
      const D = []; for (let k = 0; k + 1 < r.p.length; k++) { const [x0, z0] = r.p[k], [x1, z1] = r.p[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 10)); for (let q = 0; q < n; q++) D.push([x0 + (x1 - x0) * q / n, z0 + (z1 - z0) * q / n]); }
      D.push(r.p[r.p.length - 1]);
      const hw = r.hw, pw = r.cls <= 1 ? 3.0 : 2.0;
      for (let k = 0; k + 1 < D.length; k++) {
        const [xa, za] = D[k], [xb, zb] = D[k + 1], l = Math.hypot(xb - xa, zb - za) || 1, nx = -(zb - za) / l, nz = (xb - xa) / l, xm = (xa + xb) / 2, zm = (za + zb) / 2;
        if (inside(xm, zm, 1.5) || inside(xa, za, 0.5) || inside(xb, zb, 0.5)) continue;
        const Q = (x, z, o, y) => { const px = x + nx * o, pz = z + nz * o; return [px, gy(px, pz) + y, pz]; };
        const A = Q(xa, za, -hw, 0.06), B = Q(xa, za, hw, 0.06), C = Q(xb, zb, hw, 0.06), Dd = Q(xb, zb, -hw, 0.06), ac = [0.9, 0.9, 0.9];
        stA.get(xa, za).quadUp(A, B, C, Dd, [ac, ac, ac, ac], [A, B, C, Dd].map(p => [p[0] / 8, p[2] / 8]));
        for (const sd of [-1, 1]) {   // the kerb and the pavement
          const k0 = Q(xa, za, sd * hw, 0.2), k1 = Q(xb, zb, sd * hw, 0.2), p0 = Q(xa, za, sd * (hw + pw), 0.2), p1 = Q(xb, zb, sd * (hw + pw), 0.2), e0 = Q(xa, za, sd * hw, 0.06), e1 = Q(xb, zb, sd * hw, 0.06);
          if (inside(p0[0], p0[2], 0.5) || inside(p1[0], p1[2], 0.5)) continue;
          stP.get(xa, za).quadUp(k0, p0, p1, k1, [PAV, PAV, PAV, PAV], [k0, p0, p1, k1].map(p => [p[0] / 2, -p[2] / 2]));
        }
        if (r.cls <= 1 && k % 3 === 0) { const a = Q(xa, za, -0.07, 0.075), b = Q(xa, za, 0.07, 0.075), c = Q(xa + (xb - xa) * 0.6, za + (zb - za) * 0.6, 0.07, 0.075), d = Q(xa + (xb - xa) * 0.6, za + (zb - za) * 0.6, -0.07, 0.075); stA.get(xa, za).quadUp(a, b, c, d, [WHT2, WHT2, WHT2, WHT2], [[0, 0], [0.02, 0], [0.02, 0.3], [0, 0.3]]); }
      }
      nSt++;
    }
    addM(gA1, roadMat); addM(gP1, new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 }));
    mark('streets');
    /* ---- the buildings (def.scen.bld): their real footprints, plaster in the town's own pinks and ochres (a facade picture per kind: arched
       windows, shutters, loggias, arcades and shop shutters on the ground floor), the walls up past the flat roof into a parapet (its inner face
       and top seen from above), crenellated on some; a stair hut on the bigger roofs; the paddock's pit garages white ---- */
    const bMat = mrBldMat(mrFacadeTex(), cut), bNear = new MrChunks(8192, true), bFar = new MrChunks(1024, true), RUV = [[0.1, mrFV(4, 0.1)], [0.3, mrFV(4, 0.1)], [0.3, mrFV(4, 0.3)], [0.1, mrFV(4, 0.3)]];   // (the roofs in the same pieces: the plain plaster's corner of the picture, tinted)
    const PINK = [[1.0, 0.98, 0.98], [1.04, 0.96, 0.92], [0.96, 0.92, 0.94], [1.06, 1.0, 0.9], [0.98, 0.9, 0.86]], ROOF = [[0.82, 0.66, 0.56], [0.76, 0.7, 0.64], [0.86, 0.74, 0.62], [0.7, 0.6, 0.54]];
    let nBld = 0, nCren = 0;
    for (const b of M.bld) {
      const p = b.p, n = p.length; let cx = 0, cz = 0; for (const q of p) { cx += q[0]; cz += q[1]; } cx /= n; cz /= n;
      const rd = nrDist(cx, cz); if (rd > 460) continue;
      let y0 = 1e9; for (const q of p) y0 = Math.min(y0, nrGround(q[0], q[1])); y0 -= 0.25;
      const near = rd < 110, bWall = near ? bNear : bFar, bRoof = bWall, H = b.h, hsh = crH(cx, cz, 5), tint = b.kind === 3 ? W1 : PINK[Math.floor(crH(cx, cz, 6) * PINK.length)], g = bWall.get(cx, cz), par = b.kind === 3 ? 0.5 : 0.8;
      const rows = b.kind === 3 ? [7] : b.kind === 4 ? [4] : b.kind === 1 ? [[2, 6, 9][Math.floor(hsh * 3)]] : [[0, 1, 9][Math.floor(hsh * 3)]], gf = b.kind === 3 ? 7 : b.kind === 4 ? 4 : b.kind === 1 ? 3 : (hsh < 0.5 ? 8 : 3);
      const BW = b.kind === 3 ? 4.5 : 3.4;
      let u = 0;
      for (let k = 0; k < n; k++) {   // the walls, edge by edge: the ground floor (one storey), then rows of two storeys, then the parapet
        const [ax, az] = p[k], [bx, bz] = p[(k + 1) % n], el = Math.hypot(bx - ax, bz - az); if (el < 0.05) continue;
        const u0 = u / BW, u1 = (u + el) / BW, inn = [cx, y0 + H / 2, cz];
        const band = (ya, yb, row, f0, f1) => g.quadO([ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az], tint, inn, [[u0, mrFV(row, f0)], [u1, mrFV(row, f0)], [u1, mrFV(row, f1)], [u0, mrFV(row, f1)]]);
        const gH = b.kind === 3 ? Math.min(H, 4.5) : Math.min(H, 3.6);
        band(y0, y0 + 0.25 + gH, gf, 0, 1);
        for (let y = y0 + 0.25 + gH; y < y0 + H - 0.05; y += 6.8) { const top = Math.min(y0 + H, y + 6.8); band(y, top, rows[0], 0, (top - y) / 6.8); }
        band(y0 + H, y0 + H + par, 4, 0, par / 6.8);
        u += el;
      }
      // the parapet's inner face and its top, the roof inside it (a roof terrace: tiles or screed)
      const ins = p.map(([x, z]) => { const dx = cx - x, dz = cz - z, l = Math.hypot(dx, dz) || 1, t = Math.min(0.3, l * 0.3); return [x + dx / l * t, z + dz / l * t]; });
      const gr = bRoof.get(cx, cz), yr = y0 + H, rc = ROOF[Math.floor(crH(cx, cz, 7) * ROOF.length)], pc = [tint[0] * 0.92, tint[1] * 0.82, tint[2] * 0.76];
      gr.dUV = RUV[0];   // (the boxes on the roof: the plain plaster too)
      if (near) for (let k = 0; k < n; k++) { const a = p[k], b2 = p[(k + 1) % n], c = ins[(k + 1) % n], d = ins[k];
        gr.quadO([d[0], yr, d[1]], [c[0], yr, c[1]], [c[0], yr + par, c[1]], [d[0], yr + par, d[1]], pc, [a[0], yr + par / 2, a[1]], RUV);
        gr.quadUp([a[0], yr + par, a[1]], [d[0], yr + par, d[1]], [c[0], yr + par, c[1]], [b2[0], yr + par, b2[1]], [pc, pc, pc, pc], RUV); }
      const tri = THREE.ShapeUtils.triangulateShape(ins.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [a, b2, c] of tri) { const A = ins[a], B = ins[b2], C = ins[c]; gr.triO([A[0], yr + 0.02, A[1]], [B[0], yr + 0.02, B[1]], [C[0], yr + 0.02, C[1]], rc, [cx, yr - 5, cz], rc, rc, RUV[0], RUV[1], RUV[2]); }
      // crenellations on the parapets of some (the kasbah style of the hotels), near the circuit
      if (b.kind === 1 && hsh < 0.45 && rd < 260) for (let k = 0; k < n; k++) { const [ax, az] = p[k], [bx, bz] = p[(k + 1) % n], el = Math.hypot(bx - ax, bz - az), m = Math.floor(el / 1.3), rot = Math.atan2(bz - az, bx - ax);
        for (let q = 0; q < m; q += 2) { const t = (q + 0.5) / m; box(gr, ax + (bx - ax) * t, yr + par, az + (bz - az) * t, el / m * 0.9, 0.55, 0.32, rot, pc, tint, true); nCren++; } }
      if (H > 7 && Math.abs(ins.length) > 3 && crH(cx, cz, 8) < 0.6) box(gr, cx, yr, cz, 2.6, 2.4, 2.4, crH(cx, cz, 9) * Math.PI, tint, rc, true);   // (the stair hut on the roof terrace)
      exclPush(cx, cz, Math.min(30, Math.sqrt(Math.max(1, mrArea(p))) * 0.6)); nBld++;
    }
    bNear.addTo(root, bMat, true, true); bFar.addTo(root, bMat, false, true);   // (only the buildings near the circuit cast shadows)

    mark('buildings');
    /* ---- the Agdal's wall: rammed earth, 7 m, crenellated, a square tower every ~40 m, along the gardens' boundary by the back straight ---- */
    let nTow = 0;
    { const gw = new MrChunks(384, true), EA = [1, 1, 1];
      const v = (f) => mrFV(5, f);
      for (const line of M.wall) {
        let acc = 0;
        for (let k = 0; k + 1 < line.length; k++) {
          const [ax, az] = line[k], [bx, bz] = line[k + 1], l = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(l / 6));
          for (let q = 0; q < m; q++) {
            const x0 = ax + (bx - ax) * q / m, z0 = az + (bz - az) * q / m, x1 = ax + (bx - ax) * (q + 1) / m, z1 = az + (bz - az) * (q + 1) / m, sl = l / m;
            if (nrDist((x0 + x1) / 2, (z0 + z1) / 2) > 520) { acc += sl; continue; }
            const ya = nrGround(x0, z0) - 0.3, yb = nrGround(x1, z1) - 0.3, H = 7.0, nx = -(z1 - z0) / sl * 0.6, nz = (x1 - x0) / sl * 0.6, g = gw.get(x0, z0), u0 = acc / 4, u1 = (acc + sl) / 4;
            g.dUV = [0.5, v(0.5)];   // (the merlons and towers: rammed earth too)
            for (const sd of [-1, 1]) g.quadO([x0 + nx * sd, ya, z0 + nz * sd], [x1 + nx * sd, yb, z1 + nz * sd], [x1 + nx * sd, yb + H, z1 + nz * sd], [x0 + nx * sd, ya + H, z0 + nz * sd], EA, [(x0 + x1) / 2 - nx * sd, (ya + yb) / 2 + H / 2, (z0 + z1) / 2 - nz * sd], [[u0, v(0)], [u1, v(0)], [u1, v(1)], [u0, v(1)]]);
            g.quadUp([x0 - nx, ya + H, z0 - nz], [x0 + nx, ya + H, z0 + nz], [x1 + nx, yb + H, z1 + nz], [x1 - nx, yb + H, z1 - nz], [EA, EA, EA, EA], [[u0, v(0.95)], [u0, v(1)], [u1, v(1)], [u1, v(0.95)]]);
            for (let c = 0; c < 3; c++) { const t = (c + 0.25) / 3, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; box(g, x, ya + (yb - ya) * t + H, z, sl / 3 * 0.5, 0.7, 1.0, Math.atan2(z1 - z0, x1 - x0), [0.74, 0.47, 0.33], [0.8, 0.52, 0.37], true); }   // (the merlons)
            acc += sl;
            if (Math.floor((acc - sl) / 40) !== Math.floor(acc / 40)) { const tH = H + 2.2; box(g, x1, Math.min(ya, yb), z1, 4.2, tH, 4.2, Math.atan2(z1 - z0, x1 - x0), [0.72, 0.46, 0.32], [0.78, 0.5, 0.35], true); nTow++; exclPush(x1, z1, 4); }
          }
        }
      }
      gw.addTo(root, new THREE.MeshLambertMaterial({ map: mrFacadeTex(), vertexColors: true }), true, true);
    }

    mark('agdal wall');
    /* ---- the pools and ponds of the hotels' gardens: water, a pale stone coping ---- */
    { const gp = new GB(true), gc = new MrChunks(512);
      for (const q of M.pool) { const p = q.p; if (p.length < 3 || nrDist(p[0][0], p[0][1]) > 470) continue; let y = 1e9; for (const [x, z] of p) y = Math.min(y, nrGround(x, z)); y -= 0.05;
        const tri = THREE.ShapeUtils.triangulateShape(p.map(([x, z]) => new THREE.Vector2(x, z)), []), c = q.pool ? [0.55, 0.85, 0.92] : [0.4, 0.55, 0.5], uv = (a) => [a[0] / 10, -a[1] / 10];
        for (const [a, b, c2] of tri) gp.triO([p[a][0], y, p[a][1]], [p[b][0], y, p[b][1]], [p[c2][0], y, p[c2][1]], c, [p[a][0], y - 5, p[a][1]], c, c, uv(p[a]), uv(p[b]), uv(p[c2]));
        for (let k = 0; k < p.length; k++) { const [ax, az] = p[k], [bx, bz] = p[(k + 1) % p.length], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l * 0.6, nz = (bx - ax) / l * 0.6, st = [0.95, 0.92, 0.86];
          gc.get(ax, az).quadUp([ax - nx, y + 0.12, az - nz], [ax + nx, y + 0.12, az + nz], [bx + nx, y + 0.12, bz + nz], [bx - nx, y + 0.12, bz - nz], [st, st, st, st]); }
        exclPush(p[0][0], p[0][1], 6); }
      const m = addM(gp, new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 90, specular: 0x9fc6d8 })); if (m) out.dyn.water = tex.water;
      gc.addTo(root, matV, false, true); }
    mark('pools');
    /* ---- the paddock and the pits (def.scen.pad, pit): the pit lane on the left of the main straight (asphalt, its white edge lines, the
       crews' boxes in front of the garages: scenery, the game's pit stops are on the right), the paddock's tarmac, the teams' white tents and
       their trucks, the start gantry over the line ---- */
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9, shirts: MR_SHIRTS });
    let nTent = 0, nTruck = 0;
    {
      const pl = M.pit, gl = new GB(true), gd = new GB();
      for (let k = 0; k + 1 < pl.length; k++) {   // the pit lane: 7 m of asphalt along the line OpenStreetMap has, a white line either side
        const [xa, za] = pl[k], [xb, zb] = pl[k + 1], l = Math.hypot(xb - xa, zb - za) || 1, nx = -(zb - za) / l, nz = (xb - xa) / l;
        const Q = (x, z, o, y) => { const px = x + nx * o, pz = z + nz * o, n = nrNear(px, pz); return [px, (n.i >= 0 && n.dd < 3 ? T.hy[n.i] : nrGround(px, pz)) + y, pz]; };
        const A = Q(xa, za, -3.5, 0.05), B = Q(xa, za, 3.5, 0.05), C = Q(xb, zb, 3.5, 0.05), D = Q(xb, zb, -3.5, 0.05), c = [0.86, 0.86, 0.86];
        gl.quadUp(A, B, C, D, [c, c, c, c], [A, B, C, D].map(p => [p[0] / 8, p[2] / 8]));
        for (const o of [-3.3, 3.3]) { const a = Q(xa, za, o - 0.07, 0.07), b = Q(xa, za, o + 0.07, 0.07), cc = Q(xb, zb, o + 0.07, 0.07), d = Q(xb, zb, o - 0.07, 0.07), wc = [0.93, 0.93, 0.9]; gd.quadUp(a, b, cc, d, [wc, wc, wc, wc]); }
      }
      addM(gl, roadMat); addM(gd, lMat);
      // the paddock: tents in rows on the open tarmac of the permanent part (inside the pad, clear of the buildings and the lap)
      const pad = M.pad, TC = [[0.95, 0.95, 0.93], [0.93, 0.93, 0.95], [0.2, 0.4, 0.7], [0.75, 0.15, 0.12]];
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pad) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let z = z0 + 6; z < z1 - 6; z += 13) for (let x = x0 + 6; x < x1 - 6; x += 11) {
        if (!mrInPoly(pad, x, z) || excluded(x, z) || nrNear(x, z).dd < 8) continue;
        const y = nrGround(x, z), g = scen.get(x, z), c = TC[((Math.floor(x / 11) + Math.floor(z / 13)) % 2 + 2) % 2], sz = 7 + crH(x, z, 3) * 3;
        if (crH(x, z, 4) < 0.22) {   // a team's truck and its trailer
          const rot = crH(x, z, 5) < 0.5 ? 0 : Math.PI / 2; box(g, x, y, z, 13, 3.9, 2.5, rot, [0.92, 0.92, 0.94], [0.8, 0.8, 0.82], true); box(g, x + Math.cos(rot) * 7.8, y, z + Math.sin(rot) * 7.8, 2.4, 3.2, 2.5, rot, [0.16, 0.18, 0.22], null, true); nTruck++;
        } else {   // a white tent: walls, a peaked top
          box(g, x, y, z, sz, 2.4, sz, 0, c, c, true); cone(g, x, y + 2.4, z, sz * 0.72, 1.6, 4, c, [0.98, 0.98, 0.98], Math.PI / 4); nTent++;
        }
        exclPush(x, z, sz * 0.8); CR.exclAdd(x, z, sz * 0.7);
      }
      // the start gantry over the line: two posts, a beam with the five lights, a board
      { const s = sStart + 6, i = T.idx(s), wi = WA[i], y = T.hy[i], g = scen.get(T.px[i], T.pz[i]), gc = [0.2, 0.22, 0.25];
        for (const sd of [-1, 1]) { const [x, z] = atSf(s, sd * (bar(i, sd) + 0.4)); box(g, x, y - 0.3, z, 0.5, 7.6, 0.5, T.hd[i], gc); }
        const [cx, cz] = atSf(s, (bar(i, 1) - bar(i, -1)) / 2); box(g, cx, y + 6.4, cz, 0.9, 0.9, bar(i, 1) + bar(i, -1) + 1.2, T.hd[i], gc, gc);
        for (let k = -2; k <= 2; k++) { const [x, z] = atSf(s - 0.5, k * 0.9); box(g, x, y + 5.6, z, 0.3, 0.75, 0.6, T.hd[i], [0.08, 0.08, 0.09]); for (const yy of [5.75, 6.05]) box(g, x - T.tx[i] * 0.16, y + yy, z - T.tz[i] * 0.16, 0.04, 0.2, 0.22, T.hd[i], [0.75, 0.1, 0.08], [0.9, 0.2, 0.15]); }
        const [bx, bz] = atSf(s - 0.6, wi * 0.55); board(bx, y + 7.3, bz, T.tx[i], T.tz[i], 6, 1.4, MR_AT.ban + 4);
        const [b2x, b2z] = atSf(s - 0.6, -wi * 0.55); board(b2x, y + 7.3, b2z, T.tx[i], T.tz[i], 6, 1.4, MR_AT.ban); }
      // PIT boards at the lane's two ends
      for (const k of [1, pl.length - 2]) { const [x, z] = pl[k], y = nrGround(x, z), g = scen.get(x, z); for (const o of [-1.2, 1.2]) box(g, x + o, y - 0.3, z, 0.14, 3, 0.14, 0, [0.4, 0.4, 0.42]); board(x, y + 2.0, z, 0, -1, 2.6, 0.8, MR_AT.ban + 5); }
    }

    mark('paddock');
    // the trees' meshes and their placing (the palms of the roundabout's island and the streets below)
    const tMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const TG = [0, 1, 2, 3, 4, 5].map(k => mrTreeGeo(k));
    const tNear = TG.map((g, k) => new MrIChunks(g, tMat, 8192)), tFarP = new MrIChunks(TG[4], tMat, 1024), tFarO = new MrIChunks(TG[5], tMat, 1024);   // (the near trees in one piece each; the far ones in 1 km pieces)   // (the few garden trees in one piece each)
    let nPalm = 0, nOlive = 0, nTree = 0;
    const okTree = (x, z, r) => { if (excluded(x, z)) return false; const n = nrNear(x, z); if (n.i >= 0 && n.dd < (r || 1.2)) return false; if (mrStreetAt(x, z, 0.3)) return false; return true; };
    const palm = (x, z, h) => { if (!okTree(x, z, 1.4)) return false; const y = nrGround(x, z), far = nrDist(x, z) > 35;
      (far ? tFarP : tNear[0]).add(x, y - 0.1, z, crH(x, z, 1) * TAU, h * (0.95 + crH(x, z, 2) * 0.2), h, [0.95 + crH(x, z, 3) * 0.1, 1, 0.95]); nrShade(x, z, h * 0.16, 0.5); nPalm++; return true; };
    /* ---- the footbridge over Turn 2 (def.bridges: its ends from OpenStreetMap): a steel deck 6 m over the road on two trestles, stairs down
       at both ends, a board on its side; the roundabout's island south of Turn 1 (def.rbt): a kerbed lawn with palms round a tiled fountain ---- */
    let nBridge = 0;
    for (const [ax, az, bx, bz] of def.bridges || []) {
      const l = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / l, tz = (bz - az) / l, nx = -tz, nz = tx, rot = Math.atan2(tz, tx), ya = nrGround(ax, az), yb = nrGround(bx, bz), y = Math.max(ya, yb) + 6.2, g = scen.get(ax, az), st = [0.86, 0.86, 0.84], dk = [0.3, 0.32, 0.35];
      box(g, (ax + bx) / 2, y, (az + bz) / 2, l, 0.35, 3.0, rot, st, [0.72, 0.62, 0.52]);   // (the deck)
      for (const sd of [-1, 1]) { const ox = nx * 1.45 * sd, oz = nz * 1.45 * sd; box(g, (ax + bx) / 2 + ox, y + 0.35, (az + bz) / 2 + oz, l, 1.2, 0.08, rot, [0.92, 0.92, 0.9]); }   // (the solid sides)
      for (const t of [0.12, 0.88]) { const x = ax + (bx - ax) * t, z = az + (bz - az) * t, yg = nrGround(x, z); for (const sd of [-1, 1]) box(g, x + nx * 1.2 * sd, yg - 0.3, z + nz * 1.2 * sd, 0.35, y - yg + 0.3, 0.35, rot, dk); }
      for (const [ex, ez, yg, dir] of [[ax, az, ya, -1], [bx, bz, yb, 1]]) for (let k = 0; k < 8; k++) {   // (the stairs: steps down from the deck's ends, away from the road)
        const t = k / 8, x = ex + tx * dir * (1 + t * 8), z = ez + tz * dir * (1 + t * 8); box(g, x, yg, z, 1.1, Math.max(0.2, (y - yg) * (1 - t)), 2.6, rot, st, [0.78, 0.76, 0.72], true); }
      const mx = (ax + bx) / 2, mz = (az + bz) / 2; board(mx + nx * 1.55, y - 1.0, mz + nz * 1.55, -nx, -nz, 16, 1.6, MR_AT.ban); board(mx - nx * 1.55, y - 1.0, mz - nz * 1.55, nx, nz, 16, 1.6, MR_AT.ban + 1);
      exclPush(ax, az, 6); exclPush(bx, bz, 6); nBridge++;
    }
    let nFount = 0;
    for (const [cx, cz, r] of def.rbt || []) {
      const g = scen.get(cx, cz), y = nrGround(cx, cz), n = 28, gr = [0.42, 0.62, 0.3], kb = [0.85, 0.85, 0.82], til = [0.18, 0.5, 0.45], wt = [0.4, 0.68, 0.8];
      for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, P0 = [cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], P1 = [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r];
        g.triO([cx, y + 0.22, cz], [P0[0], y + 0.2, P0[1]], [P1[0], y + 0.2, P1[1]], gr, [cx, y - 5, cz]);
        g.quadO([P0[0], y - 0.1, P0[1]], [P1[0], y - 0.1, P1[1]], [P1[0], y + 0.2, P1[1]], [P0[0], y + 0.2, P0[1]], k % 2 ? kb : [0.15, 0.15, 0.16], [cx, y, cz]); }   // (the kerb, painted black and white)
      cyl(g, cx, y + 0.2, cz, 5.0, 0.6, 16, til, [0.92, 0.88, 0.8]); cyl(g, cx, y + 0.78, cz, 4.4, 0.05, 16, wt, wt);   // (the fountain's basin, its water)
      cyl(g, cx, y + 0.8, cz, 0.6, 2.4, 8, [0.92, 0.88, 0.8], til); cyl(g, cx, y + 3.2, cz, 1.4, 0.3, 8, til, [0.92, 0.88, 0.8]);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; palm(cx + Math.cos(a) * r * 0.66, cz + Math.sin(a) * r * 0.66, 9 + crH(cx, k, 3) * 4); }
      exclPush(cx, cz, r + 2); nFount++;
    }
    /* ---- a market by the paddock, outside the circuit: stalls under striped awnings, their goods (spices, rugs, lanterns, oranges) ---- */
    let nStall = 0;
    { const AW = [[0.86, 0.3, 0.18], [0.95, 0.75, 0.3], [0.2, 0.45, 0.62], [0.55, 0.2, 0.35], [0.25, 0.5, 0.3]], GD = [[0.85, 0.45, 0.12], [0.62, 0.18, 0.12], [0.9, 0.78, 0.35], [0.45, 0.25, 0.5], [0.95, 0.6, 0.1]];
      for (const [d0, d1, sd, off] of [[340, 430, 1, 16], [140, 200, 1, 26]]) for (let d = d0, k = 0; d < d1; d += 7, k++) for (let row = 0; row < 2; row++) {
        const [x, z, i] = onSide(sAt(d), sd, off + row * 9); if (excluded(x, z) || mrStreetAt(x, z, 1) || nrSlope(x, z) > 0.2) continue;
        const y = nrGround(x, z), g = scen.get(x, z), rot = T.hd[i], aw = AW[(k + row) % AW.length], gd = GD[(k * 3 + row) % GD.length], ca = Math.cos(rot), sa = Math.sin(rot);
        for (const [a, b] of [[-2.2, -1.4], [2.2, -1.4], [-2.2, 1.4], [2.2, 1.4]]) box(g, x + ca * a - sa * b, y, z + sa * a + ca * b, 0.1, 2.4, 0.1, rot, [0.4, 0.3, 0.22]);
        for (let q = 0; q < 4; q++) box(g, x + ca * (-1.65 + q * 1.1), y + 2.35, z + sa * (-1.65 + q * 1.1), 1.1, 0.1, 3.2, rot, q % 2 ? [0.95, 0.93, 0.88] : aw);   // (the striped awning)
        box(g, x, y, z, 4.0, 0.9, 1.6, rot, [0.5, 0.36, 0.24], [0.56, 0.42, 0.3]); for (let q = 0; q < 5; q++) cone(g, x + ca * (-1.6 + q * 0.8), y + 0.9, z + sa * (-1.6 + q * 0.8), 0.3, 0.3, 6, gd, gd, 0);   // (the counter, heaps of goods)
        exclPush(x, z, 3.5); CR.exclAdd(x, z, 2.6); nStall++; } }
    /* ---- the grandstands (def.stands): steel tiers behind the catch fence, a white canopy over them, the crowd; spectators on the pavements
       of the streets (def.ga) behind the fences ---- */
    const crowdMat = ownTex(rbCrowdTex(false)), crowdG = new GB(true);
    const crowdPts = [];
    let nStands = 0;
    for (const [sa, sb, side, rows] of def.stands || []) {
      const dep = 0.85, rise = 0.5, rws = [];
      for (let d = sa; d <= sb + 0.01; d += 5) {
        const s = sAt(d), i = T.idx(s), f0 = bar(i, side) + 1.4, g0 = hyS(s) + 0.1, prof = [[f0 - 0.3, g0 - 0.6]]; let y = g0;
        for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = g0 + 0.6 + k * rise; prof.push([o, y], [o + dep, y]); }
        const back = f0 + rows * dep; prof.push([back, y + 1.1], [back + 0.2, y + 1.1], [back + 0.2, g0 - 0.5]);
        rws.push({ s, pts: prof.map(([o, yy]) => { const [x, z] = atSf(s, side * o); return [x, yy, z]; }), prof });
      }
      const seat = [0.72, 0.18, 0.15], steel = [0.44, 0.46, 0.5];
      for (let m = 0; m + 1 < rws.length; m++) {
        const A = rws[m], B = rws[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
        for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
          const [ix, iz] = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? seat : steel, [ix, up ? ym - 1 : ym, iz]); }
        for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], len = Math.hypot(B.pts[1][0] - A.pts[1][0], B.pts[1][2] - A.pts[1][2]), v = (k * 0.11) % 1, u0 = (m * 5) / 12;
          crowdG.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        // the canopy: a white membrane on masts over the tiers, sloping to the back
        const yt = A.pts[n - 3][1] + 3.2, fr = A.prof[1][0] - 0.5, bk = A.prof[n - 3][0] + 0.4, C0 = atSf(A.s, side * fr), C1 = atSf(A.s, side * bk), C2 = atSf(B.s, side * bk), C3 = atSf(B.s, side * fr), wc = [0.97, 0.97, 0.95];
        g.quadO([C0[0], yt + 0.8, C0[1]], [C1[0], yt, C1[1]], [C2[0], yt, C2[1]], [C3[0], yt + 0.8, C3[1]], wc, [C0[0], yt - 5, C0[1]]);
        g.quadO([C0[0], yt + 0.8, C0[1]], [C1[0], yt, C1[1]], [C2[0], yt, C2[1]], [C3[0], yt + 0.8, C3[1]], wc, [C0[0], yt + 5, C0[1]]);
        if (m % 2 === 0) { const [bx, bz] = atSf(A.s, side * bk), by = nrGround(bx, bz); box(g, bx, by - 0.3, bz, 0.25, yt - by + 0.3, 0.25, T.hd[T.idx(A.s)], steel); }
      }
      { const Mi = rws[rws.length >> 1], i = T.idx(Mi.s), [x, z] = atSf(Mi.s, side * (Mi.prof[0][0] + 0.3)), y = Mi.pts[0][1] + 0.7; board(x, y, z, -side * T.nx[i], -side * T.nz[i], 9, 1.2, MR_AT.ban + 13); }
      for (const r of rws) { const [x, z] = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(x, z, rows * dep / 2 + 6); CR.exclAdd(x, z, rows * dep / 2 + 3); crowdPts.push(x, z, 0.9); }
      nStands++;
    }
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: crowdMat, vertexColors: true }), 1, 0.11, 0.1));
    {
      const Mc = { first: 1.6, gap: 1.0, excluded, below: 2, above: 4, sit: 0.2, flag: 0.06, maxSlope: 0.9 };
      for (const [a, b, sd] of def.ga || []) { crowdRun(CR, sStart + a, sStart + b, sd, Object.assign({}, Mc, { rows: 3, dens: 0.55, clump: 0.6, label: 'MR ga' }));
        for (let d = a; d < b; d += 24) { const [x, z] = onSide(sAt(d), sd, 3); crowdPts.push(x, z, 0.6); } }
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }

    mark('stands');
    /* ---- turn numbers on the blocks before the corners, marshal posts ---- */
    (def.turns || []).forEach(([tx0, tz0], k) => {
      const i0 = T.nearestIdx(tx0, tz0), side = T.k[i0] > 0 ? -1 : 1, s = i0 * ds - 45, i = T.idx(s); if (mouth[side > 0 ? 1 : 0][i] >= 0) return;
      const [x, z] = atSf(s, side * (bar(i, side) - 0.02)); board(x, T.hy[i] + 1.0, z, -side * T.nx[i], -side * T.nz[i], 1.4, 1.0, MR_AT.num + k);
    });

    mark('boards');
    /* ---- the trees: date palms along the boulevards (both sides and on the median) and the streets by the circuit, in the hotels' gardens
       with orange trees and flowering shrubs; the Agdal's olive groves in their rows behind its wall; the land cover's trees elsewhere ---- */
    // along the streets: the boulevard and the avenues every ~10 m both sides (and so on the median between the boulevard's carriageways)
    for (const r of M.st) { if (r.cls > 1) continue; const gap = r.cls === 0 ? 11 : 15;
      for (let k = 0; k + 1 < r.p.length; k++) { const [x0, z0] = r.p[k], [x1, z1] = r.p[k + 1], l = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
        for (let q = gap * 0.5; q < l; q += gap) for (const sd of [-1, 1]) { const o = r.hw + (r.cls <= 1 ? 2.2 : 1.5), x = x0 + (x1 - x0) * q / l + nx * o * sd, z = z0 + (z1 - z0) * q / l + nz * o * sd;
          if (nrDist(x, z) < 300) palm(x, z, 9 + crH(x, z, 4) * 6); } } }
    // along the circuit's own streets, behind the blocks: the main straight (west), the back straight (west), the boulevard (both), round the hotel gardens
    for (const [d0, d1, sd, gap] of [[-220, 190, 1, 11], [1320, 1700, -1, 12], [2140, 2550, 1, 10], [2140, 2550, -1, 10], [1880, 2050, -1, 14], [2620, 2720, -1, 12]])
      for (let d = d0; d < d1; d += gap) { const [x, z] = onSide(sAt(d), sd, 2.4 + crH(d, sd, 5) * 0.8); palm(x, z, 10 + crH(d, sd, 6) * 5); }
    // the gardens (lawns): palms, orange trees, shrubs; the land cover's trees outside the Agdal
    { const Lc = M.L;
      for (let j = 0; j < Lc.nz; j++) for (let i = 0; i < Lc.nx; i++) {
        const v = M.lu[j * Lc.nx + i], x = Lc.x0 + (i + 0.2 + crH(i, j, 11) * 0.6) * Lc.cell, z = Lc.z0 + (j + 0.2 + crH(i, j, 12) * 0.6) * Lc.cell, rd = nrDist(x, z);
        if (rd > 240) continue;
        const h = crH(i, j, 13);
        if (v === 1) { if (h < 0.18) palm(x, z, 8 + crH(i, j, 14) * 7); else if (h < 0.34 && okTree(x, z)) { const k = h < 0.27 ? 2 : 3, s = k === 2 ? 4 + crH(i, j, 15) * 2 : 2 + crH(i, j, 15); tNear[k].add(x, nrGround(x, z) - 0.1, z, h * 40, s * 1.2, s, null); nTree++; } }
        else if (v === 0 && nrLC(x, z) === 1 && h < 0.35 && okTree(x, z)) { if (h < 0.15) palm(x, z, 9 + crH(i, j, 16) * 6); else { const s = 5 + crH(i, j, 17) * 3; (rd > 60 ? tFarO : tNear[1]).add(x, nrGround(x, z) - 0.1, z, h * 40, s * 1.3, s, null); nTree++; } }
      } }
    // the Agdal's olive groves: in rows 8 m apart (its own grid), up to 220 m from the circuit
    { const Lc = M.L; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let j = 0; j < Lc.nz; j++) for (let i = 0; i < Lc.nx; i++) if (M.lu[j * Lc.nx + i] === 3) { x0 = Math.min(x0, Lc.x0 + i * Lc.cell); x1 = Math.max(x1, Lc.x0 + (i + 1) * Lc.cell); z0 = Math.min(z0, Lc.z0 + j * Lc.cell); z1 = Math.max(z1, Lc.z0 + (j + 1) * Lc.cell); }
      const a = 0.28, ca = Math.cos(a), sa = Math.sin(a);   // (the groves' rows run with the garden's wall, a little off north-south)
      for (let u = -400; u < 1400; u += 10) for (let v = -400; v < 1400; v += 10) {
        const x = x0 + u * ca - v * sa, z = z0 + u * sa + v * ca; if (x < x0 || x > x1 || z < z0 || z > z1 || mrLU(x, z) !== 3) continue;
        const rd = nrDist(x, z); if (rd > 150 || rd < 18 || excluded(x, z) || crH(u, v, 21) < 0.08) continue;
        const s = 4.2 + crH(u, v, 22) * 1.6; (rd > 35 ? tFarO : tNear[1]).add(x, nrGround(x, z) - 0.1, z, crH(u, v, 23) * TAU, s * 1.35, s, [0.95 + crH(u, v, 24) * 0.1, 1, 0.98]); nrShade(x, z, s * 0.35, 0.6); nOlive++;
      } }
    tNear.forEach((t, k) => t.addTo(root, k < 2)); tFarP.addTo(root, false); tFarO.addTo(root, false);   // (the small garden trees cast no shadow)

    mark('trees');
    /* ---- parked cars in the car parks and along the bigger streets (outside the circuit): a few of them the town's beige small taxis ---- */
    let nCars = 0;
    { const cg = new GB(); parkedCar(cg, 0, 0, 0, 0, W1, 1, true);   // (the car of js/world.js, a small hatchback; its body white: each instance's colour)
      const cars = new MrIChunks(cg.geometry(), matV, 256), CC = [[0.93, 0.93, 0.92], [0.12, 0.12, 0.13], [0.6, 0.62, 0.66], [0.75, 0.66, 0.46], [0.5, 0.1, 0.1], [0.2, 0.3, 0.5], [0.84, 0.74, 0.5]];
      const put = (x, z, rot, k) => { if (!okTree(x, z, 2.5)) return; cars.add(x, nrGround(x, z), z, rot, 1, 1, CC[k % CC.length]); exclPush(x, z, 2.6); nCars++; };
      for (const p of M.park) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
        if (nrDist((x0 + x1) / 2, (z0 + z1) / 2) > 400) continue;
        for (let z = z0 + 3; z < z1 - 2; z += 6) for (let x = x0 + 1.5; x < x1 - 1; x += 2.6) if (mrInPoly(p, x, z) && crH(x, z, 31) < 0.6) put(x, z, Math.PI / 2 + (crH(x, z, 32) - 0.5) * 0.1, Math.floor(crH(x, z, 33) * 9)); }
      for (const r of M.st) { if (r.cls > 2 || r.cls === 0) continue;
        for (let k = 0; k + 1 < r.p.length; k++) { const [x0, z0] = r.p[k], [x1, z1] = r.p[k + 1], l = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / l, nz = (x1 - x0) / l, rot = Math.atan2(z1 - z0, x1 - x0);
          for (let q = 3; q < l - 3; q += 5.4) for (const sd of [-1, 1]) { if (crH(x0 + q, z0 + sd, 34) > 0.35) continue; const x = x0 + (x1 - x0) * q / l + nx * (r.hw - 1.1) * sd, z = z0 + (z1 - z0) * q / l + nz * (r.hw - 1.1) * sd; if (nrDist(x, z) < 300) put(x, z, rot, Math.floor(crH(x, z, 35) * 9)); } } }
      cars.addTo(root, false); }

    mark('cars');
    /* ---- street lamps along the streets by the circuit, behind the blocks (scenery; the knockable ones stand in the junctions) ---- */
    { const lg = new GB(); const gn = [0.14, 0.22, 0.17], gd = [0.62, 0.52, 0.28];
      cyl(lg, 0, 0, 0, 0.12, 7.4, 6, gn, gn, 0.08); box(lg, 0.55, 7.1, 0, 1.1, 0.07, 0.07, 0, gn, gn); cyl(lg, 1.15, 6.7, 0, 0.18, 0.4, 6, [1, 0.88, 0.62], null, 0.22); cone(lg, 1.15, 7.1, 0, 0.24, 0.32, 6, gn, gd, 0);
      const lamps = new MrIChunks(lg.geometry(), matV, 256); let nL = 0;
      for (const [d0, d1, sd] of [[-220, 190, 1], [1320, 1700, -1], [1320, 1700, 1], [2140, 2550, 1], [2140, 2550, -1], [1880, 2050, 1]]) for (let d = d0 + 13; d < d1; d += 26) {
        const [x, z, i] = onSide(sAt(d), sd, 1.6); if (mouth[sd > 0 ? 1 : 0][i] >= 0 || excluded(x, z)) continue; lamps.add(x, nrGround(x, z), z, Math.atan2(-sd * T.nz[i], -sd * T.nx[i]), 1, 1, null); nL++; }
      lamps.addTo(root, true); out.lampsN = nL; }

    mark('lamps');
    /* ---- terrain tiles, coloured now (the shade under the trees) ---- */
    let nTiles = 0;
    { const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      G.col = G.cov = P.edge = null; }

    mark('terrain');
    // the knocked props' floor: the verge's own cross-section (the pavements 0.13 m up, the asphalt at the road's height)
    out.propR = 120;
    out.propFloor = propFloorTable(null, (i, side) => VP[side > 0 ? 1 : 0][i]);
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fenceG.addTo(root, fMat, false, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    mark('scenery'); crowdFinish(CR, root, out); mark('crowds');
    out.crowdPts = Float32Array.from(crowdPts);
    if (def.far) out.dyn.far = rsFar(root, def.far, sea, hyS(sStart) + 6);
    if (def.minaret) out.dyn.mrFar = mrFarTower(root, def.minaret[0], def.minaret[1], def.minaret[2]);   // (the old town's minaret on the horizon to the north)
    mark('far');
    out.stats = { tiles: nTiles, buildings: nBld, crenels: nCren, towers: nTow, palms: nPalm, olives: nOlive, trees: nTree, cars: nCars, stands: nStands, tents: nTent, trucks: nTruck, props: nProps, islands: nIsl, zebras: nZebra, marks: nMark, banners: nBan, posts: nPost, streets: nSt, bridges: nBridge, fountains: nFount, stalls: nStall };   // (read by the tests)
    return out;
  }

  Object.assign(API, { mrFarTower });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { MR: { get: () => MR, set: (v) => { MR = v; } } });
  World.ext.marrakesh = (scene, tex, opts) => buildMarrakesh(scene, tex, opts);
})();
