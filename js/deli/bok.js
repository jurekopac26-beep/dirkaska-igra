/* Deli iz garaže, sklop 2 · bok: ogledala, vrata, zavore, matice. Each element registers its 16 options with DELI.add(id, build(K, n, m,
   M)) (js/deli.js; the contract: docs/deli.md). Loaded after js/deli.js, before the cars.
     ogledala  the door mirrors, in place of the stock ones (K.deli round the car's K.mirror): K.mirror for the glass (it cracks, the mirror
               folds: Razbijanje), the option's housing a shell round it, in the mirror's part (mirrorL / mirrorR)
     vrata     the doors' outer skins: a panel over the door (paint, primer, aluminium, fibreglass, carbon) laid on the loft's side (a decal
               on the door: it goes with it), the handles, the window net or the light glass with its slider (K.deli round the handles)
     zavore    the brakes, seen through the rims: the disc over the rim's dish (it turns with the wheel), the caliper in h.still (it does
               not: render.js, kitWheelMesh); on a steel wheel or a full cover none (they hide them)
     matice    the wheel nuts on the hub (over the rims' own), a centre-lock rim's one big nut
   zavore and matice are wheel parts: render.js draws them on the player's wheels (KIT_WHEEL_DELI), K is then the wheel's face helper h
   (g, p, rr, zd, zo, top, out; still, r, rear, vis, fitted). */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const CF = [0.075, 0.078, 0.085], CF2 = [0.11, 0.115, 0.125], DCF = [0.12, 0.125, 0.135], DCF2 = [0.16, 0.165, 0.175], AL = [0.74, 0.76, 0.8], DK = [0.09, 0.09, 0.1];
  const BLK = [0.02, 0.02, 0.022], GLOSS = [0.05, 0.05, 0.055], CHR = [0.8, 0.81, 0.84], AMB = [1, 0.6, 0.1], WHT = [0.96, 0.96, 0.94], RED = [0.78, 0.09, 0.07];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clip = (P, A) => {   // (polygon P clipped by the convex polygon A, both [[u, v] ...], A counter-clockwise)
    let out = P;
    for (let i = 0; i < A.length && out.length; i++) { const a = A[i], b = A[(i + 1) % A.length], f = (q) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]), inp = out; out = [];
      for (let j = 0; j < inp.length; j++) { const p = inp[j], q = inp[(j + 1) % inp.length], fp = f(p), fq = f(q);
        if (fp >= 0) out.push(p); if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } }
    return out; };
  const faceOut = (K, pts, col, out, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];   // (a flat polygon facing out)
    const nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(nn[0] * out[0] + nn[1] * out[1] + nn[2] * out[2] < 0 ? pts.slice().reverse() : pts, col, o); };

  // ================================================================ ogledala: both door mirrors of option n
  // m: { x, y, z: the stock mirror's middle (the right one; z out from the car's middle), w, h, d: its housing (along, up, out), z0: where its
  // arm meets the body (out from the middle) }. Each option: K.mirror (its glass on the back, the arm; a thin box: the glass's backing, its
  // rim round the glass) and the housing round it: a skin of rings out along z (the profile's back just in front of the glass)
  function ogledala(K, n, m) {
    const P = K.paint, LD = K.decal(K.body.secs), weave = (a, b) => (k, e) => (e + k) % 2 ? a : b, CFm = [0.15, 0.155, 0.17], DCFm = [0.21, 0.215, 0.23];   // (the weave's light facets: stronger than the wing's, the mirrors small)
    // the options: w, h, d (sizes against the stock one), dx, dy, dz (moved), shape (round: a cap; tear: a sport mirror, pointed forward;
    // flat: a race mirror, thin and wide), col (the housing: a colour or fn(k, e)), cap (its front's own colour: caps over a black base),
    // rim (round the glass), stalk (a plate under it to the door: its colour), led (an indicator along its front: amber, the puddle lamp)
    const O = [null,
      { shape: 'round', col: BLK, cap: GLOSS },                                                        // 1 črni pokrovčki
      { shape: 'round', col: BLK, cap: CHR },                                                          // 2 kromirani
      { shape: 'round', col: BLK, cap: weave(CF, CFm) },                                               // 3 karbonski
      { shape: 'round', col: BLK, cap: weave(DCF, DCFm) },                                             // 4 suhi karbon
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: P },                                            // 5 športna
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: P, led: 1 },                                    // 6 z LED smernikom
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: P, cap: BLK, half: 1 },                         // 7 ogrevana (two-tone: its underside black)
      { shape: 'tear', w: 1.3, h: 0.95, d: 1.15, col: P, led: 2 },                                     // 8 z LED smernikom in lučjo
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: weave(CF, CFm) },                               // 9 karbonska
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: weave(CF, CFm), led: 1 },                       // 10 karbonska z LED
      { shape: 'tear', w: 1.5, h: 0.72, d: 1.12, dy: 0.02, col: weave(CF, CFm), stalk: CF },           // 11 karbonska, aero (on a stalk)
      { shape: 'tear', w: 1.25, h: 0.86, d: 1.08, col: weave(DCF, DCFm) },                             // 12 karbonska, suha
      { shape: 'flat', w: 0.8, h: 0.78, d: 1.25, dy: 0.015, col: BLK, stalk: BLK },                    // 13 dirkalna
      { shape: 'tear', w: 1.35, h: 0.7, d: 1.3, dy: 0.03, col: weave(CF, CFm), stalk: CF },            // 14 dirkalna, aero
      { shape: 'flat', w: 0.8, h: 0.78, d: 1.25, dy: 0.015, col: weave(DCF, DCFm), stalk: DCF },       // 15 dirkalna, suhi karbon
      { shape: 'flat', w: 0.85, h: 0.72, d: 1.5, dy: 0.03, dz: 0.01, col: P, cap: RED, capE: [2, 3], stalk: BLK },   // 16 motošport (wide, its nose red)
    ][n];
    if (!O) return;
    for (const sd of [-1, 1]) {
      const part = sd < 0 ? 'mirrorL' : 'mirrorR', o = { part }, w = m.w * (O.w || 1), h = m.h * (O.h || 1), d = m.d * (O.d || 1);
      const x = m.x + (m.fwd || 0) + (O.dx || 0), y = m.y + (m.up || 0) + (O.dy || 0), zm = m.z + (O.dz || 0), z = sd * zm, bx = x - w / 2;   // (bx: the glass's plane, its back)
      const z0 = sd * (m.z0 != null ? m.z0 : m.z - m.d / 2 - 0.05);
      K.mirror(bx + 0.011, y, z, { col: O.rim || BLK, w: 0.022, h, d, crack: 1, arm: O.stalk || BLK, z0 });   // (the glass, its rim, the arm; its fold about the housing's inner rear corner)
      // the housing's profile (along x from the back, up from the middle): k points round, the back's two by the glass
      const prof = O.shape === 'round' ? [[0.003, 0.5], [0.3, 0.56], [0.72, 0.48], [0.98, 0.18], [0.98, -0.2], [0.72, -0.48], [0.3, -0.54], [0.003, -0.5]]
        : O.shape === 'tear' ? [[0.003, 0.5], [0.35, 0.52], [0.75, 0.32], [1, 0.02], [0.8, -0.3], [0.4, -0.48], [0.003, -0.5]]
        : [[0.003, 0.5], [0.45, 0.52], [0.9, 0.36], [1, 0], [0.9, -0.36], [0.45, -0.52], [0.003, -0.5]];
      const g = 0.004, ring = (zz, s, sh) => prof.map(([u, v]) => [bx + u * (w + g) * (u > 0.01 ? s : 1), y + v * (h + 2 * g) * s + (sh || 0) * h, zz]);
      const zi = z - sd * (d / 2 + g), zo = z + sd * (d / 2 + g);   // (inner end, by the window; outer end)
      const R = O.shape === 'flat' ? [ring(zi, 0.9), ring(zi + sd * d * 0.12, 1), ring(zo - sd * d * 0.12, 1), ring(zo, 0.9)]
        : [ring(zi, 0.82, -0.04), ring(zi + sd * d * 0.3, 1), ring(zo - sd * d * 0.22, 1), ring(zo, 0.84, 0.02)];
      const nq = prof.length, base = typeof O.col === 'function' ? O.col : () => O.col;
      const cap = O.cap ? (typeof O.cap === 'function' ? O.cap : () => O.cap) : null;
      const col = (k, e) => { if (!cap) return base(k, e);
        if (O.half) return e >= nq / 2 - 0.5 ? cap(k, e) : base(k, e);   // (two-tone: its lower half)
        if (O.capE) return O.capE.includes(e) ? cap(k, e) : base(k, e);
        return e >= 1 && e <= nq - 3 ? cap(k, e) : base(k, e); };   // (a cap over its front and its top: the base round the glass)
      const ce = cap ? cap(0, 2) : base(0, 1);
      K.skin(R, col, base(0, 0), ce, o);
      if (O.led) {   // (the indicator: an amber strip on its front's lower face (the profile's points 3 to 4) along its full section; 2: the puddle lamp under it)
        const on = (r, t) => { const A = R[r][3], B = R[r][4], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; return [A[0] + dx * t - dy / l * 0.0015, A[1] + dy * t + dx / l * 0.0015, A[2]]; };
        faceOut(K, [on(1, 0.12), on(2, 0.12), on(2, 0.72), on(1, 0.72)], [1, 0.72, 0.2], [1, -0.6, 0], o);
        if (O.led === 2) faceOut(K, [[x - w * 0.15, y - h / 2 - g - 0.001, z - d * 0.1], [x + w * 0.15, y - h / 2 - g - 0.001, z - d * 0.1], [x + w * 0.15, y - h / 2 - g - 0.001, z + d * 0.1], [x - w * 0.15, y - h / 2 - g - 0.001, z + d * 0.1]], WHT, [0, -1, 0], o);
      }
      // its foot (every option, as the race mirrors'): the sail, a plate over the door glass's front corner (the triangle by the A-pillar) in
      // the paint, the door's; a plate from it up to the housing's underside (the race ones' in their colour, else the paint: one with the car)
      const W = (px, t, l) => [px, LD.prop(px, 'ybelt') + (LD.prop(px, 'yt') - LD.prop(px, 'ybelt')) * t, sd * (LD.prop(px, 'w') + (LD.prop(px, 'wt') - LD.prop(px, 'w')) * t + l)];
      if (m.sail) K.plate(m.sail.map(([px, t]) => W(px, t, 0.006)), 0.008, P, { host: sd < 0 ? 'doorL' : 'doorR' });
      { const yb = y - h / 2 - g + 0.004, zh = sd * (zm - d * 0.2), f0 = W(x - w * 0.2, 0.06, 0.012), f1 = W(x + w * 0.25, 0.06, 0.012);
        K.plate([[x - w * 0.2, yb, zh], [x + w * 0.3, yb, zh], [f1[0], f1[1], f1[2]], [f0[0], f1[1], f0[2]]], 0.012, O.stalk || P, o); }
    }
  }
  DELI.add('ogledala', ogledala);

  // ================================================================ vrata: both doors of option n
  // m: { x: [rear, front] the door's skin (on its shut lines), y: [sill, belt], handle: [x, y, z (out), w, h], win: [[x, t] ...] the door's
  // glass (t up the window band: 0 the belt, 1 the roof's edge; counter-clockwise), frame: [x0, x1, t0, t1] its frame's rear upright from
  // x0 to x1 and its top from t0 to t1 under the roof, up to the A-pillar }. The door's panel a decal on the loft's side (lift 3.5 mm: the
  // stripe, the shut lines over it); its frame round the glass in the door's colour, the rear shut line on up to the roof (the door's
  // outline closed); the handle (or a strap pull), the window's net (a real one: webbing in squares, its border, the rod it hangs on, the
  // latch) or the light glass (lexan: clearer, its black printed border, a sliding hatch or a vent)
  function vrata(K, n, m) {
    const P = K.paint, LD = K.decal(K.body.secs), PR = [0.42, 0.43, 0.44], GF = [0.9, 0.89, 0.84], AL2 = [0.6, 0.62, 0.66], D = [0.1, 0.1, 0.11];
    // skin: the panel (null: the paint); frame: its window frame's colour (default: the skin, else the paint); handle: 'stock' (black),
    // 'paint', 'alu' (a flush silver one), 'carbon', 'flush' (the paint, a dark slot), null (a strap pull); trim: a strip along the belt;
    // mould: a rubbing strip (bolts on Visoki); crease: pressed lines; brush: brushed metal; rivets; seal: a rubber seal round its edge;
    // sheen: carbon's weave in light bands (Visoki); net; lexan: 'slide' (a sliding hatch), 'vent' (a round vent); pins: quick releases
    const O = [null,
      { skin: PR, handle: 'stock' },                                                   // 1 jeklena, nadomestna (primer grey)
      { handle: 'paint', frame: CHR, trim: CHR },                                      // 2 jeklena, lakirana (chrome frame and belt trim)
      { handle: 'stock', mould: BLK },                                                 // 3 jeklena, ojačana (a wide rubbing strip, bolted)
      { handle: 'flush', crease: true },                                               // 4 lažja jeklena (pressed lines, a flush handle)
      { skin: AL, handle: 'stock', brush: true },                                      // 5 aluminijasta (brushed)
      { handle: 'alu', frame: AL, trim: AL },                                          // 6 aluminijasta, lakirana (its frame bare)
      { skin: AL, handle: 'alu', rivets: true, brush: true },                          // 7 aluminijasta, lažja (riveted)
      { skin: GF, handle: 'stock', seal: true },                                       // 8 iz steklenih vlaken (gelcoat, a rubber seal)
      { skin: CF, frame: BLK, handle: 'stock', sheen: CF2 },                           // 9 karbonska
      { skin: CF, handle: 'carbon', sheen: [0.17, 0.175, 0.19], trim: [0.17, 0.175, 0.19] },   // 10 karbonska, dvostranska (gloss, its frame carbon)
      { skin: CF, handle: 'stock', sheen: CF2, lexan: 'slide' },                       // 11 karbonska, lahko steklo
      { skin: DCF, handle: 'alu', sheen: DCF2 },                                       // 12 karbonska, suha (matte)
      { skin: CF, handle: null, sheen: CF2, net: true },                               // 13 dirkalna
      { handle: 'stock', net: true },                                                  // 14 vrata z mrežo
      { skin: CF, handle: null, sheen: CF2, lexan: 'vent' },                           // 15 dirkalna, ultralahka
      { skin: CF, handle: null, sheen: CF2, net: true, pins: true },                   // 16 motošport
    ][n];
    if (!O) return;
    const [xa, xb] = m.x, [ya, yb] = m.y, [hx, hy, hz, hw, hh] = m.handle, W = m.win, F = m.frame;
    const u0 = Math.min(...W.map(q => q[0])), u1 = Math.max(...W.map(q => q[0])), t0 = Math.min(...W.map(q => q[1])), t1 = Math.max(...W.map(q => q[1]));
    const pt = (px, t, l, sd) => [px, LD.prop(px, 'ybelt') + (LD.prop(px, 'yt') - LD.prop(px, 'ybelt')) * t, sd * (LD.prop(px, 'w') + (LD.prop(px, 'wt') - LD.prop(px, 'w')) * t + l)];   // (a point of the window band)
    for (const sd of [-1, 1]) {
      const host = sd < 0 ? 'doorL' : 'doorR', o = { host }, dir = sd < 0 ? '-z' : 'z', S = [sd];
      const side = (pts, col, l) => LD.side(pts, col, S, l, o), band = (pts, col, l) => LD.band(pts, col, S, l, o), win = (pts, col, l) => { const c = clip(pts, W); if (c.length >= 3) band(c, col, l); };
      if (O.skin) side([[xa, ya], [xb, ya], [xb, yb], [xa, yb]], O.skin, 0.0035);
      // the frame: its rear upright and its top in the door's colour, the rear shut line on up to the roof
      if (F) { const fc = O.frame || O.skin || P;
        band([[F[0], 0], [F[1], 0], [F[1], F[3]], [F[0], F[3]]], fc, 0.011); band([[F[0], F[2]], [W[2][0] + 0.01, F[2]], [W[2][0] - 0.02, F[3]], [F[0], F[3]]], fc, 0.011);
        band([[xa - 0.006, 0], [xa + 0.006, 0], [xa + 0.006, 1], [xa - 0.006, 1]], D, 0.013); }
      if (O.sheen && K.hi) for (let i = 0; i < 3; i++) { const u = xa + 0.16 + i * 0.36;   // (the weave catching the light: three bands across, slanting)
        side([[u, ya], [u + 0.07, ya], [u + 0.21, yb], [u + 0.14, yb]].map(([px, py]) => [Math.max(xa, Math.min(xb, px)), py]), O.sheen, 0.004); }
      if (O.brush && K.hi) for (let i = 0; i < 6; i++) { const y = ya + 0.06 + i * (yb - ya - 0.1) / 5; side([[xa, y], [xb, y], [xb, y + 0.004], [xa, y + 0.004]], AL2, 0.004); }
      if (O.crease) for (const y of [0.6, 0.72]) { side([[xa, y], [xb, y], [xb, y + 0.01], [xa, y + 0.01]], K.shade(P, 0.5), 0.0045); side([[xa, y - 0.006], [xb, y - 0.006], [xb, y], [xa, y]], K.shade(P, 1.3), 0.0045); }   // (pressed lines: their shadow, their light edge under them)
      if (O.trim) side([[xa, yb - 0.02], [xb, yb - 0.02], [xb, yb - 0.004], [xa, yb - 0.004]], O.trim, 0.0045);
      if (O.mould) { side([[xa + 0.02, 0.56], [xb - 0.02, 0.56], [xb - 0.02, 0.63], [xa + 0.02, 0.63]], O.mould, 0.008);
        side([[xa + 0.02, 0.589], [xb - 0.02, 0.589], [xb - 0.02, 0.601], [xa + 0.02, 0.601]], [0.16, 0.16, 0.17], 0.0095);
        if (K.hi) for (let i = 0; i < 4; i++) K.discX(xa + 0.08 + i * (xb - xa - 0.16) / 3, 0.595, sd * (hz + 0.01), 0.009, 6, AL2, 1, o); }
      if (O.seal) { side([[xa, ya], [xb, ya], [xb, ya + 0.012], [xa, ya + 0.012]], BLK, 0.0045); side([[xa, ya], [xa + 0.012, ya], [xa + 0.012, yb], [xa, yb]], BLK, 0.0045); side([[xb - 0.012, ya], [xb, ya], [xb, yb], [xb - 0.012, yb]], BLK, 0.0045); }
      if (O.rivets && K.hi) for (const ry of [ya + 0.05, yb - 0.04]) for (let i = 0; i < 9; i++) { const rx = xa + 0.04 + i * (xb - xa - 0.08) / 8;
        side([[rx - 0.006, ry - 0.006], [rx + 0.006, ry - 0.006], [rx + 0.006, ry + 0.006], [rx - 0.006, ry + 0.006]], AL2, 0.0045); }
      // the handle
      const hc = O.handle === 'stock' ? BLK : O.handle === 'paint' || O.handle === 'flush' ? P : O.handle === 'alu' ? AL : O.handle === 'carbon' ? CF2 : null;
      if (hc) { K.rect(hx, hy, sd * hz, hw, hh, hc, Object.assign({ dir }, o));
        if (O.handle === 'alu' || O.handle === 'flush') K.rect(hx, hy - hh * 0.25, sd * (hz + 0.001), hw * 0.8, hh * 0.3, BLK, Object.assign({ dir }, o)); }
      else K.rect(hx + 0.02, hy - 0.01, sd * (hz + 0.002), 0.09, 0.022, RED, Object.assign({ dir }, o));   // (a strap pull, red)
      if (O.pins) for (const py of [ya + 0.14, yb - 0.1]) K.discX(xa + 0.035, py, sd * (hz - 0.012), 0.014, 6, CHR, 1, o);   // (the quick-release pins at its rear edge)
      // a window net: black webbing in squares (8 up, 5 across) inside its border, hung on a rod along the belt, its latch at the top front (red)
      if (O.net) { const a = u0 + 0.025, b = u1, c = t0 + 0.03, e = t1 - 0.04, s = 0.009, k = 0.022;
        win([[a, c], [b, c], [b, c + k], [a, c + k]], BLK, 0.014); win([[a, e - k], [b, e - k], [b, e], [a, e]], BLK, 0.014); win([[a, c], [a + k, c], [a + k, e], [a, e]], BLK, 0.014);
        for (let i = 1; i <= 8; i++) { const u = a + i * 0.1; win([[u - s, c], [u + s, c], [u + s, e], [u - s, e]], BLK, 0.0155); }
        for (let j = 1; j <= 4; j++) { const t = c + j * (e - c) / 5; win([[a, t - s], [b, t - s], [b, t + s], [a, t + s]], BLK, 0.0145); }
        const r0 = pt(a, c + 0.01, 0.022, sd), r1 = pt(W[1][0] - 0.06, c + 0.01, 0.022, sd); K.bar(r0, r1, 0.006, AL2, { n: 4, host });   // (its rod)
        const q = clip([[a, e - 0.06], [b, e - 0.06], [b, e], [a, e]], W), qx = Math.max(...q.map(v => v[0])) - 0.05;
        win([[qx, e - 0.05], [qx + 0.04, e - 0.05], [qx + 0.04, e + 0.01], [qx, e + 0.01]], RED, 0.018); }   // (its latch)
      // the light glass (lexan): clearer than glass, its black printed border, a sliding hatch (open: dark inside, rails over and under
      // it, a finger pull) or a round vent
      if (O.lexan) { const LX = [0.46, 0.52, 0.6];
        win([[u0, t0], [u1, t0], [u1, t1], [u0, t1]], LX, 0.012);
        win([[u0, t0], [u1, t0], [u1, t0 + 0.035], [u0, t0 + 0.035]], BLK, 0.014); win([[u0, t1 - 0.035], [u1, t1 - 0.035], [u1, t1], [u0, t1]], BLK, 0.014); win([[u0, t0], [u0 + 0.03, t0], [u0 + 0.03, t1], [u0, t1]], BLK, 0.014);
        if (O.lexan === 'slide') { const a = u0 + 0.06, b = a + 0.28, c = t0 + 0.08, e = c + 0.32;
          win([[a, c], [b, c], [b, e], [a, e]], [0.04, 0.04, 0.045], 0.0145);   // (the opening, the cabin dark behind it)
          for (const [p0, p1] of [[c - 0.02, c], [e, e + 0.02]]) win([[a - 0.04, p0], [b + 0.16, p0], [b + 0.16, p1], [a - 0.04, p1]], AL2, 0.017);   // (its rails)
          win([[b, c], [b + 0.15, c], [b + 0.15, e], [b, e]], [0.56, 0.62, 0.7], 0.016);   // (the hatch, slid forward)
          win([[b + 0.01, c + 0.13], [b + 0.03, c + 0.13], [b + 0.03, c + 0.19], [b + 0.01, c + 0.19]], BLK, 0.018); }   // (its finger pull)
        else { const cu = u0 + 0.18, ct = (t0 + t1) / 2, k = 10, R = 0.07;   // (a round vent: a dark ring of slats)
          win(Array.from({ length: k }, (_, i) => [cu + Math.cos(i / k * Math.PI * 2) * R, ct + Math.sin(i / k * Math.PI * 2) * R * 2.2]), [0.06, 0.06, 0.065], 0.0145);
          for (const dt of [-0.06, 0, 0.06]) win([[cu - R * 0.8, ct + dt - 0.008], [cu + R * 0.8, ct + dt - 0.008], [cu + R * 0.8, ct + dt + 0.008], [cu - R * 0.8, ct + dt + 0.008]], AL2, 0.017); } }
    }
  }
  DELI.add('vrata', vrata);

  // ================================================================ the wheel parts: h the wheel's face helper (render.js, kitWheelGeo)
  const seg = (h, k) => h.vis ? k : Math.max(6, Math.round(k * 0.6));   // (round shapes: fewer segments on Normalni)
  const FIXED = [1, 2, 3, 4, 16], LOCK = [12, 14, 16];   // (the rims (platisca) that hide the brakes: steel, the covers; the centre-lock ones)
  const ann = (G, h, r0, r1, z, k, col, a0, a1) => { a0 = a0 || 0; a1 = a1 == null ? Math.PI * 2 : a1;   // (a ring (an arc) facing out, in the wheel's plane)
    for (let i = 0; i < k; i++) { const b0 = a0 + (a1 - a0) * i / k, b1 = a0 + (a1 - a0) * (i + 1) / k; G.quadO(h.p(b0, z, r0), h.p(b1, z, r0), h.p(b1, z, r1), h.p(b0, z, r1), col, h.out); } };
  const dot = (G, h, a, r, rad, z, k, col) => { const cx = Math.cos(a) * r, cy = Math.sin(a) * r;   // (a small disc at angle a, radius r)
    for (let j = 0; j < k; j++) { const b0 = j / k * Math.PI * 2, b1 = (j + 1) / k * Math.PI * 2; G.triO([cx, cy, z], [cx + Math.cos(b0) * rad, cy + Math.sin(b0) * rad, z], [cx + Math.cos(b1) * rad, cy + Math.sin(b1) * rad, z], col, h.out); } };
  // a prism standing on the wheel's face: its outline pts ([x, y] round (cx, cy)) from z0 up to z1, its sides col (cols: [foot, top] a
  // gradient up them), its top topCol (a fan)
  const prism = (G, h, pts, z0, z1, col, topCol, cols) => { const n = pts.length, c = pts.reduce((a, q) => [a[0] + q[0] / n, a[1] + q[1] / n], [0, 0]), inn = [c[0], c[1], (z0 + z1) / 2];
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n];
      if (cols) G.quadO([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1], col, inn, null, [cols[0], cols[0], cols[1], cols[1]]);
      else G.quadO([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1], col, inn); }
    if (topCol) for (let i = 0; i < n; i++) G.triO([c[0], c[1], z1], [pts[i][0], pts[i][1], z1], [pts[(i + 1) % n][0], pts[(i + 1) % n][1], z1], topCol, [c[0], c[1], z1 - 1]); };
  const poly = (cx, cy, r, k, a0, r2) => Array.from({ length: k }, (_, i) => { const a = (a0 || 0) + i / k * Math.PI * 2, q = r2 && i % 2 ? r2 : r; return [cx + Math.cos(a) * q, cy + Math.sin(a) * q]; });

  // ================================================================ zavore: the brakes of option n on a wheel
  // m: { s: their size (1: KOLIBRI's: the disc's radius in rim radii as below) }. The disc on the rim's dish (2 mm over it: under the
  // spokes, turning with the wheel), its hat, its slots, holes, bobbins; the caliper in h.still on the disc's rear upper edge (front and
  // rear alike), its pads' edge showing under it
  function zavore(h, n, m) {
    if (!h.full || !h.still) return;
    const pl = h.fitted && h.fitted.platisca; if (pl && FIXED.includes(pl)) return;   // (behind a steel wheel or a cover: unseen)
    const IRON = [0.42, 0.42, 0.43], IRON2 = [0.3, 0.3, 0.31], CER = [0.3, 0.285, 0.27], CC = [0.1, 0.1, 0.105], HOLE = [0.05, 0.05, 0.055], STOCK = [0.2, 0.2, 0.21];
    // rd: the disc's outer radius (rim radii), hat: its hat (two-piece: its colour), slots, holes (rings of drilled holes), bob (bobbins),
    // cal: the caliper's colour, span (degrees), deep (its depth in rim radii), pad: the pads' colour, win: its window over the pads
    const O = [null,
      { rd: 0.66, disc: IRON, cal: STOCK, span: 46, deep: 0.2, pad: [0.24, 0.24, 0.25] },                                        // 1 cestne
      { rd: 0.66, disc: IRON, cal: STOCK, span: 46, deep: 0.2, pad: [0.62, 0.62, 0.6] },                                         // 2 nizkoprašne
      { rd: 0.66, disc: IRON, cal: STOCK, span: 46, deep: 0.2, pad: [0.72, 0.64, 0.5] },                                         // 3 keramične cestne
      { rd: 0.66, disc: IRON, cal: STOCK, span: 46, deep: 0.2, pad: [0.2, 0.55, 0.25] },                                         // 4 športne
      { rd: 0.7, disc: IRON, slots: 6, cal: STOCK, span: 48, deep: 0.2, pad: [0.2, 0.55, 0.25] },                                // 5 zarezani
      { rd: 0.72, disc: IRON, slots: 6, holes: 2, cal: STOCK, span: 48, deep: 0.2, pad: [0.2, 0.55, 0.25] },                     // 6 športni
      { rd: 0.74, disc: IRON, hat: AL, bob: 8, holes: 2, cal: STOCK, span: 50, deep: 0.21, pad: [0.2, 0.55, 0.25] },             // 7 plavajoči
      { rd: 0.76, disc: IRON2, hat: [0.12, 0.12, 0.13], bob: 10, slots: 12, cal: STOCK, span: 50, deep: 0.21, pad: [0.2, 0.55, 0.25] },   // 8 dirkalni
      { rd: 0.78, disc: IRON, hat: AL, bob: 8, holes: 2, cal: [0.8, 0.08, 0.06], span: 64, deep: 0.24, win: true },              // 9 komplet, 4 bati (red)
      { rd: 0.8, disc: IRON, hat: [0.15, 0.15, 0.16], bob: 10, slots: 6, holes: 1, cal: [0.95, 0.75, 0.08], span: 74, deep: 0.25, win: true },   // 10 6 batov (yellow)
      { rd: 0.82, disc: IRON2, hat: [0.15, 0.15, 0.16], bob: 10, slots: 12, cal: [0.08, 0.08, 0.09], span: 76, deep: 0.26, win: true, stripe: [0.85, 0.86, 0.88] },   // 11 dirkalni komplet (black)
      { rd: 0.84, disc: IRON2, hat: AL, bob: 12, slots: 12, cal: [0.92, 0.42, 0.06], span: 88, deep: 0.27, win: true },          // 12 dirkalni, 8 batov (orange)
      { rd: 0.82, disc: CER, hat: [0.15, 0.15, 0.16], bob: 10, holes: 3, cal: [0.96, 0.8, 0.06], span: 72, deep: 0.25, win: true },     // 13 keramične (yellow)
      { rd: 0.86, disc: CER, hat: [0.15, 0.15, 0.16], bob: 12, holes: 3, cal: [0.62, 0.63, 0.67], span: 80, deep: 0.27, win: true },    // 14 keramične, velike (titanium grey)
      { rd: 0.86, disc: CER, hat: AL, bob: 12, holes: 2, slots: 6, cal: [0.15, 0.32, 0.8], span: 84, deep: 0.27, win: true },           // 15 keramične, dirkalne (blue)
      { rd: 0.86, disc: CC, hat: [0.6, 0.47, 0.18], bob: 12, vents: 12, cal: [0.08, 0.08, 0.09], span: 86, deep: 0.27, win: true, stripe: [0.85, 0.1, 0.07] },   // 16 karbon-karbon
    ][n];
    if (!O) return;
    const s = (m && m.s) || 1, rr = h.rr, rd = Math.min(0.88, O.rd * s) * rr, rh = rd * 0.46, zD = h.zd + 0.002, zF = zD + 0.0008, G = h.g, k = h.vis ? 16 : 12, T = Math.PI * 2, V = h.vis;
    // the disc: its face, the hat (a fan: two-piece aluminium or anodised, bobbins round its edge), slots, holes, vents (Normalni: fewer)
    ann(G, h, rh, rd, zD, k, O.disc);
    for (let i = 0; i < k; i++) G.triO([0, 0, zD + 0.0004], h.p(i / k * T, zD + 0.0004, rh), h.p((i + 1) / k * T, zD + 0.0004, rh), O.hat || K2(O.disc), h.out);
    const sq = (a, r, q, col) => { const c = h.p(a, zF, r); G.quadO([c[0] + q, c[1], zF], [c[0], c[1] + q, zF], [c[0] - q, c[1], zF], [c[0], c[1] - q, zF], col, h.out); };   // (a small square)
    if (O.bob) { const nb = V ? O.bob : 6; for (let i = 0; i < nb; i++) sq(i / nb * T, rh, 0.0045, [0.82, 0.83, 0.86]); }
    if (O.slots) { const ns = V ? O.slots : Math.min(6, O.slots); for (let i = 0; i < ns; i++) { const a = i / ns * T, b = a + 0.32, r0 = rh + (rd - rh) * 0.18, r1 = rd - (rd - rh) * 0.12, wq = 0.0022;   // (curved: swept back along the turn)
      const A = h.p(a, zF, r0), B = h.p(b, zF, r1), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), ox = -dy / l * wq, oy = dx / l * wq;
      G.quadO([A[0] + ox, A[1] + oy, zF], [B[0] + ox, B[1] + oy, zF], [B[0] - ox, B[1] - oy, zF], [A[0] - ox, A[1] - oy, zF], HOLE, h.out); } }
    if (O.holes) { const nr = Math.min(O.holes, V ? 2 : 1), q = V ? (O.slots ? 8 : 10) : 6; for (let r = 0; r < nr; r++) for (let i = 0; i < q; i++) {
      const a = (i + r * 0.5 + 0.5) / q * T + (O.slots ? 0.16 : 0), rq = rh + (rd - rh) * (nr === 1 ? 0.55 : 0.32 + r * 0.38);
      sq(a, rq, 0.0036, HOLE); } }
    if (O.vents) { const nv = V ? O.vents : 8; for (let i = 0; i < nv; i++) { const a = i / nv * T; G.quadO(h.p(a - 0.012, zF, rh + 0.008), h.p(a + 0.012, zF, rh + 0.008), h.p(a + 0.012, zF, rd - 0.004), h.p(a - 0.012, zF, rd - 0.004), [0.03, 0.03, 0.035], h.out); } }
    // the caliper (still): an arc of a block over the disc's rear upper edge, out past it; its pads under it, its window, a stripe on it
    caliper(h, O, rd, rr);
  }
  const K2 = (c) => [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7];
  function caliper(h, O, rd, rr) {
    const G = h.still, ac = Math.PI * 0.78, half = O.span / 2 * Math.PI / 180, ro = Math.min(rd + 0.035 * rr, 0.9 * rr), ri = rd - O.deep * rr, z0 = h.zd + 0.003, z1 = h.zd + 0.017, q = h.vis ? 6 : 4;
    const C = O.cal, side = K2(C), at = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z], mid = at(ac, (ri + ro) / 2, (z0 + z1) / 2);
    const a0 = ac - half, a1 = ac + half, A = (i) => a0 + (a1 - a0) * i / q;
    for (let i = 0; i < q; i++) { const b0 = A(i), b1 = A(i + 1), e = 0.08 * (a1 - a0) / q;   // (its face rounded at its ends: the outer corners pulled in)
      const r0 = (b) => ri + (b - a0 < e * 2 || a1 - b < e * 2 ? 0.01 * rr : 0), r1 = (b) => ro - (b - a0 < e * 2 || a1 - b < e * 2 ? 0.02 * rr : 0);
      G.quadO(at(b0, r0(b0), z1), at(b1, r0(b1), z1), at(b1, r1(b1), z1), at(b0, r1(b0), z1), C, mid);
      G.quadO(at(b0, r1(b0), z1), at(b1, r1(b1), z1), at(b1, r1(b1), z0), at(b0, r1(b0), z0), side, mid);   // (its outer edge)
      G.quadO(at(b0, r0(b0), z1), at(b1, r0(b1), z1), at(b1, r0(b1), z0), at(b0, r0(b0), z0), side, mid); }   // (its inner edge)
    for (const b of [a0, a1]) { const rI = ri + 0.01 * rr, rO = ro - 0.02 * rr; G.quadO(at(b, rI, z1), at(b, rO, z1), at(b, rO, z0), at(b, rI, z0), side, mid); }
    if (O.pad) { const ri2 = ri - 0.012 * rr; for (let i = 0; i < q; i++) G.quadO(at(A(i), ri2, z0 + 0.001), at(A(i + 1), ri2, z0 + 0.001), at(A(i + 1), ri, z0 + 0.001), at(A(i), ri, z0 + 0.001), O.pad, [0, 0, z0 - 5]); }
    if (O.win) { const w0 = ac - half * 0.45, w1 = ac + half * 0.45, rA = ri + (ro - ri) * 0.42, rB = ri + (ro - ri) * 0.68;   // (the window: the pads seen in it, dark)
      G.quadO(at(w0, rA, z1 + 0.0006), at(w1, rA, z1 + 0.0006), at(w1, rB, z1 + 0.0006), at(w0, rB, z1 + 0.0006), [0.06, 0.06, 0.065], [0, 0, z1 - 5]);
      for (const b of [w0 - 0.05, w1 + 0.05]) { const p = at(b, (ri + ro) / 2, z1 + 0.0006);   // (its two bridge bolts)
        for (let j = 0; j < 6; j++) { const c0 = j / 6 * Math.PI * 2, c1 = (j + 1) / 6 * Math.PI * 2, rb = 0.012 * rr;
          G.triO(p, [p[0] + Math.cos(c0) * rb, p[1] + Math.sin(c0) * rb, p[2]], [p[0] + Math.cos(c1) * rb, p[1] + Math.sin(c1) * rb, p[2]], [0.78, 0.79, 0.82], [0, 0, z1 - 5]); } } }
    if (O.stripe) { const rA = ri + (ro - ri) * 0.78, rB = ri + (ro - ri) * 0.86;
      for (let i = 1; i < q - 1; i++) G.quadO(at(A(i), rA, z1 + 0.0006), at(A(i + 1), rA, z1 + 0.0006), at(A(i + 1), rB, z1 + 0.0006), at(A(i), rB, z1 + 0.0006), O.stripe, [0, 0, z1 - 5]); }
  }
  DELI.add('zavore', zavore);

  // ================================================================ matice: the wheel nuts of option n
  // m: { k: the nuts on a wheel (KOLIBRI 4), r: their circle (rim radii, 0.2) }. Each a prism standing on the hub, over the rims' own nuts
  // (at their angles: 45 degrees on), from 1 cm over the dish to 3.4 cm; a centre-lock rim (platisca 12, 14, 16): one big nut in the middle
  function matice(h, n, m) {
    if (!h.full) return;
    const RB = [[0.2, 0.32, 0.85], [0.55, 0.2, 0.62], [0.85, 0.62, 0.2]], TI = [0.6, 0.58, 0.54];   // (burnt titanium: blue, purple, gold)
    // col, top (its top's colour), sides (6 a hex, 12 a spline), r (its radius in rim radii), tall, lock (one nut a lock: its colour),
    // flange (a washer at its foot), open (open-ended: the stud's end showing), burnt (a gradient up it)
    const O = [null,
      { col: [0.1, 0.1, 0.11], sides: 6 },                                     // 1 jeklene, črne
      { col: CHR, sides: 6, dome: true },                                      // 2 kromirane (acorn)
      { col: CHR, sides: 6, dome: true, lock: [0.3, 0.3, 0.32] },              // 3 s ključavnico
      { col: [0.08, 0.08, 0.09], sides: 12, r: 0.045, tall: 1.2 },             // 4 ozke, športne (spline)
      { col: [0.85, 0.08, 0.06], sides: 6, flange: true },                     // 5 rdeče
      { col: [0.1, 0.3, 0.9], sides: 6, flange: true },                        // 6 modre
      { col: [0.9, 0.7, 0.18], sides: 6, flange: true },                       // 7 zlate
      { col: [0.05, 0.05, 0.055], sides: 6, flange: true, top: [0.2, 0.2, 0.22] },   // 8 črne
      { col: [0.72, 0.73, 0.76], sides: 6, flange: true, chamf: true },        // 9 kovane
      { col: [0.42, 0.16, 0.66], sides: 6, flange: true, chamf: true },        // 10 kovane, eloksirane (violet)
      { col: [0.72, 0.73, 0.76], sides: 6, flange: true, chamf: true, lock: [0.2, 0.2, 0.22] },   // 11 kovane s ključavnico
      { col: [0.16, 0.16, 0.17], sides: 6, flange: true, open: true },         // 12 dirkalne, odprte
      { col: TI, sides: 6, flange: true, chamf: true },                        // 13 titanove
      { col: TI, sides: 6, flange: true, chamf: true, burnt: true },           // 14 titanove, mavrične
      { col: TI, sides: 6, flange: true, chamf: true, burnt: true, lock: RB[1] },   // 15 s ključavnico
      { col: TI, sides: 12, r: 0.05, flange: true, open: true, burnt: true },  // 16 titanove, dirkalne (spline, open)
    ][n];
    if (!O) return;
    const G = h.g, rr = h.rr, pl = h.fitted && h.fitted.platisca, lockR = pl && LOCK.includes(pl);
    const V = h.vis, fan = (c, pts, z, col, apex) => { for (let i = 0; i < pts.length; i++) G.triO([c[0], c[1], z + (apex || 0)], [pts[i][0], pts[i][1], z], [pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], z], col, [c[0], c[1], z - 1]); };
    const nut = (cx, cy, R, z0, z1, lock) => {   // (Normalni: a hex prism and its top; Visoki: the spline, the washer, the chamfered top)
      const col = lock || O.col, top = O.top || lerp(col, [1, 1, 1], 0.15), sides = lock ? (V ? 10 : 6) : O.sides === 12 && V ? 8 : 6, c = [cx, cy];
      const pts = O.sides === 12 && V && !lock ? poly(cx, cy, R, 8, 0, R * 0.84) : poly(cx, cy, R, sides, Math.PI / 6);
      if (O.flange && V) { const F = poly(cx, cy, R * 1.24, 6, Math.PI / 6), I = poly(cx, cy, R * 0.98, 6, Math.PI / 6), zf = z0 + 0.003;   // (the washer: its top round the nut)
        for (let i = 0; i < 6; i++) G.quadO([F[i][0], F[i][1], zf], [F[(i + 1) % 6][0], F[(i + 1) % 6][1], zf], [I[(i + 1) % 6][0], I[(i + 1) % 6][1], zf], [I[i][0], I[i][1], zf], lerp(col, [0, 0, 0], 0.15), [cx, cy, zf - 1]); }
      const dome = O.dome || (O.chamf && V), zt = O.dome ? z1 - 0.007 : dome ? z1 - 0.003 : z1, burnt = O.burnt && !lock;
      prism(G, h, pts, z0, zt, col, null, burnt ? [RB[2], RB[0]] : null);
      if (O.open) { fan(c, pts, zt, burnt ? RB[0] : [0.05, 0.05, 0.055]);   // (open-ended: dark inside, the stud's end standing in it, steel)
        fan(c, poly(cx, cy, R * 0.42, 6), zt + 0.003, [0.7, 0.7, 0.72]); }
      else fan(c, pts, zt, burnt ? RB[1] : top, dome ? z1 - zt : 0);   // (its top: flat, the acorn's dome, the chamfer's low cone)
      if (lock) fan(c, poly(cx, cy, R * 0.5, 10, 0, R * 0.25), z1 + 0.0008, [0.03, 0.03, 0.035]);   // (the lock's key pattern, dark)
    };
    if (lockR) { nut(0, 0, rr * 0.17, h.zd + 0.05, h.zd + 0.07, null); return; }   // (a centre lock: one big nut over the rim's own)
    const k = (m && m.k) || 4, pr = rr * ((m && m.r) || 0.2), R = rr * (O.r || 0.062), tall = O.tall || 1;
    for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2 + Math.PI / 4;
      nut(Math.cos(a) * pr, Math.sin(a) * pr, R, h.zd + 0.01, h.zd + 0.01 + 0.024 * tall, O.lock && i === 0 ? O.lock : null); }
  }
  DELI.add('matice', matice);
})();
