/* =========================================================================
   WORLD — the buildings by the road: the parts of the package S · Stavbe (Realizem S0; docs/realizem.md, docs/realizem/paket-s.md).
   World.stavbe: a facade atlas drawn on a canvas (generic: plaster, stone, brick, boards and logs, windows with shutters, doors, railings,
   roofs of tiles, slate, thatch and sheet; no names, signs or logos, no photographs), a builder of one house on its OpenStreetMap footprint
   in three levels of detail (house), the kits by countries (KOMPLETI: the style, the walls, the roofs) and the tracks that use them (PROGE):
     1  better shapes and roofs: hipped and gabled roofs (the atlas's courses), ridges and hips, chimneys; the walls plain
     2  and the walls from the atlas: windows by floors, doors (with steps where the ground falls away from them), shutters; wide eaves
     3  and what stands by the road, only where the track's data has it (the options balc, yard, awn, solar; nothing is made up): balconies,
        the yard with its wall or hedge and gate, shrubs, a parked car, awnings, solar panels
   A house stands where the map has it, level, with its floor at the highest ground under the footprint and a plain plinth down to the lowest
   (put(): the rule of the ground); the ground itself is not changed.
   One texture and one material for every house of a track (a mesh a scenery chunk); the wall's and the roof's colours are the vertex colours,
   so a house costs about as many vertices as a box with its band and stepped roof. Each strip of the atlas runs the whole width and repeats
   along u (RepeatWrapping), so a wall of any length is one quad a floor (or one for all its floors: the rows stack).
   A track's builder asks setup(); only the tracks in PROGE get it (real tracks), every other world stays as it is.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { box, cone, ico, parkedCar, crH, clamp, rng } = API;
  const AW = 1024, AH = 2048, BAY = 128;
  // the strips' tops (px from the canvas's top); a bay is 128 px wide (~2.9 m of wall), a floor 128 px high
  const ST = { upA: 0, upB: 128, gr: 256, flUp: 384, flGr: 512, plain: 640, rail: 704, wall: 736, white: 764, roof: 768,
    f1up: 1024, f1gr: 1152, f1pl: 1280, f2up: 1344, f2gr: 1472, f2pl: 1600, roof2: 1792 };   // (the lower half: two more finishes of the wall and a second roof; 1664 to 1792 is free)
  const vAt = (y) => 1 - y / AH, WHITE = [0.5, vAt(ST.white + 2)];
  const DOOR = [1, 6], TALL = [2, 6], FLB = [1, 3, 5], SHOP = [0, 2, 5];   // which bays of a strip hold a door, a French window, the flats' balcony doors, the shops
  // the styles (an atlas and a material each, made when first asked for): the windows (bare: no shutters; roll: roller shutters), the roof and
  // the second roof (tile, slate, thatch, metal), the wall's finishes beside the plaster (stone, brick, timber, lap, logs; { up, gr }: the
  // upper floors and the ground floor differ). med: the Mediterranean; north: the Ardennes, the Eifel; cape: the Cape; alp: the Alps; gora:
  // mountain huts; les: houses of logs and boards
  const STYLES = { med: { roof: 'tile', fin: ['stone'] }, north: { roof: 'slate', roof2: 'tile', fin: ['stone', 'brick'], bare: true, roll: true },
    cape: { roof: 'tile', roof2: 'thatch', fin: ['stone'], bare: true }, alp: { roof: 'tile', roof2: 'metal', fin: [{ up: 'timber', gr: 'plaster' }, 'stone'], bare: true },
    gora: { roof: 'metal', roof2: 'slate', fin: [{ up: 'timber', gr: 'stone' }, 'stone'], bare: true }, les: { roof: 'metal', roof2: 'tile', fin: ['logs', 'lap'], bare: true } };
  const TEXS = new Map();

  function atlas(style) {
    const sk = STYLES[style] ? style : 'med', SY = STYLES[sk];
    if (TEXS.has(sk)) return TEXS.get(sk);
    const c = document.createElement('canvas'); c.width = AW; c.height = AH;
    const x = c.getContext('2d'), R = rng(4711);
    const rect = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // the plaster under every wall: nearly white (the wall's colour is the vertex colour), its flecks and the streaks the rain leaves
    const plaster = (y0, h) => {
      rect('#f4f1e9', 0, y0, AW, h);
      for (let k = 0; k < h * 16; k++) { const a = R() * AW, b = y0 + R() * (h - 4); x.fillStyle = R() < 0.55 ? 'rgba(70,56,40,' + (0.012 + R() * 0.03) + ')' : 'rgba(255,255,255,' + (0.04 + R() * 0.06) + ')'; x.fillRect(a, b, 2 + R() * 8, 1 + R() * 4); }
      for (let k = 0; k < h / 2.5; k++) { const a = R() * AW, b = y0 + R() * h * 0.6, l = Math.min(10 + R() * h * 0.5, y0 + h - b); x.fillStyle = 'rgba(80,66,48,' + (0.025 + R() * 0.035) + ')'; x.fillRect(a, b, 1 + R() * 2.2, l); }
    };
    // a wall's finish under the windows. Plaster, rubble stone and lap siding are near white (the wall's colour is the house's vertex colour);
    // brick, stained boards and logs carry their own colour (the house's stays light, so the windows' white frames stay white). 1 px is 2.3 cm
    const isP = (kind) => !kind || kind === 'plaster', tone = (r, g, b, f) => 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')';
    const finish = (kind, y0, h) => {
      if (isP(kind)) return plaster(y0, h);
      const y1 = y0 + h;
      if (kind === 'stone') {   // coursed rubble: courses 16 to 27 cm high, stones 20 to 55 cm long, each its own tone, mortar between
        rect('#c9c4b9', 0, y0, AW, h);
        for (let b = y0; b < y1;) { const ch = Math.min(7 + Math.floor(R() * 5), y1 - b);
          for (let a = -Math.floor(R() * 14); a < AW;) { const w = 9 + Math.floor(R() * 16), t = R(); rect(tone(246, t > 0.8 ? 238 : 243, t > 0.8 ? 224 : 236, 0.78 + R() * 0.22), a, b, w - 1.5, ch - 1.5); a += w; }
          b += ch; }
      } else if (kind === 'brick') {   // bricks 23 by 9 cm in running bond
        rect('#cfc6b8', 0, y0, AW, h);
        for (let b = y0, r = 0; b < y1; b += 4, r++) for (let a = r % 2 ? -5 : 0; a < AW; a += 10) rect(tone(176, 98, 76, (R() < 0.08 ? 0.72 : 0.86) + R() * 0.2), a, b, 9, Math.min(3, y1 - b));
      } else if (kind === 'timber') {   // stained upright boards, a line of shade between two
        for (let a = 0; a < AW; a += 8) { rect(tone(128, 92, 60, 0.82 + R() * 0.3), a, y0, 8, h); rect('rgba(30,18,8,0.5)', a + 6.6, y0, 1.4, h); rect('rgba(255,230,190,0.12)', a, y0, 1.2, h); }
      } else if (kind === 'lap') {   // painted lap siding: boards 18 cm, each casts a line of shade on the next, a butt joint now and then
        rect('#f3f1ea', 0, y0, AW, h);
        for (let b = y0; b < y1; b += 8) { rect('rgba(40,36,30,0.34)', 0, b + 6.6, AW, 1.4); rect('rgba(255,255,255,0.4)', 0, b, AW, 1.2); for (let a = Math.floor(R() * 90); a < AW; a += 70 + Math.floor(R() * 120)) rect('rgba(40,36,30,0.22)', a, b, 1, 6.6); }
      } else {   // logs: round timbers 25 cm, lit from above, dark in the joints
        for (let b = y0; b < y1; b += 11) { const lh = Math.min(11, y1 - b); rect(tone(150, 108, 70, 0.85 + R() * 0.25), 0, b, AW, lh); rect('rgba(255,236,200,0.2)', 0, b + 1, AW, 3); rect('rgba(24,14,6,0.3)', 0, b + 7, AW, 2.5); rect('rgba(14,8,4,0.6)', 0, b + 9.5, AW, 1.5);
          for (let k = 0; k < 26; k++) rect('rgba(40,24,10,' + (0.06 + R() * 0.1) + ')', R() * AW, b + 1 + R() * 7, 14 + R() * 60, 1); }
      }
    };
    const shade = (y0, h, a0, a1) => { const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(46,34,22,' + a0 + ')'); g.addColorStop(1, 'rgba(46,34,22,' + a1 + ')'); x.fillStyle = g; x.fillRect(0, y0, AW, h); };
    const louv = (a, b, w, h, S) => { rect(S[0], a, b, w, h); x.fillStyle = S[1]; for (let yy = b + 2; yy < b + h - 1; yy += 4) x.fillRect(a + 2, yy, w - 4, 1.7); x.strokeStyle = S[1]; x.lineWidth = 1.2; x.strokeRect(a + 0.6, b + 0.6, w - 1.2, h - 1.2); };
    const glass = (a, b, w, h) => { const g = x.createLinearGradient(0, b, 0, b + h); g.addColorStop(0, '#8097a8'); g.addColorStop(0.42, '#3b4955'); g.addColorStop(1, '#252e37'); x.fillStyle = g; x.fillRect(a, b, w, h); };
    const GRN = sk === 'cape' ? ['#70503a', '#4c3423'] : ['#3b6348', '#274431'];
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
      // (a French window's low railing, painted on: a balcony itself only where a house is asked to have one)
      if (o.rail) { const ry = b + h - 44, rx = a - 3, rw = w + 6; x.fillStyle = '#22252a'; for (let k = 0; k * 6 <= rw; k++) x.fillRect(rx + k * 6 - 0.7, ry, 1.4, 44); x.fillRect(rx, ry, rw, 2.4); x.fillRect(rx, ry + 41.5, rw, 2); }
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
    rect('#f4f1e9', 0, AH / 2, AW, AH / 2);   // (the lower half under what a style leaves free: plaster, never a hole)
    const upper = (y0, n, kind) => {
      finish(kind, y0, BAY); shade(y0, 14, 0.2, 0); if (isP(kind)) course(y0);
      (n ? ['o', 'o', 't', 'c', 'o', 'b', 't', 'o'] : ['o', 'c', 't', 'o', 'o', 'b', 't', 'c']).forEach((k, i) => { const bx = i * BAY, B = !!SY.bare;
        if (k === 'o') win(bx, y0, { bare: B }); else if (k === 'c') win(bx, y0, SY.roll ? { bare: true, roll: 0.35 + R() * 0.4 } : { closed: true }); else if (k === 't') win(bx, y0, { tall: true, rail: true, bare: B, closed: !B && n === 0 && i === 6 }); });
    };
    upper(ST.upA, 0); upper(ST.upB, 1);
    // a house's ground floor: the plinth, two doors (a house takes one of them, in the middle of its wall on the road), windows, some behind
    // grilles or shutters; no garage door (a house is not given what the map does not say it has)
    const ground = (g0, kind) => {
      finish(kind, g0, BAY); shade(g0, 10, 0.12, 0); shade(g0 + BAY - 50, 26, 0, 0.1);
      if (isP(kind)) { rect('#d2ccbd', 0, g0 + BAY - 24, AW, 24); rect('rgba(60,45,30,0.3)', 0, g0 + BAY - 25, AW, 1.6); }
      ['g', 'd', 'c', 'o', 'o', 'o', 'd', 'c'].forEach((k, i) => { const bx = i * BAY, y0 = g0;
        if (k === 'g') win(bx, y0, { bare: true, grille: !SY.bare }); else if (k === 'c') win(bx, y0, SY.roll ? { bare: true, roll: 0.5 } : { closed: true }); else if (k === 'o') win(bx, y0, { bare: !!SY.bare });
        else door(bx, y0, { col: i === 1 ? '#6f4b32' : sk === 'med' ? '#35503d' : '#3d4650' }); });
    };
    ground(ST.gr);
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
    // (the railing: wrought iron on nothing, alpha 0 between the bars: every bar a spear head over the top rail, a ring between the rails at every
    // fourth; drawn by the railings' own material, alphaTest)
    x.clearRect(0, ST.rail, AW, 32); x.fillStyle = '#1d2024';
    for (let a = 0; a < AW; a += 8) { x.fillRect(a + 2.5, ST.rail + 5, 3, 27); x.beginPath(); x.moveTo(a + 4, ST.rail); x.lineTo(a + 6.6, ST.rail + 6); x.lineTo(a + 1.4, ST.rail + 6); x.closePath(); x.fill(); }
    x.fillRect(0, ST.rail + 7, AW, 3); x.fillRect(0, ST.rail + 12, AW, 2); x.fillRect(0, ST.rail + 26, AW, 3.5);
    for (let a = 0; a < AW; a += 128) { x.fillRect(a, ST.rail + 3, 8, 29); x.beginPath(); x.arc(a + 4, ST.rail + 3.5, 4.4, 0, 6.3); x.fill(); }   // (a post every 2.56 m, a ball on it)
    plaster(ST.wall, 28); rect('#e9e3d3', 0, ST.wall, AW, 5); rect('rgba(50,38,26,0.3)', 0, ST.wall + 5, AW, 2); shade(ST.wall + 16, 12, 0, 0.16);
    rect('#ffffff', 0, ST.white, AW, 4);
    // the roof: courses of tiles from the eave (the strip's foot) to the ridge, 16 px a course (0.5 m), 8 px a tile (0.25 m): the cover tile's lit
    // back and the channel's shade, each tile its own tone, a few old and dark, the overlap's shadow at each course's foot, lichen in patches
    const roofing = (kind, r0) => {
      if (kind === 'slate') {   // slates: flat, 0.5 m by 0.5 m, every other course half a slate on; each its own grey, thin joints
        for (let r = 0; r < 16; r++) for (let k = 0; k <= 65; k++) {
          const a = k * 16 - (r % 2 ? 8 : 0), b = r0 + r * 16, f = 0.8 + R() * 0.2, t = R(), o = t < 0.06 ? 0.8 : 1;
          rect('rgb(' + Math.round(250 * f * o) + ',' + Math.round(250 * f * o) + ',' + Math.round(252 * f * o) + ')', a, b, 16, 16); rect('rgba(14,16,22,0.3)', a, b, 1.3, 16);
        }
        for (let r = 0; r < 16; r++) { rect('rgba(14,16,22,0.42)', 0, r0 + r * 16 + 14.3, AW, 1.7); rect('rgba(255,255,255,0.1)', 0, r0 + r * 16, AW, 2); }
      } else if (kind === 'thatch') {   // reed: fine strokes down the slope, a band of shade where a layer ends
        rect('#f5f0e2', 0, r0, AW, 256);
        for (let k = 0; k < 5200; k++) { const a = R() * AW, b = r0 + R() * 250; x.fillStyle = R() < 0.6 ? 'rgba(70,52,26,' + (0.05 + R() * 0.12) + ')' : 'rgba(255,250,235,' + (0.1 + R() * 0.15) + ')'; x.fillRect(a, b, 1 + R() * 1.5, Math.min(6 + R() * 22, r0 + 256 - b)); }
        for (let r = 0; r < 4; r++) { rect('rgba(50,36,18,0.22)', 0, r0 + r * 64 + 59, AW, 3); rect('rgba(255,250,235,0.18)', 0, r0 + r * 64, AW, 3); }
      } else if (kind === 'metal') {   // sheet with standing seams 0.5 m apart, a joint across the slope
        rect('#f3f3f1', 0, r0, AW, 256);
        for (let a = 0; a < AW; a += 16) { rect('rgba(30,30,34,' + (R() * 0.07) + ')', a, r0, 16, 256); rect('rgba(18,20,26,0.36)', a, r0, 1.5, 256); rect('rgba(255,255,255,0.32)', a + 1.5, r0, 1.5, 256); }
        rect('rgba(18,20,26,0.2)', 0, r0 + 127, AW, 1.5);
      } else {
        for (let r = 0; r < 16; r++) for (let k = 0; k <= 128; k++) {
          const a = k * 8 - (r % 2 ? 4 : 0), b = r0 + r * 16, f = 0.83 + R() * 0.19, t = R(), o = t < 0.07 ? 0.76 : 1;
          rect('rgb(' + Math.round(255 * f * o) + ',' + Math.round(249 * f * o * (t > 0.9 ? 1.02 : 1)) + ',' + Math.round(242 * f * o * (t > 0.9 ? 0.9 : 1)) + ')', a, b, 8, 16);
          rect('rgba(44,22,10,0.36)', a, b, 2, 16); rect('rgba(255,244,226,0.22)', a + 4, b, 2, 16);
        }
        for (let r = 0; r < 16; r++) { rect('rgba(44,22,10,0.4)', 0, r0 + r * 16 + 14, AW, 2); rect('rgba(255,244,226,0.12)', 0, r0 + r * 16, AW, 2.5); }
      }
      if (kind !== 'metal') for (let k = 0; k < 46; k++) { x.fillStyle = 'rgba(74,82,60,' + (0.05 + R() * 0.09) + ')'; x.beginPath(); x.ellipse(R() * AW, r0 + 12 + R() * 232, 10 + R() * 34, 5 + R() * 12, 0, 0, 6.3); x.fill(); }
    };
    roofing(SY.roof, ST.roof); if (SY.roof2) roofing(SY.roof2, ST.roof2);
    // the style's own finishes of the wall (the lower half): an upper floor, a ground floor and a plain strip (gables, party walls) each
    (SY.fin || []).forEach((f, k) => { const up = f.up || f, gr = f.gr || f; upper(k ? ST.f2up : ST.f1up, 0, up); ground(k ? ST.f2gr : ST.f1gr, gr); finish(up, k ? ST.f2pl : ST.f1pl, 64); });
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; TEXS.set(sk, t);
    return t;
  }
  // the houses' material, and the railings' (the same atlas: what is iron stands on nothing, so it is cut out; seen from both sides). A new one
  // each time (a world may wrap its own cut into it; Render frees a world's materials with the world), the atlas is kept
  // (userData.stavbe: how the tests and the tools find the builder's meshes in a world)
  const tag = (m, k) => { m.userData.stavbe = k; return m; };
  const mat = (style) => tag(new THREE.MeshLambertMaterial({ map: atlas(style), vertexColors: true }), 'hisa');
  const matRail = (style) => tag(new THREE.MeshLambertMaterial({ map: atlas(style), vertexColors: true, alphaTest: 0.3, side: THREE.DoubleSide }), 'ograja');

  const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const uR = (m) => m / 32, vR0 = (m, top) => vAt(top + 255) + Math.min(m, 7.9) / 8 * (254 / AH);   // a roof's strip (top: its top row): 32 m across the atlas, 8 m from the eave up
  const AWN = [[0.3, 0.46, 0.34], [0.84, 0.62, 0.28], [0.56, 0.22, 0.2], [0.9, 0.86, 0.74], [0.3, 0.4, 0.56]];
  const CARS = [[0.82, 0.82, 0.8], [0.2, 0.22, 0.25], [0.6, 0.12, 0.1], [0.3, 0.38, 0.5], [0.72, 0.72, 0.74], [0.5, 0.52, 0.5]];

  // One house on its footprint. o: g (a GB with UVs: Chunks(…, true)), gf (the railings' GB), x, z, L, W, ang (the footprint, as LD.bld),
  // y0 (its floor) and base (the plinth under the floor, down to the lowest ground under it: put() fits both), hh (the walls' height),
  // fl (floors), type ('house' | 'small' | 'flats'), wall, roof, band (colours; band: today's row of shutters, level 1), lev (1-3),
  // near (2 by the road, 1 near, 0 farther out), rd ([x, z]: the way to the road from the house), gH(x, z) (the ground), onRoad(x, z) (inside
  // the road's barriers: nothing of a yard or of the steps there); balc, yard, awn, solar (only where the track's data has them: balconies,
  // the yard, awnings, panels); out (an object that gets the door's wall and place, the footprint as fitted, the floor, the plinth and the
  // steps: for the tests). The door is on the free wall that best faces the road and that the ground lets one in by: level, or up steps of
  // at most 1.2 m (flight()); where the ground stands over the floor or lies deeper, another wall has it, or none. Returns the vertices it added.
  function house(o) {
    const g = o.g, n0 = g.P.length, f0 = o.gf ? o.gf.P.length : 0;
    let L = o.L, W = o.W, ang = o.ang, at = o.att ? o.att.slice() : [0, 0, 0, 0], ex = o.ext ? o.ext.slice() : [0, 0, 0, 0];
    const turn = () => { const t = L; L = W; W = t; ang += Math.PI / 2; at = [at[2], at[3], at[1], at[0]]; ex = [ex[2], ex[3], ex[1], ex[0]]; };
    if (W > L) turn();
    // (the ridge runs along x: along the house, or, where only its long walls stand against neighbours (a house of a row) or against its own
    // other wing, across it, towards them)
    if (!o.yardOnly && (at[2] || at[3]) && !at[0] && !at[1] && L < (at[2] === 2 || at[3] === 2 ? W * 1.7 : 18)) turn();
    const c = Math.cos(ang), s = Math.sin(ang), x0 = o.x, z0 = o.z, y0 = o.y0, hh = o.hh, lev = o.lev, near = o.near, flats = o.type === 'flats', small = o.type === 'small';
    const sd = o.seed || [x0, z0], fl = Math.max(1, o.fl | 0), wc = o.wall, H = (k) => crH(sd[0], sd[1], 40 + k);
    // a floor's height: the walls' height by the floors, but never a stretched row of windows (a floor is at most 3.2 m, a single one at least 2.9);
    // what is left over the top floor is a plain band under the eaves (knee), a ground floor lower than a row shows the row's lower part (cut);
    // under 2.25 m (a shed, a garage) the walls are plain. b0: the walls' foot (a house on a plinth stands on it, one without runs into the ground)
    const fh = flats ? hh / fl : Math.min(Math.max(hh / fl, fl === 1 ? 2.9 : 0), 3.2), cut = Math.min(1, hh / fh), knee = Math.max(0, hh - fl * fh), low = !flats && hh < 2.25, b0 = o.base > 0 ? 0 : -0.25;
    const P = (lx, ly, lz) => [x0 + lx * c - lz * s, y0 + ly, z0 + lx * s + lz * c];
    const inn = [x0, y0 + hh * 0.5, z0];
    // the four walls: [from, to (local x, z)], the wall's own angle, its normal; WA: what stands against each (1 a neighbour, 2 a wing of the same
    // house); the one that looks at the road (a free one) and the door's place on it
    const WL = [[[L / 2, W / 2], [-L / 2, W / 2], ang, 0, 1], [[-L / 2, -W / 2], [L / 2, -W / 2], ang, 0, -1], [[L / 2, -W / 2], [L / 2, W / 2], ang + Math.PI / 2, 1, 0], [[-L / 2, W / 2], [-L / 2, -W / 2], ang + Math.PI / 2, -1, 0]];
    const WA = [at[3], at[2], at[1], at[0]];
    // the wall with the door: the free wall that best looks at the road. On a slope (o.gH, o.base) a door stands where the ground is at the floor: where the ground
    // before that wall lies too far under the floor (a house: more than four steps; a shed, a garage: more than a threshold, or the ground stands over its floor),
    // the door goes to the free wall with the fewest steps, and where no wall will do the house shows no door (the steps: flight(), their count nSt)
    const WD = WL.map((w) => { const len = Math.hypot(w[1][0] - w[0][0], w[1][1] - w[0][1]), nb = Math.max(1, Math.round(len / 2.9)), t = (Math.floor((nb - 1) / 2) + 0.5) / nb, lx = w[0][0] + (w[1][0] - w[0][0]) * t, lz = w[0][1] + (w[1][1] - w[0][1]) * t;
      return { x: x0 + lx * c - lz * s, z: z0 + lx * s + lz * c, nx: w[3] * c - w[4] * s, nz: w[3] * s + w[4] * c }; });
    const taken = (px, pz) => (o.onRoad && o.onRoad(px, pz)) || (o.plots && !o.plots.free(px, pz, o.id)) || (o.barrier && o.barrier(px, pz));
    const flight = (k) => { const d = WD[k], drop = y0 - o.gH(d.x + d.nx, d.z + d.nz);
      if (small || low) return drop > 0.35 || y0 - o.gH(d.x + d.nx * 0.15, d.z + d.nz * 0.15) < -0.12 ? -1 : 0;
      if (drop <= 0.22) return 0; if (drop > 1.2) return -1;
      for (let i = 1; i <= 7; i++) { const m = 0.9 + (i - 0.5) * 0.28, px = d.x + d.nx * m, pz = d.z + d.nz * m; if (taken(px, pz)) return -1; if (y0 - 0.02 - i * 0.19 - o.gH(px, pz) < 0.06) return i; }
      return -1; };
    let face = -1, noDoor = o.doorWall === false, nSt = 0; if (o.rd) { let bd = 0.3; WL.forEach((w, k) => { if (WA[k]) return; const d = WD[k].nx * o.rd[0] + WD[k].nz * o.rd[1]; if (d > bd) { bd = d; face = k; } }); }
    if (face >= 0 && o.gH && o.base > 0) { nSt = flight(face);
      if (nSt < 0 || nSt > 4) { let bk = -1, bs = 99, bn = 0; WL.forEach((w, k) => { if (WA[k] || k === face) return; const n = flight(k), sc = n - 0.5 * (WD[k].nx * o.rd[0] + WD[k].nz * o.rd[1]); if (n >= 0 && sc < bs) { bs = sc; bk = k; bn = n; } });
        if (bk >= 0 && (nSt < 0 || bn < nSt - 1)) { face = bk; nSt = bn; } else if (nSt < 0) { noDoor = true; nSt = 0; } } }
    const wf = face < 0 ? null : WL[face], lenF = wf ? Math.hypot(wf[1][0] - wf[0][0], wf[1][1] - wf[0][1]) : 0, nbF = wf ? Math.max(1, Math.round(lenF / 2.9)) : 1, tD = (Math.floor((nbF - 1) / 2) + 0.5) / nbF;
    const doorL = wf ? [wf[0][0] + (wf[1][0] - wf[0][0]) * tD, wf[0][1] + (wf[1][1] - wf[0][1]) * tD] : null;
    if (o.out) { o.out.face = face; o.out.door = doorL ? [x0 + doorL[0] * c - doorL[1] * s, z0 + doorL[0] * s + doorL[1] * c] : null; o.out.n = wf ? [wf[3] * c - wf[4] * s, wf[3] * s + wf[4] * c] : null;
      o.out.at = [x0, z0, L, W, ang]; o.out.y0 = y0; o.out.base = o.base || 0; o.out.steps = nSt; o.out.noDoor = noDoor; }   // (and where it stands after put()'s fit, its floor, plinth and steps: for the tests)
    if (o.probe) return 0;
    g.dUV = WHITE;
    if (!o.yardOnly) {
    /* ---- the walls ---- */
    // the wall's finish (0 the plaster, 1 and 2 the style's own: their strips of the atlas) and the roof's strip (the style's first or second roof)
    const FS = flats || !(o.fin > 0) ? null : o.fin === 2 ? [ST.f2up, ST.f2gr, ST.f2pl] : [ST.f1up, ST.f1gr, ST.f1pl], PL = FS ? FS[2] : ST.plain, vR = (m) => vR0(m, o.roofK ? ST.roof2 : ST.roof);
    // (on a slope the house's floor lies level at the ground's high side and a plinth carries it down to the low side: plaster's painted plinth
    // runs on down, stone and brick stand on grey stone)
    if (o.base > 0) box(g, x0, y0 - o.base - 0.3, z0, L + 0.12, o.base + 0.3, W + 0.12, ang, FS ? [0.56, 0.54, 0.5] : [wc[0] * 0.824, wc[1] * 0.8, wc[2] * 0.741], null, true);
    if (lev < 2) {   // as today: the wall's colour, a row of shutters round a house, rows of windows round a block of flats
      box(g, x0, y0 - 0.5, z0, L, hh + 0.5, W, ang, wc, null, true);
      if (flats) for (let f = 1; f <= fl; f++) box(g, x0, y0 + f * fh - 1.8, z0, L + 0.05, 0.9, W + 0.05, ang, mul(o.band, 0.75), null, true);
      else if (!small) box(g, x0, y0 + hh * 0.55, z0, L + 0.04, 1.1, W + 0.04, ang, o.band, null, true);
    } else {
      const rowG = FS ? FS[1] : ST.gr, dB = DOOR[H(5) < 0.5 ? 0 : 1];   // (a house: its ground floor's row and which of the row's two doors it has)
      WL.forEach((w, k) => {
        const A = w[0], B = w[1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), nb = Math.max(1, Math.round(len / 2.9)), wx = (B[0] - A[0]) / len, wz = (B[1] - A[1]) / len;
        // a piece of the wall: from ta to tb along it (m), from ya to yb up it, the atlas's u and v at its corners (off: that far before the wall)
        const q = (ta, tb, ya, yb, ua, ub, va, vb, off) => { const ox = off ? w[3] * off : 0, oz = off ? w[4] * off : 0, ax = A[0] + wx * ta + ox, az = A[1] + wz * ta + oz, bx = A[0] + wx * tb + ox, bz = A[1] + wz * tb + oz;
          g.quadO(P(ax, ya, az), P(bx, ya, bz), P(bx, yb, bz), P(ax, yb, az), wc, inn, [[ua, va], [ub, va], [ub, vb], [ua, vb]]); };
        // the plain wall at its true scale (the plain strip is ~1.4 m high: slices one over another, every other one upside down, so that their edges meet)
        const plain = (ya, yb) => { const n = Math.max(1, Math.ceil((yb - ya) / 1.36 - 0.25)), ue = 0.1 + len / 23, v0 = vAt(PL + 62);
          for (let i = 0; i < n; i++) { const a = ya + (yb - ya) * i / n, b = ya + (yb - ya) * (i + 1) / n, v1 = vAt(PL + 62 - Math.min(60, (b - a) * 44)); q(0, len, a, b, 0.1, ue, i % 2 ? v1 : v0, i % 2 ? v0 : v1); } };
        if (WA[k]) { plain(b0, hh); return; }   // (against a neighbour: plain, what shows over a lower roof)
        let u0 = Math.floor(H(k) * 8);
        if (flats) {   // a block of flats: its two rows in one piece, the upper one again above them; a door in the middle of the wall on the road
          if (k === face && !noDoor) u0 = ((dB - Math.floor((nb - 1) / 2)) % 8 + 8) % 8;
          q(0, len, b0, Math.min(2, fl) * fh, u0 / 8, (u0 + nb) / 8, vAt(ST.flGr + BAY - 0.5), vAt((fl > 1 ? ST.flUp : ST.flGr) + 0.5));
          for (let f = 2; f < fl; f++) q(0, len, f * fh, (f + 1) * fh, u0 / 8, (u0 + nb) / 8, vAt(ST.flUp + BAY - 0.5), vAt(ST.flUp + 0.5));
        } else if (small || low) {   // a shed, a garage: plain walls, one door towards the road where the wall is high and long enough for it
          plain(b0, hh);
          if (k === face && !noDoor && hh >= 2.3 && len >= 1.5) { const m = tD * len, uc = (dB + 0.5) / 8; q(m - 0.657, m + 0.657, 0, 2.265, uc - 29 / AW, uc + 29 / AW, vAt(rowG + BAY - 0.5), vAt(rowG + 28.5), 0.03); }
          return;
        } else {   // a house, floor by floor: the ground floor's windows (the row's four window bays) and, in the middle bay of the wall on the road, its one door; the upper rows; the plain band under the eaves
          const yG = Math.min(hh, fh), vG0 = vAt(rowG + BAY - 0.5), vG1 = vAt(rowG + BAY * (1 - cut) + 0.5), bl = len / nb;
          const wins = (bA, bB) => { for (let b = bA; b < bB;) { const n = Math.min(4, bB - b), a = n < 4 ? 2 + (Math.floor(H(24 + k) * 4) + b) % (5 - n) : 2; q(b * bl, (b + n) * bl, b0, yG, a / 8, (a + n) / 8, vG0, vG1); b += n; } };
          if (k === face && !noDoor) { const jd = Math.floor((nb - 1) / 2); wins(0, jd); q(jd * bl, (jd + 1) * bl, b0, yG, dB / 8, (dB + 1) / 8, vG0, vG1); wins(jd + 1, nb); }
          else wins(0, nb);
          for (let f = 1; f < fl; f++) { const r = FS ? FS[0] : f === 1 ? ST.upB : ST.upA; q(0, len, f * fh, (f + 1) * fh, u0 / 8, (u0 + nb) / 8, vAt(r + BAY - 0.5), vAt(r + 0.5)); }
          if (knee > 0.05) plain(fl * fh, hh);
        }
        // the balconies on the wall that looks at the road, where the house is asked to have them (o.balc): a slab and its railing before each
        // French window (a block of flats: a parapet)
        if (k !== face || !near || fl < 2 || !o.balc) return;
        const bw = Math.min(len / nb - 0.35, 2.5), dp = flats ? 1.1 : 0.9, nx = w[3], nz = w[4], rot = w[2];
        for (let f = 1; f < fl; f++) for (let b = 0; b < nb; b++) {
          const bay = (u0 + b) % 8; if (!(flats ? FLB : TALL).includes(bay)) continue;
          if (!flats && crH(x0 + b, z0 + f, 61) < 0.25) continue;   // (a house: not before every one)
          const t = (b + 0.5) / nb, mx = A[0] + (B[0] - A[0]) * t, mz = A[1] + (B[1] - A[1]) * t, tx = (B[0] - A[0]) / len, tz = (B[1] - A[1]) / len, yb = f * fh - 0.1;
          const C = P(mx + nx * dp / 2, yb, mz + nz * dp / 2); box(g, C[0], C[1], C[2], bw, 0.14, dp, rot, mul(wc, 0.86), [0.74, 0.72, 0.68], true);
          const e = [[mx - tx * bw / 2, mz - tz * bw / 2], [mx - tx * bw / 2 + nx * dp, mz - tz * bw / 2 + nz * dp], [mx + tx * bw / 2 + nx * dp, mz + tz * bw / 2 + nz * dp], [mx + tx * bw / 2, mz + tz * bw / 2]];
          const ci = [x0 + (mx + nx * dp / 2) * c - (mz + nz * dp / 2) * s, y0 + yb + 0.5, z0 + (mx + nx * dp / 2) * s + (mz + nz * dp / 2) * c];
          const vb = flats ? vAt(ST.plain + 60) : vAt(ST.rail + 31.5), vt = flats ? vAt(ST.plain + 30) : vAt(ST.rail + 0.5), col = flats ? mul(wc, 0.9) : [1, 1, 1], gr = flats ? g : o.gf;
          let u = H(7) * 3; if (gr) for (let j = 0; j < 3; j++) { const a = e[j], d = e[j + 1], l = Math.hypot(d[0] - a[0], d[1] - a[1]) / 20.5;
            gr.quadO(P(a[0], yb + 0.14, a[1]), P(d[0], yb + 0.14, d[1]), P(d[0], yb + 1.14, d[1]), P(a[0], yb + 1.14, a[1]), col, ci, [[u, vb], [u + l, vb], [u + l, vt], [u, vt]]); u += l; }
        }
      });
    }
    /* ---- the roof ---- */
    // (its shape: OpenStreetMap's where it has one (o.shape: 1 gabled, 2 hipped, 3 flat, 4 pyramidal), else by the house's own hash; an end of
    // the ridge is hipped only where it stands free)
    const rc = o.roof, rc2 = mul(rc, 0.9 + H(11) * 0.16), osh = o.shape | 0;
    const hipS = !small && L >= W && (osh ? osh === 2 || osh === 4 : flats ? H(12) < 0.5 : o.hip != null ? H(12) < o.hip : H(12) < 0.6 || L / W < 1.3), flat = osh ? osh === 3 : flats && !hipS;
    let roofY = () => hh;
    if (flat) {   // a flat roof behind its parapet, a block for the stairs on a block of flats
      box(g, x0, y0 + hh, z0, L, flats ? 0.5 : 0.36, W, ang, mul(wc, 0.92), [0.66, 0.6, 0.54]);
      if (flats) { const q = P((H(13) - 0.5) * L * 0.4, hh + 0.3, 0); box(g, q[0], q[1], q[2], 3.2, 2.3, 2.6, ang, mul(wc, 0.95), [0.6, 0.56, 0.5], true); }
    } else {
      // (the pitch: the kit's, but the roof never rises more over its walls than a roof of such a house would: a wide low house has a shallow one)
      const ov = small ? 0.2 : lev >= 2 ? 0.55 : 0.22, pitch = Math.min(small ? (o.pitch ? o.pitch * 0.7 : 0.24) : o.pitch ? o.pitch * (0.9 + H(14) * 0.2) : 0.36 + H(14) * 0.1, clamp(hh * 1.3, 2.4, 5.2) / (W / 2));
      // hp: the ends hipped (-x, +x); aE: how far the roof runs at each end (a gable's verge, a hip's eave, nothing against a neighbour, on into
      // the house's own other wing); bS: the eaves at -z and +z (none against a neighbour); rE: the ridge's ends
      const hp = [hipS && !at[0], hipS && !at[1]]; if (L - (hp[0] + hp[1]) * (W / 2) < 0.4) hp[0] = hp[1] = false;
      const aE = [0, 1].map(k => L / 2 + (at[k] === 2 ? ex[k] : at[k] ? 0 : hp[k] ? ov : Math.min(ov, 0.3))), bS = [W / 2 + (at[2] ? 0 : ov), W / 2 + (at[3] ? 0 : ov)];
      const yEs = [hh - (bS[0] - W / 2) * pitch, hh - (bS[1] - W / 2) * pitch], yR = hh + W / 2 * pitch, rE = [hp[0] ? aE[0] - (W / 2 + ov) : aE[0], hp[1] ? aE[1] - (W / 2 + ov) : aE[1]];
      const sq = Math.sqrt(1 + pitch * pitch), v0 = vR(0), uo = H(15) * 7, ri = [x0, y0 + hh - 2, z0], rm = Math.max(0, Math.min(rE[0], rE[1], L / 2 - 0.4));
      roofY = (lx, lz) => Math.min(hh + (W / 2 - Math.abs(lz)) * pitch, hp[0] ? hh + (L / 2 + lx) * pitch : 1e9, hp[1] ? hh + (L / 2 - lx) * pitch : 1e9);
      const E = [P(-aE[0], yEs[0], -bS[0]), P(aE[1], yEs[0], -bS[0]), P(aE[1], yEs[1], bS[1]), P(-aE[0], yEs[1], bS[1])], R0 = P(-rE[0], yR, 0), R1 = P(rE[1], yR, 0);
      g.quadO(E[0], E[1], R1, R0, rc, ri, [[uo + uR(-aE[0]), v0], [uo + uR(aE[1]), v0], [uo + uR(rE[1]), vR(bS[0] * sq)], [uo + uR(-rE[0]), vR(bS[0] * sq)]]);
      g.quadO(E[2], E[3], R0, R1, rc2, ri, [[uo + 9 + uR(aE[1]), v0], [uo + 9 + uR(-aE[0]), v0], [uo + 9 + uR(-rE[0]), vR(bS[1] * sq)], [uo + 9 + uR(rE[1]), vR(bS[1] * sq)]]);
      const v1 = vR((W / 2 + ov) * sq);
      if (hp[0]) g.triO(E[3], E[0], R0, mul(rc, 0.96), ri, null, null, [uo + 3 + uR(bS[1]), v0], [uo + 3 + uR(-bS[0]), v0], [uo + 3, v1]);
      if (hp[1]) g.triO(E[1], E[2], R1, mul(rc2, 1.03), ri, null, null, [uo + 5 + uR(-bS[0]), v0], [uo + 5 + uR(bS[1]), v0], [uo + 5, v1]);
      {   // the gables' walls up to the ridge (not where the roof runs on into the house's own other wing)
        const vb = vAt(PL + 62), vt = vAt(PL + 2), ww = 1.5, wh = 1.18, yw = hh + Math.min(0.6, (yR - hh) * 0.15);
        [-1, 1].forEach((sx, k) => { if (hp[k] || at[k] === 2) return;
          g.triO(P(sx * L / 2, hh, -W / 2), P(sx * L / 2, hh, W / 2), P(sx * L / 2, yR, 0), wc, inn, null, null, [0.1, vb], [0.1 + W / 23, vb], [0.1 + W / 46, vt]);
          // an attic window in a free gable that is high enough for it (the upper row's first bay, smaller, just proud of the wall)
          if (lev >= 2 && near && !at[k] && (W / 2) * (1 - (yw + wh - hh) / (yR - hh)) >= ww / 2 + 0.2) { const lx = sx * (L / 2 + 0.03), ua = 12 / AW, ub = 116 / AW, va = vAt((FS ? FS[0] : ST.upA) + 104), vz = vAt((FS ? FS[0] : ST.upA) + 22);
            g.quadO(P(lx, yw, -ww / 2), P(lx, yw, ww / 2), P(lx, yw + wh, ww / 2), P(lx, yw + wh, -ww / 2), wc, inn, [[ua, va], [ub, va], [ub, vz], [ua, vz]]); } });
      }
      // the ridge and the hips: a lighter line of ridge tiles over each
      const cap = mul(rc, 1.14), cw = 0.17, line = (p, q) => { const dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz) || 1, ox = -dz / l * cw, oz = dx / l * cw;
        g.quadUp([p[0] + ox, p[1] + 0.07, p[2] + oz], [p[0] - ox, p[1] + 0.07, p[2] - oz], [q[0] - ox, q[1] + 0.07, q[2] - oz], [q[0] + ox, q[1] + 0.07, q[2] + oz], [cap, cap, cap, cap]); };
      if ((near || lev >= 1) && !o.far) { if (rE[0] + rE[1] > 0.4) line(R0, R1); if (near) { if (hp[0]) { line(E[0], R0); line(E[3], R0); } if (hp[1]) { line(E[1], R1); line(E[2], R1); } } }
      // the eaves' edge (the rafters' ends) along the foot of the roof
      if (lev >= 2 && near && !small) { const fc = [0.34, 0.26, 0.2], ed = []; if (!at[2]) ed.push([0, 1]); if (!at[3]) ed.push([2, 3]); if (hp[0]) ed.push([3, 0]); if (hp[1]) ed.push([1, 2]);
        for (const [i, j] of ed) g.quadO([E[i][0], E[i][1] - 0.16, E[i][2]], [E[j][0], E[j][1] - 0.16, E[j][2]], E[j], E[i], fc, ri); }
      // the chimneys: on a slope near the ridge, sunk into the roof, a cap on top (a house's wings: on the first only)
      const nc = small || o.part > 0 || o.far ? 0 : L * W > 110 && near ? 2 : H(16) < 0.75 ? 1 : 0;
      for (let k = 0; k < nc; k++) { const lx = (crH(sd[0], sd[1], 70 + k) - 0.5) * 2 * Math.max(0.5, rm * 0.8), lz = (k ? -1 : 1) * W * (0.12 + crH(sd[0], sd[1], 72 + k) * 0.1), yr = roofY(lx, lz), w = 0.55 + crH(sd[0], sd[1], 74 + k) * 0.25, q = P(lx, yr - 0.4, lz);
        box(g, q[0], q[1], q[2], w, 1.5, w, ang, k ? [0.6, 0.34, 0.26] : mul(wc, 0.9), [0.2, 0.18, 0.17], true); if (near) box(g, q[0], q[1] + 1.5, q[2], w + 0.24, 0.12, w + 0.24, ang, [0.52, 0.3, 0.23], null, true); }
      // level 3: solar panels on the slope that looks south (+z), on some roofs (only where the house is asked to have them: o.solar)
      if (lev >= 3 && near && o.solar && !small && !(o.part > 0) && H(17) < 0.3 && rm > 1.6) { const sn = c > 0 ? 1 : -1, bq = sn > 0 ? bS[1] : bS[0], yq = sn > 0 ? yEs[1] : yEs[0], la = (H(18) - 0.5) * rm, lb = la + Math.min(3.4, rm), t0 = 0.3, t1 = 0.78, pt = (lx, t) => P(lx, yq + (yR - yq) * t + 0.06, sn * bq * (1 - t)), pc = [0.1, 0.13, 0.24];
        g.quadUp(pt(la, t0), pt(lb, t0), pt(lb, t1), pt(la, t1), [pc, pc, pc, pc]); }
    }
    /* ---- the steps to the door, where the house's floor stands over the ground before it: a landing, then a flight straight out, down to
       the ground (as far as the ground is free) ---- */
    if (lev >= 2 && near && doorL && !noDoor && nSt > 0) {
      const d = WD[face]; if (o.st) { o.st.steps++; o.st.drop = Math.max(o.st.drop, y0 - o.gH(d.x + d.nx, d.z + d.nz)); }
      for (let i = 0; i < nSt; i++) { const d0 = i ? 0.9 + (i - 1) * 0.28 : 0, dp = i ? 0.28 : 0.9, cx = d.x + d.nx * (d0 + dp / 2), cz = d.z + d.nz * (d0 + dp / 2), yt = y0 - 0.02 - i * 0.19, yg = Math.min(o.gH(cx, cz), yt);
        box(g, cx, yg - 0.25, cz, 1.5, yt - yg + 0.25, dp, wf[2], [0.62, 0.6, 0.56], [0.72, 0.7, 0.66], true); }
    }
    /* ---- level 3, by the road: awnings over the ground floor (only where the house is asked to have them: o.awn) ---- */
    if (lev >= 3 && near === 2 && o.awn && !small && face >= 0 && (flats || H(20) < 0.35)) { const w = WL[face], A = w[0], B = w[1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), nb = Math.max(1, Math.round(len / 2.9)), u0 = ((DOOR[H(5) < 0.5 ? 0 : 1] - Math.floor((nb - 1) / 2)) % 8 + 8) % 8;
      const ac = AWN[Math.floor(H(21) * AWN.length)], tx = (B[0] - A[0]) / len, tz = (B[1] - A[1]) / len, nx = w[3], nz = w[4], yt = Math.min(fh, 3.2) - 0.35;
      for (let b = 0; b < nb; b++) { const bay = (u0 + b) % 8; if (flats ? !SHOP.includes(bay) : DOOR.includes(bay) || crH(x0 + b, z0, 62) < 0.4) continue;
        const t = (b + 0.5) / nb, mx = A[0] + (B[0] - A[0]) * t, mz = A[1] + (B[1] - A[1]) * t, hw = Math.min(len / nb - 0.3, 2.5) / 2, dp = flats ? 1.5 : 1.0;
        const p0 = P(mx - tx * hw, yt, mz - tz * hw), p1 = P(mx + tx * hw, yt, mz + tz * hw), p2 = P(mx + tx * hw + nx * dp, yt - 0.45, mz + tz * hw + nz * dp), p3 = P(mx - tx * hw + nx * dp, yt - 0.45, mz - tz * hw + nz * dp);
        g.quadUp(p0, p1, p2, p3, [ac, ac, mul(ac, 0.9), mul(ac, 0.9)]); g.quadO(p3, p2, [p2[0], p2[1] - 0.22, p2[2]], [p3[0], p3[1] - 0.22, p3[2]], mul(ac, 0.8), inn); } }
    }
    /* ---- level 3, by the road: the yard with its fence and gate, the way to the road, shrubs, a parked car (a house of wings: one yard round
       them all, o.yardOnly on their bounding rectangle); only where the house is asked to have one (o.yard): the map's own fences, drives and
       paths come from the track's data ---- */
    if (lev >= 3 && near === 2 && o.yard && !small && !flats && !o.noYard && o.gH && o.onRoad) {
      {
        // the yard: a margin on each side of the house, each as wide as the road, the neighbours (o.plots) and the map's own walls and hedges
        // (o.barrier) leave it, none where the house stands on the road's edge or wall to wall with the next one (M: the margins at -x, +x, -z,
        // +z; the yard's corners K run -x-z, +x-z, +x+z, -x+z, EM: the margin an edge K[i] -> K[i + 1] stands off by; NF: a side that ends at a
        // wall or hedge of the map, which is its fence)
        const m0 = 2.2 + H(22) * 1.6, M = [0, 0, 0, 0], NF = [false, false, false, false], EM = [2, 1, 3, 0], OUT = [[0, -1], [1, 0], [0, 1], [-1, 0]], WC = [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]];
        const tk = (lx, lz) => { const px = x0 + lx * c - lz * s, pz = z0 + lx * s + lz * c; return o.onRoad(px, pz) || (o.plots ? !o.plots.free(px, pz, o.id) : false) ? 1 : o.barrier && o.barrier(px, pz) ? 2 : 0; };
        const taken = (lx, lz) => tk(lx, lz) === 1;
        const hitL = (a, b) => { const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5)); let nb = 0; for (let k = 0; k <= n; k++) { const t = k / n, h = tk(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); if (h === 1) return 1; if (h) nb++; } return nb * 2 > n ? 2 : nb ? 1 : 0; };
        const cor = () => [[-L / 2 - M[0], -W / 2 - M[2]], [L / 2 + M[1], -W / 2 - M[2]], [L / 2 + M[1], W / 2 + M[3]], [-L / 2 - M[0], W / 2 + M[3]]];
        for (let i = 0; i < 4; i++) { const k = EM[i], a = WC[i], b = WC[(i + 1) % 4], n = OUT[i]; let m = 0;   // (each side by itself: lines before its wall, outwards)
          for (let d = 0.6; d < m0 + 0.59; d += 0.6) { const dd = Math.min(d, m0), h = hitL([a[0] + n[0] * dd, a[1] + n[1] * dd], [b[0] + n[0] * dd, b[1] + n[1] * dd]); if (h === 2) { m = dd; NF[k] = true; break; } if (h) break; m = dd; }
          M[k] = m < 0.9 && !NF[k] ? 0 : m; }
        for (let it = 0; it < 4; it++) { const C = cor(); let any = false;   // (the corners: where one is taken, the narrower of its two sides goes)
          for (let i = 0; i < 4 && !any; i++) { const ka = EM[(i + 3) % 4], kb = EM[i]; if (M[ka] > 0 && M[kb] > 0 && taken(C[i][0], C[i][1])) { M[M[ka] < M[kb] ? ka : kb] = 0; any = true; } }
          if (!any) break; }
        // the yard's ground is one plane through its corners' heights (what stands in it reads the plane: yY)
        const C4 = cor(), hs = C4.map(([lx, lz]) => { const q = P(lx, 0, lz); return o.gH(q[0], q[2]); }), yw = L + M[0] + M[1], yd = W + M[2] + M[3], ycx = (M[1] - M[0]) / 2, ycz = (M[3] - M[2]) / 2;
        const ym = (hs[0] + hs[1] + hs[2] + hs[3]) / 4, gx = (hs[1] + hs[2] - hs[0] - hs[3]) / (2 * yw), gz = (hs[2] + hs[3] - hs[0] - hs[1]) / (2 * yd), yP = (lx, lz) => ym + (lx - ycx) * gx + (lz - ycz) * gz;
        // (level enough: a lawn or paving on that plane; on a slope the ground stays as it is and the fence steps down it)
        const rise = Math.max(...hs) - Math.min(...hs), flatY = rise < 1.4 && Math.max(...hs.map((h, i) => Math.abs(h - yP(C4[i][0], C4[i][1])))) < 0.35;
        const yY = flatY ? yP : (lx, lz) => { const q = P(lx, 0, lz); return o.gH(q[0], q[2]); }, Y = (lx, lz, up) => { const q = P(lx, 0, lz); q[1] = yY(lx, lz) + (up || 0); return q; };
        if (Math.max(...M) > 0 && rise < 6) {
          const lawn = H(23) < 0.5, pc = lawn ? [0.5, 0.58, 0.34] : [0.83, 0.79, 0.69], hedge = H(24) < (o.hedge || 0), iron = !hedge && !!o.gf;
          const sc = hedge ? [0.19, 0.31, 0.17] : iron ? [0.8, 0.77, 0.7] : mul(wc, 0.97), st = hedge ? [0.25, 0.39, 0.21] : [0.86, 0.82, 0.72], sh = hedge ? 1.25 : iron ? 0.45 : 0.95, th = hedge ? 0.6 : iron ? 0.3 : 0.24;
          const PIL = [0.84, 0.8, 0.72], CAP = [0.9, 0.87, 0.8], rvb = vAt(ST.rail + 31.5), rvt = vAt(ST.rail + 0.5), PATH = [0.66, 0.63, 0.57];
          if (o.plots) { const q = P(ycx, 0, ycz); o.plots.add(q[0], q[2], yw, yd, ang, o.id); }
          if (flatY) g.quadUp(...C4.map(([lx, lz]) => Y(lx, lz, 0.06)), [pc, pc, pc, pc]);
          // (a pillar of the fence: plastered stone under a cap; one at a place)
          const pils = [], pillar = (e, rot) => { for (const q of pils) if (Math.abs(q[0] - e[0]) + Math.abs(q[1] - e[1]) < 0.3) return; pils.push(e); const q = Y(e[0], e[1]);
            box(g, q[0], q[1] - 0.3, q[2], 0.42, 1.95, 0.42, rot, PIL, null, true); box(g, q[0], q[1] + 1.65, q[2], 0.56, 0.1, 0.56, rot, CAP, null, true); };
          // (the iron between two points: a railing of the atlas's strip, cut out, on the railings' mesh; ru: where along the strip)
          const ru0 = Math.floor(H(33) * 8) / 8, iro = (a, b, yb, h) => { const p = P(a[0], 0, a[1]), q = P(b[0], 0, b[1]), l = Math.hypot(b[0] - a[0], b[1] - a[1]) / 20.48;
            o.gf.quadO([p[0], yb, p[2]], [q[0], yb, q[2]], [q[0], yb + h, q[2]], [p[0], yb + h, p[2]], [1, 1, 1], inn, [[ru0, rvb], [ru0 + l, rvb], [ru0 + l, rvt], [ru0, rvt]]); };
          // (a run of the fence from a to b (local), in panels of 2.5 m at most, each level (down a slope in steps): the low wall and the iron on it
          // (a post of the strip at each panel's start), or the hedge, or the plastered wall; a pillar at both ends)
          const seg = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) return; const n = Math.ceil(l / 2.56), rot = ang + Math.atan2(b[1] - a[1], b[0] - a[0]);
            for (let k = 0; k < n; k++) { const u = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], v = [a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n];
              const ya = yY(u[0], u[1]), yq = yY(v[0], v[1]), yb = Math.min(ya, yq) - 0.3, yt = Math.max(ya, yq) + sh, q = P((u[0] + v[0]) / 2, 0, (u[1] + v[1]) / 2);
              box(g, q[0], yb, q[2], l / n + 0.02, yt - yb, th, rot, sc, st, true); if (iron) iro(u, v, yt, 1.08); }
            if (iron) { pillar(a, ang); pillar(b, ang); } };
          // the side under the wall that looks at the road has the gate, before the door; the way from the door through the gate out to the road
          const fs = face < 0 ? -1 : [2, 0, 1, 3][face];
          const door = o.door ? [(o.door[0] - x0) * c + (o.door[1] - z0) * s, -(o.door[0] - x0) * s + (o.door[1] - z0) * c] : doorL;
          for (let i = 0; i < 4; i++) { const k = EM[i], a = C4[i], b = C4[(i + 1) % 4], nf = NF[k];
            if (!M[k]) {   // (no margin on this side: the wall stands on the yard's edge; the fence closes what its neighbours' margins leave open beside it)
              for (const [u, v] of [[a, WC[i]], [WC[(i + 1) % 4], b]]) if (Math.hypot(v[0] - u[0], v[1] - u[1]) > 0.5 && !tk((u[0] + v[0]) / 2, (u[1] + v[1]) / 2)) seg(u, v);
              continue; }
            if (i !== fs || !door) { if (!nf) seg(a, b); continue; }
            const l = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, gw = 1.3, td = clamp((door[0] - a[0]) * tx + (door[1] - a[1]) * tz, gw + 0.5, l - gw - 0.5);
            if (l < 2 * gw + 1.4) { if (!nf) seg(a, b); continue; }
            const e0 = [a[0] + tx * (td - gw), a[1] + tz * (td - gw)], e1 = [a[0] + tx * (td + gw), a[1] + tz * (td + gw)], n = OUT[i];
            if (!nf) { seg(a, e0); seg(e1, b);
              if (iron) { pillar(e0, ang); pillar(e1, ang); iro(e0, e1, Math.max(yY(e0[0], e0[1]), yY(e1[0], e1[1])) + 0.1, 1.5); }   // (the gate: iron, shut)
              else for (const e of [e0, e1]) { const q = Y(e[0], e[1]); box(g, q[0], q[1] - 0.3, q[2], 0.42, 1.75, 0.42, ang, mul(wc, 0.93), [0.86, 0.82, 0.72], true); } }
            const gm = [a[0] + tx * td, a[1] + tz * td], hw = gw - 0.2, d0 = [door[0] - n[0] * 0.02, door[1] - n[1] * 0.02];
            { const dl = Math.hypot(gm[0] - d0[0], gm[1] - d0[1]), nq = flatY ? 1 : Math.max(1, Math.ceil(dl / 1.6)); for (let j = 0; j < nq; j++) { const u = [d0[0] + (gm[0] - d0[0]) * j / nq, d0[1] + (gm[1] - d0[1]) * j / nq], v = [d0[0] + (gm[0] - d0[0]) * (j + 1) / nq, d0[1] + (gm[1] - d0[1]) * (j + 1) / nq];
              g.quadUp(Y(u[0] - tx * hw, u[1] - tz * hw, 0.09), Y(u[0] + tx * hw, u[1] + tz * hw, 0.09), Y(v[0] + tx * hw, v[1] + tz * hw, 0.09), Y(v[0] - tx * hw, v[1] - tz * hw, 0.09), [PATH, PATH, PATH, PATH]); } }
            // (outside the gate: over the ground as far as the road's or a street's edge, drawn only when it gets there and through no other house or yard)
            const out = []; let pl = [Y(gm[0] - tx * hw, gm[1] - tz * hw, 0.09), Y(gm[0] + tx * hw, gm[1] + tz * hw, 0.09)], got = false;
            for (let d = 1.2; d < 32 && !got && !o.noDrive; d += 2) { const cx = gm[0] + n[0] * d, cz = gm[1] + n[1] * d, wq = P(cx, 0, cz); got = o.onRoad(wq[0], wq[2]); if (!got && o.plots && !o.plots.free(wq[0], wq[2], o.id)) break;
              const pa = P(cx - tx * hw, 0, cz - tz * hw), pb = P(cx + tx * hw, 0, cz + tz * hw); pa[1] = o.gH(pa[0], pa[2]) + 0.08; pb[1] = o.gH(pb[0], pb[2]) + 0.08; out.push([pl[0], pl[1], pb, pa]); pl = [pa, pb]; }
            if (got) for (const q of out) g.quadUp(q[0], q[1], q[2], q[3], [PATH, PATH, PATH, PATH]);
          }
          // shrubs in the yard's corners (cypresses, oleanders), a car parked beside the house
          const hr = rng(Math.floor(H(26) * 1e9));
          for (let i = 0; i < 4; i++) { const hq = crH(x0 + i, z0, 63); if (hq < 0.45 || !M[EM[i]] || !M[EM[(i + 3) % 4]]) continue; const lx = C4[i][0] * 0.86 + ycx * 0.14, lz = C4[i][1] * 0.86 + ycz * 0.14, q = Y(lx, lz);
            if (hq < 0.72) cone(g, q[0], q[1], q[2], 0.55, 3.2 + hq * 2, 6, [0.16, 0.3, 0.17], [0.22, 0.38, 0.2], 0); else ico(g, q[0], q[1] + 0.7, q[2], 0.95, 0.85, hq < 0.86 ? [0.26, 0.42, 0.2] : [0.5, 0.4, 0.42], hr, 0.12); }
          { const sn = H(28) < 0.5 ? -1 : 1, ms = sn < 0 ? M[2] : M[3]; if (flatY && ms > 2.5 && H(27) < 0.4 && L > 7 && fs !== (sn < 0 ? 0 : 2)) { const q = Y((H(29) - 0.5) * (L - 5), sn * (W / 2 + ms * 0.5), 0.06);
            parkedCar(g, q[0], q[1], q[2], ang + (H(30) < 0.5 ? Math.PI : 0), CARS[Math.floor(H(31) * CARS.length)], Math.floor(H(32) * 4)); } }
        }
      }
    }
    g.dUV = null;
    return (g.P.length - n0 + (o.gf ? o.gf.P.length - f0 : 0)) / 3;
  }

  // the plots of a track: every building's footprint ([x, z, length, width, angle, …]; with ids the building's index sixth: a house of wings one
  // for each wing; a margin round each) and the yards as they are made, on a grid: free(x, z, id) says whether a point lies clear of all but the
  // house id's own
  function plots(list, ids) {
    const C = 24, M = new Map();
    const put = (r) => { const rad = Math.hypot(r.L, r.W) / 2 + 1; for (let a = Math.floor((r.x - rad) / C); a <= Math.floor((r.x + rad) / C); a++) for (let b = Math.floor((r.z - rad) / C); b <= Math.floor((r.z + rad) / C); b++) { const k = a + ',' + b; let l = M.get(k); if (!l) M.set(k, l = []); l.push(r); } };
    list.forEach((b, i) => put({ x: b[0], z: b[1], L: b[2] + 1.2, W: b[3] + 1.2, c: Math.cos(b[4]), s: Math.sin(b[4]), id: ids ? b[5] : i }));
    return { free(x, z, id) { const l = M.get(Math.floor(x / C) + ',' + Math.floor(z / C)); if (!l) return true; for (const r of l) { if (r.id === id) continue; const dx = x - r.x, dz = z - r.z; if (Math.abs(dx * r.c + dz * r.s) < r.L / 2 && Math.abs(dz * r.c - dx * r.s) < r.W / 2) return false; } return true; },
      add(x, z, L, W, ang, id) { put({ x, z, L, W, c: Math.cos(ang), s: Math.sin(ang), id }); } };
  }

  // lines on a grid (the streets and paths between the houses, the map's walls and hedges): list [[half width, [x, z, ...]], ...].
  // on(x, z, m): within m metres of a line's edge (m up to 2); to(x, z): the nearest line within ~60 m { d (to its centre line), x, z, hw } or null
  function lines(list) {
    const C = 24, M = new Map(), S = [], o = { d: 0, x: 0, z: 0, hw: 0 };
    for (const [hw, fl] of list) for (let k = 0; k + 3 < fl.length; k += 2) { const e = [fl[k], fl[k + 1], fl[k + 2], fl[k + 3], hw], pad = hw + 2; S.push(e);
      for (let a = Math.floor((Math.min(e[0], e[2]) - pad) / C); a <= Math.floor((Math.max(e[0], e[2]) + pad) / C); a++) for (let b = Math.floor((Math.min(e[1], e[3]) - pad) / C); b <= Math.floor((Math.max(e[1], e[3]) + pad) / C); b++) { const q = a + ',' + b; let l = M.get(q); if (!l) M.set(q, l = []); l.push(e); } }
    const dist = (e, x, z) => { const vx = e[2] - e[0], vz = e[3] - e[1], t = clamp(((x - e[0]) * vx + (z - e[1]) * vz) / (vx * vx + vz * vz || 1), 0, 1); o.x = e[0] + vx * t; o.z = e[1] + vz * t; return Math.hypot(x - o.x, z - o.z); };
    return { n: S.length,
      on(x, z, m) { const l = M.get(Math.floor(x / C) + ',' + Math.floor(z / C)); if (!l) return false; for (const e of l) if (dist(e, x, z) < e[4] + m) return true; return false; },
      to(x, z) { let bd = 1e9, bx = 0, bz = 0, bw = 0; const i0 = Math.floor(x / C), j0 = Math.floor(z / C);
        for (let i = i0 - 2; i <= i0 + 2; i++) for (let j = j0 - 2; j <= j0 + 2; j++) { const l = M.get(i + ',' + j); if (!l) continue; for (const e of l) { const d = dist(e, x, z); if (d < bd) { bd = d; bx = o.x; bz = o.z; bw = e[4]; } } }
        if (bd > 1e8) return null; o.d = bd; o.x = bx; o.z = bz; o.hw = bw; return o; } };
  }

  /* ---- the kits: which style (atlas), walls, roofs and roof shapes the houses of a country get. Keyed by the country of the track's name
     (»Spa, Belgija«). Generic houses only: no names, signs, logos, artworks or statues (docs/realizem.md, »Pravna ocena po državah«).
       walls  [weight, colour, finish (0 plaster, 1 and 2 the style's own)]      roofs  [weight, colour, 0 | 1 (the style's second roof)]
       opts   hip (the share of hipped roofs), pitch, noDrive                     ravne  the share of flat roofs ---- */
  const PRIVZETO = { style: 'med', walls: [[1, [0.94, 0.92, 0.87], 0]], roofs: [[1, [0.76, 0.43, 0.3], 0]], band: [0.3, 0.32, 0.34], opts: {}, ravne: 0 };
  const KOMPLETI = {
    // the Ardennes: grey rubble stone and whitewash, now and then red brick; steep slate roofs with gables
    'Belgija': { style: 'north', walls: [[1, [0.8, 0.77, 0.72], 1], [1, [0.94, 0.93, 0.89], 0], [1, [0.88, 0.85, 0.8], 1], [1, [0.95, 0.95, 0.93], 2]], roofs: [[1, [0.31, 0.34, 0.4], 0]], opts: { hip: 0.12, pitch: 0.92, noDrive: true } },
    // the Eifel: white and cream plaster, some dark stone and brick; slate and dark tiles
    'Nemčija': { style: 'north', walls: [[5, [0.95, 0.94, 0.9], 0], [2, [0.94, 0.9, 0.78], 0], [2, [0.7, 0.68, 0.66], 1], [1, [0.93, 0.92, 0.9], 2]], roofs: [[3, [0.3, 0.32, 0.37], 0], [2, [0.5, 0.3, 0.25], 1]], opts: { hip: 0.2, pitch: 0.85, noDrive: true } },
    // Tuscany's coast: ochre, pink and cream plaster, a stone house here and there; low terracotta roofs
    'Italija': { style: 'med', walls: [[3, [0.93, 0.8, 0.56], 0], [2, [0.9, 0.68, 0.56], 0], [3, [0.95, 0.9, 0.78], 0], [2, [0.94, 0.84, 0.6], 0], [1, [0.9, 0.84, 0.72], 1]], roofs: [[1, [0.8, 0.45, 0.3], 0]], opts: { hip: 0.6 } },
    // Styria: white plaster, a boarded upper floor on every third house; red-brown tiles, some grey sheet
    'Avstrija': { style: 'alp', walls: [[4, [0.96, 0.95, 0.92], 0], [3, [0.96, 0.95, 0.92], 1], [1, [0.95, 0.9, 0.76], 0], [1, [0.8, 0.78, 0.74], 2]], roofs: [[4, [0.62, 0.33, 0.26], 0], [1, [0.5, 0.52, 0.55], 1]], opts: { hip: 0.15, pitch: 0.62 } },
    // the Făgăraș huts: stone below and boards above, stone, white plaster; steep sheet roofs, some shingles
    'Romunija': { style: 'gora', walls: [[4, [0.86, 0.84, 0.8], 1], [2, [0.78, 0.76, 0.72], 2], [2, [0.95, 0.94, 0.9], 0]], roofs: [[3, [0.58, 0.27, 0.22], 0], [2, [0.52, 0.54, 0.57], 0], [1, [0.3, 0.42, 0.35], 0], [1, [0.42, 0.33, 0.26], 1]], opts: { hip: 0.15, pitch: 0.95 } },
    // the Andes' pass: plain plaster and stone huts under sheet roofs
    'Čile': { style: 'gora', walls: [[3, [0.93, 0.9, 0.82], 0], [2, [0.82, 0.78, 0.72], 2], [2, [0.88, 0.85, 0.8], 1]], roofs: [[3, [0.6, 0.25, 0.2], 0], [2, [0.55, 0.57, 0.58], 0], [1, [0.36, 0.44, 0.38], 0]], opts: { hip: 0.1, pitch: 0.55 } },
    // the Rockies: lodges of stone and boards; green and brown sheet, brown shingles
    'ZDA': { style: 'gora', walls: [[3, [0.9, 0.88, 0.84], 1], [1, [0.8, 0.77, 0.72], 2]], roofs: [[2, [0.26, 0.37, 0.31], 0], [1, [0.45, 0.47, 0.5], 0], [2, [0.4, 0.32, 0.26], 1]], opts: { hip: 0.2, pitch: 0.6 } },
    // the Altai: log houses, some painted boards; sheet roofs
    'Rusija': { style: 'les', walls: [[5, [0.95, 0.93, 0.9], 1], [1, [0.7, 0.8, 0.86], 2], [1, [0.74, 0.83, 0.74], 2], [1, [0.94, 0.92, 0.86], 0]], roofs: [[3, [0.55, 0.57, 0.6], 0], [2, [0.56, 0.27, 0.22], 0], [1, [0.3, 0.42, 0.36], 0]], opts: { hip: 0.1, pitch: 0.7 } },
    // the Serra: painted board houses and white plaster; clay tiles and grey sheet
    'Brazilija': { style: 'les', walls: [[2, [0.95, 0.9, 0.76], 2], [1, [0.72, 0.82, 0.88], 2], [1, [0.76, 0.86, 0.76], 2], [3, [0.96, 0.95, 0.91], 0]], roofs: [[3, [0.76, 0.43, 0.3], 1], [2, [0.58, 0.59, 0.6], 0]], opts: { hip: 0.35, pitch: 0.5 } },
    // the Cape: white walls, a stone one now and then; tiles and thatch
    'Južna Afrika': { style: 'cape', walls: [[5, [0.97, 0.96, 0.93], 0], [2, [0.95, 0.91, 0.8], 0], [1, [0.86, 0.8, 0.7], 1]], roofs: [[2, [0.5, 0.42, 0.36], 0], [2, [0.72, 0.42, 0.3], 0], [2, [0.62, 0.55, 0.42], 1]], opts: { hip: 0.5, pitch: 0.6 } },
    // the island in the river: brick and plaster under flat roofs (no artworks)
    'Kanada': { style: 'north', walls: [[4, [0.95, 0.94, 0.92], 2], [2, [0.86, 0.85, 0.82], 0], [1, [0.8, 0.78, 0.74], 1]], roofs: [[1, [0.3, 0.31, 0.34], 0]], opts: { hip: 0.3, pitch: 0.5 }, ravne: 0.6 },
    // Hunan's mountain: white plaster and grey stone under grey tiles
    'Kitajska': { style: 'north', walls: [[4, [0.95, 0.95, 0.93], 0], [1, [0.76, 0.75, 0.73], 1]], roofs: [[1, [0.44, 0.45, 0.47], 1]], opts: { hip: 0.6, pitch: 0.45 } } };
  // the tracks whose houses the builder makes (real tracks only: a track not here keeps its world as it is) and their level of detail: 1 better
  // shapes and roofs, 2 and the walls from the atlas, 3 and what stands by the road. d2 and d1 (m beyond the road's barrier): the two rings of detail
  const PROGE = { spa: { raven: 3, d2: 34, d1: 64 } };
  const drzava = (T) => { const n = (T && T.def && T.def.name) || '', k = n.lastIndexOf(','); return k < 0 ? '' : n.slice(k + 1).trim(); };
  const komplet = (d) => Object.assign({}, PRIVZETO, KOMPLETI[d], { drzava: KOMPLETI[d] ? d : '' });
  const pick = (list, u) => { let s = 0; for (const e of list) s += e[0]; let t = clamp(u, 0, 0.999999) * s; for (const e of list) { t -= e[0]; if (t < 0) return e; } return list[list.length - 1]; };

  /* ---- the houses of one track. Null where the track is not in PROGE (its builder then makes its houses as before).
     cfg: Chunks, T, near ((x, z) -> { i, dd }), gH (the ground's height), list or rects (the footprints: where the yards may not go), streets,
     barriers, opts (over the kit's), style, d2, d1, d0 (over the track's), size (a chunk's).
     The levels of detail by the distance from the road: to d2 everything (the steps to the doors, and what the track asks for: balconies, yards,
     awnings), to d1 windows, eaves and chimneys, to d0 (300 m) the walls from the atlas and the roof with its ridge, farther the walls and the
     roof alone (a silhouette). stats: the houses and their vertices, rise (the most the ground rises under one footprint, m), moved (small
     buildings set square against the house they ran into), steps (houses with steps to the door) and drop (the highest of those, m). ---- */
  function setup(cfg) {
    const T = cfg.T, P = PROGE[T && T.def && T.def.id]; if (!P) return null;
    const K = komplet(drzava(T)), lev = P.raven, style = cfg.style || K.style, SY = STYLES[style] || STYLES.med, d2 = cfg.d2 || P.d2 || 22, d1 = cfg.d1 || P.d1 || 42, d0 = cfg.d0 || P.d0 || 300;
    const C = new cfg.Chunks(cfg.size || 128, true), F = new cfg.Chunks(cfg.size || 128, true), SR = cfg.streets || null, BR = cfg.barriers || null;
    const pl = plots(cfg.rects || cfg.list || [], !!cfg.rects);
    const onRoad = (x, z) => { const n = cfg.near(x, z); return (n.i >= 0 && n.dd < 0.8) || (SR ? SR.on(x, z, 0.3) : false); };
    const st = { level: lev, drzava: K.drzava, style, vertices: 0, byRoad: 0, houses: 0, wings: 0, far: 0, fin: [0, 0, 0], roofs: [0, 0], rise: 0, moved: 0, steps: 0, drop: 0 };   // (rise: the most the ground rises under one house; moved: small buildings set against a larger one; steps: houses with steps to the door, drop: their highest)
    const barrier = BR ? (x, z) => BR.on(x, z, 0.55) : null, rvb = vAt(ST.rail + 31.5), rvt = vAt(ST.rail + 0.5);
    // (a wall against a neighbour (1) stays so only while that neighbour stands: one the world left out, in the road's way, leaves the wall free)
    const party = (x, z, L, W, ang, at, id) => { const c = Math.cos(ang), s = Math.sin(ang); return at.map((v, k) => { if (v !== 1) return v; let n = 0;
      for (const t of [0.25, 0.5, 0.75]) { const lx = k < 2 ? (k ? 1 : -1) * (L / 2 + 0.4) : (t - 0.5) * L, lz = k < 2 ? (t - 0.5) * W : (k === 3 ? 1 : -1) * (W / 2 + 0.4); if (!pl.free(x + lx * c - lz * s, z + lx * s + lz * c, id)) n++; }
      return n >= 2 ? 1 : 0; }); };
    return { level: lev, stats: st, komplet: K, onRoad,
      // o: x, z, L, W, ang, y0 (without cfg.gH; with it the floor is fitted to the ground under the footprint: a house's 0.15 m over the highest
      // ground, on a plinth down to the lowest, a shed's or a garage's at most 0.6 m into the bank), hh (0: unknown, then by the type), fl (without
      // it by the height), type ('house' | 'small' | 'flats'; a small one that runs into a larger footprint of the list takes its axes and moves
      // out until the walls meet), balc, yard, awn, solar (what the track's data has; unasked a house has none), out (see house()), id (its
      // index in the list), dn (how far beyond the road's barrier it
      // stands) and ri (the nearest sample), as cfg.near gives them (it sees 64 m: a house with none of the two is measured here, from the road's
      // centre); u ([3 numbers of 0..1]: the track's own draws for the wall, its tone and the roof's tone; without them the house's place
      // decides); wall, roof, fin, roofK, band (over the kit's); att ([-x, +x, -z, +z]: a neighbour against that wall), shape (the roof's,
      // OpenStreetMap's), wings ([[x, z, length, width (the footprint's frame), walls (base 3), how far the roof runs on behind each wall (4)],
      // ...]: the first the main one)
      put(o) {
        let dn = o.dn, ri = o.ri; if (!(dn < 1e8) || !(ri >= 0)) { ri = T.nearestIdx(o.x, o.z); dn = Math.hypot(T.px[ri] - o.x, T.pz[ri] - o.z); }
        const near = dn < d2 ? 2 : dn < d1 ? 1 : 0; let dx = T.px[ri] - o.x, dz = T.pz[ri] - o.z, dl = Math.hypot(dx, dz);
        if (SR) { const n = cfg.near(o.x, o.z), dt = n.i >= 0 ? n.dd : 1e9, q = SR.to(o.x, o.z); if (q && q.d - q.hw + 2 < dt) { dx = q.x - o.x; dz = q.z - o.z; dl = Math.hypot(dx, dz); } }   // (a house on a street of its own looks at it)
        st.houses++; if (near === 2) st.byRoad++;
        const hs = (k) => crH(o.x, o.z, 70 + k), small = o.type === 'small', fit = {}, HP = Math.PI / 2;
        // what the map does not say: the walls' height (a house's two floors or so, a shed's or a garage's low walls) and the floors, by the height
        fit.hh = o.hh > 0 ? o.hh : small ? 2.3 + hs(6) * 0.4 : 5.4 + hs(6) * 2.2;
        fit.fl = o.fl || (small ? 1 : Math.max(1, Math.floor((fit.hh + 1) / 2.9)));
        // a small building that runs into a larger one of the list (the map's outlines, fitted as rectangles, overlap a little and stand a few
        // degrees askew of each other): it takes the larger one's axes and moves out until their walls meet; its wall there is a wall against a
        // neighbour (wallTo, as att)
        let wallTo = -1;
        if (small && !o.wings && cfg.list && o.id >= 0) { const co = Math.cos(o.ang), so = Math.sin(o.ang); let bn = null, bd = 0.02, bq = 0;
          cfg.list.forEach((b, i) => { if (i === o.id || b[6] > 1 || b[2] * b[3] < 1.5 * o.L * o.W) return;
            let d = o.ang - b[4]; d -= Math.round(d / HP) * HP; if (Math.abs(d) > 0.35) return;
            const cb = Math.cos(b[4]), sb = Math.sin(b[4]); let dep = 0;
            for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const rx = o.x + sx * o.L / 2 * co - sz * o.W / 2 * so - b[0], rz = o.z + sx * o.L / 2 * so + sz * o.W / 2 * co - b[1];
              dep = Math.max(dep, Math.min(b[2] / 2 - Math.abs(rx * cb + rz * sb), b[3] / 2 - Math.abs(-rx * sb + rz * cb))); }
            if (dep > bd) { bd = dep; bn = b; bq = d; } });
          if (bn) { const b = bn, cb = Math.cos(b[4]), sb = Math.sin(b[4]), fa = o.ang - bq, odd = Math.abs(Math.round((fa - b[4]) / HP)) % 2 === 1, hx = (odd ? o.W : o.L) / 2, hz = (odd ? o.L : o.W) / 2, rx = o.x - b[0], rz = o.z - b[1];
            let lx = rx * cb + rz * sb, lz = -rx * sb + rz * cb, tx, tz; const px = b[2] / 2 + hx - Math.abs(lx), pz = b[3] / 2 + hz - Math.abs(lz);
            if (Math.min(px, pz) < 2.5) {   // (tx, tz: the way to the larger one)
              if (px < pz) { const sg = lx < 0 ? -1 : 1; lx = sg * (b[2] / 2 + hx); tx = -sg * cb; tz = -sg * sb; } else { const sg = lz < 0 ? -1 : 1; lz = sg * (b[3] / 2 + hz); tx = sg * sb; tz = -sg * cb; }
              fit.x = b[0] + lx * cb - lz * sb; fit.z = b[1] + lx * sb + lz * cb; fit.ang = fa;
              const cf = Math.cos(fa), sf = Math.sin(fa), ax = tx * cf + tz * sf, az = -tx * sf + tz * cf; wallTo = Math.abs(ax) > Math.abs(az) ? (ax < 0 ? 0 : 1) : (az < 0 ? 2 : 3); st.moved++; } } }
        // the house's floor: level, just over the ground's high side under its footprint; a plinth (base) carries it down to the low side (a shed, a garage: its plain
        // walls may stand up to 0.6 m in the ground on the high side, so that it does not stand on a high plinth)
        if (cfg.gH) { const fx = fit.x != null ? fit.x : o.x, fz = fit.z != null ? fit.z : o.z, fa = fit.ang != null ? fit.ang : o.ang, ca = Math.cos(fa), sa = Math.sin(fa), nx = Math.max(1, Math.ceil(o.L / 3)), nz = Math.max(1, Math.ceil(o.W / 3)); let lo = 1e9, hi = -1e9;
          for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const lx = (i / nx - 0.5) * o.L, lz = (j / nz - 0.5) * o.W, y = cfg.gH(fx + lx * ca - lz * sa, fz + lx * sa + lz * ca); if (y < lo) lo = y; if (y > hi) hi = y; }
          fit.y0 = small ? Math.max(lo + 0.1, hi - 0.6) : hi + 0.15; fit.base = fit.y0 - lo; if (hi - lo > st.rise) st.rise = hi - lo; }
        // the kit's look: the wall (colour and finish) and the roof (colour and kind); a finish or a roof the style's atlas has not is the plain one
        const u = o.u || [hs(0), hs(1), hs(2)], look = {};
        if (!o.wall) { const w = pick(K.walls, u[0]); look.wall = mul(w[1], 1 + (u[1] - 0.5) * 0.05); look.fin = w[2] && SY.fin && SY.fin[w[2] - 1] ? w[2] : 0; }
        if (!o.roof) { const r = pick(K.roofs, hs(3)); look.roof = mul(r[1], 1 + (u[2] - 0.5) * 0.08); look.roofK = r[2] && SY.roof2 ? 1 : 0; }
        if (o.shape == null && K.ravne > 0 && hs(4) < K.ravne) look.shape = 3;
        const base = Object.assign({ g: C.get(o.x, o.z), gf: F.get(o.x, o.z), lev, near, far: dn > d0, rd: dl > 0.5 ? [dx / dl, dz / dl] : null, gH: cfg.gH, onRoad, plots: pl, barrier, band: K.band, st }, K.opts, cfg.opts, look, o, fit);
        st.fin[base.fin | 0]++; st.roofs[base.roofK ? 1 : 0]++; if (base.far) st.far++;
        if (base.att) base.att = party(base.x, base.z, base.L, base.W, base.ang, base.att, o.id);
        if (wallTo >= 0) { base.att = base.att ? base.att.slice() : [0, 0, 0, 0]; base.att[wallTo] = 1; }
        if (!o.wings) { st.vertices += house(base); return; }
        // a house of wings: each its own walls and roof (a low narrow one a floor lower: an annexe), the door on the wing whose free wall
        // stands farthest out towards the road, one yard round them all
        const c = Math.cos(o.ang), s = Math.sin(o.ang), parts = o.wings.map((w, k) => { const a = w[4], low = k > 0 && Math.min(w[2], w[3]) < 4.2 && base.fl >= 2, fl = low ? base.fl - 1 : base.fl, wx = o.x + w[0] * c - w[1] * s, wz = o.z + w[0] * s + w[1] * c;
          return Object.assign({}, base, { x: wx, z: wz, L: w[2], W: w[3], att: party(wx, wz, w[2], w[3], o.ang, [a % 3, (a / 3 | 0) % 3, (a / 9 | 0) % 3, (a / 27 | 0) % 3], o.id),
            ext: low ? [0, 0, 0, 0] : [w[5], w[6], w[7], w[8]], fl, hh: base.hh * fl / base.fl, seed: [o.x, o.z], part: k, noYard: true, wings: null, doorWall: false, out: {} }); });
        let dk = 0, best = -1e9;
        if (base.rd) parts.forEach((p, k) => { house(Object.assign({}, p, { probe: true })); const d = p.out.door; if (!d) return; const v = (d[0] - o.x) * base.rd[0] + (d[1] - o.z) * base.rd[1]; if (v > best) { best = v; dk = k; } });
        parts.forEach((p, k) => { if (k === dk) p.doorWall = true; st.vertices += house(p); st.wings++; });
        if (!base.yard) return;
        const dw = parts[dk].out, yo = Object.assign({}, base, { yardOnly: true, wings: null, out: {} });
        house(Object.assign({}, yo, { probe: true }));
        if (dw.door && dw.n && yo.out.n && dw.n[0] * yo.out.n[0] + dw.n[1] * yo.out.n[1] > 0.7) yo.door = dw.door;
        st.vertices += house(yo);
      },
      // a run of iron railing on its low wall along the ground from a to b (a fence of the map), in level panels
      fence(ax, az, bx, bz) {
        const l = Math.hypot(bx - ax, bz - az); if (l < 0.6 || !cfg.gH) return; const n = Math.ceil(l / 2.56), rot = Math.atan2(bz - az, bx - ax), g = C.get((ax + bx) / 2, (az + bz) / 2), gf = F.get((ax + bx) / 2, (az + bz) / 2), n0 = g.P.length + gf.P.length;
        g.dUV = WHITE;
        for (let k = 0; k < n; k++) { const ux = ax + (bx - ax) * k / n, uz = az + (bz - az) * k / n, vx = ax + (bx - ax) * (k + 1) / n, vz = az + (bz - az) * (k + 1) / n, ya = cfg.gH(ux, uz), yq = cfg.gH(vx, vz), yb = Math.min(ya, yq) - 0.3, yt = Math.max(ya, yq) + 0.45;
          box(g, (ux + vx) / 2, yb, (uz + vz) / 2, l / n + 0.02, yt - yb, 0.3, rot, [0.8, 0.77, 0.7], [0.86, 0.82, 0.72], true);
          gf.quadO([ux, yt, uz], [vx, yt, vz], [vx, yt + 1.08, vz], [ux, yt + 1.08, uz], [1, 1, 1], [(ux + vx) / 2 + (vz - uz), yt, (uz + vz) / 2 - (vx - ux)], [[0, rvb], [l / n / 20.48, rvb], [l / n / 20.48, rvt], [0, rvt]]); }
        g.dUV = null; st.vertices += (g.P.length + gf.P.length - n0) / 3;
      },
      addTo(group, wrap) { const w = wrap || ((m) => m); C.addTo(group, w(mat(style)), true, true); F.addTo(group, w(matRail(style)), false, true); } };
  }

  /* ---- the ground round the houses (def.okolica; docs/realizem/paket-s.md, »Okolica hiš«): a house does not stand in the bare grass. From the
     map (osm): the car parks as mapped and the unpaved ways; where the map has nothing at a house (gen): a gravel yard by it, a short gravel
     driveway to the nearest way and a narrow strip of trodden ground round its walls. Every shape a field (> 0 inside), cut to the road's band
     and 1.2 m clear of its barriers (near: dd), and each one under the ones before it (def.yard's ways first: yardWorld draws them) so that no
     two lie on each other; drawn on a grid of cells (2 m, the ways and the yards 1 m: the edge where the field crosses 0, as straight as the
     map's) a few cm over the ground: the asphalt with the road's texture, the unpaved ground (gravel, trodden) with the makadam road's texture and
     relief (its bump map) and a darker berm at the edge. Two Chunks, one material each.
     cfg: Chunks, T, near, gH, yard (def.yard: the ways drawn already). Returns { on(x, z, r): on one of them (or on a way of def.yard) within
     r m, addTo(group, tex), stats } or null where the track has none. ---- */
  function okolica(cfg) {
    const T = cfg.T, O = T && T.def && T.def.okolica; if (!O) return null;
    const near = cfg.near, gH = cfg.gH, SURF = [[0.9, 0.9, 0.92], [1.0, 0.99, 0.97], [0.86, 0.77, 0.64]];   // asphalt (its texture); gravel, trodden ground (the makadam's)
    const segD = (x, z, P) => { let b = 1e9; for (let k = 0; k + 1 < P.length; k++) { const a = P[k], c = P[k + 1], ux = c[0] - a[0], uz = c[1] - a[1], l = ux * ux + uz * uz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (z - a[1]) * uz) / l)), dx = x - a[0] - ux * t, dz = z - a[1] - uz * t, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const inP = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const pts = (r, k0) => { const P = []; for (let k = k0; k + 1 < r.length; k += 2) P.push([r[k], r[k + 1]]); return P; };
    const bbP = (P, e) => { const b = [1e9, 1e9, -1e9, -1e9]; for (const p of P) { b[0] = Math.min(b[0], p[0] - e); b[1] = Math.min(b[1], p[1] - e); b[2] = Math.max(b[2], p[0] + e); b[3] = Math.max(b[3], p[1] + e); } return b; };
    const shapes = [];   // { f, bb, col, cell, draw } in the order of priority
    for (const r of cfg.yard || []) if (r[0] <= 1) { const P = pts(r, 1), hw = r[0] ? 1 : 2; shapes.push({ f: (x, z) => hw - segD(x, z, P), bb: bbP(P, hw) }); }
    const ribbon = (P, hw, col) => shapes.push({ f: (x, z) => hw - segD(x, z, P), bb: bbP(P, hw), col, cell: 1, draw: true });
    const poly = (P, col, cell) => shapes.push({ f: (x, z) => (inP(x, z, P) ? 1 : -1) * segD(x, z, P.concat([P[0]])), bb: bbP(P, 0), col, cell, draw: true });
    const n0 = shapes.length;
    // (the map's unpaved ways and footpaths: a ragged edge (a few dm in and out every few m) that fades into worn grass, as a path trodden in a
    // meadow; no darker berm)
    const rag = (x, z) => 0.13 * Math.sin(x * 0.73 + z * 0.21) + 0.09 * Math.sin(z * 1.37 - x * 0.41) + 0.05 * Math.sin(x * 2.3 + z * 1.9);
    for (const r of O.osm || []) if (r[0] === 0) poly(pts(r, 2), SURF[r[1]], 2); else if (r[1] === 0) ribbon(pts(r, 3), r[2], SURF[r[1]]);
      else { const P = pts(r, 3), hw = r[2]; shapes.push({ f: (x, z) => hw - segD(x, z, P) + rag(x, z), bb: bbP(P, hw + 0.3), col: SURF[r[1]], cell: 1, draw: true, soft: true }); }
    const gen = O.gen || [];   // (the driveways, then the yards, then the strips round the walls)
    for (const r of gen) if (r[0] === 1) ribbon(pts(r, 3), r[2], SURF[r[1]]);
    for (const r of gen) if (r[0] === 0) poly(pts(r, 2), SURF[r[1]], 1);
    for (const r of gen) if (r[0] === 2) { const [, sf, w, x, z, L, W, a] = r, c = Math.cos(a), s = Math.sin(a);   // (a ring: w m out from the walls, 0.3 m in under them)
      const sd = (px, pz) => { const u = Math.abs((px - x) * c + (pz - z) * s) - L / 2, v = Math.abs(-(px - x) * s + (pz - z) * c) - W / 2; return Math.hypot(Math.max(u, 0), Math.max(v, 0)) + Math.min(Math.max(u, v), 0); };
      const e = Math.hypot(L, W) / 2 + w; shapes.push({ f: (px, pz) => Math.min(w - sd(px, pz), sd(px, pz) + 0.3), bb: [x - e, z - e, x + e, z + e], col: SURF[sf], cell: 0.5, draw: true }); }
    const ov = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
    const HC = 32, hash = new Map();   // (the shapes by 32 m cells, 2 m over their boxes: on(x, z, r ≤ 2))
    shapes.forEach((sh, k) => { sh.over = shapes.slice(0, k).filter(t => ov(t.bb, sh.bb));
      for (let a = Math.floor((sh.bb[0] - 2) / HC); a <= Math.floor((sh.bb[2] + 2) / HC); a++) for (let b = Math.floor((sh.bb[1] - 2) / HC); b <= Math.floor((sh.bb[3] + 2) / HC); b++) { const q = a + ',' + b; let L = hash.get(q); if (!L) hash.set(q, L = []); L.push(sh); } });
    const clip = (x, z) => { const n = near(x, z); return n.i < 0 ? -1 : n.dd - 1.2; }, WORN = [0.62, 0.7, 0.42];   // (WORN: the tint of the trodden grass at a footpath's edge)
    const CA = new cfg.Chunks(128, true), CM = new cfg.Chunks(128, true), st = { shapes: shapes.length - n0, vertices: 0, area: 0 };
    for (const sh of shapes) { if (!sh.draw) continue;
      const cs = sh.cell, i0 = Math.floor(sh.bb[0] / cs), j0 = Math.floor(sh.bb[1] / cs), ni = Math.ceil(sh.bb[2] / cs) - i0, nj = Math.ceil(sh.bb[3] / cs) - j0, V = new Map();
      const val = (i, j) => { const k = i * 100003 + j; let v = V.get(k); if (v !== undefined) return v; const x = (i0 + i) * cs, z = (j0 + j) * cs; v = sh.f(x, z);
        if (v > -cs * 1.5) { for (const t of sh.over) { const u = t.f(x, z); if (-u < v) v = -u; } v = Math.min(v, clip(x, z)); }
        V.set(k, v); return v; };
      for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
        const cn = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], vs = cn.map(([a, b]) => val(a, b)); if (vs.every(v => v <= 0)) continue;
        const poly2 = [], pv = [];
        for (let k = 0; k < 4; k++) { const a = cn[k], b = cn[(k + 1) % 4], va = vs[k], vb = vs[(k + 1) % 4];
          if (va > 0) { poly2.push([(i0 + a[0]) * cs, (j0 + a[1]) * cs]); pv.push(va); }
          if ((va > 0) !== (vb > 0)) { const t = va / (va - vb); poly2.push([(i0 + a[0] + (b[0] - a[0]) * t) * cs, (j0 + a[1] + (b[1] - a[1]) * t) * cs]); pv.push(0); } }
        if (poly2.length < 3) continue;
        const loose = sh.col !== SURF[0], tl = loose ? 6 : 8, col = sh.col;   // (unpaved: the makadam road's texture and relief, its tile, its loose berm at the edge)
        const g = (loose ? CM : CA).get(poly2[0][0], poly2[0][1]), P3 = poly2.map(([x, z]) => [x, gH(x, z) + 0.09, z]), U = poly2.map(([x, z]) => [x / tl, -z / tl]);
        const C3 = pv.map(v => { if (!loose) return col; if (sh.soft) { const e = 1 - Math.min(1, v / 0.9); return [col[0] + (WORN[0] - col[0]) * e, col[1] + (WORN[1] - col[1]) * e, col[2] + (WORN[2] - col[2]) * e]; }
          const e = 1 - Math.min(1, v / 0.6); return [col[0] * (1 - 0.1 * e), col[1] * (1 - 0.03 * e), col[2] * (1 - 0.22 * e)]; });
        for (let k = 1; k + 1 < P3.length; k++) { g.triUp(P3[0], P3[k], P3[k + 1], [C3[0], C3[k], C3[k + 1]], [U[0], U[k], U[k + 1]]); st.vertices += 3; }
        st.area += vs.every(v => v > 0) ? cs * cs : cs * cs / 2; } }
    st.area = Math.round(st.area);
    return { stats: st, clip,
      on(x, z, r) { const L = hash.get(Math.floor(x / HC) + ',' + Math.floor(z / HC)); if (!L) return false; for (const sh of L) if (x > sh.bb[0] - r && x < sh.bb[2] + r && z > sh.bb[1] - r && z < sh.bb[3] + r && sh.f(x, z) > -r) return true; return false; },
      addTo(group, tex) { CA.addTo(group, new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }), false, true);
        CM.addTo(group, tex.makadam ? new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.045, shininess: 7, specular: 0x1c1813, vertexColors: true })
          : new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }), false, true); } };
  }

  World.stavbe = { atlas, mat, matRail, house, plots, lines, setup, okolica, komplet, drzava, KOMPLETI, PROGE, STYLES, ST };
})();
