/* =========================================================================
   WORLD — the houses by the road, a PROTOTYPE for the pictures »zdaj in potem« (the package S · Stavbe of docs/realizem.md; docs/hise-ob-cesti.md).
   A facade atlas drawn on a canvas (generic: plaster, windows with shutters, doors, roller shutters, railings, roof tiles; no names, signs or
   logos, no photographs) and a builder of one house on its OpenStreetMap footprint in three levels of detail (World.api.hise.house):
     1  better shapes and roofs: hipped and gabled roofs of tiles (the atlas's courses), ridges and hips, chimneys; the walls as they are today
     2  and the walls from the atlas: windows by floors, doors, shutters; balconies on the wall that looks at the road; wide eaves
     3  and what stands by the road: the yard with its wall or hedge and gate, shrubs, a parked car, awnings, solar panels
   One texture and one material for every house of a track (a mesh a scenery chunk); the wall's and the roof's colours are the vertex colours,
   so a house costs about as many vertices as today's box with its band and stepped roof. Each strip of the atlas runs the whole width and
   repeats along u (RepeatWrapping), so a wall of any length is one quad a floor (or one for all its floors: the rows stack).
   Switched on by index.html?hise=1|2|3 on the tracks whose builder asks (Livorno); without it nothing changes.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { box, cone, ico, parkedCar, crH, clamp, rng } = API;
  const AW = 1024, AH = 1024, BAY = 128;
  // the strips' tops (px from the canvas's top); a bay is 128 px wide (~2.9 m of wall), a floor 128 px high
  const ST = { upA: 0, upB: 128, gr: 256, flUp: 384, flGr: 512, plain: 640, rail: 704, wall: 736, white: 764, roof: 768 };
  const vAt = (y) => 1 - y / AH, WHITE = [0.5, vAt(ST.white + 2)];
  const DOOR = [1, 6], TALL = [2, 6], FLB = [1, 3, 5], SHOP = [0, 2, 5];   // which bays of a strip hold a door, a French window, the flats' balcony doors, the shops
  let TEX = null, MAT = null;

  function atlas() {
    if (TEX) return TEX;
    const c = document.createElement('canvas'); c.width = AW; c.height = AH;
    const x = c.getContext('2d'), R = rng(4711);
    const rect = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // the plaster under every wall: nearly white (the wall's colour is the vertex colour), its flecks and the streaks the rain leaves
    const plaster = (y0, h) => {
      rect('#f4f1e9', 0, y0, AW, h);
      for (let k = 0; k < h * 16; k++) { const a = R() * AW, b = y0 + R() * (h - 4); x.fillStyle = R() < 0.55 ? 'rgba(70,56,40,' + (0.012 + R() * 0.03) + ')' : 'rgba(255,255,255,' + (0.04 + R() * 0.06) + ')'; x.fillRect(a, b, 2 + R() * 8, 1 + R() * 4); }
      for (let k = 0; k < h / 2.5; k++) { const a = R() * AW, b = y0 + R() * h * 0.6, l = Math.min(10 + R() * h * 0.5, y0 + h - b); x.fillStyle = 'rgba(80,66,48,' + (0.025 + R() * 0.035) + ')'; x.fillRect(a, b, 1 + R() * 2.2, l); }
    };
    const shade = (y0, h, a0, a1) => { const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(46,34,22,' + a0 + ')'); g.addColorStop(1, 'rgba(46,34,22,' + a1 + ')'); x.fillStyle = g; x.fillRect(0, y0, AW, h); };
    const louv = (a, b, w, h, S) => { rect(S[0], a, b, w, h); x.fillStyle = S[1]; for (let yy = b + 2; yy < b + h - 1; yy += 4) x.fillRect(a + 2, yy, w - 4, 1.7); x.strokeStyle = S[1]; x.lineWidth = 1.2; x.strokeRect(a + 0.6, b + 0.6, w - 1.2, h - 1.2); };
    const glass = (a, b, w, h) => { const g = x.createLinearGradient(0, b, 0, b + h); g.addColorStop(0, '#8097a8'); g.addColorStop(0.42, '#3b4955'); g.addColorStop(1, '#252e37'); x.fillStyle = g; x.fillRect(a, b, w, h); };
    const GRN = ['#3b6348', '#274431'], BRN = ['#70503a', '#4c3423'];
    // a window: its stone surround and sill, the glass and its frame, the shutters open beside it or closed over it (tall: a French window
    // down to the floor; roll: a roller shutter let down by that share; grille: iron bars, a ground floor's)
    const win = (bx, y0, o) => {
      const w = o.w || 46, a = bx + (BAY - w) / 2, b = y0 + (o.tall ? 24 : 30), h = o.tall ? 100 : 62, S = o.sh || GRN;
      rect('#d9d1bf', a - 4, b - 4, w + 8, h + (o.tall ? 4 : 8));
      if (!o.tall) { rect('#ebe5d6', a - 7, b + h + 2, w + 14, 4); rect('rgba(50,38,26,0.3)', a - 6, b + h + 6, w + 12, 3); }
      glass(a, b, w, h);
      x.strokeStyle = '#efece3'; x.lineWidth = 2.6; x.strokeRect(a + 1.3, b + 1.3, w - 2.6, h - 2.6);
      rect('#efece3', a + w / 2 - 1.3, b, 2.6, h); rect('#efece3', a, b + h * (o.tall ? 0.26 : 0.36), w, 2.2);
      rect('rgba(18,20,24,0.42)', a, b, w, 4);
      if (o.grille) { x.fillStyle = '#22252a'; for (let k = 1; k < 6; k++) x.fillRect(a + k * w / 6 - 0.8, b, 1.6, h); for (let k = 1; k < 5; k++) x.fillRect(a, b + k * h / 5 - 0.8, w, 1.6); }
      if (o.roll) { const k = o.roll; rect('#cbc8bc', a, b, w, h * k); x.fillStyle = '#a5a297'; for (let yy = b + 3; yy < b + h * k; yy += 4) x.fillRect(a, yy, w, 1.2); rect('rgba(18,20,24,0.4)', a, b + h * k, w, 2.5); }
      else if (o.closed) { louv(a, b, w / 2, h, S); louv(a + w / 2, b, w / 2, h, S); }
      else if (!o.bare) { const pw = Math.min(22, w * 0.5); louv(a - 5 - pw, b - 1, pw, h + 2, S); louv(a + w + 5, b - 1, pw, h + 2, S); rect('rgba(50,38,26,0.2)', a - 5 - pw, b + h + 1, pw, 2.5); rect('rgba(50,38,26,0.2)', a + w + 5, b + h + 1, pw, 2.5); }
    };
    // a door at the foot of its bay: wood with panels and a light over it, a slatted one (a garage, a shop's roller shutter), a glazed one
    const door = (bx, y0, o) => {
      const w = o.w || 46, h = o.h || 94, a = bx + (BAY - w) / 2, b = y0 + BAY - h;
      rect('#d0c8b5', a - 6, b - 6, w + 12, h + 6);
      if (o.kind === 'slat') { rect(o.col || '#75847a', a, b, w, h); x.fillStyle = 'rgba(18,24,22,0.33)'; for (let yy = b + 3; yy < b + h; yy += 6) x.fillRect(a, yy, w, 1.7); }
      else if (o.kind === 'glass') { glass(a, b, w, h); x.strokeStyle = '#9ba1a3'; x.lineWidth = 3; x.strokeRect(a + 1.5, b + 1.5, w - 3, h - 3); rect('#9ba1a3', a + w / 2 - 1.5, b, 3, h); }
      else {
        rect(o.col || '#6f4b32', a, b, w, h); glass(a + 4, b + 4, w - 8, 12);
        x.strokeStyle = 'rgba(30,18,10,0.55)'; x.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) x.strokeRect(a + 5 + i * (w / 2 - 2), b + 22 + j * ((h - 26) / 2), w / 2 - 8, (h - 26) / 2 - 5);
        rect('rgba(30,18,10,0.6)', a + w / 2 - 0.8, b + 19, 1.6, h - 19);
      }
      rect('rgba(18,20,24,0.4)', a, b, w, 3.5); rect('#dfd9c9', a - 9, y0 + BAY - 4, w + 18, 4);
    };
    const course = (y0) => { rect('rgba(255,255,255,0.55)', 0, y0 + BAY - 6, AW, 3.5); rect('rgba(60,45,30,0.24)', 0, y0 + BAY - 2.5, AW, 2.5); };   // (the string course at a floor's foot)
    // the upper floors of a house: two rows that stack over the ground floor's (a house of three floors takes all three in one quad)
    [ST.upA, ST.upB].forEach((y0, n) => {
      plaster(y0, BAY); shade(y0, 14, 0.2, 0); course(y0);
      (n ? ['o', 'o', 't', 'c', 'o', 'b', 't', 'o'] : ['o', 'c', 't', 'o', 'o', 'b', 't', 'c']).forEach((k, i) => { const bx = i * BAY; if (k === 'o') win(bx, y0, {}); else if (k === 'c') win(bx, y0, { closed: true }); else if (k === 't') win(bx, y0, { tall: true, closed: n === 0 && i === 6 }); });
    });
    // a house's ground floor: the plinth, the doors under the French windows' neighbours, a garage, windows behind grilles or shutters
    plaster(ST.gr, BAY); shade(ST.gr, 10, 0.12, 0); shade(ST.gr + BAY - 50, 26, 0, 0.1);
    rect('#d2ccbd', 0, ST.gr + BAY - 24, AW, 24); rect('rgba(60,45,30,0.3)', 0, ST.gr + BAY - 25, AW, 1.6);
    ['g', 'd', 'c', 'o', 'G', 'o', 'd', 'c'].forEach((k, i) => { const bx = i * BAY, y0 = ST.gr;
      if (k === 'g') win(bx, y0, { bare: true, grille: true }); else if (k === 'c') win(bx, y0, { closed: true }); else if (k === 'o') win(bx, y0, {});
      else if (k === 'd') door(bx, y0, { col: i === 1 ? '#6f4b32' : '#35503d' }); else door(bx, y0, { kind: 'slat', w: 100, h: 86 }); });
    // a block of flats: the upper floors (wide windows and balcony doors behind roller shutters) over shops, garages and the way in
    plaster(ST.flUp, BAY); shade(ST.flUp, 8, 0.12, 0); course(ST.flUp);
    ['w', 'b', 'w', 'b', 's', 'b', 'w', 'n'].forEach((k, i) => { const bx = i * BAY, y0 = ST.flUp, r = 0.2 + R() * 0.5;
      if (k === 'w') win(bx, y0, { w: 70, roll: r, bare: true }); else if (k === 'b') win(bx, y0, { w: 58, tall: true, roll: r * 0.6, bare: true }); else if (k === 's') win(bx, y0, { w: 30, bare: true }); });
    plaster(ST.flGr, BAY); rect('rgba(60,45,30,0.14)', 0, ST.flGr + 12, AW, 10);
    rect('#cdc7b8', 0, ST.flGr + BAY - 16, AW, 16);
    ['S', 'e', 'S', 'G', 'w', 'S', 'e', 'w'].forEach((k, i) => { const bx = i * BAY, y0 = ST.flGr;
      if (k === 'S') door(bx, y0, { kind: 'slat', w: 104, h: 98, col: R() < 0.5 ? '#b7b6ad' : '#9aa39c' }); else if (k === 'e') door(bx, y0, { kind: 'glass', w: 52, h: 98 });
      else if (k === 'G') door(bx, y0, { kind: 'slat', w: 100, h: 88 }); else win(bx, y0, { bare: true, grille: true }); });
    // plain plaster (side walls, gables, sheds, parapets); a balcony's railing (iron bars before the shaded wall); a yard's wall under its coping
    plaster(ST.plain, 64);
    rect('#8f8f8c', 0, ST.rail, AW, 32); x.fillStyle = '#22252a'; for (let a = 0; a < AW; a += 8) x.fillRect(a + 3, ST.rail + 3, 2, 26); rect('#1b1e22', 0, ST.rail, AW, 4); rect('#1b1e22', 0, ST.rail + 28, AW, 4);
    plaster(ST.wall, 28); rect('#e9e3d3', 0, ST.wall, AW, 5); rect('rgba(50,38,26,0.3)', 0, ST.wall + 5, AW, 2); shade(ST.wall + 16, 12, 0, 0.16);
    rect('#ffffff', 0, ST.white, AW, 4);
    // the roof: courses of tiles from the eave (the strip's foot) to the ridge, 16 px a course (0.5 m), 8 px a tile (0.25 m): the cover tile's lit
    // back and the channel's shade, each tile its own tone, a few old and dark, the overlap's shadow at each course's foot, lichen in patches
    for (let r = 0; r < 16; r++) for (let k = 0; k <= 128; k++) {
      const a = k * 8 - (r % 2 ? 4 : 0), b = ST.roof + r * 16, f = 0.83 + R() * 0.19, t = R(), o = t < 0.07 ? 0.76 : 1;
      rect('rgb(' + Math.round(255 * f * o) + ',' + Math.round(249 * f * o * (t > 0.9 ? 1.02 : 1)) + ',' + Math.round(242 * f * o * (t > 0.9 ? 0.9 : 1)) + ')', a, b, 8, 16);
      rect('rgba(44,22,10,0.36)', a, b, 2, 16); rect('rgba(255,244,226,0.22)', a + 4, b, 2, 16);
    }
    for (let r = 0; r < 16; r++) { rect('rgba(44,22,10,0.4)', 0, ST.roof + r * 16 + 14, AW, 2); rect('rgba(255,244,226,0.12)', 0, ST.roof + r * 16, AW, 2.5); }
    for (let k = 0; k < 46; k++) { x.fillStyle = 'rgba(74,82,60,' + (0.05 + R() * 0.09) + ')'; x.beginPath(); x.ellipse(R() * AW, ST.roof + 12 + R() * 232, 10 + R() * 34, 5 + R() * 12, 0, 0, 6.3); x.fill(); }
    const t = TEX = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4;
    return t;
  }
  const mat = () => MAT || (MAT = new THREE.MeshLambertMaterial({ map: atlas(), vertexColors: true }));

  const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const uR = (m) => m / 32, vR = (m) => vAt(AH - 1) + Math.min(m, 7.9) / 8 * (254 / AH);   // the roof's strip: 32 m across the atlas, 8 m from the eave up
  const AWN = [[0.3, 0.46, 0.34], [0.84, 0.62, 0.28], [0.56, 0.22, 0.2], [0.9, 0.86, 0.74], [0.3, 0.4, 0.56]];
  const CARS = [[0.82, 0.82, 0.8], [0.2, 0.22, 0.25], [0.6, 0.12, 0.1], [0.3, 0.38, 0.5], [0.72, 0.72, 0.74], [0.5, 0.52, 0.5]];

  // One house on its footprint. o: g (a GB with UVs: Chunks(…, true)), x, z, L, W, ang (the footprint, as LD.bld), y0 (the ground under it),
  // hh (the walls' height), fl (floors), type ('house' | 'small' | 'flats'), wall, roof, band (colours; band: today's row of shutters, level 1),
  // lev (1-3), near (2 by the road, 1 near, 0 farther out), rd ([x, z]: the way to the road from the house), gH(x, z) (the ground),
  // onRoad(x, z) (inside the road's barriers: nothing of a yard there). Returns the vertices it added.
  function house(o) {
    const g = o.g, n0 = g.P.length;
    let L = o.L, W = o.W, ang = o.ang; if (W > L) { const t = L; L = W; W = t; ang += Math.PI / 2; }
    const c = Math.cos(ang), s = Math.sin(ang), x0 = o.x, z0 = o.z, y0 = o.y0, hh = o.hh, lev = o.lev, near = o.near, flats = o.type === 'flats', small = o.type === 'small';
    const fl = Math.max(1, o.fl), fh = hh / fl, wc = o.wall, H = (k) => crH(x0, z0, 40 + k);
    const P = (lx, ly, lz) => [x0 + lx * c - lz * s, y0 + ly, z0 + lx * s + lz * c];
    const inn = [x0, y0 + hh * 0.5, z0];
    g.dUV = WHITE;
    // the four walls: [from, to (local x, z)], the wall's own angle; the one that looks at the road
    const WL = [[[L / 2, W / 2], [-L / 2, W / 2], ang, 0, 1], [[-L / 2, -W / 2], [L / 2, -W / 2], ang, 0, -1], [[L / 2, -W / 2], [L / 2, W / 2], ang + Math.PI / 2, 1, 0], [[-L / 2, W / 2], [-L / 2, -W / 2], ang + Math.PI / 2, -1, 0]];
    let face = -1; if (o.rd) { let bd = 0.3; WL.forEach((w, k) => { const nx = w[3] * c - w[4] * s, nz = w[3] * s + w[4] * c, d = nx * o.rd[0] + nz * o.rd[1]; if (d > bd) { bd = d; face = k; } }); }
    /* ---- the walls ---- */
    if (lev < 2) {   // as today: the wall's colour, a row of shutters round a house, rows of windows round a block of flats
      box(g, x0, y0 - 0.5, z0, L, hh + 0.5, W, ang, wc, null, true);
      if (flats) for (let f = 1; f <= fl; f++) box(g, x0, y0 + f * fh - 1.8, z0, L + 0.05, 0.9, W + 0.05, ang, mul(o.band, 0.75), null, true);
      else if (!small) box(g, x0, y0 + hh * 0.55, z0, L + 0.04, 1.1, W + 0.04, ang, o.band, null, true);
    } else {
      const top = flats ? ST.flUp : small || fl === 1 ? ST.gr : fl === 2 ? ST.upB : ST.upA, bot = flats ? ST.flGr + BAY : ST.gr + BAY, rows = (bot - top) / BAY;
      WL.forEach((w, k) => {
        const A = w[0], B = w[1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), nb = Math.max(1, Math.round(len / 2.9));
        let u0 = Math.floor(H(k) * 8);
        if (k === face) u0 = ((DOOR[H(5) < 0.5 ? 0 : 1] - Math.floor((nb - 1) / 2)) % 8 + 8) % 8;   // a door in the middle of the wall on the road
        else if (small) u0 = 3;
        const ua = u0 / 8, ub = (u0 + nb) / 8, hb = Math.min(rows, fl) * fh;
        const q = (ya, yb, va, vb) => g.quadO(P(A[0], ya, A[1]), P(B[0], ya, B[1]), P(B[0], yb, B[1]), P(A[0], yb, A[1]), wc, inn, [[ua, va], [ub, va], [ub, vb], [ua, vb]]);
        q(-0.25, hb, vAt(bot - 0.5), vAt(top + 0.5));
        for (let f = rows; f < fl; f++) q(f * fh, (f + 1) * fh, vAt((flats ? ST.flUp : ST.upA) + BAY - 0.5), vAt((flats ? ST.flUp : ST.upA) + 0.5));   // (floors above the stack: the upper row again)
        // the balconies on the wall that looks at the road: a slab and its railing before each French window (a block of flats: a parapet)
        if (k !== face || !near || fl < 2 || small) return;
        const bw = Math.min(len / nb - 0.35, 2.5), dp = flats ? 1.1 : 0.9, nx = w[3], nz = w[4], rot = w[2];
        for (let f = 1; f < fl; f++) for (let b = 0; b < nb; b++) {
          const bay = (u0 + b) % 8; if (!(flats ? FLB : TALL).includes(bay)) continue;
          if (!flats && crH(x0 + b, z0 + f, 61) < 0.25) continue;   // (a house: not before every one)
          const t = (b + 0.5) / nb, mx = A[0] + (B[0] - A[0]) * t, mz = A[1] + (B[1] - A[1]) * t, tx = (B[0] - A[0]) / len, tz = (B[1] - A[1]) / len, yb = f * fh - 0.1;
          const C = P(mx + nx * dp / 2, yb, mz + nz * dp / 2); box(g, C[0], C[1], C[2], bw, 0.14, dp, rot, mul(wc, 0.86), [0.74, 0.72, 0.68], true);
          const e = [[mx - tx * bw / 2, mz - tz * bw / 2], [mx - tx * bw / 2 + nx * dp, mz - tz * bw / 2 + nz * dp], [mx + tx * bw / 2 + nx * dp, mz + tz * bw / 2 + nz * dp], [mx + tx * bw / 2, mz + tz * bw / 2]];
          const ci = [x0 + (mx + nx * dp / 2) * c - (mz + nz * dp / 2) * s, y0 + yb + 0.5, z0 + (mx + nx * dp / 2) * s + (mz + nz * dp / 2) * c];
          const vb = flats ? vAt(ST.plain + 60) : vAt(ST.rail + 31.5), vt = flats ? vAt(ST.plain + 30) : vAt(ST.rail + 0.5), col = flats ? mul(wc, 0.9) : [0.92, 0.92, 0.92];
          let u = H(7) * 3; for (let j = 0; j < 3; j++) { const a = e[j], d = e[j + 1], l = Math.hypot(d[0] - a[0], d[1] - a[1]) / 20.5;
            g.quadO(P(a[0], yb + 0.14, a[1]), P(d[0], yb + 0.14, d[1]), P(d[0], yb + 1.14, d[1]), P(a[0], yb + 1.14, a[1]), col, ci, [[u, vb], [u + l, vb], [u + l, vt], [u, vt]]); u += l; }
        }
      });
    }
    /* ---- the roof ---- */
    const rc = o.roof, rc2 = mul(rc, 0.9 + H(11) * 0.16), hipped = !small && (flats ? H(12) < 0.5 : H(12) < 0.6 || L / W < 1.3), flat = flats && !hipped;
    let roofY = () => hh;
    if (flat) {   // a flat roof behind its parapet, a block for the stairs
      box(g, x0, y0 + hh, z0, L, 0.5, W, ang, mul(wc, 0.92), [0.66, 0.6, 0.54]);
      const q = P((H(13) - 0.5) * L * 0.4, hh + 0.3, 0); box(g, q[0], q[1], q[2], 3.2, 2.3, 2.6, ang, mul(wc, 0.95), [0.6, 0.56, 0.5], true);
    } else {
      const ov = small ? 0.2 : lev >= 2 ? 0.55 : 0.22, pitch = small ? 0.24 : 0.36 + H(14) * 0.1, a = L / 2 + (hipped ? ov : Math.min(ov, 0.3)), b = W / 2 + ov, r = hipped ? Math.max(0, a - b) : a;
      const yE = hh - ov * pitch, yR = hh + W / 2 * pitch, sl = b * Math.sqrt(1 + pitch * pitch), v0 = vR(0), v1 = vR(sl), uo = H(15) * 7, ri = [x0, y0 + hh - 2, z0];
      roofY = (lx, lz) => Math.min(hh + (W / 2 - Math.abs(lz)) * pitch, hipped ? hh + (L / 2 - Math.abs(lx)) * pitch : 1e9);
      const E = [P(-a, yE, -b), P(a, yE, -b), P(a, yE, b), P(-a, yE, b)], R0 = P(-r, yR, 0), R1 = P(r, yR, 0);
      g.quadO(E[0], E[1], R1, R0, rc, ri, [[uo + uR(-a), v0], [uo + uR(a), v0], [uo + uR(r), v1], [uo + uR(-r), v1]]);
      g.quadO(E[2], E[3], R0, R1, rc2, ri, [[uo + 9 + uR(a), v0], [uo + 9 + uR(-a), v0], [uo + 9 + uR(-r), v1], [uo + 9 + uR(r), v1]]);
      if (hipped) {
        g.triO(E[3], E[0], R0, mul(rc, 0.96), ri, null, null, [uo + 3 + uR(b), v0], [uo + 3 + uR(-b), v0], [uo + 3, v1]);
        g.triO(E[1], E[2], R1, mul(rc2, 1.03), ri, null, null, [uo + 5 + uR(-b), v0], [uo + 5 + uR(b), v0], [uo + 5, v1]);
      } else {   // the gables' walls up to the ridge
        const vb = vAt(ST.plain + 62), vt = vAt(ST.plain + 2);
        for (const sx of [-1, 1]) g.triO(P(sx * L / 2, hh, -W / 2), P(sx * L / 2, hh, W / 2), P(sx * L / 2, yR, 0), wc, inn, null, null, [0.1, vb], [0.1 + W / 23, vb], [0.1 + W / 46, vt]);
      }
      // the ridge and the hips: a lighter line of ridge tiles over each
      const cap = mul(rc, 1.14), cw = 0.17, line = (p, q) => { const dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz) || 1, ox = -dz / l * cw, oz = dx / l * cw;
        g.quadUp([p[0] + ox, p[1] + 0.07, p[2] + oz], [p[0] - ox, p[1] + 0.07, p[2] - oz], [q[0] - ox, q[1] + 0.07, q[2] - oz], [q[0] + ox, q[1] + 0.07, q[2] + oz], [cap, cap, cap, cap]); };
      if (near || lev >= 1) { if (r > 0.2) line(R0, R1); if (hipped && near) { line(E[0], R0); line(E[3], R0); line(E[1], R1); line(E[2], R1); } }
      // the eaves' edge (the rafters' ends) along the foot of the roof
      if (lev >= 2 && near && !small) { const fc = [0.34, 0.26, 0.2], ed = hipped ? [[0, 1], [1, 2], [2, 3], [3, 0]] : [[0, 1], [2, 3]];
        for (const [i, j] of ed) g.quadO([E[i][0], E[i][1] - 0.16, E[i][2]], [E[j][0], E[j][1] - 0.16, E[j][2]], E[j], E[i], fc, ri); }
      // the chimneys: on a slope near the ridge, sunk into the roof, a cap on top
      const nc = small ? 0 : L * W > 110 && near ? 2 : H(16) < 0.75 ? 1 : 0;
      for (let k = 0; k < nc; k++) { const lx = (crH(x0, z0, 70 + k) - 0.5) * 2 * Math.max(0.5, r * 0.8), lz = (k ? -1 : 1) * W * (0.12 + crH(x0, z0, 72 + k) * 0.1), yr = roofY(lx, lz), w = 0.55 + crH(x0, z0, 74 + k) * 0.25, q = P(lx, yr - 0.4, lz);
        box(g, q[0], q[1], q[2], w, 1.5, w, ang, k ? [0.6, 0.34, 0.26] : mul(wc, 0.9), [0.2, 0.18, 0.17], true); if (near) box(g, q[0], q[1] + 1.5, q[2], w + 0.24, 0.12, w + 0.24, ang, [0.52, 0.3, 0.23], null, true); }
      // level 3: solar panels on the slope that looks south (+z), on some roofs
      if (lev >= 3 && near && !small && H(17) < 0.3 && r > 1.6) { const sd = c > 0 ? 1 : -1, la = (H(18) - 0.5) * r, lb = la + Math.min(3.4, r), t0 = 0.3, t1 = 0.78, pt = (lx, t) => P(lx, yE + (yR - yE) * t + 0.06, sd * b * (1 - t)), pc = [0.1, 0.13, 0.24];
        g.quadUp(pt(la, t0), pt(lb, t0), pt(lb, t1), pt(la, t1), [pc, pc, pc, pc]); }
    }
    /* ---- level 3, by the road: awnings over the ground floor, the yard with its wall or hedge and gate, shrubs, a parked car ---- */
    if (lev >= 3 && near === 2 && !small) {
      if (face >= 0 && (flats || H(20) < 0.35)) { const w = WL[face], A = w[0], B = w[1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), nb = Math.max(1, Math.round(len / 2.9)), u0 = ((DOOR[H(5) < 0.5 ? 0 : 1] - Math.floor((nb - 1) / 2)) % 8 + 8) % 8;
        const ac = AWN[Math.floor(H(21) * AWN.length)], tx = (B[0] - A[0]) / len, tz = (B[1] - A[1]) / len, nx = w[3], nz = w[4], yt = Math.min(fh, 3.2) - 0.35;
        for (let b = 0; b < nb; b++) { const bay = (u0 + b) % 8; if (flats ? !SHOP.includes(bay) : DOOR.includes(bay) || crH(x0 + b, z0, 62) < 0.4) continue;
          const t = (b + 0.5) / nb, mx = A[0] + (B[0] - A[0]) * t, mz = A[1] + (B[1] - A[1]) * t, hw = Math.min(len / nb - 0.3, 2.5) / 2, dp = flats ? 1.5 : 1.0;
          const p0 = P(mx - tx * hw, yt, mz - tz * hw), p1 = P(mx + tx * hw, yt, mz + tz * hw), p2 = P(mx + tx * hw + nx * dp, yt - 0.45, mz + tz * hw + nz * dp), p3 = P(mx - tx * hw + nx * dp, yt - 0.45, mz - tz * hw + nz * dp);
          g.quadUp(p0, p1, p2, p3, [ac, ac, mul(ac, 0.9), mul(ac, 0.9)]); g.quadO(p3, p2, [p2[0], p2[1] - 0.22, p2[2]], [p3[0], p3[1] - 0.22, p3[2]], mul(ac, 0.8), inn); } }
      if (!flats && o.gH && o.onRoad) {
        let m = 2.2 + H(22) * 1.6, ok = false, K = null;
        for (let tr = 0; tr < 2 && !ok; tr++) { K = [[-L / 2 - m, -W / 2 - m], [L / 2 + m, -W / 2 - m], [L / 2 + m, W / 2 + m], [-L / 2 - m, W / 2 + m]].map(([lx, lz]) => { const q = P(lx, 0, lz); q[1] = o.gH(q[0], q[2]); return q; });
          ok = !K.some((q, i) => { const n = K[(i + 1) % 4]; return o.onRoad(q[0], q[2]) || o.onRoad((q[0] + n[0]) / 2, (q[2] + n[2]) / 2); }); if (!ok) m = 0.9; }
        const ys = K.map(q => q[1]), yl = Math.min(...ys), yh = Math.max(...ys);
        if (ok && yh - yl < 1.3) {
          const lawn = H(23) < 0.5, pc = lawn ? [0.5, 0.58, 0.34] : [0.83, 0.79, 0.69], hedge = H(24) < 0.45, sc = hedge ? [0.19, 0.31, 0.17] : mul(wc, 0.97), st = hedge ? [0.25, 0.39, 0.21] : [0.86, 0.82, 0.72], sh = hedge ? 1.25 : 0.95, th = hedge ? 0.6 : 0.24;
          g.quadUp(...K.map(q => [q[0], q[1] + 0.06, q[2]]), [pc, pc, pc, pc]);
          // the yard's edge: the side on the road with a gap for the gate (two posts), the other sides whole
          const fs = face < 0 ? -1 : face === 0 ? 2 : face === 1 ? 0 : face === 2 ? 1 : 3;   // (the yard's side under the wall that looks at the road: K[fs] -> K[fs + 1])
          const seg = (p, q) => { const dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz); if (l < 0.5) return; const yb = Math.min(p[1], q[1]) - 0.3;
            box(g, (p[0] + q[0]) / 2, yb, (p[2] + q[2]) / 2, l, sh + 0.3 + Math.abs(p[1] - q[1]) * 0.5, th, Math.atan2(dz, dx), sc, st, true); };
          for (let i = 0; i < 4; i++) { const p = K[i], q = K[(i + 1) % 4];
            if (i !== fs) { seg(p, q); continue; }
            const l = Math.hypot(q[0] - p[0], q[2] - p[2]), g0 = clamp(0.5 + (H(25) - 0.5) * 0.4 - 1.3 / l, 0.05, 0.9), g1 = Math.min(0.95, g0 + 2.6 / l), at = (t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
            seg(p, at(g0)); seg(at(g1), q);
            for (const t of [g0, g1]) { const e = at(t); box(g, e[0], e[1] - 0.3, e[2], 0.42, 1.75, 0.42, Math.atan2(q[2] - p[2], q[0] - p[0]), mul(wc, 0.93), [0.86, 0.82, 0.72], true); }
          }
          // shrubs in the yard's corners (cypresses, oleanders), a car parked beside the house
          const hr = rng(Math.floor(H(26) * 1e9));
          for (let i = 0; i < 4; i++) { const hq = crH(x0 + i, z0, 63); if (hq < 0.45) continue; const q = K[i], px = q[0] + (x0 - q[0]) * 0.16, pz = q[2] + (z0 - q[2]) * 0.16;
            if (hq < 0.72) cone(g, px, q[1], pz, 0.55, 3.2 + hq * 2, 6, [0.16, 0.3, 0.17], [0.22, 0.38, 0.2], 0); else ico(g, px, q[1] + 0.7, pz, 0.95, 0.85, hq < 0.86 ? [0.26, 0.42, 0.2] : [0.5, 0.4, 0.42], hr, 0.12); }
          if (m > 2.5 && H(27) < 0.4 && L > 7) { const sd = H(28) < 0.5 ? -1 : 1, q = P((H(29) - 0.5) * (L - 5), 0, sd * (W / 2 + m * 0.5)); q[1] = o.gH(q[0], q[2]);
            parkedCar(g, q[0], q[1] + 0.06, q[2], ang + (H(30) < 0.5 ? Math.PI : 0), CARS[Math.floor(H(31) * CARS.length)], Math.floor(H(32) * 4)); }
        }
      }
    }
    g.dUV = null;
    return (g.P.length - n0) / 3;
  }

  // the level asked for: index.html?hise=1|2|3 (0 without it: the houses as they are)
  const level = () => { try { const q = new URLSearchParams(location.search).get('hise'); return clamp(Math.round(+(q != null ? q : window.__hise || 0)) || 0, 0, 3); } catch (e) { return 0; } };   // (window.__hise: a tool's way in)
  API.hise = { atlas, mat, house, level };
})();
